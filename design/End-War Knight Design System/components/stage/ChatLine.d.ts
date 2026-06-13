import React from 'react';

export interface ChatLineProps {
  /** @default 'narration' */
  variant?: 'narration' | 'dialogue' | 'narrator' | 'system';
  /** Speaker name (dialogue only). */
  speaker?: string;
  /** Portrait URL (dialogue only). */
  portrait?: string | null;
  /** Optional timestamp. */
  time?: string | null;
  /** Speaker accent colour (dialogue/narrator). @default gold */
  accent?: string;
  children?: React.ReactNode;
}

/**
 * One line of the novel-style chat log — narration prose, character dialogue,
 * narrator voice, or a mechanical system note. Serif, generous leading.
 * @startingPoint section="Stage" subtitle="Novel-style chat line" viewport="700x200"
 */
export function ChatLine(props: ChatLineProps): JSX.Element;
