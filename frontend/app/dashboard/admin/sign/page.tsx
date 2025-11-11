"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Calendar,
  AlertCircle,
  Eye,
  Download,
  PenTool,
  Search,
} from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { getToken } from "@/lib/auth";
import { documentsApi, Document } from "@/lib/documents-api";

export default function SignDocumentsListPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  
  // Stats
  const [stats, setStats] = useState({
    signed: 0,
    pending: 0,
    rejected: 0,
  });

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const token = getToken();
      if (!token) {
        toast.error("Sesi berakhir. Silakan login kembali.");
        return;
      }

      const allDocs = await documentsApi.getPendingSignatures(token);
      
      // Filter only PENDING signatures
      const pendingDocs = allDocs.filter((d: any) => d.mySignature?.status === 'PENDING');
      setDocuments(pendingDocs);
      
      // Calculate stats from ALL signatures
      const allMySignatures = allDocs.map((d: any) => d.mySignature);
      setStats({
        signed: allMySignatures.filter((s: any) => s.status === 'SIGNED').length,
        pending: allMySignatures.filter((s: any) => s.status === 'PENDING').length,
        rejected: allMySignatures.filter((s: any) => s.status === 'REJECTED').length,
      });
    } catch (error: any) {
      toast.error("Gagal memuat dokumen");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedDoc || !rejectReason.trim()) {
      toast.error("Silakan masukkan alasan penolakan");
      return;
    }

    setIsProcessing(true);
    try {
      const token = getToken();
      if (!token) {
        toast.error("Sesi berakhir. Silakan login kembali.");
        return;
      }

      const signatureId = (selectedDoc as any).mySignature.id;
      await documentsApi.rejectDocument(token, signatureId, rejectReason);

      toast.success("Dokumen berhasil ditolak");
      setShowRejectModal(false);
      setSelectedDoc(null);
      setRejectReason("");
      fetchDocuments();
    } catch (error: any) {
      toast.error(error.message || "Gagal menolak dokumen");
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800 border-green-200";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "REJECTED":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "Selesai";
      case "IN_PROGRESS":
        return "Dalam Proses";
      case "REJECTED":
        return "Ditolak";
      default:
        return status;
    }
  };

  const formatAdminTitle = (title: string) => {
    return title
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Filter to only show PENDING documents  
  const pendingDocuments = documents.filter((doc) => doc.status === "PENDING");

  // Filter by search query
  const filteredDocuments = pendingDocuments.filter((doc) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      doc.title?.toLowerCase().includes(query) ||
      doc.description?.toLowerCase().includes(query) ||
      (doc as any).uploader?.fullName?.toLowerCase().includes(query) ||
      (doc as any).createdBy?.fullName?.toLowerCase().includes(query)
    );
  });

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Pagination logic
  const totalPages = Math.ceil(filteredDocuments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentDocuments = filteredDocuments.slice(startIndex, endIndex);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat dokumen...</p>
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
              <PenTool className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">Tanda Tangani Dokumen</h1>
              <p className="text-blue-100">
                Dokumen yang menunggu tanda tangan Anda
              </p>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-sm font-medium text-green-700 uppercase tracking-wide">
                Telah Ditandatangani
              </h3>
            </div>
            <p className="text-4xl font-bold text-green-900">{stats.signed}</p>
            <p className="text-sm text-green-600 mt-2">Dokumen sudah disetujui</p>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6 border border-yellow-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-sm font-medium text-yellow-700 uppercase tracking-wide">
                Menunggu Tanda Tangan
              </h3>
            </div>
            <p className="text-4xl font-bold text-yellow-900">{stats.pending}</p>
            <p className="text-sm text-yellow-600 mt-2">Perlu tindakan Anda</p>
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
            <p className="text-sm text-red-600 mt-2">Dokumen tidak disetujui</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Cari dokumen berdasarkan judul, deskripsi, atau pembuat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            />
          </div>
        </div>

        {/* Documents List */}
        {currentDocuments.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Tidak Ada Dokumen
            </h3>
            <p className="text-gray-600">
              Tidak ada dokumen yang perlu ditandatangani saat ini
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {currentDocuments.map((doc: any) => {
              const currentOrder = doc.currentSignatureOrder ?? doc.mySignature?.order;
              const canSign = doc.mySignature?.order === currentOrder;
              const mySignatureStatus = doc.mySignature?.status;

              return (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all"
                >
                  {/* Card Content */}
                  <div className="p-6">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {doc.title}
                        </h3>
                        {doc.description && (
                          <p className="text-sm text-gray-600 line-clamp-2 mb-3">{doc.description}</p>
                        )}

                        {/* Author */}
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                          <User className="w-4 h-4 flex-shrink-0" />
                          <span>{doc.uploader?.fullName || doc.createdBy?.fullName || 'Unknown'}</span>
                        </div>

                        {/* Date & Time */}
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                          <Calendar className="w-4 h-4 flex-shrink-0" />
                          <span>
                            {new Date(doc.createdAt).toLocaleDateString("id-ID", {
                              day: "2-digit",
                              month: "long",
                              year: "numeric",
                            })}{" "}
                            • {new Date(doc.createdAt).toLocaleTimeString("id-ID", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>

                        {/* Progress */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600">Progress Tanda Tangan</span>
                            <span className="text-sm font-medium text-gray-900">
                              {doc.signatures.filter((s: any) => s.status === "SIGNED").length}/{doc.signatures.length}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{
                                width: `${
                                  (doc.signatures.filter((s: any) => s.status === "SIGNED").length /
                                    doc.signatures.length) *
                                  100
                                }%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions - Aligned with icon column */}
                    <div className="flex gap-2 ml-14">
                      <button
                        onClick={() => {
                          setSelectedDoc(doc);
                          setShowDetailModal(true);
                        }}
                        className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm font-medium flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        Lihat Detail
                      </button>
                      {canSign && mySignatureStatus === "PENDING" && (
                        <>
                          <button
                            onClick={() => window.open(`/dashboard/admin/sign/${doc.id}`, '_blank')}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center gap-2"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Tanda Tangani
                          </button>
                          <button
                            onClick={() => {
                              setSelectedDoc(doc);
                              setShowRejectModal(true);
                            }}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium flex items-center gap-2"
                          >
                            <XCircle className="w-4 h-4" />
                            Tolak
                          </button>
                        </>
                      )}
                      <button
                        onClick={async () => {
                          try {
                            const token = getToken();
                            if (!token) {
                              toast.error("Sesi berakhir. Silakan login kembali.");
                              return;
                            }
                            
                            toast.loading("Memuat preview...", { id: "preview" });
                            
                            const blob = await documentsApi.previewDocument(token, doc.id);
                            const pdfBlob = new Blob([blob], { type: 'application/pdf' });
                            const url = window.URL.createObjectURL(pdfBlob);
                            
                            // Open in new tab
                            const newWindow = window.open(url, '_blank');
                            if (!newWindow) {
                              toast.error("Pop-up diblokir. Izinkan pop-up untuk preview.", { id: "preview" });
                            } else {
                              toast.success("Preview dibuka", { id: "preview" });
                            }
                            
                            // Cleanup after a delay
                            setTimeout(() => {
                              window.URL.revokeObjectURL(url);
                            }, 5000);
                          } catch (error: any) {
                            toast.error(error.message || "Gagal membuka preview dokumen", { id: "preview" });
                          }
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2"
                      >
                        <FileText className="w-4 h-4" />
                        Preview
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sebelumnya
                </button>
                
                <div className="flex gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        currentPage === page
                          ? "bg-blue-600 text-white"
                          : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Selanjutnya
                </button>
          </div>
        )}

        {/* Detail Modal */}
        <AnimatePresence>
          {showDetailModal && selectedDoc && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowDetailModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">
                    Detail Dokumen
                  </h3>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <XCircle className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Nama File</p>
                      <p className="text-base text-gray-900">
                        {selectedDoc.fileName || selectedDoc.title}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Ekstensi File</p>
                      <p className="text-base text-gray-900">
                        {selectedDoc.fileName?.split('.').pop()?.toUpperCase() || 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Ukuran File</p>
                      <p className="text-base text-gray-900">
                        {selectedDoc.fileSize 
                          ? `${(selectedDoc.fileSize / 1024 / 1024).toFixed(2)} MB`
                          : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Status</p>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                          selectedDoc.status
                        )}`}
                      >
                        {getStatusText(selectedDoc.status)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-1">Diunggah Oleh</p>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <p className="text-base text-gray-900">
                        {(selectedDoc as any).uploader?.fullName || 
                         (selectedDoc as any).createdBy?.fullName || 
                         'Unknown'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-1">Waktu Unggah</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <p className="text-base text-gray-900">
                        {new Date(selectedDoc.createdAt).toLocaleString("id-ID", {
                          dateStyle: "full",
                          timeStyle: "short"
                        })}
                      </p>
                    </div>
                  </div>

                  {selectedDoc.description && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Deskripsi</p>
                      <p className="text-base text-gray-900">
                        {selectedDoc.description}
                      </p>
                    </div>
                  )}

                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600 mb-3">
                      Progress Tanda Tangan ({(selectedDoc as any).signatures?.filter((s: any) => s.status === "SIGNED").length || 0}/{(selectedDoc as any).signatures?.length || 0})
                    </p>
                    <div className="space-y-2">
                      {(selectedDoc as any).signatures?.map((sig: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                              sig.status === 'SIGNED' ? 'bg-green-100 text-green-700' : 
                              sig.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 
                              'bg-gray-100 text-gray-500'
                            }`}>
                              {sig.order}
                            </div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm text-gray-900">
                                {sig.user?.fullName || 'Unknown'}
                              </p>
                              {sig.user?.adminTitle && (
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-semibold">
                                  {formatAdminTitle(sig.user.adminTitle)}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            sig.status === 'SIGNED' ? 'bg-green-100 text-green-700' : 
                            sig.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {sig.status === 'SIGNED' ? 'Ditandatangani' : 
                             sig.status === 'REJECTED' ? 'Ditolak' : 
                             'Menunggu'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Tutup
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reject Modal */}
        <AnimatePresence>
          {showRejectModal && selectedDoc && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowRejectModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Tolak Dokumen
                </h3>
                <p className="text-gray-600 mb-4">
                  Dokumen: <span className="font-medium">{selectedDoc.title}</span>
                </p>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Masukkan alasan penolakan..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                  rows={4}
                />
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowRejectModal(false);
                      setRejectReason("");
                    }}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={isProcessing || !rejectReason.trim()}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? "Memproses..." : "Tolak Dokumen"}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
