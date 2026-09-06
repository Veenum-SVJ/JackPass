import { Link, useLocation } from 'react-router-dom';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { cn } from '@/lib/utils';

interface LegalDoc {
  key: string;
  title: string;
  updated: string;
  intro: string;
  sections: Array<{ heading: string; body: string[] }>;
}

const PRIVACY: LegalDoc = {
  key: 'privacy',
  title: 'Privacy Policy',
  updated: '7 September 2026',
  intro:
    'This policy explains what JackPass collects, why we collect it, and the choices you have. It applies to the JackPass website and services.',
  sections: [
    {
      heading: 'Information we collect',
      body: [
        'Account information: when you register, we store your email address, display name, and any university or course details you choose to add to your profile.',
        'Content you provide: question papers you upload (including the extracted text), forum posts and replies, feedback-board requests, lecturer reviews and ratings, and support messages.',
        'Usage information: when you use the app we record anonymised page views and actions (for example search, question views, uploads, votes) along with a session identifier, referrer, and browser type.',
        'Payment records: when you subscribe, our payment provider Paystack processes the transaction. We store only the payment reference, tier, amount, and status — never your card details.',
      ],
    },
    {
      heading: 'How we use information',
      body: [
        'To provide the service: showing past questions, moderating uploads, generating AI answers and marks schemes from uploaded papers, and operating the community features.',
        'To improve the product: aggregated analytics help us understand which features are used. Reports only cover aggregates such as page views and top actions.',
        'To communicate: transactional emails about your account or payments, and a weekly analytics digest sent to admins.',
        'To keep the platform safe: detecting abuse, enforcing our Terms, and complying with legal obligations.',
      ],
    },
    {
      heading: 'Third-party processors',
      body: [
        'Supabase — authentication, database, and file storage (supabase.com/privacy).',
        'Google AI (Gemini) — OCR text extraction and metadata/answer generation for uploaded papers (ai.google.dev — privacy terms apply to the content sent for processing).',
        'Paystack — payment processing (paystack.com/privacy).',
        'Resend — transactional email delivery for the admin digest (resend.com/privacy).',
        'Vercel — hosting (vercel.com/privacy).',
        'Each processor only receives the data needed for its function.',
      ],
    },
    {
      heading: 'Your choices and rights',
      body: [
        'You can update your profile details in Settings and delete content you posted where the app provides that option.',
        'You can ask us to export, correct, or delete your personal data by contacting us through the Support page.',
        'Deleting your account removes your profile and account data; question papers you uploaded that were already published are kept for other students unless you ask us to remove them, which we will assess on request.',
        'You may refuse optional analytics by not using the site, though basic page views are used to operate the service.',
      ],
    },
    {
      heading: 'Data retention and security',
      body: [
        'We keep account and content data while your account is active, and analytics in aggregate. Uploaded papers are retained to keep the library useful.',
        'Access to your account is protected by your Supabase login; payments are handled by Paystack under its security standards. No security measure is perfect.',
      ],
    },
    {
      heading: 'Contact',
      body: [
        'Questions about this policy can be sent through the Support page. This policy is not legal advice; if you have specific compliance questions please consult a professional.',
      ],
    },
  ],
};

const TERMS: LegalDoc = {
  key: 'terms',
  title: 'Terms of Service',
  updated: '7 September 2026',
  intro:
    'By creating an account or using JackPass you agree to these terms.',
  sections: [
    {
      heading: 'The service',
      body: [
        'JackPass lets students search, view, and solve past exam questions, upload question papers for the community, discuss courses, and review lecturers.',
        'Uploaded papers are reviewed before they are made public. We may reject or remove content that we believe infringes rights or violates these terms.',
      ],
    },
    {
      heading: 'Your account',
      body: [
        'You are responsible for keeping your login credentials safe and for activity on your account. Provide accurate information when you register.',
        'We may suspend accounts that are used for abuse, spam, harassment, or attempts to interfere with the platform.',
      ],
    },
    {
      heading: 'Content rules',
      body: [
        'Only upload papers you are allowed to share. Do not upload material that infringes copyright or other rights, contains personal data of others without consent, or is illegal.',
        'Be respectful in community posts, replies, feedback, and lecturer reviews. No harassment, hate, spam, or impersonation.',
      ],
    },
    {
      heading: 'AI answers and marks schemes',
      body: [
        'Answers and marks schemes shown on the platform are generated by AI from uploaded papers and may contain errors. Always verify against your course materials and lecturers. Use at your own discretion.',
      ],
    },
    {
      heading: 'Payments and subscriptions',
      body: [
        'Subscriptions are paid through Paystack. By subscribing you agree to Paystack’s terms for the payment transaction.',
        'Refunds are described in our Refund Policy.',
      ],
    },
    {
      heading: 'Liability',
      body: [
        'The service is provided “as is” without warranties of any kind. To the maximum extent permitted by law, JackPass is not liable for indirect or consequential loss arising from use of the service, uploaded content, or AI outputs.',
      ],
    },
    {
      heading: 'Changes and termination',
      body: [
        'We may update these terms; material changes will be reflected here. We may restrict or end access to the service for violations of these terms.',
        'These terms are governed by the laws of the Federal Republic of Nigeria.',
      ],
    },
  ],
};

