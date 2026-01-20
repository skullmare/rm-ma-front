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
    initData: null,
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
    const initDataRef = useRef(null);
    const hasAuthorizedRef = useRef(false);
    const bootCompletedRef = useRef(false);

    useEffect(() => {
        return () => {
            isMounted.current = false;
        };
    }, []);

    const applySession = useCallback((session, initData = null) => {
        if (!isMounted.current) return;

        const resolvedInitData = initData || session.initData || initDataRef.current;

        console.log('✅ applySession called with:', {
            hasUser: !!session.user,
            initDataLength: resolvedInitData?.length,
            status: 'authenticated'
        });

        if (resolvedInitData) {
            initDataRef.current = resolvedInitData;
            setInitDataHeader(resolvedInitData);
            saveSessionToStorage(resolvedInitData, session.user);
        }

        setState({
            status: 'authenticated',
            user: session.user,
            error: null,
            initData: resolvedInitData,
        });

        bootCompletedRef.current = true;
    }, []);

    const handleError = useCallback((message) => {
        if (!isMounted.current) return;

        console.log('❌ handleError called:', message);

        setInitDataHeader(null);
        clearSessionStorage();
        initDataRef.current = null;
        hasAuthorizedRef.current = false;
        bootCompletedRef.current = true;

        setState({
            status: 'error',
            user: null,
            error: message,
            initData: null,
        });
    }, []);

    const authorize = useCallback(async (initData) => {
        if (!initData) {
            const error = new Error('initData отсутствует');
            handleError(error.message);
            throw error;
        }

        console.log('🚀 authorize called with initData length:', initData.length);

        setState(prev => ({
            ...prev,
            status: 'loading',
            error: null,
            initData,
        }));

        try {
            const response = await apiClient.post(
                '/api/auth/telegram/login',
                { initData },
                {
                    headers: {
                        'Content-Type': 'application/json',
                    }
                }
            );

            console.log('✅ authorize success, user:', response.data.user);

            applySession({ user: response.data.user }, initData);
            return response.data;
        } catch (error) {
            console.error('❌ authorize error:', error);
            
            hasAuthorizedRef.current = false;
            
            const errorMessage = error?.response?.data?.message || 
                               error?.message || 
                               'Ошибка авторизации';
            
            if (isMounted.current) {
                setState({
                    status: 'error',
                    user: null,
                    error: errorMessage,
                    initData: null,
                });
            }
            
            bootCompletedRef.current = true;
            throw error;
        }
    }, [applySession, handleError]);

    // === Загрузка при старте ===
    useEffect(() => {
        let cancelled = false;

        const boot = async () => {
            console.log('🔧 Booting auth system...');
            
            // DEV MODE: Simulate delay
            if (process.env.NODE_ENV === 'development') {
                console.log('⚙️ Development mode detected');
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            const tg = window.Telegram?.WebApp;

            // Telegram WebApp
            if (tg) {
                console.log('🤖 Telegram WebApp detected');
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

            hasAuthorizedRef.current = true;
            console.log('🚀 Starting authorization...');

            try {
                if (!cancelled) {
                    await authorize(currentInitData);
                    console.log('🎉 Authorization successful');
                }
            } catch (error) {
                if (!cancelled) {
                    console.log('💥 Authorization failed:', error.message);
                    // Don't reset hasAuthorizedRef here - let it stay true to prevent loops
                }
            } finally {
                if (!cancelled) {
                    bootCompletedRef.current = true;
                }
            }
        };

        boot();

        return () => {
            cancelled = true;
        };
    }, [authorize, applySession]);

    // === Выход ===
    const logout = useCallback(() => {
        console.log('👋 Logging out');
        setInitDataHeader(null);
        clearSessionStorage();
        hasAuthorizedRef.current = false;
        bootCompletedRef.current = false;
        setState({
            status: 'unauthorized',
            user: null,
            error: null,
            initData: null,
        });
    }, []);

    // === Повторная авторизация ===
    const reload = useCallback(async () => {
        console.log('🔄 Reloading auth');
        hasAuthorizedRef.current = false;
        bootCompletedRef.current = false;
        
        const initData = initDataRef.current ||
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