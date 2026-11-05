/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Video Productions & Motion Showcase Page
 * Features:
 * - Two distinct video aspect ratios: 16:9 (Widescreen) and 1:1 (Square Feed)
 * - Ratio switcher filter: All Ratios, 16:9 Widescreen, 1:1 Square
 * - Interactive featured video player with on-the-fly 16:9 vs 1:1 ratio preview
 * - Category / topic filters, search bar, sorting, and view modes
 * - Video cards with duration, resolution badges, hover play animations, and like counters
 * - Integration with VideoModal for interactive playback
 */

import React, { useState, useMemo } from 'react';
import {
  Video as VideoIcon,
  Play,
  Tv,
  Film,
  Search,
  SlidersHorizontal,
  Clock,
  Sparkles,
  Heart,
  Share2,
  Check,
  ExternalLink,
  Layers,
  ArrowRight,
  LayoutGrid,
  List,
  Eye,
  CheckCircle,
  ShieldCheck,
  Maximize2,
  ListPlus,
  Plus,
  Download
} from 'lucide-react';
import { VideoItem, VideoRatio, portfolioStorage } from '../data/portfolioStorage';

interface VideoProps {
  videos: VideoItem[];
  categories: string[];
  onSelectVideo: (video: VideoItem) => void;
  onOpenAdmin?: () => void;
}

