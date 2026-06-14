/* ════════════════════════════════════════════════════════════
   시공열차 무대 (THEATRE STAGE) v2 — 플레이어 주도형
   · 독에서 자기 액터 클릭 = 무대에 올리기 + 발화자로 선택
   · 발화자 선택 중 채팅 = 그 액터 명의로 송신 (토큰 불필요)
   · 대사 바는 채팅을 자동으로 따라감
   · 권한: 상태는 월드 설정(GM만 쓰기 가능) — 플레이어 조작은
     소켓으로 GM 클라이언트에 요청해 반영
   ════════════════════════════════════════════════════════════ */

const SG_STAGE_MOD = "shigong-archive-theme";
const SG_CH = `module.${SG_STAGE_MOD}`;
const SG_EMPTY = { visible: false, mode: "stage", cast: [], speaking: null, line: null, lines: {} };
const SG_EMOTE_NAMES = { neutral: "기본", awaken: "각성", wound: "부상", wary: "경계", resolve: "결의", fear: "공포" };

let sgPrevCast = [];

/* ── 상태 입출력 ─────────────────────────────────────────── */
const sgGet = () => foundry.utils.mergeObject(foundry.utils.deepClone(SG_EMPTY), game.settings.get(SG_STAGE_MOD, "stageState") ?? {}, { inplace: false });

const sgIsDirectorGM = () => game.user.isGM && game.users.activeGM?.id === game.user.id;

async function sgApply(patch) {
  await game.settings.set(SG_STAGE_MOD, "stageState", { ...sgGet(), ...patch });
}

/* GM이면 직접, 플레이어면 소켓으로 요청 */
function sgRequest(action, data = {}) {
  if (game.user.isGM) return sgHandle({ action, data, userId: game.user.id });
  game.socket.emit(SG_CH, { action, data, userId: game.user.id });
}

async function sgHandle(payload) {
  if (!sgIsDirectorGM()) return;
  const { action, data, userId } = payload;
  const st = sgGet();
  const user = game.users.get(userId);
  const actor = data.actor ? game.actors.get(data.actor) : null;
  const allowed = user?.isGM || (actor && actor.testUserPermission(user, "OWNER"));

  if (action === "raise" && actor && allowed) {
    if (!st.cast.some((c) => c.actor === actor.id))
      await sgApply({ cast: [...st.cast, { actor: actor.id, emote: "neutral" }], visible: true });
  } else if (action === "lower" && actor && allowed) {
    const cast = st.cast.filter((c) => c.actor !== actor.id);
    await sgApply({ cast, speaking: st.speaking === actor.id ? null : st.speaking });
  } else if (action === "speak" && data.line && actor && st.cast.some((c) => c.actor === actor.id)) {
    await sgApply({
      speaking: actor.id,
      mode: st.mode === "narration" ? "stage" : st.mode,
      lines: { ...st.lines, [actor.id]: data.line.text },
    });
  } else if (action === "rosterAdd" && actor && allowed) {
    const r = game.settings.get(SG_STAGE_MOD, "stageRoster") ?? [];
    if (!r.includes(actor.id)) await game.settings.set(SG_STAGE_MOD, "stageRoster", [...r, actor.id]);
  } else if (action === "rosterRemove" && actor && allowed) {
    const r = game.settings.get(SG_STAGE_MOD, "stageRoster") ?? [];
    await game.settings.set(SG_STAGE_MOD, "stageRoster", r.filter((id) => id !== actor.id));
    /* 명단에서 빠지면 무대에서도 내림 */
    if (st.cast.some((c) => c.actor === actor.id))
      await sgApply({ cast: st.cast.filter((c) => c.actor !== actor.id) });
  } else if (action === "flip" && actor && allowed) {
    await sgApply({ cast: st.cast.map((c) => (c.actor === actor.id ? { ...c, flip: !c.flip } : c)) });
  } else if (action === "offset" && actor && allowed) {
    const x = Math.max(-260, Math.min(260, Number(data.x) || 0));
    await sgApply({ cast: st.cast.map((c) => (c.actor === actor.id ? { ...c, x, y: 0 } : c)) });
  } else if (action === "emote" && actor && allowed) {
    await sgApply({ cast: st.cast.map((c) => (c.actor === actor.id ? { ...c, emote: data.emote } : c)) });
  }
}

/* ── 발화자 선택 (클라이언트별) ──────────────────────────── */
const sgSpeakAs = () => {
  const id = game.settings.get(SG_STAGE_MOD, "speakAs");
  const actor = id ? game.actors.get(id) : null;
  return actor?.isOwner ? actor : null;
};
async function sgSetSpeakAs(actorId) {
  await game.settings.set(SG_STAGE_MOD, "speakAs", actorId ?? "");
  sgRenderChip();
  sgRender();
}

