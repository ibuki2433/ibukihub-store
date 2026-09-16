import React, { useState } from 'react';
import { Layers, Search, ChevronDown, Download, Wallet, User, LogIn, UserPlus, LogOut, ShieldCheck, Sparkles, Globe, Gift } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function Navbar({
  searchTerm,
  setSearchTerm,
  onOpenAuth,
  onOpenTopup,
  onOpenRedeem,
  onOpenLibrary,
  onOpenAdmin,
  categories = [],
  selectedCategory,
  setSelectedCategory,
  onLogoClick,
  onSearchSubmit,
  products = [],
  onSelectProduct,
  currentPage
}) {
  const { user, logout } = useAuth();
  const { lang, toggleLang, t } = useLanguage();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  // Normalize query for flexible search
  const normalize = (str) => (str || '').toLowerCase().replace(/[\s\.\-_]/g, '');

  const matchingProducts = searchTerm && searchTerm.trim().length > 0 && products && products.length > 0
    ? products.filter(p => {
        const q = searchTerm.toLowerCase().trim();
        const normQ = normalize(q);
        const name = (p.name || '').toLowerCase();
        const normName = normalize(name);
        const shortDesc = (p.shortDesc || '').toLowerCase();
        const badge = (p.badge || '').toLowerCase();
        const version = (p.version || '').toLowerCase();
        const category = (p.category || '').toLowerCase();
        return (
          name.includes(q) ||
          normName.includes(normQ) ||
          shortDesc.includes(q) ||
          badge.includes(q) ||
          version.includes(q) ||
          category.includes(q)
        );
      })
    : [];

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    setSearchFocused(false);
    if (onSearchSubmit) {
      onSearchSubmit(searchTerm);
    }
  };

  const handleSelectLiveProduct = (prod) => {
    setSearchFocused(false);
    if (onSelectProduct) {
      onSelectProduct(prod);
    }
  };

  return (
    <header className="sticky top-0 z-40 header-soft-purple shadow-lg border-b border-purple-500/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-3">
          
          {/* Brand Logo - IbukiHub with Character Avatar */}
          <div 
            onClick={() => { 
              if (onLogoClick) onLogoClick();
              setSelectedCategory('all'); 
              setSearchTerm(''); 
            }}
            className="flex items-center gap-3 cursor-pointer group select-none shrink-0"
          >
            {/* OC Avatar with soft purple glow */}
            <div className="relative">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl p-[1.5px] bg-gradient-to-tr from-purple-600 via-purple-400 to-indigo-300 shadow-soft-purple group-hover:scale-105 group-hover:shadow-soft-purple-lg transition-all duration-300">
                <img
                  src="/ibuki_logo.png"
                  alt="IbukiHub Logo"
                  className="w-full h-full object-cover rounded-[14px] bg-[#161224]"
                />
              </div>
            </div>

            {/* Brand Typography */}
            <div className="flex flex-col">
              <span className="text-xl sm:text-2xl font-bold tracking-tight text-white font-sans">
                Ibuki<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-purple-400 to-purple-200">Hub</span>
              </span>
              <span className="text-[10px] sm:text-[11px] font-medium tracking-wide text-purple-300/80 -mt-0.5">
                {t('brandSubtitle')}
              </span>
            </div>
          </div>

          {/* Search Box with Live Auto-Suggestions */}
          <div className="flex-1 max-w-xs sm:max-w-md mx-2 hidden md:block relative">
            <form 
              onSubmit={handleSearchSubmit}
              className="flex items-center"
            >
              <div className="relative w-full flex items-center">
                <input
                  type="text"
                  placeholder={t('navSearchPlaceholder')}
                  value={searchTerm}
                  onFocus={() => setSearchFocused(true)}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setSearchFocused(true);
                  }}
                  className="w-full bg-[#161224] text-purple-100 placeholder-purple-300/40 text-xs sm:text-sm px-3.5 py-2 pr-8 rounded-l-lg border border-purple-500/20 focus:outline-none focus:border-purple-400/50 transition-colors"
                />

                {/* Clear Input Button */}
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => { setSearchTerm(''); setSearchFocused(false); }}
                    className="absolute right-2 text-purple-400 hover:text-white text-xs px-1"
                    title="ล้างคำค้นหา"
                  >
                    ✕
                  </button>
                )}
              </div>

              <button
                type="submit"
                className="bg-purple-700/80 hover:bg-purple-600 active:bg-purple-800 text-white px-3.5 py-2 rounded-r-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-colors border border-purple-500/30 border-l-0 shrink-0 shadow-sm"
              >
                <Search className="w-3.5 h-3.5" />
                <span>{t('navSearchBtn')}</span>
              </button>
            </form>

            {/* Live Search Suggestions Dropdown */}
            {searchFocused && searchTerm.trim().length > 0 && (
              <div 
                className="absolute left-0 right-0 top-full mt-1.5 bg-[#171328] border border-purple-500/30 rounded-2xl shadow-2xl overflow-hidden z-50 divide-y divide-purple-900/30"
                onMouseDown={(e) => e.preventDefault()} // Prevent blur before click
              >
                <div className="px-3.5 py-2 bg-purple-950/40 flex items-center justify-between text-[11px] text-purple-300 font-medium">
                  <span>ผลลัพธ์ที่ตรงกับ "{searchTerm}":</span>
                  <span className="text-[10px] text-purple-400 bg-purple-900/60 px-1.5 py-0.5 rounded">
                    {matchingProducts.length} รายการ
                  </span>
                </div>

                <div className="max-h-64 overflow-y-auto">
                  {matchingProducts.length > 0 ? (
                    matchingProducts.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => handleSelectLiveProduct(p)}
                        className="px-3.5 py-2.5 hover:bg-purple-800/30 transition-colors cursor-pointer flex items-center justify-between gap-3 group"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            className="w-9 h-9 rounded-lg object-cover bg-black/40 border border-purple-500/20 shrink-0"
                          />
                          <div className="overflow-hidden">
                            <div className="text-xs font-semibold text-white group-hover:text-purple-300 truncate">
                              {p.name}
                            </div>
                            <div className="text-[10px] text-purple-300/70 truncate flex items-center gap-1.5 mt-0.5">
                              <span>{p.category === 'automation' ? '🤖 บอทอัตโนมัติ' : '📁 จัดการไฟล์'}</span>
                              <span>•</span>
                              <span className="text-purple-400">{p.version || 'v1.0'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-xs font-bold text-emerald-400 font-mono">
                            ฿ {p.price?.toLocaleString()}
                          </div>
                          <span className="text-[9px] text-purple-300/60">คลิกเพื่อดู</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-xs text-purple-300/60">
                      ไม่พบซอฟต์แวร์ที่ตรงกับคำค้นหา
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleSearchSubmit}
                  className="w-full py-2 px-3 bg-[#130f20] hover:bg-purple-900/40 text-purple-300 text-xs font-medium text-center flex items-center justify-center gap-1 transition-colors"
                >
                  <Search className="w-3 h-3" />
                  <span>ดูในหน้าแคตตาล็อกทั้งหมด</span>
                </button>
              </div>
            )}
          </div>

          {/* Nav Items */}
          <nav className="flex items-center gap-2 sm:gap-3">
            
            {/* Category Dropdown */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium text-purple-200/90 hover:text-white hover:bg-purple-900/20 border border-transparent hover:border-purple-500/20 transition-all"
              >
                <span>{t('navCategories')}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {dropdownOpen && (
                <div 
                  className="absolute left-0 mt-2 w-60 bg-[#171328] border border-purple-500/30 rounded-xl shadow-2xl py-1.5 z-50 text-xs sm:text-sm"
                  onMouseLeave={() => setDropdownOpen(false)}
                >
                  <button
                    onClick={() => { setSelectedCategory('all'); setDropdownOpen(false); }}
                    className={`w-full text-left px-3.5 py-2 hover:bg-purple-800/20 transition-colors flex items-center gap-2 ${selectedCategory === 'all' ? 'text-purple-300 font-semibold bg-purple-900/10' : 'text-purple-200/80'}`}
                  >
                    <span>📦</span>
                    <span>{t('navAllSoftware')}</span>
                  </button>
                  {categories.map((cat) => {
                    const catName = cat.id === 'download' 
                      ? (lang === 'en' ? '📁 Media Downloader' : '📁 จัดการไฟล์และดาวน์โหลด')
                      : cat.id === 'automation'
                        ? (lang === 'en' ? '🤖 Automation Bots' : '🤖 การตลาด & บอทอัตโนมัติ')
                        : cat.name;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => { setSelectedCategory(cat.id); setDropdownOpen(false); }}
                        className={`w-full text-left px-3.5 py-2 hover:bg-purple-800/20 transition-colors flex items-center gap-2 ${selectedCategory === cat.id ? 'text-purple-300 font-semibold bg-purple-900/10' : 'text-purple-200/80'}`}
                      >
                        <span>{catName}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* My Purchases / Library Button */}
            {user && (
              <button
                onClick={onOpenLibrary}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium text-purple-200/90 hover:text-white hover:bg-purple-900/20 border border-transparent hover:border-purple-500/20 transition-all"
              >
                <Download className="w-3.5 h-3.5 text-purple-300" />
                <span className="hidden sm:inline">{t('navLibrary')}</span>
              </button>
            )}

            {/* Redeem Promo Code Button */}
            <button
              onClick={onOpenRedeem}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-neutral-950 shadow-[0_0_15px_rgba(245,158,11,0.35)] transition-all hover:scale-[1.03] active:scale-95 cursor-pointer"
              title="ใส่โค้ดโปรโมชั่น"
            >
              <Gift className="w-3.5 h-3.5 text-neutral-950 shrink-0" />
              <span>ใส่โค้ด</span>
            </button>

            {/* Top-up Button */}
            <button
              onClick={onOpenTopup}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium bg-purple-950/60 hover:bg-purple-900/60 text-purple-200 border border-purple-400/30 shadow-sm transition-all hover:scale-[1.02]"
            >
              <Wallet className="w-3.5 h-3.5 text-purple-300" />
              <span>{t('navTopup')}</span>
            </button>

            {/* Language Switcher Toggle */}
            <button
              onClick={toggleLang}
              title={lang === 'th' ? 'Switch to English' : 'เปลี่ยนเป็นภาษาไทย'}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-[#171328] hover:bg-purple-900/30 text-purple-200 hover:text-white border border-purple-500/30 hover:border-purple-400/50 shadow-sm transition-all cursor-pointer select-none"
            >
              <Globe className="w-3.5 h-3.5 text-purple-400" />
              <span className={`transition-colors ${lang === 'th' ? 'text-white font-bold' : 'text-purple-300/50'}`}>TH</span>
              <span className="text-purple-500/40 text-[10px]">/</span>
              <span className={`transition-colors ${lang === 'en' ? 'text-white font-bold' : 'text-purple-300/50'}`}>EN</span>
            </button>

            {/* User Profile / Auth Area */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 bg-[#1a152e] hover:bg-[#201a39] px-3 py-1.5 rounded-xl border border-purple-500/30 transition-all text-xs sm:text-sm"
                >
                  <div className="w-6 h-6 rounded-lg bg-purple-700/60 border border-purple-400/30 flex items-center justify-center font-bold text-purple-200 text-xs">
                    {user.displayName ? user.displayName.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="font-semibold text-white leading-none">{user.displayName || user.username}</span>
                    <span className="text-[11px] font-medium text-purple-300">{t('currency')} {user.balance.toLocaleString()}</span>
                  </div>
                  <ChevronDown className="w-3 h-3 text-purple-300 ml-0.5" />
                </button>

                {userMenuOpen && (
                  <div 
                    className="absolute right-0 mt-2 w-56 bg-[#171328] border border-purple-500/30 rounded-xl shadow-2xl py-1.5 z-50 text-xs sm:text-sm"
                    onMouseLeave={() => setUserMenuOpen(false)}
                  >
                    <div className="px-3.5 py-2 border-b border-purple-900/30 text-xs text-purple-300/70">
                      <span>{lang === 'th' ? 'เข้าสู่ระบบในชื่อ:' : 'Signed in as:'} </span>
                      <span className="text-white font-semibold">{user.displayName || user.username}</span>
                      <div className="mt-1 text-purple-300 font-bold">
                        {t('buyCurrentBalance')} {t('currency')} {user.balance.toLocaleString()}
                      </div>
                    </div>

                    <button
                      onClick={() => { onOpenLibrary(); setUserMenuOpen(false); }}
                      className="w-full text-left px-3.5 py-2 hover:bg-purple-800/20 text-purple-200 flex items-center gap-2"
                    >
                      <Download className="w-4 h-4 text-purple-400" />
                      <span>{t('qaLibraryTitle')}</span>
                    </button>

                    <button
                      onClick={() => { onOpenTopup(); setUserMenuOpen(false); }}
                      className="w-full text-left px-3.5 py-2 hover:bg-purple-800/20 text-purple-200 flex items-center gap-2"
                    >
                      <Wallet className="w-4 h-4 text-purple-400" />
                      <span>{t('navTopup')}</span>
                    </button>

                    <button
                      onClick={() => { onOpenRedeem(); setUserMenuOpen(false); }}
                      className="w-full text-left px-3.5 py-2 hover:bg-amber-950/30 text-amber-300 flex items-center gap-2 font-semibold"
                    >
                      <Gift className="w-4 h-4 text-amber-400" />
                      <span>ใส่โค้ดโปรโมชั่น</span>
                    </button>

                    {user.role === 'admin' && (
                      <button
                        onClick={() => { onOpenAdmin(); setUserMenuOpen(false); }}
                        className="w-full text-left px-3.5 py-2 hover:bg-purple-800/30 text-purple-200 font-semibold flex items-center gap-2 border-t border-b border-purple-900/30 my-1"
                      >
                        <ShieldCheck className="w-4 h-4 text-purple-400" />
                        <span>{t('navAdmin')}</span>
                      </button>
                    )}

                    <button
                      onClick={() => { logout(); setUserMenuOpen(false); }}
                      className="w-full text-left px-3.5 py-2 hover:bg-red-950/30 text-red-300 flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>{t('navSignOut')}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  onClick={() => onOpenAuth('signin')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                    currentPage === 'signin'
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-500/25 border border-purple-400 font-bold'
                      : 'text-purple-200 hover:text-white hover:bg-purple-900/20 border border-transparent'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>{t('navSignIn')}</span>
                </button>
                <button
                  onClick={() => onOpenAuth('register')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                    currentPage === 'signup'
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-500/25 border border-purple-400 font-bold'
                      : 'bg-purple-950/60 hover:bg-purple-900/60 text-purple-100 border border-purple-400/30'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{t('navRegister')}</span>
                </button>
              </div>
            )}

          </nav>

        </div>
      </div>

      {/* Mobile Search input */}
      <div className="md:hidden px-4 pb-3 relative">
        <form onSubmit={handleSearchSubmit} className="flex items-center">
          <div className="relative w-full flex items-center">
            <input
              type="text"
              placeholder={t('navSearchPlaceholder')}
              value={searchTerm}
              onFocus={() => setSearchFocused(true)}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setSearchFocused(true);
              }}
              className="w-full bg-[#161224] text-purple-100 placeholder-purple-300/40 text-xs px-3 py-2 pr-7 rounded-l-lg border border-purple-500/20 focus:outline-none"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => { setSearchTerm(''); setSearchFocused(false); }}
                className="absolute right-2 text-purple-400 hover:text-white text-xs px-1"
              >
                ✕
              </button>
            )}
          </div>
          <button
            type="submit"
            className="bg-purple-700/80 active:bg-purple-600 text-white px-3 py-2 rounded-r-lg text-xs font-medium flex items-center gap-1 shrink-0"
          >
            <Search className="w-3.5 h-3.5" />
            <span>{t('navSearchBtn')}</span>
          </button>
        </form>

        {/* Mobile Suggestions Dropdown */}
        {searchFocused && searchTerm.trim().length > 0 && (
          <div 
            className="absolute left-4 right-4 top-full mt-1 bg-[#171328] border border-purple-500/30 rounded-xl shadow-2xl overflow-hidden z-50 divide-y divide-purple-900/30"
            onMouseDown={(e) => e.preventDefault()}
          >
            <div className="px-3 py-1.5 bg-purple-950/50 flex items-center justify-between text-[10px] text-purple-300">
              <span>ผลลัพธ์ "{searchTerm}":</span>
              <span>{matchingProducts.length} รายการ</span>
            </div>
            <div className="max-h-52 overflow-y-auto">
              {matchingProducts.length > 0 ? (
                matchingProducts.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => handleSelectLiveProduct(p)}
                    className="px-3 py-2 hover:bg-purple-800/30 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="truncate font-medium text-white">{p.name}</div>
                    <div className="text-emerald-400 font-mono font-bold shrink-0">฿{p.price}</div>
                  </div>
                ))
              ) : (
                <div className="p-3 text-center text-xs text-purple-300/60">ไม่พบสินค้า</div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
