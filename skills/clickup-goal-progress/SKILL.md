---
name: clickup-goal-progress
description: Report on goal and OKR completion status - track key results, identify at-risk goals, and update progress.
---

# Goal Progress Report

Track OKR/goal completion, update key results, and identify goals that are at risk.

## Prerequisites

- Workspace ID

## Workflow

### Step 1: List all active goals

```bash
clickup goal list --workspace-id <id> --format json
```

### Step 2: Get detailed progress for each goal

```bash
clickup goal get <goal-id> --format json
```

The response includes key results with current progress values.

### Step 3: Calculate goal health

For each goal, assess:
- **On track**: Key results trending toward target by due date
- **At risk**: Key results below expected progress for the timeline
- **Behind**: Key results significantly below expected pace

Formula: Expected progress = (days elapsed / total days) * target value

### Step 4: Update key result progress

```bash
# Update a numeric key result
clickup goal update-key-result <kr-id> --steps-current 75 --note "Completed batch import feature"

# For automatic key results, check linked list/task completion
clickup task list --list-id <linked-list-id> --include-closed --format json
```

### Step 5: Compile the report

For each goal:
- **Goal name** and due date
- **Key results**: Current vs. target, % complete
- **Status**: On track / At risk / Behind
- **Notes**: Latest updates on each key result

### Step 6: Post updates (optional)

```bash
# Add a progress note to a key result
clickup goal update-key-result <kr-id> --note "Sprint 11 pushed this to 80%. On track for Q1 target."
```

## Tips

- Run goal progress reports weekly or bi-weekly
- Automatic key results linked to lists update in real-time as tasks are completed
- For manual key results (number, percentage), update `--steps-current` regularly
- Goals with no recent key result updates are likely stale and need attention
