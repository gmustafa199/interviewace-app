import { NextRequest, NextResponse } from 'next/server';
import { unifiedChat } from '@/lib/ai';
import { getRoleById, type ScoringDimension } from '@/lib/roles';

export const runtime = 'nodejs';
export const maxDuration = 90;

type Message = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

type RequestBody = {
  role: string;
  difficulty: string;
  transcript: Message[];
};

function buildScorecardSection(dimensions: ScoringDimension[] | undefined): string {
  if (!dimensions || dimensions.length === 0) {
    return `## Scores by Category
- **Communication**: X/10 — one line why
- **Technical Depth**: X/10 — one line why
- **Problem Solving**: X/10 — one line why
- **Behavioral / Culture Fit**: X/10 — one line why
- **Confidence & Clarity**: X/10 — one line why`;
  }
  const lines = dimensions.map(
    (d) => `- **${d.label}**: X/10 — one line why (${d.description})`
  );
  return `## Scores by Category\n${lines.join('\n')}`;
}

function buildPrompt(
  roleTitle: string,
  roleDescription: string,
  difficulty: string,
  transcriptStr: string,
  scoringSection: string,
  isExam: boolean
): string {
  const contextLine = isExam
    ? `The candidate just finished a mock interview for the ${roleTitle} selection process at "${difficulty}" depth. ${roleDescription}`
    : `The candidate just finished a mock interview for the role of ${roleTitle} at the ${difficulty || 'mid'} level.`;

  return `You are an expert interview coach. ${contextLine}

Below is the full transcript of the interview. Your job is to write a detailed, honest scorecard.

SCORECARD FORMAT (use markdown):

## Overall Score: X/10

## Summary (2-3 sentences)
Brief overall impression.

${scoringSection}

## What Went Well
- 2-3 specific things they did well (reference actual answers)

## What to Improve
- 2-3 specific weaknesses (be honest but constructive)
- For each, explain what they could have said instead

## Sample Better Answers
For 1-2 of their weakest answers, write a model answer they could study.

## Practice Plan (next 7 days)
- 3-5 specific things to practice, with resources or topics to study

## Final Verdict
One paragraph: would they pass a real interview at this level? What's the #1 thing to fix first?

RULES:
- Be honest. Don't sugarcoat. If they did poorly, say so.
- Reference specific answers from the transcript.
- Use clear markdown formatting.
- Keep it actionable — every weakness should come with a fix.
- Score 7+ = pass, 5-6 = borderline, below 5 = needs work.

Here is the interview transcript:

${transcriptStr}

[Now write the scorecard. Output ONLY the scorecard in markdown.]`;
}

export async function POST(req: NextRequest) {
  try {
    const body: RequestBody = await req.json();
    const { role, difficulty, transcript } = body;

    if (!role || !transcript || transcript.length === 0) {
      return NextResponse.json(
        { error: 'Missing role or transcript' },
        { status: 400 }
      );
    }

    const roleInfo = getRoleById(role);
    if (!roleInfo) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const transcriptStr = (transcript || [])
      .filter((m) => m.role !== 'system' && m.content)
      .map((m) => {
        const label = m.role === 'assistant' ? 'INTERVIEWER' : 'CANDIDATE';
        return `${label}: ${m.content}`;
      })
      .join('\n\n');

    const scoringSection = buildScorecardSection(roleInfo.scoringDimensions);
    const isExam = roleInfo.domain === 'IndianExam';

    const userTurn = buildPrompt(
      roleInfo.title,
      roleInfo.description,
      difficulty || 'mid',
      transcriptStr,
      scoringSection,
      isExam
    );

    const completion = await unifiedChat({
      messages: [{ role: 'user', content: userTurn }],
      temperature: 0.4,
      max_tokens: 2000,
    });

    const feedback = completion.choices[0]?.message?.content || '';

    // Try to extract overall score (0-10)
    let overallScore: number | null = null;
    const scoreMatch = feedback.match(
      /Overall Score:\s*(\d+(?:\.\d+)?)\s*\/\s*10/i
    );
    if (scoreMatch) {
      const parsed = parseFloat(scoreMatch[1]);
      // convert to 0-100 for storage
      overallScore = Math.round(parsed * 10);
    }

    return NextResponse.json({
      feedback,
      overallScore,
    });
  } catch (err: any) {
    console.error('Feedback API error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to generate feedback' },
      { status: 500 }
    );
  }
}
