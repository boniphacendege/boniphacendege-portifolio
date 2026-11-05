/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Modern Immersive Blog Post Reading Modal
 * Displays full article content, author bio, published date and time,
 * dynamic image aspect ratios, key takeaways, social share, and interactive likes.
 */

import React, { useState, useEffect } from 'react';
import { BlogPostItem, portfolioStorage } from '../data/portfolioStorage';
import { getCssAspectRatio } from '../utils/imageHelper';
import { PenOnBookIcon } from './PenOnBookIcon';
import {
  X,
  Calendar,
  Clock,
  Heart,
  Share2,
  Bookmark,
  Eye,
  Check,
  Sparkles,
  ArrowLeft,
  ChevronRight,
  ExternalLink,
  MessageSquare,
  Copy,
  Tag
} from 'lucide-react';
import { formatTextWithLinks } from '../utils/textLinkHelper';

interface BlogModalProps {
  post: BlogPostItem | null;
  allPosts: BlogPostItem[];
  onClose: () => void;
  onSelectPost: (post: BlogPostItem) => void;
  onOpenContact?: (serviceTitle?: string, message?: string) => void;
}

export const BlogModal: React.FC<BlogModalProps> = ({
  post,
  allPosts,
  onClose,
  onSelectPost,
  onOpenContact
}) => {
  const [likes, setLikes] = useState<number>(post?.likes || 0);
  const [hasLiked, setHasLiked] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Sync state when active post changes
  useEffect(() => {
    if (post) {
      setLikes(post.likes || 0);
      setHasLiked(false);
      setCopiedLink(false);
      setShareMenuOpen(false);
      setScrollProgress(0);

      // Increment view counter once per modal session
      portfolioStorage.incrementBlogPostViews(post.id);
    }
  }, [post?.id]);

  // Track reading scroll progress inside modal
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const progress = (target.scrollTop / (target.scrollHeight - target.clientHeight)) * 100;
    setScrollProgress(Math.min(100, Math.max(0, progress)));
  };

  if (!post) return null;

  const handleLike = () => {
    if (hasLiked) return;
    const newCount = portfolioStorage.recordBlogPostLike(post.id);
    setLikes(newCount);
    setHasLiked(true);
  };

  const handleCopyLink = () => {
    const url = window.location.origin + window.location.pathname + '#blog-' + post.slug;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleNativeShare = async () => {
    const url = window.location.origin + window.location.pathname + '#blog-' + post.slug;
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.excerpt,
          url
        });
      } catch {
        // Share cancelled or unavailable
      }
    } else {
      setShareMenuOpen((prev) => !prev);
    }
  };

  // Format date and time
  const formattedDate = new Date(post.publishedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const formattedTime = post.publishedTimeFormatted || new Date(post.publishedAt).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });

  // Related articles (same category or recent, excluding current)
  const relatedPosts = allPosts
    .filter((p) => p.id !== post.id && p.published)
    .slice(0, 3);

  // Simple Markdown-to-HTML parser for clean formatted display
  const formatInlineText = (text: string): React.ReactNode => {
    // Replace **bold**, *italic*, and [link](url)
    const parts: React.ReactNode[] = [];
    const linkRegex = /\[(.*?)\]\((.*?)\)/g;
    let lastIndex = 0;
    let match;

    const fullStr = text;
    while ((match = linkRegex.exec(fullStr)) !== null) {
      if (match.index > lastIndex) {
        parts.push(parseBoldItalic(fullStr.slice(lastIndex, match.index)));
      }
      parts.push(
        <a
          key={`link-${match.index}`}
          href={match[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#3dff8f] underline underline-offset-4 hover:text-[#fff1b8] transition-colors"
        >
          {match[1]}
        </a>
      );
      lastIndex = linkRegex.lastIndex;
    }
    if (lastIndex < fullStr.length) {
      parts.push(parseBoldItalic(fullStr.slice(lastIndex)));
    }
    return parts.length > 0 ? parts : text;
  };

  const parseBoldItalic = (raw: string): React.ReactNode => {
    // Bold **text**
    const boldParts = raw.split(/(\*\*.*?\*\*)/g);
    return boldParts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold text-[#fff1b8]">{part.slice(2, -2)}</strong>;
      }
      // Italic *text*
      const italicParts = part.split(/(\*.*?\*)/g);
      return italicParts.map((sub, j) => {
        if (sub.startsWith('*') && sub.endsWith('*')) {
          return <em key={`${i}-${j}`} className="italic text-[#f4fff8]">{sub.slice(1, -1)}</em>;
        }
        return sub;
      });
    });
  };

  const renderFormattedContent = (rawText: string) => {
    const lines = rawText.split('\n');
    let inCodeBlock = false;
    let codeBuffer: string[] = [];

    const elements: React.ReactNode[] = [];

    lines.forEach((line, idx) => {
      const trimmed = line.trim();

      // Code blocks
      if (trimmed.startsWith('```')) {
        if (inCodeBlock) {
          elements.push(
            <pre key={`code-${idx}`} className="p-4 my-4 rounded-xl bg-[#010904] border border-[#3dff8f]/30 overflow-x-auto text-xs font-mono text-[#3dff8f]">
              <code>{codeBuffer.join('\n')}</code>
            </pre>
          );
          codeBuffer = [];
          inCodeBlock = false;
        } else {
          inCodeBlock = true;
        }
        return;
      }

      if (inCodeBlock) {
        codeBuffer.push(line);
        return;
      }

      if (!trimmed) {
        elements.push(<div key={`sp-${idx}`} className="h-3" />);
        return;
      }

      // Markdown Image ![alt](url)
      const imgMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/);
      if (imgMatch) {
        const [, alt, url] = imgMatch;
        elements.push(
          <div key={`img-${idx}`} className="my-6 rounded-2xl overflow-hidden border border-[rgba(240,185,46,0.3)] bg-black/60 shadow-lg">
            <img src={url} alt={alt || 'Article visual illustration'} className="w-full max-h-[500px] object-cover" />
            {alt && <p className="text-center text-xs font-mono text-[#9fbfae] py-2 bg-[#010904]/90 border-t border-white/5">{alt}</p>}
          </div>
        );
        return;
      }

      // Divider ---
      if (trimmed === '---' || trimmed === '***') {
        elements.push(
          <div key={`hr-${idx}`} className="my-8 border-t border-[rgba(240,185,46,0.2)]" />
        );
        return;
      }

      if (trimmed.startsWith('## ')) {
        elements.push(
          <h2
            key={`h2-${idx}`}
            className="text-xl sm:text-2xl font-bold font-serif-heading text-[#fff1b8] mt-8 mb-4 border-b border-[rgba(240,185,46,0.2)] pb-2"
          >
            {trimmed.replace('## ', '')}
          </h2>
        );
        return;
      }

      if (trimmed.startsWith('### ')) {
        elements.push(
          <h3
            key={`h3-${idx}`}
            className="text-lg sm:text-xl font-bold text-[#3dff8f] mt-6 mb-3 flex items-center gap-2"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#3dff8f]" />
            {trimmed.replace('### ', '')}
          </h3>
        );
        return;
      }

      if (trimmed.startsWith('> ')) {
        elements.push(
          <blockquote
            key={`quote-${idx}`}
            className="p-4 sm:p-5 my-6 rounded-2xl bg-gradient-to-r from-[#052e1b]/80 to-[#010904] border-l-4 border-[#3dff8f] text-[#f4fff8] italic text-sm sm:text-base font-serif shadow-[0_0_20px_-8px_rgba(61,255,143,0.3)]"
          >
            {formatInlineText(trimmed.replace('> ', '').replace(/^"|"$/g, ''))}
          </blockquote>
        );
        return;
      }

      if (trimmed.startsWith('- ')) {
        elements.push(
          <li key={`li-${idx}`} className="text-sm sm:text-base text-[#c8e6d4] ml-5 list-disc leading-relaxed my-1.5 marker:text-[#3dff8f]">
            {formatInlineText(trimmed.replace('- ', ''))}
          </li>
        );
        return;
      }

      if (trimmed.match(/^\d+\.\s/)) {
        elements.push(
          <li key={`oli-${idx}`} className="text-sm sm:text-base text-[#c8e6d4] ml-5 list-decimal leading-relaxed my-1.5 marker:text-[#f0b92e] marker:font-bold">
            {formatInlineText(trimmed.replace(/^\d+\.\s/, ''))}
          </li>
        );
        return;
      }

      elements.push(
        <p key={`p-${idx}`} className="text-sm sm:text-base text-[#d8eee1] leading-relaxed my-3 font-sans">
          {formatInlineText(trimmed)}
        </p>
      );
    });

    return elements;
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="blog-post-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
    >
      {/* Reading Progress Indicator at very top */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-white/10 z-50">
        <div
          className="h-full bg-gradient-to-r from-[#3dff8f] via-[#f0b92e] to-[#3dff8f] transition-all duration-150"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <div
        onScroll={handleScroll}
        className="w-full max-w-4xl max-h-[95vh] rounded-[24px] sm:rounded-[32px] bg-[#010904] card-neon-shallow shadow-[0_0_80px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden relative text-[#f4fff8]"
      >
        {/* Sticky Modal Top Bar with Pen on Book Icon & Action controls */}
        <div className="px-4 sm:px-8 py-3.5 sm:py-4 bg-[#021309] border-b border-[rgba(240,185,46,0.2)] flex items-center justify-between shrink-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#0a351e] border border-[#3dff8f]/40 flex items-center justify-center text-[#3dff8f] shadow-[0_0_12px_rgba(61,255,143,0.3)] shrink-0">
              <PenOnBookIcon className="w-4 h-4 text-[#3dff8f]" glow />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#0a351e] text-[#3dff8f] border border-[#3dff8f]/40 font-bold uppercase tracking-wider inline-block">
                {post.category}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Clapping / Like Button */}
            <button
              onClick={handleLike}
              className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                hasLiked
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-[0_0_12px_rgba(244,63,94,0.3)]'
                  : 'bg-[#02140b] text-[#9fbfae] border-white/10 hover:border-rose-400/40 hover:text-rose-300'
              }`}
              title="Like this article"
            >
              <Heart className={`w-3.5 h-3.5 ${hasLiked ? 'fill-rose-400 text-rose-400' : ''}`} />
              <span>{likes}</span>
            </button>

            {/* Share Button */}
            <div className="relative">
              <button
                onClick={handleNativeShare}
                className="p-2 rounded-xl bg-[#02140b] border border-white/10 hover:border-[#3dff8f] text-[#9fbfae] hover:text-[#3dff8f] transition-all cursor-pointer"
                title="Share article"
              >
                <Share2 className="w-4 h-4" />
              </button>

              {/* Share Menu Popup fallback */}
              {shareMenuOpen && (
                <div className="absolute right-0 top-12 w-48 p-2 rounded-2xl bg-[#010a05] border border-[#3dff8f]/40 shadow-2xl z-30 space-y-1 animate-in fade-in">
                  <button
                    onClick={handleCopyLink}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs hover:bg-[#0a351e] text-[#fff1b8] flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-[#3dff8f]" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Link Copied!' : 'Copy Link'}</span>
                  </button>
                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`${post.title} by Boniphace Ndege: ${window.location.origin}#blog-${post.slug}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full text-left px-3 py-2 rounded-xl text-xs hover:bg-[#0a351e] text-[#3dff8f] flex items-center gap-2 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                  <a
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full text-left px-3 py-2 rounded-xl text-xs hover:bg-[#0a351e] text-[#9fbfae] flex items-center gap-2 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>LinkedIn</span>
                  </a>
                </div>
              )}
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-white/70 hover:text-white transition-colors cursor-pointer"
              aria-label="Close article"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Article Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 lg:p-10 space-y-6 sm:space-y-8">
          {/* Article Header & Metadata */}
          <div className="space-y-4">
            <h1
              id="blog-post-title"
              className="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-serif-heading text-[#fff1b8] leading-tight"
            >
              {post.title}
            </h1>

            {/* Author, Date, Formatted Time, and Read Time Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-b border-white/10 py-3 text-xs">
              {/* Author Info */}
              <div className="flex items-center gap-3">
                {post.author.avatar ? (
                  <img
                    src={post.author.avatar}
                    alt={post.author.name}
                    className="w-10 h-10 rounded-full object-cover border border-[#3dff8f]/50 p-0.5 bg-[#010904]"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#0a351e] border border-[#3dff8f] flex items-center justify-center font-bold text-[#3dff8f]">
                    {post.author.name[0]}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-[#fff1b8]">
                    <span>{post.author.name}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#3dff8f]/20 text-[#3dff8f] border border-[#3dff8f]/30">
                      Author
                    </span>
                  </div>
                  <div className="text-[11px] text-[#9fbfae]">
                    {post.author.role || 'Graphic Designer & Digital Creator'}
                  </div>
                </div>
              </div>

              {/* Published Date, Time, and Read Estimate */}
              <div className="flex items-center gap-4 text-[#9fbfae] font-mono text-[11px] flex-wrap">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#f0b92e]" />
                  <span>{formattedDate}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#3dff8f]" />
                  <span>{formattedTime}</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/5 border border-white/10">
                  <span>{post.readTimeMinutes} min read</span>
                </div>
                <div className="flex items-center gap-1.5 text-[#9fbfae]">
                  <Eye className="w-3.5 h-3.5" />
                  <span>{post.views || 0} views</span>
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic Cover Image with automatic aspect ratio support */}
          {post.coverImage && (
            <div className="w-full rounded-2xl sm:rounded-3xl overflow-hidden border border-[rgba(240,185,46,0.3)] bg-black shadow-2xl relative">
              <div
                className="w-full flex items-center justify-center bg-[#010a05]"
                style={{ aspectRatio: getCssAspectRatio(post.aspectRatio || '16:9') }}
              >
                <img
                  src={post.coverImage}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded bg-black/80 font-mono text-[10px] text-[#3dff8f] border border-white/20">
                Ratio: {post.aspectRatio || '16:9'}
              </div>
            </div>
          )}

          {/* Excerpt Summary Box */}
          {post.excerpt && (
            <div className="p-4 sm:p-5 rounded-2xl bg-[#02140b] border border-[#3dff8f]/30 space-y-1 shadow-[0_0_15px_-5px_rgba(61,255,143,0.2)]">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#3dff8f] uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-[#3dff8f]" />
                <span>Executive Summary</span>
              </div>
              <div className="text-sm sm:text-base text-[#f4fff8] leading-relaxed italic">
                &ldquo;{formatTextWithLinks(post.excerpt)}&rdquo;
              </div>
            </div>
          )}

          {/* Attached Article External Link / Resource */}
          {post.linkUrl && (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#032013] via-[#02150c] to-[#010904] border border-[#3dff8f]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[0_0_20px_-8px_rgba(61,255,143,0.3)]">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#0a351e] border border-[#3dff8f]/50 flex items-center justify-center text-[#3dff8f] shrink-0 shadow-[0_0_12px_rgba(61,255,143,0.3)]">
                  <ExternalLink className="w-5 h-5 text-[#3dff8f]" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[#9fbfae] font-bold">
                    Referenced Resource / Link
                  </div>
                  <div className="text-sm font-bold text-[#fff1b8] truncate">
                    {post.linkTitle || 'Explore External Link'}
                  </div>
                  <div className="text-xs text-[#3dff8f] truncate font-mono opacity-80">
                    {post.linkUrl}
                  </div>
                </div>
              </div>
              <a
                href={post.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-black bg-gradient-to-r from-[#3dff8f] to-[#fff1b8] hover:brightness-110 transition-all flex items-center justify-center gap-2 shrink-0 shadow-[0_0_15px_rgba(61,255,143,0.35)] cursor-pointer"
              >
                <span>{post.linkTitle || 'Open External Resource'}</span>
                <ExternalLink className="w-3.5 h-3.5 text-black" />
              </a>
            </div>
          )}

          {/* Key Takeaways Card */}
          {post.keyTakeaways && post.keyTakeaways.length > 0 && (
            <div className="p-5 sm:p-6 rounded-2xl bg-[#010904] border border-[rgba(240,185,46,0.3)] space-y-3">
              <h3 className="text-sm font-mono font-bold text-[#fff1b8] flex items-center gap-2 uppercase tracking-wider">
                <Check className="w-4 h-4 text-[#3dff8f]" />
                <span>Key Insights &amp; Takeaways</span>
              </h3>
              <ul className="space-y-2">
                {post.keyTakeaways.map((takeaway, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#c8e6d4]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#f0b92e] mt-1.5 shrink-0" />
                    <span>{takeaway}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Formatted Article Body */}
          <article className="prose prose-invert max-w-none text-sm sm:text-base text-[#d8eee1] leading-relaxed">
            {renderFormattedContent(post.content)}
          </article>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="pt-4 border-t border-white/10 space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono text-[#9fbfae]">
                <Tag className="w-3.5 h-3.5 text-[#3dff8f]" />
                <span>Topic Tags:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="text-xs font-mono px-3 py-1 rounded-full bg-[#0a351e] text-[#3dff8f] border border-[#3dff8f]/30"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Interactive Author Signature & Contact CTA */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-[#052e1b] via-[#02140b] to-[#010904] border border-[rgba(240,185,46,0.35)] flex flex-col sm:flex-row items-center justify-between gap-5 shadow-2xl">
            <div className="flex items-center gap-3.5 text-center sm:text-left">
              {post.author.avatar ? (
                <img
                  src={post.author.avatar}
                  alt={post.author.name}
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-[#3dff8f] p-0.5 shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-[#0a351e] border-2 border-[#3dff8f] flex items-center justify-center text-lg font-bold text-[#3dff8f] shrink-0">
                  {post.author.name[0]}
                </div>
              )}
              <div>
                <h4 className="text-base font-bold font-serif-heading text-[#fff1b8]">
                  Written by {post.author.name}
                </h4>
                <p className="text-xs text-[#9fbfae] mt-0.5">
                  Professional Graphic Designer, Website Developer, and AI Workflow Specialist based in Dodoma, Tanzania.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                onClose();
                if (onOpenContact) {
                  onOpenContact(post.category, `Hello Boniphace, I read your article "${post.title}" and would like to discuss working together.`);
                }
              }}
              className="px-5 py-2.5 rounded-2xl text-xs font-bold text-black bg-gradient-to-r from-[#3dff8f] via-[#fff1b8] to-[#f0b92e] hover:brightness-110 flex items-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(61,255,143,0.35)] shrink-0 active:scale-95 transition-all"
            >
              <MessageSquare className="w-4 h-4 text-black" />
              <span>Discuss a Project</span>
            </button>
          </div>

          {/* Related Articles Carousel/Grid */}
          {relatedPosts.length > 0 && (
            <div className="pt-6 border-t border-white/10 space-y-4">
              <h3 className="text-lg font-bold font-serif-heading text-[#fff1b8] flex items-center gap-2">
                <PenOnBookIcon className="w-5 h-5 text-[#3dff8f]" />
                <span>More Articles &amp; Insights</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {relatedPosts.map((related) => (
                  <button
                    key={related.id}
                    onClick={() => onSelectPost(related)}
                    className="p-3.5 rounded-2xl bg-[#010904] border border-white/10 hover:border-[#3dff8f]/50 hover:bg-[#02140b] text-left transition-all group cursor-pointer flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div
                        className="w-full rounded-xl overflow-hidden bg-black mb-2"
                        style={{ aspectRatio: getCssAspectRatio(related.aspectRatio || '16:9') }}
                      >
                        <img
                          src={related.coverImage}
                          alt={related.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <span className="text-[10px] font-mono text-[#3dff8f] font-bold">
                        {related.category}
                      </span>
                      <h4 className="text-xs font-bold text-[#f4fff8] line-clamp-2 group-hover:text-[#fff1b8]">
                        {related.title}
                      </h4>
                    </div>
                    <div className="text-[10px] text-[#9fbfae] pt-2 flex items-center justify-between border-t border-white/5 mt-2">
                      <span>{related.readTimeMinutes} min read</span>
                      <ChevronRight className="w-3.5 h-3.5 text-[#3dff8f]" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
