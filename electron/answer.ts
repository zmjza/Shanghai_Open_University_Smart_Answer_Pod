import type { Page } from 'patchright'
import { SEL } from './core/selectors'
import { contentHash, normalizeOption, normalizeStem, qtypeFromPage, hasReadableQuestionText, type QType } from './core/hash'
import { lookupByHash } from './bank'
import { askAi, retryAsked, type AiAttempt } from './ai'
import { aiAllFailedAction } from './core/ai-parse'
import { answerRepairExhaustedAction, bankAnswerDelayMs, MAX_ANSWER_REPAIR_ATTEMPTS } from './core/homework'
import { buildAnswerPlan, incompleteQuestionNos, readAnswer, waitAnswer, waitQuestionComplete, verifyAnswerSheet } from './page-tools'
import { emitProgress } from './progress'
import { appendFileSync } from 'node:fs'
import type { AccountState, SlotState } from './core/states'
import { readStableAnswerRows } from './core/review-read.ts'
import { withTimeout } from './core/timeout.ts'

export type QResult = {
  no: string
  hash: string
  source: '题库答题' | 'AI 答题' | '空过'
  qtype: QType | 'unknown'
  stem: string
  options: string[]
  selected: string[]
}

function aiAttemptAction(prefix: string, questionNo: number | string, total: number, attempt: AiAttempt): string {
  if (attempt.status === 'requesting') return `${prefix}第 ${questionNo}/${total} 题 · AI ${attempt.index}/${attempt.total} 请求中`
  const reason = attempt.reason === 'timeout' ? '超时'
    : attempt.reason === 'network' ? '网络失败'
      : attempt.reason === 'http' ? `接口 ${attempt.httpStatus || '失败'}`
        : attempt.reason === 'invalid_json' ? '格式错误'
          : attempt.reason === 'option_mismatch' ? '答案正文不匹配'
            : '答案数量不符'
  return `${prefix}第 ${questionNo}/${total} 题 · AI ${attempt.index}/${attempt.total} ${reason}`
}

async function clickByTexts(page: Page, dataNum: string, qtype: QType, texts: string[]): Promise<boolean> {
  const body = page.locator('.e-q-body[data-num="' + dataNum + '"]')
  const lis = body.locator('li.e-a')
  const n = await lis.count()
  const want = new Set(texts.map((t) => normalizeOption(t, qtype)))
  const entries: { index: string; text: string }[] = []
  for (let i = 0; i < n; i++) {
    const li = lis.nth(i)
    entries.push({ index: (await li.getAttribute('data-index')) || '', text: normalizeOption(await li.innerText(), qtype) })
  }
  const targets = entries.filter((entry) => want.has(entry.text))
  if (!want.size || targets.length !== want.size || targets.some((entry) => !entry.index) ||
      (qtype !== 'multiple' && targets.length !== 1)) return false
  if (qtype === 'multiple') {
    const current = new Set((await readAnswer(page, dataNum)).split(',').filter(Boolean))
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i]
      if (current.has(entry.index) === want.has(entry.text)) continue
      await waitNoClick(page, dataNum)
      await lis.nth(i).click({ timeout: 8000 })
      if (want.has(entry.text)) current.add(entry.index)
      else current.delete(entry.index)
      if (current.size && !await waitAnswer(page, dataNum, 8000, [...current])) {
        throw new Error('多选答案尚未完整写入，停止当前作业')
      }
    }
    if (!await waitQuestionComplete(page, dataNum, targets.map((entry) => entry.index), 8000)) {
      throw new Error('多选答案与目标不一致，停止当前作业')
    }
    return true
  }
  const clicked: string[] = []
  for (let i = 0; i < n; i++) {
    const li = lis.nth(i)
    const raw = ((await li.innerText()) || '').trim()
    const text = normalizeOption(raw, qtype)
    if (!want.has(text)) continue
    const idx = (await li.getAttribute('data-index')) || ''
    await waitNoClick(page, dataNum)
    await withTimeout(page.evaluate(({ dataNum, idx }) => {
      const b = document.querySelector('.e-q-body[data-num="' + dataNum + '"]')
      const el = b && b.querySelector('li.e-a[data-index="' + idx + '"]')
      if (el) (el as HTMLElement).click()
    }, { dataNum, idx }), 8000)
    clicked.push(idx)
    break
  }
  if (!clicked.length) return false
    const val = await waitQuestionComplete(page, dataNum, clicked, 8000)
    const ok = val.trim() !== ''
    try {
      appendFileSync('/tmp/kaida-answer-cdp.jsonl', JSON.stringify({ t: Date.now(), dataNum, qtype, ok, n: val.length }) + '\n')
    } catch { /* ignore */ }
    if (!ok) throw new Error('答案尚未正确写入，停止当前作业')
    return true
}

