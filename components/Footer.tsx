import React from 'react';

// Simple SVG component for the X logo
const XLogo = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    aria-hidden="true" 
    className={className}
    fill="currentColor"
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const Footer: React.FC = () => {
  return (
    <footer className="fixed bottom-4 left-0 w-full flex justify-center z-40 pointer-events-none">
      <a 
        href="https://x.com/ej3mplo" 
        target="_blank" 
        rel="noopener noreferrer"
        className="pointer-events-auto bg-black/50 backdrop-blur-md border border-zinc-800 text-zinc-400 px-4 py-2 rounded-full flex items-center gap-2 hover:text-white hover:border-white transition-all text-sm"
      >
        <XLogo className="w-4 h-4" />
        <span>@ej3mplo</span>
      </a>
    </footer>
  );
};

export default Footer;