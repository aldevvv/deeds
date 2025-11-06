"use client";

import { useState, useEffect } from "react";
import { Bell, CheckCircle, XCircle, Clock, FileText, Upload, User, Calendar } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { documentsApi } from "@/lib/documents-api";
import { getToken, getUser } from "@/lib/auth";

interface ActivityLog {
  id: string;
  type: "upload" | "signed" | "rejected" | "pending";
  title: string;
  description: string;
  timestamp: string;
  actor?: string;
  documentTitle?: string;
}

export default function NotificationsPage() {
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [filter, setFilter] = useState<"all" | "upload" | "signed" | "rejected" | "pending">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const user = getUser();

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const token = getToken();
        if (!token) throw new Error("No token found");

        const documents = await documentsApi.getUserDocuments(token);
        
        // Generate activity logs from documents
        const logs: ActivityLog[] = [];

        documents.forEach((doc: any) => {
          // Document uploaded
          logs.push({
            id: `upload-${doc.id}`,
            type: "upload",
            title: "Dokumen Diupload",
            description: `Anda mengupload dokumen "${doc.title}"`,
            timestamp: doc.createdAt,
            documentTitle: doc.title,
          });

          // Signature activities
          doc.signatures?.forEach((sig: any) => {
            if (sig.status === "SIGNED" && sig.signedAt) {
              logs.push({
                id: `signed-${sig.id}`,
                type: "signed",
                title: "Dokumen Ditandatangani",
                description: `${sig.user.fullName} menandatangani dokumen "${doc.title}"`,
                timestamp: sig.signedAt,
                actor: sig.user.fullName,
                documentTitle: doc.title,
              });
            } else if (sig.status === "REJECTED") {
              logs.push({
                id: `rejected-${sig.id}`,
                type: "rejected",
                title: "Dokumen Ditolak",
                description: `${sig.user.fullName} menolak dokumen "${doc.title}"`,
                timestamp: sig.updatedAt || doc.updatedAt,
                actor: sig.user.fullName,
                documentTitle: doc.title,
              });
            } else if (sig.status === "PENDING" && sig.userId === user?.id) {
              logs.push({
                id: `pending-${sig.id}`,
                type: "pending",
                title: "Menunggu Tanda Tangan Anda",
                description: `Dokumen "${doc.title}" menunggu tanda tangan Anda`,
                timestamp: doc.createdAt,
                documentTitle: doc.title,
              });
            }
          });
        });

        // Sort by timestamp descending
        logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setActivities(logs);
      } catch (error) {
        console.error("Error fetching activities:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [user?.id]);

  // Filter by type and search query
  const filteredActivities = activities.filter((act) => {
    const matchesFilter = filter === "all" || act.type === filter;
    const matchesSearch = searchQuery === "" || 
      act.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      act.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (act.documentTitle && act.documentTitle.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  // Pagination
  const totalPages = Math.ceil(filteredActivities.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentActivities = filteredActivities.slice(startIndex, endIndex);

  // Reset to page 1 when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchQuery]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "upload":
        return <Upload className="w-5 h-5" />;
      case "signed":
        return <CheckCircle className="w-5 h-5" />;
      case "rejected":
        return <XCircle className="w-5 h-5" />;
      case "pending":
        return <Clock className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "upload":
        return "bg-blue-100 text-blue-600 border-blue-200";
      case "signed":
        return "bg-green-100 text-green-600 border-green-200";
      case "rejected":
        return "bg-red-100 text-red-600 border-red-200";
      case "pending":
        return "bg-yellow-100 text-yellow-600 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins} menit yang lalu`;
    } else if (diffHours < 24) {
      return `${diffHours} jam yang lalu`;
    } else if (diffDays < 7) {
      return `${diffDays} hari yang lalu`;
    } else {
      return date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-8 bg-white min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Memuat aktivitas...</p>
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
          <div className="flex items-center gap-4">
            <div className="p-4 bg-white/20 backdrop-blur-sm rounded-xl">
              <Bell className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">Notifikasi & Aktivitas</h1>
              <p className="text-blue-100">Timeline aktivitas dan notifikasi dokumen Anda</p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Cari aktivitas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            />
            <Bell className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Semua ({activities.length})
            </button>
            <button
              onClick={() => setFilter("pending")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === "pending"
                  ? "bg-yellow-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Menunggu ({activities.filter((a) => a.type === "pending").length})
            </button>
            <button
              onClick={() => setFilter("signed")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === "signed"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Ditandatangani ({activities.filter((a) => a.type === "signed").length})
            </button>
            <button
              onClick={() => setFilter("rejected")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === "rejected"
                  ? "bg-red-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Ditolak ({activities.filter((a) => a.type === "rejected").length})
            </button>
            <button
              onClick={() => setFilter("upload")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === "upload"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Upload ({activities.filter((a) => a.type === "upload").length})
            </button>
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          {filteredActivities.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Tidak ada aktivitas</h3>
              <p className="text-gray-600">Belum ada aktivitas yang tercatat</p>
            </div>
          ) : (
            <div className="space-y-4">
              {currentActivities.map((activity, index) => (
                <div
                  key={activity.id}
                  className="flex gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div
                    className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center border-2 ${getActivityColor(
                      activity.type
                    )}`}
                  >
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">{activity.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">{activity.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formatTimestamp(activity.timestamp)}</span>
                      </div>
                      {activity.actor && (
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span>{activity.actor}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-600">
              Menampilkan {startIndex + 1} - {Math.min(endIndex, filteredActivities.length)} dari{" "}
              {filteredActivities.length} aktivitas
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === 1
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                Sebelumnya
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === page
                        ? "bg-blue-600 text-white"
                        : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === totalPages
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                Berikutnya
              </button>
            </div>
          </div>
        )}

        {/* Footer Note */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>Catatan:</strong> Halaman ini menampilkan timeline aktivitas real-time dari semua dokumen yang
            Anda upload dan dokumen yang memerlukan tanda tangan Anda. Notifikasi diperbarui secara otomatis.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