export const Video: React.FC<VideoProps> = ({
  videos,
  categories,
  onSelectVideo,
  onOpenAdmin
}) => {
  const [selectedRatio, setSelectedRatio] = useState<'all' | '16:9' | '1:1'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'featured' | 'newest' | 'views' | 'duration'>('featured');
  const [viewMode, setViewMode] = useState<'grid' | 'compact'>('grid');
  const [heroRatio, setHeroRatio] = useState<VideoRatio>('16:9');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});

  // All unique categories
  const allCategories = useMemo(() => {
    const set = new Set(['All']);
    (categories || []).forEach((c) => {
      if (c && c !== 'All Topics') set.add(c);
    });
    (videos || []).forEach((v) => {
      if (v.category) set.add(v.category);
    });
    return Array.from(set);
  }, [categories, videos]);

  // Featured video for Hero section
  const featuredVideo = useMemo(() => {
    return videos.find((v) => v.featured && v.published !== false) || videos[0];
  }, [videos]);

  // Filtered and sorted videos
  const filteredVideos = useMemo(() => {
    let list = videos.filter((v) => v.published !== false);

    // Ratio filter (16:9 or 1:1)
    if (selectedRatio !== 'all') {
      list = list.filter((v) => v.ratio === selectedRatio);
    }

    // Category filter
    if (selectedCategory !== 'All' && selectedCategory !== 'All Topics') {
      list = list.filter((v) => v.category === selectedCategory);
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (v) =>
          (v.title && v.title.toLowerCase().includes(q)) ||
          (v.subtitle && v.subtitle.toLowerCase().includes(q)) ||
          (v.description && v.description.toLowerCase().includes(q)) ||
          (v.category && v.category.toLowerCase().includes(q)) ||
          (v.tags && v.tags.some((t) => t.toLowerCase().includes(q))) ||
          (v.author?.name && v.author.name.toLowerCase().includes(q))
      );
    }

    // Sorting
    return list.sort((a, b) => {
      if (sortBy === 'featured') {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return a.order - b.order;
      }
      if (sortBy === 'newest') {
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      }
      if (sortBy === 'views') {
        return (b.viewsCount || 0) - (a.viewsCount || 0);
      }
      if (sortBy === 'duration') {
        return a.duration.localeCompare(b.duration);
      }
      return 0;
    });
  }, [videos, selectedRatio, selectedCategory, searchQuery, sortBy]);

  const handleShareVideo = (e: React.MouseEvent, video: VideoItem) => {
    e.stopPropagation();
    const url = `${window.location.origin}/#video`;
    const text = `Watch "${video.title}" by ${video.author.name}!\n${url}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(video.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleLikeVideo = (e: React.MouseEvent, videoId: string) => {
    e.stopPropagation();
    if (!likedMap[videoId]) {
      portfolioStorage.recordVideoLike(videoId);
      setLikedMap((prev) => ({ ...prev, [videoId]: true }));
    }
  };

  const handleDownloadVideo = async (e: React.MouseEvent, video: VideoItem) => {
    e.stopPropagation();
    const targetUrl = video.videoUrl || video.thumbnailUrl;
    if (!targetUrl) return;
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
        return;
      }
    } catch (err) {
      console.warn('Direct blob download notice:', err);
    }
    window.open(targetUrl, '_blank');
  };

  const count16by9 = videos.filter((v) => v.ratio === '16:9').length;
  const count1by1 = videos.filter((v) => v.ratio === '1:1').length;

  return (
    <section id="video" className="py-20 sm:py-28 px-4 sm:px-6 relative overflow-hidden bg-[#041a0f]/50">
      {/* Background Ambience Emerald Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[850px] h-[450px] bg-gradient-to-b from-[#3dff8f]/8 via-[#0f7a43]/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-[1740px] 2xl:max-w-[1860px] mx-auto space-y-12 sm:space-y-16 relative z-10 px-1 sm:px-2">

        {/* Section Header */}
        <div className="text-center space-y-5 max-w-3xl mx-auto">
          {/* Green Video Badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#02180d] border border-[#3dff8f]/50 shadow-[0_0_20px_rgba(61,255,143,0.35)]">
            <VideoIcon className="w-4 h-4 text-[#3dff8f] drop-shadow-[0_0_8px_rgba(61,255,143,0.6)]" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#3dff8f]">
              Official Video Showcase · 16:9 &amp; 1:1 Motion
            </span>
          </div>

          <div className="flex items-center justify-center gap-3 sm:gap-4 flex-wrap">
            <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-2xl bg-[#02180d] border border-[#3dff8f]/50 text-[#3dff8f] flex items-center justify-center shadow-[0_0_20px_rgba(61,255,143,0.35)] shrink-0">
              <Film className="w-6 h-6 sm:w-8 sm:h-8 text-[#3dff8f] drop-shadow-[0_0_10px_rgba(61,255,143,0.7)]" />
            </div>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-bold font-serif-heading text-[#fff1b8] tracking-tight leading-tight">
              Video Productions &amp; Motion
            </h2>
          </div>

          <p className="text-sm sm:text-base text-[#9fbfae] leading-relaxed">
            Curated cinematic masterclasses, brand identity motion reveals, full-stack development screencasts, and book trailers by <span className="text-[#3dff8f] font-semibold">Ev Dr. Boniphace J. Ndege</span> — formatted in both <span className="text-[#fff1b8] font-bold">16:9 Widescreen</span> and <span className="text-[#3dff8f] font-bold">1:1 Square Feed</span> aspect ratios.
          </p>

          {/* Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
            <div className="p-3 rounded-2xl bg-[#01140a] border border-[#3dff8f]/20">
              <div className="text-lg sm:text-2xl font-bold font-mono text-[#3dff8f]">
                {videos.length}
              </div>
              <div className="text-[11px] font-mono text-[#9fbfae]">Total Video Productions</div>
            </div>
            <div className="p-3 rounded-2xl bg-[#01140a] border border-[#f0b92e]/20">
              <div className="text-lg sm:text-2xl font-bold font-mono text-[#f0b92e]">
                {count16by9} Videos
              </div>
              <div className="text-[11px] font-mono text-[#9fbfae]">16:9 Widescreen Cinema</div>
            </div>
            <div className="p-3 rounded-2xl bg-[#01140a] border border-[#3dff8f]/20">
              <div className="text-lg sm:text-2xl font-bold font-mono text-[#3dff8f]">
                {count1by1} Reels
              </div>
              <div className="text-[11px] font-mono text-[#9fbfae]">1:1 Square Feed Motion</div>
            </div>
            <div className="p-3 rounded-2xl bg-[#01140a] border border-[#f0b92e]/20">
              <div className="text-lg sm:text-2xl font-bold font-mono text-[#fff1b8]">
                4K UHD &amp; HD
              </div>
              <div className="text-[11px] font-mono text-[#9fbfae]">High-Fidelity Master</div>
            </div>
          </div>
        </div>

        {/* Featured Video Spotlight with 16:9 vs 1:1 Live Ratio Switcher */}
        {featuredVideo && (
          <div className="p-6 sm:p-10 rounded-3xl bg-gradient-to-br from-[#011409] via-[#021008] to-[#010904] card-neon-shallow relative overflow-hidden">
            <div className="header-neon-line top-0" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Interactive Player Mockup with Ratio Switcher */}
              <div className="lg:col-span-7 flex flex-col items-center">
                
                {/* Ratio Switcher Tool on Spotlight */}
                <div className="flex items-center justify-between w-full max-w-xl mb-3 text-xs font-mono">
                  <span className="text-[#9fbfae] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#3dff8f]" />
                    <span>Spotlight Ratio Preview:</span>
                  </span>
                  <div className="flex items-center bg-[#010c06] border border-white/10 rounded-xl p-0.5">
                    <button
                      onClick={() => setHeroRatio('16:9')}
                      className={`px-3 py-1 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                        heroRatio === '16:9'
                          ? 'bg-[#3dff8f] text-black font-bold shadow-[0_0_10px_rgba(61,255,143,0.4)]'
                          : 'text-[#9fbfae] hover:text-white'
                      }`}
                    >
                      <Tv className="w-3.5 h-3.5" />
                      <span>16:9 Widescreen</span>
                    </button>
                    <button
                      onClick={() => setHeroRatio('1:1')}
                      className={`px-3 py-1 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                        heroRatio === '1:1'
                          ? 'bg-[#3dff8f] text-black font-bold shadow-[0_0_10px_rgba(61,255,143,0.4)]'
                          : 'text-[#9fbfae] hover:text-white'
                      }`}
                    >
                      <span className="w-3.5 h-3.5 border border-current rounded-sm inline-block" />
                      <span>1:1 Square</span>
                    </button>
                  </div>
                </div>

                {/* Video Frame */}
                <div
                  onClick={() => onSelectVideo(featuredVideo)}
                  className={`relative group cursor-pointer w-full rounded-2xl overflow-hidden border-2 border-[#3dff8f]/50 shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_30px_rgba(61,255,143,0.25)] transition-all duration-300 bg-black ${
                    heroRatio === '16:9'
                      ? 'aspect-video max-w-xl'
                      : 'aspect-square max-w-[340px] sm:max-w-[400px]'
                  }`}
                >
                  <img
                    src={featuredVideo.thumbnailUrl}
                    alt={featuredVideo.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#3dff8f] text-black flex items-center justify-center shadow-[0_0_35px_rgba(61,255,143,0.7)] group-hover:scale-110 transition-transform">
                      <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-black translate-x-0.5" />
                    </div>
                  </div>

                  {/* Corner Badges */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
                    <span className="px-2.5 py-1 rounded-full bg-[#02180d] border border-[#3dff8f]/50 text-[#3dff8f] font-mono text-xs font-bold shadow-md">
                      {heroRatio === '16:9' ? '16:9 Widescreen' : '1:1 Square Feed'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-[#f0b92e] text-[#1a1200] font-mono text-[10px] font-bold uppercase shadow-sm">
                      Featured
                    </span>
                  </div>

                  <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-md bg-black/85 text-xs font-mono font-bold text-[#f4fff8] z-10">
                    {featuredVideo.duration} • {featuredVideo.resolution || '4K UHD'}
                  </div>
                </div>
              </div>

              {/* Spotlight Info */}
              <div className="lg:col-span-5 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-[#3dff8f]/15 text-[#3dff8f] border border-[#3dff8f]/30 font-mono text-xs uppercase font-bold">
                    {featuredVideo.category}
                  </span>
                  <span className="text-xs font-mono text-[#9fbfae]">
                    {featuredVideo.duration}
                  </span>
                </div>

                <h3 className="text-2xl sm:text-4xl font-bold font-serif-heading text-[#fff1b8] leading-tight">
                  {featuredVideo.title}
                </h3>

                {featuredVideo.subtitle && (
                  <p className="text-sm text-[#3dff8f] font-medium italic">
                    {featuredVideo.subtitle}
                  </p>
                )}

                <p className="text-xs sm:text-sm text-[#c8e2d4] leading-relaxed">
                  {featuredVideo.description}
                </p>

                {/* Chapters Preview */}
                {featuredVideo.chapters && featuredVideo.chapters.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-[#011209] border border-white/10 space-y-2">
                    <span className="text-xs font-mono font-bold text-[#f0b92e] block">
                      Video Chapters &amp; Timestamps:
                    </span>
                    <div className="space-y-1">
                      {featuredVideo.chapters.slice(0, 3).map((ch, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-[#9fbfae]">
                          <span className="font-mono text-[#3dff8f]">{ch.time}</span>
                          <span>—</span>
                          <span className="truncate">{ch.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action CTA */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => onSelectVideo(featuredVideo)}
                    className="px-6 py-3 rounded-2xl font-bold text-xs sm:text-sm text-[#1a1200] bg-gradient-to-b from-[#fff1b8] via-[#f0b92e] to-[#b8841a] hover:from-white hover:to-[#f0b92e] shadow-lg flex items-center gap-2 cursor-pointer transition-all active:scale-95"
                  >
                    <Play className="w-4 h-4 fill-[#1a1200]" />
                    <span>Watch Full Showcase</span>
                  </button>

                  <button
                    onClick={(e) => handleShareVideo(e, featuredVideo)}
                    className="p-3 rounded-2xl bg-white/5 border border-white/10 hover:border-[#3dff8f]/40 text-[#f4fff8] hover:text-[#3dff8f] transition-all cursor-pointer"
                    title="Share video link"
                  >
                    {copiedId === featuredVideo.id ? <Check className="w-4 h-4 text-[#3dff8f]" /> : <Share2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filter Bar, Aspect Ratio Toggle, Search, and Category Pills */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-[#3dff8f] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search videos by title, description, tags, category..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#010c06] border border-white/10 text-xs sm:text-sm text-[#f4fff8] placeholder:text-[#9fbfae]/60 focus:outline-none focus:border-[#3dff8f] transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#9fbfae] hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Sort, View Mode & Admin Video Shortcut */}
            <div className="flex flex-wrap items-center gap-2.5 justify-end">
              {/* Sort Selector */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#010c06] border border-white/10 text-xs font-mono text-[#9fbfae]">
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#3dff8f]" />
                <span>Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent text-[#f4fff8] font-bold focus:outline-none cursor-pointer"
                >
                  <option value="featured" className="bg-[#010c06] text-white">Featured First</option>
                  <option value="newest" className="bg-[#010c06] text-white">Newest Release</option>
                  <option value="views" className="bg-[#010c06] text-white">Most Viewed</option>
                  <option value="duration" className="bg-[#010c06] text-white">Duration</option>
                </select>
              </div>

              {/* View Switcher */}
              <div className="flex items-center rounded-xl bg-[#010c06] border border-white/10 p-0.5">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    viewMode === 'grid' ? 'bg-[#3dff8f] text-black font-bold' : 'text-[#9fbfae] hover:text-white'
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('compact')}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    viewMode === 'compact' ? 'bg-[#3dff8f] text-black font-bold' : 'text-[#9fbfae] hover:text-white'
                  }`}
                  title="List View"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              {onOpenAdmin && (
                <button
                  type="button"
                  data-unauth-exempt="true"
                  data-admin-portal="true"
                  data-admin-trigger="true"
                  onClick={onOpenAdmin}
                  className="px-3.5 py-2 rounded-xl text-xs font-mono font-bold text-[#3dff8f] bg-[#3dff8f]/10 border border-[#3dff8f]/30 hover:bg-[#3dff8f]/20 transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                  title="Manage videos in admin dashboard"
                >
                  <VideoIcon className="w-3.5 h-3.5 text-[#3dff8f]" />
                  <span>Admin Video Manager</span>
                </button>
              )}
            </div>
          </div>

          {/* Ratio Filter Tabs: 16:9 vs 1:1 */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[11px] font-mono text-[#9fbfae] mr-1">Aspect Ratio:</span>
            {[
              { id: 'all', label: `All Ratios (${videos.length})`, icon: Sparkles },
              { id: '16:9', label: `16:9 Widescreen (${count16by9})`, icon: Tv },
              { id: '1:1', label: `1:1 Square Feed (${count1by1})`, icon: Film }
            ].map((ratioTab) => {
              const Icon = ratioTab.icon;
              return (
                <button
                  key={ratioTab.id}
                  onClick={() => setSelectedRatio(ratioTab.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
                    selectedRatio === ratioTab.id
                      ? 'bg-[#3dff8f] text-black border-[#3dff8f] shadow-[0_0_15px_rgba(61,255,143,0.35)]'
                      : 'bg-[#010904] text-[#9fbfae] border-white/10 hover:border-white/20'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{ratioTab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 select-none no-scrollbar">
            {allCategories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#0a351e] to-[#042816] text-[#3dff8f] border border-[#3dff8f] shadow-[0_0_12px_rgba(61,255,143,0.3)] font-bold'
                      : 'bg-[#010c06] text-[#9fbfae] border border-white/10 hover:border-white/25 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Video Cards Grid / List */}
        {filteredVideos.length === 0 ? (
          <div className="py-16 text-center space-y-3 p-8 rounded-3xl bg-[#010a05] border border-white/10">
            <Film className="w-12 h-12 text-[#9fbfae]/40 mx-auto" />
            <h3 className="text-lg font-bold text-[#fff1b8]">No Video Productions Found</h3>
            <p className="text-xs text-[#9fbfae] max-w-sm mx-auto">
              No videos match your current search query or ratio filter.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedRatio('all');
                setSelectedCategory('All');
              }}
              className="px-4 py-2 rounded-xl bg-[#3dff8f] text-black text-xs font-bold"
            >
              Reset All Video Filters
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
            {filteredVideos.map((video) => {
              const isLiked = Boolean(likedMap[video.id]);
              return (
                <article
                  key={video.id}
                  onClick={() => onSelectVideo(video)}
                  className="group rounded-3xl bg-[#010c06] card-neon-shallow transition-all duration-300 flex flex-col overflow-hidden cursor-pointer relative"
                >
                  {/* Glowing Top Line Accent */}
                  <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-[#3dff8f] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  {/* Video Media Container with Explicit Aspect Ratio (16:9 or 1:1) */}
                  <div className="p-4 pb-0 bg-gradient-to-b from-[#02140b] to-[#010c06] relative">
                    <div
                      className={`w-full rounded-2xl overflow-hidden border border-white/10 relative transition-transform duration-300 group-hover:-translate-y-1 bg-black ${
                        video.ratio === '16:9' ? 'aspect-video' : 'aspect-square'
                      }`}
                    >
                      <img
                        src={video.thumbnailUrl}
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

                      {/* Play Button Icon on Hover */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-[#3dff8f] text-black flex items-center justify-center shadow-[0_0_20px_rgba(61,255,143,0.6)] group-hover:scale-115 transition-transform">
                          <Play className="w-6 h-6 fill-black translate-x-0.5" />
                        </div>
                      </div>

                      {/* Top Badges */}
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
                        <span className="px-2 py-0.5 rounded-full bg-[#02180d] border border-[#3dff8f]/50 text-[#3dff8f] font-mono text-[10px] font-bold shadow-sm">
                          {video.ratio === '16:9' ? '16:9 Widescreen' : '1:1 Square'}
                        </span>
                        {video.featured && (
                          <span className="px-2 py-0.5 rounded-full bg-[#f0b92e] text-[#1a1200] font-mono text-[9px] font-bold uppercase shadow-sm">
                            Featured
                          </span>
                        )}
                      </div>

                      {/* Bottom Duration Badge */}
                      <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/80 text-[10px] font-mono font-bold text-[#f4fff8] z-10">
                        {video.duration}
                      </div>
                    </div>
                  </div>

                  {/* Video Body Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[10px] font-mono gap-2">
                        <span className="text-[#3dff8f] uppercase font-bold px-2 py-0.5 rounded-full bg-[#3dff8f]/10 border border-[#3dff8f]/30 truncate max-w-[150px]">
                          {video.category}
                        </span>
                        <span className="text-[#9fbfae] shrink-0">
                          {new Date(video.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>

                      <h3 className="text-base sm:text-lg font-bold font-serif-heading text-[#f4fff8] group-hover:text-[#3dff8f] transition-colors line-clamp-2 leading-snug">
                        {video.title}
                      </h3>

                      {video.subtitle && (
                        <p className="text-xs text-[#9fbfae] line-clamp-1 italic">
                          {video.subtitle}
                        </p>
                      )}

                      <p className="text-xs text-[#9fbfae] line-clamp-2 leading-relaxed">
                        {video.description}
                      </p>

                      {/* Video Chapters & Timestamps (Optional) - Into Card */}
                      <div className="p-3 rounded-2xl bg-[#010904] border border-white/10 space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="text-[#3dff8f] font-bold flex items-center gap-1.5">
                            <ListPlus className="w-3.5 h-3.5 text-[#3dff8f]" />
                            <span>Video Chapters &amp; Timestamps (Optional)</span>
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#032314] text-[#3dff8f] border border-[#3dff8f]/30 font-bold">
                            {(video.chapters || []).length} Chapters
                          </span>
                        </div>

                        {video.chapters && video.chapters.length > 0 ? (
                          <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                            {video.chapters.slice(0, 3).map((ch, idx) => (
                              <div
                                key={idx}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectVideo(video);
                                }}
                                className="flex items-center gap-2 text-[10px] font-mono p-1 rounded-lg bg-white/5 hover:bg-[#3dff8f]/15 hover:text-[#3dff8f] transition-colors"
                              >
                                <span className="px-1.5 py-0.5 rounded bg-[#3dff8f]/20 text-[#3dff8f] font-bold shrink-0">
                                  {ch.time}
                                </span>
                                <span className="truncate text-[#f4fff8]">{ch.title}</span>
                              </div>
                            ))}
                            {video.chapters.length > 3 && (
                              <div className="text-[10px] text-[#9fbfae] italic pl-1">
                                +{video.chapters.length - 3} more chapters
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-[10px] text-[#9fbfae]/70 italic font-mono">
                            <span>0 Chapters</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Footer Details & Action Buttons */}
                    <div className="pt-3 border-t border-white/10 space-y-3">
                      <div className="flex items-center justify-between text-[11px] font-mono text-[#9fbfae]">
                        <span className="text-[#fff1b8] font-bold truncate max-w-[160px]">
                          {video.author.name}
                        </span>
                        <span>{video.viewsCount || 1800} views</span>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1">
                        <button
                          onClick={() => onSelectVideo(video)}
                          className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#1a1200] bg-gradient-to-b from-[#fff1b8] via-[#f0b92e] to-[#b8841a] hover:from-white hover:to-[#f0b92e] flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
                        >
                          <Play className="w-3.5 h-3.5 fill-[#1a1200]" />
                          <span>Watch Video</span>
                        </button>

                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* Download Media */}
                          <button
                            onClick={(e) => handleDownloadVideo(e, video)}
                            className="p-2 rounded-xl text-xs bg-white/5 hover:bg-[#0a351e] text-[#9fbfae] hover:text-[#3dff8f] border border-white/10 hover:border-[#3dff8f]/40 transition-all cursor-pointer"
                            title="Download video or poster"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          {/* Like Button */}
                          <button
                            onClick={(e) => handleLikeVideo(e, video.id)}
                            className={`p-2 rounded-xl text-xs transition-all cursor-pointer border ${
                              isLiked
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                : 'bg-white/5 text-[#9fbfae] hover:text-rose-400 border-white/10'
                            }`}
                            title="Like video"
                          >
                            <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-rose-400 text-rose-400' : ''}`} />
                          </button>

                          {/* Share Button */}
                          <button
                            onClick={(e) => handleShareVideo(e, video)}
                            className="p-2 rounded-xl text-xs bg-white/5 hover:bg-[#0a351e] text-[#9fbfae] hover:text-[#3dff8f] border border-white/10 hover:border-[#3dff8f]/40 transition-all cursor-pointer"
                            title="Share video"
                          >
                            {copiedId === video.id ? <Check className="w-3.5 h-3.5 text-[#3dff8f]" /> : <Share2 className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          /* Compact List View */
          <div className="space-y-3">
            {filteredVideos.map((video) => (
              <div
                key={video.id}
                onClick={() => onSelectVideo(video)}
                className="p-3 sm:p-4 rounded-2xl bg-[#010c06] border border-white/10 hover:border-[#3dff8f]/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div
                    className={`relative rounded-xl overflow-hidden border border-white/10 shrink-0 bg-black ${
                      video.ratio === '16:9' ? 'w-28 sm:w-36 aspect-video' : 'w-20 sm:w-24 aspect-square'
                    }`}
                  >
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Play className="w-5 h-5 text-[#3dff8f] fill-[#3dff8f]" />
                    </div>
                    <span className="absolute bottom-1 right-1 px-1 rounded bg-black/80 text-[9px] font-mono text-[#3dff8f]">
                      {video.ratio}
                    </span>
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-[#3dff8f] font-bold px-2 py-0.2 rounded bg-[#3dff8f]/10 border border-[#3dff8f]/30">
                        {video.category}
                      </span>
                      <span className="text-xs text-[#9fbfae] font-mono">{video.duration}</span>
                    </div>
                    <h4 className="text-sm sm:text-base font-bold text-[#f4fff8] group-hover:text-[#3dff8f] truncate">
                      {video.title}
                    </h4>
                    <p className="text-xs text-[#9fbfae] line-clamp-1">{video.description}</p>
                    <div className="flex items-center gap-2 pt-0.5">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#032314] text-[#3dff8f] border border-[#3dff8f]/30">
                        {(video.chapters || []).length} Chapters
                      </span>
                      {video.chapters && video.chapters.length > 0 && (
                        <span className="text-[10px] text-[#9fbfae] truncate max-w-xs font-mono">
                          {video.chapters[0].time} {video.chapters[0].title}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {/* Download Video / Thumbnail */}
                  <button
                    onClick={(e) => handleDownloadVideo(e, video)}
                    className="p-2 rounded-xl bg-white/5 hover:bg-[#0a351e] text-[#9fbfae] hover:text-[#3dff8f] border border-white/10 hover:border-[#3dff8f]/40 transition-all cursor-pointer"
                    title="Download video or poster"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onSelectVideo(video)}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#3dff8f] text-black shadow-sm hover:bg-[#6effad] transition-all cursor-pointer active:scale-95"
                  >
                    Watch
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
