import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Link } from "react-router-dom";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [resending, setResending] = useState(false);
  
  const [countdown, setCountdown] = useState(0);

  const { forgotPassword, loading } = useAuth();

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await forgotPassword(email);
    if (result.success) {
      setSent(true);
      setCountdown(60);
    }
  };

  const handleResend = async () => {
    try {
      setResending(true);
      const result = await forgotPassword(email);
      if (result.success) {
        setCountdown(60);
      }
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-blinkit-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 justify-center mb-8 group">
          <div className="w-10 h-10 bg-blinkit-green rounded-xl flex items-center justify-center shadow-md">
            <span className="text-white font-black text-lg">B</span>
          </div>
          <h1 className="text-2xl font-extrabold text-blinkit-dark">
            Quick<span className="text-blinkit-green">DROP</span>
          </h1>
        </Link>

        <div className="bg-white rounded-2xl shadow-lg border border-blinkit-border p-8 animate-fade-in-up">

          {/* ✅ EMAIL SENT */}
          {sent && (
            <div className="text-center">
              <div className="w-20 h-20 bg-blinkit-green-light rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-blinkit-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>

              <h2 className="text-2xl font-black text-blinkit-dark mb-2">
                Check Your Email 📩
              </h2>
              <p className="text-blinkit-gray mb-1">
                We've sent a password reset link to
              </p>
              <p className="font-bold text-blinkit-dark mb-6">{email}</p>

              <div className="bg-blinkit-green-light border border-green-200 rounded-xl p-4 mb-6 text-left">
                <h3 className="font-bold text-blinkit-dark mb-2 text-sm">What's next?</h3>
                <ol className="text-sm text-blinkit-gray space-y-1">
                  <li>1. Check your inbox (and spam)</li>
                  <li>2. Click the reset link</li>
                  <li>3. Set a new password</li>
                </ol>
              </div>

              <button
                onClick={handleResend}
                disabled={resending || countdown > 0}
                className="px-8 py-3 bg-blinkit-green text-white font-bold rounded-xl hover:bg-blinkit-green-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md flex items-center justify-center gap-2 mx-auto mb-4"
              >
                {resending ? (
                  <>
                    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Sending...
                  </>
                ) : countdown > 0 ? (
                  `Resend in ${countdown}s`
                ) : (
                  "Resend Reset Link"
                )}
              </button>

              <div className="border-t border-blinkit-border pt-4">
                <Link
                  to="/login"
                  className="text-sm font-semibold text-blinkit-green hover:text-blinkit-green-dark transition-colors"
                >
                  ← Back to Login
                </Link>
              </div>
            </div>
          )}

          {/* 📧 FORM */}
          {!sent && (
            <div>
              <div className="w-20 h-20 bg-blinkit-yellow-light rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-blinkit-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>

              <div className="text-center mb-6">
                <h2 className="text-2xl font-black text-blinkit-dark mb-2">
                  Forgot Password?
                </h2>
                <p className="text-blinkit-gray text-sm">
                  No worries! Enter your email and we'll send you a reset link
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
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
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="w-full pl-11 pr-4 py-3 bg-blinkit-light-gray border border-blinkit-border rounded-xl text-sm placeholder:text-blinkit-gray/60 focus:outline-none focus:ring-2 focus:ring-blinkit-green/30 focus:border-blinkit-green transition-all"
                    />
                  </div>
                </div>

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
                      Sending...
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </button>
              </form>

              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-px bg-blinkit-border" />
                <span className="text-blinkit-gray text-xs font-medium">or</span>
                <div className="flex-1 h-px bg-blinkit-border" />
              </div>

              <Link
                to="/login"
                className="block w-full py-3 text-center border-2 border-blinkit-green text-blinkit-green font-bold rounded-xl hover:bg-blinkit-green-light transition-colors"
              >
                Back to Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
