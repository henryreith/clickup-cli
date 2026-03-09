# ClickUp CLI - Development Reference

## What This Project Is

A standalone, open-source CLI covering the entire ClickUp API v2 surface. Not tied to any specific framework or AI agent system. Published to npm as a global CLI tool.

**Note:** This file (CLAUDE.md) guides AI agents **building** the CLI codebase. For AI agents **using** the CLI to manage ClickUp data, see the skills system in `skills/` and SPEC.md Section 12.

## Stack

- **Runtime:** Node.js 22+, TypeScript strict mode, ESM modules
- **CLI:** Commander.js 12+
- **Validation:** Zod 3+
- **Output:** chalk (colors), cli-table3 (tables), ora (spinners)
- **Config:** conf (XDG-compliant persistent storage)
- **HTTP:** Native fetch (Node 22+ built-in)
- **Build:** tsup (ESM bundle with shebang)
- **Test:** vitest

## Commands

```bash
npm run dev        # run via tsx during development
npm run build      # bundle with tsup
npm test           # vitest
npm run typecheck  # tsc --noEmit
```

## Code Conventions

### General
- TypeScript strict mode, ESM modules throughout
- Named exports only, no default exports
- No em dashes in any output strings or comments
- No AI cliches in help text or error messages

### File Organization
- One command group per file in `src/commands/`
- One type file per resource in `src/types/`
- One test file per command group in `src/__tests__/commands/`
- One skill per resource group in `skills/clickup-<resource>/SKILL.md`
- Keep files under 400 lines. Split when they grow.

### Command Pattern
Every command file follows the same structure:

```typescript
// src/commands/resource.ts
import { Command } from 'commander'
import { z } from 'zod'
import type { ClickUpClient } from '../client.js'
import { formatOutput } from '../output.js'

// 1. Zod schema for API response
const ResourceSchema = z.object({
  id: z.string(),
  name: z.string(),
  // ... all fields from ClickUp API
})

// 2. Column definitions for table output
const COLUMNS = [
  { key: 'id', header: 'ID', width: 12 },
  { key: 'name', header: 'Name', width: 30 },
]

// 3. Named export: register function
export function registerResourceCommands(program: Command, client: ClickUpClient): void {
  const resource = program.command('resource').description('Manage resources')

  resource
    .command('list')
    .description('List resources')
    .option('--workspace-id <id>', 'Workspace ID')
    .action(async (opts) => {
      const data = await client.get('/endpoint', params)
      formatOutput(data.items, COLUMNS, program.opts())
    })

  // ... get, create, update, delete follow same pattern
}
```

### HTTP Client
- All API calls go through `src/client.ts` ClickUpClient class
- Never call fetch directly from command files
- Client handles auth headers, rate limiting, retry, and timeouts
- Use client.get/post/put/delete methods
- Use client.upload for multipart file uploads

### Error Handling
- Throw ClickUpError (from src/errors.ts) for API failures
- Let Commander handle invalid arguments/options
- Map errors to exit codes in the top-level error handler
- User-friendly messages for common ClickUp ECODEs
- Never throw generic Error - always use ClickUpError

### Config Resolution
- Always use resolveToken(), resolveWorkspaceId(), etc. from src/config.ts
- Precedence: command flag > environment variable > stored config
- Never read process.env directly in command files

### Output
- Always use formatOutput() from src/output.ts
- Define COLUMNS array for each resource type
- Let the output system handle format switching, field filtering, sorting
- JSON output should pass through raw API data (no transformation)

### Validation
- Zod schemas for every API response type
- Validate CLI input before sending requests where practical
- Parse API responses through Zod schemas in debug mode

### Testing
- Mock the HTTP client, not fetch directly
- Test correct API path and method for each command
- Test option-to-query-param mapping
- Test output formatting with fixture data
- Test error handling paths
- Fixtures go in src/__tests__/fixtures/

### Destructive Operations
- All delete commands must accept --confirm flag
- In TTY mode without --confirm: prompt for confirmation
- In non-TTY mode without --confirm: fail with error
- Never auto-confirm destructive actions

### Schema and Skills
- Register field definitions in `src/schema.ts` for every command action
- Schema definitions are derived from the same Zod schemas used for validation
- When adding a new command group, create/update the corresponding skill in `skills/`
- Skill files follow the Anthropic Agent Skills standard (YAML frontmatter + markdown)
- Keep sub-skills under 300 lines; keep recipe skills under 400 lines

## Key Design Decisions

1. No wrapper SDK layer. Commands call client.get/post/put/delete with API paths directly. Zod schemas are the types.
2. No caching. Stateless per invocation. Config storage is only for auth and preferences.
3. Polymorphic commands over separate commands. `comment list --task-id` and `comment list --list-id` are one command, not two.
4. JSON field names match the ClickUp API exactly. No renaming, no camelCase conversion.
5. Auto-detect TTY for output format. JSON when piped, table when interactive.
6. Skills over MCP for agent integration. Hierarchical skills keep token overhead near zero. ClickUp has an official MCP server for MCP-compatible hosts.
7. Schema introspection from Zod. The `clickup schema` command derives its output from the same Zod schemas used for validation, keeping them always in sync.

## Reference

- [SPEC.md](./SPEC.md) - Full technical specification
- [COMMANDS.md](./COMMANDS.md) - Complete command reference
- [IMPLEMENTATION.md](./IMPLEMENTATION.md) - Build order and phases
- [ClickUp API v2 Docs](https://clickup.com/api/)
