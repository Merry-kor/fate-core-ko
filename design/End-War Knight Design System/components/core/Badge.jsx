import React from 'react';

/**
 * Badge / Tag — small status & taxonomy markers.
 * tone: gold | crimson | steel | success | tie | fail | violet | teal | blue
 * variant: solid | soft | outline
 * Used for division insignia, aspect-type tags (#단기/#장기), invoke counts.
 */
export function Badge({
  children,
  tone = 'steel',
  variant = 'soft',
  size = 'md',
  uppercase = false,
  ...rest
}) {
  const palette = {
    gold:    ['var(--ewk-gold-300)', 'var(--ewk-gold-600)', 'var(--ewk-ink-900)', 'var(--ewk-gold-500)'],
    crimson: ['var(--ewk-crimson-400)', 'var(--ewk-crimson-700)', '#fff', 'var(--ewk-crimson-600)'],
    steel:   ['var(--ewk-steel-100)', 'var(--ewk-steel-500)', 'var(--ewk-ink-900)', 'var(--ewk-steel-300)'],
    success: ['var(--ewk-outcome-succeed)', '#2e6e44', '#fff', 'var(--ewk-outcome-succeed)'],
    tie:     ['var(--ewk-outcome-tie)', '#7a4d18', 'var(--ewk-ink-900)', 'var(--ewk-outcome-tie)'],
    fail:    ['var(--ewk-outcome-fail)', '#7a1626', '#fff', 'var(--ewk-outcome-fail)'],
    violet:  ['var(--ewk-aspect-longterm)', '#4d3473', '#fff', 'var(--ewk-aspect-longterm)'],
    teal:    ['var(--ewk-aspect-stack)', '#1f5e5e', 'var(--ewk-ink-900)', 'var(--ewk-aspect-stack)'],
    blue:    ['var(--ewk-aspect-situation)', '#23506e', '#fff', 'var(--ewk-aspect-situation)'],
  };
  const [fg, edge, solidFg, solidBg] = palette[tone] || palette.steel;

  const sizes = {
    sm: { padding: '1px 7px', fontSize: 'var(--fs-2xs)' },
    md: { padding: '2px 9px', fontSize: 'var(--fs-xs)' },
    lg: { padding: '4px 12px', fontSize: 'var(--fs-sm)' },
  };

  const looks = {
    solid:   { background: solidBg, color: solidFg, border: `1px solid ${edge}` },
    soft:    { background: 'color-mix(in srgb, ' + fg + ' 16%, transparent)', color: fg, border: `1px solid color-mix(in srgb, ${fg} 30%, transparent)` },
    outline: { background: 'transparent', color: fg, border: `1px solid ${edge}` },
  };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        fontFamily: 'var(--font-sans)',
        fontWeight: 'var(--fw-semibold)',
        letterSpacing: uppercase ? 'var(--ls-label)' : 'var(--ls-wide)',
        textTransform: uppercase ? 'uppercase' : 'none',
        borderRadius: 'var(--radius-pill)',
        lineHeight: 1.5,
        whiteSpace: 'nowrap',
        ...sizes[size],
        ...looks[variant],
      }}
      {...rest}
    >
      {children}
    </span>
  );
}
