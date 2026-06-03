import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '../context/ToastContext';
import { ChatService } from '../services/api';

const renderMarkdown = (text) => {
  if (!text) return null;
  
  const lines = text.split('\n');
  const elements = [];
  let currentList = [];

  const parseInline = (str) => {
    const parts = str.split('**');
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return <strong key={index} style={{ fontWeight: '600' }}>{part}</strong>;
      }
      return part;
    });
  };

  lines.forEach((line, lineIdx) => {
    const trimmed = line.trim();
    if (!trimmed) {
      if (currentList.length > 0) {
        elements.push(
          <ul key={`ul-${lineIdx}`} style={{ margin: '0 0 0.8rem 1.2rem', paddingLeft: '0', listStyleType: 'disc' }}>
            {currentList}
          </ul>
        );
        currentList = [];
      }
      return;
    }

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const content = trimmed.substring(2);
      currentList.push(
        <li key={`li-${lineIdx}`} style={{ margin: '0.2rem 0' }}>
          {parseInline(content)}
        </li>
      );
    } else {
      if (currentList.length > 0) {
        elements.push(
          <ul key={`ul-${lineIdx}`} style={{ margin: '0 0 0.8rem 1.2rem', paddingLeft: '0', listStyleType: 'disc' }}>
            {currentList}
          </ul>
        );
        currentList = [];
      }
      elements.push(
        <p key={`p-${lineIdx}`} style={{ margin: '0 0 0.6rem 0' }}>
          {parseInline(trimmed)}
        </p>
      );
    }
  });

  if (currentList.length > 0) {
    elements.push(
      <ul key="ul-end" style={{ margin: '0 0 0.8rem 1.2rem', paddingLeft: '0', listStyleType: 'disc' }}>
        {currentList}
      </ul>
    );
  }

  return <div className="chat-markdown">{elements}</div>;
};

export const Insights = () => {
  const { showToast } = useToast();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const loadHistory = async () => {
    try {
      const history = await ChatService.getHistory();
      setMessages(history || []);
      scrollToBottom();
    } catch (error) {
      showToast('Erro ao carregar histórico da conversa', 'error');
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput('');
    
    // Add optimistic user message
    const tempUserMsg = { role: 'user', content: userText, createdAt: new Date().toISOString() };
    setMessages(prev => [...prev, tempUserMsg]);
    scrollToBottom();
    setLoading(true);

    try {
      const assistantMsg = await ChatService.sendMessage(userText);
      setMessages(prev => [...prev, assistantMsg]);
      scrollToBottom();
    } catch (error) {
      showToast('Erro ao enviar mensagem', 'error');
      // Optionally remove the optimistic message on error, or add an error message
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    if (!window.confirm('Deseja limpar todo o histórico da conversa?')) return;
    try {
      await ChatService.clearHistory();
      setMessages([]);
      showToast('Histórico limpo com sucesso', 'success');
    } catch (error) {
      showToast('Erro ao limpar histórico', 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
      <div className="topbar">
        <div className="topbar-left">
          <h1>Assistente Financeiro IA</h1>
          <p>Tire dúvidas, peça resumos ou adicione gastos por aqui.</p>
        </div>
        <div className="topbar-right">
          <button 
            onClick={handleClear} 
            className="btn btn-outline" 
            style={{ fontSize: '13px', padding: '0.4rem 0.8rem' }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ width: '16px', height: '16px', marginRight: '6px' }}><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"/></svg>
            Limpar Chat
          </button>
        </div>
      </div>

      <div style={{ 
        flex: 1, 
        background: 'var(--white)', 
        borderRadius: '16px', 
        border: '1px solid var(--border)', 
        display: 'flex', 
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        
        {/* Messages Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {messages.length === 0 && !loading && (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '2rem' }}>
              <div style={{ 
                width: '60px', height: '60px', background: 'var(--primary-light)', color: 'var(--primary)',
                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' 
              }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '30px' }}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              </div>
              <h3>Como posso ajudar?</h3>
              <p style={{ fontSize: '14px', marginTop: '0.5rem', maxWidth: '300px', margin: '0.5rem auto 0' }}>
                Pergunte sobre seus gastos, peça dicas de economia ou envie comandos para adicionar despesas.
              </p>
            </div>
          )}

          {messages.map((msg, idx) => {
            const isUser = msg.role === 'user';
            return (
              <div key={idx} style={{ 
                display: 'flex', 
                justifyContent: isUser ? 'flex-end' : 'flex-start',
                width: '100%'
              }}>
                <div style={{ 
                  maxWidth: '75%',
                  background: isUser ? 'var(--accent)' : '#f1f5f9',
                  color: isUser ? '#fff' : 'var(--text)',
                  padding: '0.8rem 1.2rem',
                  borderRadius: '16px',
                  borderBottomRightRadius: isUser ? '4px' : '16px',
                  borderBottomLeftRadius: !isUser ? '4px' : '16px',
                  fontSize: '14.5px',
                  lineHeight: '1.5',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}>
                  {renderMarkdown(msg.content)}
                </div>
              </div>
            );
          })}
          
          {loading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start', width: '100%' }}>
              <div style={{ 
                background: '#f1f5f9', padding: '0.8rem 1.2rem', borderRadius: '16px', borderBottomLeftRadius: '4px',
                display: 'flex', gap: '4px', alignItems: 'center'
              }}>
                <span className="dot-typing"></span>
                <span className="dot-typing" style={{ animationDelay: '0.2s' }}></span>
                <span className="dot-typing" style={{ animationDelay: '0.4s' }}></span>
                <style>{`
                  .dot-typing {
                    width: 6px; height: 6px; background-color: var(--text-muted); border-radius: 50%;
                    animation: dotTyping 1.5s infinite ease-in-out;
                  }
                  @keyframes dotTyping { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
                  .chat-markdown p:last-child, .chat-markdown ul:last-child {
                    margin-bottom: 0 !important;
                  }
                `}</style>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={handleSend} style={{ 
          padding: '1rem', 
          borderTop: '1px solid var(--border)',
          display: 'flex',
          gap: '0.8rem',
          background: '#f8fafc'
        }}>
          <input 
            type="text" 
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Digite sua mensagem para a Inteligência Artificial..."
            disabled={loading}
            style={{
              flex: 1,
              padding: '0.8rem 1.2rem',
              borderRadius: '24px',
              border: '1px solid var(--border)',
              outline: 'none',
              fontSize: '14.5px',
              background: '#fff'
            }}
          />
          <button 
            type="submit" 
            disabled={!input.trim() || loading}
            style={{
              background: input.trim() && !loading ? 'var(--primary)' : 'var(--border)',
              color: '#fff',
              border: 'none',
              width: '45px',
              height: '45px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s'
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '20px', marginLeft: '-2px' }}>
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </form>

      </div>
    </div>
  );
};
