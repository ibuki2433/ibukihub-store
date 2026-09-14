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
    res.json({ success: true, members });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update member balance
router.put('/members/:id/balance', requireAdmin, (req, res) => {
  try {
    const { balance } = req.body;
    if (balance === undefined || isNaN(Number(balance))) {
      return res.status(400).json({ error: "กรุณาระบุจำนวนเงินที่ถูกต้อง" });
    }
    const updated = db.setMemberBalance(req.params.id, Number(balance));
    res.json({ success: true, user: updated, message: `อัปเดตยอดเงินของ ${updated.username} เป็น ${updated.balance} ฿ สำเร็จ` });
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

// Get Email (Gmail SMTP) config
router.get('/email-config', requireAdmin, (req, res) => {
  try {
    const settings = db.getSettings() || {};
    const gateway = settings.emailGateway || {
      enabled: false,
      provider: 'gmail',
      user: '',
      pass: '',
      fromName: 'IbukiHub Store',
      host: 'smtp.gmail.com',
      port: 465
    };
    const effectiveUser = process.env.GMAIL_USER || gateway.user || '';
    const effectivePass = process.env.GMAIL_PASS || gateway.pass || '';
    const maskedPass = effectivePass 
      ? (effectivePass.length > 6 
          ? effectivePass.slice(0, 3) + '••••••••' + effectivePass.slice(-3)
          : '••••••••')
      : '';
    res.json({
      success: true,
      config: {
        ...gateway,
        enabled: gateway.enabled || !!(process.env.GMAIL_USER && process.env.GMAIL_PASS),
        user: effectiveUser,
        hasPass: !!effectivePass,
        maskedPass
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Email (Gmail SMTP) config
router.put('/email-config', requireAdmin, (req, res) => {
  try {
    const { enabled, provider, user, pass, fromName, host, port } = req.body;
    const currentSettings = db.getSettings() || {};
    const prevGateway = currentSettings.emailGateway || {};

    const updatedGateway = {
      enabled: !!enabled,
      provider: provider || 'gmail',
      user: user !== undefined ? user.trim() : (prevGateway.user || ''),
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

    res.json({
      success: true,
      message: "บันทึกการตั้งค่า Gmail SMTP เรียบร้อยแล้ว",
      config: {
        ...updatedGateway,
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

export default router;
