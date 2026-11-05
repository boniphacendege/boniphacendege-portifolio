/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Inside Book Reader & Chapter Showcase Modal
 * Offers 6 distinct inside book typography layout designs with:
 * - Best Book Badge & Author Seal
 * - Dynamic chapter navigation with direct typing rendering
 * - Text-to-Speech audio read-aloud narration player (Web Speech API)
 * - Font scaling, distraction-free reading mode, reading progress bar
 * - Downloadable book options (PDF, ePub) & direct WhatsApp order
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Download,
  Share2,
  Heart,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Clock,
  Calendar,
  Layers,
  Sparkles,
  ExternalLink,
  MessageCircle,
  Check,
  Bookmark,
  Sliders,
  Type,
  FileText,
  ShieldCheck,
  Star,
  Eye,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Columns
} from 'lucide-react';
import { BookItem, BookChapter, BookReadingTheme, portfolioStorage } from '../data/portfolioStorage';
import { getCssAspectRatio } from '../utils/imageHelper';
import { PenOnBookIcon } from './PenOnBookIcon';
import { BestBookBadgeIcon } from './BestBookBadgeIcon';
import { downloadBookAsEpub } from '../utils/epubHelper';

interface BookReaderModalProps {
  book: BookItem | null;
  allBooks: BookItem[];
  onClose: () => void;
  onSelectBook: (book: BookItem) => void;
}

const THEME_OPTIONS: Array<{
  id: BookReadingTheme;
  name: string;
  desc: string;
  iconLabel: string;
  bgClass: string;
  textClass: string;
  accentClass: string;
  cardBg: string;
}> = [
  {
    id: 'modern-editorial',
    name: 'Modern Editorial',
    desc: 'Classic serif, elegant drop-caps & warm gold flourishes',
    iconLabel: 'Editorial',
    bgClass: 'bg-[#09140d] text-[#f4fff8]',
    textClass: 'font-serif text-[#f2ede4] leading-relaxed',
    accentClass: 'text-[#f0b92e] border-[#f0b92e]/30',
    cardBg: 'bg-[#051109]'
  },
  {
    id: 'midnight-emerald',
    name: 'Midnight Emerald',
    desc: 'Deep obsidian backdrop with cyber-neon emerald glow',
    iconLabel: 'Emerald',
    bgClass: 'bg-[#010804] text-[#f4fff8]',
    textClass: 'font-sans text-[#e4fbe9] leading-relaxed',
    accentClass: 'text-[#3dff8f] border-[#3dff8f]/40',
    cardBg: 'bg-[#010e06]'
  },
  {
    id: 'minimalist-sans',
    name: 'Minimalist Clean',
    desc: 'Swiss neo-grotesque design with maximum legibility',
    iconLabel: 'Swiss Sans',
    bgClass: 'bg-[#050d08] text-[#f4fff8]',
    textClass: 'font-sans text-[#f0f4f1] leading-relaxed',
    accentClass: 'text-[#84e1bc] border-[#84e1bc]/30',
    cardBg: 'bg-[#020b05]'
  },
  {
    id: 'vintage-parchment',
    name: 'Vintage Parchment',
    desc: 'Warm literary tones, italicized headings & ornate borders',
    iconLabel: 'Parchment',
    bgClass: 'bg-[#121008] text-[#fbf6e8]',
    textClass: 'font-serif text-[#f6eee0] leading-loose',
    accentClass: 'text-[#ffdb70] border-[#ffdb70]/30',
    cardBg: 'bg-[#18150c]'
  },
  {
    id: 'executive-dual',
    name: 'Executive Academic',
    desc: 'Two-column academic spread with marginal annotations',
    iconLabel: 'Dual Column',
    bgClass: 'bg-[#030d07] text-[#f4fff8]',
    textClass: 'font-serif text-[#eef6f0] leading-normal',
    accentClass: 'text-[#3dff8f] border-[#3dff8f]/30',
    cardBg: 'bg-[#020e06]'
  }
];

