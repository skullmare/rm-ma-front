import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from '../css/modules/AgentDetailPage.module.css';
import Spinner from '../components/Spinner';
import PageNavbar from '../components/PageNavbar';
import { usePageLoader } from '../hooks/usePageLoader';
import { getAgentById } from '../constants/agents';
import { ROUTES } from '../constants/routes';

/**
 * Универсальная страница для отображения деталей агента
 * Заменяет 4 отдельных компонента: AgentSergyPage, AgentNickPage, AgentLidaPage, AgentMarkPage
 */
function AgentDetailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const isLoading = usePageLoader(500);

  // Извлекаем agentId из пути URL (например, /agent_sergy -> sergey)
  const pathToAgentId = {
    '/agent_sergy': 'sergey',
    '/agent_nick': 'nick',
    '/agent_lida': 'lida',
    '/agent_mark': 'mark',
  };

  const agentId = pathToAgentId[location.pathname];
  const agent = getAgentById(agentId);

  const handleStartClick = () => {
    if (agent) {
      navigate(ROUTES.CHAT, {
        state: {
          agent: agent.chatAgent,
          agentName: agent.name
        }
      });
    }
  };

  if (isLoading) {
    return <Spinner />;
  }

  // Если агент не найден, показываем 404
  if (!agent) {
    return (
      <div className={styles.body}>
        <div className={styles.error}>
          <h2>Агент не найден</h2>
          <button onClick={() => navigate(ROUTES.AGENTS_LIST)}>
            Вернуться к списку агентов
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.body} ${styles.agentDetailPage}`}>
      <PageNavbar leftIcon="back" />

      <div className={styles.glow}></div>

      <main>
        <div className={styles.contentBlock}>
          <div className={styles.agentContentWrapper}>
            <img src={agent.image} alt={agent.name} className={styles.agentImg} />
            <div className={styles.agentTextContent}>
              <span className={styles.agentLabel}>{agent.name}</span>
              <span className={styles.agentTitle}>
                {agent.roleWithBreaks.split('\n').map((line, index, array) => (
                  <React.Fragment key={index}>
                    {line}
                    {index < array.length - 1 && <br />}
                  </React.Fragment>
                ))}
              </span>
            </div>
          </div>
        </div>

        <div className={`${styles.contentBlock} ${styles.contentBlockLast}`}>
          <p className={styles.descriptionText}>
            {agent.description.split('\n').map((line, index, array) => (
              <React.Fragment key={index}>
                {line}
                {index < array.length - 1 && <br />}
              </React.Fragment>
            ))}
          </p>
        </div>
      </main>

      <div className={styles.buttonBlock}>
        <button id="button-go" onClick={handleStartClick}>НАЧАТЬ</button>
      </div>
    </div>
  );
}

export default AgentDetailPage;
