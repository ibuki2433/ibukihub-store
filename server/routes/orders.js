import express from 'express';
import { db } from '../db.js';

const router = express.Router();

// Buy software product
router.post('/buy', (req, res) => {
  try {
    const { productId, planId, machineId } = req.body;
    const userId = req.headers['x-user-id'];

    if (!userId) {
      return res.status(401).json({ error: "กรุณาเข้าสู่ระบบก่อนทำรายการสั่งซื้อ" });
    }
    if (!productId) {
      return res.status(400).json({ error: "กรุณาระบุสินค้าที่ต้องการซื้อ" });
    }

    const result = db.createOrder({ userId, productId, planId, machineId });
    res.json({
      success: true,
      message: "สั่งซื้อสำเร็จ! ระบบได้จัดส่งคีย์และเปิดสิทธิ์ดาวน์โหลดให้คุณแล้ว",
      order: result.order,
      remainingBalance: result.remainingBalance
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Bind Machine ID and Generate License Key for an existing order
router.post('/bind-machine', (req, res) => {
  try {
    const { orderId, machineId } = req.body;
    const userId = req.headers['x-user-id'];

    if (!orderId || !machineId) {
      return res.status(400).json({ error: "กรุณาระบุหมายเลขคำสั่งซื้อและ Machine ID" });
    }

    const updatedOrder = db.bindMachineIdToOrder({ userId, orderId, machineId });
    res.json({
      success: true,
      message: `ออก License Key สำหรับรหัสเครื่อง ${machineId} เรียบร้อยแล้ว!`,
      order: updatedOrder
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Record desktop program activation
router.post('/activate-desktop-key', (req, res) => {
  try {
    const { key, machineId } = req.body;
    if (!key || !machineId) {
      return res.status(400).json({ error: "Missing key or machineId" });
    }
    const order = db.recordDesktopActivation(key, machineId);
    res.json({ success: true, order });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get user orders (User's library)
router.get('/my-orders', (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ error: "กรุณาเข้าสู่ระบบ" });
    }

    const orders = db.getOrdersByUser(userId);
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user combined transaction history (Orders + Topups)
router.get('/my-history', (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ error: "กรุณาเข้าสู่ระบบ" });
    }

    const orders = db.getOrdersByUser(userId).map(order => {
      let isExpired = false;
      if (order.licenseKey) {
        const isLifetime = order.isLifetime === true || order.expiresAt === 'LIFETIME' || (order.durationDays && order.durationDays >= 9999);
        if (!isLifetime && order.expiresAt) {
          const exp = new Date(order.expiresAt).getTime();
          if (!isNaN(exp) && exp < Date.now()) {
            isExpired = true;
          }
        }
      }
      return { ...order, isExpired };
    });

    const topups = db.getTopupsByUser(userId);

    res.json({
      success: true,
      orders,
      topups
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
