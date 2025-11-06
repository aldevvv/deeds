"use client";

import { ArrowLeft, Calculator, Info } from "lucide-react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

export default function SustainabilityInfoPage() {
  const router = useRouter();

  return (
    <DashboardLayout>
      <div className="p-8 bg-white min-h-screen">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 mb-8 text-white shadow-lg">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-white/90 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Kembali
          </button>
          <div className="flex items-center gap-4">
            <div className="p-4 bg-white/20 backdrop-blur-sm rounded-xl">
              <Calculator className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">Detail Informasi & Rumus Perhitungan</h1>
              <p className="text-blue-100">
                Metodologi perhitungan penghematan emisi karbon dari digitalisasi dokumen
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-8">
          {/* Metode SIMPLE */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <Calculator className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Metode SIMPLE (Per Halaman)</h2>
            </div>
            
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Baseline Data</h3>
                <p className="text-blue-800 text-sm">
                  Berdasarkan data dari slide: <strong>2.000 halaman</strong> kertas menghasilkan emisi <strong>288 KgCO₂e</strong>
                </p>
                <p className="text-blue-800 text-sm mt-2">
                  Faktor emisi per halaman: <code className="bg-blue-100 px-2 py-1 rounded">288 ÷ 2.000 = 0,144 KgCO₂e/halaman</code>
                </p>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Rumus Perhitungan</h3>
                <div className="bg-white border-2 border-blue-500 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-blue-600 font-mono">
                    Emisi Dihemat (KgCO₂e) = Total Halaman × 0,144
                  </p>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-3">Contoh Perhitungan</h3>
                <div className="space-y-2 text-sm text-green-800">
                  <p><strong>Skenario 1:</strong></p>
                  <p>• Total Dokumen: 20 dokumen</p>
                  <p>• Rata-rata Halaman per Dokumen: 100 halaman</p>
                  <p>• Total Halaman: 20 × 100 = <strong>2.000 halaman</strong></p>
                  <p>• Emisi Dihemat: 2.000 × 0,144 = <strong className="text-green-600">288,00 KgCO₂e</strong> ✓</p>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-900 mb-2">Keunggulan Metode SIMPLE</h3>
                <ul className="list-disc list-inside text-sm text-yellow-800 space-y-1">
                  <li>Mudah dipahami dan dihitung</li>
                  <li>Tidak memerlukan data detail komponen produksi</li>
                  <li>Cocok untuk estimasi cepat dan monitoring rutin</li>
                  <li>Faktor emisi dapat disesuaikan dengan kebijakan organisasi</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Metode MASS_BASED (Opsional) */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                <Calculator className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Metode MASS_BASED (Berbasis Berat Kertas)</h2>
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">Opsional</span>
            </div>

            <div className="space-y-4">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="font-semibold text-purple-900 mb-2">Parameter</h3>
                <ul className="text-sm text-purple-800 space-y-1">
                  <li>• <strong>sheetWeightGram</strong>: Berat per lembar kertas (default: <code className="bg-purple-100 px-2 py-1 rounded">5,0 gram</code> ≈ A4 80gsm)</li>
                  <li>• <strong>factorPaperProductionKgPerKg</strong>: Emisi produksi kertas (KgCO₂e per Kg kertas)</li>
                  <li>• <strong>factorPrintingKgPerPage</strong>: Emisi proses cetak (KgCO₂e per halaman)</li>
                  <li>• <strong>factorWasteAvoidedKgPerKg</strong>: Emisi limbah yang dihindari (KgCO₂e per Kg kertas)</li>
                </ul>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Langkah Perhitungan</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="font-medium text-gray-700">1. Hitung Berat Kertas yang Dihindari:</p>
                    <div className="bg-white border border-gray-300 rounded p-2 mt-1 font-mono text-purple-600">
                      PaperWeightKg = (Total Halaman × sheetWeightGram) ÷ 1000
                    </div>
                  </div>
                  
                  <div>
                    <p className="font-medium text-gray-700">2. Hitung Komponen Emisi:</p>
                    <div className="bg-white border border-gray-300 rounded p-2 mt-1 space-y-1 font-mono text-sm text-purple-600">
                      <p>E_paper = PaperWeightKg × factorPaperProductionKgPerKg</p>
                      <p>E_print = Total Halaman × factorPrintingKgPerPage</p>
                      <p>E_waste = PaperWeightKg × factorWasteAvoidedKgPerKg</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="font-medium text-gray-700">3. Total Penghematan Emisi:</p>
                    <div className="bg-white border-2 border-purple-500 rounded p-2 mt-1 font-mono text-purple-600 font-semibold">
                      EmissionSavedKg = E_paper + E_print + E_waste
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-3">Contoh Perhitungan</h3>
                <div className="space-y-2 text-sm text-green-800">
                  <p><strong>Skenario:</strong></p>
                  <p>• Total Halaman: 500</p>
                  <p>• Berat per Lembar: 5 gram</p>
                  <p>• Faktor Produksi Kertas: 1,00 KgCO₂e/Kg</p>
                  <p>• Faktor Cetak: 0,002 KgCO₂e/hal</p>
                  <p>• Faktor Limbah: 0,20 KgCO₂e/Kg</p>
                  
                  <div className="mt-3 pt-3 border-t border-green-300">
                    <p><strong>Perhitungan:</strong></p>
                    <p>• Berat Kertas: (500 × 5) ÷ 1000 = <strong>2,5 Kg</strong></p>
                    <p>• E_paper: 2,5 × 1,00 = <strong>2,50 KgCO₂e</strong></p>
                    <p>• E_print: 500 × 0,002 = <strong>1,00 KgCO₂e</strong></p>
                    <p>• E_waste: 2,5 × 0,20 = <strong>0,50 KgCO₂e</strong></p>
                    <p className="mt-2 text-base">• <strong className="text-green-600">Total: 4,00 KgCO₂e</strong> ✓</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Catatan Penting */}
          <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <Info className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-blue-900 mb-2">Catatan Penting</h3>
                <ul className="text-sm text-blue-800 space-y-2">
                  <li>• <strong>Faktor Emisi Default:</strong> Sistem menggunakan faktor 0,144 KgCO₂e/halaman berdasarkan baseline data slide (2.000 halaman = 288 KgCO₂e)</li>
                  <li>• <strong>Kalibrasi:</strong> Faktor emisi dapat disesuaikan melalui input di halaman utama sesuai kebijakan organisasi atau data terbaru</li>
                  <li>• <strong>Estimasi Halaman:</strong> Sistem menggunakan estimasi rata-rata 100 halaman per dokumen untuk perhitungan otomatis</li>
                  <li>• <strong>Transparansi:</strong> Semua perhitungan dapat diverifikasi dan disesuaikan untuk meningkatkan akurasi</li>
                  <li>• <strong>Metode yang Digunakan:</strong> Saat ini sistem menggunakan metode SIMPLE untuk kemudahan dan konsistensi</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Referensi */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
            <h3 className="font-bold text-gray-900 mb-3">Referensi Data</h3>
            <div className="text-sm text-gray-700 space-y-2">
              <p>• Baseline emisi: Data internal PT PLN (Persero)</p>
              <p>• Metodologi: SIMPLE (Per Page) & MASS_BASED (Berbasis Berat Kertas)</p>
              <p>• Target pengurangan emisi: ±1.096 KgCO₂-e dalam 5 tahun (hingga 2029)</p>
              <p>• Sumber: Project Brief DEEDS - Digital End-to-End Document Signing</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
