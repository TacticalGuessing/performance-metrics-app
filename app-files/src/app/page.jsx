export default function HomePage() {
  return (
    // Test body background from globals.css (bg-background-primary)
    // This main element will use a secondary background from our theme
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-background-secondary">
      <h1 className="text-4xl font-bold text-accent-primary hover:text-accent-hover">
        Performance Metrics App
      </h1>
      <p className="mt-4 text-textClr-primary">
        Tailwind CSS Styling Test!
      </p>
      <button className="mt-8 bg-accent-primary hover:bg-accent-hover text-textClr-on-accent font-semibold py-2 px-4 rounded-card">
        Test Button
      </button>

      {/* Test direct Tailwind utility class */}
      <div className="mt-10 p-6 bg-red-500 text-white rounded-lg">
        This box should be red if utilities work.
      </div>
    </main>
  );
}