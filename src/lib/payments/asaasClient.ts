import { safeEqual } from '@/lib/security/secureCompare';
/**
 * LUMIARDI — ASAAS API v3 CLIENT
 * Integração oficial com a API v3 do Asaas (https://www.asaas.com/)
 * Processamento de pagamentos em BRL: Pix dinâmico (BACEN/EMV) e Cartão de Crédito.
 */

export interface AsaasCustomerParams {
  name: string;
  email: string;
  cpfCnpj?: string;
  phone?: string;
  mobilePhone?: string;
  externalReference?: string;
}

export interface AsaasCustomerResponse {
  id: string;
  name: string;
  email: string;
  cpfCnpj?: string;
  phone?: string;
  mobilePhone?: string;
  externalReference?: string;
}

export interface AsaasCreditCardData {
  holderName: string;
  number: string;
  expiryMonth: string;
  expiryYear: string;
  ccv: string;
}

export interface AsaasCreditCardHolderInfo {
  name: string;
  email: string;
  cpfCnpj: string;
  postalCode: string;
  addressNumber: string;
  phone: string;
  mobilePhone?: string;
}

export interface AsaasCreatePaymentParams {
  customerId: string;
  billingType: 'PIX' | 'CREDIT_CARD' | 'BOLETO';
  value: number;
  dueDate: string; // YYYY-MM-DD
  description: string;
  externalReference?: string;
  creditCard?: AsaasCreditCardData;
  creditCardHolderInfo?: AsaasCreditCardHolderInfo;
  installmentCount?: number;
  installmentValue?: number;
  /** IP do cliente pagador (obrigatório no Asaas para cartão; nunca o IP do servidor) */
  remoteIp?: string;
}

export interface AsaasPaymentResponse {
  id: string;
  dateCreated: string;
  customer: string;
  value: number;
  netValue?: number;
  billingType: 'PIX' | 'CREDIT_CARD' | 'BOLETO' | string;
  status: 'PENDING' | 'RECEIVED' | 'CONFIRMED' | 'OVERDUE' | 'REFUNDED' | string;
  dueDate: string;
  description?: string;
  externalReference?: string;
  creditCard?: {
    creditCardNumber?: string;
    creditCardBrand?: string;
    creditCardToken?: string;
  };
  invoiceUrl?: string;
  bankSlipUrl?: string;
}

export interface AsaasPixQrCodeResponse {
  encodedImage: string; // Base64 PNG ou URL
  payload: string; // Pix Copia e Cola EMV
  expirationDate: string;
}

/** Erro devolvido pela API do Asaas, preservando o código e a etapa para diagnóstico nos logs. */
export class AsaasApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string | undefined,
    public readonly stage: 'customer' | 'payment' | 'pixQrCode' | 'refund',
    /** Corpo de erro completo devolvido pelo Asaas (errors[], código da adquirente, refusalReason...) */
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'AsaasApiError';
  }
}

async function toAsaasError(res: Response, stage: AsaasApiError['stage'], fallback: string): Promise<AsaasApiError> {
  const errJson = await res.json().catch(() => ({}));
  const first = errJson?.errors?.[0] || {};
  const err = new AsaasApiError(first.description || `${fallback}: HTTP ${res.status}`, res.status, first.code, stage, errJson);
  // Resposta de erro do Asaas na íntegra (não contém o cartão nem a chave, que só vão no request)
  console.error(`[AsaasClient ${stage}] HTTP ${res.status}`, JSON.stringify(errJson));
  return err;
}

export class AsaasClient {
  /** Lemos a URL base dinamicamente com fallback oficial para a API de Produção */
  private get apiUrl(): string {
    return (process.env.ASAAS_API_URL || 'https://api.asaas.com/v3').replace(/\/+$/, '');
  }

  /** Lemos a chave dinamicamente para garantir que o dotenv foi carregado pelo Next.js */
  private getApiKey(): string {
    const key = (process.env.ASAAS_API_KEY || '').trim();
    if (!key) {
      console.error('[AsaasClient] ASAAS_API_KEY is not defined.');
    }
    return key;
  }

  /** Lemos o segredo do webhook dinamicamente */
  private getWebhookSecret(): string {
    return (process.env.ASAAS_WEBHOOK_SECRET || '').trim();
  }

