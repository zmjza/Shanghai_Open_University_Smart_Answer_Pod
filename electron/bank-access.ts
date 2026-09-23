import { scryptSync, timingSafeEqual } from 'node:crypto'
import { bankAccessAttempt } from './core/bank-access'
import { getBankAccessState, saveBankAccessState } from './store'

const passwordHashes = [
  ['bank-gate-1', 'f6edb106b3243bd14eb211b636d908a62b7b443d351f50df61ffc1137a3f9b8a'],
  ['bank-gate-2', '5645e7106aa06b5323212c4f106399ba401b4996b6ae28ff5d18867790a4de57'],
  ['bank-gate-3', '802476a043e3482961435281a92585290539c75c0e41c1b0da5ddde8a228acf2'],
] as const

function passwordMatches(password: string) {
  return passwordHashes.some(([salt, expected]) => {
    const actual = scryptSync(password, salt, 32)
    return timingSafeEqual(actual, Buffer.from(expected, 'hex'))
  })
}

export function bankAccessStatus(now = Date.now()) {
  const state = getBankAccessState()
  if (state.lockedUntil && state.lockedUntil <= now) {
    const reset = { failedAttempts: 0, lockedUntil: 0 }
    saveBankAccessState(reset)
    return { ok: false, lockedUntil: 0, remainingAttempts: 5 }
  }
  return { ok: false, lockedUntil: state.lockedUntil, remainingAttempts: Math.max(0, 5 - state.failedAttempts) }
}

export function unlockBank(password: string, now = Date.now()) {
  const result = bankAccessAttempt(getBankAccessState(), passwordMatches(password), now)
  saveBankAccessState(result.state)
  return { ok: result.ok, lockedUntil: result.lockedUntil, remainingAttempts: result.remainingAttempts }
}
