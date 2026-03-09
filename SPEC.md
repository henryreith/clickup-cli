# ClickUp CLI - Technical Specification

## 1. Overview

**Name:** `clickup-cli`
**Binary:** `clickup`
**License:** MIT
**Status:** Open-source, no official ClickUp CLI exists. This fills that gap.

A comprehensive CLI covering the entire ClickUp API v2 surface. Works for humans, Claude Code, OpenAI agents, and any automation tool that can invoke a shell command. Designed to be composable, scriptable, and AI-agent-friendly from the ground up.

Goals:
- Full API v2 coverage (workspaces, spaces, folders, lists, tasks, comments, time tracking, goals, views, webhooks, docs, custom fields, and more)
- Predictable, parseable output in multiple formats
- Sensible defaults for human use, headless-safe behavior for automation
- Zero-dependency HTTP (Node 22 native fetch)
- Fast cold start (no heavy framework)
- AI-agent-native: hierarchical skills system for near-zero token overhead when used by LLM agents
- Built-in schema introspection so agents can discover commands and fields at runtime

Non-goals:
- Real-time push (no websocket/live dashboard)
- ClickUp API v3 (still rolling out, incomplete coverage)
- GUI or TUI

---

## 2. Tech Stack

| Concern | Package | Version | Why |
|---------|---------|---------|-----|
| Runtime | Node.js | >= 22 | Native fetch, stable ESM, no polyfills |
| Language | TypeScript | ^5.5 | Strict mode, ESM modules |
| CLI framework | commander | ^12 | Lightweight, chainable API, excellent TS support, subcommand nesting |
| Colors | chalk | ^5 | ESM-native terminal coloring |
| Interactive prompts | @inquirer/prompts | ^7 | Modern ESM inquirer for setup flows |
| Spinners | ora | ^8 | Progress indication during API calls |
| Tables | cli-table3 | latest | Flexible table output formatting |
| Config storage | conf | ^13 | XDG-compliant persistent config |
| Validation | zod | ^3 | Input validation and API response parsing |
| HTTP | Native fetch | built-in | Node 22+ built-in, zero dependencies |
| Build | tsup | latest | Fast ESM bundling with shebang injection |
| Test | vitest | latest | Fast, TypeScript-native |

---

## 3. Project Structure

```
clickup-cli/
  package.json
  tsconfig.json
  tsup.config.ts
  vitest.config.ts
  LICENSE
  README.md
  CLAUDE.md
  bin/
    clickup.ts              # Entry point with shebang
  src/
    cli.ts                  # Root program definition, global options
    client.ts               # HTTP client (auth, base URL, rate limiting, retry)
    config.ts               # conf-based persistent config (token, workspace, defaults)
    auth.ts                 # Personal token + OAuth2 flow
    output.ts               # Output formatter (json, table, csv, quiet, yaml)
    errors.ts               # Error types, API error parsing, user-friendly messages
    pagination.ts           # Cursor/page-based pagination helpers
    dates.ts                # Date parsing and formatting utilities
    types/
      index.ts              # Re-exports
      workspace.ts
      space.ts
      folder.ts
      list.ts
      task.ts
      comment.ts
      checklist.ts
      custom-field.ts
      goal.ts
      view.ts
      time-tracking.ts
      user.ts
      webhook.ts
      tag.ts
      template.ts
      role.ts
      guest.ts
      doc.ts
    commands/
      workspace.ts
      space.ts
      folder.ts
      list.ts
      task.ts
      checklist.ts
      comment.ts
      custom-field.ts
      tag.ts
      dependency.ts
      relation.ts
      time.ts
      goal.ts
      view.ts
      member.ts
      user.ts
      group.ts
      role.ts
      guest.ts
      webhook.ts
      template.ts
      shared-hierarchy.ts
      custom-task-type.ts
      attachment.ts
      doc.ts
      config-cmd.ts
      auth-cmd.ts
    __tests__/
      client.test.ts
      output.test.ts
      config.test.ts
      dates.test.ts
      commands/
        task.test.ts
        space.test.ts
        folder.test.ts
        list.test.ts
        comment.test.ts
        checklist.test.ts
        custom-field.test.ts
        tag.test.ts
        dependency.test.ts
        time.test.ts
        goal.test.ts
        view.test.ts
        member.test.ts
        webhook.test.ts
        doc.test.ts
      fixtures/
        workspace.json
        space.json
        folder.json
        list.json
        task.json
        comment.json
        goal.json
        view.json
        time-entry.json
        webhook.json
  skills/                       # Agent skill files (bundled in npm package)
    clickup/
      SKILL.md                  # Root skill - lightweight index for agents
    clickup-tasks/
      SKILL.md                  # Tasks sub-skill
    clickup-spaces/
      SKILL.md                  # Spaces, folders, lists sub-skill
    clickup-comments/
      SKILL.md                  # Comments and communication sub-skill
    clickup-time/
      SKILL.md                  # Time tracking sub-skill
    clickup-goals/
      SKILL.md                  # Goals and key results sub-skill
    clickup-views/
      SKILL.md                  # Views sub-skill
    clickup-users/
      SKILL.md                  # Users, groups, guests, roles sub-skill
    clickup-webhooks/
      SKILL.md                  # Webhooks sub-skill
    clickup-fields/
      SKILL.md                  # Custom fields, tags, task types sub-skill
    clickup-weekly-review/
      SKILL.md                  # Recipe: weekly team review
    clickup-sprint-planning/
      SKILL.md                  # Recipe: sprint planning workflow
    clickup-task-triage/
      SKILL.md                  # Recipe: incoming task triage
    clickup-standup/
      SKILL.md                  # Recipe: daily standup report
    clickup-sprint-closeout/
      SKILL.md                  # Recipe: sprint closeout and retro
    clickup-time-audit/
      SKILL.md                  # Recipe: time tracking audit
    clickup-project-setup/
      SKILL.md                  # Recipe: new project scaffolding
    clickup-capacity-check/
      SKILL.md                  # Recipe: team capacity and workload check
    clickup-blocker-report/
      SKILL.md                  # Recipe: blocked tasks and dependency report
    clickup-goal-progress/
      SKILL.md                  # Recipe: goal and OKR progress report
```

### File Responsibilities

