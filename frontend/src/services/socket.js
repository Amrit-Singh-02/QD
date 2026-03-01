import { io } from "socket.io-client";

const stripTrailingSlash = (value) => value.replace(/\/+$/, "");
const stripApiSuffix = (value) =>
  value.replace(/\/api\/v\d+\/?$/i, "");

export const getSocketUrl = () => {
  const explicit = import.meta.env.VITE_SOCKET_URL;
  if (explicit) return stripTrailingSlash(explicit);

  const apiBase = import.meta.env.VITE_API_URL;
  if (apiBase) {
    return stripTrailingSlash(stripApiSuffix(apiBase));
  }

  if (import.meta.env.DEV) {
    return "http://localhost:4000";
  }

  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }

  return "http://localhost:4000";
};

export const createSocket = () =>
  io(getSocketUrl(), {
    transports: ["websocket", "polling"],
  });
