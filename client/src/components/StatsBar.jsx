import React, { useState, useEffect, useRef } from 'react';
import { Package, TrendingUp, Users, CheckCircle2, Sparkles } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function StatsBar({ stats }) {
  const { t, lang } = useLanguage();
  const containerRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

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

  const itemsSuffix = lang === 'th' ? 'รายการ' : 'items';
  const ordersSuffix = lang === 'th' ? 'ครั้ง' : 'orders';

  const data = [
    {
      id: "items",
      icon: <Package className="w-5 h-5 text-purple-300 group-hover:text-white transition-colors" />,
      value: `${stats?.itemsAvailable ?? 2} ${itemsSuffix}`,
      label: t('statItemsAvailable'),
      color: "from-purple-500/30 to-indigo-500/20"
    },
    {
      id: "sales",
      icon: <TrendingUp className="w-5 h-5 text-purple-300 group-hover:text-white transition-colors" />,
      value: `${t('currency')} ${(stats?.totalSalesBath ?? 11150).toLocaleString()}`,
      label: t('statTotalSales'),
      color: "from-indigo-500/30 to-purple-500/20"
    },
    {
      id: "members",
      icon: <Users className="w-5 h-5 text-purple-300 group-hover:text-white transition-colors" />,
      value: `${(stats?.totalMembers ?? 100).toLocaleString()}`,
      label: t('statTotalMembers'),
      color: "from-violet-500/30 to-pink-500/20"
    },
    {
      id: "delivered",
      icon: <CheckCircle2 className="w-5 h-5 text-purple-300 group-hover:text-white transition-colors" />,
      value: `${(stats?.totalSold ?? 65).toLocaleString()} ${ordersSuffix}`,
      label: t('statTotalSold'),
      color: "from-emerald-500/30 to-purple-500/20"
    }
  ];

  return (
    <div ref={containerRef} className="w-full my-6 sm:my-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
        {data.map((item, index) => {
          const delayStyle = {
            transitionDelay: `${index * 100}ms`
          };

          return (
            <div
              key={item.id}
              style={delayStyle}
              className={`p-4 sm:p-5 rounded-2xl bg-[#140f24]/80 border border-purple-500/20 hover:border-purple-400/40 shadow-soft-purple transition-all duration-500 transform ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6 pointer-events-none'
              } flex items-center gap-3.5 group hover:bg-[#19132c]`}
            >
              <div className={`p-3 rounded-xl bg-gradient-to-br ${item.color} border border-purple-500/30 group-hover:scale-105 transition-transform duration-300`}>
                {item.icon}
              </div>
              <div className="flex flex-col">
                <span className="text-base sm:text-xl font-bold text-white tracking-tight group-hover:text-purple-200 transition-colors">
                  {item.value}
                </span>
                <span className="text-[11px] sm:text-xs font-medium text-purple-300/70 -mt-0.5">
                  {item.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
