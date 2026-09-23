import { createHash } from 'node:crypto'
import { execFileSync, spawnSync } from 'node:child_process'
import { readFile, readdir, stat, mkdir } from 'node:fs/promises'
import path from 'node:path'

const { VERSION: version, NOTES: notes, REPOSITORY: repo } = process.env
if (!/^\d+\.\d+\.\d+$/.test(version ?? '') || !notes || !repo) throw new Error('缺少发布版本、说明或仓库')
const tag = `v${version}`
const dir = path.resolve('release-assets')
const expected = [`kaida-auto-quiz-${version}-macOS.dmg`, `kaida-auto-quiz-${version}-macOS.zip`, `kaida-auto-quiz-${version}-Windows.exe`, 'latest-mac.yml', 'latest.yml', `kaida-auto-quiz-${version}-macOS.dmg.blockmap`, `kaida-auto-quiz-${version}-macOS.zip.blockmap`, `kaida-auto-quiz-${version}-Windows.exe.blockmap`].sort()
const gh = (...args) => execFileSync('gh', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
const api = endpoint => JSON.parse(gh('api', endpoint))
const hash = async (file, algorithm, encoding = 'hex') => createHash(algorithm).update(await readFile(file)).digest(encoding)
const files = (await readdir(dir)).sort()
if (files.length !== expected.length || files.some((name, index) => name !== expected[index])) throw new Error(`资产集合错误：${files.join(', ')}`)
for (const manifest of ['latest-mac.yml', 'latest.yml']) {
  const text = await readFile(path.join(dir, manifest), 'utf8')
  const targets = manifest === 'latest-mac.yml' ? expected.filter(name => /macOS\.(dmg|zip)$/.test(name)) : expected.filter(name => /Windows\.exe$/.test(name))
  if (!text.includes(`version: ${version}`)) throw new Error(`${manifest} 版本不匹配`)
  for (const name of targets) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const match = text.match(new RegExp(`- url: ${escaped}\\n\\s+sha512: ([^\\n]+)\\n\\s+size: (\\d+)`))
    const file = path.join(dir, name)
    if (!match || match[1] !== await hash(file, 'sha512', 'base64') || Number(match[2]) !== (await stat(file)).size) throw new Error(`${manifest} 与 ${name} 不一致`)
  }
}
const existingRelease = api(`repos/${repo}/releases?per_page=100`).find(release => release.tag_name === tag)
if (existingRelease && !existingRelease.draft) throw new Error(`${tag} Release 已发布，拒绝覆盖`)
if (existingRelease) console.log(`复用未发布草稿 ${existingRelease.id}，清理并重传同一套资产`)
if (existingRelease) {
  for (const asset of existingRelease.assets) gh('api', '-X', 'DELETE', `repos/${repo}/releases/assets/${asset.id}`)
}
const existingTag = spawnSync('gh', ['api', `repos/${repo}/git/ref/tags/${tag}`], { stdio: 'ignore' })
if (existingTag.status === 0) throw new Error(`${tag} Tag 已存在，拒绝复用`)
if (!existingRelease) gh('release', 'create', tag, '--repo', repo, '--target', process.env.GITHUB_SHA, '--title', `开大智达舱 ${version}`, '--notes', notes, '--draft')
for (const name of files) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const result = spawnSync('gh', ['release', 'upload', tag, path.join(dir, name), '--repo', repo], { encoding: 'utf8' })
    if (result.status === 0) break
    const release = api(`repos/${repo}/releases/tags/${tag}`)
    for (const asset of release.assets.filter(asset => asset.name === name && asset.state !== 'uploaded')) gh('api', '-X', 'DELETE', `repos/${repo}/releases/assets/${asset.id}`)
    if (attempt === 3) throw new Error(`上传失败：${name}；${result.stderr.trim()}`)
    await new Promise(resolve => setTimeout(resolve, attempt * 3000))
  }
  console.log(`已上传 ${name}`)
}
const release = api(`repos/${repo}/releases/${existingRelease?.id ?? api(`repos/${repo}/releases?per_page=100`).find(item => item.tag_name === tag).id}`)
const actual = release.assets.filter(asset => asset.state === 'uploaded').map(asset => asset.name).sort()
if (actual.length !== expected.length || actual.some((name, index) => name !== expected[index])) throw new Error('远端资产集合不完整')
for (const asset of release.assets) if (asset.digest !== `sha256:${await hash(path.join(dir, asset.name), 'sha256')}`) throw new Error(`远端摘要不一致：${asset.name}`)
gh('release', 'edit', tag, '--repo', repo, '--draft=false')
const downloadDir = path.resolve('release-download')
await mkdir(downloadDir)
gh('release', 'download', tag, '--repo', repo, '--dir', downloadDir)
for (const name of expected) if (await hash(path.join(dir, name), 'sha256') !== await hash(path.join(downloadDir, name), 'sha256')) throw new Error(`回下载校验失败：${name}`)
console.log(`发布并回下载校验完成：https://github.com/${repo}/releases/tag/${tag}`)
