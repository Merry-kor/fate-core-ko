import React from 'react';

/**
 * Avatar — a knight's portrait in an imperial frame.
 * shape: circle | frame (hard-edged steel plate)
 * ring: none | gold | crimson | active (gold glow = on-stage speaker)
 */
export function Avatar({
  src,
  name = '',
  size = 56,
  shape = 'circle',
  ring = 'none',
  badge = null,
  ...rest
}) {
  const rings = {
    none: { boxShadow: 'none', borderColor: 'var(--ewk-steel-500)' },
    gold: { boxShadow: 'none', borderColor: 'var(--ewk-gold-500)' },
    crimson: { boxShadow: 'none', borderColor: 'var(--ewk-crimson-600)' },
    active: { boxShadow: '0 0 0 2px var(--ewk-gold-500), 0 0 16px var(--ewk-gold-glow)', borderColor: 'var(--ewk-gold-400)' },
  };

  const radius = shape === 'circle' ? '50%' : 'var(--radius-sm)';
  const initials = name ? name.trim().slice(0, 2) : '?';

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }} {...rest}>
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: radius,
          border: `var(--bw-heavy) solid`,
          overflow: 'hidden',
          background: 'var(--ewk-ink-650)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...rings[ring],
        }}
      >
        {src ? (
          <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        ) : (
          <span style={{
            fontFamily: 'var(--font-serif)',
            fontWeight: 'var(--fw-bold)',
            color: 'var(--ewk-steel-300)',
            fontSize: size * 0.34,
            letterSpacing: '0.02em',
          }}>{initials}</span>
        )}
      </div>
      {badge != null && (
        <div style={{
          position: 'absolute',
          bottom: -4,
          right: -4,
          minWidth: 18,
          height: 18,
          padding: '0 4px',
          borderRadius: 'var(--radius-pill)',
          background: 'var(--ewk-crimson-600)',
          color: '#fff',
          fontFamily: 'var(--font-sans)',
          fontSize: 'var(--fs-2xs)',
          fontWeight: 'var(--fw-bold)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px solid var(--ewk-ink-800)',
        }}>{badge}</div>
      )}
    </div>
  );
}
