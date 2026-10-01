"use strict";
const fs = require("fs");
const path = require("path");
const file = path.join(__dirname, "..", "js", "game.js");
let s = fs.readFileSync(file, "utf8");

function mustReplace(oldStr, neu, label) {
  const count = s.split(oldStr).length - 1;
  if (count !== 1) {
    console.error("FAIL (" + count + " matches):", label);
    process.exit(1);
  }
  s = s.replace(oldStr, neu);
  console.log("OK:", label);
}

/* 1) Default state */
mustReplace(
  "        redeemedCodes: [],\n        expeditions: {",
  "        redeemedCodes: [],\n        chests: createEmptyChestInventory(),\n        expeditions: {",
  "default chests"
);

/* 2) Serialize */
mustReplace(
  "        redeemedCodes: Array.isArray(gameState.redeemedCodes) ? gameState.redeemedCodes.slice() : [],\n",
  "        redeemedCodes: Array.isArray(gameState.redeemedCodes) ? gameState.redeemedCodes.slice() : [],\n" +
  "        chests: sanitizeChestInventory(gameState.chests),\n",
  "serialize chests"
);

/* 3) Load (anciennes sauvegardes → inventaire vide) */
mustReplace(
  "      fresh.fragmentBonusAccumulator = Math.max(0, safeNumber(data.fragmentBonusAccumulator, 0));\n",
  "      fresh.chests = sanitizeChestInventory(data.chests);\n\n" +
  "      fresh.fragmentBonusAccumulator = Math.max(0, safeNumber(data.fragmentBonusAccumulator, 0));\n",
  "load chests"
);

/* 4) Expedition resolve: roll chest AFTER existing rewards (same seeded rng, rewards unchanged) */
mustReplace(
  "      run.result = calculateExpeditionRewards(def, run.dragonIds || [], success, rng);\n",
  "      run.result = calculateExpeditionRewards(def, run.dragonIds || [], success, rng);\n" +
  "      run.result.chest = rollExpeditionChest(def.zoneId, rng);\n",
  "resolve chest roll"
);

/* 5) Load sanitize of pending expedition result keeps chest */
mustReplace(
  "                  })).filter((f) => getDragonDef(f.dragonId))\n                : []\n            } : null",
  "                  })).filter((f) => getDragonDef(f.dragonId))\n                : [],\n" +
  "              chest: sanitizeExpeditionChest(run.result.chest)\n            } : null",
  "load expedition chest"
);

/* 6) Claim: grant chest into inventory */
mustReplace(
  "      (result.fragments || []).forEach((f) => {\n        grantDragonFragments(f.dragonId, Math.max(0, Math.floor(f.amount)));\n      });\n\n      run.claimed = true;",
  "      (result.fragments || []).forEach((f) => {\n        grantDragonFragments(f.dragonId, Math.max(0, Math.floor(f.amount)));\n      });\n" +
  "      const chestDrop = sanitizeExpeditionChest(result.chest);\n" +
  "      if (chestDrop) {\n" +
  "        addChest(chestDrop.zoneId, chestDrop.type, 1);\n" +
  "        const chestDef = CHEST_TYPES[chestDrop.type];\n" +
  "        showNotification(\"🎁 Coffre obtenu !\", (chestDef ? chestDef.name : \"Coffre\") + \" — \" + getChestZoneLabel(chestDrop.zoneId));\n" +
  "      }\n\n      run.claimed = true;",
  "claim chest"
);

/* 7) Reward lines show chest */
mustReplace(
  "      if (!lines.length) lines.push(\"Quelques ressources modestes\");\n      return lines;\n    }",
  "      const chestDrop = sanitizeExpeditionChest(result.chest);\n" +
  "      if (chestDrop && CHEST_TYPES[chestDrop.type]) lines.push(\"+1 \" + CHEST_TYPES[chestDrop.type].name);\n" +
  "      if (!lines.length) lines.push(\"Quelques ressources modestes\");\n      return lines;\n    }",
  "reward lines chest"
);

