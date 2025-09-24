// api.ts
import axios from "axios";

export const $api = axios.create({
  baseURL: import.meta.env?.VITE_API_URL,
  headers: {
    Accept: "application/json",
  },
});

export const tokenName = "token";

export const initApp = () => {
  const token = localStorage.getItem(tokenName);
  if (token) {
    $api.defaults.headers.common.Authorization = `Bearer ${token}`;
  }
};

export const setToken = (token: string) => {
  localStorage.setItem(tokenName, token);
  $api.defaults.headers.common.Authorization = `Bearer ${token}`;
};

export const removeToken = () => {
  localStorage.removeItem(tokenName);
  delete $api.defaults.headers.common.Authorization;
};
