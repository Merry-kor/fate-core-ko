import React from 'react';

export interface AspectChipProps {
  /** The aspect text (면모). Rendered italic serif. */
  label: string;
  /** Aspect taxonomy → accent colour. @default 'general' */
  type?: 'identity' | 'trouble' | 'general' | 'situation' | 'longterm' | 'stack';
  /** Story-board tag, e.g. '#단기' or '#장기'. */
  tag?: string | null;
  /** Free-invoke count → gold pips (공짜 발현). @default 0 */
  invokes?: number;
  /** Stack progress for 스택 상황 면모, e.g. { filled: 1, total: 3 }. */
  stack?: { filled: number; total: number } | null;
  onInvoke?: () => void;
  /** Trailing action nodes (edit/delete IconButtons). */
  actions?: React.ReactNode;
}

/**
 * A 면모 (aspect) chip — italic serif text, type accent bar, invoke pips, stack counter.
 * @startingPoint section="Fate" subtitle="Aspect chip with type accent + invoke pips" viewport="700x120"
 */
export function AspectChip(props: AspectChipProps): JSX.Element;
