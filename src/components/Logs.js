import React, { useEffect, useRef } from "react";
import "./Logs.css";

/**
 * Logs panel — displays real-time activity feed for the room.
 */
const Logs = ({ logs, onClose }) => {
  const scrollRef = useRef(null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const formatTime = (timestamp) => {
    const d = new Date(timestamp);
    return d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getLogIcon = (type) => {
    switch (type) {
      case "join":
        return "●";
      case "leave":
        return "○";
      case "code":
        return "✎";
      case "typing":
        return "⌨";
      case "cursor":
        return "↗";
      case "system":
        return "◈";
      default:
        return "•";
    }
  };

  const getLogClass = (type) => {
    switch (type) {
      case "join":
        return "log-join";
      case "leave":
        return "log-leave";
      case "code":
        return "log-code";
      case "typing":
        return "log-typing";
      case "cursor":
        return "log-cursor";
      case "system":
        return "log-system";
      default:
        return "";
    }
  };

  return (
    <div className="logs-panel">
      <div className="logs-header">
        <span className="logs-title">⟐ Room Activity</span>
        <button className="logs-close-btn" onClick={onClose} title="Close logs">
          ✕
        </button>
      </div>
      <div className="logs-list" ref={scrollRef}>
        {logs.length === 0 ? (
          <div className="logs-empty">No activity yet…</div>
        ) : (
          logs.map((log, idx) => (
            <div key={idx} className={`log-entry ${getLogClass(log.type)}`}>
              <span className="log-time">{formatTime(log.timestamp)}</span>
              <span className="log-icon">{getLogIcon(log.type)}</span>
              <span className="log-message">{log.message}</span>
            </div>
          ))
        )}
      </div>
      <div className="logs-footer">
        <span>
          {logs.length} event{logs.length !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
};

export default Logs;
