/**
 * LUMIARDI — PAYMENT GATEWAY FACTORY & MANAGER
 * Centralizador de acesso aos provedores Asaas (Fiat BRL - Cartão e Pix) e NOWPayments (Web3/Crypto)
 */

import { PaymentGatewayService, PaymentGatewayType } from './types';
import { AsaasAdapter } from './asaasAdapter';
import { NOWPaymentsAdapter } from './nowpaymentsAdapter';

class PaymentGatewayFactory {
  private asaasAdapter: AsaasAdapter;
  private nowpaymentsAdapter: NOWPaymentsAdapter;

  constructor() {
    this.asaasAdapter = new AsaasAdapter();
    this.nowpaymentsAdapter = new NOWPaymentsAdapter();
  }

  /**
   * Retorna o serviço correspondente ao gateway solicitado
   */
  getGateway(gateway: PaymentGatewayType): PaymentGatewayService {
    switch (gateway) {
      case 'asaas':
      case 'pix':
      case 'ccbill': // Redireciona chamadas legadas transparentemente para Asaas
        return this.asaasAdapter;
      case 'nowpayments':
        return this.nowpaymentsAdapter;
      default:
        throw new Error(`Gateway de pagamento não suportado: ${gateway}`);
    }
  }

  getAsaasAdapter(): AsaasAdapter {
    return this.asaasAdapter;
  }

  getNOWPaymentsAdapter(): NOWPaymentsAdapter {
    return this.nowpaymentsAdapter;
  }
}

export const paymentFactory = new PaymentGatewayFactory();
