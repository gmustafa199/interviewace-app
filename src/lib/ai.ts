/**
 * Unified AI helper — works with Google Gemini (recommended) or Z.ai SDK.
 *
 * WHY GEMINI IS DEFAULT:
 * - $1500 free credits (vs $5 for OpenAI)
 * - Native Google Play integration (perfect for our Android TWA)
 * - Best voice quality via Google Cloud TTS
 * - Same SDK works on server + edge
 *
 * SETUP (on Vercel):
 *   1. Get a free API key at https://aistudio.google.com/app/apikey
 *   2. Add env var: GEMINI_API_KEY=your_key
 *   3. (Optional) GEMINI_MODEL=gemini-1.5-flash (default) or gemini-1.5-pro
 *
 * FALLBACK:
 *   If GEMINI_API_KEY is not set, falls back to Z.ai SDK (dev box only).
 *
 * All public functions return the same shape as z-ai SDK so the API routes
 * don't need to know which provider is active.
 */

import { GoogleGenerativeAI, type GenerationConfig } from '@google/generative-ai';

/* ------------------------------------------------------------------ */
/* Types (compatible with z-ai SDK shape so callers don't change)     */
/* ------------------------------------------------------------------ */

export type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export type ChatCompletionParams = {
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  thinking?: { type: 'enabled' | 'disabled' };
};

export type ChatCompletionResponse = {
  choices: Array<{
    message: { role: string; content: string };
  }>;
};

/* ------------------------------------------------------------------ */
/* Gemini initialization                                              */
/* ------------------------------------------------------------------ */

let _geminiClient: GoogleGenerativeAI | null = null;
let _modelCache: Record<string, any> = {};

function getGeminiClient(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY environment variable is not set. ' +
      'Get a free key at https://aistudio.google.com/app/apikey and add it to your Vercel env vars.'
    );
  }
  if (!_geminiClient) {
    _geminiClient = new GoogleGenerativeAI(apiKey);
  }
  return _geminiClient;
}

function getModel(model?: string) {
  const modelName = model || process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  if (!_modelCache[modelName]) {
    const client = getGeminiClient();
    _modelCache[modelName] = client.getGenerativeModel({ model: modelName });
  }
  return _modelCache[modelName];
}

/* ------------------------------------------------------------------ */
/* Chat completions (Gemini-flavored)                                 */
/* ------------------------------------------------------------------ */

export async function chatCompletion(
  params: ChatCompletionParams
): Promise<ChatCompletionResponse> {
  const model = getModel();
  const messages = params.messages || [];

  // Gemini uses "user" / "model" roles, not "user" / "assistant".
  // System messages get merged into the first user message.
  const systemMsgs = messages.filter((m) => m.role === 'system');
  const systemPrefix = systemMsgs.map((m) => m.content).join('\n\n');
  const convoMessages = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

  // Gemini requires the conversation to start with a user turn.
  // If the first message is "model", prepend a tiny user turn.
  if (convoMessages.length === 0 || convoMessages[0].role !== 'user') {
    convoMessages.unshift({
      role: 'user',
      parts: [{ text: systemPrefix + '\n\n[Begin]' }],
    });
  } else if (systemPrefix) {
    // Merge system prefix into the first user message
    convoMessages[0] = {
      role: 'user',
      parts: [{ text: systemPrefix + '\n\n' + convoMessages[0].parts[0].text }],
    };
  }

  const config: GenerationConfig = {
    temperature: params.temperature ?? 0.7,
    maxOutputTokens: params.max_tokens ?? 1024,
  };

  const result = await model.generateContent({
    contents: convoMessages,
    generationConfig: config,
  });

  const text = result.response.text();

  return {
    choices: [
      {
        message: {
          role: 'assistant',
          content: text,
        },
      },
    ],
  };
}

/* ------------------------------------------------------------------ */
/* Provider detection                                                 */
/* ------------------------------------------------------------------ */

export function getActiveProvider(): 'gemini' | 'zai' | 'none' {
  if (process.env.GEMINI_API_KEY) return 'gemini';
  if (process.env.ZAI_API_KEY) return 'zai';
  // On the dev box, /etc/.z-ai-config exists with built-in credentials.
  // Check if it's there so dev mode keeps working without env vars.
  try {
    const fs = require('fs');
    if (
      fs.existsSync('/etc/.z-ai-config') ||
      fs.existsSync(`${process.env.HOME}/.z-ai-config`) ||
      fs.existsSync(`${process.cwd()}/.z-ai-config`)
    ) {
      return 'zai';
    }
  } catch {}
  return 'none';
}

/* ------------------------------------------------------------------ */
/* Unified chat — picks Gemini or Z.ai based on env vars              */
/* ------------------------------------------------------------------ */

export async function unifiedChat(
  params: ChatCompletionParams
): Promise<ChatCompletionResponse> {
  const provider = getActiveProvider();

  if (provider === 'gemini') {
    return chatCompletion(params);
  }

  if (provider === 'zai') {
    // Dynamic import so the z-ai SDK isn't bundled into the Gemini build
    const { getZAI } = await import('./zai');
    const zai = await getZAI();
    const completion = await zai.chat.completions.create({
      messages: params.messages as any,
      temperature: params.temperature,
      // @ts-ignore
      max_tokens: params.max_tokens,
      thinking: params.thinking || { type: 'disabled' },
    } as any);
    return completion as ChatCompletionResponse;
  }

  throw new Error(
    'No AI provider configured. Set either GEMINI_API_KEY or ZAI_API_KEY environment variable.'
  );
}
