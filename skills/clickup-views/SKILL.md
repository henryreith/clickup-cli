---
name: clickup-views
description: Creates and manages ClickUp views including board, list, Gantt, calendar, and workload views. Use when the user asks about views, wants to create a kanban board, see tasks through a specific view, or configure view settings.
allowed-tools: Bash(clickup view *), Bash(clickup schema view*)
---

# ClickUp Views

Views are saved display configurations that can exist at workspace, space, folder, or list level.

## Commands

### List views
```bash
clickup view list --workspace-id <id>
clickup view list --space-id <id>
clickup view list --folder-id <id>
clickup view list --list-id <id>
```

### Get / Create / Update / Delete
```bash
clickup view get <view-id>

clickup view create --workspace-id <id> --name <name> --type <type>
clickup view create --space-id <id> --name <name> --type <type>
clickup view create --folder-id <id> --name <name> --type <type>
clickup view create --list-id <id> --name <name> --type <type>

clickup view update <view-id> [--name <name>] [--settings <json>]
    [--grouping <json>] [--sorting <json>] [--filters <json>]

clickup view delete <view-id> --confirm
```

### Get tasks from a view
```bash
clickup view tasks <view-id> [--page <n>]
```

## View Types

`list`, `board`, `calendar`, `gantt`, `table`, `timeline`, `activity`, `map`, `workload`

## Common Patterns

```bash
# Create a kanban board at the space level
clickup view create --space-id 55544433 --name "Sprint Board" --type board

# Get all tasks visible in a view
clickup view tasks view_abc --format json

# List views at the workspace level
clickup view list --workspace-id 9876543
```

## Discovery

```bash
clickup schema views.create    # Show create fields and view types
```
