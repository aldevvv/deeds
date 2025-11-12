"use client";

import { usePathname } from "next/navigation";
import { User } from "@/lib/auth";

interface HeaderProps {
  user: User;
}

export default function Header({ user }: HeaderProps) {
  const pathname = usePathname();
  const isAdministratorPage = pathname.startsWith('/dashboard/administrator');

  return (
    <header className="fixed top-0 right-0 left-0 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-30">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        {!isAdministratorPage && (
          <p className="text-sm text-gray-500">Selamat datang kembali, {user.fullName.split(" ")[0]}</p>
        )}
      </div>
    </header>
  );
}
