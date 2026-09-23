import { app, BrowserWindow } from 'electron'
import { autoUpdater } from 'electron-updater'
import { isRunning } from './runner'
import { UpdateFlow, type UpdateState } from './core/update-flow'

export const otaConfig = { provider: 'github' as const, owner: 'zmjza', repo: 'Shanghai_Open_University_Smart_Answer_Pod' }

function broadcast(state: UpdateState) {
  for (const window of BrowserWindow.getAllWindows()) window.webContents.send('kaida:ota:status', state)
}

autoUpdater.autoDownload = false
autoUpdater.autoInstallOnAppQuit = false
autoUpdater.autoRunAppAfterInstall = true
const flow = new UpdateFlow(autoUpdater, app.isPackaged, isRunning, broadcast)

export function currentUpdateState() { return flow.getState() }
export function downloadUpdate() { return flow.download() }
export function installUpdate() { return flow.install() }

export function updaterFeed() {
  return otaConfig
}

export function checkForUpdates() { return flow.check() }
