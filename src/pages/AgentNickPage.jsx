import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../css/modules/AgentNickPage.module.css';
import Spinner from '../components/Spinner';
import { usePageLoader } from '../hooks/usePageLoader';
const backArrowImg = '/img/Rectangle 42215.svg';
const settingIconImg = '/img/person.svg';
const nickImg = '/img/Nick.png';

function AgentNickPage() {
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
    navigate('/chat', { state: { agent: 'nick', agentName: 'НИК' } });
  };

  if (isLoading) {
    return <Spinner />;
  }

  return (
    <div className={`${styles.body} ${styles.agentNickPage}`}>
      <nav className={styles.navbar}>
        <div className="container-fluid d-flex justify-content-between px-0">
          <a className={styles.prev} href="#" onClick={handleBackClick}>
            <img src={backArrowImg} alt="назад" />
          </a>
          <a className={styles.navbarAccount} href="#" onClick={handleProfileClick}>
            <div className={styles.accountIcon}>
              <img src={settingIconImg} alt="настройки" />
            </div>
          </a>
        </div>
      </nav>

      <div className={styles.glow}></div>

      <main>
        <div className={styles.contentBlock}>
          <div className={styles.agentContentWrapper}>
            <img src={nickImg} className={styles.agentPhoto} alt="Ник" />
            <div className={styles.agentTextContent}>
              <span className={styles.agentName}>НИК</span>
              <span className={styles.agentRole}>ТЕХНОЛОГИЧЕСКИЙ<br />ПОДРЫВНИК</span>
            </div>
          </div>
        </div>

        <div className={`${styles.contentBlock} ${styles.contentBlockLast}`}>
          <p className={styles.agentDescription}>
            Отвечает за поиск нестандартных <br />и подрывных идей, способных<br /> изменить бизнес-модель<br />
            или открыть новые направления<br /> роста.
            <br /><br />
            Анализирует отрасль, выявляет<br /> неожиданные инсайты и помогает <br />выстроить вторую траекторию
            <br />развития компании.
          </p>
        </div>
      </main>

      <div className={styles.buttonBlock}>
        <button id="button-go" onClick={handleStartClick}>НАЧАТЬ</button>
      </div>
    </div>
  );
}

export default AgentNickPage;

