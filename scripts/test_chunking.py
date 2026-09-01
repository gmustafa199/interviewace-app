"""Test the sentence-chunking logic that the client uses for natural TTS playback."""
import re

def split_into_spoken_chunks(text: str):
    """Mirror of the client-side splitIntoSpokenChunks function."""
    # Strip markdown
    clean = re.sub(r'\*\*(.*?)\*\*', r'\1', text)
    clean = re.sub(r'`([^`]+)`', r'\1', clean)
    clean = re.sub(r'^#+\s*', '', clean, flags=re.MULTILINE)

    speaker_pattern = re.compile(
        r'(?:^|\n)\s*((?:Chairman|Member\s*\d*|Panelist|Interviewer)\s*:\s*)',
        re.IGNORECASE,
    )
    parts = []
    matches = list(speaker_pattern.finditer(clean))

    if not matches:
        return [{'speaker': None, 'text': t} for t in split_sentences(clean)]

    # Initial segment before any speaker prefix
    if matches[0].start() > 0:
        head = clean[:matches[0].start()].strip()
        if head:
            for s in split_sentences(head):
                parts.append({'speaker': None, 'text': s})

    for i, m in enumerate(matches):
        speaker = m.group(1).replace(':', '').strip()
        start = m.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(clean)
        segment = clean[start:end].strip()
        if segment:
            sentences = split_sentences(segment)
            for idx, s in enumerate(sentences):
                parts.append({'speaker': speaker if idx == 0 else None, 'text': s})

    return parts

def split_sentences(text: str):
    rough = re.findall(r'[^.!?]+[.!?]*(?:\s+|$)', text) or [text]
    return [s.strip() for s in rough if s.strip()]

# Test cases
tests = [
    # IT interview (no speaker prefix)
    "Hi! I'm Sarah, your interviewer today. Let's start with a behavioral question. Tell me about a recent project you're proud of.",
    # UPSC multi-speaker panel
    "Chairman: Welcome to the interview, Mr. Sharma. Could you briefly introduce yourself? Member 2: Arjun, your transition from tech to civil service is intriguing. How has your Google experience prepared you for governance?",
    # Banking panel with sit-down
    "Chairman: Welcome. Please introduce yourself and your motivation for banking. Member 3: What's the current repo rate? Do you think RBI should cut it further?",
]

for i, t in enumerate(tests, 1):
    print(f"\n=== Test {i} ===")
    print(f"Input: {t}")
    chunks = split_into_spoken_chunks(t)
    print(f"Chunks ({len(chunks)}):")
    for c in chunks:
        sp = c['speaker'] or '—'
        print(f"  [{sp}] {c['text'][:80]}")
