import React from 'react';

/**
 * FatePoints — 운명점 tracker with a refresh value (재충전).
 * The empire's currency of narrative agency.
 */
export function FatePoints({ current = 3, refresh = 3, onAdjust }) {
  const Step = ({ delta, children }) => (
    <button
      type="button"
      onClick={onAdjust ? () => onAdjust(delta) : undefined}
      style={{
        width: 26, height: 26,
        borderRadius: '50%',
        border: '1px solid var(--ewk-gold-600)',
        background: 'transparent',
        color: 'var(--ewk-gold-400)',
        cursor: onAdjust ? 'pointer' : 'default',
        fontSize: 'var(--fs-md)',
        lineHeight: 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background var(--dur-fast), color var(--dur-fast)',
      }}
      onMouseEnter={(e) => { if (onAdjust) { e.currentTarget.style.background = 'var(--ewk-gold-500)'; e.currentTarget.style.color = 'var(--ewk-ink-900)'; } }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--ewk-gold-400)'; }}
    >{children}</button>
  );

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-5)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
        <span style={{
          fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-2xs)',
          fontWeight: 'var(--fw-semibold)', letterSpacing: 'var(--ls-label)',
          textTransform: 'uppercase', color: 'var(--text-muted)',
        }}>운명점</span>
        <Step delta={-1}>−</Step>
        <span style={{
          minWidth: 40, textAlign: 'center',
          fontFamily: 'var(--font-serif)', fontWeight: 'var(--fw-black)',
          fontSize: 'var(--fs-xl)', color: 'var(--ewk-gold-300)',
          fontVariantNumeric: 'tabular-nums',
          textShadow: '0 0 14px var(--ewk-gold-glow)',
        }}>{current}</span>
        <Step delta={1}>+</Step>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
        <span style={{
          fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-2xs)',
          fontWeight: 'var(--fw-semibold)', letterSpacing: 'var(--ls-label)',
          textTransform: 'uppercase', color: 'var(--text-muted)',
        }}>재충전</span>
        <span style={{
          fontFamily: 'var(--font-serif)', fontWeight: 'var(--fw-bold)',
          fontSize: 'var(--fs-lg)', color: 'var(--text-body)',
          fontVariantNumeric: 'tabular-nums',
        }}>{refresh}</span>
      </div>
    </div>
  );
}
