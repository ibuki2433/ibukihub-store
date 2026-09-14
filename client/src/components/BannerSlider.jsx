import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronLeft, ChevronRight, ArrowRight, Download, 
  Terminal, ShieldCheck, Sparkles, Cpu, HardDrive, 
  Zap, CheckCircle2, Play, Pause 
} from 'lucide-react';

const SLIDES = [
  {
    id: 1,
    tag: "RELEASE V2.2",
    badge: "เวอร์ชันแนะนำ 2026",
    title: "IbukiDownload V.2.2",
    highlight: "รุ่นเน้นดูดคลิป & เพลง ราคาสบายกระเป๋า",
    subtitle: "เน้นฟังก์ชันดาวน์โหลดคลิปและแยกไฟล์เสียงเต็มรูปแบบ โหลดพร้อมกันหลายลิงก์ คมชัดสูงสุดระดับ Best Quality แตกไฟล์ใช้งานได้ทันที ซื้อครั้งเดียวใช้ยาวๆ",
    buttonText: "ดูข้อมูลโปรแกรม",
    targetProductId: "prod_ibuki_22",
    price: "฿ 150",
    chips: [
      { label: "ไม่ต้องติดตั้ง (Portable)", icon: HardDrive },
      { label: "ดูดคลิป & แยกไฟล์เสียง", icon: Zap },
      { label: "ไฟล์แท้ขนาด 98.9 MB", icon: CheckCircle2 }
    ],
    accentColor: "from-purple-500 to-indigo-500",
    cardType: "ibuki",
    bgGradient: "from-[#1a1236] via-[#141026] to-[#0e0a1b]"
  },
  {
    id: 2,
    tag: "FLAGSHIP V2.5",
    badge: "รุ่นท็อป 2-in-1",
    title: "IbukiDownload V.2.5",
    highlight: "Media Downloader & Document Converter",
    subtitle: "รวมฟังก์ชันดาวน์โหลดคลิป & เพลง และแปลงไฟล์เอกสารความเที่ยงตรงสูงในตัวเดียว รองรับ Batch & Auto-Deduplication ซื้อแล้วจบเลย ไม่ต้องใส่คีย์",
    buttonText: "ดูข้อมูลโปรแกรม",
    targetProductId: "prod_ibuki_25",
    price: "฿ 190",
    chips: [
      { label: "ระบบ 2-in-1 ในตัวเดียว", icon: Sparkles },
      { label: "High-Fidelity Doc Converter", icon: Terminal },
      { label: "ไฟล์แท้ขนาด 196 MB", icon: CheckCircle2 }
    ],
    accentColor: "from-purple-500 to-pink-500",
    cardType: "ibuki25",
    bgGradient: "from-[#1d1238] via-[#15102a] to-[#0e0a1c]"
  },
  {
    id: 3,
    tag: "INSTANT DELIVERY",
    badge: "ระบบอัตโนมัติ 24 ชม.",
    title: "ระบบส่งมอบไฟล์โปรแกรมทันที (ซื้อแล้วจบเลย)",
    highlight: "รับสิทธิ์ดาวน์โหลดและใช้งานได้ตลอดชีพ",
    subtitle: "ชำระเงินผ่านระบบพร้อมเพย์ QR หรือซองทรูมันนี่ เมื่อทำรายการสำเร็จระบบจะเปิดสิทธิ์ดาวน์โหลดไฟล์โปรแกรม .zip แท้ทันทีในหน้าจอเดียว ซื้อแล้วจบเลย ไม่ต้องกรอกคีย์",
    buttonText: "เติมเครดิตเข้ากระเป๋า",
    action: "topup",
    price: "ออโต้ 100%",
    chips: [
      { label: "ดาวน์โหลดไฟล์ได้ตลอดชีพ", icon: Download },
      { label: "ซื้อแล้วจบ ไม่ต้องใส่คีย์", icon: ShieldCheck },
      { label: "จัดส่งอัตโนมัติ 24 ชม.", icon: Zap }
    ],
    accentColor: "from-purple-600 to-pink-500",
    cardType: "delivery",
    bgGradient: "from-[#191130] via-[#130f24] to-[#0d0918]"
  }
];

