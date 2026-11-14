# Epic: UnTruc (MVP)

> **Source**: `design/game-brief.md` (rigor `minimal`: no GDD, no ADR)
> **Goal**: Élève un combattant, équipe-le, puis regarde la physique le faire se battre en tournoi : chaque coup pèse, aucun duel ne se ressemble.

## Scope
The brief's Features list (7 items). Order follows the brief's Build order:
1. Duel de bout en bout : moteur (001), stats (008), rythme et réactions (009), look piste 5 (010), puis armes (002) et effets (003).
2. Compétences lisibles, puis la compétence Transformation.
3. Prototypes de l'écran de gestion (plusieurs variantes), puis l'écran.
4. Choix du personnage (012), système de niveaux (011), puis tournoi solo (007).

Out of scope: see the brief (comptes, serveur, ligue en ligne, son, IA générative, rendu détaillé).

## Stories

| # | Story | Type | Status | ADR |
|---|-------|------|--------|-----|
| 001 | Moteur de duel ragdoll | Integration | Complete | N/A (minimal) |
| 002 | Armes physiques en données | Integration | Ready | N/A (minimal) |
| 003 | Effets d'impact | Visual/Feel | Ready | N/A (minimal) |
| 004 | Compétences lisibles | Visual/Feel | Ready | N/A (minimal) |
| 005 | Compétence Transformation loup-garou | Visual/Feel | Ready | N/A (minimal) |
| 006 | Écran de gestion du personnage | UI | Ready | N/A (minimal) |
| 007 | Tournoi solo | Logic | Ready | N/A (minimal) |
| 008 | Stats du combattant | Logic | Complete | N/A (minimal) |
| 009 | Rythme et réactions de combat | Integration | Complete | N/A (minimal) |
| 010 | Look des combattants de la piste 5 | Visual/Feel | Complete | N/A (minimal) |
| 011 | Système de niveaux | Logic | Ready | N/A (minimal) |
| 012 | Choix du personnage au début | UI | Ready | N/A (minimal) |
