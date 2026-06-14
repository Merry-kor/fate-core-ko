/**
 * fate-core-ko — Fate Core Korean Edition for FoundryVTT v13
 * End-War Knight Design System 적용
 */

// ─── FateDie ──────────────────────────────────────────────────────────────

class FateDie extends foundry.dice.terms.Die {
  constructor(termData) {
    super({ ...termData, faces: 3 });
  }
  static DENOMINATION = "F";
  get expression() { return `${this.number}dF`; }

  roll({ minimize = false, maximize = false } = {}) {
    const result = {
      result: minimize ? 1 : maximize ? 3 : Math.ceil(CONFIG.Dice.randomUniform() * 3),
      active: true,
    };
    this.results.push(result);
    return result;
  }

  getResultLabel(result) {
    return { 1: "−", 2: "□", 3: "+" }[result.result] ?? "□";
  }

  get total() {
    return this.results.reduce((t, r) => {
      if (!r.active) return t;
      return t + (r.result === 3 ? 1 : r.result === 1 ? -1 : 0);
    }, 0);
  }
}

// ─── Actor Sheet ───────────────────────────────────────────────────────────

class FateCharacterSheet extends foundry.applications.api.HandlebarsApplicationMixin(
  foundry.applications.sheets.ActorSheetV2
) {
  static DEFAULT_OPTIONS = {
    classes: ["fate-core-ko", "sheet", "actor", "character"],
    position: { width: 980, height: 720 },
    form: { submitOnChange: true, closeOnSubmit: false },
    actions: {
      rollSkill:    FateCharacterSheet.#onRollSkill,
      adjustFP:     FateCharacterSheet.#onAdjustFP,
      invokeAspect: FateCharacterSheet.#onInvokeAspect,
      invokeStunt:  FateCharacterSheet.#onInvokeStunt,
      addItem:      FateCharacterSheet.#onAddItem,
      deleteItem:   FateCharacterSheet.#onDeleteItem,
      editItem:     FateCharacterSheet.#onEditItem,
      toggleStage:  FateCharacterSheet.#onToggleStage,
    },
  };

  static PARTS = {
    sheet: { template: "systems/fate-core-ko/templates/actor/character-sheet.hbs" },
  };

  get title() {
    return this.actor?.name ?? "캐릭터 시트";
  }

  // ── 렌더 후 이벤트 바인딩 ──────────────────────────────────────────────

  _onRender(context, options) {
    super._onRender?.(context, options);

    // 탭 전환 (재렌더 후 활성 탭 복원)
    const savedTab = this._activeTab ?? "skills";
    this.element.querySelectorAll(".fate-tabs__tab").forEach(t => t.classList.remove("active"));
    this.element.querySelectorAll(".fate-tab-content").forEach(c => c.classList.remove("active"));
    const activeTabEl = this.element.querySelector(`.fate-tabs__tab[data-tab="${savedTab}"]`);
    const activeContentEl = this.element.querySelector(`.fate-tab-content[data-tab="${savedTab}"]`);
    if (activeTabEl) activeTabEl.classList.add("active");
    if (activeContentEl) activeContentEl.classList.add("active");

    this.element.querySelectorAll(".fate-tabs__tab").forEach(tab => {
      tab.addEventListener("click", e => {
        const target = e.currentTarget.dataset.tab;
        this._activeTab = target;
        this.element.querySelectorAll(".fate-tabs__tab").forEach(t => t.classList.remove("active"));
        this.element.querySelectorAll(".fate-tab-content").forEach(c => c.classList.remove("active"));
        e.currentTarget.classList.add("active");
        this.element.querySelector(`.fate-tab-content[data-tab="${target}"]`)?.classList.add("active");
      });
    });

    // 아이템 인라인 필드 저장 (data-item-field 속성)
    this.element.querySelectorAll("[data-item-id]").forEach(el => {
      const itemId = el.dataset.itemId;
      el.querySelectorAll("[data-item-field]").forEach(input => {
        input.addEventListener("change", async e => {
          e.stopPropagation();
          const item = this.actor.items.get(itemId);
          if (!item) return;
          const field = e.currentTarget.dataset.itemField;
          const raw = e.currentTarget.value;
          const value = e.currentTarget.type === "number" ? Number(raw) : raw;
          await item.update({ [field]: value });
        });
      });

      // 아이템 이름 저장 (data-item-name)
      el.querySelectorAll("[data-item-name]").forEach(input => {
        input.addEventListener("change", async e => {
          e.stopPropagation();
          const item = this.actor.items.get(itemId);
          if (!item) return;
          await item.update({ name: e.currentTarget.value });
        });
      });

      // 면모 유형 사이클 버튼
      const ASPECT_TYPES = ["identity", "trouble", "general", "situation", "longterm", "stack"];
      el.querySelectorAll("[data-item-cycle]").forEach(btn => {
        btn.addEventListener("click", async e => {
          e.stopPropagation();
          const item = this.actor.items.get(itemId);
          if (!item) return;
          const field = btn.dataset.itemCycle;
          const current = item.system.aspectType ?? "general";
          const idx = ASPECT_TYPES.indexOf(current);
          const next = ASPECT_TYPES[(idx + 1) % ASPECT_TYPES.length];
          await item.update({ [field]: next });
        });
      });

      // 스트레스 체크박스 즉시 저장
      el.querySelectorAll("[data-stress-index]").forEach(cb => {
        cb.addEventListener("change", async e => {
          e.stopPropagation();
          const item = this.actor.items.get(itemId);
          if (!item) return;
          const idx = Number(e.currentTarget.dataset.stressIndex);
          const checked = [...(item.system.checked ?? [])];
          checked[idx] = e.currentTarget.checked;
          await item.update({ "system.checked": checked });
        });
      });
    });
  }

  // ── 컨텍스트 준비 ──────────────────────────────────────────────────────

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const actor = this.actor;
    const items = actor.items;

    // 사다리 레이블 지역화
    const ladder = {};
    for (const [k, v] of Object.entries(CONFIG.FATE.ladder)) {
      ladder[k] = game.i18n.localize(v);
    }

    // 면모 타입 목록 및 레이블 맵
    const ASPECT_TYPE_KEYS = ["identity", "trouble", "general", "situation", "longterm", "stack"];
    const aspectTypes = ASPECT_TYPE_KEYS.map(t => ({
      value: t,
      label: game.i18n.localize(`FATE.Item.Aspect.Type.${t}`),
    }));
    const aspectTypeMap = Object.fromEntries(
      ASPECT_TYPE_KEYS.map(t => [t, game.i18n.localize(`FATE.Item.Aspect.Type.${t}`)])
    );

    const ASPECT_TYPE_LABELS = { identity: "정체성", trouble: "고민", general: "일반", situation: "상황", longterm: "장기", stack: "스택" };
    return {
      ...context,
      actor,
      system: actor.system,
      onStage: actor.getFlag("fate-core-ko", "onStage") ?? false,
      aspects: items.filter(i => i.type === "aspect").map(a => ({
        id: a.id,
        name: a.name,
        system: {
          label:      a.system.label ?? "",
          aspectType: a.system.aspectType ?? "general",
          typeLabel:  ASPECT_TYPE_LABELS[a.system.aspectType ?? "general"] ?? "일반",
          invoke:     a.system.invoke ?? 0,
        },
      })),
      skills:       items.filter(i => i.type === "skill").sort((a, b) => b.system.rank - a.system.rank),
      stunts:       items.filter(i => i.type === "stunt"),
      stressTracks: items.filter(i => i.type === "stress"),
      consequences: items.filter(i => i.type === "consequence"),
      extras:       items.filter(i => i.type === "extra"),
      ladder,
      aspectTypes,
      aspectTypeMap,
    };
  }

  // ── 액션 핸들러 ────────────────────────────────────────────────────────

  static async #onRollSkill(event, target) {
    const itemId = target.closest("[data-item-id]")?.dataset.itemId;
    const item = this.actor.items.get(itemId);
    if (!item) return;
    await rollFate(this.actor, item);
  }

  static async #onAdjustFP(event, target) {
    const delta = parseInt(target.dataset.delta ?? "0", 10);
    const current = this.actor.system.fatepoints.current;
    await this.actor.update({ "system.fatepoints.current": Math.max(0, current + delta) });
  }

  static async #onInvokeAspect(event, target) {
    const itemId = target.closest("[data-item-id]")?.dataset.itemId;
    const item = this.actor.items.get(itemId);
    if (!item) return;
    const label = item.system.label || item.name;
    const typeKey = `FATE.Item.Aspect.Type.${item.system.aspectType ?? "general"}`;
    const typeLabel = game.i18n.localize(typeKey);
    const content = `
      <div class="fate-roll-card" style="border-top-color:var(--accent-gold)">
        <div class="fate-roll-card__header">
          <span class="fate-roll-card__actor">${this.actor.name}</span>
          <span class="fate-roll-card__skill">${typeLabel} 면모</span>
        </div>
        <p style="font-style:italic;margin:4px 0 0">"${label}"</p>
      </div>`;
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content,
    });
  }

  static async #onInvokeStunt(event, target) {
    const itemId = target.closest("[data-item-id]")?.dataset.itemId;
    const item = this.actor.items.get(itemId);
    if (!item) return;
    const summary = item.system.summary || "";
    const content = `
      <div class="fate-roll-card" style="border-top-color:var(--accent-gold)">
        <div class="fate-roll-card__header">
          <span class="fate-roll-card__actor">${this.actor.name}</span>
          <span class="fate-roll-card__skill">특기</span>
        </div>
        <p style="font-weight:600;margin:4px 0 2px">${item.name}</p>
        ${summary ? `<p style="font-style:italic;margin:2px 0 0;opacity:0.85">${summary}</p>` : ""}
      </div>`;
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content,
    });
  }

  static async #onAddItem(event, target) {
    const type = target.dataset.type;
    const label = game.i18n.localize(`FATE.Item.${capitalize(type)}.Label`);
    await this.actor.createEmbeddedDocuments("Item", [{ name: label, type }]);
  }

  static async #onDeleteItem(event, target) {
    const itemId = target.closest("[data-item-id]")?.dataset.itemId;
    const item = this.actor.items.get(itemId);
    if (!item) return;
    const confirmed = await foundry.applications.api.DialogV2.confirm({
      content: game.i18n.localize("FATE.Dialog.DeleteItemText"),
      yes: { label: game.i18n.localize("FATE.Dialog.Confirm") },
      no:  { label: game.i18n.localize("FATE.Dialog.Cancel") },
    });
    if (confirmed) item.delete();
  }

  static async #onEditItem(event, target) {
    const itemId = target.closest("[data-item-id]")?.dataset.itemId;
    this.actor.items.get(itemId)?.sheet.render(true);
  }

  static async #onToggleStage(event, target) {
    const onStage = this.actor.getFlag("fate-core-ko", "onStage") ?? false;
    await this.actor.setFlag("fate-core-ko", "onStage", !onStage);
    await FateStageBar.render();
  }
}

// ─── Item Sheet ────────────────────────────────────────────────────────────

class FateItemSheet extends foundry.applications.api.HandlebarsApplicationMixin(
  foundry.applications.sheets.ItemSheetV2
) {
  static DEFAULT_OPTIONS = {
    classes: ["fate-core-ko", "sheet", "item"],
    position: { width: 480, height: 380 },
    form: { submitOnChange: true, closeOnSubmit: false },
  };

  static PARTS = {
    sheet: { template: "systems/fate-core-ko/templates/item/item-sheet.hbs" },
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const aspectTypes = ["identity", "trouble", "general", "situation", "longterm", "stack"].map(t => ({
      value: t,
      label: game.i18n.localize(`FATE.Item.Aspect.Type.${t}`),
    }));
    return { ...context, item: this.item, system: this.item.system, aspectTypes };
  }
}

// ─── Token HUD (hook 방식) ─────────────────────────────────────────────────

