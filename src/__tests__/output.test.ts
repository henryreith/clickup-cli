import { describe, it, expect, vi, beforeEach } from 'vitest'
import { formatOutput, type ColumnDef } from '../output.js'

const COLUMNS: ColumnDef[] = [
  { key: 'id', header: 'ID', width: 12 },
  { key: 'name', header: 'Name', width: 20 },
  { key: 'status', header: 'Status', width: 12 },
]

const FIXTURE = [
  { id: '1', name: 'Task One', status: 'open' },
  { id: '2', name: 'Task Two', status: 'closed' },
  { id: '3', name: 'Task Three', status: 'open' },
]

function captureStdout(): () => string {
  const spy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
  return () => (spy.mock.calls as unknown[][]).map((c) => c[0]).join('')
}

describe('formatOutput', () => {
  let getOutput: () => string

  beforeEach(() => {
    getOutput = captureStdout()
  })

  it('outputs JSON format', () => {
    formatOutput(FIXTURE, COLUMNS, { format: 'json' })
    const parsed = JSON.parse(getOutput())
    expect(parsed).toHaveLength(3)
    expect(parsed[0].id).toBe('1')
  })

  it('outputs single item as object in JSON', () => {
    formatOutput([FIXTURE[0]], COLUMNS, { format: 'json' })
    const parsed = JSON.parse(getOutput())
    expect(parsed.id).toBe('1')
  })

  it('outputs table format', () => {
    formatOutput(FIXTURE, COLUMNS, { format: 'table', noColor: true })
    const output = getOutput()
    expect(output).toContain('ID')
    expect(output).toContain('Name')
    expect(output).toContain('Task One')
  })

  it('outputs CSV format', () => {
    formatOutput(FIXTURE, COLUMNS, { format: 'csv' })
    const lines = getOutput().trim().split('\n')
    expect(lines[0]).toBe('ID,Name,Status')
    expect(lines[1]).toBe('1,Task One,open')
  })

  it('outputs CSV with proper quoting', () => {
    const data = [{ id: '1', name: 'Task, with comma', status: 'open' }]
    formatOutput(data, COLUMNS, { format: 'csv' })
    expect(getOutput()).toContain('"Task, with comma"')
  })

  it('outputs TSV format', () => {
    formatOutput(FIXTURE, COLUMNS, { format: 'tsv' })
    const lines = getOutput().trim().split('\n')
    expect(lines[0]).toBe('ID\tName\tStatus')
    expect(lines[1]).toBe('1\tTask One\topen')
  })

  it('outputs quiet format (IDs only)', () => {
    formatOutput(FIXTURE, COLUMNS, { format: 'quiet' })
    expect(getOutput().trim()).toBe('1\n2\n3')
  })

  it('outputs id format (single ID)', () => {
    formatOutput(FIXTURE, COLUMNS, { format: 'id' })
    expect(getOutput().trim()).toBe('1')
  })

  it('respects --fields filter', () => {
    formatOutput(FIXTURE, COLUMNS, { format: 'csv', fields: 'id,name' })
    const lines = getOutput().trim().split('\n')
    expect(lines[0]).toBe('ID,Name')
    expect(lines[1]).toBe('1,Task One')
  })

  it('respects --sort ascending', () => {
    formatOutput(FIXTURE, COLUMNS, { format: 'quiet', sort: 'name' })
    expect(getOutput().trim()).toBe('1\n3\n2')
  })

  it('respects --sort descending', () => {
    formatOutput(FIXTURE, COLUMNS, { format: 'quiet', sort: 'name:desc' })
    expect(getOutput().trim()).toBe('2\n3\n1')
  })

  it('respects --limit', () => {
    formatOutput(FIXTURE, COLUMNS, { format: 'quiet', limit: 2 })
    expect(getOutput().trim()).toBe('1\n2')
  })

  it('respects --filter', () => {
    formatOutput(FIXTURE, COLUMNS, { format: 'quiet', filter: 'status=open' })
    expect(getOutput().trim()).toBe('1\n3')
  })

  it('omits header with --no-header', () => {
    formatOutput(FIXTURE, COLUMNS, { format: 'csv', noHeader: true })
    const lines = getOutput().trim().split('\n')
    expect(lines[0]).toBe('1,Task One,open')
  })
})
