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
  page?: number
}

export async function* paginate<T>(
  fetchPage: (cursor: PageCursor) => Promise<PageResult<T>>,
  options: PaginateOptions = {},
): AsyncGenerator<T> {
  const { limit, page: singlePage } = options
  let yielded = 0

  if (singlePage !== undefined) {
    const result = await fetchPage({ page: singlePage })
    for (const item of result.items) {
      if (limit !== undefined && yielded >= limit) return
      yield item
      yielded++
    }
    return
  }

  let currentPage = 0

  while (true) {
    const result = await fetchPage({ page: currentPage })

    for (const item of result.items) {
      if (limit !== undefined && yielded >= limit) return
      yield item
      yielded++
    }

    if (!result.hasMore || result.items.length === 0) break
    currentPage++
  }
}

export async function* paginateCursor<T>(
  fetchPage: (cursor: PageCursor) => Promise<PageResult<T>>,
  options: PaginateOptions = {},
): AsyncGenerator<T> {
  const { limit } = options
  let yielded = 0
  let cursor: PageCursor = { page: 0 }

  while (true) {
    const result = await fetchPage(cursor)

    for (const item of result.items) {
      if (limit !== undefined && yielded >= limit) return
      yield item
      yielded++
    }

    if (!result.hasMore || !result.nextCursor) break
    cursor = result.nextCursor
  }
}

export async function collectPages<T>(generator: AsyncGenerator<T>): Promise<T[]> {
  const items: T[] = []
  for await (const item of generator) {
    items.push(item)
  }
  return items
}
