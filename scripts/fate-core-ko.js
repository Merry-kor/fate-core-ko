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

    // 면모 타입 목록
    const aspectTypes = ["identity", "trouble", "general", "situation", "longterm", "stack"].map(t => ({
      value: t,
      label: game.i18n.localize(`FATE.Item.Aspect.Type.${t}`),
    }));

    return {
      ...context,
      actor,
      system: actor.system,
      onStage: actor.getFlag("fate-core-ko", "onStage") ?? false,
      aspects:      items.filter(i => i.type === "aspect"),
      skills:       items.filter(i => i.type === "skill").sort((a, b) => b.system.rank - a.system.rank),
      stunts:       items.filter(i => i.type === "stunt"),
      stressTracks: items.filter(i => i.type === "stress"),
      consequences: items.filter(i => i.type === "consequence"),
      extras:       items.filter(i => i.type === "extra"),
      ladder,
      aspectTypes,
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

  TABS: [
    { key: "chat",       icon: "💬", label: "채팅" },
    { key: "combat",     icon: "⚔️", label: "전투" },
    { key: "scenes",     icon: "🎭", label: "장면" },
    { key: "actors",     icon: "👤", label: "액터" },
    { key: "items",      icon: "🎒", label: "아이템" },
    { key: "journal",    icon: "📖", label: "저널" },
    { key: "tables",     icon: "🎲", label: "테이블" },
    { key: "playlists",  icon: "🎵", label: "음악" },
    { key: "compendium", icon: "📚", label: "컴펜" },
    { key: "settings",   icon: "⚙️", label: "설정" },
  ],

  build() {
    document.getElementById("ewk-sidebar")?.remove();

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
      btn.innerHTML = `<span class="ewk-tab-icon">${icon}</span><span class="ewk-tab-label">${label}</span>`;
      btn.addEventListener("click", () => this._switchTab(key));
      tabstrip.appendChild(btn);
    });
    sidebar.appendChild(tabstrip);

    // ── 패널 컨테이너 ───────────────────────────────────
    const panels = document.createElement("div");
    panels.id = "ewk-panels";

    // 채팅 패널 (완전 커스텀)
    panels.appendChild(this._buildChatPanel(savedPx));

    // 비채팅 패널 (FVTT 패널을 이 안으로 이동)
    this.TABS.filter(t => t.key !== "chat").forEach(({ key }) => {
      const p = document.createElement("div");
      p.id = `ewk-panel-${key}`;
      p.className = "ewk-panel ewk-fvtt-panel";
      panels.appendChild(p);
    });

    sidebar.appendChild(panels);
    document.getElementById("interface")?.appendChild(sidebar);

    // 이벤트 연결
    this._wireWidthPresets();
    this._wireChatInput();
    this._wireChatTools();

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

  // FVTT가 렌더한 패널을 우리 컨테이너로 이동
  _adoptFVTTPanels() {
    this.TABS.forEach(({ key }) => {
      if (key === "chat") return;
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

    // 비채팅 탭: FVTT에도 알려서 필요시 재렌더
    if (key !== "chat") {
      try { ui.sidebar?.changeTab(key, "primary"); } catch (_) {}
      setTimeout(() => this._adoptFVTTPanels(), 100);
    }
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
    if (!log) {
      // 사이드바 생성 전 → 버퍼에 보관 (중복 방지)
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
    document.getElementById("ewk-print-btn")?.addEventListener("click", () => window.print());
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
        if (scene) await scene.activate();
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

    const actors = (game.actors?.contents ?? [])
      .filter(a => a.getFlag("fate-core-ko", "onStage"))
      .map(a => ({
        id: a.id,
        name: a.name,
        img: a.img,
        fp: a.system?.fatepoints ?? { current: 0, refresh: 3 },
        isSpeaker: a.getFlag("fate-core-ko", "isSpeaker") ?? false,
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
        await actor.unsetFlag("fate-core-ko", "isSpeaker");
        this.render();
      });
    });

    el.querySelectorAll("[data-stage-action='speak']").forEach(btn => {
      btn.addEventListener("click", async e => {
        const id = e.currentTarget.closest("[data-actor-id]")?.dataset.actorId;
        for (const a of game.actors.contents) {
          if (a.getFlag("fate-core-ko", "isSpeaker")) await a.unsetFlag("fate-core-ko", "isSpeaker");
        }
        const actor = game.actors.get(id);
        if (actor) await actor.setFlag("fate-core-ko", "isSpeaker", true);
        this.render();
      });
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
    return '<span class="fate-die fate-die--blank">□</span>';
  }).join("");

  const clampedTotal = Math.max(-4, Math.min(8, total));
  const ladderKey    = CONFIG.FATE.ladder[clampedTotal] ?? CONFIG.FATE.ladder[0];
  const ladderLabel  = game.i18n.localize(ladderKey);

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
      outcome: game.i18n.localize(`FATE.Roll.Outcome.${outcome}`),
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

  Hooks.on("updateActor", () => FateStageBar.render());
  Hooks.on("deleteActor", () => FateStageBar.render());
  Hooks.on("canvasReady", () => {
    FateSceneRail.render();
    EWKSidebar.updateSceneBadge();
  });
  Hooks.on("updateScene", () => {
    FateSceneRail.render();
    EWKSidebar.updateSceneBadge();
    foundry.applications.instances.get("fate-scene-panel")?.render();
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
  // Roll messages already have the correct speaker set by rollFate()
  if (message.rolls?.length > 0) return;
  const speakerActor = game.actors?.contents.find(a => a.getFlag("fate-core-ko", "isSpeaker"));
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

  // 스타일링 완료 후 우리 로그에 추가
  EWKSidebar.addMessage(el);
});
