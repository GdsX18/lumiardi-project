# Plano Definitivo de Auditoria de Pré-Produção, Sanitização Global e Hardening
**Plataforma Lumiardi — Lançamento Oficial em Produção**
**Data da Auditoria:** 29 de Setembro de 2026  
**Status do Repositório:** Pronto para execução após aprovação  
**Status do Build:** `next build` compilado com sucesso (96 rotas estáticas/dinâmicas em Turbopack)

---

## 1. Diagnóstico Geral do Sistema

A varredura estática, dinâmica e de banco de dados no repositório Lumiardi revelou alta maturidade de infraestrutura, com arquitetura Next.js 16 (App Router + Proxy), PostgreSQL oficial via Supabase (AWS sa-east-1), Cloudflare R2 Vault e gateways de pagamento (Asaas API v3 + NOWPayments).

No entanto, foram diagnosticados pontos críticos de sanitização, resíduos de desenvolvimento/mock e inconsistências de banco que precisam ser saneados antes da abertura para o público:

### 1.1. Vulnerabilidades de Segurança & Resíduos de Desenvolvimento (Crítico)
1. **Backdoor de Aprovação em Aberto (`/api/dev/simulate-approval`):**
   * **Diagnóstico:** O endpoint `src/app/api/dev/simulate-approval/route.ts` permite que qualquer requisição POST não autenticada altere o status de um usuário diretamente para `APROVADA_PAGAMENTO` ou `APROVADO`.
   * **Gravidade:** Crítica.
   * **Ação:** Bloquear imediatamente em ambiente de produção com `if (process.env.NODE_ENV === 'production') return new Response(null, { status: 404 });` ou remover a rota da árvore de rotas de produção.
2. **Botão de Simulação de Aprovação Visível na Interface (`/dashboard/pendente`):**
   * **Diagnóstico:** Em `src/app/dashboard/pendente/page.tsx` (linhas 418–447), existe um bloco visível para o usuário: *"Ambiente de Avaliação Lumiardi — Simular Aprovação para Pagamento (Dev)"*.
   * **Gravidade:** Alta. Qualquer candidata aguardando reunião pode clicar no botão e se autoaprovar para pagamento.
   * **Ação:** Remover completamente o componente visual e a chamada à rota de simulação.
3. **Rotas Dev Residuais (`/api/dev/quick-login` e `/api/dev/admin-quick-login`):**
   * **Diagnóstico:** Embora possuam verificação de `NODE_ENV === 'production'`, rotas `/api/dev/*` não devem existir no deploy final de produção.
   * **Ação:** Desativar permanentemente o diretório `src/app/api/dev` para produção.
4. **Vazamento de Dados em Log de Produção (`console.log`):**
   * **Diagnóstico:** Em `src/app/api/checkout/confirm/route.ts` (linha 151), há um `console.log('[Asaas Confirm Response]', JSON.stringify(asaasResponse, null, 2));` que registra objetos completos de transação nos logs do servidor.
   * **Ação:** Remover o `console.log`.
5. **Número Fictício de WhatsApp no Suporte (`/dashboard/pendente`):**
   * **Diagnóstico:** Linha 408 de `src/app/dashboard/pendente/page.tsx` aponta para `https://wa.me/5511999999999`.
   * **Ação:** Substituir pelo WhatsApp oficial da Diretoria/Curadoria configurável via variável de ambiente `NEXT_PUBLIC_WHATSAPP_SUPPORT` ou canal oficial validado.

---

### 1.2. Purga de Dados Mocks no Banco de Dados (Supabase) e em Memória
1. **Contas Fantasmas e Auditores no Banco de Dados Supabase:**
   * **Diagnóstico:** A tabela `admin_users` contém 3 auditores fictícios gerados em testes anteriores (`curador.junior@lumiardi.com` - Camila Duarte, `curador.senior@lumiardi.com` - Marcus Vance, `supervisor@lumiardi.com` - Helena Sampaio).
   * **Diagnóstico:** A tabela `users` contém 8 cadastros de teste de "Larissa Lumiardi Teste" (`model.test.*@lumiardi.com`), contas de agência de teste e logs antigos na tabela `curation_audit_logs`.
   * **Ação:** Executar script de purga SQL idempotente no Supabase para limpar todas as contas de teste e seus históricos, preservando estritamente os administradores reais da Lumiardi (`curadoria@lumiardi.com`).
