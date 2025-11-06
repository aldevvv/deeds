"use client";

import { motion } from "framer-motion";
import { Upload, PenTool, CheckCircle, History, Lock, Zap } from "lucide-react";

export default function FeaturesSection() {
  const features = [
    {
      icon: Upload,
      title: "Unggah Dokumen PDF",
      description: "Mendukung file berukuran hingga 250 MB dengan proses upload yang cepat dan aman.",
      color: "from-blue-500 to-blue-600",
    },
    {
      icon: PenTool,
      title: "Tanda Tangan Digital",
      description: "Dapat dilakukan melalui gambar tanda tangan maupun unggahan file JPG/PNG.",
      color: "from-purple-500 to-purple-600",
    },
    {
      icon: CheckCircle,
      title: "Alur Persetujuan",
      description: "Dokumen yang telah disetujui dapat diunduh kembali dalam format PDF.",
      color: "from-green-500 to-green-600",
    },
    {
      icon: History,
      title: "Riwayat & Pelacakan",
      description: "Tampilan detail status dokumen untuk memastikan transparansi proses.",
      color: "from-orange-500 to-orange-600",
    },
    {
      icon: Lock,
      title: "Keamanan Terenkripsi",
      description: "Tanda tangan tersertifikasi dengan enkripsi tingkat tinggi untuk keamanan maksimal.",
      color: "from-red-500 to-red-600",
    },
    {
      icon: Zap,
      title: "Proses Cepat",
      description: "Percepat proses review dan persetujuan dokumen hingga 10x lebih cepat.",
      color: "from-yellow-500 to-yellow-600",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  };

  return (
    <section id="features" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-4">
            Fitur Unggulan
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Fitur Utama <span className="bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">DEEDS</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Solusi lengkap untuk pengelolaan dokumen digital dengan teknologi terkini dan keamanan terjamin.
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all border border-gray-100"
            >
              {/* Gradient Background on Hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
              
              <div className="relative">
                {/* Icon */}
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                  className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-6 shadow-lg`}
                >
                  <feature.icon className="w-7 h-7 text-white" />
                </motion.div>

                {/* Content */}
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>

                {/* Hover Arrow */}
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  whileHover={{ opacity: 1, x: 0 }}
                  className="absolute bottom-8 right-8 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  →
                </motion.div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center mt-16"
        >
          <p className="text-gray-600 mb-6">
            Siap meningkatkan efisiensi operasional perusahaan Anda?
          </p>
          <motion.a
            href="/demo"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            Coba Demo Gratis
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
}
