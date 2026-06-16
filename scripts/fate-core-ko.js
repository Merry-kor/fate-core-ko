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
    window: { resizable: true },
    position: { width: 980, height: 936 },
    form: { submitOnChange: true, closeOnSubmit: false },
    actions: {
      rollSkill:        FateCharacterSheet.#onRollSkill,
      adjustFP:         FateCharacterSheet.#onAdjustFP,
      invokeAspect:     FateCharacterSheet.#onInvokeAspect,
      invokeStunt:      FateCharacterSheet.#onInvokeStunt,
      addItem:          FateCharacterSheet.#onAddItem,
      deleteItem:       FateCharacterSheet.#onDeleteItem,
      editItem:         FateCharacterSheet.#onEditItem,
      toggleStage:      FateCharacterSheet.#onToggleStage,
      pickTokenImg:     FateCharacterSheet.#onPickTokenImg,
      setPrimaryAspect: FateCharacterSheet.#onSetPrimaryAspect,
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
      const ASPECT_TYPES = ["identity", "trouble", "general"];
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

    // 면모 타입 목록 및 레이블 맵 (situation/longterm/stack 제거)
    const ASPECT_TYPE_KEYS = ["identity", "trouble", "general"];
    const aspectTypes = ASPECT_TYPE_KEYS.map(t => ({
      value: t,
      label: game.i18n.localize(`FATE.Item.Aspect.Type.${t}`),
    }));
    const aspectTypeMap = Object.fromEntries(
      ASPECT_TYPE_KEYS.map(t => [t, game.i18n.localize(`FATE.Item.Aspect.Type.${t}`)])
    );

    const ASPECT_TYPE_LABELS = { identity: "정체성", trouble: "고민", general: "일반" };
    const VALID_ASPECT_TYPES = new Set(ASPECT_TYPE_KEYS);
    const primaryAspectId = actor.getFlag("fate-core-ko", "primaryAspectId") ?? null;

    return {
      ...context,
      actor,
      system: actor.system,
      onStage: actor.getFlag("fate-core-ko", "onStage") ?? false,
      actorColor: actor.getFlag("fate-core-ko", "color") || "#c9a227",
      aspects: items.filter(i => i.type === "aspect").map(a => {
        const rawType  = a.system.aspectType ?? "general";
        const aspType  = VALID_ASPECT_TYPES.has(rawType) ? rawType : "general";
        return {
          id: a.id,
          name: a.name,
          isPrimary: a.id === primaryAspectId,
          system: {
            label:      a.system.label ?? "",
            aspectType: aspType,
            typeLabel:  ASPECT_TYPE_LABELS[aspType],
            invoke:     a.system.invoke ?? 0,
          },
        };
      }),
      skills:       items.filter(i => i.type === "skill").sort((a, b) => b.system.rank - a.system.rank),
      stunts:       items.filter(i => i.type === "stunt"),
      stressTracks: items.filter(i => i.type === "stress"),
      consequences: items.filter(i => i.type === "consequence"),
      extras:       items.filter(i => i.type === "extra"),
      tokenImg:     actor.getFlag("fate-core-ko", "tokenImg") || "",
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
    await setActorOnStage(this.actor, !onStage);
    FateStageBar.render();
  }

  static async #onPickTokenImg(event, target) {
    new FilePicker({
      type: "image",
      current: this.actor.getFlag("fate-core-ko", "tokenImg") || "",
      callback: async (path) => {
        await this.actor.setFlag("fate-core-ko", "tokenImg", path);
      },
    }).browse();
  }

  static async #onSetPrimaryAspect(event, target) {
    const itemId  = target.closest("[data-item-id]")?.dataset.itemId;
    if (!itemId) return;
    const current = this.actor.getFlag("fate-core-ko", "primaryAspectId");
    if (current === itemId) await this.actor.unsetFlag("fate-core-ko", "primaryAspectId");
    else                    await this.actor.setFlag("fate-core-ko", "primaryAspectId", itemId);
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
    await setActorOnStage(actor, !onStage);
    FateStageBar.render();
    hud.render();
  });
});

const getTokenImg = actor => actor?.getFlag?.("fate-core-ko", "tokenImg") || actor?.img || "";

// 플레이어가 소유하지 않은 액터도 무대에 올릴 수 있도록 GM 소켓 경유
const setActorOnStage = async (actor, value) => {
  if (actor.isOwner) {
    if (value) await actor.setFlag("fate-core-ko", "onStage", true);
    else       await actor.unsetFlag("fate-core-ko", "onStage");
  } else {
    game.socket?.emit("system.fate-core-ko", {
      type: "setOnStage", actorId: actor.id, value: !!value,
    });
  }
};

// ─── VN Speech Box ─────────────────────────────────────────────────────────

