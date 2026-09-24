export function normalizeGoalText(text) {
  return text.replaceAll("\\_", "_").replace(/\\+\r?\n/g, "\n")
}

export function parseGoalAccounts(text) {
  const normalized = normalizeGoalText(text)
  const rows = [...normalized.matchAll(/账号：([^\s\\]+)\s+(?:密码：)?([^\s\\]+)/g)]
  const unique = new Map()
  for (const match of rows) unique.set(match[1], { username: match[1], password: match[2] })
  return [...unique.values()].map((row, index) => ({ name: "测试学生" + (index + 1), ...row }))
}
