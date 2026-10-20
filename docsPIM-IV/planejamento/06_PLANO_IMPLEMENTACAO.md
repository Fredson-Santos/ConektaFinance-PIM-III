# 06 — Plano de Implementação e Testes

> **Etapa 6 do `TASKS_MIGRACAO_FRONT_BACK.md`.** Planeja a fase de código (executada **depois** da aprovação — Etapa 7). Nenhum código é criado agora.
> **Referências:** inventário (01) · componentes (02) · modelo de dados (03) · contrato (04) · gap (05) · regras `.agents/rules/{git,dev,tests}.md`.

---

## 1. Priorização (6.1)

Ordem (baseada na dependência técnica e no valor do ROADMAP PIM IV — Etapas 4/5/6 são as de maior peso):

```
F0 Fundações (infra/db/base) → F1 Auth → F2 Categorias → F3 Transações → F4 Orçamentos
→ F5 Dashboard → F6 Alertas → F7 Copilot IA → F8 Relatórios → F9 Configurações/Perfil
→ F10 Import/Export/Zona de perigo (P2) → F11 Cmdk/Polish/PWA → F12 Docs acadêmicas
```

**Corte de escopo P1×P2** (a confirmar em 7.2 — decisão "Escopo"): P1 = F0–F9 + F11 (app completo navegável contra API real); P2 = F10 (importação de extratos, export CSV/JSON, reset/exclusão de conta, PDF via front, refresh token).

## 2. Tasks atômicas (6.2)

Convenção: **DoD** = critério de pronto · **Commit** no padrão `git.md` (pt-BR, minúscula, sem ponto final). Áreas: `backend`, `frontend`, `db`, `infra`, `docs`.

### F0 — Fundações

| ID | Área | Task | DoD | Commit previsto |
|---|---|---|---|---|
| F0.1 | db | Novo modelo de dados (entidades/enums/configs do doc 03) | compila; unique indexes criados; `dotnet ef migrations add ModeloV1` sem erro | `db: cria modelo unificado de transacoes, categorias por usuario e otp` |
| F0.2 | db | Migrations limpas + seed novo (templates de categorias, conta demo, massa mínima) | banco sobe do zero com 1 comando; sem migrations vazias/duplicadas | `db: recria migrations do zero e substitui seed por categorias padrao e conta demo` |
| F0.3 | backend | `BaseApiController` + `UserContext` (fim do helper duplicado) | 0 duplicação de `GetCurrentUserId`; testes do helper passam | `refactor(backend): centraliza contexto de usuario em base controller` |
| F0.4 | backend | Middleware de exceção global (ProblemDetails) + 404/403/409 padronizados | `ex.Message` não vaza em nenhum endpoint; teste de integração 400/401/404/409 | `feat(backend): adiciona middleware global de erros com problemdetails` |
| F0.5 | backend | Segurança base: secret JWT só de env (emissão e validação), CORS restrito, rate limiting scaffolding | sem secret em arquivo rastreado; CORS por config; login/OTP limitados | `fix(backend): unifica secret jwt por variavel de ambiente e restringe cors` |
| F0.6 | backend | `/api/v1` + Swagger com Bearer + `/health` | Swagger autentica; health responde 200 no compose | `feat(backend): versiona api em v1 e adiciona health check` |
| F0.7 | infra | `.env.example` na raiz + connection string apontando ao volume `sqlite_data` | `docker compose up` sobe sem arquivo local extra; dado sobrevive a recriar container | `infra: corrige persistencia do sqlite no compose e adiciona env example` |
| F0.8 | frontend | Setup React: router, pastas (doc 02 §6), `tokens.css`/`base.css` transplantados do protótipo | `/login` roteia; tema troca e **persiste no boot**; `npm run build` ok | `feat(frontend): estrutura app react com rotas e design system do prototipo` |
| F0.9 | frontend | Infra de testes: Vitest + Testing Library + `npm test` (regra `tests.md`) | teste de fumaça (render de App) passa por `npm test`; coverage habilitado | `test(frontend): configura vitest e testing library com script npm test` |
| F0.10 | infra | CI GitHub Actions (build back+front, lint, `dotnet test`, `npm test`) | pipeline verde em PR; falha em teste bloqueia | `infra: adiciona pipeline ci com builds e testes de backend e frontend` |

### F1 — Autenticação

