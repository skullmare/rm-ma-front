import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    useRef,
} from 'react';
import apiClient, { setInitDataHeader } from '../lib/apiClient';
import DevAuthForm from '../components/DevAuthForm';

const AuthContext = createContext(null);

const initialState = {
    status: 'booting', // booting | loading | authenticated | unauthorized | error
    user: null,
    error: null,
    initData: null, // ← добавлено: сохраняем initData для reload()
};

const STORAGE_KEY = 'tg_miniapp_auth';
const DEV_INIT_DATA_KEY = 'dev_telegram_init_params';
const IS_DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true';

const saveSessionToStorage = (initData, user) => {
    if (!initData || !user) return;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ initData, user }));
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

const loadDevInitData = () => {
    if (!IS_DEV_MODE) return null;

    try {
        const raw = localStorage.getItem(DEV_INIT_DATA_KEY);
        if (!raw) return null;

        const parsed = JSON.parse(raw);

        // Create mock Telegram WebApp object
        if (!window.Telegram) {
            window.Telegram = {};
        }

        window.Telegram.WebApp = {
            initData: parsed.tgWebAppData,
            version: parsed.tgWebAppVersion || '7.0',
            platform: parsed.tgWebAppPlatform || 'web',
            themeParams: parsed.tgWebAppThemeParams ? JSON.parse(parsed.tgWebAppThemeParams) : {},
            ready: () => {},
            expand: () => {},
        };

        return parsed.tgWebAppData;
    } catch (e) {
        console.warn('Failed to load dev init data', e);
        return null;
    }
};

export function AuthProvider({ children }) {
    const [state, setState] = useState(initialState);
    const [showDevForm, setShowDevForm] = useState(false);
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

        const resolvedInitData = initData || session.initData || initDataRef.current;

        if (resolvedInitData) {
            initDataRef.current = resolvedInitData;
            setInitDataHeader(resolvedInitData);
            saveSessionToStorage(resolvedInitData, session.user);
        } else {
            setInitDataHeader(null);
            clearSessionStorage();
        }

        // D~??D?D_D??OD???D?D? ?,??D?D??+D,D_D?D?D??OD?D_D? D_D?D?D_D?D?D?D?D,D?, ???,D_D??< D?D? D?D?D?D,??D??,?O D_?, state.initData
        setState(prev => ({
            status: 'authenticated',
            user: session.user,
            error: null,
            initData: resolvedInitData || prev.initData,
        }));
    }, []); // D?D?D,??D?D?D? D?D?D?D,??D,D?D_???,?O D_?, state.initData

    const handleError = useCallback((message) => {

        if (!isMounted.current) return;



        setInitDataHeader(null);

        clearSessionStorage();

        initDataRef.current = null;

        hasAuthorizedRef.current = false;



        setState({

            status: 'error',

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

    applySession({ user: data.user }, initData);
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

            // Try to get initData from multiple sources
            let currentInitData = tg?.initData ||
                                 new URLSearchParams(window.location.search).get('mockInitData');

            // If no initData, try to load from dev storage (only in dev mode)
            if (!currentInitData && IS_DEV_MODE) {
                currentInitData = loadDevInitData();
            }

            if (!currentInitData) {
                // No initData available
                if (IS_DEV_MODE) {
                    // Show dev form to enter init params
                    setShowDevForm(true);
                    setState({
                        status: 'unauthorized',
                        user: null,
                        error: null,
                        initData: null,
                    });
                } else {
                    // Production mode - require Telegram
                    setState({
                        status: 'unauthorized',
                        user: null,
                        error: 'Откройте мини-апп внутри Telegram',
                        initData: null,
                    });
                }
                return;
            }

            // Hide dev form if it was shown
            setShowDevForm(false);

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
        setInitDataHeader(null);
        clearSessionStorage();
        hasAuthorizedRef.current = false; // Сбрасываем флаг при выходе
        setState({
            status: 'unauthorized',
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

    // === Dev form submit handler ===
    const handleDevFormSubmit = useCallback(async (initData) => {
        setShowDevForm(false);
        hasAuthorizedRef.current = false; // Reset flag to allow authorization

        try {
            await authorize(initData);
        } catch (error) {
            hasAuthorizedRef.current = false;
            handleError(
                error?.response?.data?.message ||
                error?.message ||
                'Не удалось авторизоваться'
            );
            // Show form again on error
            if (IS_DEV_MODE) {
                setShowDevForm(true);
            }
        }
    }, [authorize, handleError]);

    const value = useMemo(
        () => ({
            ...state,
            logout,
            reload,
        }),
        [state, logout, reload]
    );

    // Show dev form if in dev mode and no init data
    if (showDevForm) {
        return <DevAuthForm onSubmit={handleDevFormSubmit} />;
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used inside AuthProvider');
    }
    return context;
};
