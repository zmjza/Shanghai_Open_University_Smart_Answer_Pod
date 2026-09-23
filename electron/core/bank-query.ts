export type BankQuery = {
  page: number
  pageSize: number
  courseName?: string
  searchMode?: 'fuzzy' | 'exact'
  searchText?: string
}

const select = 'id,qtype,stem,options,answer_texts,course_names,updated_at'

function arrayContains(value: string) {
  return `cs.{${value.replace(/[{},"]/g, ' ').trim()}}`
}

export function buildBankQuery(query: BankQuery) {
  const page = Math.max(1, Math.floor(query.page) || 1)
  const pageSize = Math.min(100, Math.max(10, Math.floor(query.pageSize) || 20))
  const from = (page - 1) * pageSize
  const params = new URLSearchParams({ select, order: 'updated_at.desc' })
  const courseName = query.courseName?.trim()
  if (courseName) params.set('course_names', arrayContains(courseName))
  const term = query.searchText?.trim().replace(/[,*()]/g, ' ')
  if (term) {
    const op = query.searchMode === 'exact' ? 'eq' : 'ilike'
    const value = query.searchMode === 'exact' ? term : `*${term}*`
    const fields = [`stem.${op}.${value}`]
    for (let i = 0; i < 12; i++) fields.push(`options->>${i}.${op}.${value}`)
    for (let i = 0; i < 6; i++) fields.push(`answer_texts->>${i}.${op}.${value}`)
    for (let i = 0; i < 32; i++) fields.push(`course_names->>${i}.${op}.${value}`)
    params.set('or', `(${fields.join(',')})`)
  }
  return { path: `/questions?${params.toString()}`, from, to: from + pageSize - 1, page, pageSize }
}
