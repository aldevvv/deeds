"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Calendar,
  Eye,
  Download,
  History,
  Search,
} from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { getToken } from "@/lib/auth";
import { documentsApi } from "@/lib/documents-api";

export default function SignatureHistoryPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const itemsPerPage = 5;

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
      
      // Filter only SIGNED and REJECTED signatures
      const historyDocs = allDocs.filter((d: any) => 
        d.mySignature?.status === 'SIGNED' || d.mySignature?.status === 'REJECTED'
      );
      setDocuments(historyDocs);
    } catch (error: any) {
      toast.error("Gagal memuat riwayat");
    } finally {
      setIsLoading(false);
    }
  };

  const formatAdminTitle = (title: string) => {
    return title
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const getStatusBadge = (status: string) => {
    if (status === 'SIGNED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200">
          <CheckCircle className="w-4 h-4" />
          Ditandatangani
        </span>
      );
    } else if (status === 'REJECTED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 border border-red-200">
          <XCircle className="w-4 h-4" />
          Ditolak
        </span>
      );
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat riwayat...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Filter by search query
  const filteredDocuments = documents.filter((doc: any) =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.uploader?.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredDocuments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentDocuments = filteredDocuments.slice(startIndex, startIndex + itemsPerPage);

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 mb-8 text-white shadow-lg">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-white/20 backdrop-blur-sm rounded-xl">
              <History className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">Riwayat Tanda Tangan</h1>
              <p className="text-blue-100">
                Dokumen yang telah Anda tandatangani atau tolak
              </p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Cari berdasarkan judul, deskripsi, atau nama uploader..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1); // Reset to first page on search
              }}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {documents.length === 0 ? (
          <div className="text-center py-12">
            <History className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Belum Ada Riwayat
            </h3>
            <p className="text-gray-600">
              Riwayat tanda tangan Anda akan muncul di sini
            </p>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Tidak Ada Hasil
            </h3>
            <p className="text-gray-600">
              Tidak ditemukan dokumen dengan kata kunci "{searchQuery}"
            </p>
          </div>
        ) : (
          <>
            {/* Documents List */}
            <div className="space-y-4">
              {currentDocuments.map((doc: any) => {
                const mySignatureStatus = doc.mySignature?.status;

                return (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all group"
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

                          {/* Status */}
                          <div className="mb-3">
                            {getStatusBadge(mySignatureStatus)}
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

                        <button
                          onClick={async () => {
                            try {
                              const token = getToken();
                              if (!token) {
                                toast.error("Sesi berakhir. Silakan login kembali.");
                                return;
                              }

                              const response = await fetch(
                                `${process.env.NEXT_PUBLIC_API_URL}/documents/download/${doc.id}`,
                                {
                                  headers: {
                                    Authorization: `Bearer ${token}`,
                                  },
                                }
                              );

                              if (!response.ok) {
                                throw new Error('Preview failed');
                              }

                              const blob = await response.blob();
                              const pdfBlob = new Blob([blob], { type: 'application/pdf' });
                              const url = window.URL.createObjectURL(pdfBlob);
                              
                              const newWindow = window.open(url, '_blank');
                              if (!newWindow) {
                                toast.error("Pop-up diblokir. Izinkan pop-up untuk preview.");
                              }
                              
                              setTimeout(() => {
                                window.URL.revokeObjectURL(url);
                              }, 5000);
                            } catch (error) {
                              toast.error("Gagal membuka preview dokumen");
                            }
                          }}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2"
                        >
                          <FileText className="w-4 h-4" />
                          Preview
                        </button>

                        <button
                          onClick={async () => {
                            try {
                              const token = getToken();
                              if (!token) {
                                toast.error("Sesi berakhir. Silakan login kembali.");
                                return;
                              }

                              const response = await fetch(
                                `${process.env.NEXT_PUBLIC_API_URL}/documents/download/${doc.id}`,
                                {
                                  headers: {
                                    Authorization: `Bearer ${token}`,
                                  },
                                }
                              );

                              if (!response.ok) {
                                throw new Error('Download failed');
                              }

                              const blob = await response.blob();
                              const url = window.URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = doc.fileName || 'document.pdf';
                              document.body.appendChild(a);
                              a.click();
                              window.URL.revokeObjectURL(url);
                              document.body.removeChild(a);
                              toast.success("Download berhasil!");
                            } catch (error) {
                              toast.error("Gagal download dokumen");
                            }
                          }}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Pagination - Only show if more than 5 documents */}
            {filteredDocuments.length > itemsPerPage && (
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
          </>
        )}

        {/* Detail Modal */}
        {showDetailModal && selectedDoc && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Detail Dokumen</h2>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Judul</label>
                    <p className="text-lg font-semibold text-gray-900">{selectedDoc.title}</p>
                  </div>

                  {selectedDoc.description && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Deskripsi</label>
                      <p className="text-gray-900">{selectedDoc.description}</p>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium text-gray-600">Diupload oleh</label>
                    <p className="text-gray-900">{selectedDoc.uploader?.fullName}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">Tanggal Upload</label>
                    <p className="text-gray-900">
                      {new Date(selectedDoc.createdAt).toLocaleString("id-ID")}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">Status Tanda Tangan Anda</label>
                    <div className="mt-2">{getStatusBadge(selectedDoc.mySignature?.status)}</div>
                  </div>

                  {selectedDoc.mySignature?.signedAt && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        {selectedDoc.mySignature.status === 'SIGNED' ? 'Ditandatangani pada' : 'Ditolak pada'}
                      </label>
                      <p className="text-gray-900">
                        {new Date(selectedDoc.mySignature.signedAt).toLocaleString("id-ID")}
                      </p>
                    </div>
                  )}

                  {selectedDoc.mySignature?.rejectionReason && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Alasan Penolakan</label>
                      <p className="text-gray-900">{selectedDoc.mySignature.rejectionReason}</p>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium text-gray-600 mb-2 block">
                      Daftar Penandatangan
                    </label>
                    <div className="space-y-2">
                      {selectedDoc.signatures
                        ?.sort((a: any, b: any) => a.order - b.order)
                        .map((sig: any) => (
                          <div
                            key={sig.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-semibold text-sm">
                                {sig.order}
                              </span>
                              <div>
                                <p className="font-medium text-gray-900">{sig.user.fullName}</p>
                                <p className="text-sm text-gray-600">
                                  <span className="px-2 py-0.5 bg-gray-200 rounded text-xs font-semibold">
                                    {formatAdminTitle(sig.user.adminTitle)}
                                  </span>
                                </p>
                              </div>
                            </div>
                            <div>
                              {sig.status === "SIGNED" && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  <CheckCircle className="w-3 h-3" />
                                  Ditandatangani
                                </span>
                              )}
                              {sig.status === "PENDING" && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  <Clock className="w-3 h-3" />
                                  Menunggu
                                </span>
                              )}
                              {sig.status === "REJECTED" && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  <XCircle className="w-3 h-3" />
                                  Ditolak
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