| File | Responsibility |
|------|---------------|
| `bin/clickup.ts` | Shebang entry point. Imports cli.ts, calls program.parse(). |
| `src/cli.ts` | Creates root Commander program, registers all subcommand groups, wires global options. |
| `src/client.ts` | ClickUpClient class: fetch wrapper with auth headers, retry, rate limit handling. |
| `src/config.ts` | Read/write persistent config via `conf`. Resolves config from flag > env > stored config. |
| `src/auth.ts` | Token validation, OAuth2 PKCE flow, token storage. |
| `src/output.ts` | Formats data as table, json, csv, tsv, quiet, or id. Auto-detects TTY. |
| `src/errors.ts` | ClickUpError class, ECODE mapping, exit code constants. |
| `src/pagination.ts` | Async generator for page-based and cursor-based pagination. |
| `src/dates.ts` | Parse human date strings to Unix ms, format Unix ms to human strings. |
| `src/types/*.ts` | Zod schemas and inferred TypeScript types for every ClickUp resource. |
| `src/commands/*.ts` | One file per resource group. Each exports a `register*Commands()` function. |
| `src/commands/schema-cmd.ts` | Schema introspection: list resources, describe actions, show fields. |
| `src/commands/skill-cmd.ts` | Skill management: list available skills, output skill content to stdout. |
| `src/schema.ts` | Schema registry: maps resource.action to field definitions for introspection. |
| `skills/*/SKILL.md` | Agent skill files. Root skill, sub-skills per resource, and recipe skills. |

---

## 4. Authentication

### 4.1 Personal API Token (primary)

```
clickup auth login --token <token>
```

- If `--token` is omitted and stdin is a TTY, prompt interactively.
- Validate the token by calling `GET /user` before storing.
- Store in the conf config store at the platform-appropriate path (see Section 5).

```
clickup auth logout         # Remove stored token
clickup auth status         # Show current auth source and user info
clickup auth whoami         # Alias for auth status
```

### 4.2 OAuth2 (for app distribution)

```
clickup auth login --oauth
```

Flow:
1. Generate PKCE code verifier and challenge.
2. Start a local HTTP server on `http://localhost:9876/callback`.
3. Open the browser to the ClickUp OAuth authorize URL with `response_type=code`, `client_id`, `redirect_uri`, and `code_challenge`.
4. Wait for the redirect with `?code=` parameter.
5. Exchange code for access token via `POST /oauth/token` with the code verifier.
6. Store the access token identically to a personal token.
7. Shut down the local server.

Required env vars for OAuth: `CLICKUP_CLIENT_ID`, `CLICKUP_CLIENT_SECRET`.
If either is missing, print a clear error and exit with code 2.

### 4.3 Auth Resolution Order

Highest priority first:

1. `--token <token>` flag on the current command
2. `CLICKUP_API_TOKEN` environment variable
3. Token stored in config (from `clickup auth login`)

If no token is found from any source, print:
```
No authentication token found. Run: clickup auth login
```
Exit with code 3.

---

## 5. Configuration

Stored via `conf` at the XDG-compliant path for each platform:
- Linux: `~/.config/clickup-cli/config.json`
- macOS: `~/Library/Preferences/clickup-cli/config.json`
- Windows: `%APPDATA%\clickup-cli\config.json`

### 5.1 Config Keys

| Key | Description | Default |
|-----|-------------|---------|
| `token` | API token | (none) |
| `workspace_id` | Default workspace ID | (none) |
| `output_format` | Default output format | `table` |
| `color` | Enable/disable color | `true` |
| `page_size` | Default pagination page size | `100` |
| `timezone` | Timezone for date display | system timezone |

### 5.2 Environment Variable Overrides

Every config key maps to a `CLICKUP_<KEY>` env var (uppercase). Env vars override stored config but lose to explicit CLI flags.

| Config key | Env var |
|------------|---------|
| `token` | `CLICKUP_API_TOKEN` |
| `workspace_id` | `CLICKUP_WORKSPACE_ID` |
| `output_format` | `CLICKUP_OUTPUT_FORMAT` |
| `color` | `CLICKUP_COLOR` |
| `page_size` | `CLICKUP_PAGE_SIZE` |
| `timezone` | `CLICKUP_TIMEZONE` |

### 5.3 Config Commands

```
clickup config set <key> <value>    # Set a config value
clickup config get <key>            # Get a config value
clickup config list                 # Show all config
clickup config unset <key>          # Remove a config value
clickup config path                 # Print path to config file
```

---

## 6. Output Format System

Every data-returning command accepts these flags:

```
--format <table|json|csv|tsv|quiet|id>   # Output format (default: table for TTY, json for non-TTY)
--no-color                                # Disable ANSI colors
--no-header                               # Omit column headers (table, csv, tsv)
--fields <field1,field2,...>              # Show only specified fields/columns
--filter <key=value>                      # Client-side filter on output rows
--sort <field[:asc|:desc]>               # Client-side sort
--limit <n>                               # Cap total results returned
```

### Format Descriptions

**table** (default for TTY)
Aligned columns using cli-table3. Column definitions are per-resource (see command pattern in Section 13). Respects `--fields` to show a subset. Truncates long values with ellipsis.

**json** (default when stdout is not a TTY)
Full API response data, pretty-printed with 2-space indent. When a list is returned, outputs a JSON array. When a single item is returned, outputs the object. Exact ClickUp API field names, no renaming.

**csv / tsv**
Flat columnar output. Header row first (unless `--no-header`). Values are quoted if they contain commas or newlines. TSV uses tab separator.

**quiet**
One item ID per line. For list commands. Designed for shell piping and xargs.

**id**
Single ID on stdout. For create commands. Designed for capturing output with `$(...)`.

### Auto-detection

When stdout is not a TTY (piped, redirected, or running headless):
- Default format switches from `table` to `json`
- Spinner and progress output go to stderr (never stdout)
- No interactive prompts - missing required args produce an error

---

## 7. Global Options

These options are available on every command:

```
--token <token>           Override auth token for this invocation
--workspace-id <id>       Override default workspace
--format <format>         Output format (table|json|csv|tsv|quiet|id)
--no-color                Disable colors
--verbose                 Show request URL, method, status, timing
--dry-run                 Print what would be sent, exit without executing
--debug                   Full debug: headers (token redacted), response body, timing
--help                    Show command help
--version                 Show CLI version
```

Global options are defined on the root Commander program and inherited by all subcommands. Access them via `program.opts()` inside command actions.

---

## 8. HTTP Client Architecture

### 8.1 Interface

```typescript
interface ClickUpClientOptions {
  token: string
  baseUrl?: string          // default: 'https://api.clickup.com/api/v2'
  maxRetries?: number       // default: 3
  retryDelay?: number       // base delay in ms, default: 1000
  timeout?: number          // request timeout in ms, default: 30000
  verbose?: boolean
  debug?: boolean
  dryRun?: boolean
}

class ClickUpClient {
  get<T>(path: string, params?: Record<string, string>): Promise<T>
  post<T>(path: string, body?: unknown): Promise<T>
  put<T>(path: string, body?: unknown): Promise<T>
  patch<T>(path: string, body?: unknown): Promise<T>
  delete<T>(path: string): Promise<T>
  upload<T>(path: string, filePath: string, filename?: string): Promise<T>
}
```

