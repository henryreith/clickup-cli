import { describe, it, expect } from 'vitest'
import { paginate, collectAll, type PageResult, type PageCursor } from '../pagination.js'

describe('paginate', () => {
  it('iterates through multiple pages', async () => {
    const pages = [
      { items: [1, 2, 3], hasMore: true },
      { items: [4, 5, 6], hasMore: true },
      { items: [7, 8], hasMore: false },
    ]

    const fetchPage = async (cursor: PageCursor): Promise<PageResult<number>> => {
      return pages[cursor.page]
    }

    const result = await collectAll(paginate(fetchPage))
    expect(result).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
  })

  it('stops at limit', async () => {
    const pages = [
      { items: [1, 2, 3], hasMore: true },
      { items: [4, 5, 6], hasMore: true },
    ]

    const fetchPage = async (cursor: PageCursor): Promise<PageResult<number>> => {
      return pages[cursor.page]
    }

    const result = await collectAll(paginate(fetchPage, { limit: 5 }))
    expect(result).toEqual([1, 2, 3, 4, 5])
  })

  it('handles empty first page', async () => {
    const fetchPage = async (): Promise<PageResult<number>> => {
      return { items: [], hasMore: false }
    }

    const result = await collectAll(paginate(fetchPage))
    expect(result).toEqual([])
  })

  it('handles single page', async () => {
    const fetchPage = async (): Promise<PageResult<number>> => {
      return { items: [1, 2], hasMore: false }
    }

    const result = await collectAll(paginate(fetchPage))
    expect(result).toEqual([1, 2])
  })
})
