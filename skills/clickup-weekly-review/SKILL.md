---
name: clickup-weekly-review
description: Generates a weekly progress report from ClickUp, scoped to any team, department, space, or workspace. Summarizes completed tasks, in-progress work, blockers, and time logged. Use when the user asks for a weekly update, progress report, team summary, department rundown, or wants to know what happened this week.
disable-model-invocation: true
context: fork
agent: general-purpose
argument-hint: "[scope - e.g. 'marketing team', space-id, or workspace-id]"
allowed-tools: Bash(clickup *)
---

# Weekly Review

Generate a weekly progress report scoped to whatever the user asks about.

## Understanding the Scope

The user's request determines what to report on. Interpret `$ARGUMENTS` to figure out the right filters:

- **Workspace-wide**: Use `--workspace-id` only
- **A specific space** (e.g. "marketing", "engineering"): Find the space ID first with `clickup space list`, then filter with `--space-id`
- **A specific list or folder**: Filter by `--list-id` or `--folder-id`
- **A specific person**: Filter with `--assignee`
- **A department or team name**: Search spaces/folders for matching names, then scope to those IDs

If no scope is provided, report on the full workspace.

## Workflow

### Step 1: Resolve the scope

```bash
# If user gave a name (e.g. "marketing"), find the matching space/folder/list
clickup space list --format json

# If user gave an ID, use it directly
# If no scope, use the configured workspace
```

### Step 2: Gather completed tasks this week

```bash
# Find tasks completed this week (adjust timestamps for current week)
clickup task search --workspace-id <id> \
  --date-updated-gt <monday-timestamp-ms> \
  --status "complete" --status "closed" \
  --format json
```

Add `--space-id`, `--list-id`, or `--assignee` filters based on the resolved scope.

### Step 3: Gather in-progress tasks

```bash
clickup task search --workspace-id <id> \
  --status "in progress" --status "in review" \
  --format json
```

### Step 4: Find overdue tasks

```bash
clickup task search --workspace-id <id> \
  --due-date-lt <now-timestamp-ms> \
  --include-closed false \
  --format json
```

### Step 5: Gather time logged this week

```bash
clickup time list --workspace-id <id> \
  --start <monday-timestamp-ms> --end <friday-timestamp-ms> \
  --format json
```

### Step 6: Check goal progress (if applicable)

```bash
clickup goal list --workspace-id <id> --format json
```

### Step 7: Compile the report

Summarize the data into a clear report with sections:
- **Completed this week**: Count and highlights of finished tasks
- **In progress**: Tasks actively being worked on
- **Overdue / Blocked**: Tasks past due or stuck
- **Time logged**: Total hours, broken down by person if available
- **Goal progress**: Key result updates (if goals exist for this scope)

## Customization

The user can refine the report with natural language:
- "Weekly review for the marketing space" -> filter by marketing space ID
- "What did Sarah do this week?" -> filter by assignee
- "Engineering team weekly update" -> find engineering space, filter
- "Weekly review for list 12345" -> filter by specific list
- "Give me last week's review" -> adjust date range to previous week

## Tips

- Use `--format json` for all data gathering, then format the summary as markdown
- Timestamps are Unix milliseconds. Monday at midnight = start of week
- If a team/department name doesn't match a space, check folder names too
- Combine with `clickup comment create` to post the summary back to a task or list
