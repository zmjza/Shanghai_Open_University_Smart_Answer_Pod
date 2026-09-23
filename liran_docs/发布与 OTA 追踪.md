# GitHub 发布与 OTA 追踪

目标仓库：`zmjza/SmartAnswerPod`；分支：`main`。

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
