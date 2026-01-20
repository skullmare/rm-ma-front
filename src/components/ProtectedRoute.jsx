import React, { useEffect } from 'react';
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

    useEffect(() => {
        console.log('🔐 ProtectedRoute status changed:', {
            status,
            error,
            timestamp: new Date().toISOString()
        });
    }, [status, error]);

    if (status === 'booting') {
        console.log('🔄 ProtectedRoute: Still booting...');
        return <Spinner />;
    }

    if (status === 'loading') {
        console.log('🔄 ProtectedRoute: Loading auth...');
        return <Spinner />;
    }

    if (status !== 'authenticated') {
        console.log('❌ ProtectedRoute: Not authenticated, status:', status);
        return (
            <div style={messageStyle}>
                <p>Не удалось подтвердить пользователя в Telegram WebApp.</p>
                <p><strong>Статус:</strong> {status}</p>
                <p><strong>Ошибка:</strong> {error || 'Нет информации об ошибке'}</p>
                {process.env.NODE_ENV === 'development' && (
                    <button 
                        onClick={() => window.location.reload()}
                        style={{
                            marginTop: '20px',
                            padding: '10px 20px',
                            background: '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer'
                        }}
                    >
                        Перезагрузить (dev)
                    </button>
                )}
            </div>
        );
    }

    console.log('✅ ProtectedRoute: Authenticated, rendering children');
    return children;
}

export default ProtectedRoute;