import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../css/modules/AgentMarkPage.module.css';
import Spinner from '../components/Spinner';
import { usePageLoader } from '../hooks/usePageLoader';
const backArrowImg = '/img/Rectangle 42215.svg';
const settingIconImg = '/img/setting_icon.svg';
const markImg = '/img/Mark.png';

function AgentMarkPage() {
  const navigate = useNavigate();
  const isLoading = usePageLoader(500);

  const handleBackClick = (e) => {
    e.preventDefault();
    navigate('/agents_list');
  };

  const handleProfileClick = (e) => {
    e.preventDefault();
    navigate('/profile');
  };

  const handleStartClick = () => {
    navigate('/chat', { state: { agent: 'mark', agentName: 'МАРК' } });
  };

  if (isLoading) {
    return <Spinner />;
  }

  return (
    <div className={`${styles.body} ${styles.agentMarkPage}`}>
      <nav className={styles.navbar}>
        <div className="container-fluid d-flex justify-content-between px-0">
          <a className={styles.prev} href="#" onClick={handleBackClick}>
            <img src={backArrowImg} alt="назад" />
          </a>
          <a className={styles.navbarAccount} href="#" onClick={handleProfileClick}>
            <div className={styles.accountIcon}>
              <img src={settingIconImg} alt="settings" />
            </div>
          </a>
        </div>
      </nav>

      <div className={styles.glow}></div>

      <main>
        <div className={styles.contentBlock}>
          <div className={styles.agentContentWrapper}>
            <img src={markImg} alt="Марк" className={styles.agentImg} />
            <div className={styles.agentTextContent}>
              <span className={styles.agentLabel}>МАРК</span>
              <span className={styles.agentTitle}>АРХИТЕКТОР<br />БИЗНЕС-МОДЕЛЕЙ</span>
            </div>
          </div>
        </div>

        <div className={`${styles.contentBlock} ${styles.contentBlockLast}`}>
          <p className={styles.descriptionText}>
            Формулирует идеи платформенного <br />развития, помогает определить<br /> роли участников,
            сценарии<br />монетизации и взаимодействия.
            <br /><br />Создаёт архитектуру экосистемы <br />продукта, объединяя ценность,<br /> технологию и стратегию
            в единую<br />модель бизнеса.
          </p>
        </div>
      </main>

      <div className={styles.buttonBlock}>
        <button id="button-go" onClick={handleStartClick}>НАЧАТЬ</button>
      </div>
    </div>
  );
}

export default AgentMarkPage;

