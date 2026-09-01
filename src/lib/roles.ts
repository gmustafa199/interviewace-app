/**
 * InterviewAce — Role definitions
 *
 * Two domain types supported:
 *   - 'IT'         — Tech-company job interviews (Google, Stripe, etc.)
 *   - 'IndianExam' — Indian competitive exams with interview rounds
 *                    (UPSC, IBPS, SBI, CAT, RBI, etc.)
 *
 * Each role carries its own prompt template, scoring dimensions, and
 * panel configuration so the AI behaves appropriately per exam style.
 */

export type Domain = 'IT' | 'IndianExam';

export type ScoringDimension = {
  /** Key used inside the AI prompt */
  key: string;
  /** Display label shown to user in the scorecard */
  label: string;
  /** Short description the AI uses to score this dimension */
  description: string;
};

export type Role = {
  id: string;
  title: string;
  slug: string;
  icon: string;
  category: string;
  domain: Domain;

  /** Short marketing description for the role picker card */
  description: string;
  /** Tags shown on the card and used by the AI as topic hints */
  tags: string[];

  /** For IT roles — salary range; for Indian exam roles — typical CTC/post */
  avgSalary?: string;

  /** For IT roles — demand level; for Indian exam roles — applicant volume */
  demand?: 'very-high' | 'high' | 'medium';

  /** Number of panel members (UPSC = 5, banking = 3-4, IT = 1) */
  panelSize?: number;

  /** Typical interview duration in minutes (used in UI + AI instructions) */
  durationMinutes?: number;

  /** Scoring dimensions — used by the feedback API to build the scorecard */
  scoringDimensions?: ScoringDimension[];

  /** Optional extra prompt block appended to the interviewer system prompt */
  extraPromptContext?: string;

  /** Whether this role needs current-affairs injection (UPSC, RBI, banking) */
  needsCurrentAffairs?: boolean;

  /** Pricing tier for this role — affects display + (later) billing */
  pricingTier?: 'global' | 'india';
};

/* ------------------------------------------------------------------ */
/* IT ROLES                                                            */
/* ------------------------------------------------------------------ */

const IT_SCORING: ScoringDimension[] = [
  { key: 'communication', label: 'Communication', description: 'Clarity, structure, conciseness of answers' },
  { key: 'technical', label: 'Technical Depth', description: 'Depth of understanding of core concepts' },
  { key: 'problem_solving', label: 'Problem Solving', description: 'Approach to novel problems, trade-off reasoning' },
  { key: 'behavioral', label: 'Behavioral / Culture Fit', description: 'Stories, leadership, collaboration' },
  { key: 'confidence', label: 'Confidence & Clarity', description: 'Poise, pace, handling of pushback' },
];

/* ------------------------------------------------------------------ */
/* INDIAN EXAM ROLES — TOP 5 FROM RESEARCH                            */
/* ------------------------------------------------------------------ */

const UPSC_SCORING: ScoringDimension[] = [
  { key: 'mental_alertness', label: 'Mental Alertness', description: 'Quick grasp of questions, presence of mind' },
  { key: 'critical_reasoning', label: 'Critical Reasoning', description: 'Logical analysis, balanced judgement' },
  { key: 'ethics_integrity', label: 'Ethics & Integrity', description: 'Honesty, moral compass, probity in public life' },
  { key: 'leadership', label: 'Leadership & Initiative', description: 'Ability to lead, take decisions, take people along' },
  { key: 'depth_awareness', label: 'Depth & Awareness', description: 'Mastery of graduation subject + current affairs' },
  { key: 'communication', label: 'Communication', description: 'Clear, concise, confident expression' },
];

const BANK_PO_SCORING: ScoringDimension[] = [
  { key: 'banking_awareness', label: 'Banking & Financial Awareness', description: 'Knowledge of banking, economy, RBI, current rates' },
  { key: 'communication', label: 'Communication', description: 'Clarity, confidence, professional expression' },
  { key: 'personality', label: 'Personality & Suitability', description: 'Customer-facing temperament, patience, integrity' },
  { key: 'situation_handling', label: 'Situational / HR', description: 'Handling tricky customer/staff scenarios' },
  { key: 'general_awareness', label: 'General Awareness', description: 'Current affairs, polity, basic economy' },
];

