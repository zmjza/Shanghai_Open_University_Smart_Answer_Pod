import { AI_MODELS } from './core/ai-parse.ts'
import { classifyConnectivityFailure, connectivitySummary, runConnectivityChecks, type ConnectivityItem } from './core/connectivity.ts'

export type ConnectivityResult = ConnectivityItem

async function testOne(model: string, key: string): Promise<ConnectivityResult> {
  const started = Date.now()
  if (!key) return { model, ok: false, status: 'failed', elapsedMs: 0, reason: '未配置 API Key' }
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 12000)
  try {
    const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        temperature: 0,
        max_tokens: 8,
        messages: [{ role: 'user', content: '只回复 OK' }],
      }),
    })
    const elapsedMs = Date.now() - started
    if (!response.ok) {
      const retryAfter = Number(response.headers.get('retry-after') || 0)
      return { model, ok: false, status: 'failed', elapsedMs, httpStatus: response.status, reason: classifyConnectivityFailure({ status: response.status, retryAfterMs: retryAfter * 1000 }) }
    }
    const data = await response.json() as { choices?: { message?: { content?: string } }[] }
    if (!data.choices?.[0]?.message?.content?.trim()) {
      return { model, ok: false, status: 'failed', elapsedMs, reason: classifyConnectivityFailure({ error: 'empty' }) }
    }
    return { model, ok: true, status: 'success', elapsedMs }
  } catch (error) {
    const timeout = error instanceof Error && error.name === 'AbortError'
    return { model, ok: false, status: 'failed', elapsedMs: Date.now() - started, reason: classifyConnectivityFailure({ error: timeout ? 'timeout' : 'network' }) }
  } finally {
    clearTimeout(timer)
  }
}

export async function testModels(
  key: string,
  models: readonly string[],
  concurrency = 3,
  onUpdate?: (items: ConnectivityResult[]) => void,
): Promise<{ results: ConnectivityResult[]; summary: string; testedAt: string }> {
  const results = await runConnectivityChecks(models, concurrency, (model) => testOne(model, key), onUpdate)
  return { results, summary: connectivitySummary(results), testedAt: new Date().toISOString() }
}

export function testAllModels(
  key: string,
  concurrency = 3,
  onUpdate?: (items: ConnectivityResult[]) => void,
) {
  return testModels(key, AI_MODELS, concurrency, onUpdate)
}

export function testSingleModel(key: string, model: string, onUpdate?: (items: ConnectivityResult[]) => void) {
  if (!AI_MODELS.includes(model as (typeof AI_MODELS)[number])) throw new Error('模型不在正式降级清单中')
  return testModels(key, [model], 1, onUpdate)
}
