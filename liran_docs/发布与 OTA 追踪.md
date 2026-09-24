# GitHub 发布与 OTA 追踪

目标仓库：`zmjza/SmartAnswerPod`；分支：`main`。

## 1.0.3 正式发布及 1.0.2 → 1.0.3 真机失败

- 提交/Tag：`d6e38b5d4174a781ac4677656c4b0c5d3db27a26` / `v1.0.3`；GitHub main 与 Tag 指向同一提交。统一发布命令成功，Release `https://github.com/zmjza/SmartAnswerPod/releases/tag/v1.0.3` 为非草稿、非预发布，8 项资产经脚本上传和回下载 SHA-256 校验。macOS ZIP 为 122247148 字节，SHA-256 `9cf7f2e1a73acf1f8dd636c52731ef0ca904884d284bc8fcd64fdc793ca148fc`。
- 正式 1.0.2 客户端从 GitHub 发现 1.0.3 并显示版本弹窗；点击下载后界面出现 0% 与完成状态，缓存 ZIP 的 122247148 字节、SHA-256 与远端 Release、SHA-512 与更新清单一致。由于下载很快，未捕捉到连续递增的进度帧。
- 点击“安装并重启”后，Squirrel.Mac 报“代码未能满足指定的代码要求”，没有替换或重启。`/Applications` 仍为 1.0.2；原用户加密数据文件 SHA-256 保持 `d437a3848899db4c18328855b43453f01dd87d40c745d422aca565f605f05be9`，但无法证明业务数据可解密使用。
- 根因见 `docs/pitfalls/ota-release.md`：旧版默认 ad-hoc designated requirement 为版本相关 CDHash。1.0.4 将由 electron-builder 使用稳定的签名要求作为手动安装过渡版；1.0.2/1.0.3 已发布包不能原地修复。

## 1.0.2 正式发布与真机起点

- 提交与 Tag：`45c5de4bfd8d0c799bcc008067471ecd9cd7eaee`、`v1.0.2`；GitHub `origin/main` 与 Tag 均指向该提交。统一发布命令退出码 0，Release 为非草稿、非预发布，8 项资产齐全并经脚本回下载 SHA-256 校验。
- Release：`https://github.com/zmjza/SmartAnswerPod/releases/tag/v1.0.2`。远端资产（文件名 / 字节 / SHA-256）：
  - `kaida-auto-quiz-1.0.2-macOS.dmg` / 123288865 / `45e32a959aebbfb63ccf3cff3e9b7963d69e0d145583984c66da7e994e1c68b1`
  - `kaida-auto-quiz-1.0.2-macOS.dmg.blockmap` / 130454 / `3aadbd0f2dad9745c69b7efe08903b124ded01a4632fbb3fa08dfc5567ca8eec`
  - `kaida-auto-quiz-1.0.2-macOS.zip` / 122247830 / `dd65c4446a7cccb18e3e55ab5f581547b44e223d1d8cb9867ee7a98d064a5953`
  - `kaida-auto-quiz-1.0.2-macOS.zip.blockmap` / 126206 / `b0db4c3f1bc633493bec9efebf137f69e7a8f6f9c2a7ec236b0821231556084e`
  - `kaida-auto-quiz-1.0.2-Windows.exe` / 94533312 / `4c2e6a6ee11b951fe7c86ba226ff5a7cdda96ae4bb18d5b974175440ff65c744`
  - `kaida-auto-quiz-1.0.2-Windows.exe.blockmap` / 98340 / `74d0c0423cf2716c6f2887bac1ea1b697884b88f0f8b25afa5e95cce9d2e85b5`
  - `latest-mac.yml` / 521 / `8775d10eedbb15ea51e353af22b411a98e074b4f2fb62369aca09fb6c86a0377`
  - `latest.yml` / 362 / `e42b2b51d9fdab0f66c3a981c6e64905f1a0898205f780bd3d19776bfc1fd118`
- 官方 macOS ZIP 另行下载校验：`kaida-auto-quiz-1.0.2-macOS.zip` 为 122247830 字节，SHA-256 `dd65c4446a7cccb18e3e55ab5f581547b44e223d1d8cb9867ee7a98d064a5953`，与 GitHub 资产摘要和 `latest-mac.yml` 的版本、大小、SHA-512 一致；ZIP 完整性通过。
- 正式 ZIP 安装到 `/Applications/开大智达舱.app`，包内版本 1.0.2、ad-hoc 签名校验通过，Finder 应用程序列表可见。默认用户数据目录启动时主线程停在 macOS 安全存储解密，SecurityAgent 出现；没有修改、清理或读取该用户数据。
- 使用同一正式 App bundle 和独立测试数据目录启动后，`@电脑` 读到界面版本徽记 v1.0.2；点击“检查更新”后出现“当前已是最新版本”。此测试仍连接真实 GitHub，未使用 mock；但原用户数据保留和默认目录运行仍未验收。
- 下一阶段：发布唯一补丁版 1.0.3，再由此正式 1.0.2 客户端实测发现、下载进度、安装、重启和数据保留。

