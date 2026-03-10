---
name: clickup-time-audit
description: Audits time tracking entries by checking utilization, finding missing entries, and comparing logged vs. estimated time. Use when the user wants to audit time, check billable hours, find unlogged work, or review team utilization.
disable-model-invocation: true
context: fork
agent: general-purpose
argument-hint: "[workspace-id] [start-date] [end-date]"
allowed-tools: Bash(clickup *)
---

# Time Audit

Audit time tracking data for accuracy, utilization, and completeness.

## Prerequisites

- Workspace ID
- Date range for the audit period

## Workflow

### Step 1: Pull all time entries for the period

```bash
clickup time list --workspace-id <id> \
  --start <period-start-ms> --end <period-end-ms> \
  --format json
```

### Step 2: Check per-person totals

From the JSON output, group by assignee and sum durations:
- Total hours per person
- Expected hours (working days x hours per day)
- Utilization % = logged / expected

### Step 3: Find tasks with time but no entries

```bash
# Get tasks that were active in the period
clickup task search --workspace-id <id> \
  --date-updated-gt <period-start-ms> \
  --date-updated-lt <period-end-ms> \
  --status "in progress" --status "complete" \
  --format json
```

Cross-reference: tasks that changed status but have zero time logged may be missing entries.

### Step 4: Compare estimated vs. actual

For tasks with time estimates:
- Pull task data (has `time_estimate` field)
- Pull time entries for those tasks
- Compare: actual / estimated ratio

```bash
# Get a task with its time estimate
clickup task get <task-id> --format json

# Get time logged on that task
clickup time list --task-id <task-id> --format json
```

### Step 5: Check for billable time

Filter time entries by billable flag to calculate billable vs. non-billable split.

### Step 6: Identify anomalies

Look for:
- Entries over 8 hours (forgot to stop timer?)
- Entries with no description
- Running timers that have been active for days

```bash
# Check for currently running timers
clickup time running --workspace-id <id> --format json
```

## Tips

- Duration is in milliseconds. Divide by 3600000 for hours.
- Use time tags to categorize entries (e.g., "client-work", "internal", "overhead")
- Run audits weekly to catch issues early rather than at month-end
