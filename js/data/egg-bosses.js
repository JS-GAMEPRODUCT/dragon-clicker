/**
 * Dragon Clicker — Gardiens d'œuf / Boss actifs (data-driven).
 * V1 : Aurek (Z1), Sylvarok + Aqualyth (Z2) uniquement.
 * Ajouter un Boss = une entrée ici (enabled: true) + assets.
 */
"use strict";

/** Minimum d'éclosions de l'œuf avant spawn naturel possible. */
var EGG_BOSS_MIN_HATCHES = 3;
/** Chance par éclosion éligible (après le minimum). */
var EGG_BOSS_SPAWN_CHANCE = 0.15;
/** Pity : Boss garanti après N éclosions éligibles sans Boss. */
var EGG_BOSS_PITY = 8;
/** Cooldown global entre deux Boss (ms) — naturel ou Œuf de Gardien. */
var EGG_BOSS_COOLDOWN_MS = 15 * 60 * 1000;
/** Multiplicateur de requiredHatchPower pour l'Œuf de Gardien (vs œuf normal). */
var GUARDIAN_EGG_HATCH_MULT = 1.5;

/** Seuils de rang (secondes depuis le 1er clic). */
var EGG_BOSS_RANK_THRESHOLDS = {
  S: 15,
  A: 25,
  B: 40
  /* au-delà → C */
};

/** Multiplicateurs Essence selon rang. */
var EGG_BOSS_RANK_ESSENCE_MULT = {
  S: 3.0,
  A: 2.25,
  B: 1.5,
  C: 1.0
};

/** Chances coffres selon rang (types = CHEST_TYPES). */
var EGG_BOSS_CHEST_CHANCES = {
  C: { draconic: 0, rare: 0 },
  B: { draconic: 0.10, rare: 0 },
  A: { draconic: 0.20, rare: 0.02 },
  S: { draconic: 0.30, rare: 0.05 }
};

/** Chance d'Œuf de Gardien selon rang — UN seul roll par victoire. */
var GUARDIAN_EGG_DROP_CHANCE = {
  C: 0.01,
  B: 0.02,
  A: 0.04,
  S: 0.06
};

/**
 * Définitions Boss.
 * image = sprite combat ; guardianEggImage = objet inventaire / éclosion spéciale.
 * Chemins = fichiers réels dans assets/eggs/boss/
 */
var EGG_BOSS_DEFS = [
  {
    id: "aurek",
    name: "AUREK",
    subtitle: "Gardien du Premier Œuf",
    displayName: "Aurek",
    eggId: "basic",
    zoneId: "sanctuary",
    image: "assets/eggs/boss/boss oeuf de base.png",
    guardianEggId: "guardian_aurek",
    guardianEggImage: "assets/eggs/boss/oeuf boss oeuf de base.png",
    guardianEggName: "Œuf d'Aurek",
    guardianEggBlurb: "Un ancien Œuf de Gardien.",
    targetHits: 90,
    enabled: true
  },
  {
    id: "sylvarok",
    name: "SYLVAROK",
    subtitle: "Gardien du Cœur Ancien",
    displayName: "Sylvarok",
    eggId: "plant",
    zoneId: "valley",
    image: "assets/eggs/boss/boss oeuf plante.png",
    guardianEggId: "guardian_sylvarok",
    guardianEggImage: "assets/eggs/boss/oeuf boss oeuf plante.png",
    guardianEggName: "Œuf de Sylvarok",
    guardianEggBlurb: "Un ancien Œuf de Gardien.",
    targetHits: 100,
    enabled: true
  },
  {
    id: "aqualyth",
    name: "AQUALYTH",
    subtitle: "Gardien des Cascades",
    displayName: "Aqualyth",
    eggId: "cascade",
    zoneId: "valley",
    image: "assets/eggs/boss/boss oeuf cascade.png",
    guardianEggId: "guardian_aqualyth",
    guardianEggImage: "assets/eggs/boss/oeuf boss oeuf cascade.png",
    guardianEggName: "Œuf d'Aqualyth",
    guardianEggBlurb: "Un ancien Œuf de Gardien.",
    targetHits: 105,
    enabled: true
  }
];

if (typeof window !== "undefined") {
  window.EGG_BOSS_DEFS = EGG_BOSS_DEFS;
  window.EGG_BOSS_MIN_HATCHES = EGG_BOSS_MIN_HATCHES;
  window.EGG_BOSS_SPAWN_CHANCE = EGG_BOSS_SPAWN_CHANCE;
  window.EGG_BOSS_PITY = EGG_BOSS_PITY;
  window.EGG_BOSS_COOLDOWN_MS = EGG_BOSS_COOLDOWN_MS;
  window.GUARDIAN_EGG_HATCH_MULT = GUARDIAN_EGG_HATCH_MULT;
  window.EGG_BOSS_RANK_THRESHOLDS = EGG_BOSS_RANK_THRESHOLDS;
  window.EGG_BOSS_RANK_ESSENCE_MULT = EGG_BOSS_RANK_ESSENCE_MULT;
  window.EGG_BOSS_CHEST_CHANCES = EGG_BOSS_CHEST_CHANCES;
  window.GUARDIAN_EGG_DROP_CHANCE = GUARDIAN_EGG_DROP_CHANCE;
}
