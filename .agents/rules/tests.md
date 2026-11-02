---
trigger: always_on
---

# Regras de Testes Automatizados — ConektaFinance

1. **Obrigatoriedade**: Toda funcionalidade ou regra de negócio finalizada deve possuir testes automatizados cobrindo os cenários principais (componentes, rotas, serviços de aplicação e contextos).
2. **Execução Obrigatória Antes do Commit**: A tarefa só é considerada concluída quando todos os testes passarem com 100% de sucesso:
   - **Frontend:** Executar `npm test` ou `npm run build` na pasta `frontend/`.
   - **Backend:** Executar `dotnet test` na pasta `backend/`.
3. **Mocks e Serviços Externos**: APIs, integrações de IA e serviços externos devem ser **sempre mockados**. Nunca depender de chamadas de rede externas ou serviços reais em produção para a execução da suíte de testes.
4. **Isolamento e Independência**:
   - Testes de componentes frontend devem rodar isolados, simulando contextos (`FinanceContext`) e estado local.
   - Testes de backend devem utilizar banco em memória (`UseInMemoryDatabase`) ou repositórios mockados (`Moq`/`NSubstitute`) sem persistência no banco real.

## Fluxo de Trabalho Obrigatório

1. Desenvolver a feature, tela, endpoint ou correção.
2. Escrever ou atualizar os testes unitários/integrados correspondentes.
3. Executar a validação local (`npm run build` / `dotnet test`) e garantir zero erros.
4. Realizar o commit seguindo o padrão definido em `git.md`.