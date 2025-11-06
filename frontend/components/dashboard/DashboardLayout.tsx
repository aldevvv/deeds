"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUser, User } from "@/lib/auth";
import Sidebar from "./Sidebar";
import Header from "./Header";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const currentUser = getUser();
    
    if (!currentUser) {
      router.push("/login");
      return;
    }

    setUser(currentUser);
    setIsLoading(false);
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      <Sidebar user={user} />
      <div className="ml-64">
        <Header user={user} />
        <main className="pt-16 bg-white">
          {children}
        </main>
      </div>
    </div>
  );
}
