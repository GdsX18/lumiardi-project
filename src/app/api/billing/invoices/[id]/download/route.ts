import { NextRequest, NextResponse } from 'next/server';
import { BillingService } from '@/lib/payments/billingService';
import { decodeSession, SESSION_COOKIE_NAME } from '@/lib/auth';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = decodeSession(cookie);

  if (!session) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  const { id } = await params;
  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'ID de fatura inválido.' }, { status: 400 });
  }

  const invoice = await BillingService.getInvoiceById(id);

  if (!invoice) {
    return NextResponse.json({ error: 'Fatura não encontrada.' }, { status: 404 });
  }

  // Verificar propriedade (autorização)
  if (session.role !== 'admin' && invoice.userId !== session.id) {
    return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 403 });
  }

  const safeInvoiceNumber = escapeHtml(invoice.invoiceNumber || 'LUM-INV-2026');
  const safeReceiptNumber = escapeHtml(invoice.receiptNumber || 'LMI-REC-99410');
  const safeBillingReason = escapeHtml(invoice.billingReason || 'Assinatura Membro Lumiardi VIP');
  const safeDate = escapeHtml(new Date(invoice.paidAt || invoice.createdAt || new Date().toISOString()).toLocaleDateString('pt-BR'));
  const safeCurrency = invoice.currency === 'USD' ? '$' : 'R$';
  const safeAmount = Number(invoice.amount || 0).toFixed(2);

  // Gera HTML formatado de alta elegância como Recibo Oficial / Imprimível
  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Fatura Oficial — ${safeInvoiceNumber}</title>
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #0B0B0B; color: #F7F3EC; margin: 0; padding: 40px; }
    .invoice-card { max-width: 700px; margin: 0 auto; background: #121212; border: 1px solid #C9A96B; padding: 40px; box-shadow: 0 20px 50px rgba(0,0,0,0.8); }
    .header { display: flex; justify-content: space-between; border-bottom: 1px solid rgba(201,169,107,0.3); padding-bottom: 20px; }
    .logo { font-size: 28px; font-weight: 300; letter-spacing: 4px; color: #C9A96B; }
    .badge { background: rgba(201,169,107,0.15); color: #C9A96B; padding: 4px 12px; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; border: 1px solid #C9A96B; }
    .details { margin: 30px 0; }
    .row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px; }
    .label { color: rgba(247,243,236,0.6); }
    .total { font-size: 24px; color: #C9A96B; font-weight: 600; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 15px; margin-top: 20px; }
    .footer { margin-top: 40px; font-size: 11px; color: rgba(247,243,236,0.4); text-align: center; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 20px; }
    @media print { body { background: white; color: black; } .invoice-card { border: 1px solid black; background: white; color: black; } }
  </style>
</head>
<body>
  <div class="invoice-card">
    <div class="header">
      <div>
        <div class="logo">LUMIARDI</div>
        <div style="font-size: 12px; color: rgba(247,243,236,0.5); margin-top: 4px;">Exclusive Agency & Creator Ecosystem</div>
      </div>
      <div>
        <span class="badge">Liquidado</span>
      </div>
    </div>

    <div class="details">
      <div class="row">
        <span class="label">Número do Documento:</span>
        <span><strong>${safeInvoiceNumber}</strong></span>
      </div>
      <div class="row">
        <span class="label">Código de Autenticação / Recibo:</span>
        <span>${safeReceiptNumber}</span>
      </div>
      <div class="row">
        <span class="label">Data de Emissão & Pagamento:</span>
        <span>${safeDate}</span>
      </div>
      <div class="row">
        <span class="label">Descrição do Serviço:</span>
        <span>${safeBillingReason}</span>
      </div>
      <div class="row">
        <span class="label">Método de Liquidação:</span>
        <span>Cartão de Crédito / Cripto Shield</span>
      </div>

      <div class="row total">
        <span>Valor Total Pago:</span>
        <span>${safeCurrency} ${safeAmount}</span>
      </div>
    </div>

    <div class="footer">
      Lumiardi Technologies S.A. · Documento Fiscal e Comprovante de Quitação Digital Criptografado · Suporte: contact@lumiardi.com
    </div>
  </div>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `inline; filename="Fatura-${safeInvoiceNumber}.html"`,
      'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'",
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
    },
  });
}
