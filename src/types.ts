/**
 * GraphQL类型定义
 * 为resolvers提供TypeScript类型支持
 */

export interface ChatInput {
  prompt: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  topK?: number;
  frequencyPenalty?: number;
}

export interface ChatResponse {
  content: string;
  model: string;
  timestamp: string;
  tokensUsed?: number | null;
}

export interface ServiceStatus {
  healthy: boolean;
  model: string;
  version: string;
  lastCheck: string;
}

export interface Error {
  message: string;
  code: string;
}

// Context类型
export interface Context {
  env: {
    SILICONFLOW_API_KEY: string;
  };
}

// Resolver类型定义
export interface QueryResolvers {
  status: () => ServiceStatus;
  supportedModels: () => string[];
}

export interface MutationResolvers {
  chat: (
    parent: any,
    args: { input: ChatInput },
    context: Context
  ) => Promise<ChatResponse>;
}

export interface SubscriptionResolvers {
  chatStream: {
    subscribe: (
      parent: any,
      args: { input: ChatInput },
      context: Context
    ) => any;
  };
}
