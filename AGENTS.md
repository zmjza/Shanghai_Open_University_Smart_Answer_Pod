# AGENTS.md

## 长期避坑知识库

任何 Codex/AI 在开发、修复、测试、部署或排障前，必须先读本文件，再读 `docs/pitfalls/README.md` 和相关模块避坑文件。

- 新踩的坑必须在任务收尾前写入 `docs/pitfalls/`（见下方索引）。
- 任务中断时，尽量记录已发现但未提炼的坑。
- 禁止写入密钥、token、账号密码、隐私数据、生产配置全文、完整敏感日志。
- 本文件只放规则和索引，具体坑不写在这里。

### 索引

- 避坑目录：`docs/pitfalls/`
- 读取入口：`docs/pitfalls/README.md`
- 通用：`docs/pitfalls/general.md`

### 页面结构

- 索引：`docs/page-structures/README.md`
- 作答页：仓库根目录 `开大自动答题页面结构.md`

## 源码提交与本地分发构建规则

- 本项目不再执行 GitHub Release、Tag、OTA 发布或安装包上传。
- 完成源码修改并验证后，只提交并推送源码；不得把构建产物、`node_modules/`、浏览器 profile、账号数据、日志、密钥或临时文件提交。
- 需要交付程序时运行 `npm run package`，同时构建 macOS ARM64 和 Windows x64。
- 构建产物统一放在 `release/<package.json version>/` 下，按 `mac-arm64/` 和 `win-x64/` 分目录保存，供用户手动分发。
- 打包命令必须使用 `--publish never`；禁止调用 `npm run release:publish`、`scripts/release-publish.mjs` 或其他 GitHub 发布流程。
