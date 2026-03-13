---
name: clickup-fields
description: Manages ClickUp custom fields, tags, and custom task types. Use when the user asks about custom fields, wants to set field values on tasks, manage tags, or work with custom task types.
allowed-tools: Bash(clickup custom-field *), Bash(clickup tag *), Bash(clickup custom-task-type *), Bash(clickup schema field*), Bash(clickup schema tag*)
---

# ClickUp Custom Fields, Tags, and Task Types

## Custom Field Commands

Custom fields are defined at the list level and set on individual tasks.

```bash
clickup field list --list-id <id>                              # List field definitions
clickup field set --task-id <id> --field-id <fid> --value <v>  # Set a field value
clickup field remove --task-id <id> --field-id <fid>           # Clear a field value
```

### Value formats by field type

| Type | Format | Example |
|------|--------|---------|
| text | Plain string | `"Approved"` |
| number | Numeric string | `"42"` |
| currency | Numeric string | `"99.99"` |
| date | Unix timestamp (ms) | `"1735689600000"` |
| checkbox | `true` or `false` | `"true"` |
| dropdown | Option ID | `"1"` |
| label | JSON array of option IDs | `"[1,2]"` |
| user | User ID | `"112233"` |
| url | URL string | `"https://example.com"` |
| rating | Integer | `"4"` |

## Tag Commands

Tags are defined at the space level and applied to tasks.

```bash
clickup tag list --space-id <id>
clickup tag create --space-id <id> --name <name> [--fg-color <hex>] [--bg-color <hex>]
clickup tag update --space-id <id> --name <name> [--new-name <name>] [--fg-color <hex>] [--bg-color <hex>]
clickup tag delete --space-id <id> --name <name> --confirm
clickup tag add --task-id <id> --name <name>
clickup tag remove --task-id <id> --name <name>
```

## Custom Task Type Commands

Custom task types (Bug, Feature, Milestone, etc.) are defined at the workspace level (Enterprise plan).

```bash
clickup task-type list --workspace-id <id>
```

## Common Patterns

```bash
# Set a custom field on a task
clickup field set --task-id abc9zt --field-id cf_001 --value "Approved"

# Create and apply a tag
clickup tag create --space-id 55544433 --name "urgent" --bg-color "#FF0000"
clickup tag add --task-id abc9zt --name "urgent"

# List all fields available in a list (to find field IDs)
clickup field list --list-id 998877 --format json

# Render field list as markdown table
clickup field list --list-id 998877 --format md
```

## Discovery

```bash
clickup schema fields.set      # Show field set options
clickup schema tags.create     # Show tag create fields
```
