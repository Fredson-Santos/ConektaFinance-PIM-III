# Caracterização da organização — rascunho

> **Status: RASCUNHO PARA VALIDAÇÃO DO GRUPO.** Os itens marcados com ✏️ são propostas, não fatos. O grupo deve confirmar ou ajustar antes de usar no capítulo 2. O que está marcado com ✅ vem do PIM III ou do próprio sistema.

O manual pede: segmento de atuação, produtos ou serviços, estrutura organizacional, principais processos, problemas identificados e oportunidades de melhoria por meio da tecnologia.

---

## 1. Identificação ✅

| Item | Conteúdo |
| --- | --- |
| Nome | **Conekta Tech Solutions** (empresa fictícia, *software house*) |
| Produto principal | **ConektaFinance**, plataforma de gestão financeira pessoal com web, app (PWA), assistente de IA e WhatsApp |
| Origem | Estudo e MVP desenvolvidos no PIM III (maio/2026); o PIM IV moderniza e amplia a solução |
| Natureza | Empresa simulada para fins acadêmicos. Deixar isso claro na Introdução |

## 2. Segmento de atuação ✏️

Tecnologia da informação, no nicho de **tecnologia financeira (fintech) para pessoas físicas**, com foco em controle de gastos e educação financeira. Não é um banco, não movimenta dinheiro e não oferece crédito: organiza os dados financeiros que o próprio usuário registra ou importa.

## 3. Missão, visão e valores ✏️

- **Missão:** ajudar pessoas a entender e controlar o próprio dinheiro com tecnologia simples, acessível e inteligente.
- **Visão:** ser referência em organização financeira pessoal acessível para quem nunca usou uma ferramenta de finanças.
- **Valores:** simplicidade; inclusão e acessibilidade; privacidade e segurança dos dados (LGPD); ética no uso de IA; melhoria contínua.

## 4. Produtos e serviços ✅

| Produto / serviço | Descrição |
| --- | --- |
| Painel web | Dashboard, lançamentos, categorias, orçamentos, relatórios, configurações |
| App mobile (PWA) | Mesmo sistema instalado no celular, com navegação inferior |
| Assistente de IA | Responde dúvidas, resume o mês e registra lançamentos por conversa ou foto de nota fiscal |
| Canal WhatsApp | Login por código (OTP) e conversa com o assistente sem abrir o app |
| Alertas e relatórios | Alertas de 80% e 100% do teto, fechamento mensal, exportação CSV |
| Área administrativa | Métricas de uso e gestão de contas, para a operação da empresa |

## 5. Estrutura organizacional ✏️

Proposta de organograma para uma *software house* pequena, ligando cada área a um integrante do grupo (papéis do PIM III, ver [`GESTAO_AGIL.md`](../09-gerenciamento-agil/GESTAO_AGIL.md)):

```
                    Diretoria / Product Owner
                     (Anderson Raulino da Silva)
                               │
        ┌──────────────────────┼──────────────────────┐
  Tecnologia (Tech Lead)   Produto e Design        Dados
  (Fredson S. dos Santos)  (Miguel S. M. Siroma)   (Raphael C. da S. Negreiros)
        │
  ┌─────┴──────────┐
 Backend           Frontend / Mobile
 (Eduardo S.       (Matheus da S.
  Pereira)          Brito)
```

> Sugestão para o relatório: desenhar o organograma como **Figura** (draw.io ou PlantUML), não em texto. Confirmar nomes e papéis.

## 6. Principais processos ✏️

| Processo | Descrição | Apoio tecnológico no ConektaFinance |
| --- | --- | --- |
| Desenvolvimento de software | Planejar, codificar, testar e publicar novas versões | Scrum + Kanban, GitHub, CI/CD |
| Atendimento e suporte | Responder dúvidas dos usuários | Assistente de IA e FAQ |
| Operação da plataforma | Monitorar disponibilidade, contas e uso | Painel administrativo, health checks, logs |
| Gestão de dados e privacidade | Backup, auditoria e atendimento a pedidos de exclusão | Backup automático, trilha de auditoria, exclusão de conta |

**Processo do cliente (pessoa usuária)** — vale descrever também, porque é o processo que o produto transforma: *receber renda → gastar → registrar → acompanhar o limite → fechar o mês → planejar o mês seguinte*.

## 7. Problemas identificados ✏️

Do ponto de vista do público atendido (fundamentar com dados de fonte confiável, ver abaixo):

1. **Desorganização financeira:** gastos espalhados entre cartão, Pix e dinheiro, sem visão consolidada.
2. **Ferramentas difíceis:** planilhas exigem conhecimento; apps de finanças usam jargão e muitas telas.
3. **Falta de hábito:** registrar cada gasto dá trabalho, então as pessoas desistem.
4. **Descoberta tardia:** a pessoa só percebe que estourou o orçamento no fim do mês.
5. **Exclusão digital:** celulares simples, pouco espaço, pouca familiaridade com tecnologia.

Do ponto de vista da empresa (o MVP do PIM III):

1. Frontend em HTML sem componentização, difícil de evoluir.
2. Banco SQLite, sem procedures, triggers nem concorrência adequada para produção.
3. Sem versão mobile instalável, sem IA com ações reais, sem canal WhatsApp.
4. Sem pipeline de entrega contínua nem monitoramento.

> **Dados para fundamentar (o colega deve buscar e citar, com data de acesso):** Mapa da Inadimplência da Serasa; Pesquisa de Endividamento e Inadimplência do Consumidor (PEIC) da CNC; pesquisas de educação financeira do Banco Central (Relatório de Cidadania Financeira) ou da ANBIMA (Raio X do Investidor). **Não usar números sem fonte.**

## 8. Oportunidades de melhoria pela tecnologia ✅

| Problema | Oportunidade | Como o ConektaFinance resolve |
| --- | --- | --- |
| Registrar dá trabalho | Registro por conversa | Assistente de IA e WhatsApp; foto da nota fiscal |
| Estouro descoberto tarde | Alerta proativo | Alertas em 80% e 100% do teto, gerados também por trigger no banco |
| Ferramentas difíceis | Interface simples | Onboarding guiado, linguagem simples, PWA |
| Exclusão digital | Acesso sem loja | PWA leve; login só com o número do WhatsApp |
| MVP difícil de evoluir | Modernização | React componentizado, API .NET em camadas, PostgreSQL |
| Entregas manuais | Automação | CI/CD com GitHub Actions e Dokploy |

Referências sugeridas: Gil (método do estudo de caso), Dornelas (empreendedorismo) e as pesquisas acima.