/* ── 헬퍼 ────────────────────────────────────────────────── */
const sgTerms = (t) => foundry.utils.escapeHTML(t ?? "").replace(/\[([^\]]+)\]/g, '<span class="sg-term">$1</span>');
const sgPortrait = (actor, emote) => actor?.getFlag(SG_STAGE_MOD, "portraits")?.[emote] || actor?.img || "";
const sgSub = (actor) => {
  const tags = (actor?.system?.tags ?? []).filter(Boolean);
  if (tags.length) return tags.join(" · ");
  return actor?.type === "entity" ? "괴이 · ENTITY" : "승객 · PASSENGER";
};
const sgEmotes = (actor) => ({ neutral: actor?.img, ...(actor?.getFlag(SG_STAGE_MOD, "portraits") ?? {}) });
/* 스탠디 이미지 변환: 위치 이동 + 기본 축소(0.85) + 좌우 반전 */
const sgImgTransform = (c) =>
  `translateX(${c.x ?? 0}px) scale(0.84)${c.flip ? " scaleX(-1)" : ""}`;

/* ── 무대 렌더 ───────────────────────────────────────────── */
function sgRoot() {
  let root = document.getElementById("sg-stage");
  if (!root) {
    root = document.createElement("div");
    root.id = "sg-stage";
    document.getElementById("interface")?.appendChild(root);
  }
  const sb = document.getElementById("sidebar-content")?.getBoundingClientRect().width ?? 340;
  const lc = document.getElementById("ui-left-column-1")?.getBoundingClientRect().width ?? 60;
  document.documentElement.style.setProperty("--sg-sidebar-w", `${Math.round(sb)}px`);
  root.style.left = `${Math.round(lc)}px`;
  root.style.top = "92px";
  return root;
}

function sgRender() {
  const st = sgGet();
  const root = sgRoot();
  root.classList.toggle("sg-duo", st.mode === "duo");

  const mySpeak = sgSpeakAs();

  /* 스테이징 독 — "출연 명단"에 등록된 액터만 (시트에서 등록) */
  const roster = game.settings.get(SG_STAGE_MOD, "stageRoster") ?? [];
  const candidates = roster.map((id) => game.actors.get(id)).filter(Boolean);
  const dock = candidates.length
    ? `<div class="sg-staging-dock"><span class="sg-dock-label">출연</span>${candidates
        .map((a) => {
          const on = st.cast.some((c) => c.actor === a.id);
          const me = mySpeak?.id === a.id;
          return `<div class="sg-dock-item ${on ? "on-stage" : ""} ${me ? "speak-as" : ""}" data-actor="${a.id}" data-tooltip="${foundry.utils.escapeHTML(a.name)}${a.isOwner ? " (클릭: 올리기+발화)" : ""}"><img src="${a.img}"></div>`;
        })
        .join("")}</div>`
    : "";

  if (!st.visible) {
    root.innerHTML = dock; /* 무대가 꺼져도 독은 보임 — 올리면 자동 점등 */
    sgPrevCast = [];
    return;
  }

  const speakingId = st.mode === "narration" ? null : st.speaking;
  const standee = (c) => {
    const actor = game.actors.get(c.actor);
    if (!actor) return "";
    const isNew = !sgPrevCast.includes(c.actor);
    const cls = isNew ? "entering" : c.actor === speakingId ? "speaking" : speakingId || st.mode === "narration" ? "dimmed" : "";
    const text = st.lines?.[c.actor] ?? "";
    const box = `<div class="sg-line-box ${c.actor === speakingId ? "active" : "faded"}">
          <div class="h"><b>${foundry.utils.escapeHTML(actor.name)}</b><span>${foundry.utils.escapeHTML(sgSub(actor))}</span></div>
          <div class="t">${text ? sgTerms(text) : ""}</div>
        </div>`;
    return `<div class="sg-standee ${cls}" data-actor="${c.actor}">
      <img class="sg-standee-img" src="${sgPortrait(actor, c.emote)}" alt="${foundry.utils.escapeHTML(actor.name)}" style="transform:${sgImgTransform(c)}">
      ${box}
    </div>`;
  };

  let floor = "";
  if (st.mode === "duo" && st.cast.length >= 2) {
    const side = (c, pos) => {
      const actor = game.actors.get(c.actor);
      const cls = c.actor === speakingId ? "speaking" : "dimmed";
      return `<div class="sg-duo-side ${pos} ${cls}" data-actor="${c.actor}"><img src="${sgPortrait(actor, c.emote)}"></div>`;
    };
    floor = `<div class="sg-duo-stage">${side(st.cast[0], "left")}${side(st.cast[1], "right")}</div>`;
  } else if (st.cast.length) {
    floor = `<div class="sg-stage-floor" data-count="${st.cast.length}">${st.cast.map(standee).join("")}</div>`;
  }

  let bar = "";
  if (st.mode === "narration" && st.line) {
    bar = `
    <div class="sg-narrator-bar">
      <div class="sg-narrator-seal"><svg viewBox="0 0 26 26" width="60%" height="60%">
        <line x1="13" y1="2.5" x2="13" y2="7.5" stroke="currentColor" stroke-width="1.5"/>
        <line x1="13" y1="18.5" x2="13" y2="23.5" stroke="currentColor" stroke-width="1.5"/>
        <line x1="2.5" y1="13" x2="7.5" y2="13" stroke="currentColor" stroke-width="1.5"/>
        <line x1="18.5" y1="13" x2="23.5" y2="13" stroke="currentColor" stroke-width="1.5"/>
        <circle cx="13" cy="13" r="2.7" fill="var(--sg-ember, #E8923C)"/>
      </svg></div>
      <div class="sg-narrator-body">
        <div class="sg-narrator-label">내레이션 · NARRATION</div>
        <div class="sg-narrator-text">${sgTerms(st.line.text)}</div>
      </div>
    </div>`;
  }

  root.innerHTML = floor + bar + dock;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    root.querySelectorAll(".sg-standee.entering").forEach((el) => el.classList.remove("entering"));
  }));
  sgPrevCast = st.cast.map((c) => c.actor);
}

