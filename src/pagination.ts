export interface PageCursor {
  page: number
  start?: number
  start_id?: string
}

export interface PageResult<T> {
  items: T[]
  nextCursor?: PageCursor
  hasMore: boolean
}

export interface PaginateOptions {
  limit?: number
  pageSize?: number
}

export async function* paginate<T>(
  fetchPage: (cursor: PageCursor) => Promise<PageResult<T>>,
  options?: PaginateOptions,
): AsyncGenerator<T> {
  let cursor: PageCursor = { page: 0 }
  let yielded = 0
  const limit = options?.limit

  while (true) {
    const result = await fetchPage(cursor)

    for (const item of result.items) {
      if (limit !== undefined && yielded >= limit) return
      yield item
      yielded++
    }

    if (!result.hasMore || result.items.length === 0) break
    if (limit !== undefined && yielded >= limit) break

    cursor = result.nextCursor ?? { page: cursor.page + 1 }
  }
}

export async function collectAll<T>(
  generator: AsyncGenerator<T>,
): Promise<T[]> {
  const items: T[] = []
  for await (const item of generator) {
    items.push(item)
  }
  return items
}
