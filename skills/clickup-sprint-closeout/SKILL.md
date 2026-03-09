---
name: clickup-sprint-closeout
description: Close out a sprint - summarize completion, carry over incomplete tasks, and prepare retro data.
---

# Sprint Closeout

End a sprint cleanly: summarize what was done, carry over incomplete work, and gather data for a retrospective.

## Prerequisites

- Sprint list ID
- Next sprint list ID (or create one)
- Workspace ID

## Workflow

### Step 1: Get sprint completion status

```bash
# All tasks in the sprint list
clickup task list --list-id <sprint-list-id> --include-closed --format json
```

Categorize: completed vs. incomplete.

### Step 2: Calculate metrics

From the JSON output, compute:
- Total tasks in sprint
- Completed count
- Incomplete count
- Completion percentage

```bash
# Get time logged during the sprint
clickup time list --workspace-id <id> \
  --start <sprint-start-ms> --end <sprint-end-ms> \
  --format json
```

### Step 3: Carry over incomplete tasks

```bash
# Move incomplete tasks to the next sprint
clickup list add-task <next-sprint-list-id> --task-id <incomplete-task-1>
clickup list add-task <next-sprint-list-id> --task-id <incomplete-task-2>

# Update their dates to the new sprint window
clickup task update <incomplete-task-1> \
  --start-date <new-sprint-start-ms> \
  --due-date <new-sprint-end-ms>
```

### Step 4: Update goal progress (if sprint had a goal)

```bash
clickup goal get <sprint-goal-id> --format json
```

If using automatic key results linked to the sprint list, progress updates automatically.

### Step 5: Gather retro data

Compile for the retrospective:
- **Completed**: List of finished tasks
- **Carried over**: Tasks that did not finish and why
- **Time analysis**: Total hours logged vs. estimated
- **Blockers encountered**: Tasks that were blocked and for how long

```bash
# Time-in-status for carried-over tasks (shows where time was spent)
clickup task bulk-time-in-status --task-id <id1> --task-id <id2> --format json
```

### Step 6: Post summary (optional)

```bash
clickup comment create --task-id <retro-task-id> --text "Sprint 11 closeout: 85% completion (17/20 tasks). 3 carried over. See details below."
```

## Tips

- Always `--include-closed` when listing sprint tasks to see the full picture
- Use `time-in-status` to identify bottlenecks (tasks stuck in review, etc.)
- Tag carried-over tasks so they are easy to identify in the next sprint
