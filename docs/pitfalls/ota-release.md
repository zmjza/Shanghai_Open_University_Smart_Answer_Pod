# OTA 与发布避坑

## 安装即时数据哈希未变不能证明后续可用性

- 现象：1.0.5 → 2.0.0 安装后原加密文件即时哈希未变，随后同一文件于 2026-09-24 15:41 从 307 字节变为 371 字节；升级前后账号页均显示未添加账号。
- 根因：该次后续写入由哪个操作触发、原文件能否解密，信息不全，待人工补充。
- 正确做法：区分安装即时文件保留与长期业务数据可用性；若需验收数据可用，必须在升级前后用已知非敏感测试数据实际回读，不打印账号或密钥。
- 验证方式：记录升级前后文件大小、修改时间和哈希，并对照客户端实际数据状态；本次只能确认安装即时文件未变化，不能确认原业务数据可解密。
- 禁止事项：不要因哈希暂时相同就宣称数据可用；不要擅自删除或重命名加密文件，也不要把后续写入推断成数据丢失。
- 相关文件或命令：`electron/secrets.ts`、`electron/store.ts`、本机 `kaida-store.bin` 的元数据检查。
- 适用范围：macOS OTA 后的本地加密数据验收。
- 来源：正式 2.0.0 安装前后与后续文件元数据、客户端账号页状态。

## 差分下载进度小于完整 ZIP 并非包不完整

- 现象：1.0.5 → 2.0.0 真机更新时界面显示总传输约 11.8 MB，GitHub 正式 macOS ZIP 为 122250811 字节。
- 根因：MacUpdater 利用缓存的旧版 `update.zip` 与 Release blockmap 执行差分下载，并在本机重建目标版本的完整 ZIP；进度显示的是本次网络传输量。
- 正确做法：向用户区分传输量与重建后的安装包大小；安装前后校验缓存中完整 ZIP 的大小及 SHA-256 与 GitHub 正式资产相同。
- 验证方式：捕获进度 75%、已下载 8.8/11.8 MB、2.0 MB/s；重建后的 `pending` ZIP 和 `update.zip` 均为 122250811 字节，SHA-256 均为 `31e55bbfd27ad49afbca4ca2c9f91015fcd5d3e30599819de7764e660f3124f5`，与远端一致；Squirrel 原位安装并重启后界面显示 v2.0.0。
- 禁止事项：不要把较小的差分下载量当作缺包，也不要仅凭进度 100% 就跳过完整包哈希校验。
- 相关文件或命令：`node_modules/electron-updater/out/MacUpdater.js`、`latest-mac.yml`、`shasum -a 256`。
- 适用范围：macOS electron-updater 差分更新。
- 来源：正式 1.0.5 客户端的 2.0.0 OTA 界面、更新器缓存与 GitHub Release 资产校验。

## Release 批量回下载 EOF 不要触发二次发布

- 现象：2.0.0 的 8 项资产已经由统一脚本上传并核对 digest，Release 已转正式；最后的 `gh release download` 报 `unexpected EOF`，统一命令以退出码 1 结束，回下载目录留下未完成的大文件。
- 根因：批量下载的连接提前结束；确切网络环节信息不全，待人工补充。不能据此认定远端资产缺失，也不能假定资产完整。
- 正确做法：先查远端 Release 状态、Tag、资产名称、大小和 digest；若已正式发布，禁止重跑会重新构建或替换资产的发布命令。将每个大文件单独重新下载到新目录，小文件另下，逐项计算 SHA-256 并与远端 digest 比对，再检查 OTA 清单内大小和 SHA-512。
- 验证方式：2.0.0 的 DMG、ZIP、EXE 分别重新下载成功，8 项本地 SHA-256 与 GitHub digest 一致；两个清单的版本及 3 个安装包的大小、SHA-512 匹配，ZIP/DMG 完整性通过。
- 禁止事项：不要因统一命令退出 1 就盲目再发布、覆盖现有 Tag/Release 或混用两次构建产物；也不要因资产显示 uploaded 就跳过远端下载校验。
- 相关文件或命令：`scripts/release-publish.mjs`、`gh release download v2.0.0 --pattern <单个大文件>`、`shasum -a 256`。
- 适用范围：GitHub Release 大文件上传后的最终回下载验收。
- 来源：2.0.0 发布脚本退出信息、GitHub Release API、逐文件回下载及哈希校验。

## Squirrel 安装成功不等于更新器安装包缓存已清理

