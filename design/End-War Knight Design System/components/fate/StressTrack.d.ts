import React from 'react';

export interface StressTrackProps {
  /** Track name, e.g. '스트레스'. @default '스트레스' */
  label?: string;
  /** Number of boxes. @default 4 */
  size?: number;
  /** Per-box checked state. */
  checked?: boolean[];
  /** Toggle handler (index) — omit for read-only. */
  onToggle?: (index: number) => void;
  actions?: React.ReactNode;
}

/**
 * A numbered stress box row (스트레스). Crimson fills on check.
 */
export function StressTrack(props: StressTrackProps): JSX.Element;
