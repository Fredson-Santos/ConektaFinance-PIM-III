# Guia de entrega — relatório ABNT do PIM IV

Ponto de partida para quem vai escrever o relatório. Para cada capítulo, o guia lista o que o manual pede, onde está o material pronto, quais figuras usar e o que ainda depende do grupo.

**Leia antes:** [`README.md`](README.md) (estrutura e formatação ABNT) e o manual em [`../00-manual-pim-iv/manual_pim_iv_ads.md`](../00-manual-pim-iv/manual_pim_iv_ads.md) (§ 1.5, § 2.4 e § 2.5).

**Legenda:** ✅ pronto para usar · ✏️ rascunho, o grupo precisa validar · ❌ falta

---

## Visão geral

| Cap. | Título | Pts | Páginas sugeridas | Material | Situação |
| :-: | --- | :-: | :-: | --- | :-: |
| — | Capa, folha de rosto, resumo, abstract, sumário | 1,0* | — | [`DADOS_PRE_TEXTUAIS.md`](DADOS_PRE_TEXTUAIS.md) | ✏️ |
| 1 | Introdução | 1,0* | 2 (fora do limite) | Este guia, seção 1 | ✏️ |
| 2 | Caracterização da organização | 1,0 | 2 a 3 | [`CARACTERIZACAO.md`](../03-criterios/01-caracterizacao-organizacao/CARACTERIZACAO.md) | ✏️ |
| 3 | Planejamento da solução tecnológica | 1,0 | 3 | [`MODELO_DE_NEGOCIO.md`](../03-criterios/02-planejamento-solucao/MODELO_DE_NEGOCIO.md) | ✏️ |
| 4 | Responsabilidade social e diversidade | 0,5 | 2 | [`03-responsabilidade-social/README.md`](../03-criterios/03-responsabilidade-social/README.md) | ✅ |
| 5 | Solução Web e arquitetura de software | 2,0 | 6 a 7 | [`04-solucao-web/`](../03-criterios/04-solucao-web/) e [`POO_SOLID.md`](../03-criterios/06-arquitetura-software/POO_SOLID.md) | ✅ |
| 6 | Solução Mobile (PWA) | 2,0 | 4 | [`05-solucao-mobile/README.md`](../03-criterios/05-solucao-mobile/README.md) e [`COMPARATIVO_PLATAFORMAS.md`](../03-criterios/05-solucao-mobile/COMPARATIVO_PLATAFORMAS.md) | ✅ |
| 7 | Banco de dados | 1,0 | 4 | [`PROCEDURES_TRIGGERS.md`](../03-criterios/07-banco-de-dados/PROCEDURES_TRIGGERS.md) | ✅ |
| 8 | Nuvem e DevOps | 0,5 | 3 | [`08-nuvem-devops/README.md`](../03-criterios/08-nuvem-devops/README.md) | ✅ |
| 9 | Gerenciamento ágil | 1,0 | 3 | [`GESTAO_AGIL.md`](../03-criterios/09-gerenciamento-agil/GESTAO_AGIL.md) | ✅ / ❌ prints do Kanban |
| 10 | Conclusão | — | 1 a 2 (fora do limite) | Retomar os objetivos do cap. 1 | — |
| — | Referências | 1,0* | — | [`REFERENCIAS.md`](REFERENCIAS.md) | ✅ |
| — | Apêndices (opcional) | — | — | Script SQL completo; Manual do Usuário | Opcional |

\* O critério 01 (1,0 pt) avalia a formatação ABNT e as referências do trabalho inteiro.

**Limite:** os capítulos 2 a 9 (desenvolvimento) devem ter **entre 20 e 30 páginas**. A soma sugerida acima dá cerca de 27 páginas. Figuras ocupam espaço: use no máximo 1 ou 2 por página e reduza as telas quando possível.

---

## 1. Introdução

O manual pede: **objetivo da pesquisa, metodologia e breve apresentação da empresa**.

