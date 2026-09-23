import { hasReadableQuestionText, normalizeOption, normalizeStem, sameAnswerTexts, type QType } from './hash.ts'

export function canExtractReviewedQuestion(
  question: { qtype: QType | 'unknown'; stem: string; options: string[]; correct: boolean | null },
  answerTexts: string[],
): question is { qtype: QType; stem: string; options: string[]; correct: true } {
  return question.qtype !== 'unknown' && question.correct === true &&
    hasReadableQuestionText(question.stem, question.options) &&
    hasReadableQuestionText(question.stem, answerTexts)
}

type MatchableQuestion = {
  qtype: QType
  stem: string
  options: string[]
  selected: string[]
}

export function reviewCorrectness(hasRight: boolean, hasWrong: boolean): boolean | null {
  if (hasWrong) return false
  return hasRight ? true : null
}

export function reviewedTotalScore(values: string[]): number | null {
  if (!values.length) return null
  const scores = values.map((value) => {
    const numeric = value.replace(/[^0-9.-]/g, '')
    return numeric ? Number(numeric) : Number.NaN
  })
  if (scores.some((score) => !Number.isFinite(score))) return null
  return Math.round(scores.reduce((total, score) => total + score, 0) * 100) / 100
}

export function reviewMutation(
  source: '题库答题' | 'AI 答题' | '空过',
  correct: boolean,
): 'upsert' | 'delete' | 'none' {
  if (source === 'AI 答题' && correct) return 'upsert'
  if (source === '题库答题' && !correct) return 'delete'
  return 'none'
}

export function reviewUpsertRequiresRetry(status: 'added' | 'merged' | 'conflict' | 'failed'): boolean {
  return status === 'failed'
}

function stemFragmentsMatch(damaged: string, clean: string): boolean {
  const replacement = String.fromCodePoint(0xfffd)
  if (!damaged.includes(replacement) || clean.includes(replacement)) return false
  const source = normalizeStem(damaged)
  const target = normalizeStem(clean)
  const fragments = source.split(/�+/).filter(Boolean)
  if (!fragments.length) return false
  if (!source.startsWith(replacement) && !target.startsWith(fragments[0])) return false
  if (!source.endsWith(replacement) && !target.endsWith(fragments.at(-1)!)) return false
  let offset = 0
  for (const fragment of fragments) {
    const index = target.indexOf(fragment, offset)
    if (index < 0) return false
    offset = index + fragment.length
  }
  return true
}

function corruptedStemMatch(left: string, right: string): boolean {
  const replacement = String.fromCodePoint(0xfffd)
  if (left.includes(replacement)) return stemFragmentsMatch(left, right)
  if (right.includes(replacement)) return stemFragmentsMatch(right, left)
  return false
}

export function uniqueCorruptedTextMatch<T extends MatchableQuestion>(
  candidate: MatchableQuestion,
  reviewed: T[],
): T | null {
  const replacement = String.fromCodePoint(0xfffd)
  if (!candidate.stem.includes(replacement) && !reviewed.some((row) => row.stem.includes(replacement))) return null
  const optionSet = [...new Set(candidate.options.map((text) => normalizeOption(text, candidate.qtype)))].sort()
  const matches = reviewed.filter((row) => {
    if (row.qtype !== candidate.qtype || !corruptedStemMatch(candidate.stem, row.stem)) return false
    const rowOptions = [...new Set(row.options.map((text) => normalizeOption(text, row.qtype)))].sort()
    return optionSet.length === rowOptions.length && optionSet.every((text, index) => text === rowOptions[index]) &&
      sameAnswerTexts(candidate.selected, row.selected, candidate.qtype)
  })
  return matches.length === 1 ? matches[0] : null
}
