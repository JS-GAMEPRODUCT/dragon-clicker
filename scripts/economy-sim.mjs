/**
 * Local economy simulator for Dragon Clicker Z1–Z3.
 * Run: node scripts/economy-sim.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import vm from "vm";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function loadData() {
  const code = fs.readFileSync(path.join(root, "js/data/upgrades.js"), "utf8")
    + "\n" + fs.readFileSync(path.join(root, "js/data/zones.js"), "utf8")
    + "\n;({ PRODUCER_DEFS, SHOP_PASSIVE_DEFS, LEVEL_PASSIVE_DEFS, SPECIAL_UPGRADE_DEFS, ACTIVE_UPGRADE_DEFS, ZONE_DEFS });";
  return vm.runInNewContext(code, Object.create(null), { timeout: 5000 });
}

const BASE_CLICK = 1;
const CRIT_BASE = 0.02;
const CRIT_MULT_BASE = 10;
const CRIT_CAP = 0.22;
const CRIT_MULT_CAP = 22;

const sumGeom = (base, growth, n) => {
  if (n <= 0) return 0;
  let t = 0;
  for (let i = 0; i < n; i++) t += Math.max(1, Math.round(base * Math.pow(growth, i)));
  return t;
};

const data = loadData();
const { PRODUCER_DEFS, SHOP_PASSIVE_DEFS, LEVEL_PASSIVE_DEFS, SPECIAL_UPGRADE_DEFS, ACTIVE_UPGRADE_DEFS, ZONE_DEFS } = data;

function totalProducer(zoneId) {
  return PRODUCER_DEFS.filter((p) => p.zoneId === zoneId).map((p) => ({
    id: p.id, name: p.name, baseCost: p.baseCost, costGrowth: p.costGrowth,
    maxLevel: p.maxLevel, prodPer: p.productionPerLevel, maxProd: p.maxProduction,
    total: sumGeom(p.baseCost, p.costGrowth, p.maxLevel)
  }));
}

function totalActive(zoneId) {
  return ACTIVE_UPGRADE_DEFS.filter((u) => u.zoneId === zoneId).map((u) => {
    let total = Array.isArray(u.costs) && u.costs.length
      ? u.costs.reduce((a, b) => a + b, 0)
      : sumGeom(u.baseCost, u.costGrowth || 1.25, u.maxLevel);
    return { id: u.id, name: u.name, baseCost: u.baseCost, costGrowth: u.costGrowth, maxLevel: u.maxLevel, costs: u.costs || null, total };
  });
}

function zoneShopExtras(zoneId) {
  const passives = SHOP_PASSIVE_DEFS.filter((p) => p.zoneId === zoneId);
  const specials = SPECIAL_UPGRADE_DEFS.filter((s) => s.zoneId === zoneId && !s.hideFromShop);
  const levels = LEVEL_PASSIVE_DEFS.filter((l) => l.zoneId === zoneId);
  return {
    passives, specials, levels,
    passiveTotal: passives.reduce((a, p) => a + p.cost, 0),
    specialTotal: specials.reduce((a, s) => a + s.cost, 0),
    levelTotal: levels.reduce((a, l) => a + (l.costs || []).reduce((x, y) => x + y, 0), 0)
  };
}

function auditZone(zoneId) {
  const boutique = totalProducer(zoneId);
  const upgrades = totalActive(zoneId);
  const extras = zoneShopExtras(zoneId);
  const boutiqueTotal = boutique.reduce((a, p) => a + p.total, 0);
  const upgradesTotal = upgrades.reduce((a, u) => a + u.total, 0);
  const zone = ZONE_DEFS.find((z) => z.id === zoneId);
  const spentReq = (zone.unlockRequirements || []).find((r) => r.type === "zoneSpent");
  return {
    zoneId, boutique, upgrades, extras, boutiqueTotal, upgradesTotal,
    coreTotal: boutiqueTotal + upgradesTotal,
    fullTotal: boutiqueTotal + upgradesTotal + extras.passiveTotal + extras.specialTotal + extras.levelTotal,
    unlockCost: zone ? zone.unlockCost : 0,
    spentGate: spentReq ? spentReq.value : null,
    spentGateZone: spentReq ? spentReq.zoneId : null
  };
}

function noviceClaws(level) {
  return Math.max(0, Math.min(15, level)) * 0.4;
}
function tableVal(values, level) {
  if (!values || level <= 0) return 0;
  return values[Math.min(level, values.length) - 1] || 0;
}

/**
 * Simule une zone avec joueur "raisonnable" :
 * - revenu clic (crit + charged) + passif
 * - achète le meilleur rapport gain/coût parmi les achats ≤ ~35s de revenu
 * - sinon attend / achète le moins cher si ≤ ~90s
 */
