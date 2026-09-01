/**
 * TTS endpoint — converts text to speech and returns MP3 audio.
 *
 * Provider priority:
 *   1. Z.ai SDK if ZAI_API_KEY is set (returns audio/wav)
 *   2. Google Translate TTS (free, no key required, decent quality)
 *      → Falls back to browser Web Speech API on failure
 *   3. Browser Web Speech API (last resort, robotic but works offline)
 *
 * WHY GOOGLE TRANSLATE TTS AS DEFAULT:
 * - Free, no API key, no signup
 * - Much more natural than browser SpeechSynthesis (which sounds robotic)
 * - Works server-side so client gets real audio (not browser-dependent)
 * - Caveat: it's an unofficial endpoint — can rate-limit or break
 *   For production: use OpenAI TTS, ElevenLabs, or Google Cloud TTS
 *
 * TO UPGRADE TO PRODUCTION TTS LATER:
 *   - OpenAI: set OPENAI_API_KEY → use /v1/audio/speech (~$0.015/1k chars)
 *   - ElevenLabs: set ELEVENLABS_API_KEY → free 10k chars/month
 *   - Google Cloud TTS: set GOOGLE_TTS_KEY → 4M chars/month free
 */

import { NextRequest, NextResponse } from 'next/server';
import { getZAI } from '@/lib/zai';

export const runtime = 'nodejs';
export const maxDuration = 30;

type RequestBody = {
  text: string;
  voice?: string;
  speed?: number;
};

/* ------------------------------------------------------------------ */
/* Google Translate TTS (free, no key)                                */
/* ------------------------------------------------------------------ */

const GTTTS_ENDPOINT = 'https://translate.google.com/translate_tts';

/**
 * Split text into chunks of <=190 chars on sentence boundaries.
 * Google Translate TTS rejects requests longer than ~200 chars.
 */
function chunkForGoogleTTS(text: string): string[] {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= 190) return [cleaned];

  const sentences = cleaned.match(/[^.!?]+[.!?]*/g) || [cleaned];
  const chunks: string[] = [];
  let current = '';

  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;

    if ((current + ' ' + trimmed).length <= 190) {
      current = current ? `${current} ${trimmed}` : trimmed;
    } else {
      if (current) chunks.push(current);
      if (trimmed.length <= 190) {
        current = trimmed;
      } else {
        // Hard split very long sentences on word boundaries
        const words = trimmed.split(' ');
        let buf = '';
        for (const w of words) {
          if ((buf + ' ' + w).length <= 190) {
            buf = buf ? `${buf} ${w}` : w;
          } else {
            if (buf) chunks.push(buf);
            buf = w;
          }
        }
        if (buf) current = buf;
        else current = '';
      }
    }
  }
  if (current) chunks.push(current);
  return chunks.filter(Boolean);
}

async function fetchGoogleTTS(text: string): Promise<Buffer | null> {
  const chunks = chunkForGoogleTTS(text);
  if (chunks.length === 0) return null;

  const buffers: Buffer[] = [];
  for (const chunk of chunks) {
    const url = `${GTTTS_ENDPOINT}?ie=UTF-8&q=${encodeURIComponent(chunk)}&tl=en&client=tw-ob`;
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 12000);

    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'audio/mpeg, audio/*;q=0.9',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        signal: ctrl.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) {
        // Google rate-limited or blocked — bail and let caller fall back.
        return null;
      }
      const ct = res.headers.get('content-type') || '';
      if (!ct.startsWith('audio/')) return null;

      const ab = await res.arrayBuffer();
      const buf = Buffer.from(new Uint8Array(ab));
      if (buf.length < 100) return null;
      buffers.push(buf);
    } catch {
      clearTimeout(timeout);
      return null;
    }
  }

  if (buffers.length === 0) return null;
  // MP3 streams can be safely byte-concatenated for sequential playback.
  return Buffer.concat(buffers);
}

/* ------------------------------------------------------------------ */
/* Main route                                                         */
/* ------------------------------------------------------------------ */

export async function POST(req: NextRequest) {
  try {
    const body: RequestBody = await req.json();
    const { text, voice, speed } = body;

    if (!text || !text.trim()) {
      return NextResponse.json(
        { error: 'Missing text parameter' },
        { status: 400 }
      );
    }

    // Strip markdown/labels that don't sound good spoken aloud.
    let spokenText = text;
    spokenText = spokenText.replace(/^((Chairman|Member\s*\d*|Interviewer|Panelist)\s*:\s*)/i, '');
    spokenText = spokenText.replace(/\*\*/g, '');
    spokenText = spokenText.replace(/^#+\s*/gm, '');
    spokenText = spokenText.replace(/`([^`]+)`/g, '$1');

    const truncated = spokenText.slice(0, 1500);

    // Check if Z.ai is configured — if so, try Z.ai TTS first.
    const hasZai = !!process.env.ZAI_API_KEY;
    if (hasZai) {
      try {
        const zai = await getZAI();
        const response = await zai.audio.tts.create({
          input: truncated,
          voice: voice || 'tongtong',
          speed: typeof speed === 'number' ? speed : 0.92,
          response_format: 'wav',
          stream: false,
        } as any);

        const contentType = (response as any)?.headers?.get?.('content-type') || '';
        const isAudio = contentType.startsWith('audio/') ||
                        contentType.startsWith('application/octet-stream');
        if (isAudio) {
          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(new Uint8Array(arrayBuffer));
          if (buffer.length >= 1024) {
            return new NextResponse(buffer, {
              status: 200,
              headers: {
                'Content-Type': 'audio/wav',
                'Content-Length': buffer.length.toString(),
                'Cache-Control': 'no-store',
              },
            });
          }
        }
        // else fall through to Google TTS
      } catch {
        // fall through to Google TTS
      }
    }

    // Try Google Translate TTS (free, no key) — much more natural than browser TTS.
    const gttsBuffer = await fetchGoogleTTS(truncated);
    if (gttsBuffer && gttsBuffer.length > 1000) {
      return new NextResponse(gttsBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Length': gttsBuffer.length.toString(),
          'Cache-Control': 'no-store',
        },
      });
    }

    // Last resort: tell the client to use browser Web Speech API.
    return NextResponse.json({
      use_browser_tts: true,
      text: truncated,
      rate: speed || 0.92,
      pitch: 1.0,
      lang: 'en-IN',
    });
  } catch (err: any) {
    console.error('TTS API error:', err);
    // On any error, fall back to browser TTS
    return NextResponse.json({
      use_browser_tts: true,
      text: (await req.json().catch(() => ({}))).text || '',
      rate: 0.92,
      lang: 'en-IN',
      error: err?.message,
    });
  }
}
