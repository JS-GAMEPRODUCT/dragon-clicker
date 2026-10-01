/* One-shot patch script — hatch flow rewrite */
const fs = require("fs");
const path = "C:/Users/Utilisateur/Desktop/mm/js/game.js";
let s = fs.readFileSync(path, "utf8");

function mustReplace(label, oldStr, newStr) {
  if (!s.includes(oldStr)) {
    console.error("FAIL:", label);
    process.exit(1);
  }
  s = s.replace(oldStr, newStr);
  console.log("OK:", label);
}

mustReplace(
  "hatchFx state",
  `    let hatchFxTimers = [];
    let hatchFxToken = 0;
    let lastEggAmbientShakeAt = 0;`,
  `    let hatchFxTimers = [];
    let hatchFxToken = 0;
    /**
     * Unique source of truth for the final hatch reveal timeline (visual only).
     * Total ≈ 2.4–2.6s from 100% to fully visible dragon.
     */
    const HATCH_SEQUENCE_TIMINGS = {
      finalShake: 450,
      breakPhase: 350,
      hatchSoundAt: 200, /* offset into breakPhase → ~650ms after crack */
      eggVanish: 200,
      pauseAfterBreak: 200,
      summonEffect: 750,
      dragonReveal: 650,
      twinSummonEffect: 500
    };
    const DRAGON_SUMMON_COLS = 5;
    const DRAGON_SUMMON_ROWS = 2;
    const DRAGON_SUMMON_TOTAL_FRAMES = DRAGON_SUMMON_COLS * DRAGON_SUMMON_ROWS;
    const DRAGON_SUMMON_SRC = "assets/animation/magic-electric-lightning-ball-animation-sprite.png";
    let dragonSummonSpriteReady = null;
    let dragonSummonActiveEl = null;
    let lastEggAmbientShakeAt = 0;`
);

mustReplace(
  "remove early crack + advanceEggProgress",
  `    const EGG_CRACK_SOUND_THRESHOLD = 0.92; /* 92 % de progression */

    function maybePlayEggCrackSound(eggDef, oldProgress, newProgress) {
      if (!eggDef) return;
      const prog = getEggProgress(eggDef.id);
      if (prog.crackSoundPlayed) return;
      const req = getEggHatchRequirement(eggDef);
      if (req <= 0) return;
      const oldRatio = safeNumber(oldProgress, 0) / req;
      const newRatio = safeNumber(newProgress, 0) / req;
      if (oldRatio >= EGG_CRACK_SOUND_THRESHOLD) {
        prog.crackSoundPlayed = true;
        return;
      }
      if (newRatio < EGG_CRACK_SOUND_THRESHOLD) return;
      prog.crackSoundPlayed = true;
      playSound("eggCrack");
    }

    function advanceEggProgress(amount) {
      if (hatchSequenceActive || clicksLocked || isEggCarouselAnimating) return;
      amount = safeNumber(amount, 0);
      if (amount <= 0) return;

      const eggDef = getEquippedEggDef();
      if (!eggDef || eggDef.comingSoon) return;

      const prog = getEggProgress(eggDef.id);
      if (!prog.unlocked) {
        renderEggProgressUI();
        return;
      }

      const req = getEggHatchRequirement(eggDef);
      if (prog.progress >= req) {
        maybePlayEggCrackSound(eggDef, prog.progress, prog.progress);
        startHatchSequence(eggDef);
        return;
      }

      const oldProgress = safeNumber(prog.progress, 0);
      prog.progress = Math.min(req, oldProgress + amount);
      maybePlayEggCrackSound(eggDef, oldProgress, prog.progress);
      renderEggProgressUI();
      updateEggVisualState();

      if (prog.progress >= req) {
        startHatchSequence(eggDef);
      }
    }`,
  `    function advanceEggProgress(amount) {
      if (hatchSequenceActive || clicksLocked || isEggCarouselAnimating) return;
      amount = safeNumber(amount, 0);
      if (amount <= 0) return;

      const eggDef = getEquippedEggDef();
      if (!eggDef || eggDef.comingSoon) return;

      const prog = getEggProgress(eggDef.id);
      if (!prog.unlocked) {
        renderEggProgressUI();
        return;
      }

      const req = getEggHatchRequirement(eggDef);
      /* Already at max — single hatch path; crack plays inside startHatchSequence at 100%. */
      if (prog.progress >= req) {
        startHatchSequence(eggDef);
        return;
      }

      prog.progress = Math.min(req, safeNumber(prog.progress, 0) + amount);
      renderEggProgressUI();
      updateEggVisualState();

      if (prog.progress >= req) {
        startHatchSequence(eggDef);
      }
    }`
);

/* Remove save heal that marked crack at 92% */
mustReplace(
  "save crack threshold heal",
  `            /* Si déjà au-delà du seuil au chargement, ne pas rejouer le craquement. */
            if (!fresh.eggs[e.id].crackSoundPlayed) {
              const ratio = fresh.eggs[e.id].progress / Math.max(1, newReq);
              if (ratio >= EGG_CRACK_SOUND_THRESHOLD) {
                fresh.eggs[e.id].crackSoundPlayed = true;
              }
            }
`,
  `            /* Egg crack is reserved for the 100% hatch sequence only — no anticipatory flag. */
`
);

fs.writeFileSync(path, s);
console.log("stage1 written, length", s.length);
