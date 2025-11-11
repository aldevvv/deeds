import { useState, useEffect, useRef } from "react";
import { ZoomIn, ZoomOut } from "lucide-react";
import { getToken } from "@/lib/auth";

// Dynamic import PDF.js to avoid SSR issues
let pdfjsLib: any = null;

if (typeof window !== 'undefined') {
  import('pdfjs-dist').then((pdfjs) => {
    pdfjsLib = pdfjs;
    // Use legacy worker for v4.x (stable with Node.js)
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.8.69/legacy/build/pdf.worker.min.mjs';
  });
}

interface SignaturePosition {
  x: number;
  y: number;
  width: number;
  height: number;
  page: number;
}

interface ExistingSignature {
  id: string;
  user: {
    fullName: string;
  };
  signatureData?: string;
  signedAt?: string;
  order: number;
}

interface PDFSignatureViewerProps {
  pdfUrl: string;
  signatureImage: string;
  existingSignatures?: ExistingSignature[];
  onPositionChange: (position: SignaturePosition | null) => void;
  onConfirm: () => void;
  onCancel: () => void;
  onDeleteSignature?: () => void;
}

export default function PDFSignatureViewer({
  pdfUrl,
  signatureImage,
  existingSignatures = [],
  onPositionChange,
  onConfirm,
  onCancel,
  onDeleteSignature,
}: PDFSignatureViewerProps) {
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  
  const [signaturePos, setSignaturePos] = useState<SignaturePosition>({
    x: 0,
    y: 0,
    width: 200,
    height: 80,
    page: 1,
  });
  
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string>("");
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [isCentered, setIsCentered] = useState(false);
  const [isSignatureSelected, setIsSignatureSelected] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<any>(null);
  const signatureElementRef = useRef<HTMLDivElement>(null);
  
  // Reset centered flag and selection when signature changes
  useEffect(() => {
    setIsCentered(false);
    setIsSignatureSelected(true); // Auto-select new signature
  }, [signatureImage]);
  
  // Center signature when first loaded AND scroll into view - use CURRENT PAGE
  useEffect(() => {
    if (signatureImage && canvasRef.current && !isCentered) {
      const canvas = canvasRef.current;
      const centerX = (canvas.width - signaturePos.width) / 2;
      const centerY = (canvas.height - signaturePos.height) / 2;
      const centeredPos = {
        ...signaturePos,
        x: centerX,
        y: centerY,
        page: currentPage, // USE CURRENT PAGE, not default 1
      };
      setSignaturePos(centeredPos);
      onPositionChange(centeredPos);
      setIsCentered(true);
      
      // Scroll to signature position after a short delay
      setTimeout(() => {
        if (containerRef.current && canvasRef.current) {
          const container = containerRef.current;
          const scrollToY = centerY - (container.clientHeight / 2) + (signaturePos.height / 2);
          const scrollToX = centerX - (container.clientWidth / 2) + (signaturePos.width / 2);
          
          container.scrollTo({
            top: Math.max(0, scrollToY),
            left: Math.max(0, scrollToX),
            behavior: 'smooth'
          });
        }
      }, 100);
    }
  }, [signatureImage, canvasRef.current?.width, canvasRef.current?.height, isCentered, currentPage]);

  // Load PDF
  useEffect(() => {
    const loadPDF = async () => {
      try {
        // Wait for PDF.js to load
        if (!pdfjsLib) {
          setTimeout(loadPDF, 100);
          return;
        }

        const token = getToken();
        if (!token) {
          console.error("No auth token");
          return;
        }

        const loadingTask = pdfjsLib.getDocument({
          url: pdfUrl,
          httpHeaders: {
            Authorization: `Bearer ${token}`,
          },
        });

        const pdf = await loadingTask.promise;
        setPdfDoc(pdf);
        setNumPages(pdf.numPages);
      } catch (error) {
        console.error("Error loading PDF:", error);
      }
    };

    loadPDF();
  }, [pdfUrl]);

  // Render PDF page and signature overlay
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    const renderPage = async () => {
      try {
        // Cancel previous render if exists
        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
          renderTaskRef.current = null;
        }

        const page = await pdfDoc.getPage(currentPage);
        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current!;
        const context = canvas.getContext("2d")!;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Clear canvas
        context.clearRect(0, 0, canvas.width, canvas.height);

        // Render PDF page with task reference
        renderTaskRef.current = page.render({
          canvasContext: context,
          viewport: viewport,
        });
        
        await renderTaskRef.current.promise;
        renderTaskRef.current = null;

        // Draw existing signatures first (already signed)
        if (existingSignatures && existingSignatures.length > 0) {
          for (const existingSig of existingSignatures) {
            if (existingSig.signedAt && existingSig.signatureData) {
              try {
                const sigData = JSON.parse(existingSig.signatureData);
                const sigPosition = sigData.position;
                
                // Only draw if on current page
                if (sigPosition.page === currentPage) {
                  // Draw a placeholder box for existing signatures
                  context.save();
                  
                  // Semi-transparent blue fill for existing signatures
                  context.fillStyle = 'rgba(59, 130, 246, 0.1)';
                  context.fillRect(
                    sigPosition.x,
                    sigPosition.y,
                    sigPosition.width,
                    sigPosition.height
                  );
                  
                  // Solid border for existing signatures
                  context.strokeStyle = '#3B82F6';
                  context.lineWidth = 2;
                  context.strokeRect(
                    sigPosition.x,
                    sigPosition.y,
                    sigPosition.width,
                    sigPosition.height
                  );
                  
                  // Draw label
                  context.fillStyle = '#3B82F6';
                  context.font = 'bold 12px system-ui';
                  context.fillText(
                    `✓ ${existingSig.user.fullName}`,
                    sigPosition.x + 5,
                    sigPosition.y + sigPosition.height / 2 + 5
                  );
                  
                  context.restore();
                }
              } catch (e) {
                // Ignore invalid signature data
              }
            }
          }
        }

        // Draw NEW signature AFTER PDF render is complete (only if signature exists)
        if (signatureImage && signaturePos.page === currentPage) {
          // Pre-load image
          const img = new Image();
          img.src = signatureImage;
          
          // Wait for image to load before drawing
          await new Promise<void>((resolve, reject) => {
            img.onload = () => {
              try {
                // Draw signature image WITHOUT background (transparent)
                context.drawImage(
                  img,
                  signaturePos.x,
                  signaturePos.y,
                  signaturePos.width,
                  signaturePos.height
                );
                
                // Only draw controls if signature is selected
                if (isSignatureSelected) {
                  // Draw dashed border for positioning guide (no fill)
                  context.save();
                  context.setLineDash([5, 3]); // Dashed line pattern
                  context.strokeStyle = '#3B82F6';
                  context.lineWidth = 2;
                  context.globalAlpha = 0.7; // Semi-transparent
                  context.strokeRect(
                    signaturePos.x,
                    signaturePos.y,
                    signaturePos.width,
                    signaturePos.height
                  );
                  context.restore();
                }
                
                // Only draw resize handles if selected
                if (isSignatureSelected) {
                  const handleSize = 16;
                  context.fillStyle = '#3B82F6';
                  context.strokeStyle = '#FFFFFF';
                  context.lineWidth = 2;
                  
                  // Top-left
                  context.fillRect(signaturePos.x - handleSize/2, signaturePos.y - handleSize/2, handleSize, handleSize);
                  context.strokeRect(signaturePos.x - handleSize/2, signaturePos.y - handleSize/2, handleSize, handleSize);
                  // Top-right
                  context.fillRect(signaturePos.x + signaturePos.width - handleSize/2, signaturePos.y - handleSize/2, handleSize, handleSize);
                  context.strokeRect(signaturePos.x + signaturePos.width - handleSize/2, signaturePos.y - handleSize/2, handleSize, handleSize);
                  // Bottom-left
                  context.fillRect(signaturePos.x - handleSize/2, signaturePos.y + signaturePos.height - handleSize/2, handleSize, handleSize);
                  context.strokeRect(signaturePos.x - handleSize/2, signaturePos.y + signaturePos.height - handleSize/2, handleSize, handleSize);
                  // Bottom-right
                  context.fillRect(signaturePos.x + signaturePos.width - handleSize/2, signaturePos.y + signaturePos.height - handleSize/2, handleSize, handleSize);
                  context.strokeRect(signaturePos.x + signaturePos.width - handleSize/2, signaturePos.y + signaturePos.height - handleSize/2, handleSize, handleSize);
                  
                  // Draw DELETE button (X) at top-right corner
                  const deleteButtonSize = 24;
                  const deleteButtonX = signaturePos.x + signaturePos.width + 5;
                  const deleteButtonY = signaturePos.y - 5;
                  
                  // Red circle background
                  context.beginPath();
                  context.arc(deleteButtonX, deleteButtonY, deleteButtonSize/2, 0, 2 * Math.PI);
                  context.fillStyle = '#EF4444';
                  context.fill();
                  context.strokeStyle = '#FFFFFF';
                  context.lineWidth = 2;
                  context.stroke();
                  
                  // White X
                  context.strokeStyle = '#FFFFFF';
                  context.lineWidth = 3;
                  context.lineCap = 'round';
                  const xOffset = 6;
                  context.beginPath();
                  context.moveTo(deleteButtonX - xOffset, deleteButtonY - xOffset);
                  context.lineTo(deleteButtonX + xOffset, deleteButtonY + xOffset);
                  context.moveTo(deleteButtonX + xOffset, deleteButtonY - xOffset);
                  context.lineTo(deleteButtonX - xOffset, deleteButtonY + xOffset);
                  context.stroke();
                }
                
                // Draw instruction text with background for readability
                const text = '🖱️ Geser/Resize tanda tangan';
                context.font = '14px system-ui';
                context.textAlign = 'center';
                const textMetrics = context.measureText(text);
                const textX = signaturePos.x + signaturePos.width / 2;
                const textY = signaturePos.y - 10;
                const padding = 4;
                
                // Draw text background
                context.fillStyle = 'rgba(59, 130, 246, 0.9)';
                context.fillRect(
                  textX - textMetrics.width / 2 - padding,
                  textY - 14,
                  textMetrics.width + padding * 2,
                  20
                );
                
                // Draw text
                context.fillStyle = '#FFFFFF';
                context.fillText(text, textX, textY);
                
                resolve();
              } catch (err) {
                console.error('[PDF VIEWER] Error drawing signature:', err);
                reject(err);
              }
            };
            img.onerror = (err) => {
              console.error('[PDF VIEWER] Failed to load signature image:', err);
              reject(err);
            };
          });
        }
      } catch (error: any) {
        // Ignore cancellation errors
        if (error?.name !== 'RenderingCancelledException') {
          console.error('[PDF VIEWER] Error rendering page:', error);
        }
      }
    };

    renderPage();
    
    return () => {
      // Cleanup on unmount or dependency change
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }
    };
  }, [pdfDoc, currentPage, scale, signatureImage, signaturePos, existingSignatures, isSignatureSelected]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Scale coordinates based on canvas size vs display size
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // Check if clicked on signature
    const isClickedOnSignature = 
      x >= signaturePos.x &&
      x <= signaturePos.x + signaturePos.width &&
      y >= signaturePos.y &&
      y <= signaturePos.y + signaturePos.height &&
      signaturePos.page === currentPage;

    // Check if clicked on delete button (only if signature is selected)
    if (isSignatureSelected && signaturePos.page === currentPage) {
      const deleteButtonSize = 24;
      const deleteButtonX = signaturePos.x + signaturePos.width + 5;
      const deleteButtonY = signaturePos.y - 5;
      const distToDelete = Math.sqrt(
        Math.pow(x - deleteButtonX, 2) + Math.pow(y - deleteButtonY, 2)
      );
      
      if (distToDelete <= deleteButtonSize / 2) {
        // Clicked on delete button - clear signature
        setIsSignatureSelected(false);
        onPositionChange(null);
        if (onDeleteSignature) {
          onDeleteSignature();
        }
        return;
      }
    }

    if (isClickedOnSignature) {
      // Select signature on click
      setIsSignatureSelected(true);
      
      // Check if clicked on resize handle (corners)
      const handleSize = 16;
      const isBottomRight = 
        x >= signaturePos.x + signaturePos.width - handleSize &&
        y >= signaturePos.y + signaturePos.height - handleSize;
      const isBottomLeft = 
        x <= signaturePos.x + handleSize &&
        y >= signaturePos.y + signaturePos.height - handleSize;
      const isTopRight = 
        x >= signaturePos.x + signaturePos.width - handleSize &&
        y <= signaturePos.y + handleSize;
      const isTopLeft = 
        x <= signaturePos.x + handleSize &&
        y <= signaturePos.y + handleSize;
      
      if (isBottomRight) {
        setIsResizing(true);
        setResizeHandle("br");
      } else if (isBottomLeft) {
        setIsResizing(true);
        setResizeHandle("bl");
      } else if (isTopRight) {
        setIsResizing(true);
        setResizeHandle("tr");
      } else if (isTopLeft) {
        setIsResizing(true);
        setResizeHandle("tl");
      } else {
        // Start dragging - store offset from signature top-left
        setIsDragging(true);
        setDragOffset({
          x: x - signaturePos.x,
          y: y - signaturePos.y,
        });
      }
    } else {
      // Clicked outside signature - deselect
      setIsSignatureSelected(false);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Scale coordinates
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // Check if hovering over signature
    const isOverSignature = 
      x >= signaturePos.x &&
      x <= signaturePos.x + signaturePos.width &&
      y >= signaturePos.y &&
      y <= signaturePos.y + signaturePos.height &&
      signaturePos.page === currentPage;
    
    setIsHovering(isOverSignature);

    if (isDragging) {
      // Use drag offset for smooth dragging
      const newX = x - dragOffset.x;
      const newY = y - dragOffset.y;

      const newPos = {
        ...signaturePos,
        x: Math.max(0, Math.min(newX, canvas.width - signaturePos.width)),
        y: Math.max(0, Math.min(newY, canvas.height - signaturePos.height)),
        page: currentPage,
      };

      setSignaturePos(newPos);
      onPositionChange(newPos);
    } else if (isResizing) {
      const minSize = 50;
      let newWidth = signaturePos.width;
      let newHeight = signaturePos.height;
      let newX = signaturePos.x;
      let newY = signaturePos.y;

      if (resizeHandle === "br") {
        newWidth = Math.max(minSize, x - signaturePos.x);
        newHeight = Math.max(minSize, y - signaturePos.y);
      } else if (resizeHandle === "bl") {
        newWidth = Math.max(minSize, signaturePos.x + signaturePos.width - x);
        newHeight = Math.max(minSize, y - signaturePos.y);
        newX = x;
      } else if (resizeHandle === "tr") {
        newWidth = Math.max(minSize, x - signaturePos.x);
        newHeight = Math.max(minSize, signaturePos.y + signaturePos.height - y);
        newY = y;
      } else if (resizeHandle === "tl") {
        newWidth = Math.max(minSize, signaturePos.x + signaturePos.width - x);
        newHeight = Math.max(minSize, signaturePos.y + signaturePos.height - y);
        newX = x;
        newY = y;
      }

      const newPos = {
        ...signaturePos,
        x: Math.max(0, Math.min(newX, canvas.width - newWidth)),
        y: Math.max(0, Math.min(newY, canvas.height - newHeight)),
        width: Math.min(newWidth, canvas.width - newX),
        height: Math.min(newHeight, canvas.height - newY),
        page: currentPage,
      };

      setSignaturePos(newPos);
      onPositionChange(newPos);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle("");
    setDragOffset({ x: 0, y: 0 });
  };

  const handleZoomIn = () => setScale((s) => Math.min(s + 0.25, 3));
  const handleZoomOut = () => setScale((s) => Math.max(s - 0.25, 0.5));

  return (
    <div 
      ref={containerRef}
      className="w-full h-full flex flex-col bg-gray-100 overflow-auto"
    >
      {/* Controls */}
      <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            Prev
          </button>
          <span className="text-sm text-gray-600">
            {currentPage} / {numPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, numPages))}
            disabled={currentPage === numPages}
            className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            Next
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
          >
            <ZoomOut className="w-4 h-4 text-gray-700" />
          </button>
          <span className="text-sm text-gray-600">{Math.round(scale * 100)}%</span>
          <button
            onClick={handleZoomIn}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
          >
            <ZoomIn className="w-4 h-4 text-gray-700" />
          </button>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="flex-1 p-4">
        <div className="flex justify-center">
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="shadow-lg bg-white"
            style={{ 
              cursor: isDragging 
                ? 'grabbing' 
                : isResizing 
                ? 'nwse-resize' 
                : isHovering 
                ? 'grab' 
                : 'default' 
            }}
          />
        </div>
      </div>
    </div>
  );
}
