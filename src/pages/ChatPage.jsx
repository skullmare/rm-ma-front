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

  const agentInfo = location.state || { agent: 'sergey', agentName: 'СЕРГЕЙ' };
  const { agent, agentName } = agentInfo;

  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [inputValue, setInputValue] = useState('');

  const isPageLoading = usePageLoader(500);
  const chatId = user?.telegramId || user?.id;

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

  const transformMessage = useCallback((msg) => {
    return {
      id: msg._id || msg.id || Date.now(),
      text: msg.message || '',
      type: msg.autor === 'human' ? 'outgoing' : 'incoming',
      time: formatTime(msg.create_at || msg.timestamp),
    };
  }, [formatTime]);

  const scrollToBottom = useCallback(() => {
    if (!chatContainerRef.current) return;
    chatContainerRef.current.scrollTo({
      top: chatContainerRef.current.scrollHeight,
      behavior: 'smooth'
    });
  }, []);

  const loadHistory = useCallback(async () => {
    if (!chatId) {
      setIsHistoryLoading(false);
      return;
    }

    try {
      const { data } = await apiClient.get('/api/chats/history');
      if (data?.messages && Array.isArray(data.messages)) {
        const transformed = data.messages.map(transformMessage);
        setMessages(transformed);
      }
    } catch (error) {
      console.error('Ошибка загрузки истории:', error);
    } finally {
      setIsHistoryLoading(false);
    }
  }, [chatId, transformMessage]);

  useEffect(() => {
    if (!chatId) {
      setIsHistoryLoading(false);
      return;
    }
    loadHistory();
  }, [chatId, loadHistory]);

  useEffect(() => {
    if (!isHistoryLoading) {
      scrollToBottom();
    }
  }, [messages, isHistoryLoading, scrollToBottom]);

  const sendMessage = async () => {
    const text = inputValue.trim();
    if (!text || isLoading || !chatId) return;

    const userMessage = {
      id: `temp-${Date.now()}`,
      text,
      type: 'outgoing',
      time: formatTime(new Date()),
      autor: 'human',
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const { data } = await apiClient.post('/api/chats/send', {
        message: text,
        agent,
      });

      if (data?.message && data?.autor === 'ai_agent') {
        const aiMsg = transformMessage(data);
        setMessages(prev => [...prev, aiMsg]);
      }
    } catch (error) {
      console.error('Ошибка отправки:', error);
      setMessages(prev => prev.filter(m => m.id !== userMessage.id));
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
            onChange={(e) => setInputValue(e.targetValue)}
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