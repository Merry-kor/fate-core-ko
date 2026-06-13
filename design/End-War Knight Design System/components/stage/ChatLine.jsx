import React from 'react';

/**
 * ChatLine — one line of the novel-style play log.
 * variant:
 *   'narration' — GM scene prose (no speaker, serif block)
 *   'dialogue'  — a character speaks (portrait + name + quote)
 *   'narrator'  — 나레이터 voice (italic, no portrait)
 *   'system'    — mechanical note (키워드 획득, 면모 추가 …)
 * Designed to read like a printed novel: serif body, generous
 * leading, restrained chrome.
 */
export function ChatLine({
  variant = 'narration',
  speaker = '',
  portrait = null,
  time = null,
  accent = 'var(--ewk-gold-500)',
  children,
}) {
  if (variant === 'system') {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 'var(--sp-2)',
        margin: '10px 0', padding: '6px 12px',
        borderLeft: '2px solid var(--ewk-gold-600)',
        background: 'rgba(201,162,39,0.06)',
        fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-sm)',
        color: 'var(--ewk-gold-300)', letterSpacing: 'var(--ls-wide)',
      }}>
        <i className="fa fa-feather" style={{ opacity: 0.7 }} />
        <span>{children}</span>
      </div>
    );
  }

  if (variant === 'narration') {
    return (
      <p style={{
        margin: '14px 0',
        fontFamily: 'var(--font-serif)',
        fontSize: 'var(--fs-prose)',
        lineHeight: 'var(--lh-prose)',
        color: 'var(--ewk-steel-100)',
        textIndent: '1.1em',
        textWrap: 'pretty',
      }}>{children}</p>
    );
  }

  if (variant === 'narrator') {
    return (
      <p style={{
        margin: '14px 0 14px 1.6em',
        fontFamily: 'var(--font-serif)',
        fontStyle: 'italic',
        fontSize: 'var(--fs-prose)',
        lineHeight: 'var(--lh-prose)',
        color: 'var(--ewk-steel-200)',
        borderLeft: '2px solid var(--border-hairline)',
        paddingLeft: '1em',
        textWrap: 'pretty',
      }}>{children}</p>
    );
  }

  // dialogue
  return (
    <div style={{ display: 'flex', gap: 'var(--sp-3)', margin: '16px 0' }}>
      <div style={{ flexShrink: 0, paddingTop: 2 }}>
        {portrait ? (
          <img src={portrait} alt={speaker} style={{
            width: 40, height: 40, borderRadius: '50%', objectFit: 'cover',
            border: `2px solid ${accent}`,
          }} />
        ) : (
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            border: `2px solid ${accent}`, background: 'var(--ewk-ink-650)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-serif)', fontWeight: 'var(--fw-bold)',
            color: 'var(--text-muted)', fontSize: 'var(--fs-base)',
          }}>{speaker.slice(0, 1)}</div>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--sp-2)', marginBottom: 3 }}>
          <span style={{
            fontFamily: 'var(--font-sans)', fontWeight: 'var(--fw-bold)',
            fontSize: 'var(--fs-speaker)', color: accent, letterSpacing: 'var(--ls-wide)',
          }}>{speaker}</span>
          {time && <span style={{ fontSize: 'var(--fs-2xs)', color: 'var(--text-faint)' }}>{time}</span>}
        </div>
        <div style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 'var(--fs-prose)',
          lineHeight: 'var(--lh-prose)',
          color: 'var(--ewk-steel-050)',
          textWrap: 'pretty',
        }}>{children}</div>
      </div>
    </div>
  );
}
