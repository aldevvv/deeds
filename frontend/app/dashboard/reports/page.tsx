"use client";

import { useState, useEffect } from "react";
import { BarChart3, TrendingUp, FileText, Clock, CheckCircle, XCircle, Download } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { documentsApi } from "@/lib/documents-api";
import { getToken } from "@/lib/auth";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

interface DocumentStats {
  total: number;
  pending: number;
  signed: number;
  rejected: number;
  completed: number;
}

interface Document {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  signatures: any[];
}

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState<DocumentStats>({
    total: 0,
    pending: 0,
    signed: 0,
    rejected: 0,
    completed: 0,
  });
  const [documents, setDocuments] = useState<Document[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = getToken();
        if (!token) throw new Error("No token found");

        // Fetch user's documents
        const docs = await documentsApi.getUserDocuments(token);
        setDocuments(docs);

        // Calculate user stats from documents
        const stats = {
          total: docs.length,
          pending: docs.filter((doc: any) => doc.status === 'PENDING').length,
          signed: docs.filter((doc: any) => doc.status === 'SIGNED').length,
          rejected: docs.filter((doc: any) => doc.status === 'REJECTED').length,
          completed: docs.filter((doc: any) => doc.status === 'COMPLETED').length,
        };
        setUserStats(stats);

        // Generate monthly data
        const monthly = generateMonthlyData(docs);
        setMonthlyData(monthly);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const generateMonthlyData = (docs: Document[]) => {
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Oct", "Nov", "Des"];
    const currentMonth = new Date().getMonth();
    const monthlyCount: any = {};

    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      monthlyCount[months[monthIndex]] = { total: 0, signed: 0, pending: 0, rejected: 0 };
    }

    // Count documents by month
    docs.forEach((doc) => {
      const docDate = new Date(doc.createdAt);
      const monthName = months[docDate.getMonth()];
      if (monthlyCount[monthName]) {
        monthlyCount[monthName].total++;
        if (doc.status === "SIGNED" || doc.status === "COMPLETED") {
          monthlyCount[monthName].signed++;
        } else if (doc.status === "PENDING") {
          monthlyCount[monthName].pending++;
        } else if (doc.status === "REJECTED") {
          monthlyCount[monthName].rejected++;
        }
      }
    });

    return Object.keys(monthlyCount).map((month) => ({
      name: month,
      Total: monthlyCount[month].total,
      Disetujui: monthlyCount[month].signed,
      Pending: monthlyCount[month].pending,
      Ditolak: monthlyCount[month].rejected,
    }));
  };

  const pieData = [
    { name: "Disetujui", value: userStats.signed + userStats.completed, color: "#10b981" },
    { name: "Pending", value: userStats.pending, color: "#f59e0b" },
    { name: "Ditolak", value: userStats.rejected, color: "#ef4444" },
  ];

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("id-ID").format(num);
  };

  const calculateApprovalRate = () => {
    if (userStats.total === 0) return 0;
    return (((userStats.signed + userStats.completed) / userStats.total) * 100).toFixed(1);
  };

  const calculateAvgSignatureTime = () => {
    let totalDays = 0;
    let count = 0;

    documents.forEach((doc) => {
      const completedSignatures = doc.signatures.filter((sig: any) => sig.signedAt);
      if (completedSignatures.length > 0) {
        const createdAt = new Date(doc.createdAt);
        const lastSigned = new Date(
          Math.max(...completedSignatures.map((sig: any) => new Date(sig.signedAt).getTime()))
        );
        const diffDays = Math.floor((lastSigned.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
        totalDays += diffDays;
        count++;
      }
    });

    return count > 0 ? (totalDays / count).toFixed(1) : "0";
  };

  const exportReport = () => {
    const headers = "Bulan,Total Dokumen,Disetujui,Pending,Ditolak\n";
    const rows = monthlyData
      .map((data) => `${data.name},${data.Total},${data.Disetujui},${data.Pending},${data.Ditolak}`)
      .join("\n");
    const BOM = "\uFEFF";
    const csv = BOM + headers + rows;

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Rekap-Statistik-${new Date().toISOString().split("T")[0]}.csv`;
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-white/20 backdrop-blur-sm rounded-xl">
                <BarChart3 className="w-10 h-10" />
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-2">Rekap & Statistik</h1>
                <p className="text-blue-100">Analisis dan laporan aktivitas dokumen digital</p>
              </div>
            </div>
            <button
              onClick={exportReport}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Ekspor Laporan
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-sm font-medium text-blue-700 uppercase tracking-wide">Total Dokumen</h3>
            </div>
            <p className="text-4xl font-bold text-blue-900">{formatNumber(userStats.total)}</p>
            <p className="text-sm text-blue-600 mt-2">Dokumen Anda</p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-sm font-medium text-green-700 uppercase tracking-wide">Tingkat Persetujuan</h3>
            </div>
            <p className="text-4xl font-bold text-green-900">{calculateApprovalRate()}%</p>
            <p className="text-sm text-green-600 mt-2">
              {formatNumber(userStats.signed + userStats.completed)} dari {formatNumber(userStats.total)} dokumen
            </p>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-sm font-medium text-orange-700 uppercase tracking-wide">Rata-rata Waktu</h3>
            </div>
            <p className="text-4xl font-bold text-orange-900">{calculateAvgSignatureTime()}</p>
            <p className="text-sm text-orange-600 mt-2">Hari hingga selesai</p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-sm font-medium text-purple-700 uppercase tracking-wide">Menunggu Persetujuan</h3>
            </div>
            <p className="text-4xl font-bold text-purple-900">{formatNumber(userStats.pending)}</p>
            <p className="text-sm text-purple-600 mt-2">Dokumen menunggu</p>
          </div>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Bar Chart - Monthly Trends */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tren Bulanan (6 Bulan Terakhir)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Total" fill="#3b82f6" />
                <Bar dataKey="Disetujui" fill="#10b981" />
                <Bar dataKey="Pending" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie Chart - Status Distribution */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribusi Status Dokumen</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Line Chart - Approval Trend */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tren Persetujuan Dokumen</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="Disetujui" stroke="#10b981" strokeWidth={2} />
              <Line type="monotone" dataKey="Pending" stroke="#f59e0b" strokeWidth={2} />
              <Line type="monotone" dataKey="Ditolak" stroke="#ef4444" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Summary Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Ringkasan Bulanan</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Bulan
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Total Dokumen
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Disetujui
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Pending
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Ditolak
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Tingkat Persetujuan
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {monthlyData.map((data, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{data.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 text-right">{data.Total}</td>
                    <td className="px-6 py-4 text-sm text-green-600 text-right font-semibold">
                      {data.Disetujui}
                    </td>
                    <td className="px-6 py-4 text-sm text-orange-600 text-right">{data.Pending}</td>
                    <td className="px-6 py-4 text-sm text-red-600 text-right">{data.Ditolak}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 text-right font-semibold">
                      {data.Total > 0 ? ((data.Disetujui / data.Total) * 100).toFixed(1) : "0"}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>Catatan:</strong> Data yang ditampilkan adalah statistik dokumen Anda secara real-time. 
            Statistik mencakup dokumen yang Anda buat dan dokumen yang memerlukan persetujuan. 
            Tingkat persetujuan dihitung dari dokumen yang telah disetujui dibagi total dokumen Anda.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
