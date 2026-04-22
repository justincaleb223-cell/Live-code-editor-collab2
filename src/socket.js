import { io } from "socket.io-client";

export const initSocket = async () => {
  const options = {
    "force new connection": true,
    reconnectionAttempts: Infinity,
    timeout: 10000,
    transports: ["polling", "websocket"], // try polling first (more reliable on LAN/mobile)
  };
  // Use env variable, or infer backend port 5000 when running CRA dev server (port 3000)
  const backendUrl =
    process.env.REACT_APP_BACKEND_URL ||
    (window.location.port === "3000"
      ? `${window.location.protocol}//${window.location.hostname}:5000`
      : window.location.origin);
  console.log("[Socket] Connecting to:", backendUrl);
  const socket = io(backendUrl, options);
  socket.on("connect_error", (err) => {
    console.error("[Socket] connect_error:", err.message);
  });
  return socket;
};
