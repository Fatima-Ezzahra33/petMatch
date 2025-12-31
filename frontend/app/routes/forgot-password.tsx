import { useState } from 'react';
import { Link } from 'react-router';
import { authService } from '~/api/authService';
import { useTheme } from '~/contexts/themeContext';

export const meta = () => {
  return [
    { title: "Forgot Password - PetMatch" },
    { name: "description", content: "Reset your PetMatch password" },
  ];
};

export default function ForgotPassword() {
  const { isDarkMode } = useTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const result = await authService.forgotPassword({ email });
      setMessage({
        type: 'success',
        text: result.message || 'Password reset link sent to your email!',
      });
      setEmail('');
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to send reset link',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start lg:justify-center p-4 sm:p-8 pt-6 lg:pt-0 lg:-mt-10">
      <div
        className="w-full max-w-md rounded-3xl overflow-hidden shadow-2xl p-8"
        style={{ backgroundColor: isDarkMode ? "rgb(115,101,91,0.31)" : "rgb(255,255,255,0.3)" }}
      >
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img
            src={
              isDarkMode
                ? "/pet-MatchWhite.png"
                : "/pet-MatchBlack.png"
            }
            alt="PetMatch"
            className="w-32"
          />
        </div>

        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ backgroundColor: isDarkMode ? "rgba(217, 119, 6, 0.2)" : "rgba(217, 119, 6, 0.1)" }}
          >
            <svg
              className="w-10 h-10"
              style={{ color: "#d97706" }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
        </div>

        <h2 
          className="text-3xl font-bold text-center mb-3"
          style={{ color: isDarkMode ? "#F7F5EA" : "#36332E" }}
        >
          Forgot Password?
        </h2>
        <p 
          className="text-center mb-8"
          style={{ color: isDarkMode ? '#d1d5db' : '#6b7280' }}
        >
          Enter your email and we'll send you a reset link
        </p>

        {message && (
          <div
            className="mb-6 p-4 rounded-lg"
            style={{
              backgroundColor: message.type === 'success' 
                ? (isDarkMode ? "rgba(16, 185, 129, 0.1)" : "#d1fae5")
                : (isDarkMode ? "rgba(239, 68, 68, 0.1)" : "#fef2f2"),
              border: `1px solid ${
                message.type === 'success'
                  ? (isDarkMode ? "rgba(16, 185, 129, 0.3)" : "#6ee7b7")
                  : (isDarkMode ? "rgba(239, 68, 68, 0.3)" : "#fecaca")
              }`,
              color: message.type === 'success'
                ? (isDarkMode ? "#6ee7b7" : "#065f46")
                : (isDarkMode ? "#fca5a5" : "#b91c1c"),
            }}
          >
            <div className="flex items-center">
              {message.type === 'success' ? (
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
              <span className="text-sm font-medium">{message.text}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label 
              htmlFor="email" 
              className="block mb-2"
              style={{ color: isDarkMode ? "#F7F5EA" : "#36332E" }}
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="example@gmail.com"
              className="w-full px-4 py-3 outline-none bg-transparent transition-colors border-b-2 focus:border-amber-600"
              style={{
                borderBottomColor: isDarkMode ? '#928e85' : '#d1d5db',
                color: isDarkMode ? '#F7F5EA' : '#36332E'
              }}
              onFocus={(e) => (e.target as HTMLInputElement).style.borderBottomColor = '#d97706'}
              onBlur={(e) => (e.target as HTMLInputElement).style.borderBottomColor = isDarkMode ? '#928e85' : '#d1d5db'}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full font-semibold py-3 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: '#d97706',
              color: '#F7F5EA'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                (e.target as HTMLButtonElement).style.backgroundColor = '#b45309';
              }
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.backgroundColor = '#d97706';
            }}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                SENDING...
              </span>
            ) : (
              'SEND RESET LINK'
            )}
          </button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <Link 
            to="/login" 
            className="block text-sm font-medium hover:underline"
            style={{ color: "#d97706" }}
          >
            ← Back to Login
          </Link>
          <div 
            className="text-sm"
            style={{ color: isDarkMode ? '#d1d5db' : '#6b7280' }}
          >
            Don't have an account?{' '}
            <Link 
              to="/register" 
              className="font-semibold hover:underline"
              style={{ color: "#d97706" }}
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}