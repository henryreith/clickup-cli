---
name: clickup-docs
description: Manages ClickUp Docs and their pages including creating docs, writing page content in markdown, and searching doc libraries. Use when the user asks to create or update a doc, add meeting notes or documentation pages, read a doc's contents, or find a doc in the workspace.
license: MIT
allowed-tools: Bash(clickup doc *), Bash(clickup schema doc*)
---

# ClickUp Docs

Create, read, update, and search Docs and their pages. All doc commands require a workspace ID (from `--workspace-id`, `CLICKUP_WORKSPACE_ID`, or the active profile).

## Doc Commands

```bash
clickup doc list --workspace-id <id>
clickup doc search --workspace-id <id> --query <text>
clickup doc get --workspace-id <id> --doc-id <id>
clickup doc create --workspace-id <id> --name <name>
    [--parent-id <id>] [--parent-type <4|5|6|7>] [--visibility <private|workspace>]
clickup doc update --workspace-id <id> --doc-id <id> --name <name>
clickup doc delete --workspace-id <id> --doc-id <id> --confirm
```

`--parent-type` values: 4=space, 5=folder, 6=list, 7=task. When `--parent-id` is given without `--parent-type`, space (4) is assumed.

## Page Commands

Docs contain pages; page content is markdown.

```bash
clickup doc pages --workspace-id <id> --doc-id <id>
clickup doc page-get --workspace-id <id> --doc-id <id> --page-id <id>
clickup doc page-create --workspace-id <id> --doc-id <id> --name <name>
    [--content <markdown>] [--parent-page-id <id>]
clickup doc page-update --workspace-id <id> --doc-id <id> --page-id <id>
    [--name <name>] [--content <markdown>]
```

## Common Patterns

```bash
# Find a doc by name, then read its pages
DOC_ID=$(clickup doc search --query "Engineering Handbook" --format id)
clickup doc pages --doc-id "$DOC_ID" --format json

# Create a doc in a space with a first page
DOC_ID=$(clickup doc create --name "Sprint Notes" --parent-id <space-id> --parent-type 4 --format id)
clickup doc page-create --doc-id "$DOC_ID" --name "2026-07-04" --content "# Notes\n- item one"

# Append meeting notes as a new page under an existing parent page
clickup doc page-create --doc-id <doc-id> --name "Standup 2026-07-04" \
    --parent-page-id <page-id> --content "$(cat notes.md)"
```

## Notes

- `page-update --content` replaces the page content entirely; read the page first and merge if you need to append.
- `doc delete` is destructive: it prompts in a terminal and requires `--confirm` in non-interactive mode.
- Multi-line markdown works best passed via command substitution (`--content "$(cat file.md)"`) to avoid shell quoting issues.
- Field discovery: `clickup schema doc` lists actions, `clickup schema doc.page-create` shows fields.
