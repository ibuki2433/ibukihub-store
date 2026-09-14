import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, 'data', 'store_db.json');
const AUTOPOSTER_SECRET_SALT = 'IBUKI_SECRET_KEY_AUTOPOSTER_2026_V1';

const INITIAL_DATA = {
  settings: {
    storeName: "IbukiHub",
    announcement: "ยินดีต้อนรับสู่ IbukiHub ศูนย์รวมซอฟต์แวร์เดสก์ท็อป ซื้อแล้วจบเลย แตกไฟล์ใช้งานได้ทันทีตลอดชีพ ไม่ต้องใส่คีย์ ระบบเปิดสิทธิ์ดาวน์โหลดอัตโนมัติ 24 ชม.",
    discordUrl: "https://discord.gg/ibukihub",
    lineUrl: "https://line.me/ti/p/~@ibukihub",
    facebookUrl: "https://facebook.com/ibukihub",
    stats: {
      itemsAvailable: 3,
      totalSalesBath: 11150, // 30 orders of V2.2 (30*150=4500) + 35 orders of V2.5 (35*190=6650) = 11,150
      totalMembers: 100,
      totalSold: 65
    }
  },
  users: [
    {
      id: "usr_admin_ibuki",
      username: "ibuki",
      password: "2003",
      displayName: "Ibuki Admin (แอดมินหลัก)",
      role: "admin",
      balance: 999999,
      email: "ibuki@bullsoftware.dev",
      phone: "0800002003",
      createdAt: new Date().toISOString()
    }
  ],
  categories: [
    { id: "all", name: "ซอฟต์แวร์ทั้งหมด", icon: "Boxes" },
    { id: "download", name: "จัดการไฟล์และดาวน์โหลด", icon: "Download" },
    { id: "automation", name: "การตลาด & บอทอัตโนมัติ", icon: "Bot" }
  ],
  products: [
    {
      id: "prod_autoposter",
      name: "Ibuki FB AutoPoster Pro V.1.0",
      category: "automation",
      price: 290,
      originalPrice: 490,
      badge: "บอทการตลาด Facebook อัจฉริยะ",
      version: "v1.0 Pro Portable",
      shortDesc: "⚡ Ibuki FB AutoPoster Pro ระบบโพสต์กลุ่ม Facebook อัตโนมัติ ป้องกันบล็อก 100% ตั้งเวลาโพสต์วนรอบ จำลองการพิมพ์เหมือนคนจริง พร้อมระบบพรีวิวโพสต์",
      description: "Ibuki FB AutoPoster Pro v1.0 เครื่องมือช่วยทำการตลาดออนไลน์และกระจายโพสต์ลงกลุ่ม Facebook แบบอัตโนมัติเต็มรูปแบบ\n\nจุดเด่นฟังก์ชันการทำงาน:\n• ระบบโพสต์กลุ่มอัตโนมัติ (Batch Auto-Poster): โพสต์ลงกลุ่มเป้าหมายหลายๆ กลุ่มพร้อมกันโดยอัตโนมัติ ไม่ต้องนั่งโพสต์เองทีละกลุ่ม\n• ป้องกันการโดนแบน / โดนบล็อก 100% (Human Simulation & Anti-Ban): จำลองการพิมพ์ทีละตัวอักษรแบบคนจริง (Human Typing Delay), สุ่มดีเลย์หน่วงเวลาพักระหว่างกลุ่ม, ควบคุมผ่านเบราว์เซอร์ Chrome ตัวจริง\n• ระบบตั้งเวลาโพสต์ล่วงหน้า (Smart Post Scheduler): กำหนดเวลาโพสต์ได้ละเอียด ทั้งแบบโพสต์รอบเดียว หรือโพสต์วนซ้ำอัตโนมัติทุกๆ 1, 2, 3, 6, 12, 24 ชั่วโมง\n• ระบบรันต่อเนื่องแม้ปิดหน้าต่าง (Background System Tray): ซ่อนโปรแกรมลง System Tray หลังตั้งเวลา ไม่เกะกะหน้าจอ รันงานเบื้องหลังเงียบๆ ตลอด 24 ชม.\n• ระบบดูตัวอย่างโพสต์จริง (Facebook Live Preview Modal): จำลองหน้าฟีด Facebook ของจริง ตรวจสอบแคปชัน แฮชแท็ก แท็กเพื่อน และการจัดวางรูปภาพก่อนเริ่มโพสต์จริง\n• บันทึกการตั้งค่าแยกตามคีย์และเครื่อง (Profile Persistence): จำข้อความและกลุ่มแยกตาม License Key และ Hardware ID ไม่ต้องพิมพ์ใหม่ทุกครั้ง\n• ระบบ License ล็อกรหัสเครื่อง (Hardware ID Locked): ออกคีย์อัตโนมัติผูกกับรหัสประจำเครื่อง ปลอดภัยสูงสุด",
      features: [
        "ระบบโพสต์ลงหลายกลุ่ม Facebook อัตโนมัติ พร้อมรองรับหลายบัญชี",
        "ระบบจำลองการพิมพ์แบบคนจริง (Human Typing) ป้องกัน Facebook ตรวจจับ",
        "ระบบสุ่มหน่วงเวลา (Random Delay) ปลอดภัย ไม่เสี่ยงโดนล็อกบัญชี",
        "ระบบตั้งเวลาโพสต์ล่วงหน้า เลือกรอบเดียว หรือวนซ้ำทุกๆ X ชั่วโมง",
        "ระบบรันเบื้องหลัง (Background Tray Service) ปิดหน้าต่างโปรแกรมยังทำงานต่อ",
        "หน้าต่าง Live Preview ตรวจสอบฟีด Facebook จำลองก่อนโพสต์จริง",
        "ระบบบันทึกโปรไฟล์ข้อความและกลุ่มแยกตาม License Key อัตโนมัติ",
        "ไม่ต้องติดตั้ง (Portable Edition) แตกไฟล์ใช้งานได้ทันทีบน Windows 10/11"
      ],
      systemRequirements: "Windows 10 / Windows 11 (64-bit), Google Chrome, RAM 4GB ขึ้นไป, พื้นที่ว่าง 300MB",
      fileName: "Ibuki_FB_AutoPoster_Pro_v1.0_Portable.zip",
      fileSize: "122 MB",
      imageUrl: "/autoposter_preview.png",
      previewUrl: "/autoposter_banner.png",
      rating: 5.0,
      reviewsCount: 88,
      stock: "ไม่จำกัด",
      unlimitedStock: true,
      soldCount: 42,
      requiresMachineId: true,
      licenseFormat: "IBUKI-VIP-9999999999999-XXXXXXXXXX"
    },
    {
      id: "prod_ibuki_22",
      name: "IbukiDownload V.2.2",
      category: "download",
      price: 150,
      originalPrice: 290,
      badge: "เวอร์ชันแนะนำ",
      version: "v2.2 Portable",
      shortDesc: "⚡ IbukiDownload v2.2 (รุ่นเน้นดูดคลิป & เพลง ราคาสบายกระเป๋า) โหลดพร้อมกันหลายลิงก์ คมชัดสูงสุดระดับ Best Quality",
      description: "⚡ IbukiDownload v2.2 (รุ่นเน้นดูดคลิป & เพลง ราคาสบายกระเป๋า)\nราคาเบาๆ เพียง 150.-\nเน้นฟังก์ชันดาวน์โหลดคลิปและแยกไฟล์เสียงเต็มรูปแบบ\nโหลดพร้อมกันหลายลิงก์ คมชัดสูงสุดระดับ Best Quality\nเหมาะสำหรับสายดูดคลิปสั้น ครีเอเตอร์ตัดต่อ หรือคนที่อยากเก็บเพลงไว้ฟังแบบออฟไลน์\nไม่ต้องนั่งลุ้นกับเว็บแจกฟรีที่เต็มไปด้วยโฆษณากวนใจ ซื้อครั้งเดียวใช้ยาวๆ",
      features: [
        "เน้นฟังก์ชันดาวน์โหลดคลิปและแยกไฟล์เสียงเต็มรูปแบบ (Video & Audio)",
        "โหลดพร้อมกันหลายลิงก์ รองรับวางหลายๆ ลิงก์พร้อมกัน ป้องกันลิงก์ซ้ำ",
        "คมชัดสูงสุดระดับ Best Quality (1080p FHD, 720p HD, 480p SD)",
        "รองรับนามสกุลไฟล์ยอดนิยม: MP4, MKV, WebM, MOV, AVI และไฟล์เสียง",
        "รองรับลิงก์วิดีโอ & เพลงไม่จำกัด (YouTube, TikTok, Facebook, IG, X, Bilibili, SoundCloud ฯลฯ)",
        "ไม่ต้องติดตั้ง (Portable Edition) แตกไฟล์ใช้งานได้ทันที",
        "ไม่ต้องนั่งลุ้นกับเว็บแจกฟรีที่เต็มไปด้วยโฆษณากวนใจ ซื้อครั้งเดียวใช้ยาวๆ"
      ],
      systemRequirements: "Windows 10 / Windows 11 (64-bit), RAM 2GB ขึ้นไป, พื้นที่ว่าง 300MB",
      fileName: "IbukiDownload_v2.2_Portable.zip",
      fileSize: "98.9 MB",
      imageUrl: "/ibuki_v22_preview.png",
      previewUrl: "/ibuki_v22_preview.png",
      rating: 5.0,
      reviewsCount: 164,
      stock: "ไม่จำกัด",
      unlimitedStock: true,
      soldCount: 30,
      licenseFormat: "IBUKI-V22-XXXX-XXXX-XXXX"
    },
    {
      id: "prod_ibuki_25",
      name: "IbukiDownload V.2.5",
      category: "download",
      price: 190,
      originalPrice: 290,
      badge: "รุ่นท็อป 2-in-1",
      version: "v2.5 Portable",
      shortDesc: "⚡ IbukiDownload v2.5 โปรแกรมรวมฟังก์ชันจัดการไฟล์มัลติมีเดียและเอกสารแบบ 2-in-1 ในโปรแกรมเดียว ออกแบบมาให้ใช้งานง่าย รวดเร็ว และไม่ต้องง้อเว็บแปลงไฟล์ออนไลน์ที่เสี่ยงต่อความปลอดภัย",
      description: "IbukiDownload v2.5 โปรแกรมรวมฟังก์ชันจัดการไฟล์มัลติมีเดียและเอกสารแบบ 2-in-1 ในโปรแกรมเดียว ออกแบบมาให้ใช้งานง่าย รวดเร็ว และไม่ต้องง้อเว็บแปลงไฟล์ออนไลน์ที่เสี่ยงต่อความปลอดภัย\n\nจุดเด่นการทำงานระบบดาวน์โหลดวิดีโอ & เพลง (Media Downloader)\n• ระบบดาวน์โหลดแบบ Batch & Auto-Deduplication: รองรับการวางลิงก์พร้อมกันทีละหลายรายการ หรือโหลดผ่านไฟล์ .txt พร้อมระบบตรวจจับและป้องกันการดาวน์โหลดลิงก์ซ้ำอัตโนมัติ\n• รองรับแพลตฟอร์มชั้นนำไม่จำกัด: ดึงไฟล์ได้จาก YouTube, TikTok, Facebook, IG, X (Twitter), Bilibili, SoundCloud และอื่นๆ\n• เลือกความละเอียดและฟอร์แมตตามต้องการ: เลือกโหลดเป็น วิดีโอ (Video) หรือ เฉพาะไฟล์เสียง (Audio) ได้ในคลิกเดียว\n• ปรับความคมชัดได้สูงสุดตามต้นฉบับ: Best / 1080p FHD / 720p HD / 480p SD\n• ส่งออกไฟล์ได้หลากหลาย: MP4, MKV, WebM, MOV, AVI\n\nจุดเด่นการทำงานระบบแปลงไฟล์เอกสาร (Ibuki Document Converter)\n• High-Fidelity Document Engine: ระบบแปลงเอกสารความเที่ยงตรงสูง คงรูปเล่ม ตาราง รูปภาพ ฟอนต์ และการจัดหน้าตามต้นฉบับเดิมโดยไม่ดัดแปลงเนื้อหา\n• รองรับไฟล์ยอดนิยมรอบด้าน: แปลงไฟล์กลับไปมาระหว่าง PDF, Word (.docx), Excel, PPT และรูปภาพ\n• ลากแล้ววาง (Drag & Drop): นำเข้าไฟล์ได้ทันที พร้อมตัวเลือกเปิดไฟล์อัตโนมัติหลังแปลงเสร็จ\n\nสคริปต์โพสต์ขาย / แคปชันโปรโมต (Copywriting)\nหมดปัญหาเว็บดาวน์โหลดติดไวรัส หรือแปลงไฟล์ PDF แล้วฟอนต์เละ!\nจัดการทุกคอนเทนต์และงานเอกสารให้จบในโปรแกรมเดียวด้วย IbukiDownload v2.5",
      features: [
        "รวม 2 ฟังก์ชันในโปรแกรมเดียว: Media Downloader & Document Converter",
        "ระบบ Batch & Auto-Deduplication วางหลายลิงก์หรือไฟล์ .txt ป้องกันโหลดซ้ำ",
        "รองรับ YouTube, TikTok, Facebook, IG, X (Twitter), Bilibili, SoundCloud ฯลฯ",
        "เลือกโหลด Video หรือ Audio คมชัดสูงสุด Best / 1080p FHD / 720p HD / 480p SD",
        "ส่งออกไฟล์หลากหลาย: MP4, MKV, WebM, MOV, AVI",
        "Ibuki Document Converter แปลงเอกสารความเที่ยงตรงสูง คงรูปเล่ม ตาราง รูปภาพ ฟอนต์",
        "รองรับแปลงสลับระหว่าง PDF, Word (.docx), Excel, PPT และรูปภาพ",
        "รองรับ Drag & Drop ลากวางไฟล์ทันที พร้อมเปิดไฟล์อัตโนมัติเมื่อเสร็จ",
        "ไม่ต้องติดตั้ง (Portable Edition) ซื้อแล้วจบเลย แตกไฟล์ใช้งานได้ตลอดชีพ ไม่ต้องใส่คีย์"
      ],
      systemRequirements: "Windows 10 / Windows 11 (64-bit), RAM 4GB ขึ้นไป, พื้นที่ว่าง 500MB",
      fileName: "IbukiDownload_v2.5_Portable.zip",
      fileSize: "196 MB",
      imageUrl: "/ibuki_v25_banner.jpg",
      previewUrl: "/ibuki_v25_banner.jpg",
      rating: 5.0,
      reviewsCount: 210,
      stock: "ไม่จำกัด",
      unlimitedStock: true,
      soldCount: 35,
      licenseFormat: "IBUKI-V25-XXXX-XXXX-XXXX"
    }
  ],
  licenseKeys: {
    prod_ibuki_25: [
      "IBUKI-V25-A8F9-E4D2-901B",
      "IBUKI-V25-77B2-31C4-F90E",
      "IBUKI-V25-9921-66AA-810D",
      "IBUKI-V25-5432-11FE-BULL"
    ]
  },
  orders: [],
  topups: []
};

