/* ════════════════════════════════════════════════════════════
   시공열차 — Fate  ·  시스템 본체
   데이터 모델 + 도시에(DOSSIER) 시트 + 4dF 판정(한글 사다리)
   ════════════════════════════════════════════════════════════ */

const F = () => foundry.data.fields;

/* 기본 스킬 18종 (Fate Core 표준, 한글) — 설정에서 수정 가능 */
const DEFAULT_SKILLS = [
  "운동", "절도", "인맥", "기술", "사기", "운전", "공감", "격투", "탐사",
  "학식", "인지", "신체", "도발", "교섭", "자원", "사격", "잠입", "의지",
];

/* 사다리 (한글) */
const LADDER = {
  8: "전설적", 7: "경이적", 6: "환상적", 5: "탁월함", 4: "대단함",
  3: "훌륭함", 2: "양호함", 1: "평균", 0: "보통", "-1": "부족함", "-2": "끔찍함",
};
const ladderLabel = (n) => {
  const c = Math.max(-2, Math.min(8, n));
  return `${LADDER[c]}${n > 8 ? "+" : ""} (${n >= 0 ? "+" : ""}${n})`;
};

/* 설정의 스킬 목록 읽기 (쉼표 구분) */
function configuredSkills() {
  try {
    const raw = game.settings.get("shigong-fate", "skillList");
    const list = raw.split(",").map((s) => s.trim()).filter(Boolean);
    return list.length ? list : DEFAULT_SKILLS;
  } catch {
    return DEFAULT_SKILLS;
  }
}

/* ── 데이터 모델 ─────────────────────────────────────────── */
class ShigongActorModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const f = F();
    const aspect = () =>
      new f.SchemaField({
        label: new f.StringField({ required: true, initial: "양상" }),
        value: new f.StringField({ required: true, initial: "" }),
      });
    return {
      aspects: new f.ArrayField(aspect(), {
        initial: [
          { label: "상위개념", value: "" },
          { label: "트러블", value: "" },
          { label: "양상", value: "" },
        ],
      }),
      skills: new f.ArrayField(
        new f.SchemaField({
          name: new f.StringField({ required: true, initial: "" }),
          rank: new f.NumberField({ required: true, initial: 0, integer: true }),
        }),
        { initial: [] } /* 기본 목록 없음 — 직접 추가 */
      ),
      activeAspects: new f.ArrayField(
        new f.SchemaField({ value: new f.StringField({ required: true, initial: "" }) }),
        { initial: [] }
      ),
      tags: new f.ArrayField(new f.StringField({ required: true, initial: "" }), {
        initial: ["승객"],
      }),
      gender: new f.StringField({ required: true, initial: "" }),
      age: new f.StringField({ required: true, initial: "" }),
      fate: new f.SchemaField({
        value: new f.NumberField({ required: true, initial: 3, integer: true, min: 0 }),
        refresh: new f.NumberField({ required: true, initial: 3, integer: true, min: 0 }),
      }),
      stress: new f.SchemaField({
        physical: new f.ArrayField(new f.BooleanField(), { initial: [false, false, false] }),
        mental: new f.ArrayField(new f.BooleanField(), { initial: [false, false, false] }),
      }),
      consequences: new f.SchemaField({
        mild: new f.StringField({ required: true, initial: "" }),
        moderate: new f.StringField({ required: true, initial: "" }),
        severe: new f.StringField({ required: true, initial: "" }),
      }),
      affiliation: new f.StringField({ required: true, initial: "승객" }),
      ticket: new f.StringField({ required: true, initial: "" }),
      lore: new f.HTMLField({ required: true, initial: "" }),
    };
  }
}

class StuntModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const f = F();
    return {
      description: new f.HTMLField({ required: true, initial: "" }),
      skill: new f.StringField({ required: true, initial: "" }),
      bonus: new f.NumberField({ required: true, initial: 0, integer: true }),
      cost: new f.StringField({ required: true, initial: "" }),
    };
  }
}

