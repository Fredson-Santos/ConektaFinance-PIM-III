# Gestão ágil do projeto

Material de apoio ao capítulo 9 (Etapa 9: Gerenciamento de Projetos Ágil). O manual pede **Product Backlog, Sprint Backlog, cronograma das sprints, quadro Kanban e definição das entregas**.

> **Legenda:** ✅ = fato verificável no repositório ou no GitHub Project. ✏️ = rascunho que **o grupo precisa confirmar** antes de ir para o texto (papéis, cerimônias).

---

## 1. Metodologia adotada ✅

**Scrum com quadro Kanban.** Sprints de uma semana (*time-box* de 7 dias) e quadro de fluxo no GitHub Projects.

| Ferramenta | Uso | Link / local |
| --- | --- | --- |
| GitHub Projects | Quadro Kanban, campo *Sprint* (iterações de 7 dias) e status dos itens | https://github.com/users/Fredson-Santos/projects/1 |
| GitHub Issues | Itens do backlog, com etiquetas de fase, área e prioridade (P1 a P3) e critérios de aceite | Issues #1 a #16 |
| Pull Requests | Revisão de código antes de integrar na `main` | PR #17 (`refine-frontend`) |
| GitHub Actions | Definição de pronto automatizada: build, lint e testes a cada push | `.github/workflows/ci.yml` |
| Markdown no repositório | Planejamento das fases, tasks e critérios de aceite | `docs/02-planejamento/fases/` |

**Etiquetas de prioridade usadas nas issues ✅:**

- `P1` — bloqueia a nota de um critério do manual
- `P2` — reforça um critério parcialmente atendido
- `P3` — diferencial ou evidência

---

## 2. Papéis ✏️

Proposta baseada nos papéis definidos no PIM III (`legacy/docs-pim-III/arquitetura/INTEGRACAO_DISCIPLINAS_ABNT.md`). **Confirmar com o grupo** quem ficou com cada papel no PIM IV.

| Integrante | RA | Papel Scrum | Responsabilidade no PIM IV |
| --- | --- | --- | --- |
| Fredson Silva dos Santos | R427FB0 | Scrum Master / Tech Lead | Arquitetura, revisão de código, CI/CD |
| Anderson Raulino da Silva | F3620J8 | Product Owner | Backlog e prioridades |
| Eduardo de Sousa Pereira | H759CH8 | Time de desenvolvimento | Backend .NET |
| Matheus da Silva Brito | R839DA4 | Time de desenvolvimento | Frontend e PWA |
| Raphael Caique da S. Negreiros | R850765 | Time de desenvolvimento | Banco de dados |
| Miguel dos Santos M. Siroma | R540EA6 | Time de desenvolvimento | UX/UI e documentação ABNT |

---

## 3. Product Backlog

As histórias seguem o formato *Como [usuário], quero [ação], para que [benefício]*. Os itens saíram das fases F0 a F14 (`docs/02-planejamento/fases/`). Todos estão entregues, exceto onde indicado.

