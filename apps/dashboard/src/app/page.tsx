export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="text-center space-y-6">
        <h1 className="text-5xl font-bold tracking-tight">
          <span className="text-orange-500">Sats</span>Guard
        </h1>
        <p className="text-xl text-gray-400 max-w-md">
          AI-powered Bitcoin guardian with quantum defense
        </p>
        <div className="flex gap-4 justify-center text-sm text-gray-500">
          <span>MIT Bitcoin Expo 2026</span>
          <span>|</span>
          <span>Team ACE</span>
        </div>
      </div>
    </main>
  );
}
