import { useEffect, useRef, useSyncExternalStore } from "react";
import { Trash2 } from "lucide-react";
import {
  clearChatHistory,
  getChatHistorySnapshot,
  subscribeChatHistory,
} from "../../lib/chatHistory";
import { useI18n } from "../../i18n/useI18n";
import "./ChatMessages.scss";

const Message = ({ role, text, time, live }) => {
  const { t } = useI18n();
  const isUser = role === "user";

  return (
    <div
      className={`ChatMessages__message ChatMessages__message--${isUser ? "user" : "bot"}${live ? " ChatMessages__message--live" : ""}`}
    >
      <div className="ChatMessages__message-content">
        <div className="ChatMessages__message-role">
          {isUser ? t("chat.you") : "Jarvisbek"}
        </div>
        {text ? (
          <p className="ChatMessages__message-text">{text}</p>
        ) : (
          <div className="ChatMessages__typing">
            <span></span>
            <span></span>
            <span></span>
          </div>
        )}
        {time && (
          <span className="ChatMessages__message-time">
            {new Date(time).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        )}
      </div>
    </div>
  );
};

/**
 * Captions of the conversation: saved history, the turn in progress, and
 * what the user is saying right now.
 * @param {object} props
 * @param {{ user: string, bot: string } | null} props.reply - Turn in progress
 * @param {string} props.partial - What the user is saying right now
 */
export const ChatMessages = ({ reply, partial }) => {
  const { t } = useI18n();
  const messages = useSyncExternalStore(
    subscribeChatHistory,
    getChatHistorySnapshot,
  );
  const listRef = useRef(null);

  // Keep the newest caption in view
  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages, reply, partial]);

  const isEmpty = messages.length === 0 && !reply && !partial;

  return (
    <div className="ChatMessages">
      <div className="ChatMessages__header">
        <span>{t("chat.title")}</span>
        <button
          type="button"
          className="ChatMessages__clear"
          onClick={clearChatHistory}
          disabled={messages.length === 0}
          title={t("chat.clear")}
          aria-label={t("chat.clear")}
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="ChatMessages__container" ref={listRef}>
        {isEmpty ? (
          <div className="ChatMessages__empty">
            <p>{t("chat.empty")}</p>
          </div>
        ) : (
          <div className="ChatMessages__list">
            {messages.map((msg, index) => (
              <Message
                key={`${msg.timestamp}-${index}`}
                role={msg.role}
                text={msg.content}
                time={msg.timestamp}
              />
            ))}
            {reply && (
              <>
                <Message role="user" text={reply.user} />
                <Message role="assistant" text={reply.bot} live />
              </>
            )}
            {!reply && partial && <Message role="user" text={partial} live />}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessages;
