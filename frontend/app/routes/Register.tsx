// app/routes/register.tsx
import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '~/contexts/auth';
import { authService } from '~/api/authService';
import { useTheme } from '~/contexts/themeContext';

export const meta = () => {
  return [
    { title: "Register - PetMatch" },
    { name: "description", content: "Create your PetMatch account" },
  ];
};

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { isDarkMode } = useTheme();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // New states for verification
  const [showSuccess, setShowSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [countdown, setCountdown] = useState(60);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  // Countdown effect
  useEffect(() => {
    if (showSuccess && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown, showSuccess]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!acceptTerms) {
      setError('Please accept the terms & conditions');
      return;
    }

    if (formData.password !== formData.password_confirmation) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await register(formData);
      setRegisteredEmail(formData.email);
      setShowSuccess(true);
      setCountdown(60);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setResendLoading(true);
    setResendMessage("");
    
    try {
      const result = await authService.resendVerificationEmail(registeredEmail);
      setResendMessage(result.message);
      setCountdown(120);
    } catch (err: any) {
      setResendMessage(err.message || "Failed to resend email");
    } finally {
      setResendLoading(false);
    }
  };

  // Success screen after registration
  if (showSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8" style={{ backgroundColor: isDarkMode ? '#36332E' : '#F7F5EA' }}>
        <div
          className="w-full max-w-md rounded-3xl overflow-hidden shadow-2xl p-8"
          style={{ backgroundColor: isDarkMode ? "rgb(115,101,91,0.31)" : "#F7F5EA" }}
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

          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ backgroundColor: isDarkMode ? "#065f46" : "#d1fae5" }}
            >
              <span className="text-4xl">✓</span>
            </div>
          </div>

          {/* Success Message */}
          <h1
            className="text-2xl font-bold text-center mb-4"
            style={{ color: isDarkMode ? "#F7F5EA" : "#36332E" }}
          >
            Registration Succeeded!
          </h1>

          <p
            className="text-center mb-6"
            style={{ color: isDarkMode ? '#d1d5db' : '#6b7280' }}
          >
            Please verify your email address. We've sent a verification link to{" "}
            <span className="font-semibold" style={{ color: "#d97706" }}>
              {registeredEmail}
            </span>
          </p>

          {/* Resend Message */}
          {resendMessage && (
            <div
              className="px-4 py-3 rounded-lg mb-4 text-sm text-center"
              style={{
                backgroundColor: resendMessage.includes("failed") || resendMessage.includes("wait")
                  ? (isDarkMode ? "rgba(239, 68, 68, 0.1)" : "#fef2f2")
                  : (isDarkMode ? "#065f46" : "#d1fae5"),
                border: `1px solid ${
                  resendMessage.includes("failed") || resendMessage.includes("wait")
                    ? (isDarkMode ? "rgba(239, 68, 68, 0.3)" : "#fecaca")
                    : (isDarkMode ? "#059669" : "#6ee7b7")
                }`,
                color: resendMessage.includes("failed") || resendMessage.includes("wait")
                  ? (isDarkMode ? "#fca5a5" : "#b91c1c")
                  : (isDarkMode ? "#d1fae5" : "#065f46"),
              }}
            >
              {resendMessage}
            </div>
          )}

          {/* Resend Button */}
          <button
            onClick={handleResendEmail}
            disabled={countdown > 0 || resendLoading}
            className="w-full font-semibold py-3 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-6"
            style={{
              backgroundColor: countdown > 0 ? "#9ca3af" : "#d97706",
              color: "#F7F5EA",
            }}
          >
            {resendLoading
              ? "Sending..."
              : countdown > 0
              ? `Resend email in ${countdown}s`
              : "Resend verification email"}
          </button>

          {/* Back to Login */}
          <div className="text-center text-sm">
            <Link
              to="/login"
              className="font-semibold hover:underline"
              style={{ color: "#d97706" }}
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Original registration form
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8" style={{ backgroundColor: isDarkMode ? '#36332E' : '#F7F5EA' }}>
      {/* Rounded Container */}
      <div
        className="w-full max-w-4xl sm:max-w-full min-h-[600px] sm:h-[800px] rounded-3xl overflow-hidden shadow-2xl"
        style={{ backgroundColor: isDarkMode ? "rgb(115,101,91,0.31)" : "rgb(255,255,255,0.3)" }}
      >
        <div className="flex flex-col lg:flex-row h-full">
          {/* Left side - Image */}
          <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br items-center justify-center">
            <img
              src="register.jpg"
              alt="Cute pets"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Right side - Form */}
          <div className="lg:w-1/2 h-full flex justify-center p-8 pt-12 lg:pt-0">
            <div className="w-full max-w-md lg:my-auto">
              {/* Logo */}
              <div className="flex-col justify-center items-center mb-12">
                <img
                  src={
                    isDarkMode
                      ? "/pet-MatchWhite.png"
                      : "/pet-MatchBlack.png"
                  }
                  alt="pet"
                  className="w-40 sm:w-30 lg:w-50 mx-auto mb-4"
                />
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6" data-cy="register-form">
            {error && (
              <div
                className="px-4 py-3 rounded-lg"
                style={{
                  backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.1)' : '#fef2f2',
                  border: `1px solid ${isDarkMode ? 'rgba(239, 68, 68, 0.3)' : '#fecaca'}`,
                  color: isDarkMode ? '#fca5a5' : '#b91c1c'
                }}
              >
                {error}
              </div>
            )}

            <div>
              <label
                className="block mb-2"
                style={{ color: isDarkMode ? '#F7F5EA' : '#36332E' }}
              >
                username
              </label>
              <input
                data-cy="register-name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 outline-none bg-transparent transition-colors"
                style={{
                  borderBottom: `2px solid ${isDarkMode ? '#928e85' : '#d1d5db'}`,
                  color: isDarkMode ? '#F7F5EA' : '#36332E'
                }}
                placeholder="johndadey"
                required
                onFocus={(e) => (e.target as HTMLInputElement).style.borderBottomColor = '#d97706'}
                onBlur={(e) => (e.target as HTMLInputElement).style.borderBottomColor = isDarkMode ? '#928e85' : '#d1d5db'}
              />
            </div>

            <div>
              <label
                className="block mb-2"
                style={{ color: isDarkMode ? '#F7F5EA' : '#36332E' }}
              >
                Email
              </label>
              <input
                data-cy="register-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 outline-none bg-transparent transition-colors"
                style={{
                  borderBottom: `2px solid ${isDarkMode ? '#928e85' : '#d1d5db'}`,
                  color: isDarkMode ? '#F7F5EA' : '#36332E'
                }}
                placeholder="johndoe@email.com"
                required
                onFocus={(e) => (e.target as HTMLInputElement).style.borderBottomColor = '#d97706'}
                onBlur={(e) => (e.target as HTMLInputElement).style.borderBottomColor = isDarkMode ? '#928e85' : '#d1d5db'}
              />
            </div>

            <div>
              <label
                className="block mb-2"
                style={{ color: isDarkMode ? '#F7F5EA' : '#36332E' }}
              >
                Password
              </label>
              <div className="relative">
                <input
                  data-cy="register-password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-3 outline-none bg-transparent transition-colors"
                  style={{
                    borderBottom: `2px solid ${isDarkMode ? '#928e85' : '#d1d5db'}`,
                    color: isDarkMode ? '#F7F5EA' : '#36332E'
                  }}
                  placeholder="••••••••••••••"
                  required
                  minLength={8}
                  onFocus={(e) => (e.target as HTMLInputElement).style.borderBottomColor = '#d97706'}
                  onBlur={(e) => (e.target as HTMLInputElement).style.borderBottomColor = isDarkMode ? '#928e85' : '#d1d5db'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 hover:opacity-75 transition-opacity"
                  style={{ color: isDarkMode ? '#F7F5EA' : '#6b7280' }}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <div>
              <label
                className="block mb-2"
                style={{ color: isDarkMode ? '#F7F5EA' : '#36332E' }}
              >
                Confirm password
              </label>
              <div className="relative">
                <input
                  data-cy="register-password-confirm"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.password_confirmation}
                  onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })}
                  className="w-full px-4 py-3 outline-none bg-transparent transition-colors"
                  style={{
                    borderBottom: `2px solid ${isDarkMode ? '#928e85' : '#d1d5db'}`,
                    color: isDarkMode ? '#F7F5EA' : '#36332E'
                  }}
                  placeholder="••••••••••••••"
                  required
                  minLength={8}
                  onFocus={(e) => (e.target as HTMLInputElement).style.borderBottomColor = '#d97706'}
                  onBlur={(e) => (e.target as HTMLInputElement).style.borderBottomColor = isDarkMode ? '#928e85' : '#d1d5db'}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 hover:opacity-75 transition-opacity"
                  style={{ color: isDarkMode ? '#F7F5EA' : '#6b7280' }}
                >
                  {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                data-cy="register-accept-terms"
                type="checkbox"
                id="terms"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="w-5 h-5 rounded focus:ring-amber-500"
                style={{
                  accentColor: '#d97706',
                  border: `1px solid ${isDarkMode ? '#928e85' : '#d1d5db'}`
                }}
              />
              <label
                htmlFor="terms"
                className="text-sm"
                style={{ color: isDarkMode ? '#F7F5EA' : '#36332E' }}
              >
                I accept the terms & Condition
              </label>
            </div>

            <button
              data-cy="register-submit"
              type="submit"
              disabled={loading}
              className="w-full font-semibold py-3 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              style={{
                backgroundColor: '#d97706',
                color: '#F7F5EA'
              }}
              onMouseEnter={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#b45309'}
              onMouseLeave={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#d97706'}
            >
              {loading ? 'SIGNING UP...' : 'SIGN UP'}
            </button>

            <div className="text-center text-sm" style={{ color: isDarkMode ? '#F7F5EA' : '#36332E' }}>
              already have an account?{' '}
              <Link
                to="/login"
                className="font-semibold hover:underline"
                style={{ color: '#d97706' }}
              >
                sign in
              </Link>
            </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}