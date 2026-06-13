import React from 'react';

/**
 * Tabs — sheet navigation (기능 & 특기 / 특수항목 / 일대기).
 * Underline-active, uppercase-friendly, gold active marker.
 * Controlled: pass `value` + `onChange`, or uncontrolled with `defaultValue`.
 */
export function Tabs({ items = [], value, defaultValue, onChange }) {
  const [internal, setInternal] = React.useState(defaultValue ?? (items[0] && items[0].id));
  const active = value !== undefined ? value : internal;

  const select = (id) => {
    if (value === undefined) setInternal(id);
    onChange && onChange(id);
  };

  return (
    <nav style={{
      display: 'flex',
      gap: 0,
      borderBottom: '2px solid var(--border-strong)',
      background: 'var(--surface-card)',
      paddingInline: 'var(--sp-3)',
    }}>
      {items.map((it) => {
        const on = it.id === active;
        return (
          <button
            key={it.id}
            type="button"
            onClick={() => select(it.id)}
            style={{
              appearance: 'none',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '11px 16px',
              marginBottom: -2,
              fontFamily: 'var(--font-sans)',
              fontSize: 'var(--fs-sm)',
              fontWeight: 'var(--fw-bold)',
              letterSpacing: 'var(--ls-wide)',
              color: on ? 'var(--ewk-gold-400)' : 'var(--text-muted)',
              borderBottom: `2px solid ${on ? 'var(--ewk-gold-500)' : 'transparent'}`,
              transition: 'color var(--dur-fast), border-color var(--dur-fast)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
            }}
          >
            {it.icon && <span>{it.icon}</span>}
            {it.label}
            {it.count != null && (
              <span style={{
                fontSize: 'var(--fs-2xs)',
                color: 'var(--text-faint)',
                fontWeight: 'var(--fw-medium)',
              }}>{it.count}</span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
