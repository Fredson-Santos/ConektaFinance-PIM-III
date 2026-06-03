import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { AuthService } from '../../services/api';

export const Layout = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadedUser = AuthService.loadUser();
    setUser(loadedUser);
  }, []);

  const handleLogout = () => {
    AuthService.logout();
    navigate('/login');
  };

  const userName = user?.fullName || 'Usuário';

  return (
    <>
      <a href="#main-content" className="skip-link">Pular para o conteúdo principal</a>

      <button className={`mobile-menu-toggle ${isMobileMenuOpen ? 'active' : ''}`} onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} aria-label="Abrir menu">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="12" x2="21" y2="12" className="line-mid"></line>
          <line x1="3" y1="6" x2="21" y2="6" className="line-top"></line>
          <line x1="3" y1="18" x2="21" y2="18" className="line-bot"></line>
        </svg>
      </button>

      <div className={`sidebar-overlay ${isMobileMenuOpen ? 'active' : ''}`} onClick={() => setIsMobileMenuOpen(false)}></div>

      <aside className={`sidebar ${isMobileMenuOpen ? 'active' : ''}`} role="navigation" aria-label="Menu principal">
        <div className="logo">
          <div className="logo-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="#27500A" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          </div>
          <span className="logo-name">ConektaFinance</span>
        </div>

        <span className="nav-label">Principal</span>
        <NavLink to="/" onClick={() => setIsMobileMenuOpen(false)} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} end>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
            <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
          Dashboard
        </NavLink>
        <NavLink to="/gastos" onClick={() => setIsMobileMenuOpen(false)} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
            <path d="M12 8v4l3 3" />
          </svg>
          Gastos
        </NavLink>
        <NavLink to="/categorias" onClick={() => setIsMobileMenuOpen(false)} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
            <path d="M3 7h18M3 12h18M3 17h18" />
          </svg>
          Categorias
        </NavLink>

        <span className="nav-label">Análise</span>
        <NavLink to="/relatorios" onClick={() => setIsMobileMenuOpen(false)} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
            <path d="M18 20V10M12 20V4M6 20v-6" />
          </svg>
          Relatórios
        </NavLink>
        <NavLink to="/alertas" onClick={() => setIsMobileMenuOpen(false)} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          Alertas
        </NavLink>
        <NavLink to="/insights" onClick={() => setIsMobileMenuOpen(false)} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
            <circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/>
          </svg>
          Assistente de IA
        </NavLink>

        <div className="sidebar-bottom">
          <div className="user-pill" role="button" tabIndex="0" onClick={handleLogout} aria-label="Informações do usuário. Clique para sair">
            <div className="avatar" aria-hidden="true" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '18px', height: '18px' }}>
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div className="user-info">
              <div className="name">{userName}</div>
            </div>
            <div className="btn-logout" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px' }}>
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </div>
          </div>
        </div>
      </aside>

      <main className="main" id="main-content" role="main">
        <Outlet />
      </main>
    </>
  );
};
