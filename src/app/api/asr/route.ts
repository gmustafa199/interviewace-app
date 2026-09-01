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
      { error: err?.message || 'Failed to transcribe audio' },
      { status: 500 }
    );
  }
}
