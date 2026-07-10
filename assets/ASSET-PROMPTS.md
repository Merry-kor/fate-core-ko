# 디자인 에셋 생성 가이드 (ChatGPT 이미지 생성용)

## 사용 방법

1. ChatGPT에서 **새 대화**를 열고 아래 프롬프트를 **하나씩** 붙여넣어 이미지를 생성합니다.
2. 마음에 들 때까지 "같은 스타일로 다시" 요청해도 됩니다 (프롬프트의 스타일 블록은 유지).
3. 생성된 이미지를 다운로드해서 **지정된 파일명**으로 저장:
   `C:\Users\lunah\foundry-fate-core\assets\generated\`
4. 다 모이면 저에게 "넣었어요"라고 알려주세요 — 검수 → 후처리(리사이즈·크롭·최적화) → UI 통합 → 배포를 진행합니다.

### 공통 규칙
- **투명 배경**이라고 표시된 것은 프롬프트에 이미 포함되어 있지만, 결과물이 불투명하면 "transparent background, PNG"를 강조해서 재생성하세요.
- 아이콘은 **스타일 통일**이 생명입니다 — 같은 대화 안에서 연속으로 생성하면 더 일관됩니다.
- 글자가 들어간 결과물은 피해주세요 (로고 제외). "no text"가 무시되면 재생성.

### 공통 스타일 블록 (모든 프롬프트에 이미 포함됨)
> dark imperial fantasy, muted gold (#c9a227) on near-black ink (#0e1015), elegant engraved line work, subtle wear and grit, cinematic, no text

---

## 🥇 1차 우선순위

### 1. 시스템 커버 (스토어/설치 목록의 얼굴)
**파일명**: `cover-main.png` · **크기**: 가로형(1536×1024 권장) · 불투명

```
A cinematic key visual for a dark visual-novel tabletop RPG system called "Fate Core".
A lone knight in worn imperial uniform stands on a war-torn ridge at dusk, long coat
moving in the wind, distant burning city on the horizon. Painterly, somber, dramatic
rim light. Color palette: near-black ink #0e1015, deep navy shadows, muted gold #c9a227
accents on the uniform trim and horizon light. Elegant, melancholic, high detail,
wide 3:2 composition with empty dark space in the upper third for a title.
No text, no watermark.
```

### 2. 시스템 엠블럼/로고
**파일명**: `logo-emblem.png` · 1024×1024 · **투명 배경**

```
A single ornate emblem for a dark fantasy RPG: four Fate dice (cubes marked with plus,
minus and blank faces) arranged in a diamond, framed by a laurel of engraved gold
filigree and a small five-pointed star at the top. Flat vector-style engraving,
muted gold #c9a227 line work with subtle gradient, on a fully transparent background.
Centered, symmetrical, clean silhouette, no text, PNG with transparency.
```

### 3~10. UI 아이콘 세트 (8종)
**공통**: 1024×1024 · **투명 배경** · 아래 프롬프트 뼈대에서 `[SUBJECT]`만 교체.
가능하면 **한 대화에서 연속 생성**하세요 (스타일 유지).

아이콘 공통 프롬프트 뼈대:
```
A single minimalist game UI icon: [SUBJECT]. Engraved line-art style, uniform stroke
weight, muted gold #c9a227 lines with faint inner glow, on a fully transparent
background. Centered, fits a circle, flat (no 3D), elegant dark-fantasy filigree
detail kept minimal. No text, PNG with transparency.
```

| 파일명 | [SUBJECT] |
|---|---|
| `icon-dice.png` | four small Fate dice (cubes with plus and minus faces) in a tight diamond cluster |
| `icon-fatepoint.png` | a glowing point of fate: a small star held between two crescent laurel branches |
| `icon-stage.png` | a classical theater mask (single, elegant, slightly tilted) |
| `icon-compel.png` | a balanced hanging scale with a small flame on one pan |
| `icon-turn.png` | two crossed knight swords with a small hourglass at the center |
| `icon-sound.png` | a medieval war horn with three small sound waves |
| `icon-journal.png` | an open book with a quill resting across it |
| `icon-flow.png` | an unrolled scroll with a branching path diagram drawn on it |

---

## 🥈 2차 우선순위

### 11. 금장 디바이더 (섹션 장식선)
**파일명**: `divider-gold.png` · 가로형 · **투명 배경**

```
A single horizontal ornamental divider for a dark fantasy UI: a thin elegant gold line
that swells into symmetrical engraved filigree at the center with a small diamond gem.
Very wide and short composition, muted gold #c9a227 with subtle shine, on a fully
transparent background. Flat engraving style, no text, PNG with transparency.
```

### 12. 다크 텍스처 (사이드바/위젯 배경용)
**파일명**: `texture-dark.png` · 1024×1024 · 불투명 · 심리스에 가깝게

```
A seamless subtle background texture: very dark blued steel with faint brushed metal
grain and barely visible damascus-like waves. Almost black #0e1015, extremely low
contrast (details only visible up close), no visible seams at the edges, tileable,
no text, no objects.
```

### 13. 양피지 텍스처 (저널 인쇄 테마용)
**파일명**: `texture-parchment.png` · 1024×1024 · 불투명

```
A seamless old parchment paper texture, warm cream #f6efdd with subtle fibers,
faint stains and gentle vignette-free even lighting. Low contrast, tileable,
no visible seams, no text, no objects.
```

### 14~17. 기본 초상화 실루엣 4종 (이미지 없는 액터용)
**공통**: 1024×1024 · 불투명(어두운 배경 포함) · `[VARIANT]`만 교체

```
A mysterious character portrait placeholder for a dark fantasy game: the bust
silhouette of [VARIANT] completely in shadow, only a faint gold #c9a227 rim light
tracing the outline, on a near-black #12141a background with subtle vignette.
No facial features visible, elegant and somber, no text.
```

| 파일명 | [VARIANT] |
|---|---|
| `ph-male.png` | a tall man in a high-collared military coat |
| `ph-female.png` | a woman with pinned-up hair and a caped uniform |
| `ph-hooded.png` | a hooded figure |
| `ph-beast.png` | a hulking inhuman creature with horns |

### 18~20. 저널 템플릿 샘플 삽화 교체 (권리 확실한 자체 생성본)
**공통**: 불투명

| 파일명 | 프롬프트 |
|---|---|
| `sample-portrait.png` (1024×1024) | `A painted portrait of a young archivist woman in a worn imperial uniform, short dark hair, tired but resolute eyes, holding a leather folder. Dark painterly style, near-black background, muted gold accents, cinematic rim light, no text.` |
| `sample-scene.png` (1536×1024) | `A matte-painting of a black iron fortress bridge spanning a misty gorge at dawn, war-era dark fantasy, tiny lanterns of a marching column crossing it. Somber palette, near-black shadows, muted gold dawn light, cinematic wide shot, no text.` |
| `sample-cover.png` (1536×1024) | `A dark atmospheric landscape of a border village under first snow at dusk, a single watchtower with one lit window, distant mountains. Melancholic dark fantasy matte painting, near-black and deep blue palette with one muted gold light source, wide shot, no text.` |

---

## 진행 상태 체크리스트

- [ ] 1차: cover-main, logo-emblem, icon 8종
- [ ] 2차: divider, texture 2종, ph 4종, sample 3종
