import axios from 'axios';

// Для Vite используем import.meta.env
const baseURL = "https://rm-ma-back-rocketmind.amvera.io";

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