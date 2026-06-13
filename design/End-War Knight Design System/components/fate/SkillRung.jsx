import React from 'react';
import { LadderBadge } from './LadderBadge.jsx';

/**
 * SkillRung — one row of the skill ladder (기능 사다리).
 * Rank badge + skill name + roll/edit actions.
 */
export function SkillRung({ name = '', rank = 0, onRoll, actions = null }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--sp-3)',
      padding: '6px 10px',
      background: 'var(--surface-card)',
      border: '1px solid var(--border-strong)',
      borderRadius: 'var(--radius-sm)',
    }}>
      <div style={{ width: 96, flexShrink: 0 }}>
        <LadderBadge rank={rank} size="sm" />
      </div>
      <span style={{
        flex: 1,
        fontFamily: 'var(--font-sans)',
        fontSize: 'var(--fs-base)',
        fontWeight: 'var(--fw-medium)',
        color: 'var(--text-body)',
      }}>{name}</span>
      {onRoll && (
        <button
          type="button"
          onClick={onRoll}
          title="굴리기"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '3px 10px',
            fontFamily: 'var(--font-sans)',
            fontSize: 'var(--fs-2xs)',
            fontWeight: 'var(--fw-bold)',
            letterSpacing: 'var(--ls-wide)',
            color: 'var(--ewk-gold-400)',
            background: 'transparent',
            border: '1px solid var(--ewk-gold-600)',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
          }}
        >4dF</button>
      )}
      {actions}
    </div>
  );
}
