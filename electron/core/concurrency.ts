export async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let next = 0
  const count = Math.min(Math.max(1, Math.floor(limit) || 1), Math.max(1, items.length))

  async function run() {
    while (true) {
      const index = next++
      if (index >= items.length) return
      results[index] = await worker(items[index], index)
    }
  }

  await Promise.all(Array.from({ length: count }, () => run()))
  return results
}

type ConcurrencyValues = {
  account_parallel: number
  course_parallel: number
}

export function concurrencyChangeLocked(
  current: ConcurrencyValues,
  partial: Partial<ConcurrencyValues> & Record<string, unknown>,
  running: boolean,
): boolean {
  if (!running) return false
  return (partial.account_parallel !== undefined && Number(partial.account_parallel) !== current.account_parallel) ||
    (partial.course_parallel !== undefined && Number(partial.course_parallel) !== current.course_parallel)
}

export function concurrencySnapshot(settings: ConcurrencyValues): ConcurrencyValues {
  return {
    account_parallel: settings.account_parallel,
    course_parallel: settings.course_parallel,
  }
}
