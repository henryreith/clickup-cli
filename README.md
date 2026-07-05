# ClickUp CLI

[![npm](https://img.shields.io/npm/v/clickup-agent-cli)](https://www.npmjs.com/package/clickup-agent-cli)
[![node](https://img.shields.io/node/v/clickup-agent-cli)](https://nodejs.org)
[![CI](https://github.com/henryreith/clickup-cli/actions/workflows/ci.yml/badge.svg)](https://github.com/henryreith/clickup-cli/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/npm/l/clickup-agent-cli)](./LICENSE)
[![Agent Skills](https://img.shields.io/badge/agent%20skills-31-blueviolet)](./skills)

Zero-overhead CLI for the ClickUp API v2 -- for AI agents, scripts, and automation. Covers the entire API surface with all MCP capabilities and more.

## Why This Exists

ClickUp has no official CLI. Community tools cover fragments of the API surface. This project covers everything: tasks, spaces, folders, lists, comments, time tracking, goals, views, webhooks, user management, custom fields, and more.

Built for three audiences:
- **Humans** who want fast keyboard-driven ClickUp access
- **AI agents** (Claude Code, OpenAI, custom agents) that need structured ClickUp interaction
- **Automation scripts** that pipe ClickUp data through standard Unix tools

## Quick Start

```bash
# Install globally
npm install -g clickup-agent-cli

# Authenticate with your personal API token
clickup auth login --token pk_12345678_ABCDEFG

# Set your default workspace
clickup config set workspace_id 12345678

# List your spaces
clickup space list

# List tasks in a list
clickup task list --list-id 901234567

# Create a task
clickup task create --list-id 901234567 --name "Ship the CLI" --priority 2

# Get JSON output (for scripting/agents)
clickup task list --list-id 901234567 --format json

# Pipe task IDs
clickup task list --list-id 901234567 --format quiet | xargs -I{} clickup task get {}
```

## What It Covers

| Resource | Commands |
|----------|----------|
| Workspaces | list, get, seats, plan, members |
| Spaces | list, get, create, update, delete |
| Folders | list, get, create, update, delete |
| Lists | list, get, create, update, delete, add/remove tasks |
| Tasks | list, search, get, create, update, delete, time-in-status |
| Checklists | create, update, delete, manage items |
| Comments | list, create, update, delete, threading, replies |
| Custom Fields | list, set, remove |
| Tags | list, create, update, delete, add/remove from tasks |
| Dependencies | add, remove |
| Attachments | upload |
| Time Tracking | entries, timers, tags, reports |
| Goals | list, get, create, update, delete, key results |
| Views | list, get, create, update, delete, view tasks |
| Users | invite, get, update, remove |
| User Groups | list, create, update, delete |
| Guests | invite, manage, permissions |
| Members | list, find, resolve |
| Chat | channels, send |
| Webhooks | list, create, update, delete |
| Templates | list |
| Custom Task Types | list |

## Output Formats

Every command supports multiple output formats:

- `--format table` - Human-readable columns (default in terminal)
- `--format json` - Full API response (default when piped)
- `--format csv` - Comma-separated values
- `--format tsv` - Tab-separated values
- `--format quiet` - IDs only, one per line
- `--format id` - Single ID (for create commands)
- `--format md` - Markdown table (ideal for rendering in chat messages or documents)

## AI Agent Usage

The CLI is built from the ground up for AI agents, following the "CLI as execution layer, skills as guidance layer" pattern. It ships as a Claude Code plugin with 31 agent skills, and works with any agent platform that can run bash commands.

**vs ClickUp MCP:** This CLI covers the same operations as the official ClickUp MCP server (tasks, docs, time tracking, chat, members, hierarchy) plus more, while consuming far fewer tokens. A full skills hierarchy loads in ~150 tokens at session start vs injecting an entire API schema. Works in any agent platform that supports bash -- not just MCP-compatible hosts.

### Claude Code Plugin (Recommended)

Install the ClickUp CLI as a Claude Code plugin for zero-friction access to all skills:

```bash
# Add the marketplace (one-time)
/plugin marketplace add henryreith/clickup-cli

# Install the plugin
/plugin install clickup@clickup-agent-cli

# Use skills directly
/clickup:weekly-review 12345678
/clickup:sprint-planning list-id-here
```

Once installed, Claude Code auto-discovers all 31 skills and loads them on demand. Recipe skills like `/clickup:weekly-review` run in isolated subagents with full ClickUp CLI access.

### Claude Agent SDK

Build custom agents with ClickUp skills using the Agent SDK:

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

for await (const message of query({
  prompt: "Create a task for the login bug fix and assign to the backend team",
  options: {
    plugins: [{ type: "local", path: "./node_modules/clickup-agent-cli" }],
    allowedTools: ["Skill", "Bash"],
    settingSources: ["project"]
  }
})) {
  console.log(message);
}
```

### Skills System

Instead of injecting a full API schema into every LLM call, agents load a lightweight root skill and fetch deeper context on demand:

```bash
# Agent reads the root skill at session start (~150 tokens)
clickup skill show clickup

# When it needs to create a task, it loads just the tasks sub-skill (~300 tokens)
clickup skill show clickup-tasks

# Or asks the CLI what fields are needed (~50 tokens in response)
clickup schema task.create

# For complex workflows, load a recipe skill
clickup skill show clickup-weekly-review
```

**Three skill tiers:**
- **Root skill** - Index and router. What the CLI does, how to discover more.
- **Sub-skills** (12) - Per-resource command reference. Tasks, spaces, comments, time tracking, chat, etc.
- **Recipe skills** (18) - Multi-step workflow guides that accept natural language arguments. Scope any recipe to a specific team, department, or person.

**Example recipe invocations:**
```bash
/clickup:weekly-review marketing team
/clickup:team-report engineering
/clickup:standup Sarah's tasks
/clickup:custom-report all high-priority tasks with no assignee
/clickup:capacity-check design team
```

### Create Your Own Skills

Add custom skills to any project. Create `.claude/skills/<name>/SKILL.md`:

```yaml
---
name: marketing-weekly
description: Weekly marketing department review
disable-model-invocation: true
context: fork
agent: general-purpose
allowed-tools: Bash(clickup *)
---

Generate a marketing department weekly review focused on:
1. Campaign tasks in the Marketing space (space ID: YOUR_ID)
2. Content pipeline status
3. Upcoming launch deadlines
```

This creates `/marketing-weekly` alongside the built-in `/clickup:*` skills.

### Cross-Platform Agent Support

| Platform | How to use |
|----------|-----------|
| Claude Code | Plugin via marketplace (see above) |
| Claude Agent SDK | `plugins: [{ type: "local", path: "./node_modules/clickup-agent-cli" }]` |
| Gemini CLI | `npm install -g clickup-agent-cli`, read skills via `clickup skill show` |
| OpenAI Codex | `npm install -g clickup-agent-cli`, execute commands via bash |
| Custom agents | `clickup skill list` for discovery, `clickup schema` for field info |

### Bootstrap From Any Agent

The repo and npm package ship an [AGENTS.md](./AGENTS.md) operating manual that agent platforms (Codex, Cursor, Gemini CLI, custom agents) pick up automatically. Any agent that can run shell commands can set up and use the CLI in five steps, no plugin system required:

```bash
# 1. Install
npm install -g clickup-agent-cli

# 2. Authenticate non-interactively (env var, or --token-file / --token per call)
export CLICKUP_API_TOKEN=pk_your_token

# 3. Verify auth and workspace
clickup config validate

# 4. Discover capabilities: the root skill indexes everything
clickup skill show clickup          # start here (~150 tokens)
clickup skill list                  # all 31 skills
clickup skill show clickup-tasks    # per-resource command reference

# 5. Discover exact fields before calling a command
clickup schema task.create
```

### Agent-Friendly Design

- JSON is the default output when stdout is not a TTY
- `clickup schema <resource>.<action>` for runtime field discovery
- Predictable exit codes (0-7) for error branching
- `--dry-run` to preview actions before executing
- No interactive prompts in non-TTY mode
- All non-data output (spinners, errors) goes to stderr
- Composable with standard Unix tools

### Quick Agent Example

```bash
# Discover what's available
clickup schema task

# Check what fields task create needs
clickup schema task.create --format json

# Create a task (JSON output automatic in non-TTY)
clickup task create --list-id 998877 --name "Review PR" --priority 2

# Compose: create task then comment on it
TASK_ID=$(clickup task create --list-id 998877 --name "Fix bug" --format id)
clickup comment create --task-id "$TASK_ID" --text "Starting work"
```

## Documentation

- [Technical Specification](./SPEC.md) - Architecture, patterns, and design decisions
- [Command Reference](./COMMANDS.md) - Every command, flag, and option
- [Implementation Plan](./IMPLEMENTATION.md) - Phased build order
- [CLAUDE.md](./CLAUDE.md) - Coding conventions for AI agents building this project

## Tech Stack

TypeScript, Node.js 22+, Commander.js, Zod, chalk, ora, cli-table3, conf, tsup, vitest.

## License

MIT
