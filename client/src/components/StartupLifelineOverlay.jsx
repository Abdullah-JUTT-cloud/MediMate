export default function StartupLifelineOverlay({ done }) {
  return (
    <div className={`startup-lifeline-overlay${done ? " startup-lifeline-overlay--done" : ""}`} aria-hidden={done}>
      <div className="startup-lifeline-wrap" role="status" aria-live="polite" aria-label="Loading MediMate">
        <svg className="startup-lifeline-svg" viewBox="0 0 600 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path
            className="startup-lifeline-track"
            d="M0 60 L120 60 L150 60 L170 38 L190 82 L210 60 L250 60 L300 10 L320 112 L360 60 L385 60 L400 44 L415 74 L430 60 L600 60"
          />
          <path
            className="startup-lifeline-pulse"
            d="M0 60 L120 60 L150 60 L170 38 L190 82 L210 60 L250 60 L300 10 L320 112 L360 60 L385 60 L400 44 L415 74 L430 60 L600 60"
          />
        </svg>
        <p className="startup-lifeline-text">Initializing Workspace</p>
      </div>
    </div>
  );
}
