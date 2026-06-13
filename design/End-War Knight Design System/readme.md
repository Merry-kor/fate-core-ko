# End-War Knight Design System

> 종전의 기사 (The End-War Knight System) — Fate Core TRPG for Foundry VTT  
> Korean dieselpunk/magitech imperial setting. Visual identity: ink-black + gunmetal steel, imperial gold, eagle-banner crimson, warm printed parchment.

---

## Sources & References

This design system was built from the following materials. Access them for deeper design context:

| Resource | Location | Notes |
|----------|----------|-------|
| **Foundry VTT module (codebase)** | `foundry-fate-core/` (local mount) | Main system: templates, CSS, lang |
| **GitHub: fate-core-ko** | https://github.com/Merry-kor/fate-core-ko | Foundry TRPG system, Korean |
| **GitHub: novel-chat-ui** | https://github.com/Merry-kor/novel-chat-ui | Novel-style chat FVTT module |
| **GitHub: stage-speaker** | https://github.com/Merry-kor/stage-speaker | VN-style speaker system |
| **GitHub: scene-director** | https://github.com/Merry-kor/scene-director | Scene management module |
| **GitHub: stage-hotbar** | https://github.com/Merry-kor/stage-hotbar | Actor HUD bar |
| **GitHub: fate-roll-styler** | https://github.com/Merry-kor/fate-roll-styler | Roll result styling |
| **GitHub: The-End-War-Knight-System** | https://github.com/Merry-kor/The-End-War-Knight-System | Core system (409 error — may be private) |
| **PC setting files** | `uploads/` | Character backgrounds, aspects, stunts |
| **Session logs** | `uploads/log_*.txt` | Prologue + Ch1 + Ch2 play logs |
| **PC portraits** | `assets/portraits/` | Anime-style character art (PNG with transparency) |
| **Fonts** | Google Fonts CDN | Noto Sans KR + Noto Serif KR + IBM Plex Mono |

> ⚠️ **Font note:** The original `Noto_Sans_KR,Noto_Serif_KR.zip` and image zips were uploaded but arrived as .zip paths without extraction. Google Fonts CDN substitutes are used. Provide extracted font files to `assets/fonts/` for self-hosted operation in FVTT.

---

## Product Context

**종전의 기사** (The End-War Knight System) is a bespoke campaign setting for **페이트 코어 한국어판** (Fate Core, Korean edition) running on **Foundry Virtual Tabletop (FVTT)**.

**Setting:** A dieselpunk/magitech empire — the **레스타 제국 (Lesta Empire)** — modeled after an allegorical fascist state with a black eagle banner, neoclassical architecture, and golden sun iconography. Magic is called **신비 (Mystery/Mystery-Power)** — personal, indefinable, and each practitioner's definition is unique.

**The party (제1사단 스피어헤드 특임 위관조):**
| PC | Player | Identity Aspect |
|----|--------|-----------------|
| **베티와 알렉스** (Betty & Alex) | 초갠 | 뒷골목 출신의 스피어헤드 타격부대 기사 |
| **이반 이바노비치** (Ivan Ivanovich) | 0N3Z3R0 | 청부업자에서 스피어헤드가 된 살아있는 병기창 |
| **루** (Lou) | 탱곰 | 제국의 마스코트가 된 공명의 영물 수달 |
| **안야 슈탈** (Anya Stahl) | 다시마 | 고철을 부리는 스피어헤드의 뒷골목 이단아 |

**GM:** 메리메리

---

## Content Fundamentals

**Language & tone:**
- Korean (한국어) primary. Imperial titles/proper nouns sometimes romanized or given German inflection (Stahl, von Arnim, von Walter — echoing Weimar/Third Reich aesthetics).
- Narrative prose is **literary**, **weighty**, never casual. Session logs read like a serialized novel.
- GM narration uses second-person (여러분, 당신들) — the group is addressed as a collective.
- Character dialogue is first-person, strongly voiced per character:  
  - 베티/알렉스: blunt, impulsive ("들이박아보자고!"), casual profanity  
  - 이반: dry, sardonic, short sentences ("농담처럼 말하지만, 진심이 없는 적은 없다")  
  - 루: mock-formal via speech prosthetic, inner voice wild and ancient  
  - 안야: technical, blunt, wry ("렌치 들어")
