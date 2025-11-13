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

interface PlacedSignature {
  image: string;
  position: { x: number; y: number; width: number; height: number; page: number };
}

interface PDFSignatureViewerProps {
  pdfUrl: string;
  tempSignatureImage: string; // Current signature being placed
  placedSignatures: PlacedSignature[]; // All confirmed signatures (not used in auto-submit approach)
  existingSignatures?: ExistingSignature[];
  onSignaturePlaced: (position: SignaturePosition | null) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function PDFSignatureViewer({
  pdfUrl,
  tempSignatureImage,
  placedSignatures,
  existingSignatures = [],
  onSignaturePlaced,
  onConfirm,
  onCancel,
}: PDFSignatureViewerProps) {
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [isRendering, setIsRendering] = useState(false);
  
  // Temp signature position (being dragged/resized)
  const [tempSignaturePos, setTempSignaturePos] = useState<SignaturePosition>({
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
  const [isTempSignatureSelected, setIsTempSignatureSelected] = useState(false);
  const [selectedPlacedIndex, setSelectedPlacedIndex] = useState<number | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<any>(null);
  const signatureElementRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Reset centered flag and selection ONLY when signature image URL changes (not on placement)
  const previousSignatureImageRef = useRef<string>("");
  useEffect(() => {
    // Only trigger recenter if the actual signature IMAGE changed (new import/create)
    // NOT when just moving to different page or confirming placement
    if (tempSignatureImage && tempSignatureImage !== previousSignatureImageRef.current) {
      previousSignatureImageRef.current = tempSignatureImage;
      setIsCentered(false); // Trigger centering for NEW signature
      setIsTempSignatureSelected(true); // Auto-select new temp signature
      setSelectedPlacedIndex(null); // Deselect placed signatures
      
      // Update to current page and trigger centering
      setTempSignaturePos(prev => ({
        ...prev,
        page: currentPage
      }));
    }
  }, [tempSignatureImage, currentPage]);
  
  // When page changes, DON'T automatically move signature to new page
  // Keep it on the page where it was originally placed
  useEffect(() => {
    // Don't do anything - signature stays on its original page
  }, [currentPage]);
  
  // Center temp signature when first loaded AND scroll into view - use CURRENT PAGE
  useEffect(() => {
    if (tempSignatureImage && canvasRef.current && !isCentered) {
      const canvas = canvasRef.current;
      const centerX = (canvas.width - tempSignaturePos.width) / 2;
      const centerY = (canvas.height - tempSignaturePos.height) / 2;
      const centeredPos = {
        ...tempSignaturePos,
        x: centerX,
        y: centerY,
        page: currentPage, // USE CURRENT PAGE, not default 1
      };
      setTempSignaturePos(centeredPos);
      onSignaturePlaced(centeredPos);
      setIsCentered(true);
      
      // Scroll to signature position after a short delay
      setTimeout(() => {
        if (containerRef.current && canvasRef.current) {
          const container = containerRef.current;
          const scrollToY = centerY - (container.clientHeight / 2) + (tempSignaturePos.height / 2);
          const scrollToX = centerX - (container.clientWidth / 2) + (tempSignaturePos.width / 2);
          
          container.scrollTo({
            top: Math.max(0, scrollToY),
            left: Math.max(0, scrollToX),
            behavior: 'smooth'
          });
        }
      }, 100);
    }
  }, [tempSignatureImage, canvasRef.current?.width, canvasRef.current?.height, isCentered, currentPage]);
  
  // When user changes page, move temp signature to new page (if signature exists and not yet placed)
  useEffect(() => {
    if (tempSignatureImage && isCentered) {
      // Update signature position to current page when navigating
      setTempSignaturePos(prev => ({
        ...prev,
        page: currentPage
      }));
      onSignaturePlaced({
        ...tempSignaturePos,
        page: currentPage
      });
    }
  }, [currentPage]);

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
      // [FIX 1] Rendering lock - prevent concurrent renders
      if (isRendering) {
        console.log('[PDF VIEWER] Render already in progress, skipping...');
        return;
      }
      
      setIsRendering(true);
      
      // Abort any pending async operations
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();
      const abortSignal = abortControllerRef.current.signal;
      
      // Cancel previous PDF render if exists
      if (renderTaskRef.current) {
        try {
          await renderTaskRef.current.cancel();
        } catch (e) {
          // Ignore cancel errors
        }
        renderTaskRef.current = null;
      }
      
      // [FIX 2] Increased delay to ensure cleanup
      await new Promise(resolve => setTimeout(resolve, 50));
      
      try {
        // [FIX 3] Check if aborted before proceeding
        if (abortSignal.aborted) {
          setIsRendering(false);
          return;
        }

        const page = await pdfDoc.getPage(currentPage);
        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current!;
        const context = canvas.getContext("2d")!;

        // [FIX 4] Check abort again after async operation
        if (abortSignal.aborted) {
          setIsRendering(false);
          return;
        }

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

        // 1. Draw existing signatures first (already signed - from backend)
        if (existingSignatures && existingSignatures.length > 0) {
          for (const existingSig of existingSignatures) {
            // [FIX 5] Check abort before each signature
            if (abortSignal.aborted) {
              setIsRendering(false);
              return;
            }
            
            if (existingSig.signedAt && existingSig.signatureData) {
              try {
                const sigData = JSON.parse(existingSig.signatureData);
                const sigPosition = sigData.position;
                
                // [FIX 6] Validate page before drawing
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

        // 2. Draw PLACED signatures (confirmed in this session but not yet submitted)
        if (placedSignatures && placedSignatures.length > 0) {
          for (let i = 0; i < placedSignatures.length; i++) {
            // [FIX 7] Check abort in loop
            if (abortSignal.aborted) {
              setIsRendering(false);
              return;
            }
            
            const placedSig = placedSignatures[i];
            
            // [FIX 8] Validate page matches current
            if (placedSig.position.page === currentPage) {
              try {
                const img = new Image();
                img.src = placedSig.image;
                
                await new Promise<void>((resolve) => {
                  // [FIX 9] Check abort when image loads
                  img.onload = () => {
                    if (abortSignal.aborted) {
                      resolve();
                      return;
                    }
                    // Draw the signature image
                    context.drawImage(
                      img,
                      placedSig.position.x,
                      placedSig.position.y,
                      placedSig.position.width,
                      placedSig.position.height
                    );
                    
                    // Draw border if this signature is selected
                    if (selectedPlacedIndex === i) {
                      context.save();
                      context.setLineDash([5, 3]);
                      context.strokeStyle = '#10B981'; // Green for placed
                      context.lineWidth = 2;
                      context.strokeRect(
                        placedSig.position.x,
                        placedSig.position.y,
                        placedSig.position.width,
                        placedSig.position.height
                      );
                      context.restore();
                    }
                    
                    // Draw label
                    context.fillStyle = '#10B981';
                    context.font = 'bold 11px system-ui';
                    const labelText = `Tanda tangan ${i + 1}`;
                    const labelY = placedSig.position.y - 5;
                    
                    // Background for label
                    const textMetrics = context.measureText(labelText);
                    context.fillStyle = 'rgba(16, 185, 129, 0.9)';
                    context.fillRect(
                      placedSig.position.x,
                      labelY - 14,
                      textMetrics.width + 8,
                      18
                    );
                    
                    // Label text
                    context.fillStyle = '#FFFFFF';
                    context.fillText(labelText, placedSig.position.x + 4, labelY);
                    
                    resolve();
                  };
                  img.onerror = () => resolve();
                });
              } catch (e) {
                // Ignore errors
              }
            }
          }
        }

        // 3. Draw TEMP signature (being dragged/resized - not yet placed)
        if (tempSignatureImage && tempSignaturePos.page === currentPage) {
          // [FIX 10] Check abort before temp signature
          if (abortSignal.aborted) {
            setIsRendering(false);
            return;
          }
          
          // Pre-load image
          const img = new Image();
          img.src = tempSignatureImage;
          
          // Wait for image to load before drawing
          await new Promise<void>((resolve, reject) => {
            img.onload = () => {
              // [FIX 11] Check abort on temp signature load
              if (abortSignal.aborted) {
                resolve();
                return;
              }
              
              try {
                // Draw temp signature image WITHOUT background (transparent)
                context.drawImage(
                  img,
                  tempSignaturePos.x,
                  tempSignaturePos.y,
                  tempSignaturePos.width,
                  tempSignaturePos.height
                );
                
                // Only draw controls if temp signature is selected
                if (isTempSignatureSelected) {
                  // Draw dashed border for positioning guide (no fill)
                  context.save();
                  context.setLineDash([5, 3]); // Dashed line pattern
                  context.strokeStyle = '#F59E0B'; // Orange for temp
                  context.lineWidth = 2;
                  context.globalAlpha = 0.7; // Semi-transparent
                  context.strokeRect(
                    tempSignaturePos.x,
                    tempSignaturePos.y,
                    tempSignaturePos.width,
                    tempSignaturePos.height
                  );
                  context.restore();
                }
                
                // Only draw resize handles if temp signature selected
                if (isTempSignatureSelected) {
                  const handleSize = 16;
                  context.fillStyle = '#F59E0B'; // Orange
                  context.strokeStyle = '#FFFFFF';
                  context.lineWidth = 2;
                  
                  // Top-left
                  context.fillRect(tempSignaturePos.x - handleSize/2, tempSignaturePos.y - handleSize/2, handleSize, handleSize);
                  context.strokeRect(tempSignaturePos.x - handleSize/2, tempSignaturePos.y - handleSize/2, handleSize, handleSize);
                  // Top-right
                  context.fillRect(tempSignaturePos.x + tempSignaturePos.width - handleSize/2, tempSignaturePos.y - handleSize/2, handleSize, handleSize);
                  context.strokeRect(tempSignaturePos.x + tempSignaturePos.width - handleSize/2, tempSignaturePos.y - handleSize/2, handleSize, handleSize);
                  // Bottom-left
                  context.fillRect(tempSignaturePos.x - handleSize/2, tempSignaturePos.y + tempSignaturePos.height - handleSize/2, handleSize, handleSize);
                  context.strokeRect(tempSignaturePos.x - handleSize/2, tempSignaturePos.y + tempSignaturePos.height - handleSize/2, handleSize, handleSize);
                  // Bottom-right
                  context.fillRect(tempSignaturePos.x + tempSignaturePos.width - handleSize/2, tempSignaturePos.y + tempSignaturePos.height - handleSize/2, handleSize, handleSize);
                  context.strokeRect(tempSignaturePos.x + tempSignaturePos.width - handleSize/2, tempSignaturePos.y + tempSignaturePos.height - handleSize/2, handleSize, handleSize);
                  
                  // Draw DELETE button (X) at top-right corner
                  const deleteButtonSize = 24;
                  const deleteButtonX = tempSignaturePos.x + tempSignaturePos.width + 5;
                  const deleteButtonY = tempSignaturePos.y - 5;
                  
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
                const text = '🖱️ Drag untuk tempatkan';
                context.font = '14px system-ui';
                context.textAlign = 'center';
                const textMetrics = context.measureText(text);
                const textX = tempSignaturePos.x + tempSignaturePos.width / 2;
                const textY = tempSignaturePos.y - 35;
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
        // Ignore cancellation errors and canvas conflicts
        const errorMsg = error?.message || '';
        if (error?.name !== 'RenderingCancelledException' && 
            !errorMsg.includes('Cannot use the same canvas')) {
          console.error('[PDF VIEWER] Error rendering page:', error);
        }
      } finally {
        // [FIX 12] Always release rendering lock
        setIsRendering(false);
      }
    };

    let cancelled = false;
    
    const doRender = async () => {
      if (!cancelled) {
        await renderPage();
      }
    };
    
    doRender();
    
    return () => {
      // [FIX 13] Enhanced cleanup on unmount or dependency change
      cancelled = true;
      
      // Cancel PDF render task
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch (e) {
          // Ignore
        }
        renderTaskRef.current = null;
      }
      
      // Abort all async operations
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      
      // Release rendering lock
      setIsRendering(false);
    };
  }, [pdfDoc, currentPage, scale, tempSignatureImage, tempSignaturePos, placedSignatures, existingSignatures, isTempSignatureSelected, selectedPlacedIndex, isRendering]);

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
      x >= tempSignaturePos.x &&
      x <= tempSignaturePos.x + tempSignaturePos.width &&
      y >= tempSignaturePos.y &&
      y <= tempSignaturePos.y + tempSignaturePos.height &&
      tempSignaturePos.page === currentPage;

    // Check if clicked on delete button (only if temp signature is selected)
    if (isTempSignatureSelected && tempSignaturePos.page === currentPage) {
      const deleteButtonSize = 24;
      const deleteButtonX = tempSignaturePos.x + tempSignaturePos.width + 5;
      const deleteButtonY = tempSignaturePos.y - 5;
      const distToDelete = Math.sqrt(
        Math.pow(x - deleteButtonX, 2) + Math.pow(y - deleteButtonY, 2)
      );
      
      if (distToDelete <= deleteButtonSize / 2) {
        // Clicked on delete button - clear temp signature
        setIsTempSignatureSelected(false);
        onSignaturePlaced(null);
        return;
      }
    }

    if (isClickedOnSignature) {
      // Select temp signature on click
      setIsTempSignatureSelected(true);
      
      // Check if clicked on resize handle (corners)
      const handleSize = 16;
      const isBottomRight = 
        x >= tempSignaturePos.x + tempSignaturePos.width - handleSize &&
        y >= tempSignaturePos.y + tempSignaturePos.height - handleSize;
      const isBottomLeft = 
        x <= tempSignaturePos.x + handleSize &&
        y >= tempSignaturePos.y + tempSignaturePos.height - handleSize;
      const isTopRight = 
        x >= tempSignaturePos.x + tempSignaturePos.width - handleSize &&
        y <= tempSignaturePos.y + handleSize;
      const isTopLeft = 
        x <= tempSignaturePos.x + handleSize &&
        y <= tempSignaturePos.y + handleSize;
      
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
          x: x - tempSignaturePos.x,
          y: y - tempSignaturePos.y,
        });
      }
    } else {
      // Clicked outside temp signature - deselect
      setIsTempSignatureSelected(false);
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
      x >= tempSignaturePos.x &&
      x <= tempSignaturePos.x + tempSignaturePos.width &&
      y >= tempSignaturePos.y &&
      y <= tempSignaturePos.y + tempSignaturePos.height &&
      tempSignaturePos.page === currentPage;
    
    setIsHovering(isOverSignature);

    if (isDragging) {
      // Use drag offset for smooth dragging
      const newX = x - dragOffset.x;
      const newY = y - dragOffset.y;

      const newPos = {
        ...tempSignaturePos,
        x: Math.max(0, Math.min(newX, canvas.width - tempSignaturePos.width)),
        y: Math.max(0, Math.min(newY, canvas.height - tempSignaturePos.height)),
        page: currentPage,
      };

      setTempSignaturePos(newPos);
      onSignaturePlaced(newPos);
    } else if (isResizing) {
      const minSize = 50;
      let newWidth = tempSignaturePos.width;
      let newHeight = tempSignaturePos.height;
      let newX = tempSignaturePos.x;
      let newY = tempSignaturePos.y;

      if (resizeHandle === "br") {
        newWidth = Math.max(minSize, x - tempSignaturePos.x);
        newHeight = Math.max(minSize, y - tempSignaturePos.y);
      } else if (resizeHandle === "bl") {
        newWidth = Math.max(minSize, tempSignaturePos.x + tempSignaturePos.width - x);
        newHeight = Math.max(minSize, y - tempSignaturePos.y);
        newX = x;
      } else if (resizeHandle === "tr") {
        newWidth = Math.max(minSize, x - tempSignaturePos.x);
        newHeight = Math.max(minSize, tempSignaturePos.y + tempSignaturePos.height - y);
        newY = y;
      } else if (resizeHandle === "tl") {
        newWidth = Math.max(minSize, tempSignaturePos.x + tempSignaturePos.width - x);
        newHeight = Math.max(minSize, tempSignaturePos.y + tempSignaturePos.height - y);
        newX = x;
        newY = y;
      }

      const newPos = {
        ...tempSignaturePos,
        x: Math.max(0, Math.min(newX, canvas.width - newWidth)),
        y: Math.max(0, Math.min(newY, canvas.height - newHeight)),
        width: Math.min(newWidth, canvas.width - newX),
        height: Math.min(newHeight, canvas.height - newY),
        page: currentPage,
      };

      setTempSignaturePos(newPos);
      onSignaturePlaced(newPos);
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
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Halaman</span>
            <input
              type="number"
              min="1"
              max={numPages}
              value={currentPage}
              onChange={(e) => {
                const page = parseInt(e.target.value);
                if (!isNaN(page) && page >= 1 && page <= numPages) {
                  setCurrentPage(page);
                }
              }}
              className="w-16 px-2 py-1 text-center border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <span className="text-sm text-gray-600">/ {numPages}</span>
          </div>
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
