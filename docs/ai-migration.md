# AI 配置迁移说明

## 本次改造范围

- 将原先只面向火山方舟的 AI 配置改为 Provider 驱动。
- 保留原有本地代理模式，前端仍通过 `http://localhost:{port}/ai/*` 与本地代理通信。
- 当前首批支持的都是 OpenAI Compatible 协议：
  - `volcanoArk`
  - `openai`
  - `deepseek`
  - `siliconFlow`
  - `customOpenAI`

## 旧配置如何迁移

旧版本地配置如果只保存了：

- `api`
- `key`
- `model`
- `port`
- `method`

应用启动后会自动迁移为新结构：

- `provider`
- `protocol`
- `baseUrl`
- `apiPath`
- `api`
- `key`
- `model`
- `port`
- `method`

如果旧 `api` 命中已知域名，会自动映射到对应 Provider；否则会回落到 `customOpenAI`。

## 如何启动本地 AI 代理

在项目根目录执行：

```bash
npm run ai:serve
```

默认端口为 `3456`。如果界面配置了其他端口，需要保持前端配置与本地代理端口一致。

可以通过命令行参数覆盖监听端口：

```bash
npm run ai:serve -- --port=4567
```

也支持环境变量方式，优先级低于命令行参数：

- `AI_PROXY_PORT`
- `PORT`

## Provider 配置字段说明

- `Provider`：内置服务类型或自定义 OpenAI Compatible 服务
- `Base URL`：服务根地址，例如 `https://api.openai.com`
- `接口路径`：聊天接口路径，例如 `/v1/chat/completions`
- `API Key`：模型服务密钥
- `模型 ID`：具体模型名称
- `端口`：本地代理监听端口

## 对话与生成能力

本次改造后，以下入口共用同一套 AI 配置：

- AI 对话
- 一键生成思维导图
- AI 续写节点

对话链路会同时保留用户消息和 AI 回复上下文，不再只发送用户输入。

## 错误排查

### 连接失败

优先检查：

1. 本地代理是否已启动
2. 界面中的端口配置是否正确
3. Provider 的 `Base URL`、`接口路径`、`API Key`、`模型 ID` 是否填写完整

### 请求失败但代理已启动

本地代理现在会尽量透传上游状态码与错误信息。常见原因：

- `API Key` 无效
- `模型 ID` 不存在
- `Base URL` 或 `接口路径` 错误
- 上游服务超时

### 自定义 OpenAI Compatible 服务

请确认目标服务兼容以下行为：

- `POST` 请求
- `chat/completions` 风格接口
- 支持 `stream: true`
- 返回 OpenAI Compatible 的 SSE 数据格式

## 当前限制

- 本轮只完成 OpenAI Compatible 协议层的统一。
- 非 OpenAI Compatible Provider 不在当前项目主线范围内。
- 前端仍依赖本地代理，不直接在浏览器向模型服务发请求。
