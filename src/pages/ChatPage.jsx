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
  const [loadingTimestamp, setLoadingTimestamp] = useState(null);
  const previousScrollHeight = useRef(0);

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
    timestamp: msg.timestamp
      ? Number(msg.timestamp)
      : new Date(msg.create_at || Date.now()).getTime(),
  }), []);

  /** ————————————————————————
   * FIX MOBILE SCROLLING
   * ————————————————————————
   */

  const saveScrollPosition = () => {
    const c = chatContainerRef.current;
    if (c) previousScrollHeight.current = c.scrollHeight;
  };

  const restoreScrollPosition = () => {
    const c = chatContainerRef.current;
    if (!c || !previousScrollHeight.current) return;

    const newHeight = c.scrollHeight;
    const diff = newHeight - previousScrollHeight.current;

    if (diff > 0) {
      requestAnimationFrame(() => {
        c.scrollTop = diff;
      });
    }
  };

  const scrollToBottom = useCallback(() => {
    const c = chatContainerRef.current;
    if (!c) return;

    requestAnimationFrame(() => {
      c.scrollTop = c.scrollHeight;
    });
  }, []);

  /** ————————————————————————
   * LOAD HISTORY (WORKING MOBILE VERSION)
   * ————————————————————————
   */

  const loadHistory = useCallback(async (beforeTimestamp = null, isLoadMore = false) => {
    if (!chatId) return;

    try {
      if (isLoadMore) {
        saveScrollPosition();
        setIsLoadingMore(true);
      } else {
        setIsHistoryLoading(true);
      }

      const params = { chat_id: chatId };
      if (beforeTimestamp) params.timestamp = String(beforeTimestamp);

      const { data } = await apiClient.get('/api/chats/history', {
        params,
        timeout: 10000,
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

        if (isLoadMore) {
          setTimeout(restoreScrollPosition, 30);
        } else {
          setTimeout(scrollToBottom, 100);
        }
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Ошибка загрузки истории:', err);
      setHasMore(false);
      if (!isLoadMore) scrollToBottom();
    } finally {
      if (isLoadMore) {
        setIsLoadingMore(false);
        setLoadingTimestamp(null);
      } else {
        setIsHistoryLoading(false);
      }
    }
  }, [chatId, scrollToBottom, transformMessage]);

  /** ————————————————————————
   * INITIAL LOAD
   * ————————————————————————
   */
  useEffect(() => {
    if (!chatId) {
      setIsHistoryLoading(false);
      return;
    }

    setIsHistoryLoading(true);
    setMessages([]);
    setHasMore(true);

    const loadInitial = async () => {
      await loadHistory();
      scrollToBottom();
    };

    loadInitial();
  }, [chatId, agent, loadHistory, scrollToBottom]);

  /** ————————————————————————
   * MOBILE-SAFE SCROLL HANDLER
   * ————————————————————————
   */
  const handleScroll = useCallback(() => {
    const c = chatContainerRef.current;
    if (!c || isLoadingMore || !hasMore || messages.length === 0) return;

    // iOS Safari: верх скролла всегда строго scrollTop === 0
    const isAtTop = c.scrollTop <= 0;

    if (isAtTop) {
      const oldest = messages[0]?.timestamp;
      if (oldest && oldest !== loadingTimestamp) {
        setLoadingTimestamp(oldest);
        loadHistory(oldest, true);
      }
    }
  }, [messages, isLoadingMore, hasMore, loadHistory, loadingTimestamp]);

  useEffect(() => {
    const c = chatContainerRef.current;
    if (!c) return;

    // Без debounce — обязательно для iOS
    c.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      c.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  /** ————————————————————————
   * WINDOW RESIZE AUTOSCROLL
   * ————————————————————————
   */
  useEffect(() => {
    const onResize = () => {
      if (messages.length > 0 && !isHistoryLoading) {
        scrollToBottom();
      }
    };

    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [messages.length, isHistoryLoading, scrollToBottom]);

  /** ————————————————————————
   * TEXTAREA AUTO-RESIZE
   * ————————————————————————
   */
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

  /** ————————————————————————
   * SEND MESSAGE
   * ————————————————————————
   */
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
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
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

      scrollToBottom();
    } catch (err) {
      console.error('Ошибка отправки сообщения:', err);
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
    <div className={`${styles.body} ${styles.chatPage}`} style={{ position: 'relative' }}>
      <nav className={styles.navbar}>
        <div className="container-fluid d-flex justify-content-between align-items-center px-0">
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); navigate('/agents_list'); }}
            className={styles.prev}
          >
            <img src={IMAGES.back} alt="назад" />
          </a>
          <div style={{ fontWeight: 500, color: '#BEBEBE', fontSize: '16px' }}>
            {agentName}
          </div>
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); navigate('/profile'); }}
            className={styles.navbarAccount}
          >
            <div className={styles.accountIcon}>
              <img src={IMAGES.settings} alt="настройки" />
            </div>
          </a>
        </div>
      </nav>

      <div className={styles.glow} />

      <main ref={chatContainerRef} className={styles.chatContainer}>
        {isLoadingMore && (
          <div className={styles.loadingMore}>
            <div className={styles.typingIndicator}>
              Загрузка предыдущих сообщений
              <span className={styles.dots}><span></span><span></span><span></span></span>
            </div>
          </div>
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
              <span className={styles.dots}><span></span><span></span><span></span></span>
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
            onChange={(e) => setInputValue(e.target.value)}
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

      <div
        onClick={scrollToBottom}
        style={{
          position: 'absolute',
          bottom: '80px',
          right: '20px',
          transform: 'rotate(-90deg)',
          cursor: 'pointer',
          borderRadius: '50%',
          backgroundColor: '#2d2d2d',
          zIndex: 9999,
          width: '40px',
          height: '40px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <img style={{ width: '20px', height: '20px' }} src={IMAGES.back} alt="Наверх" />
      </div>
    </div>
  );
}

export default ChatPage;
