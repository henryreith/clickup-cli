---
name: clickup-capacity-check
description: Check team workload and capacity - see who is overloaded, who has bandwidth, and balance assignments.
---

# Capacity Check

Assess team workload by analyzing task assignments, time estimates, and time logged.

## Prerequisites

- Workspace ID
- Team member user IDs

## Workflow

### Step 1: Get each team member's active tasks

```bash
# For each team member, get their in-progress and to-do tasks
clickup task search --workspace-id <id> --assignee <user-id> \
  --status "to do" --status "in progress" --status "in review" \
  --format json
```

### Step 2: Sum time estimates per person

From the task data, calculate:
- Total estimated hours per person (sum `time_estimate` fields)
- Number of active tasks per person
- Number of high-priority (P1/P2) tasks per person

### Step 3: Check time logged this period

```bash
clickup time list --workspace-id <id> \
  --start <period-start-ms> --end <period-end-ms> \
  --assignee <user-id> \
  --format json
```

### Step 4: Check for overdue tasks per person

```bash
clickup task search --workspace-id <id> --assignee <user-id> \
  --due-date-lt <now-ms> --include-closed false \
  --format json
```

### Step 5: Compile capacity report

For each team member:
- **Active tasks**: Count and total estimated hours
- **Time logged this week**: Hours
- **Overdue tasks**: Count
- **Capacity status**: Under / At / Over capacity

### Step 6: Rebalance (if needed)

```bash
# Move a task from overloaded person to someone with bandwidth
clickup task update <task-id> --assignee-remove <overloaded-id> --assignee-add <available-id>
```

## Tips

- Time estimates are in milliseconds. Divide by 3600000 for hours.
- If time estimates are not set on tasks, use task count as a rough proxy
- Run capacity checks at sprint planning and mid-sprint
- Use `--format quiet` to get just task IDs for batch reassignment
