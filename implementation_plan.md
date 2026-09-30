# Auditoria Arquitetural Lumiardi — Relatório + Implementation Plan

**Data:** 30/09/2026 · **Escopo:** leitura/análise estática (nenhum arquivo de código alterado) · **Stack:** Next.js 16.2 (App Router + `src/proxy.ts`), React 19, `pg` Pool → Supabase Postgres (pooler 6543), Cloudflare R2 (AWS SDK v3), Asaas v3 + NOWPayments, LiveKit/WebRTC nativo, Gemini (KYC), Nodemailer.

## Context

O pedido foi uma auditoria pré-lançamento com relatório e roteiro de correções. O `implementation_plan.md` de 29/09 já foi parcialmente executado: `/api/dev/*` removido, botão "Simular Aprovação" removido, `console.log` do Asaas removido, WhatsApp via env, `Math.max` das métricas removido, cookie re-assinado após pagamento com cartão. Porém ele **deixou passar falhas críticas de segurança**. Ele também afirma "0 chaves órfãs", quando na verdade existem **341**. Este documento substitui aquele plano. Na execução, o passo 0 grava este conteúdo em `implementation_plan.md` na raiz do repo.

---

## 1. Visão Geral da Arquitetura

- **Rotas de página**: `/`, `/login`, `/planos`, `/checkout`, `/qualificacao{,/agencia,/limites}`, `/cadastro/agendamento` (e `/agendamento` legado), `/dashboard/{pendente,book,chat,drive,kanban,meet,billing,criadora,agencia,agencias}`, `/admin{,/login,/chat,/solicitacao/[id]}`, `/meet`, e as páginas legais: `termos` = `termos-de-uso`, `privacidade` = `politica-privacidade`, `portal` = `denuncia`, `compliance-2257`, `contato`.
- **API (~70 rotas)**: `admin/*`, `auth/*`, `billing/*`, `chat/*`, `checkout/*`, `curation/*`, `drive/*`, `kyc/*`, `media/[...key]`, `meet/*`, `webhooks/{asaas,kyc,nowpayments}`, entre outras.
- **Proxy** (`src/proxy.ts`): controla `/checkout`, `/dashboard` e `/admin` pelo cookie HMAC `lumiardi_session` e aplica headers. **Não protege `/api/*`**: cada rota se autentica sozinha.
- **Sessão** (`src/lib/auth.ts`): `base64url(JSON).HMAC-SHA256(JWT_SECRET)`, verificada com `timingSafeEqual`. A assinatura é correta, mas o payload **não tem `exp`/`iat`/versão**. Role e `curationStatus` são confiados ao cookie.
- **Camada de dados** (`src/lib/db.ts` + `src/services/storageService.ts`, ~3.100 linhas):
  - Conecta como `postgres.<ref>`, que ignora o RLS (`BYPASSRLS`).
  - Mantém um `fallbackStore` em memória com 23 Maps, usado sempre que uma query falha **ou retorna 0 linhas**.
  - `initDatabase()` roda DDL e seeds em runtime.
- **RLS**: `lumiardi_schema.sql` não tem `ENABLE ROW LEVEL SECURITY` nem `CREATE POLICY`. O backend não é afetado, mas a anon key existe (`NEXT_PUBLIC_SUPABASE_ANON_KEY`). Se a Data API estiver ativa, `users.password_hash` pode estar exposto via `/rest/v1`.
- **i18n**: `LanguageContext.t(key, fallback)` usa dicionários planos em `src/locales/*.ts` mais `checkout.ts`. A cadeia é: idioma atual → `pt` → `en` → `fallback` → chave "humanizada" (nunca mostra a chave crua).

---

## 2. Matriz de Vulnerabilidades e Riscos

### 🔴 CRÍTICA (bloqueiam o lançamento)