- **Aspect names** are in italic serif — they're the most literary text in the UI.
- **No emoji** in production UI. Emoji only in OOC planning channels.
- **Korean Fate ladder words** are used verbatim: 전설적, 영웅적, 환상적, 엄청남, 대단함, 우수, 양호, 보통, 미약, 부실, 엉망.
- Roll action names in brackets: 「강하게」「세심하게」「기회 만들기」「극복」

---

## Visual Foundations

### Color system
- **Background:** Deep ink blacks (`#0a0b0f` → `#14161e`) — the empire's night
- **Primary accent:** Imperial gold (`#c9a227`) — the Sun on the Knight's back; glowing `box-shadow` at `0 0 18px rgba(201,162,39,0.3)`
- **Secondary accent:** Eagle crimson (`#b01f33`) — the banner, the Inquisition, stress
- **Neutrals:** Steel grey scale (`#3c4459` → `#e6e9f1`)
- **Parchment (log/print):** Warm paper `#f6efdd` with ink `#2a2317`
- **Aspect types** each have a semantic color (identity=gold, trouble=crimson, situation=blue, longterm=violet, stack=teal)

### Typography
- **Display/prose:** Noto Serif KR, weight 900/700, used for chapter titles, aspect text (italic), roll totals
- **UI chrome:** Noto Sans KR, weight 400–700, used for all labels, controls, metadata
- **Mono:** IBM Plex Mono for ladder numbers, timestamps, stack counters
- **Prose line-height:** 1.85 (generous, novel-like)
- **Label tracking:** `letter-spacing: 0.12em` for uppercase eyebrows

### Backgrounds
- Stage: full-bleed scene photography/illustration, `background-size: cover`
- Protection gradients over scenes: `linear-gradient(180deg, transparent 40%, rgba(10,11,15,0.72) 100%)`
- Card surfaces: flat dark ink with `1px solid` hairline borders — no image textures
- Print/log: cream parchment with subtle radial dot grid pattern

### Borders & radius
- Hard-edged, imperial — `border-radius: 2–6px` only; larger radius only for pill badges
- `border: 1px solid var(--ewk-steel-500)` hairlines; `border-left: 3px solid <accent>` for aspect type indicators
- Portrait frames use `border: 3px solid var(--ewk-gold-500)`

### Shadows
- Deep, cinematic: `0 12px 40px rgba(0,0,0,0.55)` for raised UI
- Gold glow: `0 0 0 1px var(--ewk-gold-600), 0 0 18px rgba(201,162,39,0.30)` for active actor
- Crimson glow: same pattern for stress/danger states

### Animation
- `--ease-out: cubic-bezier(0.22,1,0.36,1)` — fast, confident, slightly springy
- Speaker enter on stage: `0.5s` opacity+translateY fade-up
- Hover: `brightness(1.12)` filter — never color changes alone
- Press: `translateY(1px)` micro-sink
- Scroll transitions: 200ms opacity

### Hover / press states
- Buttons: `filter: brightness(1.12)` hover, `translateY(1px)` press
- Cards: `translateY(-2px)` hover lift
- Icon buttons: background tint + border appear
- Active actor HUD card: gold border + `box-shadow: var(--shadow-gold)`

### Cards
- `background: var(--surface-card)` (ink-700), `border: 1px solid var(--border-strong)`
- Section headers have a `border-bottom: 1px solid var(--border-strong)`
- Component top-accents (e.g. StuntCard): `border-top: 2px solid var(--ewk-gold-600)`

### Transparency & blur
- Aspect widget on stage: `backdrop-filter: blur(12px)`, `background: rgba(15,17,23,0.88)`
- HUD bar: `background: linear-gradient(180deg, var(--ewk-ink-900), rgba(10,11,15,0.95))`
- Blur used sparingly — only for floating panels over the stage background

### Imagery
- Character portraits: anime-style illustration with transparent backgrounds (PNG)
- Scene backgrounds: atmosphere-first, dark (desaturated, low-key)
- Print log: sepia-filtered (`filter: sepia(0.2) contrast(1.05)`) scene images
- No AI-generated imagery in the system (user-supplied PNGs only)

