# ClickUp CLI - Blog Post Notes

Use these notes with your blog writing prompt in Claude Desktop. This is raw material, not a finished post.

## Working Title Options

- "I Built an Open-Source ClickUp CLI That AI Agents Actually Want to Use"
- "Why I Built a ClickUp CLI as a Claude Code Plugin (And What I Learned About Agent-First Design)"
- "The Token-Efficient Alternative to MCP: Building a CLI + Skills System for ClickUp"

## The Problem

ClickUp has no official CLI. Community tools cover fragments of the API. AI agents (Claude Code, Gemini CLI, Codex) need structured ClickUp interaction, but the existing options are:

1. **ClickUp's official MCP server** -- works with MCP-compatible hosts but injects the full tool schema into every LLM call. Token-heavy.
2. **Partial community CLIs** -- incomplete API coverage, no agent integration.
3. **Direct API calls** -- requires agents to know the full ClickUp API, which is massive.

## The Solution

An open-source CLI that covers 100% of the ClickUp API v2 surface, designed agent-first:

- **CLI as execution layer**: `clickup task create`, `clickup time list`, etc. Every command, every flag.
- **Skills as guidance layer**: 22 SKILL.md files organized in three tiers that teach agents how to use the CLI with near-zero token overhead.
- **Claude Code plugin**: Install with two commands, get all 22 skills loaded automatically.
- **Works everywhere**: Claude Code, Agent SDK, Gemini CLI, Codex, any agent that can run bash.

## The Architecture (Key Talking Points)

### Three-Tier Skills System

Instead of MCP's approach (inject full API schema every turn, ~thousands of tokens), we use progressive disclosure:

1. **Root skill** (~150 tokens): Loaded at session start. An index of what the CLI can do and how to discover more.
2. **Sub-skills** (~300 tokens each): Per-resource command reference. Loaded on demand when the agent needs a specific resource.
3. **Recipe skills** (~400 tokens each): Multi-step workflow guides for common PM workflows. Accept natural language arguments.

**Total cost per action: ~450 tokens vs thousands for MCP.**

### Natural Language Recipes

Recipes aren't rigid scripts. They accept whatever you ask:

```
/clickup:weekly-review marketing team
/clickup:team-report engineering
/clickup:standup Sarah's tasks
/clickup:custom-report all high-priority tasks with no assignee
```

The agent interprets the arguments, resolves names to IDs, and adapts the workflow.

### Create Your Own Skills

Users aren't limited to built-in recipes. Drop a SKILL.md into `.claude/skills/` and you get a custom slash command:

```yaml
---
name: marketing-weekly
description: Weekly marketing department review
disable-model-invocation: true
context: fork
agent: general-purpose
allowed-tools: Bash(clickup *)
---

Generate a marketing department weekly review focused on:
1. Campaign tasks in the Marketing space
2. Content pipeline status
3. Upcoming launch deadlines
```

Now `/marketing-weekly` works alongside `/clickup:weekly-review`.

### Plugin Distribution

The repo IS a Claude Code plugin. No separate package needed:

```bash
/plugin marketplace add henryreith/clickup-cli
/plugin install clickup@clickup-cli
# Done. 22 skills instantly available.
```

Also works with the Agent SDK for building custom agents:

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

for await (const message of query({
  prompt: "Create a task for the login bug fix",
  options: {
    plugins: [{ type: "local", path: "./node_modules/clickup-cli" }],
    allowedTools: ["Skill", "Bash"]
  }
})) {
  console.log(message);
}
```

### Why CLI + Skills Over MCP

| | CLI + Skills | MCP Server |
|---|---|---|
| Token cost per call | ~450 tokens | Full schema every turn |
| Works with | Any agent that can run bash | MCP-compatible hosts only |
| Discovery | Progressive (load what you need) | All-or-nothing |
| Extensibility | Users create custom skills | Requires code changes |
| Best for | Claude Code, Gemini CLI, Codex | Claude Desktop, Cursor |

ClickUp already has an official MCP server. This is complementary, not a replacement.

## Tech Stack

TypeScript, Node.js 22+, Commander.js, Zod, chalk, ora, cli-table3, conf, tsup, vitest.

## Key Design Decisions Worth Mentioning

1. **Agent-first, human-second**: JSON output by default when piped. Table output when interactive. Both work great.
2. **Schema introspection**: `clickup schema tasks.create` tells agents exactly what fields are needed at runtime. No docs required in context.
3. **Destructive action safety**: All delete commands require `--confirm`. Prevents agent accidents.
4. **100% API coverage**: Every ClickUp API v2 endpoint. Not 80%, not 95%. Everything.

## Numbers for the Blog

- 22 skill files (1 root, 9 sub-skills, 12 recipes)
- 100% ClickUp API v2 coverage
- ~450 tokens per agent action (vs thousands for MCP)
- Works with 5+ agent platforms (Claude Code, Agent SDK, Claude Desktop, Gemini CLI, Codex)
- MIT licensed, open source

## Call to Action Ideas

- Star the repo: github.com/henryreith/clickup-cli
- Install the plugin: `/plugin marketplace add henryreith/clickup-cli`
- Create your own skills and share them
- The skills architecture pattern works for any CLI, not just ClickUp

## Links to Include

- GitHub repo: https://github.com/henryreith/clickup-cli
- npm package: https://www.npmjs.com/package/clickup-cli
- ClickUp API docs: https://clickup.com/api/
- Anthropic Agent Skills standard: https://agentskills.io
- Claude Code plugins docs: https://code.claude.com/docs/en/plugins
- Claude Agent SDK: https://platform.claude.com/docs/en/agent-sdk/overview

## Video Script Outline (Quick Walkthrough)

1. Show the problem: "ClickUp has no CLI. Agents struggle with the API."
2. Install: `npm install -g clickup-cli` + `/plugin install clickup@clickup-cli`
3. Auth: `clickup auth login --token pk_...`
4. Human use: `clickup task list`, `clickup space list` (table output)
5. Agent use: Show Claude Code using skills naturally
6. Custom skill: Create a marketing-weekly skill in 30 seconds
7. "Star the repo, it's MIT licensed, go build something."