export default function BannerSlider({ onSelectProduct, onSelectCategory, onOpenTopup }) {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState('next'); // 'next' | 'prev'
  const [isPaused, setIsPaused] = useState(false);

  // Auto-sliding loop (Lightweight 6s timer, zero CPU waste)
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setDirection('next');
      setCurrent((curr) => (curr + 1) % SLIDES.length);
    }, 6000);

    return () => clearInterval(timer);
  }, [isPaused]);

  const goToSlide = (idx) => {
    setDirection(idx > current ? 'next' : 'prev');
    setCurrent(idx);
  };

  const prevSlide = () => {
    setDirection('prev');
    setCurrent((prev) => (prev === 0 ? SLIDES.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setDirection('next');
    setCurrent((prev) => (prev + 1) % SLIDES.length);
  };

  const handleAction = (slide) => {
    if (slide.targetProductId && onSelectProduct) {
      onSelectProduct(slide.targetProductId);
    } else if (slide.targetCategory && onSelectCategory) {
      onSelectCategory(slide.targetCategory);
    } else if (slide.action === 'topup' && onOpenTopup) {
      onOpenTopup();
    }
  };

  const slide = SLIDES[current];

  return (
    <div 
      className="w-full my-6 sm:my-8 select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      
      {/* Main Slider Card */}
      <div className={`relative w-full overflow-hidden rounded-3xl bg-gradient-to-br ${slide.bgGradient} border border-purple-400/30 shadow-2xl transition-colors duration-700`}>
        
        {/* Animated Top Progress Bar (Auto-slide timer) */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-purple-950/40 z-30">
          <div 
            className="h-full bg-gradient-to-r from-purple-400 to-indigo-300 transition-all ease-linear shadow-[0_0_8px_rgba(196,181,253,0.8)]"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Ambient Decorative Purple Glow Circles */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Slider Body */}
        <div className="relative z-20 min-h-[300px] sm:min-h-[360px] md:min-h-[390px] p-6 sm:p-10 md:p-12 flex flex-col justify-between">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center flex-1">
            
            {/* Left Column: Information & CTA */}
            <div className="lg:col-span-7 flex flex-col justify-center text-left">
              
              {/* Badge & Tags */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide uppercase bg-purple-900/60 border border-purple-400/30 text-purple-200 backdrop-blur-md">
                  {slide.tag}
                </span>
                <span className="px-3 py-1 rounded-full text-[11px] font-medium bg-purple-950/40 text-purple-300 border border-purple-500/20">
                  {slide.badge}
                </span>
              </div>

              {/* Title with Smooth Animation Key */}
              <h2 key={`title-${current}`} className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight animate-in fade-in slide-in-from-left-4 duration-300">
                {slide.title}
              </h2>

              {/* Highlight Subtitle */}
              <h3 key={`hl-${current}`} className="text-sm sm:text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-purple-400 to-indigo-300 mt-1 animate-in fade-in slide-in-from-left-6 duration-300">
                {slide.highlight}
              </h3>

              {/* Description */}
              <p key={`desc-${current}`} className="text-xs sm:text-sm text-purple-200/70 mt-2.5 sm:mt-3 leading-relaxed max-w-xl animate-in fade-in duration-300 line-clamp-3">
                {slide.subtitle}
              </p>

              {/* Feature Chips */}
              <div key={`chips-${current}`} className="mt-4 flex flex-wrap gap-2 animate-in fade-in duration-400">
                {slide.chips.map((chip, i) => {
                  const Icon = chip.icon;
                  return (
                    <div 
                      key={i} 
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#19142b]/80 border border-purple-500/20 text-[11px] text-purple-200/90 font-medium"
                    >
                      <Icon className="w-3.5 h-3.5 text-purple-400" />
                      <span>{chip.label}</span>
                    </div>
                  );
                })}
              </div>

              {/* Price & Action Buttons */}
              <div className="mt-6 flex flex-wrap items-center gap-3.5">
                <button
                  onClick={() => handleAction(slide)}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-semibold text-xs sm:text-sm shadow-soft-purple hover:shadow-soft-purple-lg transition-all flex items-center gap-2 transform active:scale-95"
                >
                  <span>{slide.buttonText}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="px-3.5 py-2 rounded-xl bg-black/40 border border-purple-500/20 text-xs font-semibold text-purple-200">
                  ราคาพิเศษ: <span className="text-purple-300 font-bold">{slide.price}</span>
                </div>
              </div>

            </div>

            {/* Right Column: Visual Showcase Card */}
            <div className="lg:col-span-5 hidden lg:flex justify-center items-center">
              
              {/* Ibuki Character & Software Card */}
              {slide.cardType === 'ibuki' && (
                <div key="card-ibuki" className="relative w-72 h-72 rounded-3xl bg-[#1a1433]/90 border border-purple-400/40 p-5 flex flex-col items-center justify-between shadow-soft-purple-lg animate-in fade-in zoom-in duration-400 group">
                  
                  <div className="w-full flex items-center justify-between text-[11px] font-semibold text-purple-300">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      พร้อมใช้งาน
                    </span>
                    <span className="bg-purple-900/60 px-2 py-0.5 rounded text-purple-200 font-mono">v2.2</span>
                  </div>

                  {/* Character Avatar Showcase */}
                  <div className="relative my-2">
                    <div className="w-28 h-28 rounded-2xl p-1 bg-gradient-to-tr from-purple-500 via-indigo-400 to-pink-400 shadow-soft-purple">
                      <img
                        src="/ibuki_logo.png"
                        alt="Ibuki OC"
                        className="w-full h-full object-cover rounded-[14px]"
                      />
                    </div>
                    <div className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-purple-950 border border-purple-400/40 text-[10px] font-bold text-purple-200 shadow">
                      ~98.9 MB
                    </div>
                  </div>

                  {/* Mini details badge */}
                  <div className="w-full text-center space-y-1 bg-black/40 p-2.5 rounded-xl border border-purple-500/20">
                    <div className="text-xs font-bold text-white">IbukiDownload_v2.2_Portable.zip</div>
                    <div className="text-[11px] text-purple-300/80">รุ่นเน้นดูดคลิป & เพลง ราคาสบายกระเป๋า</div>
                  </div>

                </div>
              )}

              {/* Ibuki v2.5 Showcase Card */}
              {slide.cardType === 'ibuki25' && (
                <div key="card-ibuki25" className="relative w-72 h-72 rounded-3xl bg-[#1a1433]/90 border border-purple-400/40 p-4 flex flex-col items-center justify-between shadow-soft-purple-lg animate-in fade-in zoom-in duration-400 group overflow-hidden">
                  <div className="w-full flex items-center justify-between text-[11px] font-semibold text-purple-300 z-10">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-pink-400 animate-pulse" />
                      รุ่นท็อป 2-in-1
                    </span>
                    <span className="bg-purple-900/80 px-2 py-0.5 rounded text-purple-200 font-mono">v2.5 Portable</span>
                  </div>

                  <div className="relative w-full h-36 rounded-2xl overflow-hidden border border-purple-500/30 my-1 group-hover:scale-105 transition-transform duration-300">
                    <img
                      src="/ibuki_v25_banner.jpg"
                      alt="IbukiDownload v2.5"
                      className="w-full h-full object-cover object-top"
                    />
                    <div className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-purple-950/90 border border-purple-400/40 text-[10px] font-bold text-purple-200 shadow">
                      ~196 MB
                    </div>
                  </div>

                  <div className="w-full text-center space-y-0.5 bg-black/50 p-2 rounded-xl border border-purple-500/20 z-10">
                    <div className="text-xs font-bold text-white truncate">IbukiDownload_v2.5_Portable.zip</div>
                    <div className="text-[10px] text-purple-300/80 truncate">2-in-1 Media Downloader & Document Converter</div>
                  </div>
                </div>
              )}

              {/* Delivery Showcase Card */}
              {slide.cardType === 'delivery' && (
                <div key="card-deliv" className="relative w-72 h-72 rounded-3xl bg-[#1a1433]/90 border border-purple-400/40 p-5 flex flex-col justify-between shadow-soft-purple-lg animate-in fade-in zoom-in duration-400">
                  <div className="flex items-center justify-between text-xs text-purple-300">
                    <span className="font-semibold text-white">ระบบเปิดสิทธิ์ทันที</span>
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  </div>

                  <div className="p-3.5 bg-black/60 rounded-xl border border-purple-500/30 space-y-2 text-left">
                    <div className="text-[10px] text-purple-300/70 uppercase">สถานะสิทธิ์การใช้งาน:</div>
                    <div className="text-xs font-bold text-emerald-300">
                      ⚡ ซื้อแล้วจบเลย ไม่ต้องใส่ License Key
                    </div>
                    <div className="text-[10px] text-purple-200">✓ แตกไฟล์ .zip เปิดใช้งานได้ทันทีตลอดชีพ</div>
                  </div>

                  <div className="text-center text-[11px] text-purple-300/70">
                    ปลอดภัย 100% พร้อมใช้งานตลอดชีพ
                  </div>
                </div>
              )}

            </div>

          </div>

          {/* Navigation Controls on the bottom row of the banner */}
          <div className="pt-4 flex items-center justify-between border-t border-purple-900/20 text-xs">
            
            {/* Slide indicators & Play/Pause */}
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsPaused(!isPaused)}
                className="p-1 rounded-md text-purple-300 hover:text-white transition-colors"
                title={isPaused ? "เล่นต่อ" : "หยุดชั่วคราว"}
              >
                {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              </button>

              <div className="flex items-center gap-1.5 ml-1">
                {SLIDES.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => goToSlide(idx)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      idx === current 
                        ? 'w-7 bg-purple-400 shadow-[0_0_8px_rgba(196,181,253,0.8)]' 
                        : 'w-2 bg-purple-950 hover:bg-purple-800'
                    }`}
                    aria-label={`ไปที่สไลด์ ${idx + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Next / Prev Navigation Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={prevSlide}
                className="p-2 rounded-xl bg-[#181328]/80 hover:bg-purple-900/60 text-purple-200 border border-purple-500/30 transition-all hover:scale-105 active:scale-95"
                aria-label="Previous Slide"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                onClick={nextSlide}
                className="p-2 rounded-xl bg-[#181328]/80 hover:bg-purple-900/60 text-purple-200 border border-purple-500/30 transition-all hover:scale-105 active:scale-95"
                aria-label="Next Slide"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

          </div>

        </div>

      </div>

      {/* Interactive 3-Tab Slide Switcher Below ("เลื่อนแบบมีลูกเล่น") */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-3">
        {SLIDES.map((s, idx) => (
          <button
            key={s.id}
            onClick={() => goToSlide(idx)}
            className={`p-3 rounded-2xl text-left transition-all duration-300 border flex flex-col justify-between ${
              idx === current
                ? 'bg-[#1b1531] border-purple-400/60 shadow-soft-purple translate-y-[-2px]'
                : 'bg-[#130f22]/70 border-purple-500/15 hover:border-purple-400/30 hover:bg-[#161228]'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className={`text-[10px] font-bold font-mono ${idx === current ? 'text-purple-300' : 'text-purple-400/50'}`}>
                0{s.id}
              </span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${idx === current ? 'bg-purple-900/70 text-purple-200' : 'text-purple-400/40'}`}>
                {s.tag}
              </span>
            </div>
            <div className={`text-xs font-semibold truncate ${idx === current ? 'text-white' : 'text-purple-300/70'}`}>
              {s.title}
            </div>
          </button>
        ))}
      </div>

    </div>
  );
}
