import React, { useState, useEffect } from 'react';
import { 
  X, LayoutDashboard, PackagePlus, Key, ShoppingCart, 
  Wallet, Settings, Trash2, Plus, Minus, Upload, CheckCircle2, 
  AlertCircle, HardDrive, Terminal, Users, Phone, Mail, 
  Eye, EyeOff, Edit3, ChevronRight, Smartphone, Send, ShieldCheck, Download,
  Gift, Tag, Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboard({ onClose, onProductUpdated }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [topups, setTopups] = useState([]);
  const [members, setMembers] = useState([]);
  const [promoCodes, setPromoCodes] = useState([]);
  const [redeemHistory, setRedeemHistory] = useState([]);
  const [newPromoForm, setNewPromoForm] = useState({
    code: '',
    rewardAmount: 100,
    description: '',
    maxUses: 999999
  });
  const [creatingPromo, setCreatingPromo] = useState(false);
  const [revealedPasswords, setRevealedPasswords] = useState({});
  const [editingBalanceUser, setEditingBalanceUser] = useState(null);
  const [newBalanceInput, setNewBalanceInput] = useState('');
  const [selectedMemberForOrders, setSelectedMemberForOrders] = useState(null);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);

  // New Product form state
  const [newProd, setNewProd] = useState({
    name: '',
    category: 'download',
    price: '',
    originalPrice: '',
    version: 'v1.0',
    badge: 'มาใหม่',
    shortDesc: '',
    description: '',
    features: '',
    systemRequirements: 'Windows 10 / 11 (64-bit)',
    fileName: 'software_package.zip',
    fileSize: '50 MB',
    imageUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&auto=format&fit=crop&q=80',
    stock: 50
  });

  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [selectedProdForKeys, setSelectedProdForKeys] = useState('');
  const [batchKeysText, setBatchKeysText] = useState('');

  const [settingsData, setSettingsData] = useState({
    storeName: '',
    announcement: '',
    discordUrl: '',
    lineUrl: ''
  });

  // Email (Brevo API / Gmail SMTP) Gateway state
  const [emailConfig, setEmailConfig] = useState({
    enabled: false,
    provider: 'brevo',
    brevoApiKey: '',
    fromEmail: 'gqkpm2003@gmail.com',
    user: '',
    pass: '',
    fromName: 'IbukiHub Store',
    host: 'smtp.gmail.com',
    port: 465,
    hasBrevoKey: false,
    maskedBrevoKey: '',
    hasPass: false,
    maskedPass: ''
  });
  const [brevoKeyInput, setBrevoKeyInput] = useState('');
  const [emailPassInput, setEmailPassInput] = useState('');
  const [testEmail, setTestEmail] = useState('');
  const [testingEmail, setTestingEmail] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState(null);
  const [savingEmail, setSavingEmail] = useState(false);

  // Member Balance Adjustment Modal
  const [balanceModal, setBalanceModal] = useState({
    isOpen: false,
    member: null,
    mode: 'add', // 'add', 'deduct', 'set'
    amount: '',
    note: ''
  });
  const [submittingBalance, setSubmittingBalance] = useState(false);

  useEffect(() => {
    fetchAllAdminData(false);
    const interval = setInterval(() => {
      fetchAllAdminData(true);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const fetchAllAdminData = async (silent = false) => {
    if (!user || user.role !== 'admin') return;
    if (!silent) setLoading(true);
    try {
      const timestamp = Date.now();
      const noCacheOpts = { headers: { 'x-user-id': user.id, 'Cache-Control': 'no-cache' }, cache: 'no-store' };

      const resStats = await fetch(`/api/admin/stats?_t=${timestamp}`, noCacheOpts);
      const dataStats = await resStats.json();
      if (resStats.ok) setStats(dataStats);

      const resProd = await fetch(`/api/products?_t=${timestamp}`, { cache: 'no-store' });
      const dataProd = await resProd.json();
      if (resProd.ok) {
        setProducts(dataProd.products || []);
        if (dataProd.products?.length > 0 && !selectedProdForKeys) {
          setSelectedProdForKeys(dataProd.products[0].id);
        }
      }

      const resOrders = await fetch(`/api/admin/orders?_t=${timestamp}`, noCacheOpts);
      const dataOrders = await resOrders.json();
      if (resOrders.ok) setOrders(dataOrders.orders || []);

      const resTopups = await fetch(`/api/admin/topups?_t=${timestamp}`, noCacheOpts);
      const dataTopups = await resTopups.json();
      if (resTopups.ok) setTopups(dataTopups.topups || []);

      const resMembers = await fetch(`/api/admin/members?_t=${timestamp}`, noCacheOpts);
      const dataMembers = await resMembers.json();
      if (resMembers.ok) setMembers(dataMembers.members || []);

      const resSet = await fetch(`/api/settings?_t=${timestamp}`, { cache: 'no-store' });
      const dataSet = await resSet.json();
      if (resSet.ok && dataSet.settings) {
        setSettingsData({
          storeName: dataSet.settings.storeName || '',
          announcement: dataSet.settings.announcement || '',
          discordUrl: dataSet.settings.discordUrl || '',
          lineUrl: dataSet.settings.lineUrl || ''
        });
      }

      const resEmail = await fetch(`/api/admin/email-config?_t=${timestamp}`, noCacheOpts);
      const dataEmail = await resEmail.json();
      if (resEmail.ok && dataEmail.config) {
        setEmailConfig(dataEmail.config);
      }

      const resPromos = await fetch(`/api/admin/promo-codes?_t=${timestamp}`, noCacheOpts);
      const dataPromos = await resPromos.json();
      if (resPromos.ok) {
        setPromoCodes(dataPromos.promoCodes || []);
        setRedeemHistory(dataPromos.history || []);
      }

    } catch (e) {
      if (!silent) {
        console.error(e);
        setErr("โหลดข้อมูลไม่สำเร็จ: " + e.message);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleFileUpload = async () => {
    if (!uploadFile) return;
    setUploading(true);
    setErr(null);
    try {
      const formData = new FormData();
      formData.append('softwareFile', uploadFile);

      const res = await fetch('/api/admin/upload-file', {
        method: 'POST',
        headers: { 'x-user-id': user.id },
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setNewProd(prev => ({
        ...prev,
        fileName: data.fileName,
        fileSize: data.fileSize
      }));
      setMsg(`อัปโหลดไฟล์สำเร็จ: ${data.fileName} (${data.fileSize})`);
    } catch (e) {
      setErr("อัปโหลดไฟล์ไม่สำเร็จ: " + e.message);
    } finally {
      setUploading(false);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id
        },
        body: JSON.stringify(newProd)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMsg(`เพิ่มซอฟต์แวร์ "${data.product.name}" สำเร็จเรียบร้อย`);
      setNewProd({
        name: '',
        category: 'download',
        price: '',
        originalPrice: '',
        version: 'v1.0',
        badge: 'มาใหม่',
        shortDesc: '',
        description: '',
        features: '',
        systemRequirements: 'Windows 10 / 11 (64-bit)',
        fileName: 'software_package.zip',
        fileSize: '50 MB',
        imageUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&auto=format&fit=crop&q=80',
        stock: 50
      });
      fetchAllAdminData();
      if (onProductUpdated) onProductUpdated();
    } catch (e) {
      setErr(e.message);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("คุณต้องการลบซอฟต์แวร์นี้หรือไม่?")) return;
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
        headers: { 'x-user-id': user.id }
      });
      if (res.ok) {
        setMsg("ลบซอฟต์แวร์เรียบร้อยแล้ว");
        fetchAllAdminData();
        if (onProductUpdated) onProductUpdated();
      }
    } catch (e) {
      setErr(e.message);
    }
  };

  const handleAddKeys = async (e) => {
    e.preventDefault();
    if (!selectedProdForKeys) return;
    const keysArray = batchKeysText.split('\n').map(k => k.trim()).filter(Boolean);
    if (keysArray.length === 0) {
      setErr("กรุณากรอกคีย์อย่างน้อย 1 แถว");
      return;
    }

    try {
      const res = await fetch(`/api/admin/products/${selectedProdForKeys}/keys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id
        },
        body: JSON.stringify({ keys: keysArray })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMsg(data.message);
      setBatchKeysText('');
      fetchAllAdminData();
      if (onProductUpdated) onProductUpdated();
    } catch (e) {
      setErr(e.message);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id
        },
        body: JSON.stringify(settingsData)
      });
      const data = await res.json();
      if (res.ok) {
        setMsg("บันทึกการตั้งค่าร้านค้าเรียบร้อย");
      }
    } catch (e) {
      setErr(e.message);
    }
  };

  const handleSaveEmailConfig = async (e) => {
    e.preventDefault();
    setSavingEmail(true);
    setErr(null);
    setMsg(null);
    try {
      const payload = {
        enabled: emailConfig.enabled,
        provider: emailConfig.provider,
        user: emailConfig.user,
        fromEmail: emailConfig.fromEmail,
        fromName: emailConfig.fromName,
        host: emailConfig.host,
        port: emailConfig.port,
      };
      if (brevoKeyInput.trim()) {
        payload.brevoApiKey = brevoKeyInput.trim();
      }
      if (emailPassInput.trim()) {
        payload.pass = emailPassInput.trim();
      }
      const res = await fetch('/api/admin/email-config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMsg(data.message || "บันทึกการตั้งค่าระบบส่งอีเมลเรียบร้อยแล้ว");
      if (data.config) {
        setEmailConfig(data.config);
      }
      setBrevoKeyInput('');
      setEmailPassInput('');
    } catch (e) {
      setErr("บันทึกการตั้งค่า Email ไม่สำเร็จ: " + e.message);
    } finally {
      setSavingEmail(false);
    }
  };

  const handleTestEmail = async (e) => {
    if (e) e.preventDefault();
    if (!testEmail || !testEmail.trim()) {
      setErr("กรุณากรอกอีเมลสำหรับทดสอบส่ง");
      return;
    }
    setTestingEmail(true);
    setTestEmailResult(null);
    setErr(null);
    setMsg(null);
    try {
      const res = await fetch('/api/admin/email-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id
        },
        body: JSON.stringify({ email: testEmail.trim() }),
        signal: AbortSignal.timeout(20000)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message);
      setTestEmailResult(data);
      if (data.success && data.delivered) {
        setMsg(data.message || `ส่งอีเมลทดสอบไปยัง ${testEmail} สำเร็จ!`);
      } else if (data.success) {
        setMsg(data.message || "ระบบจำลองการส่ง (ส่งลงคอนโซล)");
      } else {
        setErr(`การส่ง Email ไม่สำเร็จ: ${data.message || 'โปรดตรวจสอบข้อมูลบัญชี Gmail และ App Password'}`);
      }
    } catch (e) {
      setErr("ทดสอบส่ง Email ไม่สำเร็จ: " + e.message);
    } finally {
      setTestingEmail(false);
    }
  };

  const handleCreatePromo = async (e) => {
    e.preventDefault();
    setCreatingPromo(true);
    setErr(null);
    setMsg(null);
    try {
      const res = await fetch('/api/admin/promo-codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id
        },
        body: JSON.stringify(newPromoForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "สร้างโค้ดไม่สำเร็จ");
      setMsg(data.message || "สร้างโค้ดสำเร็จ");
      setNewPromoForm({ code: '', rewardAmount: 100, description: '', maxUses: 999999 });
      fetchData(true);
    } catch (e) {
      setErr(e.message);
    } finally {
      setCreatingPromo(false);
    }
  };

  const handleTogglePromo = async (id) => {
    setErr(null);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/promo-codes/${id}/toggle`, {
        method: 'PUT',
        headers: { 'x-user-id': user.id }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "เปลี่ยนสถานะไม่สำเร็จ");
      setMsg(data.message);
      fetchData(true);
    } catch (e) {
      setErr(e.message);
    }
  };

  const handleDeletePromo = async (id, codeName) => {
    if (!confirm(`คุณต้องการลบโค้ด "${codeName}" ใช่หรือไม่?`)) return;
    setErr(null);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/promo-codes/${id}`, {
        method: 'DELETE',
        headers: { 'x-user-id': user.id }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ลบโค้ดไม่สำเร็จ");
      setMsg(data.message);
      fetchData(true);
    } catch (e) {
      setErr(e.message);
    }
  };

  const toggleMemberPassword = (userId) => {
    setRevealedPasswords(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  const openBalanceModal = (member, mode = 'add') => {
    setBalanceModal({
      isOpen: true,
      member,
      mode,
      amount: '',
      note: ''
    });
    setErr(null);
    setMsg(null);
  };

  const handleConfirmBalanceAdjustment = async (e) => {
    if (e) e.preventDefault();
    if (!balanceModal.member) return;
    const num = Number(balanceModal.amount);
    if (isNaN(num) || num <= 0) {
      setErr("กรุณาระบุจำนวนเงินที่มากกว่า 0 บาท");
      return;
    }

    setSubmittingBalance(true);
    setErr(null);
    setMsg(null);
    try {
      const payload = {
        mode: balanceModal.mode,
        amount: num,
        note: balanceModal.note ? balanceModal.note.trim() : ''
      };
      if (balanceModal.mode === 'set') {
        payload.balance = num;
      }
      const res = await fetch(`/api/admin/members/${balanceModal.member.id}/balance`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMsg(data.message || "ปรับยอดเงินเรียบร้อยแล้ว");
      setBalanceModal({ isOpen: false, member: null, mode: 'add', amount: '', note: '' });
      fetchAllAdminData();
    } catch (err) {
      setErr("ปรับยอดเงินไม่สำเร็จ: " + err.message);
    } finally {
      setSubmittingBalance(false);
    }
  };

  const handleSaveMemberBalance = async (memberId) => {
    if (newBalanceInput === '' || isNaN(Number(newBalanceInput))) return;
    try {
      const res = await fetch(`/api/admin/members/${memberId}/balance`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id
        },
        body: JSON.stringify({ balance: Number(newBalanceInput) })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMsg(`อัปเดตยอดเงินของ ${data.user.username} เป็น ฿${data.user.balance} เรียบร้อยแล้ว`);
      setEditingBalanceUser(null);
      fetchAllAdminData();
    } catch (err) {
      setErr(err.message);
    }
  };

  const handleDeleteMember = async (member) => {
    if (member.username === 'ibuki' || member.id === 'usr_admin_ibuki') {
      alert('ไม่สามารถลบบัญชีหลักของร้านได้ (ไอดีแม่ Ibuki)');
      return;
    }
    if (!window.confirm(`ยืนยันการลบสมาชิก "${member.username}" ออกจากระบบหรือไม่?`)) return;
    try {
      const res = await fetch(`/api/admin/members/${member.id}`, {
        method: 'DELETE',
        headers: { 'x-user-id': user.id }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMsg(`ลบสมาชิก "${member.username}" เรียบร้อยแล้ว`);
      fetchAllAdminData();
    } catch (err) {
      setErr(err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      
      <div 
        className="relative w-full max-w-5xl bg-[#141022] border border-purple-400/30 rounded-2xl shadow-2xl overflow-hidden my-4 sm:my-8 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#19142b] border-b border-purple-900/30 p-4 sm:p-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <Terminal className="w-5 h-5 text-purple-400" />
            <div>
              <h3 className="text-base sm:text-lg font-bold">
                แผงควบคุมระบบ (Admin Center)
              </h3>
              <p className="text-xs text-purple-300/70">
                จัดการซอฟต์แวร์ อัปโหลดไฟล์ .zip สต็อก License Keys และยอดจำหน่าย
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-black/50 hover:bg-purple-900/60 text-purple-200 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto border-b border-purple-900/20 bg-[#120e1e] shrink-0 text-xs sm:text-sm">
          {[
            { id: 'overview', label: 'ภาพรวม & สถิติ', icon: LayoutDashboard },
            { id: 'members', label: 'สมาชิก & รหัสผ่าน (Members)', icon: Users },
            { id: 'topups', label: 'ประวัติเติมเงิน', icon: Wallet },
            { id: 'promo_codes', label: 'โค้ดของขวัญ (Gift Codes)', icon: Gift },
            { id: 'orders', label: 'รายการสั่งซื้อ', icon: ShoppingCart },
            { id: 'products', label: 'จัดการซอฟต์แวร์ & อัปโหลด', icon: PackagePlus },
            { id: 'keys', label: 'จัดการ License Keys', icon: Key },
            { id: 'email', label: 'ตั้งค่า Gmail OTP', icon: Mail },
            { id: 'settings', label: 'ตั้งค่าร้านค้า', icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setMsg(null); setErr(null); }}
                className={`flex items-center gap-1.5 px-4 py-3 font-medium border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-purple-400 text-purple-200 bg-purple-900/20 font-semibold'
                    : 'border-transparent text-purple-300/60 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Alerts */}
        <div className="px-5 pt-3 shrink-0">
          {msg && (
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{msg}</span>
            </div>
          )}
          {err && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{err}</span>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="p-4 rounded-xl bg-[#19142b] border border-purple-500/20">
                  <div className="text-xs text-purple-300/70">ยอดจำหน่ายรวม</div>
                  <div className="text-lg sm:text-2xl font-bold text-purple-200 mt-1">
                    ฿ {(stats?.stats?.totalSalesBath || 0).toLocaleString()}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-[#19142b] border border-purple-500/20">
                  <div className="text-xs text-purple-300/70">คำสั่งซื้อสำเร็จ</div>
                  <div className="text-lg sm:text-2xl font-bold text-emerald-400 mt-1">
                    {orders.length} รายการ
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-[#19142b] border border-purple-500/20">
                  <div className="text-xs text-purple-300/70">โปรแกรมในระบบ</div>
                  <div className="text-lg sm:text-2xl font-bold text-purple-300 mt-1">
                    {products.length} รายการ
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-[#19142b] border border-purple-500/20">
                  <div className="text-xs text-purple-300/70">สมาชิกทั้งหมด</div>
                  <div className="text-lg sm:text-2xl font-bold text-blue-300 mt-1">
                    {(stats?.stats?.totalMembers || 0).toLocaleString()} คน
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-500/30 flex items-start gap-3 text-xs text-purple-200/80">
                <HardDrive className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-white text-sm">การเชื่อมต่อไฟล์ซอฟต์แวร์:</span>
                  <p className="mt-1">
                    ไฟล์โปรแกรม <code className="bg-black/60 px-2 py-0.5 rounded text-purple-300 font-mono">IbukiDownload_v2.2_Portable.zip</code> (98.9 MB) พร้อมให้บริการส่งมอบอัตโนมัติแล้ว
                  </p>
                </div>
              </div>

            </div>
          )}

          {/* MEMBERS MANAGEMENT */}
          {activeTab === 'members' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-400" />
                    <span>ข้อมูลสมาชิกทั้งหมด ({members.length} คน)</span>
                  </h4>
                  <p className="text-xs text-purple-300/70 mt-0.5">
                    ตรวจสอบประวัติการสมัคร อีเมล เบอร์โทรศัพท์ รหัสผ่านที่ใช้สมัคร และยอดเงินคงเหลือ
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {members.map((m) => {
                  const isPassRevealed = !!revealedPasswords[m.id];
                  const isEditingBal = editingBalanceUser === m.id;

                  return (
                    <div 
                      key={m.id}
                      className="p-4 rounded-xl bg-[#19142b] border border-purple-500/20 hover:border-purple-400/40 transition-all space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-purple-900/60 border border-purple-400/40 flex items-center justify-center text-sm font-bold text-white overflow-hidden shrink-0">
                            {m.avatar ? (
                              <img src={m.avatar} alt={m.username} className="w-full h-full object-cover" />
                            ) : (
                              <span>{m.username.slice(0, 2).toUpperCase()}</span>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-white">{m.displayName}</span>
                              <span className="text-xs text-purple-300/70">(@{m.username})</span>
                              {m.username === 'ibuki' || m.id === 'usr_admin_ibuki' ? (
                                <span className="text-[10px] bg-gradient-to-r from-amber-500/30 to-purple-500/30 text-amber-300 border border-amber-500/50 px-2.5 py-0.5 rounded-full font-bold shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                                  👑 แอดมินหลัก (ไอดีแม่)
                                </span>
                              ) : m.role === 'admin' ? (
                                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold">
                                  ADMIN
                                </span>
                              ) : null}
                            </div>
                            <div className="text-[11px] text-purple-300/60 mt-0.5">
                              สมัครเมื่อ: {new Date(m.createdAt).toLocaleString('th-TH')}
                            </div>
                          </div>
                        </div>

                        {/* Balance Display & Controls */}
                        <div className="flex items-center gap-2.5 justify-end flex-wrap">
                          <div className="text-right mr-1">
                            <div className="text-[10px] text-neutral-400">ยอดเงินคงเหลือ</div>
                            <div className="text-sm sm:text-base font-mono font-extrabold text-emerald-400">
                              ฿ {Number(m.balance || 0).toLocaleString()}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => openBalanceModal(m, 'add')}
                              className="px-2.5 py-1.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 text-xs font-bold flex items-center gap-1 transition-all shadow-sm active:scale-95"
                              title="เพิ่มเงินให้สมาชิก"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>เพิ่มเงิน</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => openBalanceModal(m, 'deduct')}
                              className="px-2.5 py-1.5 rounded-xl bg-rose-600/30 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 text-xs font-bold flex items-center gap-1 transition-all shadow-sm active:scale-95"
                              title="ลดเงินสมาชิก"
                            >
                              <Minus className="w-3.5 h-3.5" />
                              <span>ลดเงิน</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => openBalanceModal(m, 'set')}
                              className="p-1.5 rounded-xl bg-purple-900/40 hover:bg-purple-800/60 text-purple-300 hover:text-white border border-purple-500/30 transition-all active:scale-95"
                              title="กำหนดยอดเงินตรงๆ"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Detail Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-2.5 border-t border-purple-900/30 text-xs">
                        <div className="flex items-center gap-1.5 text-neutral-300">
                          <span className="text-neutral-400">สมัครด้วย:</span>
                          <span className="font-semibold text-purple-300 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-500/30">
                            {m.registrationMethod}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-neutral-300 truncate">
                          <Mail className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          <span className="text-neutral-400">อีเมล:</span>
                          <span className="font-mono truncate select-all">{m.email}</span>
                        </div>

                        <div className="flex items-center gap-1.5 text-neutral-300">
                          <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="text-neutral-400">เบอร์:</span>
                          <span className="font-mono font-bold text-emerald-400 select-all">{m.phone}</span>
                        </div>

                        {m.machineId && m.machineId !== '-' && (
                          <div className="flex items-center gap-1.5 text-neutral-300">
                            <span className="text-purple-400 font-mono font-bold">🖥️</span>
                            <span className="text-neutral-400">Machine ID:</span>
                            <span className="font-mono font-bold text-purple-300 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-500/30 select-all">
                              {m.machineId}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center gap-1.5 text-neutral-300">
                          <Key className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span className="text-neutral-400">รหัสผ่าน:</span>
                          <span className="font-mono font-bold text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30 select-all">
                            {isPassRevealed ? m.password : '••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleMemberPassword(m.id)}
                            className="p-1 text-neutral-400 hover:text-white"
                            title={isPassRevealed ? "ซ่อนรหัส" : "ดูรหัสผ่าน"}
                          >
                            {isPassRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      {/* Orders summary */}
                      <div className="pt-2 border-t border-purple-900/30 flex items-center justify-between text-xs">
                        <span className="text-purple-300/80">
                          ซื้อแล้ว <strong className="text-white">{m.orderCount}</strong> รายการ (รวม ฿{m.totalSpent.toLocaleString()}) • เติมเงินแล้ว <strong className="text-emerald-400">฿{m.totalToppedUp.toLocaleString()}</strong>
                        </span>

                        {m.username === 'ibuki' || m.id === 'usr_admin_ibuki' ? (
                          <span className="text-xs text-amber-400/90 bg-amber-950/40 border border-amber-500/30 px-2.5 py-1 rounded-lg font-medium">
                            🔒 ไอดีแม่ (ลบไม่ได้)
                          </span>
                        ) : m.role !== 'admin' ? (
                          <button
                            type="button"
                            onClick={() => handleDeleteMember(m)}
                            className="text-xs text-red-400 hover:text-red-300 hover:bg-red-950/40 px-2.5 py-1 rounded-lg transition-colors"
                          >
                            ลบสมาชิก
                          </button>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* PRODUCTS */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              
              <div className="p-5 rounded-2xl bg-[#19142b] border border-purple-500/20">
                <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-purple-400" />
                  <span>เพิ่มซอฟต์แวร์ใหม่เข้าร้านค้า</span>
                </h4>

                <form onSubmit={handleAddProduct} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-purple-200 mb-1">ชื่อโปรแกรม:</label>
                      <input
                        type="text"
                        required
                        placeholder="เช่น Ibuki Tool v3.0"
                        value={newProd.name}
                        onChange={(e) => setNewProd({...newProd, name: e.target.value})}
                        className="w-full bg-[#141022] border border-purple-500/20 rounded-xl px-3 py-2 text-xs sm:text-sm text-purple-100 focus:outline-none focus:border-purple-400/50"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-purple-200 mb-1">หมวดหมู่:</label>
                      <select
                        value={newProd.category}
                        onChange={(e) => setNewProd({...newProd, category: e.target.value})}
                        className="w-full bg-[#141022] border border-purple-500/20 rounded-xl px-3 py-2 text-xs sm:text-sm text-purple-100 focus:outline-none focus:border-purple-400/50"
                      >
                        <option value="download">จัดการไฟล์และดาวน์โหลด</option>
                        <option value="automation">ระบบอัตโนมัติและมาโคร</option>
                        <option value="utility">ยูทิลิตี้และเครื่องมือช่าง</option>
                        <option value="security">ความปลอดภัยและความเป็นส่วนตัว</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-purple-200 mb-1">ราคาขาย (บาท):</label>
                      <input
                        type="number"
                        required
                        min="1"
                        placeholder="150"
                        value={newProd.price}
                        onChange={(e) => setNewProd({...newProd, price: e.target.value})}
                        className="w-full bg-[#141022] border border-purple-500/20 rounded-xl px-3 py-2 text-xs sm:text-sm text-purple-100 focus:outline-none focus:border-purple-400/50"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-purple-200 mb-1">ราคาเดิม (ก่อนลด):</label>
                      <input
                        type="number"
                        placeholder="290"
                        value={newProd.originalPrice}
                        onChange={(e) => setNewProd({...newProd, originalPrice: e.target.value})}
                        className="w-full bg-[#141022] border border-purple-500/20 rounded-xl px-3 py-2 text-xs sm:text-sm text-purple-100 focus:outline-none focus:border-purple-400/50"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-purple-200 mb-1">เวอร์ชัน:</label>
                      <input
                        type="text"
                        placeholder="v2.2 Portable"
                        value={newProd.version}
                        onChange={(e) => setNewProd({...newProd, version: e.target.value})}
                        className="w-full bg-[#141022] border border-purple-500/20 rounded-xl px-3 py-2 text-xs sm:text-sm text-purple-100 focus:outline-none focus:border-purple-400/50"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-purple-200 mb-1">ป้ายกำกับ (Badge):</label>
                      <input
                        type="text"
                        placeholder="แนะนำ หรือ อัปเดตใหม่"
                        value={newProd.badge}
                        onChange={(e) => setNewProd({...newProd, badge: e.target.value})}
                        className="w-full bg-[#141022] border border-purple-500/20 rounded-xl px-3 py-2 text-xs sm:text-sm text-purple-100 focus:outline-none focus:border-purple-400/50"
                      />
                    </div>
                  </div>

                  {/* File upload */}
                  <div className="p-3.5 rounded-xl bg-black/40 border border-purple-500/20 space-y-3">
                    <div className="text-xs font-semibold text-purple-300 flex items-center gap-1.5">
                      <Upload className="w-4 h-4 text-purple-400" />
                      <span>อัปโหลดไฟล์ซอฟต์แวร์ (.zip, .rar, .7z) เข้าเซิร์ฟเวอร์:</span>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      <input
                        type="file"
                        onChange={(e) => setUploadFile(e.target.files[0])}
                        className="text-xs text-purple-200 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-purple-900/60 file:text-purple-100 hover:file:bg-purple-800/60 w-full"
                      />
                      <button
                        type="button"
                        onClick={handleFileUpload}
                        disabled={!uploadFile || uploading}
                        className="px-4 py-1.5 bg-purple-700 hover:bg-purple-600 text-white font-medium text-xs rounded-xl transition-colors shrink-0 disabled:opacity-50"
                      >
                        {uploading ? "กำลังอัปโหลด..." : "อัปโหลดไฟล์นี้"}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-purple-300/70">ชื่อไฟล์ที่จัดเก็บ:</span>
                        <input
                          type="text"
                          value={newProd.fileName}
                          onChange={(e) => setNewProd({...newProd, fileName: e.target.value})}
                          className="w-full bg-[#141022] border border-purple-500/20 rounded-lg px-2.5 py-1 text-xs text-purple-200 font-mono mt-1"
                        />
                      </div>
                      <div>
                        <span className="text-purple-300/70">ขนาดไฟล์:</span>
                        <input
                          type="text"
                          value={newProd.fileSize}
                          onChange={(e) => setNewProd({...newProd, fileSize: e.target.value})}
                          className="w-full bg-[#141022] border border-purple-500/20 rounded-lg px-2.5 py-1 text-xs text-purple-200 mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-purple-200 mb-1">คำอธิบายย่อ:</label>
                    <input
                      type="text"
                      placeholder="อธิบายสั้นๆ เกี่ยวกับซอฟต์แวร์..."
                      value={newProd.shortDesc}
                      onChange={(e) => setNewProd({...newProd, shortDesc: e.target.value})}
                      className="w-full bg-[#141022] border border-purple-500/20 rounded-xl px-3 py-2 text-xs text-purple-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-purple-200 mb-1">รายละเอียดและฟีเจอร์เด่น (บรรทัดละ 1 ข้อ):</label>
                    <textarea
                      rows="3"
                      placeholder="ไม่ต้องติดตั้ง แตกไฟล์ใช้งานได้ทันที&#10;รองรับ Windows 10/11 64-bit&#10;ดึงความเร็วเต็มสปีด"
                      value={newProd.features}
                      onChange={(e) => setNewProd({...newProd, features: e.target.value})}
                      className="w-full bg-[#141022] border border-purple-500/20 rounded-xl px-3 py-2 text-xs text-purple-100"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-purple-700 hover:bg-purple-600 text-white font-semibold text-xs sm:text-sm shadow-soft-purple transition-all"
                  >
                    บันทึกและวางจำหน่ายทันที
                  </button>
                </form>
              </div>

              {/* Existing Products */}
              <div>
                <h4 className="text-xs font-semibold text-purple-300 mb-3 uppercase tracking-wide">รายการซอฟต์แวร์ในระบบ ({products.length}):</h4>
                <div className="space-y-2">
                  {products.map((p) => (
                    <div key={p.id} className="p-3 bg-[#19142b] border border-purple-500/20 rounded-xl flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3">
                        <img src={p.imageUrl} className="w-10 h-10 rounded-lg object-cover" />
                        <div>
                          <div className="font-semibold text-white">{p.name}</div>
                          <div className="text-purple-300/70">{p.version} • ฿ {p.price.toLocaleString()} • ไฟล์: {p.fileName}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setSelectedProdForKeys(p.id); setActiveTab('keys'); }}
                          className="px-2.5 py-1.5 bg-purple-900/40 hover:bg-purple-800/40 text-purple-200 font-medium rounded-lg border border-purple-400/20 transition-colors"
                        >
                          + เพิ่มคีย์
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p.id)}
                          className="p-1.5 bg-red-950/40 hover:bg-red-800/40 text-red-300 rounded-lg transition-colors border border-red-500/20"
                          title="ลบซอฟต์แวร์นี้"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* KEYS */}
          {activeTab === 'keys' && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-[#19142b] border border-purple-500/20 space-y-4">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Key className="w-4 h-4 text-purple-400" />
                  <span>เพิ่ม License Keys สำหรับจัดส่งอัตโนมัติ</span>
                </h4>

                <form onSubmit={handleAddKeys} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-medium text-purple-200 mb-1">เลือกโปรแกรม:</label>
                    <select
                      value={selectedProdForKeys}
                      onChange={(e) => setSelectedProdForKeys(e.target.value)}
                      className="w-full bg-[#141022] border border-purple-500/20 rounded-xl px-3 py-2 text-xs sm:text-sm text-purple-100"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (สต็อกคีย์คงเหลือ: {p.stock || 0})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-purple-200 mb-1">
                      วาง License Keys (บรรทัดละ 1 คีย์):
                    </label>
                    <textarea
                      rows="6"
                      placeholder="IBUKI-V25-XXXX-XXXX-XXXX&#10;IBUKI-V25-YYYY-YYYY-YYYY"
                      value={batchKeysText}
                      onChange={(e) => setBatchKeysText(e.target.value)}
                      className="w-full bg-black/40 border border-purple-500/20 rounded-xl p-3 text-xs font-mono text-purple-200 focus:outline-none focus:border-purple-400/50"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-600 text-white font-medium text-xs sm:text-sm transition-all shadow-soft-purple"
                  >
                    บันทึกคีย์เข้าระบบ
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ORDERS */}
          {activeTab === 'orders' && (
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-purple-300 uppercase tracking-wide">รายการสั่งซื้อทั้งหมด ({orders.length}):</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#100c1e] text-purple-300/70 uppercase text-[10px]">
                    <tr>
                      <th className="p-2.5">รหัสคำสั่งซื้อ</th>
                      <th className="p-2.5">ผู้ซื้อ</th>
                      <th className="p-2.5">ซอฟต์แวร์</th>
                      <th className="p-2.5">แพ็กเกจ</th>
                      <th className="p-2.5">Machine ID</th>
                      <th className="p-2.5">ราคา</th>
                      <th className="p-2.5">License Key</th>
                      <th className="p-2.5">วันหมดอายุ</th>
                      <th className="p-2.5">วันที่สั่งซื้อ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-900/20">
                    {orders.map((o) => (
                      <tr key={o.id} className="hover:bg-purple-900/10">
                        <td className="p-2.5 font-semibold text-purple-300">{o.id}</td>
                        <td className="p-2.5 text-purple-200/80">{o.username || o.userId}</td>
                        <td className="p-2.5 text-white font-medium">{o.productName}</td>
                        <td className="p-2.5">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-900/60 text-purple-200 border border-purple-500/30">
                            {o.planName || (o.isLifetime !== false ? '👑 ตลอดชีพ' : `เช่า ${o.durationDays} วัน`)}
                          </span>
                        </td>
                        <td className="p-2.5 font-mono text-purple-300 font-bold select-all">
                          {o.machineId ? o.machineId : <span className="text-neutral-500 text-[10px] font-normal italic">รอนำไปเปิดใช้งาน</span>}
                        </td>
                        <td className="p-2.5 text-purple-200 font-bold">฿ {o.price.toLocaleString()}</td>
                        <td className="p-2.5 font-mono text-purple-300 select-all">{o.licenseKey || <span className="text-neutral-500">-</span>}</td>
                        <td className="p-2.5 text-amber-300 text-[11px]">
                          {o.expiresAt ? (o.expiresAt === 'LIFETIME' ? '👑 ตลอดชีพ' : new Date(o.expiresAt).toLocaleDateString('th-TH')) : '-'}
                        </td>
                        <td className="p-2.5 text-purple-300/60">{new Date(o.createdAt).toLocaleString('th-TH')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TOPUPS */}
          {activeTab === 'topups' && (
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-purple-300 uppercase tracking-wide">ประวัติการเติมเงิน ({topups.length}):</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#100c1e] text-purple-300/70 uppercase text-[10px]">
                    <tr>
                      <th className="p-2.5">รหัส</th>
                      <th className="p-2.5">ผู้ใช้</th>
                      <th className="p-2.5">ยอดเงิน</th>
                      <th className="p-2.5">ช่องทาง</th>
                      <th className="p-2.5">สถานะ</th>
                      <th className="p-2.5">วันที่</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-900/20">
                    {topups.map((t) => (
                      <tr key={t.id} className="hover:bg-purple-900/10">
                        <td className="p-2.5 font-semibold text-purple-300">{t.id}</td>
                        <td className="p-2.5 text-purple-200/80">{t.username || t.userId}</td>
                        <td className="p-2.5 text-emerald-400 font-semibold">+฿ {t.amount.toLocaleString()}</td>
                        <td className="p-2.5 text-purple-300/70">{t.channel}</td>
                        <td className="p-2.5 text-emerald-400 font-medium">{t.status}</td>
                        <td className="p-2.5 text-purple-300/60">{new Date(t.createdAt).toLocaleString('th-TH')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PROMO CODES / GIFT CODES */}
          {activeTab === 'promo_codes' && (
            <div className="space-y-6">
              
              {/* Header & Stats Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-[#161224] border border-purple-500/20">
                  <span className="text-[11px] text-purple-300/70">โค้ดทั้งหมดในระบบ</span>
                  <div className="text-xl font-bold text-white mt-0.5">{promoCodes.length} โค้ด</div>
                </div>
                <div className="p-3.5 rounded-xl bg-[#161224] border border-purple-500/20">
                  <span className="text-[11px] text-purple-300/70">จำนวนครั้งที่มีการแลก</span>
                  <div className="text-xl font-bold text-amber-300 mt-0.5">{redeemHistory.length} ครั้ง</div>
                </div>
                <div className="p-3.5 rounded-xl bg-[#161224] border border-purple-500/20">
                  <span className="text-[11px] text-purple-300/70">มูลค่าเงินแจกไปทั้งหมด</span>
                  <div className="text-xl font-bold text-emerald-400 mt-0.5">
                    ฿ {redeemHistory.reduce((s, h) => s + (Number(h.rewardAmount) || 0), 0).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Create Promo Code Form */}
              <div className="p-4 rounded-xl bg-[#161224] border border-purple-500/30 space-y-3">
                <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wide flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-amber-400" />
                  <span>สร้างโค้ดของขวัญใหม่ (Create Promo Code)</span>
                </h4>

                <form onSubmit={handleCreatePromo} className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block text-purple-300/80 mb-1 font-semibold">ชื่อโค้ด (Code Name):</label>
                    <input
                      type="text"
                      required
                      placeholder="เช่น BONUS100"
                      value={newPromoForm.code}
                      onChange={(e) => setNewPromoForm({ ...newPromoForm, code: e.target.value })}
                      className="w-full bg-black/40 border border-purple-500/20 rounded-lg px-3 py-2 text-white font-mono uppercase focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-purple-300/80 mb-1 font-semibold">มูลค่าเงินรางวัล (฿):</label>
                    <input
                      type="number"
                      min="1"
                      required
                      placeholder="เช่น 100"
                      value={newPromoForm.rewardAmount}
                      onChange={(e) => setNewPromoForm({ ...newPromoForm, rewardAmount: e.target.value })}
                      className="w-full bg-black/40 border border-purple-500/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-400 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-purple-300/80 mb-1 font-semibold">จำกัดจำนวนสิทธิ์ (ครั้ง):</label>
                    <input
                      type="number"
                      min="1"
                      placeholder="เช่น 100, 999999"
                      value={newPromoForm.maxUses}
                      onChange={(e) => setNewPromoForm({ ...newPromoForm, maxUses: e.target.value })}
                      className="w-full bg-black/40 border border-purple-500/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-400 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-purple-300/80 mb-1 font-semibold">รายละเอียด / โน้ต:</label>
                    <input
                      type="text"
                      placeholder="เช่น โค้ดฉลองเปิดร้านใหม่"
                      value={newPromoForm.description}
                      onChange={(e) => setNewPromoForm({ ...newPromoForm, description: e.target.value })}
                      className="w-full bg-black/40 border border-purple-500/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="sm:col-span-4 flex justify-end">
                    <button
                      type="submit"
                      disabled={creatingPromo || !newPromoForm.code.trim()}
                      className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-md cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{creatingPromo ? "กำลังสร้าง..." : "สร้างโค้ดรับเงิน"}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Promo Codes List Table */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-purple-300 uppercase tracking-wide">
                  รายการโค้ดในระบบ ({promoCodes.length}):
                </h4>
                <div className="overflow-x-auto rounded-xl border border-purple-900/30">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#100c1e] text-purple-300/70 uppercase text-[10px]">
                      <tr>
                        <th className="p-2.5">ชื่อโค้ด</th>
                        <th className="p-2.5">มูลค่า</th>
                        <th className="p-2.5">ใช้ไปแล้ว / สิทธิ์</th>
                        <th className="p-2.5">รายละเอียด</th>
                        <th className="p-2.5">สถานะ</th>
                        <th className="p-2.5 text-right">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-purple-900/20">
                      {promoCodes.map((p) => (
                        <tr key={p.id} className="hover:bg-purple-900/10">
                          <td className="p-2.5 font-bold font-mono text-amber-300">
                            <span className="bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded">
                              {p.code}
                            </span>
                          </td>
                          <td className="p-2.5 text-emerald-400 font-bold font-mono">
                            ฿ {Number(p.rewardAmount).toLocaleString()}
                          </td>
                          <td className="p-2.5 text-purple-200/80 font-mono">
                            {p.usedCount || 0} / {p.maxUses ? p.maxUses.toLocaleString() : 'ไม่จำกัด'}
                          </td>
                          <td className="p-2.5 text-purple-300/70 max-w-xs truncate">
                            {p.description || '-'}
                          </td>
                          <td className="p-2.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              p.active
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                                : 'bg-red-950 text-red-300 border border-red-500/40'
                            }`}>
                              {p.active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                            </span>
                          </td>
                          <td className="p-2.5 text-right space-x-1.5 whitespace-nowrap">
                            <button
                              onClick={() => handleTogglePromo(p.id)}
                              className="px-2 py-1 rounded bg-purple-900/40 hover:bg-purple-800 text-purple-200 text-[11px] font-medium transition-colors cursor-pointer"
                            >
                              {p.active ? 'ปิดชั่วคราว' : 'เปิดใช้งาน'}
                            </button>
                            {p.code.toLowerCase() !== 'ibukich' && (
                              <button
                                onClick={() => handleDeletePromo(p.id, p.code)}
                                className="px-2 py-1 rounded bg-red-950/60 hover:bg-red-900 text-red-300 text-[11px] font-medium transition-colors cursor-pointer"
                              >
                                ลบ
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Redemption History Table */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-semibold text-purple-300 uppercase tracking-wide">
                  ประวัติการแลกโค้ดของสมาชิก ({redeemHistory.length}):
                </h4>
                <div className="overflow-x-auto rounded-xl border border-purple-900/30">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#100c1e] text-purple-300/70 uppercase text-[10px]">
                      <tr>
                        <th className="p-2.5">รหัสรายการ</th>
                        <th className="p-2.5">ผู้ใช้</th>
                        <th className="p-2.5">โค้ดที่ใช้</th>
                        <th className="p-2.5">เงินที่ได้รับ</th>
                        <th className="p-2.5">วันที่แลก</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-purple-900/20">
                      {redeemHistory.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-4 text-center text-purple-300/50">
                            ยังไม่มีประวัติการแลกโค้ด
                          </td>
                        </tr>
                      ) : (
                        redeemHistory.map((h) => (
                          <tr key={h.id} className="hover:bg-purple-900/10">
                            <td className="p-2.5 font-semibold text-purple-300 font-mono">{h.id}</td>
                            <td className="p-2.5 text-white font-medium">{h.username || h.userId}</td>
                            <td className="p-2.5 text-amber-300 font-mono font-bold">{h.code}</td>
                            <td className="p-2.5 text-emerald-400 font-bold font-mono">+฿ {Number(h.rewardAmount).toLocaleString()}</td>
                            <td className="p-2.5 text-purple-300/60">{new Date(h.redeemedAt).toLocaleString('th-TH')}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* EMAIL (BREVO API / GMAIL SMTP) CONFIG & TEST */}
          {activeTab === 'email' && (
            <div className="space-y-6 max-w-2xl">
              <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-500/30 flex items-start gap-3">
                <Mail className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>ตั้งค่าระบบส่งอีเมล OTP (ยืนยันตัวตนสมัครสมาชิก)</span>
                    {emailConfig.enabled ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/50 text-emerald-400">
                        ● เปิดใช้งานจริง
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-950 border border-amber-500/50 text-amber-400">
                        ● โหมดทดสอบ Console
                      </span>
                    )}
                  </h4>
                  <p className="text-xs text-purple-300/80 leading-relaxed">
                    ระบบจะส่งรหัสยืนยันตัวตน (OTP 6 หลัก) ตรงเข้ากล่องจดหมายผู้รับ พร้อมดีไซน์พรีเมียมสีม่วง IbukiHub แนะนำเลือก <strong>Brevo API</strong> เมื่อโฮสต์บน Render เพื่อเลี่ยงการบล็อกพอร์ต
                  </p>
                </div>
              </div>

              <form onSubmit={handleSaveEmailConfig} className="p-5 rounded-2xl bg-[#19142b] border border-purple-500/20 space-y-4">
                <h5 className="text-xs font-bold text-purple-200 uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-purple-400" />
                  <span>ข้อมูลผู้ให้บริการสำหรับส่งอีเมล</span>
                </h5>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-black/40 border border-purple-500/20">
                  <input
                    type="checkbox"
                    id="emailEnabled"
                    checked={emailConfig.enabled}
                    onChange={(e) => setEmailConfig({ ...emailConfig, enabled: e.target.checked })}
                    className="w-4 h-4 rounded border-purple-500/30 text-purple-600 focus:ring-purple-500 focus:ring-offset-0 bg-[#141022]"
                  />
                  <label htmlFor="emailEnabled" className="text-xs font-semibold text-white cursor-pointer select-none">
                    เปิดใช้งานส่งอีเมลจริง (Enable Real Email Delivery)
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-purple-200 mb-1">ผู้ให้บริการ (Provider):</label>
                    <select
                      value={emailConfig.provider || 'brevo'}
                      onChange={(e) => setEmailConfig({ ...emailConfig, provider: e.target.value })}
                      className="w-full bg-[#141022] border border-purple-500/20 rounded-xl px-3 py-2 text-xs text-purple-100 focus:outline-none focus:border-purple-400"
                    >
                      <option value="brevo">🌟 Brevo REST API (ฟรี 300 ฉบับ/วัน - แนะนำที่สุดสำหรับ Render)</option>
                      <option value="gmail">Gmail SMTP (ต้องเปิดเครื่องตัวเอง / VPS)</option>
                      <option value="custom">Custom SMTP Server</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-purple-200 mb-1">ชื่อผู้ส่ง (Sender Name):</label>
                    <input
                      type="text"
                      placeholder="เช่น IbukiHub Store"
                      value={emailConfig.fromName}
                      onChange={(e) => setEmailConfig({ ...emailConfig, fromName: e.target.value })}
                      className="w-full bg-[#141022] border border-purple-500/20 rounded-xl px-3 py-2 text-xs text-purple-100 focus:outline-none focus:border-purple-400"
                    />
                  </div>
                </div>

                {/* BREVO CONFIG FIELDS */}
                {(!emailConfig.provider || emailConfig.provider === 'brevo') && (
                  <div className="space-y-3 pt-2">
                    <div className="p-3.5 rounded-xl bg-purple-900/20 border border-purple-500/20 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-purple-200">💡 วิธีรับ Brevo API Key ฟรี (300 อีเมล/วัน ฟรีตลอดไป):</span>
                        <a 
                          href="https://app.brevo.com/settings/keys/api" 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-purple-400 hover:text-purple-300 underline font-semibold text-[11px]"
                        >
                          เปิดหน้า Brevo API Keys ↗
                        </a>
                      </div>
                      <p className="text-[11px] text-purple-300/70 leading-relaxed">
                        1. ไปที่ Brevo กดโปรไฟล์มุมขวาบน &gt; เลือก <strong>SMTP & API</strong> &gt; แท็บ <strong>API Keys</strong><br/>
                        2. กดปุ่ม <strong>"Generate a new API key"</strong> ตั้งชื่อ แล้วกดคัดลอกรหัสมาวางด้านล่าง
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-purple-200 mb-1 flex items-center justify-between">
                        <span>Brevo API Key:</span>
                        {emailConfig.hasBrevoKey && (
                          <span className="text-[10px] text-emerald-400">
                            ✓ บันทึก Brevo API Key ไว้แล้ว ({emailConfig.maskedBrevoKey})
                          </span>
                        )}
                      </label>
                      <input
                        type="password"
                        placeholder={emailConfig.hasBrevoKey ? "กรอกเฉพาะเมื่อต้องการเปลี่ยนคีย์ใหม่ (ขึ้นต้นด้วย xkeysib-...)" : "วาง Brevo API Key เช่น xkeysib-..."}
                        value={brevoKeyInput}
                        onChange={(e) => setBrevoKeyInput(e.target.value)}
                        className="w-full bg-[#141022] border border-purple-500/20 rounded-xl px-3 py-2 text-xs font-mono text-purple-100 focus:outline-none focus:border-purple-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-purple-200 mb-1">
                        อีเมลผู้ส่ง (Sender Email - ต้องตรงกับอีเมลที่สมัคร Brevo):
                      </label>
                      <input
                        type="email"
                        placeholder="เช่น gqkpm2003@gmail.com"
                        value={emailConfig.fromEmail || ''}
                        onChange={(e) => setEmailConfig({ ...emailConfig, fromEmail: e.target.value })}
                        className="w-full bg-[#141022] border border-purple-500/20 rounded-xl px-3 py-2 text-xs font-mono text-purple-100 focus:outline-none focus:border-purple-400"
                      />
                    </div>
                  </div>
                )}

                {/* GMAIL SMTP FIELDS */}
                {emailConfig.provider === 'gmail' && (
                  <div className="space-y-3 pt-2">
                    <div>
                      <label className="block text-xs font-medium text-purple-200 mb-1">
                        บัญชี Gmail ของร้านค้า (Sender Gmail Address):
                      </label>
                      <input
                        type="email"
                        placeholder="เช่น your-shop@gmail.com"
                        value={emailConfig.user}
                        onChange={(e) => setEmailConfig({ ...emailConfig, user: e.target.value })}
                        className="w-full bg-[#141022] border border-purple-500/20 rounded-xl px-3 py-2 text-xs font-mono text-purple-100 focus:outline-none focus:border-purple-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-purple-200 mb-1 flex items-center justify-between">
                        <span>รหัสผ่านแอป Gmail (App Password 16 หลัก):</span>
                        {emailConfig.hasPass && (
                          <span className="text-[10px] text-emerald-400">
                            ✓ บันทึกรหัสผ่านไว้แล้ว ({emailConfig.maskedPass})
                          </span>
                        )}
                      </label>
                      <input
                        type="password"
                        placeholder={emailConfig.hasPass ? "กรอกเฉพาะเมื่อต้องการเปลี่ยนรหัสผ่านแอปใหม่ (16 หลัก)" : "กรอก Google App Password 16 หลัก เช่น abcd efgh ijkl mnop"}
                        value={emailPassInput}
                        onChange={(e) => setEmailPassInput(e.target.value)}
                        className="w-full bg-[#141022] border border-purple-500/20 rounded-xl px-3 py-2 text-xs font-mono text-purple-100 focus:outline-none focus:border-purple-400"
                      />
                      <p className="text-[10px] text-purple-400/60 mt-1">
                        * หมายเหตุ: หากเว็บโฮสต์อยู่บน Render Free แนะนำให้ใช้ Brevo REST API ด้านบน เนื่องจาก Render บล็อกพอร์ต SMTP ออกภายนอก
                      </p>
                    </div>
                  </div>
                )}

                {/* CUSTOM SMTP FIELDS */}
                {emailConfig.provider === 'custom' && (
                  <div className="space-y-3 pt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-purple-200 mb-1">SMTP Host:</label>
                        <input
                          type="text"
                          placeholder="เช่น smtp.example.com"
                          value={emailConfig.host}
                          onChange={(e) => setEmailConfig({ ...emailConfig, host: e.target.value })}
                          className="w-full bg-[#141022] border border-purple-500/20 rounded-xl px-3 py-2 text-xs font-mono text-purple-100 focus:outline-none focus:border-purple-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-purple-200 mb-1">SMTP Port:</label>
                        <input
                          type="number"
                          placeholder="465 หรือ 587"
                          value={emailConfig.port}
                          onChange={(e) => setEmailConfig({ ...emailConfig, port: e.target.value })}
                          className="w-full bg-[#141022] border border-purple-500/20 rounded-xl px-3 py-2 text-xs font-mono text-purple-100 focus:outline-none focus:border-purple-400"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-purple-200 mb-1">SMTP Username / Email:</label>
                      <input
                        type="text"
                        placeholder="username"
                        value={emailConfig.user}
                        onChange={(e) => setEmailConfig({ ...emailConfig, user: e.target.value })}
                        className="w-full bg-[#141022] border border-purple-500/20 rounded-xl px-3 py-2 text-xs font-mono text-purple-100 focus:outline-none focus:border-purple-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-purple-200 mb-1">SMTP Password:</label>
                      <input
                        type="password"
                        placeholder="password"
                        value={emailPassInput}
                        onChange={(e) => setEmailPassInput(e.target.value)}
                        className="w-full bg-[#141022] border border-purple-500/20 rounded-xl px-3 py-2 text-xs font-mono text-purple-100 focus:outline-none focus:border-purple-400"
                      />
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={savingEmail}
                    className="px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-600 disabled:opacity-50 text-white font-medium text-xs sm:text-sm transition-all shadow-soft-purple"
                  >
                    {savingEmail ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่าระบบส่งอีเมล'}
                  </button>
                </div>
              </form>

              {/* TEST EMAIL DISPATCH */}
              <div className="p-5 rounded-2xl bg-[#19142b] border border-purple-500/20 space-y-3">
                <h5 className="text-xs font-bold text-purple-200 uppercase tracking-wider flex items-center gap-2">
                  <Send className="w-4 h-4 text-purple-400" />
                  <span>ทดสอบส่งอีเมล OTP เข้า Gmail จริง</span>
                </h5>
                <p className="text-xs text-purple-300/70">
                  ทดสอบส่งข้อความ OTP ไปยังอีเมลของคุณเพื่อตรวจสอบว่าการตั้งค่าเชื่อมต่อสำเร็จและอีเมลเข้ากล่องจดหมายจริง
                </p>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="email"
                    placeholder="กรอกอีเมลทดสอบ เช่น your-name@gmail.com"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    className="flex-1 bg-black/40 border border-purple-500/20 rounded-xl px-3 py-2 text-xs font-mono text-purple-100 focus:outline-none focus:border-purple-400"
                  />
                  <button
                    type="button"
                    onClick={handleTestEmail}
                    disabled={testingEmail}
                    className="px-4 py-2 rounded-xl bg-purple-600/60 hover:bg-purple-600 border border-purple-400/30 text-white font-medium text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{testingEmail ? 'กำลังส่ง...' : 'ทดสอบส่งอีเมล'}</span>
                  </button>
                </div>

                {testEmailResult && (
                  <div className={`p-3 rounded-xl text-xs border ${
                    testEmailResult.success 
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' 
                      : 'bg-red-950/40 border-red-500/40 text-red-300'
                  }`}>
                    <div className="font-semibold">{testEmailResult.message}</div>
                    {testEmailResult.details && (
                      <div className="text-[10px] mt-1 font-mono opacity-80">
                        Provider: {testEmailResult.provider} | Status: {testEmailResult.delivered ? 'Delivered to Inbox' : 'Console Simulated'}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* GMAIL APP PASSWORD GUIDE */}
              <div className="p-4 rounded-xl bg-black/30 border border-purple-500/10 space-y-2 text-xs text-purple-300/70">
                <div className="font-bold text-white text-xs flex items-center gap-1.5">
                  <span>💡 วิธีสร้าง "รหัสผ่านสำหรับแอป (App Password)" ของ Gmail ใน 2 นาที:</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 pl-1 text-[11px] leading-relaxed">
                  <li>เปิด Google Account ของคุณที่ <a href="https://myaccount.google.com/security" target="_blank" rel="noreferrer" className="text-purple-300 underline hover:text-purple-200">myaccount.google.com/security</a></li>
                  <li>ตรวจสอบว่าเปิดใช้งาน <strong>"การยืนยันแบบ 2 ขั้นตอน (2-Step Verification)"</strong> แล้ว</li>
                  <li>ค้นหาคำว่า <strong>"รหัสผ่านสำหรับแอป" (App passwords)</strong> ในช่องค้นหาด้านบน หรือไปที่หัวข้อความปลอดภัย</li>
                  <li>ตั้งชื่อแอป เช่น <strong>IbukiHub Store</strong> แล้วกดสร้าง จะได้รหัส 16 ตัวอักษร (เช่น <code className="bg-purple-950/60 px-1 py-0.5 rounded text-purple-200">abcd efgh ijkl mnop</code>)</li>
                  <li>นำรหัส 16 ตัวนั้นมากรอกในช่อง <strong>"รหัสผ่านแอป Gmail"</strong> ด้านบน ติ๊ก <strong>"เปิดใช้งานส่งอีเมลจริง"</strong> แล้วกดบันทึก</li>
                  <li>หากยังไม่ได้ตั้งค่า ระบบจะทำงานในโหมดทดสอบ ปริ้นท์ OTP ลง Console ของ Terminal เซิร์ฟเวอร์ให้ทดสอบได้ทันที</li>
                </ol>
              </div>
            </div>
          )}

          {/* SETTINGS */}
          {activeTab === 'settings' && (
            <form onSubmit={handleSaveSettings} className="space-y-4 max-w-xl">
              <div>
                <label className="block text-xs font-medium text-purple-200 mb-1">ชื่อร้านค้า (Store Name):</label>
                <input
                  type="text"
                  value={settingsData.storeName}
                  onChange={(e) => setSettingsData({...settingsData, storeName: e.target.value})}
                  className="w-full bg-[#141022] border border-purple-500/20 rounded-xl px-3 py-2 text-xs text-purple-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-purple-200 mb-1">ข้อความประกาศแถบด้านบน:</label>
                <textarea
                  rows="2"
                  value={settingsData.announcement}
                  onChange={(e) => setSettingsData({...settingsData, announcement: e.target.value})}
                  className="w-full bg-[#141022] border border-purple-500/20 rounded-xl px-3 py-2 text-xs text-purple-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-purple-200 mb-1">Discord Community:</label>
                <input
                  type="text"
                  value={settingsData.discordUrl}
                  onChange={(e) => setSettingsData({...settingsData, discordUrl: e.target.value})}
                  className="w-full bg-[#141022] border border-purple-500/20 rounded-xl px-3 py-2 text-xs text-purple-100"
                />
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-600 text-white font-medium text-xs sm:text-sm transition-all shadow-soft-purple"
              >
                บันทึกการตั้งค่า
              </button>

              {/* BACKUP & RESTORE DATABASE */}
              <div className="pt-6 mt-6 border-t border-purple-500/20 space-y-3">
                <h5 className="text-xs font-bold text-purple-200 uppercase tracking-wider flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-purple-400" />
                  <span>สำรอง & กู้คืนฐานข้อมูล (Database Backup & Restore)</span>
                </h5>
                <p className="text-xs text-purple-300/70 leading-relaxed">
                  เมื่อเปิดเว็บออนไลน์บน Render หรือเซิร์ฟเวอร์ใดๆ คุณสามารถกดดาวน์โหลดไฟล์สำรองข้อมูล (สมาชิก, ยอดเงิน, คีย์, ประวัติสั่งซื้อ) เก็บไว้ในคอมของคุณได้ตลอดเวลาเพื่อความปลอดภัย 100%
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <a
                    href="/api/admin/backup-db"
                    download
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-900/60 hover:bg-purple-800/80 border border-purple-400/30 text-white font-medium text-xs transition-all shadow-soft-purple"
                  >
                    <Download className="w-4 h-4 text-purple-300" />
                    <span>ดาวน์โหลดไฟล์สำรองฐานข้อมูล (.json)</span>
                  </a>
                </div>
              </div>
            </form>
          )}

        </div>

      </div>

      {/* BALANCE ADJUSTMENT MODAL (เพิ่มเงิน / ลดเงิน / กำหนดยอด) */}
      {balanceModal.isOpen && balanceModal.member && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#171328] border border-purple-500/40 rounded-3xl p-6 shadow-[0_20px_60px_rgba(0,0,0,0.8)] space-y-4">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-purple-500/20">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl ${
                  balanceModal.mode === 'add' 
                    ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/40' 
                    : balanceModal.mode === 'deduct'
                      ? 'bg-rose-950/80 text-rose-400 border border-rose-500/40'
                      : 'bg-purple-950/80 text-purple-300 border border-purple-500/40'
                }`}>
                  {balanceModal.mode === 'add' ? <Plus className="w-5 h-5" /> : balanceModal.mode === 'deduct' ? <Minus className="w-5 h-5" /> : <Edit3 className="w-5 h-5" />}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">
                    {balanceModal.mode === 'add' 
                      ? 'เพิ่มเงินให้สมาชิก (+)' 
                      : balanceModal.mode === 'deduct' 
                        ? 'ลดเงิน / หักเงินสมาชิก (-)' 
                        : 'กำหนดยอดเงินสมาชิก (Set)'}
                  </h4>
                  <p className="text-xs text-purple-300/70">
                    ผู้ใช้: <strong className="text-white">{balanceModal.member.username}</strong> ({balanceModal.member.displayName || balanceModal.member.email})
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setBalanceModal({ ...balanceModal, isOpen: false })}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white bg-black/40 hover:bg-neutral-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mode Tabs */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-black/40 rounded-xl border border-purple-500/20 text-xs">
              <button
                type="button"
                onClick={() => setBalanceModal({ ...balanceModal, mode: 'add' })}
                className={`py-1.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1 ${balanceModal.mode === 'add' ? 'bg-emerald-600 text-white shadow-sm' : 'text-purple-300/70 hover:text-white'}`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>เพิ่มเงิน</span>
              </button>
              <button
                type="button"
                onClick={() => setBalanceModal({ ...balanceModal, mode: 'deduct' })}
                className={`py-1.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1 ${balanceModal.mode === 'deduct' ? 'bg-rose-600 text-white shadow-sm' : 'text-purple-300/70 hover:text-white'}`}
              >
                <Minus className="w-3.5 h-3.5" />
                <span>ลดเงิน</span>
              </button>
              <button
                type="button"
                onClick={() => setBalanceModal({ ...balanceModal, mode: 'set' })}
                className={`py-1.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1 ${balanceModal.mode === 'set' ? 'bg-purple-600 text-white shadow-sm' : 'text-purple-300/70 hover:text-white'}`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>กำหนดยอด</span>
              </button>
            </div>

            {/* Current Balance & Live Preview */}
            <div className="p-3.5 rounded-2xl bg-black/50 border border-purple-500/20 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-neutral-400 block">ยอดคงเหลือปัจจุบัน</span>
                <span className="text-base font-bold font-mono text-purple-200">
                  ฿ {Number(balanceModal.member.balance || 0).toLocaleString()}
                </span>
              </div>

              {balanceModal.amount && !isNaN(Number(balanceModal.amount)) && Number(balanceModal.amount) > 0 && (
                <div className="text-right">
                  <span className="text-[10px] text-neutral-400 block">ยอดใหม่หลังทำรายการ</span>
                  <span className={`text-base font-bold font-mono ${
                    balanceModal.mode === 'add' 
                      ? 'text-emerald-400' 
                      : balanceModal.mode === 'deduct' 
                        ? 'text-rose-400' 
                        : 'text-amber-400'
                  }`}>
                    ฿ {(
                      balanceModal.mode === 'add'
                        ? Number(balanceModal.member.balance || 0) + Number(balanceModal.amount)
                        : balanceModal.mode === 'deduct'
                          ? Math.max(0, Number(balanceModal.member.balance || 0) - Number(balanceModal.amount))
                          : Number(balanceModal.amount)
                    ).toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            {/* Quick Amount Buttons */}
            <div>
              <label className="block text-xs font-medium text-purple-200 mb-1.5">จำนวนเงินด่วน:</label>
              <div className="flex flex-wrap gap-1.5">
                {[50, 100, 300, 500, 1000, 2000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setBalanceModal({ ...balanceModal, amount: amt.toString() })}
                    className="px-2.5 py-1 rounded-lg bg-purple-900/40 hover:bg-purple-800/60 text-purple-200 border border-purple-500/30 text-xs font-mono font-medium transition-all active:scale-95"
                  >
                    {balanceModal.mode === 'add' ? `+฿${amt}` : balanceModal.mode === 'deduct' ? `-฿${amt}` : `฿${amt}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Adjustment Form */}
            <form onSubmit={handleConfirmBalanceAdjustment} className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-medium text-purple-200 mb-1">
                  {balanceModal.mode === 'add' 
                    ? 'จำนวนเงินที่ต้องการเพิ่ม (บาท):' 
                    : balanceModal.mode === 'deduct' 
                      ? 'จำนวนเงินที่ต้องการลด (บาท):' 
                      : 'กำหนดยอดเงินใหม่ (บาท):'}
                </label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  required
                  autoFocus
                  placeholder="เช่น 100"
                  value={balanceModal.amount}
                  onChange={(e) => setBalanceModal({ ...balanceModal, amount: e.target.value })}
                  className="w-full bg-black/60 border border-purple-500/30 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-white focus:outline-none focus:border-purple-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-purple-200 mb-1">
                  หมายเหตุ / เหตุผลบันทึกช่วยจำ (ไม่บังคับ):
                </label>
                <input
                  type="text"
                  placeholder="เช่น โอนเงินตรงผ่านแอดมิน, กิจกรรมสุ่มแจก, หักเงินคืน..."
                  value={balanceModal.note}
                  onChange={(e) => setBalanceModal({ ...balanceModal, note: e.target.value })}
                  className="w-full bg-black/60 border border-purple-500/30 rounded-xl px-3.5 py-2 text-xs text-purple-100 focus:outline-none focus:border-purple-400"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={submittingBalance}
                  className={`flex-1 py-2.5 rounded-xl text-white font-bold text-xs transition-all shadow-md active:scale-95 disabled:opacity-50 ${
                    balanceModal.mode === 'add'
                      ? 'bg-emerald-600 hover:bg-emerald-500'
                      : balanceModal.mode === 'deduct'
                        ? 'bg-rose-600 hover:bg-rose-500'
                        : 'bg-purple-600 hover:bg-purple-500'
                  }`}
                >
                  {submittingBalance 
                    ? 'กำลังดำเนินการ...' 
                    : balanceModal.mode === 'add'
                      ? `ยืนยันเพิ่มเงิน (+฿${balanceModal.amount ? Number(balanceModal.amount).toLocaleString() : '0'})`
                      : balanceModal.mode === 'deduct'
                        ? `ยืนยันลดเงิน (-฿${balanceModal.amount ? Number(balanceModal.amount).toLocaleString() : '0'})`
                        : `ยืนยันกำหนดยอด (฿${balanceModal.amount ? Number(balanceModal.amount).toLocaleString() : '0'})`}
                </button>

                <button
                  type="button"
                  onClick={() => setBalanceModal({ ...balanceModal, isOpen: false })}
                  className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium transition-colors"
                >
                  ยกเลิก
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
