'use client';

import React from 'react';
import { 
  Globe, 
  ChevronUp 
} from 'lucide-react';
import './Footer.css';

const FacebookIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047v-2.66c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.971H15.83c-1.491 0-1.956.93-1.956 1.886v2.264h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
  </svg>
);

const YoutubeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

export default function Footer() {
  const scrollToTop = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <footer className="vnpt-official-footer">
      {/* ── 1. GIANT WATERMARK VNPT LOGO ON THE RIGHT ── */}
      <div className="footer-watermark-bg">
        <svg width="600" height="600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z" fill="#FFFFFF" fillOpacity="0.4"/>
          <path d="M17.5 6.5C14.5 3.5 9.5 3.5 6.5 6.5C4.5 8.5 3.8 11.2 4.4 13.7" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M6.5 17.5C9.5 20.5 14.5 20.5 17.5 17.5C19.5 15.5 20.2 12.8 19.6 10.3" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round"/>
          <circle cx="12" cy="12" r="3.5" fill="#FFFFFF"/>
        </svg>
      </div>

      {/* ── 2. MAIN 5-COLUMN CONTAINER ── */}
      <div className="footer-container-grid">
        {/* COLUMN 1: COMPANY BRAND & CONTACT */}
        <div className="footer-col-brand">
          <div className="brand-header-row">
            <div className="vnpt-logo-icon-box">
              <svg width="46" height="46" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z" fill="#FFFFFF" fillOpacity="0.25"/>
                <path d="M17.5 6.5C14.5 3.5 9.5 3.5 6.5 6.5C4.5 8.5 3.8 11.2 4.4 13.7" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round"/>
                <path d="M6.5 17.5C9.5 20.5 14.5 20.5 17.5 17.5C19.5 15.5 20.2 12.8 19.6 10.3" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round"/>
                <circle cx="12" cy="12" r="3.5" fill="#FFFFFF"/>
              </svg>
            </div>
            <h1 className="brand-name-main">VNPT - TÂY NINH</h1>
          </div>

          <div className="brand-subtitle-official">
            VIỄN THÔNG TÂY NINH
          </div>

          <div className="brand-contact-list">
            <div className="contact-row">
              <strong>Địa chỉ trụ sở:</strong> 
              <span>Số 168, Đường 30/4, P.3, TP. Tây Ninh, Tỉnh Tây Ninh</span>
            </div>
            <div className="contact-row">
              <strong>Điện thoại:</strong> 
              <a href="tel:0276800126">0276 800 126</a>
            </div>
            <div className="contact-row">
              <strong>Email:</strong> 
              <a href="mailto:lienhe@vnpttayninh.vn">lienhe@vnpttayninh.vn</a>
            </div>
          </div>
        </div>

        {/* COLUMN 2: GIỚI THIỆU */}
        <div className="footer-col-nav">
          <h2 className="col-heading">GIỚI THIỆU</h2>
          <ul className="nav-links-list">
            <li><a href="#khach-hang">Khách hàng</a></li>
            <li><a href="#tam-nhin-su-menh">Tầm nhìn, Sứ mệnh</a></li>
            <li><a href="#doi-tac">Đối tác</a></li>
            <li><a href="#gioi-thieu-chung">Giới thiệu chung</a></li>
            <li><a href="#co-cau-to-chuc">Cơ cấu tổ chức</a></li>
            <li><a href="#nguon-luc">Nguồn lực</a></li>
          </ul>
        </div>

        {/* COLUMN 3: TIN TỨC */}
        <div className="footer-col-nav">
          <h2 className="col-heading">TIN TỨC</h2>
          <ul className="nav-links-list">
            <li><a href="#tin-vnpt">Tin VNPT</a></li>
            <li><a href="#phan-hoi-khach-hang">Phản hồi của khách hàng</a></li>
            <li><a href="#tin-vnpt-tay-ninh">Tin VNPT Tây Ninh</a></li>
          </ul>
        </div>

        {/* COLUMN 4: SẢN PHẨM - DỊCH VỤ */}
        <div className="footer-col-nav">
          <h2 className="col-heading">SẢN PHẨM - DỊCH VỤ</h2>
          <ul className="nav-links-list">
            <li><a href="#chinh-phu-so">Chính phủ số</a></li>
            <li><a href="#gia-phap-doanh-nghiep">Giải pháp số Doanh nghiệp</a></li>
            <li><a href="#giao-duc-so">Giải pháp Giáo dục số</a></li>
            <li><a href="#y-te-so">Giải pháp Y tế số</a></li>
            <li><a href="#an-toan-bao-mat">An toàn bảo mật</a></li>
          </ul>
        </div>

        {/* COLUMN 5: KẾT NỐI */}
        <div className="footer-col-connect">
          <h2 className="col-heading">KẾT NỐI</h2>
          <div className="social-icons-row">
            <a 
              href="https://facebook.com/vnpttayninh" 
              target="_blank" 
              rel="noreferrer" 
              className="social-circle-btn fb"
              title="Facebook VNPT Tây Ninh"
            >
              <FacebookIcon />
            </a>
            <a 
              href="https://youtube.com/@vnpttayninh" 
              target="_blank" 
              rel="noreferrer" 
              className="social-circle-btn yt"
              title="YouTube VNPT Tây Ninh"
            >
              <YoutubeIcon />
            </a>
            <a 
              href="https://vnpttayninh.vn" 
              target="_blank" 
              rel="noreferrer" 
              className="social-circle-btn web"
              title="Website VNPT Tây Ninh"
            >
              <Globe size={20} />
            </a>
          </div>
        </div>
      </div>

      {/* ── 3. BOTTOM COPYRIGHT & SCROLL TO TOP ── */}
      <div className="footer-bottom-bar">
        <p className="copyright-text">
          © 2026 Viễn Thông Tây Ninh. Tất cả quyền được bảo lưu.
        </p>
        <button 
          onClick={scrollToTop} 
          className="scroll-to-top-btn" 
          title="Lên đầu trang"
          aria-label="Lên đầu trang"
        >
          <ChevronUp size={24} strokeWidth={2.5} />
        </button>
      </div>
    </footer>
  );
}
