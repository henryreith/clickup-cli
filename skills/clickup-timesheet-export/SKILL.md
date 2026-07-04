---
name: clickup-timesheet-export
description: Exports ClickUp time entries for a period into a timesheet - CSV or markdown - with per-person and per-task totals and billable breakdowns. Use when the user asks for a timesheet, billable hours export, invoice backup, or wants hours summed for payroll or a client.
license: MIT
disable-model-invocation: true
context: fork
agent: general-purpose
argument-hint: "[period and scope - e.g. 'last week', 'June for Sarah', 'this month billable only']"
allowed-tools: Bash(clickup *), Write
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

### Step 2: Aggregate

Compute from the JSON:

- Hours per person per day (duration ms / 3,600,000, round to 2 decimals)
- Hours per task (join `task.id` to task names from the entries)
- Billable vs non-billable split (the `billable` field)
- Grand totals

### Step 3: Write the export

CSV for spreadsheets (default when the user says export/invoice):

```csv
date,person,task,description,hours,billable
2026-06-30,Sarah,Login bug fix,Safari redirect,2.50,true
```

Save with the Write tool as `timesheet-<start>-<end>.csv` and tell the user the path. For a chat answer, use a markdown table plus totals instead.

### Step 4: Summarize

```
Timesheet <start> to <end>
- Total: N hours (M billable / K non-billable)
- By person: Sarah 32.5h, Tom 28.0h, ...
- Top tasks: <task> 12.5h, ...
Flagged: entries with no task attached, running timers still open
```

## Tips

- Entries with a null `end` are running timers; exclude them from totals and flag them.
- Cross-check suspicious days (over 12h per person) rather than silently exporting them.
- For a recurring client invoice, filter to the client's space via the task IDs' locations.
