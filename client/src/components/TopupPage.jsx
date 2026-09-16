import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, QrCode, Gift, CheckCircle2, AlertCircle, 
  Wallet, ShieldCheck, Copy, Check, Sparkles, ExternalLink, RefreshCw,
  Upload, Image as ImageIcon, X
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const QUICK_AMOUNTS = [50, 100, 150, 190, 300, 500, 1000];

export default function TopupPage({ onBackToShop, onOpenAuth }) {
  const { user, updateBalance } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    if (!user) {
      if (onOpenAuth) onOpenAuth('signin');
    }
  }, [user, onOpenAuth]);

  const [selectedMethod, setSelectedMethod] = useState('truewallet'); // 'qrcode' | 'truewallet'

  // Form states
  const [amount, setAmount] = useState(190);
  const [customAmount, setCustomAmount] = useState('');
  const [voucherUrl, setVoucherUrl] = useState('');
  const [message, setMessage] = useState('');

  // Slip upload states
  const [slipFile, setSlipFile] = useState(null);
  const [slipPreview, setSlipPreview] = useState(null);
  const [promptpayInfo, setPromptpayInfo] = useState(null);

  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [error, setError] = useState(null);
  const [copiedPromptPay, setCopiedPromptPay] = useState(false);

  const selectedAmount = customAmount ? parseFloat(customAmount) : amount;

  // Load real PromptPay information & EMVCo QR code
  useEffect(() => {
    const net = ((selectedAmount || 0) * 1.01).toFixed(2);
    fetch(`/api/wallet/promptpay-info?amount=${net}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.promptpay) {
          setPromptpayInfo(data.promptpay);
        }
      })
      .catch(err => console.warn('Could not load PromptPay info:', err));
  }, [selectedAmount]);

  if (!user) {
    return null;
  }

  const handleSelectMethod = (method) => {
    setSelectedMethod(method);
    setError(null);
    setSuccessData(null);
    setTimeout(() => {
      const el = document.getElementById('payment-action-section');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  // Submit handler for TrueMoney Gift Voucher (Matching ibuki-channel)
  const handleTrueMoneyGiftSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      if (onOpenAuth) onOpenAuth('signin');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (!voucherUrl || (!voucherUrl.includes('gift.truemoney.com') && !voucherUrl.includes('v='))) {
        if (voucherUrl.trim().length < 8) {
          throw new Error("กรุณากรอกลิงก์ซองของขวัญ TrueMoney Wallet ที่ถูกต้อง (เช่น https://gift.truemoney.com/campaign/?v=...)");
        }
      }

      const res = await fetch('/api/wallet/truemoney-gift', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id
        },
        body: JSON.stringify({
          voucherUrl: voucherUrl.trim(),
          senderName: user.username || 'สมาชิก IbukiHub',
          message: message.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "การแลกซองของขวัญไม่สำเร็จ");

      updateBalance(data.newBalance);
      setSuccessData({
        amount: data.topup.amount,
        channel: data.topup.channel,
        id: data.topup.id,
        newBalance: data.newBalance,
        senderName: data.topup.senderName,
        message: data.topup.message,
        date: new Date().toLocaleString('th-TH')
      });

      // Clear form
      setVoucherUrl('');
      setMessage('');

      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch (e) {}

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle slip file selection
  const handleSlipChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError("กรุณาเลือกไฟล์รูปภาพสลิปเท่านั้น (.jpg, .png, .jpeg, .webp)");
      return;
    }
    setSlipFile(file);
    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      setSlipPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveSlip = () => {
    setSlipFile(null);
    setSlipPreview(null);
  };

  // Submit handler for QR Code Top-up with Slip Verification
  const handleQRCodeSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      if (onOpenAuth) onOpenAuth('signin');
      return;
    }

    if (!slipFile) {
      setError("กรุณาแนบภาพหลักฐานสลิปการโอนเงินเพื่อตรวจสอบยอดเงิน");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (!selectedAmount || isNaN(selectedAmount) || selectedAmount < 1) {
        throw new Error("กรุณาระบุจำนวนเงินที่ถูกต้องอย่างน้อย 1 บาท");
      }

      const formData = new FormData();
      formData.append('slip', slipFile);
      formData.append('amount', selectedAmount);

      const res = await fetch('/api/wallet/upload-slip', {
        method: 'POST',
        headers: {
          'x-user-id': user.id
        },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "การตรวจสอบสลิปไม่สำเร็จ");

      if (data.verified) {
        updateBalance(data.newBalance);
        setSuccessData({
          amount: data.topup.amount,
          channel: data.topup.channel,
          id: data.topup.id,
          newBalance: data.newBalance,
          date: new Date().toLocaleString('th-TH'),
          message: data.message,
          slipUrl: data.topup.slipUrl,
          verified: true
        });

        try {
          confetti({
            particleCount: 140,
            spread: 85,
            origin: { y: 0.6 }
          });
        } catch (e) {}
      } else {
        // Pending admin manual review
        setSuccessData({
          amount: data.topup.amount,
          channel: data.topup.channel,
          id: data.topup.id,
          newBalance: user.balance,
          date: new Date().toLocaleString('th-TH'),
          message: data.message,
          slipUrl: data.topup.slipUrl,
          pending: true
        });
      }

      setSlipFile(null);
      setSlipPreview(null);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    const cleanNum = text.replace(/[^0-9]/g, '');
    navigator.clipboard.writeText(cleanNum || text);
    setCopiedPromptPay(true);
    setTimeout(() => setCopiedPromptPay(false), 2000);
  };

  return (
    <div className="w-full flex-1 text-purple-100 flex flex-col relative overflow-x-hidden font-sans">
      
      {/* PURPLE ATMOSPHERIC GLOWS (Matching main website) */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 inset-x-0 h-[500px] bg-[radial-gradient(ellipse_at_50%_0%,rgba(168,85,247,0.2)_0%,transparent_70%)]" />
        <div className="absolute top-1/4 left-10 w-96 h-96 rounded-full bg-purple-600/10 blur-[120px]" />
        <div className="absolute top-1/3 right-10 w-96 h-96 rounded-full bg-indigo-600/15 blur-[120px]" />
      </div>

      {/* MAIN CONTENT */}
      <main className="relative z-10 flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col items-center">
        
        {/* Back to Shop Navigation Breadcrumb */}
        <div className="w-full flex items-center justify-between mb-6">
          <button
            onClick={onBackToShop}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-950/60 hover:bg-purple-900/80 border border-purple-400/30 text-purple-200 hover:text-white text-xs sm:text-sm font-semibold transition-all hover:scale-[1.02] active:scale-95 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 text-purple-300" />
            <span>{t('topupBackToShop')}</span>
          </button>
          <span className="text-xs text-purple-400/80 font-medium hidden sm:inline">
            {t('topupSubtitle')}
          </span>
        </div>
        
        {/* HERO TITLE: "TOPUP CREDIT" + "เติมเงินเข้าบัญชี" in Purple Neon Glow */}
        <div className="text-center space-y-2 mb-10 sm:mb-12">
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-wider uppercase drop-shadow-[0_4px_24px_rgba(168,85,247,0.7)] bg-gradient-to-r from-purple-200 via-fuchsia-300 to-indigo-300 bg-clip-text text-transparent">
            {t('topupTitle')}
          </h1>
          <p className="text-sm sm:text-base md:text-lg font-bold text-purple-200/90 tracking-wide drop-shadow">
            {t('topupSubtitle')}
          </p>
        </div>

        {/* 2 MAIN PAYMENT CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl mb-12 mx-auto">
          
          {/* ================= CARD 1: QR CODE ================= */}
          <div 
            onClick={() => handleSelectMethod('qrcode')}
            className={`relative rounded-[28px] p-6 text-center transition-all duration-300 cursor-pointer group select-none ${
              selectedMethod === 'qrcode'
                ? 'bg-[#1b1435] border-[3.5px] border-purple-400 shadow-[0_0_50px_rgba(168,85,247,0.7)] scale-[1.03]'
                : 'bg-[#140e28]/90 hover:bg-[#1a1333] border-[3px] border-purple-500/70 shadow-[0_0_30px_rgba(168,85,247,0.3)] hover:shadow-[0_0_45px_rgba(168,85,247,0.55)] hover:scale-[1.02]'
            }`}
          >
            {/* Top Badge: "PAY WITH" */}
            <div className="absolute -top-3.5 left-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs sm:text-sm font-black italic px-4 py-0.5 rounded-md tracking-wider uppercase shadow-md">
              PAY WITH
            </div>

            {/* Inner White Container (QR Code Payment Logo) */}
            <div className="bg-white rounded-2xl p-4 flex items-center justify-center gap-3 h-24 sm:h-28 shadow-md mt-2 mx-auto w-full transition-transform group-hover:scale-105 duration-300">
              <div className="relative text-black">
                <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="3" height="3" />
                  <path d="M17 17h4v4h-4z" />
                </svg>
                <div className="absolute -bottom-1.5 -right-1.5 bg-white p-0.5 rounded-full text-black">
                  <svg className="w-5 h-5 stroke-[2.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="11" cy="11" r="7" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
              </div>

              <div className="text-left font-sans leading-tight">
                <div className="text-xl sm:text-2xl font-black text-black tracking-tight">
                  QR Code
                </div>
                <div className="text-[10px] sm:text-[11px] font-bold text-black tracking-[0.25em] uppercase">
                  PAYMENT
                </div>
              </div>
            </div>

            {/* Title & Subtitle */}
            <div className="mt-5 space-y-1">
              <h3 className="text-xl sm:text-2xl font-bold text-white tracking-wide">
                QR Code
              </h3>
              <p className="text-xs sm:text-sm text-purple-200/80">
                {t('topupCardQrSub') || 'สแกน QR Code จ่ายเงินผ่านธนาคาร'}
              </p>
              <p className="text-xs text-purple-300 font-bold pt-1">
                {t('topupFee1') || 'ค่าธรรมเนียม 1%'}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-purple-500/20">
              <span className={`inline-flex items-center gap-1 text-xs font-semibold px-4 py-1.5 rounded-full transition-all ${
                selectedMethod === 'qrcode'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-purple-950/70 text-purple-300 group-hover:bg-purple-900/60'
              }`}>
                {selectedMethod === 'qrcode' ? (t('topupSelected') || 'เลือกอยู่') : (t('topupClickToSelect') || 'คลิกเพื่อเลือก')}
              </span>
            </div>
          </div>


          {/* ================= CARD 2: TRUEWALLET GIFT ================= */}
          <div 
            onClick={() => handleSelectMethod('truewallet')}
            className={`relative rounded-[28px] p-6 text-center transition-all duration-300 cursor-pointer group select-none ${
              selectedMethod === 'truewallet'
                ? 'bg-[#1b1435] border-[3.5px] border-purple-400 shadow-[0_0_50px_rgba(168,85,247,0.7)] scale-[1.03]'
                : 'bg-[#140e28]/90 hover:bg-[#1a1333] border-[3px] border-purple-500/70 shadow-[0_0_30px_rgba(168,85,247,0.3)] hover:shadow-[0_0_45px_rgba(168,85,247,0.55)] hover:scale-[1.02]'
            }`}
          >
            {/* Top Badge: "PAY WITH" */}
            <div className="absolute -top-3.5 left-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs sm:text-sm font-black italic px-4 py-0.5 rounded-md tracking-wider uppercase shadow-md">
              PAY WITH
            </div>

            {/* Inner White Container */}
            <div className="bg-white rounded-2xl p-3 flex items-center justify-center h-24 sm:h-28 shadow-md mt-2 mx-auto w-full transition-transform group-hover:scale-105 duration-300">
              <img 
                src="/truemoney_logo.png" 
                alt="TrueMoney" 
                className="h-16 sm:h-20 w-auto object-contain"
              />
            </div>

            {/* Title & Subtitle */}
            <div className="mt-5 space-y-1">
              <h3 className="text-xl sm:text-2xl font-bold text-pink-300 tracking-wide flex items-center justify-center gap-1.5">
                <span>TrueWallet Gift</span>
                <span>🎁</span>
              </h3>
              <p className="text-xs sm:text-sm text-purple-200/80">
                {t('topupCardWalletSub') || 'ส่งของขวัญ TrueMoney Wallet'}
              </p>
              <p className="text-xs text-emerald-400 font-bold pt-1">
                {t('topupFee0') || 'ฟรีค่าธรรมเนียม 0%'}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-purple-500/20">
              <span className={`inline-flex items-center gap-1 text-xs font-semibold px-4 py-1.5 rounded-full transition-all ${
                selectedMethod === 'truewallet'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-purple-950/70 text-purple-300 group-hover:bg-purple-900/60'
              }`}>
                {selectedMethod === 'truewallet' ? (t('topupSelected') || 'เลือกอยู่') : (t('topupClickToSelect') || 'คลิกเพื่อเลือก')}
              </span>
            </div>
          </div>

        </div>


        {/* ================= ACTION SECTION ================= */}
        <div id="payment-action-section" className="w-full">
          
          {/* SUCCESS RECEIPT STATE */}
          {successData && (
            <div className="p-6 sm:p-8 rounded-3xl bg-[#17112e] border-2 border-emerald-500/60 shadow-[0_0_40px_rgba(16,185,129,0.35)] text-center space-y-4 mb-10 animate-in fade-in zoom-in duration-300">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-extrabold text-white">ทำรายการสำเร็จเรียบร้อย!</h3>
                <p className="text-sm text-emerald-300">
                  ระบบได้บันทึกเครดิตเข้ากระเป๋าของคุณอัตโนมัติแล้ว
                </p>
              </div>

              <div className="max-w-md mx-auto p-4 rounded-2xl bg-black/60 border border-emerald-500/30 text-left space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between text-purple-200/80">
                  <span>รหัสรายการ (ID):</span>
                  <span className="font-mono text-white">{successData.id}</span>
                </div>
                <div className="flex justify-between text-purple-200/80">
                  <span>ช่องทาง:</span>
                  <span className="text-purple-300">{successData.channel}</span>
                </div>
                {successData.senderName && (
                  <div className="flex justify-between text-purple-200/80">
                    <span>ชื่อผู้ส่ง:</span>
                    <span className="text-white font-semibold">{successData.senderName}</span>
                  </div>
                )}
                <div className="flex justify-between text-purple-200/80">
                  <span>วันที่/เวลา:</span>
                  <span className="text-purple-200">{successData.date}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-white/10 text-sm font-bold">
                  <span className="text-white">ยอดเครดิตที่ได้รับ:</span>
                  <span className="text-emerald-400 text-lg">+ ฿ {successData.amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs text-purple-300">
                  <span>ยอดเงินคงเหลือปัจจุบัน:</span>
                  <span className="font-bold text-white">฿ {successData.newBalance.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  onClick={onBackToShop}
                  className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg transition-all active:scale-95"
                >
                  เลือกซื้อซอฟต์แวร์ทันที
                </button>
                <button
                  onClick={() => { setSuccessData(null); }}
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-purple-950/60 hover:bg-purple-900/60 text-purple-200 border border-purple-500/30 text-sm font-semibold transition-all"
                >
                  ส่งซองของขวัญ / เติมเงินอีกครั้ง
                </button>
              </div>
            </div>
          )}

          {/* ================= TRUEWALLET GIFT SYSTEM (Purple Theme) ================= */}
          {selectedMethod === 'truewallet' && !successData && (
            <div className="w-full p-6 sm:p-10 rounded-[36px] bg-[#140e28]/95 border-2 border-purple-500/40 shadow-[0_0_60px_rgba(168,85,247,0.35)] space-y-8 animate-in fade-in duration-300">
              
              {/* 1. Header with TrueMoney Logo (Replaced Screenshot 163644 with unnamed.png) */}
              <div className="text-center space-y-3">
                <h2 className="text-2xl sm:text-4xl font-extrabold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-fuchsia-300 to-indigo-300 drop-shadow-[0_2px_12px_rgba(168,85,247,0.6)]">
                  ทรูมันนี่วอเลท (ส่งของขวัญ)
                </h2>
                
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-purple-900/60 border border-purple-400/40 text-xs font-semibold text-purple-200 shadow-sm">
                  <span>TrueWallet Gift</span>
                </div>

                {/* Logo Frame: Replaced with unnamed.png as requested in Screenshot 163644 */}
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-white p-3 mx-auto shadow-[0_0_35px_rgba(168,85,247,0.5)] flex items-center justify-center border-2 border-purple-400/40 transform hover:scale-105 transition-transform">
                  <img 
                    src="/truemoney_logo.png" 
                    alt="TrueMoney" 
                    className="w-full h-full object-contain"
                  />
                </div>

                <p className="text-xs sm:text-sm text-purple-200/90 font-medium">
                  ส่งกำลังใจสนับสนุนช่อง Ibuki ด้วยซองของขวัญ TrueMoney Wallet ได้ทันที (ฟรีค่าธรรมเนียม 0%)
                </p>
              </div>

              {/* 2. (Goal Progress Bar from Screenshot 163551 has been REMOVED as requested) */}

              {/* 3. 3-Step Visual Guide (Purple Themed Cards) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Step 1 Card */}
                <div className="p-4 rounded-2xl bg-[#1b1435] text-purple-100 flex flex-col justify-between shadow-md border border-purple-500/30">
                  <div className="text-xs font-bold text-white border-b border-purple-500/20 pb-2 mb-3 text-center">
                    1. เลือกเมนู "ส่งของขวัญ"
                  </div>
                  <div className="flex flex-col items-center justify-center my-auto py-2">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-md mb-2">
                      <Gift className="w-6 h-6" />
                    </div>
                    <div className="text-xs font-bold text-white">
                      ส่งซองของขวัญ (TrueMoney Gift)
                    </div>
                    <div className="text-[10px] text-purple-300/70 mt-1">
                      เปิดแอป TrueMoney &gt; กดไอคอนส่งของขวัญ
                    </div>
                  </div>
                </div>

                {/* Step 2 Card */}
                <div className="p-4 rounded-2xl bg-[#1b1435] text-purple-100 flex flex-col justify-between shadow-md border border-purple-500/30">
                  <div className="text-xs font-bold text-white border-b border-purple-500/20 pb-2 mb-3 text-center">
                    2. กรอกจำนวนเงิน | แบ่งจำนวนเงินเท่ากัน | คนรับ 1
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/40 border border-purple-500/20 space-y-1.5 text-center text-xs">
                    <div className="bg-purple-600 text-white font-bold py-1 px-2 rounded text-[10px]">
                      สร้างซองของขวัญ
                    </div>
                    <div className="text-[10px] text-purple-300/70">กรอกยอดเงินที่ต้องการใส่ซอง:</div>
                    <div className="bg-purple-950/60 font-bold py-1 px-2 rounded text-purple-200 font-mono text-xs border border-purple-500/20">
                      30 - 300 ฿
                    </div>
                    <div className="border border-purple-400 text-purple-200 font-bold py-1 px-2 rounded text-[10px] bg-purple-900/30">
                      แบ่งจำนวนเงินเท่ากัน ✓
                    </div>
                    <div className="border border-indigo-400 text-indigo-200 font-bold py-1 px-2 rounded text-[10px] bg-indigo-900/30">
                      จำนวนคนที่รับซองคือ 1 ✓
                    </div>
                  </div>
                </div>

                {/* Step 3 Card */}
                <div className="p-4 rounded-2xl bg-[#1b1435] text-purple-100 flex flex-col justify-between shadow-md border border-purple-500/30">
                  <div className="text-xs font-bold text-white border-b border-purple-500/20 pb-2 mb-3 text-center">
                    3. สร้างของขวัญและยืนยัน โดยคัดลอกลิงก์
                  </div>
                  <div className="p-3 rounded-xl border border-emerald-500/40 bg-emerald-950/30 space-y-1.5 text-center my-auto">
                    <div className="w-6 h-6 rounded-full bg-emerald-500 text-white font-bold text-xs flex items-center justify-center mx-auto">
                      ✓
                    </div>
                    <div className="text-xs font-bold text-emerald-300">
                      สร้างซองของขวัญสำเร็จ
                    </div>
                    <div className="p-1.5 rounded bg-black/50 border border-emerald-500/30 flex items-center justify-between text-[10px]">
                      <span className="text-emerald-400 font-mono truncate mr-1">gift.truemoney.com/...</span>
                      <span className="bg-emerald-600 text-white px-1.5 py-0.5 rounded text-[9px] font-bold">คัดลอก</span>
                    </div>
                    <div className="text-[10px] text-purple-300/70">
                      นำลิงก์ที่ได้มาวางในช่องด้านล่าง
                    </div>
                  </div>
                </div>

              </div>

              {/* 4. Donation / Topup Form */}
              <form onSubmit={handleTrueMoneyGiftSubmit} className="space-y-4">
                
                {/* Error Banner */}
                {error && (
                  <div className="p-3.5 rounded-2xl bg-red-950/60 border border-red-500/50 text-red-200 text-xs sm:text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* (Sender Name from Screenshot 163542 has been REMOVED as requested) */}

                {/* Message to Creator */}
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-bold text-purple-200 flex items-center gap-1">
                    <span>ข้อความถึง Creator (Message)</span>
                    <span className="text-purple-400/80 font-normal">• ส่งกำลังใจให้ Ibuki (ระบุหรือไม่ก็ได้)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="พิมพ์ข้อความส่งกำลังใจหรือคำอวยพรถึง Ibuki..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full bg-[#1b1435] border border-purple-500/40 rounded-2xl px-4 py-3 text-sm text-white placeholder-purple-300/40 focus:outline-none focus:border-purple-400 transition-colors"
                  />
                </div>

                {/* TrueMoney Gift URL Input (Highlight Box with Gold-Amber Accent) */}
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-bold text-amber-300">
                    ลิงก์รับซองของขวัญ TrueMoney Wallet
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://gift.truemoney.com/campaign/?v=..."
                    value={voucherUrl}
                    onChange={(e) => setVoucherUrl(e.target.value)}
                    className="w-full bg-[#20173e] text-amber-200 placeholder-amber-400/50 font-mono font-semibold border-2 border-purple-400/60 rounded-2xl px-4 py-3.5 text-sm sm:text-base focus:outline-none focus:border-amber-400 transition-colors shadow-inner"
                  />
                </div>

                {/* CTA Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-base shadow-[0_6px_30px_rgba(168,85,247,0.55)] transition-all active:scale-[0.99] flex items-center justify-center gap-2.5 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>กำลังแลกซองของขวัญเข้าบัญชี...</span>
                    </>
                  ) : (
                    <>
                      <div className="p-1 rounded-md bg-white/20 border border-white/30">
                        <Check className="w-4 h-4" />
                      </div>
                      <span>ยืนยันการส่งของขวัญ TrueMoney</span>
                    </>
                  )}
                </button>

              </form>

            </div>
          )}


          {/* ================= SECTION B: QR CODE PROMPTPAY ================= */}
          {selectedMethod === 'qrcode' && !successData && (
            <div className="p-6 sm:p-8 rounded-[32px] bg-[#140e28]/95 border-2 border-purple-500/40 shadow-[0_0_50px_rgba(168,85,247,0.3)] space-y-6 animate-in fade-in duration-300">
              
              {/* Error Message */}
              {error && (
                <div className="p-3.5 rounded-2xl bg-red-950/60 border border-red-500/50 text-red-200 text-xs sm:text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleQRCodeSubmit} className="space-y-6">
                
                <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-purple-600/20 border border-purple-500/40 text-purple-300">
                      <QrCode className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-base sm:text-lg font-bold text-white">ชำระเงินผ่าน QR Code (พร้อมเพย์)</h4>
                      <p className="text-xs text-purple-300/70">สแกนจ่ายได้ทุกแอปธนาคาร ตรวจสอบยอดและปรับเครดิตอัตโนมัติ</p>
                    </div>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-purple-950 border border-purple-500/40 text-purple-200 font-semibold">
                    ค่าธรรมเนียม 1%
                  </span>
                </div>

                {/* Amount Selectors */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-purple-200">
                    เลือกจำนวนเงินที่ต้องการเติม (บาท):
                  </label>
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                    {QUICK_AMOUNTS.map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => { setAmount(val); setCustomAmount(''); }}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                          amount === val && !customAmount
                            ? 'bg-purple-600 border-purple-400 text-white shadow-md'
                            : 'bg-black/50 border-purple-500/20 text-purple-200 hover:border-purple-400/40 hover:bg-purple-950/30'
                        }`}
                      >
                        ฿ {val}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Amount Input */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-purple-300/80">
                    หรือระบุจำนวนเงินเอง (บาท):
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    placeholder="เช่น 250 หรือ 1000"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="w-full bg-black/60 border border-purple-500/30 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-400 transition-colors"
                  />
                </div>

                {/* Fee Calculation Breakdown */}
                <div className="p-4 rounded-2xl bg-black/60 border border-purple-500/20 space-y-1.5 text-xs sm:text-sm">
                  <div className="flex justify-between text-purple-200/80">
                    <span>ยอดเติมเงิน:</span>
                    <span className="text-white font-semibold">฿ {selectedAmount || 0}</span>
                  </div>
                  <div className="flex justify-between text-purple-200/80">
                    <span>ค่าธรรมเนียมการทำรายการ (1%):</span>
                    <span className="text-purple-300">฿ {((selectedAmount || 0) * 0.01).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-white/10 text-sm font-bold">
                    <span className="text-white">ยอดชำระสุทธิ:</span>
                    <span className="text-purple-300 text-base">฿ {((selectedAmount || 0) * 1.01).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-emerald-400 font-semibold pt-0.5">
                    <span>เครดิตที่จะได้รับเข้ากระเป๋า:</span>
                    <span>+ {selectedAmount || 0} เครดิต</span>
                  </div>
                </div>

                {/* Real PromptPay QR Code Box */}
                <div className="flex flex-col sm:flex-row items-center gap-6 p-5 sm:p-6 rounded-3xl bg-white text-black shadow-lg">
                  <div className="relative p-3 bg-white rounded-2xl border-2 border-purple-100 shadow-md shrink-0 text-center">
                    <img 
                      src={promptpayInfo?.qrImageUrl || `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=PROMPTPAY-${((selectedAmount || 0) * 1.01).toFixed(2)}`} 
                      alt="PromptPay QR Code"
                      className="w-44 h-44 sm:w-48 sm:h-48 object-contain rounded-xl mx-auto"
                    />
                    <div className="mt-2 text-[11px] font-bold text-blue-800 tracking-wider">
                      SCAN WITH ANY BANK APP
                    </div>
                  </div>

                  <div className="space-y-3 text-left text-xs sm:text-sm text-gray-800 flex-1 w-full">
                    <div className="flex items-center justify-between">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-bold text-xs border border-blue-200">
                        <QrCode className="w-3.5 h-3.5" />
                        <span>พร้อมเพย์ (PromptPay QR)</span>
                      </div>
                      <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                        ยอดสแกน: ฿ {((selectedAmount || 0) * 1.01).toFixed(2)}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-500">ชื่อบัญชี:</span>
                        <span className="font-bold text-gray-900">{promptpayInfo?.accountName || 'Ibuki Store (พร้อมเพย์)'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">เลขบัญชี / พร้อมเพย์:</span>
                        <span className="font-mono font-bold text-purple-700 text-sm">{promptpayInfo?.number || '156-8-83147-7'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">ธนาคาร:</span>
                        <span className="font-bold text-gray-800">{promptpayInfo?.bankName || 'ธนาคารกสิกรไทย (KBANK)'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => copyToClipboard(promptpayInfo?.number || '156-8-83147-7')}
                        className="px-3.5 py-2 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-800 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm"
                      >
                        {copiedPromptPay ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedPromptPay ? 'คัดลอกเลขบัญชีแล้ว' : 'คัดลอกเลขบัญชี'}</span>
                      </button>
                    </div>

                    <p className="text-[11px] text-gray-500 leading-relaxed">
                      💡 สแกนเสร็จแล้ว <strong>แนบสลิปโอนเงิน</strong> ด้านล่างเพื่อตรวจสอบยอดและรับเครดิตทันที
                    </p>
                  </div>
                </div>

                {/* Bank Slip Upload Box */}
                <div className="space-y-2 text-left">
                  <label className="text-xs font-bold text-purple-200 flex items-center gap-1.5">
                    <Upload className="w-4 h-4 text-purple-400" />
                    <span>แนบหลักฐานสลิปการโอนเงิน (Transfer Slip):</span>
                    <span className="text-pink-400">*จำเป็น</span>
                  </label>

                  {!slipPreview ? (
                    <label className="border-2 border-dashed border-purple-500/40 hover:border-purple-400 bg-[#160f2e]/60 hover:bg-[#1b1238] rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all group">
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleSlipChange} 
                        className="hidden" 
                      />
                      <div className="w-12 h-12 rounded-2xl bg-purple-600/20 group-hover:bg-purple-600/30 text-purple-300 flex items-center justify-center mb-3 transition-colors">
                        <Upload className="w-6 h-6" />
                      </div>
                      <span className="text-sm font-bold text-white group-hover:text-purple-200">
                        คลิกเพื่อเลือกไฟล์รูปภาพสลิป หรือลากไฟล์มาวางที่นี่
                      </span>
                      <span className="text-xs text-purple-300/60 mt-1">
                        รองรับไฟล์ภาพสลิปจากทุกธนาคาร (.JPG, .PNG, .JPEG) สูงสุด 12 MB
                      </span>
                    </label>
                  ) : (
                    <div className="p-4 rounded-2xl bg-[#17112e] border-2 border-purple-500/40 flex flex-col sm:flex-row items-center gap-4">
                      <div className="relative w-28 h-36 bg-black rounded-xl overflow-hidden border border-purple-400/40 shrink-0">
                        <img 
                          src={slipPreview} 
                          alt="Slip Preview" 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      <div className="space-y-1.5 flex-1 text-xs">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span className="font-bold text-white text-sm">แนบสลิปเรียบร้อยแล้ว</span>
                        </div>
                        <p className="text-purple-200/80 truncate max-w-xs sm:max-w-md">
                          ไฟล์: {slipFile?.name} ({((slipFile?.size || 0) / 1024).toFixed(1)} KB)
                        </p>
                        <p className="text-purple-300/60 text-[11px]">
                          ระบบจะตรวจสอบยอดเงินและชื่อบัญชีอัตโนมัติเมื่อกดปุ่มยืนยัน
                        </p>
                        <button
                          type="button"
                          onClick={handleRemoveSlip}
                          className="inline-flex items-center gap-1 text-xs text-pink-400 hover:text-pink-300 font-semibold pt-1 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>เปลี่ยนรูปภาพสลิปใหม่</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading || !slipFile}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-base shadow-[0_6px_25px_rgba(168,85,247,0.5)] transition-all active:scale-[0.99] flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>กำลังตรวจสอบสลิปกับระบบธนาคาร...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-5 h-5 text-emerald-300" />
                      <span>ยืนยันการโอนเงินและส่งสลิปตรวจสอบ</span>
                    </>
                  )}
                </button>

              </form>
            </div>
          )}


        </div>

      </main>

    </div>
  );
}
