import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

export const runtime = 'nodejs';
export const maxDuration = 30;

type RequestBody = {
  text: string;
  voice?: string;
  speed?: number; // 0.5 - 2.0
};

/**
 * Text-to-Speech endpoint.
 *
 * Uses z-ai SDK's `tongtong` voice (the only one currently supported) with a
 * slightly reduced speed (0.92) by default — this gives a more deliberate,
 * human-sounding cadence compared to the default 1.0 which feels rushed.
 *
 * The client-side player further splits text into sentences and inserts
 * 200-400ms pauses between them — that's what makes it sound like a real
 * human interviewer rather than a TTS bot.
 */
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

    const zai = await ZAI.create();

    // Strip markdown/labels that don't sound good spoken aloud.
    // e.g. "Chairman: Welcome..." -> just "Welcome..."
    let spokenText = text;
    spokenText = spokenText.replace(/^((Chairman|Member\s*\d*|Interviewer|Panelist)\s*:\s*)/i, '');
    spokenText = spokenText.replace(/\*\*/g, '');
    spokenText = spokenText.replace(/^#+\s*/gm, '');
    spokenText = spokenText.replace(/`([^`]+)`/g, '$1');

    // Cap to ~800 chars to keep response fast (1-3s typically).
    // If the client sent a long paragraph, only the first chunk is spoken;
    // client should split into sentences itself before calling.
    const truncated = spokenText.slice(0, 800);

    const response = await zai.audio.tts.create({
      input: truncated,
      voice: voice || 'tongtong',
      speed: typeof speed === 'number' ? speed : 0.92, // slightly slower = more natural
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
    return NextResponse.json(
      { error: err?.message || 'Failed to generate audio' },
      { status: 500 }
    );
  }
}
