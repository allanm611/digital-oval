import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import {
  Lock,
  ArrowRight,
  CheckCircle,
  Eye,
  EyeOff,
  Shield,
} from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import AnimatedButton from "../../../shared/components/ui/AnimatedButton";
import AnimatedInput from "../../../shared/components/ui/AnimatedInput";
import AnimatedCard from "../../../shared/components/ui/AnimatedCard";

import { tw } from '../../../shared/utils/utils';
export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { resetPassword } = useAuth();

  const token = searchParams.get("token");
  const email = searchParams.get("email");

  useEffect(() => {
    setIsVisible(true);

    // Validate that we have the required parameters
    if (!token || !email) {
      setError(
        "Invalid or missing reset parameters. Please request a new password reset."
      );
    }
  }, [token, email, t]);

  const validatePasswords = () => {
    setError("");

    if (!password) {
      setError("Password is required");
      return false;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return false;
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      setError(
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      );
      return false;
    }

    if (!confirmPassword) {
      setError("Please confirm your password");
      return false;
    }

    if (password !== confirmPassword) {
      setError(t.auth.resetPassword.passwordMismatch);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePasswords() || !token || !email) {
      return;
    }

    setIsLoading(true);

    try {
      await resetPassword(token, email, password);

      setIsSuccess(true);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (error: unknown) {
      console.error("Password reset failed:", error);

      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      if (errorMessage.includes("Invalid token")) {
        setError(
          "This password reset link has expired or is invalid. Please request a new password reset."
        );
      } else if (errorMessage.includes("Token expired")) {
        setError(
          "This password reset link has expired. Please request a new password reset."
        );
      } else {
        setError(t.auth.resetPassword.errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full text-center">
          <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-500 ${tw.rounded} shadow-lg mb-6`}>
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {t.auth.resetPassword.successMessage}
          </h1>
          <p className="text-gray-600 mb-8 leading-relaxed">
            {t.auth.resetPassword.successMessage}
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Redirecting to login page in 3 seconds...
          </p>
          <Link
            to="/login"
            className={`inline-flex items-center px-4 py-2 border border-transparent ${tw.rounded} shadow-sm text-base font-medium text-white bg-[#3b8169] hover:bg-[#2d5f4e] transition-all duration-200 transform hover:scale-105`}
          >
            {t.common.goToLogin}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 flex relative overflow-hidden">
      {/* Enhanced Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-500/15 to-indigo-600/15 rounded-full blur-3xl"
          style={{ animation: "animate-float 8s ease-in-out infinite" }}
        />
        <div
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-indigo-500/15 to-purple-600/15 rounded-full blur-3xl"
          style={{
            animation: "animate-float-delayed 10s ease-in-out infinite",
          }}
        />
        <div
          className="absolute top-1/4 right-1/4 w-64 h-64 bg-gradient-to-br from-cyan-400/10 to-blue-500/10 rounded-full blur-2xl"
          style={{ animation: "animate-pulse-slow 6s ease-in-out infinite" }}
        />
        <div
          className="absolute bottom-1/4 left-1/4 w-72 h-72 bg-gradient-to-br from-violet-400/8 to-indigo-500/8 rounded-full blur-2xl"
          style={{
            animation: "animate-float 12s ease-in-out infinite reverse",
          }}
        />
      </div>

      {/* Left Side - Illustration Section */}
      <div className="hidden lg:flex lg:w-1/2 relative z-10 flex-col justify-center items-center p-12 bg-gradient-to-br from-[#1a3d2e] to-[#2d5f4e]">
        {/* Decorative floating elements */}
        <div
          className="absolute top-20 left-20 w-4 h-4 bg-emerald-400 rounded-full animate-bounce"
          style={{ animationDelay: "0s" }}
        ></div>
        <div
          className="absolute top-32 right-32 w-3 h-3 bg-green-400 rounded-full animate-bounce"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute bottom-40 left-16 w-5 h-5 bg-teal-400 rounded-full animate-bounce"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute bottom-20 right-20 w-4 h-4 bg-emerald-400 rounded-full animate-bounce"
          style={{ animationDelay: "0.5s" }}
        ></div>

        {/* Main illustration area */}
        <div className="relative">
          {/* Security illustration */}
          <div className="relative">
            {/* Main security card */}
            <div className={`bg-white ${tw.rounded} p-8 shadow-2xl transform rotate-2 hover:rotate-0 transition-all duration-500 mb-4 w-80`}>
              <div className="text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {t.auth.resetPassword.newPasswordLabel}
                </h3>
                <p className="text-gray-600 text-sm mb-6">
                  {t.auth.resetPassword.description}
                </p>

                {/* Password requirements */}
                <div className="space-y-3 text-left">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                    <span className="text-sm text-gray-700">
                      At least 8 characters
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                    <span className="text-sm text-gray-700">
                      One uppercase letter
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                    <span className="text-sm text-gray-700">
                      One lowercase letter
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                    <span className="text-sm text-gray-700">One number</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Secondary card */}
            <div className={`bg-gradient-to-r from-emerald-500 to-teal-600 ${tw.rounded} p-6 shadow-2xl transform -rotate-3 hover:rotate-0 transition-all duration-500 absolute -top-4 -right-8 w-48`}>
              <div className="text-white text-center">
                <Shield className="w-8 h-8 mb-2 mx-auto" />
                <div className="text-lg font-bold">Secure</div>
                <div className="text-sm opacity-90">Password Reset</div>
              </div>
            </div>
          </div>
        </div>

        {/* Title and description */}
        <div className="text-center text-white mt-16">
          <h1 className="text-2xl font-bold mb-4">
            {t.auth.resetPassword.title}
            <br />
            <span className="text-amber-300">{t.auth.resetPassword.newPasswordLabel}</span>
          </h1>
          <p className="text-emerald-100 text-sm font-light max-w-sm">
            {t.auth.resetPassword.description}
          </p>
        </div>
      </div>

      {/* Right Side - Form Section */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 lg:p-12 relative z-10">
        <div
          className={`w-full max-w-md transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          {/* Enhanced Header - Mobile Only */}
          <div className="text-center mb-10 lg:hidden">
            <div className="flex items-center justify-center mb-6">
              <div className="w-24 h-24 flex items-center justify-center">
                <img
                  src="/src/assets/logo.png"
                  alt="Sentra Logo"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 via-emerald-900 to-green-900 bg-clip-text text-transparent mb-3 tracking-tight">
              {t.auth.resetPassword.newPasswordLabel}
            </h1>
            <p className="text-slate-600 text-sm font-medium">
              {t.auth.resetPassword.description}
            </p>
          </div>

          {/* Desktop Header */}
          <div className="text-center mb-10 hidden lg:block">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 via-emerald-900 to-green-900 bg-clip-text text-transparent mb-3 tracking-tight">
              {t.auth.resetPassword.newPasswordLabel}
            </h1>
            <p className="text-slate-600 text-base font-medium">
              {t.auth.resetPassword.description}
            </p>
          </div>

          {/* Enhanced Form */}
          <AnimatedCard
            variant="glass"
            hover="lift"
            className="p-10 backdrop-blur-md border border-white/30 shadow-2xl hover:shadow-3xl transition-all duration-500"
          >
            {/* Error Message */}
            {error && (
              <div className={`mb-6 p-4 bg-red-50 border border-red-200 ${tw.rounded}`}>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Password Field */}
              <div className="space-y-2">
                <div className="relative">
                  <AnimatedInput
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(value) => setPassword(value)}
                    placeholder={t.auth.resetPassword.newPasswordPlaceholder}
                    label={t.auth.resetPassword.newPasswordLabel}
                    icon={Lock}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-9 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <div className="relative">
                  <AnimatedInput
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(value) => setConfirmPassword(value)}
                    placeholder={t.auth.resetPassword.confirmPasswordPlaceholder}
                    label={t.auth.resetPassword.confirmPasswordLabel}
                    icon={Lock}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-9 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <AnimatedButton
                type="submit"
                variant="primary"
                size="lg"
                disabled={isLoading || !token || !email}
                loading={isLoading}
                className="w-full mt-8"
                glowEffect
              >
                {!isLoading && (
                  <>
                    <span>{t.auth.resetPassword.resetButton}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </AnimatedButton>
            </form>

            {/* Back to Login Link */}
            <div className="text-center mt-8">
              <Link
                to="/login"
                className="text-sm text-slate-500 hover:text-slate-700 transition-all duration-300 hover:scale-105 font-medium"
              >
                {t.common.backToLogin}
              </Link>
            </div>

            {/* Enhanced Security Badge */}
            <div className="flex items-center justify-center mt-8 text-sm text-slate-500 group">
              <div className="flex items-center bg-slate-50/80 px-4 py-2 rounded-full border border-slate-200/50 transition-all duration-300 group-hover:bg-slate-100/80 group-hover:border-slate-300/50">
                <Shield className="w-4 h-4 mr-2 text-slate-600 group-hover:text-emerald-600 transition-colors duration-300" />
                <span className="font-medium">
                  Your new password will be encrypted
                </span>
              </div>
            </div>
          </AnimatedCard>
        </div>
      </div>
    </div>
  );
}
