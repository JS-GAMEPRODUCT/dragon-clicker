"use strict";
const fs = require("fs");
const vm = require("vm");
const ctx = { console };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync("js/data/dragons.js", "utf8"), ctx);
const { DRAGON_DEFS, EGG_DEFS } = ctx;
const byId = Object.fromEntries(DRAGON_DEFS.map((d) => [d.id, d]));

function simulate(eggId, n) {
  const egg = EGG_DEFS.find((e) => e.id === eggId);
  const pool = egg.dragonPool;
  const total = pool.reduce((s, e) => s + e.weight, 0);
  const rarCounts = { common: 0, rare: 0, epic: 0, legendary: 0, mythic: 0 };
  let wrong = 0;
  for (let i = 0; i < n; i++) {
    let r = Math.random() * total;
    let id = pool[pool.length - 1].dragonId;
    for (const e of pool) {
      r -= e.weight;
      if (r <= 0) {
        id = e.dragonId;
        break;
      }
    }
    if (byId[id].eggId !== eggId) wrong++;
    rarCounts[byId[id].rarity]++;
  }
  const expectedWeights = {};
  for (const e of pool) {
    const rar = byId[e.dragonId].rarity;
    expectedWeights[rar] = (expectedWeights[rar] || 0) + e.weight;
  }
  const pct = {};
  const expected = {};
  for (const k of Object.keys(rarCounts)) {
    pct[k] = +(100 * rarCounts[k] / n).toFixed(3);
    if (expectedWeights[k]) expected[k] = +(100 * expectedWeights[k] / total).toFixed(3);
  }
  return { eggId, total, pct, expected, wrong, n };
}

const N = 100000;
for (const id of ["basic", "plant", "cascade"]) {
  console.log(JSON.stringify(simulate(id, N), null, 2));
}