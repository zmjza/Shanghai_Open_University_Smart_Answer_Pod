import { execFileSync } from 'node:child_process'
import { readdirSync } from 'node:fs'
import path from 'node:path'
import { app } from 'electron'
import { chromium } from 'patchright'

export function browserExecutablePath() {
  if (!app.isPackaged) return chromium.executablePath()
  const root = path.join(process.resourcesPath, 'browsers')
  const revision = readdirSync(root).find(name => /^chromium-\d+$/.test(name))
  if (!revision) throw new Error('安装包缺少 Chromium 运行时')
  const folder = path.join(root, revision)
  return process.platform === 'win32'
    ? path.join(folder, 'chrome-win64', 'chrome.exe')
    : path.join(folder, 'chrome-mac-arm64', 'Google Chrome for Testing.app', 'Contents', 'MacOS', 'Google Chrome for Testing')
}

let cachedHeadlessUserAgent: string | undefined

export function headlessUserAgent() {
  if (cachedHeadlessUserAgent) return cachedHeadlessUserAgent
  let version = ''
  try {
    version = execFileSync(browserExecutablePath(), ['--version'], { encoding: 'utf8', timeout: 5000 })
      .match(/\d+\.\d+\.\d+\.\d+/)?.[0] || ''
  } catch {
    version = process.versions.chrome || ''
  }
  if (!version) version = '153.0.0.0'
  const platform = process.platform === 'win32'
    ? 'Windows NT 10.0; Win64; x64'
    : process.platform === 'darwin'
      ? 'Macintosh; Intel Mac OS X 10_15_7'
      : 'X11; Linux x86_64'
  cachedHeadlessUserAgent = 'Mozilla/5.0 (' + platform + ') AppleWebKit/537.36 (KHTML, like Gecko) Chrome/' + version + ' Safari/537.36'
  return cachedHeadlessUserAgent
}