/* 8) Chest module (logic / rewards / storage / display separated) */
mustReplace(
  "    function describeExpeditionRewardLines(result) {",
  `    /* -------------------------------------------------------
       COFFRES V1 — stockage
       ------------------------------------------------------- */
    function getChestZoneIds() {
      return Object.keys(typeof CHEST_ZONE_REWARDS === "object" ? CHEST_ZONE_REWARDS : {});
    }

    function createEmptyChestInventory() {
      const inv = {};
      getChestZoneIds().forEach((zoneId) => {
        inv[zoneId] = {};
        CHEST_TYPE_ORDER.forEach((type) => { inv[zoneId][type] = 0; });
      });
      return inv;
    }

    function sanitizeChestInventory(raw) {
      const inv = createEmptyChestInventory();
      if (!raw || typeof raw !== "object") return inv;
      Object.keys(inv).forEach((zoneId) => {
        const src = raw[zoneId];
        if (!src || typeof src !== "object") return;
        CHEST_TYPE_ORDER.forEach((type) => {
          inv[zoneId][type] = Math.max(0, Math.floor(safeNumber(src[type], 0)));
        });
      });
      return inv;
    }

    function ensureChestInventory() {
      if (!gameState.chests || typeof gameState.chests !== "object") {
        gameState.chests = createEmptyChestInventory();
      }
      getChestZoneIds().forEach((zoneId) => {
        if (!gameState.chests[zoneId]) gameState.chests[zoneId] = {};
        CHEST_TYPE_ORDER.forEach((type) => {
          gameState.chests[zoneId][type] = Math.max(0, Math.floor(safeNumber(gameState.chests[zoneId][type], 0)));
        });
      });
      return gameState.chests;
    }

    function isValidChest(zoneId, chestType) {
      return !!(CHEST_ZONE_REWARDS[zoneId] && CHEST_ZONE_REWARDS[zoneId][chestType] && CHEST_TYPES[chestType]);
    }

    function sanitizeExpeditionChest(raw) {
      if (!raw || typeof raw !== "object") return null;
      return isValidChest(raw.zoneId, raw.type) ? { zoneId: raw.zoneId, type: raw.type } : null;
    }

    function getChestCount(zoneId, chestType) {
      const inv = ensureChestInventory();
      return (inv[zoneId] && inv[zoneId][chestType]) || 0;
    }

    function getTotalChestCount() {
      const inv = ensureChestInventory();
      let n = 0;
      Object.keys(inv).forEach((zoneId) => {
        CHEST_TYPE_ORDER.forEach((type) => { n += inv[zoneId][type] || 0; });
      });
      return n;
    }

    function getChestZoneLabel(zoneId) {
      const zone = getZoneDef(zoneId);
      const idx = ZONE_DEFS.findIndex((z) => z.id === zoneId);
      return (idx >= 0 ? "Zone " + (idx + 1) : "Zone") + (zone ? " · " + zone.name : "");
    }

    function addChest(zoneId, chestType, amount) {
      if (!isValidChest(zoneId, chestType)) return false;
      const n = Math.max(1, Math.floor(safeNumber(amount, 1)));
      const inv = ensureChestInventory();
      inv[zoneId][chestType] += n;
      updateChestButtonBadge();
      if (isChestModalOpen()) renderChestInventory();
      return true;
    }

    /* -------------------------------------------------------
       COFFRES V1 — tirages
       ------------------------------------------------------- */
    function pickWeighted(weights, rng) {
      const r = typeof rng === "function" ? rng : Math.random;
      const keys = Object.keys(weights).filter((k) => safeNumber(weights[k], 0) > 0);
      const total = keys.reduce((sum, k) => sum + safeNumber(weights[k], 0), 0);
      if (!keys.length || total <= 0) return null;
      let roll = r() * total;
      for (let i = 0; i < keys.length; i++) {
        roll -= safeNumber(weights[keys[i]], 0);
        if (roll < 0) return keys[i];
      }
      return keys[keys.length - 1];
    }

    /** 0 ou 1 coffre en fin d'expédition (zone de l'expédition). */
    function rollExpeditionChest(zoneId, rng) {
      const cfg = typeof CHEST_EXPEDITION_DROPS === "object" ? CHEST_EXPEDITION_DROPS[zoneId] : null;
      if (!cfg) return null;
      const r = typeof rng === "function" ? rng : Math.random;
      if (r() >= safeNumber(cfg.chance, 0)) return null;
      const type = pickWeighted(cfg.weights || {}, r);
      return isValidChest(zoneId, type) ? { zoneId, type } : null;
    }

    /** Dragons découverts de la zone, hors mythiques (poids 0) et secrets. */
    function getEligibleChestDragons(zoneId) {
      return DRAGON_DEFS.filter((def) => {
        if (def.secret || (def.zoneId || "sanctuary") !== zoneId) return false;
        if (safeNumber(CHEST_FRAGMENT_RARITY_WEIGHTS[def.rarity], 0) <= 0) return false;
        return isDragonDiscovered(gameState.dragons[def.id], def.id, gameState);
      });
    }

    function pickChestFragmentDragon(eligible) {
      const weights = {};
      eligible.forEach((def) => {
        weights[def.id] = safeNumber(CHEST_FRAGMENT_RARITY_WEIGHTS[def.rarity], 0);
      });
      return pickWeighted(weights, Math.random);
    }

    function rollChestReward(zoneId, chestType) {
      if (!isValidChest(zoneId, chestType)) return null;
      const cfg = CHEST_ZONE_REWARDS[zoneId][chestType];
      const baseEssence = randomIntInclusive(Math.random, cfg.essenceMin, cfg.essenceMax);
      let fragmentCount = Math.max(0, Math.floor(safeNumber(cfg.fragmentsGuaranteed, 0)));
      if (Math.random() < safeNumber(cfg.fragmentBonusChance, 0)) fragmentCount += 1;

      const eligible = getEligibleChestDragons(zoneId);
      const fragments = {};
      let missing = 0;
      for (let i = 0; i < fragmentCount; i++) {
        const id = eligible.length ? pickChestFragmentDragon(eligible) : null;
        if (id) fragments[id] = (fragments[id] || 0) + 1;
        else missing += 1;
      }
      const bonusEssence = Math.floor(baseEssence * CHEST_MISSING_FRAGMENT_ESSENCE_PCT * missing);

      return {
        zoneId,
        chestType,
        essence: baseEssence + bonusEssence,
        bonusEssence,
        fragments: Object.keys(fragments).map((dragonId) => ({ dragonId, amount: fragments[dragonId] }))
      };
    }

    /** Crédite Essence (hors Essence investie de zone) + fragments. */
    function grantChestRewards(reward) {
      if (!reward) return null;
      /* addEssence ne touche pas zoneSpent : seule spendEssence({ zoneId }) alimente le déblocage. */
      addEssence(reward.essence, "chest");
      const granted = [];
      (reward.fragments || []).forEach((f) => {
        const res = grantDragonFragments(f.dragonId, f.amount);
        if (res.total > 0) granted.push({ dragonId: f.dragonId, amount: res.total });
      });
      dragonsDirty = true;
      uiDirty = true;
      return { essence: reward.essence, bonusEssence: reward.bonusEssence, fragments: granted };
    }

    function openChest(zoneId, chestType) {
      if (!isValidChest(zoneId, chestType)) return null;
      const inv = ensureChestInventory();
      if (inv[zoneId][chestType] <= 0) return null;
      inv[zoneId][chestType] -= 1;
      const reward = rollChestReward(zoneId, chestType);
      const granted = grantChestRewards(reward);
      calculateProduction();
      saveGame(true);
      updateChestButtonBadge();
      return granted ? Object.assign({ zoneId, chestType }, granted) : null;
    }

    /* -------------------------------------------------------
       COFFRES V1 — affichage
       ------------------------------------------------------- */
    let chestRevealTimer = null;

    function isChestModalOpen() {
      const m = document.getElementById("chest-modal");
      return !!(m && !m.classList.contains("hidden"));
    }

    function updateChestButtonBadge() {
      const badge = document.getElementById("chests-btn-badge");
      if (!badge) return;
      const n = getTotalChestCount();
      badge.hidden = n <= 0;
      badge.textContent = n > 99 ? "99+" : String(n);
    }

    function renderChestInventory() {
      const host = document.getElementById("chest-inventory");
      if (!host) return;
      const inv = ensureChestInventory();
      host.innerHTML = "";
      const zones = getChestZoneIds().filter((zoneId) =>
        isZoneUnlocked(gameState, zoneId) ||
        CHEST_TYPE_ORDER.some((type) => inv[zoneId][type] > 0)
      );
      zones.forEach((zoneId) => {
        const section = document.createElement("section");
        section.className = "chest-zone";
        const title = document.createElement("h3");
        title.className = "chest-zone-title";
        title.textContent = getChestZoneLabel(zoneId);
        section.appendChild(title);

        const grid = document.createElement("div");
        grid.className = "chest-grid";
        CHEST_TYPE_ORDER.forEach((type) => {
          const def = CHEST_TYPES[type];
          const count = inv[zoneId][type] || 0;
          const card = document.createElement("div");
          card.className = "chest-card " + def.css + (count > 0 ? "" : " is-empty");
          card.innerHTML =
            '<div class="chest-card-art"><img alt="" draggable="false" decoding="async" /></div>' +
            '<div class="chest-card-name"></div>' +
            '<div class="chest-card-count"></div>' +
            '<button type="button" class="btn chest-card-open">Ouvrir</button>';
          card.querySelector("img").src = def.imageClosed;
          card.querySelector(".chest-card-name").textContent = def.name;
          card.querySelector(".chest-card-count").textContent = "x" + count;
          const btn = card.querySelector(".chest-card-open");
          btn.disabled = count <= 0;
          btn.addEventListener("click", () => startChestOpening(zoneId, type));
          grid.appendChild(card);
        });
        section.appendChild(grid);
        host.appendChild(section);
      });
      if (!zones.length) {
        const p = document.createElement("p");
        p.className = "chest-empty";
        p.textContent = "Aucun coffre pour le moment.";
        host.appendChild(p);
      }
    }

    function openChestModal() {
      const modal = document.getElementById("chest-modal");
      if (!modal) return;
      renderChestInventory();
      modal.classList.remove("hidden");
    }

    function closeChestModal() {
      const modal = document.getElementById("chest-modal");
      if (modal) modal.classList.add("hidden");
    }

    function closeChestReveal() {
      const modal = document.getElementById("chest-reveal-modal");
      if (!modal) return;
      clearTimeout(chestRevealTimer);
      modal.classList.add("hidden");
      if (isChestModalOpen()) renderChestInventory();
    }

    function renderChestRewardList(result) {
      const list = document.getElementById("chest-reveal-rewards");
      if (!list) return;
      list.innerHTML = "";
      const addLine = (text, cls) => {
        const li = document.createElement("li");
        if (cls) li.className = cls;
        li.textContent = text;
        list.appendChild(li);
      };
      addLine("+" + formatNumber(result.essence) + " Essence", "is-essence");
      if (result.fragments.length) {
        result.fragments.forEach((f) => {
          const d = getDragonDef(f.dragonId);
          addLine("+" + f.amount + " fragment" + (f.amount > 1 ? "s" : "") + " " + (d ? d.name : f.dragonId), "is-fragment");
        });
      } else {
        addLine("Aucun fragment", "is-muted");
      }
      if (result.bonusEssence > 0) {
        addLine("(dont +" + formatNumber(result.bonusEssence) + " Essence à la place de fragments)", "is-muted");
      }
      list.hidden = false;
    }

    function startChestOpening(zoneId, chestType) {
      const modal = document.getElementById("chest-reveal-modal");
      const def = CHEST_TYPES[chestType];
      if (!modal || !def || getChestCount(zoneId, chestType) <= 0) return;

      const result = openChest(zoneId, chestType);
      if (!result) return;
      if (isChestModalOpen()) renderChestInventory();

      const art = document.getElementById("chest-reveal-art");
      const img = document.getElementById("chest-reveal-img");
      const list = document.getElementById("chest-reveal-rewards");
      const ok = document.getElementById("btn-chest-reveal-ok");
      document.getElementById("chest-reveal-title").textContent = def.name;
      document.getElementById("chest-reveal-zone").textContent = getChestZoneLabel(zoneId);
      art.className = "chest-reveal-art " + def.css + " is-shaking";
      img.src = def.imageClosed;
      list.hidden = true;
      ok.hidden = true;
      modal.classList.remove("hidden");
      playSound("upgrade");

      clearTimeout(chestRevealTimer);
      chestRevealTimer = setTimeout(() => {
        art.classList.remove("is-shaking");
        art.classList.add("is-open");
        img.src = def.imageOpen;
        renderChestRewardList(result);
        ok.hidden = false;
        playSound("star");
        pulseHudEssence();
      }, prefersReducedMotion() ? 0 : 700);
    }

    function describeExpeditionRewardLines(result) {`,
  "chest module"
);

