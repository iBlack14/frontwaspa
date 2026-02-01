interface LogoProps {
  variant?: 'full' | 'icon' | 'wordmark';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  theme?: 'light' | 'dark';
  className?: string;
}

const sizeMap = {
  sm: { icon: 24, text: 'text-lg' },
  md: { icon: 32, text: 'text-xl' },
  lg: { icon: 40, text: 'text-2xl' },
  xl: { icon: 56, text: 'text-3xl' },
};

export default function Logo({ 
  variant = 'full', 
  size = 'md', 
  theme = 'dark',
  className = '' 
}: LogoProps) {
  const dimensions = sizeMap[size];
  const textColor = theme === 'dark' ? 'text-white' : 'text-zinc-900';
  const accentColor = '#10b981'; // Emerald-500
  
  // Icon component - Modern W + Chat bubble + Connection
  const LogoIcon = () => (
    <svg
      width={dimensions.icon}
      height={dimensions.icon}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="flex-shrink-0"
    >
      {/* Background circle with gradient */}
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        <linearGradient id="glowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34d399" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
        </linearGradient>
      </defs>
      
      {/* Outer glow ring */}
      <circle 
        cx="24" 
        cy="24" 
        r="22" 
        fill="url(#glowGradient)" 
        opacity="0.3"
      />
      
      {/* Main circle background */}
      <circle 
        cx="24" 
        cy="24" 
        r="20" 
        fill="url(#logoGradient)"
      />
      
      {/* Inner highlight arc */}
      <path
        d="M12 16 A16 16 0 0 1 36 16"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      
      {/* WhatsApp-inspired chat icon with modern W */}
      <g transform="translate(12, 12)">
        {/* Chat bubble shape */}
        <path
          d="M12 2C6.48 2 2 5.92 2 10.72c0 2.52 1.16 4.8 3.04 6.4L4 22l5.12-2.56c.88.24 1.84.4 2.88.4 5.52 0 10-3.92 10-8.72S17.52 2 12 2z"
          fill="white"
          opacity="0.95"
        />
        
        {/* Stylized W mark inside */}
        <path
          d="M7 9L9.5 15L12 10L14.5 15L17 9"
          stroke={accentColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        
        {/* Connection dots */}
        <circle cx="6" cy="13" r="1.5" fill={accentColor} opacity="0.6" />
        <circle cx="18" cy="13" r="1.5" fill={accentColor} opacity="0.6" />
      </g>
    </svg>
  );

  // Wordmark component
  const Wordmark = () => (
    <div className={`font-bold ${dimensions.text} ${textColor} tracking-tight flex items-baseline gap-0.5`}>
      <span className="text-emerald-400">Waspa</span>
      <span className={theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}>Suite</span>
    </div>
  );

  if (variant === 'icon') {
    return (
      <div className={`flex items-center ${className}`}>
        <LogoIcon />
      </div>
    );
  }

  if (variant === 'wordmark') {
    return (
      <div className={`flex items-center ${className}`}>
        <Wordmark />
      </div>
    );
  }

  // Full variant (default)
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <LogoIcon />
      <Wordmark />
    </div>
  );
}

// Alternative modern logo with different style
export function LogoModern({ 
  size = 'md',
  theme = 'dark',
  className = '' 
}: Omit<LogoProps, 'variant'>) {
  const dimensions = sizeMap[size];
  const textColor = theme === 'dark' ? 'text-white' : 'text-zinc-900';
  
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Abstract W + message icon */}
      <div className="relative">
        <div 
          className="flex items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/25"
          style={{ 
            width: dimensions.icon, 
            height: dimensions.icon 
          }}
        >
          <svg
            width={dimensions.icon * 0.6}
            height={dimensions.icon * 0.6}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Stylized W */}
            <path
              d="M4 6L8 18L12 8L16 18L20 6"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        
        {/* Small notification dot */}
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-300 rounded-full border-2 border-zinc-900" />
      </div>
      
      {/* Text */}
      <div className={`font-bold ${dimensions.text} ${textColor} tracking-tight`}>
        <span className="text-emerald-400">Waspa</span>
        <span className={theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'}>Suite</span>
      </div>
    </div>
  );
}

// Minimal logo for small spaces
export function LogoMinimal({ 
  size = 'sm',
  className = '' 
}: { size?: 'sm' | 'md'; className?: string }) {
  const iconSize = size === 'sm' ? 28 : 36;
  
  return (
    <div 
      className={`flex items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 ${className}`}
      style={{ width: iconSize, height: iconSize }}
    >
      <svg
        width={iconSize * 0.55}
        height={iconSize * 0.55}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M4 6L8 18L12 8L16 18L20 6"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
