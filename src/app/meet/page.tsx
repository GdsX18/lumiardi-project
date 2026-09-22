'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function MeetRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const room = searchParams.get('room');

  useEffect(() => {
    if (room) {
      router.replace(`/dashboard/meet?room=${encodeURIComponent(room)}`);
    } else {
      router.replace('/dashboard/meet');
    }
  }, [router, room]);

  return (
    <div className="min-h-screen bg-[#070707] text-gold flex items-center justify-center font-mono text-sm">
      Conectando ao Lumiardi Meet...
    </div>
  );
}

export default function MeetRedirectPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#070707]" />}>
      <MeetRedirectContent />
    </Suspense>
  );
}
