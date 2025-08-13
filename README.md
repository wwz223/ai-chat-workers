# AI Chat Workers - GraphQL Edition

基于Cloudflare Workers的AI聊天服务，使用GraphQL接口调用SiliconFlow的Qwen2.5-7B-Instruct模型。

## 功能特性

- 🚀 基于Cloudflare Workers的无服务器架构
- 🤖 集成SiliconFlow的Qwen2.5-7B-Instruct AI模型
- 🔗 **GraphQL API** - 类型安全、强大灵活的API接口
- 🌐 完整的CORS支持，适合前端调用
- 🔐 安全的API密钥管理
- ⚡ 快速响应和全球分发
- 🧪 完整的测试套件
- 🎮 内置GraphQL Playground用于API探索

## 项目结构

```
ai-chat-workers/
├── src/
│   ├── index.ts          # 主要的Worker代码
│   ├── schema.ts         # GraphQL Schema定义
│   ├── resolvers.ts      # GraphQL Resolvers实现
│   └── types.ts          # TypeScript类型定义
├── test/
│   ├── index.spec.ts     # 测试文件
│   ├── env.d.ts         # 测试环境类型定义
│   └── tsconfig.json    # 测试TypeScript配置
├── package.json          # 项目依赖
├── wrangler.jsonc       # Cloudflare Workers配置
├── tsconfig.json        # TypeScript配置
└── vitest.config.mts    # 测试配置
```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置API密钥

在Cloudflare Workers dashboard中设置环境变量：
- `SILICONFLOW_API_KEY`: 你的SiliconFlow API密钥

或在本地开发时创建`.dev.vars`文件：
```
SILICONFLOW_API_KEY=your_api_key_here
```

### 3. 本地开发

```bash
npm run dev
```

### 4. 运行测试

```bash
npm test
```

### 5. 部署到Cloudflare

```bash
npm run deploy
```

## GraphQL API使用

### GraphQL Playground

访问 `https://your-worker-domain.com/` 可以打开GraphQL Playground，用于交互式API探索和测试。

### API端点

**GraphQL端点**: `POST /graphql` 或 `POST /`

### 查询操作 (Queries)

#### 1. 检查服务状态

```graphql
query GetStatus {
  status {
    healthy
    model
    version
    lastCheck
  }
}
```

**响应**:
```json
{
  "data": {
    "status": {
      "healthy": true,
      "model": "Qwen/Qwen2.5-7B-Instruct",
      "version": "1.0.0",
      "lastCheck": "2025-01-15T10:30:00Z"
    }
  }
}
```

#### 2. 获取支持的模型

```graphql
query GetSupportedModels {
  supportedModels
}
```

### 变更操作 (Mutations)

#### 发送聊天消息

```graphql
mutation SendChat($input: ChatInput!) {
  chat(input: $input) {
    content
    model
    timestamp
    tokensUsed
  }
}
```

**变量**:
```json
{
  "input": {
    "prompt": "你好，请介绍一下自己",
    "temperature": 0.7,
    "maxTokens": 512,
    "topP": 0.7,
    "topK": 50,
    "frequencyPenalty": 0.5
  }
}
```

**响应**:
```json
{
  "data": {
    "chat": {
      "content": "你好！我是通义千问，一个由阿里云开发的大型语言模型...",
      "model": "Qwen/Qwen2.5-7B-Instruct",
      "timestamp": "2025-01-15T10:35:00Z",
      "tokensUsed": 128
    }
  }
}
```

### 输入参数说明

#### ChatInput类型

| 字段 | 类型 | 必需 | 默认值 | 说明 |
|------|------|------|--------|------|
| `prompt` | String | ✅ | - | 用户发送的消息内容 |
| `temperature` | Float | ❌ | 0.7 | 控制回复随机性 (0.0-1.0) |
| `maxTokens` | Int | ❌ | 512 | 最大生成token数量 |
| `topP` | Float | ❌ | 0.7 | Top-p采样参数 |
| `topK` | Int | ❌ | 50 | Top-k采样参数 |
| `frequencyPenalty` | Float | ❌ | 0.5 | 频率惩罚参数 |

### 使用示例

#### JavaScript/TypeScript

```javascript
const response = await fetch('https://your-worker-domain.com/graphql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    query: `
      mutation SendChat($input: ChatInput!) {
        chat(input: $input) {
          content
          model
          timestamp
        }
      }
    `,
    variables: {
      input: {
        prompt: "解释一下什么是GraphQL",
        temperature: 0.8
      }
    }
  })
});

const result = await response.json();
console.log(result.data.chat.content);
```

#### cURL

```bash
curl -X POST https://your-worker-domain.com/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation SendChat($input: ChatInput!) { chat(input: $input) { content model timestamp } }",
    "variables": {
      "input": {
        "prompt": "Hello, world!",
        "temperature": 0.7
      }
    }
  }'
```

### 错误处理

GraphQL标准错误响应格式：

```json
{
  "errors": [
    {
      "message": "Prompt is required and must be a non-empty string",
      "extensions": {
        "code": "BAD_USER_INPUT"
      }
    }
  ]
}
```

常见错误类型：
- `API key not configured`: 环境变量未设置
- `Prompt is required`: 缺少必需的prompt参数
- `SiliconFlow API error`: 上游API调用失败

## 开发配置

### TypeScript配置

项目使用TypeScript 5.5+，配置了严格的类型检查和ES2021目标。完整的GraphQL类型支持。

### 代码格式化

使用Prettier进行代码格式化，配置如下：
- 使用制表符缩进
- 单引号
- 140字符行宽
- 语句末尾分号

### 测试

使用Vitest和Cloudflare Workers测试框架进行单元测试和集成测试。包含GraphQL查询、变更和错误场景的完整测试覆盖。

### GraphQL优势

相比RESTful API，GraphQL提供：

1. **类型安全**: 强类型schema定义，编译时错误检查
2. **精确数据获取**: 客户端指定需要的字段，避免过度获取
3. **单一端点**: 所有操作通过一个URL完成
4. **自文档化**: 内置的introspection和Playground
5. **版本控制**: 通过schema演进而非版本号管理
6. **开发体验**: 丰富的工具生态系统

## 环境变量

- `SILICONFLOW_API_KEY`: SiliconFlow API密钥（必需）

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request！

## 相关链接

- [Cloudflare Workers文档](https://developers.cloudflare.com/workers/)
- [SiliconFlow API文档](https://docs.siliconflow.com/)
- [GraphQL官方文档](https://graphql.org/)
- [GraphQL Yoga文档](https://the-guild.dev/graphql/yoga-server)
- [Wrangler CLI工具](https://developers.cloudflare.com/workers/wrangler/)
