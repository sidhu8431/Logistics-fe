const LOGGING_ENDPOINT = "http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/log";

// Safe stringify to avoid circular structures
const safeStringify = (arg) => {
  try {
    return typeof arg === "string" ? arg : JSON.stringify(arg);
  } catch {
    return "[Unserializable object]";
  }
};

const sendLogToServer = async (level, message) => {
  try {
    await fetch(LOGGING_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ log: `[${level.toUpperCase()}] ${message}` }),
    });
  } catch (err) {
    // Fallback to local logging without crashing
    try {
      console.warn("Log send failed:", err.message);
    } catch (_) {}
  }
};

export const setupLogger = () => {
  ["log", "warn", "error", "info"].forEach((level) => {
    const original = console[level];
    console[level] = (...args) => {
      const message = args.map(safeStringify).join(" ");
      sendLogToServer(level, message);
      try {
        original.apply(console, args);
      } catch (_) {} // suppress errors from original logger
    };
  });

  if (global.ErrorUtils) {
    const defaultHandler = global.ErrorUtils.getGlobalHandler();
    global.ErrorUtils.setGlobalHandler((error, isFatal) => {
      const errorMsg = `${error?.message || "Unknown error"} \n${error?.stack || ""}`;
      sendLogToServer("fatal", errorMsg);
      if (defaultHandler) {
        defaultHandler(error, isFatal);
      }
    });
  }
};

