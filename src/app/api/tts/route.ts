import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

export const runtime = 'nodejs';
export const maxDuration = 30;

type RequestBody = {
  text: string;
  voice?: string;
};

export async function POST(req: NextRequest) {
  try {
    const body: RequestBody = await req.json();
    const { text, voice } = body;

    if (!text || !text.trim()) {
      return NextResponse.json(
        { error: 'Missing text parameter' },
        { status: 400 }
      );
    }

    const zai = await ZAI.create();

    const response = await zai.audio.tts.create({
      input: text.slice(0, 1000), // cap to 1000 chars to keep responses fast
      voice: voice || 'tongtong',
      response_format: 'wav',
      stream: false,
    } as any);

    // response is a fetch Response — get the audio bytes
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
    return NextResponse.json(
      { error: err?.message || 'Failed to generate audio' },
      { status: 500 }
    );
  }
}
