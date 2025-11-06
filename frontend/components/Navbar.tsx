"use client";

import { useState, useEffect } from "react";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import Link from "next/link";
import { Menu, X, FileSignature } from "lucide-react";

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { name: "Beranda", href: "#home" },
    { name: "Fitur", href: "#features" },
    { name: "Dampak", href: "#impact" },
    { name: "Tentang", href: "#about" },
  ];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg shadow-md"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
              className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center"
            >
              <FileSignature className="w-6 h-6 text-white" />
            </motion.div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                DEEDS
              </span>
              <span className="text-xs text-gray-500 -mt-1">PT PLN (Persero)</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item, index) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 + 0.3 }}
              >
                <Link
                  href={item.href}
                  className="text-gray-700 hover:text-blue-600 font-medium transition-colors relative group"
                >
                  {item.name}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all group-hover:w-full" />
                </Link>
              </motion.div>
            ))}
          </div>

          {/* CTA Button Desktop */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className="hidden md:block"
          >
            <Link
              href="/login"
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full font-medium hover:shadow-lg hover:scale-105 transition-all"
            >
              Masuk
            </Link>
          </motion.div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6 text-gray-700" />
            ) : (
              <Menu className="w-6 h-6 text-gray-700" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <motion.div
        initial={false}
        animate={{
          height: isMobileMenuOpen ? "auto" : 0,
          opacity: isMobileMenuOpen ? 1 : 0,
        }}
        transition={{ duration: 0.3 }}
        className="md:hidden overflow-hidden bg-white/95 backdrop-blur-lg border-t"
      >
        <div className="px-4 py-6 space-y-4">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className="block py-2 text-gray-700 hover:text-blue-600 font-medium transition-colors"
            >
              {item.name}
            </Link>
          ))}
          <Link
            href="/login"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block w-full py-3 text-center bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full font-medium"
          >
            Masuk
          </Link>
        </div>
      </motion.div>
    </motion.nav>
  );
}