| # | Achado | Arquivos |
|---|---|---|
| C1 | **Path traversal lê `.env.production`**: a chave `assets/../.env.production` passa no check, e o candidato 2 remove `assets/` e sai de `public/`. Confirmado: o standalone contém `.env` e `.env.production`. A rota não pede autenticação. | `src/app/api/media/[...key]/route.ts:11-30` |
| C2 | **Backdoor de admin**: `curadoria@lumiardi.com` / `lumiardi2026` fica no `fallbackStore` e é aceito mesmo se a senha no DB for trocada. `initDatabase` re-semeia a conta a cada cold start. A mesma senha é o padrão para membros de equipe e cadastros. | `src/lib/db.ts:52-110,622-636`, `src/services/storageService.ts:139-181,637,3136`, `src/app/api/admin/team/route.ts:51`, `lumiardi_schema.sql:337-346`, `scripts/*` |
| C3 | **Rate limit do admin login nunca dispara**: `if (!checkRateLimit(ip))` testa um objeto, que é sempre truthy. | `src/app/api/admin/login/route.ts:11`, `src/lib/security/rateLimiter.ts` |
| C4 | **Webhook KYC sem autenticação**: o secret não está definido, então qualquer POST `{userId, approved:true}` aprova qualquer conta. | `src/app/api/webhooks/kyc/route.ts:7-9`, `src/lib/kyc/kycService.ts:106-119` |
| C5 | **Checkout sem sessão obrigatória**: `userId` e `userEmail` vêm do body. Um UPSERT `ON CONFLICT DO UPDATE SET email` sobrescreve o e-mail de qualquer conta (takeover). Não há check de `APROVADA_PAGAMENTO`, então uma candidata `EM_CURATORIA` se auto-aprova. `PENDING` / `AWAITING_RISK_ANALYSIS` contam como pago. `rawBody.paymentConfirmed` consome cupom. | `src/app/api/checkout/{card,confirm,pix,create-session}/route.ts` |
| C6 | **Rotas de status sem autenticação**: `curation/schedule` (`body.userId` → `AGUARDANDO_REUNIAO`), `curation/verify`, e `kyc/verify-document-and-face` (`body.userId` → `APROVADO`). | `src/app/api/curation/{schedule,verify}/route.ts`, `src/app/api/kyc/verify-document-and-face/route.ts` |
| C7 | **Vault R2 público**: `/api/media` não pede sessão e responde `Cache-Control: public, immutable` + `ACAO: *`. `/api/drive/signed-url` gera GET/PUT pré-assinado para **qualquer** `fileKey` (KYC, contratos). | `src/app/api/media/[...key]/route.ts:99-191`, `src/app/api/drive/signed-url/route.ts` |
| C8 | **NOWPayments**: aceita variantes "typo" do secret (vazam prefixo/sufixo no código), tem fallback hardcoded `lumiardi_nowpayments_ipn_secret_2026` e compara com `===`. | `src/lib/payments/nowpaymentsAdapter.ts:28,181-206` |
| C9 | **Segredos entram na imagem Docker**: `.dockerignore` só exclui `.env*.local`, e `COPY . .` leva `.env`/`.env.production`. O `docker-compose.yml` tem fallback de `JWT_SECRET` e de `POSTGRES_PASSWORD`. O `JWT_SECRET` é fraco e está repetido nos 3 `.env`. | `.dockerignore`, `Dockerfile:17`, `docker-compose.yml:39-41` |

### 🟠 ALTA

