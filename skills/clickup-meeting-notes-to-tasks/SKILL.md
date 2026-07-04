---
name: clickup-meeting-notes-to-tasks
description: Converts meeting notes, transcripts, or brain dumps into triaged ClickUp tasks with assignees, due dates, and tags. Use when the user pastes notes or points at a notes file and wants action items extracted and created as tasks.
license: MIT
disable-model-invocation: true
context: fork
agent: general-purpose
argument-hint: "[list name or ID, then paste notes or give a file path]"
allowed-tools: Bash(clickup *), Read
---

# Meeting Notes to Tasks

Extract action items from raw notes and create them as properly triaged tasks.

## Understanding the Input

`$ARGUMENTS` should contain a target list (name or ID) and the notes themselves (pasted text or a file path). If either is missing, ask for it before creating anything.

## Workflow

### Step 1: Resolve the target list

```bash
# If given a name, find the list ID
clickup list list --folder-id <id> --format json     # or --space-id for folderless lists
clickup space list --format json                     # to locate the right space first
```

### Step 2: Resolve people

Build a name-to-ID map so "Sarah will fix the login bug" becomes an assigned task:

```bash
clickup member list --format json
```

Match first names case-insensitively. If a name in the notes matches nobody, leave the task unassigned and note it in the summary.

### Step 3: Extract action items

Read the notes and pull out every commitment, decision requiring follow-up, and explicit todo. For each item capture:

- **name**: imperative, under 80 chars ("Fix login redirect on Safari")
- **assignee**: from the people map, if a person was named
- **due date**: explicit dates, or relative phrases ("by Friday" = `friday`, "next week" = `+1w`)
- **priority**: `urgent` only if the notes say so; otherwise `normal`
- **description**: the sentence(s) from the notes the item came from, for context

Do NOT create tasks for decisions already made, FYIs, or discussion points with no action.

### Step 4: Confirm the plan

Show the extracted items as a table (name, assignee, due, priority) and ask for approval before creating anything. Skip this only if the user already said to create without review.

### Step 5: Create the tasks

```bash
clickup task create --list-id <id> --name "<name>" \
    [--description "<context>"] [--assignee <user-id>] \
    [--due-date <friday|+3d|2026-07-10>] [--priority <level>] \
    --format id
```

Collect the returned IDs. Dates accept ISO 8601, relative forms (`tomorrow`, `3d`, `friday`), or Unix timestamps.

### Step 6: Report

```
Created N tasks in <list name>:
- <task name> -> <assignee or unassigned>, due <date> (<task-id>)
...
Skipped: <items that were FYI/decisions, one line on why>
Unmatched people: <names that could not be resolved>
```

## Tips

- Tag every created task for traceability: `clickup tag add --task-id <id> --name "meeting-2026-07-04"`
- For a recurring meeting, offer to also create a summary page in a Doc: see the clickup-docs skill.
- If the notes mention blocking relationships ("can't start X until Y"), add them: `clickup dependency add --task-id <x> --depends-on <y>`
