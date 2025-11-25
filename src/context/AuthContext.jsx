import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    useRef,
} from 'react';
import apiClient, { setAuthHeader } from '../lib/apiClient';

const AuthContext = createContext(null);

const initialState = {
    status: 'booting', // booting | loading | authenticated | unauthorized | error
    token: null,
    user: null,
    error: null,
    initData: null, // ← добавлено: сохраняем initData для reload()
};

const STORAGE_KEY = 'tg_miniapp_auth';

const saveSessionToStorage = (token, user) => {
    if (!token || !user) return;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user }));
    } catch (e) {
        console.warn('Не удалось сохранить сессию в localStorage', e);
    }
};

const loadSessionFromStorage = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch (e) {
        console.warn('Ошибка чтения сессии из localStorage', e);
        return null;
    }
};

const clearSessionStorage = () => {
    localStorage.removeItem(STORAGE_KEY);
};

export function AuthProvider({ children }) {
    const [state, setState] = useState(initialState);
    const isMounted = useRef(true);

    useEffect(() => {
        return () => {
            isMounted.current = false;
        };
    }, []);

    const applySession = useCallback((session, initData = null) => {
        if (!isMounted.current) return;

        setAuthHeader(session.token);
        saveSessionToStorage(session.token, session.user);

        setState({
            status: 'authenticated',
            token: session.token,
            user: session.user,
            error: null,
            initData: initData || state.initData,
        });
    }, [state.initData]);

    const handleError = useCallback((message) => {
        if (!isMounted.current) return;

        setAuthHeader(null);
        clearSessionStorage();

        setState({
            status: 'error',
            token: null,
            user: null,
            error: message,
            initData: null,
        });
    }, []);

    const authorize = useCallback(async (initData) => {
        if (!initData) throw new Error('initData отсутствует');

        setState(prev => ({
            ...prev,
            status: 'loading',
            error: null,
            initData,
        }));

        const form = new URLSearchParams();
        form.append('initData', initData);

        const { data } = await apiClient.post(
            '/api/auth/telegram/login',
            form,
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                timeout: 15000, // ← явный таймаут
            }
        );

        applySession({ token: data.token, user: data.user }, initData);
    }, [applySession]);

    // === Загрузка при старте ===
    useEffect(() => {
        let cancelled = false;

        const boot = async () => {
            const tg = window.Telegram?.WebApp;

            // 1. Попробуем восстановить сессию из localStorage (если токен валиден)
            const saved = loadSessionFromStorage();
            if (saved && saved.token && saved.user) {
                setAuthHeader(saved.token);
                setState(prev => ({
                    ...prev,
                    status: 'authenticated',
                    token: saved.token,
                    user: saved.user,
                }));
                // Можно дополнительно проверить токен через /me, если нужно
            }

            // 2. Telegram WebApp
            if (tg) {
                tg.ready?.();
                tg.expand?.();
            }

            const currentInitData = tg?.initData || new URLSearchParams(window.location.search).get('mockInitData');

            if (!currentInitData) {
                if (!saved) {
                    // Нет ни сохранённой сессии, ни initData → просим открыть в Telegram
                    setState({
                        status: 'unauthorized',
                        token: null,
                        user: null,
                        error: 'Откройте мини-апп внутри Telegram',
                        initData: null,
                    });
                }
                return;
            }

            try {
                if (!cancelled) {
                    await authorize(currentInitData);
                }
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

    // === Выход ===
    const logout = useCallback(() => {
        setAuthHeader(null);
        clearSessionStorage();
        setState({
            status: 'unauthorized',
            token: null,
            user: null,
            error: null,
            initData: null,
        });
    }, []);

    // === Повторная авторизация (например, после истечения токена) ===
    const reload = useCallback(async () => {
        const initData = state.initData ||
            window.Telegram?.WebApp?.initData ||
            new URLSearchParams(window.location.search).get('mockInitData');

        if (!initData) {
            handleError('Нет данных для повторной авторизации');
            return;
        }

        try {
            await authorize(initData);
        } catch (err) {
            handleError(err?.message || 'Ошибка повторной авторизации');
        }
    }, [state.initData, authorize, handleError]);

    const value = useMemo(
        () => ({
            ...state,
            logout,
            reload,
        }),
        [state, logout, reload]
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
