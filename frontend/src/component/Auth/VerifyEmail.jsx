import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const VerifyEmail = () => {
  const { verifyMail } = useAuth();
  const { emailToken } = useParams();
  const navigate = useNavigate();
  const [successMessage, setSuccessMessage] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isActive = true;

    const verify = async () => {
      if (!emailToken) {
        if (!isActive) return;
        setStatus('error');
        setErrorMessage('Invalid verification link.');
        return;
      }

      setStatus('loading');
      const result = await verifyMail(emailToken);
      if (!isActive) return;

      if (result?.success) {
        setSuccessMessage(result.message || 'Email verified successfully.');
        setCountdown(3);
        setStatus('success');
      } else {
        setStatus('error');
        setErrorMessage(result?.error || 'Verification failed.');
      }
    };

    verify();

    return () => {
      isActive = false;
    };
  }, [emailToken, verifyMail]);

  // Countdown for redirect
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
    if (countdown === 0 && successMessage) {
      navigate('/login');
    }
  }, [countdown, successMessage, navigate]);

  return (
    <div className="min-h-screen bg-blinkit-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 justify-center mb-8 group">
          <div className="w-10 h-10 bg-blinkit-green rounded-xl flex items-center justify-center shadow-md">
            <span className="text-white font-black text-lg">B</span>
          </div>
          <h1 className="text-2xl font-extrabold text-blinkit-dark">
            blink<span className="text-blinkit-green">it</span>
          </h1>
        </Link>

        <div className="bg-white rounded-2xl shadow-lg border border-blinkit-border p-8 text-center animate-fade-in-up">

          {/* LOADING */}
          {status === 'loading' && (
            <>
              <div className="w-20 h-20 bg-blinkit-green-light rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="animate-spin w-10 h-10 text-blinkit-green" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
              <h2 className="text-2xl font-black text-blinkit-dark mb-2">
                Verifying Your Email
              </h2>
              <p className="text-blinkit-gray">Please wait while we verify your email address...</p>
            </>
          )}

          {/* SUCCESS */}
          {status === 'success' && successMessage && (
            <>
              <div className="w-20 h-20 bg-blinkit-green-light rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-blinkit-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-black text-blinkit-dark mb-2">
                Email Verified! ✅
              </h2>
              <p className="text-blinkit-gray mb-4">{successMessage}</p>

              <div className="bg-blinkit-green-light rounded-xl p-4 mb-6">
                <p className="text-blinkit-green font-semibold text-sm">
                  Redirecting to login in {countdown} second{countdown !== 1 && 's'}...
                </p>
              </div>

              <Link
                to="/login"
                className="inline-block px-8 py-3 bg-blinkit-green text-white font-bold rounded-xl hover:bg-blinkit-green-dark transition-all shadow-lg hover:shadow-xl"
              >
                Go to Login Now
              </Link>
            </>
          )}

          {/* ERROR */}
          {status === 'error' && (
            <>
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-2xl font-black text-blinkit-dark mb-2">
                Verification Failed
              </h2>
              <p className="text-blinkit-gray mb-6">{errorMessage}</p>

              <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-6">
                <p className="text-red-600 text-sm">
                  The verification link may have expired or already been used. Please request a new one.
                </p>
              </div>

              <div className="space-y-3">
                <Link
                  to="/resend-verification"
                  className="block w-full py-3.5 bg-blinkit-green text-white font-bold rounded-xl hover:bg-blinkit-green-dark transition-all shadow-lg text-center"
                >
                  Request New Link
                </Link>
                <Link
                  to="/login"
                  className="block w-full py-3.5 border-2 border-blinkit-border text-blinkit-dark font-semibold rounded-xl hover:bg-blinkit-light-gray transition-colors text-center"
                >
                  Back to Login
                </Link>
              </div>
            </>
          )}

          {status === 'idle' && (
            <>
              <div className="w-20 h-20 bg-blinkit-light-gray rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-blinkit-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6v6l4 2" />
                </svg>
              </div>
              <h2 className="text-2xl font-black text-blinkit-dark mb-2">
                Preparing Verification
              </h2>
              <p className="text-blinkit-gray">Getting things ready...</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
