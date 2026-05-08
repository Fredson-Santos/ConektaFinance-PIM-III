# 📊 Diagramas PlantUML - Conekta

Este diretório contém os diagramas UML da modelagem do sistema Conekta em formato PlantUML.

## 📁 Arquivos Disponíveis

### 1. `der-diagram.puml`
**Tipo:** Diagrama Entidade-Relacionamento (ER)

**Conteúdo:**
- Todas as 5 entidades do banco de dados
- Atributos de cada tabela
- Chaves primárias (PK) e estrangeiras (FK)
- Relacionamentos entre entidades com cardinalidade (1:N)

**Uso:** Visualizar a estrutura do banco de dados e seus relacionamentos.

---

### 2. `fluxo-operacoes.puml`
**Tipo:** Diagrama de Sequência

**Conteúdo:**
- Fluxo de Login
- Fluxo de Visualizar Dashboard
- Fluxo de Criar Gasto
- Fluxo de Gerar Relatório

**Detalhes:** Mostra as interações entre Frontend → Backend → Banco de Dados.

**Uso:** Entender como as operações principais funcionam e os dados fluem pelo sistema.

---

### 3. `arquitetura-sistema.puml`
**Tipo:** Diagrama de Componentes (Arquitetura em Camadas)

**Conteúdo:**
- **Camada Frontend:** HTML, CSS, JavaScript (componentes das telas)
- **Camada Backend:** Controllers (Auth, Transação, Orçamento, Relatório, Alertas)
- **Camada de Dados:** Repositories e banco de dados MySQL/PostgreSQL
- Fluxo de chamadas entre camadas

**Uso:** Visualizar a estrutura arquitetural completa do sistema.

---

### 4. `modelo-relacional.puml`
**Tipo:** Diagrama de Classes

**Conteúdo:**
- 5 classes representando as entidades
- Atributos detalhados de cada classe
- Métodos principais (negócio + persistência)
- Relacionamentos com descrições

**Uso:** Visualizar o modelo de domínio e a lógica de negócio das entidades.

---

## 🔧 Como Visualizar os Diagramas

### Opção 1: Online (Recomendado)
1. Acesse: https://www.plantuml.com/plantuml/uml/
2. Copie o conteúdo de um arquivo `.puml`
3. Cole na caixa de texto
4. Clique em "Submit"

### Opção 2: VS Code
1. Instale a extensão: "PlantUML" (jgraph.drawio-svg)
2. Clique com botão direito no arquivo `.puml`
3. Selecione "Preview"

### Opção 3: Linha de Comando
```bash
# Instale PlantUML
apt-get install plantuml  # Linux
brew install plantuml     # macOS

# Gere PNG/SVG
plantuml der-diagram.puml
plantuml -Tsvg fluxo-operacoes.puml
```

---

## 📚 Referência das Anotações PlantUML

| Símbolo | Significado |
|---------|-----------|
| `*` | Obrigatório |
| `[PK]` | Chave Primária |
| `[FK]` | Chave Estrangeira |
| `[UNIQUE]` | Valor único |
| `"1" --o "N"` | Relacionamento 1 para N |
| `"N" ..>` | Associação/Dependência |

---

## 🎯 Integração com o Roadmap

Estes diagramas complementam a **Fase 3 — Modelagem de Dados** do ROADMAP.MD:

- ✅ DER Diagram → Modelo Conceitual
- ✅ Modelo Relacional → Modelo Lógico
- ✅ Arquitetura → Estrutura do Sistema
- ✅ Fluxo Operações → Consultas Esperadas

---

## 📖 Exemplo de Uso

Para integrar os diagramas em documentação:

```markdown
![Diagrama ER](diagramas/der-diagram.puml)

## Fluxo de Login
Ver: diagramas/fluxo-operacoes.puml

## Arquitetura
Ver: diagramas/arquitetura-sistema.puml
```

---

**Última atualização:** 07/05/2026  
**Versão:** 1.0  
**Autor:** Tech Lead - Conekta
