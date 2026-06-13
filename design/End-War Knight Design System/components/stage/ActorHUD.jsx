import React from 'react';
import { Avatar } from '../core/Avatar.jsx';

/**
 * ActorHUD — the compact control card for one actor on the bottom HUD bar.
 * Shows portrait (active ring when speaking), name + division, fate points,
 * and stage controls (무대 추가 / 퇴장, 발언권).
 */
export function ActorHUD({
  name = '',
  portrait = null,
  division = '',
  fatePoints = 3,
  onStage = false,
  active = false,
  onToggleStage,
  onSpeak,
}) {
  return (
    <div style={{
      width: 210,
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--sp-3)',
      padding: '8px 10px',
      background: active
        ? 'linear-gradient(180deg, rgba(201,162,39,0.12), var(--ewk-ink-700))'
        : 'var(--ewk-ink-700)',
      border: `1px solid ${active ? 'var(--ewk-gold-600)' : 'var(--border-strong)'}`,
      borderRadius: 'var(--radius-md)',
      boxShadow: active ? 'var(--shadow-gold)' : 'var(--shadow-sm)',
      transition: 'border-color var(--dur-base), box-shadow var(--dur-base)',
    }}>
      <Avatar src={portrait} name={name} size={46} shape="frame" ring={active ? 'active' : onStage ? 'gold' : 'none'} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: 'var(--font-sans)', fontWeight: 'var(--fw-bold)',
          fontSize: 'var(--fs-sm)', color: 'var(--text-strong)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{name}</div>
        {division && (
          <div style={{
            fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-2xs)',
            color: 'var(--text-faint)', letterSpacing: 'var(--ls-wide)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{division}</div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
          <span style={{
            fontFamily: 'var(--font-serif)', fontWeight: 'var(--fw-black)',
            fontSize: 'var(--fs-base)', color: 'var(--ewk-gold-300)',
            fontVariantNumeric: 'tabular-nums', lineHeight: 1,
          }}>{fatePoints}</span>
          <span style={{ fontSize: 'var(--fs-2xs)', color: 'var(--text-muted)', letterSpacing: 'var(--ls-wide)' }}>운명점</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <button
          type="button"
          onClick={onToggleStage}
          title={onStage ? '무대에서 퇴장' : '무대에 추가'}
          style={{
            width: 30, height: 30, borderRadius: 'var(--radius-sm)',
            border: `1px solid ${onStage ? 'var(--ewk-crimson-700)' : 'var(--ewk-gold-600)'}`,
            background: onStage ? 'color-mix(in srgb, var(--ewk-crimson-600) 16%, transparent)' : 'transparent',
            color: onStage ? 'var(--ewk-crimson-400)' : 'var(--ewk-gold-400)',
            cursor: 'pointer', fontSize: 'var(--fs-base)', lineHeight: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >{onStage ? '−' : '+'}</button>
        <button
          type="button"
          onClick={onSpeak}
          title="발언권 (무대에 대사 표출)"
          disabled={!onStage}
          style={{
            width: 30, height: 30, borderRadius: 'var(--radius-sm)',
            border: `1px solid ${active ? 'var(--ewk-gold-500)' : 'var(--border-hairline)'}`,
            background: active ? 'var(--ewk-gold-500)' : 'transparent',
            color: active ? 'var(--ewk-ink-900)' : 'var(--text-muted)',
            cursor: onStage ? 'pointer' : 'not-allowed',
            opacity: onStage ? 1 : 0.4,
            fontSize: 'var(--fs-sm)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        ><i className="fa fa-comment" /></button>
      </div>
    </div>
  );
}
