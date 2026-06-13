import React from 'react';
import { FateDie } from './FateDie.jsx';
import { ladderLabel } from './LadderBadge.jsx';

/**
 * RollCard — the chat result card for a 4dF roll.
 * Shows the four dice, the skill modifier, the total on the ladder,
 * and an outcome chip (압도적 성공 / 성공 / 동점 / 실패).
 */
export function RollCard({
  actor = '',
  portrait = null,
  skill = '',
  dice = [1, 0, -1, 1],
  modifier = 0,
  difficulty = null,
  action = null, // '기회 만들기' | '극복' | 등
}) {
  const diceSum = dice.reduce((a, b) => a + b, 0);
  const total = diceSum + Number(modifier);

  let outcome = null;
  if (difficulty != null) {
    const diff = total - Number(difficulty);
    if (diff >= 3) outcome = { key: 'style', label: '압도적 성공', color: 'var(--ewk-outcome-style)' };
    else if (diff >= 1) outcome = { key: 'succeed', label: '성공', color: 'var(--ewk-outcome-succeed)' };
    else if (diff === 0) outcome = { key: 'tie', label: '동점', color: 'var(--ewk-outcome-tie)' };
    else outcome = { key: 'fail', label: '실패', color: 'var(--ewk-outcome-fail)' };
  }

  return (
    <div style={{
      background: 'var(--surface-card)',
      border: '1px solid var(--border-strong)',
      borderTop: '2px solid var(--ewk-gold-600)',
      borderRadius: 'var(--radius-md)',
      padding: '12px 14px',
      fontFamily: 'var(--font-sans)',
      boxShadow: 'var(--shadow-sm)',
    }}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', marginBottom: 10 }}>
        {portrait && (
          <img src={portrait} alt={actor} style={{
            width: 28, height: 28, borderRadius: '50%', objectFit: 'cover',
            border: '2px solid var(--ewk-gold-600)',
          }} />
        )}
        <span style={{ fontWeight: 'var(--fw-bold)', color: 'var(--text-strong)', fontSize: 'var(--fs-base)' }}>{actor}</span>
        {action && (
          <span style={{
            fontSize: 'var(--fs-2xs)', fontWeight: 'var(--fw-semibold)',
            color: 'var(--ewk-crimson-400)', letterSpacing: 'var(--ls-wide)',
            background: 'color-mix(in srgb, var(--ewk-crimson-600) 14%, transparent)',
            border: '1px solid var(--ewk-crimson-700)', borderRadius: 'var(--radius-pill)',
            padding: '1px 8px',
          }}>{action}</span>
        )}
        {skill && (
          <span style={{ marginLeft: 'auto',
            fontSize: 'var(--fs-xs)', fontWeight: 'var(--fw-semibold)',
            color: 'var(--ewk-gold-400)',
            background: 'color-mix(in srgb, var(--ewk-gold-500) 12%, transparent)',
            border: '1px solid var(--ewk-gold-600)', borderRadius: 'var(--radius-pill)',
            padding: '2px 9px',
          }}>{skill}</span>
        )}
      </div>

      {/* dice */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
        {dice.map((d, i) => <FateDie key={i} value={d} size={30} />)}
        <span style={{
          fontSize: 'var(--fs-lg)', fontWeight: 'var(--fw-bold)',
          color: 'var(--text-muted)', marginLeft: 4, fontVariantNumeric: 'tabular-nums',
        }}>{modifier >= 0 ? `+${modifier}` : modifier}</span>
      </div>

      {/* result */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--sp-3)' }}>
        <span style={{
          fontFamily: 'var(--font-serif)', fontSize: 'var(--fs-3xl)',
          fontWeight: 'var(--fw-black)', color: 'var(--text-strong)', lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
        }}>{total >= 0 ? `+${total}` : total}</span>
        <span style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: 'var(--fs-md)', color: 'var(--ewk-gold-300)',
        }}>{ladderLabel(Math.max(-4, Math.min(8, total)))}</span>
        {difficulty != null && (
          <span style={{ marginLeft: 'auto', fontSize: 'var(--fs-xs)', color: 'var(--text-faint)' }}>
            목표 {difficulty >= 0 ? `+${difficulty}` : difficulty}
          </span>
        )}
      </div>

      {outcome && (
        <div style={{ marginTop: 9 }}>
          <span style={{
            display: 'inline-block',
            fontSize: 'var(--fs-xs)', fontWeight: 'var(--fw-bold)',
            letterSpacing: 'var(--ls-label)', textTransform: 'uppercase',
            color: outcome.color,
            background: `color-mix(in srgb, ${outcome.color} 14%, transparent)`,
            border: `1px solid color-mix(in srgb, ${outcome.color} 40%, transparent)`,
            borderRadius: 'var(--radius-pill)', padding: '3px 14px',
          }}>{outcome.label}</span>
        </div>
      )}
    </div>
  );
}
