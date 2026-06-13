import React from 'react';

/**
 * Button — the empire's primary action control.
 * Variants: gold (primary), crimson (destructive/empire), ghost, steel.
 * Hard-edged, uppercase-friendly, restrained radius.
 */
export function Button({
  children,
  variant = 'gold',
  size = 'md',
  disabled = false,
  icon = null,
  block = false,
  onClick,
  type = 'button',
  ...rest
}) {
  const sizes = {
    sm: { padding: '5px 12px', fontSize: 'var(--fs-xs)', gap: '6px' },
    md: { padding: '8px 18px', fontSize: 'var(--fs-sm)', gap: '8px' },
    lg: { padding: '11px 26px', fontSize: 'var(--fs-base)', gap: '10px' },
  };

  const variants = {
    gold: {
      background: 'var(--ewk-gold-500)',
      color: 'var(--ewk-ink-900)',
      border: '1px solid var(--ewk-gold-400)',
    },
    crimson: {
      background: 'var(--ewk-crimson-600)',
      color: '#fff',
      border: '1px solid var(--ewk-crimson-500)',
    },
    steel: {
      background: 'var(--ewk-ink-650)',
      color: 'var(--ewk-steel-050)',
      border: '1px solid var(--ewk-steel-500)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--ewk-gold-400)',
      border: '1px solid var(--ewk-gold-600)',
    },
  };

  const style = {
    display: block ? 'flex' : 'inline-flex',
    width: block ? '100%' : 'auto',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'var(--font-sans)',
    fontWeight: 'var(--fw-bold)',
    letterSpacing: 'var(--ls-wide)',
    borderRadius: 'var(--radius-sm)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.45 : 1,
    transition: 'filter var(--dur-fast) var(--ease-out), transform var(--dur-fast) var(--ease-out)',
    whiteSpace: 'nowrap',
    ...sizes[size],
    ...variants[variant],
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={style}
      onMouseEnter={(e) => !disabled && (e.currentTarget.style.filter = 'brightness(1.12)')}
      onMouseLeave={(e) => (e.currentTarget.style.filter = 'none')}
      onMouseDown={(e) => !disabled && (e.currentTarget.style.transform = 'translateY(1px)')}
      onMouseUp={(e) => (e.currentTarget.style.transform = 'none')}
      {...rest}
    >
      {icon && <span style={{ display: 'inline-flex', fontSize: '1.05em' }}>{icon}</span>}
      {children}
    </button>
  );
}
