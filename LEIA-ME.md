# 📖 LEIA-ME — Instruções para Integrantes da Equipe

Bem-vindo ao projeto **PIM III — Sistema de Controle Financeiro Pessoal**! 

Este documento descreve o fluxo de trabalho obrigatório para todos os integrantes. Siga estas instruções à risca para manter a qualidade e organização do projeto.

---

## 🚀 Fluxo de Trabalho Padrão

### 1️⃣ Antes de Começar — PULL DO REPOSITÓRIO

Sempre inicie atualizando seu repositório local:

```bash
# Atualize a branch main
git checkout main
git pull origin main

# Verifique o status
git status
```

**⚠️ Importante**: Nunca trabalhe diretamente na branch `main`. Sempre crie uma branch local para suas modificações.

---

### 2️⃣ Escolher uma Task — Consulte TASKS.md

Abra o arquivo [docs/tasks/TASKS.md](docs/tasks/TASKS.md) e escolha uma task disponível:

1. **Localize a task**: Use o índice no início do arquivo
2. **Verifique o status**: Procure por `[ ]` (não iniciado) ou `⏳ Não iniciado`
3. **Leia os requisitos**: Cada task tem subtasks e critérios de aceitação claros
4. **Identifique dependências**: Verifique a seção "⚠️ DEPENDÊNCIAS CRÍTICAS"

**Exemplo**: Você quer começar TASK-007 (Modal Criar/Editar Gasto)?

```markdown
### TASK-007: Modal Criar/Editar Gasto + Tela Categorias
**Status:** ⏳ Não iniciado
**Prioridade:** P0
**Assignee:** Frontend Developer
```

---

### 3️⃣ Criar Branch Local

Crie uma branch local seguindo o padrão de nomenclatura:

**Padrão**: `tipo/TASK-XXX-descricao-curto`

```bash
# Exemplo para TASK-007 (Frontend — Modal de Gasto)
git checkout -b feat/TASK-007-modal-gasto

# Exemplo para TASK-010 (Backend — Setup .NET)
git checkout -b feat/TASK-010-backend-setup

# Exemplo para bug sem task específica
git checkout -b fix/corrige-calculo-saldo
```

**Tipos válidos**: `feat`, `fix`, `refactor`, `docs`, `design`, `test`, `backend`, `frontend`, `infra`, `chore`

---

### 4️⃣ Trabalhar na Task

Desenvolva conforme os requisitos definidos em [docs/tasks/TASKS.md](docs/tasks/TASKS.md):

- [ ] Leia todas as subtasks
- [ ] Implemente incrementalmente
- [ ] Teste localmente
- [ ] Mantenha o código limpo
- [ ] Documente conforme necessário

**Exemplo — TASK-007 subtasks**:
```markdown
- [ ] TASK-007.1: Modal criar/editar gasto
  - [ ] Form: valor, descrição, categoria, data
  - [ ] Validação visual (CSS)
  - [ ] Abrir/fechar (button click, escape key)
  - [ ] Accessibility: focus management, aria-labels

- [ ] TASK-007.2: Tela Categorias (CRUD visual)
  - [ ] Lista de categorias com cards
  - [ ] Botão "Nova categoria"
  - [ ] Modal criar/editar categoria
  - [ ] Botões delete com confirmação modal
  - [ ] Responsivo
```

---

### 5️⃣ Fazer Commits — Siga GIT_SKILL.md

**Consulte obrigatoriamente**: [.project/git_skill.md](.project/git_skill.md)

**Regras principais**:
- ✅ Idioma: **Português (pt-BR)**
- ✅ Formato: `tipo(escopo): descrição` em **minúsculas**
- ✅ Atomicidade: Um commit = uma unidade lógica
- ✅ Sem ponto final na mensagem

**Exemplos válidos**:
```bash
# Frontend
git commit -m "frontend: cria modal de novo gasto"
git commit -m "feat(frontend): integra API de gastos no dashboard"

# Backend
git commit -m "backend: implementa endpoint POST /expenses"
git commit -m "feat(backend): adiciona validação de gastos"

# Bugfix
git commit -m "fix(frontend): corrige bug de focus em modal"

# Documentação
git commit -m "docs(tasks): marca TASK-007 como concluída"

# Design
git commit -m "design: cria wireframe da tela de gastos"
```

