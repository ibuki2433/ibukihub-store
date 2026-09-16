import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';

import authRouter from './routes/auth.js';
import productsRouter from './routes/products.js';
import ordersRouter from './routes/orders.js';
import walletRouter from './routes/wallet.js';
import downloadRouter from './routes/download.js';
import adminRouter from './routes/admin.js';
import verifyRouter from './routes/verify.js';
import { db } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Prevent server exit on transient errors
process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT_EXCEPTION]', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('[UNHANDLED_REJECTION]', reason);
});

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploads (slips, files)
const uploadsPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}
const slipsPath = path.join(uploadsPath, 'slips');
if (!fs.existsSync(slipsPath)) {
  fs.mkdirSync(slipsPath, { recursive: true });
}
app.use('/uploads', express.static(uploadsPath));

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/wallet', walletRouter);
app.use('/api/download', downloadRouter);
app.use('/api/admin', adminRouter);
app.use('/api/verify', verifyRouter);
app.use('/api/licenses/verify', verifyRouter);

// TrueMoney Donation Compatibility (ibuki-channel & truemoney-backend)
app.post('/api/donate', (req, res, next) => {
  req.url = '/donate';
  walletRouter(req, res, next);
});

app.get('/api/stats', (req, res) => {
  const allTopups = db.getAllTopups();
  const giftTopups = allTopups.filter(t => t.channel && t.channel.includes('Gift'));
  const sum = giftTopups.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
  const count = giftTopups.length;
  const target = 10000;
  const pct = target > 0 ? Math.min(Math.round((sum / target) * 1000) / 10, 100) : 0;
  res.json({
    success: true,
    data: { total_amount: sum, total_count: count, target_amount: target, percentage: pct }
  });
});

app.get('/api/recent-donations', (req, res) => {
  const allTopups = db.getAllTopups();
  const giftTopups = allTopups.filter(t => t.channel && t.channel.includes('Gift'));
  const recent = giftTopups.slice(0, 10).map(d => ({
    donor_name: d.senderName || d.username || 'ผู้ไม่ประสงค์ออกนาม',
    message: d.message || '',
    amount: d.amount,
    created_at: d.createdAt
  }));
  res.json({ success: true, data: recent });
});

app.get('/api/leaderboard', (req, res) => {
  const allTopups = db.getAllTopups();
  const giftTopups = allTopups.filter(t => t.channel && t.channel.includes('Gift'));
  const donorMap = {};
  giftTopups.forEach(item => {
    const name = (item.senderName || item.username || 'ผู้ไม่ประสงค์ออกนาม').trim();
    const amt = parseFloat(item.amount) || 0;
    if (!donorMap[name]) {
      donorMap[name] = { donor_name: name, total_amount: 0, count: 0 };
    }
    donorMap[name].total_amount += amt;
    donorMap[name].count += 1;
  });
  const leaderboard = Object.values(donorMap)
    .sort((a, b) => b.total_amount - a.total_amount)
    .slice(0, 5);
  res.json({ success: true, data: leaderboard });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    mode: 'store-integrated',
    receiver_phone: '086****416'
  });
});

// Public settings & live stats
app.get('/api/settings', (req, res) => {
  res.json({
    success: true,
    settings: db.getSettings()
  });
});

// Serve client build if present
const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(clientDistPath, 'index.html'));
    }
  });
} else {
  app.get('/', (req, res) => {
    res.send(`
      <div style="font-family: sans-serif; text-align: center; padding: 50px; background: #121212; color: #fff; min-height: 100vh;">
        <h1 style="color: #a78bfa;">IbukiHub Server is Running!</h1>
        <p>Port: ${PORT}</p>
        <p>Client build not detected yet. Run <code>npm run build</code> or start frontend with <code>npm --prefix client run dev</code></p>
        <a href="/api/products" style="color: #c4b5fd; text-decoration: underline;">View Products JSON</a>
      </div>
    `);
  });
}

// Start server and automatically open browser
const server = app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🔥 IbukiHub Server running at: http://localhost:${PORT}`);
  console.log(`🚀 กำลังเปิดหน้าเว็บ http://localhost:${PORT} ให้อัตโนมัติ...`);
  console.log(`📁 Downloads folder: ${path.join(__dirname, 'storage', 'downloads')}`);
  console.log(`====================================================`);

  // Auto-open browser on Windows / Mac / Linux
  try {
    const startCmd = process.platform === 'win32' ? 'start' : process.platform === 'darwin' ? 'open' : 'xdg-open';
    exec(`${startCmd} http://localhost:${PORT}`);
  } catch (err) {
    console.error("Auto open browser failed:", err);
  }
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.warn(`[INFO] พอร์ต ${PORT} กำลังถูกใช้งานอยู่แล้ว ระบบจะเปิดเบราว์เซอร์ไปที่ http://localhost:${PORT} ทันที...`);
    try {
      const startCmd = process.platform === 'win32' ? 'start' : process.platform === 'darwin' ? 'open' : 'xdg-open';
      exec(`${startCmd} http://localhost:${PORT}`);
    } catch (e) {}
  } else {
    console.error("Server error:", err);
  }
});
