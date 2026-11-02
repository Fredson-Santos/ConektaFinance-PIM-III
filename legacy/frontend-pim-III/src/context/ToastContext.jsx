import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success', duration = 3000) => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, duration);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-container" style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {toasts.map(toast => {
          let borderClass = 'toast-success';
          if (toast.type === 'error') borderClass = 'toast-error';
          if (toast.type === 'warning') borderClass = 'toast-warning';

          return (
            <div 
              key={toast.id} 
              className={`toast ${borderClass}`}
              style={{
                background: 'var(--white)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '1rem 1.4rem',
                maxWidth: '400px',
                boxShadow: '0 2px 12px rgba(0, 0, 0, 0.1)',
                borderLeftWidth: '4px',
                borderLeftStyle: 'solid',
                borderLeftColor: toast.type === 'error' ? 'var(--red-400)' : 
                                 toast.type === 'warning' ? 'var(--amber-400)' : 'var(--teal-400)'
              }}
            >
              {toast.message}
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
