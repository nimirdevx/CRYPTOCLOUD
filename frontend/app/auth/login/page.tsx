"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLogin } from "@/app/hooks";

export default function LoginPage() {
  const login = useLogin();
  const router = useRouter();

  useEffect(() => {
    if (!login.isInitialized) {
      return;
    }

    if (login.jwt) {
      router.push("/dashboard");
    }
  }, [login.jwt, login.isInitialized, router]);

  if (!login.isInitialized || login.jwt) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 sm:gap-3 group">
            <div className="w-8 h-8 sm:w-10 sm:h-10 gradient-purple rounded-xl flex items-center justify-center shadow-lg">
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <span className="text-xl sm:text-2xl font-bold text-gray-900">
              CryptoCloud
            </span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            <span className="hidden sm:inline">Back to Home</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="w-full max-w-md">
          {/* Logo and Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 gradient-purple rounded-2xl mb-6 shadow-xl">
              <svg
                className="w-8 h-8 sm:w-10 sm:h-10 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                />
              </svg>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
              {login.needs2FA ? "Two-Factor Authentication" : "Welcome back"}
            </h1>
            <p className="text-base sm:text-lg text-gray-600">
              {login.needs2FA
                ? "Enter your authentication code"
                : "Sign in to your account"}
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-100">
            <form onSubmit={login.handleSubmit} className="space-y-6">
              {/* Username/Email Field - Only show if not in 2FA step */}
              {!login.needs2FA && (
                <div>
                  <label
                    htmlFor="username"
                    className="block text-sm font-semibold text-gray-900 mb-2"
                  >
                    Username or Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <svg
                        className="w-5 h-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    <input
                      id="username"
                      type="text"
                      value={login.username}
                      onChange={(e) => login.setUsername(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent text-gray-900 placeholder-gray-500 transition-all"
                      placeholder="Enter your username or email"
                      required
                      autoComplete="username"
                    />
                  </div>
                </div>
              )}

              {/* Password Field - Only show if not in 2FA step */}
              {!login.needs2FA && (
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-semibold text-gray-900 mb-2"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <svg
                        className="w-5 h-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    </div>
                    <input
                      id="password"
                      type={login.showPassword ? "text" : "password"}
                      value={login.password}
                      onChange={(e) => login.setPassword(e.target.value)}
                      className="w-full pl-10 pr-12 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent text-gray-900 placeholder-gray-500 transition-all"
                      placeholder="Enter your password"
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={login.togglePasswordVisibility}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {login.showPassword ? (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* 2FA Code Field - Only show in 2FA step */}
              {login.needs2FA && (
                <div>
                  <label
                    htmlFor="totpCode"
                    className="block text-sm font-semibold text-gray-900 mb-2"
                  >
                    {login.useBackupCode
                      ? "Backup Code"
                      : "Authentication Code"}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <svg
                        className="w-5 h-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        />
                      </svg>
                    </div>
                    <input
                      id="totpCode"
                      type="text"
                      value={login.totpCode}
                      onChange={(e) => login.setTotpCode(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent text-gray-900 placeholder-gray-500 text-center text-2xl tracking-widest font-mono transition-all"
                      placeholder={login.useBackupCode ? "1234-5678" : "000000"}
                      required
                      maxLength={login.useBackupCode ? 9 : 6}
                      autoComplete="one-time-code"
                    />
                  </div>
                  <div className="mt-3 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        login.setUseBackupCode(!login.useBackupCode);
                        login.setTotpCode("");
                      }}
                      className="text-sm text-purple-600 hover:text-purple-700 transition-colors font-medium"
                    >
                      {login.useBackupCode
                        ? "Use authenticator code"
                        : "Use backup code"}
                    </button>
                  </div>
                </div>
              )}

              {/* Forgot Password Link */}
              {!login.needs2FA && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {/* Optional: Remember me checkbox */}
                  </div>
                  <Link
                    href="/auth/forgot-password"
                    className="text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
              )}

              {/* Error Message */}
              {login.error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-red-600 shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <p className="text-sm text-red-800 font-medium">
                      {login.error}
                    </p>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={login.isLoading}
                className="w-full py-3 btn-purple rounded-xl font-semibold text-base sm:text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {login.isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    {login.needs2FA ? "Verify & Sign In" : "Sign In"}
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14 5l7 7m0 0l-7 7m7-7H3"
                      />
                    </svg>
                  </>
                )}
              </button>

              {/* Back Button for 2FA */}
              {login.needs2FA && (
                <button
                  type="button"
                  onClick={login.resetToStandardLogin}
                  className="w-full py-2 text-gray-600 hover:text-gray-900 transition-colors flex items-center justify-center gap-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                  Back to sign in
                </button>
              )}
            </form>
          </div>

          {/* Sign Up Link */}
          {!login.needs2FA && (
            <p className="text-center text-sm sm:text-base text-gray-600 mt-6">
              Don't have an account?{" "}
              <Link
                href="/auth/register"
                className="font-semibold text-purple-600 hover:text-purple-700 transition-colors"
              >
                Sign up for free
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
