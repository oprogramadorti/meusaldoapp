import React from 'react';

const LogoIcon: React.FC<{ className?: string }> = ({ className = "w-8 h-8" }) => (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <rect width="80" height="80" rx="16" fill="#16A34A"/>
        <g stroke="white" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
            {/* Plus Icon */}
            <path d="M20 22V34"/>
            <path d="M26 28H14"/>
            {/* New Graph */}
            <path d="M22 62 H 56 V 48" />
            <path d="M28 52 L 42 58 L 62 36" />
            <path d="M54 36 L 62 36 L 62 44" />
        </g>
    </svg>
);

export default LogoIcon;