**Para commits maiores, use o body do commit**:
```bash
git commit -m "backend: implementa endpoint POST /expenses" << 'EOF'

- Validação de campos (valor > 0, data válida)
- Salvamento no banco de dados
- Resposta JSON com transacao criada
- Testes unitários implementados
EOF
```

---

### 6️⃣ Pedir Ajuda ao Agente (GitHub Copilot)

Use o **GitHub Copilot** para:
- ✅ Revisar padrões de commit
- ✅ Gerar mensagens de commit automáticas
- ✅ Ajudar com código
- ✅ Revisar pull requests

**Exemplo de comando**:
```
@copilot: revisar meu commit seguindo git_skill.md
@copilot: criar uma mensagem de commit para essas mudanças
@copilot: implementar TASK-007 seguindo docs/tasks/TASKS.md
```

---

### 7️⃣ Atualizar TASKS.md — Marque o Checklist

Quando finalizar uma subtask ou task:

1. **Abra** [docs/tasks/TASKS.md](docs/tasks/TASKS.md)
2. **Localize** a seção correspondente
3. **Marque o checklist**: mude `[ ]` para `[x]`
4. **Atualize o status**: mude `⏳ Não iniciado` para `✅ Concluído`

**Exemplo antes**:
```markdown
### TASK-007: Modal Criar/Editar Gasto + Tela Categorias
**Status:** ⏳ Não iniciado

#### Subtasks:
- [ ] TASK-007.1: Modal criar/editar gasto
  - [ ] Form: valor, descrição, categoria, data
```

**Exemplo depois**:
```markdown
### TASK-007: Modal Criar/Editar Gasto + Tela Categorias
**Status:** ✅ Concluído

#### Subtasks:
- [x] TASK-007.1: Modal criar/editar gasto
  - [x] Form: valor, descrição, categoria, data
```

**Commit para atualizar TASKS.md**:
```bash
git add docs/tasks/TASKS.md
git commit -m "docs(tasks): marca TASK-007 como concluída"
```

---

### 8️⃣ Push para GitHub e Criar PR

Quando estiver pronto para submeter:

```bash
# Push da branch local
git push origin feat/TASK-007-modal-gasto

# GitHub automaticamente sugerirá criar um Pull Request
```

**No Pull Request, preencha**:
- **Título**: `TASK-007: Modal Criar/Editar Gasto`
- **Descrição**: 
  ```markdown
  ## O que foi feito
  - Implementei modal para criar e editar gastos
  - Adicionei validação visual com CSS
  - Implementei acessibilidade (ARIA labels, focus management)

  ## Screenshots
  [Adicione prints se for frontend]

  ## Checklist
  - [x] Código testado localmente
  - [x] Segue padrão de commits (git_skill.md)
  - [x] Atualizado TASKS.md
  - [x] Sem arquivos sensíveis
  ```

---

### 9️⃣ Revisão e Merge

1. **Aguarde revisão** dos integrantes
2. **Responda comentários** se houver feedback
3. **Após aprovação**: Faça merge (ou peça para tech lead fazer)

```bash
# Local, depois que PR foi mergeado
git checkout main
git pull origin main
git branch -d feat/TASK-007-modal-gasto
git push origin --delete feat/TASK-007-modal-gasto
```

---

## 📋 Checklist Antes de Fazer Commit

Antes de cada commit, responda:

- [ ] Código testado localmente?
- [ ] Mensagem em português, minúscula, sem ponto final?
- [ ] Seguiu padrão de commit do git_skill.md?
- [ ] Atomicidade: apenas uma "unidade lógica"?
- [ ] Sem arquivos desnecessários (.DS_Store, node_modules, .env)?
- [ ] Sem dados sensíveis (senhas, tokens)?
- [ ] TASKS.md foi atualizado?
- [ ] Código segue a estrutura do projeto?

