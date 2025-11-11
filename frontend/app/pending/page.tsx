"use client";

import { motion } from "framer-motion";
import { Clock, Mail, CheckCircle2, FileSignature } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function PendingApprovalPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <Navbar />
      
      <div className="flex items-center justify-center min-h-screen pt-20 pb-10 px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-lg"
        >
          {/* Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
            >
              <Clock className="w-10 h-10 text-white" />
            </motion.div>

            {/* Title */}
            <h1 className="text-3xl font-bold text-gray-900 text-center mb-4">
              Akun Menunggu Persetujuan
            </h1>

            {/* Description */}
            <p className="text-gray-600 text-center mb-8">
              Terima kasih telah mendaftar di DEEDS. Akun Anda sedang dalam proses review oleh administrator.
            </p>

            {/* Status Steps */}
            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-green-900">Pendaftaran Berhasil</h3>
                  <p className="text-sm text-green-700">Data Anda telah tersimpan di sistem</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <Clock className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5 animate-pulse" />
                <div className="flex-1">
                  <h3 className="font-semibold text-orange-900">Menunggu Persetujuan</h3>
                  <p className="text-sm text-orange-700">Administrator sedang meninjau akun Anda</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-gray-50 border border-gray-200 rounded-lg opacity-50">
                <FileSignature className="w-6 h-6 text-gray-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-700">Akses Dashboard</h3>
                  <p className="text-sm text-gray-600">Akses penuh setelah disetujui</p>
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-blue-900">
                    Anda akan menerima email notifikasi setelah akun Anda disetujui. Proses ini biasanya memakan waktu 1-2 hari kerja.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Link
                href="/login"
                className="block w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold text-center shadow-lg hover:shadow-xl transition-all"
              >
                Coba Login Lagi
              </Link>
              
              <Link
                href="/"
                className="block w-full py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold text-center hover:bg-gray-50 transition-all"
              >
                Kembali ke Beranda
              </Link>
            </div>

            {/* Contact Info */}
            <div className="mt-8 pt-6 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-600 mb-2">
                Butuh bantuan?
              </p>
              <a
                href="mailto:admin@deeds.id"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Hubungi Administrator
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
