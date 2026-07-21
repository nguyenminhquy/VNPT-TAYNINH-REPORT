import React from 'react';

export default function VnptLogo({ className = "", style = {} }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg 
      className={className} 
      style={style} 
      viewBox="0 0 200 60" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <text 
        x="0" 
        y="45" 
        fontFamily="'Arial', 'Helvetica', sans-serif" 
        fontWeight="900" 
        fontStyle="italic"
        fontSize="48" 
        fill="#005BAA"
        letterSpacing="-1.5"
      >
        VNPT
      </text>
    </svg>
  );
}
