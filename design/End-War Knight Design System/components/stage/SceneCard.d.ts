import React from 'react';

export interface SceneCardProps {
  name: string;
  /** Chapter / act eyebrow, e.g. '제2장'. */
  chapter?: string;
  /** Background thumbnail URL. */
  thumbnail?: string | null;
  /** Whether this scene is live on the stage. */
  active?: boolean;
  onActivate?: () => void;
}

/**
 * A scene thumbnail in the director rail; click to make it the live stage backdrop.
 * @startingPoint section="Stage" subtitle="Scene activation thumbnail" viewport="700x140"
 */
export function SceneCard(props: SceneCardProps): JSX.Element;
