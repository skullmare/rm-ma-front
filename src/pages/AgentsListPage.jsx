import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../css/modules/AgentsListPage.module.css';
import Spinner from '../components/Spinner';
import PageNavbar from '../components/PageNavbar';
import { usePageLoader } from '../hooks/usePageLoader';
import { useAuth } from '../context/AuthContext.jsx';
import { AGENTS_LIST } from '../constants/agents';
import { IMAGES } from '../constants/images';
import apiClient from '../lib/apiClient';

function AgentsListPage() {
  const navigate = useNavigate();
  const isLoading = usePageLoader(500);
  const { user } = useAuth();
  const [tariffLabel, setTariffLabel] = useState('Базовый');

  // Загрузка профиля для определения тарифа (только для авторизованных пользователей)
  useEffect(() => {
    // Проверяем, авторизован ли пользователь
    if (!user) {
      // Если не авторизован, оставляем "Базовый" и не делаем запрос
      return;
    }

    const fetchProfile = async () => {
      try {
        const { data } = await apiClient.get('/api/profile');
        console.log('Profile data:', data); // Отладочный лог

        if (data?.profile) {
          const profile = data.profile;

          // Проверяем различные поля, где может быть информация о тарифе
          const tariffInfo = (
            profile.subscription_type ||
            profile.plan ||
            profile.tariff ||
            profile.role ||
            profile.roles?.[0] ||
            ''
          ).toLowerCase();

          console.log('Tariff info:', tariffInfo); // Отладочный лог

          // Определяем тариф
          if (tariffInfo.includes('premium') ||
              tariffInfo.includes('премиум') ||
              tariffInfo.includes('про') ||
              tariffInfo.includes('paid')) {
            setTariffLabel('Премиум');
          } else {
            setTariffLabel('Базовый');
          }
        }
      } catch (err) {
        // В случае ошибки оставляем дефолтный тариф
        console.error('Не удалось загрузить профиль:', err);
      }
    };

    fetchProfile();
  }, [user]);

  const handleAgentClick = (e, agentRoute) => {
    e.preventDefault();
    navigate(agentRoute);
  };

  if (isLoading) {
    return <Spinner />;
  }

  return (
    <div className={`${styles.body} ${styles.agentsListPage}`}>
      <PageNavbar leftIcon="logo" tariffLabel={tariffLabel} />

      <div className={styles.glow}></div>

      <div className={styles.contentBlock}>
        <h2 className={styles.headingSection}>ВЫБЕРИ ПАРТНЕРА</h2>
      </div>

      {/* Динамический список агентов */}
      {AGENTS_LIST.map((agent) => (
        <div key={agent.id} className={styles.contentBlock}>
          <a href="#" className={styles.agentLink} onClick={(e) => handleAgentClick(e, agent.route)}>
            <div className="d-flex align-items-center justify-content-between gap-3">
              <div className="d-flex gap-1">
                <div className={styles.agentAvatar}>
                  <img className={styles.agentInfoIcon} src={IMAGES.INFO_ICON} alt="Информация" />
                  <img className={styles.agentImage} src={agent.image} alt={agent.name} />
                </div>
                <div className={styles.agentContent}>
                  <span className={styles.agentName}>{agent.name}</span>
                  <span className={styles.agentRole}>
                    {agent.roleWithBreaks.split('\n').map((line, index, array) => (
                      <React.Fragment key={index}>
                        {line}
                        {index < array.length - 1 && <br />}
                      </React.Fragment>
                    ))}
                  </span>
                </div>
              </div>
              <div className={styles.agentArrow}>
                <img src={IMAGES.ARROW_FORWARD} alt="Перейти" />
              </div>
            </div>
          </a>
        </div>
      ))}
    </div>
  );
}

export default AgentsListPage;

