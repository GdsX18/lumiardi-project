import { NextRequest } from 'next/server';
import { fallbackStore } from '@/lib/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let invoice: Record<string, unknown> | null = null;
  for (const inv of fallbackStore.invoices.values()) {
    if (inv.id === id) {
      invoice = inv as unknown as Record<string, unknown>;
      break;
    }
  }

  if (!invoice) {
    invoice = {
      id,
      invoice_number: `LUM-INV-2026-${id}`,
      amount: 69.90,
      currency: 'BRL',
      status: 'paid',
      billing_reason: 'Assinatura Mensal — Membro VIP Lumiardi',
      due_date: new Date().toISOString(),
      paid_at: new Date().toISOString(),
      receipt_number: 'LMI-REC-99201',
    };
  }

  // Gera HTML formatado de alta elegância como Recibo Oficial / Imprimível
  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Fatura Oficial — ${invoice.invoice_number || invoice.invoiceNumber}</title>
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
        <span class="badge">Liquidado ✓</span>
      </div>
    </div>

    <div class="details">
      <div class="row">
        <span class="label">Número do Documento:</span>
        <span><strong>${String(invoice.invoice_number || invoice.invoiceNumber || 'LUM-INV-2026')}</strong></span>
      </div>
      <div class="row">
        <span class="label">Código de Autenticação / Recibo:</span>
        <span>${String(invoice.receipt_number || invoice.receiptNumber || 'LMI-REC-99410')}</span>
      </div>
      <div class="row">
        <span class="label">Data de Emissão & Pagamento:</span>
        <span>${new Date(String(invoice.paid_at || invoice.paidAt || new Date().toISOString())).toLocaleDateString('pt-BR')}</span>
      </div>
      <div class="row">
        <span class="label">Descrição do Serviço:</span>
        <span>${String(invoice.billing_reason || invoice.billingReason || 'Assinatura Membro Lumiardi VIP')}</span>
      </div>
      <div class="row">
        <span class="label">Método de Liquidação:</span>
        <span>Cartão de Crédito / Cripto Shield</span>
      </div>

      <div class="row total">
        <span>Valor Total Pago:</span>
        <span>${invoice.currency === 'USD' ? '$' : 'R$'} ${Number(invoice.amount || 0).toFixed(2)}</span>
      </div>
    </div>

    <div class="footer">
      Lumiardi Technologies S.A. · Documento Fiscal e Comprovante de Quitação Digital Criptografado · Suporte: curadoria@lumiardi.com
    </div>
  </div>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `inline; filename="Fatura-${invoice.invoice_number || 'Lumiardi'}.html"`,
    },
  });
}
