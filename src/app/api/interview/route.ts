import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import { ROLES } from '@/lib/roles';

export const runtime = 'nodejs';
export const maxDuration = 60;

type Message = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

type RequestBody = {
  role: string;
  difficulty: string;
  messages: Message[]; // prior chat history (assistant + user alternating)
  questionNumber: number;
  totalQuestions: number;
};

const DIFFICULTY_GUIDE: Record<string, string> = {
  junior:
    "The candidate is junior (0-2 years experience). Ask foundational questions appropriate for entry-level. Don't expect deep system design. Focus on fundamentals, basic data structures, simple problem-solving, and eagerness to learn.",
  mid: "The candidate is mid-level (3-5 years experience). Ask standard industry questions. Expect working knowledge of patterns, basic system design, and ability to discuss trade-offs.",
  senior:
    "The candidate is senior (6+ years). Ask harder questions. Expect deep system design, leadership stories, architectural trade-offs, and ability to mentor others.",
};

function getRoleById(id: string) {
  return ROLES.find((r) => r.id === id);
}

function buildInstructions(
  role: string,
  difficulty: string,
  questionNumber: number,
  totalQuestions: number
): string {
  const roleInfo = getRoleById(role);
  if (!roleInfo) return 'You are a helpful interview coach.';

  const difficultyGuide = DIFFICULTY_GUIDE[difficulty] || DIFFICULTY_GUIDE.mid;

  const isLast = questionNumber >= totalQuestions;
  const isSecondToLast = questionNumber === totalQuestions - 1;

  let structureHint = '';
  if (questionNumber === 1) {
    structureHint = `This is the FIRST question. Briefly introduce yourself as the interviewer (1 sentence), then ask a behavioral warm-up question like "Tell me about yourself and why you're interested in this role." or "Walk me through a recent project you're proud of."`;
  } else if (isSecondToLast) {
    structureHint = `This is the second-to-last question. Ask a technical or case question relevant to ${roleInfo.title}. Topics to consider: ${roleInfo.tags.join(', ')}.`;
  } else if (isLast) {
    structureHint = `This is the FINAL question. Ask a closing question like "Do you have any questions for me?" or "Where do you see yourself in 3 years?" Then thank them for their time. DO NOT give feedback yet.`;
  } else {
    structureHint = `Continue the interview. Ask your next question. Mix behavioral and technical. Topics to consider: ${roleInfo.tags.join(', ')}.`;
  }

  return `You are an experienced technical interviewer at a top tech company (think Google, Amazon, Stripe). You are conducting a mock interview for the role of ${roleInfo.title}.

${difficultyGuide}

ROLE CONTEXT:
- Position: ${roleInfo.title}
- Category: ${roleInfo.category}
- Key topics: ${roleInfo.tags.join(', ')}

YOUR JOB:
- Ask ONE question at a time, then wait for the candidate's answer.
- Listen carefully to their answer. Ask a smart follow-up that probes deeper or pivots to a related topic.
- Mix behavioral questions ("tell me about a time...") with technical questions appropriate to the role.
- Be professional but warm. Make the candidate feel like they're in a real interview.
- Don't give away answers or feedback during the interview. Save all feedback for the end.

INTERVIEW STRUCTURE:
- This is question ${questionNumber} of ${totalQuestions}.
- ${structureHint}

OUTPUT RULES:
- Respond with ONLY your interviewer message. No prefixes, no labels, no JSON, no markdown headings.
- Keep your messages concise (1-3 sentences usually).
- Never reveal you are an AI. Stay in character as a human interviewer.`;
}

export async function POST(req: NextRequest) {
  try {
    const body: RequestBody = await req.json();
    const { role, difficulty, messages, questionNumber, totalQuestions } = body;

    if (!role) {
      return NextResponse.json(
        { error: 'Missing required field: role' },
        { status: 400 }
      );
    }

    const zai = await ZAI.create();

    const instructions = buildInstructions(
      role,
      difficulty || 'mid',
      questionNumber || 1,
      totalQuestions || 8
    );

    // The z-ai chat API expects messages to start with a user turn.
    // We embed the interviewer instructions into a user message, then append
    // the actual interview transcript (which alternates assistant/user starting
    // with assistant).
    //
    // First-question case (no history): we send the instructions as a single
    // user message asking the AI to produce its first interviewer message.
    //
    // Subsequent cases: the transcript starts with assistant (the AI's first
    // question) which is invalid as a leading role, so we prepend a user
    // message that re-states the instructions + asks for the next question.
    const safeHistory = (messages || []).filter(
      (m) => m.role !== 'system' && m.content && m.content.trim().length > 0
    );

    // Build a single user turn that combines instructions + history + ask
    let userTurn: string;
    if (safeHistory.length === 0) {
      userTurn = `${instructions}

[Begin the interview now. Output ONLY your first message as the interviewer.]`;
    } else {
      const transcriptStr = safeHistory
        .map((m) => {
          const label = m.role === 'assistant' ? 'INTERVIEWER' : 'CANDIDATE';
          return `${label}: ${m.content}`;
        })
        .join('\n\n');
      userTurn = `${instructions}

Below is the interview transcript so far:

${transcriptStr}

[Now produce your next single message as the INTERVIEWER. Output ONLY that message, no preamble.]`;
    }

    const completion = await zai.chat.completions.create({
      messages: [{ role: 'user', content: userTurn }],
      temperature: 0.7,
      // @ts-ignore — SDK accepts max_tokens
      max_tokens: 500,
      thinking: { type: 'disabled' },
    } as any);

    const reply = completion.choices[0]?.message?.content || '';

    return NextResponse.json({
      reply,
      questionNumber,
    });
  } catch (err: any) {
    console.error('Interview API error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to generate interviewer response' },
      { status: 500 }
    );
  }
}
