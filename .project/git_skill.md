# Git Skill — PIM III

Esta skill define o padrão de commits para o projeto PIM III — Sistema de Controle Financeiro Pessoal.

---

## Regras de Commit

1. **Idioma**: Todos os commits devem ser escritos em **Português (pt-BR)**.

2. **Estilo**: Mensagens simples, diretas e objetivas.
   - A descrição deve começar com letra **minúscula**.
   - Não use ponto final ao final da mensagem.

3. **Padrão de Mensagem**: Seguir o formato `tipo(escopo): descrição`
   - `tipo`: classificação do commit (veja seção "Tipos Comuns")
   - `escopo`: área afetada (opcional, mas recomendado)
   - `descrição`: resumo em 1 linha (máx. 72 caracteres)

4. **Atomicidade e Granularidade**:
   - **Commits Separados**: Não agrupar mudanças massivas em um só commit.
   - **Divisão por Área**: Quando há mudanças em áreas distintas (frontend, backend, docs, design), realize **commits separados** para cada área.
   - **Unidade Lógica**: Cada commit deve representar uma alteração completa, testável e funcional.
   - **Exemplo ruim**: `feat: implementa tudo` ❌
   - **Exemplo bom**: `feat(frontend): cria modal de novo gasto` ✅

5. **Body do Commit** (opcional, mas recomendado para commits maiores):
   ```
   feat(backend): implementa endpoint POST /expenses
   
   - Validação de campos (valor > 0, data válida)
   - Salvamento no banco de dados
   - Resposta JSON com transacao criada
   - Testes unitários implementados
   ```

6. **Breaking Changes**:
   - Use `!` antes do escopo: `feat(api)!: altera estrutura de resposta`
   - Ou mencione `BREAKING CHANGE:` no body

---

## Tipos Comuns

### Funcionalidades e Bugfix
- **`feat`**: Nova funcionalidade
  - Ex: `feat(auth): implementa login com JWT`

- **`fix`**: Correção de bug
  - Ex: `fix(dashboard): corrige cálculo de saldo restante`

### Código
- **`refactor`**: Reorganização de código sem alterar comportamento
  - Ex: `refactor(frontend): extrai componente Button reutilizável`

- **`style`**: Mudanças de formatação, espaçamento, sem afetar lógica
  - Ex: `style: formata código segundo eslint`

- **`test`**: Adição ou correção de testes
  - Ex: `test(backend): adiciona testes para validação de gastos`

### Frontend Específico
- **`frontend`**: Mudanças no frontend (quando não há `feat/fix`)
  - Ex: `frontend: adiciona responsividade para telas mobile`
  - Ex: `frontend: implementa paginação na tabela de gastos`

### Backend Específico
- **`backend`**: Mudanças no backend C# (quando não há `feat/fix`)
  - Ex: `backend: cria serviço de cálculo de KPIs`
  - Ex: `backend: adiciona migrations do banco de dados`

### Documentação
- **`docs`**: Alterações em documentação, README, comentários
  - Ex: `docs: adiciona guia de instalação`
  - Ex: `docs(tasks): atualiza status das tarefas TASK-010`

### UX/UI e Design
- **`design`**: Alterações em design, protótipos, figma, assets
  - Ex: `design: cria design system com cores e tipografia`
  - Ex: `design(personas): documenta 3 personas do projeto`

### Infraestrutura
- **`infra`**: CI/CD, scripts, configuração de ambiente, deploy
  - Ex: `infra: configura variáveis de ambiente .env`
  - Ex: `infra: adiciona GitHub Actions para testes`

- **`devops`**: Database migrations, backups, monitoramento
  - Ex: `devops: cria migrations iniciais do banco de dados`

### Repositório
- **`chore`**: Tarefas de manutenção, dependências, gitignore
  - Ex: `chore: adiciona dependências ao package.json`
  - Ex: `chore: atualiza .gitignore`

---

## Exemplos Reais do Projeto PIM III

### Frontend
```
frontend: implementa modal de criar novo gasto
frontend: adiciona responsividade para mobile (375px)
feat(frontend): integra API de gastos no dashboard
fix(frontend): corrige bug de focus em modal
design: cria wireframe da tela de gastos
```

### Backend
```
backend: implementa endpoint POST /expenses
feat(backend): adiciona validação de gastos
fix(backend): corrige cálculo de KPI de saldo
test(backend): testes para CRUD de transações
devops: cria migrations iniciais (usuarios, transacoes, etc)
```

### UX/UI
```
design: documenta 3 personas do projeto
design: cria design system (cores, tipografia, componentes)
design: wireframes de baixa fidelidade
docs(design): guia de padrões de interação
```

### Documentação e Tarefas
```
docs: adiciona guia de instalação do projeto
docs(tasks): marca TASK-005 como concluída
docs(roadmap): atualiza cronograma
docs: monta documentação ABNT (Fase 9)
```

### Integração
```
feat: integra frontend com backend
test(integration): testes end-to-end (E2E)
infra: configura variáveis de ambiente
chore: atualiza dependências
```

---

## Checklist Antes de Fazer Commit

- [ ] Código testado localmente?
- [ ] Mensagem em português, minúscula, sem ponto final?
- [ ] Escopo definido corretamente?
- [ ] Atomicidade: apenas uma "unidade lógica"?
- [ ] Sem arquivos desnecessários (.DS_Store, node_modules, etc)?
- [ ] Sem dados sensíveis (senhas, tokens, .env)?
- [ ] Se tiver subtarefas, quebrar em múltiplos commits?

---

## Fluxo de Trabalho Recomendado

```bash
# 1. Criar branch para task
git checkout -b feat/TASK-010-frontend-responsivo

# 2. Trabalhar e fazer commits pequenos
git add src/components/Button.jsx
git commit -m "frontend: extrai componente Button reutilizável"

git add src/styles/responsive.css
git commit -m "frontend: adiciona media queries para 375px"

git add tests/Button.test.js
git commit -m "test: testes para componente Button"

# 3. Push para GitHub
git push origin feat/TASK-010-frontend-responsivo

# 4. Criar Pull Request
# Descrever: qual task resolve, o que foi feito, screenshots se frontend

# 5. Merge após revisão
# Delete branch local e remota
git branch -d feat/TASK-010-frontend-responsivo
git push origin --delete feat/TASK-010-frontend-responsivo
```

---

## Nomenclatura de Branches

Use o padrão: `tipo/TASK-XXX-descricao-curto`

### Exemplos:
- `feat/TASK-005-personas` — Criação de personas (TASK-005)
- `feat/TASK-010-frontend-responsivo` — Frontend responsivo (TASK-010)
- `feat/TASK-019-backend-setup` — Setup backend (TASK-019)
- `fix/corrige-calculo-saldo` — Bugfix sem task específica
- `docs/atualiza-tarefas` — Atualização de documentação

---

## Links Úteis

- [Conventional Commits](https://www.conventionalcommits.org/pt-br/)
- [Git Documentation](https://git-scm.com/doc)
- [GitHub Flow](https://guides.github.com/introduction/flow/)

---

## Exceções

Para **commits rápidos de documentação** (tipo checklist diária), é permitido:
```
docs: atualiza progresso diário
```

Mas prefira sempre o formato `tipo(escopo): descrição` para maior clareza.

---

**Última atualização:** 07/05/2026  
**Responsável:** Tech Lead
