import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — InterviewAce',
  description: 'How InterviewAce handles your data.',
  robots: { index: true, follow: true },
};

export default function PrivacyPolicyPage() {
  return (
    <article className="prose prose-invert prose-slate mx-auto max-w-3xl px-6 py-16">
      <h1>Privacy Policy</h1>
      <p className="text-sm text-muted-foreground">Last updated: July 30, 2026</p>

      <p>
        InterviewAce (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) operates the InterviewAce mobile
        application and website (the &quot;Service&quot;). This Privacy Policy explains what data we
        collect, how we use it, and the choices you have.
      </p>

      <h2>1. Data We Collect</h2>
      <h3>1.1 Account Data</h3>
      <p>
        When you create an account, we collect your email address and a display name
        of your choice. We use this to identify you across sessions and to send
        service-related emails (receipts, security alerts).
      </p>
      <h3>1.2 Interview Content</h3>
      <p>
        To provide the AI mock interview feature, we send the text of your interview
        answers (and, in voice mode, the audio recording of your answers) to our AI
        provider for processing. The AI provider returns a transcript, an AI
        interviewer response, and a scorecard. We store the transcript and scorecard
        in your account so you can review past interviews.
      </p>
      <h3>1.3 Voice Data</h3>
      <p>
        If you use Voice Interview mode, we collect audio recordings of your spoken
        answers and process them through speech-to-text. Audio is processed in
        real-time and is not retained after transcription, unless you explicitly save
        the interview.
      </p>
      <h3>1.4 Usage Data</h3>
      <p>
        We collect anonymous usage analytics: which features you use, how long you
        spend in the app, and crash reports. This helps us fix bugs and improve the
        product.
      </p>
      <h3>1.5 Payment Data</h3>
      <p>
        Payments are processed by Google Play Billing. We never see or store your
        credit card number — Google handles all payment information. We only receive
        a notification that your subscription is active and when it expires.
      </p>

      <h2>2. How We Use Your Data</h2>
      <ul>
        <li>To provide the AI mock interview service</li>
        <li>To generate personalized scorecards and practice plans</li>
        <li>To send you receipts and subscription notifications</li>
        <li>To improve our prompts, scoring accuracy, and user experience</li>
        <li>To detect and prevent fraud or abuse</li>
      </ul>

      <h2>3. Data Sharing</h2>
      <p>
        We do not sell your data. We share data only with the following categories of
        service providers, under contracts that limit their use of your data:
      </p>
      <ul>
        <li><strong>AI Provider</strong> — processes your interview text and audio to generate AI responses</li>
        <li><strong>Hosting Provider</strong> — stores the Service and your account data</li>
        <li><strong>Google Play</strong> — handles subscription billing</li>
        <li><strong>Analytics Provider</strong> — receives anonymous usage data</li>
      </ul>
      <p>
        We may disclose data if required by law, or in connection with a merger,
        acquisition, or asset sale.
      </p>

      <h2>4. Data Retention</h2>
      <p>
        We retain your interview transcripts and scorecards for as long as your
        account is active. You can delete individual interviews at any time. You can
        delete your entire account and all associated data by emailing
        <a href="mailto:support@interviewace.app">support@interviewace.app</a>.
      </p>

      <h2>5. Your Rights</h2>
      <p>Depending on your location, you may have the right to:</p>
      <ul>
        <li>Access the personal data we hold about you</li>
        <li>Correct inaccurate data</li>
        <li>Delete your data</li>
        <li>Export your data in a portable format</li>
        <li>Withdraw consent to data processing</li>
      </ul>
      <p>
        To exercise any of these rights, email
        <a href="mailto:support@interviewace.app">support@interviewace.app</a>.
      </p>

      <h2>6. Children&apos;s Privacy</h2>
      <p>
        InterviewAce is intended for adults seeking employment. We do not knowingly
        collect data from children under 16. If you believe we have collected data
        from a child, please contact us and we will delete it.
      </p>

      <h2>7. Security</h2>
      <p>
        We use industry-standard security measures including HTTPS encryption,
        hashed passwords, and access controls. No method of transmission over the
        Internet is 100% secure, but we do our best to protect your data.
      </p>

      <h2>8. Changes to This Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. We will notify you of
        material changes by email or in-app notification at least 30 days before the
        change takes effect.
      </p>

      <h2>9. Contact</h2>
      <p>
        If you have questions about this Privacy Policy, email
        <a href="mailto:support@interviewace.app">support@interviewace.app</a>.
      </p>
    </article>
  );
}
