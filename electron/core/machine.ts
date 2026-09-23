export type Pressure = '正常' | '偏高' | '过高'

export function pressureOf(cpuPct: number, memPct: number): Pressure {
  const x = Math.max(cpuPct, memPct)
  if (x >= 90) return '过高'
  if (x >= 70) return '偏高'
  return '正常'
}

export function formatMb(bytes: number): string {
  return Math.max(1, Math.round(bytes / 1024 / 1024)) + 'MB'
}

type RecommendationInput = {
  cores: number
  cpuPct: number
  totalMemBytes: number
  freeMemBytes: number
  appMemBytes: number
  browserAverageBytes?: number
  pressure: Pressure
}

export function recommendConcurrency(input: RecommendationInput) {
  const fallback = 512 * 1024 * 1024
  const browserBytes = input.browserAverageBytes && input.browserAverageBytes > 0 ? input.browserAverageBytes : fallback
  if (input.pressure === '过高') return { account: 1, course: 1, browserBytes, sampled: Boolean(input.browserAverageBytes) }
  const reserve = Math.max(1024 * 1024 * 1024, input.appMemBytes * 2, input.totalMemBytes * 0.1)
  const memorySlots = Math.max(1, Math.floor(Math.max(0, input.freeMemBytes - reserve) / browserBytes))
  const cpuSlots = Math.max(1, Math.floor(input.cores * Math.max(0.1, 1 - input.cpuPct / 100) / 2))
  const account = Math.min(8, input.pressure === '偏高' ? 2 : Math.min(memorySlots, cpuSlots))
  const course = Math.min(input.pressure === '偏高' ? 2 : 6, Math.max(1, Math.floor(input.cores / account / 2)))
  return { account, course, browserBytes, sampled: Boolean(input.browserAverageBytes) }
}
