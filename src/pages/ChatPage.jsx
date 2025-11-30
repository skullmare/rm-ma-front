import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  const chatContainerRef = useRef(null);
  const prevScrollHeightRef = useRef(0); // Для сохранения позиции при загрузке старых

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
  const chatId = user?.telegramId || user?.id;

  // === Форматирование времени ===
  const formatTime = useCallback((timestampOrDate) => {
    let date;
    if (typeof timestampOrDate === 'string') {
      date = new Date(timestampOrDate);
    } else if (typeof timestampOrDate === 'number') {
      date = new Date(Number(timestampOrDate));
    } else {
      date = new Date();
    }
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }, []);

  // === Преобразование сообщения ===
  const transformMessage = useCallback((msg) => {
    return {
      id: msg._id || msg.id || Date.now(),
      text: msg.message || '',
      type: msg.autor === 'human' ? 'outgoing' : 'incoming',
      time: formatTime(msg.create_at || msg.timestamp),
      timestamp: msg.timestamp ? Number(msg.timestamp) : new Date(msg.create_at).getTime(),
      autor: msg.autor,
    };
  }, [formatTime]);

  // === Загрузка истории ===
  const loadHistory = useCallback(async (timestamp = null) => {
    if (!chatId) {
      setIsHistoryLoading(false);
      return;
    }

    try {
      const params = timestamp ? { timestamp: String(timestamp) } : {};
      const { data } = await apiClient.get('/api/chats/history', { params });

      if (data?.messages && Array.isArray(data.messages)) {
        const transformed = data.messages.map(transformMessage);
        transformed.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

        if (timestamp) {
          // Добавляем старые сообщения в НАЧАЛО массива (поскольку reverse)
          setMessages(prev => {
            const combined = [...transformed, ...prev];
            const unique = Array.from(new Map(combined.map(m => [m.id, m])).values());
            return unique.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
          });
          setHasMoreMessages(data.hasMore === true);
        } else {
          setMessages(transformed);
          setHasMoreMessages(data.hasMore === true);
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки истории:', error);
    } finally {
      setIsHistoryLoading(false);
      setIsLoadingMore(false);
    }
  }, [chatId, transformMessage]);

  // === Первая загрузка ===
  useEffect(() => {
    if (!chatId) {
      setIsHistoryLoading(false);
      return;
    }

    setIsHistoryLoading(true);
    loadHistory();
  }, [chatId, agent, loadHistory]);

  // === Обработка скролла для загрузки старых ===
  const handleScroll = useCallback(() => {
    if (!chatContainerRef.current || isLoadingMore || !hasMoreMessages) return;

    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;

    // В column-reverse: когда scrollTop близко к 0 — "внизу" (новые сообщения)
    // Когда scrollTop большой — просмотр старых (верх чата)
    if (scrollTop < 150) { // Близко к "верху" визуально (старым сообщениям)
      const oldest = messages[0];
      if (oldest?.timestamp) {
        prevScrollHeightRef.current = scrollHeight; // Сохраняем высоту перед добавлением
        setIsLoadingMore(true);
        loadHistory(oldest.timestamp);
      }
    }
  }, [messages, isLoadingMore, hasMoreMessages, loadHistory]);

  useEffect(() => {
    const chat = chatContainerRef.current;
    if (!chat) return;
    chat.addEventListener('scroll', handleScroll);
    return () => chat.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // === Корректировка скролла после добавления старых сообщений ===
  useEffect(() => {
    if (isLoadingMore || !chatContainerRef.current) return;

    const chat = chatContainerRef.current;
    const prevScrollHeight = prevScrollHeightRef.current;

    if (prevScrollHeight > 0) {
      // Корректируем позицию скролла, чтобы не дёргалось
      const newScrollHeight = chat.scrollHeight;
      chat.scrollTop = newScrollHeight - prevScrollHeight;
      prevScrollHeightRef.current = 0;
    }
  }, [messages, isLoadingMore]);

  // === Авторесайз textarea ===
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const adjustHeight = () => {
      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, 140);
      textarea.style.height = `${newHeight}px`;
      textarea.style.overflowY = newHeight >= 140 ? 'auto' : 'hidden';
    };

    textarea.addEventListener('input', adjustHeight);
    adjustHeight();

    return () => textarea.removeEventListener('input', adjustHeight);
  }, []);

  // === Отправка сообщения ===
  const sendMessage = async () => {
    const text = inputValue.trim();
    if (!text || isLoading || !chatId) return;

    const tempId = `temp-${Date.now()}`;
    const userMessage = {
      id: tempId,
      text,
      type: 'outgoing',
      time: formatTime(new Date()),
      timestamp: Date.now(),
      autor: 'human',
    };

    // Добавляем в конец (новое сообщение)
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    // Поскольку column-reverse, новое появляется внизу автоматически, без скролла

    setIsLoading(true);

    try {
      const { data } = await apiClient.post('/api/chats/send', {
        message: text,
        agent,
      });

      setMessages(prev => {
        let updated = prev.map(m => m.id === tempId && data?.userMessageId ? { ...m, id: data.userMessageId } : m);

        if (data?.message && data?.autor === 'ai_agent') {
          const aiMsg = transformMessage(data);
          if (!updated.some(m => m.id === aiMsg.id)) {
            updated = [...updated, aiMsg]; // Добавляем в конец
          }
        }

        return updated;
      });
    } catch (error) {
      console.error('Ошибка отправки:', error);
      setMessages(prev => prev.filter(m => m.id !== tempId));
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

  if (isPageLoading || (isHistoryLoading && messages.length === 0)) {
    return <Spinner />;
  }

  return (
    <div className={`${styles.body} ${styles.chatPage}`}>
      <nav className={styles.navbar}>
        <div className="container-fluid d-flex justify-content-between px-0 align-items-center">
          <a className={styles.prev} href="#" onClick={(e) => { e.preventDefault(); navigate('/agents_list'); }}>
            <img src={backArrowImg} alt="назад" />
          </a>
          <div style={{ fontWeight: 500, color: '#BEBEBE', fontSize: '16px' }}>{agentName}</div>
          <a className={styles.navbarAccount} href="#" onClick={(e) => { e.preventDefault(); navigate('/profile'); }}>
            <div className={styles.accountIcon}>
              <img src={settingIconImg} alt="настройки" />
            </div>
          </a>
        </div>
      </nav>

      <div className={styles.glow}></div>

      <main id="chat" ref={chatContainerRef} className={styles.chatContainer}>
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

        {messages.map((message) => (
          <div
            key={message.id}
            className={`${styles.message} ${message.type === 'incoming' ? styles.incoming : styles.outgoing}`}
          >
            {message.text}
            <div className={styles.messageTime}>{message.time}</div>
          </div>
        ))}

        {messages.length === 0 && !isHistoryLoading && (
          <div className={`${styles.message} ${styles.incoming}`}>
            Добрый день! Готов помочь вам. С чем хотите поработать сегодня? 😊
            <div className={styles.messageTime}>{formatTime(new Date())}</div>
          </div>
        )}

        {isLoadingMore && (
          <div className={styles.loadingMore}>Загрузка предыдущих сообщений...</div>
        )}
      </main>

      <div className={styles.glowBottom}></div>

      <div className={styles.formBlock}>
        <div className={styles.blockQuestionField}>
          <textarea
            className={styles.questionField}
            placeholder="Задайте свой вопрос..."
            rows="1"
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={isLoading}
          />
        </div>
        <div className={styles.blockButtonSend} onClick={sendMessage}>
          <img src={sendButtonImg} alt="Отправить" />
        </div>
      </div>
    </div>
  );
}

export default ChatPage;