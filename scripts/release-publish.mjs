import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { access, mkdir, mkdtemp, readFile, rm } from 'node:fs/promises'
import { constants } from 'node:fs'
import path from 'node:path'
import { tmpdir } from 'node:os'

const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))
const config = await readFile(new URL('../electron-builder.yml', import.meta.url), 'utf8')
const changelog = await readFile(new URL('../CHANGELOG.md', import.meta.url), 'utf8')
const version = pkg.version
const repo = 'zmjza/Shanghai_Open_University_Smart_Answer_Pod'
const notesAt = process.argv.indexOf('--notes')
const notes = notesAt >= 0 ? process.argv[notesAt + 1] : ''
if (!/^\d+\.\d+\.\d+$/.test(version) || !notes?.trim()) throw new Error('需要有效 SemVer 版本及 --notes 更新说明')
if (!config.includes(`repo: ${repo.split('/')[1]}`)) throw new Error('electron-builder 仓库配置与发布目标不一致')
if (!config.includes('identity: "-"')) throw new Error('macOS 必须启用 electron-builder ad-hoc bundle 签名')
if (!changelog.includes(`## ${version}`)) throw new Error('CHANGELOG 缺少当前版本记录')
if (process.env.GH_TOKEN || process.env.GITHUB_TOKEN) throw new Error('拒绝使用环境变量 Token；请使用 macOS Keychain 中的 GitHub CLI 凭据')
const keychain = spawnSync('security', ['find-generic-password', '-s', 'gh:github.com'], { stdio: 'ignore' })
if (keychain.status !== 0) throw new Error('macOS Keychain 中未找到 gh:github.com 凭据项')
const auth = spawnSync('gh', ['auth', 'status', '--hostname', 'github.com'], { stdio: 'ignore' })
if (auth.status !== 0) throw new Error('GitHub CLI 未登录')
const target = `v${version}`
const remoteTags = spawnSync('git', ['ls-remote', '--tags', 'origin'], { encoding: 'utf8' })
if (remoteTags.status !== 0) throw new Error('无法核对 GitHub 远端 Tag')
if (remoteTags.stdout.split(/\r?\n/).some(line => line.endsWith(`refs/tags/${target}`) || line.endsWith(`refs/tags/${target}^{}`))) throw new Error(`远端 Tag ${target} 已存在，拒绝复用`)
const existing = spawnSync('gh', ['release', 'view', target, '--repo', repo, '--json', 'tagName'], { stdio: 'ignore' })
if (existing.status === 0) throw new Error(`GitHub Release ${target} 已存在，拒绝覆盖`)
const branch = spawnSync('git', ['branch', '--show-current'], { encoding: 'utf8' }).stdout.trim()
if (branch !== 'main') throw new Error(`发布分支应为 main，当前为 ${branch || 'detached HEAD'}`)
const origin = spawnSync('git', ['remote', 'get-url', 'origin'], { encoding: 'utf8' })
if (origin.status !== 0 || !origin.stdout.trim().includes('Shanghai_Open_University_Smart_Answer_Pod')) throw new Error('origin 未指向目标 GitHub 仓库')
const buildStatus = spawnSync('git', ['status', '--porcelain', '--', 'package.json', 'package-lock.json', 'electron-builder.yml', 'vite.config.ts', 'tsconfig.json', 'tsconfig.node.json', 'postcss.config.cjs', 'tailwind.config.cjs', 'index.html', 'electron', 'src', 'build'], { encoding: 'utf8' })
if (buildStatus.status !== 0 || buildStatus.stdout.trim()) throw new Error('发布前要求应用源码和打包配置已提交，避免未提交文件混入构建')
const stagingRoot = await mkdtemp(path.join(tmpdir(), `kaida-${version}-`))
const platforms = [
  { args: ['--mac', 'dmg', 'zip', '--arm64'], output: path.join(stagingRoot, 'mac-arm64'), manifest: 'latest-mac.yml', artifacts: [`kaida-auto-quiz-${version}-macOS.dmg`, `kaida-auto-quiz-${version}-macOS.zip`] },
  { args: ['--win', 'nsis', '--x64'], output: path.join(stagingRoot, 'win-x64'), manifest: 'latest.yml', artifacts: [`kaida-auto-quiz-${version}-Windows.exe`] },
 ]
