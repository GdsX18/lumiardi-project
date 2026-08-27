'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Camera,
  Building2,
  Kanban,
  HardDrive,
  MessageSquare,
  Video,
  ShieldCheck,
  Users,
  Search,
  LucideIcon,
  LogOut,
  CreditCard,
} from 'lucide-react';
import { useAuthPortal } from '@/context/AuthPortalContext';
import { useLanguage } from '@/context/LanguageContext';
import { cn } from '@/lib/utils';

export interface NavItem {
  id: string;
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
}

export interface DashboardSidebarProps {
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
  className?: string;
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  activeTab,
  setActiveTab,
  className,
}) => {
  const { role, activeCreator, activeAgency, curationStatus, currentUser, logout } = useAuthPortal();
  const { t } = useLanguage();
  const pathname = usePathname();

  const isCriadora = role === 'criadora';
  const isApproved = curationStatus === 'APROVADO' || curationStatus === 'approved';

  const displayName =
    currentUser?.name ||
    (isCriadora
      ? activeCreator?.qualitative?.artisticName || 'Sua Conta Modelo'
      : activeAgency?.basicInfo?.responsibleName || 'Sua Agência');
  const initials = displayName.substring(0, 2).toUpperCase();

  const criadoraNavItems: NavItem[] = [
    { id: 'overview', href: '/dashboard', label: t('dash_nav_overview') || 'Visão Geral & Saldo', icon: LayoutDashboard },
    { id: 'billing', href: '/dashboard/billing', label: t('dash_nav_billing') || 'Faturamento & VIP', icon: CreditCard, badge: 'NOVO' },
    { id: 'book', href: '/dashboard/book', label: t('dash_nav_book') || 'Book & Ficha Técnica', icon: Camera },
    { id: 'agencias', href: '/dashboard/agencias', label: t('dash_nav_agencies') || 'Rede de Agências', icon: Building2 },
    { id: 'kanban', href: '/dashboard/kanban', label: t('dash_nav_kanban') || 'Quadro de Projetos', icon: Kanban },
    { id: 'drive', href: '/dashboard/drive', label: t('dash_nav_drive') || 'Lumiardi Drive', icon: HardDrive },
    { id: 'chat', href: '/dashboard/chat', label: t('dash_nav_chat') || 'Mensagens & Chat', icon: MessageSquare },
    { id: 'meet', href: '/dashboard/meet', label: t('dash_nav_meet') || 'Lumiardi Meet', icon: Video },
  ];

  const agenciaNavItems: NavItem[] = [
    { id: 'overview', href: '/dashboard', label: t('dash_nav_overview') || 'Painel Executivo', icon: LayoutDashboard },
    { id: 'billing', href: '/dashboard/billing', label: t('dash_nav_billing') || 'Faturamento & Cotas', icon: CreditCard, badge: 'PRO' },
    { id: 'scout', href: '/dashboard/agencias', label: t('dash_nav_scout') || 'Talent Scout (Filtros)', icon: Search },
    { id: 'roster', href: '/dashboard/book', label: t('dash_nav_roster') || 'Gestão de Agenciadas', icon: Users },
    { id: 'kanban', href: '/dashboard/kanban', label: t('dash_nav_kanban') || 'Kanban de Campanhas', icon: Kanban },
    { id: 'drive', href: '/dashboard/drive', label: t('dash_nav_drive') || 'Drive Compartilhado', icon: HardDrive },
    { id: 'chat', href: '/dashboard/chat', label: t('dash_nav_chat') || 'Mensagens & Chat', icon: MessageSquare },
    { id: 'meet', href: '/dashboard/meet', label: t('dash_nav_meet') || 'Lumiardi Meet', icon: Video },
  ];

  const navItems = isCriadora ? criadoraNavItems : agenciaNavItems;

  return (
    <aside
      className={cn(
        'w-64 md:w-72 bg-[#090909] border-r border-white/[0.08] flex flex-col justify-between p-4 shrink-0 h-[calc(100vh-4rem)] lg:h-[calc(100vh-4.5rem)] sticky top-16 lg:top-[72px] overflow-y-auto scrollbar-thin scrollbar-thumb-gold/20',
        className
      )}
    >
      <div className="space-y-6">
        {/* Card do Usuário / Agência Conectada */}
        <div className="p-3.5 bg-[#121212] border border-white/[0.08] relative overflow-hidden rounded-sm">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gold/5 rounded-full blur-xl pointer-events-none" />

          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-gold/10 border border-gold/40 text-gold flex items-center justify-center font-serif-lumiardi font-bold text-xs rounded-sm shrink-0">
              {initials}
            </div>
            <div className="overflow-hidden min-w-0">
              <h3 className="font-serif-lumiardi text-sm font-medium text-ivory truncate">
                {displayName}
              </h3>
              <span className="text-[10px] font-sans text-ivory/50 uppercase tracking-widest block truncate">
                {isCriadora ? (t('login_role_creator') || 'Modelo / Criadora VIP') : (t('login_role_agency') || 'Agência Credenciada')}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-sans">
            <span className="text-bronze font-medium tracking-wider uppercase">{t('dash_status') || 'Status'}:</span>
            <span className="text-emerald-400 flex items-center gap-1 font-medium">
              <ShieldCheck className="w-3 h-3" />
              {isApproved ? (t('header_verified') || 'Verificado') : (t('header_in_review') || 'Em Análise')}
            </span>
          </div>
        </div>

        {/* Menu de Navegação em Rotas Dedicadas */}
        <div>
          <span className="text-[10px] font-sans uppercase tracking-[0.25em] text-ivory/40 font-semibold px-3 mb-2 block">
            {t('dash_system_modules') || 'Módulos do Sistema'}
          </span>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isCurrentRoute =
                pathname === item.href ||
                (item.href === '/dashboard' &&
                  (pathname === '/dashboard' || pathname === '/dashboard/criadora' || pathname === '/dashboard/agencia'));

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => {
                    if (setActiveTab) setActiveTab(item.id);
                  }}
                  className={cn(
                    'w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-sans font-medium transition-all group relative cursor-pointer rounded-sm',
                    isCurrentRoute
                      ? 'bg-gold/15 text-gold border-r-2 border-gold font-semibold'
                      : 'text-ivory/70 hover:text-ivory hover:bg-white/[0.04]'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={cn(
                        'w-4 h-4 transition-colors',
                        isCurrentRoute ? 'text-gold' : 'text-ivory/50 group-hover:text-gold'
                      )}
                    />
                    <span className="tracking-wider">{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={cn(
                        'text-[9px] px-1.5 py-0.5 uppercase tracking-widest font-semibold rounded-xs',
                        isCurrentRoute ? 'bg-gold text-black-matte' : 'bg-[#181818] text-gold border border-gold/30'
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Rodapé da Sidebar: Botão de Logout elegante */}
      <div className="pt-4 border-t border-white/[0.08] mt-4">
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-sans text-ivory/50 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all rounded-sm cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>{t('dash_nav_logout') || 'Encerrar Sessão'}</span>
        </button>
      </div>
    </aside>
  );
};
