'use client';

/**
 * Trang Login / Register – VNPT Report Hub
 * Hỗ trợ Đăng nhập & Đăng ký tài khoản mới bằng Họ tên và Số điện thoại
 */

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import styles from './login.module.css';
import VnptLogo from '@/components/VnptLogo';

/* ─── Icon components (inline SVG) ─── */
const IconUser = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4" />
    <path d="M20 21a8 8 0 1 0-16 0" />
  </svg>
);

const IconPhone = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
  </svg>
);

const IconAlert = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" x2="12" y1="8" y2="12" />
    <line x1="12" x2="12.01" y1="16" y2="16" />
  </svg>
);

const IconSuccess = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

/* ─── Kiểu dữ liệu ─── */
interface AuthForm {
  name: string;
  phone: string;
}

/* ─── Hàm map error code → thông báo tiếng Việt ─── */
function mapAuthError(error: string | undefined | null): string {
  switch (error) {
    case 'CredentialsSignin':
      return 'Họ tên hoặc số điện thoại không chính xác. Vui lòng thử lại.';
    case 'SessionRequired':
      return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
    default:
      return error ?? 'Đã có lỗi xảy ra. Vui lòng thử lại sau.';
  }
}

/* ─── Component chính ─── */
export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState<AuthForm>({ name: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const switchTab = (newTab: 'login' | 'register') => {
    setTab(newTab);
    setError(null);
    setSuccess(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!form.name.trim() || !form.phone.trim()) {
      setError('Vui lòng nhập đầy đủ Họ tên và Số điện thoại.');
      return;
    }

    setLoading(true);
    try {
      const result = await signIn('credentials', {
        name: form.name.trim(),
        phone: form.phone.trim(),
        redirect: false,
      });

      if (result?.error) {
        setError(mapAuthError(result.error));
      } else if (result?.ok) {
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!form.name.trim() || !form.phone.trim()) {
      setError('Vui lòng nhập đầy đủ Họ tên và Số điện thoại.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Đã có lỗi xảy ra khi đăng ký.');
        setLoading(false);
        return;
      }

      setSuccess('Đăng ký tài khoản thành công! Đang tự động đăng nhập...');

      // Tự động đăng nhập luôn sau khi tạo tài khoản thành công
      const result = await signIn('credentials', {
        name: form.name.trim(),
        phone: form.phone.trim(),
        redirect: false,
      });

      if (result?.ok) {
        router.push('/');
        router.refresh();
      } else {
        setSuccess('Đăng ký thành công! Vui lòng nhấn nút Đăng nhập.');
        setTab('login');
      }
    } catch {
      setError('Lỗi kết nối máy chủ. Vui lòng kiểm tra lại mạng và thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* ── Background Overlay / Glowing Blobs ── */}
      <div className={styles.bgOverlay} />

      {/* ── Left Hero Section (Giới thiệu VNPT Tây Ninh trên hình nền Đà Lạt) ── */}
      <div className={styles.heroSection}>
        <div className={styles.heroBadge}>
          <span className={styles.badgeDot}></span>
          <span>NỀN TẢNG BÁO CÁO VIỄN THÔNG THÔNG MINH</span>
        </div>
        <h1 className={styles.heroTitle}>VNPT TÂY NINH</h1>
        <p className={styles.heroSubtitle}>
          Hệ thống Quản lý &amp; Tổng hợp Báo cáo Tự động hóa
        </p>


        <div className={styles.heroFooter}>
          <div className={styles.statItem}>
            <span className={styles.statNum}>8+</span>
            <span className={styles.statLabel}>Nguồn Excel</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <span className={styles.statNum}>100%</span>
            <span className={styles.statLabel}>Tự động hóa Word</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <span className={styles.statNum}>24/7</span>
            <span className={styles.statLabel}>Giám sát KPI</span>
          </div>
        </div>
      </div>

      {/* ── Right Login Section (Khung đăng nhập bên phải) ── */}
      <div className={styles.loginContainer}>
        <div className={styles.card}>
          {/* ── Header / Logo ── */}
          <div className={styles.header}>
            <VnptLogo style={{ width: 140, height: 'auto', marginBottom: 10 }} />
            <p className={styles.headerTitle}>
              {tab === 'login' ? 'Hệ thống Báo cáo Tự động' : 'Đăng ký tài khoản thành viên'}
            </p>
          </div>

          <div className={styles.tabs}>
            <button
              type="button"
              className={`${styles.tabBtn} ${tab === 'login' ? styles.tabActive : ''}`}
              onClick={() => switchTab('login')}
              disabled={loading}
            >
              Đăng nhập
            </button>
            <button
              type="button"
              className={`${styles.tabBtn} ${tab === 'register' ? styles.tabActive : ''}`}
              onClick={() => switchTab('register')}
              disabled={loading}
            >
              Đăng ký
            </button>
          </div>

          {error && (
            <div className={styles.errorBox} style={{ marginBottom: 16 }}>
              <IconAlert />
              <span className={styles.errorText}>{error}</span>
            </div>
          )}

          {success && (
            <div className={styles.successBox} style={{ marginBottom: 16 }}>
              <IconSuccess />
              <span className={styles.successText}>{success}</span>
            </div>
          )}

          <form className={styles.form} onSubmit={tab === 'login' ? handleLogin : handleRegister} noValidate>
            {/* Họ tên */}
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="auth-name">Họ và tên</label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputIcon}><IconUser /></span>
                <input
                  id="auth-name"
                  type="text"
                  className={styles.input}
                  placeholder="vd: Nguyễn Văn A"
                  autoComplete="name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            {/* Số điện thoại */}
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="auth-phone">Số điện thoại</label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputIcon}><IconPhone /></span>
                <input
                  id="auth-phone"
                  type="text"
                  className={styles.input}
                  placeholder="Nhập số điện thoại (từ 8-11 chữ số)"
                  autoComplete="tel"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            {/* Submit */}
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? (
                <>
                  <span className={styles.spinner} />
                  {tab === 'login' ? 'Đang đăng nhập…' : 'Đang đăng ký…'}
                </>
              ) : (
                tab === 'login' ? 'Đăng nhập' : 'Đăng ký tài khoản'
              )}
            </button>

            <div style={{ marginTop: 20, textAlign: 'center', fontSize: '0.88rem' }}>
              {tab === 'login' ? (
                <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                  Chưa có tài khoản?{' '}
                  <button
                    type="button"
                    onClick={() => switchTab('register')}
                    style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', fontWeight: 600, padding: 0, textDecoration: 'underline' }}
                  >
                    Đăng ký ngay
                  </button>
                </span>
              ) : (
                <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                  Đã có tài khoản?{' '}
                  <button
                    type="button"
                    onClick={() => switchTab('login')}
                    style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', fontWeight: 600, padding: 0, textDecoration: 'underline' }}
                  >
                    Đăng nhập
                  </button>
                </span>
              )}
            </div>

            <div style={{ marginTop: 12, textAlign: 'center', fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.45)' }}>
              {tab === 'login'
                ? 'Tài khoản được bảo mật. Vui lòng nhập đúng họ tên và số điện thoại.'
                : 'Hệ thống tự động liên kết tài khoản bằng Họ tên và Số điện thoại của bạn.'}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