Hooks.on("renderTokenHUD", (hud, html, _data) => {
  const el = html instanceof HTMLElement ? html : html[0];
  const actor = hud.object?.actor;
  if (!actor?.system?.fatepoints) return;

  const fp = actor.system.fatepoints;
  const stressTracks = actor.items.filter(i => i.type === "stress");
  const onStage = actor.getFlag("fate-core-ko", "onStage");

  const div = document.createElement("div");
  div.className = "fate-hud fate-core-ko";
  div.innerHTML = `
    <div class="fate-hud__fp">
      <button class="fate-hud__btn" type="button" data-fp-delta="-1">−</button>
      <span class="fate-hud__fp-val">${fp.current}</span>
      <button class="fate-hud__btn" type="button" data-fp-delta="1">+</button>
      <span class="fate-hud__fp-label">운명점</span>
    </div>
    ${stressTracks.map(track => `
      <div class="fate-hud__stress">
        <span class="fate-hud__stress-name">${track.name}</span>
        ${Array.from({ length: track.system.size }, (_, i) => `
          <label class="fate-hud__stress-pip">
            <input type="checkbox" data-track-id="${track.id}" data-box-idx="${i}"
              ${(track.system.checked ?? [])[i] ? "checked" : ""}>
            <span></span>
          </label>`).join("")}
      </div>`).join("")}
    <button class="fate-hud__stage-btn ${onStage ? "fate-hud__stage-btn--exit" : ""}"
      type="button" data-stage-toggle>
      ${onStage ? "무대 퇴장" : "무대 등장"}
    </button>`;
  el.appendChild(div);

  div.querySelectorAll("[data-fp-delta]").forEach(btn => {
    btn.addEventListener("click", async e => {
      e.stopPropagation();
      const delta = parseInt(e.currentTarget.dataset.fpDelta, 10);
      await actor.update({ "system.fatepoints.current": Math.max(0, fp.current + delta) });
      hud.render();
      FateStageBar.render();
    });
  });

  div.querySelectorAll("[data-track-id]").forEach(cb => {
    cb.addEventListener("change", async e => {
      const item = actor.items.get(e.currentTarget.dataset.trackId);
      if (!item) return;
      const idx = Number(e.currentTarget.dataset.boxIdx);
      const checked = [...(item.system.checked ?? [])];
      checked[idx] = e.currentTarget.checked;
      await item.update({ "system.checked": checked });
    });
  });

  div.querySelector("[data-stage-toggle]")?.addEventListener("click", async () => {
    await actor.setFlag("fate-core-ko", "onStage", !onStage);
    await FateStageBar.render();
    hud.render();
  });
});

// ─── VN Speech Box ─────────────────────────────────────────────────────────

const FateVNBox = {
  _el: null,
  _timer: null,

  _ensure() {
    if (this._el) return;
    this._el = document.createElement("div");
    this._el.id = "fate-vn-box";
    this._el.innerHTML = `
      <div id="fate-vn-portrait-wrap">
        <img id="fate-vn-portrait" src="" alt="">
      </div>
      <div id="fate-vn-name"></div>
      <div id="fate-vn-text"></div>`;
    document.getElementById("interface")?.appendChild(this._el);
  },

  show(actor, text) {
    this._ensure();
    const portrait = document.getElementById("fate-vn-portrait");
    const nameEl   = document.getElementById("fate-vn-name");
    const textEl   = document.getElementById("fate-vn-text");

    portrait.src = actor.img;
    nameEl.textContent = actor.name;
    nameEl.style.color = actor.getFlag("fate-core-ko", "color") || "var(--accent-gold)";
    textEl.innerHTML = "";
    this._el.classList.add("visible");

    if (this._timer) { clearInterval(this._timer); this._timer = null; }
    let i = 0;
    const cursor = document.createElement("span");
    cursor.className = "fate-vn-cursor";
    textEl.appendChild(cursor);
    this._timer = setInterval(() => {
      if (i < text.length) {
        cursor.insertAdjacentText("beforebegin", text[i++]);
      } else {
        clearInterval(this._timer); this._timer = null;
        setTimeout(() => cursor.remove(), 2200);
      }
    }, 28);
  },
};

// ─── EWK Sidebar — 완전 커스텀 비주얼 레이어 ──────────────────────────────
// #sidebar는 FVTT 기능용(hidden), 우리 UI는 #interface에 직접 붙임

