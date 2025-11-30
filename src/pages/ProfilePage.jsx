import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../css/modules/ProfilePage.module.css';
import Spinner from '../components/Spinner';
import { usePageLoader } from '../hooks/usePageLoader';
import apiClient from '../lib/apiClient';
import { useAuth } from '../context/AuthContext.jsx';

const backArrowImg = '/img/Rectangle 42215.svg';
const settingIconImg = '/img/setting_icon.svg';
const personImg = '/img/person.svg';

function ProfilePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isLoading = usePageLoader(500);

  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      setIsProfileLoading(true);
      try {
        const { data } = await apiClient.get('/api/profile');

        if (!mounted) return;

        console.log('Ответ от сервера:', data);

        if (data?.profile) {
          setProfile(data.profile);
          setError(null);
        } else {
          setError('Данные профиля не найдены в ответе сервера');
        }
      } catch (err) {
        if (!mounted) return;
        console.error('Ошибка загрузки профиля:', err);
        setError(
          err?.response?.data?.message ||
            'Не удалось загрузить профиль. Попробуйте позже.'
        );
      } finally {
        if (mounted) setIsProfileLoading(false);
      }
    };

    loadProfile();

    return () => {
      mounted = false;
    };
  }, []);

  // === ОТЛАДКА (можно удалить в продакшене) ===
  useEffect(() => {
    console.log('profile state:', profile);
    console.log('user из AuthContext:', user);
  }, [profile, user]);

  const handleBackClick = (e) => {
    e.preventDefault();
    navigate('/agents_list');
  };

  const handleTariffClick = (e) => {
    e.preventDefault();
    navigate('/tariff');
  };

  // === ГЛАВНОЕ: ДАННЫЕ ИЗ n8n ПРОФИЛЯ ИМЕЮТ МАКСИМАЛЬНЫЙ ПРИОРИТЕТ ===
  const displayData = {
    firstName: (profile?.first_name || user?.firstName || '').trim(),
    lastName: (profile?.last_name || user?.lastName || '').trim(),
    usernameRaw: profile?.username || user?.username || '',
    photoUrl: profile?.photo_url || user?.photoUrl || personImg,
    profession: profile?.profession || '',
    roles: Array.isArray(profile?.roles) ? profile.roles : [],
    tariff: profile?.tariff || 'free',
  };

  const username = displayData.usernameRaw.startsWith('@')
    ? displayData.usernameRaw.slice(1)
    : displayData.usernameRaw;

  const fullName =
    [displayData.firstName, displayData.lastName].filter(Boolean).join(' ') ||
    (username ? `@${username}` : 'Пользователь');

  if (isLoading || isProfileLoading) {
    return <Spinner />;
  }

  return (
    <div className={`${styles.body} ${styles.profilePage}`}>
      <nav className={styles.navbar}>
        <div className="container-fluid d-flex justify-content-between px-0">
          <a
            className={styles.prev}
            href="#"
            onClick={handleBackClick}
            aria-label="Назад"
          >
            <img src={backArrowImg} alt="Назад" />
          </a>
          <a className={styles.navbarAccount} href="#" aria-label="Настройки">
            <div className={styles.accountIcon}>
              <img src={settingIconImg} alt="Настройки" />
            </div>
          </a>
        </div>
      </nav>

      <div className={styles.glow} aria-hidden="true"></div>

      <div className={styles.contentBlock}>
        <h2 className={styles.profileTitle}>ПРОФИЛЬ</h2>

        {/* Отладка - удали, когда всё заработает */}
        {process.env.NODE_ENV === 'development' && (
          <div
            style={{
              fontSize: '11px',
              color: '#666',
              background: '#f0f0f0',
              padding: '8px',
              borderRadius: '6px',
              marginTop: '10px',
            }}
          >
            <strong>Debug:</strong> {fullName} | @{username || '—'} | 
            Роль: {displayData.roles.join(', ') || '—'} | 
            Профессия: "{displayData.profession || 'не указана'}"
          </div>
        )}
      </div>

      {/* АВАТАР + ИМЯ */}
      <div className={`${styles.contentBlock} d-flex align-items-center`}>
        <div className={styles.avatarBlock}>
          <img
            src={displayData.photoUrl}
            alt="Аватар профиля"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = personImg;
            }}
          />
        </div>
        <div className={styles.infoBlock}>
          <div>{fullName}</div>
          {username && <div className={styles.username}>@{username}</div>}
        </div>
      </div>

      {/* РОЛИ */}
      <div className={styles.contentBlock}>
        <span className={styles.sectionTitle}>ВАША РОЛЬ:</span>
        <div className="d-flex align-items-center flex-wrap gap-2 mt-2">
          {displayData.roles.length > 0 ? (
            displayData.roles.map((role, i) => (
              <div key={i} className={styles.addRole}>
                {role}
              </div>
            ))
          ) : (
            <>
              <div className={styles.addRole}>Добавить роль +</div>
              <div className={styles.addRole}>Добавить роль +</div>
            </>
          )}
        </div>
      </div>

      {/* СФЕРА ДЕЯТЕЛЬНОСТИ */}
      <div className={styles.contentBlock}>
        <span className={styles.sectionTitle}>СФЕРА ДЕЯТЕЛЬНОСТИ:</span>
        <div className="input-block mt-2">
          <input
            className={styles.personActivity}
            type="text"
            placeholder="Укажите вашу сферу деятельности.."
            value={displayData.profession}
            readOnly
          />
        </div>
      </div>

      {/* ТАРИФ */}
      <div className={styles.contentBlock}>
        <div className="d-flex flex-column w-100 gap-2">
          <a
            className={styles.linkCorporatePage}
            href="#"
            onClick={handleTariffClick}
          >
            Выбрать тариф
          </a>
        </div>
      </div>

      {/* ОШИБКА */}
      {error && (
        <div className={styles.contentBlock}>
          <div className={styles.infoBlock} style={{ color: '#F87171' }}>
            {error}
          </div>
        </div>
      )}

      {/* НИЖНИЕ ССЫЛКИ */}
      <div className={`${styles.contentBlock} d-flex flex-column gap-3`}>
        <a className={styles.linkCorporatePage} href="#">
          Политика конфиденциальности
        </a>
        <a className={styles.linkCorporatePage} href="#">
          Условия использования
        </a>
        <a className={styles.linkCorporatePage} href="#">
          О сервисе
        </a>
      </div>
    </div>
  );
}

export default ProfilePage;