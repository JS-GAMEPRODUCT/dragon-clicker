/**
 * Dragon Clicker
 * Moteur de jeu (IIFE historique — logique encore fortement couplée).
 * Conservé tel quel pour garantir un gameplay identique pendant le refactor.
 */
  /* =========================================================
     DRAGON CLICKER — GAME ENGINE
     Architecture conçue pour évoluer (producteurs, dragons,
     prestige, zones, etc.) sans réécrire le moteur.
     ========================================================= */

  (function () {
    "use strict";
    /* Data extraites vers js/data/*.js (globals) */
    const EXPEDITION_DEFS = window.EXPEDITION_DEFS;
    const DRAGON_DEFS = window.DRAGON_DEFS;
    const EGG_DEFS = window.EGG_DEFS;
    const ZONE_DEFS = window.ZONE_DEFS;
    const PRODUCER_DEFS = window.PRODUCER_DEFS;
    const SHOP_PASSIVE_DEFS = window.SHOP_PASSIVE_DEFS;
    const LEVEL_PASSIVE_DEFS = window.LEVEL_PASSIVE_DEFS;
    const SPECIAL_UPGRADE_DEFS = window.SPECIAL_UPGRADE_DEFS;
    const ZONE_RANK_META = window.ZONE_RANK_META;
    const FAMILY_META = window.FAMILY_META;
    const ACTIVE_UPGRADE_DEFS = window.ACTIVE_UPGRADE_DEFS;
    const EVENT_DEFS = Array.isArray(window.EVENT_DEFS) ? window.EVENT_DEFS : [];
    const EGG_BOSS_DEFS = Array.isArray(window.EGG_BOSS_DEFS) ? window.EGG_BOSS_DEFS : [];
    const EGG_BOSS_MIN_HATCHES = Math.max(0, Math.floor(Number(window.EGG_BOSS_MIN_HATCHES) || 3));
    const EGG_BOSS_SPAWN_CHANCE = Math.max(0, Math.min(1, Number(window.EGG_BOSS_SPAWN_CHANCE != null ? window.EGG_BOSS_SPAWN_CHANCE : 0.15)));
    const EGG_BOSS_PITY = Math.max(1, Math.floor(Number(window.EGG_BOSS_PITY) || 8));
    const EGG_BOSS_COOLDOWN_MS = Math.max(0, Number(window.EGG_BOSS_COOLDOWN_MS) || (15 * 60 * 1000));
    const GUARDIAN_EGG_HATCH_MULT = Math.max(1, Number(window.GUARDIAN_EGG_HATCH_MULT != null ? window.GUARDIAN_EGG_HATCH_MULT : 1.5));
    const EGG_BOSS_RANK_THRESHOLDS = window.EGG_BOSS_RANK_THRESHOLDS || { S: 15, A: 25, B: 40 };
    const EGG_BOSS_RANK_ESSENCE_MULT = window.EGG_BOSS_RANK_ESSENCE_MULT || { S: 3, A: 2.25, B: 1.5, C: 1 };
    const EGG_BOSS_CHEST_CHANCES = window.EGG_BOSS_CHEST_CHANCES || {
      C: { draconic: 0, rare: 0 },
      B: { draconic: 0.1, rare: 0 },
      A: { draconic: 0.2, rare: 0.02 },
      S: { draconic: 0.3, rare: 0.05 }
    };
    const GUARDIAN_EGG_DROP_CHANCE = window.GUARDIAN_EGG_DROP_CHANCE || {
      C: 0.01, B: 0.02, A: 0.04, S: 0.06
    };

    /* -------------------------------------------------------
       CONSTANTS & CONFIG
       ------------------------------------------------------- */
    const SAVE_KEY = "dragonClicker_save_v1";
    const SAVE_VERSION = 16;
    const AUTO_SAVE_MS = 10000;
    /* Empêche un autre onglet (autosave) d’écraser un reset / nouvelle partie. */
    let progressRevision = 0;
    /* Hard safety cap — le vrai plafond joueur vient de getOfflineCapMs (max 4 h). */
    const MAX_OFFLINE_MS = 4 * 60 * 60 * 1000;
    /* Valeurs TOTALES par niveau (pas cumulatives). Index = niveau passif. */
    const OFFLINE_HOURS_BY_LEVEL = [1, 2, 3, 4];
    const OFFLINE_YIELD_BY_LEVEL = [0.05, 0.075, 0.10, 0.125, 0.15];
    const OFFLINE_HOURS_BASE = OFFLINE_HOURS_BY_LEVEL[0];
    const OFFLINE_YIELD_BASE = OFFLINE_YIELD_BY_LEVEL[0];
    const PRICE_GROWTH = 1.15;
    const CRIT_CHANCE_BASE = 0.02;
    const CRIT_MULT_BASE = 10;
    const CRIT_CHANCE_CAP = 0.22;
    /* Progression d'éclosion : séparée de l'Essence (critique économique ≠ critique œuf). */
    const HATCH_CRIT_MULTIPLIER = 1.5;
    const HATCH_CHARGED_MULTIPLIER = 2;
    const CRIT_MULT_CAP = 22;
    /** Cap cumul Éclosion Jumelle (Z2 + Z3) — toujours au plus 1 second dragon. */
    const TWIN_HATCH_CHANCE_CAP = 0.02;
    const BASE_CLICK_POWER = 1;
    /** Hatch progress per manual click (independent from essence gained). */
    const BASE_HATCH_PROGRESS = 1;
    const MAX_PRODUCER_LEVEL = 30;
    const MAX_ACTIVE_LEVEL = 30;
    const PRODUCER_CURVE_EXP = 1.35;
    const COMBO_BASE_MS = 1400;
    const COMBO_TIERS = [
      { at: 10, bonus: 0.02 },
      { at: 25, bonus: 0.04 },
      { at: 50, bonus: 0.06 }
    ];
    const MAX_TOASTS = 4;
    const CPS_WINDOW_MS = 1000;
    const HATCH_HISTORY_MAX = 5;
    const MAX_DRAGON_STARS = 5;
    const TEAM_SIZE = 3;
    const DEFAULT_EXPEDITION_SLOTS = 1;
    const EXPEDITION_CAMP_COST = 15000;
    const EXPEDITION_CAMP_ID = "expeditionCamp";
    /** Legacy power gate (removed) — kept only to grandfather old saves once. */
    const LEGACY_EXPEDITION_UNLOCK_POWER = 2000;
    /* Sélection libre : 1 à 3 dragons pour toute expédition */
    const EXPEDITION_PARTY_MIN = 1;
    const EXPEDITION_PARTY_MAX = 3;

    /* Contrats quotidiens V2 — data dans js/data/contracts.js */
    const CONTRACT_ACTIVE_MAX =
      typeof CONTRACT_DAILY_COUNT === "number" ? CONTRACT_DAILY_COUNT : 3;
    const THREAT_DISCOVERY_CHANCE = 0.10;
    const THREAT_POWER_MULT = 1.65;
    const THREAT_DURATION_MULT = 1.25;
    const THREAT_REWARD_MULT = 1.75;
    const THREAT_DURATION_MIN_MS = 12 * 60 * 1000;
    const THREAT_DURATION_MAX_MS = 3 * 60 * 60 * 1000;

    const EXPEDITION_BASE_POWER = {
      common: 100,
      rare: 250,
      epic: 400,
      legendary: 600,
      mythic: 1500,
      divine: 2500
    };

    const EXPEDITION_STAR_MULT = [1, 1, 1.15, 1.35, 1.6, 2];

    const EXPEDITION_RARITY_REWARD_BONUS = {
      common: 0,
      rare: 0.05,
      epic: 0.07,
      legendary: 0.1,
      mythic: 0.15,
      divine: 0.18
    };

    const EXPEDITION_STAR_REWARD_BONUS = [0, 0, 0.02, 0.04, 0.06, 0.08];

    /* Base fragments granted on each duplicate pull (always 1). */
    const FRAGMENTS_PER_DUPLICATE = 1;
    const FRAGMENTS_BY_RARITY = {
      common: 1,
      rare: 1,
      epic: 1,
      legendary: 1,
      mythic: 1,
      divine: 1
    };

    /* Cumulative fragment cost to reach each star (index = star level). Star 1 = owned.
       Incremental: Common 8/15/25/40 · Rare 5/10/18/30 · Legendary 3/6/12/20 · Mythic 1/2/3/5 */
    const STAR_FRAGMENT_COSTS = {
      common:    [0, 0, 8, 23, 48, 88],
      rare:      [0, 0, 5, 15, 33, 63],
      epic:      [0, 0, 4, 12, 26, 50],
      legendary: [0, 0, 3, 9, 21, 41],
      mythic:    [0, 0, 1, 3, 6, 11],
      divine:    [0, 0, 1, 2, 4, 8]
    };

    /* Cosmetic cave-egg stages (legacy V1 — totalEssenceEarned) */
    const EGG_STAGES = [
      { id: 1, min: 0,     max: 99,     label: "Œuf mystérieux" },
      { id: 2, min: 100,   max: 999,    label: "Œuf fissuré" },
      { id: 3, min: 1000,  max: 9999,   label: "Œuf fortement fissuré" },
      { id: 4, min: 10000, max: Infinity, label: "L'ŒUF A ÉCLOS !" }
    ];

    const NUMBER_SUFFIXES = [
      "", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc"
    ];

    /* Centralized rarities */
    const RARITIES = {
      common:    { id: "common",    label: "Commun",     css: "rarity-common" },
      rare:      { id: "rare",      label: "Rare",       css: "rarity-rare" },
      epic:      { id: "epic",      label: "Épique",     css: "rarity-epic" },
      legendary: { id: "legendary", label: "Légendaire", css: "rarity-legendary" },
      mythic:    { id: "mythic",    label: "Mythique",   css: "rarity-mythic" },
      divine:    { id: "divine",    label: "Divin",      css: "rarity-divine" }
    };

    const FUTURE = {
      secretEggs: true,
      pitySystem: true,
      dragonLevels: null,
      fusion: null,
      prestige: true,
      bosses: true,
      expeditions: true,
      talentTree: true,
      zones: ["sanctuary", "valley", "mountains", "zone4", "royal", "ruins", "peaks", "celestial", "primordial", "divine"],
      quests: [],
      dailyRewards: null,
      eventDragons: [],
      hiddenDragons: [],
      plannedEggs: ["flames", "glacial", "oceanic", "shadow", "celestial", "royal", "cursed", "halloween", "christmas", "secret"],
      plannedBackgrounds: ["fire", "ice", "shadow", "celestial"]
    };

    /**
     * Scene backgrounds registry — only entries with real files.
     * Add new keys when corresponding assets exist.
     */
    const SCENE_BACKGROUNDS = {
      basic: "assets/backgrounds/background.png",
      valley: "assets/backgrounds/background zone 2.png",
      /* Même convention de nommage que Z1/Z2 (background zone N). */
      mountains: "assets/backgrounds/background zone 3.png",
      zone4: "assets/backgrounds/background zone 4.png",
      halloween: "assets/event/halloween/background/background zone halloween.png"
    };

    /* -------------------------------------------------------
       DATA DEFINITIONS
       ------------------------------------------------------- */
    

    /* Boutique one-shots (économie) — hors passifs / spéciaux Améliorations */
    /* Passifs à niveaux / améliorations spéciales / actives : js/data/upgrades.js */

    /* Legacy one-shot upgrade IDs kept for migration only */
    const LEGACY_UPGRADE_IDS = [
      "steadyClaw", "focusedStrike", "keenEye", "ironTalon", "risingHeat",
      "sharpCrit", "luckySpark", "thriftyNest", "fragmentSense", "deepSleep",
      "steadyCrit", "temperedStrike"
    ];

    const ACHIEVEMENT_CATEGORIES = [
      { id: "all", label: "Tous" },
      { id: "clicks", label: "Clics" },
      { id: "hatches", label: "Éclosions" },
      { id: "collection", label: "Collection" },
      { id: "stars", label: "Étoiles" },
      { id: "economy", label: "Économie" },
      { id: "crits", label: "Critiques" },
      { id: "expeditions", label: "Expéditions" },
      { id: "progress", label: "Progression" }
    ];

    /* Anciens IDs → nouveaux (sauvegardes pré-refonte) */
    const LEGACY_ACHIEVEMENT_UNLOCK_MAP = {
      beginning: "clicks_100",
      clickAddict: "clicks_1000",
      goldMountain: "essence_100k",
      birth: "hatch_1",
      hatchTen: "hatch_10",
      discoverThree: "collection_3",
      fiveStar: "stars_5",
      explorer: "progress_zone2",
      critHunter: "crits_25"
    };

    const ACHIEVEMENT_DEFS = [
      /* CLICS */
      { id: "clicks_100", category: "clicks", name: "Premier contact", icon: "👆", description: "Effectuer 100 clics", target: 100, progressKey: "totalClicks", rewardEssence: 250 },
      { id: "clicks_1000", category: "clicks", name: "Apprenti du clic", icon: "👆", description: "Effectuer 1 000 clics", target: 1000, progressKey: "totalClicks", rewardEssence: 1000 },
      { id: "clicks_5000", category: "clicks", name: "Griffes rapides", icon: "⚡", description: "Effectuer 5 000 clics", target: 5000, progressKey: "totalClicks", rewardEssence: 5000 },
      { id: "clicks_15000", category: "clicks", name: "Maître du clic", icon: "🔥", description: "Effectuer 15 000 clics", target: 15000, progressKey: "totalClicks", rewardEssence: 15000 },
      { id: "clicks_50000", category: "clicks", name: "Frénésie draconique", icon: "💥", description: "Effectuer 50 000 clics", target: 50000, progressKey: "totalClicks", rewardEssence: 75000 },
      /* ÉCLOSIONS */
      { id: "hatch_1", category: "hatches", name: "Première naissance", icon: "🥚", description: "Faire éclore 1 dragon", target: 1, progressKey: "totalEggsHatched", rewardEssence: 250 },
      { id: "hatch_10", category: "hatches", name: "Petit éleveur", icon: "🐣", description: "Faire éclore 10 dragons", target: 10, progressKey: "totalEggsHatched", rewardEssence: 1500 },
      { id: "hatch_50", category: "hatches", name: "Éleveur confirmé", icon: "🐉", description: "Faire éclore 50 dragons", target: 50, progressKey: "totalEggsHatched", rewardEssence: 7500 },
      { id: "hatch_100", category: "hatches", name: "Maître éleveur", icon: "🐉", description: "Faire éclore 100 dragons", target: 100, progressKey: "totalEggsHatched", rewardEssence: 20000 },
      { id: "hatch_250", category: "hatches", name: "Lignée infinie", icon: "✨", description: "Faire éclore 250 dragons", target: 250, progressKey: "totalEggsHatched", rewardEssence: 75000 },
      /* COLLECTION (31 dragons non-secrets) */
      { id: "collection_3", category: "collection", name: "Première rencontre", icon: "🐲", description: "Découvrir 3 dragons différents", target: 3, progressKey: "ownedDragons", rewardEssence: 500 },
      { id: "collection_6", category: "collection", name: "Collection naissante", icon: "📚", description: "Découvrir 6 dragons différents", target: 6, progressKey: "ownedDragons", rewardEssence: 2000 },
      { id: "collection_12", category: "collection", name: "Dracologue", icon: "📖", description: "Découvrir 12 dragons différents", target: 12, progressKey: "ownedDragons", rewardEssence: 10000 },
      { id: "collection_20", category: "collection", name: "Grand collectionneur", icon: "🏅", description: "Découvrir 20 dragons différents", target: 20, progressKey: "ownedDragons", rewardEssence: 40000 },
      { id: "collection_30", category: "collection", name: "Encyclopédie vivante", icon: "👑", description: "Découvrir 30 dragons différents", target: 30, progressKey: "ownedDragons", rewardEssence: 150000 },
      /* ÉTOILES */
      { id: "stars_2", category: "stars", name: "Première évolution", icon: "⭐", description: "Faire atteindre ★2 à un dragon", target: 1, progressKey: "hasStars2", rewardEssence: 1000 },
      { id: "stars_5", category: "stars", name: "Dragon accompli", icon: "⭐", description: "Faire atteindre ★5 à un dragon", target: 1, progressKey: "hasStars5", rewardEssence: 10000 },
      { id: "stars_total_10", category: "stars", name: "Constellation", icon: "🌟", description: "Posséder 10 étoiles cumulées", target: 10, progressKey: "totalStars", rewardEssence: 5000 },
      { id: "stars_total_25", category: "stars", name: "Ciel draconique", icon: "🌌", description: "Posséder 25 étoiles cumulées", target: 25, progressKey: "totalStars", rewardEssence: 30000 },
      { id: "stars_total_50", category: "stars", name: "Maître des étoiles", icon: "💫", description: "Posséder 50 étoiles cumulées", target: 50, progressKey: "totalStars", rewardEssence: 125000 },
      /* ÉCONOMIE — Essence totale gagnée */
      { id: "essence_10k", category: "economy", name: "Première fortune", icon: "✨", description: "Gagner au total 10 000 Essence", target: 10000, progressKey: "totalEssenceEarned", rewardEssence: 500 },
      { id: "essence_100k", category: "economy", name: "Trésor draconique", icon: "💎", description: "Gagner au total 100 000 Essence", target: 100000, progressKey: "totalEssenceEarned", rewardEssence: 3000 },
      { id: "essence_1m", category: "economy", name: "Millionnaire draconique", icon: "💰", description: "Gagner au total 1 000 000 Essence", target: 1000000, progressKey: "totalEssenceEarned", rewardEssence: 15000 },
      { id: "essence_10m", category: "economy", name: "Grand trésor", icon: "🏦", description: "Gagner au total 10 000 000 Essence", target: 10000000, progressKey: "totalEssenceEarned", rewardEssence: 75000 },
      { id: "essence_50m", category: "economy", name: "Fortune légendaire", icon: "🏆", description: "Gagner au total 50 000 000 Essence", target: 50000000, progressKey: "totalEssenceEarned", rewardEssence: 300000 },
      /* CRITIQUES */
      { id: "crits_25", category: "crits", name: "Coup précis", icon: "🎯", description: "Effectuer 25 critiques", target: 25, progressKey: "totalCriticalClicks", rewardEssence: 500 },
      { id: "crits_250", category: "crits", name: "Instinct draconique", icon: "🗡️", description: "Effectuer 250 critiques", target: 250, progressKey: "totalCriticalClicks", rewardEssence: 3000 },
      { id: "crits_1000", category: "crits", name: "Prédateur", icon: "🦅", description: "Effectuer 1 000 critiques", target: 1000, progressKey: "totalCriticalClicks", rewardEssence: 15000 },
      { id: "crits_5000", category: "crits", name: "Tempête critique", icon: "⛈️", description: "Effectuer 5 000 critiques", target: 5000, progressKey: "totalCriticalClicks", rewardEssence: 75000 },
      /* EXPÉDITIONS */
      { id: "exp_1", category: "expeditions", name: "Premier voyage", icon: "🧭", description: "Terminer 1 expédition", target: 1, progressKey: "totalExpeditionsCompleted", rewardEssence: 1000 },
      { id: "exp_10", category: "expeditions", name: "Explorateur", icon: "🗺️", description: "Terminer 10 expéditions", target: 10, progressKey: "totalExpeditionsCompleted", rewardEssence: 10000 },
      { id: "exp_25", category: "expeditions", name: "Aventurier", icon: "⛺", description: "Terminer 25 expéditions", target: 25, progressKey: "totalExpeditionsCompleted", rewardEssence: 30000 },
      { id: "exp_50", category: "expeditions", name: "Maître explorateur", icon: "🏔️", description: "Terminer 50 expéditions", target: 50, progressKey: "totalExpeditionsCompleted", rewardEssence: 100000 },
      { id: "exp_100", category: "expeditions", name: "Légende des terres sauvages", icon: "🌄", description: "Terminer 100 expéditions", target: 100, progressKey: "totalExpeditionsCompleted", rewardEssence: 300000 },
      /* PROGRESSION — déblocage zones */
      { id: "progress_zone2", category: "progress", name: "Nouveau Royaume", icon: "🚪", description: "Débloquer Zone 2", target: 1, progressKey: "zoneValley", rewardEssence: 10000 },
      { id: "progress_zone3", category: "progress", name: "Vers les sommets", icon: "⛰️", description: "Débloquer Zone 3", target: 1, progressKey: "zoneMountains", rewardEssence: 75000 }
    ];

    /**
     * Zone catalog — js/data/zones.js
     * World map pages (assets/backgrounds/worldpart1–3.png).
     * Each page shows a group of zones; markers use % positions on that page.
     */
    const WORLD_MAP_PAGES = [
      {
        id: 1,
        image: "assets/backgrounds/worldpart1.png",
        zoneIndexes: [1, 2, 3],
        positions: {
          1: { x: 26.5, y: 34.0 },
          2: { x: 49.5, y: 54.5 },
          3: { x: 74.0, y: 40.5 }
        }
      },
      {
        id: 2,
        image: "assets/backgrounds/worldpart2.png",
        zoneIndexes: [4, 5, 6],
        positions: {
          4: { x: 23.5, y: 46.0 },
          5: { x: 50.0, y: 52.0 },
          6: { x: 76.5, y: 48.5 }
        }
      },
      {
        id: 3,
        image: "assets/backgrounds/worldpart3.png",
        zoneIndexes: [7, 8, 9, 10],
        positions: {
          7: { x: 22.0, y: 52.0 },
          8: { x: 49.5, y: 46.5 },
          9: { x: 76.0, y: 50.0 },
          10: { x: 50.0, y: 76.0 }
        }
      }
    ];

    /* Compat: first page image + flat positions (page-relative %). */
    const WORLD_MAP_IMAGE = WORLD_MAP_PAGES[0].image;

    const ZONE_MAP_POSITIONS = (function buildZoneMapPositions() {
      const out = {};
      WORLD_MAP_PAGES.forEach((page) => {
        Object.keys(page.positions).forEach((key) => {
          const pos = page.positions[key];
          out[key] = { x: pos.x, y: pos.y, page: page.id };
        });
      });
      return out;
    })();

    let currentWorldPage = 0;
    let worldPagesBuilt = false;
    let worldSwipeStartX = null;
    let worldSwipeStartY = null;

    /* -------------------------------------------------------
       EGGS & DRAGONS DEFINITIONS (extensible catalogs)
       ------------------------------------------------------- */
    const ELEMENT_LABELS = {
      neutral: "Neutre",
      fire: "Feu",
      ice: "Glace",
      lightning: "Foudre",
      shadow: "Ombre",
      celestial: "Céleste",
      water: "Eau",
      nature: "Nature"
    };

    /**
     * Global dragon / egg catalogs — js/data/dragons.js
     */

    /* -------------------------------------------------------
       GAME STATE
       ------------------------------------------------------- */
    function createEmptyEggProgress() {
      const eggs = {};
      EGG_DEFS.forEach((e) => {
        eggs[e.id] = {
          unlocked: !!e.startUnlocked,
          progress: 0,
          timesHatched: 0,
          crackSoundPlayed: false,
          pityCounters: { sinceLegendary: 0, sinceMythic: 0 }
        };
      });
      return eggs;
    }

    function createEmptyDragonProgress() {
      const dragons = {};
      DRAGON_DEFS.forEach((d) => {
        dragons[d.id] = {
          owned: false,
          obtainedAt: null,
          timesObtained: 0,
          fragments: 0,
          stars: 0
        };
      });
      return dragons;
    }

    function createEmptyRarityStats() {
      return { common: 0, rare: 0, epic: 0, legendary: 0, mythic: 0, divine: 0 };
    }

    function countOwnedDragons(state) {
      let n = 0;
      const dragons = (state && state.dragons) || {};
      Object.keys(dragons).forEach((id) => {
        if (isDragonDiscovered(dragons[id], id, state)) n++;
      });
      return n;
    }

    /**
     * Single source of truth for bestiary discovery.
     * `owned` is canonical; other fields heal legacy / desynced saves.
     */
    function isDragonDiscovered(entry, dragonId, state) {
      state = state || gameState;
      if (!entry && state && state.dragons) entry = state.dragons[dragonId];
      if (entry) {
        if (entry.owned === true || entry.owned === 1 || entry.owned === "true") return true;
        if (entry.discovered === true || entry.discovered === 1) return true;
        if (safeNumber(entry.timesObtained, 0) >= 1) return true;
        if (entry.obtainedAt || entry.firstDiscoveredAt || entry.discoveredAt) return true;
        if (safeNumber(entry.fragments, 0) > 0) return true;
        if (safeNumber(entry.stars, 0) >= 1) return true;
      }
      if (state && state.meta && Array.isArray(state.meta.collectedDragons)) {
        if (state.meta.collectedDragons.indexOf(dragonId) !== -1) return true;
      }
      if (state && Array.isArray(state.hatchHistory)) {
        for (let i = 0; i < state.hatchHistory.length; i++) {
          if (state.hatchHistory[i] && state.hatchHistory[i].dragonId === dragonId) return true;
        }
      }
      return false;
    }

    function ensureDragonEntry(dragonId, state) {
      state = state || gameState;
      if (!state.dragons) state.dragons = {};
      if (!state.dragons[dragonId] || typeof state.dragons[dragonId] !== "object") {
        state.dragons[dragonId] = {
          owned: false,
          obtainedAt: null,
          timesObtained: 0,
          fragments: 0,
          stars: 0
        };
      }
      return state.dragons[dragonId];
    }

    /** Force canonical owned=true when discovery evidence exists. */
    function markDragonDiscovered(dragonId, state, meta) {
      state = state || gameState;
      meta = meta || {};
      const entry = ensureDragonEntry(dragonId, state);
      const wasNew = !entry.owned;
      entry.owned = true;
      if (safeNumber(entry.timesObtained, 0) < 1) {
        entry.timesObtained = Math.max(1, safeNumber(meta.timesObtained, 1));
      }
      if (!entry.obtainedAt) {
        entry.obtainedAt = meta.obtainedAt || meta.at || Date.now();
      }
      if (!entry.stars || entry.stars < 1) entry.stars = Math.max(1, safeNumber(entry.stars, 1));
      if (!state.meta) state.meta = { collectedDragons: [], flags: {} };
      if (!Array.isArray(state.meta.collectedDragons)) state.meta.collectedDragons = [];
      if (state.meta.collectedDragons.indexOf(dragonId) === -1) {
        state.meta.collectedDragons.push(dragonId);
      }
      return { entry: entry, wasNew: wasNew };
    }

    function normalizeAllDragonDiscoveries(state) {
      state = state || gameState;
      if (!state.dragons) state.dragons = createEmptyDragonProgress();

      /* Heal from hatch history first (authoritative list of past pulls). */
      (state.hatchHistory || []).forEach((h) => {
        if (!h || !h.dragonId || !getDragonDef(h.dragonId)) return;
        markDragonDiscovered(h.dragonId, state, { obtainedAt: h.at, timesObtained: 1 });
      });

      /* Heal from collectedDragons list. */
      if (state.meta && Array.isArray(state.meta.collectedDragons)) {
        state.meta.collectedDragons.forEach((id) => {
          if (getDragonDef(id)) markDragonDiscovered(id, state);
        });
      }

      /* Heal each catalog entry from its own fields. */
      DRAGON_DEFS.forEach((d) => {
        const entry = ensureDragonEntry(d.id, state);
        if (isDragonDiscovered(entry, d.id, state)) {
          markDragonDiscovered(d.id, state);
        }
      });
    }

    function refreshDragonCollectionUI() {
      normalizeAllDragonDiscoveries(gameState);
      dragonsDirty = true;
      renderDragons();
      /* Keep pool modal in sync if open */
      const poolModal = document.getElementById("pool-modal");
      if (poolModal && !poolModal.classList.contains("hidden")) {
        openPoolModal();
      }
    }

    function getCatalogDragonCount() {
      return DRAGON_DEFS.filter((d) => !d.secret).length;
    }

    function getZoneDef(id) {
      return ZONE_DEFS.find((z) => z.id === id) || ZONE_DEFS[0];
    }

    function isZoneUnlocked(state, zoneId) {
      const s = state || gameState;
      const list = s.unlockedZones || (s.meta && s.meta.unlockedZones) || [];
      return list.indexOf(zoneId) !== -1;
    }

    function getCurrentZone() {
      const id = gameState.currentZoneId || "sanctuary";
      return getZoneDef(id);
    }

    /**
     * Zone utilisée pour boutique / améliorations.
     * Les zones eventOnly n'ont pas de producteurs : on garde l'économie
     * de la dernière zone permanente (meta.returnZoneId) ou du plus haut unlock.
     */
    function getEconomyZoneId() {
      const zone = getCurrentZone();
      if (!zone || !zone.eventOnly) return zone ? zone.id : "sanctuary";
      const ret = gameState.meta && gameState.meta.returnZoneId;
      if (ret && isZoneUnlocked(gameState, ret)) {
        const retZone = getZoneDef(ret);
        if (retZone && !retZone.eventOnly) return ret;
      }
      const order = ["mountains", "valley", "sanctuary"];
      for (let i = 0; i < order.length; i++) {
        if (isZoneUnlocked(gameState, order[i])) return order[i];
      }
      return "sanctuary";
    }

    function rememberReturnZoneBeforeEvent() {
      if (!gameState.meta) gameState.meta = {};
      const cur = gameState.currentZoneId || "sanctuary";
      const curZone = getZoneDef(cur);
      if (curZone && !curZone.eventOnly) {
        gameState.meta.returnZoneId = cur;
      }
    }

    /** Débloque une zone événement (date atteinte ou code) — sans Essence. */
    function grantEventZoneAccess(zoneId, opts) {
      opts = opts || {};
      const zone = getZoneDef(zoneId);
      if (!zone) return false;
      if (isZoneUnlocked(gameState, zoneId)) {
        unlockZoneEggs(zoneId);
        return false;
      }
      if (!gameState.unlockedZones) gameState.unlockedZones = ["sanctuary"];
      if (gameState.unlockedZones.indexOf(zoneId) === -1) {
        gameState.unlockedZones.push(zoneId);
      }
      if (!gameState.meta) gameState.meta = {};
      gameState.meta.unlockedZones = gameState.unlockedZones.slice();
      unlockZoneEggs(zoneId);
      shopDirty = true;
      zonesDirty = true;
      eggsDirty = true;
      dragonsDirty = true;
      uiDirty = true;
      if (!opts.silent) {
        showNotification("🎃 Événement", "Zone Halloween débloquée !");
        playSound("zoneUnlock");
      }
      return true;
    }

    /** Auto-débloque les zones événement dont la date de début est atteinte. */
    function ensureSeasonalEventZones() {
      let changed = false;
      getEventDefs().forEach((ev) => {
        if (!ev || !ev.zoneId) return;
        const start = getEventStartDate(ev);
        if (!start || Date.now() < start.getTime()) return;
        if (grantEventZoneAccess(ev.zoneId, { silent: true })) changed = true;
      });
      if (changed) saveGame(true);
    }

    function isEventZonePlayable(ev) {
      if (!ev || !ev.zoneId) return !!ev && !!ev.accessible;
      return isZoneUnlocked(gameState, ev.zoneId);
    }

    function enterEventZone(ev) {
      if (!ev || !ev.zoneId) return;
      if (!isEventZonePlayable(ev)) {
        showNotification(
          (ev.icon ? ev.icon + " " : "") + (ev.name || "Événement"),
          "Zone verrouillée — utilisez un code ou attendez l'ouverture."
        );
        playSound("error");
        return;
      }
      rememberReturnZoneBeforeEvent();
      enterZoneFromMap(ev.zoneId);
    }

    function countZonePoolDiscovered(state, zoneId) {
      const zone = getZoneDef(zoneId);
      if (!zone) return 0;
      let n = 0;
      (zone.eggIds || []).forEach((eggId) => {
        const egg = getEggDef(eggId);
        (egg && egg.dragonPool || []).forEach((entry) => {
          if (isDragonDiscovered(null, entry.dragonId, state)) n++;
        });
      });
      return n;
    }

    function hasDragonAtStars(state, minStars) {
      const dragons = (state && state.dragons) || {};
      return Object.keys(dragons).some((id) => {
        const e = dragons[id];
        return isDragonDiscovered(e, id, state) && safeNumber(e.stars, 0) >= minStars;
      });
    }

    function getStarFragmentCostTable(rarity) {
      return STAR_FRAGMENT_COSTS[rarity] || STAR_FRAGMENT_COSTS.common;
    }

    function getFragmentsForNextStar(def, entry) {
      if (!def || !isDragonDiscovered(entry, def.id)) return null;
      const stars = Math.max(1, safeNumber(entry.stars, 1));
      if (stars >= MAX_DRAGON_STARS) return null;
      const table = getStarFragmentCostTable(def.rarity);
      const nextTotal = table[stars + 1];
      if (nextTotal == null) return null;
      const prevTotal = table[stars] || 0;
      const cost = Math.max(1, nextTotal - prevTotal);
      return { fromStar: stars, toStar: stars + 1, cost: cost };
    }

    function tryUpgradeDragonStar(dragonId) {
      const def = getDragonDef(dragonId);
      const entry = gameState.dragons[dragonId];
      if (!def || !isDragonDiscovered(entry, dragonId)) return false;
      const next = getFragmentsForNextStar(def, entry);
      if (!next) return false;
      if (safeNumber(entry.fragments, 0) < next.cost) return false;
      entry.fragments -= next.cost;
      entry.stars = next.toStar;
      calculateProduction();
      dragonsDirty = true;
      uiDirty = true;
      calculateDragonPower();
      renderTeamModule();
      showNotification("⭐ Évolution", def.name + " passe à " + "★".repeat(entry.stars) + " !");
      playSound("star");
      checkAchievements();
      saveGame(true);
      return true;
    }

    function normalizeDragonBonusType(type) {
      const map = {
        manualClick: "clickPowerPercent",
        clickPct: "clickPowerPercent",
        globalProdPct: "essenceProductionPercent",
        criticalChance: "critChanceFlatPercent",
        critChance: "critChanceFlatPercent",
        fragmentYield: "fragmentGainPercent",
        fragmentMult: "fragmentGainPercent",
        clickGainPercent: "clickEssencePercent",
        gainsAuClic: "clickEssencePercent",
        essenceGlobal: "essenceGlobalPercent",
        clickFlat: "clickPowerFlat",
        essenceFlat: "essenceProductionFlat",
        essencePerSecFlat: "essenceProductionFlat"
      };
      return map[type] || type;
    }

    function isDragonBonusFlatType(type) {
      const t = normalizeDragonBonusType(type);
      return t === "clickPowerFlat" || t === "essenceProductionFlat";
    }

    function getDragonBonusDisplayLabel(type) {
      const labels = {
        clickPowerPercent: "Puissance de clic",
        clickPowerFlat: "Puissance de clic",
        clickEssencePercent: "Gains au clic",
        essenceProductionPercent: "Essence/sec",
        essenceProductionFlat: "Essence/sec",
        essenceGlobalPercent: "Essence globale",
        critChanceFlatPercent: "Chance critique",
        fragmentGainPercent: "Fragments obtenus",
        duplicateBonusFragmentChance: "Fragment supplémentaire à l'éclosion d'un doublon",
        expeditionReward: "Récompenses d'expédition",
        rarityLuck: "Chance Draconique",
        offlineMult: "Rendement hors ligne"
      };
      return labels[normalizeDragonBonusType(type)] || "";
    }

    /** One or many bonus entries from dragon data (`bonus` or `bonuses`). */
    function getDragonBonusDefs(def) {
      if (!def) return [];
      if (Array.isArray(def.bonuses) && def.bonuses.length) return def.bonuses.filter(Boolean);
      if (def.bonus) return [def.bonus];
      return [];
    }

    /**
     * Valeur gameplay d'un bonus à N étoiles.
     * *Percent : values[] en points de % → fraction ( / 100 ).
     * *Flat : values[] brutes (click flat ou Essence/sec).
     */
    function getDragonBonusEntryValue(bonusEntry, stars) {
      const b = bonusEntry;
      if (!b) return 0;
      const s = Math.max(1, Math.min(MAX_DRAGON_STARS, Math.floor(safeNumber(stars, 1))));
      const flat = isDragonBonusFlatType(b.type);
      if (Array.isArray(b.values) && b.values.length) {
        const raw = safeNumber(b.values[s - 1], 0);
        return flat ? raw : raw / 100;
      }
      if (Array.isArray(b.valuesByStars)) return safeNumber(b.valuesByStars[s], 0);
      return safeNumber(b.base, 0) + Math.max(0, s - 1) * safeNumber(b.perStar, 0);
    }

    /** @deprecated Prefer getDragonBonusEntryValue — kept for single-bonus callers. */
    function getDragonBonusValue(def, stars) {
      const list = getDragonBonusDefs(def);
      return list.length ? getDragonBonusEntryValue(list[0], stars) : 0;
    }

    function getDragonActiveBonus(def, stars) {
      const list = getDragonBonusDefs(def);
      if (!list.length) return null;
      const b = list[0];
      const type = normalizeDragonBonusType(b.type);
      return {
        type: type,
        name: b.name || "",
        description: b.description || "",
        label: getDragonBonusDisplayLabel(type),
        value: getDragonBonusEntryValue(b, stars)
      };
    }

    function getDragonActiveBonuses(def, stars) {
      return getDragonBonusDefs(def).map((b) => {
        const type = normalizeDragonBonusType(b.type);
        return {
          type: type,
          name: b.name || "",
          description: b.description || "",
          label: getDragonBonusDisplayLabel(type),
          value: getDragonBonusEntryValue(b, stars)
        };
      }).filter((b) => b.value > 0 || b.type);
    }

    function formatBonusPercent(value, digits) {
      const pct = value * 100;
      if (!Number.isFinite(pct)) return "0";
      let text;
      if (digits != null) {
        text = Number(pct.toFixed(digits)).toString();
      } else if (Math.abs(pct - Math.round(pct)) < 1e-9) {
        text = String(Math.round(pct));
      } else {
        text = pct.toFixed(2).replace(/\.?0+$/, "");
      }
      return text.replace(".", ",");
    }

    function formatDragonBonusAmount(type, value) {
      const t = normalizeDragonBonusType(type);
      if (t === "clickPowerFlat") return "+" + formatNumber(value);
      if (t === "essenceProductionFlat") return "+" + formatNumber(value) + "/s";
      return "+" + formatBonusPercent(value) + " %";
    }

    function formatOneDragonBonusLine(bonusEntry, stars, opts) {
      opts = opts || {};
      const value = getDragonBonusEntryValue(bonusEntry, stars);
      if (value <= 0) return "";
      const type = normalizeDragonBonusType(bonusEntry.type);
      if (type === "duplicateBonusFragmentChance") {
        const pct = formatBonusPercent(value);
        return opts.compact
          ? pct + " % chance +1 fragment doublon"
          : pct + " % de chance d'obtenir +1 fragment à l'éclosion d'un doublon";
      }
      const label = getDragonBonusDisplayLabel(type);
      const amount = formatDragonBonusAmount(type, value);
      if (label) return label + " " + amount;
      return amount;
    }

    function formatDragonBonusNextLine(def, nextStars) {
      const lines = getDragonBonusDefs(def)
        .map((b) => {
          const value = getDragonBonusEntryValue(b, nextStars);
          if (value <= 0) return "";
          const type = normalizeDragonBonusType(b.type);
          if (type === "duplicateBonusFragmentChance") return formatBonusPercent(value) + " %";
          return formatOneDragonBonusLine(b, nextStars);
        })
        .filter(Boolean);
      if (!lines.length) return "";
      return "Prochaine étoile : " + lines.join(" · ");
    }

    function getFragmentYieldRate(state) {
      const st = state || gameState;
      const teamYield = safeNumber(st.multipliers?.fragmentYield, 0);
      const shopExtra = Math.max(0, safeNumber(st.multipliers?.fragmentMult, 1) - 1);
      return teamYield + shopExtra;
    }

    /**
     * Grant integer fragments, then accrue fractional yield into a hidden accumulator.
     * Bonus fragments from the accumulator do NOT re-trigger yield.
     */
    function grantDragonFragments(dragonId, baseAmount, options) {
      const opts = options || {};
      const entry = gameState.dragons[dragonId];
      if (!entry || !isDragonDiscovered(entry, dragonId, gameState)) {
        return { base: 0, bonus: 0, total: 0 };
      }
      const base = Math.max(0, Math.floor(safeNumber(baseAmount, 0)));
      if (base <= 0) return { base: 0, bonus: 0, total: 0 };

      entry.fragments = safeNumber(entry.fragments, 0) + base;
      let bonus = 0;
      if (opts.applyYield !== false) {
        const rate = getFragmentYieldRate();
        if (rate > 0) {
          gameState.fragmentBonusAccumulator = safeNumber(gameState.fragmentBonusAccumulator, 0) + base * rate;
          bonus = Math.floor(gameState.fragmentBonusAccumulator);
          if (bonus > 0) {
            gameState.fragmentBonusAccumulator -= bonus;
            entry.fragments += bonus;
          }
        }
      }
      return { base: base, bonus: bonus, total: base + bonus };
    }

    function describeZoneRequirement(req) {
      if (!req) return "";
      if (req.type === "eggsHatched") return "Éclore au moins " + req.value + " œufs";
      if (req.type === "dragonsDiscovered") return "Découvrir au moins " + req.value + " dragons";
      if (req.type === "zoneDragons") {
        return "Découvrir au moins " + req.value + " dragons de la zone";
      }
      if (req.type === "producerOwned") {
        const p = PRODUCER_DEFS.find((x) => x.id === req.producerId);
        return "Posséder " + (p ? p.name : req.producerId) + " (niv. ≥ " + req.value + ")";
      }
      if (req.type === "zoneSpent") {
        const z = getZoneDef(req.zoneId || "sanctuary");
        return "Investir " + formatNumber(req.value) + " Essence dans " + (z ? z.name : "la zone");
      }
      if (req.type === "totalEssence") {
        return "Gagner au moins " + formatNumber(req.value) + " Essence au total";
      }
      if (req.type === "totalPower" || req.type === "dragonPower") {
        return "Avoir une Puissance Draconique de " + formatNumber(req.value);
      }
      if (req.type === "eventAccess") {
        return "Accès événement requis";
      }
      return req.type + " ≥ " + req.value;
    }

    function checkZoneRequirements(zone, state) {
      const s = state || gameState;
      const reqs = zone.unlockRequirements || [];
      const results = reqs.map((req) => {
        let ok = true;
        let current = 0;
        if (req.type === "eggsHatched") {
          current = safeNumber(s.totalEggsHatched, 0);
          ok = current >= req.value;
        } else if (req.type === "dragonsDiscovered") {
          current = countOwnedDragons(s);
          ok = current >= req.value;
        } else if (req.type === "zoneDragons") {
          current = countZonePoolDiscovered(s, req.zoneId || "sanctuary");
          ok = current >= req.value;
        } else if (req.type === "producerOwned") {
          current = safeNumber(s.producers?.[req.producerId]?.owned, 0);
          ok = current >= req.value;
        } else if (req.type === "zoneSpent") {
          current = getZoneSpent(req.zoneId || "sanctuary", s);
          ok = current >= req.value;
        } else if (req.type === "totalEssence") {
          current = safeNumber(s.totalEssenceEarned, 0);
          ok = current >= req.value;
        } else if (req.type === "totalPower" || req.type === "dragonPower") {
          current = calculateDragonPower(s);
          ok = current >= req.value;
        } else if (req.type === "eventAccess") {
          /* Jamais via Débloquer Monde — code bonus / date d'événement uniquement. */
          current = 0;
          ok = false;
        }
        return { req: req, ok: ok, current: current, label: describeZoneRequirement(req) };
      });
      return {
        ok: results.every((r) => r.ok),
        results: results
      };
    }

    function canUnlockZone(zoneId) {
      const zone = getZoneDef(zoneId);
      if (!zone || zone.startUnlocked) return { ok: false, reason: "invalid", reqs: checkZoneRequirements(zone || ZONE_DEFS[0]) };
      if (zone.comingSoon) return { ok: false, reason: "comingSoon", reqs: checkZoneRequirements(zone) };
      if (zone.eventOnly) return { ok: false, reason: "eventOnly", reqs: checkZoneRequirements(zone) };
      const reqs = checkZoneRequirements(zone);
      if (isZoneUnlocked(gameState, zoneId)) {
        return { ok: false, reason: "already", reqs: reqs, cost: zone.unlockCost, canPay: true };
      }
      const cost = safeNumber(zone.unlockCost, 0);
      const canPay = gameState.dragonEssence >= cost;
      return {
        ok: reqs.ok && canPay,
        reqs: reqs,
        cost: cost,
        canPay: canPay
      };
    }

    function unlockZoneEggs(zoneId, state) {
      const s = state || gameState;
      const zone = getZoneDef(zoneId);
      if (!zone || !s.eggs) return;
      (zone.eggIds || []).forEach((eggId) => {
        if (!s.eggs[eggId]) {
          s.eggs[eggId] = {
            unlocked: true,
            progress: 0,
            timesHatched: 0,
            crackSoundPlayed: false,
            pityCounters: { sinceLegendary: 0, sinceMythic: 0 }
          };
        } else {
          s.eggs[eggId].unlocked = true;
        }
      });
    }

    /**
     * Axe horizontal officiel = centre du logo .game-logo.
     * 1) Aligne .egg-stage sous le logo (--game-center-x dans #panel-kingdom).
     * 2) En mode carrousel, affine .egg-hero via --carousel-offset-x
     *    pour que le WRAPPER (actif + secondaires) soit un seul bloc centré.
     */
    function updateGameCenterAxis() {
      const logo =
        document.querySelector(".header-logo-wrap .game-logo") ||
        document.querySelector(".game-logo");
      const kingdom = document.getElementById("panel-kingdom");
      const app = document.getElementById("app");
      const stage = document.getElementById("egg-stage");
      const hero = stage && stage.querySelector(".egg-hero");
      if (!logo || !kingdom) return false;

      const logoRect = logo.getBoundingClientRect();
      if (logoRect.width < 2 || logoRect.height < 2) return false;

      const parentRect = kingdom.getBoundingClientRect();
      if (parentRect.width < 2) return false;

      const logoCenterX = logoRect.left + logoRect.width / 2;
      const localCenterX = logoCenterX - parentRect.left;
      const px = (Math.round(localCenterX * 100) / 100) + "px";

      kingdom.style.setProperty("--game-center-x", px);
      if (app) app.style.setProperty("--game-center-x", px);

      /*
        Offset global UNIQUE du wrapper (.egg-hero).
        0 = le hero est déjà centré dans .egg-stage (aligné logo).
      */
      if (hero) {
        hero.style.setProperty("--carousel-offset-x", "0px");
      }
      return true;
    }

    let gameCenterAxisRaf = 0;
    let gameCenterAxisResizeTimer = 0;

    function scheduleUpdateGameCenterAxis() {
      if (gameCenterAxisRaf) cancelAnimationFrame(gameCenterAxisRaf);
      gameCenterAxisRaf = requestAnimationFrame(() => {
        gameCenterAxisRaf = 0;
        updateGameCenterAxis();
        requestAnimationFrame(updateGameCenterAxis);
      });
    }

    function markZoneVisited(zoneId) {
      if (!Array.isArray(gameState.visitedZones)) gameState.visitedZones = ["sanctuary"];
      if (gameState.visitedZones.indexOf(zoneId) === -1) {
        gameState.visitedZones.push(zoneId);
      }
    }

    function isZoneVisited(zoneId) {
      const list = gameState.visitedZones || [];
      return list.indexOf(zoneId) !== -1;
    }

    function unlockZone(zoneId) {
      const check = canUnlockZone(zoneId);
      const zone = getZoneDef(zoneId);
      if (!check.ok || !zone) {
        showNotification("🗺️ Zone", check.canPay === false ? "Essence insuffisante." : "Conditions non remplies.");
        return false;
      }
      if (!spendEssence(check.cost)) return false;
      calculateDragonPower();
      if (!gameState.unlockedZones) gameState.unlockedZones = ["sanctuary"];
      if (gameState.unlockedZones.indexOf(zoneId) === -1) {
        gameState.unlockedZones.push(zoneId);
      }
      gameState.meta.unlockedZones = gameState.unlockedZones.slice();
      unlockZoneEggs(zoneId);
      showNotification("🗺️ Zone débloquée", zone.name);
      playSound("zoneUnlock");
      checkAchievements();
      shopDirty = true;
      zonesDirty = true;
      eggsDirty = true;
      dragonsDirty = true;
      uiDirty = true;
      saveGame(true);
      renderZones();
      renderDragons();
      return true;
    }

    function selectZone(zoneId) {
      if (!isZoneUnlocked(gameState, zoneId)) {
        showNotification("🗺️ Zone", "Cette zone est verrouillée.");
        return;
      }
      gameState.currentZoneId = zoneId;
      markZoneVisited(zoneId);
      const zone = getZoneDef(zoneId);
      const eggs = zone.eggIds || [];
      if (eggs.length) {
        unlockZoneEggs(zoneId);
        ensureZoneEggSelection(zoneId);
        const selected = getZoneSelectedEggId(zoneId);
        if (eggs.indexOf(selected) !== -1) {
          gameState.equippedEggId = selected;
        } else if (eggs.indexOf(gameState.equippedEggId) === -1) {
          gameState.equippedEggId = eggs[0];
          if (zoneSupportsEggCarousel(zoneId)) {
            setZoneSelectedEggId(zoneId, eggs[0]);
          }
        } else if (zoneSupportsEggCarousel(zoneId)) {
          setZoneSelectedEggId(zoneId, gameState.equippedEggId);
        }
      }
      applyEggScene(getEquippedEggDef());
      renderCurrentEgg();
      updateEggCarouselPeer();
      scheduleUpdateGameCenterAxis();
      recalculateGlobalStats();
      eggsDirty = true;
      shopDirty = true;
      upgradesDirty = true;
      zonesDirty = true;
      dragonsDirty = true;
      uiDirty = true;
      saveGame(true);
      showNotification("🗺️ Zone", zone.name);
    }

    function getVisibleProducers() {
      const zoneId = getEconomyZoneId();
      return PRODUCER_DEFS.filter((p) => p.zoneId === zoneId);
    }

    function getActiveUpgradeDef(id) {
      return ACTIVE_UPGRADE_DEFS.find((u) => u.id === id) || null;
    }

    function getActiveUpgradeLevel(id) {
      const def = getActiveUpgradeDef(id);
      const maxL = def
        ? Math.max(1, Math.floor(safeNumber(def.maxLevel, MAX_ACTIVE_LEVEL)))
        : MAX_ACTIVE_LEVEL;
      return Math.max(0, Math.min(maxL, Math.floor(safeNumber(gameState.activeUpgrades?.[id]?.level, 0))));
    }

    /** Generic level cost: level 0 = baseCost. Shared by shop + upgrades. */
    function calculateLevelCost(item, level) {
      const lvl = Math.max(0, Math.floor(safeNumber(level != null ? level : item && item.level, 0)));
      const base = safeNumber(item && item.baseCost, 1);
      const growth = safeNumber(item && item.costGrowth, PRICE_GROWTH);
      return Math.max(1, Math.round(base * Math.pow(growth, lvl)));
    }

    /** Cost of the next purchase at `level` (0 = first buy = baseCost). */
    function getUpgradeCost(upgrade, level) {
      return calculateLevelCost(upgrade, level);
    }

    function getActiveUpgradeCost(def, level) {
      level = Math.max(0, Math.floor(safeNumber(level, 0)));
      if (def && Array.isArray(def.costs) && def.costs.length) {
        if (level >= def.costs.length) return def.costs[def.costs.length - 1];
        return Math.max(1, Math.floor(safeNumber(def.costs[level], 1)));
      }
      return calculateLevelCost(def, level);
    }

    /** Totaux de puissance de clic pour une amélioration clickPowerFlat (niveaux = valeurs cumulées). */
    function getClickPowerFlatBonus(def, level) {
      level = Math.max(0, Math.floor(safeNumber(level, 0)));
      if (!def || level <= 0 || def.bonusType !== "clickPowerFlat") return 0;
      const values = def.bonusValues;
      if (!Array.isArray(values) || !values.length) return 0;
      const idx = Math.min(level, values.length) - 1;
      return safeNumber(values[idx], 0);
    }

    /** Valeur totale d'une table bonusValues au niveau donné (tous bonusType à paliers). */
    function getUpgradeTableBonus(def, level) {
      level = Math.max(0, Math.floor(safeNumber(level, 0)));
      if (!def || level <= 0 || !Array.isArray(def.bonusValues) || !def.bonusValues.length) return 0;
      const idx = Math.min(level, def.bonusValues.length) - 1;
      return safeNumber(def.bonusValues[idx], 0);
    }

    function getChargedStrikeDef() {
      return ACTIVE_UPGRADE_DEFS.find((u) => u.bonusType === "chargedStrike") || null;
    }

    function getChargedStrikeTriggerClicks() {
      const def = getChargedStrikeDef();
      if (!def) return 0;
      const lvl = getActiveUpgradeLevel(def.id);
      if (lvl <= 0 || !Array.isArray(def.triggerClicks) || !def.triggerClicks.length) return 0;
      const idx = Math.min(lvl, def.triggerClicks.length) - 1;
      return Math.max(1, Math.floor(safeNumber(def.triggerClicks[idx], 0)));
    }

    function getChargedStrikeMultiplier() {
      const def = getChargedStrikeDef();
      if (!def || getActiveUpgradeLevel(def.id) <= 0) return 1;
      return Math.max(1, safeNumber(def.multiplier, 2));
    }

    /** Chance d'Éclosion Jumelle (0–1), cumul global de toutes les upgrades twinHatchChance. */
    function getTwinHatchChance() {
      let chance = 0;
      ACTIVE_UPGRADE_DEFS.forEach((def) => {
        if (def.bonusType !== "twinHatchChance") return;
        const lvl = getActiveUpgradeLevel(def.id);
        if (lvl <= 0) return;
        /* bonusValues stockés en % (0.2 … 1.0) */
        chance += getUpgradeTableBonus(def, lvl) / 100;
      });
      if (!Number.isFinite(chance) || chance < 0) return 0;
      /* Cap 2 % : Z2 Éclosion Jumelle (1 %) + Z3 Écho des Tempêtes (1 %). Toujours max 1 twin. */
      return Math.min(TWIN_HATCH_CHANCE_CAP, chance);
    }

    /**
     * Migration : ancien niveau Impulsion/Résonance (0–5) → Force Draconique (0–3).
     * 0→0, 1–2→1, 3–4→2, 5+→3
     */
    function migrateResonanceLevelToForce(oldLevel) {
      const n = Math.max(0, Math.floor(safeNumber(oldLevel, 0)));
      if (n <= 0) return 0;
      if (n <= 2) return 1;
      if (n <= 4) return 2;
      return 3;
    }

    function describeActiveBonusLine(def, level) {
      level = Math.max(0, level);
      if (def.bonusType === "clickPowerFlat") {
        const flat = getClickPowerFlatBonus(def, level);
        const txt = flat % 1 === 0 ? flat.toFixed(0) : flat.toFixed(2).replace(/\.?0+$/, "");
        return "+" + txt + " PUISSANCE DE CLIC";
      }
      if (def.bonusType === "critChanceFlat") {
        const pct = getUpgradeTableBonus(def, level) * 100;
        const txt = pct % 1 === 0 ? pct.toFixed(0) : pct.toFixed(2).replace(/\.?0+$/, "");
        return "+" + txt + " % CHANCE CRITIQUE";
      }
      if (def.bonusType === "critMultiplierFlat") {
        const add = getUpgradeTableBonus(def, level);
        return "+" + (add % 1 === 0 ? add.toFixed(0) : add.toFixed(2)) + " MULTIPLICATEUR CRITIQUE";
      }
      if (def.bonusType === "chargedStrike") {
        if (level <= 0 || !Array.isArray(def.triggerClicks) || !def.triggerClicks.length) {
          return "—";
        }
        const idx = Math.min(level, def.triggerClicks.length) - 1;
        const every = Math.floor(safeNumber(def.triggerClicks[idx], 0));
        const mult = safeNumber(def.multiplier, 2);
        return "Tous les " + every + " clics · ×" + mult + " FRAPPE CHARGÉE";
      }
      if (def.bonusType === "twinHatchChance") {
        const pct = getUpgradeTableBonus(def, level);
        const txt = pct % 1 === 0 ? pct.toFixed(0) : pct.toFixed(1);
        return txt + " % CHANCE D'ÉCLOSION JUMELLE";
      }
      if (def.bonusType === "globalProdPct") {
        const pct = getUpgradeTableBonus(def, level);
        const txt = pct % 1 === 0 ? pct.toFixed(0) : pct.toFixed(1);
        return "+" + txt + " % PRODUCTION PASSIVE";
      }
      if (def.family === "claws") {
        const flat = getClawsFlatBonus(def, level);
        const txt = flat % 1 === 0 ? flat.toFixed(0) : flat.toFixed(2).replace(/\.?0+$/, "");
        return "+" + txt + " PUISSANCE DE CLIC";
      }
      if (def.family === "instinct") {
        const pct = def.critChance * level * 100;
        return "+" + (pct % 1 === 0 ? pct.toFixed(0) : pct.toFixed(1)) + " % CHANCE CRITIQUE";
      }
      if (def.family === "bite") {
        const add = def.critMult * level;
        return "+" + (add % 1 === 0 ? add.toFixed(0) : add.toFixed(2)) + " MULTIPLICATEUR CRITIQUE";
      }
      if (def.family === "fervor") {
        if (def.fervorCurve === "noviceFervor") {
          const fv = getNoviceFervorBonus(level);
          const p = fv.power * 100;
          return "+" + (p % 1 === 0 ? p.toFixed(0) : p.toFixed(0)) + " % force combo · +" + fv.duration + " ms fenêtre";
        }
        const p = def.fervorPower * level * 100;
        const d = Math.round(def.fervorDuration * level);
        return "+" + (p % 1 === 0 ? p.toFixed(0) : p.toFixed(1)) + " % force combo · +" + d + " ms fenêtre";
      }
      return "";
    }

    function getVisibleActiveUpgrades() {
      const zoneId = getEconomyZoneId();
      return ACTIVE_UPGRADE_DEFS.filter((u) => u.zoneId === zoneId);
    }

    function getVisibleShopPassives() {
      const zoneId = getEconomyZoneId();
      return SHOP_PASSIVE_DEFS.filter((u) => u.zoneId === zoneId);
    }

    function getLevelPassiveLevel(id, state) {
      const s = state || gameState;
      const def = LEVEL_PASSIVE_DEFS.find((d) => d.id === id);
      const maxL = def ? Math.max(1, Math.floor(safeNumber(def.maxLevel, 1))) : 1;
      return Math.max(0, Math.min(maxL, Math.floor(safeNumber(s.levelPassives?.[id]?.level, 0))));
    }

    function getLevelPassiveCost(def, level) {
      if (Array.isArray(def.costs) && def.costs.length) {
        const idx = Math.max(0, Math.floor(safeNumber(level, 0)));
        if (idx >= def.costs.length) return Infinity;
        return Math.max(1, Math.ceil(safeNumber(def.costs[idx], 0)));
      }
      const growth = safeNumber(def.costGrowth, 1.5);
      return Math.max(1, Math.ceil(safeNumber(def.baseCost, 1) * Math.pow(growth, Math.max(0, level))));
    }

    function getOfflineCapHoursForLevel(level) {
      const lvl = Math.max(0, Math.min(
        OFFLINE_HOURS_BY_LEVEL.length - 1,
        Math.floor(safeNumber(level, 0))
      ));
      return OFFLINE_HOURS_BY_LEVEL[lvl];
    }

    function getOfflineYieldRateForLevel(level) {
      const lvl = Math.max(0, Math.min(
        OFFLINE_YIELD_BY_LEVEL.length - 1,
        Math.floor(safeNumber(level, 0))
      ));
      return OFFLINE_YIELD_BY_LEVEL[lvl];
    }

    function formatOfflineYieldPct(rate) {
      const pct = safeNumber(rate, OFFLINE_YIELD_BASE) * 100;
      if (!Number.isFinite(pct)) return "5 %";
      const rounded = Math.round(pct * 10) / 10;
      return (Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)) + " %";
    }

    function getOfflineCapMs(state) {
      const lvl = getLevelPassiveLevel("ancestralReserve", state);
      return getOfflineCapHoursForLevel(lvl) * 60 * 60 * 1000;
    }

    function getOfflineYieldRate(state) {
      const lvl = getLevelPassiveLevel("dragonWatch", state);
      return getOfflineYieldRateForLevel(lvl);
    }

    function describeLevelPassiveBonus(def, level) {
      if (def.id === "ancestralReserve") {
        const hours = getOfflineCapHoursForLevel(level);
        if (level >= def.maxLevel) return "MAX · " + hours + " h maximum";
        return "Durée maximale : " + hours + " h";
      }
      if (def.id === "dragonWatch") {
        const pct = formatOfflineYieldPct(getOfflineYieldRateForLevel(level));
        if (level >= def.maxLevel) return "MAX · " + pct + " de la production passive";
        return "Production récupérée : " + pct;
      }
      return def.description || "";
    }

    function describeLevelPassiveNext(def, level) {
      if (level >= def.maxLevel) return "";
      if (def.id === "ancestralReserve") {
        return "Prochain niveau : " + getOfflineCapHoursForLevel(level + 1) + " h";
      }
      if (def.id === "dragonWatch") {
        return "Prochain niveau : " + formatOfflineYieldPct(getOfflineYieldRateForLevel(level + 1));
      }
      return "";
    }

    function evaluateProgressCondition(cond, state) {
      if (!cond) return { ok: true, current: 0 };
      const s = state || gameState;
      let current = 0;
      let ok = false;
      if (cond.type === "totalEssence") {
        current = safeNumber(s.totalEssenceEarned, 0);
        ok = current >= cond.value;
      } else if (cond.type === "eggsHatched") {
        current = safeNumber(s.totalEggsHatched, 0);
        ok = current >= cond.value;
      } else if (cond.type === "zoneDragons") {
        current = countZonePoolDiscovered(s, cond.zoneId || "sanctuary");
        ok = current >= cond.value;
      } else if (cond.type === "producerOwned") {
        current = safeNumber(s.producers?.[cond.producerId]?.owned, 0);
        ok = current >= cond.value;
      } else if (cond.type === "dragonPower") {
        current = calculateDragonPower(s);
        ok = current >= cond.value;
      } else {
        ok = true;
      }
      return { ok: ok, current: current };
    }

    function isSpecialUpgradeUnlocked(def, state) {
      return evaluateProgressCondition(def.unlock, state).ok;
    }

    function getVisibleLevelPassives() {
      const zone = getCurrentZone();
      return LEVEL_PASSIVE_DEFS.filter((u) => u.zoneId === zone.id);
    }

    function getVisibleSpecialUpgrades() {
      const zone = getCurrentZone();
      return SPECIAL_UPGRADE_DEFS.filter((u) =>
        u.zoneId === zone.id && !u.hideFromShop && isSpecialUpgradeUnlocked(u)
      );
    }

    function buyLevelPassive(id) {
      if (buyingLock) return;
      const def = LEVEL_PASSIVE_DEFS.find((d) => d.id === id);
      if (!def) return;
      if (!gameState.levelPassives[id]) gameState.levelPassives[id] = { level: 0 };
      const level = getLevelPassiveLevel(id);
      if (level >= def.maxLevel) return;
      const cost = getLevelPassiveCost(def, level);
      if (!spendEssence(cost, { zoneId: def.zoneId || getCurrentZone().id })) return;
      buyingLock = true;
      try {
        gameState.levelPassives[id].level = level + 1;
        calculateProduction();
        showNotification("⭐ Passif", def.name + " → niv. " + (level + 1));
        playSound("buy");
        upgradesDirty = true;
        uiDirty = true;
      } finally {
        buyingLock = false;
      }
    }

    function buySpecialUpgrade(id) {
      if (buyingLock) return;
      const def = SPECIAL_UPGRADE_DEFS.find((d) => d.id === id);
      if (!def) return;
      if (!isSpecialUpgradeUnlocked(def)) return;
      if (!gameState.specialUpgrades[id]) gameState.specialUpgrades[id] = { bought: false };
      if (gameState.specialUpgrades[id].bought) return;
      if (!spendEssence(def.cost, { zoneId: def.zoneId || getCurrentZone().id })) return;
      buyingLock = true;
      try {
        gameState.specialUpgrades[id].bought = true;
        if (def.effect && def.effect.type === "unlockExpeditions") {
          ensureExpeditionState().systemUnlocked = true;
          expeditionsDirty = true;
        }
        calculateProduction();
        showNotification("✨ Spécial", def.name + " acquis");
        playSound("buy");
        upgradesDirty = true;
        uiDirty = true;
        zonesDirty = true;
        saveGame(true);
      } finally {
        buyingLock = false;
      }
    }

    function getZone1Completion(state) {
      const s = state || gameState;
      let done = 0;
      let total = 0;
      PRODUCER_DEFS.filter((p) => p.zoneId === "sanctuary").forEach((p) => {
        total += 1;
        if (safeNumber(s.producers?.[p.id]?.owned, 0) >= p.maxLevel) done += 1;
      });
      ACTIVE_UPGRADE_DEFS.filter((u) => u.zoneId === "sanctuary").forEach((u) => {
        total += 1;
        if (getActiveUpgradeLevel(u.id) >= u.maxLevel) done += 1;
      });
      LEVEL_PASSIVE_DEFS.filter((u) => u.zoneId === "sanctuary").forEach((u) => {
        total += 1;
        if (getLevelPassiveLevel(u.id, s) >= u.maxLevel) done += 1;
      });
      SPECIAL_UPGRADE_DEFS.filter((u) => u.zoneId === "sanctuary" && !u.hideFromShop).forEach((u) => {
        total += 1;
        if (s.specialUpgrades?.[u.id]?.bought) done += 1;
      });
      const dragons = DRAGON_DEFS.filter((d) => d.zoneId === "sanctuary" && !d.secret);
      total += 1;
      if (countZonePoolDiscovered(s, "sanctuary") >= dragons.length) done += 1;
      const pct = total ? Math.floor((done / total) * 100) : 0;
      return { done: done, total: total, percent: pct };
    }

    function getZone1BalanceReport() {
      const stats = recalculateGlobalStats();
      const valley = getZoneDef("valley");
      const unlock = canUnlockZone("valley");
      const completion = getZone1Completion();
      const producers = PRODUCER_DEFS.filter((p) => p.zoneId === "sanctuary").map((p) => ({
        id: p.id,
        name: p.name,
        level: safeNumber(gameState.producers[p.id]?.owned, 0),
        max: p.maxLevel,
        costNext: getProducerCost(p, safeNumber(gameState.producers[p.id]?.owned, 0))
      }));
      const upgrades = ACTIVE_UPGRADE_DEFS.filter((u) => u.zoneId === "sanctuary").map((u) => ({
        id: u.id,
        level: getActiveUpgradeLevel(u.id),
        max: u.maxLevel
      }));
      return {
        essence: gameState.dragonEssence,
        essencePerSec: stats.essencePerSecond,
        powerPerClick: stats.clickPower,
        globalStats: stats,
        dragonPower: getPlayerDragonPower(),
        producers: producers,
        upgrades: upgrades,
        levelPassives: LEVEL_PASSIVE_DEFS.map((u) => ({ id: u.id, level: getLevelPassiveLevel(u.id), max: u.maxLevel })),
        specials: SPECIAL_UPGRADE_DEFS.map((u) => ({
          id: u.id,
          unlocked: isSpecialUpgradeUnlocked(u),
          bought: !!(gameState.specialUpgrades?.[u.id]?.bought)
        })),
        dragonsDiscovered: countZonePoolDiscovered(gameState, "sanctuary"),
        playTimeMs: gameState.playTimeMs,
        offlineCapHours: getOfflineCapMs(gameState) / 3600000,
        offlineYield: getOfflineYieldRate(gameState),
        zone2: {
          unlocked: isZoneUnlocked(gameState, "valley"),
          canUnlock: unlock.ok,
          cost: unlock.cost,
          portalName: valley.unlockPortalName || "Portail",
          requirements: (unlock.reqs && unlock.reqs.results) || []
        },
        completion: completion
      };
    }

    function formatZoneShopHeading(zone) {
      const idx = getZoneMapIndex(zone.id);
      return {
        zoneLabel: "Zone " + idx,
        name: zone.name || "",
        rank: ""
      };
    }

    function updateZoneScopedPanelHeaders() {
      /* Boutique / Améliorations suivent la zone économique (hors eventOnly). */
      const economyZone = getZoneDef(getEconomyZoneId());
      const head = formatZoneShopHeading(economyZone);
      const detail = head.name || "";
      const shopSub = document.getElementById("shop-zone-sub");
      if (shopSub) {
        shopSub.textContent = detail;
      }
      const upSub = document.getElementById("upgrades-zone-sub");
      if (upSub) {
        upSub.textContent = detail;
      }
    }

    function getVisibleEggs() {
      const zone = getCurrentZone();
      const ids = zone.eggIds || [];
      if (!ids.length) return EGG_DEFS.filter((e) => !e.secret && e.zoneId === zone.id);
      return EGG_DEFS.filter((e) => ids.indexOf(e.id) !== -1);
    }

    function createDefaultEggBossSystem() {
      return {
        activeBoss: null,
        specialEggHatch: null,
        lastBossTimestamp: 0,
        eggSpawnProgress: {},
        /* Spawn naturel validé mais pas encore affiché (menus / reload). */
        pendingBossSpawn: null,
        /* Records Sanctuaire (additif, old saves → défauts). */
        bossRecords: {}
      };
    }

    const EGG_BOSS_RANK_SCORE = { S: 4, A: 3, B: 2, C: 1 };

    function createDefaultBossRecord() {
      return { bestTime: null, bestRank: null, victories: 0 };
    }

    function ensureBossRecords(state) {
      const ebs = ensureEggBossSystem(state);
      if (!ebs.bossRecords || typeof ebs.bossRecords !== "object") {
        ebs.bossRecords = {};
      }
      return ebs.bossRecords;
    }

    function getEggBossRecord(bossId, state) {
      const records = ensureBossRecords(state);
      if (!bossId) return createDefaultBossRecord();
      if (!records[bossId] || typeof records[bossId] !== "object") {
        records[bossId] = createDefaultBossRecord();
      }
      const r = records[bossId];
      if (r.bestTime != null) r.bestTime = Math.max(0, safeNumber(r.bestTime, 0));
      else r.bestTime = null;
      if (r.bestRank != null && !EGG_BOSS_RANK_SCORE[r.bestRank]) r.bestRank = null;
      r.victories = Math.max(0, Math.floor(safeNumber(r.victories, 0)));
      return r;
    }

    function isBetterEggBossRank(next, prev) {
      if (!next) return false;
      if (!prev) return true;
      return (EGG_BOSS_RANK_SCORE[next] || 0) > (EGG_BOSS_RANK_SCORE[prev] || 0);
    }

    /** Enregistre une victoire Boss (bestTime / bestRank / victories) — save via caller. */
    function recordEggBossVictory(bossId, elapsedSec, rank) {
      if (!bossId) return;
      const rec = getEggBossRecord(bossId);
      const t = Math.max(0, safeNumber(elapsedSec, 0));
      rec.victories = Math.max(0, Math.floor(safeNumber(rec.victories, 0))) + 1;
      if (rec.bestTime == null || t < rec.bestTime) rec.bestTime = t;
      if (isBetterEggBossRank(rank, rec.bestRank)) rec.bestRank = rank;
    }

    function formatEggBossRecordTime(sec) {
      if (sec == null || !Number.isFinite(sec)) return "—";
      const t = Math.max(0, sec);
      if (t < 60) {
        const rounded = Math.round(t * 10) / 10;
        return (Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)) + " s";
      }
      return formatDuration(t * 1000);
    }

    function createDefaultState() {
      const producers = {};
      PRODUCER_DEFS.forEach((p) => {
        producers[p.id] = { owned: 0 };
      });

      const activeUpgrades = {};
      ACTIVE_UPGRADE_DEFS.forEach((u) => {
        activeUpgrades[u.id] = { level: 0 };
      });

      const shopPassives = {};
      SHOP_PASSIVE_DEFS.forEach((u) => {
        shopPassives[u.id] = { bought: false };
      });

      const levelPassives = {};
      LEVEL_PASSIVE_DEFS.forEach((u) => {
        levelPassives[u.id] = { level: 0 };
      });

      const specialUpgrades = {};
      SPECIAL_UPGRADE_DEFS.forEach((u) => {
        specialUpgrades[u.id] = { bought: false };
      });

      /* Legacy key kept empty for old save reads during migration */
      const upgrades = {};
      LEGACY_UPGRADE_IDS.forEach((id) => {
        upgrades[id] = { bought: false };
      });

      const achievements = {};
      ACHIEVEMENT_DEFS.forEach((a) => {
        achievements[a.id] = { unlocked: false, rewardClaimed: false };
      });

      return {
        dragonEssence: 0,
        dragonPower: 0,
        powerPerClick: 1,
        powerPerSecond: 0,
        totalClicks: 0,
        totalCriticalClicks: 0,
        totalEssenceEarned: 0,
        essenceFromClicks: 0,
        essenceFromAuto: 0,
        /* legacy aliases kept null; migration maps old saves */
        totalPowerEarned: 0,
        powerFromClicks: 0,
        powerFromAuto: 0,
        lifetimeManualClicks: 0,
        currentCps: 0,
        peakCps: 0,
        chargedStrikeClicks: 0,
        producers,
        activeUpgrades,
        shopPassives,
        levelPassives,
        specialUpgrades,
        upgrades,
        comboCount: 0,
        comboBonus: 0,
        achievements,
        eggs: createEmptyEggProgress(),
        dragons: createEmptyDragonProgress(),
        equippedEggId: "basic",
        zoneEggSelection: {},
        totalEggsHatched: 0,
        totalExpeditionsCompleted: 0,
        totalDragonsObtained: 0,
        rarityStats: createEmptyRarityStats(),
        hatchHistory: [],
        eggHatched: false,
        eggStage: 1,
        introSeen: false,
        soundEnabled: true,
        musicEnabled: true,
        masterVolume: 1,
        sfxVolume: 1,
        /* Intensité relative 0–1 ; volume réel = musicVolume × AudioManager.musicBaseVolume */
        musicVolume: 1,
        playTimeMs: 0,
        lastSaveTime: Date.now(),
        lastTickTime: Date.now(),
        multipliers: {
          clickFlat: 0,
          clickPct: 0,
          click: 1,
          globalProduction: 1,
          autoProduction: 1,
          globalPower: 1,
          critChance: CRIT_CHANCE_BASE,
          critMult: CRIT_MULT_BASE,
          fragmentMult: 1,
          fragmentYield: 0,
          expeditionReward: 0,
          rarityLuck: 0,
          duplicateFragmentChance: 0,
          offlineMult: OFFLINE_YIELD_BASE,
          eggProgressPct: 0,
          producerCostMult: 1,
          fervorPower: 0,
          fervorDuration: 0,
          producers: {}
        },
        fragmentBonusAccumulator: 0,
        eggProgressAccumulator: 0,
        currentZoneId: "sanctuary",
        unlockedZones: ["sanctuary"],
        visitedZones: ["sanctuary"],
        zoneSpent: {},
        team: [null, null, null],
        redeemedCodes: [],
        chests: createEmptyChestInventory(),
        /* Matériaux / Reliques / Œufs de Gardien — coffres restent dans gameState.chests */
        inventory: { materials: {}, relics: {}, eggs: {} },
        /* Gardiens d'œuf — état combat + hatch spécial + pity / cooldown */
        eggBossSystem: createDefaultEggBossSystem(),
        /* 0 = coffre régulier Royaume prêt (timestamp ms absolu sinon) */
        nextFreeChestAt: 0,
        expeditions: {
          unlockedSlots: DEFAULT_EXPEDITION_SLOTS,
          slots: [null],
          systemUnlocked: false
        },
        meta: {
          prestigeLevel: 0,
          dragonSouls: 0,
          unlockedZones: ["sanctuary"],
          collectedDragons: [],
          flags: {}
        }
      };
    }

    let gameState = createDefaultState();
    let lastFrameTime = performance.now();
    let uiDirty = true;
    let shopDirty = true;
    let upgradesDirty = true;
    let achievementsDirty = true;
    let dragonsDirty = true;
    let dragonsFilterZoneId = "all";
    let eggsDirty = true;
    let zonesDirty = true;
    let expeditionsDirty = true;
    let expeditionIntroAnimPending = false;
    /** Si true, fermer le Hall (drawer) rouvre le Hub Expéditions. */
    let expeditionReturnToHub = false;
    /** "hub" | "threats" | null — navigation retour depuis préparation / Hall */
    let expeditionReturnTarget = null;
    let expeditionPreparePickerOpen = false;
    let buyingLock = false;
    let expeditionUi = {
      mode: "list",
      selectedExpeditionId: null,
      selectedDragons: []
    };
    let lastExpeditionUiRefresh = 0;
    const expeditionRewardsTip = {
      el: null,
      hideTimer: 0,
      openId: null,
      pinned: false,
      trigger: null
    };
    let clicksLocked = false;
    let hatchSequenceActive = false;
    let isEggCarouselAnimating = false;
    let pendingReveal = null;
    /** Spawn Boss différé (fin de reveal / menu fermé). */
    let pendingBossSpawn = null;
    let lastBossFightUiKey = "";
    let guardianHatchSequenceActive = false;
    let clickTimestamps = [];
    let lastAffordabilityRefresh = 0;
    let lastWorldAffordabilityRefresh = 0;
    const AFFORDABILITY_MS = 250;
    /* Perf: throttle costly loop work (UI / achievements / expeditions). */
    const ACHIEVEMENT_CHECK_MS = 500;
    const EXPEDITION_TICK_MS = 250;
    const HUD_REFRESH_MS = 100;
    const STATS_REFRESH_MS = 250;
    const EGG_PROGRESS_UI_MS = 200;
    let lastAchievementCheckAt = 0;
    let lastExpeditionTickAt = 0;
    let lastHudRefreshAt = 0;
    let lastStatsRefreshAt = 0;
    let lastEggProgressUiAt = 0;
    let hatchHistoryDirty = true;
    let lastHudSnapshot = {
      essence: null,
      prod: null,
      click: null,
      power: null,
      cps: null,
      peak: null
    };
    let lastChargedAuraKey = "";
    let lastExpeditionHudKey = "";
    let lastEggProgressKey = "";
    let cachedHudEls = null;

    /* Egg click / hatch FX state (visual only — no gameplay) */
    let eggClickAnimation = null;
    let eggHatchAnimation = null;
    let eggAmbientAnimation = null;
    let eggClickGlowAnimation = null;
    /** Timestamp of last pointerdown press — fallback if mobile misses pointerdown but fires click */
    let eggPressPrimedAt = 0;
    let hatchFxTimers = [];
    let hatchFxToken = 0;
    /**
     * Unique source of truth for the final hatch reveal timeline (visual only).
     * Total ≈ 2.4–2.6s from 100% to fully visible dragon.
     */
    /**
     * Hatch reveal timeline — ~3.1–3.3s total (readable, not instant).
     * Single source of truth; runHatchSequence awaits each phase in order.
     */
    const HATCH_SEQUENCE_TIMINGS = {
      crackSound: 90,           /* EGG CRACK ~90ms after 100% */
      finalShake: 560,          /* progressive final tremble */
      breakPhase: 380,          /* glow / fissure / open */
      hatchSoundAt: 70,         /* early into break → hatch follows opening (~730ms) */
      eggVanish: 320,           /* progressive egg fade */
      pauseAfterBreak: 150,     /* beat between egg gone and magic */
      summonEffect: 750,        /* magic sprite sheet */
      dragonReveal: 980,        /* progressive materialize */
      dragonRevealSoundAt: 180, /* rarity SFX shortly after reveal starts */
      twinPause: 350,
      twinSummonEffect: 700
    };
    const DRAGON_SUMMON_COLS = 5;
    const DRAGON_SUMMON_ROWS = 2;
    const DRAGON_SUMMON_TOTAL_FRAMES = DRAGON_SUMMON_COLS * DRAGON_SUMMON_ROWS;
    const DRAGON_SUMMON_SRC = "assets/animation/magic-electric-lightning-ball-animation-sprite.png";
    let dragonSummonSpriteReady = null;
    let dragonSummonActiveEl = null;
    let lastEggAmbientShakeAt = 0;
    let activeClickFloats = [];
    let activeClickParticles = [];
    const MAX_CLICK_FLOATS = 18;
    const MAX_CLICK_PARTICLES = 24;
    let lastHudDragonPower = null;

    /* -------------------------------------------------------
       UTILITY — formatNumber
       ------------------------------------------------------- */
    function formatNumber(n) {
      if (!Number.isFinite(n) || n < 0) n = 0;
      if (n < 1000) {
        return Number.isInteger(n) ? String(n) : n.toFixed(1).replace(/\.0$/, "");
      }

      let tier = Math.floor(Math.log10(n) / 3);
      if (tier >= NUMBER_SUFFIXES.length) {
        return n.toExponential(2);
      }

      const scaled = n / Math.pow(1000, tier);
      let str;
      if (scaled >= 100) str = scaled.toFixed(0);
      else if (scaled >= 10) str = scaled.toFixed(1);
      else str = scaled.toFixed(2);

      str = str.replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");
      return str + NUMBER_SUFFIXES[tier];
    }

    function formatDuration(ms) {
      if (!Number.isFinite(ms) || ms < 0) ms = 0;
      const totalSec = Math.floor(ms / 1000);
      const h = Math.floor(totalSec / 3600);
      const m = Math.floor((totalSec % 3600) / 60);
      const s = totalSec % 60;
      if (h > 0) return h + " h " + m + " min";
      if (m > 0) return m + " min " + s + " s";
      return s + " s";
    }

    function formatCountdown(ms) {
      if (!Number.isFinite(ms) || ms < 0) ms = 0;
      const totalSec = Math.floor(ms / 1000);
      const h = Math.floor(totalSec / 3600);
      const m = Math.floor((totalSec % 3600) / 60);
      const s = totalSec % 60;
      const pad = (n) => (n < 10 ? "0" : "") + n;
      return pad(h) + ":" + pad(m) + ":" + pad(s);
    }

    function safeNumber(v, fallback) {
      const n = Number(v);
      return Number.isFinite(n) ? n : (fallback || 0);
    }

    function getTotalProducers(state) {
      let total = 0;
      Object.keys(state.producers || {}).forEach((id) => {
        total += safeNumber(state.producers[id].owned, 0);
      });
      return total;
    }

    function getUpgradesBought(state) {
      let n = 0;
      Object.keys(state.activeUpgrades || {}).forEach((id) => {
        n += Math.max(0, Math.floor(safeNumber(state.activeUpgrades[id]?.level, 0)));
      });
      Object.keys(state.shopPassives || {}).forEach((id) => {
        if (state.shopPassives[id]?.bought) n++;
      });
      return n;
    }

    /* -------------------------------------------------------
       PRODUCTION & MULTIPLIERS
       ------------------------------------------------------- */
    function rebuildMultipliers() {
      const m = {
        clickFlat: 0,
        clickPct: 0,
        clickEssencePct: 0,
        click: 1,
        essenceFlat: 0,
        globalProduction: 1,
        autoProduction: 1,
        globalPower: 1,
        critChance: CRIT_CHANCE_BASE,
        critMult: CRIT_MULT_BASE,
        fragmentMult: 1,
        fragmentYield: 0,
        expeditionReward: 0,
        rarityLuck: 0,
        duplicateFragmentChance: 0,
        offlineMult: OFFLINE_YIELD_BASE,
        eggProgressPct: 0,
        producerCostMult: 1,
        fervorPower: 0,
        fervorDuration: 0,
        producers: {}
      };

      PRODUCER_DEFS.forEach((p) => {
        m.producers[p.id] = 1;
      });

      function applyBonus(b) {
        if (!b || !b.type) return;
        const v = safeNumber(b.value, 0);
        if (b.type === "clickFlat") m.clickFlat += v;
        else if (b.type === "clickPct") m.clickPct += v;
        else if (b.type === "clickMult") m.click *= (v || 1);
        else if (b.type === "producerMult" && b.producerId) {
          m.producers[b.producerId] = (m.producers[b.producerId] || 1) * (v || 1);
        } else if (b.type === "globalProdMult") m.globalProduction *= (v || 1);
        else if (b.type === "globalProdPct") m.globalProduction *= (1 + v);
        else if (b.type === "globalPowerMult") m.globalPower *= (v || 1);
        else if (b.type === "critChance") m.critChance += v;
        else if (b.type === "critMultFlat") m.critMult += v;
        else if (b.type === "fragmentMult") m.fragmentMult *= (1 + v);
        else if (b.type === "fragmentYield") m.fragmentYield += v;
        else if (b.type === "offlineMult") m.offlineMult *= (1 + v);
        else if (b.type === "eggProgressPct") m.eggProgressPct += v;
        else if (b.type === "producerCostMult") m.producerCostMult *= (v || 1);
        else if (b.type === "autoMult") m.autoProduction *= (v || 1);
        else if (b.type === "heritage") {
          m.clickPct += safeNumber(b.clickPct, 0);
          m.globalProduction *= (1 + safeNumber(b.prodPct, 0));
        }
      }

      /* Active click upgrades — levels accumulate across zones */
      ACTIVE_UPGRADE_DEFS.forEach((def) => {
        const lvl = getActiveUpgradeLevel(def.id);
        if (lvl <= 0) return;
        if (def.family === "claws" && def.bonusType !== "clickPowerFlat") {
          m.clickFlat += getClawsFlatBonus(def, lvl);
        }
        if (def.bonusType === "clickPowerFlat") {
          m.clickFlat += getClickPowerFlatBonus(def, lvl);
        }
        if (def.bonusType === "globalProdPct") {
          /* bonusValues en points de % (2 … 10) → multiplicateur production passive */
          const pctPts = getUpgradeTableBonus(def, lvl);
          if (pctPts > 0) m.globalProduction *= (1 + pctPts / 100);
        }
        if (def.bonusType === "critChanceFlat") {
          m.critChance += getUpgradeTableBonus(def, lvl);
        } else if (def.critChance) {
          m.critChance += def.critChance * lvl;
        }
        if (def.bonusType === "critMultiplierFlat") {
          m.critMult += getUpgradeTableBonus(def, lvl);
        } else if (def.critMult) {
          m.critMult += def.critMult * lvl;
        }
        if (def.family === "fervor" && def.bonusType !== "clickPowerFlat" && def.fervorCurve === "noviceFervor") {
          const fv = getNoviceFervorBonus(lvl);
          m.fervorPower += fv.power;
          m.fervorDuration += fv.duration;
        } else if (def.family === "fervor" && def.bonusType === "comboFervor") {
          if (def.fervorPower) m.fervorPower += def.fervorPower * lvl;
          if (def.fervorDuration) m.fervorDuration += def.fervorDuration * lvl;
        }
      });

      /* Boutique passive one-shots */
      SHOP_PASSIVE_DEFS.forEach((def) => {
        if (!gameState.shopPassives?.[def.id]?.bought) return;
        applyBonus(def.effect);
      });

      /* Special unique upgrades */
      SPECIAL_UPGRADE_DEFS.forEach((def) => {
        if (!gameState.specialUpgrades?.[def.id]?.bought) return;
        applyBonus(def.effect);
      });

      /* Succès : plus de bonus permanents (récompenses Essence uniques via claim). */

      /* Active team dragons only (not owned collection, not on expedition). */
      for (let ti = 0; ti < TEAM_SIZE; ti++) {
        const td = getTeamDragon(ti);
        if (!td || !getDragonBonusDefs(td.def).length) continue;
        if (isDragonOnExpedition(td.def.id)) continue;
        getDragonBonusDefs(td.def).forEach((bonusEntry) => {
          const value = getDragonBonusEntryValue(bonusEntry, td.stars);
          if (value <= 0) return;
          const t = normalizeDragonBonusType(bonusEntry.type);
          if (t === "clickPowerPercent") m.clickPct += value;
          else if (t === "clickPowerFlat") m.clickFlat += value;
          else if (t === "clickEssencePercent") m.clickEssencePct += value;
          else if (t === "essenceProductionPercent") m.globalProduction *= (1 + value);
          else if (t === "essenceProductionFlat") m.essenceFlat += value;
          else if (t === "essenceGlobalPercent") {
            m.clickEssencePct += value;
            m.globalProduction *= (1 + value);
          } else if (t === "critChanceFlatPercent") m.critChance += value;
          else if (t === "fragmentGainPercent") m.fragmentYield += value;
          else if (t === "duplicateBonusFragmentChance") m.duplicateFragmentChance += value;
          else if (t === "expeditionReward") m.expeditionReward += value;
          else if (t === "rarityLuck") m.rarityLuck += value;
          /* offlineMult dragon/achievement : ignoré ici — efficacité hors-ligne = table unique (getOfflineYieldRate). */
        });
      }

      m.click *= m.globalPower;
      m.globalProduction *= m.globalPower;

      /* Efficacité hors-ligne = valeur TOTALE du passif (jamais empilée avec d'autres offlineMult). */
      m.offlineMult = getOfflineYieldRate(gameState);

      if (!Number.isFinite(m.critChance) || m.critChance < 0) m.critChance = CRIT_CHANCE_BASE;
      if (m.critChance > CRIT_CHANCE_CAP) m.critChance = CRIT_CHANCE_CAP;
      if (!Number.isFinite(m.critMult) || m.critMult < 1) m.critMult = CRIT_MULT_BASE;
      if (m.critMult > CRIT_MULT_CAP) m.critMult = CRIT_MULT_CAP;
      if (!Number.isFinite(m.fervorPower) || m.fervorPower < 0) m.fervorPower = 0;
      if (!Number.isFinite(m.fervorDuration) || m.fervorDuration < 0) m.fervorDuration = 0;
      if (!Number.isFinite(m.fragmentMult) || m.fragmentMult < 1) m.fragmentMult = 1;
      if (!Number.isFinite(m.fragmentYield) || m.fragmentYield < 0) m.fragmentYield = 0;
      if (!Number.isFinite(m.expeditionReward) || m.expeditionReward < 0) m.expeditionReward = 0;
      if (!Number.isFinite(m.rarityLuck) || m.rarityLuck < 0) m.rarityLuck = 0;
      if (!Number.isFinite(m.clickEssencePct) || m.clickEssencePct < 0) m.clickEssencePct = 0;
      if (!Number.isFinite(m.essenceFlat) || m.essenceFlat < 0) m.essenceFlat = 0;
      if (!Number.isFinite(m.duplicateFragmentChance) || m.duplicateFragmentChance < 0) {
        m.duplicateFragmentChance = 0;
      }
      if (m.duplicateFragmentChance > 1) m.duplicateFragmentChance = 1;
      if (!Number.isFinite(m.offlineMult) || m.offlineMult < 0) m.offlineMult = OFFLINE_YIELD_BASE;
      if (m.offlineMult > 1) m.offlineMult = 1;
      if (!Number.isFinite(m.eggProgressPct) || m.eggProgressPct < 0) m.eggProgressPct = 0;
      if (!Number.isFinite(m.producerCostMult) || m.producerCostMult <= 0) m.producerCostMult = 1;

      gameState.multipliers = m;
      const ppc = (BASE_CLICK_POWER + m.clickFlat) * (1 + m.clickPct) * m.click;
      gameState.powerPerClick = Number.isFinite(ppc) && ppc > 0 ? ppc : 1;
    }

    function getProducerCost(def, owned) {
      const mult = safeNumber(gameState.multipliers.producerCostMult, 1);
      const base = calculateLevelCost(def, owned);
      return Math.max(1, Math.round(base * mult));
    }

    /**
     * Production totale d'un producteur au niveau donné (sans multiplicateurs externes).
     * linear : productionPerLevel × niveau (Z1).
     * sinon courbe progressive : niv.1 = baseProduction, niv.max = maxProduction.
     */
    function calculateProducerProduction(def, level) {
      level = Math.max(0, Math.floor(safeNumber(level, 0)));
      const maxL = Math.max(1, safeNumber(def.maxLevel, MAX_PRODUCER_LEVEL));
      if (level <= 0) return 0;
      level = Math.min(level, maxL);
      if (def.productionCurve === "linear") {
        const per = safeNumber(
          def.productionPerLevel,
          safeNumber(def.maxProduction, 0) / maxL
        );
        return per * level;
      }
      const base = safeNumber(def.baseProduction, 0);
      const maxP = safeNumber(def.maxProduction, base);
      if (level <= 1 || maxL <= 1) return base;
      const t = (level - 1) / (maxL - 1);
      const eased = Math.pow(t, PRODUCER_CURVE_EXP);
      return base + (maxP - base) * eased;
    }

    function getProducerProduction(def, owned) {
      const raw = calculateProducerProduction(def, owned);
      if (raw <= 0) return 0;
      const mult = (gameState.multipliers.producers[def.id] || 1)
        * gameState.multipliers.globalProduction
        * gameState.multipliers.autoProduction;
      return raw * mult;
    }

    /** Griffes du Novice (15 niv.) : +0.40 / niveau → +6 au niv.15 */
    function getNoviceClawsFlat(level) {
      level = Math.max(0, Math.min(15, Math.floor(safeNumber(level, 0))));
      if (level <= 0) return 0;
      return level * 0.4;
    }

    function getNoviceFervorBonus(level) {
      const table = [
        { power: 0, duration: 0 },
        { power: 0.06, duration: 100 },
        { power: 0.12, duration: 200 },
        { power: 0.20, duration: 350 },
        { power: 0.28, duration: 500 },
        { power: 0.35, duration: 650 }
      ];
      const idx = Math.max(0, Math.min(5, Math.floor(safeNumber(level, 0))));
      return table[idx];
    }

    function getClawsFlatBonus(def, level) {
      level = Math.max(0, Math.floor(safeNumber(level, 0)));
      if (level <= 0 || !def || def.family !== "claws") return 0;
      if (def.clawsCurve === "noviceSteps15" || def.clawsCurve === "noviceSteps") {
        return getNoviceClawsFlat(level);
      }
      return safeNumber(def.clickFlatPerLevel, 0) * level;
    }

    /** Zone ids the player has unlocked (always includes sanctuary). */
    function getUnlockedZoneIds(state) {
      state = state || gameState;
      const list = Array.isArray(state.unlockedZones) ? state.unlockedZones.slice() : ["sanctuary"];
      if (list.indexOf("sanctuary") === -1) list.unshift("sanctuary");
      return list.filter((id, i, arr) => arr.indexOf(id) === i);
    }

    /**
     * Passive Essence/sec from one zone's boutique levels (multipliers must already be built).
     * Does not depend on currentZone — only on saved producer levels + global mults.
     */
    function calculateZoneEssencePerSecond(zoneId, state) {
      state = state || gameState;
      const m = gameState.multipliers;
      let total = 0;
      PRODUCER_DEFS.forEach((def) => {
        if ((def.zoneId || "sanctuary") !== zoneId) return;
        const owned = safeNumber(state.producers[def.id]?.owned, 0);
        const raw = calculateProducerProduction(def, owned);
        if (raw <= 0) return;
        const mult = (m.producers[def.id] || 1) * m.globalProduction * m.autoProduction;
        total += raw * mult;
      });
      return total;
    }

    /**
     * Single source of truth for cumulative stats (all unlocked zones + global bonuses).
     * Derived from saved levels / dragons / passifs — never from cached HUD numbers.
     */
    function calculateGlobalStats(state) {
      state = state || gameState;
      rebuildMultipliers();
      const m = gameState.multipliers;
      const unlockedSet = new Set(getUnlockedZoneIds(state));
      let essencePerSecond = 0;
      PRODUCER_DEFS.forEach((def) => {
        const zid = def.zoneId || "sanctuary";
        if (!unlockedSet.has(zid)) return;
        essencePerSecond += getProducerProduction(def, safeNumber(state.producers[def.id]?.owned, 0));
      });
      /* Flat Essence/sec dragons (Legendary / Mythic) — brute puis × mults globaux existants. */
      const essenceFlat = safeNumber(m.essenceFlat, 0);
      if (essenceFlat > 0) {
        essencePerSecond += essenceFlat * m.globalProduction * m.autoProduction;
      }
      if (!Number.isFinite(essencePerSecond) || essencePerSecond < 0) essencePerSecond = 0;

      const clickPower = Number.isFinite(gameState.powerPerClick) && gameState.powerPerClick > 0
        ? gameState.powerPerClick
        : 1;

      return {
        essencePerSecond: essencePerSecond,
        clickPower: clickPower,
        critChance: m.critChance,
        critMultiplier: m.critMult,
        twinHatchChance: getTwinHatchChance(),
        chargedStrikeEvery: getChargedStrikeTriggerClicks(),
        chargedStrikeMult: getChargedStrikeMultiplier(),
        fragmentGainBonus: safeNumber(m.fragmentYield, 0),
        fragmentMult: safeNumber(m.fragmentMult, 1),
        duplicateFragmentChance: safeNumber(m.duplicateFragmentChance, 0),
        comboFervorPower: safeNumber(m.fervorPower, 0),
        comboFervorDurationMs: safeNumber(m.fervorDuration, 0),
        offlineYield: safeNumber(m.offlineMult, OFFLINE_YIELD_BASE),
        multipliers: m
      };
}

    /** Rebuild gameState HUD/combat fields from calculateGlobalStats(). */
    function recalculateGlobalStats(state) {
      state = state || gameState;
      const stats = calculateGlobalStats(state);
      gameState.powerPerSecond = stats.essencePerSecond;
      gameState.powerPerClick = stats.clickPower;
      calculateDragonPower(state);
      stats.draconicPower = getPlayerDragonPower(state);
      return stats;
    }

    function calculateProduction() {
      return recalculateGlobalStats().essencePerSecond;
    }

    /**
     * Puissance Draconique = statistique globale (non dépensable).
     * Formule simple, facile à rééquilibrer plus tard.
     */
    function calculateDragonPower(state) {
      state = state || gameState;
      let power = 10;

      PRODUCER_DEFS.forEach((def) => {
        const owned = Math.max(0, Math.floor(safeNumber(state.producers?.[def.id]?.owned, 0)));
        power += owned * 15;
      });

      Object.keys(state.activeUpgrades || {}).forEach((id) => {
        const level = Math.max(0, Math.floor(safeNumber(state.activeUpgrades[id]?.level, 0)));
        power += level * 8;
      });

      Object.keys(state.shopPassives || {}).forEach((id) => {
        if (state.shopPassives[id]?.bought) power += 50;
      });

      const zones = Array.isArray(state.unlockedZones) ? state.unlockedZones.length : 1;
      power += zones * 75;
      power += Math.max(0, zones - 1) * 200;

      DRAGON_DEFS.forEach((d) => {
        const entry = state.dragons?.[d.id];
        if (!isDragonDiscovered(entry, d.id, state)) return;
        const stars = Math.max(1, Math.floor(safeNumber(entry.stars, 1)));
        power += 35 + stars * 25;
      });

      power += Math.min(400, Math.floor(safeNumber(state.totalEggsHatched, 0) * 4));

      const activeLevels = getUpgradesBought(state);
      power += Math.floor(activeLevels * 2);

      if (!Number.isFinite(power) || power < 0) power = 0;
      state.dragonPower = Math.floor(power);
      return state.dragonPower;
    }

    /** Alias clair pour futurs checks d'expéditions / zones. */
    function getPlayerDragonPower(state) {
      state = state || gameState;
      if (!Number.isFinite(state.dragonPower) || state.dragonPower <= 0) {
        return calculateDragonPower(state);
      }
      return Math.floor(safeNumber(state.dragonPower, 0));
    }

    function getEggDef(id) {
      return EGG_DEFS.find((e) => e.id === id) || EGG_DEFS.find((e) => e.id === "basic") || EGG_DEFS[0];
    }

    function getDragonDef(id) {
      return DRAGON_DEFS.find((d) => d.id === id) || null;
    }

    function getEquippedEggDef() {
      return getEggDef(gameState.equippedEggId || "basic");
    }

    /** Œufs jouables d'une zone (liste data-driven via zone.eggIds). */
    function getZoneCarouselEggs(zoneId) {
      const zone = getZoneDef(zoneId || gameState.currentZoneId);
      if (!zone) return [];
      const ids = zone.eggIds || [];
      return ids
        .map((id) => getEggDef(id))
        .filter((e) => e && !e.comingSoon && !e.secret);
    }

    function zoneSupportsEggCarousel(zoneId) {
      return getZoneCarouselEggs(zoneId || gameState.currentZoneId).length >= 2;
    }

    /** Voisins carrousel : next à droite, prev à gauche (index dans la liste). */
    function getCarouselNeighborEggs(zoneId) {
      const eggs = getZoneCarouselEggs(zoneId);
      const activeId = getZoneSelectedEggId(zoneId);
      const idx = eggs.findIndex((e) => e.id === activeId);
      if (idx < 0 || eggs.length < 2) return { prev: null, next: null };
      /* 2 œufs : l'autre est à droite si index supérieur, à gauche sinon (pas de wrap visuel). */
      if (eggs.length === 2) {
        const other = eggs[idx === 0 ? 1 : 0];
        if (idx === 0) return { prev: null, next: other };
        return { prev: other, next: null };
      }
      const next = eggs[(idx + 1) % eggs.length];
      const prev = eggs[(idx - 1 + eggs.length) % eggs.length];
      return {
        prev: prev && prev.id !== activeId ? prev : null,
        next: next && next.id !== activeId ? next : null
      };
    }

    function getCurrentEggData() {
      return getEquippedEggDef();
    }

    function getEggHatchPool(eggId) {
      const id = eggId || gameState.equippedEggId;
      const def = getEggDef(id);
      const pool = (def && def.dragonPool) || [];
      if (!pool.length) {
        /* Zone 4 provisoire : pools vides volontaires — pas de spam console. */
        if (!(def && def.dragonsComingSoon)) {
          console.warn("[DragonClicker] Aucun dragon dans le pool de l'œuf:", id);
        }
        return [];
      }
      const valid = [];
      pool.forEach((entry) => {
        const d = getDragonDef(entry.dragonId);
        if (!d) {
          console.warn("[DragonClicker] dragonId inconnu dans le pool de", id + ":", entry.dragonId);
          return;
        }
        if (d.eggId && def && d.eggId !== def.id) {
          console.warn(
            "[DragonClicker] Dragon hors famille ignoré dans le pool de",
            id + ":",
            entry.dragonId,
            "(eggId=",
            d.eggId + ")"
          );
          return;
        }
        valid.push(entry);
      });
      if (!valid.length) {
        if (!(def && def.dragonsComingSoon)) {
          console.warn("[DragonClicker] Pool cascade/œuf invalide après filtre:", id);
        }
      }
      return valid;
    }

    /** Dragons liés à un œuf (via egg.dragonPool, source de vérité). */
    function getDragonsForEgg(eggId) {
      return getEggHatchPool(eggId)
        .map((e) => getDragonDef(e.dragonId))
        .filter(Boolean);
    }

    function ensureZoneEggSelection(zoneId, state) {
      const s = state || gameState;
      if (!s.zoneEggSelection || typeof s.zoneEggSelection !== "object") {
        s.zoneEggSelection = {};
      }
      const eggs = getZoneCarouselEggs(zoneId);
      if (!eggs.length) return null;
      const cur = s.zoneEggSelection[zoneId];
      let selected = cur && cur.selectedEggId ? cur.selectedEggId : null;
      if (!selected || !eggs.some((e) => e.id === selected)) {
        selected = eggs[0].id;
      }
      s.zoneEggSelection[zoneId] = { selectedEggId: selected };
      return s.zoneEggSelection[zoneId];
    }

    function getZoneSelectedEggId(zoneId) {
      const zid = zoneId || gameState.currentZoneId || "sanctuary";
      const sel = ensureZoneEggSelection(zid);
      return sel ? sel.selectedEggId : (gameState.equippedEggId || "basic");
    }

    function setZoneSelectedEggId(zoneId, eggId) {
      const zid = zoneId || gameState.currentZoneId;
      ensureZoneEggSelection(zid);
      gameState.zoneEggSelection[zid].selectedEggId = eggId;
      gameState.equippedEggId = eggId;
    }

    function getEggVisualSrcForProgress(eggDef, progress) {
      if (!eggDef) return "assets/eggs/oeuf de base.png";
      const pct = getHatchPercent(eggDef, progress);
      const info = getEggVisualByProgress(pct, eggDef);
      return (info && info.src) || eggDef.image || "assets/eggs/oeuf de base.png";
    }

    function syncActiveEggFromZoneSelection() {
      const zoneId = gameState.currentZoneId || "sanctuary";
      if (!zoneSupportsEggCarousel(zoneId)) return;
      ensureZoneEggSelection(zoneId);
      const selected = getZoneSelectedEggId(zoneId);
      if (selected && gameState.equippedEggId !== selected) {
        gameState.equippedEggId = selected;
      }
      getZoneCarouselEggs(zoneId).forEach((e) => getEggProgress(e.id));
    }

    function renderEggCarouselDots() {
      const dots = document.getElementById("egg-carousel-dots");
      if (!dots) return;
      const zoneId = gameState.currentZoneId || "sanctuary";
      const eggs = getZoneCarouselEggs(zoneId);
      if (!zoneSupportsEggCarousel(zoneId) || eggs.length < 2) {
        dots.hidden = true;
        dots.setAttribute("aria-hidden", "true");
        dots.innerHTML = "";
        return;
      }
      const activeId = getZoneSelectedEggId(zoneId);
      dots.hidden = false;
      dots.setAttribute("aria-hidden", "false");
      dots.innerHTML = "";
      eggs.forEach((egg) => {
        const d = document.createElement("span");
        d.className = "egg-carousel-dot" + (egg.id === activeId ? " is-active" : "");
        d.setAttribute("aria-hidden", "true");
        dots.appendChild(d);
      });
    }

    function updateEggCarouselPeer() {
      const stage = document.getElementById("egg-stage");
      const peerNext = document.getElementById("egg-carousel-peer");
      const peerNextImg = document.getElementById("egg-carousel-peer-img");
      const peerPrev = document.getElementById("egg-carousel-peer-prev");
      const peerPrevImg = document.getElementById("egg-carousel-peer-prev-img");
      const picker = document.getElementById("egg-picker");
      const root = document.getElementById("egg-carousel-root");
      const activeSlot = document.getElementById("egg-carousel-active-slot");
      const zoneId = gameState.currentZoneId || "sanctuary";
      const eggs = getZoneCarouselEggs(zoneId);
      /* Pendant l'éclosion : GARDER is-egg-carousel (sinon l'actif saute en haut-gauche).
         On masque seulement les secondaires / interactions. */
      const carouselCapable = zoneSupportsEggCarousel(zoneId);

      if (stage) stage.classList.toggle("is-egg-carousel", carouselCapable);
      if (picker) picker.classList.toggle("carousel-mode", carouselCapable && !hatchSequenceActive);

      const resetPeerEl = (el) => {
        if (!el) return;
        el.classList.remove("to-center");
        el.style.transform = "";
        el.style.opacity = "";
        el.style.filter = "";
        el.style.zIndex = "";
        el.style.width = "";
        const peerImg = el.querySelector(".egg-carousel-item-img");
        if (peerImg) {
          peerImg.style.transform = "";
          peerImg.style.transformOrigin = "";
        }
      };

      const clearActiveMotion = () => {
        if (!activeSlot) return;
        activeSlot.classList.remove(
          "is-leaving-prev",
          "is-leaving-next",
          "to-side",
          "to-side-left"
        );
        activeSlot.style.transform = "";
        activeSlot.style.opacity = "";
        activeSlot.style.filter = "";
        /* Ne pas toucher left/top/position : gérés uniquement par le CSS carrousel */
      };

      const hidePeer = (el) => {
        if (!el) return;
        el.hidden = true;
        el.classList.add("is-hidden");
        el.setAttribute("aria-hidden", "true");
        el.removeAttribute("data-egg-id");
        resetPeerEl(el);
      };

      const showPeer = (el, img, eggDef, sideClass) => {
        if (!el || !img || !eggDef) {
          hidePeer(el);
          return;
        }
        const prog = getEggProgress(eggDef.id);
        const src = getEggVisualSrcForProgress(eggDef, prog.progress);
        el.dataset.eggId = eggDef.id;
        el.setAttribute("aria-label", "Sélectionner " + (eggDef.name || "œuf"));
        el.hidden = false;
        el.classList.remove("is-hidden");
        el.classList.remove("is-next", "is-prev");
        el.classList.add(sideClass);
        el.setAttribute("aria-hidden", "false");
        img.alt = eggDef.name || "";
        if (img.getAttribute("src") !== src) img.src = src;
        resetPeerEl(el);
        /* Même visualScale que l'œuf actif (ex. granite/storm ~91 %) — ratio carrousel inchangé. */
        const peerScale = safeNumber(eggDef.visualScale, 1);
        if (peerScale > 0 && peerScale !== 1 && Number.isFinite(peerScale)) {
          img.style.transform = "scale(" + peerScale + ")";
          img.style.transformOrigin = "center center";
        }
      };

      if (!carouselCapable || eggs.length < 2 || hatchSequenceActive ||
          isEggBossFightActive() || getSpecialEggHatch() || guardianHatchSequenceActive) {
        hidePeer(peerNext);
        hidePeer(peerPrev);
        if (root) {
          root.classList.remove("is-animating");
          root.classList.remove("is-settling");
        }
        clearActiveMotion();
        renderEggCarouselDots();
        return;
      }

      const neighbors = getCarouselNeighborEggs(zoneId);
      showPeer(peerNext, peerNextImg, neighbors.next, "is-next");
      showPeer(peerPrev, peerPrevImg, neighbors.prev, "is-prev");

      if (root) root.classList.remove("is-animating");
      clearActiveMotion();
      renderEggCarouselDots();
      scheduleUpdateGameCenterAxis();
    }

    function selectCarouselEgg(eggId) {
      if (isEggCarouselAnimating || hatchSequenceActive || guardianHatchSequenceActive ||
          clicksLocked || isEggBossFightActive() || getSpecialEggHatch()) return;
      const zoneId = gameState.currentZoneId || "sanctuary";
      if (!zoneSupportsEggCarousel(zoneId)) return;
      const eggs = getZoneCarouselEggs(zoneId);
      if (!eggs.some((e) => e.id === eggId)) return;
      if (getZoneSelectedEggId(zoneId) === eggId) return;

      const root = document.getElementById("egg-carousel-root");
      const activeSlot = document.getElementById("egg-carousel-active-slot");
      const peerNext = document.getElementById("egg-carousel-peer");
      const peerPrev = document.getElementById("egg-carousel-peer-prev");
      const fromNext = peerNext && !peerNext.hidden && peerNext.dataset.eggId === eggId;
      const fromPrev = peerPrev && !peerPrev.hidden && peerPrev.dataset.eggId === eggId;
      const peer = fromPrev ? peerPrev : peerNext;
      /* Clic next (droite) => actif part à gauche ; clic prev => actif part à droite */
      const leaveClass = fromPrev ? "is-leaving-next" : "is-leaving-prev";
      const reduce = prefersReducedMotion();

      const finishSwap = () => {
        setZoneSelectedEggId(zoneId, eggId);
        isEggCarouselAnimating = false;
        if (root) {
          root.classList.add("is-settling");
          root.classList.remove("is-animating");
        }
        if (activeSlot) {
          activeSlot.classList.remove("is-leaving-prev", "is-leaving-next", "to-side", "to-side-left");
          activeSlot.style.transform = "";
          activeSlot.style.opacity = "";
          activeSlot.style.filter = "";
        }
        if (peerNext) peerNext.classList.remove("to-center");
        if (peerPrev) peerPrev.classList.remove("to-center");
        applyEggScene(getEquippedEggDef());
        renderCurrentEgg();
        updateEggCarouselPeer();
        renderEggPicker();
        if (root) {
          void root.offsetWidth;
          root.classList.remove("is-settling");
        }
        eggsDirty = true;
        uiDirty = true;
        saveGame(true);
      };

      if (reduce || !root || !activeSlot || !peer || peer.hidden) {
        finishSwap();
        return;
      }

      isEggCarouselAnimating = true;
      root.classList.add("is-animating");
      void root.offsetWidth;
      activeSlot.classList.add(leaveClass);
      peer.classList.add("to-center");
      if (fromNext && peerPrev) peerPrev.style.opacity = "0";
      if (fromPrev && peerNext) peerNext.style.opacity = "0";

      let done = false;
      const end = () => {
        if (done) return;
        done = true;
        finishSwap();
      };
      const t = setTimeout(end, 450);
      const onEnd = (ev) => {
        if (ev.target !== peer && ev.target !== activeSlot) return;
        clearTimeout(t);
        peer.removeEventListener("transitionend", onEnd);
        activeSlot.removeEventListener("transitionend", onEnd);
        end();
      };
      peer.addEventListener("transitionend", onEnd);
      activeSlot.addEventListener("transitionend", onEnd);
    }

    function getEggProgress(eggId) {
      if (!gameState.eggs[eggId]) {
        const def = getEggDef(eggId);
        gameState.eggs[eggId] = {
          unlocked: !!(def && def.startUnlocked),
          progress: 0,
          timesHatched: 0,
          crackSoundPlayed: false,
          pityCounters: { sinceLegendary: 0, sinceMythic: 0 }
        };
      }
      const p = gameState.eggs[eggId];
      if (p.timesHatched == null) p.timesHatched = 0;
      if (p.crackSoundPlayed == null) p.crackSoundPlayed = false;
      if (!p.pityCounters) p.pityCounters = { sinceLegendary: 0, sinceMythic: 0 };
      return p;
    }

    function getEggHatchRequirement(eggDef) {
      if (!eggDef) return 300;
      return Math.max(1, eggDef.requiredHatchPower || eggDef.requiredClicks || eggDef.clicksRequired || 300);
    }

    function getHatchPercent(eggDef, progress) {
      const req = getEggHatchRequirement(eggDef);
      const p = Math.min(progress, req);
      return (p / req) * 100;
    }

    function getEggVisualByProgress(progressPercent, eggDef) {
      const pct = Math.max(0, safeNumber(progressPercent, 0));
      const fallback = (eggDef && eggDef.image) || "assets/eggs/oeuf de base.png";
      const variants = eggDef && eggDef.progressImages;
      /* Image stages: 0 = intact, 1 = 35%, 2 = 75%+ */
      if (pct >= 75) {
        return {
          stage: 2,
          key: "cracked75",
          src: (variants && (variants.cracked75 || variants.cracked35 || variants.intact)) || fallback
        };
      }
      if (pct >= 35) {
        return {
          stage: 1,
          key: "cracked35",
          src: (variants && (variants.cracked35 || variants.intact)) || fallback
        };
      }
      return {
        stage: 0,
        key: "intact",
        src: (variants && variants.intact) || fallback
      };
    }

    /* CSS effect stages (glow / shake) — independent from image stage */
    function getEggEffectStage(pct) {
      if (pct >= 90) return "egg-stage-critical";
      if (pct >= 75) return "egg-stage-hatching";
      if (pct >= 35) return "egg-stage-awakening";
      return "egg-stage-normal";
    }

    function getEggVisualStage(pct) {
      return getEggEffectStage(pct);
    }

    /** Chemins scène (background + œufs / fissures) pour une zone. */
    function getZoneSceneAssetPaths(zoneId) {
      const paths = [];
      const seen = Object.create(null);
      const push = (src) => {
        if (!src || seen[src]) return;
        seen[src] = true;
        paths.push(src);
      };
      const zone = getZoneDef(zoneId);
      if (!zone) return paths;
      const bgKey = zone.background;
      if (bgKey && SCENE_BACKGROUNDS[bgKey]) push(SCENE_BACKGROUNDS[bgKey]);
      (zone.eggIds || []).forEach((eggId) => {
        const def = getEggDef(eggId);
        if (!def || def.comingSoon || def.secret) return;
        push(def.image);
        if (def.progressImages) {
          Object.keys(def.progressImages).forEach((k) => push(def.progressImages[k]));
        }
      });
      return paths;
    }

    function preloadZoneSceneAssets(zoneId) {
      const paths = getZoneSceneAssetPaths(zoneId);
      if (!paths.length) return Promise.resolve();
      if (window.DCAssets && typeof DCAssets.preloadCritical === "function") {
        return DCAssets.preloadCritical(paths);
      }
      paths.forEach((src) => {
        const img = new Image();
        img.src = src;
      });
      return Promise.resolve();
    }

    /** Précharge uniquement les œufs / fissures de la zone courante (plus tous les EGG_DEFS). */
    function preloadEggProgressImages() {
      const zoneId = (gameState && gameState.currentZoneId) || "sanctuary";
      preloadZoneSceneAssets(zoneId);
    }

    /**
     * File idle : portraits découverts uniquement (Équipe / Dragons).
     * PAS de backgrounds / œufs des autres zones.
     */
    const DRAGONS_VIEWPORT_WARM = 8;
    const DRAGONS_WARM_WAIT_MS = 80;

    function scheduleSessionAssetWarmup() {
      if (!window.DCAssets || typeof DCAssets.preloadIdle !== "function") return;
      const paths = [];
      const seen = Object.create(null);
      const push = (src) => {
        if (!src || seen[src]) return;
        seen[src] = true;
        paths.push(src);
      };

      /* 1) Dragons découverts — ordre d'affichage filtre TOUS (premier viewport d'abord) */
      getDragonsForFilter("all").forEach((d) => {
        if (!d.image || d.secret) return;
        if (isDragonDiscovered(gameState.dragons?.[d.id], d.id, gameState)) {
          push(getDragonAsset(d, "thumb"));
        }
      });

      /* 2) Summon sprite éventuel */
      if (typeof DRAGON_SUMMON_SRC === "string" && DRAGON_SUMMON_SRC) push(DRAGON_SUMMON_SRC);

      DCAssets.preloadIdle(paths);
    }

    /** Premiers portraits DÉCOUVERTS du filtre (slots 0..cardLimit-1 uniquement). */
    function getViewportDiscoveredPortraitPaths(filterId, cardLimit) {
      const limit = Math.max(1, Math.floor(safeNumber(cardLimit, DRAGONS_VIEWPORT_WARM)));
      const defs = getDragonsForFilter(filterId || dragonsFilterZoneId || "all");
      const paths = [];
      for (let i = 0; i < Math.min(limit, defs.length); i++) {
        const d = defs[i];
        if (!d || !d.image || d.secret) continue;
        if (!isDragonDiscovered(gameState.dragons?.[d.id], d.id, gameState)) continue;
        paths.push(getDragonAsset(d, "thumb"));
      }
      return paths;
    }

    /**
     * Priorité haute : portraits découverts du premier viewport.
     * Retourne une Promise (preloadCritical) — ne bloque pas l'appelant.
     */
    function warmDragonsFirstViewport(filterId, cardLimit) {
      const paths = getViewportDiscoveredPortraitPaths(filterId, cardLimit);
      if (!paths.length || !window.DCAssets) return Promise.resolve(paths);
      if (typeof DCAssets.prioritize === "function") DCAssets.prioritize(paths);
      if (typeof DCAssets.preloadCritical === "function") {
        return DCAssets.preloadCritical(paths).then(function () { return paths; });
      }
      return Promise.resolve(paths);
    }

    function raceWarmDragonsViewport(filterId, cardLimit, maxWaitMs) {
      const wait = Math.max(0, Math.min(100, safeNumber(maxWaitMs, DRAGONS_WARM_WAIT_MS)));
      const warm = warmDragonsFirstViewport(filterId, cardLimit);
      if (wait <= 0) return warm;
      return Promise.race([
        warm,
        new Promise(function (resolve) { setTimeout(resolve, wait); })
      ]);
    }

    let currentEggImageStage = null;
    let currentEggImageEggId = null;
    let eggImgLoadToken = 0;

    function resetEggVisualState() {
      const wrap = document.getElementById("entity-wrap");
      const clickWrap = getEggClickWrapper();
      const hatchWrap = getEggHatchWrapper();
      const img = document.getElementById("egg-img");
      const visual = document.getElementById("egg-visual");

      safeCancelAnimation(eggClickAnimation);
      safeCancelAnimation(eggHatchAnimation);
      safeCancelAnimation(eggAmbientAnimation);
      safeCancelAnimation(eggClickGlowAnimation);
      eggClickAnimation = null;
      eggHatchAnimation = null;
      eggAmbientAnimation = null;
      eggClickGlowAnimation = null;

      if (wrap) {
        wrap.classList.remove(
          "hatching",
          "hatch-vanish",
          "hatched",
          "dragon-reveal",
          "clicked",
          "breathe"
        );
        wrap.style.opacity = "";
        wrap.style.transform = "";
        wrap.style.filter = "";
        if (wrap.getAnimations) {
          wrap.getAnimations().forEach((a) => { try { a.cancel(); } catch (e) { /* ignore */ } });
        }
      }
      if (clickWrap) {
        clickWrap.classList.remove("egg-press-fallback", "egg-press-active", "egg-press-animating");
        clickWrap.style.opacity = "";
        clickWrap.style.transform = "";
        clickWrap.style.filter = "";
        if (clickWrap.getAnimations) {
          clickWrap.getAnimations().forEach((a) => { try { a.cancel(); } catch (e) { /* ignore */ } });
        }
      }
      if (visual) {
        visual.classList.remove("egg-press-fallback", "egg-press-active", "egg-press-animating");
        visual.style.transform = "";
        if (visual.getAnimations) {
          visual.getAnimations().forEach((a) => { try { a.cancel(); } catch (e) { /* ignore */ } });
        }
      }
      if (hatchWrap) {
        hatchWrap.classList.remove("egg-soft-pulse", "egg-soft-pulse-mid", "egg-soft-pulse-fast");
        hatchWrap.style.opacity = "";
        hatchWrap.style.transform = "";
        hatchWrap.style.filter = "";
        if (hatchWrap.getAnimations) {
          hatchWrap.getAnimations().forEach((a) => { try { a.cancel(); } catch (e) { /* ignore */ } });
        }
      }
      if (img) {
        img.style.opacity = "1";
        img.style.visibility = "visible";
        img.style.display = "";
        img.classList.remove("egg-img-fading", "hidden", "egg-hidden", "hatching", "egg-hatching", "fade-out");
        /* Ne pas forcer hidden=false si l'image n'a aucun src valide :
           leave that to applyEggProgressImage / onload. */
        if (img.getAttribute("src") && img.complete && img.naturalWidth > 0) {
          img.hidden = false;
          if (visual) visual.classList.remove("fallback-active");
        }
      }
    }

    function applyEggVisualOffset(eggDef, stageKey) {
      const inner = document.getElementById("egg-visual-inner");
      if (!inner) return;
      let ox = 0;
      if (eggDef) {
        const map = eggDef.visualOffsetXByKey;
        if (map && stageKey && map[stageKey] != null) {
          ox = safeNumber(map[stageKey], 0);
        } else {
          ox = safeNumber(eggDef.visualOffsetX, 0);
        }
      }
      inner.style.setProperty("--egg-visual-ox", ox ? (ox + "%") : "0%");
      /* Scale visuelle optionnelle (ex. œufs Zone 3) — n'affecte pas la logique d'éclosion. */
      let scale = 1;
      if (eggDef && eggDef.visualScale != null) {
        scale = safeNumber(eggDef.visualScale, 1);
        if (!(scale > 0) || !Number.isFinite(scale)) scale = 1;
      }
      inner.style.setProperty("--egg-visual-scale", String(scale));
    }

    function applyEggProgressImage(src) {
      const img = document.getElementById("egg-img");
      const visual = document.getElementById("egg-visual");
      if (!img || !src) return;
      img.style.opacity = "1";
      img.style.visibility = "visible";
      img.style.display = "";
      img.classList.remove("egg-img-fading");
      const current = img.getAttribute("data-egg-src") || "";
      if (current === src) {
        if (img.complete && img.naturalWidth > 0) {
          img.hidden = false;
          if (visual) visual.classList.remove("fallback-active");
        } else if (!img.getAttribute("src")) {
          setImageWithFallback(img, src, visual);
        }
        return;
      }
      img.setAttribute("data-egg-src", src);
      setImageWithFallback(img, src, visual);
    }

    function syncEggProgressImage(eggDef, pct, force) {
      if (hatchSequenceActive && !force) return;
      const activeBoss = getActiveEggBoss();
      if (activeBoss && activeBoss.hp > 0) {
        const bdef = getEggBossDef(activeBoss.bossId);
        if (bdef && bdef.image) {
          applyEggVisualOffset(eggDef, "intact");
          if (!force && currentEggImageEggId === "boss:" + bdef.id && currentEggImageStage === -1) {
            applyEggProgressImage(bdef.image);
            return;
          }
          currentEggImageEggId = "boss:" + bdef.id;
          currentEggImageStage = -1;
          applyEggProgressImage(bdef.image);
          return;
        }
      }
      const special = getSpecialEggHatch();
      if (special) {
        const bdef = getEggBossDef(special.bossId);
        if (bdef && bdef.guardianEggImage) {
          applyEggVisualOffset(eggDef, "intact");
          const sid = "guardian:" + bdef.id;
          if (!force && currentEggImageEggId === sid && currentEggImageStage === -2) {
            applyEggProgressImage(bdef.guardianEggImage);
            return;
          }
          currentEggImageEggId = sid;
          currentEggImageStage = -2;
          applyEggProgressImage(bdef.guardianEggImage);
          return;
        }
      }
      const visual = getEggVisualByProgress(pct, eggDef);
      const eggId = eggDef && eggDef.id;
      applyEggVisualOffset(eggDef, visual && visual.key);
      if (!force &&
          currentEggImageEggId === eggId &&
          currentEggImageStage === visual.stage) {
        /* Même stade : garantir quand même la visibilité (corrige hidden/opacity coincés). */
        const img = document.getElementById("egg-img");
        if (img) {
          img.style.opacity = "1";
          img.style.visibility = "visible";
          if (img.hidden || !img.getAttribute("src")) {
            applyEggProgressImage(visual.src);
          }
        }
        return;
      }
      const stageChanged = !force &&
        currentEggImageEggId === eggId &&
        currentEggImageStage != null &&
        currentEggImageStage !== visual.stage;
      currentEggImageEggId = eggId;
      currentEggImageStage = visual.stage;
      if (stageChanged && window.DCAnim && typeof DCAnim.playCrackTransition === "function") {
        DCAnim.playCrackTransition(function () {
          applyEggProgressImage(visual.src);
        });
        return;
      }
      applyEggProgressImage(visual.src);
    }

    function getPoolWeightTotal(pool) {
      return (pool || []).reduce((sum, e) => sum + Math.max(0, safeNumber(e.weight, 0)), 0);
    }

    /** Global rarity drop rates (percent points). Missing rarities in a pool are skipped; remaining weights keep their relative share. */
    const RARITY_DROP_WEIGHTS = {
      common: 60,
      rare: 27,
      epic: 10,
      legendary: 2.75,
      mythic: 0.25
    };

    /**
     * Format a drop % for UI cards (FR decimal comma).
     * Never rounds small rates like 0.25 down to 0.
     * 60 → "60 %" · 2.75 → "2,75 %" · 0.25 → "0,25 %"
     */
    function formatDropPercent(pct) {
      const n = Number(pct);
      if (!Number.isFinite(n) || n < 0) return "0 %";
      /* Keep up to 2 decimals — enough for 2.75 / 0.25 without integer truncation. */
      const rounded = Math.round(n * 100) / 100;
      if (Math.abs(rounded - Math.round(rounded)) < 1e-9) {
        return String(Math.round(rounded)) + " %";
      }
      let text = rounded.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
      text = text.replace(".", ",");
      return text + " %";
    }

    /**
     * Effective rarity drop % for an egg (same weights as the hatch roll).
     * When an egg misses a rarity, remaining weights are renormalized — matches real odds.
     */
    function getEggRarityDropPercent(eggDef, rarity) {
      if (!eggDef || !rarity) return 0;
      const base = getEggHatchPool(eggDef.id);
      const luck = safeNumber(gameState.multipliers?.rarityLuck, 0);
      const buckets = groupEggPoolByRarity(base);
      let total = 0;
      let target = 0;
      Object.keys(buckets).forEach((rar) => {
        if (!buckets[rar] || !buckets[rar].length) return;
        let w = safeNumber(RARITY_DROP_WEIGHTS[rar], 0);
        if (w <= 0) return;
        if (luck > 0 && isRarePlusRarity(rar)) {
          w = w * (1 + luck);
        }
        total += w;
        if (rar === rarity) target = w;
      });
      if (total <= 0) return 0;
      return (target / total) * 100;
    }

    function isRarePlusRarity(rarity) {
      return rarity === "rare" || rarity === "epic" || rarity === "legendary" || rarity === "mythic" || rarity === "divine";
    }

    /**
     * Group hatch-pool entries by dragon rarity.
     * Returns { common: [{dragonId, weight}, ...], ... }
     */
    function groupEggPoolByRarity(pool) {
      const buckets = Object.create(null);
      (pool || []).forEach((entry) => {
        const def = getDragonDef(entry.dragonId);
        if (!def) return;
        const rar = def.rarity || "common";
        if (!buckets[rar]) buckets[rar] = [];
        buckets[rar].push(entry);
      });
      return buckets;
    }

    /**
     * Build an effective weighted pool:
     * 1) each present rarity gets RARITY_DROP_WEIGHTS[rarity]
     * 2) that weight is split equally among dragons of that rarity
     * rarityLuck boosts Rare+ rarity weights before the equal split.
     * Base egg.dragonPool data is never mutated.
     */
    function getAdjustedEggPool(eggDef) {
      const base = getEggHatchPool(eggDef && eggDef.id);
      const luck = safeNumber(gameState.multipliers?.rarityLuck, 0);
      const buckets = groupEggPoolByRarity(base);
      const out = [];
      Object.keys(buckets).forEach((rar) => {
        const members = buckets[rar];
        if (!members.length) return;
        let rarWeight = safeNumber(RARITY_DROP_WEIGHTS[rar], 0);
        if (rarWeight <= 0) return;
        if (luck > 0 && isRarePlusRarity(rar)) {
          rarWeight = rarWeight * (1 + luck);
        }
        const perDragon = rarWeight / members.length;
        members.forEach((entry) => {
          out.push({ dragonId: entry.dragonId, weight: perDragon });
        });
      });
      return out;
    }

    function getPoolChancePercent(eggDef, dragonId) {
      const pool = getAdjustedEggPool(eggDef);
      const total = getPoolWeightTotal(pool);
      if (total <= 0) return 0;
      const entry = pool.find((e) => e.dragonId === dragonId);
      if (!entry) return 0;
      return (entry.weight / total) * 100;
    }

    function getActiveRarityLuckPercent() {
      return safeNumber(gameState.multipliers?.rarityLuck, 0) * 100;
    }

    /**
     * Two-step hatch roll:
     * 1) pick a rarity among those present in the egg pool (global rarity weights)
     * 2) pick uniformly among dragons of that rarity
     * Implemented via getAdjustedEggPool weights so display % and twin rolls stay consistent.
     * Pity architecture is prepared but NOT applied while pity.enabled is false.
     */
    function rollDragonFromEgg(eggId) {
      const egg = getEggDef(eggId);
      const pool = getAdjustedEggPool(egg);
      if (!pool.length) {
        console.warn("[DragonClicker] Impossible de tirer un dragon — pool vide pour l'œuf:", eggId);
        return null;
      }

      /* Future pity hooks — intentionally inactive */
      if (egg && egg.pity && egg.pity.enabled) {
        /* applyPityModifiers(egg, pool) — not implemented yet */
      }

      const total = getPoolWeightTotal(pool);
      if (total <= 0) return pool[0].dragonId;

      let roll = Math.random() * total;
      for (let i = 0; i < pool.length; i++) {
        roll -= Math.max(0, safeNumber(pool[i].weight, 0));
        if (roll <= 0) return pool[i].dragonId;
      }
      return pool[pool.length - 1].dragonId;
    }

    function updateCps(now) {
      const cutoff = now - CPS_WINDOW_MS;
      /* Trim in-place (évite realloc filter à chaque clic / frame). */
      let drop = 0;
      while (drop < clickTimestamps.length && clickTimestamps[drop] < cutoff) drop++;
      if (drop > 0) clickTimestamps.splice(0, drop);
      gameState.currentCps = clickTimestamps.length;
      if (gameState.currentCps > gameState.peakCps) {
        gameState.peakCps = gameState.currentCps;
      }
    }

    /** Stats combat clic — lit le cache multipliers (pas de rebuild complet). */
    function getClickCombatStats() {
      if (!gameState.multipliers) rebuildMultipliers();
      const m = gameState.multipliers;
      const clickPower = Number.isFinite(gameState.powerPerClick) && gameState.powerPerClick > 0
        ? gameState.powerPerClick
        : 1;
      return {
        clickPower: clickPower,
        critChance: safeNumber(m && m.critChance, CRIT_CHANCE_BASE),
        critMultiplier: safeNumber(m && m.critMult, CRIT_MULT_BASE)
      };
    }

    /**
     * Crossfade scene backdrop. Safe to call with unknown ids (no-op if missing).
     * Duration ~850ms via CSS transition on #scene-bg-fader.
     */
    let currentSceneBgId = null;
    function setSceneBackground(backgroundId) {
      const url = SCENE_BACKGROUNDS[backgroundId];
      if (!url) return;
      const layer = document.getElementById("scene-bg");
      const fader = document.getElementById("scene-bg-fader");
      if (!layer || !fader) return;

      if (currentSceneBgId === backgroundId && layer.style.backgroundImage) return;

      const nextImage = 'url("' + url.replace(/"/g, '\\"') + '")';

      if (!currentSceneBgId || !layer.style.backgroundImage) {
        layer.style.backgroundImage = nextImage;
        layer.dataset.bgId = backgroundId;
        currentSceneBgId = backgroundId;
        fader.style.opacity = "0";
        return;
      }

      /* Crossfade: show current on fader, swap base, fade fader out */
      fader.style.backgroundImage = layer.style.backgroundImage;
      fader.dataset.bgId = layer.dataset.bgId || currentSceneBgId || "";
      fader.style.opacity = "1";
      layer.style.backgroundImage = nextImage;
      layer.dataset.bgId = backgroundId;
      currentSceneBgId = backgroundId;

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          fader.style.opacity = "0";
        });
      });
    }

    function applyEggScene(eggDef) {
      const zone = getCurrentZone();
      const zoneBg = zone && zone.background;
      const eggBg = eggDef && eggDef.background;
      const bgId = (zoneBg && SCENE_BACKGROUNDS[zoneBg])
        ? zoneBg
        : ((eggBg && SCENE_BACKGROUNDS[eggBg]) ? eggBg : "basic");
      setSceneBackground(bgId);
    }

    function countEggPoolDiscovered(eggDef) {
      let n = 0;
      getEggHatchPool(eggDef && eggDef.id).forEach((entry) => {
        if (isDragonDiscovered(null, entry.dragonId, gameState)) n++;
      });
      return n;
    }

    function getRarestOwnedLabel() {
      const order = ["divine", "mythic", "legendary", "epic", "rare", "common"];
      for (let i = 0; i < order.length; i++) {
        const rar = order[i];
        const found = DRAGON_DEFS.find((d) => {
          return isDragonDiscovered(gameState.dragons[d.id], d.id, gameState) && d.rarity === rar;
        });
        if (found) {
          const r = RARITIES[rar];
          return found.name + " (" + (r ? r.label : rar) + ")";
        }
      }
      return "Aucun";
    }

    /* -------------------------------------------------------
       CORE ACTIONS
       ------------------------------------------------------- */
    /* Codes bonus (extensible) — un seul redeem par code / sauvegarde */
    const BONUS_CODES = {
      "1234": { type: "essence", amount: 1000000 },
      /* Bypass temporaire accès Zone 3 (anciennes saves Z2 terminées). Pas d'Essence / zoneSpent. */
      "LEGACY-Z3-2026": { type: "unlockZone", zoneId: "mountains" },
      /* Accès anticipé Zone 4 — unlock uniquement (pas d'Essence / zoneSpent). */
      "LEGACY-Z4-2026": {
        type: "unlockZone",
        zoneId: "zone4",
        successMessage: "Royaume oublié débloqué !",
        alreadyMessage: "Le Royaume oublié est déjà débloqué."
      },
      /* Accès anticipé zone événement Halloween (sans Essence / zoneSpent). */
      "HALLOWEEN2026": {
        type: "unlockZone",
        zoneId: "halloween",
        successMessage: "Zone Halloween débloquée !"
      }
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
      const code = String(rawCode == null ? "" : rawCode).trim().toUpperCase();
      if (!code) {
        setBonusCodeFeedback("Code invalide.", "error");
        showNotification("CODES BONUS", "Code invalide.");
        return false;
      }
      const reward = BONUS_CODES[code];
      if (!reward) {
        setBonusCodeFeedback("Code invalide.", "error");
        showNotification("CODES BONUS", "Code invalide.");
        return false;
      }
      if (!Array.isArray(gameState.redeemedCodes)) gameState.redeemedCodes = [];

      if (reward.type === "unlockZone") {
        const zoneId = reward.zoneId || "mountains";
        const zone = getZoneDef(zoneId);
        const zoneName = zone && zone.name ? zone.name : "Zone";
        const successMsg = reward.successMessage || (zoneName + " débloquée !");
        const alreadyMsg = reward.alreadyMessage || (zoneName + " déjà débloquée.");
        if (isZoneUnlocked(gameState, zoneId)) {
          if (gameState.redeemedCodes.indexOf(code) === -1) {
            gameState.redeemedCodes.push(code);
            saveGame(true);
          }
          setBonusCodeFeedback(alreadyMsg, "ok");
          showNotification("CODES BONUS", alreadyMsg);
          return true;
        }
        /* Accès permanent via unlockedZones — sans Essence ni zoneSpent. */
        if (!gameState.unlockedZones) gameState.unlockedZones = ["sanctuary"];
        if (gameState.unlockedZones.indexOf(zoneId) === -1) {
          gameState.unlockedZones.push(zoneId);
        }
        if (!gameState.meta) gameState.meta = {};
        gameState.meta.unlockedZones = gameState.unlockedZones.slice();
        unlockZoneEggs(zoneId);
        if (gameState.redeemedCodes.indexOf(code) === -1) {
          gameState.redeemedCodes.push(code);
        }
        shopDirty = true;
        zonesDirty = true;
        eggsDirty = true;
        dragonsDirty = true;
        uiDirty = true;
        saveGame(true);
        renderZones();
        renderDragons();
        playSound("zoneUnlock");
        setBonusCodeFeedback(successMsg, "ok");
        showNotification("CODE VALIDÉ !", successMsg);
        const inputUnlock = document.getElementById("bonus-code-input");
        if (inputUnlock) inputUnlock.value = "";
        return true;
      }

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

      setBonusCodeFeedback("Code invalide.", "error");
      showNotification("CODES BONUS", "Code invalide.");
      return false;
    }

    function addEssence(amount, source) {
      amount = safeNumber(amount, 0);
      if (amount <= 0) return;
      gameState.dragonEssence = safeNumber(gameState.dragonEssence, 0) + amount;
      gameState.totalEssenceEarned = safeNumber(gameState.totalEssenceEarned, 0) + amount;
      /* Keep legacy mirrors in sync for old UI/achievement helpers */
      gameState.totalPowerEarned = gameState.totalEssenceEarned;
      if (source === "click") {
        gameState.essenceFromClicks = safeNumber(gameState.essenceFromClicks, 0) + amount;
        gameState.powerFromClicks = gameState.essenceFromClicks;
      } else if (source === "auto" || source === "offline" || source === "expedition") {
        gameState.essenceFromAuto = safeNumber(gameState.essenceFromAuto, 0) + amount;
        gameState.powerFromAuto = gameState.essenceFromAuto;
      }
      updateEggStage();
      uiDirty = true;
      if (source !== "auto" && amount >= Math.max(5, safeNumber(gameState.powerPerClick, 1) * 2)) {
        pulseHudEssence();
      }
    }

    function spendEssence(amount, opts) {
      amount = safeNumber(amount, 0);
      if (amount <= 0) return true;
      if (gameState.dragonEssence < amount) return false;
      gameState.dragonEssence -= amount;
      if (gameState.dragonEssence < 0) gameState.dragonEssence = 0;
      if (opts && opts.zoneId) recordZoneSpend(opts.zoneId, amount);
      uiDirty = true;
      if (window.DCAnim && DCAnim.pulseHudSpend) DCAnim.pulseHudSpend();
      else {
        const pill = document.querySelector(".essence-stat");
        if (pill) triggerAnim(pill, "anim-hud-spend", 220);
      }
      return true;
    }

    /* Compat aliases — ancienne monnaie "power" = essence dépensable */
    function addPower(amount, source) { return addEssence(amount, source); }
    function spendPower(amount, opts) { return spendEssence(amount, opts); }

    function ensureZoneSpent(state) {
      const s = state || gameState;
      if (!s.zoneSpent || typeof s.zoneSpent !== "object") s.zoneSpent = {};
      ZONE_DEFS.forEach((z) => {
        if (s.zoneSpent[z.id] == null) s.zoneSpent[z.id] = 0;
      });
      return s.zoneSpent;
    }

    function getZoneSpent(zoneId, state) {
      const s = state || gameState;
      ensureZoneSpent(s);
      return Math.max(0, safeNumber(s.zoneSpent[zoneId], 0));
    }

    function recordZoneSpend(zoneId, amount) {
      amount = safeNumber(amount, 0);
      if (!zoneId || amount <= 0) return;
      ensureZoneSpent(gameState);
      gameState.zoneSpent[zoneId] = getZoneSpent(zoneId) + amount;
      zonesDirty = true;
    }

    /** Reconstruct spent essence from owned levels (migration / sanity). */
    function estimateZoneSpentFromProgress(state, zoneId) {
      const s = state || gameState;
      let total = 0;
      PRODUCER_DEFS.forEach((def) => {
        if (def.zoneId !== zoneId) return;
        const owned = Math.max(0, Math.floor(safeNumber(s.producers?.[def.id]?.owned, 0)));
        for (let i = 0; i < owned; i++) total += calculateLevelCost(def, i);
      });
      ACTIVE_UPGRADE_DEFS.forEach((def) => {
        if (def.zoneId !== zoneId) return;
        const maxL = Math.max(1, Math.floor(safeNumber(def.maxLevel, MAX_ACTIVE_LEVEL)));
        const level = Math.max(0, Math.min(maxL, Math.floor(safeNumber(s.activeUpgrades?.[def.id]?.level, 0))));
        for (let i = 0; i < level; i++) total += getActiveUpgradeCost(def, i);
      });
      SHOP_PASSIVE_DEFS.forEach((def) => {
        if (def.zoneId !== zoneId) return;
        if (s.shopPassives?.[def.id]?.bought) total += safeNumber(def.cost, 0);
      });
      LEVEL_PASSIVE_DEFS.forEach((def) => {
        if (def.zoneId && def.zoneId !== zoneId) return;
        const maxL = Math.max(1, Math.floor(safeNumber(def.maxLevel, 1)));
        const level = Math.max(0, Math.min(maxL, Math.floor(safeNumber(s.levelPassives?.[def.id]?.level, 0))));
        for (let i = 0; i < level; i++) {
          const c = getLevelPassiveCost(def, i);
          if (Number.isFinite(c)) total += c;
        }
      });
      SPECIAL_UPGRADE_DEFS.forEach((def) => {
        if (def.zoneId !== zoneId) return;
        if (s.specialUpgrades?.[def.id]?.bought) total += safeNumber(def.cost, 0);
      });
      return Math.max(0, Math.floor(total));
    }

    function getZoneInvestRequirement(zone) {
      const req = (zone.unlockRequirements || []).find((r) => r.type === "zoneSpent");
      if (!req) return null;
      return {
        fromZoneId: req.zoneId || "sanctuary",
        amount: Math.max(0, safeNumber(req.value, 0))
      };
    }

    /**
     * Puissance économique d'un clic manuel (Essence uniquement).
     * Critique Essence, Frappe Chargée et combo s'appliquent ici.
     */
    function calculateEffectiveManualClickPower(isCrit, critMult, comboBonus, clickPower, chargedMult) {
      const ppc = safeNumber(clickPower != null ? clickPower : gameState.powerPerClick, BASE_CLICK_POWER);
      const charged = Math.max(1, safeNumber(chargedMult, 1));
      const mult = charged * (isCrit ? safeNumber(critMult, CRIT_MULT_BASE) : 1) * (1 + safeNumber(comboBonus, 0));
      /* clickEssencePct / essenceGlobal : Essence du clic uniquement — pas la progression d'éclosion */
      const essenceOnly = 1 + safeNumber(gameState.multipliers?.clickEssencePct, 0);
      return ppc * mult * Math.max(0, essenceOnly);
    }

    function calculateClickEssence(isCrit, critMult, comboBonus) {
      return calculateEffectiveManualClickPower(isCrit, critMult, comboBonus);
    }

    /**
     * Progression d'éclosion d'un clic manuel — indépendante de l'Essence.
     * Base = puissance de clic effective (upgrades + dragons clic).
     * Critique œuf ×1.5 · Frappe Chargée œuf ×2 · cumul ×3.
     */
    function calculateHatchProgressGain(clickPower, isCrit, isCharged) {
      let progress = safeNumber(clickPower != null ? clickPower : gameState.powerPerClick, BASE_CLICK_POWER);
      if (progress < 0 || !Number.isFinite(progress)) progress = 0;
      if (isCrit) progress *= HATCH_CRIT_MULTIPLIER;
      if (isCharged) progress *= HATCH_CHARGED_MULTIPLIER;
      return progress;
    }

    /** Incrémente le compteur Frappe Chargée ; retourne true si ce clic doit être xN. */
    function tickChargedStrikeOnManualClick() {
      const every = getChargedStrikeTriggerClicks();
      if (every <= 0) return false;
      let n = Math.max(0, Math.floor(safeNumber(gameState.chargedStrikeClicks, 0))) + 1;
      if (n >= every) {
        gameState.chargedStrikeClicks = 0;
        return true;
      }
      gameState.chargedStrikeClicks = n;
      return false;
    }

    function handleClick(clientX, clientY) {
      if (clicksLocked || hatchSequenceActive || guardianHatchSequenceActive || isEggCarouselAnimating) return;
      if (!isEggGameplayHit(clientX, clientY)) return;

      const now = performance.now();
      clickTimestamps.push(now);
      updateCps(now);

      /* Cache multipliers — pas de rebuild complet à chaque clic. */
      const stats = getClickCombatStats();
      const critChance = stats.critChance;
      const clickPower = stats.clickPower;
      const isCrit = Math.random() < critChance;
      const isCharged = tickChargedStrikeOnManualClick();

      /* Combat Boss actif : dégâts uniquement (pas d'Essence / pas de hatch). */
      if (isEggBossFightActive()) {
        gameState.totalClicks++;
        gameState.lifetimeManualClicks = safeNumber(gameState.lifetimeManualClicks, 0) + 1;
        if (isCrit) gameState.totalCriticalClicks++;
        damageEggBoss(clickPower, isCrit, isCharged, clientX, clientY);
        const pressPrimedBoss = (now - eggPressPrimedAt) < 120;
        if (!pressPrimedBoss) {
          playEggClickPress(!!isCrit, { charged: isCharged });
        }
        eggPressPrimedAt = 0;
        AudioManager.unlock();
        playSound("click", isCrit || isCharged);
        updateChargedAuraVisual();
        lastHudRefreshAt = 0;
        return;
      }

      const critMult = stats.critMultiplier;
      const chargedMult = isCharged ? getChargedStrikeMultiplier() : 1;
      const comboBonus = updateComboOnClick(now);
      const essenceGain = calculateEffectiveManualClickPower(
        isCrit, critMult, comboBonus, clickPower, chargedMult
      );
      const hatchGain = calculateHatchProgressGain(clickPower, isCrit, isCharged);

      gameState.totalClicks++;
      gameState.lifetimeManualClicks = safeNumber(gameState.lifetimeManualClicks, 0) + 1;
      if (isCrit) gameState.totalCriticalClicks++;

      addPower(essenceGain, "click");
      renderComboHud();

      /* Manual clicks only — progression œuf ≠ Essence du clic */
      advanceEggProgress(hatchGain);

      checkSecretUnlocks();

      /*
        Feedback visuel = pointerdown uniquement.
        Fallback click seulement si aucun press récent (pointerdown manqué).
        Crit/charged : glow via spawnClickEffects, PAS de 2e press qui cancel.
      */
      const pressPrimed = (now - eggPressPrimedAt) < 120;
      if (!pressPrimed) {
        playEggClickPress(!!isCrit, { charged: isCharged });
      }
      eggPressPrimedAt = 0;

      spawnClickEffects(clientX, clientY, essenceGain, isCrit, { charged: isCharged });
      AudioManager.unlock();
      playSound("click", isCrit || isCharged);
      updateChargedAuraVisual();
      /* Succès : check throttlé dans updateGame (pas à chaque clic). */
      /* Ne pas rebuild boutique / améliorations / picker œufs à chaque clic :
         l'affordability est rafraîchie tant que le panneau shop est ouvert. */
      lastHudRefreshAt = 0;
      lastEggProgressUiAt = 0;
    }

    let eggHitRectCache = null;
    let eggHitRectCacheAt = 0;
    const EGG_HIT_RECT_CACHE_MS = 80;

    function invalidateEggHitRectCache() {
      eggHitRectCache = null;
      eggHitRectCacheAt = 0;
    }

    function getEggHitRect() {
      const now = performance.now();
      if (eggHitRectCache && (now - eggHitRectCacheAt) < EGG_HIT_RECT_CACHE_MS) {
        return eggHitRectCache;
      }
      const hit = document.getElementById("egg-hitbox");
      const el = hit || document.getElementById("egg-visual");
      if (!el) {
        eggHitRectCache = null;
        return null;
      }
      eggHitRectCache = el.getBoundingClientRect();
      eggHitRectCacheAt = now;
      return eggHitRectCache;
    }

    /**
     * Hit-test gameplay œuf : ellipse de #egg-hitbox (pas le rectangle PNG / click-zone).
     * Clic hors ellipse = aucun press, aucune Essence, aucune progression.
     */
    function isEggGameplayHit(clientX, clientY) {
      if (clientX == null || clientY == null) return false;
      const r = getEggHitRect();
      if (!r || !(r.width > 0) || !(r.height > 0)) return false;
      const rx = r.width * 0.5;
      const ry = r.height * 0.5;
      const dx = (clientX - (r.left + rx)) / rx;
      const dy = (clientY - (r.top + ry)) / ry;
      return (dx * dx + dy * dy) <= 1;
    }

    /** Visual-only press feedback — never grants resources */
    function handleEggPointerDown(clientX, clientY) {
      if (clicksLocked || hatchSequenceActive || guardianHatchSequenceActive || isEggCarouselAnimating) return;
      if (!isEggGameplayHit(clientX, clientY)) return;
      AudioManager.unlock();
      eggPressPrimedAt = performance.now();
      playEggClickPress(false);
    }

    function advanceEggProgress(amount) {
      if (hatchSequenceActive || guardianHatchSequenceActive || clicksLocked || isEggCarouselAnimating) return;
      if (isEggBossFightActive()) return;
      amount = safeNumber(amount, 0);
      if (amount <= 0) return;

      const special = getSpecialEggHatch();
      if (special) {
        const req = Math.max(1, safeNumber(special.required, 1));
        if (special.progress >= req) {
          completeGuardianEggHatch();
          return;
        }
        special.progress = Math.min(req, safeNumber(special.progress, 0) + amount);
        renderEggProgressUI();
        /* Pas de forceImage : syncEggProgressImage ne recharge qu'au changement de stage. */
        updateEggVisualState();
        if (special.progress >= req) {
          completeGuardianEggHatch();
        }
        return;
      }

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
    }

    function checkSecretUnlocks() {
      /* Reserved for future secret eggs */
    }

    function unlockEggsFromDragons() {
      /* Reserved for future egg unlock chains */
    }

    function getProducerMaxLevel(def) {
      return Math.max(1, Math.floor(safeNumber(def.maxLevel, MAX_PRODUCER_LEVEL)));
    }

    function buyProducer(id) {
      if (buyingLock) return;
      const def = PRODUCER_DEFS.find((p) => p.id === id);
      if (!def) return;
      if (def.zoneId && !isZoneUnlocked(gameState, def.zoneId)) return;

      const owned = safeNumber(gameState.producers[id]?.owned, 0);
      const maxLvl = getProducerMaxLevel(def);
      if (owned >= maxLvl) return;

      const cost = getProducerCost(def, owned);
      if (gameState.dragonEssence < cost) {
        playSound("error");
        const failCard = document.querySelector('[data-producer-id="' + id + '"]');
        if (failCard) triggerAnim(failCard, "anim-shake", 220);
        return;
      }

      buyingLock = true;
      try {
        if (!spendPower(cost, { zoneId: def.zoneId })) return;
        gameState.producers[id].owned = owned + 1;
        calculateProduction();
        const lvl = gameState.producers[id].owned;
        showNotification(
          "🐲 Producteur",
          def.name + " → niv. " + lvl + (lvl >= maxLvl ? " (MAX)" : "")
        );
        playSound("buy");
        const boughtCard = document.querySelector('[data-producer-id="' + id + '"]');
        if (boughtCard) {
          const atMax = lvl >= maxLvl;
          if (window.DCAnim && DCAnim.purchaseFlash) DCAnim.purchaseFlash(boughtCard, atMax);
          else triggerAnim(boughtCard, atMax ? "anim-purchase-max" : "anim-purchase", atMax ? 420 : 300);
          spawnUiFloat(boughtCard, atMax ? "MAX" : ("Niv. " + lvl));
        }
        checkAchievements();
        shopDirty = true;
        uiDirty = true;
      } finally {
        buyingLock = false;
      }
    }

    function buyActiveUpgradeLevel(id) {
      if (buyingLock) return;
      const def = getActiveUpgradeDef(id);
      if (!def) return;
      if (!isZoneUnlocked(gameState, def.zoneId)) return;
      if (!gameState.activeUpgrades[id]) gameState.activeUpgrades[id] = { level: 0 };
      const level = getActiveUpgradeLevel(id);
      if (level >= def.maxLevel) return;
      const cost = getActiveUpgradeCost(def, level);
      if (gameState.dragonEssence < cost) return;

      buyingLock = true;
      try {
        if (!spendPower(cost, { zoneId: def.zoneId })) return;
        gameState.activeUpgrades[id].level = level + 1;
        calculateProduction();
        const nl = gameState.activeUpgrades[id].level;
        showNotification(
          "⭐ " + def.name,
          "Niveau " + nl + " / " + def.maxLevel + (nl >= def.maxLevel ? " · MAX" : "")
        );
        playSound("upgrade");
        const upCard = document.querySelector('[data-active-id="' + id + '"]');
        if (upCard) {
          const atMax = nl >= def.maxLevel;
          if (window.DCAnim && DCAnim.purchaseFlash) DCAnim.purchaseFlash(upCard, atMax);
          else triggerAnim(upCard, atMax ? "anim-purchase-max" : "anim-purchase", atMax ? 420 : 300);
          spawnUiFloat(upCard, atMax ? "MAX" : ("Niv. " + nl));
        }
        checkAchievements();
        upgradesDirty = true;
        uiDirty = true;
      } finally {
        buyingLock = false;
      }
    }

    function buyShopPassive(id) {
      if (buyingLock) return;
      const def = SHOP_PASSIVE_DEFS.find((u) => u.id === id);
      if (!def) return;
      if (def.zoneId && !isZoneUnlocked(gameState, def.zoneId)) return;
      if (!gameState.shopPassives[id]) gameState.shopPassives[id] = { bought: false };
      if (gameState.shopPassives[id].bought) return;
      if (gameState.dragonEssence < def.cost) return;

      buyingLock = true;
      try {
        if (!spendPower(def.cost, { zoneId: def.zoneId })) return;
        gameState.shopPassives[id].bought = true;
        calculateProduction();
        showNotification("🛒 Bonus passif", def.name);
        playSound("buy");
        checkAchievements();
        shopDirty = true;
        uiDirty = true;
      } finally {
        buyingLock = false;
      }
    }

    /* Legacy alias — older UI bindings */
    function buyUpgrade(id) {
      if (SHOP_PASSIVE_DEFS.some((d) => d.id === id)) return buyShopPassive(id);
      return buyActiveUpgradeLevel(id);
    }

    function getComboWindowMs() {
      return COMBO_BASE_MS + safeNumber(gameState.multipliers.fervorDuration, 0);
    }

    function getComboBonusFromCount(count) {
      let base = 0;
      for (let i = 0; i < COMBO_TIERS.length; i++) {
        if (count >= COMBO_TIERS[i].at) base = COMBO_TIERS[i].bonus;
      }
      if (base <= 0) return 0;
      const fervor = safeNumber(gameState.multipliers.fervorPower, 0);
      return base * (1 + fervor);
    }

    function updateComboOnClick(now) {
      const windowMs = getComboWindowMs();
      const last = safeNumber(gameState._lastComboClickAt, 0);
      if (!last || now - last > windowMs) {
        gameState.comboCount = 0;
      }
      gameState.comboCount = safeNumber(gameState.comboCount, 0) + 1;
      gameState._lastComboClickAt = now;
      gameState.comboBonus = getComboBonusFromCount(gameState.comboCount);
      return gameState.comboBonus;
    }

    function renderComboHud() {
      /* Combo mechanics stay active (Ferveur, bonuses) — UI badge intentionally hidden. */
      const el = document.getElementById("combo-hud");
      if (el) el.classList.add("hidden");
    }

    /* -------------------------------------------------------
       EGG / DRAGON SYSTEMS
       ------------------------------------------------------- */
    function getEggStageFromPower(totalEarned) {
      for (let i = EGG_STAGES.length - 1; i >= 0; i--) {
        if (totalEarned >= EGG_STAGES[i].min) return EGG_STAGES[i];
      }
      return EGG_STAGES[0];
    }

    /** Legacy cosmetic stage tracker (V1 cave egg) — kept for save compat */
    function updateEggStage() {
      const stage = getEggStageFromPower(gameState.totalEssenceEarned);
      const nextId = stage.id;
      if (gameState.eggStage === nextId) return;
      gameState.eggStage = nextId;
      /* Legacy auto-hatch flag no longer transforms the main entity;
         collection hatch sets eggHatched instead. */
      const cssEgg = document.getElementById("egg");
      if (cssEgg) {
        cssEgg.className = "egg stage-" + Math.min(nextId, 3);
      }
    }

    function setImageWithFallback(imgEl, src, fallbackContainer) {
      if (!imgEl) return;
      const token = ++eggImgLoadToken;
      imgEl.onload = function () {
        if (token !== eggImgLoadToken) return;
        if (fallbackContainer) fallbackContainer.classList.remove("fallback-active");
        imgEl.hidden = false;
        imgEl.style.opacity = "1";
        imgEl.style.visibility = "visible";
      };
      imgEl.onerror = function () {
        if (token !== eggImgLoadToken) return;
        console.error("[EGG] impossible de charger :", src);
        imgEl.hidden = true;
        if (fallbackContainer) fallbackContainer.classList.add("fallback-active");
      };
      if (!src) {
        imgEl.hidden = true;
        if (fallbackContainer) fallbackContainer.classList.add("fallback-active");
        return;
      }
      /* Si la même URL est déjà affichée et valide, ne pas relancer un load. */
      if (imgEl.getAttribute("src") === src && imgEl.complete && imgEl.naturalWidth > 0) {
        imgEl.hidden = false;
        if (fallbackContainer) fallbackContainer.classList.remove("fallback-active");
        return;
      }
      imgEl.src = src;
      /* Affichage immédiat si déjà en cache */
      if (imgEl.complete && imgEl.naturalWidth > 0 && token === eggImgLoadToken) {
        imgEl.hidden = false;
        if (fallbackContainer) fallbackContainer.classList.remove("fallback-active");
      }
    }

    /**
     * Source de vérité visuelle de l'œuf central.
     * Toujours appeler après changement de zone, éclosion, load, équipement.
     */
    function renderCurrentEgg() {
      resetEggVisualState();

      const eggDef = getEquippedEggDef();
      const label = document.getElementById("egg-stage-label");
      const wrap = document.getElementById("entity-wrap");
      const dragonEl = document.getElementById("dragon-entity");

      if (wrap) wrap.classList.remove("hatched");
      if (dragonEl) dragonEl.style.display = "";

      if (label) {
        label.textContent = ((eggDef && eggDef.name) || "Œuf").toUpperCase();
        label.classList.remove("hatched");
      }

      currentEggImageStage = null;
      currentEggImageEggId = null;
      updateEggVisualState({ forceImage: true });
      renderEggProgressUI();
      updateEggCarouselPeer();
    }

    function renderActiveEggVisual() {
      renderCurrentEgg();
    }

    function updateEggVisualState(opts) {
      const eggDef = getEquippedEggDef();
      const prog = getEggProgress(eggDef.id);
      const pct = getHatchPercent(eggDef, prog.progress);
      const effectStage = getEggEffectStage(pct);
      const wrap = document.getElementById("entity-wrap");
      if (!wrap) return;

      syncEggProgressImage(eggDef, pct, !!(opts && opts.forceImage));

      /*
        Ne retoggle soft-pulse / stage QUE si le palier change.
        Avant : remove+add à CHAQUE clic → restart CSS transform sur
        .egg-hatch-wrapper → masquait ~1 feedback WAAPI sur 2 (Safari mobile).
      */
      const prevStage = wrap.getAttribute("data-egg-effect-stage") || "";
      const stageChanged = prevStage !== effectStage || !!(opts && opts.forceImage);
      if (stageChanged || hatchSequenceActive) {
        wrap.classList.remove(
          "egg-stage-normal",
          "egg-stage-awakening",
          "egg-stage-hatching",
          "egg-stage-critical",
          "prog-0", "prog-1", "prog-2", "prog-3", "prog-4",
          "breathe",
          "clicked"
        );
        const hatchWrap = document.getElementById("egg-hatch-wrapper");
        if (hatchWrap) {
          hatchWrap.classList.remove("egg-soft-pulse", "egg-soft-pulse-mid", "egg-soft-pulse-fast");
        }
        if (!hatchSequenceActive) {
          wrap.classList.add(effectStage);
          wrap.setAttribute("data-egg-effect-stage", effectStage);
          if (hatchWrap && !prefersReducedMotion()) {
            if (effectStage === "egg-stage-awakening") hatchWrap.classList.add("egg-soft-pulse");
            else if (effectStage === "egg-stage-hatching") hatchWrap.classList.add("egg-soft-pulse-mid");
            else if (effectStage === "egg-stage-critical") hatchWrap.classList.add("egg-soft-pulse-fast");
          }
        } else {
          wrap.setAttribute("data-egg-effect-stage", "");
        }
      }

      if ((effectStage === "egg-stage-hatching" || effectStage === "egg-stage-critical") &&
          !hatchSequenceActive && Math.random() < 0.08) {
        spawnAmbientSpark();
      }
    }

    function spawnAmbientSpark() {
      const zone = document.getElementById("click-zone");
      if (!zone) return;
      const p = document.createElement("div");
      p.className = "particle";
      const rect = zone.getBoundingClientRect();
      p.style.left = (rect.width * (0.3 + Math.random() * 0.4)) + "px";
      p.style.top = (rect.height * (0.3 + Math.random() * 0.4)) + "px";
      p.style.setProperty("--px", ((Math.random() - 0.5) * 40) + "px");
      p.style.setProperty("--py", (-20 - Math.random() * 40) + "px");
      zone.appendChild(p);
      setTimeout(() => p.remove(), 650);
    }

    function renderEggProgressUI(force) {
      if (renderEggBossFightUI(force)) return;

      const special = getSpecialEggHatch();
      const eggDef = getEquippedEggDef();
      const block = document.getElementById("egg-progress-block");
      const fill = document.getElementById("hatch-bar-fill");
      if (fill) fill.classList.remove("is-boss-hp");

      let cur;
      let req;
      let pct;
      if (special) {
        if (block) {
          block.classList.add("is-guardian-hatch");
          block.classList.remove("is-boss-fight");
        }
        req = Math.max(1, safeNumber(special.required, 1));
        cur = Math.min(safeNumber(special.progress, 0), req);
        pct = (cur / req) * 100;
        const bdef = getEggBossDef(special.bossId);
        const labelProg = document.getElementById("hatch-progress-label");
        if (labelProg) labelProg.textContent = "ŒUF DE GARDIEN";
        const nums = document.getElementById("hatch-bar-nums");
        if (nums) nums.textContent = formatNumber(Math.floor(cur)) + " / " + formatNumber(req);
        const pctEl = document.getElementById("hatch-bar-pct");
        if (pctEl) pctEl.textContent = pct.toFixed(pct >= 10 ? 0 : 1) + " %";
        if (fill) fill.style.width = pct + "%";
        const bar = document.getElementById("hatch-bar");
        if (bar) bar.setAttribute("aria-valuenow", String(Math.floor(pct)));
        const etaEl = document.getElementById("ki-eta");
        if (etaEl) {
          etaEl.textContent = bdef
            ? (bdef.name + " — " + bdef.subtitle)
            : "Éclosion de l'Œuf de Gardien";
        }
        const stageLabel = document.getElementById("egg-stage-label");
        if (stageLabel && bdef) stageLabel.textContent = (bdef.guardianEggName || "ŒUF DE GARDIEN").toUpperCase();
        lastEggProgressKey = "guardian|" + special.bossId + "|" + Math.floor(cur) + "|" + req;
        return;
      }

      if (block) block.classList.remove("is-boss-fight", "is-guardian-hatch");

      const prog = getEggProgress(eggDef.id);
      req = getEggHatchRequirement(eggDef);
      cur = Math.min(safeNumber(prog.progress, 0), req);
      pct = getHatchPercent(eggDef, cur);
      const poolSize = getEggHatchPool(eggDef.id).length;
      const discovered = countEggPoolDiscovered(eggDef);
      const cps = gameState.currentCps || 0;
      const key = eggDef.id + "|" + Math.floor(cur) + "|" + req + "|" + discovered + "|" + poolSize + "|" + cps;
      if (!force && key === lastEggProgressKey && !hatchHistoryDirty) return;
      lastEggProgressKey = key;

      const nums = document.getElementById("hatch-bar-nums");
      if (nums) {
        nums.textContent = formatNumber(Math.floor(cur)) + " / " + formatNumber(req);
      }
      const pctEl = document.getElementById("hatch-bar-pct");
      if (pctEl) pctEl.textContent = pct.toFixed(pct >= 10 ? 0 : 1) + " %";
      if (fill) fill.style.width = pct + "%";
      const bar = document.getElementById("hatch-bar");
      if (bar) bar.setAttribute("aria-valuenow", String(Math.floor(pct)));

      const labelProg = document.getElementById("hatch-progress-label");
      if (labelProg) labelProg.textContent = "Progression d'éclosion";

      const descEl = document.getElementById("ki-desc");
      if (descEl) {
        const raw = eggDef.description || "";
        const firstSentence = raw.split(/(?<=[.!?…])\s+/)[0] || raw;
        const short = firstSentence.length > 100
          ? firstSentence.slice(0, 97) + "…"
          : firstSentence;
        if (descEl.textContent !== short) descEl.textContent = short;
        descEl.hidden = !short;
      }
      const poolEl = document.getElementById("ki-pool-count");
      if (poolEl) poolEl.textContent = discovered + " / " + poolSize;

      const remaining = Math.max(0, req - cur);
      const etaEl = document.getElementById("ki-eta");
      if (etaEl) {
        const ppc = Math.max(0.01, gameState.powerPerClick);
        if (cps <= 0) {
          etaEl.textContent = "Cliquez pour avancer l'éclosion.";
        } else {
          const powerPerSec = ppc * cps;
          const secs = remaining / powerPerSec;
          etaEl.textContent = "~" + formatDuration(secs * 1000) + " avant l'éclosion";
        }
      }

      if (hatchHistoryDirty || force) renderRecentHatches();
    }

    function renderRecentHatches() {
      const list = document.getElementById("recent-hatches-list");
      if (!list) return;
      hatchHistoryDirty = false;
      const hist = gameState.hatchHistory || [];
      if (!hist.length) {
        list.innerHTML = '<li class="empty">Aucune éclosion pour le moment.</li>';
        return;
      }
      list.innerHTML = "";
      hist.slice(0, HATCH_HISTORY_MAX).forEach((h) => {
        const li = document.createElement("li");
        const rar = RARITIES[h.rarity] || RARITIES.common;
        li.innerHTML = "<span></span><span class=\"rarity-label\"></span>";
        li.querySelector("span").textContent = h.name;
        const rEl = li.querySelector(".rarity-label");
        rEl.textContent = rar.label;
        rEl.className = "rarity-label " + rar.css;
        list.appendChild(li);
      });
    }

    function renderEggPicker() {
      const row = document.getElementById("egg-picker-row");
      row.innerHTML = "";

      const zoneNote = document.getElementById("eggs-zone-note");
      if (zoneNote) {
        zoneNote.textContent = "Zone actuelle : " + getCurrentZone().name;
      }

      getVisibleEggs().forEach((egg) => {
        if (egg.secret) return;
        const prog = getEggProgress(egg.id);
        const unlocked = prog.unlocked && !egg.comingSoon;

        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "egg-pick-btn" + (gameState.equippedEggId === egg.id ? " active" : "");
        if (RARITIES[egg.rarity]) btn.classList.add(RARITIES[egg.rarity].css);
        btn.disabled = !unlocked && !egg.comingSoon ? true : !unlocked;

        const poolLen = getEggHatchPool(egg.id).length;
        const pct = unlocked ? Math.floor(getHatchPercent(egg, prog.progress)) : 0;

        btn.innerHTML =
          '<div class="ep-thumb"><img alt="" draggable="false" /><span class="ep-fallback-ico">🥚</span></div>' +
          '<div class="ep-name"></div>' +
          '<div class="ep-pct"></div>';

        const thumbImg = btn.querySelector("img");
        const ico = btn.querySelector(".ep-fallback-ico");
        if (unlocked) {
          thumbImg.onload = () => { ico.style.display = "none"; };
          thumbImg.onerror = () => { thumbImg.style.display = "none"; ico.style.display = ""; };
          thumbImg.src = egg.image;
        } else {
          thumbImg.style.display = "none";
          ico.textContent = egg.comingSoon ? "⏳" : "🔒";
        }

        btn.querySelector(".ep-name").textContent = unlocked || egg.comingSoon
          ? egg.name.replace(/^Œuf /, "")
          : "???";
        btn.querySelector(".ep-pct").textContent = unlocked
          ? pct + "% · " + poolLen + " dragons"
          : (egg.comingSoon ? "? dragons" : "Verrouillé");

        if (unlocked) {
          btn.addEventListener("click", () => equipEgg(egg.id));
        }

        row.appendChild(btn);
      });
      eggsDirty = false;
    }

    function equipEgg(eggId) {
      const prog = getEggProgress(eggId);
      const def = getEggDef(eggId);
      if (!prog.unlocked || (def && def.comingSoon)) return;
      if (hatchSequenceActive || guardianHatchSequenceActive || isEggCarouselAnimating) return;
      if (isEggBossFightActive() || getSpecialEggHatch()) {
        showNotification("Gardien", "Impossible de changer d'œuf pendant un Gardien.");
        return;
      }
      gameState.equippedEggId = eggId;
      const zoneId = def.zoneId || gameState.currentZoneId;
      if (zoneSupportsEggCarousel(zoneId) && (getZoneDef(zoneId).eggIds || []).indexOf(eggId) !== -1) {
        setZoneSelectedEggId(zoneId, eggId);
      }
      applyEggScene(def);
      renderCurrentEgg();
      renderEggPicker();
      updateEggCarouselPeer();
      showNotification("🥚 Œuf équipé", def.name);
      switchPanel("kingdom");
    }

    function spawnHatchParticles(count, mythic) {
      const box = document.getElementById("hatch-particles");
      if (!box) return;
      box.innerHTML = "";
      for (let i = 0; i < count; i++) {
        const p = document.createElement("div");
        p.className = "hatch-particle";
        p.style.left = 50 + (Math.random() - 0.5) * 20 + "%";
        p.style.top = 50 + (Math.random() - 0.5) * 20 + "%";
        p.style.setProperty("--hx", ((Math.random() - 0.5) * 280) + "px");
        p.style.setProperty("--hy", ((Math.random() - 0.5) * 280) + "px");
        if (mythic) {
          p.style.background = "#ff4ad2";
          p.style.boxShadow = "0 0 14px #ff4ad2";
          p.style.width = "8px";
          p.style.height = "8px";
        }
        box.appendChild(p);
      }
      setTimeout(() => { box.innerHTML = ""; }, 1300);
    }

    function setSuspenseText(text, mythicBanner) {
      const el = document.getElementById("hatch-suspense");
      if (!el) return;
      if (mythicBanner) {
        el.innerHTML = '<div class="hatch-mythic-banner">✦ ✦ ✦<br>MYTHIQUE<br>✦ ✦ ✦</div>';
      } else {
        el.textContent = text;
      }
      el.classList.add("visible");
    }

    function clearSuspenseText() {
      const el = document.getElementById("hatch-suspense");
      if (!el) return;
      el.classList.remove("visible");
      el.textContent = "";
      el.innerHTML = "";
    }

    /**
     * Grant one rolled dragon (new or duplicate). Does NOT reset egg progress.
     */
    function grantHatchDragonReward(eggDef, dragonId) {
      const dragonDef = getDragonDef(dragonId);
      if (!dragonDef) return null;

      const entry = ensureDragonEntry(dragonDef.id, gameState);
      const isNew = !isDragonDiscovered(entry, dragonDef.id, gameState);
      let fragmentsGained = 0;

      if (isNew) {
        markDragonDiscovered(dragonDef.id, gameState, {
          obtainedAt: Date.now(),
          timesObtained: 1
        });
      } else {
        markDragonDiscovered(dragonDef.id, gameState);
        entry.timesObtained = safeNumber(entry.timesObtained, 1) + 1;
        if (!entry.stars || entry.stars < 1) entry.stars = 1;
        const baseFrag = FRAGMENTS_PER_DUPLICATE || FRAGMENTS_BY_RARITY[dragonDef.rarity] || 1;
        const gained = grantDragonFragments(dragonDef.id, baseFrag);
        fragmentsGained = gained.total;
        const extraChance = safeNumber(gameState.multipliers?.duplicateFragmentChance, 0);
        if (extraChance > 0 && Math.random() < extraChance) {
          entry.fragments = safeNumber(entry.fragments, 0) + 1;
          fragmentsGained += 1;
        }
      }

      gameState.totalDragonsObtained = safeNumber(gameState.totalDragonsObtained, 0) + 1;

      if (!gameState.rarityStats) gameState.rarityStats = createEmptyRarityStats();
      const rar = dragonDef.rarity || "common";
      gameState.rarityStats[rar] = safeNumber(gameState.rarityStats[rar], 0) + 1;

      gameState.hatchHistory = gameState.hatchHistory || [];
      gameState.hatchHistory.unshift({
        dragonId: dragonDef.id,
        name: dragonDef.name,
        rarity: dragonDef.rarity,
        eggId: eggDef.id,
        at: Date.now(),
        isNew: isNew
      });
      if (gameState.hatchHistory.length > HATCH_HISTORY_MAX) {
        gameState.hatchHistory.length = HATCH_HISTORY_MAX;
      }
      hatchHistoryDirty = true;

      return {
        eggDef: eggDef,
        dragonDef: dragonDef,
        isNew: isNew,
        fragmentsGained: fragmentsGained
      };
    }

    /**
     * Resolve hatch: first dragon + optional independent twin (no chain).
     * Returns reveal payload for the animation/modal.
     */
    function resolveHatchReward(eggDef) {
      const prog = getEggProgress(eggDef.id);
      const dragonId = rollDragonFromEgg(eggDef.id);
      if (!dragonId) {
        console.warn("[DragonClicker] Éclosion annulée — aucun dragon tiré pour", eggDef && eggDef.id);
        return null;
      }
      const primary = grantHatchDragonReward(eggDef, dragonId);
      if (!primary) return null;

      prog.timesHatched = safeNumber(prog.timesHatched, 0) + 1;
      prog.progress = 0;
      prog.crackSoundPlayed = false;
      gameState.totalEggsHatched = safeNumber(gameState.totalEggsHatched, 0) + 1;
      upgradesDirty = true;
      zonesDirty = true;
      gameState.eggHatched = true;

      const rar = primary.dragonDef.rarity || "common";
      if (prog.pityCounters) {
        if (rar === "legendary" || rar === "mythic" || rar === "divine") {
          prog.pityCounters.sinceLegendary = 0;
          if (rar === "mythic" || rar === "divine") prog.pityCounters.sinceMythic = 0;
          else prog.pityCounters.sinceMythic = safeNumber(prog.pityCounters.sinceMythic, 0) + 1;
        } else {
          prog.pityCounters.sinceLegendary = safeNumber(prog.pityCounters.sinceLegendary, 0) + 1;
          prog.pityCounters.sinceMythic = safeNumber(prog.pityCounters.sinceMythic, 0) + 1;
        }
      }

      let twinReveal = null;
      const twinChance = getTwinHatchChance();
      if (twinChance > 0 && Math.random() < twinChance) {
        const twinId = rollDragonFromEgg(eggDef.id);
        twinReveal = grantHatchDragonReward(eggDef, twinId);
      }

      calculateProduction();
      dragonsDirty = true;
      eggsDirty = true;
      checkAchievements();
      saveGame(true);
      refreshDragonCollectionUI();

      primary.twinReveal = twinReveal;
      /* Twin : un seul popup audio = rareté la plus haute des deux reveals. */
      if (twinReveal && twinReveal.dragonDef) {
        primary.popupSoundRarity = pickHighestRevealRarity(
          primary.dragonDef && primary.dragonDef.rarity,
          twinReveal.dragonDef.rarity
        );
        twinReveal.skipPopupSound = true;
      }
      return primary;
    }

    function showTwinHatchBanner(done) {
      const banner = document.getElementById("twin-hatch-banner");
      if (!banner) {
        if (done) done();
        return;
      }
      banner.classList.remove("hidden");
      banner.classList.add("visible");
      banner.setAttribute("aria-hidden", "false");
      playSound("legendary");
      setTimeout(() => {
        banner.classList.remove("visible");
        setTimeout(() => {
          banner.classList.add("hidden");
          banner.setAttribute("aria-hidden", "true");
          if (done) done();
        }, 280);
      }, 1100);
    }

    function preloadDragonSummonSprite() {
      if (dragonSummonSpriteReady) return dragonSummonSpriteReady;
      dragonSummonSpriteReady = new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = DRAGON_SUMMON_SRC;
      });
      return dragonSummonSpriteReady;
    }

    function clearDragonSummonEffectDom() {
      if (dragonSummonActiveEl && dragonSummonActiveEl.parentNode) {
        try { dragonSummonActiveEl.parentNode.removeChild(dragonSummonActiveEl); } catch (e) { /* ignore */ }
      }
      dragonSummonActiveEl = null;
      document.querySelectorAll(".dragon-summon-effect").forEach((el) => {
        try { el.remove(); } catch (e) { /* ignore */ }
      });
    }

    /**
     * Sprite-sheet summon FX — dragon stays invisible until this resolves.
     * Duration driven by HATCH_SEQUENCE_TIMINGS.summonEffect (or twin override).
     */
    function playDragonSummonEffect(opts) {
      opts = opts || {};
      const T = HATCH_SEQUENCE_TIMINGS;
      const duration = Math.max(200, opts.duration != null ? opts.duration : T.summonEffect);
      const reduce = prefersReducedMotion();
      clearDragonSummonEffectDom();
      if (reduce) return Promise.resolve();

      return preloadDragonSummonSprite().then((img) => {
        if (!img || !img.naturalWidth) return;
        /* Above hatch-overlay (z 1500) so the FX is actually visible */
        const zone = document.getElementById("click-zone");
        const host = document.body;
        const el = document.createElement("div");
        el.className = "dragon-summon-effect";
        el.setAttribute("aria-hidden", "true");
        const frameW = img.naturalWidth / DRAGON_SUMMON_COLS;
        const frameH = img.naturalHeight / DRAGON_SUMMON_ROWS;
        el.style.width = Math.round(frameW) + "px";
        el.style.height = Math.round(frameH) + "px";
        el.style.backgroundImage = "url(\"" + DRAGON_SUMMON_SRC + "\")";
        el.style.backgroundRepeat = "no-repeat";
        el.style.backgroundSize = (DRAGON_SUMMON_COLS * 100) + "% " + (DRAGON_SUMMON_ROWS * 100) + "%";
        if (zone) {
          const r = zone.getBoundingClientRect();
          el.style.left = (r.left + r.width / 2) + "px";
          el.style.top = (r.top + r.height * 0.48) + "px";
        }
        host.appendChild(el);
        dragonSummonActiveEl = el;

        const frameMs = Math.max(40, Math.floor(duration / DRAGON_SUMMON_TOTAL_FRAMES));
        let frame = 0;
        return new Promise((resolve) => {
          const tick = () => {
            if (!el.parentNode) { resolve(); return; }
            const col = frame % DRAGON_SUMMON_COLS;
            const row = Math.floor(frame / DRAGON_SUMMON_COLS);
            el.style.backgroundPosition =
              (-Math.round(col * frameW)) + "px " + (-Math.round(row * frameH)) + "px";
            frame++;
            if (frame >= DRAGON_SUMMON_TOTAL_FRAMES) {
              el.classList.add("is-fading");
              setTimeout(() => {
                clearDragonSummonEffectDom();
                resolve();
              }, 120);
              return;
            }
            setTimeout(tick, frameMs);
          };
          /* Soft scale-in */
          try {
            el.animate(
              [
                { opacity: 0, transform: "translate(-50%, -50%) scale(0.72)" },
                { opacity: 1, transform: "translate(-50%, -50%) scale(1.05)", offset: 0.2 },
                { opacity: 1, transform: "translate(-50%, -50%) scale(1)" }
              ],
              { duration: Math.min(280, duration * 0.35), easing: "ease-out", fill: "forwards" }
            );
          } catch (e) { /* optional */ }
          tick();
        });
      }).catch(() => {});
    }

    function startHatchSequence(eggDef) {
      if (hatchSequenceActive) return;
      if (!eggDef || !getEggHatchPool(eggDef.id).length) {
        /* Protection : œufs Zone 4 sans dragons — pas d'erreur, pas de soft-lock. */
        if (eggDef && eggDef.dragonsComingSoon) {
          showNotification("🐉 Bientôt", "Les dragons de cet œuf arriveront bientôt.");
        } else {
          console.warn("[DragonClicker] Éclosion impossible — pool vide pour", eggDef && eggDef.id);
        }
        return;
      }

      hatchSequenceActive = true;
      clicksLocked = true;
      document.getElementById("click-zone").classList.add("clicks-disabled");
      const stageEl = document.getElementById("egg-stage");
      if (stageEl) stageEl.classList.add("is-hatching");
      updateEggCarouselPeer();

      /* Resolve + save FIRST so refresh / spam cannot duplicate */
      const reveal = resolveHatchReward(eggDef);
      if (!reveal) {
        hatchSequenceActive = false;
        clicksLocked = false;
        document.getElementById("click-zone").classList.remove("clicks-disabled");
        if (stageEl) stageEl.classList.remove("is-hatching");
        updateEggCarouselPeer();
        return;
      }
      pendingReveal = reveal;
      preloadDragonSummonSprite();
      /* Préparer portraits reveal HD (primary + twin) pendant l'anim d'éclosion. */
      if (window.DCAssets && typeof DCAssets.preloadCritical === "function") {
        const hatchPaths = [];
        if (reveal.dragonDef && reveal.dragonDef.image) {
          hatchPaths.push(getDragonAsset(reveal.dragonDef, "reveal"));
        }
        if (reveal.twinReveal && reveal.twinReveal.dragonDef && reveal.twinReveal.dragonDef.image) {
          hatchPaths.push(getDragonAsset(reveal.twinReveal.dragonDef, "reveal"));
        }
        DCAssets.preloadCritical(hatchPaths);
      }

      const wrap = document.getElementById("entity-wrap");
      const overlay = document.getElementById("hatch-overlay");
      const flash = document.getElementById("hatch-flash");
      const hatchWrap = getEggHatchWrapper();
      const clickWrap = getEggClickWrapper();
      const rarity = reveal.dragonDef.rarity;
      const isLegendary = rarity === "legendary" || rarity === "divine";
      const isMythic = rarity === "mythic" || rarity === "divine";
      const isRare = rarity === "rare" || rarity === "epic";
      const reduce = prefersReducedMotion();
      const T = HATCH_SEQUENCE_TIMINGS;
      let sequenceCrackPlayed = false;

      safeCancelAnimation(eggClickAnimation);
      safeCancelAnimation(eggAmbientAnimation);
      safeCancelAnimation(eggHatchAnimation);
      eggClickAnimation = null;
      eggAmbientAnimation = null;
      eggHatchAnimation = null;
      clearHatchFxTimers();
      clearDragonSummonEffectDom();
      const token = ++hatchFxToken;

      wrap.classList.remove(
        "breathe",
        "egg-stage-normal",
        "egg-stage-awakening",
        "egg-stage-hatching",
        "egg-stage-critical",
        "prog-0", "prog-1", "prog-2", "prog-3", "prog-4",
        "hatched",
        "clicked"
      );
      if (hatchWrap) {
        hatchWrap.classList.remove("egg-soft-pulse", "egg-soft-pulse-mid", "egg-soft-pulse-fast");
      }
      wrap.classList.add("hatching");
      overlay.classList.add("active");
      overlay.setAttribute("aria-hidden", "false");
      clearSuspenseText();

      (async function runHatchSequence() {
        setSuspenseText("L'œuf est en train d'éclore...");

        /* --- 1) CRACK puis tremblement (strictement séquentiel) --- */
        if (!(await hatchDelay(T.crackSound, token))) return;
        if (!sequenceCrackPlayed) {
          sequenceCrackPlayed = true;
          playSound("eggCrack", { force: true });
        }

        if (!reduce && hatchWrap && typeof hatchWrap.animate === "function") {
          eggHatchAnimation = hatchWrap.animate(
            [
              { transform: "translate(0,0) rotate(0deg) scale(1)", filter: "brightness(1)" },
              { transform: "translate(-3px,1px) rotate(-1.4deg) scale(1.025)", filter: "brightness(1.15)", offset: 0.25 },
              { transform: "translate(4px,-1px) rotate(2deg) scale(1.045)", filter: "brightness(1.35)", offset: 0.5 },
              { transform: "translate(-5px,1px) rotate(-2.4deg) scale(1.06)", filter: "brightness(1.55)", offset: 0.78 },
              { transform: "translate(0,0) rotate(0deg) scale(1.04)", filter: "brightness(1.5)" }
            ],
            { duration: T.finalShake, easing: "ease-in", fill: "none" }
          );
          spawnHatchParticles(isMythic ? 6 : isLegendary ? 4 : 3, isMythic);
          await waitAnimation(eggHatchAnimation);
          safeCancelAnimation(eggHatchAnimation);
          eggHatchAnimation = null;
          if (hatchWrap) {
            hatchWrap.style.transform = "";
            hatchWrap.style.filter = "";
          }
          if (token !== hatchFxToken) return;
        } else {
          if (!(await hatchDelay(Math.round(T.finalShake * 0.7), token))) return;
        }

        /* --- 2) Fissuration / glow / ouverture + HATCH SOUND --- */
        setSuspenseText("Quelque chose se réveille...");
        if (flash) {
          flash.classList.remove("burst");
          void flash.offsetWidth;
          flash.classList.add("burst");
        }

        if (!reduce && hatchWrap && typeof hatchWrap.animate === "function") {
          safeCancelAnimation(eggHatchAnimation);
          eggHatchAnimation = hatchWrap.animate(
            [
              { transform: "translate(0,0) rotate(0deg) scale(1.04)", filter: "brightness(1.5)" },
              { transform: "translate(-6px,2px) rotate(-3deg) scale(1.07)", filter: "brightness(1.85)", offset: 0.35 },
              { transform: "translate(6px,-2px) rotate(3deg) scale(1.1)", filter: "brightness(2.2)", offset: 0.7 },
              { transform: "translate(0,0) rotate(0deg) scale(1.05)", filter: "brightness(1.8)" }
            ],
            { duration: T.breakPhase, easing: "ease-in-out", fill: "none" }
          );
          spawnHatchParticles(isMythic ? 10 : isLegendary ? 7 : isRare ? 5 : 3, isMythic);
          if (window.DCAnim && DCAnim.burst) {
            const zone = document.getElementById("click-zone");
            if (zone) {
              const r = zone.getBoundingClientRect();
              DCAnim.burst(r.left + r.width / 2, r.top + r.height / 2, {
                count: DCAnim.particleCount(isMythic ? "mythic" : "hatch"),
                palette: isMythic ? ["#ff4ad2", "#ffe29a", "#7ad7ff"] : ["#ffe29a", "#ffb347"],
                speed: 3.0,
                life: 700
              });
            }
          }
          /* Hatch SFX mid-break, then wait for the rest of the WAAPI */
          if (!(await hatchDelay(T.hatchSoundAt, token))) return;
          playSound("hatch");
          await waitAnimation(eggHatchAnimation);
          safeCancelAnimation(eggHatchAnimation);
          eggHatchAnimation = null;
          if (hatchWrap) {
            hatchWrap.style.transform = "";
            hatchWrap.style.filter = "";
          }
          if (token !== hatchFxToken) return;
        } else {
          if (!(await hatchDelay(T.hatchSoundAt, token))) return;
          playSound("hatch");
          if (!(await hatchDelay(Math.max(80, T.breakPhase - T.hatchSoundAt), token))) return;
        }

        /* --- 3) Disparition progressive de l'œuf --- */
        wrap.classList.remove("hatching");
        wrap.classList.add("hatch-vanish");
        if (!reduce && clickWrap && typeof clickWrap.animate === "function") {
          safeCancelAnimation(eggClickAnimation);
          eggClickAnimation = clickWrap.animate(
            [
              { transform: "scale(1)", filter: "brightness(1.5)", opacity: 1 },
              { transform: "scale(0.94)", filter: "brightness(1.9)", opacity: 0.85, offset: 0.3 },
              { transform: "scale(1.06)", filter: "brightness(2.25)", opacity: 0.4, offset: 0.65 },
              { transform: "scale(0.7)", filter: "brightness(2.5)", opacity: 0 }
            ],
            { duration: T.eggVanish, easing: "cubic-bezier(.4,0,.2,1)", fill: "forwards" }
          );
          spawnHatchParticles(isMythic ? 12 : isLegendary ? 8 : 5, isMythic);
          if (window.DCAnim && DCAnim.spawnShockwave) {
            const zone = document.getElementById("click-zone");
            if (zone) {
              const r = zone.getBoundingClientRect();
              DCAnim.spawnShockwave(zone, r.width / 2, r.height / 2, isMythic ? "shockwave-combo" : "shockwave-crit");
            }
          }
          await waitAnimation(eggClickAnimation);
          safeCancelAnimation(eggClickAnimation);
          eggClickAnimation = null;
          if (token !== hatchFxToken) return;
        } else {
          if (!(await hatchDelay(T.eggVanish, token))) return;
        }

        wrap.classList.remove("hatch-vanish");
        wrap.style.opacity = "0";
        if (clickWrap) {
          clickWrap.style.transform = "";
          clickWrap.style.filter = "";
          clickWrap.style.opacity = "0";
        }
        if (isMythic) setSuspenseText("", true);
        else clearSuspenseText();

        /* --- 4) Pause réelle avant magie --- */
        if (!(await hatchDelay(reduce ? 100 : T.pauseAfterBreak, token))) {
          if (token !== hatchFxToken) return;
          resetEggVisualState();
          return;
        }

        /* --- 5) Effet magique (dragon encore invisible) --- */
        if (token !== hatchFxToken) return;
        await playDragonSummonEffect({ duration: T.summonEffect });
        if (token !== hatchFxToken) return;

        clearSuspenseText();
        if (flash) flash.classList.remove("burst");
        overlay.classList.remove("active");
        overlay.setAttribute("aria-hidden", "true");
        wrap.style.opacity = "0";
        wrap.classList.remove("hatch-vanish", "hatching", "hatched");
        safeCancelAnimation(eggClickAnimation);
        safeCancelAnimation(eggHatchAnimation);
        eggClickAnimation = null;
        eggHatchAnimation = null;
        if (hatchWrap) {
          hatchWrap.style.transform = "";
          hatchWrap.style.filter = "";
        }
        clearDragonSummonEffectDom();

        /* --- 6) Unique reveal path — await full dragon materialize --- */
        await openRevealModal(pendingReveal);
        renderEggProgressUI();
        renderEggPicker();
      })();
    }

    /**
     * Chemin miniature WebP (512) dérivé du PNG HD.
     * assets/dragons/foo.png → assets/dragons/thumbs/foo.webp
     */
    function getDragonThumbPath(def) {
      if (!def || !def.image) return "";
      const src = String(def.image);
      if (src.indexOf("assets/dragons/") !== 0) return src;
      const file = src.slice("assets/dragons/".length);
      if (!file || file.indexOf("thumbs/") === 0) return src;
      const base = file.replace(/\.(png|jpe?g|webp)$/i, "");
      if (!base || base === file) return src;
      return "assets/dragons/thumbs/" + base + ".webp";
    }

    /**
     * Asset portrait selon usage.
     * usage "thumb" (défaut menus) | "hd" | "reveal" | "detail"
     */
    function getDragonAsset(def, usage) {
      if (!def) return "";
      const u = usage || "thumb";
      if (u === "hd" || u === "reveal" || u === "detail") return def.image || "";
      const thumb = getDragonThumbPath(def);
      return thumb || def.image || "";
    }

    function loadAssetImage(imgEl, emojiEl, src, options) {
      const opts = options || {};
      if (!imgEl) return;
      const isSilhouette = !!opts.silhouette;
      imgEl.classList.toggle("silhouette", isSilhouette);
      /*
        Découvert (pas silhouette) : JAMAIS d'emoji visible en état normal
        (évite le flash 🐉→PNG). Emoji uniquement si erreur réelle.
        Non découvert : "?" reste affiché.
      */
      if (emojiEl) emojiEl.style.display = isSilhouette ? "" : "none";
      imgEl.hidden = true;
      if (imgEl.dataset) delete imgEl.dataset.fallbackTried;

      const showReady = () => {
        if (!imgEl) return;
        if (imgEl.getAttribute("src") !== src) return;
        if (!(imgEl.complete && imgEl.naturalWidth > 0)) return;
        imgEl.hidden = false;
        if (emojiEl) emojiEl.style.display = "none";
      };
      const showErrorFallback = () => {
        /* Thumbnail manquante / échec → retomber sur PNG HD si fourni. */
        if (
          opts.fallbackSrc &&
          src !== opts.fallbackSrc &&
          (!imgEl.dataset || imgEl.dataset.fallbackTried !== "1")
        ) {
          if (imgEl.dataset) imgEl.dataset.fallbackTried = "1";
          loadAssetImage(imgEl, emojiEl, opts.fallbackSrc, {
            silhouette: isSilhouette,
            fallbackSrc: null
          });
          return;
        }
        imgEl.hidden = true;
        if (emojiEl) emojiEl.style.display = "";
        console.warn("[Asset] image introuvable :", src);
      };
      imgEl.onload = showReady;
      imgEl.onerror = showErrorFallback;

      if (!src) {
        imgEl.removeAttribute("src");
        imgEl.hidden = true;
        if (emojiEl) emojiEl.style.display = isSilhouette ? "" : "none";
        return;
      }

      const applySrc = () => {
        if (imgEl.getAttribute("src") !== src) {
          imgEl.src = src;
        } else if (!(imgEl.complete && imgEl.naturalWidth > 0)) {
          imgEl.src = src;
        }
        showReady();
      };

      /* Portrait déjà décodé en session → affichage immédiat, zéro frame emoji. */
      if (window.DCAssets && typeof DCAssets.isLoaded === "function" && DCAssets.isLoaded(src)) {
        applySrc();
        return;
      }

      if (window.DCAssets && typeof DCAssets.loadImage === "function") {
        DCAssets.loadImage(src)
          .then(applySrc)
          .catch(function () {
            /* Essayer fallback HD si thumb a échoué au preload */
            if (opts.fallbackSrc && src !== opts.fallbackSrc) {
              showErrorFallback();
              return;
            }
            applySrc();
          });
        return;
      }
      applySrc();
    }

    const EAGER_PORTRAIT_COUNT = DRAGONS_VIEWPORT_WARM;
    let portraitNearObserver = null;

    function ensurePortraitNearObserver() {
      if (portraitNearObserver) return portraitNearObserver;
      if (typeof IntersectionObserver !== "function") return null;
      portraitNearObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            /*
              Observer le conteneur (.dt-art) : l’<img hidden> a une boîte 0×0
              et ne déclenche jamais l’IO — cause des portraits jamais chargés.
            */
            const host = entry.target;
            const img = host && host.tagName === "IMG"
              ? host
              : (host ? host.querySelector("img") : null);
            if (!img || !img.dataset) return;
            const src = img.dataset.assetSrc || "";
            if (!src) return;
            delete img.dataset.assetSrc;
            try {
              portraitNearObserver.unobserve(host);
            } catch (e) { /* ignore */ }
            const emoji = host.querySelector
              ? host.querySelector(".dc-emoji")
              : (img.parentElement && img.parentElement.querySelector(".dc-emoji"));
            const sil = img.classList.contains("silhouette");
            const fb = img.dataset.fallbackSrc || null;
            delete img.dataset.fallbackSrc;
            loadAssetImage(img, emoji, src, { silhouette: sil, fallbackSrc: fb });
          });
        },
        { root: null, rootMargin: "480px 0px", threshold: 0.01 }
      );
      return portraitNearObserver;
    }

    /** Charge immédiatement les N premiers portraits ; le reste via IO + idle warm. */
    function bindDragonPortrait(imgEl, emojiEl, src, options, index) {
      const opts = options || {};
      if (!imgEl) return;
      const isSilhouette = !!opts.silhouette;
      imgEl.classList.toggle("silhouette", isSilhouette);
      if (emojiEl) emojiEl.style.display = isSilhouette ? "" : "none";
      imgEl.hidden = true;
      if (!src) {
        imgEl.removeAttribute("src");
        return;
      }
      const alreadyReady = window.DCAssets && typeof DCAssets.isLoaded === "function" && DCAssets.isLoaded(src);
      const eager = index < EAGER_PORTRAIT_COUNT || alreadyReady;
      if (eager) {
        delete imgEl.dataset.assetSrc;
        loadAssetImage(imgEl, emojiEl, src, opts);
        return;
      }
      imgEl.dataset.assetSrc = src;
      if (opts.fallbackSrc) imgEl.dataset.fallbackSrc = opts.fallbackSrc;
      imgEl.loading = "lazy";
      imgEl.decoding = "async";
      const obs = ensurePortraitNearObserver();
      if (obs) {
        /* Conteneur dimensionné (pas l’img hidden) pour un IO fiable au scroll */
        const observeRoot = imgEl.closest(".dt-art, .ds-art, .ps-art, .dc-art") || imgEl.parentElement || imgEl;
        obs.observe(observeRoot);
      } else {
        loadAssetImage(imgEl, emojiEl, src, opts);
      }
    }

    function findEggChanceForDragon(dragonId) {
      for (let i = 0; i < EGG_DEFS.length; i++) {
        const egg = EGG_DEFS[i];
        const pool = getEggHatchPool(egg.id);
        for (let j = 0; j < pool.length; j++) {
          if (pool[j].dragonId === dragonId) {
            return getPoolChancePercent(egg, dragonId);
          }
        }
      }
      return null;
    }

    /** Chance d'apparition affichée = taux GLOBAL de la rareté de l'œuf source. */
    function findEggRarityChanceForDragon(dragonId) {
      for (let i = 0; i < EGG_DEFS.length; i++) {
        const egg = EGG_DEFS[i];
        if (egg.comingSoon || egg.secret) continue;
        const pool = getEggHatchPool(egg.id);
        for (let j = 0; j < pool.length; j++) {
          if (pool[j].dragonId === dragonId) {
            const def = getDragonDef(dragonId);
            return getEggRarityDropPercent(egg, def && def.rarity);
          }
        }
      }
      return null;
    }

    function openRevealModal(reveal) {
      if (!reveal || !reveal.dragonDef) {
        finishHatchCleanup();
        return Promise.resolve();
      }
      const dragonDef = reveal.dragonDef;
      const ensurePortrait = (dragonDef.image && window.DCAssets && typeof DCAssets.loadImage === "function")
        ? DCAssets.loadImage(getDragonAsset(dragonDef, "reveal")).catch(function () { return null; })
        : Promise.resolve();

      return ensurePortrait.then(function () {
      const rarity = RARITIES[dragonDef.rarity] || RARITIES.common;
      const title = document.getElementById("dragon-modal-title");
      const badge = document.getElementById("dragon-modal-badge");
      const extra = document.getElementById("dragon-modal-extra");
      const modalInner = document.getElementById("dragon-modal-inner");
      const modal = document.getElementById("dragon-modal");
      const art = document.getElementById("dragon-modal-art");
      const ring = document.getElementById("dragon-reveal-ring");
      const flash = document.getElementById("dragon-reveal-flash");
      const sparks = document.getElementById("dragon-reveal-sparks");

      modalInner.className = "modal " + rarity.css;
      modalInner.classList.toggle("reveal-new", !!reveal.isNew);
      modalInner.classList.toggle(
        "reveal-mythic",
        dragonDef.rarity === "mythic" || dragonDef.rarity === "divine"
      );

      if (art) {
        art.className = "dc-art dragon-modal-art";
        if (dragonDef.rarity === "rare" || dragonDef.rarity === "epic") {
          art.classList.add("aura-rare");
        } else if (dragonDef.rarity === "legendary") {
          art.classList.add("aura-legendary");
        } else if (dragonDef.rarity === "mythic" || dragonDef.rarity === "divine") {
          art.classList.add("aura-mythic");
        } else {
          art.classList.add("aura-common");
        }
      }
      if (ring) {
        ring.className = "dragon-reveal-ring";
        if (dragonDef.rarity === "rare" || dragonDef.rarity === "epic") ring.classList.add("rare");
        else if (dragonDef.rarity === "legendary") ring.classList.add("legendary");
        else if (dragonDef.rarity === "mythic" || dragonDef.rarity === "divine") ring.classList.add("mythic");
      }
      if (flash) {
        flash.className = "dragon-reveal-flash";
        if (dragonDef.rarity === "mythic" || dragonDef.rarity === "divine") flash.classList.add("mythic");
      }
      if (sparks) sparks.innerHTML = "";

      if (reveal.isNew) {
        title.textContent = "🐉 NOUVEAU DRAGON DÉCOUVERT !";
        badge.hidden = false;
        badge.className = "dragon-modal-badge new dragon-reveal-ui";
        badge.textContent = "NOUVEAU DRAGON !";
        extra.textContent = '"' + dragonDef.description + '"';
      } else {
        title.textContent = "🥚 ÉCLOSION";
        badge.hidden = false;
        badge.className = "dragon-modal-badge dupe dragon-reveal-ui";
        badge.textContent = "DOUBLON";
        extra.textContent = "+" + reveal.fragmentsGained + " 🧩 Fragments de " + dragonDef.name;
      }

      document.getElementById("dragon-modal-name").textContent = dragonDef.name.toUpperCase();
      const rarityEl = document.getElementById("dragon-modal-rarity");
      rarityEl.textContent = rarity.label.toUpperCase();
      rarityEl.className = "rarity-label " + rarity.css;
      document.getElementById("dragon-modal-desc").textContent = reveal.isNew
        ? ""
        : '"' + dragonDef.description + '"';

      const img = document.getElementById("dragon-modal-img");
      const emoji = document.getElementById("dragon-modal-emoji");
      emoji.textContent = dragonDef.icon || "🐲";
      loadAssetImage(img, emoji, getDragonAsset(dragonDef, "reveal"), { silhouette: false });

      /* Hide portraits BEFORE showing modal — never flash opacity 1 */
      const preImg = document.getElementById("dragon-modal-img");
      const preEmoji = document.getElementById("dragon-modal-emoji");
      [preImg, preEmoji].forEach((el) => {
        if (!el) return;
        el.style.opacity = "0";
        el.style.transform = "scale(0.65)";
      });

      modal.classList.add("reveal-animating");
      modal.classList.remove("hidden");
      /* Await full materialize — sole reveal path after hatch sequence */
      return playDragonRevealAppear(dragonDef.rarity, !!reveal.isNew, {
        soundRarity: reveal.popupSoundRarity || dragonDef.rarity,
        skipPopupSound: !!reveal.skipPopupSound
      });
      });
    }

    /** Ordre Twin Hatch popup : Mythic > Legendary > Epic > Rare > Common */
    function pickHighestRevealRarity(a, b) {
      const rank = { common: 1, rare: 2, epic: 3, legendary: 4, mythic: 5, divine: 6 };
      const ra = rank[a] || 0;
      const rb = rank[b] || 0;
      if (rb > ra) return b || "common";
      return a || "common";
    }

    function playDragonRevealAppear(rarity, isNew, opts) {
      opts = opts || {};
      const soundRarity = opts.soundRarity || rarity;
      const skipPopupSound = !!opts.skipPopupSound;
      const reduce = prefersReducedMotion();
      const timing = (window.DCAnim && DCAnim.revealTiming)
        ? DCAnim.revealTiming(rarity, !!isNew)
        : null;
      const isMythic = timing ? timing.isMythic : (rarity === "mythic" || rarity === "divine");
      const isLegendary = timing ? timing.isLegendary : (rarity === "legendary");
      const isRare = timing ? timing.isRare : (rarity === "rare" || rarity === "epic");
      const modal = document.getElementById("dragon-modal");
      const modalInner = document.getElementById("dragon-modal-inner");
      const art = document.getElementById("dragon-modal-art");
      const aura = art && art.querySelector(".dragon-modal-aura");
      const ring = document.getElementById("dragon-reveal-ring");
      const flash = document.getElementById("dragon-reveal-flash");
      const sparksHost = document.getElementById("dragon-reveal-sparks");
      const img = document.getElementById("dragon-modal-img");
      const emoji = document.getElementById("dragon-modal-emoji");
      const portraits = [img, emoji].filter(Boolean);

      const glow =
        isMythic ? "drop-shadow(0 0 28px rgba(200,120,255,0.95)) drop-shadow(0 0 48px rgba(255,180,80,0.35))" :
        isLegendary ? "drop-shadow(0 0 24px rgba(255,200,80,0.95)) drop-shadow(0 0 40px rgba(255,150,40,0.35))" :
        isRare ? "drop-shadow(0 0 20px rgba(100,170,255,0.9))" :
        "drop-shadow(0 0 14px rgba(255,230,180,0.65))";

      /* Single source: HATCH_SEQUENCE_TIMINGS.dragonReveal (~1200ms) */
      let dragonDur = HATCH_SEQUENCE_TIMINGS.dragonReveal;
      if (isMythic) dragonDur = Math.round(dragonDur * 1.08);
      else if (isLegendary) dragonDur = Math.round(dragonDur * 1.04);
      if (reduce) dragonDur = Math.min(dragonDur, 400);
      const soundAt = Math.max(0, HATCH_SEQUENCE_TIMINGS.dragonRevealSoundAt || 250);

      if (timing && timing.dimScreen && modal) {
        modal.classList.add("reveal-mythic-dim");
        setTimeout(() => modal.classList.remove("reveal-mythic-dim"), Math.min(dragonDur + 200, 1400));
      }

      if (isNew && modal) {
        modal.classList.add("reveal-new-dragon");
        setTimeout(() => modal.classList.remove("reveal-new-dragon"), dragonDur + 400);
      } else if (modal) {
        modal.classList.add("reveal-duplicate");
        setTimeout(() => modal.classList.remove("reveal-duplicate"), dragonDur + 200);
      }

      [modalInner, art, aura, ring, flash].concat(portraits).forEach((el) => {
        if (el && el.getAnimations) {
          el.getAnimations().forEach((a) => { try { a.cancel(); } catch (e) {} });
        }
      });

      const finishPortraitStyles = (portrait) => {
        if (!portrait) return;
        portrait.style.opacity = "";
        portrait.style.transform = "";
        portrait.style.filter = "";
      };

      if (reduce) {
        if (!skipPopupSound) playDragonRevealSound(soundRarity, { force: true });
        const tasks = [];
        if (art && typeof art.animate === "function") {
          tasks.push(waitAnimation(art.animate(
            [
              { transform: "scale(0.88)", opacity: 0.6 },
              { transform: "scale(1)", opacity: 1 }
            ],
            { duration: dragonDur, easing: "ease-out", fill: "forwards" }
          )));
        }
        return Promise.all(tasks).then(() => {
          if (modal) modal.classList.remove("reveal-animating");
          document.querySelectorAll("#dragon-modal .dragon-reveal-ui").forEach((el) => {
            el.style.opacity = "";
            el.style.transform = "";
          });
        });
      }

      /* Force invisible before any frame paints */
      portraits.forEach((p) => {
        if (!p) return;
        p.style.opacity = "0";
        p.style.transform = "scale(0.65)";
      });

      if (modalInner && typeof modalInner.animate === "function") {
        modalInner.animate(
          [
            { transform: "scale(0.94) translateY(14px)", opacity: 0 },
            { transform: "scale(1.01) translateY(-2px)", opacity: 1, offset: 0.65 },
            { transform: "scale(1) translateY(0)", opacity: 1 }
          ],
          { duration: Math.min(700, dragonDur * 0.55), easing: "cubic-bezier(.2,.85,.25,1)" }
        );
      }

      if (ring && typeof ring.animate === "function") {
        ring.animate(
          [
            { opacity: 0, transform: "translate(-50%, -50%) scale(0.35)" },
            { opacity: 1, transform: "translate(-50%, -50%) scale(1.05)", offset: 0.35 },
            { opacity: 0.55, transform: "translate(-50%, -50%) scale(1.55)", offset: 0.7 },
            { opacity: 0, transform: "translate(-50%, -50%) scale(2.1)" }
          ],
          { duration: Math.round(dragonDur * 0.85), easing: "cubic-bezier(.15,.8,.25,1)", delay: 120 }
        );
      }

      if (flash && typeof flash.animate === "function") {
        flash.animate(
          [
            { opacity: 0, transform: "scale(0.5)" },
            { opacity: isMythic ? 1 : 0.85, transform: "scale(1.05)", offset: 0.25 },
            { opacity: 0, transform: "scale(1.35)" }
          ],
          { duration: isMythic ? 640 : 480, easing: "ease-out", delay: 160 }
        );
      }

      if (aura && typeof aura.animate === "function") {
        aura.animate(
          [
            { opacity: 0, transform: "scale(0.45)" },
            { opacity: 1, transform: "scale(1.12)", offset: 0.55 },
            { opacity: 1, transform: "scale(1)" }
          ],
          { duration: dragonDur * 0.9, easing: "cubic-bezier(.2,.85,.25,1)", delay: 140 }
        );
      }

      const portraitAnims = [];
      if (portraits.length) {
        const frames = [
          {
            transform: "scale(0.65)",
            opacity: 0,
            filter: "brightness(0.2) saturate(0.4) " + glow,
            offset: 0
          },
          {
            transform: "scale(0.72)",
            opacity: 0.1,
            filter: "brightness(0.45) saturate(0.55) " + glow,
            offset: 0.2
          },
          {
            transform: "scale(0.85)",
            opacity: 0.4,
            filter: "brightness(0.75) saturate(0.85) " + glow,
            offset: 0.45
          },
          {
            transform: "scale(1.04)",
            opacity: 0.75,
            filter: "brightness(1.2) saturate(1.1) " + glow,
            offset: 0.7
          },
          {
            transform: "scale(1.02)",
            opacity: 1,
            filter: "brightness(1.1) saturate(1.05) " + glow,
            offset: 0.9
          },
          {
            transform: "scale(1)",
            opacity: 1,
            filter: "brightness(1) saturate(1) " + glow,
            offset: 1
          }
        ];
        portraits.forEach((portrait) => {
          if (!portrait || typeof portrait.animate !== "function") return;
          const anim = portrait.animate(frames, {
            duration: dragonDur,
            easing: "cubic-bezier(.22,.75,.25,1)",
            delay: 0,
            fill: "forwards"
          });
          portraitAnims.push(
            waitAnimation(anim).then(() => finishPortraitStyles(portrait))
          );
        });
      }

      /*
        Rarity SFX ~180ms into materialize — dragon becomes visible, not magic start.
        Timer indépendant de hatchFxToken / clearHatchFxTimers : un dismiss rapide
        du modal ne doit pas annuler le popup audio déjà programmé.
      */
      const soundPromise = new Promise((resolve) => {
        setTimeout(() => {
          if (!skipPopupSound) playDragonRevealSound(soundRarity, { force: true });
          resolve();
        }, soundAt);
      });

      if (art && typeof art.animate === "function") {
        art.animate(
          [
            { transform: "scale(1)" },
            { transform: "scale(1.02)", offset: 0.5 },
            { transform: "scale(1)" }
          ],
          {
            duration: Math.round(dragonDur * 0.55),
            delay: Math.max(280, Math.round(dragonDur * 0.55)),
            easing: "ease-in-out"
          }
        );
      }

      spawnDragonRevealSparks(sparksHost, rarity, isNew);

      const uiNodes = Array.prototype.slice.call(
        document.querySelectorAll("#dragon-modal .dragon-reveal-ui")
      );
      uiNodes.forEach((el, i) => {
        if (el.hidden) return;
        const delay = 420 + i * 110 + (isNew ? 40 : 0) + (isMythic ? 60 : 0);
        if (el.getAnimations) el.getAnimations().forEach((a) => { try { a.cancel(); } catch (e) {} });
        el.animate(
          [
            { opacity: 0, transform: "translateY(16px) scale(0.96)" },
            { opacity: 1, transform: "translateY(0) scale(1)" }
          ],
          {
            duration: 520,
            delay: delay,
            easing: "cubic-bezier(.2,.85,.25,1)",
            fill: "both"
          }
        );
      });

      if (isMythic) spawnHatchParticles(10, true);
      else if (isLegendary) spawnHatchParticles(6, false);
      else if (isRare) spawnHatchParticles(4, false);

      const waitList = portraitAnims.length ? portraitAnims.slice() : [hatchDelay(dragonDur, hatchFxToken)];
      waitList.push(soundPromise);

      return Promise.all(waitList).then(() => {
        if (modal) modal.classList.remove("reveal-animating");
      });
    }

    function spawnDragonRevealSparks(host, rarity, isNew) {
      if (!host || prefersReducedMotion()) return;
      host.innerHTML = "";
      const isMythic = rarity === "mythic" || rarity === "divine";
      const isLegendary = rarity === "legendary";
      const isRare = rarity === "rare" || rarity === "epic";
      let count = isNew ? 10 : 7;
      if (isMythic) count = isNew ? 18 : 14;
      else if (isLegendary) count = isNew ? 14 : 10;
      else if (isRare) count = isNew ? 12 : 8;
      const cls =
        isMythic ? "mythic" :
        isLegendary ? "legendary" :
        isRare ? "rare" : "";

      for (let i = 0; i < count; i++) {
        const spark = document.createElement("span");
        spark.className = "dragon-reveal-spark" + (cls ? " " + cls : "");
        host.appendChild(spark);
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.35;
        const dist = 70 + Math.random() * (isMythic ? 110 : 80);
        const dx = Math.cos(angle) * dist;
        const dy = Math.sin(angle) * dist - 20;
        const dur = 520 + Math.random() * 380;
        const delay = 100 + Math.random() * 180;
        spark.animate(
          [
            { opacity: 0, transform: "translate(0,0) scale(0.4)" },
            { opacity: 1, transform: "translate(" + (dx * 0.35) + "px," + (dy * 0.35) + "px) scale(1.15)", offset: 0.25 },
            { opacity: 0, transform: "translate(" + dx + "px," + dy + "px) scale(0.2)" }
          ],
          { duration: dur, delay: delay, easing: "cubic-bezier(.15,.7,.25,1)", fill: "forwards" }
        ).finished.then(() => spark.remove()).catch(() => { if (spark.parentNode) spark.remove(); });
      }
    }

    function finishHatchCleanup() {
      hatchFxToken++;
      clearHatchFxTimers();
      clearDragonSummonEffectDom();
      hatchSequenceActive = false;
      clicksLocked = false;
      const stageEl = document.getElementById("egg-stage");
      if (stageEl) stageEl.classList.remove("is-hatching");
      const clickZone = document.getElementById("click-zone");
      if (clickZone) clickZone.classList.remove("clicks-disabled");
      const wrap = document.getElementById("entity-wrap");
      if (wrap) wrap.style.opacity = "";
      const clickWrap = getEggClickWrapper();
      if (clickWrap) {
        clickWrap.style.opacity = "";
        clickWrap.style.transform = "";
        clickWrap.style.filter = "";
      }
      const dragonImg = document.getElementById("hatch-dragon-img");
      if (dragonImg) dragonImg.hidden = true;
      const dragonEmoji = document.getElementById("hatch-dragon-emoji");
      if (dragonEmoji) dragonEmoji.style.display = "";
      pendingReveal = null;
      lastEggAmbientShakeAt = 0;
      currentEggImageStage = null;
      currentEggImageEggId = null;
      renderCurrentEgg();
      renderRecentHatches();
      refreshDragonCollectionUI();
    }

    function openPoolModal() {
      const eggDef = getEquippedEggDef();
      const pool = getEggHatchPool(eggDef.id);
      const discovered = countEggPoolDiscovered(eggDef);
      document.getElementById("pool-modal-title").textContent =
        "Collection de l'" + eggDef.name;
      const luckPct = getActiveRarityLuckPercent();
      document.getElementById("pool-modal-count").textContent =
        discovered + " / " + pool.length + " découverts" +
        (luckPct > 0 ? " · Chance Draconique active : +" + formatBonusPercent(luckPct / 100) + " %" : "");

      const grid = document.getElementById("pool-modal-grid");
      grid.innerHTML = "";

      pool.forEach((entry) => {
        const def = getDragonDef(entry.dragonId);
        if (!def) return;
        const owned = isDragonDiscovered(gameState.dragons[def.id], def.id, gameState);
        const rarity = RARITIES[def.rarity] || RARITIES.common;

        const slot = document.createElement("div");
        /* Rarity glow only when discovered — avoids looking "unlocked" while still ??? */
        slot.className = "pool-slot " + (owned ? rarity.css : "unknown");
        slot.innerHTML =
          '<div class="ps-art"><img alt="" draggable="false" hidden /><span class="ps-emoji"></span></div>' +
          '<div class="ps-name"></div>' +
          '<div class="rarity-label"></div>' +
          '<div class="ps-chance"></div>';

        const emoji = slot.querySelector(".ps-emoji");
        const img = slot.querySelector("img");
        emoji.textContent = def.icon || "🐲";
        loadAssetImage(img, emoji, getDragonAsset(def, "thumb"), {
          silhouette: !owned,
          fallbackSrc: def.image
        });

        if (owned) {
          slot.querySelector(".ps-name").textContent = def.name;
        } else {
          slot.querySelector(".ps-name").textContent = "???";
        }

        const rEl = slot.querySelector(".rarity-label");
        rEl.textContent = rarity.label.toUpperCase();
        rEl.className = "rarity-label " + rarity.css;
        /* Affiche le taux GLOBAL de la rareté (même source que le tirage), pas le split par dragon. */
        const rarityPct = getEggRarityDropPercent(eggDef, def.rarity);
        slot.querySelector(".ps-chance").textContent = formatDropPercent(rarityPct);

        grid.appendChild(slot);
      });

      document.getElementById("pool-modal").classList.remove("hidden");
    }

    function describeDragonBonusShort(def, stars, opts) {
      opts = opts || {};
      const lines = getDragonBonusDefs(def)
        .map((b) => formatOneDragonBonusLine(b, stars, opts))
        .filter(Boolean);
      if (!lines.length) return "";
      return lines.join(" · ");
    }

    function describeDragonBonus(def, stars) {
      const active = getDragonActiveBonus(def, stars);
      if (!active) return "";
      const short = describeDragonBonusShort(def, stars);
      if (active.name) return active.name + " — " + short.replace(/\n/g, " · ");
      return short.replace(/\n/g, " · ");
    }

    /**
     * Affichage bestiaire (visuel central uniquement) :
     * - "portrait"    : dragon découvert → image réelle
     * - "silhouette"  : zone débloquée, non découvert → silhouette noire
     * - "unknown"     : zone verrouillée → point d’interrogation
     */
    function getDragonBestiaryVisualMode(def, state) {
      state = state || gameState;
      if (!def) return "unknown";
      const entry = state.dragons ? state.dragons[def.id] : null;
      if (isDragonDiscovered(entry, def.id, state)) return "portrait";
      const zoneId = def.zoneId || "sanctuary";
      if (isZoneUnlocked(state, zoneId)) return "silhouette";
      return "unknown";
    }

    function getDragonsForFilter(filterZoneId) {
      return DRAGON_DEFS.filter((d) => {
        if (d.secret) return false;
        /* TOUS : zones débloquées + verrouillées (visuel différencié ensuite) */
        if (!filterZoneId || filterZoneId === "all") return true;
        if (!isZoneUnlocked(gameState, filterZoneId)) return false;
        return d.zoneId === filterZoneId;
      });
    }

    function renderDragonsFilters() {
      const host = document.getElementById("dragons-filters");
      if (!host) return;
      host.innerHTML = "";

      const currentZoneId = gameState.currentZoneId || "sanctuary";

      const makeBtn = (opts) => {
        const {
          id,
          label,
          isAll,
          isCurrentZone,
          locked,
          title
        } = opts;
        const btn = document.createElement("button");
        btn.type = "button";
        const classes = ["dragons-filter-btn"];
        if (isAll) classes.push("df-all");
        if (isCurrentZone) classes.push("df-current");
        if (locked) classes.push("locked");
        if (dragonsFilterZoneId === id) classes.push("active");
        btn.className = classes.join(" ");
        btn.dataset.zoneFilter = id;
        btn.setAttribute("aria-pressed", String(dragonsFilterZoneId === id));
        btn.title = title || label;

        let html = "";
        if (locked) html += '<span class="df-lock" aria-hidden="true">🔒</span>';
        html += '<span class="df-label"></span>';
        if (isCurrentZone) html += '<span class="df-current-tag">Actuelle</span>';
        btn.innerHTML = html;
        btn.querySelector(".df-label").textContent = label;

        btn.addEventListener("pointerdown", () => {
          if (locked) return;
          warmDragonsFirstViewport(id, DRAGONS_VIEWPORT_WARM);
        }, { passive: true });
        btn.addEventListener("click", () => {
          if (locked) return;
          if (dragonsFilterZoneId === id) return;
          dragonsFilterZoneId = id;
          const grid = document.getElementById("dragons-grid");
          const reveal = () => {
            if (grid) grid.style.opacity = "";
            dragonsDirty = true;
            renderDragons();
          };
          const paths = getViewportDiscoveredPortraitPaths(id, DRAGONS_VIEWPORT_WARM);
          const missing = window.DCAssets
            ? paths.filter((p) => !DCAssets.isLoaded(p))
            : [];
          if (missing.length) {
            if (grid) grid.style.opacity = "0";
            raceWarmDragonsViewport(id, DRAGONS_VIEWPORT_WARM, DRAGONS_WARM_WAIT_MS)
              .then(reveal)
              .catch(reveal);
            return;
          }
          warmDragonsFirstViewport(id, DRAGONS_VIEWPORT_WARM);
          reveal();
        });
        host.appendChild(btn);
      };

      makeBtn({
        id: "all",
        label: "Tous",
        isAll: true,
        title: "Tous les dragons"
      });

      let permanentIndex = 0;
      ZONE_DEFS.forEach((zone) => {
        if (zone.eventOnly) {
          if (!isZoneUnlocked(gameState, zone.id)) return;
          makeBtn({
            id: zone.id,
            label: zone.icon || "🎃",
            isCurrentZone: zone.id === currentZoneId,
            locked: false,
            title: zone.name
          });
          return;
        }
        permanentIndex += 1;
        const unlocked = isZoneUnlocked(gameState, zone.id);
        const isCurrent = zone.id === currentZoneId;
        makeBtn({
          id: zone.id,
          label: "Zone " + permanentIndex,
          isCurrentZone: isCurrent,
          locked: !unlocked,
          title: zone.name + (unlocked ? "" : " (verrouillée)")
        });
      });
    }

    let dragonsGridDelegatesBound = false;

    function setSelectedDragonTile(dragonId) {
      const grid = document.getElementById("dragons-grid");
      if (!grid) return;
      const prev = grid.querySelector(".dragon-tile.selected");
      if (prev) prev.classList.remove("selected");
      if (!dragonId) return;
      const next = grid.querySelector('.dragon-tile[data-dragon-id="' + dragonId + '"]');
      if (next) next.classList.add("selected");
    }

    function bindDragonsGridDelegates() {
      if (dragonsGridDelegatesBound) return;
      const grid = document.getElementById("dragons-grid");
      if (!grid) return;
      dragonsGridDelegatesBound = true;

      grid.addEventListener("click", (e) => {
        const tile = e.target.closest(".dragon-tile");
        if (!tile || !grid.contains(tile)) return;
        const id = tile.dataset.dragonId;
        if (id) openDragonDetail(id);
      });
      grid.addEventListener("keydown", (ev) => {
        if (ev.key !== "Enter" && ev.key !== " ") return;
        const tile = ev.target.closest(".dragon-tile");
        if (!tile || !grid.contains(tile)) return;
        ev.preventDefault();
        const id = tile.dataset.dragonId;
        if (id) openDragonDetail(id);
      });
    }

    function renderDragons() {
      const grid = document.getElementById("dragons-grid");
      if (!grid) return;
      grid.innerHTML = "";

      if (dragonsFilterZoneId !== "all" && !isZoneUnlocked(gameState, dragonsFilterZoneId)) {
        dragonsFilterZoneId = "all";
      }

      renderDragonsFilters();
      bindDragonsGridDelegates();

      const visibleDefs = getDragonsForFilter(dragonsFilterZoneId);
      const ownedCount = visibleDefs.filter((d) =>
        isDragonDiscovered(gameState.dragons?.[d.id], d.id, gameState)
      ).length;

      const header = document.getElementById("dragons-count");
      if (header) {
        const valueEl = header.querySelector(".dragons-collection-value");
        const fillEl = header.querySelector(".dragons-collection-fill") ||
          document.getElementById("dragons-collection-fill");
        if (valueEl) valueEl.textContent = ownedCount + " / " + visibleDefs.length;
        if (fillEl) {
          fillEl.style.width =
            (visibleDefs.length ? (ownedCount / visibleDefs.length) * 100 : 0) + "%";
        }
      }

      const modal = document.getElementById("dragon-detail-modal");
      const selectedId =
        modal && !modal.classList.contains("hidden") ? modal.dataset.dragonId : null;

      const frag = document.createDocumentFragment();
      visibleDefs.forEach((def, index) => {
        const entry = ensureDragonEntry(def.id, gameState);
        const visualMode = getDragonBestiaryVisualMode(def, gameState);
        const owned = visualMode === "portrait";
        if (owned) markDragonDiscovered(def.id, gameState);
        const rarity = RARITIES[def.rarity] || RARITIES.common;
        const stars = owned ? Math.max(1, safeNumber(entry.stars, 1)) : 0;
        const onExpedition = owned && isDragonOnExpedition(def.id);
        const onTeam = owned && getTeam().indexOf(def.id) !== -1;

        /* Carte épurée (style Formation) : rareté + gros art + nom discret + étoiles.
           Bonus / fragments / progression → panneau détail au clic. */
        const tile = document.createElement("article");
        tile.className = "dragon-tile " + rarity.css +
          (owned ? "" : " undiscovered") +
          (visualMode === "unknown" ? " unknown-zone" : "") +
          (selectedId === def.id ? " selected" : "");
        tile.dataset.dragonId = def.id;
        tile.dataset.visualMode = visualMode;
        tile.tabIndex = 0;
        tile.setAttribute("role", "button");
        tile.setAttribute("aria-label", owned
          ? def.name + " — " + rarity.label + " — " + stars + " étoiles"
          : "Dragon inconnu — " + rarity.label);
        tile.setAttribute("aria-pressed", selectedId === def.id ? "true" : "false");

        let badges = "";
        if (onExpedition) badges += '<span class="dt-expedition-badge">Expédition</span>';
        if (onTeam && !onExpedition) badges += '<span class="dt-team-badge">Équipe</span>';

        tile.innerHTML =
          (badges ? '<div class="dt-status-badges">' + badges + "</div>" : "") +
          '<span class="dt-band"></span>' +
          '<div class="dt-art"><img alt="" draggable="false" decoding="async" width="160" height="160" hidden /><span class="dc-emoji"></span></div>' +
          '<div class="dt-name"></div>' +
          '<div class="dt-stars"></div>';

        tile.querySelector(".dt-band").textContent = rarity.label;
        const emoji = tile.querySelector(".dc-emoji");
        const imgEl = tile.querySelector("img");
        if (visualMode === "unknown") {
          /* Zone verrouillée : pas de chargement d’asset (évite silhouette révélatrice) */
          emoji.textContent = "?";
          emoji.style.display = "";
          imgEl.hidden = true;
          imgEl.removeAttribute("src");
          imgEl.classList.remove("silhouette");
        } else {
          emoji.textContent = owned ? (def.icon || "🐲") : "?";
          /*
            Bestiaire — perf scroll :
            - thumb WebP uniquement (pas de fallback HD sur silhouette)
            - eager seulement pour le 1er viewport (index), reste via IO existant
          */
          bindDragonPortrait(imgEl, emoji, getDragonAsset(def, "thumb"), {
            silhouette: visualMode === "silhouette",
            fallbackSrc: visualMode === "portrait" ? def.image : null
          }, index);
        }

        tile.querySelector(".dt-name").textContent = owned ? def.name : "???";
        if (owned) {
          tile.querySelector(".dt-stars").innerHTML = renderTeamStarsHtml(stars);
        }

        frag.appendChild(tile);
      });
      grid.appendChild(frag);

      if (selectedId) fillDragonDetail(selectedId);
      renderTeamModule();
      dragonsDirty = false;
    }

    function fillDragonDetail(dragonId) {
      const def = getDragonDef(dragonId);
      const box = document.getElementById("dragon-detail-body");
      if (!def || !box) return;
      const entry = ensureDragonEntry(def.id, gameState);
      const visualMode = getDragonBestiaryVisualMode(def, gameState);
      const owned = visualMode === "portrait";
      const rarity = RARITIES[def.rarity] || RARITIES.common;
      const stars = owned ? Math.max(1, safeNumber(entry.stars, 1)) : 0;
      const frags = safeNumber(entry.fragments, 0);
      const next = owned ? getFragmentsForNextStar(def, entry) : null;
      const onTeam = owned && getTeam().indexOf(def.id) !== -1;
      const onExpedition = owned && isDragonOnExpedition(def.id);

      const sheet = document.getElementById("dragon-detail-sheet");
      sheet.className = "modal dragon-sheet " + (owned ? rarity.css : "undiscovered") +
        (visualMode === "unknown" ? " unknown-zone" : "");

      box.innerHTML =
        '<div class="ds-hero">' +
          '<div class="ds-art"><img alt="" draggable="false" hidden /><span class="dc-emoji"></span></div>' +
          '<div class="ds-status-row"></div>' +
          '<span class="ds-rarity"></span>' +
          '<h2 class="ds-name"></h2>' +
          '<div class="ds-stars"></div>' +
        "</div>" +
        '<p class="ds-desc"></p>' +
        '<button type="button" class="ds-lore-more">Voir plus</button>' +
        '<div class="ds-bonus"></div>' +
        '<div class="ds-frag"></div>' +
        '<div class="ds-action"></div>' +
        '<div class="ds-date"></div>';

      const emoji = box.querySelector(".dc-emoji");
      const detailImg = box.querySelector("img");
      if (visualMode === "unknown") {
        emoji.textContent = "❔";
        emoji.style.display = "";
        detailImg.hidden = true;
        detailImg.removeAttribute("src");
        detailImg.classList.remove("silhouette");
      } else {
        emoji.textContent = owned ? (def.icon || "🐲") : "❔";
        loadAssetImage(detailImg, emoji, getDragonAsset(def, "detail"), {
          silhouette: visualMode === "silhouette"
        });
      }

      box.querySelector(".ds-rarity").textContent = rarity.label;
      box.querySelector(".ds-rarity").className = "ds-rarity " + rarity.css;

      const statusRow = box.querySelector(".ds-status-row");
      if (onExpedition) {
        const chip = document.createElement("span");
        chip.className = "ds-chip ds-chip-expedition";
        chip.textContent = "En expédition";
        statusRow.appendChild(chip);
      } else if (onTeam) {
        const chip = document.createElement("span");
        chip.className = "ds-chip ds-chip-equipped";
        chip.textContent = "Équipé";
        statusRow.appendChild(chip);
      }

      if (!owned) {
        const chance = findEggRarityChanceForDragon(def.id);
        box.querySelector(".ds-name").textContent = "???";
        box.querySelector(".ds-desc").textContent = "Faites éclore des œufs pour découvrir ce dragon.";
        const bonusEl = box.querySelector(".ds-bonus");
        if (chance != null) {
          bonusEl.innerHTML =
            '<div class="ds-bonus-name">Apparition</div>' +
            '<div class="ds-bonus-value"></div>';
          bonusEl.querySelector(".ds-bonus-value").textContent = formatDropPercent(chance);
        } else {
          bonusEl.textContent = "";
        }
        return;
      }

      box.querySelector(".ds-name").textContent = def.name;
      box.querySelector(".ds-stars").innerHTML = renderTeamStarsHtml(stars);

      const lore = def.description || "";
      const descEl = box.querySelector(".ds-desc");
      const loreBtn = box.querySelector(".ds-lore-more");
      descEl.textContent = lore;
      if (lore.length > 120) {
        loreBtn.classList.add("visible");
        loreBtn.addEventListener("click", () => {
          const open = descEl.classList.toggle("expanded");
          loreBtn.textContent = open ? "Voir moins" : "Voir plus";
        });
      }

      const activeBonus = getDragonActiveBonus(def, stars);
      const bonusEl = box.querySelector(".ds-bonus");
      if (activeBonus) {
        bonusEl.innerHTML = "";
        const title = document.createElement("div");
        title.className = "ds-bonus-name";
        title.textContent = activeBonus.name || "Bonus";
        const value = document.createElement("div");
        value.className = "ds-bonus-value";
        value.textContent = describeDragonBonusShort(def, stars) || ("+" + formatBonusPercent(activeBonus.value) + " %");
        bonusEl.appendChild(title);
        bonusEl.appendChild(value);
        if (next) {
          const nextBlock = document.createElement("div");
          nextBlock.className = "ds-bonus-next";
          nextBlock.textContent = formatDragonBonusNextLine(def, next.toStar);
          bonusEl.appendChild(nextBlock);
        } else if (stars >= MAX_DRAGON_STARS) {
          const maxed = document.createElement("div");
          maxed.className = "ds-max-badge";
          maxed.textContent = "✦ Niveau maximum";
          bonusEl.appendChild(maxed);
        }
      } else {
        bonusEl.textContent = "";
      }

      const fragBox = box.querySelector(".ds-frag");
      const action = box.querySelector(".ds-action");
      if (next) {
        const ready = frags >= next.cost;
        fragBox.className = "ds-frag" + (ready ? " ready" : "");
        fragBox.innerHTML =
          '<div class="ds-frag-head">' +
            '<span class="ds-frag-title"><span class="ds-frag-ico" aria-hidden="true"></span><span class="ds-frag-label"></span></span>' +
            '<span class="ds-frag-count"></span>' +
          "</div>" +
          '<div class="ds-frag-bar"><div class="ds-frag-fill"></div></div>';
        fragBox.querySelector(".ds-frag-label").textContent = "Fragments";
        fragBox.querySelector(".ds-frag-count").innerHTML =
          formatNumber(frags) + " / <em>" + next.cost + "</em>";
        fragBox.querySelector(".ds-frag-fill").style.width =
          Math.min(100, (frags / Math.max(1, next.cost)) * 100) + "%";

        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "btn ds-evolve-btn";
        btn.disabled = !ready;
        btn.innerHTML =
          '<span class="ds-evolve-title"></span><span class="ds-evolve-cost"></span>';
        btn.querySelector(".ds-evolve-title").textContent = "Évoluer en " + next.toStar + "★";
        btn.querySelector(".ds-evolve-cost").textContent =
          formatNumber(frags) + " / " + next.cost + " fragments";
        btn.addEventListener("click", () => {
          if (!tryUpgradeDragonStar(def.id)) return;
          saveGame(true);
          renderDragons();
          fillDragonDetail(def.id);
          renderTeamModule();
          playDragonEvolveFeedback();
        });
        action.appendChild(btn);
      } else {
        fragBox.innerHTML = '<div class="ds-maxed">✦ Niveau maximum atteint</div>';
      }

      if (entry.obtainedAt) {
        try {
          box.querySelector(".ds-date").textContent =
            "Découvert le " + new Date(entry.obtainedAt).toLocaleDateString("fr-FR");
        } catch (e) { /* ignore */ }
      }
    }

    function playDragonEvolveFeedback() {
      const sheet = document.getElementById("dragon-detail-sheet");
      if (!sheet) return;
      let plus = sheet.querySelector(".ds-plus-star");
      if (!plus) {
        plus = document.createElement("span");
        plus.className = "ds-plus-star";
        plus.setAttribute("aria-hidden", "true");
        sheet.appendChild(plus);
      }
      plus.textContent = "+1★";
      sheet.classList.remove("ds-evolving");
      void sheet.offsetWidth;
      sheet.classList.add("ds-evolving");
      clearTimeout(playDragonEvolveFeedback._t);
      playDragonEvolveFeedback._t = setTimeout(() => {
        sheet.classList.remove("ds-evolving");
      }, 700);
    }

    function openDragonDetail(dragonId) {
      const modal = document.getElementById("dragon-detail-modal");
      if (!modal) return;
      modal.dataset.dragonId = dragonId;
      fillDragonDetail(dragonId);
      modal.classList.remove("hidden");
      setSelectedDragonTile(dragonId);
    }

    function closeDragonDetail() {
      const modal = document.getElementById("dragon-detail-modal");
      if (!modal) return;
      modal.classList.add("hidden");
      delete modal.dataset.dragonId;
      const sheet = document.getElementById("dragon-detail-sheet");
      if (sheet) sheet.classList.remove("ds-evolving");
      setSelectedDragonTile(null);
    }

    /* -------------------------------------------------------
       TEAM MODULE — bonuses recalculated from equipped dragons.
       ------------------------------------------------------- */
    const TEAM_BONUS_SHORT = {
      clickPowerPercent: "Puissance de clic",
      clickPowerFlat: "Puissance de clic",
      clickEssencePercent: "Gains au clic",
      essenceProductionPercent: "Essence/sec",
      essenceProductionFlat: "Essence/sec",
      essenceGlobalPercent: "Essence globale",
      critChanceFlatPercent: "Chance critique",
      fragmentGainPercent: "Fragments obtenus",
      duplicateBonusFragmentChance: "Fragment doublon",
      manualClick: "Puissance de clic",
      clickPct: "Puissance de clic",
      fragmentYield: "Fragments obtenus",
      fragmentMult: "Fragments obtenus",
      criticalChance: "Chance critique",
      critChance: "Chance critique",
      expeditionReward: "Expéditions",
      rarityLuck: "Chance Draconique",
      globalProdPct: "Essence/sec",
      offlineMult: "Hors ligne"
    };

    const TEAM_BONUS_ICON = {
      clickPowerPercent: "⚔",
      clickPowerFlat: "⚔",
      clickEssencePercent: "✧",
      essenceProductionPercent: "✧",
      essenceProductionFlat: "✧",
      essenceGlobalPercent: "✧",
      critChanceFlatPercent: "✦",
      fragmentGainPercent: "◆",
      duplicateBonusFragmentChance: "✧",
      manualClick: "⚔",
      clickPct: "⚔",
      fragmentYield: "◆",
      fragmentMult: "◆",
      criticalChance: "✦",
      critChance: "✦",
      expeditionReward: "🧭",
      rarityLuck: "✧",
      globalProdPct: "✧",
      offlineMult: "☾"
    };

    function formatTeamBonusPct(value) {
      return formatBonusPercent(value);
    }

    function describeTeamSlotBonus(def, stars) {
      return describeDragonBonusShort(def, stars);
    }

    function renderTeamStarsHtml(stars) {
      const filled = Math.max(0, Math.min(MAX_DRAGON_STARS, Math.floor(safeNumber(stars, 0))));
      let html = "";
      for (let i = 0; i < MAX_DRAGON_STARS; i++) {
        html += i < filled
          ? '<span class="star-on">★</span>'
          : '<span class="star-empty">☆</span>';
      }
      return html;
    }

    function getTeam() {
      if (!Array.isArray(gameState.team)) gameState.team = [null, null, null];
      while (gameState.team.length < TEAM_SIZE) gameState.team.push(null);
      return gameState.team;
    }

    function getTeamDragon(slotIndex) {
      const id = getTeam()[slotIndex];
      if (!id) return null;
      const def = getDragonDef(id);
      const entry = gameState.dragons[id];
      if (!def || !isDragonDiscovered(entry, id, gameState)) return null;
      return { def, entry, stars: Math.max(1, safeNumber(entry.stars, 1)) };
    }

    function getTeamBonusTotals() {
      const totals = {};
      for (let i = 0; i < TEAM_SIZE; i++) {
        const d = getTeamDragon(i);
        if (!d || !getDragonBonusDefs(d.def).length) continue;
        if (isDragonOnExpedition(d.def.id)) continue;
        getDragonBonusDefs(d.def).forEach((bonusEntry) => {
          const value = getDragonBonusEntryValue(bonusEntry, d.stars);
          if (value <= 0) return;
          const t = normalizeDragonBonusType(bonusEntry.type);
          totals[t] = (totals[t] || 0) + value;
        });
      }
      return totals;
    }


    /* -------------------------------------------------------
       EXPEDITIONS
       ------------------------------------------------------- */
    function createEmptyExpeditionState() {
      return {
        unlockedSlots: DEFAULT_EXPEDITION_SLOTS,
        slots: Array.from({ length: DEFAULT_EXPEDITION_SLOTS }, () => null),
        systemUnlocked: false,
        contracts: [],
        dailyContracts: { dateKey: null, contracts: [] },
        contractProcessedRuns: {},
        activeThreat: null,
        threatRolledRuns: {}
      };
    }

    function ensureExpeditionState(state) {
      const st = state || gameState;
      if (!st.expeditions || typeof st.expeditions !== "object") {
        st.expeditions = createEmptyExpeditionState();
      }
      const exp = st.expeditions;
      exp.unlockedSlots = Math.max(1, Math.floor(safeNumber(exp.unlockedSlots, DEFAULT_EXPEDITION_SLOTS)));
      if (!Array.isArray(exp.slots)) exp.slots = [];
      while (exp.slots.length < exp.unlockedSlots) exp.slots.push(null);
      if (exp.systemUnlocked == null) exp.systemUnlocked = false;
      /* Camp already bought → permanent unlock */
      if (!exp.systemUnlocked && st.specialUpgrades?.[EXPEDITION_CAMP_ID]?.bought) {
        exp.systemUnlocked = true;
      }
      if (!Array.isArray(exp.contracts)) exp.contracts = [];
      if (!exp.dailyContracts || typeof exp.dailyContracts !== "object") {
        exp.dailyContracts = { dateKey: null, contracts: [] };
      }
      if (!Array.isArray(exp.dailyContracts.contracts)) exp.dailyContracts.contracts = [];
      if (!exp.contractProcessedRuns || typeof exp.contractProcessedRuns !== "object") {
        exp.contractProcessedRuns = {};
      }
      if (!exp.threatRolledRuns || typeof exp.threatRolledRuns !== "object") {
        exp.threatRolledRuns = {};
      }
      if (exp.activeThreat != null && typeof exp.activeThreat !== "object") {
        exp.activeThreat = null;
      }
      return exp;
    }

    function getExpeditionDef(id) {
      if (!id) return null;
      const base = EXPEDITION_DEFS.find((e) => e.id === id);
      if (base) return base;
      const exp = gameState && gameState.expeditions;
      const threat = exp && exp.activeThreat;
      if (threat && threat.id === id) return buildThreatExpeditionDef(threat);
      return null;
    }

    function getVisibleExpeditions() {
      const zone = getCurrentZone();
      return EXPEDITION_DEFS.filter((e) => e.zoneId === zone.id);
    }

    function getExpeditionZoneLabel(defOrZoneId) {
      const zoneId = typeof defOrZoneId === "string"
        ? defOrZoneId
        : (defOrZoneId && defOrZoneId.zoneId);
      const zone = getZoneDef(zoneId);
      return zone ? zone.name : "Zone inconnue";
    }

    /* -------------------------------------------------------
       CONTRATS QUOTIDIENS V2 (data: js/data/contracts.js) + MENACES
       ------------------------------------------------------- */
    const CONTRACT_RARITY_RANK = {
      common: 1,
      rare: 2,
      epic: 3,
      legendary: 4,
      mythic: 5,
      divine: 6
    };

    function getContractTemplates() {
      return Array.isArray(CONTRACT_TEMPLATES) ? CONTRACT_TEMPLATES : [];
    }

    function getContractDateKey(dateObj) {
      const d = dateObj instanceof Date ? dateObj : new Date(dateObj || Date.now());
      if (Number.isNaN(d.getTime())) {
        const n = new Date();
        return (
          n.getFullYear() +
          "-" +
          String(n.getMonth() + 1).padStart(2, "0") +
          "-" +
          String(n.getDate()).padStart(2, "0")
        );
      }
      return (
        d.getFullYear() +
        "-" +
        String(d.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(d.getDate()).padStart(2, "0")
      );
    }

    function getMsUntilNextContractRollover(nowMs) {
      const now = new Date(nowMs != null ? nowMs : Date.now());
      const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
      return Math.max(0, next.getTime() - now.getTime());
    }

    function formatContractCountdown(ms) {
      const totalSec = Math.max(0, Math.floor(safeNumber(ms, 0) / 1000));
      const h = Math.floor(totalSec / 3600);
      const m = Math.floor((totalSec % 3600) / 60);
      const s = totalSec % 60;
      return (
        String(h).padStart(2, "0") +
        ":" +
        String(m).padStart(2, "0") +
        ":" +
        String(s).padStart(2, "0")
      );
    }

    function pickWeightedKey(weights) {
      const entries = [];
      let total = 0;
      Object.keys(weights || {}).forEach((k) => {
        const w = Math.max(0, safeNumber(weights[k], 0));
        if (w <= 0) return;
        entries.push({ k, w });
        total += w;
      });
      if (!entries.length || total <= 0) return "common";
      let r = Math.random() * total;
      for (let i = 0; i < entries.length; i++) {
        r -= entries[i].w;
        if (r <= 0) return entries[i].k;
      }
      return entries[entries.length - 1].k;
    }

    function pickIntInRange(range, fallback) {
      if (Array.isArray(range) && range.length >= 2) {
        const min = Math.floor(safeNumber(range[0], fallback));
        const max = Math.max(min, Math.floor(safeNumber(range[1], min)));
        return min + Math.floor(Math.random() * (max - min + 1));
      }
      return Math.max(1, Math.floor(safeNumber(fallback, 1)));
    }

    function getUnlockedZoneIdsForContracts() {
      return (gameState.unlockedZones || []).filter((id) => getZoneDef(id));
    }

    function playerOwnsDragonRarityAtLeast(minRarity) {
      const need = CONTRACT_RARITY_RANK[minRarity] || 1;
      return DRAGON_DEFS.some((d) => {
        if (!d || d.secret) return false;
        if (!isDragonDiscovered(gameState.dragons[d.id], d.id, gameState)) return false;
        return (CONTRACT_RARITY_RANK[d.rarity] || 0) >= need;
      });
    }

    function hasUnlockedExpeditionWithMinDuration(minDurationMs) {
      const need = Math.max(0, safeNumber(minDurationMs, 0));
      const unlocked = {};
      getUnlockedZoneIdsForContracts().forEach((id) => {
        unlocked[id] = true;
      });
      return EXPEDITION_DEFS.some(
        (e) => e && unlocked[e.zoneId] && safeNumber(e.durationMs, 0) >= need
      );
    }

    function isContractTemplateEligible(tpl) {
      if (!tpl || !tpl.type) return false;
      if (tpl.type === "zone") {
        return getUnlockedZoneIdsForContracts().length > 0;
      }
      if (tpl.type === "rarity_team") {
        return playerOwnsDragonRarityAtLeast(tpl.minDragonRarity || "rare");
      }
      if (tpl.type === "long_duration") {
        return hasUnlockedExpeditionWithMinDuration(tpl.minDurationMs || 30 * 60 * 1000);
      }
      return true;
    }

    function buildContractDescription(contract) {
      const n = Math.max(1, safeNumber(contract.target, 1));
      const plural = n > 1 ? "s" : "";
      if (contract.type === "finish") {
        return "Terminer " + n + " expédition" + plural + ".";
      }
      if (contract.type === "favorable") {
        return "Terminer " + n + " expédition" + plural + " favorables.";
      }
      if (contract.type === "meet_power") {
        return (
          "Terminer " +
          n +
          " expédition" +
          plural +
          " avec une équipe ≥ puissance conseillée."
        );
      }
      if (contract.type === "domination") {
        const pct = Math.round(safeNumber(contract.dominationRatio, 1.25) * 100);
        return (
          "Terminer " +
          n +
          " expédition" +
          plural +
          " avec ≥ " +
          pct +
          " % de la puissance conseillée."
        );
      }
      if (contract.type === "zone") {
        const zoneName = getExpeditionZoneLabel(contract.zoneId);
        return "Terminer " + n + " expédition" + plural + " en " + zoneName + ".";
      }
      if (contract.type === "full_party") {
        return (
          "Terminer " +
          n +
          " expédition" +
          plural +
          " avec 3 dragons sélectionnés."
        );
      }
      if (contract.type === "rarity_team") {
        const rar =
          (RARITIES[contract.minDragonRarity] && RARITIES[contract.minDragonRarity].label) ||
          "Rare";
        return (
          "Terminer " +
          n +
          " expédition" +
          plural +
          " avec au moins 1 dragon " +
          rar +
          "+" +
          "."
        );
      }
      if (contract.type === "long_duration") {
        const mins = Math.max(1, Math.round(safeNumber(contract.minDurationMs, 0) / 60000));
        const label =
          mins >= 60
            ? mins % 60 === 0
              ? mins / 60 + " h"
              : (mins / 60).toFixed(1).replace(".0", "") + " h"
            : mins + " min";
        return (
          "Terminer " +
          n +
          " expédition" +
          plural +
          " d'au moins " +
          label +
          "."
        );
      }
      return contract.description || "Objectif d'expédition.";
    }

    function rollContractReward(rarity) {
      const pools =
        typeof CONTRACT_REWARD_POOLS === "object" && CONTRACT_REWARD_POOLS
          ? CONTRACT_REWARD_POOLS
          : {};
      const pool = pools[rarity] || pools.common || [];
      if (!pool.length) {
        return { kind: "essence", amount: 1000 };
      }
      const weightMap = {};
      pool.forEach((entry, i) => {
        weightMap[String(i)] = safeNumber(entry.weight, 1);
      });
      const picked = pool[parseInt(pickWeightedKey(weightMap), 10)] || pool[0];
      const reward = { kind: picked.kind || "essence" };
      if (reward.kind === "chest") {
        reward.chestType = CHEST_TYPES[picked.chestType] ? picked.chestType : "draconic";
        reward.zoneId = getCurrentZone().id || "sanctuary";
        return reward;
      }
      if (reward.kind === "fragments") {
        reward.amount = pickIntInRange(picked.amount, 1);
        return reward;
      }
      /* Essence : snapshot production passive au moment de la génération */
      const minutes = pickIntInRange(picked.minutes, 3);
      let pps = safeNumber(gameState.powerPerSecond, 0);
      if (!(pps > 0) && typeof recalculateGlobalStats === "function") {
        try {
          pps = safeNumber(recalculateGlobalStats().essencePerSecond, 0);
        } catch (e) {
          pps = 0;
        }
      }
      let amount = Math.floor(pps * 60 * minutes);
      const minAmt = Math.max(0, Math.floor(safeNumber(picked.min, 0)));
      const maxAmt = Math.max(minAmt, Math.floor(safeNumber(picked.max, amount || minAmt)));
      if (!(amount > 0)) amount = minAmt;
      amount = Math.max(minAmt, Math.min(maxAmt, amount));
      reward.amount = Math.max(1, amount);
      reward.snapshotMinutes = minutes;
      reward.snapshotPps = pps;
      return reward;
    }

    function describeContractReward(reward) {
      if (!reward) return "Récompense";
      if (reward.kind === "chest") {
        const t = CHEST_TYPES[reward.chestType];
        return t ? t.name : "Coffre";
      }
      if (reward.kind === "essence") {
        return formatNumber(reward.amount) + " Essence";
      }
      if (reward.kind === "fragments") {
        return "+" + Math.max(1, safeNumber(reward.amount, 1)) + " fragments";
      }
      return "Récompense";
    }

    function getContractRarityMeta(rarity) {
      const meta =
        typeof CONTRACT_RARITY_META === "object" && CONTRACT_RARITY_META
          ? CONTRACT_RARITY_META[rarity]
          : null;
      if (meta) return meta;
      const r = RARITIES[rarity] || RARITIES.common;
      return { id: r.id, label: r.label, css: r.css };
    }

    function createDailyContractFromTemplate(tpl, rarity) {
      if (!tpl || !isContractTemplateEligible(tpl)) return null;
      const targetRange = Array.isArray(tpl.target) ? tpl.target : [1, 1];
      const target = pickIntInRange(targetRange, 1);
      let zoneId = null;
      if (tpl.type === "zone") {
        const unlocked = getUnlockedZoneIdsForContracts();
        if (!unlocked.length) return null;
        zoneId = unlocked[Math.floor(Math.random() * unlocked.length)];
      }
      const ratios =
        typeof CONTRACT_DOMINATION_RATIOS === "object" ? CONTRACT_DOMINATION_RATIOS : {};
      const ratioKey = tpl.ratioKey || rarity;
      const dominationRatio =
        tpl.type === "domination"
          ? safeNumber(ratios[ratioKey], rarity === "legendary" ? 1.5 : rarity === "epic" ? 1.4 : 1.25)
          : null;
      const contract = {
        id:
          "ctr_" +
          Date.now().toString(36) +
          "_" +
          Math.floor(Math.random() * 1e6).toString(36),
        templateId: tpl.id,
        type: tpl.type,
        rarity: rarity || tpl.rarity || "common",
        title: tpl.title || "Contrat",
        target: target,
        progress: 0,
        zoneId: zoneId,
        minDragonRarity: tpl.minDragonRarity || null,
        dominationRatio: dominationRatio,
        minDurationMs: tpl.minDurationMs || null,
        reward: rollContractReward(rarity || tpl.rarity || "common"),
        status: "active",
        claimed: false,
        description: ""
      };
      contract.description = buildContractDescription(contract);
      return contract;
    }

    function normalizeDailyContract(raw) {
      if (!raw || typeof raw !== "object") return null;
      const rarity = raw.rarity || "common";
      const status =
        raw.claimed || raw.status === "claimed"
          ? "claimed"
          : raw.status === "ready"
            ? "ready"
            : "active";
      const c = {
        id: String(raw.id || ("ctr_" + Math.random().toString(36).slice(2))),
        templateId: raw.templateId || raw.id || "finish_c",
        type: raw.type || "finish",
        rarity: rarity,
        title: String(raw.title || "Contrat"),
        target: Math.max(1, Math.floor(safeNumber(raw.target, 1))),
        progress: Math.max(0, Math.floor(safeNumber(raw.progress, 0))),
        zoneId: raw.zoneId || null,
        minDragonRarity: raw.minDragonRarity || null,
        dominationRatio:
          raw.dominationRatio != null ? safeNumber(raw.dominationRatio, null) : null,
        minDurationMs: raw.minDurationMs != null ? safeNumber(raw.minDurationMs, null) : null,
        reward:
          raw.reward && typeof raw.reward === "object"
            ? raw.reward
            : { kind: "essence", amount: 1000 },
        status: status,
        claimed: status === "claimed",
        description: String(raw.description || "")
      };
      if (c.progress >= c.target && c.status === "active") {
        c.progress = c.target;
        c.status = "ready";
      }
      if (!c.description) c.description = buildContractDescription(c);
      return c;
    }

    function migrateV1ContractsToDaily(exp, dateKey) {
      const legacy = Array.isArray(exp.contracts) ? exp.contracts.filter((c) => c && typeof c === "object") : [];
      if (!legacy.length) return null;
      const ready = legacy.filter((c) => c.status === "ready" && !c.claimed);
      const active = legacy.filter((c) => c.status !== "ready" && !c.claimed);
      const ordered = ready.concat(active).slice(0, CONTRACT_ACTIVE_MAX);
      if (!ordered.length) return null;
      return {
        dateKey: dateKey,
        contracts: ordered.map((c) =>
          normalizeDailyContract(
            Object.assign({}, c, {
              rarity: c.rarity || "common",
              templateId: c.templateId || "finish_c"
            })
          )
        ).filter(Boolean)
      };
    }

    function generateDailyContractsBoard(dateKey) {
      const slotWeights =
        typeof CONTRACT_SLOT_RARITY_WEIGHTS !== "undefined" &&
        Array.isArray(CONTRACT_SLOT_RARITY_WEIGHTS)
          ? CONTRACT_SLOT_RARITY_WEIGHTS
          : [{ common: 70, rare: 30 }, { common: 35, rare: 45, epic: 20 }, { rare: 55, epic: 35, legendary: 10 }];
      const want = CONTRACT_ACTIVE_MAX;
      const templates = getContractTemplates();
      const usedTemplates = {};
      const usedTypes = {};
      const contracts = [];

      for (let slot = 0; slot < want; slot++) {
        const weights = slotWeights[slot] || slotWeights[slotWeights.length - 1] || { common: 100 };
        let created = null;
        for (let attempt = 0; attempt < 24 && !created; attempt++) {
          const rarity = pickWeightedKey(weights);
          let pool = templates.filter(
            (t) =>
              t.rarity === rarity &&
              !usedTemplates[t.id] &&
              !usedTypes[t.type] &&
              isContractTemplateEligible(t)
          );
          if (!pool.length) {
            pool = templates.filter(
              (t) =>
                t.rarity === rarity &&
                !usedTemplates[t.id] &&
                isContractTemplateEligible(t)
            );
          }
          if (!pool.length) {
            pool = templates.filter(
              (t) => !usedTemplates[t.id] && isContractTemplateEligible(t)
            );
          }
          if (!pool.length) break;
          const tpl = pool[Math.floor(Math.random() * pool.length)];
          created = createDailyContractFromTemplate(tpl, rarity);
          if (created) {
            usedTemplates[tpl.id] = true;
            usedTypes[tpl.type] = true;
            contracts.push(created);
          }
        }
        if (!created) {
          const fallback = templates.find(
            (t) => !usedTemplates[t.id] && isContractTemplateEligible(t)
          );
          if (fallback) {
            const c = createDailyContractFromTemplate(fallback, fallback.rarity || "common");
            if (c) {
              usedTemplates[fallback.id] = true;
              contracts.push(c);
            }
          }
        }
      }
      return { dateKey: dateKey, contracts: contracts.slice(0, want) };
    }

    function syncContractsMirror(exp) {
      const e = exp || ensureExpeditionState();
      if (!e.dailyContracts || typeof e.dailyContracts !== "object") {
        e.dailyContracts = { dateKey: null, contracts: [] };
      }
      if (!Array.isArray(e.dailyContracts.contracts)) e.dailyContracts.contracts = [];
      e.contracts = e.dailyContracts.contracts;
      return e.dailyContracts.contracts;
    }

    /**
     * Garantit le tableau quotidien. force=true régénère (DEV / testDate).
     * testDate: Date | timestamp | "YYYY-MM-DD"
     */
    function ensureDailyContracts(force, testDate) {
      const exp = ensureExpeditionState();
      if (!exp.dailyContracts || typeof exp.dailyContracts !== "object") {
        exp.dailyContracts = { dateKey: null, contracts: [] };
      }
      if (!exp.systemUnlocked && !force) {
        syncContractsMirror(exp);
        return exp.dailyContracts.contracts;
      }
      let dateKey;
      if (typeof testDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(testDate)) {
        dateKey = testDate;
      } else if (testDate != null) {
        dateKey = getContractDateKey(testDate);
      } else {
        dateKey = getContractDateKey(Date.now());
      }

      if (!exp.dailyContracts || typeof exp.dailyContracts !== "object") {
        exp.dailyContracts = { dateKey: null, contracts: [] };
      }

      const hasBoard =
        exp.dailyContracts.dateKey === dateKey &&
        Array.isArray(exp.dailyContracts.contracts) &&
        exp.dailyContracts.contracts.length > 0;

      if (!force && hasBoard) {
        exp.dailyContracts.contracts = exp.dailyContracts.contracts
          .map(normalizeDailyContract)
          .filter(Boolean);
        syncContractsMirror(exp);
        return exp.dailyContracts.contracts;
      }

      /* Migration V1 → premier tableau du jour (préserve ready non claim) */
      if (
        !force &&
        !hasBoard &&
        (!exp.dailyContracts.dateKey || !exp.dailyContracts.contracts.length) &&
        Array.isArray(exp.contracts) &&
        exp.contracts.length
      ) {
        const migrated = migrateV1ContractsToDaily(exp, dateKey);
        if (migrated && migrated.contracts.length) {
          while (migrated.contracts.length < CONTRACT_ACTIVE_MAX) {
            const board = generateDailyContractsBoard(dateKey);
            const used = {};
            migrated.contracts.forEach((c) => {
              if (c.templateId) used[c.templateId] = true;
              if (c.type) used["type:" + c.type] = true;
            });
            const filler = (board.contracts || []).find(
              (c) => c && !used[c.templateId] && !used["type:" + c.type]
            );
            if (!filler) break;
            migrated.contracts.push(filler);
          }
          exp.dailyContracts = {
            dateKey: dateKey,
            contracts: migrated.contracts.slice(0, CONTRACT_ACTIVE_MAX)
          };
          syncContractsMirror(exp);
          return exp.dailyContracts.contracts;
        }
      }

      exp.dailyContracts = generateDailyContractsBoard(dateKey);
      syncContractsMirror(exp);
      return exp.dailyContracts.contracts;
    }

    /** Alias compat — ne remplit plus à l'infini après claim. */
    function ensureActiveContracts() {
      return ensureDailyContracts(false);
    }

    function checkDailyContractsRollover() {
      const exp = ensureExpeditionState();
      if (!exp.systemUnlocked) return false;
      const today = getContractDateKey(Date.now());
      if (
        exp.dailyContracts &&
        exp.dailyContracts.dateKey === today &&
        Array.isArray(exp.dailyContracts.contracts) &&
        exp.dailyContracts.contracts.length
      ) {
        return false;
      }
      ensureDailyContracts(false);
      saveGame(true);
      updateExpeditionHubBadges();
      if (document.getElementById("panel-expedition-contracts")?.classList.contains("active")) {
        renderExpeditionContractsPanel();
      }
      return true;
    }

    function countClaimableContracts() {
      const exp = ensureExpeditionState();
      const list =
        (exp.dailyContracts && exp.dailyContracts.contracts) || exp.contracts || [];
      return list.filter((c) => c && c.status === "ready" && !c.claimed).length;
    }

    function runMatchesContract(run, contract) {
      if (!run || !contract || contract.claimed) return false;
      if (contract.status === "ready" || contract.status === "claimed") return false;
      const def = getExpeditionDef(run.expeditionId);
      if (contract.type === "finish") return true;
      if (contract.type === "favorable") {
        const fav =
          typeof CONTRACT_FAVORABLE_CHANCE === "number" ? CONTRACT_FAVORABLE_CHANCE : 0.8;
        return safeNumber(run.successChance, 0) >= fav;
      }
      if (contract.type === "meet_power") {
        return safeNumber(run.teamPower, 0) >= safeNumber(run.recommendedPower, 1);
      }
      if (contract.type === "domination") {
        const rec = Math.max(1, safeNumber(run.recommendedPower, 1));
        const ratio = safeNumber(contract.dominationRatio, 1.25);
        return safeNumber(run.teamPower, 0) >= rec * ratio;
      }
      if (contract.type === "zone") {
        const z = run.zoneId || (def && def.zoneId);
        return !!contract.zoneId && z === contract.zoneId;
      }
      if (contract.type === "full_party") {
        return Array.isArray(run.dragonIds) && run.dragonIds.length >= 3;
      }
      if (contract.type === "rarity_team") {
        const need = CONTRACT_RARITY_RANK[contract.minDragonRarity] || 2;
        return (run.dragonIds || []).some((id) => {
          const d = getDragonDef(id);
          return d && (CONTRACT_RARITY_RANK[d.rarity] || 0) >= need;
        });
      }
      if (contract.type === "long_duration") {
        const dur = safeNumber(
          run.durationMs,
          def ? safeNumber(def.durationMs, 0) : 0
        );
        return dur >= safeNumber(contract.minDurationMs, 0);
      }
      return false;
    }

    function onExpeditionCompleted(run) {
      if (!run || !run.id) return;
      const exp = ensureExpeditionState();
      if (exp.contractProcessedRuns[run.id]) {
        maybeDiscoverThreatFromRun(run);
        return;
      }
      exp.contractProcessedRuns[run.id] = 1;
      ensureDailyContracts(false);
      const list =
        (exp.dailyContracts && exp.dailyContracts.contracts) || exp.contracts || [];
      list.forEach((c) => {
        if (!c || c.claimed || c.status === "ready" || c.status === "claimed") return;
        if (!runMatchesContract(run, c)) return;
        c.progress = Math.min(c.target, safeNumber(c.progress, 0) + 1);
        if (c.progress >= c.target) {
          c.progress = c.target;
          c.status = "ready";
        }
      });
      syncContractsMirror(exp);
      maybeDiscoverThreatFromRun(run);
      updateExpeditionHubBadges();
    }

    function grantContractReward(reward) {
      if (!reward) return "Récompense";
      if (reward.kind === "chest") {
        const zoneId = reward.zoneId || getCurrentZone().id || "sanctuary";
        const type = CHEST_TYPES[reward.chestType] ? reward.chestType : "draconic";
        addChest(zoneId, type, 1);
        const chestDef = CHEST_TYPES[type];
        return chestDef ? chestDef.name : "Coffre";
      }
      if (reward.kind === "essence") {
        const amt = Math.max(0, Math.floor(safeNumber(reward.amount, 0)));
        if (amt > 0) addPower(amt, "expedition");
        return formatNumber(amt) + " Essence";
      }
      if (reward.kind === "fragments") {
        const amt = Math.max(1, Math.floor(safeNumber(reward.amount, 1)));
        const owned = DRAGON_DEFS.filter((d) =>
          !d.secret && isDragonDiscovered(gameState.dragons[d.id], d.id, gameState)
        );
        let given = 0;
        for (let i = 0; i < amt; i++) {
          if (!owned.length) break;
          const d = owned[Math.floor(Math.random() * owned.length)];
          grantDragonFragments(d.id, 1);
          given++;
        }
        return given ? ("+" + given + " fragments") : "Aucun fragment";
      }
      return "Récompense";
    }

    function claimContract(contractId) {
      const exp = ensureExpeditionState();
      ensureDailyContracts(false);
      const list =
        (exp.dailyContracts && exp.dailyContracts.contracts) || exp.contracts || [];
      const c = list.find((x) => x && x.id === contractId);
      if (!c) return { ok: false, reason: "missing" };
      if (c.claimed || c.status === "claimed") return { ok: false, reason: "already_claimed" };
      if (c.status !== "ready") return { ok: false, reason: "not_ready" };
      c.claimed = true;
      c.status = "claimed";
      const label = grantContractReward(c.reward);
      syncContractsMirror(exp);
      saveGame(true);
      updateExpeditionHubBadges();
      showNotification("📜 Contrat accompli", label);
      playSound("buy");
      return { ok: true, rewardLabel: label };
    }

    /** DEV — forcer un tableau pour une date (sans changer l'horloge système). */
    function generateDailyContractsForDev(testDate) {
      const board = ensureDailyContracts(true, testDate);
      saveGame(true);
      updateExpeditionHubBadges();
      if (document.getElementById("panel-expedition-contracts")?.classList.contains("active")) {
        renderExpeditionContractsPanel();
      }
      return board;
    }

    function scaleThreatRewardConfig(cfg, mult) {
      const src = cfg || {};
      const m = Math.max(1, safeNumber(mult, THREAT_REWARD_MULT));
      const out = Object.assign({}, src);
      out.powerMin = Math.max(1, Math.floor(safeNumber(src.powerMin, 0) * m));
      out.powerMax = Math.max(out.powerMin, Math.floor(safeNumber(src.powerMax, 0) * m));
      out.fragmentChance = Math.min(1, safeNumber(src.fragmentChance, 0) * Math.min(1.35, m * 0.85));
      out.fragmentMin = Math.max(0, Math.floor(safeNumber(src.fragmentMin, 0)));
      out.fragmentMax = Math.max(
        out.fragmentMin,
        Math.floor(safeNumber(src.fragmentMax, 0) * (m > 1 ? 1.25 : 1))
      );
      out.rareChance = Math.min(1, safeNumber(src.rareChance, 0) * m);
      out.rarePowerMin = Math.floor(safeNumber(src.rarePowerMin, 0) * m);
      out.rarePowerMax = Math.floor(safeNumber(src.rarePowerMax, 0) * m);
      out.chestChance = Math.min(1, Math.max(safeNumber(src.chestChance, 0.55), 0.75));
      const w = src.chestWeights || { draconic: 70, rare: 25, epic: 5 };
      let draconic = Math.max(0, safeNumber(w.draconic, 70) - 15);
      let rare = Math.max(0, safeNumber(w.rare, 25) + 10);
      let epic = Math.max(0, safeNumber(w.epic, 5) + 5);
      const sum = draconic + rare + epic || 1;
      out.chestWeights = {
        draconic: Math.round((draconic / sum) * 100),
        rare: Math.round((rare / sum) * 100),
        epic: Math.max(0, 100 - Math.round((draconic / sum) * 100) - Math.round((rare / sum) * 100))
      };
      return out;
    }

    function buildThreatExpeditionDef(threat) {
      if (!threat) return null;
      return {
        id: threat.id,
        zoneId: threat.zoneId,
        name: threat.name,
        image: threat.image,
        description: threat.description || "Une menace dangereuse rôde dans la région.",
        durationMs: threat.durationMs,
        recommendedPower: threat.recommendedPower,
        rewardPreview: threat.rewardPreview || "Récompenses améliorées",
        rewardConfig: threat.rewardConfig || {},
        requirements: {},
        isThreat: true
      };
    }

    function createThreatFromSourceRun(run) {
      const source = getExpeditionDef(run.expeditionId);
      if (!source || source.isThreat) return null;
      const zoneId = run.zoneId || source.zoneId || "sanctuary";
      const zoneName = getExpeditionZoneLabel(zoneId);
      const rec = Math.max(
        100,
        Math.round(safeNumber(source.recommendedPower, 500) * THREAT_POWER_MULT)
      );
      let durationMs = Math.round(safeNumber(source.durationMs, 600000) * THREAT_DURATION_MULT);
      durationMs = Math.max(THREAT_DURATION_MIN_MS, Math.min(THREAT_DURATION_MAX_MS, durationMs));
      return {
        id: "threat_" + source.id + "_" + (run.id || Date.now()),
        name: "Menace — " + zoneName,
        zoneId: zoneId,
        sourceExpeditionId: source.id,
        recommendedPower: rec,
        durationMs: durationMs,
        image: source.image || "",
        description:
          "Une créature dangereuse a été détectée après vos explorations en " + zoneName + ".",
        rewardPreview: "Butin amélioré · coffres renforcés",
        rewardConfig: scaleThreatRewardConfig(source.rewardConfig, THREAT_REWARD_MULT),
        state: "detected",
        runId: null
      };
    }

    function maybeDiscoverThreatFromRun(run) {
      const exp = ensureExpeditionState();
      if (!run || !run.id) return;
      if (exp.threatRolledRuns[run.id]) return;
      exp.threatRolledRuns[run.id] = 1;
      if (exp.activeThreat) return;
      if (run.isThreat) return;
      const result = run.result || {};
      if (!result.success) return;
      if (Math.random() >= THREAT_DISCOVERY_CHANCE) return;
      const threat = createThreatFromSourceRun(run);
      if (!threat) return;
      exp.activeThreat = threat;
      showNotification("⚠️ Menace détectée", threat.name + " — consultez Menaces.");
      playSound("expeditionComplete");
      updateExpeditionHubBadges();
    }

    function getActiveThreat() {
      const exp = ensureExpeditionState();
      return exp.activeThreat || null;
    }

    function clearActiveThreat() {
      const exp = ensureExpeditionState();
      exp.activeThreat = null;
      updateExpeditionHubBadges();
    }

    function updateExpeditionHubBadges() {
      const claimable = countClaimableContracts();
      const cBadge = document.getElementById("exp-hub-contracts-badge");
      if (cBadge) {
        if (claimable > 0) {
          cBadge.hidden = false;
          cBadge.textContent = claimable > 9 ? "9+" : String(claimable);
          cBadge.setAttribute("aria-hidden", "false");
        } else {
          cBadge.hidden = true;
          cBadge.textContent = "";
          cBadge.setAttribute("aria-hidden", "true");
        }
      }
      const threat = getActiveThreat();
      const tBadge = document.getElementById("exp-hub-threats-badge");
      if (tBadge) {
        if (threat) {
          tBadge.hidden = false;
          tBadge.textContent = "!";
          tBadge.setAttribute("aria-hidden", "false");
        } else {
          tBadge.hidden = true;
          tBadge.textContent = "";
          tBadge.setAttribute("aria-hidden", "true");
        }
      }
    }

    function makeSeededRng(seed) {
      let s = (safeNumber(seed, 1) >>> 0) || 1;
      return function () {
        s = (Math.imul(1664525, s) + 1013904223) >>> 0;
        return s / 4294967296;
      };
    }

    function randomIntInclusive(rng, min, max) {
      min = Math.floor(min);
      max = Math.floor(max);
      if (max < min) {
        const t = min;
        min = max;
        max = t;
      }
      return min + Math.floor(rng() * (max - min + 1));
    }

    function calculateDragonExpeditionPower(dragonIdOrObj) {
      let def = null;
      let stars = 1;
      if (typeof dragonIdOrObj === "string") {
        def = getDragonDef(dragonIdOrObj);
        const entry = gameState.dragons[dragonIdOrObj];
        stars = Math.max(1, safeNumber(entry?.stars, 1));
      } else if (dragonIdOrObj && dragonIdOrObj.def) {
        def = dragonIdOrObj.def;
        stars = Math.max(1, safeNumber(dragonIdOrObj.stars, 1));
      } else if (dragonIdOrObj && dragonIdOrObj.id) {
        def = dragonIdOrObj;
        stars = 1;
      }
      if (!def) return 0;
      const base = EXPEDITION_BASE_POWER[def.rarity] || EXPEDITION_BASE_POWER.common;
      const mult = EXPEDITION_STAR_MULT[Math.min(MAX_DRAGON_STARS, stars)] || 1;
      return Math.floor(base * mult);
    }

    function calculateExpeditionTeamPower(dragonIds) {
      return (dragonIds || []).reduce((sum, id) => sum + calculateDragonExpeditionPower(id), 0);
    }

    /**
     * Puissance effective pour qualité de coffre / futur système d'affinités.
     * Pour l'instant : aucune affinité — effective = baseTeamPower.
     */
    function getEffectiveExpeditionPower(baseTeamPower, _dragonIds) {
      const base = Math.max(0, safeNumber(baseTeamPower, 0));
      /* Futur : base + affinityBonus(dragonIds, expedition) */
      const affinityBonus = 0;
      return base + affinityBonus;
    }

    function getExpeditionPowerRatio(teamPower, recommendedPower) {
      const rec = Math.max(1, safeNumber(recommendedPower, 1));
      const effective = getEffectiveExpeditionPower(teamPower);
      /* Cap absolu à 200 % — un ratio 500 % = même bonus que 200 %. */
      return Math.min(2, effective / rec);
    }

    function getChestQualityLabel(teamPower, recommendedPower) {
      const ratio = getExpeditionPowerRatio(teamPower, recommendedPower);
      if (ratio < 0.75) return "Faible";
      if (ratio < 1.00) return "Réduite";
      if (ratio < 1.25) return "Normale";
      if (ratio < 1.50) return "Améliorée";
      if (ratio < 2.00) return "Très améliorée";
      return "Maximale";
    }

    /**
     * Ajuste les poids de rareté de coffre selon powerRatio (cap 2.0).
     * Garantit draconic + rare + epic = 100, sans négatif.
     */
    function getAdjustedChestRarityChances(baseWeights, teamPower, recommendedPower) {
      const base = baseWeights || {};
      let draconic = Math.max(0, safeNumber(base.draconic, 0));
      let rare = Math.max(0, safeNumber(base.rare, 0));
      let epic = Math.max(0, safeNumber(base.epic, 0));
      const startSum = draconic + rare + epic;
      if (startSum <= 0) return { draconic: 100, rare: 0, epic: 0 };

      const ratio = getExpeditionPowerRatio(teamPower, recommendedPower);
      let rareDelta = 0;
      let epicDelta = 0;
      if (ratio < 0.75) {
        rareDelta = -5;
        epicDelta = -1;
      } else if (ratio < 1.00) {
        rareDelta = -2;
        epicDelta = -1;
      } else if (ratio < 1.25) {
        rareDelta = 0;
        epicDelta = 0;
      } else if (ratio < 1.50) {
        rareDelta = 3;
        epicDelta = 1;
      } else if (ratio < 2.00) {
        rareDelta = 6;
        epicDelta = 2;
      } else {
        rareDelta = 10;
        epicDelta = 4;
      }

      const newRare = Math.max(0, rare + rareDelta);
      const newEpic = Math.max(0, epic + epicDelta);
      const actualRareDelta = newRare - rare;
      const actualEpicDelta = newEpic - epic;
      rare = newRare;
      epic = newEpic;
      draconic = Math.max(0, draconic - (actualRareDelta + actualEpicDelta));

      let sum = draconic + rare + epic;
      if (sum <= 0) return { draconic: 100, rare: 0, epic: 0 };
      if (sum !== 100) {
        /* Renormalise au cas où un clamp a cassé le total. */
        draconic = Math.round((draconic / sum) * 100);
        rare = Math.round((rare / sum) * 100);
        epic = Math.max(0, 100 - draconic - rare);
      }
      return { draconic: draconic, rare: rare, epic: epic };
    }

    function calculateSuccessChance(teamPower, recommendedPower) {
      const rec = Math.max(1, safeNumber(recommendedPower, 1));
      const ratio = safeNumber(teamPower, 0) / rec;
      if (ratio >= 1) return 1;
      if (ratio >= 0.75) return 0.8;
      if (ratio >= 0.5) return 0.6;
      return 0.4;
    }

    function getExpeditionRewardBonus(dragonIds) {
      const ids = dragonIds || [];
      if (!ids.length) return 0;
      let sum = 0;
      ids.forEach((id) => {
        const def = getDragonDef(id);
        const entry = gameState.dragons[id];
        if (!def) return;
        const stars = Math.max(1, safeNumber(entry?.stars, 1));
        sum += EXPEDITION_RARITY_REWARD_BONUS[def.rarity] || 0;
        sum += EXPEDITION_STAR_REWARD_BONUS[Math.min(MAX_DRAGON_STARS, stars)] || 0;
      });
      return sum / ids.length;
    }

    function calculateExpeditionRewards(def, dragonIds, success, rng) {
      const cfg = def.rewardConfig || {};
      const partyBonus = getExpeditionRewardBonus(dragonIds);
      /* Vaelgor team bonus (equipped, not on expedition) */
      const teamExpBonus = safeNumber(gameState.multipliers?.expeditionReward, 0);
      const bonus = partyBonus + teamExpBonus;
      let power = randomIntInclusive(rng, cfg.powerMin || 0, cfg.powerMax || 0);
      power = Math.floor(power * (1 + bonus));

      const fragments = [];
      let rarePower = 0;
      const fragChance = safeNumber(cfg.fragmentChance, 0) * (success ? 1 : 0.35);
      const fragMax = Math.max(0, Math.floor(safeNumber(cfg.fragmentMax, 0)));
      if (fragMax > 0 && rng() < fragChance) {
        let amount = randomIntInclusive(rng, cfg.fragmentMin || 1, fragMax);
        amount = Math.max(1, Math.floor(amount * (1 + bonus)));
        if (!success) amount = Math.max(1, Math.floor(amount * 0.35));
        /* Zone 1 : 0 ou 1 fragment direct max, jamais multiplié au-delà. */
        if (fragMax <= 1) amount = 1;

        let pick = null;
        if ((def.zoneId || "sanctuary") === "sanctuary") {
          /* Zone 1 : dragon découvert de la zone, hors mythique (poids 0). */
          const eligible = getEligibleChestDragons(def.zoneId || "sanctuary");
          pick = eligible.length ? pickChestFragmentDragon(eligible, rng) : null;
        } else if (dragonIds.length) {
          pick = dragonIds[Math.floor(rng() * dragonIds.length)];
          if (!getDragonDef(pick) || !isDragonDiscovered(gameState.dragons[pick], pick, gameState)) {
            pick = null;
          }
        }
        if (pick) fragments.push({ dragonId: pick, amount: amount });
      }

      const rareChance = safeNumber(cfg.rareChance, 0) * (success ? 1 : 0.15);
      if (rareChance > 0 && rng() < rareChance) {
        rarePower = randomIntInclusive(rng, cfg.rarePowerMin || 0, cfg.rarePowerMax || 0);
        rarePower = Math.floor(rarePower * (1 + bonus * 0.5));
        if (!success) rarePower = Math.floor(rarePower * 0.25);
      }

      if (!success) {
        const consol = 0.2 + rng() * 0.1;
        power = Math.max(1, Math.floor(power * consol));
      }

      return {
        success: !!success,
        power: Math.max(0, power),
        rarePower: Math.max(0, rarePower),
        fragments
      };
    }

    function getActiveExpeditionRuns(state) {
      const exp = ensureExpeditionState(state || gameState);
      const out = [];
      for (let i = 0; i < exp.unlockedSlots; i++) {
        const run = exp.slots[i];
        if (run && !run.claimed) out.push({ slotIndex: i, run });
      }
      return out;
    }

    function getBusyExpeditionRun() {
      const list = getActiveExpeditionRuns();
      return list.length ? list[0] : null;
    }

    function hasFreeExpeditionSlot() {
      const exp = ensureExpeditionState();
      for (let i = 0; i < exp.unlockedSlots; i++) {
        if (!exp.slots[i] || exp.slots[i].claimed) return true;
      }
      return false;
    }

    function isDragonOnExpedition(dragonId, state) {
      return getActiveExpeditionRuns(state).some(({ run }) =>
        Array.isArray(run.dragonIds) && run.dragonIds.indexOf(dragonId) !== -1
      );
    }

    function isDragonOnActiveTeam(dragonId, state) {
      const st = state || gameState;
      const team = Array.isArray(st.team) ? st.team : [];
      return team.indexOf(dragonId) !== -1;
    }

    function getDragonAvailability(dragonId, state) {
      if (isDragonOnExpedition(dragonId, state)) return "EXPEDITION";
      if (isDragonOnActiveTeam(dragonId, state)) return "ACTIVE_TEAM";
      return "AVAILABLE";
    }

    function isDragonAvailableForExpedition(dragonId) {
      const entry = gameState.dragons[dragonId];
      if (!isDragonDiscovered(entry, dragonId, gameState)) return false;
      return getDragonAvailability(dragonId) === "AVAILABLE";
    }

    function getExpeditionRemainingTime(run) {
      if (!run) return 0;
      return Math.max(0, safeNumber(run.endTime, 0) - Date.now());
    }

    function resolveExpeditionIfDue(run) {
      if (!run || run.claimed || run.resolved) return false;
      if (Date.now() < safeNumber(run.endTime, 0)) return false;
      const def = getExpeditionDef(run.expeditionId);
      if (!def) {
        run.resolved = true;
        run.result = { success: false, power: 0, rarePower: 0, fragments: [] };
        return true;
      }
      const rng = makeSeededRng(run.seed);
      const success = rng() < safeNumber(run.successChance, 0.4);
      run.result = calculateExpeditionRewards(def, run.dragonIds || [], success, rng);
      run.result.chest = rollExpeditionChest(def, safeNumber(run.teamPower, 0), rng);
      run.resolved = true;
      run.status = "ready";
      if (!run.notifiedComplete) {
        run.notifiedComplete = true;
        showNotification("🧭 Expédition terminée", def.name + " — Récompenses disponibles !");
        playSound("expeditionComplete");
      }
      return true;
    }

    function tickExpeditions() {
      ensureExpeditionState();
      checkDailyContractsRollover();
      if (document.getElementById("panel-expedition-contracts")?.classList.contains("active")) {
        updateContractsCountdownUi();
      }
      let changed = false;
      const activeRuns = getActiveExpeditionRuns();
      for (let i = 0; i < activeRuns.length; i++) {
        if (resolveExpeditionIfDue(activeRuns[i].run)) changed = true;
      }
      if (changed) {
        expeditionsDirty = true;
        dragonsDirty = true;
        renderTeamModule();
        saveGame(true);
      }
      const busy = getBusyExpeditionRun();
      if (!busy) {
        updateExpeditionButtonIndicator();
        return;
      }
      if (!busy.run.resolved) {
        const timerEl = document.getElementById("expedition-timer");
        if (timerEl) {
          timerEl.textContent = formatCountdown(getExpeditionRemainingTime(busy.run));
        }
        if (isExpeditionDrawerOpen()) {
          const cardTimer = document.querySelector(".expedition-card.is-running .exp-card-timer");
          const cardFill = document.querySelector(".expedition-card.is-running .expedition-card-progress-fill");
          if (cardTimer || cardFill) {
            const remaining = getExpeditionRemainingTime(busy.run);
            const def = getExpeditionDef(busy.run.expeditionId);
            const total = Math.max(1, safeNumber(busy.run.durationMs, def?.durationMs || 1));
            const elapsed = Math.max(0, total - remaining);
            const pct = Math.max(0, Math.min(100, (elapsed / total) * 100));
            if (cardTimer) cardTimer.textContent = formatCountdown(remaining) + " restantes";
            if (cardFill) cardFill.style.width = pct.toFixed(1) + "%";
          }
        }
      }
      updateExpeditionButtonIndicator();
    }

    function areExpeditionsUnlocked(state) {
      const st = state || gameState;
      const exp = ensureExpeditionState(st);
      return !!exp.systemUnlocked;
    }

    function buyExpeditionCamp() {
      if (buyingLock) return false;
      if (areExpeditionsUnlocked()) return true;
      const cost = EXPEDITION_CAMP_COST;
      if (safeNumber(gameState.dragonEssence, 0) < cost) {
        showNotification("⛺ Camp d'expédition", "Il faut " + formatNumber(cost) + " Essence.");
        playSound("error");
        return false;
      }
      if (!spendEssence(cost, { zoneId: "sanctuary" })) return false;
      buyingLock = true;
      try {
        if (!gameState.specialUpgrades[EXPEDITION_CAMP_ID]) {
          gameState.specialUpgrades[EXPEDITION_CAMP_ID] = { bought: false };
        }
        gameState.specialUpgrades[EXPEDITION_CAMP_ID].bought = true;
        ensureExpeditionState().systemUnlocked = true;
        expeditionsDirty = true;
        upgradesDirty = true;
        uiDirty = true;
        showNotification("⛺ Camp d'expédition", "Expéditions débloquées !");
        playSound("buy");
        saveGame(true);
        renderExpeditions();
        updateExpeditionButtonIndicator();
        return true;
      } finally {
        buyingLock = false;
      }
    }

    function getExpeditionHudState() {
      ensureExpeditionState();
      if (!areExpeditionsUnlocked()) {
        return {
          kind: "locked",
          cost: EXPEDITION_CAMP_COST,
          canAfford: safeNumber(gameState.dragonEssence, 0) >= EXPEDITION_CAMP_COST
        };
      }
      const busy = getBusyExpeditionRun();
      if (!busy) return { kind: "idle" };
      if (busy.run.resolved && !busy.run.claimed) return { kind: "claim" };
      if (!busy.run.resolved) {
        return { kind: "running", remaining: getExpeditionRemainingTime(busy.run) };
      }
      return { kind: "idle" };
    }

    function updateExpeditionButtonIndicator() {
      const state = getExpeditionHudState();
      const locked = state.kind === "locked";
      let statusText = "";
      if (locked) statusText = formatNumber(state.cost) + " 💎";
      else if (state.kind === "running") statusText = formatCountdown(state.remaining);
      else if (state.kind === "claim") statusText = "Récompense";
      const hudKey = state.kind + "|" + statusText;
      if (hudKey === lastExpeditionHudKey) return;
      lastExpeditionHudKey = hudKey;

      const statusEl = document.getElementById("expedition-btn-status");
      const badge = document.getElementById("expedition-btn-badge");
      const btn = document.getElementById("btn-open-expeditions-hub");

      if (statusEl) {
        if (locked || state.kind === "running" || state.kind === "claim") {
          statusEl.hidden = false;
          statusEl.textContent = statusText;
        } else {
          statusEl.hidden = true;
          statusEl.textContent = "";
        }
      }
      if (badge) {
        const showClaim = !locked && state.kind === "claim";
        badge.hidden = !showClaim;
        badge.setAttribute("aria-hidden", showClaim ? "false" : "true");
      }
      if (btn) {
        btn.classList.toggle("has-claim", !locked && state.kind === "claim");
        btn.classList.toggle("is-running", !locked && state.kind === "running");
        btn.title = locked
          ? "Expéditions — Camp à débloquer (" + formatNumber(state.cost) + " Essence)"
          : "Expéditions";
      }
    }

    function isExpeditionsHubOpen() {
      const panel = document.getElementById("panel-expeditions-hub");
      return !!(panel && panel.classList.contains("active"));
    }

    const EXPEDITIONS_HUB_HALL_IMAGE = "assets/expedition/Hall des expedition.png";
    let expeditionsHubHallPreloadStarted = false;

    function preloadExpeditionsHubHallImage() {
      if (expeditionsHubHallPreloadStarted) return;
      expeditionsHubHallPreloadStarted = true;
      if (window.DCAssets && typeof DCAssets.preloadIdle === "function") {
        DCAssets.preloadIdle([EXPEDITIONS_HUB_HALL_IMAGE]);
        return;
      }
      const img = new Image();
      img.decoding = "async";
      img.src = EXPEDITIONS_HUB_HALL_IMAGE;
    }

    let menuBackdropHold = false;

    function isMainMenuOverlayOpen() {
      /*
        Stack Expéditions (Hub / Hall / Contrats / Menaces / Préparation) :
        panneau bleu nuit opaque — PAS de voile / blur extérieur.
        L’overlay panel (fond transparent) continue de bloquer les clics.
      */
      if (document.querySelector(".expedition-drawer.open")) return false;
      if (document.querySelector("#panel-expeditions-hub.active")) return false;
      if (document.querySelector("#panel-expedition-contracts.active")) return false;
      if (document.querySelector("#panel-expedition-threats.active")) return false;
      if (document.querySelector("#panel-inventory.active")) return false;
      /* Transition Hall → Hub : ne pas flash un backdrop */
      if (menuBackdropHold) return false;
      if (document.querySelector(".panel.overlay-panel.active")) return true;
      return false;
    }

    /**
     * État UI partagé — vrai tant qu’on est dans le système Expéditions
     * (Hub / Hall / Préparation / Contrats / Menaces), y compris transitions.
     * Sert surtout à masquer le HUD mobile (évite le flash Hall←→Hub).
     */
    function isExpeditionUiOpen() {
      if (menuBackdropHold) return true;
      if (document.querySelector(".expedition-drawer.open")) return true;
      if (document.querySelector("#panel-expeditions-hub.active")) return true;
      if (document.querySelector("#panel-expedition-contracts.active")) return true;
      if (document.querySelector("#panel-expedition-threats.active")) return true;
      return false;
    }

    function updateExpeditionUiOpenState() {
      const open = isExpeditionUiOpen();
      document.documentElement.classList.toggle("expedition-ui-open", open);
      document.documentElement.setAttribute("data-expedition-ui", open ? "1" : "0");
    }

    function updateMenuBackdrop() {
      const el = document.getElementById("dc-menu-backdrop");
      if (el) {
        const open = isMainMenuOverlayOpen();
        el.classList.toggle("is-visible", open);
        el.setAttribute("aria-hidden", open ? "false" : "true");
        document.documentElement.classList.toggle("dc-menu-backdrop-open", open);
      }
      updateExpeditionUiOpenState();
    }

    function openExpeditionsHub() {
      expeditionReturnToHub = false;
      expeditionReturnTarget = null;
      preloadExpeditionsHubHallImage();
      playSound("button");
      ensureExpeditionState();
      ensureDailyContracts(false);
      switchPanel("expeditions-hub");
      const btn = document.getElementById("btn-open-expeditions-hub");
      if (btn) btn.setAttribute("aria-expanded", "true");
      updateExpeditionButtonIndicator();
      updateExpeditionHubBadges();
      updateMenuBackdrop();
    }

    function closeExpeditionsHub() {
      const btn = document.getElementById("btn-open-expeditions-hub");
      if (btn) btn.setAttribute("aria-expanded", "false");
      if (isExpeditionsHubOpen()) switchPanel("kingdom");
      updateMenuBackdrop();
    }

    function isInventoryPanelOpen() {
      const panel = document.getElementById("panel-inventory");
      return !!(panel && panel.classList.contains("active"));
    }

    /* Session only — pas persisté en save */
    let inventorySessionTab = "materials";

    function openInventoryPanel() {
      playSound("button");
      ensureInventory();
      ensureChestInventory();
      switchPanel("inventory");
      const btn = document.getElementById("btn-open-inventory");
      if (btn) btn.setAttribute("aria-expanded", "true");
      syncInventoryTabsUi();
      renderInventoryPanel();
      updateInventoryBadge();
      updateMenuBackdrop();
    }

    function closeInventoryPanel() {
      const btn = document.getElementById("btn-open-inventory");
      if (btn) btn.setAttribute("aria-expanded", "false");
      if (isInventoryPanelOpen()) switchPanel("kingdom");
      updateMenuBackdrop();
    }

    function openExpeditionHallFromHub() {
      expeditionReturnToHub = true;
      expeditionReturnTarget = "hub";
      playSound("button");
      /* Ouvrir le Hall avant de quitter le Hub → backdrop stable, pas de flash */
      openExpeditionDrawer({ fromHub: true, silent: true });
      switchPanel("kingdom");
      updateMenuBackdrop();
    }

    function openExpeditionContractsPanel() {
      playSound("button");
      if (!areExpeditionsUnlocked()) {
        showNotification("Contrats", "Débloquez d'abord le Camp d'expédition.");
        return;
      }
      ensureExpeditionState();
      ensureDailyContracts(false);
      switchPanel("expedition-contracts");
      renderExpeditionContractsPanel();
      updateExpeditionHubBadges();
      updateMenuBackdrop();
    }

    function openExpeditionThreatsPanel() {
      playSound("button");
      if (!areExpeditionsUnlocked()) {
        showNotification("Menaces", "Débloquez d'abord le Camp d'expédition.");
        return;
      }
      ensureExpeditionState();
      switchPanel("expedition-threats");
      renderExpeditionThreatsPanel();
      updateExpeditionHubBadges();
      updateMenuBackdrop();
    }

    function returnToExpeditionsHubFromSubpanel() {
      openExpeditionsHub();
    }

    function prepareThreatFromMenu() {
      const threat = getActiveThreat();
      if (!threat) {
        showNotification("Menaces", "Aucune menace détectée.");
        return;
      }
      if (threat.state === "running") {
        showNotification("Menaces", "Cette menace est déjà en cours.");
        return;
      }
      if (!hasFreeExpeditionSlot()) {
        showNotification("Menaces", "Une équipe est déjà en expédition.");
        return;
      }
      expeditionReturnToHub = false;
      expeditionReturnTarget = "threats";
      /* Hold : Menaces → Préparation sans flash HUD mobile */
      menuBackdropHold = true;
      switchPanel("kingdom");
      openExpeditionDrawer({ silent: true });
      resetExpeditionPrepare(threat.id);
      updateExpeditionHallChrome();
      menuBackdropHold = false;
      updateMenuBackdrop();
    }

    function isExpeditionDrawerOpen() {
      const drawer = document.getElementById("expedition-drawer");
      return !!(drawer && drawer.classList.contains("open"));
    }

    function updateExpeditionHallSummary() {
      const el = document.getElementById("expedition-hall-summary");
      if (!el) return;
      if (!areExpeditionsUnlocked()) {
        el.hidden = true;
        el.innerHTML = "";
        return;
      }
      const exp = ensureExpeditionState();
      const slots = Math.max(1, safeNumber(exp.unlockedSlots, DEFAULT_EXPEDITION_SLOTS));
      const active = getActiveExpeditionRuns().length;
      el.hidden = false;
      el.innerHTML =
        '<span class="expedition-hall-summary-label">Équipes en expédition</span>' +
        '<strong class="expedition-hall-summary-value"></strong>';
      el.querySelector(".expedition-hall-summary-value").textContent = active + " / " + slots;
    }

    function openExpeditionDrawer(opts) {
      opts = opts || {};
      if (opts.fromHub) expeditionReturnToHub = true;
      const drawer = document.getElementById("expedition-drawer");
      if (!drawer) return;
      drawer.classList.add("open");
      drawer.setAttribute("aria-hidden", "false");
      const backBtn = document.getElementById("expedition-drawer-back");
      if (backBtn) backBtn.hidden = !expeditionReturnToHub;
      expeditionIntroAnimPending = true;
      expeditionsDirty = true;
      if (areExpeditionsUnlocked()) preloadExpeditionImagesForCurrentZone();
      renderExpeditions();
      updateExpeditionButtonIndicator();
      updateMenuBackdrop();
      if (!opts.silent) playSound("button");
    }

    function closeExpeditionDrawer(opts) {
      opts = opts || {};
      const drawer = document.getElementById("expedition-drawer");
      if (!drawer) return;
      const wasOpen = drawer.classList.contains("open");
      if (!wasOpen) {
        updateMenuBackdrop();
        return;
      }
      hideExpeditionRewardsTip(true);
      if (expeditionUi.mode === "prepare") {
        expeditionUi.mode = "list";
        expeditionUi.selectedExpeditionId = null;
        expeditionUi.selectedDragons = [];
        expeditionPreparePickerOpen = false;
      }
      const backToHub = wasOpen && expeditionReturnToHub && !opts.skipHubReturn;
      const backToThreats =
        wasOpen && expeditionReturnTarget === "threats" && !opts.skipHubReturn && !backToHub;
      if (wasOpen || opts.skipHubReturn) expeditionReturnToHub = false;
      const savedReturn = expeditionReturnTarget;
      if (wasOpen) expeditionReturnTarget = null;
      /* Hold pendant Hall → Hub (évite flash HUD / backdrop) ; ne pas écraser un hold externe */
      const holdTransition = backToHub || backToThreats;
      if (holdTransition) menuBackdropHold = true;
      drawer.classList.remove("open");
      drawer.setAttribute("aria-hidden", "true");
      drawer.classList.remove("is-prepare");
      const titleEl = document.querySelector(".expedition-hall-title");
      if (titleEl) titleEl.textContent = "Hall des Expéditions";
      updateExpeditionButtonIndicator();
      if (backToHub) openExpeditionsHub();
      else if (backToThreats || savedReturn === "threats") {
        /* X depuis prep menace : fermer sans rouvrir ; ← géré via leaveExpeditionPrepare */
      }
      if (holdTransition) menuBackdropHold = false;
      updateMenuBackdrop();
    }

    function toggleExpeditionDrawer() {
      if (isExpeditionDrawerOpen()) closeExpeditionDrawer({ skipHubReturn: true });
      else openExpeditionDrawer();
    }

    function startExpedition(expeditionId, dragonIds) {
      ensureExpeditionState();
      if (!areExpeditionsUnlocked()) return { ok: false, reason: "locked" };
      const def = getExpeditionDef(expeditionId);
      if (!def) return { ok: false, reason: "invalid" };
      /* Menaces : zone libre (chasse spéciale). Expéditions normales : zone courante. */
      if (!def.isThreat && def.zoneId && def.zoneId !== getCurrentZone().id) {
        return { ok: false, reason: "wrong_zone" };
      }
      if (!hasFreeExpeditionSlot()) return { ok: false, reason: "busy" };
      const ids = (dragonIds || []).slice();
      if (ids.length < EXPEDITION_PARTY_MIN || ids.length > EXPEDITION_PARTY_MAX) {
        return { ok: false, reason: "count" };
      }
      for (let i = 0; i < ids.length; i++) {
        if (!isDragonAvailableForExpedition(ids[i])) return { ok: false, reason: "unavailable" };
      }
      const unique = {};
      for (let i = 0; i < ids.length; i++) {
        if (unique[ids[i]]) return { ok: false, reason: "duplicate" };
        unique[ids[i]] = true;
      }

      const teamPower = calculateExpeditionTeamPower(ids);
      const successChance = calculateSuccessChance(teamPower, def.recommendedPower);
      const startTime = Date.now();
      const endTime = startTime + def.durationMs;
      const seed = (Math.floor(Math.random() * 0xffffffff) ^ startTime) >>> 0;

      const exp = gameState.expeditions;
      let slotIndex = -1;
      for (let i = 0; i < exp.unlockedSlots; i++) {
        if (!exp.slots[i] || exp.slots[i].claimed) {
          slotIndex = i;
          break;
        }
      }
      if (slotIndex < 0) return { ok: false, reason: "busy" };

      const runId = "run_" + startTime + "_" + slotIndex;
      exp.slots[slotIndex] = {
        id: runId,
        expeditionId: def.id,
        zoneId: def.zoneId,
        dragonIds: ids.slice(),
        startTime,
        endTime,
        durationMs: def.durationMs,
        teamPower,
        recommendedPower: def.recommendedPower,
        successChance,
        seed,
        status: "running",
        resolved: false,
        claimed: false,
        notifiedComplete: false,
        result: null,
        isThreat: !!def.isThreat
      };

      if (def.isThreat && exp.activeThreat && exp.activeThreat.id === def.id) {
        exp.activeThreat.state = "running";
        exp.activeThreat.runId = runId;
      }

      expeditionUi.mode = "list";
      expeditionUi.selectedExpeditionId = null;
      expeditionUi.selectedDragons = [];
      expeditionPreparePickerOpen = false;
      expeditionsDirty = true;
      dragonsDirty = true;
      uiDirty = true;
      saveGame(true);
      showNotification(
        def.isThreat ? "⚠️ Menace engagée !" : "🧭 Expédition lancée !",
        def.name + " — Retour dans " + formatDuration(def.durationMs) + "."
      );
      playSound("expeditionStart");
      const launchCard = document.querySelector('[data-expedition-id="' + expeditionId + '"]');
      if (launchCard && window.DCAnim && DCAnim.expeditionLaunchFx) {
        DCAnim.expeditionLaunchFx(launchCard);
      } else if (launchCard) {
        triggerAnim(launchCard, "anim-exp-launch", 420);
      }
      updateExpeditionHubBadges();
      return { ok: true, slotIndex };
    }

    function claimExpedition(slotIndex) {
      ensureExpeditionState();
      const exp = gameState.expeditions;
      const run = exp.slots[slotIndex];
      if (!run || run.claimed || run._claiming) return { ok: false, reason: "none" };
      resolveExpeditionIfDue(run);
      if (!run.resolved || !run.result) return { ok: false, reason: "not_ready" };

      /* Anti double-claim (double clic / re-entrant) */
      run._claiming = true;
      run.claimed = true;
      run.status = "claimed";

      const result = run.result;
      try {
        if (result.power > 0) addPower(result.power, "expedition");
        if (result.rarePower > 0) addPower(result.rarePower, "expedition");
        (result.fragments || []).forEach((f) => {
          grantDragonFragments(f.dragonId, Math.max(0, Math.floor(f.amount)));
        });
        const chestDrop = sanitizeExpeditionChest(result.chest);
        if (chestDrop) {
          addChest(chestDrop.zoneId, chestDrop.type, 1);
          const chestDef = CHEST_TYPES[chestDrop.type];
          showNotification(
            "+1 " + (chestDef ? chestDef.name.toUpperCase() : "COFFRE"),
            getChestZoneLabel(chestDrop.zoneId)
          );
        }

        const claimedRun = Object.assign({}, run);
        exp.slots[slotIndex] = null;
        gameState.totalExpeditionsCompleted = safeNumber(gameState.totalExpeditionsCompleted, 0) + 1;

        /* Contrats + découverte Menace (une seule fois par run.id) */
        onExpeditionCompleted(claimedRun);
        if (claimedRun.isThreat || (exp.activeThreat && exp.activeThreat.runId === claimedRun.id)) {
          clearActiveThreat();
        }

        expeditionsDirty = true;
        dragonsDirty = true;
        uiDirty = true;
        achievementsDirty = true;
        checkAchievements();
        saveGame(true);

        const def = getExpeditionDef(claimedRun.expeditionId) ||
          (claimedRun.isThreat ? { name: "Menace" } : null);
        const claimBits = describeExpeditionRewardLines(result).slice(0, 3);
        showNotification(
          claimedRun.isThreat ? "⚠️ MENACE VAINCUE" : "🧭 EXPÉDITION TERMINÉE",
          (def ? def.name + " — " : "") + (claimBits.length ? claimBits.join(" · ") : "Récompenses récupérées")
        );
        const claimHost = document.getElementById("expeditions-root");
        if (claimHost && window.DCAnim && DCAnim.expeditionClaimFx) {
          DCAnim.expeditionClaimFx(claimHost);
        }
        if (document.getElementById("panel-expedition-contracts")?.classList.contains("active")) {
          renderExpeditionContractsPanel();
        }
        if (document.getElementById("panel-expedition-threats")?.classList.contains("active")) {
          renderExpeditionThreatsPanel();
        }
        return { ok: true, result };
      } catch (err) {
        /* En cas d'échec inattendu, ne pas laisser un slot fantôme claimable deux fois */
        console.error("[Expedition] claim failed", err);
        return { ok: false, reason: "error" };
      } finally {
        if (run) run._claiming = false;
      }
    }

    /* -------------------------------------------------------
       COFFRES V1 — stockage
       ------------------------------------------------------- */
    function getChestZoneIds() {
      return Object.keys(typeof CHEST_ZONE_REWARDS === "object" ? CHEST_ZONE_REWARDS : {});
    }

    function getChestTypeOrder() {
      return Array.isArray(CHEST_TYPE_ORDER) ? CHEST_TYPE_ORDER : ["draconic", "rare", "epic"];
    }

    function createEmptyChestInventory() {
      const inv = {};
      getChestZoneIds().forEach((zoneId) => {
        inv[zoneId] = {};
        getChestTypeOrder().forEach((type) => { inv[zoneId][type] = 0; });
      });
      return inv;
    }

    function sanitizeChestInventory(raw) {
      const inv = createEmptyChestInventory();
      if (!raw || typeof raw !== "object") return inv;
      Object.keys(inv).forEach((zoneId) => {
        const src = raw[zoneId];
        if (!src || typeof src !== "object") return;
        getChestTypeOrder().forEach((type) => {
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
        getChestTypeOrder().forEach((type) => {
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
        getChestTypeOrder().forEach((type) => { n += inv[zoneId][type] || 0; });
      });
      return n;
    }

    /* -------------------------------------------------------
       INVENTAIRE V1 — matériaux / reliques (+ coffres via gameState.chests)
       ------------------------------------------------------- */
    function createEmptyInventory() {
      return { materials: {}, relics: {}, eggs: {} };
    }

    function sanitizeInventoryBag(rawBag) {
      const out = {};
      if (!rawBag || typeof rawBag !== "object") return out;
      Object.keys(rawBag).forEach((id) => {
        if (!id) return;
        const entry = rawBag[id];
        if (entry == null) return;
        if (typeof entry === "number") {
          const n = Math.max(0, Math.floor(safeNumber(entry, 0)));
          if (n > 0) out[id] = { amount: n };
          return;
        }
        if (typeof entry === "object") {
          const n = Math.max(0, Math.floor(safeNumber(entry.amount, 0)));
          if (n > 0) {
            out[id] = Object.assign({}, entry, { amount: n });
          }
        }
      });
      return out;
    }

    function sanitizeInventory(raw) {
      const out = createEmptyInventory();
      if (!raw || typeof raw !== "object") return out;
      out.materials = sanitizeInventoryBag(raw.materials);
      out.relics = sanitizeInventoryBag(raw.relics);
      out.eggs = sanitizeInventoryBag(raw.eggs);
      return out;
    }

    function ensureInventory() {
      if (!gameState.inventory || typeof gameState.inventory !== "object") {
        gameState.inventory = createEmptyInventory();
      }
      if (!gameState.inventory.materials || typeof gameState.inventory.materials !== "object") {
        gameState.inventory.materials = {};
      }
      if (!gameState.inventory.relics || typeof gameState.inventory.relics !== "object") {
        gameState.inventory.relics = {};
      }
      if (!gameState.inventory.eggs || typeof gameState.inventory.eggs !== "object") {
        gameState.inventory.eggs = {};
      }
      return gameState.inventory;
    }

    function normalizeInventoryCategory(type) {
      const t = String(type || "").toLowerCase();
      if (t === "material" || t === "materials") return "materials";
      if (t === "relic" || t === "relics") return "relics";
      if (t === "chest" || t === "chests") return "chests";
      if (t === "egg" || t === "eggs" || t === "guardian" || t === "guardian_eggs") return "eggs";
      return null;
    }

    /** Quantité — coffres lus depuis gameState.chests (pas de doublon). */
    function getInventoryQuantity(type, id) {
      const cat = normalizeInventoryCategory(type);
      if (!cat || id == null || id === "") return 0;
      if (cat === "chests") {
        const parts = String(id).split("|");
        if (parts.length >= 2) return getChestCount(parts[0], parts[1]);
        /* id = type seul → somme toutes zones */
        const inv = ensureChestInventory();
        let n = 0;
        Object.keys(inv).forEach((zoneId) => {
          n += inv[zoneId][id] || 0;
        });
        return n;
      }
      const bag = ensureInventory()[cat];
      const entry = bag[id];
      if (entry == null) return 0;
      if (typeof entry === "number") return Math.max(0, Math.floor(safeNumber(entry, 0)));
      return Math.max(0, Math.floor(safeNumber(entry.amount, 0)));
    }

    function hasInventoryItem(type, id, amount) {
      const need = Math.max(1, Math.floor(safeNumber(amount, 1)));
      return getInventoryQuantity(type, id) >= need;
    }

    /**
     * Ajoute un objet. Coffres → addChest (source de vérité existante).
     * id coffre : "zoneId|chestType"
     */
    function addInventoryItem(type, id, amount, meta) {
      const cat = normalizeInventoryCategory(type);
      const n = Math.max(0, Math.floor(safeNumber(amount, 0)));
      if (!cat || !id || !(n > 0)) return false;
      if (cat === "chests") {
        const parts = String(id).split("|");
        if (parts.length < 2) return false;
        const ok = addChest(parts[0], parts[1], n);
        if (ok) saveGame(true);
        return ok;
      }
      const bag = ensureInventory()[cat];
      const prev = bag[id];
      const prevAmt =
        prev == null
          ? 0
          : typeof prev === "number"
            ? Math.max(0, Math.floor(safeNumber(prev, 0)))
            : Math.max(0, Math.floor(safeNumber(prev.amount, 0)));
      const nextAmt = prevAmt + n;
      if (prev && typeof prev === "object") {
        bag[id] = Object.assign({}, prev, meta && typeof meta === "object" ? meta : {}, {
          amount: nextAmt
        });
      } else {
        bag[id] = Object.assign(
          { amount: nextAmt },
          meta && typeof meta === "object" ? meta : {}
        );
      }
      saveGame(true);
      updateInventoryBadge();
      if (isInventoryPanelOpen()) renderInventoryPanel();
      return true;
    }

    function removeInventoryItem(type, id, amount) {
      const cat = normalizeInventoryCategory(type);
      const n = Math.max(0, Math.floor(safeNumber(amount, 0)));
      if (!cat || !id || !(n > 0)) return false;
      if (cat === "chests") {
        const parts = String(id).split("|");
        if (parts.length < 2) return false;
        const inv = ensureChestInventory();
        const zoneId = parts[0];
        const chestType = parts[1];
        if (!isValidChest(zoneId, chestType)) return false;
        const have = inv[zoneId][chestType] || 0;
        if (have < n) return false;
        inv[zoneId][chestType] = have - n;
        saveGame(true);
        updateChestButtonBadge();
        updateInventoryBadge();
        if (isInventoryPanelOpen()) renderInventoryPanel();
        return true;
      }
      const bag = ensureInventory()[cat];
      const prev = bag[id];
      if (prev == null) return false;
      const prevAmt =
        typeof prev === "number"
          ? Math.max(0, Math.floor(safeNumber(prev, 0)))
          : Math.max(0, Math.floor(safeNumber(prev.amount, 0)));
      if (prevAmt < n) return false;
      const nextAmt = prevAmt - n;
      if (nextAmt <= 0) {
        delete bag[id];
      } else if (typeof prev === "object") {
        bag[id] = Object.assign({}, prev, { amount: nextAmt });
      } else {
        bag[id] = { amount: nextAmt };
      }
      saveGame(true);
      updateInventoryBadge();
      if (isInventoryPanelOpen()) renderInventoryPanel();
      return true;
    }

    function listStoredChestsForInventory() {
      const inv = ensureChestInventory();
      const list = [];
      getChestZoneIds().forEach((zoneId) => {
        getChestTypeOrder().forEach((type) => {
          const count = (inv[zoneId] && inv[zoneId][type]) || 0;
          if (count <= 0) return;
          list.push({ zoneId, type, count });
        });
      });
      return list;
    }

    function updateInventoryBadge() {
      const badge = document.getElementById("inventory-btn-badge");
      if (!badge) return;
      const chests = getTotalChestCount();
      if (chests > 0) {
        badge.hidden = false;
        badge.textContent = chests > 9 ? "9+" : String(chests);
        badge.setAttribute("aria-hidden", "false");
      } else {
        badge.hidden = true;
        badge.textContent = "";
        badge.setAttribute("aria-hidden", "true");
      }
    }

    function syncInventoryTabsUi() {
      const tabs = document.querySelectorAll("#inventory-tabs .inventory-tab");
      tabs.forEach((btn) => {
        const tab = btn.getAttribute("data-inv-tab");
        const active = tab === inventorySessionTab;
        btn.classList.toggle("is-active", active);
        btn.setAttribute("aria-selected", active ? "true" : "false");
      });
    }

    function setInventoryTab(tab) {
      if (tab !== "materials" && tab !== "relics" && tab !== "chests" && tab !== "eggs") return;
      inventorySessionTab = tab;
      syncInventoryTabsUi();
      renderInventoryPanel();
    }

    function renderInventoryEmpty(root, title, text) {
      root.innerHTML = "";
      const empty = document.createElement("div");
      empty.className = "inventory-empty";
      empty.innerHTML =
        '<p class="inventory-empty-title"></p><p class="inventory-empty-text"></p>';
      empty.querySelector(".inventory-empty-title").textContent = title;
      empty.querySelector(".inventory-empty-text").textContent = text;
      root.appendChild(empty);
    }

    function renderInventoryMaterials(root) {
      const bag = ensureInventory().materials;
      const ids = Object.keys(bag).filter((id) => getInventoryQuantity("materials", id) > 0);
      if (!ids.length) {
        renderInventoryEmpty(
          root,
          "Aucun matériau",
          "Les matériaux obtenus lors de vos aventures apparaîtront ici."
        );
        return;
      }
      const grid = document.createElement("div");
      grid.className = "inventory-grid";
      ids.forEach((id) => {
        const entry = bag[id];
        const amount = getInventoryQuantity("materials", id);
        const name =
          (entry && typeof entry === "object" && entry.name) || String(id);
        const rarity =
          (entry && typeof entry === "object" && entry.rarity) || "common";
        const rar = RARITIES[rarity] || RARITIES.common;
        const card = document.createElement("article");
        card.className = "inv-card " + (rar.css || "rarity-common");
        card.innerHTML =
          '<div class="inv-card-art" aria-hidden="true"></div>' +
          '<p class="inv-card-name"></p>' +
          '<span class="inv-card-rarity"></span>' +
          '<strong class="inv-card-qty"></strong>';
        card.querySelector(".inv-card-name").textContent = name;
        card.querySelector(".inv-card-rarity").textContent = rar.label || "";
        card.querySelector(".inv-card-qty").textContent = "x" + amount;
        if (entry && entry.icon) {
          const img = document.createElement("img");
          img.src = entry.icon;
          img.alt = "";
          img.draggable = false;
          img.decoding = "async";
          img.loading = "lazy";
          card.querySelector(".inv-card-art").appendChild(img);
        }
        grid.appendChild(card);
      });
      root.appendChild(grid);
    }

    function renderInventoryRelics(root) {
      const bag = ensureInventory().relics;
      const ids = Object.keys(bag).filter((id) => {
        const e = bag[id];
        if (!e) return false;
        if (typeof e === "number") return e > 0;
        return true;
      });
      if (!ids.length) {
        renderInventoryEmpty(
          root,
          "Aucune relique",
          "Les reliques découvertes ou forgées apparaîtront ici."
        );
        return;
      }
      const grid = document.createElement("div");
      grid.className = "inventory-grid";
      ids.forEach((id) => {
        const entry = bag[id];
        const amount =
          typeof entry === "number"
            ? Math.max(0, Math.floor(entry))
            : Math.max(0, Math.floor(safeNumber(entry.amount, 1)));
        const name =
          (entry && typeof entry === "object" && entry.name) || String(id);
        const rarity =
          (entry && typeof entry === "object" && entry.rarity) || "common";
        const rar = RARITIES[rarity] || RARITIES.common;
        const card = document.createElement("article");
        card.className = "inv-card " + (rar.css || "rarity-common");
        card.innerHTML =
          '<div class="inv-card-art" aria-hidden="true"></div>' +
          '<p class="inv-card-name"></p>' +
          '<span class="inv-card-rarity"></span>' +
          (amount > 1 ? '<strong class="inv-card-qty"></strong>' : "");
        card.querySelector(".inv-card-name").textContent = name;
        card.querySelector(".inv-card-rarity").textContent = rar.label || "";
        const qtyEl = card.querySelector(".inv-card-qty");
        if (qtyEl) qtyEl.textContent = "x" + amount;
        if (entry && entry.icon) {
          const img = document.createElement("img");
          img.src = entry.icon;
          img.alt = "";
          img.draggable = false;
          img.decoding = "async";
          img.loading = "lazy";
          card.querySelector(".inv-card-art").appendChild(img);
        }
        grid.appendChild(card);
      });
      root.appendChild(grid);
    }

    function renderInventoryChests(root) {
      const list = listStoredChestsForInventory();
      if (!list.length) {
        renderInventoryEmpty(
          root,
          "Aucun coffre",
          "Les coffres obtenus en expédition ou en récompense apparaîtront ici."
        );
        return;
      }
      const grid = document.createElement("div");
      grid.className = "inventory-grid";
      list.forEach((item) => {
        const def = CHEST_TYPES[item.type];
        if (!def) return;
        const card = document.createElement("article");
        card.className = "inv-card " + (def.css || "chest-draconic");
        card.innerHTML =
          '<div class="inv-card-art" aria-hidden="true"><img alt="" draggable="false" decoding="async" loading="lazy" /></div>' +
          '<p class="inv-card-name"></p>' +
          '<p class="inv-card-meta"></p>' +
          '<span class="inv-card-rarity"></span>' +
          '<strong class="inv-card-qty"></strong>' +
          '<button type="button" class="inv-card-open">Ouvrir</button>';
        const img = card.querySelector("img");
        img.src = def.imageClosed;
        card.querySelector(".inv-card-name").textContent = def.name;
        card.querySelector(".inv-card-meta").textContent = getChestZoneLabel(item.zoneId);
        card.querySelector(".inv-card-rarity").textContent = def.rarityLabel || "";
        card.querySelector(".inv-card-qty").textContent = "x" + item.count;
        const btn = card.querySelector(".inv-card-open");
        btn.addEventListener("click", () => {
          if (isOpeningChest) return;
          if (getChestCount(item.zoneId, item.type) <= 0) {
            renderInventoryPanel();
            return;
          }
          startChestOpening(item.zoneId, item.type);
        });
        grid.appendChild(card);
      });
      root.appendChild(grid);
    }

    function renderInventoryEggs(root) {
      const bag = ensureInventory().eggs;
      const ids = Object.keys(bag).filter((id) => getInventoryQuantity("eggs", id) > 0);
      if (!ids.length) {
        renderInventoryEmpty(
          root,
          "Aucun œuf",
          "Les Œufs de Gardien très rares apparaîtront ici."
        );
        return;
      }
      const grid = document.createElement("div");
      grid.className = "inventory-grid";
      ids.forEach((id) => {
        const boss = getEggBossDefByGuardianEggId(id);
        const amount = getInventoryQuantity("eggs", id);
        const card = document.createElement("article");
        card.className = "inv-card rarity-legendary inv-card-egg";
        card.innerHTML =
          '<div class="inv-card-art"><img alt="" draggable="false" decoding="async" loading="lazy" /></div>' +
          '<p class="inv-card-name"></p>' +
          '<p class="inv-card-meta"></p>' +
          '<p class="inv-card-qty"></p>' +
          '<button type="button" class="inv-card-open inv-card-use-egg">Utiliser</button>';
        const img = card.querySelector("img");
        const name = boss ? boss.guardianEggName : id;
        const blurb = boss ? (boss.guardianEggBlurb || "Un ancien Œuf de Gardien.") : "Œuf de Gardien";
        if (img && boss) {
          img.src = boss.guardianEggImage;
          img.alt = name;
        }
        card.querySelector(".inv-card-name").textContent = name;
        card.querySelector(".inv-card-meta").textContent = blurb;
        card.querySelector(".inv-card-qty").textContent = "x" + amount;
        const btn = card.querySelector(".inv-card-use-egg");
        const cdLeft = getEggBossCooldownRemainingMs();
        if (!boss || !boss.enabled) {
          btn.disabled = true;
          btn.textContent = "Indisponible";
        } else if (isEggBossFightActive() || getSpecialEggHatch() || guardianHatchSequenceActive) {
          btn.disabled = true;
          btn.textContent = "En cours";
        } else if (cdLeft > 0) {
          btn.disabled = true;
          btn.textContent = "Gardien indisponible — " + formatEggBossCooldown(cdLeft);
        } else {
          btn.addEventListener("click", () => {
            useGuardianEggFromInventory(id);
          });
        }
        grid.appendChild(card);
      });
      root.appendChild(grid);
    }

    function renderInventoryPanel() {
      const root = document.getElementById("inventory-root");
      if (!root) return;
      ensureInventory();
      ensureChestInventory();
      root.innerHTML = "";
      if (inventorySessionTab === "relics") {
        renderInventoryRelics(root);
      } else if (inventorySessionTab === "chests") {
        renderInventoryChests(root);
      } else if (inventorySessionTab === "eggs") {
        renderInventoryEggs(root);
      } else {
        renderInventoryMaterials(root);
      }
    }

    /* -------------------------------------------------------
       GARDIENS D'ŒUF / BOSS ACTIFS (data-driven)
       ------------------------------------------------------- */
    function ensureEggBossSystem(state) {
      const s = state || gameState;
      if (!s.eggBossSystem || typeof s.eggBossSystem !== "object") {
        s.eggBossSystem = createDefaultEggBossSystem();
      }
      const ebs = s.eggBossSystem;
      if (!ebs.eggSpawnProgress || typeof ebs.eggSpawnProgress !== "object") {
        ebs.eggSpawnProgress = {};
      }
      if (ebs.lastBossTimestamp == null) ebs.lastBossTimestamp = 0;
      if (ebs.activeBoss !== null && typeof ebs.activeBoss !== "object") ebs.activeBoss = null;
      /* Boss mort / orphelin en save → ne bloque jamais un futur spawn */
      if (ebs.activeBoss && !(safeNumber(ebs.activeBoss.hp, 0) > 0)) {
        ebs.activeBoss = null;
      }
      if (ebs.specialEggHatch !== null && typeof ebs.specialEggHatch !== "object") {
        ebs.specialEggHatch = null;
      }
      if (ebs.pendingBossSpawn !== null && typeof ebs.pendingBossSpawn !== "object") {
        ebs.pendingBossSpawn = null;
      }
      if (!ebs.bossRecords || typeof ebs.bossRecords !== "object") {
        ebs.bossRecords = {};
      }
      return ebs;
    }

    function sanitizeEggBossSystem(raw) {
      const out = createDefaultEggBossSystem();
      if (!raw || typeof raw !== "object") return out;
      out.lastBossTimestamp = Math.max(0, safeNumber(raw.lastBossTimestamp, 0));
      if (raw.bossRecords && typeof raw.bossRecords === "object") {
        Object.keys(raw.bossRecords).forEach((bossId) => {
          const src = raw.bossRecords[bossId];
          if (!src || typeof src !== "object") return;
          const rec = createDefaultBossRecord();
          if (src.bestTime != null && Number.isFinite(Number(src.bestTime))) {
            rec.bestTime = Math.max(0, Number(src.bestTime));
          }
          if (src.bestRank && EGG_BOSS_RANK_SCORE[src.bestRank]) {
            rec.bestRank = src.bestRank;
          }
          rec.victories = Math.max(0, Math.floor(safeNumber(src.victories, 0)));
          out.bossRecords[bossId] = rec;
        });
      }
      if (raw.eggSpawnProgress && typeof raw.eggSpawnProgress === "object") {
        Object.keys(raw.eggSpawnProgress).forEach((eggId) => {
          const src = raw.eggSpawnProgress[eggId];
          if (!src || typeof src !== "object") return;
          /*
            Compteurs par eggId :
            - hatchesSinceBoss : éclosions depuis le dernier Boss (gate min 3)
            - eligibleSinceBoss : éclosions éligibles pour roll / pity
            Ne pas confondre hatchesSinceBoss → eligible (bug migration).
          */
          out.eggSpawnProgress[eggId] = {
            hatchesSinceBoss: Math.max(0, Math.floor(safeNumber(src.hatchesSinceBoss, 0))),
            eligibleSinceBoss: Math.max(0, Math.floor(safeNumber(src.eligibleSinceBoss, 0)))
          };
        });
      }
      if (raw.pendingBossSpawn && typeof raw.pendingBossSpawn === "object" && raw.pendingBossSpawn.bossId) {
        const pDef = getEggBossDef(raw.pendingBossSpawn.bossId);
        if (pDef && pDef.enabled) {
          out.pendingBossSpawn = {
            bossId: pDef.id,
            fromGuardianEgg: !!raw.pendingBossSpawn.fromGuardianEgg
          };
        }
      }
      if (raw.activeBoss && typeof raw.activeBoss === "object" && raw.activeBoss.bossId) {
        const def = getEggBossDef(raw.activeBoss.bossId);
        const hp = Math.max(0, safeNumber(raw.activeBoss.hp, 0));
        if (def && def.enabled && hp > 0) {
          out.activeBoss = {
            bossId: def.id,
            eggId: def.eggId,
            hp: hp,
            maxHp: Math.max(1, safeNumber(raw.activeBoss.maxHp, 1)),
            clickPowerSnapshot: Math.max(1, safeNumber(raw.activeBoss.clickPowerSnapshot, 1)),
            ppsSnapshot: Math.max(0, safeNumber(raw.activeBoss.ppsSnapshot, 0)),
            fightStartedAt: raw.activeBoss.fightStartedAt != null
              ? safeNumber(raw.activeBoss.fightStartedAt, 0)
              : null,
            fromGuardianEgg: !!raw.activeBoss.fromGuardianEgg,
            spawnedAt: Math.max(0, safeNumber(raw.activeBoss.spawnedAt, Date.now()))
          };
        }
      }
      if (raw.specialEggHatch && typeof raw.specialEggHatch === "object" && raw.specialEggHatch.bossId) {
        const def = getEggBossDef(raw.specialEggHatch.bossId);
        if (def && def.enabled) {
          const req = Math.max(1, Math.floor(safeNumber(raw.specialEggHatch.required, 1)));
          out.specialEggHatch = {
            bossId: def.id,
            eggId: def.eggId,
            progress: Math.min(req, Math.max(0, safeNumber(raw.specialEggHatch.progress, 0))),
            required: req
          };
        }
      }
      return out;
    }

    function getEggBossDef(bossId) {
      if (!bossId) return null;
      for (let i = 0; i < EGG_BOSS_DEFS.length; i++) {
        if (EGG_BOSS_DEFS[i].id === bossId) return EGG_BOSS_DEFS[i];
      }
      return null;
    }

    function getEggBossDefByEggId(eggId) {
      if (!eggId) return null;
      for (let i = 0; i < EGG_BOSS_DEFS.length; i++) {
        const d = EGG_BOSS_DEFS[i];
        if (d.enabled && d.eggId === eggId) return d;
      }
      return null;
    }

    function getEggBossDefByGuardianEggId(guardianEggId) {
      if (!guardianEggId) return null;
      for (let i = 0; i < EGG_BOSS_DEFS.length; i++) {
        const d = EGG_BOSS_DEFS[i];
        if (d.guardianEggId === guardianEggId) return d;
      }
      return null;
    }

    function getEnabledEggBossDefs() {
      return EGG_BOSS_DEFS.filter((d) => d && d.enabled);
    }

    function getActiveEggBoss() {
      const ebs = ensureEggBossSystem();
      return ebs.activeBoss || null;
    }

    function isEggBossFightActive() {
      const b = getActiveEggBoss();
      return !!(b && b.hp > 0);
    }

    function getSpecialEggHatch() {
      const ebs = ensureEggBossSystem();
      return ebs.specialEggHatch || null;
    }

    function getEggBossCooldownRemainingMs() {
      const ebs = ensureEggBossSystem();
      const last = safeNumber(ebs.lastBossTimestamp, 0);
      if (last <= 0) return 0;
      return Math.max(0, EGG_BOSS_COOLDOWN_MS - (Date.now() - last));
    }

    function formatEggBossCooldown(ms) {
      const totalSec = Math.max(0, Math.ceil(safeNumber(ms, 0) / 1000));
      const m = Math.floor(totalSec / 60);
      const s = totalSec % 60;
      return m + ":" + (s < 10 ? "0" : "") + s;
    }

    function isLargeMenuBlockingBossSpawn() {
      if (hatchSequenceActive || guardianHatchSequenceActive) return true;
      if (getActiveOverlayPanelId() !== "kingdom") return true;
      if (document.querySelector(".expedition-drawer.open")) return true;
      const modal = document.getElementById("dragon-modal");
      if (modal && !modal.classList.contains("hidden")) return true;
      const team = document.getElementById("team-module");
      if (team && team.classList.contains("open")) return true;
      return false;
    }

    function getEggSpawnProgress(eggId) {
      const ebs = ensureEggBossSystem();
      if (!ebs.eggSpawnProgress[eggId]) {
        ebs.eggSpawnProgress[eggId] = { hatchesSinceBoss: 0, eligibleSinceBoss: 0 };
      }
      const p = ebs.eggSpawnProgress[eggId];
      if (p.hatchesSinceBoss == null) p.hatchesSinceBoss = 0;
      if (p.eligibleSinceBoss == null) p.eligibleSinceBoss = 0;
      /* Legacy totalHatches (lifetime) — ne plus s’en servir pour le gate min. */
      if (p.totalHatches != null) delete p.totalHatches;
      return p;
    }

    function resetEggBossSpawnCounters(eggId) {
      if (!eggId) return;
      const prog = getEggSpawnProgress(eggId);
      prog.hatchesSinceBoss = 0;
      prog.eligibleSinceBoss = 0;
    }

    /**
     * Roll naturel APRÈS une éclosion réussie.
     * - Cooldown actif : aucun compteur avancé, pas de spawn.
     * - Sinon : hatchesSinceBoss++ (min 3), puis eligibleSinceBoss++ (15 % / pity 8).
     * - Les compteurs ne sont remis à 0 qu’à l’apparition réelle du Boss.
     */
    function rollNaturalEggBossSpawn(eggId, opts) {
      opts = opts || {};
      const def = getEggBossDefByEggId(eggId);
      if (!def || !def.enabled) return null;
      if (isEggBossFightActive() || getSpecialEggHatch()) return null;
      const ebs = ensureEggBossSystem();
      if (ebs.pendingBossSpawn && ebs.pendingBossSpawn.bossId) return null;
      if (getEggBossCooldownRemainingMs() > 0) return null;

      const prog = getEggSpawnProgress(eggId);
      prog.hatchesSinceBoss = Math.max(0, Math.floor(safeNumber(prog.hatchesSinceBoss, 0))) + 1;
      if (prog.hatchesSinceBoss < EGG_BOSS_MIN_HATCHES) return null;

      prog.eligibleSinceBoss = Math.max(0, Math.floor(safeNumber(prog.eligibleSinceBoss, 0))) + 1;
      let spawn = false;
      if (prog.eligibleSinceBoss >= EGG_BOSS_PITY) {
        spawn = true;
      } else {
        const roll = opts.forceRoll != null ? Number(opts.forceRoll) : Math.random();
        if (roll < EGG_BOSS_SPAWN_CHANCE) spawn = true;
      }
      if (!spawn) return null;
      /* Ne PAS reset ici — reset uniquement dans beginEggBossEncounter. */
      return def;
    }

    function queueEggBossSpawn(bossId, opts) {
      opts = opts || {};
      const ebs = ensureEggBossSystem();
      ebs.pendingBossSpawn = {
        bossId: bossId,
        fromGuardianEgg: !!opts.fromGuardianEgg
      };
      /* Miroir runtime (flush immédiat) */
      pendingBossSpawn = ebs.pendingBossSpawn;
      tryFlushPendingBossSpawn();
      saveGame(true);
    }

    function tryFlushPendingBossSpawn() {
      const ebs = ensureEggBossSystem();
      const spawn = ebs.pendingBossSpawn || pendingBossSpawn;
      if (!spawn || !spawn.bossId) {
        pendingBossSpawn = null;
        return false;
      }
      pendingBossSpawn = spawn;
      /* Soft-block : garder le pending (menus / hatch), ne pas le détruire. */
      if (isEggBossFightActive()) {
        ebs.pendingBossSpawn = null;
        pendingBossSpawn = null;
        return false;
      }
      if (getSpecialEggHatch() || guardianHatchSequenceActive) return false;
      if (isLargeMenuBlockingBossSpawn()) return false;
      ebs.pendingBossSpawn = null;
      pendingBossSpawn = null;
      const ok = beginEggBossEncounter(spawn.bossId, { fromGuardianEgg: spawn.fromGuardianEgg });
      if (!ok) {
        /* Remettre en file si l’apparition a échoué — ne pas brûler le pity. */
        ebs.pendingBossSpawn = spawn;
        pendingBossSpawn = spawn;
        return false;
      }
      return true;
    }

    function announceGuardianAppeared(bossDef, thenFn) {
      showNotification("⚔️ Gardien", "UN GARDIEN EST APPARU");
      const banner = document.getElementById("egg-boss-announce");
      if (banner) {
        banner.hidden = false;
        banner.classList.add("is-visible");
        const title = banner.querySelector(".egg-boss-announce-title");
        const sub = banner.querySelector(".egg-boss-announce-sub");
        if (title) title.textContent = "UN GARDIEN EST APPARU";
        if (sub) sub.textContent = bossDef ? (bossDef.name + " — " + bossDef.subtitle) : "";
        window.setTimeout(() => {
          banner.classList.remove("is-visible");
          banner.hidden = true;
          if (typeof thenFn === "function") thenFn();
        }, 900);
      } else if (typeof thenFn === "function") {
        thenFn();
      }
    }

    function beginEggBossEncounter(bossId, opts) {
      opts = opts || {};
      const def = getEggBossDef(bossId);
      if (!def || !def.enabled) return false;
      if (isEggBossFightActive()) return false;
      const ebs = ensureEggBossSystem();
      const stats = calculateGlobalStats();
      const clickPower = Math.max(1, safeNumber(stats.clickPower, gameState.powerPerClick || 1));
      let pps = safeNumber(stats.essencePerSecond, gameState.powerPerSecond || 0);
      if (!(pps > 0)) pps = clickPower * 6;
      const maxHp = Math.max(1, Math.floor(clickPower * Math.max(1, def.targetHits || 90)));
      ebs.activeBoss = {
        bossId: def.id,
        eggId: def.eggId,
        hp: maxHp,
        maxHp: maxHp,
        clickPowerSnapshot: clickPower,
        ppsSnapshot: pps,
        fightStartedAt: null,
        fromGuardianEgg: !!opts.fromGuardianEgg,
        spawnedAt: Date.now()
      };
      ebs.specialEggHatch = null;
      ebs.pendingBossSpawn = null;
      pendingBossSpawn = null;
      /* Reset compteurs de CET œuf uniquement à l’apparition réelle */
      resetEggBossSpawnCounters(def.eggId);
      if (window.DCAssets && typeof DCAssets.preloadCritical === "function") {
        DCAssets.preloadCritical([def.image, def.guardianEggImage].filter(Boolean));
      }
      document.documentElement.classList.add("egg-boss-active");
      const abandonBtn = document.getElementById("egg-boss-abandon");
      if (abandonBtn) abandonBtn.hidden = false;
      if (def.eggId && gameState.equippedEggId !== def.eggId) {
        const prog = getEggProgress(def.eggId);
        if (prog.unlocked) {
          gameState.equippedEggId = def.eggId;
          setZoneSelectedEggId(def.zoneId || gameState.currentZoneId, def.eggId);
        }
      }
      announceGuardianAppeared(def, () => {
        renderCurrentEgg();
        renderEggProgressUI(true);
        updateEggCarouselPeer();
      });
      renderEggProgressUI(true);
      updateEggCarouselPeer();
      return true;
    }

    function calculateEggBossDamage(clickPowerSnapshot, isCrit, isCharged) {
      let dmg = Math.max(1, safeNumber(clickPowerSnapshot, 1));
      if (isCrit) dmg *= 1.5;
      if (isCharged) dmg *= 2;
      return dmg;
    }

    let cachedBossHpFill = null;
    let cachedBossHpNums = null;
    let lastBossHpTextKey = "";
    let activeBossFloats = [];
    const MAX_BOSS_FLOATS = 14;
    let clickZoneRectCache = null;
    let clickZoneRectCacheAt = 0;

    function getClickZoneRect() {
      const now = performance.now();
      if (clickZoneRectCache && (now - clickZoneRectCacheAt) < EGG_HIT_RECT_CACHE_MS) {
        return clickZoneRectCache;
      }
      const zone = document.getElementById("click-zone");
      if (!zone) {
        clickZoneRectCache = null;
        return null;
      }
      clickZoneRectCache = { el: zone, rect: zone.getBoundingClientRect() };
      clickZoneRectCacheAt = now;
      return clickZoneRectCache;
    }

    /** Barre HP Boss : écriture DOM minimale (largeur + texte optionnel). */
    function updateEggBossHpBarFast() {
      const boss = getActiveEggBoss();
      if (!boss) return;
      const hp = Math.max(0, safeNumber(boss.hp, 0));
      const maxHp = Math.max(1, safeNumber(boss.maxHp, 1));
      const pct = Math.max(0, Math.min(100, (hp / maxHp) * 100));
      if (!cachedBossHpFill) cachedBossHpFill = document.getElementById("hatch-bar-fill");
      if (cachedBossHpFill) {
        cachedBossHpFill.style.width = pct + "%";
        cachedBossHpFill.classList.add("is-boss-hp");
      }
      /* Texte HP : skip formatNumber si floor inchangé. */
      const floorHp = Math.floor(hp);
      const textKey = floorHp + "|" + Math.floor(maxHp);
      if (textKey !== lastBossHpTextKey) {
        lastBossHpTextKey = textKey;
        if (!cachedBossHpNums) cachedBossHpNums = document.getElementById("hatch-bar-nums");
        if (cachedBossHpNums) {
          cachedBossHpNums.textContent =
            formatNumber(floorHp) + " / " + formatNumber(Math.floor(maxHp));
        }
      }
    }

    function damageEggBoss(clickPower, isCrit, isCharged, clientX, clientY) {
      const boss = getActiveEggBoss();
      if (!boss || !(boss.hp > 0)) return;
      if (boss.fightStartedAt == null) boss.fightStartedAt = Date.now();
      const snap = Math.max(1, safeNumber(boss.clickPowerSnapshot, clickPower || 1));
      const dmg = calculateEggBossDamage(snap, isCrit, isCharged);
      boss.hp = Math.max(0, safeNumber(boss.hp, 0) - dmg);
      spawnBossDamageFloat(clientX, clientY, dmg, isCrit, isCharged);
      updateEggBossHpBarFast();
      if (boss.hp <= 0) {
        resolveEggBossVictory(boss);
      }
    }

    function spawnBossDamageFloat(clientX, clientY, dmg, isCrit, isCharged) {
      const zoneInfo = getClickZoneRect();
      if (!zoneInfo) return;
      pruneFxList(activeBossFloats, MAX_BOSS_FLOATS);
      const el = document.createElement("div");
      el.className = "float-text boss-dmg-float" +
        (isCrit ? " combo" : "") +
        (isCharged ? " charged" : "");
      el.textContent = "-" + formatNumber(Math.floor(dmg));
      const rect = zoneInfo.rect;
      const x = clientX != null ? clientX - rect.left : rect.width * 0.5;
      const y = clientY != null ? clientY - rect.top : rect.height * 0.4;
      el.style.left = x + "px";
      el.style.top = y + "px";
      zoneInfo.el.appendChild(el);
      activeBossFloats.push(el);
      scheduleFxRemove(activeBossFloats, el, 700);
    }

    function getEggBossRank(elapsedSec) {
      const t = Math.max(0, safeNumber(elapsedSec, 0));
      if (t <= (EGG_BOSS_RANK_THRESHOLDS.S || 15)) return "S";
      if (t <= (EGG_BOSS_RANK_THRESHOLDS.A || 25)) return "A";
      if (t <= (EGG_BOSS_RANK_THRESHOLDS.B || 40)) return "B";
      return "C";
    }

    function getEggBossFightElapsedSec(boss) {
      if (!boss || boss.fightStartedAt == null) return 0;
      return Math.max(0, (Date.now() - boss.fightStartedAt) / 1000);
    }

    function computeEggBossEssenceReward(boss, rank) {
      const pps = Math.max(0, safeNumber(boss && boss.ppsSnapshot, 0));
      const clickSnap = Math.max(1, safeNumber(boss && boss.clickPowerSnapshot, 1));
      let base = pps > 0.5 ? pps * 60 : clickSnap * 60;
      base = Math.max(clickSnap * 20, base);
      const mult = EGG_BOSS_RANK_ESSENCE_MULT[rank] || 1;
      return Math.max(1, Math.floor(base * mult));
    }

    function rollEggBossChestRewards(rank, zoneId) {
      const chances = EGG_BOSS_CHEST_CHANCES[rank] || EGG_BOSS_CHEST_CHANCES.C;
      const granted = [];
      const zid = zoneId || gameState.currentZoneId || "sanctuary";
      if (chances.draconic > 0 && Math.random() < chances.draconic && isValidChest(zid, "draconic")) {
        addChest(zid, "draconic", 1);
        granted.push("draconic");
      }
      if (chances.rare > 0 && Math.random() < chances.rare && isValidChest(zid, "rare")) {
        addChest(zid, "rare", 1);
        granted.push("rare");
      }
      return granted;
    }

    function rollGuardianEggDrop(bossDef, rank) {
      if (!bossDef || !bossDef.guardianEggId) return false;
      const chance = GUARDIAN_EGG_DROP_CHANCE[rank];
      if (!(chance > 0) || Math.random() >= chance) return false;
      addInventoryItem("eggs", bossDef.guardianEggId, 1, {
        bossId: bossDef.id,
        name: bossDef.guardianEggName
      });
      return true;
    }

    function resolveEggBossVictory(boss) {
      const def = getEggBossDef(boss.bossId);
      const elapsed = getEggBossFightElapsedSec(boss);
      const rank = getEggBossRank(elapsed);
      const essence = computeEggBossEssenceReward(boss, rank);
      addEssence(essence, "boss");
      const chests = rollEggBossChestRewards(rank, def && def.zoneId);
      const gotEgg = rollGuardianEggDrop(def, rank);
      if (boss && boss.bossId) recordEggBossVictory(boss.bossId, elapsed, rank);
      const ebs = ensureEggBossSystem();
      ebs.activeBoss = null;
      ebs.pendingBossSpawn = null;
      pendingBossSpawn = null;
      ebs.lastBossTimestamp = Date.now();
      if (def) resetEggBossSpawnCounters(def.eggId);
      document.documentElement.classList.remove("egg-boss-active");
      cachedBossHpFill = null;
      cachedBossHpNums = null;
      lastBossHpTextKey = "";
      const abandonBtn = document.getElementById("egg-boss-abandon");
      if (abandonBtn) abandonBtn.hidden = true;
      showEggBossVictoryModal({
        bossDef: def,
        elapsed: elapsed,
        rank: rank,
        essence: essence,
        chests: chests,
        guardianEgg: gotEgg
      });
      renderCurrentEgg();
      renderEggProgressUI(true);
      updateEggCarouselPeer();
      saveGame(true);
    }

    function abandonEggBossFight() {
      const boss = getActiveEggBoss();
      if (!boss) return;
      const ebs = ensureEggBossSystem();
      const eggId = boss.eggId || (getEggBossDef(boss.bossId) || {}).eggId;
      ebs.activeBoss = null;
      ebs.pendingBossSpawn = null;
      pendingBossSpawn = null;
      ebs.lastBossTimestamp = Date.now();
      if (eggId) resetEggBossSpawnCounters(eggId);
      document.documentElement.classList.remove("egg-boss-active");
      cachedBossHpFill = null;
      cachedBossHpNums = null;
      lastBossHpTextKey = "";
      const abandonBtn = document.getElementById("egg-boss-abandon");
      if (abandonBtn) abandonBtn.hidden = true;
      showNotification("⚔️ Gardien", "Combat abandonné.");
      renderCurrentEgg();
      renderEggProgressUI(true);
      updateEggCarouselPeer();
      saveGame(true);
    }

    function showEggBossVictoryModal(payload) {
      const modal = document.getElementById("egg-boss-victory-modal");
      if (!modal) {
        showNotification(
          "⚔️ Gardien vaincu",
          "Rang " + payload.rank + " · +" + formatNumber(payload.essence) + " Essence"
        );
        return;
      }
      const def = payload.bossDef;
      const nameEl = document.getElementById("egg-boss-victory-name");
      const timeEl = document.getElementById("egg-boss-victory-time");
      const rankEl = document.getElementById("egg-boss-victory-rank");
      const rewEl = document.getElementById("egg-boss-victory-rewards");
      const eggWrap = document.getElementById("egg-boss-victory-egg");
      if (nameEl) nameEl.textContent = def ? def.name : "GARDIEN";
      if (timeEl) timeEl.textContent = payload.elapsed.toFixed(1) + " s";
      if (rankEl) {
        rankEl.textContent = "RANG " + payload.rank;
        rankEl.setAttribute("data-rank", payload.rank);
      }
      if (rewEl) {
        let html = "<li>+" + formatNumber(payload.essence) + " Essence</li>";
        (payload.chests || []).forEach((t) => {
          const ct = CHEST_TYPES[t];
          html += "<li>" + (ct ? ct.name : t) + "</li>";
        });
        rewEl.innerHTML = html;
      }
      if (eggWrap) {
        if (payload.guardianEgg && def) {
          eggWrap.hidden = false;
          eggWrap.classList.add("is-rare");
          const img = document.getElementById("egg-boss-victory-egg-img");
          const txt = document.getElementById("egg-boss-victory-egg-text");
          if (img) {
            img.src = def.guardianEggImage;
            img.alt = def.guardianEggName || "";
          }
          if (txt) txt.textContent = "OBJET RARE OBTENU — " + (def.guardianEggName || "Œuf de Gardien");
        } else {
          eggWrap.hidden = true;
          eggWrap.classList.remove("is-rare");
        }
      }
      modal.classList.remove("hidden");
      modal.setAttribute("aria-hidden", "false");
    }

    function closeEggBossVictoryModal() {
      const modal = document.getElementById("egg-boss-victory-modal");
      if (!modal) return;
      modal.classList.add("hidden");
      modal.setAttribute("aria-hidden", "true");
    }

    function renderEggBossFightUI(force) {
      const boss = getActiveEggBoss();
      const def = boss ? getEggBossDef(boss.bossId) : null;
      const labelProg = document.getElementById("hatch-progress-label");
      const nums = document.getElementById("hatch-bar-nums");
      const pctEl = document.getElementById("hatch-bar-pct");
      const fill = document.getElementById("hatch-bar-fill");
      const bar = document.getElementById("hatch-bar");
      const etaEl = document.getElementById("ki-eta");
      const block = document.getElementById("egg-progress-block");
      if (!boss || !def) {
        if (block) block.classList.remove("is-boss-fight", "is-guardian-hatch");
        return false;
      }
      if (block) {
        block.classList.add("is-boss-fight");
        block.classList.remove("is-guardian-hatch");
      }
      const hp = Math.max(0, safeNumber(boss.hp, 0));
      const maxHp = Math.max(1, safeNumber(boss.maxHp, 1));
      const pct = Math.max(0, Math.min(100, (hp / maxHp) * 100));
      const elapsed = getEggBossFightElapsedSec(boss);
      const rank = boss.fightStartedAt != null ? getEggBossRank(elapsed) : "—";
      const key = def.id + "|" + Math.floor(hp) + "|" + maxHp + "|" + elapsed.toFixed(1) + "|" + rank;
      if (!force && key === lastBossFightUiKey) return true;
      lastBossFightUiKey = key;
      if (labelProg) labelProg.textContent = "GARDIEN DRACONIQUE";
      if (nums) nums.textContent = formatNumber(Math.floor(hp)) + " / " + formatNumber(Math.floor(maxHp));
      if (pctEl) pctEl.textContent = "RANG " + rank;
      if (fill) {
        fill.style.width = pct + "%";
        fill.classList.add("is-boss-hp");
      }
      if (bar) bar.setAttribute("aria-valuenow", String(Math.floor(pct)));
      if (etaEl) {
        etaEl.textContent =
          def.name + " — " + def.subtitle +
          (boss.fightStartedAt != null ? (" · Temps : " + elapsed.toFixed(1) + " s") : " · Cliquez pour commencer");
      }
      const stageLabel = document.getElementById("egg-stage-label");
      if (stageLabel) stageLabel.textContent = def.name;
      return true;
    }

    function useGuardianEggFromInventory(guardianEggId) {
      const boss = getEggBossDefByGuardianEggId(guardianEggId);
      if (!boss || !boss.enabled) {
        showNotification("Œuf de Gardien", "Cet œuf est inconnu.");
        return false;
      }
      if (isEggBossFightActive() || getSpecialEggHatch() || guardianHatchSequenceActive || hatchSequenceActive) {
        showNotification("Œuf de Gardien", "Un Gardien est déjà en cours.");
        return false;
      }
      const cd = getEggBossCooldownRemainingMs();
      if (cd > 0) {
        showNotification("Gardien indisponible", formatEggBossCooldown(cd));
        return false;
      }
      if (!isZoneUnlocked(gameState, boss.zoneId)) {
        showNotification("Œuf de Gardien", "Zone du Gardien non débloquée.");
        return false;
      }
      const eggProg = getEggProgress(boss.eggId);
      if (!eggProg.unlocked) {
        showNotification("Œuf de Gardien", "Œuf d'origine non débloqué.");
        return false;
      }
      if (!hasInventoryItem("eggs", guardianEggId, 1)) return false;
      /* Consommer uniquement au démarrage réussi */
      if (!removeInventoryItem("eggs", guardianEggId, 1)) return false;

      const eggDef = getEggDef(boss.eggId);
      const required = Math.max(
        1,
        Math.floor(getEggHatchRequirement(eggDef) * GUARDIAN_EGG_HATCH_MULT)
      );
      ensureEggBossSystem().specialEggHatch = {
        bossId: boss.id,
        eggId: boss.eggId,
        progress: 0,
        required: required
      };
      gameState.equippedEggId = boss.eggId;
      setZoneSelectedEggId(boss.zoneId, boss.eggId);
      if (gameState.currentZoneId !== boss.zoneId) {
        /* Rester sur la zone courante si différente — l'œuf équipé guide le hatch */
      }
      closeInventoryPanel();
      switchPanel("kingdom");
      renderCurrentEgg();
      renderEggProgressUI(true);
      updateEggCarouselPeer();
      showNotification("Œuf de Gardien", boss.guardianEggName + " — éclosion spéciale");
      saveGame(true);
      return true;
    }

    function completeGuardianEggHatch() {
      const special = getSpecialEggHatch();
      if (!special || guardianHatchSequenceActive) return;
      const bossDef = getEggBossDef(special.bossId);
      if (!bossDef) {
        ensureEggBossSystem().specialEggHatch = null;
        return;
      }
      guardianHatchSequenceActive = true;
      clicksLocked = true;
      const stageEl = document.getElementById("egg-stage");
      if (stageEl) stageEl.classList.add("is-hatching");
      playSound("eggCrack", { force: true });
      window.setTimeout(() => {
        playSound("hatch");
        ensureEggBossSystem().specialEggHatch = null;
        guardianHatchSequenceActive = false;
        clicksLocked = false;
        if (stageEl) stageEl.classList.remove("is-hatching");
        beginEggBossEncounter(bossDef.id, { fromGuardianEgg: true });
        saveGame(true);
      }, 700);
    }

    function onNormalEggHatchFinishedForBoss(eggId) {
      if (!eggId) return;
      const rolled = rollNaturalEggBossSpawn(eggId);
      if (!rolled) return;
      queueEggBossSpawn(rolled.id, { fromGuardianEgg: false });
    }

    function restoreEggBossUiAfterLoad() {
      const ebs = ensureEggBossSystem();
      pendingBossSpawn = ebs.pendingBossSpawn || null;
      const boss = getActiveEggBoss();
      const abandonBtn = document.getElementById("egg-boss-abandon");
      if (boss && boss.hp > 0) {
        document.documentElement.classList.add("egg-boss-active");
        if (abandonBtn) abandonBtn.hidden = false;
      } else {
        document.documentElement.classList.remove("egg-boss-active");
        if (abandonBtn) abandonBtn.hidden = true;
        if (ebs.activeBoss) ebs.activeBoss = null;
      }
      const special = getSpecialEggHatch();
      if (special && safeNumber(special.progress, 0) >= Math.max(1, safeNumber(special.required, 1))) {
        completeGuardianEggHatch();
      }
      renderEggProgressUI(true);
      tryFlushPendingBossSpawn();
    }

    function getEggBossDebugState(eggId) {
      const def = eggId
        ? getEggBossDefByEggId(eggId) || getEggBossDef(eggId)
        : getEggBossDefByEggId(gameState.equippedEggId);
      const id = def ? def.eggId : (eggId || gameState.equippedEggId || "basic");
      const bossDef = getEggBossDefByEggId(id);
      const ebs = ensureEggBossSystem();
      const prog = getEggSpawnProgress(id);
      const cd = getEggBossCooldownRemainingMs();
      const hatches = Math.max(0, Math.floor(safeNumber(prog.hatchesSinceBoss, 0)));
      const eligible = Math.max(0, Math.floor(safeNumber(prog.eligibleSinceBoss, 0)));
      const active = getActiveEggBoss();
      const canSpawn = !!(
        bossDef &&
        bossDef.enabled &&
        !active &&
        !getSpecialEggHatch() &&
        !ebs.pendingBossSpawn &&
        cd <= 0 &&
        hatches >= EGG_BOSS_MIN_HATCHES
      );
      return {
        bossId: bossDef ? bossDef.id : null,
        eggId: id,
        activeBoss: active,
        pendingBossSpawn: ebs.pendingBossSpawn,
        cooldownRemaining: cd,
        cooldownRemainingFmt: formatEggBossCooldown(cd),
        hatchesSinceBoss: hatches,
        eligibleHatches: eligible,
        pity: eligible,
        pityThreshold: EGG_BOSS_PITY,
        minHatches: EGG_BOSS_MIN_HATCHES,
        spawnChance: EGG_BOSS_SPAWN_CHANCE,
        canSpawn: canSpawn,
        lastBossTimestamp: ebs.lastBossTimestamp,
        now: Date.now()
      };
    }

    function forceEggBossEligibility(eggId) {
      const def = getEggBossDefByEggId(eggId) || getEggBossDef(eggId) || getEggBossDefByEggId(gameState.equippedEggId);
      if (!def) return null;
      const ebs = ensureEggBossSystem();
      ebs.lastBossTimestamp = 0;
      ebs.activeBoss = null;
      ebs.pendingBossSpawn = null;
      pendingBossSpawn = null;
      const prog = getEggSpawnProgress(def.eggId);
      prog.hatchesSinceBoss = EGG_BOSS_MIN_HATCHES;
      prog.eligibleSinceBoss = Math.max(0, EGG_BOSS_PITY - 1);
      return getEggBossDebugState(def.eggId);
    }

    function getChestZoneLabel(zoneId) {
      const zone = getZoneDef(zoneId);
      const idx = ZONE_DEFS.findIndex((z) => z.id === zoneId);
      return (idx >= 0 ? "Zone " + (idx + 1) : "Zone") + (zone ? " · " + zone.name : "");
    }

    function getChestZoneTabLabel(zoneId) {
      const idx = ZONE_DEFS.findIndex((z) => z.id === zoneId);
      return idx >= 0 ? ("ZONE " + (idx + 1)) : "ZONE";
    }

    function addChest(zoneId, chestType, amount) {
      if (!isValidChest(zoneId, chestType)) return false;
      const n = Math.max(1, Math.floor(safeNumber(amount, 1)));
      const inv = ensureChestInventory();
      inv[zoneId][chestType] += n;
      markChestNew(zoneId, chestType);
      updateChestButtonBadge();
      updateInventoryBadge();
      if (isChestModalOpen()) renderChestInventory();
      if (isInventoryPanelOpen() && inventorySessionTab === "chests") renderInventoryPanel();
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

    /** 0 ou 1 coffre en fin d'expédition (jet drop puis jet rareté). */
    function rollExpeditionChest(defOrZoneId, teamPowerOrRng, maybeRng) {
      let def = null;
      let zoneId = null;
      let teamPower = 0;
      let rng = Math.random;

      if (defOrZoneId && typeof defOrZoneId === "object") {
        def = defOrZoneId;
        zoneId = def.zoneId;
        teamPower = safeNumber(teamPowerOrRng, 0);
        rng = typeof maybeRng === "function" ? maybeRng : Math.random;
      } else {
        zoneId = defOrZoneId;
        rng = typeof teamPowerOrRng === "function" ? teamPowerOrRng : Math.random;
        teamPower = 0;
      }

      const cfg = (def && def.rewardConfig) || {};
      const zoneDrop =
        typeof CHEST_EXPEDITION_DROPS === "object" && zoneId
          ? CHEST_EXPEDITION_DROPS[zoneId]
          : null;

      const chance =
        cfg.chestChance != null
          ? safeNumber(cfg.chestChance, 0)
          : safeNumber(zoneDrop && zoneDrop.chance, 0);
      if (!(chance > 0) || !zoneId) return null;
      if (rng() >= chance) return null;

      const baseWeights =
        cfg.chestWeights ||
        (zoneDrop && zoneDrop.weights) ||
        { draconic: 100, rare: 0, epic: 0 };
      const recommendedPower = def ? safeNumber(def.recommendedPower, 1) : 1;
      /* Qualité liée à la puissance : uniquement si l'expédition définit chestWeights (Zone 1). */
      const weights = cfg.chestWeights
        ? getAdjustedChestRarityChances(baseWeights, teamPower, recommendedPower)
        : baseWeights;
      const type = pickWeighted(weights, rng);
      return isValidChest(zoneId, type) ? { zoneId: zoneId, type: type } : null;
    }

    /** Dragons découverts de la zone, hors mythiques (poids 0) et secrets. */
    function getEligibleChestDragons(zoneId) {
      return DRAGON_DEFS.filter((def) => {
        if (def.secret || (def.zoneId || "sanctuary") !== zoneId) return false;
        if (safeNumber(CHEST_FRAGMENT_RARITY_WEIGHTS[def.rarity], 0) <= 0) return false;
        return isDragonDiscovered(gameState.dragons[def.id], def.id, gameState);
      });
    }

    function pickChestFragmentDragon(eligible, rng) {
      const weights = {};
      eligible.forEach((def) => {
        weights[def.id] = safeNumber(CHEST_FRAGMENT_RARITY_WEIGHTS[def.rarity], 0);
      });
      return pickWeighted(weights, typeof rng === "function" ? rng : Math.random);
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
        /* Pas de yield d'équipe : les coffres restent un bonus secondaire. */
        const res = grantDragonFragments(f.dragonId, f.amount, { applyYield: false });
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
      updateInventoryBadge();
      if (isInventoryPanelOpen() && inventorySessionTab === "chests") renderInventoryPanel();
      return granted ? Object.assign({ zoneId, chestType }, granted) : null;
    }

    /* -------------------------------------------------------
       COFFRES V1 — affichage (tuiles + sélection)
       ------------------------------------------------------- */
    let chestRevealTimer = null;
    let chestRevealTimers = [];
    let lastChestOpen = null;
    let selectedChestZoneId = "sanctuary";
    let selectedChestType = "draconic";
    let isOpeningChest = false;
    const chestNewFlags = Object.create(null);

    function chestKey(zoneId, chestType) {
      return String(zoneId) + "|" + String(chestType);
    }

    function markChestNew(zoneId, chestType) {
      chestNewFlags[chestKey(zoneId, chestType)] = true;
    }

    function clearChestNew(zoneId, chestType) {
      delete chestNewFlags[chestKey(zoneId, chestType)];
    }

    function isChestNew(zoneId, chestType) {
      return !!chestNewFlags[chestKey(zoneId, chestType)];
    }

    function clearChestRevealTimers() {
      clearTimeout(chestRevealTimer);
      chestRevealTimer = null;
      chestRevealTimers.forEach((id) => clearTimeout(id));
      chestRevealTimers = [];
    }

    function isChestModalOpen() {
      const m = document.getElementById("chest-modal");
      return !!(m && !m.classList.contains("hidden"));
    }

    function updateChestButtonBadge() {
      /* Inventaire stocké encore mis à jour en interne (expéditions) ;
         le rail Royaume n'affiche plus le compteur — coffre régulier à la place. */
      const badge = document.getElementById("chests-btn-badge");
      if (badge) {
        badge.hidden = true;
        badge.classList.add("is-empty");
      }
      updateRegularChestUI();
    }

    /* -------------------------------------------------------
       COFFRE RÉGULIER ROYAUME — claim direct, cooldown 15 min
       ------------------------------------------------------- */
    const FREE_CHEST_COOLDOWN_MS = 15 * 60 * 1000;
    const FREE_CHEST_TYPE = "draconic";
    let regularChestTickerId = null;
    let regularChestWasReady = null;

    function getRegularChestRemainingMs() {
      const until = Math.max(0, Math.floor(safeNumber(gameState.nextFreeChestAt, 0)));
      if (until <= 0) return 0;
      return Math.max(0, until - Date.now());
    }

    function isRegularChestReady() {
      return getRegularChestRemainingMs() <= 0;
    }

    function formatChestCountdown(ms) {
      const total = Math.max(0, Math.ceil(ms / 1000));
      const m = Math.floor(total / 60);
      const s = total % 60;
      return (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s;
    }

    /** Zone avec table coffre de base ; fallback zones débloquées puis sanctuary. */
    function getFreeChestZoneId() {
      const cur = gameState.currentZoneId || "sanctuary";
      if (isValidChest(cur, FREE_CHEST_TYPE)) return cur;
      const unlocked = Array.isArray(gameState.unlockedZones) ? gameState.unlockedZones : ["sanctuary"];
      for (let i = unlocked.length - 1; i >= 0; i--) {
        if (isValidChest(unlocked[i], FREE_CHEST_TYPE)) return unlocked[i];
      }
      return "sanctuary";
    }

    function updateRegularChestUI() {
      const btn = document.getElementById("btn-open-chests");
      if (!btn) return;
      const timerEl = document.getElementById("regular-chest-timer");
      const readyEl = document.getElementById("regular-chest-ready");
      const remaining = getRegularChestRemainingMs();
      const ready = remaining <= 0;

      btn.classList.toggle("is-cooldown", !ready);
      btn.classList.toggle("is-ready", ready);
      btn.classList.remove("has-chests");

      if (ready) {
        if (timerEl) {
          timerEl.hidden = true;
          timerEl.setAttribute("aria-hidden", "true");
          timerEl.textContent = "";
        }
        if (readyEl) {
          readyEl.hidden = false;
          readyEl.setAttribute("aria-hidden", "false");
        }
        btn.setAttribute("aria-label", "Coffre prêt — récupérer");
        btn.title = "Coffre prêt";
        if (regularChestWasReady === false) {
          btn.classList.add("just-became-ready");
          setTimeout(function () {
            btn.classList.remove("just-became-ready");
          }, 900);
        }
      } else {
        if (timerEl) {
          timerEl.hidden = false;
          timerEl.setAttribute("aria-hidden", "false");
          timerEl.textContent = formatChestCountdown(remaining);
        }
        if (readyEl) {
          readyEl.hidden = true;
          readyEl.setAttribute("aria-hidden", "true");
        }
        btn.setAttribute("aria-label", "Coffre — disponible dans " + formatChestCountdown(remaining));
        btn.title = formatChestCountdown(remaining);
      }
      regularChestWasReady = ready;
    }

    let lastRegularChestUiAt = 0;
    const REGULAR_CHEST_UI_MS = 1000;

    /** Coffre gratuit : tick global (plus de setInterval dédié). */
    function startRegularChestTicker() {
      updateRegularChestUI();
      lastRegularChestUiAt = performance.now();
    }

    function stopRegularChestTicker() {
      /* no-op — conservé pour compat appels existants */
    }

    function tickRegularChestUi(now) {
      if (now - lastRegularChestUiAt < REGULAR_CHEST_UI_MS) return;
      lastRegularChestUiAt = now;
      updateRegularChestUI();
    }

    function nudgeCooldownChest() {
      const btn = document.getElementById("btn-open-chests");
      if (!btn || btn.classList.contains("is-nudge")) return;
      btn.classList.add("is-nudge");
      setTimeout(function () {
        btn.classList.remove("is-nudge");
      }, 220);
    }

    /** Claim coffre régulier — timestamp d'abord (anti double-claim), puis reveal existant. */
    function onRegularChestClick() {
      if (isOpeningChest) return;
      if (!isRegularChestReady()) {
        nudgeCooldownChest();
        return;
      }
      /* Lock immédiat avant roll / anim */
      gameState.nextFreeChestAt = Date.now() + FREE_CHEST_COOLDOWN_MS;
      saveGame(true);
      updateRegularChestUI();

      const zoneId = getFreeChestZoneId();
      startChestOpening(zoneId, FREE_CHEST_TYPE, { skipInventory: true });
    }

    function getChestMenuZones() {
      const inv = ensureChestInventory();
      return getChestZoneIds().filter((zoneId) =>
        isZoneUnlocked(gameState, zoneId) ||
        getChestTypeOrder().some((type) => (inv[zoneId] && inv[zoneId][type] > 0))
      );
    }

    function pickDefaultChestSelection(zoneId) {
      const types = getChestTypeOrder();
      for (let i = 0; i < types.length; i++) {
        if (getChestCount(zoneId, types[i]) > 0) return types[i];
      }
      return "draconic";
    }

    function ensureChestSelection() {
      const zones = getChestMenuZones();
      if (!zones.length) {
        selectedChestZoneId = "sanctuary";
        selectedChestType = "draconic";
        return;
      }
      if (zones.indexOf(selectedChestZoneId) < 0) {
        selectedChestZoneId = zones[0];
      }
      if (getChestTypeOrder().indexOf(selectedChestType) < 0) {
        selectedChestType = "draconic";
      }
      if (getChestCount(selectedChestZoneId, selectedChestType) <= 0) {
        selectedChestType = pickDefaultChestSelection(selectedChestZoneId);
      }
    }

    function selectChestTile(zoneId, chestType) {
      if (!isValidChest(zoneId, chestType)) return;
      selectedChestZoneId = zoneId;
      selectedChestType = chestType;
      const tiles = document.getElementById("chest-tiles");
      if (tiles) {
        tiles.querySelectorAll(".chest-tile").forEach((tile) => {
          const on = tile.dataset.chestType === chestType;
          tile.classList.toggle("is-selected", on);
          tile.setAttribute("aria-selected", on ? "true" : "false");
        });
      }
      updateChestActionPanel();
    }

    function updateChestActionPanel() {
      const def = CHEST_TYPES[selectedChestType];
      const count = getChestCount(selectedChestZoneId, selectedChestType);
      const nameEl = document.getElementById("chest-action-name");
      const openBtn = document.getElementById("btn-chest-open");
      if (nameEl) nameEl.textContent = def ? def.name : "Coffre";
      if (openBtn) openBtn.disabled = count <= 0 || isOpeningChest;
    }

    let chestUiDelegatesBound = false;
    function bindChestUiDelegates() {
      if (chestUiDelegatesBound) return;
      chestUiDelegatesBound = true;
      const tiles = document.getElementById("chest-tiles");
      if (tiles) {
        tiles.addEventListener("click", (e) => {
          const tile = e.target.closest(".chest-tile");
          if (!tile || !tiles.contains(tile)) return;
          const type = tile.dataset.chestType;
          if (!type) return;
          selectChestTile(selectedChestZoneId, type);
        });
      }
      const switchHost = document.getElementById("chest-zone-switch");
      if (switchHost) {
        switchHost.addEventListener("click", (e) => {
          const btn = e.target.closest(".chest-zone-pill");
          if (!btn || !switchHost.contains(btn)) return;
          const zId = btn.dataset.zoneId;
          if (!zId || zId === selectedChestZoneId) return;
          selectedChestZoneId = zId;
          selectedChestType = pickDefaultChestSelection(zId);
          renderChestInventory();
        });
      }
    }

    function renderChestInventory() {
      const tiles = document.getElementById("chest-tiles");
      const switchHost = document.getElementById("chest-zone-switch");
      if (!tiles) return;

      ensureChestSelection();
      const zones = getChestMenuZones();
      const zoneId = selectedChestZoneId;

      if (switchHost) {
        switchHost.innerHTML = "";
        if (zones.length > 1) {
          switchHost.hidden = false;
          zones.forEach((zId) => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.dataset.zoneId = zId;
            btn.className = "chest-zone-pill" + (zId === zoneId ? " is-active" : "");
            btn.textContent = getChestZoneTabLabel(zId);
            switchHost.appendChild(btn);
          });
        } else {
          switchHost.hidden = true;
        }
      }

      tiles.innerHTML = "";
      getChestTypeOrder().forEach((type) => {
        const def = CHEST_TYPES[type];
        if (!def) return;
        const count = getChestCount(zoneId, type);
        const tile = document.createElement("button");
        tile.type = "button";
        tile.dataset.chestType = type;
        tile.className =
          "chest-tile " + def.css +
          (type === selectedChestType ? " is-selected" : "") +
          (count <= 0 ? " is-empty" : "");
        tile.setAttribute("role", "option");
        tile.setAttribute("aria-selected", type === selectedChestType ? "true" : "false");
        tile.setAttribute("aria-label", def.name + ", x" + count);
        tile.innerHTML =
          '<span class="chest-tile-count"></span>' +
          (count > 0 && isChestNew(zoneId, type) ? '<span class="chest-tile-new">Nouveau</span>' : "") +
          '<span class="chest-tile-art"><img alt="" draggable="false" decoding="async" width="96" height="96" /></span>' +
          '<span class="chest-tile-name"></span>';
        tile.querySelector("img").src = def.imageClosed;
        tile.querySelector(".chest-tile-name").textContent = def.name;
        tile.querySelector(".chest-tile-count").textContent = "x" + count;
        tiles.appendChild(tile);
      });

      updateChestActionPanel();
    }

    function openChestModal() {
      const modal = document.getElementById("chest-modal");
      if (!modal) return;
      ensureChestSelection();
      if (getChestCount(selectedChestZoneId, selectedChestType) <= 0) {
        selectedChestType = pickDefaultChestSelection(selectedChestZoneId);
      }
      renderChestInventory();
      modal.classList.remove("hidden");
      syncMobileModalOpenClass();
    }

    function closeChestModal() {
      const modal = document.getElementById("chest-modal");
      if (modal) modal.classList.add("hidden");
      syncMobileModalOpenClass();
    }

    function closeChestReveal() {
      const modal = document.getElementById("chest-reveal-modal");
      if (!modal) return;
      clearChestRevealTimers();
      isOpeningChest = false;
      const flash = document.getElementById("chest-reveal-flash");
      if (flash) flash.classList.remove("is-on");
      const art = document.getElementById("chest-reveal-art");
      if (art) {
        art.className = "chest-reveal-art";
        art.style.transform = "";
      }
      const halo = document.getElementById("chest-reveal-halo");
      if (halo) halo.className = "chest-reveal-halo";
      modal.classList.add("hidden");
      lastChestOpen = null;
      /* Plus de retour auto vers le menu inventaire (coffre régulier Royaume). */
      if (isChestModalOpen()) refreshChestInventoryCounts();
      updateRegularChestUI();
      updateInventoryBadge();
      if (isInventoryPanelOpen() && inventorySessionTab === "chests") renderInventoryPanel();
    }

    function refreshChestInventoryCounts() {
      const tiles = document.getElementById("chest-tiles");
      if (!tiles) {
        updateChestButtonBadge();
        updateChestActionPanel();
        return;
      }
      const zoneId = selectedChestZoneId;
      tiles.querySelectorAll(".chest-tile").forEach((tile) => {
        const type = tile.dataset.chestType;
        if (!type) return;
        const def = CHEST_TYPES[type];
        const count = getChestCount(zoneId, type);
        const countEl = tile.querySelector(".chest-tile-count");
        if (countEl) countEl.textContent = "x" + count;
        tile.classList.toggle("is-empty", count <= 0);
        if (def) tile.setAttribute("aria-label", def.name + ", x" + count);
        const neu = tile.querySelector(".chest-tile-new");
        if (neu && (count <= 0 || !isChestNew(zoneId, type))) neu.remove();
      });
      updateChestActionPanel();
      updateChestButtonBadge();
    }

    function renderChestRewardList(result, opts) {
      opts = opts || {};
      const list = document.getElementById("chest-reveal-rewards");
      if (!list || !result) return;
      list.innerHTML = "";
      list.hidden = false;

      const essenceAmt = Math.max(0, Math.floor(safeNumber(result.essence, 0)));
      if (essenceAmt > 0) {
        const essenceLi = document.createElement("li");
        essenceLi.className = "is-essence" + (opts.stagger ? " is-pending" : "");
        essenceLi.innerHTML =
          '<span class="chest-reward-label">✨ ESSENCE</span><strong>+ ' + formatNumber(essenceAmt) + "</strong>";
        list.appendChild(essenceLi);
      }

      (result.fragments || []).forEach((f) => {
        const amount = Math.max(0, Math.floor(safeNumber(f.amount, 0)));
        if (amount <= 0) return;
        const d = getDragonDef(f.dragonId);
        const li = document.createElement("li");
        li.className = "is-fragment" + (opts.stagger ? " is-pending" : "");
        li.innerHTML =
          '<span class="chest-frag-art"><img alt="" draggable="false" decoding="async" hidden /><span class="dc-emoji"></span></span>' +
          '<span class="chest-frag-meta"><strong>+' + amount + " fragment" + (amount > 1 ? "s" : "") + "</strong>" +
          "<span>" + (d ? d.name : f.dragonId) + "</span></span>";
        const emoji = li.querySelector(".dc-emoji");
        emoji.textContent = (d && d.icon) || "◆";
        if (d && d.image) {
          loadAssetImage(li.querySelector("img"), emoji, getDragonAsset(d, "thumb"), {
            silhouette: false,
            fallbackSrc: d.image
          });
        }
        list.appendChild(li);
      });

      const bonusAmt = Math.max(0, Math.floor(safeNumber(result.bonusEssence, 0)));
      if (bonusAmt > 0) {
        const li = document.createElement("li");
        li.className = "is-muted" + (opts.stagger ? " is-pending" : "");
        li.textContent = "dont +" + formatNumber(bonusAmt) + " Essence (fragments indisponibles)";
        list.appendChild(li);
      }
    }

    function revealChestRewardsProgressive(result) {
      const list = document.getElementById("chest-reveal-rewards");
      const actions = document.getElementById("chest-reveal-actions");
      const ok = document.getElementById("btn-chest-reveal-ok");
      const again = document.getElementById("btn-chest-open-again");
      renderChestRewardList(result, { stagger: !prefersReducedMotion() });
      if (!list) return;

      const items = Array.prototype.slice.call(list.querySelectorAll("li"));
      if (prefersReducedMotion()) {
        items.forEach((li) => li.classList.remove("is-pending"));
      } else {
        items.forEach((li, i) => {
          const delay = i === 0 ? 40 : 150 + Math.max(0, i - 1) * 140;
          const tid = setTimeout(() => li.classList.remove("is-pending"), delay);
          chestRevealTimers.push(tid);
        });
      }

      if (actions) actions.hidden = false;
      if (ok) ok.hidden = false;
      if (again) {
        const canAgain = !!(lastChestOpen && getChestCount(lastChestOpen.zoneId, lastChestOpen.chestType) > 0);
        again.hidden = !canAgain;
      }
      isOpeningChest = false;
      updateChestActionPanel();
    }

    function updateChestRevealAgainButton() {
      const again = document.getElementById("btn-chest-open-again");
      if (!again || !lastChestOpen) {
        if (again) again.hidden = true;
        return;
      }
      again.hidden = getChestCount(lastChestOpen.zoneId, lastChestOpen.chestType) <= 0;
    }

    function playChestOpenSound(chestType) {
      if (!window.AudioManager) return;
      AudioManager.unlock();
      const rarity =
        chestType === "epic" ? "legendary" :
        chestType === "rare" ? "rare" :
        "common";
      const rate =
        chestType === "epic" ? 1.06 :
        chestType === "rare" ? 1.03 :
        1;
      const level = typeof AudioManager.sfx === "function" ? AudioManager.sfx() : 1;
      if (level <= 0) return;
      if (typeof AudioManager.canPlay === "function" && !AudioManager.canPlay("dragonPopup", 160)) return;
      const key = AudioManager.resolveDragonRevealSoundKey
        ? AudioManager.resolveDragonRevealSoundKey(rarity)
        : "common";
      const el = AudioManager.ensureDragonRevealSound
        ? AudioManager.ensureDragonRevealSound(key)
        : null;
      if (!el) {
        playDragonRevealSound(rarity);
        return;
      }
      el.volume = Math.max(0, Math.min(1, (AudioManager.dragonPopupBaseVolume || 0.6) * level));
      try { el.playbackRate = rate; } catch (e) { /* optional */ }
      try { el.currentTime = 0; } catch (e) { /* ignore */ }
      const p = el.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    }

    function getChestOpenParticleCount(chestType) {
      const desktop = chestType === "epic" ? 22 : chestType === "rare" ? 15 : 8;
      if (prefersReducedMotion()) return Math.max(0, Math.round(desktop * 0.25));
      if (isMobileFx()) return Math.max(0, Math.round(desktop * 0.55));
      return desktop;
    }

    function getChestBurstPalette(chestType) {
      if (chestType === "epic") return ["#c98cff", "#f0d078", "#9b6dff", "#e8c36a"];
      if (chestType === "rare") return ["#7eb6ff", "#f0d078", "#a8d4ff", "#d4e8ff"];
      return ["#f0d078", "#e8c36a", "#ffe7a0", "#c9a227"];
    }

    function openSelectedChest() {
      if (isOpeningChest) return;
      ensureChestSelection();
      if (getChestCount(selectedChestZoneId, selectedChestType) <= 0) return;
      startChestOpening(selectedChestZoneId, selectedChestType);
    }

    function startChestOpening(zoneId, chestType, options) {
      options = options || {};
      if (isOpeningChest) return;
      const modal = document.getElementById("chest-reveal-modal");
      const def = CHEST_TYPES[chestType];
      if (!modal || !def) return;
      if (!options.skipInventory && getChestCount(zoneId, chestType) <= 0) return;

      isOpeningChest = true;
      const menuOpenBtn = document.getElementById("btn-chest-open");
      if (menuOpenBtn) menuOpenBtn.disabled = true;
      const againBtn = document.getElementById("btn-chest-open-again");
      if (againBtn) againBtn.disabled = true;

      /* Un seul roll — récompense créditée tout de suite, affichée après l'anim. */
      let result = null;
      if (options.skipInventory) {
        const reward = rollChestReward(zoneId, chestType);
        const granted = grantChestRewards(reward);
        if (granted) {
          calculateProduction();
          saveGame(true);
          result = Object.assign({ zoneId: zoneId, chestType: chestType }, granted);
        }
      } else {
        result = openChest(zoneId, chestType);
      }
      if (!result) {
        isOpeningChest = false;
        if (againBtn) againBtn.disabled = false;
        updateChestActionPanel();
        return;
      }
      if (!options.skipInventory) clearChestNew(zoneId, chestType);
      /* Pas de « Ouvrir encore » pour le coffre régulier (pas d'inventaire). */
      lastChestOpen = options.skipInventory ? null : { zoneId: zoneId, chestType: chestType };
      selectedChestZoneId = zoneId;
      selectedChestType = chestType;
      updateChestButtonBadge();
      if (!options.skipInventory && isChestModalOpen()) refreshChestInventoryCounts();

      const art = document.getElementById("chest-reveal-art");
      const img = document.getElementById("chest-reveal-img");
      const halo = document.getElementById("chest-reveal-halo");
      const list = document.getElementById("chest-reveal-rewards");
      const actions = document.getElementById("chest-reveal-actions");
      const ok = document.getElementById("btn-chest-reveal-ok");
      const again = document.getElementById("btn-chest-open-again");
      const flash = document.getElementById("chest-reveal-flash");
      const titleEl = document.getElementById("chest-reveal-title");
      if (titleEl) titleEl.textContent = def.name;
      document.getElementById("chest-reveal-zone").textContent = getChestZoneLabel(zoneId);
      art.className = "chest-reveal-art " + def.css;
      art.style.transform = "";
      if (halo) halo.className = "chest-reveal-halo " + def.css;
      img.src = def.imageClosed;
      if (list) {
        list.innerHTML = "";
        list.hidden = true;
      }
      if (actions) actions.hidden = true;
      if (ok) ok.hidden = true;
      if (again) {
        again.hidden = true;
        again.disabled = true;
      }
      if (flash) flash.classList.remove("is-on");
      modal.classList.remove("hidden");
      playSound("button");

      clearChestRevealTimers();
      const reduced = prefersReducedMotion();

      /* Timing ~1.2–1.6s — reduced-motion : fade + reveal raccourcis */
      const tZoom = reduced ? 0 : 0;
      const tShake = reduced ? 0 : 250;
      const tHalo = reduced ? 0 : 520;
      const tFlash = reduced ? 0 : 820;
      const tOpen = reduced ? 80 : 960;
      const tRewards = reduced ? 160 : 1120;

      chestRevealTimers.push(setTimeout(() => {
        art.classList.add(reduced ? "is-open-soft" : "is-zoom");
      }, tZoom));

      if (!reduced) {
        chestRevealTimers.push(setTimeout(() => {
          art.classList.add("is-shaking");
        }, tShake));

        chestRevealTimers.push(setTimeout(() => {
          if (halo) halo.classList.add("is-on");
        }, tHalo));
      }

      chestRevealTimers.push(setTimeout(() => {
        if (flash) {
          flash.classList.add("is-on");
          const flashOff = setTimeout(() => flash.classList.remove("is-on"), reduced ? 40 : 120);
          chestRevealTimers.push(flashOff);
        }
      }, tFlash));

      chestRevealTimers.push(setTimeout(() => {
        art.classList.remove("is-zoom", "is-shaking", "is-open-soft");
        art.classList.add("is-open");
        img.src = def.imageOpen;
        if (titleEl) titleEl.textContent = def.name + " ouvert";
        playChestOpenSound(chestType);
        pulseHudEssence();
        if (!reduced && window.DCAnim && DCAnim.burst) {
          const r = art.getBoundingClientRect();
          const count = getChestOpenParticleCount(chestType);
          if (count > 0) {
            DCAnim.burst(r.left + r.width / 2, r.top + r.height / 2, {
              count: count,
              palette: getChestBurstPalette(chestType),
              life: chestType === "epic" ? 560 : 480,
              size: chestType === "epic" ? 3.0 : 2.6,
              speed: 2.15
            });
          }
        }
      }, tOpen));

      chestRevealTimers.push(setTimeout(() => {
        if (again) again.disabled = false;
        revealChestRewardsProgressive(result);
      }, tRewards));
    }

    function describeExpeditionRewardLines(result) {
      const lines = [];
      if (!result) return lines;
      if (result.power > 0) lines.push("+" + formatNumber(result.power) + " Essence Draconique");
      if (result.rarePower > 0) lines.push("+" + formatNumber(result.rarePower) + " bonus rare");
      (result.fragments || []).forEach((f) => {
        const d = getDragonDef(f.dragonId);
        lines.push("+" + f.amount + " fragments " + (d ? d.name : f.dragonId));
      });
      const chestDrop = sanitizeExpeditionChest(result.chest);
      if (chestDrop && CHEST_TYPES[chestDrop.type]) lines.push("+1 " + CHEST_TYPES[chestDrop.type].name);
      if (!lines.length) lines.push("Quelques ressources modestes");
      return lines;
    }

    function resetExpeditionPrepare(expeditionId) {
      expeditionUi.mode = "prepare";
      expeditionUi.selectedExpeditionId = expeditionId;
      expeditionUi.selectedDragons = [];
      expeditionPreparePickerOpen = false;
      expeditionsDirty = true;
      renderExpeditions();
    }

    function leaveExpeditionPrepare() {
      expeditionUi.mode = "list";
      expeditionUi.selectedExpeditionId = null;
      expeditionUi.selectedDragons = [];
      expeditionPreparePickerOpen = false;
      expeditionsDirty = true;
      if (expeditionReturnTarget === "threats") {
        /* Hold : Préparation → Menaces sans flash HUD mobile */
        menuBackdropHold = true;
        closeExpeditionDrawer({ skipHubReturn: true });
        openExpeditionThreatsPanel();
        menuBackdropHold = false;
        updateMenuBackdrop();
        return;
      }
      renderExpeditions();
      updateExpeditionHallChrome();
    }

    function updateContractsCountdownUi() {
      const el = document.getElementById("exp-contracts-countdown");
      if (!el) return;
      el.textContent = formatContractCountdown(getMsUntilNextContractRollover());
    }

    function renderExpeditionContractsPanel() {
      const root = document.getElementById("expedition-contracts-root");
      if (!root) return;
      ensureExpeditionState();
      checkDailyContractsRollover();
      const contracts = ensureDailyContracts(false);
      root.innerHTML = "";

      const meta = document.createElement("div");
      meta.className = "exp-contracts-meta";
      meta.innerHTML =
        '<p class="exp-subpanel-hint">Les contrats sont renouvelés chaque jour.</p>' +
        '<p class="exp-contracts-renewal">Renouvellement dans <strong id="exp-contracts-countdown">--:--:--</strong></p>';
      root.appendChild(meta);
      updateContractsCountdownUi();

      const grid = document.createElement("div");
      grid.className = "exp-contracts-grid";
      contracts.forEach((c) => {
        const rarityMeta = getContractRarityMeta(c.rarity);
        const card = document.createElement("article");
        const isReady = c.status === "ready" && !c.claimed;
        const isClaimed = c.claimed || c.status === "claimed";
        card.className =
          "exp-contract-card " +
          (rarityMeta.css || "rarity-common") +
          (isReady ? " is-ready" : "") +
          (isClaimed ? " is-claimed" : "");
        const pct = Math.max(
          0,
          Math.min(100, (safeNumber(c.progress, 0) / Math.max(1, c.target)) * 100)
        );
        card.innerHTML =
          '<div class="exp-contract-rarity-row">' +
            '<span class="exp-contract-gem" aria-hidden="true"></span>' +
            '<span class="exp-contract-rarity-label"></span>' +
          "</div>" +
          '<div class="exp-contract-top">' +
            '<h3 class="exp-contract-title"></h3>' +
            '<span class="exp-contract-status"></span>' +
          "</div>" +
          '<p class="exp-contract-desc"></p>' +
          '<div class="exp-contract-progress">' +
            '<div class="exp-contract-bar"><div class="exp-contract-fill"></div></div>' +
            '<strong class="exp-contract-count"></strong>' +
          "</div>" +
          '<div class="exp-contract-foot">' +
            '<span class="exp-contract-reward"></span>' +
            '<div class="exp-contract-action"></div>' +
          "</div>";
        card.querySelector(".exp-contract-rarity-label").textContent = (
          rarityMeta.label || "Commun"
        ).toUpperCase();
        card.querySelector(".exp-contract-title").textContent = c.title;
        card.querySelector(".exp-contract-desc").textContent = c.description;
        card.querySelector(".exp-contract-fill").style.width = pct.toFixed(1) + "%";
        card.querySelector(".exp-contract-count").textContent =
          safeNumber(c.progress, 0) + " / " + c.target;
        card.querySelector(".exp-contract-reward").textContent =
          "Récompense : " + describeContractReward(c.reward);
        const statusEl = card.querySelector(".exp-contract-status");
        const action = card.querySelector(".exp-contract-action");
        if (isClaimed) {
          statusEl.textContent = "Récupéré";
        } else if (isReady) {
          statusEl.textContent = "Terminé";
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "btn expedition-launch exp-contract-claim";
          btn.textContent = "Récupérer";
          btn.addEventListener("click", () => {
            const res = claimContract(c.id);
            if (res && res.ok) renderExpeditionContractsPanel();
          });
          action.appendChild(btn);
        } else {
          statusEl.textContent = "En cours";
        }
        grid.appendChild(card);
      });
      root.appendChild(grid);
    }

    function renderExpeditionThreatsPanel() {
      const root = document.getElementById("expedition-threats-root");
      if (!root) return;
      ensureExpeditionState();
      root.innerHTML = "";
      const threat = getActiveThreat();
      if (!threat) {
        const empty = document.createElement("div");
        empty.className = "exp-threat-empty";
        empty.innerHTML =
          '<p class="exp-threat-empty-title">Aucune menace détectée</p>' +
          '<p class="exp-subpanel-hint">Terminez des expéditions pour découvrir des créatures dangereuses.</p>';
        root.appendChild(empty);
        return;
      }
      const card = document.createElement("article");
      card.className = "exp-threat-card";
      const media = document.createElement("div");
      media.className = "exp-threat-media";
      media.innerHTML = '<img alt="" draggable="false" decoding="async" />';
      applyExpeditionImage(media.querySelector("img"), threat.image, threat.name);
      card.appendChild(media);
      const body = document.createElement("div");
      body.className = "exp-threat-body";
      body.innerHTML =
        '<p class="exp-threat-kicker">Menace détectée</p>' +
        '<h3 class="exp-threat-title"></h3>' +
        '<p class="exp-threat-region"></p>' +
        '<div class="exp-threat-meta">' +
          '<span class="expedition-chip-meta">Durée <strong></strong></span>' +
          '<span class="expedition-chip-meta">PD conseillée <strong></strong></span>' +
        "</div>" +
        '<p class="exp-threat-reward">Récompenses améliorées</p>' +
        '<div class="exp-threat-action"></div>';
      body.querySelector(".exp-threat-title").textContent = threat.name;
      body.querySelector(".exp-threat-region").textContent =
        "Région — " + getExpeditionZoneLabel(threat.zoneId);
      const strongs = body.querySelectorAll(".expedition-chip-meta strong");
      strongs[0].textContent = formatDuration(threat.durationMs);
      strongs[1].textContent = formatNumber(threat.recommendedPower);
      const action = body.querySelector(".exp-threat-action");
      if (threat.state === "running") {
        const busy = getBusyExpeditionRun();
        const p = document.createElement("p");
        p.className = "exp-threat-running";
        if (busy && busy.run && busy.run.expeditionId === threat.id) {
          p.textContent = busy.run.resolved
            ? "Menace terminée — récupérez la récompense dans le Hall."
            : "En cours — " + formatCountdown(getExpeditionRemainingTime(busy.run));
        } else {
          p.textContent = "Menace en cours.";
        }
        action.appendChild(p);
      } else {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "btn expedition-launch exp-threat-prepare";
        btn.textContent = "Préparer";
        btn.addEventListener("click", () => prepareThreatFromMenu());
        action.appendChild(btn);
      }
      card.appendChild(body);
      root.appendChild(card);
    }

    function getExpeditionOutlookFromChance(chance) {
      const c = safeNumber(chance, 0);
      if (c >= 1) return { label: "Très favorable", tone: "is-good" };
      if (c >= 0.8) return { label: "Favorable", tone: "is-mid" };
      if (c >= 0.6) return { label: "Correct", tone: "is-mid" };
      return { label: "Risqué", tone: "is-bad" };
    }

    function updateExpeditionHallChrome() {
      const titleEl = document.querySelector(".expedition-hall-title");
      const backBtn = document.getElementById("expedition-drawer-back");
      const drawer = document.getElementById("expedition-drawer");
      const inPrepare =
        expeditionUi.mode === "prepare" && !!expeditionUi.selectedExpeditionId;
      const def = inPrepare ? getExpeditionDef(expeditionUi.selectedExpeditionId) : null;
      if (titleEl) {
        titleEl.textContent = def && def.name ? def.name : "Hall des Expéditions";
      }
      if (backBtn) {
        const showBack =
          inPrepare || expeditionReturnToHub || expeditionReturnTarget === "threats";
        backBtn.hidden = !showBack;
        backBtn.setAttribute(
          "aria-label",
          inPrepare
            ? (expeditionReturnTarget === "threats"
              ? "Retour aux Menaces"
              : "Retour au Hall des Expéditions")
            : "Retour au hub Expéditions"
        );
        backBtn.dataset.prepareBack = inPrepare ? "1" : "0";
      }
      if (drawer) drawer.classList.toggle("is-prepare", inPrepare);
    }

    function toggleExpeditionDragon(dragonId) {
      const def = getExpeditionDef(expeditionUi.selectedExpeditionId);
      if (!def) return;
      if (!isDragonAvailableForExpedition(dragonId)) {
        const avail = getDragonAvailability(dragonId);
        if (avail === "ACTIVE_TEAM") {
          showNotification("🧭 Expédition", "Ce dragon est dans l'équipe active. Retirez-le avant de l'envoyer.");
        } else if (avail === "EXPEDITION") {
          showNotification("🧭 Expédition", "Ce dragon est déjà en expédition.");
        }
        return;
      }
      const idx = expeditionUi.selectedDragons.indexOf(dragonId);
      if (idx !== -1) {
        expeditionUi.selectedDragons.splice(idx, 1);
      } else {
        if (expeditionUi.selectedDragons.length >= EXPEDITION_PARTY_MAX) {
          showNotification("🧭 Expédition", "Maximum " + EXPEDITION_PARTY_MAX + " dragons.");
          return;
        }
        expeditionUi.selectedDragons.push(dragonId);
      }
      expeditionsDirty = true;
      renderExpeditions();
    }

    function encodeAssetPath(path) {
      if (!path) return "";
      return String(path).split("/").map(encodeURIComponent).join("/");
    }

    const EXPEDITION_IMAGE_FALLBACK = "assets/expedition/background expedition.png";

    function applyExpeditionImage(imgEl, imagePath, label) {
      if (!imgEl) return;
      const path = imagePath || EXPEDITION_IMAGE_FALLBACK;
      imgEl.alt = label || "";
      imgEl.draggable = false;
      imgEl.onerror = function () {
        if (imgEl.dataset.expeditionImgFallback === "1") return;
        imgEl.dataset.expeditionImgFallback = "1";
        console.warn("[Expedition] Image introuvable :", path);
        imgEl.src = encodeAssetPath(EXPEDITION_IMAGE_FALLBACK);
      };
      imgEl.src = encodeAssetPath(path);
    }

    function preloadExpeditionImagesForCurrentZone() {
      const paths = {};
      getVisibleExpeditions().forEach((def) => {
        if (def.image) paths[def.image] = true;
      });
      const busy = getBusyExpeditionRun();
      if (busy && busy.run) {
        const activeDef = getExpeditionDef(busy.run.expeditionId);
        if (activeDef && activeDef.image) paths[activeDef.image] = true;
      }
      Object.keys(paths).forEach((path) => {
        const img = new Image();
        img.src = encodeAssetPath(path);
      });
    }

    function isExpeditionLocked(def, state) {
      state = state || gameState;
      if (!def) return true;
      const req = def.requirements || {};
      if (req.minDragonPower != null && getPlayerDragonPower(state) < req.minDragonPower) return true;
      if (req.requiresExpeditionId) {
        /* reserved for later progression gates */
      }
      return !!def.locked;
    }

    function getExpeditionCardStatus(def, busy) {
      if (isExpeditionLocked(def)) return "locked";
      if (busy && busy.run && busy.run.expeditionId === def.id) {
        if (busy.run.resolved && !busy.run.claimed) return "done";
        if (!busy.run.resolved) return "running";
      }
      return "idle";
    }

    function renderExpeditions() {
      const root = document.getElementById("expeditions-root");
      if (!root) return;
      ensureExpeditionState();
      tickExpeditions();

      root.innerHTML = "";
      updateExpeditionHallSummary();
      updateExpeditionHallChrome();

      if (!areExpeditionsUnlocked()) {
        hideExpeditionRewardsTip(true);
        root.appendChild(buildExpeditionUnlockGate());
        expeditionsDirty = false;
        return;
      }

      if (expeditionUi.mode === "prepare" && expeditionUi.selectedExpeditionId) {
        hideExpeditionRewardsTip(true);
        const summary = document.getElementById("expedition-hall-summary");
        if (summary) summary.hidden = true;
        root.appendChild(buildExpeditionPrepareView());
        expeditionsDirty = false;
        return;
      }

      root.appendChild(buildExpeditionListView());
      expeditionsDirty = false;
      if (expeditionRewardsTip.openId) {
        const btn = root.querySelector(
          '[data-action="expedition-rewards-tip"][data-expedition-id="' +
            expeditionRewardsTip.openId + '"]'
        );
        if (btn) {
          expeditionRewardsTip.trigger = btn;
          fillExpeditionRewardsTip(expeditionRewardsTip.openId);
          positionExpeditionRewardsTip(btn);
          btn.setAttribute("aria-expanded", "true");
        } else {
          hideExpeditionRewardsTip(true);
        }
      }
    }

    function buildExpeditionUnlockGate() {
      const wrap = document.createElement("div");
      wrap.className = "expedition-unlock-gate";

      const ico = document.createElement("div");
      ico.className = "expedition-unlock-ico";
      ico.textContent = "⛺";
      wrap.appendChild(ico);

      const title = document.createElement("h3");
      title.className = "expedition-unlock-title";
      title.textContent = "Camp d'expédition";
      wrap.appendChild(title);

      const desc = document.createElement("p");
      desc.className = "expedition-unlock-desc";
      desc.textContent =
        "Débloquez les expéditions pour envoyer vos dragons explorer des terres lointaines.";
      wrap.appendChild(desc);

      const price = document.createElement("p");
      price.className = "expedition-unlock-price";
      price.textContent = "Prix : " + formatNumber(EXPEDITION_CAMP_COST) + " Essence";
      wrap.appendChild(price);

      const canBuy = safeNumber(gameState.dragonEssence, 0) >= EXPEDITION_CAMP_COST;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "expedition-unlock-btn" + (canBuy ? "" : " is-disabled");
      btn.textContent = "DÉBLOQUER";
      btn.disabled = !canBuy;
      btn.addEventListener("click", () => {
        if (buyExpeditionCamp()) {
          openExpeditionDrawer();
        }
      });
      wrap.appendChild(btn);

      return wrap;
    }

    function buildExpeditionListView() {
      const wrap = document.createElement("div");
      wrap.className = "expedition-list";

      const zone = getCurrentZone();
      const zoneLabel = document.createElement("p");
      zoneLabel.className = "expedition-zone-label";
      zoneLabel.textContent = "Zone — " + zone.name;
      wrap.appendChild(zoneLabel);

      const busy = getBusyExpeditionRun();
      const defs = getVisibleExpeditions();
      const shownIds = {};

      buildExpeditionDestinationCard._i = 0;

      if (busy && busy.run) {
        const activeDef = getExpeditionDef(busy.run.expeditionId);
        if (activeDef && activeDef.zoneId !== zone.id) {
          const activeHead = document.createElement("p");
          activeHead.className = "expedition-zone-label";
          activeHead.textContent = "Expédition en cours";
          wrap.appendChild(activeHead);
          wrap.appendChild(buildExpeditionDestinationCard(activeDef, busy, {
            foreignActive: true
          }));
          shownIds[activeDef.id] = true;
        }
      }

      if (!defs.length && !Object.keys(shownIds).length) {
        const empty = document.createElement("p");
        empty.className = "expedition-list-hint";
        empty.textContent = "Aucune expédition disponible dans cette zone.";
        wrap.appendChild(empty);
        return wrap;
      }

      defs.forEach((def) => {
        if (shownIds[def.id]) return;
        wrap.appendChild(buildExpeditionDestinationCard(def, busy));
      });
      expeditionIntroAnimPending = false;
      return wrap;
    }

    function prefersFineHover() {
      return !!(window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches);
    }

    function getExpeditionTooltipPowerContext(def) {
      const recommended = Math.max(1, safeNumber(def && def.recommendedPower, 1));
      const busy = getBusyExpeditionRun();
      if (busy && busy.run && def && busy.run.expeditionId === def.id) {
        return {
          teamPower: Math.max(0, safeNumber(busy.run.teamPower, 0)),
          recommendedPower: Math.max(1, safeNumber(busy.run.recommendedPower, recommended)),
          frozen: true
        };
      }
      if (
        def &&
        expeditionUi.selectedExpeditionId === def.id &&
        Array.isArray(expeditionUi.selectedDragons) &&
        expeditionUi.selectedDragons.length
      ) {
        return {
          teamPower: calculateExpeditionTeamPower(expeditionUi.selectedDragons),
          recommendedPower: recommended,
          frozen: false
        };
      }
      const teamIds = (typeof getTeam === "function" ? getTeam() : []).filter(Boolean);
      return {
        teamPower: calculateExpeditionTeamPower(teamIds),
        recommendedPower: recommended,
        frozen: false
      };
    }

    function ensureExpeditionRewardsTip() {
      if (expeditionRewardsTip.el) return expeditionRewardsTip.el;
      const el = document.createElement("div");
      el.id = "expedition-rewards-tip";
      el.className = "expedition-rewards-tip is-hidden";
      el.setAttribute("role", "tooltip");
      el.hidden = true;
      /* pointer-events:none sur le tip — pas de hover bridge via la popup */
      const host = document.getElementById("expedition-drawer") || document.body;
      host.appendChild(el);
      expeditionRewardsTip.el = el;
      return el;
    }

    function hideExpeditionRewardsTip(immediate) {
      if (expeditionRewardsTip.hideTimer) {
        clearTimeout(expeditionRewardsTip.hideTimer);
        expeditionRewardsTip.hideTimer = 0;
      }
      const el = expeditionRewardsTip.el;
      if (el) {
        el.classList.add("is-hidden");
        el.hidden = true;
      }
      if (expeditionRewardsTip.trigger) {
        expeditionRewardsTip.trigger.setAttribute("aria-expanded", "false");
      }
      expeditionRewardsTip.openId = null;
      expeditionRewardsTip.pinned = false;
      expeditionRewardsTip.trigger = null;
      if (immediate) { /* no-op: already cleared */ }
    }

    function scheduleHideExpeditionRewardsTip() {
      if (expeditionRewardsTip.hideTimer) clearTimeout(expeditionRewardsTip.hideTimer);
      expeditionRewardsTip.hideTimer = setTimeout(() => {
        expeditionRewardsTip.hideTimer = 0;
        hideExpeditionRewardsTip(true);
      }, 120);
    }

    function fillExpeditionRewardsTip(expeditionId) {
      const el = ensureExpeditionRewardsTip();
      const def = getExpeditionDef(expeditionId);
      if (!def) {
        el.innerHTML = "";
        return;
      }
      const cfg = def.rewardConfig || {};
      const powerCtx = getExpeditionTooltipPowerContext(def);
      const teamPower = powerCtx.teamPower;
      const rec = powerCtx.recommendedPower;
      const qualityLabel = getChestQualityLabel(teamPower, rec);
      const baseWeights = cfg.chestWeights || null;
      const adjusted = baseWeights
        ? getAdjustedChestRarityChances(baseWeights, teamPower, rec)
        : null;

      const rows = [];
      const pMin = Math.floor(safeNumber(cfg.powerMin, 0));
      const pMax = Math.floor(safeNumber(cfg.powerMax, 0));
      if (pMax > 0 || pMin > 0) {
        rows.push(
          '<div class="ert-row">' +
            '<span class="ert-label">🔥 Essence</span>' +
            '<span class="ert-value">' + formatNumber(pMin) + " – " + formatNumber(pMax) + "</span>" +
          "</div>"
        );
      }
      const fragChance = safeNumber(cfg.fragmentChance, 0);
      if (fragChance > 0) {
        rows.push(
          '<div class="ert-row">' +
            '<span class="ert-label">💎 Fragment</span>' +
            '<span class="ert-value">' + Math.round(fragChance * 100) + " %</span>" +
          "</div>"
        );
      }
      const chestChance = safeNumber(cfg.chestChance, 0);
      if (chestChance > 0) {
        rows.push(
          '<div class="ert-row">' +
            '<span class="ert-label">📦 Coffre</span>' +
            '<span class="ert-value">' + Math.round(chestChance * 100) + " %</span>" +
          "</div>"
        );
      }

      let qualityBlock = "";
      if (adjusted && baseWeights) {
        const items = [
          { key: "draconic", label: (CHEST_TYPES.draconic && CHEST_TYPES.draconic.name) || "Coffre de base" },
          { key: "rare", label: (CHEST_TYPES.rare && CHEST_TYPES.rare.name) || "Coffre Rare" },
          { key: "epic", label: (CHEST_TYPES.epic && CHEST_TYPES.epic.name) || "Coffre Épique" }
        ];
        qualityBlock =
          '<div class="ert-section">Qualité du coffre</div>' +
          items.map((it) => {
            const cur = Math.max(0, safeNumber(adjusted[it.key], 0));
            const base = Math.max(0, safeNumber(baseWeights[it.key], 0));
            let tone = "is-neutral";
            if (cur > base) tone = "is-up";
            else if (cur < base) tone = "is-down";
            return (
              '<div class="ert-row ert-quality">' +
                '<span class="ert-label">' + it.label + "</span>" +
                '<span class="ert-value ' + tone + '">' + cur + " %</span>" +
              "</div>"
            );
          }).join("");
      }

      el.innerHTML =
        '<div class="ert-title">Récompenses possibles</div>' +
        (rows.length ? '<div class="ert-block">' + rows.join("") + "</div>" : "") +
        qualityBlock +
        '<div class="ert-footer">' +
          '<div class="ert-row">' +
            '<span class="ert-label">⚔ Puissance</span>' +
            '<span class="ert-value">' + formatNumber(teamPower) + " / " + formatNumber(rec) + "</span>" +
          "</div>" +
          '<div class="ert-row">' +
            '<span class="ert-label">✦ Qualité</span>' +
            '<span class="ert-value ert-quality-label">' + String(qualityLabel).toUpperCase() + "</span>" +
          "</div>" +
        "</div>";
    }

    function positionExpeditionRewardsTip(trigger) {
      const el = ensureExpeditionRewardsTip();
      if (!trigger || !el) return;
      el.hidden = false;
      el.classList.remove("is-hidden");
      el.style.left = "0px";
      el.style.top = "0px";
      const tipRect = el.getBoundingClientRect();
      const btnRect = trigger.getBoundingClientRect();
      const drawer = document.getElementById("expedition-drawer");
      const bounds = drawer
        ? drawer.getBoundingClientRect()
        : { left: 8, top: 8, right: window.innerWidth - 8, bottom: window.innerHeight - 8, width: window.innerWidth };
      const gap = 8;
      let left = btnRect.left + (btnRect.width - tipRect.width) / 2;
      let top = btnRect.top - tipRect.height - gap;
      if (top < bounds.top + 6) {
        top = btnRect.bottom + gap;
      }
      const minL = bounds.left + 6;
      const maxL = bounds.right - tipRect.width - 6;
      left = Math.max(minL, Math.min(left, Math.max(minL, maxL)));
      const maxT = Math.max(bounds.top + 6, bounds.bottom - tipRect.height - 6);
      top = Math.max(bounds.top + 6, Math.min(top, maxT));
      el.style.left = Math.round(left) + "px";
      el.style.top = Math.round(top) + "px";
    }

    function showExpeditionRewardsTip(trigger, opts) {
      opts = opts || {};
      if (!trigger) return;
      const expeditionId = trigger.dataset.expeditionId;
      if (!expeditionId) return;
      if (expeditionRewardsTip.hideTimer) {
        clearTimeout(expeditionRewardsTip.hideTimer);
        expeditionRewardsTip.hideTimer = 0;
      }
      if (expeditionRewardsTip.trigger && expeditionRewardsTip.trigger !== trigger) {
        expeditionRewardsTip.trigger.setAttribute("aria-expanded", "false");
      }
      expeditionRewardsTip.openId = expeditionId;
      expeditionRewardsTip.trigger = trigger;
      expeditionRewardsTip.pinned = !!opts.pinned;
      fillExpeditionRewardsTip(expeditionId);
      positionExpeditionRewardsTip(trigger);
      trigger.setAttribute("aria-expanded", "true");
    }

    function bindExpeditionRewardsTipDelegates() {
      const expRoot = document.getElementById("expeditions-root");
      if (!expRoot || expRoot.dataset.rewardsTipBound) return;
      expRoot.dataset.rewardsTipBound = "1";

      /*
        mouseover/out ciblés : le trigger Récompenses est désormais en width:max-content
        (plus de flex:1). On ignore tout hover hors de ce bouton.
      */
      expRoot.addEventListener("mouseover", (ev) => {
        if (!prefersFineHover()) return;
        const btn = ev.target.closest('[data-action="expedition-rewards-tip"]');
        if (!btn || !expRoot.contains(btn)) return;
        const from = ev.relatedTarget;
        if (from && btn.contains(from)) return;
        showExpeditionRewardsTip(btn, { pinned: false });
      });

      expRoot.addEventListener("mouseout", (ev) => {
        if (!prefersFineHover()) return;
        const btn = ev.target.closest('[data-action="expedition-rewards-tip"]');
        if (!btn || !expRoot.contains(btn)) return;
        const to = ev.relatedTarget;
        if (to && btn.contains(to)) return;
        if (expeditionRewardsTip.trigger === btn && !expeditionRewardsTip.pinned) {
          hideExpeditionRewardsTip(true);
        }
      });

      expRoot.addEventListener("click", (ev) => {
        const btn = ev.target.closest('[data-action="expedition-rewards-tip"]');
        if (!btn || !expRoot.contains(btn)) return;
        ev.preventDefault();
        ev.stopPropagation();
        if (prefersFineHover()) {
          showExpeditionRewardsTip(btn, { pinned: false });
          return;
        }
        if (
          expeditionRewardsTip.openId === btn.dataset.expeditionId &&
          expeditionRewardsTip.pinned
        ) {
          hideExpeditionRewardsTip(true);
          return;
        }
        showExpeditionRewardsTip(btn, { pinned: true });
      });

      document.addEventListener("click", (ev) => {
        if (!expeditionRewardsTip.openId) return;
        if (ev.target.closest && ev.target.closest('[data-action="expedition-rewards-tip"]')) return;
        hideExpeditionRewardsTip(true);
      }, true);

      const hallScroll = document.querySelector(".expedition-hall-scroll");
      if (hallScroll && !hallScroll.dataset.rewardsTipScrollBound) {
        hallScroll.dataset.rewardsTipScrollBound = "1";
        hallScroll.addEventListener("scroll", () => {
          if (expeditionRewardsTip.openId) hideExpeditionRewardsTip(true);
        }, { passive: true });
      }

      window.addEventListener("resize", () => {
        if (expeditionRewardsTip.openId && expeditionRewardsTip.trigger) {
          positionExpeditionRewardsTip(expeditionRewardsTip.trigger);
        }
      });
    }

    function buildExpeditionDestinationCard(def, busy, opts) {
      opts = opts || {};
      const status = getExpeditionCardStatus(def, busy);
      const card = document.createElement("article");
      card.className = "expedition-card";
      card.dataset.expeditionId = def.id;
      if (expeditionIntroAnimPending && !prefersReducedMotion()) {
        card.classList.add("anim-slide-in");
        card.style.animationDelay = (safeNumber(buildExpeditionDestinationCard._i, 0) * 50) + "ms";
        buildExpeditionDestinationCard._i = safeNumber(buildExpeditionDestinationCard._i, 0) + 1;
      }
      if (status === "locked") card.classList.add("is-locked");
      if (status === "running") card.classList.add("is-running");
      if (status === "done") card.classList.add("is-done");

      const media = document.createElement("div");
      media.className = "expedition-card-media";
      const img = document.createElement("img");
      img.loading = "eager";
      applyExpeditionImage(img, def.image, def.name);
      media.appendChild(img);
      const overlay = document.createElement("div");
      overlay.className = "expedition-card-overlay";
      media.appendChild(overlay);
      card.appendChild(media);

      if (status !== "idle") {
        const badge = document.createElement("div");
        badge.className = "expedition-card-badge " + status;
        badge.textContent =
          status === "locked" ? "Verrouillée" :
          status === "running" ? "En cours" :
          "Terminée";
        card.appendChild(badge);
      }

      const body = document.createElement("div");
      body.className = "expedition-card-body";

      const title = document.createElement("h3");
      title.className = "expedition-card-title";
      title.textContent = def.name;
      body.appendChild(title);

      if (opts.foreignActive || (status !== "idle" && def.zoneId !== getCurrentZone().id)) {
        const origin = document.createElement("p");
        origin.className = "expedition-card-origin";
        origin.textContent = "Zone — " + getExpeditionZoneLabel(def);
        body.appendChild(origin);
      }

      const meta = document.createElement("div");
      meta.className = "expedition-card-meta";
      meta.innerHTML =
        '<span class="expedition-chip-meta">Durée <strong></strong></span>' +
        '<span class="expedition-chip-meta">PD conseillée <strong></strong></span>';
      const metas = meta.querySelectorAll("strong");
      metas[0].textContent = formatDuration(def.durationMs);
      metas[1].textContent = formatNumber(def.recommendedPower);
      body.appendChild(meta);

      if (status === "idle") {
        const powerCtx = getExpeditionTooltipPowerContext(def);
        const teamPower = safeNumber(powerCtx.teamPower, 0);
        let teamCount = 0;
        if (
          def &&
          expeditionUi.selectedExpeditionId === def.id &&
          Array.isArray(expeditionUi.selectedDragons)
        ) {
          teamCount = expeditionUi.selectedDragons.length;
        } else if (typeof getTeam === "function") {
          teamCount = getTeam().filter(Boolean).length;
        }
        const chance = calculateSuccessChance(teamPower, def.recommendedPower);
        const outlook = document.createElement("p");
        outlook.className = "expedition-card-outlook";
        const statusEl = document.createElement("span");
        statusEl.className = "expedition-card-outlook-status";
        if (!teamCount || teamPower <= 0) {
          outlook.classList.add("is-empty");
          outlook.textContent = "Équipe 0/" + EXPEDITION_PARTY_MAX + " ";
          statusEl.textContent = "Aucune équipe";
        } else {
          const outlookInfo = getExpeditionOutlookFromChance(chance);
          outlook.classList.add(outlookInfo.tone);
          outlook.textContent = "Équipe " + formatNumber(teamPower) + " ";
          statusEl.textContent = outlookInfo.label;
        }
        outlook.appendChild(statusEl);
        body.appendChild(outlook);
      }

      if (status === "running" && busy && busy.run) {
        const remaining = getExpeditionRemainingTime(busy.run);
        const total = Math.max(1, safeNumber(busy.run.durationMs, def.durationMs));
        const elapsed = Math.max(0, total - remaining);
        const pct = Math.max(0, Math.min(100, (elapsed / total) * 100));

        const progress = document.createElement("div");
        progress.className = "expedition-card-progress";
        progress.innerHTML =
          '<div class="expedition-card-progress-row">' +
            "<span>Progression</span>" +
            '<strong class="exp-card-timer"></strong>' +
          "</div>" +
          '<div class="expedition-card-progress-bar"><div class="expedition-card-progress-fill"></div></div>';
        progress.querySelector(".exp-card-timer").textContent = formatCountdown(remaining) + " restantes";
        progress.querySelector(".expedition-card-progress-fill").style.width = pct.toFixed(1) + "%";
        body.appendChild(progress);

        const powerLine = document.createElement("p");
        powerLine.className = "expedition-card-claim-msg";
        powerLine.textContent =
          "Puissance équipe : " + formatNumber(safeNumber(busy.run.teamPower, 0)) +
          " / " + formatNumber(safeNumber(busy.run.recommendedPower, def.recommendedPower));
        body.appendChild(powerLine);

        const sent = document.createElement("div");
        sent.className = "expedition-card-sent";
        (busy.run.dragonIds || []).forEach((id) => {
          const d = getDragonDef(id);
          const chip = document.createElement("div");
          chip.className = "expedition-chip";
          chip.textContent = d ? d.name : id;
          sent.appendChild(chip);
        });
        body.appendChild(sent);
      }

      if (status === "done" && busy && busy.run) {
        const result = busy.run.result || { success: false };
        const msg = document.createElement("p");
        msg.className = "expedition-card-claim-msg";
        msg.textContent = result.success
          ? "Mission réussie — récupérez vos butins."
          : "Mission terminée — récupérez ce que vos dragons ont rapporté.";
        body.appendChild(msg);

        const rewardList = document.createElement("ul");
        rewardList.className = "expedition-reward-list expedition-card-rewards";
        describeExpeditionRewardLines(result).forEach((line) => {
          const li = document.createElement("li");
          const chestDrop = sanitizeExpeditionChest(result.chest);
          if (
            chestDrop &&
            CHEST_TYPES[chestDrop.type] &&
            line.indexOf(CHEST_TYPES[chestDrop.type].name) !== -1
          ) {
            const chestDef = CHEST_TYPES[chestDrop.type];
            li.className = "expedition-reward-chest " + chestDef.css;
            li.innerHTML =
              '<img alt="" draggable="false" decoding="async" />' +
              "<span>" + line + "</span>";
            li.querySelector("img").src = chestDef.imageClosed;
          } else {
            li.textContent = line;
          }
          rewardList.appendChild(li);
        });
        body.appendChild(rewardList);
      }

      const actions = document.createElement("div");
      actions.className = "expedition-card-actions";

      const rewardsBtn = document.createElement("button");
      rewardsBtn.type = "button";
      rewardsBtn.className = "expedition-btn-rewards";
      rewardsBtn.dataset.action = "expedition-rewards-tip";
      rewardsBtn.dataset.expeditionId = def.id;
      rewardsBtn.setAttribute("aria-label", "Voir les récompenses possibles");
      rewardsBtn.setAttribute("aria-expanded", "false");
      rewardsBtn.textContent = "🎁 Récompenses";
      actions.appendChild(rewardsBtn);

      if (status === "done" && busy) {
        const claimBtn = document.createElement("button");
        claimBtn.type = "button";
        claimBtn.className = "expedition-btn-claim";
        claimBtn.dataset.action = "claim-expedition";
        claimBtn.dataset.slotIndex = String(busy.slotIndex);
        claimBtn.textContent = "RÉCUPÉRER";
        claimBtn.addEventListener("click", (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          const idx = safeNumber(claimBtn.dataset.slotIndex, busy.slotIndex);
          const res = claimExpedition(idx);
          if (res && res.ok) renderExpeditions();
        });
        actions.appendChild(claimBtn);
      } else if (status === "running") {
        const runBtn = document.createElement("button");
        runBtn.type = "button";
        runBtn.className = "expedition-btn-launch is-status";
        runBtn.textContent = "EN COURS";
        runBtn.disabled = true;
        actions.appendChild(runBtn);
      } else {
        const launchBtn = document.createElement("button");
        launchBtn.type = "button";
        launchBtn.className = "expedition-btn-launch";
        launchBtn.textContent = "LANCER";
        const slotBusy = !!(busy && busy.run && (!busy.run.claimed));
        launchBtn.disabled = status === "locked" || status === "running" || slotBusy;
        launchBtn.addEventListener("click", () => {
          if (launchBtn.disabled) return;
          resetExpeditionPrepare(def.id);
        });
        actions.appendChild(launchBtn);
      }

      body.appendChild(actions);
      card.appendChild(body);
      return card;
    }

    function buildExpeditionPrepareView() {
      const def = getExpeditionDef(expeditionUi.selectedExpeditionId);
      const wrap = document.createElement("div");
      wrap.className = "expedition-prepare";
      if (!def) {
        wrap.textContent = "Expédition introuvable.";
        return wrap;
      }

      const teamPower = calculateExpeditionTeamPower(expeditionUi.selectedDragons);
      const chance = calculateSuccessChance(teamPower, def.recommendedPower);
      const outlook = getExpeditionOutlookFromChance(
        expeditionUi.selectedDragons.length ? chance : 0
      );
      const nSel = expeditionUi.selectedDragons.length;
      const emptyTeam = nSel === 0;

      /* IMAGE */
      const hero = document.createElement("div");
      hero.className = "expedition-prepare-hero";
      hero.innerHTML =
        '<div class="expedition-prepare-media">' +
          '<img alt="" draggable="false" decoding="async" />' +
          '<div class="expedition-prepare-media-fade" aria-hidden="true"></div>' +
        "</div>";
      applyExpeditionImage(hero.querySelector("img"), def.image, def.name);
      wrap.appendChild(hero);

      /* DURÉE + PD */
      const meta = document.createElement("div");
      meta.className = "expedition-prepare-meta";
      meta.innerHTML =
        '<span class="expedition-chip-meta"><strong></strong></span>' +
        '<span class="expedition-chip-meta">PD conseillée <strong></strong></span>';
      const metaStrong = meta.querySelectorAll("strong");
      metaStrong[0].textContent = formatDuration(def.durationMs);
      metaStrong[1].textContent = formatNumber(def.recommendedPower);
      wrap.appendChild(meta);

      /* TON ÉQUIPE */
      const teamSec = document.createElement("section");
      teamSec.className = "expedition-prepare-team";
      const teamTitle = document.createElement("h3");
      teamTitle.className = "expedition-prepare-team-title";
      teamTitle.textContent = "Ton équipe";
      teamSec.appendChild(teamTitle);

      const slots = document.createElement("div");
      slots.className = "expedition-party-slots";
      slots.setAttribute("aria-label", "Emplacements de dragons");
      for (let s = 0; s < EXPEDITION_PARTY_MAX; s++) {
        const dragonId = expeditionUi.selectedDragons[s];
        const slot = document.createElement("button");
        slot.type = "button";
        slot.className = "expedition-party-slot" + (dragonId ? " filled" : " is-empty");
        if (dragonId) {
          const d = getDragonDef(dragonId);
          slot.setAttribute("aria-label", (d ? d.name : dragonId) + " — retirer");
          slot.innerHTML =
            '<span class="eps-art"><img alt="" draggable="false" hidden /><span class="dc-emoji"></span></span>' +
            '<span class="eps-label"></span>' +
            '<span class="eps-remove" aria-hidden="true">✕</span>';
          slot.querySelector(".eps-label").textContent = d ? d.name : dragonId;
          const emoji = slot.querySelector(".dc-emoji");
          emoji.textContent = (d && d.icon) || "🐲";
          if (d) {
            loadAssetImage(slot.querySelector("img"), emoji, getDragonAsset(d, "thumb"), {
              silhouette: false,
              fallbackSrc: d.image
            });
          }
          slot.addEventListener("click", () => toggleExpeditionDragon(dragonId));
        } else {
          slot.setAttribute("aria-label", "Ajouter un dragon");
          slot.innerHTML = '<span class="eps-plus" aria-hidden="true">+</span>';
          slot.addEventListener("click", () => {
            expeditionPreparePickerOpen = true;
            expeditionsDirty = true;
            renderExpeditions();
            const picker = document.querySelector(".expedition-prepare-picker");
            if (picker) picker.scrollIntoView({ block: "nearest", behavior: "smooth" });
          });
        }
        slots.appendChild(slot);
      }
      teamSec.appendChild(slots);

      const powerLine = document.createElement("div");
      powerLine.className =
        "expedition-prepare-power" + (emptyTeam ? " is-empty" : " " + outlook.tone);
      powerLine.innerHTML =
        '<span class="expedition-prepare-power-val">Puissance : <strong></strong></span>' +
        '<span class="expedition-prepare-outlook"><span class="dot" aria-hidden="true">●</span> <span class="label"></span></span>';
      powerLine.querySelector("strong").textContent =
        formatNumber(teamPower) + " / " + formatNumber(def.recommendedPower);
      powerLine.querySelector(".label").textContent = emptyTeam
        ? "Risqué"
        : outlook.label;
      teamSec.appendChild(powerLine);
      wrap.appendChild(teamSec);

      /* RÉCOMPENSES */
      const rewardsRow = document.createElement("div");
      rewardsRow.className = "expedition-prepare-rewards";
      const rewardsBtn = document.createElement("button");
      rewardsBtn.type = "button";
      rewardsBtn.className = "expedition-btn-rewards expedition-prepare-rewards-trigger";
      rewardsBtn.dataset.action = "expedition-rewards-tip";
      rewardsBtn.dataset.expeditionId = def.id;
      rewardsBtn.setAttribute("aria-label", "Voir les récompenses possibles");
      rewardsBtn.setAttribute("aria-expanded", "false");
      rewardsBtn.textContent = "🎁 Récompenses possibles";
      const detailsBtn = document.createElement("button");
      detailsBtn.type = "button";
      detailsBtn.className = "expedition-prepare-details";
      detailsBtn.dataset.action = "expedition-rewards-tip";
      detailsBtn.dataset.expeditionId = def.id;
      detailsBtn.setAttribute("aria-label", "Détails des récompenses");
      detailsBtn.textContent = "Détails ›";
      rewardsRow.appendChild(rewardsBtn);
      rewardsRow.appendChild(detailsBtn);
      wrap.appendChild(rewardsRow);

      /* LANCER */
      const launch = document.createElement("button");
      launch.type = "button";
      launch.className = "btn expedition-launch";
      launch.textContent = "Lancer l'expédition";
      launch.disabled = nSel < EXPEDITION_PARTY_MIN || nSel > EXPEDITION_PARTY_MAX;
      launch.addEventListener("click", () => {
        const res = startExpedition(def.id, expeditionUi.selectedDragons);
        if (!res.ok) {
          showNotification("🧭 Expédition", "Impossible de lancer la mission.");
          return;
        }
        expeditionPreparePickerOpen = false;
        renderExpeditions();
      });
      wrap.appendChild(launch);

      /* PICKER (ouvert via [+]) */
      const picker = document.createElement("section");
      picker.className =
        "expedition-prepare-picker" + (expeditionPreparePickerOpen ? " is-open" : "");
      picker.hidden = !expeditionPreparePickerOpen;
      if (expeditionPreparePickerOpen) {
        const pickerHead = document.createElement("div");
        pickerHead.className = "expedition-prepare-picker-head";
        const pickerTitle = document.createElement("h4");
        pickerTitle.className = "expedition-subtitle";
        pickerTitle.textContent =
          "Choisir un dragon (" + nSel + "/" + EXPEDITION_PARTY_MAX + ")";
        const pickerClose = document.createElement("button");
        pickerClose.type = "button";
        pickerClose.className = "expedition-prepare-picker-close";
        pickerClose.setAttribute("aria-label", "Fermer la sélection");
        pickerClose.textContent = "Fermer";
        pickerClose.addEventListener("click", () => {
          expeditionPreparePickerOpen = false;
          expeditionsDirty = true;
          renderExpeditions();
        });
        pickerHead.appendChild(pickerTitle);
        pickerHead.appendChild(pickerClose);
        picker.appendChild(pickerHead);

        const grid = document.createElement("div");
        grid.className = "expedition-dragon-grid";
        const owned = DRAGON_DEFS.filter((d) =>
          !d.secret && isDragonDiscovered(gameState.dragons[d.id], d.id, gameState)
        );
        if (!owned.length) {
          const p = document.createElement("p");
          p.className = "panel-hint";
          p.textContent = "Aucun dragon découvert.";
          grid.appendChild(p);
        }
        owned.forEach((d) => {
          const entry = gameState.dragons[d.id];
          const stars = Math.max(1, safeNumber(entry.stars, 1));
          const rarity = RARITIES[d.rarity] || RARITIES.common;
          const avail = getDragonAvailability(d.id);
          const selected = expeditionUi.selectedDragons.indexOf(d.id) !== -1;
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className =
            "expedition-dragon " + rarity.css +
            (selected ? " selected" : "") +
            (avail !== "AVAILABLE" ? " locked" : "");
          btn.disabled = avail !== "AVAILABLE" && !selected;
          btn.innerHTML =
            '<span class="ed-art"><img alt="" draggable="false" hidden /><span class="dc-emoji"></span></span>' +
            '<span class="ed-name"></span>' +
            '<span class="ed-rarity"></span>' +
            '<span class="ed-stars"></span>' +
            '<span class="ed-power"></span>' +
            '<span class="ed-status"></span>';
          const emoji = btn.querySelector(".dc-emoji");
          emoji.textContent = d.icon || "🐲";
          loadAssetImage(btn.querySelector("img"), emoji, getDragonAsset(d, "thumb"), {
            silhouette: false,
            fallbackSrc: d.image
          });
          btn.querySelector(".ed-name").textContent = d.name;
          btn.querySelector(".ed-rarity").textContent = rarity.label;
          btn.querySelector(".ed-stars").textContent =
            "★".repeat(stars) + "☆".repeat(MAX_DRAGON_STARS - stars);
          btn.querySelector(".ed-power").textContent =
            "Puissance : " + formatNumber(calculateDragonExpeditionPower(d.id));
          const statusEl = btn.querySelector(".ed-status");
          if (avail === "ACTIVE_TEAM") statusEl.textContent = "Équipe active";
          else if (avail === "EXPEDITION") statusEl.textContent = "En expédition";
          else statusEl.textContent = selected ? "Sélectionné" : "Disponible";
          btn.addEventListener("click", () => {
            const already = expeditionUi.selectedDragons.indexOf(d.id) !== -1;
            if (!already && expeditionUi.selectedDragons.length + 1 >= EXPEDITION_PARTY_MAX) {
              expeditionPreparePickerOpen = false;
            } else {
              expeditionPreparePickerOpen = true;
            }
            toggleExpeditionDragon(d.id);
          });
          grid.appendChild(btn);
        });
        picker.appendChild(grid);
      }
      wrap.appendChild(picker);

      return wrap;
    }

    function buildExpeditionActiveView(run) {
      /* Legacy helper kept for compatibility; list cards now show running state. */
      const def = getExpeditionDef(run.expeditionId);
      const wrap = document.createElement("div");
      wrap.className = "expedition-active";
      const remaining = getExpeditionRemainingTime(run);

      wrap.innerHTML =
        '<div class="expedition-head">' +
          "<h3></h3>" +
          '<p class="expedition-status-label">En cours...</p>' +
        "</div>" +
        '<div class="expedition-timer-block">' +
          "<span>Temps restant</span>" +
          '<strong id="expedition-timer"></strong>' +
        "</div>" +
        '<div class="expedition-stats">' +
          '<div><span>Puissance équipe</span><strong class="ea-power"></strong></div>' +
          '<div><span>Chance de réussite</span><strong class="ea-chance"></strong></div>' +
        "</div>" +
        '<h4 class="expedition-subtitle">Dragons envoyés</h4>' +
        '<div class="expedition-sent"></div>';

      wrap.querySelector("h3").textContent = def ? def.name : "Expédition";
      wrap.querySelector("#expedition-timer").textContent = formatCountdown(remaining);
      wrap.querySelector(".ea-power").textContent = formatNumber(run.teamPower || 0);
      wrap.querySelector(".ea-chance").textContent =
        Math.round(safeNumber(run.successChance, 0) * 100) + " %";

      const sent = wrap.querySelector(".expedition-sent");
      (run.dragonIds || []).forEach((id) => {
        const d = getDragonDef(id);
        const chip = document.createElement("div");
        chip.className = "expedition-chip";
        chip.textContent = d ? d.name : id;
        sent.appendChild(chip);
      });
      return wrap;
    }

    function buildExpeditionClaimView(slotIndex, run) {
      /* Legacy helper kept for compatibility; list cards now show claim state. */
      const def = getExpeditionDef(run.expeditionId);
      const result = run.result || { success: false, power: 0, fragments: [] };
      const wrap = document.createElement("div");
      wrap.className = "expedition-claim";
      wrap.innerHTML =
        '<div class="expedition-head">' +
          "<h3>Expédition terminée</h3>" +
          "<p></p>" +
        "</div>" +
        '<div class="expedition-result-badge"></div>' +
        '<p class="expedition-result-msg"></p>' +
        '<ul class="expedition-reward-list"></ul>';

      wrap.querySelector("p").textContent = def ? def.name : "Mission";
      const badge = wrap.querySelector(".expedition-result-badge");
      badge.textContent = result.success ? "RÉUSSITE" : "ÉCHEC";
      badge.classList.add(result.success ? "ok" : "fail");
      wrap.querySelector(".expedition-result-msg").textContent = result.success
        ? "Vos dragons ont rapporté de belles ressources."
        : "Vos dragons n’ont pas atteint leur objectif, mais ils ont tout de même rapporté quelques ressources.";

      const ul = wrap.querySelector(".expedition-reward-list");
      describeExpeditionRewardLines(result).forEach((line) => {
        const li = document.createElement("li");
        const chestDrop = sanitizeExpeditionChest(result.chest);
        if (
          chestDrop &&
          CHEST_TYPES[chestDrop.type] &&
          line.indexOf(CHEST_TYPES[chestDrop.type].name) !== -1
        ) {
          const chestDef = CHEST_TYPES[chestDrop.type];
          li.className = "expedition-reward-chest " + chestDef.css;
          li.innerHTML =
            '<img alt="" draggable="false" decoding="async" />' +
            "<span>" + line + "</span>";
          li.querySelector("img").src = chestDef.imageClosed;
        } else {
          li.textContent = line;
        }
        ul.appendChild(li);
      });

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn expedition-launch";
      btn.dataset.action = "claim-expedition";
      btn.dataset.slotIndex = String(slotIndex);
      btn.textContent = "Récupérer";
      btn.addEventListener("click", (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        const res = claimExpedition(slotIndex);
        if (res && res.ok) renderExpeditions();
      });
      wrap.appendChild(btn);
      return wrap;
    }

    function renderMobileTeamRail() {
      const host = document.getElementById("mobile-team-slots");
      if (!host) return;
      const buttons = host.querySelectorAll(".mobile-team-slot");
      for (let i = 0; i < TEAM_SIZE; i++) {
        const slot = buttons[i];
        if (!slot) continue;
        const d = getTeamDragon(i);
        slot.className = "mobile-team-slot";
        if (d) {
          const rarity = RARITIES[d.def.rarity] || RARITIES.common;
          slot.classList.add("filled", rarity.css);
          slot.setAttribute("aria-label", "Emplacement " + (i + 1) + " : " + d.def.name);
          slot.innerHTML =
            '<span class="mts-art"><img alt="" draggable="false" decoding="async" hidden /><span class="dc-emoji"></span></span>';
          const emoji = slot.querySelector(".dc-emoji");
          emoji.textContent = d.def.icon || "🐲";
          loadAssetImage(slot.querySelector("img"), emoji, getDragonAsset(d.def, "thumb"), {
            silhouette: false,
            fallbackSrc: d.def.image
          });
        } else {
          slot.classList.add("empty");
          slot.setAttribute("aria-label", "Emplacement " + (i + 1) + " vide — ouvrir l'équipe");
          slot.innerHTML = '<span class="mts-plus" aria-hidden="true">+</span>';
        }
      }
    }

    function renderTeamModule() {
      renderMobileTeamRail();

      const slots = document.getElementById("team-slots");
      const list = document.getElementById("team-bonus-list");
      if (!slots || !list) return;

      const teamMod = document.getElementById("team-module");
      /* Pendant Formation : garder l'état DOM, pas de rebuild/animation derrière. */
      if (teamMod && teamMod.classList.contains("is-picker-open")) return;
      const teamOpen = !!(teamMod && teamMod.classList.contains("open"));
      /* Skip heavy drawer rebuild while closed (rail already updated). */
      if (!teamOpen && slots.childElementCount > 0) return;

      slots.innerHTML = "";
      for (let i = 0; i < TEAM_SIZE; i++) {
        const d = getTeamDragon(i);
        const slot = document.createElement("button");
        slot.type = "button";
        slot.dataset.slot = String(i);
        if (d) {
          const rarity = RARITIES[d.def.rarity] || RARITIES.common;
          slot.className = "team-slot filled " + rarity.css;
          slot.setAttribute("aria-label", "Emplacement " + (i + 1) + " : " + d.def.name);
          slot.innerHTML =
            '<span class="ts-art"><img alt="" draggable="false" decoding="async" hidden /><span class="dc-emoji"></span></span>' +
            '<span class="ts-info">' +
              '<span class="ts-name"></span>' +
              '<span class="ts-stars"></span>' +
              '<span class="ts-bonus"></span>' +
            "</span>";
          const emoji = slot.querySelector(".dc-emoji");
          emoji.textContent = d.def.icon || "🐲";
          loadAssetImage(slot.querySelector("img"), emoji, getDragonAsset(d.def, "thumb"), {
            silhouette: false,
            fallbackSrc: d.def.image
          });
          slot.querySelector(".ts-name").textContent = d.def.name;
          slot.querySelector(".ts-stars").innerHTML = renderTeamStarsHtml(d.stars);
          slot.querySelector(".ts-bonus").textContent = describeTeamSlotBonus(d.def, d.stars);
        } else {
          slot.className = "team-slot empty";
          slot.setAttribute("aria-label", "Emplacement " + (i + 1) + " vide — ajouter un dragon");
          slot.innerHTML =
            '<span class="ts-art ts-plus" aria-hidden="true"><span class="ts-silhouette">🐉</span></span>' +
            '<span class="ts-info"><span class="ts-name ts-add">+ Ajouter</span></span>';
        }
        slots.appendChild(slot);
      }

      list.innerHTML = "";
      const totals = getTeamBonusTotals();
      const preferred = [
        "clickPowerPercent",
        "clickPowerFlat",
        "essenceProductionPercent",
        "essenceProductionFlat",
        "critChanceFlatPercent",
        "fragmentGainPercent",
        "duplicateBonusFragmentChance",
        "manualClick",
        "criticalChance",
        "fragmentYield",
        "clickPct",
        "critChance"
      ];
      const types = preferred.filter((t) => totals[t] > 0).slice(0, 4);
      Object.keys(totals).forEach((t) => {
        if (types.indexOf(t) === -1 && totals[t] > 0 && types.length < 4) types.push(t);
      });
      if (!types.length) {
        const li = document.createElement("li");
        li.className = "team-bonus-empty";
        li.textContent = "Aucun bonus actif";
        list.appendChild(li);
        return;
      }
      types.forEach((t) => {
        const li = document.createElement("li");
        li.innerHTML = '<span class="tb-ico" aria-hidden="true"></span><strong></strong><span class="tb-label"></span>';
        li.querySelector(".tb-ico").textContent = TEAM_BONUS_ICON[t] || "•";
        li.querySelector("strong").textContent = formatDragonBonusAmount(t, totals[t]);
        li.querySelector(".tb-label").textContent = TEAM_BONUS_SHORT[t] || t;
        list.appendChild(li);
      });
    }

    const TEAM_PICKER_RARITY_ORDER = ["divine", "mythic", "legendary", "epic", "rare", "common"];
    const teamPickerState = { slot: 0, selectedId: null, filter: "all" };
    let teamUiDelegatesBound = false;
    let teamPickerOwnedCache = null;
    let teamPickerFooterRaf = 0;
    let teamPickerFooterDragonId = null;

    function invalidateTeamPickerOwnedCache() {
      teamPickerOwnedCache = null;
    }

    function getOwnedTeamCandidates() {
      if (teamPickerOwnedCache) return teamPickerOwnedCache;
      teamPickerOwnedCache = DRAGON_DEFS
        .filter((def) => !def.secret && isDragonDiscovered(gameState.dragons[def.id], def.id, gameState))
        .sort((a, b) => {
          const ra = TEAM_PICKER_RARITY_ORDER.indexOf(a.rarity);
          const rb = TEAM_PICKER_RARITY_ORDER.indexOf(b.rarity);
          if (ra !== rb) return ra - rb;
          const sa = safeNumber(gameState.dragons[a.id]?.stars, 1);
          const sb = safeNumber(gameState.dragons[b.id]?.stars, 1);
          if (sa !== sb) return sb - sa;
          return a.name.localeCompare(b.name);
        });
      return teamPickerOwnedCache;
    }

    function getDragonExpeditionRemaining(dragonId) {
      const busy = getBusyExpeditionRun();
      if (!busy || busy.run.dragonIds.indexOf(dragonId) === -1) return 0;
      return getExpeditionRemainingTime(busy.run);
    }

    function openTeamPicker(slotIndex) {
      const modal = document.getElementById("team-picker-modal");
      if (!modal) return;
      invalidateTeamPickerOwnedCache();
      teamPickerFooterDragonId = null;
      teamPickerState.slot = Math.max(0, Math.min(TEAM_SIZE - 1, slotIndex));
      teamPickerState.selectedId = getTeam()[teamPickerState.slot] || null;
      teamPickerState.filter = "all";
      if (window.DCAssets && typeof DCAssets.prioritize === "function") {
        const owned = DRAGON_DEFS.filter((d) =>
          !d.secret && isDragonDiscovered(gameState.dragons?.[d.id], d.id, gameState)
        ).slice(0, 16);
        DCAssets.prioritize(owned.map((d) => getDragonAsset(d, "thumb")).filter(Boolean));
      }
      renderTeamPicker();
      modal.classList.remove("hidden");
      const teamMod = document.getElementById("team-module");
      if (teamMod) teamMod.classList.add("is-picker-open");
      syncMobileModalOpenClass();
    }

    function renderTeamPicker() {
      const modal = document.getElementById("team-picker-modal");
      if (!modal) return;
      modal.dataset.slot = String(teamPickerState.slot);
      document.getElementById("team-picker-title").textContent =
        "Emplacement " + (teamPickerState.slot + 1);
      const roster = document.getElementById("team-picker-roster");
      if (roster) {
        const n = getOwnedTeamCandidates().length;
        roster.textContent = n
          ? n + " dragon" + (n > 1 ? "s" : "") + " disponible" + (n > 1 ? "s" : "")
          : "Aucun dragon disponible";
      }
      renderTeamPickerSlots();
      renderTeamPickerFilters();
      renderTeamPickerGrid();
      renderTeamPickerFooter();
    }

    function switchTeamPickerSlot(i) {
      if (teamPickerState.slot === i) return;
      teamPickerState.slot = i;
      teamPickerState.selectedId = getTeam()[i] || null;
      const modal = document.getElementById("team-picker-modal");
      if (modal) modal.dataset.slot = String(i);
      const title = document.getElementById("team-picker-title");
      if (title) title.textContent = "Emplacement " + (i + 1);
      const wrap = document.getElementById("team-picker-slots");
      if (wrap) {
        wrap.querySelectorAll(".tp-slot").forEach((btn, idx) => {
          const on = idx === i;
          btn.classList.toggle("active", on);
          btn.setAttribute("aria-selected", on ? "true" : "false");
        });
      }
      refreshTeamPickerGridState();
      renderTeamPickerFooter();
    }

    function refreshTeamPickerGridState() {
      const grid = document.getElementById("team-picker-grid");
      if (!grid) return;
      const team = getTeam();
      const slotIndex = teamPickerState.slot;
      grid.querySelectorAll(".tp-card").forEach((card) => {
        const id = card.dataset.dragonId;
        const inSlot = team.indexOf(id);
        card.classList.toggle("in-this-slot", inSlot === slotIndex);
        const selected = teamPickerState.selectedId === id;
        card.classList.toggle("selected", selected);
        card.setAttribute("aria-pressed", selected ? "true" : "false");
        if (card.classList.contains("locked")) return;
        let tag = card.querySelector(".tp-card-tag");
        if (inSlot !== -1) {
          if (!tag) {
            tag = document.createElement("span");
            tag.className = "tp-card-tag";
            card.appendChild(tag);
          }
          tag.textContent = inSlot === slotIndex ? "Équipé" : "Empl. " + (inSlot + 1);
        } else if (tag) {
          tag.remove();
        }
      });
    }

    function renderTeamPickerSlots() {
      const wrap = document.getElementById("team-picker-slots");
      if (!wrap) return;
      wrap.innerHTML = "";
      const frag = document.createDocumentFragment();
      for (let i = 0; i < TEAM_SIZE; i++) {
        const d = getTeamDragon(i);
        const btn = document.createElement("button");
        btn.type = "button";
        btn.dataset.slot = String(i);
        btn.setAttribute("role", "tab");
        btn.setAttribute("aria-selected", i === teamPickerState.slot ? "true" : "false");
        btn.className = "tp-slot" + (i === teamPickerState.slot ? " active" : "") + (d ? "" : " empty");
        btn.innerHTML =
          '<span class="tp-slot-badge"></span>' +
          '<span class="tp-slot-art"></span>' +
          '<span class="tp-slot-info"><span class="tp-slot-num"></span><span class="tp-slot-name"></span></span>';
        const art = btn.querySelector(".tp-slot-art");
        btn.querySelector(".tp-slot-badge").textContent = String(i + 1);
        btn.querySelector(".tp-slot-num").textContent = "Emplacement " + (i + 1);
        if (d) {
          art.classList.add((RARITIES[d.def.rarity] || RARITIES.common).css);
          art.innerHTML = '<img alt="" draggable="false" decoding="async" hidden /><span class="dc-emoji"></span>';
          const emoji = art.querySelector(".dc-emoji");
          emoji.textContent = d.def.icon || "🐲";
          loadAssetImage(art.querySelector("img"), emoji, getDragonAsset(d.def, "thumb"), {
            silhouette: false,
            fallbackSrc: d.def.image
          });
          btn.querySelector(".tp-slot-name").textContent = d.def.name;
        } else {
          art.textContent = "+";
          btn.querySelector(".tp-slot-name").textContent = "Vide";
        }
        frag.appendChild(btn);
      }
      wrap.appendChild(frag);
    }

    function renderTeamPickerFilters() {
      const wrap = document.getElementById("team-picker-filters");
      if (!wrap) return;
      const owned = getOwnedTeamCandidates();
      const counts = {};
      owned.forEach((d) => { counts[d.rarity] = (counts[d.rarity] || 0) + 1; });
      const rarities = TEAM_PICKER_RARITY_ORDER.slice().reverse().filter((r) => counts[r]);
      if (teamPickerState.filter !== "all" && !counts[teamPickerState.filter]) teamPickerState.filter = "all";

      wrap.innerHTML = "";
      wrap.hidden = rarities.length < 2;
      const frag = document.createDocumentFragment();
      [{ id: "all", label: "Tous", count: owned.length }]
        .concat(rarities.map((r) => ({ id: r, label: (RARITIES[r] || RARITIES.common).label, count: counts[r] })))
        .forEach((f) => {
          const chip = document.createElement("button");
          chip.type = "button";
          chip.dataset.rarity = f.id;
          chip.className = "tp-chip" +
            (f.id !== "all" ? " " + (RARITIES[f.id] || RARITIES.common).css : "") +
            (teamPickerState.filter === f.id ? " active" : "");
          chip.innerHTML = '<span></span><span class="tp-chip-count"></span>';
          chip.firstChild.textContent = f.label;
          chip.lastChild.textContent = String(f.count);
          frag.appendChild(chip);
        });
      wrap.appendChild(frag);
    }

    function applyTeamPickerFilter(filterId) {
      if (!filterId) return;
      teamPickerState.filter = filterId;
      const wrap = document.getElementById("team-picker-filters");
      if (wrap) {
        wrap.querySelectorAll(".tp-chip").forEach((chip) => {
          chip.classList.toggle("active", chip.dataset.rarity === filterId);
        });
      }
      const grid = document.getElementById("team-picker-grid");
      if (!grid) return;
      let visible = 0;
      grid.querySelectorAll(".tp-card").forEach((card) => {
        const show = filterId === "all" || card.dataset.rarity === filterId;
        card.hidden = !show;
        if (show) visible += 1;
      });
      let empty = grid.querySelector(".team-picker-empty");
      if (!visible) {
        if (!empty) {
          empty = document.createElement("p");
          empty.className = "team-picker-empty";
          grid.appendChild(empty);
        }
        empty.hidden = false;
        empty.textContent = getOwnedTeamCandidates().length
          ? "Aucun dragon de cette rareté."
          : "Faites éclore des œufs pour obtenir vos premiers dragons.";
      } else if (empty) {
        empty.hidden = true;
      }
    }

    function selectTeamPickerCard(card) {
      if (!card || card.classList.contains("locked")) return;
      const id = card.dataset.dragonId;
      if (!id) return;
      const grid = document.getElementById("team-picker-grid");
      if (!grid) return;

      /* Feedback sélection immédiat — avant footer/calculs */
      const prev = grid.querySelector(".tp-card.selected");
      if (prev && prev !== card) {
        prev.classList.remove("selected");
        prev.setAttribute("aria-pressed", "false");
      }
      card.classList.add("selected");
      card.setAttribute("aria-pressed", "true");
      teamPickerState.selectedId = id;

      if (teamPickerFooterRaf) cancelAnimationFrame(teamPickerFooterRaf);
      teamPickerFooterRaf = requestAnimationFrame(() => {
        teamPickerFooterRaf = 0;
        renderTeamPickerFooter();
      });
    }

    function renderTeamPickerGrid() {
      const grid = document.getElementById("team-picker-grid");
      if (!grid) return;
      grid.innerHTML = "";
      const team = getTeam();
      const slotIndex = teamPickerState.slot;
      const owned = getOwnedTeamCandidates();
      const filterId = teamPickerState.filter;

      if (!owned.length) {
        const p = document.createElement("p");
        p.className = "team-picker-empty";
        p.textContent = "Faites éclore des œufs pour obtenir vos premiers dragons.";
        grid.appendChild(p);
        return;
      }

      const frag = document.createDocumentFragment();
      let visibleCount = 0;
      owned.forEach((def, index) => {
        const entry = gameState.dragons[def.id];
        const stars = Math.max(1, safeNumber(entry.stars, 1));
        const rarity = RARITIES[def.rarity] || RARITIES.common;
        const inSlot = team.indexOf(def.id);
        const onExpedition = isDragonOnExpedition(def.id);
        const show = filterId === "all" || def.rarity === filterId;
        if (show) visibleCount += 1;

        /* article + role=button : même modèle tactile que le menu Dragons (scroll natif iOS) */
        const card = document.createElement("article");
        card.dataset.dragonId = def.id;
        card.dataset.rarity = def.rarity;
        card.tabIndex = 0;
        card.setAttribute("role", "button");
        card.hidden = !show;
        card.className = "tp-card " + rarity.css +
          (inSlot === slotIndex ? " in-this-slot" : "") +
          (onExpedition ? " locked" : "") +
          (teamPickerState.selectedId === def.id ? " selected" : "");
        card.setAttribute("aria-pressed", teamPickerState.selectedId === def.id ? "true" : "false");
        card.setAttribute("aria-label", def.name + " — " + rarity.label + " — " + stars + " étoiles");
        /* Carte épurée : rareté + gros art + étoiles (+ badge équipé). Détails = footer au clic. */
        card.innerHTML =
          '<span class="tp-card-band"></span>' +
          '<span class="tp-card-art"><img alt="" draggable="false" decoding="async" width="160" height="160" hidden /><span class="dc-emoji"></span></span>' +
          '<span class="tp-card-stars"></span>';

        card.querySelector(".tp-card-band").textContent = rarity.label;
        const emoji = card.querySelector(".dc-emoji");
        emoji.textContent = def.icon || "🐲";
        const imgEl = card.querySelector("img");
        bindDragonPortrait(imgEl, emoji, getDragonAsset(def, "thumb"), {
          silhouette: false,
          fallbackSrc: def.image
        }, index);
        card.querySelector(".tp-card-stars").innerHTML = renderTeamStarsHtml(stars);

        if (onExpedition) {
          const lock = document.createElement("span");
          lock.className = "tp-card-lock";
          const rem = getDragonExpeditionRemaining(def.id);
          lock.innerHTML = '<span class="tp-lock-ico">🧭</span><span></span>';
          lock.lastChild.textContent = rem > 0 ? formatDuration(rem) : "Expédition";
          card.appendChild(lock);
        } else if (inSlot !== -1) {
          const tag = document.createElement("span");
          tag.className = "tp-card-tag";
          tag.textContent = inSlot === slotIndex ? "Équipé" : "Empl. " + (inSlot + 1);
          card.appendChild(tag);
        }

        frag.appendChild(card);
      });

      if (!visibleCount) {
        const p = document.createElement("p");
        p.className = "team-picker-empty";
        p.textContent = "Aucun dragon de cette rareté.";
        frag.appendChild(p);
      }
      grid.appendChild(frag);
    }

    function bindTeamUiDelegates() {
      if (teamUiDelegatesBound) return;
      teamUiDelegatesBound = true;

      const slots = document.getElementById("team-slots");
      if (slots) {
        slots.addEventListener("click", (e) => {
          const slot = e.target.closest(".team-slot");
          if (!slot || !slots.contains(slot)) return;
          openTeamPicker(Number(slot.dataset.slot));
        });
      }

      const tpSlots = document.getElementById("team-picker-slots");
      if (tpSlots) {
        tpSlots.addEventListener("click", (e) => {
          const btn = e.target.closest(".tp-slot");
          if (!btn || !tpSlots.contains(btn)) return;
          const i = Number(btn.dataset.slot);
          if (!Number.isFinite(i)) return;
          switchTeamPickerSlot(i);
        });
      }

      const filters = document.getElementById("team-picker-filters");
      if (filters) {
        filters.addEventListener("click", (e) => {
          const chip = e.target.closest(".tp-chip");
          if (!chip || !filters.contains(chip)) return;
          const id = chip.dataset.rarity;
          if (!id || teamPickerState.filter === id) return;
          applyTeamPickerFilter(id);
        });
      }

      const grid = document.getElementById("team-picker-grid");
      if (grid) {
        grid.addEventListener("pointerdown", (e) => {
          const card = e.target.closest(".tp-card");
          if (!card || !grid.contains(card) || card.classList.contains("locked")) return;
          card.classList.add("is-pressed");
        }, { passive: true });
        const clearPressed = (e) => {
          const card = e.target.closest(".tp-card");
          if (card) card.classList.remove("is-pressed");
          else grid.querySelectorAll(".tp-card.is-pressed").forEach((c) => c.classList.remove("is-pressed"));
        };
        grid.addEventListener("pointerup", clearPressed, { passive: true });
        grid.addEventListener("pointercancel", clearPressed, { passive: true });
        grid.addEventListener("pointerleave", clearPressed, { passive: true });

        let lastTapId = null;
        let lastTapAt = 0;
        grid.addEventListener("click", (e) => {
          const card = e.target.closest(".tp-card");
          if (!card || !grid.contains(card)) return;
          selectTeamPickerCard(card);
          /* Double-tap équipement (évite dblclick + délai 300ms sur mobile) */
          if (card.classList.contains("locked")) return;
          const id = card.dataset.dragonId;
          const now = performance.now();
          if (id && id === lastTapId && now - lastTapAt < 320) {
            lastTapId = null;
            lastTapAt = 0;
            if (getTeam()[teamPickerState.slot] !== id) confirmTeamPickerSelection();
            return;
          }
          lastTapId = id;
          lastTapAt = now;
        });
        grid.addEventListener("keydown", (e) => {
          if (e.key !== "Enter" && e.key !== " ") return;
          const card = e.target.closest(".tp-card");
          if (!card || !grid.contains(card)) return;
          e.preventDefault();
          selectTeamPickerCard(card);
        });
      }
    }

    function renderTeamPickerFooter() {
      const preview = document.getElementById("team-picker-preview");
      const confirmBtn = document.getElementById("btn-team-confirm");
      const removeBtn = document.getElementById("btn-team-remove");
      if (!preview || !confirmBtn || !removeBtn) return;

      const team = getTeam();
      const slotIndex = teamPickerState.slot;
      const currentId = team[slotIndex] || null;
      const id = teamPickerState.selectedId;
      const footerKey = String(id || "") + "|" + slotIndex + "|" + String(currentId || "");
      /* Évite de recharger l'image / reconstruire le panneau si rien n'a changé. */
      if (teamPickerFooterDragonId === footerKey && preview.childElementCount) {
        removeBtn.hidden = !currentId;
        return;
      }
      teamPickerFooterDragonId = footerKey;

      const def = id ? getDragonDef(id) : null;
      removeBtn.hidden = !currentId;

      preview.innerHTML = "";
      if (!def || !isDragonDiscovered(gameState.dragons[id], id, gameState)) {
        const hint = document.createElement("p");
        hint.className = "tp-preview-hint";
        hint.textContent = "Touchez un dragon pour voir ses détails.";
        preview.appendChild(hint);
        confirmBtn.textContent = "Équiper";
        confirmBtn.disabled = true;
        return;
      }

      const entry = gameState.dragons[id];
      const stars = Math.max(1, safeNumber(entry.stars, 1));
      const rarity = RARITIES[def.rarity] || RARITIES.common;
      const active = getDragonActiveBonus(def, stars);
      const onExpedition = isDragonOnExpedition(id);
      const otherSlot = team.indexOf(id);

      preview.innerHTML =
        '<span class="tp-preview-art"><img alt="" draggable="false" decoding="async" hidden /><span class="dc-emoji"></span></span>' +
        '<span class="tp-preview-body">' +
          '<span class="tp-preview-title"><span class="tp-preview-name"></span><span class="rarity-label"></span></span>' +
          '<span class="tp-preview-stars"></span>' +
          '<span class="tp-preview-bonus"><span class="tp-bonus-name"></span><span class="tp-bonus-value"></span></span>' +
          '<span class="tp-preview-meta"></span>' +
          '<span class="tp-preview-note"></span>' +
        "</span>";
      const art = preview.querySelector(".tp-preview-art");
      art.classList.add(rarity.css);
      const emoji = art.querySelector(".dc-emoji");
      emoji.textContent = def.icon || "🐲";
      loadAssetImage(art.querySelector("img"), emoji, getDragonAsset(def, "thumb"), {
        silhouette: false,
        fallbackSrc: def.image
      });
      preview.querySelector(".tp-preview-name").textContent = def.name;
      const rLabel = preview.querySelector(".rarity-label");
      rLabel.textContent = rarity.label;
      rLabel.classList.add(rarity.css);
      preview.querySelector(".tp-preview-stars").innerHTML = renderTeamStarsHtml(stars);
      preview.querySelector(".tp-bonus-name").textContent = active && active.name ? active.name : "";
      preview.querySelector(".tp-bonus-value").textContent = describeDragonBonusShort(def, stars);
      const meta = preview.querySelector(".tp-preview-meta");
      const frags = Math.max(0, safeNumber(entry.fragments, 0));
      const next = getFragmentsForNextStar(def, entry);
      if (next) {
        meta.textContent = "Fragments " + formatNumber(frags) + " / " + formatNumber(next.cost) +
          " → ★" + next.toStar;
      } else if (stars >= MAX_DRAGON_STARS) {
        meta.textContent = "Fragments " + formatNumber(frags) + " · Max ★";
      } else {
        meta.textContent = frags > 0 ? ("Fragments " + formatNumber(frags)) : "";
      }
      if (!meta.textContent) meta.hidden = true;

      const note = preview.querySelector(".tp-preview-note");
      let label = currentId ? "Remplacer" : "Équiper";
      let disabled = false;
      if (onExpedition) {
        const rem = getDragonExpeditionRemaining(id);
        note.textContent = "En expédition" + (rem > 0 ? " — retour dans " + formatDuration(rem) : "");
        note.classList.add("warn");
        label = "Indisponible";
        disabled = true;
      } else if (otherSlot === slotIndex) {
        note.textContent = "Déjà dans cet emplacement.";
        label = "Équipé";
        disabled = true;
      } else if (otherSlot !== -1) {
        const cur = currentId ? getDragonDef(currentId) : null;
        note.textContent = "Dans l'emplacement " + (otherSlot + 1) +
          (cur ? " — échange avec " + cur.name : " — sera déplacé ici");
        label = "Échanger";
      } else if (currentId) {
        const cur = getDragonDef(currentId);
        const curStars = Math.max(1, safeNumber(gameState.dragons[currentId]?.stars, 1));
        note.textContent = cur ? "Remplace " + cur.name + " (" + describeDragonBonusShort(cur, curStars) + ")" : "";
      } else if (active && active.description) {
        note.textContent = active.description;
      }
      confirmBtn.textContent = label;
      confirmBtn.disabled = disabled;
    }

    function confirmTeamPickerSelection() {
      const id = teamPickerState.selectedId;
      if (!id) return;
      if (getTeam()[teamPickerState.slot] === id) return;
      assignTeamSlot(teamPickerState.slot, id);
    }

    function closeTeamPicker() {
      const modal = document.getElementById("team-picker-modal");
      if (modal) modal.classList.add("hidden");
      const teamMod = document.getElementById("team-module");
      if (teamMod) teamMod.classList.remove("is-picker-open");
      if (teamPickerFooterRaf) {
        cancelAnimationFrame(teamPickerFooterRaf);
        teamPickerFooterRaf = 0;
      }
      teamPickerFooterDragonId = null;
      syncMobileModalOpenClass();
    }

    function assignTeamSlot(slotIndex, dragonId) {
      if (dragonId && isDragonOnExpedition(dragonId)) {
        showNotification(
          "🧭 Expédition",
          "Ce dragon est en expédition. Attendez son retour avant de l'équiper."
        );
        return;
      }
      const team = getTeam();
      const prevIndex = dragonId ? team.indexOf(dragonId) : -1;
      if (prevIndex !== -1 && prevIndex !== slotIndex) {
        team[prevIndex] = team[slotIndex];
      }
      team[slotIndex] = dragonId;
      calculateProduction();
      saveGame(true);
      invalidateTeamPickerOwnedCache();
      renderTeamModule();
      uiDirty = true;
      closeTeamPicker();
      if (dragonId) {
        const slotEl = document.querySelector('#team-slots .team-slot[data-slot="' + slotIndex + '"]');
        if (slotEl) {
          slotEl.classList.add("just-equipped");
          setTimeout(() => slotEl.classList.remove("just-equipped"), 750);
        }
        playSound("upgrade");
      }
    }

    function toggleTeamDrawer(force) {
      const mod = document.getElementById("team-module");
      if (!mod) return;
      const open = typeof force === "boolean" ? force : !mod.classList.contains("open");
      mod.classList.toggle("open", open);
      if (open) renderTeamModule();
      syncMobileModalOpenClass();
    }

    function getZoneMapIndex(zoneId) {
      const idx = ZONE_DEFS.findIndex((z) => z.id === zoneId);
      return idx >= 0 ? idx + 1 : 1;
    }

    function getZonePoolTotal(zone) {
      let n = 0;
      (zone.eggIds || []).forEach((eggId) => {
        const egg = getEggDef(eggId);
        n += (egg && egg.dragonPool && egg.dragonPool.length) || 0;
      });
      return n;
    }

    function closeZoneDetail() {
      /* no-op: fiche zone retirée du nouveau panneau Monde */
    }

    function openZoneDetail(zoneId) {
      /* no-op: UI zone reportée à la prochaine étape — données / enterZoneFromMap intactes */
      void zoneId;
    }

    function enterZoneFromMap(zoneId) {
      const zone = getZoneDef(zoneId);
      if (!zone || zone.comingSoon) {
        showNotification("🗺️ Zone", "Cette zone n'est pas encore disponible.");
        return;
      }
      const finishEnter = () => {
        selectZone(zoneId);
        closeZoneDetail();
        renderZones();
        renderEggPicker();
        renderShop();
        renderUpgrades();
        switchPanel("kingdom");
      };
      /* Attendre assets scène critiques si besoin — transition immédiate si déjà en cache. */
      const sameZone = (gameState.currentZoneId || "sanctuary") === zoneId;
      if (sameZone) {
        finishEnter();
        return;
      }
      preloadZoneSceneAssets(zoneId).then(finishEnter).catch(finishEnter);
    }

    /* Ancien rendu carte Monde désactivé — données WORLD_MAP_PAGES / ZONE_DEFS conservées. */
    function preloadWorldMapImages() { /* no-op: UI Monde rebuild */ }

    function getWorldPageIndexForZone(zoneId) {
      const zoneNum = ZONE_DEFS.findIndex((z) => z.id === zoneId) + 1;
      if (zoneNum <= 0) return 0;
      for (let i = 0; i < WORLD_MAP_PAGES.length; i++) {
        if (WORLD_MAP_PAGES[i].zoneIndexes.indexOf(zoneNum) !== -1) return i;
      }
      return 0;
    }

    function createZoneMarkerButton() { return document.createElement("button"); }
    function syncZoneMarkerButton() { /* no-op */ }
    function ensureWorldPagesBuilt() { /* no-op: nouveau panneau Monde */ }
    function updateWorldNavUi() { /* no-op */ }
    function setWorldPage() { /* no-op */ }
    function shiftWorldPage() { /* no-op */ }
    function scrollWorldMapToCurrentZone() { /* no-op */ }
    /* Visuels cartes WORLDS — fichiers réels dans assets/menu/world/ */
    const WORLD_ZONE_VISUALS = {
      sanctuary: "assets/menu/world/zone1.png",
      valley: "assets/menu/world/zone2.png",
      mountains: "assets/menu/world/zone3.png",
      zone4: "assets/menu/world/zone4.png"
    };
    const WORLD_ZONE_LOCK_ICON = "assets/menu/world/cadenas.png";

    function formatZoneUnlockConditionLine(req) {
      if (!req) return "";
      if (req.type === "zoneSpent") {
        const z = getZoneDef(req.zoneId || "sanctuary");
        return formatNumber(req.value) + " investis — " + (z ? z.name : "zone");
      }
      if (req.type === "totalEssence" || req.type === "essence") {
        return formatNumber(req.value) + " Essence requise";
      }
      if (req.type === "totalPower" || req.type === "dragonPower") {
        return formatNumber(req.value) + " Puissance requise";
      }
      if (req.type === "zoneComplete" || req.type === "previousZone") {
        const z = getZoneDef(req.zoneId);
        const label = z ? z.name : "zone précédente";
        return "Terminer " + label;
      }
      if (req.type === "zoneDragons") {
        const z = getZoneDef(req.zoneId || "sanctuary");
        const zoneLabel = z ? z.name : "la zone";
        return req.value + " dragons — " + zoneLabel;
      }
      if (req.type === "eggsHatched") {
        return req.value + " œufs requis";
      }
      if (req.type === "dragonsDiscovered") {
        return req.value + " dragons requis";
      }
      if (req.type === "producerOwned") {
        const p = PRODUCER_DEFS.find((x) => x.id === req.producerId);
        return (p ? p.name : "Producteur") + " requis";
      }
      if (req.type === "specialPurchase" || req.type === "purchase") {
        return req.label || "Achat spécial requis";
      }
      return describeZoneRequirement(req) || "";
    }

    function getZoneUnlockConditionText(zone) {
      if (!zone) return "";
      if (zone.comingSoon) return "Bientôt";
      if (zone.startUnlocked) return "";

      const check = checkZoneRequirements(zone);
      const unmet = (check.results || []).filter((r) => !r.ok);
      if (unmet.length) {
        return formatZoneUnlockConditionLine(unmet[0].req);
      }

      const cost = safeNumber(zone.unlockCost, 0);
      if (cost > 0) {
        return formatNumber(cost) + " Essence requise";
      }

      const firstReq = (zone.unlockRequirements || [])[0];
      if (firstReq) return formatZoneUnlockConditionLine(firstReq);
      return "Zone verrouillée";
    }

    function createWorldZoneCard(zone, index) {
      const unlocked = isZoneUnlocked(gameState, zone.id);
      const active = (gameState.currentZoneId || "sanctuary") === zone.id;
      const locked = !unlocked || !!zone.comingSoon;
      const visualSrc = WORLD_ZONE_VISUALS[zone.id] || null;
      const invest = getZoneInvestRequirement(zone);
      const investSpent = invest ? getZoneSpent(invest.fromZoneId) : 0;
      const investNeed = invest ? invest.amount : 0;
      const investReady = !invest || investSpent >= investNeed;
      const investPct = investNeed > 0 ? Math.min(1, investSpent / investNeed) : 1;
      const investRemaining = Math.max(investNeed - investSpent, 0);
      const unlockCost = safeNumber(zone.unlockCost, 0);
      const missingEssence = Math.max(0, unlockCost - safeNumber(gameState.dragonEssence, 0));

      const card = document.createElement("article");
      card.className =
        "world-zone-card" +
        (active ? " is-current" : "") +
        (locked ? " is-locked" : "") +
        (invest && !unlocked && investReady ? " is-invest-ready" : "");
      card.dataset.zoneId = zone.id;
      card.setAttribute("role", "listitem");

      const visual = document.createElement("div");
      visual.className = "world-zone-visual";
      visual.setAttribute("aria-hidden", "true");
      if (visualSrc) {
        visual.classList.add("has-art");
        if (zone.id === "sanctuary") visual.classList.add("pos-sanctuary");
        if (zone.id === "valley") visual.classList.add("pos-valley");
        if (zone.id === "mountains") visual.classList.add("pos-mountains");
        if (zone.id === "zone4") visual.classList.add("pos-zone4");
        const img = document.createElement("img");
        img.className = "world-zone-art";
        img.src = visualSrc;
        img.alt = "";
        img.decoding = "async";
        img.draggable = false;
        visual.appendChild(img);
      }

      /* Overlay cadenas PNG + progression : uniquement si zone encore verrouillée */
      if (!unlocked && !zone.comingSoon) {
        const overlay = document.createElement("div");
        overlay.className = "world-zone-lock-overlay";

        const lockImg = document.createElement("img");
        lockImg.className = "world-lock-icon world-zone-lock-icon";
        lockImg.src = WORLD_ZONE_LOCK_ICON;
        lockImg.alt = "";
        lockImg.decoding = "async";
        lockImg.draggable = false;
        overlay.appendChild(lockImg);

        if (invest) {
          const progress = document.createElement("div");
          progress.className = "world-zone-locked-progress";

          const label = document.createElement("p");
          label.className = "world-zone-invest-label";
          if (investReady) {
            label.textContent = "Conditions remplies";
          } else {
            const fromZone = getZoneDef(invest.fromZoneId);
            label.textContent = fromZone
              ? ("Investissement " + fromZone.name)
              : ("Progression Zone " + getZoneMapIndex(invest.fromZoneId));
          }

          const track = document.createElement("div");
          track.className = "world-zone-invest-track";
          const fill = document.createElement("div");
          fill.className = "world-zone-invest-fill" + (investReady ? " is-complete" : "");
          fill.style.width = (investPct * 100).toFixed(1) + "%";
          track.appendChild(fill);

          const nums = document.createElement("p");
          nums.className = "world-zone-invest-nums";
          nums.textContent = formatNumber(Math.min(investSpent, investNeed)) + " / " + formatNumber(investNeed);

          progress.appendChild(label);
          progress.appendChild(track);
          progress.appendChild(nums);

          if (!investReady) {
            const hint = document.createElement("p");
            hint.className = "world-zone-invest-hint";
            hint.textContent = "Encore " + formatNumber(investRemaining) + " à investir";
            progress.appendChild(hint);
          }

          overlay.appendChild(progress);
        } else {
          const condition = document.createElement("p");
          condition.className = "world-zone-lock-condition";
          condition.textContent = unlockCost > 0
            ? (formatNumber(unlockCost) + " ESSENCE REQUISE")
            : "ZONE VERROUILLÉE";
          overlay.appendChild(condition);
        }

        visual.appendChild(overlay);
      } else if (locked && zone.comingSoon) {
        const overlay = document.createElement("div");
        overlay.className = "world-zone-lock-overlay";
        const lockImg = document.createElement("img");
        lockImg.className = "world-lock-icon world-zone-lock-icon";
        lockImg.src = WORLD_ZONE_LOCK_ICON;
        lockImg.alt = "";
        lockImg.decoding = "async";
        lockImg.draggable = false;
        const condition = document.createElement("p");
        condition.className = "world-zone-lock-condition";
        condition.textContent = "Bientôt";
        overlay.appendChild(lockImg);
        overlay.appendChild(condition);
        visual.appendChild(overlay);
      }

      const content = document.createElement("div");
      content.className = "world-zone-content";

      const number = document.createElement("div");
      number.className = "world-zone-number";
      number.textContent = "Zone " + (index + 1);

      const name = document.createElement("div");
      name.className = "world-zone-name";
      name.textContent = zone.name || ("Zone " + (index + 1));

      content.appendChild(number);
      content.appendChild(name);

      /* Bas de carte : prix + action — jamais la barre de progression */
      if (!unlocked && !zone.comingSoon) {
        if (unlockCost > 0) {
          const price = document.createElement("p");
          price.className = "world-zone-footer-price" + (investReady ? "" : " is-muted");
          price.textContent = investReady
            ? ("Déblocage : " + formatNumber(unlockCost) + " Essence")
            : (formatNumber(unlockCost) + " Essence");
          content.appendChild(price);
          if (investReady && missingEssence > 0) {
            const miss = document.createElement("p");
            miss.className = "world-zone-missing";
            miss.textContent = "Il vous manque " + formatNumber(missingEssence);
            content.appendChild(miss);
          }
        }

        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "world-zone-enter is-unlock";
        btn.textContent = "Débloquer";
        btn.dataset.action = "unlock-zone";
        btn.dataset.zoneId = zone.id;
        const check = canUnlockZone(zone.id);
        btn.disabled = !check.ok;
        content.appendChild(btn);
      } else if (zone.comingSoon) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "world-zone-enter";
        btn.textContent = "Bientôt";
        btn.disabled = true;
        content.appendChild(btn);
      } else {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "world-zone-enter" + (active ? " is-current" : "");
        btn.dataset.zoneId = zone.id;
        if (active) {
          btn.textContent = "Actuelle";
          btn.disabled = true;
        } else {
          btn.textContent = "Entrer";
          btn.dataset.action = "enter-zone";
        }
        content.appendChild(btn);
      }

      card.appendChild(visual);
      card.appendChild(content);
      return card;
    }

    function refreshWorldUnlockAffordability() {
      const list = document.getElementById("world-zones-list");
      if (!list) return;
      list.querySelectorAll('button[data-action="unlock-zone"]').forEach((btn) => {
        const zoneId = btn.dataset.zoneId;
        const zone = getZoneDef(zoneId);
        if (!zone || isZoneUnlocked(gameState, zoneId)) return;
        const check = canUnlockZone(zoneId);
        btn.disabled = !check.ok;
        const content = btn.closest(".world-zone-content");
        if (!content) return;
        let miss = content.querySelector(".world-zone-missing");
        const cost = safeNumber(check.cost, zone.unlockCost || 0);
        const missing = Math.max(0, cost - safeNumber(gameState.dragonEssence, 0));
        const invest = getZoneInvestRequirement(zone);
        const investReady = !invest || getZoneSpent(invest.fromZoneId) >= invest.amount;
        if (investReady && missing > 0) {
          if (!miss) {
            miss = document.createElement("p");
            miss.className = "world-zone-missing";
            content.insertBefore(miss, btn);
          }
          miss.textContent = "Il vous manque " + formatNumber(missing);
        } else if (miss) {
          miss.remove();
        }
        const price = content.querySelector(".world-zone-footer-price");
        if (price) {
          price.classList.toggle("is-muted", !investReady);
        }
      });
    }

    function bindWorldZoneActions() {
      const list = document.getElementById("world-zones-list");
      if (!list || list.dataset.boundActions === "1") return;
      list.dataset.boundActions = "1";
      list.addEventListener("click", (event) => {
        const actionButton = event.target.closest("[data-action]");
        if (!actionButton || !list.contains(actionButton)) return;
        if (actionButton.disabled) return;

        const action = actionButton.dataset.action;
        const zoneId = actionButton.dataset.zoneId;
        if (!zoneId) return;

        if (action === "unlock-zone") {
          if (!unlockZone(zoneId)) return;
          renderDragons();
          renderEggPicker();
          return;
        }

        if (action === "enter-zone") {
          enterZoneFromMap(zoneId);
        }
      });
    }

    function renderWorldZoneCards() {
      const list = document.getElementById("world-zones-list");
      if (!list) return;
      list.innerHTML = "";
      let worldIndex = 0;
      ZONE_DEFS.forEach((zone) => {
        if (zone.eventOnly) return;
        list.appendChild(createWorldZoneCard(zone, worldIndex));
        worldIndex += 1;
      });
    }

    function renderZones() {
      renderWorldZoneCards();
      zonesDirty = false;
    }

    function isWorldPanelActive() {
      const panel = document.getElementById("panel-zones");
      return !!(panel && panel.classList.contains("active"));
    }

    function bindWorldMapNavigation() {
      bindWorldZoneActions();
      const scroller = document.getElementById("world-zones-scroll");
      if (!scroller || scroller.dataset.boundScroll === "1") return;
      scroller.dataset.boundScroll = "1";
      scroller.addEventListener(
        "wheel",
        (e) => {
          if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
          if (scroller.scrollWidth <= scroller.clientWidth + 2) return;
          e.preventDefault();
          scroller.scrollLeft += e.deltaY;
        },
        { passive: false }
      );
    }

    function renderEgg() {
      renderCurrentEgg();
    }

    /* -------------------------------------------------------
       ACHIEVEMENTS — récompenses Essence uniques (claim manuel)
       ------------------------------------------------------- */
    let achievementsFilter = "all";
    let selectedAchievementId = null;
    let achievementsUiBound = false;
    let achievementClaimLock = false;

    function countTotalDragonStars(state) {
      const s = state || gameState;
      let n = 0;
      const dragons = s.dragons || {};
      Object.keys(dragons).forEach((id) => {
        const e = dragons[id];
        if (!isDragonDiscovered(e, id, s)) return;
        n += Math.max(0, Math.floor(safeNumber(e.stars, 0)));
      });
      return n;
    }

    function getAchievementProgressValue(def, state) {
      const s = state || gameState;
      const key = def.progressKey;
      if (key === "totalClicks") return safeNumber(s.totalClicks, 0);
      if (key === "totalEggsHatched") return Math.max(safeNumber(s.totalEggsHatched, 0), s.eggHatched ? 1 : 0);
      if (key === "ownedDragons") return countOwnedDragons(s);
      if (key === "totalStars") return countTotalDragonStars(s);
      if (key === "hasStars2") return hasDragonAtStars(s, 2) ? 1 : 0;
      if (key === "hasStars5") return hasDragonAtStars(s, 5) ? 1 : 0;
      if (key === "totalEssenceEarned") return safeNumber(s.totalEssenceEarned, s.totalPowerEarned);
      if (key === "totalCriticalClicks") return safeNumber(s.totalCriticalClicks, 0);
      if (key === "totalExpeditionsCompleted") return safeNumber(s.totalExpeditionsCompleted, 0);
      if (key === "zoneValley") return isZoneUnlocked(s, "valley") ? 1 : 0;
      if (key === "zoneMountains") return isZoneUnlocked(s, "mountains") ? 1 : 0;
      return 0;
    }

    function isAchievementComplete(def, state) {
      const target = Math.max(1, safeNumber(def.target, 1));
      return getAchievementProgressValue(def, state) >= target;
    }

    function ensureAchievementEntry(id) {
      if (!gameState.achievements) gameState.achievements = {};
      if (!gameState.achievements[id] || typeof gameState.achievements[id] !== "object") {
        gameState.achievements[id] = { unlocked: false, rewardClaimed: false };
      }
      if (gameState.achievements[id].rewardClaimed == null) {
        gameState.achievements[id].rewardClaimed = false;
      }
      return gameState.achievements[id];
    }

    function getAchievementState(def) {
      const entry = ensureAchievementEntry(def.id);
      const complete = !!entry.unlocked || isAchievementComplete(def, gameState);
      const claimed = !!entry.rewardClaimed;
      if (claimed) return "claimed";
      if (complete) return "claimable";
      return "progress";
    }

    function countClaimableAchievements() {
      let n = 0;
      ACHIEVEMENT_DEFS.forEach((def) => {
        if (getAchievementState(def) === "claimable") n += 1;
      });
      return n;
    }

    function updateAchievementsNavBadge() {
      const badge = document.getElementById("nav-achievements-badge");
      const btn = document.getElementById("btn-open-achievements");
      const n = countClaimableAchievements();
      if (badge) {
        badge.hidden = n <= 0;
        badge.textContent = n > 9 ? "!" : String(n);
        badge.setAttribute("aria-hidden", n <= 0 ? "true" : "false");
      }
      if (btn) {
        btn.classList.toggle("has-ach-claim", n > 0);
        btn.setAttribute("aria-expanded", document.getElementById("panel-achievements")?.classList.contains("active") ? "true" : "false");
      }
    }

    function openAchievementsPanel() {
      playSound("button");
      switchPanel("achievements");
      updateAchievementsNavBadge();
    }

    function checkAchievements() {
      let changed = false;
      ACHIEVEMENT_DEFS.forEach((def) => {
        const entry = ensureAchievementEntry(def.id);
        if (entry.unlocked) return;
        try {
          if (isAchievementComplete(def, gameState)) {
            entry.unlocked = true;
            if (entry.rewardClaimed == null) entry.rewardClaimed = false;
            changed = true;
            showNotification("🏆 SUCCÈS TERMINÉ", def.name + " — récompense disponible");
            playSound("achievement");
          }
        } catch (e) {
          /* ignore bad check */
        }
      });
      if (changed) {
        achievementsDirty = true;
        uiDirty = true;
        updateAchievementsNavBadge();
      }
    }

    function claimAchievementReward(achievementId, opts) {
      opts = opts || {};
      if (achievementClaimLock) return { ok: false, reason: "busy" };
      const def = ACHIEVEMENT_DEFS.find((d) => d.id === achievementId);
      if (!def) return { ok: false, reason: "missing" };
      const entry = ensureAchievementEntry(achievementId);
      if (entry.rewardClaimed) return { ok: false, reason: "claimed" };
      if (!entry.unlocked && !isAchievementComplete(def, gameState)) {
        return { ok: false, reason: "locked" };
      }
      achievementClaimLock = true;
      try {
        entry.unlocked = true;
        entry.rewardClaimed = true;
        const amount = Math.max(0, Math.floor(safeNumber(def.rewardEssence, 0)));
        if (amount > 0) addEssence(amount, "achievement");
        achievementsDirty = true;
        uiDirty = true;
        if (!opts.silent) {
          showNotification("✨ RÉCOMPENSE", def.name + " — +" + formatNumber(amount) + " Essence");
          playSound("achievement");
        }
        if (!opts.skipSave) saveGame(true);
        updateAchievementsNavBadge();
        return { ok: true, amount: amount };
      } finally {
        achievementClaimLock = false;
      }
    }

    function claimAllAchievementRewards() {
      if (achievementClaimLock) return { ok: false, reason: "busy" };
      const ids = ACHIEVEMENT_DEFS.filter((d) => getAchievementState(d) === "claimable").map((d) => d.id);
      if (ids.length < 2) return { ok: false, reason: "few" };
      achievementClaimLock = true;
      let total = 0;
      try {
        ids.forEach((id) => {
          const def = ACHIEVEMENT_DEFS.find((d) => d.id === id);
          const entry = ensureAchievementEntry(id);
          if (!def || entry.rewardClaimed) return;
          entry.unlocked = true;
          entry.rewardClaimed = true;
          const amount = Math.max(0, Math.floor(safeNumber(def.rewardEssence, 0)));
          if (amount > 0) {
            addEssence(amount, "achievement");
            total += amount;
          }
        });
        achievementsDirty = true;
        uiDirty = true;
        saveGame(true);
        updateAchievementsNavBadge();
        showNotification("✨ TOUT RÉCUPÉRÉ", "+" + formatNumber(total) + " Essence");
        playSound("achievement");
        return { ok: true, amount: total, count: ids.length };
      } finally {
        achievementClaimLock = false;
      }
    }

    function getFilteredAchievementDefs() {
      return ACHIEVEMENT_DEFS.filter((d) => achievementsFilter === "all" || d.category === achievementsFilter);
    }

    function clearAchievementSelection() {
      selectedAchievementId = null;
      const list = document.getElementById("achievements-list");
      if (list) {
        list.querySelectorAll(".ach-tile.is-selected").forEach((el) => el.classList.remove("is-selected"));
      }
      renderAchievementDetail();
    }

    function selectAchievement(id) {
      if (!id) {
        clearAchievementSelection();
        return;
      }
      const def = ACHIEVEMENT_DEFS.find((d) => d.id === id);
      if (!def) {
        clearAchievementSelection();
        return;
      }
      if (achievementsFilter !== "all" && def.category !== achievementsFilter) {
        clearAchievementSelection();
        return;
      }
      selectedAchievementId = id;
      const list = document.getElementById("achievements-list");
      if (list) {
        list.querySelectorAll(".ach-tile").forEach((el) => {
          el.classList.toggle("is-selected", el.getAttribute("data-ach-select") === id);
        });
      }
      renderAchievementDetail();
    }

    function renderAchievementDetail() {
      const detail = document.getElementById("achievements-detail");
      if (!detail) return;
      const body = detail.querySelector(".ach-detail-body");
      const progText = detail.querySelector(".ach-detail-progress-text");
      const progFill = detail.querySelector(".ach-detail-bar-fill");
      const claimBtn = detail.querySelector("#btn-ach-claim");
      if (!body || !progText || !progFill || !claimBtn) return;

      const def = selectedAchievementId
        ? ACHIEVEMENT_DEFS.find((d) => d.id === selectedAchievementId)
        : null;

      if (!def) {
        body.innerHTML = '<p class="ach-detail-empty">Choisi un succès</p>';
        progText.textContent = "0 / 0";
        progFill.style.width = "0%";
        claimBtn.disabled = true;
        claimBtn.className = "ach-claim-btn is-disabled";
        claimBtn.removeAttribute("data-ach-claim");
        claimBtn.textContent = "RÉCLAMER";
        return;
      }

      const state = getAchievementState(def);
      const current = Math.min(getAchievementProgressValue(def, gameState), def.target);
      const pct = def.target > 0 ? Math.min(100, (current / def.target) * 100) : 0;
      const cat = ACHIEVEMENT_CATEGORIES.find((c) => c.id === def.category);
      const stateLabel = state === "claimed" ? "Récupéré" : state === "claimable" ? "À récupérer" : "En cours";

      body.innerHTML =
        '<div class="ach-detail-icon" aria-hidden="true"></div>' +
        '<h4 class="ach-detail-name"></h4>' +
        '<p class="ach-detail-desc"></p>' +
        '<p class="ach-detail-meta"></p>' +
        '<p class="ach-detail-reward"></p>';
      body.querySelector(".ach-detail-icon").textContent = def.icon || "🏆";
      body.querySelector(".ach-detail-name").textContent = def.name;
      body.querySelector(".ach-detail-desc").textContent = def.description;
      body.querySelector(".ach-detail-meta").textContent =
        (cat ? cat.label : "") + (cat ? " · " : "") + stateLabel;
      body.querySelector(".ach-detail-reward").textContent =
        "Récompense : " + formatNumber(def.rewardEssence) + " Essence";

      progText.textContent = formatNumber(current) + " / " + formatNumber(def.target);
      progFill.style.width = pct + "%";
      progFill.classList.toggle("is-complete", state !== "progress");

      claimBtn.setAttribute("data-ach-claim", def.id);
      if (state === "claimable") {
        claimBtn.disabled = false;
        claimBtn.className = "ach-claim-btn is-ready";
        claimBtn.textContent = "RÉCLAMER";
      } else if (state === "claimed") {
        claimBtn.disabled = true;
        claimBtn.className = "ach-claim-btn is-claimed";
        claimBtn.textContent = "RÉCUPÉRÉ";
      } else {
        claimBtn.disabled = true;
        claimBtn.className = "ach-claim-btn is-disabled";
        claimBtn.textContent = "RÉCLAMER";
      }
    }

    function bindAchievementsUi() {
      if (achievementsUiBound) return;
      achievementsUiBound = true;
      const panel = document.getElementById("panel-achievements");
      if (!panel) return;
      panel.addEventListener("click", (e) => {
        const chip = e.target.closest("[data-ach-filter]");
        if (chip && panel.contains(chip)) {
          const id = chip.getAttribute("data-ach-filter");
          if (!id || achievementsFilter === id) return;
          achievementsFilter = id;
          if (selectedAchievementId) {
            const sel = ACHIEVEMENT_DEFS.find((d) => d.id === selectedAchievementId);
            if (!sel || (id !== "all" && sel.category !== id)) selectedAchievementId = null;
          }
          achievementsDirty = true;
          renderAchievements();
          return;
        }
        const tile = e.target.closest("[data-ach-select]");
        if (tile && panel.contains(tile)) {
          const id = tile.getAttribute("data-ach-select");
          if (!id) return;
          selectAchievement(id);
          return;
        }
        const claimAll = e.target.closest("#btn-claim-all-achievements");
        if (claimAll && panel.contains(claimAll)) {
          claimAllAchievementRewards();
          renderAchievements();
          renderHeader();
          return;
        }
        const claimBtn = e.target.closest("[data-ach-claim]");
        if (claimBtn && panel.contains(claimBtn) && !claimBtn.disabled) {
          const id = claimBtn.getAttribute("data-ach-claim");
          if (!id) return;
          claimAchievementReward(id);
          renderAchievements();
          renderHeader();
        }
      });
    }

    function clearHatchFxTimers() {
      for (let i = 0; i < hatchFxTimers.length; i++) clearTimeout(hatchFxTimers[i]);
      hatchFxTimers = [];
    }

    function hatchDelay(ms, token) {
      return new Promise((resolve) => {
        const id = setTimeout(() => {
          if (token === hatchFxToken) resolve(true);
          else resolve(false);
        }, ms);
        hatchFxTimers.push(id);
      });
    }

    function safeCancelAnimation(anim) {
      if (!anim) return;
      try { anim.cancel(); } catch (e) { /* ignore */ }
    }

    function waitAnimation(anim) {
      if (!anim || !anim.finished) return Promise.resolve();
      return anim.finished.catch(() => {});
    }

    function getEggClickWrapper() {
      return document.getElementById("egg-click-wrapper");
    }

    function getEggHatchWrapper() {
      return document.getElementById("egg-hatch-wrapper");
    }

    /**
     * Cible WAAPI du press = #egg-click-wrapper uniquement.
     * Taille permanente / ox / carousel restent sur d'autres wrappers
     * (#egg-visual-inner width/scale, .egg-carousel-item).
     */
    function getEggClickVisual() {
      return getEggClickWrapper() || document.getElementById("egg-visual");
    }

    function playEggClickPress(isCrit, opts) {
      opts = opts || {};
      const isCharged = !!opts.charged;
      let kind = "normal";
      if (isCharged && isCrit) kind = "chargedCrit";
      else if (isCharged) kind = "charged";
      else if (isCrit) kind = "crit";

      /* Cible exclusive du press — jamais la taille permanente (#egg-visual-inner). */
      const el = getEggClickWrapper();
      if (!el || typeof el.animate !== "function") return;

      const reduce = prefersReducedMotion();
      const preset = (window.DCAnim && DCAnim.eggPressKeyframes)
        ? DCAnim.eggPressKeyframes(kind, reduce)
        : {
            keyframes: [
              { transform: "translate3d(0, 0, 0) scale3d(1, 1, 1)" },
              { transform: "translate3d(0, 10px, 0) scale3d(0.86, 0.86, 1)", offset: 0.35 },
              { transform: "translate3d(0, -3px, 0) scale3d(1.05, 1.05, 1)", offset: 0.7 },
              { transform: "translate3d(0, 0, 0) scale3d(1, 1, 1)" }
            ],
            duration: 130
          };

      /* Un seul moteur : WAAPI. Cancel / restart immédiat. */
      safeCancelAnimation(eggClickAnimation);
      eggClickAnimation = null;
      if (el.getAnimations) {
        el.getAnimations().forEach((a) => {
          try { a.cancel(); } catch (e) { /* ignore */ }
        });
      }

      const anim = el.animate(preset.keyframes, {
        duration: preset.duration || 130,
        easing: "ease-out",
        fill: "none",
        composite: "replace"
      });
      eggClickAnimation = anim;
      waitAnimation(anim).then(() => {
        if (eggClickAnimation === anim) eggClickAnimation = null;
      });

      if (kind !== "normal") playEggClickGlow(true);
    }

    /** Soft gold flash on glow ring only — never touches egg image opacity */
    function playEggClickGlow(isCrit) {
      const glow = document.querySelector("#entity-wrap > .egg-glow");
      if (!glow || typeof glow.animate !== "function" || prefersReducedMotion()) return;
      safeCancelAnimation(eggClickGlowAnimation);
      const peak = isCrit ? 1 : 0.9;
      eggClickGlowAnimation = glow.animate(
        [
          { opacity: 0.5, filter: "brightness(1) saturate(1)" },
          { opacity: peak, filter: isCrit ? "brightness(1.55) saturate(1.2)" : "brightness(1.35) saturate(1.1)" },
          { opacity: 0.5, filter: "brightness(1) saturate(1)" }
        ],
        { duration: isCrit ? 170 : 130, easing: "ease-out" }
      );
      waitAnimation(eggClickGlowAnimation).then(() => {
        eggClickGlowAnimation = null;
      });
    }

    function playEggLocalShake(intensity) {
      const el = getEggHatchWrapper();
      if (!el || typeof el.animate !== "function" || prefersReducedMotion()) return;
      if (hatchSequenceActive) return;
      safeCancelAnimation(eggAmbientAnimation);
      const amp = Math.max(0.6, intensity || 1);
      eggAmbientAnimation = el.animate(
        [
          { transform: "translate(0, 0) rotate(0deg)" },
          { transform: "translate(" + (-1.4 * amp) + "px, 0) rotate(" + (-0.5 * amp) + "deg)" },
          { transform: "translate(" + (1.4 * amp) + "px, 0) rotate(" + (0.5 * amp) + "deg)" },
          { transform: "translate(" + (-0.8 * amp) + "px, 0) rotate(" + (-0.25 * amp) + "deg)" },
          { transform: "translate(0, 0) rotate(0deg)" }
        ],
        { duration: 160 + amp * 40, easing: "ease-in-out" }
      );
      waitAnimation(eggAmbientAnimation).then(() => {
        eggAmbientAnimation = null;
      });
    }

    function tickEggAmbientFx(now) {
      if (hatchSequenceActive || clicksLocked || prefersReducedMotion()) return;
      const eggDef = getEquippedEggDef();
      if (!eggDef || eggDef.comingSoon) return;
      const prog = getEggProgress(eggDef.id);
      const pct = getHatchPercent(eggDef, prog.progress);
      let interval = 0;
      let intensity = 0;
      if (pct >= 95) { interval = 1100; intensity = 2.1; }
      else if (pct >= 90) { interval = 2000; intensity = 1.55; }
      else if (pct >= 75) { interval = 3200; intensity = 0.95; }
      else return;
      if (now - lastEggAmbientShakeAt < interval) return;
      lastEggAmbientShakeAt = now;
      playEggLocalShake(intensity);
      if (pct >= 75 && Math.random() < 0.35) spawnAmbientSpark();
    }

    function pruneFxList(list, max) {
      while (list.length >= max) {
        const old = list.shift();
        if (old && old.parentNode) old.remove();
      }
    }

    function scheduleFxRemove(list, el, ms) {
      setTimeout(() => {
        const i = list.indexOf(el);
        if (i >= 0) list.splice(i, 1);
        if (el && el.parentNode) el.remove();
      }, ms);
    }

    /* -------------------------------------------------------
       VISUAL EFFECTS
       ------------------------------------------------------- */
    function spawnClickEffects(x, y, amount, isCrit, opts) {
      opts = opts || {};
      const zone = document.getElementById("click-zone");
      if (!zone) return;
      const rect = zone.getBoundingClientRect();
      const localX = (typeof x === "number" ? x : rect.left + rect.width / 2) - rect.left;
      const localY = (typeof y === "number" ? y : rect.top + rect.height / 2) - rect.top;
      const jitterX = localX + (Math.random() - 0.5) * 28;
      const jitterY = localY + (Math.random() - 0.5) * 18;
      const reduce = prefersReducedMotion();
      const isCharged = !!opts.charged;
      const both = isCrit && isCharged;

      /* Crit/charged : glow seulement — le squash est déjà parti sur pointerdown */
      if (isCrit || isCharged) playEggClickGlow(true);

      pruneFxList(activeClickFloats, MAX_CLICK_FLOATS);
      const ft = document.createElement("div");
      ft.className = "float-text" +
        (both ? " critical charged combo" : isCrit ? " critical" : "") +
        (isCharged && !both ? " charged" : "");
      ft.textContent = "+" + formatNumber(amount);
      ft.style.left = jitterX + "px";
      ft.style.top = jitterY + "px";
      zone.appendChild(ft);
      activeClickFloats.push(ft);
      /* Cleanup aligné sur CSS floatUp / floatUpCrit / floatUpLabel (~+30 %). */
      scheduleFxRemove(activeClickFloats, ft, both ? 820 : isCrit || isCharged ? 730 : 650);

      if ((isCrit || isCharged) && !reduce) {
        pruneFxList(activeClickFloats, MAX_CLICK_FLOATS);
        const label = document.createElement("div");
        label.className = "float-text float-label" +
          (both ? " critical charged combo" : isCrit ? " critical" : " charged");
        label.textContent = both ? "FRAPPE CRITIQUE !" : isCharged ? "FRAPPE CHARGÉE !" : "CRITIQUE !";
        label.style.left = (jitterX + (Math.random() - 0.5) * 12) + "px";
        label.style.top = (jitterY - 22) + "px";
        zone.appendChild(label);
        activeClickFloats.push(label);
        scheduleFxRemove(activeClickFloats, label, both ? 880 : 780);
      }

      if (!reduce) {
        let tier = "click";
        if (both) tier = "chargedCrit";
        else if (isCharged) tier = "charged";
        else if (isCrit) tier = "crit";
        const count = (window.DCAnim && DCAnim.particleCount)
          ? DCAnim.particleCount(tier)
          : (isCrit || isCharged ? (isMobileFx() ? 3 : 5) : (isMobileFx() ? 1 : 2));

        const clientX = rect.left + localX;
        const clientY = rect.top + localY;
        if (window.DCAnim && DCAnim.burst && count > 0) {
          const palette = both
            ? ["#ffe29a", "#ff8c42", "#7ad7ff", "#ffd36a"]
            : isCharged
              ? ["#7ad7ff", "#dff4ff", "#ffd36a"]
              : isCrit
                ? ["#ffe29a", "#ffb347", "#ff6a00"]
                : ["#ffb347", "#ffe29a"];
          DCAnim.burst(clientX, clientY, {
            count: count,
            palette: palette,
            speed: both ? 4.2 : isCharged || isCrit ? 3.4 : 2.4,
            size: both ? 4 : 3,
            life: both ? 560 : 420
          });
        } else {
          for (let i = 0; i < count; i++) {
            pruneFxList(activeClickParticles, MAX_CLICK_PARTICLES);
            const p = document.createElement("div");
            p.className = "particle" + (isCharged ? " particle-charged" : "");
            const angle = (Math.PI * 2 * i) / Math.max(1, count) + Math.random() * 0.5;
            const dist = 28 + Math.random() * 36;
            p.style.left = localX + "px";
            p.style.top = localY + "px";
            p.style.setProperty("--px", Math.cos(angle) * dist + "px");
            p.style.setProperty("--py", Math.sin(angle) * dist + "px");
            zone.appendChild(p);
            activeClickParticles.push(p);
            scheduleFxRemove(activeClickParticles, p, 520);
          }
        }

        if (window.DCAnim && DCAnim.spawnShockwave) {
          if (both) DCAnim.spawnShockwave(zone, localX, localY, "shockwave-combo");
          else if (isCharged) DCAnim.spawnShockwave(zone, localX, localY, "shockwave-charged");
          else if (isCrit) DCAnim.spawnShockwave(zone, localX, localY, "shockwave-crit");
        }

        if (isCrit || isCharged) {
          const flash = document.createElement("div");
          flash.className = both ? "crit-flash charged-flash combo-flash" : isCharged ? "crit-flash charged-flash" : "crit-flash";
          flash.style.left = localX + "px";
          flash.style.top = localY + "px";
          zone.appendChild(flash);
          setTimeout(() => { if (flash.parentNode) flash.remove(); }, 340);
        }
      }
    }

    /* -------------------------------------------------------
       NOTIFICATIONS
       ------------------------------------------------------- */
    function showNotification(title, body) {
      const container = document.getElementById("toast-container");
      while (container.children.length >= MAX_TOASTS) {
        container.removeChild(container.firstChild);
      }
      const toast = document.createElement("div");
      toast.className = "toast";
      toast.innerHTML =
        '<div class="toast-title"></div><div class="toast-body"></div>';
      toast.querySelector(".toast-title").textContent = title;
      toast.querySelector(".toast-body").textContent = body || "";
      container.appendChild(toast);
      setTimeout(() => {
        if (toast.parentNode) toast.remove();
      }, 3700);
    }

    /* -------------------------------------------------------
       AUDIO MANAGER — procedural SFX + ambient music loop
       Music file: assets/sound/Celestial Exploration.mp3
       ------------------------------------------------------- */
    const AudioManager = {
      ctx: null,
      lastPlayAt: Object.create(null),
      clickThrottleMs: 42,
      unlocked: false,
      htmlAudioWarmed: false,

      /* Single global ambient track */
      musicEl: null,
      musicStarted: false,
      musicFadeRaf: null,
      musicFadeActive: false,
      musicGestureBound: false,
      musicSrc: "assets/sound/Celestial%20Exploration.mp3",
      /**
       * Plafond réel de la musique (source unique).
       * Volume HTML = master × musicVolume(user 0–1) × musicBaseVolume.
       * À 100 % utilisateur → ~30 % du max HTML (piste moins agressive).
       */
      musicBaseVolume: 0.30,

      /* File-based SFX — real asset: assets/sound/egg crack.mp3 */
      eggCrackEl: null,
      eggCrackSrc: "assets/sound/egg%20crack.mp3",
      eggCrackBaseVolume: 0.55,

      /**
       * Dragon reveal SFX by rarity — noms EXACTS de assets/sound/
       *   common    → popup dragon commun 1.mp3  (commun 2.mp3 aussi présent, non utilisé)
       *   rare      → popup dragon rare.mp3
       *   epic      → popoup dragon epic.mp3     (typo fichier d'origine conservée)
       *   legendary → popup dragon legendaire.mp3
       *   mythic    → popup dragon mythique.mp3
       * divine → mythic ; inconnu → common
       */
      dragonRevealSoundSrc: {
        common: "assets/sound/popup%20dragon%20commun%201.mp3",
        rare: "assets/sound/popup%20dragon%20rare.mp3",
        epic: "assets/sound/popoup%20dragon%20epic.mp3",
        legendary: "assets/sound/popup%20dragon%20legendaire.mp3",
        mythic: "assets/sound/popup%20dragon%20mythique.mp3"
      },
      dragonRevealSoundEls: Object.create(null),
      dragonPopupBaseVolume: 0.6,

      getCtx() {
        if (!this.ctx) {
          try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
          } catch (e) {
            return null;
          }
        }
        return this.ctx;
      },

      unlock() {
        const ctx = this.getCtx();
        if (!ctx) return;
        if (ctx.state === "suspended") ctx.resume();
        this.unlocked = true;
        this.ensureEggCrack();
        this.ensureDragonRevealSounds();
        /* iOS / mobile : chauffer chaque HTMLAudio une seule fois pendant un geste */
        if (!this.htmlAudioWarmed) {
          this.warmHtmlAudioElements();
          this.htmlAudioWarmed = true;
        }
        this.startMusic({ fade: !this.musicStarted });
      },

      /** Mute-play-pause sur les SFX HTML pour autoriser play() hors geste (iOS). */
      warmHtmlAudioElements() {
        const warm = (el) => {
          if (!el) return;
          const prevVol = el.volume;
          try {
            el.muted = true;
            el.volume = 0;
            const p = el.play();
            const restore = () => {
              try { el.pause(); } catch (e1) { /* ignore */ }
              try { el.currentTime = 0; } catch (e2) { /* ignore */ }
              el.muted = false;
              el.volume = prevVol;
            };
            if (p && typeof p.then === "function") {
              p.then(restore).catch(restore);
            } else {
              restore();
            }
          } catch (e) {
            try { el.muted = false; el.volume = prevVol; } catch (e2) { /* ignore */ }
          }
        };
        warm(this.eggCrackEl);
        const els = this.dragonRevealSoundEls || {};
        const keys = Object.keys(els);
        for (let i = 0; i < keys.length; i++) warm(els[keys[i]]);
      },

      ensureEggCrack() {
        if (this.eggCrackEl) return this.eggCrackEl;
        const el = new Audio(this.eggCrackSrc);
        el.preload = "auto";
        el.volume = 0;
        el.setAttribute("playsinline", "");
        this.eggCrackEl = el;
        try { el.load(); } catch (e) { /* optional */ }
        return el;
      },

      /** Map game rarity → sound key (common / rare / epic / legendary / mythic). */
      resolveDragonRevealSoundKey(rarity) {
        const r = String(rarity == null ? "common" : rarity).toLowerCase().trim();
        if (r === "mythic" || r === "divine") return "mythic";
        if (r === "legendary" || r === "legendaire" || r === "légendaire") return "legendary";
        if (r === "epic" || r === "épique" || r === "epique") return "epic";
        if (r === "rare") return "rare";
        if (r === "common" || r === "commun") return "common";
        return "common";
      },

      ensureDragonRevealSound(key) {
        const k = this.dragonRevealSoundSrc[key] ? key : "common";
        if (this.dragonRevealSoundEls[k]) return this.dragonRevealSoundEls[k];
        const src = this.dragonRevealSoundSrc[k] || this.dragonRevealSoundSrc.common;
        const el = new Audio(src);
        el.preload = "auto";
        el.volume = 0;
        el.setAttribute("playsinline", "");
        this.dragonRevealSoundEls[k] = el;
        try { el.load(); } catch (e) { /* optional */ }
        return el;
      },

      ensureDragonRevealSounds() {
        const keys = Object.keys(this.dragonRevealSoundSrc);
        for (let i = 0; i < keys.length; i++) this.ensureDragonRevealSound(keys[i]);
        return this.dragonRevealSoundEls;
      },

      /* Legacy alias — précharge les sons de rareté */
      ensureDragonPopup() {
        return this.ensureDragonRevealSounds();
      },

      playEggCrack(opts) {
        opts = opts || {};
        const level = this.sfx();
        if (level <= 0) return;
        if (!opts.force && !this.canPlay("eggCrack", 400)) return;
        if (opts.force) this.lastPlayAt.eggCrack = performance.now();
        const el = this.ensureEggCrack();
        el.volume = Math.max(0, Math.min(1, this.eggCrackBaseVolume * level));
        try {
          el.currentTime = 0;
        } catch (e) { /* ignore seek errors before load */ }
        const p = el.play();
        if (p && typeof p.catch === "function") {
          p.catch(() => { /* autoplay / unlock may block once */ });
        }
      },

      /**
       * Play rarity-specific dragon reveal SFX (cached Audio elements).
       * @param {string} [rarity]
       * @param {{ force?: boolean }} [opts] force=true pour le reveal hatch (ignore throttle coffre)
       */
      playDragonRevealSound(rarity, opts) {
        opts = opts || {};
        const level = this.sfx();
        if (level <= 0) return;
        const key = this.resolveDragonRevealSoundKey(rarity);
        /*
          Throttle dédié hatch (`dragonRevealHatch`) — ne partage plus la clé
          `dragonPopup` avec les coffres (sinon un open coffre récent coupe le reveal).
        */
        const throttleKey = opts.force ? "dragonRevealHatch" : "dragonPopup";
        if (!opts.force && !this.canPlay(throttleKey, 180)) return;
        if (opts.force && !this.canPlay(throttleKey, 120)) return;

        const el = this.ensureDragonRevealSound(key);
        el.muted = false;
        el.volume = Math.max(0, Math.min(1, this.dragonPopupBaseVolume * level));
        try { el.playbackRate = 1; } catch (e0) { /* optional */ }

        const tryPlay = () => {
          try { el.currentTime = 0; } catch (e) { /* ignore seek errors before load */ }
          const p = el.play();
          if (p && typeof p.catch === "function") {
            p.catch(() => {
              /* Retry une fois après unlock (autoplay policy mobile) */
              try {
                const ctx = this.getCtx();
                if (ctx && ctx.state === "suspended") ctx.resume();
              } catch (e2) { /* ignore */ }
              try { el.currentTime = 0; } catch (e3) { /* ignore */ }
              const p2 = el.play();
              if (p2 && typeof p2.catch === "function") p2.catch(() => {});
            });
          }
        };

        if (el.readyState >= 2) {
          tryPlay();
        } else {
          let done = false;
          const finish = () => {
            if (done) return;
            done = true;
            el.removeEventListener("canplaythrough", finish);
            el.removeEventListener("loadeddata", finish);
            tryPlay();
          };
          el.addEventListener("canplaythrough", finish);
          el.addEventListener("loadeddata", finish);
          try { el.load(); } catch (e) { /* optional */ }
          setTimeout(finish, 280);
        }
      },

      /* Legacy name — délègue au son de rareté (common par défaut) */
      playDragonPopup(rarity, opts) {
        this.playDragonRevealSound(rarity, opts);
      },

      master() {
        return Math.max(0, Math.min(1, safeNumber(gameState.masterVolume, 1)));
      },
      sfx() {
        if (!gameState.soundEnabled) return 0;
        return this.master() * Math.max(0, Math.min(1, safeNumber(gameState.sfxVolume, 1)));
      },
      music() {
        if (!gameState.musicEnabled) return 0;
        const user = Math.max(0, Math.min(1, safeNumber(gameState.musicVolume, 1)));
        const base = Math.max(0, Math.min(1, safeNumber(this.musicBaseVolume, 0.30)));
        return this.master() * user * base;
      },

      /** Met à jour le volume des HTMLAudio SFX déjà créés (lecture en cours / caches). */
      applySfxVolume() {
        const level = this.sfx();
        if (this.eggCrackEl) {
          this.eggCrackEl.volume = Math.max(0, Math.min(1, this.eggCrackBaseVolume * level));
        }
        const els = this.dragonRevealSoundEls || {};
        const keys = Object.keys(els);
        for (let i = 0; i < keys.length; i++) {
          const el = els[keys[i]];
          if (el) el.volume = Math.max(0, Math.min(1, this.dragonPopupBaseVolume * level));
        }
      },

      ensureMusic() {
        if (this.musicEl) return this.musicEl;
        const el = new Audio(this.musicSrc);
        el.loop = true;
        el.preload = "auto";
        el.volume = 0;
        el.setAttribute("playsinline", "");
        this.musicEl = el;
        return el;
      },

      cancelMusicFade() {
        if (this.musicFadeRaf) {
          cancelAnimationFrame(this.musicFadeRaf);
          this.musicFadeRaf = null;
        }
        this.musicFadeActive = false;
      },

      applyMusicVolume(opts) {
        opts = opts || {};
        const el = this.ensureMusic();
        const target = this.music();

        if (opts.fromUser) {
          this.cancelMusicFade();
        }

        if (this.musicFadeActive && !opts.fromUser && !opts.fade) {
          return;
        }

        if (opts.fade && !opts.fromUser) {
          this.fadeMusicTo(target, opts.fadeMs || 650);
          return;
        }

        el.volume = target;

        if (!gameState.musicEnabled || target <= 0) {
          if (!el.paused) el.pause();
          return;
        }

        if (this.musicStarted && el.paused) {
          const p = el.play();
          if (p && typeof p.catch === "function") p.catch(() => this.bindMusicGestureOnce());
        }
      },

      fadeMusicTo(target, ms) {
        const el = this.ensureMusic();
        this.cancelMusicFade();
        const startVol = el.volume;
        const t0 = performance.now();
        this.musicFadeActive = true;
        const step = (now) => {
          if (!this.musicFadeActive) return;
          const u = Math.min(1, (now - t0) / ms);
          const latest = this.music();
          el.volume = startVol + (latest - startVol) * u;
          if (u < 1) {
            this.musicFadeRaf = requestAnimationFrame(step);
          } else {
            this.musicFadeRaf = null;
            this.musicFadeActive = false;
            el.volume = this.music();
          }
        };
        this.musicFadeRaf = requestAnimationFrame(step);
      },

      bindMusicGestureOnce() {
        if (this.musicGestureBound) return;
        this.musicGestureBound = true;
        const once = () => {
          document.removeEventListener("pointerdown", once, true);
          document.removeEventListener("click", once, true);
          document.removeEventListener("keydown", once, true);
          this.musicGestureBound = false;
          this.unlock();
        };
        document.addEventListener("pointerdown", once, true);
        document.addEventListener("click", once, true);
        document.addEventListener("keydown", once, true);
      },

      startMusic(opts) {
        opts = opts || {};
        const el = this.ensureMusic();
        const target = this.music();

        if (!gameState.musicEnabled || target <= 0) {
          el.volume = 0;
          if (!el.paused) el.pause();
          return;
        }

        /* Already playing: never restart — only sync volume */
        if (this.musicStarted && !el.paused) {
          if (!this.musicFadeActive) el.volume = target;
          return;
        }

        el.volume = opts.fade && !this.musicStarted ? 0 : target;
        const p = el.play();
        const onPlaying = () => {
          this.musicStarted = true;
          if (opts.fade) {
            this.fadeMusicTo(this.music(), opts.fadeMs || 650);
          } else {
            el.volume = this.music();
          }
        };
        if (p && typeof p.then === "function") {
          p.then(onPlaying).catch(() => {
            this.bindMusicGestureOnce();
          });
        } else {
          onPlaying();
        }
      },

      playMusic() {
        this.startMusic({ fade: !this.musicStarted });
      },

      stopMusic() {
        this.cancelMusicFade();
        if (this.musicEl && !this.musicEl.paused) {
          this.musicEl.pause();
        }
      },

      syncMusicFromSettings() {
        const el = this.ensureMusic();
        const target = this.music();
        this.cancelMusicFade();
        if (!gameState.musicEnabled || target <= 0) {
          el.volume = 0;
          if (!el.paused) el.pause();
          return;
        }
        el.volume = target;
        if (el.paused && this.musicStarted) {
          const p = el.play();
          if (p && typeof p.catch === "function") p.catch(() => this.bindMusicGestureOnce());
        } else if (el.paused && !this.musicStarted) {
          this.startMusic({ fade: true });
        }
      },

      canPlay(key, throttleMs) {
        const now = performance.now();
        const last = this.lastPlayAt[key] || 0;
        if (now - last < throttleMs) return false;
        this.lastPlayAt[key] = now;
        return true;
      },

      tone({ type = "sine", freq = 440, freqEnd = null, dur = 0.12, vol = 0.06, delay = 0 }) {
        const ctx = this.getCtx();
        const level = this.sfx();
        if (!ctx || level <= 0) return;
        try {
          if (ctx.state === "suspended") ctx.resume();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = type;
          osc.connect(gain);
          gain.connect(ctx.destination);
          const t0 = ctx.currentTime + delay;
          osc.frequency.setValueAtTime(freq, t0);
          if (freqEnd != null) {
            osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), t0 + dur);
          }
          const v = Math.max(0.0001, vol * level);
          gain.gain.setValueAtTime(v, t0);
          gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
          osc.start(t0);
          osc.stop(t0 + dur + 0.02);
        } catch (e) {
          /* audio optional */
        }
      },

      play(type, opts) {
        opts = opts || {};
        const isCrit = !!opts.isCrit;
        if (type === "click") {
          if (!this.canPlay("click", this.clickThrottleMs)) return;
          const pitch = 0.96 + Math.random() * 0.08;
          if (isCrit) {
            this.tone({ type: "triangle", freq: 520 * pitch, freqEnd: 760 * pitch, dur: 0.18, vol: 0.07 });
            this.tone({ type: "sine", freq: 260 * pitch, dur: 0.12, vol: 0.04, delay: 0.02 });
            return;
          }
          this.tone({ type: "sine", freq: 300 * pitch, freqEnd: 240 * pitch, dur: 0.08, vol: 0.045 });
          return;
        }
        if (type === "buy" || type === "purchase") {
          if (!this.canPlay("buy", 80)) return;
          this.tone({ type: "triangle", freq: 420, freqEnd: 680, dur: 0.14, vol: 0.055 });
          return;
        }
        if (type === "upgrade") {
          if (!this.canPlay("upgrade", 90)) return;
          this.tone({ type: "sine", freq: 480, freqEnd: 820, dur: 0.18, vol: 0.05 });
          return;
        }
        if (type === "error") {
          if (!this.canPlay("error", 120)) return;
          this.tone({ type: "sine", freq: 180, freqEnd: 120, dur: 0.12, vol: 0.035 });
          return;
        }
        if (type === "button") {
          if (!this.canPlay("button", 60)) return;
          this.tone({ type: "sine", freq: 380, dur: 0.05, vol: 0.025 });
          return;
        }
        if (type === "unlock") {
          this.tone({ type: "sine", freq: 440, freqEnd: 880, dur: 0.28, vol: 0.06 });
          this.tone({ type: "triangle", freq: 660, dur: 0.18, vol: 0.03, delay: 0.08 });
          return;
        }
        if (type === "achievement" || type === "success") {
          this.tone({ type: "sine", freq: 520, dur: 0.1, vol: 0.05 });
          this.tone({ type: "sine", freq: 780, dur: 0.18, vol: 0.045, delay: 0.09 });
          return;
        }
        if (type === "hatch" || type === "dragonReveal") {
          /* Légèrement plus snappy pour coller à l'ouverture visuelle (~+8–10 %). */
          this.tone({ type: "triangle", freq: 200, freqEnd: 520, dur: 0.25, vol: 0.06 });
          this.tone({ type: "sine", freq: 680, dur: 0.17, vol: 0.04, delay: 0.12 });
          return;
        }
        if (type === "eggCrack") {
          this.playEggCrack(opts);
          return;
        }
        if (type === "dragonPopup" || type === "dragonRevealSound") {
          this.playDragonRevealSound(opts.rarity, opts);
          return;
        }
        if (type === "rare") {
          this.tone({ type: "sine", freq: 560, freqEnd: 840, dur: 0.22, vol: 0.05 });
          return;
        }
        if (type === "legendary") {
          this.tone({ type: "sine", freq: 440, dur: 0.12, vol: 0.05 });
          this.tone({ type: "sine", freq: 660, dur: 0.14, vol: 0.045, delay: 0.1 });
          this.tone({ type: "sine", freq: 880, dur: 0.2, vol: 0.04, delay: 0.2 });
          return;
        }
        if (type === "mythic") {
          this.tone({ type: "sine", freq: 360, freqEnd: 720, dur: 0.3, vol: 0.055 });
          this.tone({ type: "triangle", freq: 540, freqEnd: 980, dur: 0.35, vol: 0.035, delay: 0.12 });
          return;
        }
        if (type === "expeditionStart") {
          if (!this.canPlay("expeditionStart", 200)) return;
          this.tone({ type: "sine", freq: 280, freqEnd: 420, dur: 0.22, vol: 0.045 });
          this.tone({ type: "triangle", freq: 180, freqEnd: 120, dur: 0.28, vol: 0.03, delay: 0.05 });
          return;
        }
        if (type === "expeditionComplete") {
          if (!this.canPlay("expeditionComplete", 400)) return;
          this.tone({ type: "sine", freq: 500, dur: 0.1, vol: 0.05 });
          this.tone({ type: "sine", freq: 750, dur: 0.2, vol: 0.045, delay: 0.1 });
          return;
        }
        if (type === "star") {
          this.tone({ type: "sine", freq: 700, freqEnd: 1100, dur: 0.16, vol: 0.04 });
          return;
        }
        if (type === "zoneUnlock") {
          this.tone({ type: "sine", freq: 400, freqEnd: 800, dur: 0.25, vol: 0.05 });
          return;
        }
        /* Future stubs: chest, altar, randomEvent — silent until assets exist */
      }
    };

    /** Son de reveal dragon selon la rareté — joué au moment où le dragon devient visible. */
    function playDragonRevealSound(rarity, opts) {
      AudioManager.playDragonRevealSound(rarity, opts);
    }

    /* Alias conservé pour appels existants (passe la rareté si fournie). */
    function playDragonPopupSound(rarity, opts) {
      playDragonRevealSound(rarity, opts);
    }

    function playSound(type, isCrit) {
      if (typeof isCrit === "boolean") {
        AudioManager.play(type, { isCrit: isCrit });
      } else {
        AudioManager.play(type, isCrit || {});
      }
    }

    function prefersReducedMotion() {
      if (window.DCAnim && typeof DCAnim.prefersReducedMotion === "function") {
        return DCAnim.prefersReducedMotion();
      }
      return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    }

    function isMobileFx() {
      if (window.DCAnim && typeof DCAnim.isMobileFx === "function") {
        return DCAnim.isMobileFx();
      }
      if (window.innerWidth <= 799) return true;
      if (window.matchMedia) {
        if (window.matchMedia("(max-width: 768px)").matches) return true;
        if (window.matchMedia("(hover: none) and (pointer: coarse)").matches) return true;
      }
      return !!(navigator.maxTouchPoints > 1 && window.innerWidth <= 1024);
    }

    function syncMobilePerformanceClass() {
      document.documentElement.classList.toggle("mobile-performance", isMobileFx());
    }

    /**
     * Paramètres (#btn-open-settings) : toujours dans le HUD (.header-right-cluster).
     * Desktop : à droite des badges Puissance/CPS.
     * Mobile : CSS grille le place sous le badge Puissance (plus dans le rail gauche).
     * appendChild conserve le même nœud — pas de clone, un seul id.
     */
    function syncSettingsButtonPlacement() {
      const gear = document.getElementById("btn-open-settings");
      const cluster = document.querySelector(".header-right-cluster");
      if (!gear || !cluster) return;
      if (gear.parentElement !== cluster) {
        cluster.appendChild(gear);
      }
    }

    function onSettingsButtonClick(e) {
      const gear = e.target && e.target.closest ? e.target.closest("#btn-open-settings") : null;
      if (!gear) return;
      const onSettings = getActiveOverlayPanelId() === "settings";
      switchPanel(onSettings ? "kingdom" : "settings");
    }

    /** Pause décor scène derrière Équipe / Coffres (mobile) — pas la logique gameplay. */
    function syncMobileModalOpenClass() {
      const teamOpen = !!(document.getElementById("team-module") &&
        document.getElementById("team-module").classList.contains("open"));
      const chestOpen = !!(document.getElementById("chest-modal") &&
        !document.getElementById("chest-modal").classList.contains("hidden"));
      const pickerOpen = !!(document.getElementById("team-picker-modal") &&
        !document.getElementById("team-picker-modal").classList.contains("hidden"));
      const any = isMobileFx() && (teamOpen || chestOpen || pickerOpen);
      const root = document.documentElement;
      root.classList.toggle("mobile-modal-open", any);
      /* État html distinct du bouton .mobile-team-open (évite width:26px sur <html>). */
      root.classList.toggle("is-mobile-team-open", isMobileFx() && teamOpen);
      root.classList.toggle("mobile-chest-open", isMobileFx() && chestOpen);
    }

    function updateChargedAuraVisual() {
      const every = getChargedStrikeTriggerClicks();
      const mult = getChargedStrikeMultiplier();
      if (!every || every <= 0 || !mult || mult <= 1) {
        if (lastChargedAuraKey !== "off") {
          lastChargedAuraKey = "off";
          if (window.DCAnim && DCAnim.setChargedAura) DCAnim.setChargedAura(false, false);
          else {
            const wrap = document.getElementById("entity-wrap");
            if (wrap) {
              wrap.classList.remove("charged-aura", "charged-aura-hot");
            }
          }
        }
        return;
      }
      const cur = Math.max(0, Math.floor(safeNumber(gameState.chargedStrikeClicks, 0)));
      const left = every - cur;
      const near = left <= 2 && left > 0;
      const hot = left === 1;
      const auraKey = near ? (hot ? "hot" : "near") : "idle";
      if (auraKey !== lastChargedAuraKey) {
        lastChargedAuraKey = auraKey;
        if (window.DCAnim && DCAnim.setChargedAura) DCAnim.setChargedAura(near, hot);
        else {
          const wrap = document.getElementById("entity-wrap");
          if (wrap) {
            wrap.classList.toggle("charged-aura", near);
            wrap.classList.toggle("charged-aura-hot", near && hot);
          }
        }
      }
    }

    /** Sparks charged — rythme frame (indépendant du throttle HUD). */
    function tickChargedAuraSparks() {
      if (lastChargedAuraKey !== "near" && lastChargedAuraKey !== "hot") return;
      if (prefersReducedMotion()) return;
      const hot = lastChargedAuraKey === "hot";
      if (Math.random() < (hot ? 0.45 : 0.22)) spawnAmbientSpark();
    }

    function triggerAnim(el, className, ms) {
      if (!el || prefersReducedMotion()) return;
      if (window.DCAnim && DCAnim.triggerClass) {
        DCAnim.triggerClass(el, className, ms);
        return;
      }
      el.classList.remove(className);
      void el.offsetWidth;
      el.classList.add(className);
      clearTimeout(el._animTimer);
      el._animTimer = setTimeout(() => el.classList.remove(className), ms || 320);
    }

    function pulseHudEssence() {
      if (window.DCAnim && DCAnim.pulseHudGain) {
        DCAnim.pulseHudGain();
        return;
      }
      const pill = document.querySelector(".essence-stat");
      if (pill) triggerAnim(pill, "anim-pulse", 200);
    }

    function spawnUiFloat(anchorEl, text, className) {
      if (!anchorEl || prefersReducedMotion()) return;
      const rect = anchorEl.getBoundingClientRect();
      const host = document.getElementById("app") || document.body;
      const el = document.createElement("div");
      el.className = className || "ui-float-gain";
      el.textContent = text;
      el.style.left = (rect.left + rect.width / 2) + "px";
      el.style.top = (rect.top + 8) + "px";
      el.style.position = "fixed";
      host.appendChild(el);
      setTimeout(() => el.remove(), 700);
    }

    /* Sync ambient music with toggle + volume prefs (single Audio instance). */
    function applyMusicSetting() {
      AudioManager.syncMusicFromSettings();
    }

    /* -------------------------------------------------------
       SAVE / LOAD / EXPORT / IMPORT / RESET
       ------------------------------------------------------- */
    function serializeState() {
      return {
        version: SAVE_VERSION,
        progressRevision: progressRevision,
        dragonEssence: gameState.dragonEssence,
        dragonPower: gameState.dragonPower,
        totalClicks: gameState.totalClicks,
        totalCriticalClicks: gameState.totalCriticalClicks,
        totalEssenceEarned: gameState.totalEssenceEarned,
        essenceFromClicks: gameState.essenceFromClicks,
        essenceFromAuto: gameState.essenceFromAuto,
        /* legacy mirrors for old tools / partial imports */
        totalPowerEarned: gameState.totalEssenceEarned,
        powerFromClicks: gameState.essenceFromClicks,
        powerFromAuto: gameState.essenceFromAuto,
        lifetimeManualClicks: gameState.lifetimeManualClicks,
        peakCps: gameState.peakCps,
        chargedStrikeClicks: Math.max(0, Math.floor(safeNumber(gameState.chargedStrikeClicks, 0))),
        producers: gameState.producers,
        activeUpgrades: gameState.activeUpgrades,
        shopPassives: gameState.shopPassives,
        levelPassives: gameState.levelPassives,
        specialUpgrades: gameState.specialUpgrades,
        upgrades: gameState.upgrades,
        achievements: gameState.achievements,
        eggs: gameState.eggs,
        dragons: gameState.dragons,
        equippedEggId: gameState.equippedEggId,
        zoneEggSelection: gameState.zoneEggSelection || {},
        totalEggsHatched: gameState.totalEggsHatched,
        totalExpeditionsCompleted: gameState.totalExpeditionsCompleted,
        totalDragonsObtained: gameState.totalDragonsObtained,
        rarityStats: gameState.rarityStats,
        hatchHistory: gameState.hatchHistory,
        eggHatched: gameState.eggHatched,
        eggStage: gameState.eggStage,
        introSeen: gameState.introSeen,
        soundEnabled: gameState.soundEnabled,
        musicEnabled: gameState.musicEnabled,
        masterVolume: safeNumber(gameState.masterVolume, 1),
        sfxVolume: safeNumber(gameState.sfxVolume, 1),
        musicVolume: safeNumber(gameState.musicVolume, 1),
        playTimeMs: gameState.playTimeMs,
        lastSaveTime: Date.now(),
        currentZoneId: gameState.currentZoneId || "sanctuary",
        unlockedZones: gameState.unlockedZones || ["sanctuary"],
        visitedZones: gameState.visitedZones || ["sanctuary"],
        zoneSpent: ensureZoneSpent(gameState),
        team: gameState.team,
        redeemedCodes: Array.isArray(gameState.redeemedCodes) ? gameState.redeemedCodes.slice() : [],
        chests: sanitizeChestInventory(gameState.chests),
        inventory: sanitizeInventory(gameState.inventory),
        eggBossSystem: sanitizeEggBossSystem(ensureEggBossSystem()),
        nextFreeChestAt: Math.max(0, Math.floor(safeNumber(gameState.nextFreeChestAt, 0))),
        fragmentBonusAccumulator: safeNumber(gameState.fragmentBonusAccumulator, 0),
        eggProgressAccumulator: safeNumber(gameState.eggProgressAccumulator, 0),
        expeditions: gameState.expeditions,
        meta: gameState.meta
      };
    }

    function saveGame(silent) {
      try {
        /* Ne pas écraser une sauvegarde plus récente écrite par un autre onglet
           (ex. après Réinitialiser / nouvelle partie). */
        try {
          const rawExisting = localStorage.getItem(SAVE_KEY);
          if (rawExisting) {
            const existing = JSON.parse(rawExisting);
            const existingRev = safeNumber(existing && existing.progressRevision, 0);
            if (existingRev > progressRevision) {
              return false;
            }
          }
        } catch (eGuard) { /* ignore parse errors — on tente l’écriture */ }

        calculateProduction();
        const data = serializeState();
        data.progressRevision = progressRevision;
        localStorage.setItem(SAVE_KEY, JSON.stringify(data));
        gameState.lastSaveTime = data.lastSaveTime;
        if (!silent) showNotification("💾 Partie sauvegardée", "Progression enregistrée.");
        return true;
      } catch (e) {
        if (!silent) showNotification("💾 Erreur", "Impossible de sauvegarder.");
        return false;
      }
    }

    function applyLoadedData(data) {
      const fresh = createDefaultState();

      /* Essence = ancienne monnaie dragonPower si dragonEssence absent */
      if (data.dragonEssence != null) {
        fresh.dragonEssence = Math.max(0, safeNumber(data.dragonEssence, 0));
      } else {
        fresh.dragonEssence = Math.max(0, safeNumber(data.dragonPower, 0));
      }
      fresh.totalEssenceEarned = Math.max(
        0,
        safeNumber(data.totalEssenceEarned, safeNumber(data.totalPowerEarned, 0))
      );
      fresh.essenceFromClicks = Math.max(
        0,
        safeNumber(data.essenceFromClicks, safeNumber(data.powerFromClicks, 0))
      );
      fresh.essenceFromAuto = Math.max(
        0,
        safeNumber(data.essenceFromAuto, safeNumber(data.powerFromAuto, 0))
      );
      fresh.totalPowerEarned = fresh.totalEssenceEarned;
      fresh.powerFromClicks = fresh.essenceFromClicks;
      fresh.powerFromAuto = fresh.essenceFromAuto;
      /* dragonPower recalculé après migration complète */
      fresh.dragonPower = 0;
      fresh.totalClicks = Math.max(0, safeNumber(data.totalClicks, 0));
      fresh.totalCriticalClicks = Math.max(0, safeNumber(data.totalCriticalClicks, 0));
      fresh.lifetimeManualClicks = Math.max(
        0,
        safeNumber(data.lifetimeManualClicks, data.totalClicks || 0)
      );
      fresh.peakCps = Math.max(0, Math.floor(safeNumber(data.peakCps, 0)));
      fresh.totalEggsHatched = Math.max(0, safeNumber(data.totalEggsHatched, 0));
      fresh.totalExpeditionsCompleted = Math.max(0, safeNumber(data.totalExpeditionsCompleted, 0));
      fresh.totalDragonsObtained = Math.max(0, safeNumber(data.totalDragonsObtained, 0));
      fresh.eggHatched = !!data.eggHatched || fresh.totalEggsHatched > 0;
      fresh.eggStage = safeNumber(data.eggStage, 1);
      fresh.introSeen = !!data.introSeen;
      fresh.soundEnabled = data.soundEnabled !== false;
      fresh.musicEnabled = data.musicEnabled !== false;
      fresh.masterVolume = Math.max(0, Math.min(1, Number(data.masterVolume != null ? data.masterVolume : 1)));
      fresh.sfxVolume = Math.max(0, Math.min(1, Number(data.sfxVolume != null ? data.sfxVolume : 1)));
      fresh.musicVolume = Math.max(0, Math.min(1, Number(data.musicVolume != null ? data.musicVolume : 1)));
      fresh.playTimeMs = Math.max(0, safeNumber(data.playTimeMs, 0));
      fresh.lastSaveTime = safeNumber(data.lastSaveTime, Date.now());
      fresh.lastTickTime = Date.now();

      if (data.rarityStats && typeof data.rarityStats === "object") {
        Object.keys(fresh.rarityStats).forEach((k) => {
          fresh.rarityStats[k] = Math.max(0, safeNumber(data.rarityStats[k], 0));
        });
      }

      if (Array.isArray(data.hatchHistory)) {
        fresh.hatchHistory = data.hatchHistory.slice(0, HATCH_HISTORY_MAX).map((h) => ({
          dragonId: h.dragonId,
          name: h.name || "???",
          rarity: h.rarity || "common",
          eggId: h.eggId || "basic",
          at: h.at || Date.now(),
          isNew: !!h.isNew
        }));
      }

      if (data.producers && typeof data.producers === "object") {
        /* Migrate renamed sanctuary building → sanctuaryHall */
        if (data.producers.sanctuary && !data.producers.sanctuaryHall) {
          data.producers.sanctuaryHall = data.producers.sanctuary;
        }
        PRODUCER_DEFS.forEach((p) => {
          const src = data.producers[p.id];
          const maxLvl = Math.max(1, Math.floor(safeNumber(p.maxLevel, MAX_PRODUCER_LEVEL)));
          fresh.producers[p.id] = {
            owned: Math.max(0, Math.min(maxLvl, Math.floor(safeNumber(src?.owned, 0))))
          };
        });
      }

      /* Active upgrades + shop passives (+ legacy one-shot migration) */
      ACTIVE_UPGRADE_DEFS.forEach((u) => {
        fresh.activeUpgrades[u.id] = { level: 0 };
      });
      SHOP_PASSIVE_DEFS.forEach((u) => {
        fresh.shopPassives[u.id] = { bought: false };
      });
      LEVEL_PASSIVE_DEFS.forEach((u) => {
        fresh.levelPassives[u.id] = { level: 0 };
      });
      SPECIAL_UPGRADE_DEFS.forEach((u) => {
        fresh.specialUpgrades[u.id] = { bought: false };
      });
      LEGACY_UPGRADE_IDS.forEach((id) => {
        fresh.upgrades[id] = { bought: false };
      });

      if (data.activeUpgrades && typeof data.activeUpgrades === "object") {
        ACTIVE_UPGRADE_DEFS.forEach((u) => {
          const src = data.activeUpgrades[u.id];
          let lvl = Math.max(0, Math.floor(safeNumber(src?.level, 0)));
          /* Impulsion / Résonance (0–5) → Force Draconique (0–3), slot fervor_sanctuary */
          if (u.id === "fervor_sanctuary" && u.bonusType === "clickPowerFlat") {
            const fromVer = safeNumber(data.version, 0);
            if (fromVer < 11) {
              lvl = migrateResonanceLevelToForce(lvl);
            }
          }
          /* Ancienne Ferveur / Résonance valley → Force Élémentaire */
          if (u.id === "force_valley") {
            const fromVer = safeNumber(data.version, 0);
            if (fromVer < 12) {
              const legacy = Math.max(0, Math.floor(safeNumber(data.activeUpgrades.fervor_valley?.level, 0)));
              if (legacy > lvl) lvl = migrateResonanceLevelToForce(legacy);
            }
          }
          if (u.id === "claws_valley" && safeNumber(data.version, 0) < 12) {
            /* Ancien max 15 → table 12 */
            lvl = Math.min(12, Math.round(lvl * 12 / 15) || lvl);
          }
          if (u.id === "instinct_valley" && safeNumber(data.version, 0) < 12) {
            lvl = Math.min(8, lvl);
          }
          fresh.activeUpgrades[u.id] = {
            level: Math.max(0, Math.min(u.maxLevel, lvl))
          };
        });
      }

      fresh.chargedStrikeClicks = Math.max(0, Math.floor(safeNumber(data.chargedStrikeClicks, 0)));

      if (data.shopPassives && typeof data.shopPassives === "object") {
        SHOP_PASSIVE_DEFS.forEach((u) => {
          fresh.shopPassives[u.id] = {
            bought: !!(data.shopPassives[u.id] && data.shopPassives[u.id].bought)
          };
        });
        /* Migrate old Sommeil Profond → Veille niv.1 */
        if (data.shopPassives.deepSleep && data.shopPassives.deepSleep.bought) {
          fresh.levelPassives.dragonWatch = {
            level: Math.max(1, safeNumber(fresh.levelPassives.dragonWatch?.level, 0))
          };
        }
      }

      if (data.levelPassives && typeof data.levelPassives === "object") {
        LEVEL_PASSIVE_DEFS.forEach((u) => {
          const src = data.levelPassives[u.id];
          fresh.levelPassives[u.id] = {
            level: Math.max(0, Math.min(u.maxLevel, Math.floor(safeNumber(src?.level, 0))))
          };
        });
      }

      if (data.specialUpgrades && typeof data.specialUpgrades === "object") {
        SPECIAL_UPGRADE_DEFS.forEach((u) => {
          fresh.specialUpgrades[u.id] = {
            bought: !!(data.specialUpgrades[u.id] && data.specialUpgrades[u.id].bought)
          };
        });
        /* Anciennes saves : critAwakening (Éveil Critique) peut encore être présent —
           non recopié (retiré des defs), effet non appliqué. */
      }

      if (data.upgrades && typeof data.upgrades === "object") {
        LEGACY_UPGRADE_IDS.forEach((id) => {
          fresh.upgrades[id] = {
            bought: !!(data.upgrades[id] && data.upgrades[id].bought)
          };
        });
        /* Migrate legacy one-shots into new systems when activeUpgrades absent / v<5 */
        const saveVer = safeNumber(data.version, 1);
        const needMigrate = saveVer < 5 || !data.activeUpgrades;
        if (needMigrate) {
          const bought = (id) => !!(data.upgrades[id] && data.upgrades[id].bought);
          let claws = 0, instinct = 0, bite = 0;
          if (bought("steadyClaw")) claws += 2;
          if (bought("focusedStrike")) claws += 5;
          if (bought("ironTalon")) claws += 3;
          if (bought("risingHeat")) claws += 6;
          if (bought("temperedStrike")) claws += 10;
          if (bought("keenEye")) instinct += 5;
          if (bought("luckySpark")) instinct += 10;
          if (bought("sharpCrit")) bite += 8;
          if (bought("steadyCrit")) bite += 12;
          const cId = "claws_sanctuary";
          const iId = "instinct_sanctuary";
          const bId = "bite_sanctuary";
          fresh.activeUpgrades[cId].level = Math.max(
            fresh.activeUpgrades[cId].level,
            Math.min(MAX_ACTIVE_LEVEL, claws)
          );
          fresh.activeUpgrades[iId].level = Math.max(
            fresh.activeUpgrades[iId].level,
            Math.min(MAX_ACTIVE_LEVEL, instinct)
          );
          fresh.activeUpgrades[bId].level = Math.max(
            fresh.activeUpgrades[bId].level,
            Math.min(MAX_ACTIVE_LEVEL, bite)
          );
          if (bought("thriftyNest")) fresh.shopPassives.thriftyNest.bought = true;
          if (bought("deepSleep")) {
            fresh.levelPassives.dragonWatch = { level: Math.max(1, safeNumber(fresh.levelPassives.dragonWatch?.level, 0)) };
          }
          if (bought("fragmentSense")) fresh.shopPassives.fragmentSense.bought = true;
        }
      }

      if (data.achievements && typeof data.achievements === "object") {
        ACHIEVEMENT_DEFS.forEach((a) => {
          const src = data.achievements[a.id];
          fresh.achievements[a.id] = {
            unlocked: !!(src && src.unlocked),
            rewardClaimed: !!(src && src.rewardClaimed)
          };
        });
        /* Migration : anciens succès terminés → nouveaux IDs (rewardClaimed reste false) */
        Object.keys(LEGACY_ACHIEVEMENT_UNLOCK_MAP).forEach((oldId) => {
          const src = data.achievements[oldId];
          if (!src || !src.unlocked) return;
          const newId = LEGACY_ACHIEVEMENT_UNLOCK_MAP[oldId];
          if (fresh.achievements[newId]) fresh.achievements[newId].unlocked = true;
        });
      }

      /* Migrate eggs — hatch progress is now manual power, not raw clicks */
      const saveVer = safeNumber(data.version, 1);
      if (data.eggs && typeof data.eggs === "object") {
        EGG_DEFS.forEach((e) => {
          let src = data.eggs[e.id];
          if (!src && e.id === "basic" && data.eggs.fire) {
            src = data.eggs.fire;
          }
          if (src && typeof src === "object") {
            let progress = Math.max(0, safeNumber(src.progress, 0));
            const newReq = getEggHatchRequirement(e);
            if (saveVer < 4) {
              /* Old progress was click-count based (typically /500) — scale into hatch power */
              const oldReq = Math.max(1, safeNumber(src.requiredClicks, e.requiredClicks || 500));
              progress = Math.floor(progress * (newReq / oldReq));
            } else if (saveVer < 13 && (e.id === "plant" || e.id === "cascade")) {
              /* Zone 2 rebalance v13 : conserver le % de progression (ancien seuil 400). */
              const oldReq = 400;
              const pct = Math.min(1, progress / oldReq);
              progress = Math.floor(pct * newReq);
            } else if (saveVer < 14 && (e.id === "plant" || e.id === "cascade")) {
              /* Hatch balance v14 : Sylvestre 1000→2500, Cascades 1500→3500 — conserver le %. */
              const oldReq = e.id === "plant" ? 1000 : 1500;
              const pct = Math.min(1, progress / Math.max(1, oldReq));
              progress = Math.floor(pct * newReq);
            }
            fresh.eggs[e.id] = {
              unlocked: src.unlocked != null ? !!src.unlocked : !!e.startUnlocked,
              progress: Math.max(0, Math.floor(progress)),
              timesHatched: Math.max(
                0,
                Math.floor(safeNumber(src.timesHatched, src.hatched ? 1 : 0))
              ),
              crackSoundPlayed: !!src.crackSoundPlayed,
              pityCounters: {
                sinceLegendary: Math.max(0, safeNumber(src.pityCounters?.sinceLegendary, 0)),
                sinceMythic: Math.max(0, safeNumber(src.pityCounters?.sinceMythic, 0))
              }
            };
            if (fresh.eggs[e.id].progress >= newReq) {
              fresh.eggs[e.id].progress = Math.min(fresh.eggs[e.id].progress, newReq - 1);
            }
            /* Egg crack is reserved for the 100% hatch sequence only — no anticipatory flag. */
          }
        });
      }
      /* Always ensure basic egg unlocked */
      fresh.eggs.basic.unlocked = true;

      /* Migrate dragons — include stars + heal discovery from legacy fields */
      if (data.dragons && typeof data.dragons === "object") {
        DRAGON_DEFS.forEach((d) => {
          const src = data.dragons[d.id];
          if (src && typeof src === "object") {
            fresh.dragons[d.id] = {
              owned: !!src.owned,
              discovered: src.discovered,
              obtainedAt: src.obtainedAt || src.firstDiscoveredAt || src.discoveredAt || null,
              timesObtained: Math.max(0, Math.floor(safeNumber(src.timesObtained, 0))),
              fragments: Math.max(0, Math.floor(safeNumber(src.fragments, 0))),
              stars: Math.max(0, Math.floor(safeNumber(src.stars, 0)))
            };
          }
        });
      }

      /* Also accept legacy alias keys if any (never drop progress) */
      const LEGACY_DRAGON_ALIASES = {
        rare: "aeryx",
        legendary: "vaelgor",
        legendaire: "vaelgor",
        mythic: "astralyon",
        mythique: "astralyon",
        dragonRare: "aeryx",
        dragonLegendary: "vaelgor",
        dragonMythic: "astralyon"
      };
      if (data.dragons && typeof data.dragons === "object") {
        Object.keys(LEGACY_DRAGON_ALIASES).forEach((alias) => {
          const realId = LEGACY_DRAGON_ALIASES[alias];
          const src = data.dragons[alias];
          if (!src || typeof src !== "object") return;
          const dest = ensureDragonEntry(realId, fresh);
          if (src.owned || src.discovered || safeNumber(src.timesObtained, 0) >= 1 || src.obtainedAt) {
            dest.owned = true;
            dest.timesObtained = Math.max(dest.timesObtained, Math.floor(safeNumber(src.timesObtained, 1)));
            dest.fragments = Math.max(dest.fragments, Math.floor(safeNumber(src.fragments, 0)));
            dest.obtainedAt = dest.obtainedAt || src.obtainedAt || null;
            dest.stars = Math.max(dest.stars, Math.floor(safeNumber(src.stars, 1)) || 1);
          }
        });
      }

      if (Array.isArray(data.hatchHistory)) {
        /* already loaded above into fresh.hatchHistory — keep */
      }

      let eq = data.equippedEggId;
      if (eq === "fire") eq = "basic"; /* legacy remap */
      if (eq && fresh.eggs[eq] && fresh.eggs[eq].unlocked) {
        const def = EGG_DEFS.find((e) => e.id === eq);
        fresh.equippedEggId = def && !def.comingSoon ? eq : "basic";
      } else {
        fresh.equippedEggId = "basic";
      }

      if (data.meta && typeof data.meta === "object") {
        fresh.meta = Object.assign({}, fresh.meta, data.meta);
        if (!Array.isArray(fresh.meta.collectedDragons)) fresh.meta.collectedDragons = [];
      }

      /* Zones migration */
      let unlocked = Array.isArray(data.unlockedZones)
        ? data.unlockedZones.slice()
        : (Array.isArray(fresh.meta.unlockedZones) ? fresh.meta.unlockedZones.slice() : []);
      unlocked = unlocked.map((z) => {
        if (z === "cave") return "sanctuary";
        if (z === "forgotten") return "zone4";
        return z;
      });
      if (unlocked.indexOf("sanctuary") === -1) unlocked.unshift("sanctuary");
      fresh.unlockedZones = unlocked.filter((id, i, arr) => arr.indexOf(id) === i);
      fresh.meta.unlockedZones = fresh.unlockedZones.slice();
      const wantZoneRaw = data.currentZoneId === "cave" ? "sanctuary" : (data.currentZoneId || "sanctuary");
      const wantZone = wantZoneRaw === "forgotten" ? "zone4" : wantZoneRaw;
      fresh.currentZoneId = fresh.unlockedZones.indexOf(wantZone) !== -1 ? wantZone : "sanctuary";

      /* Eggs of unlocked zones become available (plant egg after valley unlock). */
      fresh.unlockedZones.forEach((zid) => unlockZoneEggs(zid, fresh));

      let visited = Array.isArray(data.visitedZones) ? data.visitedZones.slice() : [];
      visited = visited.map((z) => {
        if (z === "cave") return "sanctuary";
        if (z === "forgotten") return "zone4";
        return z;
      });
      if (visited.indexOf("sanctuary") === -1) visited.unshift("sanctuary");
      /* Legacy: unlocked zones without visitedZones count as visited except fresh valley unlock. */
      if (!Array.isArray(data.visitedZones)) {
        fresh.unlockedZones.forEach((zid) => {
          if (visited.indexOf(zid) === -1) visited.push(zid);
        });
      }
      if (fresh.currentZoneId && visited.indexOf(fresh.currentZoneId) === -1) {
        visited.push(fresh.currentZoneId);
      }
      fresh.visitedZones = visited.filter((id, i, arr) => arr.indexOf(id) === i);

      /* zoneSpent : dépenses d'Essence par zone (déblocage progressif). */
      ensureZoneSpent(fresh);
      if (data.zoneSpent && typeof data.zoneSpent === "object") {
        ZONE_DEFS.forEach((z) => {
          fresh.zoneSpent[z.id] = Math.max(0, safeNumber(data.zoneSpent[z.id], 0));
        });
      } else {
        /* Migration : reconstruire depuis les niveaux déjà achetés. */
        ZONE_DEFS.forEach((z) => {
          fresh.zoneSpent[z.id] = estimateZoneSpentFromProgress(fresh, z.id);
        });
      }

      /* Equipped egg must belong to current zone when possible */
      const curZoneDef = getZoneDef(fresh.currentZoneId);
      const zoneEggIds = (curZoneDef && curZoneDef.eggIds) || [];
      if (zoneEggIds.length && zoneEggIds.indexOf(fresh.equippedEggId) === -1) {
        const firstUnlocked = zoneEggIds.find((id) => fresh.eggs[id] && fresh.eggs[id].unlocked);
        if (firstUnlocked) fresh.equippedEggId = firstUnlocked;
      }

      /* Carrousel Zone 2+ : selectedEggId + progression par œuf déjà dans fresh.eggs */
      fresh.zoneEggSelection = {};
      if (data.zoneEggSelection && typeof data.zoneEggSelection === "object") {
        Object.keys(data.zoneEggSelection).forEach((zid) => {
          const src = data.zoneEggSelection[zid];
          if (!src || typeof src !== "object") return;
          const zEggs = getZoneCarouselEggs(zid);
          let sel = src.selectedEggId;
          if (!sel || !zEggs.some((e) => e.id === sel)) {
            sel = zEggs.length ? zEggs[0].id : null;
          }
          if (sel) fresh.zoneEggSelection[zid] = { selectedEggId: sel };
        });
      }
      ZONE_DEFS.forEach((z) => {
        if (!zoneSupportsEggCarousel(z.id)) return;
        if (!isZoneUnlocked(fresh, z.id)) return;
        const hadSaved = !!(
          data.zoneEggSelection &&
          data.zoneEggSelection[z.id] &&
          data.zoneEggSelection[z.id].selectedEggId
        );
        ensureZoneEggSelection(z.id, fresh);
        /* Ancienne sauvegarde sans selectedEggId : garder l'œuf équipé si valide */
        if (!hadSaved && z.id === fresh.currentZoneId && zoneEggIds.indexOf(fresh.equippedEggId) !== -1) {
          fresh.zoneEggSelection[z.id].selectedEggId = fresh.equippedEggId;
        }
        if (z.id === fresh.currentZoneId) {
          const selId = fresh.zoneEggSelection[z.id] && fresh.zoneEggSelection[z.id].selectedEggId;
          if (selId) fresh.equippedEggId = selId;
        }
      });

      fresh.redeemedCodes = [];
      if (Array.isArray(data.redeemedCodes)) {
        data.redeemedCodes.forEach((c) => {
          if (typeof c === "string" && c && fresh.redeemedCodes.indexOf(c) === -1) {
            fresh.redeemedCodes.push(c);
          }
        });
      }

      fresh.chests = sanitizeChestInventory(data.chests);
      fresh.inventory = sanitizeInventory(data.inventory);
      fresh.eggBossSystem = sanitizeEggBossSystem(data.eggBossSystem);
      /* Legacy sans champ : coffre régulier immédiatement disponible */
      fresh.nextFreeChestAt = Math.max(0, Math.floor(safeNumber(data.nextFreeChestAt, 0)));

      fresh.fragmentBonusAccumulator = Math.max(0, safeNumber(data.fragmentBonusAccumulator, 0));
      fresh.eggProgressAccumulator = Math.max(0, safeNumber(data.eggProgressAccumulator, 0));

      if (Array.isArray(data.team)) {
        const seen = {};
        for (let i = 0; i < TEAM_SIZE; i++) {
          const id = data.team[i];
          const valid = typeof id === "string" && getDragonDef(id) && !seen[id];
          fresh.team[i] = valid ? id : null;
          if (valid) seen[id] = true;
        }
      }

      fresh.expeditions = createEmptyExpeditionState();
      if (data.expeditions && typeof data.expeditions === "object") {
        const src = data.expeditions;
        fresh.expeditions.unlockedSlots = Math.max(
          1,
          Math.floor(safeNumber(src.unlockedSlots, DEFAULT_EXPEDITION_SLOTS))
        );
        if (src.systemUnlocked) fresh.expeditions.systemUnlocked = true;

        /* Menace active (avant slots — getExpeditionDef menace dépend de ceci) */
        if (src.activeThreat && typeof src.activeThreat === "object") {
          const t = src.activeThreat;
          fresh.expeditions.activeThreat = {
            id: String(t.id || ("threat_" + Date.now())),
            name: String(t.name || "Menace"),
            zoneId: t.zoneId || "sanctuary",
            sourceExpeditionId: t.sourceExpeditionId || null,
            recommendedPower: Math.max(1, Math.floor(safeNumber(t.recommendedPower, 1))),
            durationMs: Math.max(60000, Math.floor(safeNumber(t.durationMs, 600000))),
            image: typeof t.image === "string" ? t.image : "",
            description: typeof t.description === "string" ? t.description : "",
            rewardPreview: typeof t.rewardPreview === "string" ? t.rewardPreview : "",
            rewardConfig: t.rewardConfig && typeof t.rewardConfig === "object" ? t.rewardConfig : {},
            state: t.state === "running" ? "running" : "detected",
            runId: t.runId || null
          };
        }
        if (src.contractProcessedRuns && typeof src.contractProcessedRuns === "object") {
          fresh.expeditions.contractProcessedRuns = Object.assign({}, src.contractProcessedRuns);
        }
        if (src.threatRolledRuns && typeof src.threatRolledRuns === "object") {
          fresh.expeditions.threatRolledRuns = Object.assign({}, src.threatRolledRuns);
        }
        /* Contrats quotidiens V2 */
        if (src.dailyContracts && typeof src.dailyContracts === "object") {
          const dc = src.dailyContracts;
          fresh.expeditions.dailyContracts = {
            dateKey: typeof dc.dateKey === "string" ? dc.dateKey : null,
            contracts: Array.isArray(dc.contracts)
              ? dc.contracts
                  .filter((c) => c && typeof c === "object")
                  .slice(0, CONTRACT_ACTIVE_MAX)
                  .map((c) => ({
                    id: String(c.id || ("ctr_" + Math.random().toString(36).slice(2))),
                    templateId: c.templateId || "finish_c",
                    title: String(c.title || "Contrat"),
                    type: c.type || "finish",
                    rarity: c.rarity || "common",
                    target: Math.max(1, Math.floor(safeNumber(c.target, 1))),
                    progress: Math.max(0, Math.floor(safeNumber(c.progress, 0))),
                    zoneId: c.zoneId || null,
                    minDragonRarity: c.minDragonRarity || null,
                    dominationRatio:
                      c.dominationRatio != null ? safeNumber(c.dominationRatio, null) : null,
                    minDurationMs:
                      c.minDurationMs != null ? safeNumber(c.minDurationMs, null) : null,
                    description: String(c.description || ""),
                    reward:
                      c.reward && typeof c.reward === "object"
                        ? c.reward
                        : { kind: "essence", amount: 1000 },
                    status:
                      c.claimed || c.status === "claimed"
                        ? "claimed"
                        : c.status === "ready"
                          ? "ready"
                          : "active",
                    claimed: !!(c.claimed || c.status === "claimed")
                  }))
              : []
          };
          fresh.expeditions.contracts = fresh.expeditions.dailyContracts.contracts;
        } else if (Array.isArray(src.contracts) && src.contracts.length) {
          /* Migration V1 : conserver ready non claim + actifs */
          fresh.expeditions.contracts = src.contracts
            .filter((c) => c && typeof c === "object")
            .slice(0, CONTRACT_ACTIVE_MAX)
            .map((c) => ({
              id: String(c.id || ("ctr_" + Math.random().toString(36).slice(2))),
              templateId: c.templateId || "finish_c",
              title: String(c.title || "Contrat"),
              type: c.type || "finish",
              rarity: c.rarity || "common",
              target: Math.max(1, Math.floor(safeNumber(c.target, 1))),
              progress: Math.max(0, Math.floor(safeNumber(c.progress, 0))),
              zoneId: c.zoneId || null,
              description: String(c.description || ""),
              reward:
                c.reward && typeof c.reward === "object"
                  ? c.reward
                  : { kind: "essence", amount: 5000 },
              status:
                c.claimed || c.status === "claimed"
                  ? "claimed"
                  : c.status === "ready"
                    ? "ready"
                    : "active",
              claimed: !!(c.claimed || c.status === "claimed")
            }));
          fresh.expeditions.dailyContracts = {
            dateKey: null,
            contracts: fresh.expeditions.contracts
          };
        }

        const slots = Array.isArray(src.slots) ? src.slots : [];
        fresh.expeditions.slots = [];
        for (let i = 0; i < fresh.expeditions.unlockedSlots; i++) {
          const run = slots[i];
          if (!run || typeof run !== "object" || run.claimed) {
            fresh.expeditions.slots[i] = null;
            continue;
          }
          const dragonIds = Array.isArray(run.dragonIds)
            ? run.dragonIds.filter((id) => typeof id === "string" && getDragonDef(id))
            : [];
          const runDef =
            EXPEDITION_DEFS.find((e) => e.id === run.expeditionId) ||
            (fresh.expeditions.activeThreat &&
            fresh.expeditions.activeThreat.id === run.expeditionId
              ? buildThreatExpeditionDef(fresh.expeditions.activeThreat)
              : null);
          if (!dragonIds.length || !runDef) {
            fresh.expeditions.slots[i] = null;
            continue;
          }
          fresh.expeditions.slots[i] = {
            id: run.id || ("run_" + i),
            expeditionId: run.expeditionId,
            zoneId: run.zoneId || runDef.zoneId || null,
            dragonIds,
            startTime: safeNumber(run.startTime, Date.now()),
            endTime: safeNumber(run.endTime, Date.now()),
            durationMs: safeNumber(run.durationMs, runDef.durationMs || 0),
            teamPower: safeNumber(run.teamPower, 0),
            recommendedPower: safeNumber(run.recommendedPower, runDef.recommendedPower || 0),
            successChance: Math.min(1, Math.max(0.4, safeNumber(run.successChance, 0.4))),
            seed: safeNumber(run.seed, Date.now()) >>> 0,
            status: run.status === "ready" || run.resolved ? "ready" : "running",
            resolved: !!run.resolved,
            claimed: false,
            notifiedComplete: !!run.notifiedComplete,
            isThreat: !!run.isThreat || !!runDef.isThreat,
            result: run.result && typeof run.result === "object" ? {
              success: !!run.result.success,
              power: Math.max(0, safeNumber(run.result.power, 0)),
              rarePower: Math.max(0, safeNumber(run.result.rarePower, 0)),
              fragments: Array.isArray(run.result.fragments)
                ? run.result.fragments.map((f) => ({
                    dragonId: f.dragonId,
                    amount: Math.max(0, Math.floor(safeNumber(f.amount, 0)))
                  })).filter((f) => getDragonDef(f.dragonId))
                : [],
              chest: sanitizeExpeditionChest(run.result.chest)
            } : null
          };
          /* Clear team conflicts with expedition dragons */
          dragonIds.forEach((id) => {
            const ti = fresh.team.indexOf(id);
            if (ti !== -1) fresh.team[ti] = null;
          });
        }
      }

      /* Camp already purchased */
      if (fresh.specialUpgrades?.[EXPEDITION_CAMP_ID]?.bought) {
        fresh.expeditions.systemUnlocked = true;
      }
      /* Active/past expedition run ⇒ was unlocked under any prior system */
      if (!fresh.expeditions.systemUnlocked) {
        const hasRun = (fresh.expeditions.slots || []).some((s) => s && s.expeditionId);
        if (hasRun) fresh.expeditions.systemUnlocked = true;
      }
      /* Grandfather ONLY old saves that never stored systemUnlocked (ancien seuil 2K). */
      if (
        !fresh.expeditions.systemUnlocked &&
        data.expeditions &&
        data.expeditions.systemUnlocked === undefined
      ) {
        try {
          if (getPlayerDragonPower(fresh) >= LEGACY_EXPEDITION_UNLOCK_POWER) {
            fresh.expeditions.systemUnlocked = true;
          }
        } catch (e) { /* power calc optional during migrate */ }
      }

      gameState = fresh;
      /* Adopter la révision de la save chargée (sync multi-onglets). */
      progressRevision = Math.max(
        safeNumber(data.progressRevision, 0),
        progressRevision
      );
      normalizeAllDragonDiscoveries(gameState);
      calculateProduction();
      updateEggStage();
      uiDirty = shopDirty = upgradesDirty = achievementsDirty = dragonsDirty = eggsDirty = zonesDirty = expeditionsDirty = true;
      ensureExpeditionState(gameState);
    }

    function loadGame() {
      try {
        const raw = localStorage.getItem(SAVE_KEY);
        if (!raw) return false;
        const data = JSON.parse(raw);
        if (!data || typeof data !== "object") return false;
        applyLoadedData(data);
        return true;
      } catch (e) {
        console.warn("Sauvegarde corrompue, nouvelle partie.", e);
        return false;
      }
    }

    function resetGame() {
      if (!confirm("Réinitialiser la partie ? Toute la progression sera perdue.")) return;
      hardResetProgress({ keepAudio: true, skipIntro: true, reload: false });
    }

    /**
     * Remet l’état zones / codes à un vrai nouveau joueur (Z1 only).
     * Appelé uniquement par hardResetProgress — pas au load.
     */
    function applyFreshZoneProgressState(state) {
      const s = state || gameState;
      s.currentZoneId = "sanctuary";
      s.unlockedZones = ["sanctuary"];
      s.visitedZones = ["sanctuary"];
      s.redeemedCodes = [];
      if (!s.meta || typeof s.meta !== "object") s.meta = {};
      s.meta.unlockedZones = ["sanctuary"];
      if (!s.meta.flags || typeof s.meta.flags !== "object") s.meta.flags = {};
      ensureZoneSpent(s);
      ZONE_DEFS.forEach((z) => {
        s.zoneSpent[z.id] = 0;
      });
      /* Œufs : seuls ceux startUnlocked restent ouverts (createEmptyEggProgress). */
      if (s.eggs) {
        EGG_DEFS.forEach((e) => {
          if (!s.eggs[e.id]) return;
          if (!e.startUnlocked) s.eggs[e.id].unlocked = false;
        });
        if (s.eggs.basic) s.eggs.basic.unlocked = true;
      }
      s.equippedEggId = "basic";
      s.zoneEggSelection = {};
    }

    /**
     * Full progress wipe for testing a fresh player.
     * Does NOT run automatically on page load.
     * Invalide les autosaves d’autres onglets via progressRevision.
     */
    function hardResetProgress(opts) {
      opts = opts || {};
      let soundEnabled = true;
      let musicEnabled = true;
      let masterVolume = 1;
      let sfxVolume = 1;
      let musicVolume = 1;
      if (opts.keepAudio !== false) {
        try {
          const raw = localStorage.getItem(SAVE_KEY);
          if (raw) {
            const data = JSON.parse(raw);
            if (data && typeof data === "object") {
              soundEnabled = data.soundEnabled !== false;
              musicEnabled = data.musicEnabled !== false;
              if (data.masterVolume != null) masterVolume = Number(data.masterVolume);
              if (data.sfxVolume != null) sfxVolume = Number(data.sfxVolume);
              if (data.musicVolume != null) musicVolume = Number(data.musicVolume);
            }
          }
        } catch (e) { /* ignore */ }
      }

      /* Nouvelle révision AVANT écriture — tout onglet plus ancien ne peut plus écraser. */
      progressRevision = Date.now();

      try {
        localStorage.removeItem(SAVE_KEY);
      } catch (e) { /* ignore */ }

      /* Verrou immédiat : réduit la fenêtre où un autre onglet réécrit Z3 / LEGACY. */
      try {
        localStorage.setItem(SAVE_KEY, JSON.stringify({
          version: SAVE_VERSION,
          progressRevision: progressRevision,
          currentZoneId: "sanctuary",
          unlockedZones: ["sanctuary"],
          visitedZones: ["sanctuary"],
          redeemedCodes: [],
          zoneSpent: {},
          meta: {
            prestigeLevel: 0,
            dragonSouls: 0,
            unlockedZones: ["sanctuary"],
            collectedDragons: [],
            flags: {}
          },
          soundEnabled: soundEnabled,
          musicEnabled: musicEnabled,
          masterVolume: masterVolume,
          sfxVolume: sfxVolume,
          musicVolume: musicVolume,
          introSeen: opts.skipIntro !== false,
          lastSaveTime: Date.now()
        }));
      } catch (eLock) { /* ignore */ }

      gameState = createDefaultState();
      applyFreshZoneProgressState(gameState);
      gameState.soundEnabled = soundEnabled;
      gameState.musicEnabled = musicEnabled;
      gameState.masterVolume = Math.max(0, Math.min(1, masterVolume));
      gameState.sfxVolume = Math.max(0, Math.min(1, sfxVolume));
      gameState.musicVolume = Math.max(0, Math.min(1, musicVolume));
      gameState.introSeen = opts.skipIntro !== false;
      clickTimestamps = [];
      hatchSequenceActive = false;
      const stageReset = document.getElementById("egg-stage");
      if (stageReset) stageReset.classList.remove("is-hatching");
      clicksLocked = false;
      currentEggImageStage = null;
      currentEggImageEggId = null;
      expeditionUi = { mode: "list", selectedExpeditionId: null, selectedDragons: [] };
      expeditionPreparePickerOpen = false;
      calculateProduction();
      applyEggScene(getEquippedEggDef());
      renderEgg();
      renderEggPicker();
      renderTeamModule();
      renderAllStatic();
      updateAudioToggles();
      uiDirty = shopDirty = upgradesDirty = achievementsDirty = dragonsDirty = eggsDirty = zonesDirty = expeditionsDirty = true;
      saveGame(true);
      if (opts.reload) {
        location.reload();
        return true;
      }
      return true;
    }

    function resetDragonClickerProgress() {
      if (!confirm("Reset COMPLET de Dragon Clicker ?\n\nToute la progression sera effacée (comme une nouvelle partie).\nLes options audio seront conservées.")) {
        return false;
      }
      return hardResetProgress({ keepAudio: true, skipIntro: false, reload: true });
    }

    function exportSave() {
      const data = serializeState();
      const str = btoa(unescape(encodeURIComponent(JSON.stringify(data))));
      const area = document.getElementById("import-area");
      area.value = str;
      area.select();
      try {
        navigator.clipboard.writeText(str);
        showNotification("📤 Export", "Sauvegarde copiée dans le presse-papiers.");
      } catch (e) {
        showNotification("📤 Export", "Chaîne affichée — copiez-la manuellement.");
      }
    }

    function importSave() {
      const area = document.getElementById("import-area");
      const str = (area.value || "").trim();
      if (!str) {
        showNotification("📥 Import", "Collez d'abord une sauvegarde.");
        return;
      }
      try {
        const json = decodeURIComponent(escape(atob(str)));
        const data = JSON.parse(json);
        if (!data || typeof data !== "object") throw new Error("invalid");
        applyLoadedData(data);
        gameState.introSeen = true;
        document.getElementById("intro-modal").classList.add("hidden");
        applyEggScene(getEquippedEggDef());
        renderEgg();
        renderEggPicker();
        renderDragons();
        renderAllStatic();
        updateAudioToggles();
        saveGame(true);
        showNotification("📥 Import réussi", "Partie restaurée.");
      } catch (e) {
        showNotification("📥 Erreur", "Sauvegarde invalide ou corrompue.");
      }
    }

    /* -------------------------------------------------------
       OFFLINE PROGRESS
       Formule unique :
         productiveMs = min(absenceRéelle, duréeMax)
         gain = productionPassive/sec × (productiveMs/1000) × efficacité
       L'efficacité vient UNIQUEMENT de dragonWatch (valeurs totales).
       zoneSpent n'est PAS modifié ici — seule spendEssence({zoneId}) l'alimente.
       ------------------------------------------------------- */
    function calculateOfflineProgress() {
      const last = safeNumber(gameState.lastSaveTime, 0);
      if (!last) return null;

      const now = Date.now();
      let realAway = now - last;
      if (!Number.isFinite(realAway) || realAway < 0) realAway = 0;
      if (realAway < 5000) return null; /* ignore tiny gaps / refresh bounce */

      const cap = Math.min(MAX_OFFLINE_MS, getOfflineCapMs(gameState));
      const productiveMs = Math.min(realAway, cap);
      if (!(productiveMs > 0)) return null;

      const pps = calculateProduction();
      if (!Number.isFinite(pps) || pps <= 0) return null;

      const efficiency = getOfflineYieldRate(gameState);
      if (!Number.isFinite(efficiency) || efficiency <= 0) return null;

      const gained = pps * (productiveMs / 1000) * efficiency;
      if (!Number.isFinite(gained) || gained < 1) return null;

      return {
        awayMs: realAway,
        productiveMs: productiveMs,
        capMs: cap,
        efficiency: efficiency,
        pps: pps,
        gained: gained
      };
    }

    function applyOfflineProgress(info) {
      if (!info) return;
      addPower(info.gained, "offline");
      /* Stamp immediately so refresh / beforeunload cannot duplicate offline gains */
      gameState.lastSaveTime = Date.now();
      saveGame(true);
      checkAchievements();
      shopDirty = true;
      upgradesDirty = true;
      uiDirty = true;
    }

    function showOfflineModal(info) {
      const title = document.getElementById("offline-title");
      if (title) title.textContent = "Retour au royaume";

      const awayEl = document.getElementById("offline-time");
      if (awayEl) awayEl.textContent = formatDuration(info.awayMs);

      const prodEl = document.getElementById("offline-productive");
      if (prodEl) {
        const capLabel = formatDuration(info.capMs || getOfflineCapMs(gameState));
        prodEl.textContent =
          formatDuration(info.productiveMs != null ? info.productiveMs : info.awayMs) +
          " / " + capLabel + " max";
      }

      const effEl = document.getElementById("offline-efficiency");
      if (effEl) {
        effEl.textContent = formatOfflineYieldPct(
          info.efficiency != null ? info.efficiency : getOfflineYieldRate(gameState)
        );
      }

      const gainEl = document.getElementById("offline-gain");
      if (gainEl) {
        gainEl.textContent = "+" + formatNumber(info.gained) + " ✨ Essence";
      }

      document.getElementById("offline-modal").classList.remove("hidden");
    }

    /* -------------------------------------------------------
       UI RENDER
       ------------------------------------------------------- */
    function getHudEls() {
      if (
        cachedHudEls &&
        cachedHudEls.essence &&
        cachedHudEls.essence.isConnected
      ) {
        return cachedHudEls;
      }
      cachedHudEls = {
        essence: document.getElementById("ui-essence"),
        prod: document.getElementById("ui-prod"),
        click: document.getElementById("ui-click"),
        power: document.getElementById("ui-dragon-power"),
        cps: document.getElementById("ui-cps"),
        peak: document.getElementById("ui-cps-record")
      };
      return cachedHudEls;
    }

    function renderHeader() {
      const els = getHudEls();
      const essenceStr = formatNumber(gameState.dragonEssence);
      if (els.essence && lastHudSnapshot.essence !== essenceStr) {
        els.essence.textContent = essenceStr;
        lastHudSnapshot.essence = essenceStr;
      }
      /* Global stats (recalculateGlobalStats / calculateProduction keep these in sync). */
      const prodStr = formatNumber(gameState.powerPerSecond);
      if (els.prod && lastHudSnapshot.prod !== prodStr) {
        els.prod.textContent = prodStr;
        lastHudSnapshot.prod = prodStr;
      }
      const clickStr = formatNumber(gameState.powerPerClick);
      if (els.click && lastHudSnapshot.click !== clickStr) {
        els.click.textContent = clickStr;
        lastHudSnapshot.click = clickStr;
      }
      const powerNow = getPlayerDragonPower();
      const powerStr = formatNumber(powerNow);
      if (els.power && lastHudSnapshot.power !== powerStr) {
        els.power.textContent = powerStr;
        lastHudSnapshot.power = powerStr;
      }
      if (lastHudDragonPower != null && powerNow !== lastHudDragonPower) {
        if (window.DCAnim && DCAnim.pulseHudPower) DCAnim.pulseHudPower();
        else if (els.power) {
          triggerAnim(els.power.closest(".hud-resource-card, .stat-pill") || els.power, "anim-pulse", 180);
        }
      }
      lastHudDragonPower = powerNow;
      updateExpeditionButtonIndicator();
      updateChargedAuraVisual();
      const cpsStr = String(gameState.currentCps || 0);
      if (els.cps && lastHudSnapshot.cps !== cpsStr) {
        els.cps.textContent = cpsStr;
        lastHudSnapshot.cps = cpsStr;
      }
      const peakStr = String(gameState.peakCps || 0);
      if (els.peak && lastHudSnapshot.peak !== peakStr) {
        els.peak.textContent = peakStr;
        lastHudSnapshot.peak = peakStr;
      }
      /* Decay combo display if idle */
      const last = safeNumber(gameState._lastComboClickAt, 0);
      if (last && performance.now() - last > getComboWindowMs()) {
        if (gameState.comboCount) {
          gameState.comboCount = 0;
          gameState.comboBonus = 0;
        }
      }
      renderComboHud();
    }

    /**
     * Affichage compact ACTUEL / PROCHAIN / MAX (valeurs déjà formatées).
     * Calculé au render carte seulement — pas de tick.
     */
    function buildShopProgressEffectHtml(opts) {
      opts = opts || {};
      const cur = (opts.currentText || "").trim();
      const next = (opts.nextText || "").trim();
      const extra = (opts.extraText || "").trim();
      const atMax = !!opts.atMax;
      const level = Math.max(0, Math.floor(safeNumber(opts.level, 0)));
      const root = document.createElement("div");
      root.className = "item-effect-progress";

      function addRow(kind, lab, val) {
        const row = document.createElement("div");
        row.className = "iep-row iep-" + kind;
        if (lab) {
          const labEl = document.createElement("span");
          labEl.className = "iep-lab";
          labEl.textContent = lab;
          row.appendChild(labEl);
        }
        if (val) {
          const valEl = document.createElement("span");
          valEl.className = "iep-val";
          valEl.textContent = val;
          row.appendChild(valEl);
        }
        root.appendChild(row);
      }

      if (atMax) {
        if (cur) addRow("current", "ACTUEL", cur);
        addRow("max", "MAX", "");
      } else if (level <= 0) {
        if (next) addRow("next", "PROCHAIN", next);
        else if (cur) addRow("current", "", cur);
      } else {
        if (cur) addRow("current", "ACTUEL", cur);
        if (next) addRow("next", "PROCHAIN", next);
      }
      if (extra) addRow("extra", "", extra);
      return root.childNodes.length ? root.outerHTML : "";
    }

    function formatProducerEssenceEffect(amount) {
      return "+" + formatNumber(amount) + " Essence/sec";
    }

    function createShopItemRow(opts) {
      const row = document.createElement("div");
      row.className = "item-row card" + (opts.atMax ? " owned" : opts.canBuy ? "" : " disabled");
      if (opts.datasetKey && opts.datasetValue != null) {
        row.dataset[opts.datasetKey] = opts.datasetValue;
      }
      if (opts.title) row.title = opts.title;

      const showLevel = opts.showLevel !== false && opts.level != null && opts.maxLevel != null;
      const tipParts = [];
      if (opts.totalText) tipParts.push(opts.totalText);
      if (opts.descText) tipParts.push(opts.descText);
      if (tipParts.length && !row.title) row.title = tipParts.join(" · ");
      else if (tipParts.length && row.title) row.title = row.title + " — " + tipParts.join(" · ");

      /* Zone droite : titre → niveau → bonus → bouton */
      row.innerHTML =
        '<div class="item-icon"><img class="item-icon-img" alt="" hidden decoding="async" loading="lazy" draggable="false" /><span class="item-icon-glyph"></span></div>' +
        '<div class="item-main">' +
          '<div class="item-name"></div>' +
          (showLevel ? '<div class="item-level"></div>' : "") +
          ((opts.effectHtml != null || opts.effectText != null)
            ? '<div class="item-effect"></div>'
            : "") +
          '<div class="item-card-foot"></div>' +
        "</div>";

      const iconGlyph = row.querySelector(".item-icon-glyph");
      const iconImg = row.querySelector(".item-icon-img");
      iconGlyph.textContent = opts.icon || "";
      if (opts.image && iconImg) {
        loadAssetImage(iconImg, iconGlyph, opts.image, { silhouette: false });
      } else if (iconImg) {
        iconImg.hidden = true;
        iconImg.removeAttribute("src");
      }
      row.querySelector(".item-name").textContent = opts.name || "";
      const levelEl = row.querySelector(".item-level");
      if (levelEl) levelEl.textContent = "NIV. " + opts.level + " / " + opts.maxLevel;
      const effectEl = row.querySelector(".item-effect");
      if (effectEl) {
        if (opts.effectHtml != null) effectEl.innerHTML = opts.effectHtml;
        else effectEl.textContent = opts.effectText || "";
      }

      fillShopItemFooter(row.querySelector(".item-card-foot"), opts);
      return row;
    }

    function fillShopItemFooter(foot, opts) {
      foot.innerHTML = "";
      foot.classList.toggle("is-max", !!opts.atMax);
      if (opts.atMax) {
        const maxEl = document.createElement("div");
        maxEl.className = "item-progress-max";
        maxEl.textContent = opts.maxLabel || "MAX";
        foot.appendChild(maxEl);
        return;
      }
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn gold-action-btn buy-btn item-buy-compact" + (opts.upgradeBtn ? " buy-upgrade-btn" : "");
      btn.setAttribute("data-action-label", opts.actionLabel || "Acheter");
      btn.setAttribute("aria-label", (opts.actionLabel || "Acheter") + " — " + formatNumber(opts.cost) + " Essence");
      /* Bouton = logo Essence + prix, groupe centré */
      btn.innerHTML =
        '<img class="item-buy-essence" src="assets/contenant/essence%20logo.png" alt="" draggable="false" decoding="async" />' +
        '<span class="item-progress-cost item-cost"></span>';
      btn.querySelector(".item-progress-cost").textContent = formatNumber(opts.cost);
      btn.disabled = !opts.canBuy;
      btn.addEventListener("click", opts.onClick);
      foot.appendChild(btn);
    }

    function createShopSectionGrid(list, titleText, gridClass) {
      const title = document.createElement("h3");
      title.className = "shop-section-title";
      title.textContent = titleText;
      list.appendChild(title);
      const grid = document.createElement("div");
      grid.className = gridClass || "shop-grid";
      list.appendChild(grid);
      return grid;
    }

    function renderShop() {
      const list = document.getElementById("shop-list");
      if (!list) {
        shopDirty = false;
        return;
      }
      list.innerHTML = "";
      list.classList.remove("upgrade-grid");
      updateZoneScopedPanelHeaders();

      const zone = getCurrentZone();
      const producers = getVisibleProducers();

      if (!producers.length) {
        const empty = document.createElement("p");
        empty.className = "panel-hint";
        empty.textContent = zone.comingSoon
          ? "Les bâtiments de cette zone arriveront bientôt."
          : "Aucun producteur disponible dans cette zone.";
        list.appendChild(empty);
      } else {
        const grid = createShopSectionGrid(list, "Production", "shop-grid");
        producers.forEach((def) => {
          const owned = safeNumber(gameState.producers[def.id]?.owned, 0);
          const maxLvl = getProducerMaxLevel(def);
          const atMax = owned >= maxLvl;
          const cost = getProducerCost(def, owned);
          const canBuy = !atMax && gameState.dragonEssence >= cost;
          const mult = (gameState.multipliers.producers[def.id] || 1)
            * gameState.multipliers.globalProduction
            * gameState.multipliers.autoProduction;
          /* Totaux issus de calculateProducerProduction (linear / progressive). */
          const totalNow = calculateProducerProduction(def, owned) * mult;
          const totalNext = atMax
            ? totalNow
            : calculateProducerProduction(def, owned + 1) * mult;
          const effectHtml = buildShopProgressEffectHtml({
            level: owned,
            atMax: atMax,
            currentText: owned > 0 ? formatProducerEssenceEffect(totalNow) : "",
            nextText: atMax ? "" : formatProducerEssenceEffect(totalNext)
          });

          grid.appendChild(createShopItemRow({
            datasetKey: "producerId",
            datasetValue: def.id,
            title: def.description,
            icon: def.icon,
            image: def.image || null,
            name: def.name,
            effectHtml: effectHtml,
            totalText: owned > 0 ? "Total : +" + formatNumber(totalNow) + "/s" : "",
            atMax: atMax,
            canBuy: canBuy,
            level: owned,
            maxLevel: maxLvl,
            cost: cost,
            actionLabel: "Acheter",
            onClick: () => buyProducer(def.id)
          }));
        });
      }

      const passives = getVisibleShopPassives();
      if (passives.length) {
        const grid = createShopSectionGrid(list, "Bonus passifs", "shop-grid");
        passives.forEach((def) => {
          const bought = !!(gameState.shopPassives[def.id]?.bought);
          const canBuy = !bought && gameState.dragonEssence >= def.cost;
          grid.appendChild(createShopItemRow({
            datasetKey: "passiveId",
            datasetValue: def.id,
            icon: def.icon,
            image: def.image || null,
            name: def.name,
            effectText: def.description,
            atMax: bought,
            maxLabel: "ACQUIS",
            canBuy: canBuy,
            showLevel: false,
            cost: def.cost,
            actionLabel: "Acheter",
            onClick: () => buyShopPassive(def.id)
          }));
        });
      }

      shopDirty = false;
    }

    function refreshShopAffordability() {
      const list = document.getElementById("shop-list");
      if (!list.children.length) {
        renderShop();
        return;
      }
      getVisibleProducers().forEach((def) => {
        const card = list.querySelector('[data-producer-id="' + def.id + '"]');
        if (!card) return;
        const owned = safeNumber(gameState.producers[def.id]?.owned, 0);
        const maxLvl = getProducerMaxLevel(def);
        if (owned >= maxLvl) return;
        const cost = getProducerCost(def, owned);
        const canBuy = gameState.dragonEssence >= cost;
        card.classList.toggle("disabled", !canBuy);
        const costEl = card.querySelector(".item-progress-cost");
        if (costEl) costEl.textContent = formatNumber(cost);
        const btn = card.querySelector(".buy-btn");
        if (btn) {
          btn.disabled = !canBuy;
          btn.setAttribute("aria-label", "Acheter — " + formatNumber(cost) + " Essence");
        }
      });
      getVisibleShopPassives().forEach((def) => {
        const card = list.querySelector('[data-passive-id="' + def.id + '"]');
        if (!card || gameState.shopPassives[def.id]?.bought) return;
        const canBuy = gameState.dragonEssence >= def.cost;
        card.classList.toggle("disabled", !canBuy);
        const costEl = card.querySelector(".item-progress-cost");
        if (costEl) costEl.textContent = formatNumber(def.cost);
        const btn = card.querySelector(".buy-btn");
        if (btn) {
          btn.disabled = !canBuy;
          btn.setAttribute("aria-label", "Acheter — " + formatNumber(def.cost) + " Essence");
        }
      });
    }

    function formatGoldActionPrice(cost) {
      return formatNumber(cost);
    }

    function renderUpgrades() {
      const list = document.getElementById("upgrades-list");
      if (!list) {
        upgradesDirty = false;
        return;
      }
      list.innerHTML = "";
      list.classList.remove("upgrade-grid", "active-upgrade-list");
      list.classList.add("upgrades-card-list");
      updateZoneScopedPanelHeaders();

      const zone = getCurrentZone();
      const defs = getVisibleActiveUpgrades();
      const passives = typeof getVisibleLevelPassives === "function" ? getVisibleLevelPassives() : [];
      const specials = typeof getVisibleSpecialUpgrades === "function" ? getVisibleSpecialUpgrades() : [];

      if (!defs.length && !passives.length && !specials.length) {
        const empty = document.createElement("p");
        empty.className = "panel-hint";
        empty.textContent = zone.comingSoon
          ? "Les améliorations de cette zone arriveront bientôt."
          : "Aucune amélioration disponible dans cette zone.";
        list.appendChild(empty);
        upgradesDirty = false;
        return;
      }

      if (defs.length) {
        const grid = createShopSectionGrid(list, "Améliorations actives", "upgrades-grid");
        const ordered = defs.slice().sort((a, b) => {
          const oa = safeNumber(a.uiOrder, 99);
          const ob = safeNumber(b.uiOrder, 99);
          if (oa !== ob) return oa - ob;
          return String(a.id).localeCompare(String(b.id));
        });

        ordered.forEach((def) => {
          const level = getActiveUpgradeLevel(def.id);
          const maxLvl = Math.max(1, Math.floor(safeNumber(def.maxLevel, MAX_ACTIVE_LEVEL)));
          const atMax = level >= maxLvl;
          const cost = getActiveUpgradeCost(def, level);
          const canBuy = !atMax && gameState.dragonEssence >= cost;
          let familyLabel = (FAMILY_META[def.family] || {}).label || "";
          if (def.bonusType === "clickPowerFlat") familyLabel = "Puissance de clic";
          else if (def.bonusType === "chargedStrike") familyLabel = "Frappe Chargée";
          else if (def.bonusType === "twinHatchChance") familyLabel = "Éclosion spéciale";
          else if (def.bonusType === "globalProdPct") familyLabel = "Production passive";
          /* Totaux cumulés via describeActiveBonusLine / tables bonusValues. */
          const curBonus = level > 0 ? describeActiveBonusLine(def, level) : "";
          const nextBonus = atMax ? "" : describeActiveBonusLine(def, level + 1);
          let chargedStatus = "";
          if (def.bonusType === "chargedStrike" && level > 0) {
            const every = getChargedStrikeTriggerClicks();
            const cur = Math.max(0, Math.floor(safeNumber(gameState.chargedStrikeClicks, 0)));
            if (every > 0) {
              const ready = cur >= every - 1;
              chargedStatus = ready ? "FRAPPE CHARGÉE PRÊTE" : (cur + " / " + every + " CLICS");
            }
          }
          const effectHtml = buildShopProgressEffectHtml({
            level: level,
            atMax: atMax,
            currentText: curBonus,
            nextText: nextBonus || (!atMax && level <= 0 ? (def.description || "") : ""),
            extraText: chargedStatus
          });

          grid.appendChild(createShopItemRow({
            datasetKey: "activeId",
            datasetValue: def.id,
            title: familyLabel || def.description || "",
            icon: def.icon,
            image: def.image || null,
            name: def.name,
            effectHtml: effectHtml || undefined,
            effectText: effectHtml ? undefined : (curBonus || nextBonus || def.description || "—"),
            descText: chargedStatus,
            atMax: atMax,
            canBuy: canBuy,
            level: level,
            maxLevel: maxLvl,
            cost: cost,
            actionLabel: "Améliorer",
            upgradeBtn: true,
            onClick: () => buyActiveUpgradeLevel(def.id)
          }));
        });
      }

      if (passives.length) {
        const grid = createShopSectionGrid(list, "Améliorations passives", "upgrades-grid");
        passives.forEach((def) => {
          const level = getLevelPassiveLevel(def.id);
          const maxLvl = def.maxLevel;
          const atMax = level >= maxLvl;
          const cost = getLevelPassiveCost(def, level);
          const canBuy = !atMax && gameState.dragonEssence >= cost;
          let curText = "";
          let nextText = "";
          if (def.id === "ancestralReserve") {
            if (level > 0) curText = getOfflineCapHoursForLevel(level) + " h maximum";
            if (!atMax) nextText = getOfflineCapHoursForLevel(level + 1) + " h maximum";
          } else if (def.id === "dragonWatch") {
            if (level > 0) {
              curText = formatOfflineYieldPct(getOfflineYieldRateForLevel(level)) +
                " de la production";
            }
            if (!atMax) {
              nextText = formatOfflineYieldPct(getOfflineYieldRateForLevel(level + 1)) +
                " de la production";
            }
          } else {
            curText = level > 0 ? describeLevelPassiveBonus(def, level) : "";
            nextText = atMax ? "" : (describeLevelPassiveNext(def, level) || def.description || "");
          }
          const effectHtml = buildShopProgressEffectHtml({
            level: level,
            atMax: atMax,
            currentText: curText,
            nextText: nextText
          });
          grid.appendChild(createShopItemRow({
            datasetKey: "levelPassiveId",
            datasetValue: def.id,
            icon: def.icon,
            image: def.image || null,
            name: def.name,
            effectHtml: effectHtml || undefined,
            effectText: effectHtml ? undefined : (curText || nextText || def.description || ""),
            atMax: atMax,
            canBuy: canBuy,
            level: level,
            maxLevel: maxLvl,
            cost: cost,
            actionLabel: "Améliorer",
            upgradeBtn: true,
            onClick: () => buyLevelPassive(def.id)
          }));
        });
      }

      if (specials.length) {
        const grid = createShopSectionGrid(list, "Améliorations spéciales", "upgrades-grid");
        specials.forEach((def) => {
          const bought = !!(gameState.specialUpgrades?.[def.id]?.bought);
          const canBuy = !bought && gameState.dragonEssence >= def.cost;
          grid.appendChild(createShopItemRow({
            datasetKey: "specialId",
            datasetValue: def.id,
            icon: def.icon,
            image: def.image || null,
            name: def.name,
            effectText: def.description,
            atMax: bought,
            maxLabel: "ACQUIS",
            canBuy: canBuy,
            showLevel: false,
            cost: def.cost,
            actionLabel: "Acheter",
            upgradeBtn: true,
            onClick: () => buySpecialUpgrade(def.id)
          }));
        });
      }

      if (zone.id === "sanctuary") {
        const comp = getZone1Completion();
        const tip = document.createElement("p");
        tip.className = "panel-hint";
        tip.textContent = "Complétion Zone 1 : " + comp.percent + " % (optionnelle — n'empêche pas la Zone 2).";
        list.appendChild(tip);
      }

      upgradesDirty = false;
    }

    function refreshUpgradeAffordability() {
      const list = document.getElementById("upgrades-list");
      if (!list.querySelector("[data-active-id], [data-level-passive-id], [data-special-id]")) {
        renderUpgrades();
        return;
      }
      getVisibleActiveUpgrades().forEach((def) => {
        const card = list.querySelector('[data-active-id="' + def.id + '"]');
        if (!card) return;
        const level = getActiveUpgradeLevel(def.id);
        const maxLvl = Math.max(1, Math.floor(safeNumber(def.maxLevel, MAX_ACTIVE_LEVEL)));
        if (level >= maxLvl) return;
        const cost = getActiveUpgradeCost(def, level);
        const canBuy = gameState.dragonEssence >= cost;
        card.classList.toggle("disabled", !canBuy);
        const costEl = card.querySelector(".item-progress-cost");
        if (costEl) costEl.textContent = formatGoldActionPrice(cost);
        const btn = card.querySelector(".buy-upgrade-btn");
        if (btn) btn.disabled = !canBuy;
      });
      getVisibleLevelPassives().forEach((def) => {
        const card = list.querySelector('[data-level-passive-id="' + def.id + '"]');
        if (!card) return;
        const level = getLevelPassiveLevel(def.id);
        if (level >= def.maxLevel) return;
        const cost = getLevelPassiveCost(def, level);
        const canBuy = gameState.dragonEssence >= cost;
        card.classList.toggle("disabled", !canBuy);
        const costEl = card.querySelector(".item-progress-cost");
        if (costEl) costEl.textContent = formatGoldActionPrice(cost);
        const btn = card.querySelector(".buy-upgrade-btn");
        if (btn) btn.disabled = !canBuy;
      });
      getVisibleSpecialUpgrades().forEach((def) => {
        const card = list.querySelector('[data-special-id="' + def.id + '"]');
        if (!card || gameState.specialUpgrades?.[def.id]?.bought) return;
        const canBuy = gameState.dragonEssence >= def.cost;
        card.classList.toggle("disabled", !canBuy);
        const costEl = card.querySelector(".item-progress-cost");
        if (costEl) costEl.textContent = formatGoldActionPrice(def.cost);
        const btn = card.querySelector(".buy-upgrade-btn");
        if (btn) btn.disabled = !canBuy;
      });
    }

    function renderAchievements() {
      bindAchievementsUi();
      const list = document.getElementById("achievements-list");
      if (!list) return;
      list.innerHTML = "";
      list.className = "card-list achievements-shell";

      const unlockedCount = ACHIEVEMENT_DEFS.filter((d) => {
        const e = ensureAchievementEntry(d.id);
        return e.unlocked || isAchievementComplete(d, gameState);
      }).length;
      const claimable = countClaimableAchievements();
      let claimableEssence = 0;
      ACHIEVEMENT_DEFS.forEach((d) => {
        if (getAchievementState(d) === "claimable") claimableEssence += safeNumber(d.rewardEssence, 0);
      });

      const head = document.createElement("div");
      head.className = "achievements-head";
      head.innerHTML =
        '<div class="list-summary ach-summary">' +
          '<div class="list-summary-row"><span>Succès</span><strong></strong></div>' +
          '<div class="list-summary-bar"><div class="list-summary-fill"></div></div>' +
        "</div>" +
        '<button type="button" class="ach-claim-all" id="btn-claim-all-achievements" hidden></button>' +
        '<div class="achievements-filters" id="achievements-filters" role="toolbar" aria-label="Filtres succès"></div>';
      head.querySelector("strong").textContent = unlockedCount + " / " + ACHIEVEMENT_DEFS.length;
      head.querySelector(".list-summary-fill").style.width =
        (ACHIEVEMENT_DEFS.length ? (unlockedCount / ACHIEVEMENT_DEFS.length) * 100 : 0) + "%";
      const claimAllBtn = head.querySelector("#btn-claim-all-achievements");
      if (claimable >= 2) {
        claimAllBtn.hidden = false;
        claimAllBtn.textContent = "Tout récupérer · +" + formatNumber(claimableEssence) + " Essence";
      }
      const filters = head.querySelector("#achievements-filters");
      ACHIEVEMENT_CATEGORIES.forEach((cat) => {
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "ach-filter-chip" + (achievementsFilter === cat.id ? " active" : "");
        chip.setAttribute("data-ach-filter", cat.id);
        chip.textContent = cat.label;
        filters.appendChild(chip);
      });
      list.appendChild(head);

      const split = document.createElement("div");
      split.className = "achievements-split";
      split.innerHTML =
        '<div class="achievements-grid" id="achievements-grid" role="list" aria-label="Liste des succès"></div>' +
        '<div class="achievements-divider" aria-hidden="true"><span class="achievements-divider-gem"></span></div>' +
        '<aside class="achievements-detail" id="achievements-detail">' +
          '<h3 class="ach-detail-heading">Description</h3>' +
          '<div class="ach-detail-body"></div>' +
          '<div class="ach-detail-foot">' +
            '<div class="ach-detail-progress">' +
              '<div class="ach-detail-bar"><div class="ach-detail-bar-fill"></div></div>' +
              '<div class="ach-detail-progress-text">0 / 0</div>' +
            "</div>" +
            '<button type="button" class="ach-claim-btn is-disabled" id="btn-ach-claim" disabled>RÉCLAMER</button>' +
          "</div>" +
        "</aside>";
      list.appendChild(split);

      const grid = split.querySelector("#achievements-grid");
      const defs = getFilteredAchievementDefs();
      if (selectedAchievementId && !defs.some((d) => d.id === selectedAchievementId)) {
        selectedAchievementId = null;
      }

      defs.forEach((def) => {
        const state = getAchievementState(def);
        const tile = document.createElement("button");
        tile.type = "button";
        tile.className =
          "ach-tile state-" + state + (selectedAchievementId === def.id ? " is-selected" : "");
        tile.setAttribute("data-ach-select", def.id);
        tile.setAttribute("role", "listitem");
        tile.setAttribute("aria-label", def.name);
        tile.title = def.name;
        tile.innerHTML =
          '<span class="ach-tile-icon" aria-hidden="true"></span>' +
          '<span class="ach-tile-mark" aria-hidden="true"></span>';
        tile.querySelector(".ach-tile-icon").textContent = def.icon || "🏆";
        const mark = tile.querySelector(".ach-tile-mark");
        if (state === "claimed") mark.textContent = "✓";
        else if (state === "claimable") mark.classList.add("is-dot");
        grid.appendChild(tile);
      });

      renderAchievementDetail();
      achievementsDirty = false;
      updateAchievementsNavBadge();
    }

    function renderStats() {
      const rs = gameState.rarityStats || createEmptyRarityStats();
      const basicHatches = (gameState.eggs.basic && gameState.eggs.basic.timesHatched) || 0;
      const rows = [
        ["Zone actuelle", (getZoneDef(gameState.currentZoneId) || {}).name || "—"],
        ["Zones débloquées", (gameState.unlockedZones || []).length + " / " + ZONE_DEFS.length],
        ["Temps de jeu", formatDuration(gameState.playTimeMs)],
        ["Essence actuelle", formatNumber(gameState.dragonEssence) + " ✨"],
        ["Puissance Draconique", formatNumber(getPlayerDragonPower()) + " 🐉"],
        ["Essence totale gagnée", formatNumber(gameState.totalEssenceEarned) + " ✨"],
        ["Clics totaux", formatNumber(gameState.totalClicks)],
        ["Clics manuels (lifetime)", formatNumber(gameState.lifetimeManualClicks)],
        ["CPS actuel", String(gameState.currentCps || 0)],
        ["Record CPS", String(gameState.peakCps || 0)],
        ["Clics critiques", formatNumber(gameState.totalCriticalClicks)],
        ["Essence via clics", formatNumber(gameState.essenceFromClicks) + " ✨"],
        ["Essence automatique", formatNumber(gameState.essenceFromAuto) + " ✨"],
        ["Producteurs totaux", formatNumber(getTotalProducers(gameState))],
        ["Améliorations achetées", formatNumber(getUpgradesBought(gameState))],
        ["🥚 Œufs éclos", formatNumber(gameState.totalEggsHatched || 0)],
        ["🥚 Œufs Draconiques éclos", formatNumber(basicHatches)],
        ["🐉 Dragons obtenus", formatNumber(gameState.totalDragonsObtained || 0)],
        ["🐉 Dragons uniques", countOwnedDragons(gameState) + " / " + getCatalogDragonCount()],
        ["⚪ Communs obtenus", formatNumber(rs.common || 0)],
        ["🔹 Rares obtenus", formatNumber(rs.rare || 0)],
        ["✨ Légendaires obtenus", formatNumber(rs.legendary || 0)],
        ["🌌 Mythiques obtenus", formatNumber(rs.mythic || 0)],
        ["Dragon le plus rare découvert", getRarestOwnedLabel()],
        ["Essence / sec", formatNumber(gameState.powerPerSecond) + " ✨"]
      ];

      const keyTiles = [
        ["⏱️", "Temps de jeu", formatDuration(gameState.playTimeMs)],
        ["✨", "Essence totale", formatNumber(gameState.totalEssenceEarned)],
        ["🐉", "Puissance Draconique", formatNumber(getPlayerDragonPower())],
        ["👆", "Clics", formatNumber(gameState.totalClicks)],
        ["🥚", "Œufs éclos", formatNumber(gameState.totalEggsHatched || 0)],
        ["🐉", "Dragons uniques", countOwnedDragons(gameState) + " / " + getCatalogDragonCount()],
        ["⚡", "Record CPS", String(gameState.peakCps || 0)]
      ];

      const grid = document.getElementById("stats-grid");
      const existingTiles = grid.querySelectorAll(".stat-tile");
      const existingRows = grid.querySelectorAll(".stats-more-list .stat-row");
      if (existingTiles.length === keyTiles.length && existingRows.length === rows.length) {
        keyTiles.forEach(([, , value], i) => {
          const v = existingTiles[i].querySelector(".t-value");
          if (v.textContent !== value) v.textContent = value;
        });
        rows.forEach(([, value], i) => {
          const v = existingRows[i].querySelector(".s-value");
          if (v.textContent !== String(value)) v.textContent = value;
        });
        return;
      }
      const details = grid.querySelector("details.stats-more");
      const wasOpen = !!(details && details.open);
      grid.innerHTML = "";

      const tiles = document.createElement("div");
      tiles.className = "stat-tiles";
      keyTiles.forEach(([ico, label, value]) => {
        const t = document.createElement("div");
        t.className = "stat-tile";
        t.innerHTML = '<span class="t-ico"></span><span class="t-value"></span><span class="t-label"></span>';
        t.querySelector(".t-ico").textContent = ico;
        t.querySelector(".t-value").textContent = value;
        t.querySelector(".t-label").textContent = label;
        tiles.appendChild(t);
      });
      grid.appendChild(tiles);

      const more = document.createElement("details");
      more.className = "stats-more";
      more.open = wasOpen;
      more.innerHTML = "<summary>Toutes les statistiques</summary>";
      const moreList = document.createElement("div");
      moreList.className = "stats-more-list";
      rows.forEach(([label, value]) => {
        const row = document.createElement("div");
        row.className = "stat-row";
        row.innerHTML = '<span class="s-label"></span><span class="s-value"></span>';
        row.querySelector(".s-label").textContent = label;
        row.querySelector(".s-value").textContent = value;
        moreList.appendChild(row);
      });
      more.appendChild(moreList);
      grid.appendChild(more);
    }

    function updateAudioToggles() {
      const sfx = document.getElementById("toggle-sfx");
      const music = document.getElementById("toggle-music");
      if (sfx) {
        sfx.classList.toggle("on", gameState.soundEnabled);
        sfx.setAttribute("aria-pressed", String(gameState.soundEnabled));
      }
      if (music) {
        music.classList.toggle("on", gameState.musicEnabled);
        music.setAttribute("aria-pressed", String(gameState.musicEnabled));
      }
      const setVol = (id, valId, value) => {
        const input = document.getElementById(id);
        const label = document.getElementById(valId);
        const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
        if (input) input.value = String(pct);
        if (label) label.textContent = String(pct);
      };
      setVol("vol-master", "vol-master-val", safeNumber(gameState.masterVolume, 1));
      setVol("vol-sfx", "vol-sfx-val", safeNumber(gameState.sfxVolume, 1));
      setVol("vol-music", "vol-music-val", safeNumber(gameState.musicVolume, 1));
    }

    function getActiveOverlayPanelId() {
      /* Overlay menus only — Royaume n’est plus un overlay. */
      const overlay = document.querySelector(".panel.overlay-panel.active");
      if (overlay && overlay.dataset.panel) return overlay.dataset.panel;
      if (document.getElementById("panel-realm")?.classList.contains("active")) return "realm";
      return "kingdom";
    }

    /** Vue principale active : egg | realm (onglets bas) */
    function getActiveMainView() {
      if (document.getElementById("panel-realm")?.classList.contains("active")) return "realm";
      return "egg";
    }

    function renderUI(now) {
      const t = now || performance.now();
      /* HUD ~10/s — assez pour Essence / CPS, sans DOM writes à 60 FPS. */
      if (t - lastHudRefreshAt >= HUD_REFRESH_MS) {
        renderHeader();
        lastHudRefreshAt = t;
      }
      if (t - lastEggProgressUiAt >= EGG_PROGRESS_UI_MS) {
        renderEggProgressUI();
        if (isEggBossFightActive()) renderEggBossFightUI(false);
        tryFlushPendingBossSpawn();
        lastEggProgressUiAt = t;
      }

      const panelId = getActiveOverlayPanelId();

      /* Menus fermés : ne pas reconstruire le DOM — garder dirty jusqu'à ouverture. */
      if (shopDirty && panelId === "shop") {
        renderShop();
      }
      if (upgradesDirty && panelId === "shop") {
        renderUpgrades();
      }
      if (panelId === "shop" && t - lastAffordabilityRefresh >= AFFORDABILITY_MS) {
        if (!shopDirty) refreshShopAffordability();
        if (!upgradesDirty) refreshUpgradeAffordability();
        lastAffordabilityRefresh = t;
      }

      if (achievementsDirty && panelId === "achievements") {
        renderAchievements();
      }

      if (dragonsDirty && panelId === "dragons") {
        renderDragons();
      }

      if (eggsDirty && panelId === "kingdom") {
        renderEggPicker();
      }

      if (zonesDirty && panelId === "zones") {
        renderZones();
      } else if (panelId === "zones" && t - lastWorldAffordabilityRefresh >= AFFORDABILITY_MS) {
        refreshWorldUnlockAffordability();
        lastWorldAffordabilityRefresh = t;
      }

      if (expeditionsDirty && isExpeditionUiOpen()) {
        renderExpeditions();
        lastExpeditionUiRefresh = t;
      }
      /* Timers expéditions : tickExpeditions() est déjà appelé (throttlé) depuis updateGame.
         Évite le double tick / double querySelector quand le tiroir est ouvert. */

      if (panelId === "stats" && t - lastStatsRefreshAt >= STATS_REFRESH_MS) {
        renderStats();
        lastStatsRefreshAt = t;
      }

      uiDirty = false;
    }

    function renderAllStatic() {
      /* Scène + HUD seulement — menus overlay construits à l'ouverture (dirty flags). */
      renderEgg();
      renderEggPicker();
      eggsDirty = false;
      renderHeader();
      renderEggProgressUI(true);
      updateChestButtonBadge();
      shopDirty = true;
      upgradesDirty = true;
      achievementsDirty = true;
      dragonsDirty = true;
      zonesDirty = true;
      expeditionsDirty = true;
      uiDirty = true;
    }

    /* -------------------------------------------------------
       EVENTS MENU — accès + countdown (pas de gameplay événement)
       ------------------------------------------------------- */
    let eventsCountdownTimer = null;

    function getEventDefs() {
      return Array.isArray(EVENT_DEFS) ? EVENT_DEFS : [];
    }

    function getEventStatusClass(status) {
      if (status === "active") return "status-active";
      if (status === "ended") return "status-ended";
      return "status-upcoming";
    }

    function getEventStatusLabel(ev) {
      if (!ev) return "Bientôt";
      if (isEventZonePlayable(ev)) return "Disponible";
      if (ev.statusLabel) return ev.statusLabel;
      if (ev.status === "active") return "En cours";
      if (ev.status === "ended") return "Terminé";
      return "Bientôt";
    }

    /* Date locale robuste (month 1–12) — évite Date.parse / chaînes ambiguës */
    function getEventStartDate(ev) {
      const p = ev && ev.startsAtLocal;
      if (!p || p.year == null || p.month == null || p.day == null) return null;
      const monthIndex = safeNumber(p.month, 0) - 1;
      if (monthIndex < 0 || monthIndex > 11) return null;
      return new Date(
        safeNumber(p.year, 0),
        monthIndex,
        safeNumber(p.day, 1),
        safeNumber(p.hour, 0),
        safeNumber(p.minute, 0),
        safeNumber(p.second, 0),
        0
      );
    }

    function formatEventCountdown(msLeft) {
      if (msLeft <= 0) return "";
      const totalSec = Math.floor(msLeft / 1000);
      const days = Math.floor(totalSec / 86400);
      const hours = Math.floor((totalSec % 86400) / 3600);
      const mins = Math.floor((totalSec % 3600) / 60);
      const secs = totalSec % 60;
      const pad = (n) => (n < 10 ? "0" + n : String(n));
      return days + "j " + pad(hours) + "h " + pad(mins) + "m " + pad(secs) + "s";
    }

    function stopEventsCountdown() {
      if (eventsCountdownTimer != null) {
        clearInterval(eventsCountdownTimer);
        eventsCountdownTimer = null;
      }
    }

    function updateEventsCountdowns() {
      const panel = document.getElementById("panel-events");
      if (!panel || !panel.classList.contains("active")) {
        stopEventsCountdown();
        return;
      }
      const now = Date.now();
      const nodes = panel.querySelectorAll("[data-event-countdown]");
      nodes.forEach((wrap) => {
        const id = wrap.getAttribute("data-event-countdown");
        const ev = getEventDefs().find((e) => e && e.id === id);
        const start = getEventStartDate(ev);
        const valueEl = wrap.querySelector(".events-card-countdown-value");
        const periodEl = wrap.parentElement
          ? wrap.parentElement.querySelector(".events-card-period")
          : null;
        if (!start || !valueEl) return;
        const msLeft = start.getTime() - now;
        if (msLeft <= 0) {
          wrap.hidden = true;
          valueEl.textContent = "";
          if (periodEl) periodEl.textContent = "Événement disponible";
          return;
        }
        wrap.hidden = false;
        if (periodEl && ev.periodLabel) periodEl.textContent = ev.periodLabel;
        valueEl.textContent = formatEventCountdown(msLeft);
      });
    }

    function startEventsCountdown() {
      stopEventsCountdown();
      updateEventsCountdowns();
      const panel = document.getElementById("panel-events");
      if (!panel || !panel.classList.contains("active")) return;
      if (!panel.querySelector("[data-event-countdown]")) return;
      eventsCountdownTimer = setInterval(updateEventsCountdowns, 1000);
    }

    function createEventCard(ev) {
      const card = document.createElement("article");
      card.className = "events-event-card theme-" + (ev.theme || "default");
      card.dataset.eventId = ev.id || "";
      card.setAttribute("role", "listitem");
      card.setAttribute("tabindex", "0");
      card.setAttribute("aria-label", (ev.name || "Événement") + " — " + getEventStatusLabel(ev));

      const visual = document.createElement("div");
      visual.className = "events-card-visual";
      visual.setAttribute("aria-hidden", "true");

      if (ev.image) {
        card.classList.add("has-visual");
        const img = document.createElement("img");
        img.className = "events-card-visual-img";
        img.src = ev.image;
        img.alt = "";
        img.draggable = false;
        img.decoding = "async";
        visual.appendChild(img);
      }

      const ico = document.createElement("span");
      ico.className = "events-card-visual-icon";
      ico.textContent = ev.icon || "✦";
      visual.appendChild(ico);

      const body = document.createElement("div");
      body.className = "events-card-body";

      const name = document.createElement("h3");
      name.className = "events-card-name";
      name.textContent = ev.name || "Événement";

      const startDate = getEventStartDate(ev);
      const startReached = !!(startDate && Date.now() >= startDate.getTime());
      const playable = isEventZonePlayable(ev);

      const period = document.createElement("p");
      period.className = "events-card-period";
      period.textContent = playable
        ? "Événement disponible"
        : (ev.periodLabel || "");

      const countdown = document.createElement("div");
      countdown.className = "events-card-countdown";
      countdown.setAttribute("data-event-countdown", ev.id || "");
      countdown.hidden = !startDate || startReached || playable;
      const cdLabel = document.createElement("span");
      cdLabel.className = "events-card-countdown-label";
      cdLabel.textContent = "Débute dans";
      const cdValue = document.createElement("span");
      cdValue.className = "events-card-countdown-value";
      cdValue.setAttribute("aria-live", "polite");
      countdown.appendChild(cdLabel);
      countdown.appendChild(cdValue);

      const desc = document.createElement("p");
      desc.className = "events-card-desc";
      desc.textContent = ev.shortDescription || "";

      const badge = document.createElement("span");
      badge.className = "events-card-badge " + getEventStatusClass(playable ? "active" : ev.status);
      badge.textContent = getEventStatusLabel(ev);

      body.appendChild(name);
      if (period.textContent) body.appendChild(period);
      if (startDate && !playable) body.appendChild(countdown);
      if (ev.shortDescription) body.appendChild(desc);
      body.appendChild(badge);

      if (playable && ev.zoneId) {
        const enterBtn = document.createElement("button");
        enterBtn.type = "button";
        enterBtn.className = "events-card-enter";
        enterBtn.textContent = "Entrer";
        enterBtn.setAttribute("aria-label", "Entrer dans " + (ev.name || "l'événement"));
        enterBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          playSound("button");
          enterEventZone(ev);
        });
        body.appendChild(enterBtn);
      }

      card.appendChild(visual);
      card.appendChild(body);

      const onActivate = () => {
        if (playable && ev.zoneId) {
          playSound("button");
          enterEventZone(ev);
          return;
        }
        showNotification(
          (ev.icon ? ev.icon + " " : "") + (ev.name || "Événement"),
          startReached ? "Événement bientôt jouable — ou utilisez un code bonus." : (ev.periodLabel || "Bientôt disponible")
        );
        playSound("button");
      };
      card.addEventListener("click", onActivate);
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onActivate();
        }
      });
      return card;
    }

    /* Scroll Events — wheel→horizontal UNIQUEMENT si overflow-x (desktop).
       Mobile : liste verticale native (overflow-y), pas de conversion. */
    function bindEventsListScroll() {
      const scroller = document.getElementById("events-list-scroll");
      if (!scroller || scroller.dataset.boundScroll === "1") return;
      scroller.dataset.boundScroll = "1";
      scroller.addEventListener(
        "wheel",
        (e) => {
          if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
          /* Pas de mode horizontal → laisser le scroll vertical natif */
          if (scroller.scrollWidth <= scroller.clientWidth + 2) return;
          e.preventDefault();
          scroller.scrollLeft += e.deltaY;
        },
        { passive: false }
      );
    }

    function renderEventsMenu() {
      stopEventsCountdown();
      ensureSeasonalEventZones();
      const listEl = document.getElementById("events-list");
      if (!listEl) return;
      const list = getEventDefs();
      listEl.innerHTML = "";
      list.forEach((ev) => {
        if (!ev) return;
        listEl.appendChild(createEventCard(ev));
      });
      bindEventsListScroll();
      const scroller = document.getElementById("events-list-scroll");
      if (scroller) {
        scroller.scrollLeft = 0;
        scroller.scrollTop = 0;
      }
      startEventsCountdown();
    }

    /* -------------------------------------------------------
       ROYAUME — scène interactive + menus bâtiments
       ------------------------------------------------------- */
    /* Layout Royaume — design space = background 1536x1024.
       platformX/Y = centres des socles (etoiles). footX/Y = pied opaque PNG (0-1).
       applyKingdomBuildingLayout() synchronise le DOM ; CSS .kb-* = fallback. */
    const KINGDOM_DESIGN = { width: 1536, height: 1024 };
    const KINGDOM_BUILDINGS = {
      forge: {
        id: "forge",
        title: "Forge des Reliques",
        asset: "assets/royaume/forge.png",
        platformX: 492,
        platformY: 518,
        widthPct: 13.8,
        footX: 0.5382,
        footY: 0.9649
      },
      breeding: {
        id: "breeding",
        title: "Élevage Draconique",
        asset: "assets/royaume/elevage.png",
        platformX: 419,
        platformY: 695,
        widthPct: 15.2,
        footX: 0.4687,
        footY: 0.9777
      },
      altar: {
        id: "altar",
        title: "Autel Draconique",
        asset: "assets/royaume/autel draconique.png",
        platformX: 1061,
        platformY: 518,
        widthPct: 13.8,
        footX: 0.6274,
        footY: 0.9753
      },
      guardians: {
        id: "guardians",
        title: "Sanctuaire des Gardiens",
        asset: "assets/royaume/sanctuaire.png",
        platformX: 1116,
        platformY: 695,
        widthPct: 15.2,
        footX: 0.5391,
        footY: 0.9904
      }
    };
    let currentKingdomBuilding = null;
    let kingdomUiBound = false;
    let kingdomAssetsLoaded = false;
    let kingdomLabelClearTimer = 0;

    function isRealmPanelOpen() {
      return !!document.getElementById("panel-realm")?.classList.contains("active");
    }

    function loadKingdomSceneAssets() {
      if (kingdomAssetsLoaded) return;
      const root = document.getElementById("kingdom-stage-inner");
      if (!root) return;
      root.querySelectorAll("img[data-src]").forEach((img) => {
        const src = img.getAttribute("data-src");
        if (!src) return;
        if (!img.getAttribute("src")) img.src = src;
      });
      kingdomAssetsLoaded = true;
    }

    function clearKingdomBuildingLabelSoon() {
      if (kingdomLabelClearTimer) clearTimeout(kingdomLabelClearTimer);
      kingdomLabelClearTimer = setTimeout(() => {
        kingdomLabelClearTimer = 0;
        document.querySelectorAll(".kingdom-building.is-label-on").forEach((el) => {
          el.classList.remove("is-label-on");
        });
      }, 1600);
    }

    function closeKingdomBuildingPanel() {
      currentKingdomBuilding = null;
      const panel = document.getElementById("kingdom-building-panel");
      const body = document.getElementById("kingdom-building-body");
      if (body) body.innerHTML = "";
      if (panel) {
        panel.classList.add("hidden");
        panel.hidden = true;
      }
    }

    function renderKingdomEmptyState(body, title, text) {
      body.innerHTML = "";
      const wrap = document.createElement("div");
      wrap.className = "kingdom-empty-state";
      const kicker = document.createElement("p");
      kicker.className = "kingdom-empty-kicker";
      kicker.textContent = title;
      const p = document.createElement("p");
      p.textContent = text;
      wrap.appendChild(kicker);
      wrap.appendChild(p);
      body.appendChild(wrap);
    }

    function renderKingdomForgePanel(body) {
      /* Pas de recettes / forge gameplay encore — inventaire reliques seul existe. */
      const relics = ensureInventory().relics || {};
      const ownedIds = Object.keys(relics).filter((id) => {
        const e = relics[id];
        if (!e) return false;
        if (typeof e === "number") return e > 0;
        return Math.max(0, Math.floor(safeNumber(e.amount, 1))) > 0;
      });
      body.innerHTML = "";
      if (!ownedIds.length) {
        renderKingdomEmptyState(
          body,
          "Forge des Reliques",
          "Les premières recettes seront bientôt disponibles."
        );
        return;
      }
      const intro = document.createElement("p");
      intro.className = "kingdom-empty-kicker";
      intro.style.marginBottom = "10px";
      intro.textContent = "Reliques possédées";
      body.appendChild(intro);
      const grid = document.createElement("div");
      grid.className = "guardian-sanctum-grid";
      ownedIds.forEach((id) => {
        const entry = relics[id];
        const amount = typeof entry === "number"
          ? Math.max(0, Math.floor(entry))
          : Math.max(0, Math.floor(safeNumber(entry.amount, 1)));
        const name = (entry && typeof entry === "object" && entry.name) || String(id);
        const card = document.createElement("article");
        card.className = "guardian-card";
        card.innerHTML = '<p class="guardian-card-name"></p><p class="guardian-card-sub"></p>';
        card.querySelector(".guardian-card-name").textContent = name;
        card.querySelector(".guardian-card-sub").textContent = "x" + amount;
        grid.appendChild(card);
      });
      const tip = document.createElement("p");
      tip.style.marginTop = "14px";
      tip.style.textAlign = "center";
      tip.style.color = "rgba(210,220,235,0.75)";
      tip.textContent = "Les recettes de forge seront bientôt disponibles.";
      body.appendChild(grid);
      body.appendChild(tip);
    }

    function renderKingdomBreedingPanel(body) {
      renderKingdomEmptyState(
        body,
        "Élevage Draconique",
        "Le système d'élevage sera bientôt disponible."
      );
    }

    function renderKingdomAltarPanel(body) {
      renderKingdomEmptyState(
        body,
        "Autel Draconique",
        "Les rituels draconiques seront bientôt disponibles."
      );
    }

    function isEggBossDiscovered(bossId) {
      const rec = getEggBossRecord(bossId);
      if (rec.victories > 0 || rec.bestRank || rec.bestTime != null) return true;
      const def = getEggBossDef(bossId);
      if (def && def.guardianEggId && getInventoryQuantity("eggs", def.guardianEggId) > 0) {
        return true;
      }
      return false;
    }

    function renderKingdomGuardiansPanel(body) {
      body.innerHTML = "";
      const defs = getEnabledEggBossDefs();
      if (!defs.length) {
        renderKingdomEmptyState(
          body,
          "Sanctuaire des Gardiens",
          "Aucun Gardien n'est encore répertorié."
        );
        return;
      }
      const grid = document.createElement("div");
      grid.className = "guardian-sanctum-grid";
      defs.forEach((def) => {
        const discovered = isEggBossDiscovered(def.id);
        const rec = getEggBossRecord(def.id);
        const eggDef = getEggDef(def.eggId);
        const eggQty = def.guardianEggId
          ? getInventoryQuantity("eggs", def.guardianEggId)
          : 0;
        const card = document.createElement("article");
        card.className = "guardian-card" + (discovered ? "" : " is-unknown");

        const art = document.createElement("div");
        art.className = "guardian-card-art";
        const img = document.createElement("img");
        img.alt = "";
        img.draggable = false;
        img.decoding = "async";
        img.loading = "lazy";
        if (def.image) img.src = def.image;
        art.appendChild(img);
        if (!discovered) {
          const mark = document.createElement("span");
          mark.className = "guardian-card-unknown-mark";
          mark.textContent = "?";
          art.appendChild(mark);
        }
        card.appendChild(art);

        const name = document.createElement("p");
        name.className = "guardian-card-name";
        name.textContent = discovered ? (def.displayName || def.name) : "Gardien inconnu";
        card.appendChild(name);

        const sub = document.createElement("p");
        sub.className = "guardian-card-sub";
        if (discovered) {
          sub.textContent = (def.subtitle || "") +
            (eggDef ? (" · Œuf : " + eggDef.name) : "");
        } else {
          sub.textContent = "???";
        }
        card.appendChild(sub);

        const stats = document.createElement("ul");
        stats.className = "guardian-card-stats";
        const rows = discovered
          ? [
              ["Meilleur rang", rec.bestRank || "—"],
              ["Meilleur temps", formatEggBossRecordTime(rec.bestTime)],
              ["Victoires", String(rec.victories || 0)],
              ["Œufs Gardien", "x" + eggQty]
            ]
          : [
              ["Statut", "Non découvert"],
              ["Œufs Gardien", "x" + eggQty]
            ];
        rows.forEach((pair) => {
          const li = document.createElement("li");
          li.innerHTML = '<span class="gs-lab"></span><span class="gs-val"></span>';
          li.querySelector(".gs-lab").textContent = pair[0];
          li.querySelector(".gs-val").textContent = pair[1];
          stats.appendChild(li);
        });
        card.appendChild(stats);
        grid.appendChild(card);
      });
      body.appendChild(grid);
    }

    function openKingdomBuilding(buildingId) {
      const def = KINGDOM_BUILDINGS[buildingId];
      if (!def || !isRealmPanelOpen()) return;
      currentKingdomBuilding = buildingId;
      const panel = document.getElementById("kingdom-building-panel");
      const title = document.getElementById("kingdom-building-title");
      const body = document.getElementById("kingdom-building-body");
      if (!panel || !title || !body) return;
      title.textContent = def.title;
      body.innerHTML = "";
      if (buildingId === "forge") renderKingdomForgePanel(body);
      else if (buildingId === "breeding") renderKingdomBreedingPanel(body);
      else if (buildingId === "altar") renderKingdomAltarPanel(body);
      else if (buildingId === "guardians") renderKingdomGuardiansPanel(body);
      else renderKingdomEmptyState(body, def.title, "Bientôt disponible.");
      panel.classList.remove("hidden");
      panel.hidden = false;
      playSound("button");
    }

    function openRealmScene() {
      loadKingdomSceneAssets();
      closeKingdomBuildingPanel();
    }

    function applyKingdomBuildingLayout() {
      const stage = document.getElementById("kingdom-stage-inner");
      if (!stage) return;
      Object.keys(KINGDOM_BUILDINGS).forEach((id) => {
        const def = KINGDOM_BUILDINGS[id];
        const el = stage.querySelector('.kingdom-building[data-building="' + id + '"]');
        if (!el || !def) return;
        el.style.left = ((def.platformX / KINGDOM_DESIGN.width) * 100).toFixed(2) + "%";
        el.style.top = ((def.platformY / KINGDOM_DESIGN.height) * 100).toFixed(2) + "%";
        el.style.width = def.widthPct + "%";
        el.style.setProperty("--kb-ax", (def.footX * 100).toFixed(2) + "%");
        el.style.setProperty("--kb-ay", (def.footY * 100).toFixed(2) + "%");
      });
    }

    function bindKingdomUi() {
      if (kingdomUiBound) return;
      kingdomUiBound = true;
      applyKingdomBuildingLayout();
      const stage = document.getElementById("kingdom-stage-inner");
      if (stage) {
        stage.addEventListener("click", (e) => {
          const btn = e.target.closest(".kingdom-building[data-building]");
          if (!btn || !stage.contains(btn)) return;
          const id = btn.getAttribute("data-building");
          if (window.matchMedia && window.matchMedia("(hover: none)").matches) {
            btn.classList.add("is-label-on");
            clearKingdomBuildingLabelSoon();
          }
          openKingdomBuilding(id);
        });
      }
      const back = document.getElementById("kingdom-building-back");
      if (back) {
        back.addEventListener("click", () => {
          playSound("button");
          closeKingdomBuildingPanel();
        });
      }
    }

    /* -------------------------------------------------------
       NAVIGATION
       ------------------------------------------------------- */
    const NAV_GROUPS = {
      /* Bouton central Œuf — retour gameplay (panel-kingdom) */
      kingdom: { panels: [] },
      shop: { panels: [{ id: "shop", label: "Boutique" }] },
      dragons: { panels: [{ id: "dragons", label: "🐲 Bestiaire" }] },
      events: { panels: [{ id: "events", label: "Événements" }] },
      world: { panels: [{ id: "zones", label: "Monde" }] },
      /* Accès via badge latéral — plus dans la bottom nav */
      trophies: { panels: [{ id: "achievements", label: "🏆 Succès" }] },
      /* Royaume — vue principale (onglet bas, pas overlay) */
      realm: { panels: [{ id: "realm", label: "🏰 Royaume" }] },
      stats: { panels: [{ id: "stats", label: "📊 Statistiques" }] },
      settings: { panels: [{ id: "settings", label: "⚙️ Réglages" }] }
    };
    const lastPanelByGroup = {};

    function getNavGroupForPanel(panelId) {
      if (panelId === "kingdom") return "kingdom";
      /* Ancien onglet Améliorations → groupe Boutique (dual layout) */
      if (panelId === "upgrades") return "shop";
      return Object.keys(NAV_GROUPS).find((g) =>
        NAV_GROUPS[g].panels.some((p) => p.id === panelId)) || "kingdom";
    }

    function openNavGroup(group) {
      const def = NAV_GROUPS[group];
      if (!def || !def.panels.length) {
        switchPanel("kingdom");
        return;
      }
      const remembered = lastPanelByGroup[group];
      const target = def.panels.some((p) => p.id === remembered) ? remembered : def.panels[0].id;
      switchPanel(target);
    }

    function renderSheetBar(panelId) {
      const bar = document.getElementById("sheet-bar");
      const tabs = document.getElementById("sheet-tabs");
      if (!bar || !tabs) return;
      const group = getNavGroupForPanel(panelId);
      bar.classList.remove("is-world", "is-shop-close-only");
      /* Hub Expéditions / Inventaire : croix sheet-bar type Bestiaire / Succès */
      if (
        panelId === "expeditions-hub" ||
        panelId === "inventory" ||
        panelId === "expedition-contracts" ||
        panelId === "expedition-threats"
      ) {
        bar.hidden = false;
        bar.classList.add("is-shop-close-only");
        tabs.innerHTML = "";
        tabs.classList.remove("single");
        return;
      }
      /* Dragons / Royaume (vue principale) / Œuf / Monde : pas de sheet-bar flottant */
      if (panelId === "dragons" || panelId === "realm" || group === "kingdom" || group === "world" || group === "realm") {
        bar.hidden = true;
        return;
      }
      /* Boutique / Événements / Succès / Stats : pas d’onglets, seulement le X */
      if (group === "shop" || group === "events" || group === "trophies" || group === "stats") {
        bar.hidden = false;
        bar.classList.add("is-shop-close-only");
        tabs.innerHTML = "";
        tabs.classList.remove("single");
        return;
      }
      bar.hidden = false;
      tabs.innerHTML = "";
      NAV_GROUPS[group].panels.forEach((p) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "sheet-tab" + (p.id === panelId ? " active" : "");
        b.setAttribute("role", "tab");
        b.setAttribute("aria-selected", String(p.id === panelId));
        b.textContent = p.label;
        b.addEventListener("click", () => switchPanel(p.id));
        tabs.appendChild(b);
      });
      tabs.classList.toggle("single", NAV_GROUPS[group].panels.length === 1);
    }

    function syncShopDividerToKingdomNav() {
      const divider = document.getElementById("shop-dual-divider");
      const layout = document.getElementById("shop-dual-layout");
      const kingdomBtn = document.querySelector('.nav-btn[data-nav="kingdom"]');
      if (!divider || !layout || !kingdomBtn) return;
      if (!document.getElementById("panel-shop")?.classList.contains("active")) return;
      const layoutRect = layout.getBoundingClientRect();
      const kingdomRect = kingdomBtn.getBoundingClientRect();
      if (layoutRect.width <= 0) return;
      const kingdomCenterX = kingdomRect.left + kingdomRect.width / 2;
      const offsetPx = kingdomCenterX - layoutRect.left;
      divider.style.left = Math.max(0, Math.min(layoutRect.width, offsetPx)) + "px";
      divider.style.transform = "translateX(-50%)";
    }

    function switchPanel(name) {
      if (name === "expeditions") {
        openExpeditionsHub();
        return;
      }
      /* Améliorations fusionnées dans le panneau Boutique */
      if (name === "upgrades") name = "shop";
      if (name !== "kingdom") closeExpeditionDrawer({ skipHubReturn: true });
      const hubBtn = document.getElementById("btn-open-expeditions-hub");
      if (hubBtn) {
        hubBtn.setAttribute("aria-expanded", name === "expeditions-hub" ? "true" : "false");
      }
      const invBtn = document.getElementById("btn-open-inventory");
      if (invBtn) {
        invBtn.setAttribute("aria-expanded", name === "inventory" ? "true" : "false");
      }
      const achBtn = document.getElementById("btn-open-achievements");
      if (achBtn) {
        achBtn.setAttribute("aria-expanded", name === "achievements" ? "true" : "false");
      }
      const group = getNavGroupForPanel(name);
      if (group !== "kingdom") lastPanelByGroup[group] = name;
      renderSheetBar(name);
      document.querySelectorAll(".panel").forEach((p) => {
        const id = p.dataset.panel;
        if (id === "kingdom") {
          /* Sanctuary always under overlays ; masqué aussi quand vue Royaume active */
          p.classList.add("active");
          p.classList.toggle("dimmed", name !== "kingdom");
          return;
        }
        if (id === "realm") {
          /* Vue principale (pas overlay) : active uniquement sur l’onglet Royaume */
          p.classList.toggle("active", name === "realm");
          return;
        }
        if (id === "upgrades") {
          p.classList.remove("active");
          return;
        }
        const willActivate = id === name;
        p.classList.toggle("active", willActivate);
        /* Relancer l’animation d’ouverture (même sheetIn que Monde) à chaque ouverture */
        if (willActivate && p.classList.contains("menu-open-animation")) {
          p.style.animation = "none";
          void p.offsetWidth;
          p.style.animation = "";
        }
      });
      document.documentElement.classList.toggle("realm-view-active", name === "realm");
      document.documentElement.setAttribute("data-main-view", name === "realm" ? "realm" : (name === "kingdom" ? "egg" : name));
      document.querySelectorAll(".nav-btn").forEach((b) => {
        b.classList.toggle("active", b.dataset.nav === group);
      });
      const gear = document.getElementById("btn-open-settings");
      if (gear) gear.classList.toggle("active", group === "settings" || name === "stats");
      /* Prioriser / attendre brièvement les portraits découverts du 1er viewport. */
      let dragonsWarmPending = false;
      if (name === "dragons") {
        const filterId = dragonsFilterZoneId || "all";
        const paths = getViewportDiscoveredPortraitPaths(filterId, DRAGONS_VIEWPORT_WARM);
        const missing = window.DCAssets
          ? paths.filter((p) => !DCAssets.isLoaded(p))
          : [];
        if (missing.length) {
          const grid = document.getElementById("dragons-grid");
          if (grid) grid.style.opacity = "0";
          dragonsWarmPending = true;
          dragonsDirty = false;
          raceWarmDragonsViewport(filterId, DRAGONS_VIEWPORT_WARM, DRAGONS_WARM_WAIT_MS)
            .then(function () {
              if (grid) grid.style.opacity = "";
              renderDragons();
            })
            .catch(function () {
              if (grid) grid.style.opacity = "";
              renderDragons();
            });
        } else {
          warmDragonsFirstViewport(filterId, DRAGONS_VIEWPORT_WARM);
          dragonsDirty = true;
        }
      }
      const activePanel = document.querySelector('.panel.overlay-panel.active');
      if (activePanel) {
        activePanel.scrollTop = 0;
        if (window.DCAnim && DCAnim.staggerCards) {
          DCAnim.staggerCards(activePanel);
        }
      }
      uiDirty = true;
      if (name === "shop") {
        shopDirty = true;
        upgradesDirty = true;
      }
      if (name === "achievements") {
        selectedAchievementId = null;
        achievementsDirty = true;
      }
      if (name === "dragons" && !dragonsWarmPending) dragonsDirty = true;
      if (name === "eggs") eggsDirty = true;
      if (name === "zones") {
        zonesDirty = true;
        closeZoneDetail();
      }
      updateMenuBackdrop();
      if (name === "kingdom") tryFlushPendingBossSpawn();
      if (name === "inventory") {
        ensureInventory();
        ensureChestInventory();
        syncInventoryTabsUi();
        renderInventoryPanel();
        updateInventoryBadge();
      }
      if (name === "events") {
        renderEventsMenu();
      } else {
        stopEventsCountdown();
      }
      if (name === "realm") {
        openRealmScene();
      } else {
        closeKingdomBuildingPanel();
      }
      if (name === "expeditions") expeditionsDirty = true;
      if (name === "kingdom" && !hatchSequenceActive) {
        /* Menus fermés : garantir que l'œuf n'est pas resté hidden/opacity 0. */
        resetEggVisualState();
        const img = document.getElementById("egg-img");
        if (!img || img.hidden || !img.getAttribute("data-egg-src")) {
          currentEggImageStage = null;
          currentEggImageEggId = null;
          updateEggVisualState({ forceImage: true });
        }
        scheduleUpdateGameCenterAxis();
      }
      renderUI();
      if (name === "shop") {
        requestAnimationFrame(() => {
          /* Ouverture : colonnes en haut (PRODUCTION / ACTIVES), une seule fois */
          document.querySelectorAll("#panel-shop .shop-column-scroll").forEach((el) => {
            el.scrollTop = 0;
          });
          syncShopDividerToKingdomNav();
          requestAnimationFrame(syncShopDividerToKingdomNav);
        });
      }
      if (name === "zones") {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => scrollWorldMapToCurrentZone(true));
        });
      }
    }

    /* -------------------------------------------------------
       GAME LOOP (delta-time based)
       ------------------------------------------------------- */
    function updateGame(now) {
      const dt = Math.min(Math.max((now - lastFrameTime) / 1000, 0), 0.25);
      lastFrameTime = now;

      if (document.getElementById("intro-modal").classList.contains("hidden") === false) {
        requestAnimationFrame(updateGame);
        return;
      }

      updateCps(now);

      gameState.playTimeMs += dt * 1000;

      const pps = gameState.powerPerSecond;
      if (pps > 0 && dt > 0 && !hatchSequenceActive) {
        addPower(pps * dt, "auto");
      }

      if (now - lastAchievementCheckAt >= ACHIEVEMENT_CHECK_MS) {
        checkAchievements();
        lastAchievementCheckAt = now;
      }
      if (now - lastExpeditionTickAt >= EXPEDITION_TICK_MS) {
        tickExpeditions();
        lastExpeditionTickAt = now;
      }
      /* Arrière-plan : pas de FX / HUD coûteux (RAF souvent ralenti ; save via visibilitychange). */
      if (!document.hidden) {
        tickRegularChestUi(now);
        tickEggAmbientFx(now);
        tickChargedAuraSparks();
        renderUI(now);
      }

      requestAnimationFrame(updateGame);
    }

    /* -------------------------------------------------------
       BACKGROUND SPARKS
       ------------------------------------------------------- */
    function initSparks() {
      const container = document.getElementById("bg-sparks");
      for (let i = 0; i < 18; i++) {
        const s = document.createElement("div");
        s.className = "spark";
        s.style.left = Math.random() * 100 + "%";
        s.style.bottom = Math.random() * 20 + "%";
        s.style.animationDuration = 6 + Math.random() * 10 + "s";
        s.style.animationDelay = Math.random() * 12 + "s";
        container.appendChild(s);
      }
    }

    /* -------------------------------------------------------
       EVENT BINDINGS
       ------------------------------------------------------- */
    function bindEvents() {
      const zone = document.getElementById("click-zone");

      /*
        Press visuel : UNE seule source — #egg-hitbox + pointerdown.
        Pas de listener sur #click-zone (bubbling = double press).
        Pas de touchstart en parallèle si PointerEvent existe.
      */
      const eggHit = document.getElementById("egg-hitbox");
      const onEggPointerDown = (e) => {
        const isTouch = e.pointerType === "touch" || e.pointerType === "pen" || e.pointerType === "";
        if (!isTouch && e.button != null && e.button !== 0) return;
        if (e.target.closest && e.target.closest("#egg-carousel-peer, #egg-carousel-peer-prev, .egg-carousel-item:not(.is-active-slot)")) {
          return;
        }
        if (!isEggGameplayHit(e.clientX, e.clientY)) return;
        handleEggPointerDown(e.clientX, e.clientY);
      };
      if (eggHit) {
        if (typeof window.PointerEvent === "function") {
          eggHit.addEventListener("pointerdown", onEggPointerDown);
        } else {
          eggHit.addEventListener("touchstart", (e) => {
            const t = e.changedTouches && e.changedTouches[0];
            if (!t) return;
            handleEggPointerDown(t.clientX, t.clientY);
          }, { passive: true });
        }
      }

      zone.addEventListener("click", (e) => {
        const peer = e.target.closest && e.target.closest("#egg-carousel-peer, #egg-carousel-peer-prev, .egg-carousel-item:not(.is-active-slot)");
        if (peer) {
          e.preventDefault();
          e.stopPropagation();
          const id = peer.dataset.eggId;
          if (id) selectCarouselEgg(id);
          return;
        }
        if (isEggCarouselAnimating) return;
        if (!isEggGameplayHit(e.clientX, e.clientY)) return;
        handleClick(e.clientX, e.clientY);
      });

      zone.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          const r = zone.getBoundingClientRect();
          const cx = r.left + r.width / 2;
          const cy = r.top + r.height / 2;
          handleEggPointerDown(cx, cy);
          handleClick(cx, cy);
        }
      });

      document.querySelectorAll(".nav-btn").forEach((btn) => {
        /* pointerdown : warm assets avant l'ouverture (click) — pas de double navigation. */
        btn.addEventListener("pointerdown", () => {
          if (btn.dataset.nav === "dragons") {
            warmDragonsFirstViewport(dragonsFilterZoneId || "all", DRAGONS_VIEWPORT_WARM);
          }
          if (btn.dataset.nav === "realm") {
            loadKingdomSceneAssets();
          }
        }, { passive: true });
        btn.addEventListener("click", () => openNavGroup(btn.dataset.nav));
      });
      /* Délégation : survit aux reparents mobile ↔ desktop (un seul handler). */
      document.getElementById("app").addEventListener("click", onSettingsButtonClick);
      const btnOpenStats = document.getElementById("btn-open-stats");
      if (btnOpenStats) {
        btnOpenStats.addEventListener("click", () => switchPanel("stats"));
      }
      document.getElementById("sheet-close").addEventListener("click", () => switchPanel("kingdom"));
      const dragonsPanelClose = document.getElementById("dragons-panel-close");
      if (dragonsPanelClose && !dragonsPanelClose.dataset.bound) {
        dragonsPanelClose.dataset.bound = "1";
        dragonsPanelClose.addEventListener("click", () => {
          playSound("button");
          switchPanel("kingdom");
        });
      }
      const worldMenuClose = document.getElementById("world-menu-close");
      if (worldMenuClose) worldMenuClose.addEventListener("click", () => switchPanel("kingdom"));
      window.addEventListener("resize", () => {
        invalidateEggHitRectCache();
        clickZoneRectCache = null;
        clickZoneRectCacheAt = 0;
        syncShopDividerToKingdomNav();
        syncMobilePerformanceClass();
        syncMobileModalOpenClass();
        syncSettingsButtonPlacement();
        if (gameCenterAxisResizeTimer) clearTimeout(gameCenterAxisResizeTimer);
        gameCenterAxisResizeTimer = setTimeout(() => {
          gameCenterAxisResizeTimer = 0;
          scheduleUpdateGameCenterAxis();
        }, 50);
      });

      const gameLogo = document.querySelector(".header-logo-wrap .game-logo") || document.querySelector(".game-logo");
      if (gameLogo) {
        if (gameLogo.complete) scheduleUpdateGameCenterAxis();
        else gameLogo.addEventListener("load", () => scheduleUpdateGameCenterAxis(), { once: true });
      }
      document.addEventListener("keydown", (e) => {
        if (e.key !== "Escape") return;
        if (!document.getElementById("team-picker-modal").classList.contains("hidden")) {
          closeTeamPicker();
          return;
        }
        if (!document.getElementById("dragon-detail-modal").classList.contains("hidden")) {
          closeDragonDetail();
          return;
        }
        if (currentKingdomBuilding) {
          closeKingdomBuildingPanel();
          return;
        }
        if (isExpeditionDrawerOpen()) {
          closeExpeditionDrawer({ skipHubReturn: true });
          return;
        }
        if (document.getElementById("team-module").classList.contains("open")) {
          toggleTeamDrawer(false);
          return;
        }
        if (!document.getElementById("chest-reveal-modal").classList.contains("hidden")) {
          closeChestReveal();
          return;
        }
        if (isChestModalOpen()) {
          closeChestModal();
          return;
        }
        if (document.querySelector(".modal-overlay:not(.hidden)")) return;
        if (getActiveOverlayPanelId() !== "kingdom") switchPanel("kingdom");
      });

      document.getElementById("btn-awaken").addEventListener("click", () => {
        gameState.introSeen = true;
        document.getElementById("intro-modal").classList.add("hidden");
        saveGame(true);
        showNotification("🐉 Éveil", "L'œuf pulse d'une énergie ancienne…");
        lastFrameTime = performance.now();
      });

      document.getElementById("btn-offline-ok").addEventListener("click", () => {
        document.getElementById("offline-modal").classList.add("hidden");
        lastFrameTime = performance.now();
      });

      const zoneDetailClose = document.getElementById("zone-detail-close");
      if (zoneDetailClose) {
        zoneDetailClose.addEventListener("click", () => closeZoneDetail());
      }
      bindWorldMapNavigation();
      preloadWorldMapImages();

      document.getElementById("btn-add-dragon").addEventListener("click", () => {
        const modal = document.getElementById("dragon-modal");
        modal.classList.add("hidden");
        modal.classList.remove("reveal-animating");
        const sparks = document.getElementById("dragon-reveal-sparks");
        if (sparks) sparks.innerHTML = "";
        const modalInner = document.getElementById("dragon-modal-inner");
        if (modalInner) {
          modalInner.classList.remove("reveal-new", "reveal-mythic");
          modalInner.getAnimations && modalInner.getAnimations().forEach((a) => { try { a.cancel(); } catch (e) {} });
        }
        if (pendingReveal && pendingReveal.dragonDef) {
          const msg = pendingReveal.isNew
            ? pendingReveal.dragonDef.name + " découvert !"
            : "+" + pendingReveal.fragmentsGained + " fragments";
          showNotification("🐉 Collection", msg);
        }
        const twin = pendingReveal && pendingReveal.twinReveal;
        if (twin && twin.dragonDef) {
          pendingReveal = twin;
          pendingReveal.twinReveal = null;
          showTwinHatchBanner(() => {
            const TT = HATCH_SEQUENCE_TIMINGS;
            (async () => {
              await hatchDelay(TT.twinPause, hatchFxToken);
              await playDragonSummonEffect({ duration: TT.twinSummonEffect });
              await openRevealModal(pendingReveal);
              /* Pas de 2e crack/hatch — reveal lent du dragon 2 uniquement. */
            })();
          });
          return;
        }
        const hatchedEggId =
          pendingReveal && pendingReveal.eggDef && pendingReveal.eggDef.id
            ? pendingReveal.eggDef.id
            : (pendingReveal && gameState.equippedEggId);
        finishHatchCleanup();
        onNormalEggHatchFinishedForBoss(hatchedEggId);
      });

      const poolBtn = document.getElementById("btn-view-pool");
      if (poolBtn) poolBtn.addEventListener("click", openPoolModal);
      const poolMobile = document.getElementById("btn-view-pool-mobile");
      if (poolMobile) poolMobile.addEventListener("click", openPoolModal);

      function openHistoryModal() {
        renderRecentHatches();
        document.getElementById("history-modal").classList.remove("hidden");
      }
      const histBtn = document.getElementById("btn-history");
      const histBtnMobile = document.getElementById("btn-history-mobile");
      if (histBtn) histBtn.addEventListener("click", openHistoryModal);
      if (histBtnMobile) histBtnMobile.addEventListener("click", openHistoryModal);
      document.getElementById("btn-close-dragon-detail").addEventListener("click", closeDragonDetail);
      document.getElementById("btn-close-team-picker").addEventListener("click", closeTeamPicker);
      document.getElementById("team-picker-modal").addEventListener("click", (e) => {
        if (e.target.id === "team-picker-modal") closeTeamPicker();
      });
      document.getElementById("btn-team-remove").addEventListener("click", () => {
        const slot = Number(document.getElementById("team-picker-modal").dataset.slot || 0);
        assignTeamSlot(slot, null);
      });
      document.getElementById("btn-team-confirm").addEventListener("click", confirmTeamPickerSelection);
      document.getElementById("btn-team-mobile").addEventListener("click", () => toggleTeamDrawer());
      document.getElementById("btn-team-tablet").addEventListener("click", () => toggleTeamDrawer());
      bindTeamUiDelegates();
      bindKingdomUi();
      bindChestUiDelegates();
      syncMobilePerformanceClass();
      syncMobileModalOpenClass();
      syncSettingsButtonPlacement();
      const mobileTeamOpen = document.getElementById("btn-mobile-team-open");
      if (mobileTeamOpen) {
        mobileTeamOpen.addEventListener("click", () => toggleTeamDrawer(true));
      }
      const mobileTeamSlots = document.getElementById("mobile-team-slots");
      if (mobileTeamSlots) {
        mobileTeamSlots.addEventListener("click", (ev) => {
          const btn = ev.target.closest(".mobile-team-slot");
          if (!btn) return;
          const slot = Number(btn.dataset.slot);
          if (!Number.isFinite(slot)) return;
          /* "+" / portrait → FORMATION directe (pas le menu Équipe) */
          toggleTeamDrawer(false);
          openTeamPicker(slot);
        });
      }
      const expHubBtn = document.getElementById("btn-open-expeditions-hub");
      const invBtn = document.getElementById("btn-open-inventory");
      const expHubHall = document.getElementById("exp-hub-hall");
      const expHubBody = document.getElementById("expeditions-hub-body")
        || document.querySelector("#panel-expeditions-hub .expeditions-hub-body");
      const expClose = document.getElementById("expedition-drawer-close");
      const expBack = document.getElementById("expedition-drawer-back");
      if (expHubBtn) {
        expHubBtn.addEventListener("click", () => {
          if (isExpeditionsHubOpen()) closeExpeditionsHub();
          else openExpeditionsHub();
        });
      }
      if (invBtn) {
        invBtn.addEventListener("click", () => {
          if (isInventoryPanelOpen()) closeInventoryPanel();
          else openInventoryPanel();
        });
      }
      const invTabs = document.getElementById("inventory-tabs");
      if (invTabs && !invTabs.dataset.bound) {
        invTabs.dataset.bound = "1";
        invTabs.addEventListener("click", (ev) => {
          const tabBtn = ev.target.closest(".inventory-tab[data-inv-tab]");
          if (!tabBtn || !invTabs.contains(tabBtn)) return;
          playSound("button");
          setInventoryTab(tabBtn.getAttribute("data-inv-tab"));
        });
      }
      const bossAbandon = document.getElementById("egg-boss-abandon");
      if (bossAbandon && !bossAbandon.dataset.bound) {
        bossAbandon.dataset.bound = "1";
        bossAbandon.addEventListener("click", () => {
          playSound("button");
          abandonEggBossFight();
        });
      }
      const bossVictoryClose = document.getElementById("egg-boss-victory-close");
      if (bossVictoryClose && !bossVictoryClose.dataset.bound) {
        bossVictoryClose.dataset.bound = "1";
        bossVictoryClose.addEventListener("click", () => {
          playSound("button");
          closeEggBossVictoryModal();
        });
      }
      const achOpenBtn = document.getElementById("btn-open-achievements");
      if (achOpenBtn && !achOpenBtn.dataset.bound) {
        achOpenBtn.dataset.bound = "1";
        achOpenBtn.addEventListener("click", () => openAchievementsPanel());
      }
      const invClose = document.getElementById("inventory-close");
      if (invClose) {
        invClose.addEventListener("click", () => {
          playSound("button");
          closeInventoryPanel();
        });
      }
      if (expHubHall) {
        expHubHall.addEventListener("click", () => openExpeditionHallFromHub());
      }
      if (expHubBody && !expHubBody.dataset.hubModsBound) {
        expHubBody.dataset.hubModsBound = "1";
        expHubBody.addEventListener("click", (ev) => {
          const mod = ev.target.closest(".exp-hub-module[data-exp-hub]");
          if (!mod || !expHubBody.contains(mod)) return;
          if (mod.id === "exp-hub-hall") return;
          ev.preventDefault();
          const kind = mod.getAttribute("data-exp-hub") || "";
          if (kind === "contracts") {
            openExpeditionContractsPanel();
            return;
          }
          if (kind === "threats") {
            openExpeditionThreatsPanel();
            return;
          }
          if (!mod.classList.contains("is-soon")) return;
          playSound("button");
          if (kind === "ledger") {
            showNotification("Registre", "Le registre d'exploration arrive prochainement.");
          } else {
            showNotification("Expéditions", "Ce module arrive prochainement.");
          }
        });
      }
      const contractsBack = document.getElementById("expedition-contracts-back");
      const contractsClose = document.getElementById("expedition-contracts-close");
      const threatsBack = document.getElementById("expedition-threats-back");
      const threatsClose = document.getElementById("expedition-threats-close");
      if (contractsBack) {
        contractsBack.addEventListener("click", () => returnToExpeditionsHubFromSubpanel());
      }
      if (threatsBack) {
        threatsBack.addEventListener("click", () => returnToExpeditionsHubFromSubpanel());
      }
      if (contractsClose) {
        contractsClose.addEventListener("click", () => {
          playSound("button");
          switchPanel("kingdom");
          updateMenuBackdrop();
        });
      }
      if (threatsClose) {
        threatsClose.addEventListener("click", () => {
          playSound("button");
          switchPanel("kingdom");
          updateMenuBackdrop();
        });
      }
      try {
        window.DCDebug = window.DCDebug || {};
        window.DCDebug.forceThreatDiscovery = function forceThreatDiscovery() {
          ensureExpeditionState();
          const exp = gameState.expeditions;
          exp.activeThreat = null;
          const zone = getCurrentZone();
          const defs = EXPEDITION_DEFS.filter((d) => d.zoneId === zone.id);
          const src = defs[0] || EXPEDITION_DEFS[0];
          if (!src) return false;
          const fakeRun = {
            id: "debug_threat_" + Date.now(),
            expeditionId: src.id,
            zoneId: src.zoneId,
            result: { success: true },
            isThreat: false
          };
          delete exp.threatRolledRuns[fakeRun.id];
          const threat = createThreatFromSourceRun(fakeRun);
          if (!threat) return false;
          exp.activeThreat = threat;
          exp.threatRolledRuns[fakeRun.id] = 1;
          updateExpeditionHubBadges();
          saveGame(true);
          showNotification("⚠️ DEV", "Menace forcée : " + threat.name);
          if (document.getElementById("panel-expedition-threats")?.classList.contains("active")) {
            renderExpeditionThreatsPanel();
          }
          return true;
        };
        window.DCDebug.THREAT_DISCOVERY_CHANCE = THREAT_DISCOVERY_CHANCE;
        window.DCDebug.generateDailyContracts = generateDailyContractsForDev;
        window.DCDebug.getContractDateKey = getContractDateKey;
        window.DCDebug.forceEggBoss = function forceEggBoss(bossId) {
          const id = bossId || "aurek";
          const def = getEggBossDef(id);
          if (!def || !def.enabled) return false;
          const ebs = ensureEggBossSystem();
          ebs.lastBossTimestamp = 0;
          ebs.pendingBossSpawn = null;
          pendingBossSpawn = null;
          return beginEggBossEncounter(def.id, { fromGuardianEgg: false });
        };
        window.DCDebug.giveGuardianEgg = function giveGuardianEgg(bossId) {
          const def = getEggBossDef(bossId || "aurek");
          if (!def) return false;
          addInventoryItem("eggs", def.guardianEggId, 1, {
            bossId: def.id,
            name: def.guardianEggName
          });
          showNotification("DEV", def.guardianEggName + " +1");
          return true;
        };
        window.DCDebug.forceGuardianEggDrop = function forceGuardianEggDrop(bossId) {
          const def = getEggBossDef(bossId || "aurek");
          if (!def) return false;
          addInventoryItem("eggs", def.guardianEggId, 1, {
            bossId: def.id,
            name: def.guardianEggName
          });
          showNotification("DEV", "Drop forcé : " + def.guardianEggName);
          return true;
        };
        window.DCDebug.clearEggBossCooldown = function clearEggBossCooldown() {
          ensureEggBossSystem().lastBossTimestamp = 0;
          if (isInventoryPanelOpen()) renderInventoryPanel();
          return true;
        };
        window.DCDebug.getEggBossDebugState = getEggBossDebugState;
        window.DCDebug.forceEggBossEligibility = forceEggBossEligibility;
        window.DCDebug.simulateEggBossHatchRoll = function simulateEggBossHatchRoll(eggId, forceRoll) {
          const id = eggId || gameState.equippedEggId || "basic";
          const rolled = rollNaturalEggBossSpawn(id, {
            forceRoll: forceRoll != null ? forceRoll : 1
          });
          if (rolled) queueEggBossSpawn(rolled.id, { fromGuardianEgg: false });
          return {
            spawned: !!rolled,
            bossId: rolled ? rolled.id : null,
            state: getEggBossDebugState(id)
          };
        };
      } catch (e) { /* ignore */ }
      if (expBack) {
        expBack.addEventListener("click", () => {
          playSound("button");
          if (expBack.dataset.prepareBack === "1" || expeditionUi.mode === "prepare") {
            leaveExpeditionPrepare();
            return;
          }
          closeExpeditionDrawer();
        });
      }
      if (expClose) {
        expClose.addEventListener("click", () => {
          playSound("button");
          closeExpeditionDrawer({ skipHubReturn: true });
        });
      }
      const expRoot = document.getElementById("expeditions-root");
      if (expRoot && !expRoot.dataset.claimDelegate) {
        expRoot.dataset.claimDelegate = "1";
        expRoot.addEventListener("click", (ev) => {
          const btn = ev.target.closest('[data-action="claim-expedition"]');
          if (!btn || !expRoot.contains(btn)) return;
          ev.preventDefault();
          ev.stopPropagation();
          const idx = safeNumber(btn.dataset.slotIndex, NaN);
          if (!Number.isFinite(idx)) return;
          const res = claimExpedition(idx);
          if (res && res.ok) renderExpeditions();
        });
      }
      bindExpeditionRewardsTipDelegates();
      updateExpeditionButtonIndicator();
      document.getElementById("team-close").addEventListener("click", () => toggleTeamDrawer(false));
      document.getElementById("dragon-detail-modal").addEventListener("click", (e) => {
        if (e.target.id === "dragon-detail-modal") closeDragonDetail();
      });
      const histClose = document.getElementById("btn-close-history");
      if (histClose) {
        histClose.addEventListener("click", () => {
          document.getElementById("history-modal").classList.add("hidden");
        });
      }

      document.getElementById("btn-close-pool").addEventListener("click", () => {
        document.getElementById("pool-modal").classList.add("hidden");
      });

      document.getElementById("btn-save").addEventListener("click", () => saveGame(false));
      const eventsBtn = document.getElementById("btn-open-events");
      if (eventsBtn) {
        eventsBtn.addEventListener("click", () => {
          playSound("button");
          switchPanel("events");
        });
      }
      const chestsBtn = document.getElementById("btn-open-chests");
      if (chestsBtn) chestsBtn.addEventListener("click", onRegularChestClick);
      const chestsClose = document.getElementById("btn-close-chests");
      if (chestsClose) chestsClose.addEventListener("click", closeChestModal);
      document.getElementById("chest-modal").addEventListener("click", (e) => {
        if (e.target.id === "chest-modal") closeChestModal();
      });
      const chestOpenBtn = document.getElementById("btn-chest-open");
      if (chestOpenBtn) chestOpenBtn.addEventListener("click", openSelectedChest);
      const chestOk = document.getElementById("btn-chest-reveal-ok");
      if (chestOk) chestOk.addEventListener("click", closeChestReveal);
      const chestAgain = document.getElementById("btn-chest-open-again");
      if (chestAgain) {
        chestAgain.addEventListener("click", () => {
          if (isOpeningChest || !lastChestOpen) return;
          startChestOpening(lastChestOpen.zoneId, lastChestOpen.chestType);
        });
      }
      const chestReveal = document.getElementById("chest-reveal-modal");
      if (chestReveal) {
        chestReveal.addEventListener("click", (e) => {
          if (e.target.id !== "chest-reveal-modal") return;
          const ok = document.getElementById("btn-chest-reveal-ok");
          if (ok && !ok.hidden) closeChestReveal();
        });
      }
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
      }
      document.getElementById("btn-export").addEventListener("click", exportSave);
      document.getElementById("btn-import").addEventListener("click", importSave);
      document.getElementById("btn-reset").addEventListener("click", resetGame);

      document.getElementById("toggle-sfx").addEventListener("click", () => {
        gameState.soundEnabled = !gameState.soundEnabled;
        updateAudioToggles();
        AudioManager.applySfxVolume();
        saveGame(true);
      });

      /**
       * Sliders volume : appliquer sur `input` (mobile/tactile).
       * Ne pas rappeler updateAudioToggles() pendant le drag —
       * réécrire input.value casse le geste sur iOS/Android.
       */
      const bindVol = (id, key) => {
        const el = document.getElementById(id);
        if (!el) return;
        const label = document.getElementById(id + "-val");
        const applyFromSlider = () => {
          const raw = Number(el.value);
          const pct = Number.isFinite(raw) ? raw : 0;
          const v = Math.max(0, Math.min(1, pct / 100));
          gameState[key] = v;
          if (label) label.textContent = String(Math.round(v * 100));
          if (key === "masterVolume" || key === "musicVolume") {
            AudioManager.applyMusicVolume({ fromUser: true });
          }
          if (key === "masterVolume" || key === "sfxVolume") {
            AudioManager.applySfxVolume();
          }
        };
        el.addEventListener("input", applyFromSlider);
        el.addEventListener("change", () => {
          applyFromSlider();
          saveGame(true);
        });
      };
      bindVol("vol-master", "masterVolume");
      bindVol("vol-sfx", "sfxVolume");
      bindVol("vol-music", "musicVolume");

      document.getElementById("toggle-music").addEventListener("click", () => {
        gameState.musicEnabled = !gameState.musicEnabled;
        updateAudioToggles();
        applyMusicSetting();
        saveGame(true);
      });

      window.addEventListener("beforeunload", () => {
        saveGame(true);
      });

      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") {
          saveGame(true);
        } else {
          lastFrameTime = performance.now();
          updateRegularChestUI();
          checkDailyContractsRollover();
        }
      });
    }

    /* -------------------------------------------------------
       INIT
       ------------------------------------------------------- */
    function init() {
      initSparks();
      if (window.DCAnim && DCAnim.initParticles) DCAnim.initParticles();
      bindEvents();

      const loaded = loadGame();

      syncActiveEggFromZoneSelection();
      ensureSeasonalEventZones();

      /* Scène critique après load : uniquement la zone active. */
      preloadEggProgressImages();

      if (!gameState.introSeen) {
        document.getElementById("intro-modal").classList.remove("hidden");
      } else {
        document.getElementById("intro-modal").classList.add("hidden");
      }

      calculateProduction();
      ensureExpeditionState();
      {
        const beforeKey =
          gameState.expeditions &&
          gameState.expeditions.dailyContracts &&
          gameState.expeditions.dailyContracts.dateKey;
        ensureDailyContracts(false);
        const afterKey =
          gameState.expeditions &&
          gameState.expeditions.dailyContracts &&
          gameState.expeditions.dailyContracts.dateKey;
        if (afterKey && afterKey !== beforeKey) saveGame(true);
      }
      updateExpeditionHubBadges();
      ensureInventory();
      ensureChestInventory();
      ensureEggBossSystem();
      updateInventoryBadge();
      applyEggScene(getEquippedEggDef());
      renderEgg();
      renderEggPicker();
      updateEggCarouselPeer();
      restoreEggBossUiAfterLoad();
      scheduleUpdateGameCenterAxis();
      /* Haute priorité : warm thumbs 1er viewport — DOM Dragons au 1er open (dirty). */
      warmDragonsFirstViewport("all", DRAGONS_VIEWPORT_WARM);
      renderAllStatic();
      scheduleUpdateGameCenterAxis();
      updateAudioToggles();
      startRegularChestTicker();
      AudioManager.ensureEggCrack();
      AudioManager.ensureDragonRevealSounds();
      AudioManager.startMusic({ fade: true });
      if (!AudioManager.musicStarted) {
        AudioManager.bindMusicGestureOnce();
      }

      /* Si le warm critique finit juste après le premier paint : re-lier les PNG prêts (pas de full menu). */
      raceWarmDragonsViewport("all", DRAGONS_VIEWPORT_WARM, DRAGONS_WARM_WAIT_MS)
        .then(function () {
          const grid = document.getElementById("dragons-grid");
          if (!grid) return;
          grid.querySelectorAll("img[data-asset-src], img[src]").forEach(function (img) {
            const tile = img.closest(".dragon-tile");
            if (!tile || tile.classList.contains("undiscovered")) return;
            const src = img.getAttribute("src") || img.dataset.assetSrc;
            if (!src || !window.DCAssets || !DCAssets.isLoaded(src)) return;
            const emoji = tile.querySelector(".dc-emoji");
            delete img.dataset.assetSrc;
            loadAssetImage(img, emoji, src, { silhouette: false });
          });
        })
        .catch(function () { /* ignore */ });

      /* Warmup idle : reste des portraits découverts — pas les scènes des autres zones. */
      const startWarmup = () => {
        try {
          scheduleSessionAssetWarmup();
        } catch (e) {
          console.warn("[Asset] warmup idle échoué", e);
        }
      };
      if (typeof requestIdleCallback === "function") {
        requestIdleCallback(startWarmup, { timeout: 2200 });
      } else {
        setTimeout(startWarmup, 120);
      }

      /* Offline progress after load (only if intro already seen).
         Apply immediately, then show info modal — prevents loss on close
         and prevents duplicate gains on refresh. */
      if (loaded && gameState.introSeen) {
        const offline = calculateOfflineProgress();
        if (offline) {
          applyOfflineProgress(offline);
          showOfflineModal(offline);
        } else {
          gameState.lastSaveTime = Date.now();
          saveGame(true);
        }
      }

      setInterval(() => saveGame(true), AUTO_SAVE_MS);

      /* Autre onglet a reset / avancé la révision → resync (évite Z3 “fantôme”).
         Si un onglet périmé réécrit une save plus ancienne (LEGACY / Z3),
         on réaffirme immédiatement notre état plutôt que de laisser le poison. */
      window.addEventListener("storage", (ev) => {
        if (ev.key !== SAVE_KEY) return;
        if (ev.newValue == null) {
          location.reload();
          return;
        }
        try {
          const incoming = JSON.parse(ev.newValue);
          const incomingRev = safeNumber(incoming && incoming.progressRevision, 0);
          if (incomingRev > progressRevision) {
            location.reload();
          } else if (incomingRev < progressRevision) {
            saveGame(true);
          }
        } catch (e) { /* ignore */ }
      });

      lastFrameTime = performance.now();
      requestAnimationFrame(updateGame);

      window.resetDragonClickerProgress = resetDragonClickerProgress;
      window.getZone1BalanceReport = getZone1BalanceReport;
      window.calculateGlobalStats = calculateGlobalStats;
      window.recalculateGlobalStats = recalculateGlobalStats;
      window.calculateZoneEssencePerSecond = calculateZoneEssencePerSecond;

      /* Expose for modules / helpers that look up window.AudioManager (ex: coffres). */
      window.AudioManager = AudioManager;

      window.DragonClicker = {
        getState: () => gameState,
        saveGame,
        loadGame,
        resetDragonClickerProgress,
        getInventoryQuantity,
        addInventoryItem,
        removeInventoryItem,
        hasInventoryItem,
        ensureInventory,
        getZone1BalanceReport,
        getZone1Completion,
        formatNumber,
        rollDragonFromEgg,
        setSceneBackground,
        SCENE_BACKGROUNDS,
        PRODUCER_DEFS,
        ACTIVE_UPGRADE_DEFS,
        SHOP_PASSIVE_DEFS,
        LEVEL_PASSIVE_DEFS,
        SPECIAL_UPGRADE_DEFS,
        ACHIEVEMENT_DEFS,
        ACHIEVEMENT_CATEGORIES,
        EGG_DEFS,
        DRAGON_DEFS,
        ZONE_DEFS,
        ZONE_MAP_POSITIONS,
        WORLD_MAP_IMAGE,
        WORLD_MAP_PAGES,
        EXPEDITION_DEFS,
        RARITIES,
        FUTURE,
        markDragonDiscovered,
        startExpedition,
        claimExpedition,
        calculateDragonExpeditionPower,
        calculateExpeditionTeamPower,
        calculateSuccessChance,
        calculateDragonPower,
        getPlayerDragonPower,
        addEssence,
        spendEssence,
        getBusyExpeditionRun,
        isDragonOnExpedition,
        isDragonAvailableForExpedition,
        getDragonAvailability,
        renderExpeditions,
        tickExpeditions,
        AudioManager,
        playSound
      };
    }

    init();
  })();
  