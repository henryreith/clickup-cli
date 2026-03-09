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

The CLI is designed for AI agent consumption:

- JSON is the default output when stdout is not a TTY
- Predictable exit codes (0-7) for error branching
- `--dry-run` to preview actions before executing
- No interactive prompts in non-TTY mode
- Composable with standard Unix tools

## Documentation

- [Technical Specification](./SPEC.md) - Architecture, patterns, and design decisions
- [Command Reference](./COMMANDS.md) - Every command, flag, and option
- [Implementation Plan](./IMPLEMENTATION.md) - Phased build order
- [CLAUDE.md](./CLAUDE.md) - Coding conventions for AI agents building this project

## Tech Stack

TypeScript, Node.js 22+, Commander.js, Zod, chalk, ora, cli-table3, conf, tsup, vitest.

## License

MIT
