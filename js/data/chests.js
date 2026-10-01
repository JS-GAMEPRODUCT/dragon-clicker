/**
 * Dragon Clicker
 * Coffres V1 — configuration centralisée (types, récompenses par zone, drops d'expédition).
 * Les coffres sont un bonus secondaire : ni dragon complet, ni fragment mythique,
 * et leur Essence ne compte pas comme Essence investie dans la zone.
 */
"use strict";

var CHEST_TYPE_ORDER = ["draconic", "rare", "epic"];

var CHEST_TYPES = {
  draconic: {
    name: "Coffre de base",
    rarityLabel: "Base",
    css: "chest-draconic",
    blurb: "Essence, fragments communs, petites récompenses.",
    imageClosed: "assets/coffre/coffre%20de%20base%20ferm%C3%A9.png",
    imageOpen: "assets/coffre/coffre%20de%20base%20ouvert.png"
  },
  rare: {
    name: "Coffre Rare",
    rarityLabel: "Rare",
    css: "chest-rare",
    blurb: "Essence, fragments rares, meilleures récompenses.",
    imageClosed: "assets/coffre/coffre%20de%20rareferm%C3%A9.png",
    imageOpen: "assets/coffre/coffre%20de%20rare%20ouvert.png"
  },
  epic: {
    name: "Coffre Épique",
    rarityLabel: "Épique",
    css: "chest-epic",
    blurb: "Essence, fragments épiques, grosses récompenses.",
    imageClosed: "assets/coffre/coffre%20de%20epic%20ferm%C3%A9.png",
    imageOpen: "assets/coffre/coffre%20de%20epic%20ouvert.png"
  }
};

/**
 * Récompenses par zone et type.
 * fragmentsGuaranteed + (fragmentBonusChance → +1).
 */
var CHEST_ZONE_REWARDS = {
  sanctuary: {
    draconic: { essenceMin: 250, essenceMax: 750, fragmentsGuaranteed: 0, fragmentBonusChance: 0.20 },
    rare: { essenceMin: 1000, essenceMax: 2500, fragmentsGuaranteed: 1, fragmentBonusChance: 0.15 },
    epic: { essenceMin: 3000, essenceMax: 6000, fragmentsGuaranteed: 2, fragmentBonusChance: 0.05 }
  },
  valley: {
    draconic: { essenceMin: 1500, essenceMax: 4000, fragmentsGuaranteed: 0, fragmentBonusChance: 0.25 },
    rare: { essenceMin: 5000, essenceMax: 12000, fragmentsGuaranteed: 1, fragmentBonusChance: 0.25 },
    epic: { essenceMin: 15000, essenceMax: 30000, fragmentsGuaranteed: 2, fragmentBonusChance: 0.10 }
  }
};

/**
 * Fallback zone-level (Zone 2 / anciennes saves).
 * Zone 1 utilise les chestChance / chestWeights par expédition.
 */
var CHEST_EXPEDITION_DROPS = {
  sanctuary: { chance: 0.65, weights: { draconic: 85, rare: 14, epic: 1 } },
  valley: { chance: 0.45, weights: { draconic: 65, rare: 25, epic: 10 } }
};

/** Pondération des fragments par rareté (mythique interdit en V1). */
var CHEST_FRAGMENT_RARITY_WEIGHTS = {
  common: 55,
  rare: 28,
  epic: 10,
  legendary: 7,
  mythic: 0
};

/** Fragment introuvable (aucun dragon éligible) → +20 % de l'Essence du coffre par fragment manquant. */
var CHEST_MISSING_FRAGMENT_ESSENCE_PCT = 0.2;
