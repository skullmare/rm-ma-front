import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../css/modules/Header.module.css'; // Создадим новый CSS модуль

const BACK_ARROW = '/img/Rectangle 42215.svg';
const DEFAULT_AVATAR = '/img/person.svg';

function Header({ 
  userPhoto, 
  onBackClick, 
  onProfileClick, 
  backLabel = "Назад",
  profileLabel = "Профиль"
}) {
  const navigate = useNavigate();

  const handleBackClick = (e) => {
    e.preventDefault();
    if (onBackClick) {
      onBackClick();
    } else {
      navigate(-1);
    }
  };

  const handleProfileClick = (e) => {
    e.preventDefault();
    if (onProfileClick) {
      onProfileClick();
    } else {
      navigate('/profile');
    }
  };

  return (
    <nav className={styles.navbar}>
      <div className="container-fluid d-flex justify-content-between px-0">
        <a 
          href="#" 
          onClick={handleBackClick} 
          className={styles.prev} 
          aria-label={backLabel}
        >
          <img src={BACK_ARROW} alt={backLabel} />
        </a>

        <a 
          href="#" 
          onClick={handleProfileClick} 
          className={styles.navbarAccount} 
          aria-label={profileLabel}
        >
          <div className={styles.accountIcon}>
            <img 
              src={userPhoto || DEFAULT_AVATAR} 
              alt="Аватар пользователя"
              className={styles.userAvatar}
              onError={(e) => {
                e.currentTarget.src = DEFAULT_AVATAR;
              }}
            />
          </div>
        </a>
      </div>
    </nav>
  );
}

export default Header;