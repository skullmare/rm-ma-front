import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';
import apiClient, { setAuthHeader } from '../lib/apiClient';

const AuthContext = createContext(null);

const initialState = {
    status: 'booting', // booting | loading | authenticated | unauthorized | error
    token: null,
    user: null,
    error: null,
};

export function AuthProvider({ children }) {
    const [state, setState] = useState(initialState);

    const applySession = useCallback((session) => {
        setAuthHeader(session.token);
        setState({
            status: 'authenticated',
            token: session.token,
            user: session.user,
            error: null,
        });
    }, []);

    const handleError = useCallback((message) => {
        setAuthHeader(null);
        setState({
            status: 'error',
            token: null,
            user: null,
            error: message,
        });
    }, []);

    const authorize = useCallback(async (initData) => {
        setState(prev => ({
            ...prev,
            status: "loading",
            error: null,
        }));

        const form = new URLSearchParams();
        form.append("initData", initData);

        const { data } = await apiClient.post(
            "/api/auth/telegram/login",
            form,
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            }
        );

        applySession({ token: data.token, user: data.user });
    }, [applySession]);

    useEffect(() => {
        let cancelled = false;
        const tg = window.Telegram?.WebApp;

        const boot = async () => {
            try {
                if (tg) {
                    tg.ready?.();
                    tg.expand?.();
                }

                const initData = tg?.initData;
                if (initData) {
                    await authorize(initData);
                    return;
                }

                const params = new URLSearchParams(window.location.search);
                const mockInitData = params.get('mockInitData');

                if (mockInitData) {
                    await authorize(mockInitData);
                    return;
                }

                setState({
                    status: 'unauthorized',
                    token: null,
                    user: null,
                    error: 'Откройте мини-апп внутри Telegram',
                });
            } catch (error) {
                if (!cancelled) {
                    handleError(
                        error?.response?.data?.message ||
                        error?.message ||
                        'Не удалось авторизоваться'
                    );
                }
            }
        };

        boot();
        return () => {
            cancelled = true;
        };
    }, [authorize, handleError]);

    const logout = useCallback(() => {
        setAuthHeader(null);
        setState({
            status: 'unauthorized',
            token: null,
            user: null,
            error: null,
        });
    }, []);

    const value = useMemo(
        () => ({
            ...state,
            logout,
            reload: () => {
                const tg = window.Telegram?.WebApp;
                const initData = tg?.initData;
                if (initData) {
                    authorize(initData).catch((error) =>
                        handleError(error?.message ?? 'Ошибка авторизации')
                    );
                }
            },
        }),
        [state, authorize, handleError, logout]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used inside AuthProvider');
    }
    return context;
};