const SBI_PO_SCORING: ScoringDimension[] = [
  ...BANK_PO_SCORING,
  { key: 'group_exercise', label: 'Group Exercise', description: 'GD skills — listening, contribution, leadership' },
];

const CAT_MBA_SCORING: ScoringDimension[] = [
  { key: 'academic_depth', label: 'Academic Depth', description: 'Mastery of undergraduate subject' },
  { key: 'career_clarity', label: 'Career Clarity', description: 'Why MBA, why now, post-MBA goals' },
  { key: 'communication', label: 'Communication', description: 'Structured, articulate, confident expression' },
  { key: 'leadership_potential', label: 'Leadership Potential', description: 'Stories showing initiative, impact, ownership' },
  { key: 'awareness', label: 'General Awareness', description: 'Current affairs, business, economy, society' },
  { key: 'analytical_thinking', label: 'Analytical Thinking', description: 'Case-style reasoning, guesstimates, logic' },
];

const RBI_GRADE_B_SCORING: ScoringDimension[] = [
  { key: 'economic_awareness', label: 'Economic & Banking Awareness', description: 'RBI policies, monetary policy, banking system, inflation' },
  { key: 'current_affairs', label: 'Current Affairs', description: 'Last 6 months — economy, polity, international' },
  { key: 'communication', label: 'Communication', description: 'Clarity, structure, confidence' },
  { key: 'analytical_ability', label: 'Analytical Ability', description: 'Interpreting data, reasoning, policy analysis' },
  { key: 'personality', label: 'Personality & Suitability', description: 'Officer-like qualities, integrity, judgment' },
];

/* ------------------------------------------------------------------ */
/* ROLES ARRAY                                                        */
/* ------------------------------------------------------------------ */

