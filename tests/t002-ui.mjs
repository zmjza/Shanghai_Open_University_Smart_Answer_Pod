import assert from "node:assert/strict"
import { mkdtempSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { _electron as electron } from "patchright"

const userData = mkdtempSync(join(tmpdir(), "kaida-t002-"))
const app = await electron.launch({ args: ["."], env: { ...process.env, VITE_DEV_SERVER_URL: "", KAIDA_E2E_USERDATA: userData } })
const call = (script) => app.evaluate(({ BrowserWindow }, code) => BrowserWindow.getAllWindows()[0].webContents.executeJavaScript(code), script)
try {
  const page = await app.firstWindow()
  await page.waitForLoadState("domcontentloaded")
  for (const [name, username] of [["模拟甲", "fake-t002-1"], ["模拟乙", "fake-t002-2"]]) {
    assert.equal((await call(`window.kaida.addAccount(${JSON.stringify({ name, username, password: "fake-pass" })})`)).ok, true)
  }
  const accounts = await call("window.kaida.listAccounts()")
  assert.equal(accounts.length, 2)
  const id = accounts[0].local_id
  assert.equal((await call(`window.kaida.setWorkMode(${JSON.stringify(id)}, "extract")`)).ok, true)
  assert.equal((await call(`window.kaida.setCourseScope(${JSON.stringify(id)}, "selected")`)).ok, true)
  assert.equal((await call(`window.kaida.setAnswerRoundLimit(${JSON.stringify(id)}, 3)`)).ok, true)
  const applied = await call(`window.kaida.applyStudentSettingsToAll(${JSON.stringify(id)})`)
  assert.deepEqual({ ok: applied.ok, updated: applied.updated }, { ok: true, updated: 2 })
  const students = (await call("window.kaida.snapshot()")).students
  assert.equal(students.length, 2)
  for (const student of students) {
    assert.equal(student.workMode, "extract")
    assert.equal(student.courseScope, "selected")
    assert.equal(student.answerRoundLimit, 3)
    assert.equal(student.displayMode, students[0].displayMode)
    assert.deepEqual(student.selectedCourseNames, [])
  }
  assert.equal(await page.locator("#tool-start").isEnabled(), true)
  assert.equal(await page.getByRole("button", { name: "将配置设置到全部" }).count(), 1)
  await page.getByText("学生账号", { exact: true }).first().click()
  await page.getByRole("button", { name: "全部删除" }).click()
  await page.getByRole("heading", { name: "确认全部删除 2 名学生？" }).waitFor()
  await page.getByRole("button", { name: "取消", exact: true }).click()
  assert.equal((await call("window.kaida.listAccounts()")).length, 2)
  await page.getByRole("button", { name: "全部删除" }).click()
  await page.getByRole("button", { name: "确认全部删除" }).click()
  await page.getByRole("dialog", { name: "确认全部删除学生账号" }).waitFor({ state: "hidden" })
  const deleted = await call("Promise.all([window.kaida.listAccounts(), window.kaida.snapshot()]).then(([rows, snap]) => [rows.length, snap.students.length])")
  assert.deepEqual(deleted, [0, 0])
  console.log("T002 配置批量同步与全部删除 UI 测试通过")
} finally {
  await app.close()
}
