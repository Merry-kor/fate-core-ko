/* ════════════════════════════════════════════════════════════
   시공열차 — 월드 세팅 설치기
   채팅에 /세계설치 (GM 전용) → 씬·액터·매크로·저널 자동 생성.
   이미 같은 이름이 있으면 건너뛰므로 여러 번 실행해도 안전.
   필요 조건: 디자인 zip의 assets 폴더가
   modules/shigong-archive-theme/assets/ 에 복사되어 있을 것.
   ════════════════════════════════════════════════════════════ */

const SG_MOD = "shigong-archive-theme";
const AP = (sub) => `modules/${SG_MOD}/assets/${sub}`;

/* [파일, 이름, 가로, 세로, 폴더] — 실측 해상도 */
const SG_SCENES = [
  /* 장소 */
  ["locations/A-ruins.png", "A시 — 폐허", 2912, 1632, "loc"],
  ["locations/A-ruins-2.png", "A시 — 폐허 II", 2912, 1632, "loc"],
  ["locations/A-center.png", "A시 — 중심", 2976, 1632, "loc"],
  ["locations/A-boundary.png", "A시 — 경계", 1488, 816, "loc"],
  ["locations/A-rainbow.png", "A시 — 무지개", 2976, 1632, "loc"],
  ["locations/alexandria-interior.png", "알렉산드리아 — 내부", 1488, 816, "loc"],
  ["locations/alexandria-exterior.png", "알렉산드리아 — 외부", 2976, 1632, "loc"],
  ["locations/alexandria-moonlit.png", "알렉산드리아 — 월광", 2976, 1632, "loc"],
  ["locations/alexandria-eclipse.png", "알렉산드리아 — 일식", 2976, 1632, "loc"],
  ["locations/london-1890.png", "1890 런던", 2976, 1632, "loc"],
  ["locations/london-1890-evening.png", "1890 런던 — 저녁", 2976, 1632, "loc"],
  ["locations/london.png", "런던 — 부감", 1488, 816, "loc"],
  ["locations/europe-13c.jpg", "13세기 유럽", 2976, 1632, "loc"],
  ["locations/arkham.png", "아캄", 2976, 1632, "loc"],
  ["locations/office-night.png", "사무실 — 밤", 1488, 816, "loc"],
  ["locations/room.png", "방", 896, 596, "loc"],
  /* 객차 */
  ["backgrounds/carriage-day.png", "객차 — 낮", 2976, 1632, "car"],
  ["backgrounds/carriage-sunset.png", "객차 — 석양", 2976, 1632, "car"],
  ["backgrounds/carriage-evening.png", "객차 — 저녁", 2976, 1632, "car"],
  ["backgrounds/carriage-night.png", "객차 — 밤", 2976, 1632, "car"],
  ["backgrounds/dining-car.png", "식당칸", 2976, 1632, "car"],
  ["backgrounds/sleeper-1.png", "침대칸 I", 2976, 1632, "car"],
  ["backgrounds/sleeper-2.png", "침대칸 II", 2976, 1632, "car"],
  ["backgrounds/window-view.jpg", "차창 풍경", 2976, 1632, "car"],
  ["backgrounds/sky.png", "하늘", 2976, 1632, "car"],
  ["backgrounds/fall.png", "추락", 2976, 1632, "car"],
  ["backgrounds/sunset-field.png", "석양 들판", 2976, 1632, "car"],
];

/* [파일, 이름, 타입, 소속, 토큰파일(선택)] */
const SG_ACTORS = [
  ["characters/haseweon-standing.png", "하세원", "passenger", "승객", null],
  ["characters/kangshinhong-standing.png", "강신홍", "passenger", "승무원", null],
  ["characters/dior-standing.png", "디올", "passenger", "승객", null],
  ["characters/nodorae-standing.png", "노도래", "passenger", "승객", null],
  ["characters/kimsejin-standing.png", "김세진", "passenger", "승객", null],
  ["characters/conductor-standing.png", "기관장", "passenger", "승무원", null],
  ["characters/driver-standing.png", "운전사", "passenger", "승무원", null],
  ["characters/stationmaster-standing.png", "역무원", "passenger", "승무원", null],
  ["characters/geuseundae-standing.png", "그슨대", "entity", "괴이", "tokens/geuseundae-token.png"],
  ["characters/darkness-standing.png", "어둠", "entity", "괴이", null],
  ["characters/shadow-beast.png", "그림자 짐승", "entity", "괴이", null],
  ["tokens/eodugsini-tile.png", "어둑시니", "entity", "괴이", "tokens/eodugsini-tile.png"],
];

