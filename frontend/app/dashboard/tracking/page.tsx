"use client";

import { useState, useEffect } from "react";
import { Activity, Search, FileText, Clock, CheckCircle, XCircle, Users, Calendar, Eye, Download } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { documentsApi } from "@/lib/documents-api";
import { getToken } from "@/lib/auth";
import { toast } from "sonner";

interface Document {
  id: string;
  title: string;
  description?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    fullName: string;
  };
  signatures: Array<{
    id: string;
    userId: string;
    status: string;
    signedAt?: string;
    order: number;
    user: {
      fullName: string;
      adminTitle?: string;
    };
  }>;
}

export default function TrackingPage() {
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const token = getToken();
        if (!token) throw new Error("No token found");

        const docs = await documentsApi.getUserDocuments(token);
        setDocuments(docs);
        setFilteredDocuments(docs);
      } catch (error) {
        console.error("Error fetching documents:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  useEffect(() => {
    let filtered = documents;

    // Filter by status
    if (statusFilter !== "ALL") {
      filtered = filtered.filter((doc) => doc.status === statusFilter);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (doc) =>
          doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doc.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doc.createdBy.fullName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredDocuments(filtered);
  }, [searchQuery, statusFilter, documents]);

  const getStatusBadge = (status: string) => {
    const badges: { [key: string]: { bg: string; text: string; label: string } } = {
      DRAFT: { bg: "bg-gray-100", text: "text-gray-700", label: "Draft" },
      PENDING: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Menunggu" },
      SIGNED: { bg: "bg-blue-100", text: "text-blue-700", label: "Ditandatangani" },
      REJECTED: { bg: "bg-red-100", text: "text-red-700", label: "Ditolak" },
      COMPLETED: { bg: "bg-green-100", text: "text-green-700", label: "Selesai" },
    };
    const badge = badges[status] || badges.DRAFT;
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  const getSignatureStatusBadge = (status: string) => {
    const badges: { [key: string]: { icon: any; color: string; label: string } } = {
      PENDING: { icon: Clock, color: "text-yellow-600", label: "Menunggu" },
      SIGNED: { icon: CheckCircle, color: "text-green-600", label: "Ditandatangani" },
      REJECTED: { icon: XCircle, color: "text-red-600", label: "Ditolak" },
    };
    const badge = badges[status] || badges.PENDING;
    const Icon = badge.icon;
    return (
      <div className={`flex items-center gap-2 ${badge.color}`}>
        <Icon className="w-4 h-4" />
        <span className="text-sm font-medium">{badge.label}</span>
      </div>
    );
  };

  const calculateProgress = (doc: Document) => {
    const totalSignatures = doc.signatures.length;
    if (totalSignatures === 0) return 0;
    const signedCount = doc.signatures.filter((sig) => sig.status === "SIGNED").length;
    return Math.round((signedCount / totalSignatures) * 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const openDetailModal = (doc: Document) => {
    setSelectedDocument(doc);
    setShowModal(true);
  };

  const handlePreview = async (doc: Document) => {
    try {
      const token = getToken();
      if (!token) {
        toast.error("Sesi berakhir. Silakan login kembali.");
        return;
      }

      const blob = await documentsApi.downloadDocument(token, doc.id);
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      window.open(url, '_blank');
    } catch (error: any) {
      toast.error(error.message || "Gagal membuka preview dokumen");
    }
  };

  const handleDownload = async (doc: Document) => {
    try {
      const token = getToken();
      if (!token) {
        toast.error("Sesi berakhir. Silakan login kembali.");
        return;
      }

      toast.loading("Mengunduh dokumen...", { id: "download" });
      const blob = await documentsApi.downloadDocument(token, doc.id);
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${doc.title}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success("Dokumen berhasil diunduh", { id: "download" });
    } catch (error: any) {
      toast.error(error.message || "Gagal mengunduh dokumen", { id: "download" });
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-8 bg-white min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
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
          <div className="flex items-center gap-4">
            <div className="p-4 bg-white/20 backdrop-blur-sm rounded-xl">
              <Activity className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">Daftar Laporan & Status</h1>
              <p className="text-blue-100">Pantau status dan progres laporan Anda secara real-time</p>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Cari judul, deskripsi, atau pembuat..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">Semua Status</option>
              <option value="PENDING">Menunggu</option>
              <option value="SIGNED">Ditandatangani</option>
              <option value="COMPLETED">Selesai</option>
              <option value="REJECTED">Ditolak</option>
            </select>
          </div>
        </div>

        {/* Documents List */}
        <div className="space-y-4">
          {filteredDocuments.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Tidak ada dokumen ditemukan</p>
            </div>
          ) : (
            filteredDocuments.map((doc) => {
              const progress = calculateProgress(doc);
              return (
                <div
                  key={doc.id}
                  className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{doc.title}</h3>
                        {getStatusBadge(doc.status)}
                      </div>
                      {doc.description && (
                        <p className="text-sm text-gray-600 mb-3">{doc.description}</p>
                      )}
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(doc.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openDetailModal(doc)}
                        className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        Detail
                      </button>
                      <button
                        onClick={() => handlePreview(doc)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        <FileText className="w-4 h-4" />
                        Preview
                      </button>
                      <button
                        onClick={() => handleDownload(doc)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-600 font-medium">Progres Persetujuan</span>
                      <span className="text-gray-900 font-semibold">{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Signatures Summary */}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>
                      {doc.signatures.filter((sig) => sig.status === "SIGNED").length} dari{" "}
                      {doc.signatures.length} tanda tangan selesai
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Detail Modal */}
        {showModal && selectedDocument && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedDocument.title}</h2>
                    {getStatusBadge(selectedDocument.status)}
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Document Info */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 uppercase mb-3">Informasi Dokumen</h3>
                  <div className="space-y-2 text-sm">
                    {selectedDocument.description && (
                      <p className="text-gray-600">
                        <strong>Deskripsi:</strong> {selectedDocument.description}
                      </p>
                    )}
                    <p className="text-gray-600">
                      <strong>Pembuat:</strong> {selectedDocument.createdBy.fullName}
                    </p>
                    <p className="text-gray-600">
                      <strong>Dibuat:</strong> {formatDate(selectedDocument.createdAt)}
                    </p>
                    <p className="text-gray-600">
                      <strong>Diperbarui:</strong> {formatDate(selectedDocument.updatedAt)}
                    </p>
                  </div>
                </div>

                {/* Progress */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 uppercase mb-3">Progres Persetujuan</h3>
                  <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-4 rounded-full transition-all duration-300"
                      style={{ width: `${calculateProgress(selectedDocument)}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-600 text-center font-medium">
                    {calculateProgress(selectedDocument)}% selesai
                  </p>
                </div>

                {/* Signatures List */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 uppercase mb-3">
                    Daftar Penandatangan ({selectedDocument.signatures.length})
                  </h3>
                  <div className="space-y-3">
                    {selectedDocument.signatures
                      .sort((a, b) => a.order - b.order)
                      .map((sig, index) => (
                        <div
                          key={sig.id}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{sig.user.fullName}</p>
                              {sig.user.adminTitle && (
                                <p className="text-xs text-gray-500">{sig.user.adminTitle}</p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            {getSignatureStatusBadge(sig.status)}
                            {sig.signedAt && (
                              <p className="text-xs text-gray-500 mt-1">{formatDate(sig.signedAt)}</p>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200">
                <button
                  onClick={() => setShowModal(false)}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer Note */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>Catatan:</strong> Halaman ini menampilkan daftar dan status real-time dari laporan yang Anda buat 
            dan laporan yang memerlukan persetujuan. Klik tombol "Detail" untuk melihat informasi lengkap dan daftar
            penandatangan.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
