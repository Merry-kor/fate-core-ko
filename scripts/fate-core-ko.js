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

    // 비채팅 패널 — actors/items는 커스텀 렌더, 나머지는 FVTT 패널 이동
    const CUSTOM_PANELS = new Set(["actors", "items"]);
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
    const SKIP = new Set(["chat", "actors", "items"]);
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
    if      (key === "actors") this._renderActorPanel();
    else if (key === "items")  this._renderItemPanel();
    else if (key !== "chat") {
      try { ui.sidebar?.changeTab(key, "primary"); } catch (_) {}
      setTimeout(() => this._adoptFVTTPanels(), 100);
    }
  },

  // ── 액터 패널 ──────────────────────────────────────────────
  _renderActorPanel() {
    const panel = document.getElementById("ewk-panel-actors");
    if (!panel) return;

    const canCreate = game.user?.isGM;
    const actors = (game.actors?.contents ?? [])
      .sort((a, b) => a.name.localeCompare(b.name, "ko"));
    const chars = actors.filter(a => a.type === "character");
    const npcs  = actors.filter(a => a.type !== "character");

    const actorCard = (a) => {
      const fp    = a.system?.fatepoints;
      const stage = a.getFlag("fate-core-ko", "onStage") ?? false;
      const fpHtml = fp
        ? `<div class="ewk-acard-fp">
             <span class="ewk-acard-fp-n">${fp.current}</span>
             <span class="ewk-acard-fp-sep">/</span>
             <span class="ewk-acard-fp-r">${fp.refresh}</span>
             <span class="ewk-acard-fp-l">운명점</span>
           </div>`
        : "";
      return `<div class="ewk-acard" data-actor-id="${a.id}">
  <img class="ewk-acard-port" src="${a.img}" alt="">
  <div class="ewk-acard-body">
    <div class="ewk-acard-name">${a.name}${stage ? ' <span class="ewk-on-air">ON</span>' : ""}</div>
    ${fpHtml}
  </div>
  <button class="ewk-acard-open" data-open="${a.id}" title="시트 열기">▶</button>
</div>`;
    };

    const group = (label, list) => !list.length ? "" : `
<div class="ewk-panel-group">
  <div class="ewk-panel-group-hdr">${label}<span class="ewk-panel-group-count">${list.length}</span></div>
  ${list.map(actorCard).join("")}
</div>`;

    panel.innerHTML = `
<div class="ewk-panel-toolbar">
  ${canCreate
    ? `<button class="ewk-panel-new" data-create="character">+ 캐릭터</button>
       <button class="ewk-panel-new" data-create="npc">+ NPC</button>`
    : ""}
</div>
<div class="ewk-panel-scroll">
  ${group("플레이어 캐릭터", chars)}
  ${group("NPC", npcs)}
  ${!actors.length ? '<div class="ewk-panel-empty">액터가 없습니다.</div>' : ""}
</div>`;

    panel.querySelectorAll(".ewk-acard").forEach(el => {
      el.addEventListener("click", (e) => {
        if (e.target.closest(".ewk-acard-open")) return;
        game.actors.get(el.dataset.actorId)?.sheet?.render(true);
      });
    });
    panel.querySelectorAll(".ewk-acard-open").forEach(btn => {
      btn.addEventListener("click", () => {
        game.actors.get(btn.dataset.open)?.sheet?.render(true);
      });
    });
    panel.querySelectorAll("[data-create]").forEach(btn => {
      btn.addEventListener("click", () => {
        const type = btn.dataset.create;
        Actor.create({ name: type === "character" ? "새 캐릭터" : "새 NPC", type });
      });
    });
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

  const refreshActors = () => {
    FateStageBar.render();
    if (EWKSidebar._activeTab === "actors") EWKSidebar._renderActorPanel();
  };
  const refreshItems = () => {
    if (EWKSidebar._activeTab === "items") EWKSidebar._renderItemPanel();
  };
  Hooks.on("createActor", refreshActors);
  Hooks.on("updateActor", refreshActors);
  Hooks.on("deleteActor", refreshActors);
  Hooks.on("createItem",  refreshItems);
  Hooks.on("updateItem",  refreshItems);
  Hooks.on("deleteItem",  refreshItems);
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
