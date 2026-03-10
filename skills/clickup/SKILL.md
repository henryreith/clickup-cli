---
name: clickup
description: Manages ClickUp projects, tasks, spaces, lists, time tracking, goals, and more via CLI. Use when the user needs to create tasks, check project status, manage sprints, track time, find work items, or interact with ClickUp data in any way.
user-invocable: false
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

## Recipe Skills (multi-step workflows)

Recipes accept natural language arguments. Scope them to any team, department, person, or project.

| Skill | Workflow |
|-------|----------|
| `clickup-weekly-review` | Weekly progress report for any team or scope |
| `clickup-team-report` | Department/team status rundown (marketing, engineering, ops, etc.) |
| `clickup-custom-report` | Any ad-hoc query or filtered report |
| `clickup-sprint-planning` | Plan a sprint from backlog |
| `clickup-task-triage` | Triage and prioritize incoming tasks |
| `clickup-standup` | Daily standup summary for a person or team |
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

## Creating Custom Skills

Users can create their own skills alongside the built-in ones. Add a SKILL.md to `.claude/skills/<name>/` in any project:

```yaml
---
name: marketing-weekly
description: Weekly marketing department review
disable-model-invocation: true
context: fork
agent: general-purpose
allowed-tools: Bash(clickup *)
---

Generate a marketing department weekly review:
1. Get all tasks in the Marketing space (space ID: YOUR_SPACE_ID)
2. Focus on campaign tasks, content pipeline, and ad performance items
3. Highlight completed deliverables and upcoming deadlines
4. Flag any blocked creative reviews
```

This creates `/marketing-weekly` as a custom skill that works alongside the built-in `/clickup:*` skills.
