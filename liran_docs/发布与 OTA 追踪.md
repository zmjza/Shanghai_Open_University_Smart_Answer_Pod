# GitHub 发布与 OTA 追踪

目标仓库：`zmjza/SmartAnswerPod`；分支：`main`。

## 远端复核（覆盖下方过时的候选状态）

- 1.0.2 发布前验证：OTA 测试 8/8、P0 测试 75/75、CHG-026 UI E2E 与应用构建通过。发现 Windows 快捷方式选项误放在 `win`，原 NSIS 构建配置校验失败；移到 `nsis` 后同一 Windows x64 构建成功。macOS ARM64 DMG/ZIP 构建成功，App bundle 的 ad-hoc 签名严格校验通过，DMG 含 `/Applications` 链接。此处仅是本机预构建证据，不是 GitHub 正式资产或 Windows 真机验收。
- 1.0.2 尚未发布，正式 Release 资产、在线最新版通知及 OTA 安装重启均待验证。
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
