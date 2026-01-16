import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../css/modules/AgentsListPage.module.css';
import Spinner from '../components/Spinner';
import { usePageLoader } from '../hooks/usePageLoader';
const logoImg = '/img/Logo container.svg';
const settingIconImg = '/img/person.svg';
const infoIconImg = '/img/Info icon.svg';
const sergyImg = '/img/Sergy.png';
const nickImg = '/img/Nick.png';
const lidaImg = '/img/Lida.png';
const markImg = '/img/Mark.png';
const arrowImg = '/img/Rectangle 42213.svg';

function AgentsListPage() {
  const navigate = useNavigate();
  const isLoading = usePageLoader(500);

  const handleLogoClick = (e) => {
    e.preventDefault();
    navigate('/');
  };

  const handleProfileClick = (e) => {
    e.preventDefault();
    navigate('/profile');
  };

  const handleAgentClick = (e, agentPath) => {
    e.preventDefault();
    navigate(agentPath);
  };

  if (isLoading) {
    return <Spinner />;
  }

  return (
    <div className={`${styles.body} ${styles.agentsListPage}`}>
      <nav className={styles.navbar}>
        <div className="container-fluid d-flex justify-content-between px-0">
          <a className={styles.navbarBrand} href="#" onClick={handleLogoClick}>
            <img src={logoImg} alt="Логотип" />
          </a>
          <a className={styles.navbarAccount} href="#" onClick={handleProfileClick}>
            <div className={styles.accountIcon}>
              <img src={settingIconImg} alt="Настройки" />
            </div>
          </a>
        </div>
      </nav>

      <div className={styles.glow}></div>

      <div className={styles.contentBlock}>
        <h2 className={styles.headingSection}>ВЫБЕРИ ПАРТНЕРА</h2>
      </div>

      {/* Сергей */}
      <div className={styles.contentBlock}>
        <a href="#" className={styles.agentLink} onClick={(e) => handleAgentClick(e, '/agent_sergy')}>
          <div className="d-flex align-items-center justify-content-between gap-3">
            <div className="d-flex gap-1">
              <div className={styles.agentAvatar}>
                <img className={styles.agentInfoIcon} src={infoIconImg} alt="Информация" />
                <img className={styles.agentImage} src={sergyImg} alt="Сергей" />
              </div>
              <div className={styles.agentContent}>
                <span className={styles.agentName}>СЕРГЕЙ</span>
                <span className={styles.agentRole}>АНАЛИТИК ВНЕШНЕГО<br />КОНТЕКСТА</span>
              </div>
            </div>
            <div className={styles.agentArrow}>
              <img src={arrowImg} alt="Перейти" />
            </div>
          </div>
        </a>
      </div>

      {/* Ник */}
      <div className={styles.contentBlock}>
        <a href="#" className={styles.agentLink} onClick={(e) => handleAgentClick(e, '/agent_nick')}>
          <div className="d-flex align-items-center justify-content-between gap-3">
            <div className="d-flex gap-1">
              <div className={styles.agentAvatar}>
                <img className={styles.agentInfoIcon} src={infoIconImg} alt="Информация" />
                <img className={styles.agentImage} src={nickImg} alt="Ник" />
              </div>
              <div className={styles.agentContent}>
                <span className={styles.agentName}>НИК</span>
                <span className={styles.agentRole}>ТЕХНОЛОГИЧЕСКИЙ<br />ПОДРЫВНИК</span>
              </div>
            </div>
            <div className={styles.agentArrow}>
              <img src={arrowImg} alt="Перейти" />
            </div>
          </div>
        </a>
      </div>

      {/* Лида */}
      <div className={styles.contentBlock}>
        <a href="#" className={styles.agentLink} onClick={(e) => handleAgentClick(e, '/agent_lida')}>
          <div className="d-flex align-items-center justify-content-between gap-3">
            <div className="d-flex gap-1">
              <div className={styles.agentAvatar}>
                <img className={styles.agentInfoIcon} src={infoIconImg} alt="Информация" />
                <img className={styles.agentImage} src={lidaImg} alt="Лида" />
              </div>
              <div className={styles.agentContent}>
                <span className={styles.agentName}>ЛИДА</span>
                <span className={styles.agentRole}>ТЕСТИРОВЩИК<br />ГИПОТЕЗ</span>
              </div>
            </div>
            <div className={styles.agentArrow}>
              <img src={arrowImg} alt="Перейти" />
            </div>
          </div>
        </a>
      </div>

      {/* Марк */}
      <div className={styles.contentBlock}>
        <a href="#" className={styles.agentLink} onClick={(e) => handleAgentClick(e, '/agent_mark')}>
          <div className="d-flex align-items-center justify-content-between gap-3">
            <div className="d-flex gap-1">
              <div className={styles.agentAvatar}>
                <img className={styles.agentInfoIcon} src={infoIconImg} alt="Информация" />
                <img className={styles.agentImage} src={markImg} alt="Марк" />
              </div>
              <div className={styles.agentContent}>
                <span className={styles.agentName}>МАРК</span>
                <span className={styles.agentRole}>АРХИТЕКТОР<br />БИЗНЕС-МОДЕЛЕЙ</span>
              </div>
            </div>
            <div className={styles.agentArrow}>
              <img src={arrowImg} alt="Перейти" />
            </div>
          </div>
        </a>
      </div>
    </div>
  );
}

export default AgentsListPage;

