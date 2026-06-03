# CAPÍTULO 4 — INTEGRAÇÃO CURRICULAR E APLICAÇÃO PRÁTICA DAS DISCIPLINAS

> **Projeto:** Conekta — Sistema Web de Gestão Financeira Pessoal  
> **PIM III:** Projeto Integrador Multidisciplinar — ADS  
> **Última atualização:** 02/06/2026

---

## 4.1 INTRODUÇÃO À INTEGRAÇÃO MULTIDISCIPLINAR

O Projeto Integrador Multidisciplinar (PIM III) constitui um instrumento fundamental de síntese acadêmica, cujo propósito reside na articulação prática dos conhecimentos teóricos adquiridos ao longo do curso de Análise e Desenvolvimento de Sistemas. A concepção e o desenvolvimento do sistema de gestão financeira pessoal, gerido pela empresa fictícia **Conekta**, exigiram a convergência de oito disciplinas curriculares obrigatórias.

O projeto foi conduzido sob a ótica de uma simulação empresarial realista, adotando práticas consolidadas de engenharia de software, arquitetura de sistemas e design centrado no usuário. Cada disciplina desempenhou um papel estrutural no ciclo de vida do produto, garantindo que a solução final apresentasse robustez técnica, usabilidade, segurança, escalabilidade e conformidade com os padrões de acessibilidade.

**Resultado atual:** Sistema funcional com frontend web responsivo (HTML/CSS/JS + React), API REST em ASP.NET Core (.NET 8), banco de dados SQLite, autenticação JWT, suite de 21 testes E2E em Playwright e infraestrutura de deploy via Docker Compose + Nginx.

---

## 4.2 DESENVOLVIMENTO WEB RESPONSIVO

A disciplina de Desenvolvimento Web Responsivo forneceu as bases conceituais e tecnológicas para a construção da camada de apresentação do sistema Conekta. O objetivo primordial consistiu em criar uma interface de usuário que se adaptasse de forma fluida e harmoniosa a diferentes resoluções de tela e dispositivos, desde smartphones até monitores de grande porte.

No que tange à implementação prática, optou-se inicialmente pela utilização de tecnologias web nativas e padronizadas — HTML5, CSS3 e JavaScript puro (Vanilla JavaScript) — visando garantir o controle irrestrito sobre o código gerado e manter o tempo de carregamento da aplicação sistematicamente inferior a dois segundos. Posteriormente, iniciou-se a refatoração progressiva da camada de interface para o framework **React**, visando componentização, reatividade e escalabilidade da interface.

A arquitetura visual foi desenvolvida sob o paradigma **Mobile-First**. Os estilos CSS foram estruturados inicialmente para telas de 375 pixels de largura e, subsequentemente, expandidos por meio de regras de Media Queries para contemplar resoluções de tablets (768px), desktops (1024px) e monitores ultrawide (1920px). A padronização visual foi alcançada por meio de variáveis CSS (Design Tokens) definidas no arquivo `global.css`, centralizando paleta de cores, tipografia, espaçamentos e sombras.

**Telas implementadas:**
- Login e Cadastro (autenticação com validação visual)
- Dashboard (KPIs, gráficos Chart.js, tabela de transações)
- Gestão de Gastos (CRUD com modal e paginação)
- Gestão de Categorias (CRUD visual completo)
- Relatórios (gráficos de linha e barra, filtro por período)
- Alertas (lista tipada, marcar como lido)
- Insights (recomendações de economia simuladas por IA)

O dinamismo da interface e a comunicação assíncrona com o servidor foram implementados por meio da **Fetch API** nativa do JavaScript. O script principal orquestra a interface, interceptando eventos do usuário, gerenciando cabeçalhos de autorização com tokens JWT e manipulando o DOM para renderização reativa de tabelas, gráficos, modais e notificações de feedback (toast).

**Realização:** Todas as 7 telas estão operacionais e integradas com o backend (TASK-009 ✅).

---

## 4.3 ENGENHARIA DE SOFTWARE ÁGIL APLICADA

