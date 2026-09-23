/** Replace only the account just reconciled, preserving concurrent accounts' updates. */
export function mergeAccountWriteback<T extends { local_id: string }>(current: T[], localId: string, retained: T[]): T[] {
  if (retained.some((item) => item.local_id !== localId)) throw new Error('待回写账号不一致')
  return [...current.filter((item) => item.local_id !== localId), ...retained]
}

export function writebackDisposition(pending: number, stopped: boolean): 'done' | 'retry' | 'stopped' {
  if (stopped) return 'stopped'
  return pending > 0 ? 'retry' : 'done'
}
