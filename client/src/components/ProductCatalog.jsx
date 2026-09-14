import React, { useState, useEffect, useRef } from 'react';
import { SlidersHorizontal, SearchX, Boxes, Terminal } from 'lucide-react';
import ProductCard from './ProductCard';
import { useLanguage } from '../context/LanguageContext';

export default function ProductCatalog({
  products,
  categories,
  selectedCategory,
  setSelectedCategory,
  searchTerm,
  setSearchTerm,
  onSelectProduct,
  onQuickBuy
}) {
  const { t, lang } = useLanguage();
  const [sortBy, setSortBy] = useState('popular'); // popular, price-asc, price-desc
  const containerRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Normalize helper for flexible fuzzy search (e.g. 'v.2.5' matches 'v2.5', '2.5', 'IbukiDownload')
  const normalize = (str) => (str || '').toLowerCase().replace(/[\s\.\-_]/g, '');

  // Filter & Sort
  let filtered = products.filter(p => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    if (!searchTerm || !searchTerm.trim()) return matchesCategory;

    const q = searchTerm.toLowerCase().trim();
    const normQ = normalize(q);
    const name = (p.name || '').toLowerCase();
    const normName = normalize(name);
    const shortDesc = (p.shortDesc || '').toLowerCase();
    const desc = (p.description || '').toLowerCase();
    const badge = (p.badge || '').toLowerCase();
    const version = (p.version || '').toLowerCase();
    const category = (p.category || '').toLowerCase();

    const matchesSearch = 
      name.includes(q) ||
      normName.includes(normQ) ||
      shortDesc.includes(q) ||
      desc.includes(q) ||
      badge.includes(q) ||
      version.includes(q) ||
      category.includes(q);

    return matchesCategory && matchesSearch;
  });

  if (sortBy === 'price-asc') {
    filtered.sort((a, b) => a.price - b.price);
  } else if (sortBy === 'price-desc') {
    filtered.sort((a, b) => b.price - a.price);
  } else {
    // popular
    filtered.sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0));
  }

  return (
    <section ref={containerRef} id="catalog" className="w-full my-8 scroll-mt-24">
      
      {/* Catalog Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-purple-900/20">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-950/50 border border-purple-500/30 text-purple-300 shadow-soft-purple">
            <Terminal className="w-5 h-5 text-purple-300" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>{t('catalogTitle')}</span>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-purple-900/40 text-purple-300 border border-purple-500/20">
                {filtered.length} {t('itemCountSuffix')}
              </span>
            </h2>
            <p className="text-xs text-purple-200/60 mt-0.5">
              {t('catalogSubtitle')}
            </p>
          </div>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          <div className="flex items-center gap-1.5 text-xs text-purple-200/70 bg-[#171328] px-3 py-2 rounded-xl border border-purple-500/20">
            <SlidersHorizontal className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">{t('catalogSortLabel')}</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-purple-200 font-medium focus:outline-none cursor-pointer"
            >
              <option value="popular" className="bg-[#171328] text-white">{t('catalogSortPopular')}</option>
              <option value="price-asc" className="bg-[#171328] text-white">{t('catalogSortPriceAsc')}</option>
              <option value="price-desc" className="bg-[#171328] text-white">{t('catalogSortPriceDesc')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Active Search Notification Banner */}
      {searchTerm && (
        <div className="mb-4 p-3 rounded-xl bg-purple-950/60 border border-purple-500/30 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-purple-200">
            <span>🔍 ค้นหาคำว่า:</span>
            <strong className="text-white bg-black/40 px-2 py-0.5 rounded border border-purple-400/30 font-mono">"{searchTerm}"</strong>
            <span className="text-purple-300/80">• พบ {filtered.length} รายการ</span>
          </div>
          <button
            onClick={() => setSearchTerm('')}
            className="text-purple-300 hover:text-white px-2 py-1 rounded bg-purple-900/50 hover:bg-purple-800/70 border border-purple-500/30 transition-colors shrink-0"
          >
            ล้างการค้นหา ✕
          </button>
        </div>
      )}

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-medium shrink-0 transition-all flex items-center gap-1.5 ${
            selectedCategory === 'all'
              ? 'bg-purple-700 text-white shadow-soft-purple border border-purple-400/40'
              : 'bg-[#171328] text-purple-200/70 hover:text-white border border-purple-500/20 hover:border-purple-500/40'
          }`}
        >
          <Boxes className="w-3.5 h-3.5" />
          <span>{t('catalogAll')}</span>
        </button>

        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          const label = cat.id === 'download' 
            ? (lang === 'en' ? '📁 Media Downloader' : '📁 จัดการไฟล์และดาวน์โหลด')
            : cat.id === 'automation'
              ? (lang === 'en' ? '🤖 Automation Bots' : '🤖 การตลาด & บอทอัตโนมัติ')
              : cat.name;

          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium shrink-0 transition-all flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-purple-700 text-white shadow-soft-purple border border-purple-400/40'
                  : 'bg-[#171328] text-purple-200/70 hover:text-white border border-purple-500/20 hover:border-purple-500/40'
              }`}
            >
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* Product Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filtered.map((prod, index) => (
            <ProductCard
              key={prod.id}
              product={prod}
              index={index}
              isVisible={isVisible}
              onSelectProduct={onSelectProduct}
              onQuickBuy={onQuickBuy}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl soft-card p-12 text-center my-6 flex flex-col items-center justify-center">
          <SearchX className="w-10 h-10 text-purple-300/40 mb-3" />
          <h3 className="text-base font-semibold text-white">{t('catalogNotFound')}</h3>
          <p className="text-xs text-purple-200/60 mt-1 max-w-sm">
            {t('catalogNotFoundSub')}
          </p>
          {(searchTerm || selectedCategory !== 'all') && (
            <button
              onClick={() => { setSearchTerm(''); setSelectedCategory('all'); }}
              className="mt-4 px-4 py-1.5 rounded-xl bg-purple-900/40 hover:bg-purple-800/40 text-purple-200 text-xs font-medium border border-purple-400/30 transition-colors"
            >
              {lang === 'th' ? 'ล้างการค้นหาทั้งหมด' : 'Clear all filters'}
            </button>
          )}
        </div>
      )}

    </section>
  );
}
