/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Modern Book Seller & Author Bookstore Page
 * Showcases publications by Ev Dr. Boniphace J. Ndege with:
 * - Best Book Icon & Author Edition Seals
 * - Automatic acceptance of all image aspect ratios (1:1, 2:3, 3:4, 4:5, 5:7, 16:9, etc.)
 * - Author information, published date & time, title, category, text excerpts
 * - Downloadable book options (PDF, ePub), direct URLs, and WhatsApp orders
 * - Audio excerpt read-aloud (SpeechSynthesis)
 * - Format filters, search, sorting, and direct order modal
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  BookOpen,
  Download,
  Search,
  Filter,
  Star,
  ExternalLink,
  MessageCircle,
  FileText,
  Clock,
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  Eye,
  Heart,
  SlidersHorizontal,
  Bookmark,
  Volume2,
  VolumeX,
  Share2,
  Check,
  Layers,
  ShoppingBag,
  Award,
  BookMarked,
  X,
  Send,
  Phone,
  LayoutGrid,
  List,
  Trash2,
  Tag,
  Upload,
  Loader2
} from 'lucide-react';
import { BookItem, portfolioStorage } from '../data/portfolioStorage';
import { getCssAspectRatio, ALL_STANDARD_RATIOS, formatTwoByThreeBookCover, getFullBookCoverUrl, processTradeRatioBookCoverFile } from '../utils/imageHelper';
import { uploadFileToStorage } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { PenOnBookIcon } from './PenOnBookIcon';
import { BestBookBadgeIcon } from './BestBookBadgeIcon';
import { BookPreviewSliderModal } from './BookPreviewSliderModal';
import { downloadBookAsEpub } from '../utils/epubHelper';

interface TiltBookCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

/**
 * Interactive 3D Tilt & Elevation Card with specular sheen following cursor
 */