const EWKSidebar = {
  WIDTHS: [
    { key: "narrow", label: "좁게",    px: 300 },
    { key: "normal", label: "보통",    px: 380 },
    { key: "wide",   label: "넓게",    px: 480 },
    { key: "xwide",  label: "매우넓게", px: 560 },
  ],
  _activeTab: "chat",
  _currentEmo: "normal",
  _currentWrap: null,
  _textStyles: { bold: false, italic: false, center: false },
  _messageBuffer: [],   // 사이드바 생성 전 수신된 메시지 임시 보관
  _pendingUpdates: {},  // msgId → 교체 대상 DOM 요소 (수정 시 제자리 갱신)

  TABS: [
    { key: "chat",      icon: "💬", label: "채팅" },
    { key: "scenes",    icon: "🎭", label: "장면" },
    { key: "actors",    icon: "👤", label: "액터" },
    { key: "journal",   icon: "📖", label: "저널" },
    { key: "playlists", icon: "🎵", label: "음악" },
    { key: "settings",  icon: "⚙️", label: "설정" },
  ],

  build() {
    document.getElementById("ewk-sidebar")?.remove();

    // 배경 이미지 요소 생성 (없을 때만)
    if (!document.getElementById("ewk-scene-bg")) {
      const bg = document.createElement("div");
      bg.id = "ewk-scene-bg";
      document.getElementById("interface")?.prepend(bg);
    }

    // 저장된 너비 복원
    const savedPx = parseInt(localStorage.getItem("ewk-sidebar-width-px") ?? "380", 10);
    this._applyWidth(savedPx);

    // ── 사이드바 루트 ───────────────────────────────────
    const sidebar = document.createElement("aside");
    sidebar.id = "ewk-sidebar";
    sidebar.className = "fate-core-ko";
    sidebar.style.width = savedPx + "px";

    // ── 가로 탭 스트립 ──────────────────────────────────
    const tabstrip = document.createElement("nav");
    tabstrip.id = "ewk-tabstrip";
    this.TABS.forEach(({ key, icon, label }) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "ewk-tab" + (key === "chat" ? " active" : "");
      btn.dataset.tab = key;
      btn.textContent = label;
      btn.addEventListener("click", () => this._switchTab(key));
      tabstrip.appendChild(btn);
    });
    sidebar.appendChild(tabstrip);

    // ── 패널 컨테이너 ───────────────────────────────────
    const panels = document.createElement("div");
    panels.id = "ewk-panels";

    // 채팅 패널 (완전 커스텀)
    panels.appendChild(this._buildChatPanel(savedPx));

    // 비채팅 패널 — actors는 커스텀 렌더, 나머지는 FVTT 패널 이동
    const CUSTOM_PANELS = new Set(["actors"]);
    this.TABS.filter(t => t.key !== "chat").forEach(({ key }) => {
      const p = document.createElement("div");
      p.id = `ewk-panel-${key}`;
      p.className = "ewk-panel " + (CUSTOM_PANELS.has(key) ? "ewk-custom-panel" : "ewk-fvtt-panel");
      panels.appendChild(p);
    });

    sidebar.appendChild(panels);
    document.getElementById("interface")?.appendChild(sidebar);

    // 이벤트 연결
    this._wireWidthPresets();
    this._wireChatInput();
    this._wireChatTools();
    this._wireChatActions();

    // renderChatMessageHTML 이 sidebar 생성 전에 발생한 메시지 처리
    this._flushBuffer();
    // FVTT #chat-log 에 이미 렌더된 메시지 복사 (fallback)
    this._loadExistingMessages();

    // FVTT 패널 가져오기 (FVTT 렌더 완료 후)
    setTimeout(() => this._adoptFVTTPanels(), 300);
  },

  _buildChatPanel(currentPx) {
    const sceneName = game.scenes?.active?.name ?? "장면 없음";
    const widthBtns = this.WIDTHS.map(w =>
      `<button class="ewk-wpbtn${w.px === currentPx ? " ewk-wpbtn--on" : ""}" data-w="${w.px}">${w.label}</button>`
    ).join("");

    const panel = document.createElement("div");
    panel.id = "ewk-panel-chat";
    panel.className = "ewk-panel active";
    panel.innerHTML = `
      <div id="ewk-chat-hdr">
        <span class="ewk-chat-title">채팅 로그</span>
        <span id="ewk-scene-badge" class="ewk-scene-badge">${sceneName}</span>
        <div class="ewk-hdr-acts">
          <div id="ewk-wpresets">${widthBtns}</div>
          <button class="ewk-hdr-btn" id="ewk-dl-btn">⬇ 로그</button>
          <button class="ewk-hdr-btn" id="ewk-print-btn">📄 인쇄</button>
          <button class="ewk-hdr-btn ewk-hdr-btn--danger" id="ewk-clear-btn">🗑 삭제</button>
        </div>
      </div>
      <div id="ewk-chat-log"></div>
      <div id="ewk-chat-tools">
        <button class="ewk-tool-btn" data-emo-wrap="「」">「 」</button>
        <button class="ewk-tool-btn" data-emo-wrap='""'>" "</button>
        <div class="ewk-tool-sep"></div>
        <button class="ewk-fmt-btn" data-fmt="bold"><b>굵</b></button>
        <button class="ewk-fmt-btn" data-fmt="italic"><i>기</i></button>
        <button class="ewk-fmt-btn" data-fmt="center">중</button>
        <div class="ewk-tool-sep"></div>
        <button class="ewk-emo-btn ewk-emo-btn--on" data-emo="normal">보통</button>
        <button class="ewk-emo-btn" data-emo="shake">진동</button>
        <button class="ewk-emo-btn" data-emo="shout">외침</button>
        <button class="ewk-emo-btn" data-emo="wave">파동</button>
        <button class="ewk-emo-btn" data-emo="glow">빛남</button>
      </div>
      <div id="ewk-chat-form">
        <textarea id="ewk-chat-input" rows="2" placeholder="대사나 행동 입력… (Enter)"></textarea>
        <button id="ewk-chat-send" type="button">전송</button>
      </div>`;
    return panel;
  },

  // FVTT가 렌더한 패널을 우리 컨테이너로 이동 (커스텀 패널은 건너뜀)
  _adoptFVTTPanels() {
    const SKIP = new Set(["chat", "actors"]);
    this.TABS.forEach(({ key }) => {
      if (SKIP.has(key)) return;
      const fvttPanel =
        document.getElementById(key) ??
        document.querySelector(`#sidebar-content [data-tab="${key}"]`) ??
        document.querySelector(`.sidebar-tab[data-tab="${key}"]`);
      const ourPanel = document.getElementById(`ewk-panel-${key}`);
      if (!fvttPanel || !ourPanel || ourPanel.contains(fvttPanel)) return;
      fvttPanel.removeAttribute("hidden");
      fvttPanel.style.removeProperty("display");
      fvttPanel.style.height = "100%";
      fvttPanel.style.overflow = "auto";
      ourPanel.appendChild(fvttPanel);
    });
  },

  _switchTab(key) {
    this._activeTab = key;

    // 탭 버튼 active 갱신
    document.querySelectorAll("#ewk-tabstrip .ewk-tab").forEach(b =>
      b.classList.toggle("active", b.dataset.tab === key));

    // 패널 표시/숨김
    const chatPanel = document.getElementById("ewk-panel-chat");
    const targetPanel = key === "chat" ? chatPanel : document.getElementById(`ewk-panel-${key}`);
    document.querySelectorAll("#ewk-panels .ewk-panel").forEach(p =>
      p.classList.toggle("active", p === targetPanel));

    // 커스텀 패널 렌더 or FVTT 패널 채택
    if (key === "actors") this._renderActorPanel();
    else if (key !== "chat") {
      try { ui.sidebar?.changeTab(key, "primary"); } catch (_) {}
      setTimeout(() => this._adoptFVTTPanels(), 100);
    }
  },

  // ── 액터 패널 (폴더 구조) ───────────────────────────────────
  _renderActorPanel() {
    const panel = document.getElementById("ewk-panel-actors");
    if (!panel) return;
    const isGM = game.user?.isGM;

    // 폴더별 액터 그룹화
    const byFolder = {};
    (game.actors?.contents ?? []).forEach(a => {
      const fid = a.folder?.id ?? "__none__";
      (byFolder[fid] ??= []).push(a);
    });

    // 액터 타입 폴더 목록 (정렬)
    const folders = (game.folders?.filter(f => f.type === "Actor") ?? [])
      .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0) || a.name.localeCompare(b.name, "ko"));

    // 펼침 상태 (localStorage)
    const EXP_KEY = "ewk-actor-exp";
    let expState = {};
    try { expState = JSON.parse(localStorage.getItem(EXP_KEY) ?? "{}"); } catch (_) {}
    const isExp = id => expState[id] !== false;
    const toggleExp = id => {
      expState[id] = !isExp(id);
      localStorage.setItem(EXP_KEY, JSON.stringify(expState));
      this._renderActorPanel();
    };

    const mkCard = (a) => {
      const fp    = a.system?.fatepoints;
      const stage = a.getFlag("fate-core-ko", "onStage") ?? false;
      const fpHtml = fp
        ? `<div class="ewk-acard-fp"><span class="ewk-acard-fp-n">${fp.current}</span><span class="ewk-acard-fp-sep">/</span><span class="ewk-acard-fp-r">${fp.refresh}</span><span class="ewk-acard-fp-l">운명점</span></div>`
        : "";
      return `<div class="ewk-acard" data-actor-id="${a.id}" draggable="true" title="하단 무대 바로 드래그하여 무대 등장">
  <img class="ewk-acard-port" src="${a.img}" alt="">
  <div class="ewk-acard-body">
    <div class="ewk-acard-name">${a.name}${stage ? ' <span class="ewk-on-air">ON</span>' : ""}</div>
    ${fpHtml}
  </div>
  ${isGM ? `<button class="ewk-acard-btn" data-actor-own="${a.id}" title="권한 설정">🔑</button>` : ""}
  <button class="ewk-acard-btn ewk-acard-open" data-open="${a.id}" title="시트 열기">▶</button>
  ${isGM ? `<button class="ewk-acard-btn ewk-acard-del" data-actor-del="${a.id}" title="삭제">✕</button>` : ""}
</div>`;
    };

    const mkFolder = (fid, fname, actors, { gmOnly = false, isNone = false } = {}) => {
      if (!isGM && gmOnly) return "";
      const exp = isExp(fid);
      const sorted = [...actors].sort((a, b) => a.name.localeCompare(b.name, "ko"));
      const gmBadge = gmOnly ? `<span class="ewk-fldr-gm" title="GM만 볼 수 있음">🔒</span>` : "";
      const gmToggle = isGM && !isNone
        ? `<button class="ewk-fldr-btn" data-fldr-gm="${fid}" data-gm-cur="${gmOnly}" title="${gmOnly ? "모두에게 보이기" : "GM 전용으로"}">${gmOnly ? "👁" : "🔒"}</button>`
        : "";
      const addBtn = isGM
        ? `<button class="ewk-fldr-btn" data-fldr-add="${fid}" title="이 폴더에 추가">+</button>`
        : "";
      const delBtn = isGM && !isNone
        ? `<button class="ewk-fldr-btn ewk-fldr-btn--danger" data-fldr-del="${fid}" title="폴더 삭제">✕</button>`
        : "";
      return `<div class="ewk-fldr${gmOnly ? " ewk-fldr--gm" : ""}" data-fldr-id="${fid}">
  <div class="ewk-fldr-hdr" data-fldr-toggle="${fid}" data-fldr-drop="${fid}">
    <span class="ewk-fldr-arrow">${exp ? "▾" : "▸"}</span>
    <span class="ewk-fldr-name">${fname}</span>${gmBadge}
    <span class="ewk-fldr-cnt">${sorted.length}</span>
    ${gmToggle}${addBtn}${delBtn}
  </div>
  <div class="ewk-fldr-body${exp ? "" : " ewk-fldr-body--closed"}">
    ${sorted.map(mkCard).join("") || '<div class="ewk-panel-empty ewk-panel-empty--sm">비어 있음</div>'}
  </div>
</div>`;
    };

    const foldersHtml = folders.map(f =>
      mkFolder(f.id, f.name, byFolder[f.id] ?? [], { gmOnly: f.getFlag("fate-core-ko", "gmOnly") ?? false })
    ).join("");

    const unfiledActors = byFolder["__none__"] ?? [];
    const unfiledHtml = (unfiledActors.length || !folders.length)
      ? mkFolder("__none__", "미분류", unfiledActors, { isNone: true })
      : "";

    panel.innerHTML = `
<div class="ewk-panel-toolbar">
  ${isGM ? `
    <button class="ewk-panel-new" data-create-folder>+ 폴더</button>
    <button class="ewk-panel-new" data-create-actor="character">+ 캐릭터</button>
    <button class="ewk-panel-new" data-create-actor="npc">+ NPC</button>` : ""}
</div>
<div class="ewk-panel-scroll">
  ${foldersHtml}${unfiledHtml}
  ${!folders.length && !unfiledActors.length ? '<div class="ewk-panel-empty">액터가 없습니다.</div>' : ""}
</div>`;

    // ── 이벤트 바인딩 ──────────────────────────────────────────

    panel.querySelectorAll("[data-fldr-toggle]").forEach(hdr => {
      hdr.addEventListener("click", e => {
        if (e.target.closest("[data-fldr-gm],[data-fldr-add],[data-fldr-del]")) return;
        toggleExp(hdr.dataset.fldrToggle);
      });
    });

    // 폴더 헤더 드롭: 액터를 다른 폴더로 이동
    panel.querySelectorAll("[data-fldr-drop]").forEach(hdr => {
      hdr.addEventListener("dragover", e => {
        const id = e.dataTransfer?.types?.includes("text/plain") || true;
        if (id) { e.preventDefault(); hdr.classList.add("ewk-fldr-hdr--over"); }
      });
      hdr.addEventListener("dragleave", () => hdr.classList.remove("ewk-fldr-hdr--over"));
      hdr.addEventListener("drop", async e => {
        e.preventDefault();
        hdr.classList.remove("ewk-fldr-hdr--over");
        const actorId = e.dataTransfer?.getData("ewk-actor-id");
        if (!actorId) return;
        const actor = game.actors?.get(actorId);
        if (!actor) return;
        const targetFid = hdr.dataset.fldrDrop;
        const newFolder = targetFid === "__none__" ? null : targetFid;
        if (actor.folder?.id === newFolder || (!actor.folder && newFolder === null)) return;
        await actor.update({ folder: newFolder });
      });
    });

    panel.querySelector("[data-create-folder]")?.addEventListener("click", async () => {
      const name = this._promptText("폴더 이름:");
      if (!name) return;
      await Folder.create({ name, type: "Actor", color: "#4f6bc9" });
    });

    panel.querySelectorAll("[data-create-actor]").forEach(btn => {
      btn.addEventListener("click", async () => {
        const type = btn.dataset.createActor;
        await Actor.create({ name: type === "character" ? "새 캐릭터" : "새 NPC", type });
      });
    });

    panel.querySelectorAll("[data-fldr-add]").forEach(btn => {
      btn.addEventListener("click", async e => {
        e.stopPropagation();
        const fid = btn.dataset.fldrAdd;
        const name = this._promptText("캐릭터 이름:");
        if (!name) return;
        await Actor.create({ name, type: "character", folder: fid === "__none__" ? null : fid });
      });
    });

    panel.querySelectorAll("[data-fldr-gm]").forEach(btn => {
      btn.addEventListener("click", async e => {
        e.stopPropagation();
        const folder = game.folders.get(btn.dataset.fldrGm);
        if (!folder) return;
        await folder.setFlag("fate-core-ko", "gmOnly", btn.dataset.gmCur !== "true");
      });
    });

    panel.querySelectorAll("[data-fldr-del]").forEach(btn => {
      btn.addEventListener("click", async e => {
        e.stopPropagation();
        const folder = game.folders.get(btn.dataset.fldrDel);
        if (!folder) return;
        const ok = await foundry.applications.api.DialogV2.confirm({
          content: `<p>"${folder.name}" 폴더를 삭제할까요? 액터는 미분류로 이동됩니다.</p>`,
          yes: { label: "삭제" }, no: { label: "취소" },
        }).catch(() => false);
        if (ok) await folder.delete({ deleteSubfolders: false, deleteContents: false });
      });
    });

    panel.querySelectorAll("[data-open]").forEach(btn => {
      btn.addEventListener("click", e => {
        e.stopPropagation();
        game.actors.get(btn.dataset.open)?.sheet?.render(true);
      });
    });

    panel.querySelectorAll("[data-actor-own]").forEach(btn => {
      btn.addEventListener("click", e => {
        e.stopPropagation();
        const actor = game.actors.get(btn.dataset.actorOwn);
        if (!actor) return;
        try {
          new foundry.applications.apps.DocumentOwnershipConfig({ document: actor }).render(true);
        } catch (_) {
          try {
            new DocumentOwnershipConfig(actor, {}).render(true);
          } catch (__) {}
        }
      });
    });

    panel.querySelectorAll("[data-actor-del]").forEach(btn => {
      btn.addEventListener("click", async e => {
        e.stopPropagation();
        const actor = game.actors.get(btn.dataset.actorDel);
        if (!actor) return;
        const ok = await foundry.applications.api.DialogV2.confirm({
          content: `<p>"${actor.name}"을(를) 영구 삭제할까요?</p>`,
          yes: { label: "삭제" }, no: { label: "취소" },
        }).catch(() => false);
        if (ok) await actor.delete();
      });
    });

    panel.querySelectorAll(".ewk-acard").forEach(el => {
      let _didDrag = false;
      el.addEventListener("click", e => {
        if (_didDrag) { _didDrag = false; return; }
        if (e.target.closest(".ewk-acard-btn")) return;
        game.actors.get(el.dataset.actorId)?.sheet?.render(true);
      });
      // 드래그 → 하단 무대 바 또는 퀵독에 드롭
      el.addEventListener("dragstart", e => {
        e.stopPropagation(); // FVTT DragDrop 인터셉트 방지
        e.dataTransfer.setData("ewk-actor-id", el.dataset.actorId);
        e.dataTransfer.effectAllowed = "copy";
        _didDrag = true;
        el.classList.add("ewk-acard--dragging");
      });
      el.addEventListener("dragend", () => {
        el.classList.remove("ewk-acard--dragging");
        setTimeout(() => { _didDrag = false; }, 100);
      });
    });
  },

  _promptText(label, def = "") {
    return window.prompt(label, def) ?? null;
  },

  // ── 아이템 패널 ────────────────────────────────────────────
  _renderItemPanel() {
    const panel = document.getElementById("ewk-panel-items");
    if (!panel) return;

    const canCreate = game.user?.isGM;
    const items = (game.items?.contents ?? [])
      .sort((a, b) => a.name.localeCompare(b.name, "ko"));

    const TYPE_LABEL = {
      aspect: "면모", skill: "기능", stunt: "특기",
      stress: "스트레스 트랙", consequence: "결과", extra: "특수항목",
    };
    const TYPE_ORDER = ["aspect", "skill", "stunt", "stress", "consequence", "extra"];

    const grouped = {};
    items.forEach(i => { (grouped[i.type] ??= []).push(i); });

    const itemRow = (i) => {
      const badge = i.system?.rank !== undefined
        ? `<span class="ewk-irow-badge">${i.system.rank >= 0 ? "+" : ""}${i.system.rank}</span>`
        : "";
      return `<div class="ewk-irow" data-item-id="${i.id}">
  <span class="ewk-irow-name">${i.name}</span>${badge}
</div>`;
    };

    const allTypes = [
      ...TYPE_ORDER.filter(t => grouped[t]),
      ...Object.keys(grouped).filter(t => !TYPE_ORDER.includes(t)),
    ];

    const groupsHtml = allTypes.map(t => `
<div class="ewk-panel-group">
  <div class="ewk-panel-group-hdr">${TYPE_LABEL[t] ?? t}<span class="ewk-panel-group-count">${grouped[t].length}</span></div>
  ${grouped[t].map(itemRow).join("")}
</div>`).join("");

    panel.innerHTML = `
<div class="ewk-panel-toolbar">
  ${canCreate
    ? `<button class="ewk-panel-new" data-create="aspect">+ 면모</button>
       <button class="ewk-panel-new" data-create="skill">+ 기능</button>
       <button class="ewk-panel-new" data-create="stunt">+ 특기</button>`
    : ""}
</div>
<div class="ewk-panel-scroll">
  ${groupsHtml}
  ${!items.length ? '<div class="ewk-panel-empty">아이템이 없습니다.</div>' : ""}
</div>`;

    panel.querySelectorAll(".ewk-irow").forEach(el => {
      el.addEventListener("click", () => {
        game.items.get(el.dataset.itemId)?.sheet?.render(true);
      });
    });
    panel.querySelectorAll("[data-create]").forEach(btn => {
      btn.addEventListener("click", () => {
        const type = btn.dataset.create;
        const name = { aspect: "새 면모", skill: "새 기능", stunt: "새 특기" }[type] ?? "새 아이템";
        Item.create({ name, type });
      });
    });
  },

  // FVTT #chat-log 에서 우리 로그로 복사 (버퍼 방식의 fallback)
  _loadExistingMessages() {
    const ourLog  = document.getElementById("ewk-chat-log");
    const fvttLog = document.getElementById("chat-log");
    if (!ourLog || !fvttLog) return;
    let added = false;
    fvttLog.querySelectorAll("li, .chat-message").forEach(child => {
      const msgId = child.dataset?.messageId;
      if (msgId && ourLog.querySelector(`[data-message-id="${msgId}"]`)) return;
      ourLog.appendChild(child.cloneNode(true));
      added = true;
    });
    if (added) ourLog.scrollTop = ourLog.scrollHeight;
  },

  // renderChatMessageHTML 훅에서 호출 — 새 메시지를 우리 로그에 추가
  addMessage(el) {
    const log = document.getElementById("ewk-chat-log");
    const msgId = el.dataset?.messageId;

    // 수정된 메시지: 기존 위치에서 교체
    if (msgId && this._pendingUpdates[msgId]) {
      const oldEl = this._pendingUpdates[msgId];
      delete this._pendingUpdates[msgId];
      if (oldEl.parentNode) { oldEl.replaceWith(el.cloneNode(true)); return; }
    }

    if (!log) {
      if (msgId && this._messageBuffer.some(e => e.dataset?.messageId === msgId)) return;
      this._messageBuffer.push(el.cloneNode(true));
      return;
    }
    if (msgId && log.querySelector(`[data-message-id="${msgId}"]`)) return;
    log.appendChild(el.cloneNode(true));
    log.scrollTop = log.scrollHeight;
  },

  // build() 완료 후 버퍼에 쌓인 메시지를 로그에 일괄 처리
  _flushBuffer() {
    const log = document.getElementById("ewk-chat-log");
    if (!log || this._messageBuffer.length === 0) return;
    this._messageBuffer.forEach(el => {
      const msgId = el.dataset?.messageId;
      if (msgId && log.querySelector(`[data-message-id="${msgId}"]`)) return;
      log.appendChild(el);
    });
    this._messageBuffer = [];
    log.scrollTop = log.scrollHeight;
  },

  _wireChatInput() {
    const input = document.getElementById("ewk-chat-input");
    const btn   = document.getElementById("ewk-chat-send");

    const send = async () => {
      let content = input?.value?.trim();
      if (!content) return;
      input.value = "";
      // 인용 부호 토글이 켜져 있으면 전송 내용 양쪽에 자동 감쌈
      if (this._currentWrap) {
        const open  = this._currentWrap[0];
        const close = this._currentWrap[this._currentWrap.length - 1];
        content = open + content + close;
      }
      // 서식 적용 (중첩 가능)
      if (this._textStyles.bold)   content = `<strong>${content}</strong>`;
      if (this._textStyles.italic)  content = `<em>${content}</em>`;
      if (this._textStyles.center)  content = `<div style="text-align:center">${content}</div>`;
      // 감정 효과 적용 (normal이 아닌 경우 span으로 감쌈)
      if (this._currentEmo && this._currentEmo !== "normal") {
        content = `<span class="ewk-emo ewk-emo--${this._currentEmo}">${content}</span>`;
      }
      await ChatMessage.create({ content, speaker: ChatMessage.getSpeaker() });
    };

    input?.addEventListener("keydown", e => {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
    });
    btn?.addEventListener("click", send);
  },

  _wireChatTools() {
    const tools = document.getElementById("ewk-chat-tools");
    if (!tools) return;

    // 인용 부호 버튼: 토글 방식 — 활성화하면 전송 시 자동 감쌈
    tools.querySelectorAll(".ewk-tool-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const wrap = btn.dataset.emoWrap;
        if (this._currentWrap === wrap) {
          // 이미 켜져 있으면 끔
          this._currentWrap = null;
          btn.classList.remove("ewk-emo-btn--on");
        } else {
          // 새로 켬 (다른 wrap 버튼 끄기)
          this._currentWrap = wrap;
          tools.querySelectorAll(".ewk-tool-btn").forEach(b => b.classList.remove("ewk-emo-btn--on"));
          btn.classList.add("ewk-emo-btn--on");
        }
      });
    });

    // 서식 버튼: 독립 토글 (동시에 여러 개 활성 가능)
    tools.querySelectorAll(".ewk-fmt-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const fmt = btn.dataset.fmt;
        this._textStyles[fmt] = !this._textStyles[fmt];
        btn.classList.toggle("ewk-emo-btn--on", this._textStyles[fmt]);
      });
    });

    // 감정 버튼: 하나만 활성
    tools.querySelectorAll(".ewk-emo-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        this._currentEmo = btn.dataset.emo;
        tools.querySelectorAll(".ewk-emo-btn").forEach(b =>
          b.classList.toggle("ewk-emo-btn--on", b === btn));
      });
    });
  },

  _wireChatActions() {
    const log = document.getElementById("ewk-chat-log");
    if (!log) return;
    log.addEventListener("click", async e => {
      const editBtn = e.target.closest("[data-msg-edit]");
      const delBtn  = e.target.closest("[data-msg-del]");
      if (editBtn) {
        const msgId = editBtn.dataset.msgEdit;
        const msg   = game.messages?.get(msgId);
        if (!msg) return;
        const msgEl     = log.querySelector(`[data-message-id="${msgId}"]`);
        const contentEl = msgEl?.querySelector(".message-content");
        if (!contentEl) return;
        if (contentEl.querySelector(".ewk-msg-ed")) return; // 이미 편집 중
        const origHtml = contentEl.innerHTML;
        const tmpDiv = document.createElement("div");
        tmpDiv.innerHTML = msg.content;
        const plainText = (tmpDiv.textContent ?? tmpDiv.innerText ?? "").trim();
        contentEl.innerHTML = `<div class="ewk-msg-ed">
          <textarea class="ewk-msg-ed-ta">${plainText.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</textarea>
          <div class="ewk-msg-ed-bar">
            <span class="ewk-msg-ed-hint">Ctrl+Enter 저장 · Esc 취소</span>
            <button class="ewk-msg-ed-cancel">취소</button>
            <button class="ewk-msg-ed-save">저장</button>
          </div>
        </div>`;
        const ta  = contentEl.querySelector(".ewk-msg-ed-ta");
        const sav = contentEl.querySelector(".ewk-msg-ed-save");
        const can = contentEl.querySelector(".ewk-msg-ed-cancel");
        const doSave = async () => { await msg.update({ content: ta.value }); };
        sav.addEventListener("click", doSave);
        can.addEventListener("click", () => { contentEl.innerHTML = origHtml; });
        ta.addEventListener("keydown", ev => {
          if (ev.key === "Enter" && ev.ctrlKey) { ev.preventDefault(); doSave(); }
          if (ev.key === "Escape") { contentEl.innerHTML = origHtml; }
        });
        ta.focus();
      }
      if (delBtn) {
        const msgId = delBtn.dataset.msgDel;
        await game.messages?.get(msgId)?.delete();
      }
    });
  },

  _wireWidthPresets() {
    document.getElementById("ewk-wpresets")?.querySelectorAll(".ewk-wpbtn").forEach(btn => {
      btn.addEventListener("click", () => {
        const px = parseInt(btn.dataset.w, 10);
        localStorage.setItem("ewk-sidebar-width-px", String(px));
        this._applyWidth(px);
        document.querySelectorAll(".ewk-wpbtn").forEach(b =>
          b.classList.toggle("ewk-wpbtn--on", b.dataset.w === btn.dataset.w));
      });
    });
    document.getElementById("ewk-dl-btn")?.addEventListener("click",  () => this._downloadLog());
    document.getElementById("ewk-print-btn")?.addEventListener("click", () => this._printLog());
    document.getElementById("ewk-clear-btn")?.addEventListener("click", () => this._clearLog());
  },

  async _clearLog() {
    const confirmed = await foundry.applications.api.DialogV2.confirm({
      window: { title: "채팅 로그 전체 삭제" },
      content: "<p>채팅 로그를 전부 삭제하시겠습니까? 되돌릴 수 없습니다.</p>",
      yes: { label: "삭제", icon: "fas fa-trash" },
      no:  { label: "취소" },
    }).catch(() => false);
    if (!confirmed) return;
    const ids = game.messages.map(m => m.id);
    if (ids.length > 0) await ChatMessage.deleteDocuments(ids);
    const log = document.getElementById("ewk-chat-log");
    if (log) log.innerHTML = "";
  },

  _applyWidth(px) {
    const ewk = document.getElementById("ewk-sidebar");
    if (ewk) ewk.style.width = px + "px";
    // FVTT #sidebar 너비도 맞춰서 캔버스 레이아웃 유지
    const fvtt = document.getElementById("sidebar") ?? document.getElementById("ui-right");
    if (fvtt) fvtt.style.setProperty("width", px + "px", "important");
    document.documentElement.style.setProperty("--ewk-sidebar-width",    px + "px");
    document.documentElement.style.setProperty("--foundry-sidebar-width", px + "px");
  },

  updateSceneBadge() {
    const badge = document.getElementById("ewk-scene-badge");
    if (badge) badge.textContent = game.scenes?.active?.name ?? "장면 없음";
  },

  _printLog() {
    const msgs = [...(game.messages?.values() ?? [])];
    if (!msgs.length) { ui.notifications?.warn("채팅 로그가 비어 있습니다."); return; }

    const worldTitle = game.world?.title ?? "페이트 코어";
    const sceneName  = game.scenes?.active?.name ?? worldTitle;
    const today      = new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });

    // ── 애니메이션 span 제거, 기본 인라인 서식 유지 ──────────
    const sanitize = (html) => (html ?? "")
      .replace(/<span[^>]*class="ewk-emo[^"]*"[^>]*>([\s\S]*?)<\/span>/gi, "$1")
      .replace(/<div style="text-align:\s*center">([\s\S]*?)<\/div>/gi,
               '<span style="display:block;text-align:center">$1</span>');

    // ── 메시지 → HTML 블록 변환 ──────────────────────────────
    const parseBlock = (msg) => {
      const raw = msg.content ?? "";
      const tmp = document.createElement("div");
      tmp.innerHTML = raw;

      // ⓪ 장면 전환 메시지
      if (tmp.querySelector(".ewk-scene-change-msg")) {
        const name  = tmp.querySelector(".ewk-scm-name")?.textContent?.trim() ?? "";
        const bgSrc = tmp.querySelector(".ewk-scene-change-msg")?.dataset?.bg ?? "";
        return `<div class="scene-break">
  ${bgSrc ? `<div class="scene-break-img" style="background-image:url('${bgSrc}')"></div>` : ""}
  <div class="scene-break-title">장면 전환${name ? ` — ${name}` : ""}</div>
</div>`;
      }

      // ① 롤 카드
      if (tmp.querySelector(".fate-roll-card")) {
        const actor   = tmp.querySelector(".fate-roll-card__actor")?.textContent?.trim() ?? "";
        const skill   = tmp.querySelector(".fate-roll-card__skill")?.textContent?.trim() ?? "";
        const total   = tmp.querySelector(".fate-roll-card__total")?.textContent?.trim() ?? "";
        const ladder  = tmp.querySelector(".fate-roll-card__ladder")?.textContent?.trim() ?? "";
        const outEl   = tmp.querySelector("[class*='fate-outcome']");
        const outText = outEl?.textContent?.trim() ?? "";
        let opCls = "op-succeed";
        const oc = outEl?.className ?? "";
        if (oc.includes("style"))     opCls = "op-style";
        else if (oc.includes("tie"))  opCls = "op-tie";
        else if (oc.includes("fail")) opCls = "op-fail";

        // 면모/특기 발현 (주사위 없음) → sys-note
        if (!msg.rolls?.length) {
          const label = tmp.querySelector("p")?.textContent?.trim() ?? "";
          return `<div class="sys-note"><strong>${actor}</strong> — ${skill}${label ? ` <em>${label}</em>` : ""}</div>`;
        }

        const roll    = msg.rolls[0];
        const results = roll.dice?.[0]?.results ?? [];
        const dieHtml = results.map(r => {
          if (r.result === 3) return `<span class="print-die pdie-p">+</span>`;
          if (r.result === 1) return `<span class="print-die pdie-m">−</span>`;
          return `<span class="print-die pdie-b"></span>`;
        }).join("");
        const rank    = (roll.total ?? 0) - (roll.dice?.[0]?.total ?? 0);
        const modHtml = rank !== 0
          ? `<span class="rb-mod">${rank > 0 ? "+" : ""}${rank}</span><span class="rb-sep">=</span>`
          : `<span class="rb-sep">=</span>`;

        return `<div class="roll-block">
  <div class="roll-block-header">
    <span class="rb-actor">${actor}</span>
    <span class="rb-skill">${skill}</span>
  </div>
  <div class="roll-block-body">
    ${dieHtml}${modHtml}<span class="rb-total">${total}</span>
    <span class="rb-ladder">${ladder}</span>
    <div class="rb-outcome"><span class="outcome-print ${opCls}">${outText}</span></div>
  </div>
</div>`;
      }

      // ② 대화 (actor가 연결된 메시지)
      if (msg.speaker?.actor) {
        const alias = msg.speaker?.alias || tmp.textContent?.trim();
        if (!alias) return null;
        return `<div class="dialogue">
  <span class="dlg-speaker">${alias}</span>
  <span class="dlg-text">${sanitize(raw)}</span>
</div>`;
      }

      // ③ 서술 (화자 없음)
      const text = tmp.textContent?.trim();
      if (!text) return null;
      return `<p class="narration">${sanitize(raw)}</p>`;
    };

    const blocks = msgs.map(parseBlock).filter(Boolean).join("\n");

    // ── 폰트 경로 (FVTT 정적 파일 서빙 기준) ─────────────────
    const fontBase = "/systems/fate-core-ko/design/End-War Knight Design System/assets/fonts";

    const html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8">
