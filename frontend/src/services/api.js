import axios from "axios";

const envApiBase = import.meta.env.VITE_API_URL || '';
const envSocketBase = import.meta.env.VITE_SOCKET_URL;
const socketFallback = envSocketBase
  ? `${envSocketBase.replace(/\/+$/, "")}/api/v1`
  : null;
const defaultBase =
  import.meta.env.DEV
    ? "http://localhost:4000/api/v1"
    : typeof window !== "undefined" && window.location?.origin
      ? `${window.location.origin}/api/v1`
      : "http://localhost:4000/api/v1";

const baseURL = (envApiBase || socketFallback || defaultBase).replace(/\/+$/, "");

const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

// api.interceptors.response.use(
//     (response)=>response,
//     (error)=>{
//         if(error.response?.status===401){
//             window.location.href='/login';
//         }
//         return Promise.reject(error)
//     }

    
// );

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't throw, just return rejected promise
      return Promise.reject(error);
    }
    return Promise.reject(error);
  }
);

export default api;