### 8.2 Request Construction

Every request:
- Sets `Authorization: <token>` header
- Sets `Content-Type: application/json` for POST/PUT/PATCH
- Appends query params via `URLSearchParams`
- Enforces timeout via `AbortController`

```typescript
async function request<T>(
  method: string,
  path: string,
  options: { params?: Record<string, string>; body?: unknown }
): Promise<T>
```

### 8.3 Rate Limiting

ClickUp sends these headers on every response:
- `X-RateLimit-Limit`: requests allowed per window
- `X-RateLimit-Remaining`: requests left in current window
- `X-RateLimit-Reset`: Unix timestamp (seconds) when window resets

Behavior:
- Track remaining across requests.
- When `X-RateLimit-Remaining` is 0 (or a 429 is received), compute wait time from `X-RateLimit-Reset`.
- Show spinner on stderr: `Rate limited. Waiting Xs...`
- Wait, then retry.

Limit: 100 requests per minute per token (per ClickUp docs).

### 8.4 Retry Logic

Retry on:
- HTTP 429 (rate limited) - after the rate limit wait described above
- HTTP 500, 502, 503, 504

Never retry on:
- HTTP 400, 401, 403, 404, 422 (client errors, not transient)

Retry schedule (exponential backoff):
- Attempt 1: wait 1s
- Attempt 2: wait 2s
- Attempt 3: wait 4s
- Attempt 4: fail with exit code

After `maxRetries` exhausted, throw a `ClickUpError` with code 6.

### 8.5 Verbose / Debug / Dry Run

- `--verbose`: log to stderr - `[GET] /task/abc 200 OK (143ms)`
- `--debug`: additionally log request headers (value of Authorization shown as `<redacted>`) and full response body JSON
- `--dry-run`: log the full request that would be sent (method, URL, headers, body), then exit with code 0 without sending

### 8.6 File Upload

For attachment commands:
- Read file from disk using `fs.createReadStream`
- Build `FormData` with file and optional filename override
- Do not set `Content-Type` manually (let fetch set multipart boundary)

---

## 9. Error Handling

### 9.1 ClickUp API Error Format

ClickUp returns errors as:
```json
{ "err": "Human readable message", "ECODE": "ITEM_015" }
```

Parse this in the client. Throw a `ClickUpError` with the ECODE, message, HTTP status, and the full response body.

### 9.2 ECODE and Status Mapping

| ECODE / Status | User-facing message |
|----------------|---------------------|
| `OAUTH_023` | Invalid or expired token. Run: `clickup auth login` |
| `OAUTH_024` | Token does not have permission for this action. |
| `ITEM_015` | Task not found. Check the task ID. |
| `TEAM_015` | Workspace not found. Check the workspace ID or run `clickup config set workspace_id <id>`. |
| `401` | Authentication failed. Run: `clickup auth login` |
| `403` | Permission denied. Check your access level in ClickUp. |
| `404` | Resource not found. Verify the ID. |
| `429` | Rate limited. Retrying automatically... |
| `500+` | ClickUp server error. Retrying... |

For unknown ECODEs, display the raw `err` message from the API.

### 9.3 Exit Codes

| Code | Meaning |
|------|---------|
| `0` | Success |
| `1` | General error |
| `2` | Invalid arguments or missing required options |
| `3` | Authentication failure |
| `4` | Resource not found |
| `5` | Permission denied |
| `6` | Rate limited (after retries exhausted) |
| `7` | Network or connection error |

Always print the error message to stderr before exiting with a non-zero code.

### 9.4 Zod Validation Errors

For CLI input validation:
- Validate before sending any request
- Print the field name, received value, and what was expected
- Exit with code 2

Example:
```
Error: Invalid value for --due-date
  Received: "march fifteen"
  Expected: ISO 8601 date, relative date (+3d, tomorrow), or Unix ms timestamp
```

For API response parsing:
- If the API returns a shape that does not match the Zod schema, log a warning to stderr
- Still return the raw data (do not crash on unexpected extra fields)
- Use `.passthrough()` on Zod schemas so extra API fields are preserved in JSON output

---

## 10. Pagination

### 10.1 Page-based (tasks, most list endpoints)

ClickUp uses `page` query param starting at 0. An empty array response signals the last page.

### 10.2 Cursor-based (some endpoints)

Some endpoints use `start` and `start_id` params for cursor-based traversal.

### 10.3 Async Generator Interface

```typescript
async function* paginate<T>(
  fetchPage: (cursor: PageCursor) => Promise<PageResult<T>>,
  options: PaginateOptions
): AsyncGenerator<T>

interface PageCursor {
  page: number
  start?: number
  start_id?: string
}

interface PageResult<T> {
  items: T[]
  nextCursor?: PageCursor
  hasMore: boolean
}

interface PaginateOptions {
  limit?: number        // Stop after N total items
  pageSize?: number     // Items per page request
}
```

### 10.4 Behavior

- Auto-paginate by default: fetch all pages, yield items as they arrive.
- `--page <n>`: fetch only that specific page (0-indexed), output it, stop.
- `--limit <n>`: stop after N total items across all pages.
- Show spinner on stderr during multi-page fetches: `Fetching page 3...`
- Stream output to stdout as rows arrive (do not buffer all pages before printing).

---

## 11. Date Handling

ClickUp timestamps are Unix milliseconds.

### 11.1 Accepted Input Formats

| Input | Example | Notes |
|-------|---------|-------|
| ISO 8601 date | `2026-03-15` | Interpreted as midnight in configured timezone |
| ISO 8601 datetime | `2026-03-15T14:00:00` | Interpreted in configured timezone |
| ISO 8601 with offset | `2026-03-15T14:00:00-05:00` | Offset honored |
| Relative - named | `today`, `tomorrow`, `yesterday` | Relative to current day |
| Relative - offset | `+3d`, `-1w`, `+2h`, `-30m` | Units: d=days, w=weeks, h=hours, m=minutes |
| Named day | `next monday`, `next friday` | Next occurrence of that weekday |
| Unix ms passthrough | `1742169600000` | Passed directly to API |

All parsing happens in `src/dates.ts`. No external date library (keep it lightweight). Use `Date` built-ins and a small set of regex patterns.

### 11.2 Display

Convert Unix ms timestamps to human-readable strings in the user's local timezone (or `CLICKUP_TIMEZONE` / `timezone` config key).

Default display format: `2026-03-15 14:00` (no seconds unless nonzero).