<title>${worldTitle} — 플레이 로그</title>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
@font-face{font-family:'NotoSerif';font-weight:400;src:url('${fontBase}/NotoSerifKR-Regular.ttf') format('truetype');}
@font-face{font-family:'NotoSerif';font-weight:700;src:url('${fontBase}/NotoSerifKR-Bold.ttf') format('truetype');}
@font-face{font-family:'NotoSerif';font-weight:900;src:url('${fontBase}/NotoSerifKR-Black.ttf') format('truetype');}
@font-face{font-family:'NotoSans';font-weight:100 900;src:url('${fontBase}/NotoSansKR-Variable.ttf') format('truetype');}

body{background:#6b6b6b;padding:24px;font-family:'NotoSerif','Nanum Myeongjo',Georgia,serif;}

/* ── 화면 미리보기 카드 ── */
.page{
  width:148mm;min-height:210mm;
  background:#f6efdd;margin:0 auto 28px;
  padding:16mm 18mm 14mm;
  color:#2a2317;box-shadow:0 6px 28px rgba(0,0,0,.4);
  font-size:10pt;line-height:1.9;
}

/* ── 로그 헤더 ── */
.log-header{
  padding-bottom:7pt;border-bottom:1.5pt solid #cbb588;margin-bottom:15pt;
}
.log-title{
  font-family:'NotoSerif',serif;font-size:16pt;font-weight:900;
  color:#2a2317;line-height:1.2;margin-bottom:3pt;
}
.log-meta{
  font-family:'NotoSans',sans-serif;font-size:7.5pt;
  color:#8a7a5c;letter-spacing:.1em;
}

/* ── 서술 ── */
.narration{
  margin:7pt 0;
  font-family:'NotoSerif',serif;font-size:10pt;line-height:1.95;
  color:#2a2317;text-indent:1.1em;text-align:justify;
}

/* ── 대화 ── */
.dialogue{margin:6pt 0 6pt 8pt;display:flex;flex-direction:column;gap:1.5pt;}
.dlg-speaker{
  font-family:'NotoSans',sans-serif;font-size:8pt;font-weight:700;
  color:#5b4e38;letter-spacing:.06em;
}
.dlg-text{
  font-family:'NotoSerif',serif;font-size:10pt;
  line-height:1.85;color:#2a2317;margin-left:1em;
}

/* ── 롤 블록 ── */
.roll-block{margin:8pt 0;border:.75pt solid #cbb588;border-radius:3pt;overflow:hidden;}
.roll-block-header{
  background:#efe5cc;padding:3.5pt 8pt;
  display:flex;align-items:center;gap:7pt;border-bottom:.75pt solid #cbb588;
}
.rb-actor{font-family:'NotoSans',sans-serif;font-size:8.5pt;font-weight:700;color:#2a2317;}
.rb-skill{font-size:7pt;color:#8a7a5c;background:#e3d4af;padding:1pt 6pt;border-radius:20pt;}
.roll-block-body{padding:5pt 8pt;display:flex;align-items:center;gap:6pt;flex-wrap:wrap;}
.print-die{
  display:inline-flex;align-items:center;justify-content:center;
  width:14.5pt;height:14.5pt;border-radius:2.5pt;
  font-size:9pt;font-weight:900;border:1.5pt solid;font-family:'NotoSans',sans-serif;
}
.pdie-p{border-color:#2e6e44;color:#2e6e44;background:rgba(79,174,107,.1);}
.pdie-m{border-color:#8a162a;color:#8a162a;background:rgba(138,22,42,.07);}
.pdie-b{border-color:#cbb588;color:#8a7a5c;}
.rb-mod{font-size:8.5pt;color:#5b4e38;font-variant-numeric:tabular-nums;}
.rb-sep{color:#cbb588;font-size:9pt;margin:0 1pt;}
.rb-total{font-family:'NotoSerif',serif;font-size:17pt;font-weight:900;color:#2a2317;line-height:1;}
.rb-ladder{font-family:'NotoSerif',serif;font-style:italic;font-size:9pt;color:#5b4e38;}
.rb-outcome{margin-left:auto;}
.outcome-print{
  font-family:'NotoSans',sans-serif;font-size:7pt;font-weight:700;
  letter-spacing:.1em;padding:2pt 8pt;border-radius:20pt;border:.75pt solid;
}
.op-style  {color:#6b5310;background:rgba(201,162,39,.12);border-color:#97761b;}
.op-succeed{color:#2e6e44;background:rgba(79,174,107,.1);border-color:#2e6e44;}
.op-tie    {color:#7a4d18;background:rgba(201,130,43,.1);border-color:#c9822b;}
.op-fail   {color:#8a162a;background:rgba(138,22,42,.07);border-color:#8a162a;}

/* ── 시스템 노트 ── */
.sys-note{
  margin:5pt 0;padding:3.5pt 8pt;background:#efe5cc;
  border-left:2pt solid #97761b;
  font-family:'NotoSans',sans-serif;font-size:8pt;color:#5b4e38;letter-spacing:.04em;
}

/* ── 장면 전환 ── */
.scene-break{margin:14pt 0 10pt;break-before:avoid;}
.scene-break-img{
  width:100%;height:45mm;
  background-size:cover;background-position:center;
  border-radius:3pt;margin-bottom:5pt;
}
.scene-break-title{
  font-family:'NotoSans',sans-serif;font-size:7pt;font-weight:700;
  letter-spacing:.12em;color:#97761b;text-align:center;
  padding:4pt 0;
  border-top:.5pt solid #cbb588;border-bottom:.5pt solid #cbb588;
  text-transform:uppercase;
}

/* ── 툴바 (화면 전용) ── */
.toolbar{
  position:sticky;top:0;z-index:100;
  background:#2a2317;border-bottom:1px solid #cbb588;
  padding:10px 22px;display:flex;align-items:center;gap:14px;
}
.toolbar button{
  padding:8px 20px;background:#c9a227;color:#0a0b0f;
  font-weight:700;border:none;border-radius:3px;cursor:pointer;font-size:13px;
}
.toolbar span{color:#8a7a5c;font-size:11px;}

/* ── 인쇄 ── */
@media print{
  *,*::before,*::after{-webkit-print-color-adjust:exact;print-color-adjust:exact;}
  html,body{background:white!important;padding:0!important;margin:0!important;}
  .toolbar{display:none!important;}
  .page{
    background:white!important;box-shadow:none!important;
    margin:0!important;padding:0!important;
    width:100%!important;min-height:0!important;
  }
  .roll-block,.dialogue,.sys-note{break-inside:avoid;page-break-inside:avoid;}
  .pdie-p{color:#2e6e44!important;border-color:#2e6e44!important;}
  .pdie-m{color:#8a162a!important;border-color:#8a162a!important;}
}
@page{size:A5 portrait;margin:16mm 18mm;}
</style>
</head>
<body>
<div class="toolbar">
  <button onclick="window.print()">🖨 PDF로 저장</button>
  <span>인쇄 대화상자 → 대상: <strong style="color:#cbb588">PDF로 저장</strong> &nbsp;·&nbsp; 용지 A5 &nbsp;·&nbsp; 여백 없음 &nbsp;·&nbsp; 배경 그래픽 ✓</span>
</div>
<div class="page">
  <div class="log-header">
    <div class="log-title">${sceneName}</div>
    <div class="log-meta">${worldTitle} &nbsp;·&nbsp; ${today}</div>
  </div>
  ${blocks}
</div>
</body>
</html>`;

    const win = window.open("", "_blank", "width=960,height=760");
    if (!win) { ui.notifications?.warn("팝업이 차단되었습니다. 팝업을 허용해 주세요."); return; }
    win.document.open();
    win.document.write(html);
    win.document.close();
  },

  _downloadLog() {
    const msgs = document.querySelectorAll("#ewk-chat-log li, #ewk-chat-log .chat-message");
    const lines = [];
    const scene = game.scenes?.active?.name;
    if (scene) { lines.push(`=== ${scene} ===`); lines.push(""); }
    msgs.forEach(m => {
      const sender  = m.querySelector(".message-sender")?.textContent?.trim()  ?? "";
      const content = m.querySelector(".message-content")?.textContent?.trim() ?? "";
      const ts      = m.querySelector(".message-timestamp")?.textContent?.trim() ?? "";
      if (content) lines.push(`[${ts}] ${sender}: ${content}`);
    });
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `play-log-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  },
};

// ─── Aspect Widget ─────────────────────────────────────────────────────────

const EWKAspectWidget = {
  _el:   null,
  _open: true,
  _drag: null,
  _resz: null,

  build() {
    this._el?.remove();
    const iface = document.getElementById("interface");
    if (!iface) return;
    const pos = (() => { try { return JSON.parse(localStorage.getItem("ewk-aw-pos") ?? "{}"); } catch { return {}; } })();

    const el = document.createElement("div");
    el.id = "ewk-aw";
    el.style.left = (pos.x ?? 20) + "px";
    el.style.top  = (pos.y ?? 80) + "px";
    if (pos.w) el.style.width = pos.w + "px";
    el.innerHTML = `
      <div id="ewk-aw-hdr">
        <span class="ewk-aw-title">현재 면모</span>
        <button class="ewk-aw-btn" id="ewk-aw-min" title="최소화">−</button>
      </div>
      <div id="ewk-aw-body"></div>
      <div id="ewk-aw-footer">
        ${game.user?.isGM ? '<button class="ewk-aw-add-btn" id="ewk-aw-add">+ 면모 추가</button>' : ""}
      </div>
      <div id="ewk-aw-rsz"></div>`;
    iface.appendChild(el);
    this._el = el;
    this._wire();
    this.render();
  },

  render() {
    const body = document.getElementById("ewk-aw-body");
    if (!body) return;
    const scene   = game.scenes?.active;
    const aspects = scene?.getFlag("fate-core-ko", "sceneAspects") ?? [];
    const isGM    = game.user?.isGM;

    if (!aspects.length) {
      body.innerHTML = '<div class="ewk-aw-empty">장면 면모 없음</div>';
      return;
    }

    body.innerHTML = aspects.map((a, idx) => {
      const t = a.type ?? "situation";
      return `<div class="ewk-aw-asp ewk-aw-asp--${t}" data-aw-idx="${idx}">
        <span class="ewk-aw-asp-txt">${a.label ?? ""}</span>
        ${isGM ? `<span class="ewk-aw-asp-acts">
          <button class="ewk-aw-asp-btn" data-aw-edit="${idx}" title="수정">✏</button>
          <button class="ewk-aw-asp-btn ewk-aw-asp-del" data-aw-del="${idx}" title="삭제">×</button>
        </span>` : ""}
      </div>`;
    }).join("");

    if (isGM) {
      body.querySelectorAll("[data-aw-edit]").forEach(btn => {
        btn.addEventListener("click", e => { e.stopPropagation(); this._editAspect(Number(btn.dataset.awEdit)); });
      });
      body.querySelectorAll("[data-aw-del]").forEach(btn => {
        btn.addEventListener("click", async e => {
          e.stopPropagation();
          const sc = game.scenes?.active;
          if (!sc) return;
          const list = [...(sc.getFlag("fate-core-ko", "sceneAspects") ?? [])];
          const removed = list.splice(Number(btn.dataset.awDel), 1)[0];
          await sc.setFlag("fate-core-ko", "sceneAspects", list);
          if (removed?.label) {
            ChatMessage.create({ content: `<div class="ewk-scene-change-msg"><span class="ewk-scm-label">면모 제거</span><em>${removed.label}</em></div>` });
          }
        });
      });
    }
  },

  _editAspect(idx) {
    const body  = document.getElementById("ewk-aw-body");
    const aspEl = body?.querySelector(`[data-aw-idx="${idx}"]`);
    if (!aspEl) return;
    const sc   = game.scenes?.active;
    const list = [...(sc?.getFlag("fate-core-ko", "sceneAspects") ?? [])];
    const a    = list[idx];
    if (!a) return;
    aspEl.innerHTML = `<input class="ewk-aw-inp" value="${(a.label ?? "").replace(/"/g,"&quot;")}">
      <button class="ewk-aw-asp-btn" data-aw-ok>✓</button>
      <button class="ewk-aw-asp-btn" data-aw-cx>✕</button>`;
    const inp = aspEl.querySelector("input");
    const ok  = aspEl.querySelector("[data-aw-ok]");
    const cx  = aspEl.querySelector("[data-aw-cx]");
    const save = async () => {
      const val = inp.value.trim();
      if (!val) return;
      const oldLabel = a.label ?? "";
      list[idx].label = val;
      await sc.setFlag("fate-core-ko", "sceneAspects", list);
      if (oldLabel !== val) {
        ChatMessage.create({ content: `<div class="ewk-scene-change-msg"><span class="ewk-scm-label">면모 수정</span><em>${val}</em></div>` });
      }
    };
    ok.addEventListener("click", save);
    cx.addEventListener("click", () => this.render());
    inp.addEventListener("keydown", e => {
      if (e.key === "Enter") save();
      if (e.key === "Escape") this.render();
    });
    inp.focus(); inp.select();
  },

  _wire() {
    const el = this._el;
    if (!el) return;
    const hdr = document.getElementById("ewk-aw-hdr");
    const rsz = document.getElementById("ewk-aw-rsz");

    hdr?.addEventListener("mousedown", e => {
      if (e.target.closest("button")) return;
      const r = el.getBoundingClientRect();
      this._drag = { sx: e.clientX, sy: e.clientY, ox: r.left, oy: r.top };
      e.preventDefault();
    });
    rsz?.addEventListener("mousedown", e => {
      this._resz = { sx: e.clientX, ow: el.getBoundingClientRect().width };
      e.preventDefault(); e.stopPropagation();
    });
    document.addEventListener("mousemove", e => {
      if (this._drag) {
        el.style.left = (this._drag.ox + e.clientX - this._drag.sx) + "px";
        el.style.top  = (this._drag.oy + e.clientY - this._drag.sy) + "px";
      }
      if (this._resz) {
        el.style.width = Math.max(180, Math.min(600, this._resz.ow + e.clientX - this._resz.sx)) + "px";
      }
    });
    document.addEventListener("mouseup", () => {
      if (this._drag || this._resz) {
        const pos = (() => { try { return JSON.parse(localStorage.getItem("ewk-aw-pos") ?? "{}"); } catch { return {}; } })();
        if (this._drag) { pos.x = parseInt(el.style.left); pos.y = parseInt(el.style.top); }
        if (this._resz) { pos.w = parseInt(el.style.width); }
        localStorage.setItem("ewk-aw-pos", JSON.stringify(pos));
      }
      this._drag = null; this._resz = null;
    });

    document.getElementById("ewk-aw-min")?.addEventListener("click", () => {
      this._open = !this._open;
      document.getElementById("ewk-aw-body").style.display   = this._open ? "" : "none";
      document.getElementById("ewk-aw-footer").style.display = this._open ? "" : "none";
      document.getElementById("ewk-aw-rsz").style.display    = this._open ? "" : "none";
      document.getElementById("ewk-aw-min").textContent      = this._open ? "−" : "+";
    });

    document.getElementById("ewk-aw-add")?.addEventListener("click", async () => {
      const sc = game.scenes?.active;
      if (!sc) return;
      const label = window.prompt("새 장면 면모 이름:");
      if (!label?.trim()) return;
      const list = [...(sc.getFlag("fate-core-ko", "sceneAspects") ?? [])];
      list.push({ id: foundry.utils.randomID(), label: label.trim(), type: "situation" });
      await sc.setFlag("fate-core-ko", "sceneAspects", list);
      ChatMessage.create({ content: `<div class="ewk-scene-change-msg"><span class="ewk-scm-label">면모 추가</span><em>${label.trim()}</em></div>` });
    });
  },
};

// ─── Scene Rail ────────────────────────────────────────────────────────────

const FateSceneRail = {
  _el: null,

  render() {
    // Scene rail is GM-only
    if (!game.user?.isGM) {
      if (this._el) { this._el.remove(); this._el = null; }
      return;
    }
    if (!game.scenes) return;

    if (!this._el) {
      this._el = document.createElement("div");
      this._el.id = "fate-scene-rail";
      document.getElementById("interface")?.appendChild(this._el);
      this._el.addEventListener("click", async e => {
        const thumb = e.target.closest("[data-scene-id]");
        if (!thumb) return;
        const scene = game.scenes?.get(thumb.dataset.sceneId);
        if (scene) await scene.activate().catch(() => {});
      });
    }

    const active = game.scenes.active;
    const scenes = game.scenes.contents;

    // Group by folder name (chapters)
    const byFolder = new Map();
    scenes.forEach(s => {
      const ch = s.folder?.name ?? "장면";
      if (!byFolder.has(ch)) byFolder.set(ch, []);
      byFolder.get(ch).push(s);
    });

    const chapters = [...byFolder.keys()];
    const activeCh = (active?.folder?.name ?? chapters[0]) ?? "장면";
    const visible  = byFolder.get(activeCh) ?? scenes;

    const thumbsHtml = arr => arr.map(s => {
      // v13: scene.thumb is the generated thumbnail (base64 or path); fall back to background image
      const imgSrc = s.thumb || s.background?.src || "";
      return `
        <div class="srl__thumb${s.id === active?.id ? " srl__thumb--active" : ""}"
             data-scene-id="${s.id}" data-name="${s.name}">
          ${imgSrc ? `<img src="${imgSrc}" alt="${s.name}">` : `<div class="srl__thumb-ph"><span>${s.name}</span></div>`}
        </div>`;
    }).join("");

    this._el.innerHTML = `
      <span class="srl__lbl">장면</span>
      <select class="srl__chapter" id="fate-srl-ch">
        <option value="">전체 장면</option>
        ${chapters.map(ch => `<option value="${ch}"${ch === activeCh ? " selected" : ""}>${ch}</option>`).join("")}
      </select>
      <div class="srl__thumbs" id="fate-srl-thumbs">${thumbsHtml(visible)}</div>
    `;

    document.getElementById("fate-srl-ch")?.addEventListener("change", e => {
      const ch = e.target.value;
      const box = document.getElementById("fate-srl-thumbs");
      if (box) box.innerHTML = thumbsHtml(ch ? (byFolder.get(ch) ?? []) : scenes);
    });
  },
};

// ─── Stage Bar ─────────────────────────────────────────────────────────────

const FateStageBar = {
  _el: null,

  async render() {
    if (!this._el) {
      this._el = document.createElement("div");
      this._el.id = "fate-stage-bar";
      this._el.className = "fate-core-ko";
      document.getElementById("interface")?.appendChild(this._el);
    }

    const mySpeakerId = localStorage.getItem(`ewk-speaker-${game.userId}`) ?? null;

    const actors = (game.actors?.contents ?? [])
      .filter(a => a.getFlag("fate-core-ko", "onStage"))
      .map(a => ({
        id: a.id,
        name: a.name,
        img: a.img,
        fp: a.system?.fatepoints ?? { current: 0, refresh: 3 },
        isSpeaker: a.id === mySpeakerId,
        role: a.getFlag("fate-core-ko", "role") || "",
        color: a.getFlag("fate-core-ko", "color") || "var(--accent-gold)",
        aspects: a.items.filter(i => i.type === "aspect").slice(0, 2),
      }));

    this._el.innerHTML = await foundry.applications.handlebars.renderTemplate(
      "systems/fate-core-ko/templates/stage/stage-bar.hbs",
      { actors }
    );
    this._bindEvents();
  },

  _bindEvents() {
    const el = this._el;
    if (!el) return;

    el.querySelectorAll("[data-stage-action='remove']").forEach(btn => {
      btn.addEventListener("click", async e => {
        const id = e.currentTarget.closest("[data-actor-id]")?.dataset.actorId;
        const actor = game.actors.get(id);
        if (!actor) return;
        await actor.unsetFlag("fate-core-ko", "onStage");
        // 내 발언 액터였으면 해제
        if (localStorage.getItem(`ewk-speaker-${game.userId}`) === id)
          localStorage.removeItem(`ewk-speaker-${game.userId}`);
        this.render();
      });
    });

    // 발언 버튼: 클라이언트 로컬 선택 (토글)
    el.querySelectorAll("[data-stage-action='speak']").forEach(btn => {
      btn.addEventListener("click", e => {
        const id = e.currentTarget.closest("[data-actor-id]")?.dataset.actorId;
        const key = `ewk-speaker-${game.userId}`;
        if (localStorage.getItem(key) === id) {
          localStorage.removeItem(key); // 이미 선택된 경우 해제
        } else {
          localStorage.setItem(key, id);
        }
        this.render();
      });
    });

    // 스테이지 바 드롭 영역 (액터 패널에서 드래그 → 무대 등장)
    el.addEventListener("dragover", e => { e.preventDefault(); el.classList.add("ewk-hud--dragover"); });
    el.addEventListener("dragleave", () => el.classList.remove("ewk-hud--dragover"));
    el.addEventListener("drop", async e => {
      e.preventDefault();
      el.classList.remove("ewk-hud--dragover");
      const actorId = e.dataTransfer?.getData("ewk-actor-id");
      if (!actorId) return;
      const actor = game.actors?.get(actorId);
      if (actor) await actor.setFlag("fate-core-ko", "onStage", true);
    });

    el.querySelectorAll("[data-stage-action='fp-minus']").forEach(btn => {
      btn.addEventListener("click", async e => {
        const id = e.currentTarget.closest("[data-actor-id]")?.dataset.actorId;
        const actor = game.actors.get(id);
        if (!actor) return;
        const cur = actor.system.fatepoints.current;
        await actor.update({ "system.fatepoints.current": Math.max(0, cur - 1) });
        this.render();
      });
    });

    el.querySelectorAll("[data-stage-action='fp-plus']").forEach(btn => {
      btn.addEventListener("click", async e => {
        const id = e.currentTarget.closest("[data-actor-id]")?.dataset.actorId;
        const actor = game.actors.get(id);
        if (!actor) return;
        const cur = actor.system.fatepoints.current;
        await actor.update({ "system.fatepoints.current": cur + 1 });
        this.render();
      });
    });
  },
};

// ─── Quick Actor Dock ──────────────────────────────────────────────────────
// 자유 드래그 가능한 플로팅 출연진 핫바 (면모 위젯과 동일한 드래그 방식).
// 액터 패널 카드를 드래그하여 등록; 초상화 클릭=발언권, 버튼으로 무대/발언 토글.
const EWKQuickDock = {
  _el:   null,
  _drag: null,
  _open: true,

  _key()    { return `ewk-qdock-${game.userId}`; },
  _posKey() { return `ewk-qdock-pos-${game.userId}`; },

  _getPos() { try { return JSON.parse(localStorage.getItem(this._posKey()) ?? "{}"); } catch { return {}; } },
  _savePos(x, y) { localStorage.setItem(this._posKey(), JSON.stringify({ x, y })); },

  getRoster() { try { return JSON.parse(localStorage.getItem(this._key()) ?? "[]"); } catch { return []; } },
  _saveRoster(ids) { localStorage.setItem(this._key(), JSON.stringify(ids)); },

  addActor(id) {
    const ids = this.getRoster();
    if (!ids.includes(id)) { ids.push(id); this._saveRoster(ids); }
    this.render();
  },
  removeActor(id) {
    this._saveRoster(this.getRoster().filter(i => i !== id));
    this.render();
  },

  build() {
    this._el?.remove();
    const iface = document.getElementById("interface");
    if (!iface) return;
    const pos = this._getPos();

    const el = document.createElement("div");
    el.id = "ewk-qdock";
    el.className = "fate-core-ko";
    el.style.left = (pos.x ?? 16) + "px";
    el.style.top  = (pos.y ?? 90) + "px";
    iface.appendChild(el);
    this._el = el;
    this._wire();
    this.render();
  },

  render() {
    const el = this._el;
    if (!el) return;
    const roster = this.getRoster();
    const mySpeakerId = localStorage.getItem(`ewk-speaker-${game.userId}`) ?? null;

    const chips = roster.map(id => {
      const a = game.actors?.get(id);
      if (!a) return "";
      const onStage  = a.getFlag("fate-core-ko", "onStage") ?? false;
      const isSpeaker = id === mySpeakerId;
      const stageIcon = onStage  ? "▼무대" : "▲무대";
      const speakIcon = isSpeaker ? "●발언" : "○발언";
      return `<div class="ewk-qdock-chip${onStage ? " ewk-qdock-chip--on" : ""}${isSpeaker ? " ewk-qdock-chip--spk" : ""}" data-qdock-id="${id}">
  <div class="ewk-qdock-port-wrap">
    <img class="ewk-qdock-port" src="${a.img}" alt="${a.name}">
    ${onStage  ? '<span class="ewk-qdock-badge ewk-qdock-badge--stage">ON</span>' : ""}
    ${isSpeaker ? '<span class="ewk-qdock-badge ewk-qdock-badge--spk">발언</span>' : ""}
  </div>
  <div class="ewk-qdock-name">${a.name}</div>
  <div class="ewk-qdock-acts">
    <button class="ewk-qdock-act${onStage ? " active-stage" : ""}" data-qdock-stage="${id}" title="${onStage ? "무대 퇴장" : "무대 등장"}">${stageIcon}</button>
    <button class="ewk-qdock-act${isSpeaker ? " active-spk" : ""}" data-qdock-speak="${id}" title="${isSpeaker ? "발언 해제" : "발언 선택"}">${speakIcon}</button>
    <button class="ewk-qdock-act ewk-qdock-act--kick" data-qdock-kick="${id}" title="목록에서 제거">✕</button>
  </div>
</div>`;
    }).join("");

    const body = el.querySelector("#ewk-qdock-body");
    const newBody = `<div id="ewk-qdock-body"${this._open ? "" : ' style="display:none"'}>${
      roster.length === 0
        ? `<div class="ewk-qdock-empty">액터 패널에서 여기로 드래그</div>`
        : `<div class="ewk-qdock-chips">${chips}</div>`
    }</div>`;

    if (body) {
      body.outerHTML = newBody;
    } else {
      el.innerHTML = `
<div id="ewk-qdock-hdr">
  <span class="ewk-qdock-title">출연진</span>
  <button class="ewk-qdock-hdr-btn" id="ewk-qdock-min" title="최소화">${this._open ? "−" : "+"}</button>
</div>
${newBody}`;
      this._wire();
    }

    this._wireBody();
  },

  _wire() {
    const el = this._el;
    if (!el) return;

    // 헤더 드래그
    el.addEventListener("mousedown", e => {
      const hdr = e.target.closest("#ewk-qdock-hdr");
      if (!hdr || e.target.closest("button")) return;
      const r = el.getBoundingClientRect();
      this._drag = { sx: e.clientX, sy: e.clientY, ox: r.left, oy: r.top };
      e.preventDefault();
    });
    document.addEventListener("mousemove", e => {
      if (!this._drag) return;
      const x = Math.max(0, this._drag.ox + e.clientX - this._drag.sx);
      const y = Math.max(0, this._drag.oy + e.clientY - this._drag.sy);
      el.style.left = x + "px";
      el.style.top  = y + "px";
    });
    document.addEventListener("mouseup", () => {
      if (this._drag) {
        this._savePos(parseInt(el.style.left), parseInt(el.style.top));
        this._drag = null;
      }
    });

    // 드롭 영역
    el.addEventListener("dragover", e => { e.preventDefault(); el.classList.add("ewk-qdock--over"); });
    el.addEventListener("dragleave", e => {
      if (!el.contains(e.relatedTarget)) el.classList.remove("ewk-qdock--over");
    });
    el.addEventListener("drop", e => {
      e.preventDefault();
      el.classList.remove("ewk-qdock--over");
      const id = e.dataTransfer?.getData("ewk-actor-id");
      if (id) this.addActor(id);
    });
  },

  _wireBody() {
    const el = this._el;
    if (!el) return;

    // 최소화 버튼 (re-wire after render replaces innerHTML)
    el.querySelector("#ewk-qdock-min")?.addEventListener("click", () => {
      this._open = !this._open;
      const body = el.querySelector("#ewk-qdock-body");
      if (body) body.style.display = this._open ? "" : "none";
      const btn = el.querySelector("#ewk-qdock-min");
      if (btn) btn.textContent = this._open ? "−" : "+";
    });

    // 초상화 클릭 → 발언권 토글
    el.querySelectorAll(".ewk-qdock-port").forEach(img => {
      img.addEventListener("click", e => {
        e.stopPropagation();
        const id = img.closest("[data-qdock-id]")?.dataset.qdockId;
        if (!id) return;
        const key = `ewk-speaker-${game.userId}`;
        localStorage.getItem(key) === id ? localStorage.removeItem(key) : localStorage.setItem(key, id);
        this.render(); FateStageBar.render();
      });
    });

    // 무대 버튼
    el.querySelectorAll("[data-qdock-stage]").forEach(btn => {
      btn.addEventListener("click", async e => {
        e.stopPropagation();
        const id    = btn.dataset.qdockStage;
        const actor = game.actors?.get(id);
        if (!actor) return;
        const onStage = actor.getFlag("fate-core-ko", "onStage") ?? false;
        if (onStage) {
          await actor.unsetFlag("fate-core-ko", "onStage");
          if (localStorage.getItem(`ewk-speaker-${game.userId}`) === id)
            localStorage.removeItem(`ewk-speaker-${game.userId}`);
        } else {
          await actor.setFlag("fate-core-ko", "onStage", true);
        }
        this.render(); FateStageBar.render();
      });
    });

    // 발언 버튼
    el.querySelectorAll("[data-qdock-speak]").forEach(btn => {
      btn.addEventListener("click", e => {
        e.stopPropagation();
        const id  = btn.dataset.qdockSpeak;
        const key = `ewk-speaker-${game.userId}`;
        localStorage.getItem(key) === id ? localStorage.removeItem(key) : localStorage.setItem(key, id);
        this.render(); FateStageBar.render();
      });
    });

    // 제거 버튼
    el.querySelectorAll("[data-qdock-kick]").forEach(btn => {
      btn.addEventListener("click", e => { e.stopPropagation(); this.removeActor(btn.dataset.qdockKick); });
    });
  },
};

// ─── Scene Aspects Panel ───────────────────────────────────────────────────

class FateScenePanel extends foundry.applications.api.HandlebarsApplicationMixin(
  foundry.applications.api.ApplicationV2
) {
  static DEFAULT_OPTIONS = {
    id: "fate-scene-panel",
    classes: ["fate-core-ko", "fate-scene-panel"],
    position: { width: 300, height: "auto", top: 70, left: 320 },
    window: { title: "장면 면모", resizable: false },
  };

  static PARTS = {
    panel: { template: "systems/fate-core-ko/templates/stage/scene-panel.hbs" },
  };

  async _prepareContext(options) {
    const scene = game.scenes?.active;
    return {
      aspects: scene?.getFlag("fate-core-ko", "aspects") ?? [],
      hasScene: !!scene,
      sceneName: scene?.name ?? "",
    };
  }

  _onRender(context, options) {
    const el = this.element;

    el.querySelector("[data-scene-action='add']")?.addEventListener("click", async () => {
      const scene = game.scenes?.active;
      if (!scene) return;
      const aspects = [...(scene.getFlag("fate-core-ko", "aspects") ?? [])];
      aspects.push({ id: foundry.utils.randomID(), label: "새 장면 면모", type: "situation" });
      await scene.setFlag("fate-core-ko", "aspects", aspects);
      this.render();
    });

    el.querySelectorAll("[data-scene-action='delete']").forEach(btn => {
      btn.addEventListener("click", async e => {
        const id = e.currentTarget.dataset.aspectId;
        const scene = game.scenes?.active;
        if (!scene) return;
        const aspects = (scene.getFlag("fate-core-ko", "aspects") ?? []).filter(a => a.id !== id);
        await scene.setFlag("fate-core-ko", "aspects", aspects);
        this.render();
      });
    });

    el.querySelectorAll("[data-scene-aspect-id]").forEach(input => {
      input.addEventListener("change", async e => {
        e.stopPropagation();
        const id = e.currentTarget.dataset.sceneAspectId;
        const scene = game.scenes?.active;
        if (!scene) return;
        const aspects = (scene.getFlag("fate-core-ko", "aspects") ?? []).map(a =>
          a.id === id ? { ...a, label: e.currentTarget.value } : a
        );
        await scene.setFlag("fate-core-ko", "aspects", aspects);
      });
    });

    el.querySelectorAll("[data-scene-action='invoke']").forEach(btn => {
      btn.addEventListener("click", async e => {
        const id = e.currentTarget.dataset.aspectId;
        const scene = game.scenes?.active;
        const aspect = (scene?.getFlag("fate-core-ko", "aspects") ?? []).find(a => a.id === id);
        if (!aspect) return;
        await ChatMessage.create({
          content: `<div class="fate-roll-card" style="border-top-color:var(--accent-gold)">
            <div class="fate-roll-card__header">
              <span class="fate-roll-card__actor">장면 면모</span>
              <span class="fate-roll-card__skill">상황</span>
            </div>
            <p style="font-style:italic;margin:4px 0 0">"${aspect.label}"</p>
          </div>`,
        });
      });
    });
  }
}

// ─── Fate Dice Roll ────────────────────────────────────────────────────────

async function rollFate(actor, skillItem) {
  const roll = new Roll("4dF");
  await roll.evaluate();

  const rank  = skillItem?.system.rank ?? 0;
  const total = roll.total + rank;
  const outcome = getFateOutcome(total);

  const diceHtml = roll.dice[0].results.map(r => {
    if (r.result === 3) return '<span class="fate-die fate-die--plus">+</span>';
    if (r.result === 1) return '<span class="fate-die fate-die--minus">−</span>';
    return '<span class="fate-die fate-die--blank"></span>';
  }).join("");

  const clampedTotal = Math.max(-4, Math.min(8, total));
  const ladderKey    = CONFIG.FATE.ladder[clampedTotal] ?? CONFIG.FATE.ladder[0];
  const ladderLabel  = game.i18n.localize(ladderKey);

  const OUTCOME_KO = { SucceedWithStyle: "멋지게 성공", Succeed: "성공", Tie: "비김", Fail: "실패" };

  const content = await foundry.applications.handlebars.renderTemplate(
    "systems/fate-core-ko/templates/chat/roll-card.hbs",
    {
      actor,
      skillName: skillItem?.name ?? "",
      rank,
      diceHtml,
      diceTotal: roll.total,
      total,
      ladderLabel,
      outcome: OUTCOME_KO[outcome] ?? outcome,
      outcomeClass: outcome.toLowerCase(),
    }
  );

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content,
    rolls: [roll],
    sound: CONFIG.sounds.dice,
  });
}

function getFateOutcome(total) {
  if (total >= 3) return "SucceedWithStyle";
  if (total >= 1) return "Succeed";
  if (total === 0) return "Tie";
  return "Fail";
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ─── Init ─────────────────────────────────────────────────────────────────

Hooks.once("init", () => {
  CONFIG.Dice.terms["F"] = FateDie;

  CONFIG.FATE = {
    ladder: {
      8: "FATE.Ladder.8",  7: "FATE.Ladder.7", 6: "FATE.Ladder.6",
      5: "FATE.Ladder.5",  4: "FATE.Ladder.4", 3: "FATE.Ladder.3",
      2: "FATE.Ladder.2",  1: "FATE.Ladder.1", 0: "FATE.Ladder.0",
      [-1]: "FATE.Ladder.-1", [-2]: "FATE.Ladder.-2",
      [-3]: "FATE.Ladder.-3", [-4]: "FATE.Ladder.-4",
    },
  };

  Handlebars.registerHelper("gte", (a, b) => a >= b);
  Handlebars.registerHelper("localizeAspectType", t =>
    game.i18n.localize(`FATE.Item.Aspect.Type.${t ?? "general"}`)
  );

  // each_times 헬퍼 — {{#each_times N}} {{@index}} {{/each_times}}
  Handlebars.registerHelper("each_times", function(n, options) {
    let result = "";
    for (let i = 0; i < n; i++) {
      result += options.fn(this, { data: options.data, blockParams: [i] });
    }
    return result;
  });

  const Actors     = foundry.documents.collections.Actors;
  const Items      = foundry.documents.collections.Items;
  const ActorSheet = foundry.appv1.sheets.ActorSheet;
  const ItemSheet  = foundry.appv1.sheets.ItemSheet;

  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("fate-core-ko", FateCharacterSheet, {
    types: ["character", "npc"],
    makeDefault: true,
    label: "페이트 코어 캐릭터 시트",
  });

  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("fate-core-ko", FateItemSheet, {
    makeDefault: true,
    label: "페이트 코어 아이템 시트",
  });
});

// ─── Ready ────────────────────────────────────────────────────────────────

Hooks.once("ready", () => {
  // 우리 커스텀 사이드바 빌드 (FVTT #sidebar는 CSS에서 숨김)
  EWKSidebar.build();
  FateStageBar.render();
  FateSceneRail.render();
  EWKAspectWidget.build();
  EWKQuickDock.build();

  // FVTT 기본 컨트롤 버튼 제거
  setTimeout(() => {
    document.getElementById("controls")?.remove();
    document.getElementById("ui-left")?.remove();
  }, 500);

  // FVTT가 사이드바를 재렌더할 때 패널 재채택
  Hooks.on("renderSidebar", () => {
    setTimeout(() => EWKSidebar._adoptFVTTPanels(), 200);
  });

  // FVTT ChatLog 렌더 완료 시 우리 로그에 복사 (renderChatMessageHTML 이전에 호출됐을 경우 대비)
  Hooks.on("renderChatLog", () => {
    setTimeout(() => EWKSidebar._loadExistingMessages(), 150);
  });

  // 개별 메시지 삭제 시 우리 로그에서도 제거
  Hooks.on("deleteChatMessage", (message) => {
    document.querySelector(`#ewk-chat-log [data-message-id="${message.id}"]`)?.remove();
  });

  // 메시지 수정 시: DOM 참조를 저장해두고 addMessage 에서 제자리 교체
  Hooks.on("updateChatMessage", (message) => {
    const existing = document.querySelector(`#ewk-chat-log [data-message-id="${message.id}"]`);
    if (existing) EWKSidebar._pendingUpdates[message.id] = existing;
  });

  // 배경 이미지 업데이트
  const updateBg = () => {
    const bgSrc = game.scenes?.active?.background?.src;
    const bgEl  = document.getElementById("ewk-scene-bg");
    if (bgEl) bgEl.style.backgroundImage = bgSrc ? `url("${bgSrc}")` : "";
  };
  updateBg(); // 초기 씬 적용

  // 장면 전환 오버레이
  const doSceneTransition = () => {
    let ov = document.getElementById("ewk-transition");
    if (!ov) {
      ov = document.createElement("div");
      ov.id = "ewk-transition";
      document.getElementById("interface")?.appendChild(ov);
    }
    ov.style.transition = "none";
    ov.style.opacity = "1";
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        ov.style.transition = "opacity 0.8s ease 0.3s";
        ov.style.opacity = "0";
      });
    });
  };

  // canvasReady: 전환 애니메이션 + UI 갱신 (리소스 로드 완료 후 실행)
  let _prevCanvasSceneId = game.scenes?.active?.id ?? null;

  const refreshActors = () => {
    FateStageBar.render();
    EWKQuickDock.render();
    if (EWKSidebar._activeTab === "actors") EWKSidebar._renderActorPanel();
  };
  const refreshFolders = (folder) => {
    if (folder?.type === "Actor" && EWKSidebar._activeTab === "actors") EWKSidebar._renderActorPanel();
  };
  Hooks.on("createActor",  refreshActors);
  Hooks.on("updateActor",  refreshActors);
  Hooks.on("deleteActor",  refreshActors);
  Hooks.on("createFolder", refreshFolders);
  Hooks.on("updateFolder", refreshFolders);
  Hooks.on("deleteFolder", refreshFolders);

  Hooks.on("canvasReady", () => {
    const sceneId  = game.scenes?.active?.id ?? null;
    const isChange = _prevCanvasSceneId !== null && _prevCanvasSceneId !== sceneId;
    _prevCanvasSceneId = sceneId;
    if (isChange) doSceneTransition();
    updateBg();
    FateSceneRail.render();
    EWKSidebar.updateSceneBadge();
    EWKAspectWidget.render();
  });

  // updateScene: 장면 활성화 감지 → 채팅 메시지 (canvas 로딩 전에 실행되므로 FVTT 로딩 가드에 영향받지 않음)
  Hooks.on("updateScene", async (scene, changes) => {
    updateBg();
    FateSceneRail.render();
    EWKSidebar.updateSceneBadge();
    EWKAspectWidget.render();
    foundry.applications.instances.get("fate-scene-panel")?.render();

    if (changes.active === true && game.user?.isGM) {
      const bgSrc = scene.background?.src ?? "";
      await ChatMessage.create({
        content: `<div class="ewk-scene-change-msg" data-bg="${bgSrc}">
          <span class="ewk-scm-label">장면 전환</span>
          <span class="ewk-scm-name">${scene.name}</span>
        </div>`,
        speaker: { alias: "내레이터" },
      });
    }
  });

  Hooks.on("createScene", () => FateSceneRail.render());
  Hooks.on("deleteScene", () => FateSceneRail.render());
});

// ─── Scene Controls ───────────────────────────────────────────────────────

Hooks.on("getSceneControlButtons", controls => {
  // v13: controls is a Map-like object keyed by group name
  const tokenGroup = typeof controls.get === "function"
    ? controls.get("token")
    : Array.isArray(controls) ? controls.find(c => c.name === "token") : null;

  const tools = tokenGroup?.tools ?? tokenGroup?.buttons;
  if (!tools) return;

  const entry = {
    name: "fate-scene-aspects",
    title: "장면 면모",
    icon: "fas fa-scroll",
    button: true,
    onClick: () => {
      const existing = foundry.applications.instances.get("fate-scene-panel");
      if (existing?.rendered) { existing.close(); return; }
      new FateScenePanel().render(true);
    },
  };

  if (typeof tools.set === "function") tools.set("fate-scene-aspects", entry);
  else if (Array.isArray(tools)) tools.push(entry);
});

// ─── Chat Speaker Override (ON AIR) ───────────────────────────────────────

Hooks.on("preCreateChatMessage", (message, data, options, userId) => {
  if (userId !== game.userId) return;
  if (message.rolls?.length > 0) return;
  const speakerId = localStorage.getItem(`ewk-speaker-${game.userId}`);
  if (!speakerId) return;
  const speakerActor = game.actors?.get(speakerId);
  if (!speakerActor) return;
  const speaker = ChatMessage.getSpeaker({ actor: speakerActor });
  speaker.alias = speakerActor.name;
  message.updateSource({ speaker });
});

// ─── Chat Styling ─────────────────────────────────────────────────────────

Hooks.on("renderChatMessageHTML", (message, html) => {
  const el = html instanceof HTMLElement ? html : html[0];
  if (!el) return;
  el.classList.add("ewk-chat");

  if (el.querySelector(".fate-roll-card")) {
    el.classList.add("ewk-chat--roll");
    // 롤 카드도 우리 로그에 추가
    EWKSidebar.addMessage(el);
    return;
  }

  const actorId = message.speaker?.actor;
  const actor = actorId ? game.actors?.get(actorId) : null;

  if (actor) {
    el.classList.add("ewk-chat--dialogue");
    const header = el.querySelector(".message-header");
    if (header) {
      const senderEl = header.querySelector(".message-sender");
      if (senderEl) senderEl.textContent = actor.name;
      if (!header.querySelector(".ewk-speaker-portrait")) {
        const img = document.createElement("img");
        img.className = "ewk-speaker-portrait";
        img.src = actor.img;
        img.alt = actor.name;
        header.prepend(img);
      }
    }
    if (actor.getFlag("fate-core-ko", "isSpeaker") && !el.querySelector(".fate-roll-card")) {
      const content = el.querySelector(".message-content")?.textContent?.trim();
      if (content) FateVNBox.show(actor, content);
    }
  } else {
    el.classList.add("ewk-chat--narration");
  }

  // 수정/삭제 버튼 (GM 또는 작성자)
  if (game.user?.isGM || message.isAuthor) {
    const acts = document.createElement("div");
    acts.className = "ewk-msg-acts";
    acts.innerHTML = `<button class="ewk-mact" data-msg-edit="${message.id}" title="수정">✏</button>
      <button class="ewk-mact ewk-mact--del" data-msg-del="${message.id}" title="삭제">×</button>`;
    el.appendChild(acts);
  }

  // 스타일링 완료 후 우리 로그에 추가
  EWKSidebar.addMessage(el);
});
