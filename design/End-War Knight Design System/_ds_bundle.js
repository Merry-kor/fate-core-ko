/* @ds-bundle: {"format":3,"namespace":"EndWarKnightDesignSystem_000168","components":[{"name":"Avatar","sourcePath":"components/core/Avatar.jsx"},{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"IconButton","sourcePath":"components/core/IconButton.jsx"},{"name":"Tabs","sourcePath":"components/core/Tabs.jsx"},{"name":"AspectChip","sourcePath":"components/fate/AspectChip.jsx"},{"name":"FateDie","sourcePath":"components/fate/FateDie.jsx"},{"name":"FatePoints","sourcePath":"components/fate/FatePoints.jsx"},{"name":"LADDER","sourcePath":"components/fate/LadderBadge.jsx"},{"name":"LadderBadge","sourcePath":"components/fate/LadderBadge.jsx"},{"name":"RollCard","sourcePath":"components/fate/RollCard.jsx"},{"name":"SkillRung","sourcePath":"components/fate/SkillRung.jsx"},{"name":"StressTrack","sourcePath":"components/fate/StressTrack.jsx"},{"name":"StuntCard","sourcePath":"components/fate/StuntCard.jsx"},{"name":"ActorHUD","sourcePath":"components/stage/ActorHUD.jsx"},{"name":"ChatLine","sourcePath":"components/stage/ChatLine.jsx"},{"name":"SceneCard","sourcePath":"components/stage/SceneCard.jsx"}],"sourceHashes":{"components/core/Avatar.jsx":"f5c652a05354","components/core/Badge.jsx":"14c0c789656c","components/core/Button.jsx":"239dbe6362c2","components/core/IconButton.jsx":"2f93399d92fb","components/core/Tabs.jsx":"0407e2e9a695","components/fate/AspectChip.jsx":"5a6776b8c89d","components/fate/FateDie.jsx":"8242f9222da3","components/fate/FatePoints.jsx":"428dc6ce9723","components/fate/LadderBadge.jsx":"a806bef695bb","components/fate/RollCard.jsx":"07537f626049","components/fate/SkillRung.jsx":"c027d4220fb5","components/fate/StressTrack.jsx":"a83f43de37b8","components/fate/StuntCard.jsx":"75a9cb157199","components/stage/ActorHUD.jsx":"094fa3156af4","components/stage/ChatLine.jsx":"0dd47063a2ae","components/stage/SceneCard.jsx":"ff16f94ddc5b"},"inlinedExternals":[],"unexposedExports":[{"name":"ladderLabel","sourcePath":"components/fate/LadderBadge.jsx"}]} */

