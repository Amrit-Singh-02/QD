import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const VerificationPending = () => {
  const { resend, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email;

  const [countdown, setCountDown] = useState(0);

  useEffect(() => {
    if (!email) {
      navigate("/register");
    }
  }, [email, navigate]);

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountDown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleResend = async () => {
    const result = await resend(email);
    if (result.success) {
      setCountDown(60);
    }
  };

  if (!email) return null;

  return (
    <div className="min-h-screen bg-blinkit-bg flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 justify-center mb-8 group">
          <div className="w-10 h-10 bg-blinkit-green rounded-xl flex items-center justify-center shadow-md">
            <span className="text-white font-black text-lg">B</span>
          </div>
          <h1 className="text-2xl font-extrabold text-blinkit-dark">
            blink<span className="text-blinkit-green">it</span>
          </h1>
        </Link>

        <div className="bg-white rounded-2xl shadow-lg border border-blinkit-border p-8 animate-fade-in-up">
          {/* Email Icon */}
          <div className="w-20 h-20 bg-blinkit-green-light rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-blinkit-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>

          {/* Main Message */}
          <h2 className="text-2xl font-black text-center text-blinkit-dark mb-2">
            Check Your Email 📩
          </h2>
          <p className="text-center text-blinkit-gray mb-1">
            We've sent a verification link to
          </p>
          <p className="text-center font-bold text-blinkit-dark mb-6">
            {email}
          </p>

          {/* Instructions */}
          <div className="bg-blinkit-green-light border border-green-200 rounded-xl p-4 mb-6">
            <h3 className="font-bold text-blinkit-dark mb-2 flex items-center text-sm">
              <svg className="w-5 h-5 text-blinkit-green mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              What's next?
            </h3>
            <ol className="text-sm text-blinkit-gray space-y-1.5 ml-7">
              <li>1. Check your inbox (and spam folder)</li>
              <li>2. Click the verification link in the email</li>
              <li>3. You'll be redirected to login</li>
            </ol>
          </div>

          {/* Resend Section */}
          <div className="text-center mb-6">
            <p className="text-sm text-blinkit-gray mb-3">
              Didn't receive the email?
            </p>
            <button
              onClick={handleResend}
              disabled={loading || countdown > 0}
              className="px-8 py-3 bg-blinkit-green text-white font-bold rounded-xl hover:bg-blinkit-green-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md flex items-center justify-center gap-2 mx-auto"
            >
              {loading ? (
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
                "Resend Verification Email"
              )}
            </button>
          </div>

          {/* Additional Actions */}
          <div className="border-t border-blinkit-border pt-5 space-y-3">
            <Link
              to="/login"
              className="block text-center text-sm font-semibold text-blinkit-green hover:text-blinkit-green-dark transition-colors"
            >
              Already verified? Login here →
            </Link>
            <button
              onClick={() => navigate('/register', { replace: true })}
              className="block w-full text-center text-sm text-blinkit-gray hover:text-blinkit-dark transition-colors"
            >
              Use a different email address
            </button>
          </div>

          {/* Tips */}
          <div className="mt-6 p-4 bg-blinkit-light-gray rounded-xl">
            <p className="text-xs text-blinkit-gray">
              <strong>💡 Tips:</strong> Check your spam/junk folder.
              Add us to your contacts to ensure delivery.
              The verification link expires in 15 minutes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerificationPending;
