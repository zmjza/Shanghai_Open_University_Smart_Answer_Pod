import { sameAnswerTexts, type QType } from './hash.ts'

export async function removeRejectedAnswer(
  rejected: string[],
  read: () => Promise<{ answer_texts: string[]; qtype: QType } | null>,
  remove: (observed: string[]) => Promise<boolean>,
): Promise<boolean> {
  try {
    const current = await read()
    if (!current || !sameAnswerTexts(current.answer_texts, rejected, current.qtype)) return true
    if (!await remove(current.answer_texts)) return false
    const after = await read()
    return !after || !sameAnswerTexts(after.answer_texts, rejected, after.qtype)
  } catch { return false }
}