/* 9) Badge refresh on full static render (load / import / reset) */
mustReplace(
  "      renderExpeditions();\n      renderHeader();\n    }",
  "      renderExpeditions();\n      renderHeader();\n      updateChestButtonBadge();\n    }",
  "renderAllStatic badge"
);

/* 10) Escape closes chest modals before the generic modal guard */
mustReplace(
  "        if (document.querySelector(\".modal-overlay:not(.hidden)\")) return;\n        if (getActiveOverlayPanelId() !== \"kingdom\") switchPanel(\"kingdom\");",
  "        if (!document.getElementById(\"chest-reveal-modal\").classList.contains(\"hidden\")) {\n" +
  "          closeChestReveal();\n          return;\n        }\n" +
  "        if (isChestModalOpen()) {\n          closeChestModal();\n          return;\n        }\n" +
  "        if (document.querySelector(\".modal-overlay:not(.hidden)\")) return;\n        if (getActiveOverlayPanelId() !== \"kingdom\") switchPanel(\"kingdom\");",
  "escape chest modals"
);

/* 11) Wire buttons (next to existing bonus-code wiring) */
mustReplace(
  "      const bonusInput = document.getElementById(\"bonus-code-input\");\n",
  "      const chestsBtn = document.getElementById(\"btn-open-chests\");\n" +
  "      if (chestsBtn) chestsBtn.addEventListener(\"click\", openChestModal);\n" +
  "      const chestsClose = document.getElementById(\"btn-close-chests\");\n" +
  "      if (chestsClose) chestsClose.addEventListener(\"click\", closeChestModal);\n" +
  "      document.getElementById(\"chest-modal\").addEventListener(\"click\", (e) => {\n" +
  "        if (e.target.id === \"chest-modal\") closeChestModal();\n" +
  "      });\n" +
  "      const chestOk = document.getElementById(\"btn-chest-reveal-ok\");\n" +
  "      if (chestOk) chestOk.addEventListener(\"click\", closeChestReveal);\n" +
  "      const bonusInput = document.getElementById(\"bonus-code-input\");\n",
  "wire chest buttons"
);

fs.writeFileSync(file, s);
console.log("chests v1 patch done");
