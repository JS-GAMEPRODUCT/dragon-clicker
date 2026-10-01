/**
 * Dragon Clicker
 * Configuration des dragons et des œufs.
 */
"use strict";

var DRAGON_DEFS = [
      {
        id: "drakel",
        name: "Drakel",
        element: "neutral",
        rarity: "common",
        description: "Un jeune dragon robuste et curieux. L'une des espèces les plus répandues du monde draconique.",
        image: "assets/dragons/dragon de base commun.png",
        icon: "🐲",
        zoneId: "sanctuary",
        eggId: "basic",
        bonus: {
          type: "clickPowerPercent",
          name: "Griffes Ancestrales",
          values: [1, 1.5, 2, 3, 4]
        }
      },
      {
        id: "vyrn",
        name: "Vyrn",
        element: "neutral",
        rarity: "common",
        description: "Petit mais particulièrement énergique, Vyrn compense sa taille par une détermination impressionnante.",
        image: "assets/dragons/dragon de base commun 2.png",
        icon: "🐉",
        zoneId: "sanctuary",
        eggId: "basic",
        bonus: {
          type: "essenceProductionPercent",
          name: "Souffle d'Essence",
          values: [1, 1.5, 2, 3, 4]
        }
      },
      {
        id: "aeryx",
        name: "Aeryx",
        element: "neutral",
        rarity: "rare",
        description: "Un dragon gracieux aux écailles naturellement brillantes. Peu d'éleveurs ont la chance d'en apercevoir.",
        image: "assets/dragons/dragon de base rare.png",
        icon: "✨",
        zoneId: "sanctuary",
        eggId: "basic",
        bonus: {
          type: "critChanceFlatPercent",
          name: "Œil du Prédateur",
          values: [0.2, 0.3, 0.4, 0.6, 0.8]
        }
      },
      {
        id: "vaelgor",
        name: "Vaelgor",
        element: "neutral",
        rarity: "legendary",
        description: "Une ancienne lignée de dragons dont la puissance aurait autrefois fait trembler des royaumes entiers.",
        image: "assets/dragons/dragon de base legendaire.png",
        icon: "👑",
        zoneId: "sanctuary",
        eggId: "basic",
        bonus: {
          type: "fragmentGainPercent",
          name: "Instinct du Collectionneur",
          values: [1.5, 2.5, 3.5, 5, 6]
        }
      },
      {
        id: "astralyon",
        name: "Astralyon",
        element: "celestial",
        rarity: "mythic",
        description: "Son existence elle-même est contestée. Certaines légendes racontent qu'Astralyon serait né avant les premiers royaumes.",
        image: "assets/dragons/dragon de base mythique.png",
        icon: "🌌",
        zoneId: "sanctuary",
        eggId: "basic",
        bonus: {
          type: "duplicateBonusFragmentChance",
          name: "Héritage Céleste",
          values: [5, 10, 15, 20, 25]
        }
      },
      /* Zone 2 — Œuf Sylvestre (assets dragon plante *) */
      {
        id: "verdalis",
        name: "Verdalis",
        element: "nature",
        rarity: "common",
        description: "Un dragon au souffle herbacé, abondant dans les collines de la Vallée.",
        image: "assets/dragons/dragon plante de base.png",
        icon: "🌿",
        zoneId: "valley",
        eggId: "plant",
        bonus: {
          type: "clickPowerPercent",
          name: "Griffes de Liane",
          values: [1.5, 2, 2.5, 3.5, 5]
        }
      },
      {
        id: "mossik",
        name: "Mossik",
        element: "nature",
        rarity: "common",
        description: "Petit dragon moussu dont l'énergie passive nourrit les nids de la vallée.",
        image: "assets/dragons/dragon plante de base2.png",
        icon: "🌱",
        zoneId: "valley",
        eggId: "plant",
        bonus: {
          type: "essenceProductionPercent",
          name: "Sève d'Essence",
          values: [1.5, 2, 2.5, 3.5, 5]
        }
      },
      {
        id: "florwyn",
        name: "Florwyn",
        element: "nature",
        rarity: "rare",
        description: "Ses ailes fleuries annoncent les rares printemps de la Vallée draconique.",
        image: "assets/dragons/dragon plante rare.png",
        icon: "🌸",
        zoneId: "valley",
        eggId: "plant",
        bonus: {
          type: "critChanceFlatPercent",
          name: "Regard Floral",
          values: [0.3, 0.4, 0.55, 0.75, 1]
        }
      },
      {
        id: "sylvagor",
        name: "Sylvagor",
        element: "nature",
        rarity: "legendary",
        description: "Gardien des racines anciennes. Les fragments affluent vers ceux qui l'éveillent.",
        image: "assets/dragons/dragon plante legendaire.png",
        icon: "🌳",
        zoneId: "valley",
        eggId: "plant",
        bonus: {
          type: "fragmentGainPercent",
          name: "Racines du Collectionneur",
          values: [2, 3, 4.5, 6, 8]
        }
      },
      {
        id: "gaiathis",
        name: "Gaïathis",
        element: "nature",
        rarity: "mythic",
        description: "Mythique esprit de la terre vivante. On dit qu'il double parfois les fragments déjà gagnés.",
        image: "assets/dragons/dragon plante mityque.png",
        icon: "🌍",
        zoneId: "valley",
        eggId: "plant",
        bonus: {
          type: "duplicateBonusFragmentChance",
          name: "Héritage Terrestre",
          values: [6, 12, 18, 24, 30]
        }
      },
      /* Zone 2 — Œuf des Cascades (assets dragon cascade *) */
      {
        id: "rivulet",
        name: "Rivulet",
        element: "water",
        rarity: "common",
        description: "Petit dragon des ruisseaux, abondant près des cascades de la Vallée.",
        image: "assets/dragons/dragon cascade commun.png",
        icon: "💧",
        zoneId: "valley",
        eggId: "cascade",
        bonus: {
          type: "clickPowerPercent",
          name: "Griffes d'Écume",
          values: [1.5, 2, 2.5, 3.5, 5]
        }
      },
      {
        id: "cascadeur",
        name: "Cascadeur",
        element: "water",
        rarity: "common",
        description: "Il danse dans les chutes ; son flux nourrit l'essence passive.",
        image: "assets/dragons/dragon cascade commun2.png",
        icon: "🌊",
        zoneId: "valley",
        eggId: "cascade",
        bonus: {
          type: "essenceProductionPercent",
          name: "Courant d'Essence",
          values: [1.5, 2, 2.5, 3.5, 5]
        }
      },
      {
        id: "torrentis",
        name: "Torrentis",
        element: "water",
        rarity: "rare",
        description: "Regard aiguisé par les remous — rares sont ceux qui le voient.",
        image: "assets/dragons/dragon cascade rare.png",
        icon: "🌀",
        zoneId: "valley",
        eggId: "cascade",
        bonus: {
          type: "critChanceFlatPercent",
          name: "Œil du Torrent",
          values: [0.3, 0.4, 0.55, 0.75, 1]
        }
      },
      {
        id: "spumara",
        name: "Spumara",
        element: "water",
        rarity: "epic",
        description: "Née de l'écume des chutes célestes. Sa présence accélère les découvertes rares.",
        image: "assets/dragons/dragon cascade epic.png",
        icon: "🫧",
        zoneId: "valley",
        eggId: "cascade",
        bonus: {
          type: "critChanceFlatPercent",
          name: "Brume des Cascades",
          values: [0.45, 0.6, 0.8, 1.1, 1.4]
        }
      },
      {
        id: "abyssara",
        name: "Abyssara",
        element: "water",
        rarity: "legendary",
        description: "Gardienne des gouffres bleus ; les fragments affluent vers elle.",
        image: "assets/dragons/dragon cascade legendaire.png",
        icon: "🧜",
        zoneId: "valley",
        eggId: "cascade",
        bonus: {
          type: "fragmentGainPercent",
          name: "Trésor des Cascades",
          values: [2, 3, 4.5, 6, 8]
        }
      },
      {
        id: "naiadryn",
        name: "Naïadryn",
        element: "water",
        rarity: "mythic",
        description: "Esprit mythique des cascades célestes. On dit qu'elle redouble parfois les fragments.",
        image: "assets/dragons/dragon cascade legendaire2.png",
        icon: "💠",
        zoneId: "valley",
        eggId: "cascade",
        bonus: {
          type: "duplicateBonusFragmentChance",
          name: "Écho des Abysses",
          values: [5, 10, 15, 20, 25]
        }
      }
    ];

