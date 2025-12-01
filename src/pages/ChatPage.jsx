import React, { useCallback, useEffect, useRef, useState } from 'react';
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

  const chatRef = useRef(null);
  const textareaRef = useRef(null);

  const [messages, setMessages] = useState([]); // sorted chronological: oldest -> newest
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [loadingTimestamp, setLoadingTimestamp] = useState(null);

  // вспомогательные refs
  const prevScrollHeightRef = useRef(0);
  const lastMessagesCountRef = useRef(0);
  const shouldInitialScrollRef = useRef(true);

  // формат времени
  const formatTime = (input) => {
    const date = new Date(typeof input === 'number' ? input : input || Date.now());
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  const transformMessage = useCallback((msg) => ({
    id: msg._id || msg.id || `temp-${Math.random().toString(36).slice(2)}-${Date.now()}`,
    text: msg.message || msg.text || '',
    type: msg.autor === 'human' || msg.type === 'outgoing' ? 'outgoing' : 'incoming',
    time: formatTime(msg.create_at || msg.timestamp),
    timestamp: msg.timestamp ? Number(msg.timestamp) : new Date(msg.create_at || Date.now()).getTime(),
  }), []);

  // --------- Прокрутка (мгновенная) ----------
  const scrollToBottomInstant = useCallback(() => {
    const container = chatRef.current;
    if (!container) return;
    // мгновенно ставим в низ
    container.scrollTop = container.scrollHeight - container.clientHeight;
  }, []);

  const isUserNearBottom = (threshold = 120) => {
    const c = chatRef.current;
    if (!c) return true;
    return (c.scrollHeight - (c.scrollTop + c.clientHeight)) <= threshold;
  };

  const saveScrollBeforePrepend = () => {
    const c = chatRef.current;
    if (!c) return;
    prevScrollHeightRef.current = c.scrollHeight;
  };

  const restoreScrollAfterPrepend = () => {
    const c = chatRef.current;
    if (!c) return;
    const diff = c.scrollHeight - prevScrollHeightRef.current;
    // сохраним визуальную позицию: добавляем разницу к scrollTop
    c.scrollTop = diff;
    prevScrollHeightRef.current = 0;
  };

  // --------- Загрузка истории ----------
  const loadHistory = useCallback(async (beforeTimestamp = null, isLoadMore = false) => {
    if (!chatId) return;
    try {
      if (isLoadMore) {
        saveScrollBeforePrepend();
        setIsLoadingMore(true);
      } else {
        setIsHistoryLoading(true);
      }

      const params = { chat_id: chatId };
      if (beforeTimestamp) params.timestamp = String(beforeTimestamp);

      const { data } = await apiClient.get('/api/chats/history', { params });

      if (!Array.isArray(data?.messages)) {
        setHasMore(false);
        return;
      }

      const newMsgs = data.messages.map(transformMessage)
        .sort((a, b) => a.timestamp - b.timestamp); // ensure chronological

      setMessages(prev => {
        if (isLoadMore) {
          // prepend older messages
          const merged = [...newMsgs, ...prev];
          // dedupe by id, keep last instance
          const map = new Map();
          merged.forEach(m => map.set(m.id, m));
          return Array.from(map.values()).sort((a, b) => a.timestamp - b.timestamp);
        } else {
          // replace on initial load
          const merged = [...newMsgs];
          const map = new Map();
          merged.forEach(m => map.set(m.id, m));
          return Array.from(map.values()).sort((a, b) => a.timestamp - b.timestamp);
        }
      });

      setHasMore(Boolean(data.hasMore));
      // Восстанавливаем либо скроллим вниз при первой загрузке
      if (isLoadMore) {
        // небольшая задержка, пока DOM обновится
        setTimeout(() => {
          restoreScrollAfterPrepend();
        }, 0);
      } else {
        // первая загрузка — прокрутить в низ (мгновенно)
        setTimeout(() => {
          scrollToBottomInstant();
          shouldInitialScrollRef.current = false;
        }, 0);
      }
    } catch (err) {
      console.error('Ошибка загрузки истории:', err);
      setHasMore(false);
    } finally {
      if (isLoadMore) {
        setIsLoadingMore(false);
        setLoadingTimestamp(null);
      } else {
        setIsHistoryLoading(false);
      }
    }
  }, [chatId, transformMessage, scrollToBottomInstant]);

  // первичная загрузка
  useEffect(() => {
    if (!chatId) {
      setIsHistoryLoading(false);
      return;
    }
    setMessages([]);
    setHasMore(true);
    setIsHistoryLoading(true);
    shouldInitialScrollRef.current = true;
    loadHistory();
  }, [chatId, agent, loadHistory]);

  // --------- Обработка скролла для подгрузки старых ---------
  const handleScroll = useCallback(() => {
    const c = chatRef.current;
    if (!c || isLoadingMore || !hasMore || messages.length === 0) return;

    const nearTop = c.scrollTop <= 80;
    if (nearTop) {
      const oldest = messages[0]?.timestamp;
      if (oldest && oldest !== loadingTimestamp) {
        setLoadingTimestamp(oldest);
        loadHistory(oldest, true);
      }
    }
  }, [messages, isLoadingMore, hasMore, loadHistory, loadingTimestamp]);

  useEffect(() => {
    const c = chatRef.current;
    if (!c) return;
    let timer = null;

    const onScroll = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        handleScroll();
      }, 100);
    };

    c.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      c.removeEventListener('scroll', onScroll);
      if (timer) clearTimeout(timer);
    };
  }, [handleScroll]);

  // --------- Автоскролл при поступлении новых сообщений ---------
  useEffect(() => {
    // Если это первая отрисовка после загрузки — прокручиваем в низ
    if (isHistoryLoading) return;

    const prevCount = lastMessagesCountRef.current;
    if (messages.length === 0) {
      lastMessagesCountRef.current = 0;
      return;
    }

    // если это первый набор сообщений после загрузки (initial), ensure bottom
    if (shouldInitialScrollRef.current) {
      scrollToBottomInstant();
      shouldInitialScrollRef.current = false;
      lastMessagesCountRef.current = messages.length;
      return;
    }

    // если добавилось сообщение
    if (messages.length > prevCount) {
      const newCount = messages.length - prevCount;
      const newMessages = messages.slice(-newCount);

      // если пользователь находится у низа — прокрутить вниз
      if (isUserNearBottom()) {
        // маленькая задержка для DOM
        setTimeout(() => {
          scrollToBottomInstant();
        }, 0);
      }
    }

    lastMessagesCountRef.current = messages.length;
  }, [messages, isHistoryLoading, scrollToBottomInstant]);

  // --------- autoresize textarea ----------
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

  // --------- Отправка сообщения ----------
  const sendMessage = async () => {
    const text = inputValue.trim();
    if (!text || isLoading || !chatId) return;

    setIsLoading(true);
    const tempId = `temp-${Math.random().toString(36).slice(2)}-${Date.now()}`;
    const optimistic = {
      id: tempId,
      text,
      type: 'outgoing',
      time: formatTime(),
      timestamp: Date.now(),
    };

    // добавляем временно
    setMessages(prev => [...prev, optimistic]);
    setInputValue('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    // если пользователь у низа — прокрутим вниз
    setTimeout(() => {
      if (isUserNearBottom()) scrollToBottomInstant();
    }, 0);

    try {
      const { data } = await apiClient.post('/api/chats/send', { message: text, agent });

      // Обновляем список: заменяем temp сообщение id если пришло userMessageId, и добавляем сообщение бота
      setMessages(prev => {
        let updated = prev.map(m => (m.id === tempId && data?.userMessageId ? { ...m, id: data.userMessageId } : m));

        // если пришло сообщение от бота
        if (data?.message && data.autor === 'ai_agent') {
          const aiMsg = transformMessage(data);
          if (!updated.some(m => m.id === aiMsg.id)) updated.push(aiMsg);
        }

        // удаляем возможные дубли и сортируем
        const map = new Map();
        updated.forEach(m => map.set(m.id, m));
        return Array.from(map.values()).sort((a, b) => a.timestamp - b.timestamp);
      });

      // прокручиваем к низу (если пользователь у низа)
      setTimeout(() => {
        if (isUserNearBottom()) scrollToBottomInstant();
      }, 50);
    } catch (err) {
      console.error('Ошибка отправки сообщения:', err);
      // удалить временное сообщение
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

  if (isPageLoading || (isHistoryLoading && messages.length === 0)) {
    return <Spinner />;
  }

  return (
    <div className={`${styles.body} ${styles.chatPage}`}>
      <nav className={styles.navbar}>
        <div className="container-fluid d-flex justify-content-between align-items-center px-0">
          <a href="#" onClick={(e) => { e.preventDefault(); navigate('/agents_list'); }} className={styles.prev}>
            <img src={IMAGES.back} alt="назад" />
          </a>
          <div style={{ fontWeight: 500, color: '#BEBEBE', fontSize: '16px' }}>{agentName}</div>
          <a href="#" onClick={(e) => { e.preventDefault(); navigate('/profile'); }} className={styles.navbarAccount}>
            <div className={styles.accountIcon}>
              <img src={IMAGES.settings} alt="настройки" />
            </div>
          </a>
        </div>
      </nav>

      <div className={styles.glow} />

      {/* main — использует существующую верстку/классы из CSS.
          Осторожно: scroll-behavior в CSS может влиять на прокрутку.
          Мы используем мгновенный scrollTop assignment. */}
      <main
        ref={chatRef}
        className={styles.chatContainer}
        // aria-атрибуты для доступности
        role="log"
        aria-live="polite"
      >
        {isLoadingMore && (
          <div className={styles.loadingMore}>
            <div className={styles.typingIndicator}>
              Загрузка предыдущих сообщений
              <span className={styles.dots}>
                <span></span><span></span><span></span>
              </span>
            </div>
          </div>
        )}

        {messages.length === 0 && !isHistoryLoading && (
          <div className={`${styles.message} ${styles.incoming}`}>
            Добрый день! Готов помочь вам. С чем хотите поработать сегодня?
            <div className={styles.messageTime}>{formatTime()}</div>
          </div>
        )}

        {/* Сообщения (chronological: oldest -> newest) */}
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`${styles.message} ${msg.type === 'incoming' ? styles.incoming : styles.outgoing}`}
          >
            {msg.text}
            <div className={styles.messageTime}>{msg.time}</div>
          </div>
        ))}

        {/* индикатор печатает */}
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
          role="button"
          aria-label="Send message"
        >
          <img src={IMAGES.send} alt="Отправить" />
        </div>
      </div>
    </div>
  );
}

export default ChatPage;
