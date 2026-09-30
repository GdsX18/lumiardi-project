/**
 * Rota legada: a cobrança Pix é gerada por /api/checkout/create-session (sessão obrigatória
 * e status de curadoria validado no banco). Mantida só por compatibilidade.
 */
export { POST } from '../create-session/route';
