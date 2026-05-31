import React from 'react';

export const Card = ({ children, className = '', accent = null, ...props }) => {
  const accentClass = accent ? `accent-${accent}` : '';
  
  return (
    <section className={`metric-card ${accentClass} ${className}`} {...props}>
      {children}
    </section>
  );
};
