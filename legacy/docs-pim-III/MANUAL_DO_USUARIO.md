# 📘 Manual do Usuário — ConektaFinance

> **Sistema de Controle Financeiro Pessoal**  
> **Versão:** 1.0.0 — Oficial  
> **Desenvolvido para:** PIM III · Conekta (Software House)  
> **Idioma:** Português (Brasil)  

---

## 📋 Sumário
1. [Apresentação do ConektaFinance](#1-apresentação-do-conektafinance)
2. [Acesso Rápido e Primeiros Passos](#2-acesso-rápido-e-primeiros-passos)
3. [Navegação pelo Dashboard](#3-navegação-pelo-dashboard)
4. [Gestão de Categorias e Orçamentos](#4-gestão-de-categorias-e-orçamentos)
5. [Registro de Lançamentos (Gastos e Receitas)](#5-registro-de-lançamentos-gastos-e-receitas)
6. [Análise de Relatórios Financeiros](#6-análise-de-relatórios-financeiros)
7. [Central de Alertas de Orçamento](#7-central-de-alertas-de-orçamento)
8. [Interação com o Assistente IA Financeiro](#8-interação-com-o-assistente-ia-financeiro)
9. [Perguntas Frequentes (FAQ)](#9-perguntas-frequentes-faq)

---

## 1. Apresentação do ConektaFinance

O **ConektaFinance** é uma plataforma moderna e inteligente de gestão de finanças pessoais desenvolvida com o objetivo de simplificar o controle sobre a saúde financeira individual. O sistema integra inteligência artificial de forma experimental para fornecer análises proativas de gastos, avisos automatizados baseados em limites de orçamentos previamente estabelecidos pelo próprio usuário e ferramentas completas de visualização gráfica.

### 🌟 Diferenciais
* **Visualização Clara**: Painéis intuitivos com gráficos de tendência e divisões de categoria por cores dinâmicas.
* **Alertas Inteligentes**: O sistema monitora ativamente as despesas inseridas e gera notificações ao atingir limites de orçamento.
* **Assistente Virtual**: Um chat com inteligência artificial para responder a dúvidas e processar instruções financeiras em linguagem natural.
* **Responsividade**: Funciona perfeitamente em telas de desktop, tablets e celulares.

---

## 2. Acesso Rápido e Primeiros Passos

### 🔑 Credenciais para Teste (Seed Data)
Se você estiver rodando o sistema pela primeira vez no ambiente local ou via containers Docker, o banco de dados já vem populado com dados mockados e quatro contas prontas para uso:

| Nome do Usuário | E-mail de Login | Senha de Acesso | Tipo de Conta |
| :--- | :--- | :--- | :--- |
| **Usuário Teste** | `usuario@teste.com` | `senha123` | Conta com transações prontas (Abril/Maio) |
| **João Silva** | `joao@teste.com` | `senha456` | Conta limpa para novos testes |
| **Maria Santos** | `maria@teste.com` | `senha789` | Conta limpa para novos testes |
| **Ana Oliveira** | `ana.oliveira@teste.com` | `senha999` | Conta limpa para novos testes |

> [!NOTE]
> O usuário **`usuario@teste.com`** é o recomendado para a primeira navegação, pois já possui transações inseridas que preenchem automaticamente os gráficos de despesas e receitas.

### 🚪 Cadastro de Nova Conta
Caso queira criar uma conta totalmente nova:
1. Acesse a tela de login.
2. Clique na opção para criar uma conta/cadastrar-se.
3. Preencha seu **Nome**, **E-mail** e **Senha** (mínimo de 6 caracteres).
4. Após o registro bem-sucedido, o sistema efetuará o login automaticamente e gerará as categorias padrão para inicializar suas finanças.

---

## 3. Navegação pelo Dashboard

O **Dashboard** é a página inicial que você visualiza assim que faz login no ConektaFinance. Ele consolida as informações mais críticas de forma resumida para que você tome decisões rápidas.

```
┌─────────────────────────────────────────────────────────────┐
│                      CONEKTA FINANCE                        │
├─────────────────────────────────────────────────────────────┤
│ 🟢 Receitas    │ 🔴 Despesas    │ 🔵 Saldo       │ ⚠️ Alertas   │
│ R$ 5.500,00    │ R$ 3.200,00    │ R$ 2.300,00    │ 2 Ativos     │
├─────────────────────────────────────────────────────────────┤
│                 Evolução Mensal (Gráfico)                   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                     Últimas Transações                      │
└─────────────────────────────────────────────────────────────┘
```

### 📈 Indicadores Principais (Cards)
* **Total de Receitas (Mês Atual)**: Representa todas as suas entradas de dinheiro registradas no mês corrente.
* **Total de Despesas (Mês Atual)**: Representa todos os saques ou pagamentos realizados no mês corrente.
* **Saldo Atual**: Calculado automaticamente pela fórmula `Receitas - Despesas`. Fica verde se positivo e vermelho se negativo.
* **Porcentagem do Limite de Gastos**: Mostra a eficiência da utilização do seu orçamento global configurado.

### 📊 Gráficos Interativos
O painel exibe um gráfico de áreas/linhas que demonstra a evolução diária ou mensal dos seus gastos. Ao passar o ponteiro do mouse sobre os pontos do gráfico, você verá o detalhamento dos valores agregados em cada data.

---

## 4. Gestão de Categorias e Orçamentos

Antes de começar a cadastrar seus gastos, é fundamental estruturar as suas **Categorias**. Elas servem para dividir seus recursos financeiros e estipular limites saudáveis para cada tipo de despesa.

> [!TIP]
> Planejar orçamentos realistas ajuda a evitar surpresas no fim do mês.

### ➕ Adicionar Categoria
1. Clique em **Categorias** no menu lateral.
2. Clique no botão **"Nova Categoria"**.
3. Preencha:
   * **Nome da Categoria**: Exemplos: *Alimentação*, *Transporte*, *Lazer*, *Assinaturas*.
   * **Limite de Orçamento**: O valor máximo mensal que você deseja gastar nessa categoria (exemplo: R$ 500,00 para Lazer).
   * **Cor Identificadora**: Escolha uma cor na paleta para facilitar a visualização nos gráficos.
4. Clique em **Salvar**.

### ✏️ Editar ou Excluir Categorias
* Na listagem de categorias, utilize o botão de **lápis (editar)** para ajustar os limites à medida que suas prioridades mudarem.
* Use o botão de **lixeira (excluir)** para remover categorias.
  > [!WARNING]
  > Ao excluir uma categoria, transações existentes vinculadas a ela perderão o vínculo de categoria, o que pode impactar a precisão de seus relatórios de consumo por categoria.

---

## 5. Registro de Lançamentos (Gastos e Receitas)

O menu **Gastos** (ou Transações) permite registrar cada movimentação financeira de entrada ou saída realizada por você.

### ➕ Cadastrar Lançamento
1. Vá para a tela de **Gastos**.
2. Clique em **"Novo Gasto"** ou **"Nova Receita"**.
3. Preencha as informações do formulário:
   * **Descrição**: Um nome curto (ex: *Supermercado*, *Salário*, *Posto de Combustível*).
   * **Valor (R$)**: O valor monetário da transação.
   * **Data**: Data em que ocorreu o recebimento ou pagamento.
   * **Categoria**: Selecione a categoria apropriada (ex: Alimentação).
   * **Recorrente**: Marque esta opção caso seja uma conta mensal fixa (ex: *Aluguel* ou *Streaming*).
4. Clique em **Salvar**.

### 🔍 Filtros de Busca
* Você pode filtrar suas transações por **Período** (Mês/Ano) ou por **Categoria** para analisar onde o dinheiro está sendo alocado de maneira detalhada.

---

## 6. Análise de Relatórios Financeiros

Na página de **Relatórios**, o sistema fornece análises visuais consolidadas baseadas no histórico inserido.

### 📅 Filtro por Mês de Referência
* No canto superior direito, selecione o mês e o ano desejados. Todos os dados da tela serão atualizados instantaneamente.

### 📊 Painel de Desempenho por Categoria
Cada categoria cadastrada exibe uma barra de progresso horizontal indicando o consumo do orçamento mensal:
* **Barra Azul/Verde**: Consumo saudável abaixo de 80% do limite estipulado.
* **Barra Amarela (Aviso)**: Você atingiu entre **80% e 99%** do limite de orçamento da categoria.
* **Barra Vermelha (Excedido)**: Você gastou **100% ou mais** do limite da categoria.

---

## 7. Central de Alertas de Orçamento

O ConektaFinance possui um mecanismo automatizado de segurança financeira. Toda vez que você registra uma nova despesa, o sistema valida se a categoria correspondente se enquadra nas faixas críticas de orçamento:

```
📊 Orçamento de Alimentação: R$ 1.000,00
├────────────────────────────┬─────────────┐
│ Gastou R$ 800,00 (80%)      │ Gastou R$ 1.020,00 (102%)
▼                            ▼
⚠️ Alerta de Alerta (Warning)  🚨 Alerta de Limite Excedido (Danger)
```

### 🔔 Tipos de Alerta
1. **Aviso (Warning)**: Disparado ao ultrapassar **80%** do valor orçado. Ajuda a alertar que os gastos naquela área estão acelerando.
2. **Perigo/Crítico (Danger)**: Disparado ao atingir ou ultrapassar **100%** do valor orçado. Indica que você não deve realizar novos gastos supérfluos nesta categoria.

### 📥 Como Acessar e Gerenciar Alertas
* No menu lateral, acesse **Alertas**.
* A tela exibe todas as notificações ativas ordenadas por gravidade e data.
* As notificações servem como histórico para você analisar em quais categorias costuma estourar o planejamento com mais frequência.

---

## 8. Interação com o Assistente IA Financeiro

O **Assistente Financeiro IA** (disponível na página **Insights**) é um canal inteligente de comunicação direta em linguagem natural. Ele consome os dados financeiros da sua conta para dar dicas de economia.

### 💬 Como Conversar com a IA
Na barra de digitação da tela de Insights, você pode enviar perguntas como:
* *"Como está a saúde do meu orçamento este mês?"*
* *"Dê-me 3 dicas para reduzir meus gastos com Alimentação baseadas no meu histórico."*
* *"Qual foi a categoria em que gastei mais em maio?"*
* *"Sugira um plano de poupança baseado no meu saldo atual."*

### 🧹 Limpando o Histórico
Caso deseje iniciar uma conversa do zero e apagar as mensagens anteriores, basta clicar no botão **"Limpar Chat"** no canto superior direito da tela de Insights.

---

## 9. Perguntas Frequentes (FAQ)

### ❓ Como o sistema calcula o meu "Saldo Disponível"?
O Saldo Disponível é a soma de todas as suas receitas cadastradas subtraída da soma de todas as despesas cadastradas no período selecionado.

### ❓ Posso usar mais de uma moeda no ConektaFinance?
O sistema foi padronizado para operar em **Real Brasileiro (BRL / R$)**, mas você pode inserir transações em qualquer moeda adaptando o valor de acordo com a cotação do dia.

### ❓ Cadastrei uma transação errada. Como posso corrigir?
Basta acessar a tela de **Gastos**, localizar a transação na listagem de transações, clicar no botão de edição (lápis), realizar os ajustes de valor, descrição ou data no formulário e salvar.

### ❓ O que acontece se eu ultrapassar 100% de uma categoria?
O sistema registrará o gasto normalmente (o saldo total será reduzido), mas o indicador da categoria nos relatórios ficará vermelho e um alerta vermelho de "Limite Excedido" será adicionado à sua **Central de Alertas**.

### ❓ Meus dados estão seguros no ambiente local?
Sim. Todos os seus dados são salvos em um banco de dados local privado (**SQLite**) chamado `financeiro.db`. O arquivo permanece armazenado localmente em sua máquina ou no volume do container Docker, não sendo compartilhado com servidores externos, com exceção da API do assistente de inteligência artificial durante as consultas de Insights.

---

*Em caso de dúvidas técnicas adicionais ou problemas de inicialização do sistema, consulte o desenvolved.*
