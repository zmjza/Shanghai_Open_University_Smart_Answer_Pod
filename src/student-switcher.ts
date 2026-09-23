export function visibleStudentIndexes(n: number, active: number, capacity = 1): number[] {
 if (n <= 0) return []
 const a = Math.min(Math.max(active, 0), n - 1)
  const size = Math.min(Math.max(capacity, 1), n)
  const start = Math.min(Math.max(a - size + 1, 0), n - size)
  return Array.from({ length: size }, (_, index) => start + index)
}

export function overflowStudentIndexes(n: number, visible: number[]): number[] {
  const vis = new Set(visible)
  const out: number[] = []
  for (let i = 0; i < n; i++) if (!vis.has(i)) out.push(i)
  return out
}
