# 📱 Etapa 5 — Desenvolvimento da solução Mobile (PWA)

> **Critério 06 · 2,0 pts** — Disciplina: Desenvolvimento Mobile (PWA autorizado pelo orientador).

## O que o manual pede

Telas principais, fluxo de navegação, autenticação, **sincronização de dados** e integração com APIs.

## Evidências no código

- PWA com `vite-plugin-pwa` (manifest, service worker e cache em runtime): [`frontend/vite.config.js`](../../../frontend/vite.config.js).
- Banner de instalação e barra de navegação inferior: [`frontend/src/components/layout/`](../../../frontend/src/components/layout/).
- Autenticação por OTP via WhatsApp e onboarding (F13.1 e F13.2).
- Protótipo mobile-first: [`02-planejamento/prototipo/`](../../02-planejamento/prototipo/).

## Sincronização de dados

No manual, sincronização significa manter o app móvel consistente com o servidor e com os outros canais do ecossistema (web e WhatsApp). O ConektaFinance faz isso com uma **fonte única de verdade**: todos os canais leem e gravam pela mesma API REST, no mesmo banco PostgreSQL.

| Mecanismo | Como funciona | Evidência |
| --- | --- | --- |
| Mesmo cliente no celular e no desktop | O PWA instalado e a versão web são a mesma aplicação React, autenticada pelo mesmo JWT e consumindo a mesma API | [`frontend/src/services/api.js`](../../../frontend/src/services/api.js) |
| Dados sempre vindos do servidor | O service worker guarda em cache só o app (HTML, JS, CSS, ícones) e as fontes. As respostas da API nunca são cacheadas, então cada tela mostra o estado atual do banco | `runtimeCaching` em [`frontend/vite.config.js`](../../../frontend/vite.config.js) |
| Lançamentos de qualquer canal | Lançamentos feitos no app, no assistente de IA ou pelo WhatsApp gravam na mesma tabela `transactions`, com a origem em `source` (`Manual`, `Import`, `Copilot`). Aparecem em todos os dispositivos na próxima consulta | `TransactionSource` em [`backend/Domain/Enums/TransactionEnums.cs`](../../../backend/Domain/Enums/TransactionEnums.cs) |
| Histórico do assistente | As conversas ficam no servidor (`chat_messages`), não no aparelho. O chat aberto no celular mostra as mesmas mensagens enviadas pelo desktop e vice-versa | [`backend/Controllers/CopilotController.cs`](../../../backend/Controllers/CopilotController.cs) |
| Alertas | Gerados no servidor (serviço e trigger do banco). O app consulta a contagem de não lidos a cada 60 s | [`frontend/src/hooks/useUnreadAlerts.js`](../../../frontend/src/hooks/useUnreadAlerts.js) |
| Atualização dentro do app | Ao registrar, importar ou confirmar um lançamento pelo assistente, o app incrementa `dataVersion` e as telas abertas recarregam seus indicadores | `notifyDataChanged` em [`frontend/src/context/UiContext.jsx`](../../../frontend/src/context/UiContext.jsx) |

**Limites, para o texto não afirmar além do que existe:**

- O histórico de conversas é separado por canal (`ChatChannel`): uma conversa feita pelo WhatsApp não aparece no chat do app, só os efeitos dela (lançamentos e alertas).
- Não há fila offline: sem conexão, o app abre (shell em cache), mas não grava lançamentos. A escolha é intencional, porque mantém um único ponto de escrita e evita conflitos de edição entre dispositivos.
- A atualização entre dispositivos acontece na próxima consulta (ao abrir ou trocar de tela). Não há push em tempo real (WebSocket).

## Pendências

- [ ] Comparativo Nativo × Híbrido × PWA
- [ ] Prints em celular: instalação, modo standalone e fluxo de navegação
- [ ] Diagrama do ciclo de vida do service worker
- [ ] Redação do capítulo
