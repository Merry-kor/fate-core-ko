import React from 'react';

export interface SkillRungProps {
  name: string;
  /** Ladder rank, -4 … +8. @default 0 */
  rank?: number;
  /** Roll handler — renders a 4dF roll button when present. */
  onRoll?: () => void;
  actions?: React.ReactNode;
}

/**
 * One rung of the skill ladder (기능): rank badge + name + roll action.
 */
export function SkillRung(props: SkillRungProps): JSX.Element;
