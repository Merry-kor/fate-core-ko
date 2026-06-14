/* ════════════════════════════════════════════════════════════
   Fate UI Helper — Fate Core용 편의기능 모듈 v0.3.0
   1. /fate [+N]       — 페이트 주사위(4dF)
   2. /card [이름]      — 능력/아이템 카드 출력 (+판정 버튼)
   3. /state            — 불씨/어둠 세션 상태 카드
   4. /ember +2, /dark 5 — 게이지 조정 (GM 전용, +- 는 증감 / 숫자만 쓰면 지정)
   5. 모듈 설정 → 카드 편집 / 게이지 최대값
   ════════════════════════════════════════════════════════════ */

const MODULE_ID = "shigong-archive-theme";

const DEFAULT_CARDS = {
  list: [
    {
      id: "sample-ward",
      name: "영력결계",
      kind: "승무원 권능 · WARD",
      icon: "fas fa-shield-halved",
      desc: "한 칸의 객차를 처용의 가면으로 봉한다. 어둠의 침투를 막는다.",
      cost: "페이트 포인트 1",
      zone: "존 1개",
      duration: "한 장면",
      bonus: "2",
    },
  ],
};

/* ── 저장소 헬퍼 ─────────────────────────────────────────── */
const getCards = () => game.settings.get(MODULE_ID, "cards")?.list ?? [];
const saveCards = (list) => game.settings.set(MODULE_ID, "cards", { list });
const getState = () => game.settings.get(MODULE_ID, "trackerState") ?? { ember: 0, dark: 0 };
const saveState = (s) => game.settings.set(MODULE_ID, "trackerState", s);

/* ── 카드 출력 ───────────────────────────────────────────── */
function postCard(card) {
  const esc = foundry.utils.escapeHTML ?? ((s) => s);
  const stats = [
    ["소모", card.cost],
    ["범위", card.zone],
    ["지속", card.duration],
  ].filter(([, v]) => v);

  const statsHtml = stats
    .map(([k, v]) => `<div><span>${k}</span><b>${esc(v)}</b></div>`)
    .join("");

  /* 판정 보너스가 숫자로 입력돼 있으면 굴림 버튼 추가 */
  const b = parseInt(card.bonus, 10);
  const rollBtn = Number.isFinite(b)
    ? `<button type="button" class="fuh-roll" data-bonus="${b}" data-name="${esc(card.name)}">
         <i class="fas fa-dice"></i> 판정 4dF${b >= 0 ? "+" : ""}${b}
       </button>`
    : "";

  const html = `
  <div class="fuh-card">
    <header>
      <div class="fuh-glyph"><i class="${esc(card.icon || "fas fa-fire")}"></i></div>
      <div>
        <h3>${esc(card.name)}</h3>
        <span class="fuh-kind">${esc(card.kind ?? "")}</span>
      </div>
    </header>
    <div class="fuh-desc">${card.desc ?? ""}</div>
    ${statsHtml ? `<div class="fuh-stats">${statsHtml}</div>` : ""}
    ${rollBtn}
  </div>`;

  ChatMessage.create({ content: html, speaker: ChatMessage.getSpeaker() });
}

/* ── 불씨/어둠 상태 카드 출력 ────────────────────────────── */
function postState() {
  const s = getState();
  const emberMax = game.settings.get(MODULE_ID, "emberMax");
  const darkMax = game.settings.get(MODULE_ID, "darkMax");
  const pct = (v, m) => Math.max(0, Math.min(100, (v / m) * 100));

  const gauge = (label, cls, v, m) => `
    <div class="fuh-gauge">
      <span>${label}</span>
      <div class="fuh-bar"><div class="fuh-fill ${cls}" style="width:${pct(v, m)}%"></div></div>
      <b>${v} / ${m}</b>
    </div>`;

  const html = `
  <div class="fuh-card fuh-state">
    <header>
      <div class="fuh-glyph"><i class="fas fa-train"></i></div>
      <div><h3>시공열차</h3><span class="fuh-kind">세션 상태 · STATE</span></div>
    </header>
    ${gauge("불씨 · EMBER", "ember", s.ember, emberMax)}
    ${gauge("어둠 · DARK", "dark", s.dark, darkMax)}
  </div>`;

  ChatMessage.create({ content: html, speaker: { alias: "시공열차" } });
}