- 现象：1.0.4 → 1.0.5 真机 OTA 已原位替换并重启，但 macOS 更新缓存仍含约 117 MB 的 `pending/kaida-auto-quiz-1.0.5-macOS.zip` 和约 128 MB 的 `update.zip`。
- 根因：当前 `electron-updater` 的 MacUpdater 在下载完成时将 ZIP 复制为 `update.zip`，供下次差分下载；`DownloadedUpdateHelper` 仅在缓存失效或显式 `clear()` 时清理 `pending`，安装成功后没有自动清空这两份文件。
- 正确做法：将“安装成功”与“安装包清理”分开验收；后续清理必须以新启动的应用版本与已安装更新版本一致为前提，只处理更新器专属缓存，不触碰用户数据。
- 验证方式：安装后同时核对 `/Applications` 中的版本、运行进程及界面徽记，再单独检查更新器缓存目录；1.0.5 的前三项为 1.0.5，缓存清理未通过。
- 禁止事项：不要把重启成功写成缓存清理成功；不要盲目清空用户数据目录或影响尚未安装的更新。
- 相关文件或命令：`electron/ota.ts`、`node_modules/electron-updater/out/MacUpdater.js`、`DownloadedUpdateHelper.js`、`~/Library/Caches/kaida-auto-quiz-updater/`。
- 适用范围：macOS Squirrel OTA 安装后的空间回收。
- 来源：1.0.5 正式客户端真机安装后本机目录检查与当前安装的 electron-updater 源码。
- 本次验收口径：用户明确接受保留更新器 ZIP 缓存；这项现象须记录，但不阻塞 2.0.0 发布。

## 默认 ad-hoc CDHash 会阻止 Squirrel.Mac 跨版本安装

- 现象：正式 1.0.2 检测到 1.0.3，下载后 ZIP 的远端 SHA-256 与更新清单 SHA-512 均一致，但点击安装报“代码未能满足指定的代码要求”；`/Applications` 仍为 1.0.2。
- 根因：Squirrel.Mac 从当前应用读取 designated requirement 并用它验证新 bundle。1.0.2 与 1.0.3 的默认 ad-hoc requirement 分别是不同的 CDHash，因而新包无法满足旧包要求。
- 正确做法：由 electron-builder 在签名时通过 `mac.requirements` 设置跨版本稳定的 identifier 要求，并包含签名时使用该要求的内嵌 Helper、Framework 与原生二进制 ID；必须保持 `identity: "-"` 和完整 bundle 的严格验签。已装 1.0.2/1.0.3 无法追改签名要求，需手动安装新基线版本一次。
- 验证方式：1.0.2 → 1.0.3 真机复现拒绝；为 1.0.4 预构建设置要求后，`codesign --verify --deep --strict` 通过，主应用 designated requirement 不再是 CDHash；后续跨版本 Squirrel 安装仍待正式包实测。
- 禁止事项：不要覆盖旧 Tag/资产、只关闭签名或手工对成品 `codesign --deep`；不要将仅按 identifier 的 ad-hoc 要求说成 Developer ID 身份验证。
- 相关文件或命令：`electron-builder.yml`、`build/requirements.mac.txt`、`codesign -d -r-`、`codesign --verify --deep --strict`、Squirrel.Mac `SQRLCodeSignature.m`。
- 适用范围：macOS ad-hoc 签名应用的 Squirrel 自动更新。
- 来源：正式客户端界面错误、1.0.2/1.0.3 签名检查、Squirrel.Mac 源码与 1.0.4 本地预构建。

## 旧本机数据的安全存储授权可阻塞正式客户端启动

- 现象：正式 1.0.2 安装在 `/Applications` 后进程存在，但桌面窗口读取超时。
- 根因：进程采样显示主线程停在 `safeStorage.decryptString` 所依赖的 macOS Security 服务调用，同时出现 SecurityAgent。具体授权状态信息不全，待人工补充。
- 正确做法：保留原用户数据和 Keychain；用同一正式 App bundle 加独立测试数据目录验证 GitHub 检查与界面，并单独标记原数据目录及升级后数据保留未验收。
- 验证方式：独立目录启动的正式 1.0.2 在 `@电脑` 中显示 v1.0.2，点击后出现“当前已是最新版本”；默认目录的窗口读取仍超时。
- 禁止事项：不要删除或重命名用户加密数据，不要把独立目录的成功冒充原用户数据保留通过，不要在日志中打印密文或密码。
- 相关文件或命令：`electron/secrets.ts`、`electron/store.ts`、macOS 进程采样、`@电脑`。
- 适用范围：macOS 正式客户端与 OTA 真机验收。
- 来源：本次正式客户端启动、主线程采样与独立测试目录复测。

## npm 镜像不提供安全审计接口

