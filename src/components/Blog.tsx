/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Modern Blog & Creative Insights Page / Section
 * Features dynamic aspect ratio support for all image types,
 * author credentials, formatted date and time, category filters,
 * live search, featured showcase, and Pen-on-Book iconography.
 */

import React, { useState, useMemo } from 'react';
import { BlogPostItem, portfolioStorage } from '../data/portfolioStorage';
import { getCssAspectRatio, processProjectImageFile } from '../utils/imageHelper';
import { uploadFileToStorage } from '../lib/firebase';
import { PenOnBookIcon } from './PenOnBookIcon';
import {
  Search,
  Calendar,
  Clock,
  Heart,
  Eye,
  ArrowRight,
  Sparkles,
  SlidersHorizontal,
  Bookmark,
  Share2,
  Tag,
  CheckCircle,
  ExternalLink,
  Upload,
  Download,
  Trash2,
  Edit,
  Loader2
} from 'lucide-react';

interface BlogProps {
  posts: BlogPostItem[];
  categories: string[];
  onSelectPost: (post: BlogPostItem) => void;
  onOpenAdmin?: () => void;
}

export const Blog: React.FC<BlogProps> = ({
  posts,
  categories,
  onSelectPost,
  onOpenAdmin
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'likes'>('latest');
  const [quickUploadingBlogId, setQuickUploadingBlogId] = useState<string | null>(null);

  const handleDownloadBlogPost = (e: React.MouseEvent, post: BlogPostItem) => {
    e.stopPropagation();
    const mdContent = `---
title: "${(post.title || '').replace(/"/g, '\\"')}"
author: "${post.author?.name || 'Dr. Boniphace Ndege'}"
date: "${post.publishedAt}"
category: "${post.category}"
readTime: "${post.readTimeMinutes || 4} min"
tags: [${(post.tags || []).map((t) => `"${t}"`).join(', ')}]
---

# ${post.title}

> ${post.excerpt}

${post.content || ''}
`;
    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${post.slug || 'article'}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleQuickUploadBlogCover = async (postId: string, file: File) => {
    setQuickUploadingBlogId(postId);
    try {
      const processed = await processProjectImageFile(file, 1200, 0.88);
      let finalUrl = processed.dataUrl;
      try {
        const ext = file.type.includes('png') ? 'png' : file.type.includes('webp') ? 'webp' : 'jpg';
        const path = `portfolio/blog/cover_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
        finalUrl = await uploadFileToStorage(file, path, file.type || 'image/jpeg');
      } catch (storageErr) {
        console.warn('Storage upload note for blog quick cover:', storageErr);
      }

      portfolioStorage.updateData((prev) => ({
        ...prev,
        blogPosts: (prev.blogPosts || []).map((p) =>
          p.id === postId
            ? {
                ...p,
                coverImage: finalUrl,
                aspectRatio: processed.detectedRatio || p.aspectRatio
              }
            : p
        )
      }));
    } catch (err: any) {
      alert('Error uploading blog cover: ' + (err.message || 'Unknown error'));
    } finally {
      setQuickUploadingBlogId(null);
    }
  };

  const handleDeleteBlogPost = (e: React.MouseEvent, post: BlogPostItem) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete "${post.title}"?`)) return;
    portfolioStorage.updateData((prev) => ({
      ...prev,
      blogPosts: (prev.blogPosts || []).filter((p) => p.id !== post.id)
    }));
  };

  // Filter only published posts for the public view
  const publishedPosts = useMemo(() => {
    return (posts || []).filter((p) => p.published);
  }, [posts]);

  // Filter & search
  const filteredPosts = useMemo(() => {
    return publishedPosts
      .filter((post) => {
        const matchesCategory =
          selectedCategory === 'All' || post.category === selectedCategory;
        const matchesSearch =
          searchQuery.trim() === '' ||
          post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
          post.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
          post.category.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'popular') return (b.views || 0) - (a.views || 0);
        if (sortBy === 'likes') return (b.likes || 0) - (a.likes || 0);
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      });
  }, [publishedPosts, selectedCategory, searchQuery, sortBy]);

  // Featured post (first featured post or first in list)
  const featuredPost = useMemo(() => {
    return publishedPosts.find((p) => p.featured) || publishedPosts[0];
  }, [publishedPosts]);

  // All categories including "All"
  const allCategoriesList = useMemo(() => {
    return ['All', ...(categories || [])];
  }, [categories]);

  return (
    <section id="blog" className="py-16 sm:py-24 px-2.5 sm:px-4 md:px-6 lg:px-8 w-full max-w-[1740px] 2xl:max-w-[1860px] mx-auto relative scroll-mt-24">
      {/* Background glow ambiance */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#3dff8f]/5 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4 mb-12 sm:mb-16">
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#02140b] border border-[#3dff8f]/40 shadow-[0_0_20px_rgba(61,255,143,0.25)]">
          <PenOnBookIcon className="w-4 h-4 text-[#3dff8f]" glow />
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#3dff8f]">
            Editorial &amp; Creative Insights
          </span>
        </div>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-serif-heading text-[#fff1b8] tracking-tight">
          Articles, Knowledge &amp; Design Thoughts
        </h2>

        <p className="text-sm sm:text-base text-[#9fbfae] leading-relaxed">
          In-depth explorations into graphic design systems, mobile-first web engineering, brand identity craft, and human-in-the-loop AI workflows—written from real project experiences.
        </p>

        {onOpenAdmin && (
          <div className="pt-2">
            <button
              type="button"
              data-unauth-exempt="true"
              data-admin-portal="true"
              data-admin-trigger="true"
              onClick={onOpenAdmin}
              className="inline-flex items-center gap-1.5 text-xs font-mono text-[#f0b92e] hover:text-[#fff1b8] bg-[#02140b] px-3 py-1 rounded-lg border border-[#f0b92e]/30 hover:border-[#f0b92e] transition-colors cursor-pointer"
            >
              <PenOnBookIcon className="w-3.5 h-3.5 text-[#f0b92e]" />
              <span>Admin: Manage Blog Articles</span>
            </button>
          </div>
        )}
      </div>

      {/* Featured Article Showcase (Shown when not filtering search) */}
      {!searchQuery && selectedCategory === 'All' && featuredPost && (
        <div className="mb-14">
          <div className="relative rounded-3xl sm:rounded-[36px] bg-gradient-to-br from-[#02140b] via-[#010904] to-[#010904] card-neon-shallow p-5 sm:p-8 lg:p-10 transition-all duration-300">
            {/* Top Badge */}
            <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#f0b92e]/20 text-[#f0b92e] border border-[#f0b92e]/40 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-[#f0b92e]" />
                  <span>Featured Article</span>
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#0a351e] text-[#3dff8f] border border-[#3dff8f]/30">
                  {featuredPost.category}
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs font-mono text-[#9fbfae]">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#f0b92e]" />
                  <span>{new Date(featuredPost.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
                {featuredPost.publishedTimeFormatted && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#3dff8f]" />
                    <span>{featuredPost.publishedTimeFormatted}</span>
                  </div>
                )}
                <span>· {featuredPost.readTimeMinutes} min read</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">
              {/* Featured Cover Image with dynamic ratio containment */}
              <div className="lg:col-span-7">
                <div
                  className="w-full rounded-2xl sm:rounded-3xl overflow-hidden border border-white/10 bg-black relative shadow-2xl flex items-center justify-center cursor-pointer"
                  style={{ aspectRatio: getCssAspectRatio(featuredPost.aspectRatio || '16:9') }}
                  onClick={() => onSelectPost(featuredPost)}
                >
                  <img
                    src={featuredPost.coverImage}
                    alt={featuredPost.title}
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                  />
                  <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded bg-black/80 font-mono text-[10px] text-[#3dff8f] border border-white/20">
                    Ratio: {featuredPost.aspectRatio || '16:9'}
                  </div>
                </div>
              </div>

              {/* Featured Info */}
              <div className="lg:col-span-5 space-y-4">
                <h3
                  onClick={() => onSelectPost(featuredPost)}
                  className="text-2xl sm:text-3xl font-extrabold font-serif-heading text-[#fff1b8] leading-tight hover:text-[#3dff8f] transition-colors cursor-pointer"
                >
                  {featuredPost.title}
                </h3>

                <p className="text-sm text-[#c8e6d4] leading-relaxed line-clamp-3">
                  {featuredPost.excerpt}
                </p>

                {/* Author Card */}
                <div className="flex items-center gap-3 pt-2">
                  {featuredPost.author.avatar ? (
                    <img
                      src={featuredPost.author.avatar}
                      alt={featuredPost.author.name}
                      className="w-10 h-10 rounded-full object-cover border border-[#3dff8f] p-0.5 bg-black"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#0a351e] border border-[#3dff8f] flex items-center justify-center text-xs font-bold text-[#3dff8f]">
                      {featuredPost.author.name[0]}
                    </div>
                  )}
                  <div>
                    <div className="text-xs font-bold text-[#f4fff8]">
                      {featuredPost.author.name}
                    </div>
                    <div className="text-[11px] text-[#9fbfae]">
                      {featuredPost.author.role || 'Graphic Designer & Author'}
                    </div>
                  </div>
                </div>

                {/* Read Button */}
                <div className="pt-2 flex items-center gap-3">
                  <button
                    onClick={() => onSelectPost(featuredPost)}
                    className="px-5 py-2.5 rounded-2xl text-xs font-bold text-black bg-gradient-to-r from-[#3dff8f] via-[#fff1b8] to-[#f0b92e] hover:brightness-110 flex items-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(61,255,143,0.35)] active:scale-95 transition-all"
                  >
                    <PenOnBookIcon className="w-4 h-4 text-black" />
                    <span>Read Full Article</span>
                    <ArrowRight className="w-3.5 h-3.5 text-black" />
                  </button>
                  <span className="text-xs font-mono text-[#9fbfae] flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                    <span>{featuredPost.likes || 0}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter, Search & Sort Control Bar */}
      <div className="space-y-4 mb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#3dff8f] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search articles by title, topic, or keyword..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#010904] border border-white/15 focus:border-[#3dff8f] rounded-2xl text-xs sm:text-sm text-[#f4fff8] placeholder-[#9fbfae]/60 focus:outline-none transition-all"
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

          {/* Sort Selector */}
          <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#f0b92e]" />
            <span className="text-xs font-mono text-[#9fbfae]">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-[#010904] border border-white/15 rounded-xl px-3 py-1.5 text-xs text-[#f4fff8] focus:border-[#3dff8f] focus:outline-none font-mono"
            >
              <option value="latest">Latest Published</option>
              <option value="popular">Most Viewed</option>
              <option value="likes">Most Liked</option>
            </select>
          </div>
        </div>

        {/* Category Pills Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {allCategoriesList.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                selectedCategory === cat
                  ? 'bg-[#3dff8f] text-black font-bold border-[#3dff8f] shadow-[0_0_12px_rgba(61,255,143,0.35)]'
                  : 'bg-[#010904] text-[#9fbfae] border-white/10 hover:text-white hover:border-[#3dff8f]/40'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Blog Posts with dynamic aspect ratios */}
      {filteredPosts.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[#010904] border border-white/10 space-y-3">
          <PenOnBookIcon className="w-10 h-10 text-[#f0b92e] mx-auto opacity-60" />
          <h4 className="text-base font-bold text-[#fff1b8]">No articles found</h4>
          <p className="text-xs text-[#9fbfae]">
            Try adjusting your search query or choosing another category filter.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold text-black bg-[#3dff8f] hover:bg-[#34db7a] cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
          {filteredPosts.map((post) => {
            const formattedPostDate = new Date(post.publishedAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            });

            return (
              <article
                key={post.id}
                onClick={() => onSelectPost(post)}
                className="rounded-3xl bg-[#010904] card-neon-shallow p-5 flex flex-col justify-between transition-all duration-300 group cursor-pointer"
              >
                <div className="space-y-4">
                  {/* Dynamic Aspect Ratio Image Frame (accepts all ratios) */}
                  <div
                    className="w-full rounded-2xl overflow-hidden border border-white/10 bg-black relative flex items-center justify-center shadow"
                    style={{ aspectRatio: getCssAspectRatio(post.aspectRatio || '16:9') }}
                  >
                    <img
                      src={post.coverImage}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-2.5 left-2.5">
                      <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#010904]/90 text-[#3dff8f] border border-[#3dff8f]/40 backdrop-blur-xs">
                        {post.category}
                      </span>
                    </div>
                    <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 font-mono text-[9px] text-[#3dff8f] border border-white/20">
                      {post.aspectRatio || '16:9'}
                    </div>
                  </div>

                  {/* Metadata Row: Date & Formatted Time & Reading estimate */}
                  <div className="flex items-center justify-between text-[11px] font-mono text-[#9fbfae] pt-1">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 text-[#f0b92e]" />
                      <span>{formattedPostDate}</span>
                      {post.publishedTimeFormatted && (
                        <>
                          <span>·</span>
                          <Clock className="w-3 h-3 text-[#3dff8f]" />
                          <span>{post.publishedTimeFormatted}</span>
                        </>
                      )}
                    </div>
                    <span>{post.readTimeMinutes} min read</span>
                  </div>

                  {/* Author Header */}
                  <div className="flex items-center gap-2">
                    {post.author.avatar ? (
                      <img
                        src={post.author.avatar}
                        alt={post.author.name}
                        className="w-6 h-6 rounded-full object-cover border border-[#3dff8f]/40"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-[#0a351e] border border-[#3dff8f] flex items-center justify-center text-[10px] font-bold text-[#3dff8f]">
                        {post.author.name[0]}
                      </div>
                    )}
                    <span className="text-xs text-[#fff1b8] font-medium truncate">
                      {post.author.name}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg sm:text-xl font-bold font-serif-heading text-[#f4fff8] leading-snug group-hover:text-[#fff1b8] transition-colors line-clamp-2">
                    {post.title}
                  </h3>

                  {/* Text Excerpt ("show text except") */}
                  <p className="text-xs text-[#9fbfae] leading-relaxed line-clamp-3">
                    {post.excerpt}
                  </p>

                  {/* Tags */}
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {post.tags.slice(0, 3).map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-[#c8e6d4]"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer Action Bar: Metrics & 4 Actions (Upload, Download, Edit, Delete) */}
                <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono mt-4">
                  <div className="flex items-center gap-3 text-[#9fbfae]">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      <span>{post.views || 0}</span>
                    </span>
                    <span className="flex items-center gap-1 text-rose-300">
                      <Heart className="w-3.5 h-3.5" />
                      <span>{post.likes || 0}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Quick Upload Cover */}
                    <label
                      onClick={(e) => e.stopPropagation()}
                      className={`p-1.5 rounded-lg border text-xs cursor-pointer flex items-center justify-center transition-all ${
                        quickUploadingBlogId === post.id
                          ? 'bg-[#0a351e] text-[#3dff8f] border-[#3dff8f] animate-pulse cursor-wait'
                          : 'bg-white/5 hover:bg-[#0a351e] text-[#9fbfae] hover:text-[#3dff8f] border-white/10 hover:border-[#3dff8f]/40'
                      }`}
                      title="Upload Cover Image"
                    >
                      {quickUploadingBlogId === post.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#3dff8f]" />
                      ) : (
                        <Upload className="w-3.5 h-3.5" />
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={quickUploadingBlogId === post.id}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleQuickUploadBlogCover(post.id, f);
                          e.target.value = '';
                        }}
                      />
                    </label>

                    {/* Download Markdown */}
                    <button
                      type="button"
                      onClick={(e) => handleDownloadBlogPost(e, post)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-[#0a351e] text-[#9fbfae] hover:text-[#3dff8f] border border-white/10 hover:border-[#3dff8f]/40 transition-colors cursor-pointer"
                      title="Download Article (.md)"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>

                    {/* Edit Article in Admin */}
                    {onOpenAdmin && (
                      <button
                        type="button"
                        data-unauth-exempt="true"
                        data-admin-portal="true"
                        data-admin-trigger="true"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenAdmin();
                        }}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-[#0a351e] text-[#9fbfae] hover:text-[#3dff8f] border border-white/10 hover:border-[#3dff8f]/40 transition-colors cursor-pointer"
                        title="Edit Article"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Delete Article */}
                    <button
                      type="button"
                      onClick={(e) => handleDeleteBlogPost(e, post)}
                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors cursor-pointer"
                      title="Delete Article"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Read Article */}
                    <span className="text-[#3dff8f] group-hover:text-[#fff1b8] font-bold flex items-center gap-1 transition-colors pl-1">
                      <span>Read</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};
