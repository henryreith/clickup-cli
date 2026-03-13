---
name: clickup-time
description: Tracks time in ClickUp including logging entries, managing running timers, tagging time, and querying reports. Use when the user asks about time tracking, wants to start or stop a timer, log hours, check who is working on what, or audit time entries.
allowed-tools: Bash(clickup time *), Bash(clickup schema time*)
---

# ClickUp Time Tracking

Log time entries, manage running timers, tag time, and query time data.

## Time Entry Commands

### List entries
```bash
clickup time list --task-id <id> [--start <date>] [--end <date>]
clickup time list --workspace-id <id> --start <date> --end <date> [--assignee <id>...]
```

### Create / Update / Delete
```bash
clickup time create --task-id <id> --duration <ms> --start <ts>
    [--description <text>] [--assignee <id>] [--billable <bool>] [--tag <name>...]

clickup time update <timer-id> --workspace-id <id>
    [--description <text>] [--duration <ms>] [--start <ts>]
    [--tag-action <add|remove>] [--tag <name>...] [--billable <bool>]

clickup time delete <timer-id> --workspace-id <id>
```

### Get / History
```bash
clickup time get <timer-id> --workspace-id <id>
clickup time history <timer-id> --workspace-id <id>
```

## Running Timers

```bash
clickup time start --task-id <id> --workspace-id <id>
    [--description <text>] [--billable <bool>] [--tag <name>...]
clickup time stop --workspace-id <id>
clickup time running --workspace-id <id> [--assignee <id>]
```

## Time Tags

```bash
clickup time tags --workspace-id <id>                              # List all time tags
clickup time add-tags --workspace-id <id> --timer-id <id>... --tag <name>...
clickup time remove-tags --workspace-id <id> --timer-id <id>... --tag <name>...
clickup time rename-tag --workspace-id <id> --name <old> --new-name <new>
```

## Common Patterns

```bash
# Log 2 hours of billable work
clickup time create --task-id abc9zt --duration 7200000 --start 1735650000000 --billable true

# Start a timer, do work, then stop it
clickup time start --task-id abc9zt --workspace-id 9876543 --description "API refactor"
# ... work ...
clickup time stop --workspace-id 9876543

# Check who has timers running
clickup time running --workspace-id 9876543

# Get all time entries for this week
clickup time list --workspace-id 9876543 --start 2025-01-06 --end 2025-01-12

# Render time entries as markdown table for reports
clickup time list --workspace-id 9876543 --format md
```

## Notes

- Duration is always in **milliseconds** (1 hour = 3600000, 1 minute = 60000)
- Start timestamps are Unix milliseconds
- `time delete` does **not** require `--confirm` (unlike most delete commands)

## Discovery

```bash
clickup schema time.create    # Show create fields
clickup schema time.list      # Show list/filter options
```
