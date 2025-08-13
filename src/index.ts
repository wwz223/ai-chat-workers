/**
 * Cloudflare Worker GraphQL服务
 * 使用GraphQL调用SiliconFlow的Qwen2.5-7B-Instruct模型
 * 支持CORS，提供GraphQL查询、变更和订阅操作
 * 需要SILICONFLOW_API_KEY环境变量
 */

import { createYoga } from 'graphql-yoga';
import { typeDefs } from './schema';
import { resolvers } from './resolvers';

// 定义环境类型
interface Env {
  SILICONFLOW_API_KEY: string;
}

// 创建GraphQL Yoga服务器
const yoga = createYoga({
  schema: {
    typeDefs,
    resolvers,
  },
  // 启用GraphQL Playground（开发环境）
  graphiql: true,
  // CORS配置
  cors: {
    origin: '*', // 生产环境建议设置为具体的前端域名
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  },
  // 自定义context
  context: async ({ request, env }) => ({
    request,
    env,
  }),
  // 错误处理
  maskedErrors: false, // 开发环境显示详细错误，生产环境建议设为true
});

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      // 设置CORS头部
      const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true',
      };

      // 处理OPTIONS预检请求
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          status: 204,
          headers: corsHeaders,
        });
      }

      // 检查环境变量
      if (!env.SILICONFLOW_API_KEY) {
        return new Response(
          JSON.stringify({
            errors: [{ message: 'Server configuration error: API key not found' }],
          }),
          {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          }
        );
      }

      // 将env添加到request对象供GraphQL使用
      (request as any).env = env;

      // 委托给GraphQL Yoga处理
      const response = await yoga.fetch(request, env, ctx);

      // 确保响应包含CORS头
      const newResponse = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: {
          ...Object.fromEntries(response.headers.entries()),
          ...corsHeaders,
        },
      });

      return newResponse;
    } catch (error) {
      console.error('Worker error:', error);
      
      return new Response(
        JSON.stringify({
          errors: [{ 
            message: error instanceof Error ? error.message : 'Internal server error',
            extensions: { code: 'INTERNAL_ERROR' }
          }],
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        }
      );
    }
  },
};