export type ConnectivityFailure = {
  status?: number
  retryAfterMs?: number
  error?: string
}

export type ConnectivityStatus = 'queued' | 'running' | 'success' | 'failed'

export type ConnectivityItem = {
  model: string
  ok: boolean
  status: ConnectivityStatus
  elapsedMs: number
  reason?: string
  httpStatus?: number
}

export function classifyConnectivityFailure(failure: ConnectivityFailure): string {
  if (failure.status === 401 || failure.status === 403) return '鉴权失败'
  if (failure.status === 404) return '模型不存在'
  if (failure.status === 429) {
    const seconds = Math.max(0, Math.round((failure.retryAfterMs || 0) / 1000))
    return seconds ? `限流 · 等待 ${seconds} 秒` : '限流'
  }
  if (failure.error === 'timeout') return '超时'
  if (failure.error === 'empty') return '返回内容为空'
  if (failure.error === 'format') return '返回格式不符合要求'
  if (failure.status && failure.status >= 500) return '服务端错误'
  return '网络失败'
}

export function connectivitySummary(results: { ok: boolean }[]): string {
  const available = results.filter((result) => result.ok).length
  if (available === 0) return 'AI 服务不可用'
  if (available <= 2) return '请检查 API 配置或模型状态'
  if (available * 2 <= results.length) return '请注意，部分模型不可用'
  return 'AI 服务正常'
}

export async function runConnectivityChecks(
  models: readonly string[],
  concurrency: number,
  check: (model: string) => Promise<ConnectivityItem>,
  onUpdate?: (items: ConnectivityItem[]) => void,
): Promise<ConnectivityItem[]> {
  const results: ConnectivityItem[] = models.map((model) => ({ model, ok: false, status: 'queued', elapsedMs: 0 }))
  const emit = () => onUpdate?.(results.map((item) => ({ ...item })))
  let cursor = 0
  emit()

  async function worker() {
    while (true) {
      const index = cursor++
      if (index >= models.length) return
      results[index] = { model: models[index], ok: false, status: 'running', elapsedMs: 0 }
      emit()
      results[index] = await check(models[index])
      emit()
    }
  }

  const count = Math.min(Math.max(1, Math.floor(concurrency) || 1), Math.max(1, models.length))
  await Promise.all(Array.from({ length: count }, () => worker()))
  return results
}
