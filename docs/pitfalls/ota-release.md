# OTA 与发布避坑

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