| ID | Área | Task | DoD | Commit previsto |
|---|---|---|---|---|
| F1.1 | backend | `POST /auth/login` e `/auth/register` na v1 (perfil completo + categorias clonadas) | 401 genérico; register cria usuário + 13 categorias; testes service | `feat(backend): migra autenticacao para v1 com clone de categorias padrao` |
| F1.2 | backend | OTP: `OtpCodes` + `OtpService` + endpoints request/verify (expiração 5 min, reenvio 45 s, 3 tentativas) | teste de expiração/tentativas; 429 no reenvio; dev retorna código simulado | `feat(backend): implementa login via whatsapp com otp e reenvio controlado` |
| F1.3 | backend | `POST /auth/demo` (conta de demonstração) | login demo devolve token + dados seed | `feat(backend): adiciona acesso rapido de demonstracao` |
| F1.4 | frontend | `AuthScreen` completa: tabs WhatsApp/e-mail, máscara, OTP boxes, timer, demo | fluxos dos 3 modos contra API real; colar OTP funciona; testes de fluxo | `feat(frontend): implementa tela de login com otp whatsapp, email e demo` |
| F1.5 | frontend | `AuthContext` + `RequireAuth` + interceptação de 401 → `/login` | rota protegida sem token redireciona; logout volta ao login | `feat(frontend): adiciona guardiao de rota e contexto de autenticacao` |

### F2 — Categorias

| ID | Área | Task | DoD | Commit previsto |
|---|---|---|---|---|
| F2.1 | backend | `GET/POST/PUT/DELETE /categories` (per-user, kind, unique nome, 409 em uso) | testes de ownership (403/404) e exclusão bloqueada; validação FluentValidation | `feat(backend): torna categorias por usuario com kind e validacoes` |
| F2.2 | frontend | `BudgetsScreen`: grade de cards + badges de status + consolidado | cards renderizam com dados reais; estados vazio/erro/loading; teste de badge 80/100 | `feat(frontend): implementa tela de categorias com grade e consolidado` |
| F2.3 | frontend | CRUD de categoria (modal + edição + exclusão com conflito 409) | criar/editar/excluir contra API; 409 exibe sugestão; corrige ambiguidade "Nova categoria" | `feat(frontend): adiciona gestao de categorias na tela de orcamentos` |

### F3 — Transações

| ID | Área | Task | DoD | Commit previsto |
|---|---|---|---|---|
| F3.1 | backend | `TransactionsController` unificada (doc 04 §6) + validators create/update | testes: filtros combinados, paginação, `X-Total-Sum`, 403 alheio | `feat(backend): unifica lancamentos em transacoes com filtros e paginacao` |
| F3.2 | frontend | `TransactionsScreen`: grupos por data, chips, busca, mês real, resumo, vazio | navegação de mês filtra de verdade (corrige lacuna 01 §10.2); teste de filtros | `feat(frontend): implementa historico de gastos com filtros e agrupamento` |
| F3.3 | frontend | `TransactionSheet` (despesa/entrada, categorias por kind, parser pt-BR) | cria nos dois tipos; validação inline (sem `alert`); teste de submissão | `feat(frontend): adiciona sheet de novo lancamento com suporte a receitas` |
| F3.4 | frontend | Detalhe/edição/exclusão de transação (ausente no protótipo, presente no PIM III) | clique abre detalhe; editar/excluir atualiza listas e dashboard | `feat(frontend): permite editar e excluir transacoes do historico` |

### F4 — Orçamentos

| ID | Área | Task | DoD | Commit previsto |
|---|---|---|---|---|
| F4.1 | backend | `PUT/GET /budgets` (upsert período, status calculado) | teste upsert idempotente; status ok/warn/over/noLimit conforme regras 80/100 | `feat(backend): implementa tetos por categoria com upsert de periodo` |
| F4.2 | frontend | "Definir teto" nos cards + medidores + disponível/excesso | definir/editar teto reflete no card e no consolidado na hora | `feat(frontend): permite configurar tetos orçamentarios por categoria` |

### F5 — Dashboard

| ID | Área | Task | DoD | Commit previsto |
|---|---|---|---|---|
| F5.1 | backend | `GET /dashboard/overview|weekly-expenses|recent-transactions|budget-meters` | agregados batem com soma de transações (teste); sem cálculo no front | `feat(backend): expoe agregados do dashboard com comparativo mensal` |
| F5.2 | frontend | `DashboardScreen` mobile+desktop (KPIs, badges, semana, medidores, recentes, card IA) | telas idênticas ao protótipo com dados reais; skeleton durante carga | `feat(frontend): implementa dashboard mobile e desktop com dados da api` |

### F6 — Alertas

| ID | Área | Task | DoD | Commit previsto |
|---|---|---|---|---|
| F6.1 | backend | Dedup de alertas (`DedupKey`) + `unread-count` + dispensa | POST repetido não duplica alerta; teste de dedup | `feat(backend): elimina duplicacao de alertas e adiciona contador nao lidas` |
| F6.2 | frontend | Sino + `NotificationsPopover` + dot + dispensar/marcar lida | popover lista alertas reais com badge "N ativos"; ações persistem | `feat(frontend): implementa central de alertas com contador e dispensa` |

