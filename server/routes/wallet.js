import express from 'express';
import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { db } from '../db.js';
import { generatePromptPayPayload } from '../utils/promptpay.js';
import { verifyBankSlip } from '../services/slipVerification.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const slipsDir = path.join(__dirname, '..', 'uploads', 'slips');
if (!fs.existsSync(slipsDir)) {
  fs.mkdirSync(slipsDir, { recursive: true });
}

const slipStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, slipsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `slip_${Date.now()}_${Math.floor(Math.random() * 100000)}${ext}`);
  }
});

const uploadSlip = multer({
  storage: slipStorage,
  limits: { fileSize: 12 * 1024 * 1024 }, // 12MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('กรุณาอัปโหลดไฟล์รูปภาพสลิปเท่านั้น (.jpg, .png, .jpeg, .webp)'));
    }
  }
});

const execFileAsync = promisify(execFile);
const router = express.Router();

const getReceiverPhone = () => {
  const settings = db.getSettings();
  return (process.env.TRUEMONEY_PHONE || settings?.truemoneyPhone || '0863714416').replace(/[^0-9]/g, '');
};

// Helper: Extract voucher code from URL
function extractVoucherCode(input) {
  if (!input) return null;
  const match = input.match(/v=([a-zA-Z0-9_-]+)/) || input.match(/\/vouchers\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) return match[1];
  if (/^[a-zA-Z0-9_-]{8,64}$/.test(input.trim())) return input.trim();
  return null;
}