---

## 📂 Estrutura do Projeto

Conheça a estrutura para saber onde fazer suas mudanças:

```
PIM-III/
├── backend/                    # Código C# (.NET)
├── frontend/                   # Código HTML/CSS/JS
│   ├── tela-login.html
│   ├── tela-cadastro.html
│   ├── tela-dashboard.html
│   ├── tela-gastos.html
│   └── ... (outras telas)
├── docs/                       # Documentação
│   ├── tasks/
│   │   └── TASKS.md           # ⭐ Arquivo principal de tarefas
│   ├── personas.md            # Personas do projeto
│   ├── design-system.md       # Design System
│   └── diagramas/
├── .project/
│   ├── git_skill.md           # ⭐ Padrão de commits
│   └── instructions.md        # Configurações do projeto
├── CHANGELOG.md               # Histórico de versões
└── LEIA-ME.md                 # ⭐ Este arquivo
```

---

## 🎯 Resumo do Fluxo

```
1. git pull origin main
2. Escolher task em docs/tasks/TASKS.md
3. git checkout -b feat/TASK-XXX-descricao
4. Desenvolver incrementalmente
5. Commits pequenos seguindo git_skill.md
6. Atualizar TASKS.md (marcar checklist)
7. git push origin feat/TASK-XXX-descricao
8. Abrir Pull Request
9. Aguardar revisão e merge
10. Limpar branch local
```

---

## 🆘 Precisa de Ajuda?

### Dúvidas sobre commits?
→ Consulte [.project/git_skill.md](.project/git_skill.md)

### Dúvidas sobre tarefas?
→ Consulte [docs/tasks/TASKS.md](docs/tasks/TASKS.md)

### Dúvidas sobre design?
→ Consulte [docs/design-system.md](docs/design-system.md)

### Dúvidas gerais?
→ Peça ajuda ao **GitHub Copilot** usando `@copilot:`

---

## 📝 Exemplo Prático — Passo a Passo Completo

### Cenário: Você vai implementar TASK-007 (Modal de Gasto)

```bash
# 1. Atualizar repositório
git checkout main
git pull origin main

# 2. Criar branch
git checkout -b feat/TASK-007-modal-gasto

# 3. Trabalhar (editar arquivos)
# ... implementar modal ...

# 4. Verificar mudanças
git status

# 5. Fazer commits pequenos
git add frontend/tela-gastos.html
git commit -m "frontend: cria estrutura HTML do modal de gasto"

git add frontend/tela-gastos.css
git commit -m "frontend: adiciona estilos do modal com responsividade"

git add frontend/tela-gastos.js
git commit -m "frontend: implementa lógica de abrir/fechar modal com escape key"

# 6. Atualizar TASKS.md
# ... editar arquivo ...
git add docs/tasks/TASKS.md
git commit -m "docs(tasks): marca TASK-007 como concluída"

# 7. Push
git push origin feat/TASK-007-modal-gasto

# 8. No GitHub: Criar Pull Request
# Título: TASK-007: Modal Criar/Editar Gasto
# Descrição: [descrever mudanças]

# 9. Após merge
git checkout main
git pull origin main
git branch -d feat/TASK-007-modal-gasto
```

---

## ⚠️ Regras Obrigatórias

1. **NUNCA trabalhe na branch `main`** ❌
2. **SEMPRE faça pull antes de criar branch** ✅
3. **SEMPRE siga git_skill.md para commits** ✅
4. **SEMPRE atualize TASKS.md ao finalizar** ✅
5. **NUNCA faça commit com dados sensíveis** ❌
6. **SEMPRE crie Pull Request, não faça merge direto** ✅
7. **SEMPRE escreva commits em português** ✅

---

## 📞 Responsáveis

- **Tech Lead**: (sincronização geral do projeto)
- **GitHub**: Repositório remoto em https://github.com/your-org/PIM-III
- **Agente IA**: GitHub Copilot (ajuda com código e commits)

---

**Última atualização:** 09 de maio de 2026  
**Leia este arquivo antes de fazer qualquer mudança no projeto!** 📖
