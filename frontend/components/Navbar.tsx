"use client";

import { useState, useEffect } from "react";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import Link from "next/link";
import { Menu, X, FileSignature } from "lucide-react";

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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


        </div>
      </div>
    </motion.nav>
  );
}
