import { AsaasApiError } from './asaasClient';

/** Traduz erros técnicos da API Asaas em mensagens amigáveis para o usuário final (sem vazar detalhes internos). */
export function normalizeAsaasError(raw: string): string {
  const r = raw.toLowerCase();
  if (r.includes('invalid number') || r.includes('card_number_invalid') || r.includes('número do cartão'))
    return 'O número do cartão informado é inválido. Verifique os dados e tente novamente.';
  if (r.includes('invalid expiry') || r.includes('expirymonth') || r.includes('expiryyear') || r.includes('validade'))
    return 'A data de validade do cartão está incorreta. Verifique e tente novamente.';
  if (r.includes('invalid cvv') || r.includes('ccv') || r.includes('código de segurança'))
    return 'O código de segurança (CVV) do cartão é inválido.';
  if (r.includes('insufficient') || r.includes('saldo insuficiente'))
    return 'Transação recusada por saldo insuficiente. Tente outro cartão ou pague via Pix.';
  if (r.includes('not authorized') || r.includes('não autorizado') || r.includes('declined'))
    return 'Transação não autorizada pela emissora do cartão. Verifique os dados ou tente outro cartão.';
  if (r.includes('stolen') || r.includes('lost') || r.includes('furtado') || r.includes('perdido'))
    return 'Transação recusada pela emissora do cartão. Entre em contato com seu banco.';
  if (r.includes('cpf') || r.includes('cnpj') || r.includes('document'))
    return 'O CPF/CNPJ informado não é válido. Verifique os dados do titular do cartão.';
  if (r.includes('cep') || r.includes('postalcode') || r.includes('addressnumber') || r.includes('endereço'))
    return 'O CEP ou o número do endereço do titular do cartão é inválido. Verifique e tente novamente.';
  if (r.includes('phone') || r.includes('contato') || r.includes('telefone'))
    return 'O número de telefone do titular é obrigatório. Tente novamente.';
  if (r.includes('timeout') || r.includes('network') || r.includes('econnreset'))
    return 'Erro de conexão com a operadora. Aguarde alguns instantes e tente novamente.';
  if (r.includes('http 401') || r.includes('unauthorized') || r.includes('api key'))
    return 'Erro interno de configuração do gateway. Por favor, contate o suporte.';
  return 'Transação não autorizada pela emissora do cartão. Verifique os dados ou tente outro cartão / Pix.';
}

/**
 * Código estável (`api_err_<code>` na UI) para um erro do Asaas.
 * Erros de autenticação/configuração viram `payment_unavailable`; problemas de dados viram códigos específicos.
 */
export function asaasErrorCode(err: unknown): string {
  const raw = err instanceof Error ? err.message.toLowerCase() : '';
  if (err instanceof AsaasApiError && (err.status === 401 || err.status === 403)) return 'payment_unavailable';
  if (raw.includes('cpf') || raw.includes('cnpj') || raw.includes('document')) return 'invalid_document';
  if (raw.includes('cep') || raw.includes('postalcode') || raw.includes('addressnumber') || raw.includes('endereço') || raw.includes('telefone') || raw.includes('phone'))
    return 'holder_info_invalid';
  if (err instanceof AsaasApiError && err.stage === 'payment' && err.status === 400) return 'payment_declined';
  return 'payment_unavailable';
}
