import { NextRequest, NextResponse } from 'next/server';
import { StorageService } from '@/services/storageService';
import { sanitizeObject } from '@/lib/security';
import { encodeSession, SESSION_COOKIE_NAME, SessionUser, setSessionCookie } from '@/lib/auth';
import { CompleteCreatorProfile } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();
    const sanitizedBody = sanitizeObject(rawBody) as CompleteCreatorProfile;

    // Validações básicas de segurança
    if (!sanitizedBody.basicInfo?.fullName || !sanitizedBody.basicInfo?.email) {
      return NextResponse.json(
        { error: 'Nome completo e e-mail são obrigatórios.' },
        { status: 400 }
      );
    }

    const whatsapp = sanitizedBody.basicInfo?.whatsapp?.trim() || (rawBody as any).whatsapp?.trim();
    if (!whatsapp || whatsapp.replace(/\D/g, '').length < 10) {
      return NextResponse.json(
        { error: 'WhatsApp / Celular com DDD é estritamente obrigatório para agendamento da entrevista de curadoria.' },
        { status: 400 }
      );
    }
    sanitizedBody.basicInfo.whatsapp = whatsapp;

    const appointment = sanitizedBody.appointment;
    if (!appointment?.date || !appointment?.timeSlot) {
      return NextResponse.json(
        { error: 'A seleção de data e horário para a entrevista de curadoria prévia é obrigatória.' },
        { status: 400 }
      );
    }

    const planId = (rawBody as any).planId || 'glow';
    const billingInterval = (rawBody as any).billingInterval || 'yearly';

    if (!sanitizedBody.qualitative?.platforms?.instagram?.startsWith('@')) {
      if (sanitizedBody.qualitative?.platforms?.instagram) {
        sanitizedBody.qualitative.platforms.instagram = `@${sanitizedBody.qualitative.platforms.instagram.replace(/^@+/, '')}`;
      }
    }

    if (sanitizedBody.qualitative?.exposureOpinion) {
      sanitizedBody.qualitative.exposureOpinion = sanitizedBody.qualitative.exposureOpinion.slice(0, 50);
    }
    if (sanitizedBody.qualitative?.mainGoal) {
      sanitizedBody.qualitative.mainGoal = sanitizedBody.qualitative.mainGoal.slice(0, 50);
    }

    const savedProfile = await StorageService.saveCreator({
      ...sanitizedBody,
      curationStatus: 'AGUARDANDO_REUNIAO',
      planId,
      billingInterval,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const displayDate = appointment.date.split('-').reverse().join('/');

    try {
      await StorageService.createNotification({
        userId: savedProfile.id,
        title: 'Entrevista de Curadoria Agendada',
        desc: `Sua entrevista de alinhamento com a Mesa de Curadoria foi agendada para ${displayDate} às ${appointment.timeSlot}. Aguarde o contato da nossa equipe via WhatsApp.`,
        category: 'Curadoria',
        type: 'info',
        link: '/dashboard/pendente',
        linkText: 'Ver Detalhes do Agendamento',
      });
    } catch (e) {
      console.warn('Erro ao criar notificação de registro:', e);
    }

    const sessionUser: SessionUser = {
      id: savedProfile.id,
      email: savedProfile.basicInfo.email,
      name: savedProfile.qualitative.artisticName || savedProfile.basicInfo.fullName,
      role: 'criadora',
      curationStatus: 'AGUARDANDO_REUNIAO',
      documentName: savedProfile.basicInfo.document?.fileName,
      category: savedProfile.qualitative.category,
      country: savedProfile.basicInfo.address?.country,
      city: savedProfile.basicInfo.address?.city,
      whatsapp: savedProfile.basicInfo.whatsapp,
      interviewDate: appointment.date,
      interviewTime: appointment.timeSlot,
      planId,
      planBillingInterval: billingInterval,
      createdAt: savedProfile.createdAt,
    };

    const response = NextResponse.json({
      success: true,
      profileId: savedProfile.id,
      user: sessionUser,
      message: 'Candidatura submetida com sucesso. Status: AGUARDANDO_REUNIAO.',
    });

    setSessionCookie(response, sessionUser);

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno ao processar cadastro';
    return NextResponse.json(
      { error: 'Falha no processamento seguro dos dados.', details: message },
      { status: 500 }
    );
  }
}