(() => {

const __ds_ns = (window.EndWarKnightDesignSystem_000168 = window.EndWarKnightDesignSystem_000168 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Avatar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Avatar — a knight's portrait in an imperial frame.
 * shape: circle | frame (hard-edged steel plate)
 * ring: none | gold | crimson | active (gold glow = on-stage speaker)
 */
function Avatar({
  src,
  name = '',
  size = 56,
  shape = 'circle',
  ring = 'none',
  badge = null,
  ...rest
}) {
  const rings = {
    none: {
      boxShadow: 'none',
      borderColor: 'var(--ewk-steel-500)'
    },
    gold: {
      boxShadow: 'none',
      borderColor: 'var(--ewk-gold-500)'
    },
    crimson: {
      boxShadow: 'none',
      borderColor: 'var(--ewk-crimson-600)'
    },
    active: {
      boxShadow: '0 0 0 2px var(--ewk-gold-500), 0 0 16px var(--ewk-gold-glow)',
      borderColor: 'var(--ewk-gold-400)'
    }
  };
  const radius = shape === 'circle' ? '50%' : 'var(--radius-sm)';
  const initials = name ? name.trim().slice(0, 2) : '?';
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      position: 'relative',
      width: size,
      height: size,
      flexShrink: 0
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100%',
      height: '100%',
      borderRadius: radius,
      border: `var(--bw-heavy) solid`,
      overflow: 'hidden',
      background: 'var(--ewk-ink-650)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      ...rings[ring]
    }
  }, src ? /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: name,
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      display: 'block'
    }
  }) : /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-serif)',
      fontWeight: 'var(--fw-bold)',
      color: 'var(--ewk-steel-300)',
      fontSize: size * 0.34,
      letterSpacing: '0.02em'
    }
  }, initials)), badge != null && /*#__PURE__*/React.createElement("div", {
    style: {
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
      border: '2px solid var(--ewk-ink-800)'
    }
  }, badge));
}
Object.assign(__ds_scope, { Avatar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Avatar.jsx", error: String((e && e.message) || e) }); }

// components/core/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Badge / Tag — small status & taxonomy markers.
 * tone: gold | crimson | steel | success | tie | fail | violet | teal | blue
 * variant: solid | soft | outline
 * Used for division insignia, aspect-type tags (#단기/#장기), invoke counts.
 */
function Badge({
  children,
  tone = 'steel',
  variant = 'soft',
  size = 'md',
  uppercase = false,
  ...rest
}) {
  const palette = {
    gold: ['var(--ewk-gold-300)', 'var(--ewk-gold-600)', 'var(--ewk-ink-900)', 'var(--ewk-gold-500)'],
    crimson: ['var(--ewk-crimson-400)', 'var(--ewk-crimson-700)', '#fff', 'var(--ewk-crimson-600)'],
    steel: ['var(--ewk-steel-100)', 'var(--ewk-steel-500)', 'var(--ewk-ink-900)', 'var(--ewk-steel-300)'],
    success: ['var(--ewk-outcome-succeed)', '#2e6e44', '#fff', 'var(--ewk-outcome-succeed)'],
    tie: ['var(--ewk-outcome-tie)', '#7a4d18', 'var(--ewk-ink-900)', 'var(--ewk-outcome-tie)'],
    fail: ['var(--ewk-outcome-fail)', '#7a1626', '#fff', 'var(--ewk-outcome-fail)'],
    violet: ['var(--ewk-aspect-longterm)', '#4d3473', '#fff', 'var(--ewk-aspect-longterm)'],
    teal: ['var(--ewk-aspect-stack)', '#1f5e5e', 'var(--ewk-ink-900)', 'var(--ewk-aspect-stack)'],
    blue: ['var(--ewk-aspect-situation)', '#23506e', '#fff', 'var(--ewk-aspect-situation)']
  };
  const [fg, edge, solidFg, solidBg] = palette[tone] || palette.steel;
  const sizes = {
    sm: {
      padding: '1px 7px',
      fontSize: 'var(--fs-2xs)'
    },
    md: {
      padding: '2px 9px',
      fontSize: 'var(--fs-xs)'
    },
    lg: {
      padding: '4px 12px',
      fontSize: 'var(--fs-sm)'
    }
  };
  const looks = {
    solid: {
      background: solidBg,
      color: solidFg,
      border: `1px solid ${edge}`
    },
    soft: {
      background: 'color-mix(in srgb, ' + fg + ' 16%, transparent)',
      color: fg,
      border: `1px solid color-mix(in srgb, ${fg} 30%, transparent)`
    },
    outline: {
      background: 'transparent',
      color: fg,
      border: `1px solid ${edge}`
    }
  };
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
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
      ...looks[variant]
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Button — the empire's primary action control.
 * Variants: gold (primary), crimson (destructive/empire), ghost, steel.
 * Hard-edged, uppercase-friendly, restrained radius.
 */
function Button({
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
    sm: {
      padding: '5px 12px',
      fontSize: 'var(--fs-xs)',
      gap: '6px'
    },
    md: {
      padding: '8px 18px',
      fontSize: 'var(--fs-sm)',
      gap: '8px'
    },
    lg: {
      padding: '11px 26px',
      fontSize: 'var(--fs-base)',
      gap: '10px'
    }
  };
  const variants = {
    gold: {
      background: 'var(--ewk-gold-500)',
      color: 'var(--ewk-ink-900)',
      border: '1px solid var(--ewk-gold-400)'
    },
    crimson: {
      background: 'var(--ewk-crimson-600)',
      color: '#fff',
      border: '1px solid var(--ewk-crimson-500)'
    },
    steel: {
      background: 'var(--ewk-ink-650)',
      color: 'var(--ewk-steel-050)',
      border: '1px solid var(--ewk-steel-500)'
    },
    ghost: {
      background: 'transparent',
      color: 'var(--ewk-gold-400)',
      border: '1px solid var(--ewk-gold-600)'
    }
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
    ...variants[variant]
  };
  return /*#__PURE__*/React.createElement("button", _extends({
    type: type,
    disabled: disabled,
    onClick: onClick,
    style: style,
    onMouseEnter: e => !disabled && (e.currentTarget.style.filter = 'brightness(1.12)'),
    onMouseLeave: e => e.currentTarget.style.filter = 'none',
    onMouseDown: e => !disabled && (e.currentTarget.style.transform = 'translateY(1px)'),
    onMouseUp: e => e.currentTarget.style.transform = 'none'
  }, rest), icon && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      fontSize: '1.05em'
    }
  }, icon), children);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * IconButton — compact square control for row actions
 * (roll / edit / delete / add). Tones tint the hover state.
 */
function IconButton({
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
    crimson: 'var(--ewk-crimson-400)'
  };
  const dims = {
    sm: 22,
    md: 28,
    lg: 34
  }[size];
  const color = tones[tone] || tones.steel;
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    title: title,
    onClick: onClick,
    style: {
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
      transition: 'color var(--dur-fast), background var(--dur-fast), border-color var(--dur-fast)'
    },
    onMouseEnter: e => {
      e.currentTarget.style.color = color;
      e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
      e.currentTarget.style.borderColor = 'var(--ewk-steel-500)';
    },
    onMouseLeave: e => {
      e.currentTarget.style.color = 'var(--text-muted)';
      e.currentTarget.style.background = 'transparent';
      e.currentTarget.style.borderColor = 'transparent';
    }
  }, rest), children);
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/core/Tabs.jsx
try { (() => {
/**
 * Tabs — sheet navigation (기능 & 특기 / 특수항목 / 일대기).
 * Underline-active, uppercase-friendly, gold active marker.
 * Controlled: pass `value` + `onChange`, or uncontrolled with `defaultValue`.
 */
function Tabs({
  items = [],
  value,
  defaultValue,
  onChange
}) {
  const [internal, setInternal] = React.useState(defaultValue ?? (items[0] && items[0].id));
  const active = value !== undefined ? value : internal;
  const select = id => {
    if (value === undefined) setInternal(id);
    onChange && onChange(id);
  };
  return /*#__PURE__*/React.createElement("nav", {
    style: {
      display: 'flex',
      gap: 0,
      borderBottom: '2px solid var(--border-strong)',
      background: 'var(--surface-card)',
      paddingInline: 'var(--sp-3)'
    }
  }, items.map(it => {
    const on = it.id === active;
    return /*#__PURE__*/React.createElement("button", {
      key: it.id,
      type: "button",
      onClick: () => select(it.id),
      style: {
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
        gap: '7px'
      }
    }, it.icon && /*#__PURE__*/React.createElement("span", null, it.icon), it.label, it.count != null && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 'var(--fs-2xs)',
        color: 'var(--text-faint)',
        fontWeight: 'var(--fw-medium)'
      }
    }, it.count));
  }));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Tabs.jsx", error: String((e && e.message) || e) }); }

// components/fate/AspectChip.jsx
try { (() => {
/**
 * AspectChip — a 면모. The narrative atom of Fate.
 * type: identity 정체성 | trouble 고민 | general 일반
 *       situation 상황 | longterm 장기 | stack 스택
 * A left accent bar carries the type colour; italic serif text;
 * optional invoke pips (free-invoke / 발현 횟수) and a #단기/#장기 tag.
 */
function AspectChip({
  label = '',
  type = 'general',
  tag = null,
  // '#단기' | '#장기' | null
  invokes = 0,
  // free-invoke count → gold pips
  stack = null,
  // { filled, total } for 스택 상황 면모
  onInvoke,
  actions = null
}) {
  const accents = {
    identity: 'var(--ewk-aspect-identity)',
    trouble: 'var(--ewk-aspect-trouble)',
    general: 'var(--ewk-aspect-general)',
    situation: 'var(--ewk-aspect-situation)',
    longterm: 'var(--ewk-aspect-longterm)',
    stack: 'var(--ewk-aspect-stack)'
  };
  const labels = {
    identity: '정체성',
    trouble: '고민',
    general: '일반',
    situation: '상황',
    longterm: '장기',
    stack: '스택'
  };
  const accent = accents[type] || accents.general;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--sp-2)',
      background: 'var(--surface-card)',
      border: '1px solid var(--border-strong)',
      borderLeft: `var(--bw-heavy) solid ${accent}`,
      borderRadius: 'var(--radius-sm)',
      padding: '6px 9px 6px 11px',
      minHeight: 36
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--fs-2xs)',
      fontWeight: 'var(--fw-bold)',
      letterSpacing: 'var(--ls-wide)',
      color: accent,
      flexShrink: 0,
      width: 30
    }
  }, labels[type]), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      fontFamily: 'var(--font-serif)',
      fontStyle: 'italic',
      fontSize: 'var(--fs-base)',
      color: 'var(--text-strong)',
      lineHeight: 'var(--lh-snug)'
    }
  }, label, tag && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontStyle: 'normal',
      fontSize: 'var(--fs-2xs)',
      fontWeight: 'var(--fw-semibold)',
      color: type === 'longterm' ? 'var(--ewk-aspect-longterm)' : 'var(--text-faint)',
      marginLeft: 6
    }
  }, tag)), stack && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--fs-xs)',
      fontWeight: 'var(--fw-bold)',
      color: 'var(--ewk-aspect-stack)',
      background: 'color-mix(in srgb, var(--ewk-aspect-stack) 14%, transparent)',
      border: '1px solid color-mix(in srgb, var(--ewk-aspect-stack) 32%, transparent)',
      borderRadius: 'var(--radius-pill)',
      padding: '1px 8px',
      fontVariantNumeric: 'tabular-nums'
    }
  }, stack.filled, "/", stack.total), invokes > 0 && /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onInvoke,
    title: "\uBC1C\uD604",
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 3,
      background: 'transparent',
      border: 'none',
      cursor: onInvoke ? 'pointer' : 'default',
      padding: '2px 4px'
    }
  }, Array.from({
    length: invokes
  }).map((_, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      width: 9,
      height: 9,
      borderRadius: '50%',
      background: 'var(--ewk-gold-500)',
      boxShadow: '0 0 6px var(--ewk-gold-glow)'
    }
  }))), actions);
}
Object.assign(__ds_scope, { AspectChip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/fate/AspectChip.jsx", error: String((e && e.message) || e) }); }

// components/fate/FateDie.jsx
try { (() => {
/**
 * FateDie — a single Fudge/Fate die face (+ / blank / −).
 * Sized in px so it reads naturally both on screen and in the
 * printed play-script PDF (neither oversized nor tiny).
 */
function FateDie({
  value = 0,
  size = 30
}) {
  // value: 1 → '+', 0 → blank, -1 → '−'
  const looks = value > 0 ? {
    color: 'var(--ewk-outcome-succeed)',
    edge: '#2e6e44',
    glyph: '+',
    bg: 'rgba(79,174,107,0.12)'
  } : value < 0 ? {
    color: 'var(--ewk-outcome-fail)',
    edge: '#7a1626',
    glyph: '−',
    bg: 'rgba(210,49,72,0.12)'
  } : {
    color: 'var(--text-faint)',
    edge: 'var(--ewk-steel-500)',
    glyph: '',
    bg: 'rgba(255,255,255,0.03)'
  };
  return /*#__PURE__*/React.createElement("span", {
    style: {
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
      lineHeight: 1
    }
  }, looks.glyph);
}
Object.assign(__ds_scope, { FateDie });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/fate/FateDie.jsx", error: String((e && e.message) || e) }); }

// components/fate/FatePoints.jsx
try { (() => {
/**
 * FatePoints — 운명점 tracker with a refresh value (재충전).
 * The empire's currency of narrative agency.
 */
function FatePoints({
  current = 3,
  refresh = 3,
  onAdjust
}) {
  const Step = ({
    delta,
    children
  }) => /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onAdjust ? () => onAdjust(delta) : undefined,
    style: {
      width: 26,
      height: 26,
      borderRadius: '50%',
      border: '1px solid var(--ewk-gold-600)',
      background: 'transparent',
      color: 'var(--ewk-gold-400)',
      cursor: onAdjust ? 'pointer' : 'default',
      fontSize: 'var(--fs-md)',
      lineHeight: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'background var(--dur-fast), color var(--dur-fast)'
    },
    onMouseEnter: e => {
      if (onAdjust) {
        e.currentTarget.style.background = 'var(--ewk-gold-500)';
        e.currentTarget.style.color = 'var(--ewk-ink-900)';
      }
    },
    onMouseLeave: e => {
      e.currentTarget.style.background = 'transparent';
      e.currentTarget.style.color = 'var(--ewk-gold-400)';
    }
  }, children);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--sp-5)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--sp-2)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--fs-2xs)',
      fontWeight: 'var(--fw-semibold)',
      letterSpacing: 'var(--ls-label)',
      textTransform: 'uppercase',
      color: 'var(--text-muted)'
    }
  }, "\uC6B4\uBA85\uC810"), /*#__PURE__*/React.createElement(Step, {
    delta: -1
  }, "\u2212"), /*#__PURE__*/React.createElement("span", {
    style: {
      minWidth: 40,
      textAlign: 'center',
      fontFamily: 'var(--font-serif)',
      fontWeight: 'var(--fw-black)',
      fontSize: 'var(--fs-xl)',
      color: 'var(--ewk-gold-300)',
      fontVariantNumeric: 'tabular-nums',
      textShadow: '0 0 14px var(--ewk-gold-glow)'
    }
  }, current), /*#__PURE__*/React.createElement(Step, {
    delta: 1
  }, "+")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--sp-2)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--fs-2xs)',
      fontWeight: 'var(--fw-semibold)',
      letterSpacing: 'var(--ls-label)',
      textTransform: 'uppercase',
      color: 'var(--text-muted)'
    }
  }, "\uC7AC\uCDA9\uC804"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-serif)',
      fontWeight: 'var(--fw-bold)',
      fontSize: 'var(--fs-lg)',
      color: 'var(--text-body)',
      fontVariantNumeric: 'tabular-nums'
    }
  }, refresh)));
}
Object.assign(__ds_scope, { FatePoints });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/fate/FatePoints.jsx", error: String((e && e.message) || e) }); }