- 现象：直接执行 `npm audit --omit=dev --audit-level=high` 返回 HTTP 404，提示 audit 端点未实现。
- 根因：项目本机 npm registry 指向不支持审计接口的镜像。
- 正确做法：仅本次审计命令指定 `--registry=https://registry.npmjs.org/`，不改写项目安装源。
- 验证方式：官方 registry 返回实际审计报告；现有 `xlsx` 被报告为 1 项 high，且无可用修复版本。
- 禁止事项：不要把镜像返回 404 当成安全审计通过，也不要忽略官方审计发现。
- 相关文件或命令：`npm audit --registry=https://registry.npmjs.org/ --omit=dev --audit-level=high`、`electron/main.ts`。
- 适用范围：发布前依赖审计；Excel 导入路径需单独评估。
- 来源：本次两次审计结果与依赖使用位置检查。

## Windows 快捷方式选项必须写在 NSIS 配置下

- 现象：`electron-builder --win nsis --x64` 在校验 `configuration.win` 时失败，安装器无法构建。
- 根因：`createDesktopShortcut`、`createStartMenuShortcut` 和 `shortcutName` 属于顶层 `nsis` 配置，却被放入 `win`。
- 正确做法：`win` 保留图标、目标和产物名；将三个快捷方式选项放在顶层 `nsis`。
- 验证方式：修正前 Windows 构建退出码 1；修正后相同构建命令退出码 0，并生成 x64 NSIS EXE 与 blockmap。
- 禁止事项：不要只靠文本断言认定打包成功；Windows 真机快捷方式仍须在 Windows 上实际验收。
- 相关文件或命令：`electron-builder.yml`、`npm exec -- electron-builder --win nsis --x64 --publish never`。
- 适用范围：Windows NSIS 发布构建。
- 来源：本次本机预构建的失败与复测。

## 下载进度只注册一个监听器

- 现象：同一下载进度事件向界面重复广播。
- 根因：`electron/ota.ts` 对 `download-progress` 注册了两次相同处理器。
- 正确做法：只保留一次订阅，进度、速度和已下载大小统一由该处理器更新。
- 验证方式：OTA 回归断言监听器数为 1；修复前该断言实际得到 2，修复后 8 项测试通过。
- 禁止事项：新增 OTA 状态展示时不要再复制事件订阅块。
- 相关文件或命令：`electron/ota.ts`、`tests/ota-flow.test.mts`。
- 适用范围：electron-updater 下载进度。
- 来源：本次代码复核与红绿测试。

## 历史候选文档不能代表当前发布状态

- 现象：发布追踪仍说 0.8.0 没有 Tag/Release，GitHub API 已显示 0.8.0、0.9.0 和 1.0.0 均正式发布。
- 根因：候选阶段记录没有在发布后更新。
- 正确做法：每次发布前查远端 Tag、Release、资产和主分支，再按当前事实增量更新追踪；旧客户端是否发现指定历史版本需要当时真实证据。
- 验证方式：`gh release list --repo zmjza/SmartAnswerPod` 与 Release 资产 API 显示三版均为非草稿、每版 8 项资产。
- 禁止事项：不要覆盖既有 Tag/Release；不要把当前客户端发现最新版本写成历史上曾发现 0.9.0。
- 相关文件或命令：`liran_docs/发布与 OTA 追踪.md`、`gh release list`。
- 适用范围：版本追踪与 OTA 验收。
- 来源：本次 GitHub 远端复核。

## Keychain 授权阻塞时不要把文件未变当成数据保留验收

- 现象：正式 1.0.4 从默认原用户目录启动时窗口读取超时；使用隔离目录可检查 GitHub 更新，但保存虚构测试账号时再次超时，隔离目录没有生成 `kaida-store.bin`。
- 根因：默认目录的进程采样停在 `SecKeychainFindGenericPassword` 且系统运行 SecurityAgent；隔离目录写入也涉及 `safeStorage`，具体授权状态信息不全，待人工补充。
- 正确做法：保留原加密文件与 Keychain 状态，单独验证空隔离目录的 OTA 链路；业务数据能否解密并保留须在系统授权完成后重新验收。
- 验证方式：正式 1.0.4 的界面显示最新版通知；虚构账号保存后隔离目录无加密文件，原用户文件 SHA-256 未变化。
- 禁止事项：不删除或重命名原数据，不绕过系统授权，不把文件哈希不变或空目录 OTA 通过写成业务数据可用。
- 相关文件或命令：`electron/secrets.ts`、`electron/store.ts`、macOS 进程采样、`@电脑`。
- 适用范围：ad-hoc 签名版本迁移与 macOS safeStorage 数据验收。
- 来源：正式 1.0.4 客户端、隔离目录保存尝试及文件状态检查。
