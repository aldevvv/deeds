"use client";

import { motion } from "framer-motion";
import { Zap, Shield, BarChart3, Rocket } from "lucide-react";

export default function ValueSection() {
  const values = [
    {
      icon: Zap,
      title: "Cepat",
      description: "Proses persetujuan lebih efisien dengan sistem digital yang responsif dan real-time.",
      stats: "10x lebih cepat",
      gradient: "from-yellow-400 to-orange-500",
      bgGradient: "from-yellow-50 to-orange-50",
    },
    {
      icon: Shield,
      title: "Aman",
      description: "Tanda tangan tersertifikasi dan terenkripsi dengan standar keamanan tingkat enterprise.",
      stats: "256-bit encryption",
      gradient: "from-blue-500 to-blue-700",
      bgGradient: "from-blue-50 to-blue-100",
    },
    {
      icon: BarChart3,
      title: "Terukur",
      description: "Dampak keberlanjutan dapat dimonitor secara jelas dengan dashboard analytics yang komprehensif.",
      stats: "Real-time tracking",
      gradient: "from-green-500 to-emerald-600",
      bgGradient: "from-green-50 to-emerald-50",
    },
    {
      icon: Rocket,
      title: "Berorientasi Masa Depan",
      description: "Mendukung visi transformasi digital perusahaan menuju era Industry 4.0.",
      stats: "Future-ready",
      gradient: "from-purple-500 to-indigo-600",
      bgGradient: "from-purple-50 to-indigo-50",
    },
  ];

  return (
    <section id="about" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium mb-4">
            Value Proposition
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Nilai Manfaat{" "}
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              DEEDS
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Empat pilar utama yang menjadikan DEEDS solusi terbaik untuk pengelolaan dokumen digital perusahaan
          </p>
        </motion.div>

        {/* Values Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {values.map((value, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group relative overflow-hidden"
            >
              {/* Card Background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${value.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl`} />
              
              <div className="relative bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all border border-gray-100">
                {/* Icon & Stats Badge */}
                <div className="flex items-start justify-between mb-6">
                  <motion.div
                    whileHover={{ rotate: 360, scale: 1.1 }}
                    transition={{ duration: 0.6 }}
                    className={`w-16 h-16 bg-gradient-to-br ${value.gradient} rounded-2xl flex items-center justify-center shadow-lg`}
                  >
                    <value.icon className="w-8 h-8 text-white" />
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 + 0.2 }}
                    className={`px-4 py-2 bg-gradient-to-r ${value.gradient} text-white rounded-full text-sm font-semibold shadow-md`}
                  >
                    {value.stats}
                  </motion.div>
                </div>

                {/* Content */}
                <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:bg-gradient-to-r group-hover:from-gray-900 group-hover:to-blue-600 group-hover:bg-clip-text group-hover:text-transparent transition-all">
                  {value.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {value.description}
                </p>

                {/* Decorative Element */}
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: "100%" }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: index * 0.1 + 0.3 }}
                  className={`h-1 bg-gradient-to-r ${value.gradient} rounded-full mt-6`}
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Process Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 md:p-12 text-white"
        >
          <h3 className="text-3xl font-bold mb-8 text-center">
            Cara Kerja DEEDS
          </h3>
          
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: "01", title: "Unggah Dokumen", desc: "Upload file PDF hingga 250MB" },
              { step: "02", title: "Tanda Tangan", desc: "Tambahkan tanda tangan digital" },
              { step: "03", title: "Review & Approve", desc: "Alur persetujuan terstruktur" },
              { step: "04", title: "Download", desc: "Unduh dokumen yang sudah disetujui" },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative"
              >
                {/* Connector Line */}
                {index < 3 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-blue-500 to-transparent -ml-3" />
                )}
                
                <div className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-3">
                  {item.step}
                </div>
                <h4 className="text-lg font-semibold mb-2">{item.title}</h4>
                <p className="text-gray-400 text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
