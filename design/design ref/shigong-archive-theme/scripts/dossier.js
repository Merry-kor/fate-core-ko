/* ════════════════════════════════════════════════════════════
   인물 기록 (DOSSIER) — 목업 디자인의 열람용 캐릭터 창
   /dossier 이름  또는  /인물 이름  으로 열기
   (이름 생략 시: 선택한 토큰 → 내 캐릭터 순으로 찾음)
   편집은 기존 FCO 시트에서, 이 창은 보여주기용.
   기능 줄을 클릭하면 4dF+등급 판정을 굴린다.
   ════════════════════════════════════════════════════════════ */

class DossierApp extends foundry.applications.api.ApplicationV2 {
  constructor(actor, options = {}) {
    super({ id: `fuh-dossier-${actor.id}`, ...options });
    this.actor = actor;
  }

  static DEFAULT_OPTIONS = {
    classes: ["fuh-dossier-app"],
    window: { title: "인물 기록", icon: "fas fa-address-card" },
    position: { width: 480, height: "auto" },
  };

  get title() {
    return `인물 기록 — ${this.actor.name}`;
  }

  async _renderHTML() {
    const esc = foundry.utils.escapeHTML ?? ((s) => s);
    const a = this.actor;
    const sys = a.system ?? {};
    const fp = sys.fate ?? sys.details?.fatePoints ?? {};
    const tracker = game.settings.get("shigong-archive-theme", "trackerState") ?? { ember: 0, dark: 0 };

    const aspects = Object.values(sys.aspects ?? {});
    const skills = Object.values(sys.skills ?? {})
      .filter((s) => Number(s.rank) > 0)
      .sort((x, y) => Number(y.rank) - Number(x.rank));

    const aspectRows = aspects
      .map(
        (as) => `
      <div class="fuh-do-aspect">
        <span class="k">${esc(as.label ?? as.name ?? "")}</span>
        <span class="v">${esc(as.value ?? "")}</span>
      </div>`
      )
      .join("");

    const skillRows = skills
      .map((s) => {
        const r = Number(s.rank);
        const pips = [0, 1, 2, 3, 4]
          .map((i) => `<i class="${i < Math.min(r, 5) ? "on" : ""}"></i>`)
          .join("");
        return `
      <div class="fuh-do-skill" data-rank="${r}" data-name="${esc(s.name)}">
        <span class="pips">${pips}</span>
        <span class="sn">${esc(s.name)}</span>
        <span class="sv">+${r}</span>
      </div>`;
      })
      .join("");

    const lore = sys.lore || sys.details?.description?.value || sys.details?.biography?.value || "";

    return `
    <div class="fuh-dossier">
      <div class="fuh-do-hero">
        <div class="fuh-do-portrait" style="background-image:url('${a.img}')"><span class="seal">不</span></div>
        <div class="fuh-do-id">
          <div class="eyebrow">인물 기록 · DOSSIER</div>
          <div class="nm">${esc(a.name)}</div>
          ${sys.details?.pronouns?.value ? `<div class="rom">${esc(sys.details.pronouns.value)}</div>` : ""}
          <div class="fuh-do-res">
            <div><span>불씨 · EMBER</span><b class="ember">${tracker.ember}</b></div>
            <div><span>어둠 · DARK</span><b class="dark">${tracker.dark}</b></div>
            <div><span>운명점 · FP</span><b>${fp.current ?? 0} / ${fp.refresh ?? 0}</b></div>
          </div>
        </div>
      </div>
      ${aspectRows ? `<div class="fuh-do-label">양상 · ASPECTS</div>${aspectRows}` : ""}
      ${skillRows ? `<div class="fuh-do-label">기능 · SKILLS <span class="hint">클릭하면 판정</span></div>${skillRows}` : ""}
      ${lore ? `<div class="fuh-do-label">배경 · LORE</div><div class="fuh-do-lore">${lore}</div>` : ""}
    </div>`;
  }

  _replaceHTML(result, content) {
    content.innerHTML = result;
  }

  _onRender() {
    this.element.querySelectorAll(".fuh-do-skill").forEach((el) =>
      el.addEventListener("click", async () => {
        const rank = parseInt(el.dataset.rank, 10) || 0;
        await new Roll(rank ? `4df + ${rank}` : "4df").toMessage({
          speaker: ChatMessage.getSpeaker({ actor: this.actor }),
          flavor: `🎲 ${el.dataset.name} 판정`,
        });
      })
    );
  }
}

Hooks.once("init", () => {
  foundry.applications.sidebar.tabs.ChatLog.CHAT_COMMANDS.dossier = {
    rgx: /^\/(?:dossier|인물)(?:\s+(.+))?$/i,
    fn: async (command, match) => {
      let actor = null;
      const q = match[1]?.trim().toLowerCase();
      if (q) actor = game.actors.find((x) => x.name.toLowerCase().includes(q));
      else actor = canvas.tokens?.controlled[0]?.actor ?? game.user.character;
      if (!actor)
        return ui.notifications.warn("대상을 찾을 수 없습니다. '/인물 이름' 으로 지정하거나 토큰을 선택하세요.");
      new DossierApp(actor).render(true);
    },
    isRoll: false,
    isMultiline: false,
  };
});
