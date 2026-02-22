import { createContext, useContext, useEffect, useRef, useState } from "react";
import { authService } from "../services/authService";
import { deliveryService } from "../services/deliveryService";
import toast from "react-hot-toast";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
};

export const AuthProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const authCheckIdRef = useRef(0);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const requestId = ++authCheckIdRef.current;
    try {
      setLoading(true);
      setError(null);
      const response = await authService.current();
      if (authCheckIdRef.current !== requestId) {
        return;
      }
      setUser(response.payload);
      setIsAuthenticated(true);
    } catch (error) {
      if (authCheckIdRef.current !== requestId) {
        return;
      }
      try {
        const deliveryResponse = await deliveryService.current();
        if (authCheckIdRef.current !== requestId) {
          return;
        }
        setUser(deliveryResponse?.payload || null);
        setIsAuthenticated(true);
        setError(null);
      } catch (deliveryError) {
        const errMsg = deliveryError.response?.data?.message;
        setUser(null);
        setIsAuthenticated(false);
        setError(errMsg);
        console.log("user not authenticated");
      }
    } finally {
      if (authCheckIdRef.current === requestId) {
        setLoading(false);
      }
    }
  };

  const register = async (userdata) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authService.register(userdata);
      // setUser(response.payload.email)
      toast.success(response.message || "user Registered successfully.");
      console.log(response);
      return { success: true };
    } catch (error) {
      const errMsg = error.response?.data?.message || "Registeration Failed";
      console.log(error.response);
      setError(errMsg);
      toast.error(errMsg);
      return { success: false, error: errMsg };
    } finally {
      setLoading(false);
    }
  };

  const verifyMail = async (emailToken) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authService.verifyEmail(emailToken);
      toast.success(response.message || "Email Verified Successfully.");
      return { success: true ,message:response.message};
    } catch (error) {
      const errMsg = error.response?.data?.message || "Email not verified";
      setError(errMsg);
      toast.error(errMsg);
      return { success: false, error: errMsg };
    } finally {
      setLoading(false);
    }
  };

  const resend = async (email) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authService.resendVerification(email);
      toast.success(response.message || "Verification link resend");
      console.log(response);
      return { success: true };
    } catch (error) {
      const errMsg =
        error.response?.data?.message || "Verification link resend failed";
      console.log(error.response);
      setError(errMsg);
      toast.error(errMsg);
      return { success: false, error: errMsg };
    } finally {
      setLoading(false);
    }
  };

  const login = async (credential, authType = "user") => {
    const requestId = ++authCheckIdRef.current;
    try {
      setLoading(true);
      setError(null);
      const response =
        authType === "delivery"
          ? await deliveryService.login(credential)
          : await authService.login(credential);
      let nextUser = response?.payload;

      if (!nextUser) {
        try {
          const currentResponse =
            authType === "delivery"
              ? await deliveryService.current()
              : await authService.current();
          nextUser = currentResponse?.payload;
        } catch (currentError) {
          console.warn("Failed to fetch current user after login", currentError);
        }
      }

      if (authCheckIdRef.current !== requestId) {
        return { success: false, error: "Stale auth response" };
      }

      setUser(nextUser || null);
      setIsAuthenticated(true);
      console.log(response);
      toast.success(response.message || "Login Successfully");
      return { success: true, data: response, role: authType };
    } catch (error) {
      const errMsg = error.response?.data?.message || "Login Failed";
      setError(errMsg);
      toast.error(errMsg);
      console.log(errMsg);
      return { success: false, error: errMsg };
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword=async(email)=>{
    try {
        setLoading(true);
        setError(null);
        const response=await authService.forgotPass(email);
        console.log(response)
        toast.success(response.message ||'Verification link send');
        return{success:true};
    } catch (error) {
        const errMsg=error.response?.data?.message || 'Failed to send verification link';
        setError(errMsg);
        toast.error(errMsg);
        return{success:false,error:errMsg}
    }finally{
        setLoading(false);
    }
  }

  const resetPassword=async(passwordToken,password)=>{
    try {
        setLoading(true);
        setError(null);
        const response= await authService.resetPassword(passwordToken,password);
        toast.success(response.message || 'Password reset successfully!');
        return {success:true,message: response.message}
    } catch (error) {
        const errMsg=error.response?.data?.message || 'Failed to reset Password';
        setError(errMsg);
        toast.error(errMsg);
        return {success:false,error:errMsg}
    }finally{
        setLoading(false);
    }

  }

  const logout = async () => {
    authCheckIdRef.current += 1;
    try {
      setLoading(true);
      if (user?.role === "delivery") {
        await deliveryService.logout();
      } else if (user) {
        await authService.logout();
      }
      setUser(null);
      setIsAuthenticated(false);
      toast.success("Logged out successfully");
      return { success: true };
    } catch (error) {
      const errMsg = error.response?.data?.message || "Logout failed";
      toast.error(errMsg);
      return { success: false, error: errMsg };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    register,
    login,
    logout,
    checkAuth,
    verifyMail,
    resend,
    forgotPassword,
    resetPassword,
    loading,
    user,
    error,
    isAuthenticated,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
