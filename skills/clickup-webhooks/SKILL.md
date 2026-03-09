---
name: clickup-webhooks
description: Register and manage ClickUp webhooks for real-time event notifications.
---

# ClickUp Webhooks

Webhooks deliver real-time event payloads to your endpoint when activity occurs in ClickUp.

## Commands

```bash
clickup webhook list --workspace-id <id>

clickup webhook create --workspace-id <id> --endpoint <url> --events <event>...
    [--space-id <id>] [--folder-id <id>] [--list-id <id>] [--task-id <id>]

clickup webhook update <webhook-id>
    [--endpoint <url>] [--events <event>...] [--status <active|inactive>]

clickup webhook delete <webhook-id> --confirm

clickup webhook events    # List all available event types
```

## Scoping

Webhooks can be scoped to a specific resource level:
- **Workspace-wide**: Omit scope flags (receives all events)
- **Space**: Add `--space-id <id>`
- **Folder**: Add `--folder-id <id>`
- **List**: Add `--list-id <id>`
- **Task**: Add `--task-id <id>`

## Common Patterns

```bash
# List available event types
clickup webhook events

# Create a webhook for task events in a space
clickup webhook create --workspace-id 9876543 --endpoint https://hooks.example.com/clickup \
  --events taskCreated taskUpdated --space-id 55544433

# Disable a webhook temporarily
clickup webhook update wh_001 --status inactive

# Re-enable it
clickup webhook update wh_001 --status active
```

## Discovery

```bash
clickup schema webhooks.create    # Show webhook create fields
clickup webhook events            # List all event type names
```