const FateVNBox = {
  _el:           null,
  _timer:        null,
  _portraitTimer: null,
  _cropCache:    new Map(), // src → cropped data URL

  _ensure() {
    if (this._el) return;
    this._el = document.createElement("div");
    this._el.id = "fate-vn-box";
    this._el.innerHTML = `
      <button id="fate-vn-close" title="닫기">✕</button>
      <div id="fate-vn-portrait-wrap">
        <img id="fate-vn-portrait" src="" alt="">
      </div>
      <div id="fate-vn-textbox">
        <div id="fate-vn-name"></div>
        <div id="fate-vn-text"></div>
      </div>`;
    document.getElementById("interface")?.appendChild(this._el);
    this._el.querySelector("#fate-vn-close").onclick = () => {
      this._el.classList.remove("visible");
    };
  },

  // 투명 여백을 Canvas로 분석해 제거한 data URL 반환 (캐시)
  _cropPortrait(src) {
    if (this._cropCache.has(src)) return Promise.resolve(this._cropCache.get(src));
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => {
        try {
          const w = img.naturalWidth, h = img.naturalHeight;
          if (!w || !h) { resolve(src); return; }
          const c = document.createElement("canvas");
          c.width = w; c.height = h;
          const ctx = c.getContext("2d", { willReadFrequently: true });
          ctx.drawImage(img, 0, 0);
          const px = ctx.getImageData(0, 0, w, h).data;

          let minY = h, maxY = 0;
          // 위에서 아래로 최초 불투명 행 탐색
          top: for (let y = 0; y < h; y++)
            for (let x = 0; x < w; x++)
              if (px[(y * w + x) * 4 + 3] > 6) { minY = y; break top; }
          // 아래에서 위로 최초 불투명 행 탐색
          bot: for (let y = h - 1; y >= minY; y--)
            for (let x = 0; x < w; x++)
              if (px[(y * w + x) * 4 + 3] > 6) { maxY = y; break bot; }

          if (maxY > minY && (minY > 2 || maxY < h - 3)) {
            const ch = maxY - minY + 1;
            const out = document.createElement("canvas");
            out.width = w; out.height = ch;
            out.getContext("2d").drawImage(c, 0, -minY);
            const url = out.toDataURL("image/png");
            this._cropCache.set(src, url);
            resolve(url);
            return;
          }
        } catch { /* tainted canvas (cross-origin) — 원본 사용 */ }
        this._cropCache.set(src, src);
        resolve(src);
      };
      img.onerror = () => resolve(src);
      img.src = src;
    });
  },

  show(actor, html) {
    this._ensure();
    const portrait = document.getElementById("fate-vn-portrait");
    const nameEl   = document.getElementById("fate-vn-name");
    const textEl   = document.getElementById("fate-vn-text");

    // 이름 갱신
    nameEl.textContent = actor.name;
    nameEl.style.setProperty("--vn-name-color", actor.getFlag("fate-core-ko", "color") || "var(--accent-gold)");

    // 애니메이션 클래스 추출 후 textEl에 적용
    const emoMatch = html.match(/ewk-emo--([\w]+)/);
    textEl.className = emoMatch ? `ewk-emo ewk-emo--${emoMatch[1]}` : "";
    textEl.innerHTML = "";
    this._el.classList.add("visible");

    // plain text 추출 (타이프라이터용)
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    const text = tmp.textContent ?? html;

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

    // 초상화 전환
    const src = actor.img;
    if (portrait.dataset.src === src) return; // 같은 액터면 텍스트만 교체

    if (this._portraitTimer) { clearTimeout(this._portraitTimer); this._portraitTimer = null; }

    const isFirstShow = !portrait.dataset.src;
    portrait.dataset.src = src;

    const applyPortrait = (newSrc) => {
      portrait.src = newSrc;
      portrait.classList.remove("fate-vn-portrait--out");
    };
    const applyCropAsync = () => {
      this._cropPortrait(src).then(cropped => {
        if (portrait.dataset.src === src) portrait.src = cropped;
      });
    };

    if (isFirstShow) {
      // 첫 등장: VN 박스 자체 페이드인에 맡김 — 별도 트랜지션 없음
      portrait.src = src;
      applyCropAsync();
      return;
    }

    // 액터 전환: 페이드아웃 → 이미지 교체 → 페이드인
    portrait.classList.add("fate-vn-portrait--out");
    this._portraitTimer = setTimeout(() => {
      this._portraitTimer = null;
      if (this._cropCache.has(src)) {
        applyPortrait(this._cropCache.get(src));
      } else {
        applyPortrait(src);
        applyCropAsync();
      }
    }, 210); // CSS transition 200ms 보다 약간 길게
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
    const CUSTOM_PANELS = new Set(["actors", "scenes", "journal"]);
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
          ${game.user?.isGM ? `<button class="ewk-hdr-btn ewk-hdr-btn--fc" id="ewk-fc-btn">📋 흐름도</button>` : ""}
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
      </div>
      <div id="ewk-typing-bar" hidden></div>`;
    return panel;
  },

  // FVTT가 렌더한 패널을 우리 컨테이너로 이동 (커스텀 패널은 건너뜀)
  _adoptFVTTPanels() {
    const SKIP = new Set(["chat", "actors", "scenes", "journal"]);
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
    else if (key === "scenes") this._renderScenePanel();
    else if (key === "journal") this._renderJournalPanel();
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
  <img class="ewk-acard-port" src="${getTokenImg(a)}" alt="">
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

  // ── 장면 패널 ────────────────────────────────────────────────
  _renderScenePanel() {
    const panel = document.getElementById("ewk-panel-scenes");
    if (!panel) return;
    const isGM   = game.user?.isGM;
    const active = game.scenes?.active;

    // 폴더별 그룹화 (sort 기준 정렬)
    const byFolder = {};
    (game.scenes?.contents ?? []).forEach(s => {
      const fid = s.folder?.id ?? "__none__";
      (byFolder[fid] ??= []).push(s);
    });
    const sortGroup = arr => [...arr].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0) || a.name.localeCompare(b.name, "ko"));

    const folders = (game.folders?.filter(f => f.type === "Scene") ?? [])
      .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0) || a.name.localeCompare(b.name, "ko"));

    // 펼침 상태
    const EXP_KEY = "ewk-scene-exp";
    let expState = {};
    try { expState = JSON.parse(localStorage.getItem(EXP_KEY) ?? "{}"); } catch (_) {}
    const isExp     = id => expState[id] !== false;
    const toggleExp = id => {
      expState[id] = !isExp(id);
      localStorage.setItem(EXP_KEY, JSON.stringify(expState));
      this._renderScenePanel();
    };

    // sort 값 재배치 (▲▼ 조작 후 깔끔한 간격 보장)
    const reorder = async (sceneId, dir) => {
      const scene = game.scenes?.get(sceneId);
      if (!scene) return;
      const fid   = scene.folder?.id ?? "__none__";
      const arr   = sortGroup(byFolder[fid] ?? []);
      const idx   = arr.findIndex(s => s.id === sceneId);
      const nIdx  = idx + dir;
      if (nIdx < 0 || nIdx >= arr.length) return;
      const swapped = [...arr];
      [swapped[idx], swapped[nIdx]] = [swapped[nIdx], swapped[idx]];
      await Scene.updateDocuments(swapped.map((s, i) => ({ _id: s.id, sort: (i + 1) * 100000 })));
    };

    const mkCard = (s, idx, total) => {
      const isActive = s.id === active?.id;
      const thumb    = s.thumb || s.background?.src || "";
      return `<div class="ewk-scard${isActive ? " ewk-scard--active" : ""}" data-scene-id="${s.id}" draggable="${isGM ? "true" : "false"}">
  ${isGM ? `<div class="ewk-scard-ord">
    <button class="ewk-scard-ord-btn" data-scene-up="${s.id}" ${idx === 0 ? "disabled" : ""}>▲</button>
    <button class="ewk-scard-ord-btn" data-scene-dn="${s.id}" ${idx === total - 1 ? "disabled" : ""}>▼</button>
  </div>` : ""}
  <div class="ewk-scard-thumb">
    ${thumb ? `<img src="${thumb}" alt="">` : `<div class="ewk-scard-thumb-ph"></div>`}
    ${isActive ? `<span class="ewk-scard-badge">활성</span>` : ""}
  </div>
  <div class="ewk-scard-body">
    <div class="ewk-scard-name">${s.name}</div>
  </div>
  <div class="ewk-scard-acts">
    ${isGM && !isActive ? `<button class="ewk-scard-btn ewk-scard-btn--act" data-scene-activate="${s.id}" title="활성화">ON</button>` : ""}
    <button class="ewk-scard-btn" data-scene-view="${s.id}" title="보기">보기</button>
    ${isGM ? `<button class="ewk-scard-btn" data-scene-cfg="${s.id}" title="설정">⚙</button>` : ""}
    ${isGM ? `<button class="ewk-scard-btn ewk-scard-btn--del" data-scene-del="${s.id}" title="삭제">✕</button>` : ""}
  </div>
</div>`;
    };

    const mkGroup = (fid, fname, scenes, isNone = false) => {
      const exp    = isExp(fid);
      const sorted = sortGroup(scenes);
      const renBtn = isGM && !isNone
        ? `<button class="ewk-fldr-btn ewk-fldr-btn--ren" data-sfldr-ren="${fid}" title="폴더 이름 수정">✏</button>` : "";
      const delBtn = isGM && !isNone
        ? `<button class="ewk-fldr-btn ewk-fldr-btn--danger" data-sfldr-del="${fid}" title="폴더 삭제">✕</button>` : "";
      return `<div class="ewk-fldr" data-sfldr-id="${fid}">
  <div class="ewk-fldr-hdr" data-sfldr-toggle="${fid}" data-sfldr-drop="${fid}">
    <span class="ewk-fldr-arrow">${exp ? "▾" : "▸"}</span>
    <span class="ewk-fldr-name">${fname}</span>
    <span class="ewk-fldr-cnt">${sorted.length}</span>
    ${renBtn}${delBtn}
  </div>
  <div class="ewk-fldr-body${exp ? "" : " ewk-fldr-body--closed"}">
    ${sorted.map((s, i) => mkCard(s, i, sorted.length)).join("") || '<div class="ewk-panel-empty ewk-panel-empty--sm">비어 있음</div>'}
  </div>
</div>`;
    };

    const foldersHtml   = folders.map(f => mkGroup(f.id, f.name, byFolder[f.id] ?? [])).join("");
    const unfiledScenes = byFolder["__none__"] ?? [];
    const unfiledHtml   = (unfiledScenes.length || !folders.length)
      ? mkGroup("__none__", "미분류", unfiledScenes, true) : "";
    const allScenes     = game.scenes?.contents ?? [];

    panel.innerHTML = `
<div class="ewk-panel-toolbar">
  ${isGM ? `
    <button class="ewk-panel-new" data-create-sfldr>+ 폴더</button>
    <button class="ewk-panel-new" data-create-scene>+ 장면</button>` : ""}
</div>
<div class="ewk-panel-scroll">
  ${foldersHtml}${unfiledHtml}
  ${!allScenes.length ? '<div class="ewk-panel-empty">장면이 없습니다.</div>' : ""}
</div>`;

    // ── 폴더 접기/펼치기 ──────────────────────────────────
    panel.querySelectorAll("[data-sfldr-toggle]").forEach(hdr => {
      hdr.addEventListener("click", e => {
        if (e.target.closest("[data-sfldr-del]")) return;
        if (e.target.closest("[data-sfldr-ren]")) return;
        toggleExp(hdr.dataset.sfldrToggle);
      });
    });

    // ── 드래그앤드롭: 장면 → 폴더 이동 ──────────────────
    panel.querySelectorAll(".ewk-scard[draggable='true']").forEach(card => {
      card.addEventListener("dragstart", e => {
        e.stopPropagation();
        e.dataTransfer.setData("ewk-scene-id", card.dataset.sceneId);
        e.dataTransfer.effectAllowed = "move";
        card.classList.add("ewk-scard--dragging");
      });
      card.addEventListener("dragend", () => card.classList.remove("ewk-scard--dragging"));
    });

    panel.querySelectorAll("[data-sfldr-drop]").forEach(hdr => {
      hdr.addEventListener("dragover", e => {
        if (!e.dataTransfer.types.includes("ewk-scene-id")) return;
        e.preventDefault();
        hdr.classList.add("ewk-fldr-hdr--over");
      });
      hdr.addEventListener("dragleave", () => hdr.classList.remove("ewk-fldr-hdr--over"));
      hdr.addEventListener("drop", async e => {
        e.preventDefault();
        hdr.classList.remove("ewk-fldr-hdr--over");
        const sceneId = e.dataTransfer.getData("ewk-scene-id");
        if (!sceneId) return;
        const scene     = game.scenes?.get(sceneId);
        if (!scene) return;
        const targetFid = hdr.dataset.sfldrDrop;
        const newFolder = targetFid === "__none__" ? null : targetFid;
        if ((scene.folder?.id ?? null) === newFolder) return;
        await scene.update({ folder: newFolder });
      });
    });

    // ── ▲▼ 순서 조정 ──────────────────────────────────────
    panel.querySelectorAll("[data-scene-up]").forEach(btn => {
      btn.addEventListener("click", async e => { e.stopPropagation(); await reorder(btn.dataset.sceneUp, -1); });
    });
    panel.querySelectorAll("[data-scene-dn]").forEach(btn => {
      btn.addEventListener("click", async e => { e.stopPropagation(); await reorder(btn.dataset.sceneDn,  1); });
    });

    // ── 폴더 이름 수정 ────────────────────────────────────
    panel.querySelectorAll("[data-sfldr-ren]").forEach(btn => {
      btn.addEventListener("click", async e => {
        e.stopPropagation();
        const fid    = btn.dataset.sfldrRen;
        const folder = game.folders?.get(fid);
        if (!folder) return;
        const nameEl = btn.closest(".ewk-fldr-hdr")?.querySelector(".ewk-fldr-name");
        if (!nameEl) return;

        const input = document.createElement("input");
        input.type  = "text";
        input.className = "ewk-fldr-name-input";
        input.value = folder.name;
        nameEl.replaceWith(input);
        input.focus();
        input.select();

        let saved = false;
        const save = async () => {
          if (saved) return;
          saved = true;
          const newName = input.value.trim();
          if (newName && newName !== folder.name) await folder.update({ name: newName });
          else this._renderScenePanel();
        };
        input.addEventListener("keydown", async e => {
          if (e.key === "Enter")  { e.preventDefault(); await save(); }
          if (e.key === "Escape") { saved = true; this._renderScenePanel(); }
        });
        input.addEventListener("blur", save);
      });
    });

    // ── 나머지 액션 ────────────────────────────────────────
    panel.querySelectorAll("[data-sfldr-del]").forEach(btn => {
      btn.addEventListener("click", async e => {
        e.stopPropagation();
        const folder = game.folders?.get(btn.dataset.sfldrDel);
        if (!folder) return;
        const ok = await foundry.applications.api.DialogV2.confirm({
          content: `<p>"${folder.name}" 폴더를 삭제할까요? (장면은 유지됩니다)</p>`,
          yes: { label: "삭제" }, no: { label: "취소" },
        }).catch(() => false);
        if (ok) await folder.delete({ deleteSubfolders: false, deleteContents: false });
      });
    });

    panel.querySelectorAll("[data-scene-activate]").forEach(btn => {
      btn.addEventListener("click", async e => {
        e.stopPropagation();
        await game.scenes?.get(btn.dataset.sceneActivate)?.activate().catch(() => {});
      });
    });
    panel.querySelectorAll("[data-scene-view]").forEach(btn => {
      btn.addEventListener("click", async e => {
        e.stopPropagation();
        await game.scenes?.get(btn.dataset.sceneView)?.view().catch(() => {});
      });
    });
    panel.querySelectorAll("[data-scene-cfg]").forEach(btn => {
      btn.addEventListener("click", e => {
        e.stopPropagation();
        game.scenes?.get(btn.dataset.sceneCfg)?.sheet?.render(true);
      });
    });
    panel.querySelectorAll("[data-scene-del]").forEach(btn => {
      btn.addEventListener("click", async e => {
        e.stopPropagation();
        const scene = game.scenes?.get(btn.dataset.sceneDel);
        if (!scene) return;
        const ok = await foundry.applications.api.DialogV2.confirm({
          content: `<p>"${scene.name}"을(를) 삭제할까요?</p>`,
          yes: { label: "삭제" }, no: { label: "취소" },
        }).catch(() => false);
        if (ok) await scene.delete();
      });
    });

    panel.querySelector("[data-create-scene]")?.addEventListener("click", async () => {
      const name = window.prompt("새 장면 이름:", "새 장면");
      if (!name?.trim()) return;
      await Scene.create({ name: name.trim() });
    });
    panel.querySelector("[data-create-sfldr]")?.addEventListener("click", async () => {
      const name = window.prompt("폴더 이름:", "새 폴더");
      if (!name?.trim()) return;
      await Folder.create({ name: name.trim(), type: "Scene" });
    });
  },

  // ── 저널 패널 (사이드바 목록) ─────────────────────────────
  _renderJournalPanel() {
    const panel = document.getElementById("ewk-panel-journal");
    if (!panel) return;
    const isGM = game.user?.isGM;

    const entries = (game.journal?.contents ?? []).filter(e => e.visible)
      .sort((a, b) => a.name.localeCompare(b.name, "ko"));

    const byFolder = {};
    entries.forEach(e => {
      const fid = e.folder?.id ?? "__none__";
      (byFolder[fid] ??= []).push(e);
    });

    const folders = (game.folders?.filter(f => f.type === "JournalEntry") ?? [])
      .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0) || a.name.localeCompare(b.name, "ko"));

    const EXP_KEY = "ewk-journal-exp";
    let expState = {};
    try { expState = JSON.parse(localStorage.getItem(EXP_KEY) ?? "{}"); } catch (_) {}
    const isExp    = id => expState[id] !== false;
    const toggleExp = id => {
      expState[id] = !isExp(id);
      localStorage.setItem(EXP_KEY, JSON.stringify(expState));
      this._renderJournalPanel();
    };

    const TPL_LABELS = Object.fromEntries(EWKJournalTemplates.get().map(t => [t.id, t.label.replace(/^\d+\s·\s/, "")]));
    const mkEntry = (e) => {
      const surface = e.getFlag("fate-core-ko", "surface") ?? "dark";
      const tplId   = e.getFlag("fate-core-ko", "template") ?? null;
      const icon    = surface === "paper" ? "📜" : "📋";
      const meta    = tplId && TPL_LABELS[tplId] ? TPL_LABELS[tplId] : (surface === "paper" ? "양피지 문서" : "제국 문서");
      return `<div class="ewk-jcard" data-journal-id="${e.id}" draggable="${isGM ? "true" : "false"}">
  <span class="ewk-jcard-ico">${icon}</span>
  <div class="ewk-jcard-body">
    <div class="ewk-jcard-name">${e.name}</div>
    <div class="ewk-jcard-meta">${meta}</div>
  </div>
  ${isGM ? `<button class="ewk-acard-btn" data-journal-perm="${e.id}" title="권한 설정">🔑</button>` : ""}
  ${isGM ? `<button class="ewk-acard-btn" data-journal-edit="${e.id}" title="편집">✏</button>` : ""}
  ${isGM ? `<button class="ewk-acard-btn ewk-acard-del" data-journal-del="${e.id}" title="삭제">✕</button>` : ""}
</div>`;
    };

    const mkGroup = (fid, fname, items, { isNone = false } = {}) => {
      const exp    = isExp(fid);
      const sorted = [...items].sort((a, b) => a.name.localeCompare(b.name, "ko"));
      const permBtn = isGM && !isNone
        ? `<button class="ewk-fldr-btn" data-jfldr-perm="${fid}" title="폴더 전체 권한 설정">🔑</button>` : "";
      const renBtn = isGM && !isNone
        ? `<button class="ewk-fldr-btn ewk-fldr-btn--ren" data-jfldr-ren="${fid}" title="폴더 이름 수정">✏</button>` : "";
      const addBtn = isGM
        ? `<button class="ewk-fldr-btn" data-jfldr-add="${fid}" title="이 폴더에 새 항목">+</button>` : "";
      const delBtn = isGM && !isNone
        ? `<button class="ewk-fldr-btn ewk-fldr-btn--danger" data-jfldr-del="${fid}" title="폴더 삭제">✕</button>` : "";
      return `<div class="ewk-fldr" data-fldr-id="${fid}">
  <div class="ewk-fldr-hdr" data-jfldr-toggle="${fid}" data-jfldr-drop="${fid}">
    <span class="ewk-fldr-arrow">${exp ? "▾" : "▸"}</span>
    <span class="ewk-fldr-name">${fname}</span>
    <span class="ewk-fldr-cnt">${sorted.length}</span>
    ${permBtn}${renBtn}${addBtn}${delBtn}
  </div>
  <div class="ewk-fldr-body${exp ? "" : " ewk-fldr-body--closed"}">
    ${sorted.map(mkEntry).join("") || '<div class="ewk-panel-empty ewk-panel-empty--sm">비어 있음</div>'}
  </div>
</div>`;
    };

    const foldersHtml  = folders.map(f => mkGroup(f.id, f.name, byFolder[f.id] ?? [])).join("");
    const unfiledItems = byFolder["__none__"] ?? [];
    const unfiledHtml  = (unfiledItems.length || !folders.length || isGM)
      ? mkGroup("__none__", "미분류", unfiledItems, { isNone: true }) : "";

    panel.innerHTML = `
<div class="ewk-panel-toolbar">
  ${isGM ? `
    <button class="ewk-panel-new" id="ewk-j-folder">+ 폴더</button>
    <button class="ewk-panel-new" id="ewk-j-new">+ 새 항목</button>` : ""}
</div>
<div class="ewk-panel-scroll">
  ${foldersHtml}${unfiledHtml}
  ${!entries.length ? '<div class="ewk-panel-empty">저널이 없습니다.</div>' : ""}
</div>`;

    // 폴더 접기/펼치기 (버튼 클릭은 제외)
    panel.querySelectorAll("[data-jfldr-toggle]").forEach(hdr => {
      hdr.addEventListener("click", e => {
        if (e.target.closest("[data-jfldr-del],[data-jfldr-ren],[data-jfldr-add],[data-jfldr-perm]")) return;
        toggleExp(hdr.dataset.jfldrToggle);
      });
    });

    // 폴더 전체 권한
    panel.querySelectorAll("[data-jfldr-perm]").forEach(btn => {
      btn.addEventListener("click", e => { e.stopPropagation(); EWKJournalPerms.openFolder(btn.dataset.jfldrPerm); });
    });

    // 폴더에 새 항목
    panel.querySelectorAll("[data-jfldr-add]").forEach(btn => {
      btn.addEventListener("click", e => { e.stopPropagation(); EWKJournalEditor.createNew(btn.dataset.jfldrAdd); });
    });

    // 폴더 이름 수정 (인라인)
    panel.querySelectorAll("[data-jfldr-ren]").forEach(btn => {
      btn.addEventListener("click", e => {
        e.stopPropagation();
        const folder = game.folders?.get(btn.dataset.jfldrRen);
        if (!folder) return;
        const nameEl = btn.closest(".ewk-fldr-hdr")?.querySelector(".ewk-fldr-name");
        if (!nameEl) return;
        const input = document.createElement("input");
        input.type = "text";
        input.className = "ewk-fldr-name-input";
        input.value = folder.name;
        nameEl.replaceWith(input);
        input.focus(); input.select();
        let saved = false;
        const save = async () => {
          if (saved) return; saved = true;
          const newName = input.value.trim();
          if (newName && newName !== folder.name) await folder.update({ name: newName });
          else this._renderJournalPanel();
        };
        input.addEventListener("keydown", async ev => {
          if (ev.key === "Enter")  { ev.preventDefault(); await save(); }
          if (ev.key === "Escape") { saved = true; this._renderJournalPanel(); }
        });
        input.addEventListener("blur", save);
      });
    });

    // 폴더 삭제
    panel.querySelectorAll("[data-jfldr-del]").forEach(btn => {
      btn.addEventListener("click", async e => {
        e.stopPropagation();
        const folder = game.folders?.get(btn.dataset.jfldrDel);
        if (!folder) return;
        const ok = await EWKConfirm.ask({
          title: "폴더 삭제",
          message: `"${folder.name}" 폴더를 삭제할까요? 항목은 미분류로 이동됩니다.`,
          yes: "삭제", danger: true,
        });
        if (ok) await folder.delete({ deleteSubfolders: false, deleteContents: false });
      });
    });

    // 저널 카드 — 열기 + 드래그
    panel.querySelectorAll(".ewk-jcard").forEach(card => {
      let didDrag = false;
      card.addEventListener("click", e => {
        if (didDrag) { didDrag = false; return; }
        if (e.target.closest(".ewk-acard-btn")) return;
        EWKJournalViewer.open(card.dataset.journalId);
      });
      if (isGM) {
        card.addEventListener("dragstart", e => {
          e.stopPropagation();
          e.dataTransfer.setData("ewk-journal-id", card.dataset.journalId);
          e.dataTransfer.effectAllowed = "move";
          didDrag = true;
          card.classList.add("ewk-jcard--dragging");
        });
        card.addEventListener("dragend", () => {
          card.classList.remove("ewk-jcard--dragging");
          setTimeout(() => { didDrag = false; }, 100);
        });
      }
    });

    // 폴더 헤더 드롭 — 저널 이동
    panel.querySelectorAll("[data-jfldr-drop]").forEach(hdr => {
      hdr.addEventListener("dragover", e => {
        if (!e.dataTransfer.types.includes("ewk-journal-id")) return;
        e.preventDefault();
        hdr.classList.add("ewk-fldr-hdr--over");
      });
      hdr.addEventListener("dragleave", () => hdr.classList.remove("ewk-fldr-hdr--over"));
      hdr.addEventListener("drop", async e => {
        e.preventDefault();
        hdr.classList.remove("ewk-fldr-hdr--over");
        const id = e.dataTransfer.getData("ewk-journal-id");
        const entry = game.journal?.get(id);
        if (!entry) return;
        const targetFid = hdr.dataset.jfldrDrop;
        const newFolder = targetFid === "__none__" ? null : targetFid;
        if ((entry.folder?.id ?? null) === newFolder) return;
        await entry.update({ folder: newFolder });
      });
    });

    panel.querySelectorAll("[data-journal-perm]").forEach(btn => {
      btn.addEventListener("click", e => { e.stopPropagation(); EWKJournalPerms.open(btn.dataset.journalPerm); });
    });

    panel.querySelectorAll("[data-journal-edit]").forEach(btn => {
      btn.addEventListener("click", e => { e.stopPropagation(); EWKJournalEditor.open(btn.dataset.journalEdit); });
    });

    panel.querySelectorAll("[data-journal-del]").forEach(btn => {
      btn.addEventListener("click", async e => {
        e.stopPropagation();
        const entry = game.journal?.get(btn.dataset.journalDel);
        if (!entry) return;
        const ok = await EWKConfirm.ask({
          title: "저널 삭제",
          message: `"${entry.name}"을(를) 삭제할까요?`,
          yes: "삭제", danger: true,
        });
        if (ok) { await entry.delete(); EWKJournalViewer.closeIfShowing(btn.dataset.journalDel); }
      });
    });

    panel.querySelector("#ewk-j-folder")?.addEventListener("click", async () => {
      const name = this._promptText("폴더 이름:");
      if (!name) return;
      await Folder.create({ name, type: "JournalEntry", color: "#9a7a30" });
    });

    panel.querySelector("#ewk-j-new")?.addEventListener("click", () => EWKJournalEditor.createNew());
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
      EWKTyping._stopLocal();
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
    document.getElementById("ewk-fc-btn")?.addEventListener("click",   () => EWKFlowchart.toggle());
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

    const worldTitle  = game.world?.title ?? "페이트 코어";
    const activeScene = game.scenes?.active;
    const sceneName   = activeScene?.folder?.name ?? activeScene?.name ?? worldTitle;
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
    const _as = game.scenes?.active;
    const scene = _as?.folder?.name ?? _as?.name;
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

// ─── Custom Confirm (FVTT 다이얼로그 z-index 충돌 회피용) ────────────────────
// 저널 오버레이(z 9900+) 위에서도 클릭 가능한 자체 확인 모달.

const EWKConfirm = {
  ask({ title = "확인", message = "", yes = "확인", no = "취소", danger = false } = {}) {
    return new Promise(resolve => {
      const el = document.createElement("div");
      el.className = "ewk-confirm-overlay fate-core-ko";
      el.innerHTML = `<div class="ewk-confirm">
  <div class="ewk-confirm__title">${title}</div>
  <div class="ewk-confirm__msg">${message}</div>
  <div class="ewk-confirm__btns">
    <button class="jwe-btn" data-no>${no}</button>
    <button class="jwe-btn ${danger ? "jwe-btn--danger" : "jwe-btn--save"}" data-yes>${yes}</button>
  </div>
</div>`;
      document.body.appendChild(el);
      const done = v => { el.remove(); resolve(v); };
      el.querySelector("[data-yes]").addEventListener("click", () => done(true));
      el.querySelector("[data-no]").addEventListener("click", () => done(false));
      el.addEventListener("click", e => { if (e.target === el) done(false); });
      el.querySelector("[data-yes]")?.focus();
    });
  },
};

// ─── Journal Templates (디자인 10종 — 런타임 로드) ──────────────────────────
// 디자인 폴더의 journals-data.js(window.JOURNALS) 를 lazy-load 하여 활용.

// FilePicker 를 저널 오버레이(z 9900+) 위로 올려서 사용 (z-index 충돌 회피)
function ewkPickImage(callback, current = "") {
  const fp = new FilePicker({ type: "image", current, callback });
  fp.browse();
  let tries = 0;
  const bump = () => {
    const elx = fp.element instanceof HTMLElement ? fp.element : fp.element?.[0];
    if (elx) { elx.style.zIndex = "10100"; }
    else if (tries++ < 25) setTimeout(bump, 40);
  };
  setTimeout(bump, 40);
  return fp;
}

const EWK_ASSET_BASE = "systems/fate-core-ko/design/End-War%20Knight%20Design%20System/assets/";

const EWKJournalTemplates = {
  _list: [],
  _loaded: false,
  _loading: null,

  load() {
    if (this._loaded) return Promise.resolve(this._list);
    if (this._loading) return this._loading;
    // 디자인 파일은 `window.JOURNALS = [...]` 형태 — <script> 주입으로 안전하게 로드
    this._loading = new Promise((resolve) => {
      const finish = () => {
        this._list = window.JOURNALS ?? [];
        this._loaded = true;
        resolve(this._list);
      };
      if (window.JOURNALS) return finish();
      const s = document.createElement("script");
      s.src = "systems/fate-core-ko/design/End-War%20Knight%20Design%20System/journal/journals-data.js";
      s.onload  = finish;
      s.onerror = () => {
        console.error("fate-core-ko | 저널 템플릿 로드 실패");
        this._loaded = true; this._list = []; resolve([]);
      };
      document.head.appendChild(s);
    });
    return this._loading;
  },

  get() { return this._list; },

  // 템플릿 HTML 의 ../assets/ 경로를 시스템 경로로 치환
  resolve(html) { return (html ?? "").replaceAll("../assets/", EWK_ASSET_BASE); },

  byId(id) { return this._list.find(t => t.id === id) ?? null; },
};

// ─── Journal Viewer ────────────────────────────────────────────────────────
// FVTT JournalEntry 는 권한/동기화 백엔드로만 사용. 콘텐츠 HTML 은 flag 저장.

const EWKJournalViewer = {
  _entryId: null,
  _filter:  "",
  _resizeObs: null,

  async open(entryId) {
    const entry = game.journal?.get(entryId);
    if (!entry || !entry.visible) return;
    this._entryId = entryId;
    await EWKJournalTemplates.load();

    let el = document.getElementById("ewk-journal-viewer");
    if (!el) {
      el = document.createElement("div");
      el.id = "ewk-journal-viewer";
      document.body.appendChild(el);
    }
    this._render(el);
  },

  close() {
    this._resizeObs?.disconnect();
    this._resizeObs = null;
    document.getElementById("ewk-journal-viewer")?.remove();
  },

  closeIfShowing(entryId) {
    if (this._entryId === entryId) this.close();
  },

  refresh() {
    const el = document.getElementById("ewk-journal-viewer");
    if (!el) return;
    this._render(el);
  },

  _entry()   { return game.journal?.get(this._entryId) ?? null; },
  _surface(entry) { return (entry ?? this._entry())?.getFlag("fate-core-ko", "surface") ?? "dark"; },
  _html(entry)    { return (entry ?? this._entry())?.getFlag("fate-core-ko", "html") ?? ""; },
  _docW(entry)    { return (entry ?? this._entry())?.getFlag("fate-core-ko", "docW") ?? 720; },
  _docH(entry)    { return (entry ?? this._entry())?.getFlag("fate-core-ko", "docH") ?? 900; },

  // 레일/네비게이션 순서: 폴더 정렬 → 이름. 검색 필터 적용.
  _orderedEntries() {
    const q = this._filter.toLowerCase();
    const all = (game.journal?.contents ?? [])
      .filter(e => e.visible && (!q || e.name.toLowerCase().includes(q)));
    const folders = (game.folders?.filter(f => f.type === "JournalEntry") ?? [])
      .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0) || a.name.localeCompare(b.name, "ko"));
    const byFolder = {};
    all.forEach(e => { const fid = e.folder?.id ?? "__none__"; (byFolder[fid] ??= []).push(e); });
    const byName = (a, b) => a.name.localeCompare(b.name, "ko");
    const ordered = [];
    folders.forEach(f => (byFolder[f.id] ?? []).sort(byName).forEach(e => ordered.push(e)));
    (byFolder["__none__"] ?? []).sort(byName).forEach(e => ordered.push(e));
    return { ordered, folders, byFolder, byName };
  },

  _render(el) {
    const entry   = this._entry();
    const surface = this._surface(entry);
    const isGM    = game.user?.isGM;
    const { ordered, folders, byFolder, byName } = this._orderedEntries();

    // ── 좌측 레일 ──────────────────────────────────────────
    let railHtml = "";
    let idx = 1;
    const mkItem = (e) => {
      const isSel = e.id === this._entryId;
      const surf  = this._surface(e);
      const tplId = e.getFlag("fate-core-ko", "template");
      const tpl   = tplId ? EWKJournalTemplates.byId(tplId) : null;
      const kind  = tpl ? tpl.label.replace(/^\d+\s·\s/, "") : (surf === "paper" ? "양피지 문서" : "제국 문서");
      const n     = String(idx++).padStart(2, "0");
      return `<button class="jw-item${isSel ? " active" : ""}${surf === "paper" ? " paper" : ""}" data-jw-sel="${e.id}">
  <span class="jw-item__no">${n}</span>
  <span class="jw-item__main">
    <span class="jw-item__t">${e.name}</span>
    <span class="jw-item__k">${kind}</span>
  </span>
  <span class="jw-item__dot"></span>
</button>`;
    };

    folders.forEach(f => {
      const items = (byFolder[f.id] ?? []).sort(byName);
      if (!items.length) return;
      railHtml += `<div class="jw-grp">${f.name}</div>` + items.map(mkItem).join("");
    });
    const unfiled = (byFolder["__none__"] ?? []).sort(byName);
    if (unfiled.length) {
      railHtml += `<div class="jw-grp">미분류</div>` + unfiled.map(mkItem).join("");
    }

    // ── 메인 영역 ──────────────────────────────────────────
    const html    = EWKJournalTemplates.resolve(this._html(entry));
    const curIdx  = entry ? ordered.findIndex(e => e.id === entry.id) : -1;
    const hasPrev = curIdx > 0;
    const hasNext = curIdx >= 0 && curIdx < ordered.length - 1;

    el.innerHTML = `<div class="jw-desk-overlay">
<div class="jw fate-core-ko">
  <div class="jw-title">
    <div class="jw-title__txt">
      <span class="jw-title__name">전역 일지</span>
      <span class="jw-title__sub">END-WAR KNIGHT · FIELD RECORDS</span>
    </div>
    <div class="jw-title__spacer"></div>
    <div class="jw-wbtns">
      <i></i>
      <i class="jw-close-btn" data-jw-close title="닫기" style="cursor:pointer"></i>
    </div>
  </div>
  <div class="jw-body">
    <div class="jw-rail">
      <div class="jw-rail__head">
        <div class="jw-rail__eyebrow">FIELD RECORDS</div>
        <div class="jw-search">
          <span class="jw-search__ico">🔍</span>
          <input type="text" placeholder="검색..." value="${this._filter.replace(/"/g, '&quot;')}" id="jw-search-input">
        </div>
      </div>
      <div class="jw-list" id="jw-list">
        ${railHtml || '<div class="ewk-panel-empty" style="padding:16px">항목이 없습니다.</div>'}
      </div>
      <div class="jw-rail__foot">
        ${isGM ? `<button class="jw-addbtn" id="jw-add-btn">+ 새 항목</button>` : ""}
        <span class="jw-rail__count">${ordered.length}개</span>
      </div>
    </div>
    <div class="jw-main">
      <div class="jw-bar">
        <div class="jw-crumb">
          <span class="jw-crumb__root">전역 일지</span>
          ${entry ? `<span class="jw-crumb__sep">›</span><span class="jw-crumb__title">${entry.name}</span>` : ""}
        </div>
        <div class="jw-bar__spacer"></div>
        <div class="jw-tools">
          <button class="jw-tool" id="jw-prev" ${hasPrev ? "" : "disabled"} title="이전 문서">‹</button>
          <span class="jw-pageno">${curIdx >= 0 ? `${curIdx + 1} / ${ordered.length}` : "— / —"}</span>
          <button class="jw-tool" id="jw-next" ${hasNext ? "" : "disabled"} title="다음 문서">›</button>
          ${isGM && entry ? `
          <div class="jw-divider"></div>
          <button class="jw-tool" id="jw-perm-btn" title="권한 설정">🔑</button>
          <button class="jw-tool" id="jw-edit-btn" title="편집">✏</button>
          <button class="jw-tool jw-tool--danger" id="jw-del-btn" title="문서 삭제">🗑</button>` : ""}
          <div class="jw-divider"></div>
          <button class="jw-tool" id="jw-print-btn" title="인쇄" ${entry ? "" : "disabled"}>🖨</button>
        </div>
      </div>
      <div class="jw-canvas" id="jw-canvas">
        ${entry ? `
        <div class="jw-docwrap" id="jw-docwrap">
          <div class="jw-doc" id="jw-doc">
            ${html || `<div class="jr jr-${surface}" style="display:grid;place-items:center;"><p style="color:var(--text-faint);font-style:italic">내용이 비어 있습니다. ${isGM ? "편집 버튼으로 작성하세요." : ""}</p></div>`}
          </div>
        </div>` : `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-faint);font-size:14px">항목을 선택하세요.</div>`}
      </div>
      <div class="jw-status">
        <span><b>문서</b> ${curIdx >= 0 ? String(curIdx + 1).padStart(3, "0") : "—"} / ${String(ordered.length).padStart(3, "0")}</span>
        ${entry ? `<span class="jw-status__surface">
          <span class="jw-surfdot${surface === "paper" ? " paper" : ""}"></span>
          ${surface === "paper" ? "양피지" : "제국 문서"}
        </span>` : ""}
      </div>
    </div>
  </div>
