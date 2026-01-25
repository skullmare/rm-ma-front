import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '@chatscope/chat-ui-kit-styles/dist/default/styles.min.css';
import {
  MainContainer,
  ChatContainer,
  MessageList,
  Message,
  MessageInput,
  TypingIndicator,
  Avatar,
} from '@chatscope/chat-ui-kit-react';
import styles from '../css/modules/ChatPage.module.css';
import Spinner from '../components/Spinner';
import PageNavbar from '../components/PageNavbar';
import { usePageLoader } from '../hooks/usePageLoader';
import apiClient from '../lib/apiClient';
import { useAuth } from '../context/AuthContext.jsx';
import MarkdownMessage from '../components/MarkdownMessage';
import { IMAGES } from '../constants/images';
import { ROUTES } from '../constants/routes';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

const WELCOME_MESSAGES = {
  sergy: {
    greeting: 'Привет! 👋\nЯ Сергей, аналитик внешнего контекста.\nС чего начнём?',
    quickReplies: [
      'Проанализировать рынок',
      'Оценить конкурентов',
      'Показать тенденции',
      'Рассказать про тренды ближайших лет',
    ],
  },
  nick: {
    greeting: 'Привет! 👋\nЯ Ник, технологический подрывник.\nГотов искать нестандартные решения для твоего бизнеса!',
    quickReplies: [
      'Найти подрывные идеи',
      'Проанализировать отрасль',
      'Показать неожиданные инсайты',
      'Выстроить вторую траекторию развития',
    ],
  },
  lida: {
    greeting: 'Привет! 👋\nЯ Лида, тестировщик гипотез.\nПомогу проверить твои идеи на практике!',
    quickReplies: [
      'Сформулировать гипотезу',
      'Приоритизировать гипотезы',
      'Определить метрики успеха',
      'Предложить формат эксперимента',
    ],
  },
  mark: {
    greeting: 'Привет! 👋\nЯ Марк, архитектор бизнес-моделей.\nПомогу построить устойчивую модель бизнеса!',
    quickReplies: [
      'Разработать бизнес-модель',
      'Определить сценарии монетизации',
      'Создать архитектуру экосистемы',
      'Проанализировать ценностное предложение',
    ],
  },
};

function ChatPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const agentInfo = location.state || { agent: 'sergey', agentName: 'СЕРГЕЙ' };
  const { agent, agentName } = agentInfo;
  const chatId = user?.telegramId || user?.id;
  const isPageLoading = usePageLoader(500);
  const messageListRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [tariffLabel, setTariffLabel] = useState('Базовый');

  const formatTime = (input) => {
    const date = new Date(
      typeof input === 'number' ? input : input || Date.now()
    );
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  const transformMessage = useCallback((msg) => ({
    id: msg._id || msg.id || `temp-${Date.now()}`,
    text: msg.message || '',
    type: msg.autor === 'human' ? 'outgoing' : 'incoming',
    direction: msg.autor === 'human' ? 'outgoing' : 'incoming',
    time: formatTime(msg.create_at || msg.timestamp),
    timestamp: msg.timestamp ? Number(msg.timestamp) : new Date(msg.create_at || Date.now()).getTime(),
    flag: msg.flag || null,
  }), []);

  const loadHistory = useCallback(async (beforeTimestamp = null) => {
    if (!chatId) return;

    try {
      if (beforeTimestamp) setIsLoadingMore(true);
      else setIsHistoryLoading(true);

      const params = { agent };
      if (beforeTimestamp) params.timestamp = String(beforeTimestamp);

      const { data } = await apiClient.get('/api/chats/history', {
        params,
      });

      if (Array.isArray(data?.messages)) {
        const newMsgs = data.messages.map(transformMessage);

        setMessages(prev => {
          const combined = beforeTimestamp ? [...newMsgs, ...prev] : newMsgs;
          const unique = Array.from(new Map(combined.map(m => [m.id, m])).values())
            .sort((a, b) => a.timestamp - b.timestamp);
          return unique;
        });

        setHasMore(!!data.hasMore);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Ошибка загрузки истории:', err);
      setHasMore(false);
    } finally {
      if (beforeTimestamp) setIsLoadingMore(false);
      else setIsHistoryLoading(false);
    }
  }, [chatId, agent, transformMessage]);

  // Load history on mount
  useEffect(() => {
    if (!chatId) {
      setIsHistoryLoading(false);
      return;
    }
    setIsHistoryLoading(true);
    setMessages([]);
    setHasMore(true);
    loadHistory();
  }, [chatId, agent, loadHistory]);

  // Load tariff
  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      try {
        const { data } = await apiClient.get('/api/profile');

        if (data?.profile) {
          const profile = data.profile;

          const resolveLastPaymentTimestamp = () => {
            const ts = profile.last_payment_timestamp ?? profile.lastPaymentTimestamp;
            if (ts !== undefined && ts !== null) {
              const tsNumber = Number(ts);
              if (!Number.isNaN(tsNumber)) {
                return tsNumber;
              }
            }

            const iso = profile.last_payment_datetime ?? profile.lastPaymentDatetime;
            if (iso) {
              const parsed = Date.parse(iso);
              if (!Number.isNaN(parsed)) {
                return parsed;
              }
            }

            return null;
          };

          const lastPaymentTimestamp = resolveLastPaymentTimestamp();
          const hasActiveSubscription =
            typeof lastPaymentTimestamp === 'number' &&
            Date.now() - lastPaymentTimestamp < THIRTY_DAYS_MS;

          setTariffLabel(hasActiveSubscription ? 'Премиум' : 'Базовый');
        }
      } catch (err) {
        console.error('Не удалось загрузить профиль:', err);
      }
    };

    fetchProfile();
  }, [user]);

  // Handle scroll to top for loading more messages
  const handleYReachStart = useCallback(() => {
    if (hasMore && !isLoadingMore && !isHistoryLoading && messages.length > 0) {
      const oldest = messages[0]?.timestamp;
      if (oldest) {
        loadHistory(oldest);
      }
    }
  }, [hasMore, isLoadingMore, isHistoryLoading, messages, loadHistory]);

  const sendMessage = async (text) => {
    const trimmedText = text.trim();
    if (!trimmedText || isLoading || !chatId) return;

    const tempId = `temp-${Date.now()}`;
    const newMsg = {
      id: tempId,
      text: trimmedText,
      type: 'outgoing',
      direction: 'outgoing',
      time: formatTime(),
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, newMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const { data } = await apiClient.post('/api/chats/send', { message: trimmedText, agent });

      setMessages(prev => {
        let list = prev.map(m =>
          m.id === tempId && data?.userMessageId ? { ...m, id: data.userMessageId } : m
        );

        if (data?.message && data.autor === 'ai_agent') {
          const aiMsg = transformMessage(data);
          if (!list.some(m => m.id === aiMsg.id)) list.push(aiMsg);
        }
        return list;
      });
    } catch (err) {
      console.error('Ошибка отправки сообщения:', err);
      setMessages(prev => prev.filter(m => m.id !== tempId));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToTariff = () => {
    navigate(ROUTES.TARIFF || '/tariff');
  };

  const handleQuickReply = async (text) => {
    await sendMessage(text);
  };

  // Get welcome message config for current agent
  const welcomeConfig = WELCOME_MESSAGES[agent] || WELCOME_MESSAGES.sergy;

  if (isPageLoading || (isHistoryLoading && messages.length === 0)) {
    return <Spinner />;
  }

  return (
    <div className={`${styles.body} ${styles.chatPage}`} style={{ position: 'relative' }}>
      <PageNavbar
        leftIcon="back"
        centerText={agentName}
        centerSubtext={tariffLabel}
        onLeftClick={() => navigate(ROUTES.AGENTS_LIST)}
        onRightClick={() => navigate(ROUTES.PROFILE)}
      />

      <div className={styles.glow} />

      <MainContainer className={styles.mainContainer}>
        <ChatContainer className={styles.chatContainer}>
          <MessageList
            ref={messageListRef}
            className={styles.messageList}
            typingIndicator={isLoading ? <TypingIndicator content="печатает..." /> : null}
            onYReachStart={handleYReachStart}
            loadingMore={isLoadingMore}
            loadingMorePosition="top"
          >
            {/* Loading more indicator */}
            {isLoadingMore && (
              <Message
                model={{
                  message: "Загрузка...",
                  direction: "incoming",
                  position: "single"
                }}
                className={styles.loadingMessage}
              />
            )}

            {/* Welcome message when history is empty */}
            {messages.length === 0 && !isHistoryLoading && (
              <>
                <Message
                  model={{
                    direction: "incoming",
                    position: "single"
                  }}
                  className={styles.welcomeMessage}
                >
                  <Message.CustomContent>
                    <div className={styles.markdownContent}>
                      {welcomeConfig.greeting.split('\n').map((line, i) => (
                        <p key={i} className={styles.markdownP}>{line}</p>
                      ))}
                    </div>
                  </Message.CustomContent>
                </Message>
                <div className={styles.quickReplies}>
                  {welcomeConfig.quickReplies.map((reply, index) => (
                    <button
                      key={index}
                      className={styles.quickReplyButton}
                      onClick={() => handleQuickReply(reply)}
                      disabled={isLoading}
                    >
                      {reply}
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Render all messages */}
            {messages.map(msg => (
              <React.Fragment key={msg.id}>
                <Message
                  model={{
                    direction: msg.direction,
                    position: "single"
                  }}
                  className={`${styles.chatMessage} ${msg.direction === 'incoming' ? styles.incoming : styles.outgoing}`}
                >
                  <Message.CustomContent>
                    {msg.direction === 'incoming' ? (
                      <MarkdownMessage content={msg.text} />
                    ) : (
                      <div>{msg.text}</div>
                    )}
                  </Message.CustomContent>
                </Message>
                {msg.flag === 'payment' && (
                  <div className={styles.paymentButtonContainer}>
                    <button
                      className={styles.paymentButton}
                      onClick={handleGoToTariff}
                    >
                      ПЕРЕЙТИ
                    </button>
                  </div>
                )}
              </React.Fragment>
            ))}
          </MessageList>

          <MessageInput
            className={styles.messageInput}
            placeholder="Задайте вопрос..."
            value={inputValue}
            onChange={val => setInputValue(val)}
            onSend={sendMessage}
            disabled={isLoading}
            attachButton={false}
            sendButton={true}
            sendOnReturnDisabled={false}
          />
        </ChatContainer>
      </MainContainer>

      <div className={styles.glowBottom} />
    </div>
  );
}

export default ChatPage;
