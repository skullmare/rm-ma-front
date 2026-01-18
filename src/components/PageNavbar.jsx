import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../css/modules/PageNavbar.module.css';
import { IMAGES } from '../constants/images';
import { ROUTES } from '../constants/routes';

/**
 * Универсальный компонент навбара для всех страниц
 * @param {Object} props
 * @param {'back'|'logo'|'none'} props.leftIcon - Тип левой иконки
 * @param {string} props.centerText - Текст в центре навбара
 * @param {string} props.tariffLabel - Текст тарифа (например, "Базовый")
 * @param {Function} props.onLeftClick - Обработчик клика на левую иконку (опционально)
 * @param {Function} props.onRightClick - Обработчик клика на правую иконку (опционально)
 * @param {Function} props.onTariffClick - Обработчик клика на тариф (опционально)
 * @param {boolean} props.showProfileIcon - Показывать ли иконку профиля справа (по умолчанию true)
 * @param {string} props.className - Дополнительные CSS классы
 */
function PageNavbar({
  leftIcon = 'back',
  centerText = '',
  tariffLabel = '',
  onLeftClick,
  onRightClick,
  onTariffClick,
  showProfileIcon = true,
  className = '',
}) {
  const navigate = useNavigate();

  const handleLeftClick = (e) => {
    e.preventDefault();
    if (onLeftClick) {
      onLeftClick(e);
    } else {
      // Дефолтное поведение
      if (leftIcon === 'back') {
        navigate(ROUTES.AGENTS_LIST);
      } else if (leftIcon === 'logo') {
        navigate(ROUTES.HOME);
      }
    }
  };

  const handleRightClick = (e) => {
    e.preventDefault();
    if (onRightClick) {
      onRightClick(e);
    } else {
      // Дефолтное поведение - переход на профиль
      navigate(ROUTES.PROFILE);
    }
  };

  const handleTariffClick = (e) => {
    e.preventDefault();
    if (onTariffClick) {
      onTariffClick(e);
    } else {
      // Дефолтное поведение - переход на тарифы
      navigate(ROUTES.TARIFF);
    }
  };

  const getLeftIconSrc = () => {
    if (leftIcon === 'back') return IMAGES.BACK_ARROW;
    if (leftIcon === 'logo') return IMAGES.LOGO;
    return null;
  };

  const leftIconSrc = getLeftIconSrc();

  return (
    <nav className={`${styles.navbar} ${className}`}>
      <div className={styles.navbarContainer}>
        {/* Левая часть - логотип или кнопка назад */}
        {leftIcon !== 'none' && leftIconSrc && (
          <a
            className={leftIcon === 'logo' ? styles.navbarBrand : styles.prev}
            href="#"
            onClick={handleLeftClick}
          >
            <img src={leftIconSrc} alt={leftIcon === 'logo' ? 'Логотип' : 'Назад'} />
          </a>
        )}

        {/* Центральная часть */}
        {centerText && <span className={styles.centerText}>{centerText}</span>}

        {/* Правая часть - тариф и профиль */}
        <div className={styles.navbarRight}>
          {/* Кнопка тарифа */}
          {tariffLabel && (
            <a href="#" onClick={handleTariffClick} className={styles.tariffButton}>
              {tariffLabel}
            </a>
          )}

          {/* Иконка профиля */}
          {showProfileIcon && (
            <a className={styles.profileIcon} href="#" onClick={handleRightClick}>
              <svg width="17" height="19" viewBox="0 0 17 19" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16.5 17.9983C16.5 16.3151 16.3261 11.9488 11.2826 11.9488H5.71739C0.673913 11.9488 0.5 16.3151 0.5 17.9983M12.8478 4.70792C12.8478 7.03189 10.9012 8.91584 8.5 8.91584C6.09876 8.91584 4.15217 7.03189 4.15217 4.70792C4.15217 2.38395 6.09876 0.5 8.5 0.5C10.9012 0.5 12.8478 2.38395 12.8478 4.70792Z" stroke="#BBB4C8" strokeLinecap="round"/>
              </svg>
            </a>
          )}
        </div>
      </div>
    </nav>
  );
}

export default PageNavbar;
