import axios from 'axios';

// Для Vite используем import.meta.env
const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

const apiClient = axios.create({
  baseURL: baseURL,
});

const INIT_DATA_HEADER = 'X-Telegram-Init-Data';

export const setInitDataHeader = (initData) => {
  if (initData) {
    apiClient.defaults.headers.common[INIT_DATA_HEADER] = initData;
    return;
  }

  delete apiClient.defaults.headers.common[INIT_DATA_HEADER];
};

export default apiClient;