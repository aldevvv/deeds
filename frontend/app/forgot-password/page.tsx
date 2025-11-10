"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { toast } from "sonner";
import { Mail, ArrowLeft, FileSignature, CheckCircle } from "lucide-react";
import Navbar from "@/components/Navbar";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // TODO: Implement forgot password API call
      // await api.auth.forgotPassword({ email });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setIsSubmitted(true);
      toast.success("Link reset password telah dikirim ke email Anda");
    } catch (err) {
      toast.error("Gagal mengirim email. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
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
          {/* Back Button */}
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Kembali ke Login
          </Link>

          {!isSubmitted ? (
            <>
              {/* Logo & Title */}
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
                >
                  <Mail className="w-8 h-8 text-white" />
                </motion.div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Lupa Password?
                </h1>
                <p className="text-gray-600">
                  Jangan khawatir, kami akan mengirimkan instruksi reset password ke email Anda
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
                  {/* Email Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Terdaftar
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                        placeholder="nama@pln.co.id"
                        required
                        suppressHydrationWarning
                      />
                    </div>
                  </div>

                  {/* Info Box */}
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">Catatan:</span> Link reset password akan dikirim ke email Anda dan berlaku selama 1 jam.
                    </p>
                  </div>

                  {/* Submit Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    suppressHydrationWarning
                  >
                    {isLoading ? "Mengirim..." : "Kirim Link Reset"}
                  </motion.button>
                </form>

                {/* Register Link */}
                <div className="mt-6 text-center">
                  <p className="text-gray-600 text-sm">
                    Belum punya akun?{" "}
                    <Link
                      href="/register"
                      className="text-orange-600 hover:text-orange-700 font-semibold transition-colors"
                    >
                      Daftar Sekarang
                    </Link>
                  </p>
                </div>
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
                  Email Berhasil Dikirim!
                </h2>
                <p className="text-gray-600 mb-2">
                  Kami telah mengirim instruksi reset password ke:
                </p>
                <p className="text-blue-600 font-semibold mb-6">{email}</p>

                <div className="bg-blue-50 rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-700">
                    Periksa inbox email Anda dan ikuti instruksi untuk mereset password. Jika tidak menemukan email, periksa folder spam.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Link
                    href="/login"
                    className="block w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                  >
                    Kembali ke Login
                  </Link>
                  <button
                    onClick={() => setIsSubmitted(false)}
                    className="block w-full py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:border-blue-600 hover:text-blue-600 transition-all"
                  >
                    Kirim Ulang Email
                  </button>
                </div>
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
              <Link href="/support" className="text-orange-600 hover:underline font-medium">
                Hubungi Support
              </Link>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
