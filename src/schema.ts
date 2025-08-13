/**
 * GraphQL Schema定义
 * 定义AI聊天服务的查询和变更操作
 */

export const typeDefs = /* GraphQL */ `
  """
  AI聊天消息输入类型
  """
  input ChatInput {
    """
    用户发送的消息内容
    """
    prompt: String!
    
    """
    对话的温度参数，控制回复的随机性 (0.0-1.0)
    """
    temperature: Float = 0.7
    
    """
    最大生成token数量
    """
    maxTokens: Int = 512
    
    """
    Top-p采样参数
    """
    topP: Float = 0.7
    
    """
    Top-k采样参数
    """
    topK: Int = 50
    
    """
    频率惩罚参数
    """
    frequencyPenalty: Float = 0.5
  }

  """
  AI聊天响应类型
  """
  type ChatResponse {
    """
    AI生成的回复内容
    """
    content: String!
    
    """
    使用的AI模型名称
    """
    model: String!
    
    """
    生成时间戳
    """
    timestamp: String!
    
    """
    生成的token数量
    """
    tokensUsed: Int
  }

  """
  错误信息类型
  """
  type Error {
    """
    错误消息
    """
    message: String!
    
    """
    错误代码
    """
    code: String!
  }

  """
  服务状态信息
  """
  type ServiceStatus {
    """
    服务是否正常运行
    """
    healthy: Boolean!
    
    """
    当前使用的AI模型
    """
    model: String!
    
    """
    服务版本
    """
    version: String!
    
    """
    上次检查时间
    """
    lastCheck: String!
  }

  """
  查询操作
  """
  type Query {
    """
    检查服务状态
    """
    status: ServiceStatus!
    
    """
    获取支持的AI模型列表
    """
    supportedModels: [String!]!
  }

  """
  变更操作
  """
  type Mutation {
    """
    发送聊天消息并获取AI回复
    """
    chat(input: ChatInput!): ChatResponse!
  }

  """
  订阅操作（为将来的流式响应预留）
  """
  type Subscription {
    """
    流式聊天响应
    """
    chatStream(input: ChatInput!): ChatResponse!
  }
`;
