import { NextRequest, NextResponse } from 'next/server';
import { getVerifiedAdminSession } from '@/lib/apiAuth';
import { pool, initDatabase, fallbackStore } from '@/lib/db';
import { EmailService } from '@/lib/email';
import { StorageService } from '@/services/storageService';
import { AuditLogService } from '@/lib/audit/auditService';
import { normalizeGoogleMeetUrl } from '@/lib/googleMeet';
import { z } from 'zod';

const MEET_REQUIRED_MSG = 'Insira o link ou código do Google Meet para enviar o convite.';
const MEET_INVALID_MSG = 'Link do Google Meet inválido. Use https://meet.google.com/abc-defg-hij ou apenas o código.';

// Meet obrigatório: string não vazia que precisa ser uma sala válida do Google Meet
const meetLinkSchema = z
  .string({ error: MEET_REQUIRED_MSG })
  .trim()
  .min(1, MEET_REQUIRED_MSG)
  .transform((value, ctx) => {
    const url = normalizeGoogleMeetUrl(value);
    if (!url) {
      ctx.addIssue({ code: 'custom', message: MEET_INVALID_MSG });
      return z.NEVER;
    }
    return url;
  });

export async function POST(req: NextRequest) {
  try {
    const session = await getVerifiedAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));

    // A candidata não tem conta na plataforma: o convite sempre aponta para o Google Meet.
    // O link é obrigatório e informado pelo admin a cada envio — não existe Meet padrão.
    const parsedMeet = meetLinkSchema.safeParse(body?.meetLink);
    if (!parsedMeet.success) {
      return NextResponse.json(
        { success: false, error: parsedMeet.error.issues[0]?.message || MEET_REQUIRED_MSG },
        { status: 400 }
      );
    }
    const finalMeetLink = parsedMeet.data;

    const {
      interviewId,
      candidateId,
      userId,
      email,
      user_email,
      interviewDate: interviewDateParam,
      interviewTime: interviewTimeParam,
    } = body;

    const targetId = (interviewId || candidateId || userId || '').toString().trim();
    const targetEmail = (email || user_email || (targetId.includes('@') ? targetId : '')).toString().trim().toLowerCase();

    if (!targetId && !targetEmail) {
      return NextResponse.json(
        { error: 'interviewId, candidateId, userId or email is required' },
        { status: 400 }
      );
    }

    await initDatabase();

    // 1. Busca Resiliente na tabela curation_interviews
    let interview: any = null;
    try {
      const result = await pool.query(
        `SELECT ci.*, 
                u.email as user_email, 
                u.full_name as user_full_name, 
                u.interview_date as u_interview_date, 
                u.interview_time as u_interview_time,
                u.whatsapp as u_whatsapp,
                u.phone as u_phone,
                u.plan_id as u_plan_id,
                u.plan_billing_interval as u_plan_billing_interval,
                p.artistic_name as p_artistic_name
         FROM curation_interviews ci
         LEFT JOIN users u ON ci.user_id = u.id
         LEFT JOIN profiles p ON ci.user_id = p.user_id
         WHERE ci.id = $1 
            OR ci.user_id = $1 
            OR ($2 != '' AND LOWER(ci.email) = $2)
         ORDER BY ci.created_at DESC
         LIMIT 1`,
        [targetId, targetEmail]
      );
      interview = result.rows[0];
    } catch (dbErr) {
      console.error('[send-interview-invite] DB error querying curation_interviews:', dbErr);
    }

    // Suporte adicional para coluna candidate_id se presente
    if (!interview && targetId) {
      try {
        const resCand = await pool.query(
          `SELECT ci.*, 
                  u.email as user_email, 
                  u.full_name as user_full_name, 
                  u.interview_date as u_interview_date, 
                  u.interview_time as u_interview_time,
                  u.whatsapp as u_whatsapp,
                  u.phone as u_phone,
                  p.artistic_name as p_artistic_name
           FROM curation_interviews ci
           LEFT JOIN users u ON ci.user_id = u.id
           LEFT JOIN profiles p ON ci.user_id = p.user_id
           WHERE ci.candidate_id = $1
           ORDER BY ci.created_at DESC
           LIMIT 1`,
          [targetId]
        );
        if (resCand.rows[0]) {
          interview = resCand.rows[0];
        }
      } catch {
        // Coluna candidate_id pode não existir em esquemas anteriores
      }
    }

    // Busca em fallbackStore caso não encontrado no Postgres
    if (!interview && fallbackStore?.curation_interviews) {
      for (const item of fallbackStore.curation_interviews.values()) {
        const inv = item as any;
        if (
          inv.id === targetId ||
          inv.userId === targetId ||
          inv.user_id === targetId ||
          inv.candidateId === targetId ||
          inv.candidate_id === targetId ||
          (targetEmail && inv.email && inv.email.toLowerCase() === targetEmail)
        ) {
          interview = inv;
          break;
        }
      }
    }

    // 2. Fallback Automático (Criação sob demanda):
    // Caso a candidata já possua cadastro/perfil mas a linha em curation_interviews ainda não exista
    if (!interview) {
      let candidateUser: any = null;
      try {
        const userRes = await pool.query(
          `SELECT u.*, p.artistic_name, p.photos, p.avatar_url
           FROM users u
           LEFT JOIN profiles p ON u.id = p.user_id
           WHERE u.id = $1 OR ($2 != '' AND LOWER(u.email) = $2)
           LIMIT 1`,
          [targetId, targetEmail]
        );
        candidateUser = userRes.rows[0];
      } catch (uErr) {
        console.error('[send-interview-invite] User search DB error:', uErr);
      }

      if (!candidateUser && fallbackStore?.users) {
        candidateUser = fallbackStore.users.get(targetId);
        if (!candidateUser && targetEmail) {
          for (const u of fallbackStore.users.values()) {
            const item = u as any;
            if (item.email && item.email.toLowerCase() === targetEmail) {
              candidateUser = item;
              break;
            }
          }
        }
      }

      if (candidateUser) {
        let dateVal = interviewDateParam || candidateUser.interview_date;
        if (dateVal instanceof Date) {
          dateVal = dateVal.toISOString().split('T')[0];
        } else if (typeof dateVal === 'string' && dateVal.includes('T')) {
          dateVal = dateVal.split('T')[0];
        }
        if (!dateVal) {
          dateVal = new Date().toISOString().split('T')[0];
        }

        const timeVal = interviewTimeParam || candidateUser.interview_time || '14:00';
        const rawPhotos = Array.isArray(candidateUser.photos) ? candidateUser.photos : [];
        const photoUrl = candidateUser.avatar_url || (rawPhotos[0]?.url || '');

        const created = await StorageService.saveInterview({
          userId: candidateUser.id,
          fullName: candidateUser.full_name || 'Candidate',
          artisticName: candidateUser.artistic_name || candidateUser.full_name,
          email: candidateUser.email,
          whatsapp: candidateUser.whatsapp || candidateUser.phone || 'Não informado',
          planId: candidateUser.plan_id || 'exclusive-black',
          billingInterval: candidateUser.plan_billing_interval || 'monthly',
          interviewDate: String(dateVal),
          interviewTime: String(timeVal),
          status: 'aguardando_reuniao',
          photoUrl,
          notes: 'Registro criado automaticamente sob demanda para envio do convite de reunião',
        });

        interview = {
          ...created,
          user_id: candidateUser.id,
          interview_date: String(dateVal),
          interview_time: String(timeVal),
          email: candidateUser.email,
          full_name: candidateUser.full_name,
          artistic_name: candidateUser.artistic_name,
        };

        // Sincroniza campos da entrevista na tabela users
        try {
          await pool.query(
            `UPDATE users 
             SET interview_date = COALESCE(interview_date, $1::date),
                 interview_time = COALESCE(interview_time, $2),
                 curation_status = CASE WHEN curation_status = 'EM_CURATORIA' THEN 'AGUARDANDO_REUNIAO' ELSE curation_status END,
                 updated_at = NOW()
             WHERE id = $3`,
            [dateVal, timeVal, candidateUser.id]
          );
        } catch (syncErr) {
          console.warn('[send-interview-invite] Sync user interview fields warning:', syncErr);
        }
      }
    }

    if (!interview) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 });
    }

    const toEmail = interview.email || interview.user_email;
    if (!toEmail) {
      return NextResponse.json(
        { error: 'No email address found for this candidate' },
        { status: 422 }
      );
    }

    const candidateName =
      interview.artistic_name ||
      interview.p_artistic_name ||
      interview.full_name ||
      interview.user_full_name ||
      'Candidate';

    let dateDisplay = interview.interview_date || interview.u_interview_date || interviewDateParam;
    if (dateDisplay instanceof Date) {
      dateDisplay = dateDisplay.toISOString().split('T')[0];
    } else if (typeof dateDisplay === 'string' && dateDisplay.includes('T')) {
      dateDisplay = dateDisplay.split('T')[0];
    } else if (!dateDisplay) {
      dateDisplay = new Date().toISOString().split('T')[0];
    }

    const timeDisplay = interview.interview_time || interview.u_interview_time || interviewTimeParam || '14:00';

    // 3. Disparo do e-mail com template em inglês
    const emailResult = await EmailService.sendInterviewInvite({
      to: toEmail,
      toEmail,
      candidateName,
      interviewDate: String(dateDisplay),
      interviewTime: String(timeDisplay),
      meetUrl: finalMeetLink,
      meetLink: finalMeetLink,
    });

    // 4. Registro no Audit Log imutável
    try {
      await AuditLogService.logAction({
        userId: session.id,
        userName: session.name || 'Admin Curadoria',
        userEmail: session.email || 'admin@lumiardi.com',
        userRole: 'ADMIN',
        actionType: 'SEND_INTERVIEW_INVITE_EMAIL',
        targetId: interview.user_id || interview.userId || targetId,
        targetName: candidateName,
        targetType: 'MODELO',
        details: {
          interviewId: interview.id,
          meetLink: finalMeetLink,
          sentTo: toEmail,
          interviewDate: String(dateDisplay),
          interviewTime: String(timeDisplay),
          simulated: emailResult.simulated,
          messageId: emailResult.messageId,
        },
      });
    } catch (logErr) {
      console.error('[send-interview-invite] Audit log error (non-fatal):', logErr);
    }

    return NextResponse.json({
      success: true,
      simulated: emailResult.simulated,
      message: emailResult.message,
      sentTo: toEmail,
      candidateName,
      meetLink: finalMeetLink,
      interviewDate: String(dateDisplay),
      interviewTime: String(timeDisplay),
      messageId: emailResult.messageId,
    });
  } catch (error: any) {
    console.error('[send-interview-invite] Falha ao enviar convite:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to send interview invite',
        code: 'send_failed',
      },
      { status: 500 }
    );
  }
}
