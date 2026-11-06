# Planejamento da solução e modelo de negócio — rascunho

> **Status: RASCUNHO PARA VALIDAÇÃO DO GRUPO.** ✏️ = proposta a confirmar. ✅ = existe no sistema. Os campos `[preencher]` exigem pesquisa de preço ou decisão do grupo; **não invente valores**.

O manual pede (Etapa 2, Empreendedorismo em TI): problema, objetivos da solução, público-alvo, proposta de valor, benefícios esperados e diferenciais competitivos. O roadmap acrescenta o Business Model Canvas e a análise de viabilidade.

---

## 1. Problema ✅

Pessoas físicas não têm uma visão clara e atualizada de quanto ganham, quanto gastam e em quê. As ferramentas existentes exigem disciplina para registrar cada gasto e conhecimento para interpretar os números. O resultado é descobrir o estouro do orçamento só no fim do mês.

## 2. Objetivos da solução

**Objetivo geral ✅:** oferecer uma plataforma integrada (web, mobile, IA e WhatsApp) que facilite o registro, o acompanhamento e o planejamento das finanças pessoais.

**Objetivos específicos ✅:**

1. Reduzir o esforço de registro com o assistente de IA, a foto da nota fiscal e o WhatsApp.
2. Avisar o usuário antes do estouro do orçamento (alertas de 80% e 100%).
3. Funcionar no celular e no computador com a mesma conta e os mesmos dados.
4. Ser acessível (WCAG 2.1 AA) e usar linguagem simples.
5. Proteger os dados do usuário (JWT, BCrypt, auditoria, exportação e exclusão de conta).

## 3. Público-alvo ✏️

| Segmento | Perfil | Necessidade principal |
| --- | --- | --- |
| Primário | Jovens adultos e trabalhadores assalariados, de 18 a 40 anos, que usam o WhatsApp todos os dias e não usam ferramenta de finanças | Saber para onde vai o dinheiro com pouco esforço |
| Secundário | Autônomos e microempreendedores que misturam gasto pessoal e do negócio | Separar e acompanhar categorias |
| Social | Pessoas com pouca familiaridade digital ou em endividamento | Linguagem simples, alertas, educação financeira |

Personas do PIM III que podem ser reaproveitadas: Marco Oliveira (32, autônomo), Júlia Mendes (26, assalariada) e Pedro Ramos (41, pequeno empresário). Ver `legacy/docs-pim-III/arquitetura/INTEGRACAO_DISCIPLINAS_ABNT.md`, seção 4.6.

## 4. Proposta de valor ✏️

> "Controle o seu dinheiro conversando: registre gastos pelo WhatsApp ou por uma foto e receba um aviso antes de estourar o orçamento, no celular ou no computador, sem instalar nada da loja."

## 5. Benefícios esperados ✏️

- **Para o usuário:** menos tempo registrando gastos; visão do mês em uma tela; avisos antes do estouro; uso em qualquer aparelho.
- **Para a empresa:** uma só base de código para web e mobile (menor custo de manutenção); distribuição sem loja; entregas automáticas com CI/CD.
- **Para a sociedade:** educação financeira acessível; inclusão digital (ver capítulo 4).

## 6. Diferenciais competitivos ✅ (funcionalidades) / ✏️ (comparação)

Concorrentes a pesquisar e citar: **Mobills**, **Organizze**, **Minhas Economias**, os recursos de controle de gastos dos **apps dos próprios bancos** e as **planilhas**. O colega deve conferir nos sites oficiais o que cada um oferece hoje e preencher a tabela.

| Recurso | ConektaFinance | Mobills | Organizze | App do banco | Planilha |
| --- | :-: | :-: | :-: | :-: | :-: |
| Registro por conversa com IA (*function calling*) | ✅ | [preencher] | [preencher] | [preencher] | ❌ |
| Registro e login pelo WhatsApp | ✅ | [preencher] | [preencher] | [preencher] | ❌ |
| Foto da nota fiscal vira lançamento | ✅ | [preencher] | [preencher] | [preencher] | ❌ |
| Alerta de 80% e 100% por categoria | ✅ | [preencher] | [preencher] | [preencher] | Manual |
| Funciona sem loja de apps (PWA) | ✅ | [preencher] | [preencher] | ❌ | ✅ |
| Gratuito | [decidir] | [preencher] | [preencher] | ✅ | ✅ |

## 7. Business Model Canvas ✏️

