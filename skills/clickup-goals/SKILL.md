---
name: clickup-goals
description: Create and manage ClickUp goals with measurable key results for OKR tracking.
---

# ClickUp Goals

Goals track high-level objectives with measurable key results. Key results can be numeric, currency, boolean, percentage, or derived from linked tasks.

## Goal Commands

```bash
clickup goal list --workspace-id <id> [--include-completed]
clickup goal get <goal-id>
clickup goal create --workspace-id <id> --name <name>
    [--due-date <ts>] [--description <text>] [--multiple-owners <bool>]
    [--owner <id>...] [--color <hex>]
clickup goal update <goal-id> [--name <name>] [--due-date <ts>] [--description <text>] [--color <hex>]
clickup goal delete <goal-id> --confirm
```

## Key Result Commands

```bash
clickup goal add-key-result <goal-id> --name <name> --type <type>
    [--steps-start <n>] [--steps-end <n>] [--unit <s>]
    [--task-ids <id>...] [--list-ids <id>...]

clickup goal update-key-result <key-result-id>
    [--name <name>] [--steps-current <n>] [--note <text>]

clickup goal delete-key-result <key-result-id> --confirm
```

Key result types: `number`, `currency`, `boolean`, `percentage`, `automatic`

- `automatic` type tracks completion % from linked tasks or lists
- Use `--task-ids` or `--list-ids` with automatic type

## Common Patterns

```bash
# Create a quarterly goal
clickup goal create --workspace-id 9876543 --name "Launch v2.0" \
  --due-date 1740787200000 --owner 112233

# Add a percentage key result
clickup goal add-key-result goal_001 --name "Test coverage" \
  --type percentage --steps-start 60 --steps-end 90

# Track sprint progress automatically
clickup goal add-key-result goal_001 --name "Sprint tasks" \
  --type automatic --list-ids 998877

# Update progress on a numeric key result
clickup goal update-key-result kr_001 --steps-current 75 --note "On track"

# List all active goals
clickup goal list --workspace-id 9876543
```

## Discovery

```bash
clickup schema goals.create           # Show goal create fields
clickup schema goals.add-key-result   # Show key result fields
```
