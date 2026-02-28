import axios from "axios";

const api=axios.create({
    baseURL:'http://localhost:4000/api/v1', //http://localhost:4000/api/v1      https://quickdrop-b.onrender.com/api/v1
    headers:{'Content-Type':'application/json'},
    withCredentials:true
})

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
