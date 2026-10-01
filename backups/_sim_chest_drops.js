"use strict";
const fs = require("fs");
const vm = require("vm");
const path = require("path");
const root = path.join(__dirname, "..");
const game = fs.readFileSync(path.join(root, "js/game.js"), "utf8");
const a = game.indexOf("    function pickWeighted(");
const b = game.indexOf("    /** Dragons découverts");
const isValid = game.slice(game.indexOf("    function isValidChest("), game.indexOf("    function sanitizeExpeditionChest("));
const ctx = { safeNumber: (v, f) => (Number.isFinite(Number(v)) ? Number(v) : f), Math };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root, "js/data/chests.js"), "utf8"), ctx);
vm.runInContext(isValid + game.slice(a, b), ctx);
["sanctuary", "valley"].forEach((zone) => {
  const N = 200000;
  const c = { none: 0, draconic: 0, rare: 0, epic: 0 };
  for (let i = 0; i < N; i++) {
    const r = ctx.rollExpeditionChest(zone, Math.random);
    c[r ? r.type : "none"]++;
  }
  const got = N - c.none;
  console.log(zone, "drop", (got / N * 100).toFixed(1) + "%",
    "draconic", (c.draconic / got * 100).toFixed(1), "rare", (c.rare / got * 100).toFixed(1), "epic", (c.epic / got * 100).toFixed(1));
});
