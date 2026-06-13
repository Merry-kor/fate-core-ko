import React from 'react';

/**
 * FateDie — a single Fudge/Fate die face (+ / blank / −).
 * Sized in px so it reads naturally both on screen and in the
 * printed play-script PDF (neither oversized nor tiny).
 */
export function FateDie({ value = 0, size = 30 }) {
  // value: 1 → '+', 0 → blank, -1 → '−'
  const looks = value > 0
    ? { color: 'var(--ewk-outcome-succeed)', edge: '#2e6e44', glyph: '+', bg: 'rgba(79,174,107,0.12)' }
    : value < 0
    ? { color: 'var(--ewk-outcome-fail)', edge: '#7a1626', glyph: '−', bg: 'rgba(210,49,72,0.12)' }
    : { color: 'var(--text-faint)', edge: 'var(--ewk-steel-500)', glyph: '', bg: 'rgba(255,255,255,0.03)' };

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: size,
      height: size,
      borderRadius: Math.round(size * 0.2),
      border: `2px solid ${looks.edge}`,
      background: looks.bg,
      color: looks.color,
      fontFamily: 'var(--font-sans)',
      fontWeight: 'var(--fw-black)',
      fontSize: size * 0.6,
      lineHeight: 1,
    }}>{looks.glyph}</span>
  );
}