A gestão do projeto Conekta fundamentou-se nos princípios e artefatos da Engenharia de Software Ágil Aplicada, visando garantir entregas contínuas de valor, adaptabilidade a mudanças e alinhamento constante entre a equipe técnica e as necessidades do negócio. A metodologia adotada espelhou o funcionamento operacional de uma Software House moderna.

O ciclo de desenvolvimento iniciou-se com o levantamento minucioso de requisitos. Foram formalizados **quinze Requisitos Funcionais** (RF1–RF15), abrangendo desde a autenticação de usuários até a geração de relatórios complexos, e **oito Requisitos Não-Funcionais** (RNF1–RNF8), estipulando restrições de desempenho, segurança, compatibilidade e usabilidade.

Para a operacionalização do desenvolvimento, o escopo global foi particionado em **três ciclos iterativos (Sprints)**:

**a) Sprint 1 — MVP base (07–12/05/2026) ✅ Concluído:**
Concentrou-se no estabelecimento da infraestrutura, definição de personas, design system, prototipagem HTML das 5 telas essenciais e implementação da autenticação JWT no backend.

**b) Sprint 2 — CRUD completo + Integração (13–19/05/2026) ✅ Concluído:**
Dedicou-se ao desenvolvimento do CRUD completo de despesas e categorias (frontend + backend), features de alertas, insights e relatórios, além da integração total frontend-backend via API REST.

**c) Sprint 3 — QA + Documentação (20–23/05/2026) 🟡 Em andamento:**
Focou na execução de testes automatizados ponta a ponta (Playwright E2E), acessibilidade, documentação técnica (README, Swagger) e preparação para apresentação.

A rastreabilidade dos requisitos e o monitoramento do progresso foram mantidos por meio de documentos de controle no repositório: `docs/tasks/TASKS.md` (21 tasks), `docs/SPRINT.md` (visão consolidada), `CHANGELOG.md` e arquivos de progresso por task.

**Progresso atual:** 76% concluído (16 de 21 tasks).

---

## 4.4 MODELAGEM DE BANCO DE DADOS E NOSQL

A disciplina de Modelagem de Banco de Dados orientou a estruturação da camada de persistência do sistema Conekta. Tratando-se de uma aplicação financeira, em que a precisão de cálculos, a integridade referencial e a consistência transacional são premissas inegociáveis, realizou-se um estudo comparativo pormenorizado entre os modelos Relacional (SQL) e Não-Relacional (NoSQL).

A justificativa técnica para a seleção do modelo **Relacional** fundamentou-se na exigência de conformidade com as propriedades ACID (Atomicidade, Consistência, Isolamento e Durabilidade) e na necessidade frequente de operações de junção de tabelas e agregações matemáticas complexas para a consolidação de relatórios financeiros. Estruturas NoSQL, embora altamente escaláveis para dados não estruturados, foram consideradas inadequadas para a natureza estritamente tabular e inter-relacionada do domínio financeiro.

O projeto conceitual foi elaborado por meio do **Diagrama Entidade-Relacionamento (DER)**, mapeando cinco entidades centrais: Usuários, Categorias, Transações, Orçamentos e Alertas. A transição para o modelo lógico e físico contemplou a definição de chaves primárias e estrangeiras para garantir a integridade relacional.

**Implementação física:**
- **Banco de dados:** SQLite (portabilidade, zero configuração, arquivo único `financeiro.db`)
- **ORM:** Entity Framework Core 8 (migrations automáticas, LINQ, tipagem forte)
- **Índices compostos:** `transacoes(usuario_id, data_transacao)` e `orcamentos(usuario_id, mes_periodo, ano_periodo)` para otimização das queries do dashboard
- **Tipos monetários:** `DECIMAL(10,2)` em todas as colunas financeiras, prevenindo erros de ponto flutuante
- **Seed data:** Categorias padrão (Alimentação, Transporte, Moradia, Saúde, Lazer) e usuário de teste inseridos automaticamente no startup

