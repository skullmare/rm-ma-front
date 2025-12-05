import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'https://rm-ma-back-rocketmind.amvera.io',
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






