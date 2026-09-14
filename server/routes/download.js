import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from '../db.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DOWNLOADS_DIR = path.join(__dirname, '..', 'storage', 'downloads');

// Secure download by order ID
router.all('/:orderId', (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.headers['x-user-id'] || req.query.userId;

    const orders = db.getAllOrders();
    const order = orders.find(o => o.id === orderId);

    if (!order) {
      return res.status(404).send("<h1>404 ไม่พบรายการสั่งซื้อนี้</h1>");
    }

    // Check authorization (unless admin or matched user)
    if (userId) {
      const user = db.getUserById(userId);
      if (user && user.role !== 'admin' && order.userId !== userId) {
        return res.status(403).send("<h1>403 สิทธิ์เข้าถึงไม่ถูกต้อง กรุณาเข้าสู่ระบบด้วยบัญชีที่ทำการสั่งซื้อ</h1>");
      }
    }

    const product = db.getProductById(order.productId);
    const fileName = order.fileName || (product && product.fileName) || "IbukiDownload_v2.5_Portable.zip";

    // 1. Check local file candidates (user Downloads folder or server downloads directory)
    const userDownloadsDir = path.join(process.env.USERPROFILE || 'C:\\Users\\User', 'Downloads');
    const localCandidates = [
      path.join(DOWNLOADS_DIR, fileName),
      path.join('C:\\Users\\User\\Downloads', fileName),
      path.join(userDownloadsDir, fileName)
    ];

    for (const candPath of localCandidates) {
      if (fs.existsSync(candPath)) {
        return res.download(candPath, fileName, (err) => {
          if (err && !res.headersSent) {
            console.error("Download stream error:", err);
            res.status(500).send("เกิดข้อผิดพลาดในการดาวน์โหลด: " + err.message);
          }
        });
      }
    }

    // 2. Redirect to cloud CDN URL (e.g. GitHub Releases CDN for Render production)
    const externalUrl = order.downloadUrl || (product && product.downloadUrl);
    if (externalUrl && (externalUrl.startsWith('http://') || externalUrl.startsWith('https://'))) {
      return res.redirect(externalUrl);
    }

    // Fallback: If it's another product without uploaded file yet, generate a delivery package on the fly
    const packageInfo = `=====================================================
 IBUKIHUB - OFFICIAL SOFTWARE DELIVERY
=====================================================
Product:  ${order.productName}
Order ID: ${order.id}
Date:     ${order.createdAt}
Status:   Active / Lifetime (ซื้อแล้วจบเลย)
=====================================================

คำแนะนำในการติดตั้งและเปิดใช้งาน:
1. แตกไฟล์ .zip ทั้งหมดลงในโฟลเดอร์ที่ต้องการ
2. ดับเบิลคลิกเปิดโปรแกรมใช้งานได้ทันทีตลอดชีพ (ไม่ต้องใส่ License Key)
3. หากมีข้อสงสัยหรือพบปัญหา ติดต่อ Support 24 ชม.
=====================================================
ขอขอบพระคุณที่อุดหนุนสินค้าจากเรา!
`;

    res.setHeader('Content-Disposition', `attachment; filename="${fileName.replace('.zip', '')}_License.txt"`);
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(packageInfo);

  } catch (err) {
    console.error("Download error:", err);
    res.status(500).send("เกิดข้อผิดพลาดในการดาวน์โหลด: " + err.message);
  }
});

// Direct download for specific filename
router.all('/file/:fileName', (req, res) => {
  try {
    const { fileName } = req.params;
    const userDownloadsDir = path.join(process.env.USERPROFILE || 'C:\\Users\\User', 'Downloads');
    const localCandidates = [
      path.join(DOWNLOADS_DIR, fileName),
      path.join('C:\\Users\\User\\Downloads', fileName),
      path.join(userDownloadsDir, fileName)
    ];

    for (const candPath of localCandidates) {
      if (fs.existsSync(candPath)) {
        return res.download(candPath, fileName);
      }
    }

    const cdnMap = {
      'IbukiDownload_v2.2_Portable.zip': 'https://github.com/ibuki2433/ibukihub-store/releases/download/v2.5.0/IbukiDownload_v2.2_Portable.zip',
      'IbukiDownload_v2.5_Portable.zip': 'https://github.com/ibuki2433/ibukihub-store/releases/download/v2.5.0/IbukiDownload_v2.5_Portable.zip'
    };

    if (cdnMap[fileName]) {
      return res.redirect(cdnMap[fileName]);
    }

    res.status(404).send("ไฟล์ไม่พบ");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

export default router;
