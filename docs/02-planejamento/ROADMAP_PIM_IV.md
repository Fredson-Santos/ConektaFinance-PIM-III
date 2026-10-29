# 🚀 ROADMAP — PIM IV (ConektaFinance)

> **Projeto Integrado Multidisciplinar IV — CST em Análise e Desenvolvimento de Sistemas (UNIP)**
> **Tema:** Desenvolvimento e Implantação de uma Solução Tecnológica Corporativa Integrada para Apoiar a Transformação Digital de uma Empresa (Continuação do PIM III).
> **Meta da Nota:** 10,0 / 10,0
> **Regra de Extensão:** Mínimo de 20 e máximo de 30 páginas no corpo do **Desenvolvimento**.

---

## 📊 Progresso Geral

- [ ] **Etapa 1:** Caracterização da Organização *(1,0 pt)*
- [ ] **Etapa 2:** Planejamento da Solução Tecnológica — Empreendedorismo *(1,0 pt)*
- [ ] **Etapa 3:** Responsabilidade Social e Diversidade *(0,5 pt)*
- [ ] **Etapa 4:** Solução Web & APIs REST em .NET *(2,0 pts)*
- [ ] **Etapa 5:** Solução Mobile via PWA *(2,0 pts)*
- [ ] **Etapa 6:** Arquitetura de Software (.NET / POO / Camadas)
- [ ] **Etapa 7:** Projeto e Programação de Banco de Dados *(1,0 pt)*
- [ ] **Etapa 8:** Nuvem e Práticas de DevOps *(0,5 pt)*
- [ ] **Etapa 9:** Gerenciamento Ágil do Projeto *(1,0 pt)*
- [ ] **Estrutura Formal & Normas ABNT** *(1,0 pt)*
- [ ] **Revisão Antiplágio e Postagem**

---

## 🏢 Etapa 1: Caracterização da Organização *(Valor: 1,0 ponto)*

*Apresentação formal da empresa/organização que demanda ou desenvolve a solução.*

- [ ] Definir a caracterização da empresa desenvolvedora (Software House fictícia: **Conekta Tech Solutions**).
- [ ] Descrever ramo de atuação, missão, visão, valores e estrutura corporativa.
- [ ] Mapear o público-alvo e nicho de mercado atendido pela plataforma ConektaFinance.
- [ ] Detalhar o problema de mercado: desorganização financeira, falta de centralização de despesas e carência de automação/inteligência em finanças pessoais.
- [ ] Apresentar oportunidades de melhoria alavancadas pela transformação digital.
- [ ] **Redação acadêmica:** Escrever a seção da Etapa 1 no relatório ABNT.

---

## 💡 Etapa 2: Planejamento da Solução Tecnológica *(Valor: 1,0 ponto)*

*Disciplina: Empreendedorismo em TI*

- [ ] Elaborar a proposta de valor e problema central a ser solucionado.
- [ ] Montar o **Business Model Canvas** (Parcerias, Atividades, Proposta de Valor, Relacionamento, Canais, Segmentos, Recursos, Estrutura de Custos, Fontes de Receita).
- [ ] Análise de viabilidade técnica, econômica e de mercado.
- [ ] Mapear diferenciais competitivos:
  - [ ] Assistente Financeiro Inteligente com IA generativa / Function Calling.
  - [ ] Integração de canal rápido (ex.: bot / notificações WhatsApp).
  - [ ] Suporte a PWA multiplataforma de custo zero de distribuição.
- [ ] **Redação acadêmica:** Documentar o modelo de negócio, Canvas e diferenciais no relatório.

---

## 🤝 Etapa 3: Responsabilidade Social e Diversidade *(Valor: 0,5 ponto)*

*Disciplina EAD: Relações Étnico-Raciais e Afrodescendência*

- [ ] Definir ações de inclusão e cidadania por meio da tecnologia:
  - [ ] Democratização do controle orçamentário e educação financeira para classes sociais vulneráveis.
  - [ ] Linguagem simples e acessível, evitando jargões bancários excludentes.
- [ ] Acessibilidade Digital (Diretrizes WCAG 2.1):
  - [ ] Contraste adequado de cores (modo claro / escuro acessível).
  - [ ] Compatibilidade com leitores de tela (marcação semântica HTML e atributos `aria-*`).
  - [ ] Navegabilidade via teclado e alvos de toque generosos (mínimo de 44x44px).
- [ ] Princípios éticos de inteligência artificial (ausência de vieses discriminatórios em insights e crédito).
- [ ] **Redação acadêmica:** Escrever o capítulo detalhando o impacto social e recursos inclusivos.

---

## 🌐 Etapa 4: Desenvolvimento da Solução Web *(Valor: 2,0 pontos)*

*Disciplina: Desenvolvimento Web com .NET*

### Backend & APIs REST (.NET)

