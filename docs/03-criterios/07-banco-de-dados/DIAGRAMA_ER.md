# Diagrama Entidade-Relacionamento — ConektaFinance (PIM IV)

> Entregável da Etapa 3 (`03_MODELO_DADOS.md`). Diagrama em **Mermaid** (`erDiagram`) — renderiza nativamente no GitHub/GitLab.
> Convenções: PK = chave primária, FK = chave estrangeira. Todos os dados de negócio têm `UserId` (ownership por usuário).

```mermaid
erDiagram
    USERS ||--o{ CATEGORIES : "possui (1:N)"
    USERS ||--o{ BUDGETS : "define (1:N)"
    USERS ||--o{ TRANSACTIONS : "registra (1:N)"
    USERS ||--o{ ALERTS : "recebe (1:N)"
    USERS ||--o{ CHAT_MESSAGES : "conversa (1:N)"
    USERS ||--o{ OTP_CODES : "solicita (1:N)"
    USERS ||--o{ IMPORT_BATCHES : "importa (1:N)"
    USERS ||--o{ REFRESH_TOKENS : "mantem sessao (1:N, P2)"

    CATEGORIES ||--o{ TRANSACTIONS : "classifica (1:N, restrict)"
    CATEGORIES ||--o{ BUDGETS : "limita por periodo (1:N, cascade)"
    CATEGORIES |o--o{ ALERTS : "referencia (0:N, set null)"

    IMPORT_BATCHES |o--o{ TRANSACTIONS : "gera (0:N, set null)"

    USERS {
        int Id PK
        string FullName
        string DisplayName
        string Email UK
        string Phone
        string Cpf
        string Occupation
        string AvatarUrl
        string PasswordHash
        string AccountType
        decimal MonthlyCeiling
        string Currency
        int CycleStartDay
        datetime CreatedAt
        datetime UpdatedAt
    }

    CATEGORIES {
        int Id PK
        int UserId FK
        string Name
        string Description
        string ColorCode
        string Icon
        int Kind "0=Expense 1=Income"
        bool IsSystem
        int SortOrder
        datetime CreatedAt
        datetime UpdatedAt
    }

    BUDGETS {
        int Id PK
        int UserId FK
        int CategoryId FK
        decimal LimitValue
        int PeriodMonth
        int PeriodYear
        datetime CreatedAt
        datetime UpdatedAt
    }

    TRANSACTIONS {
        int Id PK
        int UserId FK
        int CategoryId FK
        int Type "0=Expense 1=Income"
        string Description
        decimal Value "positivo (18,2)"
        datetime TransactionDate
        int PaymentMethod "nullable"
        string Observation
        bool IsRecurrent
        int Status "0=Active 1=Cancelled"
        int Source "0=Manual 1=Import 2=Copilot"
        int ImportBatchId FK "nullable"
        string ExternalId "dedup, nullable"
        datetime CreatedAt
        datetime UpdatedAt
    }

    ALERTS {
        int Id PK
        int UserId FK
        int Type "0=Excedido 1=QuaseLimite 2=GastoAlto"
        string Title
        string Message
        int CategoryId FK "nullable"
        bool IsRead
        string DedupKey "unique por usuario"
        datetime CreatedAt
        datetime UpdatedAt
    }

    CHAT_MESSAGES {
        int Id PK
        int UserId FK
        int Role "0=User 1=Assistant"
        string Content
        string ActionPayload "JSON function calling, nullable"
        datetime CreatedAt
    }

    OTP_CODES {
        int Id PK
        string Phone
        string CodeHash
        datetime ExpiresAt
        datetime ConsumedAt "nullable"
        int Attempts
        int Purpose "0=Login"
        datetime CreatedAt
    }

    IMPORT_BATCHES {
        int Id PK
        int UserId FK
        string FileName
        int DetectedCount
        int ImportedCount
        int SkippedDuplicates
        bool AutoCategorize
        bool IgnoreDuplicates
        int Status "0=Pending 1=Confirmed 2=Failed"
        datetime CreatedAt
    }

    REFRESH_TOKENS {
        int Id PK
        int UserId FK
        string Token UK
        datetime ExpiresAt
        datetime RevokedAt "nullable"
    }
```

## Chaves únicas compostas

| Tabela | Colunas | Objetivo |
|---|---|---|
| Categories | (UserId, Name) | sem duplicidade de nome por usuário |
| Budgets | (UserId, CategoryId, PeriodMonth, PeriodYear) | upsert de teto por período |
| Alerts | (UserId, DedupKey) | um alerta por categoria/tipo/mês |
| Transactions | (UserId, ExternalId) | dedup de importação (quando presente) |
| Users | (Email) | login único |
