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
    const initDataRef = useRef(null); // Храним initData в ref, чтобы избежать пересоздания функций
    const hasAuthorizedRef = useRef(false); // Отслеживаем, был ли уже вызван authorize

    useEffect(() => {
        return () => {
            isMounted.current = false;
        };
    }, []);

    const applySession = useCallback((session, initData = null) => {
        if (!isMounted.current) return;

        // Сохраняем initData в ref
        if (initData) {
            initDataRef.current = initData;
        }

        setAuthHeader(session.token);
        saveSessionToStorage(session.token, session.user);

        // Используем функциональное обновление, чтобы не зависеть от state.initData
        setState(prev => ({
            status: 'authenticated',
            token: session.token,
            user: session.user,
            error: null,
            initData: initData || initDataRef.current || prev.initData,
        }));
    }, []); // Убираем зависимость от state.initData

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

    const { data } = await apiClient.post(
        '/api/auth/telegram/login',
        { initData }, // <— raw строка, НИКАКИХ энкодингов
        {
            headers: {
                'Content-Type': 'application/json',
            }
        }
    );

    applySession({ token: data.token, user: data.user }, initData);
}, [applySession]);

    // === Загрузка при старте ===
    useEffect(() => {
        let cancelled = false;

        const boot = async () => {
            const tg = window.Telegram?.WebApp;

            // Telegram WebApp
            if (tg) {
                tg.ready?.();
                tg.expand?.();
            }

            const currentInitData = tg?.initData || new URLSearchParams(window.location.search).get('mockInitData');

            if (!currentInitData) {
                // Нет initData → просим открыть в Telegram
                setState({
                    status: 'unauthorized',
                    token: null,
                    user: null,
                    error: 'Откройте мини-апп внутри Telegram',
                    initData: null,
                });
                return;
            }

            // Проверяем, не вызывали ли мы уже authorize
            if (hasAuthorizedRef.current) return;
            hasAuthorizedRef.current = true;

            try {
                if (!cancelled) {
                    await authorize(currentInitData);
                }
            } catch (error) {
                if (!cancelled) {
                    hasAuthorizedRef.current = false; // Сбрасываем флаг при ошибке
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
    }, [authorize, handleError]); // Зависимости теперь стабильны благодаря исправлению applySession

    // === Выход ===
    const logout = useCallback(() => {
        setAuthHeader(null);
        clearSessionStorage();
        hasAuthorizedRef.current = false; // Сбрасываем флаг при выходе
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
        const initData = initDataRef.current || // Используем ref в первую очередь
            state.initData ||
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

