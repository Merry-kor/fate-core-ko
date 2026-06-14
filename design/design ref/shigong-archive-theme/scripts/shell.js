/* ════════════════════════════════════════════════════════════
   시공열차 UI 셸 — Foundry 골격 재구성 (MRKB 방식)
   CSS로 안 되는 목업 구조를 DOM 재배치/주입으로 구현:
   1. 상단 어셈블리 — 월드 태그 + 씬 내비를 한 줄로
   2. 채팅 패널 헤더 — "대화 CHAT LOG" + 내보내기/비우기
   3. 플레이어 패널 — "탑승자 · PLAYERS" 헤더 + 역할 라벨
   4. 핫바 — 아이콘 + 이름 라벨형 슬롯
   5. 우하단 줌 컨트롤
   코어가 다시 그릴 때마다 원상복구되므로, 각 render 훅에서
   다시 적용한다 (모든 함수는 중복 실행 안전).
   ════════════════════════════════════════════════════════════ */

/* ── 1 · 상단 어셈블리 ───────────────────────────────────── */
function sgTopbar() {
  const ui_ = document.getElementById("interface");
  if (!ui_) return;
  let bar = document.getElementById("tts-topbar");
  if (!bar) {
    bar = document.createElement("div");
    bar.id = "tts-topbar";
    ui_.appendChild(bar);
  }
  /* 월드 태그가 없으면 셸이 직접 생성 */
  if (!document.getElementById("tts-world-tag")) {
    const t = document.createElement("div");
    t.id = "tts-world-tag";
    t.innerHTML = `<span class="seal">不</span><span class="t"><b>${foundry.utils.escapeHTML(game.world.title)}</b><i>SHIGONG · FOUNDRY VTT</i></span>`;
    bar.appendChild(t);
  }
  const tag = document.getElementById("tts-world-tag");
  const nav = document.getElementById("scene-navigation");
  if (tag && tag.parentElement !== bar) bar.appendChild(tag);
  if (nav && nav.parentElement !== bar) bar.appendChild(nav);

  /* 레일을 상단바로 이동 + 탭 전환 직접 배선 (코어 위임이 끊기므로) */
  if (!bar.querySelector(".tts-spacer")) {
    const sp = document.createElement("div");
    sp.className = "tts-spacer";
    bar.appendChild(sp);
  }
  /* 자체 탭 스트립 — 원본 레일은 건드리지 않고(코어 보호) 숨긴 뒤,
     우리 버튼으로 같은 일을 한다 */
  if (!bar.querySelector("#tts-tabs")) {
    const TABS = [
      ["chat", "fa-comments", "대화"],
      ["scenes", "fa-map", "씬"],
      ["actors", "fa-users", "액터"],
      ["journal", "fa-book-open", "저널"],
      ["playlists", "fa-music", "음악"],
      ["settings", "fa-gear", "설정"],
    ];
    const strip = document.createElement("div");
    strip.id = "tts-tabs";
    for (const [tab, icon, label] of TABS) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "tts-tab";
      b.dataset.tab = tab;
      b.dataset.tooltip = label;
      b.innerHTML = `<i class="fa-solid ${icon}"></i>`;
      strip.appendChild(b);
    }
    /* 사이드바 접기/펼치기 토글 */
    const tg = document.createElement("button");
    tg.type = "button";
    tg.className = "tts-tab tts-toggle";
    tg.dataset.tooltip = "사이드바 접기/펼치기";
    tg.innerHTML = `<i class="fa-solid fa-angles-right"></i>`;
    strip.appendChild(tg);
    bar.appendChild(strip);

    strip.addEventListener("click", (ev) => {
      const btn = ev.target.closest("button.tts-tab");
      if (!btn) return;
      try {
        if (btn.classList.contains("tts-toggle")) return ui.sidebar.toggleExpanded();
        const content = document.getElementById("sidebar-content");
        if (content && !content.classList.contains("expanded")) ui.sidebar.toggleExpanded();
        ui.sidebar.changeTab(btn.dataset.tab, "primary");
        strip.querySelectorAll(".tts-tab[data-tab]").forEach((b) =>
          b.classList.toggle("active", b.dataset.tab === btn.dataset.tab)
        );
      } catch (e) {
        console.error("시공열차 셸 | 탭 전환 실패:", e);
        ui.notifications.error(`탭 전환 실패: ${e.message}`);
      }
    });
    strip.querySelector('[data-tab="chat"]')?.classList.add("active");
  }

  /* 씬 클릭 = 즉시 활성화 (GM 전용) */
  if (nav && !nav.dataset.ttsActivate) {
    nav.dataset.ttsActivate = "1";
    nav.addEventListener("click", (ev) => {
      const li = ev.target.closest("li[data-scene-id]");
      if (!li || !game.user.isGM) return;
      game.scenes.get(li.dataset.sceneId)?.activate();
    });
  }
}

