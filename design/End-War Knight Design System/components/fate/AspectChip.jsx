import React from 'react';

/**
 * AspectChip — a 면모. The narrative atom of Fate.
 * type: identity 정체성 | trouble 고민 | general 일반
 *       situation 상황 | longterm 장기 | stack 스택
 * A left accent bar carries the type colour; italic serif text;
 * optional invoke pips (free-invoke / 발현 횟수) and a #단기/#장기 tag.
 */
export function AspectChip({
  label = '',
  type = 'general',
  tag = null,           // '#단기' | '#장기' | null
  invokes = 0,          // free-invoke count → gold pips
  stack = null,         // { filled, total } for 스택 상황 면모
  onInvoke,
  actions = null,
}) {
  const accents = {
    identity: 'var(--ewk-aspect-identity)',
    trouble: 'var(--ewk-aspect-trouble)',
    general: 'var(--ewk-aspect-general)',
    situation: 'var(--ewk-aspect-situation)',
    longterm: 'var(--ewk-aspect-longterm)',
    stack: 'var(--ewk-aspect-stack)',
  };
  const labels = {
    identity: '정체성', trouble: '고민', general: '일반',
    situation: '상황', longterm: '장기', stack: '스택',
  };
  const accent = accents[type] || accents.general;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--sp-2)',
      background: 'var(--surface-card)',
      border: '1px solid var(--border-strong)',
      borderLeft: `var(--bw-heavy) solid ${accent}`,
      borderRadius: 'var(--radius-sm)',
      padding: '6px 9px 6px 11px',
      minHeight: 36,
    }}>
      <span style={{
        fontFamily: 'var(--font-sans)',
        fontSize: 'var(--fs-2xs)',
        fontWeight: 'var(--fw-bold)',
        letterSpacing: 'var(--ls-wide)',
        color: accent,
        flexShrink: 0,
        width: 30,
      }}>{labels[type]}</span>

      <span style={{
        flex: 1,
        fontFamily: 'var(--font-serif)',
        fontStyle: 'italic',
        fontSize: 'var(--fs-base)',
        color: 'var(--text-strong)',
        lineHeight: 'var(--lh-snug)',
      }}>
        {label}
        {tag && (
          <span style={{
            fontFamily: 'var(--font-sans)',
            fontStyle: 'normal',
            fontSize: 'var(--fs-2xs)',
            fontWeight: 'var(--fw-semibold)',
            color: type === 'longterm' ? 'var(--ewk-aspect-longterm)' : 'var(--text-faint)',
            marginLeft: 6,
          }}>{tag}</span>
        )}
      </span>

      {stack && (
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--fs-xs)',
          fontWeight: 'var(--fw-bold)',
          color: 'var(--ewk-aspect-stack)',
          background: 'color-mix(in srgb, var(--ewk-aspect-stack) 14%, transparent)',
          border: '1px solid color-mix(in srgb, var(--ewk-aspect-stack) 32%, transparent)',
          borderRadius: 'var(--radius-pill)',
          padding: '1px 8px',
          fontVariantNumeric: 'tabular-nums',
        }}>{stack.filled}/{stack.total}</span>
      )}

      {invokes > 0 && (
        <button
          type="button"
          onClick={onInvoke}
          title="발현"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 3,
            background: 'transparent',
            border: 'none',
            cursor: onInvoke ? 'pointer' : 'default',
            padding: '2px 4px',
          }}
        >
          {Array.from({ length: invokes }).map((_, i) => (
            <span key={i} style={{
              width: 9, height: 9, borderRadius: '50%',
              background: 'var(--ewk-gold-500)',
              boxShadow: '0 0 6px var(--ewk-gold-glow)',
            }} />
          ))}
        </button>
      )}

      {actions}
    </div>
  );
}
