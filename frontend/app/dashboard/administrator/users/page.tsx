"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Users, Check, X, Mail, Calendar, Shield } from "lucide-react";
import { getToken } from "@/lib/auth";
import { usersApi, PendingUser } from "@/lib/users-api";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

export default function UserManagementPage() {
  const router = useRouter();
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingUserId, setProcessingUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    try {
      const token = getToken();
      if (!token) {
        router.push("/login");
        return;
      }

      const users = await usersApi.getPendingUsers(token);
      setPendingUsers(users);
    } catch (error: any) {
      toast.error(error.message || "Gagal memuat data user");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (userId: string, fullName: string) => {
    if (!confirm(`Setujui akun untuk ${fullName}?`)) return;

    setProcessingUserId(userId);
    try {
      const token = getToken();
      if (!token) {
        router.push("/login");
        return;
      }

      await usersApi.approveUser(token, userId);
      toast.success(`Akun ${fullName} berhasil disetujui!`);
      
      // Remove from list
      setPendingUsers(pendingUsers.filter(u => u.id !== userId));
    } catch (error: any) {
      toast.error(error.message || "Gagal menyetujui user");
    } finally {
      setProcessingUserId(null);
    }
  };

  const handleReject = async (userId: string, fullName: string) => {
    if (!confirm(`Tolak dan hapus akun ${fullName}? Tindakan ini tidak dapat dibatalkan.`)) return;

    setProcessingUserId(userId);
    try {
      const token = getToken();
      if (!token) {
        router.push("/login");
        return;
      }

      await usersApi.rejectUser(token, userId);
      toast.success(`Akun ${fullName} berhasil ditolak dan dihapus`);
      
      // Remove from list
      setPendingUsers(pendingUsers.filter(u => u.id !== userId));
    } catch (error: any) {
      toast.error(error.message || "Gagal menolak user");
    } finally {
      setProcessingUserId(null);
    }
  };

  const getRoleBadge = (role: string) => {
    const colors = {
      USER: "bg-blue-100 text-blue-800",
      ADMIN: "bg-purple-100 text-purple-800",
      ADMINISTRATOR: "bg-red-100 text-red-800",
    };
    return colors[role as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getAdminTitleText = (adminTitle?: string) => {
    const titles: Record<string, string> = {
      SENIOR_MANAGER: "Senior Manager",
      MANAGER_SUB_BIDANG: "Manager Sub Bidang",
      ASISTEN_MANAGER: "Asisten Manager",
    };
    return adminTitle ? titles[adminTitle] || adminTitle : "-";
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat data user...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <Users className="w-8 h-8 text-blue-600" />
          Manajemen User
        </h1>
        <p className="text-gray-600 mt-2">
          Kelola persetujuan akun user yang mendaftar
        </p>
      </div>

      {/* Stats */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <p className="text-orange-100 text-sm">User Menunggu Persetujuan</p>
            <p className="text-4xl font-bold">{pendingUsers.length}</p>
          </div>
        </div>
      </div>

      {/* Users List */}
      {pendingUsers.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Tidak Ada User Pending
          </h3>
          <p className="text-gray-600">
            Semua user yang mendaftar sudah diproses
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Admin Title
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Tanggal Daftar
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {pendingUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-gray-900">{user.fullName}</p>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {user.email}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getRoleBadge(user.role)}`}>
                        <Shield className="w-3 h-3" />
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-700">{getAdminTitleText(user.adminTitle)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-700 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(user.createdAt).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleApprove(user.id, user.fullName)}
                          disabled={processingUserId === user.id}
                          className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                        >
                          <Check className="w-4 h-4" />
                          Setujui
                        </button>
                        <button
                          onClick={() => handleReject(user.id, user.fullName)}
                          disabled={processingUserId === user.id}
                          className="flex items-center gap-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                        >
                          <X className="w-4 h-4" />
                          Tolak
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      </div>
    </DashboardLayout>
  );
}