/* ── 2 · 채팅 패널 헤더 ──────────────────────────────────── */
function sgChatHead() {
  const chat = document.getElementById("chat");
  if (!chat || chat.querySelector(".tts-chat-head")) return;
  const head = document.createElement("div");
  head.className = "tts-chat-head";
  head.innerHTML = `
    <b>대화</b><span>CHAT LOG</span>
    <a data-act="export" data-tooltip="기록 내보내기"><i class="fa-solid fa-download"></i></a>
    <a data-act="flush" data-tooltip="기록 비우기"><i class="fa-solid fa-trash"></i></a>`;
  head.querySelector('[data-act="export"]').addEventListener("click", () => ui.chat._onExport?.() ?? game.messages.export());
  head.querySelector('[data-act="flush"]').addEventListener("click", () => {
    if (game.user.isGM) game.messages.flush();
    else ui.notifications.warn("GM만 비울 수 있습니다.");
  });
  chat.insertAdjacentElement("afterbegin", head);
}

/* ── 3 · 플레이어 패널 ───────────────────────────────────── */
function sgPlayers() {
  const players = document.getElementById("players");
  if (!players) return;
  /* 헤더 */
  if (!players.querySelector(".tts-players-head")) {
    const head = document.createElement("div");
    head.className = "tts-players-head";
    players.insertAdjacentElement("afterbegin", head);
  }
  const active = game.users.filter((u) => u.active).length;
  players.querySelector(".tts-players-head").innerHTML =
    `<b>탑승자 · PLAYERS</b><span>${active} 접속</span>`;
  /* 역할 라벨 */
  players.querySelectorAll("li[data-user-id]").forEach((li) => {
    const user = game.users.get(li.dataset.userId);
    if (!user) return;
    let role = li.querySelector(".tts-role");
    if (!role) {
      role = document.createElement("span");
      role.className = "tts-role";
      li.appendChild(role);
    }
    role.textContent = user.isGM
      ? "GM"
      : user.character?.system?.affiliation ?? "승객";
  });
}

/* ── 4 · 핫바 라벨 ───────────────────────────────────────── */
function sgHotbarLabels() {
  document.querySelectorAll("#action-bar .slot").forEach((slot) => {
    const macroId = game.user.hotbar?.[slot.dataset.slot];
    const macro = macroId ? game.macros.get(macroId) : null;
    let lbl = slot.querySelector(".tts-ml");
    if (!macro) { lbl?.remove(); slot.classList.remove("filled"); return; }
    slot.classList.add("filled");
    if (!lbl) {
      lbl = document.createElement("span");
      lbl.className = "tts-ml";
      slot.appendChild(lbl);
    }
    lbl.textContent = macro.name;
  });
}

