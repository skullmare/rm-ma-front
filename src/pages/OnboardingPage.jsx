import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../css/modules/OnboardingPage.module.css';
import apiClient from '../lib/apiClient';
import { ROUTES } from '../constants/routes';
import { IMAGES } from '../constants/images';

function OnboardingPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState('');
  const [profession, setProfession] = useState('');
  const [region, setRegion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Проверка заполненности всех полей
  const isFormValid = role.trim() && profession.trim() && region.trim();

  const handleSubmit = async () => {
    if (!isFormValid || isSubmitting) return;

    setIsSubmitting(true);
    setError('');

    try {
      // Отправляем данные на сервер
      await apiClient.put('/api/profile/role', { role: role.trim() });
      await apiClient.put('/api/profile/profession', { profession: profession.trim() });
      await apiClient.put('/api/profile/region', { region: region.trim() });

      // Сохраняем флаг в localStorage что опрос пройден
      localStorage.setItem('onboarding_completed', 'true');

      // Переходим к списку агентов
      navigate(ROUTES.AGENTS_LIST);
    } catch (err) {
      console.error('Failed to save onboarding data:', err);
      setError('Не удалось сохранить данные. Попробуйте еще раз.');
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    // Сохраняем флаг что опрос был пропущен
    localStorage.setItem('onboarding_completed', 'true');
    navigate(ROUTES.AGENTS_LIST);
  };

  return (
    <div className={`${styles.body} ${styles.onboardingPage}`}>
      <div className={styles.logoContainer}>
        <img src={IMAGES.LOGO} alt="Rocketmind" className={styles.logo} />
      </div>

      <div className={styles.contentContainer}>
        <h1 className={styles.title}>РАССКАЖИ О СЕБЕ</h1>
        <p className={styles.subtitle}>
          Это поможет ИИ-агентам говорить<br />
          с тобой на одном языке и учитывать<br />
          контекст твоего бизнеса.
        </p>

        <div className={styles.formBlock}>
          {/* Роль в бизнесе */}
          <div className={styles.fieldBlock}>
            <label className={styles.fieldLabel}>Роль в бизнесе</label>
            <input
              type="text"
              className={styles.fieldInput}
              placeholder="Генеральный директор"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={isSubmitting}
            />
            <div className={styles.fieldHint}>Например: генеральный директор</div>
          </div>

          {/* Сфера деятельности */}
          <div className={styles.fieldBlock}>
            <label className={styles.fieldLabel}>Сфера деятельности</label>
            <input
              type="text"
              className={styles.fieldInput}
              placeholder="Образование"
              value={profession}
              onChange={(e) => setProfession(e.target.value)}
              disabled={isSubmitting}
            />
            <div className={styles.fieldHint}>Например: производство, образование</div>
          </div>

          {/* Регион */}
          <div className={styles.fieldBlock}>
            <label className={styles.fieldLabel}>Регион</label>
            <input
              type="text"
              className={styles.fieldInput}
              placeholder="Магаданская область"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              disabled={isSubmitting}
            />
            <div className={styles.fieldHint}>Например: Московская область</div>
          </div>

          {error && (
            <div className={styles.error}>{error}</div>
          )}

          {/* Кнопка продолжить */}
          <button
            className={`${styles.submitButton} ${!isFormValid ? styles.submitButtonDisabled : ''}`}
            onClick={handleSubmit}
            disabled={!isFormValid || isSubmitting}
          >
            {isSubmitting ? 'СОХРАНЕНИЕ...' : 'ПРОДОЛЖИТЬ'}
          </button>

          {/* Кнопка заполнить позже */}
          <button
            className={styles.skipButton}
            onClick={handleSkip}
            disabled={isSubmitting}
          >
            ЗАПОЛНИТЬ ПОЗЖЕ
          </button>
        </div>
      </div>
    </div>
  );
}

export default OnboardingPage;
