/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Book Preview Slider Modal
 * An interactive sneak-peek sample slider displaying rich previews of the book:
 * - Slide 1: Cover Presentation, Formats (PDF, ePub, Paperback, Kindle) & Publication Specs
 * - Slide 2: Book Synopsis, Core Themes & What You'll Learn
 * - Slide 3: Inside Chapter Sample Sneak-Peek with Font Adjustment & Audio Narration
 * - Slide 4: Table of Contents Outline, Reader Endorsements & Quick Action
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Download,
  ShoppingBag,
  Volume2,
  VolumeX,
  Star,
  Share2,
  Check,
  FileText,
  Clock,
  Sparkles,
  Layers,
  ArrowRight,
  Eye,
  Type,
  Maximize2,
  ExternalLink
} from 'lucide-react';
import { BookItem } from '../data/portfolioStorage';
import { getCssAspectRatio, getFullBookCoverUrl, formatTwoByThreeBookCover } from '../utils/imageHelper';
import { downloadBookAsEpub } from '../utils/epubHelper';
import { formatTextWithLinks } from '../utils/textLinkHelper';

interface BookPreviewSliderModalProps {
  book: BookItem | null;
  isOpen: boolean;
  onClose: () => void;
  onReadInside: (book: BookItem) => void;
  onOrderBook: (book: BookItem, format?: string) => void;
  onToggleAudio?: (e: React.MouseEvent, book: BookItem) => void;
  isNarrating?: boolean;
}

