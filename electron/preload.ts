import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('kaida', {
  snapshot: () => ipcRenderer.invoke('kaida:snapshot'),
  onSnapshot: (cb: (s: unknown) => void) => {
    const fn = (_e: unknown, s: unknown) => cb(s)
    ipcRenderer.on('kaida:snapshot', fn)
    return () => ipcRenderer.removeListener('kaida:snapshot', fn)
  },
  onProgress: (cb: (s: unknown) => void) => {
    const fn = (_e: unknown, s: unknown) => cb(s)
    ipcRenderer.on('kaida:progress', fn)
    return () => ipcRenderer.removeListener('kaida:progress', fn)
  },
  getSettings: () => ipcRenderer.invoke('kaida:settings:get'),
  saveSettings: (p: unknown) => ipcRenderer.invoke('kaida:settings:save', p),
  onSettingsChanged: (cb: (s: unknown) => void) => {
    const fn = (_e: unknown, s: unknown) => cb(s)
    ipcRenderer.on('kaida:settings:changed', fn)
    return () => ipcRenderer.removeListener('kaida:settings:changed', fn)
  },
  testConn: () => ipcRenderer.invoke('kaida:settings:test'),
  testConnectivity: () => ipcRenderer.invoke('kaida:settings:connectivity'),
  testConnectivityModel: (model: string) => ipcRenderer.invoke('kaida:settings:connectivity:one', model),
  onConnectivityProgress: (cb: (s: unknown) => void) => {
    const fn = (_e: unknown, s: unknown) => cb(s)
    ipcRenderer.on('kaida:settings:connectivity-progress', fn)
    return () => ipcRenderer.removeListener('kaida:settings:connectivity-progress', fn)
  },
  listAccounts: () => ipcRenderer.invoke('kaida:accounts:list'),
  addAccount: (row: unknown) => ipcRenderer.invoke('kaida:accounts:add', row),
  updateAccount: (id: string, row: unknown) => ipcRenderer.invoke('kaida:accounts:update', id, row),
  removeAccount: (id: string) => ipcRenderer.invoke('kaida:accounts:remove', id),
 importExcel: () => ipcRenderer.invoke('kaida:accounts:importExcel'),
  parsePastedAccounts: (text: string) => ipcRenderer.invoke('kaida:accounts:paste:parse', text),
  confirmPastedAccounts: (rows: unknown[]) => ipcRenderer.invoke('kaida:accounts:paste:confirm', rows),
  importJson: () => ipcRenderer.invoke('kaida:bank:importJson'),
  bankAccessStatus: () => ipcRenderer.invoke('kaida:bank:access:status'),
  unlockBank: (password: string) => ipcRenderer.invoke('kaida:bank:unlock', password),
  listBankQuestions: (query: unknown) => ipcRenderer.invoke('kaida:bank:list', query),
  listBankCourses: () => ipcRenderer.invoke('kaida:bank:courses'),
  deleteBankQuestions: (ids: string[]) => ipcRenderer.invoke('kaida:bank:delete', ids),
  loginRefresh: (accountIds?: string[]) => ipcRenderer.invoke('kaida:run:detect', accountIds),
  setDisplay: (id: string, mode: string) => ipcRenderer.invoke('kaida:display', id, mode),
  setWorkMode: (id: string, mode: string) => ipcRenderer.invoke('kaida:workMode', id, mode),
  setCourseScope: (id: string, scope: string) => ipcRenderer.invoke('kaida:courseScope', id, scope),
  setSelectedCourses: (id: string, names: string[]) => ipcRenderer.invoke('kaida:selectedCourses', id, names),
  startSelectedCourses: () => ipcRenderer.invoke('kaida:selectedCourses:start'),
  getHomeworkHistory: (id: string, courseName: string, homeworkName: string) => ipcRenderer.invoke('kaida:history:list', id, courseName, homeworkName),
  getHistoryPaperImage: (id: string, courseName: string, homeworkName: string, submittedAt: string) => ipcRenderer.invoke('kaida:history:paper', id, courseName, homeworkName, submittedAt),
  setAnswerRoundLimit: (id: string, limit: number) => ipcRenderer.invoke('kaida:answerRoundLimit', id, limit),
  openVisual: (id: string) => ipcRenderer.invoke('kaida:openVisual', id),
  getQrSnapshot: (id: string) => ipcRenderer.invoke('kaida:qr:get', id),
  refreshQrSnapshot: (id: string) => ipcRenderer.invoke('kaida:qr:refresh', id),
  copyQrSnapshot: (id: string, version: number) => ipcRenderer.invoke('kaida:qr:copy', id, version),
  verifyDone: (id: string) => ipcRenderer.invoke('kaida:verifyDone', id),
  stop: (id: string) => ipcRenderer.invoke('kaida:stop', id),
  minimizeWindow: () => ipcRenderer.invoke('kaida:window:minimize'),
  maximizeWindow: () => ipcRenderer.invoke('kaida:window:maximize'),
  closeWindow: () => ipcRenderer.invoke('kaida:window:close'),
  checkForUpdates: () => ipcRenderer.invoke('kaida:ota:check'),
  updateState: () => ipcRenderer.invoke('kaida:ota:state'),
  downloadUpdate: () => ipcRenderer.invoke('kaida:ota:download'),
  installUpdate: () => ipcRenderer.invoke('kaida:ota:install'),
  onUpdateStatus: (cb: (s: unknown) => void) => {
    const fn = (_e: unknown, s: unknown) => cb(s)
    ipcRenderer.on('kaida:ota:status', fn)
    return () => ipcRenderer.removeListener('kaida:ota:status', fn)
  },
})