/* ── 4dF 판정 ────────────────────────────────────────────── */
async function rollSkill(actor, name, rank) {
  const r = new Roll(rank ? `4df + ${rank}` : "4df");
  await r.evaluate();
  await r.toMessage({
    speaker: ChatMessage.getSpeaker({ actor }),
    flavor: `<span class="sg-roll-flavor">${name} 판정 — ${ladderLabel(r.total)}</span>`,
  });
}

/* ── 승객/괴이 시트 ──────────────────────────────────────── */
const { HandlebarsApplicationMixin } = foundry.applications.api;

class ShigongActorSheet extends HandlebarsApplicationMixin(foundry.applications.sheets.ActorSheetV2) {
  static DEFAULT_OPTIONS = {
    tag: "form",
    classes: ["shigong-sheet"],
    position: { width: 840, height: 800 },
    window: { icon: "fas fa-train", resizable: true },
    form: { submitOnChange: true, closeOnSubmit: false },
    actions: {
      editImage: ShigongActorSheet._onEditImage,
      rollSkill: ShigongActorSheet._onRollSkill,
      addAspect: ShigongActorSheet._onAddAspect,
      delAspect: ShigongActorSheet._onDelAspect,
      addSkill: ShigongActorSheet._onAddSkill,
      delSkill: ShigongActorSheet._onDelSkill,
      toggleStress: ShigongActorSheet._onToggleStress,
      stressBoxes: ShigongActorSheet._onStressBoxes,
      addStunt: ShigongActorSheet._onAddStunt,
      editStunt: ShigongActorSheet._onEditStunt,
      delStunt: ShigongActorSheet._onDelStunt,
      postStunt: ShigongActorSheet._onPostStunt,
      spendFate: ShigongActorSheet._onSpendFate,
      gainFate: ShigongActorSheet._onGainFate,
      toggleSkillEdit: ShigongActorSheet._onToggleSkillEdit,
      addTag: ShigongActorSheet._onAddTag,
      delTag: ShigongActorSheet._onDelTag,
      addActive: ShigongActorSheet._onAddActive,
      delActive: ShigongActorSheet._onDelActive,
    },
  };

  /* 스킬 편집 모드 (재렌더 후에도 유지) */
  _editSkills = false;

  static PARTS = {
    body: {
      template: "systems/shigong-fate/templates/actor-sheet.hbs",
      scrollable: [".sg-body"],
    },
  };

  get title() {
    return `${this.actor.type === "entity" ? "괴이 기록" : "인물 기록"} — ${this.actor.name}`;
  }

  async _prepareContext(options) {
    const ctx = await super._prepareContext(options);
    const sys = this.actor.system;
    ctx.actor = this.actor;
    ctx.system = sys;
    ctx.isEntity = this.actor.type === "entity";
    ctx.skills = sys.skills.map((s, i) => ({
      ...s,
      index: i,
      pips: [0, 1, 2, 3, 4].map((p) => p < Math.min(s.rank, 5)),
    }));
    ctx.stunts = this.actor.items.filter((i) => i.type === "stunt");
    ctx.editSkills = this._editSkills;

    /* 스킬 피라미드: 등급별 그룹 (높은 순) */
    const LADDER_ROW = { 0: "보통", 1: "평범함", 2: "좋음", 3: "훌륭함", 4: "대단함", 5: "탁월함", 6: "환상적", 7: "경이적", 8: "전설적" };
    const byRank = {};
    sys.skills.forEach((s, i) => {
      const r = Number(s.rank) || 0;
      if (r < 0 || !s.name) return; /* 0등급도 표시 */
      (byRank[r] ??= []).push({ name: s.name, index: i });
    });
    ctx.pyramid = Object.keys(byRank)
      .map(Number)
      .sort((a, b) => b - a)
      .map((r) => ({
        rank: r,
        ladder: LADDER_ROW[Math.min(r, 8)] ?? "초월",
        pips: [0, 1, 2, 3, 4].map((p) => p < Math.min(r, 5)),
        skills: byRank[r],
      }));

    /* 스트레스: 번호 포함 */
    ctx.stressP = sys.stress.physical.map((on, i) => ({ on, num: i + 1 }));
    ctx.stressM = sys.stress.mental.map((on, i) => ({ on, num: i + 1 }));

    /* 불씨 게이지 (테마 모듈이 있을 때만) */
    try {
      const st = game.settings.get("shigong-archive-theme", "trackerState");
      const max = game.settings.get("shigong-archive-theme", "emberMax");
      ctx.gauge = { value: st.ember ?? 0, max, pct: Math.max(0, Math.min(100, ((st.ember ?? 0) / max) * 100)) };
    } catch {
      ctx.gauge = null;
    }
    ctx.loreHTML = await foundry.applications.ux.TextEditor.implementation.enrichHTML(sys.lore, { secrets: this.actor.isOwner });
    return ctx;
  }