### F7 — Copilot IA

| ID | Área | Task | DoD | Commit previsto |
|---|---|---|---|---|
| F7.1 | backend | `ICopilotAiClient` + fallback rule-based das 4 intents + cota diária | sem rede nos testes (mock do client); 429 acima da cota | `feat(backend): abstrai cliente de ia com fallback baseado em regras` |
| F7.2 | backend | `POST/GET/DELETE /copilot/*` + tools (summary/breakdown/alerts/draft) + `ActionPayload` | tools retornam dados reais do usuário; draft nunca grava transação; testes das tools | `feat(backend): adiciona copilot com function calling e acoes para o front` |
| F7.3 | frontend | `AiFab` arrastável + `AiPanel` (histórico, sugestões, ações) | sugestão "Registrar novo gasto" abre sheet pré-preenchida via `actions`; teste do fluxo | `feat(frontend): implementa assistente de ia com fab arrastavel e acoes` |

### F8 — Relatórios

| ID | Área | Task | DoD | Commit previsto |
|---|---|---|---|---|
| F8.1 | backend | `/reports` v1 (summary+comparativo, by-category, trend com income/saved, daily) | payloads exatos do contrato; trend agregado no banco (sem carga em memória) | `feat(backend): revisa relatorios com comparativo de periodo e series 6m` |
| F8.2 | frontend | `ReportsScreen` mobile+desktop (Recharts: barras duplas, donut, 6M, tabela) | gráficos renderizam com dados reais; período com efeito real; KPIs corretos | `feat(frontend): implementa relatorios com graficos e comparativos` |

### F9 — Configurações/Perfil

| ID | Área | Task | DoD | Commit previsto |
|---|---|---|---|---|
| F9.1 | backend | `/users/me` completo (perfil, avatar, senha, preferências) | validações (senha min 8, imagem ≤ 2MB); testes de ownership | `feat(backend): expoe perfil, preferencias e troca de senha do usuario` |
| F9.2 | frontend | `SettingsScreen` 3 abas (geral/senha/privacidade) + modo discreto | salvar persiste e reflete no shell; modo discreto mascara valores globalmente | `feat(frontend): implementa configuracoes com perfil, senha e privacidade` |

### F10 — P2 (Import/Export/Zona de perigo)

| ID | Área | Task | DoD | Commit previsto |
|---|---|---|---|---|
| F10.1 | backend | `/imports` preview+confirm (parse OFX/CSV/XLSX, dedup por `ExternalId`) | arquivo de teste importa 3 itens; duplicado é sinalizado; testes com arquivos fixture | `feat(backend): importa extratos com categorizacao sugerida e dedup` |
| F10.2 | backend | `/reports/export.csv` + `/users/me/reset-data` + `DELETE /users/me` | CSV abre no Excel pt-BR; reset remove transações/orçamentos/alertas | `feat(backend): adiciona exportacao csv e zona de perigo da conta` |
| F10.3 | frontend | `ImportSheet` real + exportações + zona de perigo com confirmação | fluxo completo contra API; toasts de conciliação | `feat(frontend): adiciona importacao de extratos, exportacao e zona de perigo` |
| F10.4 | frontend | Exportar PDF no cliente (`jspdf`) | gera PDF do relatório mensal offline | `feat(frontend): exporta relatorio mensal em pdf no cliente` |

### F11 — Cmdk/Polish/PWA

| ID | Área | Task | DoD | Commit previsto |
|---|---|---|---|---|
| F11.1 | frontend | Command palette (atalho `/`, navegação por teclado) | abre em qualquer rota; 9 comandos do protótipo + registros (P2) | `feat(frontend): adiciona paleta de comandos com atalho de teclado` |
| F11.2 | frontend | Estados globais de loading/erro/vazio + foco visível + a11y (regra `dev.md`/WCAG) | nenhuma listagem sem skeleton/erro; alvos ≥ 44px; contraste AA | `feat(frontend): padroniza estados de carregamento, erro e vazio nas telas` |
| F11.3 | frontend | PWA: auditoria manifest/SW/offline/install banner + safe areas iOS | Lighthouse PWA passando; instalação em iOS/Android verificada | `feat(pwa): revisa instalacao, cache offline e safe areas do pwa` |

### F12 — Docs acadêmicas

| ID | Área | Task | DoD | Commit previsto |
|---|---|---|---|---|
| F12.1 | docs | Capturas de telas + Swagger + diagramas p/ relatório ABNT (ROADMAP Etapas 4–8) | imagens organizadas em `frontend/docs/telas/` e `docsPIM-IV` | `docs(pim-iv): atualiza evidencias de telas e api para o relatorio` |
| F12.2 | docs | Manual do usuário atualizado (React novo) | manual reflete fluxos reais | `docs: revisa manual do usuario para o novo frontend` |

