import { NextResponse } from 'next/server';

/**
 * Rota legada de cadastro. Criava contas sem o 2FA obrigatório e sem rate limit.
 * Cadastros passam exclusivamente por POST /api/creators/register e /api/agencies/register.
 */
export async function POST() {
  return NextResponse.json(
    {
      error: 'Rota descontinuada. Use /api/creators/register ou /api/agencies/register.',
      code: 'not_found',
    },
    { status: 410 }
  );
}