// components/fate/LadderBadge.jsx
try { (() => {
/** Fate ladder labels, Korean (페이트 코어 한국어판). */
const LADDER = {
  8: '전설적',
  7: '영웅적',
  6: '환상적',
  5: '엄청남',
  4: '대단함',
  3: '우수',
  2: '양호',
  1: '보통',
  0: '미약',
  '-1': '부실',
  '-2': '엉망',
  '-3': '재앙적',
  '-4': '끔찍함'
};
function ladderLabel(rank) {
  return LADDER[rank] ?? LADDER[String(rank)] ?? '';
}

/**
 * LadderBadge — a skill rank rendered as "+N 대단함".
 * Gold for positive ranks, steel for 0, crimson for negative.
 */
function LadderBadge({
  rank = 0,
  showLabel = true,
  size = 'md'
}) {
  const n = Number(rank);
  const tone = n > 0 ? 'gold' : n < 0 ? 'crimson' : 'steel';
  const colors = {
    gold: ['var(--ewk-gold-300)', 'color-mix(in srgb, var(--ewk-gold-500) 14%, transparent)', 'var(--ewk-gold-600)'],
    steel: ['var(--ewk-steel-200)', 'rgba(255,255,255,0.05)', 'var(--ewk-steel-500)'],
    crimson: ['var(--ewk-crimson-400)', 'color-mix(in srgb, var(--ewk-crimson-600) 14%, transparent)', 'var(--ewk-crimson-700)']
  }[tone];
  const sizes = {
    sm: {
      fontSize: 'var(--fs-2xs)',
      padding: '2px 7px'
    },
    md: {
      fontSize: 'var(--fs-xs)',
      padding: '3px 9px'
    },
    lg: {
      fontSize: 'var(--fs-sm)',
      padding: '4px 11px'
    }
  }[size];
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      fontFamily: 'var(--font-sans)',
      fontWeight: 'var(--fw-bold)',
      borderRadius: 'var(--radius-sm)',
      color: colors[0],
      background: colors[1],
      border: `1px solid ${colors[2]}`,
      letterSpacing: 'var(--ls-wide)',
      whiteSpace: 'nowrap',
      ...sizes
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontVariantNumeric: 'tabular-nums'
    }
  }, n >= 0 ? `+${n}` : n), showLabel && /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 'var(--fw-semibold)',
      opacity: 0.92
    }
  }, ladderLabel(rank)));
}
Object.assign(__ds_scope, { LADDER, ladderLabel, LadderBadge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/fate/LadderBadge.jsx", error: String((e && e.message) || e) }); }

// components/fate/RollCard.jsx
try { (() => {
/**
 * RollCard — the chat result card for a 4dF roll.
 * Shows the four dice, the skill modifier, the total on the ladder,
 * and an outcome chip (압도적 성공 / 성공 / 동점 / 실패).
 */
function RollCard({
  actor = '',
  portrait = null,
  skill = '',
  dice = [1, 0, -1, 1],
  modifier = 0,
  difficulty = null,
  action = null // '기회 만들기' | '극복' | 등
}) {
  const diceSum = dice.reduce((a, b) => a + b, 0);
  const total = diceSum + Number(modifier);
  let outcome = null;
  if (difficulty != null) {
    const diff = total - Number(difficulty);
    if (diff >= 3) outcome = {
      key: 'style',
      label: '압도적 성공',
      color: 'var(--ewk-outcome-style)'
    };else if (diff >= 1) outcome = {
      key: 'succeed',
      label: '성공',
      color: 'var(--ewk-outcome-succeed)'
    };else if (diff === 0) outcome = {
      key: 'tie',
      label: '동점',
      color: 'var(--ewk-outcome-tie)'
    };else outcome = {
      key: 'fail',
      label: '실패',
      color: 'var(--ewk-outcome-fail)'
    };
  }
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface-card)',
      border: '1px solid var(--border-strong)',
      borderTop: '2px solid var(--ewk-gold-600)',
      borderRadius: 'var(--radius-md)',
      padding: '12px 14px',
      fontFamily: 'var(--font-sans)',
      boxShadow: 'var(--shadow-sm)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--sp-2)',
      marginBottom: 10
    }
  }, portrait && /*#__PURE__*/React.createElement("img", {
    src: portrait,
    alt: actor,
    style: {
      width: 28,
      height: 28,
      borderRadius: '50%',
      objectFit: 'cover',
      border: '2px solid var(--ewk-gold-600)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 'var(--fw-bold)',
      color: 'var(--text-strong)',
      fontSize: 'var(--fs-base)'
    }
  }, actor), action && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--fs-2xs)',
      fontWeight: 'var(--fw-semibold)',
      color: 'var(--ewk-crimson-400)',
      letterSpacing: 'var(--ls-wide)',
      background: 'color-mix(in srgb, var(--ewk-crimson-600) 14%, transparent)',
      border: '1px solid var(--ewk-crimson-700)',
      borderRadius: 'var(--radius-pill)',
      padding: '1px 8px'
    }
  }, action), skill && /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 'auto',
      fontSize: 'var(--fs-xs)',
      fontWeight: 'var(--fw-semibold)',
      color: 'var(--ewk-gold-400)',
      background: 'color-mix(in srgb, var(--ewk-gold-500) 12%, transparent)',
      border: '1px solid var(--ewk-gold-600)',
      borderRadius: 'var(--radius-pill)',
      padding: '2px 9px'
    }
  }, skill)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      marginBottom: 10,
      flexWrap: 'wrap'
    }
  }, dice.map((d, i) => /*#__PURE__*/React.createElement(__ds_scope.FateDie, {
    key: i,
    value: d,
    size: 30
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--fs-lg)',
      fontWeight: 'var(--fw-bold)',
      color: 'var(--text-muted)',
      marginLeft: 4,
      fontVariantNumeric: 'tabular-nums'
    }
  }, modifier >= 0 ? `+${modifier}` : modifier)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 'var(--sp-3)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-serif)',
      fontSize: 'var(--fs-3xl)',
      fontWeight: 'var(--fw-black)',
      color: 'var(--text-strong)',
      lineHeight: 1,
      fontVariantNumeric: 'tabular-nums'
    }
  }, total >= 0 ? `+${total}` : total), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-serif)',
      fontStyle: 'italic',
      fontSize: 'var(--fs-md)',
      color: 'var(--ewk-gold-300)'
    }
  }, __ds_scope.ladderLabel(Math.max(-4, Math.min(8, total)))), difficulty != null && /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 'auto',
      fontSize: 'var(--fs-xs)',
      color: 'var(--text-faint)'
    }
  }, "\uBAA9\uD45C ", difficulty >= 0 ? `+${difficulty}` : difficulty)), outcome && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 9
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-block',
      fontSize: 'var(--fs-xs)',
      fontWeight: 'var(--fw-bold)',
      letterSpacing: 'var(--ls-label)',
      textTransform: 'uppercase',
      color: outcome.color,
      background: `color-mix(in srgb, ${outcome.color} 14%, transparent)`,
      border: `1px solid color-mix(in srgb, ${outcome.color} 40%, transparent)`,
      borderRadius: 'var(--radius-pill)',
      padding: '3px 14px'
    }
  }, outcome.label)));
}
Object.assign(__ds_scope, { RollCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/fate/RollCard.jsx", error: String((e && e.message) || e) }); }

// components/fate/SkillRung.jsx
try { (() => {
/**
 * SkillRung — one row of the skill ladder (기능 사다리).
 * Rank badge + skill name + roll/edit actions.
 */
function SkillRung({
  name = '',
  rank = 0,
  onRoll,
  actions = null
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--sp-3)',
      padding: '6px 10px',
      background: 'var(--surface-card)',
      border: '1px solid var(--border-strong)',
      borderRadius: 'var(--radius-sm)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 96,
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.LadderBadge, {
    rank: rank,
    size: "sm"
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--fs-base)',
      fontWeight: 'var(--fw-medium)',
      color: 'var(--text-body)'
    }
  }, name), onRoll && /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onRoll,
    title: "\uAD74\uB9AC\uAE30",
    style: {
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
      cursor: 'pointer'
    }
  }, "4dF"), actions);
}
Object.assign(__ds_scope, { SkillRung });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/fate/SkillRung.jsx", error: String((e && e.message) || e) }); }

