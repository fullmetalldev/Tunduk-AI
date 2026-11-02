// Chat history management with localStorage
const STORAGE_KEY = "chatHistory";
// Last 10 user/assistant turns. Must stay even so a turn is never cut in half.
const MAX_MESSAGES = 20;

// Subscribers (e.g. the chat panel) are told whenever history changes, and
// get the same array back until it does - as useSyncExternalStore expects.
const listeners = new Set();
let snapshot = null;

const emitChange = () => {
  snapshot = null;
  listeners.forEach((listener) => listener());
};

/**
 * Subscribe to history changes (also fires for changes from other tabs)
 * @param {() => void} listener
 * @returns {() => void} Unsubscribe
 */
export const subscribeChatHistory = (listener) => {
  const onStorage = (event) => {
    if (event.key === STORAGE_KEY) emitChange();
  };
  listeners.add(listener);
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
};

/**
 * Cached chat history for rendering
 * @returns {Array}
 */
export const getChatHistorySnapshot = () => {
  snapshot ??= getChatHistory();
  return snapshot;
};

/**
 * Get chat history from localStorage
 * @returns {Array} Array of messages with {role, content} structure
 */
export const getChatHistory = () => {
  try {
    const history = localStorage.getItem(STORAGE_KEY);
    const parsed = history ? JSON.parse(history) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Error reading chat history:", error);
    return [];
  }
};

/**
 * Keep only the last MAX_MESSAGES and make sure history starts with a user
 * message, otherwise the model sees an answer without its question.
 */
const trimHistory = (history) => {
  const recent = history.slice(-MAX_MESSAGES);
  const firstUser = recent.findIndex((msg) => msg.role === "user");
  return firstUser === -1 ? [] : recent.slice(firstUser);
};

/**
 * Save one full turn (user question + assistant answer) to chat history.
 * Both are written together so a failed request never leaves half a turn.
 * @param {string} userText - What the user said
 * @param {string} botText - What the bot answered
 */
export const saveChatTurn = (userText, botText) => {
  try {
    const timestamp = new Date().toISOString();
    const history = getChatHistory();
    history.push(
      { role: "user", content: userText, timestamp },
      { role: "assistant", content: botText, timestamp },
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimHistory(history)));
    console.log("Chat turn saved:", userText, botText);
    emitChange();
  } catch (error) {
    console.error("Error saving chat history:", error);
  }
};

/**
 * Clear all chat history
 */
export const clearChatHistory = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log("Chat history cleared");
    emitChange();
  } catch (error) {
    console.error("Error clearing chat history:", error);
  }
};

/**
 * Format chat history for OpenAI context
 * @returns {Array} Messages array for OpenAI API
 */
export const formatHistoryForOpenAI = () => {
  return trimHistory(getChatHistory())
    .filter((msg) => msg.content && (msg.role === "user" || msg.role === "assistant"))
    .map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));
};
