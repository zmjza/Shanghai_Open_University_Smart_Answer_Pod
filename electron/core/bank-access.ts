export type BankAccessState = {
  failedAttempts: number
  lockedUntil: number
}

export type BankAccessResult = {
  ok: boolean
  state: BankAccessState
  remainingAttempts: number
  lockedUntil: number
}

export function bankAccessAttempt(state: BankAccessState, matched: boolean, now = Date.now()): BankAccessResult {
  if (state.lockedUntil > now) {
    return { ok: false, state, remainingAttempts: 0, lockedUntil: state.lockedUntil }
  }
  const current = state.lockedUntil ? { failedAttempts: 0, lockedUntil: 0 } : state
  if (matched) {
    const reset = { failedAttempts: 0, lockedUntil: 0 }
    return { ok: true, state: reset, remainingAttempts: 5, lockedUntil: 0 }
  }
  const failedAttempts = Math.min(5, current.failedAttempts + 1)
  const lockedUntil = failedAttempts >= 5 ? now + 60_000 : 0
  const next = { failedAttempts, lockedUntil }
  return { ok: false, state: next, remainingAttempts: Math.max(0, 5 - failedAttempts), lockedUntil }
}
