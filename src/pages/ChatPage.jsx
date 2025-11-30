// Fixed ChatPage component with bottom-up messages, auto-scroll to bottom on open, and correct history loading
import React, { useCallback, useEffect, useRef, useState, useLayoutEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from '../css/modules/ChatPage.module.css';
import Spinner from '../components/Spinner';
import { usePageLoader } from '../hooks/usePageLoader';
import apiClient from '../lib/apiClient';
import { useAuth } from '../context/AuthContext.jsx';

const backArrowImg = '/img/Rectangle 42215.svg';
const settingIconImg = '/img/setting_icon.svg';
const sendButtonImg = '/img/send-button.png';

function ChatPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const textareaRef = useRef(null);
  const chatRef = useRef(null);

  const agentInfo = location.state || { agent: 'sergey', agentName: 'СЕРГЕЙ' };
  const { agent, agentName } = agentInfo;

  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const isPageLoading = usePageLoader(500);

  const initialScrollDone = useRef(false);

  const chatId = user?.telegramId || user?.id;

  const formatTime = useCallback((timestampOrDate) => {
    const date = new Date(timestampOrDate);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }, []);

  const transformMessage = useCallback((msg) => {
    return {
      id: msg._id || msg.id || Date.now(),
      text: msg.message || '',
      type: msg.autor === 'human' ? 'outgoing' : 'incoming',
      time: formatTime(msg.create_at || msg.timestamp),
      timestamp: Number(msg.timestamp || new Date(msg.create_at).getTime()),
      autor: msg.autor,
    };
  }, [formatTime]);

  const loadHistory = useCallback(async (timestamp = null) => {
    if (!chatId) {
      setIsHistoryLoading(false);
      return;
    }

    try {
      const params = timestamp ? { timestamp: String(timestamp) } : {};
      const { data } = await apiClient.get('/api/chats/history', { params });

      if (Array.isArray(data?.messages)) {
        const incoming = data.messages.map(transformMessage);
        incoming.sort((a, b) => a.timestamp - b.timestamp);

        setMessages((prev) => {
          if (!timestamp) return incoming;

          const merged = [...incoming, ...prev];
          const unique = Array.from(new Map(merged.map(m => [m.id, m])).values());
          return unique.sort((a, b) => a.timestamp - b.timestamp);
        });

        setHasMoreMessages(data.hasMore === true);
      }
    } catch (e) {
      console.error('History load error', e);
    } finally {
      setIsHistoryLoading(false);
      setIsLoadingMore(false);
    }
  }, [chatId, transformMessage]);

  useEffect(() => {
    if (!chatId) {
      setIsHistoryLoading(false);
      return;
    }

    initialScrollDone.current = false;
    setIsHistoryLoading(true);
    loadHistory();
  }, [chatId, agent, loadHistory]);

  const handleScroll = useCallback(() => {
    if (!chatRef.current || isLoadingMore || !hasMoreMessages) return;

    const { scrollTop } = chatRef.current;

    if (scrollTop < 120) {
      const oldest = messages[0];
      if (oldest?.timestamp) {
        setIsLoadingMore(true);
        loadHistory(oldest.timestamp);
      }
    }
  }, [messages, isLoadingMore, hasMoreMessages, loadHistory]);

  useEffect(() => {
    const chat = chatRef.current;
    if (!chat) return;

    chat.addEventListener('scroll', handleScroll);
    return () => chat.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  useLayoutEffect(() => {
    if (!isHistoryLoading && messages.length > 0 && chatRef.current && !initialScrollDone.current) {
      const c = chatRef.current;
      c.scrollTop = c.scrollHeight;
      initialScrollDone.current = true;
    }
  }, [isHistoryLoading, messages.length]);

  useEffect(() => {
    if (!chatRef.current) return;
    const chat = chatRef.current;

    const nearBottom = chat.scrollHeight - chat.scrollTop - chat.clientHeight < 80;

    if (nearBottom || isLoading) {
      requestAnimationFrame(() => {
        chat.scrollTop = chat.scrollHeight;
      });
    }
  }, [messages, isLoading]);

  const sendMessage = async () => {
    const text = inputValue.trim();
    if (!text || isLoading || !chatId) return;

    const userMessage = {
      id: `tmp-${Date.now()}`,
      text,
      type: 'outgoing',
      time: formatTime(Date.now()),
      timestamp: Date.now(),
      autor: 'human',
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setIsLoading(true);

    try {
      const { data } = await apiClient.post('/api/chats/send', { message: text, agent });

      if (data?.message) {
        const bot = transformMessage(data);
        setMessages((prev) => [...prev, bot]);
      }
    } catch (e) {
      console.error('Send error', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (isPageLoading || (isHistoryLoading && messages.length === 0)) return <Spinner />;

  return (
    <div className={`${styles.body} ${styles.chatPage}`}>
      <nav className={styles.navbar}>
        <div className="container-fluid d-flex justify-content-between px-0 align-items-center">
          <a className={styles.prev} href="#" onClick={() => navigate('/agents_list')}>
            <img src={backArrowImg} alt="назад" />
          </a>
          <div style={{ fontWeight: 500, color: '#BEBEBE', fontSize: '16px' }}>{agentName}</div>
          <a className={styles.navbarAccount} href="#" onClick={() => navigate('/profile')}>
            <div className={styles.accountIcon}>
              <img src={settingIconImg} alt="настройки" />
            </div>
          </a>
        </div>
      </nav>

      <main id="chat" ref={chatRef}>
        {isLoadingMore && <div className={styles.loadingMore}>Загрузка предыдущих сообщений...</div>}

        {messages.map((m) => (
          <div key={m.id} className={`${styles.message} ${m.type === 'incoming' ? styles.incoming : styles.outgoing}`}>
            {m.text}
            <div className={styles.messageTime}>{m.time}</div>
          </div>
        ))}

        {isLoading && (
          <div className={`${styles.message} ${styles.incoming}`}>
            <div className={styles.typingIndicator}>
              <span className={styles.dots}><span></span><span></span><span></span></span> печатает
            </div>
          </div>
        )}
      </main>

      <div className={styles.formBlock}>
        <div className={styles.blockQuestionField}>
          <textarea
            className={styles.questionField}
            placeholder="Задайте свой вопрос..."
            rows="1"
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
          ></textarea>
        </div>
        <div className={styles.blockButtonSend} onClick={sendMessage}>
          <img src={sendButtonImg} alt="Отправить" />
        </div>
      </div>
    </div>
  );
}

export default ChatPage;