// components/fate/StressTrack.jsx
try { (() => {
/**
 * StressTrack — a row of stress boxes (스트레스).
 * Crimson pips fill when checked. Read-only when onToggle omitted.
 */
function StressTrack({
  label = '스트레스',
  size = 4,
  checked = [],
  onToggle,
  actions = null
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface-card)',
      border: '1px solid var(--border-strong)',
      borderRadius: 'var(--radius-sm)',
      padding: '7px 10px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--sp-2)',
      marginBottom: 7
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--fs-xs)',
      fontWeight: 'var(--fw-semibold)',
      letterSpacing: 'var(--ls-wide)',
      color: 'var(--text-muted)'
    }
  }, label), actions), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 7,
      flexWrap: 'wrap'
    }
  }, Array.from({
    length: size
  }).map((_, i) => {
    const on = !!checked[i];
    return /*#__PURE__*/React.createElement("button", {
      key: i,
      type: "button",
      onClick: onToggle ? () => onToggle(i) : undefined,
      title: `${i + 1}`,
      style: {
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
        transition: 'background var(--dur-fast), box-shadow var(--dur-fast)'
      }
    }, i + 1);
  })));
}
Object.assign(__ds_scope, { StressTrack });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/fate/StressTrack.jsx", error: String((e && e.message) || e) }); }

