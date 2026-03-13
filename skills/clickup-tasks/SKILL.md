---
name: clickup-tasks
description: Creates, updates, searches, and manages ClickUp tasks, subtasks, checklists, dependencies, and attachments. Use when the user asks about tasks, wants to create or find work items, manage subtasks, add checklists, set dependencies, or upload files to tasks.
allowed-tools: Bash(clickup task *), Bash(clickup checklist *), Bash(clickup dependency *), Bash(clickup relation *), Bash(clickup attachment *), Bash(clickup schema tasks*), Bash(clickup schema checklist*)
---

# ClickUp Tasks

Manage the full task lifecycle: create, list, search, update, delete. Also covers subtasks, checklists, dependencies, relations, and attachments.

## Task Commands

### List tasks in a list
```bash
clickup task list --list-id <id> [--status <s>...] [--assignee <id>...] [--tag <name>...]
    [--due-date-gt <ts>] [--due-date-lt <ts>] [--include-closed] [--subtasks]
    [--order-by <id|created|updated|due_date>] [--reverse] [--page <n>]
```

### Search tasks across workspace
```bash
clickup task search --workspace-id <id> [--query <text>] [--status <s>...]
    [--assignee <id>...] [--list-id <id>...] [--space-id <id>...] [--priority <1-4>...]
    [--due-date-gt <ts>] [--due-date-lt <ts>] [--include-closed] [--page <n>]
```

### Get a single task
```bash
clickup task get <task-id> [--include-subtasks] [--include-markdown-description]
```

### Create a task
```bash
clickup task create --list-id <id> --name <name>
    [--description <text>] [--markdown-description <md>]
    [--status <s>] [--priority <1-4>] [--due-date <ts>] [--start-date <ts>]
    [--assignee <id>...] [--tag <name>...] [--time-estimate <ms>]
    [--parent <task-id>] [--custom-field <id=value>...]
```

### Update a task
```bash
clickup task update <task-id> [--name <name>] [--description <text>]
    [--status <s>] [--priority <1-4>] [--due-date <ts>] [--start-date <ts>]
    [--assignee-add <id>...] [--assignee-remove <id>...] [--archived <bool>]
```

### Delete a task
```bash
clickup task delete <task-id> --confirm
```

### Time in status
```bash
clickup task time-in-status <task-id>
clickup task bulk-time-in-status --task-id <id>...
```

## Checklist Commands

```bash
clickup checklist create --task-id <id> --name <name>
clickup checklist update <checklist-id> [--name <name>] [--position <n>]
clickup checklist delete <checklist-id> --confirm
clickup checklist add-item <checklist-id> --name <name> [--assignee <id>] [--resolved <bool>]
clickup checklist update-item <checklist-id> --item-id <id> [--name <name>] [--resolved <bool>]
clickup checklist delete-item <checklist-id> --item-id <id>
```

## Dependency Commands

```bash
# Task A depends on (is blocked by) Task B
clickup dependency add --task-id <A> --depends-on <B>

# Task A blocks Task B
clickup dependency add --task-id <A> --dependency-of <B>

# Remove dependency
clickup dependency remove --task-id <A> --depends-on <B>
```

## Relation Commands

```bash
clickup relation add --task-id <id> --links-to <id>
clickup relation remove --task-id <id> --links-to <id>
```

## Attachment Commands

```bash
clickup attachment upload --task-id <id> --file <path> [--filename <name>]
```

## Common Patterns

```bash
# Create a subtask
clickup task create --list-id <id> --name "Subtask" --parent <parent-task-id>

# Find overdue tasks
clickup task list --list-id <id> --due-date-lt $(date +%s000) --include-closed false

# Create task and immediately comment
TASK_ID=$(clickup task create --list-id <id> --name "Bug fix" --format id)
clickup comment create --task-id "$TASK_ID" --text "Starting investigation"

# Bulk get tasks by ID
clickup task list --list-id <id> --format quiet | xargs -I{} clickup task get {}

# Render task list as markdown table (for display in chat or docs)
clickup task list --list-id <id> --format md

# Send task list to a chat channel
clickup chat send --channel-id <id> --message "$(clickup task list --list-id <id> --format md)"
```

## Discovery

```bash
clickup schema tasks              # List all task actions
clickup schema tasks.create       # Show create fields
clickup schema tasks.list         # Show list filter flags
```
