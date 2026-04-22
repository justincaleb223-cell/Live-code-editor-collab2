import { useEffect, useRef, useState, useCallback } from "react";
import Peer from "simple-peer";
import ACTIONS from "../actions";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export function useVoiceChat({ socketRef, roomId, username }) {
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [voiceUsers, setVoiceUsers] = useState(new Set());
  const [speakingUsers, setSpeakingUsers] = useState(new Set());

  const localStreamRef = useRef(null);
  const peersRef = useRef({}); // socketId -> Peer instance
  const audioRefs = useRef({}); // socketId -> <audio> element
  const audioContextRef = useRef(null);
  const analysersRef = useRef({}); // socketId -> { analyser, dataArray, source }
  const rafRef = useRef(null);
  const listenersAttached = useRef(false);

  // Cleanup helper
  const cleanupPeer = useCallback((socketId) => {
    const peer = peersRef.current[socketId];
    if (peer) {
      // Remove from ref FIRST so async callbacks bail out
      delete peersRef.current[socketId];
      try {
        peer.removeAllListeners();
        if (typeof peer.destroy === "function" && !peer.destroyed) {
          peer.destroy();
        }
      } catch (e) {
        /* noop */
      }
    }
    if (audioRefs.current[socketId]) {
      audioRefs.current[socketId].pause();
      audioRefs.current[socketId].srcObject = null;
      audioRefs.current[socketId].remove();
      delete audioRefs.current[socketId];
    }
    if (analysersRef.current[socketId]) {
      if (analysersRef.current[socketId].source) {
        try {
          analysersRef.current[socketId].source.disconnect();
        } catch (e) {
          /* noop */
        }
      }
      delete analysersRef.current[socketId];
    }
    setVoiceUsers((prev) => {
      const next = new Set(prev);
      next.delete(socketId);
      return next;
    });
    setSpeakingUsers((prev) => {
      const next = new Set(prev);
      next.delete(socketId);
      return next;
    });
  }, []);

  // Detect speaking using Web Audio API
  const startSpeakingDetection = useCallback((socketId, stream) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext ||
        window.webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    const source = ctx.createMediaStreamSource(stream);
    source.connect(analyser);
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analysersRef.current[socketId] = { analyser, dataArray, source };
  }, []);

  const detectSpeakingLoop = useCallback(() => {
    const newSpeaking = new Set();
    Object.entries(analysersRef.current).forEach(
      ([socketId, { analyser, dataArray }]) => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        const average = sum / dataArray.length;
        if (average > 15) {
          newSpeaking.add(socketId);
        }
      },
    );
    setSpeakingUsers(newSpeaking);
    rafRef.current = requestAnimationFrame(detectSpeakingLoop);
  }, []);

  const createPeer = useCallback(
    (toSocketId, callerStream, initiator) => {
      console.log(
        "[Voice] Creating peer ->",
        toSocketId,
        "initiator:",
        initiator,
      );
      const peer = new Peer({
        initiator,
        trickle: false,
        stream: callerStream,
        config: ICE_SERVERS,
      });

      peer.on("signal", (signal) => {
        console.log("[Voice] Sending signal to", toSocketId);
        socketRef.current.emit(ACTIONS.VOICE_SIGNAL, {
          toSocketId,
          signal,
          username,
        });
      });

      peer.on("stream", (remoteStream) => {
        console.log("[Voice] Received stream from", toSocketId);
        if (!audioRefs.current[toSocketId]) {
          const audio = document.createElement("audio");
          audio.srcObject = remoteStream;
          audio.autoplay = true;
          audio.volume = 1.0;
          audio.playsInline = true;
          document.body.appendChild(audio);
          audioRefs.current[toSocketId] = audio;

          // Ensure playback starts (some browsers need explicit play)
          audio.play().catch(() => {});
        }
        startSpeakingDetection(toSocketId, remoteStream);
      });

      peer.on("connect", () => {
        console.log("[Voice] Peer connected:", toSocketId);
      });

      peer.on("close", () => {
        console.log("[Voice] Peer closed:", toSocketId);
        cleanupPeer(toSocketId);
      });

      peer.on("error", (err) => {
        console.error("[Voice] Peer error:", toSocketId, err.message);
        cleanupPeer(toSocketId);
      });

      peersRef.current[toSocketId] = peer;
      setVoiceUsers((prev) => {
        const next = new Set(prev);
        next.add(toSocketId);
        return next;
      });
      return peer;
    },
    [socketRef, username, cleanupPeer, startSpeakingDetection],
  );

  const attachListeners = useCallback(() => {
    if (listenersAttached.current || !socketRef.current) return false;
    listenersAttached.current = true;
    console.log("[Voice] Attaching socket listeners");

    const handleVoiceUserJoined = ({ socketId, username: joinedUsername }) => {
      console.log("[Voice] User joined voice:", socketId, joinedUsername);
      if (socketId === socketRef.current.id) return;
      if (!localStreamRef.current) return;
      // Only the peer with smaller socketId initiates to avoid glare
      const shouldInitiate = socketRef.current.id < socketId;
      createPeer(socketId, localStreamRef.current, shouldInitiate);
    };

    const handleVoiceSignal = ({ fromSocketId, signal }) => {
      console.log("[Voice] Received signal from", fromSocketId);
      const existingPeer = peersRef.current[fromSocketId];
      if (existingPeer) {
        existingPeer.signal(signal);
      } else if (localStreamRef.current) {
        const peer = createPeer(fromSocketId, localStreamRef.current, false);
        peer.signal(signal);
      }
    };

    const handleVoiceUserLeft = ({ socketId }) => {
      console.log("[Voice] User left voice:", socketId);
      cleanupPeer(socketId);
    };

    socketRef.current.on(ACTIONS.VOICE_USER_JOINED, handleVoiceUserJoined);
    socketRef.current.on(ACTIONS.VOICE_SIGNAL, handleVoiceSignal);
    socketRef.current.on(ACTIONS.VOICE_USER_LEFT, handleVoiceUserLeft);

    return true;
  }, [socketRef, createPeer, cleanupPeer]);

  const enableVoice = useCallback(async () => {
    try {
      // Ensure listeners are attached before we start
      if (!listenersAttached.current) {
        attachListeners();
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      console.log("[Voice] Got local stream, emitting VOICE_JOIN");
      socketRef.current.emit(ACTIONS.VOICE_JOIN, { roomId, username });
      setIsVoiceEnabled(true);
      rafRef.current = requestAnimationFrame(detectSpeakingLoop);
    } catch (err) {
      console.error("Failed to get microphone:", err);
      alert("Microphone access is required for voice chat.");
    }
  }, [socketRef, roomId, username, detectSpeakingLoop, attachListeners]);

  const disableVoice = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    Object.keys(peersRef.current).forEach(cleanupPeer);
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    socketRef.current.emit(ACTIONS.VOICE_LEAVE, { roomId, username });
    setIsVoiceEnabled(false);
    setVoiceUsers(new Set());
    setSpeakingUsers(new Set());
  }, [socketRef, roomId, username, cleanupPeer]);

  const toggleVoice = useCallback(() => {
    if (isVoiceEnabled) disableVoice();
    else enableVoice();
  }, [isVoiceEnabled, enableVoice, disableVoice]);

  // Attempt to attach listeners on mount; retry if socket not ready yet
  useEffect(() => {
    if (attachListeners()) return;
    const interval = setInterval(() => {
      if (attachListeners()) clearInterval(interval);
    }, 300);
    return () => clearInterval(interval);
  }, [attachListeners]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      Object.keys(peersRef.current).forEach((key) => {
        if (peersRef.current[key]) peersRef.current[key].destroy();
      });
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      Object.values(audioRefs.current).forEach((audio) => {
        audio.pause();
        audio.srcObject = null;
        audio.remove();
      });
      if (
        audioContextRef.current &&
        audioContextRef.current.state !== "closed"
      ) {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  return { isVoiceEnabled, toggleVoice, voiceUsers, speakingUsers };
}
