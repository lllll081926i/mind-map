# Desktop Release Checklist

**日期：** 2026-03-30

## 构建前

- 确认 `package.json` 版本号已更新
- 确认 `src-tauri/tauri.conf.json` 版本号一致
- 确认 `src-tauri/icons/icon.ico` 为最新品牌资源
- 确认没有把调试日志和临时测试开关打进发布包

## 功能回归

- 应用可以正常启动
- 首次启动可以正常初始化本地配置
- 打开 `.smm` 文件可编辑
- 另存为 `.smm` 文件可成功写入
- 打开目录后文件树可正常加载
- 最近文件能正确更新
- 暗色模式切换后主题保持正确
- AI 配置可保存
- 桌面 AI 可正常发起请求并停止

## 构建验证

- `npm run check`
- `npm run frontend:build`
- `npm run build`
- `node ./scripts/test-ai-provider.mjs`
- Windows：`npm run desktop:build:windows`
- macOS：`npm run desktop:build:macos`
- Linux：`npm run desktop:build:linux`

## 产物检查

- 安装包可生成
- Windows 产出 `NSIS` 安装包
- Windows ARM64 产出 `NSIS` 安装包与免安装版
- macOS 产出 `app` / `dmg`
- Linux 产出 `deb` / `AppImage`
- 安装后可启动
- 卸载流程正常
- 应用图标、窗口标题、安装包名称正确

## 风险复核

- 配置迁移不会覆盖用户已有新配置
- 最近文件不会重复写盘或丢失
- 本地文件写入失败时有明确提示
- AI 失败时可显示明确错误信息
- 设置页版本信息和运行时信息显示正确
- “检查更新”入口仍是占位，不要当成已上线能力

## 发布后补充

- 记录版本号、构建时间、提交哈希
- 记录已知问题
- 记录回滚方式
