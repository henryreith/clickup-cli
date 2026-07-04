# ClickUp CLI Gotchas

Hard-won facts that prevent wasted retries. Read this when a command fails unexpectedly.

## Exit codes

| Code | Meaning | What to do |
|------|---------|-----------|
| 0 | Success | - |
| 1 | General/API error | Read stderr; check `--debug` output |
| 2 | Invalid arguments | Fix the flag value; the error names the flag |
| 3 | Auth failure | Token missing/invalid: `clickup auth login` or set `CLICKUP_API_TOKEN` |
| 4 | Not found | Wrong ID, or the token lacks access to that resource |
| 5 | Permission denied | The token's user lacks access in ClickUp |
| 6 | Rate limited | Already retried automatically; back off before batch work |
| 7 | Network error | Timeout or connectivity; retry once, then report |

## Rate limits

- ClickUp allows ~100 requests/minute per token. The client retries 429s automatically, waiting for the reset window (capped at 60s).
- For bulk work prefer the built-in bulk commands (`task bulk-update`, `task bulk-delete`); they run 3-wide concurrency deliberately.
- Piping hundreds of IDs through `xargs` will hit the limit; batch in groups and expect pauses.

## Destructive commands

- Every true delete (and `field remove`, `time delete`) prompts in a terminal and requires `--confirm` when non-interactive. Agents must pass `--confirm` explicitly; never work around a missing confirmation.
- Reversible link removals (`tag remove`, `relation remove`, `dependency remove`, `guest remove-from-*`, `list remove-task`) do not prompt.
- `attachment download` refuses to overwrite an existing file without `--force`.

## Common error codes (ECODE)

| ECODE | Meaning |
|-------|---------|
| OAUTH_023 | Token invalid or expired: re-authenticate |
| OAUTH_024 | Token lacks permission for this action |
| ITEM_015 | Task not found: check the task ID |
| TEAM_015 | Workspace not found: check workspace ID or `clickup config set workspace_id <id>` |

## Input formats

- Dates accept Unix ms, Unix seconds (10 digits), ISO 8601 (`2026-07-10`), and relative forms (`today`, `tomorrow`, `3d`, `-1w`, `friday`, `next monday`). Filter flags ending in `-gt`/`-lt` take Unix ms only.
- Durations (time tracking) are milliseconds. 1h = 3600000.
- `--priority` accepts 1-4 or urgent/high/normal/low.
- Booleans passed as values (`--billable`, `--archived`) must be literal `true` or `false`.
- JSON field names in output match the ClickUp API exactly; there is no camelCase conversion.

## Output behavior

- Piped output defaults to JSON; interactive terminals get tables. Force with `--format`.
- `--format id` prints only the first result's ID: ideal for capture (`ID=$(clickup task create ... --format id)`).
- Status messages and spinners go to stderr; stdout carries only data.
- `skill show <name>` piped returns JSON with the skill body in the `content` field.

## Workspace resolution

- Most commands need a workspace ID. Resolution order: `--workspace-id` flag > `CLICKUP_WORKSPACE_ID` env > active profile > single-workspace auto-select.
- After login, `clickup workspace setup` stores it; `clickup config validate` shows what is active.
