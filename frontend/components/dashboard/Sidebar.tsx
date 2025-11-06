"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileSignature,
  Home,
  FileText,
  Upload,
  CheckCircle,
  Clock,
  Users,
  Settings,
  BarChart3,
  Shield,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  Bell,
  Archive,
  Folder,
  History,
  UserCircle,
  Leaf,
  FileSearch,
  Activity,
  LogOut,
} from "lucide-react";
import { User, logout } from "@/lib/auth";

interface MenuItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: ('USER' | 'ADMIN' | 'ADMINISTRATOR')[];
}

interface MenuSection {
  title: string;
  items: MenuItem[];
  roles: ('USER' | 'ADMIN' | 'ADMINISTRATOR')[];
}

const menuSections: MenuSection[] = [
  {
    title: "MENU UTAMA",
    roles: ['USER', 'ADMIN', 'ADMINISTRATOR'],
    items: [
      { name: "Beranda", href: "/dashboard", icon: Home, roles: ['USER', 'ADMIN', 'ADMINISTRATOR'] },
      { name: "Input Laporan Baru", href: "/dashboard/upload", icon: Upload, roles: ['USER', 'ADMIN', 'ADMINISTRATOR'] },
      { name: "Daftar Laporan & Status", href: "/dashboard/tracking", icon: Activity, roles: ['USER', 'ADMIN', 'ADMINISTRATOR'] },
      { name: "Notifikasi & Aktivitas", href: "/dashboard/notifications", icon: Bell, roles: ['USER', 'ADMIN', 'ADMINISTRATOR'] },
      { name: "Persetujuan Saya", href: "/dashboard/admin/sign", icon: CheckCircle, roles: ['ADMIN', 'ADMINISTRATOR'] },
      { name: "Riwayat Tanda Tangan", href: "/dashboard/admin/history", icon: History, roles: ['ADMIN', 'ADMINISTRATOR'] },
      { name: "Rekap & Statistik", href: "/dashboard/reports", icon: BarChart3, roles: ['USER', 'ADMIN', 'ADMINISTRATOR'] },
      { name: "Penghematan Emisi", href: "/dashboard/sustainability", icon: Leaf, roles: ['USER', 'ADMIN', 'ADMINISTRATOR'] },
    ],
  },
  {
    title: "MENU ADMINISTRATOR",
    roles: ['ADMINISTRATOR'],
    items: [
      { name: "Kelola User & Role", href: "/dashboard/administrator/users", icon: Users, roles: ['ADMINISTRATOR'] },
    ],
  },
];

interface SidebarProps {
  user: User;
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [activeMenuGroup, setActiveMenuGroup] = useState<'user' | 'admin' | 'administrator'>(
    user.role === 'USER' ? 'user' : user.role === 'ADMINISTRATOR' ? 'administrator' : 'admin'
  );
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const toggleSection = (title: string) => {
    setExpandedSections((prev) =>
      prev.includes(title)
        ? prev.filter((s) => s !== title)
        : [...prev, title]
    );
  };

  const isActive = (href: string) => pathname === href;

  const canAccessSection = (section: MenuSection) => {
    return section.roles.includes(user.role);
  };

  const canAccessItem = (item: MenuItem) => {
    return item.roles.includes(user.role);
  };

  const getVisibleSections = () => {
    // User & Admin share the same main menu, Administrator has its own
    if (user.role === 'ADMINISTRATOR') {
      return menuSections.filter(s => s.title === 'MENU ADMINISTRATOR');
    } else {
      return menuSections.filter(s => s.title === 'MENU UTAMA');
    }
  };

  const getMenuOptions = () => {
    const options = [{ value: 'user', label: 'Menu User' }];
    if (user.role === 'ADMIN' || user.role === 'ADMINISTRATOR') {
      options.push({ value: 'admin', label: 'Menu Admin' });
    }
    if (user.role === 'ADMINISTRATOR') {
      options.push({ value: 'administrator', label: 'Menu Administrator' });
    }
    return options;
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col z-40">
      {/* Profile Header */}
      <div className="border-b border-gray-200">
        <button
          onClick={() => setIsProfileOpen(!isProfileOpen)}
          className="w-full h-16 flex items-center gap-3 px-4 hover:bg-gray-50 transition-colors"
        >
          {/* Avatar */}
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white font-semibold text-sm">
              {getInitials(user.fullName)}
            </span>
          </div>

          {/* User Info */}
          <div className="flex-1 text-left min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{user.fullName}</p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>

          {/* Chevron */}
          <motion.div
            animate={{ rotate: isProfileOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
          </motion.div>
        </button>
      </div>

      {/* Navigation or Profile Menu */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {isProfileOpen ? (
          /* Profile Menu */
          <div className="space-y-1">
            <Link
              href="/dashboard/settings"
              onClick={() => setIsProfileOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Settings className="w-5 h-5 text-gray-400" />
              <span>Pengaturan Akun</span>
            </Link>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Keluar</span>
            </button>
          </div>
        ) : (
          /* Main Menu */
          <>
            {getVisibleSections().map((section) => {
          if (!canAccessSection(section)) return null;

          return (
            <div key={section.title} className="mb-4">
              {/* Section Title */}
              <div className="px-3 mb-2">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {section.title}
                </h3>
              </div>
              
              {/* Section Items */}
              <div className="space-y-1">
                {section.items.map((item) => {
                  if (!canAccessItem(item)) return null;

                  const Icon = item.icon;
                  const active = isActive(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        active
                          ? "bg-blue-50 text-blue-600"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${active ? "text-blue-600" : "text-gray-400"}`} />
                      <span>{item.name}</span>
                      {active && (
                        <motion.div
                          layoutId="activeIndicator"
                          className="ml-auto w-1.5 h-1.5 bg-blue-600 rounded-full"
                        />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
            })}
          </>
        )}
      </nav>
    </aside>
  );
}
