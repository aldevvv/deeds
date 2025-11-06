"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { toast } from "sonner";
import { Lock, Eye, EyeOff, CheckCircle, Shield } from "lucide-react";
import Navbar from "@/components/Navbar";

export default function ResetPasswordPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });

  useEffect(() => {
    const password = formData.password;
    setPasswordStrength({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    });
  }, [formData.password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error("Password tidak cocok!");
      return;
    }

    const checkedCount = Object.values(passwordStrength).filter(Boolean).length;
    if (checkedCount < 4) {
      toast.error("Password masih terlalu lemah. Penuhi minimal 4 kriteria.");
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Implement reset password API call
      // await api.auth.resetPassword({ token, password: formData.password });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setIsSuccess(true);
      toast.success("Password berhasil direset!");
    } catch (err) {
      toast.error("Gagal mereset password. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    const checkedCount = Object.values(passwordStrength).filter(Boolean).length;
    if (checkedCount <= 2) return "text-red-600";
    if (checkedCount <= 3) return "text-orange-600";
    if (checkedCount <= 4) return "text-yellow-600";
    return "text-green-600";
  };

  const getPasswordStrengthLabel = () => {
    const checkedCount = Object.values(passwordStrength).filter(Boolean).length;
    if (checkedCount <= 2) return "Lemah";
    if (checkedCount <= 3) return "Sedang";
    if (checkedCount <= 4) return "Baik";
    return "Sangat Kuat";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <Navbar />
      
      <div className="flex items-center justify-center min-h-screen pt-20 px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          {!isSuccess ? (
            <>
              {/* Logo & Title */}
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
                >
                  <Shield className="w-8 h-8 text-white" />
                </motion.div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Reset Password
                </h1>
                <p className="text-gray-600">
                  Buat password baru yang kuat untuk akun Anda
                </p>
              </div>

              {/* Form Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="bg-white rounded-2xl shadow-xl p-8"
              >
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Password Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password Baru
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full pl-11 pr-11 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                        placeholder="••••••••"
                        required
                        minLength={8}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    
                    {/* Password Strength Indicator */}
                    {formData.password && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-500">Kekuatan Password:</span>
                          <span className={`text-xs font-semibold ${getPasswordStrengthColor()}`}>
                            {getPasswordStrengthLabel()}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((i) => {
                            const checkedCount = Object.values(passwordStrength).filter(Boolean).length;
                            const isActive = i <= checkedCount;
                            return (
                              <div
                                key={i}
                                className={`h-1 flex-1 rounded-full transition-colors ${
                                  isActive
                                    ? checkedCount <= 2
                                      ? "bg-red-500"
                                      : checkedCount <= 3
                                      ? "bg-orange-500"
                                      : checkedCount <= 4
                                      ? "bg-yellow-500"
                                      : "bg-green-500"
                                    : "bg-gray-200"
                                }`}
                              />
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Konfirmasi Password Baru
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        className="w-full pl-11 pr-11 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                        placeholder="••••••••"
                        required
                        minLength={8}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    
                    {/* Password Match Indicator */}
                    {formData.confirmPassword && (
                      <div className="mt-2">
                        {formData.password === formData.confirmPassword ? (
                          <p className="text-xs text-green-600 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Password cocok
                          </p>
                        ) : (
                          <p className="text-xs text-red-600">Password tidak cocok</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Password Requirements */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-700 mb-3 font-medium">
                      Password harus memenuhi:
                    </p>
                    <ul className="space-y-2">
                      {[
                        { key: "length", label: "Minimal 8 karakter" },
                        { key: "uppercase", label: "Minimal 1 huruf besar (A-Z)" },
                        { key: "lowercase", label: "Minimal 1 huruf kecil (a-z)" },
                        { key: "number", label: "Minimal 1 angka (0-9)" },
                        { key: "special", label: "Minimal 1 karakter khusus (!@#$%)" },
                      ].map((req) => (
                        <li
                          key={req.key}
                          className={`flex items-center gap-2 text-xs transition-colors ${
                            passwordStrength[req.key as keyof typeof passwordStrength]
                              ? "text-green-600"
                              : "text-gray-500"
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-full flex items-center justify-center ${
                              passwordStrength[req.key as keyof typeof passwordStrength]
                                ? "bg-green-500"
                                : "bg-gray-300"
                            }`}
                          >
                            {passwordStrength[req.key as keyof typeof passwordStrength] && (
                              <CheckCircle className="w-3 h-3 text-white" />
                            )}
                          </div>
                          {req.label}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Submit Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={
                      isLoading ||
                      !Object.values(passwordStrength).every(Boolean) ||
                      formData.password !== formData.confirmPassword
                    }
                    className="w-full py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? "Mereset..." : "Reset Password"}
                  </motion.button>
                </form>
              </motion.div>
            </>
          ) : (
            <>
              {/* Success State */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-2xl shadow-xl p-8 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.2, type: "spring" }}
                  className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
                >
                  <CheckCircle className="w-10 h-10 text-white" />
                </motion.div>

                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  Password Berhasil Direset!
                </h2>
                <p className="text-gray-600 mb-6">
                  Password Anda telah berhasil diubah. Silakan login dengan password baru Anda.
                </p>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Tips Keamanan:</span> Jangan bagikan password Anda kepada siapapun dan gunakan password yang berbeda untuk setiap akun.
                  </p>
                </div>

                {/* Action Button */}
                <Link
                  href="/login"
                  className="block w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  Login Sekarang
                </Link>
              </motion.div>
            </>
          )}

          {/* Bottom Note */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-center text-sm text-gray-500 mt-6"
          >
            <p>
              Butuh bantuan?{" "}
              <Link href="/support" className="text-green-600 hover:underline font-medium">
                Hubungi Support
              </Link>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