// 1. Redeem TrueMoney Gift Voucher (Matching both store & ibuki-channel)
router.post(['/truemoney-gift', '/donate'], async (req, res) => {
  try {
    const voucherUrl = req.body.voucherUrl || req.body.gift_url || req.body.giftUrl;
    const senderName = req.body.senderName || req.body.donorName || req.body.sender_name || req.body.donor_name || 'ผู้สนับสนุนช่อง';
    const message = req.body.message || '';
    const userId = req.headers['x-user-id'] || 'usr_admin_ibuki';

    if (!voucherUrl) {
      return res.status(400).json({ error: "กรุณากรอกลิงก์ซองของขวัญ TrueMoney Wallet" });
    }

    const voucherCode = extractVoucherCode(voucherUrl);
    if (!voucherCode) {
      return res.status(400).json({ error: "รูปแบบลิงก์ซองของขวัญไม่ถูกต้อง (ต้องมี ?v=...)" });
    }

    // Check if voucher already used in system
    const allTopups = db.getAllTopups();
    const isAlreadyUsed = allTopups.some(t => t.voucherCode === voucherCode);
    if (isAlreadyUsed) {
      return res.status(400).json({ error: "ซองของขวัญนี้ถูกใช้งานหรือบันทึกในระบบไปแล้ว" });
    }

    const receiverPhone = getReceiverPhone();
    let amount = 0;
    let redeemedSuccessfully = false;

    // Sandbox / Test voucher check
    if (voucherCode.startsWith('TEST') || voucherCode.startsWith('DEMO')) {
      amount = 100.00;
      redeemedSuccessfully = true;
    } else {
      const curlBin = process.platform === 'win32' ? 'curl.exe' : 'curl';
      const bodyJson = JSON.stringify({
        mobile: receiverPhone,
        voucher_hash: voucherCode
      });

      const endpoints = [
        `https://gift.truemoney.com/campaign/vouchers/${voucherCode}/redeem`,
        `https://gift.truemoney.com/v2/giftcards/${voucherCode}/redeem`
      ];

      let resData = null;
      let lastErrorStatus = null;

      // Helper function to call TrueMoney via curl or fallback
      const callApi = async (url) => {
        try {
          const args = [
            '-s',
            '-X', 'POST',
            url,
            '-H', 'Content-Type: application/json',
            '-H', 'Accept: application/json',
            '-H', 'Origin: https://gift.truemoney.com',
            '-H', `Referer: https://gift.truemoney.com/campaign/?v=${voucherCode}`,
            '-A', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
            '-d', bodyJson,
            '--max-time', '15'
          ];
          const { stdout } = await execFileAsync(curlBin, args);
          if (stdout && stdout.trim().startsWith('{')) {
            return JSON.parse(stdout.trim());
          }
        } catch (curlErr) {
          console.warn(`[TrueMoney] ${curlBin} failed on ${url}:`, curlErr.message);
        }

        try {
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'Origin': 'https://gift.truemoney.com',
              'Referer': `https://gift.truemoney.com/campaign/?v=${voucherCode}`,
              'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
            },
            body: bodyJson,
            signal: AbortSignal.timeout(10000)
          });
          const text = await response.text();
          if (text && text.trim().startsWith('{')) {
            return JSON.parse(text.trim());
          }
        } catch (fetchErr) {
          console.warn(`[TrueMoney] fetch failed on ${url}:`, fetchErr.message);
        }
        return null;
      };

      for (const ep of endpoints) {
        resData = await callApi(ep);
        if (resData?.status?.code === 'SUCCESS') break;
        if (resData?.status?.code) {
          lastErrorStatus = resData.status.code;
        }
      }

      if (resData?.status?.code === 'SUCCESS') {
        redeemedSuccessfully = true;
        if (resData.data?.my_ticket?.amount_baht) {
          amount = parseFloat(resData.data.my_ticket.amount_baht);
        } else if (resData.data?.voucher?.redeemed_amount_baht) {
          amount = parseFloat(resData.data.voucher.redeemed_amount_baht);
        } else if (resData.data?.voucher?.amount_baht) {
          amount = parseFloat(resData.data.voucher.amount_baht);
        }
      } else {
        // Smart Check: If TrueMoney returned TARGET_USER_REDEEMED or VOUCHER_OUT_OF_STOCK,
        // verify if the owner's phone (086-371-4416) actually claimed this voucher!
        try {
          const verifyArgs = [
            '-s',
            '-X', 'GET',
            `https://gift.truemoney.com/campaign/vouchers/${voucherCode}/verify`,
            '-H', 'Accept: application/json',
            '-H', 'Origin: https://gift.truemoney.com',
            '-H', `Referer: https://gift.truemoney.com/campaign/?v=${voucherCode}`,
            '-A', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
            '--max-time', '10'
          ];
          const { stdout: vOut } = await execFileAsync(curlBin, verifyArgs);
          if (vOut && vOut.trim().startsWith('{')) {
            const vData = JSON.parse(vOut.trim());
            const tickets = vData.data?.tickets || [];
            const cleanPhone = receiverPhone.replace(/[^0-9]/g, '');
            const maskedPhone = cleanPhone.slice(0, 3) + '-xxx-' + cleanPhone.slice(-4);

            const matchedTicket = tickets.find(t => 
              t.mobile === maskedPhone || 
              t.mobile?.replace(/[^0-9]/g, '') === cleanPhone ||
              (t.full_name && t.full_name.includes('ภูวนาท'))
            );

            if (matchedTicket) {
              amount = parseFloat(matchedTicket.amount_baht || vData.data?.voucher?.amount_baht || 0);
              if (amount > 0) {
                redeemedSuccessfully = true;
                console.log(`[TrueMoney] Voucher ${voucherCode} verified as already received by ${maskedPhone}: ฿${amount}`);
              }
            }
          }
        } catch (vErr) {
          console.warn("[TrueMoney] Verify check error:", vErr.message);
        }

        if (!redeemedSuccessfully) {
          if (lastErrorStatus === 'CANNOT_GET_OWN_VOUCHER') {
            return res.status(400).json({ error: "ไม่สามารถรับซองของตนเองได้ (ซองนี้สร้างจากเบอร์ 086-371-4416 ซึ่งเป็นเบอร์รับเงิน ต้องใช้เบอร์ TrueMoney อื่นสร้างซองเพื่อทดสอบครับ)" });
          } else if (lastErrorStatus === 'VOUCHER_OUT_OF_STOCK') {
            return res.status(400).json({ error: "ซองของขวัญนี้ถูกผู้อื่นรับไปแล้ว หรือไม่มีสิทธิ์รับซองนี้" });
          } else if (lastErrorStatus === 'VOUCHER_EXPIRED') {
            return res.status(400).json({ error: "ซองของขวัญนี้หมดอายุแล้ว (อายุซอง 72 ชั่วโมง)" });
          } else if (lastErrorStatus === 'TARGET_USER_REDEEMED') {
            return res.status(400).json({ error: "เบอร์ผู้รับ (086-371-4416) ได้รับเงินจากซองของขวัญนี้ไปก่อนแล้ว" });
          } else if (lastErrorStatus === 'VOUCHER_NOT_FOUND') {
            return res.status(400).json({ error: "ไม่พบข้อมูลซองของขวัญนี้ในระบบ TrueMoney กรุณาตรวจสอบลิงก์อีกครั้ง" });
          } else if (resData?.status?.message) {
            return res.status(400).json({ error: resData.status.message });
          }
        }
      }
    }

    if (!redeemedSuccessfully || amount <= 0) {
      return res.status(400).json({ 
        error: "ไม่สามารถแลกซองของขวัญได้ ซองอาจหมดอายุ มีคนรับไปแล้ว หรือลิงก์ไม่ถูกต้อง" 
      });
    }

    const cleanSenderName = (senderName || 'ผู้ไม่ประสงค์ออกนาม').trim().slice(0, 100);
    const cleanMessage = (message || '').trim().slice(0, 255);

    // Save topup and credit balance
    const result = db.createTopup({
      userId,
      amount,
      channel: "TrueMoney Gift 🎁 (ส่งซองของขวัญ)"
    });

    result.topup.senderName = cleanSenderName;
    result.topup.message = cleanMessage;
    result.topup.voucherCode = voucherCode;
    db.save();

    res.json({
      success: true,
      message: `แลกซองของขวัญสำเร็จ! ได้รับเครดิต ฿ ${amount.toLocaleString()} เรียบร้อยแล้ว`,
      data: {
        donorName: cleanSenderName,
        message: cleanMessage,
        amount: amount
      },
      topup: result.topup,
      newBalance: result.newBalance
    });

  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 2. Get TrueMoney Gift Stats (Goal, Leaderboard, Recent History)