// components/fate/StuntCard.jsx
try { (() => {
/**
 * StuntCard — a 특기 (stunt). Name, summary, and an optional
 * approach/mystery tag (강하게 / 똑똑하게 / 신비). House rule:
 * 초극자 & 마법사 stunts encode their personal 신비.
 */
function StuntCard({
  name = '',
  summary = '',
  approach = null,
  mystery = false,
  actions = null
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface-card)',
      border: '1px solid var(--border-strong)',
      borderRadius: 'var(--radius-sm)',
      borderTop: `2px solid ${mystery ? 'var(--ewk-aspect-longterm)' : 'var(--ewk-gold-600)'}`,
      padding: '9px 11px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--sp-2)',
      marginBottom: summary ? 5 : 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--fs-base)',
      fontWeight: 'var(--fw-bold)',
      color: 'var(--text-strong)'
    }
  }, name), approach && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--fs-2xs)',
      fontWeight: 'var(--fw-semibold)',
      letterSpacing: 'var(--ls-wide)',
      color: mystery ? 'var(--ewk-aspect-longterm)' : 'var(--ewk-gold-400)',
      background: mystery ? 'color-mix(in srgb, var(--ewk-aspect-longterm) 14%, transparent)' : 'color-mix(in srgb, var(--ewk-gold-500) 14%, transparent)',
      border: `1px solid ${mystery ? 'color-mix(in srgb, var(--ewk-aspect-longterm) 32%, transparent)' : 'var(--ewk-gold-600)'}`,
      borderRadius: 'var(--radius-pill)',
      padding: '1px 9px'
    }
  }, mystery ? '신비 · ' : '', approach), actions), summary && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--fs-sm)',
      lineHeight: 'var(--lh-normal)',
      color: 'var(--text-muted)'
    }
  }, summary));
}
Object.assign(__ds_scope, { StuntCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/fate/StuntCard.jsx", error: String((e && e.message) || e) }); }

// components/stage/ActorHUD.jsx
try { (() => {
/**
 * ActorHUD — the compact control card for one actor on the bottom HUD bar.
 * Shows portrait (active ring when speaking), name + division, fate points,
 * and stage controls (무대 추가 / 퇴장, 발언권).
 */
function ActorHUD({
  name = '',
  portrait = null,
  division = '',
  fatePoints = 3,
  onStage = false,
  active = false,
  onToggleStage,
  onSpeak
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: 210,
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--sp-3)',
      padding: '8px 10px',
      background: active ? 'linear-gradient(180deg, rgba(201,162,39,0.12), var(--ewk-ink-700))' : 'var(--ewk-ink-700)',
      border: `1px solid ${active ? 'var(--ewk-gold-600)' : 'var(--border-strong)'}`,
      borderRadius: 'var(--radius-md)',
      boxShadow: active ? 'var(--shadow-gold)' : 'var(--shadow-sm)',
      transition: 'border-color var(--dur-base), box-shadow var(--dur-base)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Avatar, {
    src: portrait,
    name: name,
    size: 46,
    shape: "frame",
    ring: active ? 'active' : onStage ? 'gold' : 'none'
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 'var(--fw-bold)',
      fontSize: 'var(--fs-sm)',
      color: 'var(--text-strong)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, name), division && /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--fs-2xs)',
      color: 'var(--text-faint)',
      letterSpacing: 'var(--ls-wide)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, division), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      marginTop: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-serif)',
      fontWeight: 'var(--fw-black)',
      fontSize: 'var(--fs-base)',
      color: 'var(--ewk-gold-300)',
      fontVariantNumeric: 'tabular-nums',
      lineHeight: 1
    }
  }, fatePoints), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--fs-2xs)',
      color: 'var(--text-muted)',
      letterSpacing: 'var(--ls-wide)'
    }
  }, "\uC6B4\uBA85\uC810"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 5
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onToggleStage,
    title: onStage ? '무대에서 퇴장' : '무대에 추가',
    style: {
      width: 30,
      height: 30,
      borderRadius: 'var(--radius-sm)',
      border: `1px solid ${onStage ? 'var(--ewk-crimson-700)' : 'var(--ewk-gold-600)'}`,
      background: onStage ? 'color-mix(in srgb, var(--ewk-crimson-600) 16%, transparent)' : 'transparent',
      color: onStage ? 'var(--ewk-crimson-400)' : 'var(--ewk-gold-400)',
      cursor: 'pointer',
      fontSize: 'var(--fs-base)',
      lineHeight: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, onStage ? '−' : '+'), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onSpeak,
    title: "\uBC1C\uC5B8\uAD8C (\uBB34\uB300\uC5D0 \uB300\uC0AC \uD45C\uCD9C)",
    disabled: !onStage,
    style: {
      width: 30,
      height: 30,
      borderRadius: 'var(--radius-sm)',
      border: `1px solid ${active ? 'var(--ewk-gold-500)' : 'var(--border-hairline)'}`,
      background: active ? 'var(--ewk-gold-500)' : 'transparent',
      color: active ? 'var(--ewk-ink-900)' : 'var(--text-muted)',
      cursor: onStage ? 'pointer' : 'not-allowed',
      opacity: onStage ? 1 : 0.4,
      fontSize: 'var(--fs-sm)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: "fa fa-comment"
  }))));
}
Object.assign(__ds_scope, { ActorHUD });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/stage/ActorHUD.jsx", error: String((e && e.message) || e) }); }