| ID | História de usuário | Critérios de aceite (resumo) | Prioridade | Sprint | Status |
| --- | --- | --- | :-: | :-: | :-: |
| US01 | Como usuário, quero entrar com o meu número de WhatsApp e um código, para não precisar decorar senha | Código de 6 dígitos enviado pelo WhatsApp; expira em 5 min; limite de tentativas; JWT emitido ao validar | Alta | 1 | ✅ |
| US02 | Como novo usuário, quero um onboarding guiado, para configurar a conta em poucos passos | Nome, teto mensal, limites por categoria, e-mail e senha; flag de onboarding concluído no perfil | Alta | 2 | ✅ |
| US03 | Como usuário, quero registrar receitas e despesas, para saber para onde vai o meu dinheiro | CRUD com categoria, data, forma de pagamento, recorrência; filtros e paginação | Alta | 1 | ✅ |
| US04 | Como usuário, quero organizar meus gastos em categorias, para entender meus hábitos | Categorias padrão clonadas no cadastro; criar, editar e excluir; tipo despesa/receita | Alta | 1 | ✅ |
| US05 | Como usuário, quero definir um teto por categoria, para não gastar além do planejado | Orçamento por mês/ano; status ok, atenção (80%) e excedido (100%) | Alta | 1 | ✅ |
| US06 | Como usuário, quero ser avisado quando chegar perto do teto, para corrigir a rota a tempo | Alerta em 80% e 100%, sem duplicar; contador de não lidos | Média | 1 e 2 | ✅ |
| US07 | Como usuário, quero um dashboard com saldo, entradas, saídas e gráficos, para ver minha situação de relance | Saldo, consumo do teto, gráfico semanal com o dia atual, orçamentos | Alta | 1 | ✅ |
| US08 | Como usuário, quero relatórios e o fechamento do mês, para acompanhar a evolução | KPIs, composição de gastos, fechamento pela procedure `sp_fechamento_mensal` | Média | 1 e 2 | ✅ |
| US09 | Como usuário, quero conversar com um assistente de IA, para tirar dúvidas e lançar gastos falando | *Function calling* com ferramentas escopadas ao usuário; confirmação antes de gravar; fallback por regras | Média | 1 | ✅ |
| US10 | Como usuário, quero enviar a foto de uma nota fiscal ao assistente, para não digitar o lançamento | Extração por modelo de visão; rascunho para confirmar | Baixa | 1 | ✅ |
| US11 | Como usuário, quero usar o assistente pelo WhatsApp, para registrar gastos sem abrir o app | Webhook da Evolution API; mesmo serviço do painel web | Média | 1 | ✅ |
| US12 | Como usuário, quero instalar o app no celular, para usar como um aplicativo | Manifest, service worker, banner de instalação, barra de navegação inferior | Alta | 1 | ✅ |
| US13 | Como usuário, quero importar o extrato do banco, para não lançar tudo à mão | Upload de arquivo, parser, lote de importação | Baixa | 1 | ✅ |
| US14 | Como usuário, quero exportar meus dados e excluir minha conta, para ter controle sobre eles (LGPD) | Exportação CSV; zona de perigo com exclusão | Baixa | 1 | ✅ |
| US15 | Como usuário, quero buscar e navegar pelo teclado, para usar o app mais rápido | Command Palette (Ctrl+K) | Baixa | 1 | ✅ |
| US16 | Como administrador, quero ver métricas e gerenciar contas, para operar a plataforma | Perfil `Admin`, `[Authorize(Roles)]`, tela `/admin` | Alta | 2 | ✅ |
| US17 | Como pessoa com deficiência, quero navegar com leitor de tela e teclado, para usar o app com autonomia | Auditoria WCAG 2.1 AA automatizada com axe | Média | 2 | ✅ |
| US18 | Como usuário, quero que o assistente me trate sem discriminação, para confiar nas orientações | Diretrizes éticas no prompt do agente (`CopilotEthics.cs`) | Média | 2 | ✅ |
| US19 | Como equipe, queremos o banco em PostgreSQL com procedures e triggers, para atender o manual e ter regras no SGBD | DDL, procedures, triggers, seed, testes SQL no CI | Alta | 2 | ✅ |
| US20 | Como equipe, queremos CI/CD, logs e health checks, para publicar com segurança | GHCR + webhook do Dokploy; logs estruturados; healthchecks; backup | Média | 2 e 3 | ✅ |
| US21 | Como equipe, queremos um quadro Kanban, para acompanhar o andamento | Quadro no GitHub Projects com as issues | Média | 3 | 🔄 Em andamento (issue #16) |
| US22 | Como equipe, queremos o relatório ABNT, para entregar o PIM | Capítulos 1 a 10, referências, revisão, antiplágio | Alta | 4 | 🔄 A fazer |

---

## 4. Cronograma das sprints ✅

Datas das iterações cadastradas no campo *Sprint* do GitHub Project.

| Sprint | Período | Meta | Principais entregas (commits) |
| :-: | --- | --- | --- |
| 1 | 17/10 a 23/10/2026 | Migração do front para React e refação do backend .NET (fases F0 a F11) | Planejamento da migração (inventário, componentes, modelo de dados, contrato da API); API v1 com JWT, categorias, transações, orçamentos, alertas, copilot com *function calling*, exportação; telas React; PWA; CI; OTP e canal WhatsApp pela Evolution API |
| 2 | 24/10 a 30/10/2026 | UX e requisitos técnicos do manual (F13 e F14) | Onboarding; PostgreSQL; procedures e triggers; script unificado e testes SQL; diagramas MER, lógico e físico; perfil e painel administrativo; Swagger completo; ética na IA; WCAG; logs e health checks; CD |
| 3 | 31/10 a 06/11/2026 | Validação, CI/CD e Kanban | Revisão dos critérios de aceite das fases F13 e F14; ajustes de formatação em reais; capturas de tela; diagramas de camadas, classes, service worker e nuvem; quadro Kanban |
| 4 | 07/11 a 13/11/2026 | Relatório ABNT | Redação dos capítulos, referências, revisão, antiplágio e postagem |

> **Histórico anterior (PIM III):** três sprints entre 07/05 e 23/05/2026 produziram o MVP (HTML, ASP.NET Core e SQLite). O PIM IV partiu desse MVP.

**Volume de trabalho ✅:** 257 commits no repositório, 159 deles entre 17/10 e 02/11/2026, e 244 testes automatizados no backend (xUnit). Para atualizar os números antes de entregar: `git log --oneline | wc -l` e `git log --since=2026-10-17 --oneline | wc -l`.

---

## 5. Sprint Backlog

### Sprint 2 — UX e requisitos do manual (24/10 a 30/10) ✅

Os itens são as issues do GitHub Project. Todos foram concluídos em 28/10/2026.

| Issue | Item | Área | Prioridade |
| :-: | --- | --- | :-: |
| #1 | F14.4b — Migrar o runtime da API para PostgreSQL | db, backend | P1 |
| #2 | F14.1 — Script DDL PostgreSQL (modelo físico) | db | P1 |
| #3 | F14.2 — Stored procedures | db | P1 |
| #4 | F14.3 — Triggers | db | P1 |
| #5 | F14.4 — Script unificado, seed, testes SQL e validação no CI | db, infra | P1 |
| #6 | F14.5 — Diagramas MER, lógico e físico atualizados | db, docs | P1 |
| #7 | F14.6 — Perfil administrador (backend) | backend | P1 |
| #8 | F14.7 — Painel administrativo (frontend) | frontend | P1 |
| #9 | F14.8 — Cabeçalhos de segurança HTTP | backend, infra | P2 |
| #10 | F14.9 — Documentação completa do Swagger | backend | P2 |
| #11 | F14.10 — Auditoria WCAG 2.1 AA com testes automatizados | frontend | P3 |
| #12 | F14.11 — Diretrizes éticas e de não discriminação no agente de IA | backend | P3 |
| #13 | F14.12 — Pipeline de CD (publicação de imagens e deploy) | infra | P2 |
| #14 | F14.13 — Logs estruturados, correlation id e health checks reais | backend, infra | P2 |
| #15 | F14.14 — Healthcheck, limites de recursos e backup no Compose | infra | P3 |

Também nessa sprint (fase F13, `docs/02-planejamento/fases/TASKS_FASE_13.md`): redesign do login com OTP, onboarding guiado, destaque do dia atual no gráfico semanal, teto do onboarding no card de consumo, filtro de despesas no totalizador e gráfico de entradas e saídas mais descritivo.

### Sprint 3 — Validação, CI/CD e Kanban (31/10 a 06/11)

| Item | Status |
| --- | :-: |
| Marcar os critérios de aceite verificados das fases F13 e F14 | ✅ |
| Corrigir formatação de valores em reais independentemente da cultura do servidor | ✅ |
| Capturas de tela web e PWA para o relatório | ✅ |
| Diagramas de camadas, classes, service worker e nuvem | ✅ |
| #16 — F14.15 Quadro Kanban no GitHub Projects | 🔄 Falta capturar a visão *Board* |

### Sprint 4 — Relatório ABNT (07/11 a 13/11)

Ver o checklist em [`../../01-relatorio-abnt/GUIA_DE_ENTREGA.md`](../../01-relatorio-abnt/GUIA_DE_ENTREGA.md).

---

## 6. Cerimônias ✏️

Rascunho. **O grupo precisa confirmar como cada cerimônia aconteceu de fato** (presencial, Discord, WhatsApp; duração). Não descreva no relatório uma cerimônia que não aconteceu.

| Cerimônia | Quando | Como (a confirmar) | Saída |
| --- | --- | --- | --- |
| Sprint Planning | Início de cada sprint | Reunião on-line; o PO prioriza as issues e o time estima | Itens movidos para *Todo* com a sprint preenchida |
| Daily | Dias de trabalho | Mensagem assíncrona no grupo: o que fiz, o que farei, impedimentos | Impedimentos registrados nas issues |
| Sprint Review | Fim de cada sprint | Demonstração do app rodando | Itens aceitos vão para *Done* |
| Retrospectiva | Após a review | O que funcionou, o que melhorar | Ajustes no processo (ex.: regras de commit e testes em `.agents/rules/`) |

## 7. Definição de pronto ✅

Uma tarefa só é considerada pronta quando (`.agents/rules/tests.md` e `.github/workflows/ci.yml`):

1. Os critérios de aceite da issue estão marcados.
2. `dotnet test`, `npm test`, `npm run lint` e `npm run build` passam.
3. O job de banco do CI executa os scripts e os testes SQL num PostgreSQL limpo.
4. O commit segue o padrão `tipo(escopo): descrição`.

## 8. Definição das entregas ✅

| Entrega | Conteúdo | Sprint |
| --- | --- | :-: |
| E1 — Aplicação web e API | Painel React e API REST .NET com autenticação, segurança e área administrativa | 1 e 2 |
| E2 — App mobile (PWA) | App instalável com navegação inferior, mesma API | 1 |
| E3 — Banco de dados | Modelos, script completo, procedures, triggers e seed | 2 |
| E4 — Infraestrutura | Contêineres, CI/CD, monitoramento e backup na VPS | 2 e 3 |
| E5 — Relatório ABNT | Documento final postado na UNIP e cópia impressa | 4 |

---

## 9. Quadro Kanban — o que falta fazer

O projeto já existe e as 16 issues estão nele com status e sprint. **A visão de quadro precisa ser criada pela interface do GitHub** (a API não cria visões):

1. Abrir https://github.com/users/Fredson-Santos/projects/1.
2. Clicar em **+ New view** → **Board**. Agrupar por **Status** (colunas *Todo*, *In Progress*, *Done*). Se quiser as colunas do roadmap (*Backlog*, *To Do*, *In Progress*, *Review/Test*, *Done*), adicione as opções no campo *Status*.
3. Capturar o quadro **agora** (issue #16 em *In Progress*) e salvar como `docs/01-relatorio-abnt/figuras/09-kanban-andamento.png`.
4. Fechar a issue #16, capturar de novo e salvar como `09-kanban-final.png`.
5. Opcional: na visão *Roadmap* (agrupada por *Sprint*), capturar `09-roadmap-sprints.png` como figura do cronograma.

Referências sugeridas: Schwaber e Sutherland (*Guia do Scrum*), Sutherland (*Scrum: a arte de fazer o dobro do trabalho na metade do tempo*) e Anderson (*Kanban*). Ver [`REFERENCIAS.md`](../../01-relatorio-abnt/REFERENCIAS.md).
