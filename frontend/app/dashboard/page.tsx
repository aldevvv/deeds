"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Clock,
  CheckCircle,
  TrendingUp,
  XCircle,
  Upload,
  Eye,
} from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { getUser, getToken } from "@/lib/auth";
import { documentsApi } from "@/lib/documents-api";
import Link from "next/link";

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<any[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    signed: 0,
    rejected: 0,
  });

  useEffect(() => {
    setUser(getUser());
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const docs = await documentsApi.getUserDocuments(token);
      setDocuments(docs);

      // Calculate stats
      setStats({
        total: docs.length,
        pending: docs.filter((d: any) => d.status === "PENDING").length,
        signed: docs.filter((d: any) => d.status === "SIGNED" || d.status === "COMPLETED").length,
        rejected: docs.filter((d: any) => d.status === "REJECTED").length,
      });
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Get recent 5 documents, sorted by createdAt descending
  const recentDocuments = documents
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Baru saja";
    if (diffMins < 60) return `${diffMins} menit yang lalu`;
    if (diffHours < 24) return `${diffHours} jam yang lalu`;
    if (diffDays < 7) return `${diffDays} hari yang lalu`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} minggu yang lalu`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} bulan yang lalu`;
    return `${Math.floor(diffDays / 365)} tahun yang lalu`;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: "bg-gray-100 text-gray-700",
      PENDING: "bg-yellow-100 text-yellow-700",
      SIGNED: "bg-blue-100 text-blue-700",
      REJECTED: "bg-red-100 text-red-700",
      COMPLETED: "bg-green-100 text-green-700",
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      DRAFT: "Draft",
      PENDING: "Menunggu",
      SIGNED: "Ditandatangani",
      REJECTED: "Ditolak",
      COMPLETED: "Selesai",
    };
    return labels[status] || status;
  };

  return (
    <DashboardLayout>
      <div className="p-8 bg-white min-h-screen">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 mb-8 text-white shadow-lg">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-white/20 backdrop-blur-sm rounded-xl">
              <FileText className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Selamat Datang, {user?.fullName || 'User'}! 👋
              </h1>
              <p className="text-blue-100">
                Kelola dan pantau semua dokumen Anda di satu tempat
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {loading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="bg-gray-100 rounded-xl p-6 animate-pulse">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </div>
                <div className="h-10 bg-gray-200 rounded w-20 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-32"></div>
              </div>
            ))
          ) : (
            <>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-sm font-medium text-blue-700 uppercase tracking-wide">
                    Total Laporan
                  </h3>
                </div>
                <p className="text-4xl font-bold text-blue-900">{stats.total}</p>
                <p className="text-sm text-blue-600 mt-2">Semua laporan Anda</p>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-sm font-medium text-orange-700 uppercase tracking-wide">
                    Menunggu Persetujuan
                  </h3>
                </div>
                <p className="text-4xl font-bold text-orange-900">{stats.pending}</p>
                <p className="text-sm text-orange-600 mt-2">Perlu ditindaklanjuti</p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-sm font-medium text-green-700 uppercase tracking-wide">
                    Disetujui
                  </h3>
                </div>
                <p className="text-4xl font-bold text-green-900">{stats.signed}</p>
                <p className="text-sm text-green-600 mt-2">Sudah selesai</p>
              </div>

              <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border border-red-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center">
                    <XCircle className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-sm font-medium text-red-700 uppercase tracking-wide">
                    Ditolak
                  </h3>
                </div>
                <p className="text-4xl font-bold text-red-900">{stats.rejected}</p>
                <p className="text-sm text-red-600 mt-2">Perlu revisi</p>
              </div>
            </>
          )}
        </div>

        {/* Recent Documents */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl border border-gray-200"
        >
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Laporan Terbaru</h3>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg animate-pulse">
                    <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : recentDocuments.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Belum ada laporan</p>
                <Link
                  href="/dashboard/upload"
                  className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <Upload className="w-4 h-4" />
                  Input Laporan Baru
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentDocuments.map((doc: any) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-medium text-gray-900 truncate">{doc.title}</h4>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(doc.createdAt).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}{" "}
                          • {getRelativeTime(doc.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(doc.status)}`}
                      >
                        {getStatusLabel(doc.status)}
                      </span>
                      <Link
                        href={`/dashboard/tracking`}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
