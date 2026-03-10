---
name: clickup-project-setup
description: Scaffolds a new project in ClickUp by creating a space, folders, lists, tags, and initial tasks. Use when the user wants to set up a new project, create a project structure, or bootstrap a workspace for a new initiative.
disable-model-invocation: true
context: fork
agent: general-purpose
argument-hint: "[workspace-id] [project-name]"
allowed-tools: Bash(clickup *)
---

# Project Setup

Create a complete project structure in ClickUp from scratch.

## Prerequisites

- Workspace ID
- Project name and structure plan

## Workflow

### Step 1: Create the space

```bash
SPACE=$(clickup space create --workspace-id <id> --name "Project Alpha" \
  --features '{"due_dates":{"enabled":true},"time_tracking":{"enabled":true},"tags":{"enabled":true}}' \
  --format id)
```

### Step 2: Create folders for work streams

```bash
DESIGN=$(clickup folder create --space-id $SPACE --name "Design" --format id)
ENGINEERING=$(clickup folder create --space-id $SPACE --name "Engineering" --format id)
QA=$(clickup folder create --space-id $SPACE --name "QA" --format id)
```

### Step 3: Create lists within folders

```bash
# Engineering lists
clickup list create --folder-id $ENGINEERING --name "Backlog"
clickup list create --folder-id $ENGINEERING --name "Sprint 1"
clickup list create --folder-id $ENGINEERING --name "Tech Debt"

# Design lists
clickup list create --folder-id $DESIGN --name "Design Backlog"
clickup list create --folder-id $DESIGN --name "In Progress"

# QA lists
clickup list create --folder-id $QA --name "Test Cases"
clickup list create --folder-id $QA --name "Bug Reports"
```

### Step 4: Create folderless lists (optional)

```bash
# Top-level project docs/notes list
clickup list create-folderless --space-id $SPACE --name "Project Notes"
```

### Step 5: Create tags

```bash
clickup tag create --space-id $SPACE --name "mvp" --bg-color "#22C55E"
clickup tag create --space-id $SPACE --name "tech-debt" --bg-color "#F59E0B"
clickup tag create --space-id $SPACE --name "blocked" --bg-color "#EF4444"
clickup tag create --space-id $SPACE --name "design-review" --bg-color "#8B5CF6"
```

### Step 6: Create initial milestone tasks

```bash
BACKLOG=$(clickup list list --folder-id $ENGINEERING --format json | # extract backlog list ID)

clickup task create --list-id $BACKLOG --name "Project kickoff" --priority 1
clickup task create --list-id $BACKLOG --name "Architecture design" --priority 2
clickup task create --list-id $BACKLOG --name "MVP feature set defined" --priority 2
clickup task create --list-id $BACKLOG --name "First sprint planning" --priority 2
```

### Step 7: Create a project goal (optional)

```bash
clickup goal create --workspace-id <id> --name "Project Alpha - MVP Launch" \
  --due-date <target-date-ms> --color "#3B82F6"
```

### Step 8: Set up a webhook for notifications (optional)

```bash
clickup webhook create --workspace-id <id> \
  --endpoint https://hooks.example.com/project-alpha \
  --events taskCreated taskUpdated taskDeleted \
  --space-id $SPACE
```

## Tips

- Capture list IDs from create commands using `--format id` for later use
- Enable features on the space at creation time to avoid updating later
- Use consistent tag colors across projects for visual consistency
