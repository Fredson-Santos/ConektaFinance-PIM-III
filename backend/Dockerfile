# Contexto de build: raiz do repositorio (o backend embute os scripts de database/)
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copiar arquivo de projeto e restaurar dependências
COPY backend/PIM-III-Backend.csproj backend/
RUN dotnet restore backend/PIM-III-Backend.csproj

# Copiar o código e os scripts SQL (procedures/triggers) e publicar
COPY backend/ backend/
COPY database/ database/
RUN dotnet publish backend/PIM-III-Backend.csproj -c Release -o /app/publish

# Estágio final de execução
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

# Criar diretório para uploads de avatar e imagens do assistente
RUN mkdir -p /app/wwwroot/uploads

EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

ENTRYPOINT ["dotnet", "PIM-III-Backend.dll"]
