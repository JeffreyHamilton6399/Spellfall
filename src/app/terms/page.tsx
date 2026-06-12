export default function TermsPage() {
  return (
    <div className="min-h-dvh bg-arena-950 px-6 py-12 max-w-2xl mx-auto">
      <h1 className="font-display font-black text-4xl text-white mb-2">Terms of Service</h1>
      <p className="text-ink-4 text-sm mb-8">Last updated: June 2026</p>

      <div className="prose prose-invert prose-sm max-w-none space-y-6 text-ink-2">
        <section>
          <h2 className="text-white font-bold text-lg mb-2">1. Acceptance</h2>
          <p>By playing Spellfall you agree to these terms. If you do not agree, please stop using the service.</p>
        </section>

        <section>
          <h2 className="text-white font-bold text-lg mb-2">2. Use of Service</h2>
          <p>Spellfall is a free browser game. You may use it for personal, non-commercial entertainment. You agree not to exploit bugs, cheat, or harass other players.</p>
        </section>

        <section>
          <h2 className="text-white font-bold text-lg mb-2">3. Data We Store</h2>
          <p>Spellfall stores a session token and display name in your browser's localStorage. No account is required and no personal data is sent to our servers beyond your chosen display name.</p>
        </section>

        <section>
          <h2 className="text-white font-bold text-lg mb-2">4. Availability</h2>
          <p>The game is provided as-is. We make no guarantees of uptime or feature availability and may change or discontinue the service at any time.</p>
        </section>

        <section>
          <h2 className="text-white font-bold text-lg mb-2">5. Liability</h2>
          <p>Spellfall is not liable for any damages arising from use or inability to use the service.</p>
        </section>

        <section>
          <h2 className="text-white font-bold text-lg mb-2">6. Contact</h2>
          <p>Questions? Reach out at <a href="mailto:jeffreyscotthamilton6399@gmail.com" className="text-emerald-400 underline">jeffreyscotthamilton6399@gmail.com</a>.</p>
        </section>
      </div>

      <a href="/" className="mt-10 inline-block text-ink-4 text-sm hover:text-ink-2 transition-colors">
        ← Back to home
      </a>
    </div>
  );
}
