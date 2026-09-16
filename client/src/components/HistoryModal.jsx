import React, { useState, useEffect } from 'react';
import { 
  X, History, ShoppingBag, Wallet, Clock, CheckCircle2, XCircle, 
  AlertCircle, KeyRound, Copy, Check, ExternalLink, RefreshCw, 
  Calendar, CreditCard, ChevronRight, Download, Sparkles, Filter
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function HistoryModal({ isOpen, onClose, initialTab = 'all', onOpenShop, onOpenTopup }) {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const [activeTab, setActiveTab] = useState(initialTab); // 'all', 'orders', 'topups'
  const [historyData, setHistoryData] = useState({ orders: [], topups: [] });
  const [loading, setLoading] = useState(true);
  const [copiedKeyId, setCopiedKeyId] = useState(null);
  const [previewSlip, setPreviewSlip] = useState(null);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    if (isOpen && user) {
      fetchHistory();
    }
  }, [isOpen, user]);

  const fetchHistory = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/orders/my-history', {
        headers: { 'x-user-id': user.id }
      });
      if (res.ok) {
        const data = await res.json();
        setHistoryData({
          orders: data.orders || [],
          topups: data.topups || []
        });
      } else {
        // Fallback to my-orders if endpoint not available
        const fallbackRes = await fetch('/api/orders/my-orders', {
          headers: { 'x-user-id': user.id }
        });
        const fallbackData = await fallbackRes.json();
        setHistoryData({
          orders: fallbackData.orders || [],
          topups: []
        });
      }
    } catch (err) {
      console.error("Fetch history error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyKey = (key, orderId) => {
    if (!key) return;
    navigator.clipboard.writeText(key);
    setCopiedKeyId(orderId);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  if (!isOpen) return null;

  const orders = historyData.orders || [];
  const topups = historyData.topups || [];

  // Combine and sort for the "all" tab
  const combinedActivities = [
    ...orders.map(o => ({
      type: 'order',
      date: new Date(o.createdAt || o.created_at || Date.now()).getTime(),
      data: o
    })),
    ...topups.map(tp => ({
      type: 'topup',
      date: new Date(tp.createdAt || tp.created_at || Date.now()).getTime(),
      data: tp
    }))
  ].sort((a, b) => b.date - a.date);

  const activeOrdersCount = orders.filter(o => !o.isExpired).length;
  const expiredOrdersCount = orders.filter(o => o.isExpired).length;
  const totalTopupApproved = topups
    .filter(tp => tp.status === 'approved')
    .reduce((sum, tp) => sum + Number(tp.amount || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div 
        className="relative w-full max-w-4xl bg-[#130f24] border-2 border-purple-500/40 rounded-3xl shadow-[0_25px_80px_rgba(0,0,0,0.85)] shadow-purple-950/70 overflow-hidden my-4 sm:my-8 animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Ambient Glow */}
        <div className="absolute top-0 left-1/4 right-1/4 h-32 bg-gradient-to-b from-purple-600/20 via-indigo-600/10 to-transparent blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="relative p-5 sm:p-6 border-b border-purple-500/20 flex items-center justify-between bg-purple-950/30">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-purple-600/30 border border-purple-400/30">
              <History className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 font-sans">
                {lang === 'th' ? 'ประวัติการทำรายการ' : 'Transaction History'}
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-900/60 border border-purple-400/30 text-purple-200">
                  {orders.length + topups.length} {lang === 'th' ? 'รายการ' : 'records'}
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-purple-300/80">
                {lang === 'th' 
                  ? 'ตรวจสอบประวัติการซื้อซอฟต์แวร์ คีย์โปรแกรม และการเติมเงินเข้ากระเป๋า'
                  : 'Review all your software orders, license keys, and wallet top-ups'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchHistory}
              disabled={loading}
              className="p-2 rounded-xl bg-[#1c1635] hover:bg-purple-900/50 border border-purple-500/30 text-purple-300 hover:text-white transition-all disabled:opacity-50"
              title="รีเฟรชข้อมูล"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-[#1c1635] hover:bg-purple-900/50 border border-purple-500/30 text-purple-300 hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Stats Overview */}
        <div className="p-4 sm:p-6 bg-[#0f0b1d] border-b border-purple-900/40 grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="p-3 sm:p-3.5 rounded-2xl bg-[#18132e] border border-purple-500/20">
            <div className="flex items-center gap-2 text-xs text-purple-300/70 mb-1">
              <ShoppingBag className="w-3.5 h-3.5 text-purple-400" />
              <span>{lang === 'th' ? 'คำสั่งซื้อซอฟต์แวร์' : 'Software Orders'}</span>
            </div>
            <div className="text-lg sm:text-xl font-bold text-white flex items-baseline gap-1.5">
              <span>{orders.length}</span>
              <span className="text-[11px] font-normal text-purple-400/80">
                ({activeOrdersCount} {lang === 'th' ? 'ใช้งานได้' : 'active'})
              </span>
            </div>
          </div>

          <div className="p-3 sm:p-3.5 rounded-2xl bg-[#18132e] border border-purple-500/20">
            <div className="flex items-center gap-2 text-xs text-purple-300/70 mb-1">
              <Wallet className="w-3.5 h-3.5 text-emerald-400" />
              <span>{lang === 'th' ? 'เติมเงินสะสมสำเร็จ' : 'Total Top-ups'}</span>
            </div>
            <div className="text-lg sm:text-xl font-bold text-emerald-400">
              ฿{totalTopupApproved.toLocaleString()}
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1 p-3 sm:p-3.5 rounded-2xl bg-[#18132e] border border-purple-500/20">
            <div className="flex items-center gap-2 text-xs text-purple-300/70 mb-1">
              <CreditCard className="w-3.5 h-3.5 text-amber-400" />
              <span>{lang === 'th' ? 'เครดิตคงเหลือปัจจุบัน' : 'Current Balance'}</span>
            </div>
            <div className="text-lg sm:text-xl font-bold text-amber-300">
              ฿{user?.balance ? user.balance.toLocaleString() : 0}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-4 sm:px-6 pt-4 border-b border-purple-900/40 flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-semibold transition-all border-b-2 flex items-center gap-2 ${
                activeTab === 'all'
                  ? 'text-purple-200 border-purple-400 bg-purple-950/40'
                  : 'text-purple-400/60 border-transparent hover:text-purple-200'
              }`}
            >
              <span>{lang === 'th' ? 'ทั้งหมด' : 'All Activity'}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-900/60">
                {combinedActivities.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-semibold transition-all border-b-2 flex items-center gap-2 ${
                activeTab === 'orders'
                  ? 'text-purple-200 border-purple-400 bg-purple-950/40'
                  : 'text-purple-400/60 border-transparent hover:text-purple-200'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5 text-purple-400" />
              <span>{lang === 'th' ? 'การสั่งซื้อซอฟต์แวร์' : 'Software Orders'}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-900/60">
                {orders.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('topups')}
              className={`px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-semibold transition-all border-b-2 flex items-center gap-2 ${
                activeTab === 'topups'
                  ? 'text-purple-200 border-purple-400 bg-purple-950/40'
                  : 'text-purple-400/60 border-transparent hover:text-purple-200'
              }`}
            >
              <Wallet className="w-3.5 h-3.5 text-emerald-400" />
              <span>{lang === 'th' ? 'การเติมเงินเข้าเว็บ' : 'Top-up History'}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-900/60">
                {topups.length}
              </span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 max-h-[60vh] overflow-y-auto space-y-3">
          {loading ? (
            <div className="py-16 text-center text-purple-300">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-purple-400" />
              <p className="text-sm">{lang === 'th' ? 'กำลังโหลดประวัติการทำรายการ...' : 'Loading transactions...'}</p>
            </div>
          ) : (
            <>
              {/* TAB: ALL */}
              {activeTab === 'all' && (
                combinedActivities.length === 0 ? (
                  <EmptyHistoryState lang={lang} onOpenShop={onOpenShop} onOpenTopup={onOpenTopup} onClose={onClose} />
                ) : (
                  combinedActivities.map((act, index) => (
                    act.type === 'order' ? (
                      <OrderHistoryCard 
                        key={`order-${act.data.id || index}`} 
                        order={act.data} 
                        lang={lang} 
                        handleCopyKey={handleCopyKey} 
                        copiedKeyId={copiedKeyId}
                        onOpenShop={onOpenShop}
                        onClose={onClose}
                      />
                    ) : (
                      <TopupHistoryCard 
                        key={`topup-${act.data.id || index}`} 
                        topup={act.data} 
                        lang={lang} 
                        onPreviewSlip={(url) => setPreviewSlip(url)} 
                      />
                    )
                  ))
                )
              )}

              {/* TAB: ORDERS */}
              {activeTab === 'orders' && (
                orders.length === 0 ? (
                  <div className="text-center py-12 px-4 rounded-2xl bg-[#161228] border border-purple-500/20">
                    <ShoppingBag className="w-12 h-12 mx-auto text-purple-400/40 mb-3" />
                    <h3 className="text-base font-bold text-white mb-1">
                      {lang === 'th' ? 'ยังไม่มีประวัติการสั่งซื้อซอฟต์แวร์' : 'No software orders found'}
                    </h3>
                    <p className="text-xs text-purple-300/70 max-w-md mx-auto mb-4">
                      {lang === 'th' 
                        ? 'เมื่อคุณซื้อโปรแกรมจากหน้าร้าน รายการคำสั่งซื้อและคีย์ทั้งหมดจะถูกบันทึกไว้ที่นี่'
                        : 'Software purchases and license keys will appear here once purchased.'}
                    </p>
                    {onOpenShop && (
                      <button
                        onClick={() => { onClose(); onOpenShop(); }}
                        className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md transition-all"
                      >
                        {lang === 'th' ? 'ไปที่หน้าร้านค้า' : 'Go to Software Catalog'}
                      </button>
                    )}
                  </div>
                ) : (
                  orders.map(order => (
                    <OrderHistoryCard 
                      key={order.id} 
                      order={order} 
                      lang={lang} 
                      handleCopyKey={handleCopyKey} 
                      copiedKeyId={copiedKeyId}
                      onOpenShop={onOpenShop}
                      onClose={onClose}
                    />
                  ))
                )
              )}

              {/* TAB: TOPUPS */}
              {activeTab === 'topups' && (
                topups.length === 0 ? (
                  <div className="text-center py-12 px-4 rounded-2xl bg-[#161228] border border-purple-500/20">
                    <Wallet className="w-12 h-12 mx-auto text-emerald-400/40 mb-3" />
                    <h3 className="text-base font-bold text-white mb-1">
                      {lang === 'th' ? 'ยังไม่มีประวัติการเติมเงิน' : 'No top-up history found'}
                    </h3>
                    <p className="text-xs text-purple-300/70 max-w-md mx-auto mb-4">
                      {lang === 'th' 
                        ? 'คุณสามารถเติมเงินผ่าน PromptPay QR อัตโนมัติ หรือซองของขวัญทรูมันนี่วอลเล็ทได้ตลอด 24 ชม.'
                        : 'Top up your account balance anytime with PromptPay QR or TrueMoney Gift.'}
                    </p>
                    {onOpenTopup && (
                      <button
                        onClick={() => { onClose(); onOpenTopup(); }}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-all"
                      >
                        {lang === 'th' ? 'เติมเงินเข้าบัญชี' : 'Top-up Balance'}
                      </button>
                    )}
                  </div>
                ) : (
                  topups.map(topup => (
                    <TopupHistoryCard 
                      key={topup.id} 
                      topup={topup} 
                      lang={lang} 
                      onPreviewSlip={(url) => setPreviewSlip(url)} 
                    />
                  ))
                )
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-purple-900/40 bg-purple-950/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-purple-400/80">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
            <span>{lang === 'th' ? 'ข้อมูลมีการบันทึกและซิงค์กับฐานข้อมูลแบบเรียลไทม์' : 'Transactions synced in real-time'}</span>
          </div>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-[#1d1637] hover:bg-purple-900/50 border border-purple-500/30 text-purple-200 hover:text-white font-medium transition-all"
          >
            {lang === 'th' ? 'ปิดหน้าต่าง' : 'Close'}
          </button>
        </div>
      </div>

      {/* Slip Image Preview Modal */}
      {previewSlip && (
        <div 
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
          onClick={() => setPreviewSlip(null)}
        >
          <div className="relative max-w-sm w-full bg-[#171328] border border-purple-500/40 rounded-2xl overflow-hidden p-3 shadow-2xl">
            <div className="flex justify-between items-center mb-2 px-1">
              <span className="text-xs font-bold text-purple-200">หลักฐานการโอนเงิน (Slip)</span>
              <button 
                onClick={() => setPreviewSlip(null)}
                className="text-purple-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <img 
              src={previewSlip} 
              alt="Payment Slip" 
              className="w-full max-h-[75vh] object-contain rounded-xl bg-black/40" 
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-component: Empty State
function EmptyHistoryState({ lang, onOpenShop, onOpenTopup, onClose }) {
  return (
    <div className="text-center py-16 px-4 rounded-2xl bg-[#161228] border border-purple-500/20">
      <History className="w-14 h-14 mx-auto text-purple-400/30 mb-3" />
      <h3 className="text-lg font-bold text-white mb-1">
        {lang === 'th' ? 'ยังไม่มีประวัติการทำรายการ' : 'No Transactions Yet'}
      </h3>
      <p className="text-xs text-purple-300/70 max-w-md mx-auto mb-6">
        {lang === 'th' 
          ? 'คุณยังไม่มีคำสั่งซื้อโปรแกรมหรือการเติมเงินในระบบ เริ่มต้นสั่งซื้อซอฟต์แวร์หรือเติมเงินได้เลย'
          : 'You have not made any purchases or wallet top-ups yet.'}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {onOpenShop && (
          <button
            onClick={() => { onClose(); onOpenShop(); }}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md transition-all"
          >
            {lang === 'th' ? 'เลือกดูซอฟต์แวร์' : 'Browse Software'}
          </button>
        )}
        {onOpenTopup && (
          <button
            onClick={() => { onClose(); onOpenTopup(); }}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-all"
          >
            {lang === 'th' ? 'เติมเงินเข้าบัญชี' : 'Top-up Balance'}
          </button>
        )}
      </div>
    </div>
  );
}

// Sub-component: Order History Card
function OrderHistoryCard({ order, lang, handleCopyKey, copiedKeyId, onOpenShop, onClose }) {
  const isLifetime = order.isLifetime === true || order.expiresAt === 'LIFETIME' || (order.durationDays && order.durationDays >= 9999);
  const isExpired = order.isExpired;
  const requiresKey = order.requiresKey !== false && order.licenseKey;

  const formattedDate = new Date(order.createdAt || order.created_at || Date.now()).toLocaleDateString(
    lang === 'th' ? 'th-TH' : 'en-US',
    { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
  );

  return (
    <div className={`p-4 rounded-2xl border transition-all ${
      isExpired 
        ? 'bg-[#181226]/80 border-rose-900/40 opacity-85' 
        : 'bg-[#18132e] border-purple-500/25 hover:border-purple-500/50 shadow-md'
    }`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-purple-900/30">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${
            isExpired 
              ? 'bg-rose-950/40 border-rose-800/40 text-rose-400' 
              : 'bg-purple-950/60 border-purple-500/40 text-purple-300'
          }`}>
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-bold text-white text-sm sm:text-base">
                {order.productName || 'โปรแกรมซอฟต์แวร์'}
              </h4>
              {order.planName && (
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-purple-900/50 border border-purple-400/30 text-purple-200">
                  {order.planName}
                </span>
              )}
            </div>
            <div className="text-[11px] text-purple-300/70 flex items-center gap-2 mt-0.5">
              <span>{formattedDate}</span>
              <span>•</span>
              <span>คำสั่งซื้อ: #{order.id}</span>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          {requiresKey ? (
            isLifetime ? (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>ตลอดชีพ</span>
              </span>
            ) : isExpired ? (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center gap-1.5">
                <XCircle className="w-3.5 h-3.5" />
                <span>หมดอายุแล้ว</span>
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>ใช้งานได้</span>
              </span>
            )
          ) : (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5" />
              <span>ถาวร (Portable)</span>
            </span>
          )}

          <div className="text-right">
            <span className="text-xs sm:text-sm font-bold text-white">
              ฿{Number(order.price || 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Card Details / Key Section */}
      <div className="pt-3 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        {order.licenseKey ? (
          <div className="flex-1">
            <div className="text-[11px] text-purple-300/70 mb-1 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-purple-400" />
              <span>รหัสใช้งาน (License Key):</span>
              {order.expiresAt && !isLifetime && (
                <span className={`text-[10px] ml-1 ${isExpired ? 'text-rose-400 font-semibold' : 'text-purple-300'}`}>
                  (หมดอายุ: {new Date(order.expiresAt).toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-US')})
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <code className="bg-[#0e0a1a] px-3 py-1.5 rounded-xl border border-purple-500/30 text-purple-200 font-mono tracking-wider select-all break-all text-xs">
                {order.licenseKey}
              </code>
              <button
                onClick={() => handleCopyKey(order.licenseKey, order.id)}
                className="px-2.5 py-1.5 rounded-xl bg-purple-900/40 hover:bg-purple-800/60 border border-purple-500/30 text-purple-200 hover:text-white flex items-center gap-1 transition-all shrink-0"
                title="คัดลอกคีย์"
              >
                {copiedKeyId === order.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 text-[11px]">คัดลอกแล้ว</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span className="text-[11px]">คัดลอก</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-purple-300/70 text-xs">
            โปรแกรมแบบ Portable สิทธิ์ดาวน์โหลดและใช้งานถาวร ไม่ต้องใช้คีย์
          </div>
        )}

        {/* Action Button */}
        <div className="shrink-0 flex items-center gap-2 self-end md:self-center">
          {isExpired ? (
            onOpenShop && (
              <button
                onClick={() => { onClose(); onOpenShop(); }}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-md flex items-center gap-1.5 transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>ต่ออายุ / สั่งซื้อใหม่</span>
              </button>
            )
          ) : (
            order.downloadUrl && (
              <a
                href={order.downloadUrl}
                target="_blank"
                rel="noreferrer"
                download
                className="px-3 py-1.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 border border-purple-500/40 text-purple-200 hover:text-white font-medium text-xs flex items-center gap-1.5 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>ดาวน์โหลดไฟล์</span>
              </a>
            )
          )}
        </div>
      </div>
    </div>
  );
}

// Sub-component: Topup History Card
function TopupHistoryCard({ topup, lang, onPreviewSlip }) {
  const isApproved = topup.status === 'approved';
  const isPending = topup.status === 'pending';
  const isRejected = topup.status === 'rejected';

  const formattedDate = new Date(topup.createdAt || topup.created_at || Date.now()).toLocaleDateString(
    lang === 'th' ? 'th-TH' : 'en-US',
    { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
  );

  const channelLabel = topup.method === 'truemoney' || topup.channel === 'truemoney'
    ? (lang === 'th' ? 'ซองของขวัญทรูมันนี่ (TrueMoney Gift)' : 'TrueMoney Gift Voucher')
    : (lang === 'th' ? 'สแกนจ่าย PromptPay QR' : 'PromptPay QR Payment');

  return (
    <div className="p-4 rounded-2xl bg-[#18132e] border border-purple-500/25 hover:border-purple-500/40 transition-all shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${
            isApproved 
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400'
              : isPending
                ? 'bg-amber-950/60 border-amber-500/40 text-amber-400'
                : 'bg-rose-950/60 border-rose-500/40 text-rose-400'
          }`}>
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-bold text-white text-sm sm:text-base">
                {channelLabel}
              </h4>
              <span className={`text-[11px] px-2 py-0.5 rounded-md border font-semibold ${
                isApproved 
                  ? 'bg-emerald-900/50 border-emerald-400/30 text-emerald-200' 
                  : isPending 
                    ? 'bg-amber-900/50 border-amber-400/30 text-amber-200' 
                    : 'bg-rose-900/50 border-rose-400/30 text-rose-200'
              }`}>
                {isApproved 
                  ? (lang === 'th' ? '✓ สำเร็จ' : 'Approved') 
                  : isPending 
                    ? (lang === 'th' ? '⏳ รอตรวจสอบ' : 'Pending') 
                    : (lang === 'th' ? '✕ ปฏิเสธ' : 'Rejected')}
              </span>
            </div>
            <div className="text-[11px] text-purple-300/70 flex items-center gap-2 mt-0.5">
              <span>{formattedDate}</span>
              {topup.id && (
                <>
                  <span>•</span>
                  <span>เลขอ้างอิง: #{topup.id}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Amount & Slip Action */}
        <div className="flex items-center justify-between sm:justify-end gap-3 self-stretch sm:self-center">
          {topup.slipUrl && (
            <button
              onClick={() => onPreviewSlip(topup.slipUrl)}
              className="text-[11px] text-purple-300 hover:text-white underline underline-offset-2 flex items-center gap-1"
            >
              <span>ดูสลิป</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          )}

          <div className="text-right">
            <span className={`text-base sm:text-lg font-extrabold ${
              isApproved ? 'text-emerald-400' : 'text-purple-200'
            }`}>
              +฿{Number(topup.amount || 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
