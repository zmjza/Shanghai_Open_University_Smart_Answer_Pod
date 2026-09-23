type ReviewTextRow = { stem: string; options: string[] }

type ReloadablePage = {
  reload(options?: { waitUntil?: 'domcontentloaded' }): Promise<unknown>
}

function rowReadable(row: ReviewTextRow): boolean {
  const replacement = String.fromCodePoint(0xfffd)
  return row.stem.trim().length > 0 && row.options.length > 0 &&
    [row.stem, ...row.options].every((text) => text.trim().length > 0 && !text.includes(replacement))
}

function rowsReadable(rows: ReviewTextRow[]): boolean {
  return rows.length > 0 && rows.every(rowReadable)
}

function rowsStructurallyUsable(rows: ReviewTextRow[]): boolean {
  return rows.length > 0 && rows.every((row) =>
    row.stem.trim().length > 0 && row.options.length > 0 &&
    row.options.every((text) => text.trim().length > 0))
}

export async function readStableReviewedRows<T extends ReviewTextRow>(
  page: ReloadablePage,
  read: () => Promise<T[]>,
): Promise<T[]> {
  let lastRows: T[] = []
  for (let attempt = 0; attempt < 3; attempt++) {
    lastRows = await read()
    if (rowsReadable(lastRows)) return lastRows
    if (attempt < 2) await page.reload({ waitUntil: 'domcontentloaded' })
  }
  if (rowsStructurallyUsable(lastRows) && lastRows.some(rowReadable)) return lastRows
  throw new Error('批阅页题干或选项读取损坏，保留待回写')
}

export async function readStableAnswerRows<T extends ReviewTextRow>(
  page: ReloadablePage,
  read: () => Promise<T[]>,
): Promise<T[]> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const rows = await read()
    if (rowsReadable(rows)) return rows
    if (attempt < 2) await page.reload({ waitUntil: 'domcontentloaded' })
  }
  throw new Error('作答页题干或选项读取损坏，禁止开始作答')
}
