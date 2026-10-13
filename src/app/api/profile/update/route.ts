import { NextRequest, NextResponse } from 'next/server';
import { getActiveSession } from '@/lib/apiAuth';
import { StorageService } from '@/services/storageService';
import { SESSION_COOKIE_NAME, encodeSession, setSessionCookie, type SessionUser } from '@/lib/auth';
import { initDatabase, pool } from '@/lib/db';
import { sanitizeInput } from '@/lib/security';

const MAX_PROFILE_PHOTOS = 60;

/** Links de mídia do perfil: só a mídia da própria plataforma ou https (nada de javascript:/data:). */
function safeMediaUrl(raw: unknown): string {
  const value = sanitizeInput(String(raw ?? '')).slice(0, 2048);
  if (!value) return '';
  if (value.startsWith('/api/media/') || value.startsWith('/images/') || value.startsWith('/documents/')) return value;
  try {
    return new URL(value).protocol === 'https:' ? value : '';
  } catch {
    return '';
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = await getActiveSession(cookie);

    if (!session || !session.id) {
      return NextResponse.json({ error: 'Sessão expirada ou não autenticada.' }, { status: 401 });
    }

    const body = await request.json();
    const role = session.role as 'criadora' | 'agencia';

    // Sanitiza e extrai campos recebidos
    const sanitizedUpdates: Record<string, unknown> = {};

    if (body.artisticName !== undefined) sanitizedUpdates.artisticName = sanitizeInput(body.artisticName);
    if (body.fullName !== undefined) sanitizedUpdates.fullName = sanitizeInput(body.fullName);
    if (body.category !== undefined) sanitizedUpdates.category = sanitizeInput(body.category);
    if (body.instagram !== undefined) {
      let ig = sanitizeInput(body.instagram);
      if (ig && !ig.startsWith('@')) ig = `@${ig}`;
      sanitizedUpdates.instagram = ig;
    }
    if (body.bio !== undefined) sanitizedUpdates.bio = sanitizeInput(body.bio);
    if (body.hobbies !== undefined) sanitizedUpdates.hobbies = sanitizeInput(body.hobbies);
    if (body.exposureOpinion !== undefined) sanitizedUpdates.exposureOpinion = sanitizeInput(body.exposureOpinion);
    if (body.videoUrl !== undefined) sanitizedUpdates.videoUrl = safeMediaUrl(body.videoUrl);
    if (body.monthlyRevenueEstimate !== undefined) sanitizedUpdates.monthlyRevenueEstimate = sanitizeInput(body.monthlyRevenueEstimate);
    if (body.mainGoal !== undefined) sanitizedUpdates.mainGoal = sanitizeInput(body.mainGoal);
    if (body.personalLimits !== undefined) sanitizedUpdates.personalLimits = sanitizeInput(body.personalLimits);

    if (body.measurements && typeof body.measurements === 'object') {
      sanitizedUpdates.measurements = {
        height: sanitizeInput(body.measurements.height || '175'),
        weight: sanitizeInput(body.measurements.weight || '55'),
        waist: sanitizeInput(body.measurements.waist || '60'),
        bust: sanitizeInput(body.measurements.bust || '88'),
        hips: sanitizeInput(body.measurements.hips || '90'),
      };
    }

    if (body.physiognomy && typeof body.physiognomy === 'object') {
      sanitizedUpdates.physiognomy = {
        eyeColor: sanitizeInput(body.physiognomy.eyeColor || 'Castanhos'),
        hairColor: sanitizeInput(body.physiognomy.hairColor || 'Natural'),
        skinTone: sanitizeInput(body.physiognomy.skinTone || 'Clara'),
        languages: Array.isArray(body.physiognomy.languages)
          ? body.physiognomy.languages.map((l: string) => sanitizeInput(l))
          : ['Português'],
      };
    }

    if (body.address && typeof body.address === 'object') {
      sanitizedUpdates.address = {
        country: sanitizeInput(body.address.country || 'Brasil'),
        state: sanitizeInput(body.address.state || 'SP'),
        city: sanitizeInput(body.address.city || 'São Paulo'),
      };
    }

    if (Array.isArray(body.photos)) {
      sanitizedUpdates.photos = body.photos.slice(0, MAX_PROFILE_PHOTOS).map((p: Record<string, unknown>) => ({
        id: p.id || `photo-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        url: safeMediaUrl(p.url),
        title: sanitizeInput(String(p.title || 'Ensaio Editorial')),
        tag: sanitizeInput(String(p.tag || 'Alta Resolução')),
      }));
    }

    if (body.acceptsOffers !== undefined) sanitizedUpdates.acceptsOffers = Boolean(body.acceptsOffers);
    // isRepresented / representedAgencyId / representedAgencyName NÃO são editáveis aqui: derivam do contrato
    // criado ao aceitar uma proposta (PATCH /api/scout/proposals/[id]). O id dava acesso ao drive da agência.

    if (body.avatarUrl !== undefined) {
      sanitizedUpdates.avatarUrl = safeMediaUrl(body.avatarUrl);
    }
    if (body.logoUrl !== undefined) {
      sanitizedUpdates.logoUrl = safeMediaUrl(body.logoUrl);
    }

    // Salva no banco de dados e fallback
    const result = await StorageService.updateUserProfile(session.id, role, sanitizedUpdates);

    // Atualiza o cookie de sessão com os novos dados de nome se alterados
    const updatedUser = result?.user;
    if (updatedUser) {
      session.name = updatedUser.name;
    }
    // A renovação do cookie nunca prolonga um status antigo: o status vem sempre do banco
    await initDatabase();
    const statusRes = await pool.query('SELECT curation_status FROM users WHERE id = $1', [session.id]);
    if (statusRes.rows[0]?.curation_status) {
      session.curationStatus = String(statusRes.rows[0].curation_status).toUpperCase() as SessionUser['curationStatus'];
    }

    const response = NextResponse.json({
      success: true,
      user: updatedUser,
      profile: result?.profile,
      message: 'Perfil e book atualizados com sucesso.',
    });

    setSessionCookie(response, session);

    return response;
  } catch (err: unknown) {
    console.error('[api/profile/update] Erro:', err);
    const message = 'Erro ao atualizar perfil';
    console.error('Erro no update de perfil:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
