import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Link, useLocation, useNavigate } from "react-router-dom";

const Login = () => {
  const { login, loading, sendOtp, verifyOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [loginRole, setLoginRole] = useState("user");
  const [loginMethod, setLoginMethod] = useState("password");
  const [phoneData, setPhoneData] = useState({
    phone: "",
    code: "",
  });
  const [otpSent, setOtpSent] = useState(false);
  const [otpErrors, setOtpErrors] = useState({});
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const roleParam = params.get("role");
    if (roleParam === "delivery") {
      setLoginRole("delivery");
    } else {
      setLoginRole("user");
    }
  }, [location.search]);

  useEffect(() => {
    if (loginRole === "delivery") {
      setLoginMethod("password");
      setOtpSent(false);
      setOtpErrors({});
    }
  }, [loginRole]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear error on change
    if (formErrors[e.target.name]) {
      setFormErrors({ ...formErrors, [e.target.name]: "" });
    }
  };

  const handleLoginMethodChange = (method) => {
    setLoginMethod(method);
    setFormErrors({});
    setOtpErrors({});
  };

  const handlePhoneChange = (e) => {
    setPhoneData({
      ...phoneData,
      [e.target.name]: e.target.value,
    });
    if (otpErrors[e.target.name]) {
      setOtpErrors({ ...otpErrors, [e.target.name]: "" });
    }
  };

  const validatePhoneOnly = () => {
    const errors = {};
    const phone = phoneData.phone.trim();

    if (!phone) {
      errors.phone = "Mobile number is required";
    } else if (!/^[6-9]\d{9}$/.test(phone)) {
      errors.phone = "Enter a valid 10-digit mobile number starting with 6-9";
    }

    setOtpErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validatePhoneAndCode = () => {
    const errors = {};
    const phone = phoneData.phone.trim();

    if (!phone) {
      errors.phone = "Mobile number is required";
    } else if (!/^[6-9]\d{9}$/.test(phone)) {
      errors.phone = "Enter a valid 10-digit mobile number starting with 6-9";
    }

    if (!phoneData.code.trim()) {
      errors.code = "OTP is required";
    } else if (phoneData.code.trim().length < 4) {
      errors.code = "Enter a valid OTP";
    }

    setOtpErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSendOtp = async () => {
    if (!validatePhoneOnly()) return;
    setOtpSending(true);
    const result = await sendOtp(phoneData.phone.trim());
    setOtpSending(false);
    if (result.success) {
      setOtpSent(true);
      setPhoneData((prev) => ({ ...prev, code: "" }));
    }
  };

  const handleVerifyOtp = async () => {
    if (!validatePhoneAndCode()) return;
    setOtpVerifying(true);
    const result = await verifyOtp({
      phone: phoneData.phone.trim(),
      code: phoneData.code.trim(),
    });
    setOtpVerifying(false);

    if (result.success) {
      setPhoneData({ phone: "", code: "" });
      setOtpSent(false);
      navigate("/");
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 3) {
      errors.password = "Password must be at least 3 characters";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const result = await login(formData, loginRole);
    if (result.success) {
      setFormData({ email: "", password: "" });
      navigate(loginRole === "delivery" ? "/delivery/dashboard" : "/");
    }
  };

  return (
    <div className="min-h-screen bg-blinkit-bg flex">
      {/* Left illustration panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blinkit-green via-emerald-600 to-green-700 relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-blinkit-yellow rounded-full blur-3xl" />
        </div>
        <div className="relative text-center text-white z-10 animate-fade-in-up">
          <span className="text-[120px] block mb-6 select-none animate-pulse-soft">🛒</span>
          <h2 className="text-4xl font-black mb-4">
            {loginRole === "delivery" ? "Delivery crew" : "Welcome back!"}
          </h2>
          <p className="text-white/80 text-lg max-w-sm mx-auto leading-relaxed">
            {loginRole === "delivery"
              ? "Sign in to receive orders, share live location, and complete deliveries fast."
              : "Login to explore thousands of products and get them delivered to your doorstep in minutes."}
          </p>
          {loginRole !== "delivery" && (
            <div className="flex gap-6 justify-center mt-8">
            <div className="text-center">
              <p className="text-3xl font-black text-blinkit-yellow">10 min</p>
              <p className="text-white/60 text-xs mt-1">delivery</p>
            </div>
            <div className="w-px bg-white/20" />
            <div className="text-center">
              <p className="text-3xl font-black text-blinkit-yellow">5000+</p>
              <p className="text-white/60 text-xs mt-1">products</p>
            </div>
            <div className="w-px bg-white/20" />
            <div className="text-center">
              <p className="text-3xl font-black text-blinkit-yellow">₹0</p>
              <p className="text-white/60 text-xs mt-1">delivery fee</p>
            </div>
            </div>
          )}
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md animate-fade-in-up">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 mb-8 group">
            <div className="w-10 h-10 bg-blinkit-green rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
              <span className="text-white font-black text-lg">B</span>
            </div>
            <h1 className="text-2xl font-extrabold text-blinkit-dark">
              blink<span className="text-blinkit-green">it</span>
            </h1>
          </Link>

          <h2 className="text-3xl font-black text-blinkit-dark mb-2">Sign In</h2>
          <p className="text-blinkit-gray mb-6">
            {loginRole === "delivery"
              ? "Delivery agent access portal"
              : "Enter your credentials to access your account"}
          </p>

          <div className="flex items-center gap-2 bg-blinkit-light-gray p-1 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => setLoginRole("user")}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors ${
                loginRole === "user"
                  ? "bg-white text-blinkit-dark shadow-sm"
                  : "text-blinkit-gray"
              }`}
            >
              Customer / Admin
            </button>
            <button
              type="button"
              onClick={() => setLoginRole("delivery")}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors ${
                loginRole === "delivery"
                  ? "bg-white text-blinkit-dark shadow-sm"
                  : "text-blinkit-gray"
              }`}
            >
              Delivery Agent
            </button>
          </div>

          {loginRole !== "delivery" && (
            <div className="flex items-center gap-2 bg-blinkit-light-gray p-1 rounded-xl mb-6">
              <button
                type="button"
                onClick={() => handleLoginMethodChange("password")}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors ${
                  loginMethod === "password"
                    ? "bg-white text-blinkit-dark shadow-sm"
                    : "text-blinkit-gray"
                }`}
              >
                Email & Password
              </button>
              <button
                type="button"
                onClick={() => handleLoginMethodChange("phone")}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors ${
                  loginMethod === "phone"
                    ? "bg-white text-blinkit-dark shadow-sm"
                    : "text-blinkit-gray"
                }`}
              >
                Phone OTP
              </button>
            </div>
          )}

          {loginMethod === "password" || loginRole === "delivery" ? (
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-blinkit-dark mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-blinkit-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className={`w-full pl-11 pr-4 py-3 bg-blinkit-light-gray border rounded-xl text-sm placeholder:text-blinkit-gray/60 focus:outline-none focus:ring-2 focus:ring-blinkit-green/30 focus:border-blinkit-green transition-all ${formErrors.email ? 'border-red-400 focus:ring-red-200 focus:border-red-400' : 'border-blinkit-border'}`}
                />
              </div>
              {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-blinkit-dark mb-1.5">
                Password
              </label>
              <div className="relative">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-blinkit-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`w-full pl-11 pr-12 py-3 bg-blinkit-light-gray border rounded-xl text-sm placeholder:text-blinkit-gray/60 focus:outline-none focus:ring-2 focus:ring-blinkit-green/30 focus:border-blinkit-green transition-all ${formErrors.password ? 'border-red-400 focus:ring-red-200 focus:border-red-400' : 'border-blinkit-border'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-blinkit-gray hover:text-blinkit-dark transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {formErrors.password && <p className="text-red-500 text-xs mt-1">{formErrors.password}</p>}
            </div>

            {/* Forgot password */}
            {loginRole === "delivery" ? (
              <div className="text-xs text-blinkit-gray text-right">
                Delivery accounts are managed by admins.
              </div>
            ) : (
              <div className="flex justify-end">
                <Link
                  to="/forgot-password"
                  className="text-sm font-semibold text-blinkit-green hover:text-blinkit-green-dark transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-blinkit-green text-white font-bold rounded-xl hover:bg-blinkit-green-dark transition-all shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
            </form>
        ) : (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-blinkit-dark mb-1.5">
                Mobile Number
              </label>
              <div className="relative">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-blinkit-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <input
                  type="tel"
                  name="phone"
                  value={phoneData.phone}
                  onChange={handlePhoneChange}
                  placeholder="9876543210"
                  maxLength={10}
                  className={`w-full pl-11 pr-4 py-3 bg-blinkit-light-gray border rounded-xl text-sm placeholder:text-blinkit-gray/60 focus:outline-none focus:ring-2 focus:ring-blinkit-green/30 focus:border-blinkit-green transition-all ${otpErrors.phone ? 'border-red-400 focus:ring-red-200 focus:border-red-400' : 'border-blinkit-border'}`}
                />
              </div>
              {otpErrors.phone && <p className="text-red-500 text-xs mt-1">{otpErrors.phone}</p>}
              {!otpErrors.phone && (
                <p className="text-blinkit-gray text-xs mt-1">We'll text you a 6-digit code.</p>
              )}
            </div>

            <button
              type="button"
              onClick={handleSendOtp}
              disabled={otpSending}
              className="w-full py-3.5 border-2 border-blinkit-green text-blinkit-green font-bold rounded-xl hover:bg-blinkit-green-light transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {otpSending ? "Sending OTP..." : otpSent ? "Resend OTP" : "Send OTP"}
            </button>

            {otpSent && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-blinkit-dark mb-1.5">
                    OTP Code
                  </label>
                  <div className="relative">
                    <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-blinkit-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <input
                      type="text"
                      name="code"
                      value={phoneData.code}
                      onChange={handlePhoneChange}
                      placeholder="Enter OTP"
                      maxLength={6}
                      inputMode="numeric"
                      className={`w-full pl-11 pr-4 py-3 bg-blinkit-light-gray border rounded-xl text-sm placeholder:text-blinkit-gray/60 focus:outline-none focus:ring-2 focus:ring-blinkit-green/30 focus:border-blinkit-green transition-all ${otpErrors.code ? 'border-red-400 focus:ring-red-200 focus:border-red-400' : 'border-blinkit-border'}`}
                    />
                  </div>
                  {otpErrors.code && <p className="text-red-500 text-xs mt-1">{otpErrors.code}</p>}
                </div>

                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={otpVerifying}
                  className="w-full py-3.5 bg-blinkit-green text-white font-bold rounded-xl hover:bg-blinkit-green-dark transition-all shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {otpVerifying ? (
                    <>
                      <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Verifying...
                    </>
                  ) : (
                    "Verify & Sign In"
                  )}
                </button>
              </>
            )}

            {!otpSent && (
              <p className="text-xs text-blinkit-gray text-center">
                We'll create an account if this number is new.
              </p>
            )}
          </div>
        )}

          {loginRole === "delivery" ? (
            <div className="mt-8 text-center text-xs text-blinkit-gray">
              Delivery agents are created by admins.
            </div>
          ) : (
            <>
              <div className="flex items-center gap-4 my-8">
                <div className="flex-1 h-px bg-blinkit-border" />
                <span className="text-blinkit-gray text-xs font-medium">
                  New to blinkit?
                </span>
                <div className="flex-1 h-px bg-blinkit-border" />
              </div>

              <Link
                to="/register"
                className="block w-full py-3.5 text-center border-2 border-blinkit-green text-blinkit-green font-bold rounded-xl hover:bg-blinkit-green-light transition-colors"
              >
                Create an Account
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
