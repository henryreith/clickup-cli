# ClickUp CLI - Implementation Plan

## Phase 1: Foundation

Everything else depends on this. Build and test before moving on.

### Step 1: Project Scaffolding
- package.json with name, type: module, bin, engines (node >= 22), scripts (build, dev, test, typecheck)
- tsconfig.json: strict, ESM, target ES2022, moduleResolution bundler
- tsup.config.ts: entry bin/clickup.ts, format esm, target node22, banner with shebang
- vitest.config.ts: basic setup
- .gitignore, LICENSE (MIT), empty README.md

### Step 2: HTTP Client (src/client.ts)
- ClickUpClient class with get/post/put/delete/upload methods
- Auth header injection from token
- Rate limit handling (X-RateLimit-Remaining / X-RateLimit-Reset headers)
- Retry with exponential backoff (1s/2s/4s) on 429 and 5xx
- Timeout (30s default)
- Verbose/debug mode logging
- Dry-run mode (log request, don't execute)
- Tests: mock fetch, verify retry logic, rate limiting, error parsing

### Step 3: Error Handling (src/errors.ts)
- ClickUpError class extending Error with status, ecode, body
- parseApiError() function to extract err/ECODE from response
- mapToExitCode() function
- User-friendly error messages for common ECODEs
- Tests: parse various error response shapes

### Step 4: Config Management (src/config.ts)
- Use conf package for persistent storage
- resolveToken(): flag > CLICKUP_API_TOKEN env > stored config
- resolveWorkspaceId(): flag > CLICKUP_WORKSPACE_ID env > stored config
- resolveOutputFormat(): flag > CLICKUP_OUTPUT_FORMAT env > stored config > auto-detect TTY
- Tests: verify precedence, env override, defaults

### Step 5: Output Formatter (src/output.ts)
- formatOutput(data, columns, globalOpts) function
- Table format: cli-table3 with column definitions
- JSON format: JSON.stringify with 2-space indent
- CSV/TSV: header row + data rows, proper escaping
- Quiet: IDs only, one per line
- ID: single value (for create commands)
- --fields filtering, --sort, --limit
- Auto-detect: json when stdout is not a TTY
- Tests: each format with fixture data

### Step 6: Pagination (src/pagination.ts)
- paginate() async generator for page-based iteration
- paginateCursor() for cursor-based endpoints
- Respect --limit
- Tests: mock multi-page responses

### Step 7: Date Utilities (src/dates.ts)
- parseDate(): accept ISO 8601, relative (today, +3d, -1w, next monday), unix ms
- formatDate(): display in configured timezone
- Tests: all input formats

### Step 8: CLI Skeleton (bin/clickup.ts + src/cli.ts)
- bin/clickup.ts: shebang, import and run cli
- src/cli.ts: create commander program, add global options, add version
- Wire up client creation from resolved token
- Wire up output format from global opts

### Step 9: Auth Commands (src/commands/auth-cmd.ts)
- login: --token (store in config) or interactive prompt
- logout: clear stored token
- status: show current auth state (token prefix, workspace)
- token: print current token to stdout (for piping)
- Tests: verify config writes

### Step 10: Config Commands (src/commands/config-cmd.ts)
- set/get/list/reset/path subcommands
- Tests: CRUD operations on config

**Milestone: `clickup auth login`, `clickup config set`, infrastructure working. All foundation tested.**

---

## Phase 2: Core Hierarchy

### Step 11: Workspace Commands
- Types: src/types/workspace.ts (Zod schemas)
- Commands: list, get, seats, plan
- API paths: GET /team, GET /team/{id}

### Step 12: Space Commands
- Types: src/types/space.ts
- Commands: list, get, create, update, delete
- API paths: GET /team/{id}/space, POST /team/{id}/space, etc.

### Step 13: Folder Commands
- Types: src/types/folder.ts
- Commands: list, get, create, update, delete
- API paths: GET /space/{id}/folder, POST /space/{id}/folder, etc.

### Step 14: List Commands
- Types: src/types/list.ts
- Commands: list, list-folderless, get, create, create-folderless, update, delete, add-task, remove-task
- API paths: GET /folder/{id}/list, GET /space/{id}/list, POST /folder/{id}/list, etc.

**Milestone: Can navigate the full workspace > space > folder > list hierarchy.**

---

## Phase 3: Tasks

The largest and most complex resource. Take time to get this right since it sets the pattern.

### Step 15: Task Commands
- Types: src/types/task.ts (largest schema)
- Commands: list (with all filter flags), search, get, create, update, delete, move, duplicate, merge, time-in-status, bulk-time-in-status
- Handle subtask creation via --parent flag
- Task merge: POST /task/{id}/merge
- Implement all query param filters for list and search
- API paths: GET /list/{id}/task, GET /team/{id}/task (search), POST /list/{id}/task, etc.

### Step 16: Checklist Commands
- Types: src/types/checklist.ts
- Commands: create, update, delete, add-item, update-item, delete-item
- API paths: POST /task/{id}/checklist, PUT /checklist/{id}, etc.

### Step 17: Custom Field Commands
- Types: src/types/custom-field.ts
- Commands: list (by list-id, folder-id, space-id, or workspace-id), set (on task), remove (from task)
- Polymorphic list: routes to correct API endpoint based on which ID flag is provided
- API paths: GET /list/{id}/field, GET /folder/{id}/field, GET /space/{id}/field, GET /team/{id}/field, POST /task/{id}/field/{fid}, DELETE /task/{id}/field/{fid}

### Step 18: Tag Commands
- Types: src/types/tag.ts
- Commands: list, create, update, delete, add (to task), remove (from task)
- API paths: GET /space/{id}/tag, POST /space/{id}/tag, POST /task/{id}/tag/{name}, etc.

### Step 19: Dependency & Relation Commands
- Commands: dependency add/remove, relation add/remove
- API paths: POST /task/{id}/dependency, DELETE /task/{id}/dependency, POST /task/{id}/link/{link_id}, DELETE /task/{id}/link/{link_id}

### Step 20: Attachment Commands
- Commands: upload
- Multipart form data upload via client.upload()
- API path: POST /task/{id}/attachment

**Milestone: Full task lifecycle management. Create, query, filter, update, delete tasks with all metadata.**

---

## Phase 4: Communication & Time

### Step 21: Comment Commands
- Types: src/types/comment.ts
- Commands: list (polymorphic: --task-id, --list-id, or --view-id), create (polymorphic), update, delete, list-threaded, reply
- Route to correct API endpoint based on which parent ID is provided
- API paths: GET /task/{id}/comment, POST /task/{id}/comment, GET /list/{id}/comment, etc.

### Step 22: Time Tracking Commands
- Types: src/types/time-tracking.ts
- Commands: list (by task or workspace with date range), get, create, update, delete, history, current, start, stop, tags, add-tags, remove-tags, rename-tag
- Handle running timer state
- Workspace-level listing with date range filters and assignee filter
- Time entry tag management (add/remove/rename) as separate operations
- API paths: GET /task/{id}/time, POST /task/{id}/time, GET /team/{id}/time_entries, GET /team/{id}/time_entries/current, POST /team/{id}/time_entries/start, POST /team/{id}/time_entries/stop, etc.

**Milestone: Can manage comments and track time from CLI.**

---

## Phase 5: Goals, Views, Webhooks

### Step 23: Goal Commands
- Types: src/types/goal.ts
- Commands: list, get, create, update, delete, add-key-result, update-key-result, delete-key-result
- API paths: GET /team/{id}/goal, POST /team/{id}/goal, POST /goal/{id}/key_result, etc.

### Step 24: View Commands
- Types: src/types/view.ts
- Commands: list (polymorphic: workspace/space/folder/list), get, create (polymorphic), update, delete, tasks
- API paths: GET /team/{id}/view, GET /space/{id}/view, POST /team/{id}/view, GET /view/{id}/task, etc.

### Step 25: Webhook Commands
- Types: src/types/webhook.ts
- Commands: list, create, update, delete, events (list available event types)
- API paths: GET /team/{id}/webhook, POST /team/{id}/webhook, etc.

**Milestone: Goals, views, and webhooks fully managed.**

---

## Phase 6: Users, Groups, Guests, Roles

### Step 26: User Commands
- Types: src/types/user.ts
- Commands: invite, get, update, remove
- API paths: POST /team/{id}/user, GET /team/{id}/user/{uid}, PUT /team/{id}/user/{uid}, DELETE /team/{id}/user/{uid}

### Step 27: Group Commands
- Commands: list, create, update, delete
- API paths: GET /team/{id}/group, POST /team/{id}/group, etc.

### Step 28: Guest Commands
- Types: src/types/guest.ts
- Commands: invite, get, update, remove, add-to-task, remove-from-task, add-to-list, remove-from-list, add-to-folder, remove-from-folder
- API paths: POST /team/{id}/guest, GET /team/{id}/guest/{gid}, POST /task/{tid}/guest/{gid}, etc.

### Step 29: Role Commands
- Commands: list
- API path: GET /team/{id}/customroles

### Step 30: Member Commands
- Commands: list (--task-id or --list-id)
- API paths: GET /task/{id}/member, GET /list/{id}/member

**Milestone: Full user and access management.**

---

## Phase 7: Remaining Resources & Polish

### Step 31: Template Commands
- Commands: list, apply-task, apply-list, apply-folder
- List: GET /team/{id}/taskTemplate
- Apply: POST /list/{id}/taskTemplate/{tid}, POST /folder/{id}/listTemplate/{tid}, POST /space/{id}/listTemplate/{tid}, POST /space/{id}/folderTemplate/{tid}

### Step 32: Custom Task Type Commands
- Commands: list
- API path: GET /team/{id}/custom_item

### Step 33: Shared Hierarchy Commands
- Commands: get
- API path: GET /team/{id}/shared

### Step 34: Doc Commands (v3 endpoints)
- Commands: list, get, create, update, delete, pages, page-get, page-create, page-update
- Uses ClickUp API v3 doc endpoints for full functionality
- API paths: GET /v3/workspaces/{id}/docs, POST /v3/workspaces/{id}/docs, GET /v3/workspaces/{id}/docs/{id}/pages, etc.

### Step 35: OAuth2 Flow
- Implement full OAuth2 flow in src/auth.ts
- Local HTTP server for callback
- Browser launch
- Token exchange and storage

### Step 36: Schema Introspection (src/commands/schema-cmd.ts + src/schema.ts)
- Schema registry: maps resource.action to field definitions (derived from Zod schemas)
- `clickup schema` - list all resources
- `clickup schema <resource>` - list actions for a resource
- `clickup schema <resource>.<action>` - show required/optional fields with types
- JSON output for machine consumption, formatted table for humans
- Tests: verify schema output matches actual command options

### Step 37: Skill Commands (src/commands/skill-cmd.ts)
- `clickup skill list` - list all available skills (reads skills/ directory)
- `clickup skill show <name>` - output SKILL.md content to stdout
- `clickup skill show <name> --format json` - output skill metadata as JSON
- `clickup skill path <name>` - print file system path to skill directory
- Resolve skills from bundled package location or local project directory
- Tests: verify skill listing, content output, path resolution

### Step 38: Root Skill (skills/clickup/SKILL.md)
- Lightweight index (~150 tokens) describing what the CLI does
- Lists all sub-skills with one-line descriptions
- Lists all recipe skills with one-line descriptions
- Instructions: how to discover commands, when to load sub-skills
- Follows Anthropic Agent Skills standard (YAML frontmatter + markdown)

### Step 39: Sub-Skills (skills/clickup-*/SKILL.md)
- One sub-skill per resource group (tasks, spaces, comments, time, goals, views, users, webhooks, fields)
- Each contains: exact command syntax, required/optional flags, common patterns, discovery hints
- Target: 100-300 lines each, ~200-500 tokens
- Cross-references to related sub-skills where relevant

### Step 40: Recipe Skills
- 12 recipe skills for common PM workflows:
  - clickup-weekly-review: weekly progress report, scoped to any team/department/space
  - clickup-team-report: department or team status rundown (marketing, engineering, ops, etc.)
  - clickup-custom-report: any ad-hoc query or filtered report from natural language
  - clickup-sprint-planning: set up sprint with tasks from backlog
  - clickup-task-triage: sort and prioritize incoming tasks
  - clickup-standup: generate daily standup summary for a person or team
  - clickup-sprint-closeout: close sprint, move incomplete items, generate retro data
  - clickup-time-audit: audit time tracking entries and utilization
  - clickup-project-setup: scaffold new project with spaces, lists, and templates
  - clickup-capacity-check: check team workload and availability
  - clickup-blocker-report: find blocked tasks and dependency chains
  - clickup-goal-progress: report on goal/OKR completion status
- All recipes accept `$ARGUMENTS` for natural language scoping (team, department, person, etc.)
- Each recipe: sequence of CLI commands with conditional logic hints
- Target: 200-400 lines each
- Users can create their own recipes as custom skills in `.claude/skills/`

### Step 41: Plugin Structure
- Create `.claude-plugin/plugin.json` with name `clickup`, version, author, and metadata
- Create `.claude-plugin/marketplace.json` for self-hosted marketplace at `henryreith/clickup-cli`
- Test with `claude --plugin-dir .` to verify all 20 skills load and namespace as `/clickup:*`
- Verify plugin manifest validates with `claude plugin validate .`

### Step 42: Plugin Testing & Distribution
- Test marketplace add/install flow: `/plugin marketplace add henryreith/clickup-cli` then `/plugin install clickup@clickup-cli`
- Verify npm package includes `.claude-plugin/` and `skills/` directories
- Test Agent SDK integration: `plugins: [{ type: "local", path: "./node_modules/clickup-cli" }]`
- Document all installation paths in README

### Step 43: Official Marketplace Submission (post-release)
- Submit plugin to official Anthropic marketplace via claude.ai/settings/plugins/submit or platform.claude.com/plugins/submit
- Include npm source in submission: `{ "source": "npm", "package": "clickup-cli" }`
- Once accepted, users can install without a custom marketplace: `/plugin install clickup@claude-plugins-official`

### Step 44: README.md
- One-line description, badges
- Install instructions (npm global + Claude Code plugin)
- Quick start (auth, list workspaces, list tasks)
- Command reference overview (link to full docs)
- Configuration reference
- Output formats with examples
- AI agent usage guide: Claude Code plugin, Agent SDK, cross-platform agents
- Contributing section
- License

### Step 45: CI/CD
- GitHub Actions workflow: test, typecheck, build on PR
- Publish to npm on tag/release
- Dependabot or renovate for dependency updates

**Milestone: 100% ClickUp API v2 coverage. Schema introspection, agent skills, and Claude Code plugin complete. Ready for npm publish and marketplace submission.**

---

## Testing Checkpoints

After each phase, verify:
1. `npm run typecheck` passes
2. `npm test` passes
3. `npm run build` produces working binary
4. Manual test of key commands against a real workspace (if CLICKUP_TEST_TOKEN is set)

---

## Notes for AI Agents Building This

- Start with Phase 1 and get it fully working before Phase 2
- Each command file follows the exact same pattern (see SPEC.md section 13)
- Every API response type gets a Zod schema
- Every resource gets column definitions for table output
- Every resource gets field definitions registered in src/schema.ts for introspection
- Test each command group before moving to the next
- When adding a new command group, also create/update the corresponding sub-skill in skills/
- Refer to COMMANDS.md for the exact flags each command needs
- Refer to SPEC.md for architectural decisions and patterns
- Refer to SPEC.md Section 12.2 for skills architecture and file format
- Refer to SPEC.md Section 12.5 for cross-platform agent integration and plugin distribution
- The `.claude-plugin/` directory and `skills/` must both be in the npm package `files` array
