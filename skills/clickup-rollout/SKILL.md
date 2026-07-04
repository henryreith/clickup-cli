---
name: clickup-rollout
description: Rolls out a saved process template in ClickUp by applying it to a target location, then configuring assignees, due dates, and custom fields. Use when the user says "start a new [project/process/sprint/onboarding]" or wants to kick off a repeatable workflow from a template.
license: MIT
disable-model-invocation: true
context: fork
agent: general-purpose
argument-hint: "[template name or ID] [target location] [optional: assignee, due date, custom fields]"
allowed-tools: Bash(clickup *)
---

# Template Rollout

Apply a saved ClickUp template and configure the resulting task, list, or folder for a new instance of the process.

Interpret `$ARGUMENTS` as the scope (workspace, space, list, person, or time period as the sections below expect); when it is empty, ask or fall back to the configured workspace.

## Workflow

### Step 1: Find the template

```bash
# List all templates to find the right one
clickup template list --format json
```

If the user gave a template name, find its ID by matching the `name` field. If they gave an ID directly, skip this step.

### Step 2: Determine the template type and target

Based on what the user wants to create:
- **Task template**: needs a `--list-id` target
- **List template**: needs a `--folder-id` or `--space-id` target
- **Folder template**: needs a `--space-id` target

If the user hasn't specified a target, find it:
```bash
clickup space list --format json
clickup folder list --space-id <id> --format json
clickup list list --folder-id <id> --format json
```

### Step 3: Apply the template

```bash
# Task template
TASK_ID=$(clickup template apply-task \
  --list-id <list-id> \
  --template-id <tmpl-id> \
  --name "<instance-name>" \
  --format id)

# List template (into folder)
LIST_ID=$(clickup template apply-list \
  --folder-id <folder-id> \
  --template-id <tmpl-id> \
  --name "<instance-name>" \
  --format id)

# List template (into space, folderless)
LIST_ID=$(clickup template apply-list \
  --space-id <space-id> \
  --template-id <tmpl-id> \
  --name "<instance-name>" \
  --format id)

# Folder template
FOLDER_ID=$(clickup template apply-folder \
  --space-id <space-id> \
  --template-id <tmpl-id> \
  --name "<instance-name>" \
  --format id)
```

### Step 4: Configure the created resource

For a task template result, set assignees, dates, and custom fields:
```bash
# Assign team members
clickup task update "$TASK_ID" --assignee-add <user-id>

# Set start and due dates (Unix ms, ISO 8601, or relative like "3d", "friday")
clickup task update "$TASK_ID" --start-date <date> --due-date <date>

# Fill in custom fields
clickup field set --task-id "$TASK_ID" --field-id <field-id> --value "<value>"
```

For a list template result, populate it with initial tasks if needed:
```bash
clickup task list --list-id "$LIST_ID" --format json  # review what the template created
```

For a folder template result, review the created structure:
```bash
clickup list list --folder-id "$FOLDER_ID" --format table
```

### Step 5: Confirm and summarize

Report what was created:
- Resource type and ID
- Name used
- Assignees set
- Dates configured
- Custom fields populated
- Link or path in the ClickUp hierarchy

## Tips

- Use `--name` to give each rollout a unique name (e.g. "Client Onboarding - Acme Corp" or "Sprint 14 - Apr 7")
- Templates carry over all custom field definitions -- just fill in the values after applying
- Task IDs from `--format id` can be piped directly into update and field commands
- If rolling out multiple instances at once, loop over a list of names or targets
