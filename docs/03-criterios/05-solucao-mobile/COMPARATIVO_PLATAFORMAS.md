# Comparativo: aplicativo nativo × híbrido × PWA

Material de apoio ao capítulo 6 (Etapa 5: Desenvolvimento Mobile). O orientador autorizou a entrega da solução mobile como PWA. Este documento dá a fundamentação dessa escolha.

## Conceitos

- **Aplicativo nativo:** escrito na linguagem de cada plataforma (Kotlin/Java no Android, Swift no iOS) e distribuído pelas lojas (Google Play e App Store). Tem acesso completo ao hardware e o melhor desempenho, mas exige duas bases de código.
- **Aplicativo híbrido / multiplataforma:** uma base de código gera os apps das duas plataformas. Pode rodar dentro de uma *WebView* (Ionic, Cordova/Capacitor) ou compilar para componentes nativos (React Native, Flutter, .NET MAUI). Continua dependendo das lojas.
- **Progressive Web App (PWA):** aplicação web que, com um *Web App Manifest* e um *service worker*, pode ser instalada na tela inicial, abre sem a barra do navegador (modo *standalone*) e guarda o próprio código em cache. É distribuída por um link, sem loja.

## Quadro comparativo

| Critério | Nativo | Híbrido / multiplataforma | PWA |
| --- | --- | --- | --- |
| Bases de código | Uma por plataforma | Uma | Uma, **a mesma da versão web** |
| Distribuição | Lojas (revisão e taxas) | Lojas | Link ou "Adicionar à tela de início" |
| Atualização | Usuário baixa nova versão | Usuário baixa nova versão | Automática ao abrir o app (service worker) |
| Custo de desenvolvimento | Alto | Médio | Baixo |
| Taxa de publicação | Conta de desenvolvedor nas lojas | Idem | Nenhuma |
| Acesso a hardware | Completo | Quase completo (via plugins) | Parcial (câmera, arquivos, notificações; limitações no iOS) |
| Desempenho | Máximo | Bom | Bom para apps de formulário e listas |
| Funcionamento offline | Total, se implementado | Total, se implementado | Shell do app em cache; dados conforme a estratégia escolhida |
| Espaço no aparelho | Dezenas de MB | Dezenas de MB | Poucos MB (cache do navegador) |
| Indexação por buscadores | Não | Não | Sim |

> Ao escrever, apoie o quadro em fontes: documentação do web.dev e da MDN sobre PWA, e um livro de engenharia de software para a parte de custo e manutenção (ver [`REFERENCIAS.md`](../../01-relatorio-abnt/REFERENCIAS.md)). Evite números de mercado sem fonte.

## Por que PWA no ConektaFinance

1. **Mesma aplicação no celular e no computador.** O React do painel web é o mesmo do app instalado. Toda funcionalidade nova chega aos dois canais de uma vez, e a sincronização é natural: ambos usam a mesma API e o mesmo banco (ver a seção *Sincronização de dados* no [`README.md`](README.md)).
2. **O tipo de app favorece o PWA.** Gestão financeira é feita de formulários, listas e gráficos. Não depende de sensores, Bluetooth nem processamento pesado no aparelho.
3. **Inclusão.** Funciona em celulares simples e com pouco espaço, sem exigir conta em loja. Isso conversa com o capítulo 4 (responsabilidade social).
4. **Custo e prazo.** Uma equipe de estudantes mantém uma única base de código, sem taxas de publicação.
5. **Atualização sem atrito.** O service worker baixa a nova versão e recarrega a aba sozinho (`fix(pwa): recarrega a aba automaticamente quando o service worker atualiza`).

## Limites, para o texto não afirmar além do que existe

- No iOS, a instalação é manual (Compartilhar → Adicionar à Tela de Início) e alguns recursos, como notificações *push*, têm restrições. O app **não usa push**; os alertas são consultados a cada 60 s.
- Não há fila offline de lançamentos: sem conexão, o app abre, mas não grava. A decisão está explicada no `README.md` desta pasta.

## Evidências no código

| Recurso | Onde |
| --- | --- |
| Manifest (`display: standalone`, ícones, cores, `lang: pt-BR`, orientação retrato) | `frontend/vite.config.js:25` |
| Service worker e cache em runtime (`vite-plugin-pwa`) | `frontend/vite.config.js` (`workbox` / `runtimeCaching`) |
| Banner de instalação e barra de navegação inferior | `frontend/src/components/layout/` |
| Áreas seguras do iPhone (*safe areas*) e bloqueio de zoom acidental | commits de 17/10/2026 |

Trecho do manifest para o relatório (`frontend/vite.config.js:25`):

```js
manifest: {
  id: '/',
  name: 'ConektaFinance — Gestão Financeira Inteligente',
  short_name: 'ConektaFinance',
  lang: 'pt-BR',
  start_url: '/',
  scope: '/',
  display: 'standalone',
  background_color: '#151515',
  theme_color: '#151515',
  orientation: 'portrait-primary',
  // ícones 192x192, 512x512 e maskable
}
```

## Figuras deste capítulo

- `figuras/06-PWA-*.png`: 9 telas no celular real (login, dashboard, gastos, categorias, relatórios, novo lançamento, assistente de IA, configurações e admin).
- `figuras/diagramas/06-ciclo-service-worker.png`: ciclo de vida do service worker.
- **Faltam:** um print do **banner de instalação** ("Adicionar à tela de início") e um do **ícone na tela inicial do celular**. São capturas rápidas e mostram a instalação, que é o diferencial do PWA.