function simulateZone(opts) {
  const {
    zoneId, cps, gateSpent = null, unlockCost = 0,
    inherit = null, includeTwin = true, maxMinutes = 240, stopAtUnlock = false
  } = opts;

  const producers = PRODUCER_DEFS.filter((p) => p.zoneId === zoneId);
  const actives = ACTIVE_UPGRADE_DEFS.filter((u) => u.zoneId === zoneId);
  const specials = SPECIAL_UPGRADE_DEFS.filter((s) => s.zoneId === zoneId && !s.hideFromShop);
  const shopPass = SHOP_PASSIVE_DEFS.filter((p) => p.zoneId === zoneId);

  const levels = {
    prod: Object.fromEntries(producers.map((p) => [p.id, 0])),
    act: Object.fromEntries(actives.map((u) => [u.id, 0])),
    spec: Object.fromEntries(specials.map((s) => [s.id, false])),
    shop: Object.fromEntries(shopPass.map((s) => [s.id, false]))
  };

  let essence = inherit ? inherit.essence : 0;
  let zoneSpent = 0;

  // Inherited combat (previous zones only — local levels added in stats())
  const base = {
    clickFlat: inherit ? inherit.clickFlat : 0,
    clickPct: inherit ? inherit.clickPct : 0,
    critChance: inherit ? inherit.critChance : CRIT_BASE,
    critMult: inherit ? inherit.critMult : CRIT_MULT_BASE,
    globalProd: inherit ? inherit.globalProd : 1,
    chargedEvery: inherit ? inherit.chargedEvery : 0,
    chargedMult: inherit ? inherit.chargedMult : 1,
    priorProd: inherit ? inherit.priorProd : 0,
    producerCostMult: inherit ? inherit.producerCostMult : 1
  };

  function totalCore() {
    let t = 0;
    producers.forEach((p) => { t += sumGeom(p.baseCost, p.costGrowth, p.maxLevel); });
    actives.forEach((u) => {
      if (!includeTwin && u.bonusType === "twinHatchChance") return;
      t += u.costs ? u.costs.reduce((a, b) => a + b, 0) : sumGeom(u.baseCost, u.costGrowth || 1.25, u.maxLevel);
    });
    // specials/shop buyables only (skip dragon/egg gated)
    specials.forEach((s) => {
      if (s.unlock && (s.unlock.type === "zoneDragons" || s.unlock.type === "eggsHatched")) return;
      t += s.cost;
    });
    shopPass.forEach((s) => { t += s.cost; });
    return t;
  }
  const totalCostCore = totalCore();

  function stats() {
    let clickFlat = base.clickFlat;
    let clickPct = base.clickPct;
    let critChance = base.critChance;
    let critMult = base.critMult;
    let globalProd = base.globalProd;
    let chargedEvery = base.chargedEvery;
    let chargedMult = base.chargedMult;
    let pcm = base.producerCostMult;

    actives.forEach((u) => {
      const lvl = levels.act[u.id];
      if (lvl <= 0) return;
      if (u.family === "claws" && u.bonusType !== "clickPowerFlat") clickFlat += noviceClaws(lvl);
      if (u.bonusType === "clickPowerFlat") clickFlat += tableVal(u.bonusValues, lvl);
      if (u.bonusType === "critChanceFlat") critChance += tableVal(u.bonusValues, lvl);
      else if (u.critChance) critChance += u.critChance * lvl;
      if (u.bonusType === "critMultiplierFlat") critMult += tableVal(u.bonusValues, lvl);
      else if (u.critMult) critMult += u.critMult * lvl;
      if (u.bonusType === "chargedStrike") {
        chargedEvery = u.triggerClicks[Math.min(lvl, u.triggerClicks.length) - 1];
        chargedMult = u.multiplier || 2;
      }
      if (u.bonusType === "globalProdPct") globalProd *= 1 + tableVal(u.bonusValues, lvl) / 100;
    });
    specials.forEach((s) => {
      if (!levels.spec[s.id] || !s.effect) return;
      const e = s.effect;
      if (e.type === "critChance") critChance += e.value;
      if (e.type === "globalProdPct") globalProd *= 1 + e.value;
      if (e.type === "heritage") { clickPct += e.clickPct || 0; globalProd *= 1 + (e.prodPct || 0); }
      if (e.type === "producerCostMult") pcm *= e.value;
    });
    shopPass.forEach((s) => {
      if (!levels.shop[s.id]) return;
      if (s.effect?.type === "producerCostMult") pcm *= s.effect.value;
    });

    critChance = Math.min(CRIT_CAP, Math.max(0, critChance));
    critMult = Math.min(CRIT_MULT_CAP, Math.max(1, critMult));
    const ppc = (BASE_CLICK + clickFlat) * (1 + clickPct);
    let zoneProd = 0;
    producers.forEach((p) => { zoneProd += (p.productionPerLevel || 0) * levels.prod[p.id]; });
    const essPerSec = (zoneProd + base.priorProd) * globalProd;
    const chargedFactor = (chargedEvery > 0 && chargedMult > 1) ? (1 + (chargedMult - 1) / chargedEvery) : 1;
    const essPerClick = ppc * ((1 - critChance) + critChance * critMult) * chargedFactor;
    const incomePerSec = essPerSec + essPerClick * cps;
    return { ppc, essPerSec, essPerClick, incomePerSec, clickFlat, clickPct, critChance, critMult, globalProd, pcm, chargedEvery, chargedMult };
  }

  function costProducer(p) {
    const owned = levels.prod[p.id];
    if (owned >= p.maxLevel) return Infinity;
    const pcm = stats().pcm;
    return Math.max(1, Math.round(Math.round(p.baseCost * Math.pow(p.costGrowth, owned)) * pcm));
  }
  function costActive(u) {
    const lvl = levels.act[u.id];
    if (lvl >= u.maxLevel) return Infinity;
    if (!includeTwin && u.bonusType === "twinHatchChance") return Infinity;
    if (u.costs) return lvl < u.costs.length ? u.costs[lvl] : Infinity;
    return Math.max(1, Math.round(u.baseCost * Math.pow(u.costGrowth || 1.25, lvl)));
  }

  function deltaIncome(kind, def, st) {
    if (kind === "producer") return (def.productionPerLevel || 0) * st.globalProd;
    if (kind === "active") {
      const lvl = levels.act[def.id];
      let dClick = 0, dCrit = 0, dMult = 0, dProd = 0;
      if (def.family === "claws" && def.bonusType !== "clickPowerFlat") dClick = 0.4;
      if (def.bonusType === "clickPowerFlat") dClick = tableVal(def.bonusValues, lvl + 1) - tableVal(def.bonusValues, lvl);
      if (def.bonusType === "critChanceFlat") dCrit = tableVal(def.bonusValues, lvl + 1) - tableVal(def.bonusValues, lvl);
      else if (def.critChance) dCrit = def.critChance;
      if (def.bonusType === "critMultiplierFlat") dMult = tableVal(def.bonusValues, lvl + 1) - tableVal(def.bonusValues, lvl);
      else if (def.critMult) dMult = def.critMult;
      if (def.bonusType === "globalProdPct") {
        const add = (tableVal(def.bonusValues, lvl + 1) - tableVal(def.bonusValues, lvl)) / 100;
        dProd = st.essPerSec * add;
      }
      if (def.bonusType === "chargedStrike") return st.incomePerSec * 0.06;
      if (def.bonusType === "twinHatchChance") return 0.0001;
      return dProd + (
        dClick * ((1 - st.critChance) + st.critChance * st.critMult)
        + st.ppc * dCrit * (st.critMult - 1)
        + st.ppc * st.critChance * dMult
      ) * cps;
    }
    if (kind === "special") {
      if (def.effect?.type === "globalProdPct") return st.essPerSec * def.effect.value;
      if (def.effect?.type === "heritage") return st.incomePerSec * 0.05;
      if (def.effect?.type === "critChance") return st.ppc * def.effect.value * (st.critMult - 1) * cps;
      return st.incomePerSec * 0.01;
    }
    if (kind === "shop") return def.effect?.type === "producerCostMult" ? st.incomePerSec * 0.04 : 0.001;
    return 0;
  }

  const markers = { p25: null, p50: null, p75: null, gate: null, p100: null, unlockPay: null };
  let unlockedGate = false, paidUnlock = false, gateSnap = null;
  let t = 0;
  const dt = 0.5;

  while (t < maxMinutes * 60) {
    let st = stats();
    essence += st.incomePerSec * dt;
    t += dt;

    for (let n = 0; n < 10; n++) {
      st = stats();
      const cands = [];
      producers.forEach((p) => {
        const c = costProducer(p);
        if (Number.isFinite(c)) cands.push({ kind: "producer", def: p, cost: c, d: deltaIncome("producer", p, st) });
      });
      actives.forEach((u) => {
        const c = costActive(u);
        if (Number.isFinite(c)) cands.push({ kind: "active", def: u, cost: c, d: deltaIncome("active", u, st) });
      });
      specials.forEach((s) => {
        if (levels.spec[s.id]) return;
        if (s.unlock?.type === "zoneDragons" || s.unlock?.type === "eggsHatched") return;
        if (s.unlock?.type === "producerOwned" && (levels.prod[s.unlock.producerId] || 0) < (s.unlock.value || 1)) return;
        if (s.unlock?.type === "totalEssence" && zoneSpent + essence < s.unlock.value) return;
        cands.push({ kind: "special", def: s, cost: s.cost, d: deltaIncome("special", s, st) });
      });
      shopPass.forEach((s) => {
        if (!levels.shop[s.id]) cands.push({ kind: "shop", def: s, cost: s.cost, d: deltaIncome("shop", s, st) });
      });

      if (!cands.length) {
        if (!markers.p100) markers.p100 = t / 60;
        break;
      }

      const aff = cands.filter((c) => c.cost <= essence);
      if (!aff.length) break;

      const soft = Math.max(st.incomePerSec * 35, 60);
      const hard = Math.max(st.incomePerSec * 90, 150);
      let pool = aff.filter((c) => c.cost <= soft);
      if (!pool.length) pool = aff.filter((c) => c.cost <= hard);
      if (!pool.length) {
        const cheapest = aff.slice().sort((a, b) => a.cost - b.cost)[0];
        if (cheapest.cost <= Math.max(st.incomePerSec * 150, 250)) pool = [cheapest];
        else break;
      }
      pool.sort((a, b) => (b.d / b.cost) - (a.d / a.cost));
      const pick = pool[0];

      essence -= pick.cost;
      zoneSpent += pick.cost;
      if (pick.kind === "producer") levels.prod[pick.def.id]++;
      else if (pick.kind === "active") levels.act[pick.def.id]++;
      else if (pick.kind === "special") levels.spec[pick.def.id] = true;
      else if (pick.kind === "shop") levels.shop[pick.def.id] = true;
    }

    const progress = Math.min(1, zoneSpent / Math.max(1, totalCostCore));
    if (!markers.p25 && progress >= 0.25) markers.p25 = t / 60;
    if (!markers.p50 && progress >= 0.5) markers.p50 = t / 60;
    if (!markers.p75 && progress >= 0.75) markers.p75 = t / 60;
    if (!markers.p100 && progress >= 0.999) markers.p100 = t / 60;

    if (gateSpent != null && !unlockedGate && zoneSpent >= gateSpent) {
      unlockedGate = true;
      markers.gate = t / 60;
    }
    if (unlockedGate && !paidUnlock && unlockCost > 0 && essence >= unlockCost) {
      paidUnlock = true;
      markers.unlockPay = t / 60;
      essence -= unlockCost;
      const s = stats();
      gateSnap = {
        essence: Math.min(essence, Math.max(unlockCost * 0.2, s.incomePerSec * 40)),
        clickFlat: s.clickFlat, clickPct: s.clickPct,
        critChance: s.critChance, critMult: s.critMult,
        globalProd: s.globalProd, producerCostMult: s.pcm,
        chargedEvery: s.chargedEvery, chargedMult: s.chargedMult,
        priorProd: s.essPerSec
      };
      if (stopAtUnlock) break;
    }
    if (gateSpent == null && markers.p75 && !markers.gate) markers.gate = markers.p75;
    if (markers.p100 && (gateSpent == null || paidUnlock || !unlockCost)) break;
  }

  const final = stats();
  const leftoverPct = gateSpent != null
    ? Math.max(0, 1 - gateSpent / Math.max(1, totalCostCore))
    : 0.25;

  return {
    cps, zoneId, minutes: markers, zoneSpent, totalCostCore, leftoverPct,
    finalIncome: final.incomePerSec, finalPpc: final.ppc, finalProd: final.essPerSec,
    inheritOut: gateSnap || {
      essence: Math.min(Math.max(0, essence), Math.max(500, final.incomePerSec * 40)),
      clickFlat: final.clickFlat, clickPct: final.clickPct,
      critChance: final.critChance, critMult: final.critMult,
      globalProd: final.globalProd, producerCostMult: final.pcm,
      chargedEvery: final.chargedEvery, chargedMult: final.chargedMult,
      priorProd: final.essPerSec
    }
  };
}

