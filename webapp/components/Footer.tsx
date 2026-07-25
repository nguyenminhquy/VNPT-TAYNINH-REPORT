'use client';

import React from 'react';
import { 
  Building2, 
  Users, 
  Info, 
  Package, 
  PhoneCall, 
  MapPin, 
  Mail, 
  Phone, 
  Share2, 
  Globe 
} from 'lucide-react';

const FacebookIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);

const YoutubeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/>
    <path d="m10 15 5-3-5-3v6z"/>
  </svg>
);

export default function Footer() {
  return (
    <footer style={{
      position: 'relative',
      background: 'linear-gradient(180deg, #020b1d 0%, #031435 50%, #020c22 100%)',
      color: '#e2e8f0',
      padding: '48px 24px 24px',
      borderTop: '1px solid rgba(56, 182, 255, 0.3)',
      boxShadow: '0 -10px 40px rgba(0, 140, 255, 0.15)',
      overflow: 'hidden',
      fontFamily: "'Be Vietnam Pro', 'Lexend', sans-serif",
      marginTop: 'auto'
    }}>
      {/* ── BACKGROUND CYBER GLOW & GRID EFFECTS ── */}
      <div style={{
        position: 'absolute',
        top: '-150px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '600px',
        height: '300px',
        background: 'radial-gradient(circle, rgba(0, 140, 255, 0.25) 0%, rgba(0, 0, 0, 0) 70%)',
        filter: 'blur(40px)',
        pointerEvents: 'none',
        zIndex: 0
      }} />
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `
          radial-gradient(circle at 20% 30%, rgba(56, 182, 255, 0.15) 1px, transparent 1px),
          radial-gradient(circle at 80% 70%, rgba(56, 182, 255, 0.15) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
        opacity: 0.6,
        pointerEvents: 'none',
        zIndex: 0
      }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '1280px', margin: '0 auto' }}>
        {/* ── 1. TOP BRANDING SECTION ── */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '16px', marginBottom: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {/* FUTURISTIC TELECOM ORBIT ICON */}
            <div style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #005ce6, #38b6ff)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 25px rgba(56, 182, 255, 0.6)',
              position: 'relative'
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z" fill="url(#blue_grad)" fillOpacity="0.3"/>
                <path d="M17.5 6.5C14.5 3.5 9.5 3.5 6.5 6.5C4.5 8.5 3.8 11.2 4.4 13.7" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round"/>
                <path d="M6.5 17.5C9.5 20.5 14.5 20.5 17.5 17.5C19.5 15.5 20.2 12.8 19.6 10.3" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round"/>
                <circle cx="12" cy="12" r="4" fill="#FFFFFF" filter="drop-shadow(0 0 6px #38BDF8)"/>
                <defs>
                  <linearGradient id="blue_grad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#38b6ff"/>
                    <stop offset="1" stopColor="#005ce6"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* BRAND TITLE */}
            <h1 style={{
              margin: 0,
              fontSize: '2.4rem',
              fontWeight: 800,
              letterSpacing: '2px',
              background: 'linear-gradient(90deg, #38BDF8 0%, #60EFFF 50%, #3B82F6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 0 30px rgba(56, 189, 248, 0.4)'
            }}>
              VIỄN THÔNG TÂY NINH
            </h1>
          </div>

          {/* TAGLINE WITH GLOWING DIVIDER LINES */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', color: '#cbd5e1', fontSize: '1.05rem', fontWeight: 500 }}>
            <div style={{ width: '80px', height: '1px', background: 'linear-gradient(90deg, transparent, #38BDF8)' }} />
            <span>Kết nối công nghệ - Kiến tạo tương lai</span>
            <div style={{ width: '80px', height: '1px', background: 'linear-gradient(90deg, #38BDF8, transparent)' }} />
          </div>
        </div>

        {/* GLOWING HORIZONTAL SEPARATOR */}
        <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(56, 182, 255, 0.35), transparent)', marginBottom: '40px' }} />

        {/* ── 2. MIDDLE 3-COLUMNS GRID SECTION ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '32px',
          marginBottom: '40px',
          position: 'relative'
        }}>
          {/* COLUMN 1: VỀ CHÚNG TÔI */}
          <div style={{ padding: '0 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '22px', paddingBottom: '12px', borderBottom: '1px solid rgba(56, 182, 255, 0.15)' }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(56, 182, 255, 0.12)', border: '1px solid rgba(56, 182, 255, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38BDF8' }}>
                <Building2 size={18} />
              </div>
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#FFFFFF', letterSpacing: '0.5px' }}>
                VỀ CHÚNG TÔI
              </h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#cbd5e1', fontSize: '0.95rem' }}>
                <span style={{ color: '#38BDF8', display: 'flex' }}><Users size={18} /></span>
                <span>VNPT Group</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#cbd5e1', fontSize: '0.95rem' }}>
                <span style={{ color: '#38BDF8', display: 'flex' }}><Info size={18} /></span>
                <span>Giới thiệu</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#cbd5e1', fontSize: '0.95rem' }}>
                <span style={{ color: '#38BDF8', display: 'flex' }}><Package size={18} /></span>
                <span>Dịch vụ</span>
              </div>
            </div>
          </div>

          {/* COLUMN 2: THÔNG TIN LIÊN HỆ */}
          <div style={{ 
            padding: '0 16px', 
            borderLeft: '1px solid rgba(56, 182, 255, 0.15)',
            borderRight: '1px solid rgba(56, 182, 255, 0.15)' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '22px', paddingBottom: '12px', borderBottom: '1px solid rgba(56, 182, 255, 0.15)' }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(56, 182, 255, 0.12)', border: '1px solid rgba(56, 182, 255, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38BDF8' }}>
                <PhoneCall size={18} />
              </div>
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#FFFFFF', letterSpacing: '0.5px' }}>
                THÔNG TIN LIÊN HỆ
              </h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', color: '#cbd5e1', fontSize: '0.95rem', lineHeight: 1.5 }}>
                <span style={{ color: '#38BDF8', display: 'flex', marginTop: '2px', flexShrink: 0 }}><MapPin size={18} /></span>
                <div>
                  <strong style={{ color: '#FFFFFF', fontWeight: 600 }}>Địa chỉ: </strong>
                  <span>Số 168, Đường 30/4, P.3, TP. Tây Ninh, Tỉnh Tây Ninh</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#cbd5e1', fontSize: '0.95rem' }}>
                <span style={{ color: '#38BDF8', display: 'flex', flexShrink: 0 }}><Mail size={18} /></span>
                <div>
                  <strong style={{ color: '#FFFFFF', fontWeight: 600 }}>Email: </strong>
                  <a href="mailto:lienhe@vnptayninh.vn" style={{ color: '#38BDF8', textDecoration: 'none' }}>lienhe@vnptayninh.vn</a>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#cbd5e1', fontSize: '0.95rem' }}>
                <span style={{ color: '#38BDF8', display: 'flex', flexShrink: 0 }}><Phone size={18} /></span>
                <div>
                  <strong style={{ color: '#FFFFFF', fontWeight: 600 }}>Điện thoại: </strong>
                  <a href="tel:0276800126" style={{ color: '#38BDF8', textDecoration: 'none', fontWeight: 600 }}>0276 800 126</a>
                </div>
              </div>
            </div>
          </div>

          {/* COLUMN 3: KẾT NỐI */}
          <div style={{ padding: '0 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '22px', paddingBottom: '12px', borderBottom: '1px solid rgba(56, 182, 255, 0.15)' }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(56, 182, 255, 0.12)', border: '1px solid rgba(56, 182, 255, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38BDF8' }}>
                <Share2 size={18} />
              </div>
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#FFFFFF', letterSpacing: '0.5px' }}>
                KẾT NỐI
              </h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#cbd5e1', fontSize: '0.95rem' }}>
                <span style={{ color: '#38BDF8', display: 'flex', flexShrink: 0 }}><Globe size={18} /></span>
                <div>
                  <strong style={{ color: '#FFFFFF', fontWeight: 600 }}>Website: </strong>
                  <a href="https://vnptayninh.vn" target="_blank" rel="noreferrer" style={{ color: '#38BDF8', textDecoration: 'none' }}>https://vnptayninh.vn</a>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#cbd5e1', fontSize: '0.95rem' }}>
                <span style={{ color: '#38BDF8', display: 'flex', flexShrink: 0 }}><FacebookIcon /></span>
                <div>
                  <strong style={{ color: '#FFFFFF', fontWeight: 600 }}>Facebook: </strong>
                  <a href="https://facebook.com/vnptayninh" target="_blank" rel="noreferrer" style={{ color: '#cbd5e1', textDecoration: 'none' }}>facebook.com/vnptayninh</a>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#cbd5e1', fontSize: '0.95rem' }}>
                <span style={{ color: '#38BDF8', display: 'flex', flexShrink: 0 }}><YoutubeIcon /></span>
                <div>
                  <strong style={{ color: '#FFFFFF', fontWeight: 600 }}>YouTube: </strong>
                  <a href="https://youtube.com/@vnptayninh" target="_blank" rel="noreferrer" style={{ color: '#cbd5e1', textDecoration: 'none' }}>youtube.com/@vnptayninh</a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── 3. BOTTOM COPYRIGHT BAR ── */}
        <div style={{ 
          paddingTop: '24px', 
          borderTop: '1px solid rgba(56, 182, 255, 0.2)',
          textAlign: 'center',
          fontSize: '0.88rem',
          color: '#94a3b8',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div>
            © 2026 Viễn Thông Tây Ninh. Tất cả quyền được bảo lưu.
          </div>
          {/* FUTURISTIC CYBER BOTTOM DECORATION */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.6 }}>
            <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#38BDF8', boxShadow: '0 0 6px #38BDF8' }} />
            <div style={{ width: '40px', height: '1px', background: 'linear-gradient(90deg, #38BDF8, transparent)' }} />
            <span style={{ fontSize: '0.75rem', color: '#38BDF8', letterSpacing: '1px' }}>VNPT TÂY NINH INFRASTRUCTURE CENTER</span>
            <div style={{ width: '40px', height: '1px', background: 'linear-gradient(90deg, transparent, #38BDF8)' }} />
            <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#38BDF8', boxShadow: '0 0 6px #38BDF8' }} />
          </div>
        </div>
      </div>
    </footer>
  );
}
