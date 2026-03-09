---
name: clickup-weekly-review
description: Generate a weekly team progress report from ClickUp. Summarizes completed tasks, in-progress work, blockers, and time logged.
---

# Weekly Review

Generate a comprehensive weekly progress report for a team or workspace.

## Prerequisites

- Workspace ID configured (`clickup config set workspace_id <id>`)
- Know the relevant space/list IDs for the team

## Workflow

### Step 1: Gather completed tasks this week

```bash
# Find tasks updated this week that are in a "closed" or "complete" status
clickup task search --workspace-id <id> \
  --date-updated-gt <monday-timestamp-ms> \
  --status "complete" --status "closed" \
  --format json
```

### Step 2: Gather in-progress tasks

```bash
clickup task search --workspace-id <id> \
  --status "in progress" --status "in review" \
  --format json
```

### Step 3: Find overdue tasks

```bash
clickup task search --workspace-id <id> \
  --due-date-lt <now-timestamp-ms> \
  --include-closed false \
  --format json
```

### Step 4: Gather time logged this week

```bash
clickup time list --workspace-id <id> \
  --start <monday-timestamp-ms> --end <friday-timestamp-ms> \
  --format json
```

### Step 5: Check goal progress

```bash
clickup goal list --workspace-id <id> --format json
```

### Step 6: Compile the report

Summarize the data into sections:
- **Completed this week**: Count and list of finished tasks
- **In progress**: Tasks actively being worked on
- **Overdue / Blocked**: Tasks past due or stuck
- **Time logged**: Total hours, by person if available
- **Goal progress**: Key result updates

## Customization

- Filter by space: add `--space-id <id>` to search commands
- Filter by assignee: add `--assignee <id>` to narrow to one person
- Adjust date range by modifying timestamps (use Monday-Friday of the target week)

## Tips

- Use `--format json` for all data gathering, then format the summary as markdown
- Timestamps are Unix milliseconds. Monday at midnight = start of week
- Combine with `clickup comment create` to post the summary back to a task or list
