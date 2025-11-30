import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from '../css/modules/ChatPage.module.css';
import Spinner from '../components/Spinner';
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

  // Получаем информацию об агенте из location.state или значения по умолчанию
  const agentInfo = location.state || { agent: 'sergey', agentName: 'СЕРГЕЙ' };
  const { agent, agentName } = agentInfo;

  const { user } = useAuth();
  const chatId = user?.telegramId || user?.id;

  const [messages, setMessages] = useState([]); // хранит сообщения в хронологическом порядке (old -> new)
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [inputValue, setInputValue] = useState('');

  // Форматирование времени
  const formatTime = useCallback((timestampOrDate) => {
    const d = typeof timestampOrDate === 'number' ? new Date(timestampOrDate) : new Date(timestampOrDate || Date.now());
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }, []);

  // Преобразование сообщения из API в удобный формат
  const transformMessage = useCallback((msg) => {
    return {
      id: msg._id || msg.id || `id-${Math.random().toString(36).slice(2,9)}`,
      text: msg.message || msg.text || '',
      autor: msg.autor || (msg.user ? 'human' : 'ai_agent'),
      time: formatTime(msg.create_at || msg.timestamp),
      timestamp: msg.timestamp ? Number(msg.timestamp) : (msg.create_at ? new Date(msg.create_at).getTime() : Date.now()),
    };
  }, [formatTime]);

  // Загрузка истории. Если timestamp передан — загружаем старее сообщений до этого timestamp (пагинация).
  const loadHistory = useCallback(async (timestamp = null) => {
    if (!chatId) {
      setIsHistoryLoading(false);
      return;
    }

    try {
      // Передаём timestamp если нужен (как в твоём оригинальном коде)
      const params = timestamp ? { timestamp: String(timestamp) } : {};
      const { data } = await apiClient.get('/api/chats/history', { params });

      if (Array.isArray(data?.messages)) {
        // Преобразуем все сообщения из ответа
        const transformed = data.messages.map(transformMessage);
        // Сортируем по времени (old -> new)
        transformed.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

        setMessages(prev => {
          if (!timestamp) {
            // Первая загрузка: оставляем ТОЛЬКО последние 10 сообщений
            const last10 = transformed.slice(-10);
            return last10;
          } else {
            // Подгрузка старых: добавляем старые сообщения в начало хронологического массива
            // Важно: data.messages — это блок старых сообщений (older than timestamp)
            const merged = [...transformed, ...prev];
            // убираем дубликаты по id
            const unique = merged.reduce((acc, m) => {
              if (!acc.find(x => x.id === m.id)) acc.push(m);
              return acc;
            }, []);
            // отсортируем хронологически
            unique.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
            return unique;
          }
        });

        // Сохраняем флаг наличия ещё старых сообщений (если сервер отдаёт hasMore)
        if (typeof data.hasMore === 'boolean') {
          setHasMoreMessages(data.hasMore);
        } else {
          // если нет поля hasMore — оставляем прежнее значение (безопасно)
        }
      }
    } catch (err) {
      console.error('Ошибка загрузки истории чата', err);
    } finally {
      setIsHistoryLoading(false);
      setIsLoadingMore(false);
    }
  }, [chatId, transformMessage]);

  // Инициализация — загрузить историю (последние 10) при открытии
  useEffect(() => {
    setIsHistoryLoading(true);
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId, agent]); // при смене чата/агента — перезагружаем

  // Обработчик скролла: подгружаем старые сообщения, когда пользователь прокручивает вверх.
  // Из-за применения CSS trick (см. ниже) scrollTop увеличивается при прокрутке вверх,
  // поэтому условие простое: когда scrollTop > threshold — грузим еще.
  useEffect(() => {
    const chat = chatRef.current;
    if (!chat) return;

    const onScroll = () => {
      if (isLoadingMore || !hasMoreMessages) return;

      // threshold можно подкорректировать, сейчас 120px
      if (chat.scrollTop > 120) {
        // oldest message timestamp — первый элемент массива (хронологический порядок: old -> new)
        const oldest = messages[0];
        if (oldest?.timestamp) {
          setIsLoadingMore(true);
          loadHistory(oldest.timestamp);
        }
      }
    };

    chat.addEventListener('scroll', onScroll);
    return () => chat.removeEventListener('scroll', onScroll);
  }, [messages, isLoadingMore, hasMoreMessages, loadHistory]);

  // Отправка сообщения
  const sendMessage = async () => {
    const text = inputValue.trim();
    if (!text) return;

    const tempMsg = {
      id: `temp-${Date.now()}`,
      text,
      autor: 'human',
      time: formatTime(Date.now()),
      timestamp: Date.now(),
    };

    // оптимистично добавляем в конец (новые — в конец массива)
    setMessages(prev => [...prev, tempMsg]);
    setInputValue('');
    setIsSending(true);

    try {
      const { data } = await apiClient.post('/api/chats/send', { message: text, agent });

      // Если сервер вернул объект с message — добавим ответ агента
      if (data?.message) {
        const bot = transformMessage(data);
        setMessages(prev => [...prev, bot]);
      } else if (data?.reply || data?.output) {
        const bot = {
          id: data?._id || data?.id || `ai-${Date.now()}`,
          text: data?.message || data?.reply || data?.output || '',
          autor: 'ai_agent',
          time: formatTime(data?.create_at || data?.timestamp || Date.now()),
          timestamp: data?.timestamp ? Number(data.timestamp) : Date.now(),
        };
        setMessages(prev => [...prev, bot]);
      }
    } catch (err) {
      console.error('Ошибка при отправке', err);
      // можно показывать ошибку в чате — оставил без изменений
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (isHistoryLoading) return <Spinner />;

  // Рендерим сообщения в ОТРИЦАТЕЛЬНОМ порядке (reverse),
  // потому что CSS использует column-reverse: это даёт начальное положение у «нижнего» сообщения
  const renderedMessages = messages.slice().reverse();

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

      {/* main chat container.
          ВАЖНО: styles.chatContainer должен устанавливать:
            display: flex;
            flex-direction: column-reverse;
            overflow-y: auto;
            height: <высота окна чата>;
          Это позволяет при загрузке пользователь находиться у последнего сообщения (без JS автоскролла).
      */}
      <main id="chat" ref={chatRef} className={styles.chatContainer}>
        {isLoadingMore && (
          <div className={styles.loadingMore}>Загрузка предыдущих сообщений...</div>
        )}

        {renderedMessages.length === 0 && (
          <div className={`${styles.message} ${styles.incoming}`}>
            Добрый день! Готов помочь вам. С чем хотите поработать сегодня? 😊
            <div className={styles.messageTime}>{formatTime(Date.now())}</div>
          </div>
        )}

        {renderedMessages.map((message) => (
          <div key={message.id} className={`${styles.message} ${message.autor === 'human' ? styles.outgoing : styles.incoming}`}>
            {message.text}
            <div className={styles.messageTime}>{message.time}</div>
          </div>
        ))}

        {isSending && (
          <div className={`${styles.message} ${styles.incoming}`}>
            <div className={styles.typingIndicator}>
              <span className={styles.dots}><span></span><span></span><span></span></span> печатает
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
            onKeyPress={handleKeyPress}
            disabled={isSending}
          ></textarea>
        </div>
        <div className={styles.blockButtonSend} onClick={(e) => { e.preventDefault(); sendMessage(); }}>
          <img src={sendButtonImg} alt="Отправить" />
        </div>
      </div>
    </div>
  );
}

export default ChatPage;