In JSON output, preserve the raw Unix ms value from the API.

---

## 12. AI Agent Ergonomics

Design choices that make the CLI excellent for AI agents. The architecture follows the CLI-as-execution-layer, skills-as-guidance-layer pattern (see the Google Workspace CLI for prior art). The key insight: agents should not load the full API surface into context. They load a lightweight root skill, then fetch sub-skills and schemas on demand.

### 12.1 Output and Behavior

**1. JSON by default when not in a TTY**
When stdout is not a TTY (piped, headless, subprocess), output defaults to JSON without needing any flags. Agents get structured data automatically.

**2. Quiet/ID mode for piping**
`--format quiet` gives one ID per line. `--format id` gives the single ID of a created resource. Both designed for xargs and subshell capture.

**3. Predictable exit codes**
All exit codes are documented (Section 9.3). Agents can branch on exit code reliably.

**4. Dry run**
`--dry-run` shows exactly what request would be sent. Agents can preview mutations before executing them.

**5. No interactive prompts in non-TTY mode**
If a required argument is missing and stdin is not a TTY, print a clear error message and exit with code 2. Never hang waiting for input.

**6. Stable field names**
JSON output uses the exact ClickUp API field names. No renaming, no camelCase conversion. What the API returns is what you get.

**7. Stderr for all non-data output**
Spinners, progress messages, warnings, and errors go to stderr. Only structured data goes to stdout. Safe to pipe without filtering noise.

**8. Composable patterns**

List task IDs, then get each:
```sh
clickup task list --list-id abc123 --format quiet | xargs -I{} clickup task get {}
```

Create a task and capture its ID:
```sh
TASK_ID=$(clickup task create --list-id abc123 --name "Fix bug" --format id)
clickup comment create --task-id "$TASK_ID" --text "Starting work"
```

### 12.2 Skills Architecture

The CLI ships with a hierarchical skills system that enables AI agents to use ClickUp with near-zero token overhead. Instead of injecting the entire API surface into every LLM call (as MCP does), agents load a tiny root skill and fetch deeper context only when needed.

**Three tiers:**

| Tier | Purpose | Token cost | Example |
|------|---------|------------|---------|
| Root skill | Index and router. Tells the agent what the CLI does and how to learn more. | ~100-200 tokens | `skills/clickup/SKILL.md` |
| Sub-skills | Per-resource command reference. Loaded on demand when the agent needs a specific resource. | ~200-500 tokens each | `skills/clickup-tasks/SKILL.md` |
| Recipe skills | Multi-step workflow guides. Coordinate across multiple resources for common PM workflows. | ~300-600 tokens each | `skills/clickup-weekly-review/SKILL.md` |

**How an agent uses the skills:**

1. The root skill (`skills/clickup/SKILL.md`) lives in the agent's system prompt or is loaded at session start. It lists available sub-skills and recipes.
2. When the agent needs to perform an action (e.g., create a task), it reads the relevant sub-skill (`skills/clickup-tasks/SKILL.md`) or runs `clickup schema tasks.create` for just-in-time field detail.
3. For complex workflows (e.g., sprint planning), the agent reads a recipe skill that orchestrates multiple commands in sequence.
4. The agent never needs the full API spec in context. Total token cost per action: the root skill (~150 tokens) + one sub-skill (~300 tokens) = ~450 tokens vs. thousands for a full tool schema.

**Skill file format:**

Every skill is a directory containing a `SKILL.md` file following the Anthropic Agent Skills standard:

```markdown
---
name: clickup-tasks
description: Create, update, search, and manage ClickUp tasks, subtasks, checklists, and dependencies.
---

# ClickUp Tasks

[Instructions the agent follows when this skill is active]

## Commands
[Exact CLI syntax with flags]

## Common Patterns
[Recipes and examples specific to this resource]

## Discovery
[How to get more detail: `clickup schema tasks.create`, `clickup task --help`]
```

Required frontmatter fields:
- `name`: Unique identifier (lowercase, hyphens)
- `description`: When to use this skill (used by agent platforms for skill discovery)

**Skill distribution:**

Skills are both files in the repo (`skills/` directory) and bundled in the npm package. Two access paths:

1. **File-based:** Agents read skill files directly from the repo or installed package location
2. **CLI-based:** `clickup skill list` shows available skills; `clickup skill show <name>` outputs the SKILL.md content to stdout

The CLI-based path means agents can discover and load skills without knowing the file system location.

**Platform integration:**

Agent platforms discover skills through their own conventions:

| Platform | Discovery path |
|----------|---------------|
| Claude Code | `skills/` directory in project root (auto-discovered) |
| Gemini CLI | Symlink or copy to `~/.gemini/skills/` |
| Custom agents | Read `skills/clickup/SKILL.md` or run `clickup skill show clickup` |

### 12.3 Schema Introspection

The `clickup schema` command provides runtime introspection so agents can discover exactly what fields a command needs without loading full documentation.

```
clickup schema                           # List all resources and actions
clickup schema tasks                     # List all task actions (list, get, create, update, delete, ...)
clickup schema tasks.create              # Show fields for task creation
clickup schema tasks.list                # Show available filter flags for task listing
clickup schema tasks.create --format json  # Machine-readable field definitions
```

**Schema output for `clickup schema tasks.create`:**

```
Tasks > Create

Required:
  --list-id <id>       string    List to create the task in
  --name <name>        string    Task name

Optional:
  --description <desc>     string    Plain text description
  --status <s>             string    Initial status name
  --priority <1-4>         integer   1=urgent, 2=high, 3=normal, 4=low
  --due-date <date>        timestamp Due date
  --start-date <date>      timestamp Start date
  --assignee <id>...       integer[] User IDs to assign
  --tag <name>...          string[]  Tag names to apply
  --time-estimate <ms>     integer   Time estimate in milliseconds
  --parent <task-id>       string    Create as subtask of this task
  --custom-field <id=val>  string[]  Set custom field values
```

In JSON format (`--format json`), the output is a machine-readable object:

```json
{
  "resource": "tasks",
  "action": "create",
  "required": [
    { "flag": "--list-id", "type": "string", "description": "List to create the task in" },
    { "flag": "--name", "type": "string", "description": "Task name" }
  ],
  "optional": [
    { "flag": "--description", "type": "string", "description": "Plain text description" },
    { "flag": "--priority", "type": "integer", "description": "1=urgent, 2=high, 3=normal, 4=low" }
  ]
}
```

The schema registry lives in `src/schema.ts` and is populated from the same Zod schemas used for validation. This keeps schema introspection and actual validation in sync.

### 12.4 Relationship to ClickUp's Official MCP Server

ClickUp provides an official MCP server for use with MCP-compatible clients. The CLI and skills system is a complementary approach, not a replacement:

