"use client";

import { motion, useInView } from "framer-motion";
import { Leaf, TrendingDown, Award, Target } from "lucide-react";
import { useRef } from "react";

export default function ImpactSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const esgPillars = [
    {
      icon: Leaf,
      title: "Environmental",
      subtitle: "Lingkungan",
      points: [
        "Mengurangi konsumsi kertas dan energi percetakan",
        "Menurunkan emisi karbon dari logistik",
        "Mendukung konservasi sumber daya alam",
      ],
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50",
    },
    {
      icon: Award,
      title: "Social",
      subtitle: "Sosial",
      points: [
        "Memperkuat budaya kerja berbasis teknologi",
        "Meningkatkan kenyamanan dan aksesibilitas",
        "Komitmen terhadap kesejahteraan lingkungan kerja",
      ],
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      icon: Target,
      title: "Governance",
      subtitle: "Tata Kelola",
      points: [
        "Meningkatkan akuntabilitas dokumen",
        "Memperkuat kepatuhan standar tata kelola",
        "Mendukung transparansi pengambilan keputusan",
      ],
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
    },
  ];

  const impacts = [
    {
      value: "15,831",
      unit: "kg CO₂",
      label: "Total Emisi 2022-2024",
      sublabel: "UIP Sulawesi & Unit Pelaksana",
      trend: "baseline",
    },
    {
      value: "1,096",
      unit: "kg CO₂-e",
      label: "Target Pengurangan",
      sublabel: "Hingga 2029 (5 tahun)",
      trend: "down",
    },
    {
      value: "250",
      unit: "MB",
      label: "Kapasitas File",
      sublabel: "Per dokumen",
      trend: "neutral",
    },
    {
      value: "100%",
      unit: "",
      label: "Paperless Process",
      sublabel: "Digital end-to-end",
      trend: "up",
    },
  ];

  return (
    <section id="impact" className="py-24 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium mb-4">
            <Leaf className="w-4 h-4" />
            Dampak Keberlanjutan
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Dampak Terhadap{" "}
            <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              Keberlanjutan (ESG)
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Kontribusi nyata DEEDS terhadap pencapaian target sustainability PT PLN (Persero)
          </p>
        </motion.div>

        {/* Impact Stats */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16"
        >
          {impacts.map((impact, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-3xl font-bold text-gray-900">
                    {impact.value}
                  </div>
                  {impact.unit && (
                    <div className="text-sm text-gray-500 font-medium">
                      {impact.unit}
                    </div>
                  )}
                </div>
                {impact.trend === "down" && (
                  <div className="p-2 bg-green-100 rounded-lg">
                    <TrendingDown className="w-5 h-5 text-green-600" />
                  </div>
                )}
              </div>
              <div className="text-sm font-semibold text-gray-900 mb-1">
                {impact.label}
              </div>
              <div className="text-xs text-gray-500">{impact.sublabel}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* ESG Pillars */}
        <div className="grid md:grid-cols-3 gap-8">
          {esgPillars.map((pillar, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -8 }}
              className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all"
            >
              {/* Icon Header */}
              <div className={`w-16 h-16 bg-gradient-to-br ${pillar.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg`}>
                <pillar.icon className="w-8 h-8 text-white" />
              </div>

              {/* Title */}
              <h3 className="text-2xl font-bold text-gray-900 mb-1">
                {pillar.title}
              </h3>
              <p className="text-sm text-gray-500 mb-6">{pillar.subtitle}</p>

              {/* Points */}
              <ul className="space-y-4">
                {pillar.points.map((point, idx) => (
                  <motion.li
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 + idx * 0.1 }}
                    className="flex items-start gap-3"
                  >
                    <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-br ${pillar.color} mt-2 flex-shrink-0`} />
                    <span className="text-gray-600 leading-relaxed text-sm">
                      {point}
                    </span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Bottom Message */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 bg-gradient-to-r from-blue-600 to-green-600 rounded-2xl p-8 md:p-12 text-white text-center"
        >
          <h3 className="text-3xl font-bold mb-4">
            Komitmen Nyata untuk Masa Depan Berkelanjutan
          </h3>
          <p className="text-lg text-blue-50 max-w-3xl mx-auto mb-6">
            DEEDS bukan sekadar sistem, tetapi bagian dari komitmen strategis PT PLN (Persero) 
            dalam mewujudkan tata kelola operasional yang efisien, transparan, dan berkelanjutan.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-4 bg-white text-blue-600 rounded-full font-semibold hover:shadow-xl transition-all"
          >
            Pelajari Lebih Lanjut
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}
