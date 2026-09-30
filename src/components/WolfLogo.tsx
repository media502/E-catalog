import React from 'react';
import officialLogoImg from '../assets/images/logo_App.png';

interface WolfLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export const WolfLogo: React.FC<WolfLogoProps> = ({
  className = '',
  size = 'md',
}) => {
  const sizeMap = {
    sm: 'h-10 w-auto max-h-10',
    md: 'h-14 w-auto max-h-14',
    lg: 'h-20 w-auto max-h-20',
    xl: 'h-28 w-auto max-h-28',
    '2xl': 'h-36 w-auto max-h-36',
  };

  return (
    <div className={`inline-flex items-center select-none ${className}`}>
      {/* Exact uploaded official logo only without duplicate text */}
      <img
        src={officialLogoImg}
        alt="WOLF CAR"
        className={`${sizeMap[size]} object-contain`}
        referrerPolicy="no-referrer"
      />
    </div>
  );
};