---

## Iconography

The system uses **Font Awesome 6 Free** (CDN) for all UI icons:
- `fa-dice` / `fa-dice-d20` — roll actions
- `fa-cog` — edit/settings
- `fa-trash` — delete
- `fa-comment` — speak/dialogue  
- `fa-feather` — system/aspect notes
- `fa-plus` / `fa-minus` — add/remove controls

**Korean typography as iconography:** The faction emblem uses the kanji `終` (end/finale) as the central glyph in a golden disc, surrounded by CSS-drawn sun rays and steel wings. This is the system's primary brand mark.

**No SVG illustrations drawn by the system.** All character art and scene imagery is user-supplied.

---

## File Index

### Foundation tokens
| File | Purpose |
|------|---------|
| `styles.css` | Root entry point — `@import` list only |
| `tokens/colors.css` | Ink, steel, gold, crimson, parchment, semantic aliases, outcome & aspect semantics |
| `tokens/typography.css` | Font families, type scale, weights, line-heights, letter-spacing |
| `tokens/spacing.css` | Spacing, radius, borders, shadows, motion, layout constants |
| `tokens/fonts.css` | Google Fonts CDN import (Noto Sans KR, Noto Serif KR, IBM Plex Mono) |

### Components
| Directory | Components |
|-----------|-----------|
| `components/core/` | Button, IconButton, Badge, Avatar, Tabs |
| `components/fate/` | LadderBadge, AspectChip, StressTrack, SkillRung, StuntCard, FatePoints, FateDie, RollCard |
| `components/stage/` | ChatLine, ActorHUD, SceneCard |

### Guidelines (DS tab cards)
| File | Shows |
|------|-------|
| `guidelines/brand-emblem.card.html` | Wordmark + steel-wing emblem |
| `guidelines/brand-surfaces.card.html` | Dark UI vs printed parchment |
| `guidelines/colors-ink.card.html` | Ink/steel dark surfaces |
| `guidelines/colors-gold.card.html` | Imperial gold scale |
| `guidelines/colors-crimson.card.html` | Eagle crimson scale |
| `guidelines/colors-parchment.card.html` | Print/log warm paper palette |
| `guidelines/colors-outcome.card.html` | Roll outcome semantics |
| `guidelines/colors-aspects.card.html` | Aspect-type color semantics |
| `guidelines/type-serif.card.html` | Noto Serif KR display & prose |
| `guidelines/type-sans.card.html` | Noto Sans KR UI scale |
| `guidelines/type-ladder.card.html` | Fate ladder words |
| `guidelines/spacing-scale.card.html` | 4px spacing scale |
| `guidelines/spacing-radii.card.html` | Radius & border-width system |
| `guidelines/spacing-shadows.card.html` | Elevation & glow system |

### UI Kits
| File | Description |
|------|-------------|
| `ui_kits/character-sheet/index.html` | **Fate Core character sheet** — pure HTML/CSS, CSS-only tabs, no JS. Populated with 안야 슈탈. Ready to adapt as FVTT `.hbs` template. |
| `ui_kits/vtt-stage/index.html` | **Full VTT stage prototype** — all 12 features: stage HUD, VN speaker, resizable novel chat, aspect widget, scene rail, actor management. |

### Templates
| File | Description |
|------|-------------|
| `templates/play-log/index.html` | **B5 printable play log** —레제 드라마 양식 play script. Scene images, roll cards with print-sized dice, dialogue formatting. Print→PDF via browser. |
| `templates/play-log/ds-base.js` | Design system loader for templates |

### Assets
| Path | Contents |
|------|---------|
| `assets/portraits/` | betty-casual/uniform/with-alex, alex-casual/uniform, ivan, lou, anya, anya-casual (all user-supplied PNG) + procedural placeholder portraits (ivan/anya/etc.png from earlier passes — **superseded by real art**) |
| `assets/scenes/` | square.jpg, train.jpg, office.jpg, city.jpg (procedurally generated atmospheric placeholders) |
