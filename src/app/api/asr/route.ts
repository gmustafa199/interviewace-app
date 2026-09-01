/**
 * ASR endpoint — uses Z.ai SDK if ZAI_API_KEY is set, otherwise returns
 * an error and the client falls back to browser Web Speech API.
 *
 * Browser fallback: the client uses webkitSpeechRecognition (Chrome/Edge)
 * which is free and supports Indian English + Hindi.
 *
 * To enable server-side ASR later: set ZAI_API_KEY or GOOGLE_ASR_KEY.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getZAI } from '@/lib/zai';

export const runtime = 'nodejs';
export const maxDuration = 30;

type RequestBody = {
  audio_base64: string;
};

export async function POST(req: NextRequest) {
  try {
    const body: RequestBody = await req.json();
    const { audio_base64 } = body;

    if (!audio_base64) {
      return NextResponse.json(
        { error: 'Missing audio_base64 parameter' },
        { status: 400 }
      );
    }

    const hasZai = !!process.env.ZAI_API_KEY;
    if (!hasZai) {
      return NextResponse.json(
        {
          error: 'Server-side ASR not configured. Use browser Web Speech API instead.',
          use_browser_asr: true,
        },
        { status: 501 }
      );
    }

    const zai = await getZAI();
    const response: any = await zai.audio.asr.create({
      file_base64: audio_base64,
    } as any);

    const text = response?.text || response?.choices?.[0]?.message?.content || '';
    if (!text) {
      return NextResponse.json(
        { error: 'Could not transcribe audio' },
        { status: 500 }
      );
    }

    return NextResponse.json({ text });
  } catch (err: any) {
    console.error('ASR API error:', err);
    return NextResponse.json(
      {
        error: err?.message || 'Failed to transcribe audio',
        use_browser_asr: true,
      },
      { status: 500 }
    );
  }
}
