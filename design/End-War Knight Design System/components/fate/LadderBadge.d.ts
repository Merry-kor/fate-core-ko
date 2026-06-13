import React from 'react';

export const LADDER: Record<string, string>;
export function ladderLabel(rank: number | string): string;

export interface LadderBadgeProps {
  /** Skill rank, -4 … +8. @default 0 */
  rank?: number;
  /** Show the Korean ladder word (대단함 등). @default true */
  showLabel?: boolean;
  /** @default 'md' */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Renders a Fate ladder rank as "+4 대단함" — gold positive, crimson negative.
 */
export function LadderBadge(props: LadderBadgeProps): JSX.Element;
