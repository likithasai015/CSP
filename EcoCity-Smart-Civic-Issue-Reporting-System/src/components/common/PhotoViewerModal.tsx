import React, { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ExternalLink, Download, Image as ImageIcon, ZoomIn } from "lucide-react";

interface PhotoViewerModalProps {
  isOpen: boolean;
  imageUrl: string | null;
  title?: string;
  subtitle?: string;
  onClose: () => void;
}

export const getCategoryFallbackImage = (category?: string): string => {
  switch (category) {
    case "Garbage":
      return "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&q=80&w=1200";
    case "Broken Streetlights":
      return "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=1200";
    case "Potholes":
      return "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80&w=1200";
    case "Water Leakage":
    case "Drainage":
      return "https://images.unsplash.com/photo-1542013936693-884638332954?auto=format&fit=crop&q=80&w=1200";
    case "Stray Animal Issues":
      return "https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&q=80&w=1200";
    case "Illegal Tree Cutting":
      return "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&q=80&w=1200";
    case "Pollution":
      return "https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?auto=format&fit=crop&q=80&w=1200";
    default:
      return "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=1200";
  }
};

export const normalizeReportImageUrl = (url?: string, category?: string): string => {
  if (!url || typeof url !== "string" || url.trim() === "") {
    return getCategoryFallbackImage(category);
  }
  const trimmed = url.trim();
  if (
    trimmed.startsWith("data:") ||
    trimmed.startsWith("blob:") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://")
  ) {
    return trimmed;
  }
  if (trimmed.startsWith("/uploads/")) {
    if (import.meta.env.DEV && typeof window !== "undefined" && window.location.port !== "5000") {
      return `http://localhost:5000${trimmed}`;
    }
    return trimmed;
  }
  return trimmed;
};

export const openImageInNewTab = (imageUrl: string) => {
  if (!imageUrl) return;

  if (imageUrl.startsWith("data:")) {
    const win = window.open("");
    if (win) {
      win.document.write(`
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>EcoCity — Photographic Evidence</title>
            <style>
              body {
                margin: 0;
                padding: 24px;
                background-color: #1a1e1c;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                box-sizing: border-box;
                font-family: system-ui, -apple-system, sans-serif;
              }
              img {
                max-width: 95vw;
                max-height: 88vh;
                object-fit: contain;
                border-radius: 12px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.6);
              }
              .caption {
                color: #cbd5e1;
                margin-top: 16px;
                font-size: 13px;
                letter-spacing: 0.5px;
                font-weight: 500;
              }
            </style>
          </head>
          <body>
            <img src="${imageUrl}" alt="Photographic Evidence" />
            <div class="caption">EcoCity Smart Civic Issue Reporting System &bull; Photographic Evidence</div>
          </body>
        </html>
      `);
      win.document.close();
      return;
    }
  }

  window.open(imageUrl, "_blank", "noopener,noreferrer");
};

export const downloadImage = (imageUrl: string, filename = "civic-evidence.jpg") => {
  if (!imageUrl) return;
  const link = document.createElement("a");
  link.href = imageUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export function PhotoViewerModal({
  isOpen,
  imageUrl,
  title = "Photographic Evidence",
  subtitle,
  onClose,
}: PhotoViewerModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen || !imageUrl) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-charcoal/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative max-w-4xl w-full max-h-[92vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col z-10 border border-charcoal/10"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-charcoal/10 flex items-center justify-between bg-ivory">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal/10 text-teal flex items-center justify-center">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-charcoal">{title}</h3>
                {subtitle && (
                  <p className="text-xs text-charcoal-light">{subtitle}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => openImageInNewTab(imageUrl)}
                title="Open in new browser tab"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-charcoal/10 text-xs font-medium text-charcoal hover:bg-white transition-colors cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Open in Tab</span>
              </button>

              <button
                type="button"
                onClick={() => downloadImage(imageUrl, `evidence-${Date.now()}.jpg`)}
                title="Download photo"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-charcoal/10 text-xs font-medium text-charcoal hover:bg-white transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Download</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center text-charcoal-light hover:text-charcoal hover:bg-charcoal/10 transition-colors ml-1 cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5 stroke-[1.5]" />
              </button>
            </div>
          </div>

          {/* Photo Container */}
          <div className="flex-1 overflow-auto bg-charcoal/5 flex items-center justify-center p-4 sm:p-6 min-h-[300px]">
            <img
              src={imageUrl}
              alt={title}
              className="max-h-[72vh] w-auto max-w-full object-contain rounded-2xl shadow-sm border border-charcoal/5 select-none"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Footer bar */}
          <div className="px-6 py-3 bg-ivory border-t border-charcoal/10 flex items-center justify-between text-xs text-charcoal-light">
            <span className="flex items-center gap-1.5">
              <ZoomIn className="w-3.5 h-3.5 text-teal" />
              Full-resolution inspection view
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-charcoal text-white rounded-lg text-xs font-medium hover:bg-charcoal/90 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default PhotoViewerModal;
