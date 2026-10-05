import { AsaasApiError } from './asaasClient';

/** Código e mensagem originais devolvidos pelo Asaas (errors[0].code / errors[0].description). */
export interface AsaasGatewayError {
  gatewayCode?: string;
  gatewayMessage?: string;
}

/** Extrai o erro real do Asaas, sem traduzir nem reinterpretar. */
export function asaasGatewayError(err: unknown): AsaasGatewayError {
  if (!(err instanceof AsaasApiError)) return {};
  const details = err.details as { errors?: { code?: unknown; description?: unknown }[] } | undefined;
  const first = Array.isArray(details?.errors) ? details.errors[0] : undefined;
  const gatewayMessage = typeof first?.description === 'string' && first.description.trim() ? first.description.trim() : undefined;
  return { gatewayCode: err.code || undefined, gatewayMessage };
}

/**
 * Código estável (`api_err_<code>` na UI) para um erro do Asaas.
 * - 401/403: chave/conta do gateway → `payment_unavailable`
 * - documento recusado ao criar o cliente → `invalid_document`
 * - qualquer outra rejeição da API (validação, antifraude, emissor) → `gateway_rejected`,
 *   sempre acompanhado do código e da mensagem originais do Asaas (nunca presumir recusa da emissora)
 * - falha de rede / resposta inesperada → `payment_unavailable`
 */
export function asaasErrorCode(err: unknown): string {
  if (!(err instanceof AsaasApiError)) return 'payment_unavailable';
  if (err.status === 401 || err.status === 403) return 'payment_unavailable';
  const raw = err.message.toLowerCase();
  if (err.stage === 'customer' && (raw.includes('cpf') || raw.includes('cnpj') || raw.includes('document'))) return 'invalid_document';
  if (err.status >= 400 && err.status < 500) return 'gateway_rejected';
  return 'payment_unavailable';
}

/** Expor mensagem/stack na resposta: só fora de produção ou com CHECKOUT_DEBUG=true (diagnóstico temporário). */
export function isCheckoutDebugEnabled(): boolean {
  return process.env.NODE_ENV !== 'production' || process.env.CHECKOUT_DEBUG === 'true';
}

/**
 * Detalhes do erro (mensagem, stack, causa, resposta do Asaas) para o corpo da resposta em depuração.
 * Em produção sem CHECKOUT_DEBUG devolve {} — stack e detalhes internos nunca vão à usuária.
 */
export function checkoutDebugFields(err: unknown): { debug?: Record<string, unknown> } {
  if (!isCheckoutDebugEnabled()) return {};
  if (!(err instanceof Error)) return { debug: { message: String(err) } };
  const cause = (err as { cause?: unknown }).cause;
  return {
    debug: {
      name: err.name,
      message: err.message,
      stack: err.stack,
      ...(cause !== undefined ? { cause: cause instanceof Error ? cause.message : cause } : {}),
      ...(err instanceof AsaasApiError ? { httpStatus: err.status, asaasCode: err.code, asaasResponse: err.details } : {}),
    },
  };
}
