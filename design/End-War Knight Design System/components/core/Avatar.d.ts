import React from 'react';

export interface AvatarProps {
  /** Portrait image URL. Falls back to initials when absent. */
  src?: string;
  name?: string;
  /** Pixel size (square). @default 56 */
  size?: number;
  /** @default 'circle' */
  shape?: 'circle' | 'frame';
  /** Frame ring. 'active' = gold glow for the on-stage speaker. @default 'none' */
  ring?: 'none' | 'gold' | 'crimson' | 'active';
  /** Optional corner badge (count / status). */
  badge?: React.ReactNode;
}

/**
 * Knight portrait in an imperial frame; the `active` ring marks the current stage speaker.
 * @startingPoint section="Core" subtitle="Portrait frame with active-speaker ring" viewport="700x120"
 */
export function Avatar(props: AvatarProps): JSX.Element;
