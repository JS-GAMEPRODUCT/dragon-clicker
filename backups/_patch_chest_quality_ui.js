"use strict";
const fs = require("fs");
const p = "js/game.js";
let s = fs.readFileSync(p, "utf8");
const old = [
  '      const teamPower = calculateExpeditionTeamPower(expeditionUi.selectedDragons);',
  '      const chance = calculateSuccessChance(teamPower, def.recommendedPower);',
  '      const stats = document.createElement("div");',
  '      stats.className = "expedition-stats";',
  '      stats.innerHTML =',
  '        \'<div><span>Puissance envoyée</span><strong></strong></div>\' +',
  '        \'<div><span>Puissance recommandée</span><strong></strong></div>\' +',
  '        \'<div><span>Chance de réussite</span><strong></strong></div>\';',
  '      const strongs = stats.querySelectorAll("strong");',
  '      strongs[0].textContent = formatNumber(teamPower);',
  '      strongs[1].textContent = formatNumber(def.recommendedPower);',
  '      strongs[2].textContent = Math.round(chance * 100) + " %";',
  '      wrap.appendChild(stats);'
].join("\n");
const neu = [
  '      const teamPower = calculateExpeditionTeamPower(expeditionUi.selectedDragons);',
  '      const chance = calculateSuccessChance(teamPower, def.recommendedPower);',
  '      const chestQuality = getChestQualityLabel(teamPower, def.recommendedPower);',
  '      const stats = document.createElement("div");',
  '      stats.className = "expedition-stats";',
  '      stats.innerHTML =',
  '        \'<div><span>Puissance envoyée</span><strong></strong></div>\' +',
  '        \'<div><span>Puissance recommandée</span><strong></strong></div>\' +',
  '        \'<div><span>Chance de réussite</span><strong></strong></div>\' +',
  '        \'<div class="expedition-chest-quality"><span>Qualité des coffres</span><strong></strong></div>\';',
  '      const strongs = stats.querySelectorAll("strong");',
  '      strongs[0].textContent = formatNumber(teamPower);',
  '      strongs[1].textContent = formatNumber(def.recommendedPower);',
  '      strongs[2].textContent = Math.round(chance * 100) + " %";',
  '      strongs[3].textContent = chestQuality;',
  '      wrap.appendChild(stats);'
].join("\n");
if (!s.includes(old)) {
  console.error("OLD NOT FOUND");
  process.exit(1);
}
s = s.replace(old, neu);
fs.writeFileSync(p, s);
console.log("patched prepare view");
