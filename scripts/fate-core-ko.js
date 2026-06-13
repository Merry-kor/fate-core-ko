/**
 * fate-core-ko — Fate Core Korean Edition for FoundryVTT v13
 * End-War Knight Design System 적용
 */

// ─── FateDie ──────────────────────────────────────────────────────────────

class FateDie extends Die {
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

class FateCharacterSheet extends foundry.applications.sheets.ActorSheetV2 {
  static DEFAULT_OPTIONS = {
    classes: ["fate-core-ko", "sheet", "actor", "character"],
    position: { width: 800, height: 700 },
    actions: {
      rollSkill:  FateCharacterSheet.#onRollSkill,
      adjustFP:   FateCharacterSheet.#onAdjustFP,
      addItem:    FateCharacterSheet.#onAddItem,
      deleteItem: FateCharacterSheet.#onDeleteItem,
      editItem:   FateCharacterSheet.#onEditItem,
    },
  };

  static PARTS = {
    sheet: { template: "systems/fate-core-ko/templates/actor/character-sheet.hbs" },
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const actor = this.actor;
    const items = actor.items;
    return {
      ...context,
      actor,
      system: actor.system,
      aspects:      items.filter(i => i.type === "aspect"),
      skills:       items.filter(i => i.type === "skill").sort((a, b) => b.system.rank - a.system.rank),
      stunts:       items.filter(i => i.type === "stunt"),
      stressTracks: items.filter(i => i.type === "stress"),
      consequences: items.filter(i => i.type === "consequence"),
      extras:       items.filter(i => i.type === "extra"),
      ladder: CONFIG.FATE.ladder,
    };
  }

  static async #onRollSkill(event, target) {
    const itemId = target.closest("[data-item-id]")?.dataset.itemId;
    const item = this.actor.items.get(itemId);
    if (!item) return;
    await rollFate(this.actor, item);
  }

  static async #onAdjustFP(event, target) {
    const delta = parseInt(target.dataset.delta ?? "0", 10);
    const current = this.actor.system.fatepoints.current;
    const next = Math.max(0, current + delta);
    await this.actor.update({ "system.fatepoints.current": next });
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
}

// ─── Item Sheet ────────────────────────────────────────────────────────────

class FateItemSheet extends foundry.applications.sheets.ItemSheetV2 {
  static DEFAULT_OPTIONS = {
    classes: ["fate-core-ko", "sheet", "item"],
    position: { width: 480, height: 380 },
  };

  static PARTS = {
    sheet: { template: "systems/fate-core-ko/templates/item/item-sheet.hbs" },
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    return { ...context, item: this.item, system: this.item.system };
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

  const ladderKey   = CONFIG.FATE.ladder[total] ?? CONFIG.FATE.ladder[Math.max(-4, Math.min(8, total))];
  const ladderLabel = ladderKey ? game.i18n.localize(ladderKey) : String(total);

  const content = await renderTemplate(
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
  // FateDie 등록
  CONFIG.Dice.terms["F"] = FateDie;

  // 페이트 사다리
  CONFIG.FATE = {
    ladder: {
      8: "FATE.Ladder.8",  7: "FATE.Ladder.7", 6: "FATE.Ladder.6",
      5: "FATE.Ladder.5",  4: "FATE.Ladder.4", 3: "FATE.Ladder.3",
      2: "FATE.Ladder.2",  1: "FATE.Ladder.1", 0: "FATE.Ladder.0",
      [-1]: "FATE.Ladder.-1", [-2]: "FATE.Ladder.-2",
      [-3]: "FATE.Ladder.-3", [-4]: "FATE.Ladder.-4",
    },
  };

  // each_times Handlebars 헬퍼 — {{#each_times N as |i|}} (0-based)
  Handlebars.registerHelper("each_times", function(n, options) {
    let result = "";
    for (let i = 0; i < n; i++) result += options.fn(i);
    return result;
  });

  // 시트 등록
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
