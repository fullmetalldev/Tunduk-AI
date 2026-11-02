import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { Trash2 } from "lucide-react";
import {
  clearChatHistory,
  getChatHistorySnapshot,
  MAX_MESSAGES,
  subscribeChatHistory,
} from "../../lib/chatHistory";
import { useI18n } from "../../i18n/useI18n";
import "./ChatMessages.scss";

const Message = ({ role, text, time, live, botName }) => {
  const { t } = useI18n();
  const isUser = role === "user";

  return (
    <div
      className={`ChatMessages__message ChatMessages__message--${isUser ? "user" : "bot"}${live ? " ChatMessages__message--live" : ""}`}
    >
      <div className="ChatMessages__message-content">
        <div className="ChatMessages__message-role">
          {isUser ? t("chat.you") : botName}
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
 * @param {string} props.contextId - Which conversation to show (one per voice)
 * @param {string} [props.contextName] - Shown in the header
 * @param {{ user: string, bot: string } | null} props.reply - Turn in progress
 * @param {string} props.partial - What the user is saying right now
 */
export const ChatMessages = ({ contextId, contextName, reply, partial }) => {
  const { t } = useI18n();
  const getSnapshot = useCallback(
    () => getChatHistorySnapshot(contextId),
    [contextId],
  );
  const messages = useSyncExternalStore(subscribeChatHistory, getSnapshot);
  const isFull = messages.length >= MAX_MESSAGES;
  const botName = contextName ?? "Jarvisbek";
  const clear = () => clearChatHistory(contextId);
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
        <span>
          {t("chat.title")}
          {contextName && (
            <span className="ChatMessages__context"> · {contextName}</span>
          )}
        </span>
        <span
          className={`ChatMessages__count${isFull ? " ChatMessages__count--full" : ""}`}
        >
          {messages.length}/{MAX_MESSAGES}
        </span>
        <button
          type="button"
          className="ChatMessages__clear"
          onClick={clear}
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
                botName={botName}
              />
            ))}
            {reply && (
              <>
                <Message role="user" text={reply.user} />
                <Message role="assistant" text={reply.bot} live botName={botName} />
              </>
            )}
            {!reply && partial && <Message role="user" text={partial} live />}
            {isFull && (
              <div className="ChatMessages__full" role="alert">
                <p>{t("chat.full").replace("{max}", MAX_MESSAGES)}</p>
                <button type="button" onClick={clear}>
                  {t("chat.fullAction")}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessages;
