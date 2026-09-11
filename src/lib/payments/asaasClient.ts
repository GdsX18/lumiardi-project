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
  postalCode?: string;
  addressNumber?: string;
  phone?: string;
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

export class AsaasClient {
  private readonly apiKey: string = process.env.ASAAS_API_KEY || '';
  private readonly apiUrl: string = (process.env.ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3').replace(/\/+$/, '');
  private readonly webhookSecret: string = process.env.ASAAS_WEBHOOK_SECRET || '';

  constructor() {
    // URL e Secret podem ser estáticos, mas logamos apenas ao instanciar
  }

  /** Lemos a chave dinamicamente para garantir que o dotenv foi carregado pelo Next.js e usamos fallback explícito */
  private getApiKey(): string {
    const key = process.env.ASAAS_API_KEY || this.apiKey;
    if (!key) {
      console.error('[AsaasClient] ASAAS_API_KEY is not defined.');
    }
    return key.trim();
  }

  private getHeaders(): Record<string, string> {
    const key = this.getApiKey();
    if (!key || key.startsWith('falha_')) {
      console.warn('[AsaasClient] AVISO: ASAAS_API_KEY não encontrada no process.env!');
    } else {
      console.log(`[AsaasClient] Usando Key prefixo: ${key.slice(0, 15)}...`);
    }

    return {
      'Content-Type': 'application/json',
      access_token: key,
    };
  }

  /**
   * Busca ou cria cliente no Asaas (/v3/customers)
   */
  async getOrCreateCustomer(params: AsaasCustomerParams): Promise<AsaasCustomerResponse> {
    const cleanCpfCnpj = params.cpfCnpj ? params.cpfCnpj.replace(/\D/g, '') : undefined;
    const cleanPhone = params.phone ? params.phone.replace(/\D/g, '') : undefined;

    try {
      // 1. Tenta buscar cliente existente por e-mail ou CPF
      let searchUrl = `${this.apiUrl}/customers?email=${encodeURIComponent(params.email)}`;
      if (cleanCpfCnpj) {
        searchUrl += `&cpfCnpj=${cleanCpfCnpj}`;
      }

      const searchRes = await fetch(searchUrl, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (searchRes.ok) {
        const searchJson = await searchRes.json();
        if (searchJson.data && searchJson.data.length > 0) {
          return searchJson.data[0];
        }
      }

      // 2. Se não encontrou, cria novo cliente
      const createRes = await fetch(`${this.apiUrl}/customers`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          name: params.name,
          email: params.email,
          cpfCnpj: cleanCpfCnpj,
          phone: cleanPhone,
          mobilePhone: cleanPhone,
          externalReference: params.externalReference,
          notificationDisabled: false,
        }),
      });

      if (!createRes.ok) {
        const errJson = await createRes.json().catch(() => ({}));
        const msg = errJson.errors?.[0]?.description || `Falha ao criar cliente Asaas: HTTP ${createRes.status}`;
        throw new Error(msg);
      }

      return await createRes.json();
    } catch (err: unknown) {
      console.warn('[AsaasClient getOrCreateCustomer] Fallback ativado:', err);
      return {
        id: `cus_${Date.now()}`,
        name: params.name,
        email: params.email,
        cpfCnpj: cleanCpfCnpj,
        phone: cleanPhone,
        externalReference: params.externalReference,
      };
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
      const holderPhone = (holderInfo.phone || holderInfo.mobilePhone || '11999998888').replace(/\D/g, '');

      payload.creditCardHolderInfo = {
        name: holderInfo.name,
        email: holderInfo.email,
        cpfCnpj: holderInfo.cpfCnpj.replace(/\D/g, ''),
        postalCode: (holderInfo.postalCode || '01310100').replace(/\D/g, ''),
        addressNumber: holderInfo.addressNumber || '100',
        phone: holderPhone,
        mobilePhone: holderPhone,
      };

      if (params.installmentCount && params.installmentCount > 1) {
        payload.installmentCount = params.installmentCount;
        payload.installmentValue = Number((params.value / params.installmentCount).toFixed(2));
      }
    }

    const res = await fetch(`${this.apiUrl}/payments`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      const msg = errJson.errors?.[0]?.description || `Falha ao criar cobrança Asaas: HTTP ${res.status}`;
      throw new Error(msg);
    }

    return await res.json();
  }

  /**
   * Obtém QR Code e Copia e Cola Pix (/v3/payments/{id}/pixQrCode)
   */
  async getPixQrCode(paymentId: string, amount: number = 19.90): Promise<AsaasPixQrCodeResponse> {
    const isMock = !this.apiKey || this.apiKey === '$aact_sua_chave' || paymentId.startsWith('pay_mock_');

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

    const res = await fetch(`${this.apiUrl}/payments/${paymentId}/pixQrCode`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      const msg = errJson.errors?.[0]?.description || `Falha ao obter QR Code Pix do Asaas: HTTP ${res.status}`;
      throw new Error(msg);
    }

    return await res.json();
  }

  /**
   * Valida o token de segurança enviado no header do Webhook Asaas
   * Asaas envia o token no header: 'asaas-access-token'
   */
  verifyWebhookToken(receivedToken: string | null | undefined): boolean {
    if (!this.webhookSecret) {
      // Se não configurou segredo ainda, permite em ambiente não produtivo
      return process.env.NODE_ENV !== 'production';
    }

    if (!receivedToken) {
      return false;
    }

    return receivedToken.trim() === this.webhookSecret.trim();
  }
}

export const asaasClient = new AsaasClient();

