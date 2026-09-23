import type { Page } from 'patchright'
import { deleteByHash, upsertQuestion } from './bank.ts'
import { contentHash, normalizeOption, normalizeStem, sameAnswerTexts, type QType } from './core/hash.ts'
import type { QResult } from './answer.ts'
import { SEL } from './core/selectors.ts'
import { readStableReviewedRows } from './core/review-read.ts'
import { canExtractReviewedQuestion, reviewCorrectness, reviewedTotalScore, reviewMutation, reviewUpsertRequiresRetry, uniqueCorruptedTextMatch } from './core/review-match.ts'
import type { ExtractStats } from './core/live-view.ts'

export type ReviewedQuestion = {
  hash: string
  qtype: QType | 'unknown'
  stem: string
  options: string[]
  selected: string[]
  answerTexts: string[]
  scoreText: string
  correct: boolean | null
}

type RawReviewedQuestion = Omit<ReviewedQuestion, 'hash' | 'correct'> & {
  hasRight: boolean
  hasWrong: boolean
}

export type ReviewOutcome = {
  reviewed: number
  matched: number
  graded: number
  inserted: number
  conflicts: number
  deleted: number
  wrong: number
  bankWrong: number
  aiWrong: number
  deleteFailed: number
  pendingCandidates: QResult[]
  pendingInsertHashes: string[]
  pendingDeleteHashes: string[]
  score: number | null
}

export async function readReviewedQuestions(page: Page): Promise<ReviewedQuestion[]> {
  const raw = await readStableReviewedRows(page, () => page.evaluate((optionSelector) => {
    return [...document.querySelectorAll('.e-q-body')].map((body): RawReviewedQuestion => {
      const q = body.querySelector('.e-q')
      const rawType = body.getAttribute('data-questiontype') || ''
      const qtype: QType | 'unknown' = rawType === '1' ? 'single' : rawType === '2' ? 'multiple' : rawType === '3' ? 'judge' : 'unknown'
      const options = [...body.querySelectorAll(optionSelector)]
        .map((li) => ((li as HTMLElement).innerText || li.textContent || '').replace(/\s+/g, ' ').trim())
      const selected = [...body.querySelectorAll(optionSelector + '.checked')]
        .map((li) => ((li as HTMLElement).innerText || li.textContent || '').replace(/\s+/g, ' ').trim())
      const answerTexts = [...body.querySelectorAll('.e-q .e-a-ans .e-ans-ref .e-a-g p.checked')]
        .map((p) => ((p as HTMLElement).innerText || p.textContent || '').replace(/\s+/g, ' ').trim())
      const scoreInput = q?.querySelector('input[name=GiveScore]') as HTMLInputElement | null
      return {
        qtype,
        stem: ((q?.querySelector('.e-q-q') as HTMLElement | null)?.innerText || q?.querySelector('.e-q-q')?.textContent || '').replace(/\s+/g, ' ').trim(),
        options,
        selected,
        answerTexts,
        scoreText: scoreInput?.value || scoreInput?.getAttribute('value') || '',
        hasRight: Boolean(q?.querySelector('.e-q-l .e-q-right')),
        hasWrong: Boolean(q?.querySelector('.e-q-l .e-q-wrong')),
      }
    })
  }, SEL.reviewedOptions))
  return raw.map(({ hasRight, hasWrong, ...q }) => {
    const qtype = q.qtype
    const normalizedOptions = qtype === 'unknown' ? q.options : q.options.map((x) => normalizeOption(x, qtype))
    const stem = normalizeStem(q.stem)
    return {
      ...q,
      stem,
      options: normalizedOptions,
      selected: qtype === 'unknown' ? q.selected : q.selected.map((x) => normalizeOption(x, qtype)),
      answerTexts: qtype === 'unknown' ? q.answerTexts : q.answerTexts.map((x) => normalizeOption(x, qtype)),
      correct: reviewCorrectness(hasRight, hasWrong),
      hash: qtype === 'unknown' ? '' : contentHash(qtype, stem, normalizedOptions),
    }
  })
}