/* GM이 /ember +2 같은 명령으로 게이지 조정 */
async function adjustGauge(key, raw) {
  if (!game.user.isGM) return ui.notifications.warn("게이지는 GM만 조정할 수 있습니다.");
  const s = getState();
  const max = game.settings.get(MODULE_ID, key === "ember" ? "emberMax" : "darkMax");
  const relative = /^[+-]/.test(raw); // +,- 로 시작하면 증감, 아니면 절대값
  const n = parseInt(raw, 10);
  const next = relative ? (s[key] ?? 0) + n : n;
  s[key] = Math.max(0, Math.min(max, next));
  await saveState(s);
  postState();
}

/* ── 카드 추가/수정 폼 ───────────────────────────────────── */
async function editCardDialog(card = null) {
  const c = card ?? { name: "", kind: "", icon: "fas fa-fire", desc: "", cost: "", zone: "", duration: "", bonus: "" };
  const esc = foundry.utils.escapeHTML ?? ((s) => s);
  const field = (label, name, value, hint = "") => `
    <div class="form-group">
      <label>${label}</label>
      <input type="text" name="${name}" value="${esc(value ?? "")}" placeholder="${hint}">
    </div>`;

  const content = `
    ${field("이름", "name", c.name)}
    ${field("종류 표기", "kind", c.kind, "예: 승무원 권능 · WARD")}
    ${field("아이콘 (Font Awesome)", "icon", c.icon, "예: fas fa-shield-halved")}
    <div class="form-group">
      <label>설명</label>
      <textarea name="desc" rows="3">${c.desc ?? ""}</textarea>
    </div>
    ${field("소모", "cost", c.cost, "예: 페이트 포인트 1 (비우면 숨김)")}
    ${field("범위", "zone", c.zone, "예: 존 1개 (비우면 숨김)")}
    ${field("지속", "duration", c.duration, "예: 한 장면 (비우면 숨김)")}
    ${field("판정 보너스", "bonus", c.bonus, "숫자만, 예: 2 → 카드에 4dF+2 버튼 (비우면 없음)")}`;

  try {
    const FDE = foundry.applications?.ux?.FormDataExtended ?? FormDataExtended;
    return await foundry.applications.api.DialogV2.prompt({
      window: { title: card ? "카드 수정" : "카드 추가" },
      position: { width: 440 },
      content,
      ok: { label: "저장", callback: (event, button) => new FDE(button.form).object },
    });
  } catch {
    return null;
  }
}

/* ── 카드 관리 창 ────────────────────────────────────────── */
class CardManagerApp extends foundry.applications.api.ApplicationV2 {
  static DEFAULT_OPTIONS = {
    id: "fuh-card-manager",
    window: { title: "능력/아이템 카드 관리", icon: "fas fa-id-card" },
    position: { width: 460, height: "auto" },
  };

  async _renderHTML() {
    const esc = foundry.utils.escapeHTML ?? ((s) => s);
    const rows = getCards()
      .map(
        (c) => `
      <div class="fuh-row">
        <i class="${esc(c.icon || "fas fa-fire")}"></i>
        <span class="fuh-name">${esc(c.name)}</span>
        <button type="button" data-action="post" data-id="${c.id}"><i class="fas fa-comment"></i> 출력</button>
        <button type="button" data-action="edit" data-id="${c.id}"><i class="fas fa-pen"></i> 수정</button>
        <button type="button" data-action="delete" data-id="${c.id}"><i class="fas fa-trash"></i></button>
      </div>`
      )
      .join("");

    return `
      ${rows || `<div class="fuh-empty">카드가 없습니다. 아래 버튼으로 추가하세요.</div>`}
      <div class="fuh-toolbar">
        <button type="button" data-action="add"><i class="fas fa-plus"></i> 새 카드</button>
      </div>`;
  }

  _replaceHTML(result, content) {
    content.innerHTML = result;
  }

  _onRender() {
    this.element.querySelectorAll("[data-action]").forEach((el) =>
      el.addEventListener("click", (ev) => this.#onAction(ev.currentTarget.dataset))
    );
  }

  async #onAction({ action, id }) {
    const list = getCards();
    const card = list.find((c) => c.id === id);

    if (action === "post" && card) return postCard(card);

    if (action === "add") {
      const data = await editCardDialog();
      if (!data?.name) return;
      data.id = foundry.utils.randomID();
      await saveCards([...list, data]);
      return this.render();
    }

    if (action === "edit" && card) {
      const data = await editCardDialog(card);
      if (!data?.name) return;
      await saveCards(list.map((c) => (c.id === id ? { ...data, id } : c)));
      return this.render();
    }

    if (action === "delete" && card) {
      await saveCards(list.filter((c) => c.id !== id));
      return this.render();
    }
  }
}

