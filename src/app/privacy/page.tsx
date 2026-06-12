export default function PrivacyPage() {
  return (
    <div className="min-h-dvh bg-arena-950 px-6 py-12 max-w-2xl mx-auto">
      <h1 className="font-display font-black text-4xl text-white mb-2">Privacy Policy</h1>
      <p className="text-ink-4 text-sm mb-8">Last updated: June 2026</p>

      <div className="prose prose-invert prose-sm max-w-none space-y-6 text-ink-2">
        <section>
          <h2 className="text-white font-bold text-lg mb-2">What we collect</h2>
          <p>Spellfall collects only what is necessary to run the game:</p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>Your chosen <strong>display name</strong> — stored locally in your browser and sent to game rooms so other players can see who you are.</li>
            <li>A random <strong>session token</strong> — generated locally to reconnect you to a room if you lose connection. It never leaves your browser except to identify your WebSocket connection.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-white font-bold text-lg mb-2">What we don't collect</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>No email addresses or accounts</li>
            <li>No passwords</li>
            <li>No payment information</li>
            <li>No tracking cookies or advertising identifiers</li>
          </ul>
        </section>

        <section>
          <h2 className="text-white font-bold text-lg mb-2">Game room data</h2>
          <p>Words you submit and in-game events are processed in real-time by our game servers (hosted on PartyKit) and are not stored after a match ends.</p>
        </section>

        <section>
          <h2 className="text-white font-bold text-lg mb-2">Third parties</h2>
          <p>We use <a href="https://partykit.io" className="text-emerald-400 underline" target="_blank" rel="noopener noreferrer">PartyKit</a> for real-time multiplayer infrastructure. Please review their privacy policy for details on how they process connection data.</p>
        </section>

        <section>
          <h2 className="text-white font-bold text-lg mb-2">Contact</h2>
          <p>Privacy questions? Email <a href="mailto:jeffreyscotthamilton6399@gmail.com" className="text-emerald-400 underline">jeffreyscotthamilton6399@gmail.com</a>.</p>
        </section>
      </div>

      <a href="/" className="mt-10 inline-block text-ink-4 text-sm hover:text-ink-2 transition-colors">
        ← Back to home
      </a>
    </div>
  );
}
