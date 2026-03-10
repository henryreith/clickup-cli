import Table from 'cli-table3'

export interface ColumnDef {
  key: string
  header: string
  width: number
}

export interface OutputOptions {
  format?: string
  fields?: string
  sort?: string
  limit?: number
  filter?: string
  noHeader?: boolean
  noColor?: boolean
}

export function formatOutput(data: unknown[] | unknown, columns: ColumnDef[], opts: OutputOptions): void {
  const rows = Array.isArray(data) ? data : [data]
  let processed = applyFilter(rows, opts.filter)
  processed = applySort(processed, opts.sort)
  if (opts.limit !== undefined && opts.limit > 0) {
    processed = processed.slice(0, opts.limit)
  }

  const activeCols = filterColumns(columns, opts.fields)
  const format = opts.format ?? (process.stdout.isTTY ? 'table' : 'json')

  switch (format) {
    case 'table':
      printTable(processed, activeCols, opts)
      break
    case 'json':
      printJson(processed)
      break
    case 'csv':
      printDelimited(processed, activeCols, ',', opts)
      break
    case 'tsv':
      printDelimited(processed, activeCols, '\t', opts)
      break
    case 'quiet':
      printQuiet(processed)
      break
    case 'id':
      printId(processed)
      break
    default:
      printJson(processed)
  }
}

function filterColumns(columns: ColumnDef[], fields?: string): ColumnDef[] {
  if (!fields) return columns
  const wanted = new Set(fields.split(',').map((f) => f.trim()))
  return columns.filter((c) => wanted.has(c.key))
}

function applyFilter(rows: unknown[], filter?: string): unknown[] {
  if (!filter) return rows
  const eqIndex = filter.indexOf('=')
  if (eqIndex === -1) return rows
  const key = filter.slice(0, eqIndex)
  const value = filter.slice(eqIndex + 1)
  return rows.filter((row) => {
    if (row && typeof row === 'object') {
      const record = row as Record<string, unknown>
      return String(record[key] ?? '') === value
    }
    return false
  })
}

function applySort(rows: unknown[], sort?: string): unknown[] {
  if (!sort) return rows
  const parts = sort.split(':')
  const field = parts[0]!
  const desc = parts[1] === 'desc'

  return [...rows].sort((a, b) => {
    const aObj = a as Record<string, unknown>
    const bObj = b as Record<string, unknown>
    const aVal = aObj[field]
    const bVal = bObj[field]

    if (aVal === bVal) return 0
    if (aVal === undefined || aVal === null) return 1
    if (bVal === undefined || bVal === null) return -1

    const result = String(aVal).localeCompare(String(bVal), undefined, { numeric: true })
    return desc ? -result : result
  })
}

function getValue(row: unknown, key: string): string {
  if (row && typeof row === 'object') {
    const record = row as Record<string, unknown>
    const val = record[key]
    if (val === null || val === undefined) return ''
    if (typeof val === 'object') return JSON.stringify(val)
    return String(val)
  }
  return ''
}

function truncate(str: string, width: number): string {
  if (str.length <= width) return str
  return str.slice(0, width - 3) + '...'
}

function printTable(rows: unknown[], columns: ColumnDef[], opts: OutputOptions): void {
  if (columns.length === 0) {
    printJson(rows)
    return
  }

  const tableOpts: Record<string, unknown> = {
    colWidths: columns.map((c) => c.width),
    style: { head: opts.noColor ? [] : ['cyan'] },
  }
  if (!opts.noHeader) {
    tableOpts['head'] = columns.map((c) => c.header)
  }

  const table = new Table(tableOpts as ConstructorParameters<typeof Table>[0])

  for (const row of rows) {
    table.push(columns.map((col) => truncate(getValue(row, col.key), col.width - 2)))
  }

  process.stdout.write(table.toString() + '\n')
}

function printJson(rows: unknown[]): void {
  process.stdout.write(JSON.stringify(rows.length === 1 ? rows[0] : rows, null, 2) + '\n')
}

function printDelimited(rows: unknown[], columns: ColumnDef[], delimiter: string, opts: OutputOptions): void {
  if (!opts.noHeader) {
    process.stdout.write(columns.map((c) => c.header).join(delimiter) + '\n')
  }

  for (const row of rows) {
    const values = columns.map((col) => {
      const val = getValue(row, col.key)
      if (delimiter === ',' && (val.includes(',') || val.includes('"') || val.includes('\n'))) {
        return `"${val.replace(/"/g, '""')}"`
      }
      return val
    })
    process.stdout.write(values.join(delimiter) + '\n')
  }
}

function printQuiet(rows: unknown[]): void {
  for (const row of rows) {
    const id = getValue(row, 'id')
    if (id) process.stdout.write(id + '\n')
  }
}

function printId(rows: unknown[]): void {
  if (rows.length > 0) {
    const id = getValue(rows[0]!, 'id')
    if (id) process.stdout.write(id + '\n')
  }
}
