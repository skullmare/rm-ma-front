import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/index.css';
import Spinner from '../components/Spinner';
import PageNavbar from '../components/PageNavbar';

const logoImg = '/img/Logo container.svg';
const slide1BoyImg = '/img/1_slide_boy.png';
const slide1MapImg = '/img/Initiative map.svg';
const slide1GirlImg = '/img/1_slide_girl.png';
const slide2Img = '/img/2_slide.png';
const vectorImg = '/img/Vector.svg';
const slide3UpImg = '/img/3_slide_up.png';
const slide3DownImg = '/img/3_slide_down.png';
const slide4GirlImg = '/img/4_slide_girl.png';
const slide4BoyImg = '/img/4_slide_boy.png';

function HomePage() {
  const navigate = useNavigate();
  const carouselRef = useRef(null);
  const carouselInstanceRef = useRef(null);
  const touchStartXRef = useRef(0);
  const touchEndXRef = useRef(0);
  const [isLoading, setIsLoading] = useState(true);

  // Эффект для загрузки Bootstrap и скрытия спиннера
  useEffect(() => {
    const minLoadingTime = 500; // Минимальное время показа спиннера (500мс)
    const startTime = Date.now();
    
    const hideSpinner = () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, minLoadingTime - elapsed);
      setTimeout(() => setIsLoading(false), remaining);
    };

    // Проверяем, загружен ли Bootstrap
    if (window.bootstrap && window.bootstrap.Carousel) {
      // Если Bootstrap уже загружен, показываем спиннер минимум minLoadingTime
      hideSpinner();
    } else {
      // Проверяем, не добавлен ли уже скрипт
      const existingScript = document.querySelector('script[src*="bootstrap.bundle.min.js"]');
      
      if (existingScript) {
        // Если скрипт уже есть, проверяем Bootstrap периодически
        const checkInterval = setInterval(() => {
          if (window.bootstrap && window.bootstrap.Carousel) {
            clearInterval(checkInterval);
            hideSpinner();
          }
        }, 50);
        
        // Таймаут на случай, если скрипт не загрузится
        setTimeout(() => {
          clearInterval(checkInterval);
          hideSpinner();
        }, 3000);
      } else {
        // Загружаем Bootstrap JS
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js';
        script.integrity = 'sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz';
        script.crossOrigin = 'anonymous';
        
        script.onload = () => {
          hideSpinner();
        };

        script.onerror = () => {
          console.error('Ошибка загрузки Bootstrap');
          hideSpinner();
        };

        document.body.appendChild(script);
      }
    }
  }, []);

  // Эффект для инициализации карусели после того, как компонент отрендерился
  useEffect(() => {
    if (isLoading) return; // Не инициализируем, пока идет загрузка

    const initCarousel = () => {
      if (carouselRef.current && window.bootstrap && window.bootstrap.Carousel) {
        try {
          // Уничтожаем предыдущий экземпляр, если он есть
          if (carouselInstanceRef.current) {
            carouselInstanceRef.current.dispose();
          }
          
          carouselInstanceRef.current = new window.bootstrap.Carousel(carouselRef.current, {
            interval: false,
            wrap: false,
            touch: true
          });
        } catch (error) {
          console.error('Ошибка инициализации карусели:', error);
        }
      }
    };

    // Небольшая задержка для гарантии, что DOM готов
    const timer = setTimeout(initCarousel, 100);

    return () => {
      clearTimeout(timer);
      if (carouselInstanceRef.current) {
        try {
          carouselInstanceRef.current.dispose();
        } catch (error) {
          console.error('Ошибка при очистке карусели:', error);
        }
      }
    };
  }, [isLoading]);

  // Обработчик начала касания
  const handleTouchStart = (e) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  // Обработчик движения касания
  const handleTouchMove = (e) => {
    touchEndXRef.current = e.touches[0].clientX;
  };

  // Обработчик окончания касания
  const handleTouchEnd = () => {
    if (!touchStartXRef.current || !touchEndXRef.current) return;

    const diffX = touchStartXRef.current - touchEndXRef.current;
    const minSwipeDistance = 50; // Минимальное расстояние свайпа для срабатывания

    if (Math.abs(diffX) > minSwipeDistance) {
      if (diffX > 0) {
        // Свайп влево - следующий слайд
        handleNextSlide();
      } else {
        // Свайп вправо - предыдущий слайд
        handlePrevSlide();
      }
    }

    // Сброс значений
    touchStartXRef.current = 0;
    touchEndXRef.current = 0;
  };

  const handleNextSlide = () => {
    if (carouselInstanceRef.current) {
      carouselInstanceRef.current.next();
    }
  };

  const handlePrevSlide = () => {
    if (carouselInstanceRef.current) {
      carouselInstanceRef.current.prev();
    }
  };

  const handleGoToAgents = () => {
    // Проверяем, был ли пройден опрос
    const onboardingCompleted = localStorage.getItem('onboarding_completed');

    if (onboardingCompleted === 'true') {
      // Опрос уже пройден, переходим к списку агентов
      navigate('/agents_list');
    } else {
      // Опрос не пройден, переходим на страницу onboarding
      navigate('/onboarding');
    }
  };

  if (isLoading) {
    return <Spinner />;
  }

  return (
    <div className="homePage">
      {/* Carousel с обработчиками свайпа */}
      <div 
        id="fullScreenCarousel" 
        className="carousel slide" 
        data-bs-touch="true" 
        data-bs-wrap="false" 
        ref={carouselRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Slides */}
        <div className="carousel-inner">
          {/* Slide 1 */}
          <div className="carousel-item active">
            <div className="slide-content">
              <PageNavbar leftIcon="logo" showProfileIcon={false} />

              <div className="main-content">
                <div className="glow"></div>
                <div className="content-block content-block-last">
                  <h1>ИИ-АГЕНТЫ <br /> ДЛЯ СТРАТЕГОВ <br />И ЛИДЕРОВ <br />ТРАНСФОРМАЦИИ</h1>
                </div>
                <div className="content-block content-block-last">
                  <div style={{ height: '50%' }}>
                    <img className="slide-1-img-boy" src={slide1BoyImg} alt="Мальчик" />
                    <img className="slide-1-img-map-board" src={slide1MapImg} alt="Карта инициатив" />
                    <img className="slide-1-img-girl" src={slide1GirlImg} alt="Девочка" />
                  </div>
                </div>
              </div>

              <div className="button-block">
                <button className="btn-primary next-button" onClick={handleNextSlide}>ДАЛЕЕ</button>
              </div>
              <div className="indicators-container">
                <div className="carousel-indicators">
                  <button type="button" data-bs-target="#fullScreenCarousel" data-bs-slide-to="0"
                    className="active" aria-current="true" aria-label="Slide 1"></button>
                  <button type="button" data-bs-target="#fullScreenCarousel" data-bs-slide-to="1"
                    aria-label="Slide 2"></button>
                  <button type="button" data-bs-target="#fullScreenCarousel" data-bs-slide-to="2"
                    aria-label="Slide 3"></button>
                  <button type="button" data-bs-target="#fullScreenCarousel" data-bs-slide-to="3"
                    aria-label="Slide 4"></button>
                </div>
              </div>
            </div>
          </div>

          {/* Slide 2 */}
          <div className="carousel-item">
            <div className="slide-content">
              <PageNavbar leftIcon="logo" showProfileIcon={false} />

              <div className="main-content">
                <div className="content-block">
                  <p className="text-lead">
                    Новое поколение инструментов <br />
                    от Rocketmind — интеллектуальные <br />
                    партнёры, которые помогают <br />
                    мыслить стратегически и строить <br />
                    бизнес будущего.
                  </p>
                </div>
                <div style={{ height: '1px' }}>
                  <img src={slide2Img} className="slide-2-img" alt="Графическое изображение" />
                </div>
                <div className="content-block content-block-last" style={{ height: '300px' }}>
                  <div className="feature-item">
                    <img src={vectorImg} alt="" className="feature-icon" />
                    <div className="feature-text">
                      <span>ГЛУБОКО</span>
                      <span>ПОНИМАЮТ СРЕДУ</span>
                    </div>
                  </div>
                  <div className="feature-item">
                    <img src={vectorImg} alt="" className="feature-icon" />
                    <div className="feature-text">
                      <span>ФОРМИРУЮТ</span>
                      <span>БЫСТРЫЕ ГИПОТЕЗЫ</span>
                    </div>
                  </div>
                  <div className="feature-item">
                    <img src={vectorImg} alt="" className="feature-icon" />
                    <div className="feature-text">
                      <span>ВЫЯВЛЯЮТ</span>
                      <span>ВОЗМОЖНОСТИ РОСТА</span>
                    </div>
                  </div>
                  <div className="feature-item">
                    <img src={vectorImg} alt="" className="feature-icon" />
                    <div className="feature-text">
                      <span>УЧАСТВУЮТ</span>
                      <span>В СИСТЕМНОЙ СТРАТЕГИИ</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="button-block">
                <button className="btn-primary next-button" onClick={handleNextSlide}>ДАЛЕЕ</button>
              </div>
              <div className="indicators-container">
                <div className="carousel-indicators">
                  <button type="button" data-bs-target="#fullScreenCarousel" data-bs-slide-to="0"
                    aria-label="Slide 1"></button>
                  <button type="button" data-bs-target="#fullScreenCarousel" data-bs-slide-to="1"
                    className="active" aria-current="true" aria-label="Slide 2"></button>
                  <button type="button" data-bs-target="#fullScreenCarousel" data-bs-slide-to="2"
                    aria-label="Slide 3"></button>
                  <button type="button" data-bs-target="#fullScreenCarousel" data-bs-slide-to="3"
                    aria-label="Slide 4"></button>
                </div>
              </div>
            </div>
          </div>

          {/* Slide 3 */}
          <div className="carousel-item">
            <div className="slide-content">
              <PageNavbar leftIcon="logo" showProfileIcon={false} />

              <div className="main-content">
                <div className="glow"></div>

                <div className="content-block">
                  <h2 className="section-title">ЛИНЕЙКА AI-АГЕНТОВ</h2>
                </div>

                <div className="content-block contentBlockBorderBottom">
                  <div className="agent-card">
                    <img src={slide3UpImg} alt="Сергей" className="agent-image" />
                    <div className="agent-info">
                      <span className="agent-name">СЕРГЕЙ</span>
                      <span className="agent-role">АНАЛИТИК ВНЕШНЕГО <br /> КОНТЕКСТА</span>
                      <p className="agent-description">
                        Исследует и описывает <br />среду, в которой работает <br />бизнес.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="content-block content-block-last">
                  <div className="agent-card">
                    <img src={slide3DownImg} alt="Ник" className="agent-image" />
                    <div className="agent-info">
                      <span className="agent-name">НИК</span>
                      <span className="agent-role">ТЕХНОЛОГИЧЕСКИЙ <br /> ПОДРЫВНИК</span>
                      <p className="agent-description">
                        Отвечает за поиск <br />нестандартных и подрывных <br />бизнес-идей.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="button-block">
                <button className="btn-primary next-button" onClick={handleNextSlide}>ДАЛЕЕ</button>
              </div>
              <div className="indicators-container">
                <div className="carousel-indicators">
                  <button type="button" data-bs-target="#fullScreenCarousel" data-bs-slide-to="0"
                    aria-label="Slide 1"></button>
                  <button type="button" data-bs-target="#fullScreenCarousel" data-bs-slide-to="1"
                    aria-label="Slide 2"></button>
                  <button type="button" data-bs-target="#fullScreenCarousel" data-bs-slide-to="2"
                    className="active" aria-current="true" aria-label="Slide 3"></button>
                  <button type="button" data-bs-target="#fullScreenCarousel" data-bs-slide-to="3"
                    aria-label="Slide 4"></button>
                </div>
              </div>
            </div>
          </div>

          {/* Slide 4 */}
          <div className="carousel-item">
            <div className="slide-content">
              <PageNavbar leftIcon="logo" showProfileIcon={false} />

              <div className="main-content">
                <div className="glow"></div>

                <div className="content-block">
                  <h2 className="section-title">ЛИНЕЙКА AI-АГЕНТОВ</h2>
                </div>

                <div className="content-block contentBlockBorderBottom">
                  <div className="agent-card">
                    <img src={slide4GirlImg} alt="Лида" className="agent-image" />
                    <div className="agent-info">
                      <span className="agent-name">ЛИДА</span>
                      <span className="agent-role">ТЕСТИРОВЩИК <br />ГИПОТЕЗ</span>
                      <p className="agent-description">
                        Быстро формулирует,<br /> приоритизирует и проверяет<br />управленческие
                        гипотезы.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="content-block content-block-last">
                  <div className="agent-card">
                    <img src={slide4BoyImg} alt="Марк" className="agent-image" />
                    <div className="agent-info">
                      <span className="agent-name">МАРК</span>
                      <span className="agent-role">АРХИТЕКТОР <br />БИЗНЕС-МОДЕЛЕЙ</span>
                      <p className="agent-description">
                        Формулирует идеи <br />платформенного развития,<br /> создаёт архитектуру
                        <br />экосистемы продукта.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="button-block">
                <button id="button-go" className="btn-primary" onClick={handleGoToAgents}>НАЧАТЬ</button>
              </div>
              <div className="indicators-container">
                <div className="carousel-indicators">
                  <button type="button" data-bs-target="#fullScreenCarousel" data-bs-slide-to="0"
                    aria-label="Slide 1"></button>
                  <button type="button" data-bs-target="#fullScreenCarousel" data-bs-slide-to="1"
                    aria-label="Slide 2"></button>
                  <button type="button" data-bs-target="#fullScreenCarousel" data-bs-slide-to="2"
                    aria-label="Slide 3"></button>
                  <button type="button" data-bs-target="#fullScreenCarousel" data-bs-slide-to="3"
                    className="active" aria-current="true" aria-label="Slide 4"></button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;