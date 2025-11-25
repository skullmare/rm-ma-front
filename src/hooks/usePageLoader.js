import { useState, useEffect } from 'react';

export const usePageLoader = (minLoadingTime = 500) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const startTime = Date.now();

    const hideSpinner = () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, minLoadingTime - elapsed);
      setTimeout(() => setIsLoading(false), remaining);
    };

    // Если страница уже загружена
    if (document.readyState === 'complete') {
      hideSpinner();
    } else {
      // Ждем загрузки всех ресурсов (включая стили, изображения и т.д.)
      window.addEventListener('load', hideSpinner);
      return () => window.removeEventListener('load', hideSpinner);
    }
  }, [minLoadingTime]);

  return isLoading;
};

