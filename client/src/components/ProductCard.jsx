import React from 'react';
import { ShoppingBag, Eye, CheckCircle2, HardDrive } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function ProductCard({ product, onSelectProduct, onQuickBuy, index = 0, isVisible = true }) {
  const { t, lang } = useLanguage();
  const isIbuki = product.id.startsWith('prod_ibuki');

  const getBadge = () => {
    if (product.id === 'prod_ibuki_25') return t('prod25_badge');
    if (product.id === 'prod_ibuki_22') return t('prod22_badge');
    return product.badge;
  };

  const getShortDesc = () => {
    if (product.id === 'prod_ibuki_25') return t('prod25_shortDesc');
    if (product.id === 'prod_ibuki_22') return t('prod22_shortDesc');
    return product.shortDesc || product.description;
  };

  const getFeatures = () => {
    if (product.id === 'prod_ibuki_25') {
      return [t('prod25_feat1'), t('prod25_feat2')];
    }
    if (product.id === 'prod_ibuki_22') {
      return [t('prod22_feat1'), t('prod22_feat2')];
    }
    return product.features?.slice(0, 2) || [];
  };

  return (
    <div 
      style={{ transitionDelay: `${(index % 6) * 90}ms` }}
      className={`rounded-2xl soft-card card-shimmer overflow-hidden flex flex-col group transform transition-all duration-700 ease-out hover:-translate-y-2 hover:shadow-[0_15px_35px_rgba(139,92,246,0.25)] hover:border-purple-400/60 ${
        isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-12 scale-95 pointer-events-none'
      } ${isIbuki ? 'border-purple-400/50 shadow-soft-purple ring-1 ring-purple-400/30' : ''}`}
    >
      
      {/* Product Image & Badges */}
      <div className="relative h-44 sm:h-48 w-full overflow-hidden bg-black/40">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500 filter brightness-95 group-hover:brightness-105"
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-[#141020] via-transparent to-transparent opacity-90" />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5 z-10">
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-purple-900/80 text-purple-200 border border-purple-400/40 backdrop-blur-md">
            {getBadge()}
          </span>
          {product.version && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-black/70 text-gray-300 border border-neutral-700 backdrop-blur-md">
              {product.version}
            </span>
          )}
        </div>

        {/* File Size */}
        <div className="absolute bottom-2 right-2.5 z-10 flex items-center gap-1 text-[11px] font-medium text-purple-200/90 bg-[#161224]/80 px-2.5 py-0.5 rounded-md border border-purple-500/20 backdrop-blur-md">
          <HardDrive className="w-3 h-3 text-purple-400" />
          <span>{product.fileSize || "Ready"}</span>
        </div>

      </div>

      {/* Content Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        
        <div>
          {/* Title */}
          <h4 
            onClick={() => onSelectProduct(product)}
            className="text-sm sm:text-base font-bold text-white group-hover:text-purple-300 transition-colors line-clamp-1 cursor-pointer tracking-tight"
            title={product.name}
          >
            {product.name}
          </h4>

          {/* Short Description */}
          <p className="text-xs text-purple-200/65 mt-1 line-clamp-2 leading-relaxed">
            {getShortDesc()}
          </p>

          {/* Key Features */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {getFeatures().map((feat, i) => (
              <span key={i} className="inline-flex items-center gap-1 text-[10px] text-purple-200/80 bg-purple-950/40 px-2 py-0.5 rounded border border-purple-500/15">
                <CheckCircle2 className="w-2.5 h-2.5 text-purple-400 shrink-0" />
                <span className="line-clamp-1">{feat}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Price & Action */}
        <div className="mt-4 pt-3 border-t border-purple-900/20">
          
          <div className="flex items-baseline justify-between mb-3">
            <div className="flex flex-col">
              <div className="flex items-baseline gap-2">
                {product.plans && product.plans.length > 0 ? (
                  <span className="text-xl font-bold text-purple-200 flex items-baseline gap-1">
                    <span className="text-xs font-normal text-purple-300/70">{lang === 'th' ? 'เริ่มต้น' : 'From'}</span>
                    <span>{t('currency')} {Math.min(...product.plans.map(p => p.price)).toLocaleString()}</span>
                  </span>
                ) : (
                  <span className="text-xl font-bold text-purple-200">
                    {t('currency')} {product.price.toLocaleString()}
                  </span>
                )}
                {product.originalPrice && (
                  <span className="text-xs text-purple-300/40 line-through">
                    {t('currency')} {product.originalPrice.toLocaleString()}
                  </span>
                )}
              </div>
              {product.plans && product.plans.length > 0 && (
                <span className="text-[10px] text-amber-300/90 font-medium mt-0.5">
                  ⚡ {lang === 'th' ? 'มีให้เลือก 5 แพ็กเกจ (เช่า & ถาวร)' : '5 Plans (Rent & Lifetime)'}
                </span>
              )}
            </div>

            <div className="text-[11px] font-medium text-emerald-400/90 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>
                {lang === 'th' 
                  ? (product.unlimitedStock || product.stock === 'ไม่จำกัด' || typeof product.stock === 'string' || product.id?.startsWith('prod_ibuki')
                      ? 'สต็อก ไม่จำกัด' 
                      : `สต็อก ${product.stock ?? 50} ชิ้น`)
                  : (product.unlimitedStock || product.stock === 'ไม่จำกัด' || typeof product.stock === 'string' || product.id?.startsWith('prod_ibuki')
                      ? 'Unlimited Stock' 
                      : `In Stock (${product.stock ?? 50})`)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onSelectProduct(product)}
              className="px-3 py-2 rounded-xl bg-[#1d1830] hover:bg-[#261f40] text-purple-200 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors border border-purple-500/20"
            >
              <Eye className="w-3.5 h-3.5 text-purple-400" />
              <span>{t('cardBtnDetails')}</span>
            </button>

            <button
              onClick={() => onQuickBuy(product)}
              className="px-3 py-2 rounded-xl bg-purple-700 hover:bg-purple-600 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-soft-purple transition-all active:scale-95"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>{t('cardBtnBuy')}</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