2. **Poluição de Contadores do Painel da Curadoria (`StorageService.getAdminMetrics`):**
   * **Diagnóstico:** Em `src/services/storageService.ts` (linhas 239–242), a função `getAdminMetrics` faz:
     ```ts
     pending: Math.max(dbPending, fbPending),
     approvedModels: Math.max(Number(row.approved_models) || 0, fbApprovedModels),
     approvedAgencies: Math.max(Number(row.approved_agencies) || 0, fbApprovedAgencies),
     rejected: Math.max(Number(row.rejected) || 0, fbRejected)
     ```
     Isso força os contadores da dashboard a somar os mocks de `fallbackStore`, impedindo que os contadores reflitam a realidade exata do banco de dados!
   * **Ação:** Alterar `getAdminMetrics` para retornar estritamente os valores agregados do PostgreSQL Supabase.
3. **Valores Mocks Padrão nas Listagens (`StorageService.listApplications`):**
   * **Diagnóstico:** Linhas 348–374 de `src/services/storageService.ts` inserem valores estáticos falsos quando colunas do banco estão vazias (ex.: medidas `175cm / 55kg`, olhos castanhos, documento `doc_identidade.pdf`).
   * **Ação:** Retornar `null` ou `Não informado` para dados não preenchidos pelas candidatas reais.
4. **Seed Automático em Memória e SQL (`src/lib/db.ts`):**
   * **Diagnóstico:** `src/lib/db.ts` contém seeds em memória com modelos e agências fictícias (`user-model-1`, `user-agency-1`), além de tarefas kanban e faturas fictícias.
   * **Ação:** Desativar a injeção de candidatos e faturas fictícias no `fallbackStore`.

---

### 1.3. Jornada de Entrada, Agendamento e Liberação Pós-Pagamento
1. **Cadastro e KYC (`/qualificacao`):**
   * O fluxo valida obrigatoriedade de DDD no WhatsApp, documento e selfie biométrica com Google Gemini. O agendamento da entrevista é concluído na Etapa 3.
2. **Tela de Agendamento (`/cadastro/agendamento`):**
   * Recupera dados sem redigitação de `/api/user/me`, `sessionStorage` e URL params.
   * Persiste `curation_interviews` com status `aguardando_reuniao` via `POST /api/curation/schedule`.
   * Redirecionamento legado `/agendamento` -> `/cadastro/agendamento` está funcional.
3. **Mesa de Curadoria (`/admin`):**
   * A aba `InterviewQueueTab` possui listagem por status, link direto para WhatsApp com mensagem e link do Google Meet gerados dinamicamente.
   * Botões de decisão: "Aprovar para Pagamento" (status `APROVADA_PAGAMENTO`) e "Recusar" (com justificativa).
4. **Portão de Pagamento e Liberação do Dashboard:**
   * `src/proxy.ts` bloqueia `/dashboard` para usuárias com status diferente de `APROVADO`.
   * Usuárias em `APROVADA_PAGAMENTO` são redirecionadas para o `/checkout`.
   * **AJUSTE CRÍTICO NO CHECKOUT (`/api/checkout/confirm`):**
     * Quando o pagamento via cartão é aprovado de imediato, o status é alterado no banco para `APROVADO`, mas a resposta NÃO atualiza o cookie assinado de sessão `lumiardi_session`. Ao redirecionar para `/dashboard`, o `proxy.ts` lê o cookie antigo e pode gerar redirecionamento em loop.
     * **Ação:** Atualizar o cookie da sessão com `curationStatus: 'APROVADO'` na resposta de confirmação imediata de pagamento.
     * Atualizar a mensagem de retorno para não afirmar que "a candidatura está em análise", uma vez que o pagamento já foi precedido pela aprovação da curadoria.

---

### 1.4. Módulos Críticos: Chat, Meet, Drive e i18n
1. **Chat & Presença do Auditor:**
   * **BUG DIAGNOSTICADO:** O auditor loga como `cur-admin-1` (tabela `admin_users`), enquanto a query de presença em `listActiveConversations` busca na tabela `users` com `id = 'admin-curadoria-1'`. O heartbeat do auditor atualiza `cur-admin-1`, que não existia na tabela `users`. Como resultado, a curadoria aparece incorretamente como **OFFLINE** para as candidatas.
   * **Ação:** Sincronizar o registro do auditor administrador na tabela `users` (`id: 'cur-admin-1'`) ou fazer a query de presença checar ambas as tabelas (`users` e `admin_users`).
   * A identificação nominal do auditor (`Mesa de Curadoria — Auditor [Nome]`) já está implementada em `src/app/api/chat/messages/route.ts` (linhas 146–149).
