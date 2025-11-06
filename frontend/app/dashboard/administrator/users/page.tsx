"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Users as UsersIcon,
  Edit,
  Trash2,
  Shield,
  X,
  Save,
} from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { getToken } from "@/lib/auth";
import { usersApi, User } from "@/lib/users-api";

const roleLabels: Record<string, string> = {
  USER: "User",
  ADMIN: "Admin",
  ADMINISTRATOR: "Administrator",
};

const adminTitleLabels: Record<string, string> = {
  SENIOR_MANAGER: "Senior Manager",
  MANAGER_SUB_BIDANG: "Manager Sub Bidang",
  ASISTEN_MANAGER: "Asisten Manager",
};

export default function ManageUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<{
    role: 'USER' | 'ADMIN' | 'ADMINISTRATOR';
    adminTitle?: 'SENIOR_MANAGER' | 'MANAGER_SUB_BIDANG' | 'ASISTEN_MANAGER';
  }>({ role: 'USER' });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const token = getToken();
      if (!token) {
        toast.error("Sesi berakhir. Silakan login kembali.");
        return;
      }

      const data = await usersApi.getAllUsers(token);
      setUsers(data);
    } catch (error: any) {
      toast.error(error.message || "Gagal memuat data user");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setEditForm({
      role: user.role,
      adminTitle: user.adminTitle,
    });
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setEditForm({ role: 'USER' });
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;

    try {
      const token = getToken();
      if (!token) {
        toast.error("Sesi berakhir. Silakan login kembali.");
        return;
      }

      if ((editForm.role === 'ADMIN' || editForm.role === 'ADMINISTRATOR') && !editForm.adminTitle) {
        toast.error("Role Admin/Administrator memerlukan Admin Title");
        return;
      }

      await usersApi.updateUserRole(token, editingUser.id, editForm);
      toast.success("Role user berhasil diperbarui");
      setEditingUser(null);
      loadUsers();
    } catch (error: any) {
      toast.error(error.message || "Gagal memperbarui role user");
    }
  };

  const handleDelete = async (userId: string, userName: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus user ${userName}?`)) {
      return;
    }

    try {
      const token = getToken();
      if (!token) {
        toast.error("Sesi berakhir. Silakan login kembali.");
        return;
      }

      await usersApi.deleteUser(token, userId);
      toast.success("User berhasil dihapus");
      loadUsers();
    } catch (error: any) {
      toast.error(error.message || "Gagal menghapus user");
    }
  };

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      USER: "bg-gray-100 text-gray-700",
      ADMIN: "bg-blue-100 text-blue-700",
      ADMINISTRATOR: "bg-purple-100 text-purple-700",
    };
    return colors[role] || colors.USER;
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Memuat data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8 bg-white min-h-screen">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 mb-8 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-white/20 backdrop-blur-sm rounded-xl">
                <UsersIcon className="w-10 h-10" />
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-2">Kelola User & Role</h1>
                <p className="text-blue-100">Atur role dan admin title untuk setiap user</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-6 py-3 bg-white/20 backdrop-blur-sm rounded-xl">
              <UsersIcon className="w-6 h-6" />
              <span className="text-xl font-bold">{users.length}</span>
              <span className="text-sm text-blue-100">Total Users</span>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Admin Title
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {user.fullName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{user.fullName}</p>
                          <p className="text-xs text-gray-500">ID: {user.id.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-gray-900">{user.email}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                        {roleLabels[user.role]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.adminTitle ? (
                        <span className="text-sm text-gray-700">
                          {adminTitleLabels[user.adminTitle]}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id, user.fullName)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={handleCancelEdit}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Edit Role User</h3>
                <button
                  onClick={handleCancelEdit}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">User</p>
                  <p className="text-base font-medium text-gray-900">{editingUser.fullName}</p>
                  <p className="text-sm text-gray-500">{editingUser.email}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <select
                    value={editForm.role}
                    onChange={(e) => {
                      const newRole = e.target.value as 'USER' | 'ADMIN' | 'ADMINISTRATOR';
                      setEditForm({
                        role: newRole,
                        adminTitle: newRole === 'USER' ? undefined : editForm.adminTitle,
                      });
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="USER">User</option>
                    <option value="ADMIN">Admin</option>
                    <option value="ADMINISTRATOR">Administrator</option>
                  </select>
                </div>

                {(editForm.role === 'ADMIN' || editForm.role === 'ADMINISTRATOR') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Admin Title <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={editForm.adminTitle || ''}
                      onChange={(e) => setEditForm({
                        ...editForm,
                        adminTitle: e.target.value as any,
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Pilih Admin Title</option>
                      <option value="SENIOR_MANAGER">Senior Manager</option>
                      <option value="MANAGER_SUB_BIDANG">Manager Sub Bidang</option>
                      <option value="ASISTEN_MANAGER">Asisten Manager</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleCancelEdit}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Simpan
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
