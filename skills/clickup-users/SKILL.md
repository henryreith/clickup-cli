---
name: clickup-users
description: Manage ClickUp workspace users, groups, guests, roles, and members.
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
```

## Discovery

```bash
clickup schema users.invite    # Show invite fields
clickup schema guests.invite   # Show guest invite fields
```