  /* 숫자 키 객체로 들어오는 배열 필드를 실제 배열로 복원 */
  _prepareSubmitData(event, form, formData, updateData) {
    const data = super._prepareSubmitData(event, form, formData, updateData);
    const sys = data.system ?? {};
    for (const k of ["aspects", "skills", "tags", "activeAspects"]) {
      if (sys[k] && !Array.isArray(sys[k])) sys[k] = Object.values(sys[k]);
    }
    return data;
  }

  static async _onAddTag() {
    await this.actor.update({ "system.tags": [...this.actor.system.tags, ""] });
  }
  static async _onDelTag(event, target) {
    const arr = this.actor.system.tags.filter((_, i) => i !== Number(target.dataset.index));
    await this.actor.update({ "system.tags": arr });
  }
  static async _onAddActive() {
    await this.actor.update({ "system.activeAspects": [...this.actor.system.activeAspects, { value: "" }] });
  }
  static async _onDelActive(event, target) {
    const arr = this.actor.system.activeAspects.filter((_, i) => i !== Number(target.dataset.index));
    await this.actor.update({ "system.activeAspects": arr });
  }

  static async _onToggleSkillEdit() {
    this._editSkills = !this._editSkills;
    this.render();
  }

  /* ── 액션들 ── */
  static async _onEditImage() {
    const FP = foundry.applications.apps.FilePicker.implementation;
    new FP({
      type: "image",
      current: this.actor.img,
      callback: (path) => this.actor.update({ img: path }),
    }).render(true);
  }

  static async _onRollSkill(event, target) {
    const i = Number(target.dataset.index);
    const s = this.actor.system.skills[i];
    if (s) rollSkill(this.actor, s.name || "이름 없는 기능", Number(s.rank) || 0);
  }

  static async _onAddAspect() {
    const arr = [...this.actor.system.aspects, { label: "양상", value: "" }];
    await this.actor.update({ "system.aspects": arr });
  }
  static async _onDelAspect(event, target) {
    const arr = this.actor.system.aspects.filter((_, i) => i !== Number(target.dataset.index));
    await this.actor.update({ "system.aspects": arr });
  }

  static async _onAddSkill() {
    const arr = [...this.actor.system.skills, { name: "", rank: 0 }];
    await this.actor.update({ "system.skills": arr });
  }
  static async _onDelSkill(event, target) {
    const arr = this.actor.system.skills.filter((_, i) => i !== Number(target.dataset.index));
    await this.actor.update({ "system.skills": arr });
  }

  static async _onToggleStress(event, target) {
    const { track, index } = target.dataset;
    const arr = [...this.actor.system.stress[track]];
    arr[Number(index)] = !arr[Number(index)];
    await this.actor.update({ [`system.stress.${track}`]: arr });
  }
  /* data-delta="+1" / "-1" 로 박스 수 조절 (GM/소유자) */
  static async _onStressBoxes(event, target) {
    const { track, delta } = target.dataset;
    const arr = [...this.actor.system.stress[track]];
    if (delta === "+1") arr.push(false);
    else if (arr.length > 1) arr.pop();
    await this.actor.update({ [`system.stress.${track}`]: arr });
  }

