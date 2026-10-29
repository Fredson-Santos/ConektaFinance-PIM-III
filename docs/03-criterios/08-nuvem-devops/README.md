# ☁️ Etapa 8 — Infraestrutura em Nuvem e DevOps

> **Critério 08 · 0,5 pt** — Disciplina EAD: Cloud Computing e DevOps.

## O que o manual pede

Arquitetura em nuvem, serviços utilizados, containers, pipeline CI/CD, monitoramento, escalabilidade e segurança.

## Evidências no código

- Containers: [`backend/Dockerfile`](../../../backend/Dockerfile), [`frontend/Dockerfile`](../../../frontend/Dockerfile), [`frontend/nginx.conf`](../../../frontend/nginx.conf) e [`docker-compose.yml`](../../../docker-compose.yml) com healthchecks, limites de recursos e backup.
- CI (build, lint, testes e banco) e CD (GHCR + webhook do Dokploy): [`.github/workflows/`](../../../.github/workflows/).
- Logs estruturados, correlation id e health checks: [`backend/Infrastructure/Health/`](../../../backend/Infrastructure/Health/).

## Pendências

- [ ] Diagrama da arquitetura em nuvem (VPS, proxy reverso, SSL, containers e volumes)
- [ ] Redação do capítulo
