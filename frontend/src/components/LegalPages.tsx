import { ArrowLeft, Zap } from 'lucide-react';

function LegalLayout({ title, children, onBack }: { title: string; children: React.ReactNode; onBack: () => void }) {
  return (
    <div className="min-h-screen bg-[#FFFBF7] dark:bg-[#0D0D0F] transition-colors" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <header className="bg-white dark:bg-[#1A1A1F] border-b border-[#1E1E2E]/10 dark:border-white/10 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-[#1E1E2E]/5 dark:hover:bg-white/10 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5 text-[#1E1E2E] dark:text-white" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-[#FF6B4A] to-[#FF8F6B] rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-semibold text-[#1E1E2E] dark:text-white" style={{ fontFamily: "'Instrument Serif', serif" }}>Quizimple</span>
          </div>
        </div>
      </header>
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-semibold text-[#1E1E2E] dark:text-white mb-8" style={{ fontFamily: "'Instrument Serif', serif" }}>{title}</h1>
        <div className="prose prose-gray dark:prose-invert max-w-none text-[#1E1E2E]/70 dark:text-white/70 space-y-6 text-sm leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  );
}

export function TermsPage({ onBack }: { onBack: () => void }) {
  return (
    <LegalLayout title="Terms of Service" onBack={onBack}>
      <p><strong>Last updated:</strong> March 2026</p>

      <h2 className="text-lg font-semibold text-[#1E1E2E] dark:text-white mt-8">1. Acceptance of Terms</h2>
      <p>By accessing or using Quizimple ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.</p>

      <h2 className="text-lg font-semibold text-[#1E1E2E] dark:text-white mt-8">2. Description of Service</h2>
      <p>Quizimple is an online platform that allows users to create, host, and participate in interactive quizzes. The Service includes quiz creation tools, real-time multiplayer sessions, analytics, template sharing, and group management features.</p>

      <h2 className="text-lg font-semibold text-[#1E1E2E] dark:text-white mt-8">3. User Accounts</h2>
      <p>You are responsible for maintaining the confidentiality of your account credentials. You agree to provide accurate information when creating an account and to update your information as necessary. You are responsible for all activities that occur under your account.</p>

      <h2 className="text-lg font-semibold text-[#1E1E2E] dark:text-white mt-8">4. User Content</h2>
      <p>You retain ownership of the content you create on Quizimple, including quizzes, questions, and templates. By publishing templates to the marketplace, you grant other users the right to use and copy those templates. You agree not to upload content that is unlawful, harmful, or infringes on the rights of others.</p>

      <h2 className="text-lg font-semibold text-[#1E1E2E] dark:text-white mt-8">5. Acceptable Use</h2>
      <p>You agree not to: (a) use the Service for any illegal purpose; (b) attempt to gain unauthorized access to the Service; (c) interfere with or disrupt the Service; (d) upload malicious content; or (e) use the Service to harass or harm others.</p>

      <h2 className="text-lg font-semibold text-[#1E1E2E] dark:text-white mt-8">6. Termination</h2>
      <p>We reserve the right to suspend or terminate your account at any time for violation of these terms. You may delete your account at any time through the Settings page.</p>

      <h2 className="text-lg font-semibold text-[#1E1E2E] dark:text-white mt-8">7. Disclaimer</h2>
      <p>The Service is provided "as is" without warranties of any kind. We do not guarantee that the Service will be uninterrupted, secure, or error-free.</p>

      <h2 className="text-lg font-semibold text-[#1E1E2E] dark:text-white mt-8">8. Changes to Terms</h2>
      <p>We may update these terms from time to time. Continued use of the Service after changes constitutes acceptance of the updated terms.</p>

      <h2 className="text-lg font-semibold text-[#1E1E2E] dark:text-white mt-8">9. Contact</h2>
      <p>For questions about these terms, please contact us through the platform.</p>
    </LegalLayout>
  );
}

export function PrivacyPage({ onBack }: { onBack: () => void }) {
  return (
    <LegalLayout title="Privacy Policy" onBack={onBack}>
      <p><strong>Last updated:</strong> March 2026</p>

      <h2 className="text-lg font-semibold text-[#1E1E2E] dark:text-white mt-8">1. Information We Collect</h2>
      <p>We collect information you provide directly: email address, username, and quiz content. When you use Google Sign-In, we receive your name and email from Google. We also collect usage data such as quiz participation history and analytics.</p>

      <h2 className="text-lg font-semibold text-[#1E1E2E] dark:text-white mt-8">2. How We Use Your Information</h2>
      <p>We use your information to: (a) provide and maintain the Service; (b) authenticate your identity; (c) display your username to other participants during quiz sessions; (d) generate analytics and session history; and (e) improve the Service.</p>

      <h2 className="text-lg font-semibold text-[#1E1E2E] dark:text-white mt-8">3. Data Storage</h2>
      <p>Your data is stored securely on our servers. Passwords are hashed using industry-standard encryption. We do not store raw passwords.</p>

      <h2 className="text-lg font-semibold text-[#1E1E2E] dark:text-white mt-8">4. Data Sharing</h2>
      <p>We do not sell your personal information to third parties. Your quiz content is only visible to participants you invite. Templates you publish to the marketplace are visible to other users based on your chosen visibility settings (public, private, or group).</p>

      <h2 className="text-lg font-semibold text-[#1E1E2E] dark:text-white mt-8">5. Your Rights</h2>
      <p>You can: (a) access and update your account information through Settings; (b) delete your account and all associated data; (c) export your quiz data; and (d) control the visibility of your templates.</p>

      <h2 className="text-lg font-semibold text-[#1E1E2E] dark:text-white mt-8">6. Security</h2>
      <p>We implement appropriate security measures to protect your data. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.</p>

      <h2 className="text-lg font-semibold text-[#1E1E2E] dark:text-white mt-8">7. Changes to This Policy</h2>
      <p>We may update this Privacy Policy from time to time. We will notify you of any significant changes.</p>

      <h2 className="text-lg font-semibold text-[#1E1E2E] dark:text-white mt-8">8. Contact</h2>
      <p>For privacy-related questions, please contact us through the platform.</p>
    </LegalLayout>
  );
}

export function CookiesPage({ onBack }: { onBack: () => void }) {
  return (
    <LegalLayout title="Cookie Settings" onBack={onBack}>
      <p><strong>Last updated:</strong> March 2026</p>

      <h2 className="text-lg font-semibold text-[#1E1E2E] dark:text-white mt-8">1. What Are Cookies</h2>
      <p>Cookies are small text files stored on your device when you visit a website. They help the website remember your preferences and provide a better user experience.</p>

      <h2 className="text-lg font-semibold text-[#1E1E2E] dark:text-white mt-8">2. How We Use Cookies</h2>
      <p>Quizimple uses minimal cookies and local storage for:</p>
      <ul className="list-disc pl-6 space-y-2">
        <li><strong>Authentication:</strong> We store a JWT token in localStorage to keep you logged in between sessions.</li>
        <li><strong>Theme Preference:</strong> We store your light/dark mode preference in localStorage.</li>
        <li><strong>Admin Session:</strong> Admin dashboard authentication is stored in localStorage.</li>
      </ul>

      <h2 className="text-lg font-semibold text-[#1E1E2E] dark:text-white mt-8">3. Third-Party Cookies</h2>
      <p>If you use Google Sign-In, Google may set cookies according to their own cookie policy. We do not use any advertising or tracking cookies.</p>

      <h2 className="text-lg font-semibold text-[#1E1E2E] dark:text-white mt-8">4. Managing Cookies</h2>
      <p>You can clear cookies and localStorage data through your browser settings. Note that clearing authentication data will log you out of the Service.</p>

      <h2 className="text-lg font-semibold text-[#1E1E2E] dark:text-white mt-8">5. No Tracking</h2>
      <p>We do not use cookies for advertising, analytics tracking, or cross-site tracking. We respect your privacy and keep data collection to the minimum necessary for the Service to function.</p>
    </LegalLayout>
  );
}
