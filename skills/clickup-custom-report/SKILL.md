---
name: clickup-custom-report
description: Generates a custom ClickUp report based on any criteria the user describes. Handles ad-hoc queries like "show me all high-priority tasks assigned to John", "what's overdue in the backend", or "tasks created this month with no assignee". Use when the user asks for a specific data pull, custom query, filtered view, or any report that does not match a predefined recipe.
disable-model-invocation: true
context: fork
agent: general-purpose
argument-hint: "[describe what you want to see]"
allowed-tools: Bash(clickup *)
---

# Custom Report

Generate any report the user asks for by composing CLI commands to match their criteria.

## Understanding the Request

`$ARGUMENTS` is a natural language description of what the user wants. Parse it to determine:

1. **What data**: tasks, time entries, goals, comments, etc.
2. **Filters**: status, assignee, priority, dates, space, list, tags, custom fields
3. **Grouping**: by person, by status, by space, by priority, by date
4. **Output style**: summary, detailed list, counts, comparison

## Available Filters

Use these CLI flags to build the right query:

### Task filters
```bash
clickup task search --workspace-id <id> \
  --status "in progress"            # Filter by status
  --assignee <user-id>              # Filter by assignee
  --priority 1                      # Filter by priority (1=urgent, 2=high, 3=normal, 4=low)
  --due-date-gt <timestamp-ms>      # Due after date
  --due-date-lt <timestamp-ms>      # Due before date
  --date-created-gt <timestamp-ms>  # Created after date
  --date-updated-gt <timestamp-ms>  # Updated after date
  --tag "bug"                       # Filter by tag
  --space-id <id>                   # Scope to space
  --list-id <id>                    # Scope to list
  --include-closed true             # Include completed tasks
  --format json
```

### Time entry filters
```bash
clickup time list --workspace-id <id> \
  --start <timestamp-ms>            # Period start
  --end <timestamp-ms>              # Period end
  --assignee <user-id>              # Filter by person
  --format json
```

### Other data
```bash
clickup goal list --workspace-id <id> --format json
clickup comment list --task-id <id> --format json
clickup view tasks --view-id <id> --format json
```

## Workflow

### Step 1: Parse the request

Break down the natural language request into concrete filters. Examples:

| User says | Filters to apply |
|-----------|-----------------|
| "High priority tasks with no assignee" | `--priority 1 --priority 2`, then filter results for empty assignee |
| "What did the team complete last month" | `--status complete --date-updated-gt <month-start> --date-updated-lt <month-end>` |
| "Tasks in the design space due this week" | `--space-id <design-space> --due-date-lt <end-of-week>` |
| "Show me everything tagged 'urgent'" | `--tag urgent` |
| "Overdue tasks by priority" | `--due-date-lt <now> --include-closed false`, group by priority |

### Step 2: Resolve names to IDs

If the user used names instead of IDs, look them up:

```bash
# Find a space by name
clickup space list --format json

# Find a user by name
clickup member list --workspace-id <id> --format json

# Find a list by name within a space
clickup list list --space-id <id> --format json
```

### Step 3: Run the query

Execute the search with all applicable filters. Use `--format json` for structured data.

### Step 4: Process and format results

- Group results as the user requested (by person, status, priority, etc.)
- Calculate aggregates (counts, totals, averages) if asked
- Sort by the most relevant field (due date, priority, creation date)

### Step 5: Present the report

Format the output clearly with:
- A summary line (e.g., "Found 23 high-priority tasks across 3 spaces")
- Grouped/sorted data with relevant details
- Actionable insights if patterns emerge (e.g., "12 of 23 are unassigned")

## Example Requests

These all work with this recipe:

- "Show me all tasks created this week"
- "How many tasks does each team member have?"
- "What's overdue in engineering?"
- "Tasks tagged 'client-facing' that are still in progress"
- "Compare task completion rates between marketing and sales this quarter"
- "Find tasks with time estimates but no time logged"
- "All tasks due in the next 3 days with priority 1 or 2"
- "What tasks were closed without any comments?"

## Tips

- Combine multiple searches if a single query can't capture everything
- Use `clickup schema tasks.search` to discover available filter flags
- For complex comparisons, run separate searches and merge the results
- If the user asks for something the CLI can't filter directly, fetch a broader set and filter in post-processing
