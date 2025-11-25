import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../css/modules/TariffPage.module.css';
import Spinner from '../components/Spinner';
import { usePageLoader } from '../hooks/usePageLoader';
const backArrowImg = '/img/Rectangle 42215.svg';
const settingIconImg = '/img/setting_icon.svg';

function TariffPage() {
  const navigate = useNavigate();
  const isLoading = usePageLoader(500);

  const handleBackClick = (e) => {
    e.preventDefault();
    navigate('/profile');
  };

  const handleProfileClick = (e) => {
    e.preventDefault();
    navigate('/profile');
  };

  if (isLoading) {
    return <Spinner />;
  }

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

      <section className={styles.contentBlock} aria-labelledby="tariffs-heading">
        <h2 id="tariffs-heading" className={styles.tariffTitle}>ТАРИФЫ</h2>
        <p className={styles.tariffSubtitle}>Выберите подходящий тарифный план</p>
      </section>

      <section className={`${styles.contentBlock} d-flex flex-column`} aria-labelledby="free-tariff-heading">
        <div className={`${styles.tariffType} ${styles.tariffTypeFree}`} id="free-tariff-heading">
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
          <button id="button-active" className={styles.buttonActive} aria-pressed="true">
            АКТИВИРОВАН
          </button>
        </div>
      </div>

      <section className={`${styles.contentBlock} d-flex flex-column`} aria-labelledby="premium-tariff-heading">
        <div className={`${styles.tariffType} ${styles.tariffTypePremium}`} id="premium-tariff-heading">
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
          <button id="button-subscribe" className={styles.buttonSubscribe}>
            НАЧАТЬ
          </button>
        </div>
      </div>
    </div>
  );
}

export default TariffPage;

