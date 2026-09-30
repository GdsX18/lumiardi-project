/**
 * Rota legada: o fluxo de cartão é processado por /api/checkout/confirm (sessão obrigatória,
 * status de curadoria validado no banco, reserva atômica de cupom). Mantida só por compatibilidade.
 */
export { POST } from '../confirm/route';
