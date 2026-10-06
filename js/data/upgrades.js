/**
 * Dragon Clicker
 * Producteurs, passifs boutique, améliorations et rangs de zone.
 */
"use strict";

var MAX_ACTIVE_LEVEL = 30;

var PRODUCER_DEFS = [
      {
        id: "hatchling",
        name: "Dragonneau",
        icon: "🐲",
        description: "Un jeune dragon qui génère un peu de puissance passive.",
        baseCost: 85,
        costGrowth: 1.165,
        productionPerLevel: 0.4,
        baseProduction: 0.4,
        maxProduction: 8,
        maxLevel: 20,
        productionCurve: "linear",
        tier: 1,
        zoneId: "sanctuary"
      },
      {
        id: "nest",
        name: "Nid draconique",
        icon: "🪺",
        description: "Un nid accueillant qui accélère l'économie passive.",
        baseCost: 420,
        costGrowth: 1.185,
        productionPerLevel: 20 / 15,
        baseProduction: 20 / 15,
        maxProduction: 20,
        maxLevel: 15,
        productionCurve: "linear",
        tier: 2,
        zoneId: "sanctuary"
      },
      {
        id: "sanctuaryHall",
        name: "Sanctuaire draconique",
        icon: "🛕",
        description: "Autel baigné de magie ancienne du Sanctuaire.",
        baseCost: 2100,
        costGrowth: 1.20,
        productionPerLevel: 3.5,
        baseProduction: 3.5,
        maxProduction: 42,
        maxLevel: 12,
        productionCurve: "linear",
        tier: 3,
        zoneId: "sanctuary"
      },
      {
        id: "fireDragon",
        name: "Tour draconique",
        icon: "🗼",
        description: "Une tour qui canalise l'énergie draconique du sanctuaire.",
        baseCost: 6000,
        costGrowth: 1.195,
        productionPerLevel: 10,
        baseProduction: 10,
        maxProduction: 80,
        maxLevel: 8,
        productionCurve: "linear",
        tier: 4,
        zoneId: "sanctuary"
      },
      {
        id: "fortress",
        name: "Forteresse draconique",
        icon: "🏰",
        description: "Le cœur économique de votre empire draconique.",
        baseCost: 15000,
        costGrowth: 1.21,
        productionPerLevel: 32,
        baseProduction: 32,
        maxProduction: 160,
        maxLevel: 5,
        productionCurve: "linear",
        tier: 5,
        zoneId: "sanctuary"
      },
      /* Zone 2 — Vallée : ~1h principale à 6–7 CPS (production inchangée). */
      {
        id: "valleyCub",
        name: "Dragonnet de vallée",
        icon: "🐉",
        description: "Plus vif que les dragonneaux du Sanctuaire.",
        baseCost: 380,
        costGrowth: 1.12,
        productionPerLevel: 1.2,
        baseProduction: 1.2,
        maxProduction: 30,
        maxLevel: 25,
        productionCurve: "linear",
        tier: 1,
        zoneId: "valley"
      },
      {
        id: "valleyNest",
        name: "Nid de vallée",
        icon: "🪺",
        description: "Nids tissés dans les collines fertiles.",
        baseCost: 1600,
        costGrowth: 1.145,
        productionPerLevel: 3.5,
        baseProduction: 3.5,
        maxProduction: 70,
        maxLevel: 20,
        productionCurve: "linear",
        tier: 2,
        zoneId: "valley"
      },
      {
        id: "valleySpire",
        name: "Aiguille de vallée",
        icon: "🏔️",
        description: "Une aiguille de pierre qui concentre le flux draconique.",
        baseCost: 5200,
        costGrowth: 1.21,
        productionPerLevel: 10,
        baseProduction: 10,
        maxProduction: 150,
        maxLevel: 15,
        productionCurve: "linear",
        tier: 3,
        zoneId: "valley"
      },
      {
        id: "valleyKeep",
        name: "Donjon de vallée",
        icon: "🏯",
        description: "Forteresse avancée de la Vallée draconique.",
        baseCost: 19500,
        costGrowth: 1.24,
        productionPerLevel: 24,
        baseProduction: 24,
        maxProduction: 240,
        maxLevel: 10,
        productionCurve: "linear",
        tier: 4,
        zoneId: "valley"
      },
      {
        id: "valleyCitadel",
        name: "Citadelle de vallée",
        icon: "🛡️",
        description: "Le joyau économique de la Vallée.",
        baseCost: 48000,
        costGrowth: 1.31,
        productionPerLevel: 340 / 7,
        baseProduction: 340 / 7,
        maxProduction: 340,
        maxLevel: 7,
        productionCurve: "linear",
        tier: 5,
        zoneId: "valley"
      },
      /* Zone 3 — Montagne sauvage : courbe progressive (base→max, EXP 1.35). Maxima inchangés. */
      {
        id: "graniteNest",
        name: "Nid de Granit",
        icon: "🪨",
        description: "Nids de pierre ambrée nichés dans les failles.",
        baseCost: 4200,
        costGrowth: 1.062,
        productionPerLevel: 4,
        baseProduction: 4,
        maxProduction: 100,
        maxLevel: 25,
        productionCurve: "progressive",
        tier: 1,
        zoneId: "mountains"
      },
      {
        id: "amberRefuge",
        name: "Refuge d'Ambre",
        icon: "🔶",
        description: "Abri de cristal d'ambre où l'essence s'accumule.",
        baseCost: 12500,
        costGrowth: 1.082,
        productionPerLevel: 10,
        baseProduction: 10,
        maxProduction: 200,
        maxLevel: 20,
        productionCurve: "progressive",
        tier: 2,
        zoneId: "mountains"
      },
      {
        id: "cliffSanctuary",
        name: "Sanctuaire des Falaises",
        icon: "🏔️",
        description: "Autel sculpté dans la falaise, baigné de vents anciens.",
        baseCost: 42000,
        costGrowth: 1.10,
        productionPerLevel: 25,
        baseProduction: 25,
        maxProduction: 375,
        maxLevel: 15,
        productionCurve: "progressive",
        tier: 3,
        zoneId: "mountains"
      },
      {
        id: "peakTower",
        name: "Tour des Cimes",
        icon: "🗼",
        description: "Tour dressée sur les crêtes, capte le flux des sommets.",
        baseCost: 125000,
        costGrowth: 1.15,
        productionPerLevel: 60,
        baseProduction: 60,
        maxProduction: 600,
        maxLevel: 10,
        productionCurve: "progressive",
        tier: 4,
        zoneId: "mountains"
      },
      {
        id: "stormBastion",
        name: "Bastion des Tempêtes",
        icon: "⛈️",
        description: "Forteresse orageuse — cœur économique de la Montagne.",
        baseCost: 330000,
        costGrowth: 1.205,
        productionPerLevel: 130,
        baseProduction: 130,
        maxProduction: 910,
        maxLevel: 7,
        productionCurve: "progressive",
        tier: 5,
        zoneId: "mountains"
      },
      /* Zone 4 — Royaume oublié : courbe progressive (base→max, EXP 1.35). */
      {
        id: "forgottenNest",
        name: "Nid oublié",
        icon: "🪺",
        description: "Un nid enseveli sous la poussière des royaumes disparus.",
        baseCost: 40000,
        costGrowth: 1.035,
        productionPerLevel: 50,
        baseProduction: 50,
        maxProduction: 600,
        maxLevel: 20,
        productionCurve: "progressive",
        tier: 1,
        zoneId: "zone4"
      },
      {
        id: "relicVault",
        name: "Crypte des Reliques",
        icon: "📦",
        description: "Coffres scellés où l'essence des ancêtres s'accumule encore.",
        baseCost: 90000,
        costGrowth: 1.05,
        productionPerLevel: 120,
        baseProduction: 120,
        maxProduction: 1500,
        maxLevel: 15,
        productionCurve: "progressive",
        tier: 2,
        zoneId: "zone4"
      },
      {
        id: "arcaneSanctum",
        name: "Sanctuaire Arcanique",
        icon: "🔮",
        description: "Autel de runes éteintes, réveillé par le flux draconique.",
        baseCost: 200000,
        costGrowth: 1.07,
        productionPerLevel: 300,
        baseProduction: 300,
        maxProduction: 3200,
        maxLevel: 10,
        productionCurve: "progressive",
        tier: 3,
        zoneId: "zone4"
      },
      {
        id: "voidSpire",
        name: "Flèche du Néant",
        icon: "🗼",
        description: "Une flèche d'ombre qui canalise le vide ancien.",
        baseCost: 450000,
        costGrowth: 1.10,
        productionPerLevel: 650,
        baseProduction: 650,
        maxProduction: 6000,
        maxLevel: 7,
        productionCurve: "progressive",
        tier: 4,
        zoneId: "zone4"
      },
      {
        id: "forgottenCitadel",
        name: "Citadelle du Royaume oublié",
        icon: "🏰",
        description: "Cœur économique des ruines — dernier bastion du Royaume oublié.",
        baseCost: 900000,
        costGrowth: 1.13,
        productionPerLevel: 1400,
        baseProduction: 1400,
        maxProduction: 10000,
        maxLevel: 5,
        productionCurve: "progressive",
        tier: 5,
        zoneId: "zone4"
      }
    ];

