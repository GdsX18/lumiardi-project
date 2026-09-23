'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CompleteCreatorProfile, CompleteAgencyProfile, NotificationItem } from '@/types';
import { SessionUser } from '@/lib/auth';

export type UserRole = 'criadora' | 'agencia' | 'admin';
export type CurationStatus = 'EM_CURATORIA' | 'APROVADO' | 'REJEITADO' | 'under_review' | 'approved' | 'submitted' | 'rejected';

interface AuthPortalContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  curationStatus: CurationStatus;
  setCurationStatus: (status: CurationStatus) => void;
  currentUser: SessionUser | null;
  activeCreator: CompleteCreatorProfile | null;
  activeAgency: CompleteAgencyProfile | null;
  allCreators: CompleteCreatorProfile[];
  allAgencies: CompleteAgencyProfile[];
  refreshData: () => Promise<void>;
  logout: () => Promise<void>;
  notifications: NotificationItem[];
  notificationsCount: number;
  clearNotifications: () => Promise<void>;
  isLoading: boolean;
}

const AuthPortalContext = createContext<AuthPortalContextType | undefined>(undefined);

const CACHE_USER_KEY = 'lumiardi_cached_user';
const CACHE_CREATOR_KEY = 'lumiardi_cached_creator';
const CACHE_AGENCY_KEY = 'lumiardi_cached_agency';

