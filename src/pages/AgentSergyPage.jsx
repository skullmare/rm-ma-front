import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../css/modules/AgentSergyPage.module.css';
import Spinner from '../components/Spinner';
import { usePageLoader } from '../hooks/usePageLoader';
const backArrowImg = '/img/Rectangle 42215.svg';
const settingIconImg = '/img/setting_icon.svg';
const sergyImg = '/img/Sergy.png';

function AgentSergyPage() {
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
    navigate('/chat', { state: { agent: 'sergey', agentName: 'СЕРГЕЙ' } });
  };

  if (isLoading) {
    return <Spinner />;
  }

  return (
    <div className={`${styles.body} ${styles.agentSergyPage}`}>
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
          <div className={styles.profileInfo}>
            <img src={sergyImg} alt="Сергей" className={styles.profilePhoto} />
            <div className={styles.profileText}>
              <span className={styles.profileName}>СЕРГЕЙ</span>
              <span className={styles.profileRole}>АНАЛИТИК ВНЕШНЕГО <br />КОНТЕКСТА</span>
            </div>
          </div>
        </div>

        <div className={`${styles.contentBlock} ${styles.contentBlockLast}`}>
          <p className={styles.profileDescription}>
            Исследует и описывает среду,<br /> в которой работает бизнес:<br /> технологии, рынок, конкурентов<br />
            и макроэкономику.<br /><br />
            Быстро формирует картину <br />«внешнего поля», выделяет тренды, <br />риски и возможности, влияющие<br />
            на стратегию компании.
          </p>
        </div>
      </main>

      <div className={styles.buttonBlock}>
        <button id="button-go" onClick={handleStartClick}>НАЧАТЬ</button>
      </div>
    </div>
  );
}

export default AgentSergyPage;

