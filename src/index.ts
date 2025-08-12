/**
 * Cloudflare Worker for calling SiliconFlow's Qwen2.5-7B-Instruct model
 * Supports CORS for frontend requests
 * Expects a POST request with a JSON body containing a "prompt" field
 * Requires SILICONFLOW_API_KEY environment variable
 * Returns the model's response as JSON
 */

export default {
    async fetch(request: Request, env: { SILICONFLOW_API_KEY: string }, ctx: ExecutionContext) {
      // 定义 CORS 头
      const corsHeaders = {
        'Access-Control-Allow-Origin': '*', // 允许所有来源，生产环境可改为具体前端域名
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      };
  
      // 处理 OPTIONS 请求（CORS 预检）
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          status: 204,
          headers: corsHeaders,
        });
      }
  
      // 确保是 POST 请求
      if (request.method !== 'POST') {
        return new Response('Method Not Allowed. Use POST.', {
          status: 405,
          headers: corsHeaders,
        });
      }
  
      try {
        // 解析 JSON 请求体
        const body = await request.json() as { prompt: string };
        const userPrompt = body.prompt;
  
        // 验证输入
        if (!userPrompt || typeof userPrompt !== 'string') {
          return new Response('Bad Request: Missing or invalid "prompt" field', {
            status: 400,
            headers: corsHeaders,
          });
        }
  
        // 确保 API 密钥已配置
        const apiKey = env.SILICONFLOW_API_KEY as string;
        if (!apiKey) {
          return new Response('Server Error: API key not configured', {
            status: 500,
            headers: corsHeaders,
          });
        }
  
        // 调用 SiliconFlow 的 Qwen2.5-7B-Instruct 模型
        const response = await fetch('https://api.siliconflow.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'Qwen/Qwen2.5-7B-Instruct',
            messages: [
              { role: 'system', content: 'You are a helpful assistant.' },
              { role: 'user', content: userPrompt },
            ],
            max_tokens: 512,
            temperature: 0.7,
            top_p: 0.7,
            top_k: 50,
            frequency_penalty: 0.5,
            stream: false,
          }),
        });
  
        if (!response.ok) {
          throw new Error(`SiliconFlow API error: ${response.statusText}`);
        }
  
        const data = await response.json() as { choices: { message: { content: string } }[] };
        return new Response(JSON.stringify({ generated_text: data.choices[0].message.content }), {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders, // 确保成功响应包含 CORS 头
          },
        });
      } catch (error) {
        console.error('Error calling SiliconFlow API:', error);
        return new Response(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`, {
          status: 500,
          headers: corsHeaders, // 确保错误响应包含 CORS 头
        });
      }
    },
  };