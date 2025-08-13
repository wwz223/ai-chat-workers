/**
 * Cloudflare Worker GraphQL服务
 * 使用原生GraphQL调用SiliconFlow的Qwen2.5-7B-Instruct模型
 * 支持CORS，提供GraphQL查询、变更操作
 * 需要SILICONFLOW_API_KEY环境变量
 */

import { buildSchema, graphql } from 'graphql';
import { typeDefs } from './schema';
import { resolvers } from './resolvers';

// 定义环境类型
interface Env {
	SILICONFLOW_API_KEY: string;
}

// 构建GraphQL Schema
const schema = buildSchema(typeDefs);

// GraphQL Playground HTML
const playgroundHTML = `
<!DOCTYPE html>
<html>
<head>
  <title>GraphQL Playground</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/graphql-playground-react/build/static/css/index.css">
</head>
<body>
  <div id="root"></div>
  <script src="https://cdn.jsdelivr.net/npm/graphql-playground-react/build/static/js/middleware.js"></script>
  <script>
    GraphQLPlayground.init(document.getElementById('root'), {
      endpoint: '/graphql'
    })
  </script>
</body>
</html>
`;

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

			// 处理GET请求 - 返回GraphQL Playground
			if (request.method === 'GET') {
				return new Response(playgroundHTML, {
					headers: {
						'Content-Type': 'text/html',
						...corsHeaders,
					},
				});
			}

			// 处理POST请求 - 执行GraphQL查询
			if (request.method === 'POST') {
				const contentType = request.headers.get('content-type');
				if (!contentType || !contentType.includes('application/json')) {
					return new Response(
						JSON.stringify({
							errors: [{ message: 'Content-Type must be application/json' }],
						}),
						{
							status: 400,
							headers: {
								'Content-Type': 'application/json',
								...corsHeaders,
							},
						}
					);
				}

				let body;
				try {
					body = await request.json();
				} catch (error) {
					return new Response(
						JSON.stringify({
							errors: [{ message: 'Invalid JSON in request body' }],
						}),
						{
							status: 400,
							headers: {
								'Content-Type': 'application/json',
								...corsHeaders,
							},
						}
					);
				}

				const { query, variables = {} } = body;

				if (!query) {
					return new Response(
						JSON.stringify({
							errors: [{ message: 'Missing query in request body' }],
						}),
						{
							status: 400,
							headers: {
								'Content-Type': 'application/json',
								...corsHeaders,
							},
						}
					);
				}

				// 执行GraphQL查询
				const context = { env };

				// 构建root resolver
				const rootResolver = {
					// Query resolvers
					status: resolvers.Query.status,
					supportedModels: resolvers.Query.supportedModels,

					// Mutation resolvers
					chat: (args: any) => resolvers.Mutation.chat(null, args, context),

					// Subscription resolvers
					chatStream: resolvers.Subscription.chatStream,
				};

				const result = await graphql({
					schema,
					source: query,
					variableValues: variables,
					contextValue: context,
					rootValue: rootResolver,
				});

				return new Response(JSON.stringify(result), {
					headers: {
						'Content-Type': 'application/json',
						...corsHeaders,
					},
				});
			}

			// 不支持的方法
			return new Response('Method not allowed', {
				status: 405,
				headers: corsHeaders,
			});
		} catch (error) {
			console.error('Worker error:', error);

			return new Response(
				JSON.stringify({
					errors: [
						{
							message: error instanceof Error ? error.message : 'Internal server error',
							extensions: { code: 'INTERNAL_ERROR' },
						},
					],
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
