export function Logo({ className = '', showSubtitle = true, size = 'md' }: { className?: string; showSubtitle?: boolean; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: { icon: 32, text: 'text-xl', subtitle: 'text-[9px]' },
    md: { icon: 40, text: 'text-2xl', subtitle: 'text-[10px]' },
    lg: { icon: 48, text: 'text-3xl', subtitle: 'text-xs' },
  };
  
  const currentSize = sizes[size];
  
  return (
    <div className={`flex items-center gap-2 md:gap-3 ${className}`} style={{ lineHeight: '1' }}>
      {/* Modern Education/Book Icon with animated gradient */}
      <div className="relative group">
        <svg
          width={currentSize.icon}
          height={currentSize.icon}
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
        >
          {/* Book base with gradient */}
          <path
            d="M8 6C8 4.89543 8.89543 4 10 4H30C31.1046 4 32 4.89543 32 6V34C32 35.1046 31.1046 36 30 36H10C8.89543 36 8 35.1046 8 34V6Z"
            fill="url(#bookGradient)"
            className="transition-all duration-500"
          />
          {/* Pages with subtle animation */}
          <path
            d="M12 8V32M16 8V32M20 8V32M24 8V32M28 8V32"
            stroke="url(#pageGradient)"
            strokeWidth="1.5"
            strokeLinecap="round"
            className="opacity-60"
          />
          {/* Sparkle effects */}
          <circle 
            cx="28" 
            cy="12" 
            r="2" 
            fill="url(#sparkleGradient)" 
            className="animate-ping opacity-75" 
            style={{ animationDuration: '2s' }} 
          />
          <circle 
            cx="12" 
            cy="20" 
            r="1.5" 
            fill="url(#sparkleGradient)" 
            className="animate-ping opacity-75" 
            style={{ animationDuration: '3s', animationDelay: '0.5s' }} 
          />
          {/* Decorative corner accent */}
          <path
            d="M30 6L34 10L30 14L26 10Z"
            fill="url(#accentGradient)"
            opacity="0.6"
          />
          
          <defs>
            <linearGradient id="bookGradient" x1="8" y1="4" x2="32" y2="36" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#8B5CF6" />
              <stop offset="50%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#06B6D4" />
            </linearGradient>
            <linearGradient id="pageGradient" x1="12" y1="8" x2="28" y2="32" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.7" />
            </linearGradient>
            <linearGradient id="sparkleGradient" x1="0" y1="0" x2="4" y2="4" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FCD34D" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>
            <linearGradient id="accentGradient" x1="26" y1="6" x2="34" y2="14" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#EC4899" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.8" />
            </linearGradient>
          </defs>
        </svg>
        {/* Animated glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-400/40 via-blue-400/30 to-cyan-400/40 blur-xl rounded-full -z-10 animate-pulse opacity-75" />
      </div>
      
      {/* Text with enhanced styling */}
      <div className="flex flex-col justify-center -mt-2 md:-mt-2.5" style={{ lineHeight: '1.2', transform: 'translateY(-2px)' }}>
        <span className={`${currentSize.text} font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent font-poppins tracking-tight transition-all duration-300 group-hover:from-purple-300 group-hover:via-blue-300 group-hover:to-cyan-300 leading-tight`}>
          LMS Studio
        </span>
        {showSubtitle && (
          <span className={`${currentSize.subtitle} text-purple-300/70 font-semibold tracking-widest uppercase leading-tight -mt-0.5`}>
            Learning Platform
          </span>
        )}
      </div>
    </div>
  );
}

