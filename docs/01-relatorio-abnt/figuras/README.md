# Figuras do relatório

Capturas e diagramas usados no relatório ABNT. O prefixo numérico indica o capítulo.

## Capturas de tela

Geradas pelo script [`backend/tests/e2e-tests/scripts/capturas-relatorio.mjs`](../../../backend/tests/e2e-tests/scripts/capturas-relatorio.mjs), com a conta de demonstração.

- Desktop: 1440 × 900 (escala 1,5).
- Mobile: viewport de iPhone 13.

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
| `06-mobile-login.png` | Login no celular | 6 |
| `06-mobile-banner-instalacao.png` | Instrução de instalação do PWA no iPhone | 6 |
| `06-mobile-dashboard.png` | Dashboard mobile com barra de navegação inferior | 6 |
| `06-mobile-gastos.png` | Lançamentos no celular | 6 |
| `06-mobile-categorias.png` | Categorias no celular | 6 |
| `06-mobile-relatorios.png` | Relatórios no celular | 6 |
| `06-mobile-novo-lancamento.png` | Bottom sheet de lançamento rápido | 6 |
| `06-mobile-assistente-ia.png` | Assistente de IA no celular | 6 |

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

- [ ] **Quadro Kanban** (capítulo 9). Criar a visão *Board* no [GitHub Project](https://github.com/users/Fredson-Santos/projects/1) e capturar o estado atual e o final, depois de fechar a issue #16.
- [ ] **PWA instalado em um celular real** (capítulo 6): a tela "Adicionar à tela de início" e o app aberto em modo standalone. Isso exige o app publicado com HTTPS, então não dá para simular no navegador automatizado.
