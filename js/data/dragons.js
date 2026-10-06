/**
 * Dragon Clicker
 * Configuration des dragons et des œufs.
 *
 * Bonus de base Z1–Z3 : famille par rareté, puissance par zone.
 * (Common = click %, Rare = Essence/sec %, Epic = click % +,
 *  Legendary = Essence/sec flat, Mythic = click flat + Essence/sec flat)
 */
"use strict";

/**
 * Courbes partagées : même rareté + même zone = mêmes valeurs.
 * values en points de % pour les types *Percent ; valeurs brutes pour les *Flat.
 */
var DRAGON_ZONE_RARITY_BONUSES = {
  sanctuary: {
    common: {
      type: "clickPowerPercent",
      name: "Puissance de clic",
      values: [1, 2, 3, 4, 5]
    },
    rare: {
      type: "essenceProductionPercent",
      name: "Essence/sec",
      values: [2, 3, 4, 5, 6]
    },
    epic: {
      type: "clickPowerPercent",
      name: "Puissance de clic",
      values: [3, 5, 7, 9, 11]
    },
    legendary: {
      type: "essenceProductionFlat",
      name: "Essence/sec",
      values: [5, 9, 14, 20, 28]
    },
    mythic: [
      {
        type: "clickPowerFlat",
        name: "Puissance de clic",
        values: [2, 3, 4, 6, 8]
      },
      {
        type: "essenceProductionFlat",
        name: "Essence/sec",
        values: [10, 16, 24, 34, 45]
      }
    ]
  },
  valley: {
    common: {
      type: "clickPowerPercent",
      name: "Puissance de clic",
      values: [2, 3, 4, 5, 7]
    },
    rare: {
      type: "essenceProductionPercent",
      name: "Essence/sec",
      values: [3, 4, 5, 7, 9]
    },
    epic: {
      type: "clickPowerPercent",
      name: "Puissance de clic",
      values: [5, 7, 9, 12, 15]
    },
    legendary: {
      type: "essenceProductionFlat",
      name: "Essence/sec",
      values: [25, 40, 60, 85, 120]
    },
    mythic: [
      {
        type: "clickPowerFlat",
        name: "Puissance de clic",
        values: [5, 7, 10, 13, 17]
      },
      {
        type: "essenceProductionFlat",
        name: "Essence/sec",
        values: [40, 65, 95, 135, 180]
      }
    ]
  },
  mountains: {
    common: {
      type: "clickPowerPercent",
      name: "Puissance de clic",
      values: [3, 5, 7, 9, 11]
    },
    rare: {
      type: "essenceProductionPercent",
      name: "Essence/sec",
      values: [5, 7, 9, 11, 14]
    },
    epic: {
      type: "clickPowerPercent",
      name: "Puissance de clic",
      values: [8, 11, 14, 18, 22]
    },
    legendary: {
      type: "essenceProductionFlat",
      name: "Essence/sec",
      values: [80, 130, 190, 260, 350]
    },
    mythic: [
      {
        type: "clickPowerFlat",
        name: "Puissance de clic",
        values: [12, 17, 23, 30, 40]
      },
      {
        type: "essenceProductionFlat",
        name: "Essence/sec",
        values: [120, 190, 280, 390, 520]
      }
    ]
  },
  /* Zone 4 — Royaume oublié : courbe au-dessus de la Montagne. */
  zone4: {
    common: {
      type: "clickPowerPercent",
      name: "Puissance de clic",
      values: [4, 6, 9, 12, 15]
    },
    rare: {
      type: "essenceProductionPercent",
      name: "Essence/sec",
      values: [7, 10, 13, 17, 21]
    },
    epic: {
      type: "clickPowerPercent",
      name: "Puissance de clic",
      values: [11, 15, 20, 26, 32]
    },
    legendary: {
      type: "essenceProductionFlat",
      name: "Essence/sec",
      values: [140, 220, 320, 440, 580]
    },
    mythic: [
      {
        type: "clickPowerFlat",
        name: "Puissance de clic",
        values: [18, 25, 34, 45, 58]
      },
      {
        type: "essenceProductionFlat",
        name: "Essence/sec",
        values: [200, 310, 450, 620, 820]
      }
    ]
  },
  /* Événement Halloween — courbe type Vallée (entre Z1 et Z3). */
  halloween: {
    common: {
      type: "clickPowerPercent",
      name: "Puissance de clic",
      values: [2, 3, 4, 5, 7]
    },
    rare: {
      type: "essenceProductionPercent",
      name: "Essence/sec",
      values: [3, 4, 5, 7, 9]
    },
    epic: {
      type: "clickPowerPercent",
      name: "Puissance de clic",
      values: [5, 7, 9, 12, 15]
    },
    legendary: {
      type: "essenceProductionFlat",
      name: "Essence/sec",
      values: [25, 40, 60, 85, 120]
    },
    mythic: [
      {
        type: "clickPowerFlat",
        name: "Puissance de clic",
        values: [5, 7, 10, 13, 17]
      },
      {
        type: "essenceProductionFlat",
        name: "Essence/sec",
        values: [40, 65, 95, 135, 180]
      }
    ]
  }
};

