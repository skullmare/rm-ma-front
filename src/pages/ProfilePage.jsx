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
        // Данные профиля теперь приходят из n8n
        console.log('Profile data received:', data);
        console.log('Profile object:', data.profile);
        if (data && data.profile) {
          setProfile(data.profile);
          setError(null);
        } else {
          console.warn('Profile data is missing or invalid:', data);
          setError('Данные профиля не получены');
        }
      } catch (profileError) {
        if (!mounted) return;
        console.error('Profile loading error:', profileError);
        setError(
          profileError?.response?.data?.message ||
            'Не удалось получить данные профиля'
        );
      } finally {
        if (mounted) {
          setIsProfileLoading(false);
        }
      }
    };

    loadProfile();
    return () => {
      mounted = false;
    };
  }, []);

  // Отслеживаем изменения profile для отладки
  useEffect(() => {
    if (profile) {
      console.log('Profile state updated:', profile);
      console.log('Profile fields:', {
        first_name: profile.first_name,
        last_name: profile.last_name,
        username: profile.username,
        photo_url: profile.photo_url,
        roles: profile.roles,
        profession: profile.profession,
      });
    }
  }, [profile]);

  const handleBackClick = (e) => {
    e.preventDefault();
    navigate('/agents_list');
  };

  const handleTariffClick = (e) => {
    e.preventDefault();
    navigate('/tariff');
  };

  // Используем данные из профиля n8n, если они есть, иначе из контекста авторизации
  const firstName = profile?.first_name?.trim() || user?.firstName?.trim() || '';
  const lastName = profile?.last_name?.trim() || user?.lastName?.trim() || '';
  const usernameRaw = profile?.username || user?.username || '';
  // Убираем @ из username если он есть, чтобы не дублировать
  const username = usernameRaw.startsWith('@') ? usernameRaw.substring(1) : usernameRaw;
  
  const fullName = [firstName, lastName].filter(Boolean).join(' ') || username || 'Пользователь';
  const avatarSrc = profile?.photo_url || user?.photoUrl || personImg;
  const roles = Array.isArray(profile?.roles) ? profile.roles : [];
  const profession = profile?.profession || '';
  const tariff = profile?.tariff || 'free';

  if (isLoading || isProfileLoading) {
    return <Spinner />;
  }

  return (
    <div className={`${styles.body} ${styles.profilePage}`}>
      <nav className={styles.navbar}>
        <div className="container-fluid d-flex justify-content-between px-0">
          <a className={styles.prev} href="#" onClick={handleBackClick} aria-label="Назад">
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
        {/* Временная отладка - удалить после проверки */}
        {process.env.NODE_ENV === 'development' && (
          <div style={{ fontSize: '10px', color: '#999', marginTop: '10px' }}>
            Debug: profile={profile ? 'loaded' : 'null'}, 
            firstName={firstName || 'empty'}, 
            lastName={lastName || 'empty'}, 
            username={username || 'empty'},
            roles={roles.length}, 
            profession={profession || 'empty'}
          </div>
        )}
      </div>

      <div className={`${styles.contentBlock} d-flex align-items-center`}>
        <div className={styles.avatarBlock}>
          <img
            src={avatarSrc}
            alt="Аватар профиля из Telegram"
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = personImg;
              event.currentTarget.style.width = '30px';
              event.currentTarget.style.height = '30px';
            }}
          />
        </div>
        <div className={styles.infoBlock}>
          <div>{fullName || 'Пользователь'}</div>
          {username && (
            <div className={styles.username}>@{username}</div>
          )}
        </div>
      </div>

      <div className={styles.contentBlock}>
        <span className={styles.sectionTitle}>ВАША РОЛЬ:</span>
        <div className="d-flex align-items-center">
          {roles.length > 0 ? (
            roles.map((role, index) => (
              <div key={index} className={styles.addRole}>{role}</div>
            ))
          ) : (
            <>
              <div className={styles.addRole}>Добавить роль +</div>
              <div className={styles.addRole}>Добавить роль +</div>
            </>
          )}
        </div>
      </div>

      <div className={styles.contentBlock}>
        <span className={styles.sectionTitle}>СФЕРА ДЕЯТЕЛЬНОСТИ:</span>
        <div className="input-block">
          <input 
            className={styles.personActivity} 
            type="text" 
            placeholder="Укажите вашу сферу деятельности.."
            aria-label="Сфера деятельности"
            value={profession}
            readOnly
          />
        </div>
      </div>

      <div className={styles.contentBlock}>
        <div className="d-flex flex-column w-100 gap-2">
          <a className={styles.linkCorporatePage} href="#" onClick={handleTariffClick}>Выбрать тариф</a>
        </div>
      </div>

      {error && (
        <div className={styles.contentBlock}>
          <div className={styles.infoBlock} style={{ color: '#F87171' }}>
            {error}
          </div>
        </div>
      )}

      <div className={`${styles.contentBlock} d-flex flex-column gap-3`}>
        <a className={styles.linkCorporatePage} href="">Политика конфиденциальности</a>
        <a className={styles.linkCorporatePage} href="">Условия использования</a>
        <a className={styles.linkCorporatePage} href="">О сервисе</a>
      </div>

    </div>
  );
}

export default ProfilePage;