export const ROLES: Role[] = [
  /* ----------------------------- IT ----------------------------- */
  {
    id: 'swe',
    title: 'Software Engineer',
    slug: 'software-engineer',
    icon: 'Code2',
    category: 'Engineering',
    domain: 'IT',
    description: 'Generalist SWE interviews covering data structures, system design, and behavioral.',
    tags: ['Algorithms', 'System Design', 'Behavioral'],
    avgSalary: '$120K - $200K',
    demand: 'very-high',
    panelSize: 1,
    durationMinutes: 45,
    scoringDimensions: IT_SCORING,
    pricingTier: 'global',
  },
  {
    id: 'frontend',
    title: 'Frontend Developer',
    slug: 'frontend-developer',
    icon: 'Layout',
    category: 'Engineering',
    domain: 'IT',
    description: 'JavaScript, React, CSS, web performance, accessibility, and component design.',
    tags: ['JavaScript', 'React', 'CSS'],
    avgSalary: '$95K - $170K',
    demand: 'very-high',
    panelSize: 1,
    durationMinutes: 45,
    scoringDimensions: IT_SCORING,
    pricingTier: 'global',
  },
  {
    id: 'backend',
    title: 'Backend Developer',
    slug: 'backend-developer',
    icon: 'Server',
    category: 'Engineering',
    domain: 'IT',
    description: 'APIs, databases, distributed systems, caching, and backend architecture.',
    tags: ['APIs', 'Databases', 'Distributed Systems'],
    avgSalary: '$110K - $190K',
    demand: 'high',
    panelSize: 1,
    durationMinutes: 45,
    scoringDimensions: IT_SCORING,
    pricingTier: 'global',
  },
  {
    id: 'data-scientist',
    title: 'Data Scientist',
    slug: 'data-scientist',
    icon: 'BarChart3',
    category: 'Data & Analytics',
    domain: 'IT',
    description: 'Statistics, ML fundamentals, SQL, case studies, and product sense.',
    tags: ['Statistics', 'ML', 'SQL'],
    avgSalary: '$120K - $210K',
    demand: 'high',
    panelSize: 1,
    durationMinutes: 45,
    scoringDimensions: IT_SCORING,
    pricingTier: 'global',
  },
  {
    id: 'devops',
    title: 'DevOps Engineer',
    slug: 'devops-engineer',
    icon: 'GitBranch',
    category: 'Engineering',
    domain: 'IT',
    description: 'CI/CD, Kubernetes, cloud (AWS/GCP/Azure), infrastructure as code, observability.',
    tags: ['CI/CD', 'Kubernetes', 'Cloud'],
    avgSalary: '$115K - $195K',
    demand: 'high',
    panelSize: 1,
    durationMinutes: 45,
    scoringDimensions: IT_SCORING,
    pricingTier: 'global',
  },
  {
    id: 'product-manager',
    title: 'Product Manager',
    slug: 'product-manager',
    icon: 'Target',
    category: 'Product & Design',
    domain: 'IT',
    description: 'Product sense, execution, analytical thinking, behavioral, and stakeholder mgmt.',
    tags: ['Product Sense', 'Analytics', 'Strategy'],
    avgSalary: '$130K - $230K',
    demand: 'high',
    panelSize: 1,
    durationMinutes: 45,
    scoringDimensions: IT_SCORING,
    pricingTier: 'global',
  },
  {
    id: 'cloud-engineer',
    title: 'Cloud Engineer',
    slug: 'cloud-engineer',
    icon: 'Cloud',
    category: 'Engineering',
    domain: 'IT',
    description: 'AWS/Azure/GCP services, networking, security, migration, and cost optimization.',
    tags: ['AWS', 'Azure', 'Networking'],
    avgSalary: '$110K - $185K',
    demand: 'high',
    panelSize: 1,
    durationMinutes: 45,
    scoringDimensions: IT_SCORING,
    pricingTier: 'global',
  },
  {
    id: 'ml-engineer',
    title: 'Machine Learning Engineer',
    slug: 'ml-engineer',
    icon: 'BrainCircuit',
    category: 'Engineering',
    domain: 'IT',
    description: 'ML system design, model deployment, MLOps, and applied ML problems.',
    tags: ['ML', 'MLOps', 'Python'],
    avgSalary: '$140K - $240K',
    demand: 'high',
    panelSize: 1,
    durationMinutes: 45,
    scoringDimensions: IT_SCORING,
    pricingTier: 'global',
  },

  /* ----------------------- INDIAN EXAMS ------------------------ */
  {
    id: 'upsc-cse',
    title: 'UPSC Civil Services',
    slug: 'upsc-civil-services',
    icon: 'Landmark',
    category: 'Civil Services',
    domain: 'IndianExam',
    description:
      'Personality Test (275 marks). 5-member board chaired by a UPSC Member. 30 min. The most prestigious interview in India.',
    tags: ['Current Affairs', 'Ethics', 'Judgment', 'Graduation Subject', 'Hobbies'],
    avgSalary: 'IAS / IPS / IFS — Grade A',
    demand: 'very-high',
    panelSize: 5,
    durationMinutes: 30,
    scoringDimensions: UPSC_SCORING,
    needsCurrentAffairs: true,
    pricingTier: 'india',
    extraPromptContext:
      'You are simulating a UPSC Civil Services Personality Test. The candidate has cleared the Main exam. The board assesses suitability for public service — mental alertness, critical reasoning, ethics, leadership, depth of awareness. ' +
      'Open with a warm but formal welcome from the Chairman. Cover: (1) the candidate\'s graduation subject or hobby (probe depth), (2) a current affairs / situation question (e.g., a recent Supreme Court judgment, policy debate, or international event), ' +
      '(3) an ethics or judgment dilemma (e.g., "You are District Magistrate and a riot breaks out — what do you do?"), (4) a question on their Detailed Application Form (DAF) — home state, optional subject, work experience, ' +
      '(5) a closing situational/hobby question. Keep questions open-ended. Probe with follow-ups ("Can you elaborate?", "What would you do if...?"). ' +
      'DO NOT expect right/wrong answers — judge the quality of reasoning. Do not reveal you are an AI. Behave like a distinguished Indian bureaucrat.',
  },
  {
    id: 'ibps-po',
    title: 'IBPS PO',
    slug: 'ibps-po',
    icon: 'Landmark',
    category: 'Banking',
    domain: 'IndianExam',
    description:
      'Probationary Officer interview (100 marks). 3-4 member panel. 15-20 min. Banking awareness + HR questions.',
    tags: ['Banking Awareness', 'HR Questions', 'Current Affairs'],
    avgSalary: 'Bank PO — ₹8-12 LPA',
    demand: 'very-high',
    panelSize: 4,
    durationMinutes: 20,
    scoringDimensions: BANK_PO_SCORING,
    needsCurrentAffairs: true,
    pricingTier: 'india',
    extraPromptContext:
      'You are simulating an IBPS Probationary Officer interview at a public sector bank. The panel has 3-4 members (bank GM, retired banker, psychologist). ' +
      'Cover: (1) Brief intro + "Why banking?" (2) Banking awareness — RBI functions, types of accounts, recent banking news, NPA, KYC, financial inclusion, ' +
      '(3) Current affairs — last 3 months economy/news, (4) Situation/HR — "An angry customer is shouting at you, how do you handle it?", "You find a colleague siphoning cash, what do you do?", ' +
      '(5) Optional: graduation subject link to banking. Keep it 15-20 min total. Be firm but polite. Use Indian banking terminology (NEFT, RTGS, KYC, CASA, NPA, MCLR).',
  },
  {
    id: 'sbi-po',
    title: 'SBI PO',
    slug: 'sbi-po',
    icon: 'Landmark',
    category: 'Banking',
    domain: 'IndianExam',
    description:
      'Phase III: Interview + Group Exercise + Psychometric. Premium banking. SBI is India\'s largest bank.',
    tags: ['Banking', 'Group Exercise', 'SBI Specific', 'HR'],
    avgSalary: 'SBI PO — ₹10-15 LPA',
    demand: 'very-high',
    panelSize: 4,
    durationMinutes: 20,
    scoringDimensions: SBI_PO_SCORING,
    needsCurrentAffairs: true,
    pricingTier: 'india',
    extraPromptContext:
      'You are simulating an SBI PO Phase III interview. SBI is the largest Indian bank — expectations are higher than IBPS. ' +
      'Cover: (1) "Why SBI over other banks?" (2) SBI-specific awareness — SBI products, recent SBI news, SBI Card, YONO, SBI Life, ' +
      '(3) Banking & economy (RBI policy rate, inflation, GDP), (4) Situational — "As an SBI PO in a rural branch, how do you increase CASA deposits?", ' +
      '(5) Group Exercise preview — ask the candidate to discuss a topic for 2 min (e.g., "Should digital payments replace cash?"). ' +
      'Hold SBI to a higher standard than IBPS. Probe for leadership potential (PO becomes AGM in ~10 years).',
  },
  {
    id: 'cat-mba',
    title: 'CAT / IIM MBA',
    slug: 'cat-iim-mba',
    icon: 'GraduationCap',
    category: 'MBA Admissions',
    domain: 'IndianExam',
    description:
      'IIM admission interview (15-25 min). Panel of 2-3 professors. Critical for admission after CAT score.',
    tags: ['Academics', 'Why MBA', 'Work Ex', 'Current Affairs', 'Case-style'],
    avgSalary: 'IIM grad — ₹20-30 LPA avg',
    demand: 'high',
    panelSize: 3,
    durationMinutes: 25,
    scoringDimensions: CAT_MBA_SCORING,
    pricingTier: 'india',
    extraPromptContext:
      'You are simulating an IIM admission interview (Personal Interview round). Panel = 2-3 IIM professors. ' +
      'Cover: (1) "Tell me about yourself" + "Why MBA? Why now?" (2) Academic depth — probe the candidate\'s undergraduate subject (e.g., if B.Tech CS, ask OS/DBMS/Algorithms; if B.Com, ask accounting/finance), ' +
      '(3) Work experience (if any) — achievements, leadership, why leave for MBA, (4) Current affairs / general awareness — business news, economy, polity, ' +
      '(5) Case/guesstimate style question (e.g., "How many tyres are sold in India per year?"), (6) Hobby/extra-curricular depth. ' +
      'Professors are intellectually rigorous — they will grill on the candidate\'s claims. If the candidate says "I know Python", ask "Implement quicksort." ' +
      'If they say "I read The Hindu daily", ask "What was the lead story today?". Probe inconsistency ruthlessly but politely.',
  },
  {
    id: 'rbi-grade-b',
    title: 'RBI Grade B',
    slug: 'rbi-grade-b',
    icon: 'Landmark',
    category: 'Banking',
    domain: 'IndianExam',
    description:
      'Reserve Bank of India Grade B officer interview (Phase 3). 5-member panel. 20-30 min. Premium finance.',
    tags: ['Economy', 'Monetary Policy', 'RBI', 'Banking', 'Current Affairs'],
    avgSalary: 'RBI Grade B — ₹18-22 LPA',
    demand: 'high',
    panelSize: 5,
    durationMinutes: 30,
    scoringDimensions: RBI_GRADE_B_SCORING,
    needsCurrentAffairs: true,
    pricingTier: 'india',
    extraPromptContext:
      'You are simulating an RBI Grade B officer interview (Phase 3). Panel = 5 members (RBI officers + external expert). ' +
      'This is the most economics-heavy interview in Indian banking. Cover: ' +
      '(1) "Why RBI?" — probe motivation for joining the central bank vs commercial banks, ' +
      '(2) Monetary policy — repo rate, reverse repo, MSF, CRR, SLR, inflation targeting, MPC, recent RBI decisions, ' +
      '(3) Banking regulation — RBI\'s role, recent RBI actions (e.g., on Paytm Payments Bank, NBFCs), PCA framework, ' +
      '(4) Current affairs — last 6 months economy, Union Budget, Economic Survey, global events (Fed rate, oil prices), ' +
      '(5) Situation — "If you are RBI Governor for a day, what one reform would you push?", ' +
      '(6) Graduation subject depth. Hold candidates to a higher analytical standard than IBPS. Expect them to know current RBI Governor, Deputy Governors, and recent policy moves.',
  },
];