| Concern | CLI + Skills | MCP Server |
|---------|-------------|------------|
| Token overhead per call | Near zero (root skill + sub-skill) | Full tool schema on every turn |
| Discovery | `clickup schema`, `--help`, skill files | Tool definitions in context |
| Transport | Shell execution (bash) | JSON-RPC over stdio |
| Works with | Any agent that can run shell commands | MCP-compatible hosts only |
| Best for | Claude Code, Gemini CLI, Codex, custom agents | Claude Desktop, Cursor, VS Code |

For agents running in a terminal environment (Claude Code, Gemini CLI, Codex CLI), the CLI + skills approach is strictly more token-efficient. For GUI-based MCP hosts, point users to ClickUp's official MCP server.

---

## 13. Command Implementation Pattern

Every command file follows this structure:

```typescript
// src/commands/space.ts
import { Command } from 'commander'
import { z } from 'zod'
import type { ClickUpClient } from '../client.js'
import { formatOutput } from '../output.js'
import { resolveWorkspaceId } from '../config.js'

// Zod schema for this resource
const SpaceSchema = z.object({
  id: z.string(),
  name: z.string(),
  private: z.boolean(),
  color: z.string().nullable(),
  statuses: z.array(z.object({ id: z.string(), status: z.string(), color: z.string() })),
  multiple_assignees: z.boolean(),
  features: z.record(z.unknown()),
}).passthrough()

// Column definitions for table output
const SPACE_COLUMNS = [
  { key: 'id',      header: 'ID',      width: 14 },
  { key: 'name',    header: 'Name',    width: 30 },
  { key: 'private', header: 'Private', width: 8  },
  { key: 'color',   header: 'Color',   width: 10 },
]

// Named export - called from cli.ts
export function registerSpaceCommands(program: Command, client: ClickUpClient): void {
  const space = program.command('space').description('Manage ClickUp spaces')

  space
    .command('list')
    .description('List spaces in a workspace')
    .option('--workspace-id <id>', 'Workspace ID (overrides config)')
    .option('--archived', 'Include archived spaces', false)
    .action(async (opts) => {
      const workspaceId = resolveWorkspaceId(opts.workspaceId)
      const data = await client.get<{ spaces: unknown[] }>(
        `/team/${workspaceId}/space`,
        { archived: opts.archived ? 'true' : 'false' }
      )
      const spaces = data.spaces.map(s => SpaceSchema.parse(s))
      formatOutput(spaces, SPACE_COLUMNS, program.opts())
    })

  space
    .command('get <space-id>')
    .description('Get a space by ID')
    .action(async (spaceId) => {
      const data = await client.get<unknown>(`/space/${spaceId}`)
      const space = SpaceSchema.parse(data)
      formatOutput([space], SPACE_COLUMNS, program.opts())
    })

  space
    .command('create')
    .description('Create a space in a workspace')
    .option('--workspace-id <id>', 'Workspace ID')
    .requiredOption('--name <name>', 'Space name')
    .option('--private', 'Make space private', false)
    .option('--color <hex>', 'Space color (hex code)')
    .action(async (opts) => {
      const workspaceId = resolveWorkspaceId(opts.workspaceId)
      const data = await client.post<unknown>(`/team/${workspaceId}/space`, {
        name: opts.name,
        private: opts.private,
        color: opts.color,
      })
      const space = SpaceSchema.parse(data)
      formatOutput([space], SPACE_COLUMNS, { ...program.opts(), format: program.opts().format ?? 'id' })
    })

  space
    .command('update <space-id>')
    .description('Update a space')
    .option('--name <name>', 'New name')
    .option('--color <hex>', 'New color')
    .option('--private', 'Make private')
    .option('--no-private', 'Make public')
    .action(async (spaceId, opts) => {
      const body: Record<string, unknown> = {}
      if (opts.name !== undefined) body.name = opts.name
      if (opts.color !== undefined) body.color = opts.color
      if (opts.private !== undefined) body.private = opts.private
      const data = await client.put<unknown>(`/space/${spaceId}`, body)
      const space = SpaceSchema.parse(data)
      formatOutput([space], SPACE_COLUMNS, program.opts())
    })

  space
    .command('delete <space-id>')
    .description('Delete a space')
    .option('--confirm', 'Skip confirmation prompt')
    .action(async (spaceId, opts) => {
      await confirmDestructive(opts.confirm, `Delete space ${spaceId}?`)
      await client.delete(`/space/${spaceId}`)
      process.stdout.write(`Deleted space ${spaceId}\n`)
    })
}
```

Key patterns:
- Zod schema with `.passthrough()` for every resource type
- Column definitions array for table output
- `resolveWorkspaceId(opts.workspaceId)` checks flag > env > config
- `formatOutput(rows, columns, program.opts())` handles all format switching
- Named export `register*Commands()` called from `cli.ts`
- `confirmDestructive()` helper for delete commands (see Section 16, point 5)
- Positional args for IDs (`get <space-id>`), options for everything else
- `requiredOption` for mandatory non-ID fields in create commands

---

## 14. Full Command Reference

### 14.1 Workspace

```
clickup workspace list
clickup workspace get <workspace-id>
clickup workspace members <workspace-id>
```

### 14.2 Space

```
clickup space list [--workspace-id <id>] [--archived]
clickup space get <space-id>
clickup space create --name <name> [--workspace-id <id>] [--private] [--color <hex>]
clickup space update <space-id> [--name <name>] [--color <hex>] [--private|--no-private]
clickup space delete <space-id> [--confirm]
clickup space members <space-id>
```

### 14.3 Folder

```
clickup folder list --space-id <id> [--archived]
clickup folder get <folder-id>
clickup folder create --space-id <id> --name <name>
clickup folder update <folder-id> [--name <name>]
clickup folder delete <folder-id> [--confirm]
```

### 14.4 List

```
clickup list list --folder-id <id> [--archived]
clickup list folderless --space-id <id> [--archived]
clickup list get <list-id>
clickup list create --folder-id <id> --name <name> [--content <text>] [--due-date <date>] [--priority <1-4>] [--assignee <user-id>] [--status <status>]
clickup list create-folderless --space-id <id> --name <name> [options same as above]
clickup list update <list-id> [--name <name>] [--content <text>] [--due-date <date>] [--status <status>]
clickup list delete <list-id> [--confirm]
clickup list members <list-id>
clickup list views <list-id>
clickup list tags <list-id>
```

### 14.5 Task

