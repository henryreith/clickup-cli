---
name: clickup-sprint-planning
description: Plan a sprint by selecting tasks from backlog, assigning them, setting dates, and organizing into a sprint list.
---

# Sprint Planning

Set up a new sprint by pulling tasks from the backlog, estimating, assigning, and organizing.

## Prerequisites

- Workspace and space IDs known
- Backlog list ID where unplanned tasks live
- Sprint list exists (or create one)

## Workflow

### Step 1: Create the sprint list (if needed)

```bash
SPRINT_LIST=$(clickup list create --folder-id <folder-id> --name "Sprint 12 (Mar 10-21)" --format id)
```

Or for folderless:
```bash
SPRINT_LIST=$(clickup list create-folderless --space-id <space-id> --name "Sprint 12" --format id)
```

### Step 2: Review the backlog

```bash
# List unassigned or unprioritized tasks in backlog
clickup task list --list-id <backlog-list-id> --format json

# Or search for high-priority items
clickup task search --workspace-id <id> --priority 1 --priority 2 \
  --status "backlog" --status "to do" --format json
```

### Step 3: Move tasks into the sprint

```bash
# Add selected tasks to the sprint list
clickup list add-task $SPRINT_LIST --task-id <task-id-1>
clickup list add-task $SPRINT_LIST --task-id <task-id-2>
clickup list add-task $SPRINT_LIST --task-id <task-id-3>
```

### Step 4: Assign and set dates

```bash
# Update each task with assignee, dates, and estimate
clickup task update <task-id> \
  --assignee-add 112233 \
  --start-date <sprint-start-ms> \
  --due-date <sprint-end-ms> \
  --status "to do"
```

### Step 5: Set time estimates (optional)

```bash
clickup task update <task-id> --time-estimate 14400000   # 4 hours
```

### Step 6: Create a sprint goal (optional)

```bash
GOAL=$(clickup goal create --workspace-id <id> --name "Sprint 12 - Ship auth module" \
  --due-date <sprint-end-ms> --format id)

# Link the sprint list as an automatic key result
clickup goal add-key-result $GOAL --name "Sprint tasks completed" \
  --type automatic --list-ids $SPRINT_LIST
```

### Step 7: Verify sprint setup

```bash
# List all tasks in the new sprint
clickup task list --list-id $SPRINT_LIST --format table
```

## Tips

- Tasks can belong to multiple lists, so adding to a sprint list does not remove from backlog
- Use `--format quiet` to get just IDs for scripting
- Set the sprint goal with `--type automatic` to auto-track % completion
- Consider tagging sprint tasks: `clickup tag add --task-id <id> --name "sprint-12"`
