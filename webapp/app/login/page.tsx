'use client';

/**
 * Trang Login / Register – VNPT Report Hub
 * Hỗ trợ 2 tab: Đăng nhập (NextAuth credentials) và Đăng ký (POST /api/auth/register)
 */

import { useState, useCallback } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import styles from './login.module.css';
import VnptLogo from '@/components/VnptLogo';

/* ─── Icon components (inline SVG, không cần thêm thư viện) ─── */

const IconMail = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const IconLock = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const IconUser = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4" />
    <path d="M20 21a8 8 0 1 0-16 0" />
  </svg>
);

const IconEye = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const IconEyeOff = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
    <line x1="2" x2="22" y1="2" y2="22" />
  </svg>
);

const IconAlert = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" x2="12" y1="8" y2="12" />
    <line x1="12" x2="12.01" y1="16" y2="16" />
  </svg>
);

const IconCheck = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);


/* ─── Kiểu dữ liệu ─── */
type Tab = 'login' | 'register';

interface LoginForm {
  email: string;
  password: string;
}

interface RegisterForm {
  email: string;
  name: string;
  password: string;
  confirmPassword: string;
}

/* ─── Hàm map error code → thông báo tiếng Việt ─── */
function mapAuthError(error: string | undefined | null): string {
  switch (error) {
    case 'CredentialsSignin':
      return 'Email hoặc mật khẩu không chính xác. Vui lòng thử lại.';
    case 'SessionRequired':
      return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
    default:
      return error ?? 'Đã có lỗi xảy ra. Vui lòng thử lại sau.';
  }
}