// Database class
class Database {
  constructor() {
    this.data = null;
    this.init();
  }

  init() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        this.data = JSON.parse(raw);
      } else {
        this.data = JSON.parse(JSON.stringify(INITIAL_DATA));
      }
      // Purge leftover demo/test accounts, demo orders, and demo topups
      if (this.data.users) {
        this.data.users = this.data.users.filter(u => 
          u.username !== 'admin' && 
          u.username !== 'user1' && 
          !u.username.startsWith('tester_')
        );
      }
      if (this.data.topups) {
        this.data.topups = this.data.topups.filter(t => 
          t.username !== 'user1' && 
          !t.username?.startsWith('tester_') &&
          t.id !== 'TOP-83910' && 
          t.id !== 'TOP-83911'
        );
      }
      if (this.data.orders) {
        this.data.orders = this.data.orders.filter(o => 
          o.username !== 'user1' && 
          !o.username?.startsWith('tester_') &&
          o.id !== 'ORD-928104' && 
          o.id !== 'ORD-928105'
        );
      }
      this.ensureAdminUser();
      this.ensureAutoPosterProduct();
      this.save();
    } catch (err) {
      console.error("Failed to load db file, initializing default:", err);
      this.data = JSON.parse(JSON.stringify(INITIAL_DATA));
      this.ensureAdminUser();
      this.ensureAutoPosterProduct();
      this.save();
    }
  }

  ensureAutoPosterProduct() {
    if (!this.data.categories) this.data.categories = [];
    if (!this.data.categories.find(c => c.id === 'automation')) {
      this.data.categories.push({ id: "automation", name: "การตลาด & บอทอัตโนมัติ", icon: "Bot" });
    }

    if (!this.data.products) this.data.products = [];
    const existing = this.data.products.find(p => p.id === 'prod_autoposter');
    const autoPosterProduct = {
      id: "prod_autoposter",
      name: "Ibuki FB AutoPoster Pro V.1.0",
      category: "automation",
      price: 29,
      originalPrice: 59,
      badge: "บอทการตลาด Facebook อัจฉริยะ",
      version: "v1.0 Pro Portable",
      shortDesc: "⚡ Ibuki FB AutoPoster Pro บอทโพสต์กลุ่ม Facebook อัตโนมัติ เลือกรอบเวลาได้อิสระเป็นทุกๆ กี่นาที หรือทุกๆ กี่ชั่วโมง โพสต์วนรอบ สลับหลายบัญชี พร้อมระบบจำลองการพิมพ์เหมือนมนุษย์ (Human-like typing) ป้องกันการตรวจจับและกันแบน 100%",
      description: "Ibuki FB AutoPoster Pro v1.0 ซอฟต์แวร์ช่วยทำการตลาดออนไลน์และกระจายโพสต์ลงกลุ่ม Facebook อัตโนมัติเต็มรูปแบบ\n\nจุดเด่นฟังก์ชันการทำงาน:\n• ระบบโพสต์กลุ่มอัตโนมัติ (Batch Auto-Poster): กระจายโพสต์ลงกลุ่มเป้าหมายหลายๆ กลุ่มพร้อมกันโดยอัตโนมัติ ไม่ต้องเสียเวลานั่งโพสต์ทีละกลุ่ม\n• กำหนดรอบเวลาได้อิสระ (Custom Interval Posting): เลือกตั้งเวลาโพสต์ได้ละเอียด ทั้งแบบ 'ทุกๆ กี่นาที' หรือ 'ทุกๆ กี่ชั่วโมง'\n• ระบบโพสต์วนรอบอัตโนมัติ (Loop Posting Scheduler): ตั้งเวลาวนซ้ำโพสต์ต่อเนื่องตลอดวัน เลือกรอบเดียวหรือวนซ้ำไม่รู้จบ\n• รองรับสลับหลายบัญชี (Multi-Account Rotation): สลับบัญชี Facebook หลายไอดีในการโพสต์ เพื่อกระจายยอดการเข้าถึงและลดความเสี่ยง\n• ป้องกันการโดนแบน 100% ด้วยระบบจำลองการพิมพ์เหมือนมนุษย์ (Human-like Typing Simulation): จำลองการพิมพ์ทีละตัวอักษรแบบคนจริง พร้อมสุ่มดีเลย์หน่วงเวลาพักระหว่างกลุ่ม Facebook ตรวจจับไม่ได้\n• ระบบรันต่อเนื่องแม้ปิดหน้าต่าง (Background System Tray): ซ่อนโปรแกรมลง System Tray หลังตั้งเวลา ไม่เกะกะหน้าจอ รันงานเบื้องหลังเงียบๆ ตลอด 24 ชม.\n• ระบบดูตัวอย่างโพสต์จริง (Facebook Live Preview Modal): จำลองหน้าฟีด Facebook ของจริง ตรวจสอบแคปชัน แฮชแท็ก แท็กเพื่อน และการจัดวางรูปภาพก่อนเริ่มโพสต์จริง\n• ระบบ License ล็อกรหัสเครื่อง (Hardware ID Locked): ออกคีย์อัตโนมัติผูกกับรหัสประจำเครื่อง ปลอดภัยสูงสุด เลือกระยะเวลาใช้งานได้ทั้งแบบเช่ารายวัน/รายสัปดาห์/รายเดือน/รายปี หรือซื้อขาดถาวรตลอดชีพ",
      features: [
        "ระบบโพสต์ลงหลายกลุ่ม Facebook อัตโนมัติ พร้อมสลับหลายบัญชี (Multi-Account)",
        "เลือกรอบเวลาได้อิสระเป็นทุกๆ กี่นาที หรือทุกๆ กี่ชั่วโมง โพสต์วนรอบไม่จำกัด",
        "จำลองการพิมพ์เหมือนมนุษย์ทีละตัวอักษร (Human-like Typing) ป้องกันการโดนแบน 100%",
        "ระบบสุ่มหน่วงเวลา (Random Delay) ปลอดภัยสูงสุดตามมาตรฐาน Facebook",
        "ระบบรันเบื้องหลัง (Background System Tray) ปิดหน้าต่างโปรแกรมยังทำงานต่อได้ตลอด 24 ชม.",
        "หน้าต่าง Live Preview ตรวจสอบฟีด Facebook จำลองก่อนเริ่มโพสต์จริง",
        "ระบบบันทึกโปรไฟล์ข้อความและกลุ่มแยกตาม License Key และ Hardware ID อัตโนมัติ",
        "ไม่ต้องติดตั้ง (Portable Edition) แตกไฟล์ใช้งานได้ทันทีบน Windows 10/11"
      ],
      plans: [
        {
          "id": "1day",
          "name": "เช่า 1 วัน (ทดลองใช้งาน)",
          "planCode": "1DAY",
          "durationDays": 1,
          "price": 29,
          "originalPrice": 59,
          "badge": "เริ่มต้น",
          "isLifetime": false
        },
        {
          "id": "7days",
          "name": "เช่า 7 วัน (1 สัปดาห์)",
          "planCode": "7DAYS",
          "durationDays": 7,
          "price": 99,
          "originalPrice": 190,
          "badge": "ประหยัด",
          "isLifetime": false
        },
        {
          "id": "30days",
          "name": "เช่า 30 วัน (1 เดือน)",
          "planCode": "30DAYS",
          "durationDays": 30,
          "price": 249,
          "originalPrice": 490,
          "badge": "⭐ ยอดนิยม",
          "isLifetime": false
        },
        {
          "id": "1year",
          "name": "เช่า 1 ปี (365 วัน)",
          "planCode": "1YEAR",
          "durationDays": 365,
          "price": 790,
          "originalPrice": 1590,
          "badge": "สุดคุ้ม",
          "isLifetime": false
        },
        {
          "id": "lifetime",
          "name": "ซื้อสิทธิ์ถาวร (ตลอดชีพ)",
          "planCode": "VIP",
          "durationDays": 99999,
          "price": 1290,
          "originalPrice": 2590,
          "badge": "👑 ตลอดชีพ",
          "isLifetime": true
        }
      ],
      systemRequirements: "Windows 10 / Windows 11 (64-bit), Google Chrome, RAM 4GB ขึ้นไป, พื้นที่ว่าง 300MB",
      fileName: "Ibuki_FB_AutoPoster_Pro_v1.0_Portable.zip",
      fileSize: "122 MB",
      imageUrl: "/autoposter_ui.png",
      previewUrl: "/autoposter_ui.png",
      rating: 5.0,
      reviewsCount: 88,
      stock: "ไม่จำกัด",
      unlimitedStock: true,
      soldCount: 42,
      requiresMachineId: true,
      licenseFormat: "IBUKI-VIP-9999999999999-XXXXXXXXXX"
    };

    if (!existing) {
      this.data.products.unshift(autoPosterProduct);
    } else {
      Object.assign(existing, autoPosterProduct);
    }
    this.data.settings.stats.itemsAvailable = this.data.products.length;
  }

  ensureAdminUser() {
    let admin = this.data.users.find(u => u.username === 'ibuki' || u.id === 'usr_admin_ibuki');
    if (!admin) {
      admin = {
        id: "usr_admin_ibuki",
        username: "ibuki",
        password: "2003",
        displayName: "Ibuki Admin (แอดมินหลัก)",
        role: "admin",
        balance: 999999,
        email: "ibuki@bullsoftware.dev",
        phone: "0800002003",
        isRootAdmin: true,
        createdAt: new Date().toISOString()
      };
      this.data.users.unshift(admin);
    } else {
      admin.id = "usr_admin_ibuki";
      admin.username = "ibuki";
      admin.password = "2003";
      admin.role = "admin";
      admin.isRootAdmin = true;
      admin.displayName = "Ibuki Admin (แอดมินหลัก)";
      admin.balance = Math.max(admin.balance || 0, 999999);
    }
  }

  save() {
    try {
      const dir = path.dirname(DATA_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error("Failed to write db file:", err);
    }
  }

  // Settings
  getSettings() {
    return this.data.settings;
  }

  updateSettings(newSettings) {
    this.data.settings = { ...this.data.settings, ...newSettings };
    this.save();
    return this.data.settings;
  }

  // Users
  getUserByUsername(username) {
    return this.data.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  }

  getUserByUsernameOrEmail(identifier) {
    if (!identifier) return null;
    const clean = identifier.trim().toLowerCase();
    return this.data.users.find(u => 
      u.username.toLowerCase() === clean || 
      (u.email && u.email.toLowerCase() === clean) ||
      (u.phone && u.phone.replace(/[^0-9]/g, '') === clean.replace(/[^0-9]/g, ''))
    );
  }

  getUserById(id) {
    return this.data.users.find(u => u.id === id);
  }

  getUserByFacebookId(facebookId) {
    if (!facebookId) return null;
    return this.data.users.find(u => u.facebookId && String(u.facebookId) === String(facebookId));
  }

  getUserByPhone(phone) {
    if (!phone) return null;
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    return this.data.users.find(u => u.phone && u.phone.replace(/[^0-9]/g, '') === cleanPhone);
  }

  createUser({ username, password, email, displayName, phone, role = 'member', facebookId = null, avatar = null, balance = 0 }) {
    const existing = this.getUserByUsername(username);
    if (existing) {
      throw new Error("ชื่อผู้ใช้นี้มีคนใช้แล้ว");
    }
    if (email) {
      const existingEmail = this.data.users.find(u => u.email && u.email.toLowerCase() === email.trim().toLowerCase());
      if (existingEmail) {
        throw new Error("อีเมลนี้ถูกใช้งานแล้ว");
      }
    }

    const newUser = {
      id: "usr_" + Math.random().toString(36).substr(2, 9),
      username: username.trim(),
      displayName: (displayName && displayName.trim()) || username.trim(),
      password,
      role,
      balance: balance || 0,
      email: (email && email.trim()) || `${username.trim()}@user.local`,
      phone: (phone && phone.trim()) || "",
      facebookId: facebookId ? String(facebookId) : null,
      avatar: avatar || null,
      createdAt: new Date().toISOString()
    };
    this.data.users.push(newUser);
    this.data.settings.stats.totalMembers += 1;
    this.save();
    return newUser;
  }

  resetPassword(identifier, newPassword) {
    const user = this.getUserByUsernameOrEmail(identifier) || this.getUserByPhone(identifier);
    if (!user) throw new Error("ไม่พบชื่อผู้ใช้ อีเมล หรือเบอร์โทรศัพท์นี้ในระบบ");
    user.password = newPassword;
    this.save();
    return user;
  }

  updateUserBalance(userId, amountToAdd) {
    const user = this.getUserById(userId);
    if (!user) throw new Error("ไม่พบผู้ใช้งาน");
    user.balance = Math.max(0, (user.balance || 0) + amountToAdd);
    this.save();
    return user;
  }

  // Products
  getProducts() {
    return this.data.products;
  }

  getProductById(id) {
    return this.data.products.find(p => p.id === id);
  }

  addProduct(productData) {
    const newProduct = {
      id: "prod_" + Math.random().toString(36).substr(2, 9),
      rating: 5.0,
      reviewsCount: 1,
      soldCount: 0,
      stock: 50,
      ...productData
    };
    this.data.products.unshift(newProduct);
    this.data.settings.stats.itemsAvailable = this.data.products.length;
    this.save();
    return newProduct;
  }

  updateProduct(id, updateData) {
    const idx = this.data.products.findIndex(p => p.id === id);
    if (idx === -1) throw new Error("ไม่พบสินค้า");
    this.data.products[idx] = { ...this.data.products[idx], ...updateData };
    this.save();
    return this.data.products[idx];
  }

  deleteProduct(id) {
    const idx = this.data.products.findIndex(p => p.id === id);
    if (idx === -1) throw new Error("ไม่พบสินค้า");
    const deleted = this.data.products.splice(idx, 1)[0];
    this.data.settings.stats.itemsAvailable = this.data.products.length;
    this.save();
    return deleted;
  }

  // License Keys
  addLicenseKeys(productId, keys) {
    if (!this.data.licenseKeys[productId]) {
      this.data.licenseKeys[productId] = [];
    }
    const cleanKeys = keys.map(k => k.trim()).filter(Boolean);
    this.data.licenseKeys[productId].push(...cleanKeys);
    
    // Update product stock
    const product = this.getProductById(productId);
    if (product) {
      product.stock = this.data.licenseKeys[productId].length;
    }
    this.save();
    return this.data.licenseKeys[productId].length;
  }

  getLicenseKeyStock(productId) {
    return (this.data.licenseKeys[productId] || []).length;
  }

  generateFallbackKey(prefix = "KEY") {
    const randomHex = () => Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${randomHex()}-${randomHex()}-${randomHex()}-BULL`;
  }

  generateAutoPosterKey(plan = 'VIP', daysValid = 99999, orderId = '') {
    const cleanPlan = (plan || 'VIP').trim().toUpperCase();
    const randPart = () => crypto.randomBytes(3).toString('hex').toUpperCase();
    return `IBUKI-${cleanPlan}-${randPart()}-${randPart()}-${randPart()}`;
  }

  syncAutoPosterLicense(licenseRecord) {
    const licenseFiles = [
      path.resolve(__dirname, '..', '..', 'โปรแกรมAuto', 'license-server', 'dist', 'licenses.json'),
      path.resolve(__dirname, '..', '..', 'โปรแกรมAuto', 'license-server', 'licenses.json'),
    ];

    for (const filePath of licenseFiles) {
      try {
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        let list = [];
        if (fs.existsSync(filePath)) {
          const raw = fs.readFileSync(filePath, 'utf-8');
          try { list = JSON.parse(raw); } catch { list = []; }
        }
        const existingIdx = list.findIndex(l => l.key.toUpperCase() === licenseRecord.key.toUpperCase());
        if (existingIdx >= 0) {
          list[existingIdx] = { ...list[existingIdx], ...licenseRecord };
        } else {
          list.unshift(licenseRecord);
        }
        fs.writeFileSync(filePath, JSON.stringify(list, null, 2), 'utf-8');
      } catch (err) {
        console.error(`[LicenseSync] Warning for ${filePath}:`, err.message);
      }
    }

    // Attempt notifying running License Server API if active
    fetch('http://localhost:3000/api/register-web-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(licenseRecord)
    }).catch(() => {});
  }

  consumeLicenseKey(productId) {
    const keys = this.data.licenseKeys[productId];
    if (keys && keys.length > 0) {
      const key = keys.shift();
      const product = this.getProductById(productId);
      if (product) {
        product.stock = Math.max(0, product.stock - 1);
      }
      this.save();
      return key;
    }
    
    // If no pre-seeded key, auto-generate unique key
    const product = this.getProductById(productId);
    const prefix = product ? product.name.slice(0, 5).toUpperCase().replace(/[^A-Z0-9]/g, '') : "PROD";
    return this.generateFallbackKey(prefix);
  }

  // Orders
  createOrder({ userId, productId, planId, machineId }) {
    const user = this.getUserById(userId);
    if (!user) throw new Error("ไม่พบผู้ใช้งาน");

    const product = this.getProductById(productId);
    if (!product) throw new Error("ไม่พบสินค้านี้");

    let selectedPlan = null;
    let orderPrice = product.price;

    if (product.plans && product.plans.length > 0) {
      if (planId) {
        selectedPlan = product.plans.find(p => p.id === planId) || product.plans[0];
      } else {
        selectedPlan = product.plans[0];
      }
      orderPrice = selectedPlan.price;
    }

    if (user.balance < orderPrice) {
      throw new Error(`ยอดเงินคงเหลือไม่พอ (ขาดอีก ${(orderPrice - user.balance).toLocaleString()} บาท) กรุณาเติมเงิน`);
    }

    // Deduct balance
    user.balance -= orderPrice;

    const orderId = "ORD-" + Math.floor(100000 + Math.random() * 900000);
    const isAutoPoster = product.id === 'prod_autoposter' || product.requiresMachineId;

    let licenseKey = null;
    let boundMid = (machineId && machineId.trim()) ? machineId.trim().toUpperCase() : null;
    let licenseStatus = 'active';

    const planDurationDays = selectedPlan ? selectedPlan.durationDays : 99999;
    const planCode = selectedPlan ? (selectedPlan.planCode || 'VIP') : 'VIP';
    const planName = selectedPlan ? selectedPlan.name : 'ซื้อสิทธิ์ถาวร (ตลอดชีพ)';
    const isLifetime = selectedPlan ? (selectedPlan.isLifetime ?? (planDurationDays >= 9999)) : true;
    const expiresAt = isLifetime ? 'LIFETIME' : new Date(Date.now() + planDurationDays * 24 * 60 * 60 * 1000).toISOString();

    if (isAutoPoster) {
      licenseKey = this.generateAutoPosterKey(planCode, planDurationDays, orderId);
      this.syncAutoPosterLicense({
        key: licenseKey,
        plan: planCode,
        customerName: user.displayName || user.username,
        maxDevices: 99,
        boundDevices: [],
        createdAt: new Date().toISOString(),
        expiresAt: expiresAt,
        status: 'active',
        source: 'web_store',
        orderId: orderId,
        webUsername: user.username,
        planName: planName,
        notes: `สั่งซื้อผ่านเว็บ IbukiHub (คำสั่งซื้อ #${orderId}, สมาชิก: ${user.username}, แพ็กเกจ: ${planName})`
      });
    } else {
      licenseKey = this.consumeLicenseKey(productId);
    }

    // Update product stats
    product.soldCount = (product.soldCount || 0) + 1;

    // Update overall stats
    this.data.settings.stats.totalSalesBath += orderPrice;
    this.data.settings.stats.totalSold += 1;

    // Create order record
    const order = {
      id: orderId,
      userId: user.id,
      username: user.username,
      productId: product.id,
      productName: product.name,
      planId: selectedPlan ? selectedPlan.id : null,
      planName: planName,
      planCode: planCode,
      durationDays: planDurationDays,
      isLifetime: isLifetime,
      expiresAt: expiresAt,
      price: orderPrice,
      licenseKey,
      machineId: boundMid,
      licenseStatus,
      source: 'web_store',
      fileName: product.fileName || "software_package.zip",
      fileSize: product.fileSize || "Ready to download",
      createdAt: new Date().toISOString(),
      status: "completed"
    };

    this.data.orders.unshift(order);
    this.save();

    return { order, remainingBalance: user.balance };
  }

  bindMachineIdToOrder({ userId, orderId, machineId }) {
    if (!machineId || !machineId.trim()) {
      throw new Error("กรุณาระบุ Machine ID ของเครื่องคุณ");
    }
    const cleanMid = machineId.trim().toUpperCase();

    const order = this.data.orders.find(o => o.id === orderId && (o.userId === userId || !userId));
    if (!order) throw new Error("ไม่พบรายการคำสั่งซื้อนี้");

    const user = this.getUserById(order.userId);
    const planDurationDays = order.durationDays || 99999;
    const planCode = order.planCode || 'VIP';
    const planName = order.planName || 'ซื้อสิทธิ์ถาวร (ตลอดชีพ)';
    const isLifetime = order.isLifetime !== false && planDurationDays >= 9999;
    const expiresAt = isLifetime ? 'LIFETIME' : (order.expiresAt || new Date(Date.now() + planDurationDays * 24 * 60 * 60 * 1000).toISOString());

    if (!order.licenseKey) {
      order.licenseKey = this.generateAutoPosterKey(planCode, planDurationDays, order.id);
    }

    order.machineId = cleanMid;
    order.licenseStatus = 'active';
    order.source = 'web_store';

    this.syncAutoPosterLicense({
      key: order.licenseKey,
      plan: planCode,
      customerName: user ? (user.displayName || user.username) : order.username,
      maxDevices: 1,
      boundDevices: [
        {
          machineId: cleanMid,
          activatedAt: new Date().toISOString(),
          lastSeenAt: new Date().toISOString()
        }
      ],
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt,
      status: 'active',
      source: 'web_store',
      orderId: order.id,
      webUsername: order.username,
      planName: planName,
      notes: `สั่งซื้อผ่านเว็บ IbukiHub (คำสั่งซื้อ #${order.id}, สมาชิก: ${order.username}, แพ็กเกจ: ${planName})`
    });

    this.save();
    return order;
  }

  recordDesktopActivation(key, machineId) {
    if (!key || !machineId) return null;
    const normalizedKey = key.trim().toUpperCase();
    const cleanMid = machineId.trim().toUpperCase();
    const order = this.data.orders.find(o => o.licenseKey && o.licenseKey.trim().toUpperCase() === normalizedKey);
    if (order) {
      order.machineId = cleanMid;
      this.save();
      return order;
    }
    return null;
  }

  getOrdersByUser(userId) {
    return this.data.orders.filter(o => o.userId === userId);
  }

  getAllOrders() {
    return this.data.orders;
  }

  // Top-ups
  createTopup({ userId, amount, channel = "PromptPay QR" }) {
    const user = this.getUserById(userId);
    if (!user) throw new Error("ไม่พบผู้ใช้งาน");

    const topup = {
      id: "TOP-" + Math.floor(10000 + Math.random() * 90000),
      userId: user.id,
      username: user.username,
      amount: Number(amount),
      channel,
      status: "approved",
      createdAt: new Date().toISOString()
    };

    user.balance = (user.balance || 0) + Number(amount);
    this.data.topups.unshift(topup);
    this.save();

    return { topup, newBalance: user.balance };
  }

  getAllTopups() {
    return this.data.topups;
  }

  // Members Management
  getAllMembers() {
    return this.data.users.map(u => {
      const userOrders = this.data.orders.filter(o => o.userId === u.id || o.username === u.username);
      const userTopups = this.data.topups.filter(t => t.userId === u.id || t.username === u.username);
      const totalSpent = userOrders.reduce((sum, o) => sum + (Number(o.price) || 0), 0);
      const totalToppedUp = userTopups.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
      const boundMachineIds = Array.from(new Set(userOrders.map(o => o.machineId).filter(Boolean)));
      const latestMachineId = boundMachineIds.length > 0 ? boundMachineIds[0] : "-";

      let method = "สมัครผ่านหน้าเว็บ";
      if (u.username === 'ibuki' || u.id === 'usr_admin_ibuki' || u.isRootAdmin) {
        method = "👑 แอดมินหลักระบบ (ไอดีแม่)";
      } else if (u.facebookId) {
        method = `Facebook (ID: ${u.facebookId})`;
      } else if (u.email && u.email.endsWith('@gmail.com')) {
        method = `Gmail OTP (${u.email})`;
      } else if (u.phone && u.phone !== '-') {
        method = `เบอร์โทรศัพท์ (${u.phone})`;
      } else if (u.email && u.email !== '-') {
        method = `อีเมล (${u.email})`;
      }

      return {
        id: u.id,
        username: u.username,
        displayName: u.displayName || u.username,
        email: u.email || "-",
        phone: u.phone || "-",
        password: u.password || "-", // Explicitly requested by user: "รหัสอะไรสมัคร"
        role: u.role || "member",
        balance: u.balance || 0,
        facebookId: u.facebookId || null,
        avatar: u.avatar || null,
        registrationMethod: method,
        orderCount: userOrders.length,
        totalSpent,
        topupCount: userTopups.length,
        totalToppedUp,
        machineId: latestMachineId,
        boundMachineIds,
        createdAt: u.createdAt || new Date().toISOString()
      };
    });
  }

  setMemberBalance(userId, newBalance) {
    const user = this.getUserById(userId);
    if (!user) throw new Error("ไม่พบสมาชิกนี้");
    user.balance = Math.max(0, Number(newBalance));
    this.save();
    return user;
  }

  deleteMember(userId) {
    const idx = this.data.users.findIndex(u => u.id === userId);
    if (idx === -1) throw new Error("ไม่พบสมาชิกนี้");
    const target = this.data.users[idx];
    if (target.username === 'ibuki' || target.id === 'usr_admin_ibuki' || target.isRootAdmin) {
      throw new Error("ไม่สามารถลบบัญชีหลักของร้านได้ (ไอดีแม่ Ibuki)");
    }
    if (target.role === 'admin') {
      throw new Error("ไม่สามารถลบบัญชีผู้ดูแลระบบ (Admin) ได้");
    }
    const deleted = this.data.users.splice(idx, 1)[0];
    this.save();
    return deleted;
  }

  // Stats
  getCategories() {
    return this.data.categories || [];
  }

  getDashboardStats() {
    return {
      stats: this.data.settings.stats,
      totalOrders: this.data.orders.length,
      totalUsers: this.data.users.length,
      totalProducts: this.data.products.length,
      recentOrders: this.data.orders.slice(0, 8),
      recentTopups: this.data.topups.slice(0, 8)
    };
  }
}

export const db = new Database();
