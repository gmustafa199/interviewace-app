/**
 * Unified AI helper — supports Groq (recommended free), OpenAI, Gemini, Z.ai.
 *
 * PROVIDER PRIORITY (set whichever env vars you have; first match wins):
 *   1. GROQ_API_KEY  → Groq  (FREE 1,000 RPD on Llama 3.3 70B, OpenAI-compatible)
 *   2. OPENAI_API_KEY → OpenAI (gpt-4o-mini, ~$0.01/interview)
 *   3. GEMINI_API_KEY → Gemini (gemini-3-flash, 1,500 RPD free)
 *   4. ZAI_API_KEY   → Z.ai SDK (dev box fallback)
 *
 * RECOMMENDED FOR FREE USE:
 *   - Get a free Groq key at https://console.groq.com/keys (Google login, no card)
 *   - Set GROQ_API_KEY env var → defaults to llama-3.3-70b-versatile
 *   - 1,000 requests/day free; switch to OPENAI_API_KEY if you outgrow it
 *
 * All public functions return the same shape (OpenAI-compatible ChatCompletionResponse)
 * so the API routes don't need to know which provider is active.
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
  // Default to gemini-3.6-flash (current model as of 2026). Override via
  // GEMINI_MODEL env var if you need a different model.
  // NOTE: gemini-1.5-flash, gemini-2.0-flash, and gemini-2.5-flash have
  // all been deprecated/removed by Google — use gemini-3.6-flash or
  // gemini-3.6-pro instead.
  const modelName = model || process.env.GEMINI_MODEL || 'gemini-3.6-flash';
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
    maxOutputTokens: params.max_tokens ?? 2048, // was 1024 — caused mid-sentence truncation
  };

  // Retry on transient errors (503 high demand, 500 internal, network blips).
  // Gemini's free tier occasionally returns 503 "Service Unavailable" under load.
  //
  // IMPORTANT: Do NOT retry on 429 "Too Many Requests" — retrying just burns
  // the quota faster. Fail fast and let the user know to wait.
  //
  // Vercel Hobby plan limits functions to 60s, Pro to 300s. With 2 retries and
  // 1s+2s backoff, worst case = 1s + 2s + 3×Gemini-response ≈ 15s. Safe.
  const MAX_RETRIES = 2;
  const INITIAL_DELAY_MS = 1000;
  let lastError: any = null;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
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
    } catch (err: any) {
      lastError = err;
      const msg = String(err?.message || '');
      // 429 = quota exceeded — don't retry, just fail with a friendly message.
      if (/429|Too Many Requests|quota/i.test(msg)) {
        throw new Error(
          'AI service quota exceeded. Gemini free tier allows 20 requests/minute. ' +
          'Please wait 60 seconds and try again, or upgrade to a paid tier. ' +
          'Original error: ' + msg
        );
      }
      // Retry on 503 (high demand), 500, or network errors.
      const isRetryable =
        /503|Service Unavailable|high demand|fetch failed|ECONNRESET|ETIMEDOUT|internal/i.test(
          msg
        );
      if (!isRetryable || attempt === MAX_RETRIES) throw err;
      // Exponential backoff: 1s, 2s
      const delay = INITIAL_DELAY_MS * Math.pow(2, attempt - 1);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  // Should never reach here, but just in case:
  throw lastError || new Error('Unknown error in chatCompletion');
}

/* ------------------------------------------------------------------ */
/* Provider detection                                                 */
/* ------------------------------------------------------------------ */

