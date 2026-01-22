import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from '../css/modules/ChatPage.module.css';
import Spinner from '../components/Spinner';
import PageNavbar from '../components/PageNavbar';
import { usePageLoader } from '../hooks/usePageLoader';
import apiClient from '../lib/apiClient';
import { useAuth } from '../context/AuthContext.jsx';
import Message from '../components/Message';
import { IMAGES } from '../constants/images';
import { ROUTES } from '../constants/routes';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

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
  const [textareaHeight, setTextareaHeight] = useState(44);
  const [showScrollButton, setShowScrollButton] = useState(false);
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
    time: formatTime(msg.create_at || msg.timestamp),
    timestamp: msg.timestamp ? Number(msg.timestamp) : new Date(msg.create_at || Date.now()).getTime(),
  }), []);

  const scrollToBottom = useCallback(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    requestAnimationFrame(() => {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth',
      });
    });
  }, []);

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

        if (!beforeTimestamp) setTimeout(scrollToBottom, 100);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Ошибка загрузки истории:', err);
      setHasMore(false);
      if (!beforeTimestamp) setTimeout(scrollToBottom, 100);
    } finally {
      if (beforeTimestamp) setIsLoadingMore(false);
      else setIsHistoryLoading(false);
    }
  }, [chatId, transformMessage, scrollToBottom]);

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

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;

    const resize = () => {
      ta.style.height = 'auto';
      const newHeight = Math.min(ta.scrollHeight, 140);
      ta.style.height = newHeight + 'px';
      ta.style.overflowY = newHeight >= 140 ? 'auto' : 'hidden';
      setTextareaHeight(newHeight);
    };

    resize();
  }, [inputValue]);

  // Загрузка тарифа
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

  // Отслеживание скролла для показа кнопки "Вниз"
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 200;
      const hasEnoughMessages = messages.length > 5;

      setShowScrollButton(hasEnoughMessages && !isNearBottom);
    };

    container.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check

    return () => container.removeEventListener('scroll', handleScroll);
  }, [messages.length]);

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
    setIsLoading(true);
    setTimeout(scrollToBottom, 100);
    
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

  const calculateButtonBottom = () => {
    const minTextareaHeight = 44;
    const baseBottom = 80;
    const heightDifference = Math.max(0, textareaHeight - minTextareaHeight);
    return baseBottom + heightDifference;
  };

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

      <main ref={chatContainerRef} className={styles.chatContainer}>
        {hasMore && !isHistoryLoading && (
          <button
            onClick={() => {
              const oldest = messages[0]?.timestamp;
              if (oldest) loadHistory(oldest);
            }}
            className={styles.loadMoreButton}
          >
            {isLoadingMore ? 'Загрузка...' : 'Загрузить предыдущие сообщения'}
          </button>
        )}
        
        {/* Используем компонент Message для рендеринга всех сообщений */}
        {messages.map(msg => (
          <Message key={msg.id} msg={msg} />
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

        {/* Кнопка прокрутки вниз */}
        {showScrollButton && (
          <div
            onClick={scrollToBottom}
            className={styles.scrollToBottomButton}
          >
            <img src={IMAGES.BACK_ARROW} alt="Прокрутить вниз" />
          </div>
        )}
      </main>

      <div className={styles.glowBottom} />

      <div className={styles.formBlock}>
        <div className={styles.blockQuestionField}>
          <textarea
            ref={textareaRef}
            className={styles.questionField}
            placeholder="Задайте вопрос..."
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            rows={1}
          />
        </div>
        {inputValue.trim().length > 0 && (
          <div
            className={styles.blockButtonSend}
            onClick={sendMessage}
            style={{ opacity: isLoading ? 0.5 : 1 }}
          >
            <img src={IMAGES.SEND_BUTTON} alt="Отправить" />
          </div>
        )}
      </div>
    </div>
  );
}

export default ChatPage;