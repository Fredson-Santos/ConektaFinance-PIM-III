FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copiar arquivo de projeto e restaurar dependências
COPY PIM-III-Backend.csproj ./
RUN dotnet restore PIM-III-Backend.csproj

# Copiar todo o restante e buildar o projeto
COPY . ./
RUN dotnet publish PIM-III-Backend.csproj -c Release -o /app/publish --no-restore

# Estágio final de execução
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

# Criar diretório para persistência do SQLite
RUN mkdir -p /app/data

EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

ENTRYPOINT ["dotnet", "PIM-III-Backend.dll"]
