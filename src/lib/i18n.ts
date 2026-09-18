/**
 * InterviewAce — Internationalization
 *
 * Two languages: English (en) + Professional Hindi (hi).
 *
 * NOTE ON HINDI QUALITY: All Hindi strings below are written in formal,
 * professional Hindi appropriate for government exam preparation contexts
 * (साक्षात्कार, व्यक्तित्व परीक्षण, बैंकिंग साक्षात्कार etc.) — NOT machine
 * translated. Hindi uses the official terminology used by UPSC/IBPS/SBI:
 *   - साक्षात्कार (not इंटरव्यू) for formal interview contexts
 *   - व्यक्तित्व परीक्षण for UPSC Personality Test
 *   - समिति for panel
 *   - उत्तर for answer
 */

export type Language = 'en' | 'hi';

export const LANGUAGES: { id: Language; label: string; nativeLabel: string }[] = [
  { id: 'en', label: 'English', nativeLabel: 'English' },
  { id: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी' },
];

/* ------------------------------------------------------------------ */
/* UI strings                                                         */
/* ------------------------------------------------------------------ */

export const UI_STRINGS = {
  en: {
    // Landing
    heroBadge: 'AI-Powered Mock Interviews',
    heroTitle1: 'Ace your next',
    heroTitleAccent: 'interview',
    heroTitle2: 'with AI mock sessions that feel real.',
    heroSubtitle:
      'Practice with an AI interviewer that asks real questions, follows up like a human, and gives you an honest scorecard after every session. 8 IT roles + 5 top Indian competitive exams.',
    startFree: 'Start Free Mock Interview',
    browseRoles: 'Browse Roles',
    noSignup: 'No sign-up required to try · Free tier · 8 IT roles + 5 Indian exams',
    howItWorks: 'How it works',
    threeSteps: 'Three steps. Fifteen minutes. Real feedback.',
    step1Title: 'Pick your role',
    step1Desc:
      '8 IT roles (SWE, Frontend, Backend, Data Scientist, DevOps, PM, Cloud, ML) + 5 Indian exams (UPSC, IBPS PO, SBI PO, CAT/IIM MBA, RBI Grade B).',
    step2Title: 'Do the interview',
    step2Desc:
      'The AI asks you questions one at a time, just like a real interviewer. Type your answers or speak them.',
    step3Title: 'Get your scorecard',
    step3Desc:
      'Honest scores across key dimensions, sample better answers, and a 7-day practice plan.',
    pickRole: 'Pick your role. Start practicing.',
    clickToStart: 'Click any role below to jump straight into a mock interview.',
    itJobs: 'IT Jobs',
    indianExams: 'Indian Competitive Exams',
    roles: 'roles',
    salary: 'Salary',
    start: 'Start',
    pricing: 'Simple Pricing',
    startFreeUpgrade: "Start free. Upgrade when you're ready.",
    noCard: 'No credit card required to start. Cancel anytime.',
    free: 'Free',
    tryItOut: 'Try it out. No card required.',
    month: '/month',
    year: '/year',
    savePercent: 'save 30%',
    pro: 'Pro',
    forSerious: 'For serious job seekers.',
    mostPopular: 'Most Popular',
    unlimited: 'Unlimited mock interviews',
    voiceMode: 'Voice mode (AI speaks + you speak)',
    detailedScorecard: 'Detailed scorecard with sample answers',
    practicePlan: 'Personalized 7-day practice plan',
    progressTracking: 'Progress tracking & history',
    textMode: 'Text mode',
    basicScorecard: 'Basic scorecard',
    mockInterviewsPerMonth: 'mock interviews per month',
    getPro: 'Get Pro',
    startFreeCta: 'Start Free',
    readyToNail: 'Ready to nail your next interview?',
    freeCta: 'Start a free mock interview now. No sign-up. No credit card. Just real practice.',

    // Role picker
    setupTitle: 'Set up your mock interview',
    setupSubtitle: 'Pick a role, choose difficulty, and start. The AI will handle the rest.',
    step1: 'Choose your interview type',
    language: 'Language',
    step2IT: 'Pick difficulty',
    step2Exam: 'Pick interview depth',
    step3: 'Pick mode',
    step4: 'Interview length',
    pickMode: 'Pick mode',
    interviewLength: 'Interview length',
    questions: 'questions',
    readyToPractice: 'Ready to practice:',
    pickRoleToContinue: 'Please pick a role to continue',
    startInterview: 'Start Interview',
    panel: 'panel',
    memberPanel: 'member panel',

    // Interview chat
    exit: 'Exit',
    speaking: 'Speaking',
    paused: 'Paused',
    voiceMode: 'Voice Mode',
    aiInterviewer: 'AI Interviewer',
    question: 'Question',
    of: 'of',
    yourInterviewerPreparing: 'Your interviewer is preparing...',
    interviewComplete: 'Interview complete! Generating your scorecard...',
    generatingWait: 'This takes about 20-30 seconds.',
    stopRecording: 'Stop Recording',
    transcribing: 'Transcribing...',
    recordMore: 'Record More',
    holdToSpeak: 'Hold to Speak',
    autoPlayOn: 'Auto-play: On',
    autoPlayOff: 'Auto-play: Off',
    replay: 'Replay',
    resume: 'Resume',
    pause: 'Pause',
    stop: 'Stop',
    typePlaceholder: 'Type your answer here...',
    cmdEnter: '(Cmd/Ctrl+Enter to send)',
    voicePlaceholder: 'Your transcribed answer will appear here. Edit if needed, then send.',
    typeAnswerHint: 'Answer the question, then send. The interviewer will ask the next one.',
    lastQuestionHint: "This is the last question. After your answer, you'll get your scorecard.",
    voiceHint: 'Click "Hold to Speak", answer out loud, then review and send.',
    tryAgain: 'Try Again',
    micPermissionDenied: 'Microphone permission denied. Please allow mic access in your browser.',
    couldNotAccessMic: 'Could not access microphone.',
    speechNotAvailable: 'Speech recognition not available in this browser. Try Chrome or Edge.',
    transcriptionFailed: 'Failed to transcribe audio.',

    // Scorecard
    generatingScorecard: 'Generating your scorecard...',
    overallScore: 'Overall Score',
    summary: 'Summary',
    scoresByCategory: 'Scores by Category',
    whatWentWell: 'What Went Well',
    whatToImprove: 'What to Improve',
    sampleAnswers: 'Sample Better Answers',
    practicePlan7: 'Practice Plan (Next 7 Days)',
    finalVerdict: 'Final Verdict',
    pass: 'Pass',
    borderline: 'Borderline',
    needsWork: 'Needs Work',
    practiceAgain: 'Practice Again',
    backToHome: 'Back to Home',
  },

  hi: {
    // Landing
    heroBadge: 'एआई-संचालित मॉक साक्षात्कार',
    heroTitle1: 'अपने अगले',
    heroTitleAccent: 'साक्षात्कार',
    heroTitle2: 'को वास्तविक महसूस कराने वाले एआई मॉक सत्रों से नखरे उठवाएँ।',
    heroSubtitle:
      'एक एआई साक्षात्कारकर्ता के साथ अभ्यास करें जो वास्तविक प्रश्न पूछता है, एक इंसान की तरह अनुसरण प्रश्न पूछता है, और हर सत्र के बाद ईमानदार स्कोरकार्ड देता है। 8 आईटी भूमिकाएँ + 5 प्रमुख भारतीय प्रतियोगी परीक्षाएँ।',
    startFree: 'निःशुल्क मॉक साक्षात्कार शुरू करें',
    browseRoles: 'भूमिकाएँ देखें',
    noSignup: 'आज़माने के लिए साइन-अप आवश्यक नहीं · निःशुल्क टियर · 8 आईटी + 5 भारतीय परीक्षा भूमिकाएँ',
    howItWorks: 'यह कैसे काम करता है',
    threeSteps: 'तीन चरण। पंद्रह मिनट। वास्तविक प्रतिक्रिया।',
    step1Title: 'अपनी भूमिका चुनें',
    step1Desc:
      '8 आईटी भूमिकाएँ (सॉफ्टवेयर इंजीनियर, फ्रंटएंड, बैकएंड, डेटा साइंटिस्ट, देवऑप्स, प्रोडक्ट मैनेजर, क्लाउड, एमएल) + 5 भारतीय परीक्षाएँ (यूपीएससी, आईबीपीएस पीओ, एसबीआई पीओ, कैट/आईआईएम, आरबीआई ग्रेड बी)।',
    step2Title: 'साक्षात्कार दें',
    step2Desc:
      'एआई आपसे एक वास्तविक साक्षात्कारकर्ता की तरह एक-एक करके प्रश्न पूछता है। अपने उत्तर लिखें या बोलें।',
    step3Title: 'अपना स्कोरकार्ड पाएँ',
    step3Desc:
      'प्रमुख आयामों पर ईमानदार स्कोर, बेहतर उत्तरों के नमूने, और 7-दिन की अभ्यास योजना।',
    pickRole: 'अपनी भूमिका चुनें। अभ्यास शुरू करें।',
    clickToStart: 'नीचे किसी भी भूमिका पर क्लिक करें और सीधे मॉक साक्षात्कार में कूदें।',
    itJobs: 'आईटी नौकरियाँ',
    indianExams: 'भारतीय प्रतियोगी परीक्षाएँ',
    roles: 'भूमिकाएँ',
    salary: 'वेतन',
    start: 'शुरू करें',
    pricing: 'सरल मूल्य निर्धारण',
    startFreeUpgrade: 'निःशुल्क शुरू करें। तैयार होने पर अपग्रेड करें।',
    noCard: 'शुरू करने के लिए क्रेडिट कार्ड आवश्यक नहीं। कभी भी रद्द करें।',
    free: 'निःशुल्क',
    tryItOut: 'आज़माएँ। कोई कार्ड आवश्यक नहीं।',
    month: '/माह',
    year: '/वर्ष',
    savePercent: '30% बचत',
    pro: 'प्रो',
    forSerious: 'गंभीर उम्मीदवारों के लिए।',
    mostPopular: 'सर्वाधिक लोकप्रिय',
    unlimited: 'असीमित मॉक साक्षात्कार',
    voiceMode: 'वॉयस मोड (एआई बोलता है + आप बोलते हैं)',
    detailedScorecard: 'नमूना उत्तरों के साथ विस्तृत स्कोरकार्ड',
    practicePlan: 'वैयक्तिकृत 7-दिन अभ्यास योजना',
    progressTracking: 'प्रगति ट्रैकिंग और इतिहास',
    textMode: 'टेक्स्ट मोड',
    basicScorecard: 'बुनियादी स्कोरकार्ड',
    mockInterviewsPerMonth: 'मॉक साक्षात्कार प्रति माह',
    getPro: 'प्रो लें',
    startFreeCta: 'निःशुल्क शुरू करें',
    readyToNail: 'अपने अगले साक्षात्कार में सफल होने के लिए तैयार?',
    freeCta: 'अभी निःशुल्क मॉक साक्षात्कार शुरू करें। साइन-अप नहीं। क्रेडिट कार्ड नहीं। बस वास्तविक अभ्यास।',

    // Role picker
    setupTitle: 'अपना मॉक साक्षात्कार सेट करें',
    setupSubtitle: 'भूमिका चुनें, कठिनाई चुनें और शुरू करें। बाकी एआई संभाल लेगा।',
    step1: 'अपना साक्षात्कार प्रकार चुनें',
    language: 'भाषा',
    step2IT: 'कठिनाई चुनें',
    step2Exam: 'साक्षात्कार गहराई चुनें',
    step3: 'मोड चुनें',
    step4: 'साक्षात्कार की लंबाई',
    pickMode: 'मोड चुनें',
    interviewLength: 'साक्षात्कार की लंबाई',
    questions: 'प्रश्न',
    readyToPractice: 'अभ्यास के लिए तैयार:',
    pickRoleToContinue: 'कृपया जारी रखने के लिए एक भूमिका चुनें',
    startInterview: 'साक्षात्कार शुरू करें',
    panel: 'समिति',
    memberPanel: 'सदस्य समिति',

    // Interview chat
    exit: 'बाहर निकलें',
    speaking: 'बोल रहा है',
    paused: 'रुका हुआ',
    voiceMode: 'वॉयस मोड',
    aiInterviewer: 'एआई साक्षात्कारकर्ता',
    question: 'प्रश्न',
    of: '/',
    yourInterviewerPreparing: 'आपके साक्षात्कारकर्ता की तैयारी हो रही है...',
    interviewComplete: 'साक्षात्कार पूरा! आपका स्कोरकार्ड बन रहा है...',
    generatingWait: 'इसमें लगभग 20-30 सेकंड लगेंगे।',
    stopRecording: 'रिकॉर्डिंग बंद करें',
    transcribing: 'लिखा जा रहा है...',
    recordMore: 'और बोलें',
    holdToSpeak: 'बोलने के लिए दबाएँ',
    autoPlayOn: 'ऑटो-प्ले: चालू',
    autoPlayOff: 'ऑटो-प्ले: बंद',
    replay: 'दोबारा सुनें',
    resume: 'जारी रखें',
    pause: 'रोकें',
    stop: 'बंद करें',
    typePlaceholder: 'यहाँ अपना उत्तर लिखें...',
    cmdEnter: '(भेजने के लिए Cmd/Ctrl+Enter)',
    voicePlaceholder: 'आपका लिखित उत्तर यहाँ दिखेगा। आवश्यक हो तो संपादित करें, फिर भेजें।',
    typeAnswerHint: 'उत्तर दें, फिर भेजें। साक्षात्कारकर्ता अगला प्रश्न पूछेगा।',
    lastQuestionHint: 'यह अंतिम प्रश्न है। आपके उत्तर के बाद आपको स्कोरकार्ड मिलेगा।',
    voiceHint: '"बोलने के लिए दबाएँ" पर क्लिक करें, ज़ोर से उत्तर दें, फिर समीक्षा करके भेजें।',
    tryAgain: 'पुनः प्रयास करें',
    micPermissionDenied: 'माइक्रोफ़ोन अनुमति अस्वीकृत। कृपया अपने ब्राउज़र में माइक एक्सेस की अनुमति दें।',
    couldNotAccessMic: 'माइक्रोफ़ोन तक पहुँचा नहीं जा सका।',
    speechNotAvailable: 'इस ब्राउज़र में वाक् पहचान उपलब्ध नहीं है। क्रोम या एज आज़माएँ।',
    transcriptionFailed: 'ऑडियो लिखने में विफल।',

    // Scorecard
    generatingScorecard: 'आपका स्कोरकार्ड बन रहा है...',
    overallScore: 'कुल स्कोर',
    summary: 'सारांश',
    scoresByCategory: 'श्रेणी-वार स्कोर',
    whatWentWell: 'जो अच्छा रहा',
    whatToImprove: 'किसमें सुधार करें',
    sampleAnswers: 'बेहतर उत्तरों के नमूने',
    practicePlan7: 'अभ्यास योजना (अगले 7 दिन)',
    finalVerdict: 'अंतिम निर्णय',
    pass: 'उत्तीर्ण',
    borderline: 'सीमांत',
    needsWork: 'सुधार आवश्यक',
    practiceAgain: 'फिर से अभ्यास करें',
    backToHome: 'मुख्य पृष्ठ पर जाएँ',
  },
} as const;

export type UIStringKey = keyof typeof UI_STRINGS.en;

/** Get a UI string for the given language. Falls back to English. */
export function t(lang: Language, key: UIStringKey): string {
  return UI_STRINGS[lang]?.[key] ?? UI_STRINGS.en[key];
}

/* ------------------------------------------------------------------ */
/* Difficulty / depth levels per language                             */
/* ------------------------------------------------------------------ */

export const DIFFICULTY_LEVELS_I18N = {
  en: [
    { id: 'junior', title: 'Junior (0-2 yrs)', description: 'Easier questions, more guidance, foundational topics.' },
    { id: 'mid', title: 'Mid-Level (3-5 yrs)', description: 'Standard industry questions, realistic difficulty.' },
    { id: 'senior', title: 'Senior (6+ yrs)', description: 'Harder questions, deep system design, leadership focus.' },
  ],
  hi: [
    { id: 'junior', title: 'फ्रेशर (0-2 वर्ष)', description: 'आसान प्रश्न, अधिक मार्गदर्शन, मूलभूत विषय।' },
    { id: 'mid', title: 'मध्यम स्तर (3-5 वर्ष)', description: 'मानक उद्योग प्रश्न, वास्तविक कठिनाई।' },
    { id: 'senior', title: 'वरिष्ठ (6+ वर्ष)', description: 'कठिन प्रश्न, गहन सिस्टम डिज़ाइन, नेतृत्व।' },
  ],
};

export const EXAM_DEPTH_LEVELS_I18N = {
  en: [
    { id: 'fresher', title: 'First Mock', description: 'Gentle panel — get used to the format. Light follow-ups.' },
    { id: 'standard', title: 'Realistic', description: 'Real exam intensity. Standard follow-ups.' },
    { id: 'rigorous', title: 'Rigorous', description: 'Aggressive panel — deep grilling, stress questions.' },
  ],
  hi: [
    { id: 'fresher', title: 'पहला मॉक', description: 'सौम्य समिति — प्रारूप से परिचित हों। हल्के अनुसरण प्रश्न।' },
    { id: 'standard', title: 'वास्तविक', description: 'वास्तविक परीक्षा की तीव्रता। मानक अनुसरण प्रश्न।' },
    { id: 'rigorous', title: 'कठोर', description: 'कड़ी समिति — गहन जिर्ह, दबाव प्रश्न।' },
  ],
};

export const INTERVIEW_MODES_I18N = {
  en: [
    { id: 'text', title: 'Text Chat', description: 'Type your answers. AI asks follow-ups. Best for focused practice.', icon: 'MessageSquare' },
    { id: 'voice', title: 'Voice Interview', description: 'Speak your answers. AI talks back. Most realistic.', icon: 'Mic', pro: true },
  ],
  hi: [
    { id: 'text', title: 'टेक्स्ट चैट', description: 'उत्तर टाइप करें। एआई अनुसरण प्रश्न पूछे। फोकस्ड अभ्यास के लिए सर्वोत्तम।', icon: 'MessageSquare' },
    { id: 'voice', title: 'वॉयस साक्षात्कार', description: 'उत्तर बोलें। एआई जवाब देता है। सबसे वास्तविक।', icon: 'Mic', pro: true },
  ],
};

export const LENGTH_OPTIONS_I18N = {
  en: [
    { count: 5, label: 'Quick', time: '~8 min' },
    { count: 8, label: 'Standard', time: '~15 min' },
    { count: 12, label: 'Deep', time: '~25 min' },
  ],
  hi: [
    { count: 5, label: 'त्वरित', time: '~8 मिनट' },
    { count: 8, label: 'मानक', time: '~15 मिनट' },
    { count: 12, label: 'गहन', time: '~25 मिनट' },
  ],
};

/* ------------------------------------------------------------------ */
/* Role titles in Hindi                                               */
/* ------------------------------------------------------------------ */

export const ROLE_TITLES_HI: Record<string, string> = {
  swe: 'सॉफ्टवेयर इंजीनियर',
  frontend: 'फ्रंटएंड डेवलपर',
  backend: 'बैकएंड डेवलपर',
  'data-scientist': 'डेटा साइंटिस्ट',
  devops: 'देवऑप्स इंजीनियर',
  'product-manager': 'प्रोडक्ट मैनेजर',
  'cloud-engineer': 'क्लाउड इंजीनियर',
  'ml-engineer': 'मशीन लर्निंग इंजीनियर',
  'upsc-cse': 'यूपीएससी सिविल सेवा',
  'ibps-po': 'आईबीपीएस पीओ',
  'sbi-po': 'एसबीआई पीओ',
  'cat-mba': 'कैट / आईआईएम एमबीए',
  'rbi-grade-b': 'आरबीआई ग्रेड बी',
};

/** Hindi display title for a role */
export function roleTitleHi(roleId: string): string {
  return ROLE_TITLES_HI[roleId] ?? roleId;
}

/* ------------------------------------------------------------------ */
/* Scoring dimension labels in Hindi                                  */
/* ------------------------------------------------------------------ */

export const DIMENSION_LABELS_HI: Record<string, string> = {
  communication: 'संप्रेषण',
  technical: 'तकनीकी गहराई',
  problem_solving: 'समस्या-समाधान',
  behavioral: 'व्यवहार / सांस्कृतिक उपयुक्तता',
  confidence: 'आत्मविश्वास और स्पष्टता',
  mental_alertness: 'मानसिक सतर्कता',
  critical_reasoning: 'आलोचनात्मक तर्क',
  ethics_integrity: 'नैतिकता और ईमानदारी',
  leadership: 'नेतृत्व और पहल',
  depth_awareness: 'गहराई और जागरूकता',
  banking_awareness: 'बैंकिंग एवं वित्तीय जागरूकता',
  personality: 'व्यक्तित्व एवं उपयुक्तता',
  situation_handling: 'परिस्थितिजन्य / एचआर',
  general_awareness: 'सामान्य जागरूकता',
  group_exercise: 'समूह अभ्यास',
  academic_depth: 'शैक्षणिक गहराई',
  career_clarity: 'करियर स्पष्टता',
  leadership_potential: 'नेतृत्व क्षमता',
  awareness: 'सामान्य जागरूकता',
  analytical_thinking: 'विश्लेषणात्मक चिंतन',
  economic_awareness: 'आर्थिक एवं बैंकिंग जागरूकता',
  current_affairs: 'समकालीन घटनाक्रम',
  analytical_ability: 'विश्लेषणात्मक योग्यता',
};

/* ------------------------------------------------------------------ */
/* Speech language mapping                                            */
/* ------------------------------------------------------------------ */

export function speechLang(lang: Language): string {
  return lang === 'hi' ? 'hi-IN' : 'en-IN';
}