export function getActiveProvider(): 'groq' | 'openai' | 'gemini' | 'zai' | 'none' {
  if (process.env.GROQ_API_KEY) return 'groq';
  if (process.env.OPENAI_API_KEY) return 'openai';
  if (process.env.GEMINI_API_KEY) return 'gemini';
  if (process.env.ZAI_API_KEY) return 'zai';
  // On the dev box, /etc/.z-ai-config exists with built-in credentials.
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
/* OpenAI-compatible chat (used by Groq + OpenAI + any compatible)    */
/* ------------------------------------------------------------------ */

async function openaiCompatibleChat(
  params: ChatCompletionParams,
  opts: {
    apiKey: string;
    baseUrl: string;
    model: string;
    retryOn429?: boolean; // OpenAI: yes (rate-limited, retried with backoff). Groq: no (hard daily cap).
  }
): Promise<ChatCompletionResponse> {
  const body: any = {
    model: opts.model,
    messages: params.messages,
    temperature: params.temperature ?? 0.7,
    max_tokens: params.max_tokens ?? 2048,
  };

  const MAX_RETRIES = 2;
  const INITIAL_DELAY_MS = 1500;
  let lastError: any = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(`${opts.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${opts.apiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errText = await res.text();
        const status = res.status;
        const isRetryable =
          (opts.retryOn429 && status === 429) || status === 500 || status === 503;
        if (isRetryable && attempt < MAX_RETRIES) {
          await new Promise((r) =>
            setTimeout(r, INITIAL_DELAY_MS * Math.pow(2, attempt - 1))
          );
          continue;
        }
        throw new Error(
          `${opts.baseUrl} API error ${status}: ${errText.slice(0, 500)}`
        );
      }

      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content || '';
      return {
        choices: [{ message: { role: 'assistant', content } }],
      };
    } catch (err: any) {
      lastError = err;
      const msg = String(err?.message || '');
      const isRetryable =
        /fetch failed|ECONNRESET|ETIMEDOUT|503|internal/i.test(msg);
      if (!isRetryable || attempt === MAX_RETRIES) throw err;
      await new Promise((r) =>
        setTimeout(r, INITIAL_DELAY_MS * Math.pow(2, attempt - 1))
      );
    }
  }
  throw lastError || new Error('Unknown error in openaiCompatibleChat');
}

/* ------------------------------------------------------------------ */
/* OpenAI chat (gpt-4o-mini by default)                                */
/* ------------------------------------------------------------------ */

async function openaiChatCompletion(
  params: ChatCompletionParams
): Promise<ChatCompletionResponse> {
  return openaiCompatibleChat(params, {
    apiKey: process.env.OPENAI_API_KEY!,
    baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    retryOn429: true,
  });
}

/* ------------------------------------------------------------------ */
/* Groq chat — auto-detects an available model from a fallback chain   */
/* ------------------------------------------------------------------ */

// Models to try in order. As of late 2026, Groq reorganized:
//   - llama-3.3-70b-versatile → moved to Enterprise tier (paid)
//   - openai/gpt-oss-120b → new free-tier flagship (GPT-OSS, 120B, 1K RPM)
//   - openai/gpt-oss-20b → smaller/faster GPT-OSS variant (1K RPM)
//   - llama-3.1-8b-instant → legacy, always available on Developer plan
// User can override via GROQ_MODEL env var.
const GROQ_MODEL_FALLBACKS = [
  'openai/gpt-oss-120b',     // newest, most capable, 1K RPM free
  'openai/gpt-oss-20b',      // smaller/faster, 1K RPM free
  'llama-3.1-8b-instant',    // legacy 8B, always available
  'llama-3.3-70b-versatile', // enterprise-only as of 2026, may work for some accounts
];

async function groqChatCompletion(
  params: ChatCompletionParams
): Promise<ChatCompletionResponse> {
  const userModels = process.env.GROQ_MODEL
    ? [process.env.GROQ_MODEL, ...GROQ_MODEL_FALLBACKS]
    : GROQ_MODEL_FALLBACKS;

  let lastError: any = null;
  for (const model of userModels) {
    try {
      return await openaiCompatibleChat(params, {
        apiKey: process.env.GROQ_API_KEY!,
        baseUrl: 'https://api.groq.com/openai/v1',
        model,
        retryOn429: false,
      });
    } catch (err: any) {
      lastError = err;
      const msg = String(err?.message || '');
      // If this model is unavailable (404 model_not_found), try the next one.
      // Don't retry the same model name — just move on.
      if (/model_not_found|does not exist|do not have access/i.test(msg)) {
        continue;
      }
      // For other errors (auth, rate limit, network), throw — don't waste
      // time trying more models that will likely fail the same way.
      throw err;
    }
  }
  throw lastError || new Error('All Groq models failed');
}

/* ------------------------------------------------------------------ */
/* Unified chat — picks Groq / OpenAI / Gemini / Z.ai based on env vars */
/* ------------------------------------------------------------------ */

export async function unifiedChat(
  params: ChatCompletionParams
): Promise<ChatCompletionResponse> {
  const provider = getActiveProvider();

  if (provider === 'groq') {
    return groqChatCompletion(params);
  }

  if (provider === 'openai') {
    return openaiChatCompletion(params);
  }

  if (provider === 'gemini') {
    return chatCompletion(params);
  }

  if (provider === 'zai') {
    const { getZAI } = await import('./zai');
    const zai = await getZAI();
    const zaiModel = process.env.ZAI_MODEL || 'glm-5.3-flash';
    const completion = await zai.chat.completions.create({
      model: zaiModel,
      messages: params.messages as any,
      temperature: params.temperature,
      // @ts-ignore
      max_tokens: params.max_tokens,
      thinking: params.thinking || { type: 'disabled' },
    } as any);
    return completion as ChatCompletionResponse;
  }

  throw new Error(
    'No AI provider configured. Set one of: ' +
    'GROQ_API_KEY (recommended, FREE 1000 req/day at https://console.groq.com/keys), ' +
    'OPENAI_API_KEY (~$0.01/interview), ' +
    'GEMINI_API_KEY (1500 RPD free), or ' +
    'ZAI_API_KEY.'
  );
}
