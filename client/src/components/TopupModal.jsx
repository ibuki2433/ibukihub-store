import React, { useState } from 'react';
import { X, QrCode, Gift, CheckCircle2, AlertCircle, Wallet, ShieldCheck, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';

const QUICK_AMOUNTS = [50, 100, 150, 300, 500, 1000];

export default function TopupModal({ onClose, onOpenAuth }) {
  const { user, updateBalance } = useAuth();
  const [tab, setTab] = useState('promptpay'); // promptpay, truemoney, giftcode
  const [amount, setAmount] = useState(150);
  const [customAmount, setCustomAmount] = useState('');
  const [voucherUrl, setVoucherUrl] = useState('');
  const [giftCode, setGiftCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [error, setError] = useState(null);

  const selectedAmount = customAmount ? parseFloat(customAmount) : amount;

  const handleTopup = async (e) => {
    e.preventDefault();
    if (!user) {
      onOpenAuth('login');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (tab === 'giftcode') {
        if (!giftCode || !giftCode.trim()) {
          throw new Error("กรุณากรอกโค้ดของขวัญ");
        }
        const res = await fetch('/api/wallet/redeem-code', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': user.id
          },
          body: JSON.stringify({ code: giftCode.trim() })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "การแลกโค้ดไม่สำเร็จ");

        updateBalance(data.newBalance);
        setSuccessMsg(data.message || `🎉 แลกโค้ดสำเร็จ ได้รับเงิน ฿${data.rewardAmount.toLocaleString()} เข้ากระเป๋าเรียบร้อยแล้ว`);
        setGiftCode('');
        try {
          confetti({ particleCount: 80, spread: 60 });
        } catch (e) {}
        return;
      }

      let payload = {};
      if (tab === 'promptpay') {
        if (!selectedAmount || selectedAmount <= 0) {
          throw new Error("กรุณาระบุจำนวนเงินที่ถูกต้อง");
        }
        payload = {
          amount: selectedAmount,
          channel: "PromptPay QR"
        };
      } else {
        if (!voucherUrl || (!voucherUrl.includes('gift.truemoney.com') && !voucherUrl.includes('v='))) {
          if (voucherUrl.length < 5) {
            throw new Error("กรุณากรอกลิงก์ซองของขวัญ TrueMoney ที่ถูกต้อง");
          }
        }
        const randomVoucherVal = Math.floor(Math.random() * 200) + 100;
        payload = {
          amount: randomVoucherVal,
          channel: "TrueMoney Gift Link",
          voucherCode: voucherUrl
        };
      }

      const res = await fetch('/api/wallet/topup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "การเติมเงินล้มเหลว");

      updateBalance(data.newBalance);
      setSuccessMsg(`เติมเงินสำเร็จ ได้รับเครดิต ฿ ${data.topup.amount.toLocaleString()} เรียบร้อยแล้ว`);

      try {
        confetti({ particleCount: 60, spread: 50 });
      } catch (e) {}

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
      
      <div 
        className="relative w-full max-w-md bg-[#141022] border border-purple-400/30 rounded-2xl shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in duration-200"
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
        <div className="bg-[#19142b] border-b border-purple-900/30 p-5 text-white">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-purple-400" />
            <h3 className="text-base sm:text-lg font-bold">ระบบเติมเงินอัตโนมัติ</h3>
          </div>
          <p className="text-xs text-purple-300/70 mt-0.5">
            เติมเครดิตเข้ากระเป๋าสำหรับชำระค่าซอฟต์แวร์ ยอดเงินเข้าทันที 24 ชม.
          </p>
        </div>

        {/* Channels Tabs */}
        <div className="flex border-b border-purple-900/20 bg-[#120e1e]">
          <button
            onClick={() => { setTab('promptpay'); setError(null); setSuccessMsg(null); }}
            className={`flex-1 py-3 text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 border-b-2 transition-all ${
              tab === 'promptpay'
                ? 'border-purple-400 text-purple-200 bg-purple-900/20 font-semibold'
                : 'border-transparent text-purple-300/60 hover:text-white'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>พร้อมเพย์ QR</span>
          </button>

          <button
            onClick={() => { setTab('truemoney'); setError(null); setSuccessMsg(null); }}
            className={`flex-1 py-3 text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 border-b-2 transition-all ${
              tab === 'truemoney'
                ? 'border-purple-400 text-purple-200 bg-purple-900/20 font-semibold'
                : 'border-transparent text-purple-300/60 hover:text-white'
            }`}
          >
            <Gift className="w-3.5 h-3.5" />
            <span>ซองทรูมันนี่</span>
          </button>

          <button
            onClick={() => { setTab('giftcode'); setError(null); setSuccessMsg(null); }}
            className={`flex-1 py-3 text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 border-b-2 transition-all ${
              tab === 'giftcode'
                ? 'border-amber-400 text-amber-200 bg-amber-950/30 font-semibold'
                : 'border-transparent text-purple-300/60 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>โค้ดของขวัญ</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4">
          
          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-xs text-red-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!user ? (
            <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-500/30 text-center space-y-3">
              <p className="text-xs text-purple-200">กรุณาเข้าสู่ระบบก่อนทำการเติมเงิน</p>
              <button
                onClick={() => { onClose(); onOpenAuth('login'); }}
                className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-600 text-white text-xs font-medium transition-all shadow-soft-purple"
              >
                เข้าสู่ระบบตอนนี้
              </button>
            </div>
          ) : (
            <form onSubmit={handleTopup} className="space-y-4">
              
              {tab === 'promptpay' ? (
                /* PROMPTPAY TAB */
                <>
                  <div>
                    <label className="block text-xs font-semibold text-purple-300 mb-2">
                      เลือกจำนวนเงินที่ต้องการเติม:
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {QUICK_AMOUNTS.map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => { setAmount(amt); setCustomAmount(''); }}
                          className={`py-2 px-3 rounded-xl text-xs font-medium border transition-all ${
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
                      placeholder="เช่น 150, 300..."
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      className="w-full bg-[#181328] border border-purple-500/20 rounded-xl px-3 py-2 text-xs sm:text-sm text-purple-100 focus:outline-none focus:border-purple-400/50"
                    />
                  </div>

                  {/* QR Code Graphic Display */}
                  <div className="p-4 rounded-xl bg-white text-neutral-900 flex flex-col items-center justify-center text-center shadow-md">
                    <div className="text-[11px] font-bold text-neutral-800 mb-1 tracking-wider uppercase">
                      Thai QR Payment / พร้อมเพย์
                    </div>
                    
                    <div className="w-32 h-32 border border-neutral-300 p-2 bg-white flex items-center justify-center rounded-lg">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=BULL-PROMPTPAY-${selectedAmount || 150}`}
                        alt="PromptPay QR Code"
                        className="w-full h-full object-contain"
                      />
                    </div>

                    <div className="mt-2 text-xs font-semibold text-neutral-700">
                      ยอดชำระ: <span className="text-purple-700 text-sm font-bold">฿ {(selectedAmount || 0).toLocaleString()}</span>
                    </div>
                    <div className="text-[10px] text-neutral-500">Bull Software Studio</div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 rounded-xl bg-purple-700 hover:bg-purple-600 text-white font-semibold text-xs sm:text-sm shadow-soft-purple flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>{loading ? "กำลังตรวจสอบยอดเงิน..." : "ยืนยันการโอนเงิน (รับเครดิตทันที)"}</span>
                  </button>
                </>
              ) : tab === 'truemoney' ? (
                /* TRUEMONEY TAB */
                <>
                  <div className="p-3.5 rounded-xl bg-[#19142b] border border-purple-500/20 text-xs text-purple-200/80 space-y-1.5">
                    <div className="font-semibold text-purple-200">วิธีเติมเงินด้วยซองของขวัญ TrueMoney:</div>
                    <ol className="list-decimal list-inside space-y-1 text-[11px] text-purple-300/60">
                      <li>เปิดแอป TrueMoney เลือกเมนู "ส่งของขวัญ"</li>
                      <li>กรอกจำนวนเงินที่ต้องการเติม</li>
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
                    disabled={loading}
                    className="w-full py-2.5 rounded-xl bg-purple-700 hover:bg-purple-600 text-white font-semibold text-xs sm:text-sm shadow-soft-purple flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <Gift className="w-4 h-4" />
                    <span>{loading ? "กำลังตรวจสอบ..." : "ยืนยันและรับเครดิต"}</span>
                  </button>
                </>
              ) : (
                /* GIFT CODE TAB */
                <>
                  <div>
                    <label className="block text-xs font-semibold text-purple-300 mb-1.5">
                      กรอกโค้ดของขวัญ (Promo Code):
                    </label>
                    <input
                      type="text"
                      placeholder="กรอกโค้ดของขวัญที่นี่..."
                      value={giftCode}
                      onChange={(e) => setGiftCode(e.target.value)}
                      className="w-full bg-[#181328] border border-amber-500/30 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-amber-200 font-mono font-bold uppercase focus:outline-none focus:border-amber-400/60"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !giftCode.trim()}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-neutral-950 font-extrabold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                  >
                    <Gift className="w-4 h-4 text-neutral-950" />
                    <span>{loading ? "กำลังตรวจสอบ..." : "แลกรับยอดเงินเข้ากระเป๋า"}</span>
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