```
clickup task list --list-id <id> [filter options] [--page <n>] [--limit <n>]
clickup task get <task-id> [--include-subtasks] [--custom-fields]
clickup task create --list-id <id> --name <name> [create options]
clickup task update <task-id> [update options]
clickup task delete <task-id> [--confirm]
clickup task move <task-id> --list-id <id>
clickup task duplicate <task-id>
clickup task subtasks <task-id>
clickup task members <task-id>
clickup task tags <task-id>

# Filter options for task list:
#   --assignee <user-id,...>
#   --status <status,...>
#   --priority <1-4,...>
#   --due-date-lt <date>
#   --due-date-gt <date>
#   --date-created-lt <date>
#   --date-created-gt <date>
#   --date-updated-lt <date>
#   --date-updated-gt <date>
#   --include-closed
#   --subtasks
#   --tags <tag,...>
#   --custom-fields <json>
#   --order-by <id|created|updated|due_date>
#   --reverse

# Create/update options:
#   --description <text>
#   --assignee <user-id> (repeatable)
#   --status <status>
#   --priority <1-4> (1=urgent, 2=high, 3=normal, 4=low)
#   --due-date <date>
#   --due-date-time (flag: include time in due date)
#   --start-date <date>
#   --start-date-time
#   --time-estimate <ms>
#   --notify-all
#   --parent <task-id>
#   --links-to <task-id>
#   --custom-field <field-id>=<value> (repeatable)
#   --markdown-description
```

### 14.6 Comment

```
clickup comment list --task-id <id>
clickup comment list --list-id <id>
clickup comment list --view-id <id>
clickup comment get <comment-id>
clickup comment create --task-id <id> --text <text> [--assignee <user-id>] [--notify-all]
clickup comment create --list-id <id> --text <text>
clickup comment create --view-id <id> --text <text>
clickup comment update <comment-id> --text <text>
clickup comment delete <comment-id> [--confirm]
```

Comment list routes to different API endpoints based on which ID flag is provided (`--task-id` vs `--list-id` vs `--view-id`). Exactly one must be present.

### 14.7 Checklist

```
clickup checklist list <task-id>
clickup checklist create --task-id <id> --name <name>
clickup checklist update <checklist-id> [--name <name>] [--position <n>]
clickup checklist delete <checklist-id> [--confirm]
clickup checklist item create --checklist-id <id> --name <name> [--assignee <user-id>] [--resolved]
clickup checklist item update <checklist-item-id> [--name <name>] [--resolved] [--no-resolved] [--assignee <user-id>]
clickup checklist item delete <checklist-item-id> [--confirm]
```

### 14.8 Custom Field

```
clickup custom-field list --list-id <id>
clickup custom-field get <field-id>
clickup custom-field set --task-id <id> --field-id <id> --value <value>
clickup custom-field unset --task-id <id> --field-id <id>
```

The `--value` for `set` accepts:
- Plain string for text/email/url/phone
- Number string for number/currency/rating/progress
- Date string (parsed by `src/dates.ts`) for date fields
- Comma-separated user IDs for user fields
- `true` or `false` for checkbox
- Dropdown option ID or label for dropdown

### 14.9 Tag

```
clickup tag list --space-id <id>
clickup tag create --space-id <id> --name <name> [--fg-color <hex>] [--bg-color <hex>]
clickup tag delete --space-id <id> --name <name> [--confirm]
clickup tag add --task-id <id> --name <name>
clickup tag remove --task-id <id> --name <name>
```

### 14.10 Dependency and Relation

```
clickup dependency add --task-id <id> --depends-on <task-id>
clickup dependency add --task-id <id> --dependency-of <task-id>
clickup dependency remove --task-id <id> --depends-on <task-id>

clickup relation add --task-id <id> --relates-to <task-id>
clickup relation remove --task-id <id> --relates-to <task-id>
```

### 14.11 Time Tracking

```
clickup time list --task-id <id>
clickup time get <time-entry-id> [--team-id <id>]
clickup time start --task-id <id> [--description <text>] [--billable]
clickup time stop [--team-id <id>]
clickup time current [--team-id <id>]
clickup time create --task-id <id> --start <date> --duration <ms> [--description <text>] [--billable] [--tags <tag,...>]
clickup time update <time-entry-id> [--start <date>] [--duration <ms>] [--description <text>] [--billable]
clickup time delete <time-entry-id> [--confirm]
clickup time tags --team-id <id>
```

### 14.12 Goal

```
clickup goal list [--workspace-id <id>]
clickup goal get <goal-id>
clickup goal create --name <name> [--workspace-id <id>] [--due-date <date>] [--description <text>] [--color <hex>] [--owners <user-id,...>]
clickup goal update <goal-id> [--name <name>] [--due-date <date>] [--description <text>] [--color <hex>]
clickup goal delete <goal-id> [--confirm]

clickup goal target list <goal-id>
clickup goal target create <goal-id> --name <name> --type <number|boolean|currency|task|trigger> [type-specific options]
clickup goal target update <key-result-id> [--name <name>] [--current <n>]
clickup goal target delete <key-result-id> [--confirm]
```

### 14.13 View

```
clickup view list-team [--workspace-id <id>]
clickup view list-space --space-id <id>
clickup view list-folder --folder-id <id>
clickup view list-list --list-id <id>
clickup view get <view-id>
clickup view create --name <name> [--space-id|--folder-id|--list-id <id>] [--type <board|list|box|calendar|gantt|map|workload>]
clickup view delete <view-id> [--confirm]
clickup view tasks <view-id> [--page <n>]
```

### 14.14 Member

```
clickup member list-space --space-id <id>
clickup member list-list --list-id <id>
```

### 14.15 User

```
clickup user me
clickup user get <user-id> [--workspace-id <id>]
```

### 14.16 Group

```
clickup group list [--workspace-id <id>]
clickup group create --name <name> [--workspace-id <id>] [--members <user-id,...>]
clickup group update <group-id> [--name <name>]
clickup group delete <group-id> [--confirm]
clickup group members add <group-id> --user-ids <id,...>
clickup group members remove <group-id> --user-ids <id,...>
```

### 14.17 Role

```
clickup role list [--workspace-id <id>]
```

### 14.18 Guest

```
clickup guest list [--workspace-id <id>]
clickup guest get <guest-id> [--workspace-id <id>]
clickup guest invite --email <email> [--workspace-id <id>] [--can-edit] [--can-see-time-spent] [--can-see-time-estimated] [--can-see-points]
clickup guest update <guest-id> [options]
clickup guest remove <guest-id> [--workspace-id <id>] [--confirm]
clickup guest add-task <guest-id> --task-id <id> [--permission-level <read|comment|edit|create>]
clickup guest remove-task <guest-id> --task-id <id>
clickup guest add-list <guest-id> --list-id <id> [--permission-level <read|comment|edit|create>]
clickup guest remove-list <guest-id> --list-id <id>
clickup guest add-folder <guest-id> --folder-id <id> [--permission-level <read|comment|edit|create>]
clickup guest remove-folder <guest-id> --folder-id <id>
```

