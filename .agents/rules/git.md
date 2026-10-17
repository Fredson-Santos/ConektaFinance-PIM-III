---
trigger: always_on
---

# Regras de Commit Git — ConektaFinance

1. **Idioma**: Todos os commits devem ser escritos em **Português**.
2. **Estilo**: Simples, diretos, objetivos e em tempo verbal presente/infinitivo.
3. **Padrão de Mensagem**: Seguir rigorosamente o formato `tipo(escopo): descrição` ou `tipo: descrição`.
   - A descrição deve começar com letra minúscula.
   - Não use ponto final ao término da mensagem.
4. **Atomicidade e Granularidade**:
   - **Commits Separados**: Não agrupar modificações massivas em um só commit.
   - **Divisão por Área**: Sempre que houver mudanças em áreas distintas (ex: `backend`, `frontend`, `db`, `docs`, `infra`), realize **commits separados** para cada área.
   - **Unidade Lógica**: Cada commit deve representar uma alteração completa e testável.
5. **Segurança e Prevenção de Vazamentos**:
   - **Verificação Obrigatória**: Antes de qualquer commit, é estritamente obrigatório verificar se não há credenciais, senhas, tokens JWT, chaves de API ou connection strings nos arquivos.
   - **Arquivos Sensíveis**: Nunca adicione arquivos `.env`, `.env.local` ou bancos SQLite de desenvolvimento (`.db`, `.sqlite`) ao tracking do Git. Certifique-se de que estão no `.gitignore`.
   - **Histórico**: Se identificar que um segredo foi adicionado acidentalmente, não faça um novo commit por cima — remova a credencial ou avise para reescrever o histórico.

## Tipos e Escopos Principais

- `feat`: Novas funcionalidades.
- `fix`: Correções de bugs.
- `docs`: Alterações em documentação ou relatórios acadêmicos do PIM.
- `style`: Mudanças de formatação de código ou CSS que não alterem a lógica.
- `refactor`: Refatoração de código sem alteração de comportamento.
- `test`: Adição ou ajuste de testes automatizados.
- `infra`: Alterações em Docker, Docker Compose, Nginx, CI/CD.
- `db`: Alterações em migrations, triggers, procedures ou schemas SQL.

### Escopos Comuns:
- `(frontend)`: Aplicação React / Vite / PWA.
- `(backend)`: Web API ASP.NET Core (.NET 10).
- `(mobile)` / `(pwa)`: Manifest, Service Worker, visualizações mobile.
- `(pim-iv)`: Relatório acadêmico, ABNT, roadmap e entregáveis da UNIP.

## Exemplos Reais do ConektaFinance

- `feat(frontend): adiciona suporte a PWA com Service Worker e manifesto`
- `feat(frontend): implementa barra de navegação inferior mobile-first`
- `feat(backend): adiciona stored procedure para consolidação orçamentária mensal`
- `fix(frontend): corrige caminhos relativos de importação do FinanceContext`
- `docs(pim-iv): cria roadmap detalhado com critérios de avaliação da UNIP`
- `infra: atualiza dockerfile multi-stage com node 22 e nginx para o pwa`
- `db: adiciona triggers de auditoria e cálculo de limite de categoria`