/**
 * Dragon Clicker
 * Configuration des zones et positions carte.
 */
"use strict";

var ZONE_DEFS = [
      {
        id: "sanctuary",
        name: "Sanctuaire ancien",
        rank: "Novice",
        description: "Zone d'apprentissage. Un seul œuf, les bases du clic et de l'économie.",
        background: "basic",
        startUnlocked: true,
        unlockCost: 0,
        unlockRequirements: [],
        eggIds: ["basic"],
        producerIds: ["hatchling", "nest", "sanctuaryHall", "fireDragon", "fortress"]
      },
      {
        id: "valley",
        name: "Vallée draconique",
        rank: "Éveillé",
        description: "Collines fertiles où de nouveaux producteurs plus puissants apparaissent.",
        background: "valley",
        startUnlocked: false,
        unlockCost: 100000,
        unlockPortalName: "Portail vers la Vallée",
        /* Ticket d'accès : 300K investis en Zone 1, puis 100K pour acheter. */
        unlockRequirements: [
          { type: "zoneSpent", zoneId: "sanctuary", value: 300000 }
        ],
        eggIds: ["plant", "cascade"],
        producerIds: ["valleyCub", "valleyNest", "valleySpire", "valleyKeep", "valleyCitadel"]
      },
      {
        id: "mountains",
        name: "Montagnes sauvages",
        rank: "Adepte",
        description: "Pics venteux — contenu détaillé à venir.",
        background: "basic",
        startUnlocked: false,
        comingSoon: true,
        unlockCost: 500000,
        unlockRequirements: [{ type: "eggsHatched", value: 25 }],
        eggIds: [],
        producerIds: []
      },
      {
        id: "forgotten",
        name: "Royaume oublié",
        rank: "Vétéran",
        description: "Ruines d'un empire perdu — à venir.",
        background: "basic",
        startUnlocked: false,
        comingSoon: true,
        unlockCost: 5e6,
        unlockRequirements: [{ type: "eggsHatched", value: 50 }],
        eggIds: [],
        producerIds: []
      },
      {
        id: "royal",
        name: "Terres royales",
        rank: "Maître",
        description: "Domaines souverains — à venir.",
        background: "basic",
        startUnlocked: false,
        comingSoon: true,
        unlockCost: 5e7,
        unlockRequirements: [{ type: "eggsHatched", value: 80 }],
        eggIds: [],
        producerIds: []
      },
      {
        id: "ruins",
        name: "Ruines anciennes",
        rank: "Ancien",
        description: "Vestiges d'un autre âge — à venir.",
        background: "basic",
        startUnlocked: false,
        comingSoon: true,
        unlockCost: 5e8,
        unlockRequirements: [{ type: "eggsHatched", value: 120 }],
        eggIds: [],
        producerIds: []
      },
      {
        id: "peaks",
        name: "Pics ascendants",
        rank: "Ascendant",
        description: "Sommets inaccessibles — à venir.",
        background: "basic",
        startUnlocked: false,
        comingSoon: true,
        unlockCost: 5e9,
        unlockRequirements: [{ type: "eggsHatched", value: 160 }],
        eggIds: [],
        producerIds: []
      },
      {
        id: "celestial",
        name: "Domaines célestes",
        rank: "Céleste",
        description: "Hauteurs éthérées — à venir.",
        background: "basic",
        startUnlocked: false,
        comingSoon: true,
        unlockCost: 5e10,
        unlockRequirements: [{ type: "eggsHatched", value: 200 }],
        eggIds: [],
        producerIds: []
      },
      {
        id: "primordial",
        name: "Terres primordiales",
        rank: "Primordial",
        description: "Berceau des premiers dragons — à venir.",
        background: "basic",
        startUnlocked: false,
        comingSoon: true,
        unlockCost: 5e11,
        unlockRequirements: [{ type: "eggsHatched", value: 250 }],
        eggIds: [],
        producerIds: []
      },
      {
        id: "divine",
        name: "Sanctuaire divin",
        rank: "Divin",
        description: "Le sommet absolu — à venir.",
        background: "basic",
        startUnlocked: false,
        comingSoon: true,
        unlockCost: 5e12,
        unlockRequirements: [{ type: "eggsHatched", value: 300 }],
        eggIds: [],
        producerIds: []
      }
    ];