/* ── 초기화 ──────────────────────────────────────────────── */
Hooks.once("init", () => {
  const COMMANDS = foundry.applications.sidebar.tabs.ChatLog.CHAT_COMMANDS;

  COMMANDS.fate = {
    rgx: /^\/fate(?:\s+([+-]?\d+))?$/i,
    fn: async (command, match) => {
      const bonus = parseInt(match[1] ?? "0", 10);
      const formula = bonus === 0 ? "4df" : `4df + ${bonus}`;
      await new Roll(formula).toMessage({
        speaker: ChatMessage.getSpeaker(),
        flavor: "🎲 페이트 주사위",
      });
    },
    isRoll: true,
    isMultiline: false,
  };

  COMMANDS.card = {
    rgx: /^\/card(?:\s+(.+))?$/i,
    fn: async (command, match) => {
      const list = getCards();
      if (!list.length) return ui.notifications.warn("등록된 카드가 없습니다. 모듈 설정 → 카드 편집에서 추가하세요.");

      const query = match[1]?.trim().toLowerCase();
      if (query) {
        const card = list.find((c) => c.name.toLowerCase().includes(query));
        if (!card) return ui.notifications.warn(`"${match[1]}" 카드를 찾을 수 없습니다.`);
        return postCard(card);
      }

      foundry.applications.api.DialogV2.wait({
        window: { title: "카드 선택" },
        content: "<p>출력할 카드를 선택하세요.</p>",
        buttons: list.map((c) => ({
          action: c.id,
          label: c.name,
          callback: () => postCard(c),
        })),
      }).catch(() => {});
    },
    isRoll: false,
    isMultiline: false,
  };

  COMMANDS.state = {
    rgx: /^\/state$/i,
    fn: async () => postState(),
    isRoll: false,
    isMultiline: false,
  };

  COMMANDS.ember = {
    rgx: /^\/ember\s+([+-]?\d+)$/i,
    fn: async (command, match) => adjustGauge("ember", match[1]),
    isRoll: false,
    isMultiline: false,
  };

  COMMANDS.dark = {
    rgx: /^\/dark\s+([+-]?\d+)$/i,
    fn: async (command, match) => adjustGauge("dark", match[1]),
    isRoll: false,
    isMultiline: false,
  };

  /* 설정 */
  game.settings.register(MODULE_ID, "cards", {
    scope: "world", config: false, type: Object, default: DEFAULT_CARDS,
  });
  game.settings.register(MODULE_ID, "trackerState", {
    scope: "world", config: false, type: Object, default: { ember: 0, dark: 0 },
  });
  game.settings.register(MODULE_ID, "emberMax", {
    name: "불씨 게이지 최대값", scope: "world", config: true, type: Number, default: 10,
  });
  game.settings.register(MODULE_ID, "darkMax", {
    name: "어둠 게이지 최대값", scope: "world", config: true, type: Number, default: 10,
  });
  game.settings.registerMenu(MODULE_ID, "cardManager", {
    name: "능력/아이템 카드",
    label: "카드 편집",
    hint: "/card 명령으로 출력할 카드를 추가·수정·삭제합니다.",
    icon: "fas fa-id-card",
    type: CardManagerApp,
    restricted: true,
  });
});

/* 채팅에 렌더된 카드의 판정 버튼에 클릭 연결 */
Hooks.on("renderChatMessageHTML", (message, html) => {
  html.querySelectorAll(".fuh-roll").forEach((btn) =>
    btn.addEventListener("click", async () => {
      const b = parseInt(btn.dataset.bonus, 10) || 0;
      const formula = b === 0 ? "4df" : `4df + ${b}`;
      await new Roll(formula).toMessage({
        speaker: ChatMessage.getSpeaker(),
        flavor: `🎲 ${btn.dataset.name} 판정`,
      });
    })
  );
});

Hooks.once("ready", () => {
  console.log("시공열차 아카이브 | 모듈이 로드되었습니다.");
  ui.notifications.info("시공열차 아카이브 활성화! /fate /card /state 명령을 사용할 수 있습니다.");
});
