/** Excel 三列：姓名、账号、密码。跳过表头。 */
export type AccountRow = { name: string; username: string; password: string }
export type AccountParseError = { line: number; text: string; reason: string }
export type PastedAccountParse = { rows: AccountRow[]; errors: AccountParseError[]; skippedHeaders: number }

export function isHeaderRow(cells: string[]): boolean {
  const j = cells.map((c) => c.replace(/\s+/g, '')).join('')
  return /姓名/.test(j) && /账号|学号|用户名/.test(j)
}

export function rowsFromMatrix(matrix: string[][]): AccountRow[] {
  const out: AccountRow[] = []
  for (let i = 0; i < matrix.length; i++) {
    const row = matrix[i].map((c) => String(c ?? '').trim())
    if (i === 0 && isHeaderRow(row)) continue
    const name = row[0] || ''
    const username = row[1] || ''
    const password = row[2] || ''
    if (!username || !password) continue
    out.push({ name: name || username, username, password })
  }
  return out
}

export function parseCsv(text: string): AccountRow[] {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((l) => l.trim())
  const matrix = lines.map((line) => {
    const cells: string[] = []
    let cur = ''
    let q = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        q = !q
        continue
      }
      if ((ch === ',' || ch === '\t') && !q) {
        cells.push(cur)
        cur = ''
        continue
      }
      cur += ch
    }
    cells.push(cur)
    return cells
  })
  return rowsFromMatrix(matrix)
}

function cellsFromPastedLine(line: string): string[] {
  const trimmed = line.trim()
  const delimiter = trimmed.includes('\t') ? '\t' : trimmed.includes(',') ? ',' : trimmed.includes('，') ? '，' : ''
  if (delimiter) {
    const cells: string[] = []
    let cell = ''
    let quoted = false
    for (let i = 0; i < trimmed.length; i++) {
      const ch = trimmed[i]
      if (ch === '"') {
        if (quoted && trimmed[i + 1] === '"') { cell += '"'; i++ }
        else quoted = !quoted
      } else if (ch === delimiter && !quoted) {
        cells.push(cell.trim())
        cell = ''
      } else cell += ch
    }
    cells.push(cell.trim())
    return cells
  }
  return trimmed.split(/\s+/).map((cell) => cell.trim()).filter(Boolean)
}

export function parsePastedAccounts(text: string): PastedAccountParse {
  const rows: AccountRow[] = []
  const errors: AccountParseError[] = []
  let skippedHeaders = 0
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/)
  lines.forEach((line, index) => {
    if (!line.trim()) {
      if (index > 0 && index < lines.length - 1) errors.push({ line: index + 1, text: line, reason: '空行' })
      return
    }
    const cells = cellsFromPastedLine(line)
    if (isHeaderRow(cells)) { skippedHeaders++; return }
    if (cells.length < 3) { errors.push({ line: index + 1, text: line, reason: cells.length < 2 ? '缺少账号和密码' : '缺少密码' }); return }
    if (cells.length > 3) { errors.push({ line: index + 1, text: line, reason: '格式错误：字段超过三列' }); return }
    const [name, username, password] = cells.slice(0, 3).map((cell) => cell.trim())
    if (!name || !username || !password) { errors.push({ line: index + 1, text: line, reason: '存在空字段' }); return }
    if (rows.some((row) => row.username === username)) { errors.push({ line: index + 1, text: line, reason: '账号重复' }); return }
    rows.push({ name, username, password })
  })
  return { rows, errors, skippedHeaders }
}

export function maskAccount(username: string): string {
  const a = String(username)
  if (a.length >= 8) return a.slice(0, 4) + '****' + a.slice(-4)
  return '****'
}
