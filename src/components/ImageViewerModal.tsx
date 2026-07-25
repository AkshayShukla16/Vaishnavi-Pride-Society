/**
 * Full-Screen High-Resolution Image Viewer Modal for Vaishnavi Pride.
 * Allows residents and admins to click any uploaded issue photo or completed work proof
 * to view, zoom, and open in a new tab.
 */

import React from 'react';
import { X, ExternalLink, Download } from 'lucide-react';

interface ImageViewerModalProps {
  imageUrl: string | null;
  title?: string;
  onClose: () => void;
}

export const ImageViewerModal: React.FC<ImageViewerModalProps> = ({ imageUrl, title = 'Photo Preview', onClose }) => {
  if (!imageUrl) return null;

  const handleOpenNewTab = () => {
    const win = window.open();
    if (win) {
      win.document.write(`<img src="${imageUrl}" style="max-width:100%; height:auto; margin:auto; display:block;" />`);
      win.document.title = title;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="relative max-w-4xl w-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex justify-between items-center px-5 py-3 border-b border-slate-800 bg-slate-950/80">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span>📷</span> {title}
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenNewTab}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
              title="Open full image in browser tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open Full
            </button>
            <a
              href={imageUrl}
              download="vaishnavi-pride-photo.jpg"
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
              title="Download image file"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </a>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body / Image Viewport */}
        <div className="p-4 flex items-center justify-center overflow-auto bg-slate-950 flex-1 min-h-[300px]">
          <img
            src={imageUrl}
            alt={title}
            className="max-h-[75vh] w-auto object-contain rounded-xl border border-slate-800 shadow-lg cursor-zoom-in"
            onClick={handleOpenNewTab}
          />
        </div>
      </div>
    </div>
  );
};
