"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { UserCheck, Check, X, Mail, Calendar, Shield, AlertTriangle } from "lucide-react";
import { getToken } from "@/lib/auth";
import { usersApi, PendingUser } from "@/lib/users-api";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

interface ConfirmModal {
  isOpen: boolean;
  type: 'approve' | 'reject' | null;
  user: PendingUser | null;
}

export default function RegistrationApprovalPage() {
  const router = useRouter();
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingUserId, setProcessingUserId] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<ConfirmModal>({
    isOpen: false,
    type: null,
    user: null,
  });

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

  const openApproveModal = (user: PendingUser) => {
    setConfirmModal({ isOpen: true, type: 'approve', user });
  };

  const openRejectModal = (user: PendingUser) => {
    setConfirmModal({ isOpen: true, type: 'reject', user });
  };

  const closeModal = () => {
    setConfirmModal({ isOpen: false, type: null, user: null });
  };

  const handleConfirmAction = async () => {
    if (!confirmModal.user) return;

    const { type, user } = confirmModal;
    setProcessingUserId(user.id);
    closeModal();

    try {
      const token = getToken();
      if (!token) {
        router.push("/login");
        return;
      }

      if (type === 'approve') {
        await usersApi.approveUser(token, user.id);
        toast.success(`Akun ${user.fullName} berhasil disetujui!`, {
          description: "User sekarang dapat mengakses sistem",
          duration: 4000,
        });
      } else {
        await usersApi.rejectUser(token, user.id);
        toast.success(`Akun ${user.fullName} berhasil ditolak`, {
          description: "Data user telah dihapus dari sistem",
          duration: 4000,
        });
      }
      
      setPendingUsers(pendingUsers.filter(u => u.id !== user.id));
    } catch (error: any) {
      toast.error(error.message || `Gagal ${type === 'approve' ? 'menyetujui' : 'menolak'} user`);
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
      GENERAL_MANAGER: "General Manager",
      SENIOR_MANAGER: "Senior Manager",
      MANAGER_SUB_BIDANG: "Manager Sub Bidang",
      ASISTEN_MANAGER: "Asisten Manager",
    };
    return adminTitle ? titles[adminTitle] || adminTitle : "-";
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-6 flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Memuat data pendaftaran...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <UserCheck className="w-8 h-8 text-blue-600" />
          Persetujuan Pendaftaran
        </h1>
        <p className="text-gray-600 mt-2">
          Setujui atau tolak akun user yang mendaftar
        </p>
      </div>

      <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            <UserCheck className="w-8 h-8" />
          </div>
          <div>
            <p className="text-orange-100 text-sm font-medium">User Menunggu Persetujuan</p>
            <p className="text-4xl font-bold">{pendingUsers.length}</p>
          </div>
        </div>
      </div>

      {pendingUsers.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-16 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserCheck className="w-10 h-10 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Tidak Ada Pendaftaran Baru
          </h3>
          <p className="text-gray-500">
            Semua user yang mendaftar sudah diproses
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
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
                          onClick={() => openApproveModal(user)}
                          disabled={processingUserId === user.id}
                          className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                        >
                          <Check className="w-4 h-4" />
                          Setujui
                        </button>
                        <button
                          onClick={() => openRejectModal(user)}
                          disabled={processingUserId === user.id}
                          className="flex items-center gap-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
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

      {/* Confirmation Modal */}
      {confirmModal.isOpen && confirmModal.user && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            {/* Icon */}
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
              confirmModal.type === 'approve' 
                ? 'bg-green-100' 
                : 'bg-red-100'
            }`}>
              {confirmModal.type === 'approve' ? (
                <Check className="w-8 h-8 text-green-600" />
              ) : (
                <AlertTriangle className="w-8 h-8 text-red-600" />
              )}
            </div>

            {/* Content */}
            <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
              {confirmModal.type === 'approve' 
                ? 'Setujui Akun User?' 
                : 'Tolak Akun User?'}
            </h3>
            <p className="text-gray-600 text-center mb-1">
              {confirmModal.type === 'approve' 
                ? 'User akan dapat mengakses sistem setelah disetujui.' 
                : 'Akun user akan dihapus secara permanen dari sistem.'}
            </p>
            
            {/* User Info */}
            <div className="bg-gray-50 rounded-lg p-4 my-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-semibold text-sm">
                    {confirmModal.user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">{confirmModal.user.fullName}</p>
                  <p className="text-sm text-gray-500 truncate">{confirmModal.user.email}</p>
                </div>
              </div>
            </div>

            {confirmModal.type === 'reject' && (
              <p className="text-sm text-red-600 text-center mb-4 font-medium">
                ⚠️ Tindakan ini tidak dapat dibatalkan
              </p>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={closeModal}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmAction}
                className={`flex-1 px-4 py-2.5 text-white rounded-lg transition-colors font-medium ${
                  confirmModal.type === 'approve'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {confirmModal.type === 'approve' ? 'Ya, Setujui' : 'Ya, Tolak'}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </DashboardLayout>
  );
}
