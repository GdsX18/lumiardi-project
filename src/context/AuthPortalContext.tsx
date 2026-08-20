'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CompleteCreatorProfile, CompleteAgencyProfile } from '@/types';
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
  notificationsCount: number;
  clearNotifications: () => void;
}

const AuthPortalContext = createContext<AuthPortalContextType | undefined>(undefined);

export const AuthPortalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<UserRole>('criadora');
  const [curationStatus, setCurationStatus] = useState<CurationStatus>('APROVADO');
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [activeCreator, setActiveCreator] = useState<CompleteCreatorProfile | null>(null);
  const [activeAgency, setActiveAgency] = useState<CompleteAgencyProfile | null>(null);
  const [allCreators, setAllCreators] = useState<CompleteCreatorProfile[]>([]);
  const [allAgencies, setAllAgencies] = useState<CompleteAgencyProfile[]>([]);
  const [notificationsCount, setNotificationsCount] = useState<number>(3);

  const refreshData = useCallback(async () => {
    try {
      // 1. Busca usuário da sessão atual via /api/user/me
      const [meRes, creatorsRes, agenciesRes] = await Promise.all([
        fetch('/api/user/me'),
        fetch('/api/creators'),
        fetch('/api/agencies'),
      ]);

      if (meRes.ok) {
        const meData = await meRes.json();
        if (meData.authenticated && meData.user) {
          setCurrentUser(meData.user);
          setRole(meData.user.role);
          setCurationStatus(meData.user.curationStatus);

          if (meData.user.role === 'criadora' && meData.profile) {
            setActiveCreator(meData.profile);
          } else if (meData.user.role === 'agencia' && meData.profile) {
            setActiveAgency(meData.profile);
          }
        }
      }

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
    } catch (e) {
      console.error('Erro ao sincronizar sessão:', e);
    }
  }, []);

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setCurrentUser(null);
      setCurationStatus('EM_CURATORIA');
      window.location.href = '/login';
    } catch (e) {
      console.error('Erro ao deslogar:', e);
      window.location.href = '/login';
    }
  };

  useEffect(() => {
    let isMounted = true;
    const loadInitialSession = async () => {
      try {
        const [meRes, creatorsRes, agenciesRes] = await Promise.all([
          fetch('/api/user/me'),
          fetch('/api/creators'),
          fetch('/api/agencies'),
        ]);

        if (!isMounted) return;

        if (meRes.ok) {
          const meData = await meRes.json();
          if (meData.authenticated && meData.user && isMounted) {
            setCurrentUser(meData.user);
            setRole(meData.user.role);
            setCurationStatus(meData.user.curationStatus);

            if (meData.user.role === 'criadora' && meData.profile) {
              setActiveCreator(meData.profile);
            } else if (meData.user.role === 'agencia' && meData.profile) {
              setActiveAgency(meData.profile);
            }
          }
        }

        if (creatorsRes.ok && isMounted) {
          const cData = await creatorsRes.json();
          if (Array.isArray(cData.creators) && isMounted) {
            setAllCreators(cData.creators);
          }
        }

        if (agenciesRes.ok && isMounted) {
          const aData = await agenciesRes.json();
          if (Array.isArray(aData.agencies) && isMounted) {
            setAllAgencies(aData.agencies);
          }
        }
      } catch (e) {
        console.error('Erro ao carregar sessão inicial:', e);
      }
    };

    loadInitialSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const clearNotifications = () => setNotificationsCount(0);

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
        notificationsCount,
        clearNotifications,
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
