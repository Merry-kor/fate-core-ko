import React from 'react';

export interface IconButtonProps {
  children?: React.ReactNode;
  /** Hover tint. @default 'steel' */
  tone?: 'steel' | 'gold' | 'crimson';
  /** @default 'md' */
  size?: 'sm' | 'md' | 'lg';
  title?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

/**
 * Compact icon control for list-row actions (roll / edit / delete).
 */
export function IconButton(props: IconButtonProps): JSX.Element;