/* ------------------------------------------------------------------ */
/* HELPERS                                                            */
/* ------------------------------------------------------------------ */

export const ROLE_CATEGORIES = Array.from(new Set(ROLES.map((r) => r.category)));

/** All IT roles */
export const IT_ROLES = ROLES.filter((r) => r.domain === 'IT');

/** All Indian exam roles */
export const INDIAN_EXAM_ROLES = ROLES.filter((r) => r.domain === 'IndianExam');

/** Group roles by domain for the UI picker */
export const ROLES_BY_DOMAIN: Record<Domain, Role[]> = {
  IT: IT_ROLES,
  IndianExam: INDIAN_EXAM_ROLES,
};

export function getRoleById(id: string): Role | undefined {
  return ROLES.find((r) => r.id === id);
}

/* ------------------------------------------------------------------ */
/* DIFFICULTY (used by IT roles)                                      */
/* ------------------------------------------------------------------ */

export const DIFFICULTY_LEVELS = [
  {
    id: 'junior',
    title: 'Junior (0-2 yrs)',
    description: 'Easier questions, more guidance, foundational topics.',
  },
  {
    id: 'mid',
    title: 'Mid-Level (3-5 yrs)',
    description: 'Standard industry questions, realistic difficulty.',
  },
  {
    id: 'senior',
    title: 'Senior (6+ yrs)',
    description: 'Harder questions, deep system design, leadership focus.',
  },
];

/**
 * For Indian exam roles, "difficulty" doesn't make sense — instead
 * we offer "interview depth" levels that affect how hard the panel grills.
 */
export const EXAM_DEPTH_LEVELS = [
  {
    id: 'fresher',
    title: 'First Mock',
    description: 'Gentle panel — get used to the format. Light follow-ups.',
  },
  {
    id: 'standard',
    title: 'Realistic',
    description: 'Real exam intensity. Standard follow-ups.',
  },
  {
    id: 'rigorous',
    title: 'Rigorous',
    description: 'Aggressive panel — deep grilling, stress questions.',
  },
];

/* ------------------------------------------------------------------ */
/* INTERVIEW MODES                                                    */
/* ------------------------------------------------------------------ */

export const INTERVIEW_MODES = [
  {
    id: 'text',
    title: 'Text Chat',
    description: 'Type your answers. AI asks follow-ups. Best for focused practice.',
    icon: 'MessageSquare',
  },
  {
    id: 'voice',
    title: 'Voice Interview',
    description: 'Speak your answers. AI talks back. Most realistic. Pro feature.',
    icon: 'Mic',
    pro: true,
  },
];
