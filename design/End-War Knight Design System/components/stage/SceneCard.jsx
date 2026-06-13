import React from 'react';

/**
 * SceneCard — a scene in the director's rail (장면 활성화/이동).
 * Click-to-activate; the active scene gets a gold frame + glow,
 * and its background image fills the stage.
 */
export function SceneCard({
  name = '',
  chapter = '',
  thumbnail = null,
  active = false,
  onActivate,
}) {
  return (
    <button
      type="button"
      onClick={onActivate}
      title={name}
      style={{
        position: 'relative',
        width: 156,
        height: 92,
        flexShrink: 0,
        padding: 0,
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        cursor: 'pointer',
        border: `2px solid ${active ? 'var(--ewk-gold-500)' : 'var(--border-strong)'}`,
        boxShadow: active ? 'var(--shadow-gold)' : 'var(--shadow-sm)',
        background: 'var(--ewk-ink-650)',
        transition: 'border-color var(--dur-base), box-shadow var(--dur-base), transform var(--dur-fast)',
      }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; }}
    >
      {thumbnail ? (
        <img src={thumbnail} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      ) : (
        <div style={{
          width: '100%', height: '100%',
          background: 'repeating-linear-gradient(135deg, var(--ewk-ink-700) 0 10px, var(--ewk-ink-650) 10px 20px)',
        }} />
      )}

      {/* protection gradient */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(180deg, rgba(10,11,15,0) 40%, rgba(10,11,15,0.85) 100%)',
      }} />

      {active && (
        <span style={{
          position: 'absolute', top: 6, left: 6,
          fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-2xs)',
          fontWeight: 'var(--fw-bold)', letterSpacing: 'var(--ls-label)',
          textTransform: 'uppercase', color: 'var(--ewk-ink-900)',
          background: 'var(--ewk-gold-500)', borderRadius: 'var(--radius-xs)',
          padding: '1px 6px',
        }}>ON AIR</span>
      )}

      <div style={{ position: 'absolute', left: 8, right: 8, bottom: 6, textAlign: 'left' }}>
        {chapter && (
          <div style={{
            fontFamily: 'var(--font-sans)', fontSize: '9px',
            fontWeight: 'var(--fw-semibold)', letterSpacing: 'var(--ls-wide)',
            color: 'var(--ewk-gold-300)', marginBottom: 1,
          }}>{chapter}</div>
        )}
        <div style={{
          fontFamily: 'var(--font-serif)', fontSize: 'var(--fs-sm)',
          fontWeight: 'var(--fw-bold)', color: '#fff', lineHeight: 'var(--lh-tight)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{name}</div>
      </div>
    </button>
  );
}
