---
name: clickup-comments
description: Creates, lists, and manages comments on ClickUp tasks, lists, and views. Supports threading and replies. Use when the user wants to add comments, read discussion threads, reply to comments, or assign action items via comments.
allowed-tools: Bash(clickup comment *), Bash(clickup schema comment*)
---

# ClickUp Comments

Comments can be attached to tasks, lists, or views. Supports threaded replies and comment assignment.

## List Comments

```bash
clickup comment list --task-id <id> [--start <ts>] [--start-id <id>]
clickup comment list --list-id <id> [--start <ts>] [--start-id <id>]
clickup comment list --view-id <id> [--start <ts>] [--start-id <id>]
```

Provide exactly one of `--task-id`, `--list-id`, or `--view-id`.

## Create a Comment

```bash
clickup comment create --task-id <id> --text <text> [--assignee <id>] [--notify-all]
clickup comment create --list-id <id> --text <text> [--assignee <id>] [--notify-all]
clickup comment create --view-id <id> --text <text> [--assignee <id>] [--notify-all]
```

## Update / Delete

```bash
clickup comment update <comment-id> --text <text> [--assignee <id>] [--resolved <bool>]
clickup comment delete <comment-id> --confirm
```

## Threading

```bash
clickup comment list-threaded <comment-id>    # List replies to a comment
clickup comment reply <comment-id> --text <text> [--assignee <id>] [--notify-all]
```

## Common Patterns

```bash
# Add a status update comment on a task
clickup comment create --task-id abc9zt --text "Deployed to staging. Ready for QA."

# Assign a comment as an action item
clickup comment create --task-id abc9zt --text "Please review the API changes" --assignee 112233

# Resolve a comment thread
clickup comment update cmt_123 --resolved true

# Reply in a thread
clickup comment reply cmt_123 --text "Done - merged to main"
```

## Discovery

```bash
clickup schema comments.create    # Show create fields
clickup schema comments.list      # Show list options
```