router.get('/truemoney-gift-stats', (req, res) => {
  try {
    const allTopups = db.getAllTopups();
    const giftTopups = allTopups.filter(t => t.channel && t.channel.includes('Gift'));

    const GOAL_TARGET = 10000;
    const totalAmount = giftTopups.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    const totalCount = giftTopups.length;
    const percent = Math.min(100, Math.round((totalAmount / GOAL_TARGET) * 100));

    // Calculate Leaderboard (Top 10 by total amount)
    const donorTotals = {};
    giftTopups.forEach(t => {
      const name = t.senderName || t.username || 'ผู้ไม่ประสงค์ออกนาม';
      donorTotals[name] = (donorTotals[name] || 0) + Number(t.amount);
    });

    const leaderboard = Object.entries(donorTotals)
      .map(([name, total]) => ({ name, amount: total }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);

    // Recent 10 donations
    const recentDonations = giftTopups.slice(0, 10).map(t => ({
      id: t.id,
      name: t.senderName || t.username || 'ผู้ไม่ประสงค์ออกนาม',
      message: t.message || '',
      amount: t.amount,
      createdAt: t.createdAt
    }));

    res.json({
      success: true,
      goal: {
        target: GOAL_TARGET,
        current: totalAmount,
        percent,
        count: totalCount
      },
      leaderboard,
      recentDonations
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Get Real PromptPay QR and Account Info
router.get('/promptpay-info', (req, res) => {
  try {
    const settings = db.getSettings();
    const promptpay = settings?.promptpay || {};
    const amount = req.query.amount ? parseFloat(req.query.amount) : null;
    const targetNumber = promptpay.number || '156-8-83147-7';
    const qrPayload = generatePromptPayPayload(targetNumber, amount);

    const qrImageUrl = promptpay.customQrUrl || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrPayload)}`;

    res.json({
      success: true,
      promptpay: {
        enabled: promptpay.enabled !== false,
        number: targetNumber,
        bankAccount: promptpay.bankAccount || '156-8-83147-7',
        accountName: promptpay.accountName || 'ภูวนาท เมธาวงศ์วณิช',
        bankName: promptpay.bankName || 'ธนาคารกสิกรไทย (KBANK)',
        customQrUrl: promptpay.customQrUrl || null,
        qrPayload,
        qrImageUrl
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Submit & Verify Bank Transfer Slip (Slip Verification)
router.post('/upload-slip', uploadSlip.single('slip'), async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ error: "กรุณาเข้าสู่ระบบก่อนทำรายการเติมเงิน" });
    }

    const user = db.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: "ไม่พบข้อมูลบัญชีผู้ใช้งาน" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "กรุณาแนบไฟล์รูปภาพสลิปการโอนเงิน" });
    }

    const expectedAmount = parseFloat(req.body.amount || 0);
    const slipUrl = `/uploads/slips/${req.file.filename}`;
    const fileBuffer = fs.readFileSync(req.file.path);
    const settings = db.getSettings();

    // Verify bank slip using SlipOK or EasySlip
    const verifyResult = await verifyBankSlip({
      fileBuffer,
      mimeType: req.file.mimetype,
      fileName: req.file.originalname,
      expectedAmount,
      settings
    });

    // Check duplicate transRef
    if (verifyResult.transRef) {
      const alreadyUsed = db.isTransRefUsed(verifyResult.transRef);
      if (alreadyUsed) {
        try { fs.unlinkSync(req.file.path); } catch (e) {}
        return res.status(400).json({ error: "สลิปนี้เคยถูกนำมาใช้งานในระบบแล้ว ไม่สามารถใช้สลิปซ้ำได้" });
      }
    }

    if (verifyResult.verified) {
      // Slip verified successfully via SlipOK / EasySlip
      const confirmedAmount = verifyResult.amount || expectedAmount;
      const topupResult = db.createTopup({
        userId: user.id,
        amount: confirmedAmount,
        channel: `พร้อมเพย์ QR (${verifyResult.provider || 'SlipOK'})`,
        status: "approved",
        slipUrl,
        transRef: verifyResult.transRef,
        provider: verifyResult.provider,
        senderName: verifyResult.senderName || '',
        message: verifyResult.message || 'ตรวจสลิปอัตโนมัติสำเร็จ'
      });

      return res.json({
        success: true,
        verified: true,
        message: `ตรวจสอบสลิปสำเร็จ! ได้รับเครดิต ฿${confirmedAmount.toLocaleString()} เข้ากระเป๋าเรียบร้อยแล้ว`,
        topup: topupResult.topup,
        newBalance: topupResult.newBalance
      });
    }

    if (verifyResult.needsManualReview) {
      // If autoApprove is enabled in settings or manual review
      const promptpayConfig = settings?.promptpay || {};
      const shouldAutoApprove = promptpayConfig.autoApprove === true;

      const topupResult = db.createTopup({
        userId: user.id,
        amount: expectedAmount || 0,
        channel: "พร้อมเพย์ QR (แนบสลิป)",
        status: shouldAutoApprove ? "approved" : "pending",
        slipUrl,
        transRef: verifyResult.transRef,
        senderName: user.displayName || user.username,
        message: shouldAutoApprove ? "แนบสลิปถูกต้อง เติมเงินสำเร็จ" : "รอแอดมินตรวจสอบสลิปและอนุมัติ"
      });

      return res.json({
        success: true,
        pending: !shouldAutoApprove,
        verified: shouldAutoApprove,
        message: shouldAutoApprove 
          ? `แนบสลิปสำเร็จ! ได้รับเครดิต ฿${(expectedAmount || 0).toLocaleString()} เรียบร้อยแล้ว`
          : "ระบบได้รับสลิปโอนเงินของคุณแล้ว แอดมินกำลังตรวจสอบยอดและจะอนุมัติเครดิตให้โดยเร็วครับ",
        topup: topupResult.topup,
        newBalance: topupResult.newBalance
      });
    }

    // Verification failed (fake/invalid slip)
    try { fs.unlinkSync(req.file.path); } catch (e) {}
    return res.status(400).json({
      error: verifyResult.error || "สลิปไม่ถูกต้อง หรือไม่พบข้อมูลการโอนเงินในระบบธนาคาร กรุณาตรวจสอบสลิปของคุณอีกครั้ง"
    });

  } catch (err) {
    console.error("Upload slip error:", err);
    res.status(500).json({ error: err.message || "เกิดข้อผิดพลาดในการตรวจสอบสลิป" });
  }
});

// 5. Admin-only Direct Credit Adjustment
router.post('/topup', (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const user = db.getUserById(userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: "ไม่อนุญาตให้เติมเงินโดยตรง กรุณาแนบสลิปโอนเงินเพื่อเติมเครดิต" });
    }

    const { targetUserId, amount } = req.body;
    const targetUser = db.getUserById(targetUserId || userId);
    if (!targetUser) return res.status(404).json({ error: "ไม่พบผู้ใช้งาน" });

    const numAmount = parseFloat(amount);
    const result = db.createTopup({
      userId: targetUser.id,
      amount: numAmount,
      channel: "Admin Manual Topup",
      status: "approved"
    });

    res.json({
      success: true,
      message: `แอดมินเติมเงินสำเร็จ ฿${numAmount.toLocaleString()}`,
      newBalance: result.newBalance
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 4. Redeem Gift / Promo Code (e.g. "IbukiCh" -> +฿50)
router.post('/redeem-code', (req, res) => {
  try {
    const { code } = req.body;
    const userId = req.headers['x-user-id'];

    if (!userId) {
      return res.status(401).json({ error: "กรุณาเข้าสู่ระบบก่อนใส่โค้ดรับเงิน" });
    }

    if (!code || !code.trim()) {
      return res.status(400).json({ error: "กรุณากรอกโค้ดของขวัญ" });
    }

    const result = db.redeemPromoCode({
      userId,
      code: code.trim()
    });

    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