</div>
</div>`;

    this._wireViewer(el, ordered, curIdx);
    if (entry) requestAnimationFrame(() => this._scaleDoc());
  },

  _wireViewer(el, ordered, curIdx) {
    el.querySelector("[data-jw-close]")?.addEventListener("click", () => this.close());
    el.querySelector(".jw-desk-overlay")?.addEventListener("click", e => {
      if (e.target === e.currentTarget) this.close();
    });

    const searchEl = el.querySelector("#jw-search-input");
    searchEl?.addEventListener("input", e => {
      this._filter = e.target.value;
      this._render(el);
      const s = document.getElementById("jw-search-input");
      if (s) { s.focus(); s.setSelectionRange(s.value.length, s.value.length); }
    });

    el.querySelectorAll("[data-jw-sel]").forEach(btn => {
      btn.addEventListener("click", () => {
        const entry = game.journal?.get(btn.dataset.jwSel);
        if (!entry || !entry.visible) return;
        this._entryId = entry.id;
        this._render(el);
      });
    });

    el.querySelector("#jw-prev")?.addEventListener("click", () => {
      if (curIdx > 0) { this._entryId = ordered[curIdx - 1].id; this._render(el); }
    });
    el.querySelector("#jw-next")?.addEventListener("click", () => {
      if (curIdx >= 0 && curIdx < ordered.length - 1) { this._entryId = ordered[curIdx + 1].id; this._render(el); }
    });

    el.querySelector("#jw-perm-btn")?.addEventListener("click", () => {
      if (this._entryId) EWKJournalPerms.open(this._entryId);
    });

    el.querySelector("#jw-edit-btn")?.addEventListener("click", () => {
      if (this._entryId) EWKJournalEditor.open(this._entryId);
    });

    el.querySelector("#jw-del-btn")?.addEventListener("click", async () => {
      const entry = this._entry();
      if (!entry) return;
      const ok = await EWKConfirm.ask({
        title: "문서 삭제", danger: true,
        message: `<b>${entry.name}</b>을(를) 삭제합니다. 이 작업은 되돌릴 수 없습니다.`,
        yes: "삭제", no: "취소",
      });
      if (!ok) return;
      const nextId = ordered[curIdx + 1]?.id ?? ordered[curIdx - 1]?.id ?? null;
      this._entryId = nextId;
      await entry.delete();
    });

    el.querySelector("#jw-print-btn")?.addEventListener("click", () => {
      const doc = el.querySelector("#jw-doc");
      if (!doc) return;
      const styles = Array.from(document.styleSheets).map(s => {
        try { return [...s.cssRules].map(r => r.cssText).join("\n"); } catch(_) { return ""; }
      }).join("\n");
      const w = window.open("", "_blank");
      if (!w) return;
      w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8">
<title>${this._entry()?.name ?? "저널"}</title>
<style>body{margin:0;padding:24px;background:#fff;display:flex;justify-content:center}${styles}
.jw-doc{width:${this._docW()}px}</style>
</head><body class="fate-core-ko"><div class="jw-doc">${EWKJournalTemplates.resolve(this._html())}</div></body></html>`);
      w.document.close();
      setTimeout(() => w.print(), 500);
    });

    el.querySelector("#jw-add-btn")?.addEventListener("click", () => EWKJournalEditor.createNew());

    this._resizeObs?.disconnect();
    const canvas = el.querySelector("#jw-canvas");
    if (canvas) {
      this._resizeObs = new ResizeObserver(() => this._scaleDoc());
      this._resizeObs.observe(canvas);
    }
  },

  _scaleDoc() {
    const canvas = document.getElementById("jw-canvas");
    const doc    = document.getElementById("jw-doc");
    const wrap   = document.getElementById("jw-docwrap");
    if (!canvas || !doc || !wrap) return;
    const DOC_W = this._docW();
    const DOC_H = this._docH();
    const avail = canvas.clientWidth - 72;
    const scale = Math.min(1, avail / DOC_W);
    doc.style.width     = DOC_W + "px";
    doc.style.height    = DOC_H + "px";
    doc.style.transform = `scale(${scale})`;
    doc.style.transformOrigin = "top left";
    wrap.style.width  = (DOC_W * scale) + "px";
    wrap.style.height = (DOC_H * scale) + "px";
  },
};

