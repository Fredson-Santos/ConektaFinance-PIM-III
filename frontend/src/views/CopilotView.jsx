import React, { useState } from 'react';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  Lightbulb, 
  TrendingDown, 
  Zap, 
  Code2,
  CheckCircle2
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

export const CopilotView = () => {
  const { 
    transacoes, 
    gastosPorCategoria, 
    totalReceitas, 
    totalDespesas, 
    saldoAtual, 
    modoDiscreto 
  } = useFinance();

  const [inputMsg, setInputMsg] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: 'Olá! Sou o Conekta Copilot, seu assistente financeiro inteligente integrado ao PIM IV. Eu analiso seus dados em tempo real usando Function Calling para otimizar seus orçamentos e evitar dívidas.',
      functionCalled: null
    },
    {
      id: 2,
      sender: 'ai',
      text: '💡 Diagnóstico rápido: Você já comprometeu 58% do seu teto orçamentário mensal. Recomendo atenção especial com Alimentação e Moradia para garantir a meta de economia.',
      functionCalled: 'analyzeBudgetStatus({ cycle: "Outubro/2026" })'
    }
  ]);

  const [isLoading, setIsLoading] = useState(false);

  const formatCurrency = (val) => {
    if (modoDiscreto) return '••••••';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const sugestoes = [
    { label: "Quanto posso gastar por dia?", prompt: "Qual meu limite de gasto diário até o fim do mês?" },
    { label: "Qual categoria está em risco?", prompt: "Qual categoria está mais próxima de estourar o limite?" },
    { label: "Simular corte de 20%", prompt: "Simule uma economia de 20% em alimentação e lazer." },
    { label: "Resumo para o PIM IV", prompt: "Gere um resumo executivo das finanças para a documentação acadêmica." }
  ];

  const handleSend = (textToSend) => {
    const query = textToSend || inputMsg;
    if (!query.trim()) return;

    const userMsg = { id: Date.now(), sender: 'user', text: query };
    setMessages(prev => [...prev, userMsg]);
    setInputMsg('');
    setIsLoading(true);

    setTimeout(() => {
      let aiResponseText = '';
      let funcCalled = '';

      const lower = query.toLowerCase();

      if (lower.includes('dia') || lower.includes('diário')) {
        const diasRestantes = 14;
        const saldoLivre = Math.max(0, totalReceitas - totalDespesas);
        const gastoDiario = diasRestantes > 0 ? (saldoLivre / diasRestantes) : 0;
        funcCalled = 'calculateDailyAllowance({ remainingDays: 14 })';
        aiResponseText = `Com base no seu saldo atual de ${formatCurrency(saldoLivre)} e considerando 14 dias até o fechamento do ciclo, seu limite seguro de gastos é de aproximadamente ${formatCurrency(gastoDiario)} por dia.`;
      } else if (lower.includes('categoria') || lower.includes('risco') || lower.includes('estourar')) {
        const maisGasta = [...gastosPorCategoria].sort((a, b) => b.percentualLimite - a.percentualLimite)[0];
        funcCalled = 'getHighestRiskCategory({ threshold: 0.7 })';
        aiResponseText = `A categoria com maior consumo no momento é **${maisGasta.nome}**, que já atingiu ${maisGasta.percentualLimite}% do limite (${formatCurrency(maisGasta.totalGasto)} de ${formatCurrency(maisGasta.limite)}). Recomendo frear novas despesas nessa área.`;
      } else if (lower.includes('corte') || lower.includes('econom') || lower.includes('simul')) {
        const alimentacao = gastosPorCategoria.find(c => c.nome.toLowerCase() === 'alimentação')?.totalGasto || 0;
        const lazer = gastosPorCategoria.find(c => c.nome.toLowerCase() === 'lazer')?.totalGasto || 0;
        const economiaProjetada = (alimentacao + lazer) * 0.20;
        funcCalled = 'simulateExpenseReduction({ categories: ["Alimentação", "Lazer"], rate: 0.2 })';
        aiResponseText = `Cortando 20% em Alimentação e Lazer, você economizaria ${formatCurrency(economiaProjetada)} todo mês! Isso elevaria sua taxa de poupança para ${(Math.round(((saldoAtual + economiaProjetada) / totalReceitas) * 100))}% da sua renda.`;
      } else {
        funcCalled = 'generateExecutiveReport({ scope: "PIM-IV" })';
        aiResponseText = `Resumo executivo do ConektaFinance: Receitas consolidadas de ${formatCurrency(totalReceitas)}, despesas de ${formatCurrency(totalDespesas)} e saldo superavitário de ${formatCurrency(saldoAtual)}. O sistema opera com regras orientadas a objeto e persistência segura.`;
      }

      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'ai',
          text: aiResponseText,
          functionCalled: funcCalled
        }
      ]);
      setIsLoading(false);
    }, 600);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: 'calc(100vh - 160px)', minHeight: '520px' }}>
      {/* View Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: '700', letterSpacing: '-0.02em' }}>
            Conekta Copilot IA
          </h2>
          <span className="ds-badge ds-badge-purple" style={{ fontSize: '11px' }}>
            <Zap size={12} /> Function Calling
          </span>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--ds-foreground-muted)' }}>
          Assistente financeiro conversacional com suporte a execução de funções e análise preditiva
        </p>
      </div>

      {/* Sugestões Rápidas */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
        {sugestoes.map((s, idx) => (
          <button
            key={idx}
            className="ds-btn ds-btn-secondary"
            onClick={() => handleSend(s.prompt)}
            style={{ fontSize: '12px', height: '34px', padding: '0 12px', whiteSpace: 'nowrap' }}
          >
            <Lightbulb size={13} color="var(--ds-blue-700)" />
            <span>{s.label}</span>
          </button>
        ))}
      </div>

      {/* Chat Messages Box */}
      <div className="ds-card" style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              gap: '12px',
              maxWidth: '85%',
              alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start'
            }}
          >
            {msg.sender === 'ai' && (
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #0070f3 0%, #8e4ec6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 2px 10px rgba(0, 112, 243, 0.3)'
              }}>
                <Bot size={18} color="#ffffff" />
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{
                padding: '12px 16px',
                borderRadius: 'var(--ds-radius-lg)',
                fontSize: '14px',
                lineHeight: '1.5',
                background: msg.sender === 'user' ? 'var(--ds-blue-700)' : 'var(--ds-gray-100)',
                color: msg.sender === 'user' ? '#ffffff' : 'var(--ds-foreground)',
                border: msg.sender === 'user' ? 'none' : '1px solid var(--ds-border)'
              }}>
                {msg.text}
              </div>

              {/* Tag evidenciando Function Calling para validação do PIM IV */}
              {msg.functionCalled && (
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--ds-purple-700)',
                  background: 'var(--ds-purple-alpha-200)',
                  padding: '3px 8px',
                  borderRadius: 'var(--ds-radius-sm)',
                  border: '1px solid rgba(142, 78, 198, 0.25)',
                  alignSelf: 'flex-start'
                }}>
                  <Code2 size={12} />
                  <span>{msg.functionCalled}</span>
                </div>
              )}
            </div>

            {msg.sender === 'user' && (
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: 'var(--ds-gray-200)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <User size={18} color="var(--ds-foreground)" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', color: 'var(--ds-foreground-muted)', fontSize: '13px' }}>
            <Sparkles size={16} className="animate-spin" color="var(--ds-blue-700)" />
            <span>Copilot analisando parâmetros com function calling...</span>
          </div>
        )}
      </div>

      {/* Input de Mensagem */}
      <form 
        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
        style={{ display: 'flex', gap: '10px' }}
      >
        <input
          type="text"
          placeholder="Pergunte ao Copilot sobre seus gastos, orçamentos ou simulações..."
          value={inputMsg}
          onChange={(e) => setInputMsg(e.target.value)}
          className="ds-input selectable"
          style={{ height: '46px' }}
        />
        <button
          type="submit"
          className="ds-btn ds-btn-blue"
          style={{ width: '50px', height: '46px', padding: 0 }}
          disabled={!inputMsg.trim()}
          title="Enviar Mensagem"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
};
