import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../css/modules/ProfilePage.module.css';
import Spinner from '../components/Spinner';
import PageNavbar from '../components/PageNavbar';
import { usePageLoader } from '../hooks/usePageLoader';
import apiClient from '../lib/apiClient';
import { useAuth } from '../context/AuthContext.jsx';
import { IMAGES } from '../constants/images';
import { ROUTES } from '../constants/routes';

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
  const [role, setRole] = useState('');
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const roleDebounceRef = useRef(null);
  const roleInputRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async () => {
      try {
        const { data } = await apiClient.get('/api/profile');
        if (isMounted && data?.profile) {
          setProfile(data.profile);
          setProfession(data.profile.profession || '');
          if (Array.isArray(data.profile.roles) && data.profile.roles.length > 0) {
            setRole(data.profile.roles[0] || '');
          } else {
            setRole(data.profile.role || '');
          }
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

  const photoUrl = profile?.photo_url || user?.photoUrl || IMAGES.PERSON;

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
      // Сохраняем фокус перед обновлением состояния
      const inputElement = professionInputRef.current;
      const hadFocus = document.activeElement === inputElement;

      setIsUpdatingProfession(true);
      try {
        await apiClient.put('/api/profile/profession', {
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

  const handleRoleChange = (e) => {
    const newRole = e.target.value;
    setRole(newRole);

    if (roleDebounceRef.current) {
      clearTimeout(roleDebounceRef.current);
    }

    roleDebounceRef.current = setTimeout(async () => {
      const inputElement = roleInputRef.current;
      const hadFocus = document.activeElement === inputElement;

      setIsUpdatingRole(true);
      try {
        await apiClient.put('/api/profile/role', {
          role: newRole,
        });
        setProfile((prev) => {
          if (!prev) {
            return prev;
          }
          return {
            ...prev,
            roles: newRole ? [newRole] : [],
          };
        });
      } catch (err) {
        console.error('Failed to update role:', err);
        setError(err?.response?.data?.message || 'Failed to update role');
      } finally {
        setIsUpdatingRole(false);

        if (hadFocus && inputElement) {
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
      if (roleDebounceRef.current) {
        clearTimeout(roleDebounceRef.current);
      }
    };
  }, []);

  const fullName = [firstName, lastName].filter(Boolean).join(' ') || 
                   (username ? `@${username}` : 'Пользователь');

  const goBack = () => navigate(ROUTES.AGENTS_LIST);
  const goToTariff = () => navigate(ROUTES.TARIFF);

  if (isPageLoading || isLoading) return <Spinner />;

  return (
    <div className={`${styles.body} ${styles.profilePage}`}>
      <PageNavbar leftIcon="back" onLeftClick={goBack} />

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
              e.currentTarget.src = IMAGES.PERSON;
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
        <div className="mt-2">
          <input
            ref={roleInputRef}
            className={styles.personActivity}
            type="text"
            placeholder="Генеральный директор.."
            value={role}
            onChange={handleRoleChange}
            aria-busy={isUpdatingRole}
          />
          {isUpdatingRole && (
            <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
              Сохранение...
            </div>
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
            aria-busy={isUpdatingProfession}
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
