/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Videos Management Tab for Admin Dashboard
 * Full control for Ev Dr. Boniphace J. Ndege:
 * - 16:9 Widescreen & 1:1 Square Feed Video Ratio control
 * - Video URL (YouTube, Vimeo, MP4) + Video File Upload + Thumbnail Upload
 * - Chapters & Timestamps manager
 * - Category/Topic management
 */

import React, { useState, useRef } from 'react';
import {
  Video as VideoIcon,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Upload,
  Play,
  Clock,
  Sparkles,
  ExternalLink,
  Film,
  Eye,
  Heart,
  ListPlus,
  Camera,
  Loader2,
  CheckCircle2,
  FileVideo,
  Image as ImageIcon,
  Download
} from 'lucide-react';
import {
  PortfolioDatabase,
  VideoItem,
  VideoRatio,
  VideoChapter,
  portfolioStorage
} from '../../data/portfolioStorage';
import { uploadMediaWithFallback } from '../../utils/mediaStorage';
import { AdminImagePreviewModal, ImagePreviewData } from './AdminImagePreviewModal';

interface VideosTabProps {
  data: PortfolioDatabase;
  onSave: (msg: string) => void;
  onRefresh: () => void;
}

export const VideosTab: React.FC<VideosTabProps> = ({ data, onSave, onRefresh }) => {
  const [videos, setVideos] = useState<VideoItem[]>(() => data.videos || []);
  const [categories, setCategories] = useState<string[]>(() => data.videoCategories || [
    'Brand Identity',
    'Web Architecture',
    'AI Collaboration',
    'Author Keynotes',
    'Social Reels'
  ]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [previewModal, setPreviewModal] = useState<ImagePreviewData | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<VideoItem>>({
    title: '',
    description: '',
    ratio: '16:9',
    category: 'Brand Identity',
    thumbnailUrl: '',
    videoUrl: '',
    duration: '05:30',
    resolution: '4K Ultra HD',
    featured: false,
    author: {
      name: 'Ev Dr. Boniphace J. Ndege',
      role: 'Creative Director & Author',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
    },
    chapters: [],
    tags: [],
    linkUrl: '',
    linkTitle: ''
  });

  const [tagInput, setTagInput] = useState('');
  const [chapterTime, setChapterTime] = useState('');
  const [chapterTitle, setChapterTitle] = useState('');

  // Video & Image Upload States
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [videoUploadStatus, setVideoUploadStatus] = useState<string>('');
  const [videoFileName, setVideoFileName] = useState<string | null>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [coverFileName, setCoverFileName] = useState<string | null>(null);
  const [videoUploadTab, setVideoUploadTab] = useState<'upload' | 'url'>('upload');
  const [quickUploadingVideoId, setQuickUploadingVideoId] = useState<string | null>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);

  // Per-card chapter input state: videoId -> { time: string, title: string }
  const [cardChapterInputs, setCardChapterInputs] = useState<Record<string, { time: string; title: string }>>({});

  const handleCardTimeChange = (videoId: string, time: string) => {
    setCardChapterInputs((prev) => ({
      ...prev,
      [videoId]: {
        time,
        title: prev[videoId]?.title ?? ''
      }
    }));
  };

  const handleCardTitleChange = (videoId: string, title: string) => {
    setCardChapterInputs((prev) => ({
      ...prev,
      [videoId]: {
        time: prev[videoId]?.time ?? '',
        title
      }
    }));
  };

  const handleAddChapterToCard = (videoId: string) => {
    const input = cardChapterInputs[videoId];
    const time = input?.time?.trim() || '02:30';
    const title = input?.title?.trim();

    if (!title) {
      alert('Please enter a chapter title');
      return;
    }

    const updated = videos.map((v) => {
      if (v.id === videoId) {
        const existing = v.chapters || [];
        return {
          ...v,
          chapters: [...existing, { time, title }]
        };
      }
      return v;
    });

    setVideos(updated);
    portfolioStorage.updateData((prev) => ({
      ...prev,
      videos: updated
    }));

    setCardChapterInputs((prev) => ({
      ...prev,
      [videoId]: { time: '', title: '' }
    }));

    onSave(`Chapter "${title}" added to card!`);
    onRefresh();
  };

  const handleRemoveChapterFromCard = (videoId: string, index: number) => {
    const updated = videos.map((v) => {
      if (v.id === videoId) {
        return {
          ...v,
          chapters: (v.chapters || []).filter((_, i) => i !== index)
        };
      }
      return v;
    });

    setVideos(updated);
    portfolioStorage.updateData((prev) => ({
      ...prev,
      videos: updated
    }));

    onSave('Chapter removed from card');
    onRefresh();
  };

  const handleStartCreate = () => {
    setEditingId(null);
    setIsCreating(true);
    setFormData({
      id: `vid-${Date.now()}`,
      slug: `video-${Date.now()}`,
      title: '',
      description: '',
      ratio: '16:9',
      category: categories[0] || 'Brand Identity',
      thumbnailUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      duration: '06:45',
      publishedAt: new Date().toISOString(),
      viewsCount: 0,
      likesCount: 0,
      resolution: '4K Ultra HD',
      featured: false,
      published: true,
      order: 0,
      author: {
        name: 'Ev Dr. Boniphace J. Ndege',
        role: 'Creative Director & Author',
        avatar: data.profile.profilePhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
      },
      chapters: [
        { time: '00:00', title: 'Opening & Vision' },
        { time: '02:15', title: 'Execution Breakdown' },
        { time: '05:00', title: 'Summary & Key Takeaway' }
      ],
      tags: ['Video Production', '4K', 'Boniphace Ndege'],
      linkUrl: '',
      linkTitle: ''
    });
    setTagInput('');
  };

  const handleStartEdit = (video: VideoItem) => {
    setIsCreating(false);
    setEditingId(video.id);
    setFormData({ ...video });
    setTagInput((video.tags || []).join(', '));
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingId(null);
    setVideoFileName(null);
    setCoverFileName(null);
    setVideoUploadStatus('');
  };

  // Real Video File Upload Handler
  const handleVideoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate video type
    const validVideoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-m4v', 'video/x-msvideo'];
    const isVideo = file.type.startsWith('video/') || validVideoTypes.includes(file.type.toLowerCase()) || file.name.match(/\.(mp4|webm|mov|ogg|m4v)$/i);
    if (!isVideo) {
      alert('Please select a valid video file (.mp4, .webm, .mov, or .ogg)');
      return;
    }

    setVideoFileName(file.name);
    setIsUploadingVideo(true);
    setVideoUploadStatus('Analyzing video stream & metadata...');

    try {
      // 1. Auto-extract duration, aspect ratio, and resolution from the real video file
      const tempVideo = document.createElement('video');
      tempVideo.preload = 'metadata';
      const objUrl = URL.createObjectURL(file);
      tempVideo.src = objUrl;

      tempVideo.onloadedmetadata = () => {
        const dur = tempVideo.duration;
        if (dur && !isNaN(dur) && dur > 0) {
          const mins = Math.floor(dur / 60);
          const secs = Math.floor(dur % 60);
          const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
          const isSquare = (tempVideo.videoWidth / (tempVideo.videoHeight || 1)) < 1.18;
          setFormData((prev) => ({
            ...prev,
            duration: formatted,
            resolution: tempVideo.videoWidth >= 3840 ? '4K Ultra HD' : tempVideo.videoWidth >= 1920 ? '1080p 60fps' : tempVideo.videoWidth >= 1280 ? '2K QHD' : 'Full HD',
            ratio: isSquare ? '1:1' : '16:9'
          }));
        }
      };

      const mediaId = formData.id || `vid-${Date.now()}`;
      const cloudPath = `portfolio/videos/${Date.now()}_${encodeURIComponent(file.name)}`;

      const result = await uploadMediaWithFallback(
        file,
        cloudPath,
        mediaId,
        (status) => setVideoUploadStatus(status)
      );

      setFormData((prev) => ({
        ...prev,
        id: prev.id || mediaId,
        videoUrl: result.url,
        title: prev.title?.trim() ? prev.title : file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')
      }));

      onSave(`Video file (${file.name}) uploaded & ready! ${result.isCloud ? 'Stored in Cloud.' : 'Saved in local media storage.'}`);
    } catch (err: any) {
      console.error('Error uploading video:', err);
      alert(`Could not upload video file: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsUploadingVideo(false);
      setVideoUploadStatus('');
    }
  };

  // Real Thumbnail Image Upload Handler
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCoverFileName(file.name);
    // 0ms instant preview
    const instantUrl = URL.createObjectURL(file);
    setFormData((prev) => ({ ...prev, thumbnailUrl: instantUrl }));
    setIsUploadingCover(true);

    try {
      const mediaId = `${formData.id || `vid-${Date.now()}`}_thumb`;
      const cloudPath = `portfolio/videos/thumbs/${Date.now()}_${encodeURIComponent(file.name)}`;

      const result = await uploadMediaWithFallback(
        file,
        cloudPath,
        mediaId
      );

      setFormData((prev) => ({
        ...prev,
        thumbnailUrl: result.url
      }));

      onSave(`Video cover image (${file.name}) uploaded successfully!`);
    } catch (err: any) {
      console.error('Error uploading cover:', err);
      const reader = new FileReader();
      reader.onload = () => {
        setFormData((prev) => ({ ...prev, thumbnailUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingCover(false);
    }
  };

  // Capture current video playback frame as thumbnail
  const handleCaptureVideoThumbnail = () => {
    if (!previewVideoRef.current) return;
    try {
      const vid = previewVideoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = vid.videoWidth || 640;
      canvas.height = vid.videoHeight || 360;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(vid, 0, 0, canvas.width, canvas.height);
        const frameDataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setFormData((prev) => ({ ...prev, thumbnailUrl: frameDataUrl }));
        onSave('Current video frame captured and set as thumbnail cover!');
      }
    } catch (err) {
      console.warn('Frame capture notice (CORS may restrict external video streams):', err);
    }
  };

  const handleAddChapter = () => {
    if (!chapterTime.trim() || !chapterTitle.trim()) return;
    const newChapter: VideoChapter = {
      time: chapterTime.trim(),
      title: chapterTitle.trim()
    };
    setFormData((prev) => ({
      ...prev,
      chapters: [...(prev.chapters || []), newChapter]
    }));
    setChapterTime('');
    setChapterTitle('');
  };

  const handleRemoveChapter = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      chapters: (prev.chapters || []).filter((_, i) => i !== index)
    }));
  };

  const handleSaveVideo = () => {
    if (!formData.title?.trim()) {
      alert('Please enter a video title');
      return;
    }

    const tagsArray = tagInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const videoToSave: VideoItem = {
      id: formData.id || `vid-${Date.now()}`,
      slug: formData.slug || `video-${Date.now()}`,
      title: formData.title.trim(),
      description: formData.description?.trim() || '',
      ratio: (formData.ratio as VideoRatio) || '16:9',
      category: formData.category || 'Brand Identity',
      thumbnailUrl: formData.thumbnailUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
      videoUrl: formData.videoUrl || '',
      duration: formData.duration || '05:00',
      publishedAt: formData.publishedAt || new Date().toISOString(),
      viewsCount: formData.viewsCount ?? 0,
      likesCount: formData.likesCount ?? 0,
      resolution: formData.resolution || '4K Ultra HD',
      featured: Boolean(formData.featured),
      published: true,
      order: formData.order ?? 0,
      author: formData.author || {
        name: 'Ev Dr. Boniphace J. Ndege',
        role: 'Creative Director & Author',
        avatar: ''
      },
      chapters: formData.chapters || [],
      tags: tagsArray.length > 0 ? tagsArray : ['Video Production'],
      linkUrl: formData.linkUrl?.trim() || undefined,
      linkTitle: formData.linkTitle?.trim() || undefined
    };

    let updatedVideos: VideoItem[];
    if (isCreating) {
      updatedVideos = [videoToSave, ...videos];
    } else {
      updatedVideos = videos.map((v) => (v.id === editingId ? videoToSave : v));
    }

    setVideos(updatedVideos);
    portfolioStorage.updateData((prev) => ({
      ...prev,
      videos: updatedVideos,
      videoCategories: categories
    }));

    setIsCreating(false);
    setEditingId(null);
    onSave(isCreating ? 'Video published successfully!' : 'Video changes saved!');
    onRefresh();
  };

  const handleDeleteVideo = (id: string) => {
    if (!window.confirm('Are you sure you want to delete this video?')) return;
    const updated = videos.filter((v) => v.id !== id);
    setVideos(updated);
    portfolioStorage.updateData((prev) => ({
      ...prev,
      videos: updated
    }));
    onSave('Video deleted');
    onRefresh();
  };

  // Quick cover / thumbnail upload directly from the card
  const handleQuickUploadVideoThumb = async (videoId: string, file: File) => {
    setQuickUploadingVideoId(videoId);
    try {
      const mediaId = `thumb_${videoId}_${Date.now()}`;
      const res = await uploadMediaWithFallback(
        file,
        `portfolio/videos/thumbs/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`,
        mediaId
      );
      const updated = videos.map((v) => (v.id === videoId ? { ...v, thumbnailUrl: res.url } : v));
      setVideos(updated);
      portfolioStorage.updateData((prev) => ({
        ...prev,
        videos: updated
      }));
      onSave('Video cover artwork updated successfully!');
      onRefresh();
    } catch (err: any) {
      alert('Error uploading video cover: ' + (err.message || 'Unknown error'));
    } finally {
      setQuickUploadingVideoId(null);
    }
  };

  // Direct video or poster download handler
  const handleDownloadVideo = async (video: VideoItem) => {
    const targetUrl = video.videoUrl || video.thumbnailUrl;
    if (!targetUrl) {
      alert('No media file available to download for this video.');
      return;
    }
    try {
      const res = await fetch(targetUrl);
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const ext = video.videoUrl ? 'mp4' : 'jpg';
        a.download = `${video.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.${ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        onSave(`Downloaded "${video.title}" media file`);
        return;
      }
    } catch (err) {
      console.warn('Direct blob download notice, opening link:', err);
    }
    window.open(targetUrl, '_blank');
    onSave(`Opened "${video.title}" media download stream`);
  };

  const handleAddCategory = () => {
    if (!newCategoryInput.trim()) return;
    const trimmed = newCategoryInput.trim();
    if (!categories.includes(trimmed)) {
      const updated = [...categories, trimmed];
      setCategories(updated);
      portfolioStorage.updateData((prev) => ({
        ...prev,
        videoCategories: updated
      }));
      onSave(`Category "${trimmed}" added!`);
      onRefresh();
    }
    setNewCategoryInput('');
  };

  const handleDeleteCategory = (cat: string) => {
    if (categories.length <= 1) {
      alert('You must have at least one category.');
      return;
    }
    const updated = categories.filter((c) => c !== cat);
    setCategories(updated);
    portfolioStorage.updateData((prev) => ({
      ...prev,
      videoCategories: updated
    }));
    onSave(`Category "${cat}" removed`);
    onRefresh();
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header Info Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#02180d] via-[#032314] to-[#02180d] border border-[#3dff8f]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-8 h-8 rounded-xl bg-[#03301a] border border-[#3dff8f]/40 flex items-center justify-center text-[#3dff8f] shadow-[0_0_12px_rgba(61,255,143,0.3)]">
              <Film className="w-4 h-4 text-[#3dff8f]" />
            </span>
            <h2 className="text-xl font-bold font-serif-heading text-[#fff1b8]">
              Video Production &amp; Motion Management
            </h2>
          </div>
          <p className="text-xs text-[#9fbfae]">
            Control 16:9 widescreen cinematic films and 1:1 social feed reels with chapters, 4K badges, and custom thumbnails.
          </p>
        </div>

        {!isCreating && !editingId && (
          <button
            onClick={handleStartCreate}
            className="px-4 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-b from-[#fff1b8] via-[#f0b92e] to-[#b8841a] hover:from-white hover:to-[#f0b92e] text-[#1a1200] flex items-center gap-2 cursor-pointer shadow-lg active:scale-95 transition-all shrink-0"
          >
            <Plus className="w-4 h-4 text-[#1a1200]" />
            <span>Add New Video</span>
          </button>
        )}
      </div>

      {/* Categories Bar */}
      <div className="p-4 rounded-2xl bg-[#010904] border border-white/10 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-mono text-[#f0b92e] font-bold">Video Categories ({categories.length})</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((cat) => (
            <span
              key={cat}
              className="px-3 py-1 rounded-xl text-xs bg-[#032314] text-[#3dff8f] border border-[#3dff8f]/30 flex items-center gap-2"
            >
              <span>{cat}</span>
              <button
                type="button"
                onClick={() => handleDeleteCategory(cat)}
                className="text-white/50 hover:text-rose-400 cursor-pointer"
                title="Remove category"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={newCategoryInput}
              onChange={(e) => setNewCategoryInput(e.target.value)}
              placeholder="New category..."
              className="px-2.5 py-1 text-xs rounded-xl bg-black border border-white/20 text-white focus:outline-none focus:border-[#3dff8f]"
              onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
            />
            <button
              onClick={handleAddCategory}
              className="px-2.5 py-1 rounded-xl bg-[#3dff8f]/20 hover:bg-[#3dff8f]/30 text-[#3dff8f] text-xs font-bold border border-[#3dff8f]/40 cursor-pointer"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      {/* Editor Form Modal / Card */}
      {(isCreating || editingId) && (
        <div className="p-6 sm:p-8 rounded-3xl bg-[#02130a] border-2 border-[#3dff8f]/60 shadow-[0_0_40px_rgba(61,255,143,0.15)] space-y-6 animate-in fade-in">
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <h3 className="text-lg font-bold font-serif-heading text-[#fff1b8] flex items-center gap-2">
              <Film className="w-5 h-5 text-[#3dff8f]" />
              <span>{isCreating ? 'Publish New Video Production' : 'Edit Video Production'}</span>
            </h3>
            <button
              onClick={handleCancel}
              className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs font-mono">
            {/* Title */}
            <div className="md:col-span-2">
              <label className="text-[#3dff8f] block mb-1.5 font-bold">Video Title *</label>
              <input
                type="text"
                required
                value={formData.title || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="e.g. Masterclass: Visual Identity Systems for East African Enterprises"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#010904] border border-white/20 text-white focus:outline-none focus:border-[#3dff8f]"
              />
            </div>

            {/* Video Aspect Ratio Selector (16:9 vs 1:1) */}
            <div>
              <label className="text-[#3dff8f] block mb-1.5 font-bold">Video Aspect Ratio *</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, ratio: '16:9' }))}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    formData.ratio === '16:9'
                      ? 'bg-[#03301a] border-[#3dff8f] text-[#3dff8f] shadow-[0_0_15px_rgba(61,255,143,0.25)]'
                      : 'bg-black/40 border-white/15 text-[#9fbfae] hover:border-white/30'
                  }`}
                >
                  <div className="font-bold flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#3dff8f]" />
                    <span>16:9 Widescreen</span>
                  </div>
                  <div className="text-[10px] text-[#9fbfae] mt-1">Cinematic YouTube / Landscape</div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, ratio: '1:1' }))}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    formData.ratio === '1:1'
                      ? 'bg-[#03301a] border-[#3dff8f] text-[#3dff8f] shadow-[0_0_15px_rgba(61,255,143,0.25)]'
                      : 'bg-black/40 border-white/15 text-[#9fbfae] hover:border-white/30'
                  }`}
                >
                  <div className="font-bold flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#f0b92e]" />
                    <span>1:1 Square Feed</span>
                  </div>
                  <div className="text-[10px] text-[#9fbfae] mt-1">Instagram Reel / Feed Motion</div>
                </button>
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="text-[#3dff8f] block mb-1.5 font-bold">Category / Topic *</label>
              <select
                value={formData.category || categories[0]}
                onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#010904] border border-white/20 text-white focus:outline-none focus:border-[#3dff8f]"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Real Video Source: File Upload & Embed Options */}
            <div className="md:col-span-2 space-y-3 p-4 sm:p-5 rounded-2xl bg-[#02140a] border border-[#3dff8f]/30">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Film className="w-5 h-5 text-[#3dff8f]" />
                  <span className="text-sm font-bold text-[#fff1b8]">Video Source (Real Video File or Embed) *</span>
                </div>
                <div className="flex items-center bg-black/60 p-1 rounded-xl border border-white/10 text-xs font-mono">
                  <button
                    type="button"
                    onClick={() => setVideoUploadTab('upload')}
                    className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                      videoUploadTab === 'upload'
                        ? 'bg-[#3dff8f] text-black font-bold shadow-[0_0_10px_rgba(61,255,143,0.35)]'
                        : 'text-[#9fbfae] hover:text-white'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Video File</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setVideoUploadTab('url')}
                    className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                      videoUploadTab === 'url'
                        ? 'bg-[#3dff8f] text-black font-bold shadow-[0_0_10px_rgba(61,255,143,0.35)]'
                        : 'text-[#9fbfae] hover:text-white'
                    }`}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Embed URL</span>
                  </button>
                </div>
              </div>

              {videoUploadTab === 'upload' ? (
                <div className="space-y-4">
                  {/* Video File Picker Area */}
                  <label className="relative border-2 border-dashed border-[#3dff8f]/40 hover:border-[#3dff8f] bg-black/40 hover:bg-[#032415] rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all group">
                    <input
                      type="file"
                      accept="video/mp4,video/webm,video/ogg,video/quicktime,video/x-m4v,video/*"
                      onChange={handleVideoFileUpload}
                      disabled={isUploadingVideo}
                      className="hidden"
                    />
                    {isUploadingVideo ? (
                      <div className="flex flex-col items-center gap-3 py-2">
                        <Loader2 className="w-10 h-10 text-[#3dff8f] animate-spin" />
                        <span className="text-xs font-mono text-[#3dff8f] font-bold">
                          {videoUploadStatus || 'Uploading real video file...'}
                        </span>
                        <span className="text-[10px] text-[#9fbfae]">
                          Storing in high-performance media storage
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-2xl bg-[#032616] border border-[#3dff8f]/40 flex items-center justify-center text-[#3dff8f] group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(61,255,143,0.25)]">
                          <FileVideo className="w-6 h-6" />
                        </div>
                        <div className="text-xs sm:text-sm font-bold text-[#f4fff8]">
                          Click to Browse & Upload Real Video File
                        </div>
                        <p className="text-[11px] text-[#9fbfae]">
                          Supports MP4, WebM, MOV, and OGG · High-Fidelity & Fast Playback
                        </p>
                        {videoFileName && (
                          <div className="mt-1 px-3 py-1 rounded-full bg-[#0a351e] border border-[#3dff8f]/40 text-[#3dff8f] font-mono text-[11px] flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span className="truncate max-w-[260px]">{videoFileName}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </label>

                  {/* Real Live Video Player Preview in Admin */}
                  {formData.videoUrl && (
                    <div className="p-4 rounded-xl bg-black/60 border border-[#3dff8f]/40 space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2 text-xs font-mono">
                        <span className="text-[#3dff8f] font-bold flex items-center gap-1.5">
                          <Play className="w-3.5 h-3.5 fill-[#3dff8f]" />
                          <span>Real Video Preview ({formData.ratio})</span>
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleCaptureVideoThumbnail}
                            className="px-2.5 py-1 rounded-lg bg-[#0a351e] hover:bg-[#3dff8f]/20 border border-[#3dff8f]/40 text-[#3dff8f] flex items-center gap-1 text-[11px] transition-all cursor-pointer"
                            title="Capture the current video frame as cover thumbnail"
                          >
                            <Camera className="w-3 h-3" />
                            <span>Capture Frame as Cover</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData((prev) => ({ ...prev, videoUrl: '' }));
                              setVideoFileName(null);
                            }}
                            className="px-2 py-1 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-red-300 text-[11px] cursor-pointer"
                          >
                            Remove Video
                          </button>
                        </div>
                      </div>

                      <div
                        className={`relative w-full mx-auto rounded-xl overflow-hidden bg-black border border-white/10 ${
                          formData.ratio === '1:1' ? 'aspect-square max-w-[280px]' : 'aspect-video max-w-lg'
                        }`}
                      >
                        <video
                          ref={previewVideoRef}
                          src={formData.videoUrl}
                          poster={formData.thumbnailUrl}
                          controls
                          playsInline
                          preload="metadata"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Embed URL Input */
                <div className="space-y-2">
                  <input
                    type="text"
                    value={formData.videoUrl || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, videoUrl: e.target.value }))}
                    placeholder="https://www.youtube.com/watch?v=... or https://player.vimeo.com/video/..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#010904] border border-white/20 text-white focus:outline-none focus:border-[#3dff8f]"
                  />
                  <p className="text-[10px] text-[#9fbfae]">
                    Paste YouTube, Vimeo, or direct cloud MP4 URL.
                  </p>
                </div>
              )}
            </div>

            {/* Real Thumbnail Image URL & File Upload */}
            <div className="md:col-span-2 space-y-2 p-4 sm:p-5 rounded-2xl bg-[#02140a] border border-[#3dff8f]/30">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <label className="text-[#3dff8f] font-bold flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-[#3dff8f]" />
                  <span>Video Thumbnail Cover Image (Real Image Upload) *</span>
                </label>
                {formData.thumbnailUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, thumbnailUrl: '' }));
                      setCoverFileName(null);
                    }}
                    className="text-[11px] text-red-400 hover:underline"
                  >
                    Clear Image
                  </button>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <input
                  type="text"
                  value={formData.thumbnailUrl || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, thumbnailUrl: e.target.value }))}
                  placeholder="https://images.unsplash.com/... or upload image file below"
                  className="flex-1 w-full px-3.5 py-2.5 rounded-xl bg-[#010904] border border-white/20 text-white focus:outline-none focus:border-[#3dff8f]"
                />
                <label className="px-4 py-2.5 rounded-xl bg-[#032817] border border-[#3dff8f]/50 hover:bg-[#3dff8f]/25 text-[#3dff8f] flex items-center gap-2 cursor-pointer shrink-0 font-semibold shadow-sm transition-all hover:scale-102">
                  {isUploadingCover ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Upload Real Image</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverUpload}
                    disabled={isUploadingCover}
                    className="hidden"
                  />
                </label>
              </div>

              {coverFileName && (
                <div className="text-[11px] font-mono text-[#3dff8f] flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>File: {coverFileName}</span>
                </div>
              )}

              {formData.thumbnailUrl && (
                <div
                  onClick={() =>
                    setPreviewModal({
                      url: formData.thumbnailUrl || '',
                      title: formData.title || 'Video Cover Thumbnail',
                      subtitle: `${formData.ratio === '1:1' ? '1:1 Square Feed Video Cover' : '16:9 Widescreen Video Cover'} · ${formData.category || 'General'}`,
                      ratio: formData.ratio || '16:9'
                    })
                  }
                  className="relative mt-3 max-w-sm rounded-xl overflow-hidden border border-[#3dff8f]/40 hover:border-[#3dff8f] shadow-lg cursor-pointer group transition-all"
                  title="Click to preview video cover full size"
                >
                  <img
                    src={formData.thumbnailUrl}
                    alt="Cover Preview"
                    className={`w-full object-cover ${formData.ratio === '1:1' ? 'aspect-square' : 'aspect-video'}`}
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-mono gap-1">
                    <Eye className="w-4 h-4 text-[#3dff8f]" />
                    <span>Preview Cover Full Size</span>
                  </div>
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-none">
                    <span className="px-2 py-0.5 rounded bg-black/85 text-[10px] text-[#3dff8f] font-mono font-bold">
                      {formData.ratio === '1:1' ? '1:1 Square Cover' : '16:9 Widescreen Cover'}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-[#0a351e]/90 text-[10px] text-[#f0b92e] font-mono font-bold">
                      Active
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Duration & Resolution */}
            <div>
              <label className="text-[#9fbfae] block mb-1">Duration (e.g. 08:45)</label>
              <input
                type="text"
                value={formData.duration || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, duration: e.target.value }))}
                placeholder="10:30"
                className="w-full px-3 py-2 rounded-xl bg-[#010904] border border-white/20 text-white"
              />
            </div>

            <div>
              <label className="text-[#9fbfae] block mb-1">Resolution Badge</label>
              <select
                value={formData.resolution || '4K Ultra HD'}
                onChange={(e) => setFormData((prev) => ({ ...prev, resolution: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl bg-[#010904] border border-white/20 text-white"
              >
                <option value="4K Ultra HD">4K Ultra HD</option>
                <option value="1080p 60fps">1080p 60fps</option>
                <option value="2K QHD">2K QHD</option>
                <option value="Full HD">Full HD</option>
              </select>
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="text-[#9fbfae] block mb-1">Description / Key Learnings</label>
              <textarea
                rows={3}
                value={formData.description || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Brief summary of what this video showcases..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#010904] border border-white/20 text-white focus:outline-none focus:border-[#3dff8f]"
              />
            </div>

            {/* External Resource / Action Link */}
            <div className="md:col-span-2 p-4 rounded-2xl bg-[#010904] border border-[#3dff8f]/30 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-bold text-[#fff1b8] flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-[#3dff8f]" />
                  <span>External Resource / Referenced Link (Optional)</span>
                </label>
                <span className="text-[10px] text-[#9fbfae]">Shown as a direct link button in the video player modal</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-mono text-[#9fbfae] block mb-1">Link URL (https://...)</label>
                  <input
                    type="url"
                    value={formData.linkUrl || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, linkUrl: e.target.value }))}
                    placeholder="https://github.com/... or https://behance.net/..."
                    className="w-full px-3 py-2 rounded-xl bg-[#02140b] border border-white/20 text-xs text-white focus:outline-none focus:border-[#3dff8f]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-mono text-[#9fbfae] block mb-1">Button Title / Action Label</label>
                  <input
                    type="text"
                    value={formData.linkTitle || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, linkTitle: e.target.value }))}
                    placeholder="e.g. View Case Study / Project Code"
                    className="w-full px-3 py-2 rounded-xl bg-[#02140b] border border-white/20 text-xs text-white focus:outline-none focus:border-[#3dff8f]"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const url = formData.linkUrl || 'https://';
                  const label = formData.linkTitle || 'Explore Link';
                  setFormData((prev) => ({
                    ...prev,
                    description: (prev.description || '') + `\n\n[${label}](${url})`
                  }));
                }}
                className="px-2.5 py-1 rounded-lg bg-[#0a351e] border border-[#3dff8f]/40 text-[#3dff8f] text-[10px] font-mono hover:bg-[#3dff8f]/20 cursor-pointer"
              >
                + Insert Markdown Link into Video Description
              </button>
            </div>

            {/* Tags */}
            <div className="md:col-span-2">
              <label className="text-[#9fbfae] block mb-1">Tags (comma-separated)</label>
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Branding, Typography, Architecture, Web Development"
                className="w-full px-3.5 py-2 rounded-xl bg-[#010904] border border-white/20 text-white"
              />
            </div>

            {/* Chapters & Timestamps */}
            <div className="md:col-span-2 space-y-3 p-4 rounded-2xl bg-black/50 border border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#3dff8f] font-bold flex items-center gap-1.5">
                  <ListPlus className="w-4 h-4" />
                  <span>Video Chapters &amp; Timestamps (Optional)</span>
                </span>
                <span className="text-[10px] text-[#9fbfae]">
                  {(formData.chapters || []).length} Chapters
                </span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="02:30"
                  value={chapterTime}
                  onChange={(e) => setChapterTime(e.target.value)}
                  className="w-20 px-2.5 py-1.5 rounded-xl bg-[#010904] border border-white/20 text-white text-xs font-mono"
                />
                <input
                  type="text"
                  placeholder="Chapter title (e.g. Design Systems Overview)"
                  value={chapterTitle}
                  onChange={(e) => setChapterTitle(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-xl bg-[#010904] border border-white/20 text-white text-xs font-mono"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddChapter()}
                />
                <button
                  type="button"
                  onClick={handleAddChapter}
                  className="px-3 py-1.5 rounded-xl bg-[#3dff8f]/20 hover:bg-[#3dff8f]/30 text-[#3dff8f] text-xs font-bold border border-[#3dff8f]/40 cursor-pointer"
                >
                  Add Chapter
                </button>
              </div>

              {(formData.chapters || []).length > 0 && (
                <div className="space-y-1.5 pt-2">
                  {formData.chapters!.map((ch, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-xl bg-[#02180d] border border-white/5 text-xs font-mono"
                    >
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded bg-white/10 text-[#3dff8f] font-bold">
                          {ch.time}
                        </span>
                        <span className="text-[#f4fff8]">{ch.title}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveChapter(idx)}
                        className="text-white/40 hover:text-rose-400 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Featured toggle */}
            <div className="md:col-span-2 flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.featured || false}
                  onChange={(e) => setFormData((prev) => ({ ...prev, featured: e.target.checked }))}
                  className="w-4 h-4 accent-[#3dff8f] rounded cursor-pointer"
                />
                <span className="text-xs text-[#f4fff8] font-bold">
                  Mark as Featured Video (Shown in Top Video Spotlight Hero)
                </span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 rounded-xl border border-white/20 text-[#9fbfae] hover:text-white cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveVideo}
              className="px-6 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-b from-[#fff1b8] via-[#f0b92e] to-[#b8841a] hover:from-white hover:to-[#f0b92e] text-[#1a1200] flex items-center gap-2 cursor-pointer shadow-lg active:scale-95"
            >
              <Check className="w-4 h-4 text-[#1a1200]" />
              <span>{isCreating ? 'Publish Video' : 'Save Changes'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Videos Catalog List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs font-mono text-[#9fbfae]">
          <span>Existing Videos ({videos.length})</span>
          <span>16:9 Widescreen &amp; 1:1 Square Feed Productions</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {videos.map((vid) => (
            <div
              key={vid.id}
              className="p-4 rounded-2xl bg-[#010c06] border border-white/10 hover:border-[#3dff8f]/50 transition-all flex flex-col justify-between gap-3 group"
            >
              <div className="space-y-3">
                {/* Media Preview Box */}
                <div
                  onClick={() =>
                    setPreviewModal({
                      url: vid.thumbnailUrl,
                      title: vid.title,
                      subtitle: `${vid.ratio === '1:1' ? '1:1 Square Feed Video Cover' : '16:9 Widescreen Video Cover'} · ${vid.category}`,
                      ratio: vid.ratio
                    })
                  }
                  className={`relative w-full rounded-xl overflow-hidden bg-black border border-white/10 cursor-pointer group/thumb ${
                    vid.ratio === '1:1' ? 'aspect-square max-h-56' : 'aspect-video'
                  }`}
                  title="Click to preview cover image full size"
                >
                  <img
                    src={vid.thumbnailUrl}
                    alt={vid.title}
                    className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-mono gap-1.5 pointer-events-none">
                    <Eye className="w-4 h-4 text-[#3dff8f]" />
                    <span>Inspect Image</span>
                  </div>
                  <div className="absolute top-2 left-2 flex items-center gap-1.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        vid.ratio === '1:1'
                          ? 'bg-[#f0b92e] text-black'
                          : 'bg-[#02180d] text-[#3dff8f] border border-[#3dff8f]/40'
                      }`}
                    >
                      {vid.ratio}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-black/80 text-[10px] font-mono text-[#3dff8f] border border-white/10">
                      {vid.resolution}
                    </span>
                  </div>

                  <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 text-[10px] font-mono text-white flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#3dff8f]" />
                    <span>{vid.duration}</span>
                  </div>

                  {vid.featured && (
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-[#3dff8f] text-black text-[9px] font-mono font-bold uppercase flex items-center gap-1 shadow-md">
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>Spotlight</span>
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-[#3dff8f]">
                    <span>{vid.category}</span>
                    <span>•</span>
                    <span className="text-[#9fbfae]">
                      {new Date(vid.publishedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short'
                      })}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-[#f4fff8] line-clamp-1 mt-0.5 group-hover:text-[#3dff8f] transition-colors">
                    {vid.title}
                  </h4>
                  <p className="text-xs text-[#9fbfae] line-clamp-2 mt-1">
                    {vid.description}
                  </p>
                </div>

                {/* Video Chapters & Timestamps (Optional) - Directly Into Card */}
                <div className="mt-2.5 p-3 rounded-2xl bg-black/60 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-[#3dff8f] font-bold flex items-center gap-1.5">
                      <ListPlus className="w-3.5 h-3.5" />
                      <span>Video Chapters &amp; Timestamps (Optional)</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#032314] text-[#3dff8f] border border-[#3dff8f]/30 font-bold">
                      {(vid.chapters || []).length} Chapters
                    </span>
                  </div>

                  {/* Existing Chapters on this Card */}
                  {(vid.chapters && vid.chapters.length > 0) ? (
                    <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                      {vid.chapters.map((ch, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-1.5 px-2 rounded-xl bg-[#02180d] border border-white/5 text-[11px] font-mono group/ch hover:border-[#3dff8f]/30 transition-colors"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="px-1.5 py-0.2 rounded bg-[#3dff8f]/20 text-[#3dff8f] font-bold text-[10px] shrink-0">
                              {ch.time}
                            </span>
                            <span className="text-[#f4fff8] truncate text-xs">{ch.title}</span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveChapterFromCard(vid.id, idx);
                            }}
                            className="text-white/40 hover:text-rose-400 p-0.5 cursor-pointer transition-colors"
                            title="Remove chapter"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[11px] text-[#9fbfae]/70 italic py-0.5 px-1 font-mono">
                      0 Chapters
                    </div>
                  )}

                  {/* Quick Add Chapter Into Card */}
                  <div className="flex flex-col sm:flex-row items-center gap-2 pt-1 border-t border-white/10">
                    <input
                      type="text"
                      placeholder="02:30"
                      value={cardChapterInputs[vid.id]?.time ?? ''}
                      onChange={(e) => handleCardTimeChange(vid.id, e.target.value)}
                      className="w-full sm:w-20 px-2.5 py-1.5 rounded-xl bg-[#010904] border border-white/20 text-white text-xs font-mono placeholder:text-white/30 focus:outline-none focus:border-[#3dff8f]"
                    />
                    <input
                      type="text"
                      placeholder="Chapter title (e.g. Design Systems Overview)"
                      value={cardChapterInputs[vid.id]?.title ?? ''}
                      onChange={(e) => handleCardTitleChange(vid.id, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddChapterToCard(vid.id);
                        }
                      }}
                      className="w-full flex-1 px-2.5 py-1.5 rounded-xl bg-[#010904] border border-white/20 text-white text-xs font-mono placeholder:text-white/30 focus:outline-none focus:border-[#3dff8f]"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddChapterToCard(vid.id);
                      }}
                      className="w-full sm:w-auto px-3 py-1.5 rounded-xl bg-[#3dff8f]/20 hover:bg-[#3dff8f]/35 text-[#3dff8f] text-xs font-bold border border-[#3dff8f]/40 cursor-pointer transition-all active:scale-95 shrink-0 flex items-center justify-center gap-1 shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Chapter</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs">
                <div className="flex items-center gap-3 text-[11px] font-mono text-[#9fbfae]">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5 text-[#3dff8f]" />
                    <span>{vid.viewsCount || 0}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5 text-rose-400" />
                    <span>{vid.likesCount || 0}</span>
                  </span>
                </div>

                {/* 4 Action Suite: Edit, Upload Cover, Download, Delete */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* Quick Upload Cover Button */}
                  <label
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1 cursor-pointer transition-all active:scale-95 ${
                      quickUploadingVideoId === vid.id
                        ? 'bg-[#0a351e] text-[#3dff8f] border-[#3dff8f] animate-pulse cursor-wait'
                        : 'bg-[#01140a] text-[#3dff8f] border-[#3dff8f]/40 hover:bg-[#0a351e]'
                    }`}
                    title="Upload Video Cover / Thumbnail"
                  >
                    {quickUploadingVideoId === vid.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#3dff8f]" />
                    ) : (
                      <Upload className="w-3.5 h-3.5 text-[#3dff8f]" />
                    )}
                    <span className="text-[11px] font-mono">{quickUploadingVideoId === vid.id ? 'Uploading...' : 'Upload'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={quickUploadingVideoId === vid.id}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleQuickUploadVideoThumb(vid.id, f);
                        e.target.value = '';
                      }}
                    />
                  </label>

                  {/* Download Video / Thumbnail */}
                  <button
                    type="button"
                    onClick={() => handleDownloadVideo(vid)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-[#9fbfae] hover:text-white border border-white/10 cursor-pointer transition-colors"
                    title="Download video or poster media"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>

                  {/* Edit Video */}
                  <button
                    onClick={() => handleStartEdit(vid)}
                    className="px-2.5 py-1.5 rounded-lg bg-[#0a351e] hover:bg-[#0d4728] text-[#3dff8f] border border-[#3dff8f]/40 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-sm active:scale-95"
                    title="Edit video details"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-mono">Edit</span>
                  </button>

                  {/* Delete Video */}
                  <button
                    onClick={() => handleDeleteVideo(vid.id)}
                    className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 cursor-pointer transition-colors"
                    title="Delete video"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Full-screen Image Inspection & Preview Modal */}
      <AdminImagePreviewModal
        image={previewModal}
        onClose={() => setPreviewModal(null)}
      />
    </div>
  );
};