/* [이름, 아이콘, 스크립트, 핫바 슬롯] */
const SG_MACROS = [
  ["오감 판정", "icons/svg/eye.svg", `new Roll("4df").toMessage({speaker: ChatMessage.getSpeaker(), flavor: "🎲 오감 판정"});`, 1],
  ["불씨", "icons/svg/fire.svg", `ui.chat.processMessage("/state");`, 2],
  ["결계", "icons/svg/shield.svg", `ui.chat.processMessage("/card 영력결계");`, 3],
  ["관찰", "icons/svg/light.svg", `new Roll("4df").toMessage({speaker: ChatMessage.getSpeaker(), flavor: "🎲 관찰 판정"});`, 4],
  ["표 검사", "icons/svg/book.svg", `ChatMessage.create({ content: "<em>표를 보이시오.</em>", speaker: { alias: "역무원" } });`, 5],
];

const SG_JOURNAL_HTML = `
<p>13세기의 검은 숲에서 폐허가 된 A시까지 — <span class="tts-term">시공열차</span>는 시대와 시대 사이를 가로지른다.
객차에 오를 수 있는 자는 표를 가진 <span class="tts-term">승객</span>과 <span class="tts-term">불씨</span>를 다루는 <span class="tts-term">승무원</span>뿐이다.</p>
<p>그 외의 무언가가 객차에 닿는 것은 곧 <span class="tts-term">어둠</span>이 가까웠다는 신호다.</p>`;

async function sgEnsureFolder(name, type) {
  return (
    game.folders.find((f) => f.type === type && f.name === name) ??
    (await Folder.create({ name, type }))
  );
}

async function sgInstallWorld() {
  if (!game.user.isGM) return ui.notifications.warn("GM만 실행할 수 있습니다.");
  ui.notifications.info("시공열차 월드 세팅을 설치합니다…");
  const made = { 씬: 0, 액터: 0, 매크로: 0, 저널: 0 };

  /* 씬 — v14부터 배경은 씬 속성이 아니라 Level 문서에 들어감 */
  const ensureBackground = async (scene, src) => {
    const levels = scene.levels?.contents ?? [];
    /* 기본 Level(씬 생성 시 자동 생성됨)에 배경을 직접 넣는다 */
    const primary = levels.find((l) => l.name !== "배경") ?? levels[0];
    if (primary && !primary.background?.src) {
      await primary.update({ "background.src": src });
    }
    /* 과거 설치기가 만든 잉여 "배경" Level 제거 */
    const extras = levels.filter((l) => l !== primary && l.name === "배경");
    if (extras.length) {
      await scene.deleteEmbeddedDocuments("Level", extras.map((l) => l.id));
    }
  };

  const fLoc = await sgEnsureFolder("시공열차 — 장소", "Scene");
  const fCar = await sgEnsureFolder("시공열차 — 객차", "Scene");
  for (const [file, name, w, h, group] of SG_SCENES) {
    let scene = game.scenes.getName(name);
    if (!scene) {
      scene = await Scene.create({
        name,
        folder: (group === "car" ? fCar : fLoc).id,
        width: w, height: h,
        padding: 0,
        grid: { type: 0, size: 100 },
        tokenVision: false,
        fog: { exploration: false },
        backgroundColor: "#05060C",
        navigation: false,
      });
      made.씬++;
    }
    /* 기존 씬이라도 배경 Level이 없으면 채워 넣음 (구버전 설치 복구) */
    await ensureBackground(scene, AP(file));
  }

  /* 액터 */
  const fPas = await sgEnsureFolder("시공열차 — 인물", "Actor");
  const fEnt = await sgEnsureFolder("시공열차 — 괴이", "Actor");
  for (const [file, name, type, aff, tokenFile] of SG_ACTORS) {
    if (game.actors.getName(name)) continue;
    await Actor.create({
      name, type,
      img: AP(file),
      folder: (type === "entity" ? fEnt : fPas).id,
      system: { affiliation: aff },
      prototypeToken: {
        texture: { src: AP(tokenFile ?? file) },
        ring: { enabled: true, colors: { ring: type === "entity" ? "#A03A3E" : "#E8923C" } },
        displayName: CONST.TOKEN_DISPLAY_MODES.ALWAYS,
      },
    });
    made.액터++;
  }

  /* 매크로 + 핫바 배치 */
  for (const [name, img, command, slot] of SG_MACROS) {
    let m = game.macros.getName(name);
    if (!m) {
      m = await Macro.create({ name, type: "script", img, command, scope: "global" });
      made.매크로++;
    }
    await game.user.assignHotbarMacro(m, slot);
  }

  /* 저널 */
  if (!game.journal.getName("시공열차 — 세계관")) {
    await JournalEntry.create({
      name: "시공열차 — 세계관",
      pages: [{ name: "세계관", type: "text", text: { content: SG_JOURNAL_HTML } }],
    });
    made.저널++;
  }

  ui.notifications.info(
    `설치 완료 — 씬 ${made.씬} · 액터 ${made.액터} · 매크로 ${made.매크로} · 저널 ${made.저널} (기존 항목은 건너뜀)`
  );
}

Hooks.once("init", () => {
  foundry.applications.sidebar.tabs.ChatLog.CHAT_COMMANDS.sgsetup = {
    rgx: /^\/(?:세계설치|setupworld)$/i,
    fn: async () => sgInstallWorld(),
    isRoll: false,
    isMultiline: false,
  };
});
