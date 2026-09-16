import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowRight, Sparkles, HardDrive, ShoppingBag, 
  Eye, CheckCircle2, ChevronRight, Zap, Bot, Download, Layers, Flame, ShieldCheck
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const DOWNLOAD_PACKAGES = [
  {
    id: "prod_ibuki_25",
    version: "v2.5 Flagship",
    badge: "รุ่นท็อป 2-in-1",
    badgeColor: "bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-pink-500/30",
    name: "IbukiDownload V.2.5",
    subtitle: "2-in-1 Media & Document Converter",
    desc: "ดูดคลิป & เพลง + แปลงเอกสารคงรูปเล่ม 100%",
    price: 190,
    originalPrice: 290,
    fileSize: "196 MB"
  },
  {
    id: "prod_ibuki_22",
    version: "v2.2 Standard",
    badge: "ราคาสบายกระเป๋า",
    badgeColor: "bg-purple-900/80 text-purple-200 border border-purple-400/40",
    name: "IbukiDownload V.2.2",
    subtitle: "เน้นดูดคลิป & โหลดเพลง",
    desc: "ดูดคลิป Best Quality และแยกเสียง MP3/MP4",
    price: 150,
    originalPrice: 290,
    fileSize: "98.9 MB"
  }
];

const AUTOPOSTER_INFO = {
  id: "prod_autoposter",
  name: "Ibuki FB AutoPoster Pro V.1.0",
  version: "v1.0 Pro Portable",
  badge: "บอทการตลาด FB",
  badgeColor: "bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-indigo-500/40",
  tagline: "บอทโพสต์กลุ่ม Facebook อัตโนมัติ",
  desc: "โพสต์กลุ่มวนรอบ สลับหลายไอดี พิมพ์เหมือนคนกันแบน 100%",
  price: 29,
  pricePrefix: "เริ่มต้น ",
  originalPrice: 59,
  fileSize: "122 MB",
  plans: [
    { label: "1 วัน", price: "฿29" },
    { label: "7 วัน", price: "฿99" },
    { label: "30 วัน", price: "฿290" },
    { label: "1 ปี", price: "฿790" },
    { label: "ถาวร", price: "฿1,290", hot: true }
  ],
  highlights: [
    "ตั้งเวลาโพสต์วนรอบทุกๆ X ชม./นาที อัตโนมัติ",
    "สลับบัญชี + สุ่มหน่วงเวลาพิมพ์เหมือนคน 100%",
    "ได้รับ License Key และสิทธิ์ใช้งานทันที 24 ชม."
  ]
};

