"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Upload as UploadIcon,
  File,
  X,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Users,
  FileText,
  Search,
} from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { getToken } from "@/lib/auth";
import { documentsApi, UserOption } from "@/lib/documents-api";

interface Signatory {
  userId: string;
  order: number;
}

export default function UploadDocumentPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [signatories, setSignatories] = useState<Signatory[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [showUserSelector, setShowUserSelector] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const data = await documentsApi.getAllUsers(token);
      setUsers(data);
    } catch (error: any) {
      toast.error("Gagal memuat daftar user");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleFileSelect = (selectedFile: File) => {
    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (!allowedTypes.includes(selectedFile.type)) {
      toast.error("Hanya file PDF dan Word yang diperbolehkan");
      return;
    }

    // Validate file size (max 100MB)
    const maxSize = 100 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      toast.error("Ukuran file maksimal 100MB");
      return;
    }

    setFile(selectedFile);
    if (!title) {
      setTitle(selectedFile.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const addSignatory = (userId: string) => {
    if (signatories.find(s => s.userId === userId)) {
      toast.error("User sudah ditambahkan sebagai penandatangan");
      return;
    }

    setSignatories([...signatories, {
      userId,
      order: signatories.length + 1,
    }]);
    setShowUserSelector(false);
    setUserSearchQuery("");
  };

  const filteredUsers = users.filter(u => {
    if (!userSearchQuery) return true;
    const query = userSearchQuery.toLowerCase();
    return (
      u.fullName.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query) ||
      u.adminTitle?.toLowerCase().includes(query)
    );
  });

  const removeSignatory = (userId: string) => {
    const updated = signatories
      .filter(s => s.userId !== userId)
      .map((s, index) => ({ ...s, order: index + 1 }));
    setSignatories(updated);
  };

  const moveSignatory = (userId: string, direction: 'up' | 'down') => {
    const index = signatories.findIndex(s => s.userId === userId);
    if (index === -1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= signatories.length) return;

    const updated = [...signatories];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    updated.forEach((s, i) => s.order = i + 1);
    
    setSignatories(updated);
  };

  const getUserById = (userId: string) => {
    return users.find(u => u.id === userId);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      toast.error("Silakan pilih file terlebih dahulu");
      return;
    }

    if (!title.trim()) {
      toast.error("Judul dokumen harus diisi");
      return;
    }

    if (signatories.length === 0) {
      toast.error("Minimal pilih 1 orang untuk menandatangani dokumen");
      return;
    }

    setIsLoading(true);

    try {
      const token = getToken();
      if (!token) {
        toast.error("Sesi berakhir. Silakan login kembali.");
        return;
      }

      // Upload file via backend API
      toast.loading("Mengupload file...", { id: "upload" });
      
      const uploadResult = await documentsApi.uploadFile(token, file);

      toast.success("File berhasil diupload", { id: "upload" });

      const documentData = {
        title: title.trim(),
        description: description.trim() || undefined,
        fileUrl: uploadResult.filePath,
        fileName: uploadResult.fileName,
        fileSize: uploadResult.fileSize,
        signatories: signatories.length > 0 ? signatories : undefined,
      };

      await documentsApi.createDocument(token, documentData);

      toast.success("Dokumen berhasil diupload!");
      router.push("/dashboard/tracking");
    } catch (error: any) {
      toast.dismiss("upload");
      toast.error(error.message || "Gagal mengupload dokumen");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-8 bg-white min-h-screen">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 mb-8 text-white shadow-lg max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-white/20 backdrop-blur-sm rounded-xl">
              <UploadIcon className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">Upload Dokumen</h1>
              <p className="text-blue-100">
                Upload dokumen baru dan tentukan penandatangan
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              File Dokumen
            </h3>

            {!file ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                  isDragging
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
                }`}
              >
                <UploadIcon
                  className={`w-16 h-16 mx-auto mb-4 ${
                    isDragging ? "text-blue-500" : "text-gray-400"
                  }`}
                />
                <p className="text-lg font-medium text-gray-900 mb-2">
                  Drag & drop file di sini
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  atau klik untuk memilih file
                </p>
                <p className="text-xs text-gray-400">
                  PDF, Word (Maks. 10MB)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <File className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={removeFile}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Document Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Informasi Dokumen
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Judul Dokumen <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Masukkan judul dokumen"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deskripsi (Opsional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tambahkan deskripsi atau catatan"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Signatories */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Penandatangan
                </h3>
                <p className="text-sm text-gray-600">
                  Tentukan urutan penandatangan dokumen
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowUserSelector(!showUserSelector)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Tambah
              </button>
            </div>

            {/* User Selector Dropdown */}
            <AnimatePresence>
              {showUserSelector && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden mb-4"
                >
                  <div className="border border-gray-200 rounded-lg bg-gray-50">
                    {/* Search Bar */}
                    <div className="p-4 border-b border-gray-200">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={userSearchQuery}
                          onChange={(e) => setUserSearchQuery(e.target.value)}
                          placeholder="Cari berdasarkan nama atau jabatan..."
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                      </div>
                    </div>

                    {/* User List */}
                    <div className="p-4 max-h-64 overflow-y-auto">
                      {filteredUsers.filter(u => !signatories.find(s => s.userId === u.id)).length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">
                          {userSearchQuery ? "Tidak ada user yang sesuai" : "Semua user sudah ditambahkan"}
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {filteredUsers
                            .filter(u => !signatories.find(s => s.userId === u.id))
                            .map((user) => (
                              <button
                                key={user.id}
                                type="button"
                                onClick={() => addSignatory(user.id)}
                                className="w-full flex items-center justify-between p-3 hover:bg-white rounded-lg transition-colors text-left"
                              >
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {user.fullName}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {user.email}
                                  </p>
                                </div>
                                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                  {user.adminTitle?.replace(/_/g, ' ')}
                                </span>
                              </button>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Signatories List */}
            {signatories.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">
                  Belum ada penandatangan ditambahkan
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Klik tombol "Tambah" untuk menambahkan penandatangan
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {signatories.map((signatory, index) => {
                  const user = getUserById(signatory.userId);
                  if (!user) return null;

                  return (
                    <div
                      key={signatory.userId}
                      className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg bg-white"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-semibold text-blue-600">
                            {signatory.order}
                          </span>
                        </div>
                      </div>

                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {user.fullName}
                        </p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => moveSignatory(signatory.userId, 'up')}
                          disabled={index === 0}
                          className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-gray-400 transition-colors"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveSignatory(signatory.userId, 'down')}
                          disabled={index === signatories.length - 1}
                          className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-gray-400 transition-colors"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeSignatory(signatory.userId)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors ml-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading || !file}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Mengupload...
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5" />
                  Upload Dokumen
                </>
              )}
            </button>
          </div>
        </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