Os artefatos de modelagem estão disponíveis em `docs/diagramas/modelo-relacional.puml` e `docs/diagramas/arquitetura-sistema.puml`.

---

## 4.5 PROGRAMAÇÃO ORIENTADA A OBJETOS COM C#

A construção da Interface de Programação de Aplicações (API REST) do sistema Conekta baseou-se nos conceitos de Programação Orientada a Objetos com a linguagem **C# 12** e o ecossistema **ASP.NET Core 8 LTS**. O objetivo consistiu na aplicação de princípios avançados de design de software, com ênfase no encapsulamento de regras de negócio, baixo acoplamento e alta coesão.

A arquitetura do backend foi estruturada em **quatro camadas lógicas distintas:**

**a) Camada de Controladores (Controllers):**
Intercepta as requisições HTTP, realiza validação sintática preliminar, aplica filtros de autorização (`[Authorize]`) e orquestra as respostas padronizadas da API. Cada controller mapeia um domínio: Auth, Expenses, Categories, Reports, Alerts, Insights.

**b) Camada de Serviços (Services):**
Contém a lógica central do domínio. É nesta camada que residem as regras de negócio: cálculo de KPIs de relatórios, validação de limites orçamentários e geração automática de alertas (`AlertService` — disparo ao atingir 80% e 100% do orçamento por categoria).

**c) Camada de Repositórios (Repositories):**
Isola a comunicação direta com o banco de dados por meio do padrão de projeto **Repository**, permitindo que a camada de serviços realize consultas limpas e desacopladas da tecnologia de persistência subjacente.

**d) Camada de Domínio (Domain + DTOs):**
Separa as entidades mapeadas no banco de dados dos objetos utilizados para o tráfego de informações nas requisições/respostas HTTP, aumentando segurança e flexibilidade da API.

A segurança da aplicação foi reforçada pela implementação de um middleware de autenticação baseado em **JSON Web Tokens (JWT)**, assegurando que apenas requisições com tokens válidos tenham acesso aos dados financeiros. As validações de domínio foram automatizadas por meio da biblioteca **FluentValidation**. A documentação da API foi gerada automaticamente via **Swagger/OpenAPI** (acessível em `/swagger`).

**Testes automatizados implementados (TASK-013):**
- Testes unitários com xUnit + Moq (Services e Validators)
- Testes de integração (Controllers)
- Cobertura ≥ 80% da lógica core (em validação)

---

## 4.6 UX E UI DESIGN

A disciplina de UX e UI Design norteou o desenvolvimento da experiência do usuário e a interface visual do sistema. A metodologia adotada priorizou a compreensão empática do público-alvo e a criação de uma interface intuitiva, ergonômica e esteticamente sofisticada.

**Pesquisa UX (TASK-005 ✅):**
Elaboração de três personas detalhadas, representando os principais perfis de usuários:
- **Marco Oliveira** (32 anos) — profissional autônomo, controle de fluxo de caixa
- **Júlia Mendes** (26 anos) — assalariada, planejamento de investimentos
- **Pedro Ramos** (41 anos) — pequeno empresário, gestão de custos

Para cada persona, foram desenvolvidos Mapas de Empatia, mapeamentos de jornada e análises de Jobs to be Done (JTBD). O documento completo está disponível em `frontend/personas.md`.

**Design System (TASK-006 ✅):**

*a) Cores e Semântica:*
Verde floresta como cor primária (segurança, crescimento financeiro); teal para botões de ação principal; âmbar para advertências; vermelho para erros e despesas elevadas.

*b) Tipografia:*
DM Serif Display para cabeçalhos (elegância editorial) + DM Sans para corpo de texto e valores numéricos (legibilidade superior).

*c) Componentes padronizados:*
Button, Input, Card, Modal, Toast — especificados com estados visuais e interativos consistentes em todas as 7 telas do sistema.

*d) Grid e breakpoints:*
12 colunas, 375px (mobile), 768px (tablet), 1024px (desktop), 1920px (ultrawide).

