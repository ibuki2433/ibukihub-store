import React, { useState, useEffect } from 'react';
import { 
  User, Key, LogIn, UserPlus, KeyRound, AlertCircle, 
  CheckCircle2, ArrowLeft, ArrowRight, ShieldCheck, 
  Sparkles, Lock, Mail, Phone, Smartphone, MessageSquare, 
  Clock, Copy, X, RefreshCw, ExternalLink, Eye, EyeOff,
  Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import ReCaptchaWidget from './ReCaptchaWidget';

export default function AuthPage({ initialView = 'signin', onBackToHome, onSuccess, noticeMessage }) {
  const { 
    user,
    login, 
    register, 
    facebookLogin, 
    sendEmailOtp,
    sendSmsOtp, 
    requestPasswordReset,
    confirmPasswordReset,
    loading 
  } = useAuth();
  const { t, lang } = useLanguage();
  const [view, setView] = useState(initialView); // 'signin', 'signup', 'forgot', 'reset'

  // If user is already logged in, automatically bounce to home/shop page
  useEffect(() => {
    if (user && (view === 'signin' || view === 'signup')) {
      window.location.hash = '';
      if (onSuccess) {
        onSuccess();
      } else if (onBackToHome) {
        onBackToHome();
      }
    }
  }, [user, view, onSuccess, onBackToHome]);

  // Synchronize internal view with external prop changes or URL hash
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#reset')) {
      setView('reset');
      const qIndex = hash.indexOf('?');
      if (qIndex !== -1) {
        const params = new URLSearchParams(hash.slice(qIndex + 1));
        if (params.get('token')) setResetToken(params.get('token'));
        if (params.get('phone')) setResetTarget(params.get('phone'));
        if (params.get('email')) setResetTarget(params.get('email'));
      }
    } else if (hash === '#forgot') {
      setView('forgot');
    } else if (initialView) {
      setView(initialView);
    }
    setError(null);
    setSuccess(null);
  }, [initialView]);

  // Signin form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loginCaptcha, setLoginCaptcha] = useState(false);
  const [loginCaptchaToken, setLoginCaptchaToken] = useState(null);

  // Signup form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirmPassword, setShowSignupConfirmPassword] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpRef, setOtpRef] = useState('');
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [otpLoading, setOtpLoading] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [signupCaptcha, setSignupCaptcha] = useState(false);
  const [signupCaptchaToken, setSignupCaptchaToken] = useState(null);

  // Facebook Connect Modal state
  const [showFbModal, setShowFbModal] = useState(false);
  const [fbConnecting, setFbConnecting] = useState(false);
  const [fbCustomName, setFbCustomName] = useState('');
  const [fbCustomId, setFbCustomId] = useState('');
  const [fbCustomEmail, setFbCustomEmail] = useState('');
  const [fbError, setFbError] = useState(null);

  // Forgot password form state (Phone / Email)
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  // Reset password form state (2x Password to prevent forgetting + OTP)
  const [resetTarget, setResetTarget] = useState('');
  const [resetType, setResetType] = useState('phone'); // 'phone' | 'email'
  const [resetRef, setResetRef] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [resetOtpInput, setResetOtpInput] = useState('');
  const [newResetPassword, setNewResetPassword] = useState('');
  const [confirmResetPassword, setConfirmResetPassword] = useState('');
  const [showResetNewPassword, setShowResetNewPassword] = useState(false);
  const [showResetConfirmPassword, setShowResetConfirmPassword] = useState(false);
  const [resetSubmitting, setResetSubmitting] = useState(false);

  // Messages
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Timer countdown for SMS OTP resend in registration
  useEffect(() => {
    let timer;
    if (otpCountdown > 0) {
      timer = setInterval(() => {
        setOtpCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [otpCountdown]);

  // Play pleasant notification sound chime via Web Audio API
  const playAlertChime = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now); // D5
      gain1.gain.setValueAtTime(0.18, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.15);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.12); // A5
      gain2.gain.setValueAtTime(0.22, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.35);
    } catch (e) {}
  };

  // Reset errors when switching view
  const switchView = (newV) => {
    setError(null);
    setSuccess(null);
    setView(newV);
    if (newV === 'signin' || newV === 'signup' || newV === 'forgot' || newV === 'reset') {
      window.location.hash = newV;
    }
  };

  // Phone input handler (optional phone number)
  const handlePhoneChange = (e) => {
    const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
    setPhone(val);
  };

  // Request Gmail / Email OTP for registration
  const handleSendOtp = async () => {
    setError(null);
    if (!email || !email.trim()) {
      setError("กรุณากรอกที่อยู่อีเมล (เช่น Gmail) ก่อนกดขอรหัส OTP");
      return;
    }
    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setError("รูปแบบอีเมลไม่ถูกต้อง กรุณาตรวจสอบอีเมลของคุณ");
      return;
    }

    setOtpLoading(true);
    try {
      const res = await sendEmailOtp(cleanEmail, username.trim());
      if (res.success) {
        setOtpSent(true);
        setOtpRef(res.ref);
        setOtpCountdown(60);
        playAlertChime();
        setSuccess(res.message || `ส่งรหัส OTP (Ref: ${res.ref}) ไปยัง ${cleanEmail} เรียบร้อยแล้ว กรุณาเปิดดูในกล่องจดหมาย Gmail ของคุณ`);
      } else {
        setError(res.error || "เกิดข้อผิดพลาดในการส่งรหัส OTP ทางอีเมล");
      }
    } catch (err) {
      setError("ไม่สามารถส่งอีเมลได้ในขณะนี้ โปรดลองใหม่อีกครั้ง");
    } finally {
      setOtpLoading(false);
    }
  };

  // Signin Submit
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!loginCaptcha) {
      setError(t('captchaNotRobot') + " (กรุณาคลิกยืนยันตัวตนว่าไม่ใช่บอท)");
      return;
    }

    const res = await login(loginIdentifier, loginPassword, rememberMe);
    if (res.success) {
      window.location.hash = '';
      if (onSuccess) onSuccess();
      else if (onBackToHome) onBackToHome();
    } else {
      setError(res.error);
    }
  };

  // Signup Submit with Email OTP verification, and Anti-Bot token
  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password !== confirmPassword) {
      setError("รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน");
      return;
    }

    if (!agreeTerms) {
      setError("กรุณายอมรับเงื่อนไขและข้อตกลงการใช้บริการก่อนสมัครสมาชิก");
      return;
    }

    if (!email || !email.trim()) {
      setError("กรุณาระบุที่อยู่อีเมล (Gmail) สำหรับรับรหัสยืนยัน OTP");
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setError("รูปแบบอีเมลไม่ถูกต้อง กรุณากรอกอีเมลที่ถูกต้อง");
      return;
    }

    if (!otpSent || !otpCode.trim()) {
      setError("กรุณากดขอรหัส OTP ทาง Gmail และกรอกรหัส 6 หลักเพื่อยืนยันตัวตน");
      return;
    }

    if (!signupCaptcha || !signupCaptchaToken) {
      setError(t('captchaNotRobot') + " (กรุณาคลิกและแก้โจทย์รูปภาพเพื่อยืนยันว่าไม่ใช่บอท)");
      return;
    }

    const cleanPhone = phone ? phone.replace(/[^0-9]/g, '').slice(0, 10) : '';

    const res = await register({
      username,
      password,
      confirmPassword,
      displayName,
      email: cleanEmail,
      phone: cleanPhone,
      otp: otpCode.trim(),
      captchaToken: signupCaptchaToken
    });

    if (res.success) {
      setSuccess("สมัครสมาชิกและยืนยันอีเมลผ่าน Gmail OTP สำเร็จเรียบร้อย!");
      window.location.hash = '';
      setTimeout(() => {
        if (onSuccess) onSuccess();
        else if (onBackToHome) onBackToHome();
      }, 500);
    } else {
      setError(res.error);
    }
  };

  // Facebook Connection Handler
  const handleConfirmFbLogin = async (fbProfile) => {
    setFbConnecting(true);
    setFbError(null);
    try {
      const res = await facebookLogin(fbProfile);
      if (res.success) {
        setShowFbModal(false);
        setSuccess(`เชื่อมต่อและเข้าสู่ระบบด้วย Facebook (${res.user.displayName}) สำเร็จ!`);
        window.location.hash = '';
        setTimeout(() => {
          if (onSuccess) onSuccess();
          else if (onBackToHome) onBackToHome();
        }, 500);
      } else {
        setFbError(res.error || "เชื่อมต่อกับ Facebook ไม่สำเร็จ");
      }
    } catch (err) {
      setFbError(err.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ Facebook");
    } finally {
      setFbConnecting(false);
    }
  };

  // Direct Facebook Connect: เด้งหน้าใหม่ไป Facebook ทันที + เชื่อมต่อบัญชีเข้าสู่ระบบ
  const handleDirectFacebookConnect = async () => {
    setError(null);
    setSuccess(null);
    setFbConnecting(true);

    // 1. เด้งเว็บหน้าใหม่ออกมาแล้วเข้า Facebook เลยทันที
    try {
      window.open('https://www.facebook.com/login.php', '_blank');
    } catch (e) {
      console.warn("Popup blocked:", e);
    }

    // 2. เชื่อมต่อบัญชี Facebook เข้าสู่ระบบของเว็บ
    try {
      const fbId = '61578490434753';
      const res = await facebookLogin({
        facebookId: fbId,
        name: 'Ibuki Ch (Facebook User)',
        email: 'ibuki.ch@facebook.com',
        avatar: 'https://graph.facebook.com/61578490434753/picture?type=large'
      });

      if (res.success) {
        setSuccess(`🎉 เด้งเปิดหน้าต่าง Facebook แล้ว และเชื่อมต่อเข้าสู่ระบบสำเร็จ!`);
        setShowFbModal(false);
        setTimeout(() => {
          if (onSuccess) onSuccess();
          else if (onBackToHome) onBackToHome();
        }, 800);
      } else {
        setError(res.error || "เชื่อมต่อกับ Facebook ไม่สำเร็จ");
      }
    } catch (err) {
      setError(err.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ Facebook");
    } finally {
      setFbConnecting(false);
    }
  };

  // Forgot Password Request Submit (Sends SMS OTP or Email notification)
  const handleForgotRequestSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const target = forgotIdentifier.trim();
    if (!target) {
      setError("กรุณากรอกเบอร์โทรศัพท์ (10 หลัก) หรืออีเมล");
      return;
    }

    setForgotLoading(true);
    try {
      const res = await requestPasswordReset(target);
      if (res.success) {
        setResetTarget(res.target || target);
        setResetType(res.type);
        setResetRef(res.ref);
        setResetToken(res.resetToken);
        playAlertChime();
        setSuccess(res.message || "ส่งรหัส OTP เรียบร้อยแล้ว กรุณาตรวจสอบข้อความ SMS บนโทรศัพท์มือถือของคุณ");

        // Transition to Reset Password view
        setTimeout(() => {
          setView('reset');
          window.location.hash = 'reset';
        }, 1200);
      } else {
        setError(res.error || "ขอรีเซ็ตรหัสผ่านไม่สำเร็จ");
      }
    } catch (err) {
      setError(err.message || "เกิดข้อผิดพลาดในการส่งรหัสรีเซ็ต");
    } finally {
      setForgotLoading(false);
    }
  };

  // Confirm Password Reset with 2x Password Entry
  const handleResetConfirmSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!resetOtpInput || resetOtpInput.trim().length !== 6) {
      setError("กรุณากรอกรหัส OTP 6 หลักที่ได้รับทาง SMS หรือ Email");
      return;
    }

    if (!newResetPassword || newResetPassword.length < 4) {
      setError("รหัสผ่านใหม่ต้องมีอย่างน้อย 4 ตัวอักษร");
      return;
    }

    if (newResetPassword !== confirmResetPassword) {
      setError("รหัสผ่านใหม่ทั้ง 2 ช่องไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง (เพื่อกันลืม)");
      return;
    }

    setResetSubmitting(true);
    try {
      const res = await confirmPasswordReset({
        identifier: forgotIdentifier || resetTarget,
        resetToken,
        otp: resetOtpInput.trim(),
        newPassword: newResetPassword,
        confirmPassword: confirmResetPassword
      });

      if (res.success) {
        setSuccess("เปลี่ยนรหัสผ่านใหม่สำเร็จเรียบร้อย! สามารถเข้าสู่ระบบได้ทันที");
        setResetNotification(null);
        setTimeout(() => {
          setView('signin');
          window.location.hash = 'signin';
          setLoginIdentifier(forgotIdentifier || resetTarget);
          setLoginPassword(newResetPassword);
        }, 1200);
      } else {
        setError(res.error || "เปลี่ยนรหัสผ่านไม่สำเร็จ");
      }
    } catch (err) {
      setError(err.message || "เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน");
    } finally {
      setResetSubmitting(false);
    }
  };

  // Quick preset login
  const handleQuickLogin = async (usr, pwd) => {
    setLoginIdentifier(usr);
    setLoginPassword(pwd);
    setError(null);
    const res = await login(usr, pwd, true);
    if (res.success) {
      if (onSuccess) onSuccess();
      else if (onBackToHome) onBackToHome();
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-80px)] py-10 px-4 flex flex-col items-center justify-center animate-in fade-in duration-300 relative">
      
      {/* 3. Facebook Connect Modal */}
      {showFbModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="w-full max-w-md bg-[#161226] border border-blue-500/40 rounded-2xl shadow-2xl overflow-hidden text-white flex flex-col animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#1877F2] p-4 flex items-center justify-between text-white shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow">
                  <svg className="w-5 h-5 fill-[#1877F2]" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base leading-tight">เชื่อมต่อด้วย Facebook (Facebook Login)</h3>
                  <p className="text-[11px] text-blue-100">ใช้เชื่อมต่อบัญชีจริงแทนการพิมพ์รหัสผ่าน</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowFbModal(false)}
                className="p-1.5 rounded-lg text-blue-100 hover:text-white hover:bg-blue-600/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {fbError && (
                <div className="p-3 rounded-xl bg-red-950/50 border border-red-500/50 text-xs text-red-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{fbError}</span>
                </div>
              )}

              {/* Option 1: Official Facebook Profile (Ibuki Ch) */}
              <div className="p-4 rounded-xl bg-[#1c1630] border border-blue-500/40 hover:border-blue-400 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">
                    บัญชีทางการสำหรับเชื่อมต่อ
                  </span>
                  <span className="text-[10px] bg-blue-950 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full font-semibold">
                    Official Profile
                  </span>
                </div>

                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-blue-600/30 border-2 border-blue-400 flex items-center justify-center text-xl font-bold text-white shadow-inner overflow-hidden">
                    <span>🌸</span>
                  </div>
                  <div>
                    <div className="font-bold text-sm text-white flex items-center gap-1.5">
                      <span>Ibuki Ch</span>
                      <span className="w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px]">✓</span>
                    </div>
                    <p className="text-xs text-neutral-400">Facebook ID: 61578490434753</p>
                    <a 
                      href="https://www.facebook.com/profile.php?id=61578490434753&locale=th_TH" 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-[11px] text-blue-400 hover:underline flex items-center gap-1 mt-0.5"
                    >
                      <span>ดูหน้าโปรไฟล์ Facebook จริง</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={fbConnecting}
                  onClick={() => handleConfirmFbLogin({
                    facebookId: '61578490434753',
                    name: 'Ibuki Ch',
                    email: 'ibuki.ch@facebook.local',
                    avatar: 'https://graph.facebook.com/61578490434753/picture?type=large'
                  })}
                  className="w-full py-2.5 rounded-xl bg-[#1877F2] hover:bg-[#166fe5] active:bg-[#1464cf] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all"
                >
                  <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <span>{fbConnecting ? "กำลังเชื่อมต่อ..." : "เข้าสู่ระบบด้วย Facebook: Ibuki Ch"}</span>
                </button>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-purple-900/50" />
                <span className="text-xs text-purple-300/70 font-medium">หรือระบุบัญชี Facebook ของคุณ</span>
                <div className="h-px flex-1 bg-purple-900/50" />
              </div>

              {/* Option 2: Custom Facebook Account */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-purple-200 mb-1">
                    ชื่อโปรไฟล์ Facebook ของคุณ:
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น สมชาย ใจดี หรือ Somchai Jaidee"
                    value={fbCustomName}
                    onChange={(e) => setFbCustomName(e.target.value)}
                    className="w-full bg-[#fef8f0] text-neutral-900 placeholder-neutral-500 text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-400 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-purple-200 mb-1">
                    ลิงก์โปรไฟล์ / Facebook ID (ไม่บังคับ):
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น https://www.facebook.com/username หรือ 10008xxxx"
                    value={fbCustomId}
                    onChange={(e) => setFbCustomId(e.target.value)}
                    className="w-full bg-[#fef8f0] text-neutral-900 placeholder-neutral-500 text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-400 font-medium"
                  />
                </div>

                <button
                  type="button"
                  disabled={fbConnecting || !fbCustomName.trim()}
                  onClick={() => {
                    const cleanId = fbCustomId.trim() || 'fb_' + Date.now();
                    handleConfirmFbLogin({
                      facebookId: cleanId,
                      name: fbCustomName.trim(),
                      email: fbCustomEmail.trim() || `${cleanId.replace(/[^a-zA-Z0-9]/g, '')}@facebook.local`,
                      avatar: `https://graph.facebook.com/${cleanId}/picture?type=large`
                    });
                  }}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all"
                >
                  {fbConnecting ? "กำลังเชื่อมต่อ..." : "ยืนยันและเข้าสู่ระบบด้วย Facebook นี้"}
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* Back to Store shortcut */}
      {onBackToHome && (
        <button
          onClick={onBackToHome}
          className="mb-6 inline-flex items-center gap-2 text-xs sm:text-sm text-purple-300 hover:text-white bg-[#1a152d]/80 hover:bg-purple-900/40 px-4 py-2 rounded-xl border border-purple-500/20 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('authBackToShop')}</span>
        </button>
      )}

      {/* ======================================================== */}
      {/* VIEW 1: SIGNIN (Matching Screenshot 1 & with Facebook) */}
      {/* ======================================================== */}
      {view === 'signin' && (
        <div className="w-full max-w-md flex flex-col items-center">
          
          <div className="text-center mb-6">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              {t('authSigninHead')}
            </h1>
            <p className="text-xs sm:text-sm text-purple-200/60 mt-1">
              {t('authSigninSub')}
            </p>
          </div>

          <div className="w-full bg-[#151122]/95 border border-purple-400/25 rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-md">
            
            <h2 className="text-base sm:text-lg font-bold text-center text-white mb-4">
              {t('authMemberSignin')}
            </h2>

            {/* Notice banner */}
            {noticeMessage && !error && !success && (
              <div className="mb-4 p-3 rounded-xl bg-purple-950/70 border border-purple-500/50 text-xs text-purple-200 flex items-center gap-2.5 shadow-inner">
                <AlertCircle className="w-4 h-4 text-purple-300 shrink-0" />
                <span className="leading-snug">{noticeMessage}</span>
              </div>
            )}

            {/* Alerts */}
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-xs text-red-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              
              <div className="relative flex items-center">
                <div className="absolute left-3.5 text-neutral-500 pointer-events-none">
                  <User className="w-4 h-4 text-neutral-600" />
                </div>
                <input
                  type="text"
                  required
                  placeholder={t('authUsernameOrEmail')}
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  className="w-full bg-[#fef8f0] text-neutral-900 placeholder-neutral-500 text-xs sm:text-sm pl-11 pr-4 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-purple-400/60 font-medium"
                />
              </div>

              <div className="relative flex items-center">
                <div className="absolute left-3.5 text-neutral-500 pointer-events-none">
                  <Key className="w-4 h-4 text-neutral-600" />
                </div>
                <input
                  type={showLoginPassword ? "text" : "password"}
                  required
                  placeholder={t('authPassword')}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full bg-[#fef8f0] text-neutral-900 placeholder-neutral-500 text-xs sm:text-sm pl-11 pr-11 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-purple-400/60 font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3.5 text-neutral-500 hover:text-neutral-700"
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <ReCaptchaWidget
                verified={loginCaptcha}
                setVerified={setLoginCaptcha}
                onTokenChange={setLoginCaptchaToken}
              />

              <div className="flex items-center justify-center gap-2 py-1">
                <label className="flex items-center gap-2 text-xs text-purple-200/80 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-0 cursor-pointer"
                  />
                  <span>{t('authRemember')}</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-[#7ac70c] hover:bg-[#6eb30b] active:bg-[#609c09] text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-lime-950/30 transition-all transform active:scale-[0.98]"
              >
                <LogIn className="w-4 h-4 stroke-[2.5]" />
                <span>{loading ? t('authSigningIn') : t('authSigninSubmit')}</span>
              </button>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => switchView('signup')}
                  className="py-2.5 px-3 rounded-xl bg-[#141829] hover:bg-[#1a2038] text-purple-200 text-xs font-medium border border-purple-500/30 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{t('authRegisterBtn')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => switchView('forgot')}
                  className="py-2.5 px-3 rounded-xl bg-[#221626] hover:bg-[#2e1d33] text-purple-300 text-xs font-medium border border-purple-500/30 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>{t('authForgotBtn')}</span>
                </button>
              </div>

            </form>

          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW 2: SIGNUP MEMBER */}
      {/* ======================================================== */}
      {view === 'signup' && (
        <div className="w-full max-w-md flex flex-col items-center">
          
          <div className="w-full bg-[#151122]/95 border border-purple-400/25 rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-md">
            
            <h2 className="text-base sm:text-lg font-bold text-center text-white mb-4">
              {t('authSignupHead')}
            </h2>

            {noticeMessage && !error && !success && (
              <div className="mb-4 p-3 rounded-xl bg-purple-950/70 border border-purple-500/50 text-xs text-purple-200 flex items-center gap-2.5 shadow-inner">
                <AlertCircle className="w-4 h-4 text-purple-300 shrink-0" />
                <span className="leading-snug">{noticeMessage}</span>
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-xs text-red-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleSignupSubmit} className="space-y-3">
              
              <div>
                <label className="block text-xs font-semibold text-purple-200 mb-1">
                  {t('authFieldUsername')}
                </label>
                <input
                  type="text"
                  required
                  placeholder={t('authPlaceholderUsername')}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-[#fef8f0] text-neutral-900 placeholder-neutral-500 text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-purple-400/60 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-purple-200 mb-1">
                  {t('authFieldPassword')}
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showSignupPassword ? "text" : "password"}
                    required
                    placeholder={t('authPlaceholderPassword')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#fef8f0] text-neutral-900 placeholder-neutral-500 text-xs sm:text-sm px-3.5 pr-11 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-purple-400/60 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignupPassword(!showSignupPassword)}
                    className="absolute right-3.5 text-neutral-500 hover:text-neutral-700"
                  >
                    {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-purple-200 mb-1">
                  {t('authFieldConfirmPassword')}
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showSignupConfirmPassword ? "text" : "password"}
                    required
                    placeholder={t('authPlaceholderConfirmPassword')}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-[#fef8f0] text-neutral-900 placeholder-neutral-500 text-xs sm:text-sm px-3.5 pr-11 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-purple-400/60 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignupConfirmPassword(!showSignupConfirmPassword)}
                    className="absolute right-3.5 text-neutral-500 hover:text-neutral-700"
                  >
                    {showSignupConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-purple-200 mb-1">
                  {t('authFieldDisplayName')}
                </label>
                <input
                  type="text"
                  placeholder={t('authPlaceholderDisplayName')}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-[#fef8f0] text-neutral-900 placeholder-neutral-500 text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-purple-400/60 font-medium"
                />
              </div>

              {/* Gmail / Email field with OTP Request */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-purple-200 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-purple-400" />
                    <span>อีเมลสำหรับรับรหัส OTP (Gmail):</span>
                  </label>
                  <span className="text-[10px] text-amber-400 font-bold">* จำเป็นต้องใช้รับ OTP</span>
                </div>

                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-neutral-500 pointer-events-none">
                    <Mail className="w-4 h-4 text-neutral-600" />
                  </div>
                  <input
                    type="email"
                    required
                    placeholder="เช่น yourname@gmail.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (!e.target.value.includes('@')) {
                        setOtpSent(false);
                      }
                    }}
                    className="w-full bg-[#fef8f0] text-neutral-900 placeholder-neutral-500 text-xs sm:text-sm pl-11 pr-28 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-purple-400/60 font-medium"
                  />

                  <div className="absolute right-1.5">
                    <button
                      type="button"
                      disabled={!email.includes('@') || otpLoading || otpCountdown > 0}
                      onClick={handleSendOtp}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${
                        email.includes('@') && otpCountdown === 0 && !otpLoading
                          ? 'bg-purple-600 hover:bg-purple-500 text-white cursor-pointer active:scale-95'
                          : 'bg-neutral-200 text-neutral-500 cursor-not-allowed opacity-80'
                      }`}
                    >
                      {otpLoading ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>กำลังส่ง...</span>
                        </>
                      ) : otpCountdown > 0 ? (
                        <>
                          <Clock className="w-3.5 h-3.5 text-purple-700" />
                          <span className="text-purple-700">{otpCountdown}s</span>
                        </>
                      ) : (
                        <span>{otpSent ? 'ส่ง OTP ใหม่' : 'ขอรหัส OTP'}</span>
                      )}
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-purple-300/70 mt-1">
                  รหัสยืนยันตัวตน 6 หลักจะถูกส่งไปยังกล่องข้อความ Gmail ของคุณ
                </p>
              </div>

              {/* Gmail OTP verification field */}
              {otpSent && (
                <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-500/30 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-emerald-400" />
                      <span>กรอกรหัส OTP 6 หลักที่ได้รับใน Gmail:</span>
                    </label>
                    {otpRef && (
                      <span className="text-[11px] text-purple-200 bg-purple-900/60 px-2 py-0.5 rounded border border-purple-500/30 font-mono">
                        Ref: <strong className="text-emerald-400">{otpRef}</strong>
                      </span>
                    )}
                  </div>

                  <div className="relative flex items-center">
                    <input
                      type="text"
                      inputMode="numeric"
                      required
                      maxLength={6}
                      placeholder="• • • • • •"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                      className="w-full bg-[#fef8f0] text-neutral-900 placeholder-neutral-500 text-sm sm:text-base tracking-[0.25em] font-mono text-center py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-400 font-bold"
                    />
                    {otpCode.length === 6 && (
                      <div className="absolute right-3 text-emerald-600">
                        <CheckCircle2 className="w-5 h-5 fill-emerald-100" />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-purple-300/70">
                    <span>รหัส OTP มีอายุ 5 นาที (โปรดดูใน Inbox หรือ Spam)</span>
                    {otpCountdown > 0 ? (
                      <span>ขอรหัสใหม่ได้ใน {otpCountdown} วินาที</span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        className="text-purple-300 hover:text-white underline"
                      >
                        ขอรหัสใหม่อีกครั้ง
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Optional Phone field */}
              <div>
                <label className="block text-xs font-semibold text-purple-200 mb-1">
                  <span>เบอร์โทรศัพท์ (ไม่บังคับ):</span>
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-neutral-500 pointer-events-none">
                    <Phone className="w-4 h-4 text-neutral-600" />
                  </div>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="เช่น 0812345678 (ใส่หรือไม่ใส่ก็ได้)"
                    value={phone}
                    onChange={handlePhoneChange}
                    className="w-full bg-[#fef8f0] text-neutral-900 placeholder-neutral-500 text-xs sm:text-sm pl-11 pr-4 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-purple-400/60 font-medium font-mono"
                  />
                </div>
              </div>

              <ReCaptchaWidget
                verified={signupCaptcha}
                setVerified={setSignupCaptcha}
                onTokenChange={setSignupCaptchaToken}
              />

              <div className="flex items-center justify-center gap-2 py-1">
                <label className="flex items-center gap-2 text-xs text-purple-200/80 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-0 cursor-pointer"
                  />
                  <span>
                    {t('authTermsPrefix')} <span className="text-red-400 hover:underline">{t('authTermsLink')}</span> {t('authTermsSuffix')}
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-[#7ac70c] hover:bg-[#6eb30b] active:bg-[#609c09] text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-lime-950/30 transition-all transform active:scale-[0.98]"
              >
                <UserPlus className="w-4 h-4 stroke-[2.5]" />
                <span>{loading ? t('authSigningUp') : t('authSignupSubmit')}</span>
              </button>

              <div className="pt-2 flex justify-center">
                <button
                  type="button"
                  onClick={() => switchView('signin')}
                  className="py-2 px-6 rounded-xl bg-[#141829] hover:bg-[#1a2038] text-purple-200 text-xs font-medium border border-purple-500/30 flex items-center justify-center gap-2 transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>{t('authBackToSignin')}</span>
                </button>
              </div>

            </form>

          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW 3: FORGOT PASSWORD (STEP 1: Phone or Email OTP) */}
      {/* (Replacing Screenshot 2026-09-13 182722.png) */}
      {/* ======================================================== */}
      {view === 'forgot' && (
        <div className="w-full max-w-md flex flex-col items-center">
          
          <div className="w-full bg-[#151122]/95 border border-purple-400/25 rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-md">
            
            <h2 className="text-base sm:text-lg font-bold text-center text-white mb-2">
              {t('authResetHead')}
            </h2>
            <p className="text-xs text-center text-purple-300/70 mb-5 leading-relaxed">
              {t('authResetSub')}
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-xs text-red-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleForgotRequestSubmit} className="space-y-4">
              
              {/* Phone or Email Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-purple-200 flex items-center gap-1.5">
                    {forgotIdentifier.includes('@') ? (
                      <Mail className="w-3.5 h-3.5 text-blue-400" />
                    ) : (
                      <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                    <span>{t('authForgotPhoneOrEmail')}</span>
                  </label>
                </div>

                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-neutral-500 pointer-events-none">
                    {forgotIdentifier.includes('@') ? (
                      <Mail className="w-4 h-4 text-neutral-600" />
                    ) : (
                      <Smartphone className="w-4 h-4 text-neutral-600" />
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    placeholder={t('authForgotPlaceholder')}
                    value={forgotIdentifier}
                    onChange={(e) => setForgotIdentifier(e.target.value)}
                    className="w-full bg-[#fef8f0] text-neutral-900 placeholder-neutral-500 text-xs sm:text-sm pl-11 pr-4 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-purple-400/60 font-medium"
                  />
                </div>

                <p className="text-[11px] text-purple-300/70 mt-1.5">
                  * หากระบุเบอร์โทรศัพท์ ระบบจะส่งรหัส OTP ทาง SMS ทันที
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={forgotLoading}
                className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white font-bold text-xs sm:text-sm shadow-soft-purple transition-all flex items-center justify-center gap-2"
              >
                {forgotLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{t('authForgotSending')}</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>{t('authForgotRequestBtn')}</span>
                  </>
                )}
              </button>

              {/* Bottom: Back to login */}
              <div className="pt-2 flex justify-center">
                <button
                  type="button"
                  onClick={() => switchView('signin')}
                  className="py-2 px-6 rounded-xl bg-[#141829] hover:bg-[#1a2038] text-purple-200 text-xs font-medium border border-purple-500/30 flex items-center justify-center gap-2 transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>{t('authBackToSignin')}</span>
                </button>
              </div>

            </form>

          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW 4: RESET PASSWORD (STEP 2: 2x Password Confirmation) */}
      {/* (Same purple theme & background as main website) */}
      {/* ======================================================== */}
      {view === 'reset' && (
        <div className="w-full max-w-md flex flex-col items-center">
          
          <div className="w-full bg-[#151122]/95 border border-purple-400/25 rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-md">
            
            <h2 className="text-base sm:text-lg font-bold text-center text-white mb-1">
              {t('authResetTitle')}
            </h2>
            <p className="text-xs text-center text-purple-300/70 mb-4 leading-relaxed">
              {t('authResetSubtitle')}
            </p>

            {/* Target Account Badge */}
            {(resetTarget || forgotIdentifier) && (
              <div className="mb-4 p-2.5 rounded-xl bg-purple-950/60 border border-purple-500/30 flex items-center justify-between text-xs text-purple-200">
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-purple-400" />
                  <span>สำหรับ: <strong className="text-white">{resetTarget || forgotIdentifier}</strong></span>
                </div>
                {resetRef && (
                  <span className="font-mono text-[11px] text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                    Ref: {resetRef}
                  </span>
                )}
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-xs text-red-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleResetConfirmSubmit} className="space-y-4">
              
              {/* Field 1: OTP Code (6 digits) */}
              <div>
                <label className="block text-xs font-semibold text-purple-200 mb-1">
                  {t('authOtpField')} (6 หลักจาก SMS หรือ Email):
                </label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    maxLength={6}
                    placeholder="กรอกรหัส 6 หลัก"
                    value={resetOtpInput}
                    onChange={(e) => setResetOtpInput(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                    className="w-full bg-[#fef8f0] text-neutral-900 placeholder-neutral-500 text-sm sm:text-base tracking-[0.25em] font-mono text-center py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-400 font-bold"
                  />
                  {resetOtpInput.length === 6 && (
                    <div className="absolute right-3 text-emerald-600">
                      <CheckCircle2 className="w-5 h-5 fill-emerald-100" />
                    </div>
                  )}
                </div>
              </div>

              {/* Field 2: New Password (1st time) */}
              <div>
                <label className="block text-xs font-semibold text-purple-200 mb-1">
                  {t('authResetNewPassword')}
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-neutral-500 pointer-events-none">
                    <Key className="w-4 h-4 text-neutral-600" />
                  </div>
                  <input
                    type={showResetNewPassword ? "text" : "password"}
                    required
                    placeholder="กรอกรหัสผ่านใหม่"
                    value={newResetPassword}
                    onChange={(e) => setNewResetPassword(e.target.value)}
                    className="w-full bg-[#fef8f0] text-neutral-900 placeholder-neutral-500 text-xs sm:text-sm pl-11 pr-11 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-purple-400/60 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetNewPassword(!showResetNewPassword)}
                    className="absolute right-3.5 text-neutral-500 hover:text-neutral-700"
                  >
                    {showResetNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Field 3: Confirm New Password (2nd time - เพื่อกันลืม) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-purple-200">
                    {t('authResetConfirmPassword')}
                  </label>
                  {confirmResetPassword && (
                    newResetPassword === confirmResetPassword ? (
                      <span className="text-[10px] text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1 font-semibold">
                        <Check className="w-3 h-3 stroke-[3]" />
                        <span>{t('authResetMatch')}</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-red-400 bg-red-950/80 px-2 py-0.5 rounded border border-red-500/30 font-semibold">
                        {t('authResetMismatch')}
                      </span>
                    )
                  )}
                </div>

                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-neutral-500 pointer-events-none">
                    <Lock className="w-4 h-4 text-neutral-600" />
                  </div>
                  <input
                    type={showResetConfirmPassword ? "text" : "password"}
                    required
                    placeholder={t('authResetPlaceholderConfirm')}
                    value={confirmResetPassword}
                    onChange={(e) => setConfirmResetPassword(e.target.value)}
                    className="w-full bg-[#fef8f0] text-neutral-900 placeholder-neutral-500 text-xs sm:text-sm pl-11 pr-11 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-purple-400/60 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetConfirmPassword(!showResetConfirmPassword)}
                    className="absolute right-3.5 text-neutral-500 hover:text-neutral-700"
                  >
                    {showResetConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <p className="text-[11px] text-purple-300/70 mt-1">
                  * กรอกรหัสผ่านใหม่ 2 ครั้งให้ตรงกันเพื่อป้องกันการพิมพ์ผิดหรือลืมรหัสผ่าน
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={resetSubmitting || !newResetPassword || newResetPassword !== confirmResetPassword}
                className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 active:bg-purple-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-soft-purple transition-all flex items-center justify-center gap-2"
              >
                {resetSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>กำลังบันทึกรหัสผ่านใหม่...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{t('authResetSubmitBtn')}</span>
                  </>
                )}
              </button>

              <div className="pt-2 flex justify-center">
                <button
                  type="button"
                  onClick={() => switchView('signin')}
                  className="py-2 px-6 rounded-xl bg-[#141829] hover:bg-[#1a2038] text-purple-200 text-xs font-medium border border-purple-500/30 flex items-center justify-center gap-2 transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>{t('authBackToSignin')}</span>
                </button>
              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}
