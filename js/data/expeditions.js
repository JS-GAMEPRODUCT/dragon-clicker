/**
 * Dragon Clicker
 * Données des expéditions.
 */
"use strict";

var EXPEDITION_DEFS = [
      {
        id: "ruins",
        zoneId: "sanctuary",
        name: "Les Ruines de l’Aube Draconique",
        image: "assets/expedition/expeditionbase1-Les Ruines de l’Aube Draconique.png",
        durationMs: 10 * 60 * 1000,
        recommendedPower: 500,
        rewardPreview: "Essence Draconique · petite chance de fragments",
        rewardConfig: {
          powerMin: 1000,
          powerMax: 2500,
          fragmentChance: 0.35,
          fragmentMin: 3,
          fragmentMax: 8,
          rareChance: 0,
          rarePowerMin: 0,
          rarePowerMax: 0
        },
        requirements: {}
      },
      {
        id: "forest",
        zoneId: "sanctuary",
        name: "La Vallée des Cascades Célestes",
        image: "assets/expedition/expeditionbase2-Vallée des Cascades Célestes.png",
        durationMs: 30 * 60 * 1000,
        recommendedPower: 2500,
        rewardPreview: "Essence Draconique · fragments · petit bonus possible",
        rewardConfig: {
          powerMin: 5000,
          powerMax: 12000,
          fragmentChance: 0.7,
          fragmentMin: 5,
          fragmentMax: 14,
          rareChance: 0.08,
          rarePowerMin: 1500,
          rarePowerMax: 4000
        },
        requirements: {}
      },
      {
        id: "temple",
        zoneId: "sanctuary",
        name: "Le Sanctuaire des Hautes Plaines",
        image: "assets/expedition/expeditionbase3-Le Sanctuaire des Hautes Plaines.png",
        durationMs: 2 * 60 * 60 * 1000,
        recommendedPower: 10000,
        rewardPreview: "Beaucoup d'Essence · fragments · chance de récompense rare",
        rewardConfig: {
          powerMin: 25000,
          powerMax: 75000,
          fragmentChance: 0.85,
          fragmentMin: 10,
          fragmentMax: 24,
          rareChance: 0.22,
          rarePowerMin: 8000,
          rarePowerMax: 20000
        },
        requirements: {}
      },
      {
        id: "zone2_sentier_sylvestre",
        zoneId: "valley",
        name: "Sentier Sylvestre",
        image: "assets/expedition/expedition zone 2 Sentier Sylvestre.png",
        description: "Un ancien sentier disparaît sous une végétation chargée d'essence draconique.",
        durationMs: 10 * 60 * 1000,
        recommendedPower: 1000,
        rewardPreview: "Essence Draconique · petite chance de fragments",
        rewardConfig: {
          powerMin: 1800,
          powerMax: 4000,
          fragmentChance: 0.4,
          fragmentMin: 4,
          fragmentMax: 10,
          rareChance: 0,
          rarePowerMin: 0,
          rarePowerMax: 0
        },
        requirements: {}
      },
      {
        id: "zone2_grottes_cascades",
        zoneId: "valley",
        name: "Grottes des Cascades",
        image: "assets/expedition/expedition zone 2 Grottes des Cascades.png",
        description: "Derrière les grandes chutes de la vallée se cache un réseau de grottes encore inexploré.",
        durationMs: 30 * 60 * 1000,
        recommendedPower: 4000,
        rewardPreview: "Essence Draconique · fragments · petit bonus possible",
        rewardConfig: {
          powerMin: 8000,
          powerMax: 18000,
          fragmentChance: 0.72,
          fragmentMin: 6,
          fragmentMax: 16,
          rareChance: 0.1,
          rarePowerMin: 2000,
          rarePowerMax: 5000
        },
        requirements: {}
      },
      {
        id: "zone2_ruines_vallee",
        zoneId: "valley",
        name: "Ruines de la Vallée",
        image: "assets/expedition/expedition zone 2 Ruines de la Vallée.png",
        description: "Les vestiges d'une ancienne civilisation draconique émergent au cœur de la vallée.",
        durationMs: 90 * 60 * 1000,
        recommendedPower: 10000,
        rewardPreview: "Beaucoup d'Essence · fragments · chance de récompense rare",
        rewardConfig: {
          powerMin: 20000,
          powerMax: 55000,
          fragmentChance: 0.8,
          fragmentMin: 8,
          fragmentMax: 20,
          rareChance: 0.18,
          rarePowerMin: 6000,
          rarePowerMax: 16000
        },
        requirements: {}
      },
      {
        id: "zone2_sanctuaire_oublie",
        zoneId: "valley",
        name: "Sanctuaire Oublié",
        image: "assets/expedition/expedition zone 2 Sanctuaire oublié.png",
        description: "Très loin dans la vallée repose un sanctuaire dont l'énergie attire les dragons les plus puissants.",
        durationMs: 4 * 60 * 60 * 1000,
        recommendedPower: 25000,
        rewardPreview: "Très grande Essence · fragments · forte chance de récompense rare",
        rewardConfig: {
          powerMin: 50000,
          powerMax: 150000,
          fragmentChance: 0.9,
          fragmentMin: 14,
          fragmentMax: 30,
          rareChance: 0.3,
          rarePowerMin: 12000,
          rarePowerMax: 35000
        },
        requirements: {}
      }
    ];
