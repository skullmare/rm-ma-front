import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from '../css/modules/ChatPage.module.css';
import Spinner from '../components/Spinner';
import { usePageLoader } from '../hooks/usePageLoader';
import apiClient from '../lib/apiClient';
import { useAuth } from '../context/AuthContext.jsx';

const IMAGES = {
  backArrow: '/img/Rectangle 42215.svg',
  settingIcon: '/img/setting_icon.svg',
  sendButton: '/img/send-button.png',
};

const TYPING_INDICATOR = (
  <div className={`${styles.message} ${styles.incoming}`}>
    <div className={styles.typingIndicator}>
      <span className={styles.dots}>
        <span></span><span></span><span></span>
      </span>
      печатает
    </div>
  </div>
);

const EMPTY_GREETING = (
  <div className={`${styles.message} ${styles.incoming}`}>
    Добрый день! Готов помочь вам. С чем хотите поработать сегодня?
    <div className={styles.messageTime}>
      {new Date().toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
      })}
    </div>
  </div>
);

function ChatPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const agentInfo = location.state || { agent: 'sergey', agentName: 'СЕРГЕЙ' };
  const { agent, agentName } = agentInfo;

  const chatId = user?.telegramId || user?.id;
  const isPageLoading = usePageLoader(500);

  const chatContainerRef = useRef(null);
  const textareaRef = useRef(null);
  const isAtBottom = useRef(true);
  const lastScrollHeight = useRef(0);

  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Форматирование времени с fallback
  const formatTime = useCallback((dateInput) => {
    let date;
    try {
      date =
        typeof dateInput === 'string'
          ? new Date(dateInput)
          : typeof dateInput === 'number'
          ? new Date(dateInput)
          : dateInput || new Date();
      if (isNaN(date.getTime())) date = new Date(); // fallback
    } catch {
      date = new Date();
    }
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  // Трансформация сообщения
  const transformMessage = useCallback(
    (msg) => ({
      id: msg._id || msg.id || `msg-${Date.now()}-${Math.random()}`,
      text: msg.message || '',
      type: msg.autor === 'human' ? 'outgoing' : 'incoming',
      time: formatTime(msg.create_at || msg.timestamp),
      timestamp: (() => {
        try {
          return msg.timestamp
            ? Number(msg.timestamp)
            : new Date(msg.create_at || Date.now()).getTime();
        } catch {
          return Date.now();
        }
      })(),
    }),
    [formatTime]
  );

  // Прокрутка к низу (исправлено: вычитаем clientHeight)
  const scrollToBottom = useCallback((behavior = 'smooth') => {
    const container = chatContainerRef.current;
    if (!container) return;
    const { scrollHeight, clientHeight } = container;
    container.scrollTo({
      top: scrollHeight - clientHeight,
      behavior,
    });
    isAtBottom.current = true;
  }, []);

  // Загрузка истории
  const loadHistory = useCallback(
    async (beforeTimestamp = null) => {
      if (!chatId) {
        setIsHistoryLoading(false);
        return;
      }

      try {
        const params = { chat_id: chatId };
        if (beforeTimestamp) params.timestamp = String(beforeTimestamp);

        const { data } = await apiClient.get('/api/chats/history', { params });

        if (Array.isArray(data?.messages)) {
          const newMessages = data.messages.map(transformMessage);

          setMessages((prev) => {
            let combined;
            if (beforeTimestamp) {
              combined = [...newMessages, ...prev];
            } else {
              combined = newMessages;
            }

            // Удаление дублей + сортировка
            const unique = Array.from(
              new Map(combined.map((m) => [m.id, m])).values()
            ).sort((a, b) => a.timestamp - b.timestamp);

            return unique;
          });

          setHasMore(!!data.hasMore);
        }
      } catch (err) {
        console.error('Ошибка загрузки истории:', err);
      } finally {
        setIsHistoryLoading(false);
        setIsLoadingMore(false);
      }
    },
    [chatId, transformMessage]
  );

  // Первичная загрузка
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

  // Автопрокрутка при обновлении сообщений
  useEffect(() => {
    if (isHistoryLoading) return;

    const container = chatContainerRef.current;
    if (!container) return;

    if (isAtBottom.current || isLoading) {
      scrollToBottom(isLoading ? 'smooth' : 'auto');
    } else if (messages.length > 0) {
      // Сохраняем позицию при подгрузке сверху
      const heightDiff = container.scrollHeight - lastScrollHeight.current;
      if (heightDiff > 0) {
        container.scrollTop += heightDiff;
      }
    }

    lastScrollHeight.current = container.scrollHeight;
  }, [messages, isLoading, isHistoryLoading, scrollToBottom]);

  // Обработка скролла для подгрузки
  const handleScroll = useCallback(() => {
    const container = chatContainerRef.current;
    if (!container || isLoadingMore || !hasMore || messages.length === 0) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    isAtBottom.current = scrollHeight - scrollTop - clientHeight < 100;

    if (scrollTop < 200) {
      const oldestTimestamp = messages[0].timestamp;
      lastScrollHeight.current = scrollHeight;
      setIsLoadingMore(true);
      loadHistory(oldestTimestamp);
    }
  }, [messages, isLoadingMore, hasMore, loadHistory]);

  useEffect(() => {
    const container = chatContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  // Авторесайз textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const resize = () => {
      textarea.style.height = 'auto';
      const maxHeight = 140;
      const newHeight = Math.min(textarea.scrollHeight, maxHeight);
      textarea.style.height = `${newHeight}px`;
      textarea.style.overflowY = newHeight >= maxHeight ? 'auto' : 'hidden';
    };

    textarea.addEventListener('input', resize);
    resize(); // initial

    return () => textarea.removeEventListener('input', resize);
  }, []);

  // Отправка (исправлено: concat без ошибок, filter на undefined)
  const sendMessage = async () => {
    const text = inputValue.trim();
    if (!text || isLoading || !chatId) return;

    const tempId = `temp-${Date.now()}`;
    const optimisticMessage = {
      id: tempId,
      text,
      type: 'outgoing',
      time: formatTime(new Date()),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setInputValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    setIsLoading(true);
    isAtBottom.current = true;

    try {
      const { data } = await apiClient.post('/api/chats/send', {
        message: text,
        agent,
      });

      setMessages((prev) => {
        const updated = prev.map((m) =>
          m.id === tempId && data?.userMessageId ? { ...m, id: data.userMessageId } : m
        );

        let result = updated;
        if (data?.message && data.autor === 'ai_agent') {
          const aiMsg = transformMessage(data);
          if (!updated.some((m) => m.id === aiMsg.id)) {
            result = [...updated, aiMsg];
          }
        }

        return result.filter(Boolean); // на всякий
      });
    } catch (err) {
      console.error('Ошибка отправки:', err);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (isPageLoading || (isHistoryLoading && messages.length === 0)) {
    return <Spinner />;
  }

  return (
    <div className={`${styles.body} ${styles.chatPage}`}>
      <nav className={styles.navbar}>
        <div className="container-fluid d-flex justify-content-between px-0 align-items-center">
          <a
            className={styles.prev}
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigate('/agents_list');
            }}
          >
            <img src={IMAGES.backArrow} alt="назад" />
          </a>
          <div style={{ fontWeight: 500, color: '#BEBEBE', fontSize: '16px' }}>
            {agentName}
          </div>
          <a
            className={styles.navbarAccount}
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigate('/profile');
            }}
          >
            <div className={styles.accountIcon}>
              <img src={IMAGES.settingIcon} alt="настройки" />
            </div>
          </a>
        </div>
      </nav>

      <div className={styles.glow} />

      <main ref={chatContainerRef} id="chat" className={styles.chatContainer}>
        {isLoadingMore && (
          <div className={styles.loadingMore}>Загрузка предыдущих сообщений...</div>
        )}

        {messages.length === 0 && !isHistoryLoading && EMPTY_GREETING}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`${styles.message} ${msg.type === 'incoming' ? styles.incoming : styles.outgoing}`}
          >
            {msg.text}
            <div className={styles.messageTime}>{msg.time}</div>
          </div>
        ))}

        {isLoading && TYPING_INDICATOR}
      </main>

      <div className={styles.glowBottom} />

      <div className={styles.formBlock}>
        <div className={styles.blockQuestionField}>
          <textarea
            ref={textareaRef}
            className={styles.questionField}
            placeholder="Задайте свой вопрос..."
            rows={1}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />
        </div>
        <div
          className={styles.blockButtonSend}
          onClick={sendMessage}
          style={{ opacity: isLoading ? 0.5 : 1, cursor: isLoading ? 'not-allowed' : 'pointer' }}
        >
          <img src={IMAGES.sendButton} alt="Отправить" />
        </div>
      </div>
    </div>
  );
}

export default ChatPage;