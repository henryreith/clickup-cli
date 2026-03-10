import { describe, it, expect } from 'vitest'
import { paginate, paginateCursor, collectPages, type PageResult } from '../pagination.js'

describe('paginate', () => {
  it('fetches all pages', async () => {
    const pages: PageResult<string>[] = [
      { items: ['a', 'b'], hasMore: true },
      { items: ['c', 'd'], hasMore: true },
      { items: ['e'], hasMore: false },
    ]

    const items = await collectPages(
      paginate(async (cursor) => pages[cursor.page]!),
    )

    expect(items).toEqual(['a', 'b', 'c', 'd', 'e'])
  })

  it('stops at limit', async () => {
    const pages: PageResult<string>[] = [
      { items: ['a', 'b', 'c'], hasMore: true },
      { items: ['d', 'e', 'f'], hasMore: false },
    ]

    const items = await collectPages(
      paginate(async (cursor) => pages[cursor.page]!, { limit: 4 }),
    )

    expect(items).toEqual(['a', 'b', 'c', 'd'])
  })

  it('fetches single page when page option set', async () => {
    let fetchedPage = -1
    const pages: PageResult<string>[] = [
      { items: ['a', 'b'], hasMore: true },
      { items: ['c', 'd'], hasMore: true },
      { items: ['e'], hasMore: false },
    ]

    const items = await collectPages(
      paginate(async (cursor) => {
        fetchedPage = cursor.page
        return pages[cursor.page]!
      }, { page: 1 }),
    )

    expect(items).toEqual(['c', 'd'])
    expect(fetchedPage).toBe(1)
  })

  it('handles empty result', async () => {
    const items = await collectPages(
      paginate(async () => ({ items: [], hasMore: false })),
    )

    expect(items).toEqual([])
  })
})

describe('paginateCursor', () => {
  it('follows cursor chain', async () => {
    const items = await collectPages(
      paginateCursor(async (cursor) => {
        if (cursor.page === 0 && !cursor.start_id) {
          return {
            items: ['a', 'b'],
            hasMore: true,
            nextCursor: { page: 0, start_id: 'cursor_1' },
          }
        }
        if (cursor.start_id === 'cursor_1') {
          return {
            items: ['c', 'd'],
            hasMore: false,
          }
        }
        return { items: [], hasMore: false }
      }),
    )

    expect(items).toEqual(['a', 'b', 'c', 'd'])
  })

  it('respects limit', async () => {
    const items = await collectPages(
      paginateCursor(async () => ({
        items: ['a', 'b', 'c'],
        hasMore: true,
        nextCursor: { page: 1 },
      }), { limit: 2 }),
    )

    expect(items).toEqual(['a', 'b'])
  })
})
