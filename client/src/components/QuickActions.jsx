import React, { useState, useEffect, useRef } from 'react';
import { 
  Download, Wallet, UserCheck, Terminal, ArrowUpRight, Sparkles 
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function QuickActions({ onNavigateToCatalog, onOpenTopup, onOpenAuth, onOpenLibrary }) {
  const { t } = useLanguage();
  const containerRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  // Trigger smooth scroll slide-in entrance when scrolling into view
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.15 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const cards = [
    {
      id: "catalog",
      title: t('qaCatalogTitle'),
      subtitle: t('qaCatalogSubtitle'),
      icon: <Terminal className="w-7 h-7 sm:w-8 sm:h-8 text-purple-200 group-hover:text-white transition-colors duration-300" />,
      accentColor: "from-purple-600/40 via-purple-500/20 to-indigo-600/30",
      glowColor: "rgba(168, 85, 247, 0.4)",
      badge: "BROWSE",
      action: () => onNavigateToCatalog('all')
    },
    {
      id: "library",
      title: t('qaLibraryTitle'),
      subtitle: t('qaLibrarySubtitle'),
      icon: <Download className="w-7 h-7 sm:w-8 sm:h-8 text-purple-200 group-hover:text-white transition-colors duration-300" />,
      accentColor: "from-indigo-600/40 via-purple-500/20 to-pink-600/30",
      glowColor: "rgba(129, 140, 248, 0.4)",
      badge: "LIBRARY",
      action: onOpenLibrary
    },
    {
      id: "wallet",
      title: t('qaWalletTitle'),
      subtitle: t('qaWalletSubtitle'),
      icon: <Wallet className="w-7 h-7 sm:w-8 sm:h-8 text-purple-200 group-hover:text-white transition-colors duration-300" />,
      accentColor: "from-fuchsia-600/40 via-purple-500/20 to-indigo-600/30",
      glowColor: "rgba(217, 70, 239, 0.4)",
      badge: "TOPUP",
      action: onOpenTopup
    },
    {
      id: "account",
      title: t('qaAccountTitle'),
      subtitle: t('qaAccountSubtitle'),
      icon: <UserCheck className="w-7 h-7 sm:w-8 sm:h-8 text-purple-200 group-hover:text-white transition-colors duration-300" />,
      accentColor: "from-violet-600/40 via-indigo-500/20 to-purple-600/30",
      glowColor: "rgba(139, 92, 246, 0.4)",
      badge: "ACCOUNT",
      action: () => onOpenAuth('register')
    }
  ];

  return (
    <div ref={containerRef} className="w-full my-6 sm:my-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
        {cards.map((card, index) => {
          // Staggered delay for cascading scroll slide-in
          const transitionDelays = ['delay-[50ms]', 'delay-[150ms]', 'delay-[250ms]', 'delay-[350ms]'];
          const delayClass = transitionDelays[index % 4];

          return (
            <div
              key={card.id}
              onClick={card.action}
              style={{ '--glow-color': card.glowColor }}
              className={`group relative overflow-hidden rounded-2xl cursor-pointer select-none transition-all duration-700 ease-out transform ${delayClass} ${
                isVisible 
                  ? 'opacity-100 translate-y-0 scale-100' 
                  : 'opacity-0 translate-y-10 scale-95 pointer-events-none'
              } hover:-translate-y-1.5 active:scale-[0.98] bg-[#140f24]/90 border border-purple-500/25 hover:border-purple-400/60 shadow-[0_8px_30px_rgb(0,0,0,0.4)] hover:shadow-[0_15px_35px_rgba(147,51,234,0.25)]`}
            >
              {/* Dynamic Gradient Glow Layer */}
              <div 
                className={`absolute inset-0 bg-gradient-to-br ${card.accentColor} opacity-20 group-hover:opacity-60 transition-opacity duration-500`} 
              />
              
              {/* Subtle animated border spotlight */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-400/10 to-transparent opacity-0 group-hover:opacity-100 -translate-x-full group-hover:translate-x-full transition-all duration-1000 ease-in-out pointer-events-none" />

              {/* Card Content Container */}
              <div className="relative p-4 sm:p-5 flex flex-col justify-between h-36 sm:h-44 z-10">
                
                {/* Top Row: Icon + Badge / Arrow */}
                <div className="flex items-start justify-between">
                  <div className="p-2.5 sm:p-3 rounded-xl bg-[#1b1431] border border-purple-500/30 group-hover:border-purple-400/60 shadow-inner group-hover:scale-110 transition-all duration-300">
                    {card.icon}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="hidden sm:inline-block text-[10px] font-mono tracking-widest px-2 py-0.5 rounded-full bg-purple-950/80 border border-purple-400/30 text-purple-300 font-bold group-hover:border-purple-300/60 transition-colors">
                      {card.badge}
                    </span>
                    <div className="p-1 rounded-lg text-purple-400 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300">
                      <ArrowUpRight className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                    </div>
                  </div>
                </div>

                {/* Bottom Row: Title + Subtitle */}
                <div className="mt-2">
                  <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-purple-200 transition-colors duration-200 tracking-tight flex items-center gap-1.5">
                    <span>{card.title}</span>
                  </h3>
                  <p className="text-[11px] sm:text-xs text-purple-200/60 group-hover:text-purple-200/90 transition-colors duration-200 line-clamp-1 mt-0.5">
                    {card.subtitle}
                  </p>
                </div>

              </div>

              {/* Bottom Decorative Highlight Line */}
              <div className="absolute bottom-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500/50 to-transparent group-hover:via-purple-400 transition-all duration-500" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
