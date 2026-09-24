# 通用避坑

## 回填说明

暂无历史坑。

原因：本项目在建立知识库时为空目录；无 git 仓库、无提交、无业务功能、无测试/部署记录、无开发文档；当前对话没有已验证的技术坑。禁止编造条目。后续新坑按 README 格式追加到本文件，或在出现明确模块后再拆文件并更新索引。

## 作业页没有原生 radio/checkbox

- 现象：用 `input[type=radio]` / `checkbox` 统计或勾选，结果是 0，点了也不保存。
- 根因：选项是自定义 `li.e-a`，点击后由 `previewnew.js` 写 `[name=answer]` 再 POST。
- 正确做法：点 `li.e-a[data-index]`，以该题 `form [name=answer]` 是否变成期望值判断成功。
- 验证方式：`document.querySelectorAll('input[type=radio]').length === 0`，且点击后 answer 有值。
- 禁止事项：不要自己改 class 冒充已选；不要编造接口字段。
- 相关文件或命令：`开大自动答题页面结构.md`；`/study/js/assignment/previewnew.js`
- 适用范围：`assignment/preview.aspx` 在线作业作答页
- 来源：验证

## 右侧题号提亮看 active 不是 notdo

- 现象：选中选项后右边题号变青底白字（截图里 1、2 同时亮），用 `.notdo` 统计已做永远是 0。
- 根因：60 个格子作答后仍带 `notdo`。保存成功后 `isDoWork()` 只加 `active`，背景 `#099` / `rgb(0,153,153)`。顶部 Tab 的 `active` 是当前题型，题号 `active` 才是已做。批改态 `.right` 本作答页没有。
- 正确做法：用户可见已做 = `a.e-item.active`。真正保存成功仍以该题 `[name=answer].value` 非空为准。
- 验证方式：已答 1、2 题后，`document.querySelectorAll('.e-selects-g a.e-item.active').length === 2`，且 `.notdo` 仍是 60。
- 禁止事项：不要用 `notdo` 计数；不要把题号 `active` 当成当前题；不要找 `.right` 当已做。
- 相关文件或命令：`开大自动答题页面结构.md` 第 5.3.1 节；`previewnew.js` 的 `isDoWork`
- 适用范围：作业作答页右侧答题卡
- 来源：验证

## 只读 Playwright evaluate 会读丢 answer.value

- 现象：页面上 1、2 已勾选且右侧已提亮，但 Playwright evaluate 读 `input[name=answer].value` 是空。
- 根因：只读 evaluate 看不到 jQuery `.val()` 写进去的真实 value。CDP `Runtime.evaluate` 读到的是 `"0"`。
- 正确做法：读答案用页面真实 DOM / CDP，不要只信只读 Playwright evaluate。
- 验证方式：同一页 Playwright 读空、CDP 读 `"0"`。
- 禁止事项：不要据此认定「有勾但没保存」。
- 相关文件或命令：`开大自动答题页面结构.md` 第 12.1 节
- 适用范围：本作业页自动化采集
- 来源：验证

## 判断题 A/B 与 data-index 反转

- 现象：按 A=0、B=1 去点，提交的对错与界面相反。
- 根因：判断题 `A) 正确` 的 `data-index="1"`，`B) 错误` 的 `data-index="0"`。
- 正确做法：点选和读答案都用 `li[data-index]`，不要用字母序号推 index。
- 验证方式：读 `.e-q-body[data-questiontype="3"] li.e-a` 的文本与 `data-index`。
- 禁止事项：不要把单选的 0=A 套到判断题。
- 相关文件或命令：`开大自动答题页面结构.md`
- 适用范围：判断题 `data-questiontype=3`
- 来源：验证

## li.checked 不能当已做

- 现象：第 1 题 A 带着 `checked` 勾，但题仍算未做。
- 根因：`checked` 只是 UI；权威答案在 `input[name=answer]`。样本页第 1 题 A 存在假阳性。
- 正确做法：已做 = 该题 `[name=answer]` 非空。`checked` 只作对照。
- 验证方式：对比第 1 题 `li.e-a.checked` 与空的 `[name=answer]`。
- 禁止事项：不要用 `aria-checked` 或题号 `active` 单独判断已做。
- 相关文件或命令：`开大自动答题页面结构.md`
- 适用范围：本作业作答页选项与答题卡
- 来源：验证
- 备注：本轮 CDP 复核时第 1、2 题 `answer` 已是 `"0"`。首屏「有勾但 answer 为空」无法回看，**信息不全，待人工补充**。多选题仍会在 POST 前就加 `checked`。

## 提交确认绿按钮是取消

- 现象：点提交作业后弹出「作业提交后将不可修改，您确定要提交作业吗？」；绿按钮看起来像确定。
- 根因：自定义 `xcConfirm`。`a.sgBtn.ok` 确定是深蓝 `#36367a`；`a.sgBtn.cancel` 取消是绿 `#5d9417`。不是浏览器原生 confirm。
- 正确做法：点 `.xcConfirm a.sgBtn.ok`。点绿按钮或 × 会中止。
- 验证方式：看弹窗里两个按钮的 class 与颜色。
- 禁止事项：不要按颜色猜；不要用 Playwright native dialog 去接这个框。
- 相关文件或命令：`开大自动答题页面结构.md` 第 13.2.1 节
- 适用范围：作业作答页提交
- 来源：验证

## 多选题必须多选

- 现象：多选题只点一个选项，或点完一个其它勾被清掉。
- 根因：type=2 用 `toggleClass`，不清兄弟；answer 是逗号串。role 仍是 radio，不能当单选。
- 正确做法：对每个目标 `data-index` 点一次，检查 `answer` 含全部 index。
- 验证方式：连续点两个选项后该题应有两个 `checked`，answer 形如 `"0,2"`。
- 禁止事项：不要套单选清兄弟；不要只点一项就算做完。
- 相关文件或命令：`开大自动答题页面结构.md` 第 10 节
- 适用范围：多项选择题 type=2
- 来源：验证

## Vue 响应式数组不能直接传 Electron IPC

- 现象：点击“确认全部删除”后按钮保持禁用，账号没有删除，对话框不关闭。
- 根因：将 Vue 的响应式数组直接交给 `ipcRenderer.invoke`，结构化克隆失败。
- 正确做法：在界面边界传普通数组副本，例如 `[...deleteAllIds.value]`，并以主进程确认结果为准。
- 验证方式：隔离数据目录的 `tests/t002-ui.mjs` 先取消删除再确认，确认后账号与工作台快照均清空。
- 禁止事项：不要把响应式 Proxy 直接传给 Electron IPC，也不要只靠按钮被点击就认定删除成功。
- 相关文件或命令：`src/views/AccountsView.vue`、`node tests/t002-ui.mjs`。
- 适用范围：Vue 界面向 Electron 主进程传数组或对象的入口。
- 来源：T002 界面回归测试复现及修复验证。
