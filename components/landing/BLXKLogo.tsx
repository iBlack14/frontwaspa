'use client';

interface BLXKLogoProps {
  variant?: 'compact' | 'full' | 'text-only';
  className?: string;
}

export default function BLXKLogo({ variant = 'compact', className = '' }: BLXKLogoProps) {
  if (variant === 'text-only') {
    return (
      <span className={`text-xl font-bold text-white ${className}`}>
        BLXK
      </span>
    );
  }

  if (variant === 'full') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {/* Logo Icon */}
        <div className="relative w-8 h-8">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-lg transform -rotate-3"></div>
          <svg 
            viewBox="0 0 32 32" 
            className="relative w-8 h-8 text-black"
            fill="currentColor"
          >
            <path d="M8 8h8v8H8z"/>
            <path d="M16 8h8v8h-8z"/>
            <path d="M8 16h8v8H8z"/>
            <path d="M16 16h8v8h-8z"/>
          </svg>
        </div>
        <div>
          <div className="text-lg font-bold text-white">BLXK</div>
          <div className="text-xs text-gray-400 leading-none">Connect</div>
        </div>
      </div>
    );
  }

  // Compact variant (default)
  return (
    <div className={`relative group cursor-pointer ${className}`}>
      <div className="p-2 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-xl group-hover:shadow-lg group-hover:shadow-emerald-500/50 transition-all duration-300">
        <svg 
          viewBox="0 0 32 32" 
          className="w-6 h-6 text-black"
          fill="currentColor"
        >
          <path d="M8 8h8v8H8z"/>
          <path d="M16 8h8v8h-8z"/>
          <path d="M8 16h8v8H8z"/>
          <path d="M16 16h8v8h-8z"/>
        </svg>
      </div>
    </div>
  );
}