## 3. Estratégia de testes (6.3) — regra `tests.md`

| Camada | Ferramentas | Escopo mínimo |
|---|---|---|
| Front unit | **Vitest + @testing-library/react** | componentes comuns (Button/Sheet/Badge/OtpBoxes/MoneyText), contexts (Theme persistindo no boot, Auth 401), utils (format moeda/data, parser de valor, máscara de telefone), hooks (useMediaQuery, useOtp) |
| Front integração | Testing Library (user-event) | fluxos por tela: login OTP (request→verify), criar transação (sheet→toast→lista), filtros de gastos, definir teto, disparar ação do copilot, dispensar alerta |
| Back unit | **xUnit + Moq + FluentAssertions** (padrão atual) | todos os services novos (Otp, Transaction, Budget, Dashboard, Copilot c/ `ICopilotAiClient` falso, Alert dedup, User), validators FluentValidation completos |
| Back integração | **xUnit + WebApplicationFactory + SQLite in-memory** | controllers v1 com auth real: 400/401/403/404/409, paginação/filtros, `X-Total-Sum`, ownership |
| E2E | Playwright (existente) | specs reescritas para o React novo (login, transações, categorias, relatórios, IA mockada) |
| **Sempre mockado** | — | IA (`ICopilotAiClient` fake), WhatsApp/OTP provider fake, nenhuma rede real na suíte (regra `tests.md`) |
| Validação local | `npm test` / `dotnet test` **antes de cada commit**; zero erros | scripts obrigatórios no package.json e csproj |

## 4. Estratégia de integração (6.4)

- Front é desenvolvido contra **mock adapters** em `src/services/mocks/` com **as mesmas assinaturas do contrato (doc 04)** — trocar mock por API real = trocar a implementação do módulo (sem tocar componentes).
- Chave `VITE_USE_MOCKS` no Vite seleciona mock×real; no Docker final, sempre real via proxy `/api`.
- Backend publica contrato idêntico ao doc 04 (Swagger é artefato de conferência — aceitação por tela usa a tabela 04 §13).
- Integração contínua por fase: F1–F6 seguem o mock até o backend correspondente ficar pronto (back e front das fases podem andar em paralelo); `docker compose up` é o checkpoint de integração a cada fase concluída.

## 5. Esforço, riscos e prazo (6.5)

**Estimativa por fase (dias-pessoa, 2 devs):** F0 6 · F1 5 · F2 4 · F3 6 · F4 3 · F5 4 · F6 2 · F7 6 · F8 5 · F9 4 · F10 5 (P2) · F11 4 · F12 3 → **P1 (F0–F9+F11) ≈ 43 dp ≈ 4 sprints de 2 semanas**; P2 (F10+F12) ≈ 8 dp (5ª sprint). Ajustar no planning da Etapa 7 com a data real de entrega do PIM.

| Risco | Impacto | Mitigação |
|---|---|---|
| Escopo maior que o prazo do PIM | alto | corte P2 pré-acordado (§1); cada fase entrega valor navegável |
| Provedor de IA: custo/limites/chaves | médio | `ICopilotAiClient` + fallback rule-based (07 §7.1 do gap); cota diária; decisão 7.2 |
| WhatsApp real indisponível p/ OTP | médio | provedor simulado em dev (devCode) + interface pronta p/ trocar |
| Dispersão de dados entre telas (protótipo inconsistente) | médio | fonte única = API (docs 04/05); testes de agregados |
| Quebra de PWA no iOS | baixo | auditoria F11.3 + testes em dispositivo real |
| Desvio das regras de commit/testes | baixo | CI bloqueia (F0.10); revisão por pares nas fases |
| Segregação de segredos no histórico git | alto | rotação S1 + CI sem secrets |

## 6. Commits previstos (6.6)

Consolidado em §2 (coluna "Commit previsto") — todos seguem `git.md`: `tipo(escopo): descrição` em português, minúscula, sem ponto final, um commit lógico por task, validado por `npm test`/`dotnet test` antes do commit. Tipos usados: `feat`, `fix`, `refactor`, `test`, `db`, `infra`, `docs`, `style`.

## 7. Aceite da etapa

- [x] 6.1 Recursos priorizados (§1)
- [x] 6.2 Tasks atômicas por área com DoD (§2 — 42 tasks em 13 fases)
- [x] 6.3 Estratégia de testes (§3)
- [x] 6.4 Estratégia de integração com mocks do contrato (§4)
- [x] 6.5 Esforço e riscos versus prazo (§5)
- [x] 6.6 Commits previstos no padrão do `git.md` (§6)

**Critério de aceite:** cada task é pequena, testável e tem critério de pronto — colunas DoD de §2.