const TiltBookCard: React.FC<TiltBookCardProps> = ({ children, className = '', onClick }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transformStyle, setTransformStyle] = useState<React.CSSProperties>({
    transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1) translateY(0px)',
    transition: 'transform 0.45s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.45s cubic-bezier(0.23, 1, 0.32, 1), border-color 0.3s ease'
  });
  const [glarePos, setGlarePos] = useState<{ x: number; y: number; opacity: number }>({ x: 50, y: 50, opacity: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Subtle 3D tilt: max ~5.5 degrees
    const rotateX = -((y - centerY) / centerY) * 5.5;
    const rotateY = ((x - centerX) / centerX) * 5.5;

    // Glare position coordinates in percent
    const glareX = Math.round((x / rect.width) * 100);
    const glareY = Math.round((y / rect.height) * 100);

    setTransformStyle({
      transform: `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.028, 1.028, 1.028) translateY(-8px)`,
      transition: 'transform 0.08s ease-out, box-shadow 0.2s ease-out, border-color 0.2s ease-out'
    });
    setGlarePos({ x: glareX, y: glareY, opacity: 1 });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTransformStyle({
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1) translateY(0px)',
      transition: 'transform 0.5s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.5s cubic-bezier(0.23, 1, 0.32, 1), border-color 0.3s ease'
    });
    setGlarePos((prev) => ({ ...prev, opacity: 0 }));
  };

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        ...transformStyle,
        transformStyle: 'preserve-3d',
        willChange: 'transform'
      }}
      className={`relative rounded-3xl ${isHovered ? 'shadow-[0_24px_50px_rgba(0,0,0,0.9),0_0_30px_rgba(61,255,143,0.25)] border-[#3dff8f]/60' : ''} ${className}`}
    >
      {/* Specular glare sheen accent following mouse position */}
      <div
        className="absolute inset-0 rounded-3xl pointer-events-none transition-opacity duration-300 z-30"
        style={{
          opacity: glarePos.opacity,
          background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(61, 255, 143, 0.14) 0%, rgba(240, 185, 46, 0.06) 35%, transparent 70%)`
        }}
      />
      {children}
    </div>
  );
};

interface BooksProps {
  books: BookItem[];
  categories: string[];
  onSelectBook: (book: BookItem) => void;
  onOpenAdmin?: () => void;
  onOpenCategories?: () => void;
  onEditBook?: (bookId: string) => void;
  onDeleteBook?: (bookId: string) => void;
}

export const Books: React.FC<BooksProps> = ({
  books,
  categories,
  onSelectBook,
  onOpenAdmin,
  onOpenCategories,
  onEditBook,
  onDeleteBook
}) => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedFormat, setSelectedFormat] = useState<'all' | 'free' | 'downloadable' | 'physical' | 'amazon'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'featured' | 'newest' | 'rating' | 'downloads' | 'title'>('featured');
  const [viewMode, setViewMode] = useState<'grid' | 'compact'>('grid');
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});
  const [deleteConfirmBook, setDeleteConfirmBook] = useState<BookItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const { isAdmin } = useAuth();
  const [quickUploadingBookId, setQuickUploadingBookId] = useState<string | null>(null);

  const handleQuickUploadBookCover = async (bookId: string, file: File) => {
    setQuickUploadingBookId(bookId);
    showToast('Uploading Cover to Firebase...');
    try {
      const processed = await processTradeRatioBookCoverFile(file);
      let finalUrl = formatTwoByThreeBookCover(processed.dataUrl);
      try {
        const ext = file.type.includes('png') ? 'png' : file.type.includes('webp') ? 'webp' : 'jpg';
        const path = `portfolio/books/cover_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
        const uploadedUrl = await uploadFileToStorage(processed.blob, path, file.type || 'image/jpeg');
        if (uploadedUrl) {
          finalUrl = formatTwoByThreeBookCover(uploadedUrl);
        }
      } catch (storageErr) {
        console.warn('Firebase Storage upload notice for book cover:', storageErr);
      }

      portfolioStorage.updateData((prev) => ({
        ...prev,
        books: (prev.books || []).map((b) =>
          b.id === bookId ? { ...b, coverImage: finalUrl, aspectRatio: '1:1.44' } : b
        )
      }));
      showToast('✓ Cover Attached: Formatted to reduced 1:1.44 ratio with realistic 3D spine and drop shadows!');
    } catch (err: any) {
      console.error('Quick cover upload error:', err);
      showToast('Error uploading book cover: ' + (err.message || 'Unknown error'));
    } finally {
      setQuickUploadingBookId(null);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3800);
  };

  // Audio excerpt narration state (Web Speech API)
  const [speakingBookId, setSpeakingBookId] = useState<string | null>(null);

  // Quick Order / Purchase Modal state
  const [orderModalBook, setOrderModalBook] = useState<BookItem | null>(null);
  const [previewModalBook, setPreviewModalBook] = useState<BookItem | null>(null);
  const [orderFormat, setOrderFormat] = useState('PDF Digital Download');
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerLocation, setBuyerLocation] = useState('');
  const [orderSuccess, setOrderSuccess] = useState(false);

  // Stop audio on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Filtered & Sorted books
  const filteredBooks = useMemo(() => {
    let list = books.filter((b) => b.published !== false);

    // Category filter
    if (selectedCategory !== 'All' && selectedCategory !== 'All Categories') {
      list = list.filter((b) => b.category === selectedCategory);
    }

    // Format filter
    if (selectedFormat === 'free') {
      list = list.filter((b) => b.isFreeDownload || b.price === 0);
    } else if (selectedFormat === 'downloadable') {
      list = list.filter((b) => b.isDownloadable || b.pdfFileUrl || b.downloadUrl);
    } else if (selectedFormat === 'physical') {
      list = list.filter((b) => b.formats?.some((f) => /paperback|hardcover/i.test(f)));
    } else if (selectedFormat === 'amazon') {
      list = list.filter((b) => b.externalBuyUrls?.amazon);
    }

    // Search query filter: filters by title, author, or description
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (b) =>
          (b.title && b.title.toLowerCase().includes(q)) ||
          (b.author?.name && b.author.name.toLowerCase().includes(q)) ||
          (b.description && b.description.toLowerCase().includes(q)) ||
          (b.excerpt && b.excerpt.toLowerCase().includes(q)) ||
          (b.subtitle && b.subtitle.toLowerCase().includes(q)) ||
          (b.category && b.category.toLowerCase().includes(q)) ||
          (b.tags && b.tags.some((t) => t.toLowerCase().includes(q))) ||
          (b.isbn && b.isbn.toLowerCase().includes(q))
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
      if (sortBy === 'rating') {
        return (b.rating || 0) - (a.rating || 0);
      }
      if (sortBy === 'downloads') {
        return (b.downloadsCount || 0) - (a.downloadsCount || 0);
      }
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });
  }, [books, selectedCategory, selectedFormat, searchQuery, sortBy]);

  // Featured masterpiece book for top spotlight (Default: "The Architecture of Distinction" - book-1)
  const [spotlightBookId, setSpotlightBookId] = useState<string>('book-1');

  const featuredBook = useMemo(() => {
    if (spotlightBookId) {
      const found = books.find((b) => b.id === spotlightBookId && b.published !== false);
      if (found) return found;
    }
    return books.find((b) => b.id === 'book-1' && b.published !== false)
      || books.find((b) => b.featured && b.published !== false)
      || books[0];
  }, [books, spotlightBookId]);

  // Likes handler
  const handleLikeCard = (e: React.MouseEvent, bookId: string) => {
    e.stopPropagation();
    if (likedMap[bookId]) return;
    portfolioStorage.recordBookLike(bookId);
    setLikedMap((prev) => ({ ...prev, [bookId]: true }));
  };

  // Direct download handler with blob support, EPUB generation, and instant feedback
  const handleDownloadDirect = async (e: React.MouseEvent, book: BookItem) => {
    e.stopPropagation();
    portfolioStorage.recordBookDownload(book.id);
    const targetUrl = book.pdfFileUrl || book.downloadUrl;
    if (targetUrl) {
      showToast(`Initiating download for "${book.title}" document...`);
      try {
        const response = await fetch(targetUrl);
        if (response.ok) {
          const blob = await response.blob();
          const blobUrl = window.URL.createObjectURL(blob);
          const ext = targetUrl.toLowerCase().includes('.epub') ? 'epub' : 'pdf';
          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = `${book.slug || 'book'}-by-dr-boniphace-ndege.${ext}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => window.URL.revokeObjectURL(blobUrl), 10000);
          showToast(`Downloaded "${book.title}" (${ext.toUpperCase()}) successfully!`);
          return;
        }
      } catch (fetchErr) {
        console.warn('Direct blob download notice, falling back to direct link:', fetchErr);
      }

      // Fallback direct anchor click
      const ext = targetUrl.toLowerCase().includes('.epub') ? 'epub' : 'pdf';
      const a = document.createElement('a');
      a.href = targetUrl;
      a.download = `${book.slug || 'book'}-by-dr-boniphace-ndege.${ext}`;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast(`Downloaded "${book.title}"!`);
    } else {
      // Generate genuine EPUB publication on the fly
      try {
        showToast(`Generating EPUB edition for "${book.title}"...`);
        await downloadBookAsEpub(book);
        showToast(`Generated & downloaded "${book.title}" EPUB!`);
      } catch (epubErr) {
        console.error('EPUB generation error, redirecting to author copy request:', epubErr);
        window.open(
          `https://wa.me/255655483255?text=Hello%20Dr.%20Boniphace,%20I%20would%20like%20to%20request%20the%20digital%20copy%20of%20your%20book:%20${encodeURIComponent(book.title)}`,
          '_blank'
        );
      }
    }
  };

  const handleDownloadEpubDirect = async (e: React.MouseEvent, book: BookItem) => {
    e.stopPropagation();
    portfolioStorage.recordBookDownload(book.id);
    showToast(`Compiling EPUB e-reader edition for "${book.title}"...`);
    try {
      await downloadBookAsEpub(book);
      showToast(`EPUB for "${book.title}" downloaded!`);
    } catch (err: any) {
      console.error('EPUB download error:', err);
      showToast('Error generating EPUB. Please try again.');
    }
  };

  // Delete book confirmation handler
  const handleConfirmDelete = (bookId: string) => {
    const bookTitle = deleteConfirmBook?.title || 'Publication';
    portfolioStorage.deleteBook(bookId);
    showToast(`Book "${bookTitle}" deleted successfully`);
    if (onDeleteBook) {
      onDeleteBook(bookId);
    }
    setDeleteConfirmBook(null);
  };

  // Audio excerpt narration
  const handleToggleAudio = (e: React.MouseEvent, book: BookItem) => {
    e.stopPropagation();
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported on this browser.');
      return;
    }

    if (speakingBookId === book.id) {
      window.speechSynthesis.cancel();
      setSpeakingBookId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const textToSpeak = `${book.title}. By ${book.author.name}. Excerpt: ${book.excerpt}`;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.onend = () => setSpeakingBookId(null);
    utterance.onerror = () => setSpeakingBookId(null);

    setSpeakingBookId(book.id);
    window.speechSynthesis.speak(utterance);
  };

  // Submit direct WhatsApp or inquiry order
  const handleSendOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderModalBook) return;

    const msg = `*NEW BOOK ORDER / INQUIRY*\n\n` +
      `*Book:* ${orderModalBook.title}\n` +
      `*Author:* ${orderModalBook.author.name}\n` +
      `*Selected Format:* ${orderFormat}\n` +
      `*Quantity:* ${orderQuantity}\n` +
      `*Buyer Name:* ${buyerName}\n` +
      `*Phone/WhatsApp:* ${buyerPhone}\n` +
      `*Delivery Location:* ${buyerLocation || 'Digital Delivery'}\n\n` +
      `Sent via Boniphace Ndege Official Bookstore.`;

    const waUrl = `https://wa.me/255655483255?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
    setOrderSuccess(true);
    setTimeout(() => {
      setOrderSuccess(false);
      setOrderModalBook(null);
    }, 2000);
  };

  const allCategories = useMemo(() => {
    const set = new Set(['All']);
    (categories || []).forEach((c) => {
      if (c && c !== 'All Categories') set.add(c);
    });
    (books || []).forEach((b) => {
      if (b.category) set.add(b.category);
    });
    return Array.from(set);
  }, [categories, books]);

  return (
    <section id="books" className="py-20 sm:py-28 px-4 sm:px-6 relative overflow-hidden bg-[#041a0f]/50">
      {/* Background Ambience Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-[#3dff8f]/8 via-[#f0b92e]/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-[1740px] 2xl:max-w-[1860px] mx-auto space-y-12 sm:space-y-16 relative z-10 px-1 sm:px-2">
        
        {/* Modern Author Bookstore Header */}
        <div className="text-center space-y-5 max-w-3xl mx-auto">
          {/* Books Page Icon Badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#02180d] border border-[#3dff8f]/50 shadow-[0_0_20px_rgba(61,255,143,0.35)]">
            <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-[#3dff8f] drop-shadow-[0_0_8px_rgba(61,255,143,0.6)]" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#3dff8f]">
              Official Author Editions · Literary Bookstore
            </span>
          </div>

          <div className="flex items-center justify-center gap-3 sm:gap-4 flex-wrap">
            <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-2xl bg-[#02180d] border border-[#3dff8f]/50 text-[#3dff8f] flex items-center justify-center shadow-[0_0_20px_rgba(61,255,143,0.35)] shrink-0">
              <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-[#3dff8f] drop-shadow-[0_0_10px_rgba(61,255,143,0.7)]" />
            </div>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-bold font-serif-heading text-[#fff1b8] tracking-tight leading-tight">
              Author Bookstore &amp; Publications
            </h2>
          </div>

          <p className="text-sm sm:text-base text-[#9fbfae] leading-relaxed">
            Authored and published by <span className="text-[#3dff8f] font-semibold">Ev Dr. Boniphace J. Ndege</span> — exploring visual identity architecture, spiritual leadership depth, and modern African technology blueprints. Every publication supports direct chapter reading, PDF downloads, and custom WhatsApp orders.
          </p>

          {/* Quick Metrics & Author Seals */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
            <div className="p-3 rounded-2xl bg-[#01140a] border border-[#3dff8f]/20">
              <div className="text-lg sm:text-2xl font-bold font-mono text-[#3dff8f]">
                {books.length}+
              </div>
              <div className="text-[11px] font-mono text-[#9fbfae]">Authored Books</div>
            </div>
            <div className="p-3 rounded-2xl bg-[#01140a] border border-[#f0b92e]/20">
              <div className="text-lg sm:text-2xl font-bold font-mono text-[#f0b92e]">
                4.98<span className="text-xs text-[#9fbfae]">/5</span>
              </div>
              <div className="text-[11px] font-mono text-[#9fbfae]">Verified Reader Rating</div>
            </div>
            <div className="p-3 rounded-2xl bg-[#01140a] border border-[#3dff8f]/20">
              <div className="text-lg sm:text-2xl font-bold font-mono text-[#3dff8f]">
                2,400+
              </div>
              <div className="text-[11px] font-mono text-[#9fbfae]">Downloads &amp; Readers</div>
            </div>
            <div className="p-3 rounded-2xl bg-[#01140a] border border-[#f0b92e]/20">
              <div className="text-lg sm:text-2xl font-bold font-mono text-[#fff1b8]">
                Universal
              </div>
              <div className="text-[11px] font-mono text-[#9fbfae]">PDF, ePub &amp; Print</div>
            </div>
          </div>
        </div>

        {/* Featured Bestseller Spotlight Showcase */}
        {featuredBook && (
          <div className="p-5 sm:p-7 lg:p-8 rounded-3xl bg-gradient-to-br from-[#011409] via-[#021008] to-[#010904] card-neon-shallow relative overflow-hidden flex flex-col justify-center shadow-2xl">
            <div className="header-neon-line top-0" />
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
              
              {/* 3D Book Mockup Display with Reduced 2:3 Ratio Stature */}
              <div className="lg:col-span-4 xl:col-span-3 flex justify-center items-center py-1 sm:py-2">
                <div
                  onClick={() => onSelectBook(featuredBook)}
                  className="relative group cursor-pointer max-w-[195px] sm:max-w-[215px] md:max-w-[230px] w-full"
                >
                  {/* Outer Glow */}
                  <div className="absolute inset-0 bg-[#3dff8f]/20 rounded-2xl blur-2xl group-hover:bg-[#3dff8f]/40 group-hover:scale-110 transition-all duration-500 pointer-events-none" />

                  {/* 3D Realistic Book Perspective Container with Reduced Ratio 1:1.44 & Smooth Scale/Tilt */}
                  <div
                    className="relative w-full rounded-2xl overflow-hidden border-2 border-[rgba(240,185,46,0.6)] group-hover:border-[#3dff8f]/90 shadow-[0_20px_50px_rgba(0,0,0,0.95),0_0_30px_rgba(240,185,46,0.25)] group-hover:shadow-[0_28px_60px_rgba(0,0,0,0.95),0_0_40px_rgba(61,255,143,0.4)] transition-all duration-500 group-hover:-translate-y-2.5 group-hover:scale-105 group-hover:-rotate-1 aspect-[1/1.44]"
                    style={{
                      aspectRatio: '1 / 1.44'
                    }}
                  >
                    {/* Book Cover Image fits automatically top to bottom of view with zero dark or grey margins */}
                    <img
                      src={formatTwoByThreeBookCover(featuredBook.coverImage)}
                      alt={featuredBook.title}
                      className="w-full h-full object-cover"
                    />

                    {/* Book spine highlight & 3D shadow on left edge only */}
                    <div className="absolute inset-y-0 left-0 w-4 bg-gradient-to-r from-black/90 via-black/45 to-transparent pointer-events-none z-10" />
                    <div className="absolute inset-y-0 left-1 w-[1px] bg-white/25 pointer-events-none z-10" />

                    {/* Quick Uploading Cover to Firebase Overlay */}
                    {quickUploadingBookId === featuredBook.id && (
                      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center text-[#3dff8f] p-4 text-center z-30 animate-in fade-in">
                        <Loader2 className="w-8 h-8 animate-spin text-[#3dff8f] mb-2" />
                        <span className="text-xs font-mono font-bold text-white">Uploading Cover to Firebase...</span>
                        <span className="text-[10px] font-mono text-[#3dff8f] mt-1">Formatting to Trade 1:1.44 Ratio</span>
                      </div>
                    )}

                    {/* Look Inside Overlay CTA on Hover */}
                    <div className="absolute inset-0 bg-black/75 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2.5 p-4 text-center z-20">
                      <div className="w-13 h-13 rounded-full bg-gradient-to-r from-[#3dff8f] to-[#0f7a43] text-[#01140a] flex items-center justify-center shadow-[0_0_25px_rgba(61,255,143,0.6)]">
                        <BookOpen className="w-6 h-6" />
                      </div>
                      <span className="text-xs sm:text-sm font-bold font-mono text-[#f4fff8] uppercase tracking-wider">
                        Look Inside / Read Chapters
                      </span>
                      <span className="text-[11px] text-[#3dff8f]">
                        Full reading layout &amp; chapter contents
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Book Information & Metadata Column (Badges cleanly positioned on this side) */}
              <div className="lg:col-span-8 xl:col-span-9 space-y-3 sm:space-y-3.5">
                <div className="flex flex-wrap items-center gap-2">
                  {/* Category: UI/UX & Web Engineering */}
                  <button
                    onClick={() => setSelectedCategory(featuredBook.category)}
                    className="px-3.5 py-1.5 rounded-full bg-[#3dff8f]/15 hover:bg-[#3dff8f]/25 text-[#3dff8f] border border-[#3dff8f]/40 font-mono text-xs uppercase font-bold shadow-[0_0_10px_rgba(61,255,143,0.2)] cursor-pointer transition-all"
                    title="Click to filter catalog by this category"
                  >
                    {featuredBook.category}
                  </button>

                  {/* Price */}
                  <span className="px-3 py-1.5 rounded-full bg-[#f0b92e] text-[#1a1200] font-mono font-bold text-xs uppercase shadow-sm">
                    {featuredBook.isFreeDownload ? 'Free Gift' : `$${featuredBook.price || 18.5}`}
                  </span>

                  {/* Bestseller / Author Masterpiece */}
                  <div className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#02180d] via-[#042816] to-[#02180d] border border-[#f0b92e]/70 text-[#fff1b8] font-mono font-bold text-xs uppercase shadow-[0_0_15px_rgba(240,185,46,0.35)] flex items-center gap-1.5">
                    <BestBookBadgeIcon size={15} glow={true} />
                    <span>{featuredBook.id === 'book-4' ? 'Author Masterpiece' : 'Bestseller'}</span>
                  </div>

                  {/* Cover Attached Badge */}
                  {featuredBook.coverImage && (
                    <div className="px-3 py-1.5 rounded-full bg-[#0a351e] border border-[#3dff8f]/60 text-[#3dff8f] font-mono font-bold text-xs uppercase shadow-[0_0_12px_rgba(61,255,143,0.3)] flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-[#3dff8f]" />
                      <span>✓ Cover Attached</span>
                    </div>
                  )}

                  {/* PDF Attached Badge */}
                  {(featuredBook.pdfFileUrl || featuredBook.downloadUrl) && (
                    <button
                      type="button"
                      onClick={(e) => handleDownloadDirect(e, featuredBook)}
                      className="px-3 py-1.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono font-bold text-xs uppercase flex items-center gap-1.5 hover:bg-amber-500/30 transition-colors cursor-pointer"
                      title="Download attached PDF"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>PDF Attached</span>
                    </button>
                  )}

                  {/* Trade 1:1.44 Ratio Badge */}
                  <button
                    onClick={() => setPreviewModalBook(featuredBook)}
                    className="px-3 py-1.5 rounded-full bg-[#02180d] hover:bg-[#3dff8f]/15 text-[#3dff8f] border border-[#3dff8f]/40 font-mono text-xs font-bold uppercase flex items-center gap-1.5 shadow-sm cursor-pointer transition-all"
                    title="Aspect ratio locked to Trade 1:1.44 - Click to inspect preview"
                  >
                    <Layers className="w-3.5 h-3.5 text-[#3dff8f]" />
                    <span>Trade 1:1.44 Ratio</span>
                  </button>

                  {/* 4 Available Delivery Formats */}
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 font-mono text-xs">
                    <span className="text-[#3dff8f] font-bold text-[11px]">Formats:</span>
                    <span className="text-white font-semibold text-[11px]">PDF · ePub · Paperback · Kindle</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-serif-heading text-[#fff1b8] leading-tight">
                    {featuredBook.title}
                  </h3>
                  {featuredBook.subtitle && (
                    <p className="text-xs sm:text-sm text-[#3dff8f] font-medium italic mt-1">
                      {featuredBook.subtitle}
                    </p>
                  )}
                </div>

                {/* Author attribution with Published Date & Time */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-[#010904] border border-white/10">
                  <div className="flex items-center gap-3">
                    <img
                      src={featuredBook.author.avatar || 'https://via.placeholder.com/60'}
                      alt={featuredBook.author.name}
                      className="w-9 h-9 rounded-full object-cover border border-[#f0b92e]/60 p-0.5"
                    />
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-[#f4fff8] flex items-center gap-1.5">
                        <span>{featuredBook.author.name}</span>
                        <CheckCircle className="w-3.5 h-3.5 text-[#3dff8f]" />
                      </div>
                      <div className="text-[11px] text-[#9fbfae] font-mono">
                        {featuredBook.author.role || 'Book Author & Digital Creator'}
                      </div>
                    </div>
                  </div>

                  <div className="text-right text-[11px] font-mono text-[#9fbfae]">
                    <div className="text-[#f0b92e] font-bold">Published Edition</div>
                    <div className="text-[#f4fff8] font-semibold">
                      {new Date(featuredBook.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      {featuredBook.publishedTimeFormatted && ` · ${featuredBook.publishedTimeFormatted}`}
                    </div>
                  </div>
                </div>

                {/* Excerpt Box */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-[#010904] border border-[rgba(240,185,46,0.35)] text-xs sm:text-sm text-[#9fbfae] leading-relaxed relative shadow-md">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[#f0b92e] font-bold font-mono text-xs uppercase flex items-center gap-1.5">
                      <Bookmark className="w-3.5 h-3.5 text-[#f0b92e]" />
                      <span>Author Excerpt</span>
                    </span>

                    {/* Audio read-aloud excerpt button */}
                    <button
                      onClick={(e) => handleToggleAudio(e, featuredBook)}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-mono flex items-center gap-1.5 transition-colors cursor-pointer border ${
                        speakingBookId === featuredBook.id
                          ? 'bg-[#3dff8f] text-black border-[#3dff8f] animate-pulse font-bold'
                          : 'bg-white/5 text-[#3dff8f] border-[#3dff8f]/30 hover:bg-[#3dff8f]/20'
                      }`}
                      title="Listen to author excerpt"
                    >
                      {speakingBookId === featuredBook.id ? (
                        <>
                          <VolumeX className="w-3.5 h-3.5" />
                          <span>Stop Narration</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>Listen Excerpt</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="italic text-[#f4fff8]/95 font-serif text-sm sm:text-[15px] leading-relaxed">
                    &ldquo;{featuredBook.excerpt}&rdquo;
                  </p>
                </div>

                {/* Formats and Metrics: Author, Pages, Chapters, Reads - All Clickable & Active */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-mono text-[#9fbfae] p-3 rounded-2xl bg-[#010c06] border border-[#3dff8f]/20 shadow-inner">
                  <div className="flex items-center gap-1.5 text-[#f4fff8]">
                    <span className="text-[#9fbfae]">Author:</span>
                    <span className="text-[#3dff8f] font-bold">{featuredBook.author.name}</span>
                  </div>
                  <span className="text-[#f0b92e] font-bold">•</span>
                  <button
                    onClick={() => setPreviewModalBook(featuredBook)}
                    className="hover:text-[#3dff8f] transition-colors cursor-pointer flex items-center gap-1"
                    title="Click to preview 284 pages in 2:3 ratio"
                  >
                    <span>Pages:</span>
                    <span className="text-[#f4fff8] font-bold">{featuredBook.pagesCount || 284}</span>
                  </button>
                  <span className="text-[#f0b92e] font-bold">•</span>
                  <button
                    onClick={() => onSelectBook(featuredBook)}
                    className="hover:text-[#3dff8f] transition-colors cursor-pointer flex items-center gap-1"
                    title="Click to read all 3 chapters in book reader"
                  >
                    <span>Chapters:</span>
                    <span className="text-[#3dff8f] font-bold">{featuredBook.chapters?.length || 3}</span>
                  </button>
                  <span className="text-[#f0b92e] font-bold">•</span>
                  <button
                    onClick={(e) => handleLikeCard(e, featuredBook.id)}
                    className="hover:text-[#f0b92e] transition-colors cursor-pointer flex items-center gap-1 text-[#f0b92e]"
                    title="Click to like and record read"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Reads:</span>
                    <span className="font-bold">{featuredBook.readsCount || 1420}</span>
                  </button>
                  {featuredBook.isbn && (
                    <>
                      <span className="text-[#f0b92e] font-bold">•</span>
                      <div className="text-[11px] text-[#9fbfae]">
                        ISBN: <span className="text-[#f0b92e]">{featuredBook.isbn}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Action Buttons: Including Edit Book & Delete Book */}
                <div className="pt-2 flex flex-wrap items-center gap-3">
                  {/* Edit Book (Not Dormant) */}
                  <button
                    type="button"
                    data-unauth-exempt="true"
                    data-admin-portal="true"
                    data-admin-trigger="true"
                    onClick={() => {
                      if (onEditBook) {
                        onEditBook(featuredBook.id);
                      } else if (onOpenAdmin) {
                        onOpenAdmin();
                      }
                    }}
                    className="px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm bg-gradient-to-r from-[#042816] to-[#063d23] text-[#3dff8f] border-2 border-[#3dff8f] hover:bg-[#3dff8f]/25 hover:shadow-[0_0_25px_rgba(61,255,143,0.5)] shadow-[0_0_15px_rgba(61,255,143,0.3)] flex items-center gap-2 cursor-pointer transition-all active:scale-95"
                    title="Open Admin Dashboard to write chapters, edit specs, upload cover, and manage PDF for this book"
                  >
                    <PenOnBookIcon className="w-4 h-4 text-[#3dff8f]" glow={true} />
                    <span>Edit Book</span>
                  </button>

                  {/* Quick Upload Cover Button (Trade 1:1.44 Ratio) */}
                  <label
                    className={`px-4 py-3 rounded-2xl font-bold text-xs sm:text-sm border flex items-center gap-2 cursor-pointer transition-all active:scale-95 shadow-sm ${
                      quickUploadingBookId === featuredBook.id
                        ? 'bg-[#0a351e] text-[#3dff8f] border-[#3dff8f] animate-pulse cursor-wait'
                        : 'bg-[#01140a] hover:bg-[#0a351e] text-[#3dff8f] border-[#3dff8f]/50 hover:border-[#3dff8f]'
                    }`}
                    title="Upload Book Image & Front Cover (Trade 1:1.44 Ratio) to Firebase"
                  >
                    {quickUploadingBookId === featuredBook.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-[#3dff8f]" />
                    ) : (
                      <Upload className="w-4 h-4 text-[#3dff8f]" />
                    )}
                    <span>
                      {quickUploadingBookId === featuredBook.id
                        ? 'Uploading Cover to Firebase...'
                        : 'Upload Cover (1:1.44 Ratio)'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={quickUploadingBookId === featuredBook.id}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleQuickUploadBookCover(featuredBook.id, f);
                        e.target.value = '';
                      }}
                    />
                  </label>

                  {/* Delete Book */}
                  <button
                    onClick={() => setDeleteConfirmBook(featuredBook)}
                    className="px-4 py-3 rounded-2xl font-bold text-xs sm:text-sm bg-rose-500/15 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 hover:border-rose-500/60 shadow-[0_0_15px_rgba(244,63,94,0.25)] flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                    title={`Delete "${featuredBook.title}" publication`}
                  >
                    <Trash2 className="w-4 h-4 text-rose-400" />
                    <span>Delete Book</span>
                  </button>

                  <button
                    onClick={() => onSelectBook(featuredBook)}
                    className="px-6 py-3 rounded-2xl font-bold text-xs sm:text-sm text-[#1a1200] bg-gradient-to-b from-[#fff1b8] via-[#f0b92e] to-[#b8841a] hover:from-white hover:to-[#f0b92e] shadow-[0_0_20px_-3px_rgba(240,185,46,0.6)] flex items-center gap-2 cursor-pointer transition-all active:scale-95"
                  >
                    <BookOpen className="w-4 h-4 text-[#1a1200]" />
                    <span>Look Inside / Read Chapters</span>
                  </button>

                  {(featuredBook.isDownloadable || featuredBook.pdfFileUrl || featuredBook.downloadUrl) && (
                    <button
                      onClick={(e) => handleDownloadDirect(e, featuredBook)}
                      className="px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm bg-[#0a351e] text-[#3dff8f] border border-[#3dff8f]/50 hover:bg-[#0d4728] transition-all flex items-center gap-2 cursor-pointer shadow-sm"
                      title="Download attached PDF document"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download PDF Attached</span>
                    </button>
                  )}

                  <button
                    onClick={() => setPreviewModalBook(featuredBook)}
                    className="px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm bg-[#02180d] text-[#3dff8f] border border-[#3dff8f]/50 hover:bg-[#3dff8f]/15 hover:border-[#3dff8f] shadow-[0_0_15px_rgba(61,255,143,0.2)] flex items-center gap-2 cursor-pointer transition-all active:scale-95"
                  >
                    <Eye className="w-4 h-4 text-[#3dff8f]" />
                    <span>Preview Sneak-Peek</span>
                  </button>

                  <button
                    onClick={() => {
                      setOrderFormat(`PDF Digital Download ($${featuredBook.price || 18.5})`);
                      setOrderModalBook(featuredBook);
                    }}
                    className="px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/40 hover:bg-[#25D366]/30 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Order Book ($18.5) / WhatsApp</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Search Bar & Category/Genre Filter System */}
        <div className="space-y-4 p-5 sm:p-6 rounded-3xl bg-[#010e06] border border-[#3dff8f]/30 shadow-[0_0_30px_rgba(0,0,0,0.7)]">
          {/* Top Row: Search Bar & Live Counter */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            
            {/* Search Input for Title, Author, or Description */}
            <div className="relative flex-1 max-w-lg">
              <Search className="w-4 h-4 text-[#3dff8f] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter displayed books by title, author, or description..."
                className="w-full pl-11 pr-16 py-3 rounded-2xl bg-[#010703] border border-[#3dff8f]/40 hover:border-[#3dff8f] text-xs sm:text-sm text-[#f4fff8] placeholder:text-[#9fbfae]/70 focus:outline-none focus:border-[#3dff8f] focus:shadow-[0_0_15px_rgba(61,255,143,0.3)] transition-all font-sans"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-[#3dff8f] hover:text-white px-2 py-0.5 rounded bg-white/10"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Results Count & Sort Controls */}
            <div className="flex flex-wrap items-center gap-2.5 justify-end">
              {/* Live Count Badge */}
              <div className="px-3 py-2 rounded-xl bg-[#02180d] border border-[#3dff8f]/40 text-xs font-mono text-[#3dff8f] font-bold">
                Showing {filteredBooks.length} of {books.length} Books
              </div>

              {/* Sort Selector */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#010c06] border border-white/10 text-xs font-mono text-[#9fbfae]">
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#f0b92e]" />
                <span>Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent text-[#f4fff8] font-bold focus:outline-none cursor-pointer"
                >
                  <option value="featured" className="bg-[#010c06] text-white">Featured</option>
                  <option value="newest" className="bg-[#010c06] text-white">Newest Published</option>
                  <option value="rating" className="bg-[#010c06] text-white">Highest Rated</option>
                  <option value="downloads" className="bg-[#010c06] text-white">Most Downloaded</option>
                  <option value="title" className="bg-[#010c06] text-white">Alphabetical (A–Z)</option>
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
                  className="px-3.5 py-2 rounded-xl text-xs font-mono font-bold text-[#f0b92e] bg-[#f0b92e]/10 border border-[#f0b92e]/30 hover:bg-[#f0b92e]/20 transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                  title="Manage books in admin dashboard"
                >
                  <PenOnBookIcon className="w-3.5 h-3.5 text-[#f0b92e]" />
                  <span className="hidden sm:inline">Admin Book Manager</span>
                </button>
              )}
            </div>
          </div>

          {/* Genre / Category Filter System with Live Counts & Direct Category Management */}
          <div className="space-y-2 pt-2 border-t border-white/5">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-[#9fbfae]">
              <span className="flex items-center gap-1.5 text-[#3dff8f] font-bold">
                <Bookmark className="w-3.5 h-3.5 text-[#3dff8f]" />
                <span>Book Categories &amp; Genres:</span>
              </span>
              <div className="flex items-center gap-2.5">
                <span className="text-[11px] text-[#9fbfae]">
                  {allCategories.length - 1} Categories Active
                </span>
                {onOpenCategories && (
                  <button
                    onClick={onOpenCategories}
                    className="text-[11px] font-bold font-mono text-[#f0b92e] hover:text-[#fff1b8] flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#f0b92e]/10 hover:bg-[#f0b92e]/20 border border-[#f0b92e]/30 transition-all cursor-pointer shadow-sm active:scale-95"
                    title="Add, rename or delete book categories in Admin Dashboard"
                  >
                    <Tag className="w-3 h-3 text-[#f0b92e]" />
                    <span>+ Manage Categories</span>
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1.5 select-none no-scrollbar pt-0.5">
              {allCategories.map((cat) => {
                const isSelected = selectedCategory === cat;
                const catCount = cat === 'All'
                  ? books.length
                  : books.filter((b) => b.category === cat).length;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-gradient-to-r from-[#0a351e] via-[#042816] to-[#0a351e] text-[#3dff8f] border border-[#3dff8f] shadow-[0_0_15px_rgba(61,255,143,0.35)] font-bold scale-[1.02]'
                        : 'bg-[#010703] text-[#9fbfae] border border-white/10 hover:border-[#3dff8f]/40 hover:text-white'
                    }`}
                  >
                    <span>{cat}</span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                      isSelected ? 'bg-[#3dff8f] text-black font-bold' : 'bg-white/10 text-[#9fbfae]'
                    }`}>
                      {catCount}
                    </span>
                  </button>
                );
              })}

              {onOpenCategories && (
                <button
                  onClick={onOpenCategories}
                  className="px-3 py-1.5 rounded-xl text-xs font-mono font-medium text-[#f0b92e] bg-[#02140a] hover:bg-[#f0b92e]/15 border border-dashed border-[#f0b92e]/40 hover:border-[#f0b92e] transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0"
                  title="Add or manage book categories in Admin Dashboard"
                >
                  <Tag className="w-3 h-3 text-[#f0b92e]" />
                  <span>+ Add Category</span>
                </button>
              )}
            </div>
          </div>

          {/* Format Quick Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-white/5">
            <span className="text-[11px] font-mono text-[#9fbfae] mr-1">Formats:</span>
            {[
              { id: 'all', label: 'All Formats' },
              { id: 'free', label: 'Free PDF Gifts' },
              { id: 'downloadable', label: 'Instant Downloads' },
              { id: 'physical', label: 'Print / Hardcover' },
              { id: 'amazon', label: 'Amazon Editions' }
            ].map((fmt) => (
              <button
                key={fmt.id}
                onClick={() => setSelectedFormat(fmt.id as any)}
                className={`px-3 py-1 rounded-full text-xs font-mono transition-all cursor-pointer border ${
                  selectedFormat === fmt.id
                    ? 'bg-[#f0b92e] text-[#1a1200] font-bold border-[#f0b92e]'
                    : 'bg-[#010904] text-[#9fbfae] border-white/10 hover:border-white/20'
                }`}
              >
                {fmt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Books Catalog Grid / List */}
        {filteredBooks.length === 0 ? (
          <div className="py-16 text-center space-y-4 p-8 rounded-3xl bg-[#010a05] border border-white/10 shadow-xl">
            <BookOpen className="w-12 h-12 text-[#9fbfae]/40 mx-auto" />
            <h3 className="text-lg font-bold text-[#fff1b8]">No Publications Found</h3>
            <p className="text-xs text-[#9fbfae] max-w-sm mx-auto">
              No books match &ldquo;{searchQuery || selectedCategory}&rdquo;. Try another genre or clear the filters.
            </p>

            {/* Quick category suggestion pills */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2 max-w-lg mx-auto">
              {['All', 'Design', 'Academic', 'Fiction'].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory(suggestion);
                    setSelectedFormat('all');
                  }}
                  className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-[#02180d] hover:bg-[#3dff8f]/20 text-[#3dff8f] border border-[#3dff8f]/40 transition-all cursor-pointer"
                >
                  Browse {suggestion}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
                setSelectedFormat('all');
              }}
              className="mt-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#3dff8f] to-[#0f7a43] text-[#01140a] hover:shadow-[0_0_20px_rgba(61,255,143,0.5)] transition-all cursor-pointer font-mono uppercase tracking-wider"
            >
              Reset All Filters
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
            {filteredBooks.map((book) => {
              const isLiked = likedMap[book.id];
              const isNarrating = speakingBookId === book.id;

              return (
                <TiltBookCard
                  key={book.id}
                  onClick={() => onSelectBook(book)}
                  className="group bg-[#010c06] card-neon-shallow flex flex-col overflow-hidden cursor-pointer"
                >
                  {/* Top glowing line accent on hover */}
                  <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-[#3dff8f] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  {/* Full-Bleed Book Cover Area: Edge-to-Edge Top to Bottom (Trade 1:1.44 Ratio) */}
                  <div className="relative w-full aspect-[1/1.44] overflow-hidden bg-black select-none">
                    <img
                      src={getFullBookCoverUrl(book.coverImage)}
                      alt={book.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />

                    {/* Realistic 3D spine simulation on left edge */}
                    <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/85 via-black/40 to-transparent pointer-events-none z-10" />
                    <div className="absolute inset-y-0 left-0.5 w-[1px] bg-white/20 pointer-events-none z-10" />
                    <div className="absolute inset-0 shadow-[inset_0_0_25px_rgba(0,0,0,0.5)] pointer-events-none z-10" />

                    {/* Quick Uploading Cover to Firebase Overlay */}
                    {quickUploadingBookId === book.id && (
                      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center text-[#3dff8f] p-2 text-center z-30 animate-in fade-in">
                        <Loader2 className="w-6 h-6 animate-spin text-[#3dff8f] mb-1.5" />
                        <span className="text-[10px] font-mono font-bold text-white">Uploading Cover to Firebase...</span>
                        <span className="text-[8px] font-mono text-[#3dff8f] mt-0.5">Trade 1:1.44 Ratio</span>
                      </div>
                    )}
                  </div>

                  {/* Relocated Badges Off Cover Image — Clean Metadata Strip on Other Side */}
                  <div className="px-4 py-2.5 bg-[#02140b] border-y border-white/10 flex flex-wrap items-center justify-between gap-2 z-10">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Category (UI/UX & Web Engineering, etc.) */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCategory(book.category);
                        }}
                        className="text-[#3dff8f] uppercase font-bold text-[9px] px-2 py-0.5 rounded-full bg-[#3dff8f]/10 hover:bg-[#3dff8f]/25 border border-[#3dff8f]/30 hover:border-[#3dff8f] transition-all truncate max-w-[140px] cursor-pointer"
                        title={`Filter catalog by "${book.category}"`}
                      >
                        {book.category}
                      </button>

                      {/* Price Badge ($18.5 or Free Gift) */}
                      <span className="px-2 py-0.5 rounded-full bg-[#f0b92e] text-[#1a1200] font-mono font-bold text-[9px] uppercase shadow-sm">
                        {book.isFreeDownload ? 'Free Gift' : `$${book.price || '18.50'}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* ✓ Cover Attached */}
                      {book.coverImage && (
                        <span className="px-2 py-0.5 rounded-full bg-[#010904] border border-[#3dff8f]/60 text-[#3dff8f] font-mono font-bold text-[9px] uppercase shadow-[0_0_8px_rgba(61,255,143,0.25)] flex items-center gap-1">
                          <CheckCircle className="w-2.5 h-2.5 text-[#3dff8f]" />
                          <span>✓ Cover Attached</span>
                        </span>
                      )}

                      {/* Bestseller */}
                      {(book.featured || book.id === 'book-4') && (
                        <span className="px-2 py-0.5 rounded-full bg-[#010904] border border-[#3dff8f]/60 text-[#3dff8f] font-mono font-bold text-[9px] uppercase shadow-[0_0_8px_rgba(61,255,143,0.3)] flex items-center gap-1">
                          <BestBookBadgeIcon size={11} glow={false} />
                          <span>{book.id === 'book-4' ? 'Author Masterpiece' : 'Bestseller'}</span>
                        </span>
                      )}

                      {/* PDF Attached */}
                      {(book.pdfFileUrl || book.downloadUrl) && (
                        <button
                          onClick={(e) => handleDownloadDirect(e, book)}
                          className="px-2 py-0.5 rounded-full bg-[#010904] hover:bg-[#3dff8f]/20 text-[#3dff8f] border border-[#3dff8f]/60 font-mono font-bold text-[9px] uppercase shadow-[0_0_8px_rgba(61,255,143,0.25)] flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                          title="Click to download attached PDF"
                        >
                          <Download className="w-2.5 h-2.5 animate-bounce" />
                          <span>PDF Attached</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Book Content Body */}
                  <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2.5">
                      {/* Published Date */}
                      <div className="flex items-center justify-between text-[10px] font-mono text-[#9fbfae]">
                        <span className="text-[#3dff8f] font-bold">Trade 1:1.44 Standard</span>
                        <span>
                          {new Date(book.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>

                      {/* Title & Subtitle */}
                      <div>
                        <h3 className="text-base sm:text-lg font-bold font-serif-heading text-[#f4fff8] group-hover:text-[#3dff8f] transition-colors line-clamp-2 leading-snug">
                          {book.title}
                        </h3>

                        {book.subtitle && (
                          <p className="text-xs text-[#9fbfae] italic line-clamp-1 mt-0.5">
                            {book.subtitle}
                          </p>
                        )}
                      </div>

                      {/* Text Excerpt ("show text except") */}
                      <div className="p-3 rounded-xl bg-[#010904] border border-white/10 text-xs text-[#9fbfae] leading-relaxed relative group-hover:border-[#3dff8f]/30 transition-colors">
                        <p className="line-clamp-3 italic">
                          &ldquo;{book.excerpt}&rdquo;
                        </p>
                      </div>

                      {/* Book Specifications chips: ISBN, Pages, Language */}
                      <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-[#9fbfae]">
                        {book.pagesCount && (
                          <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">
                            {book.pagesCount} Pages
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">
                          {book.language || 'English'}
                        </span>
                        {book.chapters && book.chapters.length > 0 && (
                          <span className="px-2 py-0.5 rounded bg-[#3dff8f]/10 text-[#3dff8f] border border-[#3dff8f]/20 font-bold">
                            {book.chapters.length} Typed Chapters
                          </span>
                        )}
                      </div>

                      {/* Available Delivery Formats */}
                      <div className="flex items-center gap-1.5 text-[10px] font-mono">
                        <span className="text-[#3dff8f] font-bold">Formats:</span>
                        <div className="flex flex-wrap gap-1">
                          <span className="px-1.5 py-0.2 rounded bg-white/5 border border-white/10 text-white font-semibold">PDF</span>
                          <span className="px-1.5 py-0.2 rounded bg-white/5 border border-white/10 text-white font-semibold">ePub</span>
                          <span className="px-1.5 py-0.2 rounded bg-[#f0b92e]/10 border border-[#f0b92e]/30 text-[#fff1b8] font-semibold">Paperback</span>
                          <span className="px-1.5 py-0.2 rounded bg-white/5 border border-white/10 text-white font-semibold">Kindle</span>
                        </div>
                      </div>
                    </div>

                    {/* Metadata, Author & Action Footer */}
                    <div className="pt-3 border-t border-white/10 space-y-3">
                      <div className="flex items-center justify-between text-[11px] font-mono text-[#9fbfae]">
                        <div className="flex items-center gap-2">
                          <img
                            src={book.author.avatar || 'https://via.placeholder.com/40'}
                            alt=""
                            className="w-5 h-5 rounded-full object-cover border border-[#f0b92e]"
                          />
                          <span className="truncate max-w-[130px] text-[#f4fff8] font-bold">
                            {book.author.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[#f0b92e]">
                          <Star className="w-3.5 h-3.5 fill-[#f0b92e]" />
                          <span>{book.rating || 4.95}</span>
                          <span className="text-[#9fbfae] text-[10px]">({book.reviewsCount || 24})</span>
                        </div>
                      </div>

                      {/* Action Bar */}
                      <div className="flex items-center justify-between gap-2 pt-1">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onSelectBook(book)}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold text-[#1a1200] bg-gradient-to-b from-[#fff1b8] via-[#f0b92e] to-[#b8841a] hover:from-white hover:to-[#f0b92e] flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
                          >
                            <BookOpen className="w-3.5 h-3.5 text-[#1a1200]" />
                            <span>Read Inside</span>
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewModalBook(book);
                            }}
                            className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-[#02180d] text-[#3dff8f] border border-[#3dff8f]/40 hover:bg-[#3dff8f]/15 hover:border-[#3dff8f] flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_10px_rgba(61,255,143,0.15)] active:scale-95"
                            title={`Preview sneak-peek sample of ${book.title}`}
                          >
                            <Eye className="w-3.5 h-3.5 text-[#3dff8f]" />
                            <span>Preview</span>
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {/* Audio narration button */}
                          <button
                            onClick={(e) => handleToggleAudio(e, book)}
                            className={`p-2 rounded-xl text-xs transition-all cursor-pointer border ${
                              isNarrating
                                ? 'bg-[#3dff8f] text-black border-[#3dff8f] animate-pulse'
                                : 'bg-white/5 text-[#9fbfae] hover:text-[#3dff8f] border-white/10'
                            }`}
                            title={isNarrating ? 'Stop Audio' : 'Listen to Excerpt'}
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Download button if downloadable */}
                          {(book.isDownloadable || book.pdfFileUrl || book.downloadUrl) && (
                            <button
                              onClick={(e) => handleDownloadDirect(e, book)}
                              className="p-2 rounded-xl text-xs bg-white/5 hover:bg-[#0a351e] text-[#9fbfae] hover:text-[#3dff8f] border border-white/10 hover:border-[#3dff8f]/40 transition-all cursor-pointer"
                              title="Download PDF"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Edit Book Button */}
                          <button
                            type="button"
                            data-unauth-exempt="true"
                            data-admin-portal="true"
                            data-admin-trigger="true"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onEditBook) {
                                onEditBook(book.id);
                              } else if (onOpenAdmin) {
                                onOpenAdmin();
                              }
                            }}
                            className="p-2 rounded-xl text-xs bg-[#042415] hover:bg-[#3dff8f]/20 text-[#3dff8f] border border-[#3dff8f]/40 transition-all cursor-pointer"
                            title={`Edit ${book.title} in Admin Dashboard`}
                          >
                            <PenOnBookIcon className="w-3.5 h-3.5 text-[#3dff8f]" glow={false} />
                          </button>

                          {/* Quick Upload Book Cover (Trade 1:1.44 Ratio) */}
                          <label
                            onClick={(e) => e.stopPropagation()}
                            className={`p-2 rounded-xl text-xs border transition-all cursor-pointer flex items-center justify-center ${
                              quickUploadingBookId === book.id
                                ? 'bg-[#0a351e] text-[#3dff8f] border-[#3dff8f] animate-pulse cursor-wait'
                                : 'bg-[#01140a] hover:bg-[#0a351e] text-[#3dff8f] border-[#3dff8f]/40 hover:border-[#3dff8f]'
                            }`}
                            title="Upload Book Image & Front Cover (Trade 1:1.44 Ratio) to Firebase"
                          >
                            {quickUploadingBookId === book.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#3dff8f]" />
                            ) : (
                              <Upload className="w-3.5 h-3.5 text-[#3dff8f]" />
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              disabled={quickUploadingBookId === book.id}
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) handleQuickUploadBookCover(book.id, f);
                                e.target.value = '';
                              }}
                            />
                          </label>

                          {/* Delete Book Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmBook(book);
                            }}
                            className="p-2 rounded-xl text-xs bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition-all cursor-pointer"
                            title={`Delete "${book.title}" publication`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Quick Order Modal Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOrderModalBook(book);
                            }}
                            className="p-2 rounded-xl text-xs bg-[#25D366]/15 text-[#25D366] hover:bg-[#25D366]/30 border border-[#25D366]/30 transition-all cursor-pointer"
                            title="Order book copy"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                          </button>

                          {/* Like Button */}
                          <button
                            onClick={(e) => handleLikeCard(e, book.id)}
                            className={`p-2 rounded-xl text-xs transition-all cursor-pointer ${
                              isLiked
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                                : 'bg-white/5 text-[#9fbfae] hover:text-white border border-white/10'
                            }`}
                            title="Like this publication"
                          >
                            <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-rose-400' : ''}`} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </TiltBookCard>
              );
            })}
          </div>
        ) : (
          /* Compact List View with Subtle Scale-Up & Neon Hover Glow */
          <div className="space-y-4">
            {filteredBooks.map((book) => {
              const isLiked = likedMap[book.id];
              return (
                <article
                  key={book.id}
                  onClick={() => onSelectBook(book)}
                  className="p-4 sm:p-5 rounded-2xl bg-[#010c06] border border-[rgba(240,185,46,0.2)] hover:border-[#3dff8f]/60 hover:shadow-[0_12px_30px_rgba(0,0,0,0.85),0_0_22px_rgba(61,255,143,0.2)] transition-all duration-300 hover:scale-[1.015] hover:-translate-y-1 cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div
                      className="w-16 sm:w-20 rounded-lg overflow-hidden border border-[rgba(240,185,46,0.3)] shrink-0 bg-black aspect-[1/1.44]"
                      style={{
                        aspectRatio: '1 / 1.44'
                      }}
                    >
                      <img src={book.coverImage} alt={book.title} className="w-full h-full object-cover" />
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 text-[10px] font-mono">
                        <span className="text-[#3dff8f] font-bold">{book.category}</span>
                        <span className="text-[#9fbfae]">
                          {new Date(book.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      <h4 className="text-sm sm:text-base font-bold text-[#f4fff8] group-hover:text-[#3dff8f] transition-colors truncate">
                        {book.title}
                      </h4>
                      <p className="text-xs text-[#9fbfae] line-clamp-1 italic max-w-xl">
                        {book.excerpt}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3 shrink-0 self-end sm:self-center">
                    <span className="font-mono text-xs font-bold text-[#f0b92e]">
                      {book.isFreeDownload ? 'Free' : `$${book.price || '18.50'}`}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewModalBook(book);
                      }}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#02180d] text-[#3dff8f] border border-[#3dff8f]/40 hover:bg-[#3dff8f]/20 flex items-center gap-1.5 cursor-pointer shadow-[0_0_8px_rgba(61,255,143,0.15)] active:scale-95"
                      title="Preview sneak-peek"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#3dff8f]" />
                      <span>Preview</span>
                    </button>
                    {/* 4 Action Suite: Edit, Upload, Download, Delete */}
                    <button
                      type="button"
                      data-unauth-exempt="true"
                      data-admin-portal="true"
                      data-admin-trigger="true"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onEditBook) {
                          onEditBook(book.id);
                        } else if (onOpenAdmin) {
                          onOpenAdmin();
                        }
                      }}
                      className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-[#042415] text-[#3dff8f] border border-[#3dff8f]/40 hover:bg-[#3dff8f]/20 flex items-center gap-1 cursor-pointer active:scale-95"
                      title="Edit Book"
                    >
                      <PenOnBookIcon className="w-3.5 h-3.5 text-[#3dff8f]" glow={false} />
                      <span className="hidden md:inline">Edit</span>
                    </button>

                    {/* Quick Upload Cover */}
                    <label
                      onClick={(e) => e.stopPropagation()}
                      className={`p-1.5 rounded-xl text-xs border transition-all cursor-pointer flex items-center justify-center ${
                        quickUploadingBookId === book.id
                          ? 'bg-[#0a351e] text-[#3dff8f] border-[#3dff8f] animate-pulse cursor-wait'
                          : 'bg-[#01140a] hover:bg-[#0a351e] text-[#3dff8f] border-[#3dff8f]/40 hover:border-[#3dff8f]'
                      }`}
                      title="Upload Cover Image (Trade 1:1.44 Ratio)"
                    >
                      {quickUploadingBookId === book.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#3dff8f]" />
                      ) : (
                        <Upload className="w-3.5 h-3.5 text-[#3dff8f]" />
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={quickUploadingBookId === book.id}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleQuickUploadBookCover(book.id, f);
                          e.target.value = '';
                        }}
                      />
                    </label>

                    {/* Download PDF */}
                    <button
                      onClick={(e) => handleDownloadDirect(e, book)}
                      className="p-1.5 rounded-xl text-xs bg-white/5 hover:bg-[#0a351e] text-[#9fbfae] hover:text-[#3dff8f] border border-white/10 hover:border-[#3dff8f]/40 transition-all cursor-pointer"
                      title="Download PDF"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmBook(book);
                      }}
                      className="p-1.5 rounded-xl text-xs bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition-all cursor-pointer"
                      title="Delete publication"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onSelectBook(book)}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#1a1200] bg-[#f0b92e] hover:bg-[#fff1b8] flex items-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Read</span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Author Mission Banner */}
        <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-[#010e06] via-[#02150b] to-[#010e06] border-2 border-[#3dff8f]/30 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left relative overflow-hidden shadow-2xl">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <BestBookBadgeIcon size={18} glow={true} />
              <span className="text-xs font-mono uppercase text-[#f0b92e] font-bold tracking-wider">
                Author Conviction &amp; Dedication
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold font-serif-heading text-[#fff1b8]">
              &ldquo;Books are architecture for the soul. They preserve principles long after trends fade.&rdquo;
            </h3>
            <p className="text-xs text-[#9fbfae]">
              — Ev Dr. Boniphace J. Ndege · Author, Technologist &amp; Evangelist (Dodoma CBD, Tanzania)
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
            <a
              href="https://wa.me/255655483255?text=Hello%20Dr.%20Boniphace,%20I%20would%20like%20to%20inquire%20about%20a%20book%20signing,%20speaking%20invitation,%20or%20bulk%20order"
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-3 rounded-2xl text-xs font-bold bg-[#25D366] text-black hover:bg-[#20ba5c] flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(37,211,102,0.4)]"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Speaking &amp; Bulk Book Orders</span>
            </a>
          </div>
        </div>

      </div>

      {/* Quick Book Order Modal */}
      {orderModalBook && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in"
        >
          <div className="relative w-full max-w-lg rounded-3xl bg-[#02140b] border-2 border-[#f0b92e]/60 shadow-[0_0_50px_rgba(240,185,46,0.3)] p-6 sm:p-8 text-[#f4fff8]">
            <button
              onClick={() => setOrderModalBook(null)}
              className="absolute top-4 right-4 p-2 rounded-xl text-[#9fbfae] hover:text-white hover:bg-white/10 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <BestBookBadgeIcon size={20} glow={true} />
              <span className="text-xs font-mono uppercase text-[#f0b92e] font-bold tracking-wider">
                Direct Author Book Order
              </span>
            </div>

            <h3 className="text-xl font-bold font-serif-heading text-[#fff1b8] mb-1">
              Order: {orderModalBook.title}
            </h3>
            <p className="text-xs text-[#9fbfae] mb-4">
              Order directly from author Ev Dr. Boniphace J. Ndege with pre-filled WhatsApp verification.
            </p>

            {orderSuccess ? (
              <div className="py-8 text-center space-y-2">
                <CheckCircle className="w-12 h-12 text-[#3dff8f] mx-auto animate-bounce" />
                <h4 className="text-base font-bold text-[#fff1b8]">Opening WhatsApp Order...</h4>
                <p className="text-xs text-[#9fbfae]">Thank you for supporting literary excellence.</p>
              </div>
            ) : (
              <form onSubmit={handleSendOrder} className="space-y-4 text-xs font-mono">
                <div>
                  <label className="text-[#3dff8f] block mb-1">Select Delivery Format</label>
                  <select
                    value={orderFormat}
                    onChange={(e) => setOrderFormat(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#010904] border border-white/20 text-white focus:outline-none focus:border-[#3dff8f]"
                  >
                    <option value="PDF Digital Download">PDF Digital Download ({orderModalBook.isFreeDownload ? 'Free' : `$${orderModalBook.price || 18.50}`})</option>
                    <option value="ePub Universal E-Reader Edition">ePub Universal E-Reader Edition ($14.99)</option>
                    <option value="Paperback Physical Edition">Paperback Physical Edition - Deluxe Print ($22.00)</option>
                    <option value="Kindle Edition (Amazon / MOBI)">Kindle Edition - Amazon / MOBI ($12.99)</option>
                    <option value="All 4 Delivery Formats Bundle (PDF + ePub + Paperback + Kindle)">All 4 Delivery Formats Bundle (PDF + ePub + Paperback + Kindle) ($35.00)</option>
                    <option value="Bulk School/Church/Ministry Order (10+ Copies)">Bulk School/Church/Ministry Order (10+ Copies)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[#9fbfae] block mb-1">Quantity</label>
                    <input
                      type="number"
                      min={1}
                      max={500}
                      value={orderQuantity}
                      onChange={(e) => setOrderQuantity(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 rounded-xl bg-[#010904] border border-white/20 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[#9fbfae] block mb-1">Your Full Name *</label>
                    <input
                      type="text"
                      required
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      placeholder="e.g. John Jonah"
                      className="w-full px-3 py-2 rounded-xl bg-[#010904] border border-white/20 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[#9fbfae] block mb-1">Phone / WhatsApp *</label>
                    <input
                      type="tel"
                      required
                      value={buyerPhone}
                      onChange={(e) => setBuyerPhone(e.target.value)}
                      placeholder="+255 765 326 515"
                      className="w-full px-3 py-2 rounded-xl bg-[#010904] border border-white/20 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[#9fbfae] block mb-1">City / Delivery Address</label>
                    <input
                      type="text"
                      value={buyerLocation}
                      onChange={(e) => setBuyerLocation(e.target.value)}
                      placeholder="e.g. Dodoma, Dar es Salaam, or Email"
                      className="w-full px-3 py-2 rounded-xl bg-[#010904] border border-white/20 text-white"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setOrderModalBook(null)}
                    className="px-4 py-2 rounded-xl border border-white/20 text-[#9fbfae] hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl font-bold bg-[#25D366] text-black hover:bg-[#20ba5c] flex items-center gap-1.5 cursor-pointer shadow-lg"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Complete Order via WhatsApp</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Interactive Sneak-Peek Preview Slider Modal */}
      <BookPreviewSliderModal
        book={previewModalBook}
        isOpen={Boolean(previewModalBook)}
        onClose={() => setPreviewModalBook(null)}
        onReadInside={(book) => {
          setPreviewModalBook(null);
          onSelectBook(book);
        }}
        onOrderBook={(book, format) => {
          setPreviewModalBook(null);
          if (format) setOrderFormat(format);
          setOrderModalBook(book);
        }}
        onToggleAudio={handleToggleAudio}
        isNarrating={speakingBookId === previewModalBook?.id}
      />

      {/* Delete Book Confirmation Modal */}
      {deleteConfirmBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-sm p-6 rounded-3xl bg-[#02100a] border-2 border-rose-500/60 shadow-[0_0_50px_rgba(244,63,94,0.35)] space-y-4 text-center">
            <div className="w-13 h-13 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto shadow-md">
              <Trash2 className="w-6 h-6" />
            </div>

            <div
              className="w-16 rounded-xl overflow-hidden border border-white/20 mx-auto aspect-[1/1.44] shadow-md bg-black"
              style={{ aspectRatio: '1 / 1.44' }}
            >
              <img
                src={formatTwoByThreeBookCover(deleteConfirmBook.coverImage)}
                alt={deleteConfirmBook.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold">
                Confirm Deletion
              </span>
              <h4 className="text-base font-bold text-[#fff1b8] mt-1.5 leading-snug">
                Delete "{deleteConfirmBook.title}"?
              </h4>
              <p className="text-xs text-[#9fbfae] mt-1.5 leading-relaxed">
                This will permanently remove this publication, its typed chapters, and attached documents from your bookstore catalog.
              </p>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmBook(null)}
                className="flex-1 py-2.5 px-3 rounded-xl border border-white/20 text-xs font-mono text-[#9fbfae] hover:text-white transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleConfirmDelete(deleteConfirmBook.id)}
                className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 text-white font-bold text-xs hover:from-rose-500 hover:to-rose-600 transition-all cursor-pointer shadow-lg shadow-rose-900/40 font-mono active:scale-95"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-[#02180d] border border-[#3dff8f] text-[#3dff8f] text-xs font-mono font-bold shadow-[0_0_30px_rgba(61,255,143,0.4)] animate-in slide-in-from-bottom-5">
          <Check className="w-4 h-4 text-[#3dff8f] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

    </section>
  );
};
