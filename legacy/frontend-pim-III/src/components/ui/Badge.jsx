import React from 'react';

const categoryColors = {
  food: 'var(--teal-50)',
  transport: 'var(--amber-50)',
  leisure: 'var(--green-50)',
  health: 'var(--red-50)',
  housing: '#F1EFE8',
  default: '#EAF3DE'
};

const textColors = {
  food: 'var(--teal-600)',
  transport: 'var(--amber-600)',
  leisure: 'var(--green-600)',
  health: 'var(--red-600)',
  housing: '#444441',
  default: 'var(--green-600)'
};

export const Badge = ({ category, children, style = {}, className = '', ...props }) => {
  const bg = categoryColors[category] || categoryColors.default;
  const color = textColors[category] || textColors.default;

  return (
    <span 
      className={`cat-badge ${className}`} 
      style={{ backgroundColor: bg, color: color, ...style }} 
      {...props}
    >
      {children}
    </span>
  );
};
