import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('bull_user') || sessionStorage.getItem('bull_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.id) {
      refreshUser();
    }
  }, []);

  const refreshUser = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'x-user-id': user.id }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        if (localStorage.getItem('bull_user')) {
          localStorage.setItem('bull_user', JSON.stringify(data.user));
        } else {
          sessionStorage.setItem('bull_user', JSON.stringify(data.user));
        }
      }
    } catch (err) {
      console.error("Refresh user error:", err);
    }
  };

  const login = async (usernameOrEmail, password, rememberMe = true) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernameOrEmail, password, rememberMe })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "เข้าสู่ระบบไม่สำเร็จ");

      setUser(data.user);
      if (rememberMe) {
        localStorage.setItem('bull_user', JSON.stringify(data.user));
        sessionStorage.removeItem('bull_user');
      } else {
        sessionStorage.setItem('bull_user', JSON.stringify(data.user));
        localStorage.removeItem('bull_user');
      }
      return { success: true, user: data.user, message: data.message };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (registerData) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "สมัครสมาชิกไม่สำเร็จ");

      setUser(data.user);
      localStorage.setItem('bull_user', JSON.stringify(data.user));
      return { success: true, user: data.user, message: data.message };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const facebookLogin = async (fbData) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/facebook-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fbData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "เข้าสู่ระบบด้วย Facebook ไม่สำเร็จ");

      setUser(data.user);
      localStorage.setItem('bull_user', JSON.stringify(data.user));
      return { success: true, user: data.user, message: data.message };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const sendEmailOtp = async (email, username) => {
    try {
      const res = await fetch('/api/auth/send-email-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ส่งรหัส OTP ไปยังอีเมลไม่สำเร็จ");
      return { 
        success: true, 
        ref: data.ref, 
        email: data.email,
        message: data.message
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const sendSmsOtp = async (phone) => {
    try {
      const res = await fetch('/api/auth/send-sms-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ส่ง SMS OTP ไม่สำเร็จ");
      return { 
        success: true, 
        ref: data.ref, 
        message: data.message
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const socialLogin = async (provider = 'Facebook') => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/social-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "เข้าสู่ระบบด้วยโซเชียลไม่สำเร็จ");

      setUser(data.user);
      localStorage.setItem('bull_user', JSON.stringify(data.user));
      return { success: true, user: data.user };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const requestPasswordReset = async (identifier) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ขอรหัสรีเซ็ตรหัสผ่านไม่สำเร็จ");
      return { 
        success: true, 
        type: data.type, 
        target: data.target, 
        rawTarget: data.rawTarget,
        ref: data.ref, 
        resetToken: data.resetToken, 
        message: data.message 
      };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const confirmPasswordReset = async (resetData) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resetData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ตั้งรหัสผ่านใหม่ไม่สำเร็จ");
      return { success: true, message: data.message, user: data.user };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async (usernameOrEmail, newPassword) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernameOrEmail, newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "รีเซ็ตรหัสผ่านไม่สำเร็จ");
      return { success: true, message: data.message };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('bull_user');
    sessionStorage.removeItem('bull_user');
  };

  const updateBalance = (newBalance) => {
    setUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, balance: newBalance };
      if (localStorage.getItem('bull_user')) {
        localStorage.setItem('bull_user', JSON.stringify(updated));
      } else {
        sessionStorage.setItem('bull_user', JSON.stringify(updated));
      }
      return updated;
    });
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      register, 
      socialLogin, 
      facebookLogin,
      sendEmailOtp,
      sendSmsOtp,
      requestPasswordReset,
      confirmPasswordReset,
      forgotPassword, 
      logout, 
      refreshUser, 
      updateBalance 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
