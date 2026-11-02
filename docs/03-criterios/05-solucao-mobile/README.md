# 📱 Etapa 5 — Desenvolvimento da solução Mobile (PWA)

> **Critério 06 · 2,0 pts** — Disciplina: Desenvolvimento Mobile (PWA autorizado pelo orientador).

## O que o manual pede

Telas principais, fluxo de navegação, autenticação, **sincronização de dados** e integração com APIs.

## Evidências no código

- PWA com `vite-plugin-pwa` (manifest, service worker e cache em runtime): [`frontend/vite.config.js`](../../../frontend/vite.config.js).
- Banner de instalação e barra de navegação inferior: [`frontend/src/components/layout/`](../../../frontend/src/components/layout/).
- Autenticação por OTP via WhatsApp e onboarding (F13.1 e F13.2).
- Protótipo mobile-first: [`02-planejamento/prototipo/`](../../02-planejamento/prototipo/).

## Pendências

- [ ] ⚠️ Sincronização de dados: marcada como fora do escopo na F14, mas citada no manual. Implementar fila offline ou justificar a estratégia no texto
- [ ] Comparativo Nativo × Híbrido × PWA
- [ ] Prints em celular: instalação, modo standalone e fluxo de navegação
- [ ] Diagrama do ciclo de vida do service worker
- [ ] Redação do capítulo