| # | Achado | Arquivos |
|---|---|---|
| A1 | Chat: qualquer usuário logado lê e posta em qualquer `conversationId` (IDs previsíveis). `receiverId` é arbitrário. Mensagem da curadoria sem `receiverId` vai para todas as candidatas. | `src/app/api/chat/messages/route.ts:19-29,129-189`, `storageService.ts:1471-1509` |
| A2 | Upload anônimo, com o arquivo inteiro em RAM (`arrayBuffer`), sem limite de tamanho e com MIME livre. Somado a C7, permite XSS armazenado (HTML/SVG servido na mesma origem). | `src/app/api/upload/route.ts:17-39,78`, `src/app/api/chat/upload` |
| A3 | PII pública: `/api/creators` expõe e-mail, nome legal e endereço; `/api/agencies` expõe e-mail e CNPJ. | `storageService.ts:1120-1134,1209-1224` |
| A4 | `billing/invoices/[id]/download` sem autenticação, com XSS refletido (`id` sem escape em HTML) e recibo "pago" fictício. `billing/invoices` e `payouts` não retornam 401. | `src/app/api/billing/invoices/**` |
| A5 | Sessão sem expiração nem revogação. `secure` falta em `auth/login`, `auth/register`, `curation/*`, `profile/update`, `*/register`. Login grava `APROVADA_PAGAMENTO` como `EM_CURATORIA`. | `src/lib/auth.ts`, `src/app/api/auth/login/route.ts:56,69-76` |
| A6 | Meet: `room`/`signal`/`token` sem sessão, `participantId` do cliente, token LiveKit de 6 h para qualquer sala, passcode nunca verificado, sala Daily pública. Candidata `AGUARDANDO_REUNIAO` é redirecionada para fora de `/dashboard/meet` pelo proxy. `customRoomName` ≠ `roomName` (toda sala sai aleatória). | `src/app/api/meet/*`, `src/proxy.ts:45-50`, `src/components/admin/InterviewQueueTab.tsx:132` |
| A7 | Status admin: valor desconhecido vira `REJEITADO` + **reembolso automático**. Sem regras de transição. `updateApplicationStatus` engole o erro e retorna `true`, então o audit log registra algo que não aconteceu. `curation/approve` não tem audit nem bloqueio de júnior. | `src/app/api/admin/applications/[id]/status/route.ts:35-130`, `storageService.ts:566-584`, `src/app/api/curation/approve/route.ts` |
| A8 | Webhook Asaas: idempotência check-then-act (duplica assinatura, cupom e notificação). Reembolso/OVERDUE não revogam `APROVADO`. `OR gateway='asaas'` afeta todas as assinaturas do usuário. Token comparado com `===`. | `src/app/api/webhooks/asaas/route.ts:46-325`, `src/lib/payments/asaasClient.ts:284-297` |
| A9 | `next.config.ts` `removeConsole: true` remove também `console.error`: **zero logs de erro em produção**. | `next.config.ts:8` |
| A10 | `send-interview-invite` sempre dá 404 (`u.artistic_name` não existe; recebe `user.id` em vez de `interview.id`; a tabela `audit_logs` não existe). | `src/app/api/admin/send-interview-invite/route.ts:329,368`, `src/app/admin/page.tsx:159` |
| A11 | Fallback silencioso em memória: `listApplications`, `getInterviews` e `listLogs` usam o `fallbackStore` quando o resultado vem vazio. As notas de curadoria só existem em memória. `asaasClient.getOrCreateCustomer` devolve um `cus_${Date.now()}` falso. `r2Service` gera URL "assinada" falsa. | `storageService.ts:292,590-608,2491-2538`, `auditService.ts`, `asaasClient.ts:164-173`, `r2Service.ts:209-213` |

### 🟡 MÉDIA

- **2FA não funcional**: o secret fica em memória e é confiado ao cliente; nenhum login verifica 2FA. `src/app/api/auth/2fa/*`
- **Drive**:
  - `drive/confirm` e `drive/upload-url` / `shared` não verificam o par agência↔modelo.
  - A quota é autodeclarada (aceita `"-50 GB"`).
  - Deletar não apaga no R2 e sempre retorna `true`.
  - Arquivos: `storageService.ts:2194,2212-2227,2786,2807`, `src/app/api/drive/*`
- **Cupons**: `discount_value` > 100 ou negativo não é validado; a corrida em `times_used` permite estourar `max_uses`; no caminho USD, o desconto é calculado em USD e aplicado em BRL. `src/services/couponService.ts:94-111`, `checkout/confirm:126-139`
- **Presença**:
  - O admin nunca envia heartbeat.
  - `email LIKE '%curadoria%'` e o fallback `admin_users.updated_at` são usados como sinal de presença.
  - Os limites divergem (5 vs 3 min).
  - `last_seen_at DEFAULT NOW()`.
  - `is_read` nunca é resetado.
  - Polling de 1 s.
  - O `displayNameCache` sobrescreve "Auditor X".
  - Arquivos: `storageService.ts:774-790,1789-1801,1899`, `ChatPanel.tsx:404,420`, `AdminChatTab.tsx:252`
- **Meet**:
  - Consumo de sinal não atômico (SELECT seguido de UPDATE).
  - Salas órfãs nunca limpas.
  - Sem `restartIce` nem reoferta.
  - TURN público openrelay hardcoded.
  - Arquivos: `src/services/meetService.ts:324-467`, `VideoCallWidget.tsx:72-86,531,597`
- **CSP fraco** (`'unsafe-eval' 'unsafe-inline' https:`, `connect-src https: wss:`) e `frame-ancestors 'self'` conflitando com `XFO DENY`. `next.config.ts:59-103`
- **SSL `rejectUnauthorized:false`** no Postgres e no SMTP. `db.ts:14`, `email.ts:30`
- **Rotas vazam `err.message` em `details`**: `admin/login`, `auth/login`, `user/me`, `webhooks/asaas`.
- **Entrada**:
  - Só 2 rotas usam zod.
  - `sanitizeObject` altera senhas.
  - Turnstile nunca é chamado.
  - `validate-coupon` não tem rate limit.
- **Range local**: sufixo `bytes=-N` vira NaN; `end ≥ size` retorna 416 em vez de truncar. O caminho R2 está correto (206 + stream).

### 🟢 BAIXA

