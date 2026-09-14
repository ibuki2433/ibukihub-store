import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, Wallet, ShoppingCart, Key, Shield, X, Minus, 
  Maximize2, Minimize2, Move, Search, Eye, EyeOff, 
  ExternalLink, CheckCircle2, AlertCircle, RefreshCw, 
  Clock, ArrowUpRight, Phone, Mail, Edit3, Trash2, 
  Sparkles, Check, Copy, ChevronRight, Package 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AdminFloatingHUD({ onOpenFullDashboard }) {
  const { user } = useAuth();
  
  // Draggable window state
  const [isMinimized, setIsMinimized] = useState(true);
  const [position, setPosition] = useState({ x: 20, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, initialX: 0, initialY: 0 });

  // Data state
  const [activeTab, setActiveTab] = useState('members'); // 'members', 'topups', 'orders'
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState([]);
  const [topups, setTopups] = useState([]);
  const [orders, setOrders] = useState([]);
  const [searchMember, setSearchMember] = useState('');
  const [selectedBuyerFilter, setSelectedBuyerFilter] = useState('all');

  // Reveal password state (per member)
  const [revealedPasswords, setRevealedPasswords] = useState({});

  // Member detail modal (for viewing specific member's purchases)
  const [selectedMemberForHistory, setSelectedMemberForHistory] = useState(null);

  // Edit balance modal/inline
  const [editingBalanceUser, setEditingBalanceUser] = useState(null);
  const [newBalanceInput, setNewBalanceInput] = useState('');

  // Alerts
  const [actionMsg, setActionMsg] = useState(null);
  const [actionErr, setActionErr] = useState(null);

  // Initialize position on screen
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPosition({
        x: Math.max(20, window.innerWidth - 420),
        y: 85
      });
    }
  }, []);

  // Fetch admin data on open or role
  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchAdminData();
    }
  }, [user]);

  const fetchAdminData = async () => {
    if (!user || user.role !== 'admin') return;
    setLoading(true);
    try {
      const [resMembers, resTopups, resOrders] = await Promise.all([
        fetch('/api/admin/members', { headers: { 'x-user-id': user.id } }),
        fetch('/api/admin/topups', { headers: { 'x-user-id': user.id } }),
        fetch('/api/admin/orders', { headers: { 'x-user-id': user.id } })
      ]);

      if (resMembers.ok) {
        const d = await resMembers.json();
        setMembers(d.members || []);
      }
      if (resTopups.ok) {
        const d = await resTopups.json();
        setTopups(d.topups || []);
      }
      if (resOrders.ok) {
        const d = await resOrders.json();
        setOrders(d.orders || []);
      }
    } catch (e) {
      console.error("Admin data fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  // Dragging handlers
  const handleMouseDown = (e) => {
    // Only allow drag if clicking the header/handle
    if (e.target.closest('button') || e.target.closest('input') || e.target.closest('select')) return;
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y
    };
  };

  const handleTouchStart = (e) => {
    if (e.target.closest('button') || e.target.closest('input') || e.target.closest('select')) return;
    const touch = e.touches[0];
    setIsDragging(true);
    dragRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      initialX: position.x,
      initialY: position.y
    };
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      
      const newX = Math.max(10, Math.min(window.innerWidth - (isMinimized ? 280 : 580), dragRef.current.initialX + dx));
      const newY = Math.max(10, Math.min(window.innerHeight - 80, dragRef.current.initialY + dy));
      setPosition({ x: newX, y: newY });
    };

    const handleTouchMove = (e) => {
      if (!isDragging) return;
      const touch = e.touches[0];
      const dx = touch.clientX - dragRef.current.startX;
      const dy = touch.clientY - dragRef.current.startY;
      
      const newX = Math.max(10, Math.min(window.innerWidth - (isMinimized ? 280 : 580), dragRef.current.initialX + dx));
      const newY = Math.max(10, Math.min(window.innerHeight - 80, dragRef.current.initialY + dy));
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      if (isDragging) setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, isMinimized]);

  // Toggle reveal password for member
  const togglePasswordReveal = (userId) => {
    setRevealedPasswords(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  // Update member balance
  const handleSaveBalance = async (memberId) => {
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

      setActionMsg(`อัปเดตยอดเงินสำเร็จ: ฿${data.user.balance}`);
      setEditingBalanceUser(null);
      fetchAdminData();
      setTimeout(() => setActionMsg(null), 3000);
    } catch (err) {
      setActionErr(err.message);
      setTimeout(() => setActionErr(null), 3000);
    }
  };

  // Delete member
  const handleDeleteMember = async (member) => {
    if (member.username === 'ibuki' || member.id === 'usr_admin_ibuki') {
      alert('ไม่สามารถลบบัญชีหลักของร้านได้ (ไอดีแม่ Ibuki)');
      return;
    }
    if (!window.confirm(`ยืนยันการลบสมาชิก "${member.username}" หรือไม่?`)) return;
    try {
      const res = await fetch(`/api/admin/members/${member.id}`, {
        method: 'DELETE',
        headers: { 'x-user-id': user.id }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setActionMsg(`ลบสมาชิก "${member.username}" เรียบร้อยแล้ว`);
      fetchAdminData();
      setTimeout(() => setActionMsg(null), 3000);
    } catch (err) {
      setActionErr(err.message);
      setTimeout(() => setActionErr(null), 3000);
    }
  };

  // Filter members
  const filteredMembers = members.filter(m => {
    if (!searchMember.trim()) return true;
    const q = searchMember.toLowerCase();
    return (
      (m.username && m.username.toLowerCase().includes(q)) ||
      (m.displayName && m.displayName.toLowerCase().includes(q)) ||
      (m.email && m.email.toLowerCase().includes(q)) ||
      (m.phone && m.phone.includes(q)) ||
      (m.registrationMethod && m.registrationMethod.toLowerCase().includes(q))
    );
  });

  // Filter orders
  const filteredOrders = orders.filter(o => {
    if (selectedBuyerFilter === 'all') return true;
    return o.userId === selectedBuyerFilter || o.username === selectedBuyerFilter;
  });

  // Calculate stats
  const totalTopupAmount = topups.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const totalSalesAmount = orders.reduce((sum, o) => sum + (Number(o.price) || 0), 0);

  if (!user || user.role !== 'admin') return null;

  return (
    <>
      {/* ======================================================== */}
      {/* 1. COMPACT DRAGGABLE PILL BADGE (When Minimized) */}
      {/* ======================================================== */}
      {isMinimized ? (
        <div
          style={{ transform: `translate3d(${position.x}px, ${position.y}px, 0)` }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          className={`fixed top-0 left-0 z-[120] select-none flex items-center gap-2 p-1.5 pr-3.5 rounded-full bg-[#181328]/95 border-2 border-purple-500/80 shadow-[0_0_25px_rgba(168,85,247,0.4)] backdrop-blur-md text-white transition-shadow cursor-grab active:cursor-grabbing hover:border-purple-400 group`}
        >
          {/* Grip drag handle icon */}
          <div className="w-7 h-7 rounded-full bg-purple-900/60 border border-purple-400/40 flex items-center justify-center text-purple-300">
            <Move className="w-3.5 h-3.5" />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-300 to-amber-300">
              👑 Admin {user.username}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          </div>

          <div className="h-4 w-px bg-purple-800/60 mx-0.5" />

          {/* Quick stats & Expand button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsMinimized(false);
              fetchAdminData();
            }}
            className="flex items-center gap-1.5 text-xs text-purple-200 hover:text-white bg-purple-900/40 hover:bg-purple-800/60 px-2.5 py-1 rounded-full border border-purple-500/30 transition-all font-medium"
          >
            <span>👥 {members.length} สมาชิก</span>
            <span>•</span>
            <span className="text-emerald-400 font-bold">฿{totalTopupAmount.toLocaleString()}</span>
            <ChevronRight className="w-3.5 h-3.5 text-purple-300" />
          </button>
        </div>
      ) : (
        /* ======================================================== */
        /* 2. EXPANDED DRAGGABLE WINDOW (HUD & Control Center) */
        /* ======================================================== */
        <div
          style={{ transform: `translate3d(${position.x}px, ${position.y}px, 0)` }}
          className="fixed top-0 left-0 z-[120] w-[95vw] max-w-[620px] bg-[#151122]/98 border-2 border-purple-500/80 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.8)] backdrop-blur-xl text-white flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        >
          {/* Draggable Window Header */}
          <div
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            className="px-4 py-3 bg-gradient-to-r from-purple-950 via-[#1f1738] to-purple-950 border-b border-purple-500/40 flex items-center justify-between cursor-grab active:cursor-grabbing select-none"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-800/50 border border-purple-400/50 flex items-center justify-center text-amber-300 shadow">
                <Shield className="w-4 h-4 fill-amber-400/20" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-sm text-white tracking-tight leading-none">
                    Ibuki Admin Control Center
                  </h3>
                  <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                    Admin: {user.username}
                  </span>
                </div>
                <p className="text-[10px] text-purple-300/70 mt-0.5">
                  ลากเลื่อนหน้าต่างนี้ได้อิสระบนหน้าจอ
                </p>
              </div>
            </div>

            {/* Window control buttons */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={fetchAdminData}
                title="รีเฟรชข้อมูล"
                className="p-1.5 rounded-lg text-purple-300 hover:text-white hover:bg-purple-900/50 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-purple-400' : ''}`} />
              </button>

              <button
                type="button"
                onClick={() => setIsMinimized(true)}
                title="ย่อเป็นปุ่มลอย"
                className="p-1.5 rounded-lg text-purple-300 hover:text-white hover:bg-purple-900/50 transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>

              {onOpenFullDashboard && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMinimized(true);
                    onOpenFullDashboard();
                  }}
                  title="เปิดแดชบอร์ดเต็มจอ"
                  className="p-1.5 rounded-lg text-purple-300 hover:text-white hover:bg-purple-900/50 transition-colors"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsMinimized(true)}
                title="ปิดหน้าต่าง"
                className="p-1.5 rounded-lg text-purple-300 hover:text-red-300 hover:bg-red-950/50 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Action alerts */}
          {actionMsg && (
            <div className="px-4 py-2 bg-emerald-950/70 border-b border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>{actionMsg}</span>
            </div>
          )}
          {actionErr && (
            <div className="px-4 py-2 bg-red-950/70 border-b border-red-500/40 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{actionErr}</span>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex border-b border-purple-900/50 bg-[#120f20]/90 px-3 pt-2 gap-1.5 text-xs overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('members')}
              className={`py-2 px-3 rounded-t-xl font-bold flex items-center gap-1.5 transition-all ${
                activeTab === 'members'
                  ? 'bg-purple-900/50 text-white border-t-2 border-purple-400'
                  : 'text-purple-300/70 hover:text-white hover:bg-purple-950/30'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-purple-300" />
              <span>สมาชิกทั้งหมด ({members.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('topups')}
              className={`py-2 px-3 rounded-t-xl font-bold flex items-center gap-1.5 transition-all ${
                activeTab === 'topups'
                  ? 'bg-purple-900/50 text-white border-t-2 border-purple-400'
                  : 'text-purple-300/70 hover:text-white hover:bg-purple-950/30'
              }`}
            >
              <Wallet className="w-3.5 h-3.5 text-emerald-400" />
              <span>เงินเติมเข้า ({topups.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className={`py-2 px-3 rounded-t-xl font-bold flex items-center gap-1.5 transition-all ${
                activeTab === 'orders'
                  ? 'bg-purple-900/50 text-white border-t-2 border-purple-400'
                  : 'text-purple-300/70 hover:text-white hover:bg-purple-950/30'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5 text-pink-400" />
              <span>ประวัติการซื้อ ({orders.length})</span>
            </button>
          </div>

          {/* Body Content (Max height with scrolling) */}
          <div className="p-4 max-h-[60vh] overflow-y-auto space-y-4 text-xs">
            
            {/* ======================================================== */}
            {/* TAB 1: MEMBERS LIST WITH CREDENTIALS & REGISTRATION TYPE */}
            {/* ======================================================== */}
            {activeTab === 'members' && (
              <div className="space-y-3">
                {/* Search & Stats Header */}
                <div className="flex items-center justify-between gap-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-500" />
                    <input
                      type="text"
                      placeholder="ค้นหาสมาชิก (ชื่อ, username, เบอร์, อีเมล, วิธีสมัคร)..."
                      value={searchMember}
                      onChange={(e) => setSearchMember(e.target.value)}
                      className="w-full bg-[#1c1730] text-neutral-200 placeholder-neutral-500 text-xs pl-9 pr-3 py-2 rounded-xl border border-purple-500/30 focus:outline-none focus:ring-1 focus:ring-purple-400"
                    />
                  </div>
                  <span className="text-[11px] text-purple-300/80 shrink-0 font-medium">
                    พบ {filteredMembers.length} คน
                  </span>
                </div>

                {/* Members List */}
                <div className="space-y-2.5">
                  {filteredMembers.map((member) => {
                    const isPassRevealed = !!revealedPasswords[member.id];
                    const isEditingBal = editingBalanceUser === member.id;

                    return (
                      <div 
                        key={member.id}
                        className="p-3.5 rounded-xl bg-[#1a142e] border border-purple-500/30 hover:border-purple-400/50 transition-all space-y-2.5"
                      >
                        {/* Member Top Row: Name, Username, Role, Balance */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-purple-900/60 border border-purple-500/40 flex items-center justify-center font-bold text-white overflow-hidden shrink-0">
                              {member.avatar ? (
                                <img src={member.avatar} alt={member.username} className="w-full h-full object-cover" />
                              ) : (
                                <span>{member.username.slice(0, 2).toUpperCase()}</span>
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5 font-bold text-sm text-white">
                                <span>{member.displayName}</span>
                                <span className="text-xs text-purple-300/80 font-normal">(@{member.username})</span>
                                {member.username === 'ibuki' || member.id === 'usr_admin_ibuki' ? (
                                  <span className="text-[10px] bg-gradient-to-r from-amber-500/30 to-purple-500/30 text-amber-300 border border-amber-500/50 px-2 py-0.5 rounded-full font-bold shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                                    👑 แอดมินหลัก (ไอดีแม่)
                                  </span>
                                ) : member.role === 'admin' ? (
                                  <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded font-semibold">
                                    ADMIN
                                  </span>
                                ) : null}
                              </div>
                              <div className="text-[11px] text-neutral-400 flex items-center gap-1">
                                <span>สมัครเมื่อ: {new Date(member.createdAt).toLocaleString('th-TH')}</span>
                              </div>
                            </div>
                          </div>

                          {/* Balance & Edit */}
                          <div className="text-right">
                            {isEditingBal ? (
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  value={newBalanceInput}
                                  onChange={(e) => setNewBalanceInput(e.target.value)}
                                  className="w-20 bg-black/60 text-emerald-400 px-2 py-1 rounded text-xs border border-emerald-500/50 text-right font-mono"
                                  placeholder="ยอดเงิน"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSaveBalance(member.id)}
                                  className="p-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white"
                                  title="บันทึก"
                                >
                                  <Check className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingBalanceUser(null)}
                                  className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
                                  title="ยกเลิก"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 justify-end">
                                <span className="text-xs font-mono font-bold text-emerald-400">
                                  ฿{Number(member.balance || 0).toLocaleString()}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingBalanceUser(member.id);
                                    setNewBalanceInput(member.balance);
                                  }}
                                  title="แก้ไขยอดเงิน"
                                  className="p-1 rounded text-purple-300 hover:text-white hover:bg-purple-900/50"
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Member Details Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-purple-900/40 text-[11px]">
                          {/* How they registered */}
                          <div className="flex items-center gap-1.5 text-neutral-300">
                            <span className="text-neutral-400">สมัครด้วย:</span>
                            <span className="font-semibold text-purple-300 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-500/30">
                              {member.registrationMethod}
                            </span>
                          </div>

                          {/* Email */}
                          <div className="flex items-center gap-1.5 text-neutral-300 truncate">
                            <Mail className="w-3 h-3 text-blue-400 shrink-0" />
                            <span className="text-neutral-400">อีเมล:</span>
                            <span className="font-mono truncate select-all">{member.email}</span>
                          </div>

                          {/* Phone */}
                          <div className="flex items-center gap-1.5 text-neutral-300">
                            <Phone className="w-3 h-3 text-emerald-400 shrink-0" />
                            <span className="text-neutral-400">เบอร์:</span>
                            <span className="font-mono font-bold text-emerald-400 select-all">{member.phone}</span>
                          </div>

                          {/* Machine ID */}
                          {member.machineId && member.machineId !== '-' && (
                            <div className="flex items-center gap-1.5 text-neutral-300">
                              <span className="text-purple-400 font-mono font-bold">🖥️</span>
                              <span className="text-neutral-400">Machine ID:</span>
                              <span className="font-mono font-bold text-purple-300 bg-purple-950/80 px-1.5 py-0.5 rounded border border-purple-500/30 select-all">
                                {member.machineId}
                              </span>
                            </div>
                          )}

                          {/* Password used to register (Explicitly requested by user) */}
                          <div className="flex items-center gap-1.5 text-neutral-300">
                            <Key className="w-3 h-3 text-amber-400 shrink-0" />
                            <span className="text-neutral-400">รหัสผ่าน:</span>
                            <span className="font-mono font-bold text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30 select-all">
                              {isPassRevealed ? member.password : '••••••••'}
                            </span>
                            <button
                              type="button"
                              onClick={() => togglePasswordReveal(member.id)}
                              className="p-0.5 text-neutral-400 hover:text-white"
                              title={isPassRevealed ? "ซ่อนรหัส" : "ดูรหัสผ่าน"}
                            >
                              {isPassRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            </button>
                          </div>
                        </div>

                        {/* Bottom Action: View this member's purchases & delete */}
                        <div className="flex items-center justify-between pt-1.5 border-t border-purple-900/30">
                          <button
                            type="button"
                            onClick={() => setSelectedMemberForHistory(member)}
                            className="text-[11px] font-bold text-purple-300 hover:text-white flex items-center gap-1 bg-purple-900/40 hover:bg-purple-800/60 px-2.5 py-1 rounded-lg border border-purple-500/20 transition-colors"
                          >
                            <ShoppingCart className="w-3 h-3 text-pink-400" />
                            <span>ดูรายการที่เคยซื้อ ({member.orderCount} รายการ - รวม ฿{member.totalSpent})</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>

                          {member.username === 'ibuki' || member.id === 'usr_admin_ibuki' ? (
                            <span className="text-[10px] text-amber-400/90 bg-amber-950/40 border border-amber-500/30 px-2 py-0.5 rounded font-medium">
                              🔒 ไอดีแม่ (ลบไม่ได้)
                            </span>
                          ) : member.role !== 'admin' ? (
                            <button
                              type="button"
                              onClick={() => handleDeleteMember(member)}
                              className="text-[10px] text-red-400 hover:text-red-300 hover:bg-red-950/40 px-2 py-1 rounded transition-colors"
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

            {/* ======================================================== */}
            {/* TAB 2: TOP-UPS LIST (WHO TOPPED UP, HOW MUCH, CHANNEL, TIME) */}
            {/* ======================================================== */}
            {activeTab === 'topups' && (
              <div className="space-y-3">
                {/* Summary Banner */}
                <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-950/60 to-purple-950/60 border border-emerald-500/40 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-emerald-300 uppercase tracking-wider font-bold">
                      ยอดเงินเติมเข้าทั้งหมด
                    </span>
                    <div className="text-xl font-extrabold text-emerald-400 font-mono">
                      ฿{totalTopupAmount.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-neutral-400">รายการเติมเงินทั้งหมด</span>
                    <div className="text-sm font-bold text-white">{topups.length} รายการ</div>
                  </div>
                </div>

                {/* Topups list */}
                <div className="space-y-2">
                  {topups.length === 0 ? (
                    <div className="text-center py-6 text-neutral-500">
                      ยังไม่มีรายการเติมเงิน
                    </div>
                  ) : (
                    topups.map((topup) => (
                      <div 
                        key={topup.id}
                        className="p-3 rounded-xl bg-[#1a142e] border border-purple-500/30 flex items-center justify-between gap-3 text-xs"
                      >
                        {/* Member and Channel */}
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">
                              {topup.displayName || topup.username}
                            </span>
                            <span className="text-[10px] text-neutral-400">(@{topup.username})</span>
                          </div>
                          <div className="text-[11px] text-purple-300 flex items-center gap-1">
                            <span className="font-semibold text-purple-200">ช่องทาง:</span>
                            <span className="bg-purple-950 px-2 py-0.5 rounded border border-purple-500/30">
                              {topup.channel}
                            </span>
                          </div>
                          {topup.voucherUrl && (
                            <div className="text-[10px] text-neutral-400 truncate max-w-xs select-all">
                              ซอง: {topup.voucherUrl}
                            </div>
                          )}
                          <div className="text-[10px] text-neutral-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>เวลา: {new Date(topup.createdAt).toLocaleString('th-TH')}</span>
                          </div>
                        </div>

                        {/* Amount & Status */}
                        <div className="text-right shrink-0">
                          <div className="text-sm font-extrabold text-emerald-400 font-mono">
                            +฿{Number(topup.amount).toLocaleString()}
                          </div>
                          <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded-full font-semibold">
                            {topup.status === 'approved' ? '✓ สำเร็จ' : topup.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB 3: PURCHASES / ORDERS (WHAT EACH MEMBER PURCHASED) */}
            {/* ======================================================== */}
            {activeTab === 'orders' && (
              <div className="space-y-3">
                {/* Filter by buyer dropdown */}
                <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-[#1a142e] border border-purple-500/30">
                  <span className="text-xs text-purple-200 font-medium">
                    กรองตามผู้ซื้อ:
                  </span>
                  <select
                    value={selectedBuyerFilter}
                    onChange={(e) => setSelectedBuyerFilter(e.target.value)}
                    className="bg-[#120f20] text-white text-xs px-3 py-1.5 rounded-lg border border-purple-500/40 focus:outline-none"
                  >
                    <option value="all">-- สมาชิกทุกคน ({orders.length} รายการ) --</option>
                    {members.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.displayName} (@{m.username})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Orders list */}
                <div className="space-y-2.5">
                  {filteredOrders.length === 0 ? (
                    <div className="text-center py-6 text-neutral-500">
                      ไม่พบประวัติการสั่งซื้อ
                    </div>
                  ) : (
                    filteredOrders.map((order) => (
                      <div 
                        key={order.id}
                        className="p-3.5 rounded-xl bg-[#1a142e] border border-purple-500/30 space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-bold text-sm text-white flex items-center gap-1.5 flex-wrap">
                              <Package className="w-4 h-4 text-purple-400 shrink-0" />
                              <span>{order.productName}</span>
                              {order.planName && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-900/80 text-purple-200 border border-purple-500/30">
                                  {order.planName}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-purple-300 mt-0.5">
                              ผู้ซื้อ: <strong className="text-white">{order.displayName || order.username}</strong> (@{order.username})
                              {order.userPhone && order.userPhone !== '-' && (
                                <span className="text-neutral-400 ml-1">| เบอร์: {order.userPhone}</span>
                              )}
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-sm font-extrabold text-amber-400 font-mono">
                              ฿{Number(order.price).toLocaleString()}
                            </span>
                            <div className="text-[10px] text-neutral-500">
                              {new Date(order.createdAt).toLocaleString('th-TH')}
                            </div>
                          </div>
                        </div>

                        {/* License key, Machine ID, and file info */}
                        <div className="p-2.5 rounded-lg bg-[#120f20] border border-purple-900/60 text-[11px] space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-neutral-400">Machine ID (รหัสเครื่อง):</span>
                            {order.machineId ? (
                              <span className="font-mono font-bold text-purple-300 select-all bg-purple-950/80 px-2 py-0.5 rounded border border-purple-500/30">
                                {order.machineId}
                              </span>
                            ) : (
                              <span className="text-neutral-500 text-[10px] italic">
                                รอนำไปเปิดใช้งานในโปรแกรม
                              </span>
                            )}
                          </div>
                          {order.licenseKey && (
                            <div className="flex items-center justify-between">
                              <span className="text-neutral-400">คีย์โปรแกรม:</span>
                              <span className="font-mono font-bold text-emerald-400 select-all">
                                {order.licenseKey}
                              </span>
                            </div>
                          )}
                          {order.expiresAt && (
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="text-neutral-400">สถานะสิทธิ์/วันหมดอายุ:</span>
                              <span className="text-amber-300 font-semibold">
                                {order.expiresAt === 'LIFETIME' ? '👑 ตลอดชีพ (ไม่มีวันหมดอายุ)' : new Date(order.expiresAt).toLocaleString('th-TH')}
                              </span>
                            </div>
                          )}
                          {order.fileName && (
                            <div className="flex items-center justify-between">
                              <span className="text-neutral-400">ไฟล์ดาวน์โหลด:</span>
                              <span className="font-mono text-purple-300">
                                {order.fileName} ({order.fileSize})
                              </span>
                            </div>
                          )}
                          <div className="flex items-center justify-between text-[10px] text-neutral-500">
                            <span>รหัสสั่งซื้อ:</span>
                            <span className="font-mono">{order.id}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

          </div>

          {/* Window Footer with stats summary */}
          <div className="px-4 py-2.5 bg-[#120f20] border-t border-purple-900/50 flex items-center justify-between text-[11px] text-neutral-400">
            <span>สมาชิก: <strong className="text-white">{members.length}</strong> คน</span>
            <span>เงินเข้า: <strong className="text-emerald-400">฿{totalTopupAmount.toLocaleString()}</strong></span>
            <span>ยอดขาย: <strong className="text-amber-400">฿{totalSalesAmount.toLocaleString()}</strong></span>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. SPECIFIC MEMBER PURCHASE HISTORY MODAL */}
      {/* ======================================================== */}
      {selectedMemberForHistory && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="w-full max-w-lg bg-[#161226] border-2 border-purple-500/70 rounded-2xl shadow-2xl p-5 text-white flex flex-col max-h-[80vh] overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-purple-900/50">
              <div>
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-pink-400" />
                  <span>ประวัติการซื้อของ: {selectedMemberForHistory.displayName}</span>
                </h3>
                <p className="text-xs text-purple-300/70 mt-0.5">
                  Username: @{selectedMemberForHistory.username} | เบอร์: {selectedMemberForHistory.phone}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMemberForHistory(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Orders list for this member */}
            <div className="py-3 overflow-y-auto space-y-2.5 flex-1 text-xs">
              {orders.filter(o => o.userId === selectedMemberForHistory.id || o.username === selectedMemberForHistory.username).length === 0 ? (
                <div className="text-center py-8 text-neutral-500">
                  สมาชิกคนนี้ยังไม่เคยซื้อโปรแกรมใดๆ ในระบบ
                </div>
              ) : (
                orders
                  .filter(o => o.userId === selectedMemberForHistory.id || o.username === selectedMemberForHistory.username)
                  .map(order => (
                    <div 
                      key={order.id}
                      className="p-3 rounded-xl bg-[#1c1630] border border-purple-500/30 space-y-1.5"
                    >
                      <div className="flex items-start justify-between flex-wrap gap-1">
                        <div>
                          <div className="font-bold text-sm text-white flex items-center gap-1.5 flex-wrap">
                            <span>{order.productName}</span>
                            {order.planName && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-900/80 text-purple-200 border border-purple-500/30">
                                {order.planName}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-purple-300">รหัสคำสั่งซื้อ: {order.id}</span>
                        </div>
                        <span className="text-sm font-bold text-amber-400 font-mono">
                          ฿{Number(order.price).toLocaleString()}
                        </span>
                      </div>

                      <div className="p-2 rounded bg-black/40 text-[11px] font-mono space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-neutral-400">Machine ID:</span>
                          {order.machineId ? (
                            <span className="text-purple-300 font-bold select-all">{order.machineId}</span>
                          ) : (
                            <span className="text-neutral-500 text-[10px] italic font-sans">รอนำไปเปิดใช้งาน</span>
                          )}
                        </div>
                        {order.licenseKey && (
                          <div className="flex items-center justify-between">
                            <span className="text-neutral-400">License Key:</span>
                            <span className="text-emerald-400 font-bold select-all">{order.licenseKey}</span>
                          </div>
                        )}
                        {order.expiresAt && (
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-neutral-400">หมดอายุ:</span>
                            <span className="text-amber-300 font-semibold">
                              {order.expiresAt === 'LIFETIME' ? '👑 ตลอดชีพ' : new Date(order.expiresAt).toLocaleDateString('th-TH')}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-neutral-400">ไฟล์:</span>
                          <span className="text-purple-300">{order.fileName}</span>
                        </div>
                      </div>

                      <div className="text-[10px] text-neutral-500 flex items-center justify-between">
                        <span>เวลาที่สั่งซื้อ:</span>
                        <span>{new Date(order.createdAt).toLocaleString('th-TH')}</span>
                      </div>
                    </div>
                  ))
              )}
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-purple-900/50 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedMemberForHistory(null)}
                className="px-4 py-1.5 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-purple-200 text-xs font-bold transition-colors"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
