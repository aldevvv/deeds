"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, FileCheck, Shield, Leaf } from "lucide-react";
import Link from "next/link";

export default function HeroSection() {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 200]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  const floatingAnimation = {
    y: [0, -20, 0],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut",
    },
  };

  return (
    <section id="home" className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
          className="absolute -top-40 -right-40 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-green-200/30 rounded-full blur-3xl"
        />
      </div>

      <motion.div style={{ y, opacity }} className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
            >
              <Leaf className="w-4 h-4" />
              Digital. Sustainable. Efficient.
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight"
            >
              <span className="bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                DEEDS
              </span>
              <br />
              <span className="text-4xl md:text-5xl lg:text-6xl">
                Digital Document Signing
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl text-gray-600 leading-relaxed"
            >
              Solusi penandatanganan dokumen digital yang{" "}
              <span className="font-semibold text-blue-600">cepat</span>,{" "}
              <span className="font-semibold text-blue-600">aman</span>, dan{" "}
              <span className="font-semibold text-green-600">berkelanjutan</span>{" "}
              untuk PT PLN (Persero).
            </motion.p>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="grid grid-cols-3 gap-6"
            >
              {[
                { value: "15.8K", label: "CO₂ Reduced", unit: "kg" },
                { value: "250MB", label: "Max File Size", unit: "" },
                { value: "100%", label: "Paperless", unit: "" },
              ].map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl font-bold text-gray-900">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </div>
              ))}
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Link
                href="/register"
                className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full font-semibold hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2"
              >
                Mulai Sekarang
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="#features"
                className="px-8 py-4 bg-white text-gray-900 border-2 border-gray-200 rounded-full font-semibold hover:border-blue-600 hover:text-blue-600 transition-all flex items-center justify-center"
              >
                Pelajari Lebih Lanjut
              </Link>
            </motion.div>
          </div>

          {/* Right Content - Floating Cards */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative h-[600px] hidden lg:block"
          >
            {/* Main Card */}
            <motion.div
              animate={floatingAnimation}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-96 bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center justify-center"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center mb-6">
                <FileCheck className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Tanda Tangan Digital
              </h3>
              <p className="text-gray-600 text-center">
                Terenkripsi & tersertifikasi untuk keamanan maksimal
              </p>
            </motion.div>

            {/* Floating Badge 1 */}
            <motion.div
              animate={{ y: [0, -15, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-20 right-10 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full shadow-lg flex items-center gap-2"
            >
              <Leaf className="w-5 h-5" />
              <span className="font-semibold">Eco-Friendly</span>
            </motion.div>

            {/* Floating Badge 2 */}
            <motion.div
              animate={{ y: [0, 15, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="absolute bottom-20 left-10 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full shadow-lg flex items-center gap-2"
            >
              <Shield className="w-5 h-5" />
              <span className="font-semibold">Secure</span>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-6 h-10 border-2 border-gray-400 rounded-full flex justify-center pt-2"
        >
          <div className="w-1.5 h-3 bg-gray-400 rounded-full" />
        </motion.div>
      </motion.div>
    </section>
  );
}