- **Parcelamento**: `toFixed(2)` pode cobrar centavos a menos, e `installments` não tem limite. `asaasClient.ts:212-215`
- **Métrica `pending`** inclui `APROVADA_PAGAMENTO`, e o status `'RECUSADO'` nunca é gravado.
- **Resíduos no repo**: `src/services/storageService_copy.txt` (versionado, contém a senha), `edit_files.py`, `tsc_output*.txt` (647 erros obsoletos de 10/09), `tsconfig.tsbuildinfo`, `cursorrules`, `scratch/`.
- **`updateKanbanTask`** usa `fieldMap[k] || k` como nome de coluna. Hoje é inofensivo, mas é um ponto de SQL injection latente.

---

## 3. Relatório de i18n

**Dicionários (em bom estado):** `pt/en/es/fr/it/ru` têm 1.255 chaves cada, sem nenhuma faltando, extra, vazia ou com placeholder divergente. `checkout.ts` tem 58 chaves × 6 idiomas. Nenhum `t('...')` usado no código aponta para chave inexistente.

**Pendências:**

1. **Cerca de 2.088 strings hardcoded em 76 arquivos**:

   | Área | Arquivos (nº de strings) |
   |---|---|
   | Admin (sem `useLanguage`) | `admin/page.tsx` (181), `admin/solicitacao/[id]` (39), `CurationTeamTab` (66), `AuditLogsTab` (60), `InterviewQueueTab` (33), `CurationDossierExport` (31), `AdminChatTab` (26), `MediaLightboxModal`, `admin/login` |
   | Legais (sem `useLanguage`) | `politica-privacidade` (133), `termos-de-uso` (126), `portal`/`denuncia` (104), `compliance-2257` (17; razão social divergente: "LUMIARDI TECHNOLOGIES S.A." vs "GESTÃO DE CONTEÚDO LTDA.") |
   | Públicas | `planos/page.tsx` (160, tabela local de copy), `checkout/page.tsx` (53), `qualificacao/page.tsx` (56: idiomas e gêneros), `qualificacao/agencia` (24), `cadastro/agendamento` (33), `ShowcaseSection` (26), `LocationSelector` (25), `error.tsx` / `not-found.tsx` / `global-error.tsx` |
   | Modais | `TermsAcceptanceModal` (18, todo em inglês fixo), `EditProfileModal` (82), `EditAgencyModal` (32), `UpgradePlanModal` (16), `KYCVerificationModal` (12), `VIPWelcomeCelebrationModal`, `CancelSubscriptionModal`, `TwoFactorModal` |
   | Dashboard | `TalentScoutView` (117, perfis mock), `SharedDrivePanel` (72), `VideoCallWidget` (69), `CreatorProfileView` (62), `pendente` (56), `billing` (51), `AgencyDirectoryView` (35), `ChatPanel` (29), `dashboard/page.tsx` (22), `agencia`/`criadora` (19 cada), `KanbanBoard` (17), `DashboardHeader` ("No new notifications"), `CurationScheduler` |

2. **Erros de API exibidos crus**: há 215 literais `error:` em PT/EN nas rotas, e ~28 pontos da UI mostram `data.error` direto (`login:52`, `checkout:395/433/470`, `contato:70`, `billing:92/113`, `UpgradePlanModal:107`, entre outros).
3. **251 fallbacks mortos** `t('k') || 'texto'`: `t()` nunca retorna vazio. Os maiores são `DashboardShowcaseSection` (105) e `KanbanBoard` (46).
4. **Idioma do documento e SSR**:
   - O estado inicial é `'en'` (`LanguageContext.tsx:55`), então o servidor renderiza em inglês.
   - `<html lang="pt-BR">` é fixo (`layout.tsx:127`, `global-error.tsx:14`) e nunca é atualizado.
   - Os `alternates` `?lang=` não são lidos e faltam `it`/`ru`/`x-default`; o `JsonLd` também não inclui `it`/`ru`.
   - Metadata só em PT (root + 11 layouts), com `og:locale` fixo em `pt_BR`.
