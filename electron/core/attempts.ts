export function normalizeRunLimit(value: unknown): number {
  return Math.min(10, Math.max(1, Number(value) || 10))
}

/** 无限制按学生选择；上限或剩余 <=3 则 1；其余 min(学生选择, 剩余) */
export function maxAttemptsThisRun(opts: {
  replyCountHidden: number | null
  visible: string
  used: number
  cap?: number | null
  runLimit?: number
}): number {
  const runLimit = normalizeRunLimit(opts.runLimit)
  const unlimited =
    opts.replyCountHidden === -1 ||
    /无限制/.test(opts.visible) ||
    opts.cap == null ||
    opts.cap < 0
  if (unlimited) return runLimit
  const cap = opts.cap ?? 0
  const remaining = Math.max(0, cap - opts.used)
  if (remaining <= 0) return 0
  if (cap <= 3 || remaining <= 3) return 1
  return Math.min(runLimit, remaining)
}

export function parseWeight(text: string): number {
  const m = String(text).match(/(-?\d+(?:\.\d+)?)\s*%/)
  if (m) return Number(m[1])
  const n = Number(String(text).replace(/[^0-9.\-]/g, ''))
  return Number.isFinite(n) ? n : 0
}

export function parseUsedAttempts(visible: string): number {
  const m = String(visible).match(/(\d+)\s*\//)
  return m ? Number(m[1]) : 0
}
