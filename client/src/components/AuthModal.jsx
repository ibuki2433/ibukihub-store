import React, { useState } from 'react';
import { X, LogIn, UserPlus, Lock, User, Mail, ShieldAlert, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal({ initialMode = 'login', onClose }) {
  const { login, register, loading } = useAuth();
  const [mode, setMode] = useState(initialMode);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    let res;
    if (mode === 'login') {
      res = await login(username, password);
    } else {
      res = await register(username, password, email);
    }

    if (res.success) {
      onClose();
    } else {
      setError(res.error);
    }
  };

  const handleQuickLogin = async (usr, pwd) => {
    setUsername(usr);
    setPassword(pwd);
    setError(null);
    const res = await login(usr, pwd);
    if (res.success) {
      onClose();
    } else {
      setError(res.error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
      
      <div 
        className="relative w-full max-w-md bg-[#141022] border border-purple-400/30 rounded-2xl shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/50 hover:bg-purple-900/60 text-purple-200 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="bg-[#19142b] border-b border-purple-900/30 p-5 text-white">
          <div className="flex items-center gap-2">
            {mode === 'login' ? <LogIn className="w-4 h-4 text-purple-400" /> : <UserPlus className="w-4 h-4 text-purple-400" />}
            <h3 className="text-base sm:text-lg font-bold">
              {mode === 'login' ? "เข้าสู่ระบบสมาชิก" : "สมัครสมาชิกใหม่"}
            </h3>
          </div>
          <p className="text-xs text-purple-300/70 mt-0.5">
            Bull Software Store ระบบจำหน่ายและจัดส่งซอฟต์แวร์อัตโนมัติ
          </p>
        </div>

        {/* Mode Switch Tabs */}
        <div className="flex border-b border-purple-900/20 bg-[#120e1e]">
          <button
            onClick={() => { setMode('login'); setError(null); }}
            className={`flex-1 py-3 text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 transition-colors border-b-2 ${
              mode === 'login'
                ? 'border-purple-400 text-purple-200 bg-purple-900/20 font-semibold'
                : 'border-transparent text-purple-300/60 hover:text-white'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>เข้าสู่ระบบ</span>
          </button>
          <button
            onClick={() => { setMode('register'); setError(null); }}
            className={`flex-1 py-3 text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 transition-colors border-b-2 ${
              mode === 'register'
                ? 'border-purple-400 text-purple-200 bg-purple-900/20 font-semibold'
                : 'border-transparent text-purple-300/60 hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>สมัครสมาชิก</span>
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 sm:p-6 space-y-4">
          
          {error && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-xs text-red-200">
              {error}
            </div>
          )}


          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-purple-200 mb-1">
                ชื่อผู้ใช้งาน:
              </label>
              <div className="relative flex items-center">
                <User className="w-4 h-4 text-purple-400/50 absolute left-3" />
                <input
                  type="text"
                  required
                  placeholder="เช่น user1, developer"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-[#181328] border border-purple-500/20 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-purple-100 focus:outline-none focus:border-purple-400/50"
                />
              </div>
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-xs font-medium text-purple-200 mb-1">
                  อีเมล (ไม่บังคับ):
                </label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 text-purple-400/50 absolute left-3" />
                  <input
                    type="email"
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#181328] border border-purple-500/20 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-purple-100 focus:outline-none focus:border-purple-400/50"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-purple-200 mb-1">
                รหัสผ่าน:
              </label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-purple-400/50 absolute left-3" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#181328] border border-purple-500/20 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-purple-100 focus:outline-none focus:border-purple-400/50"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 mt-2 rounded-xl bg-purple-700 hover:bg-purple-600 text-white font-semibold text-xs sm:text-sm shadow-soft-purple flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              {loading ? (
                <span>กำลังประมวลผล...</span>
              ) : mode === 'login' ? (
                <>
                  <LogIn className="w-3.5 h-3.5" />
                  <span>เข้าสู่ระบบ</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>ยืนยันการสมัครสมาชิก</span>
                </>
              )}
            </button>
          </form>

        </div>

      </div>

    </div>
  );
}