5. **Formatação**: 35 usos de `'pt-BR'` fixo (clientes: `billing`, `ChatPanel`, `DashboardHeader`, `VideoCallWidget`, `CancelSubscriptionModal`, `portal`, `storageService` 1818/1949/1995) e ~14 `R$` literais.
6. **E-mails** (`src/lib/email.ts`): nenhum é localizado e o banco não guarda o idioma do usuário. `sendInterviewInvite` está todo em inglês; os demais estão em PT.
7. **Qualidade das traduções**:
   - Valores provavelmente não traduzidos: it `qual_fullname_label`, `plan_icon_badge`, `pillar_4_sub`; es `loc_state_brazil`, `qual_summary_tbd`; fr `dash_nav_chat`, `qual_culture_tag`, `loc_city_placeholder_br`.
   - Chaves duplicadas por caixa: `BOOK_SUBTAB_*` vs `book_subtab_*`.
   - A ordem de fallback do checkout (en→pt) diverge da principal (pt→en).
   - `contato/page.tsx:66` envia o label já traduzido como `type` para a API.
8. **Chaves órfãs**: 341 no total (330 sem nenhuma ocorrência). Os prefixos com mais órfãs são `qual_` (38), `pending_` (34), `drive_` (32), `plan_` (27), `cs_` (25), incluindo `pending_demo_btn` e `dash_simulated_work`.

---

## 4. Implementation Plan (sequencial)

> Antes de codar: ler o guia relevante em `node_modules/next/dist/docs/` (regra do `AGENTS.md`): proxy, route handlers, `cookies()`, `bodySizeLimit`.
> **Passo 0:** gravar este documento em `implementation_plan.md` na raiz, substituindo o de 29/09.

### Fase 0 — Ações operacionais imediatas (fora do código, pelo responsável)

1. **Rotacionar todos os segredos**, assumindo que foram expostos por C1/C9: `JWT_SECRET` (≥ 64 bytes aleatórios), senha do DB Supabase, chave Asaas, token do webhook Asaas, API key e IPN secret da NOWPayments, chaves R2, secret LiveKit, chave Gemini, senha SMTP. Isso invalida todas as sessões, o que é desejado.
2. **Supabase**: desativar a Data API (REST/GraphQL) do schema `public`, ou aplicar `ENABLE ROW LEVEL SECURITY` em todas as tabelas sem policy para `anon`/`authenticated`. O backend continua funcionando porque o role `postgres` ignora o RLS.
3. **Senhas**: trocar a senha de `curadoria@lumiardi.com` e `curadoria-exec@` e de todos os membros criados com `lumiardi2026`.
4. **KYC**: definir `KYC_WEBHOOK_SECRET`, ou desativar a rota se não houver provedor externo.

### Fase 1 — Bloqueadores críticos (C1–C9)

| Arquivo | Mudança |
|---|---|
| `src/app/api/media/[...key]/route.ts` | Resolver cada candidato com `path.resolve` e exigir `startsWith(publicDir + path.sep)` **por candidato**; rejeitar `..` e `%2e`. Servir localmente só a allowlist `assets/`, `images/`. Para chaves R2 `vault/<ownerId>/…`, `chat/…` e `kyc/…`, exigir sessão e ownership (ou admin). Trocar para `Cache-Control: private` e remover `ACAO: *` em conteúdo privado. Limitar as tentativas de fallback no R2. |
| `.dockerignore` | Adicionar `.env`, `.env.*`, `scratch`, `*.txt`, `edit_files.py`. |
| `docker-compose.yml` | Remover os defaults de `JWT_SECRET` e `POSTGRES_PASSWORD` (usar `${VAR:?required}`). |
| `src/lib/db.ts` | Remover do `fallbackStore` as contas admin e toda a seed. Em produção, `initDatabase()` não deve semear usuário nem senha. Sem DB, retornar erro 503, nunca dados em memória. |
| `src/services/storageService.ts` `authenticateAdmin` / `authenticate` | Remover os passos 3 e 4 (fallback em memória). Remover as senhas padrão `lumiardi2026` (linhas 637 e 3136) e exigir senha forte no cadastro e na criação de membro. Reescrever `findCreatorByEmail` / `findAgencyByEmail` como `SELECT` por e-mail. |
| `src/app/api/admin/team/route.ts` | Sem senha padrão: gerar uma senha aleatória e enviá-la por e-mail, ou exigi-la no body. Validar `role` contra um enum. |
| `src/app/api/admin/login/route.ts` (+ `auth/login`) | `if (!checkRateLimit(key).allowed)`, com a chave `ip + email`. Usar o IP do último hop confiável. Em produção, o limiter deveria ser persistente (tabela em Postgres) ou, no mínimo, chaveado por e-mail. |
| `src/app/api/webhooks/kyc/route.ts` | Rejeitar quando o secret não estiver configurado (fail-closed) e comparar com `timingSafeEqual`. |
| `src/app/api/checkout/{card,confirm,pix,create-session}/route.ts` | **Exigir sessão** (401) e **ignorar** `userId`/`userEmail`/`userName` do body. Exigir `curationStatus === 'APROVADA_PAGAMENTO'` lido do **DB**. Remover o UPSERT que sobrescreve o e-mail (usar `INSERT … ON CONFLICT DO NOTHING` ou nem inserir). Só promover a `APROVADO` com status `CONFIRMED`/`RECEIVED`; `PENDING` responde "em processamento" e a promoção fica para o webhook. Remover `rawBody.paymentConfirmed`. |
| `src/app/api/curation/{schedule,verify}`, `src/app/api/kyc/verify-document-and-face` | Exigir sessão e usar sempre `session.id`. O KYC não deve promover a `APROVADO`: a decisão é da curadoria. |
| `src/app/api/drive/signed-url/route.ts` | Validar ownership do `fileKey` (prefixo `vault/${session.id}/` ou par contratual) ou remover a rota se o cliente não precisar dela. |
| `src/lib/payments/nowpaymentsAdapter.ts` | Remover as variantes de secret e o fallback hardcoded; usar `timingSafeEqual`; fail-closed sem secret em qualquer ambiente. |
| `src/lib/payments/asaasClient.ts:284-297` | Token do webhook: `timingSafeEqual` e fail-closed. |

