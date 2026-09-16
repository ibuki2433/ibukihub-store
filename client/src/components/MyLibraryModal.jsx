import React, { useState, useEffect } from 'react';
import { X, Download, FolderDown, Clock, ShieldCheck, Sparkles, KeyRound, Monitor, Copy, Check, History, AlertCircle, ShoppingBag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function MyLibraryModal({ onClose, onOpenShop, onOpenHistory }) {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedKeyId, setCopiedKeyId] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch('/api/orders/my-orders', {
        headers: { 'x-user-id': user.id }
      });
      const data = await res.json();
      if (res.ok) {
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error("Fetch orders error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyKey = (key, orderId) => {
    navigator.clipboard.writeText(key);
    setCopiedKeyId(orderId);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const isOrderKeyExpired = (order) => {
    if (!order.licenseKey) return false;
    const isLifetime = order.isLifetime === true || order.expiresAt === 'LIFETIME' || (order.durationDays && order.durationDays >= 9999);
    if (isLifetime) return false;
    if (!order.expiresAt) return false;
    const exp = new Date(order.expiresAt).getTime();
    return !isNaN(exp) && exp < Date.now();
  };

  const activeOrders = orders.filter(o => !isOrderKeyExpired(o));
  const expiredCount = orders.filter(o => isOrderKeyExpired(o)).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
      
      <div 
        className="relative w-full max-w-4xl xl:max-w-5xl bg-[#130f24] border-2 border-purple-500/40 rounded-3xl shadow-[0_25px_80px_rgba(0,0,0,0.85)] shadow-purple-950/70 overflow-hidden my-4 sm:my-8 animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 z-20 p-2.5 rounded-full bg-black/60 hover:bg-purple-900/80 text-purple-200 hover:text-white transition-all border border-purple-400/30 shadow-lg active:scale-95"
          title="ปิดหน้าต่าง"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="bg-[#18132e] border-b border-purple-900/40 p-6 sm:p-7 text-white relative">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500" />
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-purple-500/20 border border-purple-400/40 text-purple-300 shadow-inner">
                <FolderDown className="w-6 h-6 text-purple-300" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-black tracking-wide text-white">
                  {lang === 'th' ? 'คลังซอฟต์แวร์ที่ใช้งานได้' : t('libraryTitle')}
                </h3>
                <p className="text-xs sm:text-sm text-purple-300/80 mt-1">
                  {lang === 'th' ? 'เฉพาะโปรแกรมและ License Key ที่ยังไม่หมดอายุการใช้งาน' : t('librarySubtitle')}
                </p>
              </div>
            </div>

            {onOpenHistory && (
              <button
                onClick={() => { onClose(); onOpenHistory('orders'); }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#231a44] hover:bg-[#2e225a] text-purple-200 hover:text-white text-xs sm:text-sm font-semibold border border-purple-500/40 shadow transition-all active:scale-95"
              >
                <History className="w-4 h-4 text-purple-400" />
                <span>ดูประวัติคำสั่งซื้อทั้งหมด ({orders.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 max-h-[78vh] overflow-y-auto space-y-6">
          
          {/* Expired Notice Banner if any */}
          {expiredCount > 0 && (
            <div className="p-3.5 rounded-2xl bg-purple-950/70 border border-purple-500/40 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm text-purple-200 animate-in fade-in">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  มีคีย์ซอฟต์แวร์ที่หมดอายุแล้ว <b>{expiredCount}</b> รายการ (ระบบนำออกจากคลังอัตโนมัติแล้ว)
                </span>
              </div>
              {onOpenHistory && (
                <button
                  onClick={() => { onClose(); onOpenHistory('orders'); }}
                  className="px-3.5 py-1.5 rounded-xl bg-purple-800/80 hover:bg-purple-700 text-white font-bold text-xs transition-all border border-purple-400/40 shadow-sm"
                >
                  เปิดดูในประวัติการสั่งซื้อ →
                </button>
              )}
            </div>
          )}

          {loading ? (
            <div className="py-16 text-center text-purple-300/60 text-sm">
              {t('libraryLoading')}
            </div>
          ) : activeOrders.length === 0 ? (
            <div className="py-16 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-purple-950/50 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-inner">
                <FolderDown className="w-8 h-8 opacity-60" />
              </div>
              <div className="text-base sm:text-lg font-bold text-purple-200">
                {orders.length > 0
                  ? 'ซอฟต์แวร์ที่คุณเคยซื้อหมดอายุการใช้งานแล้ว'
                  : (lang === 'th' ? 'คลังโปรแกรมของคุณยังว่างเปล่า' : t('libraryEmpty'))}
              </div>
              <p className="text-xs sm:text-sm text-purple-400/70 max-w-sm mx-auto">
                {orders.length > 0
                  ? 'คีย์ซอฟต์แวร์ทั้งหมดหมดอายุแล้ว คุณสามารถกดต่ออายุหรือซื้อใหม่ หรือเปิดดูประวัติรายการเดิมได้ที่ประวัติการสั่งซื้อ'
                  : (lang === 'th' ? 'เลือกซื้อซอฟต์แวร์ที่คุณต้องการเพื่อรับสิทธิ์และดาวน์โหลดใช้งานได้ทันที 24 ชม.' : 'Purchase software to get instant access and download keys anytime 24/7.')}
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                {onOpenShop && (
                  <button
                    onClick={onOpenShop}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold shadow-lg transition-all active:scale-95 flex items-center gap-2"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>เลือกซื้อซอฟต์แวร์</span>
                  </button>
                )}
                {orders.length > 0 && onOpenHistory && (
                  <button
                    onClick={() => { onClose(); onOpenHistory('orders'); }}
                    className="px-5 py-2.5 rounded-xl bg-[#231a44] hover:bg-[#2f225c] text-purple-200 text-xs sm:text-sm font-bold border border-purple-500/40 transition-all active:scale-95 flex items-center gap-2"
                  >
                    <History className="w-4 h-4" />
                    <span>ดูประวัติทั้งหมด</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            activeOrders.map((order) => (
              <div
                key={order.id}
                className="p-5 sm:p-7 rounded-3xl bg-[#18132e] border-2 border-purple-500/30 hover:border-purple-400/50 transition-all space-y-4 shadow-xl relative overflow-hidden"
              >
                {/* Header info */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <span className="text-xs font-mono font-bold text-purple-400/80 uppercase tracking-wider">
                      {t('libraryOrderLabel')}{order.id}
                    </span>
                    <h4 className="text-lg sm:text-2xl font-black text-white mt-1">
                      {order.productName}
                    </h4>
                    <div className="flex items-center gap-3 text-xs sm:text-sm text-purple-300/80 mt-1.5">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-purple-400/70" />
                        {new Date(order.createdAt).toLocaleString(lang === 'th' ? 'th-TH' : 'en-US')}
                      </span>
                      <span>•</span>
                      <span className="text-amber-300 font-bold text-sm sm:text-base">
                        {t('currency')} {order.price.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-purple-950/90 border border-purple-400/50 text-xs sm:text-sm font-bold text-purple-200 shadow-sm">
                    <ShieldCheck className="w-4 h-4 text-purple-400" />
                    <span>{order.planName || (order.isLifetime !== false ? t('libraryLifetimeLicense') : `เช่า ${order.durationDays} วัน`)}</span>
                  </div>
                </div>

                {/* License Key Card or Instant Access Notice */}
                {order.licenseKey ? (
                  <div className="p-4 sm:p-5 rounded-2xl bg-[#0e0a1a] border border-purple-400/50 space-y-3 shadow-inner">
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="font-bold text-purple-200 flex items-center gap-2">
                        <KeyRound className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                        <span>License Key ประจำคำสั่งซื้อของคุณ</span>
                      </span>
                      <span className="text-xs px-2.5 py-1 rounded-full bg-purple-900/80 text-purple-200 border border-purple-500/40 font-semibold shadow-sm">
                        {order.isLifetime !== false || order.expiresAt === 'LIFETIME' 
                          ? '👑 สิทธิ์ตลอดชีพ' 
                          : `หมดอายุ: ${new Date(order.expiresAt).toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-US')}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <input
                        type="text"
                        readOnly
                        value={order.licenseKey}
                        className="w-full bg-[#080512] border border-purple-500/50 text-purple-100 px-4 py-3 sm:py-3.5 rounded-xl text-xs sm:text-base font-mono font-bold tracking-wider focus:outline-none select-all shadow-inner"
                      />
                      <button
                        onClick={() => handleCopyKey(order.licenseKey, order.id)}
                        className="py-3 sm:py-3.5 px-4 sm:px-6 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shrink-0 transition-all active:scale-95 shadow-md"
                      >
                        {copiedKeyId === order.id ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                        <span>{copiedKeyId === order.id ? 'คัดลอกแล้ว' : 'คัดลอกคีย์'}</span>
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center justify-between text-xs text-purple-300/80 pt-1.5 border-t border-purple-900/40 gap-2">
                      {order.machineId ? (
                        <span className="flex items-center gap-1.5">
                          <Monitor className="w-4 h-4 text-purple-400" />
                          <span>ผูกกับ Machine ID: <b className="text-purple-100 font-mono">{order.machineId}</b></span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-purple-300/80">
                          <span>สถานะ: พร้อมนำไปเปิดใช้งานในโปรแกรม (ระบบจะผูกเครื่องอัตโนมัติเมื่อเปิดโปรแกรม)</span>
                        </span>
                      )}
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>สิทธิ์พร้อมใช้งาน</span>
                      </span>
                    </div>
                  </div>
                ) : (
                  /* Instant Access Notice (No Key Needed for Downloader v2.2 / v2.5) */
                  <div className="flex items-center justify-between p-4 bg-black/40 rounded-2xl border border-purple-500/30 text-xs sm:text-sm">
                    <div className="flex items-center gap-2 text-purple-200">
                      <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
                      <span>{t('libraryNotice')}</span>
                    </div>
                    <span className="text-xs text-emerald-400 font-bold shrink-0">{t('libraryReady')}</span>
                  </div>
                )}

                {/* Download Action Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="text-xs sm:text-sm text-purple-300/80 flex items-center gap-2">
                    <span>{t('libraryFileLabel')}</span>
                    <code className="text-purple-100 bg-black/50 px-2.5 py-1 rounded-lg font-mono text-xs sm:text-sm border border-purple-500/20">
                      {order.fileName}
                    </code>
                  </div>

                  <a
                    href={`/api/download/${order.id}?userId=${user.id}`}
                    download={order.fileName}
                    className="px-6 sm:px-8 py-3 sm:py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-[0_6px_25px_rgba(168,85,247,0.45)] hover:shadow-[0_8px_30px_rgba(168,85,247,0.65)] transition-all transform active:scale-95"
                  >
                    <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>{t('libraryDownloadBtn')}</span>
                  </a>
                </div>

              </div>
            ))
          )}

        </div>

      </div>

    </div>
  );
}
