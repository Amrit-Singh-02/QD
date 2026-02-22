import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';

const ResendVerification = () => {
  const [email, setEmail] = useState('');
  const { resend, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email');
      return;
    }
    const result = await resend(email);
    if (result.success) {
      navigate('/verification-pending', {
        state: { email },
      });
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
            blink<span className="text-blinkit-green">it</span>
          </h1>
        </Link>

        <div className="bg-white rounded-2xl shadow-lg border border-blinkit-border p-8 animate-fade-in-up">
          {/* Icon */}
          <div className="w-20 h-20 bg-blinkit-yellow-light rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-blinkit-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>

          <div className="text-center mb-6">
            <h2 className="text-2xl font-black text-blinkit-dark mb-2">
              Resend Verification Link
            </h2>
            <p className="text-blinkit-gray text-sm">
              Enter your email to receive a new verification link
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-blinkit-dark mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-blinkit-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <input
                  id="email"
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
                "Send Verification Link"
              )}
            </button>
          </form>

          {/* Back links */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-blinkit-border" />
            <span className="text-blinkit-gray text-xs font-medium">or</span>
            <div className="flex-1 h-px bg-blinkit-border" />
          </div>

          <div className="space-y-3">
            <Link
              to="/login"
              className="block w-full py-3 text-center border-2 border-blinkit-green text-blinkit-green font-bold rounded-xl hover:bg-blinkit-green-light transition-colors"
            >
              Back to Login
            </Link>
            <Link
              to="/register"
              className="block w-full text-center text-sm text-blinkit-gray hover:text-blinkit-dark transition-colors"
            >
              Create a new account →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResendVerification;
