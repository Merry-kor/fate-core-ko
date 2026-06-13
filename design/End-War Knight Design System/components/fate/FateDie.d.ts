import React from 'react';

export interface FateDieProps {
  /** Face: 1 → '+', 0 → blank, -1 → '−'. @default 0 */
  value?: -1 | 0 | 1;
  /** Pixel size — kept modest so it prints naturally. @default 30 */
  size?: number;
}

/**
 * A single Fate/Fudge die face (+ / blank / −).
 */
export function FateDie(props: FateDieProps): JSX.Element;
