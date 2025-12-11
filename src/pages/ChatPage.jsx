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
import Message from '../components/Message'; // Импортируем компонент Message

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
  const [textareaHeight, setTextareaHeight] = useState(44);

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

      const params = {};
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
      </main>

      <div className={styles.glowBottom} />

      <div
        onClick={scrollToBottom}
        style={{
          position: 'fixed',
          bottom: `${calculateButtonBottom()}px`,
          right: '20px',
          transform: 'rotate(-90deg)',
          transformOrigin: 'center center',
          cursor: 'pointer',
          borderRadius: '50%',
          backgroundColor: '#2d2d2d',
          zIndex: 10000,
          width: '40px',
          height: '40px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          transition: 'bottom 0.2s ease',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
        }}
      >
        <img 
          style={{ 
            width: '20px', 
            height: '20px',
            filter: 'brightness(0.9)'
          }} 
          src={IMAGES.back} 
          alt="Прокрутить вниз" 
        />
      </div>

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