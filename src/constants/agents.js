import { IMAGES } from './images';
import { ROUTES } from './routes';

// Централизованные данные о всех агентах
export const AGENTS_DATA = {
  sergey: {
    id: 'sergy',
    name: 'СЕРГЕЙ',
    role: 'АНАЛИТИК ВНЕШНЕГО КОНТЕКСТА',
    roleWithBreaks: 'АНАЛИТИК ВНЕШНЕГО\nКОНТЕКСТА',
    image: IMAGES.AGENT_SERGY,
    description: `Исследует и описывает среду,
в которой работает бизнес:
технологии, рынок, конкурентов
и макроэкономику.

Быстро формирует картину
«внешнего поля», выделяет тренды,
риски и возможности, влияющие
на стратегию компании.`,
    route: ROUTES.AGENT_SERGY,
    chatAgent: 'sergy',
  },
  nick: {
    id: 'nick',
    name: 'НИК',
    role: 'ТЕХНОЛОГИЧЕСКИЙ ПОДРЫВНИК',
    roleWithBreaks: 'ТЕХНОЛОГИЧЕСКИЙ\nПОДРЫВНИК',
    image: IMAGES.AGENT_NICK,
    description: `Отвечает за поиск нестандартных
и подрывных идей, способных
изменить бизнес-модель
или открыть новые направления
роста.

Анализирует отрасль, выявляет
неожиданные инсайты и помогает
выстроить вторую траекторию
развития компании.`,
    route: ROUTES.AGENT_NICK,
    chatAgent: 'nick',
  },
  lida: {
    id: 'lida',
    name: 'ЛИДА',
    role: 'ТЕСТИРОВЩИК ГИПОТЕЗ',
    roleWithBreaks: 'ТЕСТИРОВЩИК\nГИПОТЕЗ',
    image: IMAGES.AGENT_LIDA,
    description: `Помогает быстро формулировать,
приоритизировать и проверять
управленческие гипотезы по методике Rocketmind.

Определяет метрики успеха,
предлагает форматы
экспериментов и делает выводы,
превращая идеи в конкретные
управленческие решения.`,
    route: ROUTES.AGENT_LIDA,
    chatAgent: 'lida',
  },
  mark: {
    id: 'mark',
    name: 'МАРК',
    role: 'АРХИТЕКТОР БИЗНЕС-МОДЕЛЕЙ',
    roleWithBreaks: 'АРХИТЕКТОР\nБИЗНЕС-МОДЕЛЕЙ',
    image: IMAGES.AGENT_MARK,
    description: `Формулирует идеи платформенного
развития, помогает определить
роли участников, сценарии монетизации и взаимодействия.

Создаёт архитектуру экосистемы
продукта, объединяя ценность,
технологию и стратегию в единую модель бизнеса.`,
    route: ROUTES.AGENT_MARK,
    chatAgent: 'mark',
  },
};

// Массив агентов для итерации
export const AGENTS_LIST = Object.values(AGENTS_DATA);

// Получить агента по ID
export const getAgentById = (agentId) => {
  return AGENTS_DATA[agentId] || null;
};
