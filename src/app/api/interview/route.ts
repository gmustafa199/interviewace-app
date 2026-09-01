import { NextRequest, NextResponse } from 'next/server';
import { unifiedChat } from '@/lib/ai';
import { getRoleById, type Role } from '@/lib/roles';

export const runtime = 'nodejs';
export const maxDuration = 90; // Vercel Hobby=60, Pro=300. 90s gives retry logic headroom.

type Message = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

type RequestBody = {
  role: string;
  difficulty: string;
  messages: Message[];
  questionNumber: number;
  totalQuestions: number;
};

/* ------------------------------------------------------------------ */
/* Difficulty guides per domain                                       */
/* ------------------------------------------------------------------ */

const IT_DIFFICULTY_GUIDE: Record<string, string> = {
  junior:
    "The candidate is junior (0-2 years experience). Ask foundational questions appropriate for entry-level. Don't expect deep system design. Focus on fundamentals, basic data structures, simple problem-solving, and eagerness to learn.",
  mid: "The candidate is mid-level (3-5 years experience). Ask standard industry questions. Expect working knowledge of patterns, basic system design, and ability to discuss trade-offs.",
  senior:
    "The candidate is senior (6+ years). Ask harder questions. Expect deep system design, leadership stories, architectural trade-offs, and ability to mentor others.",
};

const EXAM_DEPTH_GUIDE: Record<string, string> = {
  fresher:
    'This is the candidate\'s first mock interview — be encouraging. Light follow-ups. Help them feel the format without overwhelming them.',
  standard:
    'Standard exam-day intensity. Realistic follow-ups. Treat this as the real interview.',
  rigorous:
    'Aggressive panel. Deep grilling. Stress questions. Push the candidate hard to reveal weak spots.',
};

/* ------------------------------------------------------------------ */
/* Prompt builders                                                    */
/* ------------------------------------------------------------------ */

function buildITInstructions(
  role: Role,
  difficulty: string,
  questionNumber: number,
  totalQuestions: number
): string {
  const difficultyGuide = IT_DIFFICULTY_GUIDE[difficulty] || IT_DIFFICULTY_GUIDE.mid;
  const isLast = questionNumber >= totalQuestions;
  const isSecondToLast = questionNumber === totalQuestions - 1;

  let structureHint = '';
  if (questionNumber === 1) {
    structureHint = `This is the FIRST question. Briefly introduce yourself as the interviewer (1 sentence), then ask a behavioral warm-up question like "Tell me about yourself and why you're interested in this role." or "Walk me through a recent project you're proud of."`;
  } else if (isSecondToLast) {
    structureHint = `This is the second-to-last question. Ask a technical or case question relevant to ${role.title}. Topics to consider: ${role.tags.join(', ')}.`;
  } else if (isLast) {
    structureHint = `This is the FINAL question. Ask a closing question like "Do you have any questions for me?" or "Where do you see yourself in 3 years?" Then thank them for their time. DO NOT give feedback yet.`;
  } else {
    structureHint = `Continue the interview. Ask your next question. Mix behavioral and technical. Topics to consider: ${role.tags.join(', ')}.`;
  }

  return `You are an experienced technical interviewer at a top tech company (think Google, Amazon, Stripe). You are conducting a mock interview for the role of ${role.title}.

${difficultyGuide}

ROLE CONTEXT:
- Position: ${role.title}
- Category: ${role.category}
- Key topics: ${role.tags.join(', ')}

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

function buildExamInstructions(
  role: Role,
  depth: string,
  questionNumber: number,
  totalQuestions: number
): string {
  const depthGuide = EXAM_DEPTH_GUIDE[depth] || EXAM_DEPTH_GUIDE.standard;
  const panelSize = role.panelSize || 5;
  const duration = role.durationMinutes || 30;

  const isLast = questionNumber >= totalQuestions;
  const isFirst = questionNumber === 1;

  let structureHint = '';
  if (isFirst) {
    structureHint = `This is the OPENING question. The Chairman of the panel welcomes the candidate and asks a warm-up question — typically about the candidate's background, home state, graduation subject, or hobbies (from the DAF — Detailed Application Form). One question only.`;
  } else if (isLast) {
    structureHint = `This is the CLOSING question. Ask a final situational or hobby-related question, then thank the candidate. Do NOT give any feedback.`;
  } else {
    structureHint = `Continue the interview. A different panel member can take over. Vary the question type across: (a) current affairs, (b) situational judgment / ethics, (c) graduation subject depth, (d) hobby or DAF-based, (e) opinion on a policy issue.`;
  }

  return `You are conducting a mock interview for the ${role.title} selection process.

${role.extraPromptContext || ''}

INTERVIEW CONFIG:
- Panel size: ${panelSize} members
- Duration: ~${duration} minutes
- Depth: ${depthGuide}
- This is question ${questionNumber} of ${totalQuestions}.
- ${structureHint}

CANDIDATE CONTEXT TO ASSUME (unless they tell you otherwise):
- Indian candidate, age 22-28
- Has cleared the written/Mains exam
- Preparing seriously for the interview round

YOUR JOB:
- Speak as one panel member at a time. You can briefly indicate which member is speaking (e.g., "Chairman:", "Member 2:") but keep it natural.
- Ask ONE question at a time, wait for the answer, then follow up intelligently.
- Probe depth — if they claim knowledge, test it. If they give a generic answer, push for specifics.
- Stay in character as distinguished Indian bureaucrats / professors / bankers.
- Use culturally appropriate references (Indian context, polity, economy, society).
- DO NOT give feedback. Save it for the scorecard.

OUTPUT RULES:
- Respond with ONLY the next panel message. No JSON, no markdown headings.
- Keep messages concise (1-3 sentences usually). Ask one question at a time.
- Never reveal you are an AI. Stay in character.`;
}

function buildInstructions(
  role: Role,
  difficulty: string,
  questionNumber: number,
  totalQuestions: number
): string {
  if (role.domain === 'IndianExam') {
    return buildExamInstructions(role, difficulty, questionNumber, totalQuestions);
  }
  return buildITInstructions(role, difficulty, questionNumber, totalQuestions);
}

/* ------------------------------------------------------------------ */
/* API                                                                */
/* ------------------------------------------------------------------ */

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

    const roleInfo = getRoleById(role);
    if (!roleInfo) {
      return NextResponse.json({ error: 'Invalid role: ' + role }, { status: 400 });
    }

    const instructions = buildInstructions(
      roleInfo,
      difficulty || 'mid',
      questionNumber || 1,
      totalQuestions || 8
    );

    // Filter history (drop system + empty messages)
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

    const completion = await unifiedChat({
      messages: [{ role: 'user', content: userTurn }],
      temperature: 0.7,
      max_tokens: 2048, // was 500 — too low, caused truncation mid-sentence
    });

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
