import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";

const Registration = () => {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    // Clear error on change
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: "" });
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = "Name is required";
    } else if (formData.name.trim().length > 75) {
      errors.name = "Name must be less than 75 characters";
    }

    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }

    if (!formData.phone.trim()) {
      errors.phone = "Mobile number is required";
    } else if (!/^[6-9]\d{9}$/.test(formData.phone)) {
      errors.phone = "Enter a valid 10-digit mobile number starting with 6-9";
    }

    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 3) {
      errors.password = "Password must be at least 3 characters";
    } else if (formData.password.length > 50) {
      errors.password = "Password must be less than 50 characters";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const result = await register(formData);
    if (result.success) {
      const emailForPending = formData.email;
      setFormData({ name: "", email: "", password: "", phone: "" });
      navigate("/verification-pending", {
        state: { email: emailForPending },
        replace: true,
      });
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
          <span className="text-[120px] block mb-6 select-none animate-pulse-soft">🛍️</span>
          <h2 className="text-4xl font-black mb-4">Join blinkit!</h2>
          <p className="text-white/80 text-lg max-w-sm mx-auto leading-relaxed">
            Create your account and start shopping for groceries, fresh produce, and essentials right away.
          </p>
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
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
        <div className="w-full max-w-md animate-fade-in-up">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 mb-6 group">
            <div className="w-10 h-10 bg-blinkit-green rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
              <span className="text-white font-black text-lg">B</span>
            </div>
            <h1 className="text-2xl font-extrabold text-blinkit-dark">
              blink<span className="text-blinkit-green">it</span>
            </h1>
          </Link>

          <h2 className="text-3xl font-black text-blinkit-dark mb-2">Create Account</h2>
          <p className="text-blinkit-gray mb-6">Start ordering your groceries in minutes</p>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Name */}
            <div>
              <label className="block text-sm font-semibold text-blinkit-dark mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-blinkit-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className={`w-full pl-11 pr-4 py-3 bg-blinkit-light-gray border rounded-xl text-sm placeholder:text-blinkit-gray/60 focus:outline-none focus:ring-2 focus:ring-blinkit-green/30 focus:border-blinkit-green transition-all ${formErrors.name ? 'border-red-400 focus:ring-red-200 focus:border-red-400' : 'border-blinkit-border'}`}
                />
              </div>
              {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
            </div>

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

            {/* Phone */}
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
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="9876543210"
                  maxLength={10}
                  className={`w-full pl-11 pr-4 py-3 bg-blinkit-light-gray border rounded-xl text-sm placeholder:text-blinkit-gray/60 focus:outline-none focus:ring-2 focus:ring-blinkit-green/30 focus:border-blinkit-green transition-all ${formErrors.phone ? 'border-red-400 focus:ring-red-200 focus:border-red-400' : 'border-blinkit-border'}`}
                />
              </div>
              {formErrors.phone && <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>}
              {!formErrors.phone && <p className="text-blinkit-gray text-xs mt-1">10-digit Indian mobile number</p>}
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
              {!formErrors.password && <p className="text-blinkit-gray text-xs mt-1">Must be at least 3 characters</p>}
            </div>

            {/* Terms */}
            <p className="text-xs text-blinkit-gray leading-relaxed">
              By creating an account, you agree to our{" "}
              <a href="#" className="text-blinkit-green font-semibold hover:underline">Terms of Service</a>{" "}
              and{" "}
              <a href="#" className="text-blinkit-green font-semibold hover:underline">Privacy Policy</a>
            </p>

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
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-blinkit-border" />
            <span className="text-blinkit-gray text-xs font-medium">Already have an account?</span>
            <div className="flex-1 h-px bg-blinkit-border" />
          </div>

          {/* Login link */}
          <Link
            to="/login"
            className="block w-full py-3.5 text-center border-2 border-blinkit-green text-blinkit-green font-bold rounded-xl hover:bg-blinkit-green-light transition-colors"
          >
            Sign In Instead
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Registration;