// ─── Journal Editor (커스텀 WYSIWYG — FVTT 시트 미사용) ──────────────────────
// 문서 위에서 직접 텍스트 편집(contenteditable). 템플릿 불러오기 + 이미지 +
// 서식 버튼. 고급 사용자용 HTML 소스 토글 제공.

const EWKJournalEditor = {
  _entryId: null,
  _docW: 720,
  _docH: 900,
  _mode: "visual", // 'visual' | 'source'

  async createNew(folderId = null) {
    if (!game.user?.isGM) return;
    const name = window.prompt("저널 이름:", "새 기록");
    if (!name?.trim()) return;
    await EWKJournalTemplates.load();
    const entry = await JournalEntry.create({
      name: name.trim(),
      folder: folderId && folderId !== "__none__" ? folderId : null,
      flags: { "fate-core-ko": { html: "", surface: "dark", docW: 720, docH: 900 } },
    });
    if (entry) this.open(entry.id);
  },

  async open(entryId) {
    if (!game.user?.isGM) return;
    const entry = game.journal?.get(entryId);
    if (!entry) return;
    this._entryId = entryId;
    this._docW = entry.getFlag("fate-core-ko", "docW") ?? 720;
    this._docH = entry.getFlag("fate-core-ko", "docH") ?? 900;
    this._mode = "visual";
    await EWKJournalTemplates.load();

    let el = document.getElementById("ewk-journal-editor");
    if (!el) {
      el = document.createElement("div");
      el.id = "ewk-journal-editor";
      document.body.appendChild(el);
    }
    this._render(el);
  },

  close() {
    document.getElementById("ewk-journal-editor")?.remove();
  },

  _entry() { return game.journal?.get(this._entryId) ?? null; },

  // 현재 편집 중 HTML (모드에 따라 시각/소스에서 추출)
  _currentHtml(el) {
    if (this._mode === "source") return el.querySelector("#jwe-src")?.value ?? "";
    return el.querySelector("#jwe-doc")?.innerHTML ?? "";
  },

  _render(el) {
    const entry = this._entry();
    if (!entry) { this.close(); return; }
    const stored = entry.getFlag("fate-core-ko", "html") ?? "";
    const html = EWKJournalTemplates.resolve(stored)
      || `<div class="jr jr-dark jr-pad"><p class="jr-prose" style="color:var(--text-faint)">템플릿을 불러오거나 여기에 내용을 작성하세요.</p></div>`;

    const tplOptions = EWKJournalTemplates.get()
      .map(t => `<option value="${t.id}">${t.label}</option>`).join("");

    el.innerHTML = `<div class="jw-desk-overlay">
<div class="jwe fate-core-ko">
  <div class="jw-title">
    <div class="jw-title__txt">
      <span class="jw-title__name">저널 편집</span>
      <span class="jw-title__sub">DOCUMENT EDITOR</span>
    </div>
    <input type="text" class="jwe-title-input" id="jwe-name" value="${(entry.name ?? "").replace(/"/g, '&quot;')}" placeholder="제목">
    <div class="jw-title__spacer"></div>
    <button class="jwe-btn jwe-btn--save" id="jwe-save">저장</button>
    <button class="jwe-btn" id="jwe-cancel">닫기</button>
  </div>
  <div class="jwe-toolbar">
    <label class="jwe-tb-label">양식</label>
    <select class="jwe-select" id="jwe-tpl"><option value="">— 불러오기 —</option>${tplOptions}</select>
    <div class="jw-divider"></div>
    <button class="jwe-tb-btn" id="jwe-bold" title="굵게"><b>B</b></button>
    <button class="jwe-tb-btn" id="jwe-italic" title="기울임"><i>I</i></button>
    <button class="jwe-tb-btn" id="jwe-img" title="이미지 삽입">🖼</button>
    <div class="jw-divider"></div>
    <label class="jwe-tb-label">크기</label>
    <input type="number" class="jwe-num" id="jwe-w" value="${this._docW}" title="너비(px)"> ×
    <input type="number" class="jwe-num" id="jwe-h" value="${this._docH}" title="높이(px)">
    <div class="jw-bar__spacer"></div>
    <button class="jwe-tb-btn jwe-mode-btn" id="jwe-mode">${this._mode === "source" ? "📄 시각 편집" : "&lt;/&gt; HTML"}</button>
  </div>
  <div class="jwe-body${this._mode === "source" ? " jwe-body--source" : ""}">
    <div class="jwe-visual" id="jwe-visual">
      <div class="jwe-prev-canvas" id="jwe-canvas">
        <div class="jw-docwrap" id="jwe-docwrap">
          <div class="jw-doc" id="jwe-doc" contenteditable="true" spellcheck="false">${html}</div>
        </div>
      </div>
      <div class="jwe-edit-hint">문서의 텍스트를 클릭해 직접 편집하세요. 이미지는 클릭 후 🖼 버튼으로 교체합니다.</div>
    </div>
    <div class="jwe-source">
      <textarea class="jwe-src" id="jwe-src" spellcheck="false" placeholder="HTML 소스">${stored.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</textarea>
    </div>
  </div>
</div>
</div>`;

    this._wire(el);
    requestAnimationFrame(() => this._layout());
  },

  _wire(el) {
    el.querySelector("#jwe-cancel")?.addEventListener("click", () => this.close());
    el.querySelector("#jwe-save")?.addEventListener("click", () => this._save(el));

    const doc = el.querySelector("#jwe-doc");
    const src = el.querySelector("#jwe-src");

    // 크기 조정
    el.querySelector("#jwe-w")?.addEventListener("input", e => {
      this._docW = parseInt(e.target.value, 10) || 720; this._layout();
    });
    el.querySelector("#jwe-h")?.addEventListener("input", e => {
      this._docH = parseInt(e.target.value, 10) || 900; this._layout();
    });

    // 서식 버튼 (시각 모드)
    el.querySelector("#jwe-bold")?.addEventListener("mousedown", e => { e.preventDefault(); document.execCommand("bold"); });
    el.querySelector("#jwe-italic")?.addEventListener("mousedown", e => { e.preventDefault(); document.execCommand("italic"); });

    // 양식 불러오기
    el.querySelector("#jwe-tpl")?.addEventListener("change", async e => {
      const id = e.target.value;
      e.target.value = "";
      if (!id) return;
      const tpl = EWKJournalTemplates.byId(id);
      if (!tpl) return;
      const cur = this._currentHtml(el).trim();
      const meaningful = cur && !/템플릿을 불러오거나/.test(cur);
      if (meaningful) {
        const ok = await EWKConfirm.ask({
          title: "양식 교체",
          message: `현재 내용을 "${tpl.label}" 양식으로 교체할까요? 기존 내용은 사라집니다.`,
          yes: "교체", no: "취소", danger: true,
        });
        if (!ok) return;
      }
      const resolved = EWKJournalTemplates.resolve(tpl.html.trim());
      this._docW = tpl.w ?? 720;
      this._docH = tpl.h ?? 900;
      const wEl = el.querySelector("#jwe-w"); if (wEl) wEl.value = this._docW;
      const hEl = el.querySelector("#jwe-h"); if (hEl) hEl.value = this._docH;
      if (doc) doc.innerHTML = resolved;
      if (src) src.value = tpl.html.trim();
      this._layout();
    });

    // 이미지 삽입/교체
    let savedRange = null;
    let selectedImg = null;
    doc?.addEventListener("mouseup", () => {
      const sel = window.getSelection();
      if (sel && sel.rangeCount && doc.contains(sel.anchorNode)) savedRange = sel.getRangeAt(0).cloneRange();
    });
    doc?.addEventListener("click", e => {
      doc.querySelectorAll(".jwe-img-sel").forEach(n => n.classList.remove("jwe-img-sel"));
      const img = e.target?.closest?.("img");
      if (img && doc.contains(img)) { selectedImg = img; img.classList.add("jwe-img-sel"); }
      else selectedImg = null;
    });
    el.querySelector("#jwe-img")?.addEventListener("click", () => {
      ewkPickImage((path) => {
        const snippet = `<img src="${path}" alt="" style="width:100%;display:block;border-radius:4px;">`;
        if (this._mode === "source" && src) {
          const s = src.selectionStart ?? src.value.length;
          src.value = src.value.slice(0, s) + snippet + src.value.slice(src.selectionEnd ?? s);
          return;
        }
        if (!doc) return;
        if (selectedImg && doc.contains(selectedImg)) { selectedImg.src = path; return; }
        doc.focus();
        if (savedRange) { const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(savedRange); }
        document.execCommand("insertHTML", false, snippet);
      });
    });

    // 모드 토글
    el.querySelector("#jwe-mode")?.addEventListener("click", () => {
      if (this._mode === "visual") {
        // 시각 → 소스: doc.innerHTML 을 소스로 동기화
        if (src && doc) src.value = doc.innerHTML;
        this._mode = "source";
      } else {
        // 소스 → 시각: textarea 를 doc 으로 반영
        if (src && doc) doc.innerHTML = EWKJournalTemplates.resolve(src.value);
        this._mode = "visual";
      }
      const body = el.querySelector(".jwe-body");
      body?.classList.toggle("jwe-body--source", this._mode === "source");
      const btn = el.querySelector("#jwe-mode");
      if (btn) btn.innerHTML = this._mode === "source" ? "📄 시각 편집" : "&lt;/&gt; HTML";
      this._layout();
    });

    window.addEventListener("resize", this._onResize ??= () => this._layout());
  },

  _layout() {
    const canvas = document.getElementById("jwe-canvas");
    const doc    = document.getElementById("jwe-doc");
    const wrap   = document.getElementById("jwe-docwrap");
    if (!canvas || !doc || !wrap) return;
    // 시각 편집은 정확한 캐럿을 위해 축소만(확대 없음), 가능한 1:1
    const avail = canvas.clientWidth - 48;
    const scale = Math.min(1, avail / this._docW);
    doc.style.width     = this._docW + "px";
    doc.style.minHeight = this._docH + "px";
    doc.style.transform = `scale(${scale})`;
    doc.style.transformOrigin = "top left";
    wrap.style.width  = (this._docW * scale) + "px";
    wrap.style.height = (doc.offsetHeight * scale) + "px";
  },

  async _save(el) {
    const entry = this._entry();
    if (!entry) return;
    const name = el.querySelector("#jwe-name")?.value?.trim() || entry.name;
    // 저장 시 현재 모드 기준으로 최신 HTML 확보
    let html;
    if (this._mode === "source") {
      html = el.querySelector("#jwe-src")?.value ?? "";
    } else {
      const doc = el.querySelector("#jwe-doc");
      doc?.querySelectorAll(".jwe-img-sel").forEach(n => n.classList.remove("jwe-img-sel"));
      html = doc?.innerHTML ?? "";
    }
    const surface = /jr-paper/.test(html) ? "paper" : "dark";
    await entry.update({
      name,
      "flags.fate-core-ko.html": html,
      "flags.fate-core-ko.surface": surface,
      "flags.fate-core-ko.docW": this._docW,
      "flags.fate-core-ko.docH": this._docH,
    });
    ui.notifications?.info("저널이 저장되었습니다.");
    this.close();
    if (EWKJournalViewer._entryId === entry.id) EWKJournalViewer.refresh();
  },
};

