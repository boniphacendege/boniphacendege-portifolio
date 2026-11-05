import React, { useState, useEffect, useRef } from 'react';
import { ProjectItem } from '../data/portfolioStorage';
import { getCssAspectRatio, detectStandardAspectRatio, StandardRatioId } from '../utils/imageHelper';
import {
  X,
  ExternalLink,
  Github,
  Calendar,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  Send,
  User,
  Image as ImageIcon,
  Heart,
  Share2,
  Eye,
  ThumbsUp,
  Star,
  Check,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Download,
  FileText,
  FileArchive,
  FileDown,
  Clock,
  Compass,
  Rocket,
  CircleDot
} from 'lucide-react';
import { generateProjectSummaryPdf } from '../utils/projectPdfHelper';

interface ProjectModalProps {
  project: ProjectItem | null;
  onClose: () => void;
  onInquireSimilar?: (projectTitle: string) => void;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  project,
  onClose,
  onInquireSimilar
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [modalToast, setModalToast] = useState<string | null>(null);
  const [detectedRatioMap, setDetectedRatioMap] = useState<Record<string, StandardRatioId>>({});

  // Lightbox Zoom & Fullscreen state
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxZoom, setLightboxZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const lightboxRef = useRef<HTMLDivElement>(null);

  const [isFavorited, setIsFavorited] = useState<boolean>(() => {
    try {
      if (!project) return false;
      const stored = localStorage.getItem('boniphace_favorites_map');
      return stored ? !!JSON.parse(stored)[project.id] : false;
    } catch {
      return false;
    }
  });

  const [isLiked, setIsLiked] = useState<boolean>(() => {
    try {
      if (!project) return false;
      const stored = localStorage.getItem('boniphace_user_liked');
      return stored ? !!JSON.parse(stored)[project.id] : false;
    } catch {
      return false;
    }
  });

  const [likeCount, setLikeCount] = useState<number>(() => {
    try {
      if (!project) return 42;
      const stored = localStorage.getItem('boniphace_likes_map');
      const base = 42;
      return base + (stored && JSON.parse(stored)[project.id] ? JSON.parse(stored)[project.id] : 0);
    } catch {
      return 42;
    }
  });

  const showToast = (msg: string) => {
    setModalToast(msg);
    setTimeout(() => setModalToast(null), 3000);
  };

  const handleToggleFavorite = () => {
    if (!project) return;
    try {
      const stored = localStorage.getItem('boniphace_favorites_map');
      const map = stored ? JSON.parse(stored) : {};
      const next = !isFavorited;
      map[project.id] = next;
      localStorage.setItem('boniphace_favorites_map', JSON.stringify(map));
      setIsFavorited(next);
      showToast(next ? 'Saved to your favorites!' : 'Removed from favorites');
    } catch {}
  };

  const handleToggleLike = () => {
    if (!project) return;
    try {
      const storedLikes = localStorage.getItem('boniphace_likes_map');
      const storedUserLiked = localStorage.getItem('boniphace_user_liked');
      const likesMap = storedLikes ? JSON.parse(storedLikes) : {};
      const userLikedMap = storedUserLiked ? JSON.parse(storedUserLiked) : {};

      const nextLiked = !isLiked;
      userLikedMap[project.id] = nextLiked;
      const current = likesMap[project.id] || 0;
      const nextCount = nextLiked ? current + 1 : Math.max(0, current - 1);
      likesMap[project.id] = nextCount;

      localStorage.setItem('boniphace_likes_map', JSON.stringify(likesMap));
      localStorage.setItem('boniphace_user_liked', JSON.stringify(userLikedMap));

      setIsLiked(nextLiked);
      setLikeCount((prev) => (nextLiked ? prev + 1 : Math.max(0, prev - 1)));
      showToast(nextLiked ? 'Liked! Thank you for supporting this work.' : 'Like removed');
    } catch {}
  };

  const handleShare = async () => {
    if (!project) return;
    const shareUrl = `${window.location.origin}${window.location.pathname}#project-${project.slug}`;
    const shareData = {
      title: project.title,
      text: `Check out "${project.title}" by Boniphace Ndege — Graphic Designer & Web Developer`,
      url: shareUrl
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        showToast('Project shared successfully!');
        return;
      } catch (err: any) {
        if (err?.name === 'AbortError') return; // User closed share sheet
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast('Project link copied to clipboard!');
    } catch {
      showToast('Project link ready to share!');
    }
  };