2. **Lumiardi Meet:**
   * Sinalização WebRTC 100% persistida no Supabase via tabelas `meet_rooms`, `meet_participants` e `meet_signals` com limpeza periódica (TTL de 2 minutos). Totalmente estável para instâncias multi-nó e contêineres Docker.
3. **Lumiardi Drive & Streaming:**
   * Rota `src/app/api/media/[...key]/route.ts` utiliza streaming via `transformToWebStream()` com suporte a HTTP 206 (Range requests), evitando carregamento de arquivos pesados na memória RAM do Node.js.
4. **Internacionalização (i18n):**
   * 1.257 chaves idênticas em todos os 6 idiomas (`pt`, `en`, `es`, `fr`, `it`, `ru`).
   * As 57 chaves customizadas de checkout em `src/locales/checkout.ts` estão mapeadas no `LanguageContext`.
   * Varredura automatizada confirmou **0 chaves órfãs ou não traduzidas**.
5. **Design & Regras Anti-AI-Slop:**
   * O badge "Sessão Criptografada" não está sendo exibido em tela.
   * Não há efeitos de pulso aleatórios (`animate-ping` / `animate-pulse`) em avatares.
   * Não há erros de hidratação identificados no build de produção.

---

## 2. Plano de Ação Passo a Passo (Arquivos e Modificações)

### Fase 1: Hardening de Segurança e Higienização de Rotas Dev
| Arquivo | Ação | Descrição |
|---|---|---|
| `src/app/api/dev/simulate-approval/route.ts` | **Refatorar/Bloquear** | Adicionar verificação estrita de ambiente (`if (process.env.NODE_ENV === 'production') return new Response(null, { status: 404 });`) e exigir autenticação admin se chamado em desenvolvimento. |
| `src/app/api/dev/quick-login/route.ts` | **Hardening** | Garantir retorno 404 em produção e remover dados sensíveis. |
| `src/app/api/dev/admin-quick-login/route.ts` | **Hardening** | Garantir retorno 404 em produção e bloquear qualquer geração indevida de cookie. |
| `src/app/dashboard/pendente/page.tsx` | **Modificar** | Remover o bloco de "Ambiente de Avaliação Lumiardi / Simular Aprovação para Pagamento (Dev)" (linhas 418–447). Corrigir o link de suporte WhatsApp com variável de ambiente ou contato oficial. |
| `src/app/api/checkout/confirm/route.ts` | **Modificar** | Remover `console.log` com payload bruto do Asaas (linha 151). Atualizar o cookie assinado de sessão com `curationStatus: 'APROVADO'` na resposta de pagamento confirmado. Corrigir mensagem de sucesso. |
| `src/app/api/webhooks/asaas/route.ts` | **Modificar** | Remover `console.log` de evento duplicado (linha 54). |

### Fase 2: Purga de Mocks e Sincronização Estrita do Supabase
| Arquivo | Ação | Descrição |
|---|---|---|
| `scripts/purge-test-data.sql` (ou execução direta no Supabase) | **Executar** | Excluir definitivamente as contas de teste (`model.test.*`, `Larissa Lumiardi Teste`, `Isabella Montenegro`), auditores fictícios (`Camila Duarte`, `Marcus Vance`, `Helena Sampaio`) e logs de auditoria de simulação. |
| `src/services/storageService.ts` | **Refatorar** | Em `getAdminMetrics`, remover `Math.max(..., fbPending)` e retornar estritamente os contadores do banco. Em `listApplications`, remover valores falsos estáticos de medidas e documentos quando ausentes. |
| `src/lib/db.ts` | **Refatorar** | Remover contas de modelo e agência de teste do `fallbackStore` e do `initDatabase` SQL seed. Manter apenas a conta administrativa oficial master (`curadoria@lumiardi.com`). |

