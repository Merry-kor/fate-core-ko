# fate-core-ko 프로젝트 컨텍스트

## 프로젝트 개요
- FoundryVTT v13.351용 페이트 코어 한국어 시스템 (`fate-core-ko`)
- End-War Knight Design System (EWK) 적용
- GitHub: `Merry-kor/fate-core-ko`

## 서버 정보
- Oracle Cloud: `138.2.118.109`
- SSH 키: `C:\Users\lunah\Desktop\FVTT\ssh-key-2025-09-162.key`
- 시스템 경로: `/home/ubuntu/FoundryServer/foundrydata/Data/systems/fate-core-ko/`
- Docker 재시작: `cd /home/ubuntu/FoundryServer && sudo docker compose restart foundryvtt`

## 배포 절차
```powershell
$key = "C:\Users\lunah\Desktop\FVTT\ssh-key-2025-09-162.key"
# 1) SCP로 /tmp에 업로드
scp -i $key -o StrictHostKeyChecking=no <파일> ubuntu@138.2.118.109:/tmp/fate-deploy/<경로>/
# 2) SSH로 복사 + 재시작
ssh -i $key ubuntu@138.2.118.109 "sudo cp /tmp/fate-deploy/... /home/ubuntu/.../fate-core-ko/... && cd /home/ubuntu/FoundryServer && sudo docker compose restart foundryvtt"
```
> `/home/ubuntu/FoundryServer/foundrydata/Data/systems/fate-core-ko/` 는 root 소유라 직접 SCP 불가. 반드시 /tmp 경유.

---

## 로컬 파일 경로
```
C:\Users\lunah\foundry-fate-core\
├── scripts\fate-core-ko.js        # 메인 JS (AppV2 기반)
├── styles\fate-core-ko.css        # EWK 디자인 CSS
├── templates\
│   ├── actor\character-sheet.hbs  # 캐릭터 시트
│   ├── item\item-sheet.hbs        # 아이템 시트
│   ├── chat\roll-card.hbs         # 주사위 결과 카드
│   └── stage\
│       ├── stage-bar.hbs          # 무대 하단 바
│       └── scene-panel.hbs        # 장면 면모 패널
├── lang\ko.json                   # 한국어 번역
├── template.json                  # 데이터 모델
├── system.json                    # 시스템 매니페스트
└── design\End-War Knight Design System\  # EWK 디자인 에셋
```

---

## v13 핵심 API 규칙
| 구버전 (v12) | v13 올바른 경로 |
|---|---|
| `Die` | `foundry.dice.terms.Die` |
| `Actors` | `foundry.documents.collections.Actors` |
| `ActorSheet` | `foundry.appv1.sheets.ActorSheet` |
| `ItemSheet` | `foundry.appv1.sheets.ItemSheet` |
| `renderTemplate()` | `foundry.applications.handlebars.renderTemplate()` |
| `renderChatMessage` hook | `renderChatMessageHTML` hook (html이 HTMLElement) |
| `ActorSheetV2` | `foundry.applications.sheets.ActorSheetV2` |
| `ItemSheetV2` | `foundry.applications.sheets.ItemSheetV2` |
| `ApplicationV2` | `foundry.applications.api.ApplicationV2` |
| `HandlebarsApplicationMixin` | `foundry.applications.api.HandlebarsApplicationMixin` |
| `DialogV2` | `foundry.applications.api.DialogV2` |
| `TokenHUD 상속` | ❌ 불가 — `Hooks.on("renderTokenHUD", ...)` 훅 사용 |
| `getSceneControlButtons` controls | v13에서 Map — `.find()` 불가, `.get()` 사용 |

---

## JS 구조 (fate-core-ko.js)

### FateDie
- `foundry.dice.terms.Die` 상속
- denomination: `"F"`, faces: 3
- result: 1=−, 2=□, 3=+

### FateCharacterSheet (AppV2)
```js
class FateCharacterSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  static DEFAULT_OPTIONS = {
    position: { width: 980, height: 720 },
    form: { submitOnChange: true, closeOnSubmit: false },
    actions: { rollSkill, adjustFP, invokeAspect, invokeStunt, addItem, deleteItem, editItem }
  }
}
```
- `_onRender`: 탭 전환 (this._activeTab으로 상태 유지), `data-item-field` change 핸들러, `data-item-name` change 핸들러, 스트레스 체크박스
- **중요**: `data-item-field` change 이벤트에 반드시 `e.stopPropagation()` — 없으면 submitOnChange가 가로채서 재렌더됨
- `_prepareContext`: ladder 한글화, aspectTypes 배열 생성

### FateItemSheet (AppV2)
- `form: { submitOnChange: true, closeOnSubmit: false }`
- item 자체 시트이므로 `name=` 속성으로 저장 가능

### Token HUD
- 클래스 상속 불가 → `Hooks.on("renderTokenHUD", (hud, html, data) => {...})`
- 운명점 +/−, 스트레스 체크박스, 무대 등장/퇴장 버튼 DOM 주입

### FateStageBar (plain object)
- `document.getElementById("interface")`에 고정 `div` 삽입
- `foundry.applications.handlebars.renderTemplate()`으로 HBS 렌더
- actor flag `fate-core-ko.onStage`, `fate-core-ko.isSpeaker` 사용
- `Hooks.on("updateActor", ...)`, `Hooks.on("deleteActor", ...)` 로 자동 갱신

### FateScenePanel (AppV2)
- `foundry.applications.api.HandlebarsApplicationMixin(ApplicationV2)` 상속
- 장면 flag `fate-core-ko.aspects` 배열 `[{id, label, type}]` 저장
- 장면 컨트롤 버튼으로 토글