function cloneDragonBonusCurve(curve) {
  if (Array.isArray(curve)) {
    return curve.map(function (entry) {
      return {
        type: entry.type,
        name: entry.name,
        values: entry.values.slice()
      };
    });
  }
  return {
    type: curve.type,
    name: curve.name,
    values: curve.values.slice()
  };
}

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
        eggId: "basic"
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
        eggId: "basic"
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
        eggId: "basic"
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
        eggId: "basic"
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
        eggId: "basic"
      },
      {
        id: "emberion",
        name: "Emberion",
        element: "neutral",
        rarity: "epic",
        description: "Ses écailles retiennent la chaleur des premières forges. On dit qu'il attire les découvertes plus rares.",
        image: "assets/dragons/dragon de base epic.png",
        icon: "🔥",
        zoneId: "sanctuary",
        eggId: "basic"
      },
      {
        id: "scaldris",
        name: "Scaldris",
        element: "neutral",
        rarity: "epic",
        description: "Un prédateur aux reflets métalliques, aussi rare qu'il est redoutable dans l'arène du clic.",
        image: "assets/dragons/dragon de base epic2.png",
        icon: "⚔️",
        zoneId: "sanctuary",
        eggId: "basic"
      },
      {
        id: "noctyron",
        name: "Noctyron",
        element: "celestial",
        rarity: "mythic",
        description: "Né sous un ciel sans lune. Sa présence prolongerait la veille des sanctuaires abandonnés.",
        image: "assets/dragons/dragon de base mythique2.png",
        icon: "🌑",
        zoneId: "sanctuary",
        eggId: "basic"
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
        eggId: "plant"
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
        eggId: "plant"
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
        eggId: "plant"
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
        eggId: "plant"
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
        eggId: "plant"
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
        eggId: "cascade"
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
        eggId: "cascade"
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
        eggId: "cascade"
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
        eggId: "cascade"
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
        eggId: "cascade"
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
        eggId: "cascade"
      },
      /* Zone 3 — Œuf de Granit (assets dragon granite *) */
      {
        id: "petrak",
        name: "Pétrak",
        element: "earth",
        rarity: "common",
        description: "Dragonnet de pierre ambrée, abondant dans les falaises de la Montagne sauvage.",
        image: "assets/dragons/dragon granite commun.png",
        icon: "🪨",
        zoneId: "mountains",
        eggId: "granite"
      },
      {
        id: "gritling",
        name: "Gritling",
        element: "earth",
        rarity: "common",
        description: "Ses écailles gréseuses crissent sous le vent des cimes.",
        image: "assets/dragons/dragon granite commun2.png",
        icon: "🟤",
        zoneId: "mountains",
        eggId: "granite"
      },
      {
        id: "amberon",
        name: "Ambéron",
        element: "earth",
        rarity: "rare",
        description: "Veines d'ambre figées dans la roche — rares sont ceux qui l'aperçoivent.",
        image: "assets/dragons/dragon granite rare.png",
        icon: "🔶",
        zoneId: "mountains",
        eggId: "granite"
      },
      {
        id: "basaltis",
        name: "Basaltis",
        element: "earth",
        rarity: "epic",
        description: "Forgé dans les coulées basaltiques, il porte la mémoire des volcans endormis.",
        image: "assets/dragons/dragon granite epic1.png",
        icon: "🗿",
        zoneId: "mountains",
        eggId: "granite"
      },
      {
        id: "mountainyx",
        name: "Mountainyx",
        element: "earth",
        rarity: "legendary",
        description: "Gardien des crêtes ancestrales. La montagne elle-même semble s'incliner à son passage.",
        image: "assets/dragons/dragon granite legendaire1.png",
        icon: "⛰️",
        zoneId: "mountains",
        eggId: "granite"
      },
      {
        id: "auralith",
        name: "Auralith",
        element: "earth",
        rarity: "mythic",
        description: "Mythe doré des pics : on dit que son cœur est un cristal plus ancien que les royaumes.",
        image: "assets/dragons/dragon granite mythique.png",
        icon: "✨",
        zoneId: "mountains",
        eggId: "granite"
      },
      /* Zone 3 — Œuf des Tempêtes (assets dragon tempete *) */
      {
        id: "galeon",
        name: "Galéon",
        element: "air",
        rarity: "common",
        description: "Petit dragon des bourrasques, courant le long des arêtes venteuses.",
        image: "assets/dragons/dragon tempete commun.png",
        icon: "💨",
        zoneId: "mountains",
        eggId: "storm"
      },
      {
        id: "zephyric",
        name: "Zéphyric",
        element: "air",
        rarity: "common",
        description: "Léger comme un souffle d'altitude, il danse entre les nuages bas.",
        image: "assets/dragons/dragon tempete commun2.png",
        icon: "🌬️",
        zoneId: "mountains",
        eggId: "storm"
      },
      {
        id: "stormyx",
        name: "Stormyx",
        element: "air",
        rarity: "rare",
        description: "Son regard coupe comme la pluie glacée des hauteurs.",
        image: "assets/dragons/dragon tempete rare.png",
        icon: "⛈️",
        zoneId: "mountains",
        eggId: "storm"
      },
      {
        id: "voltara",
        name: "Voltara",
        element: "air",
        rarity: "epic",
        description: "Éclairs figés dans ses ailes — l'orage suit sa trajectoire.",
        image: "assets/dragons/dragon tempete epic.png",
        icon: "⚡",
        zoneId: "mountains",
        eggId: "storm"
      },
      {
        id: "cimor",
        name: "Cimor",
        element: "air",
        rarity: "legendary",
        description: "Seigneur des cimes orageuses. Les vents obéissent à son cri.",
        image: "assets/dragons/dragon tempete legendaire.png",
        icon: "🌩️",
        zoneId: "mountains",
        eggId: "storm"
      },
      {
        id: "aetherion",
        name: "Aéthérion",
        element: "air",
        rarity: "mythic",
        description: "Esprit mythique des hauteurs célestes. On dit qu'il naît là où le ciel touche la pierre.",
        image: "assets/dragons/dragon tempete mythique.png",
        icon: "🌌",
        zoneId: "mountains",
        eggId: "storm"
      },
      /* —— Halloween — Œuf Citrouille —— */
      {
        id: "jacklyn",
        name: "Jacklyn",
        element: "shadow",
        rarity: "common",
        description: "Petite citrouille animée, toujours prête à jouer un tour inoffensif.",
        image: "assets/event/halloween/dragon/dragon citrouille commun.png",
        icon: "🎃",
        zoneId: "halloween",
        eggId: "citrouille"
      },
      {
        id: "patchyn",
        name: "Patchyn",
        element: "shadow",
        rarity: "common",
        description: "Son sourire sculpté brille dès que la nuit tombe sur le Royaume.",
        image: "assets/event/halloween/dragon/dragon citrouille commun2.png",
        icon: "🎃",
        zoneId: "halloween",
        eggId: "citrouille"
      },
      {
        id: "lanternis",
        name: "Lanternis",
        element: "shadow",
        rarity: "rare",
        description: "Une flamme orange danse dans son regard — guide des soirs d'octobre.",
        image: "assets/event/halloween/dragon/dragon citrouille rare.png",
        icon: "🕯️",
        zoneId: "halloween",
        eggId: "citrouille"
      },
      {
        id: "gourdrak",
        name: "Gourdrak",
        element: "shadow",
        rarity: "epic",
        description: "Écailles de courge et souffle tiède : il garde les champs maudits.",
        image: "assets/event/halloween/dragon/dragon citrouille epic.png",
        icon: "🧡",
        zoneId: "halloween",
        eggId: "citrouille"
      },
      {
        id: "harvestyx",
        name: "Harvestyx",
        element: "shadow",
        rarity: "epic",
        description: "Né des récoltes abandonnées, il attire les fragmentations nocturnes.",
        image: "assets/event/halloween/dragon/dragon citrouille epic2.png",
        icon: "🍂",
        zoneId: "halloween",
        eggId: "citrouille"
      },
      {
        id: "citrogorn",
        name: "Citrogorn",
        element: "shadow",
        rarity: "legendary",
        description: "Seigneur des lanternes. Les citrouilles s'inclinent à son passage.",
        image: "assets/event/halloween/dragon/dragon citrouille legendaire.png",
        icon: "👑",
        zoneId: "halloween",
        eggId: "citrouille"
      },
      {
        id: "samhainor",
        name: "Samhainor",
        element: "shadow",
        rarity: "mythic",
        description: "Mythe de la Nuit d'Halloween. On dit qu'il ouvre le voile entre les mondes.",
        image: "assets/event/halloween/dragon/dragon citrouille mythique.png",
        icon: "🌌",
        zoneId: "halloween",
        eggId: "citrouille"
      },
      {
        id: "nightgourd",
        name: "Nightgourd",
        element: "shadow",
        rarity: "mythic",
        description: "Citrouille mythique dont la lumière ne s'éteint jamais, même au soleil.",
        image: "assets/event/halloween/dragon/dragon citrouille mythique2.png",
        icon: "✨",
        zoneId: "halloween",
        eggId: "citrouille"
      },
      /* —— Halloween — Œuf Fantôme —— */
      {
        id: "spectrix",
        name: "Spectrix",
        element: "shadow",
        rarity: "common",
        description: "Un petit esprit translucide qui glisse entre les tombes du Royaume.",
        image: "assets/event/halloween/dragon/dragon fantomecommun.png",
        icon: "👻",
        zoneId: "halloween",
        eggId: "fantome"
      },
      {
        id: "wispette",
        name: "Wispette",
        element: "shadow",
        rarity: "common",
        description: "Feu follet joueur, elle adoucit les nuits les plus froides.",
        image: "assets/event/halloween/dragon/dragon fantome commun2.png",
        icon: "👻",
        zoneId: "halloween",
        eggId: "fantome"
      },
      {
        id: "hauntis",
        name: "Hauntis",
        element: "shadow",
        rarity: "rare",
        description: "Son murmure fait frissonner les couloirs du Sanctuaire.",
        image: "assets/event/halloween/dragon/dragon fantome rare.png",
        icon: "🌫️",
        zoneId: "halloween",
        eggId: "fantome"
      },
      {
        id: "phasmor",
        name: "Phasmor",
        element: "shadow",
        rarity: "epic",
        description: "Apparition épique : il traverse les murs comme le vent d'automne.",
        image: "assets/event/halloween/dragon/dragon fantome epic.png",
        icon: "🔮",
        zoneId: "halloween",
        eggId: "fantome"
      },
      {
        id: "spectryon",
        name: "Spectryon",
        element: "shadow",
        rarity: "legendary",
        description: "Légende fantôme des cryptes. Les ombres lui obéissent.",
        image: "assets/event/halloween/dragon/dragon fantome legendaire.png",
        icon: "👑",
        zoneId: "halloween",
        eggId: "fantome"
      },
      {
        id: "oblivyx",
        name: "Oblivyx",
        element: "shadow",
        rarity: "mythic",
        description: "Mythe du néant spectral. Peu ont croisé son regard sans l'oublier.",
        image: "assets/event/halloween/dragon/dragon fantome mythique.png",
        icon: "🌌",
        zoneId: "halloween",
        eggId: "fantome"
      },
      /* —— Zone 4 — Œuf des Reliques (assets dragon royaume oubliée *) —— */
      {
        id: "vestigis",
        name: "Drake des Vestiges",
        element: "arcane",
        rarity: "common",
        description: "Dragonnet des ruines, attiré par les fragments d'ancien pouvoir.",
        image: "assets/dragons/dragon royaume oubliée commun.png",
        icon: "🏺",
        zoneId: "zone4",
        eggId: "reliques"
      },
      {
        id: "ruinling",
        name: "Dragonnet des Ruines",
        element: "arcane",
        rarity: "common",
        description: "Il niche entre les colonnes brisées du Royaume oublié.",
        image: "assets/dragons/dragon royaume oubliée commun2.png",
        icon: "🧱",
        zoneId: "zone4",
        eggId: "reliques"
      },
      {
        id: "relicon",
        name: "Sentinelle des Reliques",
        element: "arcane",
        rarity: "rare",
        description: "Gardienne discrète des coffres scellés et des sceaux oubliés.",
        image: "assets/dragons/dragon royaume oubliée rare.png",
        icon: "🛡️",
        zoneId: "zone4",
        eggId: "reliques"
      },
      {
        id: "shardyx",
        name: "Voyant des Tessons",
        element: "arcane",
        rarity: "rare",
        description: "Ses yeux lisent l'histoire dans chaque éclat de pierre runique.",
        image: "assets/dragons/dragon royaume oubliée rare2.png",
        icon: "💎",
        zoneId: "zone4",
        eggId: "reliques"
      },
      {
        id: "thronyx",
        name: "Chevalier du Trône Brisé",
        element: "arcane",
        rarity: "epic",
        description: "Armure de reliques et serment brisé — il veille encore sur un trône vide.",
        image: "assets/dragons/dragon royaume oubliée epic.png",
        icon: "⚔️",
        zoneId: "zone4",
        eggId: "reliques"
      },
      {
        id: "losthron",
        name: "Gardien du Trône Perdu",
        element: "arcane",
        rarity: "legendary",
        description: "Légende des salles royales. Nul n'approche le trône perdu sans son accord.",
        image: "assets/dragons/dragon royaume oubliée legendaire.png",
        icon: "👑",
        zoneId: "zone4",
        eggId: "reliques"
      },
      {
        id: "aeternyx",
        name: "Souverain du Trône Éternel",
        element: "arcane",
        rarity: "mythic",
        description: "Mythe vivant du Royaume oublié. On dit que le trône n'a jamais vraiment disparu.",
        image: "assets/dragons/dragon royaume oubliée mythique.png",
        icon: "✨",
        zoneId: "zone4",
        eggId: "reliques"
      },
      /* —— Zone 4 — Œuf des Arcanes Oubliées (assets dragon oeuf arcane *) —— */
      {
        id: "glyphling",
        name: "Drakel des Glyphes",
        element: "arcane",
        rarity: "common",
        description: "Des runes naïves scintillent déjà sur ses écailles.",
        image: "assets/dragons/dragon oeuf arcane commun.png",
        icon: "📜",
        zoneId: "zone4",
        eggId: "arcanes"
      },
      {
        id: "fluxling",
        name: "Dragonnet du Flux",
        element: "arcane",
        rarity: "common",
        description: "Il suit les courants magiques comme un poisson suit le fleuve.",
        image: "assets/dragons/dragon oeuf arcane commun2.png",
        icon: "🌊",
        zoneId: "zone4",
        eggId: "arcanes"
      },
      {
        id: "arcanist",
        name: "Arcaniste Draconique",
        element: "arcane",
        rarity: "rare",
        description: "Savant des cercles oubliés, il tisse l'essence en formules vivantes.",
        image: "assets/dragons/dragon oeuf arcane rare.png",
        icon: "🔮",
        zoneId: "zone4",
        eggId: "arcanes"
      },
      {
        id: "portalix",
        name: "Sentinelle des Portails",
        element: "arcane",
        rarity: "rare",
        description: "Elle ouvre et ferme les passages entre les salles arcaniques.",
        image: "assets/dragons/dragon oeuf arcane rare2.png",
        icon: "🚪",
        zoneId: "zone4",
        eggId: "arcanes"
      },
      {
        id: "archontis",
        name: "Archonte des Arcanes",
        element: "arcane",
        rarity: "epic",
        description: "Haut mage draconique. Les glyphes s'inclinent à sa voix.",
        image: "assets/dragons/dragon oeuf arcane epic.png",
        icon: "🧿",
        zoneId: "zone4",
        eggId: "arcanes"
      },
      {
        id: "glyphlord",
        name: "Souverain des Glyphes Perdus",
        element: "arcane",
        rarity: "legendary",
        description: "Légende des grimoires scellés. Chaque rune du royaume lui répond.",
        image: "assets/dragons/dragon oeuf arcane legendaire.png",
        icon: "📖",
        zoneId: "zone4",
        eggId: "arcanes"
      },
      {
        id: "nexusor",
        name: "Souverain du Nexus Arcanique",
        element: "arcane",
        rarity: "mythic",
        description: "Mythe du carrefour magique. Tout flux arcane passe par son regard.",
        image: "assets/dragons/dragon oeuf arcane mythique.png",
        icon: "🌌",
        zoneId: "zone4",
        eggId: "arcanes"
      },
      /* —— Zone 4 — Œuf du Néant Ancien (assets dragon oeuf du neant *) —— */
      {
        id: "voidling",
        name: "Drakel du Néant",
        element: "shadow",
        rarity: "common",
        description: "Petit dragon d'ombre, né entre deux battements du vide.",
        image: "assets/dragons/dragon oeuf du neant commun.png",
        icon: "🌑",
        zoneId: "zone4",
        eggId: "neant"
      },
      {
        id: "mistling",
        name: "Dragonnet de la Brume Vide",
        element: "shadow",
        rarity: "common",
        description: "Sa silhouette se dissout dans la brume dès qu'on le fixe trop longtemps.",
        image: "assets/dragons/dragon oeuf du neant commun2.png",
        icon: "🌫️",
        zoneId: "zone4",
        eggId: "neant"
      },
      {
        id: "riftara",
        name: "Dragon des Failles Oubliées",
        element: "shadow",
        rarity: "rare",
        description: "Il surgit des fissures entre les mondes, puis s'efface.",
        image: "assets/dragons/dragon oeuf du neant rare.png",
        icon: "🕳️",
        zoneId: "zone4",
        eggId: "neant"
      },
      {
        id: "duskveil",
        name: "Veilleur de la Brume Noire",
        element: "shadow",
        rarity: "rare",
        description: "Gardien silencieux des brumes où la lumière n'ose plus entrer.",
        image: "assets/dragons/dragon oeuf du neant rare2.png",
        icon: "👁️",
        zoneId: "zone4",
        eggId: "neant"
      },
      {
        id: "abyssor",
        name: "Seigneur des Abîmes Oubliés",
        element: "shadow",
        rarity: "epic",
        description: "Des abysses sans fond répondent à son appel.",
        image: "assets/dragons/dragon oeuf du neant epic.png",
        icon: "🖤",
        zoneId: "zone4",
        eggId: "neant"
      },
      {
        id: "sealedor",
        name: "Monarque du Néant Scellé",
        element: "shadow",
        rarity: "legendary",
        description: "Légende des sceaux brisés. Le vide lui-même porte sa couronne.",
        image: "assets/dragons/dragon oeuf du neant legendaire.png",
        icon: "👑",
        zoneId: "zone4",
        eggId: "neant"
      },
      {
        id: "primordyx",
        name: "Souverain du Néant Primordial",
        element: "shadow",
        rarity: "mythic",
        description: "Mythe antérieur aux royaumes. On dit qu'il précède la première lumière.",
        image: "assets/dragons/dragon oeuf du neant mythique.png",
        icon: "🌌",
        zoneId: "zone4",
        eggId: "neant"
      }
    ];

