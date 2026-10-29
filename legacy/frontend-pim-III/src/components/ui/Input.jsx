import React, { forwardRef } from 'react';

export const Input = forwardRef(({ label, id, prefix, className = '', containerStyle = {}, ...props }, ref) => {
  return (
    <div className="field" style={containerStyle}>
      {label && <label htmlFor={id}>{label}</label>}
      {prefix ? (
        <div className="amount-field">
          <span className="prefix" aria-hidden="true">{prefix}</span>
          <input id={id} ref={ref} className={className} {...props} />
        </div>
      ) : (
        <input id={id} ref={ref} className={className} {...props} />
      )}
    </div>
  );
});

Input.displayName = 'Input';
