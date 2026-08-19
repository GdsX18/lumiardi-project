'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Camera,
  Kanban,
  HardDrive,
  MessageSquare,
  Building2,
  Users,
} from 'lucide-react';
import { useAuthPortal } from '@/context/AuthPortalContext';
import { useLanguage } from '@/context/LanguageContext';
import { cn } from '@/lib/utils';

export const MobileBottomNav: React.FC = () => {
  const pathname = usePathname();
  const { role } = useAuthPortal();
  const { t } = useLanguage();
  const isCriadora = role === 'criadora';

  const criadoraItems = [
    { href: '/dashboard', label: t('dash_nav_home') || 'Início', icon: LayoutDashboard },
    { href: '/dashboard/book', label: t('dash_nav_book_short') || 'Book', icon: Camera },
    { href: '/dashboard/kanban', label: t('dash_nav_projects_short') || 'Projetos', icon: Kanban },
    { href: '/dashboard/drive', label: t('dash_nav_drive_short') || 'Drive', icon: HardDrive },
    { href: '/dashboard/chat', label: t('dash_nav_chat_short') || 'Chat', icon: MessageSquare },
  ];

  const agenciaItems = [
    { href: '/dashboard', label: t('dash_nav_home') || 'Painel', icon: LayoutDashboard },
    { href: '/dashboard/agencias', label: t('dash_nav_scout_short') || 'Scout', icon: Building2 },
    { href: '/dashboard/kanban', label: t('dash_nav_projects_short') || 'Projetos', icon: Kanban },
    { href: '/dashboard/drive', label: t('dash_nav_drive_short') || 'Drive', icon: HardDrive },
    { href: '/dashboard/chat', label: t('dash_nav_chat_short') || 'Chat', icon: MessageSquare },
  ];

  const items = isCriadora ? criadoraItems : agenciaItems;

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#080808]/95 backdrop-blur-lg border-t border-white/[0.08] px-2 py-1.5 flex items-center justify-around shadow-2xl safe-area-bottom">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive =
          pathname === item.href ||
          (item.href === '/dashboard' &&
            (pathname === '/dashboard' || pathname === '/dashboard/criadora' || pathname === '/dashboard/agencia'));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center justify-center py-1 px-2.5 rounded-xs transition-all duration-200 min-w-[56px] cursor-pointer',
              isActive
                ? 'text-gold'
                : 'text-ivory/50 hover:text-ivory/80 active:scale-95'
            )}
          >
            <div className={cn('relative p-1 rounded-xs transition-colors', isActive && 'bg-gold/10')}>
              <Icon className={cn('w-5 h-5 transition-transform', isActive && 'scale-105 text-gold')} />
              {isActive && (
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
              )}
            </div>
            <span className={cn('text-[10px] font-sans tracking-tight mt-0.5', isActive ? 'font-semibold text-gold' : 'font-normal')}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
};