/* ── 발화자 칩 (채팅 입력 위) ────────────────────────────── */
function sgRenderChip() {
  const host = document.getElementById("tts-roll-chips") ?? document.querySelector("#chat .chat-form");
  if (!host) return;
  document.getElementById("sg-speak-chip")?.remove();
  const actor = sgSpeakAs();
  if (!actor) return;
  const chip = document.createElement("a");
  chip.id = "sg-speak-chip";
  chip.className = "tts-chip";
  chip.innerHTML = `발화: <b>${foundry.utils.escapeHTML(actor.name)}</b> ×`;
  chip.dataset.tooltip = "클릭하면 해제";
  chip.addEventListener("click", () => sgSetSpeakAs(""));
  host.insertAdjacentElement("afterbegin", chip);
}

/* ── 감정 메뉴 ───────────────────────────────────────────── */
function sgOpenEmoteMenu(actorId, x, y) {
  document.querySelector(".sg-emote-menu")?.remove();
  const actor = game.actors.get(actorId);
  if (!actor || !(game.user.isGM || actor.isOwner)) return;
  const menu = document.createElement("div");
  menu.className = "sg-emote-menu";
  menu.style.left = `${x}px`;
  menu.style.top = `${Math.max(60, y - 180)}px`;
  const cur = sgGet().cast.find((c) => c.actor === actorId)?.emote ?? "neutral";
  menu.innerHTML = `
    <div class="sg-emote-title"><span>감정 · EMOTE</span><b>${foundry.utils.escapeHTML(actor.name)}</b></div>
    <div class="sg-emote-grid">${Object.entries(sgEmotes(actor))
      .map(([k, src]) => `<div class="sg-emote-item ${k === cur ? "active" : ""}" data-emote="${k}"><img src="${src}"><span class="sg-emote-name">${SG_EMOTE_NAMES[k] ?? k}</span></div>`)
      .join("")}</div>`;
  menu.addEventListener("click", (ev) => {
    const item = ev.target.closest("[data-emote]");
    if (!item) return;
    sgRequest("emote", { actor: actorId, emote: item.dataset.emote });
    menu.remove();
  });
  document.getElementById("sg-stage")?.appendChild(menu);
  setTimeout(() => document.addEventListener("click", () => menu.remove(), { once: true }), 0);
}

