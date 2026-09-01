/**
 * ZAI SDK helper.
 *
 * Why this exists:
 * The z-ai-web-dev-sdk's `ZAI.create()` reads credentials from a
 * `.z-ai-config` file located at:
 *   1. process.cwd()/.z-ai-config
 *   2. ~/.z-ai-config
 *   3. /etc/.z-ai-config
 *
 * On the dev server, /etc/.z-ai-config exists (managed by the platform).
 * On Vercel (or any other host), that file doesn't exist, and the project
 * directory is read-only.
 *
 * Solution: read from env vars if present, and construct the ZAI instance
 * directly with `new ZAI(config)`. Falls back to ZAI.create() for local dev.
 *
 * REQUIRED ENV VARS ON VERCEL (or any production host):
 *   ZAI_API_KEY   - public API key from https://docs.z.ai (sign up → API Keys page)
 *   ZAI_BASE_URL  - usually "https://api.z.ai/api/v1" (defaults to this)
 *   ZAI_MODEL     - optional, defaults to "glm-5.3-flash"
 *                 (other options: glm-5.3, glm-5-turbo)
 */

import ZAI, { type ZAIConfig } from 'z-ai-web-dev-sdk';

let cachedInstance: ZAI | null = null;

export async function getZAI(): Promise<ZAI> {
  if (cachedInstance) return cachedInstance;

  const apiKey = process.env.ZAI_API_KEY;
  // Public Z.ai API endpoint (per https://docs.z.ai)
  const baseUrl = process.env.ZAI_BASE_URL || 'https://api.z.ai/api/v1';

  if (apiKey && baseUrl) {
    // Production path — use env vars directly.
    const model = process.env.ZAI_MODEL || 'glm-5.3-flash';
    const config: ZAIConfig = {
      baseUrl,
      apiKey,
      model,
      ...(process.env.ZAI_CHAT_ID ? { chatId: process.env.ZAI_CHAT_ID } : {}),
      ...(process.env.ZAI_USER_ID ? { userId: process.env.ZAI_USER_ID } : {}),
    };
    cachedInstance = new ZAI(config);
    return cachedInstance;
  }

  // Dev path — fall back to file-based config (the SDK will find
  // /etc/.z-ai-config on the dev server).
  cachedInstance = await ZAI.create();
  return cachedInstance;
}
