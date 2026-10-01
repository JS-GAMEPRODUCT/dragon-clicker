"use strict";
const fs = require("fs");
const vm = require("vm");

const ctx = {
  console,
  Math,
  Object,
  Array,
  Number,
  String,
  Boolean,
  JSON,
  parseInt,
  parseFloat,
  isNaN,
  Infinity,
  undefined
};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync("js/data/dragons.js", "utf8"), ctx);

const { DRAGON_DEFS, EGG_DEFS } = ctx;
const byId = Object.fromEntries(DRAGON_DEFS.map((d) => [d.id, d]));

const RARITY_DROP_WEIGHTS = {
  common: 64,
  rare: 25,
  epic: 9,
  legendary: 1.75,
  mythic: 0.25
};

function buildPool(eggId) {
  const egg = EGG_DEFS.find((e) => e.id === eggId);
  const base = egg.dragonPool.filter((e) => {
    const d = byId[e.dragonId];
    return d && (!d.eggId || d.eggId === eggId);
  });
  const buckets = {};
  base.forEach((e) => {
    const rar = byId[e.dragonId].rarity;
    if (!buckets[rar]) buckets[rar] = [];
    buckets[rar].push(e.dragonId);
  });
  const out = [];
  Object.keys(buckets).forEach((rar) => {
    const w = RARITY_DROP_WEIGHTS[rar];
    if (!(w > 0)) return;
    const share = w / buckets[rar].length;
    buckets[rar].forEach((id) => out.push({ dragonId: id, weight: share, rarity: rar }));
  });
  return out;
}

function simulate(eggId, n) {
  const pool = buildPool(eggId);
  const total = pool.reduce((s, e) => s + e.weight, 0);
  const rarCounts = { common: 0, rare: 0, epic: 0, legendary: 0, mythic: 0 };
  const idCounts = {};
  let wrong = 0;
  for (let i = 0; i < n; i++) {
    let r = Math.random() * total;
    let pick = pool[pool.length - 1];
    for (const e of pool) {
      r -= e.weight;
      if (r <= 0) {
        pick = e;
        break;
      }
    }
    if (byId[pick.dragonId].eggId !== eggId) wrong++;
    rarCounts[pick.rarity]++;
    idCounts[pick.dragonId] = (idCounts[pick.dragonId] || 0) + 1;
  }
  const pct = {};
  Object.keys(rarCounts).forEach((k) => {
    pct[k] = +(100 * rarCounts[k] / n).toFixed(3);
  });
  const perDragon = {};
  Object.keys(idCounts).forEach((id) => {
    perDragon[id] = +(100 * idCounts[id] / n).toFixed(3);
  });
  return {
    eggId,
    poolSize: pool.length,
    pct,
    perDragon,
    wrong,
    mythics: Object.keys(idCounts).filter((id) => byId[id].rarity === "mythic")
      .map((id) => ({ id, pct: perDragon[id] }))
  };
}

console.log("Zone1 dragons:", EGG_DEFS.find((e) => e.id === "basic").dragonPool.map((e) => e.dragonId));
console.log(JSON.stringify(simulate("basic", 100000), null, 2));
console.log(JSON.stringify(simulate("plant", 100000), null, 2));
console.log(JSON.stringify(simulate("cascade", 100000), null, 2));