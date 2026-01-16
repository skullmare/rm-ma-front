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
 * @param {Function} props.onLeftClick - Обработчик клика на левую иконку (опционально)
 * @param {Function} props.onRightClick - Обработчик клика на правую иконку (опционально)
 * @param {boolean} props.showProfileIcon - Показывать ли иконку профиля справа (по умолчанию true)
 * @param {string} props.className - Дополнительные CSS классы
 */
function PageNavbar({
  leftIcon = 'back',
  centerText = '',
  onLeftClick,
  onRightClick,
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

  const getLeftIconSrc = () => {
    if (leftIcon === 'back') return IMAGES.BACK_ARROW;
    if (leftIcon === 'logo') return IMAGES.LOGO;
    return null;
  };

  const leftIconSrc = getLeftIconSrc();

  return (
    <nav className={`${styles.navbar} ${className}`}>
      <div className="container-fluid d-flex justify-content-between align-items-center px-0">
        {/* Левая часть */}
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

        {/* Правая часть - иконка профиля */}
        {showProfileIcon && (
          <a className={styles.navbarAccount} href="#" onClick={handleRightClick}>
            <div className={styles.accountIcon}>
              <img src={IMAGES.PERSON} alt="Профиль" />
            </div>
          </a>
        )}
      </div>
    </nav>
  );
}

export default PageNavbar;
