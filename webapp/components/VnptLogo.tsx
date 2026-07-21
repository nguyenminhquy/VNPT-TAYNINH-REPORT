import React from 'react';

export default function VnptLogo({ className = "", style = {} }: { className?: string; style?: React.CSSProperties }) {
  return (
    <img 
      src="/vnpt-logo-new.png" 
      alt="VNPT Logo" 
      className={className} 
      style={{ objectFit: 'contain', ...style }} 
    />
  );
}