### Fase 2 — Alta severidade (A1–A11)

1. **Chat** (`chat/messages/route.ts`, `storageService.listMessages`): verificar que `session.id` participa do `conversationId`, derivando-o com `getDirectConversationId(session.id, partnerId)` no servidor. No canal `curation`, candidata só lê e escreve na própria thread e o admin precisa informar `receiverId`. Remover a cláusula `receiver_id IS NULL` de broadcast.
2. **Upload** (`api/upload`, `api/chat/upload`): exigir sessão, allowlist de MIME (imagem, vídeo, pdf; sem `text/html` e sem `image/svg+xml`), limite de tamanho verificado antes de ler, e preferir upload pré-assinado (PUT direto no R2 com `ContentLength` e `ContentType` assinados) para evitar o buffer em RAM. Servir mídia com `Content-Disposition` e `Content-Type` confiável.
3. **PII**: `/api/creators` e `/api/agencies` passam a exigir sessão e retornar DTO público, sem e-mail, endereço, CNPJ ou nome legal.
4. **Faturas** (`billing/invoices/[id]/download`): exigir sessão e ownership, escapar HTML, 404 para ID desconhecido. `billing/invoices` e `payouts` retornam 401 sem sessão.
5. **Sessão** (`src/lib/auth.ts`):
   - Adicionar `iat`, `exp` (7 dias) e `sv` (session version) ao payload e rejeitar sessões expiradas em `decodeSession`.
   - Criar um helper único `setSessionCookie(res, user)` com `httpOnly`, `secure` em produção, `sameSite:'lax'`, `path:'/'` e `maxAge`, e usá-lo em **todas** as rotas que gravam o cookie (hoje há 10 cópias).
   - Nas rotas admin, revalidar `admin_users.status` no DB a cada request.
   - Corrigir o `auth/login:56` para gravar o `curation_status` real do DB.
6. **Meet**:
   - `room`, `token` e `signal` exigem sessão; `participantId = session.id`.
   - O token LiveKit só é emitido para participantes autorizados da sala (entrevista vinculada à candidata ou admin), com TTL de ~2 h.
   - Validar o passcode.
   - No servidor, aceitar `customRoomName` (ou alinhar o cliente para enviar `roomName`).
   - Em `proxy.ts`, liberar `/dashboard/meet` para `AGUARDANDO_REUNIAO`.
   - Daily com `privacy: 'private'`.
7. **Status admin** (`admin/applications/[id]/status`):
   - Aceitar só uma allowlist; valor desconhecido retorna 400.
   - Aplicar uma matriz de transições (`EM_CURATORIA→AGUARDANDO_REUNIAO→APROVADA_PAGAMENTO→APROVADO`, `*→REJEITADO`).
   - Rodar o UPDATE de status e o audit log em uma transação (`pool.connect()` + `BEGIN`/`COMMIT`).
   - `updateApplicationStatus` deve propagar o erro.
   - `curation/approve` passa a usar a mesma função, com audit e bloqueio de júnior.
8. **Webhook Asaas**:
   - Tornar a idempotência atômica: `INSERT … ON CONFLICT DO NOTHING RETURNING` **antes** dos efeitos; se não retornar linha, responder 200 e sair.
   - REFUNDED, CHARGEBACK e subscription DELETED devem revogar o acesso (status de volta para `APROVADA_PAGAMENTO` ou um status `SUSPENSO`).
   - Remover o `OR gateway='asaas'`.
