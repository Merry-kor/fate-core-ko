import React from 'react';

export interface StuntCardProps {
  name: string;
  /** What the stunt does. */
  summary?: string;
  /** Approach/keyword tag, e.g. '강하게' or '똑똑하게'. */
  approach?: string | null;
  /** Mark as a personal-mystery (신비) stunt → violet accent. */
  mystery?: boolean;
  actions?: React.ReactNode;
}

/**
 * A 특기 (stunt) card; `mystery` accents stunts that encode a knight's 신비.
 */
export function StuntCard(props: StuntCardProps): JSX.Element;
