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

// ─── EWK Sidebar (tabs + chat header + width presets) ─────────────────────

const EWKSidebar = {
  WIDTHS: [
    { key: "narrow", label: "좁게",    px: 300 },
    { key: "normal", label: "보통",    px: 380 },
    { key: "wide",   label: "넓게",    px: 480 },
    { key: "xwide",  label: "매우넓게", px: 560 },
  ],
  _currentWidth: "normal",
  _currentEmo: "normal",

  init() {
    this._currentWidth = localStorage.getItem("ewk-sidebar-width") ?? "normal";
    this._applyWidth();
    this._styleNativeTabs();
    this._injectChatUI();
    // Retry if DOM not ready yet when ready hook fires
    setTimeout(() => { if (!document.getElementById("ewk-chat-hdr")) this._injectChatUI(); }, 800);
    setTimeout(() => { if (!document.getElementById("ewk-chat-hdr")) this._injectChatUI(); }, 2500);
  },

  _styleNativeTabs() {
    const tabs = document.getElementById("sidebar-tabs");
    if (!tabs) return;
    // Force width via inline !important — overrides flex-basis from Foundry CSS
    tabs.style.setProperty("width", "60px", "important");
    tabs.style.setProperty("min-width", "60px", "important");
    tabs.style.setProperty("max-width", "60px", "important");
    tabs.style.setProperty("flex", "0 0 60px", "important");
    tabs.style.setProperty("flex-basis", "60px", "important");
    tabs.style.setProperty("flex-direction", "column", "important");
    tabs.querySelectorAll(".item").forEach(item => {
      item.style.setProperty("width", "54px", "important");
      item.style.setProperty("min-width", "54px", "important");
      item.style.setProperty("flex-shrink", "0", "important");
      item.querySelectorAll("label, span, i, img").forEach(el => {
        el.style.setProperty("display", "none", "important");
      });
    });
  },

  _findChatPanel() {
    return document.getElementById("chat")
      ?? document.querySelector("#sidebar section[data-tab='chat']")
      ?? document.querySelector("#sidebar [data-tab='chat']")
      ?? document.querySelector(".sidebar-tab[data-tab='chat']")
      ?? document.querySelector("[data-tab='chat']");
  },

  _injectChatUI() {
    const chatPanel = this._findChatPanel();
    if (!chatPanel) return;

    // ── Chat Header (scene badge + width presets + log/print) ────────────
    document.getElementById("ewk-chat-hdr")?.remove();
    const sceneName = game.scenes?.active?.name ?? "장면 없음";
    const cw = this._currentWidth;
    const hdr = document.createElement("div");
    hdr.id = "ewk-chat-hdr";
    hdr.innerHTML = `
      <span class="ewk-chat-title">채팅 로그</span>
      <span class="ewk-scene-badge">${sceneName}</span>
      <div class="ewk-hdr-acts">
        <div id="ewk-wpresets">${this.WIDTHS.map(w =>
          `<button class="ewk-wpbtn${w.key === cw ? " ewk-wpbtn--on" : ""}" data-w="${w.key}">${w.label}</button>`
        ).join("")}</div>
        <button class="ewk-hdr-btn" id="ewk-dl-btn" title="채팅 로그 TXT 다운로드">⬇ 로그</button>
        <button class="ewk-hdr-btn" id="ewk-print-btn" title="세션 로그 인쇄/PDF">📄 인쇄</button>
      </div>`;

    chatPanel.prepend(hdr);

    hdr.querySelector("#ewk-dl-btn")?.addEventListener("click", () => this._downloadLog());
    hdr.querySelector("#ewk-print-btn")?.addEventListener("click", () => this._printLog());
    hdr.querySelectorAll(".ewk-wpbtn").forEach(btn => {
      btn.addEventListener("click", () => {
        this._currentWidth = btn.dataset.w;
        localStorage.setItem("ewk-sidebar-width", this._currentWidth);
        this._applyWidth();
        hdr.querySelectorAll(".ewk-wpbtn").forEach(b =>
          b.classList.toggle("ewk-wpbtn--on", b.dataset.w === this._currentWidth));
      });
    });

    // ── Emotion Tools (above chat form) ─────────────────────────────────
    document.getElementById("ewk-chat-tools")?.remove();
    const chatForm = chatPanel.querySelector("#chat-form")
      ?? chatPanel.querySelector("form")
      ?? document.querySelector("#chat-form");

    if (chatForm) {
      // Style the native input/contenteditable — force visibility via inline !important
      const chatInput = chatForm.querySelector(
        "#chat-message, input[name='content'], textarea, input[type='text'], [contenteditable]"
      );
      if (chatInput) {
        chatInput.style.setProperty("background", "#262b3a", "important");
        chatInput.style.setProperty("color", "#c3cad9", "important");
        chatInput.style.setProperty("border", "1px solid #3c4459", "important");
        chatInput.style.setProperty("border-radius", "4px", "important");
        chatInput.style.setProperty("padding", "5px 8px", "important");
        chatInput.style.setProperty("box-sizing", "border-box", "important");
        if (chatInput.tagName !== "DIV") chatInput.placeholder = "대사나 행동 입력… (Enter)";
      }

      const tools = document.createElement("div");
      tools.id = "ewk-chat-tools";
      tools.innerHTML = `
        <button class="ewk-tool-btn" data-emo-wrap="「」" title="꺾쇠 따옴표">「 」</button>
        <button class="ewk-tool-btn" data-emo-wrap='""' title="쌍따옴표">" "</button>
        <div class="ewk-tool-sep"></div>
        <button class="ewk-emo-btn ewk-emo-btn--on" data-emo="normal">보통</button>
        <button class="ewk-emo-btn" data-emo="shake" title="두려움·추위">진동</button>
        <button class="ewk-emo-btn" data-emo="shout" title="분노·절규">외침</button>
        <button class="ewk-emo-btn" data-emo="wave" title="흔들림">파동</button>
        <button class="ewk-emo-btn" data-emo="glow" title="강조">빛남</button>`;
      chatForm.parentElement.insertBefore(tools, chatForm);

      tools.querySelectorAll(".ewk-tool-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          const wrap = btn.dataset.emoWrap;
          const input = chatForm.querySelector(
            "#chat-message, input[name='content'], textarea, input[type='text']"
          );
          if (!input) return;
          const [open, close] = [wrap[0], wrap[wrap.length - 1]];
          const s = input.selectionStart, e = input.selectionEnd;
          const v = input.value;
          input.value = s !== e
            ? v.slice(0, s) + open + v.slice(s, e) + close + v.slice(e)
            : open + v + close;
          input.focus();
        });
      });

      tools.querySelectorAll(".ewk-emo-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          this._currentEmo = btn.dataset.emo;
          tools.querySelectorAll(".ewk-emo-btn").forEach(b =>
            b.classList.toggle("ewk-emo-btn--on", b === btn));
        });
      });
    }
  },

  updateSceneBadge() {
    const badge = document.querySelector(".ewk-scene-badge");
    if (badge) badge.textContent = game.scenes?.active?.name ?? "장면 없음";
  },

  _applyWidth() {
    const w = this.WIDTHS.find(x => x.key === this._currentWidth) ?? this.WIDTHS[1];
    const sidebar = document.getElementById("sidebar") ?? document.getElementById("ui-right");
    if (sidebar) {
      sidebar.style.setProperty("width", w.px + "px", "important");
      document.documentElement.style.setProperty("--foundry-sidebar-width", w.px + "px");
    }
  },

  _downloadLog() {
    const msgs = document.querySelectorAll("#chat-log li, #chat-log .chat-message");
    const lines = [];
    const scene = game.scenes?.active?.name;
    if (scene) { lines.push(`=== ${scene} ===`); lines.push(""); }
    msgs.forEach(m => {
      const sender  = m.querySelector(".message-sender")?.textContent?.trim() ?? "";
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

  _printLog() { window.print(); },
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
  // Measure the full right-panel width (from its left edge to viewport right)
  // so the scene rail and VN box stop exactly at the sidebar's left edge.
  const updateSidebarWidth = () => {
    const panel = document.getElementById("ui-right") || document.getElementById("sidebar");
    if (panel) {
      const w = window.innerWidth - panel.getBoundingClientRect().left;
      document.documentElement.style.setProperty("--foundry-sidebar-width", w + "px");
    }
  };
  updateSidebarWidth();
  setTimeout(updateSidebarWidth, 600);
  // Keep updating if sidebar resizes (e.g. collapse/expand)
  const sidebarPanel = document.getElementById("ui-right") || document.getElementById("sidebar");
  if (sidebarPanel) new ResizeObserver(updateSidebarWidth).observe(sidebarPanel);

  EWKSidebar.init();
  FateStageBar.render();
  FateSceneRail.render();

  Hooks.on("updateActor", () => FateStageBar.render());
  Hooks.on("deleteActor", () => FateStageBar.render());
  Hooks.on("canvasReady", () => {
    FateSceneRail.render();
    EWKSidebar.updateSceneBadge();
  });
  Hooks.on("updateScene",  () => {
    FateSceneRail.render();
    EWKSidebar.updateSceneBadge();
    const panel = foundry.applications.instances.get("fate-scene-panel");
    if (panel?.rendered) panel.render();
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
    // VN speech box: show for isSpeaker actor's dialogue (not roll cards)
    if (actor.getFlag("fate-core-ko", "isSpeaker") && !el.querySelector(".fate-roll-card")) {
      const content = el.querySelector(".message-content")?.textContent?.trim();
      if (content) FateVNBox.show(actor, content);
    }
  } else {
    el.classList.add("ewk-chat--narration");
  }
});
