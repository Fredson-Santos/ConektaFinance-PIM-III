#!/usr/bin/env bash
# Gera os scripts do banco ConektaFinance (PostgreSQL 16).
#   01_schema.sql      -> gerado das migrations do EF Core (mesmo schema aplicado pela API)
#   conektafinance.sql -> script completo: schema + procedures + triggers + seed
# Uso: ./database/build.sh   (requer o .NET SDK e a ferramenta dotnet-ef)
set -euo pipefail
cd "$(dirname "$0")/.."

tmp="$(mktemp)"
trap 'rm -f "$tmp"' EXIT
dotnet build backend/PIM-III-Backend.csproj -v q -nologo >/dev/null
dotnet ef migrations script --project backend/PIM-III-Backend.csproj --no-build -o "$tmp" >/dev/null

{
  echo "-- ============================================================================"
  echo "-- ConektaFinance - Modelo fisico (DDL) - PostgreSQL 16"
  echo "-- Gerado automaticamente a partir das migrations do EF Core por database/build.sh."
  echo "-- Nao edite manualmente: altere as configuracoes em"
  echo "-- backend/Infrastructure/Persistence/Configurations e gere nova migration."
  echo "-- ============================================================================"
  echo
  sed '1s/^\xEF\xBB\xBF//' "$tmp" | tr -d '\r'
} > database/01_schema.sql

{
  echo "-- ============================================================================"
  echo "-- ConektaFinance - Script completo do banco de dados (PostgreSQL 16)"
  echo "-- Ordem: 01 schema -> 02 procedures -> 03 triggers -> 04 seed"
  echo "-- Execucao: psql -v ON_ERROR_STOP=1 -d <banco> -f database/conektafinance.sql"
  echo "-- ============================================================================"
  for part in database/0[1-9]_*.sql; do
    echo
    echo "-- >>> $(basename "$part")"
    cat "$part"
  done
} > database/conektafinance.sql

echo "Scripts gerados: database/01_schema.sql e database/conektafinance.sql"
