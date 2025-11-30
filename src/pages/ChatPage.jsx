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
      {new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
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
  const isAtBottom = useRef(true);              // пользователь внизу?
  const previousHeight = useRef(0);              // высота до подгрузки старых сообщений

  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const formatTime = useCallback((dateInput) => {
    const date = new Date(dateInput || Date.now());
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  }, []);

  const transformMessage = useCallback((msg) => ({
    id: msg._id || msg.id || `msg-${Date.now()}`,
    text: msg.message || '',
    type: msg.autor === 'human' ? 'outgoing' : 'incoming',
    time: formatTime(msg.create_at || msg.timestamp),
    timestamp: msg.timestamp ? Number(msg.timestamp) : new Date(msg.create_at || Date.now()).getTime(),
  }), [formatTime]);

  const scrollToBottom = useCallback((behavior = 'smooth') => {
    const container = chatContainerRef.current;
    if (!container) return;
    container.scrollTo({
      top: container.scrollHeight - container.clientHeight,
      behavior,
    });
  }, []);

  const loadHistory = useCallback(async (beforeTimestamp = null) => {
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

        setMessages(prev => {
          const combined = beforeTimestamp ? [...newMessages, ...prev] : newMessages;
          const unique = Array.from(new Map(combined.map(m => [m.id, m])).values());
          return unique.sort((a, b) => a.timestamp - b.timestamp);
        });

        setHasMore(!!data.hasMore);
      }
    } catch (err) {
      console.error('Ошибка загрузки истории:', err);
    } finally {
      setIsHistoryLoading(false);
      setIsLoadingMore(false);
    }
  }, [chatId, transformMessage]);

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

  // Автопрокрутка только когда нужно
  useEffect(() => {
    if (isHistoryLoading) return;

    const container = chatContainerRef.current;
    if (!container) return;

    // Если пользователь был внизу или только что отправил сообщение — прокручиваем вниз
    if (isAtBottom.current || isLoading) {
      scrollToBottom(isLoading ? 'smooth' : 'auto');
    }
    // Если подгрузили старые сообщения — сохраняем позицию (это ключевой фикс!)
    else if (isLoadingMore) {
      container.scrollTop = container.scrollHeight - previousHeight.current;
    }
  }, [messages, isLoading, isHistoryLoading, isLoadingMore, scrollToBottom]);

  // Обработка скролла
  const handleScroll = useCallback(() => {
    const container = chatContainerRef.current;
    if (!container || isLoadingMore || !hasMore || messages.length === 0) return;

    const { scrollTop, scrollHeight, clientHeight } = container;

    // Проверяем, внизу ли пользователь
    isAtBottom.current = scrollHeight - scrollTop - clientHeight < 100;

    // Если близко к верху — подгружаем старые
    if (scrollTop < 200) {
      previousHeight.current = scrollHeight;  // запоминаем текущую высоту
      setIsLoadingMore(true);
      const oldestTimestamp = messages[0].timestamp;
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
      const newHeight = Math.min(textarea.scrollHeight, 140);
      textarea.style.height = `${newHeight}px`;
      textarea.style.overflowY = newHeight >= 140 ? 'auto' : 'hidden';
    };

    textarea.addEventListener('input', resize);
    resize();

    return () => textarea.removeEventListener('input', resize);
  }, []);

  // Отправка сообщения
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

    setMessages(prev => [...prev, optimisticMessage]);
    setInputValue('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    setIsLoading(true);
    isAtBottom.current = true;

    try {
      const { data } = await apiClient.post('/api/chats/send', {
        message: text,
        agent,
      });

      setMessages(prev => {
        let updated = prev.map(m =>
          m.id === tempId && data?.userMessageId ? { ...m, id: data.userMessageId } : m
        );

        if (data?.message && data.autor === 'ai_agent') {
          const aiMsg = transformMessage(data);
          if (!updated.some(m => m.id === aiMsg.id)) {
            updated = [...updated, aiMsg];
          }
        }
        return updated;
      });
    } catch (err) {
      console.error('Ошибка отправки:', err);
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
        <div className="container-fluid d-flex justify-content-between px-0 align-items-center">
          <a className={styles.prev} href="#" onClick={(e) => { e.preventDefault(); navigate('/agents_list'); }}>
            <img src={IMAGES.backArrow} alt="назад" />
          </a>
          <div style={{ fontWeight: 500, color: '#BEBEBE', fontSize: '16px' }}>{agentName}</div>
          <a className={styles.navbarAccount} href="#" onClick={(e) => { e.preventDefault(); navigate('/profile'); }}>
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

        {messages.map(msg => (
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
            onChange={e => setInputValue(e.target.value)}
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