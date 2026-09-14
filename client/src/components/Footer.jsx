import React from 'react';
import { Terminal, ShieldCheck, Zap, Headphones, Lock } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function Footer({ onOpenAdmin }) {
  const { t, lang } = useLanguage();

  return (
    <footer className="bg-[#0b0914] border-t border-purple-900/30 text-purple-300/60 text-xs sm:text-sm mt-16">
      
      {/* Guarantees Bar */}
      <div className="border-b border-purple-900/20 py-6 sm:py-8 bg-[#0f0c1a]/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center sm:text-left">
            
            <div className="flex items-center gap-3 justify-center sm:justify-start">
              <div className="p-2.5 rounded-xl bg-purple-950/60 text-purple-300 border border-purple-500/20">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-white text-xs sm:text-sm">{t('guarantee1_title')}</h4>
                <p className="text-[11px] sm:text-xs text-purple-300/60">{t('guarantee1_desc')}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 justify-center sm:justify-start">
              <div className="p-2.5 rounded-xl bg-purple-950/60 text-emerald-400 border border-purple-500/20">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-white text-xs sm:text-sm">{t('guarantee2_title')}</h4>
                <p className="text-[11px] sm:text-xs text-purple-300/60">{t('guarantee2_desc')}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 justify-center sm:justify-start">
              <div className="p-2.5 rounded-xl bg-purple-950/60 text-purple-300 border border-purple-500/20">
                <Headphones className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-white text-xs sm:text-sm">{t('guarantee3_title')}</h4>
                <p className="text-[11px] sm:text-xs text-purple-300/60">{t('guarantee3_desc')}</p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          <div className="md:col-span-2 space-y-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl p-[1px] bg-gradient-to-tr from-purple-500 to-indigo-400 shadow-soft-purple">
                <img
                  src="/ibuki_logo.png"
                  alt="IbukiHub"
                  className="w-full h-full object-cover rounded-[10px]"
                />
              </div>
              <span className="text-base font-bold text-white tracking-tight">Ibuki<span className="text-purple-400">Hub</span></span>
            </div>
            <p className="text-xs text-purple-300/70 leading-relaxed max-w-md">
              {t('footerDesc')}
            </p>
          </div>

          <div>
            <h5 className="font-semibold text-white mb-2.5 text-xs tracking-wide uppercase">{t('footerFeatured')}</h5>
            <ul className="space-y-1.5 text-xs">
              <li>
                <a href="#catalog" className="hover:text-purple-300 transition-colors">
                  IbukiDownload V.2.5
                </a>
              </li>
              <li>
                <a href="#catalog" className="hover:text-purple-300 transition-colors">
                  IbukiDownload V.2.2
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="font-semibold text-white mb-2.5 text-xs tracking-wide uppercase">{t('footerSupport')}</h5>
            <ul className="space-y-2 text-xs">
              <li>
                <span className="text-purple-300/80 font-medium">Facebook : </span>
                <a 
                  href="https://www.facebook.com/profile.php?id=61578490434753&locale=th_TH" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-purple-200 hover:text-white underline font-semibold transition-colors"
                >
                  Ibuki Ch
                </a>
              </li>
              <li><a href="https://discord.com" target="_blank" rel="noreferrer" className="hover:text-purple-300 transition-colors">Discord Community</a></li>
              <li><a href="https://line.me" target="_blank" rel="noreferrer" className="hover:text-purple-300 transition-colors">LINE Official Account</a></li>
            </ul>
          </div>

        </div>

        <div className="mt-8 pt-5 border-t border-purple-900/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-purple-400/50">
          <div>
            {t('footerCopyright')}
          </div>
          <div>
            Custom Software Distribution Platform
          </div>
        </div>

      </div>

    </footer>
  );
}