### Fase 3: Estabilidade do Chat & Presença Real do Auditor
| Arquivo | Ação | Descrição |
|---|---|---|
| `src/services/storageService.ts` | **Modificar** | Em `listActiveConversations` e `updateUserLastSeen`, unificar a checagem de presença para contemplar tanto `users` quanto `admin_users`, garantindo que o status online da Mesa de Curadoria reflita a atividade real do auditor logado. |
| `src/app/api/chat/messages/route.ts` | **Revisar** | Garantir que o `receiverId` seja sempre registrado ao responder uma candidata específica na curadoria, evitando que mensagens fiquem órfãs na listagem. |

### Fase 4: Limpeza do Repositório (Arquivos de Resíduos e Screenshots)
| Arquivo | Ação | Descrição |
|---|---|---|
| `agendamento_view.png` | **Excluir** | Arquivo de screenshot temporário da raiz do projeto. |
| `agendamento_view2.png` | **Excluir** | Arquivo de screenshot temporário da raiz do projeto. |
| `pendente.png` | **Excluir** | Arquivo de screenshot temporário da raiz do projeto. |
| `qual.png` | **Excluir** | Arquivo de screenshot temporário da raiz do projeto. |
| `qual_form.png` | **Excluir** | Arquivo de screenshot temporário da raiz do projeto. |
| `scripts/ping-supabase.ts` | **Excluir** | Arquivo vazio (0 bytes) não utilizado. |
| `scripts/temp_opener.html` | **Excluir** | Arquivo HTML temporário de inspeção local. |
| `scripts/test-visual-flow.js` | **Mover/Organizar** | Script auxiliar de teste local. |
| `tsc_output.txt` | **Excluir** | Log antigo de compilação da raiz. |
| `tsc_output_nopretty.txt` | **Excluir** | Log antigo de compilação da raiz. |

---

## 3. Checklist de Verificação e Homologação Pós-Execução

1. [ ] **Verificação de Build e Tipagem:**
   * Executar `npm run build` e confirmar que todas as 96 rotas compilam sem nenhum erro ou aviso com Turbopack.
   * Executar typecheck TypeScript (`tsc --noEmit`) com retorno código 0.
2. [ ] **Verificação de Segurança (Hardening):**
   * Realizar requisição GET e POST para `/api/dev/simulate-approval` e confirmar retorno estrito HTTP 404.
   * Realizar requisição GET para `/api/dev/quick-login` e `/api/dev/admin-quick-login` e confirmar HTTP 404.
   * Inspecionar `/dashboard/pendente` e confirmar ausência total de qualquer botão de simulação/dev.
3. [ ] **Verificação do Banco de Dados (Supabase):**
   * Consultar `SELECT count(*) FROM users WHERE email LIKE '%test%';` -> deve retornar 0.
   * Consultar `SELECT count(*) FROM admin_users;` -> deve conter apenas os membros oficiais e autorizados.
   * Acessar `/admin` e confirmar que os contadores no topo ("Cadastros Pendentes", "Modelos Aprovadas", etc.) refletem com 100% de precisão os dados reais do banco.
4. [ ] **Verificação da Jornada Completa (E2E):**
   * Cadastro em `/qualificacao` -> Upload de selfie e documento -> Agendamento em `/cadastro/agendamento`.
   * Presença da candidata na aba "Entrevistas de Curadoria" no `/admin`.
   * Clique em "Abrir WhatsApp & Enviar Meet" gerando link correto `https://wa.me/...`.
   * Clique em "Aprovar para Pagamento" -> Atualização do status para `APROVADA_PAGAMENTO`.
   * Login da usuária -> Redirecionamento automático para o `/checkout`.
   * Conclusão do pagamento no Checkout -> Promoção para `APROVADO` -> Redirecionamento imediato e liberação de todas as abas da `/dashboard`.
5. [ ] **Verificação de Módulos (Chat, Meet, Drive):**
   * Testar envio de mensagem no Chat entre Candidata e Curadoria -> Auditor identificado nominalmente (`Mesa de Curadoria — Auditor [Nome]`) e presença exibida como online.
   * Testar criação de sala no Meet (`/api/meet/room`) com sinalização persistida no Supabase.
   * Testar streaming de mídia do Cloudflare R2 com resposta HTTP 206 / Range requests.

---

> [!IMPORTANT]
> **Aguardando sua autorização:**
> Nenhum arquivo de código foi alterado nesta etapa. O `git status` do código permanece intacto. 
> Por favor, revise este plano e me confirme explicitamente para que eu proceda com a aplicação cirúrgica de cada etapa!
