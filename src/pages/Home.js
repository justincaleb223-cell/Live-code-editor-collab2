import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import "./Home.css";

function Home() {
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState("");
  const [username, setUsername] = useState("");

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
            <span className="topbar-link active">Workspace</span>
            <span className="topbar-link">Logs</span>
            <span className="topbar-link">Settings</span>
          </nav>
        </header>

        <div className="home-center">
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
        </div>

        {/* Decorative background code */}
        <div className="bg-code-preview" aria-hidden="true">
          <pre>{`import codeblend_sdk as cb
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
