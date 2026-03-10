---
name: clickup-team-report
description: Generates a status report for any team, department, or area of the business in ClickUp. Covers task progress, workload distribution, upcoming deadlines, and highlights. Use when the user asks for a department rundown, team status, what marketing is doing, operations update, or any team/department-specific report.
disable-model-invocation: true
context: fork
agent: general-purpose
argument-hint: "[team or department name, e.g. 'marketing', 'engineering', 'operations']"
allowed-tools: Bash(clickup *)
---

# Team / Department Report

Generate a status report for any team, department, or area of the business. This recipe adapts to whatever scope the user asks about.

## Understanding the Request

`$ARGUMENTS` tells you what team or area to report on. This could be:

- A department name: "marketing", "engineering", "finance", "operations", "HR"
- A team name: "backend team", "design team", "QA"
- A project name: "website redesign", "Q1 launch"
- A space or folder name that maps to an area of the business
- A combination: "what's the marketing team working on this sprint"

## Workflow

### Step 1: Find the right scope

```bash
# List all spaces to find one matching the team/department
clickup space list --format json

# If the team maps to a folder within a space
clickup folder list --space-id <id> --format json

# If the team maps to specific lists
clickup list list --folder-id <id> --format json
```

Match the user's request to the appropriate space, folder, or list. A "marketing" request might match a "Marketing" space, a "Marketing" folder within a broader space, or multiple lists tagged for marketing work.

### Step 2: Get current task breakdown

```bash
# Get all active tasks in the identified scope
clickup task list --list-id <id> --format json

# Or search across the space
clickup task search --workspace-id <id> --space-id <space-id> --format json
```

### Step 3: Analyze workload distribution

```bash
# Get tasks grouped by status to understand the pipeline
clickup task search --workspace-id <id> --space-id <space-id> \
  --status "to do" --format json

clickup task search --workspace-id <id> --space-id <space-id> \
  --status "in progress" --format json

clickup task search --workspace-id <id> --space-id <space-id> \
  --status "complete" --status "closed" \
  --date-updated-gt <week-start-ms> \
  --format json
```

### Step 4: Check upcoming deadlines

```bash
# Tasks due in the next 7 days
clickup task search --workspace-id <id> --space-id <space-id> \
  --due-date-gt <now-ms> --due-date-lt <next-week-ms> \
  --include-closed false \
  --format json
```

### Step 5: Find blockers and risks

```bash
# Overdue tasks
clickup task search --workspace-id <id> --space-id <space-id> \
  --due-date-lt <now-ms> --include-closed false \
  --format json

# Blocked tasks
clickup task search --workspace-id <id> --space-id <space-id> \
  --status "blocked" --status "waiting" \
  --format json
```

### Step 6: Check time investment (if relevant)

```bash
clickup time list --workspace-id <id> \
  --start <week-start-ms> --end <now-ms> \
  --format json
```

Filter time entries to those related to the team's tasks.

### Step 7: Compile the report

Structure the report as:

- **Team/Department**: Name and scope of what is covered
- **Summary**: 2-3 sentence overview of where things stand
- **By the numbers**: Task counts (to do / in progress / done this week)
- **Key accomplishments**: Notable completed tasks
- **Currently working on**: In-progress items with assignees
- **Upcoming deadlines**: Tasks due in the next 7 days
- **Risks and blockers**: Overdue or blocked items needing attention
- **Time invested**: Hours logged this period (if time tracking is used)

## Adapting to the Request

The user might ask in many different ways. All of these should work:

- "What's marketing up to?" -> Find marketing space, broad status report
- "Give me an engineering rundown" -> Engineering space, technical focus
- "How's the Q1 launch going?" -> Find matching project/folder, progress focus
- "Operations team status" -> Operations space/folder, operational metrics
- "What is Sarah's team working on?" -> Find Sarah, get her team's space, report
- "Finance department this month" -> Finance space, expand date range to month

## Tips

- If a team doesn't map cleanly to one space, check folders and lists too
- Some organizations use tags instead of spaces for departments
- When the scope is ambiguous, report on the best match and mention what was included
- The user can always refine: "actually just the paid ads list within marketing"