/* ── 5 · 줌 컨트롤 (우하단) ──────────────────────────────── */
function sgZoom() {
  if (document.getElementById("tts-zoom")) return;
  const z = document.createElement("div");
  z.id = "tts-zoom";
  z.innerHTML = `
    <a data-z="in" data-tooltip="확대"><i class="fa-solid fa-magnifying-glass-plus"></i></a>
    <a data-z="out" data-tooltip="축소"><i class="fa-solid fa-magnifying-glass-minus"></i></a>
    <a data-z="reset" data-tooltip="초기화"><i class="fa-solid fa-crosshairs"></i></a>`;
  z.addEventListener("click", (ev) => {
    const act = ev.target.closest("[data-z]")?.dataset.z;
    if (!act || !canvas?.ready) return;
    const s = canvas.stage.scale.x;
    if (act === "in") canvas.animatePan({ scale: s * 1.3 });
    else if (act === "out") canvas.animatePan({ scale: s / 1.3 });
    else canvas.animatePan({ x: canvas.scene.width / 2, y: canvas.scene.height / 2, scale: Math.min(window.innerWidth / canvas.scene.width, window.innerHeight / canvas.scene.height) });
  });
  document.getElementById("interface")?.appendChild(z);
}

/* ── 적용 + 재적용 훅 ────────────────────────────────────── */
function sgShellAll() {
  sgTopbar(); sgChatHead(); sgPlayers(); sgHotbarLabels(); sgZoom();
}
Hooks.once("ready", () => {
  sgShellAll();
  setTimeout(sgShellAll, 800); /* 늦게 그려지는 요소 대비 */
});
Hooks.on("renderSceneNavigation", () => { sgTopbar(); sgNavExpand(); });

/* 씬을 보면 내비에 고정 — GM이 우클릭으로 내비 토글을 끄기 전까지 유지 */
Hooks.on("canvasReady", () => {
  if (game.user.isGM && canvas.scene && !canvas.scene.navigation) {
    canvas.scene.update({ navigation: true });
  }
  sgNavExpand();
});

/* 내비를 항상 펼침 상태로 — 접히면 비활성 씬 탭이 아예 렌더되지 않음 */
function sgNavExpand() {
  const nav = ui.nav ?? ui.sceneNavigation;
  if (!nav) return;
  if (typeof nav.expand === "function") nav.expand();
  else if (typeof nav.toggleExpanded === "function" && !document.getElementById("scene-navigation")?.classList.contains("expanded")) nav.toggleExpanded();
}
Hooks.once("ready", () => setTimeout(sgNavExpand, 500));

/* ── 폴더 접기: 코어와 무관하게 직접 처리 (상태 기억 + 재적용) ── */
const sgFolds = new Set(JSON.parse(sessionStorage.getItem("sg-folds") ?? "[]"));
function sgApplyFolds() {
  document.querySelectorAll(".directory li.folder").forEach((li) => {
    li.classList.toggle("sg-collapsed", sgFolds.has(li.dataset.folderId));
  });
}
Hooks.once("ready", () => {
  sgApplyFolds();
  document.body.addEventListener(
    "click",
    (ev) => {
      const header = ev.target.closest(".directory .folder-header");
      if (!header || ev.target.closest("button, input")) return;
      const li = header.closest("li.folder");
      const id = li?.dataset.folderId;
      if (!id) return;
      sgFolds.has(id) ? sgFolds.delete(id) : sgFolds.add(id);
      sessionStorage.setItem("sg-folds", JSON.stringify([...sgFolds]));
      sgApplyFolds();
    },
    true /* 코어 핸들러보다 먼저 */
  );
});
/* 디렉토리가 다시 그려질 때마다 접힘 상태 재적용 */
Hooks.on("renderApplicationV2", () => setTimeout(sgApplyFolds, 30));

/* 씬 디렉토리: 클릭 한 번 = 해당 씬 보기 (GM) */
Hooks.once("ready", () => {
  document.body.addEventListener("click", (ev) => {
    const li = ev.target.closest("#scenes li.directory-item[data-entry-id]");
    if (!li || !game.user.isGM) return;
    if (ev.target.closest("button, .folder-header, input")) return;
    game.scenes.get(li.dataset.entryId)?.view();
  });
});
Hooks.on("renderSidebar", () => sgTopbar());
Hooks.on("renderChatLog", () => sgChatHead());
Hooks.on("renderPlayers", () => sgPlayers());
Hooks.on("renderHotbar", () => sgHotbarLabels());
Hooks.on("userConnected", () => sgPlayers());