### 14.19 Webhook

```
clickup webhook list [--workspace-id <id>]
clickup webhook get <webhook-id>
clickup webhook create --endpoint <url> [--workspace-id <id>] [--events <event,...>] [--task-id <id>] [--list-id <id>] [--folder-id <id>] [--space-id <id>]
clickup webhook update <webhook-id> [--endpoint <url>] [--events <event,...>] [--status <active|inactive>]
clickup webhook delete <webhook-id> [--confirm]
```

Events: `taskCreated`, `taskUpdated`, `taskDeleted`, `taskPriorityUpdated`, `taskStatusUpdated`, `taskAssigneeUpdated`, `taskDueDateUpdated`, `taskTagUpdated`, `taskMoved`, `taskCommentPosted`, `taskCommentUpdated`, `taskTimeEstimateUpdated`, `taskTimeTrackedUpdated`, `listCreated`, `listUpdated`, `listDeleted`, `folderCreated`, `folderUpdated`, `folderDeleted`, `spaceCreated`, `spaceUpdated`, `spaceDeleted`, `goalCreated`, `goalUpdated`, `goalDeleted`, `goalKeyResultCreated`, `goalKeyResultUpdated`, `goalKeyResultDeleted`.

### 14.20 Template

```
clickup template list [--workspace-id <id>] [--page <n>]
```

### 14.21 Shared Hierarchy

```
clickup shared-hierarchy [--workspace-id <id>]
```

Returns the tasks, lists, and folders shared with the authenticated user.

### 14.22 Custom Task Type

```
clickup custom-task-type list [--workspace-id <id>]
```

### 14.23 Attachment

```
clickup attachment upload --task-id <id> --file <path> [--filename <name>]
```

### 14.24 Doc

```
clickup doc list [--workspace-id <id>]
clickup doc get <doc-id> [--workspace-id <id>]
clickup doc create --name <name> [--workspace-id <id>] [--parent-type <workspace|space|folder|list|everything>] [--parent-id <id>] [--visibility <public|private>]
clickup doc update <doc-id> [--name <name>] [--visibility <public|private>]
clickup doc delete <doc-id> [--confirm]
clickup doc pages <doc-id> [--workspace-id <id>]
clickup doc page get --doc-id <id> --page-id <id>
clickup doc page create --doc-id <id> --name <name> [--content <markdown>] [--content-format <md|html>]
clickup doc page update --doc-id <id> --page-id <id> [--name <name>] [--content <markdown>]
```

### 14.25 Auth

```
clickup auth login [--token <token>] [--oauth]
clickup auth logout
clickup auth status
clickup auth whoami
```

### 14.26 Config

```
clickup config set <key> <value>
clickup config get <key>
clickup config list
clickup config unset <key>
clickup config path
```

### 14.27 Schema (Introspection)

```
clickup schema                              # List all resources
clickup schema <resource>                   # List actions for a resource
clickup schema <resource>.<action>          # Show fields for a specific action
clickup schema <resource>.<action> --format json  # Machine-readable field definitions
```

Examples:
```
clickup schema                    # Shows: tasks, spaces, folders, lists, comments, ...
clickup schema tasks              # Shows: list, search, get, create, update, delete, ...
clickup schema tasks.create       # Shows required and optional fields with types
clickup schema tasks.list         # Shows available filter flags
```

### 14.28 Skill (Agent Skills)

```
clickup skill list                          # List all available skills
clickup skill show <name>                   # Output SKILL.md content to stdout
clickup skill show <name> --format json     # Skill metadata as JSON
clickup skill path <name>                   # Print file path to skill directory
```

Examples:
```
clickup skill list                          # Shows: clickup, clickup-tasks, clickup-weekly-review, ...
clickup skill show clickup                  # Outputs root skill content
clickup skill show clickup-tasks            # Outputs tasks sub-skill content
clickup skill show clickup-weekly-review    # Outputs recipe skill content
```

---

## 15. Package Configuration

### 15.1 package.json

```json
{
  "name": "clickup-cli",
  "version": "0.1.0",
  "description": "Comprehensive CLI for the ClickUp API v2",
  "type": "module",
  "bin": {
    "clickup": "./dist/bin/clickup.js"
  },
  "files": ["dist", "skills"],
  "engines": { "node": ">=22.0.0" },
  "scripts": {
    "build": "tsup",
    "dev": "tsx bin/clickup.ts",
    "test": "vitest",
    "typecheck": "tsc --noEmit",
    "prepublishOnly": "npm run build"
  },
  "dependencies": {
    "@inquirer/prompts": "^7.0.0",
    "chalk": "^5.0.0",
    "cli-table3": "^0.6.5",
    "commander": "^12.0.0",
    "conf": "^13.0.0",
    "ora": "^8.0.0",
    "zod": "^3.0.0"
  },
  "devDependencies": {
    "@types/cli-table3": "^0.6.4",
    "@types/node": "^22.0.0",
    "tsup": "^8.0.0",
    "tsx": "^4.0.0",
    "typescript": "^5.5.0",
    "vitest": "^2.0.0"
  }
}
```

