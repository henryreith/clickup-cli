---
name: clickup-task-triage
description: Triages incoming ClickUp tasks by categorizing, prioritizing, assigning, and routing unprocessed tasks. Use when the user wants to triage tasks, sort through a backlog, prioritize incoming work, or clean up an inbox list.
disable-model-invocation: true
context: fork
agent: general-purpose
argument-hint: "[inbox-list-id]"
allowed-tools: Bash(clickup *)
---

# Task Triage

Sort through incoming/unprocessed tasks: prioritize, assign, add tags, and move to the right lists.

## Prerequisites

- Know the inbox/backlog list ID where new tasks land
- Know space IDs and assignee user IDs

## Workflow

### Step 1: Get unprocessed tasks

```bash
# List tasks with no priority or assignee (likely untriaged)
clickup task list --list-id <inbox-list-id> --format json
```

Filter candidates: tasks with priority=null, no assignees, or status "new"/"backlog".

### Step 2: Categorize each task

For each task, determine:
- **Priority**: 1 (urgent), 2 (high), 3 (normal), 4 (low)
- **Assignee**: Who should own it
- **Tags**: Bug, feature, improvement, support, etc.

### Step 3: Update tasks

```bash
# Set priority and assign
clickup task update <task-id> --priority 2 --assignee-add 112233 --status "to do"

# Add categorization tags
clickup tag add --task-id <task-id> --name "bug"

# Set a due date if time-sensitive
clickup task update <task-id> --due-date <timestamp-ms>
```

### Step 4: Route to appropriate lists (optional)

```bash
# Move bug to the bugs list
clickup list add-task <bugs-list-id> --task-id <task-id>

# Move feature request to the feature backlog
clickup list add-task <features-list-id> --task-id <task-id>
```

### Step 5: Handle duplicates

```bash
# Search for similar tasks
clickup task search --workspace-id <id> --query "error in login page"

# If duplicate found, add a dependency or comment
clickup comment create --task-id <task-id> --text "Duplicate of <other-task-id>. Closing."
clickup task update <task-id> --status "closed"
```

### Step 6: Verify triage is complete

```bash
# Confirm no tasks remain unprocessed
clickup task list --list-id <inbox-list-id> --status "new" --format quiet
```

## Tips

- Triage regularly (daily or per-sprint) to prevent backlog buildup
- Use `clickup task search --query` to detect duplicates before assigning
- Batch operations: pipe task IDs for efficiency
  ```bash
  clickup task list --list-id <id> --format quiet | xargs -I{} clickup task update {} --priority 3
  ```