for (const platform of platforms) {
  const build = spawnSync('npm', ['exec', '--', 'electron-builder', ...platform.args, `-c.directories.output=${platform.output}`, '--publish', 'never'], { stdio: 'inherit', env: { ...process.env, CSC_IDENTITY_AUTO_DISCOVERY: 'true' } })
  if (build.status !== 0) throw new Error(`${platform.args[0]} 安装包构建失败`)
}
for (const platform of platforms) for (const artifact of platform.artifacts) await access(path.join(platform.output, artifact), constants.R_OK)
for (const platform of platforms) {
  const artifactName = platform.artifacts.at(-1)
  const manifestName = platform.manifest
  const manifest = await readFile(path.join(platform.output, manifestName), 'utf8')
  const lines = manifest.split(/\r?\n/)
  const listed = lines.flatMap((line, index) => {
    const url = line.match(/^\s+- url: (.+)$/)?.[1]
    if (!url) return []
    return [{ url, sha512: lines[index + 1]?.match(/^\s+sha512: (.+)$/)?.[1], size: Number(lines[index + 2]?.match(/^\s+size: (\d+)$/)?.[1]) }]
  })
  if (!manifest.includes(`version: ${version}`) || listed.length !== platform.artifacts.length) throw new Error(`${manifestName} 版本或资产列表不匹配`)
  for (const file of listed) {
    if (!platform.artifacts.includes(file.url)) throw new Error(`${manifestName} 引用了非目标资产 ${file.url}`)
    const artifact = await readFile(path.join(platform.output, file.url))
    const actual = createHash('sha512').update(artifact).digest('base64')
    if (file.size !== artifact.byteLength || file.sha512 !== actual) throw new Error(`${manifestName} 资产大小或 SHA-512 校验失败：${file.url}`)
  }
  const topHash = lines.find(line => line.startsWith('sha512: '))?.slice(8)
  if (!platform.artifacts.includes(artifactName) || !topHash) throw new Error(`${manifestName} 主下载项缺失`)
  const primary = await readFile(path.join(platform.output, artifactName))
  if (topHash !== createHash('sha512').update(primary).digest('base64')) throw new Error(`${manifestName} 主下载项 SHA-512 校验失败`)
}
const push = spawnSync('git', ['push', 'origin', 'main'], { stdio: 'inherit' })
if (push.status !== 0) throw new Error('GitHub main 分支推送失败')
const uploads = platforms.flatMap(platform => [...platform.artifacts, platform.manifest].flatMap(file => [path.join(platform.output, file), ...(file.endsWith('.dmg') || file.endsWith('.zip') || file.endsWith('.exe') ? [path.join(platform.output, file + '.blockmap')] : [])]))
const create = spawnSync('gh', ['release', 'create', target, ...uploads, '--repo', repo, '--title', `开大智达舱 ${version}`, '--notes', notes], { stdio: 'inherit' })
if (create.status !== 0) throw new Error('GitHub Release 创建失败')
const verify = spawnSync('gh', ['release', 'view', target, '--repo', repo, '--json', 'tagName,isDraft,body,assets'], { encoding: 'utf8' })
if (verify.status !== 0) throw new Error('无法回读并验证 GitHub Release')
const release = JSON.parse(verify.stdout)
const expectedAssets = uploads.map(file => path.basename(file)).sort()
const actualAssets = release.assets.map(asset => asset.name).sort()
if (release.tagName !== target || release.isDraft || release.body !== notes || expectedAssets.some((name, index) => actualAssets[index] !== name) || actualAssets.length !== expectedAssets.length) throw new Error('GitHub Release Tag、说明或资产校验失败')
const head = spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).stdout.trim()
const taggedCommit = spawnSync('gh', ['api', `repos/${repo}/commits/${target}`, '--jq', '.sha'], { encoding: 'utf8' })
if (taggedCommit.status !== 0 || taggedCommit.stdout.trim() !== head) throw new Error('Release Tag 未指向本次提交')
const remoteAssetsDir = path.join(stagingRoot, 'remote-assets')
await mkdir(remoteAssetsDir)
const download = spawnSync('gh', ['release', 'download', target, '--repo', repo, '--dir', remoteAssetsDir], { stdio: 'inherit' })
if (download.status !== 0) throw new Error('远端 Release 资产下载校验失败')
for (const file of uploads) {
  const local = await readFile(file)
  const remote = await readFile(path.join(remoteAssetsDir, path.basename(file)))
  const hash = (data) => createHash('sha256').update(data).digest('hex')
  if (local.byteLength !== remote.byteLength || hash(local) !== hash(remote)) throw new Error(`远端资产与本次构建不一致：${path.basename(file)}`)
}
await rm(stagingRoot, { recursive: true, force: true })
