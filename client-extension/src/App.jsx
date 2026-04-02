import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [apiKey, setApiKey] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.get(["hf_api_key"], (res) => {
        if (res.hf_api_key) setApiKey(res.hf_api_key);
      });
    }
  }, []);

  const handleSave = () => {
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.set({ hf_api_key: apiKey }, () => {
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
      });
    }
  };

  return (
    <div className="container">
      <header className="header">
        <span className="logo-emoji">🤖</span>
        <h1>PR Architect</h1>
      </header>
      <div className="form-group">
        <label className="label">Hugging Face Token</label>
        <input
          type="password"
          className="input-field"
          placeholder="hf_..."
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
      </div>
      <button className="btn-primary" onClick={handleSave} disabled={!apiKey}>
        {isSaved ? "Saved!" : "Save Configuration"}
      </button>
      <div className="status-card">
        <div className="status-title">System Status</div>

        <div className="status-item">
          <div className="status-content">
            <div className={`dot ${apiKey ? "online" : "offline"}`}></div>
            <span>AI Engine</span>
          </div>
          <span style={{ color: "var(--text-secondary)" }}>
            {apiKey ? "Ready" : "Missing Token"}
          </span>
        </div>

        <div className="status-item">
          <div className="status-content">
            <div className="dot pending"></div>
            <span>Backend</span>
          </div>
          <span style={{ color: "var(--text-secondary)" }}>Phase 2</span>
        </div>
      </div>
    </div>
  );
}

export default App;
