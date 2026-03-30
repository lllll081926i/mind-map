# Mind Map 导入导出能力保留矩阵

日期：`2026-03-30`

## 1. 结论摘要

- 继续支持：
  `.smm`、`.json`、`.xmind`、`.md` 导入；
  `.smm`、`.json`、`.svg`、`.png`、`.pdf`、`.xmind`、`.md`、`.txt` 导出。
- 停用 / 不再视为有效能力：
  `.xlsx`、`.mm`。
- 本次同步修正：
  - `app/src/pages/Edit/components/Edit.vue`
  - `web/src/pages/Edit/components/Edit.vue`
  已移除 URL 打开场景里对 `.xlsx` 的误判。
  - `app/package.json`
  - `web/package.json`
  已移除未使用的 `xlsx` 依赖。

## 2. 证据基线

### 2.1 导入能力

- `app/src/pages/Edit/components/Import.vue`
- `web/src/pages/Edit/components/Import.vue`

当前实际允许导入的后缀只有：

- `.smm`
- `.json`
- `.xmind`
- `.md`

对应实现链路：

- `.smm/.json`
  由 `handleSmm` 直接读取 JSON。
- `.xmind`
  由 `simple-mind-map/src/parse/xmind.js` 解析。
- `.md`
  由 `simple-mind-map/src/parse/markdown.js` 和 `markdownTo.js` 转换。

### 2.2 导出能力

导出实现位于：

- `simple-mind-map/src/plugins/Export.js`
- `simple-mind-map/src/plugins/ExportPDF.js`
- `simple-mind-map/src/plugins/ExportXMind.js`

当前源码中存在明确实现的方法：

- `png`
- `pdf`
- `xmind`
- `svg`
- `json`
- `smm`
- `md`
- `txt`

### 2.3 UI 显示层

- `app/src/pages/Edit/components/Export.vue`
- `web/src/pages/Edit/components/Export.vue`

当前界面会主动过滤掉：

- `mm`
- `xlsx`

说明这两个类型在当前产品界面里已经不是正常对外能力。

## 3. 保留矩阵

| 格式 | 当前状态 | 证据 | 决策 |
| --- | --- | --- | --- |
| `.smm` | 导入 / 导出正常能力 | `Import.vue`、`Export.js` | 继续支持 |
| `.json` | 导入 / 导出正常能力 | `Import.vue`、`Export.js` | 继续支持 |
| `.xmind` | 导入 / 导出正常能力 | `xmind.js`、`ExportXMind.js` | 继续支持 |
| `.md` | 导入 / 导出正常能力 | `markdown.js`、`markdownTo.js`、`Export.js` | 继续支持 |
| `.svg` | 导出正常能力 | `Export.js` | 继续支持 |
| `.png` | 导出正常能力 | `Export.js` | 继续支持 |
| `.pdf` | 导出正常能力 | `Export.js`、`ExportPDF.js` | 继续支持 |
| `.txt` | 导出正常能力 | `Export.js` | 继续支持 |
| `.xlsx` | 无导入实现、无导出实现、UI 已隐藏 | 仅剩文案和旧后缀判断 | 停用 |
| `.mm` | 无导入实现、无导出实现、UI 已隐藏 | 仅剩配置文案 | 停用 |

## 4. 关于 `.xlsx` 的最终判断

本次复核后确认：

- 仓库里没有 `import 'xlsx'`、`require('xlsx')` 或等价运行时代码。
- `simple-mind-map` 内没有 `.xlsx` 导入导出实现。
- `app/web` 里只有导出类型文案、UI 过滤逻辑，以及旧的 URL 后缀判断。

因此，`.xlsx` 不是“底层链路仍保留、只是 UI 隐藏”，而是“历史文案残留 + 未使用依赖”。

本阶段已经完成两项收口：

1. 从 `app`、`web` 两端依赖中移除 `xlsx`。
2. 从 URL 文件打开判定中移除 `.xlsx`，避免用户误以为可直接打开。

## 5. 后续原则

- 若未来要重新支持 `.xlsx`，必须单独立项。
- 重新立项时至少要补齐：
  - 导入解析实现；
  - 导出序列化实现；
  - UI 开关恢复；
  - 样例文件与冒烟用例。

当前阶段不继续为 `.xlsx` 或 `.mm` 保留兼容债务。
