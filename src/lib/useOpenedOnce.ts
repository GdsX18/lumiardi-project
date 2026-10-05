import { useState } from 'react';

/**
 * Passa a true na primeira vez que `open` fica true e não volta atrás.
 * Usado para montar sob demanda componentes carregados com next/dynamic
 * (modais, drawers) mantendo-os montados para a animação de saída.
 */
export function useOpenedOnce(open: boolean): boolean {
  const [opened, setOpened] = useState(open);
  if (open && !opened) setOpened(true);
  return opened;
}
