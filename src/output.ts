import Table from 'cli-table3'

export interface ColumnDefinition {
  key: string
  header: string
  width?: number
  transform?: (value: unknown) => string
}

export interface OutputOptions {
  format?: string
  noColor?: boolean
  noHeader?: boolean
  fields?: string
  filter?: string
  sort?: string
  limit?: number
}

export function formatOutput(
  data: unknown,
  columns: ColumnDefinition[],
  globalOpts: OutputOptions,
): void {
  const format = globalOpts.format ?? (process.stdout.isTTY ? 'table' : 'json')
  const items = Array.isArray(data) ? data : [data]

  let filtered = applyFilter(items, globalOpts.filter)
  let sorted = applySort(filtered, globalOpts.sort)
  let limited = applyLimit(sorted, globalOpts.limit)

  const activeColumns = filterColumns(columns, globalOpts.fields)

  switch (format) {
    case 'json':
      outputJson(Array.isArray(data) ? limited : limited[0])
      break
    case 'csv':
      outputDelimited(limited, activeColumns, ',', !globalOpts.noHeader)
      break
    case 'tsv':
      outputDelimited(limited, activeColumns, '\t', !globalOpts.noHeader)
      break
    case 'quiet':
      outputQuiet(limited)
      break
    case 'id':
      outputId(limited)
      break
    case 'table':
    default:
      outputTable(limited, activeColumns, !globalOpts.noHeader)
      break
  }
}

function filterColumns(
  columns: ColumnDefinition[],
  fields?: string,
): ColumnDefinition[] {
  if (!fields) return columns
  const requested = fields.split(',').map((f) => f.trim())
  return columns.filter((col) => requested.includes(col.key))
}

function applyFilter(
  items: Record<string, unknown>[],
  filter?: string,
): Record<string, unknown>[] {
  if (!filter) return items
  const [key, value] = filter.split('=')
  if (!key || value === undefined) return items
  return items.filter((item) => String(item[key]) === value)
}

function applySort(
  items: Record<string, unknown>[],
  sort?: string,
): Record<string, unknown>[] {
  if (!sort) return items
  const [field, direction] = sort.split(':')
  const desc = direction === 'desc'
  return [...items].sort((a, b) => {
    const aVal = String(a[field] ?? '')
    const bVal = String(b[field] ?? '')
    const cmp = aVal.localeCompare(bVal, undefined, { numeric: true })
    return desc ? -cmp : cmp
  })
}

function applyLimit(
  items: Record<string, unknown>[],
  limit?: number,
): Record<string, unknown>[] {
  if (!limit || limit <= 0) return items
  return items.slice(0, limit)
}

function outputJson(data: unknown): void {
  process.stdout.write(JSON.stringify(data, null, 2) + '\n')
}

function outputTable(
  items: Record<string, unknown>[],
  columns: ColumnDefinition[],
  showHeader: boolean,
): void {
  if (items.length === 0) {
    process.stdout.write('No results found.\n')
    return
  }

  const table = new Table({
    head: showHeader ? columns.map((c) => c.header) : [],
    colWidths: columns.map((c) => c.width ?? null),
    style: { head: ['cyan'] },
    wordWrap: true,
  })

  for (const item of items) {
    const row = columns.map((col) => {
      const raw = item[col.key]
      if (col.transform) return col.transform(raw)
      if (raw === null || raw === undefined) return ''
      return String(raw)
    })
    table.push(row)
  }

  process.stdout.write(table.toString() + '\n')
}

function outputDelimited(
  items: Record<string, unknown>[],
  columns: ColumnDefinition[],
  delimiter: string,
  showHeader: boolean,
): void {
  if (showHeader) {
    process.stdout.write(columns.map((c) => escapeDelimited(c.header, delimiter)).join(delimiter) + '\n')
  }
  for (const item of items) {
    const row = columns.map((col) => {
      const raw = item[col.key]
      const value = raw === null || raw === undefined ? '' : String(raw)
      return escapeDelimited(value, delimiter)
    })
    process.stdout.write(row.join(delimiter) + '\n')
  }
}

function escapeDelimited(value: string, delimiter: string): string {
  if (value.includes(delimiter) || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function outputQuiet(items: Record<string, unknown>[]): void {
  for (const item of items) {
    const id = item.id ?? item.ID ?? ''
    process.stdout.write(String(id) + '\n')
  }
}

function outputId(items: Record<string, unknown>[]): void {
  if (items.length > 0) {
    const id = items[0].id ?? items[0].ID ?? ''
    process.stdout.write(String(id) + '\n')
  }
}