/* Attache les bonus de famille (rareté × zone) — remplace tout ancien bonus inline. */
DRAGON_DEFS.forEach(function (def) {
  var zoneTable = DRAGON_ZONE_RARITY_BONUSES[def.zoneId || "sanctuary"];
  if (!zoneTable) return;
  var curve = zoneTable[def.rarity];
  if (!curve) return;
  delete def.bonus;
  delete def.bonuses;
  var cloned = cloneDragonBonusCurve(curve);
  if (Array.isArray(cloned)) def.bonuses = cloned;
  else def.bonus = cloned;
});

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
        /* Tirage par rareté (voir RARITY_DROP_WEIGHTS dans game.js).
           weight=1 = égalité entre dragons d'une même rareté. */
        dragonPool: [
          { dragonId: "drakel", weight: 1 },
          { dragonId: "vyrn", weight: 1 },
          { dragonId: "aeryx", weight: 1 },
          { dragonId: "emberion", weight: 1 },
          { dragonId: "scaldris", weight: 1 },
          { dragonId: "vaelgor", weight: 1 },
          { dragonId: "astralyon", weight: 1 },
          { dragonId: "noctyron", weight: 1 }
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
        /* Tirage par rareté — pas d'Épique dans ce pool (poids absents ignorés / normalisés). */
        dragonPool: [
          { dragonId: "verdalis", weight: 1 },
          { dragonId: "mossik", weight: 1 },
          { dragonId: "florwyn", weight: 1 },
          { dragonId: "sylvagor", weight: 1 },
          { dragonId: "gaiathis", weight: 1 }
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
        /* Tirage par rareté — 5 raretés présentes. */
        dragonPool: [
          { dragonId: "rivulet", weight: 1 },
          { dragonId: "cascadeur", weight: 1 },
          { dragonId: "torrentis", weight: 1 },
          { dragonId: "spumara", weight: 1 },
          { dragonId: "abyssara", weight: 1 },
          { dragonId: "naiadryn", weight: 1 }
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
        id: "granite",
        name: "Œuf de Granit",
        description: "Un œuf de pierre ambrée, formé dans les failles de la Montagne sauvage.",
        image: "assets/eggs/oeuf granite.png",
        progressImages: {
          intact: "assets/eggs/oeuf granite.png",
          cracked35: "assets/eggs/oeuf granite35.png",
          /* Seul stade avancé présent dans les assets (nom historique 99). */
          cracked75: "assets/eggs/oeuf granite99.png"
        },
        background: "mountains",
        zoneId: "mountains",
        requiredHatchPower: 5000,
        requiredClicks: 5000,
        rarity: "common",
        element: "earth",
        startUnlocked: false,
        comingSoon: false,
        secret: false,
        visualOffsetX: 0,
        /* PNG Granit légèrement trop grand dans le cadre — ~9 % plus petit (91 %). */
        visualScale: 0.91,
        dragonPool: [
          { dragonId: "petrak", weight: 1 },
          { dragonId: "gritling", weight: 1 },
          { dragonId: "amberon", weight: 1 },
          { dragonId: "basaltis", weight: 1 },
          { dragonId: "mountainyx", weight: 1 },
          { dragonId: "auralith", weight: 1 }
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
        id: "storm",
        name: "Œuf des Tempêtes",
        description: "Un œuf chargé d'électricité d'altitude, né sous les orages des cimes.",
        image: "assets/eggs/oeuf tempete.png",
        progressImages: {
          intact: "assets/eggs/oeuf tempete.png",
          cracked35: "assets/eggs/oeuf tempete35.png",
          cracked75: "assets/eggs/oeuf tempete75.png"
        },
        background: "mountains",
        zoneId: "mountains",
        requiredHatchPower: 7000,
        requiredClicks: 7000,
        rarity: "common",
        element: "air",
        startUnlocked: false,
        comingSoon: false,
        secret: false,
        visualOffsetX: 0,
        /* PNG Tempête légèrement trop grand dans le cadre — ~9 % plus petit (91 %). */
        visualScale: 0.91,
        dragonPool: [
          { dragonId: "galeon", weight: 1 },
          { dragonId: "zephyric", weight: 1 },
          { dragonId: "stormyx", weight: 1 },
          { dragonId: "voltara", weight: 1 },
          { dragonId: "cimor", weight: 1 },
          { dragonId: "aetherion", weight: 1 }
        ],
        pity: {
          enabled: false,
          rules: [
            { rarity: "legendary", softPityAfter: 20, hardPityAt: 50 },
            { rarity: "mythic", softPityAfter: 80, hardPityAt: 200 }
          ]
        }
      },
      /* —— Zone 4 — Royaume oublié —— */
      {
        id: "reliques",
        name: "Œuf des Reliques",
        description: "Un œuf orné de reliques antiques. Les arcanes du Royaume oublié y sommeillent encore.",
        image: "assets/eggs/oeuf royaume oubliée.png",
        progressImages: {
          intact: "assets/eggs/oeuf royaume oubliée.png",
          cracked35: "assets/eggs/oeuf royaume oubliée35.png",
          cracked75: "assets/eggs/oeuf royaume oubliée75.png"
        },
        background: "zone4",
        zoneId: "zone4",
        requiredHatchPower: 9000,
        requiredClicks: 9000,
        rarity: "common",
        element: "arcane",
        startUnlocked: false,
        comingSoon: false,
        secret: false,
        visualOffsetX: 0,
        dragonPool: [
          { dragonId: "vestigis", weight: 1 },
          { dragonId: "ruinling", weight: 1 },
          { dragonId: "relicon", weight: 1 },
          { dragonId: "shardyx", weight: 1 },
          { dragonId: "thronyx", weight: 1 },
          { dragonId: "losthron", weight: 1 },
          { dragonId: "aeternyx", weight: 1 }
        ],
        pity: { enabled: false, rules: [] }
      },
      {
        id: "arcanes",
        name: "Œuf des Arcanes Oubliées",
        description: "Des runes éteintes courent sur sa coquille. La magie ancienne y attend d'être réveillée.",
        image: "assets/eggs/oeuf des arcanes.png",
        progressImages: {
          intact: "assets/eggs/oeuf des arcanes.png",
          cracked35: "assets/eggs/oeuf des arcanes35.png",
          cracked75: "assets/eggs/oeuf des arcanes75.png"
        },
        background: "zone4",
        zoneId: "zone4",
        requiredHatchPower: 12000,
        requiredClicks: 12000,
        rarity: "common",
        element: "arcane",
        startUnlocked: false,
        comingSoon: false,
        secret: false,
        visualOffsetX: 0,
        dragonPool: [
          { dragonId: "glyphling", weight: 1 },
          { dragonId: "fluxling", weight: 1 },
          { dragonId: "arcanist", weight: 1 },
          { dragonId: "portalix", weight: 1 },
          { dragonId: "archontis", weight: 1 },
          { dragonId: "glyphlord", weight: 1 },
          { dragonId: "nexusor", weight: 1 }
        ],
        pity: { enabled: false, rules: [] }
      },
      {
        id: "neant",
        name: "Œuf du Néant Ancien",
        description: "Un œuf baigné d'ombre primordiale. On dit qu'il précède les premiers royaumes.",
        image: "assets/eggs/oeuf du neant.png",
        progressImages: {
          intact: "assets/eggs/oeuf du neant.png",
          cracked35: "assets/eggs/oeuf du neant35.png",
          cracked75: "assets/eggs/oeuf du neant75.png"
        },
        background: "zone4",
        zoneId: "zone4",
        requiredHatchPower: 15000,
        requiredClicks: 15000,
        rarity: "common",
        element: "shadow",
        startUnlocked: false,
        comingSoon: false,
        secret: false,
        visualOffsetX: 0,
        dragonPool: [
          { dragonId: "voidling", weight: 1 },
          { dragonId: "mistling", weight: 1 },
          { dragonId: "riftara", weight: 1 },
          { dragonId: "duskveil", weight: 1 },
          { dragonId: "abyssor", weight: 1 },
          { dragonId: "sealedor", weight: 1 },
          { dragonId: "primordyx", weight: 1 }
        ],
        pity: { enabled: false, rules: [] }
      },
      {
        id: "citrouille",
        name: "Œuf Citrouille",
        description: "Un œuf orange sculpté par la Nuit d'Halloween. Des flammes dansent sous sa coquille.",
        image: "assets/event/halloween/eggs/oeuf citrouille.png",
        progressImages: {
          intact: "assets/event/halloween/eggs/oeuf citrouille.png",
          cracked35: "assets/event/halloween/eggs/oeuf citrouille35.png",
          cracked75: "assets/event/halloween/eggs/oeuf citrouille99.png"
        },
        background: "halloween",
        zoneId: "halloween",
        requiredHatchPower: 1200,
        requiredClicks: 1200,
        rarity: "common",
        element: "shadow",
        startUnlocked: false,
        comingSoon: false,
        secret: false,
        visualOffsetX: 0,
        dragonPool: [
          { dragonId: "jacklyn", weight: 1 },
          { dragonId: "patchyn", weight: 1 },
          { dragonId: "lanternis", weight: 1 },
          { dragonId: "gourdrak", weight: 1 },
          { dragonId: "harvestyx", weight: 1 },
          { dragonId: "citrogorn", weight: 1 },
          { dragonId: "samhainor", weight: 1 },
          { dragonId: "nightgourd", weight: 1 }
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
        id: "fantome",
        name: "Œuf Fantôme",
        description: "Un œuf spectral translucide. On entend parfois un murmure à l'intérieur.",
        image: "assets/event/halloween/eggs/oeuf fantome.png",
        progressImages: {
          intact: "assets/event/halloween/eggs/oeuf fantome.png",
          cracked35: "assets/event/halloween/eggs/oeuf fantome35.png",
          cracked75: "assets/event/halloween/eggs/oeuf fantome99.png"
        },
        background: "halloween",
        zoneId: "halloween",
        requiredHatchPower: 1800,
        requiredClicks: 1800,
        rarity: "common",
        element: "shadow",
        startUnlocked: false,
        comingSoon: false,
        secret: false,
        visualOffsetX: 0,
        dragonPool: [
          { dragonId: "spectrix", weight: 1 },
          { dragonId: "wispette", weight: 1 },
          { dragonId: "hauntis", weight: 1 },
          { dragonId: "phasmor", weight: 1 },
          { dragonId: "spectryon", weight: 1 },
          { dragonId: "oblivyx", weight: 1 }
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