9. **Logging**: em `next.config.ts`, usar `removeConsole: { exclude: ['error', 'warn'] }`.
10. **send-interview-invite**: trocar `u.artistic_name` pela coluna real de `profiles`, passar `interviewId` correto a partir de `admin/page.tsx`, e usar `AuditLogService.logAction` no lugar da tabela inexistente `audit_logs`.
11. **Fallbacks silenciosos**:
    - `listApplications`, `getInterviews` e `listLogs` retornam `[]` quando o DB vem vazio e propagam o erro quando o DB falha.
    - Persistir as notas em uma tabela `application_notes`, adicionada em `db.ts` / `lumiardi_schema.sql`.
    - `getOrCreateCustomer` deve lançar erro em vez de devolver ID falso.
    - Remover a URL "assinada" falsa do `r2Service`.

### Fase 3 — Média / estabilidade

- **Cupons** (`couponService.ts`):
  - Validar `0 < percent ≤ 100` e `fixed > 0`.
  - Aplicar um preço mínimo em todos os métodos.
  - Reservar o uso com `UPDATE coupons SET times_used = times_used + 1 WHERE code = $1 AND (max_uses = 0 OR times_used < max_uses) RETURNING`.
  - Corrigir a conversão de moeda no `confirm`.
  - Adicionar rate limit em `validate-coupon`.
- **Presença**:
  - Criar o hook `useHeartbeat` (extraído de `ChatPanel.tsx:420`) e usá-lo também em `AdminChatTab` e no layout do admin.
  - Criar uma constante `ONLINE_THRESHOLD_MS` compartilhada.
  - A presença da curadoria passa a ser "existe algum `admin_users.last_seen_at` < threshold": adicionar a coluna e remover `LIKE '%curadoria%'`, os IDs hardcoded e o fallback de `updated_at`.
  - `last_seen_at` sem default.
  - Marcar como lido (`is_read`) ao abrir a conversa.
  - Aumentar o polling para 3–5 s com backoff.
  - Não guardar em cache o nome "Auditor X" no POST.
- **Meet**:
  - Consumir sinais com `UPDATE … SET consumed = true WHERE … RETURNING`.
  - Evitar polls sobrepostos (usar `setTimeout` recursivo).
  - Adicionar TTL/cleanup de salas por `last_seen`.
  - Adicionar `restartIce` / reoferta em `iceconnectionstatechange = failed`.
  - Emitir credenciais TURN próprias e temporárias pelo servidor.
- **Drive**:
  - Verificar o par agência↔modelo (contrato) em `confirm`, `upload-url` e `shared`.
  - Calcular o tamanho pelo `HeadObject` do R2.
  - Deletar os objetos no R2 (`R2StorageService.deleteObject`, já existente).
  - Retornar o `rowCount` real.
- **Range local**: tratar sufixo e clamp; converter o erro `InvalidRange` do R2 em 416.
- **2FA**: persistir o secret no DB e verificá-lo no login, ou esconder a funcionalidade até que esteja implementada.
- **Segurança geral**:
  - Validação zod nas rotas de escrita (auth, checkout, admin/status, drive, chat).
  - Não aplicar `sanitizeObject` a senhas.
  - Não retornar `err.message` ao cliente.
  - Ativar o Turnstile no login, cadastro e contato.
- **CSP**: remover `'unsafe-eval'` e o `https:` genérico, e usar uma allowlist (LiveKit, Asaas, R2, Google). Alinhar `frame-ancestors 'none'` com XFO.
- **SSL**: usar o CA do Supabase (`ssl: { ca }`) em vez de `rejectUnauthorized: false`.

### Fase 4 — i18n

1. **Idioma do documento**:
   - Persistir o idioma em cookie `lumiardi_lang`, lê-lo em `layout.tsx` (`cookies()`) para definir `<html lang>` e o estado inicial do `LanguageProvider` (acaba o flash em inglês e o mismatch de SSR).
   - Atualizar `document.documentElement.lang` ao trocar de idioma.
   - Nos `alternates`, incluir `it`, `ru` e `x-default`, ou remover até existir rota por idioma. Alinhar o `JsonLd`.
