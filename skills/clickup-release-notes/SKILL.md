---
name: clickup-release-notes
description: Generates release notes or a changelog from ClickUp tasks completed in a period, grouped by type and written for the chosen audience. Use when the user asks for release notes, a changelog, a "what shipped" summary, or wants completed work written up for customers or stakeholders.
license: MIT
disable-model-invocation: true
context: fork
agent: general-purpose
argument-hint: "[period and scope - e.g. 'last sprint for the mobile space', 'June, customer-facing']"
allowed-tools: Bash(clickup *), Write, Read
---

# Release Notes

Turn completed tasks into a changelog worth reading.

## Understanding the Scope

From `$ARGUMENTS` determine: the period (default: since the last tag/release the user mentions, else last 14 days), the scope (workspace, space, or list), and the audience. Audience changes the writing: customer-facing notes describe benefits; internal notes can name tasks and people.

## Workflow

### Step 1: Pull completed tasks

```bash
clickup task search --workspace-id <id> \
    --include-closed \
    --status "complete" --status "closed" --status "done" \
    --date-updated-gt <period-start-ms> --date-updated-lt <period-end-ms> \
    [--space-id <id>] --format json
```

`--date-updated-*` filters take Unix ms; compute them from the period.

### Step 2: Classify

Group by tags and task names into: **Features**, **Improvements**, **Fixes**, and **Internal** (refactors, chores - omit for customer-facing notes). Tags like `bug`, `feature`, `enhancement` decide the bucket; otherwise judge from the task name and description.

### Step 3: Write the notes

Rewrite task names for the audience - "Fix login redirect on Safari" becomes "Fixed an issue where Safari users could be redirected to the wrong page after logging in." Never paste raw task IDs into customer-facing notes.

Copy the exact structure from `assets/report-template.md` in this skill's directory (`clickup skill path clickup-release-notes` prints it). Fill every placeholder; drop sections with no content.

For internal notes append task IDs and assignees for traceability.

### Step 4: Deliver

Present the notes in chat. Offer to also:

```bash
# Publish into a ClickUp Doc
clickup doc page-create --workspace-id <id> --doc-id <id> \
    --name "Release Notes <date>" --content "$(cat notes.md)"

# Or save locally
```

## Tips

- If several statuses mean "done" in this workspace, check `clickup list statuses` conventions first rather than guessing.
- Exclude subtasks whose parent is already listed to avoid duplicate lines.
- A count line ("12 improvements shipped by 5 people") makes stakeholder notes land better.