### 15.2 tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "esModuleInterop": false,
    "allowImportingTsExtensions": false,
    "outDir": "dist",
    "rootDir": ".",
    "declaration": false,
    "sourceMap": true,
    "skipLibCheck": true
  },
  "include": ["bin", "src"],
  "exclude": ["dist", "node_modules"]
}
```

### 15.3 tsup.config.ts

```typescript
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['bin/clickup.ts'],
  format: ['esm'],
  target: 'node22',
  clean: true,
  splitting: false,
  sourcemap: true,
  dts: false,
  banner: {
    js: '#!/usr/bin/env node',
  },
})
```

### 15.4 Installation

Global install:
```sh
npm install -g clickup-cli
```

One-off with npx:
```sh
npx clickup-cli task list --list-id abc123
```

---

## 16. Key Design Decisions

**1. No wrapper SDK layer.**
Commands call the HTTP client directly with raw API path strings. Zod schemas serve as types without adding an intermediate abstraction layer. This keeps the mapping between CLI commands and API endpoints obvious and easy to audit.

**2. Polymorphic resource options.**
Commands like `comment list` accept `--task-id`, `--list-id`, or `--view-id` as mutually exclusive options, and route to the correct API endpoint internally. The user does not need to know which endpoint backs each variant.

**3. Flag > env > config precedence.**
Most specific wins. Standard CLI convention. Every resolver function checks this order.

**4. Fixed column definitions per resource.**
Each resource type has a static `COLUMNS` array in its command file. `--fields` overrides which columns to render, but the column set does not change dynamically at runtime.

**5. Confirmations for destructive actions.**
All `delete` commands require either `--confirm` (for scripting/agents) or an interactive `y/n` prompt (for human use). In non-TTY mode without `--confirm`, the command exits with code 2 and prints:
```
Add --confirm to proceed with this destructive action.
```
This prevents AI agent accidents.

**6. No caching.**
Each invocation is stateless (aside from the stored auth config). Avoids stale data bugs entirely. If you need caching, add a wrapper script.

**7. No ClickUp API v3.**
v3 is still rolling out and has incomplete, unstable coverage. This tool covers v2 fully and reliably.

**8. ESM-only output.**
The built output is ESM. CommonJS compatibility shims are not provided. Requires Node 22+.

**9. Stderr for all non-data output.**
Spinners, progress messages, warnings, and errors all go to stderr. Only structured data (table rows, JSON, IDs) goes to stdout. This makes stdout safe to pipe without filtering noise.

**10. Skills over MCP for agent integration.**
Instead of building an MCP server (ClickUp already provides one officially), the CLI ships with a hierarchical skills system that keeps agent token overhead near zero. The CLI is the execution layer; skills are the guidance layer. See Section 12.2.

**11. Schema introspection over documentation.**
Agents can discover command fields at runtime via `clickup schema <resource>.<action>` instead of needing full docs in context. The schema registry is derived from the same Zod schemas used for validation, so it is always in sync. See Section 12.3.

---

## 17. CLAUDE.md (at repo root)

The `CLAUDE.md` file is a machine-readable guide for AI coding agents **building** this project (developing the CLI itself). It describes code conventions, project structure, and how to add new commands.

This is distinct from the **skills system** (Section 12.2), which guides AI agents **using** the CLI to manage ClickUp data. CLAUDE.md is for developers; skills are for users/agents.

Content to include:

```markdown
# ClickUp CLI - Development Reference

## What This Is
A Node.js/TypeScript CLI for the ClickUp API v2. Binary: `clickup`.

## Project Structure
- `bin/clickup.ts` - entry point
- `src/cli.ts` - root Commander program, registers all commands
- `src/client.ts` - ClickUpClient class (HTTP, retry, rate limiting)
- `src/config.ts` - persistent config via conf
- `src/output.ts` - formatOutput() for all output modes
- `src/schema.ts` - schema registry for introspection commands
- `src/commands/*.ts` - one file per resource group
- `src/types/*.ts` - Zod schemas and TypeScript types
- `skills/` - agent skill files (root skill, sub-skills, recipes)

## Adding a New Command
1. Create src/commands/my-resource.ts
2. Export registerMyResourceCommands(program, client)
3. Define Zod schema with .passthrough()
4. Define COLUMNS array for table output
5. Register field definitions in src/schema.ts for schema introspection
6. Import and call registerMyResourceCommands() in src/cli.ts
7. Create or update the corresponding skill file in skills/

## Adding a New Skill
1. Create skills/clickup-<name>/SKILL.md
2. Add YAML frontmatter with name and description
3. Document commands, common patterns, and discovery hints
4. Reference the skill from the root skill (skills/clickup/SKILL.md)
5. Keep under 500 lines (target: 100-300 lines for sub-skills)

## Common Patterns
- resolveWorkspaceId(opts.workspaceId) for workspace resolution
- formatOutput(rows, COLUMNS, program.opts()) for all output
- confirmDestructive(opts.confirm, prompt) for delete commands
- client.get/post/put/patch/delete for API calls
- paginate() async generator for list endpoints

## Build and Test
- npm run build - compile to dist/
- npm run dev - run with tsx (no compile step)
- npm test - vitest
- npm run typecheck - tsc --noEmit

## Exit Codes
0=success, 1=error, 2=bad args, 3=auth fail, 4=not found, 5=forbidden, 6=rate limited, 7=network error
```

---

## 18. Testing Strategy

### 18.1 Unit Tests

**`client.test.ts`**
- Mock `globalThis.fetch`
- Test retry on 5xx: verify fetch called N times
- Test retry on 429 with rate limit header: verify wait and retry
- Test no retry on 4xx
- Test timeout via AbortController
- Test auth header injection
- Test query param encoding
- Test error parsing (ECODE extraction)

**`output.test.ts`**
- Test each format (table, json, csv, tsv, quiet, id) with fixture data
- Test `--fields` column filtering
- Test `--sort` and `--filter` client-side processing
- Test no-color mode (strip ANSI)
- Test `--no-header` omits header row

**`config.test.ts`**
- Test resolution order: flag > env > stored config
- Test each env var override
- Test config read/write via mocked conf

**`dates.test.ts`**
- Test every input format listed in Section 11.1
- Test display formatting
- Test timezone handling

**`pagination.test.ts`**
- Test page iteration stops on empty result
- Test `--limit` caps output
- Test yields items as they arrive (not buffered)

### 18.2 Command Tests

Each command group test file (`__tests__/commands/task.test.ts`, etc.):
- Mock `ClickUpClient` with vi.fn() or a stub class
- Call the Commander action function directly
- Assert:
  - Correct API path called
  - Correct HTTP method
  - Options correctly mapped to query params or request body
  - Output formatted correctly for each format flag
  - Destructive commands block without `--confirm`
  - Missing required args exit with code 2

### 18.3 Fixtures

`__tests__/fixtures/` contains JSON files with realistic API response shapes (matching actual ClickUp API responses). Used in unit and command tests. One fixture file per resource type.

### 18.4 Integration Tests (optional)

Gated behind `CLICKUP_TEST_TOKEN` and `CLICKUP_TEST_WORKSPACE_ID` env vars.

Run with: `CLICKUP_TEST_TOKEN=xxx CLICKUP_TEST_WORKSPACE_ID=yyy vitest run --reporter=verbose`

Full round-trip tests: create a resource, get it, update it, verify update, delete it. Run against a dedicated test workspace to avoid polluting real data.

Integration tests are excluded from CI by default. A separate `vitest.integration.config.ts` selects only files matching `*.integration.test.ts`.

---

## 19. CI / Release

### 19.1 CI (GitHub Actions)

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - run: npm ci
      - run: npm run typecheck
      - run: npm test
      - run: npm run build
```

### 19.2 Release

- Use `npm version patch|minor|major` to bump version in package.json
- Tag with `git tag v0.x.x`
- Push tag triggers publish workflow:

```yaml
# .github/workflows/publish.yml
name: Publish
on:
  push:
    tags: ['v*']
jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm run build
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```
