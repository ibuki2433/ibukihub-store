import React, { useState } from 'react';
import { X, Gift, Sparkles, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function RedeemCodeModal({ onClose, onOpenAuth }) {
  const { user, updateBalance } = useAuth();
  const { t } = useLanguage();

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      if (onOpenAuth) onOpenAuth('signin');
      return;
    }

    if (!code || !code.trim()) {
      setError("กรุณากรอกโค้ดของขวัญ");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/wallet/redeem-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id
        },
        body: JSON.stringify({
          code: code.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "แลกโค้ดไม่สำเร็จ");
      }

      updateBalance(data.newBalance);
      setSuccessData(data);
      setCode('');

      try {
        confetti({
          particleCount: 160,
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

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-md bg-[#140e28] border-2 border-amber-500/40 rounded-3xl shadow-[0_0_60px_rgba(245,158,11,0.3)] overflow-hidden my-6 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow Header Accent */}
        <div className="h-2 bg-gradient-to-r from-amber-500 via-orange-500 to-purple-600 w-full" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/60 hover:bg-amber-950/60 text-amber-200 hover:text-white transition-colors border border-amber-500/30"
          title="ปิดหน้าต่าง"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="p-6 text-center border-b border-purple-500/20 bg-gradient-to-b from-amber-950/30 to-transparent">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 border-2 border-amber-300 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(245,158,11,0.5)] mb-3 text-neutral-950">
            <Gift className="w-7 h-7" />
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white tracking-wide flex items-center justify-center gap-2">
            <span>ใส่โค้ดรับเงินฟรี</span>
            <Sparkles className="w-5 h-5 text-amber-400" />
          </h3>
          <p className="text-xs sm:text-sm text-purple-200/80 mt-1">
            กรอกโค้ดโปรโมชั่นเพื่อรับเครดิตเข้ากระเป๋าอัตโนมัติทันที
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          
          {/* SUCCESS MESSAGE */}
          {successData && (
            <div className="p-5 rounded-2xl bg-emerald-950/70 border-2 border-emerald-500/60 text-center space-y-3 animate-in zoom-in-95 duration-200 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center mx-auto text-emerald-300">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-white">แลกโค้ดสำเร็จเรียบร้อย!</h4>
                <p className="text-xs text-emerald-300 mt-0.5">
                  ระบบได้เติมเงินเข้ากระเป๋าของคุณแล้ว
                </p>
              </div>
              <div className="p-3 rounded-xl bg-black/60 border border-emerald-500/30 space-y-1 text-xs">
                <div className="flex justify-between text-purple-200/80">
                  <span>โค้ดที่ใช้:</span>
                  <span className="font-mono font-bold text-amber-300">{successData.code || "โค้ดของขวัญ"}</span>
                </div>
                <div className="flex justify-between text-purple-200/80">
                  <span>ยอดเงินที่ได้รับ:</span>
                  <span className="font-bold text-emerald-400 text-sm">+ ฿{successData.rewardAmount?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t border-white/10 pt-1 text-purple-200">
                  <span>ยอดเงินคงเหลือปัจจุบัน:</span>
                  <span className="font-bold text-white">฿{successData.newBalance?.toLocaleString()}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSuccessData(null)}
                className="w-full py-2.5 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-purple-200 text-xs font-semibold transition-colors"
              >
                ใส่โค้ดอื่นเพิ่มเติม
              </button>
            </div>
          )}

          {/* ERROR MESSAGE */}
          {error && (
            <div className="p-3.5 rounded-2xl bg-red-950/70 border border-red-500/50 text-red-200 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* NOT LOGGED IN STATE */}
          {!user ? (
            <div className="p-5 rounded-2xl bg-purple-950/40 border border-purple-500/30 text-center space-y-3">
              <p className="text-xs sm:text-sm text-purple-200 font-medium">
                กรุณาเข้าสู่ระบบก่อนใส่โค้ดรับเงิน
              </p>
              <button
                onClick={() => {
                  onClose();
                  if (onOpenAuth) onOpenAuth('signin');
                }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>เข้าสู่ระบบ / สมัครสมาชิกตอนนี้</span>
              </button>
            </div>
          ) : !successData && (
            /* REDEEM FORM */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* CODE INPUT */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-purple-200">
                  กรอกโค้ดของขวัญ (Promo Code):
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value);
                      setError(null);
                    }}
                    placeholder="กรอกโค้ดโปรโมชั่นที่นี่..."
                    className="w-full bg-black/60 border-2 border-purple-500/30 focus:border-amber-400 rounded-2xl px-4 py-3 text-sm text-white font-mono placeholder-purple-400/30 focus:outline-none transition-all pr-10 tracking-wide"
                    autoFocus
                  />
                  {code && (
                    <button
                      type="button"
                      onClick={() => setCode('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400 hover:text-white text-xs p-1"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* CURRENT BALANCE DISPLAY */}
              <div className="flex justify-between items-center text-xs text-purple-300/80 px-1">
                <span>ยอดเงินปัจจุบัน:</span>
                <span className="font-bold text-white">฿ {user.balance?.toLocaleString() || 0}</span>
              </div>

              {/* SUBMIT BUTTON */}
              <button
                type="submit"
                disabled={loading || !code.trim()}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-neutral-950 font-black text-sm sm:text-base shadow-[0_0_25px_rgba(245,158,11,0.4)] transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
                    <span>กำลังตรวจสอบโค้ด...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-neutral-950" />
                    <span>ยืนยันแลกรับเงิน</span>
                    <ArrowRight className="w-4 h-4 text-neutral-950" />
                  </>
                )}
              </button>

            </form>
          )}

        </div>

      </div>
    </div>
  );
}
