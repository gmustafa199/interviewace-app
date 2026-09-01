/**
 * TTS endpoint — uses Z.ai SDK if ZAI_API_KEY is set, otherwise returns
 * a "use-browser-tts" signal so the client falls back to Web Speech API.
 *
 * WHY THIS DESIGN:
 * - Google Gemini doesn't include TTS in its SDK
 * - Z.ai SDK requires a key (the dev box has internal creds that don't transfer)
 * - Browser Web Speech API (SpeechSynthesis) is free, built into Chrome/Edge,
 *   and supports Indian English + Hindi voices — perfect for our use case
 * - The client tries our /api/tts first; if it returns {use_browser_tts: true},
 *   the client uses window.speechSynthesis instead
 *
 * TO ENABLE SERVER-SIDE TTS LATER:
 *   - Sign up at Google Cloud → enable Text-to-Speech API → set GOOGLE_TTS_KEY
 *   - OR sign up at z.ai → set ZAI_API_KEY
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

    const truncated = spokenText.slice(0, 800);

    // Check if Z.ai is configured
    const hasZai = !!process.env.ZAI_API_KEY;
    if (!hasZai) {
      // Tell the client to use browser Web Speech API instead.
      // Include the cleaned text + suggested rate so the client can
      // use SpeechSynthesisUtterance with consistent pacing.
      return NextResponse.json({
        use_browser_tts: true,
        text: truncated,
        rate: speed || 0.92,
        pitch: 1.0,
        lang: 'en-IN', // Indian English — falls back to en-US if unavailable
      });
    }

    // Server-side TTS via Z.ai
    const zai = await getZAI();
    const response = await zai.audio.tts.create({
      input: truncated,
      voice: voice || 'tongtong',
      speed: typeof speed === 'number' ? speed : 0.92,
      response_format: 'wav',
      stream: false,
    } as any);

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(new Uint8Array(arrayBuffer));

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/wav',
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'no-store',
      },
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
