/**
 * LUMIARDI — Utilitários compartilhados do fluxo de cadastro (criadoras e agências)
 */

import { NextResponse } from 'next/server';
import { R2StorageService } from '@/lib/storage/r2Service';
import { initDatabase, pool } from '@/lib/db';

const DATA_URL_RE = /^data:([a-z0-9.+/-]+);base64,/i;
const ALLOWED_DOC_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);
const MAX_DOC_BYTES = 10 * 1024 * 1024;

export function isDataUrl(value: unknown): value is string {
  return typeof value === 'string' && DATA_URL_RE.test(value);
}

/**
 * Retira o documento em Base64 do corpo bruto ANTES da sanitização.
 * Data URLs não podem ir para colunas de URL (VARCHAR) nem passar pelas regex do sanitizer.
 * Retorna o data URL removido (ou null) e deixa no corpo apenas URLs "normais".
 */
export function extractDocumentDataUrl(basicInfo: unknown): string | null {
  const doc = (basicInfo as { document?: Record<string, unknown> } | undefined)?.document;
  if (!doc || typeof doc !== 'object') return null;
  let dataUrl: string | null = null;
  for (const field of ['fileUrl', 'fileData', 'url']) {
    if (isDataUrl(doc[field])) {
      dataUrl = dataUrl || (doc[field] as string);
      delete doc[field];
    }
  }
  return dataUrl;
}

/**
 * Envia o documento de identidade para o vault privado (R2) e grava a chave no usuário.
 * Falha aqui NÃO bloqueia o cadastro (o KYC já foi homologado); apenas registra o erro.
 */
export async function persistIdentityDocument(userId: string, dataUrl: string, fileName?: string): Promise<string | null> {
  try {
    const match = dataUrl.match(DATA_URL_RE);
    const contentType = (match?.[1] || '').toLowerCase();
    if (!ALLOWED_DOC_TYPES.has(contentType)) {
      console.warn(`[Registro] Tipo de documento não suportado (${contentType}) para ${userId}.`);
      return null;
    }
    const buffer = Buffer.from(dataUrl.slice(match![0].length), 'base64');
    if (buffer.length === 0 || buffer.length > MAX_DOC_BYTES) {
      console.warn(`[Registro] Documento de ${userId} com tamanho inválido (${buffer.length} bytes).`);
      return null;
    }

    const safeName = (fileName || 'documento').slice(-60);
    const key = R2StorageService.generateFileKey({ userId, category: 'kyc-documents', fileName: safeName });
    const upload = await R2StorageService.uploadBuffer({ key, buffer, contentType });
    if (!upload.success) {
      console.error(`[Registro] Upload do documento de ${userId} falhou:`, upload.error);
      return null;
    }

    await initDatabase();
    await pool.query('UPDATE users SET document_url = $1, updated_at = NOW() WHERE id = $2', [upload.url, userId]);
    return upload.url;
  } catch (err) {
    console.error(`[Registro] Falha ao persistir documento de ${userId}:`, err);
    return null;
  }
}

/** Converte os erros conhecidos do StorageService.registerUser em respostas HTTP claras. */
export function registrationErrorResponse(err: unknown, scope: string): NextResponse {
  const message = err instanceof Error ? err.message : String(err);
  switch (message) {
    case 'EMAIL_IN_USE':
      return NextResponse.json(
        { error: 'Este e-mail já possui cadastro. Faça login ou recupere sua senha.', code: 'email_in_use' },
        { status: 409 }
      );
    case 'WEAK_PASSWORD':
      return NextResponse.json(
        { error: 'A senha precisa ter de 8 a 128 caracteres, com letras e números.', code: 'weak_password' },
        { status: 400 }
      );
    case 'DATABASE_UNAVAILABLE':
      console.error(`[${scope}] Banco de dados indisponível durante o cadastro.`);
      return NextResponse.json(
        { error: 'Serviço temporariamente indisponível. Seus dados não foram perdidos — tente novamente em instantes.', code: 'service_unavailable' },
        { status: 503 }
      );
    default:
      console.error(`[${scope}] Erro inesperado no cadastro:`, err);
      return NextResponse.json(
        { error: 'Falha no processamento seguro dos dados.', code: 'generic' },
        { status: 500 }
      );
  }
}
