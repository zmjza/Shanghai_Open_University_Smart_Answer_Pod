export type UpdatePhase = 'unavailable' | 'checking' | 'available' | 'downloading' | 'downloaded' | 'installing' | 'error'
export type UpdateState = { phase: UpdatePhase; version?: string; message?: string }

type Updater = {
  checkForUpdates: () => Promise<{ isUpdateAvailable: boolean; updateInfo?: { version?: string } } | null>
  downloadUpdate: () => Promise<string[]>
  quitAndInstall: () => void
}

export class UpdateFlow {
  private state: UpdateState = { phase: 'unavailable' }
  private inFlight?: Promise<UpdateState>
  private readonly updater: Updater
  private readonly packaged: boolean
  private readonly isRunning: () => boolean
  private readonly onStatus?: (state: UpdateState) => void
  constructor(updater: Updater, packaged: boolean, isRunning: () => boolean, onStatus?: (state: UpdateState) => void) {
    this.updater = updater
    this.packaged = packaged
    this.isRunning = isRunning
    this.onStatus = onStatus
  }

  getState() { return this.state }
  private set(state: UpdateState) { this.state = state; this.onStatus?.(state); return state }

  check() {
    if (!this.packaged) return Promise.resolve(this.set({ phase: 'unavailable', message: '开发版跳过更新检查' }))
    if (!this.inFlight) this.inFlight = this.checkInternal().finally(() => { this.inFlight = undefined })
    return this.inFlight
  }

  private async checkInternal() {
    this.set({ phase: 'checking' })
    try {
      const result = await this.updater.checkForUpdates()
      const version = result?.updateInfo?.version
      return result?.isUpdateAvailable && version ? this.set({ phase: 'available', version }) : this.set({ phase: 'unavailable', message: '当前已是最新版本' })
    } catch (error) {
      return this.set({ phase: 'error', message: error instanceof Error ? error.message : '检查更新失败' })
    }
  }

  async download() {
    if (this.state.phase !== 'available') return this.state
    this.set({ phase: 'downloading', version: this.state.version })
    try {
      await this.updater.downloadUpdate()
      return this.set({ phase: 'downloaded', version: this.state.version })
    } catch (error) {
      return this.set({ phase: 'error', version: this.state.version, message: error instanceof Error ? error.message : '下载更新失败' })
    }
  }

  install() {
    if (this.state.phase !== 'downloaded' || this.isRunning()) return this.state
    this.set({ phase: 'installing', version: this.state.version })
    this.updater.quitAndInstall()
    return this.state
  }
}
