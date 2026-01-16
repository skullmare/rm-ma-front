// Централизованное хранилище всех маршрутов приложения
export const ROUTES = {
  HOME: '/',
  AGENTS_LIST: '/agents_list',
  AGENT_SERGY: '/agent_sergy',
  AGENT_NICK: '/agent_nick',
  AGENT_LIDA: '/agent_lida',
  AGENT_MARK: '/agent_mark',
  AGENT_DETAIL: '/agent/:agentId', // Динамический маршрут для всех агентов
  CHAT: '/chat',
  PROFILE: '/profile',
  TARIFF: '/tariff',
  PAYMENT_SUCCESS: '/payment-success',
};
