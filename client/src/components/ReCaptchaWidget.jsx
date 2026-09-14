import React, { useState, useEffect } from 'react';
import { 
  Check, RefreshCw, Volume2, Info, X, 
  Laptop, Monitor, Cpu, Terminal, Package, 
  Download, Shield, Car, Bike, Bot, Sparkles,
  Grid
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

// Helper to render icon for tile
function TileIcon({ name, color }) {
  const iconProps = { className: "w-8 h-8 sm:w-9 sm:h-9", style: { color: color || '#8b5cf6' } };
  switch (name) {
    case 'laptop': return <Laptop {...iconProps} />;
    case 'monitor': return <Monitor {...iconProps} />;
    case 'cpu': return <Cpu {...iconProps} />;
    case 'terminal': return <Terminal {...iconProps} />;
    case 'package': return <Package {...iconProps} />;
    case 'download': return <Download {...iconProps} />;
    case 'shield': return <Shield {...iconProps} />;
    case 'car': return <Car {...iconProps} />;
    case 'bike': return <Bike {...iconProps} />;
    case 'bot': return <Bot {...iconProps} />;
    case 'sparkles': return <Sparkles {...iconProps} />;
    default: return <Sparkles {...iconProps} />;
  }
}

export default function ReCaptchaWidget({ verified, setVerified, onTokenChange }) {
  const { t, lang } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [showChallenge, setShowChallenge] = useState(false);
  const [challengeData, setChallengeData] = useState(null);
  const [selectedIndices, setSelectedIndices] = useState([]);
  const [verifying, setVerifying] = useState(false);
  const [challengeError, setChallengeError] = useState(null);

  // Fetch interactive 3x3 challenge from server
  const fetchChallenge = async () => {
    setLoading(true);
    setChallengeError(null);
    setSelectedIndices([]);
    try {
      const res = await fetch('/api/auth/captcha-challenge');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "เกิดข้อผิดพลาดในการโหลดโจทย์");
      setChallengeData(data);
      setShowChallenge(true);
    } catch (err) {
      console.error("Captcha fetch error:", err);
      // Fallback local challenge if offline
      setChallengeData({
        challengeId: 'local_' + Date.now(),
        nameTh: "คอมพิวเตอร์ หรือ โน้ตบุ๊ก",
        nameEn: "Computers or Laptops",
        tiles: [
          { index: 0, label: "Laptop", icon: "laptop", color: "#6366f1" },
          { index: 1, label: "Car", icon: "car", color: "#ef4444" },
          { index: 2, label: "Desktop PC", icon: "monitor", color: "#8b5cf6" },
          { index: 3, label: "Bot", icon: "bot", color: "#f97316" },
          { index: 4, label: "Workstation", icon: "cpu", color: "#a855f7" },
          { index: 5, label: "Motorbike", icon: "bike", color: "#ec4899" },
          { index: 6, label: "Shield", icon: "shield", color: "#10b981" },
          { index: 7, label: "Gaming Laptop", icon: "laptop", color: "#3b82f6" },
          { index: 8, label: "Software", icon: "package", color: "#06b6d4" }
        ]
      });
      setShowChallenge(true);
    } finally {
      setLoading(false);
    }
  };

  // Checkbox click handler: authentic spinning verification
  const handleCheckboxClick = async (e) => {
    e.stopPropagation();
    if (loading) return;

    if (verified) {
      setVerified(false);
      if (onTokenChange) onTokenChange(null);
      return;
    }

    setLoading(true);
    try {
      // Simulate real reCAPTCHA evaluation delay
      const [res] = await Promise.all([
        fetch('/api/auth/quick-captcha-verify', { method: 'POST' }),
        new Promise(resolve => setTimeout(resolve, 650))
      ]);
      const data = await res.json();
      if (data && data.success && data.captchaToken) {
        setVerified(true);
        if (onTokenChange) onTokenChange(data.captchaToken);
      } else {
        // If quick verification fails, open challenge
        fetchChallenge();
      }
    } catch (err) {
      // Fallback to challenge modal
      fetchChallenge();
    } finally {
      setLoading(false);
    }
  };

  const toggleTile = (idx) => {
    setChallengeError(null);
    setSelectedIndices(prev => 
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  const handleVerify = async () => {
    if (!challengeData) return;
    setVerifying(true);
    setChallengeError(null);

    try {
      const res = await fetch('/api/auth/verify-captcha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId: challengeData.challengeId,
          selectedIndices
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || t('captchaWrongAlert'));
      }

      // Success
      setVerified(true);
      if (onTokenChange) onTokenChange(data.captchaToken);
      setShowChallenge(false);
    } catch (err) {
      setChallengeError(err.message || t('captchaWrongAlert'));
      setTimeout(() => {
        fetchChallenge();
      }, 1000);
    } finally {
      setVerifying(false);
    }
  };

  const handleAudioHint = () => {
    try {
      const targetText = lang === 'en' 
        ? `Please select all ${challengeData?.nameEn || 'targets'}`
        : `โปรดเลือกภาพ ${challengeData?.nameTh || 'ที่กำหนด'}`;
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(targetText);
        utterance.lang = lang === 'en' ? 'en-US' : 'th-TH';
        window.speechSynthesis.speak(utterance);
      }
    } catch (e) {}
  };

  return (
    <div className="w-full flex flex-col items-center my-3 relative">
      
      {/* 1. Main reCAPTCHA Enterprise Card (Pixel-perfect match to Screenshot 2026-09-13 183938.png) */}
      <div 
        onClick={handleCheckboxClick}
        className={`w-full max-w-[304px] bg-[#fbfbfb] hover:bg-white text-[#222] border rounded-[3px] py-3 px-3.5 flex items-center justify-between cursor-pointer select-none shadow-[0_0_4px_1px_rgba(0,0,0,0.08)] transition-all ${
          verified ? 'border-[#34a853]/60 bg-[#f9fff9]' : 'border-[#d3d3d3]'
        }`}
        style={{ minHeight: '74px' }}
      >
        {/* Left side: Checkbox + Text */}
        <div className="flex items-start gap-3 flex-1 min-w-0 pr-1">
          {/* Checkbox square */}
          <div 
            className={`w-[26px] h-[26px] sm:w-[28px] sm:h-[28px] rounded-[2px] border-2 bg-white flex items-center justify-center shrink-0 mt-0.5 transition-all ${
              verified 
                ? 'border-[#0f9d58] bg-[#e6f4ea]' 
                : loading
                  ? 'border-[#1a73e8]'
                  : 'border-[#c1c1c1] hover:border-[#a0a0a0]'
            }`}
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 text-[#1a73e8] animate-spin" />
            ) : verified ? (
              <Check className="w-5 h-5 text-[#0f9d58] stroke-[3.5] animate-in zoom-in duration-200" />
            ) : null}
          </div>

          {/* Text block matching Screenshot 2026-09-13 183938.png */}
          <div className="flex flex-col justify-center select-none text-left">
            <span className="text-[13px] sm:text-[14px] font-normal text-[#222] leading-tight font-sans">
              {lang === 'en' ? "I'm not a robot" : "ฉันไม่ใช่โปรแกรมอัตโนมัติ"}
            </span>

            {/* Quota / Enterprise notice from Screenshot */}
            <div className="text-[9.5px] sm:text-[10px] text-neutral-500 leading-tight mt-1">
              <span>{lang === 'en' ? "This site is protected by " : "เว็บไซต์นี้ใช้โควต้า "}</span>
              <a 
                href="https://cloud.google.com/recaptcha-enterprise" 
                target="_blank" 
                rel="noreferrer" 
                onClick={(e) => e.stopPropagation()}
                className="underline text-neutral-600 hover:text-blue-600 font-medium"
              >
                reCAPTCHA Enterprise
              </a>
              <span className="block underline text-neutral-500">
                {lang === 'en' ? "Free tier quota" : "ฟรีเกิน"}
              </span>
            </div>
          </div>
        </div>

        {/* Right side: Authentic reCAPTCHA Dual-Arrow Badge */}
        <div className="flex flex-col items-center justify-center text-center pl-2 shrink-0 border-l border-neutral-200/60 ml-1">
          {/* Dual circular arrows (top-right blue, bottom-left grey) */}
          <div className="w-8 h-8 flex items-center justify-center">
            <svg viewBox="0 0 48 48" className="w-7 h-7" fill="none">
              {/* Blue top-right arrow */}
              <path
                d="M24 6C32.8 6 40.2 12.3 41.7 20.8L37.8 21.6C36.6 15.1 30.9 10.2 24 10.2C18.6 10.2 13.9 13.1 11.2 17.5L15 20L5 22L7 12L10.3 14.2C13.6 9.2 18.5 6 24 6Z"
                fill="#1A73E8"
              />
              {/* Grey bottom-left arrow */}
              <path
                d="M24 42C15.2 42 7.8 35.7 6.3 27.2L10.2 26.4C11.4 32.9 17.1 37.8 24 37.8C29.4 37.8 34.1 34.9 36.8 30.5L33 28L43 26L41 36L37.7 33.8C34.4 38.8 29.5 42 24 42Z"
                fill="#9AA0A6"
              />
            </svg>
          </div>
          <span className="text-[9px] font-semibold text-neutral-500 tracking-tighter leading-none mt-0.5 font-sans">
            reCAPTCHA
          </span>
          <div className="flex gap-1 text-[7.5px] text-neutral-400 leading-none mt-1">
            <span className="hover:underline">{lang === 'en' ? "Privacy" : "ความเป็นส่วนตัว"}</span>
            <span>-</span>
            <span className="hover:underline">{lang === 'en' ? "Terms" : "ข้อกำหนด"}</span>
          </div>
        </div>
      </div>

      {/* Optional challenge prompt hint */}
      <div className="flex items-center justify-between w-full max-w-[304px] mt-1 px-1">
        <span className="text-[10px] text-purple-300/50">
          {verified ? "✓ ผ่านการตรวจสอบความปลอดภัย" : "คลิกที่ช่องเพื่อยืนยันตัวตน"}
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            fetchChallenge();
          }}
          className="text-[10px] text-purple-400 hover:text-purple-200 underline flex items-center gap-1 transition-colors"
          title="เปิดโจทย์เลือกรูปภาพ 3x3"
        >
          <Grid className="w-3 h-3" />
          <span>ทดสอบโจทย์รูปภาพ</span>
        </button>
      </div>

      {/* 2. Authentic Interactive Challenge Popup Modal */}
      {showChallenge && challengeData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200">
          
          <div 
            className="w-full max-w-[380px] bg-white rounded-lg shadow-2xl overflow-hidden border border-neutral-300 text-neutral-800 flex flex-col animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with authentic reCAPTCHA blue banner */}
            <div className="bg-[#1a73e8] text-white p-4 relative">
              <div className="text-xs font-medium text-blue-100 uppercase tracking-wide">
                {lang === 'en' ? "Select all images with" : "เลือกรูปภาพทั้งหมดที่มี"}
              </div>
              <div className="text-xl sm:text-2xl font-extrabold tracking-tight mt-0.5 drop-shadow-sm">
                {lang === 'en' ? challengeData.nameEn : challengeData.nameTh}
              </div>
              <div className="text-[11px] text-blue-100 mt-1">
                {lang === 'en' ? "Click verify once there are none left" : "คลิกยืนยันเมื่อไม่มีรูปภาพดังกล่าวเหลืออยู่"}
              </div>

              <button
                type="button"
                onClick={() => setShowChallenge(false)}
                className="absolute top-3 right-3 p-1 rounded-full text-blue-200 hover:text-white hover:bg-blue-600/50 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error banner if answer was wrong */}
            {challengeError && (
              <div className="p-2 bg-red-50 text-red-600 text-xs font-semibold text-center border-b border-red-200 animate-shake">
                {challengeError}
              </div>
            )}

            {/* 3x3 Tile Grid */}
            <div className="p-3 bg-neutral-100">
              <div className="grid grid-cols-3 gap-2">
                {challengeData.tiles.map((tile) => {
                  const isSelected = selectedIndices.includes(tile.index);
                  return (
                    <div
                      key={tile.index}
                      onClick={() => toggleTile(tile.index)}
                      className={`relative aspect-square rounded-md bg-white border-2 flex flex-col items-center justify-center p-2 cursor-pointer transition-all duration-150 select-none ${
                        isSelected 
                          ? 'border-[#1a73e8] bg-blue-50/50 scale-[0.96] shadow-inner' 
                          : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
                      }`}
                    >
                      {/* Checkmark badge */}
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#1a73e8] text-white flex items-center justify-center shadow-md animate-in zoom-in duration-100">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}

                      {/* Icon Artwork */}
                      <div className="p-2 rounded-xl bg-neutral-100/70 mb-1 flex items-center justify-center">
                        <TileIcon name={tile.icon} color={tile.color} />
                      </div>

                      {/* Tile text label */}
                      <span className="text-[10px] font-semibold text-neutral-600 truncate max-w-full text-center">
                        {tile.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer action bar */}
            <div className="p-3 bg-white border-t border-neutral-200 flex items-center justify-between">
              {/* Left utility tools */}
              <div className="flex items-center gap-1 text-neutral-500">
                <button
                  type="button"
                  onClick={fetchChallenge}
                  title="โจทย์ใหม่"
                  className="p-2 rounded-md hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={handleAudioHint}
                  title="ฟังเสียงเป้าหมาย"
                  className="p-2 rounded-md hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
                <div title="reCAPTCHA v2 Verified" className="p-2 text-neutral-400">
                  <Info className="w-4 h-4" />
                </div>
              </div>

              {/* Verify button */}
              <button
                type="button"
                onClick={handleVerify}
                disabled={verifying || loading}
                className="px-6 py-2 rounded bg-[#1a73e8] hover:bg-[#1557b0] active:bg-[#0d47a1] text-white font-bold text-xs sm:text-sm transition-colors shadow-sm disabled:opacity-50"
              >
                {verifying ? "กำลังตรวจสอบ..." : (lang === 'en' ? "Verify" : "ยืนยัน")}
              </button>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
