import { NextRequest, NextResponse } from 'next/server';
import { StorageService } from '@/services/storageService';
import { decodeSession, encodeSession, SESSION_COOKIE_NAME, SessionUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = decodeSession(cookie);

    const body = await request.json();
    const { date, timeSlot, whatsapp, planId, billingInterval } = body;

    if (!date || !timeSlot) {
      return NextResponse.json(
        { error: 'Data e horário da entrevista de curadoria são obrigatórios.' },
        { status: 400 }
      );
    }

    const userId = session?.id || body.userId;
    const userEmail = session?.email || body.email;
    const userName = session?.name || body.fullName || 'Candidata';
    const effectiveWhatsapp = whatsapp || session?.whatsapp || body.phone;

    if (!effectiveWhatsapp) {
      return NextResponse.json(
        { error: 'WhatsApp / Celular com DDD é obrigatório para envio do link da reunião.' },
        { status: 400 }
      );
    }

    // Salva ou atualiza a entrevista
    const interview = await StorageService.saveInterview({
      userId: userId || `user-${Date.now()}`,
      fullName: userName,
      email: userEmail || 'candidata@lumiardi.com',
      whatsapp: effectiveWhatsapp,
      planId: planId || session?.planId || 'glow',
      billingInterval: billingInterval || session?.planBillingInterval || 'yearly',
      interviewDate: date,
      interviewTime: timeSlot,
      status: 'aguardando_reuniao',
    });

    if (userId) {
      await StorageService.updateCurationStatus(userId, 'AGUARDANDO_REUNIAO');
      try {
        await StorageService.createNotification({
          userId,
          title: 'Entrevista de Curadoria Agendada',
          desc: `Sua entrevista prévia foi agendada para ${date.split('-').reverse().join('/')} às ${timeSlot} (Horário de Brasília). Nossa equipe enviará o link do Google Meet pelo WhatsApp.`,
          category: 'Curadoria',
          type: 'info',
          link: '/dashboard/pendente',
          linkText: 'Ver Detalhes',
        });
      } catch (e) {
        console.warn('Erro ao criar notificação:', e);
      }
    }

    let updatedSession: SessionUser | null = null;
    if (session) {
      updatedSession = {
        ...session,
        curationStatus: 'AGUARDANDO_REUNIAO',
        whatsapp: effectiveWhatsapp,
        interviewDate: date,
        interviewTime: timeSlot,
        planId: planId || session.planId || 'glow',
        planBillingInterval: billingInterval || session.planBillingInterval || 'yearly',
      };
    }

    const response = NextResponse.json({
      success: true,
      interview,
      message: 'Entrevista agendada com sucesso. Aguarde o contato da Mesa de Curadoria via WhatsApp.',
    });

    if (updatedSession) {
      response.cookies.set({
        name: SESSION_COOKIE_NAME,
        value: encodeSession(updatedSession),
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
      });
    }

    return response;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao agendar entrevista';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
