"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Users, Mail, Calendar, Shield, Edit2, Save, X } from "lucide-react";
import { getToken } from "@/lib/auth";
import { usersApi, User } from "@/lib/users-api";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

export default function UserManagementPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ role: 'USER' | 'ADMIN' | 'ADMINISTRATOR', adminTitle?: string }>({ role: 'USER' });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = getToken();
      if (!token) {
        router.push("/login");
        return;
      }

      const allUsers = await usersApi.getAllUsers(token);
      setUsers(allUsers.filter(u => u.isApproved));
    } catch (error: any) {
      toast.error(error.message || "Gagal memuat data user");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUserId(user.id);
    setEditForm({ role: user.role, adminTitle: user.adminTitle });
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setEditForm({ role: 'USER' });
  };

  const handleSave = async (userId: string, fullName: string) => {
    try {
      const token = getToken();
      if (!token) {
        router.push("/login");
        return;
      }

      await usersApi.updateUserRole(token, userId, editForm);
      toast.success(`Role ${fullName} berhasil diupdate!`);
      
      setUsers(users.map(u => u.id === userId ? { ...u, role: editForm.role, adminTitle: editForm.adminTitle } : u));
      setEditingUserId(null);
    } catch (error: any) {
      toast.error(error.message || "Gagal mengupdate role user");
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

  const adminTitleOptions = [
    { value: '', label: 'Tidak Ada' },
    { value: 'GENERAL_MANAGER', label: 'General Manager' },
    { value: 'SENIOR_MANAGER', label: 'Senior Manager' },
    { value: 'MANAGER_SUB_BIDANG', label: 'Manager Sub Bidang' },
    { value: 'ASISTEN_MANAGER', label: 'Asisten Manager' },
  ];

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-6 flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Memuat data user...</p>
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
          <Users className="w-8 h-8 text-blue-600" />
          Kelola User & Role
        </h1>
        <p className="text-gray-600 mt-2">
          Kelola daftar user dan ubah role serta admin title
        </p>
      </div>

      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <p className="text-blue-100 text-sm font-medium">Total User Terdaftar</p>
            <p className="text-4xl font-bold">{users.length}</p>
          </div>
        </div>
      </div>

      {users.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-16 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Tidak Ada User
          </h3>
          <p className="text-gray-500">
            Belum ada user yang terdaftar di sistem
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
                {users.map((user) => {
                  const isEditing = editingUserId === user.id;
                  
                  return (
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
                        {isEditing ? (
                          <select
                            value={editForm.role}
                            onChange={(e) => setEditForm({ ...editForm, role: e.target.value as 'USER' | 'ADMIN' | 'ADMINISTRATOR' })}
                            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="USER">USER</option>
                            <option value="ADMIN">ADMIN</option>
                            <option value="ADMINISTRATOR">ADMINISTRATOR</option>
                          </select>
                        ) : (
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getRoleBadge(user.role)}`}>
                            <Shield className="w-3 h-3" />
                            {user.role}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {isEditing ? (
                          <select
                            value={editForm.adminTitle || ''}
                            onChange={(e) => setEditForm({ ...editForm, adminTitle: e.target.value || undefined })}
                            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={editForm.role === 'USER'}
                          >
                            {adminTitleOptions.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        ) : (
                          <p className="text-sm text-gray-700">{getAdminTitleText(user.adminTitle)}</p>
                        )}
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
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => handleSave(user.id, user.fullName)}
                                className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all hover:shadow-md text-sm font-medium"
                              >
                                <Save className="w-4 h-4" />
                                Simpan
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="flex items-center gap-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all hover:shadow-md text-sm font-medium"
                              >
                                <X className="w-4 h-4" />
                                Batal
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleEdit(user)}
                              className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all hover:shadow-md text-sm font-medium"
                            >
                              <Edit2 className="w-4 h-4" />
                              Edit
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      </div>
    </DashboardLayout>
  );
}
