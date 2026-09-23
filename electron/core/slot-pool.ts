import { slotCountsInToolbar, type SlotState } from './states.ts'

export class SlotPool {
  limit: number
  private slots = new Map<string, SlotState>()
  constructor(limit: number) {
    this.limit = limit
  }

  setLimit(n: number) {
    this.limit = Math.max(1, n)
  }

  get(id: string): SlotState {
    return this.slots.get(id) ?? 'queued'
  }

  toolbarCount(): number {
    let n = 0
    for (const s of this.slots.values()) if (slotCountsInToolbar(s)) n++
    return n
  }

  request(id: string): SlotState {
    const cur = this.slots.get(id)
    if (cur === 'launching' || cur === 'occupied' || cur === 'occupying_verify') return cur
    if (this.toolbarCount() >= this.limit) {
      this.slots.set(id, 'queued')
      return 'queued'
    }
    this.slots.set(id, 'launching')
    return 'launching'
  }

  occupy(id: string) {
    this.slots.set(id, 'occupied')
  }

  occupyingVerify(id: string) {
    this.slots.set(id, 'occupying_verify')
  }

  release(id: string) {
    this.slots.set(id, 'released')
  }

  /** 暂停/需验证不得把名额让给排队号 */
  promoteQueued(): string | null {
    if (this.toolbarCount() >= this.limit) return null
    for (const [id, s] of this.slots) {
      if (s === 'queued') {
        this.slots.set(id, 'launching')
        return id
      }
    }
    return null
  }
}
