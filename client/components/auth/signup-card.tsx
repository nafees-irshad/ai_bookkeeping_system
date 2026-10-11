"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signup, SignupData } from "@/lib/api/signupApi";

export default function SignupCard() {
  const router = useRouter();

  const [formData, setFormData] = useState<SignupData>({
    first_name: "",
    last_name: "",
    username: "",
    phone: "",
    email: "",
    password: "",
    password2: "",
  });

  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.first_name.trim()) {
      errors.first_name = "First name is required";
    }
    if (!formData.last_name.trim()) {
      errors.last_name = "Last name is required";
    }
    if (!formData.username.trim()) {
      errors.username = "Username is required";
    }
    if (!formData.phone.trim()) {
      errors.phone = "Phone is required";
    }
    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Invalid email";
    }
    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 6) {
      errors.password = "Min 6 characters";
    }
    if (!formData.password2) {
      errors.password2 = "Please confirm password";
    } else if (formData.password !== formData.password2) {
      errors.password2 = "Passwords do not match";
    }
    if (!agreedToTerms) {
      errors.terms = "Please accept the Terms & Privacy Policy";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await signup(formData);
      setSuccessMessage("Account created successfully! Redirecting...");
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (err: unknown) {
      const errorStr = err instanceof Error ? err.message : "Failed to create account. Please try again.";
      setErrorMessage(errorStr);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api"}/auth/google/`;
  };

  return (
    <div className="w-full max-w-[410px] rounded-[22px] bg-white px-5 py-4 sm:px-6 sm:py-5 shadow-2xl transition-all dark:bg-zinc-900 border border-gray-100/90 dark:border-zinc-800 my-auto">
      {/* Header */}
      <div className="text-center mb-3 sm:mb-3.5">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 dark:text-white font-gabarito">
          Sign up
        </h1>
        <p className="mt-0.5 text-xs text-gray-500 dark:text-zinc-400 font-gabarito" data-subtext="true">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-[#6D54F5] hover:text-[#5841e6] hover:underline transition-colors dark:text-[#8b77ff]"
          >
            Sign in here
          </Link>
        </p>
      </div>

      {/* Success Alert */}
      {successMessage && (
        <div className="mb-2.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60 flex items-center gap-1.5">
          <svg className="w-4 h-4 flex-shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>{successMessage}</span>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="mb-2.5 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60 flex items-center gap-1.5">
          <svg className="w-4 h-4 flex-shrink-0 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="truncate">{errorMessage}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-2 sm:space-y-2.5">
        {/* First & Last Name */}
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[11px] font-semibold text-gray-700 dark:text-zinc-300 mb-0.5">
              First Name
            </label>
            <input
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              placeholder="Alexander"
              disabled={isLoading}
              className={`w-full rounded-lg border px-3 py-1.5 text-xs sm:text-sm outline-none transition-all placeholder:text-gray-400 dark:bg-zinc-800 dark:text-white ${
                validationErrors.first_name
                  ? "border-rose-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-200 dark:focus:ring-rose-900/40"
                  : "border-gray-200 focus:border-[#6D54F5] focus:ring-1 focus:ring-[#6D54F5]/30 dark:border-zinc-700"
              }`}
            />
            {validationErrors.first_name && (
              <p className="mt-0.5 text-[10px] text-rose-500 leading-tight">{validationErrors.first_name}</p>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-700 dark:text-zinc-300 mb-0.5">
              Last Name
            </label>
            <input
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              placeholder="Doe"
              disabled={isLoading}
              className={`w-full rounded-lg border px-3 py-1.5 text-xs sm:text-sm outline-none transition-all placeholder:text-gray-400 dark:bg-zinc-800 dark:text-white ${
                validationErrors.last_name
                  ? "border-rose-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-200 dark:focus:ring-rose-900/40"
                  : "border-gray-200 focus:border-[#6D54F5] focus:ring-1 focus:ring-[#6D54F5]/30 dark:border-zinc-700"
              }`}
            />
            {validationErrors.last_name && (
              <p className="mt-0.5 text-[10px] text-rose-500 leading-tight">{validationErrors.last_name}</p>
            )}
          </div>
        </div>

        {/* Username & Phone */}
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[11px] font-semibold text-gray-700 dark:text-zinc-300 mb-0.5">
              Username
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="jaime_lannister"
              disabled={isLoading}
              className={`w-full rounded-lg border px-3 py-1.5 text-xs sm:text-sm outline-none transition-all placeholder:text-gray-400 dark:bg-zinc-800 dark:text-white ${
                validationErrors.username
                  ? "border-rose-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-200 dark:focus:ring-rose-900/40"
                  : "border-gray-200 focus:border-[#6D54F5] focus:ring-1 focus:ring-[#6D54F5]/30 dark:border-zinc-700"
              }`}
            />
            {validationErrors.username && (
              <p className="mt-0.5 text-[10px] text-rose-500 leading-tight">{validationErrors.username}</p>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-700 dark:text-zinc-300 mb-0.5">
              Phone
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="03281234737"
              disabled={isLoading}
              className={`w-full rounded-lg border px-3 py-1.5 text-xs sm:text-sm outline-none transition-all placeholder:text-gray-400 dark:bg-zinc-800 dark:text-white ${
                validationErrors.phone
                  ? "border-rose-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-200 dark:focus:ring-rose-900/40"
                  : "border-gray-200 focus:border-[#6D54F5] focus:ring-1 focus:ring-[#6D54F5]/30 dark:border-zinc-700"
              }`}
            />
            {validationErrors.phone && (
              <p className="mt-0.5 text-[10px] text-rose-500 leading-tight">{validationErrors.phone}</p>
            )}
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-[11px] font-semibold text-gray-700 dark:text-zinc-300 mb-0.5">
            Email
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Alexanderdoe@email.com"
            disabled={isLoading}
            className={`w-full rounded-lg border px-3 py-1.5 text-xs sm:text-sm outline-none transition-all placeholder:text-gray-400 dark:bg-zinc-800 dark:text-white ${
              validationErrors.email
                ? "border-rose-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-200 dark:focus:ring-rose-900/40"
                : "border-gray-200 focus:border-[#6D54F5] focus:ring-1 focus:ring-[#6D54F5]/30 dark:border-zinc-700"
            }`}
          />
          {validationErrors.email && (
            <p className="mt-0.5 text-[10px] text-rose-500 leading-tight">{validationErrors.email}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label className="block text-[11px] font-semibold text-gray-700 dark:text-zinc-300 mb-0.5">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              disabled={isLoading}
              className={`w-full rounded-lg border px-3 py-1.5 pr-10 text-xs sm:text-sm outline-none transition-all placeholder:text-gray-400 dark:bg-zinc-800 dark:text-white ${
                validationErrors.password
                  ? "border-rose-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-200 dark:focus:ring-rose-900/40"
                  : "border-gray-200 focus:border-[#6D54F5] focus:ring-1 focus:ring-[#6D54F5]/30 dark:border-zinc-700"
              }`}
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 p-1 focus:outline-none"
            >
              {showPassword ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
          {validationErrors.password && (
            <p className="mt-0.5 text-[10px] text-rose-500 leading-tight">{validationErrors.password}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-[11px] font-semibold text-gray-700 dark:text-zinc-300 mb-0.5">
            Confirm Password
          </label>
          <div className="relative">
            <input
              type={showPassword2 ? "text" : "password"}
              name="password2"
              value={formData.password2}
              onChange={handleChange}
              placeholder="••••••••"
              disabled={isLoading}
              className={`w-full rounded-lg border px-3 py-1.5 pr-10 text-xs sm:text-sm outline-none transition-all placeholder:text-gray-400 dark:bg-zinc-800 dark:text-white ${
                validationErrors.password2
                  ? "border-rose-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-200 dark:focus:ring-rose-900/40"
                  : "border-gray-200 focus:border-[#6D54F5] focus:ring-1 focus:ring-[#6D54F5]/30 dark:border-zinc-700"
              }`}
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword2(!showPassword2)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 p-1 focus:outline-none"
            >
              {showPassword2 ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
          {validationErrors.password2 && (
            <p className="mt-0.5 text-[10px] text-rose-500 leading-tight">{validationErrors.password2}</p>
          )}
        </div>

        {/* Terms Agreement Checkbox */}
        <div className="pt-0.5">
          <label className="flex items-start gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => {
                setAgreedToTerms(e.target.checked);
                if (validationErrors.terms) {
                  setValidationErrors((prev) => {
                    const updated = { ...prev };
                    delete updated.terms;
                    return updated;
                  });
                }
              }}
              className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 text-[#6D54F5] focus:ring-[#6D54F5] dark:border-zinc-700 dark:bg-zinc-800 accent-[#6D54F5]"
            />
            <span className="text-[11px] text-gray-600 leading-snug dark:text-zinc-400">
              By clicking Create an account, I agree that i have read and accepted the{" "}
              <Link href="/terms" className="text-[#6D54F5] hover:underline dark:text-[#8b77ff]">
                Terms of Use
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-[#6D54F5] hover:underline dark:text-[#8b77ff]">
                Privacy Policy
              </Link>
              .
            </span>
          </label>
          {validationErrors.terms && (
            <p className="mt-0.5 text-[10px] text-rose-500">{validationErrors.terms}</p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-1 flex items-center justify-center rounded-lg bg-[#6D54F5] py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white shadow-md shadow-[#6D54F5]/25 transition-all hover:bg-[#5841e6] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg
                className="h-4 w-4 animate-spin text-white"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Creating account...
            </span>
          ) : (
            "Create an account"
          )}
        </button>
      </form>

      {/* Or Divider */}
      <div className="relative my-2 sm:my-2.5 flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200 dark:border-zinc-800" />
        </div>
        <span className="relative bg-white px-2.5 text-[11px] text-gray-400 dark:bg-zinc-900 dark:text-zinc-500">
          Or
        </span>
      </div>

      {/* Google Sign-In Button */}
      <button
        type="button"
        onClick={handleGoogleSignup}
        className="w-full flex items-center justify-center gap-2.5 rounded-lg border border-gray-200 bg-white py-1.5 sm:py-2 px-3 text-xs sm:text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 active:scale-[0.99] dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-750 cursor-pointer"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        <span>Sign with Google</span>
      </button>
    </div>
  );
}
