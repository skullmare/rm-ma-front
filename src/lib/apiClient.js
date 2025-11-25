import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'https://rm-ma-back-rocketmind.amvera.io',
});

export const setAuthHeader = (token) => {
  if (token) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
    return;
  }

  delete apiClient.defaults.headers.common.Authorization;
};

export default apiClient;


