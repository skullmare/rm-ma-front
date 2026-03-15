import React, { useState, useEffect, useMemo } from 'react';
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
const SKELETON_COUNT = 4;

function AgentsListPage() {
  const navigate = useNavigate();
  const isLoading = usePageLoader(500);
  const { user } = useAuth();
  const [tariffLabel, setTariffLabel] = useState('Базовый');
  const [allowedAgents, setAllowedAgents] = useState(null);
  const [profileLoaded, setProfileLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      try {
        const { data } = await apiClient.get('/api/profile');
        if (data?.profile) {
          const profile = data.profile;

          // --- Тариф ---
          const resolveLastPaymentTimestamp = () => {
            const ts = profile.last_payment_timestamp ?? profile.lastPaymentTimestamp;
            if (ts !== undefined && ts !== null) {
              const tsNumber = Number(ts);
              if (!Number.isNaN(tsNumber)) return tsNumber;
            }
            const iso = profile.last_payment_datetime ?? profile.lastPaymentDatetime;
            if (iso) {
              const parsed = Date.parse(iso);
              if (!Number.isNaN(parsed)) return parsed;
            }
            return null;
          };

          const lastPaymentTimestamp = resolveLastPaymentTimestamp();
          const hasActiveSubscription =
            typeof lastPaymentTimestamp === 'number' &&
            Date.now() - lastPaymentTimestamp < THIRTY_DAYS_MS;

          setTariffLabel(hasActiveSubscription ? 'Премиум' : 'Базовый');

          // --- Список агентов ---
          const agents =
            Array.isArray(profile.agents) && profile.agents.length > 0
              ? profile.agents
              : null;

          setAllowedAgents(agents);
        }
      } catch (err) {
        console.error('Не удалось загрузить профиль:', err);
        setAllowedAgents(null);
      } finally {
        setProfileLoaded(true);
      }
    };

    fetchProfile();
  }, [user]);

  // --- ЛОГИКА ФИЛЬТРАЦИИ АГЕНТОВ ---
  const displayedAgents = useMemo(() => {
    if (!profileLoaded) return [];

    if (allowedAgents === null) return AGENTS_LIST;

    return AGENTS_LIST.filter((agent) =>
      allowedAgents.some(
        (name) =>
          agent.id === name ||
          agent.route.toLowerCase().includes(name.toLowerCase())
      )
    );
  }, [allowedAgents, profileLoaded]);
  // --------------------------------

  const handleAgentClick = (e, agentRoute) => {
    e.preventDefault();
    navigate(agentRoute);
  };

const renderSkeletons = () =>
  Array.from({ length: SKELETON_COUNT }).map((_, index) => (
    <div
      key={`skeleton-${index}`}
      className={`${styles.contentBlock} ${
        index < SKELETON_COUNT - 1 ? styles.contentBlockBorderBottom : ''
      }`}
    >
      <div className="d-flex align-items-center justify-content-between gap-3">
        <div className="d-flex gap-2 align-items-center">
          {/* Враппер отдельный, чтобы не конфликтовать с .agentAvatar */}
          <div className={styles.skeletonAvatarWrapper}>
            <div className={`${styles.skeletonBlock} ${styles.skeletonAvatarInner}`} />
          </div>
          <div className={styles.agentContent}>
            <div className={`${styles.skeletonBlock} ${styles.skeletonName}`} />
            <div className={`${styles.skeletonBlock} ${styles.skeletonRole}`} />
            <div className={`${styles.skeletonBlock} ${styles.skeletonRole2}`} />
          </div>
        </div>
        <div className={`${styles.skeletonBlock} ${styles.skeletonArrow}`} />
      </div>
    </div>
  ));

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

      {!profileLoaded
        ? renderSkeletons()
        : displayedAgents.map((agent, index) => (
          <div
            key={agent.id}
            className={`${styles.contentBlock} ${index < displayedAgents.length - 1 ? styles.contentBlockBorderBottom : ''
              }`}
          >
            <a
              href="#"
              className={styles.agentLink}
              onClick={(e) => handleAgentClick(e, agent.route)}
            >
              <div className="d-flex align-items-center justify-content-between gap-3">
                <div className="d-flex gap-2">
                  <div className={styles.agentAvatar}>
                    <img className={styles.agentImage} src={agent.image} alt={agent.name} />
                  </div>
                  <div className={styles.agentContent}>
                    <span className={styles.agentName}>{agent.name}</span>
                    <span className={styles.agentRole}>
                      {agent.roleWithBreaks.split('\n').map((line, i, array) => (
                        <React.Fragment key={i}>
                          {line}
                          {i < array.length - 1 && <br />}
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