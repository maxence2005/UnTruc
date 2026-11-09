# Règles du projet UnTruc — à respecter avant toute action

UnTruc est un projet **personnel** de Maxence (jeu web, destiné à jeu.untruc.fr).
Il n'a **aucun lien avec iAdvize**, même s'il est développé sur le PC pro.

- N'utiliser aucun outil, connecteur ou MCP de l'organisation iAdvize (MCP iAdvize,
  Atlassian/Jira/Confluence, Datadog, CircleCI, Zendesk, Modjo, Google Drive/Docs/Slides
  du compte pro, GitHub de l'org `iadvize`).
- N'utiliser aucun skill ou plugin iAdvize (`shared:*`, `engineering:*`) : pas de charte
  iAdvize, pas de message map, pas de template de présentation iAdvize.
- Ne rien pousser, publier ou créer dans l'organisation iAdvize (repos, tickets, docs, artifacts).
- Git : uniquement le compte GitHub perso `maxence2005`, dépôt `maxence2005/UnTruc`.
  Avant tout push, vérifier que `origin` pointe bien vers ce dépôt.
- Ne pas importer de données, contenus ou informations internes iAdvize dans ce projet.
- Ne pas ajouter de serveur MCP sur cette machine pour ce projet (les skills sont OK).
- En cas de doute sur un outil ou une action : demander avant d'agir.

---

# Claude Code Game Studios -- Game Studio Agent Architecture

Indie game development managed through 49 coordinated Claude Code subagents.
Each agent owns a specific domain, enforcing separation of concerns and quality.

## Technology Stack

- **Engine**: Web (Vite 8.3.7; Phaser ^4.2.1)
- **Language**: TypeScript
- **Version Control**: Git with trunk-based development
- **Build System**: Vite — `npm run build` (the project's own scripts; no single-file build)
- **Asset Pipeline**: the project's own, as it is

> **Note**: Engine-specialist agents exist for Godot, Unity, and Unreal with
> dedicated sub-specialists. Use the set matching your engine.

## Project Structure

@.claude/docs/directory-structure.md

## Engine Version Reference

<!-- ENGINE-REFERENCE-IMPORT: the line under this comment is engine-specific,
     and there is none until an engine is set. /setup-engine, the grow's record
     step and /project-settings (engine.name) write
     @docs/engine-reference/<engine>/VERSION.md here for the chosen engine. Skills
     that need the pinned version read that file on demand either way. -->
@docs/engine-reference/web/VERSION.md


## Technical Preferences

`project.yaml` at the repo root is the primary config store — engine, specialists,
naming, platform, performance, modes. Skills resolve it via `resolve_config`
(see `.claude/docs/config-resolution.md`).

`.claude/docs/technical-preferences.md` is the **legacy fallback**, read on demand
when a key is absent from `project.yaml`. It is not imported here: before
`/setup-engine` runs it is almost entirely `[TO BE CONFIGURED]` placeholders, and
after it runs `project.yaml` holds the real values.

## Coordination Rules

@.claude/docs/coordination-rules.md

## Collaboration Protocol

**User-driven collaboration, not autonomous execution.**
Every task follows: **Question -> Options -> Decision -> Draft -> Approval**

- Agents MUST ask "May I write this to [filepath]?" before using Write/Edit tools
  (exempt: `active.md` appends, agent memory, a subagent's new file at the path
  its orchestrating skill named; see `.claude/rules/agent-memory.md`)
- Agents MUST show drafts or summaries before requesting approval
- Multi-file changes require explicit approval for the full changeset
- No commits without user instruction
- A skipped or dismissed question is not an answer: act on nothing, re-ask in
  plain text and wait
- Started outside this file's folder? Warn first: hooks, deny rules and the
  ask-first mode load only when Claude Code starts here

See `docs/COLLABORATIVE-DESIGN-PRINCIPLE.md` for full protocol and examples.

> **First session?** Say "make me a game" (`/prototype`), or run `/start` to begin
> the guided onboarding flow.

## Coding Standards

@.claude/docs/coding-standards.md

## Context Management

Read `.claude/docs/context-management.md` on demand — it is a reference, not
session context. Two of its conventions are load-bearing and cited by name
elsewhere in the repo, so they are restated here rather than lost:

- **`production/session-state/active.md` is the session checkpoint.** The file is
  the memory, not the conversation. Read it first after any compaction, crash, or
  `/clear`.
- **Helpers in `.claude/scripts/` emit observations, never verdicts.** A script
  that scores or judges will eventually contradict a mode or override it cannot
  see. (Cited by `artifact-check.sh` and `adr-dep-graph.sh`.)

## Contexte projet

@docs/contexte-projet.md
