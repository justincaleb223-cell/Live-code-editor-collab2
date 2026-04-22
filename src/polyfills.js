// Polyfill process for simple-peer in browser
if (typeof window !== "undefined" && !window.process) {
  window.process = { env: {}, nextTick: (fn) => setTimeout(fn, 0) };
}

// Suppress harmless readable-stream errors from simple-peer cleanup
(function suppressSimplePeerErrors() {
  if (typeof window === "undefined") return;

  const isStreamError = (msg) =>
    typeof msg === "string" &&
    (msg.includes("_readableState") ||
      msg.includes("readableListening") ||
      msg.includes("emitReadable_") ||
      msg.includes("updateReadableListening"));

  // Intercept window.onerror (React overlay watches this)
  const originalOnError = window.onerror;
  window.onerror = function (message, source, lineno, colno, error) {
    if (isStreamError(message)) {
      console.warn("[Voice] Suppressed stream error:", message);
      return true; // prevents the error from propagating
    }
    if (originalOnError) return originalOnError.apply(this, arguments);
    return false;
  };

  // Intercept console.error (React overlay also hooks this)
  const originalConsoleError = console.error;
  console.error = function (...args) {
    const msg = args[0] && (args[0].message || args[0]);
    if (isStreamError(msg)) {
      console.warn("[Voice] Suppressed stream error (console):", msg);
      return;
    }
    return originalConsoleError.apply(this, args);
  };

  // Also catch addEventListener errors
  window.addEventListener("error", (e) => {
    if (isStreamError(e.message)) {
      e.preventDefault();
      console.warn("[Voice] Suppressed stream error (event):", e.message);
    }
  });
})();
