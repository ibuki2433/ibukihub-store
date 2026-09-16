import React, { useState } from 'react';
import { X, CheckCircle2, Download, AlertCircle, ShoppingBag, Wallet, Sparkles, ExternalLink, KeyRound, Monitor, Copy, Check, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function BuyModal({ product, initialPlanId, onClose, onOpenTopup, onOpenAuth, onOpenLibrary, onPurchaseComplete }) {
  const { user, updateBalance } = useAuth();
  const { t, lang } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [purchasedOrder, setPurchasedOrder] = useState(null);
  const [copiedKey, setCopiedKey] = useState(false);

  // Selected plan state (for products with rental/lifetime plans)
  const [selectedPlanId, setSelectedPlanId] = useState(
    initialPlanId || (product?.plans && product.plans.length > 0 ? (product.plans.find(p => p.id === '30days')?.id || product.plans[0]?.id) : null)
  );

  if (!product) return null;

  const currentPlan = product?.plans?.find(p => p.id === selectedPlanId) || (product?.plans ? product.plans[0] : null);
  const activePrice = currentPlan ? currentPlan.price : product.price;
  const userBalance = user?.balance || 0;
  const isBalanceEnough = userBalance >= activePrice;

  const handleCopyKey = (key) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleConfirmBuy = async () => {
    if (!user) {
      onOpenAuth('login');
      return;
    }

    if (!isBalanceEnough) {
      onOpenTopup();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/orders/buy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id
        },
        body: JSON.stringify({
          productId: product.id,
          planId: currentPlan?.id
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "เกิดข้อผิดพลาดในการสั่งซื้อ");

      updateBalance(data.remainingBalance);
      setPurchasedOrder(data.order);

      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 }
        });
      } catch (e) {}

      if (onPurchaseComplete) onPurchaseComplete();

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
      
      <div 
        className="relative w-full max-w-lg bg-[#141022] border border-purple-400/30 rounded-2xl shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in duration-200"
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
            <ShoppingBag className="w-4 h-4 text-purple-400" />
            <h3 className="text-base sm:text-lg font-bold">
              {purchasedOrder ? t('buySuccessTitle') : t('buyTitle')}
            </h3>
          </div>
          <p className="text-xs text-purple-300/70 mt-0.5">
            {purchasedOrder ? t('buySuccessSub') : t('buySubtitle')}
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4">
          
          {/* SUCCESS SCREEN */}
          {purchasedOrder ? (
            <div className="space-y-4 animate-in fade-in duration-300">
              
              <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-400/30 flex items-center gap-3">
                <CheckCircle2 className="w-7 h-7 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-purple-200">{t('libraryOrderLabel')}{purchasedOrder.id}</div>
                  <div className="text-xs text-purple-300/80 mt-0.5 font-bold">{purchasedOrder.productName}</div>
                  {purchasedOrder.planName && (
                    <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-900/80 text-purple-200 border border-purple-500/30">
                      ⚡ {purchasedOrder.planName}
                    </span>
                  )}
                </div>
              </div>

              {/* License Key Display or Software Access */}
              {purchasedOrder.licenseKey ? (
                <div className="p-4 rounded-xl bg-[#18122c] border border-purple-400/40 space-y-3 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-purple-200 flex items-center gap-1.5">
                      <KeyRound className="w-4 h-4 text-purple-400" />
                      <span>License Key ประจำคำสั่งซื้อของคุณ</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-900/60 text-purple-200 border border-purple-500/30 font-semibold">
                      {purchasedOrder.isLifetime ? '👑 ตลอดชีพ' : `ระยะเวลา ${purchasedOrder.durationDays} วัน`}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={purchasedOrder.licenseKey}
                      className="w-full bg-[#0e0a1b] border border-purple-500/40 text-purple-200 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-mono font-bold tracking-wider focus:outline-none select-all"
                    />
                    <button
                      onClick={() => handleCopyKey(purchasedOrder.licenseKey)}
                      className="py-2.5 px-3.5 rounded-xl bg-purple-700 hover:bg-purple-600 text-white text-xs font-medium flex items-center gap-1.5 shrink-0 transition-all active:scale-95 shadow"
                    >
                      {copiedKey ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedKey ? 'คัดลอกแล้ว' : 'คัดลอกคีย์'}</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center justify-between text-[11px] text-purple-300/80 pt-1 border-t border-purple-900/40 gap-1">
                    <span className="text-emerald-400 font-medium">✅ สิทธิ์พร้อมใช้งาน (นำไปเปิดใช้งานในโปรแกรมได้เลย)</span>
                    <span className="text-purple-300/60 text-[10px]">{purchasedOrder.planName || 'สิทธิ์แท้'}</span>
                  </div>

                  <p className="text-[11px] text-purple-200/90 bg-purple-950/50 p-2.5 rounded-lg border border-purple-500/25 leading-relaxed">
                    {purchasedOrder.fileName?.endsWith('.exe') ? (
                      <>💡 <b>วิธีใช้งาน:</b> กดปุ่ม <b>ดาวน์โหลดไฟล์ซอฟต์แวร์</b> ด้านล่างเพื่อรับไฟล์ <b>Ibuki FB AutoPoster Pro.exe</b> เปิดโปรแกรมแล้วนำ License Key ด้านบนไปวางเพื่อเปิดใช้งานได้ทันทีโดยไม่ต้องแตกไฟล์!</>
                    ) : (
                      <>💡 <b>วิธีใช้งาน:</b> กดปุ่ม <b>ดาวน์โหลดไฟล์ซอฟต์แวร์</b> ด้านล่างเพื่อรับไฟล์ <b>Ibuki FB AutoPoster Pro_v1.0_Portable.zip</b> แตกไฟล์แล้วเปิดโปรแกรม <b>Ibuki FB AutoPoster Pro</b> นำ License Key ด้านบนไปวางแล้วกดเปิดใช้งาน โปรแกรมจะพร้อมทำงานทันที!</>
                    )}
                  </p>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-purple-950/60 border border-purple-400/40 text-center space-y-1">
                  <div className="text-xs sm:text-sm font-bold text-purple-200 flex items-center justify-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span>{t('buyNoKeyTitle')}</span>
                  </div>
                  <p className="text-[11px] text-purple-300/80">
                    {t('buyNoKeyDesc')}
                  </p>
                </div>
              )}

              {/* Instant Download Button */}
              <div className="p-4 rounded-xl bg-[#19142b] border border-purple-500/25 space-y-3 shadow-inner">
                <div className="flex items-center justify-between text-xs text-purple-300/80">
                  <span>{t('buyPackageFile')}</span>
                  <span className="font-semibold text-purple-200">
                    {purchasedOrder.productId === 'prod_autoposter' || purchasedOrder.productName?.toLowerCase().includes('autoposter')
                      ? 'Ibuki FB AutoPoster Pro_v1.0_Portable.zip'
                      : (purchasedOrder.fileName || 'Ibuki FB AutoPoster Pro_v1.0_Portable.zip')}
                  </span>
                </div>

                <a
                  href={`/api/download/${purchasedOrder.id}?userId=${user?.id}`}
                  download={
                    purchasedOrder.productId === 'prod_autoposter' || purchasedOrder.productName?.toLowerCase().includes('autoposter')
                      ? 'Ibuki FB AutoPoster Pro_v1.0_Portable.zip'
                      : (purchasedOrder.fileName || 'Ibuki FB AutoPoster Pro_v1.0_Portable.zip')
                  }
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(168,85,247,0.5)] transition-all transform active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>
                    {purchasedOrder.productId === 'prod_autoposter' || purchasedOrder.productName?.toLowerCase().includes('autoposter')
                      ? 'ดาวน์โหลดโปรแกรม Ibuki FB AutoPoster Pro (.zip)'
                      : (purchasedOrder.fileName?.endsWith('.exe')
                          ? `ดาวน์โหลดโปรแกรม (${purchasedOrder.fileName})`
                          : `ดาวน์โหลดไฟล์ซอฟต์แวร์ (${purchasedOrder.fileName || '.zip'})`)}
                  </span>
                </a>

                <p className="text-[11px] text-center text-purple-300/70">
                  📦 ไฟล์แบบ Portable (.zip) ขนาด 125 MB แตกไฟล์แล้วเปิดโปรแกรม Ibuki FB AutoPoster Pro และกรอกคีย์ใช้งานได้ทันที
                </p>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  onClick={() => { onClose(); onOpenLibrary(); }}
                  className="py-2 px-3 rounded-xl bg-[#1d1830] hover:bg-[#251f3e] text-purple-200 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors border border-purple-500/20"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{t('buyOpenLibrary')}</span>
                </button>
                <button
                  onClick={onClose}
                  className="py-2 px-3 rounded-xl bg-purple-900/60 hover:bg-purple-800/60 text-purple-200 text-xs font-medium transition-colors border border-purple-500/20"
                >
                  {t('buyDone')}
                </button>
              </div>

            </div>
          ) : (
            /* PRE-PURCHASE CONFIRMATION */
            <div className="space-y-4">
              
              {/* Product Summary */}
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[#19142b] border border-purple-500/20">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-14 h-14 rounded-lg object-cover border border-purple-500/20 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs sm:text-sm font-semibold text-white truncate">{product.name}</h4>
                  <div className="text-[11px] text-purple-300/60 mt-0.5">
                    {currentPlan ? currentPlan.name : `${product.version} • ${product.fileSize || "Ready"}`}
                  </div>
                  <div className="text-sm font-bold text-purple-200 mt-1">
                    ฿ {activePrice.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Plans Selector if Product has Plans */}
              {product.plans && product.plans.length > 0 && (
                <div className="p-3.5 rounded-xl bg-[#19142b] border border-purple-500/30 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-purple-200 flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-amber-400" />
                      <span>เลือกระยะเวลาการใช้งาน (เช่า vs ถาวร)</span>
                    </span>
                    <span className="text-[10px] text-purple-300/70 font-semibold">{currentPlan?.badge}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {product.plans.map((p) => {
                      const isSel = (currentPlan?.id === p.id);
                      return (
                        <div
                          key={p.id}
                          onClick={() => setSelectedPlanId(p.id)}
                          className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                            isSel 
                              ? 'bg-purple-900/60 border-purple-400 ring-1 ring-purple-400/50 shadow' 
                              : 'bg-[#120e22] hover:bg-[#1b1532] border-purple-500/20 text-purple-200'
                          }`}
                        >
                          <div>
                            <div className="text-xs font-bold text-white flex items-center gap-1.5">
                              <span>{p.name}</span>
                            </div>
                            <div className="text-[10px] text-purple-300/70 mt-0.5">
                              {p.badge || (p.isLifetime ? '👑 ตลอดชีพ' : `${p.durationDays} วัน`)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-black text-purple-200">฿ {p.price.toLocaleString()}</div>
                            {p.originalPrice && (
                              <div className="text-[10px] text-purple-400/50 line-through">฿ {p.originalPrice.toLocaleString()}</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* User Balance Check */}
              {user ? (
                <div className="p-3.5 rounded-xl bg-[#19142b] border border-purple-500/20 space-y-2 text-xs">
                  <div className="flex justify-between text-purple-300/80">
                    <span>{t('buyCurrentBalance')}</span>
                    <span className="font-semibold text-white">฿ {userBalance.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-purple-300/80">
                    <span>{t('buyProductPrice')}</span>
                    <span className="font-semibold text-purple-300">- ฿ {activePrice.toLocaleString()}</span>
                  </div>
                  <div className="pt-2 border-t border-purple-900/30 flex justify-between font-semibold">
                    <span>{t('buyBalanceAfter')}</span>
                    <span className={isBalanceEnough ? "text-emerald-400" : "text-red-400"}>
                      ฿ {(userBalance - activePrice).toLocaleString()}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/30 text-xs text-purple-200 flex items-center justify-between">
                  <span>{t('buyNeedLogin')}</span>
                  <button
                    onClick={() => { onClose(); onOpenAuth('login'); }}
                    className="px-3 py-1 bg-purple-700 hover:bg-purple-600 text-white font-medium rounded-lg text-xs"
                  >
                    {t('navSignIn')}
                  </button>
                </div>
              )}

              {/* Insufficient balance warning */}
              {user && !isBalanceEnough && (
                <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-xs text-red-200 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{t('buyShortBalance')} {(activePrice - userBalance).toLocaleString()})</span>
                  </div>
                  <button
                    onClick={() => { onClose(); onOpenTopup(); }}
                    className="px-3 py-1 rounded-lg bg-purple-700 hover:bg-purple-600 text-white font-semibold text-xs flex items-center gap-1 shrink-0"
                  >
                    <Wallet className="w-3.5 h-3.5" />
                    <span>{t('buyTopupBtn')}</span>
                  </button>
                </div>
              )}

              {error && (
                <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-xs text-red-200">
                  {error}
                </div>
              )}

              {/* Purchase Button */}
              <button
                onClick={handleConfirmBuy}
                disabled={loading || (user && !isBalanceEnough)}
                className={`w-full py-2.5 rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
                  loading || (user && !isBalanceEnough)
                    ? 'bg-[#19142b] text-purple-400/40 cursor-not-allowed border border-purple-900/20'
                    : 'bg-purple-700 hover:bg-purple-600 text-white shadow-soft-purple active:scale-95'
                }`}
              >
                {loading ? (
                  <span>{t('buyProcessing')}</span>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    <span>{t('buyBtnConfirm')} (฿ {activePrice.toLocaleString()})</span>
                  </>
                )}
              </button>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
