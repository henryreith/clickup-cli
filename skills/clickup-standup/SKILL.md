---
name: clickup-standup
description: Generate a daily standup summary from ClickUp - what was done yesterday, what is planned today, and blockers.
---

# Daily Standup

Generate a standup report covering yesterday's progress, today's plan, and current blockers.

## Prerequisites

- Workspace ID configured
- Know the assignee user ID(s) for the standup

## Workflow

### Step 1: What was done yesterday

```bash
# Tasks updated yesterday with completed/closed status
clickup task search --workspace-id <id> \
  --date-updated-gt <yesterday-start-ms> \
  --date-updated-lt <yesterday-end-ms> \
  --assignee <user-id> \
  --status "complete" --status "closed" --status "done" \
  --format json
```

### Step 2: What is in progress today

```bash
clickup task search --workspace-id <id> \
  --assignee <user-id> \
  --status "in progress" --status "in review" \
  --format json
```

### Step 3: What is due today or overdue

```bash
clickup task search --workspace-id <id> \
  --assignee <user-id> \
  --due-date-lt <end-of-today-ms> \
  --include-closed false \
  --format json
```

### Step 4: Check for blockers

Look for tasks with dependencies or "blocked" status:

```bash
clickup task search --workspace-id <id> \
  --assignee <user-id> \
  --status "blocked" --status "waiting" \
  --format json
```

### Step 5: Check running timer (optional)

```bash
clickup time running --workspace-id <id> --assignee <user-id> --format json
```

### Step 6: Compile standup

Format as:

```
**Yesterday:**
- Completed: [list of finished tasks with names]

**Today:**
- Working on: [list of in-progress tasks]
- Due today: [list of tasks due today]

**Blockers:**
- [list of blocked tasks, if any]
```

## Tips

- Adjust timestamps: yesterday = midnight to midnight in the team's timezone
- For team standups, loop through multiple `--assignee` values
- Post the standup summary as a comment on a recurring "standup" task if desired
