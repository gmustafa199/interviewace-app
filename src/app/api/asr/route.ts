/**
 * ASR endpoint — server-side speech-to-text for the UPSC GS Master APK
 * (Android WebView has NO Web Speech API, so recorded audio MUST be
 * transcribed on the server).
 *
 * Provider chain (first match wins):
 *   1. Z.ai ASR            — if ZAI_API_KEY is set (dev machine)
 *   2. Groq Whisper        — if GROQ_API_KEY is set (production: free tier,
 *                             whisper-large-v3-turbo, understands Indian English)
 *   3. 501 + use_browser_asr — client falls back to webkitSpeechRecognition
 *
 * Accepts { audio_base64, format } where format is the recording container:
 * 'webm' | 'ogg' | 'mp4' | 'm4a' | 'wav'. MediaRecorder in WebView produces
 * audio/webm;codecs=opus (Chromium) or audio/mp4 (some OEM WebViews) — both
 * are supported by Groq.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getZAI } from '@/lib/zai';

export const runtime = 'nodejs';
export const maxDuration = 30;

type RequestBody = {
  audio_base64: string;
  format?: string;
};

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
} as const;

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

function normalizeFormat(format?: string): string {
  const f = (format || 'webm').toLowerCase().trim();
  if (f.includes('webm')) return 'webm';
  if (f.includes('ogg')) return 'ogg';
  if (f.includes('mp4') || f.includes('m4a') || f.includes('aac')) return 'mp4';
  if (f.includes('wav')) return 'wav';
  if (f.includes('mp3') || f.includes('mpeg')) return 'mp3';
  return 'webm';
}

const MIME_BY_FORMAT: Record<string, string> = {
  webm: 'audio/webm',
  ogg: 'audio/ogg',
  mp4: 'audio/mp4',
  wav: 'audio/wav',
  mp3: 'audio/mpeg',
};

/* ------------------------------------------------------------------ */
/* Provider 2 — Groq Whisper (free tier, production path)              */
/* ------------------------------------------------------------------ */

async function transcribeWithGroq(
  buf: Buffer,
  format: string
): Promise<string | null> {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;

  const ext = format === 'mp4' ? 'm4a' : format;
  const mime = MIME_BY_FORMAT[format] || 'audio/webm';

  const form = new FormData();
  form.append(
    'file',
    new Blob([new Uint8Array(buf)], { type: mime }),
    `recording.${ext}`
  );
  form.append('model', 'whisper-large-v3-turbo');
  form.append('language', 'en');
  form.append('response_format', 'json');
  form.append('temperature', '0');

  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), 25000);

  try {
    const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}` },
      body: form,
      signal: ctrl.signal,
    });
    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      console.error('Groq ASR error:', res.status, errBody.slice(0, 300));
      return null;
    }
    const data: any = await res.json();
    const text = (data?.text || '').trim();
    return text || null;
  } catch (e) {
    console.error('Groq ASR request failed:', e);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/* ------------------------------------------------------------------ */
/* Main route                                                          */
/* ------------------------------------------------------------------ */

export async function POST(req: NextRequest) {
  try {
    const body: RequestBody = await req.json();
    const { audio_base64 } = body;

    if (!audio_base64) {
      return NextResponse.json(
        { error: 'Missing audio_base64 parameter' },
        { status: 400, headers: CORS }
      );
    }

    const format = normalizeFormat(body.format);
    const buf = Buffer.from(audio_base64, 'base64');

    if (buf.length < 800) {
      return NextResponse.json(
        { error: 'Recording too short', use_browser_asr: true },
        { status: 400, headers: CORS }
      );
    }

    // Provider 1 — Z.ai ASR (dev machine)
    if (process.env.ZAI_API_KEY) {
      try {
        const zai = await getZAI();
        const response: any = await zai.audio.asr.create({
          file_base64: audio_base64,
        } as any);
        const text = response?.text || response?.choices?.[0]?.message?.content || '';
        if (text) {
          return NextResponse.json({ text, provider: 'zai' }, { headers: CORS });
        }
      } catch (e: any) {
        console.error('ZAI ASR failed, trying Groq:', e?.message);
      }
    }

    // Provider 2 — Groq Whisper (production)
    const groqText = await transcribeWithGroq(buf, format);
    if (groqText) {
      return NextResponse.json(
        { text: groqText, provider: 'groq' },
        { headers: CORS }
      );
    }

    // No provider succeeded — browser fallback (Chrome browsers only)
    return NextResponse.json(
      {
        error: 'Server-side ASR unavailable. Use browser Web Speech API instead.',
        use_browser_asr: true,
      },
      { status: 501, headers: CORS }
    );
  } catch (err: any) {
    console.error('ASR API error:', err);
    return NextResponse.json(
      {
        error: err?.message || 'Failed to transcribe audio',
        use_browser_asr: true,
      },
      { status: 500, headers: CORS }
    );
  }
}
