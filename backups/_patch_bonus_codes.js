"use strict";
const fs = require("fs");
const path = require("path");
const file = path.join(__dirname, "..", "js", "game.js");
let s = fs.readFileSync(file, "utf8");
let n = 0;

function mustReplace(oldStr, neu, label) {
  if (!s.includes(oldStr)) {
    console.error("FAIL:", label);
    process.exit(1);
  }
  s = s.replace(oldStr, neu);
  n++;
  console.log("OK:", label);
}

/* 1) BONUS_CODES config near top constants — after a stable marker */
mustReplace(
  "    function addEssence(amount, source) {",
  `    /* Codes bonus (extensible) — un seul redeem par code / sauvegarde */
    const BONUS_CODES = {
      "1234": { type: "essence", amount: 1000000 }
    };

    function setBonusCodeFeedback(message, kind) {
      const el = document.getElementById("bonus-code-feedback");
      if (!el) return;
      el.hidden = !message;
      el.textContent = message || "";
      el.classList.remove("is-ok", "is-error");
      if (kind === "ok") el.classList.add("is-ok");
      if (kind === "error") el.classList.add("is-error");
    }

    function redeemBonusCode(rawCode) {
      const code = String(rawCode == null ? "" : rawCode).trim();
      if (!code) {
        setBonusCodeFeedback("CODE INVALIDE", "error");
        showNotification("CODES BONUS", "CODE INVALIDE");
        return false;
      }
      const reward = BONUS_CODES[code];
      if (!reward) {
        setBonusCodeFeedback("CODE INVALIDE", "error");
        showNotification("CODES BONUS", "CODE INVALIDE");
        return false;
      }
      if (!Array.isArray(gameState.redeemedCodes)) gameState.redeemedCodes = [];
      if (gameState.redeemedCodes.indexOf(code) !== -1) {
        setBonusCodeFeedback("CODE DÉJÀ UTILISÉ", "error");
        showNotification("CODES BONUS", "CODE DÉJÀ UTILISÉ");
        return false;
      }

      if (reward.type === "essence") {
        /* addEssence incrémente aussi totalEssenceEarned (= Essence totale) */
        addEssence(safeNumber(reward.amount, 0), "bonus");
        gameState.redeemedCodes.push(code);
        uiDirty = true;
        calculateProduction();
        saveGame(true);
        const label = "+" + formatNumber(reward.amount) + " Essence";
        setBonusCodeFeedback("CODE VALIDÉ ! " + label, "ok");
        showNotification("CODE VALIDÉ !", label);
        const input = document.getElementById("bonus-code-input");
        if (input) input.value = "";
        return true;
      }

      setBonusCodeFeedback("CODE INVALIDE", "error");
      showNotification("CODES BONUS", "CODE INVALIDE");
      return false;
    }

    function addEssence(amount, source) {`,
  "bonus redeem helpers"
);

/* 2) default state */
mustReplace(
  "        team: [null, null, null],\n        expeditions: {",
  "        team: [null, null, null],\n        redeemedCodes: [],\n        expeditions: {",
  "default redeemedCodes"
);

/* 3) serialize */
mustReplace(
  "        team: gameState.team,\n        fragmentBonusAccumulator:",
  "        team: gameState.team,\n        redeemedCodes: Array.isArray(gameState.redeemedCodes) ? gameState.redeemedCodes.slice() : [],\n        fragmentBonusAccumulator:",
  "serialize redeemedCodes"
);

/* 4) load — after team hydrate */
mustReplace(
  "      fresh.fragmentBonusAccumulator = Math.max(0, safeNumber(data.fragmentBonusAccumulator, 0));\n      fresh.eggProgressAccumulator = Math.max(0, safeNumber(data.eggProgressAccumulator, 0));",
  `      fresh.redeemedCodes = [];
      if (Array.isArray(data.redeemedCodes)) {
        data.redeemedCodes.forEach((c) => {
          if (typeof c === "string" && c && fresh.redeemedCodes.indexOf(c) === -1) {
            fresh.redeemedCodes.push(c);
          }
        });
      }

      fresh.fragmentBonusAccumulator = Math.max(0, safeNumber(data.fragmentBonusAccumulator, 0));
      fresh.eggProgressAccumulator = Math.max(0, safeNumber(data.eggProgressAccumulator, 0));`,
  "load redeemedCodes"
);

/* 5) wire UI near btn-save */
mustReplace(
  '      document.getElementById("btn-save").addEventListener("click", () => saveGame(false));',
  `      document.getElementById("btn-save").addEventListener("click", () => saveGame(false));
      const bonusInput = document.getElementById("bonus-code-input");
      const bonusBtn = document.getElementById("btn-redeem-bonus-code");
      if (bonusBtn) {
        bonusBtn.addEventListener("click", () => {
          redeemBonusCode(bonusInput ? bonusInput.value : "");
        });
      }
      if (bonusInput) {
        bonusInput.addEventListener("keydown", (ev) => {
          if (ev.key === "Enter") {
            ev.preventDefault();
            redeemBonusCode(bonusInput.value);
          }
        });
      }`,
  "wire bonus UI"
);

fs.writeFileSync(file, s);
console.log("done patches:", n);
