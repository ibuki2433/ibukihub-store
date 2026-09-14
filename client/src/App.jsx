import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import Navbar from './components/Navbar';
import CloudHero from './components/CloudHero';
import BannerSlider from './components/BannerSlider';
import QuickActions from './components/QuickActions';
import StatsBar from './components/StatsBar';
import ProductCatalog from './components/ProductCatalog';
import ProductModal from './components/ProductModal';
import BuyModal from './components/BuyModal';
import TopupModal from './components/TopupModal';
import TopupPage from './components/TopupPage';
import AuthPage from './components/AuthPage';
import MyLibraryModal from './components/MyLibraryModal';
import AdminDashboard from './components/AdminDashboard';
import AdminFloatingHUD from './components/AdminFloatingHUD';
import Footer from './components/Footer';
import AmbientFloatingIcons from './components/AmbientFloatingIcons';
import { Bell } from 'lucide-react';

function StoreMain() {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const [currentPage, setCurrentPage] = useState('shop'); // 'shop', 'signin', 'signup'
  const [products, setProducts] = useState([]);
  const categories = [
    { id: "download", name: t('navDownloadCategory') }
  ];
  const [settings, setSettings] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Auth Redirection & Notices
  const [redirectAfterAuth, setRedirectAfterAuth] = useState(null);
  const [authNotice, setAuthNotice] = useState('');

  // Modals state
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [buyProduct, setBuyProduct] = useState(null);
  const [isTopupOpen, setIsTopupOpen] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchSettings();

    const handleHash = () => {
      const hash = window.location.hash;
      if (hash === '#topup') {
        if (!user) {
          setRedirectAfterAuth('topup');
          setAuthNotice('กรุณาเข้าสู่ระบบก่อน เพื่อดำเนินการเติมเงินเข้าบัญชีของคุณ');
          setCurrentPage('signin');
          window.location.hash = 'signin';
        } else {
          setCurrentPage('topup');
        }
      } else if (hash === '#signin' || hash === '#signup') {
        if (user) {
          setCurrentPage('shop');
          if (window.location.hash) {
            window.location.hash = '';
          }
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          setCurrentPage(hash === '#signup' ? 'signup' : 'signin');
        }
      } else if (hash === '#forgot') {
        setCurrentPage('forgot');
      } else if (hash.startsWith('#reset')) {
        setCurrentPage('reset');
      } else if (!hash || hash === '#' || hash === '#catalog') {
        setCurrentPage('shop');
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [user]);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      if (res.ok) {
        setProducts(data.products || []);
      }
    } catch (err) {
      console.error("Fetch products error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (res.ok && data.settings) {
        setSettings(data.settings);
        setStats(data.settings.stats);
      }
    } catch (err) {
      console.error("Fetch settings error:", err);
    }
  };

  const handleSelectProductById = (id) => {
    const p = products.find(prod => prod.id === id || (id.startsWith('prod_ibuki') && prod.id.startsWith('prod_ibuki')));
    if (p) setSelectedProduct(p);
  };

  const handleQuickBuy = (product) => {
    setBuyProduct(product);
  };

  const handleOpenTopup = () => {
    if (!user) {
      setRedirectAfterAuth('topup');
      setAuthNotice('กรุณาเข้าสู่ระบบก่อน เพื่อดำเนินการเติมเงินเข้าบัญชีของคุณ');
      handleOpenAuth('signin');
      return;
    }
    setCurrentPage('topup');
    window.location.hash = 'topup';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToShop = () => {
    setAuthNotice('');
    setRedirectAfterAuth(null);
    setCurrentPage('shop');
    window.location.hash = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenAuth = (mode = 'signin') => {
    if (user) {
      setCurrentPage('shop');
      window.location.hash = '';
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (mode !== 'signin' && !redirectAfterAuth) {
      setAuthNotice('');
    }
    const targetPage = mode === 'register' ? 'signup' : 'signin';
    setCurrentPage(targetPage);
    window.location.hash = targetPage;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenAdmin = () => {
    if (!user) {
      handleOpenAuth('signin');
      return;
    }
    if (user.role !== 'admin') {
      alert("บัญชีของคุณไม่ใช่ Admin! สิทธิ์นี้เฉพาะผู้ดูแลระบบ (Admin) เท่านั้น");
      return;
    }
    setIsAdminOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between selection:bg-purple-600 selection:text-white">
      
      {/* Announcement Marquee Bar */}
      <div className="bg-[#120e24] text-purple-200 text-xs py-1.5 px-4 border-b border-purple-900/30 overflow-hidden flex items-center gap-2">
        <div className="flex items-center gap-1 font-semibold text-purple-300 shrink-0">
          <Bell className="w-3.5 h-3.5 text-purple-400" />
          <span className="hidden sm:inline">{t('announcementPrefix')}</span>
        </div>
        <div className="whitespace-nowrap overflow-hidden text-ellipsis flex-1">
          <span className="font-normal text-purple-200/80">
            {lang === 'en' ? t('announcementText') : (settings?.announcement || t('announcementText'))}
          </span>
        </div>
      </div>

      {/* Top Navbar */}
      <Navbar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onOpenAuth={handleOpenAuth}
        onOpenTopup={handleOpenTopup}
        onOpenLibrary={() => setIsLibraryOpen(true)}
        onOpenAdmin={handleOpenAdmin}
        categories={categories}
        selectedCategory={selectedCategory}
        setSelectedCategory={(catId) => {
          setSelectedCategory(catId);
          if (currentPage !== 'shop') setCurrentPage('shop');
        }}
        onLogoClick={handleBackToShop}
        onSearchSubmit={() => {
          if (currentPage !== 'shop') setCurrentPage('shop');
        }}
        currentPage={currentPage}
      />

      {/* Main Content: Switches between Shop, Topup, and dedicated AuthPage (Signin / Signup) */}
      {currentPage === 'shop' ? (
        <div className="w-full flex-1 flex flex-col relative">
          {/* Ambient subtle floating cyber icons in the background */}
          <AmbientFloatingIcons />
          
          {/* 3D Interactive Fullscreen Cloud Hero Section (Edge-to-Edge) */}
          <CloudHero
            products={products}
            onSelectProduct={handleSelectProductById}
            onOpenQuickBuy={(prod) => {
              if (prod) handleQuickBuy(prod);
            }}
          />

          {/* Main Content Sections Below Fullscreen Hero */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1 mt-6 sm:mt-10">
            {/* 4 Quick Action Cards */}
            <QuickActions
              onNavigateToCatalog={(catId) => {
                setSelectedCategory(catId);
                const el = document.getElementById('catalog');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              onOpenTopup={handleOpenTopup}
              onOpenAuth={handleOpenAuth}
              onOpenLibrary={() => setIsLibraryOpen(true)}
            />

            {/* 4 Stats Boxes */}
            <StatsBar stats={stats} />

            {/* Products Showcase Catalog */}
            <ProductCatalog
              products={products}
              categories={categories}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              onSelectProduct={(product) => setSelectedProduct(product)}
              onQuickBuy={handleQuickBuy}
            />
          </main>
        </div>
      ) : currentPage === 'topup' ? (
        !user ? (
          <main className="flex-1 w-full">
            <AuthPage
              key={currentPage}
              initialView="signin"
              onBackToHome={() => {
                setAuthNotice('');
                setRedirectAfterAuth(null);
                setCurrentPage('shop');
                window.location.hash = '';
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onSuccess={() => {
                setAuthNotice('');
                setRedirectAfterAuth(null);
                setCurrentPage('topup');
                window.location.hash = 'topup';
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              noticeMessage={authNotice || t('authTopupNotice')}
            />
          </main>
        ) : (
          <main className="flex-1 w-full flex flex-col">
            <TopupPage
              onBackToShop={handleBackToShop}
              onOpenAuth={handleOpenAuth}
            />
          </main>
        )
      ) : (
        <main className="flex-1 w-full">
          <AuthPage
            key={currentPage}
            initialView={currentPage}
            onBackToHome={() => {
              setAuthNotice('');
              setRedirectAfterAuth(null);
              setCurrentPage('shop');
              window.location.hash = '';
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onSuccess={() => {
              if (redirectAfterAuth) {
                const target = redirectAfterAuth;
                setRedirectAfterAuth(null);
                setAuthNotice('');
                setCurrentPage(target);
                window.location.hash = target;
                window.scrollTo({ top: 0, behavior: 'smooth' });
              } else {
                setAuthNotice('');
                setRedirectAfterAuth(null);
                setCurrentPage('shop');
                window.location.hash = '';
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            noticeMessage={authNotice}
          />
        </main>
      )}

      {/* Footer */}
      <Footer
        onOpenAdmin={handleOpenAdmin}
        onOpenAuth={handleOpenAuth}
      />

      {/* MODALS */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onBuy={(p, planId) => setBuyProduct({ ...p, selectedPlanId: planId })}
        />
      )}

      {buyProduct && (
        <BuyModal
          product={buyProduct}
          initialPlanId={buyProduct.selectedPlanId}
          onClose={() => setBuyProduct(null)}
          onOpenTopup={() => { setBuyProduct(null); handleOpenTopup(); }}
          onOpenAuth={handleOpenAuth}
          onOpenLibrary={() => { setBuyProduct(null); setIsLibraryOpen(true); }}
          onPurchaseComplete={() => {
            fetchProducts();
            fetchSettings();
          }}
        />
      )}

      {isTopupOpen && (
        <TopupModal
          onClose={() => setIsTopupOpen(false)}
          onOpenAuth={handleOpenAuth}
        />
      )}

      {isLibraryOpen && (
        <MyLibraryModal
          onClose={() => setIsLibraryOpen(false)}
          onOpenShop={() => {
            setIsLibraryOpen(false);
            if (currentPage !== 'shop') setCurrentPage('shop');
            const el = document.getElementById('catalog');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        />
      )}

      {isAdminOpen && (
        <AdminDashboard
          onClose={() => setIsAdminOpen(false)}
          onProductUpdated={() => {
            fetchProducts();
            fetchSettings();
          }}
        />
      )}

      {/* Special Draggable Admin Controller UI (Floating / Movable) */}
      {user && user.role === 'admin' && (
        <AdminFloatingHUD
          onOpenFullDashboard={() => setIsAdminOpen(true)}
        />
      )}

    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <StoreMain />
      </AuthProvider>
    </LanguageProvider>
  );
}
