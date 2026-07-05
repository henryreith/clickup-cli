# ClickUp CLI: Agent Operating Manual

You have (or can install) `clickup`, a command-line tool covering the full ClickUp API v2. This file is the fastest path from zero to productive for any agent on any platform. Everything here works headless.

## Setup

```bash
npm install -g clickup-agent-cli

# Authenticate: env var (preferred for agents), --token-file, or --token per call
export CLICKUP_API_TOKEN=pk_your_token

# Verify auth and workspace resolution
clickup config validate

# One-time workspace binding (auto-selects when the account has one workspace)
clickup workspace setup
```

## Discover, never guess

Do not guess command syntax. The CLI is self-describing:

```bash
clickup skill show clickup          # Root skill: index of all capabilities (~150 tokens)
clickup skill list                  # All 31 skills (12 resource references, 18 workflows)
clickup skill show <name>           # Full skill content (JSON with a "content" field when piped)
clickup skill path <name>           # Skill directory: bundled references/, assets/, scripts/
clickup schema <resource>           # Actions for a resource (task, list, doc, time, ...)
clickup schema <resource>.<action>  # Required and optional flags for one action
```

Skills bundle supporting files per the Agent Skills standard: `assets/report-template.md` (copy the structure for report output), `scripts/*.mjs` (deterministic helpers; pipe JSON in via node), and `references/` (deep detail such as `clickup skill path clickup`/references/gotchas.md).

## Conventions that matter

- **Output**: JSON by default when piped; force with `--format json|table|csv|tsv|quiet|id|md`. `--format id` prints just the first result's ID for capture: `ID=$(clickup task create ... --format id)`.
- **Exit codes**: 0 ok, 1 general, 2 bad arguments, 3 auth, 4 not found, 5 permission, 6 rate limited, 7 network. Branch on these.
- **Destructive commands** (`* delete`, `field remove`, `time delete`) require `--confirm` when non-interactive. Pass it deliberately; never bypass a confirmation you were not asked to give.
- **Dates**: Unix ms/seconds, ISO 8601 (`2026-07-10`), or relative (`today`, `tomorrow`, `3d`, `-1w`, `friday`). Filter flags ending `-gt`/`-lt` take Unix ms only.
- **Rate limits**: ~100 requests/min; 429s retry automatically. Prefer `task bulk-update`/`task bulk-delete` for batches.
- **Dry runs**: add `--dry-run` to print the exact request without sending it.
- Errors and spinners go to stderr; stdout is data only. Safe to pipe.

## Quick example

```bash
# Find the list, create a task, comment on it
LIST_ID=$(clickup list list --space-id 123 --filter name="Sprint 12" --format id)
TASK_ID=$(clickup task create --list-id "$LIST_ID" --name "Fix login redirect" \
  --priority high --due-date friday --format id)
clickup comment create --task-id "$TASK_ID" --text "Repro steps in thread"
```

## For Claude Code specifically

Install as a plugin instead: `/plugin marketplace add henryreith/clickup-cli` then `/plugin install clickup@clickup-agent-cli`. Skills load natively (`/clickup:weekly-review`, etc.).

## Developing this repo

Build/test conventions live in [CLAUDE.md](./CLAUDE.md): `npm run typecheck && npm test && npm run build && npm run lint:skills` must pass. The full command reference is [COMMANDS.md](./COMMANDS.md); architecture is [SPEC.md](./SPEC.md).
