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
  back: '/img/Rectangle 42215.svg',
  settings: '/img/setting_icon.svg',
  send: '/img/send-button.png',
};

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

  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Отслеживаем направление скролла
  const lastScrollTop = useRef(0);
  const isScrollingUp = useRef(false);

  // Нужно ли прокрутить вниз при следующем обновлении
  const shouldScrollOnNextUpdate = useRef(false);

  // Форматирование времени
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
    time: formatTime(msg.create_at || msg.timestamp),
    timestamp: msg.timestamp ? Number(msg.timestamp) : new Date(msg.create_at || Date.now()).getTime(),
  }), []);

  const scrollToBottom = () => {
    const container = chatContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight - container.clientHeight;
    }
  };

  // === Загрузка истории ===
  const loadHistory = useCallback(async (beforeTimestamp = null) => {
    if (!chatId || isLoadingMore) return;

    setIsLoadingMore(true);

    try {
      const params = { chat_id: chatId };
      if (beforeTimestamp) params.timestamp = String(beforeTimestamp);

      const { data } = await apiClient.get('/api/chats/history', { params });

      if (Array.isArray(data?.messages) && data.messages.length > 0) {
        const newMsgs = data.messages.map(transformMessage);

        setMessages(prev => {
          const combined = beforeTimestamp ? [...newMsgs, ...prev] : newMsgs;
          const map = new Map();
          combined.forEach(m => map.set(m.id, m));
          return Array.from(map.values()).sort((a, b) => a.timestamp - b.timestamp);
        });

        setHasMore(!!data.hasMore);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Ошибка загрузки истории:', err);
    } finally {
      setIsLoadingMore(false);
      setIsHistoryLoading(false);
    }
  }, [chatId, transformMessage, isLoadingMore]);

  // Первая загрузка — всегда скроллим вниз
  useEffect(() => {
    if (!chatId) {
      setIsHistoryLoading(false);
      return;
    }

    setIsHistoryLoading(true);
    setMessages([]);
    setHasMore(true);
    loadHistory();
    shouldScrollOnNextUpdate.current = true; // прокрутим вниз после загрузки
  }, [chatId, agent, loadHistory]);

  // Отслеживание скролла — определяем направление
  const handleScroll = useCallback(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const currentScrollTop = container.scrollTop;

    // Определяем, скроллит ли пользователь вверх
    if (currentScrollTop < lastScrollTop.current - 5) { // -5 — антидребезг
      isScrollingUp.current = true;
    } else if (currentScrollTop > lastScrollTop.current + 10) {
      isScrollingUp.current = false;
    }

    lastScrollTop.current = currentScrollTop;

    // Если пользователь скроллит вверх — и есть что грузить — грузим сразу!
    if (
      isScrollingUp.current &&
      !isLoadingMore &&
      hasMore &&
      messages.length > 0 &&
      container.scrollTop < container.scrollHeight * 0.7 // не у самого низа
    ) {
      const oldestTimestamp = messages[0]?.timestamp;
      if (oldestTimestamp) {
        loadHistory(oldestTimestamp);
      }
    }
  }, [messages, isLoadingMore, hasMore, loadHistory]);

  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    // Используем wheel + touchmove — самые частые события скролла
    const onWheel = (e) => {
      if (e.deltaY < 0) { // колесо вверх = скролл вверх по чату
        isScrollingUp.current = true;
        if (!isLoadingMore && hasMore && messages.length > 0) {
          const oldest = messages[0]?.timestamp;
          if (oldest) loadHistory(oldest);
        }
      }
    };

    const onTouchMove = () => {
      // На мобильных — любое движение пальцем вверх = пробуем подгрузить
      if (!isLoadingMore && hasMore && messages.length > 0) {
        const oldest = messages[0]?.timestamp;
        if (oldest) loadHistory(oldest);
      }
    };

    container.addEventListener('wheel', onWheel, { passive: true });
    container.addEventListener('touchmove', onTouchMove, { passive: true });
    container.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      container.removeEventListener('wheel', onWheel);
      container.removeEventListener('touchmove', onTouchMove);
      container.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll, messages, isLoadingMore, hasMore, loadHistory]);

  // Автоскролл только в двух случаях
  useEffect(() => {
    if (isHistoryLoading || !chatContainerRef.current) return;

    // 1. Первый вход — всегда в низ
    if (shouldScrollOnNextUpdate.current) {
      scrollToBottom();
      shouldScrollOnNextUpdate.current = false;
      return;
    }

    // 2. После отправки своего сообщения — в низ
    if (!isLoading && messages.length > 0) {
      const last = messages[messages.length - 1];
      if (last.type === 'outgoing') {
        scrollToBottom();
      }
    }
  }, [messages, isLoading, isHistoryLoading]);

  // Отправка
  const sendMessage = async () => {
    const text = inputValue.trim();
    if (!text || isLoading || !chatId) return;

    const tempId = `temp-${Date.now()}`;
    const newMsg = {
      id: tempId,
      text,
      type: 'outgoing',
      time: formatTime(),
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, newMsg]);
    setInputValue('');
    textareaRef.current && (textareaRef.current.style.height = 'auto');
    setIsLoading(true);

    try {
      const { data } = await apiClient.post('/api/chats/send', { message: text, agent });

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
      setMessages(prev => prev.filter(m => m.id !== tempId));
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

  // Авторесайз
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;

    const resize = () => {
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight, 140) + 'px';
    };

    ta.addEventListener('input', resize);
    resize();
    return () => ta.removeEventListener('input', resize);
  }, []);

  if (isPageLoading || (isHistoryLoading && messages.length === 0)) {
    return <Spinner />;
  }

  return (
    <div className={`${styles.body} ${styles.chatPage}`}>
      <nav className={styles.navbar}>/* ... навбар как раньше ... */</nav>

      <div className={styles.glow} />

      <main ref={chatContainerRef} className={styles.chatContainer}>
        {isLoadingMore && (
          <div className={styles.loadingMore}>Загрузка предыдущих...</div>
        )}

        {messages.length === 0 && !isHistoryLoading && (
          <div className={`${styles.message} ${styles.incoming}`}>
            Добрый день! Готов помочь вам. С чем хотите поработать сегодня?
            <div className={styles.messageTime}>{formatTime()}</div>
          </div>
        )}

        {messages.map(msg => (
          <div
            key={msg.id}
            className={`${styles.message} ${msg.type === 'incoming' ? styles.incoming : styles.outgoing}`}
          >
            {msg.text}
            <div className={styles.messageTime}>{msg.time}</div>
          </div>
        ))}

        {isLoading && (
          <div className={`${styles.message} ${styles.incoming}`}>
            <div className={styles.typingIndicator}>
              <span className={styles.dots}>
                <span></span><span></span><span></span>
              </span>
              печатает
            </div>
          </div>
        )}
      </main>

      <div className={styles.glowBottom} />

      <div className={styles.formBlock}>
        <div className={styles.blockQuestionField}>
          <textarea
            ref={textareaRef}
            className={styles.questionField}
            placeholder="Задайте свой вопрос..."
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            rows={1}
          />
        </div>
        <div
          className={styles.blockButtonSend}
          onClick={sendMessage}
          style={{ opacity: isLoading ? 0.5 : 1 }}
        >
          <img src={IMAGES.send} alt="Отправить" />
        </div>
      </div>
    </div>
  );
}

export default ChatPage;