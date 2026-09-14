import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const TRANSLATIONS = {
  th: {
    // Brand & General
    brandName: "IbukiHub",
    brandSubtitle: "Software & Creator Studio",
    announcementPrefix: "ประกาศร้านค้า:",
    announcementText: "ยินดีต้อนรับสู่ IbukiHub ศูนย์รวมซอฟต์แวร์เดสก์ท็อป ซื้อแล้วจบเลย แตกไฟล์ใช้งานได้ทันทีตลอดชีพ ไม่ต้องใส่คีย์ ระบบเปิดสิทธิ์ดาวน์โหลดอัตโนมัติ 24 ชม.",
    currency: "฿",
    baht: "บาท",
    itemCountSuffix: "รายการ",

    // Navbar
    navSearchPlaceholder: "ค้นหาซอฟต์แวร์, เครื่องมือ, เวอร์ชัน...",
    navSearchBtn: "ค้นหา",
    navCategories: "หมวดหมู่",
    navAllSoftware: "ซอฟต์แวร์ทั้งหมด",
    navDownloadCategory: "จัดการไฟล์และดาวน์โหลด",
    navLibrary: "คลังโปรแกรม",
    navTopup: "เติมเงิน",
    navSignIn: "เข้าสู่ระบบ",
    navRegister: "สมัครสมาชิก",
    navSignOut: "ออกจากระบบ",
    navBalance: "เครดิต",
    navAdmin: "แอดมิน",

    // Quick Actions
    qaCatalogTitle: "ซอฟต์แวร์ทั้งหมด",
    qaCatalogSubtitle: "โปรแกรมและระบบที่พัฒนาขึ้น",
    qaLibraryTitle: " คลังซอฟแวร์ของฉัน",
    qaLibrarySubtitle: "ดาวน์โหลดไฟล์ .zip ได้ตลอดชีพ (ซื้อแล้วจบเลย)",
    qaWalletTitle: "กระเป๋าเงิน & เติมเงิน",
    qaWalletSubtitle: "พร้อมเพย์ QR และทรูมันนี่",
    qaAccountTitle: "เข้าสู่ระบบ / บัญชี",
    qaAccountSubtitle: "จัดการโปรไฟล์และประวัติการซื้อ",

    // Stats Bar
    statItemsAvailable: "ซอฟต์แวร์พร้อมจำหน่าย",
    statTotalSold: "ยอดคำสั่งซื้อสำเร็จ",
    statTotalSales: "ยอดขายสะสมรวม",
    statTotalMembers: "สมาชิกในระบบ",

    // Hero Section
    heroBadgeTop: "รุ่นท็อป 2-in-1",
    heroBadgeBudget: "ราคาสบายกระเป๋า",
    heroSelectPackage: "คลิกเพื่อเลือกแพ็กเกจที่คุณต้องการ",
    heroPackageSelector: "เลือกแพ็กเกจซอฟต์แวร์",
    heroBtnViewDetails: "ดูข้อมูลโปรแกรม",
    heroBtnBuyNow: "ซื้อทันที",
    heroFeature1: "ไม่ต้องติดตั้ง (Portable) แตกไฟล์ใช้งานได้ทันที",
    heroFeature2: "ซื้อแล้วจบเลย แตกไฟล์ใช้งานได้ตลอดชีพ ไม่ต้องใส่คีย์",
    heroFeature3: "ระบบส่งมอบไฟล์โปรแกรมและเปิดสิทธิ์ออโต้ 24 ชม.",
    heroPriceWas: "ลดจาก",

    // Catalog Section
    catalogTitle: "รายการซอฟต์แวร์และโปรแกรม",
    catalogSubtitle: "เปิดสิทธิ์ดาวน์โหลดไฟล์โปรแกรมแท้ทันทีหลังชำระเงิน ซื้อครั้งเดียวจบ ใช้งานได้ตลอดชีพ",
    catalogSortLabel: "เรียงลำดับ:",
    catalogSortPopular: "ยอดนิยม",
    catalogSortPriceAsc: "ราคา: ต่ำ ➔ สูง",
    catalogSortPriceDesc: "ราคา: สูง ➔ ต่ำ",
    catalogAll: "ทั้งหมด",
    catalogNotFound: "ไม่พบซอฟต์แวร์ที่ตรงกับการค้นหา",
    catalogNotFoundSub: "ลองเปลี่ยนคำค้นหา หรือเลือกหมวดหมู่อื่นเพื่อค้นหาโปรแกรมที่ต้องการ",

    // Product Card & Products
    cardOneTimeBadge: "ซื้อแล้วจบเลย แตกไฟล์ใช้ได้ตลอดชีพ",
    cardBtnDetails: "รายละเอียด",
    cardBtnBuy: "สั่งซื้อทันที",
    cardSold: "ขายแล้ว",
    cardStock: "สต็อก",
    cardUnit: "ชิ้น",

    // Products translation
    prod25_badge: "รุ่นท็อป 2-in-1",
    prod25_name: "IbukiDownload V.2.5",
    prod25_shortDesc: "⚡ IbukiDownload v2.5 โปรแกรมรวมฟังก์ชันจัดการไฟล์มัลติมีเดียและเอกสารแบบ 2-in-1 ในโปรแกรมเดียว ออกแบบมาให้ใช้งานง่าย รวดเร็ว และไม่ต้องง้อเว็บแปลงไฟล์ออนไลน์ที่เสี่ยงต่อความปลอดภัย",
    prod25_feat1: "รวม 2 ฟังก์ชันในโปรแกรมเดียว: Media Downloader & Document Converter",
    prod25_feat2: "ระบบ Batch & Auto-Deduplication วางหลายลิงก์หรือไฟล์ .txt ป้องกันโหลดซ้ำ",
    
    prod22_badge: "เวอร์ชันแนะนำ",
    prod22_name: "IbukiDownload V.2.2",
    prod22_shortDesc: "⚡ IbukiDownload v2.2 (รุ่นเน้นดูดคลิป & เพลง ราคาสบายกระเป๋า) โหลดพร้อมกันหลายลิงก์ คมชัดสูงสุดระดับ Best Quality",
    prod22_feat1: "เน้นฟังก์ชันดาวน์โหลดคลิปและแยกไฟล์เสียงเต็มรูปแบบ (Video & Audio)",
    prod22_feat2: "โหลดพร้อมกันหลายลิงก์ รองรับวางหลายๆ ลิงก์พร้อมกัน ป้องกันลิงก์ซ้ำ",

    // My Library Modal
    libraryTitle: " คลังซอฟแวร์ของฉัน",
    librarySubtitle: "รายการโปรแกรมที่คุณสั่งซื้อแล้ว สามารถดาวน์โหลดไฟล์ .zip ได้ตลอดเวลา ซื้อแล้วจบเลยใช้งานได้ตลอดชีพ",
    libraryLoading: "กำลังโหลดรายการซอฟต์แวร์ของคุณ...",
    libraryEmpty: "คลังโปรแกรมของคุณว่างเปล่า",
    libraryOrderLabel: "คำสั่งซื้อ #",
    libraryLifetimeLicense: "ลิขสิทธิ์ตลอดชีพ",
    libraryReady: "พร้อมใช้งาน",
    libraryNotice: "⚡ ซื้อแล้วจบเลย แตกไฟล์ .zip เปิดใช้งานได้ทันที (ไม่ต้องใส่ License Key)",
    libraryFileLabel: "ไฟล์:",
    libraryDownloadBtn: "ดาวน์โหลดไฟล์โปรแกรม (.zip)",

    // Buy Modal
    buyTitle: "ยืนยันการสั่งซื้อโปรแกรม",
    buySubtitle: "ระบบจะตัดยอดเงินจากกระเป๋าของคุณ และเปิดสิทธิ์ดาวน์โหลดไฟล์โปรแกรมให้ทันที",
    buyCurrentBalance: "ยอดเงินคงเหลือของคุณ:",
    buyProductPrice: "ราคาซอฟต์แวร์:",
    buyBalanceAfter: "ยอดเงินคงเหลือหลังสั่งซื้อ:",
    buyInsufficientBalance: "ยอดเงินคงเหลือไม่พอ",
    buyInsufficientDesc: "คุณมียอดเงินไม่เพียงพอสำหรับการสั่งซื้อนี้ กรุณาเติมเงินเข้าสู่ระบบก่อนทำรายการ",
    buyBtnTopup: "ไปหน้าเติมเงิน",
    buyBtnConfirm: "ยืนยันการชำระเงิน",
    buyBtnCancel: "ยกเลิก",
    buyProcessing: "กำลังประมวลผลคำสั่งซื้อ...",
    buySuccessTitle: "สั่งซื้อสำเร็จ พร้อมใช้งานทันที",
    buySuccessSub: "ระบบเปิดสิทธิ์ดาวน์โหลดไฟล์โปรแกรมให้คุณเรียบร้อยแล้ว แตกไฟล์ใช้งานได้ทันที",
    buyNoKeyTitle: "ตัวนี้ซื้อแล้วจบเลย! ไม่ต้องใส่ License Key",
    buyNoKeyDesc: "แตกไฟล์ .zip แล้วเปิดโปรแกรมใช้งานได้ทันทีตลอดชีพ ไม่มีหมดอายุ",
    buyPackageFile: "ไฟล์แพ็กเกจ:",
    buyDownloadZip: "ดาวน์โหลดไฟล์ซอฟต์แวร์ (.zip)",
    buyExtractHint: "แตกไฟล์ .zip จากนั้นดับเบิลคลิกเปิดโปรแกรมใช้งานได้ทันที (ไม่ต้องกรอกคีย์ใดๆ ทั้งสิ้น)",
    buyOpenLibrary: "เปิดคลังของฉัน",
    buyDone: "เสร็จสิ้น",
    buyNeedLogin: "กรุณาเข้าสู่ระบบก่อนทำรายการสั่งซื้อ",
    buyShortBalance: "ยอดเงินไม่พอ (ขาดอีก ฿",
    buyTopupBtn: "เติมเงิน",

    // Product Details Modal
    modalVersion: "เวอร์ชัน",
    modalFileSize: "ขนาดไฟล์",
    modalSystemReq: "ความต้องการของระบบ:",
    modalKeyFeatures: "คุณสมบัติและความสามารถเด่น",
    modalDescription: "รายละเอียดและคำอธิบายซอฟต์แวร์",
    modalBtnClose: "ปิดหน้าต่าง",
    modalBtnBuyNow: "สั่งซื้อทันที",
    modalLivePreview: "ตัวอย่างหน้าตาโปรแกรม (Live Program Preview)",
    modalScreenshotBadge: "ภาพถ่ายจริงจากโปรแกรม",
    modal3DHint: "ขยับเมาส์เพื่อสัมผัสมิติ 3D Parallax ของหน้าต่างโปรแกรม",
    modalPriceLifetime: "ราคาจัดจำหน่าย (สิทธิ์ใช้งานตลอดชีพ)",
    modalSpecialDiscount: "ลดราคาพิเศษ",
    modalStockStatus: "สถานะสต็อก",
    modalStockReady: "พร้อมจัดส่งทันที",
    modalFileName: "ชื่อไฟล์สำหรับดาวน์โหลด:",
    modalDelivery: "การส่งมอบ:",
    modalDeliveryDesc: "ซื้อแล้วจบเลย แตกไฟล์ใช้งานได้ทันทีตลอดชีพ ไม่ต้องใส่คีย์ เปิดสิทธิ์ดาวน์โหลดไฟล์จริงทันที 24 ชม.",
    modalPaymentSupport: "รองรับระบบชำระเงินผ่านกระเป๋าเงิน (Wallet) ซองทรูมันนี่ พร้อมเพย์ QR",

    // Topup Page
    topupTitle: "TOPUP CREDIT",
    topupSubtitle: "เติมเงินเข้าบัญชี",
    topupTabTrueMoney: "ซองของขวัญ TrueMoney Wallet",
    topupTabPromptPay: "พร้อมเพย์ QR Code",
    topupWalletNotice: "กรุณาสร้างซองของขวัญ TrueMoney Wallet แล้วนำลิงก์มาวางในช่องด้านล่าง",
    topupWalletInputPlaceholder: "วางลิงก์ซองของขวัญ เช่น https://gift.truemoney.com/campaign/?v=...",
    topupWalletSubmitBtn: "ยืนยันการเติมเงินด้วยซองของขวัญ",
    topupVerifying: "กำลังตรวจสอบและดึงเงินจากซองของขวัญ...",
    topupBackToShop: "กลับหน้าร้านค้า",
    topupCardQrSub: "เติมเงินผ่านคิวอาร์โค้ด",
    topupFee1: "ค่าธรรมเนียม 1%",
    topupCardWalletSub: "เติมเงินส่งซองของขวัญ",
    topupFee0: "ค่าธรรมเนียม 0% (ฟรี)",
    topupSelected: "✓ กำลังเลือกช่องทางนี้",
    topupClickToSelect: "คลิกเพื่อเติมเงิน",

    // Auth Page
    authSigninHead: "Signin",
    authSigninSub: "เข้าสู่ระบบผู้ใช้งาน",
    authMemberSignin: "เข้าสู่ระบบสมาชิก",
    authUsernameOrEmail: "Username หรือ Email",
    authPassword: "Password",
    authRemember: "จดจำการเข้าสู่ระบบตลอดเวลา",
    authSigninSubmit: "เข้าสู่ระบบ",
    authSigningIn: "กำลังเข้าสู่ระบบ...",
    authRegisterBtn: "สมัครสมาชิก",
    authForgotBtn: "ลืมรหัสผ่าน",
    authDemoHeading: "เข้าสู่ระบบด่วนสำหรับทดสอบระบบ:",
    authDemoCustomer: "ลูกค้า: user1 (500฿)",
    authDemoAdmin: "แอดมิน: admin",

    authSignupHead: "Signup member",
    authFbSignup: "สมัครสมาชิกด้วย Facebook",
    authFieldUsername: "Username",
    authPlaceholderUsername: "ชื่อผู้ใช้งาน",
    authFieldPassword: "Password",
    authPlaceholderPassword: "รหัสผ่าน",
    authFieldConfirmPassword: "Confirm password",
    authPlaceholderConfirmPassword: "ยืนยันรหัสผ่าน",
    authFieldDisplayName: "ชื่อเล่นแสดง:",
    authPlaceholderDisplayName: "ชื่อเล่นแสดง",
    authFieldEmail: "อีเมล์:",
    authPlaceholderEmail: "อีเมล์",
    authFieldPhone: "เบอร์โทรศัพท์ (10 หลัก):",
    authPlaceholderPhone: "08xxxxxxxx (10 หลัก)",
    authPhoneMaxDigitsNotice: "เบอร์โทรศัพท์ 10 หลัก (ห้ามใส่เกิน 10 ตัว)",
    authSendOtpBtn: "ขอรหัส OTP ทาง SMS",
    authSendingOtp: "กำลังส่ง SMS...",
    authOtpField: "รหัสยืนยัน OTP:",
    authOtpPlaceholder: "กรอกรหัส 6 หลักจาก SMS",
    authOtpRefText: "รหัสอ้างอิง Ref:",
    authResendOtpIn: "ขอรหัสใหม่ได้ใน",
    authResendOtpBtn: "ขอรหัสใหม่",
    authPhoneMust10: "กรุณากรอกเบอร์โทรศัพท์ให้ครบ 10 หลัก (เฉพาะตัวเลข)",
    authOtpRequired: "กรุณากรอกรหัส OTP 6 หลักที่ได้รับทาง SMS",
    authFbSignin: "เข้าสู่ระบบด้วย Facebook",

    authTermsPrefix: "ข้าพเจ้ายอมรับ",
    authTermsLink: "เงื่อนไขและข้อตกลง",
    authTermsSuffix: "การใช้บริการ",
    authSignupSubmit: "สมัครสมาชิก",
    authSigningUp: "กำลังสมัครสมาชิก...",
    authBackToSignin: "กลับไปหน้าเข้าสู่ระบบ",
    authBackToShop: "กลับไปยังหน้าร้านค้า",
    authTopupNotice: "กรุณาเข้าสู่ระบบก่อน เพื่อดำเนินการเติมเงินเข้าบัญชีของคุณ",

    authResetHead: "รีเซ็ตรหัสผ่าน (Reset Password)",
    authResetSub: "กรอกเบอร์โทรศัพท์ (10 หลัก) หรืออีเมล เพื่อรับรหัส OTP และลิงก์เปลี่ยนรหัสผ่าน",
    authForgotPhoneOrEmail: "เบอร์โทรศัพท์ (10 หลัก) หรือ อีเมล:",
    authForgotPlaceholder: "กรอกเบอร์โทรศัพท์ (เช่น 08xxxxxxxx) หรือ อีเมล",
    authForgotRequestBtn: "ขอรหัส OTP เพื่อเปลี่ยนรหัสผ่าน",
    authForgotSending: "กำลังส่งรหัส...",
    authResetTitle: "ตั้งรหัสผ่านใหม่ (Set New Password)",
    authResetSubtitle: "กรุณากรอกรหัสผ่านใหม่ 2 ครั้งให้ตรงกัน (เพื่อกันลืม) และระบุรหัส OTP",
    authResetNewPassword: "รหัสผ่านใหม่ (New Password):",
    authResetConfirmPassword: "ยืนยันรหัสผ่านใหม่อีกครั้ง (Confirm Password) - เพื่อกันลืม:",
    authResetPlaceholderConfirm: "กรอกรหัสผ่านใหม่อีกครั้งเพื่อกันลืม",
    authResetMatch: "✓ รหัสผ่านตรงกันเรียบร้อยแล้ว",
    authResetMismatch: "✕ รหัสผ่านทั้ง 2 ช่องยังไม่ตรงกัน",
    authResetSubmitBtn: "บันทึกรหัสผ่านใหม่และเข้าสู่ระบบ",
    authNewPassword: "รหัสผ่านใหม่",
    authSubmitReset: "เปลี่ยนรหัสผ่านและเข้าสู่ระบบ",

    // Captcha
    captchaNotRobot: "ฉันไม่ใช่โปรแกรมอัตโนมัติ",
    captchaPrivacy: "ความเป็นส่วนตัว",
    captchaTerms: "ข้อกำหนด",
    captchaChallengeTitle: "เลือกรูปภาพทั้งหมดที่มี",
    captchaChallengeSub: "คลิกยืนยันเมื่อเลือกครบทั้งหมด",
    captchaVerifyBtn: "ยืนยัน",
    captchaRefreshBtn: "โจทย์ใหม่",
    captchaWrongAlert: "การเลือกรูปภาพยังไม่ถูกต้อง โปรดลองใหม่อีกครั้ง",
    captchaVerifiedSuccess: "ยืนยันตัวตนสำเร็จ คุณไม่ใช่บอท",

    // Footer Guarantees & Links
    guarantee1_title: "จัดส่งคีย์และไฟล์อัตโนมัติ",
    guarantee1_desc: "ทำรายการเสร็จสิ้น รับสิทธิ์ดาวน์โหลดและคีย์ทันที 24 ชม.",
    guarantee2_title: "ปลอดภัย ไร้มัลแวร์ 100%",
    guarantee2_desc: "พัฒนาเอง ผ่านการตรวจสอบและทดสอบก่อนปล่อยเวอร์ชัน",
    guarantee3_title: "บริการหลังการขาย",
    guarantee3_desc: "มีข้อสงสัยหรือติดปัญหาการใช้งาน ติดต่อทาง Facebook / Discord ได้เสมอ",

    footerFeatured: "ซอฟต์แวร์แนะนำ",
    footerSupport: "การดูแลและติดต่อ",
    footerAdminLogin: "เข้าสู่ระบบ Admin",
    footerDesc: "IbukiHub ศูนย์รวมโปรแกรมและซอฟต์แวร์เดสก์ท็อปคุณภาพสูง ซื้อแล้วจบเลย แตกไฟล์ใช้งานได้ตลอดชีพ",
    footerQuickLinks: "ลิงก์ด่วน",
    footerCopyright: "© 2026 Bull Software Studio. สงวนลิขสิทธิ์ทุกประการ."
  },
  en: {
    // Brand & General
    brandName: "IbukiHub",
    brandSubtitle: "Software & Creator Studio",
    announcementPrefix: "Notice:",
    announcementText: "Welcome to IbukiHub Desktop Software Hub. One-time purchase, instant zip download, lifetime access without license keys. 24/7 automated delivery.",
    currency: "฿",
    baht: "THB",
    itemCountSuffix: "items",

    // Navbar
    navSearchPlaceholder: "Search software, tools, versions...",
    navSearchBtn: "Search",
    navCategories: "Categories",
    navAllSoftware: "All Software",
    navDownloadCategory: "File & Media Download",
    navLibrary: "My Library",
    navTopup: "Top Up",
    navSignIn: "Sign In",
    navRegister: "Register",
    navSignOut: "Sign Out",
    navBalance: "Credits",
    navAdmin: "Admin",

    // Quick Actions
    qaCatalogTitle: "All Software",
    qaCatalogSubtitle: "Developed tools & programs",
    qaLibraryTitle: "My Software Library",
    qaLibrarySubtitle: "Download .zip files anytime (Lifetime access)",
    qaWalletTitle: "Wallet & Top Up",
    qaWalletSubtitle: "PromptPay QR & TrueMoney",
    qaAccountTitle: "Sign In / Account",
    qaAccountSubtitle: "Manage your profile & orders",

    // Stats Bar
    statItemsAvailable: "Available Software",
    statTotalSold: "Completed Orders",
    statTotalSales: "Total Sales Volume",
    statTotalMembers: "Registered Members",

    // Hero Section
    heroBadgeTop: "2-in-1 Flagship",
    heroBadgeBudget: "Budget Friendly",
    heroSelectPackage: "Click to choose your preferred package",
    heroPackageSelector: "Select Software Package",
    heroBtnViewDetails: "View Details",
    heroBtnBuyNow: "Buy Now",
    heroFeature1: "Portable Edition (No setup required, extract & run)",
    heroFeature2: "One-time purchase, lifetime access without keys",
    heroFeature3: "24/7 instant automated file access & delivery",
    heroPriceWas: "Was",

    // Catalog Section
    catalogTitle: "Software Catalog",
    catalogSubtitle: "Instant genuine file download access right after purchase. Lifetime access, one-time payment.",
    catalogSortLabel: "Sort by:",
    catalogSortPopular: "Popular",
    catalogSortPriceAsc: "Price: Low ➔ High",
    catalogSortPriceDesc: "Price: High ➔ Low",
    catalogAll: "All",
    catalogNotFound: "No software found matching your search",
    catalogNotFoundSub: "Try changing search terms or selecting another category to find what you need.",

    // Product Card & Products
    cardOneTimeBadge: "One-time purchase, extract & use for lifetime",
    cardBtnDetails: "Details",
    cardBtnBuy: "Buy Now",
    cardSold: "Sold",
    cardStock: "Stock",
    cardUnit: "units",

    // Products translation
    prod25_badge: "2-in-1 Flagship",
    prod25_name: "IbukiDownload V.2.5",
    prod25_shortDesc: "⚡ IbukiDownload v2.5 - All-in-one 2-in-1 Media Downloader and High-Fidelity Document Converter. Fast, reliable, and virus-free without online conversion risks.",
    prod25_feat1: "2-in-1 Suite: Media Downloader & Document Converter",
    prod25_feat2: "Batch & Auto-Deduplication: Multi-link and .txt list support",

    prod22_badge: "Recommended",
    prod22_name: "IbukiDownload V.2.2",
    prod22_shortDesc: "⚡ IbukiDownload v2.2 (Media & Audio Downloader at budget price) Multi-link simultaneous downloads in Best Quality.",
    prod22_feat1: "Full Video & Audio separation (MP4, MKV, MP3)",
    prod22_feat2: "Multi-link batch download with auto-deduplication",

    // My Library Modal
    libraryTitle: "My Software Library",
    librarySubtitle: "Your purchased software. Download .zip files anytime with lifetime access.",
    libraryLoading: "Loading your software library...",
    libraryEmpty: "Your software library is empty",
    libraryOrderLabel: "Order #",
    libraryLifetimeLicense: "Lifetime License",
    libraryReady: "Ready to Use",
    libraryNotice: "⚡ One-time purchase, extract .zip and use immediately (No license key required)",
    libraryFileLabel: "File:",
    libraryDownloadBtn: "Download Software (.zip)",

    // Buy Modal
    buyTitle: "Confirm Software Purchase",
    buySubtitle: "Amount will be deducted from your wallet balance with immediate download access.",
    buyCurrentBalance: "Current Wallet Balance:",
    buyProductPrice: "Software Price:",
    buyBalanceAfter: "Balance After Purchase:",
    buyInsufficientBalance: "Insufficient Balance",
    buyInsufficientDesc: "You don't have enough balance for this purchase. Please top up your wallet first.",
    buyBtnTopup: "Go to Top Up",
    buyBtnConfirm: "Confirm & Pay",
    buyBtnCancel: "Cancel",
    buyProcessing: "Processing your order...",
    buySuccessTitle: "Order Successful! Ready to Use",
    buySuccessSub: "Download access granted. Extract .zip to use immediately.",
    buyNoKeyTitle: "One-time purchase! No License Key required",
    buyNoKeyDesc: "Extract .zip and run the software immediately for lifetime without expiration.",
    buyPackageFile: "Package File:",
    buyDownloadZip: "Download Software (.zip)",
    buyExtractHint: "Extract .zip and double click to run instantly (No key required).",
    buyOpenLibrary: "Open My Library",
    buyDone: "Done",
    buyNeedLogin: "Please sign in before purchasing",
    buyShortBalance: "Insufficient balance (Need ฿",
    buyTopupBtn: "Top Up",

    // Product Details Modal
    modalVersion: "Version",
    modalFileSize: "File Size",
    modalSystemReq: "System Requirements:",
    modalKeyFeatures: "Key Features & Highlights",
    modalDescription: "Software Specifications & Info",
    modalBtnClose: "Close Window",
    modalBtnBuyNow: "Buy Now",
    modalLivePreview: "Live Program Preview",
    modalScreenshotBadge: "Real Program Screenshot",
    modal3DHint: "Move your mouse to experience 3D parallax window depth",
    modalPriceLifetime: "Purchase Price (Lifetime License)",
    modalSpecialDiscount: "Special Offer",
    modalStockStatus: "Stock Status",
    modalStockReady: "Instant Delivery",
    modalFileName: "Download File:",
    modalDelivery: "Delivery:",
    modalDeliveryDesc: "One-time purchase, extract and use immediately for lifetime. No license key needed, 24/7 instant download.",
    modalPaymentSupport: "Supports Wallet, TrueMoney Voucher, and PromptPay QR",

    // Topup Page
    topupTitle: "TOPUP CREDIT",
    topupSubtitle: "Top up your account balance",
    topupTabTrueMoney: "TrueMoney Gift Voucher",
    topupTabPromptPay: "PromptPay QR Code",
    topupWalletNotice: "Please create a TrueMoney Wallet gift voucher and paste the link below",
    topupWalletInputPlaceholder: "Paste gift voucher link, e.g. https://gift.truemoney.com/campaign/?v=...",
    topupWalletSubmitBtn: "Confirm Gift Voucher Top-up",
    topupVerifying: "Verifying and claiming gift voucher...",
    topupBackToShop: "Back to Shop",
    topupCardQrSub: "Top up via QR Code",
    topupFee1: "1% fee",
    topupCardWalletSub: "Top up via TrueMoney Gift Voucher",
    topupFee0: "0% fee (Free)",
    topupSelected: "✓ Selected method",
    topupClickToSelect: "Click to select",

    // Auth Page
    authSigninHead: "Signin",
    authSigninSub: "Sign in to your account",
    authMemberSignin: "Member Sign In",
    authUsernameOrEmail: "Username or Email",
    authPassword: "Password",
    authRemember: "Remember me",
    authSigninSubmit: "Sign In",
    authSigningIn: "Signing in...",
    authRegisterBtn: "Create Account",
    authForgotBtn: "Forgot Password?",
    authDemoHeading: "Quick demo logins for testing:",
    authDemoCustomer: "Member: user1 (500฿)",
    authDemoAdmin: "Admin: admin",

    authSignupHead: "Signup member",
    authFbSignup: "Continue with Facebook",
    authFieldUsername: "Username",
    authPlaceholderUsername: "Enter your username",
    authFieldPassword: "Password",
    authPlaceholderPassword: "Enter your password",
    authFieldConfirmPassword: "Confirm password",
    authPlaceholderConfirmPassword: "Confirm your password",
    authFieldDisplayName: "Display Name:",
    authPlaceholderDisplayName: "Your display name",
    authFieldEmail: "Email:",
    authPlaceholderEmail: "Your email address",
    authFieldPhone: "Phone Number (10 digits):",
    authPlaceholderPhone: "08xxxxxxxx (10 digits)",
    authPhoneMaxDigitsNotice: "10-digit mobile number (numbers only)",
    authSendOtpBtn: "Send SMS OTP",
    authSendingOtp: "Sending SMS...",
    authOtpField: "SMS OTP Code:",
    authOtpPlaceholder: "Enter 6-digit OTP from SMS",
    authOtpRefText: "Ref Code:",
    authResendOtpIn: "Resend in",
    authResendOtpBtn: "Resend OTP",
    authPhoneMust10: "Please enter a valid 10-digit phone number (numbers only)",
    authOtpRequired: "Please enter the 6-digit OTP received via SMS",
    authFbSignin: "Sign in with Facebook",

    authTermsPrefix: "I accept the",
    authTermsLink: "Terms and Conditions",
    authTermsSuffix: "of service",
    authSignupSubmit: "Sign Up",
    authSigningUp: "Creating account...",
    authBackToSignin: "Back to Sign In",
    authBackToShop: "Back to Store",
    authTopupNotice: "Please sign in first to proceed with topping up your account",

    authResetHead: "Reset Password",
    authResetSub: "Enter your 10-digit phone number or email to receive an OTP and reset your password",
    authForgotPhoneOrEmail: "Phone (10 digits) or Email:",
    authForgotPlaceholder: "Enter 10-digit phone (e.g. 08xxxxxxxx) or email",
    authForgotRequestBtn: "Request Password Reset OTP",
    authForgotSending: "Sending OTP...",
    authResetTitle: "Set New Password",
    authResetSubtitle: "Please enter your new password twice (to avoid typos) and provide the OTP code",
    authResetNewPassword: "New Password:",
    authResetConfirmPassword: "Confirm New Password (to prevent forgetting):",
    authResetPlaceholderConfirm: "Re-enter new password to verify",
    authResetMatch: "✓ Passwords match successfully",
    authResetMismatch: "✕ Passwords do not match yet",
    authResetSubmitBtn: "Save New Password & Sign In",
    authNewPassword: "New Password",
    authSubmitReset: "Update Password & Sign In",

    // Captcha
    captchaNotRobot: "I'm not a robot",
    captchaPrivacy: "Privacy",
    captchaTerms: "Terms",
    captchaChallengeTitle: "Select all images with",
    captchaChallengeSub: "Click verify once there are none left",
    captchaVerifyBtn: "Verify",
    captchaRefreshBtn: "New Challenge",
    captchaWrongAlert: "Selection incorrect. Please try again.",
    captchaVerifiedSuccess: "Verification complete",

    // Footer Guarantees & Links
    guarantee1_title: "Instant Key & File Delivery",
    guarantee1_desc: "24/7 automated delivery. Download your software right after payment.",
    guarantee2_title: "100% Secure & Clean",
    guarantee2_desc: "Independently built and rigorously tested before release.",
    guarantee3_title: "Customer Support",
    guarantee3_desc: "Questions or issues? Connect with us anytime on Facebook / Discord.",

    footerFeatured: "Featured Software",
    footerSupport: "Care & Support",
    footerAdminLogin: "Admin Login",
    footerDesc: "IbukiHub - High-performance desktop software studio. One-time purchase, extract and use for lifetime.",
    footerQuickLinks: "Quick Links",
    footerCopyright: "© 2026 Bull Software Studio. All Rights Reserved."
  }
};

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => {
    try {
      return localStorage.getItem('preferred_language') || 'th';
    } catch {
      return 'th';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('preferred_language', lang);
      document.documentElement.lang = lang;
    } catch (e) {
      console.error(e);
    }
  }, [lang]);

  const toggleLang = () => {
    setLang((prev) => (prev === 'th' ? 'en' : 'th'));
  };

  const t = (key) => {
    const dict = TRANSLATIONS[lang] || TRANSLATIONS.th;
    return dict[key] || TRANSLATIONS.th[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
