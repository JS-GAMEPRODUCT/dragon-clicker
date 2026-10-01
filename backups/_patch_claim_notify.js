"use strict";
const fs = require("fs");
const p = "js/game.js";
let s = fs.readFileSync(p, "utf8");
const old = [
  '      const def = getExpeditionDef(run.expeditionId);',
  '      showNotification(',
  '        "🧭 Récompenses récupérées",',
  '        (def ? def.name + " — " : "") + "+" + formatNumber(result.power + (result.rarePower || 0)) + " ✨"',
  '      );'
].join("\n");
const neu = [
  '      const def = getExpeditionDef(run.expeditionId);',
  '      const claimBits = describeExpeditionRewardLines(result).slice(0, 3);',
  '      showNotification(',
  '        "🧭 Expédition terminée",',
  '        (def ? def.name + " — " : "") + (claimBits.length ? claimBits.join(" · ") : "Récompenses récupérées")',
  '      );'
].join("\n");
if (!s.includes(old)) {
  console.error("claim notify OLD NOT FOUND");
  process.exit(1);
}
fs.writeFileSync(p, s.replace(old, neu));
console.log("patched claim notify");
