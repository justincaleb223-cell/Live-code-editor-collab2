import React, { useState, useRef, useCallback, useEffect } from "react";
import toast from "react-hot-toast";
import {
  Navigate,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import Client from "../components/Client";
import Editor from "../components/Editor";
import Logs from "../components/Logs";
import { useSocket } from "../hooks/useSocket";
import { useVoiceChat } from "../hooks/useVoiceChat";
import "./EditorPage.css";

function EditorPage() {
  const location = useLocation();
  const { roomId } = useParams();
  const reactNavigator = useNavigate();

  const [clients, setClients] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [showLogs, setShowLogs] = useState(false);
  const [logs, setLogs] = useState([]);
  const codeRef = useRef(null);
  const logTimerRef = useRef(null);

  const username = location.state?.username;

  const addLog = useCallback((type, message) => {
    setLogs((prev) => [...prev, { type, message, timestamp: Date.now() }]);
  }, []);

  useEffect(() => {
    if (username) {
      addLog("system", `You joined as ${username}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClientsUpdate = useCallback(
    (data, eventUser) => {
      if (data === null) {
        toast.error("Socket connection failed, try again later");
        reactNavigator("/");
        return;
      }
      if (data?.remove) {
        setClients((prev) => prev.filter((c) => c.socketId !== data.remove));
        if (eventUser) {
          toast.success(`${eventUser} left the room.`);
          addLog("leave", `${eventUser} left the room`);
        }
        return;
      }
      setClients(data);
      if (eventUser) {
        toast.success(`${eventUser} joined the room.`);
        addLog("join", `${eventUser} joined the room`);
      }
    },
    [reactNavigator, addLog],
  );

  const handleTyping = useCallback(
    (typingUser, isTyping) => {
      setTypingUsers((prev) => {
        const wasTyping = prev.includes(typingUser);
        if (isTyping && !wasTyping) {
          addLog("typing", `${typingUser} started typing`);
        } else if (!isTyping && wasTyping) {
          addLog("typing", `${typingUser} stopped typing`);
        }
        return isTyping
          ? wasTyping
            ? prev
            : [...prev, typingUser]
          : prev.filter((u) => u !== typingUser);
      });
    },
    [addLog],
  );

  const { socketRef, setCodeSnapshot } = useSocket({
    roomId,
    username,
    onClientsUpdate: handleClientsUpdate,
    onTyping: handleTyping,
  });

  const { isVoiceEnabled, toggleVoice, voiceUsers, speakingUsers } =
    useVoiceChat({
      socketRef,
      roomId,
      username,
    });

  // Store username on socket ref so Editor can access it for emitting
  if (socketRef.current) socketRef.current._username = username;

  const copyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      toast.success("Room ID copied.");
    } catch {
      toast.error("Could not copy room ID.");
    }
  };

  const leaveRoom = () => reactNavigator("/");

  if (!location.state) return <Navigate to="/" />;

  return (
    <div className="editor-page">
      <aside className="ep-sidebar">
        <div className="ep-sidebar-top">
          <div className="ep-logo">CB</div>
          <div className="ep-room-info">
            <span className="ep-room-label">ROOM</span>
            <span className="ep-room-id" title={roomId}>
              {roomId.slice(0, 8)}…
            </span>
          </div>
        </div>

        <div className="ep-sidebar-section">
          <span className="ep-section-label">CONNECTED · {clients.length}</span>
          <div className="ep-client-list">
            {clients.map((client) => (
              <Client
                key={client.socketId}
                username={client.username}
                isInVoice={isVoiceEnabled || voiceUsers.has(client.socketId)}
                isSpeaking={speakingUsers.has(client.socketId)}
                isMe={client.username === username}
              />
            ))}
          </div>
        </div>

        <div className="ep-sidebar-bottom">
          <button
            className={`ep-btn ep-voice-btn${isVoiceEnabled ? " active" : ""}`}
            onClick={toggleVoice}
          >
            {isVoiceEnabled ? "Leave Voice" : "Join Voice"}
          </button>
          <button
            className={`ep-btn ep-logs-btn${showLogs ? " active" : ""}`}
            onClick={() => setShowLogs((v) => !v)}
          >
            {showLogs ? "Hide Logs" : "Show Logs"}
          </button>
          <button className="ep-btn ep-copy-btn" onClick={copyRoomId}>
            Copy Room ID
          </button>
          <button className="ep-btn ep-leave-btn" onClick={leaveRoom}>
            Leave Room
          </button>
        </div>
      </aside>

      <div className="ep-editor-wrap">
        <Editor
          socketRef={socketRef}
          roomId={roomId}
          typingUsers={typingUsers}
          onCodeChange={(code) => {
            codeRef.current = code;
            setCodeSnapshot(code);
            // Throttled code-change log
            clearTimeout(logTimerRef.current);
            logTimerRef.current = setTimeout(() => {
              addLog("code", "Code updated");
            }, 3000);
          }}
        />
      </div>
      {showLogs && <Logs logs={logs} onClose={() => setShowLogs(false)} />}
    </div>
  );
}

export default EditorPage;
