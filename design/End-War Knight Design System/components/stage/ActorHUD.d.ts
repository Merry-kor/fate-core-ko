import React from 'react';

export interface ActorHUDProps {
  name: string;
  portrait?: string | null;
  /** Division / role line, e.g. '제1사단 스피어헤드'. */
  division?: string;
  /** Current fate points. @default 3 */
  fatePoints?: number;
  /** Whether this actor is currently on the stage. */
  onStage?: boolean;
  /** Whether this actor currently holds the stage (is speaking). */
  active?: boolean;
  /** Add to / remove from stage. */
  onToggleStage?: () => void;
  /** Give this actor the stage / speaking turn. */
  onSpeak?: () => void;
}

/**
 * Compact HUD control card for one actor: portrait, fate points, stage add/exit + speak.
 * @startingPoint section="Stage" subtitle="Actor HUD control card" viewport="700x110"
 */
export function ActorHUD(props: ActorHUDProps): JSX.Element;
