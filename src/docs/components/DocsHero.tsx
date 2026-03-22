export default function DocsHero() {
  return (
    <section className="relative py-28 overflow-hidden" style={{ backgroundColor: "#0a192f" }}>
      {/* Simple background */}
      <div className="absolute inset-0 z-0" style={{ backgroundColor: "#0a192f" }}></div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center">
          <p className="text-emerald-500 font-semibold mb-6 text-sm tracking-widest uppercase">
            Documentation
          </p>
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-black text-white mb-10 leading-none tracking-tight">
            Sentra CVM
          </h1>
          <p className="text-base md:text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed mb-12 font-light">
            Learn how to use every feature of the CVM platform. Find what you need and understand how it works.
          </p>
          <div className="flex justify-center">
            <a
              href="/docs/features/auth"
              className="px-8 py-3 bg-emerald-600 text-white font-semibold rounded hover:bg-emerald-700 transition-colors duration-200"
            >
              Get Started
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
