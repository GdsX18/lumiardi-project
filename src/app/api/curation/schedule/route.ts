import { NextRequest, NextResponse } from 'next/server';
import { StorageService } from '@/services/storageService';
import { decodeSession, SESSION_COOKIE_NAME, SessionUser, setSessionCookie } from '@/lib/auth';
import { pool, initDatabase } from '@/lib/db';

/** Só candidatas em análise podem (re)agendar; aprovadas/reprovadas não voltam para a fila. */
const SCHEDULABLE_STATUSES = ['EM_CURATORIA', 'AGUARDANDO_REUNIAO'];

export async function POST(request: NextRequest) {
  try {
    const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = decodeSession(cookie);
    if (!session) {
      return NextResponse.json({ error: 'Faça login para agendar a entrevista.', code: 'unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { date, timeSlot, whatsapp, planId, billingInterval } = body;

    if (!date || !timeSlot) {
      return NextResponse.json(
        { error: 'Data e horário da entrevista de curadoria são obrigatórios.' },
        { status: 400 }
      );
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date)) || !/^\d{2}:\d{2}$/.test(String(timeSlot))) {
      return NextResponse.json({ error: 'Data ou horário inválidos.', code: 'invalid_input' }, { status: 400 });
    }

    // Identidade exclusivamente da sessão assinada
    const userId = session.id;
    const userEmail = session.email;
    const userName = session.name || 'Candidata';
    const effectiveWhatsapp = whatsapp || session.whatsapp || body.phone;

    await initDatabase();
    const statusRes = await pool.query('SELECT curation_status FROM users WHERE id = $1', [userId]);
    const currentStatus = String(statusRes.rows[0]?.curation_status || '').toUpperCase();
    if (!SCHEDULABLE_STATUSES.includes(currentStatus)) {
      return NextResponse.json(
        { error: 'O agendamento não está disponível para o status atual da sua candidatura.', code: 'forbidden' },
        { status: 409 }
      );
    }

    if (!effectiveWhatsapp) {
      return NextResponse.json(
        { error: 'WhatsApp / Celular com DDD é obrigatório para envio do link da reunião.' },
        { status: 400 }
      );
    }

    // Salva ou atualiza a entrevista
    const interview = await StorageService.saveInterview({
      userId,
      fullName: userName,
      email: userEmail,
      whatsapp: effectiveWhatsapp,
      planId: planId || session.planId || 'glow',
      billingInterval: billingInterval || session.planBillingInterval || 'yearly',
      interviewDate: date,
      interviewTime: timeSlot,
      status: 'aguardando_reuniao',
    });

    {
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
    {
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
      setSessionCookie(response, updatedSession);
    }

    return response;
  } catch (err: unknown) {
    console.error('[curation/schedule] Erro:', err);
    return NextResponse.json({ error: 'Erro ao agendar entrevista.', code: 'generic' }, { status: 500 });
  }
}
