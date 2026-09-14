import React, { useState, useEffect, useRef } from 'react';
import { 
  X, CheckCircle2, HardDrive, Cpu, ShieldCheck, ShoppingBag, 
  Sparkles, Terminal, Eye, ExternalLink, MonitorPlay, Zap
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

// 3D Parallax Interactive Software Preview Component (High performance, zero re-renders)
function InteractiveSoftwarePreview({ imageUrl, title }) {
  const { t } = useLanguage();
  const containerRef = useRef(null);
  const windowRef = useRef(null);
  const glareRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!containerRef.current || !windowRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    const clampedX = Math.max(-1, Math.min(1, x));
    const clampedY = Math.max(-1, Math.min(1, y));

    const rotY = clampedX * 14;
    const rotX = -clampedY * 12;
    const transX = clampedX * 12;
    const transY = clampedY * 10;

    windowRef.current.style.transform = `translate3d(${transX}px, ${transY}px, 30px) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
    if (glareRef.current) {
      glareRef.current.style.background = `radial-gradient(circle 380px at ${(clampedX + 1) * 50}% ${(clampedY + 1) * 50}%, rgba(192, 132, 252, 0.22) 0%, transparent 70%)`;
    }
  };

  const handleMouseLeave = () => {
    if (windowRef.current) {
      windowRef.current.style.transform = `translate3d(0px, 0px, 0px) rotateX(0deg) rotateY(0deg)`;
    }
  };

  return (
    <div className="w-full my-3 select-none">
      {/* 3D Viewport */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ perspective: 1000 }}
        className="relative w-full p-4 sm:p-6 rounded-2xl bg-[#130f24] border border-purple-400/30 overflow-hidden cursor-crosshair group shadow-[0_15px_40px_rgba(0,0,0,0.6)]"
      >
        {/* Dynamic Cursor Light Glare Aura */}
        <div 
          ref={glareRef}
          className="absolute inset-0 pointer-events-none transition-opacity duration-300"
        />

        {/* Ambient Glow behind window */}
        <div className="absolute inset-x-12 inset-y-8 rounded-full bg-purple-600/15 blur-3xl pointer-events-none" />

        {/* 3D Tilted Software Window Frame */}
        <div 
          ref={windowRef}
          className="relative rounded-xl border border-purple-400/40 bg-[#120f20] shadow-[0_20px_50px_rgba(0,0,0,0.85)] overflow-hidden transition-transform ease-out duration-150"
          style={{
            transformStyle: 'preserve-3d',
            willChange: 'transform'
          }}
        >
          {/* Windows Titlebar Header */}
          <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#1a152e] border-b border-purple-400/30">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80 border border-red-400/40" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80 border border-amber-400/40" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80 border border-emerald-400/40" />
              <span className="text-[11px] font-semibold text-purple-200/90 ml-1.5 flex items-center gap-1.5">
                <MonitorPlay className="w-3.5 h-3.5 text-purple-400" />
                <span>{title || t('modalLivePreview')}</span>
              </span>
            </div>
            
            <div className="flex items-center gap-1.5 text-[10px] font-medium text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>{t('modalScreenshotBadge')}</span>
            </div>
          </div>

          {/* Actual Program UI Image */}
          <div className="relative max-h-[380px] sm:max-h-[460px] overflow-hidden bg-black/60 flex items-center justify-center">
            <img
              src={imageUrl}
              alt="Program Preview"
              className="w-full h-auto object-contain max-h-[460px] filter brightness-95 group-hover:brightness-105 transition-all duration-300"
            />
            {/* Subtle Glass Reflection Sweep */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />
          </div>
        </div>

        {/* Bottom Interactive Hint */}
        <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-purple-300/80">
          <Sparkles className="w-3 h-3 text-purple-400" />
          <span>{t('modal3DHint')}</span>
        </div>

      </div>
    </div>
  );
}

export default function ProductModal({ product, onClose, onBuy }) {
  if (!product) return null;
  const { t, lang } = useLanguage();

  const [selectedPlan, setSelectedPlan] = useState(
    product.plans && product.plans.length > 0
      ? (product.plans.find(p => p.id === '30days') || product.plans[0])
      : null
  );

  useEffect(() => {
    if (product.plans && product.plans.length > 0) {
      setSelectedPlan(product.plans.find(p => p.id === '30days') || product.plans[0]);
    } else {
      setSelectedPlan(null);
    }
  }, [product]);

  const getBadge = () => {
    if (product.id === 'prod_ibuki_25') return t('prod25_badge');
    if (product.id === 'prod_ibuki_22') return t('prod22_badge');
    return product.badge;
  };

  const getDescription = () => {
    if (product.id === 'prod_ibuki_25' && lang === 'en') {
      return `IbukiDownload v2.5 combines multimedia downloading and document conversion into an all-in-one 2-in-1 desktop tool. Designed for maximum speed, ease of use, and complete privacy without relying on shady online web converters.

Key Highlights - Media Downloader (Video & Audio):
• Batch & Auto-Deduplication: Paste multiple links at once or load from a .txt list with automated duplicate detection.
• Multi-Platform Support: Extract videos and songs from YouTube, TikTok, Facebook, IG, X (Twitter), Bilibili, SoundCloud, and more.
• Audio & Video Extraction: One-click toggle between full Video or Audio (MP3).
• Best Quality up to 1080p FHD, 720p HD, 480p SD.
• Multi-Format Export: MP4, MKV, WebM, MOV, AVI.

Key Highlights - Ibuki Document Converter:
• High-Fidelity Engine: Preserves layout, tables, graphics, fonts, and pagination without corruption.
• Versatile Format Conversion: Seamless bi-directional conversions across PDF, Word (.docx), Excel, PPT, and images.
• Drag & Drop: Instant batch import and optional auto-open upon completion.

No more virus-ridden conversion websites or corrupted PDF fonts! Manage all your content and documents in one place with IbukiDownload v2.5.`;
    }
    if (product.id === 'prod_ibuki_22' && lang === 'en') {
      return `⚡ IbukiDownload v2.2 (Budget-friendly Media & Music Downloader)
Special price only 150.-
Full-featured video and audio separation.
Multi-link simultaneous downloads with Best Quality.
Perfect for short video clipping, creator editing, or building an offline music library.
No more dealing with sketchy adware websites. One-time purchase, lifetime access.`;
    }
    return product.description;
  };

  const getFeatures = () => {
    if (product.id === 'prod_ibuki_25' && lang === 'en') {
      return [
        "All-in-one 2-in-1 Suite: Media Downloader & Document Converter",
        "Batch & Auto-Deduplication: Multi-link and .txt list import with duplicate prevention",
        "Supports YouTube, TikTok, Facebook, IG, X, Bilibili, SoundCloud, etc.",
        "Download Video or Audio with Best Quality up to 1080p FHD",
        "Export to MP4, MKV, WebM, MOV, AVI, MP3",
        "Ibuki High-Fidelity Document Engine preserves layout, tables, and fonts",
        "Convert between PDF, Word (.docx), Excel, PPT, and image files",
        "Drag & drop support with instant automatic file preview",
        "Portable edition: One-time purchase, extract and use for lifetime without keys"
      ];
    }
    if (product.id === 'prod_ibuki_22' && lang === 'en') {
      return [
        "Full-featured video and audio separation (Video & Audio)",
        "Simultaneous multi-link downloads with auto-deduplication",
        "Best Quality output (1080p FHD, 720p HD, 480p SD)",
        "Popular formats: MP4, MKV, WebM, MOV, AVI, and audio tracks",
        "Unlimited video & audio links (YouTube, TikTok, Facebook, IG, X, Bilibili, SoundCloud)",
        "Portable Edition: No installation required, extract and run immediately",
        "Safe, private, and 100% ad-free lifetime software"
      ];
    }
    return product.features || [];
  };

  const getSystemReq = () => {
    if (lang === 'en') {
      if (product.id === 'prod_ibuki_25') return "Windows 10 / Windows 11 (64-bit), RAM 4GB+, 500MB free disk space";
      if (product.id === 'prod_ibuki_22') return "Windows 10 / Windows 11 (64-bit), RAM 2GB+, 300MB free disk space";
    }
    return product.systemRequirements || "Windows 10 / 11 (64-bit)";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      
      <div 
        className="relative w-full max-w-4xl bg-[#141022] border border-purple-400/40 rounded-3xl shadow-[0_25px_70px_rgba(139,92,246,0.3)] overflow-hidden my-6 animate-in fade-in zoom-in duration-200 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-30 p-2.5 rounded-full bg-black/70 hover:bg-purple-900/80 text-purple-200 hover:text-white transition-all border border-white/20 shadow-lg"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Top Header Banner */}
        <div className="relative h-52 sm:h-64 w-full bg-[#100d1e] overflow-hidden shrink-0 border-b border-purple-500/20">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover object-top filter brightness-100"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#141022] via-[#141022]/30 to-transparent" />
          
          <div className="absolute bottom-4 left-5 sm:left-8 right-16 z-10">
            <div className="flex items-center gap-2 mb-1.5">
              {product.badge && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-900/90 text-purple-200 border border-purple-400/40 backdrop-blur-md shadow-md">
                  {getBadge()}
                </span>
              )}
              {product.version && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-black/70 text-gray-200 border border-purple-500/30 backdrop-blur-md shadow-md">
                  {product.version}
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
              {product.name}
            </h2>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-7 space-y-6 overflow-y-auto flex-1 scrollbar-thin">
          
          {/* Price & Quick Stats Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-[#19142b] border border-purple-500/25 shadow-inner">
            <div>
              <span className="text-xs text-purple-300/70 font-medium">
                {selectedPlan ? selectedPlan.name : t('modalPriceLifetime')}
              </span>
              <div className="flex items-baseline gap-2.5 mt-0.5">
                <span className="text-2xl sm:text-3xl font-black text-white">
                  ฿ {(selectedPlan ? selectedPlan.price : product.price).toLocaleString()}
                </span>
                {(selectedPlan?.originalPrice || product.originalPrice) && (
                  <span className="text-sm text-purple-400/50 line-through">
                    ฿ {(selectedPlan?.originalPrice || product.originalPrice).toLocaleString()}
                  </span>
                )}
                <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-500/30">
                  {t('modalSpecialDiscount')}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <div className="text-right">
                <div className="text-purple-300/70">{t('modalStockStatus')}</div>
                <div className="text-emerald-400 font-bold">
                  {t('modalStockReady')} ({product.unlimitedStock || product.stock === 'ไม่จำกัด' || typeof product.stock === 'string' || product.id?.startsWith('prod_ibuki')
                    ? (lang === 'th' ? 'ไม่จำกัด' : 'Unlimited')
                    : (product.stock ?? 99)})
                </div>
              </div>
              <div className="text-right border-l border-purple-900/50 pl-4">
                <div className="text-purple-300/70">{t('modalFileSize')}</div>
                <div className="text-purple-200 font-bold">{product.fileSize || "Portable"}</div>
              </div>
            </div>
          </div>

          {/* PACKAGE / PLAN SELECTOR (1 วัน / 7 วัน / 30 วัน / 1 ปี / ถาวร) */}
          {product.plans && product.plans.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wide">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>{lang === 'th' ? 'เลือกระยะเวลาการใช้งาน (เช่า vs ซื้อถาวร)' : 'Select Rental or Lifetime Plan'}</span>
                </h4>
                <span className="text-[11px] text-purple-300/80 font-medium">
                  {lang === 'th' ? 'เลือกแพ็กเกจที่เหมาะกับคุณ' : 'Select your preferred plan'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {product.plans.map((p) => {
                  const isSelected = selectedPlan?.id === p.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPlan(p)}
                      className={`relative p-3 rounded-2xl cursor-pointer transition-all duration-200 flex flex-col justify-between border ${
                        isSelected
                          ? 'bg-gradient-to-b from-purple-900/60 to-[#1e1538] border-purple-400 ring-2 ring-purple-400/50 shadow-[0_0_20px_rgba(168,85,247,0.35)] scale-[1.02]'
                          : 'bg-[#18132b] hover:bg-[#201938] border-purple-500/20 hover:border-purple-400/40 text-purple-200'
                      }`}
                    >
                      {/* Top Badge */}
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isSelected
                            ? 'bg-purple-600 text-white shadow'
                            : 'bg-black/50 text-purple-300 border border-purple-500/20'
                        }`}>
                          {p.badge || (p.isLifetime ? '👑 ตลอดชีพ' : `${p.durationDays} วัน`)}
                        </span>
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        )}
                      </div>

                      {/* Plan Name */}
                      <div className="text-xs sm:text-sm font-bold text-white leading-snug">
                        {p.name}
                      </div>

                      {/* Pricing */}
                      <div className="mt-2.5 pt-2 border-t border-purple-900/40 flex items-baseline justify-between">
                        <span className="text-base sm:text-lg font-black text-purple-200">
                          ฿ {p.price.toLocaleString()}
                        </span>
                        {p.originalPrice && (
                          <span className="text-[10px] text-purple-400/50 line-through">
                            ฿ {p.originalPrice.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* INTERACTIVE 3D PROGRAM PREVIEW SHOWCASE */}
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-white mb-2 flex items-center gap-2 uppercase tracking-wide">
              <MonitorPlay className="w-4 h-4 text-purple-400" />
              <span>{t('modalLivePreview')}</span>
            </h4>
            <InteractiveSoftwarePreview 
              imageUrl={product.previewUrl || product.imageUrl} 
              title={product.name}
            />
          </div>

          {/* Description Section */}
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-white mb-2 flex items-center gap-2 uppercase tracking-wide">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>{t('modalDescription')}</span>
            </h4>
            <div className="text-xs sm:text-sm text-purple-100/90 leading-relaxed bg-[#19142b] p-4 sm:p-5 rounded-2xl border border-purple-500/20 whitespace-pre-line font-normal">
              {getDescription()}
            </div>
          </div>

          {/* Features Checklist */}
          {getFeatures().length > 0 && (
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-white mb-2.5 flex items-center gap-2 uppercase tracking-wide">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{t('modalKeyFeatures')}</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {getFeatures().map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-purple-100 bg-[#19142b] p-3 rounded-xl border border-purple-500/20">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* System Requirements & Delivery Specs */}
          <div className="p-4 rounded-2xl bg-[#19142b] border border-purple-500/25 space-y-2.5 text-xs sm:text-sm text-purple-200/90">
            <div className="flex items-center gap-2.5">
              <Cpu className="w-4 h-4 text-purple-400 shrink-0" />
              <span><strong>{t('modalSystemReq')}</strong> {getSystemReq()}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <HardDrive className="w-4 h-4 text-purple-400 shrink-0" />
              <span><strong>{t('modalFileName')}</strong> <code className="text-purple-300 bg-black/50 px-2 py-0.5 rounded-md font-mono text-xs border border-purple-500/20">{product.fileName || "IbukiDownload_v2.2_Portable.zip"}</code></span>
            </div>
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span><strong>{t('modalDelivery')}</strong> {t('modalDeliveryDesc')}</span>
            </div>
          </div>

        </div>

        {/* Modal Bottom Footer Actions */}
        <div className="p-4 sm:p-5 bg-[#100c1c] border-t border-purple-900/40 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-purple-300/70 hidden sm:block">
            {t('modalPaymentSupport')}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-[#1d1830] hover:bg-[#251f3e] text-purple-300 text-xs sm:text-sm font-medium transition-colors border border-purple-500/20"
            >
              {t('modalBtnClose')}
            </button>
            
            <button
              onClick={() => { onClose(); onBuy(product, selectedPlan?.id); }}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-[0_4px_20px_rgba(168,85,247,0.45)] hover:shadow-[0_6px_30px_rgba(168,85,247,0.65)] transition-all transform active:scale-95"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>
                {t('modalBtnBuyNow')} (฿ {(selectedPlan ? selectedPlan.price : product.price).toLocaleString()})
              </span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
