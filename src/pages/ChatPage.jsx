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
  const chatRef = useRef(null);
  
  // Получаем информацию об агенте из location state или используем значения по умолчанию
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

  // Получаем chat_id из пользователя
  const chatId = user?.telegramId || user?.id;

  // Форматирование времени из timestamp или create_at
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

  // Преобразование сообщения из формата API в формат для отображения
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

  // Загрузка истории сообщений
  const loadHistory = useCallback(async (timestamp = null) => {
    if (!chatId) {
      setIsHistoryLoading(false);
      return;
    }

    try {
      const params = timestamp ? { timestamp: String(timestamp) } : {};
      const { data } = await apiClient.get('/api/chats/history', { params });
      
      if (data?.messages && Array.isArray(data.messages)) {
        const transformedMessages = data.messages.map(transformMessage);
        
        // Сортируем по timestamp (от старых к новым)
        transformedMessages.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
        
        if (timestamp) {
          // Добавляем к существующим сообщениям в начало
          setMessages(prev => {
            // Объединяем и удаляем дубликаты
            const combined = [...transformedMessages, ...prev];
            const unique = combined.reduce((acc, msg) => {
              if (!acc.find(m => m.id === msg.id)) {
                acc.push(msg);
              }
              return acc;
            }, []);
            // Сортируем по timestamp
            return unique.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
          });
        } else {
          // Первая загрузка - заменяем все сообщения
          setMessages(transformedMessages);
        }
        
        // Проверяем, есть ли еще сообщения
        setHasMoreMessages(data.hasMore === true);
      }
    } catch (error) {
      console.error('Не удалось загрузить историю чата', error);
    } finally {
      setIsHistoryLoading(false);
      setIsLoadingMore(false);
    }
  }, [chatId, transformMessage]);

  // Первичная загрузка истории при открытии чата
  useEffect(() => {
    if (!chatId) {
      setIsHistoryLoading(false);
      return;
    }
    
    setIsHistoryLoading(true);
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId, agent]); // Перезагружаем при смене агента

  // Обработка скролла для загрузки старых сообщений
  const handleScroll = useCallback(() => {
    if (!chatRef.current || isLoadingMore || !hasMoreMessages) return;

    const { scrollTop } = chatRef.current;
    
    // Если прокрутили вверх достаточно (например, на 100px от верха)
    if (scrollTop < 100) {
      const oldestMessage = messages[0];
      if (oldestMessage?.timestamp) {
        setIsLoadingMore(true);
        loadHistory(oldestMessage.timestamp);
      }
    }
  }, [messages, isLoadingMore, hasMoreMessages, loadHistory]);

  // Добавляем обработчик скролла
  useEffect(() => {
    const chat = chatRef.current;
    if (!chat) return;

    chat.addEventListener('scroll', handleScroll);
    return () => {
      chat.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  // Настройка textarea и автопрокрутки
  useEffect(() => {
    const textarea = textareaRef.current;
    const chat = chatRef.current;

    if (!textarea || !chat) return;

    const scrollToBottom = () => {
      chat.scrollTop = chat.scrollHeight;
    };

    const adjustHeight = () => {
      textarea.style.height = 'auto';
      const newHeight = textarea.scrollHeight;

      if (newHeight > 140) {
        textarea.style.overflowY = 'auto';
        textarea.style.height = '140px';
      } else {
        textarea.style.overflowY = 'hidden';
        textarea.style.height = newHeight + 'px';
      }
    };

    window.addEventListener('load', scrollToBottom);
    textarea.addEventListener('input', adjustHeight);
    textarea.addEventListener('focus', scrollToBottom);

    const observer = new MutationObserver(scrollToBottom);
    observer.observe(chat, {
      childList: true,
      subtree: true
    });

    adjustHeight();
    scrollToBottom();

    return () => {
      window.removeEventListener('load', scrollToBottom);
      textarea.removeEventListener('input', adjustHeight);
      textarea.removeEventListener('focus', scrollToBottom);
      observer.disconnect();
    };
  }, []);

  // Автопрокрутка вниз после первой загрузки истории
  useEffect(() => {
    if (!isHistoryLoading && messages.length > 0 && chatRef.current) {
      // Прокручиваем вниз после загрузки истории
      const scrollToBottom = () => {
        if (chatRef.current) {
          chatRef.current.scrollTop = chatRef.current.scrollHeight;
        }
      };
      
      // Используем небольшую задержку для гарантии, что DOM обновился
      setTimeout(scrollToBottom, 50);
    }
  }, [isHistoryLoading, messages.length]);

  // Автопрокрутка вниз при добавлении новых сообщений (только если уже были внизу)
  useEffect(() => {
    if (!chatRef.current || messages.length === 0 || isHistoryLoading) return;
    
    const chat = chatRef.current;
    const isScrolledToBottom = chat.scrollHeight - chat.scrollTop - chat.clientHeight < 50;
    
    // Прокручиваем вниз при отправке сообщений или если уже были внизу
    if (isScrolledToBottom || isLoading) {
      requestAnimationFrame(() => {
        if (chatRef.current) {
          chatRef.current.scrollTop = chatRef.current.scrollHeight;
        }
      });
    }
  }, [messages, isLoading, isHistoryLoading]);

  const handleBackClick = (e) => {
    e.preventDefault();
    navigate('/agents_list');
  };

  const handleProfileClick = (e) => {
    e.preventDefault();
    navigate('/profile');
  };

  const sendMessage = async () => {
    const messageText = inputValue.trim();
    if (!messageText || isLoading || !chatId) return;

    const userMessage = {
      id: `temp-${Date.now()}`,
      text: messageText,
      type: 'outgoing',
      time: formatTime(new Date()),
      timestamp: Date.now(),
      autor: 'human',
    };

    // Добавляем сообщение пользователя сразу (оптимистичное обновление)
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    
    // Очищаем textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    // Показываем индикатор загрузки
    setIsLoading(true);

    try {
      const { data } = await apiClient.post('/api/chats/send', {
        message: messageText,
        agent,
      });

      // Если получили ответ от агента, добавляем его
      if (data?.message && data?.autor === 'ai_agent') {
        const aiResponse = transformMessage(data);
        
        // Обновляем временное сообщение пользователя (оставляем его) и добавляем ответ агента
        setMessages(prev => {
          // Обновляем ID временного сообщения пользователя, если есть ID от сервера
          const updatedMessages = prev.map(msg => 
            msg.id === userMessage.id && data?.userMessageId 
              ? { ...msg, id: data.userMessageId }
              : msg
          );
          
          // Проверяем, нет ли уже такого ответа агента
          const exists = updatedMessages.some(msg => 
            msg.id === aiResponse.id || 
            (msg.autor === 'ai_agent' && msg.text === aiResponse.text && Math.abs(msg.timestamp - aiResponse.timestamp) < 5000)
          );
          
          if (!exists) {
            return [...updatedMessages, aiResponse];
          }
          return updatedMessages;
        });
      } else if (data?.message || data?.reply || data?.output) {
        // Если формат ответа другой, но есть сообщение
        const aiResponse = {
          id: data?._id || data?.id || `ai-${Date.now()}`,
          text: data?.message || data?.reply || data?.output || 'Извините, не удалось получить ответ',
          type: 'incoming',
          time: formatTime(data?.create_at || data?.timestamp || new Date()),
          timestamp: data?.timestamp ? Number(data.timestamp) : Date.now(),
          autor: 'ai_agent',
        };
        
        setMessages(prev => [...prev, aiResponse]);
      }
    } catch (error) {
      console.error('Ошибка при отправке сообщения:', error);
      
      // Удаляем временное сообщение и показываем ошибку
      setMessages(prev => {
        const withoutTemp = prev.filter(msg => msg.id !== userMessage.id);
        const errorMessage = {
          id: `error-${Date.now()}`,
          text: 'Извините, произошла ошибка при отправке сообщения. Попробуйте еще раз.',
          type: 'incoming',
          time: formatTime(new Date()),
          timestamp: Date.now(),
          autor: 'ai_agent',
        };
        return [...withoutTemp, userMessage, errorMessage];
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendClick = (e) => {
    e.preventDefault();
    sendMessage();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  if (isPageLoading || (isHistoryLoading && messages.length === 0)) {
    return <Spinner />;
  }

  return (
    <div className={`${styles.body} ${styles.chatPage}`}>
      <nav className={styles.navbar}>
        <div className="container-fluid d-flex justify-content-between px-0 align-items-center">
          <a className={styles.prev} href="#" onClick={handleBackClick}>
            <img src={backArrowImg} alt="назад" />
          </a>
          <div style={{ fontWeight: 500, color: '#BEBEBE', fontSize: '16px' }}>{agentName}</div>
          <a className={styles.navbarAccount} href="#" onClick={handleProfileClick}>
            <div className={styles.accountIcon}>
              <img src={settingIconImg} alt="настройки" />
            </div>
          </a>
        </div>
      </nav>

      <div className={styles.glow}></div>

      <main id="chat" ref={chatRef}>
        {isLoadingMore && (
          <div className={styles.loadingMore}>
            Загрузка предыдущих сообщений...
          </div>
        )}

        {messages.length === 0 && !isHistoryLoading && (
          <div className={`${styles.message} ${styles.incoming}`}>
            Добрый день! Готов помочь вам. С чем хотите поработать сегодня? 😊
            <div className={styles.messageTime}>{formatTime(new Date())}</div>
          </div>
        )}
        
        {messages.map((message) => (
          <div key={message.id} className={`${styles.message} ${message.type === 'incoming' ? styles.incoming : styles.outgoing}`}>
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
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
          ></textarea>
        </div>
        <div className={styles.blockButtonSend} onClick={handleSendClick}>
          <img src={sendButtonImg} alt="Отправить" />
        </div>
      </div>
    </div>
  );
}

export default ChatPage;