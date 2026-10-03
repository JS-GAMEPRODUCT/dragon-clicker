/**
 * Dragon Clicker — Définition des événements saisonniers (UI / accès).
 * Pas de gameplay événement ici : cartes + états d'affichage uniquement.
 */
"use strict";

/**
 * status: "upcoming" | "active" | "ended"
 * theme: clé CSS visuelle de la carte (halloween, …)
 * startsAtLocal: { year, month (1–12), day, hour?, minute?, second? } — heure locale
 */
var EVENT_DEFS = [
  {
    id: "halloween",
    name: "Halloween",
    icon: "🎃",
    theme: "halloween",
    status: "upcoming",
    statusLabel: "Bientôt",
    shortDescription: "Un événement saisonnier se prépare dans le Royaume.",
    periodLabel: "Commence le 15 octobre",
    /* 15 octobre 2026 à 00:00 heure locale — pas de parsing de chaîne */
    startsAtLocal: { year: 2026, month: 10, day: 15, hour: 0, minute: 0, second: 0 },
    /* Visuel carte — asset réel assets/menu/world/zonehalloween.png */
    image: "assets/menu/world/zonehalloween.png",
    accessible: false
  }
];
