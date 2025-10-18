import React from 'react';

const CogIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12a7.5 7.5 0 0 0 15 0m-15 0a7.5 7.5 0 1 1 15 0m-15 0H3m18 0h-1.5m-15 0a7.5 7.5 0 1 1 15 0m-15 0h-1.5m15 0h1.5m-16.5 5.25L6 18.75m12-3.5L18 18.75m-12-13.5L6 5.25m12 3.5L18 5.25m-12 0L4.5 3.75m15 1.5L19.5 3.75m-15 16.5L4.5 20.25m15-1.5L19.5 20.25" />
    </svg>
);

export default CogIcon;
