"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import SignatureCanvas from "react-signature-canvas";
import dynamic from "next/dynamic";
import {
  ArrowLeft,
  Pencil,
  Upload,
  Type,
  RotateCcw,
  Check,
  FileText,
  X,
  FileSignature,
} from "lucide-react";
import { getToken } from "@/lib/auth";
import { documentsApi } from "@/lib/documents-api";
import { savedSignaturesApi, SavedSignature } from "@/lib/saved-signatures-api";

const PDFSignatureViewer = dynamic(
  () => import("@/components/PDFSignatureViewer"),
  { ssr: false }
);

type SignatureMethod = "draw" | "upload" | "type";

export default function SignDocumentPage() {
  const params = useParams();
  const router = useRouter();
  const documentId = params.documentId as string;

  const [documentData, setDocumentData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Saved Signatures
  const [savedSignatures, setSavedSignatures] = useState<SavedSignature[]>([]);
  const [showImportModal, setShowImportModal] = useState(false);

  // Signature creation (temporary - untuk buat signature baru)
  const [signatureMethod, setSignatureMethod] = useState<SignatureMethod>("draw");
  const [tempSignatureImage, setTempSignatureImage] = useState<string>("");
  const [typedText, setTypedText] = useState("");
  const [uploadedImage, setUploadedImage] = useState<string>("");
  const [removeBackground, setRemoveBackground] = useState(false);
  const [signatureColor, setSignatureColor] = useState<string>("#000000"); // Default black
  const sigCanvas = useRef<SignatureCanvas>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // MULTIPLE SIGNATURES - Array approach (batch submit)
  const [placedSignatures, setPlacedSignatures] = useState<Array<{
    image: string;
    position: { x: number; y: number; width: number; height: number; page: number };
  }>>([]);
  
  // Track current temp position (only for display, not saved yet)
  const [currentTempPosition, setCurrentTempPosition] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
    page: number;
  } | null>(null);
  
  // Modal state for showing placed signatures
  const [showSignaturesModal, setShowSignaturesModal] = useState(false);

  useEffect(() => {
    fetchDocument();
    fetchSavedSignatures();
  }, [documentId]);
  
  const fetchSavedSignatures = async () => {
    try {
      const signatures = await savedSignaturesApi.getAll();
      setSavedSignatures(signatures);
    } catch (error) {
      console.error("Failed to fetch saved signatures:", error);
    }
  };

  const fetchDocument = async () => {
    try {
      const token = getToken();
      if (!token) {
        toast.error("Sesi berakhir. Silakan login kembali.");
        router.push("/login");
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/documents/pending-signatures`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch document");

      const docs = await response.json();
      const doc = docs.find((d: any) => d.id === documentId);

      if (!doc) {
        toast.error("Dokumen tidak ditemukan");
        router.push("/dashboard/admin/sign");
        return;
      }

      setDocumentData(doc);
    } catch (error) {
      toast.error("Gagal memuat dokumen");
      router.push("/dashboard/admin/sign");
    } finally {
      setIsLoading(false);
    }
  };

  const clearSignature = () => {
    if (signatureMethod === "draw" && sigCanvas.current) {
      sigCanvas.current.clear();
    } else if (signatureMethod === "type") {
      setTypedText("");
    } else if (signatureMethod === "upload") {
      setUploadedImage("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
    setTempSignatureImage("");
  };
  
  // Track position during drag - just for visual feedback
  const handleSignaturePlaced = (position: { x: number; y: number; width: number; height: number; page: number } | null) => {
    setCurrentTempPosition(position);
  };
  
  // Confirm placement - add to array (NOT submit to backend yet)
  const handleConfirmPlacement = () => {
    if (!tempSignatureImage || !currentTempPosition) {
      toast.error("Posisikan tanda tangan terlebih dahulu");
      return;
    }
    
    // Add to placed signatures array
    setPlacedSignatures([...placedSignatures, {
      image: tempSignatureImage,
      position: currentTempPosition
    }]);
    
    toast.success(`✓ Tanda tangan ${placedSignatures.length + 1} ditempatkan! Lanjutkan ke halaman lain atau klik Simpan Semua.`, {
      duration: 3000
    });
    
    // Clear temp signature for next one
    setTempSignatureImage("");
    setCurrentTempPosition(null);
    if (sigCanvas.current) {
      sigCanvas.current.clear();
    }
  };
  
  // Remove signature from array
  const handleRemoveSignature = (index: number) => {
    setPlacedSignatures(placedSignatures.filter((_, i) => i !== index));
    toast.success("Tanda tangan dihapus");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 100 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 100MB");
      return;
    }

    if (removeBackground) {
      toast.loading("Menghapus background...", { id: "upload" });
    } else {
      toast.loading("Memproses gambar...", { id: "upload" });
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const img = new Image();
      
      img.onload = () => {
        // Create canvas for processing
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          toast.dismiss("upload");
          toast.error("Gagal memproses gambar");
          return;
        }

        // Draw original image
        ctx.drawImage(img, 0, 0);
        
        if (removeBackground) {
          // Get image data
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          
          // Simple background removal based on white/light color detection
          // Sample corner pixels to detect background color
          const cornerColors = [
            { r: data[0], g: data[1], b: data[2] }, // top-left
            { r: data[(canvas.width - 1) * 4], g: data[(canvas.width - 1) * 4 + 1], b: data[(canvas.width - 1) * 4 + 2] }, // top-right
            { r: data[(canvas.height - 1) * canvas.width * 4], g: data[(canvas.height - 1) * canvas.width * 4 + 1], b: data[(canvas.height - 1) * canvas.width * 4 + 2] }, // bottom-left
          ];
          
          // Calculate average background color
          const avgBg = {
            r: Math.round((cornerColors[0].r + cornerColors[1].r + cornerColors[2].r) / 3),
            g: Math.round((cornerColors[0].g + cornerColors[1].g + cornerColors[2].g) / 3),
            b: Math.round((cornerColors[0].b + cornerColors[1].b + cornerColors[2].b) / 3),
          };
          
          // Remove background (make transparent if similar to background color)
          const threshold = 40; // Color similarity threshold
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // Calculate color difference
            const diff = Math.abs(r - avgBg.r) + Math.abs(g - avgBg.g) + Math.abs(b - avgBg.b);
            
            // If pixel is similar to background, make it transparent
            if (diff < threshold) {
              data[i + 3] = 0; // Set alpha to 0 (transparent)
            }
          }
          
          // Put processed image data back
          ctx.putImageData(imageData, 0, 0);
        }
        
        // Convert to blob and process
        canvas.toBlob((blob) => {
          if (blob) {
            processImage(blob, removeBackground);
          } else {
            toast.dismiss("upload");
            toast.error("Gagal memproses gambar");
          }
        }, 'image/png');
      };
      
      img.onerror = () => {
        toast.dismiss("upload");
        toast.error("Gagal memuat gambar");
      };
      
      img.src = result;
    };
    
    reader.onerror = () => {
      toast.dismiss("upload");
      toast.error("Gagal membaca file");
    };
    
    reader.readAsDataURL(file);
  };

  const processImage = (fileOrBlob: File | Blob, backgroundRemoved: boolean) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      
      // Compress image to reduce payload size
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400;
        const MAX_HEIGHT = 200;
        
        let width = img.width;
        let height = img.height;
        
        // Calculate new dimensions
        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataURL = canvas.toDataURL('image/png', 0.8);
          setUploadedImage(compressedDataURL);
          // Don't auto-set signatureImage, let user click "Gunakan"
          toast.dismiss("upload");
          
          if (backgroundRemoved) {
            toast.success("Background berhasil dihapus!");
          } else {
            toast.success("Gambar berhasil di-upload!");
          }
        }
      };
      img.onerror = () => {
        toast.dismiss("upload");
        toast.error("Gagal memproses gambar");
      };
      img.src = result;
    };
    reader.onerror = () => {
      toast.dismiss("upload");
      toast.error("Gagal membaca file");
    };
    reader.readAsDataURL(fileOrBlob);
  };

  const createSignatureFromDraw = async () => {
    if (sigCanvas.current?.isEmpty()) {
      toast.error("Silakan buat tanda tangan terlebih dahulu");
      return;
    }
    const dataURL = sigCanvas.current?.toDataURL("image/png");
    const optimized = await optimizeSignatureImage(dataURL || "");
    setTempSignatureImage(optimized);
    
    // Clear canvas after creating signature
    if (sigCanvas.current) {
      sigCanvas.current.clear();
    }
    
    toast.success("Tanda tangan siap! Klik di PDF untuk menempatkan.");
  };

  const createSignatureFromUpload = async () => {
    if (!uploadedImage) {
      toast.error("Silakan upload gambar terlebih dahulu");
      return;
    }
    const optimized = await optimizeSignatureImage(uploadedImage);
    setTempSignatureImage(optimized);
    
    // Clear uploaded image after creating signature
    setUploadedImage("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    
    toast.success("Tanda tangan siap! Klik di PDF untuk menempatkan.");
  };

  const createSignatureFromType = async () => {
    if (!typedText.trim()) {
      toast.error("Silakan ketik nama Anda");
      return;
    }
    
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 600;
      canvas.height = 200;
      const ctx = canvas.getContext("2d");
      
      if (!ctx) {
        toast.error("Gagal membuat signature");
        return;
      }
      
      // IMPORTANT: No background fill - keep transparent!
      ctx.fillStyle = signatureColor;
      ctx.font = "48px 'Brush Script MT', cursive";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(typedText, canvas.width / 2, canvas.height / 2);
      
      const dataURL = canvas.toDataURL("image/png", 0.7);
      const optimized = await optimizeSignatureImage(dataURL);
      setTempSignatureImage(optimized);
      
      // Clear typed text after creating signature
      setTypedText("");
      
      toast.success("Tanda tangan siap! Klik di PDF untuk menempatkan.");
    } catch (error) {
      toast.error("Gagal membuat tanda tangan");
    }
  };

  // BATCH SUBMIT - Save all placed signatures at once (1 request)
  const handleConfirmSignature = async () => {
    if (!documentData || placedSignatures.length === 0) {
      toast.error("Silakan tempatkan minimal 1 tanda tangan");
      return;
    }

    setIsProcessing(true);
    const loadingToast = toast.loading(`Menyimpan ${placedSignatures.length} tanda tangan...`);
    
    try {
      const signatureId = documentData.mySignature.id;

      // Submit ALL signatures in ONE request
      const signatures = placedSignatures.map(sig => ({
        signatureImage: sig.image,
        position: sig.position
      }));

      await documentsApi.signDocumentWithMultipleSignatures(signatureId, signatures);

      toast.success(`${placedSignatures.length} tanda tangan berhasil disimpan!`, { 
        id: loadingToast,
        duration: 2000 
      });
      
      // Redirect to history page
      setTimeout(() => {
        router.push("/dashboard/admin/history");
      }, 500);
      
    } catch (error: any) {
      console.error('[SIGN] Error:', error);
      toast.error(error.message || "Gagal menyimpan tanda tangan", { id: loadingToast });
      setIsProcessing(false);
    }
  };

  // Optimize signature image to reduce size
  const optimizeSignatureImage = async (dataUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 600;
        const MAX_HEIGHT = 300;
        
        let width = img.width;
        let height = img.height;
        
        // Calculate new dimensions while maintaining aspect ratio
        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
          width = width * ratio;
          height = height * ratio;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // Compress to 70% quality
          resolve(canvas.toDataURL('image/png', 0.7));
        } else {
          resolve(dataUrl); // Fallback to original if optimization fails
        }
      };
      img.onerror = () => resolve(dataUrl); // Fallback on error
      img.src = dataUrl;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat dokumen...</p>
        </div>
      </div>
    );
  }

  if (!documentData) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">Dokumen tidak ditemukan</p>
        </div>
      </div>
    );
  }

  const handleImportSignature = async (signature: SavedSignature) => {
    try {
      // Use thumbnailData directly (it's already base64)
      const optimized = await optimizeSignatureImage(signature.thumbnailData);
      setTempSignatureImage(optimized);
      setShowImportModal(false);
      toast.success(`Tanda tangan "${signature.name}" siap ditempatkan!`);
    } catch (error) {
      toast.error("Gagal import tanda tangan");
    }
  };

  return (
    <>
      {/* Modal for Import Signatures */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">
                Import Tanda Tangan ({savedSignatures.length})
              </h3>
              <button
                onClick={() => setShowImportModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {savedSignatures.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-4">Belum ada signature tersimpan</p>
                  <button
                    onClick={() => {
                      setShowImportModal(false);
                      router.push("/dashboard/admin/signature-config");
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Buat Signature Baru
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {savedSignatures.map((sig) => (
                    <button
                      key={sig.id}
                      onClick={() => handleImportSignature(sig)}
                      className="flex flex-col items-center gap-3 p-4 bg-gray-50 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
                    >
                      <div className="w-full h-24 bg-white border border-gray-200 rounded flex items-center justify-center overflow-hidden">
                        <img
                          src={sig.thumbnailData}
                          alt={sig.name}
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-900">{sig.name}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {sig.type === "WRITE" ? "Tulis" : sig.type === "UPLOAD" ? "Upload" : "Ketik"}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    
      {/* Modal for placed signatures */}
      {showSignaturesModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">
                Daftar Tanda Tangan ({placedSignatures.length})
              </h3>
              <button
                onClick={() => setShowSignaturesModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-3">
                {placedSignatures.map((sig, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg"
                  >
                    <div className="flex-shrink-0 w-16 h-16 bg-white border border-gray-200 rounded flex items-center justify-center overflow-hidden">
                      <img 
                        src={sig.image} 
                        alt={`Signature ${i + 1}`}
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        Tanda Tangan {i + 1}
                      </p>
                      <p className="text-xs text-gray-500">
                        Halaman {sig.position.page}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Posisi: ({Math.round(sig.position.x)}, {Math.round(sig.position.y)})
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        handleRemoveSignature(i);
                        if (placedSignatures.length === 1) {
                          setShowSignaturesModal(false);
                        }
                      }}
                      className="flex-shrink-0 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Hapus"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => setShowSignaturesModal(false)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="h-screen flex flex-col bg-white">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => window.close()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Tutup tab"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Tanda Tangani Dokumen
                </h1>
                <p className="text-sm text-gray-600 mt-1">{documentData.title}</p>
              </div>
            </div>
            <button
              onClick={() => window.open('/dashboard/admin/signature-config', '_blank')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2"
            >
              <FileSignature className="w-4 h-4" />
              Konfigurasi Tanda Tangan
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: PDF Viewer */}
          <div className="flex-1 bg-gray-100 overflow-auto">
            <PDFSignatureViewer
              pdfUrl={`${process.env.NEXT_PUBLIC_API_URL}/documents/preview/${documentData.id}`}
              tempSignatureImage={tempSignatureImage}
              placedSignatures={placedSignatures}
              existingSignatures={documentData.signatures?.filter((sig: any) => sig.status === 'SIGNED') || []}
              onSignaturePlaced={handleSignaturePlaced}
              onConfirm={handleConfirmSignature}
              onCancel={() => {}}
            />
          </div>

          {/* Right: Signature Creation Panel */}
          <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-bold text-gray-900">
                  Buat Tanda Tangan
                </h2>
                <button
                  onClick={() => setShowImportModal(true)}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Import
                </button>
              </div>
              <p className="text-sm text-gray-600">
                Pilih metode dan buat tanda tangan Anda
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {/* Method Tabs */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setSignatureMethod("draw")}
                  className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 ${
                    signatureMethod === "draw"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <Pencil className="w-4 h-4" />
                  Tulis
                </button>
                <button
                  onClick={() => setSignatureMethod("upload")}
                  className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 ${
                    signatureMethod === "upload"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  Upload
                </button>
                <button
                  onClick={() => setSignatureMethod("type")}
                  className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 ${
                    signatureMethod === "type"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <Type className="w-4 h-4" />
                  Ketik
                </button>
              </div>

              {/* Draw Method */}
              {signatureMethod === "draw" && (
                <div className="space-y-4">
                  {/* Color Picker */}
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-gray-700">Warna:</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSignatureColor("#000000")}
                        className={`w-10 h-10 rounded-lg border-2 transition-all ${
                          signatureColor === "#000000" 
                            ? "border-blue-600 ring-2 ring-blue-200" 
                            : "border-gray-300 hover:border-gray-400"
                        }`}
                        style={{ backgroundColor: "#000000" }}
                        title="Hitam"
                      />
                      <button
                        onClick={() => setSignatureColor("#0000FF")}
                        className={`w-10 h-10 rounded-lg border-2 transition-all ${
                          signatureColor === "#0000FF" 
                            ? "border-blue-600 ring-2 ring-blue-200" 
                            : "border-gray-300 hover:border-gray-400"
                        }`}
                        style={{ backgroundColor: "#0000FF" }}
                        title="Biru"
                      />
                      <button
                        onClick={() => setSignatureColor("#008000")}
                        className={`w-10 h-10 rounded-lg border-2 transition-all ${
                          signatureColor === "#008000" 
                            ? "border-blue-600 ring-2 ring-blue-200" 
                            : "border-gray-300 hover:border-gray-400"
                        }`}
                        style={{ backgroundColor: "#008000" }}
                        title="Hijau"
                      />
                    </div>
                  </div>
                  
                  <div className="border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-white">
                    <SignatureCanvas
                      ref={sigCanvas}
                      penColor={signatureColor}
                      canvasProps={{
                        className: "w-full h-48 bg-white",
                      }}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={clearSignature}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Hapus
                    </button>
                    <button
                      onClick={createSignatureFromDraw}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      Gunakan
                    </button>
                  </div>
                </div>
              )}

              {/* Upload Method */}
              {signatureMethod === "upload" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="removeBackground"
                      checked={removeBackground}
                      onChange={(e) => setRemoveBackground(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="removeBackground" className="text-sm text-gray-700">
                      Hapus background putih otomatis
                    </label>
                  </div>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 transition-colors"
                  >
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-sm text-gray-600 mb-2">
                      Klik untuk upload gambar
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG (Max 2MB)</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                  {uploadedImage && (
                    <div className="space-y-2">
                      <div className="border border-gray-200 rounded-lg p-4 bg-white">
                        <img
                          src={uploadedImage}
                          alt="Preview"
                          className="max-w-full h-32 mx-auto"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={clearSignature}
                          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                        >
                          <RotateCcw className="w-4 h-4" />
                          Hapus
                        </button>
                        <button
                          onClick={createSignatureFromUpload}
                          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                        >
                          <Check className="w-4 h-4" />
                          Gunakan
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Type Method */}
              {signatureMethod === "type" && (
                <div className="space-y-4">
                  {/* Color Picker */}
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-gray-700">Warna:</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSignatureColor("#000000")}
                        className={`w-10 h-10 rounded-lg border-2 transition-all ${
                          signatureColor === "#000000" 
                            ? "border-blue-600 ring-2 ring-blue-200" 
                            : "border-gray-300 hover:border-gray-400"
                        }`}
                        style={{ backgroundColor: "#000000" }}
                        title="Hitam"
                      />
                      <button
                        onClick={() => setSignatureColor("#0000FF")}
                        className={`w-10 h-10 rounded-lg border-2 transition-all ${
                          signatureColor === "#0000FF" 
                            ? "border-blue-600 ring-2 ring-blue-200" 
                            : "border-gray-300 hover:border-gray-400"
                        }`}
                        style={{ backgroundColor: "#0000FF" }}
                        title="Biru"
                      />
                      <button
                        onClick={() => setSignatureColor("#008000")}
                        className={`w-10 h-10 rounded-lg border-2 transition-all ${
                          signatureColor === "#008000" 
                            ? "border-blue-600 ring-2 ring-blue-200" 
                            : "border-gray-300 hover:border-gray-400"
                        }`}
                        style={{ backgroundColor: "#008000" }}
                        title="Hijau"
                      />
                    </div>
                  </div>
                  
                  <input
                    type="text"
                    value={typedText}
                    onChange={(e) => setTypedText(e.target.value)}
                    placeholder="Ketik nama Anda..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {typedText && (
                    <div className="border border-gray-200 rounded-lg p-8 bg-white text-center">
                      <div
                        className="text-4xl"
                        style={{ 
                          fontFamily: "'Brush Script MT', cursive",
                          color: signatureColor
                        }}
                      >
                        {typedText}
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={clearSignature}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Hapus
                    </button>
                    <button
                      onClick={createSignatureFromType}
                      disabled={!typedText}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      Gunakan
                    </button>
                  </div>
                </div>
              )}

            </div>

            {/* Confirm Button at Bottom */}
            <div className="p-6 border-t border-gray-200 space-y-3">
              {/* Show placed signatures count with button to open modal */}
              {placedSignatures.length > 0 && (
                <button
                  onClick={() => setShowSignaturesModal(true)}
                  className="w-full p-3 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <p className="text-sm text-green-800 font-medium">
                    ✓ {placedSignatures.length} tanda tangan sudah ditempatkan
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Klik untuk melihat daftar
                  </p>
                </button>
              )}
              

              
              {/* Tempatkan Button - only show when temp signature is positioned */}
              {tempSignatureImage && currentTempPosition && (
                <button
                  onClick={handleConfirmPlacement}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all shadow-lg"
                >
                  📍 Tempatkan Tanda Tangan
                </button>
              )}
              
              {/* Simpan Semua Button - show when there are placed signatures */}
              <button
                onClick={handleConfirmSignature}
                disabled={placedSignatures.length === 0 || isProcessing}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {isProcessing ? "Menyimpan..." : placedSignatures.length > 0 ? `✓ Simpan ${placedSignatures.length} Tanda Tangan` : "Simpan Tanda Tangan"}
              </button>
              
              {/* Cancel Button */}
              <button
                onClick={() => router.push("/dashboard/admin/sign")}
                className="w-full px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all"
              >
                Batal & Kembali
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
