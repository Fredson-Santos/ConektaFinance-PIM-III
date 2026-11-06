# Contexto de build: raiz do repositorio (o backend embute os scripts de database/)
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copiar arquivo de projeto e restaurar dependências
COPY backend/ConektaFinance.Api.csproj backend/
RUN dotnet restore backend/ConektaFinance.Api.csproj

# Copiar o código e os scripts SQL (procedures/triggers) e publicar
COPY backend/ backend/
COPY database/ database/
RUN dotnet publish backend/ConektaFinance.Api.csproj -c Release -o /app/publish

# Estágio final de execução
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

# Criar diretório para uploads de avatar e imagens do assistente
RUN mkdir -p /app/wwwroot/uploads

EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

ENTRYPOINT ["dotnet", "ConektaFinance.Api.dll"]