export default function CloudHero({ onSelectProduct, onOpenQuickBuy, products = [] }) {
  const { t, lang } = useLanguage();
  const [selectedDownloadPkgId, setSelectedDownloadPkgId] = useState("prod_ibuki_25");
  const [mobileHeroTab, setMobileHeroTab] = useState("autoposter"); // 'autoposter' | 'download'
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const videoLayerRef = useRef(null);
  const spotlightRef = useRef(null);
  const textLayerRef = useRef(null);
  const characterLayerRef = useRef(null);
  const chipLayerLeftRef = useRef(null);
  const chipLayerRightRef = useRef(null);

  const isHoveredRef = useRef(false);
  const isVisibleRef = useRef(true);
  const targetPos = useRef({ x: 0, y: 0 });
  const currentPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    // 1. IntersectionObserver: Pause video and RAF loop when hero is off-screen
    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting;
        isVisibleRef.current = visible;
        if (videoRef.current) {
          if (visible) {
            videoRef.current.play().catch(() => {});
          } else {
            videoRef.current.pause();
          }
        }
      },
      { threshold: 0.05 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    // 2. High-performance RAF direct DOM transform loop (Zero React re-renders)
    let animId;
    const lerp = (start, end, factor) => start + (end - start) * factor;
    const startTime = performance.now();

    const updatePhysics = (time) => {
      if (isVisibleRef.current) {
        // Idle gentle float when mouse is not hovering
        if (!isHoveredRef.current) {
          const t = (time - startTime) * 0.0016;
          targetPos.current.x = Math.sin(t) * 0.3;
          targetPos.current.y = Math.cos(t * 0.75) * 0.22;
        }

        // Smooth lerp
        currentPos.current.x = lerp(currentPos.current.x, targetPos.current.x, 0.08);
        currentPos.current.y = lerp(currentPos.current.y, targetPos.current.y, 0.08);

        const x = currentPos.current.x;
        const y = currentPos.current.y;

        // Apply hardware-accelerated transforms directly to GPU layers
        if (characterLayerRef.current) {
          const craftX = x * 38;
          const craftY = y * 28;
          const craftRotateY = x * 20;
          const craftRotateX = -y * 16;
          const craftTiltZ = x * 7;
          characterLayerRef.current.style.transform = `translate3d(${craftX}px, ${craftY}px, 80px) rotateX(${craftRotateX}deg) rotateY(${craftRotateY}deg) rotateZ(${craftTiltZ}deg)`;
        }

        if (videoLayerRef.current) {
          const bgX = -x * 22;
          const bgY = -y * 16;
          videoLayerRef.current.style.transform = `translate3d(${bgX}px, ${bgY}px, 0)`;
        }

        if (textLayerRef.current) {
          const textX = -x * 15;
          const textY = -y * 11;
          textLayerRef.current.style.transform = `translate3d(${textX}px, ${textY}px, 0)`;
        }

        if (chipLayerLeftRef.current) {
          const chipX = x * 22;
          const chipY = y * 18;
          chipLayerLeftRef.current.style.transform = `translate3d(${chipX}px, ${chipY}px, 40px)`;
        }

        if (chipLayerRightRef.current) {
          const chipX = -x * 22;
          const chipY = y * 18;
          chipLayerRightRef.current.style.transform = `translate3d(${chipX}px, ${chipY}px, 40px)`;
        }

        if (spotlightRef.current) {
          const spotX = (x + 1) * 50;
          const spotY = (y + 1) * 50;
          spotlightRef.current.style.background = `radial-gradient(circle 480px at ${spotX}% ${spotY}%, rgba(192, 132, 252, 0.25) 0%, transparent 70%)`;
        }
      }

      animId = requestAnimationFrame(updatePhysics);
    };

    animId = requestAnimationFrame(updatePhysics);

    return () => {
      observer.disconnect();
      if (animId) cancelAnimationFrame(animId);
    };
  }, []);

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    targetPos.current.x = Math.max(-1, Math.min(1, x));
    targetPos.current.y = Math.max(-1, Math.min(1, y));
  };

  const handleMouseEnter = () => {
    isHoveredRef.current = true;
  };

  const handleMouseLeave = () => {
    isHoveredRef.current = false;
  };

  const scrollToCatalog = () => {
    const el = document.getElementById('catalog');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="w-full select-none relative">
      
      {/* Outer 3D Perspective Viewport */}
      <div 
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{ perspective: 1200 }}
        className="relative w-full h-[calc(100vh-76px)] min-h-[640px] max-h-[1080px] rounded-none sm:rounded-b-[44px] overflow-hidden border-b border-purple-300/25 shadow-[0_30px_90px_rgba(0,0,0,0.85)] bg-[#100d1e] cursor-crosshair group"
      >
        
        {/* LAYER 0: Dynamic Looping Background Video with Parallax Mouse Physics */}
        <div 
          ref={videoLayerRef}
          className="absolute inset-[-60px] scale-110 pointer-events-none overflow-hidden"
          style={{ willChange: 'transform' }}
        >
          <video
            ref={videoRef}
            src="/hero_bg.mp4"
            autoPlay
            loop
            muted
            playsInline
            poster="/aero_hero.webp"
            className="w-full h-full object-cover object-center filter brightness-95 contrast-105"
          />
          {/* Soft lavender atmospheric gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0e0b1c]/90 via-transparent to-[#0e0b1c]/40" />
        </div>

        {/* LAYER 1: Interactive Cursor Spotlight Aura */}
        <div 
          ref={spotlightRef}
          className="absolute inset-0 pointer-events-none"
        />

        {/* LAYER 2: GIANT 3D TYPOGRAPHY (IBUKIHUB) */}
        <div 
          ref={textLayerRef}
          className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10"
          style={{ willChange: 'transform' }}
        >
          <div className="text-center px-4">
            
            {/* Top Micro Header */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/50 border border-white/20 text-white text-[11px] sm:text-xs font-semibold tracking-widest uppercase mb-4 shadow-lg">
              <Sparkles className="w-3.5 h-3.5 text-purple-300" />
              <span>NEXT-GEN PORTABLE SOFTWARE</span>
            </div>

            {/* Giant 3D Text: IBUKIHUB */}
            <h1 className="text-5xl sm:text-7xl md:text-[10rem] lg:text-[14rem] xl:text-[16rem] font-black tracking-wider text-white drop-shadow-[0_20px_45px_rgba(0,0,0,0.85)] font-sans uppercase leading-none opacity-90 select-none">
              <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-purple-100 to-purple-300">
                IBUKIHUB
              </span>
            </h1>

            <p className="text-xs sm:text-sm md:text-base lg:text-lg font-semibold text-purple-100/90 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] mt-4 tracking-wide">
              HIGH PERFORMANCE CLOUD & DESKTOP TOOLS
            </p>

          </div>
        </div>

        {/* LAYER 3: CENTRAL 3D IBUKI CHARACTER (TRANSPARENT PNG CUTOUT - NO BACKGROUND) */}
        <div 
          ref={characterLayerRef}
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
          style={{ willChange: 'transform', transformStyle: 'preserve-3d' }}
        >
          <div className="relative flex flex-col items-center justify-center">
            
            {/* Ambient Glow Aura behind Character */}
            <div className="absolute w-72 h-72 sm:w-96 sm:h-96 md:w-[460px] md:h-[460px] rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />

            {/* Transparent PNG Character Cutout */}
            <img
              src="/ibuki_center.png"
              alt="Ibuki Character"
              className="w-72 h-72 sm:w-96 sm:h-96 md:w-[480px] md:h-[480px] lg:w-[560px] lg:h-[560px] xl:w-[600px] xl:h-[600px] object-contain drop-shadow-[0_25px_50px_rgba(0,0,0,0.8)] drop-shadow-[0_0_35px_rgba(168,85,247,0.45)] select-none pointer-events-none"
            />

          </div>
        </div>

        {/* LAYER 4A: STANDALONE IBUKIDOWNLOAD SUITE (Left Side UI - Desktop) */}
        <div className="hidden lg:flex absolute inset-y-0 left-3 xl:left-8 z-30 items-center pointer-events-none">
          <div 
            ref={chipLayerLeftRef}
            className="pointer-events-auto w-[295px] xl:w-[325px]"
            style={{ willChange: 'transform' }}
          >
            <div className="rounded-3xl bg-[#120d24]/95 backdrop-blur-2xl border-2 border-purple-500/40 p-3 xl:p-3.5 shadow-[0_25px_60px_rgba(0,0,0,0.85)] shadow-purple-950/70 space-y-2.5 text-left transition-all relative overflow-hidden">
              {/* Top decorative neon gradient line */}
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500" />

              {/* Header / Title */}
              <div className="flex items-center justify-between border-b border-purple-500/20 pb-2.5 pt-0.5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-xl bg-purple-500/20 border border-purple-400/40 text-purple-300 shadow-inner">
                    <Download className="w-4 h-4 text-purple-300" />
                  </div>
                  <div>
                    <div className="text-xs xl:text-[13px] font-bold text-white tracking-wide">
                      IbukiDownload Suite
                    </div>
                    <div className="text-[10px] text-purple-300/70">
                      {lang === 'th' ? 'ดูดคลิป & แปลงเอกสาร (ซื้อครั้งเดียวจบ)' : 'Media & Doc Converter (Lifetime)'}
                    </div>
                  </div>
                </div>
                <div className="px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-200 text-[10px] font-semibold shrink-0">
                  v2.5 / v2.2
                </div>
              </div>

              {/* List of 2 Selectable Editions */}
              <div className="space-y-2">
                {DOWNLOAD_PACKAGES.map((pkg) => {
                  const isSelected = selectedDownloadPkgId === pkg.id;
                  const matchedProduct = products.find(p => p.id === pkg.id);
                  const actualProduct = matchedProduct || pkg;

                  return (
                    <div
                      key={pkg.id}
                      onClick={() => setSelectedDownloadPkgId(pkg.id)}
                      className={`p-2.5 rounded-2xl border transition-all cursor-pointer select-none relative group ${
                        isSelected
                          ? 'bg-gradient-to-br from-purple-900/70 via-[#221344]/90 to-[#180e30] border-purple-400/90 shadow-[0_0_22px_rgba(168,85,247,0.38)]'
                          : 'bg-black/40 border-purple-500/20 hover:border-purple-400/40 hover:bg-purple-950/30'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                            isSelected ? 'border-purple-400 bg-purple-500' : 'border-purple-400/40 bg-black/40'
                          }`}>
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                          <span className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-purple-200'}`}>
                            {pkg.name}
                          </span>
                        </div>
                        <span className={`text-[9.5px] px-2 py-0.5 rounded-full font-semibold shrink-0 shadow-sm ${pkg.badgeColor}`}>
                          {pkg.id === 'prod_ibuki_25' ? (lang === 'th' ? 'รุ่นท็อป 2-in-1' : 'Flagship') : (lang === 'th' ? 'ราคาสบายกระเป๋า' : 'Budget')}
                        </span>
                      </div>

                      <div className="text-[10.5px] text-purple-200/80 line-clamp-1 pl-5 mb-1.5">
                        {pkg.desc}
                      </div>

                      <div className="flex items-center justify-between pl-5 pt-1.5 border-t border-purple-500/15">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-sm font-extrabold text-white">
                            {t('currency')} {pkg.price}
                          </span>
                          <span className="text-[10px] text-purple-400/60 line-through">
                            {t('currency')}{pkg.originalPrice}
                          </span>
                          <span className="text-[9.5px] text-purple-300/60 font-mono">
                            ({pkg.fileSize})
                          </span>
                        </div>

                        {isSelected ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onSelectProduct) onSelectProduct(pkg.id);
                              }}
                              className="p-1.5 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-purple-200 border border-purple-400/30 text-[10px] font-medium transition-all"
                              title={t('cardBtnDetails')}
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onOpenQuickBuy) onOpenQuickBuy(actualProduct);
                              }}
                              className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-[11px] shadow-sm flex items-center gap-1 transition-all active:scale-95"
                            >
                              <ShoppingBag className="w-3 h-3" />
                              <span>{t('cardBtnBuy')}</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-purple-400/70 group-hover:text-purple-300 flex items-center gap-0.5">
                            <span>{lang === 'th' ? 'คลิกเลือก' : 'Select'}</span>
                            <ChevronRight className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom quick tip */}
              <div className="flex items-center justify-between pt-1 text-[10px] text-purple-300/70 border-t border-purple-500/15">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>{lang === 'th' ? 'แตกไฟล์ใช้ได้ตลอดชีพ ไม่ต้องใส่คีย์' : 'Instant portable run'}</span>
                </span>
                <button
                  type="button"
                  onClick={scrollToCatalog}
                  className="hover:text-purple-200 underline transition-colors"
                >
                  {lang === 'th' ? 'ดูสินค้าทั้งหมด ↓' : 'Catalog ↓'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* LAYER 4B: STANDALONE IBUKI FB AUTOPOSTER PRO (Right Side UI) */}
        <div className="absolute inset-y-0 inset-x-2 sm:inset-x-auto sm:right-4 lg:right-3 xl:right-8 z-30 flex items-center justify-center lg:justify-end pointer-events-none">
          <div 
            ref={chipLayerRightRef}
            className="pointer-events-auto w-full max-w-[340px] sm:w-[335px] xl:w-[365px]"
            style={{ willChange: 'transform' }}
          >
            {/* Mobile Tab Switcher (Visible only on < lg screens) */}
            <div className="flex lg:hidden items-center p-1 rounded-2xl bg-[#120d24]/95 border border-purple-500/40 mb-2 gap-1 text-xs font-semibold backdrop-blur-xl shadow-lg">
              <button
                type="button"
                onClick={() => setMobileHeroTab('autoposter')}
                className={`flex-1 py-1.5 px-2 rounded-xl transition-all text-center flex items-center justify-center gap-1.5 ${
                  mobileHeroTab === 'autoposter' 
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md' 
                    : 'text-purple-300 hover:text-white'
                }`}
              >
                <Bot className="w-3.5 h-3.5" />
                <span>FB AutoPoster</span>
              </button>
              <button
                type="button"
                onClick={() => setMobileHeroTab('download')}
                className={`flex-1 py-1.5 px-2 rounded-xl transition-all text-center flex items-center justify-center gap-1.5 ${
                  mobileHeroTab === 'download' 
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md' 
                    : 'text-purple-300 hover:text-white'
                }`}
              >
                <Download className="w-3.5 h-3.5" />
                <span>IbukiDownload</span>
              </button>
            </div>

            {/* If Mobile and user tapped IbukiDownload -> render IbukiDownload UI on mobile */}
            {mobileHeroTab === 'download' && (
              <div className="block lg:hidden rounded-3xl bg-[#120d24]/95 backdrop-blur-2xl border-2 border-purple-500/40 p-3 sm:p-3.5 shadow-[0_25px_60px_rgba(0,0,0,0.85)] shadow-purple-950/70 space-y-2.5 text-left transition-all relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500" />
                <div className="flex items-center justify-between border-b border-purple-500/20 pb-2 pt-0.5">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-xl bg-purple-500/20 border border-purple-400/40 text-purple-300">
                      <Download className="w-4 h-4 text-purple-300" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white tracking-wide">
                        IbukiDownload Suite
                      </div>
                      <div className="text-[10px] text-purple-300/70">
                        {lang === 'th' ? 'ดูดคลิป & แปลงเอกสาร (ซื้อครั้งเดียวจบ)' : 'Media & Doc Converter'}
                      </div>
                    </div>
                  </div>
                  <div className="px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-200 text-[10px] font-semibold">
                    v2.5 / v2.2
                  </div>
                </div>

                <div className="space-y-2">
                  {DOWNLOAD_PACKAGES.map((pkg) => {
                    const isSelected = selectedDownloadPkgId === pkg.id;
                    const matchedProduct = products.find(p => p.id === pkg.id);
                    const actualProduct = matchedProduct || pkg;
                    return (
                      <div
                        key={pkg.id}
                        onClick={() => setSelectedDownloadPkgId(pkg.id)}
                        className={`p-2.5 rounded-2xl border transition-all cursor-pointer select-none ${
                          isSelected
                            ? 'bg-gradient-to-br from-purple-900/70 via-[#221344]/90 to-[#180e30] border-purple-400/90 shadow-[0_0_22px_rgba(168,85,247,0.38)]'
                            : 'bg-black/40 border-purple-500/20'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-xs font-bold text-white truncate">{pkg.name}</span>
                          <span className={`text-[9.5px] px-2 py-0.5 rounded-full font-semibold ${pkg.badgeColor}`}>{pkg.badge}</span>
                        </div>
                        <div className="text-[10px] text-purple-200/80 line-clamp-1 mb-1.5">{pkg.desc}</div>
                        <div className="flex items-center justify-between pt-1 border-t border-purple-500/15">
                          <span className="text-sm font-extrabold text-white">{t('currency')} {pkg.price}</span>
                          {isSelected ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); if (onSelectProduct) onSelectProduct(pkg.id); }}
                                className="p-1.5 rounded-xl bg-purple-900/60 text-purple-200 border border-purple-400/30 text-[10px]"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); if (onOpenQuickBuy) onOpenQuickBuy(actualProduct); }}
                                className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-[11px]"
                              >
                                <ShoppingBag className="w-3 h-3" />
                                <span>{t('cardBtnBuy')}</span>
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-purple-400 flex items-center gap-0.5">เลือก <ChevronRight className="w-3 h-3" /></span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Standalone Ibuki FB AutoPoster Pro UI Card (Always visible on Desktop, or when mobileHeroTab === 'autoposter') */}
            <div className={`${mobileHeroTab === 'download' ? 'hidden lg:block' : 'block'} rounded-3xl bg-[#120d24]/95 backdrop-blur-2xl border-2 border-indigo-500/40 p-3 sm:p-3.5 shadow-[0_25px_60px_rgba(0,0,0,0.85)] shadow-indigo-950/70 space-y-2.5 text-left transition-all relative overflow-hidden`}>
              
              {/* Top decorative neon gradient line */}
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

              {/* Header / Title */}
              <div className="flex items-center justify-between border-b border-indigo-500/20 pb-2.5 pt-0.5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-xl bg-gradient-to-br from-blue-500/25 to-indigo-500/25 border border-indigo-400/40 text-blue-300 shadow-inner">
                    <Bot className="w-4 h-4 text-indigo-300" />
                  </div>
                  <div>
                    <div className="text-xs sm:text-[13px] font-bold text-white tracking-wide flex items-center gap-1.5">
                      <span>Ibuki FB AutoPoster Pro</span>
                    </div>
                    <div className="text-[10px] text-indigo-200/70">
                      {lang === 'th' ? 'บอทการตลาด Facebook อัจฉริยะ' : 'Smart Facebook Marketing Bot'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[10px] font-medium shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>ONLINE</span>
                </div>
              </div>

              {/* Main Program Card */}
              <div className="p-2.5 rounded-2xl bg-gradient-to-br from-indigo-950/60 via-[#181135]/90 to-[#120e28] border border-indigo-400/60 shadow-[0_0_20px_rgba(99,102,241,0.25)] space-y-2">
                
                {/* Badge & Version */}
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] font-bold text-indigo-200 flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>v1.0 Pro Portable Edition</span>
                  </span>
                  <span className="text-[9.5px] px-2 py-0.5 rounded-full font-semibold shrink-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm">
                    {lang === 'th' ? 'บอทการตลาด FB' : 'FB Auto-Poster'}
                  </span>
                </div>

                {/* Core description */}
                <div className="text-[11px] text-indigo-100/90 font-medium leading-relaxed">
                  {lang === 'th' 
                    ? 'โพสต์กลุ่มวนรอบ สลับหลายไอดี พิมพ์เหมือนคนกันแบน 100%' 
                    : 'Loop group poster, multi-account rotation, anti-ban human delay'}
                </div>

                {/* Pricing row */}
                <div className="flex items-baseline justify-between pt-1 border-t border-indigo-500/20">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[10px] text-indigo-300/80 font-medium">เริ่มต้น</span>
                    <span className="text-base font-extrabold text-white">฿ 29</span>
                    <span className="text-[10px] text-indigo-300/50 line-through">฿59</span>
                    <span className="text-[9.5px] text-indigo-300/70 font-mono">(122 MB)</span>
                  </div>
                  <span className="text-[9.5px] text-amber-300 font-semibold">
                    มี 5 แพ็กเกจ (เช่า & ถาวร)
                  </span>
                </div>

                {/* 5 Plans Pills */}
                <div className="grid grid-cols-5 gap-1 pt-1">
                  {AUTOPOSTER_INFO.plans.map((p, idx) => (
                    <div 
                      key={idx}
                      className={`text-center py-1 rounded-lg border text-[9px] font-medium transition-all ${
                        p.hot 
                          ? 'bg-amber-500/20 border-amber-400/50 text-amber-200 font-bold' 
                          : 'bg-black/30 border-indigo-400/20 text-indigo-200'
                      }`}
                    >
                      <div className="opacity-80">{p.label}</div>
                      <div className="font-bold text-[10px] text-white">{p.price}</div>
                    </div>
                  ))}
                </div>

                {/* Features Bullets */}
                <div className="space-y-1 pt-1 text-[10px] text-indigo-200/90">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span>ตั้งเวลาโพสต์วนรอบทุก X ชม. / สลับไอดีออโต้</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3 h-3 text-indigo-300 shrink-0" />
                    <span>สุ่มหน่วงเวลาพิมพ์เหมือนคนกันแบน 100%</span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 pt-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (onSelectProduct) onSelectProduct('prod_autoposter');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 text-indigo-200 border border-indigo-400/40 text-[11px] font-medium flex items-center gap-1 transition-all"
                    title={t('cardBtnDetails')}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>ข้อมูลโปรแกรม</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const actualProduct = products.find(p => p.id === 'prod_autoposter') || AUTOPOSTER_INFO;
                      if (onOpenQuickBuy) onOpenQuickBuy(actualProduct);
                    }}
                    className="flex-1 py-1.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-[11px] shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-95"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>สั่งซื้อเริ่มต้น ฿29</span>
                  </button>
                </div>

              </div>

              {/* Bottom quick tip */}
              <div className="flex items-center justify-between pt-1 text-[10px] text-indigo-300/70 border-t border-indigo-500/15">
                <span className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span>{lang === 'th' ? 'ส่ง License Key + ลิงก์โหลดทันที 24 ชม.' : 'Instant license delivery'}</span>
                </span>
                <button
                  type="button"
                  onClick={scrollToCatalog}
                  className="hover:text-indigo-200 underline transition-colors"
                >
                  {lang === 'th' ? 'ดูสินค้าทั้งหมด ↓' : 'All Products ↓'}
                </button>
              </div>

            </div>

          </div>
        </div>

        {/* LAYER 5: BOTTOM HERO ACTION CONTROL BAR */}
        <div className="absolute bottom-4 sm:bottom-6 inset-x-6 sm:inset-x-12 lg:inset-x-16 z-40 flex items-center justify-center pointer-events-auto">
          <button
            onClick={scrollToCatalog}
            className="px-6 sm:px-8 py-2.5 sm:py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-[0_6px_25px_rgba(168,85,247,0.5)] hover:shadow-[0_8px_35px_rgba(168,85,247,0.7)] transition-all flex items-center justify-center gap-2 transform active:scale-95"
          >
            <span>{t('qaCatalogTitle')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>

    </div>
  );
}
