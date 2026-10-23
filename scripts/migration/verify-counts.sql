-- Conferência pós-migração: rode no Supabase (origem) e no Postgres novo (destino) e compare as saídas com diff.
--   psql "$ORIGEM"  -X -A -t -f scripts/migration/verify-counts.sql > origem.txt
--   psql "$DESTINO" -X -A -t -f scripts/migration/verify-counts.sql > destino.txt
--   diff origem.txt destino.txt && echo "OK: bases idênticas"
\set ON_ERROR_STOP on
SET TimeZone = 'UTC';
SET DateStyle = 'ISO, YMD';
SET extra_float_digits = 3;

-- 1. Tabelas críticas: contagem exata + checksum do conteúdo (pega linha alterada, não só faltante)
SELECT 'critica', 'users', count(*), md5(coalesce(string_agg(t::text, '|' ORDER BY t::text), '')) FROM public.users t
UNION ALL SELECT 'critica', 'profiles', count(*), md5(coalesce(string_agg(t::text, '|' ORDER BY t::text), '')) FROM public.profiles t
UNION ALL SELECT 'critica', 'admin_users', count(*), md5(coalesce(string_agg(t::text, '|' ORDER BY t::text), '')) FROM public.admin_users t
UNION ALL SELECT 'critica', 'messages', count(*), md5(coalesce(string_agg(t::text, '|' ORDER BY t::text), '')) FROM public.messages t
UNION ALL SELECT 'critica', 'agency_model_contracts', count(*), md5(coalesce(string_agg(t::text, '|' ORDER BY t::text), '')) FROM public.agency_model_contracts t;

-- 2. Todas as tabelas do schema public (contagem exata, não a estimativa do pg_class)
SELECT 'tabela', table_name,
       (xpath('/row/c/text()', query_to_xml(format('SELECT count(*) AS c FROM public.%I', table_name), false, true, '')))[1]::text::bigint
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 3. Sequences: o valor atual tem de bater, senão o próximo INSERT colide com id existente
SELECT 'sequence', sequencename, coalesce(last_value, 0) FROM pg_sequences WHERE schemaname = 'public' ORDER BY sequencename;

-- 4. Estrutura: constraints e índices por tabela
SELECT 'constraints', conrelid::regclass::text, count(*) FROM pg_constraint
WHERE connamespace = 'public'::regnamespace GROUP BY 2 ORDER BY 2;
SELECT 'indices', tablename, count(*) FROM pg_indexes WHERE schemaname = 'public' GROUP BY 2 ORDER BY 2;