function fmt(n) {
  if (n == null || !Number.isFinite(n)) return "—";
  return (Math.round(n * 10) / 10).toFixed(1);
}

function printAudit() {
  for (const z of ["sanctuary", "valley", "mountains"]) {
    const a = auditZone(z);
    console.log("\n====", z, "====");
    console.log("Boutique total:", Math.round(a.boutiqueTotal));
    a.boutique.forEach((p) => console.log(" ", p.id, "base", p.baseCost, "g", p.costGrowth, "max", p.maxLevel, "tot", Math.round(p.total)));
    console.log("Upgrades total:", Math.round(a.upgradesTotal));
    a.upgrades.forEach((u) => console.log(" ", u.id, "base", u.baseCost, "g", u.costGrowth, "max", u.maxLevel, "tot", Math.round(u.total), u.costs ? "FIXED" : ""));
    console.log("Specials:", a.extras.specialTotal, "ShopPass:", a.extras.passiveTotal, "Offline:", a.extras.levelTotal);
    console.log("Core (bout+upg):", Math.round(a.coreTotal), "Full:", Math.round(a.fullTotal));
    console.log("Gate spent:", a.spentGate, "unlockCost:", a.unlockCost);
  }
}

function gateForNext(fromZoneId) {
  const next = ZONE_DEFS.find((z) => (z.unlockRequirements || []).some((r) => r.type === "zoneSpent" && r.zoneId === fromZoneId));
  if (!next) return { spent: null, unlockCost: 0 };
  const req = (next.unlockRequirements || []).find((r) => r.type === "zoneSpent");
  return { spent: req ? req.value : null, unlockCost: next.unlockCost || 0 };
}