Sugestão: montar o Canvas como **Figura** (modelo do Strategyzer ou desenhado no Canva/draw.io) e usar o conteúdo abaixo.

| Bloco | Conteúdo |
| --- | --- |
| **Parcerias principais** | Provedor de IA (API de modelos de linguagem e de visão); Evolution API / WhatsApp; provedor de VPS; GitHub (código, CI/CD e registro de imagens); instituições de educação financeira e ONGs (divulgação) |
| **Atividades principais** | Desenvolver e manter a plataforma; operar a infraestrutura; treinar e ajustar o assistente; garantir segurança e LGPD; suporte |
| **Recursos principais** | Código-fonte e equipe de desenvolvimento; banco de dados; servidor e pipeline; marca ConektaFinance |
| **Proposta de valor** | Controle financeiro por conversa (IA e WhatsApp), alertas antes do estouro, mesmo app no celular e no computador, acessível e sem loja |
| **Relacionamento com clientes** | Autoatendimento; assistente de IA 24 h; onboarding guiado; alertas e resumo do mês |
| **Canais** | Link do PWA; WhatsApp; redes sociais; indicação; parcerias com escolas e ONGs |
| **Segmentos de clientes** | Jovens adultos assalariados; autônomos e microempreendedores; pessoas em endividamento ou com pouca familiaridade digital |
| **Estrutura de custos** | Servidor (VPS); chamadas à API de IA (por uso); domínio; WhatsApp (número e infraestrutura da Evolution API); horas da equipe; marketing |
| **Fontes de receita** | Modelo *freemium* ✏️: plano gratuito com registro manual e alertas; plano pago com IA ilimitada, WhatsApp e relatórios avançados. Alternativa: licença para empresas oferecerem a plataforma como benefício aos funcionários |

> Ligação com o código ✅: o limite diário de mensagens do assistente já existe (`Copilot__DailyMessageLimit=30` no `.env.example`). Ele pode ser apresentado como a base técnica para diferenciar o plano gratuito do pago.

## 8. Análise de viabilidade

### 8.1 Técnica ✅

Viável: a solução está implementada, publicada em contêineres e testada (244 testes no backend, testes de frontend, testes SQL e acessibilidade no CI). Tecnologias maduras e gratuitas: .NET, React, PostgreSQL, Docker. A parte de IA tem *fallback* por regras: se o provedor de IA cair, o assistente continua respondendo.

### 8.2 Econômica ✏️

Custos mensais estimados de operação (pesquisar preços atuais e citar a fonte e a data):

| Item | Fonte do preço | Valor mensal |
| --- | --- | --: |
| VPS (2 vCPU, 4 GB RAM) que roda todos os contêineres | site do provedor usado | R$ [preencher] |
| Domínio `.com.br` (anual ÷ 12) | registro.br | R$ [preencher] |
| Certificado HTTPS | Let's Encrypt (via Traefik) | R$ 0,00 |
| API de IA (modelo de texto e de visão) | página de preços do provedor | R$ [preencher] por usuário ativo |
| GitHub (repositório, Actions e GHCR) | plano gratuito | R$ 0,00 |
| **Total de infraestrutura** | | **R$ [somar]** |

Com o total, calcular o **ponto de equilíbrio**: quantos assinantes do plano pago cobrem o custo (`custo mensal ÷ preço da assinatura`). Os limites de recursos dos contêineres em `docker-compose.yml` ajudam a justificar o tamanho da VPS: backend 1 CPU / 512 MB; PostgreSQL 1 CPU / 512 MB; frontend 0,5 CPU / 128 MB; Evolution API 1 CPU / 1 GB; mais o Postgres e o Redis da Evolution e o serviço de backup.

### 8.3 De mercado ✏️

Argumentos a fundamentar com fonte: alto nível de endividamento das famílias (PEIC/CNC); uso quase universal do WhatsApp no Brasil (pesquisas como TIC Domicílios, do Cetic.br); crescimento do uso de IA generativa no dia a dia. Concorrentes existem, o que confirma a demanda; o diferencial está no registro por conversa e no acesso sem loja.

Referências sugeridas: Osterwalder e Pigneur (*Business Model Generation*), Osterwalder et al. (*Value Proposition Design*), Dornelas (*Empreendedorismo*) e Ries (*A startup enxuta*), além das pesquisas citadas. Ver [`REFERENCIAS.md`](../../01-relatorio-abnt/REFERENCIAS.md).