- [ ] Revisar e expandir os endpoints da Web API em ASP.NET Core:
  - [ ] Autenticação & Autorização (registro, login, validação via JWT).
  - [ ] CRUD de Usuários e Perfil.
  - [ ] CRUD de Transações (Receitas e Despesas) com paginação e filtros.
  - [ ] CRUD de Categorias e Orçamentos com limites mensais.
  - [ ] Endpoints para Insights/Relatórios consolidados.
  - [ ] Endpoints para integração com IA (assistente financeiro / function calling).
- [ ] Implementar boas práticas de segurança:
  - [ ] Hash seguro de senhas (BCrypt).
  - [ ] Tratamento global de exceções (Middleware).
  - [ ] Validações de payload via FluentValidation.
  - [ ] Proteção CORS e cabeçalhos de segurança.
- [ ] Swagger / OpenAPI documentando 100% dos endpoints.

### Frontend Web (Painel Administrativo & Dashboard)

- [ ] Estruturar o frontend atualizado (React / Vite com suporte a design system moderno).
- [ ] Implementar fluxo de autenticação e rotas protegidas (Login, Cadastro).
- [ ] Dashboard analítico com métricas, saldos, gráficos de tendência e despesas por categoria.
- [ ] Gerenciamento de despesas e orçamentos mensais com alertas visuais.
- [ ] **Redação acadêmica:** Capturar prints do Swagger, telas da aplicação web, diagramas de rotas e documentar no relatório.

---

## 📱 Etapa 5: Desenvolvimento da Solução Mobile via PWA *(Valor: 2,0 pontos)*

*Disciplina: Desenvolvimento Mobile (Autorizado pelo orientador como PWA)*

### Implementação Técnica do PWA

- [ ] Configurar **Web App Manifest (`manifest.json` / `manifest.webmanifest`)**:
  - [ ] `display: "standalone"` (experiência sem barra de navegador).
  - [ ] Ícones oficiais do ConektaFinance (192x192, 512x512, maskable icons).
  - [ ] Definição de `name`, `short_name`, `theme_color` e `background_color`.
- [ ] Implementar e registrar o **Service Worker**:
  - [ ] Estratégia de cache para recursos estáticos essenciais (HTML, CSS, JS, ícones).
  - [ ] Fallback amigável de conexão offline.
- [ ] Interface Mobile-First:
  - [ ] Bottom Navigation Bar fixa (Home, Transações, IA, Perfil).
  - [ ] Telas otimizadas para toque e viewports de smartphones (375px a 430px).
  - [ ] Formulários com modais/bottom sheets de lançamento rápido de despesas.

### Evidências e Documentação Acadêmica

- [ ] Fundamentar a escolha do PWA: comparativo teórico (*Nativo vs. Híbrido vs. PWA*), vantagens de custo, universalidade e ausência de atrito em lojas.
- [ ] Captura de prints do PWA rodando em moldura de celular:
  - [ ] Banner de instalação no smartphone ("Adicionar à tela de início").
  - [ ] Aplicativo aberto em modo standalone direto da tela do smartphone.
  - [ ] Fluxo de navegação móvel (Bottom Bar e telas).
- [ ] Inserir diagrama do ciclo de vida do Service Worker e trecho do `manifest.json`.

---

## 🏛️ Etapa 6: Arquitetura de Software

*Disciplina: Programação Aplicada em .NET*

- [ ] Definir e documentar a arquitetura em camadas do Backend:
  - [ ] **Domain:** Entidades de domínio, Enums, Interfaces de repositório.
  - [ ] **Application:** DTOs, Serviços de aplicação, Casos de uso, Validadores.
  - [ ] **Infrastructure:** DbContext, Mapeamentos ORM, Migrations, Repositórios.
  - [ ] **Presentation / API:** Controllers, Middlewares, Dependency Injection.
- [ ] Documentar a aplicação dos princípios de Orientação a Objetos (Herança, Encapsulamento, Polimorfismo e Abstração).
- [ ] Aplicar princípios do SOLID no código-fonte (ex.: injeção de dependência via interfaces).
- [ ] Elaborar o Diagrama de Classes e Diagrama de Pacotes/Camadas.
- [ ] **Redação acadêmica:** Documentar a arquitetura com diagramas UML no relatório.

---

## 🗄️ Etapa 7: Projeto e Programação de Banco de Dados *(Valor: 1,0 ponto)*

*Disciplina: Programação de Banco de Dados*

- [ ] Elaborar o **Modelo Conceitual / MER** (Entidades: Usuário, Despesa, Categoria, MetaOrçamento, Notificação, Importação).
- [ ] Elaborar o **Modelo Lógico** com chaves primárias (PK), chaves estrangeiras (FK), tipos de dados e cardinalidades.
- [ ] Elaborar o **Modelo Físico** (Scripts SQL DDL compatíveis com SGBD corporativo como PostgreSQL / SQL Server).
- [ ] Implementar e documentar **Stored Procedures**:
  - [ ] Procedure para fechamento/consolidação mensal de saldo por usuário.
  - [ ] Procedure para cálculo automatizado de extrapolação de orçamento por categoria.
- [ ] Implementar e documentar **Triggers**:
  - [ ] Trigger de atualização de timestamp (`atualizado_em`) e auditoria de alterações.
  - [ ] Trigger de alerta de limite orçamentário quando uma despesa é inserida.
