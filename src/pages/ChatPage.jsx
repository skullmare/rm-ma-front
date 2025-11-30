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
  const isScrolledToBottom = useRef(true);
  const initialScrollDone = useRef(false);

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
  const canLoadMore = useRef(false);

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

  // === Прокрутка вниз ===
  const scrollToBottom = useCallback((behavior = 'smooth') => {
    if (!chatContainerRef.current) return;
    
    const scrollHeight = chatContainerRef.current.scrollHeight;
    const clientHeight = chatContainerRef.current.clientHeight;
    
    chatContainerRef.current.scrollTo({
      top: scrollHeight - clientHeight,
      behavior: behavior
    });
    
    isScrolledToBottom.current = true;
  }, []);

  // === Загрузка истории ===
  const loadHistory = useCallback(async (timestamp = null) => {
    if (!chatId) {
      setIsHistoryLoading(false);
      return;
    }

    try {
      const params = {
        chat_id: chatId,
      };
      if (timestamp) {
        params.timestamp = String(timestamp);
      }

      const { data } = await apiClient.get('/api/chats/history', { params });

      if (data?.messages && Array.isArray(data.messages)) {
        const transformed = data.messages.map(transformMessage);
        transformed.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

        if (timestamp) {
          setMessages(prev => {
            const combined = [...transformed, ...prev];
            const unique = Array.from(new Map(combined.map(m => [m.id, m])).values());
            return unique.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
          });
        } else {
          setMessages(transformed);
        }
        setHasMoreMessages(data.hasMore === true);
      }
    } catch (error) {
      console.error('Ошибка загрузки истории:', error);
    } finally {
      setIsHistoryLoading(false);
      setIsLoadingMore(false);
      if (!timestamp) {
        setTimeout(() => {
          canLoadMore.current = true;
        }, 2000);
      }
    }
  }, [chatId, transformMessage]);

  // === Первая загрузка ===
  useEffect(() => {
    if (!chatId) {
      setIsHistoryLoading(false);
      return;
    }

    setIsHistoryLoading(true);
    isScrolledToBottom.current = true;
    initialScrollDone.current = false;
    canLoadMore.current = false;
    
    loadHistory();
  }, [chatId, agent, loadHistory]);

  // === Загрузка старых сообщений при скролле вверх ===
  const handleScroll = useCallback(() => {
    if (!chatContainerRef.current || isLoadingMore || !hasMoreMessages || !canLoadMore.current) {
      return;
    }

    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;

    // Проверяем, близко ли к верху
    if (scrollTop < 150) {
      const oldest = messages[0];
      if (oldest?.timestamp) {
        setIsLoadingMore(true);
        loadHistory(oldest.timestamp);
      }
    }

    // Обновляем флаг: был ли пользователь внизу
    const atBottom = scrollHeight - scrollTop - clientHeight < 100;
    isScrolledToBottom.current = atBottom;
  }, [messages, isLoadingMore, hasMoreMessages, loadHistory]);

  useEffect(() => {
    const chat = chatContainerRef.current;
    if (!chat) return;
    chat.addEventListener('scroll', handleScroll);
    return () => chat.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // === Автопрокрутка при новых сообщениях ===
  useEffect(() => {
    if (isHistoryLoading) return;

    const timer = setTimeout(() => {
      if (!initialScrollDone.current) {
        // Первоначальная прокрутка при загрузке истории
        scrollToBottom('auto');
        initialScrollDone.current = true;
      } else if (isScrolledToBottom.current || isLoading) {
        // Последующие прокрутки при новых сообщениях
        scrollToBottom('smooth');
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [messages, isLoading, isHistoryLoading, scrollToBottom]);

  // === Принудительная прокрутка после загрузки истории ===
  useEffect(() => {
    if (!isHistoryLoading && messages.length > 0 && !initialScrollDone.current) {
      const timer = setTimeout(() => {
        scrollToBottom('auto');
        initialScrollDone.current = true;
      }, 200);
      
      return () => clearTimeout(timer);
    }
  }, [isHistoryLoading, messages.length, scrollToBottom]);

  // === Авторесайз textarea ===
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const adjustHeight = () => {
      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, 140);
      textarea.style.height = newHeight + 'px';
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

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

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
            updated.push(aiMsg);
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
        {isLoadingMore && (
          <div className={styles.loadingMore}>Загрузка предыдущих сообщений...</div>
        )}

        {messages.length === 0 && !isHistoryLoading && (
          <div className={`${styles.message} ${styles.incoming}`}>
            Добрый день! Готов помочь вам. С чем хотите поработать сегодня?
            <div className={styles.messageTime}>{formatTime(new Date())}</div>
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