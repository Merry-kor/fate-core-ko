/* ════════════════════════════════════════════════════════════
   시공열차 테마 브리지 v3
   1. FCO 시트 색 재적용 (FCO 시스템에서만 작동, 자체 시스템에선 무시)
   2. 채팅: 초상(없으면 이니셜 플레이스홀더) + 서브라벨 + GM 不 인장
   3. 좌상단 월드 태그 배지
   4. 채팅 입력 위 굴림 칩 (4dF / 상태 / 카드)
   ════════════════════════════════════════════════════════════ */

/* ── 1 · FCO 시트 색 (fate-core-official 전용) ───────────── */
const SHIGONG_SCHEME = {
  "--fco-header-colour": "#15192B",
  "--fco-accent-colour": "#E8923C",
  "--fco-label-colour": "#FFF4E1",
  "--fco-sheet-background-colour": "#12141F",
  "--fco-sheet-input-colour": "rgba(5,6,12,0.6)",
  "--fco-sheet-text-colour": "#D8C9B0",
  "--fco-foundry-interactable-color": "rgba(216,201,176,0.25)",
  "--fco-border-radius": "0px",
};
function applyShigongScheme() {
  if (game.system?.id !== "fate-core-official") return;
  const root = document.documentElement.style;
  for (const [k, v] of Object.entries(SHIGONG_SCHEME)) root.setProperty(k, v);
}
Hooks.once("ready", () => {
  applyShigongScheme();
  setTimeout(applyShigongScheme, 500);
  setTimeout(applyShigongScheme, 2000);
});
Hooks.on("renderApplicationV2", foundry.utils.debounce(applyShigongScheme, 150));

/* ── 2 · 채팅 메시지 장식 ────────────────────────────────── */
Hooks.on("renderChatMessageHTML", (message, html) => {
  const header = html.querySelector(".message-header");
  if (!header || header.querySelector(".tts-portrait")) return;

  const actor = message.speaker?.actor ? game.actors.get(message.speaker.actor) : null;
  const isGM = message.author?.isGM ?? false;

  /* 초상: 액터 이미지 → 유저 아바타 → 이니셜 플레이스홀더 */
  const src = actor?.img || message.author?.avatar;
  const usable = src && !src.includes("mystery-man");
  let portrait;
  if (usable) {
    portrait = document.createElement("img");
    portrait.src = src;
    portrait.className = "tts-portrait" + (isGM && !actor ? " gm" : "");
  } else {
    portrait = document.createElement("div");
    portrait.className = "tts-portrait ph" + (isGM && !actor ? " gm" : "");
    const name = actor?.name ?? message.author?.name ?? "?";
    portrait.textContent = isGM && !actor ? "不" : name.charAt(0);
  }
  header.insertAdjacentElement("afterbegin", portrait);

  /* 발화자 이름: 유저명 대신 액터/별칭 표시 */
  const sender = header.querySelector(".message-sender");
  if (sender) {
    const alias = actor?.name ?? message.alias;
    if (alias) sender.textContent = alias;
  }
  if (sender) {
    const who = document.createElement("div");
    who.className = "tts-who";
    sender.replaceWith(who);
    who.appendChild(sender);
    const sub = document.createElement("span");
    sub.className = "tts-sub";
    sub.textContent = actor ? "승객 · PASSENGER" : isGM ? "내레이션 · GM" : "사담 · OOC";
    who.appendChild(sub);
  }

  if (isGM && !actor) html.classList.add("tts-gm-seal");
});

/* ── 3 · 월드 태그 배지 + 4 · 굴림 칩 ────────────────────── */
Hooks.once("ready", () => {
  /* 월드 태그 (좌상단) */
  if (!document.getElementById("tts-world-tag")) {
    const tag = document.createElement("div");
    tag.id = "tts-world-tag";
    tag.innerHTML = `
      <span class="seal">不</span>
      <span class="t">
        <b>${foundry.utils.escapeHTML(game.world.title)}</b>
        <i>SHIGONG · FOUNDRY VTT</i>
      </span>`;
    document.getElementById("interface")?.appendChild(tag);
  }

  /* 굴림 칩 (채팅 입력 바로 위) */
  const chatForm = document.querySelector("#chat .chat-form");
  if (chatForm && !document.getElementById("tts-roll-chips")) {
    const chips = document.createElement("div");
    chips.id = "tts-roll-chips";
    const CHIPS = [
      ["4dF", "/fate"],
      ["4dF +2", "/fate +2"],
      ["상태", "/state"],
      ["카드", "/card"],
    ];
    for (const [label, cmd] of CHIPS) {
      const a = document.createElement("a");
      a.className = "tts-chip";
      a.textContent = label;
      a.addEventListener("click", () => ui.chat.processMessage(cmd).catch((e) => ui.notifications.warn(e.message)));
      chips.appendChild(a);
    }
    chatForm.insertAdjacentElement("beforebegin", chips);
  }
});
