import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useAuth } from "~/contexts/auth";
import { useTheme } from "~/contexts/themeContext";
import { authService } from "~/api/authService";
import { UserContext } from "~/contexts/UserContext";
import { useContext } from "react";
import api from "~/api/client";

export const meta = () => {
  return [
    { title: "Login - PetMatch" },
    { name: "description", content: "Login to your PetMatch account" },
  ];
};

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { isDarkMode } = useTheme();
  const [searchParams] = useSearchParams();
  const { fetchUser } = useContext(UserContext)!; // Add this


  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Email verification states
  const [showVerificationPrompt, setShowVerificationPrompt] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [countdown, setCountdown] = useState(0);

  // Check for verification success in URL
  useEffect(() => {
    const verified = searchParams.get('verified');
    if (verified === 'success') {
      setSuccessMessage('Email verified successfully! You can now log in.');
      // Remove the query parameter from URL
      window.history.replaceState({}, '', '/login');
    } else if (verified === 'already') {
      setSuccessMessage('Email already verified. You can log in.');
      window.history.replaceState({}, '', '/login');
    }
  }, [searchParams]);

  // Countdown effect
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Auto-send verification email when prompt is shown
  useEffect(() => {
    if (showVerificationPrompt && unverifiedEmail && countdown === 0) {
      handleResendEmail(true);
    }
  }, [showVerificationPrompt, unverifiedEmail]);

  const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  setError("");
  setSuccessMessage("");
  setLoading(true);

  try {
    await login(formData.email, formData.password);
    
    // Fetch user data to get role
    await fetchUser();
    
    // Get user from API to check role immediately
    const res = await api.get('/api/me');
    const userData = res.data.user;
    
    // Navigate based on role
    if (userData?.role === "admin") {
      navigate("/admin/dashboard");
    } else {
      navigate("/welcome-user");
    }
  } catch (err: any) {
    const errorMessage = err.message || "Login failed";
    
    if (errorMessage.toLowerCase().includes("verify") || 
        errorMessage.toLowerCase().includes("verification")) {
      setUnverifiedEmail(formData.email);
      setShowVerificationPrompt(true);
      setCountdown(60);
    } else {
      setError(errorMessage);
    }
  } finally {
    setLoading(false);
  }
};
  const handleResendEmail = async (isInitial = false) => {
    setResendLoading(true);
    if (!isInitial) {
      setResendMessage("");
    }
    
    try {
      const result = await authService.resendVerificationEmail(unverifiedEmail);
      setResendMessage(result.message || "Verification email sent!");
      setCountdown(isInitial ? 60 : 120);
    } catch (err: any) {
      setResendMessage(err.message || "Failed to send verification email");
    } finally {
      setResendLoading(false);
    }
  };

  // Email verification prompt screen
  if (showVerificationPrompt) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8">
        <div
          className="w-full max-w-md rounded-3xl overflow-hidden shadow-2xl p-8"
          style={{ backgroundColor: isDarkMode ? "rgb(115,101,91,0.31)" : "rgb(255,255,255,0.3)" }}
        >
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

          <div className="flex justify-center mb-6">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ backgroundColor: isDarkMode ? "rgba(217, 119, 6, 0.2)" : "rgba(217, 119, 6, 0.1)" }}
            >
              <span className="text-4xl">⚠️</span>
            </div>
          </div>

          <h1
            className="text-2xl font-bold text-center mb-4"
            style={{ color: isDarkMode ? "#F7F5EA" : "#36332E" }}
          >
            Email Not Verified
          </h1>

          <p
            className="text-center mb-6"
            style={{ color: isDarkMode ? '#d1d5db' : '#6b7280' }}
          >
            Please verify your email address before logging in. We've sent a verification link to{" "}
            <span className="font-semibold" style={{ color: "#d97706" }}>
              {unverifiedEmail}
            </span>
          </p>

          {resendMessage && (
            <div
              className="px-4 py-3 rounded-lg mb-4 text-sm text-center"
              style={{
                backgroundColor: resendMessage.includes("failed") || resendMessage.includes("wait")
                  ? (isDarkMode ? "rgba(239, 68, 68, 0.1)" : "#fef2f2")
                  : (isDarkMode ? "rgba(16, 185, 129, 0.1)" : "#d1fae5"),
                border: `1px solid ${
                  resendMessage.includes("failed") || resendMessage.includes("wait")
                    ? (isDarkMode ? "rgba(239, 68, 68, 0.3)" : "#fecaca")
                    : (isDarkMode ? "rgba(16, 185, 129, 0.3)" : "#6ee7b7")
                }`,
                color: resendMessage.includes("failed") || resendMessage.includes("wait")
                  ? (isDarkMode ? "#fca5a5" : "#b91c1c")
                  : (isDarkMode ? "#6ee7b7" : "#065f46"),
              }}
            >
              {resendMessage}
            </div>
          )}

          {resendLoading && !resendMessage && (
            <div className="flex justify-center mb-4">
              <svg className="animate-spin h-6 w-6" style={{ color: "#d97706" }} viewBox="0 0 24 24">
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
            </div>
          )}

          <button
            onClick={() => handleResendEmail(false)}
            disabled={countdown > 0 || resendLoading}
            className="w-full font-semibold py-3 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-4"
            style={{
              backgroundColor: countdown > 0 ? "#9ca3af" : "#d97706",
              color: "#F7F5EA",
            }}
            onMouseEnter={(e) => {
              if (countdown === 0 && !resendLoading) {
                (e.target as HTMLButtonElement).style.backgroundColor = "#b45309";
              }
            }}
            onMouseLeave={(e) => {
              if (countdown === 0) {
                (e.target as HTMLButtonElement).style.backgroundColor = "#d97706";
              }
            }}
          >
            {resendLoading
              ? "SENDING..."
              : countdown > 0
              ? `Resend email in ${countdown}s`
              : "RESEND VERIFICATION EMAIL"}
          </button>

          <div className="text-center text-sm">
            <button
              onClick={() => {
                setShowVerificationPrompt(false);
                setError("");
                setResendMessage("");
                setUnverifiedEmail("");
                setCountdown(0);
              }}
              className="font-semibold hover:underline"
              style={{ color: "#d97706" }}
            >
              ← Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Original login form
  return (
    <div className="min-h-screen flex flex-col items-center justify-start lg:justify-center p-4 sm:p-8 pt-6 lg:pt-0 lg:-mt-10">
      <div
        className="w-full max-w-4xl sm:max-w-full min-h-[500px] sm:h-[700px] rounded-3xl overflow-hidden shadow-2xl"
        style={{ backgroundColor: isDarkMode ? "rgb(115,101,91,0.31)" : "rgb(255,255,255,0.3)" }}
      >
        <div className="flex flex-col lg:flex-row h-full">
          <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br items-center justify-center">
            <img
              src="authimg.jpg"
              alt="Cute pets"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="lg:w-1/2 h-full flex justify-center p-8 pt-12 lg:pt-0">
            <div className="w-full max-w-md lg:my-auto">
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

              <form onSubmit={handleSubmit} className="space-y-6" data-cy="login-form">
                {successMessage && (
                  <div
                    className="px-4 py-3 rounded-lg"
                    style={{
                      backgroundColor: isDarkMode ? "rgba(16, 185, 129, 0.1)" : "#d1fae5",
                      border: `1px solid ${isDarkMode ? "rgba(16, 185, 129, 0.3)" : "#6ee7b7"}`,
                      color: isDarkMode ? "#6ee7b7" : "#065f46",
                    }}
                  >
                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {successMessage}
                    </div>
                  </div>
                )}

                {error && (
                  <div
                    data-cy="login-error"
                    className="px-4 py-3 rounded-lg"
                    style={{
                      backgroundColor: isDarkMode ? "rgba(239, 68, 68, 0.1)" : "#fef2f2",
                      border: `1px solid ${isDarkMode ? "rgba(239, 68, 68, 0.3)" : "#fecaca"}`,
                      color: isDarkMode ? "#fca5a5" : "#b91c1c",
                    }}
                  >
                    {error}
                  </div>
                )}

                <div>
                  <label
                    className="block mb-2"
                    style={{ color: isDarkMode ? "#f3f4f6" : "#1f2937" }}
                  >
                    Email
                  </label>
                  <input
                    data-cy="login-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className={`w-full px-4 py-3 outline-none bg-transparent transition-colors border-b-2 border-gray-300 focus:border-amber-600 ${isDarkMode ? 'text-gray-100 placeholder:text-gray-400' : 'text-gray-900 placeholder:text-gray-600'}`}
                    placeholder="example@gmail.com"
                    required
                  />
                </div>

                <div>
                  <label 
                    className="block mb-2"
                    style={{ color: isDarkMode ? "#f3f4f6" : "#1f2937" }}
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      data-cy="login-password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className="w-full px-4 py-3 outline-none bg-transparent transition-colors border-b-2 border-gray-300 focus:border-amber-600"
                      style={{
                        color: isDarkMode ? "#f3f4f6" : "#1f2937"
                      }}
                      placeholder="••••••••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 hover:opacity-75 transition-opacity"
                      style={{ color: "#6b7280" }}
                    >
                      {showPassword ? "👁️" : "👁️‍🗨️"}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="remember"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-5 h-5 rounded focus:ring-amber-500"
                      style={{
                        accentColor: "#d97706",
                        border: "1px solid #d1d5db",
                      }}
                    />
                    <label
                      htmlFor="remember"
                      className="text-sm"
                      style={{ color: isDarkMode ? "#f3f4f6" : "#1f2937" }}
                    >
                      Remember me
                    </label>
                  </div>
                  
                  <Link
                    to="/forgot-password"
                    className="text-sm font-medium hover:underline transition-colors"
                    style={{ color: "#d97706" }}
                  >
                    Forgot password?
                  </Link>
                </div>

                <button
                  data-cy="login-submit"
                  type="submit"
                  disabled={loading}
                  className="w-full font-semibold py-3 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-BgLight cursor-pointer"
                  style={{
                    backgroundColor: "#d97706"
                  }}
                  onMouseEnter={(e) =>
                    ((e.target as HTMLButtonElement).style.backgroundColor =
                      "#b45309")
                  }
                  onMouseLeave={(e) =>
                    ((e.target as HTMLButtonElement).style.backgroundColor =
                      "#d97706")
                  }
                >
                  {loading ? "LOGGING IN..." : "LOG IN"}
                </button>

                <div
                  className="text-center text-sm"
                  style={{ color: isDarkMode ? "#f3f4f6" : "#1f2937" }}
                >
                  new to petMatch?{" "}
                  <Link
                    to="/register"
                    className="font-semibold hover:underline"
                    style={{ color: "#d97706" }}
                  >
                    sign up
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