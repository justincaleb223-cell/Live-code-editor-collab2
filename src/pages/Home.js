import React, { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useSettings } from "../hooks/useSettings";
import "./Home.css";

function Home() {
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState("");
  const [username, setUsername] = useState("");
  const [activeTab, setActiveTab] = useState("workspace");
  const { settings, setSetting, resetSettings } = useSettings();

  // Pre-fill username from saved settings
  useEffect(() => {
    if (settings.defaultUsername && !username) {
      setUsername(settings.defaultUsername);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.defaultUsername]);

  const createNewRoom = (e) => {
    e.preventDefault();
    const id = uuidv4();
    setRoomId(id);
    toast.success("New room created — copy the ID and share it!");
  };

  const copyRoomId = async (e) => {
    e.preventDefault();
    if (!roomId) return;
    try {
      await navigator.clipboard.writeText(roomId);
      toast.success("Room ID copied to clipboard!");
    } catch {
      toast.error("Could not copy — please copy manually.");
    }
  };

  const handleInputEnter = (e) => {
    if (e.code === "Enter") joinRoom();
  };

  const joinRoom = () => {
    if (!roomId || !username) {
      toast.error("Room ID and username are required");
      return;
    }
    // Save username as default for next time
    setSetting("defaultUsername", username);
    navigate(`/editor/${roomId}`, { state: { username } });
  };

  return (
    <div className="home-root">
      {/* Left sidebar */}
      <aside className="home-sidebar">
        <div className="sidebar-logo">CX</div>
        <nav className="sidebar-icons">
          <span className="sidebar-icon active" title="Workspace">
            ⊞
          </span>
          <span className="sidebar-icon" title="Extensions">
            ⊕
          </span>
          <span className="sidebar-icon" title="Collaboration">
            ⊗
          </span>
          <span className="sidebar-icon" title="Plugins">
            ⊘
          </span>
          <span className="sidebar-icon" title="Gallery">
            ⊙
          </span>
        </nav>
        <div className="sidebar-bottom">
          <span className="sidebar-icon" title="Help">
            ?
          </span>
          <span className="sidebar-icon" title="Settings">
            ⚙
          </span>
        </div>
      </aside>

      <main className="home-main">
        {/* Top nav */}
        <header className="home-topbar">
          <span className="topbar-brand">CodeMaxxer by Raunak</span>
          <nav className="topbar-nav">
            <span
              className={`topbar-link${
                activeTab === "workspace" ? " active" : ""
              }`}
              onClick={() => setActiveTab("workspace")}
            >
              Workspace
            </span>
            <span
              className={`topbar-link${activeTab === "logs" ? " active" : ""}`}
              onClick={() => setActiveTab("logs")}
            >
              Logs
            </span>
            <span
              className={`topbar-link${
                activeTab === "settings" ? " active" : ""
              }`}
              onClick={() => setActiveTab("settings")}
            >
              Settings
            </span>
          </nav>
        </header>

        <div className="home-center">
          {activeTab === "workspace" && (
            <div className="home-card">
              <h1 className="card-headline">Logic Awaits.</h1>
              <p className="card-sub">
                Join a session or start a fresh collaborative workspace.
              </p>

              {/* Step 1 — Room ID */}
              <div className="form-section">
                <label className="form-label">ROOM ID</label>
                <div className="input-row">
                  <input
                    className="form-input"
                    type="text"
                    placeholder="Paste invite room ID"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    onKeyUp={handleInputEnter}
                  />
                  {roomId && (
                    <button
                      className="input-icon-btn"
                      onClick={copyRoomId}
                      title="Copy Room ID"
                    >
                      ⎘
                    </button>
                  )}
                </div>
              </div>

              {/* Step 2 — Username */}
              <div className="form-section">
                <label className="form-label">YOUR NAME</label>
                <div className="input-row">
                  <input
                    className="form-input"
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onKeyUp={handleInputEnter}
                  />
                </div>
              </div>

              {/* Join button */}
              <button className="init-btn" onClick={joinRoom}>
                Join Workspace
              </button>

              {/* Create new room */}
              <div className="divider">
                <span>OR</span>
              </div>

              <p className="create-info">
                Don't have an invite?{" "}
                <a href="/" className="create-link" onClick={createNewRoom}>
                  ↗ Create new room
                </a>
              </p>
            </div>
          )}

          {activeTab === "logs" && (
            <div className="home-card logs-card">
              <h1 className="card-headline">Activity Logs</h1>
              <p className="card-sub">
                Real-time event history from your collaborative sessions.
              </p>
              <div className="logs-placeholder">
                <span className="logs-placeholder-icon">◈</span>
                <p>Join a workspace to start collecting logs.</p>
                <p className="logs-placeholder-hint">
                  Room events like joins, leaves, typing, and code changes will
                  appear here.
                </p>
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="home-card settings-card">
              <h1 className="card-headline">Settings</h1>
              <p className="card-sub">Customize your CodeMaxxer experience.</p>

              {/* ── Editor ── */}
              <div className="settings-section">
                <span className="settings-section-title">Editor</span>

                <label className="settings-row">
                  <span>Font Size</span>
                  <span className="settings-value">{settings.fontSize}px</span>
                  <input
                    type="range"
                    min={12}
                    max={18}
                    value={settings.fontSize}
                    onChange={(e) =>
                      setSetting("fontSize", Number(e.target.value))
                    }
                  />
                </label>

                <label className="settings-row">
                  <span>Tab Size</span>
                  <div className="settings-toggle-group">
                    <button
                      className={settings.tabSize === 2 ? "active" : ""}
                      onClick={() => setSetting("tabSize", 2)}
                    >
                      2
                    </button>
                    <button
                      className={settings.tabSize === 4 ? "active" : ""}
                      onClick={() => setSetting("tabSize", 4)}
                    >
                      4
                    </button>
                  </div>
                </label>

                <label className="settings-row">
                  <span>Word Wrap</span>
                  <button
                    className={`settings-toggle${
                      settings.wordWrap ? " on" : ""
                    }`}
                    onClick={() => setSetting("wordWrap", !settings.wordWrap)}
                  >
                    {settings.wordWrap ? "On" : "Off"}
                  </button>
                </label>

                <label className="settings-row">
                  <span>Line Numbers</span>
                  <button
                    className={`settings-toggle${
                      settings.lineNumbers ? " on" : ""
                    }`}
                    onClick={() =>
                      setSetting("lineNumbers", !settings.lineNumbers)
                    }
                  >
                    {settings.lineNumbers ? "On" : "Off"}
                  </button>
                </label>

                <label className="settings-row">
                  <span>Highlight Active Line</span>
                  <button
                    className={`settings-toggle${
                      settings.activeLine ? " on" : ""
                    }`}
                    onClick={() =>
                      setSetting("activeLine", !settings.activeLine)
                    }
                  >
                    {settings.activeLine ? "On" : "Off"}
                  </button>
                </label>
              </div>

              {/* ── Collaboration ── */}
              <div className="settings-section">
                <span className="settings-section-title">Collaboration</span>

                <label className="settings-row">
                  <span>Typing Indicators</span>
                  <button
                    className={`settings-toggle${
                      settings.showTyping ? " on" : ""
                    }`}
                    onClick={() =>
                      setSetting("showTyping", !settings.showTyping)
                    }
                  >
                    {settings.showTyping ? "On" : "Off"}
                  </button>
                </label>

                <label className="settings-row">
                  <span>Remote Cursors</span>
                  <button
                    className={`settings-toggle${
                      settings.showRemoteCursors ? " on" : ""
                    }`}
                    onClick={() =>
                      setSetting(
                        "showRemoteCursors",
                        !settings.showRemoteCursors,
                      )
                    }
                  >
                    {settings.showRemoteCursors ? "On" : "Off"}
                  </button>
                </label>
              </div>

              {/* ── Account ── */}
              <div className="settings-section">
                <span className="settings-section-title">Account</span>

                <label className="settings-row">
                  <span>Default Username</span>
                  <input
                    className="settings-input"
                    type="text"
                    placeholder="Your name"
                    value={settings.defaultUsername}
                    onChange={(e) =>
                      setSetting("defaultUsername", e.target.value)
                    }
                  />
                </label>
              </div>

              {/* ── Actions ── */}
              <div className="settings-actions">
                <button className="settings-reset-btn" onClick={resetSettings}>
                  Reset to Defaults
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Decorative background code */}
        <div className="bg-code-preview" aria-hidden="true">
          <pre>{`import live_code_editor_sdk as lce
from core import Architect

# Initialize the workspace environment
class ProjectController:
    def __init__(self, name):
        self.project_name = name
        self.status = 'initializing'

    async def deploy_cluster(self):
        print(f"Spinning up {self.project_name}...")
        return await cb.launch_node(
            region='us-east-monolith-1',
            tier='optimized-graphite'
        )

# Ready for collaboration`}</pre>
        </div>
      </main>
    </div>
  );
}

export default Home;
