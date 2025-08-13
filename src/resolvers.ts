/**
 * GraphQL Resolvers
 * 实现GraphQL查询和变更的具体逻辑
 */

import type { 
  QueryResolvers, 
  MutationResolvers, 
  SubscriptionResolvers 
} from './types';

interface SiliconFlowResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  usage?: {
    total_tokens?: number;
  };
}

interface Context {
  env: {
    SILICONFLOW_API_KEY: string;
  };
}

const MODEL_NAME = 'Qwen/Qwen2.5-7B-Instruct';
const API_VERSION = '1.0.0';

/**
 * 调用SiliconFlow AI API
 */
async function callSiliconFlowAPI(
  prompt: string,
  apiKey: string,
  options: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    topK?: number;
    frequencyPenalty?: number;
  } = {}
): Promise<SiliconFlowResponse> {
  const {
    temperature = 0.7,
    maxTokens = 512,
    topP = 0.7,
    topK = 50,
    frequencyPenalty = 0.5
  } = options;

  const response = await fetch('https://api.siliconflow.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL_NAME,
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: maxTokens,
      temperature,
      top_p: topP,
      top_k: topK,
      frequency_penalty: frequencyPenalty,
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`SiliconFlow API error: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<SiliconFlowResponse>;
}

/**
 * Query resolvers
 */
const Query: QueryResolvers = {
  status: () => ({
    healthy: true,
    model: MODEL_NAME,
    version: API_VERSION,
    lastCheck: new Date().toISOString(),
  }),

  supportedModels: () => [MODEL_NAME],
};

/**
 * Mutation resolvers
 */
const Mutation: MutationResolvers = {
  chat: async (_, { input }, context: Context) => {
    const { env } = context;
    
    // 验证API密钥
    if (!env.SILICONFLOW_API_KEY) {
      throw new Error('API key not configured');
    }

    // 验证输入
    if (!input.prompt || typeof input.prompt !== 'string' || input.prompt.trim().length === 0) {
      throw new Error('Prompt is required and must be a non-empty string');
    }

    try {
      // 调用AI API
      const result = await callSiliconFlowAPI(input.prompt, env.SILICONFLOW_API_KEY, {
        temperature: input.temperature,
        maxTokens: input.maxTokens,
        topP: input.topP,
        topK: input.topK,
        frequencyPenalty: input.frequencyPenalty,
      });

      // 检查响应
      if (!result.choices || result.choices.length === 0) {
        throw new Error('No response generated from AI model');
      }

      const content = result.choices[0].message.content;
      if (!content) {
        throw new Error('Empty response from AI model');
      }

      return {
        content,
        model: MODEL_NAME,
        timestamp: new Date().toISOString(),
        tokensUsed: result.usage?.total_tokens || null,
      };
    } catch (error) {
      console.error('Error in chat resolver:', error);
      throw new Error(error instanceof Error ? error.message : 'Unknown error occurred');
    }
  },
};

/**
 * Subscription resolvers (为将来扩展预留)
 */
const Subscription: SubscriptionResolvers = {
  chatStream: {
    // TODO: 实现流式响应
    subscribe: () => {
      throw new Error('Streaming not implemented yet');
    },
  },
};

export const resolvers = {
  Query,
  Mutation,
  Subscription,
};
