"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import SignatureCanvas from "react-signature-canvas";
import {
  ArrowLeft,
  Pencil,
  Upload,
  Type,
  RotateCcw,
  Check,
  Trash2,
  Save,
} from "lucide-react";
import { savedSignaturesApi, SavedSignature, SignatureType } from "@/lib/saved-signatures-api";

type SignatureMethod = "draw" | "upload" | "type";

export default function SignatureConfigPage() {
  const router = useRouter();
  const [signatureMethod, setSignatureMethod] = useState<SignatureMethod>("draw");
  const [signatureName, setSignatureName] = useState("");
  const [tempSignatureImage, setTempSignatureImage] = useState<string>("");
  const [typedText, setTypedText] = useState("");
  const [uploadedImage, setUploadedImage] = useState<string>("");
  const [removeBackground, setRemoveBackground] = useState(false);
  const [signatureColor, setSignatureColor] = useState<string>("#000000");
  const [savedSignatures, setSavedSignatures] = useState<SavedSignature[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [signatureToDelete, setSignatureToDelete] = useState<string | null>(null);
  const sigCanvas = useRef<SignatureCanvas>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSavedSignatures();
  }, []);

  const fetchSavedSignatures = async () => {
    try {
      const signatures = await savedSignaturesApi.getAll();
      setSavedSignatures(signatures);
    } catch (error) {
      toast.error("Gagal memuat signature tersimpan");
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 5MB");
      return;
    }

    toast.loading("Memproses gambar...", { id: "upload" });

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          toast.dismiss("upload");
          toast.error("Gagal memproses gambar");
          return;
        }

        ctx.drawImage(img, 0, 0);

        if (removeBackground) {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;

          const cornerColors = [
            { r: data[0], g: data[1], b: data[2] },
            {
              r: data[(canvas.width - 1) * 4],
              g: data[(canvas.width - 1) * 4 + 1],
              b: data[(canvas.width - 1) * 4 + 2],
            },
            {
              r: data[(canvas.height - 1) * canvas.width * 4],
              g: data[(canvas.height - 1) * canvas.width * 4 + 1],
              b: data[(canvas.height - 1) * canvas.width * 4 + 2],
            },
          ];

          const avgBg = {
            r: Math.round((cornerColors[0].r + cornerColors[1].r + cornerColors[2].r) / 3),
            g: Math.round((cornerColors[0].g + cornerColors[1].g + cornerColors[2].g) / 3),
            b: Math.round((cornerColors[0].b + cornerColors[1].b + cornerColors[2].b) / 3),
          };

          const threshold = 40;
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            const diff = Math.abs(r - avgBg.r) + Math.abs(g - avgBg.g) + Math.abs(b - avgBg.b);

            if (diff < threshold) {
              data[i + 3] = 0;
            }
          }

          ctx.putImageData(imageData, 0, 0);
        }

        canvas.toBlob((blob) => {
          if (blob) {
            const reader = new FileReader();
            reader.onload = () => {
              setUploadedImage(reader.result as string);
              toast.dismiss("upload");
              toast.success(removeBackground ? "Background berhasil dihapus!" : "Gambar berhasil di-upload!");
            };
            reader.readAsDataURL(blob);
          }
        }, "image/png");
      };

      img.src = result;
    };

    reader.readAsDataURL(file);
  };

  const createSignatureFromDraw = async () => {
    if (sigCanvas.current?.isEmpty()) {
      toast.error("Silakan buat tanda tangan terlebih dahulu");
      return;
    }
    const dataURL = sigCanvas.current?.toDataURL("image/png");
    const optimized = await optimizeSignatureImage(dataURL || "");
    setTempSignatureImage(optimized);
  };

  const createSignatureFromUpload = async () => {
    if (!uploadedImage) {
      toast.error("Silakan upload gambar terlebih dahulu");
      return;
    }
    const optimized = await optimizeSignatureImage(uploadedImage);
    setTempSignatureImage(optimized);
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
        toast.error("Gagal membuat tanda tangan");
        return;
      }

      ctx.fillStyle = signatureColor;
      ctx.font = "48px 'Brush Script MT', cursive";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(typedText, canvas.width / 2, canvas.height / 2);

      const dataURL = canvas.toDataURL("image/png", 0.7);
      const optimized = await optimizeSignatureImage(dataURL);
      setTempSignatureImage(optimized);
    } catch (error) {
      toast.error("Gagal membuat tanda tangan");
    }
  };

  const optimizeSignatureImage = async (dataUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 600;
        const MAX_HEIGHT = 300;

        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
          width = width * ratio;
          height = height * ratio;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/png", 0.7));
        } else {
          resolve(dataUrl);
        }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  };

  const handleSaveSignature = async () => {
    if (!tempSignatureImage) {
      toast.error("Silakan buat tanda tangan terlebih dahulu");
      return;
    }

    if (!signatureName.trim()) {
      toast.error("Silakan masukkan nama tanda tangan");
      return;
    }

    setIsLoading(true);
    const loadingToast = toast.loading("Menyimpan tanda tangan...");

    try {
      const typeMap: Record<SignatureMethod, SignatureType> = {
        draw: "WRITE",
        upload: "UPLOAD",
        type: "TYPE",
      };

      await savedSignaturesApi.create(signatureName, typeMap[signatureMethod], tempSignatureImage);

      toast.success("Tanda tangan berhasil disimpan!", { id: loadingToast });
      
      // Reset form - DON'T clear signatureName to allow multiple saves
      setTempSignatureImage("");
      clearSignature();
      
      // Refresh list
      await fetchSavedSignatures();
    } catch (error: any) {
      toast.error(error.message || "Gagal menyimpan tanda tangan", { id: loadingToast });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSignature = async () => {
    if (!signatureToDelete) return;

    const loadingToast = toast.loading("Menghapus tanda tangan...");

    try {
      await savedSignaturesApi.delete(signatureToDelete);
      toast.success("Tanda tangan berhasil dihapus!", { id: loadingToast });
      await fetchSavedSignatures();
    } catch (error) {
      toast.error("Gagal menghapus tanda tangan", { id: loadingToast });
    } finally {
      setDeleteModalOpen(false);
      setSignatureToDelete(null);
    }
  };

  // Auto-generate preview when inputs change (with debounce for typing)
  useEffect(() => {
    if (signatureMethod === "upload" && uploadedImage) {
      createSignatureFromUpload();
    }
  }, [uploadedImage]);

  useEffect(() => {
    if (signatureMethod === "type" && typedText.trim()) {
      const timer = setTimeout(() => {
        createSignatureFromType();
      }, 300); // Debounce 300ms
      return () => clearTimeout(timer);
    } else if (signatureMethod === "type" && !typedText.trim()) {
      setTempSignatureImage("");
    }
  }, [typedText, signatureColor, signatureMethod]);

  // Auto-generate preview for draw method when user stops drawing
  useEffect(() => {
    if (signatureMethod === "draw" && sigCanvas.current) {
      const canvas = sigCanvas.current;
      let drawTimeout: NodeJS.Timeout;

      const handleMouseUp = () => {
        if (!canvas.isEmpty()) {
          clearTimeout(drawTimeout);
          drawTimeout = setTimeout(() => {
            createSignatureFromDraw();
          }, 500); // Generate preview 500ms after user stops drawing
        }
      };

      const canvasElement = canvas.getCanvas();
      canvasElement.addEventListener('mouseup', handleMouseUp);
      canvasElement.addEventListener('touchend', handleMouseUp);

      return () => {
        clearTimeout(drawTimeout);
        canvasElement.removeEventListener('mouseup', handleMouseUp);
        canvasElement.removeEventListener('touchend', handleMouseUp);
      };
    }
  }, [signatureMethod]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Hapus Tanda Tangan</h3>
            <p className="text-sm text-gray-600 mb-6">
              Apakah Anda yakin ingin menghapus tanda tangan ini? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setDeleteModalOpen(false);
                  setSignatureToDelete(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteSignature}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Konfigurasi Tanda Tangan</h1>
            <p className="text-sm text-gray-600 mt-1">
              Buat dan simpan template tanda tangan untuk digunakan nanti
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Create Signature */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Buat Tanda Tangan Baru</h2>

            {/* Name Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nama Tanda Tangan
              </label>
              <input
                type="text"
                value={signatureName}
                onChange={(e) => setSignatureName(e.target.value)}
                placeholder="Contoh: Tanda Tangan Formal"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

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
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-700">Warna:</label>
                  <div className="flex gap-2">
                    {["#000000", "#0000FF", "#008000"].map((color) => (
                      <button
                        key={color}
                        onClick={() => setSignatureColor(color)}
                        className={`w-10 h-10 rounded-lg border-2 transition-all ${
                          signatureColor === color
                            ? "border-blue-600 ring-2 ring-blue-200"
                            : "border-gray-300 hover:border-gray-400"
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
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
                <button
                  onClick={clearSignature}
                  className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Hapus
                </button>
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
                  <p className="text-sm text-gray-600 mb-2">Klik untuk upload gambar</p>
                  <p className="text-xs text-gray-500">PNG, JPG (Max 5MB)</p>
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
                      <img src={uploadedImage} alt="Preview" className="max-w-full h-32 mx-auto" />
                    </div>
                    <button
                      onClick={clearSignature}
                      className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Hapus
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Type Method */}
            {signatureMethod === "type" && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-700">Warna:</label>
                  <div className="flex gap-2">
                    {["#000000", "#0000FF", "#008000"].map((color) => (
                      <button
                        key={color}
                        onClick={() => setSignatureColor(color)}
                        className={`w-10 h-10 rounded-lg border-2 transition-all ${
                          signatureColor === color
                            ? "border-blue-600 ring-2 ring-blue-200"
                            : "border-gray-300 hover:border-gray-400"
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
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
                        color: signatureColor,
                      }}
                    >
                      {typedText}
                    </div>
                  </div>
                )}
                <button
                  onClick={clearSignature}
                  className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Hapus
                </button>
              </div>
            )}

            {/* Preview & Save */}
            {tempSignatureImage && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Preview</h3>
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 mb-4">
                  <img
                    src={tempSignatureImage}
                    alt="Preview"
                    className="max-w-full h-24 mx-auto"
                  />
                </div>
                <button
                  onClick={handleSaveSignature}
                  disabled={isLoading || !signatureName.trim()}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  {isLoading ? "Menyimpan..." : "Simpan Tanda Tangan"}
                </button>
              </div>
            )}
          </div>

          {/* Right: Saved Signatures */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Tanda Tangan Tersimpan ({savedSignatures.length})
            </h2>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {savedSignatures.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-sm">Belum ada tanda tangan tersimpan</p>
                </div>
              ) : (
                savedSignatures.map((sig) => (
                  <div
                    key={sig.id}
                    className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                  >
                    <div className="flex-shrink-0 w-24 h-24 bg-white border border-gray-200 rounded flex items-center justify-center overflow-hidden">
                      <img
                        src={sig.thumbnailData}
                        alt={sig.name}
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{sig.name}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {sig.type === "WRITE" ? "Tulis" : sig.type === "UPLOAD" ? "Upload" : "Ketik"}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(sig.createdAt).toLocaleDateString("id-ID")}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSignatureToDelete(sig.id);
                        setDeleteModalOpen(true);
                      }}
                      className="flex-shrink-0 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Hapus"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
