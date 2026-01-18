import React from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import Spinner from './Spinner';

/**
 * Компонент-охранник, который проверяет авторизацию
 * Показывает ошибку, если пользователь не из Telegram
 */
function AuthGuard({ children }) {
  const { status, error } = useAuth();

  // Загрузка при старте приложения
  if (status === 'booting' || status === 'loading') {
    return <Spinner />;
  }

  // Ошибка авторизации или пользователь не из Telegram
  if (status === 'unauthorized' || status === 'error') {
    return (
      <div style={styles.container}>
        <div style={styles.content}>
          <div style={styles.icon}>⚠️</div>
          <h1 style={styles.title}>Доступ ограничен</h1>
          <p style={styles.message}>
            {error || 'Это приложение доступно только через Telegram'}
          </p>
          <div style={styles.instructions}>
            <p style={styles.instructionText}>Чтобы использовать это приложение:</p>
            <ol style={styles.list}>
              <li>Откройте Telegram</li>
              <li>Найдите бота</li>
              <li>Запустите мини-приложение</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  // Пользователь авторизован - показываем контент
  return children;
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    background: '#121212',
    padding: '20px',
  },
  content: {
    maxWidth: '500px',
    width: '100%',
    textAlign: 'center',
    color: '#E0E0E0',
  },
  icon: {
    fontSize: '64px',
    marginBottom: '20px',
  },
  title: {
    fontSize: '24px',
    fontWeight: '600',
    marginBottom: '12px',
    color: '#E0E0E0',
  },
  message: {
    fontSize: '16px',
    color: '#A9A9A9',
    marginBottom: '30px',
    lineHeight: '1.5',
  },
  instructions: {
    background: '#1E1E1E',
    border: '1px solid #3E3E3E',
    borderRadius: '8px',
    padding: '20px',
    textAlign: 'left',
  },
  instructionText: {
    fontSize: '14px',
    color: '#E0E0E0',
    marginBottom: '12px',
    fontWeight: '500',
  },
  list: {
    fontSize: '14px',
    color: '#A9A9A9',
    paddingLeft: '20px',
    margin: 0,
  },
};

export default AuthGuard;