2. **Legais e `TermsAcceptanceModal`**: criar dicionários dedicados por página (ex.: `src/locales/legal/{pt,en,…}.ts`) para não inchar o dicionário principal. Unificar a razão social.
3. **Admin**: decidir se o admin fica só em PT. Se sim, documentar isso e ignorá-lo; se não, migrar via `t()`.
4. **Públicas e dashboard**, na ordem do ranking da seção 3: `planos`, `checkout`, `qualificacao`, `cadastro/agendamento`, `pendente`, `billing`, `SharedDrivePanel`, `VideoCallWidget`, modais, `LocationSelector` (via `Intl.DisplayNames`) e páginas de erro.
5. **Erros de API**: as rotas retornam `{ code: 'CHECKOUT_CARD_DECLINED' }` e a UI traduz com `t(\`err_${code}\`)`, mantendo `error` como fallback.
6. **Formatação**: criar os helpers `formatDate` e `formatDateTime` no `LanguageContext` (mesmo padrão do `formatPrice` existente) e substituir os 35 `'pt-BR'` e os `R$` literais do lado cliente. Remover o mapa de locale duplicado de `planos/page.tsx:214-222`.
7. **E-mails**: adicionar a coluna `users.preferred_language`, gravada no cadastro e no `LanguageSelector`. Os templates de `email.ts` passam a receber `lang` e usar dicionários de e-mail.
8. **Limpeza**:
   - Remover os 251 `|| 'fallback'` mortos.
   - Remover as 341 chaves órfãs; o script de verificação da seção 5 reconfirma antes de cada remoção.
   - Remover `BOOK_SUBTAB_*` em maiúsculas.
   - Corrigir os valores não traduzidos em it, es e fr.
   - Alinhar a ordem de fallback do checkout (pt→en).
   - Em `contato/page.tsx:66`, enviar a chave e não o label.

### Fase 5 — Higienização do repositório

- Remover `src/services/storageService_copy.txt`, `edit_files.py`, `tsc_output*.txt`, `cursorrules` e `tsconfig.tsbuildinfo` (adicioná-lo ao `.gitignore`).
- Em `scripts/create-admin.js`, `test-suite.js` e `reset-chat-production.js`, remover as senhas padrão e exigir env.
- Remover `lumiardi_schema.sql:337-346` (seed do hash).
- Retirar do dicionário as chaves `pending_demo_btn` e `dash_simulated_work`, e retirar os perfis mock de `TalentScoutView` e `ShowcaseSection`, se não forem conteúdo de marketing.
- **Purga de dados de teste no DB**: script SQL idempotente em `scripts/purge-test-data.sql`, executado manualmente após revisão.

---

## 5. Verificação

**Estática** (após cada fase):
```bash
npx tsc --noEmit --incremental false
npm run lint
npm run build
```

**Segurança** (com `npm run build && npm start` local):
- `curl -i "localhost:3000/api/media/assets/..%2F.env.production"` → espera 404 (hoje retornaria o arquivo).
- `curl -i -X POST localhost:3000/api/webhooks/kyc -d '{"userId":"x","approved":true}'` → 401.
- `curl -X POST localhost:3000/api/checkout/card` sem cookie → 401; com a sessão de uma candidata `EM_CURATORIA` → 403.
- `POST /api/admin/login` com senha errada 11× → 429. `curadoria@lumiardi.com` / `lumiardi2026` → 401.
- `GET /api/chat/messages?conversationId=conv_A_B` com a sessão de C → 403.
- `POST /api/drive/signed-url` com a chave de outro usuário → 403.
- `GET /api/creators` sem sessão → 401 ou DTO sem e-mail.
- `POST /api/upload` sem sessão → 401; com `text/html` → 415.

**Fluxo E2E**: cadastro → KYC → agendamento → admin "Aprovar para pagamento" → login redireciona para `/checkout` → pagamento em cartão sandbox (`CONFIRMED`) → `/dashboard` sem loop. Pix: webhook sandbox → `/pendente` detecta a mudança e redireciona. Reembolso sandbox → acesso revogado. Reenviar o mesmo webhook 2× em paralelo → apenas uma assinatura criada.

**Módulos**:
- Chat entre candidata e admin, com o admin aparecendo online (heartbeat ativo).
- Meet: candidata em `AGUARDANDO_REUNIAO` entra pela URL do convite e a sala é a mesma do admin.
- Mídia: `curl -H "Range: bytes=0-1023"` → 206 + `Content-Range`; `bytes=-500` → 206.

**i18n**: rodar o script de paridade de chaves (`node` com `typescript.transpileModule` carregando `src/locales/*.ts` e comparando os conjuntos) e o scan de `t('...')` inexistentes. Trocar para cada um dos 6 idiomas e verificar `<html lang>`, planos, checkout, termos e modais.
