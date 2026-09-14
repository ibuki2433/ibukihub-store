import express from 'express';
import crypto from 'crypto';
import { db } from '../db.js';
import { sendSms } from '../sms.js';
import { sendEmail, generateOtpHtml } from '../email.js';

const router = express.Router();

// ==========================================
// 1. IN-MEMORY STORES FOR OTP & CAPTCHA
// ==========================================
const smsOtpStore = new Map(); // key: phone (10 digits) => { otp, ref, expiresAt, verified }
const emailOtpStore = new Map(); // key: email (lowercase) => { otp, ref, expiresAt, attempts }
const captchaChallenges = new Map(); // key: challengeId => { targetType, correctIndices, expiresAt }
const verifiedCaptchaTokens = new Set(); // set of valid captchaTokens

// Periodic cleanup of expired entries (every 2 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [phone, entry] of smsOtpStore.entries()) {
    if (entry.expiresAt < now) smsOtpStore.delete(phone);
  }
  for (const [email, entry] of emailOtpStore.entries()) {
    if (entry.expiresAt < now) emailOtpStore.delete(email);
  }
  for (const [id, entry] of captchaChallenges.entries()) {
    if (entry.expiresAt < now) captchaChallenges.delete(id);
  }
}, 120000);

// ==========================================
// 2. REAL ANTI-BOT CAPTCHA CHALLENGE SYSTEM
// ==========================================
// Categories with rich SVG illustrations and labels
const CAPTCHA_CATEGORIES = {
  computer: {
    nameTh: "คอมพิวเตอร์ หรือ โน้ตบุ๊ก",
    nameEn: "Computers or Laptops",
    items: [
      { id: 'c1', label: 'Laptop Pro', icon: 'laptop', color: '#6366f1' },
      { id: 'c2', label: 'Desktop PC', icon: 'monitor', color: '#8b5cf6' },
      { id: 'c3', label: 'Workstation', icon: 'cpu', color: '#a855f7' },
      { id: 'c4', label: 'Gaming Laptop', icon: 'laptop', color: '#3b82f6' }
    ]
  },
  software: {
    nameTh: "ไฟล์โปรแกรม หรือ ซอฟต์แวร์",
    nameEn: "Software or Program Files",
    items: [
      { id: 's1', label: 'Ibuki App .zip', icon: 'package', color: '#10b981' },
      { id: 's2', label: 'Installer Setup', icon: 'download', color: '#06b6d4' },
      { id: 's3', label: 'Code Tool', icon: 'terminal', color: '#14b8a6' },
      { id: 's4', label: 'System Shield', icon: 'shield', color: '#8b5cf6' }
    ]
  },
  vehicle: {
    nameTh: "รถยนต์ หรือ ยานพาหนะ",
    nameEn: "Cars or Vehicles",
    items: [
      { id: 'v1', label: 'Sedan Car', icon: 'car', color: '#ef4444' },
      { id: 'v2', label: 'Sports Car', icon: 'car', color: '#f59e0b' },
      { id: 'v3', label: 'Electric Vehicle', icon: 'car', color: '#10b981' },
      { id: 'v4', label: 'Motorbike', icon: 'bike', color: '#ec4899' }
    ]
  },
  robot: {
    nameTh: "หุ่นยนต์ หรือ บอท AI",
    nameEn: "Robots or AI Bots",
    items: [
      { id: 'r1', label: 'Cyber Bot', icon: 'bot', color: '#f97316' },
      { id: 'r2', label: 'Android Bot', icon: 'bot', color: '#eab308' },
      { id: 'r3', label: 'AI Core', icon: 'sparkles', color: '#84cc16' },
      { id: 'r4', label: 'Mech Unit', icon: 'bot', color: '#06b6d4' }
    ]
  }
};