  private getHeaders(): Record<string, string> {
    const key = this.getApiKey();
    if (!key || key.startsWith('falha_')) {
      console.warn('[AsaasClient] AVISO: ASAAS_API_KEY não encontrada no process.env!');
    }

    return {
      'Content-Type': 'application/json',
      'User-Agent': 'Lumiardi/1.0.0',
      access_token: key,
    };
  }

  /**
   * Busca ou cria cliente no Asaas (/v3/customers).
   * O cliente é a conta da plataforma (e-mail da usuária); o titular do cartão vai à parte em
   * creditCardHolderInfo. O Asaas exige CPF/CNPJ no cliente para emitir Pix/cartão: se o cliente
   * existente não tiver documento, ele é completado — um documento já cadastrado nunca é sobrescrito.
   */
  async getOrCreateCustomer(params: AsaasCustomerParams): Promise<AsaasCustomerResponse> {
    const cleanCpfCnpj = params.cpfCnpj ? params.cpfCnpj.replace(/\D/g, '') || undefined : undefined;
    const cleanPhone = params.phone ? params.phone.replace(/\D/g, '') || undefined : undefined;

    try {
      // 1. Busca pelo e-mail da conta (filtrar também por CPF criaria um cliente duplicado a cada titular diferente)
      const searchRes = await fetch(`${this.apiUrl}/customers?email=${encodeURIComponent(params.email)}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (searchRes.ok) {
        const searchJson = await searchRes.json();
        const list: AsaasCustomerResponse[] = Array.isArray(searchJson.data) ? searchJson.data : [];
        const existing = list.find((c) => c.cpfCnpj) || list[0];
        if (existing) {
          if (existing.cpfCnpj || !cleanCpfCnpj) return existing;
          const updateRes = await fetch(`${this.apiUrl}/customers/${encodeURIComponent(existing.id)}`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({ cpfCnpj: cleanCpfCnpj, ...(cleanPhone ? { mobilePhone: cleanPhone } : {}) }),
          });
          if (!updateRes.ok) throw await toAsaasError(updateRes, 'customer', 'Falha ao atualizar CPF/CNPJ do cliente Asaas');
          return await updateRes.json();
        }
      } else {
        throw await toAsaasError(searchRes, 'customer', 'Falha ao buscar cliente Asaas');
      }

      // 2. Se não encontrou, cria novo cliente
      const createRes = await fetch(`${this.apiUrl}/customers`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          name: params.name,
          email: params.email,
          cpfCnpj: cleanCpfCnpj,
          mobilePhone: cleanPhone,
          externalReference: params.externalReference,
          notificationDisabled: false,
        }),
      });

      if (!createRes.ok) throw await toAsaasError(createRes, 'customer', 'Falha ao criar cliente Asaas');

      return await createRes.json();
    } catch (err: unknown) {
      // Sem cliente real no Asaas não há como cobrar: propaga o erro em vez de inventar um ID
      if (err instanceof AsaasApiError) throw err;
      console.error('[AsaasClient getOrCreateCustomer] Falha:', err);
      throw err instanceof Error ? err : new Error('Falha ao criar cliente no Asaas');
    }
  }

  /**
   * Criação de cobrança / pagamento (/v3/payments)
   */
  async createPayment(params: AsaasCreatePaymentParams): Promise<AsaasPaymentResponse> {
    const payload: Record<string, unknown> = {
      customer: params.customerId,
      billingType: params.billingType,
      value: params.value,
      dueDate: params.dueDate,
      description: params.description,
      externalReference: params.externalReference,
      postalService: false,
    };

    if (params.billingType === 'CREDIT_CARD' && params.creditCard && params.creditCardHolderInfo) {
      payload.creditCard = {
        holderName: params.creditCard.holderName,
        number: params.creditCard.number.replace(/\D/g, ''),
        expiryMonth: params.creditCard.expiryMonth,
        expiryYear: params.creditCard.expiryYear,
        ccv: params.creditCard.ccv,
      };
      const holderInfo = params.creditCardHolderInfo;
      const holderPhone = (holderInfo.phone || holderInfo.mobilePhone || '').replace(/\D/g, '');

      payload.creditCardHolderInfo = {
        name: holderInfo.name,
        email: holderInfo.email,
        cpfCnpj: holderInfo.cpfCnpj.replace(/\D/g, ''),
        postalCode: holderInfo.postalCode.replace(/\D/g, ''),
        addressNumber: holderInfo.addressNumber,
        phone: holderPhone,
        mobilePhone: holderPhone,
      };

      if (params.remoteIp) payload.remoteIp = params.remoteIp;

      const installments = Math.floor(Number(params.installmentCount) || 1);
      if (installments > 1 && installments <= 12) {
        // totalValue: o Asaas distribui os centavos entre as parcelas (sem cobrar a menos por arredondamento)
        delete payload.value;
        payload.installmentCount = installments;
        payload.totalValue = params.value;
      }
    }

    const res = await fetch(`${this.apiUrl}/payments`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      if (res.status === 401 && process.env.NODE_ENV !== 'production') {
        console.warn('[AsaasClient createPayment] Chave Sandbox não autenticada no Asaas, gerando simulação segura de teste.');
        return {
          id: `pay_mock_${Date.now()}`,
          dateCreated: new Date().toISOString(),
          customer: params.customerId,
          value: params.value,
          billingType: params.billingType,
          status: 'PENDING',
          dueDate: params.dueDate,
          description: params.description,
          externalReference: params.externalReference,
        };
      }
      throw await toAsaasError(res, 'payment', 'Falha ao criar cobrança Asaas');
    }

    return await res.json();
  }

  /**
   * Obtém QR Code e Copia e Cola Pix (/v3/payments/{id}/pixQrCode)
   */
  async getPixQrCode(paymentId: string, amount: number = 19.90): Promise<AsaasPixQrCodeResponse> {
    const apiKey = this.getApiKey();
    // Pix simulado só fora de produção: em produção um QR falso nunca seria liquidado
    const isMock =
      process.env.NODE_ENV !== 'production' &&
      (!apiKey || apiKey === '$aact_sua_chave' || paymentId.startsWith('pay_mock_'));

    if (isMock) {
      const formattedAmount = amount.toFixed(2);
      const mockPayload = `00020126580014br.gov.bcb.pix0136pix@asaas.com.br520400005303986540${formattedAmount}5802BR5916LUMIARDI PLATFORM6009SAO PAULO62070503***6304`;
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(mockPayload)}`;

      return {
        encodedImage: qrCodeUrl,
        payload: mockPayload,
        expirationDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };
    }

    // O QR pode não estar disponível no mesmo instante da criação da cobrança: até 3 tentativas
    let lastError: AsaasApiError | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt > 0) await new Promise((r) => setTimeout(r, 700 * attempt));
      const res = await fetch(`${this.apiUrl}/payments/${encodeURIComponent(paymentId)}/pixQrCode`, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      if (res.ok) {
        const qr: AsaasPixQrCodeResponse = await res.json();
        if (qr.encodedImage && qr.payload) return qr;
        lastError = new AsaasApiError('QR Code Pix vazio retornado pelo Asaas', res.status, undefined, 'pixQrCode');
        continue;
      }
      lastError = await toAsaasError(res, 'pixQrCode', 'Falha ao obter QR Code Pix do Asaas');
      if (res.status === 401 || res.status === 403) break;
    }
    throw lastError!;
  }

  /**
   * Estorno total de uma cobrança (/v3/payments/{id}/refund).
   * O webhook PAYMENT_REFUNDED confirma a conclusão do estorno.
   */
  async refundPayment(paymentId: string, description?: string): Promise<{ id: string; status: string }> {
    const res = await fetch(`${this.apiUrl}/payments/${encodeURIComponent(paymentId)}/refund`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(description ? { description: description.slice(0, 500) } : {}),
    });
    if (!res.ok) throw await toAsaasError(res, 'refund', 'Falha ao estornar cobrança no Asaas');
    return await res.json();
  }

  /**
   * Valida o token de segurança enviado no header do Webhook Asaas
   * Asaas envia o token no header: 'asaas-access-token'
   */
  verifyWebhookToken(receivedToken: string | null | undefined): boolean {
    const secret = this.getWebhookSecret();

    // Fail-closed em qualquer ambiente: sem segredo configurado, nenhum webhook é aceito
    if (!secret || !receivedToken) {
      return false;
    }

    return safeEqual(receivedToken.trim(), secret);
  }
}

export const asaasClient = new AsaasClient();

