#!/bin/sh
# Roda só na primeira subida (volume vazio). Cria o usuário da aplicação, sem superusuário,
# dono do schema public — o restore é feito como ele, então todos os objetos ficam com ele.
set -eu

psql -v ON_ERROR_STOP=1 -v app_pw="$APP_DB_PASSWORD" --username postgres --dbname lumiardi <<'SQL'
CREATE ROLE lumiardi_app LOGIN PASSWORD :'app_pw' NOSUPERUSER NOCREATEDB NOCREATEROLE CONNECTION LIMIT 120;
GRANT CONNECT, TEMPORARY ON DATABASE lumiardi TO lumiardi_app;
ALTER SCHEMA public OWNER TO lumiardi_app;
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
SQL
