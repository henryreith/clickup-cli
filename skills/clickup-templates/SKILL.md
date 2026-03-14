---
name: clickup-templates
description: Lists and applies ClickUp templates to create tasks, lists, and folders from saved process templates. Use when the user wants to roll out a repeatable process, create items from a template, or find what templates are available in the workspace.
allowed-tools: Bash(clickup template *), Bash(clickup schema template*)
---

# ClickUp Templates

List available templates and apply them to create tasks, lists, and folders. Templates are defined in the ClickUp UI and can be rolled out repeatedly via the CLI.

## List Templates

```bash
clickup template list [--workspace-id <id>] [--page <n>]
```

Returns all task templates in the workspace. Use this to find template IDs before applying them.

## Apply a Task Template

```bash
clickup template apply-task --list-id <id> --template-id <id> [--name <override-name>]
```

Creates a new task in the specified list using the template structure, including all custom fields defined on the template.

## Apply a List Template

```bash
# Into a folder
clickup template apply-list --folder-id <id> --template-id <id> [--name <override-name>]

# Into a space (folderless)
clickup template apply-list --space-id <id> --template-id <id> [--name <override-name>]
```

Provide exactly one of `--folder-id` or `--space-id`.

## Apply a Folder Template

```bash
clickup template apply-folder --space-id <id> --template-id <id> [--name <override-name>]
```

Creates an entire folder structure (with nested lists and tasks) from the template.

## Common Patterns

```bash
# Step 1: Find available templates
clickup template list --format json

# Step 2: Apply a task template and capture the new task ID
TASK_ID=$(clickup template apply-task --list-id <id> --template-id <tmpl_id> --format id)

# Step 3: Set assignee and due date on the created task
clickup task update "$TASK_ID" --assignee-add 112233 --due-date 1735689600000

# Step 4: Fill in custom fields
clickup field set --task-id "$TASK_ID" --field-id cf_001 --value "In Review"

# Roll out a named instance of a process template
clickup template apply-list --folder-id <id> --template-id <tmpl_id> --name "Q1 Launch - March 2026"

# Apply a folder template to scaffold a whole project
clickup template apply-folder --space-id <id> --template-id <tmpl_id> --name "Client Onboarding - Acme Corp"
```

## Discovery

```bash
clickup schema template               # List all template actions
clickup schema template.apply-task    # Show apply-task fields
clickup schema template.apply-list    # Show apply-list fields
clickup schema template.apply-folder  # Show apply-folder fields
```
