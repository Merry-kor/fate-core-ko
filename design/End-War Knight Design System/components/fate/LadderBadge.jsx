import React from 'react';

/** Fate ladder labels, Korean (페이트 코어 한국어판). */
export const LADDER = {
  8: '전설적', 7: '영웅적', 6: '환상적', 5: '엄청남', 4: '대단함',
  3: '우수', 2: '양호', 1: '보통', 0: '미약',
  '-1': '부실', '-2': '엉망', '-3': '재앙적', '-4': '끔찍함',
};

export function ladderLabel(rank) {
  return LADDER[rank] ?? LADDER[String(rank)] ?? '';
}

/**
 * LadderBadge — a skill rank rendered as "+N 대단함".
 * Gold for positive ranks, steel for 0, crimson for negative.
 */
export function LadderBadge({ rank = 0, showLabel = true, size = 'md' }) {
  const n = Number(rank);
  const tone = n > 0 ? 'gold' : n < 0 ? 'crimson' : 'steel';
  const colors = {
    gold: ['var(--ewk-gold-300)', 'color-mix(in srgb, var(--ewk-gold-500) 14%, transparent)', 'var(--ewk-gold-600)'],
    steel: ['var(--ewk-steel-200)', 'rgba(255,255,255,0.05)', 'var(--ewk-steel-500)'],
    crimson: ['var(--ewk-crimson-400)', 'color-mix(in srgb, var(--ewk-crimson-600) 14%, transparent)', 'var(--ewk-crimson-700)'],
  }[tone];
  const sizes = {
    sm: { fontSize: 'var(--fs-2xs)', padding: '2px 7px' },
    md: { fontSize: 'var(--fs-xs)', padding: '3px 9px' },
    lg: { fontSize: 'var(--fs-sm)', padding: '4px 11px' },
  }[size];

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      fontFamily: 'var(--font-sans)',
      fontWeight: 'var(--fw-bold)',
      borderRadius: 'var(--radius-sm)',
      color: colors[0],
      background: colors[1],
      border: `1px solid ${colors[2]}`,
      letterSpacing: 'var(--ls-wide)',
      whiteSpace: 'nowrap',
      ...sizes,
    }}>
      <span style={{ fontVariantNumeric: 'tabular-nums' }}>{n >= 0 ? `+${n}` : n}</span>
      {showLabel && <span style={{ fontWeight: 'var(--fw-semibold)', opacity: 0.92 }}>{ladderLabel(rank)}</span>}
    </span>
  );
}
