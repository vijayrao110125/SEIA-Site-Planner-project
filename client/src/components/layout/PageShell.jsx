import StarsCanvas from "../../canvas/StarsCanvas.jsx";

export default function PageShell({ theme, showParticles, children, center = false }) {
  return (
    <div
      className={[
        "min-h-screen bg-[#f8fafc] dark:bg-[#0F1B2A] relative overflow-hidden",
        center ? "flex items-center justify-center p-6" : ""
      ].join(" ")}
    >
      {showParticles && <StarsCanvas theme={theme} />}
      {children}
    </div>
  );
}

