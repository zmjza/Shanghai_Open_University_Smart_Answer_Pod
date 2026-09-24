# OTA 与发布避坑

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
