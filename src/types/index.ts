/**
 * Definições globais de tipos TypeScript para a aplicação.
 */

export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface AnimationProps extends BaseComponentProps {
  delay?: number;
  duration?: number;
}
