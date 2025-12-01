import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../css/modules/TariffPage.module.css';
import Spinner from '../components/Spinner';
import { usePageLoader } from '../hooks/usePageLoader';
import apiClient from '../lib/apiClient';
import { useAuth } from '../context/AuthContext.jsx';

const backArrowImg = '/img/Rectangle 42215.svg';
const settingIconImg = '/img/setting_icon.svg';

function TariffPage() {
  const navigate = useNavigate();
  const isLoadingPage = usePageLoader(300);
  const { user } = useAuth();

  const [profile, setProfile] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [error, setError] = useState('');

  const chatId =
    profile?.chat_id ||
    user?.telegramId ||
    user?.id ||
    null;

  // ---- 1. Загружаем профиль (тариф пользователя) ----
  useEffect(() => {
    let mounted = true;

    const fetchProfile = async () => {
      try {
        const { data } = await apiClient.get('/api/profile');
        if (mounted && data?.profile) {
          setProfile(data.profile);
        }
      } catch (err) {
        if (mounted) {
          setError('Ошибка загрузки профиля');
        }
      } finally {
        if (mounted) setIsLoadingProfile(false);
      }
    };

    fetchProfile();
    return () => (mounted = false);
  }, []);

  const handleBackClick = (e) => {
    e.preventDefault();
    navigate('/profile');
  };

  const handleProfileClick = (e) => {
    e.preventDefault();
    navigate('/profile');
  };

  // ---- 2. Обработка нажатия “НАЧАТЬ” ----
  const handleSubscribe = async () => {
    try {
      if (!chatId) {
        alert('Ошибка: chat_id отсутствует');
        return;
      }

      const { data } = await apiClient.post(
        '/api/payments/create-payment',
        { chat_id: String(chatId) }
      );

      const redirectUrl = data?.confirmation?.confirmation_url;
      if (!redirectUrl) {
        alert('Не удалось получить ссылку на оплату');
        return;
      }

      window.location.href = redirectUrl;
    } catch (err) {
      console.error('Payment error:', err);
      alert('Ошибка при создании платежа');
    }
  };

  const tariff = profile?.tariff || 'free';

  if (isLoadingPage || isLoadingProfile) return <Spinner />;

  return (
    <div className={`${styles.body} ${styles.tariffPage}`}>
      <nav className={styles.navbar} aria-label="Основная навигация">
        <div className="container-fluid d-flex justify-content-between px-0">
          <a className={styles.prev} href="#" onClick={handleBackClick} aria-label="Вернуться назад">
            <img src={backArrowImg} alt="Стрелка назад" />
          </a>
          <a className={styles.navbarAccount} href="#" onClick={handleProfileClick} aria-label="Настройки аккаунта">
            <div className={styles.accountIcon}>
              <img src={settingIconImg} alt="Иконка настроек" />
            </div>
          </a>
        </div>
      </nav>

      <div className={styles.glow} aria-hidden="true"></div>

      <section className={styles.contentBlock}>
        <h2 className={styles.tariffTitle}>ТАРИФЫ</h2>
        <p className={styles.tariffSubtitle}>Выберите подходящий тарифный план</p>
      </section>

      {/* FREE TIER */}
      <section className={`${styles.contentBlock} d-flex flex-column`}>
        <div className={`${styles.tariffType} ${styles.tariffTypeFree}`}>
          БЕСПЛАТНЫЙ
        </div>
        <h3 className={styles.tariffTitle}>0 ₽/месяц</h3>

        <div className={styles.featuresList}>
          <div className={styles.elementList}>- 10 бесплатных сообщений</div>
          <div className={styles.elementList}>- Базовые функции бота Лида</div>
          <div className={styles.elementList}>- Стандартное время ответа</div>
        </div>
      </section>

      <div className={`${styles.contentBlock} d-flex align-items-center`}>
        <div className={styles.buttonBlock}>
          {tariff === 'free' ? (
            <button className={styles.buttonActive} disabled>АКТИВИРОВАН</button>
          ) : (
            <button className={styles.buttonActive} disabled>НЕ ДОСТУПНО</button>
          )}
        </div>
      </div>

      {/* PREMIUM */}
      <section className={`${styles.contentBlock} d-flex flex-column`}>
        <div className={`${styles.tariffType} ${styles.tariffTypePremium}`}>
          ПРЕМИУМ
        </div>
        <h3 className={styles.tariffTitle}>1000 ₽/месяц</h3>

        <div className={styles.featuresList}>
          <div className={styles.elementList}>- Неограниченные сообщения</div>
          <div className={styles.elementList}>- Приоритетная поддержка</div>
          <div className={styles.elementList}>- Быстрое время ответа</div>
          <div className={styles.elementList}>- Расширенные функции бота</div>
          <div className={styles.elementList}>- Персонализированные ответы</div>
        </div>
      </section>

      <div className={`${styles.contentBlock} d-flex align-items-center ${styles.contentBlockLast}`}>
        <div className={styles.buttonBlock}>
          {tariff === 'premium' ? (
            <button className={styles.buttonActive} disabled aria-pressed="true">
              АКТИВИРОВАН
            </button>
          ) : (
            <button
              className={styles.buttonSubscribe}
              onClick={handleSubscribe}
            >
              НАЧАТЬ
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className={styles.contentBlock}>
          <p style={{ color: '#f66' }}>{error}</p>
        </div>
      )}
    </div>
  );
}

export default TariffPage;
