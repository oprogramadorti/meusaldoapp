import React from 'react';

const FingerPrintIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.864 4.243A7.5 7.5 0 0 1 19.5 12c0 .23-.01.458-.029.683M16.837 18.31A7.5 7.5 0 0 1 4.5 12c0-4.142 3.358-7.5 7.5-7.5 2.253 0 4.285 1.002 5.663 2.636" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a.75.75 0 0 1 .75-.75h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75h-.008a.75.75 0 0 1-.75-.75v-.008Zm-3.375-3.375a.75.75 0 0 1 .75-.75h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75h-.008a.75.75 0 0 1-.75-.75v-.008Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15a.75.75 0 0 1 .75-.75h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75h-.008a.75.75 0 0 1-.75-.75v-.008Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.75.75 0 0 1 .75-.75h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75h-.008a.75.75 0 0 1-.75-.75V12Zm0 3.375a.75.75 0 0 1 .75-.75h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75h-.008a.75.75 0 0 1-.75-.75v-.008Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 12a.75.75 0 0 1 .75-.75h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75H6a.75.75 0 0 1-.75-.75V12Z" />
    </svg>
);

export default FingerPrintIcon;