export const BookReaderModal: React.FC<BookReaderModalProps> = ({
  book,
  allBooks,
  onClose,
  onSelectBook
}) => {
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [readingTheme, setReadingTheme] = useState<BookReadingTheme>(
    book?.readingTheme || 'modern-editorial'
  );
  const [fontSizeLevel, setFontSizeLevel] = useState<'sm' | 'md' | 'lg' | 'xl'>('md');
  const [readingWidth, setReadingWidth] = useState<'standard' | 'wide' | 'focused'>('standard');
  const [scrollProgress, setScrollProgress] = useState(0);
  const [likesCount, setLikesCount] = useState(book?.likesCount || 0);
  const [downloadsCount, setDownloadsCount] = useState(book?.downloadsCount || 0);
  const [hasLiked, setHasLiked] = useState(false);
  const [shareToast, setShareToast] = useState(false);
  const [showChaptersSidebar, setShowChaptersSidebar] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const contentContainerRef = useRef<HTMLDivElement>(null);

  // Stop speech when closing or changing book
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Sync state when book changes
  useEffect(() => {
    if (book) {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsPlayingAudio(false);
      setActiveChapterIndex(0);
      setReadingTheme(book.readingTheme || 'modern-editorial');
      setLikesCount(book.likesCount || 0);
      setDownloadsCount(book.downloadsCount || 0);
      setHasLiked(false);
      portfolioStorage.incrementBookReads(book.id);
      if (contentContainerRef.current) {
        contentContainerRef.current.scrollTop = 0;
      }
    }
  }, [book]);

  // Track reading scroll progress
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const totalHeight = el.scrollHeight - el.clientHeight;
    if (totalHeight > 0) {
      const current = (el.scrollTop / totalHeight) * 100;
      setScrollProgress(Math.min(100, Math.max(0, current)));
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showThemePicker) {
          setShowThemePicker(false);
          return;
        }
        if (showChaptersSidebar) {
          setShowChaptersSidebar(false);
          return;
        }
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
        }
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, showThemePicker, showChaptersSidebar]);

  if (!book) return null;

  const chapters: BookChapter[] = book.chapters && book.chapters.length > 0
    ? book.chapters
    : [
        {
          id: 'sample-ch-1',
          chapterNumber: 1,
          title: 'Introduction & Prologue',
          subtitle: book.subtitle || 'Author Excerpt',
          content: book.samplePreviewText || book.description || book.excerpt
        }
      ];

  const currentChapter = chapters[activeChapterIndex] || chapters[0];
  const activeThemeConfig = THEME_OPTIONS.find((t) => t.id === readingTheme) || THEME_OPTIONS[0];

  const handleLike = () => {
    if (hasLiked) return;
    const updated = portfolioStorage.recordBookLike(book.id);
    setLikesCount(updated);
    setHasLiked(true);
  };

  const handleDownload = async () => {
    const updatedDownloads = portfolioStorage.recordBookDownload(book.id);
    setDownloadsCount(updatedDownloads);

    const targetUrl = book.pdfFileUrl || book.downloadUrl;
    if (targetUrl) {
      try {
        const response = await fetch(targetUrl);
        if (response.ok) {
          const blob = await response.blob();
          const blobUrl = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = `${book.slug || 'book'}-by-dr-boniphace-ndege.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => window.URL.revokeObjectURL(blobUrl), 10000);
          return;
        }
      } catch (err) {
        console.warn('Reader download blob fallback:', err);
      }
      const a = document.createElement('a');
      a.href = targetUrl;
      a.download = `${book.slug || 'book'}-by-dr-boniphace-ndege.pdf`;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      const waUrl = `https://wa.me/255655483255?text=Hello%20Dr.%20Boniphace,%20I%20would%20like%20to%20request%20the%20digital%20copy%20of%20your%20book:%20${encodeURIComponent(book.title)}`;
      window.open(waUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleDownloadEpub = async () => {
    portfolioStorage.recordBookDownload(book.id);
    try {
      await downloadBookAsEpub(book);
    } catch (e) {
      console.error('Reader EPUB download error:', e);
    }
  };

  const handleShare = () => {
    const url = window.location.origin + '#books';
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${book.title} by ${book.author.name} — ${url}`);
      setShareToast(true);
      setTimeout(() => setShareToast(false), 2400);
    }
  };

  // Text-To-Speech read aloud for the current chapter
  const handleToggleSpeech = () => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported on this browser.');
      return;
    }

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    window.speechSynthesis.cancel();
    const textToRead = `${currentChapter.title}. ${currentChapter.subtitle || ''}. ${currentChapter.content}`;
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    setIsPlayingAudio(true);
    window.speechSynthesis.speak(utterance);
  };

  const nextChapter = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingAudio(false);
    if (activeChapterIndex < chapters.length - 1) {
      setActiveChapterIndex((prev) => prev + 1);
      if (contentContainerRef.current) contentContainerRef.current.scrollTop = 0;
    }
  };

  const prevChapter = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingAudio(false);
    if (activeChapterIndex > 0) {
      setActiveChapterIndex((prev) => prev - 1);
      if (contentContainerRef.current) contentContainerRef.current.scrollTop = 0;
    }
  };

  const fontSizeClasses = {
    sm: 'text-sm sm:text-base leading-relaxed',
    md: 'text-base sm:text-lg leading-relaxed',
    lg: 'text-lg sm:text-xl leading-loose',
    xl: 'text-xl sm:text-2xl leading-loose'
  }[fontSizeLevel];

  const readingWidthClasses = {
    standard: 'max-w-3xl',
    wide: 'max-w-4xl',
    focused: 'max-w-2xl'
  }[readingWidth];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reader-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/92 backdrop-blur-md animate-in fade-in"
    >
      {/* Modal Container */}
      <div
        className={`relative w-full ${
          isFullScreen ? 'h-full max-w-full rounded-none' : 'max-w-6xl h-[94vh] rounded-2xl sm:rounded-3xl'
        } card-neon-shallow flex flex-col overflow-hidden transition-all duration-300 ${activeThemeConfig.bgClass}`}
      >
        {/* Top Reading Progress Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-white/10 z-30">
          <div
            className="h-full bg-gradient-to-r from-[#3dff8f] via-[#f0b92e] to-[#3dff8f] transition-all duration-150"
            style={{ width: `${scrollProgress}%` }}
          />
        </div>

        {/* Modal Top Toolbar */}
        <header className="px-3 sm:px-6 py-2.5 sm:py-3 border-b border-white/10 flex items-center justify-between gap-2.5 sm:gap-4 shrink-0 z-20 bg-[#011108]/90 backdrop-blur-md">
          {/* Left: Book Icon, Title, and Chapters Info */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-[#0a351e] to-[#02180d] border border-[#3dff8f]/40 flex items-center justify-center text-[#3dff8f] shadow-[0_0_12px_rgba(61,255,143,0.25)] shrink-0 hidden sm:flex">
              <BookOpen className="w-4 h-4 text-[#3dff8f]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 min-w-0">
                <h2
                  id="reader-modal-title"
                  className="text-xs sm:text-base font-bold font-serif-heading text-[#fff1b8] tracking-wide truncate leading-tight drop-shadow-sm"
                  title={book.title}
                >
                  {book.title}
                </h2>
                {book.isFreeDownload && (
                  <span className="shrink-0 text-[9px] sm:text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#3dff8f]/15 text-[#3dff8f] border border-[#3dff8f]/30">
                    Free Gift
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1 text-[11px] font-mono leading-none flex-nowrap overflow-hidden">
                <span className="text-[#9fbfae] truncate max-w-[140px] sm:max-w-[240px]">
                  By <span className="text-[#f4fff8] font-medium">{book.author.name}</span>
                </span>
                <span className="text-white/25 select-none shrink-0 font-bold">•</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#3dff8f]/10 text-[#3dff8f] border border-[#3dff8f]/25 font-semibold text-[10px] shrink-0 whitespace-nowrap shadow-xs">
                  <Bookmark className="w-2.5 h-2.5 text-[#3dff8f]" />
                  <span>Ch. {activeChapterIndex + 1} of {chapters.length}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Right Toolbar Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Audio Read-Aloud / Narration Toggle */}
            <button
              onClick={handleToggleSpeech}
              className={`p-2 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-mono flex items-center gap-1.5 border transition-all cursor-pointer ${
                isPlayingAudio
                  ? 'bg-[#3dff8f] text-black border-[#3dff8f] animate-pulse font-bold'
                  : 'bg-white/5 text-[#3dff8f] border-[#3dff8f]/30 hover:bg-[#3dff8f]/20'
              }`}
              title={isPlayingAudio ? 'Stop Reading Aloud' : 'Read Chapter Aloud (Narration)'}
            >
              {isPlayingAudio ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              <span className="hidden lg:inline">{isPlayingAudio ? 'Mute' : 'Listen'}</span>
            </button>

            {/* Chapters Drawer Button */}
            <button
              onClick={() => setShowChaptersSidebar((prev) => !prev)}
              className={`p-2 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-mono flex items-center gap-1.5 border transition-all cursor-pointer ${
                showChaptersSidebar
                  ? 'bg-[#f0b92e] text-[#1a1200] border-[#f0b92e] font-bold'
                  : 'bg-white/5 text-[#9fbfae] border-white/10 hover:text-white'
              }`}
              title="Chapter Index"
            >
              <Layers className="w-4 h-4" />
              <span className="hidden md:inline">Chapters</span>
            </button>

            {/* Layout Design / Theme Switcher */}
            <div>
              <button
                onClick={() => setShowThemePicker((prev) => !prev)}
                className={`p-2 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-mono flex items-center gap-1.5 border transition-all cursor-pointer ${
                  showThemePicker
                    ? 'bg-[#3dff8f] text-black border-[#3dff8f] font-bold shadow-[0_0_12px_rgba(61,255,143,0.35)]'
                    : 'bg-white/5 text-[#9fbfae] border-white/10 hover:text-white'
                }`}
                title="Inside Layout & Typography Design"
              >
                <Sliders className="w-4 h-4" />
                <span className="hidden lg:inline">Design</span>
              </button>

              {/* Centered Design UI Card Modal */}
              {showThemePicker && (
                <div
                  className="fixed inset-0 z-50 overflow-y-auto p-3 sm:p-5 bg-black/85 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200"
                  onClick={() => setShowThemePicker(false)}
                >
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="relative w-full max-w-lg my-auto max-h-[min(90vh,620px)] flex flex-col rounded-2xl sm:rounded-3xl bg-[#02140b] border-2 border-[#3dff8f]/70 shadow-[0_0_60px_rgba(0,0,0,0.95),0_0_25px_rgba(61,255,143,0.35)] z-50 overflow-hidden text-xs animate-in zoom-in-95 duration-200"
                  >
                    {/* Header: ALWAYS PINNED at top (shrink-0) */}
                    <div className="shrink-0 px-5 sm:px-6 py-4 bg-[#010e06] border-b border-[rgba(240,185,46,0.25)] flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-[#0a351e] border border-[#3dff8f]/40 flex items-center justify-center text-[#3dff8f] shadow-sm">
                          <Sliders className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="font-serif-heading font-extrabold text-base sm:text-lg text-[#fff1b8] leading-tight">
                            Design
                          </h3>
                          <p className="text-[11px] text-[#9fbfae] font-mono">
                            Select reading typography &amp; layout design
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowThemePicker(false)}
                        className="w-8 h-8 rounded-xl text-[#9fbfae] hover:text-white hover:bg-white/10 transition-colors cursor-pointer flex items-center justify-center text-base font-bold"
                        aria-label="Close Design dialog"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Theme Options list: SCROLLABLE INNER CONTAINER (flex-1 min-h-0 overflow-y-auto) */}
                    <div className="flex-1 min-h-0 overflow-y-auto px-5 sm:px-6 py-3.5 space-y-2.5">
                      {THEME_OPTIONS.map((theme) => {
                        const isSelected = readingTheme === theme.id;
                        return (
                          <button
                            key={theme.id}
                            onClick={() => {
                              setReadingTheme(theme.id);
                              setShowThemePicker(false);
                            }}
                            className={`w-full p-3 sm:p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between group ${
                              isSelected
                                ? 'bg-[#0a351e] border-[#3dff8f] text-[#3dff8f] shadow-[0_0_15px_rgba(61,255,143,0.25)]'
                                : 'bg-white/5 border-white/10 text-[#f4fff8] hover:text-[#fff1b8] hover:bg-white/10 hover:border-[#3dff8f]/40'
                            }`}
                          >
                            <div className="space-y-1 min-w-0 pr-3">
                              <div className="text-xs sm:text-sm font-bold flex items-center gap-2">
                                <span>{theme.name}</span>
                                {isSelected && (
                                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-[#3dff8f]/20 text-[#3dff8f] border border-[#3dff8f]/40 font-bold uppercase tracking-wider">
                                    Active
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-[#9fbfae] leading-relaxed">
                                {theme.desc}
                              </div>
                            </div>
                            <div className="shrink-0">
                              {isSelected ? (
                                <div className="w-6 h-6 rounded-full bg-[#3dff8f] text-black flex items-center justify-center shadow-sm">
                                  <Check className="w-4 h-4 stroke-[3]" />
                                </div>
                              ) : (
                                <div className="w-5 h-5 rounded-full border border-white/20 group-hover:border-[#3dff8f] transition-colors" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Bottom Controls: ALWAYS PINNED at bottom (shrink-0) */}
                    <div className="shrink-0 px-5 sm:px-6 py-3 bg-[#010904] border-t border-[rgba(240,185,46,0.2)] flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono text-[#9fbfae]">Font Size:</span>
                        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10">
                          {(['sm', 'md', 'lg', 'xl'] as const).map((lvl) => (
                            <button
                              key={lvl}
                              onClick={() => setFontSizeLevel(lvl)}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono uppercase cursor-pointer transition-all ${
                                fontSizeLevel === lvl
                                  ? 'bg-[#3dff8f] text-black font-bold shadow-[0_0_8px_rgba(61,255,143,0.4)]'
                                  : 'text-[#9fbfae] hover:text-white hover:bg-white/10'
                              }`}
                            >
                              {lvl}
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={() => setShowThemePicker(false)}
                        className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#fff1b8] via-[#f0b92e] to-[#b8841a] text-[#1a1200] font-bold text-xs hover:brightness-110 active:scale-95 transition-all cursor-pointer ml-auto shadow-md"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Direct Download Buttons (PDF & EPUB) */}
            {(book.isDownloadable || book.pdfFileUrl || book.downloadUrl) && (
              <button
                onClick={handleDownload}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-[#0a351e] text-[#3dff8f] border border-[#3dff8f]/40 hover:bg-[#0d4728] transition-all flex items-center gap-1 cursor-pointer shrink-0"
                title="Download Book PDF"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">PDF</span>
              </button>
            )}

            <button
              onClick={handleDownloadEpub}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-[#142314] text-[#fff1b8] border border-[#f0b92e]/40 hover:bg-[#1a2e1a] transition-all flex items-center gap-1 cursor-pointer shrink-0"
              title="Download Book ePub Publication (E-Readers)"
            >
              <Download className="w-3.5 h-3.5 text-[#f0b92e]" />
              <span className="hidden sm:inline">ePub</span>
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={() => setIsFullScreen((prev) => !prev)}
              className="p-2 rounded-xl text-xs font-mono bg-white/5 hover:bg-white/10 text-[#9fbfae] hover:text-white border border-white/10 hidden sm:flex items-center cursor-pointer"
              title={isFullScreen ? 'Exit Fullscreen' : 'Fullscreen Distraction-Free'}
            >
              {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close Modal Button */}
            <button
              onClick={() => {
                if ('speechSynthesis' in window) {
                  window.speechSynthesis.cancel();
                }
                onClose();
              }}
              className="p-2 rounded-xl text-[#9fbfae] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close reader"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Modal Main Body with optional Chapters Sidebar */}
        <div className="flex-1 flex overflow-hidden relative">
          
          {/* Collapsible Chapters Index Drawer */}
          {showChaptersSidebar && (
            <aside className="w-72 sm:w-80 shrink-0 border-r border-white/10 bg-[#000a04]/95 backdrop-blur-md p-4 sm:p-5 overflow-y-auto space-y-4 z-20 animate-in slide-in-from-left">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="text-xs font-mono font-bold uppercase text-[#fff1b8] flex items-center gap-1.5">
                  <PenOnBookIcon className="w-4 h-4 text-[#3dff8f]" />
                  <span>Table of Contents</span>
                </span>
                <button
                  onClick={() => setShowChaptersSidebar(false)}
                  className="text-xs text-[#9fbfae] hover:text-white"
                >
                  Close
                </button>
              </div>

              <div className="space-y-1.5">
                {chapters.map((ch, idx) => {
                  const isActive = idx === activeChapterIndex;
                  return (
                    <button
                      key={ch.id || idx}
                      onClick={() => {
                        setActiveChapterIndex(idx);
                        setShowChaptersSidebar(false);
                        if (contentContainerRef.current) contentContainerRef.current.scrollTop = 0;
                      }}
                      className={`w-full p-3 rounded-xl text-left transition-all cursor-pointer border ${
                        isActive
                          ? 'bg-[#0a351e] border-[#3dff8f] text-[#3dff8f] shadow-[0_0_15px_rgba(61,255,143,0.18)]'
                          : 'bg-white/5 border-white/5 text-[#9fbfae] hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <div className="text-[10px] font-mono text-[#f0b92e] font-semibold">
                        Chapter {ch.chapterNumber || idx + 1}
                      </div>
                      <div className="text-xs font-bold text-[#f4fff8] line-clamp-1">
                        {ch.title}
                      </div>
                      {ch.subtitle && (
                        <div className="text-[10px] text-[#9fbfae] italic line-clamp-1 mt-0.5">
                          {ch.subtitle}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Publication Specs in Sidebar */}
              <div className="pt-4 border-t border-white/10 space-y-2 text-[11px] font-mono text-[#9fbfae]">
                <div className="text-[#f0b92e] font-bold uppercase text-[10px]">Publication Details</div>
                {book.isbn && <div>ISBN: <span className="text-white">{book.isbn}</span></div>}
                {book.pagesCount && <div>Pages: <span className="text-white">{book.pagesCount}</span></div>}
                <div>Language: <span className="text-white">{book.language || 'English'}</span></div>
                {book.publisher && <div>Press: <span className="text-white">{book.publisher}</span></div>}
              </div>
            </aside>
          )}

          {/* Reading Content Pane */}
          <main
            ref={contentContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto px-4 sm:px-10 py-8 sm:py-12 relative select-text"
          >
            <div className={`mx-auto ${readingWidthClasses} space-y-8`}>
              
              {/* Chapter Header Banner */}
              <div className="text-center space-y-3 pb-6 border-b border-white/10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 font-mono text-xs text-[#f0b92e]">
                  <PenOnBookIcon className="w-3.5 h-3.5 text-[#3dff8f]" />
                  <span>Chapter {currentChapter.chapterNumber || activeChapterIndex + 1}</span>
                </div>

                <h1 className="text-2xl sm:text-4xl font-bold font-serif-heading text-[#fff1b8] leading-tight">
                  {currentChapter.title}
                </h1>

                {currentChapter.subtitle && (
                  <p className="text-sm sm:text-base text-[#3dff8f] font-serif italic max-w-xl mx-auto">
                    {currentChapter.subtitle}
                  </p>
                )}

                {/* Chapter Meta */}
                <div className="flex items-center justify-center gap-4 text-xs font-mono text-[#9fbfae] pt-1">
                  <span>Author: {book.author.name}</span>
                  <span>•</span>
                  <span>Est. {Math.max(1, Math.ceil((currentChapter.content || '').split(/\s+/).length / 200))} min read</span>
                </div>
              </div>

              {/* Direct-Typed Chapter Body Paragraphs */}
              <div className={`${fontSizeClasses} ${activeThemeConfig.textClass} space-y-6 whitespace-pre-line`}>
                {currentChapter.content}
              </div>

              {/* Chapter Navigation Footer */}
              <div className="pt-8 border-t border-white/10 flex items-center justify-between gap-4">
                <button
                  onClick={prevChapter}
                  disabled={activeChapterIndex === 0}
                  className="px-4 py-2.5 rounded-xl text-xs font-mono font-bold bg-white/5 hover:bg-white/10 text-white border border-white/10 disabled:opacity-30 disabled:pointer-events-none flex items-center gap-2 cursor-pointer transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous Chapter</span>
                </button>

                <div className="text-xs font-mono text-[#9fbfae]">
                  {activeChapterIndex + 1} / {chapters.length}
                </div>

                <button
                  onClick={nextChapter}
                  disabled={activeChapterIndex === chapters.length - 1}
                  className="px-4 py-2.5 rounded-xl text-xs font-mono font-bold bg-[#3dff8f] text-black hover:bg-[#34db7a] disabled:opacity-30 disabled:pointer-events-none flex items-center gap-2 cursor-pointer transition-all"
                >
                  <span>Next Chapter</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Author Attribution & Purchase Banner */}
              <div className={`p-6 sm:p-8 rounded-3xl border border-[rgba(240,185,46,0.3)] ${activeThemeConfig.cardBg} space-y-4`}>
                <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                  <img
                    src={book.author.avatar || 'https://via.placeholder.com/80'}
                    alt={book.author.name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-[#f0b92e] p-0.5"
                  />
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <BestBookBadgeIcon size={18} glow={true} />
                      <h4 className="text-base sm:text-lg font-bold text-[#fff1b8]">
                        {book.author.name}
                      </h4>
                    </div>
                    <p className="text-xs text-[#3dff8f] font-mono">
                      {book.author.role || 'Evangelist, Designer & Author'}
                    </p>
                    <p className="text-xs text-[#9fbfae] leading-relaxed">
                      {book.author.bio || book.description}
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-end gap-3 border-t border-white/10">
                  <button
                    onClick={handleLike}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-mono bg-white/5 hover:bg-white/10 text-[#9fbfae] hover:text-white border border-white/10 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Heart className={`w-3.5 h-3.5 ${hasLiked ? 'fill-rose-400 text-rose-400' : ''}`} />
                    <span>{likesCount} Likes</span>
                  </button>

                  <button
                    onClick={handleShare}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-mono bg-white/5 hover:bg-white/10 text-[#9fbfae] hover:text-white border border-white/10 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>{shareToast ? 'Link Copied!' : 'Share Book'}</span>
                  </button>

                  <a
                    href={
                      book.externalBuyUrls?.directWhatsApp ||
                      `https://wa.me/255655483255?text=Hello%20Dr.%20Boniphace,%20I%20am%20reading%20your%20book%20${encodeURIComponent(book.title)}%20and%20would%20like%20to%20order%20the%20physical%20copy`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-[#25D366] text-black hover:bg-[#20ba5c] flex items-center gap-1.5 transition-all shadow-md"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Order Signed Copy on WhatsApp</span>
                  </a>
                </div>
              </div>

            </div>
          </main>
        </div>

      </div>
    </div>
  );
};