/* ── 등록 ────────────────────────────────────────────────── */
Hooks.once("init", () => {
  game.settings.register(SG_STAGE_MOD, "stageState", {
    scope: "world", config: false, type: Object, default: SG_EMPTY,
    onChange: () => sgRender(),
  });
  game.settings.register(SG_STAGE_MOD, "speakAs", {
    scope: "client", config: false, type: String, default: "",
  });
  game.settings.register(SG_STAGE_MOD, "stageRoster", {
    scope: "world", config: false, type: Array, default: [],
    onChange: () => { sgRender(); sgRefreshRosterButtons(); },
  });

  const C = foundry.applications.sidebar.tabs.ChatLog.CHAT_COMMANDS;
  C.sgstage = {
    rgx: /^\/무대(?:\s+(정리|1대1|해제|끄기))?$/,
    fn: async (cmd, match) => {
      if (!game.user.isGM) return ui.notifications.warn("GM 전용 명령입니다.");
      const st = sgGet();
      const arg = match[1];
      if (arg === "정리") return sgApply({ cast: [], speaking: null, line: null, lines: {} });
      if (arg === "1대1") return sgApply({ mode: "duo", visible: true });
      if (arg === "해제") return sgApply({ mode: "stage" });
      if (arg === "끄기") return sgApply({ visible: false });
      return sgApply({ visible: !st.visible });
    },
    isRoll: false, isMultiline: false,
  };
  C.sgnarrate = {
    rgx: /^\/연출\s+([\s\S]+)$/,
    fn: async (cmd, match) => {
      if (!game.user.isGM) return ui.notifications.warn("GM 전용 명령입니다.");
      return sgApply({ visible: true, mode: "narration", line: { text: match[1].trim() } });
    },
    isRoll: false, isMultiline: true,
  };
});