- **Objetivo:** usar o objetivo geral e os específicos de [`MODELO_DE_NEGOCIO.md`](../03-criterios/02-planejamento-solucao/MODELO_DE_NEGOCIO.md), seção 2.
- **Metodologia:** pesquisa aplicada, com estudo de caso de uma empresa simulada (Conekta Tech Solutions), revisão bibliográfica e desenvolvimento de software com Scrum. Fundamentar com Gil e Marconi e Lakatos ([`REFERENCIAS.md`](REFERENCIAS.md)).
- **Empresa:** um parágrafo com base em [`CARACTERIZACAO.md`](../03-criterios/01-caracterizacao-organizacao/CARACTERIZACAO.md), seção 1. Dizer que é a continuação do PIM III.
- **Estrutura do trabalho:** um parágrafo final dizendo o que cada capítulo traz.

## 2. Caracterização da organização ✏️

Material: [`CARACTERIZACAO.md`](../03-criterios/01-caracterizacao-organizacao/CARACTERIZACAO.md). Cobre segmento, missão, visão e valores, produtos, organograma, processos, problemas e oportunidades.
**Depende do grupo:** validar missão, visão, valores e organograma; buscar dados de endividamento e educação financeira com fonte.
**Figura sugerida:** organograma (a desenhar).

## 3. Planejamento da solução tecnológica ✏️

Material: [`MODELO_DE_NEGOCIO.md`](../03-criterios/02-planejamento-solucao/MODELO_DE_NEGOCIO.md). Cobre problema, objetivos, público-alvo, proposta de valor, benefícios, diferenciais, Canvas e viabilidade.
**Depende do grupo:** decidir o modelo de receita; pesquisar os concorrentes e os preços de VPS e da API de IA.
**Figura sugerida:** Business Model Canvas (a desenhar).

## 4. Responsabilidade social e diversidade ✅

Material: [`03-responsabilidade-social/README.md`](../03-criterios/03-responsabilidade-social/README.md).
Pontos a desenvolver: acessibilidade (WCAG 2.1 AA testada automaticamente com axe, `aria-*`, tema claro e escuro, `prefers-reduced-motion`, alvos de toque de 44 px); ética e não discriminação na IA (`backend/Application/Services/CopilotEthics.cs`); inclusão digital (PWA leve, login pelo WhatsApp, linguagem simples); educação financeira como cidadania; LGPD (exportação e exclusão de conta, auditoria).
Fundamentar com Almeida, Silva, Noble e a legislação ([`REFERENCIAS.md`](REFERENCIAS.md)).
**Figura:** `figuras/05-web-dashboard-tema-claro.png` (comparar com o tema escuro).

## 5. Solução Web e arquitetura de software ✅

O manual pede: arquitetura, APIs REST, autenticação, segurança, estrutura administrativa e integração entre módulos (Etapa 4); POO, camadas e modularização (Etapa 6).

| Assunto | Material |
| --- | --- |
| Arquitetura e camadas | [`POO_SOLID.md`](../03-criterios/06-arquitetura-software/POO_SOLID.md), seção 1 |
| POO, SOLID e padrões | [`POO_SOLID.md`](../03-criterios/06-arquitetura-software/POO_SOLID.md), seções 2 a 7 |
| API REST (rotas, versionamento, erros) | [`04_CONTRATO_API.md`](../03-criterios/04-solucao-web/04_CONTRATO_API.md) |
| Autenticação e segurança | [`04-solucao-web/README.md`](../03-criterios/04-solucao-web/README.md): OTP pelo WhatsApp, JWT, BCrypt, FluentValidation, ProblemDetails, rate limiting, cabeçalhos HTTP |
| Estrutura administrativa | `AdminController` com `[Authorize(Roles)]` e tela `/admin` |
| Integração entre módulos | [`07_AGENTE_IA.md`](../03-criterios/04-solucao-web/07_AGENTE_IA.md) e [`08_WHATSAPP.md`](../03-criterios/04-solucao-web/08_WHATSAPP.md) |

**Figuras prontas:** `diagramas/05-diagrama-camadas.png`, `diagramas/05-diagrama-classes.png` (larga, usar página paisagem), `05-swagger.png`, `05-web-login.png`, `05-web-dashboard.png`, `05-web-gastos.png`, `05-web-categorias.png`, `05-web-relatorios.png`, `05-web-admin.png`, `05-web-assistente-ia.png`. Não use todas: escolha 6 a 8.

## 6. Solução Mobile (PWA) ✅

O manual pede: telas principais, fluxo de navegação, autenticação, **sincronização de dados** e integração com APIs.