var SHOP_PASSIVE_DEFS = [
      {
        id: "thriftyNest",
        name: "Nids Économes",
        icon: "💰",
        description: "Coût des producteurs −5 %",
        cost: 4800,
        zoneId: "sanctuary",
        effect: { type: "producerCostMult", value: 0.95 }
      },
      {
        id: "fragmentSense",
        name: "Sens des Fragments",
        icon: "🧩",
        description: "Fragments gagnés +10 %",
        cost: 7200,
        zoneId: "sanctuary",
        effect: { type: "fragmentMult", value: 0.10 }
      }
    ];

var LEVEL_PASSIVE_DEFS = [
      {
        id: "ancestralReserve",
        name: "Réserve hors-ligne",
        icon: "⏳",
        zoneId: "sanctuary",
        maxLevel: 3,
        /* Coûts fixes par palier (niv.0→1, 1→2, 2→3) — total 310K */
        costs: [25000, 85000, 200000],
        description: "Prolonge la durée maximale hors ligne (base 1 h, max 4 h)."
      },
      {
        id: "dragonWatch",
        name: "Efficacité hors-ligne",
        icon: "🌙",
        zoneId: "sanctuary",
        maxLevel: 4,
        /* Coûts fixes par palier (niv.0→1 … 3→4) — total 440K */
        costs: [20000, 50000, 120000, 250000],
        description: "Améliore le rendement hors ligne (base 5 %, max 15 %)."
      }
    ];

