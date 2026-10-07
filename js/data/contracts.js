/**
 * Dragon Clicker — Contrats quotidiens V2
 * Templates + poids + pools de récompenses (data-driven).
 * La progression joueur vit dans gameState.expeditions.dailyContracts.
 */
"use strict";

var CONTRACT_DAILY_COUNT = 3;

/** Affichage FR + classe CSS (réutilise rarity-* du jeu). */
var CONTRACT_RARITY_META = {
  common: { id: "common", label: "Commun", css: "rarity-common" },
  rare: { id: "rare", label: "Rare", css: "rarity-rare" },
  epic: { id: "epic", label: "Épique", css: "rarity-epic" },
  legendary: { id: "legendary", label: "Légendaire", css: "rarity-legendary" }
};

/** Poids globaux de référence (total 100). */
var CONTRACT_RARITY_WEIGHTS = {
  common: 50,
  rare: 30,
  epic: 15,
  legendary: 5
};

/**
 * Poids par slot quotidien (évite 3 communs).
 * Index 0 / 1 / 2 = les 3 contrats du jour.
 */
var CONTRACT_SLOT_RARITY_WEIGHTS = [
  { common: 70, rare: 30 },
  { common: 35, rare: 45, epic: 20 },
  { rare: 55, epic: 35, legendary: 10 }
];

/** Ratio teamPower / recommendedPower pour type domination. */
var CONTRACT_DOMINATION_RATIOS = {
  rare: 1.25,
  epic: 1.4,
  legendary: 1.5
};

/** Seuil Favorable (aligné gameplay expéditions). */
var CONTRACT_FAVORABLE_CHANCE = 0.8;

/**
 * Pools de récompenses par rareté (pondérés).
 * kind: chest | essence | fragments
 * essence: minutes de production passive (snapshot à la génération)
 */
var CONTRACT_REWARD_POOLS = {
  common: [
    { weight: 40, kind: "chest", chestType: "draconic" },
    { weight: 35, kind: "essence", minutes: [2, 4], min: 800, max: 25000 },
    { weight: 25, kind: "fragments", amount: [1, 2] }
  ],
  rare: [
    { weight: 40, kind: "chest", chestType: "rare" },
    { weight: 30, kind: "essence", minutes: [4, 8], min: 2500, max: 80000 },
    { weight: 30, kind: "fragments", amount: [2, 4] }
  ],
  epic: [
    { weight: 35, kind: "chest", chestType: "epic" },
    { weight: 30, kind: "chest", chestType: "rare" },
    { weight: 20, kind: "essence", minutes: [8, 14], min: 8000, max: 200000 },
    { weight: 15, kind: "fragments", amount: [4, 7] }
  ],
  legendary: [
    { weight: 45, kind: "chest", chestType: "epic" },
    { weight: 25, kind: "essence", minutes: [12, 20], min: 20000, max: 400000 },
    { weight: 30, kind: "fragments", amount: [6, 10] }
  ]
};

/**
 * Templates de contrats.
 * target: [min, max] selon difficulté du template
 * rarity: rareté fixe du template (pool filtré par slot)
 */
var CONTRACT_TEMPLATES = [
  /* ---- FINISH ---- */
  { id: "finish_c", type: "finish", rarity: "common", title: "Explorateur", target: [1, 2] },
  { id: "finish_r", type: "finish", rarity: "rare", title: "Voyageur", target: [2, 3] },
  { id: "finish_e", type: "finish", rarity: "epic", title: "Aventurier", target: [3, 4] },
  { id: "finish_l", type: "finish", rarity: "legendary", title: "Légende des pistes", target: [4, 5] },

  /* ---- MEET POWER ---- */
  { id: "power_c", type: "meet_power", rarity: "common", title: "Force mesurée", target: [1, 1] },
  { id: "power_r", type: "meet_power", rarity: "rare", title: "Force draconique", target: [2, 2] },
  { id: "power_e", type: "meet_power", rarity: "epic", title: "Puissance affirmée", target: [3, 3] },
  { id: "power_l", type: "meet_power", rarity: "legendary", title: "Colosse", target: [4, 4] },

  /* ---- DOMINATION ---- */
  { id: "dom_r", type: "domination", rarity: "rare", title: "Supériorité", target: [1, 2], ratioKey: "rare" },
  { id: "dom_e", type: "domination", rarity: "epic", title: "Domination", target: [2, 3], ratioKey: "epic" },
  { id: "dom_l", type: "domination", rarity: "legendary", title: "Écrasement", target: [3, 3], ratioKey: "legendary" },

  /* ---- ZONE ---- */
  { id: "zone_c", type: "zone", rarity: "common", title: "Éclaireur local", target: [1, 2] },
  { id: "zone_r", type: "zone", rarity: "rare", title: "Cartographe", target: [2, 3] },
  { id: "zone_e", type: "zone", rarity: "epic", title: "Maître des régions", target: [3, 4] },
  { id: "zone_l", type: "zone", rarity: "legendary", title: "Conquérant", target: [4, 5] },

  /* ---- FULL PARTY ---- */
  { id: "party_c", type: "full_party", rarity: "common", title: "Escouade", target: [1, 1] },
  { id: "party_r", type: "full_party", rarity: "rare", title: "Formation complète", target: [2, 2] },
  { id: "party_e", type: "full_party", rarity: "epic", title: "Triade", target: [3, 3] },
  { id: "party_l", type: "full_party", rarity: "legendary", title: "Phalange", target: [4, 4] },

  /* ---- RARITY TEAM ---- */
  { id: "rareteam_r", type: "rarity_team", rarity: "rare", title: "Élite rare", target: [1, 2], minDragonRarity: "rare" },
  { id: "rareteam_e", type: "rarity_team", rarity: "epic", title: "Escorte épique", target: [2, 3], minDragonRarity: "epic" },
  { id: "rareteam_l", type: "rarity_team", rarity: "legendary", title: "Garde légendaire", target: [2, 3], minDragonRarity: "legendary" },

  /* ---- LONG DURATION ---- */
  { id: "long_r", type: "long_duration", rarity: "rare", title: "Marche longue", target: [1, 2], minDurationMs: 30 * 60 * 1000 },
  { id: "long_e", type: "long_duration", rarity: "epic", title: "Expédition prolongée", target: [2, 2], minDurationMs: 60 * 60 * 1000 },
  { id: "long_l", type: "long_duration", rarity: "legendary", title: "Campagne", target: [2, 3], minDurationMs: 90 * 60 * 1000 },

  /* ---- FAVORABLE (bonus variety) ---- */
  { id: "fav_c", type: "favorable", rarity: "common", title: "Bonne fortune", target: [1, 1] },
  { id: "fav_r", type: "favorable", rarity: "rare", title: "Stratège", target: [2, 2] },
  { id: "fav_e", type: "favorable", rarity: "epic", title: "Maître tacticien", target: [3, 3] }
];
