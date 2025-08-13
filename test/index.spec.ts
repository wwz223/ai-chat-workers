import { env, createExecutionContext, waitOnExecutionContext, SELF } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';
import worker from '../src/index';
import { ServiceStatus } from '../src/types';

// GraphQL测试工具类型
const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

describe('AI Chat Workers GraphQL API', () => {
	const testEnv = {
		SILICONFLOW_API_KEY: 'test-key-12345'
	};

	describe('GraphQL Introspection', () => {
		it('should respond to GraphQL introspection query', async () => {
			const introspectionQuery = {
				query: `
					query IntrospectionQuery {
						__schema {
							types {
								name
							}
						}
					}
				`
			};

			const request = new IncomingRequest('http://example.com/graphql', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(introspectionQuery),
			});

			const ctx = createExecutionContext();
			const response = await worker.fetch(request, testEnv, ctx);
			await waitOnExecutionContext(ctx);

			expect(response.status).toBe(200);
			const result = await response.json() as { data: { __schema: { types: { name: string }[] } } };
			expect(result.data.__schema).toBeDefined();
		});
	});

	describe('Status Query', () => {
		it('should return service status', async () => {
			const statusQuery = {
				query: `
					query GetStatus {
						status {
							healthy
							model
							version
							lastCheck
						}
					}
				`
			};

			const request = new IncomingRequest('http://example.com/graphql', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(statusQuery),
			});

			const ctx = createExecutionContext();
			const response = await worker.fetch(request, testEnv, ctx);
			await waitOnExecutionContext(ctx);

			expect(response.status).toBe(200);
			const result = await response.json() as { data: { status: ServiceStatus } };
			expect(result.data.status.healthy).toBe(true);
			expect(result.data.status.model).toBe('Qwen/Qwen2.5-7B-Instruct');
			expect(result.data.status.version).toBe('1.0.0');
		});
	});

	describe('Supported Models Query', () => {
		it('should return list of supported models', async () => {
			const modelsQuery = {
				query: `
					query GetSupportedModels {
						supportedModels
					}
				`
			};

			const request = new IncomingRequest('http://example.com/graphql', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(modelsQuery),
			});

			const ctx = createExecutionContext();
			const response = await worker.fetch(request, testEnv, ctx);
			await waitOnExecutionContext(ctx);

			expect(response.status).toBe(200);
			const result = await response.json() as { data: { supportedModels: string[] } };
			expect(result.data.supportedModels).toContain('Qwen/Qwen2.5-7B-Instruct');
		});
	});

	describe('Chat Mutation', () => {
		it('should handle chat mutation with missing API key', async () => {
			const chatMutation = {
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
						prompt: "Hello, how are you?"
					}
				}
			};

			const request = new IncomingRequest('http://example.com/graphql', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(chatMutation),
			});

			const ctx = createExecutionContext();
			const response = await worker.fetch(request, {}, ctx); // 没有API key
			await waitOnExecutionContext(ctx);

			expect(response.status).toBe(500);
			const result = await response.json() as { errors: { message: string }[] };
			expect(result.errors[0].message).toContain('API key not found');
		});

		it('should handle chat mutation with invalid prompt', async () => {
			const chatMutation = {
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
						prompt: ""
					}
				}
			};

			const request = new IncomingRequest('http://example.com/graphql', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(chatMutation),
			});

			const ctx = createExecutionContext();
			const response = await worker.fetch(request, testEnv, ctx);
			await waitOnExecutionContext(ctx);

			expect(response.status).toBe(200);
			const result = await response.json() as { errors: { message: string }[] };
			expect(result.errors[0].message).toContain('non-empty string');
		});
	});

	describe('CORS Support', () => {
		it('should handle OPTIONS preflight request', async () => {
			const request = new IncomingRequest('http://example.com/graphql', {
				method: 'OPTIONS',
				headers: {
					'Origin': 'http://localhost:3000',
					'Access-Control-Request-Method': 'POST',
					'Access-Control-Request-Headers': 'Content-Type',
				},
			});

			const ctx = createExecutionContext();
			const response = await worker.fetch(request, testEnv, ctx);
			await waitOnExecutionContext(ctx);

			expect(response.status).toBe(204);
			expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
			expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST');
		});
	});

	describe('GraphQL Playground', () => {
		it('should serve GraphQL playground on GET request', async () => {
			const request = new IncomingRequest('http://example.com/graphql', {
				method: 'GET',
				headers: {
					'Accept': 'text/html',
				},
			});

			const ctx = createExecutionContext();
			const response = await worker.fetch(request, testEnv, ctx);
			await waitOnExecutionContext(ctx);

			expect(response.status).toBe(200);
			expect(response.headers.get('Content-Type')).toContain('text/html');
		});
	});
});
