---
name: clickup
description: Manage ClickUp projects, tasks, spaces, lists, time tracking, goals, and more via CLI. Load this skill when the user needs to interact with ClickUp data.
---

# ClickUp CLI

You have access to `clickup`, a command-line tool for the full ClickUp API v2. It outputs structured JSON by default when used programmatically.

## When to Use This

Use the ClickUp CLI when you need to:
- Create, update, search, or manage tasks
- Navigate workspaces, spaces, folders, and lists
- Track time, manage goals, or work with views
- Manage users, groups, guests, and webhooks
- Run project management workflows (sprint planning, reviews, triage)

## Discovery

**Do not guess command syntax.** Discover the correct flags using:

```bash
clickup schema <resource>              # List actions (list, get, create, ...)
clickup schema <resource>.<action>     # Show required/optional fields
clickup <resource> <action> --help     # Full help text
```

## Sub-Skills (load when needed)

| Skill | What it covers |
|-------|---------------|
| `clickup-tasks` | Tasks, subtasks, checklists, dependencies, attachments |
| `clickup-spaces` | Workspaces, spaces, folders, lists (hierarchy navigation) |
| `clickup-comments` | Comments, threaded replies, comment assignment |
| `clickup-time` | Time entries, running timers, time tags, reports |
| `clickup-goals` | Goals, key results, OKR tracking |
| `clickup-views` | Views (board, list, Gantt, etc.), view tasks |
| `clickup-users` | Users, groups, guests, roles, members |
| `clickup-webhooks` | Webhook registration and management |
| `clickup-fields` | Custom fields, tags, custom task types |

## Recipe Skills (load for multi-step workflows)

| Skill | Workflow |
|-------|----------|
| `clickup-weekly-review` | Generate a weekly team progress report |
| `clickup-sprint-planning` | Plan a sprint from backlog |
| `clickup-task-triage` | Triage and prioritize incoming tasks |
| `clickup-standup` | Generate a daily standup summary |
| `clickup-sprint-closeout` | Close a sprint, carry over incomplete work |
| `clickup-time-audit` | Audit time tracking and utilization |
| `clickup-project-setup` | Scaffold a new project structure |
| `clickup-capacity-check` | Check team workload and availability |
| `clickup-blocker-report` | Find blocked tasks and dependency chains |
| `clickup-goal-progress` | Report on goal/OKR completion |

## Quick Patterns

```bash
# List tasks in a list
clickup task list --list-id <id>

# Create a task and capture its ID
TASK_ID=$(clickup task create --list-id <id> --name "Task name" --format id)

# Search across workspace
clickup task search --workspace-id <id> --query "search text"

# Pipe IDs for batch operations
clickup task list --list-id <id> --format quiet | xargs -I{} clickup task get {}
```

## Global Flags

All commands support: `--format json|table|csv|quiet|id`, `--dry-run`, `--debug`, `--no-color`

## Auth

Requires a ClickUp API token. Check status with `clickup auth status`.
