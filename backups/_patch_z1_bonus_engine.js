"use strict";
const fs = require("fs");
const path = "js/game.js";
let s = fs.readFileSync(path, "utf8");
let n = 0;

function replaceOnce(oldStr, newStr, label) {
  if (!s.includes(oldStr)) {
    console.log("MISSING", label);
    return;
  }
  s = s.replace(oldStr, newStr);
  n++;
  console.log("OK", label);
}

replaceOnce(
  `      const m = {
        clickFlat: 0,
        clickPct: 0,
        click: 1,
        globalProduction: 1,`,
  `      const m = {
        clickFlat: 0,
        clickPct: 0,
        clickEssencePct: 0,
        click: 1,
        globalProduction: 1,`,
  "init-clickEssencePct"
);

replaceOnce(
  `      if (!Number.isFinite(m.rarityLuck) || m.rarityLuck < 0) m.rarityLuck = 0;
      if (!Number.isFinite(m.duplicateFragmentChance) || m.duplicateFragmentChance < 0) {`,
  `      if (!Number.isFinite(m.rarityLuck) || m.rarityLuck < 0) m.rarityLuck = 0;
      if (!Number.isFinite(m.clickEssencePct) || m.clickEssencePct < 0) m.clickEssencePct = 0;
      if (!Number.isFinite(m.duplicateFragmentChance) || m.duplicateFragmentChance < 0) {`,
  "clamp-clickEssencePct"
);

replaceOnce(
  `    function getTeamBonusTotals() {
      const totals = {};
      for (let i = 0; i < TEAM_SIZE; i++) {
        const d = getTeamDragon(i);
        if (!d || !d.def.bonus) continue;
        if (isDragonOnExpedition(d.def.id)) continue;
        const active = getDragonActiveBonus(d.def, d.stars);
        if (!active || active.value <= 0) continue;
        totals[active.type] = (totals[active.type] || 0) + active.value;
      }
      return totals;
    }`,
  `    function getTeamBonusTotals() {
      const totals = {};
      for (let i = 0; i < TEAM_SIZE; i++) {
        const d = getTeamDragon(i);
        if (!d || !getDragonBonusDefs(d.def).length) continue;
        if (isDragonOnExpedition(d.def.id)) continue;
        getDragonBonusDefs(d.def).forEach((bonusEntry) => {
          const value = getDragonBonusEntryValue(bonusEntry, d.stars);
          if (value <= 0) return;
          const t = normalizeDragonBonusType(bonusEntry.type);
          totals[t] = (totals[t] || 0) + value;
        });
      }
      return totals;
    }`,
  "team-bonus-totals"
);

fs.writeFileSync(path, s);
console.log("patched", n);