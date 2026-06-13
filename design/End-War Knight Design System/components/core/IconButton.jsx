import React from 'react';

/**
 * IconButton — compact square control for row actions
 * (roll / edit / delete / add). Tones tint the hover state.
 */
export function IconButton({
  children,
  tone = 'steel',
  size = 'md',
  title,
  onClick,
  ...rest
}) {
  const tones = {
    steel: 'var(--ewk-steel-100)',
    gold: 'var(--ewk-gold-400)',
    crimson: 'var(--ewk-crimson-400)',
  };
  const dims = { sm: 22, md: 28, lg: 34 }[size];
  const color = tones[tone] || tones.steel;

  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      style={{
        width: dims,
        height: dims,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
        border: '1px solid transparent',
        borderRadius: 'var(--radius-sm)',
        color: 'var(--text-muted)',
        cursor: 'pointer',
        fontSize: dims * 0.46,
        transition: 'color var(--dur-fast), background var(--dur-fast), border-color var(--dur-fast)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = color;
        e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
        e.currentTarget.style.borderColor = 'var(--ewk-steel-500)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = 'var(--text-muted)';
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.borderColor = 'transparent';
      }}
      {...rest}
    >
      {children}
    </button>
  );
}
