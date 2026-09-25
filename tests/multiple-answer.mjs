import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { build } from 'esbuild'
import { chromium } from 'patchright'

const bundle = await build({ entryPoints: ['electron/answer.ts'], bundle: true, platform: 'node', format: 'esm', write: false, plugins: [{
  name: 'offline-dependencies',
  setup(plugin) {
    plugin.onResolve({ filter: /^\.\/(bank|ai)$/ }, (args) => ({ path: args.path, namespace: 'offline' }))
    plugin.onLoad({ filter: /.*/, namespace: 'offline' }, (args) => ({ contents: args.path === './bank'
      ? 'export const lookupByHash = async () => null'
      : 'export const askAi = async () => null; export const retryAsked = () => {}', loader: 'js' }))
  },
}] })
const { clickByTexts } = await import('data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].text).toString('base64'))
let saved = ''
let inFlight = 0
let maxInFlight = 0
let failNext = false
let hangNext = false
const server = createServer((req, res) => {
  if (req.method === 'POST') {
    inFlight++
    maxInFlight = Math.max(maxInFlight, inFlight)
    let body = ''
    req.on('data', (chunk) => { body += chunk })
    req.on('end', () => {
      if (hangNext) { hangNext = false; setTimeout(() => { res.writeHead(200); res.end('{}') }, 9500); return }
      setTimeout(() => {
      const failed = failNext
      failNext = false
      if (!failed) saved = new URLSearchParams(body).get('answer') || ''
      inFlight--
      res.writeHead(failed ? 500 : 200, { 'content-type': 'application/json' })
      res.end('{"ok":true}')
      }, 250)
    })
    return
  }
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
  res.end('<div class="e-q-body" data-num="1" data-questiontype="2"><form><input name="answer"></form><ul><li class="e-a" data-index="0">A) 甲</li><li class="e-a" data-index="1">B) 乙</li><li class="e-a" data-index="2">C) 丙</li></ul></div><div class="e-selects-g"><a class="e-item" data-num="1"></a></div><script>document.querySelectorAll("li.e-a").forEach(li => li.addEventListener("click", async () => { li.classList.toggle("checked"); const answer = [...document.querySelectorAll("li.checked")].map(x => x.dataset.index).join(","); document.querySelector("[name=answer]").value = answer; const response = await fetch("/study/ajax-assignment-online_homework_answer", { method: "POST", body: new URLSearchParams({answer}) }); if (response.ok) document.querySelector(".e-item").classList.toggle("active", !!answer); else document.querySelectorAll("li.checked").forEach(x => x.classList.remove("checked")); }));</script>')
})
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
const browser = await chromium.launch({ headless: true })
try {
  const page = await browser.newPage()
  await page.goto('http://127.0.0.1:' + server.address().port)
  assert.deepEqual(await page.locator('li.e-a').allInnerTexts(), ['A) 甲', 'B) 乙', 'C) 丙'])
  assert.equal(await clickByTexts(page, '1', 'multiple', ['甲', '丙']), true)
  assert.equal(saved, '0,2', 'return only after the final answer is saved')
  assert.equal(maxInFlight, 1, 'do not overlap saves for one question')
  await page.reload()
  saved = ''
  maxInFlight = 0
  failNext = true
  assert.equal(await clickByTexts(page, '1', 'multiple', ['甲', '丙']), true, 'retry after a failed first save')
  assert.equal(saved, '0,2')
  assert.equal(maxInFlight, 1)
  await page.reload()
  saved = ''
  maxInFlight = 0
  const initialSave = page.waitForResponse((response) => response.url().includes('/study/ajax-assignment-online_homework_answer'))
  await page.locator('li.e-a[data-index="1"]').evaluate((li) => li.click())
  await initialSave
  assert.equal(saved, '1')
  assert.equal(await clickByTexts(page, '1', 'multiple', ['甲', '丙']), true, 'replace a previously selected wrong option')
  assert.equal(saved, '0,2')
  assert.equal(maxInFlight, 1)
  assert.deepEqual(await page.locator('li.e-a.checked').evaluateAll((items) => items.map((li) => li.getAttribute('data-index'))), ['0', '2'])
  await page.reload()
  saved = ''
  await page.locator('[name=answer]').evaluate((input) => { input.value = '0,2' })
  await page.locator('li.e-a[data-index="0"]').evaluate((li) => li.classList.add('checked'))
  await page.locator('.e-item').evaluate((item) => item.classList.add('active'))
  assert.equal(await clickByTexts(page, '1', 'multiple', ['甲', '丙']), true, 'repair a stale checked state')
  assert.deepEqual(await page.locator('li.e-a.checked').evaluateAll((items) => items.map((li) => li.getAttribute('data-index'))), ['0', '2'])
  await page.reload()
  saved = ''
  hangNext = true
  await assert.rejects(clickByTexts(page, '1', 'multiple', ['甲', '丙']), /多选保存请求超时/)
  assert.equal(saved, '', '结果未知时不能视为保存成功')
} finally {
  await browser.close()
  server.close()
}
