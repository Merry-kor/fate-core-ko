import React from 'react';

export interface RollCardProps {
  /** Roller name. */
  actor: string;
  /** Portrait URL. */
  portrait?: string | null;
  /** Skill/approach used, e.g. '강하게'. */
  skill?: string;
  /** Four Fudge results (-1 | 0 | 1). @default [1,0,-1,1] */
  dice?: Array<-1 | 0 | 1>;
  /** Skill rank added to the dice. @default 0 */
  modifier?: number;
  /** Target number — when set, an outcome chip is computed. */
  difficulty?: number | null;
  /** Action label, e.g. '기회 만들기' or '극복'. */
  action?: string | null;
}

/**
 * Chat roll-result card: 4dF dice, modifier, ladder total, and outcome chip.
 * @startingPoint section="Fate" subtitle="4dF chat roll card with outcome" viewport="700x320"
 */
export function RollCard(props: RollCardProps): JSX.Element;