var SPECIAL_UPGRADE_DEFS = [
      /* critAwakening (Éveil Critique) retiré — anciennes saves peuvent encore
         contenir specialUpgrades.critAwakening ; ignoré au load, effet non appliqué. */
      {
        id: "ancestralBreath",
        name: "Souffle Ancestral",
        icon: "💨",
        zoneId: "sanctuary",
        cost: 2200,
        description: "+10 % production passive globale.",
        effect: { type: "globalProdPct", value: 0.10 },
        unlock: { type: "producerOwned", producerId: "sanctuaryHall", value: 1 }
      },
      {
        id: "hunterInstinct",
        name: "Instinct du Chasseur",
        icon: "🎯",
        zoneId: "sanctuary",
        cost: 3600,
        description: "+2 % rendement de fragments (accumulateur).",
        effect: { type: "fragmentYield", value: 0.02 },
        unlock: { type: "zoneDragons", zoneId: "sanctuary", value: 2 }
      },
      {
        id: "eggResonance",
        name: "Résonance de l'Œuf",
        icon: "🥚",
        zoneId: "sanctuary",
        cost: 5200,
        description: "+5 % progression d'éclosion sur les clics manuels.",
        effect: { type: "eggProgressPct", value: 0.05 },
        unlock: { type: "eggsHatched", value: 2 }
      },
      {
        id: "sanctuaryLegacy",
        name: "Héritage du Sanctuaire",
        icon: "🏛️",
        zoneId: "sanctuary",
        cost: 22000,
        description: "+5 % clic manuel et +5 % production passive.",
        effect: { type: "heritage", clickPct: 0.05, prodPct: 0.05 },
        unlock: { type: "producerOwned", producerId: "fortress", value: 1 }
      },
      {
        id: "expeditionCamp",
        name: "Camp d'expédition",
        icon: "⛺",
        zoneId: "sanctuary",
        cost: 15000,
        description: "Débloque définitivement le système d'expéditions.",
        effect: { type: "unlockExpeditions" },
        unlock: null,
        hideFromShop: true
      }
    ];

