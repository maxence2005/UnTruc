// PROTOTYPE - NOT FOR PRODUCTION
// Question: Laquelle des trois mises en page rend armes et compétences les plus lisibles et le choix le plus agréable ?
// Date: 2026-11-09
// Every tuning value lives here, each with value, min, max and step. The game reads them live
// through tune.<name> (index.html); the tweak panel, an add-on, writes them back here.
window.CONFIG = {
  seed: 1, // the starting fighter's look is drawn from rng(), seeded from this (or ?seed=)
  skill_slots: { value: 3, min: 1, max: 6, step: 1 },        // compétences équipables
  icon_a: { value: 34, min: 20, max: 50, step: 1 },          // rayon des icônes, variante A (px)
  icon_b: { value: 46, min: 24, max: 60, step: 1 },          // rayon des icônes, variante B (px)
  icon_c: { value: 27, min: 18, max: 40, step: 1 },          // rayon des icônes de la réserve, variante C (px)
  tooltip_delay: { value: 0.25, min: 0, max: 1.5, step: 0.05 }, // survol avant l'info-bulle (s)
  touch_tooltip: { value: 2.0, min: 0.5, max: 5, step: 0.25 },  // durée de l'info-bulle au toucher (s)
  message_time: { value: 2.2, min: 0.5, max: 5, step: 0.1 },    // durée d'un message (s)
  volume: { value: 0.4, min: 0, max: 1, step: 0.05 },
};
