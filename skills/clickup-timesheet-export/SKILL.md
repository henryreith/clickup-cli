---
name: clickup-timesheet-export
description: Exports ClickUp time entries for a period into a timesheet - CSV or markdown - with per-person and per-task totals and billable breakdowns. Use when the user asks for a timesheet, billable hours export, invoice backup, or wants hours summed for payroll or a client.
license: MIT
disable-model-invocation: true
context: fork
agent: general-purpose
argument-hint: "[period and scope - e.g. 'last week', 'June for Sarah', 'this month billable only']"
allowed-tools: Bash(clickup *), Bash(node *), Write, Read
---

# Timesheet Export

Turn raw time entries into a clean timesheet with totals.

## Understanding the Scope

From `$ARGUMENTS` determine: the period (default: last 7 days), who (default: everyone), and whether to include only billable time. Resolve people via `clickup member list --format json`.

## Workflow

### Step 1: Pull time entries

```bash
clickup time list --workspace-id <id> \
    --start <period-start> --end <period-end> \
    [--assignee <user-id>] --format json
```

`--start`/`--end` accept ISO dates (`2026-06-01`), relative forms (`-30d`), or Unix timestamps. Entry durations are milliseconds.

### Step 2: Aggregate deterministically

Never sum hours yourself. Pipe the entries through the bundled script; the math comes out exact:

```bash
SKILL_DIR=$(clickup skill path clickup-timesheet-export)

# JSON summary: totals, byPerson, byTask, flagged entries
clickup time list --workspace-id <id> --start <start> --end <end> --format json \
    | node "$SKILL_DIR/scripts/aggregate.mjs"

# CSV rows for the export file
clickup time list --workspace-id <id> --start <start> --end <end> --format json \
    | node "$SKILL_DIR/scripts/aggregate.mjs" --csv
```

The summary's `flags` field lists running timers (excluded from totals), entries with no task, and entries over 12h.

### Step 3: Write the export

CSV for spreadsheets (default when the user says export/invoice):

Copy the exact structure from `assets/report-template.md` in this skill's directory (`clickup skill path clickup-timesheet-export` prints it). Fill every placeholder; drop sections with no content.

Save with the Write tool as `timesheet-<start>-<end>.csv` and tell the user the path. For a chat answer, use a markdown table plus totals instead.

### Step 4: Summarize

Use the summary block from the same template.

## Tips

- Cross-check suspicious days (over 12h per person) rather than silently exporting them.
- For a recurring client invoice, filter to the client's space via the task IDs' locations.
