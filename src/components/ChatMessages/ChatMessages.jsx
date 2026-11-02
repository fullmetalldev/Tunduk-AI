import { useEffect, useRef, useState } from "react";
import { getChatHistory } from "../../lib/chatHistory";
import { useI18n } from "../../i18n/useI18n";
import "./ChatMessages.scss";

export const ChatMessages = ({ botState }) => {
  const { t } = useI18n();
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);

  // Load chat history from localStorage
  useEffect(() => {
    const loadMessages = () => {
      const history = getChatHistory();
      setMessages(history);
    };

    loadMessages();

    // Poll for new messages every 500ms
    const interval = setInterval(loadMessages, 500);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="ChatMessages">
      <div className="ChatMessages__container">
        {messages.length === 0 ? (
          <div className="ChatMessages__empty">
            <p>{t("chat.empty")}</p>
          </div>
        ) : (
          <div className="ChatMessages__list">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`ChatMessages__message ChatMessages__message--${msg.role}`}
              >
                <div className="ChatMessages__message-avatar">
                  {msg.role === "user" ? "👤" : "🤖"}
                </div>
                <div className="ChatMessages__message-content">
                  <div className="ChatMessages__message-role">
                    {msg.role === "user" ? t("chat.you") : "Jarvisbek"}
                  </div>
                  <p className="ChatMessages__message-text">{msg.content}</p>
                  {msg.timestamp && (
                    <span className="ChatMessages__message-time">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {botState === "thinking" && (
              <div className="ChatMessages__message ChatMessages__message--bot">
                <div className="ChatMessages__message-avatar">🤖</div>
                <div className="ChatMessages__message-content">
                  <div className="ChatMessages__message-role">Jarvisbek</div>
                  <div className="ChatMessages__typing">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessages;
