import api from "./api";

export const authService = {
  // ~ Register
  register: async (userdata) => {
    const response = await api.post("/user/register", userdata);
    return response.data;
  },
  // ~ Verify email
  verifyEmail: async (emailToken) => {
    const response = await api.get(`/user/verify-email/${emailToken}`);
    return response.data;
  },
  // ~ Resend verification
  resendVerification: async (email) => {
    const response = await api.post("/user/resend-verification", { email });
    return response.data;
  },

  // ~ Login
  login: async (credentials) => {
    const response = await api.post("/user/login", credentials);
    return response.data;
  },

  // ~ logout
  logout: async () => {
    const response = await api.post("/user/logout");
    return response.data;
  },

  // ~ update profile
  updateProfile: async (updatedData) => {
    const response = await api.patch("/user/update-profile", updatedData);
    return response.data;
  },

  // ~ update password
  updatePassword: async (password) => {
    const response = await api.patch("/user/update-password", password);
    return response.data;
  },

  // ~ forgot password
  forgotPass: async (email) => {
    const response = await api.post("/user/forgot-password", {email});
    return response.data;
  },

  // ~ Reset Password
  resetPassword: async ( passwordToken,password) => {
    const response = await api.post(
      `/user/reset-password/${passwordToken}`,
     password,
    );
    return response.data;
  },

  // ~ Current
  current: async () => {
    const response = await api.get("/user/current");
    return response.data;
  },
};
