'use client';

/**
 * Trang Login – VNPT Report Hub
 * Hỗ trợ Đăng nhập bằng Họ tên và Số điện thoại với hình nền Đà Lạt và bố cục bên phải sang trọng
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

/* ─── Kiểu dữ liệu ─── */
interface LoginForm {
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
  const [loginForm, setLoginForm] = useState<LoginForm>({ name: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!loginForm.name.trim() || !loginForm.phone.trim()) {
      setError('Vui lòng nhập đầy đủ Họ tên và Số điện thoại.');
      return;
    }

    setLoading(true);
    try {
      const result = await signIn('credentials', {
        name: loginForm.name.trim(),
        phone: loginForm.phone.trim(),
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
        <p className={styles.heroDesc}>
          Tối ưu hóa quy trình giám sát chỉ tiêu KPI, tự động hóa xử lý sự cố Chuyên đề 5 và xuất báo cáo chuẩn Corporate nhanh chóng, chính xác trên quê hương núi Bà Đen / Đà Lạt.
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
            <p className={styles.headerTitle}>Hệ thống Báo cáo Tự động</p>
          </div>

          <div className={styles.tabs}>
            <button type="button" className={`${styles.tabBtn} ${styles.tabActive}`} style={{ width: '100%' }}>
              Đăng nhập
            </button>
          </div>

          {error && (
            <div className={styles.errorBox} style={{ marginBottom: 16 }}>
              <IconAlert />
              <span className={styles.errorText}>{error}</span>
            </div>
          )}

          <form className={styles.form} onSubmit={handleLogin} noValidate>
            {/* Họ tên */}
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="login-name">Họ và tên</label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputIcon}><IconUser /></span>
                <input
                  id="login-name"
                  type="text"
                  className={styles.input}
                  placeholder="vd: Nguyễn Văn A"
                  autoComplete="name"
                  value={loginForm.name}
                  onChange={(e) => setLoginForm((f) => ({ ...f, name: e.target.value }))}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            {/* Số điện thoại */}
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="login-phone">Số điện thoại</label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputIcon}><IconPhone /></span>
                <input
                  id="login-phone"
                  type="text"
                  className={styles.input}
                  placeholder="Nhập số điện thoại"
                  autoComplete="tel"
                  value={loginForm.phone}
                  onChange={(e) => setLoginForm((f) => ({ ...f, phone: e.target.value }))}
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
                  Đang đăng nhập…
                </>
              ) : (
                'Đăng nhập'
              )}
            </button>

            <div style={{ marginTop: 24, textAlign: 'center', fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.55)' }}>
              Tài khoản được cấp tự động. Vui lòng liên hệ Quản trị viên nếu bạn không đăng nhập được.
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
