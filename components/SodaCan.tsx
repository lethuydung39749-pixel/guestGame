import React from 'react';
import { BrandId } from '../types';
import { BRANDS } from '../constants';

interface SodaCanProps {
  brandId: BrandId | null;
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  isHidden?: boolean; // For the mystery cans
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>) => void;
  className?: string;
}

export const SodaCan: React.FC<SodaCanProps> = ({ 
  brandId, 
  onClick, 
  selected, 
  disabled,
  size = 'md',
  isHidden = false,
  draggable = false,
  onDragStart,
  className = ''
}) => {
  const brand = BRANDS.find(b => b.id === brandId);

  // Size classes
  const sizeClasses = {
    xs: 'w-7 h-11 md:w-8 md:h-14',
    sm: 'w-9 h-14 md:w-12 md:h-20',
    md: 'w-12 h-20 md:w-16 md:h-24',
    lg: 'w-20 h-32'
  };

  const containerClasses = `
    relative 
    ${sizeClasses[size]} 
    transition-transform duration-200 
    ${selected ? 'scale-110 -translate-y-2' : draggable && !disabled ? 'hover:scale-105 active:scale-95 cursor-grab active:cursor-grabbing' : ''}
    ${disabled ? 'opacity-80 cursor-not-allowed' : ''}
    ${!disabled && !draggable ? 'cursor-pointer hover:scale-105' : ''}
    flex items-center justify-center select-none
    z-10
    ${className}
  `;

  // Shadow for the table surface
  const shadowClass = isHidden ? '' : 'drop-shadow-2xl';

  if (isHidden) {
    return (
      <div className={`${containerClasses}`}>
        {/* Mystery Box / Cloth Cover */}
        <div className="absolute inset-0 bg-slate-800 rounded-lg shadow-xl border border-slate-700 flex items-center justify-center overflow-hidden transform rotate-1">
           <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent"></div>
           <span className={`font-bold text-slate-600 ${size === 'xs' ? 'text-lg' : 'text-xl md:text-3xl'}`}>?</span>
        </div>
        {/* Table shadow for the box */}
        <div className="absolute -bottom-1 w-[90%] h-2 bg-black/40 blur-sm rounded-[100%] -z-10"></div>
      </div>
    );
  }

  if (!brandId || !brand) {
    // Empty Slot Placeholder (Mat marking)
    return (
      <div 
        onClick={!disabled ? onClick : undefined}
        className={`${containerClasses} !scale-100 hover:!scale-100`}
      >
        <div className="w-full h-full rounded-full border-2 border-dashed border-white/10 bg-black/20 backdrop-blur-sm flex items-center justify-center">
          <div className="w-[80%] h-[80%] rounded-full bg-black/10"></div>
        </div>
      </div>
    );
  }

  return (
    <div 
      onClick={!disabled ? onClick : undefined}
      draggable={draggable && !disabled}
      onDragStart={!disabled ? onDragStart : undefined}
      className={`${containerClasses} ${shadowClass}`}
      role="button"
      aria-label={`Select ${brand.name}`}
    >
      {/* Can Body (SVG for better control) */}
      <svg 
        viewBox="0 0 60 100" 
        className="w-full h-full pointer-events-none filter drop-shadow-xl"
        style={{ overflow: 'visible' }}
      >
        {/* Can Cylinder */}
        <path 
          d="M5,15 L5,85 A25,8 0 0,0 55,85 L55,15" 
          fill={brand.color} 
          stroke="none"
        />
        
        {/* Top Rim (Back) */}
        <ellipse cx="30" cy="15" rx="25" ry="8" fill={brand.accent} />
        
        {/* Body Gradient/Shine */}
        <path 
          d="M5,15 L5,85 A25,8 0 0,0 55,85 L55,15" 
          fill="url(#shine)" 
          opacity="0.3" 
          style={{ mixBlendMode: 'overlay' }}
        />

        {/* Top Rim (Front/Lid) */}
        <ellipse cx="30" cy="15" rx="23" ry="6" fill="#e2e8f0" />
        <ellipse cx="30" cy="15" rx="21" ry="5" fill="#cbd5e1" />
        
        {/* Tab */}
        <rect x="26" y="10" width="8" height="10" rx="2" fill="#94a3b8" />

        {/* Label Area */}
        <rect x="5" y="30" width="50" height="40" fill={brand.accent} opacity="0.9" />
        
        {/* Logo Text */}
        <text 
          x="30" 
          y="56" 
          textAnchor="middle" 
          fill={brand.textColor} 
          fontSize="20" 
          fontWeight="bold" 
          fontFamily="sans-serif"
          style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}
        >
          {brand.icon}
        </text>

        {/* Definitions */}
        <defs>
          <linearGradient id="shine" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="black" stopOpacity="0.5" />
            <stop offset="15%" stopColor="white" stopOpacity="0.1" />
            <stop offset="30%" stopColor="white" stopOpacity="0.6" />
            <stop offset="40%" stopColor="white" stopOpacity="0.1" />
            <stop offset="100%" stopColor="black" stopOpacity="0.6" />
          </linearGradient>
        </defs>
      </svg>
      
      {/* Bottom Contact Shadow (Simulates sitting on table) */}
      <div className="absolute -bottom-1 md:-bottom-2 left-1/2 -translate-x-1/2 w-[90%] h-3 bg-black/60 blur-md rounded-[100%] -z-10"></div>

      {selected && (
         <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rounded-full animate-bounce shadow-glow z-20" />
      )}
    </div>
  );
};