## 远端复核（覆盖下方过时的候选状态）

- 1.0.2 发布前验证：OTA 测试 8/8、P0 测试 75/75、CHG-026 UI E2E 与应用构建通过。发现 Windows 快捷方式选项误放在 `win`，原 NSIS 构建配置校验失败；移到 `nsis` 后同一 Windows x64 构建成功。macOS ARM64 DMG/ZIP 构建成功，App bundle 的 ad-hoc 签名严格校验通过，DMG 含 `/Applications` 链接。此处仅是本机预构建证据，不是 GitHub 正式资产或 Windows 真机验收。
- 以上是 1.0.2 发布前的候选状态；正式发布和最新版通知结果见本页顶部，OTA 安装重启仍待验证。
- 本机预构建安装包为临时产物；正式发布必须从版本提交重新构建并回下载核对，不复用预构建包。

- `v0.8.0` 已发布，Tag 指向 `f981ad1`；`v0.9.0` 已发布，Tag 指向 `146db9b`；`v1.0.0` 已发布，Tag 指向 `37c177b`。三版 Release 均为非草稿，各有 macOS ARM64 DMG/ZIP、Windows x64 NSIS EXE、对应 blockmap 与 `latest-mac.yml`/`latest.yml` 共 8 项资产。
- 这三版的远端元数据和资产清单已用 GitHub API 重新确认。历史记录没有证明 0.8.0 正式客户端曾从 GitHub 发现 0.9.0，也没有证明 Squirrel 安装重启及用户数据保留；这些层级仍待真实客户端验收。现在线上最新版已高于 0.9.0，0.8.0 客户端再检查不会返回 0.9.0，不能补写历史验收。
- 远端仅有 GitHub `origin`；本机存在大量与本次发布无关的未跟踪文档、测试和避坑库改动，本次版本提交必须按文件边界暂存，保持它们原样。
- `1.0.1` 源码提交 `2f631af` 已推送到 `main`，截至本次复核尚无 `v1.0.1` Tag 或 Release。该提交把 OTA 源改为 `SmartAnswerPod`，增加下载进度和 Windows 桌面快捷方式；进度监听重复注册的问题在后续修复中处理。
- macOS 更新仍采用 electron-updater 的 Squirrel.Mac，安装目标是启动更新的应用所在位置；要在 Launchpad 可见，应先把初装应用放入 `/Applications`。Windows 的 NSIS 选项为安装应用并创建桌面快捷方式，桌面显示的是快捷方式而非把程序文件放到桌面。Windows 真机安装/OTA 无法在当前 macOS 主机实测。

## 0.8.0 候选

- 提交：`838ea4c`（`feat: prepare 0.8.0 branded OTA release`），`main` 已快进推送至 GitHub。Tag / Release 尚未创建；GitHub 远端当前无版本 Tag 和 Release。
- 候选资产：`release/ota/mac-arm64/` 下的 `kaida-auto-quiz-0.8.0-macOS.dmg`、`kaida-auto-quiz-0.8.0-macOS.zip`、blockmap 与 `latest-mac.yml`；`release/ota/win-x64/` 下的 `kaida-auto-quiz-0.8.0-Windows.exe`、blockmap 与 `latest.yml`。均为本地构建，尚未上传。
- 验证：`npm run build`、`npm run test:p0`（75/75）、OTA 状态测试（5/5）、`npm run test:e2e:chg026-ui` 通过。macOS ARM64 DMG 校验与 ZIP 完整性检查通过；macOS ARM64 和 Windows x64 更新清单中全部文件的大小及 SHA-512 匹配。macOS 包内产品名“开大智达舱”、版本 `0.8.0`、ARM64 架构和 `icon.icns` 已检查；Windows x64 NSIS 文件为 PE32+ x86-64。
- 更新界面：点击检查时按钮旋转；最新版通知；新版本品牌弹窗显示版本对比、下载及安装重启操作。E2E 确认顶栏品牌 logo 和 `v0.8.0` 徽记。
- OTA 根因修复：按 electron-updater 返回的 `isUpdateAvailable` 判断是否有更新；单元回归已覆盖。
- 发布阻塞：本机只有自签名身份，没有正式 macOS Developer ID Application；签名构建报 `errSecInternalComponent`。统一发布命令 `npm run release:publish -- --notes "0.8.0 候选发布预检"` 在签名预检处退出，未创建 Tag/Release。候选包改以未签名模式生成。未进行在线 OTA、安装或重启验证。
- Windows 当前只以本机 x64 构建产物与 `latest.yml` 佐证；没有 Windows 真机运行证据。

## 0.9.0 与 1.0.0

- 尚未开始；需先完成 0.8.0 正式签名发布及线上 OTA 发现、下载和安装链路验证。
