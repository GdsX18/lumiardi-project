import { cookies } from 'next/headers';
import { decodeSession, SESSION_COOKIE_NAME } from '@/lib/auth';
import { StorageService } from '@/services/storageService';
import BookPageClient from './BookPageClient';

export const dynamic = 'force-dynamic';

export default async function BookPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = decodeSession(sessionCookie);

  let initialProfile = null;
  let initialRole: 'criadora' | 'agencia' | 'admin' = (session?.role as 'criadora' | 'agencia' | 'admin') || 'criadora';

  if (session?.id) {
    try {
      const userRecord = await StorageService.getUserById(session.id);
      if (userRecord?.profile) {
        initialProfile = userRecord.profile;
      }
      if (userRecord?.user?.role) {
        initialRole = userRecord.user.role as 'criadora' | 'agencia' | 'admin';
      }
    } catch (e) {
      console.warn('[BookPage SSR] Erro ao carregar dados do usuário:', e);
    }
  }

  return (
    <BookPageClient
      initialProfile={initialProfile}
      initialRole={initialRole}
    />
  );
}
