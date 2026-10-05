'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { useOpenedOnce } from '@/lib/useOpenedOnce';

// Os modais (e o framer-motion que usam) só são baixados na primeira abertura.
const CreatorBenefitsModal = dynamic(
  () => import('./CreatorBenefitsModal').then((m) => ({ default: m.CreatorBenefitsModal })),
  { ssr: false }
);
const AgencyBenefitsModal = dynamic(
  () => import('./AgencyBenefitsModal').then((m) => ({ default: m.AgencyBenefitsModal })),
  { ssr: false }
);

type CreatorProps = React.ComponentProps<typeof CreatorBenefitsModal>;
type AgencyProps = React.ComponentProps<typeof AgencyBenefitsModal>;

export const LazyCreatorBenefitsModal: React.FC<CreatorProps> = (props) => {
  const opened = useOpenedOnce(props.open);
  return opened ? <CreatorBenefitsModal {...props} /> : null;
};

export const LazyAgencyBenefitsModal: React.FC<AgencyProps> = (props) => {
  const opened = useOpenedOnce(props.open);
  return opened ? <AgencyBenefitsModal {...props} /> : null;
};
