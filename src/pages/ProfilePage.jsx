import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../css/modules/ProfilePage.module.css';
import Spinner from '../components/Spinner';
import { usePageLoader } from '../hooks/usePageLoader';
import apiClient from '../lib/apiClient';
import { useAuth } from '../context/AuthContext.jsx';

const BACK_ARROW = '/img/Rectangle 42215.svg';
const SETTINGS_ICON = '/img/setting_icon.svg';
const DEFAULT_AVATAR = '/img/person.svg';

function ProfilePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isPageLoading = usePageLoader(500);

  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [profession, setProfession] = useState('');
  const [isUpdatingProfession, setIsUpdatingProfession] = useState(false);
  const professionDebounceRef = useRef(null);
  const professionInputRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async () => {
      try {
        const { data } = await apiClient.get('/api/profile');
        if (isMounted && data?.profile) {
          setProfile(data.profile);
          setProfession(data.profile.profession || '');
        }
      } catch (err) {
        if (isMounted) {
          setError(err?.response?.data?.message || 'Не удалось загрузить профиль');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchProfile();
    return () => { isMounted = false; };
  }, []);

  // Приоритет: профиль из бэкенда → AuthContext → дефолты
  const firstName = profile?.first_name?.trim() || user?.firstName?.trim() || '';
  const lastName = profile?.last_name?.trim() || user?.lastName?.trim() || '';
  const usernameRaw = profile?.username || user?.username || '';
  const username = usernameRaw.startsWith('@') ? usernameRaw.slice(1) : usernameRaw;

  const photoUrl = profile?.photo_url || user?.photoUrl || DEFAULT_AVATAR;
  const roles = Array.isArray(profile?.roles) ? profile.roles : [];

  // Получаем chat_id из профиля или пользователя
  const chatId = profile?.chat_id || user?.telegramId || user?.id;

  // Обработчик изменения профессии с debounce
  const handleProfessionChange = (e) => {
    const newProfession = e.target.value;
    setProfession(newProfession);

    // Очищаем предыдущий таймер
    if (professionDebounceRef.current) {
      clearTimeout(professionDebounceRef.current);
    }

    // Устанавливаем новый таймер на 1 секунду
    professionDebounceRef.current = setTimeout(async () => {
      if (!chatId) {
        console.error('chat_id not found, cannot update profession');
        return;
      }

      // Сохраняем фокус перед обновлением состояния
      const inputElement = professionInputRef.current;
      const hadFocus = document.activeElement === inputElement;

      setIsUpdatingProfession(true);
      try {
        await apiClient.put('/api/profile/profession', {
          chat_id: String(chatId),
          profession: newProfession,
        });
        // Обновляем профиль локально
        setProfile(prev => ({ ...prev, profession: newProfession }));
      } catch (err) {
        console.error('Failed to update profession:', err);
        setError(err?.response?.data?.message || 'Не удалось обновить сферу деятельности');
      } finally {
        setIsUpdatingProfession(false);
        
        // Восстанавливаем фокус после обновления состояния
        if (hadFocus && inputElement) {
          // Используем setTimeout, чтобы дождаться завершения рендера
          setTimeout(() => {
            inputElement.focus();
          }, 0);
        }
      }
    }, 1000);
  };

  // Очистка таймера при размонтировании
  useEffect(() => {
    return () => {
      if (professionDebounceRef.current) {
        clearTimeout(professionDebounceRef.current);
      }
    };
  }, []);

  const fullName = [firstName, lastName].filter(Boolean).join(' ') || 
                   (username ? `@${username}` : 'Пользователь');

  const goBack = () => navigate('/agents_list');
  const goToTariff = () => navigate('/tariff');

  if (isPageLoading || isLoading) return <Spinner />;

  return (
    <div className={`${styles.body} ${styles.profilePage}`}>
      {/* Навбар */}
      <nav className={styles.navbar}>
        <div className="container-fluid d-flex justify-content-between px-0">
          <a href="#" onClick={goBack} className={styles.prev} aria-label="Назад">
            <img src={BACK_ARROW} alt="" />
          </a>

          <a href="#" className={styles.navbarAccount} aria-label="Настройки">
            <div className={styles.accountIcon}>
              <img src={SETTINGS_ICON} alt="" />
            </div>
          </a>
        </div>
      </nav>

      <div className={styles.glow} aria-hidden="true" />

      <div className={styles.contentBlock}>
        <h2 className={styles.profileTitle}>ПРОФИЛЬ</h2>
      </div>

      {/* Аватар + имя */}
      <div className={`${styles.contentBlock} d-flex align-items-center`}>
        <div className={styles.avatarBlock}>
          <img
            src={photoUrl}
            alt="Аватар"
            onError={(e) => {
              e.currentTarget.src = DEFAULT_AVATAR;
            }}
          />
        </div>
        <div className={styles.infoBlock}>
          <div>{fullName}</div>
          {username && <div className={styles.username}>@{username}</div>}
        </div>
      </div>

      {/* Роли */}
      <div className={styles.contentBlock}>
        <span className={styles.sectionTitle}>ВАША РОЛЬ:</span>
        <div className="d-flex flex-wrap gap-2 mt-2">
          {roles.length > 0 ? (
            roles.map((role, i) => (
              <div key={i} className={styles.addRole}>{role}</div>
            ))
          ) : (
            <>
              <div className={styles.addRole}>Добавить роль +</div>
              <div className={styles.addRole}>Добавить роль +</div>
            </>
          )}
        </div>
      </div>

      {/* Сфера деятельности */}
      <div className={styles.contentBlock}>
        <span className={styles.sectionTitle}>СФЕРА ДЕЯТЕЛЬНОСТИ:</span>
        <div className="mt-2">
          <input
            ref={professionInputRef}
            className={styles.personActivity}
            type="text"
            placeholder="Укажите вашу сферу деятельности.."
            value={profession}
            onChange={handleProfessionChange}
            disabled={isUpdatingProfession}
          />
          {isUpdatingProfession && (
            <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
              Сохранение...
            </div>
          )}
        </div>
      </div>

      {/* Тариф */}
      <div className={styles.contentBlock}>
        <a href="#" onClick={goToTariff} className={styles.linkCorporatePage}>
          Выбрать тариф
        </a>
      </div>

      {/* Ошибка */}
      {error && (
        <div className={styles.contentBlock}>
          <div className={styles.infoBlock} style={{ color: '#F87171' }}>
            {error}
          </div>
        </div>
      )}

      {/* Нижние ссылки */}
      <div className={`${styles.contentBlock} d-flex flex-column gap-3`}>
        <a href="#" className={styles.linkCorporatePage}>Политика конфиденциальности</a>
        <a href="#" className={styles.linkCorporatePage}>Условия использования</a>
        <a href="#" className={styles.linkCorporatePage}>О сервисе</a>
      </div>
    </div>
  );
}

export default ProfilePage;