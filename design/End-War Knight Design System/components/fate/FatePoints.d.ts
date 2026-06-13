import React from 'react';

export interface FatePointsProps {
  /** Current fate points (운명점). @default 3 */
  current?: number;
  /** Refresh value (재충전). @default 3 */
  refresh?: number;
  /** Stepper handler (delta: +1 | -1) — omit for read-only. */
  onAdjust?: (delta: number) => void;
}

/**
 * 운명점 tracker with refresh; gold glowing current value.
 * @startingPoint section="Fate" subtitle="Fate point + refresh tracker" viewport="700x100"
 */
export function FatePoints(props: FatePointsProps): JSX.Element;
