# 📊 Diagramas PlantUML - Conekta (PIM-III)

Este diretório contém os diagramas UML da modelagem do sistema **Conekta** em formato PlantUML, refletindo a implementação real do projeto.

---

## 📁 Arquivos Disponíveis

### 1. `diagrama-classes.puml` ⭐ NOVO
**Tipo:** Diagrama de Classes UML

**Conteúdo:**
- 7 entidades de domínio (User, Expense, Income, Budget, Alert, Category, ChatMessage)
- 2 enums (ExpenseStatus, AlertType)
- Controllers (9 classes)
- Services / Interfaces (7 services, 3 interfaces)
- Repositórios e relacionamentos completos

**Uso:** Visualizar a estrutura orientada a objetos do backend C#, incluindo herança de interfaces e composição.

---

### 2. `mer-diagram.puml` ⭐ ATUALIZADO
**Tipo:** Modelo Entidade-Relacionamento (MER)

**Conteúdo:**
- 7 entidades completas: USUARIO, CATEGORIA, DESPESA, RECEITA, ORCAMENTO, ALERTA, MENSAGEM_CHAT
- Atributos com tipos, obrigatoriedade e valores padrão
- Cardinalidade dos relacionamentos (1,N)
- Notas explicativas de regras de negócio

**Uso:** Entender o modelo conceitual do banco de dados do sistema.

---

### 3. `der-diagram.puml` ⭐ ATUALIZADO
**Tipo:** Diagrama Entidade-Relacionamento (ER)

**Conteúdo:**
- 7 entidades com todos os atributos reais
- Chaves primárias (PK) e estrangeiras (FK)
- Relacionamentos com cardinalidade
- Notas sobre regras de negócio e enum values

**Uso:** Visualizar a estrutura do banco de dados SQLite e seus relacionamentos.

---

### 4. `modelo-relacional.puml` ⭐ ATUALIZADO
**Tipo:** Modelo Relacional (Lógico)

**Conteúdo:**
- 7 tabelas com tipos de dados precisos
- Constraints: NOT NULL, UNIQUE, DEFAULT, NULLABLE
- Chaves PK e FK explícitas
- Notas técnicas de regras de negócio por tabela

**Uso:** Guia de implementação das tabelas no banco de dados.

---

### 5. `arquitetura-sistema.puml` ⭐ ATUALIZADO
**Tipo:** Diagrama de Componentes (Arquitetura em Camadas)

**Conteúdo:**
- **Frontend:** 8 páginas HTML + Vite + Nginx
- **Backend:** 9 Controllers + 7 Services + Domain (7 entidades)
- **Infraestrutura:** AppDbContext + 6 Repositories (EF Core)
- **Banco de Dados:** SQLite (`financeiro.db`) com 7 tabelas
- **Serviços Externos:** Google Gemini API + ExchangeRate API
- Endpoints de API documentados nas conexões

**Uso:** Visualizar a arquitetura completa em camadas do sistema.

---

### 6. `fluxo-operacoes.puml` ⭐ ATUALIZADO
**Tipo:** Diagrama de Sequência

**Conteúdo:**
- Fluxo de Login (com tratamento de erro 401)
- Fluxo de Dashboard (KPIs: saldo, gastos, receitas)
- Fluxo de Registrar Despesa (com validação de orçamento e alertas automáticos)
- Fluxo de Registrar Receita
- Fluxo de Gerar Relatório
- Fluxo de Chat com IA Financeira (Gemini)

**Uso:** Entender como as operações fluem do Frontend ao Banco de Dados.

---

## 🔧 Como Visualizar os Diagramas

### Opção 1: Online (Recomendado)
1. Acesse: https://www.plantuml.com/plantuml/uml/
2. Copie o conteúdo de um arquivo `.puml`
3. Cole na caixa de texto e clique em **"Submit"**

### Opção 2: VS Code
1. Instale a extensão: **PlantUML** (jebbs.plantuml)
2. Abra um arquivo `.puml`
3. Pressione `Alt+D` para preview ao lado

### Opção 3: Linha de Comando
```bash
# Instale PlantUML
choco install plantuml   # Windows (Chocolatey)

# Gere imagem PNG
plantuml diagrama-classes.puml
plantuml -Tsvg mer-diagram.puml
```

---

## 📚 Referência das Anotações PlantUML

| Símbolo | Significado |
|---------|-------------|
| `* campo` | Atributo obrigatório (NOT NULL) |
| `<<PK>>` | Chave Primária |
| `<<FK>>` | Chave Estrangeira |
| `<<UNIQUE>>` | Valor único na tabela |
| `\|\|--o{` | Relacionamento 1 para N (obrigatório) |
| `\|o--o{` | Relacionamento 0..1 para N (opcional) |
| `..\|>` | Implementação de interface |
| `-->` | Associação / Dependência |
| `*--` | Composição |

---

## 🗂️ Entidades do Sistema

| Entidade | Tabela | Descrição |
|----------|--------|-----------|
| User | Usuarios | Usuário autenticado (JWT + BCrypt) |
| Expense | Despesas | Gastos com categoria e orçamento |
| Income | Receitas | Entradas financeiras |
| Budget | Orcamentos | Limites mensais por categoria |
| Alert | Alertas | Notificações automáticas de limite |
| Category | Categorias | Classificação de despesas |
| ChatMessage | MensagensChat | Histórico do chat com IA |

---

## 🎯 Integração com o Roadmap

Estes diagramas cobrem os seguintes requisitos do PIM-III:

- ✅ **Diagrama de Classes** → OOP C# (57D9)
- ✅ **MER / DER** → Modelagem de Dados (57D8)
- ✅ **Modelo Relacional** → Banco de Dados (57D8)
- ✅ **Arquitetura em Camadas** → Estrutura do Sistema
- ✅ **Diagrama de Sequência** → Fluxo de Operações

---

**Última atualização:** 02/06/2026
**Versão:** 2.0
**Projeto:** Conekta - PIM-III (ADS)