- [ ] Script completo `.sql` unificado pronto para execução e homologação.
- [ ] **Redação acadêmica:** Inserir os diagramas ER, schemas e código das procedures/triggers no relatório.

---

## ☁️ Etapa 8: Infraestrutura em Nuvem e DevOps *(Valor: 0,5 ponto)*

*Disciplina EAD: Cloud Computing e DevOps*

- [ ] Documentar a infraestrutura de containers:
  - [ ] `Dockerfile` do Backend (.NET).
  - [ ] `Dockerfile` do Frontend / PWA (Nginx).
  - [ ] `docker-compose.yml` integrando API, Frontend e Banco de Dados.
- [ ] Elaborar pipeline de **CI/CD** (GitHub Actions):
  - [ ] Etapa de validação de Build do .NET e do Frontend.
  - [ ] Etapa de Testes automatizados.
  - [ ] Publicação/Deploy automatizado da imagem Docker.
- [ ] Desenhar o Diagrama de Arquitetura em Nuvem (VPS/Cloud Provider, Nginx Reverse Proxy, SSL Let's Encrypt, Containers, Volumes mapeados).
- [ ] Definir estratégias de monitoramento, logs (Serilog) e escalabilidade.
- [ ] **Redação acadêmica:** Documentar containers, pipeline CI/CD e diagrama de nuvem no relatório.

---

## 📋 Etapa 9: Gerenciamento Ágil do Projeto *(Valor: 1,0 ponto)*

*Disciplina: Gerenciamento de Projetos Ágil*

- [ ] Definir a metodologia ágil adotada (Framework Scrum + Kanban).
- [ ] Elaborar o **Product Backlog** completo com User Stories (`Como [persona], quero [ação], para que [benefício]`) e critérios de aceitação.
- [ ] Planejar a divisão das Sprints (Sprint Backlog 1, 2, 3 e 4 com datas e metas).
- [ ] Criar a representação do **Quadro Kanban** (Backlog, To Do, In Progress, Review/Test, Done).
- [ ] Documentar cerimônias ágeis (Sprint Planning, Daily, Sprint Review e Retrospectiva).
- [ ] **Redação acadêmica:** Inserir tabelas de backlog, cronograma das sprints e imagem do quadro Kanban.

---

## 📚 Estrutura Formal do Relatório & ABNT *(Valor: 1,0 ponto)*

### Elementos Pré-Textuais

- [ ] Capa (Instituição, Curso, Título, Autores, Local, Ano).
- [ ] Folha de Rosto (com a natureza do trabalho e orientador).
- [ ] Resumo em Português com 3 a 5 Palavras-chave (máximo 500 palavras).
- [ ] Abstract em Inglês com 3 a 5 Keywords.
- [ ] Sumário numerado gerado conforme ABNT NBR 6027.
- [ ] Lista de Figuras e Ilustrações (opcional / recomendada).
- [ ] Lista de Tabelas e Abreviaturas (opcional).

### Elementos Textuais (Limite Rígido: 20 a 30 páginas)

- [ ] **1. Introdução:** Contextualização, problema, objetivos gerais/específicos e justificativa.
- [ ] **2. Caracterização da Organização:** (Etapa 1).
- [ ] **3. Planejamento e Empreendedorismo:** (Etapa 2).
- [ ] **4. Responsabilidade Social e Diversidade:** (Etapa 3).
- [ ] **5. Arquitetura de Software e Solução Web .NET:** (Etapas 4 e 6).
- [ ] **6. Solução Mobile (PWA):** (Etapa 5).
- [ ] **7. Modelagem e Programação de Banco de Dados:** (Etapa 7).
- [ ] **8. Nuvem e DevOps:** (Etapa 8).
- [ ] **9. Gerenciamento Ágil do Projeto:** (Etapa 9).
- [ ] **10. Conclusão:** Retomada dos objetivos, desafios enfrentados e trabalhos futuros.

### Elementos Pós-Textuais & Formatação

- [ ] Referências Bibliográficas segundo ABNT NBR 6023 (livros, artigos técnicos, documentações oficiais).
- [ ] Formatação ABNT rigorosa:
  - [ ] Margens: 3 cm Superior e Esquerda; 2 cm Inferior e Direita.
  - [ ] Fonte: Arial ou Times New Roman 12 (citações longas e notas tam. 10).
  - [ ] Espaçamento entrelinhas: 1,5 linha (citações longas e notas: simples).
  - [ ] Parágrafo: Recuo de 1,5 cm na primeira linha.
  - [ ] Paginação correta: Contada da folha de rosto, exibida a partir da Introdução no canto superior direito.

---

## 🔒 Validação Final e Entrega

- [ ] Verificação de Similaridade Antiplágio (garantir redação original e citações devidamente creditadas).
- [ ] Revisão ortográfica, gramatical e de concordância.
- [ ] Validação do arquivo PDF final (verificação de quebras de página e numeração).
- [ ] Postagem do arquivo final no sistema acadêmico da UNIP dentro do prazo estipulado.
