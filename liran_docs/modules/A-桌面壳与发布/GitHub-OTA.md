# GitHub-OTA

上级：[[_A]]
下级：无
依赖：[[Electron启动]]

---

## 场景
已安装用户拿到新版本。

## 触发
App 启动时自动检查 GitHub Releases，用户也可在自定义顶部栏点击“检查更新”。

## 逻辑
使用现有 electron-updater 从 `zmjza/Shanghai_Open_University_Smart_Answer_Pod` GitHub Releases 检查版本。启动时自动检查，顶部按钮可手动重查；检查中按钮旋转，最新版显示通知，新版用含 Logo 和版本对比的弹窗呈现下载及安装/重启操作。关闭自动下载，下载完成由用户选择“安装并重启”；macOS 显式启用 `autoRunAppAfterInstall`，由 Squirrel.Mac 安装并重新启动应用。任务运行中禁止安装，检查或下载失败保留错误并允许重新检查。开发版明确跳过网络检查。

发布包必须同时包含 Squirrel.Mac 所需的 DMG 与 ZIP。自动重启配置和流程单测通过不等于 OTA 真机验收；只有用已发布旧版客户端完成更新下载、Squirrel 安装、应用重启并确认版本及用户数据后，才能标记端到端验收通过。 ad-hoc 签名不提供 Apple Developer ID 信任或公证，首次打开可能出现 Gatekeeper 提示。

macOS 发布配置同时生成 DMG 与供自动更新使用的 ZIP，Windows 使用 NSIS。凭据只在本机发布流程，不进仓库。

## 状态 / 边界
缺网络时只显示检查错误，不打断答题；任务运行中不重启。包内不得含密钥和 Playwright profile。2026-09-23：0.8.0 本地候选构建已生成 macOS ARM64 DMG/ZIP 与 Windows x64 NSIS，两个平台的更新元数据和 SHA-512 均通过本地核验。macOS 仅有本地未签名构建；GitHub Release、在线 OTA、下载和安装尚未验证。详细过程见 [[发布与 OTA 追踪]]。
