// Chat history management with localStorage
const STORAGE_KEY = "chatHistory";
const MAX_MESSAGES = 5;

/**
 * Get chat history from localStorage
 * @returns {Array} Array of messages with {role, content} structure
 */
export const getChatHistory = () => {
  try {
    const history = localStorage.getItem(STORAGE_KEY);
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error("Error reading chat history:", error);
    return [];
  }
};

/**
 * Save message to chat history
 * @param {string} role - "user" or "assistant"
 * @param {string} content - Message content
 */
export const saveChatMessage = (role, content) => {
  try {
    const history = getChatHistory();
    
    // Add new message
    history.push({
      role,
      content,
      timestamp: new Date().toISOString(),
    });

    // Keep only last MAX_MESSAGES (5)
    const recentHistory = history.slice(-MAX_MESSAGES);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recentHistory));
    console.log("Chat message saved:", role, content);
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
  } catch (error) {
    console.error("Error clearing chat history:", error);
  }
};

/**
 * Format chat history for OpenAI context
 * @returns {Array} Messages array for OpenAI API
 */
export const formatHistoryForOpenAI = () => {
  const history = getChatHistory();
  return history.map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));
};
