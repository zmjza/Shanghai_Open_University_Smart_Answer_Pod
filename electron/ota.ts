import { app, BrowserWindow } from 'electron'
import { autoUpdater } from 'electron-updater'
import { isRunning } from './runner'
import { UpdateFlow, type UpdateState } from './core/update-flow'

export const otaConfig = { provider: 'github' as const, owner: 'zmjza', repo: 'SmartAnswerPod' }

function broadcast(state: UpdateState) {
  for (const window of BrowserWindow.getAllWindows()) window.webContents.send('kaida:ota:status', state)
}

autoUpdater.autoDownload = false
autoUpdater.autoInstallOnAppQuit = false
autoUpdater.autoRunAppAfterInstall = true
const flow = new UpdateFlow(autoUpdater, app.isPackaged, isRunning, broadcast)
autoUpdater.on('download-progress', progress => {
  const percent = Math.round(progress.percent)
  const speed = progress.bytesPerSecond > 0 ? ` · ${(progress.bytesPerSecond / 1024 / 1024).toFixed(1)} MB/s` : ''
  flow.setProgress(percent, `${percent}% · 已下载 ${(progress.transferred / 1024 / 1024).toFixed(1)} / ${(progress.total / 1024 / 1024).toFixed(1)} MB${speed}`)
})
autoUpdater.on('error', error => {
  flow.fail(error instanceof Error ? error.message : '安装器报告未知错误')
})
autoUpdater.on('download-progress', progress => {
  const percent = Math.round(progress.percent)
  const speed = progress.bytesPerSecond > 0 ? ` · ${(progress.bytesPerSecond / 1024 / 1024).toFixed(1)} MB/s` : ''
  flow.setProgress(percent, `${percent}% · 已下载 ${(progress.transferred / 1024 / 1024).toFixed(1)} / ${(progress.total / 1024 / 1024).toFixed(1)} MB${speed}`)
})

export function currentUpdateState() { return flow.getState() }
export function downloadUpdate() { return flow.download() }
export function installUpdate() { return flow.install() }

export function updaterFeed() {
  return otaConfig
}

export function checkForUpdates() { return flow.check() }
