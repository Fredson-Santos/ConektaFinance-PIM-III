import React from 'react';

export const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const baseClass = variant === 'secondary' ? 'btn-secondary' : 'btn-primary';
  
  return (
    <button className={`${baseClass} ${className}`} {...props}>
      {children}
    </button>
  );
};
