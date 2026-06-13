---
name: end-war-knight-design
description: Use this skill to generate well-branded interfaces and assets for 종전의 기사 (The End-War Knight System) — a Korean Fate Core TRPG running on Foundry VTT. Contains essential design guidelines, visual tokens, UI components, character sheet, VTT stage UI, and printable log templates for the imperial dieselpunk setting.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.

## Key design principles (quick ref)

**Colors:** ink-black background (`#14161e`), imperial gold (`#c9a227`) as primary accent, eagle crimson (`#b01f33`) for stress/danger, warm parchment (`#f6efdd`) for print. Reference `tokens/colors.css` for all tokens.

**Type:** Noto Serif KR (display + prose, italic for aspects) + Noto Sans KR (UI chrome). Use `--fs-prose` + `--lh-prose: 1.85` for novel-style reading text.

**Aspect chips:** always italic serif with a left accent bar colored by type (identity=gold, trouble=crimson, situation=blue, longterm=violet, stack=teal).

**Roll cards:** show 4 FateDie components, modifier, total on the ladder (+N 단어), optional outcome pill (압도적 성공 / 성공 / 동점 / 실패).

**The two surfaces:** dark imperial UI (stage, HUD, character sheet) vs warm parchment (printed play log, B5).

## Components available

`window.EndWarKnightDesignSystem_000168.{ComponentName}` — load via `_ds_bundle.js`.

Core: Button, IconButton, Badge, Avatar, Tabs  
Fate: LadderBadge, AspectChip, StressTrack, SkillRung, StuntCard, FatePoints, FateDie, RollCard  
Stage: ChatLine, ActorHUD, SceneCard

## UI kits

- `ui_kits/character-sheet/index.html` — Fate Core sheet (pure HTML/CSS, for FVTT)
- `ui_kits/vtt-stage/index.html` — Full VTT stage prototype

## Template

- `templates/play-log/index.html` — B5 printable play log (PDF-ready)

## Character data (for mock content)

**Party:** 베티와 알렉스 (중위, 쌍둥이 전승 마법사), 이반 이바노비치 (상사, 무기 소환), 루 (소위, 영물 수달, 환원의 신비), 안야 슈탈 (소위, 고철 마법사)  
**GM:** 메리메리  
**Setting:** 레스타 제국, 제1사단 스피어헤드 특임 위관조  
**Portrait paths:** `assets/portraits/anya.png`, `ivan.png`, `lou.png`, `betty-uniform.png`, `alex-uniform.png`, `betty-casual.png`, `betty-alex.png`  
**Scene paths:** `assets/scenes/train.jpg`, `square.jpg`, `city.jpg`, `office.jpg`

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.