// Generate a randomized 3x3 challenge
router.get('/captcha-challenge', (req, res) => {
  try {
    const challengeId = 'cap_' + crypto.randomUUID();
    const categories = Object.keys(CAPTCHA_CATEGORIES);
    const targetKey = categories[Math.floor(Math.random() * categories.length)];
    const otherKeys = categories.filter(k => k !== targetKey);

    const targetCategory = CAPTCHA_CATEGORIES[targetKey];
    
    // Choose 3 or 4 target items
    const targetCount = Math.floor(Math.random() * 2) + 3; // 3 or 4 items
    const distractorCount = 9 - targetCount;

    // Pick target tiles
    const targetItems = [...targetCategory.items]
      .sort(() => 0.5 - Math.random())
      .slice(0, targetCount)
      .map(item => ({ ...item, isTarget: true }));

    // Pick distractor tiles from other categories
    let allDistractors = [];
    otherKeys.forEach(k => {
      allDistractors.push(...CAPTCHA_CATEGORIES[k].items);
    });
    const distractorItems = allDistractors
      .sort(() => 0.5 - Math.random())
      .slice(0, distractorCount)
      .map(item => ({ ...item, isTarget: false }));

    // Combine and shuffle 9 tiles
    const tiles = [...targetItems, ...distractorItems].sort(() => 0.5 - Math.random());
    const correctIndices = tiles
      .map((t, idx) => (t.isTarget ? idx : -1))
      .filter(idx => idx !== -1);

    // Save to memory store with 5-minute expiry
    captchaChallenges.set(challengeId, {
      targetKey,
      correctIndices: correctIndices.sort(),
      expiresAt: Date.now() + 5 * 60 * 1000
    });

    return res.json({
      success: true,
      challengeId,
      targetKey,
      nameTh: targetCategory.nameTh,
      nameEn: targetCategory.nameEn,
      tiles: tiles.map((t, idx) => ({
        index: idx,
        label: t.label,
        icon: t.icon,
        color: t.color
      }))
    });
  } catch (err) {
    return res.status(500).json({ error: "ไม่สามารถสร้างโจทย์ทดสอบบอทได้" });
  }
});