function runSims(label) {
  console.log("\n######## SIM", label, "########");
  const g1 = gateForNext("sanctuary");
  const g2 = gateForNext("valley");
  console.log("Gates:", JSON.stringify({ g1, g2 }));
  for (const cps of [2, 4, 5, 6, 7, 8]) {
    const z1 = simulateZone({ zoneId: "sanctuary", cps, gateSpent: g1.spent, unlockCost: g1.unlockCost, stopAtUnlock: false });
    const z2 = simulateZone({ zoneId: "valley", cps, gateSpent: g2.spent, unlockCost: g2.unlockCost, inherit: z1.inheritOut, stopAtUnlock: false });
    const z3 = simulateZone({ zoneId: "mountains", cps, inherit: z2.inheritOut });
    console.log(`\nCPS=${cps}`);
    console.log(" Z1 gate/unlock/p25/p50/p75/p100:", fmt(z1.minutes.gate), fmt(z1.minutes.unlockPay), fmt(z1.minutes.p25), fmt(z1.minutes.p50), fmt(z1.minutes.p75), fmt(z1.minutes.p100), "spent", Math.round(z1.zoneSpent), "leftover~", fmt(z1.leftoverPct * 100) + "%");
    console.log(" Z2 gate/unlock/p25/p50/p75/p100:", fmt(z2.minutes.gate), fmt(z2.minutes.unlockPay), fmt(z2.minutes.p25), fmt(z2.minutes.p50), fmt(z2.minutes.p75), fmt(z2.minutes.p100), "spent", Math.round(z2.zoneSpent), "leftover~", fmt(z2.leftoverPct * 100) + "%");
    console.log(" Z3 p25/p50/p75/p100:", fmt(z3.minutes.p25), fmt(z3.minutes.p50), fmt(z3.minutes.p75), fmt(z3.minutes.p100), "spent", Math.round(z3.zoneSpent));
  }
}

printAudit();
runSims("REBALANCED");

export { loadData, auditZone, simulateZone, sumGeom };