var ZONE_RANK_META = [
      {
        zoneId: "sanctuary", rank: "Novice", order: 1,
        names: {
          claws: "Griffes du Novice",
          instinct: "Instinct du Novice",
          bite: "Morsure du Novice",
          fervor: "Force Draconique"
        },
        clawsCurve: "noviceSteps15",
        clickFlatPerLevel: 0,
        critChance: 0.002, critMult: 0.12,
        fervorPower: 0, fervorDuration: 0,
        /* Force Draconique : 3 paliers lourds de puissance de clic (totaux cumulés). */
        heavyClickFlat: true,
        clickPowerFlatValues: [2, 5, 8],
        clickPowerFlatCosts: [10000, 20000, 38000],
        icons: { fervor: "💪" },
        /* Prix Z1 — bonus inchangés ; ~1h principale à 6–7 CPS. */
        baseCosts: { claws: 200, instinct: 1200, bite: 5500, fervor: 10000 },
        costGrowth: 1.22,
        familyGrowth: { claws: 1.22, instinct: 1.25, bite: 1.27, fervor: 1 },
        maxLevels: { claws: 15, instinct: 10, bite: 5, fervor: 3 }
      },
      {
        zoneId: "valley", rank: "Éveillé", order: 2,
        /* Zone 2 : effets inchangés, prix ~1h principale à 6–7 CPS. */
        customActiveUpgrades: [
          {
            id: "claws_valley",
            family: "claws",
            name: "Griffes de la Vallée",
            icon: "✊",
            maxLevel: 20,
            bonusType: "clickPowerFlat",
            /* +0.9 / niveau → +18 au max */
            bonusValues: [
              0.9, 1.8, 2.7, 3.6, 4.5, 5.4, 6.3, 7.2, 8.1, 9,
              9.9, 10.8, 11.7, 12.6, 13.5, 14.4, 15.3, 16.2, 17.1, 18
            ],
            baseCost: 4600,
            costGrowth: 1.17,
            uiOrder: 1
          },
          {
            id: "force_valley",
            family: "force",
            name: "Force Élémentaire",
            icon: "💪",
            maxLevel: 5,
            bonusType: "clickPowerFlat",
            bonusValues: [4, 8, 12, 16, 20],
            baseCost: 45000,
            costGrowth: 1.44,
            uiOrder: 2
          },
          {
            id: "instinct_valley",
            family: "instinct",
            name: "Instinct Sauvage",
            icon: "👁️",
            maxLevel: 12,
            bonusType: "critChanceFlat",
            /* Points de % → fractions (0.15 % = 0.0015 … 2 % = 0.02). */
            bonusValues: [
              0.0015, 0.003, 0.0045, 0.006, 0.0075, 0.009,
              0.011, 0.013, 0.015, 0.017, 0.0185, 0.02
            ],
            baseCost: 9500,
            costGrowth: 1.24,
            uiOrder: 3
          },
          {
            id: "bite_valley",
            family: "bite",
            name: "Morsure Élémentaire",
            icon: "💥",
            maxLevel: 8,
            bonusType: "critMultiplierFlat",
            bonusValues: [0.10, 0.20, 0.30, 0.40, 0.50, 0.60, 0.68, 0.75],
            baseCost: 18500,
            costGrowth: 1.32,
            uiOrder: 4
          },
          {
            id: "charged_valley",
            family: "charged",
            name: "Frappe Chargée",
            icon: "⚡",
            maxLevel: 6,
            bonusType: "chargedStrike",
            triggerClicks: [25, 22, 18, 15, 12, 10],
            multiplier: 2,
            baseCost: 26000,
            costGrowth: 1.51,
            uiOrder: 5
          },
          {
            id: "twin_valley",
            family: "twin",
            name: "Éclosion Jumelle",
            icon: "✨",
            maxLevel: 5,
            bonusType: "twinHatchChance",
            /* Valeurs en pourcent (0.2 … 1.0) — converties en fraction au jet. Contenu facultatif. */
            bonusValues: [0.2, 0.4, 0.6, 0.8, 1.0],
            baseCost: 85000,
            costGrowth: 1.45,
            uiOrder: 6
          }
        ]
      },
      /* Zone 3 — Montagne sauvage : Griffes progressives (cumul → +40) ; Force déjà progressive. */
      {
        zoneId: "mountains", rank: "Adepte", order: 3,
        customActiveUpgrades: [
          {
            id: "claws_mountains",
            family: "claws",
            name: "Griffes de Granit",
            icon: "✊",
            maxLevel: 20,
            bonusType: "clickPowerFlat",
            /* Totaux cumulés progressifs (~+1.2 … ~+2.8) → +40 au max */
            bonusValues: [
              1.2, 2.5, 3.9, 5.4, 6.9, 8.5, 10.2, 12, 13.9, 15.9,
              17.9, 20, 22.2, 24.5, 26.9, 29.4, 31.9, 34.5, 37.2, 40
            ],
            baseCost: 16500,
            costGrowth: 1.148,
            uiOrder: 1
          },
          {
            id: "force_mountains",
            family: "force",
            name: "Force des Sommets",
            icon: "💪",
            maxLevel: 5,
            bonusType: "clickPowerFlat",
            bonusValues: [5, 11, 18, 26, 35],
            baseCost: 125000,
            costGrowth: 1.48,
            uiOrder: 2
          },
          {
            id: "instinct_mountains",
            family: "instinct",
            name: "Instinct Tempétueux",
            icon: "👁️",
            maxLevel: 10,
            bonusType: "critChanceFlat",
            /* +0,15 point de % / niveau → +1,5 % au max */
            bonusValues: [
              0.0015, 0.003, 0.0045, 0.006, 0.0075,
              0.009, 0.0105, 0.012, 0.0135, 0.015
            ],
            baseCost: 42000,
            costGrowth: 1.25,
            uiOrder: 3
          },
          {
            id: "bite_mountains",
            family: "bite",
            name: "Morsure du Titan",
            icon: "💥",
            maxLevel: 8,
            bonusType: "critMultiplierFlat",
            /* +0,125 / niveau → +1,00 au max */
            bonusValues: [0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1.0],
            baseCost: 66000,
            costGrowth: 1.28,
            uiOrder: 4
          },
          {
            id: "breath_mountains",
            family: "breath",
            name: "Souffle des Cimes",
            icon: "🌬️",
            maxLevel: 5,
            bonusType: "globalProdPct",
            /* Valeurs totales en points de % → +10 % production passive au max */
            bonusValues: [2, 4, 6, 8, 10],
            baseCost: 165000,
            costGrowth: 1.45,
            uiOrder: 5
          },
          {
            id: "twin_mountains",
            family: "twin",
            name: "Écho des Tempêtes",
            icon: "✨",
            maxLevel: 5,
            bonusType: "twinHatchChance",
            /* S'ajoute à Éclosion Jumelle Z2 (valeurs en %) */
            bonusValues: [0.2, 0.4, 0.6, 0.8, 1.0],
            baseCost: 250000,
            costGrowth: 1.36,
            uiOrder: 6
          }
        ]
      },
      /* Zone 4 — Royaume oublié : tables progressives (cumuls). Cap crit/twin globaux inchangés. */
      {
        zoneId: "zone4", rank: "Vétéran", order: 4,
        customActiveUpgrades: [
          {
            id: "claws_forgotten",
            family: "claws",
            name: "Griffes oubliées",
            icon: "✊",
            maxLevel: 20,
            bonusType: "clickPowerFlat",
            /* Totaux cumulés progressifs → +120 au max */
            bonusValues: [
              3, 6.3, 9.9, 13.9, 18.2, 22.7, 27.6, 32.8, 38.4, 44.2,
              50.4, 56.8, 63.6, 70.7, 78.2, 85.9, 93.9, 102.3, 111, 120
            ],
            baseCost: 45000,
            costGrowth: 1.14,
            uiOrder: 1
          },
          {
            id: "force_forgotten",
            family: "force",
            name: "Force des Reliques",
            icon: "💪",
            maxLevel: 5,
            bonusType: "clickPowerFlat",
            bonusValues: [18, 40, 67, 99, 135],
            baseCost: 220000,
            costGrowth: 1.45,
            uiOrder: 2
          },
          {
            id: "instinct_forgotten",
            family: "instinct",
            name: "Instinct Arcanique",
            icon: "👁️",
            maxLevel: 10,
            bonusType: "critChanceFlat",
            /* Points de % → fractions (0.2 % = 0.002 … 2 % = 0.02). Cap global inchangé. */
            bonusValues: [
              0.002, 0.004, 0.006, 0.008, 0.01,
              0.012, 0.014, 0.016, 0.018, 0.02
            ],
            baseCost: 75000,
            costGrowth: 1.24,
            uiOrder: 3
          },
          {
            id: "bite_forgotten",
            family: "bite",
            name: "Morsure du Néant",
            icon: "💥",
            maxLevel: 8,
            bonusType: "critMultiplierFlat",
            bonusValues: [0.15, 0.31, 0.48, 0.66, 0.85, 1.05, 1.27, 1.5],
            baseCost: 120000,
            costGrowth: 1.28,
            uiOrder: 4
          },
          {
            id: "breath_forgotten",
            family: "breath",
            name: "Souffle des Arcanes",
            icon: "🌬️",
            maxLevel: 5,
            bonusType: "globalProdPct",
            /* Points de % totaux → +20 % production passive au max */
            bonusValues: [3, 6.5, 10.5, 15, 20],
            baseCost: 300000,
            costGrowth: 1.40,
            uiOrder: 5
          },
          {
            id: "echo_forgotten",
            family: "twin",
            name: "Écho du Royaume",
            icon: "✨",
            maxLevel: 5,
            bonusType: "twinHatchChance",
            /* Même unité que Z2/Z3 (points de %) — cap Twin global inchangé */
            bonusValues: [0.1, 0.2, 0.3, 0.4, 0.5],
            baseCost: 450000,
            costGrowth: 1.34,
            uiOrder: 6
          }
        ]
      },
      {
        zoneId: "royal", rank: "Maître", order: 5,
        names: {
          claws: "Griffes du Maître",
          instinct: "Instinct du Maître",
          bite: "Morsure du Maître",
          fervor: "Ferveur du Maître"
        },
        clickFlatPerLevel: 0.65,
        critChance: 0.0022, critMult: 0.1,
        fervorPower: 0.04, fervorDuration: 65,
        baseCosts: { claws: 1.5e7, instinct: 2.5e7, bite: 3.5e7, fervor: 2.8e7 },
        costGrowth: 1.195
      },
      {
        zoneId: "ruins", rank: "Ancien", order: 6,
        names: {
          claws: "Griffes Anciennes",
          instinct: "Instinct Ancien",
          bite: "Morsure Ancienne",
          fervor: "Ferveur Ancienne"
        },
        clickFlatPerLevel: 0.75,
        critChance: 0.0024, critMult: 0.115,
        fervorPower: 0.045, fervorDuration: 70,
        baseCosts: { claws: 1.8e8, instinct: 3e8, bite: 4.2e8, fervor: 3.4e8 },
        costGrowth: 1.2
      },
      {
        zoneId: "peaks", rank: "Ascendant", order: 7,
        names: {
          claws: "Griffes Ascendantes",
          instinct: "Instinct Ascendant",
          bite: "Morsure Ascendante",
          fervor: "Ferveur Ascendante"
        },
        clickFlatPerLevel: 0.85,
        critChance: 0.0026, critMult: 0.13,
        fervorPower: 0.05, fervorDuration: 75,
        baseCosts: { claws: 2.2e9, instinct: 3.5e9, bite: 5e9, fervor: 4e9 },
        costGrowth: 1.205
      },
      {
        zoneId: "celestial", rank: "Céleste", order: 8,
        names: {
          claws: "Griffes Célestes",
          instinct: "Instinct Céleste",
          bite: "Morsure Céleste",
          fervor: "Ferveur Céleste"
        },
        clickFlatPerLevel: 1.0,
        critChance: 0.0028, critMult: 0.145,
        fervorPower: 0.055, fervorDuration: 80,
        baseCosts: { claws: 2.8e10, instinct: 4.5e10, bite: 6e10, fervor: 5e10 },
        costGrowth: 1.21
      },
      {
        zoneId: "primordial", rank: "Primordial", order: 9,
        names: {
          claws: "Griffes Primordiales",
          instinct: "Instinct Primordial",
          bite: "Morsure Primordiale",
          fervor: "Ferveur Primordiale"
        },
        clickFlatPerLevel: 1.15,
        critChance: 0.003, critMult: 0.16,
        fervorPower: 0.06, fervorDuration: 85,
        baseCosts: { claws: 3.5e11, instinct: 5.5e11, bite: 7.5e11, fervor: 6.2e11 },
        costGrowth: 1.215
      },
      {
        zoneId: "divine", rank: "Divin", order: 10,
        names: {
          claws: "Griffes Divines",
          instinct: "Instinct Divin",
          bite: "Morsure Divine",
          fervor: "Ferveur Divine"
        },
        clickFlatPerLevel: 1.3,
        critChance: 0.0032, critMult: 0.175,
        fervorPower: 0.065, fervorDuration: 90,
        baseCosts: { claws: 4.5e12, instinct: 7e12, bite: 9.5e12, fervor: 8e12 },
        costGrowth: 1.22
      }
    ];

