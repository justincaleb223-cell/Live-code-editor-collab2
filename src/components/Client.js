import React from "react";
import Avatar from "react-avatar";
import "./Client.css";

/**
 * Renders a connected user avatar with username and online indicator.
 */
export default function Client({ username, isInVoice, isSpeaking, isMe }) {
  return (
    <div className="client">
      <div className={`client-avatar-wrap${isSpeaking ? " speaking" : ""}`}>
        <Avatar name={username} size={36} round="8px" />
        <span className="client-online-dot" />
        {isInVoice && (
          <span
            className="client-voice-indicator"
            title={isMe ? "You (voice on)" : "In voice"}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.21 14.47 16 12 16s-4.52-1.79-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3.07 2.99 5.44 6.07 5.92V21c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.08-.48 5.58-2.85 6.07-5.92.1-.6-.39-1.14-1-1.14z" />
            </svg>
          </span>
        )}
      </div>
      <span className="client-username">
        {username}
        {isMe ? " (You)" : ""}
      </span>
    </div>
  );
}