// components/stage/ChatLine.jsx
try { (() => {
/**
 * ChatLine — one line of the novel-style play log.
 * variant:
 *   'narration' — GM scene prose (no speaker, serif block)
 *   'dialogue'  — a character speaks (portrait + name + quote)
 *   'narrator'  — 나레이터 voice (italic, no portrait)
 *   'system'    — mechanical note (키워드 획득, 면모 추가 …)
 * Designed to read like a printed novel: serif body, generous
 * leading, restrained chrome.
 */
function ChatLine({
  variant = 'narration',
  speaker = '',
  portrait = null,
  time = null,
  accent = 'var(--ewk-gold-500)',
  children
}) {
  if (variant === 'system') {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--sp-2)',
        margin: '10px 0',
        padding: '6px 12px',
        borderLeft: '2px solid var(--ewk-gold-600)',
        background: 'rgba(201,162,39,0.06)',
        fontFamily: 'var(--font-sans)',
        fontSize: 'var(--fs-sm)',
        color: 'var(--ewk-gold-300)',
        letterSpacing: 'var(--ls-wide)'
      }
    }, /*#__PURE__*/React.createElement("i", {
      className: "fa fa-feather",
      style: {
        opacity: 0.7
      }
    }), /*#__PURE__*/React.createElement("span", null, children));
  }
  if (variant === 'narration') {
    return /*#__PURE__*/React.createElement("p", {
      style: {
        margin: '14px 0',
        fontFamily: 'var(--font-serif)',
        fontSize: 'var(--fs-prose)',
        lineHeight: 'var(--lh-prose)',
        color: 'var(--ewk-steel-100)',
        textIndent: '1.1em',
        textWrap: 'pretty'
      }
    }, children);
  }
  if (variant === 'narrator') {
    return /*#__PURE__*/React.createElement("p", {
      style: {
        margin: '14px 0 14px 1.6em',
        fontFamily: 'var(--font-serif)',
        fontStyle: 'italic',
        fontSize: 'var(--fs-prose)',
        lineHeight: 'var(--lh-prose)',
        color: 'var(--ewk-steel-200)',
        borderLeft: '2px solid var(--border-hairline)',
        paddingLeft: '1em',
        textWrap: 'pretty'
      }
    }, children);
  }

  // dialogue
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 'var(--sp-3)',
      margin: '16px 0'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flexShrink: 0,
      paddingTop: 2
    }
  }, portrait ? /*#__PURE__*/React.createElement("img", {
    src: portrait,
    alt: speaker,
    style: {
      width: 40,
      height: 40,
      borderRadius: '50%',
      objectFit: 'cover',
      border: `2px solid ${accent}`
    }
  }) : /*#__PURE__*/React.createElement("div", {
    style: {
      width: 40,
      height: 40,
      borderRadius: '50%',
      border: `2px solid ${accent}`,
      background: 'var(--ewk-ink-650)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--font-serif)',
      fontWeight: 'var(--fw-bold)',
      color: 'var(--text-muted)',
      fontSize: 'var(--fs-base)'
    }
  }, speaker.slice(0, 1))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 'var(--sp-2)',
      marginBottom: 3
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 'var(--fw-bold)',
      fontSize: 'var(--fs-speaker)',
      color: accent,
      letterSpacing: 'var(--ls-wide)'
    }
  }, speaker), time && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--fs-2xs)',
      color: 'var(--text-faint)'
    }
  }, time)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-serif)',
      fontSize: 'var(--fs-prose)',
      lineHeight: 'var(--lh-prose)',
      color: 'var(--ewk-steel-050)',
      textWrap: 'pretty'
    }
  }, children)));
}
Object.assign(__ds_scope, { ChatLine });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/stage/ChatLine.jsx", error: String((e && e.message) || e) }); }

