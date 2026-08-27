import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookie } from '@/lib/auth';
import { StorageService } from '@/services/storageService';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromCookie();
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

    let notifications = await StorageService.listNotifications(session.id);

    // Se o usuário não tiver notificações ainda, criar as notificações contextuais de boas-vindas
    if (notifications.length === 0) {
      const isApproved = String(session.curationStatus).toUpperCase() === 'APROVADO' || String(session.curationStatus).toLowerCase() === 'approved';
      const isCriadora = session.role === 'criadora';

      if (isCriadora) {
        await StorageService.createNotification({
          userId: session.id,
          title: isApproved ? 'Credencial Aprovada' : 'Curadoria em Andamento',
          desc: isApproved
            ? 'Sua conta foi homologada com sucesso sob o protocolo 18 U.S.C. § 2257. Todos os recursos estão liberados.'
            : 'Sua solicitação está sendo avaliada pela mesa de curadoria e compliance.',
          category: 'Curadoria',
          type: isApproved ? 'success' : 'info',
          link: isApproved ? '/dashboard/book' : '/dashboard/pendente',
          linkText: isApproved ? 'Ver Meu Book' : 'Ver Status',
        });
        await StorageService.createNotification({
          userId: session.id,
          title: 'Portfólio & Book Digital',
          desc: 'Mantenha suas fotos em alta resolução atualizadas para atrair agências internacionais parceiras.',
          category: 'Talentos',
          type: 'info',
          link: '/dashboard/book',
          linkText: 'Gerenciar Book',
        });
        await StorageService.createNotification({
          userId: session.id,
          title: 'Criptografia Militar E2E',
          desc: 'Todas as mensagens no Chat e arquivos no Drive Lumiardi são protegidos por AES-256 e SHA-512.',
          category: 'Segurança',
          type: 'info',
          link: '/dashboard/drive',
          linkText: 'Acessar Drive',
        });
      } else {
        await StorageService.createNotification({
          userId: session.id,
          title: isApproved ? 'Credencial Agência Aprovada' : 'Curadoria de Agência',
          desc: isApproved
            ? 'Sua agência foi homologada pela Mesa de Curadoria Lumiardi com sucesso.'
            : 'A documentação corporativa da sua agência está sob auditoria.',
          category: 'Curadoria',
          type: isApproved ? 'success' : 'info',
          link: '/dashboard/agencias',
          linkText: 'Ver Agência',
        });
        await StorageService.createNotification({
          userId: session.id,
          title: 'Catálogo de Talentos Atualizado',
          desc: 'Novas criadoras de elite foram aprovadas e estão disponíveis para contratação.',
          category: 'Scout',
          type: 'info',
          link: '/dashboard/agencias',
          linkText: 'Explorar Roster',
        });
      }

      notifications = await StorageService.listNotifications(session.id);
    }

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (error: any) {
    console.error('Erro ao buscar notificações:', error);
    return NextResponse.json({ error: 'Erro ao buscar notificações' }, { status: 500 });
  }
}