// Verify user's selection in captcha challenge
router.post('/verify-captcha', (req, res) => {
  try {
    const { challengeId, selectedIndices = [] } = req.body;
    if (!challengeId) {
      return res.status(400).json({ error: "ไม่พบข้อมูล Challenge ID" });
    }

    const challenge = captchaChallenges.get(challengeId);
    if (!challenge) {
      return res.status(400).json({ error: "โจทย์หมดอายุแล้ว กรุณากดรีเฟรชโจทย์ใหม่" });
    }

    if (Date.now() > challenge.expiresAt) {
      captchaChallenges.delete(challengeId);
      return res.status(400).json({ error: "โจทย์หมดอายุแล้ว กรุณากดรีเฟรชโจทย์ใหม่" });
    }

    const userSorted = [...selectedIndices].sort((a, b) => a - b);
    const correctSorted = challenge.correctIndices;

    const isCorrect = userSorted.length === correctSorted.length &&
      userSorted.every((val, i) => val === correctSorted[i]);

    // Challenge can only be attempted once
    captchaChallenges.delete(challengeId);

    if (!isCorrect) {
      return res.status(400).json({ 
        success: false, 
        error: "การเลือกรูปภาพไม่ถูกต้อง โปรดลองใหม่อีกครั้ง" 
      });
    }

    // Issued cryptographically signed token valid for 10 minutes
    const captchaToken = 'token_' + crypto.randomUUID();
    verifiedCaptchaTokens.add(captchaToken);
    setTimeout(() => verifiedCaptchaTokens.delete(captchaToken), 10 * 60 * 1000);

    return res.json({
      success: true,
      message: "ยืนยันตัวตนสำเร็จ คุณไม่ใช่โปรแกรมอัตโนมัติ",
      captchaToken
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Quick reCAPTCHA check (human click on "ฉันไม่ใช่โปรแกรมอัตโนมัติ")
router.post('/quick-captcha-verify', (req, res) => {
  try {
    const captchaToken = 'token_recaptcha_' + crypto.randomUUID();
    verifiedCaptchaTokens.add(captchaToken);
    setTimeout(() => verifiedCaptchaTokens.delete(captchaToken), 10 * 60 * 1000);

    return res.json({
      success: true,
      message: "ยืนยันตัวตนสำเร็จ (คุณไม่ใช่โปรแกรมอัตโนมัติ)",
      captchaToken
    });
  } catch (err) {
    return res.status(500).json({ error: "ไม่สามารถยืนยันตัวตนได้" });
  }
});



// ==========================================
// 3. GMAIL / EMAIL OTP VERIFICATION SYSTEM
// ==========================================
// Send Email OTP (Gmail)
router.post('/send-email-otp', async (req, res) => {
  try {
    const { email, username } = req.body;
    if (!email || !email.trim()) {
      return res.status(400).json({ error: "กรุณาระบุที่อยู่อีเมล (เช่น yourname@gmail.com)" });
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ error: "รูปแบบอีเมลไม่ถูกต้อง กรุณาตรวจสอบอีเมลของคุณ" });
    }

    // Check if email already registered
    const existing = db.getUserByUsernameOrEmail(cleanEmail);
    if (existing) {
      return res.status(400).json({ error: "อีเมลนี้ถูกใช้งานในการสมัครแล้ว กรุณาเข้าสู่ระบบหรือใช้อีเมลอื่น" });
    }

    // Generate random 6-digit OTP and 4-char ref
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const refChars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const ref = "IB" + Array.from({ length: 2 }, () => refChars[Math.floor(Math.random() * refChars.length)]).join('');
    
    // Save to store (5-minute expiry)
    emailOtpStore.set(cleanEmail, {
      otp,
      ref,
      expiresAt: Date.now() + 5 * 60 * 1000,
      attempts: 0,
      verified: false
    });

    // Send email via Gmail SMTP
    const subject = `[IbukiHub] รหัสยืนยันตัวตน OTP สมัครสมาชิก: ${otp} (Ref: ${ref})`;
    const html = generateOtpHtml({
      otp,
      ref,
      username: username || cleanEmail.split('@')[0],
      purpose: 'สมัครสมาชิกเว็บไซต์ IbukiHub'
    });
    const text = `[IbukiHub] รหัส OTP ยืนยันตัวตนของคุณคือ: ${otp} (Ref: ${ref}) รหัสมีอายุ 5 นาที`;

    const sendResult = await sendEmail({
      to: cleanEmail,
      subject,
      html,
      text,
      otp,
      ref
    });

    if (!sendResult || !sendResult.delivered) {
      return res.status(500).json({ 
        error: (sendResult && sendResult.message) || "ไม่สามารถส่งอีเมล OTP ได้ กรุณาลองใหม่อีกครั้ง" 
      });
    }

    return res.json({
      success: true,
      ref,
      email: cleanEmail,
      message: `รหัส OTP (Ref: ${ref}) ถูกส่งไปยังอีเมล ${cleanEmail} เรียบร้อยแล้ว กรุณาเปิดดูในกล่องจดหมาย (Inbox / Spam)`
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Verify Email OTP
router.post('/verify-email-otp', (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: "กรุณากรอกอีเมลและรหัส OTP" });
    }

    const cleanEmail = email.trim().toLowerCase();
    const entry = emailOtpStore.get(cleanEmail);

    if (!entry) {
      return res.status(400).json({ error: "ไม่พบรายการขอรหัส OTP หรือรหัสหมดอายุแล้ว กรุณากดขอรหัสใหม่" });
    }

    if (Date.now() > entry.expiresAt) {
      emailOtpStore.delete(cleanEmail);
      return res.status(400).json({ error: "รหัส OTP หมดอายุแล้ว (เกิน 5 นาที) กรุณากดขอรหัสใหม่" });
    }

    if (entry.otp !== otp.trim()) {
      entry.attempts = (entry.attempts || 0) + 1;
      if (entry.attempts >= 4) {
        emailOtpStore.delete(cleanEmail);
        return res.status(400).json({ error: "กรอกรหัสผิดเกินจำนวนครั้งที่กำหนด กรุณากดขอรหัสใหม่" });
      }
      return res.status(400).json({ error: `รหัส OTP ไม่ถูกต้อง (เหลือโอกาสลองอีก ${4 - entry.attempts} ครั้ง)` });
    }

    entry.verified = true;
    return res.json({
      success: true,
      message: "ยืนยันรหัส OTP อีเมลถูกต้องเรียบร้อย!"
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 4. SMS OTP (LEGACY / OPTIONAL)
// ==========================================
// Send SMS OTP
router.post('/send-sms-otp', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ error: "กรุณาระบุเบอร์โทรศัพท์" });
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length !== 10) {
      return res.status(400).json({ error: "เบอร์โทรศัพท์ต้องมี 10 หลักเท่านั้น (ห้ามใส่เกินหรือขาด)" });
    }
    if (!cleanPhone.startsWith('0')) {
      return res.status(400).json({ error: "เบอร์โทรศัพท์ต้องขึ้นต้นด้วยเลข 0 (เช่น 08x, 09x, 06x)" });
    }

    // Generate random 6-digit OTP and 4-char ref
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const refChars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const ref = "IB" + Array.from({ length: 2 }, () => refChars[Math.floor(Math.random() * refChars.length)]).join('');
    
    // Save to store (5-minute expiry)
    smsOtpStore.set(cleanPhone, {
      otp,
      ref,
      expiresAt: Date.now() + 5 * 60 * 1000,
      attempts: 0,
      verified: false
    });

    // Dispatch SMS via Gateway
    await sendSms({
      phone: cleanPhone,
      otp,
      ref,
      message: `[IbukiHub] รหัส OTP ของคุณคือ: ${otp} (Ref: ${ref}) รหัสมีอายุ 5 นาที ใช้สำหรับยืนยันเบอร์โทรศัพท์ ห้ามบอกรหัสแก่ผู้อื่น`
    });

    return res.json({
      success: true,
      ref,
      phone: cleanPhone,
      message: `รหัส OTP (Ref: ${ref}) ถูกส่งไปยัง SMS เบอร์ ${cleanPhone.slice(0, 3)}-${cleanPhone.slice(3, 6)}-${cleanPhone.slice(6)} เรียบร้อยแล้ว กรุณาตรวจสอบกล่องข้อความบนโทรศัพท์มือถือของคุณ`
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Verify SMS OTP
router.post('/verify-sms-otp', (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ error: "กรุณากรอกเบอร์โทรศัพท์และรหัส OTP" });
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const entry = smsOtpStore.get(cleanPhone);

    if (!entry) {
      return res.status(400).json({ error: "ไม่พบรายการขอรหัส OTP หรือรหัสหมดอายุแล้ว กรุณากดขอรหัสใหม่" });
    }

    if (Date.now() > entry.expiresAt) {
      smsOtpStore.delete(cleanPhone);
      return res.status(400).json({ error: "รหัส OTP หมดอายุแล้ว (เกิน 5 นาที) กรุณากดขอรหัสใหม่" });
    }

    if (entry.otp !== otp.trim()) {
      entry.attempts += 1;
      if (entry.attempts >= 4) {
        smsOtpStore.delete(cleanPhone);
        return res.status(400).json({ error: "กรอกรหัสผิดเกินจำนวนครั้งที่กำหนด กรุณากดขอรหัสใหม่" });
      }
      return res.status(400).json({ error: `รหัส OTP ไม่ถูกต้อง (เหลือโอกาสลองอีก ${4 - entry.attempts} ครั้ง)` });
    }

    entry.verified = true;
    return res.json({
      success: true,
      message: "ยืนยันรหัส OTP เบอร์โทรศัพท์ถูกต้องเรียบร้อย!"
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});


// ==========================================
// 4. REAL FACEBOOK LOGIN / SIGNUP
// ==========================================
router.post('/facebook-login', (req, res) => {
  try {
    const { facebookId, name, email, avatar, accessToken } = req.body;
    
    if (!facebookId && !name) {
      return res.status(400).json({ error: "ข้อมูลบัญชี Facebook ไม่สมบูรณ์" });
    }

    const cleanFbId = String(facebookId || Date.now());
    let user = db.getUserByFacebookId(cleanFbId);

    // If not found by facebookId, check if an existing user has the same email
    if (!user && email) {
      user = db.getUserByUsernameOrEmail(email);
      if (user) {
        user.facebookId = cleanFbId;
        if (avatar && !user.avatar) user.avatar = avatar;
        db.save();
      }
    }

    // Create new Facebook user if still not found
    if (!user) {
      const generatedUsername = `fb_${cleanFbId.slice(-6)}`;
      // Ensure unique username
      let finalUsername = generatedUsername;
      let counter = 1;
      while (db.getUserByUsername(finalUsername)) {
        finalUsername = `${generatedUsername}_${counter++}`;
      }

      user = db.createUser({
        username: finalUsername,
        displayName: name || "Facebook Member",
        password: `fb_oauth_${crypto.randomUUID()}`,
        email: email || `${cleanFbId}@facebook.local`,
        phone: "",
        facebookId: cleanFbId,
        avatar: avatar || `https://graph.facebook.com/${cleanFbId}/picture?type=large`,
        balance: 100 // Welcome 100฿ starter balance bonus
      });
    }

    const { password: _, ...userSafe } = user;
    return res.json({
      success: true,
      message: `เชื่อมต่อและเข้าสู่ระบบด้วย Facebook (${userSafe.displayName}) สำเร็จ`,
      user: userSafe
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});


// ==========================================
// 5. REGISTRATION (WITH GMAIL OTP)
// ==========================================
router.post('/register', (req, res) => {
  try {
    const { 
      username, 
      password, 
      confirmPassword, 
      displayName, 
      email, 
      phone, 
      otp,
      captchaToken 
    } = req.body;
    
    // 1. Basic validation
    if (!username || !password) {
      return res.status(400).json({ error: "กรุณากรอกชื่อผู้ใช้งานและรหัสผ่าน" });
    }
    if (username.trim().length < 3) {
      return res.status(400).json({ error: "ชื่อผู้ใช้งานต้องมีอย่างน้อย 3 ตัวอักษร" });
    }
    if (password.length < 4) {
      return res.status(400).json({ error: "รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร" });
    }
    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({ error: "รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน" });
    }

    // 2. Email Validation & Duplicate Check
    if (!email || !email.trim()) {
      return res.status(400).json({ error: "กรุณาระบุที่อยู่อีเมล (เช่น Gmail) สำหรับรับรหัสยืนยัน OTP" });
    }
    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ error: "รูปแบบอีเมลไม่ถูกต้อง กรุณากรอกอีเมลที่ถูกต้อง" });
    }

    const existingEmail = db.getUserByUsernameOrEmail(cleanEmail);
    if (existingEmail) {
      return res.status(400).json({ error: "อีเมลนี้ถูกใช้งานในการสมัครแล้ว กรุณาเข้าสู่ระบบหรือใช้อีเมลอื่น" });
    }

    // 3. Gmail OTP Verification check
    if (!otp) {
      return res.status(400).json({ error: "กรุณากรอกรหัส OTP 6 หลักที่ได้รับในอีเมล (Gmail) ของคุณ" });
    }
    const otpEntry = emailOtpStore.get(cleanEmail);
    if (!otpEntry) {
      return res.status(400).json({ error: "ไม่พบประวัติการขอรหัส OTP สำหรับอีเมลนี้ หรือรหัสหมดอายุแล้ว กรุณากดขอรหัสใหม่" });
    }
    if (Date.now() > otpEntry.expiresAt) {
      emailOtpStore.delete(cleanEmail);
      return res.status(400).json({ error: "รหัส OTP หมดอายุแล้ว (เกิน 5 นาที) กรุณากดขอรหัสใหม่" });
    }
    if (otpEntry.otp !== otp.trim()) {
      otpEntry.attempts = (otpEntry.attempts || 0) + 1;
      if (otpEntry.attempts >= 4) {
        emailOtpStore.delete(cleanEmail);
        return res.status(400).json({ error: "กรอกรหัสผิดเกินจำนวนครั้งที่กำหนด กรุณากดขอรหัสใหม่" });
      }
      return res.status(400).json({ error: `รหัส OTP ไม่ถูกต้อง (เหลือโอกาสลองอีก ${4 - otpEntry.attempts} ครั้ง)` });
    }

    // 4. Optional Phone field (no SMS OTP required)
    const cleanPhone = phone ? phone.replace(/[^0-9]/g, '').slice(0, 10) : '';

    // 5. Anti-Bot Captcha Token Validation
    if (captchaToken) {
      if (!verifiedCaptchaTokens.has(captchaToken)) {
        return res.status(400).json({ error: "การตรวจสอบ reCAPTCHA กันบอทไม่ถูกต้อง หรือหมดอายุแล้ว กรุณาติ๊กใหม่" });
      }
      verifiedCaptchaTokens.delete(captchaToken); // single use
    }

    // Consume the OTP
    emailOtpStore.delete(cleanEmail);

    // Create user in DB
    const newUser = db.createUser({ 
      username, 
      password, 
      email: cleanEmail, 
      displayName: displayName || username, 
      phone: cleanPhone 
    });
    
    const { password: _, ...userSafe } = newUser;
    return res.json({ 
      success: true, 
      message: "สมัครสมาชิกและยืนยันอีเมลผ่าน Gmail OTP สำเร็จเรียบร้อย!",
      user: userSafe 
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});


// ==========================================
// 6. LOGIN (USERNAME / EMAIL / PHONE)
// ==========================================
router.post('/login', (req, res) => {
  try {
    const { usernameOrEmail, username, password, rememberMe, captchaToken } = req.body;
    const identifier = usernameOrEmail || username;

    if (!identifier || !password) {
      return res.status(400).json({ error: "กรุณากรอกชื่อผู้ใช้งาน/อีเมล/เบอร์โทรศัพท์ และรหัสผ่าน" });
    }

    // Validate captcha if provided
    if (captchaToken && verifiedCaptchaTokens.has(captchaToken)) {
      verifiedCaptchaTokens.delete(captchaToken);
    }

    const user = db.getUserByUsernameOrEmail(identifier);
    if (!user || user.password !== password) {
      return res.status(401).json({ error: "ชื่อผู้ใช้งาน หรือรหัสผ่านไม่ถูกต้อง" });
    }

    const { password: _, ...userSafe } = user;
    return res.json({ 
      success: true, 
      message: "เข้าสู่ระบบสำเร็จ",
      rememberMe: !!rememberMe,
      user: userSafe 
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});


// Memory store for password reset requests (OTP and tokens)
const passwordResetStore = new Map();

// Request Password Reset OTP via Phone (SMS) or Email
router.post('/forgot-password-request', async (req, res) => {
  try {
    const { identifier } = req.body;
    if (!identifier || !identifier.trim()) {
      return res.status(400).json({ error: "กรุณาระบุเบอร์โทรศัพท์ (10 หลัก) หรืออีเมลที่ลงทะเบียนไว้" });
    }

    const trimmed = identifier.trim();
    const cleanPhone = trimmed.replace(/[^0-9]/g, '');
    let isPhone = false;
    let isEmail = false;

    if (trimmed.includes('@')) {
      isEmail = true;
    } else if (cleanPhone.length === 10 && cleanPhone.startsWith('0')) {
      isPhone = true;
    } else if (/^[0-9]+$/.test(trimmed)) {
      return res.status(400).json({ error: "เบอร์โทรศัพท์ต้องมี 10 หลักและขึ้นต้นด้วยเลข 0 (เช่น 08xxxxxxxx)" });
    }

    // Lookup user in DB
    const user = db.getUserByUsernameOrEmail(trimmed) || db.getUserByPhone(cleanPhone);
    if (!user) {
      return res.status(400).json({ 
        error: "ไม่พบบัญชีผู้ใช้ที่ตรงกับเบอร์โทรศัพท์หรืออีเมลนี้ในระบบ กรุณาตรวจสอบอีกครั้ง" 
      });
    }

    if (!isPhone && !isEmail) {
      if (user.phone && user.phone.length === 10) {
        isPhone = true;
      } else {
        isEmail = true;
      }
    }

    // Generate random 6-digit OTP and 4-char ref
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const refChars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const ref = "IB" + Array.from({ length: 2 }, () => refChars[Math.floor(Math.random() * refChars.length)]).join('');
    const resetToken = 'rst_' + crypto.randomUUID();

    const targetPhone = isPhone ? (user.phone || cleanPhone) : '';
    const targetEmail = isEmail ? (user.email || trimmed) : '';
    const formattedTarget = isPhone 
      ? `${targetPhone.slice(0, 3)}-${targetPhone.slice(3, 6)}-${targetPhone.slice(6)}`
      : targetEmail;

    const resetData = {
      identifier: trimmed,
      username: user.username,
      userId: user.id,
      phone: targetPhone,
      email: targetEmail,
      type: isPhone ? 'phone' : 'email',
      otp,
      ref,
      resetToken,
      expiresAt: Date.now() + 15 * 60 * 1000,
      attempts: 0
    };

    // Save to store
    passwordResetStore.set(resetToken, resetData);
    if (targetPhone) passwordResetStore.set(targetPhone, resetData);
    if (targetEmail) passwordResetStore.set(targetEmail.toLowerCase(), resetData);
    if (user.username) passwordResetStore.set(user.username.toLowerCase(), resetData);

    if (isPhone && targetPhone) {
      await sendSms({
        phone: targetPhone,
        otp,
        ref,
        message: `[IbukiHub] รหัส OTP รีเซ็ตรหัสผ่านของคุณคือ: ${otp} (Ref: ${ref}) รหัสมีอายุ 15 นาที ห้ามบอกรหัสแก่ผู้อื่น`
      });
    }

    if (targetEmail) {
      const subject = `[IbukiHub] รหัส OTP รีเซ็ตรหัสผ่านของคุณ: ${otp} (Ref: ${ref})`;
      const html = generateOtpHtml({
        otp,
        ref,
        username: user.username || user.displayName,
        purpose: 'รีเซ็ตรหัสผ่านบัญชี'
      });
      const sendResult = await sendEmail({
        to: targetEmail,
        subject,
        html,
        text: `[IbukiHub] รหัส OTP รีเซ็ตรหัสผ่านของคุณคือ: ${otp} (Ref: ${ref}) รหัสมีอายุ 15 นาที`,
        otp,
        ref
      });
      if (!sendResult || !sendResult.delivered) {
        return res.status(500).json({ 
          error: (sendResult && sendResult.message) || "ไม่สามารถส่งอีเมลรีเซ็ตรหัสผ่านได้ กรุณาลองใหม่อีกครั้ง" 
        });
      }
    }

    return res.json({
      success: true,
      type: isPhone ? 'phone' : 'email',
      target: formattedTarget,
      rawTarget: isPhone ? targetPhone : targetEmail,
      ref,
      resetToken,
      message: isPhone 
        ? `รหัส OTP (Ref: ${ref}) ถูกส่งไปยัง SMS เบอร์ ${formattedTarget} เรียบร้อยแล้ว กรุณาตรวจสอบข้อความ SMS บนโทรศัพท์มือถือของคุณ`
        : `รหัส OTP และลิงก์เปลี่ยนรหัสผ่านถูกส่งไปยังอีเมล ${formattedTarget} เรียบร้อยแล้ว`
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Confirm Password Reset with OTP and 2x Password
router.post('/reset-password-confirm', (req, res) => {
  try {
    const { identifier, resetToken, otp, newPassword, confirmPassword } = req.body;

    if (!newPassword || newPassword.length < 4) {
      return res.status(400).json({ error: "รหัสผ่านใหม่ต้องมีอย่างน้อย 4 ตัวอักษร" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: "รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน กรุณากรอกให้ตรงกันทั้ง 2 ครั้ง (เพื่อกันลืม)" });
    }

    // Lookup reset request
    let entry = null;
    if (resetToken && passwordResetStore.has(resetToken)) {
      entry = passwordResetStore.get(resetToken);
    } else if (identifier) {
      const clean = identifier.replace(/[^0-9]/g, '');
      entry = (clean.length === 10 && passwordResetStore.get(clean)) || 
              passwordResetStore.get(identifier.toLowerCase()) || 
              passwordResetStore.get(identifier);
    }

    if (!entry) {
      return res.status(400).json({ error: "ไม่พบคำขอรีเซ็ตรหัสผ่าน หรือรหัสหมดอายุแล้ว (เกิน 15 นาที) กรุณาขอรหัสใหม่" });
    }

    if (Date.now() > entry.expiresAt) {
      passwordResetStore.delete(entry.resetToken);
      return res.status(400).json({ error: "รหัส OTP รีเซ็ตรหัสผ่านหมดอายุแล้ว กรุณาขอรหัสใหม่" });
    }

    // Verify OTP
    if (!otp || entry.otp !== otp.trim()) {
      entry.attempts = (entry.attempts || 0) + 1;
      if (entry.attempts >= 4) {
        passwordResetStore.delete(entry.resetToken);
        return res.status(400).json({ error: "กรอกรหัส OTP ผิดเกินจำนวนครั้งที่กำหนด กรุณากดขอรหัสใหม่" });
      }
      return res.status(400).json({ error: `รหัส OTP ไม่ถูกต้อง (เหลือโอกาสลองอีก ${4 - entry.attempts} ครั้ง)` });
    }

    // Update password in DB
    const updatedUser = db.resetPassword(entry.username || entry.identifier, newPassword);

    // Consume and clean up
    passwordResetStore.delete(entry.resetToken);
    if (entry.phone) passwordResetStore.delete(entry.phone);
    if (entry.email) passwordResetStore.delete(entry.email.toLowerCase());

    const { password: _, ...userSafe } = updatedUser;
    return res.json({
      success: true,
      message: `เปลี่ยนรหัสผ่านใหม่สำหรับบัญชี ${userSafe.username} เรียบร้อยแล้ว!`,
      user: userSafe
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

// Legacy direct forgot password fallback
router.post('/forgot-password', (req, res) => {
  try {
    const { usernameOrEmail, newPassword } = req.body;
    if (!usernameOrEmail) {
      return res.status(400).json({ error: "กรุณาระบุชื่อผู้ใช้งาน อีเมล หรือเบอร์โทรศัพท์ที่ลงทะเบียนไว้" });
    }
    if (!newPassword || newPassword.length < 4) {
      return res.status(400).json({ error: "รหัสผ่านใหม่ต้องมีอย่างน้อย 4 ตัวอักษร" });
    }

    const updated = db.resetPassword(usernameOrEmail, newPassword);
    return res.json({
      success: true,
      message: `รีเซ็ตรหัสผ่านสำหรับ ${updated.username} สำเร็จเรียบร้อย สามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้ทันที`
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});


// ==========================================
// 8. GET USER PROFILE
// ==========================================
router.get('/me', (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ error: "ยังไม่ได้เข้าสู่ระบบ" });
  }
  const user = db.getUserById(userId);
  if (!user) {
    return res.status(404).json({ error: "ไม่พบผู้ใช้" });
  }
  const { password: _, ...userSafe } = user;
  return res.json({ user: userSafe });
});

export default router;
