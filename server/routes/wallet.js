import express from 'express';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { db } from '../db.js';

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

// 1. Redeem TrueMoney Gift Voucher (Matching ibuki-channel)
router.post('/truemoney-gift', async (req, res) => {
  try {
    const { voucherUrl, senderName, message } = req.body;
    const userId = req.headers['x-user-id'];

    if (!userId) {
      return res.status(401).json({ error: "กรุณาเข้าสู่ระบบก่อนทำรายการเติมเงิน" });
    }

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
      // Call TrueMoney API (via curl.exe to bypass Cloudflare WAF TLS fingerprinting)
      try {
        const url = `https://gift.truemoney.com/campaign/vouchers/${voucherCode}/redeem`;
        const bodyJson = JSON.stringify({
          mobile: receiverPhone,
          voucher_hash: voucherCode
        });

      let resData = null;

      try {
        const args = [
          '-s',
          '-X', 'POST',
          url,
          '-H', 'Content-Type: application/json',
          '-H', 'Accept: application/json',
          '-H', 'Origin: https://gift.truemoney.com',
          '-H', `Referer: https://gift.truemoney.com/campaign/?v=${voucherCode}`,
          '-A', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
          '-d', bodyJson,
          '--max-time', '15'
        ];

        const { stdout } = await execFileAsync('curl.exe', args);
        if (stdout && stdout.trim().startsWith('{')) {
          resData = JSON.parse(stdout);
        }
      } catch (curlErr) {
        console.warn("curl.exe error, trying fallback fetch:", curlErr.message);
      }

      // Fallback to fetch if curl was not available
      if (!resData) {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Origin': 'https://gift.truemoney.com',
            'Referer': `https://gift.truemoney.com/campaign/?v=${voucherCode}`,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
          },
          body: bodyJson,
          signal: AbortSignal.timeout(10000)
        });
        resData = await response.json();
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
      } else if (resData?.status?.code) {
        const code = resData.status.code;
        if (code === 'VOUCHER_OUT_OF_STOCK') {
          return res.status(400).json({ error: "ซองของขวัญนี้หมดแล้ว หรือมีคนกดรับไปแล้ว" });
        } else if (code === 'VOUCHER_EXPIRED') {
          return res.status(400).json({ error: "ซองของขวัญนี้หมดอายุแล้ว (อายุซอง 72 ชั่วโมง)" });
        } else if (code === 'TARGET_USER_REDEEMED') {
          return res.status(400).json({ error: "เบอร์ผู้รับนี้เคยกดรับซองนี้ไปแล้ว" });
        } else if (code === 'CANNOT_GET_OWN_VOUCHER') {
          return res.status(400).json({ error: "ไม่สามารถกดรับซองของขวัญของตนเองได้ (ผู้สร้างซองและผู้รับเป็นเบอร์เดียวกัน กรุณาใช้บัญชี TrueMoney อื่นในการสร้างซอง)" });
        } else if (code === 'VOUCHER_NOT_FOUND') {
          return res.status(400).json({ error: "ไม่พบข้อมูลซองของขวัญนี้ในระบบ TrueMoney กรุณาตรวจสอบลิงก์อีกครั้ง" });
        } else {
          return res.status(400).json({ error: resData.status.message || "การแลกซองของขวัญไม่สำเร็จ" });
        }
      }
        } catch (apiErr) {
          console.warn("TrueMoney API error:", apiErr.message);
        }
      }

      if (!redeemedSuccessfully) {
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

// 3. Regular top-up (PromptPay QR)
router.post('/topup', (req, res) => {
  try {
    const { amount, channel = "PromptPay QR", voucherCode } = req.body;
    const userId = req.headers['x-user-id'];

    if (!userId) {
      return res.status(401).json({ error: "กรุณาเข้าสู่ระบบก่อนเติมเงิน" });
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ error: "จำนวนเงินไม่ถูกต้อง กรุณาระบุจำนวนเงินอย่างน้อย 1 บาท" });
    }

    const result = db.createTopup({
      userId,
      amount: numAmount,
      channel: voucherCode ? `TrueMoney Voucher (${voucherCode.substring(0, 10)}...)` : channel
    });

    res.json({
      success: true,
      message: `เติมเงินสำเร็จเรียบร้อย! ได้รับ ${numAmount.toLocaleString()} ฿`,
      topup: result.topup,
      newBalance: result.newBalance
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
