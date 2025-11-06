"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { FileSignature, Mail, Phone, MapPin, Linkedin, Twitter, Facebook, Instagram } from "lucide-react";

export default function Footer() {
  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const quickLinks = [
    { name: "Beranda", href: "#home" },
    { name: "Fitur", href: "#features" },
    { name: "Dampak", href: "#impact" },
    { name: "Tentang", href: "#about" },
  ];

  const legalLinks = [
    { name: "Kebijakan Privasi", href: "/privacy" },
    { name: "Syarat & Ketentuan", href: "/terms" },
    { name: "Keamanan", href: "/security" },
    { name: "FAQ", href: "/faq" },
  ];

  const socialLinks = [
    { icon: Linkedin, href: "#", label: "LinkedIn" },
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Facebook, href: "#", label: "Facebook" },
    { icon: Instagram, href: "#", label: "Instagram" },
  ];

  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Company Info */}
          <motion.div variants={itemVariants} className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
                <FileSignature className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-xl font-bold">DEEDS</div>
                <div className="text-xs text-gray-400">PT PLN (Persero)</div>
              </div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Solusi penandatanganan dokumen digital yang cepat, aman, dan berkelanjutan untuk mendukung efisiensi operasional perusahaan.
            </p>
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-9 h-9 bg-gray-800 hover:bg-blue-600 rounded-full flex items-center justify-center transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="w-4 h-4" />
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div variants={itemVariants}>
            <h3 className="text-lg font-semibold mb-4">Navigasi</h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors inline-flex items-center group"
                  >
                    <span className="group-hover:translate-x-1 transition-transform">
                      {link.name}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Legal Links */}
          <motion.div variants={itemVariants}>
            <h3 className="text-lg font-semibold mb-4">Informasi Legal</h3>
            <ul className="space-y-3">
              {legalLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors inline-flex items-center group"
                  >
                    <span className="group-hover:translate-x-1 transition-transform">
                      {link.name}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Contact Info */}
          <motion.div variants={itemVariants}>
            <h3 className="text-lg font-semibold mb-4">Kontak Kami</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3 text-gray-400">
                <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0 text-blue-500" />
                <span>Jl. Trunojoyo Blok M-I/135, Jakarta Selatan 12160</span>
              </li>
              <li className="flex items-center gap-3 text-gray-400">
                <Phone className="w-5 h-5 flex-shrink-0 text-blue-500" />
                <a href="tel:+6221123" className="hover:text-white transition-colors">
                  +62 21 123
                </a>
              </li>
              <li className="flex items-center gap-3 text-gray-400">
                <Mail className="w-5 h-5 flex-shrink-0 text-blue-500" />
                <a href="mailto:deeds@pln.co.id" className="hover:text-white transition-colors">
                  deeds@pln.co.id
                </a>
              </li>
            </ul>
          </motion.div>
        </div>

        {/* Bottom Section */}
        <motion.div
          variants={itemVariants}
          className="pt-8 border-t border-gray-700 flex flex-col md:flex-row justify-between items-center gap-4"
        >
          <p className="text-gray-400 text-sm text-center md:text-left">
            © {new Date().getFullYear()} PT PLN (Persero). All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              System Operational
            </span>
            <span>Made with ❤️ for a sustainable future</span>
          </div>
        </motion.div>
      </motion.div>
    </footer>
  );
}