---

## 4.7 MACHINE LEARNING E ANÁLISE DE DADOS

A inserção da disciplina de Machine Learning e Análise de Dados teve como propósito capacitar o sistema a transformar o volume de transações financeiras brutas em informações estratégicas e preditivas para auxiliar a tomada de decisão do usuário.

**Análise de Dados — KPIs em tempo real (TASK-012 ✅):**
O backend foi equipado com serviços dedicados à consolidação de indicadores-chave de desempenho. O `ReportService` processa o histórico financeiro para apresentar:
- Somatório total de despesas do período
- Saldo remanescente frente às receitas cadastradas
- Identificação automática do maior gasto individual
- Curva de tendência de consumo (últimos 6 meses via `/reports/trend`)
- Distribuição de gastos por categoria (`/reports/by-category`)

**IA Simulada — Insights proativos (TASK-012 ✅):**
O `InsightService` opera inspecionando continuamente o padrão de despesas do usuário sob dois prismas:

*a) Detecção de Anomalias:*
Algoritmos de monitoramento identificam transações singulares que destoam significativamente da média habitual (despesas imprevistas acima de R$ 1.000), gerando alertas imediatos via `AlertService`.

*b) Recomendações de Otimização:*
O sistema calcula o percentual de comprometimento por categoria. Caso categorias de consumo flexível (lazer, alimentação externa) ultrapassem a margem recomendada do orçamento mensal, o sistema gera automaticamente sugestões personalizadas de readequação e metas de economia (acessíveis via `/insights`).

**Sistema de Alertas Automáticos:**
O `AlertService` dispara alertas em dois limiares: ao atingir 80% do limite da categoria e ao exceder 100% (orçamento_excedido). Alertas são gerenciados via `/alerts` (listar, marcar como lido, deletar).

---

## 4.8 COMUNICAÇÃO, LIDERANÇA E NEGOCIAÇÃO

A disciplina de Comunicação, Liderança e Negociação forneceu o arcabouço conceitual para a governança do projeto, gestão de conflitos, tomada de decisão técnica e relacionamento interpessoal dentro do ambiente simulado da Software House Conekta.

**Estrutura da equipe:**

| Integrante | RA | Papel | Responsabilidade |
|------------|----|-------|------------------|
| Fredson Silva dos Santos | R427FB0 | Tech Lead | Arquitetura, revisão de código, integração contínua, decisões técnicas |
| Anderson Raulino da Silva | F3620J8 | Product Owner | Requisitos, backlog, negociação de escopo com stakeholders |
| Eduardo de Sousa Pereira | H759CH8 | Backend Developer | API REST em C#, testes unitários |
| Matheus da Silva Brito | R839DA4 | Frontend Developer | Interface web responsiva, integração com API |
| Raphael Caique da S. Negreiros | R850765 | Data Engineer | Modelagem de dados, análise, otimização de queries |
| Miguel dos Santos M. Siroma | R540EA6 | UX/UI + Documentação | Personas, design system, padronização ABNT |

**Decisões arquiteturais negociadas e documentadas (ADRs):**
- Adoção de SQLite em vez de PostgreSQL (portabilidade para avaliação)
- Uso de Controllers em vez de Minimal API (escalabilidade e Swagger)
- Adiamento de funcionalidades P2 (exportação PDF, autenticação social) para sprint futuro
- Decisão de usar React na refatoração do frontend (componentização)

A padronização da comunicação interna foi materializada por meio de artefatos de governança: `docs/tasks/TASKS.md`, `docs/SPRINT.md`, `CHANGELOG.md`, guias de execução de testes E2E, templates de bug report e checklists de validação de critérios de aceitação.

---

## 4.9 LÍNGUA BRASILEIRA DE SINAIS (LIBRAS) E ACESSIBILIDADE

A disciplina de Língua Brasileira de Sinais (LIBRAS) promoveu a conscientização e a aplicação prática de diretrizes de acessibilidade e inclusão digital, garantindo que a plataforma Conekta seja plenamente utilizável por cidadãos com deficiências sensoriais ou limitações motoras.

