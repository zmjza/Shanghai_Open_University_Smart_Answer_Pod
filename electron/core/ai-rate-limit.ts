export const AI_MIN_REQUEST_INTERVAL_MS = 750
export const AI_RATE_LIMIT_COOLDOWN_MS = 5_000

type Sleep = (ms: number) => Promise<void>

export function retryAfterMs(value: string | null, now = Date.now()): number {
  if (!value) return 0
  const seconds = Number(value)
  if (Number.isFinite(seconds) && seconds >= 0) return Math.round(seconds * 1_000)
  const date = Date.parse(value)
  return Number.isFinite(date) ? Math.max(0, date - now) : 0
}

export function createRequestPacer(
  intervalMs = AI_MIN_REQUEST_INTERVAL_MS,
  now = Date.now,
  sleep: Sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
) {
  let nextAt = 0
  let tail = Promise.resolve()
  return {
    wait() {
      const current = tail.then(async () => {
        const delay = Math.max(0, nextAt - now())
        if (delay) await sleep(delay)
        nextAt = Math.max(nextAt, now() + intervalMs)
      })
      tail = current.catch(() => undefined)
      return current
    },
    defer(ms: number) {
      nextAt = Math.max(nextAt, now() + Math.max(0, ms))
    },
  }
}

const sharedPacer = createRequestPacer()

export const waitForAiRequestSlot = () => sharedPacer.wait()
export const deferAiRequests = (ms: number) => sharedPacer.defer(ms)
