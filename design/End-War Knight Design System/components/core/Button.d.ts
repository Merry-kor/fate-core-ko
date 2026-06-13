import React from 'react';

export interface ButtonProps {
  children?: React.ReactNode;
  /** Visual intent. @default 'gold' */
  variant?: 'gold' | 'crimson' | 'steel' | 'ghost';
  /** @default 'md' */
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  /** Optional leading icon node (icon font <i> or svg). */
  icon?: React.ReactNode;
  /** Full-width block button. */
  block?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
}

/**
 * Primary action button for the End-War Knight UI.
 * @startingPoint section="Core" subtitle="Imperial action button — gold/crimson/ghost" viewport="700x120"
 */
export function Button(props: ButtonProps): JSX.Element;
