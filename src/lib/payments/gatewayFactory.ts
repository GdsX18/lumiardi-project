/**
 * LUMIARDI — PAYMENT GATEWAY FACTORY & MANAGER
 * Centralizador de acesso aos provedores CCBill (Fiat) e NOWPayments (Web3/Crypto)
 */

import { PaymentGatewayService, PaymentGatewayType } from './types';
import { CCBillAdapter } from './ccbillAdapter';
import { NOWPaymentsAdapter } from './nowpaymentsAdapter';

class PaymentGatewayFactory {
  private ccbillAdapter: CCBillAdapter;
  private nowpaymentsAdapter: NOWPaymentsAdapter;

  constructor() {
    this.ccbillAdapter = new CCBillAdapter();
    this.nowpaymentsAdapter = new NOWPaymentsAdapter();
  }

  /**
   * Retorna o serviço correspondente ao gateway solicitado
   */
  getGateway(gateway: PaymentGatewayType): PaymentGatewayService {
    switch (gateway) {
      case 'ccbill':
        return this.ccbillAdapter;
      case 'nowpayments':
        return this.nowpaymentsAdapter;
      default:
        throw new Error(`Gateway de pagamento não suportado: ${gateway}`);
    }
  }

  getCCBillAdapter(): CCBillAdapter {
    return this.ccbillAdapter;
  }

  getNOWPaymentsAdapter(): NOWPaymentsAdapter {
    return this.nowpaymentsAdapter;
  }
}

export const paymentFactory = new PaymentGatewayFactory();