A acessibilidade foi enquadrada como Requisito Não-Funcional de prioridade máxima (RNF5). No desenvolvimento da interface web, aplicaram-se rigorosamente as diretrizes do consórcio W3C — **WCAG 2.1 Nível AA** (TASK-014, parcialmente concluído):

**a) Semântica e Assistência Tecnológica (✅ Concluído):**
Utilização estrita de marcação HTML5 semântica para seções de navegação, conteúdo principal e rodapés. Implementou-se extensa camada de atributos ARIA (Accessible Rich Internet Applications), permitindo que leitores de tela transmitam corretamente o propósito de botões iconográficos e anunciem dinamicamente mensagens de erro ou sucesso sem recarregar a página.

**b) Ergonomia Motor e Teclado (✅ Concluído):**
A interface foi inteiramente adaptada para navegação exclusiva por teclado. Implementaram-se atalhos de salto direto ao conteúdo principal (skip-links) e lógicas de aprisionamento de foco (Focus Trap) em janelas modais, impedindo que o usuário se perca nos elementos de fundo ao preencher formulários.

**c) Contraste Visual (✅ Concluído):**
As cores da aplicação foram submetidas a testes de razão de contraste, assegurando o cumprimento da proporção mínima de 4,5:1 exigida pela WCAG 2.1 AA, garantindo legibilidade para pessoas com daltonismo ou baixa visão.

**d) Testes com Screen Reader (⏳ Pendente — TASK-014.4):**
Validação com NVDA/JAWS programada para conclusão na Sprint 3.

**e) Lighthouse Score ≥ 90 (⏳ Pendente — TASK-014.5):**
Auditoria de acessibilidade via Google Lighthouse pendente.

**LIBRAS — Abordagem conceitual:**
O projeto adotou uma especificação arquitetural conceitual para integração com ferramentas de tradução automática baseadas em avatares tridimensionais (padrão Hand Talk / VLibras). A documentação detalha como essas ferramentas interpretam a árvore estrutural e os atributos semânticos da página web para realizar a tradução fiel do conteúdo financeiro para a LIBRAS, promovendo a inclusão efetiva da comunidade surda (TASK-026 — documentação planejada).

---

## 4.10 SÍNTESE DA CORRELAÇÃO CURRICULAR E REQUISITOS

A articulação entre as disciplinas acadêmicas e os requisitos técnicos do projeto Conekta evidencia a completude da solução desenvolvida.

| Disciplina | Artefatos Produzidos | Status |
|-----------|---------------------|--------|
| Desenvolvimento Web Responsivo | 7 telas HTML/CSS/JS + React | ✅ |
| Engenharia de Software Ágil | TASKS.md, SPRINT.md, CHANGELOG, 3 Sprints | 🟡 76% |
| Modelagem de Banco de Dados | DER, modelo relacional, SQLite + EF Core | ✅ |
| Programação OO com C# | API REST ASP.NET Core, 6 controllers, JWT | ✅ |
| UX e UI Design | 3 personas, design system, protótipos | ✅ |
| Machine Learning e Análise | KPIs, ReportService, InsightService, AlertService | ✅ |
| Comunicação e Liderança | ADRs, documentação de governança, changelogs | ✅ |
| LIBRAS e Acessibilidade | WCAG AA (parcial), ARIA, teclado, contraste | 🟡 |

A interface web responsiva atende aos requisitos de apresentação e usabilidade em múltiplos dispositivos; a modelagem relacional e a programação em C# sustentam a integridade e a lógica das transações financeiras; as práticas de UX e análise de dados agregam valor estratégico ao usuário final; enquanto a governança ágil e as diretrizes de acessibilidade garantem a qualidade do processo de desenvolvimento e a responsabilidade social do software entregue.

Desta forma, o sistema Conekta consolida com êxito os objetivos pedagógicos estipulados para o Projeto Integrador Multidisciplinar III.