| Assunto | Material |
| --- | --- |
| Por que PWA (nativo × híbrido × PWA) | [`COMPARATIVO_PLATAFORMAS.md`](../03-criterios/05-solucao-mobile/COMPARATIVO_PLATAFORMAS.md) |
| Manifest e service worker | Idem, mais `diagramas/06-ciclo-service-worker.png` |
| Sincronização de dados (com os limites) | [`05-solucao-mobile/README.md`](../03-criterios/05-solucao-mobile/README.md) |
| Telas e navegação | `figuras/06-PWA-*.png` |

**Falta (opcional, recomendado):** print do banner de instalação e do ícone na tela inicial do celular.

## 7. Banco de dados ✅

O manual pede: modelo lógico, modelo físico, MER, procedures, triggers e script completo.
Material: [`PROCEDURES_TRIGGERS.md`](../03-criterios/07-banco-de-dados/PROCEDURES_TRIGGERS.md) (trechos já selecionados e explicados) e [`03_MODELO_DADOS.md`](../03-criterios/07-banco-de-dados/03_MODELO_DADOS.md) (dicionário de dados).
**Figuras:** `database/diagramas/mer.png`, `modelo-logico.png`, `modelo-fisico.png`.
**Script completo:** `database/conektafinance.sql`, como apêndice ou com o link do repositório.

## 8. Nuvem e DevOps ✅

O manual pede: arquitetura em nuvem, serviços, contêineres, CI/CD, monitoramento, escalabilidade e segurança.
Material: [`08-nuvem-devops/README.md`](../03-criterios/08-nuvem-devops/README.md), `docker-compose.yml` (healthchecks, limites de CPU e memória, backup), `.github/workflows/ci.yml` e `cd.yml`.
**Figura:** `diagramas/08-arquitetura-nuvem.png`.

## 9. Gerenciamento ágil ✅ / ❌

O manual pede: Product Backlog, Sprint Backlog, cronograma das sprints, quadro Kanban e definição das entregas. Tudo está em [`GESTAO_AGIL.md`](../03-criterios/09-gerenciamento-agil/GESTAO_AGIL.md), exceto:
- ❌ **Prints do quadro Kanban** (passo a passo na seção 9 do documento).
- ✏️ Confirmar os papéis e como as cerimônias aconteceram.

## 10. Conclusão

Retomar os objetivos da Introdução e dizer como cada um foi atingido; apontar as limitações (sem fila offline, sem push em tempo real, histórico de conversa separado por canal) e os trabalhos futuros (push, fila offline, metas de economia, Open Finance).

---

## Pendências do grupo (em ordem)

| # | O que | Quem |
| :-: | --- | --- |
| 1 | Confirmar integrantes, RAs, orientador, semestre, campus e prazo de postagem ([`DADOS_PRE_TEXTUAIS.md`](DADOS_PRE_TEXTUAIS.md)) | Grupo |
| 2 | Validar caracterização (missão, visão, valores, organograma) | Grupo |
| 3 | Decidir modelo de receita; pesquisar concorrentes e preços | Grupo |
| 4 | Confirmar papéis Scrum e cerimônias | Grupo |
| 5 | Criar a visão *Board* no GitHub Project e capturar o Kanban (antes e depois de fechar a issue #16) | Fredson |
| 6 | Opcional: prints de instalação do PWA no celular | Quem tiver o app instalado |
| 7 | Conferir edições das referências no exemplar consultado | Redator |

## Checklist final

- [ ] Todos os elementos obrigatórios presentes (capa, resumo, abstract, sumário, introdução, desenvolvimento, conclusão, referências)
- [ ] Desenvolvimento (capítulos 2 a 9) entre 20 e 30 páginas
- [ ] Toda figura com número, título acima e "Fonte: elaborado pelos autores (2026)" abaixo
- [ ] Toda referência citada no texto e toda citação presente nas referências
- [ ] Nenhum dado numérico sem fonte
- [ ] Texto escrito com palavras próprias (o antiplágio da UNIP compara também com a internet; os documentos deste repositório são públicos, então **não copie trechos inteiros deles**, reescreva)
- [ ] Revisão ortográfica
- [ ] PDF final conferido (quebras de página, numeração a partir da Introdução no canto superior direito)
- [ ] Postagem no sistema da UNIP dentro do prazo e cópia impressa ao coordenador
