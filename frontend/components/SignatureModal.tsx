"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SignatureCanvas from "react-signature-canvas";
import { Pencil, Upload, Type, X, Check } from "lucide-react";

type SignatureMethod = "draw" | "upload" | "type";

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (signatureData: string) => void;
}

export default function SignatureModal({
  isOpen,
  onClose,
  onConfirm,
}: SignatureModalProps) {
  const [method, setMethod] = useState<SignatureMethod>("draw");
  const [typedName, setTypedName] = useState("");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const sigCanvas = useRef<SignatureCanvas>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClear = () => {
    if (method === "draw" && sigCanvas.current) {
      sigCanvas.current.clear();
    } else if (method === "type") {
      setTypedName("");
    } else if (method === "upload") {
      setUploadedImage(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setUploadedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateTypedSignature = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 400;
    canvas.height = 150;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = "italic 48px 'Brush Script MT', cursive";
      ctx.fillStyle = "black";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(typedName, canvas.width / 2, canvas.height / 2);
    }
    return canvas.toDataURL("image/png");
  };

  const handleConfirm = () => {
    let signatureData: string;

    if (method === "draw") {
      if (sigCanvas.current?.isEmpty()) {
        alert("Silakan buat tanda tangan terlebih dahulu");
        return;
      }
      signatureData = sigCanvas.current!.toDataURL("image/png");
    } else if (method === "type") {
      if (!typedName.trim()) {
        alert("Silakan ketik nama Anda");
        return;
      }
      signatureData = generateTypedSignature();
    } else {
      if (!uploadedImage) {
        alert("Silakan upload gambar tanda tangan");
        return;
      }
      signatureData = uploadedImage;
    }

    onConfirm(signatureData);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Buat Tanda Tangan
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Method Tabs */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setMethod("draw")}
                className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                  method === "draw"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <Pencil className="w-4 h-4" />
                Gambar
              </button>
              <button
                onClick={() => setMethod("upload")}
                className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                  method === "upload"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <Upload className="w-4 h-4" />
                Upload
              </button>
              <button
                onClick={() => setMethod("type")}
                className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                  method === "type"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <Type className="w-4 h-4" />
                Ketik
              </button>
            </div>

            {/* Canvas Area */}
            <div className="mb-6">
              {method === "draw" && (
                <div className="border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-white">
                  <SignatureCanvas
                    ref={sigCanvas}
                    canvasProps={{
                      className: "w-full h-64 cursor-crosshair",
                    }}
                    backgroundColor="white"
                  />
                </div>
              )}

              {method === "upload" && (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
                  {uploadedImage ? (
                    <div className="relative">
                      <img
                        src={uploadedImage}
                        alt="Signature"
                        className="max-h-64 mx-auto"
                      />
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">
                        Upload gambar tanda tangan (PNG, JPG)
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Pilih File
                      </button>
                    </div>
                  )}
                </div>
              )}

              {method === "type" && (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 bg-white">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ketik Nama Anda
                  </label>
                  <input
                    type="text"
                    value={typedName}
                    onChange={(e) => setTypedName(e.target.value)}
                    placeholder="Nama lengkap Anda"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
                  />
                  {typedName && (
                    <div className="bg-gray-50 rounded-lg p-8 text-center">
                      <p
                        style={{
                          fontFamily: "'Brush Script MT', cursive",
                          fontSize: "48px",
                          fontStyle: "italic",
                        }}
                      >
                        {typedName}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleClear}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Hapus
              </button>
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                Konfirmasi
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
