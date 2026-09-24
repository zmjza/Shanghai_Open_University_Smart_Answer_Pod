import { cp, mkdtemp, readdir, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const target = process.argv[2]
const destination = process.argv[3]
if (!['mac-arm64', 'win-x64'].includes(target) || !destination) throw new Error('用法：node scripts/prepare-browsers.mjs mac-arm64|win-x64 <输出目录>')
if (existsSync(destination)) throw new Error(`浏览器输出目录已存在：${destination}`)

const cache = await mkdtemp(path.join(os.tmpdir(), `kaida-browsers-${target}-`))
const env = { ...process.env, PLAYWRIGHT_BROWSERS_PATH: cache }
if (target === 'win-x64') env.PLAYWRIGHT_HOST_PLATFORM_OVERRIDE = 'win64'
const install = spawnSync('npx', ['patchright', 'install', 'chromium'], { cwd: root, env, stdio: 'inherit' })
if (install.status !== 0) throw new Error(`${target} Chromium 下载失败`)
const browser = (await readdir(cache, { withFileTypes: true }))
  .find(entry => entry.isDirectory() && /^chromium-\d+$/.test(entry.name))
if (!browser) throw new Error(`${target} Chromium 目录未找到`)
const source = path.join(cache, browser.name)
await cp(source, path.join(destination, browser.name), { recursive: true, verbatimSymlinks: true })
if (!existsSync(path.join(destination, browser.name, 'INSTALLATION_COMPLETE'))) throw new Error(`${target} Chromium 安装标记缺失`)
await rm(cache, { recursive: true, force: true })
console.log(`已准备 ${target} Chromium：${destination}`)
