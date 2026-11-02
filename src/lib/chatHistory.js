// Chat history management with localStorage.
// Every voice has its own conversation ("context"), stored under its own key.
const STORAGE_PREFIX = "chatHistory:";
// Before contexts existed all history lived under this single key
const LEGACY_STORAGE_KEY = "chatHistory";
// A full conversation: once reached, the user is asked to clear it and start
// again (new messages are not accepted until then).
export const MAX_MESSAGES = 50;

const storageKey = (contextId) => `${STORAGE_PREFIX}${contextId}`;

// Subscribers (e.g. the chat panel) are told whenever history changes, and
// get the same array back until it does - as useSyncExternalStore expects.
const listeners = new Set();
const snapshots = new Map();

const emitChange = (contextId) => {
  if (contextId) snapshots.delete(contextId);
  else snapshots.clear();
  listeners.forEach((listener) => listener());
};

/**
 * Move history saved before per-voice contexts existed into one context
 * @param {string} contextId
 */
export const migrateLegacyHistory = (contextId) => {
  try {
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy === null) return;
    if (localStorage.getItem(storageKey(contextId)) === null) {
      localStorage.setItem(storageKey(contextId), legacy);
    }
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch (error) {
    console.error("Error migrating chat history:", error);
  }
};

/**
 * Subscribe to history changes (also fires for changes from other tabs)
 * @param {() => void} listener
 * @returns {() => void} Unsubscribe
 */
export const subscribeChatHistory = (listener) => {
  const onStorage = (event) => {
    if (event.key?.startsWith(STORAGE_PREFIX)) {
      emitChange(event.key.slice(STORAGE_PREFIX.length));
    }
  };
  listeners.add(listener);
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
};

/**
 * Cached chat history of a context, for rendering
 * @param {string} contextId
 * @returns {Array}
 */
export const getChatHistorySnapshot = (contextId) => {
  if (!snapshots.has(contextId)) {
    snapshots.set(contextId, getChatHistory(contextId));
  }
  return snapshots.get(contextId);
};

/**
 * Get chat history from localStorage
 * @param {string} contextId
 * @returns {Array} Array of messages with {role, content} structure
 */
export const getChatHistory = (contextId) => {
  try {
    const history = localStorage.getItem(storageKey(contextId));
    const parsed = history ? JSON.parse(history) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Error reading chat history:", error);
    return [];
  }
};

/**
 * Whether the conversation reached MAX_MESSAGES and must be cleared
 * @param {string} contextId
 */
export const isChatHistoryFull = (contextId) =>
  getChatHistory(contextId).length >= MAX_MESSAGES;

/**
 * Keep at most MAX_MESSAGES and make sure history starts with a user
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
 * @param {string} contextId
 * @param {string} userText - What the user said
 * @param {string} botText - What the bot answered
 */
export const saveChatTurn = (contextId, userText, botText) => {
  try {
    const timestamp = new Date().toISOString();
    const history = getChatHistory(contextId);
    history.push(
      { role: "user", content: userText, timestamp },
      { role: "assistant", content: botText, timestamp },
    );
    localStorage.setItem(
      storageKey(contextId),
      JSON.stringify(trimHistory(history)),
    );
    console.log("Chat turn saved:", userText, botText);
    emitChange(contextId);
  } catch (error) {
    console.error("Error saving chat history:", error);
  }
};

/**
 * Clear the chat history of a context
 * @param {string} contextId
 */
export const clearChatHistory = (contextId) => {
  try {
    localStorage.removeItem(storageKey(contextId));
    console.log("Chat history cleared");
    emitChange(contextId);
  } catch (error) {
    console.error("Error clearing chat history:", error);
  }
};

/**
 * Format chat history for OpenAI context
 * @param {string} contextId
 * @returns {Array} Messages array for OpenAI API
 */
export const formatHistoryForOpenAI = (contextId) => {
  return trimHistory(getChatHistory(contextId))
    .filter((msg) => msg.content && (msg.role === "user" || msg.role === "assistant"))
    .map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));
};
