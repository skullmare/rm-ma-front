import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../css/modules/TariffPage.module.css';
import Spinner from '../components/Spinner';
import { usePageLoader } from '../hooks/usePageLoader';
import apiClient from '../lib/apiClient';

const backArrowImg = '/img/Rectangle 42215.svg';
const settingIconImg = '/img/setting_icon.svg';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function TariffPage() {
  const navigate = useNavigate();
  const isLoadingPage = usePageLoader(300);

  const [profile, setProfile] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [error, setError] = useState('');
  const [isUnsubscribeModalOpen, setIsUnsubscribeModalOpen] = useState(false);
  const [isUnsubscribing, setIsUnsubscribing] = useState(false);
  const [unsubscribeError, setUnsubscribeError] = useState('');

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
      const { data } = await apiClient.post(
        '/api/payments/create-payment'
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

  const handleOpenUnsubscribeModal = (e) => {
    e.preventDefault();
    setUnsubscribeError('');
    setIsUnsubscribeModalOpen(true);
  };

  const handleCloseUnsubscribeModal = () => {
    if (isUnsubscribing) return;
    setIsUnsubscribeModalOpen(false);
    setUnsubscribeError('');
  };

  const handleConfirmUnsubscribe = async () => {
    setIsUnsubscribing(true);
    setUnsubscribeError('');
    try {
      await apiClient.post('/api/payments/unsubscribe');
      window.location.reload();
    } catch (err) {
      console.error('Unsubscribe error:', err);
      setUnsubscribeError(
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Не удалось отменить подписку'
      );
    } finally {
      setIsUnsubscribing(false);
    }
  };

  const resolveLastPaymentTimestamp = () => {
    if (!profile) return null;

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
  const paymentMethodId =
    profile?.payment_method_id || profile?.paymentMethodId || null;
  const hasPaymentMethod = Boolean(
    typeof paymentMethodId === 'string'
      ? paymentMethodId.trim()
      : paymentMethodId
  );
  const subscriptionEndTimestamp =
    typeof lastPaymentTimestamp === 'number'
      ? lastPaymentTimestamp + THIRTY_DAYS_MS
      : null;
  const subscriptionEndDateText = subscriptionEndTimestamp
    ? new Date(subscriptionEndTimestamp).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
    : null;
  const shouldShowUnsubscribeButton =
    hasActiveSubscription && hasPaymentMethod;

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
          {hasActiveSubscription ? (
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

      <div className={`${styles.contentBlock} d-flex flex-column align-items-center`}>
        <div className={styles.buttonBlock}>
          {hasActiveSubscription ? (
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
        <div>
          {shouldShowUnsubscribeButton ? (
            <div className={styles.unsubscribeButtonWrapper}>
              <button
                type="button"
                className={styles.unsubscribeButton}
                onClick={handleOpenUnsubscribeModal}
              >
                Отменить подписку
              </button>
            </div>
          ) : (
            <p className={styles.autorenewInfo}>
              автопродление отключено, подписка действует до{' '}
              {subscriptionEndDateText || '—'}
            </p>
          )}
        </div>
      </div>



      {error && (
        <div className={styles.contentBlock}>
          <p style={{ color: '#f66' }}>{error}</p>
        </div>
      )}

      {isUnsubscribeModalOpen && (
        <div
          className={styles.modalOverlay}
          role="dialog"
          aria-modal="true"
          onClick={handleCloseUnsubscribeModal}
        >
          <div
            className={styles.modalContent}
            onClick={(event) => event.stopPropagation()}
          >
            <p className={styles.modalTitle}>Вы точно хотите отменить подписку?</p>
            {unsubscribeError && (
              <p className={styles.modalError}>{unsubscribeError}</p>
            )}
            <div className={styles.modalActions}>
              <button
                type="button"
                className={`${styles.modalButton} ${styles.modalButtonConfirm}`}
                onClick={handleConfirmUnsubscribe}
                disabled={isUnsubscribing}
              >
                {isUnsubscribing ? 'Отменяем...' : 'Да'}
              </button>
              <button
                type="button"
                className={`${styles.modalButton} ${styles.modalButtonCancel}`}
                onClick={handleCloseUnsubscribeModal}
                disabled={isUnsubscribing}
              >
                Нет
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TariffPage;
