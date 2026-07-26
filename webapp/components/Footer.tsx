'use client';

import React from 'react';
import { 
  Facebook, 
  Youtube, 
  Globe, 
  ChevronUp 
} from 'lucide-react';
import './Footer.css';

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
              <Facebook size={20} fill="currentColor" />
            </a>
            <a 
              href="https://youtube.com/@vnpttayninh" 
              target="_blank" 
              rel="noreferrer" 
              className="social-circle-btn yt"
              title="YouTube VNPT Tây Ninh"
            >
              <Youtube size={20} fill="currentColor" />
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
