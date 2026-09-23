import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const runFile = promisify(execFile)

export async function setMacProcessVisible(pid: number | null, visible: boolean): Promise<boolean | null> {
  if (process.platform !== 'darwin' || !pid) return null
  try {
    const process = `first process whose unix id is ${pid}`
    const { stdout } = await runFile('/usr/bin/osascript', [
      '-e', `tell application \"System Events\" to set visible of ${process} to ${visible}`,
      '-e', 'delay 0.1',
      '-e', `tell application \"System Events\" to get visible of ${process}`,
    ], { timeout: 5000 })
    const actualVisible = stdout.trim() === 'true'
    return !actualVisible
  } catch {
    return null
  }
}
