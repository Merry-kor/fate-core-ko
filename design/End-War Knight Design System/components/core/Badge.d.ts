import React from 'react';

export interface BadgeProps {
  children?: React.ReactNode;
  /** Color intent. @default 'steel' */
  tone?: 'gold' | 'crimson' | 'steel' | 'success' | 'tie' | 'fail' | 'violet' | 'teal' | 'blue';
  /** Fill style. @default 'soft' */
  variant?: 'solid' | 'soft' | 'outline';
  /** @default 'md' */
  size?: 'sm' | 'md' | 'lg';
  /** Uppercase + label letter-spacing. */
  uppercase?: boolean;
}

/**
 * Pill badge / tag for divisions, aspect-type markers (#단기/#장기) and counts.
 */
export function Badge(props: BadgeProps): JSX.Element;