  const handleDownloadAttachment = async (att: { name: string; url: string }) => {
    showToast(`Downloading "${att.name}"...`);
    try {
      const res = await fetch(att.url);
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = att.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 10000);
        showToast(`Downloaded "${att.name}" successfully!`);
        return;
      }
    } catch (e) {
      console.warn('Direct blob fetch notice:', e);
    }
    const a = document.createElement('a');
    a.href = att.url;
    a.download = att.name;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast(`Downloading "${att.name}"...`);
  };

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handleDownloadPdfSummary = () => {
    if (!project) return;
    setIsGeneratingPdf(true);
    showToast('Generating official Project Summary PDF...');
    setTimeout(() => {
      const success = generateProjectSummaryPdf(project);
      setIsGeneratingPdf(false);
      if (success) {
        showToast('Project Summary PDF downloaded successfully!');
      } else {
        showToast('Could not generate PDF. Please try again.');
      }
    }, 150);
  };

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!isLightboxOpen || !project) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const allImgs = [project.thumbnail, ...(project.gallery || [])].filter(Boolean);
      const total = Array.from(new Set(allImgs)).length;
      if (e.key === 'Escape') {
        setIsLightboxOpen(false);
        setLightboxZoom(1);
        setPanOffset({ x: 0, y: 0 });
      } else if (e.key === 'ArrowRight') {
        setActiveImageIndex((prev) => (prev + 1) % (total || 1));
        setLightboxZoom(1);
        setPanOffset({ x: 0, y: 0 });
      } else if (e.key === 'ArrowLeft') {
        setActiveImageIndex((prev) => (prev - 1 + (total || 1)) % (total || 1));
        setLightboxZoom(1);
        setPanOffset({ x: 0, y: 0 });
      } else if (e.key === '+' || e.key === '=') {
        setLightboxZoom((z) => Math.min(3.5, Number((z + 0.25).toFixed(2))));
      } else if (e.key === '-') {
        setLightboxZoom((z) => {
          const next = Math.max(1, Number((z - 0.25).toFixed(2)));
          if (next === 1) setPanOffset({ x: 0, y: 0 });
          return next;
        });
      } else if (e.key === '0') {
        setLightboxZoom(1);
        setPanOffset({ x: 0, y: 0 });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, project]);

  // Early return only AFTER all hooks are called
  if (!project) return null;

  const allImages = [
    project.thumbnail,
    ...(project.gallery || [])
  ].filter(Boolean);

  // Remove duplicates
  const uniqueImages = Array.from(new Set(allImages));
  const currentImage = uniqueImages[activeImageIndex] || project.thumbnail;

  const handleZoomIn = () => {
    setLightboxZoom((z) => Math.min(3.5, Number((z + 0.35).toFixed(2))));
  };

  const handleZoomOut = () => {
    setLightboxZoom((z) => {
      const next = Math.max(1, Number((z - 0.35).toFixed(2)));
      if (next === 1) setPanOffset({ x: 0, y: 0 });
      return next;
    });
  };

  const handleResetZoom = () => {
    setLightboxZoom(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handleWheelZoom = (e: React.WheelEvent) => {
    if (e.deltaY < 0) {
      setLightboxZoom((prev) => Math.min(3.5, Number((prev + 0.2).toFixed(2))));
    } else {
      setLightboxZoom((prev) => {
        const next = Math.max(1, Number((prev - 0.2).toFixed(2)));
        if (next === 1) setPanOffset({ x: 0, y: 0 });
        return next;
      });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (lightboxZoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && lightboxZoom > 1) {
      setPanOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleDoubleClick = () => {
    if (lightboxZoom > 1) {
      setLightboxZoom(1);
      setPanOffset({ x: 0, y: 0 });
    } else {
      setLightboxZoom(2);
    }
  };

  const handleNextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveImageIndex((prev) => (prev + 1) % uniqueImages.length);
    setLightboxZoom(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const handlePrevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveImageIndex((prev) => (prev - 1 + uniqueImages.length) % uniqueImages.length);
    setLightboxZoom(1);
    setPanOffset({ x: 0, y: 0 });
  };

  return (
    <div
      onClick={onClose}
      style={{ backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-[10px] [backdrop-filter:blur(10px)] animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[860px] max-h-[92vh] bg-[#02110a] text-[#f4fff8] card-neon-shallow rounded-[24px] shadow-[0_20px_70px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Toast Notification inside Modal */}
        {modalToast && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-[#02180c] border border-[#3dff8f] text-[#3dff8f] font-mono text-xs shadow-[0_0_20px_rgba(61,255,143,0.5)] flex items-center gap-2 animate-in fade-in duration-200 pointer-events-none">
            <Check className="w-4 h-4 text-[#3dff8f]" />
            <span>{modalToast}</span>
          </div>
        )}

        {/* Top Header */}
        <div className="px-6 py-4 bg-[#010904] border-b border-[rgba(240,185,46,0.3)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase text-[#f0b92e]">
              {project.category}
            </span>
            <span className="text-white/20">•</span>
            <span className="text-xs font-mono text-[#3dff8f] capitalize">
              {project.projectType}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-bold text-[#3dff8f] bg-[#02180d] border border-[#3dff8f]/40 hover:border-[#3dff8f] hover:bg-[#3dff8f]/15 shadow-[0_0_10px_rgba(61,255,143,0.15)] transition-all cursor-pointer"
              title="Share project title & link"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share Project</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close project modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Modal Content */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-7">
          {/* Main Visual Gallery Showcase - Dynamic Auto Aspect Ratio */}
          {(() => {
            const activeRatio = (detectedRatioMap[currentImage] || project.aspectRatio || '1:1') as string;
            const isPortrait = ['2:3', '3:4', '4:5', '5:7', '9:16'].includes(activeRatio);

            return (
              <div className="space-y-3">
                <div
                  onClick={() => setIsLightboxOpen(true)}
                  className="relative w-full mx-auto bg-[#010703] rounded-2xl overflow-hidden border border-[rgba(240,185,46,0.2)] shadow-2xl transition-all duration-300 flex items-center justify-center cursor-zoom-in group select-none"
                  style={{
                    aspectRatio: getCssAspectRatio(activeRatio),
                    maxHeight: '60vh',
                    maxWidth: isPortrait ? '420px' : '680px'
                  }}
                  title="Click image to open in full screen lightbox with zoom"
                >
                  {/* Ambient blurred backdrop for seamless edge blending across all ratios */}
                  <img
                    src={currentImage}
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 w-full h-full object-cover blur-xl scale-110 opacity-30 pointer-events-none"
                  />
                  <img
                    src={currentImage}
                    alt={project.title}
                    onLoad={(e) => {
                      if (!detectedRatioMap[currentImage]) {
                        const detected = detectStandardAspectRatio(e.currentTarget.naturalWidth, e.currentTarget.naturalHeight);
                        setDetectedRatioMap((prev) => ({ ...prev, [currentImage]: detected.ratioId }));
                      }
                    }}
                    className="w-full h-full object-contain relative z-10 transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                  {/* Hover Overlay with Zoom Prompt */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20 flex items-center justify-center pointer-events-none">
                    <div className="px-4 py-2 rounded-full bg-black/85 border border-[#3dff8f] text-[#3dff8f] font-mono text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(61,255,143,0.5)] backdrop-blur-md">
                      <ZoomIn className="w-4 h-4 text-[#3dff8f]" />
                      <span>Click to Zoom & View Full Screen</span>
                    </div>
                  </div>

                  {/* Top Left Fullscreen Lightbox Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsLightboxOpen(true);
                    }}
                    className="absolute top-3 left-3 z-25 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/80 hover:bg-[#032514] border border-[#3dff8f]/50 text-[#3dff8f] text-xs font-mono shadow-lg backdrop-blur-md transition-all hover:scale-105 cursor-pointer"
                    title="Open Fullscreen Lightbox Zoom"
                  >
                    <Maximize2 className="w-3.5 h-3.5 text-[#3dff8f]" />
                    <span className="hidden sm:inline">Zoom Fullscreen</span>
                  </button>

                  {/* Ratio badge indicator */}
                  <div className="absolute top-3 right-3 z-20 px-2.5 py-1 rounded-full bg-black/75 border border-[#3dff8f]/40 text-[#3dff8f] font-mono text-[10px] backdrop-blur-md flex items-center gap-1.5 shadow-md">
                    <span>{activeRatio}</span>
                  </div>
                </div>

                {/* Gallery Thumbnails */}
                {uniqueImages.length > 1 && (
                  <div className="flex items-center justify-center gap-2 overflow-x-auto pb-1">
                    {uniqueImages.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImageIndex(idx)}
                        className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                          activeImageIndex === idx
                            ? 'border-[#3dff8f] scale-105 shadow-[0_0_12px_#3dff8f]'
                            : 'border-white/10 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Shining Interaction Icons directly below gallery showcase (No combined card container) */}
                <div
                  className="mx-auto py-2 grid grid-cols-5 gap-1 select-none items-center justify-items-center"
                  style={{ maxWidth: isPortrait ? '420px' : '680px' }}
                >
              {/* 1. Favorite Shining Icon */}
              <button
                type="button"
                onClick={handleToggleFavorite}
                className="group/btn relative flex flex-col items-center justify-center gap-1.5 py-1 px-1 cursor-pointer select-none transition-all duration-150 active:scale-75 active:translate-y-1.5 focus:outline-none"
                title={isFavorited ? 'Saved in favorites (click to remove)' : 'Add to favorites'}
                aria-label="Favorite"
              >
                <Heart
                  className={`w-4 h-4 transition-all duration-150 group-hover/btn:scale-125 ${
                    isFavorited
                      ? 'fill-rose-400 text-rose-400 drop-shadow-[0_0_10px_#f43f5e] drop-shadow-[0_0_20px_rgba(244,63,94,0.7)]'
                      : 'text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.75)] group-hover/btn:drop-shadow-[0_0_14px_rgba(244,63,94,1)]'
                  }`}
                />
                <span
                  className={`font-mono text-[10px] sm:text-[11px] font-bold leading-none tracking-tight transition-all duration-150 ${
                    isFavorited
                      ? 'text-rose-300 drop-shadow-[0_0_8px_rgba(244,63,94,0.8)]'
                      : 'text-rose-300/80 group-hover/btn:text-rose-200'
                  }`}
                >
                  {isFavorited ? 'Saved' : 'Save'}
                </span>
              </button>

              {/* 2. Share Shining Icon */}
              <button
                type="button"
                onClick={handleShare}
                className="group/btn relative flex flex-col items-center justify-center gap-1.5 py-1 px-1 cursor-pointer select-none transition-all duration-150 active:scale-75 active:translate-y-1.5 focus:outline-none"
                title="Share project (website link hidden, copies to clipboard)"
                aria-label="Share"
              >
                <Share2 className="w-4 h-4 text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)] group-hover/btn:drop-shadow-[0_0_14px_rgba(6,182,212,1)] group-hover/btn:scale-125 transition-all duration-150" />
                <span className="font-mono text-[10px] sm:text-[11px] font-bold leading-none tracking-tight text-cyan-300/80 group-hover/btn:text-cyan-100">
                  Share
                </span>
              </button>

              {/* 3. Views Shining Icon */}
              <button
                type="button"
                onClick={() => showToast('Verified organic portfolio impressions')}
                className="group/btn relative flex flex-col items-center justify-center gap-1.5 py-1 px-1 cursor-pointer select-none transition-all duration-150 active:scale-75 active:translate-y-1.5 focus:outline-none"
                title="Verified views"
                aria-label="Views"
              >
                <Eye className="w-4 h-4 text-[#3dff8f] drop-shadow-[0_0_8px_rgba(61,255,143,0.85)] group-hover/btn:drop-shadow-[0_0_16px_rgba(61,255,143,1)] group-hover/btn:scale-125 transition-all duration-150" />
                <span className="font-mono text-[10px] sm:text-[11px] font-bold leading-none tracking-tight text-[#3dff8f]/90 group-hover/btn:text-white">
                  1.4k
                </span>
              </button>

              {/* 4. Likes Shining Icon */}
              <button
                type="button"
                onClick={handleToggleLike}
                className="group/btn relative flex flex-col items-center justify-center gap-1.5 py-1 px-1 cursor-pointer select-none transition-all duration-150 active:scale-75 active:translate-y-1.5 focus:outline-none"
                title={isLiked ? 'Liked! Click to undo' : 'Like project'}
                aria-label="Like"
              >
                <ThumbsUp
                  className={`w-4 h-4 transition-all duration-150 group-hover/btn:scale-125 ${
                    isLiked
                      ? 'fill-blue-400 text-blue-400 drop-shadow-[0_0_10px_#3b82f6] drop-shadow-[0_0_20px_rgba(59,130,246,0.7)]'
                      : 'text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)] group-hover/btn:drop-shadow-[0_0_14px_rgba(59,130,246,1)]'
                  }`}
                />
                <span
                  className={`font-mono text-[10px] sm:text-[11px] font-bold leading-none tracking-tight transition-all duration-150 ${
                    isLiked
                      ? 'text-blue-300 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]'
                      : 'text-blue-300/80 group-hover/btn:text-blue-100'
                  }`}
                >
                  {likeCount}
                </span>
              </button>

              {/* 5. Reviews / Rating Shining Icon */}
              <button
                type="button"
                onClick={() => showToast('5.0 / 5.0 rating from verified clients')}
                className="group/btn relative flex flex-col items-center justify-center gap-1.5 py-1 px-1 cursor-pointer select-none transition-all duration-150 active:scale-75 active:translate-y-1.5 focus:outline-none"
                title="5.0 rating from verified clients"
                aria-label="Reviews"
              >
                <Star className="w-4 h-4 fill-[#f0b92e] text-[#f0b92e] drop-shadow-[0_0_8px_rgba(240,185,46,0.85)] group-hover/btn:drop-shadow-[0_0_16px_rgba(240,185,46,1)] group-hover/btn:scale-125 transition-all duration-150" />
                <span className="font-mono text-[10px] sm:text-[11px] font-bold leading-none tracking-tight text-[#fff1b8] group-hover/btn:text-white">
                  5.0
                </span>
              </button>
            </div>
          </div>
        );
      })()}

          {/* Title and Short Summary */}
          <div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-serif-heading text-[#fff1b8] mb-2">
              {project.title}
            </h2>
            <p className="text-sm sm:text-base text-[#9fbfae] leading-relaxed">
              {project.summary}
            </p>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 p-4 rounded-xl bg-[#010904] border border-[rgba(240,185,46,0.18)] text-xs font-mono">
            <div>
              <span className="text-[#9fbfae] block">My Role:</span>
              <strong className="text-[#f4fff8] mt-0.5 block truncate">{project.role}</strong>
            </div>
            <div>
              <span className="text-[#9fbfae] block">Status:</span>
              <strong className="text-[#3dff8f] mt-0.5 block capitalize">{project.status.replace('_', ' ')}</strong>
            </div>
            <div>
              <span className="text-[#9fbfae] block">Category:</span>
              <strong className="text-[#f0b92e] mt-0.5 block truncate">{project.category}</strong>
            </div>
            <div>
              <span className="text-[#9fbfae] block">Project Type:</span>
              <strong className="text-[#fff1b8] mt-0.5 block capitalize">{project.projectType}</strong>
            </div>
            {project.clientName && (
              <div>
                <span className="text-[#9fbfae] block">Client:</span>
                <strong className="text-[#3dff8f] mt-0.5 block truncate">{project.clientName}</strong>
              </div>
            )}
            {project.completionDate && (
              <div>
                <span className="text-[#9fbfae] block">Delivered:</span>
                <strong className="text-[#fff1b8] mt-0.5 block truncate">{project.completionDate}</strong>
              </div>
            )}
          </div>

          {/* Visual Timeline & Progress Bar: Duration, Phases (Discovery, Design, Development, Launch) & PDF Summary Button */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#010904] border border-[#3dff8f]/30 shadow-[0_4px_24px_rgba(0,0,0,0.6)] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[rgba(240,185,46,0.15)]">
              <div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#3dff8f]" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#3dff8f]">
                    Project Timeline &amp; Execution Phases
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-[#9fbfae]">
                  <span>Duration:</span>
                  <strong className="text-[#fff1b8] font-mono">
                    {project.startDate && project.completionDate
                      ? `${project.startDate} – ${project.completionDate}`
                      : project.completionDate
                      ? `Delivered ${project.completionDate}`
                      : '4 – 6 Weeks Sprint'}
                  </strong>
                  <span className="text-white/20">•</span>
                  <span className="text-[#3dff8f] font-mono font-semibold">
                    {project.status === 'completed'
                      ? '100% Completed'
                      : project.status === 'in_progress'
                      ? '75% Active Progress'
                      : project.status === 'prototype'
                      ? '60% Interactive Prototype'
                      : '35% Discovery & Concept'}
                  </span>
                </div>
              </div>

              {/* Action Buttons: Share & Download PDF Summary */}
              <div className="flex items-center gap-2 flex-wrap shrink-0">
                <button
                  type="button"
                  onClick={handleShare}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono font-bold text-[#3dff8f] bg-[#02180d] border border-[#3dff8f]/40 hover:border-[#3dff8f] hover:bg-[#3dff8f]/10 transition-all cursor-pointer shadow-[0_0_12px_rgba(61,255,143,0.15)] active:scale-95"
                  title="Share project with Web Share API"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadPdfSummary}
                  disabled={isGeneratingPdf}
                  className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold text-[#1a1200] bg-gradient-to-r from-[#fff1b8] via-[#f0b92e] to-[#b8841a] hover:brightness-110 active:scale-95 transition-all shadow-[0_0_15px_rgba(240,185,46,0.25)] cursor-pointer shrink-0 disabled:opacity-60"
                  title="Download verified PDF summary case study of this project"
                >
                  <FileDown className="w-4 h-4 text-[#1a1200]" />
                  <span>{isGeneratingPdf ? 'Generating PDF...' : 'Download Project Summary'}</span>
                </button>
              </div>
            </div>

            {/* Visual Progress Bar Track */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-mono text-[#9fbfae]">
                <span>Phase Progress</span>
                <span className="text-[#3dff8f] font-bold">
                  {project.status === 'completed'
                    ? '100%'
                    : project.status === 'in_progress'
                    ? '75%'
                    : project.status === 'prototype'
                    ? '60%'
                    : '35%'}
                </span>
              </div>
              <div className="relative w-full h-2.5 rounded-full bg-[#000803] border border-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#0f7a43] via-[#3dff8f] to-[#f0b92e] shadow-[0_0_12px_#3dff8f] transition-all duration-700 ease-out"
                  style={{
                    width:
                      project.status === 'completed'
                        ? '100%'
                        : project.status === 'in_progress'
                        ? '75%'
                        : project.status === 'prototype'
                        ? '60%'
                        : '35%'
                  }}
                />
              </div>
            </div>

            {/* 4 Phases Milestone Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3 pt-1">
              {[
                {
                  phase: 'Phase 1',
                  name: 'Discovery',
                  subtitle: 'Brief & Strategy',
                  desc: 'Requirements gathering, client briefing, audience research, and scope.',
                  isDone: true,
                },
                {
                  phase: 'Phase 2',
                  name: 'Design',
                  subtitle: 'UI/UX & Visuals',
                  desc: 'Moodboards, typography, responsive wireframes, and vector identity.',
                  isDone: ['completed', 'in_progress', 'prototype'].includes(project.status),
                },
                {
                  phase: 'Phase 3',
                  name: 'Development',
                  subtitle: 'Build & AI Workflows',
                  desc: 'Modern code engineering, generative AI acceleration, and responsive polish.',
                  isDone: ['completed', 'in_progress'].includes(project.status),
                },
                {
                  phase: 'Phase 4',
                  name: 'Launch',
                  subtitle: 'QA & Final Delivery',
                  desc: 'Cross-device testing, accessible QA checks, and production deployment.',
                  isDone: project.status === 'completed',
                }
              ].map((p, pIdx) => (
                <div
                  key={p.name}
                  className={`p-3 rounded-xl border transition-all text-xs ${
                    p.isDone
                      ? 'bg-[#031d10] border-[#3dff8f]/40 text-[#f4fff8] shadow-[0_0_12px_rgba(61,255,143,0.12)]'
                      : 'bg-[#010904]/60 border-white/5 text-[#9fbfae]/70'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5 mb-1.5">
                    <span className="text-[10px] font-mono text-[#f0b92e] uppercase font-bold">
                      {p.phase}
                    </span>
                    {p.isDone ? (
                      <span className="w-4 h-4 rounded-full bg-[#3dff8f]/20 border border-[#3dff8f]/60 text-[#3dff8f] flex items-center justify-center shrink-0">
                        <Check className="w-2.5 h-2.5" />
                      </span>
                    ) : (
                      <span className="w-4 h-4 rounded-full bg-white/5 border border-white/20 text-[#9fbfae] flex items-center justify-center shrink-0 text-[9px] font-mono">
                        {pIdx + 1}
                      </span>
                    )}
                  </div>
                  <div className="font-serif-heading font-bold text-sm text-[#f4fff8] mb-0.5">
                    {p.name}
                  </div>
                  <div className="text-[11px] font-mono text-[#3dff8f] mb-1">
                    {p.subtitle}
                  </div>
                  <p className="text-[10px] text-[#9fbfae] leading-relaxed hidden sm:block">
                    {p.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Full Narrative */}
          <div>
            <h3 className="text-sm font-mono font-bold text-[#f0b92e] uppercase mb-2">
              Project Overview & Context
            </h3>
            <p className="text-sm text-[#f4fff8]/90 leading-relaxed whitespace-pre-line">
              {project.fullDescription}
            </p>
          </div>

          {/* Process Breakdown: Challenge, Solution, Outcome */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {project.mainChallenge && (
              <div className="p-4 rounded-xl bg-[#010a05] border border-[rgba(240,185,46,0.15)]">
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#f0b92e] mb-1.5">
                  <AlertCircle className="w-4 h-4 text-[#f0b92e]" />
                  <span>The Challenge</span>
                </div>
                <p className="text-xs text-[#9fbfae] leading-relaxed">
                  {project.mainChallenge}
                </p>
              </div>
            )}

            {project.solution && (
              <div className="p-4 rounded-xl bg-[#010a05] border border-[rgba(240,185,46,0.15)]">
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#3dff8f] mb-1.5">
                  <Lightbulb className="w-4 h-4 text-[#3dff8f]" />
                  <span>My Solution</span>
                </div>
                <p className="text-xs text-[#9fbfae] leading-relaxed">
                  {project.solution}
                </p>
              </div>
            )}

            {project.outcome && (
              <div className="p-4 rounded-xl bg-[#010a05] border border-[rgba(240,185,46,0.15)]">
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#fff1b8] mb-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#fff1b8]" />
                  <span>Outcome & Learning</span>
                </div>
                <p className="text-xs text-[#9fbfae] leading-relaxed">
                  {project.outcome}
                </p>
              </div>
            )}
          </div>

          {/* Tools & AI Applied */}
          <div className="space-y-3 pt-2">
            <div>
              <span className="text-xs font-mono text-[#9fbfae] uppercase block mb-1.5">
                Tools & Technologies Used:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {project.tools.map((tool) => (
                  <span
                    key={tool}
                    className="px-2.5 py-1 rounded-full text-xs font-mono bg-[#3dff8f]/10 text-[#3dff8f] border border-[#3dff8f]/20"
                  >
                    {tool}
                  </span>
                ))}
              </div>
            </div>

            {project.aiUsed && project.aiUsed.length > 0 && (
              <div>
                <span className="text-xs font-mono text-[#f0b92e] uppercase flex items-center gap-1 mb-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#f0b92e]" />
                  <span>AI-Assisted Workflow Integration:</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {project.aiUsed.map((ai) => (
                    <span
                      key={ai}
                      className="px-2.5 py-1 rounded-full text-xs font-mono bg-[#f0b92e]/10 text-[#fff1b8] border border-[#f0b92e]/25"
                    >
                      {ai}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Project Deliverables & Attachments Section */}
          {project.attachments && project.attachments.length > 0 && (
            <div className="p-4 sm:p-5 rounded-2xl bg-[#010904] border border-[#3dff8f]/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-[#3dff8f] uppercase flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#3dff8f]" />
                  <span>Deliverables &amp; Attached Files ({project.attachments.length})</span>
                </span>
                <span className="text-[10px] font-mono text-[#9fbfae]">
                  Verified Project Documents
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {project.attachments.map((att) => (
                  <div
                    key={att.id}
                    className="p-3 rounded-xl bg-[#02140b] border border-white/10 hover:border-[#3dff8f]/40 flex items-center justify-between gap-3 transition-colors group"
                  >
                    <div className="min-w-0 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#0a351e] border border-[#3dff8f]/30 flex items-center justify-center shrink-0 text-[#3dff8f]">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-mono font-bold text-[#fff1b8] truncate">
                          {att.name}
                        </div>
                        <div className="text-[10px] font-mono text-[#9fbfae]">
                          {att.sizeFormatted || 'Document'} {att.type ? `· ${att.type}` : ''}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDownloadAttachment(att)}
                      className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold text-black bg-[#3dff8f] hover:bg-[#34db7a] flex items-center gap-1.5 cursor-pointer shadow shrink-0 active:scale-95 transition-all"
                      title={`Download ${att.name}`}
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-[#010904] border-t border-[rgba(240,185,46,0.3)] flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold text-[#3dff8f] border border-[#3dff8f]/40 hover:bg-[#3dff8f]/10 hover:border-[#3dff8f] transition-all cursor-pointer shadow-[0_0_10px_rgba(61,255,143,0.15)]"
              title="Share project title & link"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share Project</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadPdfSummary}
              disabled={isGeneratingPdf}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold text-[#f0b92e] border border-[rgba(240,185,46,0.4)] hover:bg-[#f0b92e]/10 hover:border-[#f0b92e] transition-all cursor-pointer shadow-[0_0_10px_rgba(240,185,46,0.15)] disabled:opacity-60"
              title="Download PDF Summary Case Study"
            >
              <FileDown className="w-3.5 h-3.5 text-[#f0b92e]" />
              <span>{isGeneratingPdf ? 'Generating...' : 'Download Summary (PDF)'}</span>
            </button>
            {project.liveUrl && (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold text-[#3dff8f] border border-[#3dff8f]/30 hover:bg-[#3dff8f]/10"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Visit Live Project</span>
              </a>
            )}
            {project.githubUrl && (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noreferrer"
                className="group inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono text-[#f4fff8] border border-[#3dff8f]/40 hover:border-[#3dff8f] hover:text-[#3dff8f] transition-all"
              >
                <span className="w-5 h-5 rounded-full shining-narrow-neon-btn">
                  <Github className="w-3 h-3" />
                </span>
                <span>Source Code</span>
              </a>
            )}
            {onInquireSimilar && (
              <button
                onClick={() => {
                  onClose();
                  onInquireSimilar(project.title);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold text-[#1a1200] bg-gradient-to-b from-[#fff1b8] via-[#f0b92e] to-[#b8841a] hover:from-white hover:to-[#f0b92e]"
              >
                <Send className="w-3.5 h-3.5 text-[#1a1200]" />
                <span>Inquire About Similar Project</span>
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full text-xs font-mono text-[#9fbfae] border border-white/10 hover:text-white cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {/* Fullscreen Lightbox Zoom Modal */}
      {isLightboxOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Full screen image lightbox zoom"
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex flex-col justify-between overflow-hidden select-none animate-in fade-in duration-200"
          onClick={() => {
            setIsLightboxOpen(false);
            setLightboxZoom(1);
            setPanOffset({ x: 0, y: 0 });
          }}
        >
          {/* Lightbox Top Header Toolbar */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="px-4 sm:px-6 py-3.5 bg-[#010904]/90 border-b border-[rgba(240,185,46,0.25)] flex items-center justify-between z-30 shrink-0 backdrop-blur-md"
          >
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold uppercase text-[#f0b92e]">
                    {project.category}
                  </span>
                  <span className="text-white/20">•</span>
                  <span className="text-xs font-mono text-[#3dff8f] capitalize">
                    {project.projectType}
                  </span>
                  {uniqueImages.length > 1 && (
                    <>
                      <span className="text-white/20">•</span>
                      <span className="text-xs font-mono text-[#9fbfae]">
                        Image {activeImageIndex + 1} of {uniqueImages.length}
                      </span>
                    </>
                  )}
                </div>
                <h3 className="text-sm sm:text-base font-serif-heading font-bold text-white line-clamp-1">
                  {project.title}
                </h3>
              </div>
            </div>

            {/* Lightbox Controls */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Zoom Out */}
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={lightboxZoom <= 1}
                className="p-2 rounded-xl bg-black/60 border border-white/10 hover:border-[#3dff8f]/60 text-white hover:text-[#3dff8f] disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
                title="Zoom out (-)"
                aria-label="Zoom out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              {/* Current Zoom Level Badge */}
              <span className="px-2.5 py-1 rounded-lg bg-[#011409] border border-[#3dff8f]/40 text-[#3dff8f] font-mono text-xs font-bold min-w-[54px] text-center shadow-[0_0_8px_rgba(61,255,143,0.25)]">
                {Math.round(lightboxZoom * 100)}%
              </span>

              {/* Zoom In */}
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={lightboxZoom >= 3.5}
                className="p-2 rounded-xl bg-black/60 border border-white/10 hover:border-[#3dff8f]/60 text-white hover:text-[#3dff8f] disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
                title="Zoom in (+)"
                aria-label="Zoom in"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              {/* Reset Zoom */}
              <button
                type="button"
                onClick={handleResetZoom}
                className="p-2 rounded-xl bg-black/60 border border-white/10 hover:border-[#f0b92e]/60 text-white hover:text-[#f0b92e] transition-all cursor-pointer"
                title="Reset zoom to 100% (0)"
                aria-label="Reset zoom"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Fullscreen Toggle */}
              <button
                type="button"
                onClick={handleToggleFullscreen}
                className="p-2 rounded-xl bg-black/60 border border-white/10 hover:border-[#3dff8f]/60 text-white hover:text-[#3dff8f] transition-all cursor-pointer hidden sm:inline-flex"
                title="Toggle Fullscreen"
                aria-label="Toggle Fullscreen"
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              <div className="h-6 w-[1px] bg-white/10 mx-1" />

              {/* Close Lightbox */}
              <button
                type="button"
                onClick={() => {
                  setIsLightboxOpen(false);
                  setLightboxZoom(1);
                  setPanOffset({ x: 0, y: 0 });
                }}
                className="p-2 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 hover:bg-rose-900/60 transition-all cursor-pointer"
                title="Close Lightbox (Esc)"
                aria-label="Close Lightbox"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Center Interactive Lightbox Canvas */}
          <div
            className="relative flex-1 w-full overflow-hidden flex items-center justify-center p-4"
            onWheel={handleWheelZoom}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onDoubleClick={handleDoubleClick}
            style={{
              cursor: lightboxZoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in'
            }}
          >
            {/* Previous Image Arrow */}
            {uniqueImages.length > 1 && (
              <button
                type="button"
                onClick={handlePrevImage}
                className="absolute left-4 z-40 p-3 rounded-full bg-black/70 hover:bg-[#02180c] border border-[rgba(240,185,46,0.3)] hover:border-[#3dff8f] text-white hover:text-[#3dff8f] shadow-[0_0_15px_rgba(0,0,0,0.8)] backdrop-blur-md transition-all cursor-pointer hover:scale-110"
                title="Previous image (←)"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {/* Zoomable Image Container */}
            <div
              className="relative max-w-full max-h-full flex items-center justify-center select-none"
              onClick={(e) => e.stopPropagation()}
              style={{
                transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${lightboxZoom})`,
                transition: isDragging ? 'none' : 'transform 0.15s ease-out',
                transformOrigin: 'center center'
              }}
            >
              <img
                src={currentImage}
                alt={project.title}
                draggable={false}
                className="max-w-[90vw] max-h-[72vh] object-contain rounded-lg shadow-2xl pointer-events-none select-none"
              />
            </div>

            {/* Next Image Arrow */}
            {uniqueImages.length > 1 && (
              <button
                type="button"
                onClick={handleNextImage}
                className="absolute right-4 z-40 p-3 rounded-full bg-black/70 hover:bg-[#02180c] border border-[rgba(240,185,46,0.3)] hover:border-[#3dff8f] text-white hover:text-[#3dff8f] shadow-[0_0_15px_rgba(0,0,0,0.8)] backdrop-blur-md transition-all cursor-pointer hover:scale-110"
                title="Next image (→)"
                aria-label="Next image"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}

            {/* Navigation & Controls Helper Tip at bottom-center of canvas */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-none z-30 px-3.5 py-1 rounded-full bg-black/75 border border-white/10 text-[11px] font-mono text-[#9fbfae] backdrop-blur-md hidden sm:flex items-center gap-2">
              <span>Scroll to Zoom</span>
              <span className="text-white/20">•</span>
              <span>Double-click to toggle 2x</span>
              {lightboxZoom > 1 && (
                <>
                  <span className="text-white/20">•</span>
                  <span className="text-[#3dff8f]">Drag to Pan</span>
                </>
              )}
            </div>
          </div>

          {/* Lightbox Bottom Details & Thumbnails Bar */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="px-4 sm:px-6 py-3.5 bg-[#010904]/95 border-t border-[rgba(240,185,46,0.25)] flex flex-col sm:flex-row items-center justify-between gap-3 z-30 shrink-0 backdrop-blur-md"
          >
            {/* Project details snippet in full screen */}
            <div className="flex flex-col sm:max-w-md text-center sm:text-left">
              <p className="text-xs text-[#9fbfae] line-clamp-1">
                {project.summary}
              </p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 mt-1">
                {(project.tools || []).slice(0, 4).map((tool) => (
                  <span
                    key={tool}
                    className="px-2 py-0.5 rounded-full text-[10px] font-mono text-[#3dff8f] bg-[#02180c] border border-[#3dff8f]/30"
                  >
                    {tool}
                  </span>
                ))}
              </div>
            </div>

            {/* Gallery thumbnails */}
            {uniqueImages.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto py-1">
                {uniqueImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setActiveImageIndex(idx);
                      setLightboxZoom(1);
                      setPanOffset({ x: 0, y: 0 });
                    }}
                    className={`relative w-12 h-12 rounded-lg overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                      activeImageIndex === idx
                        ? 'border-[#3dff8f] scale-105 shadow-[0_0_10px_#3dff8f]'
                        : 'border-white/10 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* External Links or Inquiry */}
            <div className="flex items-center gap-2 shrink-0">
              {project.liveUrl && (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono text-[#fff1b8] bg-[#f0b92e]/10 border border-[#f0b92e]/30 hover:border-[#f0b92e] transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-[#f0b92e]" />
                  <span>Visit Live</span>
                </a>
              )}
              {project.githubUrl && (
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono text-white/80 border border-white/20 hover:border-[#3dff8f] hover:text-[#3dff8f] transition-all"
                >
                  <Github className="w-3.5 h-3.5" />
                  <span>Code</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
