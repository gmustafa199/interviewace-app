import { MsEdgeTTS, OUTPUT_FORMAT } from 'edge-tts-node';
import { writeFileSync } from 'fs';

const t0 = Date.now();
const tts = new MsEdgeTTS({ enableLogger: false });
await tts.setMetadata('en-IN-NeerjaNeural', OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

const stream = tts.toStream(
  "Good morning, and congratulations on clearing the mains. Please have a seat. Tell me about yourself and why you want to join the civil services.",
  { rate: '-4%', pitch: '+0Hz' }
);

const chunks = [];
for await (const c of stream) chunks.push(c);
const buf = Buffer.concat(chunks);
writeFileSync('/tmp/edge-test.mp3', buf);
console.log('OK bytes=', buf.length, 'ms=', Date.now() - t0);
tts.close();
