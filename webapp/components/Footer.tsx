'use client';

import React from 'react';
import { 
  Building2, 
  Info, 
  Box, 
  Phone, 
  PhoneCall,
  MapPin, 
  Mail, 
  Globe2, 
  Share2, 
  Facebook, 
  Youtube, 
  ShieldCheck 
} from 'lucide-react';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="vnpt-modern-footer">
      {/* ==========================================================================
          A. BRAND / HERO AREA
          ========================================================================== */}
      <section className="footer-hero">
        {/* Decorative Background Layers */}
        <div className="hero-bg-left" />
        <div className="hero-bg-right" />

        <div className="hero-content">
          {/* VNPT Logo Box */}
          <div className="vnpt-logo-badge">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z" fill="#FFFFFF" fillOpacity="0.25"/>
              <path d="M17.5 6.5C14.5 3.5 9.5 3.5 6.5 6.5C4.5 8.5 3.8 11.2 4.4 13.7" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M6.5 17.5C9.5 20.5 14.5 20.5 17.5 17.5C19.5 15.5 20.2 12.8 19.6 10.3" stroke="#00B8F4" strokeWidth="2.5" strokeLinecap="round"/>
              <circle cx="12" cy="12" r="3.5" fill="#FFFFFF" filter="drop-shadow(0 0 4px #00B8F4)"/>
            </svg>
          </div>

          {/* Brand Title */}
          <h1 className="brand-title">
            VIỄN THÔNG TÂY NINH
          </h1>

          {/* Tagline with glowing line separators */}
          <div className="brand-slogan-wrapper">
            <div className="slogan-line" />
            <div style={{ position: 'relative' }}>
              <p className="brand-slogan">Kết nối công nghệ - Kiến tạo tương lai</p>
              <div className="slogan-glow" />
            </div>
            <div className="slogan-line right" />
          </div>
        </div>
      </section>

      {/* ==========================================================================
          B. WAVE TRANSITION (Multi-layer Curved Ribbon)
          ========================================================================== */}
      <div className="footer-wave-container">
        <svg 
          className="footer-wave-svg" 
          viewBox="0 0 1440 120" 
          fill="none" 
          preserveAspectRatio="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Layer 1: Cyan (#00B8F4) with glowing stroke */}
          <path 
            d="M0,30 C320,100 480,-20 800,50 C1120,120 1280,10 1440,60 L1440,120 L0,120 Z" 
            fill="#00B8F4" 
            fillOpacity="0.35"
          />
          <path 
            d="M0,30 C320,100 480,-20 800,50 C1120,120 1280,10 1440,60" 
            stroke="#00C8FF" 
            strokeWidth="3" 
            filter="drop-shadow(0 0 8px #00C8FF)"
          />
          {/* Layer 2: Royal Blue (#0072E8) */}
          <path 
            d="M0,55 C240,110 560,20 900,75 C1180,115 1320,45 1440,80 L1440,120 L0,120 Z" 
            fill="#0072E8" 
            fillOpacity="0.6"
          />
          {/* Layer 3: Navy (#021B4D) */}
          <path 
            d="M0,75 C360,125 600,40 1000,90 C1240,115 1360,70 1440,95 L1440,120 L0,120 Z" 
            fill="#021B4D"
          />
        </svg>
      </div>

      {/* ==========================================================================
          C. INFORMATION AREA (3-Columns Grid)
          ========================================================================== */}
      <section className="footer-info-section">
        {/* Depth & Decorative Tech Backgrounds */}
        <div className="info-radial-depth" />
        <div className="info-bg-skyline" />
        <div className="info-bg-circuit" />

        <div className="footer-grid-container">
          {/* ── CỘT 1: VỀ CHÚNG TÔI ── */}
          <div className="footer-col col-about">
            <div className="col-header">
              <div className="col-header-top">
                <div className="col-header-icon">
                  <Building2 size={26} strokeWidth={2.2} />
                </div>
                <h2 className="col-title">VỀ CHÚNG TÔI</h2>
              </div>
              <div className="col-underline" />
            </div>

            <div className="about-list">
              <div className="about-item">
                <div className="about-icon-wrap">
                  <Building2 size={22} />
                </div>
                <span>VNPT Group</span>
              </div>
              <div className="about-item">
                <div className="about-icon-wrap">
                  <Info size={22} />
                </div>
                <span>Giới thiệu</span>
              </div>
              <div className="about-item">
                <div className="about-icon-wrap">
                  <Box size={22} />
                </div>
                <span>Dịch vụ</span>
              </div>
            </div>
          </div>

          {/* ── CỘT 2: THÔNG TIN LIÊN HỆ ── */}
          <div className="footer-col col-contact">
            <div className="col-header">
              <div className="col-header-top">
                <div className="col-header-icon">
                  <PhoneCall size={26} strokeWidth={2.2} />
                </div>
                <h2 className="col-title">THÔNG TIN LIÊN HỆ</h2>
              </div>
              <div className="col-underline" />
            </div>

            <div className="contact-list">
              {/* Địa chỉ */}
              <div className="contact-item">
                <div className="contact-icon-wrap">
                  <MapPin size={22} />
                </div>
                <div className="contact-text-wrap">
                  <span className="contact-label">Địa chỉ:</span>
                  <span className="contact-value">
                    Số 168, Đường 30/4, P.3, TP. Tây Ninh, Tỉnh Tây Ninh
                  </span>
                </div>
              </div>

              {/* Email */}
              <div className="contact-item">
                <div className="contact-icon-wrap">
                  <Mail size={22} />
                </div>
                <div className="contact-text-wrap">
                  <span className="contact-label">Email:</span>
                  <a href="mailto:lienhe@vnpttayninh.vn" className="contact-link">
                    lienhe@vnpttayninh.vn
                  </a>
                </div>
              </div>

              {/* Điện thoại */}
              <div className="contact-item">
                <div className="contact-icon-wrap">
                  <Phone size={22} />
                </div>
                <div className="contact-text-wrap">
                  <span className="contact-label">Điện thoại:</span>
                  <a href="tel:0276800126" className="contact-link">
                    0276 800 126
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* ── CỘT 3: KẾT NỐI ── */}
          <div className="footer-col col-connect">
            <div className="col-header">
              <div className="col-header-top">
                <div className="col-header-icon">
                  <Share2 size={26} strokeWidth={2.2} />
                </div>
                <h2 className="col-title">KẾT NỐI</h2>
              </div>
              <div className="col-underline" />
            </div>

            <div className="connect-list">
              {/* Website */}
              <a 
                href="https://vnpttayninh.vn" 
                target="_blank" 
                rel="noreferrer" 
                className="connect-item"
              >
                <div className="connect-icon-round blue-tone">
                  <Globe2 size={22} />
                </div>
                <div className="connect-text-wrap">
                  <span className="connect-name">Website</span>
                  <span className="connect-url">https://vnpttayninh.vn</span>
                </div>
              </a>

              {/* Facebook */}
              <a 
                href="https://facebook.com/vnpttayninh" 
                target="_blank" 
                rel="noreferrer" 
                className="connect-item"
              >
                <div className="connect-icon-round blue-tone">
                  <Facebook size={22} />
                </div>
                <div className="connect-text-wrap">
                  <span className="connect-name">Facebook</span>
                  <span className="connect-url">facebook.com/vnpttayninh</span>
                </div>
              </a>

              {/* Youtube */}
              <a 
                href="https://youtube.com/@vnpttayninh" 
                target="_blank" 
                rel="noreferrer" 
                className="connect-item"
              >
                <div className="connect-icon-round red-tone">
                  <Youtube size={22} />
                </div>
                <div className="connect-text-wrap">
                  <span className="connect-name">YouTube</span>
                  <span className="connect-url">youtube.com/@vnpttayninh</span>
                </div>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================================================
          D. COPYRIGHT BAR
          ========================================================================== */}
      <div className="footer-copyright-bar">
        <div className="copyright-inner">
          <span className="copyright-icon">
            <ShieldCheck size={20} strokeWidth={2.2} />
          </span>
          <span className="copyright-text">
            © 2026 Viễn Thông Tây Ninh. Tất cả quyền được bảo lưu.
          </span>
        </div>
      </div>
    </footer>
  );
}
