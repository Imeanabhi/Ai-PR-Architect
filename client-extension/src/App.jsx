import "./App.css";

function App() {
  return (
    <div className="container">
      <header className="header">
        <span className="logo-emoji">📊</span>
        <h1>PR Architect</h1>
      </header>

      <div className="status-card">
        <div className="status-title">System Status</div>

        <div className="status-item">
          <div className="status-content">
            <div className="dot online"></div>
            <span>AI-Free Mode</span>
          </div>
          <span style={{ color: "var(--text-secondary)" }}>Active</span>
        </div>

        <div className="status-item">
          <div className="status-content">
            <div className="dot online"></div>
            <span>Backend</span>
          </div>
          <span style={{ color: "var(--text-secondary)" }}>Phase 2</span>
        </div>
      </div>

      <div
        style={{
          marginTop: "20px",
          fontSize: "12px",
          color: "#666",
          textAlign: "center",
        }}
      >
        ✓ No API keys required
        <br />
        ✓ Works immediately
        <br />✓ Generates summaries from commit history
      </div>
    </div>
  );
}

export default App;
