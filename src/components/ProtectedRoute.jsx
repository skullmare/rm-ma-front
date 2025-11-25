import React from 'react';
import Spinner from './Spinner';
import { useAuth } from '../context/AuthContext.jsx';

const messageStyle = {
  minHeight: '100vh',
  background: '#121212',
  color: '#fff',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '32px',
  textAlign: 'center',
};

function ProtectedRoute({ children }) {
  const { status, error } = useAuth();

  if (status === 'booting' || status === 'loading') {
    return <Spinner />;
  }

  if (status !== 'authenticated') {
    return (
      <div style={messageStyle}>
        <p>Не удалось подтвердить пользователя в Telegram WebApp.</p>
        <p>{error || 'Попробуйте открыть мини-апп заново.'}</p>
      </div>
    );
  }

  return children;
}

export default ProtectedRoute;


