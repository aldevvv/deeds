"use client";

import { useState, useEffect } from "react";
import { Leaf, Download, Info, CheckCircle, XCircle, FileText, BookOpen } from "lucide-react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { documentsApi } from "@/lib/documents-api";
import { getToken } from "@/lib/auth";

interface EmissionRecord {
  id: string;
  periode: string;
  dokumen: number;
  halaman: number;
  metode: "SIMPLE" | "MASS";
  faktor: number;
  emisiDihemat: number;
  catatan: string;
}

interface DocumentStats {
  total: number;
  approved: number;
  rejected: number;
}

export default function SustainabilityPage() {
  const router = useRouter();
  const [records, setRecords] = useState<EmissionRecord[]>([]);
  const [factorPerPage, setFactorPerPage] = useState(0.144);
  const [documentStats, setDocumentStats] = useState<DocumentStats>({
    total: 0,
    approved: 0,
    rejected: 0,
  });
  const [loading, setLoading] = useState(true);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Load GLOBAL document stats from backend
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = getToken();
        if (!token) {
          throw new Error('No token found');
        }

        // Fetch GLOBAL stats (all documents in system)
        const stats = await documentsApi.getGlobalStats(token);
        
        const total = stats.total;
        const approved = stats.signed + stats.completed;
        const rejected = stats.rejected;
        
        setDocumentStats({ total, approved, rejected });

        // Generate record based on current month with GLOBAL data
        const currentMonth = new Date().toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
        const avgPagesPerDoc = 100; // Estimasi rata-rata halaman per dokumen
        const totalPages = total * avgPagesPerDoc;
        
        // Rumus SIMPLE: KgCO₂e = Halaman × factorPerPageKg (default 0.144)
        const emission = +(totalPages * factorPerPage).toFixed(2);
        
        const currentMonthRecord: EmissionRecord = {
          id: Date.now().toString(),
          periode: currentMonth,
          dokumen: total,
          halaman: totalPages,
          metode: "SIMPLE",
          faktor: factorPerPage,
          emisiDihemat: emission,
          catatan: `Data global sistem - Total: ${total} dokumen (${approved} disetujui, ${rejected} ditolak, ${stats.pending} pending)`,
        };

        setRecords([currentMonthRecord]);
      } catch (error) {
        console.error("Error fetching stats:", error);
        // Fallback to sample data
        const sampleData: EmissionRecord[] = [
          {
            id: "1",
            periode: "Des 2025",
            dokumen: 20,
            halaman: 2000,
            metode: "SIMPLE",
            faktor: 0.144,
            emisiDihemat: 288.0,
            catatan: "Data baseline dari slide",
          },
        ];
        setRecords(sampleData);
        setDocumentStats({ total: 20, approved: 15, rejected: 2 });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [factorPerPage]);

  const totalPages = records.reduce((sum, r) => sum + r.halaman, 0);
  const totalEmission = records.reduce((sum, r) => sum + r.emisiDihemat, 0);

  // Pagination calculations
  const totalRecords = records.length;
  const totalPagesCount = Math.ceil(totalRecords / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRecords = records.slice(startIndex, endIndex);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const exportCSV = () => {
    if (records.length === 0) {
      alert("Tidak ada data untuk diekspor");
      return;
    }

    const headers = "Periode,Dokumen,Halaman,Metode,Faktor (KgCO₂e/hal),Penghematan Emisi (KgCO₂e),Catatan\n";
    const rows = records
      .map(
        (r) =>
          `${r.periode},${r.dokumen},${r.halaman},${r.metode},${r.faktor},${r.emisiDihemat},"${r.catatan.replace(/"/g, '""')}"`
      )
      .join("\n");
    
    // Add BOM for UTF-8 encoding (agar Excel bisa baca karakter Indonesia)
    const BOM = "\uFEFF";
    const csv = BOM + headers + rows;
    
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Penghematan-Emisi-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
              <Leaf className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">Penghematan Emisi (Paperless)</h1>
              <p className="text-blue-100">
                Estimasi pengurangan jejak karbon melalui digitalisasi dokumen
              </p>
            </div>
          </div>
        </div>

        {/* Document Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-sm font-medium text-blue-700 uppercase tracking-wide">
                Total Dokumen
              </h3>
            </div>
            <p className="text-4xl font-bold text-blue-900">{formatNumber(documentStats.total)}</p>
            <p className="text-sm text-blue-600 mt-2">Dokumen didigitalkan</p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-sm font-medium text-green-700 uppercase tracking-wide">
                Dokumen Disetujui
              </h3>
            </div>
            <p className="text-4xl font-bold text-green-900">{formatNumber(documentStats.approved)}</p>
            <p className="text-sm text-green-600 mt-2">Sudah ditandatangani</p>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border border-red-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center">
                <XCircle className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-sm font-medium text-red-700 uppercase tracking-wide">
                Dokumen Ditolak
              </h3>
            </div>
            <p className="text-4xl font-bold text-red-900">{formatNumber(documentStats.rejected)}</p>
            <p className="text-sm text-red-600 mt-2">Tidak disetujui</p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                <Leaf className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-sm font-medium text-purple-700 uppercase tracking-wide">
                Total Emisi Dihemat
              </h3>
            </div>
            <p className="text-4xl font-bold text-purple-900">{formatNumber(totalEmission)}</p>
            <p className="text-sm text-purple-600 mt-2">KgCO₂e</p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => router.push('/dashboard/sustainability/info')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              Detail Informasi
            </button>
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Ekspor CSV
            </button>
            <div className="flex items-center gap-2 ml-auto">
              <label className="text-sm text-gray-600">Faktor Emisi:</label>
              <input
                type="number"
                step="0.001"
                value={factorPerPage}
                onChange={(e) => setFactorPerPage(parseFloat(e.target.value) || 0.144)}
                className="px-3 py-1 border border-gray-300 rounded-lg w-24 text-sm"
              />
              <span className="text-sm text-gray-500">KgCO₂e/hal</span>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Periode
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Dokumen (n)
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Halaman (n)
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Metode
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Faktor (KgCO₂e/hal)
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Penghematan Emisi (KgCO₂e)
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Catatan
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentRecords.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      <Leaf className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p className="text-sm">Belum ada data.</p>
                    </td>
                  </tr>
                ) : (
                  currentRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{record.periode}</td>
                      <td className="px-6 py-4 text-sm text-gray-700 text-right">
                        {formatNumber(record.dokumen)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 text-right">
                        {formatNumber(record.halaman)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                          {record.metode}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 text-right">{record.faktor}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-green-600 text-right">
                        {formatNumber(record.emisiDihemat)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{record.catatan}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPagesCount > 1 && (
          <div className="flex items-center justify-between mt-6 px-4">
            <div className="text-sm text-gray-600">
              Menampilkan {startIndex + 1} - {Math.min(endIndex, totalRecords)} dari {totalRecords} data
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
                {Array.from({ length: totalPagesCount }, (_, i) => i + 1).map((page) => (
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
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPagesCount))}
                disabled={currentPage === totalPagesCount}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === totalPagesCount
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
            <strong>Catatan:</strong> Nilai adalah estimasi dan dapat dikalibrasi sesuai kebijakan organisasi.
            Faktor emisi default adalah 0,144 KgCO₂e per halaman berdasarkan baseline 2.000 halaman = 288 KgCO₂e.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