// ─── Journal Permissions (커스텀 권한 다이얼로그) ────────────────────────────

const EWKJournalPerms = {
  // 개별 저널 항목 권한
  open(entryId) {
    if (!game.user?.isGM) return;
    const entry = game.journal?.get(entryId);
    if (!entry) return;
    this._show({
      subtitle: entry.name,
      ownership: entry.ownership ?? {},
      hint: "개별 설정이 없으면 기본값을 따릅니다.",
      onSave: async (ownership) => {
        await entry.update({ ownership });
        ui.notifications?.info("권한이 저장되었습니다.");
        if (EWKJournalViewer._entryId === entry.id) EWKJournalViewer.refresh();
      },
    });
  },

  // 폴더 단위 일괄 적용 (폴더 내 모든 항목)
  openFolder(folderId) {
    if (!game.user?.isGM) return;
    const folder = game.folders?.get(folderId);
    if (!folder) return;
    const entries = (game.journal?.contents ?? []).filter(e => e.folder?.id === folderId);
    this._show({
      subtitle: `📁 ${folder.name} · ${entries.length}개 항목 일괄`,
      ownership: {},
      hint: "이 폴더 안의 모든 항목에 동일하게 적용됩니다.",
      onSave: async (ownership) => {
        if (!entries.length) return;
        await JournalEntry.updateDocuments(entries.map(e => ({ _id: e.id, ownership })));
        ui.notifications?.info(`${entries.length}개 항목에 권한을 적용했습니다.`);
        EWKJournalViewer.refresh?.();
      },
    });
  },

  _show({ subtitle = "", ownership = {}, hint = "", onSave }) {
    const LEVELS  = CONST.DOCUMENT_OWNERSHIP_LEVELS;
    const own     = ownership ?? {};
    const players = (game.users?.contents ?? []).filter(u => !u.isGM);

    const lvlSelect = (id, val) => `
<select class="jwe-select" data-perm-user="${id}">
  <option value="${LEVELS.INHERIT}"${val === LEVELS.INHERIT || val == null ? " selected" : ""}>기본값</option>
  <option value="${LEVELS.NONE}"${val === LEVELS.NONE ? " selected" : ""}>없음</option>
  <option value="${LEVELS.OBSERVER}"${val === LEVELS.OBSERVER ? " selected" : ""}>열람</option>
  <option value="${LEVELS.OWNER}"${val === LEVELS.OWNER ? " selected" : ""}>편집</option>
</select>`;

    const rows = players.map(u => `
<div class="jwp-row">
  <span class="jwp-user"><span class="jwp-dot" style="background:${u.color}"></span>${u.name}</span>
  ${lvlSelect(u.id, own[u.id])}
</div>`).join("") || `<div class="ewk-panel-empty" style="padding:12px">플레이어가 없습니다.</div>`;

    const def = own.default ?? LEVELS.NONE;
    let el = document.getElementById("ewk-journal-perms");
    if (!el) { el = document.createElement("div"); el.id = "ewk-journal-perms"; document.body.appendChild(el); }

    el.innerHTML = `<div class="jw-desk-overlay">
<div class="jwp fate-core-ko">
  <div class="jw-title">
    <div class="jw-title__txt">
      <span class="jw-title__name">권한 설정</span>
      <span class="jw-title__sub">${subtitle}</span>
    </div>
    <div class="jw-title__spacer"></div>
    <span class="jw-wbtns"><i class="jw-close-btn" id="jwp-x" title="닫기" style="cursor:pointer"></i></span>
  </div>
  <div class="jwp-body">
    <div class="jwp-row jwp-row--default">
      <span class="jwp-user"><b>기본 (모든 플레이어)</b></span>
      <select class="jwe-select" id="jwp-default">
        <option value="${LEVELS.NONE}"${def === LEVELS.NONE ? " selected" : ""}>없음</option>
        <option value="${LEVELS.OBSERVER}"${def === LEVELS.OBSERVER ? " selected" : ""}>열람</option>
        <option value="${LEVELS.OWNER}"${def === LEVELS.OWNER ? " selected" : ""}>편집</option>
      </select>
    </div>
    <div class="jwp-divider"></div>
    ${rows}
  </div>
  <div class="jwp-foot">
    <span class="jwe-hint">${hint}</span>
    <div class="jw-bar__spacer"></div>
    <button class="jwe-btn" id="jwp-cancel">취소</button>
    <button class="jwe-btn jwe-btn--save" id="jwp-save">저장</button>
  </div>
</div>
</div>`;

    const close = () => el.remove();
    el.querySelector("#jwp-x")?.addEventListener("click", close);
    el.querySelector("#jwp-cancel")?.addEventListener("click", close);
    el.querySelector(".jw-desk-overlay")?.addEventListener("click", e => { if (e.target === e.currentTarget) close(); });

    el.querySelector("#jwp-save")?.addEventListener("click", async () => {
      const out = { default: parseInt(el.querySelector("#jwp-default")?.value ?? "0", 10) };
      el.querySelectorAll("[data-perm-user]").forEach(sel => {
        out[sel.dataset.permUser] = parseInt(sel.value, 10);
      });
      await onSave?.(out);
      close();
    });
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
        const newX = this._drag.ox + e.clientX - this._drag.sx;
        const newY = this._drag.oy + e.clientY - this._drag.sy;
        el.style.left = Math.max(0, Math.min(window.innerWidth  - el.offsetWidth,  newX)) + "px";
        el.style.top  = Math.max(0, Math.min(window.innerHeight - el.offsetHeight, newY)) + "px";
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
    const sortArr  = arr => [...arr].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0) || a.name.localeCompare(b.name, "ko"));
    const visible  = sortArr(byFolder.get(activeCh) ?? scenes);

    const thumbsHtml = arr => sortArr(arr).map(s => {
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

// ─── Stage Bar ─────────────────────────────────────────────────────────────
// render()는 완전 동기 — Handlebars/async 없음, 경쟁조건 불가능
const FateStageBar = {
  _el: null,

  render() {
    if (!this._el) {
      this._el = document.createElement("div");
      this._el.id = "fate-stage-bar";
      this._el.className = "fate-core-ko";
      document.getElementById("interface")?.appendChild(this._el);
      this._bindDrag();
    } else if (!this._el.isConnected) {
      document.getElementById("interface")?.appendChild(this._el);
    }

    const speakerId = localStorage.getItem(`ewk-speaker-${game.userId}`) ?? null;

    const onStage = (game.actors?.contents ?? [])
      .filter(a => a.getFlag("fate-core-ko", "onStage"));

    const cardsHtml = onStage.map(a => {
      const items      = a.items?.filter(i => i.type === "aspect") ?? [];
      const primaryId  = a.getFlag("fate-core-ko", "primaryAspectId");
      const primaryAsp = (primaryId ? items.find(i => i.id === primaryId) : null) ?? items[0];
      const asp        = primaryAsp?.system?.label ?? "";
      const fp       = a.system?.fatepoints ?? { current: 0, refresh: 3 };
      const color    = a.getFlag("fate-core-ko", "color") || "var(--accent-gold)";
      const role     = a.getFlag("fate-core-ko", "role")  || "";
      const spk      = a.id === speakerId;
      return `
<div class="ewk-hud__card${spk ? " ewk-hud__card--active" : ""}" data-actor-id="${a.id}" style="--actor-color:${color}">
  <div class="ewk-hud__top">
    <div class="ewk-hud__portbox">
      <img class="ewk-hud__port" src="${getTokenImg(a)}" alt="">
    </div>
    <div class="ewk-hud__info">
      <div class="ewk-hud__nm">${a.name}</div>
      ${role ? `<div class="ewk-hud__div">${role}</div>` : ""}
      <div class="ewk-hud__fp">
        <button type="button" class="ewk-hud__fp-btn" data-stage-action="fp-minus" data-aid="${a.id}">−</button>
        <span class="ewk-hud__fp-n">${fp.current}</span>
        <button type="button" class="ewk-hud__fp-btn" data-stage-action="fp-plus" data-aid="${a.id}">+</button>
        <span class="ewk-hud__fp-l">운명점</span>
      </div>
    </div>
    <div class="ewk-hud__btns">
      <button type="button" class="ewk-hud__btn ewk-hud__btn--spk${spk ? " ewk-hud__btn--on" : ""}"
        data-stage-action="speak" data-aid="${a.id}" title="발언권"><i class="fa fa-comment"></i></button>
      <button type="button" class="ewk-hud__btn ewk-hud__btn--exit"
        data-stage-action="remove" data-aid="${a.id}" title="무대 퇴장"><i class="fa fa-times"></i></button>
    </div>
  </div>
  ${asp ? `<div class="ewk-hud__asp-row">${asp}</div>` : ""}
</div>`;
    }).join("");

    this._el.innerHTML = `<div class="ewk-hud__inner">${
      onStage.length
        ? cardsHtml
        : `<div class="ewk-hud__empty">출연진 없음 — 출연진 위젯이나 액터 패널에서 드래그</div>`
    }</div>`;

    this._bindButtons();
  },

  _bindButtons() {
    if (!this._el) return;
    const bar = this;

    this._el.querySelectorAll("[data-stage-action='speak']").forEach(btn => {
      btn.onclick = e => {
        e.stopPropagation();
        e.preventDefault();
        const id = btn.dataset.aid;
        if (!id) return;
        const key = `ewk-speaker-${game.userId}`;
        localStorage.getItem(key) === id
          ? localStorage.removeItem(key)
          : localStorage.setItem(key, id);
        bar.render();
        EWKQuickDock.render();
      };
    });

    this._el.querySelectorAll("[data-stage-action='remove']").forEach(btn => {
      btn.onclick = async e => {
        e.stopPropagation();
        e.preventDefault();
        const id = btn.dataset.aid;
        if (!id) return;
        const actor = game.actors?.get(id);
        if (!actor) return;
        await setActorOnStage(actor, false);
        if (localStorage.getItem(`ewk-speaker-${game.userId}`) === id)
          localStorage.removeItem(`ewk-speaker-${game.userId}`);
      };
    });

    this._el.querySelectorAll("[data-stage-action='fp-minus']").forEach(btn => {
      btn.onclick = async e => {
        e.stopPropagation();
        e.preventDefault();
        const id = btn.dataset.aid;
        if (!id) return;
        const actor = game.actors?.get(id);
        if (!actor) return;
        await actor.update({ "system.fatepoints.current": Math.max(0, actor.system.fatepoints.current - 1) });
      };
    });

    this._el.querySelectorAll("[data-stage-action='fp-plus']").forEach(btn => {
      btn.onclick = async e => {
        e.stopPropagation();
        e.preventDefault();
        const id = btn.dataset.aid;
        if (!id) return;
        const actor = game.actors?.get(id);
        if (!actor) return;
        await actor.update({ "system.fatepoints.current": actor.system.fatepoints.current + 1 });
      };
    });
  },

  _bindDrag() {
    const el = this._el;
    document.addEventListener("dragover", e => {
      if (!el.contains(e.target)) return;
      e.preventDefault();
      el.classList.add("ewk-hud--dragover");
    });
    document.addEventListener("dragleave", e => {
      if (!el.contains(e.target)) return;
      if (!el.contains(e.relatedTarget)) el.classList.remove("ewk-hud--dragover");
    });
    document.addEventListener("drop", async e => {
      if (!el.contains(e.target)) return;
      e.preventDefault();
      el.classList.remove("ewk-hud--dragover");
      const actorId = e.dataTransfer?.getData("ewk-actor-id");
      if (!actorId) return;
      const actor = game.actors?.get(actorId);
      if (actor) await setActorOnStage(actor, true);
    });
  },

  pulseSpeaker(actorId) {
    const card = this._el?.querySelector(`[data-actor-id="${actorId}"]`);
    if (!card) return;
    card.classList.remove("ewk-hud__card--pulse");
    void card.offsetWidth;
    card.classList.add("ewk-hud__card--pulse");
    setTimeout(() => card.classList.remove("ewk-hud__card--pulse"), 900);
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
    // 초기 구조 설정
    el.innerHTML = `
<div id="ewk-qdock-hdr">
  <span class="ewk-qdock-title">출연진</span>
  <button class="ewk-qdock-hdr-btn" id="ewk-qdock-min" title="최소화">−</button>
</div>
<div id="ewk-qdock-body"></div>`;
    iface.appendChild(el);
    this._el = el;
    this._wire();    // 이벤트 한 번만 연결
    this.render();   // 컨텐츠 채우기
  },

  render() {
    const el = this._el;
    if (!el) return;
    const body = el.querySelector("#ewk-qdock-body");
    if (!body) return;

    const roster = this.getRoster();
    const mySpeakerId = localStorage.getItem(`ewk-speaker-${game.userId}`) ?? null;

    const chips = roster.map(id => {
      const a = game.actors?.get(id);
      if (!a) return "";
      const onStage   = a.getFlag("fate-core-ko", "onStage") ?? false;
      const isSpeaker = id === mySpeakerId;
      return `<div class="ewk-qdock-chip${onStage ? " ewk-qdock-chip--on" : ""}${isSpeaker ? " ewk-qdock-chip--spk" : ""}" data-qdock-id="${id}">
  <div class="ewk-qdock-port-wrap">
    <img class="ewk-qdock-port" src="${getTokenImg(a)}" alt="${a.name}">
    ${onStage   ? '<span class="ewk-qdock-badge ewk-qdock-badge--stage">ON</span>'  : ""}
    ${isSpeaker ? '<span class="ewk-qdock-badge ewk-qdock-badge--spk">발언</span>' : ""}
  </div>
  <div class="ewk-qdock-name">${a.name}</div>
  <div class="ewk-qdock-acts">
    <button class="ewk-qdock-act${onStage ? " active-stage" : ""}" data-qdock-stage="${id}"
      title="${onStage ? "무대 퇴장" : "무대 등장"}">${onStage ? "▼무대" : "▲무대"}</button>
    <button class="ewk-qdock-act${isSpeaker ? " active-spk" : ""}" data-qdock-speak="${id}"
      title="${isSpeaker ? "발언 해제" : "발언 선택"}">${isSpeaker ? "●발언" : "○발언"}</button>
    <button class="ewk-qdock-act ewk-qdock-act--kick" data-qdock-kick="${id}" title="목록에서 제거">✕</button>
  </div>
</div>`;
    }).join("");

    if (this._open) {
      body.style.display = "";
      body.innerHTML = roster.length === 0
        ? `<div class="ewk-qdock-empty">액터 패널에서 여기로 드래그</div>`
        : `<div class="ewk-qdock-chips">${chips}</div>`;
    }

    // 최소화 버튼 텍스트 동기화
    const minBtn = el.querySelector("#ewk-qdock-min");
    if (minBtn) minBtn.textContent = this._open ? "−" : "+";

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

    // 최소화 버튼 (build 시 한 번만 연결)
    el.querySelector("#ewk-qdock-min")?.addEventListener("click", () => {
      this._open = !this._open;
      const body = el.querySelector("#ewk-qdock-body");
      if (body) body.style.display = this._open ? "" : "none";
      const btn = el.querySelector("#ewk-qdock-min");
      if (btn) btn.textContent = this._open ? "−" : "+";
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
          await setActorOnStage(actor, false);
          if (localStorage.getItem(`ewk-speaker-${game.userId}`) === id)
            localStorage.removeItem(`ewk-speaker-${game.userId}`);
        } else {
          await setActorOnStage(actor, true);
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

// ─── Image Overlay ─────────────────────────────────────────────────────────
const EWKImageOverlay = {
  show(src, label) {
    document.getElementById("ewk-img-overlay")?.remove();
    const el = document.createElement("div");
    el.id = "ewk-img-overlay";
    el.className = "fate-core-ko";
    el.innerHTML = `
      <button id="ewk-img-ol-close" title="닫기">✕</button>
      <img src="${src}" alt="${label ?? ""}" draggable="false">`;
    document.getElementById("interface")?.appendChild(el);
    el.querySelector("#ewk-img-ol-close").onclick = () => el.remove();
    // 드래그 가능
    el.addEventListener("mousedown", e => {
      if (e.target.closest("button")) return;
      const ox = e.clientX - el.offsetLeft, oy = e.clientY - el.offsetTop;
      const move = ev => {
        el.style.left = `${ev.clientX - ox}px`;
        el.style.top  = `${ev.clientY - oy}px`;
        el.style.right = "auto"; el.style.transform = "none";
      };
      const up = () => { document.removeEventListener("mousemove", move); document.removeEventListener("mouseup", up); };
      document.addEventListener("mousemove", move);
      document.addEventListener("mouseup", up);
    });
  },
};

// ─── Dialogue Flowchart (대사흐름도) — GM 전용 ──────────────────────────────
const EWKFlowchart = {
  _el:            null,
  _activeSceneId: null,
  _editingNodeId: null,
  _currentMusic:  null,

  _key()  { return "ewk-flowcharts"; },
  _uid()  { return `ewk${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`; },
  getData()   { try { return JSON.parse(localStorage.getItem(this._key()) ?? "[]"); } catch { return []; } },
  saveData(d) { localStorage.setItem(this._key(), JSON.stringify(d)); },

  toggle() {
    if (!game.user?.isGM) return;
    if (!this._el) { this._build(); return; }
    if (!this._el.isConnected) document.getElementById("interface")?.appendChild(this._el);
    this._el.classList.toggle("ewk-fc--open");
  },

  _build() {
    this._el = document.createElement("div");
    this._el.id = "ewk-fc-panel";
    this._el.className = "fate-core-ko ewk-fc--open";
    this._el.innerHTML = `
      <div class="ewk-fc__bar" id="ewk-fc-bar">
        <span class="ewk-fc__title">대사흐름도</span>
        <div class="ewk-fc__bar-acts">
          <button class="ewk-fc__util" id="ewk-fc-stage-clear" title="무대 전원 퇴장">전원 퇴장</button>
          <button class="ewk-fc__util" id="ewk-fc-vn-clear" title="VN 박스 닫기">VN 닫기</button>
          <button class="ewk-fc__util" id="ewk-fc-music-stop" title="음악 정지">음악 정지</button>
          <button class="ewk-fc__util ewk-fc__util--close" id="ewk-fc-close">✕</button>
        </div>
      </div>
      <div class="ewk-fc__body">
        <aside class="ewk-fc__scenes-col">
          <div class="ewk-fc__scene-list" id="ewk-fc-scene-list"></div>
          <button class="ewk-fc__new-scene" id="ewk-fc-new-scene">+ 장면 추가</button>
        </aside>
        <main class="ewk-fc__nodes-col">
          <p class="ewk-fc__hint" id="ewk-fc-hint">← 장면을 선택하세요</p>
          <div class="ewk-fc__node-list" id="ewk-fc-node-list"></div>
          <div class="ewk-fc__add-row" id="ewk-fc-add-row">
            <span class="ewk-fc__add-label">추가:</span>
            <button class="ewk-fc__add-type" data-type="dialogue">대사</button>
            <button class="ewk-fc__add-type" data-type="narration">묘사</button>
            <button class="ewk-fc__add-type" data-type="image">이미지</button>
            <button class="ewk-fc__add-type" data-type="aspect">면모</button>
            <button class="ewk-fc__add-type" data-type="music">음악</button>
            <button class="ewk-fc__add-type" data-type="memo">메모</button>
          </div>
        </main>
      </div>`;
    document.getElementById("interface")?.appendChild(this._el);
    this._bind();
    this._initDrag();
    this.renderSceneList();
    this._updateNodeArea();
  },

  _bind() {
    this._el.querySelector("#ewk-fc-close").onclick = () => this._el.classList.remove("ewk-fc--open");

    this._el.querySelector("#ewk-fc-stage-clear").onclick = async () => {
      if (!confirm("무대의 모든 액터를 퇴장시키겠습니까?")) return;
      for (const a of game.actors?.contents ?? [])
        if (a.getFlag("fate-core-ko", "onStage")) await a.unsetFlag("fate-core-ko", "onStage");
      localStorage.removeItem(`ewk-speaker-${game.userId}`);
      FateStageBar.render();
      EWKQuickDock.render();
    };

    this._el.querySelector("#ewk-fc-vn-clear").onclick = () => {
      document.getElementById("fate-vn-box")?.classList.remove("visible");
    };

    this._el.querySelector("#ewk-fc-music-stop").onclick = () => this.stopMusic();

    this._el.querySelector("#ewk-fc-new-scene").onclick = () => {
      const data = this.getData();
      const title = prompt("장면 이름:", `장면 ${data.length + 1}`);
      if (!title?.trim()) return;
      data.push({ id: this._uid(), title: title.trim(), nodes: [] });
      this.saveData(data);
      this.renderSceneList();
    };

    this._el.querySelectorAll(".ewk-fc__add-type").forEach(btn => {
      btn.onclick = () => this._startAdd(btn.dataset.type);
    });
  },

  _initDrag() {
    const bar = this._el.querySelector("#ewk-fc-bar");
    let sx, sy;
    bar.addEventListener("mousedown", e => {
      if (e.target.closest("button")) return;
      sx = e.clientX - this._el.offsetLeft;
      sy = e.clientY - this._el.offsetTop;
      const move = ev => {
        const newX = ev.clientX - sx;
        const newY = ev.clientY - sy;
        const maxX = window.innerWidth  - this._el.offsetWidth;
        const maxY = window.innerHeight - this._el.offsetHeight;
        this._el.style.left   = Math.max(0, Math.min(maxX, newX)) + "px";
        this._el.style.top    = Math.max(0, Math.min(maxY, newY)) + "px";
        this._el.style.right  = "auto";
        this._el.style.bottom = "auto";
      };
      const up = () => { document.removeEventListener("mousemove", move); document.removeEventListener("mouseup", up); };
      document.addEventListener("mousemove", move);
      document.addEventListener("mouseup", up);
    });
  },

  // ── Scene 렌더 ──────────────────────────────────────────────────────────
  renderSceneList() {
    const list = document.getElementById("ewk-fc-scene-list");
    if (!list) return;
    list.innerHTML = "";
    this.getData().forEach(scene => {
      const el = document.createElement("div");
      el.className = "ewk-fc__scene-item" + (scene.id === this._activeSceneId ? " ewk-fc__scene-item--on" : "");
      el.innerHTML = `
        <span class="ewk-fc__scene-nm">${scene.title}</span>
        <div class="ewk-fc__scene-acts">
          <button class="ewk-fc__s-btn" data-rename="${scene.id}" title="이름 변경">✎</button>
          <button class="ewk-fc__s-btn ewk-fc__s-btn--del" data-del="${scene.id}" title="삭제">✕</button>
        </div>`;
      el.querySelector(".ewk-fc__scene-nm").onclick = () => this.selectScene(scene.id);
      el.querySelector(`[data-rename]`).onclick = e => {
        e.stopPropagation();
        const name = prompt("장면 이름:", scene.title);
        if (!name?.trim()) return;
        const d = this.getData(); const s = d.find(x => x.id === scene.id);
        if (s) { s.title = name.trim(); this.saveData(d); this.renderSceneList(); }
      };
      el.querySelector(`[data-del]`).onclick = e => {
        e.stopPropagation();
        if (!confirm(`"${scene.title}" 장면을 삭제하시겠습니까?`)) return;
        const d = this.getData().filter(x => x.id !== scene.id);
        this.saveData(d);
        if (this._activeSceneId === scene.id) { this._activeSceneId = null; this._editingNodeId = null; }
        this.renderSceneList(); this.renderNodeList();
      };
      list.appendChild(el);
    });
  },

  selectScene(id) {
    this._activeSceneId = id; this._editingNodeId = null;
    this.renderSceneList(); this.renderNodeList();
  },

  _updateNodeArea() {
    const hint    = document.getElementById("ewk-fc-hint");
    const nodeList = document.getElementById("ewk-fc-node-list");
    const addRow  = document.getElementById("ewk-fc-add-row");
    if (!hint) return;
    const has = !!this._activeSceneId;
    hint.style.display     = has ? "none" : "";
    nodeList.style.display = has ? "" : "none";
    addRow.style.display   = has ? "" : "none";
  },

  // ── Node 렌더 ───────────────────────────────────────────────────────────
  renderNodeList() {
    this._updateNodeArea();
    const nodeList = document.getElementById("ewk-fc-node-list");
    if (!nodeList || !this._activeSceneId) return;
    const scene = this.getData().find(s => s.id === this._activeSceneId);
    if (!scene) return;
    nodeList.innerHTML = "";
    scene.nodes.forEach((node, idx) => {
      nodeList.appendChild(
        node.id === this._editingNodeId
          ? this._buildEditForm(node)
          : this._buildNodeEl(node, idx, scene.nodes.length)
      );
    });
  },

  _ico(t)  { return { dialogue:"💬", narration:"📖", image:"🖼️", aspect:"⚡", music:"🎵", memo:"📝" }[t] ?? "?"; },
  _lbl(t)  { return { dialogue:"대사", narration:"묘사", image:"이미지", aspect:"면모", music:"음악", memo:"메모" }[t] ?? t; },

  stopMusic() {
    if (this._currentMusic) {
      this._currentMusic.stop();
      this._currentMusic = null;
    }
  },

  _buildNodeEl(node, idx, total) {
    const actor = node.actorId ? game.actors?.get(node.actorId) : null;
    let bodyHtml = "";
    if (node.type === "dialogue") {
      bodyHtml = `
        <div class="ewk-fc__node-lbl">${actor?.name ?? "(액터 없음)"}</div>
        <div class="ewk-fc__node-prev">${node.text ?? ""}</div>`;
    } else {
      bodyHtml = `
        ${node.label ? `<div class="ewk-fc__node-lbl">${node.label}</div>` : ""}
        <div class="ewk-fc__node-prev">${node.src ?? node.text ?? ""}</div>`;
    }

    const div = document.createElement("div");
    div.className = `ewk-fc__node ewk-fc__node--${node.type}`;
    div.innerHTML = `
      <div class="ewk-fc__ord-col">
        <button class="ewk-fc__ord" data-mv="up"  ${idx === 0 ? "disabled" : ""}>▲</button>
        <button class="ewk-fc__ord" data-mv="down" ${idx === total - 1 ? "disabled" : ""}>▼</button>
      </div>
      <span class="ewk-fc__node-type">${this._lbl(node.type)}</span>
      <div class="ewk-fc__node-body">${bodyHtml}</div>
      <div class="ewk-fc__node-acts">
        ${node.type !== "memo" ? `<button class="ewk-fc__run" title="실행">▶</button>` : ""}
        <button class="ewk-fc__edit-btn" title="편집">✎</button>
        <button class="ewk-fc__del-btn"  title="삭제">✕</button>
      </div>`;

    div.querySelector("[data-mv='up']")?.addEventListener("click",    () => this._move(node.id, -1));
    div.querySelector("[data-mv='down']")?.addEventListener("click",  () => this._move(node.id,  1));
    div.querySelector(".ewk-fc__run")?.addEventListener("click",      () => this._execute(node));
    div.querySelector(".ewk-fc__edit-btn")?.addEventListener("click", () => { this._editingNodeId = node.id; this.renderNodeList(); });
    div.querySelector(".ewk-fc__del-btn")?.addEventListener("click",  () => this._delete(node.id));
    return div;
  },

  _buildEditForm(node) {
    const actorOpts = (game.actors?.contents ?? [])
      .map(a => `<option value="${a.id}"${a.id === node.actorId ? " selected" : ""}>${a.name}</option>`).join("");

    let fields = "";
    if (node.type === "dialogue") {
      fields = `
        <label>액터
          <select class="ewk-fc__field" name="actorId"><option value="">-- 선택 --</option>${actorOpts}</select>
        </label>
        <label>대사
          <textarea class="ewk-fc__field ewk-fc__ta" name="text" rows="3">${node.text ?? ""}</textarea>
        </label>`;
    } else if (node.type === "image") {
      fields = `
        <label>이미지
          <div class="ewk-fc__file-row">
            <input class="ewk-fc__field ewk-fc__file-input" type="text" name="src"
              value="${node.src ?? ""}" placeholder="파일 경로 또는 URL" readonly>
            <button type="button" class="ewk-fc__file-pick" data-picker="image">파일 선택</button>
          </div>
        </label>
        ${node.src ? `<img class="ewk-fc__img-preview" src="${node.src}" alt="">` : `<div class="ewk-fc__img-preview ewk-fc__img-preview--empty"></div>`}`;
    } else if (node.type === "music") {
      fields = `
        <label>음악 파일
          <div class="ewk-fc__file-row">
            <input class="ewk-fc__field ewk-fc__file-input" type="text" name="src"
              value="${node.src ?? ""}" placeholder="파일 경로 또는 URL" readonly>
            <button type="button" class="ewk-fc__file-pick" data-picker="audio">파일 선택</button>
          </div>
        </label>
        <div class="ewk-fc__music-name">${node.src ? node.src.split("/").pop() : ""}</div>`;
    } else {
      const rows = node.type === "memo" ? 2 : 3;
      fields = `<label>내용<textarea class="ewk-fc__field ewk-fc__ta" name="text" rows="${rows}">${node.text ?? ""}</textarea></label>`;
    }

    const hasLabel = node.type === "image" || node.type === "music" || node.type === "memo";
    const div = document.createElement("div");
    div.className = `ewk-fc__edit-form ewk-fc__node--${node.type}`;
    div.innerHTML = `
      <div class="ewk-fc__ef-hdr"><strong>${this._lbl(node.type)}</strong></div>
      ${hasLabel ? `<label>레이블 (목록에 표시될 이름, 선택)<input class="ewk-fc__field" type="text" name="label" value="${node.label ?? ""}"></label>` : ""}
      ${fields}
      <div class="ewk-fc__ef-acts">
        <button class="ewk-fc__save-btn">저장</button>
        <button class="ewk-fc__cancel-btn">취소</button>
      </div>`;

    if (node.type === "image" || node.type === "music") {
      div.querySelector(".ewk-fc__file-pick")?.addEventListener("click", () => {
        const srcInput   = div.querySelector("[name='src']");
        const pickerType = div.querySelector(".ewk-fc__file-pick")?.dataset.picker ?? "image";
        new FilePicker({
          type: pickerType,
          current: srcInput?.value ?? "",
          callback: (path) => {
            if (srcInput) srcInput.value = path;
            if (node.type === "image") {
              const preview = div.querySelector(".ewk-fc__img-preview");
              if (preview) { preview.src = path; preview.style.display = "block"; }
            } else {
              const nm = div.querySelector(".ewk-fc__music-name");
              if (nm) nm.textContent = path.split("/").pop();
            }
          },
        }).browse();
      });
    }

    div.querySelector(".ewk-fc__save-btn").onclick = () => {
      const d = this.getData();
      const scene = d.find(x => x.id === this._activeSceneId);
      const n = scene?.nodes.find(x => x.id === node.id);
      if (!n) return;
      n.label = div.querySelector("[name='label']")?.value.trim() ?? "";
      if (node.type === "dialogue") {
        n.actorId = div.querySelector("[name='actorId']")?.value ?? "";
        n.text    = div.querySelector("[name='text']")?.value.trim() ?? "";
      } else if (node.type === "image" || node.type === "music") {
        n.src = div.querySelector("[name='src']")?.value.trim() ?? "";
      } else {
        n.text = div.querySelector("[name='text']")?.value.trim() ?? "";
      }
      this.saveData(d);
      this._editingNodeId = null;
      this.renderNodeList();
    };
    div.querySelector(".ewk-fc__cancel-btn").onclick = () => {
      // 새로 추가했는데 저장 안 한 경우 삭제
      const isEmpty = !node.text && !node.src && !node.actorId && !node.label;
      if (isEmpty) this._delete(node.id);
      else { this._editingNodeId = null; this.renderNodeList(); }
    };
    return div;
  },

  // ── Node 조작 ───────────────────────────────────────────────────────────
  _startAdd(type) {
    if (!this._activeSceneId) return;
    const d = this.getData();
    const s = d.find(x => x.id === this._activeSceneId);
    if (!s) return;
    const node = { id: this._uid(), type, label: "", text: "", src: "", actorId: "" };
    s.nodes.push(node);
    this.saveData(d);
    this._editingNodeId = node.id;
    this.renderNodeList();
    document.getElementById("ewk-fc-node-list")?.lastElementChild?.scrollIntoView({ block: "nearest" });
  },

  _delete(nodeId) {
    const d = this.getData();
    const s = d.find(x => x.id === this._activeSceneId);
    if (!s) return;
    s.nodes = s.nodes.filter(n => n.id !== nodeId);
    this.saveData(d);
    if (this._editingNodeId === nodeId) this._editingNodeId = null;
    this.renderNodeList();
  },

  _move(nodeId, dir) {
    const d = this.getData();
    const s = d.find(x => x.id === this._activeSceneId);
    if (!s) return;
    const i = s.nodes.findIndex(n => n.id === nodeId), j = i + dir;
    if (j < 0 || j >= s.nodes.length) return;
    [s.nodes[i], s.nodes[j]] = [s.nodes[j], s.nodes[i]];
    this.saveData(d);
    this.renderNodeList();
  },

  // ── 실행 ───────────────────────────────────────────────────────────────
  async _execute(node) {
    if (node.type === "dialogue") {
      if (!node.actorId || !node.text) { ui.notifications?.warn("액터와 대사를 입력해주세요."); return; }
      const actor = game.actors?.get(node.actorId);
      if (!actor) { ui.notifications?.warn("해당 액터를 찾을 수 없습니다."); return; }
      localStorage.setItem(`ewk-speaker-${game.userId}`, node.actorId);
      FateStageBar.render(); EWKQuickDock.render();
      await ChatMessage.create({ content: node.text, speaker: { actor: node.actorId } });
    } else if (node.type === "narration") {
      if (!node.text) return;
      await ChatMessage.create({ content: `<em>${node.text}</em>`, speaker: { alias: "나레이터" } });
    } else if (node.type === "image") {
      if (!node.src) { ui.notifications?.warn("이미지 경로를 입력해주세요."); return; }
      EWKImageOverlay.show(node.src, node.label);
    } else if (node.type === "aspect") {
      if (!node.text) return;
      await ChatMessage.create({
        content: `<div class="ewk-aspect-invoke">⚡ <strong>${node.text}</strong></div>`,
        speaker: { alias: "나레이터" },
      });
    } else if (node.type === "music") {
      if (!node.src) { ui.notifications?.warn("음악 파일을 선택해주세요."); return; }
      this.stopMusic();
      this._currentMusic = await foundry.audio.AudioHelper.play({
        src: node.src, volume: 0.8, loop: true, autoplay: true,
      });
    }
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

// ─── Typing Indicator ──────────────────────────────────────────────────────

const EWKTyping = {
  _states:      new Map(), // userId → { userName, actorId, timer }
  _localTyping: false,
  _localTimer:  null,

  init() {
    game.socket?.on("system.fate-core-ko", (data) => {
      if (data?.type === "typing") this._receive(data);
    });
    document.addEventListener("input", (e) => {
      if (e.target?.id === "ewk-chat-input") this._onLocalInput();
    });
    // 전송·포커스 아웃 시 즉시 중단
    document.addEventListener("focusout", (e) => {
      if (e.target?.id === "ewk-chat-input") this._stopLocal();
    });
  },

  _onLocalInput() {
    if (this._localTimer) clearTimeout(this._localTimer);
    if (!this._localTyping) {
      this._localTyping = true;
      this._emit(true);
    }
    this._localTimer = setTimeout(() => this._stopLocal(), 2500);
    this._applyStageCards();
  },

  _stopLocal() {
    if (this._localTimer) { clearTimeout(this._localTimer); this._localTimer = null; }
    if (!this._localTyping) return;
    this._localTyping = false;
    this._emit(false);
    this._applyStageCards();
  },

  _emit(isTyping) {
    const actorId = localStorage.getItem(`ewk-speaker-${game.userId}`) ?? null;
    game.socket?.emit("system.fate-core-ko", {
      type:     "typing",
      userId:   game.userId,
      userName: game.user?.name ?? "알 수 없음",
      actorId,
      isTyping,
    });
  },

  _receive({ userId, userName, actorId, isTyping }) {
    if (userId === game.userId) return;
    const prev = this._states.get(userId);
    if (prev?.timer) clearTimeout(prev.timer);
    if (isTyping) {
      const timer = setTimeout(() => { this._states.delete(userId); this._updateUI(); }, 6000);
      this._states.set(userId, { userName, actorId, timer });
    } else {
      this._states.delete(userId);
    }
    this._updateUI();
  },

  _updateUI() {
    // ── 타이핑 바 텍스트 ──
    const bar = document.getElementById("ewk-typing-bar");
    if (bar) {
      const users = [...this._states.values()];
      if (!users.length) {
        bar.textContent = "";
        bar.hidden = true;
      } else {
        const names = users.map(u => u.userName);
        bar.textContent = names.length === 1
          ? `${names[0]}이(가) 대사를 입력하고 있습니다...`
          : `${names.join(", ")}이(가) 대사를 입력하고 있습니다...`;
        bar.hidden = false;
      }
    }
    this._applyStageCards();
  },

  _applyStageCards() {
    document.querySelectorAll(".ewk-hud__card--typing")
      .forEach(el => el.classList.remove("ewk-hud__card--typing"));
    // 다른 사용자
    for (const { actorId } of this._states.values()) {
      if (!actorId) continue;
      document.querySelector(`.ewk-hud__card[data-actor-id="${actorId}"]`)
        ?.classList.add("ewk-hud__card--typing");
    }
    // 로컬 사용자 (소켓이 자신에게 돌아오지 않으므로 직접 적용)
    if (this._localTyping) {
      const localActorId = localStorage.getItem(`ewk-speaker-${game.userId}`);
      if (localActorId) {
        document.querySelector(`.ewk-hud__card[data-actor-id="${localActorId}"]`)
          ?.classList.add("ewk-hud__card--typing");
      }
    }
  },
};

// ─── Ready ────────────────────────────────────────────────────────────────

Hooks.once("ready", () => {
  // 우리 커스텀 사이드바 빌드 (FVTT #sidebar는 CSS에서 숨김)
  EWKSidebar.build();
  EWKTyping.init();
  EWKJournalTemplates.load(); // 저널 템플릿 미리 로드 (라벨 표시용)

  // 플레이어 → GM: onStage 권한 위임 처리
  game.socket?.on("system.fate-core-ko", async (data) => {
    if (data?.type !== "setOnStage" || !game.user?.isGM) return;
    const actor = game.actors?.get(data.actorId);
    if (!actor) return;
    if (data.value) await actor.setFlag("fate-core-ko", "onStage", true);
    else            await actor.unsetFlag("fate-core-ko", "onStage");
    FateStageBar.render();
    EWKQuickDock.render();
    if (EWKSidebar._activeTab === "actors") EWKSidebar._renderActorPanel();
  });

  FateStageBar.render();
  FateSceneRail.render();
  EWKAspectWidget.build();
  EWKQuickDock.build();

  // FVTT 기본 컨트롤 버튼은 CSS로 숨김 (DOM 제거 시 SceneControls.setPosition null 에러 발생)

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
    if (folder?.type === "Actor"        && EWKSidebar._activeTab === "actors")  EWKSidebar._renderActorPanel();
    if (folder?.type === "Scene"        && EWKSidebar._activeTab === "scenes")  EWKSidebar._renderScenePanel();
    if (folder?.type === "JournalEntry" && EWKSidebar._activeTab === "journal") EWKSidebar._renderJournalPanel();
  };
  const refreshScenes = () => {
    if (EWKSidebar._activeTab === "scenes") EWKSidebar._renderScenePanel();
  };
  const refreshJournals = (entry) => {
    if (EWKSidebar._activeTab === "journal") EWKSidebar._renderJournalPanel();
    if (EWKJournalViewer._entryId === entry?.id) EWKJournalViewer.refresh();
  };
  Hooks.on("createActor",            refreshActors);
  Hooks.on("updateActor",            refreshActors);
  Hooks.on("deleteActor",            refreshActors);
  Hooks.on("createScene",            refreshScenes);
  Hooks.on("updateScene",            refreshScenes);
  Hooks.on("deleteScene",            refreshScenes);
  Hooks.on("createFolder",           refreshFolders);
  Hooks.on("updateFolder",           refreshFolders);
  Hooks.on("deleteFolder",           refreshFolders);
  Hooks.on("createJournalEntry",     () => { if (EWKSidebar._activeTab === "journal") EWKSidebar._renderJournalPanel(); });
  Hooks.on("updateJournalEntry",     refreshJournals);
  Hooks.on("deleteJournalEntry",     (entry) => { if (EWKSidebar._activeTab === "journal") EWKSidebar._renderJournalPanel(); EWKJournalViewer.closeIfShowing(entry.id); });

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
  if (message.content?.includes("ewk-scene-change-msg")) return; // 장면 전환은 나레이터 유지
  const speakerId = localStorage.getItem(`ewk-speaker-${game.userId}`);
  if (!speakerId) return;
  const speakerActor = game.actors?.get(speakerId);
  if (!speakerActor) return;
  const speaker = ChatMessage.getSpeaker({ actor: speakerActor });
  speaker.alias = speakerActor.name;
  message.updateSource({ speaker });
});

// 채팅 전송 시 HUD 발언 카드 펄스
Hooks.on("createChatMessage", (message) => {
  const speakerActorId = message.speaker?.actor;
  if (!speakerActorId) return;
  FateStageBar.pulseSpeaker(speakerActorId);
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
    const actorColor = actor.getFlag("fate-core-ko", "color") || null;
    if (actorColor) el.style.setProperty("--ewk-sender-color", actorColor);
    const header = el.querySelector(".message-header");
    if (header) {
      const senderEl = header.querySelector(".message-sender");
      if (senderEl) senderEl.textContent = actor.name;
      if (!header.querySelector(".ewk-speaker-portrait")) {
        const img = document.createElement("img");
        img.className = "ewk-speaker-portrait";
        img.src = getTokenImg(actor);
        img.alt = actor.name;
        if (actorColor) img.style.borderColor = actorColor;
        header.prepend(img);
      }
    }
    const msgContent = el.querySelector(".message-content");
    if (msgContent?.textContent?.trim()) FateVNBox.show(actor, msgContent.innerHTML.trim());
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
