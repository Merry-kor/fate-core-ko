import React from 'react';

/**
 * StuntCard — a 특기 (stunt). Name, summary, and an optional
 * approach/mystery tag (강하게 / 똑똑하게 / 신비). House rule:
 * 초극자 & 마법사 stunts encode their personal 신비.
 */
export function StuntCard({ name = '', summary = '', approach = null, mystery = false, actions = null }) {
  return (
    <div style={{
      background: 'var(--surface-card)',
      border: '1px solid var(--border-strong)',
      borderRadius: 'var(--radius-sm)',
      borderTop: `2px solid ${mystery ? 'var(--ewk-aspect-longterm)' : 'var(--ewk-gold-600)'}`,
      padding: '9px 11px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', marginBottom: summary ? 5 : 0 }}>
        <span style={{
          flex: 1,
          fontFamily: 'var(--font-sans)',
          fontSize: 'var(--fs-base)',
          fontWeight: 'var(--fw-bold)',
          color: 'var(--text-strong)',
        }}>{name}</span>
        {approach && (
          <span style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'var(--fs-2xs)',
            fontWeight: 'var(--fw-semibold)',
            letterSpacing: 'var(--ls-wide)',
            color: mystery ? 'var(--ewk-aspect-longterm)' : 'var(--ewk-gold-400)',
            background: mystery
              ? 'color-mix(in srgb, var(--ewk-aspect-longterm) 14%, transparent)'
              : 'color-mix(in srgb, var(--ewk-gold-500) 14%, transparent)',
            border: `1px solid ${mystery ? 'color-mix(in srgb, var(--ewk-aspect-longterm) 32%, transparent)' : 'var(--ewk-gold-600)'}`,
            borderRadius: 'var(--radius-pill)',
            padding: '1px 9px',
          }}>{mystery ? '신비 · ' : ''}{approach}</span>
        )}
        {actions}
      </div>
      {summary && (
        <p style={{
          margin: 0,
          fontFamily: 'var(--font-sans)',
          fontSize: 'var(--fs-sm)',
          lineHeight: 'var(--lh-normal)',
          color: 'var(--text-muted)',
        }}>{summary}</p>
      )}
    </div>
  );
}
