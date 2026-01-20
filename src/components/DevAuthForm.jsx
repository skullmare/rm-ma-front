import React, { useState } from 'react';
import styles from '../css/modules/DevAuthForm.module.css';

const DEV_INIT_DATA_KEY = 'dev_telegram_init_params';

export default function DevAuthForm({ onSubmit }) {
    const [jsonInput, setJsonInput] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        try {
            const parsed = JSON.parse(jsonInput);

            // Validate required fields
            if (!parsed.tgWebAppData) {
                throw new Error('Missing required field: tgWebAppData');
            }

            // Save to localStorage
            localStorage.setItem(DEV_INIT_DATA_KEY, JSON.stringify(parsed));

            // Mock Telegram WebApp object
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

            // Notify parent to retry authorization
            if (onSubmit) {
                onSubmit(parsed.tgWebAppData);
            }
        } catch (err) {
            setError(err.message || 'Invalid JSON format');
        }
    };

    const handleClear = () => {
        localStorage.removeItem(DEV_INIT_DATA_KEY);
        setJsonInput('');
        setError('');
    };

    const exampleData = `{
  "tgWebAppData": "query_id=AAHvD48xAAAAAO8PjzEESY8a&user=%7B%22id%22%3A831459311%2C%22first_name%22%3A%22Ivan%22%2C%22last_name%22%3A%22%F0%9F%94%A5%22%2C%22username%22%3A%22johnbIack%22%2C%22language_code%22%3A%22ru%22%2C%22allows_write_to_pm%22%3Atrue%2C%22photo_url%22%3A%22https%3A%5C%2F%5C%2Ft.me%5C%2Fi%5C%2Fuserpic%5C%2F320%5C%2FKU3axFP0GwcoBtug0BoCZ5VH_2jAijIY7pXMEgiesGc.svg%22%7D&auth_date=1768913635&signature=jiEnb8ZuopiMKWEMle0qzrpvMj8B_Owk1koB1CeI_JuIrXKAuYn8qZsBiCSgj8h9M4toox0JB95H44If8oacBg&hash=d22af9bec9a85aea36592960a4b765aae68b63dc59cf5c297ba7338f17ac55fd",
  "tgWebAppVersion": "9.1",
  "tgWebAppPlatform": "weba",
  "tgWebAppThemeParams": "{\\"bg_color\\":\\"#ffffff\\",\\"text_color\\":\\"#000000\\",\\"hint_color\\":\\"#707579\\",\\"link_color\\":\\"#3390ec\\",\\"button_color\\":\\"#3390ec\\",\\"button_text_color\\":\\"#ffffff\\",\\"secondary_bg_color\\":\\"#f4f4f5\\",\\"header_bg_color\\":\\"#ffffff\\",\\"accent_text_color\\":\\"#3390ec\\",\\"section_bg_color\\":\\"#ffffff\\",\\"section_header_text_color\\":\\"#707579\\",\\"subtitle_text_color\\":\\"#707579\\",\\"destructive_text_color\\":\\"#e53935\\"}"
}`;

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <h2 className={styles.title}>DEV MODE</h2>
                <p className={styles.subtitle}>
                    Введите __telegram__initParams для локальной разработки
                </p>

                <form onSubmit={handleSubmit}>
                    <textarea
                        className={styles.textarea}
                        value={jsonInput}
                        onChange={(e) => setJsonInput(e.target.value)}
                        placeholder={exampleData}
                        rows={12}
                    />

                    {error && (
                        <div className={styles.error}>
                            {error}
                        </div>
                    )}

                    <div className={styles.buttons}>
                        <button type="submit" className={styles.submitBtn}>
                            Войти
                        </button>
                        <button type="button" onClick={handleClear} className={styles.clearBtn}>
                            Очистить
                        </button>
                    </div>
                </form>

                <div className={styles.hint}>
                    Откройте консоль браузера → Application → Local Storage → __telegram__initParams
                </div>
            </div>
        </div>
    );
}
