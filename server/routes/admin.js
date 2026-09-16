import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { db } from '../db.js';
import { sendSms } from '../sms.js';
import { sendEmail, generateOtpHtml } from '../email.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DOWNLOADS_DIR = path.join(__dirname, '..', 'storage', 'downloads');

// Multer storage for uploading new software files (.zip, .rar, .7z, .exe)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(DOWNLOADS_DIR)) {
      fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
    }
    cb(null, DOWNLOADS_DIR);
  },
  filename: (req, file, cb) => {
    // Keep original filename or sanitize
    const cleanName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, cleanName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 1024 * 1024 * 1024 } // Up to 1GB
});

// Disable HTTP caching for all Admin endpoints to guarantee real-time fresh data
router.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

// Middleware to check admin role
const requireAdmin = (req, res, next) => {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ error: "กรุณาเข้าสู่ระบบในฐานะ Admin" });
  }
  const user = db.getUserById(userId);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: "คุณไม่มีสิทธิ์เข้าถึงส่วนผู้ดูแลระบบ (Admin Only)" });
  }
  next();
};

// Admin Stats
router.get('/stats', requireAdmin, (req, res) => {
  try {
    const stats = db.getDashboardStats();
    res.json({ success: true, ...stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add new product
router.post('/products', requireAdmin, (req, res) => {
  try {
    const { name, category, price, originalPrice, badge, version, shortDesc, description, features, systemRequirements, fileName, fileSize, imageUrl, stock } = req.body;
    if (!name || !price) {
      return res.status(400).json({ error: "กรุณาระบุชื่อโปรแกรมและราคา" });
    }

    const newProd = db.addProduct({
      name,
      category: category || "utility",
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : Number(price) * 1.5,
      badge: badge || "⚡ อัปเดตใหม่",
      version: version || "v1.0",
      shortDesc: shortDesc || name,
      description: description || name,
      features: Array.isArray(features) ? features : (features ? features.split('\n').map(f => f.trim()).filter(Boolean) : []),
      systemRequirements: systemRequirements || "Windows 10 / 11 (64-bit)",
      fileName: fileName || "program.zip",
      fileSize: fileSize || "10 MB",
      imageUrl: imageUrl || "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&auto=format&fit=crop&q=80",
      stock: Number(stock) || 50
    });

    res.json({ success: true, product: newProd });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Upload software zip file
router.post('/upload-file', requireAdmin, upload.single('softwareFile'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "ไม่พบไฟล์ที่อัปโหลด" });
    }
    const fileSizeMB = (req.file.size / (1024 * 1024)).toFixed(1) + " MB";
    res.json({
      success: true,
      fileName: req.file.filename,
      fileSize: fileSizeMB,
      message: `อัปโหลดไฟล์ ${req.file.filename} เรียบร้อยแล้ว!`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update product
router.put('/products/:id', requireAdmin, (req, res) => {
  try {
    const updated = db.updateProduct(req.params.id, req.body);
    res.json({ success: true, product: updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete product
router.delete('/products/:id', requireAdmin, (req, res) => {
  try {
    const deleted = db.deleteProduct(req.params.id);
    res.json({ success: true, deleted });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Add License Keys to product
router.post('/products/:id/keys', requireAdmin, (req, res) => {
  try {
    const { keys } = req.body;
    if (!keys || !Array.isArray(keys) || keys.length === 0) {
      return res.status(400).json({ error: "กรุณาระบุคีย์อย่างน้อย 1 รายการ" });
    }

    const currentStock = db.addLicenseKeys(req.params.id, keys);
    res.json({ success: true, currentStock, message: `เพิ่มคีย์สำเร็จ ${keys.length} คีย์ (สต็อกปัจจุบัน: ${currentStock})` });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all members with full credentials and registration provider
router.get('/members', requireAdmin, (req, res) => {
  try {
    const members = db.getAllMembers();
    res.json({ success: true, members, count: members.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Real-time Cloud Gist Sync endpoint
router.post('/sync-cloud', requireAdmin, async (req, res) => {
  try {
    await db.syncFromCloudGist();
    await db.syncToCloudGist();
    const members = db.getAllMembers();
    const stats = db.getDashboardStats();
    res.json({
      success: true,
      message: `ซิงค์ฐานข้อมูลกับ GitHub Cloud สำเร็จแล้ว (มีสมาชิกรวม ${members.length} ท่าน)`,
      members,
      stats
    });
  } catch (err) {
    res.status(500).json({ error: "ซิงค์คลาวด์ไม่สำเร็จ: " + err.message });
  }
});

// Add new member manually by admin
router.post('/members', requireAdmin, (req, res) => {
  try {
    const { username, password, email, displayName, phone, balance, role } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน" });
    }
    const cleanUsername = username.trim();
    if (db.getUserByUsername(cleanUsername)) {
      return res.status(400).json({ error: "ชื่อผู้ใช้นี้มีอยู่ในระบบแล้ว" });
    }
    const newUser = db.createUser({
      username: cleanUsername,
      password: password.trim(),
      email: (email && email.trim()) || `${cleanUsername}@customer.local`,
      displayName: (displayName && displayName.trim()) || cleanUsername,
      phone: (phone && phone.trim()) || "",
      balance: Number(balance) || 0,
      role: role === 'admin' ? 'admin' : 'member'
    });
    res.json({
      success: true,
      member: newUser,
      message: `เพิ่มสมาชิก "${newUser.username}" เรียบร้อยแล้ว (ยอดเงิน: ฿${Number(newUser.balance).toLocaleString()})`
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update member balance (Add, Deduct, Set)
router.put('/members/:id/balance', requireAdmin, (req, res) => {
  try {
    const { balance, mode, amount, note } = req.body;
    const member = db.getUserById(req.params.id);
    if (!member) {
      return res.status(404).json({ error: "ไม่พบข้อมูลสมาชิก" });
    }

    const currentBal = Number(member.balance) || 0;
    let finalBalance = currentBal;
    let actionLabel = "ปรับยอดเงิน";

    if (mode === 'add') {
      const numAmount = Number(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        return res.status(400).json({ error: "กรุณาระบุจำนวนเงินที่ต้องการเพิ่มให้ถูกต้อง (> 0 บาท)" });
      }
      finalBalance = currentBal + numAmount;
      actionLabel = `แอดมินเพิ่มเงิน +฿${numAmount.toLocaleString()}${note ? ' (' + note + ')' : ''}`;
      
      // Record topup history
      db.createTopup({
        userId: member.id,
        username: member.username,
        amount: numAmount,
        channel: actionLabel,
        status: 'SUCCESS'
      });
    } else if (mode === 'deduct') {
      const numAmount = Number(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        return res.status(400).json({ error: "กรุณาระบุจำนวนเงินที่ต้องการลดให้ถูกต้อง (> 0 บาท)" });
      }
      finalBalance = Math.max(0, currentBal - numAmount);
      actionLabel = `แอดมินลดเงิน -฿${numAmount.toLocaleString()}${note ? ' (' + note + ')' : ''}`;
    } else {
      // Direct set
      if (balance === undefined || isNaN(Number(balance))) {
        return res.status(400).json({ error: "กรุณาระบุจำนวนเงินที่ถูกต้อง" });
      }
      finalBalance = Math.max(0, Number(balance));
      actionLabel = `แอดมินกำหนดยอดเงินเป็น ฿${finalBalance.toLocaleString()}`;
    }

    const updated = db.setMemberBalance(req.params.id, finalBalance);

    res.json({
      success: true,
      user: updated,
      message: mode === 'add'
        ? `เพิ่มเงินให้ ${updated.username} สำเร็จ (+฿${Number(amount).toLocaleString()}) ยอดคงเหลือใหม่: ฿${updated.balance.toLocaleString()}`
        : mode === 'deduct'
          ? `ลดเงินของ ${updated.username} สำเร็จ (-฿${Number(amount).toLocaleString()}) ยอดคงเหลือใหม่: ฿${updated.balance.toLocaleString()}`
          : `อัปเดตยอดเงินของ ${updated.username} เป็น ฿${updated.balance.toLocaleString()} สำเร็จ`
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete member
router.delete('/members/:id', requireAdmin, (req, res) => {
  try {
    const target = db.getUserById(req.params.id);
    if (req.params.id === 'usr_admin_ibuki' || req.params.id === 'ibuki' || (target && target.username === 'ibuki')) {
      return res.status(403).json({ error: "ไม่สามารถลบบัญชีหลักของร้านได้ (ไอดีแม่ Ibuki)" });
    }
    const deleted = db.deleteMember(req.params.id);
    res.json({ success: true, message: `ลบสมาชิก ${deleted.username} เรียบร้อยแล้ว` });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get specific member's purchase history in detail
router.get('/members/:id/orders', requireAdmin, (req, res) => {
  try {
    const user = db.getUserById(req.params.id);
    if (!user) return res.status(404).json({ error: "ไม่พบสมาชิก" });
    const orders = db.getOrdersByUser(req.params.id);
    res.json({ 
      success: true, 
      user: { id: user.id, username: user.username, displayName: user.displayName },
      orders 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all orders (enriched with user info)
router.get('/orders', requireAdmin, (req, res) => {
  try {
    const rawOrders = db.getAllOrders();
    const orders = rawOrders.map(o => {
      const user = db.getUserById(o.userId) || db.getUserByUsername(o.username);
      return {
        ...o,
        displayName: o.displayName || user?.displayName || o.username,
        userPhone: o.phone || user?.phone || "-",
        userEmail: o.email || user?.email || "-"
      };
    });
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all topups (enriched with member details & channel)
router.get('/topups', requireAdmin, (req, res) => {
  try {
    const rawTopups = db.getAllTopups();
    const topups = rawTopups.map(t => {
      const user = db.getUserById(t.userId) || db.getUserByUsername(t.username);
      return {
        ...t,
        displayName: t.displayName || user?.displayName || t.username,
        userPhone: t.phone || user?.phone || "-",
        userEmail: t.email || user?.email || "-"
      };
    });
    res.json({ success: true, topups });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update settings
router.put('/settings', requireAdmin, (req, res) => {
  try {
    const updated = db.updateSettings(req.body);
    res.json({ success: true, settings: updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get SMS Gateway config
router.get('/sms-config', requireAdmin, (req, res) => {
  try {
    const settings = db.getSettings() || {};
    const gateway = settings.smsGateway || {
      enabled: false,
      provider: 'thaibulksms',
      apiKey: '',
      apiSecret: '',
      senderName: 'IbukiHub'
    };
    const maskedSecret = gateway.apiSecret 
      ? (gateway.apiSecret.length > 8 
          ? gateway.apiSecret.slice(0, 4) + '••••••••' + gateway.apiSecret.slice(-4)
          : '••••••••')
      : '';
    res.json({
      success: true,
      config: {
        ...gateway,
        hasSecret: !!gateway.apiSecret,
        maskedSecret
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update SMS Gateway config
router.put('/sms-config', requireAdmin, (req, res) => {
  try {
    const { enabled, provider, apiKey, apiSecret, senderName } = req.body;
    const currentSettings = db.getSettings() || {};
    const prevGateway = currentSettings.smsGateway || {};

    const updatedGateway = {
      enabled: !!enabled,
      provider: provider || 'thaibulksms',
      apiKey: apiKey !== undefined ? apiKey.trim() : (prevGateway.apiKey || ''),
      apiSecret: (apiSecret && apiSecret.trim() && !apiSecret.includes('••••')) 
        ? apiSecret.trim() 
        : (prevGateway.apiSecret || ''),
      senderName: senderName ? senderName.trim() : (prevGateway.senderName || 'IbukiHub')
    };

    db.updateSettings({
      ...currentSettings,
      smsGateway: updatedGateway
    });

    res.json({
      success: true,
      message: "บันทึกการตั้งค่า SMS Gateway เรียบร้อยแล้ว",
      config: {
        ...updatedGateway,
        hasSecret: !!updatedGateway.apiSecret
      }
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Test send SMS to mobile phone
router.post('/sms-test', requireAdmin, async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: "กรุณาระบุเบอร์โทรศัพท์ที่ต้องการทดสอบ" });
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length !== 10) return res.status(400).json({ error: "เบอร์โทรศัพท์ต้องมี 10 หลัก" });

    const testOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const testRef = "TEST";
    const result = await sendSms({
      phone: cleanPhone,
      otp: testOtp,
      ref: testRef,
      message: `[IbukiHub Test] ทดสอบระบบส่ง SMS เข้ามือถือสำเร็จ! รหัสทดสอบคือ: ${testOtp} (Ref: ${testRef})`
    });

    res.json({
      success: result.success,
      provider: result.provider || 'simulated',
      message: result.success 
        ? `ส่งข้อความ SMS ทดสอบไปยังเบอร์ ${cleanPhone} เรียบร้อยแล้ว` 
        : (result.error || "ส่งข้อความไม่สำเร็จ"),
      details: result
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Email (Gmail SMTP / Brevo API) config
router.get('/email-config', requireAdmin, (req, res) => {
  try {
    const settings = db.getSettings() || {};
    const gateway = settings.emailGateway || {
      enabled: false,
      provider: 'brevo',
      brevoApiKey: '',
      user: '',
      pass: '',
      fromName: 'IbukiHub Store',
      fromEmail: 'gqkpm2003@gmail.com',
      host: 'smtp.gmail.com',
      port: 465
    };
    const effectiveBrevoKey = process.env.BREVO_API_KEY || gateway.brevoApiKey || '';
    const effectiveUser = process.env.GMAIL_USER || gateway.user || '';
    const effectivePass = process.env.GMAIL_PASS || gateway.pass || '';
    const effectiveFromEmail = gateway.fromEmail || effectiveUser || 'gqkpm2003@gmail.com';

    const maskedBrevoKey = effectiveBrevoKey
      ? (effectiveBrevoKey.length > 10
          ? effectiveBrevoKey.slice(0, 10) + '••••••••' + effectiveBrevoKey.slice(-4)
          : '••••••••')
      : '';

    const maskedPass = effectivePass 
      ? (effectivePass.length > 6 
          ? effectivePass.slice(0, 3) + '••••••••' + effectivePass.slice(-3)
          : '••••••••')
      : '';

    res.json({
      success: true,
      config: {
        ...gateway,
        enabled: gateway.enabled || !!effectiveBrevoKey || !!(process.env.GMAIL_USER && process.env.GMAIL_PASS),
        provider: gateway.provider || (effectiveBrevoKey ? 'brevo' : 'gmail'),
        fromEmail: effectiveFromEmail,
        user: effectiveUser,
        hasBrevoKey: !!effectiveBrevoKey,
        maskedBrevoKey,
        hasPass: !!effectivePass,
        maskedPass
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Email (Gmail SMTP / Brevo API) config
router.put('/email-config', requireAdmin, (req, res) => {
  try {
    const { enabled, provider, brevoApiKey, user, pass, fromName, fromEmail, host, port } = req.body;
    const currentSettings = db.getSettings() || {};
    const prevGateway = currentSettings.emailGateway || {};

    const updatedGateway = {
      enabled: !!enabled,
      provider: provider || prevGateway.provider || 'brevo',
      brevoApiKey: (brevoApiKey && brevoApiKey.trim() && !brevoApiKey.includes('••••'))
        ? brevoApiKey.trim()
        : (prevGateway.brevoApiKey || ''),
      user: user !== undefined ? user.trim() : (prevGateway.user || ''),
      fromEmail: fromEmail !== undefined ? fromEmail.trim() : (prevGateway.fromEmail || 'gqkpm2003@gmail.com'),
      pass: (pass && pass.trim() && !pass.includes('••••')) 
        ? pass.trim().replace(/\s+/g, '') 
        : (prevGateway.pass || ''),
      fromName: fromName ? fromName.trim() : (prevGateway.fromName || 'IbukiHub Store'),
      host: host ? host.trim() : (prevGateway.host || 'smtp.gmail.com'),
      port: port ? Number(port) : (prevGateway.port || 465)
    };

    db.updateSettings({
      ...currentSettings,
      emailGateway: updatedGateway
    });

    const effectiveBrevoKey = process.env.BREVO_API_KEY || updatedGateway.brevoApiKey || '';
    const maskedBrevoKey = effectiveBrevoKey
      ? (effectiveBrevoKey.length > 10
          ? effectiveBrevoKey.slice(0, 10) + '••••••••' + effectiveBrevoKey.slice(-4)
          : '••••••••')
      : '';

    res.json({
      success: true,
      message: "บันทึกการตั้งค่าระบบส่งอีเมลเรียบร้อยแล้ว",
      config: {
        ...updatedGateway,
        hasBrevoKey: !!effectiveBrevoKey,
        maskedBrevoKey,
        hasPass: !!updatedGateway.pass
      }
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Test send Email to Gmail
router.post('/email-test', requireAdmin, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "กรุณาระบุอีเมลที่ต้องการทดสอบ" });
    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) return res.status(400).json({ error: "รูปแบบอีเมลไม่ถูกต้อง" });

    const testOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const testRef = "TEST";
    const result = await sendEmail({
      to: cleanEmail,
      subject: `[IbukiHub Test] ทดสอบระบบส่งอีเมลสำเร็จ! รหัสคือ: ${testOtp} (Ref: ${testRef})`,
      html: generateOtpHtml({
        otp: testOtp,
        ref: testRef,
        username: 'Admin',
        purpose: 'ทดสอบระบบส่งอีเมล Gmail SMTP'
      }),
      text: `[IbukiHub Test] ทดสอบระบบส่งอีเมลสำเร็จ! รหัสคือ: ${testOtp}`,
      otp: testOtp,
      ref: testRef
    });

    res.json({
      success: !!result.delivered,
      delivered: !!result.delivered,
      provider: result.provider || 'simulated',
      message: result.message || (result.delivered ? `ส่งอีเมลทดสอบไปยัง ${cleanEmail} สำเร็จเรียบร้อยแล้ว!` : "ส่งไม่สำเร็จ"),
      details: result
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Download database backup file
router.get('/backup-db', requireAdmin, (req, res) => {
  try {
    const dbPath = path.join(__dirname, '..', 'data', 'store_db.json');
    if (!fs.existsSync(dbPath)) {
      return res.status(404).json({ error: "ไม่พบไฟล์ฐานข้อมูล" });
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    res.download(dbPath, `ibukihub_backup_${timestamp}.json`);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Restore database from JSON upload
router.post('/restore-db', requireAdmin, express.json({ limit: '10mb' }), (req, res) => {
  try {
    const { backupData } = req.body;
    if (!backupData || !backupData.users || !backupData.products) {
      return res.status(400).json({ error: "ไฟล์สำรองไม่ถูกต้อง (ต้องมี users และ products)" });
    }
    const dbPath = path.join(__dirname, '..', 'data', 'store_db.json');
    fs.writeFileSync(dbPath, JSON.stringify(backupData, null, 2), 'utf-8');
    db.init(); // reload into memory
    res.json({ success: true, message: "กู้คืนฐานข้อมูลสำเร็จเรียบร้อยแล้ว!" });
  } catch (err) {
    res.status(500).json({ error: "กู้คืนไม่สำเร็จ: " + err.message });
  }
});

// ========================================================
// PROMO CODES / GIFT CODES ADMIN MANAGEMENT
// ========================================================
router.get('/promo-codes', requireAdmin, (req, res) => {
  try {
    const promoCodes = db.getPromoCodes();
    const history = db.getRedeemHistory();
    res.json({
      success: true,
      promoCodes,
      history,
      totalCodes: promoCodes.length,
      totalRedeemed: history.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/promo-codes', requireAdmin, (req, res) => {
  try {
    const { code, rewardAmount, description, maxUses, expiresAt } = req.body;
    const newCode = db.createPromoCode({
      code,
      rewardAmount,
      description,
      maxUses,
      expiresAt
    });
    res.json({
      success: true,
      promoCode: newCode,
      message: `สร้างโค้ด "${newCode.code}" (มูลค่า ฿${newCode.rewardAmount}) เรียบร้อยแล้ว`
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/promo-codes/:id/toggle', requireAdmin, (req, res) => {
  try {
    const updated = db.togglePromoCode(req.params.id);
    res.json({
      success: true,
      promoCode: updated,
      message: `โค้ด "${updated.code}" ${updated.active ? 'เปิดใช้งาน' : 'ปิดการใช้งาน'} แล้ว`
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/promo-codes/:id', requireAdmin, (req, res) => {
  try {
    const deleted = db.deletePromoCode(req.params.id);
    res.json({
      success: true,
      deleted,
      message: `ลบโค้ด "${deleted.code}" เรียบร้อยแล้ว`
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ================= SLIP VERIFICATION & PROMPTPAY MANAGEMENT =================

// 1. Get all slips / topups for admin review
router.get('/slips', requireAdmin, (req, res) => {
  try {
    const allTopups = db.getAllTopups() || [];
    const slips = allTopups.map(t => {
      const user = db.getUserById(t.userId);
      return {
        ...t,
        userDisplayName: user?.displayName || t.username,
        userEmail: user?.email || '',
        userPhone: user?.phone || ''
      };
    });

    res.json({
      success: true,
      slips
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Approve slip
router.post('/slips/:id/approve', requireAdmin, (req, res) => {
  try {
    const result = db.approveTopup(req.params.id);
    res.json({
      success: true,
      message: `อนุมัติรายการเติมเงิน ${result.topup.id} (฿${result.topup.amount}) เรียบร้อยแล้ว`,
      topup: result.topup,
      newBalance: result.newBalance
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 3. Reject slip
router.post('/slips/:id/reject', requireAdmin, (req, res) => {
  try {
    const { reason } = req.body;
    const result = db.rejectTopup(req.params.id, reason);
    res.json({
      success: true,
      message: `ปฏิเสธรายการเติมเงิน ${result.topup.id} เรียบร้อยแล้ว`,
      topup: result.topup
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 4. Update PromptPay & SlipOK Configuration
router.post('/settings/promptpay', requireAdmin, (req, res) => {
  try {
    const { number, accountName, bankName, slipokApiKey, slipokBranchId, easyslipApiKey, autoApprove, enabled, customQrUrl } = req.body;
    const settings = db.getSettings();
    if (!settings.promptpay) settings.promptpay = {};

    if (number !== undefined) settings.promptpay.number = String(number).trim();
    if (accountName !== undefined) settings.promptpay.accountName = String(accountName).trim();
    if (bankName !== undefined) settings.promptpay.bankName = String(bankName).trim();
    if (slipokApiKey !== undefined) settings.promptpay.slipokApiKey = String(slipokApiKey).trim();
    if (slipokBranchId !== undefined) settings.promptpay.slipokBranchId = String(slipokBranchId).trim();
    if (easyslipApiKey !== undefined) settings.promptpay.easyslipApiKey = String(easyslipApiKey).trim();
    if (autoApprove !== undefined) settings.promptpay.autoApprove = Boolean(autoApprove);
    if (enabled !== undefined) settings.promptpay.enabled = Boolean(enabled);
    if (customQrUrl !== undefined) settings.promptpay.customQrUrl = customQrUrl;

    db.save();
    res.json({
      success: true,
      message: "บันทึกการตั้งค่าพร้อมเพย์และระบบตรวจสลิปเรียบร้อยแล้ว",
      promptpay: settings.promptpay
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Upload Custom QR Code Image (e.g. from K PLUS app)
const qrStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    cb(null, `bank_qr_${Date.now()}${ext}`);
  }
});
const uploadQr = multer({
  storage: qrStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น (.jpg, .png, .jpeg, .webp)'));
  }
});

router.post('/upload-qr', requireAdmin, uploadQr.single('qrImage'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'กรุณาเลือกไฟล์ภาพ QR Code' });
    }
    const qrUrl = `/uploads/${req.file.filename}`;
    const settings = db.getSettings();
    if (!settings.promptpay) settings.promptpay = {};
    settings.promptpay.customQrUrl = qrUrl;
    db.save();

    res.json({
      success: true,
      message: 'อัปโหลดรูปภาพ QR Code สำเร็จแล้ว',
      qrUrl,
      promptpay: settings.promptpay
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