// components/stage/SceneCard.jsx
try { (() => {
/**
 * SceneCard — a scene in the director's rail (장면 활성화/이동).
 * Click-to-activate; the active scene gets a gold frame + glow,
 * and its background image fills the stage.
 */
function SceneCard({
  name = '',
  chapter = '',
  thumbnail = null,
  active = false,
  onActivate
}) {
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onActivate,
    title: name,
    style: {
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
      transition: 'border-color var(--dur-base), box-shadow var(--dur-base), transform var(--dur-fast)'
    },
    onMouseEnter: e => {
      if (!active) e.currentTarget.style.transform = 'translateY(-2px)';
    },
    onMouseLeave: e => {
      e.currentTarget.style.transform = 'none';
    }
  }, thumbnail ? /*#__PURE__*/React.createElement("img", {
    src: thumbnail,
    alt: name,
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      display: 'block'
    }
  }) : /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100%',
      height: '100%',
      background: 'repeating-linear-gradient(135deg, var(--ewk-ink-700) 0 10px, var(--ewk-ink-650) 10px 20px)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'linear-gradient(180deg, rgba(10,11,15,0) 40%, rgba(10,11,15,0.85) 100%)'
    }
  }), active && /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: 6,
      left: 6,
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--fs-2xs)',
      fontWeight: 'var(--fw-bold)',
      letterSpacing: 'var(--ls-label)',
      textTransform: 'uppercase',
      color: 'var(--ewk-ink-900)',
      background: 'var(--ewk-gold-500)',
      borderRadius: 'var(--radius-xs)',
      padding: '1px 6px'
    }
  }, "ON AIR"), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 8,
      right: 8,
      bottom: 6,
      textAlign: 'left'
    }
  }, chapter && /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: '9px',
      fontWeight: 'var(--fw-semibold)',
      letterSpacing: 'var(--ls-wide)',
      color: 'var(--ewk-gold-300)',
      marginBottom: 1
    }
  }, chapter), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-serif)',
      fontSize: 'var(--fs-sm)',
      fontWeight: 'var(--fw-bold)',
      color: '#fff',
      lineHeight: 'var(--lh-tight)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, name)));
}
Object.assign(__ds_scope, { SceneCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/stage/SceneCard.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Avatar = __ds_scope.Avatar;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.Tabs = __ds_scope.Tabs;

__ds_ns.AspectChip = __ds_scope.AspectChip;

__ds_ns.FateDie = __ds_scope.FateDie;

__ds_ns.FatePoints = __ds_scope.FatePoints;

__ds_ns.LADDER = __ds_scope.LADDER;

__ds_ns.LadderBadge = __ds_scope.LadderBadge;

__ds_ns.RollCard = __ds_scope.RollCard;

__ds_ns.SkillRung = __ds_scope.SkillRung;

__ds_ns.StressTrack = __ds_scope.StressTrack;

__ds_ns.StuntCard = __ds_scope.StuntCard;

__ds_ns.ActorHUD = __ds_scope.ActorHUD;

__ds_ns.ChatLine = __ds_scope.ChatLine;

__ds_ns.SceneCard = __ds_scope.SceneCard;

})();