const REFUNDS: LegalDoc = {
  key: 'refunds',
  title: 'Refund Policy',
  updated: '7 September 2026',
  intro:
    'This policy covers paid subscriptions purchased through JackPass.',
  sections: [
    {
      heading: 'What you are buying',
      body: [
        'Subscriptions grant time-limited access to JackPass features (for example the Premium tier for 30 days). Access starts when payment is confirmed by Paystack.',
      ],
    },
    {
      heading: 'Refunds',
      body: [
        'Because access is granted immediately, refunds are generally only available if the service fails to work as described — for example if you cannot access your subscription after a successful payment.',
        'To request a refund, contact us through the Support page within 14 days of purchase with your payment reference. We will review the request and, where approved, process the refund back to the original payment method via Paystack.',
      ],
    },
    {
      heading: 'Cancellation and renewals',
      body: [
        'If recurring billing is enabled on your subscription, you can cancel before the next renewal period to avoid further charges. Contact support if cancellation options are not available in the app.',
        'Paystack, not JackPass, processes the actual charge, and Paystack’s terms apply to the payment itself.',
      ],
    },
  ],
};

const COOKIES: LegalDoc = {
  key: 'cookies',
  title: 'Cookie & Tracking Policy',
  updated: '7 September 2026',
  intro:
    'JackPass uses a small amount of local storage and analytics so the site works and so we can see which pages are used.',
  sections: [
    {
      heading: 'What we store',
      body: [
        'Login session: your authentication session is stored in your browser so you stay signed in. This is handled by Supabase.',
        'Theme preference: your chosen light/dark theme is stored locally.',
        'Usage analytics: we record page views and key actions with a session identifier (no advertising or cross-site tracking).',
      ],
    },
    {
      heading: 'Third-party requests',
      body: [
        'Fonts are loaded from Google Fonts, which receives your IP address when the font files are fetched.',
        'We do not use advertising cookies, ad networks, or cross-site tracking pixels.',
      ],
    },
    {
      heading: 'Managing this',
      body: [
        'Clearing your browser’s site data will sign you out and reset your theme preference. Analytics for your session end when the session ends.',
      ],
    },
  ],
};

const DOCS: Record<string, LegalDoc> = {
  '/privacy': PRIVACY,
  '/terms': TERMS,
  '/refunds': REFUNDS,
  '/cookies': COOKIES,
};

export default function Legal() {
  const { pathname } = useLocation();
  const doc = DOCS[pathname] ?? PRIVACY;
  useDocumentMeta(`${doc.title} | JackPass`);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold font-headline">{doc.title}</h1>
        <p className="text-sm text-muted-foreground mt-2">Last updated: {doc.updated}</p>
        <p className="text-muted-foreground mt-4">{doc.intro}</p>
      </div>
      {doc.sections.map((section, i) => (
        <section key={section.heading} className={cn('mb-8', i > 0 && 'border-t border-border pt-6')}>
          <h2 className="text-xl font-semibold font-headline mb-3">{section.heading}</h2>
          {section.body.map((paragraph) => (
            <p key={paragraph.slice(0, 40)} className="text-sm text-muted-foreground leading-relaxed mb-3">
              {paragraph}
            </p>
          ))}
        </section>
      ))}
      <nav className="border-t border-border pt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm">
        <Link to="/privacy" className="text-primary hover:underline">Privacy</Link>
        <Link to="/terms" className="text-primary hover:underline">Terms</Link>
        <Link to="/refunds" className="text-primary hover:underline">Refunds</Link>
        <Link to="/cookies" className="text-primary hover:underline">Cookies</Link>
        <Link to="/support" className="text-muted-foreground hover:underline ml-auto">Contact via Support</Link>
      </nav>
    </div>
  );
}
