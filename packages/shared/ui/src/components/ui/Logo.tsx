import React from "react";

interface LogoProps {
  /** Size of the logo */
  size?: "sm" | "md" | "lg" | "xl";
  /** Custom className for additional styling */
  className?: string;
  /** Whether to show the company name next to logo */
  showText?: boolean;
  /** Custom alt text for accessibility */
  alt?: string;
}

const sizeMap = {
  sm: {
    container: "w-6 h-6",
    image: "w-4 h-4",
    text: "text-sm",
    logo: "/axiologic_logo_32.png",
  },
  md: {
    container: "w-8 h-8",
    image: "w-6 h-6",
    text: "text-base",
    logo: "/axiologic_logo_64.png",
  },
  lg: {
    container: "w-10 h-10",
    image: "w-8 h-8",
    text: "text-lg",
    logo: "/axiologic_logo_128.png",
  },
  xl: {
    container: "w-12 h-12",
    image: "w-10 h-10",
    text: "text-xl",
    logo: "/axiologic_logo_256.png",
  },
};

export function Logo({
  size = "md",
  className = "",
  showText = false,
  alt = "Axiologic Logo",
}: LogoProps) {
  const sizeConfig = sizeMap[size];

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Logo container with white background for dark mode */}
      <div
        className={`
        ${sizeConfig.container} 
        bg-white 
        rounded-lg 
        flex 
        items-center 
        justify-center
        shadow-sm
        p-1
      `}
      >
        <img
          src={sizeConfig.logo}
          alt={alt}
          className={`${sizeConfig.image} object-contain`}
          onError={(e) => {
            // Fallback to smaller logo if the requested size fails to load
            const target = e.target as HTMLImageElement;
            if (target.src !== "/axiologic_logo_32.png") {
              target.src = "/axiologic_logo_32.png";
            }
          }}
        />
      </div>

      {/* Company name text */}
      {showText && (
        <span
          className={`
          ${sizeConfig.text} 
          font-semibold 
          text-gray-900 
          dark:text-white
          truncate
        `}
        >
          Axiologic
        </span>
      )}
    </div>
  );
}

export default Logo;