  static async _onAddStunt() {
    const [item] = await this.actor.createEmbeddedDocuments("Item", [
      { name: "새 스턴트", type: "stunt" },
    ]);
    item?.sheet.render(true);
  }
  static async _onEditStunt(event, target) {
    this.actor.items.get(target.dataset.id)?.sheet.render(true);
  }
  static async _onDelStunt(event, target) {
    await this.actor.deleteEmbeddedDocuments("Item", [target.dataset.id]);
  }
  static async _onPostStunt(event, target) {
    const it = this.actor.items.get(target.dataset.id);
    if (!it) return;
    const sys = it.system;
    const stats = [
      ["연계 기능", sys.skill], ["보정", sys.bonus ? `+${sys.bonus}` : ""], ["소모", sys.cost],
    ].filter(([, v]) => v);
    const html = `
      <div class="sg-card">
        <header><h3>${foundry.utils.escapeHTML(it.name)}</h3><span>스턴트 · STUNT</span></header>
        <div class="sg-card-desc">${sys.description ?? ""}</div>
        ${stats.length ? `<div class="sg-card-stats">${stats.map(([k, v]) => `<div><span>${k}</span><b>${v}</b></div>`).join("")}</div>` : ""}
      </div>`;
    ChatMessage.create({ content: html, speaker: ChatMessage.getSpeaker({ actor: this.actor }) });
  }

  static async _onSpendFate() {
    const v = Math.max(0, this.actor.system.fate.value - 1);
    await this.actor.update({ "system.fate.value": v });
  }
  static async _onGainFate() {
    await this.actor.update({ "system.fate.value": this.actor.system.fate.value + 1 });
  }
}

/* ── 스턴트 아이템 시트 ──────────────────────────────────── */
class StuntSheet extends HandlebarsApplicationMixin(foundry.applications.sheets.ItemSheetV2) {
  static DEFAULT_OPTIONS = {
    tag: "form",
    classes: ["shigong-sheet", "shigong-stunt"],
    position: { width: 420, height: "auto" },
    window: { icon: "fas fa-fire" },
    form: { submitOnChange: true, closeOnSubmit: false },
  };
  static PARTS = {
    body: { template: "systems/shigong-fate/templates/stunt-sheet.hbs" },
  };
  async _prepareContext(options) {
    const ctx = await super._prepareContext(options);
    ctx.item = this.item;
    ctx.system = this.item.system;
    return ctx;
  }
}

/* ── 등록 ────────────────────────────────────────────────── */
Hooks.once("init", () => {
  CONFIG.Actor.dataModels.passenger = ShigongActorModel;
  CONFIG.Actor.dataModels.entity = ShigongActorModel;
  CONFIG.Item.dataModels.stunt = StuntModel;

  CONFIG.Combat.initiative = { formula: "4df", decimals: 0 };

  const Actors = foundry.documents.collections.Actors;
  Actors.unregisterSheet("core", foundry.appv1.sheets.ActorSheet);
  Actors.registerSheet("shigong-fate", ShigongActorSheet, {
    types: ["passenger", "entity"], makeDefault: true, label: "시공열차 — 인물 기록",
  });

  const Items = foundry.documents.collections.Items;
  Items.unregisterSheet("core", foundry.appv1.sheets.ItemSheet);
  Items.registerSheet("shigong-fate", StuntSheet, {
    types: ["stunt"], makeDefault: true, label: "시공열차 — 스턴트",
  });

  game.settings.register("shigong-fate", "skillList", {
    name: "기본 스킬 목록",
    hint: "쉼표로 구분. 새 액터를 만들 때 이 목록으로 스킬이 채워집니다.",
    scope: "world", config: true, type: String,
    default: DEFAULT_SKILLS.join(", "),
  });
});

Hooks.once("ready", () => {
  console.log("시공열차 — Fate | 시스템 로드 완료");
});
