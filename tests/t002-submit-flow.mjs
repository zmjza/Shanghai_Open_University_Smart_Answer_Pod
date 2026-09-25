import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { build } from 'esbuild'
import { chromium } from 'patchright'

const html = mode => `<button id="submitHomeWork">提交作业</button>
  <div class="xcConfirm" style="display:none"><span id="message"></span>
    <a class="sgBtn ok">确定</a><a class="sgBtn cancel">取消</a></div>
  <script>
    window.__submitted = false; window.__cancelled = false; window.__step = 0;
    const dialog = document.querySelector('.xcConfirm');
    const message = document.querySelector('#message');
    document.querySelector('#submitHomeWork').onclick = () => {
      message.textContent = '${mode === 'incomplete' ? '部分题目没有作答，是否继续提交？' : '作业提交后将不可修改，您确定要提交作业吗？'}';
      dialog.style.display = 'block';
    };
    document.querySelector('.sgBtn.cancel').onclick = () => { dialog.style.display = 'none'; document.body.dataset.cancelled = 'yes'; window.__cancelled = true };
    document.querySelector('.sgBtn.ok').onclick = () => {
      dialog.style.display = 'none';
      if (++window.__step === 1) setTimeout(() => { message.textContent = '再次确认提交'; dialog.style.display = 'block' }, 200);
      else { window.__submitted = true; window.location.href = '/study/assignment-preview.aspx' }
    };
  </script>`
const server = createServer((req, res) => {
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
  res.end(req.url.includes('assignment-preview.aspx') ? '<main>已提交</main>' : html(req.url.includes('incomplete') ? 'incomplete' : 'normal'))
})
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
const built = await build({ entryPoints: ['electron/submit.ts'], bundle: true, platform: 'node', format: 'esm', write: false, plugins: [{
  name: 'local-history', setup(plugin) {
    plugin.onResolve({ filter: /detect$/ }, args => ({ path: args.path, namespace: 'local-detect' }))
    plugin.onLoad({ filter: /.*/, namespace: 'local-detect' }, () => ({ contents: 'export const readHistory=async()=>[]', loader: 'js' }))
  },
}] })
const submit = await import('data:text/javascript;base64,' + Buffer.from(built.outputFiles[0].text).toString('base64'))
const browser = await chromium.launch({ headless: true })
try {
  const page = await browser.newPage()
  const origin = 'http://127.0.0.1:' + server.address().port
  const opts = { page, local_id: 'student-1', slot: 'occupied', account: 'auto_answering', homeworkName: '测试作业' }
  await page.goto(origin + '/?incomplete')
  const blocked = await submit.submitHomework(opts)
  assert.deepEqual(blocked, { ok: false, incomplete: true })
  assert.equal(await page.locator('body').getAttribute('data-cancelled'), 'yes')
  assert.equal(new URL(page.url()).pathname, '/')
  await page.goto(origin + '/')
  const normal = await submit.submitHomework(opts)
  assert.deepEqual(normal, { ok: true })
  assert.equal(new URL(page.url()).pathname, '/study/assignment-preview.aspx')
  console.log('T002 真实提交确认与未作答警告取消路径通过')
} finally {
  await browser.close()
  server.close()
}
