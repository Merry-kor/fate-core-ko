/**
 * fate-core-ko - Fate Core Korean Edition for FoundryVTT v13
 */

// ─── Actor Sheet ───────────────────────────────────────────────────────────

class FateCharacterSheet extends foundry.appv2.sheets.ActorSheetV2 {
  static DEFAULT_OPTIONS = {
    classes: ["fate-core-ko", "sheet", "actor", "character"],
    position: { width: 780, height: 680 },
    actions: {
      rollSkill: FateCharacterSheet.#onRollSkill,
      addItem: FateCharacterSheet.#onAddItem,
      deleteItem: FateCharacterSheet.#onDeleteItem,
      editItem: FateCharacterSheet.#onEditItem,
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
      aspects: items.filter(i => i.type === "aspect"),
      skills: items.filter(i => i.type === "skill").sort((a, b) => b.system.rank - a.system.rank),
      stunts: items.filter(i => i.type === "stunt"),
      stressTracks: items.filter(i => i.type === "stress"),
      consequences: items.filter(i => i.type === "consequence"),
      extras: items.filter(i => i.type === "extra"),
      ladder: CONFIG.FATE.ladder,
    };
  }

  static async #onRollSkill(event, target) {
    const itemId = target.closest("[data-item-id]").dataset.itemId;
    const item = this.actor.items.get(itemId);
    if (!item) return;
    await rollFate(this.actor, item);
  }

  static async #onAddItem(event, target) {
    const type = target.dataset.type;
    await this.actor.createEmbeddedDocuments("Item", [{ name: game.i18n.localize(`FATE.Item.${capitalize(type)}.Label`), type }]);
  }

  static async #onDeleteItem(event, target) {
    const itemId = target.closest("[data-item-id]").dataset.itemId;
    const item = this.actor.items.get(itemId);
    if (!item) return;
    const confirmed = await foundry.applications.api.DialogV2.confirm({
      content: game.i18n.localize("FATE.Dialog.DeleteItemText"),
      yes: { label: game.i18n.localize("FATE.Dialog.Confirm") },
      no: { label: game.i18n.localize("FATE.Dialog.Cancel") },
    });
    if (confirmed) item.delete();
  }

  static async #onEditItem(event, target) {
    const itemId = target.closest("[data-item-id]").dataset.itemId;
    this.actor.items.get(itemId)?.sheet.render(true);
  }
}

// ─── Item Sheet ────────────────────────────────────────────────────────────

class FateItemSheet extends foundry.appv2.sheets.ItemSheetV2 {
  static DEFAULT_OPTIONS = {
    classes: ["fate-core-ko", "sheet", "item"],
    position: { width: 480, height: 360 },
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

  const rank = skillItem?.system.rank ?? 0;
  const total = roll.total + rank;
  const outcome = getFateOutcome(total);

  const diceResults = roll.dice[0].results.map(r => {
    if (r.result === 1) return '<span class="fate-die fate-die--plus">+</span>';
    if (r.result === -1) return '<span class="fate-die fate-die--minus">−</span>';
    return '<span class="fate-die fate-die--blank">□</span>';
  }).join("");

  const ladderLabel = CONFIG.FATE.ladder[total] ?? total;
  const skillName = skillItem?.name ?? "";

  const content = await renderTemplate("systems/fate-core-ko/templates/chat/roll-card.hbs", {
    actor,
    skillName,
    rank,
    diceHtml: diceResults,
    diceTotal: roll.total,
    total,
    ladderLabel,
    outcome: game.i18n.localize(`FATE.Roll.Outcome.${outcome}`),
    outcomeClass: outcome.toLowerCase().replace(/\s/g, "-"),
  });

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

// ─── CONFIG & Init ────────────────────────────────────────────────────────

Hooks.once("init", () => {
  CONFIG.FATE = {
    ladder: {
      8: "FATE.Ladder.8", 7: "FATE.Ladder.7", 6: "FATE.Ladder.6",
      5: "FATE.Ladder.5", 4: "FATE.Ladder.4", 3: "FATE.Ladder.3",
      2: "FATE.Ladder.2", 1: "FATE.Ladder.1", 0: "FATE.Ladder.0",
      [-1]: "FATE.Ladder.-1", [-2]: "FATE.Ladder.-2",
      [-3]: "FATE.Ladder.-3", [-4]: "FATE.Ladder.-4",
    },
  };

  // Register dF die term
  CONFIG.Dice.terms["F"] = Die.fromResults;

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

// Register dF (Fate) dice
Hooks.once("init", () => {
  class FateDie extends Die {
    constructor(termData) {
      super({ ...termData, faces: 3 });
    }
    static DENOMINATION = "F";
    get expression() { return `${this.number}dF`; }
    roll({ minimize = false, maximize = false } = {}) {
      const result = { result: minimize ? 1 : maximize ? 3 : Math.ceil(CONFIG.Dice.randomUniform() * 3), active: true };
      this.results.push(result);
      return result;
    }
    getResultLabel(result) {
      return { 1: "-", 2: "0", 3: "+" }[result.result] ?? "0";
    }
    get total() {
      return this.results.reduce((t, r) => {
        if (!r.active) return t;
        return t + (r.result === 1 ? -1 : r.result === 3 ? 1 : 0);
      }, 0);
    }
  }
  CONFIG.Dice.terms["F"] = FateDie;
});