export const BookPreviewSliderModal: React.FC<BookPreviewSliderModalProps> = ({
  book,
  isOpen,
  onClose,
  onReadInside,
  onOrderBook,
  onToggleAudio,
  isNarrating = false
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [copied, setCopied] = useState(false);
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [showFullCoverLightbox, setShowFullCoverLightbox] = useState(false);
  const [epubDownloading, setEpubDownloading] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const touchStartX = useRef<number | null>(null);

  const TOTAL_SLIDES = 4;

  useEffect(() => {
    if (isOpen) {
      setCurrentSlide(0);
      setShowFullCoverLightbox(false);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, book]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        if (showFullCoverLightbox) {
          setShowFullCoverLightbox(false);
        } else {
          onClose();
        }
      }
      if (e.key === 'ArrowRight' && !showFullCoverLightbox) nextSlide();
      if (e.key === 'ArrowLeft' && !showFullCoverLightbox) prevSlide();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentSlide, showFullCoverLightbox]);

  if (!isOpen || !book) return null;

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev < TOTAL_SLIDES - 1 ? prev + 1 : 0));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev > 0 ? prev - 1 : TOTAL_SLIDES - 1));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 50) nextSlide();
    if (diff < -50) prevSlide();
    touchStartX.current = null;
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/#books`;
    const text = `Take a sneak-peek preview of "${book.title}" by ${book.author.name}!\n${url}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleFormatClick = async (format: 'PDF' | 'ePub' | 'Paperback' | 'Kindle') => {
    if (format === 'PDF') {
      if (book.pdfFileUrl || book.downloadUrl) {
        const url = book.pdfFileUrl || book.downloadUrl;
        const link = document.createElement('a');
        link.href = url!;
        link.download = `${book.slug || 'publication'}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setToastMsg('Downloading official PDF publication...');
        setTimeout(() => setToastMsg(null), 3500);
      } else {
        onClose();
        onReadInside(book);
      }
    } else if (format === 'ePub') {
      try {
        setEpubDownloading(true);
        setToastMsg('Generating full ePub e-reader edition...');
        await downloadBookAsEpub(book);
        setToastMsg('ePub volume downloaded successfully!');
        setTimeout(() => setToastMsg(null), 3500);
      } catch (err) {
        console.error('Failed to generate ePub:', err);
        setToastMsg('Preparing order dispatch...');
        setTimeout(() => {
          onClose();
          onOrderBook(book, 'ePub Universal E-Reader Edition');
        }, 1000);
      } finally {
        setEpubDownloading(false);
      }
    } else if (format === 'Paperback') {
      onClose();
      onOrderBook(book, 'Paperback Physical Edition');
    } else if (format === 'Kindle') {
      onClose();
      onOrderBook(book, 'Kindle Edition (Amazon / MOBI)');
    }
  };

  const sampleChapter = book.chapters && book.chapters.length > 0 ? book.chapters[0] : null;

  const SLIDE_TITLES = [
    'Presentation & Formats',
    'Synopsis & Core Themes',
    'Sneak-Peek Chapter Sample',
    'Table of Contents & Orders'
  ];

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="preview-modal-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-5 bg-black/88 backdrop-blur-md animate-in fade-in duration-200"
        onClick={onClose}
      >
        <div
          className="w-full max-w-4xl bg-gradient-to-b from-[#02180d] via-[#010e06] to-[#010804] border border-[#3dff8f]/40 rounded-3xl shadow-[0_0_60px_rgba(0,0,0,0.9),0_0_35px_rgba(61,255,143,0.2)] text-[#f4fff8] relative overflow-hidden flex flex-col max-h-[94vh]"
          onClick={(e) => e.stopPropagation()}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Top Shining Emerald Neon Line */}
          <div aria-hidden="true" className="header-neon-line top-0" />

          {/* Modal Top Header Bar */}
          <div className="px-5 sm:px-8 py-3.5 border-b border-white/10 flex items-center justify-between gap-3 bg-[#01140a]/90 backdrop-blur-md shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-[#02180d] border border-[#3dff8f]/50 text-[#3dff8f] flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(61,255,143,0.3)]">
                <Eye className="w-5 h-5 text-[#3dff8f]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#3dff8f] font-bold px-2 py-0.5 rounded bg-[#3dff8f]/10 border border-[#3dff8f]/30">
                    Sneak-Peek Sample
                  </span>
                  <span className="text-xs text-[#9fbfae] font-mono hidden sm:inline">
                    {book.category}
                  </span>
                </div>
                <h2 id="preview-modal-title" className="text-sm sm:text-base font-bold font-serif-heading text-[#fff1b8] truncate">
                  {book.title}
                </h2>
              </div>
            </div>

            {/* Right Header Toolbar */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Slide Index Badge */}
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 font-mono text-xs text-[#9fbfae]">
                <span className="text-[#3dff8f] font-bold">{currentSlide + 1}</span>
                <span>/</span>
                <span>{TOTAL_SLIDES}</span>
              </div>

              {/* Share Sneak Peek */}
              <button
                onClick={handleShare}
                className="p-2 rounded-xl bg-white/5 border border-white/10 hover:border-[#3dff8f]/50 text-[#9fbfae] hover:text-[#3dff8f] transition-all cursor-pointer"
                title="Share Sneak Peek"
              >
                {copied ? <Check className="w-4 h-4 text-[#3dff8f]" /> : <Share2 className="w-4 h-4" />}
              </button>

              {/* Close */}
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-white/5 border border-white/10 hover:border-red-500/50 text-[#9fbfae] hover:text-white transition-all cursor-pointer"
                aria-label="Close preview"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Slide Title Indicator Bar */}
          <div className="px-5 sm:px-8 py-2 bg-[#021008] border-b border-white/5 flex items-center justify-between text-xs font-mono text-[#9fbfae]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#3dff8f] shadow-[0_0_6px_#3dff8f]" />
              <span className="text-[#3dff8f] font-bold">Slide {currentSlide + 1}:</span>
              <span className="text-[#f4fff8]">{SLIDE_TITLES[currentSlide]}</span>
            </div>

            <div className="flex items-center gap-1 text-[11px] text-[#9fbfae]">
              <span className="hidden sm:inline">Use arrows to navigate</span>
            </div>
          </div>

          {/* Slider Main Viewport */}
          <div className="p-4 sm:p-7 overflow-y-auto flex-1 min-h-[380px] sm:min-h-[440px] flex flex-col justify-center">
            
            {/* SLIDE 0: Book Presentation, Formats & Publication Specs */}
            {currentSlide === 0 && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-7 items-center animate-in fade-in duration-300">
                {/* Full or Complete Book Image Display (No Half-Cropping) */}
                <div className="md:col-span-5 flex flex-col items-center justify-center">
                  <div
                    className="relative group cursor-pointer w-full max-w-[210px] sm:max-w-[240px] md:max-w-[260px] mx-auto"
                    onClick={() => setShowFullCoverLightbox(true)}
                    title="Click to view complete full-resolution book cover"
                  >
                    {/* Subtle 3D Book Container with Real Uncropped Framing */}
                    <div className="relative rounded-2xl overflow-hidden border-2 border-[#f0b92e]/60 shadow-[0_20px_45px_rgba(0,0,0,0.95),0_0_30px_rgba(240,185,46,0.25)] bg-[#010904] flex items-center justify-center p-1.5 sm:p-2 transition-transform duration-300 group-hover:scale-103">
                      
                      {/* Realistic 3D spine & light accents */}
                      <div className="absolute inset-y-0 left-0 w-4 bg-gradient-to-r from-black/85 via-black/40 to-transparent pointer-events-none z-10" />
                      <div className="absolute inset-y-0 left-4 w-0.5 bg-white/20 blur-[0.5px] pointer-events-none z-10" />
                      <div className="absolute inset-y-0 right-0 w-2.5 bg-gradient-to-l from-white/10 to-transparent pointer-events-none z-10" />

                      {/* Book Cover Image: Completely uncropped with object-contain */}
                      <img
                        src={getFullBookCoverUrl(book.coverImage)}
                        alt={`Complete Book Cover: ${book.title}`}
                        className="w-full h-auto max-h-[350px] sm:max-h-[410px] object-contain rounded-xl z-5 drop-shadow-[0_12px_24px_rgba(0,0,0,0.9)]"
                      />

                      {/* Hover Overlay with View Full Cover CTA */}
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-3 text-center z-20">
                        <div className="w-10 h-10 rounded-full bg-[#3dff8f] text-black flex items-center justify-center shadow-[0_0_20px_#3dff8f]">
                          <Maximize2 className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                          View Full Complete Cover
                        </span>
                        <span className="text-[10px] text-[#3dff8f]">
                          Uncropped 100% Full Artwork
                        </span>
                      </div>
                    </div>

                    {/* Badge below cover confirming full uncropped display */}
                    <div className="flex items-center justify-between gap-1 mt-2.5 px-1">
                      <span className="text-[10px] font-mono text-[#3dff8f] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#02180d] border border-[#3dff8f]/40 flex items-center gap-1 shadow-xs">
                        <Check className="w-3 h-3 text-[#3dff8f]" />
                        <span>Complete Book Image</span>
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowFullCoverLightbox(true);
                        }}
                        className="text-[10px] font-mono text-[#f0b92e] hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Maximize2 className="w-3 h-3" />
                        <span>Zoom Full</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Book Details */}
                <div className="md:col-span-7 space-y-3.5">
                  <div>
                    <span className="text-xs font-mono text-[#3dff8f] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-[#3dff8f]/10 border border-[#3dff8f]/30 inline-block">
                      {book.category}
                    </span>
                    <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold font-serif-heading text-[#fff1b8] leading-tight mt-1.5">
                      {book.title}
                    </h3>
                    {book.subtitle && (
                      <p className="text-xs sm:text-sm text-[#9fbfae] italic mt-1 leading-snug">
                        {book.subtitle}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="text-[#f4fff8] font-bold">Author: {book.author.name}</span>
                    <span>•</span>
                    <span className="text-[#9fbfae]">{new Date(book.publishedAt).getFullYear()}</span>
                    <span>•</span>
                    <span className="text-[#3dff8f]">{book.pagesCount || 284} Pages</span>
                  </div>

                  {/* Specification Chips */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-0.5 text-xs font-mono">
                    <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                      <span className="text-[10px] text-[#9fbfae] block">Pages</span>
                      <span className="text-[#3dff8f] font-bold">{book.pagesCount || 284} Pages</span>
                    </div>
                    <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                      <span className="text-[10px] text-[#9fbfae] block">Language</span>
                      <span className="text-[#f4fff8] font-bold">{book.language || 'English'}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                      <span className="text-[10px] text-[#9fbfae] block">ISBN Code</span>
                      <span className="text-[#fff1b8] font-bold truncate block">{book.isbn || '978-9987-04-102-3'}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                      <span className="text-[10px] text-[#9fbfae] block">Rating</span>
                      <span className="text-[#f0b92e] font-bold flex items-center gap-1">
                        <Star className="w-3 h-3 fill-[#f0b92e]" />
                        {book.rating || 4.96} / 5.0
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-white/5 border border-white/10 col-span-2 sm:col-span-2">
                      <span className="text-[10px] text-[#9fbfae] block">Publisher</span>
                      <span className="text-[#f4fff8] truncate block">{book.publisher || 'Ndege Masterclass Press, Dodoma'}</span>
                    </div>
                  </div>

                  {/* Available Delivery Formats: PDF, ePub, Paperback, Kindle */}
                  <div className="pt-1">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-mono uppercase tracking-wider text-[#3dff8f] font-bold flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#f0b92e]" />
                        <span>Available Delivery Formats:</span>
                      </span>
                      <span className="text-[10px] font-mono text-[#9fbfae]">Click format to select</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {/* 1. PDF */}
                      <button
                        type="button"
                        onClick={() => handleFormatClick('PDF')}
                        className="p-2.5 rounded-xl bg-[#01140a] hover:bg-[#022412] border border-[#3dff8f]/40 hover:border-[#3dff8f] transition-all text-left cursor-pointer group shadow-sm active:scale-95"
                        title="Download or Read PDF Format"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono font-bold text-xs text-[#3dff8f] flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5" />
                            <span>PDF</span>
                          </span>
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#3dff8f]/20 text-[#3dff8f] font-bold">
                            {book.isFreeDownload ? 'Free' : `$${book.price || 18.5}`}
                          </span>
                        </div>
                        <span className="text-[10px] text-[#9fbfae] block leading-tight">Digital &amp; Web Reader</span>
                      </button>

                      {/* 2. ePub */}
                      <button
                        type="button"
                        onClick={() => handleFormatClick('ePub')}
                        disabled={epubDownloading}
                        className="p-2.5 rounded-xl bg-[#01140a] hover:bg-[#022412] border border-[#3dff8f]/40 hover:border-[#3dff8f] transition-all text-left cursor-pointer group shadow-sm disabled:opacity-50 active:scale-95"
                        title="Download ePub Format for e-readers"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono font-bold text-xs text-[#3dff8f] flex items-center gap-1">
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>ePub</span>
                          </span>
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold">
                            E-Reader
                          </span>
                        </div>
                        <span className="text-[10px] text-[#9fbfae] block leading-tight">
                          {epubDownloading ? 'Exporting...' : 'Apple & Android'}
                        </span>
                      </button>

                      {/* 3. Paperback */}
                      <button
                        type="button"
                        onClick={() => handleFormatClick('Paperback')}
                        className="p-2.5 rounded-xl bg-[#01140a] hover:bg-[#022412] border border-[#f0b92e]/40 hover:border-[#f0b92e] transition-all text-left cursor-pointer group shadow-sm active:scale-95"
                        title="Order Physical Paperback Edition via WhatsApp"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono font-bold text-xs text-[#f0b92e] flex items-center gap-1">
                            <Layers className="w-3.5 h-3.5" />
                            <span>Paperback</span>
                          </span>
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#f0b92e]/20 text-[#fff1b8] font-bold">
                            Print
                          </span>
                        </div>
                        <span className="text-[10px] text-[#9fbfae] block leading-tight">Courier Shipped</span>
                      </button>

                      {/* 4. Kindle */}
                      <button
                        type="button"
                        onClick={() => handleFormatClick('Kindle')}
                        className="p-2.5 rounded-xl bg-[#01140a] hover:bg-[#022412] border border-[#3dff8f]/40 hover:border-[#3dff8f] transition-all text-left cursor-pointer group shadow-sm active:scale-95"
                        title="Order Amazon Kindle Edition"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono font-bold text-xs text-[#3dff8f] flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Kindle</span>
                          </span>
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                            Amazon
                          </span>
                        </div>
                        <span className="text-[10px] text-[#9fbfae] block leading-tight">MOBI / Kindle App</span>
                      </button>
                    </div>
                  </div>

                  {/* Primary Action Buttons */}
                  <div className="pt-2 flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onReadInside(book);
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-[#1a1200] bg-gradient-to-b from-[#fff1b8] via-[#f0b92e] to-[#b8841a] hover:from-white hover:to-[#f0b92e] transition-all cursor-pointer shadow-md flex items-center gap-1.5 active:scale-95"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Read Inside Chapters</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOrderBook(book, 'Paperback Physical Edition');
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-[#25D366] bg-[#25D366]/20 border border-[#25D366]/40 hover:bg-[#25D366]/30 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Order Direct (WhatsApp)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowFullCoverLightbox(true)}
                      className="px-3 py-2 rounded-xl text-xs font-mono text-[#9fbfae] hover:text-[#3dff8f] bg-white/5 border border-white/10 hover:border-[#3dff8f]/40 transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">View Full Cover</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* SLIDE 1: Synopsis & Core Themes */}
            {currentSlide === 1 && (
              <div className="space-y-6 max-w-2xl mx-auto animate-in fade-in duration-300">
                <div className="p-4 sm:p-6 rounded-2xl bg-[#02140b] border border-[#3dff8f]/30 relative shadow-lg">
                  <span className="text-4xl text-[#3dff8f]/40 font-serif leading-none absolute top-3 left-4">&ldquo;</span>
                  <p className="text-sm sm:text-base text-[#f4fff8] italic leading-relaxed pl-6 relative z-10">
                    {book.excerpt}
                  </p>
                  <div className="mt-3 text-right">
                    <span className="text-xs font-mono text-[#3dff8f] font-semibold">
                      — From the Official Preface by {book.author.name}
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-mono uppercase tracking-wider text-[#3dff8f] font-bold mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#3dff8f]" />
                    <span>Book Synopsis &amp; Author Overview</span>
                  </h4>
                  <div className="text-xs sm:text-sm text-[#c8e2d4] leading-relaxed whitespace-pre-line">
                    {formatTextWithLinks(book.description)}
                  </div>
                  {book.linkUrl && (
                    <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center gap-2">
                      <span className="text-[11px] font-mono text-[#9fbfae]">Resource Link:</span>
                      <a
                        href={book.linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold text-[#f0b92e] bg-[#0a1805] border border-[#f0b92e]/40 hover:border-[#f0b92e] transition-all shadow-sm"
                      >
                        <span>{book.linkTitle || 'Visit Book Companion Link'}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>

                {/* What You Will Learn / Key Themes */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                  <span className="text-xs font-mono font-bold text-[#fff1b8] block">
                    Core Themes Explored Inside:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#9fbfae]">
                    <div className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-[#3dff8f] shrink-0 mt-0.5" />
                      <span>Structural design discipline over fleeting trends.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-[#3dff8f] shrink-0 mt-0.5" />
                      <span>High-performance mobile UX for African markets.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-[#3dff8f] shrink-0 mt-0.5" />
                      <span>Human integrity in generative AI workflows.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-[#3dff8f] shrink-0 mt-0.5" />
                      <span>Purpose-driven leadership and lasting brand equity.</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SLIDE 2: Inside Chapter Sample Sneak-Peek */}
            {currentSlide === 2 && (
              <div className="space-y-4 max-w-2xl mx-auto animate-in fade-in duration-300">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div>
                    <span className="text-[10px] font-mono text-[#3dff8f] uppercase font-bold">
                      Chapter 1 Excerpt
                    </span>
                    <h4 className="text-base sm:text-lg font-bold font-serif-heading text-[#fff1b8]">
                      {sampleChapter ? sampleChapter.title : 'Chapter Sneak Peek'}
                    </h4>
                    {sampleChapter?.subtitle && (
                      <p className="text-xs text-[#9fbfae] italic">{sampleChapter.subtitle}</p>
                    )}
                  </div>

                  {/* Font Scaling & Audio */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {onToggleAudio && (
                      <button
                        onClick={(e) => onToggleAudio(e, book)}
                        className={`p-2 rounded-xl text-xs font-mono flex items-center gap-1.5 border transition-all cursor-pointer ${
                          isNarrating
                            ? 'bg-[#3dff8f] text-black border-[#3dff8f] animate-pulse font-bold'
                            : 'bg-white/5 text-[#3dff8f] border-[#3dff8f]/40 hover:bg-[#3dff8f]/10'
                        }`}
                        title={isNarrating ? 'Stop Audio' : 'Listen to Excerpt'}
                      >
                        {isNarrating ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                        <span className="hidden sm:inline">{isNarrating ? 'Stop' : 'Listen'}</span>
                      </button>
                    )}

                    <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-0.5 text-xs font-mono">
                      <button
                        onClick={() => setFontSize('sm')}
                        className={`px-2 py-1 rounded-lg ${fontSize === 'sm' ? 'bg-[#3dff8f] text-black font-bold' : 'text-[#9fbfae]'}`}
                      >
                        A-
                      </button>
                      <button
                        onClick={() => setFontSize('md')}
                        className={`px-2 py-1 rounded-lg ${fontSize === 'md' ? 'bg-[#3dff8f] text-black font-bold' : 'text-[#9fbfae]'}`}
                      >
                        A
                      </button>
                      <button
                        onClick={() => setFontSize('lg')}
                        className={`px-2 py-1 rounded-lg ${fontSize === 'lg' ? 'bg-[#3dff8f] text-black font-bold' : 'text-[#9fbfae]'}`}
                      >
                        A+
                      </button>
                    </div>
                  </div>
                </div>

                {/* Sample Content Reading Body */}
                <div
                  className={`p-4 sm:p-6 rounded-2xl bg-[#010c06] border border-white/10 leading-relaxed max-h-[260px] overflow-y-auto space-y-3 font-serif ${
                    fontSize === 'sm'
                      ? 'text-xs sm:text-sm'
                      : fontSize === 'md'
                      ? 'text-sm sm:text-base'
                      : 'text-base sm:text-lg'
                  } text-[#e8f5ee]`}
                >
                  {sampleChapter?.content ? (
                    sampleChapter.content.split('\n\n').map((para, idx) => (
                      <p key={idx} className="leading-relaxed">
                        {para}
                      </p>
                    ))
                  ) : (
                    <p className="italic text-[#9fbfae]">
                      &ldquo;{book.excerpt}&rdquo;
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs font-mono text-[#9fbfae] pt-1">
                  <span>Want to keep reading the full volume?</span>
                  <button
                    onClick={() => {
                      onClose();
                      onReadInside(book);
                    }}
                    className="text-[#3dff8f] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <span>Open Full Reader</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* SLIDE 3: Table of Contents & Quick Order */}
            {currentSlide === 3 && (
              <div className="space-y-5 max-w-2xl mx-auto animate-in fade-in duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-base sm:text-lg font-bold font-serif-heading text-[#fff1b8]">
                      Table of Contents
                    </h4>
                    <p className="text-xs text-[#9fbfae] font-mono">
                      {book.chapters?.length || 3} Core Chapters in this edition
                    </p>
                  </div>
                  <div className="text-xs font-mono text-[#3dff8f]">
                    {book.isFreeDownload ? 'Free Digital Copy' : `$${book.price || 18.50} ${book.currency || 'USD'}`}
                  </div>
                </div>

                {/* Chapter Listing */}
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {(book.chapters && book.chapters.length > 0 ? book.chapters : [
                    { id: '1', chapterNumber: 1, title: 'Introduction & Foundations', subtitle: 'Setting the stage for distinction' },
                    { id: '2', chapterNumber: 2, title: 'Core Architectural Disciplines', subtitle: 'Deep structural execution' },
                    { id: '3', chapterNumber: 3, title: 'The African Canvas & Mobile Realities', subtitle: 'Engineering for high impact' }
                  ]).map((chap) => (
                    <div
                      key={chap.id}
                      className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-[#3dff8f]/40 transition-colors flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-6 h-6 rounded-lg bg-[#02180d] border border-[#3dff8f]/40 text-[#3dff8f] flex items-center justify-center font-mono font-bold shrink-0">
                          {chap.chapterNumber}
                        </span>
                        <div className="min-w-0">
                          <span className="font-semibold text-[#f4fff8] truncate block">
                            {chap.title}
                          </span>
                          {chap.subtitle && (
                            <span className="text-[10px] text-[#9fbfae] truncate block">
                              {chap.subtitle}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-[#3dff8f] shrink-0">
                        Ready
                      </span>
                    </div>
                  ))}
                </div>

                {/* Action Buttons Box */}
                <div className="p-4 rounded-2xl bg-[#02140b] border border-[#3dff8f]/30 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-[#f4fff8] block">
                      Enjoyed the Sneak-Peek?
                    </span>
                    <span className="text-[11px] text-[#9fbfae]">
                      Available in PDF, ePub, Paperback, and Kindle editions.
                    </span>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => {
                        onClose();
                        onReadInside(book);
                      }}
                      className="flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold text-[#1a1200] bg-gradient-to-b from-[#fff1b8] via-[#f0b92e] to-[#b8841a] hover:from-white hover:to-[#f0b92e] transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Read Inside</span>
                    </button>
                    <button
                      onClick={() => {
                        onClose();
                        onOrderBook(book);
                      }}
                      className="flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold text-[#25D366] bg-[#25D366]/20 border border-[#25D366]/40 hover:bg-[#25D366]/30 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Order Edition</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Modal Bottom Navigation Controls */}
          <div className="px-5 sm:px-8 py-3.5 border-t border-white/10 flex items-center justify-between gap-3 bg-[#011007] shrink-0">
            {/* Previous Button */}
            <button
              onClick={prevSlide}
              className="px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-[#3dff8f]/50 hover:bg-[#3dff8f]/10 text-xs font-mono text-[#f4fff8] hover:text-[#3dff8f] transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Previous Slide</span>
            </button>

            {/* Dots Indicator */}
            <div className="flex items-center gap-2">
              {Array.from({ length: TOTAL_SLIDES }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    currentSlide === idx
                      ? 'w-6 bg-[#3dff8f] shadow-[0_0_8px_#3dff8f]'
                      : 'w-2 bg-white/20 hover:bg-white/40'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>

            {/* Next Button */}
            <button
              onClick={nextSlide}
              className="px-3.5 py-2 rounded-xl bg-[#02180d] border border-[#3dff8f]/40 hover:border-[#3dff8f] hover:bg-[#06331a] text-xs font-mono text-[#3dff8f] transition-all flex items-center gap-1.5 cursor-pointer shadow-[0_0_10px_rgba(61,255,143,0.2)]"
            >
              <span className="hidden sm:inline">{currentSlide === TOTAL_SLIDES - 1 ? 'Start Over' : 'Next Slide'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Full Complete Book Cover Lightbox Modal (Zero Cropping) */}
      {showFullCoverLightbox && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-6 bg-black/94 backdrop-blur-lg animate-in fade-in duration-200"
          onClick={() => setShowFullCoverLightbox(false)}
        >
          <div
            className="relative max-w-2xl w-full bg-[#010e06] border-2 border-[#f0b92e]/70 rounded-3xl p-4 sm:p-6 shadow-[0_0_80px_rgba(240,185,46,0.35)] flex flex-col items-center max-h-[95vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowFullCoverLightbox(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-[#9fbfae] hover:text-white hover:bg-white/10 cursor-pointer transition-all z-20"
              aria-label="Close full cover"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-full text-center mb-3">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#f0b92e] font-bold px-3 py-1 rounded-full bg-[#f0b92e]/10 border border-[#f0b92e]/30 inline-block mb-1">
                Complete Full Book Cover Artwork
              </span>
              <h3 className="text-base sm:text-xl font-bold font-serif-heading text-[#fff1b8]">
                {book.title}
              </h3>
              <p className="text-xs text-[#9fbfae] font-mono">
                Author: {book.author.name} • {book.category}
              </p>
            </div>

            {/* Complete, uncropped image container */}
            <div className="relative rounded-2xl overflow-hidden border border-white/20 bg-black/90 p-2 sm:p-3 shadow-2xl flex items-center justify-center max-h-[68vh] w-auto">
              <img
                src={getFullBookCoverUrl(book.coverImage)}
                alt={`Complete Full Book Cover: ${book.title}`}
                className="max-h-[64vh] w-auto max-w-full object-contain rounded-xl drop-shadow-[0_15px_30px_rgba(0,0,0,0.95)]"
              />
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-3 w-full">
              <span className="text-[11px] font-mono text-[#3dff8f] flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                <span>100% Complete Uncropped Artwork</span>
              </span>
              <button
                type="button"
                onClick={() => setShowFullCoverLightbox(false)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-mono text-white cursor-pointer transition-all"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Toast Feedback */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-60 flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-[#02180d] border border-[#3dff8f] text-[#3dff8f] text-xs font-mono font-bold shadow-[0_0_30px_rgba(61,255,143,0.4)] animate-in slide-in-from-bottom-5">
          <Check className="w-4 h-4 text-[#3dff8f] shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}
    </>
  );
};
