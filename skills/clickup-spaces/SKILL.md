---
name: clickup-spaces
description: Navigates and manages the ClickUp hierarchy including workspaces, spaces, folders, and lists. Use when the user asks about project structure, wants to create spaces or lists, navigate the hierarchy, or find where tasks live.
allowed-tools: Bash(clickup workspace *), Bash(clickup space *), Bash(clickup folder *), Bash(clickup list *), Bash(clickup schema workspace*), Bash(clickup schema space*), Bash(clickup schema folder*), Bash(clickup schema list*)
---

# ClickUp Spaces (Hierarchy)

Manage the organizational hierarchy: Workspace > Space > Folder > List. Lists contain tasks.

## Workspace Commands

```bash
clickup workspace list                          # List all workspaces
clickup workspace get [--workspace-id <id>]     # Get workspace details
clickup workspace seats [--workspace-id <id>]   # Show seat usage
clickup workspace plan [--workspace-id <id>]    # Show billing plan
```

## Space Commands

```bash
clickup space list [--workspace-id <id>] [--archived]
clickup space get <space-id>
clickup space create --workspace-id <id> --name <name> [--multiple-assignees] [--features <json>]
clickup space update <space-id> [--name <name>] [--color <hex>] [--private <bool>]
clickup space delete <space-id> --confirm
```

## Folder Commands

```bash
clickup folder list --space-id <id> [--archived]
clickup folder get <folder-id>
clickup folder create --space-id <id> --name <name>
clickup folder update <folder-id> [--name <name>]
clickup folder delete <folder-id> --confirm
```

## List Commands

```bash
clickup list list --folder-id <id> [--archived]           # Lists in a folder
clickup list list-folderless --space-id <id> [--archived]  # Lists directly in a space
clickup list get <list-id>
clickup list create --folder-id <id> --name <name> [--content <text>] [--due-date <ts>] [--priority <1-4>]
clickup list create-folderless --space-id <id> --name <name> [--content <text>]
clickup list update <list-id> [--name <name>] [--content <text>]
clickup list delete <list-id> --confirm
clickup list add-task <list-id> --task-id <id>
clickup list remove-task <list-id> --task-id <id>
```

## Common Patterns

```bash
# Navigate the full hierarchy
clickup workspace list
clickup space list --workspace-id <id>
clickup folder list --space-id <id>
clickup list list --folder-id <id>
clickup task list --list-id <id>

# Find a list by exploring
clickup space list | grep "Engineering"
clickup folder list --space-id <id> | grep "Sprint"

# Set default workspace to avoid repeating --workspace-id
clickup config set workspace_id <id>

# Render folder list as markdown table for display in docs or chat
clickup folder list --space-id <id> --format md
```

## Key Concepts

- **Workspace** (also called "team"): Top-level container. Most users have one.
- **Space**: Primary organizational unit within a workspace. Has its own settings and features.
- **Folder**: Optional grouping inside a space. Contains lists.
- **List**: Contains tasks. Can be inside a folder or directly in a space (folderless).
- A task can belong to multiple lists.

## Discovery

```bash
clickup schema spaces         # List space actions
clickup schema lists.create   # Show list create fields
```
