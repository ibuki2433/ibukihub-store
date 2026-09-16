import React, { useState, useEffect } from 'react';
import { 
  X, QrCode, Gift, CheckCircle2, AlertCircle, Wallet, 
  ShieldCheck, Sparkles, Copy, Check, Upload, Image as ImageIcon 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';

const QUICK_AMOUNTS = [50, 100, 150, 190, 300, 500, 1000];

export default function TopupModal({ onClose, onOpenAuth }) {
  const { user, updateBalance } = useAuth();
  const [tab, setTab] = useState('promptpay'); // promptpay, truemoney
  const [amount, setAmount] = useState(190);
  const [customAmount, setCustomAmount] = useState('');
  const [voucherUrl, setVoucherUrl] = useState('');
  const [message, setMessage] = useState('');

  // Slip upload states
  const [slipFile, setSlipFile] = useState(null);
  const [slipPreview, setSlipPreview] = useState(null);
  const [promptpayInfo, setPromptpayInfo] = useState(null);
  const [copiedPromptPay, setCopiedPromptPay] = useState(false);

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [error, setError] = useState(null);

  const selectedAmount = customAmount ? parseFloat(customAmount) : amount;

  // Load PromptPay configuration & dynamic EMVCo QR code
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

  const handleCopyPromptPay = () => {
    if (!promptpayInfo?.number) return;
    const cleanNum = promptpayInfo.number.replace(/[^0-9]/g, '');
    navigator.clipboard.writeText(cleanNum || promptpayInfo.number);
    setCopiedPromptPay(true);
    setTimeout(() => setCopiedPromptPay(false), 2000);
  };

  const handleTopup = async (e) => {
    e.preventDefault();
    if (!user) {
      if (onOpenAuth) onOpenAuth('login');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (tab === 'promptpay') {
        if (!selectedAmount || selectedAmount <= 0) {
          throw new Error("กรุณาระบุจำนวนเงินที่ต้องการเติม");
        }
        if (!slipFile) {
          throw new Error("กรุณาแนบรูปภาพสลิปการโอนเงินเพื่อยืนยันรายการ");
        }

        const formData = new FormData();
        formData.append('slip', slipFile);
        formData.append('amount', selectedAmount);
        formData.append('channel', 'PromptPay QR');
        if (message) formData.append('message', message.trim());

        const res = await fetch('/api/wallet/upload-slip', {
          method: 'POST',
          headers: {
            'x-user-id': user.id
          },
          body: formData
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "การส่งสลิปตรวจสอบล้มเหลว");

        if (data.status === 'approved') {
          updateBalance(data.newBalance);
          setSuccessMsg(`เติมเงินสำเร็จ ได้รับเครดิต ฿ ${(data.topup?.amount || selectedAmount).toLocaleString()} เรียบร้อยแล้ว`);
          try {
            confetti({ particleCount: 80, spread: 60 });
          } catch (e) {}
        } else {
          setSuccessMsg(`ส่งสลิปตรวจสอบเรียบร้อยแล้ว (${data.message || 'รอแอดมินตรวจสอบอนุมัติ'})`);
        }

        setSlipFile(null);
        setSlipPreview(null);
        setMessage('');

      } else {
        // TrueMoney Gift
        if (!voucherUrl || (!voucherUrl.includes('gift.truemoney.com') && !voucherUrl.includes('v='))) {
          if (voucherUrl.trim().length < 8) {
            throw new Error("กรุณากรอกลิงก์ซองของขวัญ TrueMoney Wallet ที่ถูกต้อง");
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
        setSuccessMsg(`เติมเงินสำเร็จ ได้รับเครดิต ฿ ${(data.topup?.amount || 0).toLocaleString()} เรียบร้อยแล้ว`);
        try {
          confetti({ particleCount: 80, spread: 60 });
        } catch (e) {}

        setVoucherUrl('');
        setMessage('');
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const netPayAmount = ((selectedAmount || 0) * 1.01).toFixed(2);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      
      <div 
        className="relative w-full max-w-lg bg-[#141022] border border-purple-400/30 rounded-2xl shadow-2xl overflow-hidden my-4 sm:my-6 animate-in fade-in zoom-in duration-200 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/50 hover:bg-purple-900/60 text-purple-200 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="bg-[#19142b] border-b border-purple-900/30 p-5 text-white shrink-0">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-purple-400" />
            <h3 className="text-base sm:text-lg font-bold">ระบบเติมเงินเข้ากระเป๋า (Wallet Top-up)</h3>
          </div>
          <p className="text-xs text-purple-300/70 mt-0.5">
            เติมเครดิตสำหรับชำระค่าซอฟต์แวร์ ตรวจสอบยอดเงินเข้าจริงทันที ปลอดภัย 100%
          </p>
        </div>

        {/* Channels Tabs */}
        <div className="flex border-b border-purple-900/20 bg-[#120e1e] shrink-0">
          <button
            onClick={() => { setTab('promptpay'); setError(null); setSuccessMsg(null); }}
            className={`flex-1 py-3 text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 border-b-2 transition-all ${
              tab === 'promptpay'
                ? 'border-purple-400 text-purple-200 bg-purple-900/20 font-semibold'
                : 'border-transparent text-purple-300/60 hover:text-white'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>พร้อมเพย์ QR / แนบสลิป</span>
          </button>

          <button
            onClick={() => { setTab('truemoney'); setError(null); setSuccessMsg(null); }}
            className={`flex-1 py-3 text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 border-b-2 transition-all ${
              tab === 'truemoney'
                ? 'border-purple-400 text-purple-200 bg-purple-900/20 font-semibold'
                : 'border-transparent text-purple-300/60 hover:text-white'
            }`}
          >
            <Gift className="w-4 h-4" />
            <span>ซองของขวัญ TrueMoney</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          
          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div className="font-medium">{successMsg}</div>
            </div>
          )}

          {error && (
            <div className="p-3.5 rounded-xl bg-red-950/50 border border-red-500/40 text-xs text-red-200 flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!user ? (
            <div className="p-6 rounded-xl bg-purple-950/40 border border-purple-500/30 text-center space-y-3">
              <p className="text-xs text-purple-200">กรุณาเข้าสู่ระบบก่อนทำการเติมเงิน</p>
              <button
                onClick={() => { onClose(); if (onOpenAuth) onOpenAuth('login'); }}
                className="px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-600 text-white text-xs font-semibold transition-all shadow-soft-purple"
              >
                เข้าสู่ระบบตอนนี้
              </button>
            </div>
          ) : (
            <form onSubmit={handleTopup} className="space-y-4">
              
              {tab === 'promptpay' ? (
                /* PROMPTPAY & SLIP TAB */
                <>
                  {/* Select Amount */}
                  <div>
                    <label className="block text-xs font-semibold text-purple-300 mb-2">
                      เลือกจำนวนเงินที่ต้องการเติม:
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {QUICK_AMOUNTS.map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => { setAmount(amt); setCustomAmount(''); }}
                          className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                            amount === amt && !customAmount
                              ? 'bg-purple-700 text-white border-purple-400 shadow-soft-purple'
                              : 'bg-[#181328] text-purple-200/80 border-purple-500/20 hover:border-purple-400/40'
                          }`}
                        >
                          ฿ {amt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Amount */}
                  <div>
                    <label className="block text-[11px] text-purple-300/60 mb-1">
                      หรือระบุจำนวนเงินเอง (บาท):
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder="เช่น 150, 300, 500..."
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      className="w-full bg-[#181328] border border-purple-500/20 rounded-xl px-3 py-2 text-xs sm:text-sm text-purple-100 focus:outline-none focus:border-purple-400/50 font-mono"
                    />
                  </div>

                  {/* PromptPay Info Card & Official QR Code */}
                  <div className="p-4 rounded-2xl bg-white text-neutral-900 flex flex-col items-center justify-center text-center shadow-lg border border-purple-300/30 space-y-3">
                    <div className="w-full flex items-center justify-between border-b pb-2 border-neutral-200">
                      <div className="text-left">
                        <div className="text-[11px] font-bold text-neutral-800 tracking-wider uppercase flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                          Thai QR Payment / พร้อมเพย์
                        </div>
                        <div className="text-[10px] text-neutral-500">รองรับทุกแอปธนาคารไทย (K PLUS, SCB Easy, Krungthai NEXT...)</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-neutral-500">ยอดที่ต้องโอนสุทธิ</div>
                        <div className="text-base font-black text-purple-700 font-mono">฿ {netPayAmount}</div>
                      </div>
                    </div>
                    
                    {/* Official Dynamic EMVCo QR Code */}
                    <div className="p-2.5 bg-white rounded-xl border border-neutral-200 shadow-sm flex items-center justify-center">
                      <img
                        src={promptpayInfo?.qrImageUrl || `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=PROMPTPAY-${selectedAmount || 190}`}
                        alt="Official PromptPay QR Code"
                        className="w-44 h-44 object-contain rounded-lg"
                      />
                    </div>

                    {/* Account Details */}
                    <div className="w-full bg-neutral-50 rounded-xl p-2.5 border border-neutral-200 text-left text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-500 text-[11px]">เลขบัญชี / พร้อมเพย์:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-neutral-900">{promptpayInfo?.number || '156-8-83147-7'}</span>
                          <button
                            type="button"
                            onClick={handleCopyPromptPay}
                            className="p-1 rounded bg-neutral-200 hover:bg-neutral-300 text-neutral-700 transition-colors"
                            title="คัดลอกหมายเลข"
                          >
                            {copiedPromptPay ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-neutral-500 text-[11px]">ชื่อบัญชี:</span>
                        <span className="font-bold text-neutral-800">{promptpayInfo?.accountName || 'ภูวนาท เมธาวงศ์วณิช'}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-neutral-500 text-[11px]">ธนาคาร:</span>
                        <span className="font-bold text-neutral-800">{promptpayInfo?.bankName || 'ธนาคารกสิกรไทย (KBANK)'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Slip Upload Area */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-purple-300">
                      แนบสลิปการโอนเงิน (Slip Verification): <span className="text-amber-400">* จำเป็น</span>
                    </label>

                    {!slipPreview ? (
                      <label className="border-2 border-dashed border-purple-500/30 hover:border-purple-400/60 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer bg-[#181328] transition-colors group">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleSlipChange}
                          className="hidden"
                        />
                        <div className="w-10 h-10 rounded-full bg-purple-900/40 flex items-center justify-center text-purple-300 group-hover:scale-110 transition-transform">
                          <Upload className="w-5 h-5" />
                        </div>
                        <div className="text-center">
                          <div className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">
                            คลิกเพื่ออัปโหลดสลิป หรือลากไฟล์มาวางที่นี่
                          </div>
                          <div className="text-[10px] text-purple-300/60 mt-0.5">
                            รองรับไฟล์ภาพ JPG, PNG, WEBP จากแอปธนาคาร
                          </div>
                        </div>
                      </label>
                    ) : (
                      <div className="relative p-2.5 rounded-2xl bg-[#181328] border border-purple-500/40 flex items-center gap-3">
                        <img
                          src={slipPreview}
                          alt="Slip Preview"
                          className="w-16 h-16 rounded-xl object-cover border border-purple-400/30"
                        />
                        <div className="flex-1 min-w-0 text-xs">
                          <div className="font-bold text-white truncate">{slipFile?.name}</div>
                          <div className="text-[11px] text-purple-300/70 font-mono">
                            {(slipFile?.size / 1024).toFixed(1)} KB
                          </div>
                          <div className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>พร้อมส่งตรวจสอบ</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveSlip}
                          className="p-1.5 rounded-xl bg-red-950/60 hover:bg-red-900 text-red-300 transition-colors mr-1"
                          title="เปลี่ยนรูปภาพ"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !slipFile}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-600 hover:from-purple-600 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-soft-purple flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>{loading ? "กำลังตรวจสอบสลิปและปรับยอด..." : "ยืนยันการโอนเงินและส่งสลิปตรวจสอบ"}</span>
                  </button>
                </>
              ) : (
                /* TRUEMONEY GIFT TAB */
                <>
                  <div className="p-3.5 rounded-xl bg-[#19142b] border border-purple-500/20 text-xs text-purple-200/80 space-y-1.5">
                    <div className="font-semibold text-purple-200">วิธีเติมเงินด้วยซองของขวัญ TrueMoney Wallet:</div>
                    <ol className="list-decimal list-inside space-y-1 text-[11px] text-purple-300/60">
                      <li>เปิดแอป TrueMoney เลือกเมนู <strong>"ส่งของขวัญ"</strong> หรือ <strong>"ซองของขวัญ"</strong></li>
                      <li>ใส่จำนวนเงินที่ต้องการเติม (เลือกแบบสุ่มหรือแบ่งเท่ากัน 1 คน)</li>
                      <li>คัดลอกลิงก์ซองของขวัญนำมาวางในช่องด้านล่าง</li>
                    </ol>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-purple-300 mb-1.5">
                      วางลิงก์ซองของขวัญ TrueMoney:
                    </label>
                    <input
                      type="text"
                      placeholder="https://gift.truemoney.com/campaign/?v=..."
                      value={voucherUrl}
                      onChange={(e) => setVoucherUrl(e.target.value)}
                      className="w-full bg-[#181328] border border-purple-500/20 rounded-xl px-3 py-2 text-xs sm:text-sm text-purple-100 focus:outline-none focus:border-purple-400/50 font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !voucherUrl.trim()}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-600 hover:from-purple-600 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-soft-purple flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    <Gift className="w-4 h-4" />
                    <span>{loading ? "กำลังตรวจสอบซองของขวัญ..." : "ยืนยันและรับเครดิตทันที"}</span>
                  </button>
                </>
              )}

            </form>
          )}

        </div>

      </div>

    </div>
  );
}
