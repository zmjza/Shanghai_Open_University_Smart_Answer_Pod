import { execFileSync } from 'node:child_process'
import { chromium } from 'patchright'

let cachedHeadlessUserAgent: string | undefined

export function headlessUserAgent() {
  if (cachedHeadlessUserAgent) return cachedHeadlessUserAgent
  let version = ''
  try {
    version = execFileSync(chromium.executablePath(), ['--version'], { encoding: 'utf8', timeout: 5000 })
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