var FAMILY_META = {
      claws: { icon: "✊", label: "Puissance de clic", short: "Clic" },
      instinct: { icon: "👁️", label: "Chance critique", short: "Critique %" },
      bite: { icon: "💥", label: "Multiplicateur critique", short: "Crit ×" },
      fervor: { icon: "🔥", label: "Ferveur / Combo", short: "Combo" }
    };

var ACTIVE_UPGRADE_DEFS = (function buildActiveUpgrades() {
      const out = [];
      const families = ["claws", "instinct", "bite", "fervor"];
      ZONE_RANK_META.forEach((z) => {
        if (Array.isArray(z.customActiveUpgrades) && z.customActiveUpgrades.length) {
          z.customActiveUpgrades.forEach((raw) => {
            out.push(Object.assign({
              zoneId: z.zoneId,
              rank: z.rank,
              clawsCurve: null,
              fervorCurve: null,
              clickFlatPerLevel: 0,
              critChance: 0,
              critMult: 0,
              fervorPower: 0,
              fervorDuration: 0,
              costs: null,
              bonusValues: null,
              triggerClicks: null,
              multiplier: 1,
              uiOrder: 99
            }, raw));
          });
          return;
        }
        families.forEach((fam) => {
          const rawMax = z.maxLevels && z.maxLevels[fam];
          const maxLevel = Math.max(1, Math.floor(Number(rawMax) || MAX_ACTIVE_LEVEL));
          const heavyFlat = fam === "fervor" && z.heavyClickFlat
            && Array.isArray(z.clickPowerFlatValues) && z.clickPowerFlatValues.length;
          const flatValues = heavyFlat ? z.clickPowerFlatValues.slice() : null;
          const flatCosts = heavyFlat && Array.isArray(z.clickPowerFlatCosts)
            ? z.clickPowerFlatCosts.slice()
            : null;
          out.push({
            id: fam + "_" + z.zoneId,
            zoneId: z.zoneId,
            family: fam,
            rank: z.rank,
            name: z.names[fam],
            icon: (z.icons && z.icons[fam]) || FAMILY_META[fam].icon,
            maxLevel: heavyFlat && flatValues ? flatValues.length : maxLevel,
            baseCost: z.baseCosts[fam],
            costGrowth: (z.familyGrowth && z.familyGrowth[fam]) || z.costGrowth,
            costs: flatCosts,
            clawsCurve: fam === "claws" ? (z.clawsCurve || null) : null,
            fervorCurve: fam === "fervor" && !heavyFlat ? (z.fervorCurve || null) : null,
            bonusType: heavyFlat
              ? "clickPowerFlat"
              : (fam === "fervor" ? "comboFervor" : fam),
            bonusValues: flatValues,
            clickFlatPerLevel: fam === "claws" ? (Number(z.clickFlatPerLevel) || 0) : 0,
            critChance: fam === "instinct" ? z.critChance : 0,
            critMult: fam === "bite" ? z.critMult : 0,
            fervorPower: fam === "fervor" && !heavyFlat ? z.fervorPower : 0,
            fervorDuration: fam === "fervor" && !heavyFlat ? z.fervorDuration : 0,
            uiOrder: families.indexOf(fam) + 1
          });
        });
      });
      return out;
    })();