/* ─── Component chính ─── */
export default function LoginPage() {
  const router = useRouter();

  // Tab đang active
  const [activeTab, setActiveTab] = useState<Tab>('login');

  // State form đăng nhập
  const [loginForm, setLoginForm] = useState<LoginForm>({ email: '', password: '' });
  // State form đăng ký
  const [registerForm, setRegisterForm] = useState<RegisterForm>({
    email: '',
    name: '',
    password: '',
    confirmPassword: '',
  });

  // Hiện/ẩn password
  const [showLoginPw, setShowLoginPw] = useState(false);
  const [showRegisterPw, setShowRegisterPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  // Loading & message state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  /* Reset messages khi đổi tab */
  const handleTabChange = useCallback((tab: Tab) => {
    setActiveTab(tab);
    setError(null);
    setSuccess(null);
  }, []);

  /* ── Xử lý Đăng nhập ── */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!loginForm.email.trim() || !loginForm.password) {
      setError('Vui lòng nhập đầy đủ email và mật khẩu.');
      return;
    }

    setLoading(true);
    try {
      const result = await signIn('credentials', {
        email: loginForm.email.trim().toLowerCase(),
        password: loginForm.password,
        redirect: false,
      });

      if (result?.error) {
        setError(mapAuthError(result.error));
      } else if (result?.ok) {
        // Đăng nhập thành công → chuyển trang
        router.push('/');
        router.refresh();
      } else {
        setError('Không thể kết nối máy chủ. Vui lòng thử lại.');
      }
    } catch {
      setError('Lỗi kết nối. Vui lòng kiểm tra lại mạng và thử lại.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Xử lý Đăng ký ── */
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validate phía client
    if (!registerForm.email.trim() || !registerForm.name.trim() || !registerForm.password) {
      setError('Vui lòng điền đầy đủ tất cả các trường.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(registerForm.email.trim())) {
      setError('Địa chỉ email không hợp lệ.');
      return;
    }

    if (registerForm.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    setLoading(true);
    try {
      // Gọi API đăng ký
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: registerForm.email.trim().toLowerCase(),
          name: registerForm.name.trim(),
          password: registerForm.password,
        }),
      });

      const data: { error?: string; message?: string } = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Đăng ký thất bại. Vui lòng thử lại.');
        return;
      }

      setSuccess('Đăng ký thành công! Đang đăng nhập tự động…');

      // Tự đăng nhập sau khi đăng ký thành công
      const signInResult = await signIn('credentials', {
        email: registerForm.email.trim().toLowerCase(),
        password: registerForm.password,
        redirect: false,
      });

      if (signInResult?.ok) {
        router.push('/');
        router.refresh();
      } else {
        // Đăng ký thành công nhưng tự đăng nhập thất bại → chuyển sang tab login
        setSuccess('Đăng ký thành công! Vui lòng đăng nhập.');
        setTimeout(() => handleTabChange('login'), 1500);
      }
    } catch {
      setError('Lỗi kết nối. Vui lòng kiểm tra lại mạng và thử lại.');
    } finally {
      setLoading(false);
    }
  };

  /* ─── Render ─── */
  return (
    <div className={styles.page}>
      <div className={styles.card}>

        {/* ── Header / Logo ── */}
        <div className={styles.header}>
          <VnptLogo style={{ width: 140, height: 'auto', marginBottom: 10 }} />
          <p className={styles.headerTitle}>Hệ thống Báo cáo Tự động</p>
        </div>

        {/* ── Tabs ── */}
        <div className={styles.tabs}>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'login' ? styles.tabActive : ''}`}
            onClick={() => handleTabChange('login')}
            disabled={loading}
          >
            Đăng nhập
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'register' ? styles.tabActive : ''}`}
            onClick={() => handleTabChange('register')}
            disabled={loading}
          >
            Đăng ký
          </button>
        </div>

        {/* ── Error / Success banner ── */}
        {error && (
          <div className={styles.errorBox} style={{ marginBottom: 16 }}>
            <IconAlert />
            <span className={styles.errorText}>{error}</span>
          </div>
        )}
        {success && (
          <div className={styles.successBox} style={{ marginBottom: 16 }}>
            <IconCheck />
            <span className={styles.successText}>{success}</span>
          </div>
        )}

        {/* ══════════════════════════════════
            TAB: ĐĂNG NHẬP
        ══════════════════════════════════ */}
        {activeTab === 'login' && (
          <form className={styles.form} onSubmit={handleLogin} noValidate>
            {/* Email */}
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="login-email">Email</label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputIcon}><IconMail /></span>
                <input
                  id="login-email"
                  type="email"
                  className={styles.input}
                  placeholder="vd: nguyenvana@vnpt.vn"
                  autoComplete="username"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm((f) => ({ ...f, email: e.target.value }))}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="login-password">Mật khẩu</label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputIcon}><IconLock /></span>
                <input
                  id="login-password"
                  type={showLoginPw ? 'text' : 'password'}
                  className={`${styles.input} ${styles.inputPad}`}
                  placeholder="Nhập mật khẩu"
                  autoComplete="current-password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm((f) => ({ ...f, password: e.target.value }))}
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowLoginPw((v) => !v)}
                  tabIndex={-1}
                  aria-label={showLoginPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showLoginPw ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? (
                <>
                  <span className={styles.spinner} />
                  Đang đăng nhập…
                </>
              ) : (
                'Đăng nhập'
              )}
            </button>
          </form>
        )}

        {/* ══════════════════════════════════
            TAB: ĐĂNG KÝ
        ══════════════════════════════════ */}
        {activeTab === 'register' && (
          <form className={styles.form} onSubmit={handleRegister} noValidate>
            {/* Email */}
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="reg-email">Email</label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputIcon}><IconMail /></span>
                <input
                  id="reg-email"
                  type="email"
                  className={styles.input}
                  placeholder="vd: nguyenvana@vnpt.vn"
                  autoComplete="username"
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm((f) => ({ ...f, email: e.target.value }))}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            {/* Họ tên */}
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="reg-name">Họ và tên</label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputIcon}><IconUser /></span>
                <input
                  id="reg-name"
                  type="text"
                  className={styles.input}
                  placeholder="vd: Nguyễn Văn A"
                  autoComplete="name"
                  value={registerForm.name}
                  onChange={(e) => setRegisterForm((f) => ({ ...f, name: e.target.value }))}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            {/* Mật khẩu */}
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="reg-password">Mật khẩu</label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputIcon}><IconLock /></span>
                <input
                  id="reg-password"
                  type={showRegisterPw ? 'text' : 'password'}
                  className={`${styles.input} ${styles.inputPad}`}
                  placeholder="Ít nhất 6 ký tự"
                  autoComplete="new-password"
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm((f) => ({ ...f, password: e.target.value }))}
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowRegisterPw((v) => !v)}
                  tabIndex={-1}
                  aria-label={showRegisterPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showRegisterPw ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
            </div>

            {/* Xác nhận mật khẩu */}
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="reg-confirm">Xác nhận mật khẩu</label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputIcon}><IconLock /></span>
                <input
                  id="reg-confirm"
                  type={showConfirmPw ? 'text' : 'password'}
                  className={`${styles.input} ${styles.inputPad}`}
                  placeholder="Nhập lại mật khẩu"
                  autoComplete="new-password"
                  value={registerForm.confirmPassword}
                  onChange={(e) => setRegisterForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowConfirmPw((v) => !v)}
                  tabIndex={-1}
                  aria-label={showConfirmPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showConfirmPw ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? (
                <>
                  <span className={styles.spinner} />
                  Đang xử lý…
                </>
              ) : (
                'Tạo tài khoản'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
