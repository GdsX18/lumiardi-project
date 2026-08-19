import { NextRequest, NextResponse } from 'next/server';
import { StorageService } from '@/services/storageService';
import { decodeSession, SESSION_COOKIE_NAME, encodeSession } from '@/lib/auth';
import { sanitizeInput } from '@/lib/security';

export async function POST(request: NextRequest) {
  try {
    const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = decodeSession(cookie);

    if (!session || !session.id) {
      return NextResponse.json({ error: 'Sessão expirada ou não autenticada.' }, { status: 401 });
    }

    const body = await request.json();
    const role = session.role as 'criadora' | 'agencia';

    // Sanitiza e extrai campos recebidos
    const sanitizedUpdates: any = {};

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
    if (body.videoUrl !== undefined) sanitizedUpdates.videoUrl = sanitizeInput(body.videoUrl);
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
      sanitizedUpdates.photos = body.photos.map((p: any) => ({
        id: p.id || `photo-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        url: sanitizeInput(p.url || ''),
        title: sanitizeInput(p.title || 'Ensaio Editorial'),
        tag: sanitizeInput(p.tag || 'Alta Resolução'),
      }));
    }

    if (body.avatarUrl !== undefined) {
      sanitizedUpdates.avatarUrl = sanitizeInput(body.avatarUrl);
    }

    // Salva no banco de dados e fallback
    const result = await StorageService.updateUserProfile(session.id, role, sanitizedUpdates);

    // Atualiza o cookie de sessão com os novos dados de nome se alterados
    const updatedUser = result?.user;
    if (updatedUser) {
      session.name = updatedUser.name;
    }

    const response = NextResponse.json({
      success: true,
      user: updatedUser,
      profile: result?.profile,
      message: 'Perfil e book atualizados com sucesso.',
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: encodeSession(session),
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao atualizar perfil';
    console.error('Erro no update de perfil:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
