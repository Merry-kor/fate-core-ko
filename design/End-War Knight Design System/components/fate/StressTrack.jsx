import React from 'react';

/**
 * StressTrack — a row of stress boxes (스트레스).
 * Crimson pips fill when checked. Read-only when onToggle omitted.
 */
export function StressTrack({ label = '스트레스', size = 4, checked = [], onToggle, actions = null }) {
  return (
    <div style={{
      background: 'var(--surface-card)',
      border: '1px solid var(--border-strong)',
      borderRadius: 'var(--radius-sm)',
      padding: '7px 10px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', marginBottom: 7 }}>
        <span style={{
          flex: 1,
          fontFamily: 'var(--font-sans)',
          fontSize: 'var(--fs-xs)',
          fontWeight: 'var(--fw-semibold)',
          letterSpacing: 'var(--ls-wide)',
          color: 'var(--text-muted)',
        }}>{label}</span>
        {actions}
      </div>
      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
        {Array.from({ length: size }).map((_, i) => {
          const on = !!checked[i];
          return (
            <button
              key={i}
              type="button"
              onClick={onToggle ? () => onToggle(i) : undefined}
              title={`${i + 1}`}
              style={{
                width: 24,
                height: 24,
                borderRadius: 'var(--radius-xs)',
                border: `2px solid var(--ewk-crimson-600)`,
                background: on ? 'var(--ewk-crimson-600)' : 'transparent',
                boxShadow: on ? '0 0 8px var(--ewk-crimson-glow)' : 'none',
                cursor: onToggle ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontFamily: 'var(--font-sans)',
                fontSize: 'var(--fs-2xs)',
                fontWeight: 'var(--fw-bold)',
                transition: 'background var(--dur-fast), box-shadow var(--dur-fast)',
              }}
            >{i + 1}</button>
          );
        })}
      </div>
    </div>
  );
}
