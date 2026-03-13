---
name: clickup-chat
description: Lists ClickUp chat channels and sends messages. Use when the user wants to post a notification, send a standup summary, notify a channel, or check what chat channels exist in the workspace.
allowed-tools: Bash(clickup chat *), Bash(clickup schema chat*)
---

# ClickUp Chat

List channels and send messages to chat channels in the workspace.

## Channel Commands

```bash
# List all chat channels
clickup chat channels --workspace-id <id>

# List channels as JSON (for scripting)
clickup chat channels --workspace-id <id> --format json

# Get channel IDs only
clickup chat channels --workspace-id <id> --format quiet
```

## Send Message

```bash
# Send a message to a channel
clickup chat send --channel-id <id> --message "Message text"

# With explicit workspace ID
clickup chat send --workspace-id <id> --channel-id <id> --message "Message text"
```

## Common Patterns

```bash
# Find a channel by name then message it
CHANNEL_ID=$(clickup chat channels --format json | jq -r '.[] | select(.name=="general") | .id')
clickup chat send --channel-id "$CHANNEL_ID" --message "Deploy complete"

# Post a standup summary to a channel
clickup chat send --channel-id <id> --message "$(clickup task list --list-id <id> --format md)"

# Notify channel after creating a task
TASK_ID=$(clickup task create --list-id <id> --name "Incident: API down" --priority 1 --format id)
clickup chat send --channel-id <id> --message "Incident task created: $TASK_ID"

# Output channels as markdown table for display
clickup chat channels --format md
```

## Discovery

```bash
clickup schema chat            # List chat actions
clickup schema chat.channels   # Show channels flags
clickup schema chat.send       # Show send fields
```