async function waitNoClick(page: Page, dataNum: string) {
  const start = Date.now()
  while (Date.now() - start < 8000) {
    const blocked = await page.evaluate((num) => {
      const b = document.querySelector('.e-q-body[data-num="' + num + '"]')
      return !!b?.querySelector('li.e-a.no-click')
    }, dataNum)
    if (!blocked) return
    await page.waitForTimeout(120)
  }
  throw new Error('题目仍在保存中，等待超时，停止当前作业')
}

export async function answerPage(opts: {
  page: Page
  local_id: string
  slot: SlotState
  account: AccountState
  courseName: string
  homeworkName: string
  onQuestion?: (result: QResult, total: number, bank: number, ai: number) => void
}): Promise<{ results: QResult[]; bankCount: number; aiCount: number }> {
  const { page, local_id, slot, account, courseName, homeworkName } = opts
  try {
    await page.locator(SEL.questionBody).first().waitFor({ timeout: 20000 })
  } catch {
    emitProgress({
      local_id, slot, account, action: '作答页无题目', courseName, homeworkName, homework: 'answering',
      bankCount: 0, aiCount: 0,
    })
    throw new Error('作答页无题目，禁止提交')
  }
  await readStableAnswerRows(page, async () => page.locator(SEL.questionBody).evaluateAll((bodies) => bodies.map((body) => ({
    stem: body.querySelector('.e-q-q')?.textContent || '',
    options: [...body.querySelectorAll('li.e-a')].map((li) => li.textContent || ''),
  }))))
  const bodies = page.locator(SEL.questionBody)
  const total = await bodies.count()
  const results: QResult[] = []
  let bankCount = 0
  let aiCount = 0
  for (let i = 0; i < total; i++) {
    const body = bodies.nth(i)
    const dataNum = (await body.getAttribute('data-num')) || String(i + 1)
    const typeRaw = (await body.getAttribute('data-questiontype')) || ''
    const qtype = qtypeFromPage(typeRaw)
    const stemRaw = ((await body.locator('.e-q-q').first().innerText({ timeout: 2000 }).catch(() => '')) ||
      (await body.innerText())).trim()
    const lis = body.locator('li.e-a')
    const oc = await lis.count()
    const options: { text: string; index: string }[] = []
    for (let k = 0; k < oc; k++) {
      const li = lis.nth(k)
      options.push({
        text: normalizeOption((await li.innerText({ timeout: 3000 }).catch(() => '')) || '', qtype === 'unknown' ? undefined : qtype),
        index: (await li.getAttribute('data-index')) || String(k),
      })
    }
    const stem = normalizeStem(stemRaw)
    if (qtype === 'unknown') {
      results.push({ no: dataNum, hash: '', source: '空过', qtype, stem, options: options.map((o) => o.text), selected: [] })
      opts.onQuestion?.(results[results.length - 1], total, bankCount, aiCount)
      emitProgress({
        local_id, slot, account, action: '未知题型空过', courseName, homeworkName, homework: 'answering',
        questionNo: i + 1, questionTotal: total, source: '空过', bankCount, aiCount,
      })
      continue
    }
    if (!hasReadableQuestionText(stem, options.map((o) => o.text))) {
      emitProgress({ local_id, slot, account, courseName, homeworkName, homework: 'answering',
        action: '题干或选项缺失/损坏，停止当前作业', questionNo: i + 1, questionTotal: total, bankCount, aiCount })
      throw new Error('题干或选项缺失/损坏，禁止猜测作答')
    }
    const hash = contentHash(qtype, stem, options.map((o) => o.text))
    emitProgress({
      local_id, slot, account, action: '读取题目', courseName, homeworkName, homework: 'answering',
      questionNo: i + 1, questionTotal: total, bankCount, aiCount,
    })
    const hit = await lookupByHash(hash)
    if (hit && hit.answer_texts?.length) {
      const ok = await clickByTexts(page, dataNum, qtype, hit.answer_texts)
      if (ok) {
        bankCount++
        results.push({ no: dataNum, hash, source: '题库答题', qtype, stem, options: options.map((o) => o.text), selected: hit.answer_texts })
        opts.onQuestion?.(results[results.length - 1], total, bankCount, aiCount)
        emitProgress({
          local_id, slot, account, action: '题库命中回填', courseName, homeworkName, homework: 'answering',
          questionNo: i + 1, questionTotal: total, source: '题库答题', bankCount, aiCount, click: 'li.e-a',
        })
        await page.waitForTimeout(bankAnswerDelayMs())
        continue
      }
    }
    const ai = await askAi({
      hash, qtype, stem, options: options.map((o) => o.text),
      onAttempt: (attempt) => emitProgress({
        local_id, slot, account, action: aiAttemptAction('', i + 1, total, attempt), courseName, homeworkName,
        homework: 'answering', questionNo: i + 1, questionTotal: total, bankCount, aiCount, aiModel: attempt.model,
      }),
    })
    if (ai.texts) {
      const ok = await clickByTexts(page, dataNum, qtype, ai.texts)
      if (ok) {
        aiCount++
        results.push({ no: dataNum, hash, source: 'AI 答题', qtype, stem, options: options.map((o) => o.text), selected: ai.texts })
        opts.onQuestion?.(results[results.length - 1], total, bankCount, aiCount)
        emitProgress({
          local_id, slot, account, action: 'AI 回填', courseName, homeworkName, homework: 'answering',
          questionNo: i + 1, questionTotal: total, source: 'AI 答题', aiModel: ai.model, bankCount, aiCount, click: 'li.e-a',
        })
        continue
      }
      emitProgress({
        local_id, slot, account, action: 'AI 点选未写入', courseName, homeworkName, homework: 'answering',
        questionNo: i + 1, questionTotal: total, source: '空过', bankCount, aiCount, click: 'li.e-a',
      })
    }
    const allFailed = !ai.texts ? aiAllFailedAction(i + 1, total, ai.attempts) : 'AI 点选未写入'
    results.push({ no: dataNum, hash, source: '空过', qtype, stem, options: options.map((o) => o.text), selected: [] })
    opts.onQuestion?.(results[results.length - 1], total, bankCount, aiCount)
      emitProgress({
        local_id, slot, account, action: allFailed, courseName, homeworkName, homework: 'answering',
        questionNo: i + 1, questionTotal: total, source: '空过', bankCount, aiCount,
      })
  }
  let plan = await buildAnswerPlan(page, results)
  const repairFailures = new Map<string, string>()
  for (let repair = 1; repair <= MAX_ANSWER_REPAIR_ATTEMPTS; repair++) {
    const missing = await incompleteQuestionNos(page, plan.map((question) => question.no))
    if (!missing.length) break
    emitProgress({ local_id, slot, account, courseName, homeworkName, homework: 'answering',
      action: `提交前发现未作答 ${missing.length} 题 · 补答第 ${repair}/${MAX_ANSWER_REPAIR_ATTEMPTS} 轮`, bankCount, aiCount })
    for (const result of results.filter((item) => missing.includes(item.no))) {
      if (result.qtype === 'unknown') continue
      const qtype = result.qtype
      emitProgress({ local_id, slot, account, courseName, homeworkName, homework: 'answering',
        action: `补答第 ${result.no}/${total} 题`, questionNo: Number(result.no) || undefined, questionTotal: total, bankCount, aiCount })
      let texts = result.selected
      let source = result.source
      if (!texts.length) {
        const hit = await lookupByHash(result.hash)
        if (hit?.answer_texts?.length && await clickByTexts(page, result.no, qtype, hit.answer_texts)) {
          texts = hit.answer_texts
          source = '题库答题'
          bankCount++
        } else {
          retryAsked(result.hash)
          const ai = await askAi({
            hash: result.hash, qtype, stem: result.stem, options: result.options,
            onAttempt: (attempt) => emitProgress({
              local_id, slot, account, action: aiAttemptAction('补答 · ', result.no, total, attempt), courseName, homeworkName,
              homework: 'answering', questionNo: Number(result.no) || undefined, questionTotal: total, bankCount, aiCount, aiModel: attempt.model,
            }),
          })
          if (ai.texts && await clickByTexts(page, result.no, qtype, ai.texts)) {
            texts = ai.texts
            source = 'AI 答题'
            aiCount++
            repairFailures.delete(result.no)
          } else if (!ai.texts) {
            const failed = aiAllFailedAction(result.no, total, ai.attempts)
            repairFailures.set(result.no, failed)
            emitProgress({ local_id, slot, account, courseName, homeworkName, homework: 'answering',
              action: `补答第 ${repair}/${MAX_ANSWER_REPAIR_ATTEMPTS} 轮 · ${failed}`,
              questionNo: Number(result.no) || undefined, questionTotal: total, bankCount, aiCount })
          }
        }
      } else {
        await clickByTexts(page, result.no, qtype, texts)
      }
      if (source === '题库答题') await page.waitForTimeout(bankAnswerDelayMs())
      result.selected = texts
      result.source = source
      opts.onQuestion?.(result, total, bankCount, aiCount)
    }
    await page.waitForTimeout(400)
    plan = await buildAnswerPlan(page, results)
  }
  const remaining = await incompleteQuestionNos(page, plan.map((question) => question.no))
  if (remaining.length) {
    const action = answerRepairExhaustedAction(remaining, remaining.map((no) => repairFailures.get(no) || ''))
    emitProgress({ local_id, slot, account, courseName, homeworkName, homework: 'answering',
      action, bankCount, aiCount })
    throw new Error(action)
  }
  await verifyAnswerSheet(page, plan)
  emitProgress({ local_id, slot, account, courseName, homeworkName, homework: 'answering',
    action: '整卷复核通过 · ' + results.length + ' 题，明确空过 ' + results.filter((r) => r.source === '空过').length + ' 题', bankCount, aiCount })
  return { results, bankCount, aiCount }
}
