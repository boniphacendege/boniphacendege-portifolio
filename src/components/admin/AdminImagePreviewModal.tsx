/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Admin Image Preview Modal (Lightbox & Inspection System)
 * Allows administrators to preview any uploaded logo, profile photo,
 * hero background, or thumbnail in full high-definition with:
 * - Transparency checkerboard grid (for PNG/SVG cutout inspection)
 * - Zoom controls (Fit, 100%, 150%, 200%)
 * - Aspect ratio detection and natural dimension metadata
 * - Direct download and open in new tab
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Download,
  ExternalLink,
  Eye,
  Sparkles,
  RotateCw
} from 'lucide-react';
import { detectImageDimensionsAndRatio } from '../../utils/imageHelper';

export interface ImagePreviewData {
  url: string;
  title: string;
  subtitle?: string;
  ratio?: string;
}

interface AdminImagePreviewModalProps {
  image: ImagePreviewData | null;
  onClose: () => void;
}

export const AdminImagePreviewModal: React.FC<AdminImagePreviewModalProps> = ({
  image,
  onClose
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [dimensions, setDimensions] = useState<{ width: number; height: number; ratioLabel?: string } | null>(null);
  const [showCheckerboard, setShowCheckerboard] = useState<boolean>(true);
  const [rotation, setRotation] = useState<number>(0);

  useEffect(() => {
    if (!image?.url) {
      setDimensions(null);
      setZoomLevel(1);
      setRotation(0);
      return;
    }

    setZoomLevel(1);
    setRotation(0);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setDimensions({
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height
      });
    };
    img.src = image.url;

    detectImageDimensionsAndRatio(image.url).then((info) => {
      setDimensions((prev) => ({
        width: prev?.width || info.width,
        height: prev?.height || info.height,
        ratioLabel: info.label
      }));
    });
  }, [image?.url]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!image) return null;

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.35, 3));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.35, 0.5));
  const handleResetZoom = () => setZoomLevel(1);
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = image.url;
    a.download = `${image.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_preview`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative max-w-5xl w-full max-h-[92vh] flex flex-col bg-[#010c06] rounded-2xl border border-[#3dff8f]/60 card-neon-shallow shadow-[0_0_35px_rgba(61,255,143,0.3)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="px-4 py-3 sm:px-6 bg-[#02180d] border-b border-[#3dff8f]/30 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="p-1.5 rounded-lg bg-[#0a351e] border border-[#3dff8f]/40 text-[#3dff8f] shrink-0">
              <Eye className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold font-serif-heading text-[#fff1b8] truncate">
                {image.title}
              </h3>
              <p className="text-[11px] text-[#9fbfae] truncate">
                {image.subtitle || 'High-Definition Image Preview & Inspection'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Aspect Ratio Badge */}
            {(image.ratio || dimensions?.ratioLabel) && (
              <span className="hidden sm:inline-flex items-center text-[10px] font-mono font-bold px-2.5 py-1 rounded-md bg-[#0a351e] text-[#3dff8f] border border-[#3dff8f]/40">
                {image.ratio || dimensions?.ratioLabel}
              </span>
            )}

            {/* Dimensions Badge */}
            {dimensions && (
              <span className="text-[10px] font-mono px-2 py-1 rounded-md bg-[#010904] text-[#fff1b8] border border-white/10 hidden md:inline-flex">
                {dimensions.width} &times; {dimensions.height} px
              </span>
            )}

            {/* Close button */}
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-xl text-[#9fbfae] hover:text-white hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
              title="Close image preview (Esc)"
              aria-label="Close image preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Image Display Area with optional transparency checkerboard */}
        <div
          className={`relative flex-1 min-h-[320px] max-h-[68vh] overflow-auto flex items-center justify-center p-4 sm:p-8 select-none transition-colors ${
            showCheckerboard
              ? 'bg-[radial-gradient(#1a3d28_1.2px,transparent_1.2px)] bg-[size:14px_14px] bg-[#010a05]'
              : 'bg-[#000502]'
          }`}
        >
          <img
            src={image.url}
            alt={image.title}
            style={{
              transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
              transition: 'transform 0.2s ease-out'
            }}
            className="max-h-[58vh] max-w-full object-contain rounded-lg shadow-2xl pointer-events-auto"
          />
        </div>

        {/* Modal Bottom Toolbar */}
        <div className="px-4 py-2.5 sm:px-6 bg-[#02180d] border-t border-[#3dff8f]/20 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
          {/* Zoom & View Controls */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-1.5 rounded-lg bg-[#010904] text-[#9fbfae] hover:text-[#3dff8f] border border-white/10 hover:border-[#3dff8f]/40 cursor-pointer"
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="font-mono text-[11px] text-[#3dff8f] px-2 py-0.5 rounded bg-[#010904] border border-white/10 min-w-[50px] text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-1.5 rounded-lg bg-[#010904] text-[#9fbfae] hover:text-[#3dff8f] border border-white/10 hover:border-[#3dff8f]/40 cursor-pointer"
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              className="px-2 py-1 rounded-lg bg-[#010904] text-[11px] font-mono text-[#9fbfae] hover:text-white border border-white/10 cursor-pointer"
              title="Reset to 100%"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={handleRotate}
              className="p-1.5 rounded-lg bg-[#010904] text-[#9fbfae] hover:text-white border border-white/10 cursor-pointer"
              title="Rotate 90 degrees"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setShowCheckerboard(!showCheckerboard)}
              className={`px-2 py-1 rounded-lg text-[11px] font-mono border transition-all cursor-pointer ${
                showCheckerboard
                  ? 'bg-[#0a351e] text-[#3dff8f] border-[#3dff8f]/40'
                  : 'bg-[#010904] text-[#9fbfae] border-white/10'
              }`}
              title="Toggle transparency grid"
            >
              Grid {showCheckerboard ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Download & Open in new tab actions */}
          <div className="flex items-center gap-2">
            <a
              href={image.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg bg-[#010904] text-[#9fbfae] hover:text-white border border-white/10 hover:border-[#3dff8f]/40 flex items-center gap-1.5 transition-all text-xs cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Open Full Size</span>
            </a>
            <button
              type="button"
              onClick={handleDownload}
              className="px-3 py-1.5 rounded-lg font-bold text-[#1a1200] bg-gradient-to-b from-[#fff1b8] via-[#f0b92e] to-[#b8841a] hover:brightness-110 flex items-center gap-1.5 shadow transition-all text-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
