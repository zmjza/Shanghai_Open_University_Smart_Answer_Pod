import type { HomeworkState } from './states.ts'

export const MAX_ANSWER_REPAIR_ATTEMPTS = 30
export const BANK_ANSWER_DELAY_MIN_MS = 1_000
export const BANK_ANSWER_DELAY_MAX_MS = 3_000

export function bankAnswerDelayMs(random: () => number = Math.random): number {
  return BANK_ANSWER_DELAY_MIN_MS + Math.floor(random() * (BANK_ANSWER_DELAY_MAX_MS - BANK_ANSWER_DELAY_MIN_MS))
}

export function answerRepairExhaustedAction(missing: string[], reasons: string[] = []): string {
  const numbers = missing.slice(0, 8).join('、') + (missing.length > 8 ? `等 ${missing.length} 题` : '题')
  const cause = reasons.filter(Boolean).slice(0, 2).join('；') || 'AI 无可用答案或页面未写入'
  return `补答已达 ${MAX_ANSWER_REPAIR_ATTEMPTS} 轮仍失败 · 第 ${numbers}未完成 · ${cause} · 已安全停止，未提交`
}

export function judgeListRow(workType: string, weightPercent: number): {
  needDo: boolean
  status: HomeworkState
} {
  const objective = String(workType).includes('客观题')
  if (objective && weightPercent <= 0) return { needDo: false, status: 'skip_weight0' }
  if (!objective) return { needDo: false, status: 'skip_non_objective' }
  return { needDo: true, status: 'todo' }
}

export function shouldInspectHistory(homework: { needDo: boolean; previewHref: string; status?: string }, mode: 'answer' | 'extract'): boolean {
  if (!homework.previewHref) return false
  if (mode === 'answer') return homework.needDo
  return homework.status !== 'skip_non_objective' && homework.status !== 'skip_weight0'
}

export function inWindow(now: number, startMs: number | null, endMs: number | null): boolean {
  if (startMs != null && now < startMs) return false
  if (endMs != null && now > endMs) return false
  return true
}

export type HistoryRow = {
  attempt?: number
  status: string
  score: number | null
  submittedAt: string
  hasContinue: boolean
  hasHistoryView: boolean
  historyHref?: string
}

export type HistoryDisplayState = 'viewable' | 'ungraded' | 'unfinished' | 'continue_only' | 'no_view'

export function historyDisplayState(row: HistoryRow): HistoryDisplayState {
  if (/未完成提交|未提交记录/.test(row.status)) return 'unfinished'
  if (/未批阅/.test(row.status)) return 'ungraded'
  if (row.hasContinue && !row.hasHistoryView) return 'continue_only'
  return row.hasHistoryView && Boolean(row.historyHref) ? 'viewable' : 'no_view'
}

export function skipFullScore(rows: HistoryRow[]): boolean {
  return rows.some((r) => r.status.includes('已批阅') && r.score === 100)
}

export function newestGraded(rows: HistoryRow[]): HistoryRow | null {
  const graded = rows.filter((r) => r.status.includes('已批阅'))
  if (!graded.length) return null
  return [...graded].sort((a, b) => Date.parse(b.submittedAt) - Date.parse(a.submittedAt))[0]
}

export function newestHistory(rows: HistoryRow[]): HistoryRow | null {
  if (!rows.length) return null
  return [...rows].sort((a, b) => (Date.parse(b.submittedAt) || 0) - (Date.parse(a.submittedAt) || 0))[0]
}

export function newSubmission(rows: HistoryRow[], before: string[]): HistoryRow | null {
  const latestBefore = Math.max(0, ...before.map((time) => Date.parse(time) || 0))
  return newestHistory(rows.filter((row) =>
    !row.hasContinue && !/未完成提交|未提交记录/.test(row.status) &&
    (row.hasHistoryView || row.status.includes('批阅')) &&
    (Date.parse(row.submittedAt) || 0) > latestBefore))
}

export const SUBMIT = {
  button: '#submitHomeWork',
  ok: '.xcConfirm a.sgBtn.ok',
  cancel: '.xcConfirm a.sgBtn.cancel',
} as const

export function isUnansweredConfirm(text: string): boolean {
  return /部分题目没有作答|未作答的题目/.test(text)
}

export function answerMatches(value: string, expected: string[]): boolean {
  const actual = value.split(',').map((s) => s.trim()).filter(Boolean).sort()
  const target = [...new Set(expected)].sort()
  return target.length > 0 && actual.length === target.length && actual.every((s, i) => s === target[i])
}

export function questionCompletionConfirmed(value: string, expected: string[], navActive: boolean): boolean {
  return navActive && answerMatches(value, expected)
}

export function isDoneByAnswer(value: string | null | undefined): boolean {
  return String(value ?? '').trim() !== ''
}

export function notdoDoesNotMeanUndone(): boolean {
  return true
}
