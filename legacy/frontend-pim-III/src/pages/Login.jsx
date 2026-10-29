import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthService } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export const Login = () => {
  const [activeTab, setActiveTab] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nome, setNome] = useState('');
  const [sobrenome, setSobrenome] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [registerError, setRegisterError] = useState('');
  
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setLoginError('');
    setRegisterError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    if (!email || !password) {
      showToast('Por favor, preencha todos os campos.', 'error');
      return;
    }

    setIsLoading(true);
    try {
      await AuthService.login(email, password);
      showToast('Bem-vindo!', 'success');
      navigate('/');
    } catch (error) {
      const msg = error.message || 'E-mail ou senha incorretos.';
      setLoginError(msg);
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegisterError('');
    if (password !== confirmPassword) {
      const msg = 'As senhas não coincidem';
      setRegisterError(msg);
      showToast(msg, 'error');
      return;
    }

    setIsLoading(true);
    try {
      await AuthService.register({ fullName: `${nome} ${sobrenome}`, email, password });
      showToast('Conta criada com sucesso! Faça login para continuar.', 'success');
      
      // Limpa os campos da aba de registro e vai para o login
      setPassword('');
      setConfirmPassword('');
      handleTabChange('login');
    } catch (error) {
      const msg = error.message || 'Erro ao criar conta. Tente novamente.';
      setRegisterError(msg);
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="split" id="main-content">
      <section className="panel-left" aria-labelledby="hero-title">
        <div className="logo">
          <div className="logo-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="#27500A" strokeWidth="2" strokeLinecap="round">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
              <path d="M12 6v6l4 2"/>
            </svg>
          </div>
          <span className="logo-name">ConektaFinance</span>
        </div>

        <div className="hero-text">
          <h1 id="hero-title">Controle seu<br/>dinheiro com<br/><em>clareza.</em></h1>
          <p>Registre gastos, defina orçamentos e receba recomendações inteligentes — tudo em um só lugar.</p>
        </div>
      </section>

      <section className="panel-right" aria-labelledby="auth-heading">
        <div className="auth-box">
          <nav className="tabs" role="tablist" aria-label="Opções de autenticação">
            <button 
              className={`tab ${activeTab === 'login' ? 'active' : ''}`} 
              role="tab" 
              aria-selected={activeTab === 'login'} 
              onClick={() => handleTabChange('login')}
            >
              Entrar
            </button>
            <button 
              className={`tab ${activeTab === 'cadastro' ? 'active' : ''}`} 
              role="tab" 
              aria-selected={activeTab === 'cadastro'} 
              onClick={() => handleTabChange('cadastro')}
            >
              Criar conta
            </button>
          </nav>

          {/* LOGIN */}
          <div id="login" className={`form-section ${activeTab !== 'login' ? 'hidden' : ''}`} role="tabpanel">
            <h2 id="auth-heading" className="auth-title">Bem-vindo de volta</h2>
            <p className="auth-sub">Entre com sua conta para continuar</p>

            {loginError && (
              <div style={{
                background: 'rgba(226, 75, 74, 0.1)',
                border: '1px solid rgba(226, 75, 74, 0.3)',
                color: '#E24B4A',
                padding: '0.8rem 1rem',
                borderRadius: '8px',
                marginBottom: '1.2rem',
                fontSize: '13.5px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontFamily: '"DM Sans", sans-serif'
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLogin}>
              <Input 
                id="email-login" 
                type="email" 
                label="E-mail" 
                placeholder="seu@email.com" 
                value={email}
                onChange={(e) => { setEmail(e.target.value); setLoginError(''); }}
                required 
              />
              
              <Input 
                id="password-login" 
                type="password" 
                label="Senha" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => { setPassword(e.target.value); setLoginError(''); }}
                required 
              />

              <a href="#" className="forgot" aria-label="Esqueci minha senha">Esqueci a senha</a>

              <Button type="submit" disabled={isLoading && activeTab === 'login'}>
                {isLoading && activeTab === 'login' ? 'Entrando...' : 'Entrar na conta'}
              </Button>
            </form>

            <p className="switch-msg">Não tem conta? <a href="#" onClick={(e) => { e.preventDefault(); handleTabChange('cadastro'); }} aria-label="Mudar para aba de criar conta">Criar agora</a></p>
          </div>

          {/* CADASTRO */}
          <div id="cadastro" className={`form-section ${activeTab !== 'cadastro' ? 'hidden' : ''}`} role="tabpanel">
            <h2 className="auth-title">Criar sua conta</h2>
            <p className="auth-sub">Preencha os dados para começar</p>

            {registerError && (
              <div style={{
                background: 'rgba(226, 75, 74, 0.1)',
                border: '1px solid rgba(226, 75, 74, 0.3)',
                color: '#E24B4A',
                padding: '0.8rem 1rem',
                borderRadius: '8px',
                marginBottom: '1.2rem',
                fontSize: '13.5px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontFamily: '"DM Sans", sans-serif'
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <span>{registerError}</span>
              </div>
            )}

            <form onSubmit={handleRegister}>
              <div className="row-two">
                <Input 
                  id="nome" 
                  type="text" 
                  label="Nome" 
                  placeholder="João" 
                  value={nome}
                  onChange={(e) => { setNome(e.target.value); setRegisterError(''); }}
                  required 
                />
                <Input 
                  id="sobrenome" 
                  type="text" 
                  label="Sobrenome" 
                  placeholder="Silva" 
                  value={sobrenome}
                  onChange={(e) => { setSobrenome(e.target.value); setRegisterError(''); }}
                  required 
                />
              </div>

              <Input 
                id="email-cadastro" 
                type="email" 
                label="E-mail" 
                placeholder="seu@email.com" 
                value={email}
                onChange={(e) => { setEmail(e.target.value); setRegisterError(''); }}
                required 
              />

              <div className="field">
                <label htmlFor="password-cadastro">Senha</label>
                <input 
                  type="password" 
                  id="password-cadastro" 
                  placeholder="Mínimo 8 caracteres" 
                  required 
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setRegisterError(''); }}
                  aria-describedby="password-hint" 
                />
                <div className="strength-bar" role="progressbar" aria-valuenow="60" aria-valuemin="0" aria-valuemax="100" aria-label="Força da senha">
                  <div className="strength-fill"></div>
                </div>
                <p id="password-hint" className="password-hint">Use letras, números e símbolos para uma senha forte</p>
              </div>

              <Input 
                id="password-confirm" 
                type="password" 
                label="Confirmar senha" 
                placeholder="Repita a senha" 
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setRegisterError(''); }}
                required 
              />

              <Button type="submit" disabled={isLoading && activeTab === 'cadastro'}>
                {isLoading && activeTab === 'cadastro' ? 'Criando conta...' : 'Criar conta'}
              </Button>
            </form>

            <p className="switch-msg">Já tem conta? <a href="#" onClick={(e) => { e.preventDefault(); handleTabChange('login'); }} aria-label="Mudar para aba de entrar na conta">Entrar agora</a></p>
          </div>

        </div>
      </section>
    </main>
  );
};