export async function reviewResults(page: Page, results: QResult[], courseName: string): Promise<ReviewOutcome> {
  await page.locator('.e-q-body').first().waitFor({ timeout: 15000 })
  let reviewed: ReviewedQuestion[] = []
  let byHash = new Map<string, ReviewedQuestion>()
  const deadline = Date.now() + 8000
  do {
    reviewed = await readReviewedQuestions(page)
    byHash = new Map(reviewed.filter((q) => q.hash).map((q) => [q.hash, q]))
    const ready = results.filter((r) => r.hash && r.source !== '空过').every((result) => {
      const q = byHash.get(result.hash) || uniqueCorruptedTextMatch(result as QResult & { qtype: QType }, reviewed.filter((row): row is ReviewedQuestion & { qtype: QType } => row.qtype !== 'unknown'))
      return q && q.correct !== null && sameAnswerTexts(q.selected, result.selected, q.qtype === 'unknown' ? undefined : q.qtype)
    })
    if (ready) break
    await page.waitForTimeout(300)
  } while (Date.now() < deadline)
  const outcome: ReviewOutcome = {
    reviewed: reviewed.length,
    matched: 0,
    graded: 0,
    inserted: 0,
    conflicts: 0,
    deleted: 0,
    wrong: 0,
    bankWrong: 0,
    aiWrong: 0,
    deleteFailed: 0,
    pendingCandidates: [],
    pendingInsertHashes: [],
    pendingDeleteHashes: [],
    score: reviewedTotalScore(reviewed.map((question) => question.scoreText)),
  }
  for (const result of results) {
    if (!result.hash || result.qtype === 'unknown' || result.source === '空过') continue
    const q = byHash.get(result.hash) || uniqueCorruptedTextMatch(result as QResult & { qtype: QType }, reviewed.filter((row): row is ReviewedQuestion & { qtype: QType } => row.qtype !== 'unknown'))
    if (q) outcome.matched++
    if (q?.correct !== null && q?.correct !== undefined) outcome.graded++
    if (!q || q.correct === null || !sameAnswerTexts(q.selected, result.selected, result.qtype)) {
      outcome.pendingCandidates.push(result)
      continue
    }
    if (!q.correct) {
      outcome.wrong++
      if (result.source === '题库答题') outcome.bankWrong++
      if (result.source === 'AI 答题') outcome.aiWrong++
    }
    const mutation = reviewMutation(result.source, q.correct)
    if (mutation === 'upsert') {
      const answerTexts = q.answerTexts.length ? q.answerTexts : q.selected
      if (!answerTexts.length) {
        outcome.pendingCandidates.push(result)
        continue
      }
      const status = await upsertQuestion({
        qtype: result.qtype,
        stem: q.stem || result.stem,
        options: q.options.length ? q.options : result.options,
        answer_texts: answerTexts,
        course_name: courseName,
        source: result.source === 'AI 答题' ? 'ai_verified' : 'extract',
        verified: true,
      })
      if (reviewUpsertRequiresRetry(status)) {
        outcome.pendingCandidates.push(result)
        outcome.pendingInsertHashes.push(result.hash)
      } else {
        if (status === 'added') outcome.inserted++
        if (status === 'conflict') outcome.conflicts++
      }
      continue
    }
    if (mutation === 'delete') {
      if (await deleteByHash(result.hash, result.selected)) outcome.deleted++
      else {
        outcome.deleteFailed++
        outcome.pendingCandidates.push(result)
        outcome.pendingDeleteHashes.push(result.hash)
      }
    }
  }
  return outcome
}

export async function extractReviewedQuestions(
  page: Page,
  courseName: string,
  onProgress?: (stats: ExtractStats, current: number, total: number) => void,
  shouldStop: () => boolean = () => false,
) {
  const questions = await readReviewedQuestions(page)
  const stats: ExtractStats = { added: 0, merged: 0, skipped: 0, conflict: 0, failed: 0 }
  const failedCandidates: { qtype: QType; stem: string; options: string[]; answer_texts: string[] }[] = []
  let current = 0
  for (const q of questions) {
    if (shouldStop()) break
    current++
    const answerTexts = q.answerTexts.length ? q.answerTexts : q.selected
    if (!canExtractReviewedQuestion(q, answerTexts)) {
      stats.skipped++
      onProgress?.(stats, current, questions.length)
      continue
    }
    if (!q.hash) {
      stats.skipped++
      onProgress?.(stats, current, questions.length)
      continue
    }
    const status = await upsertQuestion({
      qtype: q.qtype,
      stem: q.stem,
      options: q.options,
      answer_texts: answerTexts,
      course_name: courseName,
      source: 'extract',
      verified: true,
    })
    if (status === 'added') stats.added++
    else if (status === 'merged') stats.merged++
    else if (status === 'conflict') stats.conflict++
    else {
      stats.failed++
      failedCandidates.push({ qtype: q.qtype, stem: q.stem, options: q.options, answer_texts: answerTexts })
    }
    onProgress?.(stats, current, questions.length)
  }
  return { questions: questions.length, failedCandidates, ...stats }
}
