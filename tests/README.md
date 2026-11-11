# Test Infrastructure

**Engine**: Web (Vite 8.3.7)
**Test Framework**: Vitest 5.0.5 (the rules). Playwright is not installed (decided 2026-11-11); add it when a story needs the game driven in a browser.
**CI**: `.github/workflows/tests.yml`
**Setup date**: 2026-11-11

## Directory Layout

```
tests/
  unit/           # Vitest: the rules in src/core/, run in Node with no browser (fake DuelWorld in unit/duel/)
  integration/    # empty: reserved for Playwright tests, not installed yet
  smoke/          # Critical path test list for /smoke-check gate
```

```
production/qa/
  evidence/       # Screenshot logs and manual test sign-off records
```

> **Manual evidence lives under `production/qa/evidence/`, not `tests/`** — that
> is where every consumer reads it.

## Running Tests

```bash
npm test              # Vitest (tests/unit/**/*.test.ts)
npm run smoke         # tsc --noEmit, then the build
```

`npm test` exits 0 when every test passed and non-zero when one failed. With no
test file Vitest prints `No test files found` and fails; that is not a pass.
The game in a browser is still checked by hand (`npm run dev`, or a build
observed in a visible Chrome tab), with screenshots in `production/qa/evidence/`.

## Test Naming

Names follow the engine's language (`.claude/rules/test-standards.md`):
- **Web**: file `[module].test.ts` (Vitest) or `[system].spec.ts` (Playwright),
  test `'[scenario] [expected]'` — `rules.test.ts` → `it('keeps the square inside the field')`

## Story Type → Test Evidence

| Story Type | Required Evidence | Location |
|---|---|---|
| Logic | Automated unit test — must pass | `tests/unit/[system]/` |
| Integration | Integration test OR playtest doc | `tests/integration/[system]/` |
| Visual/Feel | Screenshot + lead sign-off | `production/qa/evidence/` |
| UI | Retained screenshot of each screen touched | `production/qa/evidence/` |
| Config/Data | Smoke check pass | `production/qa/smoke-*.md` |

## CI

Tests run automatically on every push to `main` and on every pull request.
A failed test suite blocks merging. CI runs `npm ci`, then `npm test`, with
the runner's Chrome.
