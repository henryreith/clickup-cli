---
name: clickup-users
description: Manages ClickUp workspace users, groups, guests, roles, and members. Use when the user asks about team members, wants to invite users, manage groups, grant guest access, check permissions, resolve names to IDs, or see who is assigned to what.
allowed-tools: Bash(clickup user *), Bash(clickup group *), Bash(clickup guest *), Bash(clickup role *), Bash(clickup member *), Bash(clickup workspace members), Bash(clickup schema user*), Bash(clickup schema group*), Bash(clickup schema guest*), Bash(clickup schema member*)
---

# ClickUp Users and Access

Manage workspace members, user groups, guest access, roles, and member lists.

## User Commands

```bash
clickup user invite --workspace-id <id> --email <email> [--admin <bool>]
clickup user get <user-id> --workspace-id <id>
clickup user update <user-id> --workspace-id <id> [--username <name>] [--admin <bool>] [--custom-role-id <id>]
clickup user remove <user-id> --workspace-id <id> --confirm
```

## Group Commands

```bash
clickup group list --workspace-id <id>
clickup group create --workspace-id <id> --name <name> [--member-id <id>...]
clickup group update <group-id> --workspace-id <id> [--name <name>] [--add-member <id>...] [--remove-member <id>...]
clickup group delete <group-id> --workspace-id <id> --confirm
```

## Guest Commands

Guests have scoped access (read, comment, edit, or create) per resource.

```bash
clickup guest invite --workspace-id <id> --email <email>
    [--can-edit-tags <bool>] [--can-see-time-spent <bool>]
clickup guest get <guest-id> --workspace-id <id>
clickup guest update <guest-id> --workspace-id <id> [--username <name>]
clickup guest remove <guest-id> --workspace-id <id> --confirm

# Grant/revoke access to specific resources
clickup guest add-to-task <guest-id> --task-id <id> --permission <read|comment|edit|create>
clickup guest remove-from-task <guest-id> --task-id <id>
clickup guest add-to-list <guest-id> --list-id <id> --permission <read|comment|edit|create>
clickup guest remove-from-list <guest-id> --list-id <id>
clickup guest add-to-folder <guest-id> --folder-id <id> --permission <read|comment|edit|create>
clickup guest remove-from-folder <guest-id> --folder-id <id>
```

## Workspace Member Commands

```bash
# List all members in workspace (full directory)
clickup workspace members --workspace-id <id>

# Find a member by name (fuzzy match on username or email)
clickup member find --name "Alice" --workspace-id <id>

# Resolve names to user IDs (pipe-friendly)
clickup member resolve --names "Alice, Bob" --workspace-id <id>

# Get IDs only for use in other commands
clickup member resolve --names "Alice, Bob" --format quiet
```

## Role and Member Commands

```bash
clickup role list --workspace-id <id>                  # List custom roles (Business plan)
clickup member list --task-id <id>                     # List assignable users for a task
clickup member list --list-id <id>                     # List assignable users for a list
```

## Common Patterns

```bash
# Invite a team member as admin
clickup user invite --workspace-id 9876543 --email dev@company.com --admin true

# Create a team group
clickup group create --workspace-id 9876543 --name "Frontend Team" --member-id 112233 --member-id 445566

# Give a client read access to a folder
clickup guest invite --workspace-id 9876543 --email client@external.com
clickup guest add-to-folder guest_001 --folder-id 998877 --permission read

# Find a user ID from a name (common agent pattern)
clickup member find --name "Sarah" --format json | jq '.[0].id'

# Resolve multiple names to IDs for bulk assignment
IDS=$(clickup member resolve --names "Alice, Bob, Carol" --format quiet | tr '\n' ',')
clickup task update TASK_ID --assignee-add $IDS

# Display workspace directory as markdown table
clickup workspace members --format md
```

## Resolving Names to IDs

Agents often receive person names but ClickUp APIs require user IDs. Use these commands to bridge the gap:

```bash
# 1. Find one person
clickup member find --name "Alice Johnson" --format json

# 2. Resolve multiple names at once (outputs table with id/username/email)
clickup member resolve --names "Alice, Bob, Sarah"

# 3. IDs-only output for piping into task assignee flags
clickup member resolve --names "Alice, Bob" --format quiet
# outputs:
# 1234567
# 8901234
```

## Discovery

```bash
clickup schema users.invite    # Show invite fields
clickup schema guests.invite   # Show guest invite fields
clickup schema member.find     # Show find flags
clickup schema member.resolve  # Show resolve flags
```
