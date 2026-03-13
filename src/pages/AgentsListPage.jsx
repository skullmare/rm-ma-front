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

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

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

        if (data?.profile) {
          const profile = data.profile;

          // Логика определения тарифа (идентична TariffPage.jsx и ProfilePage.jsx)
          const resolveLastPaymentTimestamp = () => {
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

          setTariffLabel(hasActiveSubscription ? 'Премиум' : 'Базовый');
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
        <h2 className={styles.headingSection}>ВЫБЕРИ АГЕНТА</h2>
      </div>

      {/* Динамический список агентов */}
      {AGENTS_LIST.map((agent, index) => (
        <div
          key={agent.id}
          className={`${styles.contentBlock} ${index < AGENTS_LIST.length - 1 ? styles.contentBlockBorderBottom : ''}`}
        >
          <a href="#" className={styles.agentLink} onClick={(e) => handleAgentClick(e, agent.route)}>
            <div className="d-flex align-items-center justify-content-between gap-3">
              <div className="d-flex gap-2">
                <div className={styles.agentAvatar}>
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