var EGG_DEFS = [
      {
        id: "basic",
        name: "Œuf Draconique",
        description: "Un œuf draconique dont l'origine semble remonter aux premiers dragons. Nul ne sait quelle créature sommeille à l'intérieur.",
        image: "assets/eggs/oeuf de base.png",
        progressImages: {
          intact: "assets/eggs/oeuf de base.png",
          cracked35: "assets/eggs/oeuf de base35.png",
          cracked75: "assets/eggs/oeuf de base75.png"
        },
        background: "basic",
        zoneId: "sanctuary",
        requiredHatchPower: 300,
        requiredClicks: 300,
        rarity: "common",
        element: "neutral",
        startUnlocked: true,
        comingSoon: false,
        secret: false,
        visualOffsetX: 0,
        /* Taux rareté (pas d'Épique dans ce pool) — part Épique 9 % redistribuée
           proportionnellement sur C/R/L/M. Base 10000 :
           Commun 70.33 % · Rare 27.47 % · Légendaire 1.92 % · Mythique 0.28 % */
        dragonPool: [
          { dragonId: "drakel", weight: 3517 },
          { dragonId: "vyrn", weight: 3516 },
          { dragonId: "aeryx", weight: 2747 },
          { dragonId: "vaelgor", weight: 192 },
          { dragonId: "astralyon", weight: 28 }
        ],
        pity: {
          enabled: false,
          /* Future examples — ignored while enabled is false */
          rules: [
            { rarity: "legendary", softPityAfter: 20, hardPityAt: 50 },
            { rarity: "mythic", softPityAfter: 80, hardPityAt: 200 }
          ]
        }
      },
      {
        id: "plant",
        name: "Œuf Sylvestre",
        description: "Un œuf enveloppé de lianes et de sève ancienne. Seule la Vallée draconique peut l'éveiller.",
        image: "assets/eggs/oeuf plante.png",
        progressImages: {
          intact: "assets/eggs/oeuf plante.png",
          cracked35: "assets/eggs/oeuf plante35.png",
          cracked75: "assets/eggs/oeuf plante75.png"
        },
        background: "valley",
        zoneId: "valley",
        requiredHatchPower: 2500,
        requiredClicks: 2500,
        rarity: "common",
        element: "nature",
        startUnlocked: false,
        comingSoon: false,
        secret: false,
        /* PNG plante : contenu ~13px à gauche du cadre (pad L/R asymétrique) → +1% */
        visualOffsetX: 1,
        visualOffsetXByKey: { intact: 1, cracked35: -0.2, cracked75: -0.45 },
        /* Même distribution que Zone 1 (pas d'Épique dans le pool Sylvestre). */
        dragonPool: [
          { dragonId: "verdalis", weight: 3517 },
          { dragonId: "mossik", weight: 3516 },
          { dragonId: "florwyn", weight: 2747 },
          { dragonId: "sylvagor", weight: 192 },
          { dragonId: "gaiathis", weight: 28 }
        ],
        pity: {
          enabled: false,
          rules: [
            { rarity: "legendary", softPityAfter: 20, hardPityAt: 50 },
            { rarity: "mythic", softPityAfter: 80, hardPityAt: 200 }
          ]
        }
      },
      {
        id: "cascade",
        name: "Œuf des Cascades",
        description: "Un œuf baigné par le flux des cascades célestes. Une autre lignée sommeille dans ses reflets.",
        image: "assets/eggs/oeuf cascade.png",
        progressImages: {
          intact: "assets/eggs/oeuf cascade.png",
          cracked35: "assets/eggs/oeuf cascade35.png",
          cracked75: "assets/eggs/oeuf cascade75.png"
        },
        background: "valley",
        zoneId: "valley",
        requiredHatchPower: 3500,
        requiredClicks: 3500,
        rarity: "common",
        element: "water",
        startUnlocked: false,
        comingSoon: false,
        secret: false,
        visualOffsetX: 0,
        visualOffsetXByKey: { intact: 0.1, cracked35: -0.45, cracked75: -0.25 },
        /* Pool Cascades — 5 raretés. Base 10000 :
           Commun 64 % · Rare 25 % · Épique 9 % · Légendaire 1.75 % · Mythique 0.25 % */
        dragonPool: [
          { dragonId: "rivulet", weight: 3200 },
          { dragonId: "cascadeur", weight: 3200 },
          { dragonId: "torrentis", weight: 2500 },
          { dragonId: "spumara", weight: 900 },
          { dragonId: "abyssara", weight: 175 },
          { dragonId: "naiadryn", weight: 25 }
        ],
        pity: {
          enabled: false,
          rules: [
            { rarity: "legendary", softPityAfter: 20, hardPityAt: 50 },
            { rarity: "mythic", softPityAfter: 80, hardPityAt: 200 }
          ]
        }
      },
      /* Future eggs — locked teasers (not hatchable yet) */
      {
        id: "flames",
        name: "Œuf des Flammes",
        description: "Bientôt…",
        image: "assets/eggs/fire-egg.png",
        background: "basic",
        requiredClicks: 1000,
        rarity: "rare",
        element: "fire",
        startUnlocked: false,
        comingSoon: true,
        secret: false,
        dragonPool: [],
        pity: { enabled: false, rules: [] }
      },
      {
        id: "glacial",
        name: "Œuf Glacial",
        description: "Bientôt…",
        image: "assets/eggs/ice-egg.png",
        background: "basic",
        requiredClicks: 1000,
        rarity: "rare",
        element: "ice",
        startUnlocked: false,
        comingSoon: true,
        secret: false,
        dragonPool: [],
        pity: { enabled: false, rules: [] }
      },
      {
        id: "shadows",
        name: "Œuf des Ombres",
        description: "Bientôt…",
        image: "assets/eggs/shadow-egg.png",
        background: "basic",
        requiredClicks: 1000,
        rarity: "legendary",
        element: "shadow",
        startUnlocked: false,
        comingSoon: true,
        secret: false,
        dragonPool: [],
        pity: { enabled: false, rules: [] }
      }
    ];
