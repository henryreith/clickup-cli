---
name: clickup-workspace-audit
description: Runs a hygiene audit over a ClickUp workspace or space finding unassigned tasks, missing due dates, stale in-progress work, overdue items, and overloaded assignees. Use when the user asks to audit, clean up, or health-check their workspace, or asks what is falling through the cracks.
license: MIT
disable-model-invocation: true
context: fork
agent: general-purpose
argument-hint: "[scope - workspace, space name, or list name; optionally 'and fix']"
allowed-tools: Bash(clickup *), Bash(node *), Read
---

# Workspace Audit

Find hygiene problems across active tasks and report them with recommended fixes.

## Understanding the Scope

Interpret `$ARGUMENTS`: no scope means the whole workspace; a space or list name narrows the sweep (`--space-id` / `--list-id` filters on `task search`). If the user said "and fix" (or similar), offer to apply the recommended fixes after the report; never modify tasks without that instruction.

## Workflow

### Step 1: Pull the active task set

```bash
clickup task search --workspace-id <id> --format json
```

Server-side filters cannot express "no assignee" or "no due date", so fetch active tasks and inspect the JSON client-side. For large workspaces sweep one space at a time (`--space-id`).

### Step 2: Classify deterministically

Pipe the tasks through the bundled script so every task is bucketed by rule, not judgment:

```bash
SKILL_DIR=$(clickup skill path clickup-workspace-audit)
clickup task search --workspace-id <id> --format json \
    | node "$SKILL_DIR/scripts/classify.mjs" [--stale-days 14]
```

The output contains `activeTasks`, `flaggedTasks`, per-bucket lists, and per-person `load`. The buckets:

| Check | Condition |
|-------|-----------|
| Unassigned | `assignees` is empty |
| No due date | `due_date` is null |
| Overdue | `due_date` in the past, status not closed |
| Stale | status is in progress but `date_updated` older than 14 days |
| Overloaded assignee | one person holds a disproportionate share of open tasks (flag the top offenders) |

### Step 3: Check for blocked chains (optional, if dependencies are used)

Tasks with `blocked` or `waiting` status whose blockers are themselves overdue deserve a callout.

### Step 4: Report

Copy the exact structure from `assets/report-template.md` in this skill's directory (`clickup skill path clickup-workspace-audit` prints it). Fill every placeholder; drop sections with no content.

### Step 5: Apply fixes (only when asked)

```bash
clickup task update <id> --assignee-add <user-id>      # assign
clickup task update <id> --due-date friday             # set due date
clickup task update <id> --status "backlog"            # demote stale work honestly
```

Confirm the fix list with the user before running it; report each change as it lands.

## Tips

- `--include-closed` stays off: the audit is about active work.
- Dates accept relative forms (`friday`, `+1w`) so fixes read naturally.
- Re-run after fixes and show the before/after flagged counts.