export const AuthPortalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [role, setRole] = useState<UserRole>('criadora');
  const [curationStatus, setCurationStatus] = useState<CurationStatus>('APROVADO');
  
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [activeCreator, setActiveCreator] = useState<CompleteCreatorProfile | null>(null);
  const [activeAgency, setActiveAgency] = useState<CompleteAgencyProfile | null>(null);

  const [allCreators, setAllCreators] = useState<CompleteCreatorProfile[]>([]);
  const [allAgencies, setAllAgencies] = useState<CompleteAgencyProfile[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationsCount, setNotificationsCount] = useState<number>(0);

  const refreshData = useCallback(async () => {
    try {
      // 1. Prioridade: busca usuário da sessão atual via /api/user/me
      const meRes = await fetch('/api/user/me');
      if (meRes.ok) {
        const meData = await meRes.json();
        if (meData.authenticated && meData.user) {
          setCurrentUser(meData.user);
          setRole(meData.user.role);
          setCurationStatus(meData.user.curationStatus);
          try {
            localStorage.setItem(CACHE_USER_KEY, JSON.stringify(meData.user));
          } catch {}

          if (meData.user.role === 'criadora' && meData.profile) {
            setActiveCreator(meData.profile);
            try {
              localStorage.setItem(CACHE_CREATOR_KEY, JSON.stringify(meData.profile));
            } catch {}
          } else if (meData.user.role === 'agencia' && meData.profile) {
            setActiveAgency(meData.profile);
            try {
              localStorage.setItem(CACHE_AGENCY_KEY, JSON.stringify(meData.profile));
            } catch {}
          }
        }
      }

      // 2. Segundo plano: atualiza listas e notificações
      const [creatorsRes, agenciesRes, notifRes] = await Promise.all([
        fetch('/api/creators'),
        fetch('/api/agencies'),
        fetch('/api/notifications'),
      ]);

      if (creatorsRes.ok) {
        const cData = await creatorsRes.json();
        if (Array.isArray(cData.creators)) {
          setAllCreators(cData.creators);
        }
      }

      if (agenciesRes.ok) {
        const aData = await agenciesRes.json();
        if (Array.isArray(aData.agencies)) {
          setAllAgencies(aData.agencies);
        }
      }

      if (notifRes.ok) {
        const nData = await notifRes.json();
        if (nData.notifications) {
          setNotifications(nData.notifications);
          setNotificationsCount(nData.unreadCount ?? nData.notifications.filter((n: any) => !n.isRead).length);
        }
      }
    } catch (e) {
      console.error('Erro ao sincronizar sessão:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setCurrentUser(null);
      setActiveCreator(null);
      setActiveAgency(null);
      setCurationStatus('EM_CURATORIA');
      try {
        localStorage.removeItem(CACHE_USER_KEY);
        localStorage.removeItem(CACHE_CREATOR_KEY);
        localStorage.removeItem(CACHE_AGENCY_KEY);
      } catch {}
      window.location.href = '/login';
    } catch (e) {
      console.error('Erro ao deslogar:', e);
      window.location.href = '/login';
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Restauração imediata do cache local pós-hidratação (SSR-safe)
    try {
      const rawUser = localStorage.getItem(CACHE_USER_KEY);
      if (rawUser && isMounted) {
        const parsed = JSON.parse(rawUser);
        setCurrentUser(parsed);
        if (parsed.role) setRole(parsed.role);
        if (parsed.curationStatus) setCurationStatus(parsed.curationStatus);
      }
      const rawCreator = localStorage.getItem(CACHE_CREATOR_KEY);
      if (rawCreator && isMounted) setActiveCreator(JSON.parse(rawCreator));
      const rawAgency = localStorage.getItem(CACHE_AGENCY_KEY);
      if (rawAgency && isMounted) setActiveAgency(JSON.parse(rawAgency));
    } catch {}

    const loadInitialSession = async () => {
      try {
        // Prioridade 1: /api/user/me
        const meRes = await fetch('/api/user/me');
        if (!isMounted) return;

        if (meRes.ok) {
          const meData = await meRes.json();
          if (meData.authenticated && meData.user && isMounted) {
            setCurrentUser(meData.user);
            setRole(meData.user.role);
            setCurationStatus(meData.user.curationStatus);
            try {
              localStorage.setItem(CACHE_USER_KEY, JSON.stringify(meData.user));
            } catch {}

            if (meData.user.role === 'criadora' && meData.profile) {
              setActiveCreator(meData.profile);
              try {
                localStorage.setItem(CACHE_CREATOR_KEY, JSON.stringify(meData.profile));
              } catch {}
            } else if (meData.user.role === 'agencia' && meData.profile) {
              setActiveAgency(meData.profile);
              try {
                localStorage.setItem(CACHE_AGENCY_KEY, JSON.stringify(meData.profile));
              } catch {}
            }
          }
        }
      } catch (e) {
        console.error('Erro ao carregar sessão inicial:', e);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }

      // Prioridade 2: Carregamento em segundo plano sem bloquear a renderização inicial
      try {
        const [creatorsRes, agenciesRes, notifRes] = await Promise.all([
          fetch('/api/creators'),
          fetch('/api/agencies'),
          fetch('/api/notifications'),
        ]);

        if (!isMounted) return;

        if (creatorsRes.ok) {
          const cData = await creatorsRes.json();
          if (Array.isArray(cData.creators) && isMounted) {
            setAllCreators(cData.creators);
          }
        }

        if (agenciesRes.ok) {
          const aData = await agenciesRes.json();
          if (Array.isArray(aData.agencies) && isMounted) {
            setAllAgencies(aData.agencies);
          }
        }

        if (notifRes.ok && isMounted) {
          const nData = await notifRes.json();
          if (nData.notifications && isMounted) {
            setNotifications(nData.notifications);
            setNotificationsCount(nData.unreadCount ?? nData.notifications.filter((n: any) => !n.isRead).length);
          }
        }
      } catch (e) {
        console.warn('Erro ao sincronizar dados secundários:', e);
      }
    };

    loadInitialSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const clearNotifications = async () => {
    try {
      await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
      });
      setNotificationsCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (e) {
      console.warn('Erro ao marcar notificações:', e);
      setNotificationsCount(0);
    }
  };

  return (
    <AuthPortalContext.Provider
      value={{
        role,
        setRole,
        curationStatus,
        setCurationStatus,
        currentUser,
        activeCreator,
        activeAgency,
        allCreators,
        allAgencies,
        refreshData,
        logout,
        notifications,
        notificationsCount,
        clearNotifications,
        isLoading,
      }}
    >
      {children}
    </AuthPortalContext.Provider>
  );
};

export const useAuthPortal = () => {
  const context = useContext(AuthPortalContext);
  if (!context) {
    throw new Error('useAuthPortal deve ser usado dentro de um AuthPortalProvider');
  }
  return context;
};
