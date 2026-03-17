export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden transition-colors duration-500 text-slate-200 dark:text-slate-800">
      {/* Base Layer - Theme specific Background */}
      <div className="absolute inset-0 bg-white dark:bg-black transition-colors duration-500" />

      {/* Corporate Grid Overlay */}
      <div
        className="absolute inset-0 opacity-[0.4] dark:opacity-[0.1]"
        style={{
          backgroundImage: `
            linear-gradient(to right, currentColor 1px, transparent 1px),
            linear-gradient(to bottom, currentColor 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
        }}
      />

      {/* Mesh Gradients - Corporate Colors */}
      <div className="absolute inset-0">
        {/* Top Right - Cyan/Blue - More visible in light mode */}
        <div className="absolute -top-[10%] -right-[10%] w-[60%] h-[60%] rounded-full bg-cyan-200/40 dark:bg-cyan-900/20 blur-[140px] animate-pulse" style={{ animationDuration: '8s' }} />

        {/* Bottom Left - Indigo/Purple - More visible in light mode */}
        <div className="absolute -bottom-[10%] -left-[10%] w-[60%] h-[60%] rounded-full bg-indigo-200/40 dark:bg-indigo-900/20 blur-[140px] animate-pulse" style={{ animationDuration: '10s' }} />
      </div>

      {/* Architectural Technical Lines - Stronger in light mode */}
      <div className="absolute inset-0 opacity-[0.2] dark:opacity-[0.3]">
        <div className="absolute top-[20%] left-0 w-full h-[1px] bg-current" />
        <div className="absolute top-[60%] left-0 w-full h-[1px] bg-current" />
        <div className="absolute left-[30%] top-0 h-full w-[1px] bg-current" />
        <div className="absolute left-[70%] top-0 h-full w-[1px] bg-current" />
      </div>

      {/* Radial Mask - Fade edges */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(255,255,255,0.2)_100%)] dark:bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.6)_100%)]" />
    </div>
  );
}
