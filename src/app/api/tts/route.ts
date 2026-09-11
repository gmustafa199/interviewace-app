/**
 * TTS endpoint — returns natural, human-sounding MP3 audio.
 *
 * Provider chain (tries top → bottom):
 *   1. Microsoft Edge NEURAL voices via edge-tts-node (no API key needed)
 *      → These are true Azure neural voices (en-IN-NeerjaNeural etc.) and
 *        sound dramatically more human than anything else available free.
 *      → Per-speaker voice assignment: panel members get distinct voices.
 *      → Prosody tuning: measured pace, questions slow slightly, panel
 *        members vary in pitch — mimics a real interview board.
 *   2. Google Translate TTS (free, decent, slightly flat)
 *   3. Browser Web Speech API signal (last resort, robotic)
 *
 * OPTIONAL upgrade later (paid, best-in-class):
 *   - ElevenLabs (ELEVENLABS_API_KEY) or OpenAI TTS (OPENAI_API_KEY)
 */

import { NextRequest, NextResponse } from 'next/server';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'edge-tts-node';

export const runtime = 'nodejs';
export const maxDuration = 30;

type RequestBody = {
  text: string;
  speaker?: string | null;
  speed?: number;
};

/* ------------------------------------------------------------------ */
/* Voice assignment — different panelists get different neural voices */
/* ------------------------------------------------------------------ */

const VOICE_FEMALE = 'en-IN-NeerjaNeural'; // warm, professional female (India)
const VOICE_MALE = 'en-IN-PrabhatNeural'; // measured, authoritative male (India)

function pickVoice(speaker?: string | null): string {
  if (!speaker) return VOICE_FEMALE; // single IT interviewer — default
  const s = speaker.toLowerCase();
  if (s.includes('chairman')) return VOICE_MALE; // UPSC-style chairman
  const memberMatch = s.match(/(\d+)/);
  if (memberMatch) {
    // Alternate voices across panel members: odd → male, even → female
    return parseInt(memberMatch[1], 10) % 2 === 1 ? VOICE_MALE : VOICE_FEMALE;
  }
  if (s.includes('interviewer') || s.includes('panelist')) return VOICE_MALE;
  return VOICE_FEMALE;
}

/** Per-speaker pitch offset so two same-gender voices still differ. */
function pickPitch(speaker?: string | null): string {
  if (!speaker) return '+0Hz';
  const s = speaker.toLowerCase();
  if (s.includes('chairman')) return '-2Hz';
  const memberMatch = s.match(/(\d+)/);
  if (memberMatch) {
    const n = parseInt(memberMatch[1], 10);
    return n % 2 === 1 ? '+1Hz' : '-1Hz';
  }
  return '+0Hz';
}

/**
 * Prosody — the details that make it sound like a person:
 * - Interviewers speak measurably slower than default TTS (≈ -8%)
 * - Questions slow down slightly more (deliberate, probing delivery)
 * - Very short sentences get a touch more energy
 */
function pickRate(text: string, speaker?: string | null): string {
  const trimmed = text.trim();
  const isQuestion = /\?\s*$/.test(trimmed);
  const wordCount = trimmed.split(/\s+/).length;

  let ratePct = -8; // base: measured, senior-professional pace
  if (isQuestion) ratePct -= 2; // probing questions land slower
  if (wordCount <= 6) ratePct += 3; // short lines: natural lift
  if (wordCount > 28) ratePct += 2; // long sentences: avoid dragging

  // Male voices read a touch faster at same rate setting
  if (pickVoice(speaker) === VOICE_MALE) ratePct += 1;

  const clamped = Math.max(-15, Math.min(5, ratePct));
  return `${clamped >= 0 ? '+' : ''}${clamped}%`;
}

/* ------------------------------------------------------------------ */
/* Provider 1 — Microsoft Edge neural voices                          */
/* ------------------------------------------------------------------ */

async function synthesizeWithEdge(
  text: string,
  speaker?: string | null
): Promise<Buffer | null> {
  const tts = new MsEdgeTTS({ enableLogger: false });
  try {
    await tts.setMetadata(
      pickVoice(speaker),
      OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3
    );

    const stream = tts.toStream(text, {
      rate: pickRate(text, speaker),
      pitch: pickPitch(speaker),
    });

    const chunks: Buffer[] = [];
    const collectDone = new Promise<Buffer>((resolve, reject) => {
      stream.on('data', (c: Buffer) => chunks.push(c));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });

    // Hard timeout — never let a stalled websocket exceed 12s
    const timeout = new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), 12000)
    );

    const buffer = await Promise.race([collectDone, timeout]);
    if (!buffer || buffer.length < 1000) return null;
    return buffer;
  } catch {
    return null;
  } finally {
    try {
      tts.close();
    } catch {
      // ignore
    }
  }
}

/* ------------------------------------------------------------------ */
/* Provider 2 — Google Translate TTS (free fallback)                  */
/* ------------------------------------------------------------------ */

const GTTTS_ENDPOINT = 'https://translate.google.com/translate_tts';

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
    const timeout = setTimeout(() => ctrl.abort(), 10000);

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

      if (!res.ok) return null;
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
  return Buffer.concat(buffers);
}

/* ------------------------------------------------------------------ */
/* Main route                                                         */
/* ------------------------------------------------------------------ */

export async function POST(req: NextRequest) {
  try {
    const body: RequestBody = await req.json();
    const { speaker, speed } = body;
    let { text } = body;

    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'Missing text parameter' }, { status: 400 });
    }

    // Clean text so it sounds natural spoken aloud
    text = text.replace(/^((Chairman|Member\s*\d*|Interviewer|Panelist)\s*:\s*)/i, '');
    text = text.replace(/\*\*(.*?)\*\*/g, '$1');
    text = text.replace(/^#+\s*/gm, '');
    text = text.replace(/`([^`]+)`/g, '$1');
    text = text.slice(0, 1200);

    // 1) Edge neural voices — the human-sounding tier
    const edgeBuffer = await synthesizeWithEdge(text, speaker);
    if (edgeBuffer) {
      return new NextResponse(edgeBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Length': edgeBuffer.length.toString(),
          'Cache-Control': 'no-store',
        },
      });
    }

    // 2) Google Translate TTS
    const gttsBuffer = await fetchGoogleTTS(text);
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

    // 3) Last resort — browser Web Speech API with prosody hints
    return NextResponse.json({
      use_browser_tts: true,
      text,
      rate: speed || 0.92,
      pitch: speaker && speaker.toLowerCase().includes('chairman') ? 0.94 : 1.0,
      lang: 'en-IN',
    });
  } catch (err: any) {
    console.error('TTS API error:', err);
    return NextResponse.json({
      use_browser_tts: true,
      text: '',
      rate: 0.92,
      lang: 'en-IN',
      error: err?.message,
    });
  }
}
