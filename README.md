# ClickUp CLI

A comprehensive, open-source command-line interface for the ClickUp API v2.

## Why This Exists

ClickUp has no official CLI. Community tools cover fragments of the API surface. This project covers everything: tasks, spaces, folders, lists, comments, time tracking, goals, views, webhooks, user management, custom fields, and more.

Built for three audiences:
- **Humans** who want fast keyboard-driven ClickUp access
- **AI agents** (Claude Code, OpenAI, custom agents) that need structured ClickUp interaction
- **Automation scripts** that pipe ClickUp data through standard Unix tools

## Quick Start

```bash
# Install globally
npm install -g clickup-cli

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
| Workspaces | list, get, seats, plan |
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

## AI Agent Usage

The CLI is built from the ground up for AI agents, following the "CLI as execution layer, skills as guidance layer" pattern (similar to the Google Workspace CLI).

### Skills System

Instead of injecting a full API schema into every LLM call, agents load a lightweight root skill and fetch deeper context on demand:

```bash
# Agent reads the root skill at session start (~150 tokens)
clickup skill show clickup

# When it needs to create a task, it loads just the tasks sub-skill (~300 tokens)
clickup skill show clickup-tasks

# Or asks the CLI what fields are needed (~50 tokens in response)
clickup schema tasks.create

# For complex workflows, load a recipe skill
clickup skill show clickup-weekly-review
```

**Three skill tiers:**
- **Root skill** - Index and router. What the CLI does, how to discover more.
- **Sub-skills** - Per-resource command reference. Tasks, spaces, comments, time tracking, etc.
- **Recipe skills** - Multi-step workflow guides. Sprint planning, weekly review, task triage, etc.

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
clickup schema tasks

# Check what fields task create needs
clickup schema tasks.create --format json

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
