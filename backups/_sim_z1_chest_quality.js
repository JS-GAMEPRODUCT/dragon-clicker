"use strict";

/** Simulation locale des tables de rareté Zone 1 (sans charger le jeu). */

function getAdjustedChestRarityChances(baseWeights, teamPower, recommendedPower) {
  let draconic = Math.max(0, Number(baseWeights.draconic) || 0);
  let rare = Math.max(0, Number(baseWeights.rare) || 0);
  let epic = Math.max(0, Number(baseWeights.epic) || 0);
  const startSum = draconic + rare + epic;
  if (startSum <= 0) return { draconic: 100, rare: 0, epic: 0 };

  const rec = Math.max(1, Number(recommendedPower) || 1);
  const ratio = Math.min(2, Math.max(0, Number(teamPower) || 0) / rec);

  let rareDelta = 0;
  let epicDelta = 0;
  if (ratio < 0.75) { rareDelta = -5; epicDelta = -1; }
  else if (ratio < 1.00) { rareDelta = -2; epicDelta = -1; }
  else if (ratio < 1.25) { rareDelta = 0; epicDelta = 0; }
  else if (ratio < 1.50) { rareDelta = 3; epicDelta = 1; }
  else if (ratio < 2.00) { rareDelta = 6; epicDelta = 2; }
  else { rareDelta = 10; epicDelta = 4; }

  const newRare = Math.max(0, rare + rareDelta);
  const newEpic = Math.max(0, epic + epicDelta);
  const actualRareDelta = newRare - rare;
  const actualEpicDelta = newEpic - epic;
  rare = newRare;
  epic = newEpic;
  draconic = Math.max(0, draconic - (actualRareDelta + actualEpicDelta));

  let sum = draconic + rare + epic;
  if (sum <= 0) return { draconic: 100, rare: 0, epic: 0 };
  if (sum !== 100) {
    draconic = Math.round((draconic / sum) * 100);
    rare = Math.round((rare / sum) * 100);
    epic = Math.max(0, 100 - draconic - rare);
  }
  return { draconic, rare, epic };
}

function assertEq(label, got, expected) {
  const ok =
    got.draconic === expected.draconic &&
    got.rare === expected.rare &&
    got.epic === expected.epic;
  console.log((ok ? "OK  " : "FAIL") + " " + label, got, expected);
  if (!ok) process.exitCode = 1;
}

const ruins = { draconic: 85, rare: 14, epic: 1 };
const valley = { draconic: 70, rare: 27, epic: 3 };
const temple = { draconic: 50, rare: 42, epic: 8 };
const rec = 500;

assertEq("Ruines 50%", getAdjustedChestRarityChances(ruins, 250, rec), { draconic: 91, rare: 9, epic: 0 });
assertEq("Ruines 100%", getAdjustedChestRarityChances(ruins, 500, rec), { draconic: 85, rare: 14, epic: 1 });
assertEq("Ruines 150%", getAdjustedChestRarityChances(ruins, 750, rec), { draconic: 77, rare: 20, epic: 3 });
assertEq("Ruines 200%", getAdjustedChestRarityChances(ruins, 1000, rec), { draconic: 71, rare: 24, epic: 5 });
assertEq("Ruines 500%", getAdjustedChestRarityChances(ruins, 2500, rec), { draconic: 71, rare: 24, epic: 5 });
assertEq("Sanctuaire 200%", getAdjustedChestRarityChances(temple, 20000, 10000), { draconic: 36, rare: 52, epic: 12 });
assertEq("Vallée 200%", getAdjustedChestRarityChances(valley, 5000, 2500), { draconic: 56, rare: 37, epic: 7 });

/* Monte Carlo drop rate ~65% for ruins */
let drops = 0;
const N = 10000;
for (let i = 0; i < N; i++) if (Math.random() < 0.65) drops++;
const pct = (drops / N) * 100;
console.log("Ruines drop ~" + pct.toFixed(2) + "% (attendu ~65%)");
if (Math.abs(pct - 65) > 2) process.exitCode = 1;

console.log(process.exitCode ? "SOME TESTS FAILED" : "ALL TESTS PASSED");