Hooks.once("ready", () => {
  game.socket.on(SG_CH, (payload) => sgHandle(payload));
  sgRender();
  sgRenderChip();

  const root = sgRoot();
  root.addEventListener("click", (ev) => {
    const dockItem = ev.target.closest(".sg-dock-item");
    if (dockItem) {
      const actor = game.actors.get(dockItem.dataset.actor);
      if (!actor) return;
      const st = sgGet();
      const onStage = st.cast.some((c) => c.actor === actor.id);
      if (!onStage) sgRequest("raise", { actor: actor.id }); /* 올리기 */
      if (actor.isOwner) sgSetSpeakAs(actor.id);             /* 발화자 선택 */
      return;
    }
    const standee = ev.target.closest(".sg-standee, .sg-duo-side");
    if (standee) {
      const actor = game.actors.get(standee.dataset.actor);
      if (actor?.isOwner) sgSetSpeakAs(actor.id);
    }
  });
  /* 우클릭: 독 아이템 = 무대에서 내리기 · 스탠디 = 감정 메뉴 */
  root.addEventListener("contextmenu", (ev) => {
    const dockItem = ev.target.closest(".sg-dock-item");
    if (dockItem) {
      ev.preventDefault();
      return sgRequest("lower", { actor: dockItem.dataset.actor });
    }
    /* 대사 박스 우클릭 = 좌우 반전 (소유자/GM) */
    const box = ev.target.closest(".sg-line-box");
    if (box) {
      ev.preventDefault();
      const id = box.closest(".sg-standee")?.dataset.actor;
      const a = id && game.actors.get(id);
      if (a && (game.user.isGM || a.isOwner)) sgRequest("flip", { actor: id });
      return;
    }
    const standee = ev.target.closest(".sg-standee, .sg-duo-side");
    if (standee) {
      ev.preventDefault();
      sgOpenEmoteMenu(standee.dataset.actor, ev.clientX, ev.clientY);
    }
  });

  /* 대사 박스 좌클릭 드래그 = 스탠디 이미지 이동 (소유자/GM) */
  root.addEventListener("pointerdown", (ev) => {
    if (ev.button !== 0) return;
    const box = ev.target.closest(".sg-line-box");
    if (!box) return;
    const standee = box.closest(".sg-standee");
    const id = standee?.dataset.actor;
    const a = id && game.actors.get(id);
    if (!a || !(game.user.isGM || a.isOwner)) return;
    ev.preventDefault();
    const img = standee.querySelector(".sg-standee-img");
    const cur = sgGet().cast.find((c) => c.actor === id) ?? {};
    const base = { x: cur.x ?? 0, y: cur.y ?? 0 };
    const start = { x: ev.clientX, y: ev.clientY };
    let last = base;
    const move = (mv) => {
      last = { x: Math.max(-260, Math.min(260, base.x + (mv.clientX - start.x))), y: 0 };
      img.style.transform = sgImgTransform({ ...cur, ...last });
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      if (last.x !== base.x || last.y !== base.y) sgRequest("offset", { actor: id, ...last });
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  });
});

/* 액터 목록 우클릭 메뉴: 무대에 올리기/내리기 (v14 API) */
Hooks.on("getActorContextOptions", (app, menuItems) => {
  /* v14: visible(target) / onClick(event, target) — 인자 순서가 달라
     어떤 인자로 오든 HTMLElement를 찾아 entry-id를 캔다 */
  const getActor = (...args) => {
    const el = args.find((a) => a instanceof HTMLElement)
      ?? args.find((a) => a?.currentTarget instanceof HTMLElement)?.currentTarget;
    const li = el?.closest?.("[data-entry-id], [data-document-id]") ?? el;
    const id = li?.dataset?.entryId ?? li?.dataset?.documentId;
    return id ? game.actors.get(id) : null;
  };
  menuItems.push(
    {
      label: "무대에 올리기",
      icon: '<i class="fa-solid fa-person-rays"></i>',
      visible: (...args) => {
        const a = getActor(...args);
        return !!a && (game.user.isGM || a.isOwner) && !sgGet().cast.some((c) => c.actor === a.id);
      },
      onClick: (...args) => {
        const a = getActor(...args);
        if (!a) return;
        sgRequest("raise", { actor: a.id });
        if (a.isOwner) sgSetSpeakAs(a.id);
      },
    },
    {
      label: "무대에서 내리기",
      icon: '<i class="fa-solid fa-person-walking-arrow-right"></i>',
      visible: (...args) => {
        const a = getActor(...args);
        return !!a && (game.user.isGM || a.isOwner) && sgGet().cast.some((c) => c.actor === a.id);
      },
      onClick: (...args) => {
        const a = getActor(...args);
        if (a) sgRequest("lower", { actor: a.id });
      },
    }
  );
});

/* 액터 시트 헤더에 무대 토글 버튼 */
Hooks.on("getHeaderControlsDocumentSheetV2", (app, controls) => {
  const actor = app.document;
  if (actor?.documentName !== "Actor") return;
  if (!(game.user.isGM || actor.isOwner)) return;
  controls.push({
    icon: "fa-solid fa-person-rays",
    label: "무대 올리기/내리기",
    onClick: () => {
      const on = sgGet().cast.some((c) => c.actor === actor.id);
      sgRequest(on ? "lower" : "raise", { actor: actor.id });
      if (!on && actor.isOwner) sgSetSpeakAs(actor.id);
    },
  });
});

/* 액터 시트 헤더에 "출연" 토글 버튼 직접 주입 */
function sgInjectRosterBtn(app) {
  const actor = app?.document;
  if (actor?.documentName !== "Actor") return;
  if (!(game.user.isGM || actor.isOwner)) return;
  const header = app.element?.querySelector(".window-header");
  if (!header) return;
  let btn = header.querySelector(".sg-roster-btn");
  if (!btn) {
    btn = document.createElement("a");
    btn.className = "sg-roster-btn";
    btn.addEventListener("click", () => {
      const r = game.settings.get(SG_STAGE_MOD, "stageRoster") ?? [];
      sgRequest(r.includes(actor.id) ? "rosterRemove" : "rosterAdd", { actor: actor.id });
    });
    header.querySelector(".window-title")?.insertAdjacentElement("afterend", btn);
  }
  const onRoster = (game.settings.get(SG_STAGE_MOD, "stageRoster") ?? []).includes(actor.id);
  btn.innerHTML = onRoster
    ? `<i class="fa-solid fa-person-rays"></i> 출연 중`
    : `<i class="fa-regular fa-circle-up"></i> 출연 등록`;
  btn.classList.toggle("on", onRoster);
}
Hooks.on("renderApplicationV2", (app) => sgInjectRosterBtn(app));
function sgRefreshRosterButtons() {
  for (const app of foundry.applications.instances.values()) sgInjectRosterBtn(app);
}

/* 채팅 칩이 채팅 재렌더 후에도 살아있게 */
Hooks.on("renderChatLog", () => sgRenderChip());

/* ── 채팅 명의 전환: 발화자 선택 중이면 그 액터로 송신 ────── */
Hooks.on("preCreateChatMessage", (msg) => {
  const actor = sgSpeakAs();
  if (!actor) return;
  if (msg.author && msg.author.id !== game.user.id) return;
  msg.updateSource({ speaker: { actor: actor.id, alias: actor.name, token: null, scene: null } });
});

/* 무대 위 인물 명의의 채팅 → 대사 바 (담당 GM 클라이언트가 반영) */
Hooks.on("createChatMessage", (msg) => {
  if (!sgIsDirectorGM()) return;
  const st = sgGet();
  if (!st.visible) return;
  const aid = msg.speaker?.actor;
  if (!aid || !st.cast.some((c) => c.actor === aid)) return;
  const actor = game.actors.get(aid);
  const text = msg.content?.replace(/<[^>]*>/g, "").trim();
  if (!text) return;
  sgApply({
    speaking: aid,
    mode: st.mode === "narration" ? "stage" : st.mode,
    lines: { ...st.lines, [aid]: text },
  });
});
