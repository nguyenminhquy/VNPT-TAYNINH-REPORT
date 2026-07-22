import React from 'react';

export default function VnptLogo({ className = "", style = {} }: { className?: string; style?: React.CSSProperties }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img 
      src="/vnpt-logo-new.png" 
      alt="VNPT Logo" 
      className={className} 
      style={{ objectFit: 'contain', ...style }} 
    />
  );
}
