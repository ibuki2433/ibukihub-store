import express from 'express';
import { db } from '../db.js';

const router = express.Router();

/**
 * License Verification Endpoint for Desktop Applications
 * Connects directly to IbukiHub E-Commerce database (store_db.json and MySQL)
 */
router.post('/', (req, res) => {
  try {
    const { key, machineId } = req.body;

    if (!key || typeof key !== 'string' || !key.trim()) {
      return res.status(400).json({ valid: false, message: 'กรุณากรอก License Key' });
    }

    const cleanKey = key.trim().toUpperCase();
    const cleanMid = machineId ? machineId.trim().toUpperCase() : '';

    // 1. Master Admin Key
    if (cleanKey === 'IBUKI2003') {
      return res.json({
        valid: true,
        plan: 'ADMIN',
        expiresAt: 'ไม่มีวันหมดอายุ (Master Admin)',
        customerName: 'แอดมินสูงสุด (Master Owner)',
        isAdmin: true,
        source: 'admin_manual',
        message: 'ยืนยันสิทธิ์แอดมินสูงสุดสำเร็จ'
      });
    }

    // 2. Search in Orders database (All customer purchases from Web Store)
    const orders = db.getAllOrders() || [];
    const matchedOrder = orders.find(
      (o) => o.licenseKey && o.licenseKey.trim().toUpperCase() === cleanKey
    );

    if (matchedOrder) {
      if (matchedOrder.status !== 'completed') {
        return res.json({ valid: false, message: 'คำสั่งซื้อนี้ยังไม่เสร็จสมบูรณ์' });
      }

      // Check Expiration
      if (
        matchedOrder.expiresAt &&
        matchedOrder.expiresAt !== 'LIFETIME' &&
        !matchedOrder.expiresAt.includes('ไม่มีวันหมดอายุ')
      ) {
        const expTime = new Date(matchedOrder.expiresAt).getTime();
        if (!isNaN(expTime) && Date.now() > expTime) {
          return res.json({
            valid: false,
            status: 'expired',
            message: 'License Key นี้หมดอายุการใช้งานแล้ว'
          });
        }
      }

      // Record device activation if machineId provided
      if (cleanMid) {
        matchedOrder.machineId = cleanMid;
        matchedOrder.lastSeenAt = new Date().toISOString();
        db.save();
      }

      return res.json({
        valid: true,
        plan: matchedOrder.planCode || 'VIP',
        expiresAt:
          matchedOrder.expiresAt === 'LIFETIME'
            ? 'ไม่มีวันหมดอายุ (Lifetime)'
            : new Date(matchedOrder.expiresAt).toLocaleDateString('th-TH'),
        customerName: matchedOrder.username || 'ลูกค้า IbukiHub',
        orderId: matchedOrder.id,
        webUsername: matchedOrder.username,
        source: 'web_store',
        isAdmin: false,
        message: 'เปิดใช้งานสิทธิ์เรียบร้อยแล้ว ยินดีต้อนรับสู่ระบบ'
      });
    }

    // 3. Search in Admin generated license keys (db.data.licenseKeys)
    if (db.data && db.data.licenseKeys) {
      for (const [prodId, keys] of Object.entries(db.data.licenseKeys)) {
        if (Array.isArray(keys)) {
          const found = keys.find((k) => (typeof k === 'string' ? k.toUpperCase() === cleanKey : k.key?.toUpperCase() === cleanKey));
          if (found) {
            return res.json({
              valid: true,
              plan: 'VIP',
              expiresAt: 'ไม่มีวันหมดอายุ (Lifetime)',
              customerName: 'ลูกค้า IbukiHub',
              source: 'web_store',
              isAdmin: false,
              message: 'เปิดใช้งานสิทธิ์เรียบร้อยแล้ว'
            });
          }
        }
      }
    }

    // 4. Fallback: Not found in database
    return res.json({
      valid: false,
      message: 'ไม่พบคีย์ในระบบ กรุณาตรวจสอบ License Key ที่ได้รับจากการสั่งซื้อบนเว็บไซต์'
    });
  } catch (err) {
    console.error('License verify error:', err);
    res.status(500).json({ valid: false, message: 'เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์: ' + err.message });
  }
});

// GET endpoint for status check
router.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'IbukiHub License Verification Protocol',
    endpoint: 'POST /api/verify',
    time: new Date().toISOString()
  });
});

export default router;
