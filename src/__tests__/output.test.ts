import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { formatOutput, type ColumnDefinition } from '../output.js'

const COLUMNS: ColumnDefinition[] = [
  { key: 'id', header: 'ID', width: 10 },
  { key: 'name', header: 'Name', width: 20 },
  { key: 'status', header: 'Status', width: 12 },
]

const ITEMS = [
  { id: '1', name: 'Task One', status: 'open' },
  { id: '2', name: 'Task Two', status: 'closed' },
  { id: '3', name: 'Task Three', status: 'open' },
]

describe('formatOutput', () => {
  let writeSpy: ReturnType<typeof vi.spyOn>
  let output: string

  beforeEach(() => {
    output = ''
    writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
      output += String(chunk)
      return true
    })
  })

  afterEach(() => {
    writeSpy.mockRestore()
  })

  describe('json format', () => {
    it('outputs pretty-printed JSON array', () => {
      formatOutput(ITEMS, COLUMNS, { format: 'json' })
      const parsed = JSON.parse(output)
      expect(parsed).toEqual(ITEMS)
    })

    it('outputs single object for non-array data', () => {
      formatOutput(ITEMS[0], COLUMNS, { format: 'json' })
      const parsed = JSON.parse(output)
      expect(parsed).toEqual(ITEMS[0])
    })
  })

  describe('csv format', () => {
    it('outputs CSV with headers', () => {
      formatOutput(ITEMS, COLUMNS, { format: 'csv' })
      const lines = output.trim().split('\n')
      expect(lines[0]).toBe('ID,Name,Status')
      expect(lines[1]).toBe('1,Task One,open')
      expect(lines.length).toBe(4) // header + 3 items
    })

    it('omits headers when noHeader is true', () => {
      formatOutput(ITEMS, COLUMNS, { format: 'csv', noHeader: true })
      const lines = output.trim().split('\n')
      expect(lines[0]).toBe('1,Task One,open')
      expect(lines.length).toBe(3)
    })

    it('escapes values with commas', () => {
      const data = [{ id: '1', name: 'Task, With Comma', status: 'open' }]
      formatOutput(data, COLUMNS, { format: 'csv' })
      const lines = output.trim().split('\n')
      expect(lines[1]).toBe('1,"Task, With Comma",open')
    })
  })

  describe('tsv format', () => {
    it('outputs TSV with tab separators', () => {
      formatOutput(ITEMS, COLUMNS, { format: 'tsv' })
      const lines = output.trim().split('\n')
      expect(lines[0]).toBe('ID\tName\tStatus')
      expect(lines[1]).toBe('1\tTask One\topen')
    })
  })

  describe('quiet format', () => {
    it('outputs one ID per line', () => {
      formatOutput(ITEMS, COLUMNS, { format: 'quiet' })
      const lines = output.trim().split('\n')
      expect(lines).toEqual(['1', '2', '3'])
    })
  })

  describe('id format', () => {
    it('outputs single ID', () => {
      formatOutput(ITEMS, COLUMNS, { format: 'id' })
      expect(output.trim()).toBe('1')
    })
  })

  describe('table format', () => {
    it('outputs formatted table', () => {
      formatOutput(ITEMS, COLUMNS, { format: 'table' })
      expect(output).toContain('ID')
      expect(output).toContain('Name')
      expect(output).toContain('Task One')
    })

    it('shows no results message for empty data', () => {
      formatOutput([], COLUMNS, { format: 'table' })
      expect(output).toContain('No results found')
    })
  })

  describe('fields filtering', () => {
    it('shows only requested fields', () => {
      formatOutput(ITEMS, COLUMNS, { format: 'csv', fields: 'id,name' })
      const lines = output.trim().split('\n')
      expect(lines[0]).toBe('ID,Name')
      expect(lines[1]).toBe('1,Task One')
    })
  })

  describe('filter', () => {
    it('filters items by key=value', () => {
      formatOutput(ITEMS, COLUMNS, { format: 'quiet', filter: 'status=open' })
      const lines = output.trim().split('\n')
      expect(lines).toEqual(['1', '3'])
    })
  })

  describe('sort', () => {
    it('sorts ascending by default', () => {
      formatOutput(ITEMS, COLUMNS, { format: 'quiet', sort: 'name' })
      const lines = output.trim().split('\n')
      expect(lines).toEqual(['1', '3', '2'])
    })

    it('sorts descending with :desc', () => {
      formatOutput(ITEMS, COLUMNS, { format: 'quiet', sort: 'name:desc' })
      const lines = output.trim().split('\n')
      expect(lines).toEqual(['2', '3', '1'])
    })
  })

  describe('limit', () => {
    it('limits output to n items', () => {
      formatOutput(ITEMS, COLUMNS, { format: 'quiet', limit: 2 })
      const lines = output.trim().split('\n')
      expect(lines).toEqual(['1', '2'])
    })
  })
})
