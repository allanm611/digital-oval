export default function DocsHero() {
  return (
    <section className="relative py-32 overflow-hidden" style={{ backgroundColor: "#0a192f" }}>
      {/* Background Gradients */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background: `
            radial-gradient(
              circle at 10% 20%,
              rgba(8, 69, 110, 0.33) 0%,
              transparent 40%
            ),
            radial-gradient(
              circle at 80% 70%,
              rgba(5, 150, 105, 0.28) 0%,
              transparent 40%
            )
          `,
        }}
      ></div>

      {/* Hex Pattern Overlay */}
      <div
        className="absolute inset-0 z-0 opacity-20"
        style={{
          backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><path d="M50 0L93.3 25v50L50 100L6.7 75V25L50 0z" fill="none" stroke="%23184e77" stroke-width="1" opacity="0.2"/></svg>')`,
          backgroundSize: "100px 100px",
          animation: "hexagonMove 60s linear infinite",
        }}
      ></div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight">
            Welcome to the{" "}
            <span className="text-emerald-400">
              Sentra CVM Frontend
            </span>
            <br />
            Documentation
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
            This is your central hub for learning about all features and how to use them.
          </p>
        </div>
      </div>
    </section>
  );
}
