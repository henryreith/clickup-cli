# ClickUp CLI - Command Reference

Complete command reference for the ClickUp CLI. Covers the full ClickUp API v2 surface.

---

## Table of Contents

- [Auth and Config](#auth-and-config)
- [Workspaces](#workspaces)
- [Spaces](#spaces)
- [Folders](#folders)
- [Lists](#lists)
- [Tasks](#tasks)
- [Checklists](#checklists)
- [Comments](#comments)
- [Custom Fields](#custom-fields)
- [Tags](#tags)
- [Dependencies and Relations](#dependencies-and-relations)
- [Attachments](#attachments)
- [Time Tracking](#time-tracking)
- [Goals](#goals)
- [Views](#views)
- [Users](#users)
- [User Groups](#user-groups)
- [Roles](#roles)
- [Guests](#guests)
- [Members](#members)
- [Webhooks](#webhooks)
- [Templates](#templates)
- [Custom Task Types](#custom-task-types)
- [Shared Hierarchy](#shared-hierarchy)
- [Docs](#docs)

---

## Auth and Config

Manage authentication credentials and CLI configuration. The CLI supports both personal API tokens and OAuth flows.

### Authentication

```
clickup auth login [--token <t>] [--oauth]
clickup auth logout
clickup auth status
clickup auth token
```

| Flag | Description |
|------|-------------|
| `--token <t>` | Authenticate with a personal API token directly |
| `--oauth` | Launch OAuth browser flow for workspace-level auth |

**Examples**

```bash
# Authenticate with a personal token
clickup auth login --token pk_abc123...

# Launch OAuth browser flow
clickup auth login --oauth

# Check current auth state
clickup auth status
```

### Configuration

```
clickup config set <key> <value>
clickup config get <key>
clickup config list
clickup config reset
clickup config path
```

| Command | Description |
|---------|-------------|
| `config set <key> <value>` | Set a config value (e.g. `workspace-id`, `default-list-id`) |
| `config get <key>` | Print the current value of a key |
| `config list` | Print all config key/value pairs |
| `config reset` | Reset config to defaults |
| `config path` | Print the path to the config file on disk |

**Examples**

```bash
# Set a default workspace so you don't need --workspace-id on every command
clickup config set workspace-id 9876543

# Check where the config file lives
clickup config path
```

---

## Workspaces

A workspace (also called a team) is the top-level container for all ClickUp data. Most commands accept `--workspace-id` to target a specific workspace; if you set a default via `clickup config set workspace-id <id>`, you can omit it.

```
clickup workspace list
clickup workspace get [--workspace-id <id>]
clickup workspace seats [--workspace-id <id>]
clickup workspace plan [--workspace-id <id>]
```

| Command | Description |
|---------|-------------|
| `workspace list` | List all workspaces the authenticated user belongs to |
| `workspace get` | Get details for a specific workspace |
| `workspace seats` | Show seat usage (used / available) |
| `workspace plan` | Show the current billing plan |

**Examples**

```bash
# List all workspaces you're a member of
clickup workspace list

# Get seat usage for a workspace
clickup workspace seats --workspace-id 9876543
```

---

## Spaces

Spaces are the primary organizational layer within a workspace. They group folders and lists and can carry feature flags and permission settings.

```
clickup space list [--workspace-id <id>] [--archived]
clickup space get <space-id>
clickup space create --workspace-id <id> --name <name> [--multiple-assignees] [--features <json>]
clickup space update <space-id> [--name <name>] [--color <hex>] [--private <bool>]
clickup space delete <space-id> [--confirm]
```

| Flag | Description |
|------|-------------|
| `--workspace-id <id>` | Target workspace (required unless set in config) |
| `--archived` | Include archived spaces in the listing |
| `--name <name>` | Space name |
| `--multiple-assignees` | Enable multiple assignees on tasks in this space |
| `--features <json>` | JSON object of feature flags to enable/disable |
| `--color <hex>` | Space accent color (e.g. `#FF5733`) |
| `--private <bool>` | Whether the space is private |

**Destructive:** `space delete` requires `--confirm`.

**Examples**

```bash
# List all spaces in the default workspace
clickup space list

# Create a space with due dates and time tracking enabled
clickup space create --workspace-id 9876543 --name "Engineering" --features '{"due_dates":{"enabled":true},"time_tracking":{"enabled":true}}'

# Delete a space (requires confirmation flag)
clickup space delete 112233 --confirm
```

---

## Folders

Folders sit inside spaces and contain lists. They are optional - lists can also live directly in a space (folderless).

```
clickup folder list --space-id <id> [--archived]
clickup folder get <folder-id>
clickup folder create --space-id <id> --name <name>
clickup folder update <folder-id> [--name <name>]
clickup folder delete <folder-id> [--confirm]
```

| Flag | Description |
|------|-------------|
| `--space-id <id>` | Parent space ID |
| `--archived` | Include archived folders |
| `--name <name>` | Folder name |

**Destructive:** `folder delete` requires `--confirm`.

**Examples**

```bash
# List folders in a space
clickup folder list --space-id 55544433

# Rename a folder
clickup folder update 998877 --name "Q2 Projects"
```

---

## Lists

Lists contain tasks. A list belongs to either a folder or directly to a space (folderless).

```
clickup list list --folder-id <id> [--archived]
clickup list list-folderless --space-id <id> [--archived]
clickup list get <list-id>
clickup list create --folder-id <id> --name <name> [--content <desc>] [--due-date <ts>] [--priority <n>] [--status <s>]
clickup list create-folderless --space-id <id> --name <name> [--content <desc>]
clickup list update <list-id> [--name <name>] [--content <desc>] [--due-date <ts>] [--unset-status]
clickup list delete <list-id> [--confirm]
clickup list add-task <list-id> --task-id <id>
clickup list remove-task <list-id> --task-id <id>
```

| Flag | Description |
|------|-------------|
| `--folder-id <id>` | Parent folder ID (for folder-based lists) |
| `--space-id <id>` | Parent space ID (for folderless lists) |
| `--archived` | Include archived lists |
| `--name <name>` | List name |
| `--content <desc>` | List description |
| `--due-date <ts>` | Due date as Unix timestamp (ms) |
| `--priority <n>` | Priority level: 1 (urgent) to 4 (low) |
| `--status <s>` | Default status for new tasks |
| `--unset-status` | Remove the default status from the list |
| `--task-id <id>` | Task to add to or remove from the list |

**Destructive:** `list delete` requires `--confirm`.

**Examples**

```bash
# List all folderless lists in a space
clickup list list-folderless --space-id 55544433

# Create a list inside a folder with a due date
clickup list create --folder-id 998877 --name "Sprint 4" --due-date 1735689600000

# Add an existing task to a second list (task can belong to multiple lists)
clickup list add-task 112233 --task-id abc9zt
```

---

## Tasks

Tasks are the core work unit. This is the most feature-rich command group, with extensive filtering and field options.

```
clickup task list --list-id <id> [options]
clickup task search --workspace-id <id> [options]
clickup task get <task-id> [--include-subtasks] [--include-markdown-description]
clickup task create --list-id <id> --name <name> [options]
clickup task update <task-id> [options]
clickup task delete <task-id> [--confirm]
clickup task time-in-status <task-id>
clickup task bulk-time-in-status --task-id <id>...
```

---

### task list

Retrieve tasks from a list. Supports pagination and extensive server-side filtering.

```
clickup task list --list-id <id>
    [--archived]
    [--include-closed]
    [--subtasks]
    [--page <n>]
    [--status <s>...]
    [--assignee <id>...]
    [--tag <name>...]
    [--due-date-gt <ts>]
    [--due-date-lt <ts>]
    [--date-created-gt <ts>]
    [--date-created-lt <ts>]
    [--date-updated-gt <ts>]
    [--date-updated-lt <ts>]
    [--custom-field <json>...]
    [--order-by <field>]
    [--reverse]
```

| Flag | Type | Description |
|------|------|-------------|
| `--list-id <id>` | string | **Required.** List to query |
| `--archived` | bool | Include archived tasks |
| `--include-closed` | bool | Include tasks in closed status |
| `--subtasks` | bool | Include subtasks in results |
| `--page <n>` | int | Page number for pagination (0-indexed, 100 tasks per page) |
| `--status <s>...` | string[] | Filter by one or more status names |
| `--assignee <id>...` | int[] | Filter by one or more assignee user IDs |
| `--tag <name>...` | string[] | Filter by one or more tag names |
| `--due-date-gt <ts>` | int (ms) | Tasks with due date after this timestamp |
| `--due-date-lt <ts>` | int (ms) | Tasks with due date before this timestamp |
| `--date-created-gt <ts>` | int (ms) | Tasks created after this timestamp |
| `--date-created-lt <ts>` | int (ms) | Tasks created before this timestamp |
| `--date-updated-gt <ts>` | int (ms) | Tasks last updated after this timestamp |
| `--date-updated-lt <ts>` | int (ms) | Tasks last updated before this timestamp |
| `--custom-field <json>...` | json[] | Filter by custom field value. Format: `{"field_id":"<id>","operator":"=","value":"<v>"}` |
| `--order-by <field>` | string | Sort field: `id`, `created`, `updated`, `due_date` |
| `--reverse` | bool | Reverse the sort order |

**Examples**

```bash
# Get all open tasks in a list assigned to user 112233
clickup task list --list-id 998877 --assignee 112233

# Get overdue tasks (due before now), sorted by due date
clickup task list --list-id 998877 --due-date-lt 1735689600000 --order-by due_date

# Page through a large list
clickup task list --list-id 998877 --page 2 --include-closed
```

---

### task search

Search tasks across an entire workspace with full filter support.

```
clickup task search --workspace-id <id>
    [--query <text>]
    [--status <s>...]
    [--assignee <id>...]
    [--list-id <id>...]
    [--folder-id <id>...]
    [--space-id <id>...]
    [--project-id <id>...]
    [--tag <name>...]
    [--priority <n>...]
    [--include-closed]
    [--subtasks]
    [--page <n>]
    [--due-date-gt <ts>]
    [--due-date-lt <ts>]
    [--date-created-gt <ts>]
    [--date-created-lt <ts>]
    [--custom-field <json>...]
    [--order-by <field>]
    [--reverse]
```

| Flag | Type | Description |
|------|------|-------------|
| `--workspace-id <id>` | string | **Required.** Workspace to search within |
| `--query <text>` | string | Full-text search query |
| `--status <s>...` | string[] | Filter by status names |
| `--assignee <id>...` | int[] | Filter by assignee user IDs |
| `--list-id <id>...` | string[] | Scope to specific lists |
| `--folder-id <id>...` | string[] | Scope to specific folders |
| `--space-id <id>...` | string[] | Scope to specific spaces |
| `--project-id <id>...` | string[] | Scope to specific projects |
| `--tag <name>...` | string[] | Filter by tag names |
| `--priority <n>...` | int[] | Filter by priority level (1=urgent, 2=high, 3=normal, 4=low) |
| `--include-closed` | bool | Include tasks in closed status |
| `--subtasks` | bool | Include subtasks |
| `--page <n>` | int | Page number (0-indexed) |
| `--due-date-gt <ts>` | int (ms) | Due after timestamp |
| `--due-date-lt <ts>` | int (ms) | Due before timestamp |
| `--date-created-gt <ts>` | int (ms) | Created after timestamp |
| `--date-created-lt <ts>` | int (ms) | Created before timestamp |
| `--custom-field <json>...` | json[] | Custom field filter. Format: `{"field_id":"<id>","operator":"=","value":"<v>"}` |
| `--order-by <field>` | string | Sort field: `id`, `created`, `updated`, `due_date` |
| `--reverse` | bool | Reverse sort order |

**Examples**

```bash
# Search for all urgent tasks mentioning "launch" across the workspace
clickup task search --workspace-id 9876543 --query "launch" --priority 1

# Find all overdue tasks assigned to a specific user across all spaces
clickup task search --workspace-id 9876543 --assignee 112233 --due-date-lt 1735689600000
```

---

### task get

```
clickup task get <task-id> [--include-subtasks] [--include-markdown-description]
```

| Flag | Description |
|------|-------------|
| `--include-subtasks` | Return subtasks nested under the task |
| `--include-markdown-description` | Return description as Markdown instead of plain text |

---

### task create

Create a new task in a list.

```
clickup task create --list-id <id> --name <name>
    [--description <desc>]
    [--markdown-description <md>]
    [--status <s>]
    [--priority <1-4>]
    [--due-date <date>]
    [--start-date <date>]
    [--assignee <id>...]
    [--tag <name>...]
    [--time-estimate <ms>]
    [--notify-all]
    [--parent <task-id>]
    [--links-to <task-id>]
    [--custom-field <id=value>...]
    [--check-required-custom-fields]
```

| Flag | Type | Description |
|------|------|-------------|
| `--list-id <id>` | string | **Required.** List to create the task in |
| `--name <name>` | string | **Required.** Task name |
| `--description <desc>` | string | Plain text description |
| `--markdown-description <md>` | string | Description as Markdown (overrides `--description`) |
| `--status <s>` | string | Initial status name |
| `--priority <1-4>` | int | 1=urgent, 2=high, 3=normal, 4=low |
| `--due-date <date>` | int (ms) | Due date as Unix timestamp in milliseconds |
| `--start-date <date>` | int (ms) | Start date as Unix timestamp in milliseconds |
| `--assignee <id>...` | int[] | One or more user IDs to assign |
| `--tag <name>...` | string[] | One or more tag names to apply |
| `--time-estimate <ms>` | int | Time estimate in milliseconds |
| `--notify-all` | bool | Notify all assignees and watchers on creation |
| `--parent <task-id>` | string | Create as a subtask of this task ID |
| `--links-to <task-id>` | string | Create a link relation to this task ID |
| `--custom-field <id=value>...` | string[] | Set custom fields. Format: `<field-id>=<value>` |
| `--check-required-custom-fields` | bool | Reject creation if required custom fields are missing |

**Examples**

```bash
# Create a simple task
clickup task create --list-id 998877 --name "Write release notes"

# Create a subtask with priority and an assignee
clickup task create --list-id 998877 --name "Review PR #44" \
  --parent abc9zt --priority 2 --assignee 112233

# Create a task with a Markdown description and time estimate
clickup task create --list-id 998877 --name "API integration" \
  --markdown-description "## Scope\n- Auth endpoints\n- Rate limiting" \
  --time-estimate 7200000
```

---

### task update

Update fields on an existing task. All flags are optional - only supplied fields are changed.

```
clickup task update <task-id>
    [--name <name>]
    [--description <desc>]
    [--status <s>]
    [--priority <1-4>]
    [--due-date <date>]
    [--start-date <date>]
    [--time-estimate <ms>]
    [--assignee-add <id>...]
    [--assignee-remove <id>...]
    [--archived <bool>]
```

| Flag | Type | Description |
|------|------|-------------|
| `--name <name>` | string | New task name |
| `--description <desc>` | string | Replace description (plain text) |
| `--status <s>` | string | New status name |
| `--priority <1-4>` | int | New priority level |
| `--due-date <date>` | int (ms) | New due date timestamp |
| `--start-date <date>` | int (ms) | New start date timestamp |
| `--time-estimate <ms>` | int | New time estimate in milliseconds |
| `--assignee-add <id>...` | int[] | Add assignees without replacing existing ones |
| `--assignee-remove <id>...` | int[] | Remove specific assignees |
| `--archived <bool>` | bool | Archive or unarchive the task |

---

### task delete / time-in-status

```
clickup task delete <task-id> [--confirm]
clickup task time-in-status <task-id>
clickup task bulk-time-in-status --task-id <id>...
```

**Destructive:** `task delete` requires `--confirm`.

`time-in-status` returns how long a task has spent in each status, including the current one. `bulk-time-in-status` accepts multiple task IDs.

**Examples**

```bash
# Delete a task
clickup task delete abc9zt --confirm

# Get time-in-status breakdown for multiple tasks
clickup task bulk-time-in-status --task-id abc9zt --task-id def3qr
```

---

## Checklists

Checklists are ordered lists of items that live inside a task. Each item can be assigned to a user and marked resolved.

```
clickup checklist create --task-id <id> --name <name>
clickup checklist update <checklist-id> [--name <name>] [--position <n>]
clickup checklist delete <checklist-id> [--confirm]
clickup checklist add-item <checklist-id> --name <name> [--assignee <id>] [--resolved <bool>] [--parent <item-id>]
clickup checklist update-item <checklist-id> --item-id <id> [--name <name>] [--resolved <bool>] [--assignee <id>] [--parent <item-id>]
clickup checklist delete-item <checklist-id> --item-id <id>
```

| Flag | Description |
|------|-------------|
| `--task-id <id>` | Parent task for the checklist |
| `--name <name>` | Checklist or item name |
| `--position <n>` | Order position of the checklist within the task (0-indexed) |
| `--assignee <id>` | User ID to assign to a checklist item |
| `--resolved <bool>` | Mark item as resolved/unresolved |
| `--parent <item-id>` | Nest this item under another item ID |
| `--item-id <id>` | Target checklist item ID |

**Destructive:** `checklist delete` and `checklist delete-item` require `--confirm`.

**Examples**

```bash
# Create a launch checklist on a task
clickup checklist create --task-id abc9zt --name "Launch checklist"

# Add a nested item under another item
clickup checklist add-item chk_001 --name "Verify staging" --parent chk_item_099

# Mark an item resolved
clickup checklist update-item chk_001 --item-id chk_item_099 --resolved true
```

---

## Comments

Comments can be attached to tasks, lists, or views. Threaded replies and comment assignment are supported.

```
clickup comment list --task-id <id> [--start <ts>] [--start-id <id>]
clickup comment list --list-id <id> [--start <ts>] [--start-id <id>]
clickup comment list --view-id <id> [--start <ts>] [--start-id <id>]

clickup comment create --task-id <id> --text <text> [--assignee <id>] [--notify-all]
clickup comment create --list-id <id> --text <text> [--assignee <id>] [--notify-all]
clickup comment create --view-id <id> --text <text> [--assignee <id>] [--notify-all]

clickup comment update <comment-id> --text <text> [--assignee <id>] [--resolved <bool>]
clickup comment delete <comment-id> [--confirm]
clickup comment list-threaded <comment-id>
clickup comment reply <comment-id> --text <text> [--assignee <id>] [--notify-all]
```

| Flag | Description |
|------|-------------|
| `--task-id / --list-id / --view-id` | Context to list or create comments on |
| `--start <ts>` | Pagination cursor: start after this timestamp |
| `--start-id <id>` | Pagination cursor: start after this comment ID |
| `--text <text>` | Comment body (plain text or Markdown) |
| `--assignee <id>` | Assign the comment to a user (creates an action item) |
| `--notify-all` | Send notifications to all watchers |
| `--resolved <bool>` | Mark the comment as resolved/unresolved |

**Destructive:** `comment delete` requires `--confirm`.

**Examples**

```bash
# Post a comment on a task
clickup comment create --task-id abc9zt --text "Ready for review. @dev-lead please check the auth section."

# Reply to a comment thread
clickup comment reply cmt_9988 --text "Done - pushed to staging."

# List threaded replies on a comment
clickup comment list-threaded cmt_9988
```

---

## Custom Fields

Custom fields are defined at the list level. You can read field definitions, set field values on tasks, and remove them.

```
clickup field list --list-id <id>
clickup field set --task-id <id> --field-id <fid> --value <value>
clickup field remove --task-id <id> --field-id <fid>
```

| Flag | Description |
|------|-------------|
| `--list-id <id>` | List to retrieve field definitions from |
| `--task-id <id>` | Task to set or remove a field value on |
| `--field-id <fid>` | ID of the custom field |
| `--value <value>` | Value to set. Format depends on field type (see notes below) |

**Value formats by field type:**

| Field type | Value format |
|------------|--------------|
| text | Plain string |
| number | Numeric string |
| currency | Numeric string |
| date | Unix timestamp (ms) |
| checkbox | `true` or `false` |
| dropdown | Option ID (integer) |
| label | Array of option IDs as JSON: `[1,2]` |
| user | User ID (integer) |
| url | URL string |
| rating | Integer within the field's range |

**Examples**

```bash
# List all custom fields defined for a list
clickup field list --list-id 998877

# Set a text custom field on a task
clickup field set --task-id abc9zt --field-id cf_001 --value "Approved"

# Clear a custom field value
clickup field remove --task-id abc9zt --field-id cf_001
```

---

## Tags

Tags are defined at the space level and can be applied to tasks within that space.

```
clickup tag list --space-id <id>
clickup tag create --space-id <id> --name <name> [--fg-color <hex>] [--bg-color <hex>]
clickup tag update --space-id <id> --name <name> [--new-name <name>] [--fg-color <hex>] [--bg-color <hex>]
clickup tag delete --space-id <id> --name <name> [--confirm]
clickup tag add --task-id <id> --name <name>
clickup tag remove --task-id <id> --name <name>
```

| Flag | Description |
|------|-------------|
| `--space-id <id>` | Space where the tag is defined |
| `--name <name>` | Tag name |
| `--new-name <name>` | Replacement name (for update) |
| `--fg-color <hex>` | Tag label text color (e.g. `#FFFFFF`) |
| `--bg-color <hex>` | Tag label background color (e.g. `#8B5CF6`) |
| `--task-id <id>` | Task to apply or remove a tag on |

**Destructive:** `tag delete` requires `--confirm`.

**Examples**

```bash
# Create a purple "design" tag
clickup tag create --space-id 55544433 --name "design" --fg-color "#FFFFFF" --bg-color "#8B5CF6"

# Apply a tag to a task
clickup tag add --task-id abc9zt --name "design"

# Remove a tag from a task
clickup tag remove --task-id abc9zt --name "design"
```

---

## Dependencies and Relations

Dependencies block task progress (task cannot start until its dependency is done). Relations create a softer directional link between tasks.

```
clickup dependency add --task-id <id> --depends-on <id>
clickup dependency add --task-id <id> --dependency-of <id>
clickup dependency remove --task-id <id> --depends-on <id>
clickup dependency remove --task-id <id> --dependency-of <id>

clickup relation add --task-id <id> --links-to <id>
clickup relation remove --task-id <id> --links-to <id>
```

| Flag | Description |
|------|-------------|
| `--task-id <id>` | The primary task |
| `--depends-on <id>` | This task depends on (is blocked by) the given task |
| `--dependency-of <id>` | This task is a blocker for the given task |
| `--links-to <id>` | Create or remove a soft relation link to another task |

**Examples**

```bash
# Task abc9zt is blocked by task def3qr
clickup dependency add --task-id abc9zt --depends-on def3qr

# Create a soft relation between two tasks
clickup relation add --task-id abc9zt --links-to ghi7uv
```

---

## Attachments

Upload files directly to a task. Returns an attachment record with a download URL.

```
clickup attachment upload --task-id <id> --file <path> [--filename <name>]
```

| Flag | Description |
|------|-------------|
| `--task-id <id>` | Task to attach the file to |
| `--file <path>` | Local file path to upload |
| `--filename <name>` | Override the filename shown in ClickUp (defaults to the local file name) |

**Examples**

```bash
# Attach a design file to a task
clickup attachment upload --task-id abc9zt --file ./designs/mockup-v3.fig

# Upload with a custom display name
clickup attachment upload --task-id abc9zt --file ./export.pdf --filename "Q1-Report-Final.pdf"
```

---

## Time Tracking

Log, edit, and query time entries. Supports running timers, tags, and billable flags.

```
clickup time list --task-id <id> [--start <date>] [--end <date>]
clickup time list --workspace-id <id> --start <date> --end <date> [--assignee <id>...]
clickup time get <timer-id> --workspace-id <id>
clickup time create --task-id <id> --duration <ms> --start <ts>
    [--description <desc>]
    [--assignee <id>]
    [--billable <bool>]
    [--tag <name>...]
clickup time update <timer-id> --workspace-id <id>
    [--description <desc>]
    [--duration <ms>]
    [--start <ts>]
    [--tag-action <add|remove>]
    [--tag <name>...]
    [--billable <bool>]
clickup time delete <timer-id> --workspace-id <id>
clickup time history <timer-id> --workspace-id <id>
clickup time running --workspace-id <id> [--assignee <id>]
clickup time start --task-id <id> --workspace-id <id> [--description <desc>] [--billable <bool>] [--tag <name>...]
clickup time stop --workspace-id <id>
clickup time tags --workspace-id <id>
clickup time add-tags --workspace-id <id> --timer-id <id>... --tag <name>...
clickup time remove-tags --workspace-id <id> --timer-id <id>... --tag <name>...
clickup time rename-tag --workspace-id <id> --name <name> --new-name <name>
```

### time create flags

| Flag | Type | Description |
|------|------|-------------|
| `--task-id <id>` | string | **Required.** Task to log time against |
| `--duration <ms>` | int | **Required.** Duration in milliseconds |
| `--start <ts>` | int (ms) | **Required.** Start time as Unix timestamp in milliseconds |
| `--description <desc>` | string | Note or description for the time entry |
| `--assignee <id>` | int | User ID to log time for (defaults to authenticated user) |
| `--billable <bool>` | bool | Mark the entry as billable |
| `--tag <name>...` | string[] | One or more time tracking tags |

**Destructive:** `time delete` requires no `--confirm` flag - it deletes immediately.

**Examples**

```bash
# Log 2 hours of billable time on a task
clickup time create --task-id abc9zt --duration 7200000 --start 1735650000000 --billable true

# Start a live timer on a task
clickup time start --task-id abc9zt --workspace-id 9876543 --description "Working on API auth"

# Stop the running timer
clickup time stop --workspace-id 9876543

# Check who has a timer running
clickup time running --workspace-id 9876543
```

---

## Goals

Goals track high-level objectives with measurable key results. Key results can be numeric, currency, boolean, percentage, or automatically derived from linked tasks.

```
clickup goal list --workspace-id <id> [--include-completed]
clickup goal get <goal-id>
clickup goal create --workspace-id <id> --name <name>
    [--due-date <ts>]
    [--description <desc>]
    [--multiple-owners <bool>]
    [--owner <id>...]
    [--color <hex>]
clickup goal update <goal-id>
    [--name <name>]
    [--due-date <ts>]
    [--description <desc>]
    [--color <hex>]
clickup goal delete <goal-id> [--confirm]
clickup goal add-key-result <goal-id> --name <name> --type <type>
    [--steps-start <n>]
    [--steps-end <n>]
    [--unit <s>]
    [--task-ids <id>...]
    [--list-ids <id>...]
clickup goal update-key-result <key-result-id>
    [--name <name>]
    [--steps-current <n>]
    [--note <text>]
clickup goal delete-key-result <key-result-id> [--confirm]
```

### goal add-key-result flags

| Flag | Type | Description |
|------|------|-------------|
| `--name <name>` | string | **Required.** Key result name |
| `--type <type>` | string | **Required.** One of: `number`, `currency`, `boolean`, `percentage`, `automatic` |
| `--steps-start <n>` | number | Starting value for numeric/currency/percentage types |
| `--steps-end <n>` | number | Target value to reach |
| `--unit <s>` | string | Unit label to display (e.g. `"users"`, `"USD"`) |
| `--task-ids <id>...` | string[] | Link tasks to this key result (used with `automatic` type) |
| `--list-ids <id>...` | string[] | Link lists to this key result (used with `automatic` type) |

**Destructive:** `goal delete` and `goal delete-key-result` require `--confirm`.

**Examples**

```bash
# Create a goal with two owners
clickup goal create --workspace-id 9876543 --name "Launch v2.0" \
  --due-date 1740787200000 --owner 112233 --owner 445566

# Add a percentage key result
clickup goal add-key-result goal_001 --name "Test coverage" \
  --type percentage --steps-start 60 --steps-end 90

# Add an automatic key result linked to a list (tracks task completion %)
clickup goal add-key-result goal_001 --name "Sprint tasks done" \
  --type automatic --list-ids 998877
```

---

## Views

Views are saved display configurations (list, board, Gantt, etc.) that can exist at workspace, space, folder, or list level.

```
clickup view list --workspace-id <id>
clickup view list --space-id <id>
clickup view list --folder-id <id>
clickup view list --list-id <id>

clickup view get <view-id>

clickup view create --workspace-id <id> --name <name> --type <type>
clickup view create --space-id <id> --name <name> --type <type>
clickup view create --folder-id <id> --name <name> --type <type>
clickup view create --list-id <id> --name <name> --type <type>

clickup view update <view-id>
    [--name <name>]
    [--settings <json>]
    [--grouping <json>]
    [--sorting <json>]
    [--filters <json>]

clickup view delete <view-id> [--confirm]
clickup view tasks <view-id> [--page <n>]
```

| Flag | Description |
|------|-------------|
| `--name <name>` | View name |
| `--type <type>` | View type: `list`, `board`, `calendar`, `gantt`, `table`, `timeline`, `activity`, `map`, `workload` |
| `--settings <json>` | JSON object of view-type-specific display settings |
| `--grouping <json>` | JSON grouping configuration |
| `--sorting <json>` | JSON sorting configuration |
| `--filters <json>` | JSON filter configuration |
| `--page <n>` | Page number when retrieving view tasks (100 per page) |

**Destructive:** `view delete` requires `--confirm`.

**Examples**

```bash
# Create a board view at the space level
clickup view create --space-id 55544433 --name "Kanban" --type board

# Retrieve tasks from a view, page 2
clickup view tasks view_abc --page 2
```

---

## Users

Manage workspace members - invite, update roles, and remove users.

```
clickup user invite --workspace-id <id> --email <email> [--admin <bool>]
clickup user get <user-id> --workspace-id <id>
clickup user update <user-id> --workspace-id <id> [--username <name>] [--admin <bool>] [--custom-role-id <id>]
clickup user remove <user-id> --workspace-id <id> [--confirm]
```

| Flag | Description |
|------|-------------|
| `--workspace-id <id>` | Target workspace |
| `--email <email>` | Email address to invite |
| `--admin <bool>` | Grant or revoke admin access |
| `--username <name>` | Update the user's display name |
| `--custom-role-id <id>` | Assign a custom role (Business plan and above) |

**Destructive:** `user remove` requires `--confirm`.

**Examples**

```bash
# Invite a new admin
clickup user invite --workspace-id 9876543 --email jane@example.com --admin true

# Remove a user from the workspace
clickup user remove 445566 --workspace-id 9876543 --confirm
```

---

## User Groups

User groups (teams) let you assign multiple users to tasks and views in one step.

```
clickup group list --workspace-id <id> [--group-id <id>...]
clickup group create --workspace-id <id> --name <name> [--member-id <id>...]
clickup group update <group-id> --workspace-id <id> [--name <name>] [--add-member <id>...] [--remove-member <id>...]
clickup group delete <group-id> --workspace-id <id> [--confirm]
```

| Flag | Description |
|------|-------------|
| `--workspace-id <id>` | Target workspace |
| `--group-id <id>...` | Filter list to specific group IDs |
| `--name <name>` | Group name |
| `--member-id <id>...` | User IDs to include on create |
| `--add-member <id>...` | Add users to an existing group |
| `--remove-member <id>...` | Remove users from an existing group |

**Destructive:** `group delete` requires `--confirm`.

**Examples**

```bash
# Create a group with two initial members
clickup group create --workspace-id 9876543 --name "Frontend Team" --member-id 112233 --member-id 445566

# Add a member to an existing group
clickup group update grp_001 --workspace-id 9876543 --add-member 778899
```

---

## Roles

Custom roles are a Business plan feature. This command reads the defined roles in a workspace.

```
clickup role list --workspace-id <id>
```

**Examples**

```bash
# List all custom roles
clickup role list --workspace-id 9876543
```

---

## Guests

Guests have limited, scoped access (read, comment, edit, or create) granted per resource. Guest access requires a paid plan.

```
clickup guest invite --workspace-id <id> --email <email>
    [--can-edit-tags <bool>]
    [--can-see-time-spent <bool>]
    [--can-see-time-estimated <bool>]

clickup guest get <guest-id> --workspace-id <id>

clickup guest update <guest-id> --workspace-id <id>
    [--username <name>]
    [--can-edit-tags <bool>]
    [--can-see-time-spent <bool>]

clickup guest remove <guest-id> --workspace-id <id> [--confirm]

clickup guest add-to-task <guest-id> --task-id <id> --permission <read|comment|edit|create>
clickup guest remove-from-task <guest-id> --task-id <id>

clickup guest add-to-list <guest-id> --list-id <id> --permission <read|comment|edit|create>
clickup guest remove-from-list <guest-id> --list-id <id>

clickup guest add-to-folder <guest-id> --folder-id <id> --permission <read|comment|edit|create>
clickup guest remove-from-folder <guest-id> --folder-id <id>
```

| Flag | Description |
|------|-------------|
| `--workspace-id <id>` | Target workspace |
| `--email <email>` | Email address to invite as a guest |
| `--can-edit-tags <bool>` | Allow guest to edit space tags |
| `--can-see-time-spent <bool>` | Show time tracking data to guest |
| `--can-see-time-estimated <bool>` | Show time estimates to guest |
| `--username <name>` | Update guest display name |
| `--permission` | Access level: `read`, `comment`, `edit`, or `create` |
| `--task-id / --list-id / --folder-id` | Resource to grant or revoke access on |

**Destructive:** `guest remove` requires `--confirm`.

**Examples**

```bash
# Invite a guest with read access and time visibility
clickup guest invite --workspace-id 9876543 --email client@external.com \
  --can-see-time-spent true --can-see-time-estimated true

# Grant comment-level access to a specific task
clickup guest add-to-task guest_001 --task-id abc9zt --permission comment

# Grant edit access to a folder
clickup guest add-to-folder guest_001 --folder-id 998877 --permission edit
```

---

## Members

List the members (assignable users) for a task or list. Read-only.

```
clickup member list --task-id <id>
clickup member list --list-id <id>
```

**Examples**

```bash
# See who can be assigned to tasks in a list
clickup member list --list-id 998877

# See current members on a specific task
clickup member list --task-id abc9zt
```

---

## Webhooks

Webhooks deliver real-time event payloads to an external endpoint when activity occurs in ClickUp.

```
clickup webhook list --workspace-id <id>
clickup webhook create --workspace-id <id> --endpoint <url> --events <event>...
    [--space-id <id>]
    [--folder-id <id>]
    [--list-id <id>]
    [--task-id <id>]
clickup webhook update <webhook-id>
    [--endpoint <url>]
    [--events <event>...]
    [--status <active|inactive>]
clickup webhook delete <webhook-id> [--confirm]
clickup webhook events
```

| Flag | Description |
|------|-------------|
| `--workspace-id <id>` | Workspace to register the webhook in |
| `--endpoint <url>` | HTTPS URL to receive payloads |
| `--events <event>...` | One or more event types to subscribe to (see `webhook events`) |
| `--space-id / --folder-id / --list-id / --task-id` | Scope the webhook to a specific resource |
| `--status <active\|inactive>` | Enable or disable the webhook |

`clickup webhook events` prints the full list of supported event type names.

**Destructive:** `webhook delete` requires `--confirm`.

**Examples**

```bash
# List all event types
clickup webhook events

# Create a webhook for task create and update events scoped to a space
clickup webhook create --workspace-id 9876543 --endpoint https://hooks.example.com/clickup \
  --events taskCreated taskUpdated --space-id 55544433

# Disable a webhook
clickup webhook update wh_001 --status inactive

# Delete a webhook
clickup webhook delete wh_001 --confirm
```

---

## Templates

Templates provide reusable list and task structures. Currently read-only via the API.

```
clickup template list --workspace-id <id> [--page <n>]
```

| Flag | Description |
|------|-------------|
| `--workspace-id <id>` | Workspace to list templates for |
| `--page <n>` | Page number (100 results per page) |

**Examples**

```bash
# List all available templates in the workspace
clickup template list --workspace-id 9876543
```

---

## Custom Task Types

Custom task types (e.g. Bug, Feature, Milestone) are defined at the workspace level on the Enterprise plan.

```
clickup task-type list --workspace-id <id>
```

**Examples**

```bash
# List all custom task types
clickup task-type list --workspace-id 9876543
```

---

## Shared Hierarchy

Returns the tasks, lists, and folders that have been shared directly with the authenticated user (rather than accessed through normal workspace membership).

```
clickup shared-hierarchy get --workspace-id <id>
```

**Examples**

```bash
clickup shared-hierarchy get --workspace-id 9876543
```

---

## Docs

Search Docs (Pages) in a workspace. Full Doc management is handled through the ClickUp UI; the API exposes search only.

```
clickup doc search --workspace-id <id> --query <text>
```

| Flag | Description |
|------|-------------|
| `--workspace-id <id>` | Workspace to search within |
| `--query <text>` | Search query string |

**Examples**

```bash
# Search for docs mentioning "onboarding"
clickup doc search --workspace-id 9876543 --query "onboarding"
```

---

## Global Flags

These flags apply to all commands.

| Flag | Description |
|------|-------------|
| `--output <format>` | Output format: `table` (default), `json`, `yaml` |
| `--no-color` | Disable colored output |
| `--quiet` | Suppress all output except errors |
| `--debug` | Print HTTP request/response details |
| `--config <path>` | Use an alternate config file path |

---

## Destructive Commands Summary

All of the following commands require the `--confirm` flag to prevent accidental data loss:

| Command | What it deletes |
|---------|----------------|
| `space delete` | Space and all contents |
| `folder delete` | Folder and all lists/tasks |
| `list delete` | List and all tasks |
| `task delete` | Task and all subtasks |
| `checklist delete` | Checklist and all items |
| `checklist delete-item` | Single checklist item |
| `comment delete` | Comment (cannot be recovered) |
| `tag delete` | Space-level tag definition |
| `goal delete` | Goal and all key results |
| `goal delete-key-result` | Single key result |
| `view delete` | Saved view |
| `user remove` | User workspace access |
| `group delete` | User group |
| `guest remove` | Guest workspace access |
| `webhook delete` | Webhook registration |
