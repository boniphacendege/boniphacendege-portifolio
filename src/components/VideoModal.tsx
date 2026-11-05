/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Video Modal Player
 * High-definition interactive player supporting:
 * - 16:9 (Widescreen) and 1:1 (Square Feed) aspect ratios with on-the-fly ratio toggling
 * - YouTube, Vimeo, and HTML5 video playback
 * - Chapters & Timestamps navigation
 * - Speed controls, like counter, share with toast, transcript tab, and related videos
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Share2,
  Heart,
  Clock,
  Sparkles,
  Layers,
  Check,
  ChevronRight,
  ExternalLink,
  Download,
  Sliders,
  Tv,
  Film
} from 'lucide-react';
import { VideoItem, VideoRatio } from '../data/portfolioStorage';
import { getMediaBlobUrl } from '../utils/mediaStorage';
import { formatTextWithLinks } from '../utils/textLinkHelper';

interface VideoModalProps {
  video: VideoItem | null;
  isOpen: boolean;
  onClose: () => void;
  onLikeVideo: (videoId: string) => void;
  allVideos: VideoItem[];
  onSelectVideo: (video: VideoItem) => void;
}

export const VideoModal: React.FC<VideoModalProps> = ({
  video,
  isOpen,
  onClose,
  onLikeVideo,
  allVideos,
  onSelectVideo
}) => {
  const [activeRatio, setActiveRatio] = useState<VideoRatio>('16:9');
  const [hasLiked, setHasLiked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'chapters' | 'transcript' | 'related'>('chapters');
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [resolvedVideoUrl, setResolvedVideoUrl] = useState<string>(video?.videoUrl || '');
  const [videoToast, setVideoToast] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const showToast = (msg: string) => {
    setVideoToast(msg);
    setTimeout(() => setVideoToast(null), 3200);
  };

  useEffect(() => {
    let isMounted = true;
    if (isOpen && video) {
      setActiveRatio(video.ratio || '16:9');
      setHasLiked(false);
      setIsPlaying(true);
      setResolvedVideoUrl(video.videoUrl || '');

      // Check if this video has a locally stored blob in IndexedDB
      getMediaBlobUrl(video.id).then((blobUrl) => {
        if (isMounted && blobUrl) {
          setResolvedVideoUrl(blobUrl);
        }
      });

      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      isMounted = false;
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, video]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === ' ') {
        e.preventDefault();
        togglePlay();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isPlaying]);

  if (!isOpen || !video) return null;

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    } else {
      setIsPlaying((prev) => !prev);
    }
  };

  const handleLike = () => {
    if (!hasLiked) {
      onLikeVideo(video.id);
      setHasLiked(true);
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/#video`;
    const text = `Watch "${video.title}" by ${video.author.name}!\n${url}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const changeSpeed = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  const handleSeekChapter = (chapter: { time: string; title: string }) => {
    if (videoRef.current && chapter.time) {
      const parts = chapter.time.split(':').map(Number);
      let seconds = 0;
      if (parts.length === 2) {
        seconds = parts[0] * 60 + parts[1];
      } else if (parts.length === 3) {
        seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
      }
      videoRef.current.currentTime = seconds;
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
      showToast(`Jumped to "${chapter.title}" (${chapter.time})`);
    } else {
      showToast(`Chapter marker: "${chapter.title}" (${chapter.time})`);
    }
  };

  const handleDownloadVideo = async () => {
    if (!video) return;
    const targetUrl = video.downloadUrl || currentVideoUrl;
    if (!targetUrl) {
      showToast('No downloadable stream available for this video.');
      return;
    }
    showToast(`Downloading "${video.title}"...`);
    try {
      const res = await fetch(targetUrl);
      if (res.ok) {
        const blob = await res.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = `${video.slug || 'video'}.mp4`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => window.URL.revokeObjectURL(blobUrl), 10000);
        showToast(`Downloaded "${video.title}" successfully!`);
        return;
      }
    } catch (err) {
      console.warn('Direct blob fetch notice:', err);
    }
    const a = document.createElement('a');
    a.href = targetUrl;
    a.download = `${video.slug || 'video'}.mp4`;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast(`Download started for "${video.title}"!`);
  };

  // Convert YouTube watch URL to embed URL if needed
  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    if (url.includes('youtube.com/embed/')) return url;
    const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    if (ytMatch && ytMatch[1]) {
      return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0&modestbranding=1`;
    }
    if (url.includes('vimeo.com/')) {
      const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
      if (vimeoMatch && vimeoMatch[1]) {
        return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
      }
    }
    return url;
  };

  const currentVideoUrl = resolvedVideoUrl || video.videoUrl || '';
  const isEmbeddable = currentVideoUrl.includes('youtube.com') || currentVideoUrl.includes('youtu.be') || currentVideoUrl.includes('vimeo.com') || Boolean(video.embedUrl);
  const isDirectVideo =
    Boolean(currentVideoUrl) && (
      currentVideoUrl.startsWith('blob:') ||
      currentVideoUrl.startsWith('data:video') ||
      currentVideoUrl.includes('firebasestorage.googleapis.com') ||
      currentVideoUrl.includes('storage.googleapis.com') ||
      currentVideoUrl.endsWith('.mp4') ||
      currentVideoUrl.endsWith('.webm') ||
      currentVideoUrl.endsWith('.mov') ||
      currentVideoUrl.endsWith('.ogg') ||
      currentVideoUrl.includes('.mp4?') ||
      currentVideoUrl.includes('.webm?') ||
      currentVideoUrl.includes('.mov?') ||
      (!isEmbeddable && (currentVideoUrl.startsWith('http') || currentVideoUrl.startsWith('/')))
    );

  const embedSrc = video.embedUrl || getEmbedUrl(currentVideoUrl);

  const relatedVideos = allVideos
    .filter((v) => v.id !== video.id && v.published !== false)
    .slice(0, 4);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="video-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/92 backdrop-blur-xl animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl bg-gradient-to-b from-[#02180d] via-[#010e06] to-[#010804] card-neon-shallow rounded-3xl text-[#f4fff8] relative overflow-hidden flex flex-col max-h-[94vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Shining Emerald Line */}
        <div aria-hidden="true" className="header-neon-line top-0" />

        {/* Floating Toast Notification */}
        {videoToast && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-[#0a351e] border border-[#3dff8f] text-[#3dff8f] font-mono text-xs shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <Sparkles className="w-3.5 h-3.5 text-[#f0b92e]" />
            <span>{videoToast}</span>
          </div>
        )}

        {/* Modal Header Bar */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-white/10 flex items-center justify-between gap-3 bg-[#01140a]/90 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#02180d] border border-[#3dff8f]/40 text-[#3dff8f] flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(61,255,143,0.25)]">
              <Film className="w-4 h-4 text-[#3dff8f]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#3dff8f] font-bold px-2 py-0.5 rounded bg-[#3dff8f]/10 border border-[#3dff8f]/30">
                  {video.category}
                </span>
                <span className="text-[10px] font-mono text-[#f0b92e] font-bold px-2 py-0.5 rounded bg-[#f0b92e]/10 border border-[#f0b92e]/30">
                  {video.resolution || '4K UHD'}
                </span>
                <span className="text-[10px] font-mono text-[#9fbfae]">
                  {video.duration}
                </span>
              </div>
              <h2 id="video-modal-title" className="text-xs sm:text-sm font-bold font-serif-heading text-[#fff1b8] truncate">
                {video.title}
              </h2>
            </div>
          </div>

          {/* Right Header Toolbar: Ratio Switcher & Close */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Aspect Ratio Switcher (16:9 vs 1:1) */}
            <div className="flex items-center bg-[#010c06] border border-white/10 rounded-xl p-0.5 text-xs font-mono">
              <button
                onClick={() => setActiveRatio('16:9')}
                className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeRatio === '16:9'
                    ? 'bg-[#3dff8f] text-black font-bold shadow-[0_0_10px_rgba(61,255,143,0.4)]'
                    : 'text-[#9fbfae] hover:text-white'
                }`}
                title="16:9 Widescreen Ratio"
              >
                <Tv className="w-3.5 h-3.5" />
                <span>16:9</span>
              </button>
              <button
                onClick={() => setActiveRatio('1:1')}
                className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeRatio === '1:1'
                    ? 'bg-[#3dff8f] text-black font-bold shadow-[0_0_10px_rgba(61,255,143,0.4)]'
                    : 'text-[#9fbfae] hover:text-white'
                }`}
                title="1:1 Square Feed Ratio"
              >
                <span className="w-3.5 h-3.5 border border-current rounded-sm inline-block" />
                <span>1:1</span>
              </button>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 border border-white/10 hover:border-red-500/50 text-[#9fbfae] hover:text-white transition-all cursor-pointer"
              aria-label="Close video player"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Video Player Display Area with Dynamic 16:9 vs 1:1 Frame */}
        <div className="bg-black/90 p-3 sm:p-6 flex items-center justify-center shrink-0 border-b border-white/10 relative overflow-hidden">
          {/* Ambient Lighting Backdrop */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#02180d] to-transparent opacity-60 pointer-events-none" />

          {/* Dynamic Ratio Container */}
          <div
            className={`relative rounded-2xl overflow-hidden border-2 border-[#3dff8f]/40 shadow-[0_0_40px_rgba(61,255,143,0.25)] bg-black transition-all duration-300 w-full ${
              activeRatio === '16:9'
                ? 'aspect-video max-w-4xl max-h-[50vh] sm:max-h-[58vh]'
                : 'aspect-square max-w-[360px] sm:max-w-[440px] max-h-[50vh] sm:max-h-[55vh]'
            }`}
          >
            {isDirectVideo ? (
              <video
                ref={videoRef}
                src={currentVideoUrl}
                poster={video.thumbnailUrl}
                controls
                autoPlay
                playsInline
                className="w-full h-full object-contain bg-black"
              />
            ) : isEmbeddable ? (
              <iframe
                src={embedSrc}
                title={video.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="w-full h-full border-0 bg-black"
              />
            ) : (
              /* High-Fidelity Motion Showcase Simulation */
              <div className="w-full h-full relative group flex items-center justify-center bg-[#011007]">
                <img
                  src={video.thumbnailUrl}
                  alt={video.title}
                  className="w-full h-full object-cover opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent flex flex-col items-center justify-center p-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-[#3dff8f] text-black flex items-center justify-center shadow-[0_0_30px_rgba(61,255,143,0.6)] animate-pulse mb-3">
                    <Play className="w-8 h-8 fill-black translate-x-0.5" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold font-serif-heading text-[#fff1b8]">
                    {video.title}
                  </h3>
                  <p className="text-xs text-[#3dff8f] font-mono mt-1">
                    Playing in {activeRatio === '16:9' ? '16:9 Widescreen Cinema' : '1:1 Square Feed'} Mode
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Details & Interactive Features (Scrollable) */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {/* Action Row & Video Title */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-[#9fbfae] mb-1">
                <span>By {video.author.name}</span>
                <span>•</span>
                <span>{new Date(video.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                <span>•</span>
                <span>{video.viewsCount || 2400} views</span>
              </div>
              <h3 className="text-lg sm:text-2xl font-bold font-serif-heading text-[#f4fff8]">
                {video.title}
              </h3>
              {video.subtitle && (
                <p className="text-xs sm:text-sm text-[#3dff8f] font-medium mt-0.5">
                  {video.subtitle}
                </p>
              )}
            </div>

            {/* Quick Actions: Like, Share, Speed */}
            <div className="flex items-center gap-2 flex-wrap shrink-0">
              {/* Like Button */}
              <button
                onClick={handleLike}
                className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                  hasLiked
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.3)]'
                    : 'bg-white/5 text-[#f4fff8] border-white/10 hover:border-[#3dff8f]/40 hover:text-[#3dff8f]'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${hasLiked ? 'fill-rose-400 text-rose-400' : ''}`} />
                <span>{(video.likesCount || 0) + (hasLiked ? 1 : 0)}</span>
              </button>

              {/* Share Button */}
              <button
                onClick={handleShare}
                className="px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-[#3dff8f]/40 text-xs font-mono text-[#f4fff8] hover:text-[#3dff8f] transition-all cursor-pointer flex items-center gap-1.5"
                title="Share video link"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[#3dff8f]" /> : <Share2 className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Share'}</span>
              </button>

              {/* Speed Selector */}
              <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-[#9fbfae]">
                <Sliders className="w-3 h-3 text-[#3dff8f]" />
                <select
                  value={playbackSpeed}
                  onChange={(e) => changeSpeed(Number(e.target.value))}
                  className="bg-transparent text-[#f4fff8] font-bold focus:outline-none cursor-pointer text-xs"
                >
                  <option value={0.75} className="bg-[#010c06] text-white">0.75x</option>
                  <option value={1} className="bg-[#010c06] text-white">1.0x Normal</option>
                  <option value={1.25} className="bg-[#010c06] text-white">1.25x</option>
                  <option value={1.5} className="bg-[#010c06] text-white">1.5x</option>
                  <option value={2} className="bg-[#010c06] text-white">2.0x</option>
                </select>
              </div>

              {/* Download Video Button */}
              <button
                onClick={handleDownloadVideo}
                className="px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-[#3dff8f]/40 text-xs font-mono text-[#f4fff8] hover:text-[#3dff8f] transition-all cursor-pointer flex items-center gap-1.5"
                title="Download video file or stream"
              >
                <Download className="w-3.5 h-3.5 text-[#3dff8f]" />
                <span className="hidden sm:inline">Download Video</span>
              </button>

              {/* External source button if link exists */}
              {video.videoUrl && (
                <a
                  href={video.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-white/5 border border-white/10 hover:border-[#3dff8f]/40 text-[#9fbfae] hover:text-[#3dff8f] transition-all"
                  title="Open on YouTube / External Player"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>

          {/* Description with auto-linking and optional direct link */}
          <div className="p-4 rounded-2xl bg-[#010f07] border border-white/5 space-y-2.5">
            <div className="text-xs sm:text-sm text-[#c8e2d4] leading-relaxed whitespace-pre-line">
              {formatTextWithLinks(video.description)}
            </div>
            {video.linkUrl && (
              <div className="pt-2 border-t border-white/5 flex items-center gap-2">
                <span className="text-[11px] font-mono text-[#9fbfae]">Related Link:</span>
                <a
                  href={video.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold text-[#3dff8f] bg-[#02180d] border border-[#3dff8f]/40 hover:border-[#3dff8f] hover:bg-[#3dff8f]/10 shadow-[0_0_10px_rgba(61,255,143,0.15)] transition-all"
                >
                  <span>{video.linkTitle || 'Open External Resource'}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>

          {/* Tabs: Chapters / Transcript / Related */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b border-white/10 pb-2">
              <button
                onClick={() => setActiveTab('chapters')}
                className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                  activeTab === 'chapters'
                    ? 'bg-[#3dff8f] text-black shadow-sm'
                    : 'text-[#9fbfae] hover:text-white'
                }`}
              >
                Chapters ({video.chapters?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('transcript')}
                className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                  activeTab === 'transcript'
                    ? 'bg-[#3dff8f] text-black shadow-sm'
                    : 'text-[#9fbfae] hover:text-white'
                }`}
              >
                Transcript &amp; Notes
              </button>
              <button
                onClick={() => setActiveTab('related')}
                className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                  activeTab === 'related'
                    ? 'bg-[#3dff8f] text-black shadow-sm'
                    : 'text-[#9fbfae] hover:text-white'
                }`}
              >
                More Videos ({relatedVideos.length})
              </button>
            </div>

            {/* TAB CONTENT: Chapters */}
            {activeTab === 'chapters' && (
              <div className="space-y-2">
                {video.chapters && video.chapters.length > 0 ? (
                  video.chapters.map((chap, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSeekChapter(chap)}
                      className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-[#3dff8f]/60 hover:bg-white/10 flex items-center justify-between text-xs transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-0.5 rounded-md bg-[#02180d] border border-[#3dff8f]/40 text-[#3dff8f] font-mono font-bold text-[11px]">
                          {chap.time}
                        </span>
                        <span className="font-semibold text-[#f4fff8]">{chap.title}</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-[#9fbfae]" />
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-[#9fbfae] font-mono">No chapter markers configured for this video.</p>
                )}
              </div>
            )}

            {/* TAB CONTENT: Transcript */}
            {activeTab === 'transcript' && (
              <div className="p-4 rounded-xl bg-[#010a05] border border-white/10 text-xs sm:text-sm text-[#9fbfae] leading-relaxed max-h-[160px] overflow-y-auto font-mono">
                {video.transcript || 'Full transcript will be automatically generated upon complete video broadcast.'}
              </div>
            )}

            {/* TAB CONTENT: Related Videos */}
            {activeTab === 'related' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
                {relatedVideos.map((rv) => (
                  <div
                    key={rv.id}
                    onClick={() => onSelectVideo(rv)}
                    className="p-2 rounded-xl bg-white/5 border border-white/10 hover:border-[#3dff8f]/50 transition-all cursor-pointer group"
                  >
                    <div className="relative aspect-video rounded-lg overflow-hidden mb-2 bg-black">
                      <img
                        src={rv.thumbnailUrl}
                        alt={rv.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <span className="absolute bottom-1 right-1 px-1.5 py-0.2 rounded bg-black/80 text-[9px] font-mono text-[#3dff8f]">
                        {rv.ratio}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-[#f4fff8] group-hover:text-[#3dff8f] line-clamp-1 block">
                      {rv.title}
                    </span>
                    <span className="text-[10px] text-[#9fbfae] font-mono block">
                      {rv.duration} • {rv.category}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tags */}
          {video.tags && video.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-white/10">
              <span className="text-[10px] font-mono text-[#9fbfae] mr-1">Tags:</span>
              {video.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-md bg-[#02180d] border border-[#3dff8f]/20 text-[10px] font-mono text-[#3dff8f]"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
