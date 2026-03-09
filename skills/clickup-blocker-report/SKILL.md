---
name: clickup-blocker-report
description: Find blocked tasks, dependency chains, and stale items that need attention.
---

# Blocker Report

Identify blocked tasks, broken dependency chains, and items that have been stalled.

## Prerequisites

- Workspace ID

## Workflow

### Step 1: Find explicitly blocked tasks

```bash
clickup task search --workspace-id <id> \
  --status "blocked" --status "waiting" --status "on hold" \
  --format json
```

### Step 2: Find stale in-progress tasks

Tasks that have been "in progress" for too long without updates:

```bash
# In-progress tasks not updated in the last 7 days
clickup task search --workspace-id <id> \
  --status "in progress" \
  --date-updated-lt <seven-days-ago-ms> \
  --format json
```

### Step 3: Check dependencies on blocked tasks

For each blocked task, get its full details to see dependency info:

```bash
clickup task get <blocked-task-id> --format json
```

The response includes `dependencies` and `linked_tasks` arrays showing what is blocking the task.

### Step 4: Find overdue unassigned tasks

```bash
clickup task search --workspace-id <id> \
  --due-date-lt <now-ms> \
  --include-closed false \
  --format json
```

Filter results for tasks with empty assignee arrays - these are orphaned and overdue.

### Step 5: Check time-in-status for stuck tasks

```bash
# How long have blocked tasks been in their current status?
clickup task bulk-time-in-status --task-id <id1> --task-id <id2> --format json
```

### Step 6: Compile the report

- **Blocked tasks**: What, who, and what is blocking them
- **Stale tasks**: In progress but not updated recently
- **Overdue + unassigned**: Nobody owns these
- **Dependency chains**: If A blocks B blocks C, surface the chain

### Step 7: Take action

```bash
# Reassign a stale task
clickup task update <task-id> --assignee-add <id>

# Add a comment to escalate
clickup comment create --task-id <task-id> --text "This has been blocked for 5 days. Needs attention."

# Update status if blocker is resolved
clickup task update <task-id> --status "in progress"
```

## Tips

- Run blocker reports at least twice per sprint
- Tasks in "blocked" status for more than 3 days should be escalated
- Cross-reference with the capacity-check recipe to see if blockers are due to overload
