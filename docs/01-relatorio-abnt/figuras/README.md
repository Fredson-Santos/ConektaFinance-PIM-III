# Figuras do relatório

Capturas e diagramas usados no relatório ABNT. O prefixo numérico indica o capítulo.

## Capturas de tela

- **Web:** geradas pelo script [`backend/tests/e2e-tests/scripts/capturas-relatorio.mjs`](../../../backend/tests/e2e-tests/scripts/capturas-relatorio.mjs), com a conta de demonstração, em 1440 × 900 (escala 1,5).
- **PWA:** capturadas no app instalado em um celular real, com moldura de iPhone (`06-PWA-*.png`).

Para regerar, siga as instruções no topo do script. Use um banco recém-criado, para que o seed da conta demo cubra o mês atual.

| Arquivo | Conteúdo | Capítulo |
| --- | --- | --- |
| `05-web-login.png` | Login exclusivo por WhatsApp (OTP) | 5 |
| `05-web-dashboard.png` | Dashboard com saldo, entradas, saídas, gráfico semanal e orçamentos | 5 |
| `05-web-dashboard-tema-claro.png` | Dashboard no tema claro (acessibilidade e contraste) | 4 e 5 |
| `05-web-gastos.png` | Lista de lançamentos com filtros | 5 |
| `05-web-categorias.png` | Categorias e limites mensais | 5 |
| `05-web-relatorios.png` | Relatórios (página inteira) | 5 |
| `05-web-configuracoes.png` | Perfil, segurança e privacidade | 5 |
| `05-web-admin.png` | Painel administrativo: métricas e gestão de contas | 5 |
| `05-web-novo-lancamento.png` | Modal de novo lançamento | 5 |
| `05-web-command-palette.png` | Paleta de comandos (Ctrl+K) | 5 |
| `05-web-assistente-ia.png` | Assistente de IA respondendo um resumo do mês | 5 |
| `05-swagger.png` | Documentação da API no Swagger | 5 |
| `06-PWA-Login.png` | Login no PWA | 6 |
| `06-PWA-Dashboard.png` | Dashboard com barra de navegação inferior | 6 |
| `06-PWA-Gastos.png` | Lançamentos | 6 |
| `06-PWA-Categorias.png` | Categorias e limites | 6 |
| `06-PWA-Relatorios.png` | Relatórios | 6 |
| `06-PWA-NovoLancamento.png` | Lançamento rápido | 6 |
| `06-PWA-AssistenteIA.png` | Assistente de IA | 6 |
| `06-PWA-Configuracoes.png` | Configurações e perfil | 6 |
| `06-PWA-Admin.png` | Painel administrativo no celular | 6 |

## Diagramas

Fontes em PlantUML na pasta [`diagramas/`](diagramas/), com o PNG ao lado. Para regerar:

```bash
docker run --rm -v "$PWD/docs/01-relatorio-abnt/figuras/diagramas:/data" -w /data plantuml/plantuml:1.2025.4 -tpng -charset UTF-8 *.puml
```

| Arquivo | Conteúdo | Capítulo |
| --- | --- | --- |
| `diagramas/05-diagrama-camadas.png` | Camadas do backend (Apresentação, Application, Domain, Infrastructure) e dependências | 5 (Etapa 6) |
| `diagramas/05-diagrama-classes.png` | Entidades do domínio, enums, polimorfismo (`ICopilotAiClient`, `IOtpSender`) e herança (`BaseApiController`). Largo: usar em página paisagem | 5 (Etapa 6) |
| `diagramas/06-ciclo-service-worker.png` | Ciclo de vida do service worker: registro, instalação, ativação, cache e atualização | 6 |
| `diagramas/08-arquitetura-nuvem.png` | VPS, Traefik/HTTPS, Dokploy, contêineres, volumes e pipeline CI/CD | 8 |

Os diagramas do banco (MER, lógico e físico) ficam em [`database/diagramas/`](../../../database/diagramas/).

## Ainda faltam

- [ ] **Quadro Kanban** (capítulo 9). Criar a visão *Board* no [GitHub Project](https://github.com/users/Fredson-Santos/projects/1) e capturar o estado atual e o final, depois de fechar a issue #16. Nomes: `09-kanban-andamento.png` e `09-kanban-final.png` (passo a passo em [`GESTAO_AGIL.md`](../../03-criterios/09-gerenciamento-agil/GESTAO_AGIL.md), seção 9).
- [ ] **Organograma** da Conekta Tech Solutions (capítulo 2): `02-organograma.png`.
- [ ] **Business Model Canvas** (capítulo 3): `03-business-model-canvas.png`.
- [ ] *Opcional:* banner de instalação do PWA e ícone na tela inicial do celular (capítulo 6): `06-PWA-Instalacao.png` e `06-PWA-TelaInicial.png`.
