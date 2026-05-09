# Update Tasks Skill — PIM III

Esta skill define o padrão para sincronizar o arquivo `docs/tasks/TASKS.md` com o progresso real do projeto baseado em commits git.

---

## Regras de Operação

1. **Frequência**: Executar após commits significativos, idealmente ao final de cada sessão de trabalho.

2. **Automação**: Requer confirmação do usuário — nunca executar automaticamente sem aprovação para evitar marcações falsas.

3. **Escopo Padrão**: Analisa últimos 10 commits por padrão, configurável via flag `--last N`.

4. **Atomicidade**: Cada execução é uma operação completa — não deixa arquivos em estado intermediário.

5. **Validação**: Valida markdown antes de salvar, evita corrupção do arquivo.

---

## Mapeamento de Arquivos para Tasks

| Padrão de Arquivo | Task IDs | Contexto |
|-------------------|----------|----------|
| `frontend/tela-*.html` | TASK-010, 011, 012, 013, 014, 015 | Páginas frontend |
| `frontend/*.css` | TASK-010, 017, 018 | Estilos e responsividade |
| `frontend/*.js` | TASK-016, 017 | Lógica frontend |
| `backend/**/*.cs` | TASK-019, 020, 021, 022, 023 | Código C# .NET |
| `docs/design-system.md` | TASK-007 | Design System |
| `docs/personas.md` | TASK-005 | Personas |
| `docs/fluxos-navegacao.md` | TASK-006 | Fluxos |
| `docs/prototipos/` | TASK-008 | Protótipos |

---

## Critério de Conclusão

Uma task é marcada como **completa [x]** quando:
- ✅ Commit menciona `TASK-###` na mensagem, **E**
- ✅ Arquivos relacionados foram criados/modificados, **E**
- ✅ Código passa validação básica (sem erros de sintaxe)

Exemplo:
```bash
git commit -m "frontend: TASK-010 - implementa estrutura responsiva"
```

---

## Fluxo de Uso

### Passo 1: Fazer Commits Normais

```bash
# Trabalhar normalmente
git add frontend/tela-dashboard.html
git commit -m "frontend: TASK-010 - implementa estrutura responsiva"
```

### Passo 2: Invocar a Skill

```bash
# Via AI Assistant
/update-tasks

# Ou com flags Python
python .github/skills/update-tasks-from-git/update_tasks.py --dry-run
python .github/skills/update-tasks-from-git/update_tasks.py
python .github/skills/update-tasks-from-git/update_tasks.py --task TASK-010
```

### Passo 3: Revisar e Commitar

A skill:
- Analisa últimos 10 commits
- Extrai referências `TASK-###`
- Mapeia arquivos modificados
- Atualiza checkboxes: `[ ]` → `[x]`
- Valida markdown
- Auto-commita: `docs(tasks): sincroniza TASKS.md`

---

## Regras de Detecção

### Reconhecidos ✅
- `feat(frontend): TASK-010 - título`
- `fix(backend): TASK-020 - correção`
- `design: TASK-007 - design system`
- `docs(tasks): TASK-031 - documentação`
- Múltiplos: `TASK-010, TASK-011, TASK-012`
- Padrão exato: `TASK-###` (maiúsculas, três dígitos)

### Não Reconhecidos ❌
- Sem referência: `feat: implementa algo`
- Padrão errado: `Task-010`, `task-010`, `TASK-10`
- Sem identificador: `feat: TASK`

---

## Checklist Antes de Executar

- [ ] Commits já foram feitos? (`git log` mostra mudanças)
- [ ] Mensagens de commit incluem `TASK-###`?
- [ ] Sem conflitos de merge pendentes?
- [ ] Arquivo TASKS.md está íntegro?

---

## Integração com Git Skill

Esta skill funciona em conjunto com [git_skill.md](./git_skill.md):

- **Git Skill**: Define como escrever commits (formato, convenções)
- **Update Tasks Skill**: Processa commits para sincronizar tarefas

Use `git_skill.md` como referência ao fazer commits com TASK IDs.

---

## Exemplos de Workflow Completo

### Exemplo 1: Frontend Responsivo

```bash
# 1. Criar branch
git checkout -b feat/TASK-010-frontend-responsivo

# 2. Fazer commits pequenos
git add frontend/tela-dashboard.html
git commit -m "frontend: TASK-010 - implementa HTML/CSS responsivo"

git add frontend/tela-gastos.html
git commit -m "frontend: TASK-010 - implementa tela de gastos"

# 3. Sincronizar tasks
/update-tasks

# Resultado: TASK-010 marcada como [x]
```

### Exemplo 2: Múltiplas Tasks

```bash
# Design system e personas
git add docs/design-system.md docs/personas.md
git commit -m "design: TASK-007, TASK-005 - sistema de design e personas"

# Resultado após /update-tasks
# [x] TASK-005
# [x] TASK-007
```

### Exemplo 3: Preview sem Salvar

```bash
python .github/skills/update-tasks-from-git/update_tasks.py --dry-run

# Output (sem modificar arquivo):
# 📋 DRY RUN — Sem salvamentos
# --- Preview de Mudanças ---
# - [ ] TASK-010: ...
# + [x] TASK-010: ...
```

---

## Troubleshooting

### "TASKS.md não encontrado"
- Verificar caminho: `docs/tasks/TASKS.md`
- Executar da raiz do projeto

### "Validação markdown falhou"
- Verificar code blocks: ``` fechado?
- Verificar brackets: [ ] balanceados?
- Corrigir manualmente, tentar novamente

### "Nenhuma mudança detectada"
- Commits recentes não mencionam `TASK-###`
- Arquivos não combinam com padrões de mapeamento
- Use `--task TASK-XXX` para forçar atualização

### "Arquivo já modificado localmente"
- Fazer merge manual antes de tentar novamente
- Ou usar `--dry-run` para preview

---

## Limitações Conhecidas

- Detecta apenas tasks explicitamente mencionadas em commits
- Não rastreia progresso de subtasks individuais (apenas task pai)
- Requer mensagens de commit bem formadas com `TASK-###`

---

## Manutenção

- [ ] Atualizar `FILE_TO_TASK_MAP` quando adicionar novas deliverables
- [ ] Verificar mapeamento de arquivos a cada sprint
- [ ] Validar padrões de commit ocasionalmente

---

**Última atualização:** 08/05/2026  
**Responsável:** Tech Lead  
**Local:** `.github/skills/update-tasks-from-git/`