### getSceneControlButtons (v13)
```js
Hooks.on("getSceneControlButtons", controls => {
  const tokenGroup = typeof controls.get === "function"
    ? controls.get("token")
    : Array.isArray(controls) ? controls.find(c => c.name === "token") : null;
  const tools = tokenGroup?.tools ?? tokenGroup?.buttons;
  if (typeof tools.set === "function") tools.set("fate-scene-aspects", entry);
  else if (Array.isArray(tools)) tools.push(entry);
});
```

### Chat 스타일링
```js
Hooks.on("renderChatMessageHTML", (message, html) => { ... })
// 배우 발언 → ewk-chat--dialogue (초상화 + 골드 라인)
// 서술 → ewk-chat--narration (이탤릭)
// 주사위 → ewk-chat--roll
```

---

## HBS 핵심 패턴

### 아이템 인라인 편집
```hbs
{{!-- 아이템 필드: name= 금지, data-item-field= 사용 --}}
<li data-item-id="{{item.id}}">
  <input data-item-field="system.label" value="{{item.system.label}}">
  <select data-item-field="system.aspectType">...</select>
</li>
```

### 면모 타입 select 스코프
```hbs
{{#each aspects as |aspect|}}
  {{#each ../aspectTypes as |t|}}
    {{!-- ../system.aspectType (not ../../) --}}
    <option value="{{t.value}}" {{#if (eq t.value ../system.aspectType)}}selected{{/if}}>
  {{/each}}
{{/each}}
```

### each_times 헬퍼
```js
Handlebars.registerHelper("each_times", function(n, options) {
  let result = "";
  for (let i = 0; i < n; i++)
    result += options.fn(this, { data: options.data, blockParams: [i] });
  return result;
});
// HBS: {{#each_times track.system.size}} {{@index}} {{/each_times}}
```

### 스트레스 박스
```hbs
<input type="checkbox" data-stress-index="{{@index}}"
  {{#if (lookup ../track.system.checked @index)}}checked{{/if}}>
```

---

## 데이터 모델 (template.json)

### Actor
- `character`, `npc` 타입 공통
- `system.biography`, `system.notes`, `system.fatepoints.current`, `system.fatepoints.refresh`

### Item 타입
| 타입 | 주요 필드 |
|---|---|
| aspect | `label`, `aspectType` (identity/trouble/general/situation/longterm/stack), `invoke` |
| skill | `rank` (-4~8) |
| stunt | `summary` |
| stress | `size`, `checked[]` |
| consequence | `severity`, `value`, `active` |
| extra | `summary` |

---

## EWK 디자인 토큰 (CSS 변수)
```css
--ewk-ink-900: #0a0b0f    /* 가장 어두운 배경 */
--accent-gold: #c9a227     /* 황금 강조 */
--accent-gold-bright: #e8c547
--accent-crimson: #b01f33  /* 위험/스트레스 */
--font-serif: 'Noto Serif KR'
--font-sans: 'Noto Sans KR'
--font-mono: 'IBM Plex Mono'
```

---

## 완료된 기능
- [x] EWK 디자인 시스템 전체 적용
- [x] 캐릭터 시트 열기/저장 (AppV2)
- [x] 이미지 업로드 (`data-action="editImage"`)
- [x] 면모 타입 선택 + 인라인 편집 + 저장
- [x] 면모/특기 채팅 표시 (💬)
- [x] 기능 수준 한글+숫자 표시 (`+2 양호`)
- [x] 스트레스 체크박스 즉시 저장
- [x] 일대기/메모 textarea 저장
- [x] 탭 전환 상태 유지 (재렌더 후 복원)
- [x] 타격 텍스트 입력 (stopPropagation 수정)
- [x] 특기 이름 인라인 편집 + 채팅 표시
- [x] Token HUD — 운명점, 스트레스, 무대 등장 버튼
- [x] Stage Bar — 하단 배우 카드 (운명점 조작, 발언권, 퇴장)
- [x] Scene Panel — 장면 면모 플로팅 패널
- [x] Chat 스타일링 (대화/서술 구분)

## 미완료 / 확인 필요
- [ ] `getSceneControlButtons` v13 정확한 controls 구조 확인 (현재 에러 없음이나 버튼이 표시되는지 미확인)
- [ ] Stage Bar 실제 렌더 확인 (활성 장면 없을 때 canvas 미초기화 문제 가능)
- [ ] 음악 재생 통합
- [ ] 파일 업로드 통합 (FVTT 내장 파일 피커 외)

---

## 알려진 v13 버그/주의사항
1. **AppV2 form submitOnChange**: 임베디드 아이템 필드는 `name=` 사용 금지. `data-item-field` + change 핸들러 + `e.stopPropagation()` 필수
2. **HBS 스코프**: `{{#each aspects}}` 안에서 `{{#each ../aspectTypes}}`일 때 외부 aspect 참조는 `../system.field` (not `../../`)
3. **TokenHUD 상속**: `foundry.appv1.hud.TokenHUD` 경로 없음 → hook 사용
4. **renderTemplate**: 전역 함수 deprecated → `foundry.applications.handlebars.renderTemplate()`
5. **renderChatMessage**: deprecated → `renderChatMessageHTML`
6. **getSceneControlButtons**: controls가 Array가 아닌 Map
7. **`{{editor}}` 헬퍼**: AppV2에서 작동 안 함 → `<textarea name="system.biography">` 사용
