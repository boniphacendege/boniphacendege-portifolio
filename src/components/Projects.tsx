import React, { useState, useEffect, useMemo } from 'react';
import { ProjectItem } from '../data/portfolioStorage';
import { getCssAspectRatio, detectStandardAspectRatio, StandardRatioId } from '../utils/imageHelper';
import {
  ExternalLink,
  Github,
  ArrowUpRight,
  Sparkles,
  PlusCircle,
  FolderOpen,
  Eye,
  Heart,
  Share2,
  ThumbsUp,
  MessageSquare,
  Star,
  Check,
  X,
  Send,
  User,
  Palette,
  Code2,
  Layers,
  Search,
  FileDown
} from 'lucide-react';

interface ProjectsProps {
  projects: ProjectItem[];
  categories: string[];
  onSelectProject: (project: ProjectItem) => void;
  onAddNewProject: () => void;
}

interface ProjectComment {
  id: string;
  author: string;
  text: string;
  date: string;
  rating?: number;
}

interface MagneticProjectCardProps {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
}

/**
 * Magnetic Card wrapper that lifts slightly, pulls toward the cursor,
 * and subtly increases green glowing border intensity on hover.
 */
// Subtle low-frequency 'thrum' audio synthesizer for project card hover
let cardThrumAudioCtx: AudioContext | null = null;
let lastThrumTime = 0;

export const playProjectHoverThrum = () => {
  try {
    const now = performance.now();
    // Throttle to avoid chaotic overlapping when cursor sweeps quickly across cards
    if (now - lastThrumTime < 90) return;
    lastThrumTime = now;

    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;

    if (!cardThrumAudioCtx) {
      cardThrumAudioCtx = new AudioCtx();
    }

    if (cardThrumAudioCtx.state === 'suspended') {
      cardThrumAudioCtx.resume().catch(() => {});
    }

    const ctx = cardThrumAudioCtx;
    const startTime = ctx.currentTime;
    const duration = 0.18; // 180ms smooth low-frequency thrum

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    // Deep, tactile resonant thrum: gentle glide from 65Hz down to 48Hz
    osc.type = 'sine';
    osc.frequency.setValueAtTime(65, startTime);
    osc.frequency.exponentialRampToValueAtTime(48, startTime + duration);

    // Warm low-pass filter
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(110, startTime);
    filter.Q.setValueAtTime(3.0, startTime);

    // Subtle tactile gain envelope: gentle 18ms attack, smooth exponential decay
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(0.038, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration);
  } catch {
    // Graceful fallback if audio is not permitted by browser policy
  }
};

const MagneticProjectCard: React.FC<MagneticProjectCardProps> = ({
  children,
  onClick,
  className = ''
}) => {
  const cardRef = React.useRef<HTMLDivElement>(null);
  const [transform, setTransform] = React.useState({ x: 0, y: 0, rx: 0, ry: 0 });
  const [isHovered, setIsHovered] = React.useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = (e.clientX - centerX) / (rect.width / 2);
    const deltaY = (e.clientY - centerY) / (rect.height / 2);

    // Subtle magnetic attraction: ~7px translation and ~3.5deg subtle tilt
    const moveX = Math.max(-8, Math.min(8, deltaX * 7));
    const moveY = Math.max(-8, Math.min(8, deltaY * 7));
    const rotX = -deltaY * 3.5;
    const rotY = deltaX * 3.5;

    setTransform({ x: moveX, y: moveY, rx: rotX, ry: rotY });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    playProjectHoverThrum();
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTransform({ x: 0, y: 0, rx: 0, ry: 0 });
  };

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: isHovered
          ? `perspective(1000px) translate3d(${transform.x}px, ${transform.y - 7}px, 0) rotateX(${transform.rx}deg) rotateY(${transform.ry}deg) scale3d(1.018, 1.018, 1)`
          : 'perspective(1000px) translate3d(0, 0, 0) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
        transition: isHovered
          ? 'transform 0.12s ease-out, border-color 0.25s ease, box-shadow 0.3s ease'
          : 'transform 0.5s cubic-bezier(0.2, 0.9, 0.3, 1), border-color 0.4s ease, box-shadow 0.4s ease',
      }}
      className={`rounded-[22px] bg-gradient-to-br from-[#0f7a43]/20 via-[#03170d]/85 to-[#010703] card-neon-shallow border flex flex-col justify-between group cursor-pointer overflow-hidden relative will-change-transform ${
        isHovered
          ? 'border-[#3dff8f] shadow-[0_22px_45px_-10px_rgba(0,0,0,0.95),0_0_20px_rgba(61,255,143,0.45),inset_0_0_10px_rgba(61,255,143,0.12)] z-20'
          : 'border-[#3dff8f]/40 shadow-[0_0_10px_rgba(61,255,143,0.25),inset_0_0_6px_rgba(61,255,143,0.06)] z-0'
      } ${className}`}
    >
      {/* Magnetic cursor-following ambient highlight inside border */}
      {isHovered && (
        <div
          className="pointer-events-none absolute inset-0 z-30 transition-opacity duration-300 opacity-100 rounded-[22px]"
          style={{
            background: `radial-gradient(420px circle at ${50 + (transform.x / 7) * 40}% ${50 + (transform.y / 7) * 40}%, rgba(61, 255, 143, 0.13), transparent 72%)`,
          }}
          aria-hidden="true"
        />
      )}
      {children}
    </div>
  );
};

const ProjectsComponent: React.FC<ProjectsProps> = ({
  projects,
  categories,
  onSelectProject,
  onAddNewProject
}) => {
  const [toast, setToast] = useState<string | null>(null);
  const [detectedCardRatios, setDetectedCardRatios] = useState<Record<string, StandardRatioId>>({});

  // Local storage keys for interactive engagement
  const [favorites, setFavorites] = useState<Record<string, boolean>>(() => {
    try {
      const stored = localStorage.getItem('boniphace_favorites_map');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const [likes, setLikes] = useState<Record<string, number>>(() => {
    try {
      const stored = localStorage.getItem('boniphace_likes_map');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const [userLiked, setUserLiked] = useState<Record<string, boolean>>(() => {
    try {
      const stored = localStorage.getItem('boniphace_user_liked');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Comments & reviews state per project
  const [commentsMap, setCommentsMap] = useState<Record<string, ProjectComment[]>>(() => {
    try {
      const stored = localStorage.getItem('boniphace_project_comments');
      if (stored) return JSON.parse(stored);
    } catch {}
    // Initial authentic default reviews
    return {
      'prj-1': [
        {
          id: 'c-1',
          author: 'David M.',
          text: 'The Serengeti Horizons visual identity is clean, earthy, and breathtaking. Premium vector execution.',
          date: 'Yesterday',
          rating: 5
        },
        {
          id: 'c-2',
          author: 'Sarah K.',
          text: 'Very thoughtful typography pairings and high-contrast social media templates.',
          date: '3 days ago',
          rating: 5
        }
      ],
      'prj-2': [
        {
          id: 'c-3',
          author: 'Alex T.',
          text: 'Super responsive web experience. Fast animations and very clean code structure.',
          date: '1 week ago',
          rating: 5
        }
      ]
    };
  });

  // Active project for comment/review modal
  const [activeCommentProject, setActiveCommentProject] = useState<ProjectItem | null>(null);
  const [newCommentAuthor, setNewCommentAuthor] = useState('');
  const [newCommentText, setNewCommentText] = useState('');
  const [newCommentRating, setNewCommentRating] = useState(5);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  const handleToggleFavorite = (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    setFavorites((prev) => {
      const next = { ...prev, [projectId]: !prev[projectId] };
      localStorage.setItem('boniphace_favorites_map', JSON.stringify(next));
      showToast(next[projectId] ? 'Project added to favorites!' : 'Removed from favorites');
      return next;
    });
  };

  const handleToggleLike = (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    const isCurrentlyLiked = !!userLiked[projectId];
    setUserLiked((prev) => {
      const next = { ...prev, [projectId]: !isCurrentlyLiked };
      localStorage.setItem('boniphace_user_liked', JSON.stringify(next));
      return next;
    });

    setLikes((prev) => {
      const current = prev[projectId] || 0;
      const nextCount = isCurrentlyLiked ? Math.max(0, current - 1) : current + 1;
      const next = { ...prev, [projectId]: nextCount };
      localStorage.setItem('boniphace_likes_map', JSON.stringify(next));
      showToast(!isCurrentlyLiked ? 'Liked! Thank you for the support.' : 'Like removed');
      return next;
    });
  };

  const handleShare = async (e: React.MouseEvent, project: ProjectItem) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}${window.location.pathname}#project-${project.slug}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${project.title} — Boniphace Ndege Portfolio`,
          text: project.summary,
          url: shareUrl
        });
        showToast('Project shared successfully!');
        return;
      } catch (err) {
        // user cancelled or share failed, fallback to copy
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast('Website link copied to clipboard! (Link is hidden)');
    } catch {
      showToast('Share link ready to use!');
    }
  };

  const handleOpenComments = (e: React.MouseEvent, project: ProjectItem) => {
    e.stopPropagation();
    setActiveCommentProject(project);
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCommentProject || !newCommentText.trim()) return;

    const newComment: ProjectComment = {
      id: 'cmt-' + Date.now(),
      author: newCommentAuthor.trim() || 'Verified Visitor',
      text: newCommentText.trim(),
      date: 'Just now',
      rating: newCommentRating
    };

    setCommentsMap((prev) => {
      const existing = prev[activeCommentProject.id] || [];
      const updated = [newComment, ...existing];
      const next = { ...prev, [activeCommentProject.id]: updated };
      localStorage.setItem('boniphace_project_comments', JSON.stringify(next));
      return next;
    });

    setNewCommentText('');
    setNewCommentAuthor('');
    setNewCommentRating(5);
    showToast('Comment & review submitted successfully!');
  };

  type ProjectFilterCategory = 'all' | 'web-dev' | 'graphic-design' | 'ai-workflows' | string;

  const [activeFilter, setActiveFilter] = useState<ProjectFilterCategory>('all');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const matchesCategoryFilter = (project: ProjectItem, filterId: ProjectFilterCategory) => {
    if (filterId === 'all') return true;
    const cat = (project.category || '').toLowerCase();
    const title = (project.title || '').toLowerCase();
    const summary = (project.summary || '').toLowerCase();
    const tools = (project.tools || []).map((t) => t.toLowerCase());
    const hasAi = (project.aiUsed && project.aiUsed.length > 0) || false;

    if (filterId === 'web-dev' || filterId === 'Web Development') {
      return (
        cat.includes('web') ||
        cat.includes('dev') ||
        cat.includes('frontend') ||
        cat.includes('responsive') ||
        cat.includes('ui/ux') ||
        cat.includes('website') ||
        title.includes('web') ||
        title.includes('website') ||
        title.includes('platform') ||
        summary.includes('website') ||
        summary.includes('frontend') ||
        tools.some((t) =>
          ['react', 'html', 'css', 'javascript', 'typescript', 'tailwind', 'tailwind css', 'vite', 'next.js', 'vue', 'frontend'].includes(t)
        )
      );
    }

    if (filterId === 'graphic-design' || filterId === 'Graphic Design') {
      return (
        cat.includes('design') ||
        cat.includes('graphic') ||
        cat.includes('brand') ||
        cat.includes('identity') ||
        cat.includes('packaging') ||
        cat.includes('poster') ||
        cat.includes('flyer') ||
        cat.includes('logo') ||
        title.includes('identity') ||
        title.includes('packaging') ||
        title.includes('branding') ||
        title.includes('visual') ||
        title.includes('logo') ||
        summary.includes('packaging') ||
        summary.includes('brand') ||
        summary.includes('logo') ||
        tools.some((t) =>
          ['illustrator', 'photoshop', 'indesign', 'canva', 'adobe illustrator', 'adobe photoshop'].includes(t)
        )
      );
    }

    if (filterId === 'ai-workflows' || filterId === 'AI Workflows') {
      return (
        hasAi ||
        cat.includes('ai') ||
        cat.includes('workflow') ||
        title.includes('ai') ||
        title.includes('generat') ||
        summary.includes('ai') ||
        tools.some((t) =>
          t.includes('ai') ||
          t.includes('gemini') ||
          t.includes('midjourney') ||
          t.includes('claude') ||
          t.includes('gpt') ||
          t.includes('chatgpt')
        )
      );
    }

    return cat.includes(filterId.toLowerCase()) || title.includes(filterId.toLowerCase());
  };

  const publishedProjects = useMemo(() => projects.filter((p) => p.published), [projects]);

  const filterCounts = useMemo(() => ({
    all: publishedProjects.length,
    'web-dev': publishedProjects.filter((p) => matchesCategoryFilter(p, 'web-dev')).length,
    'graphic-design': publishedProjects.filter((p) => matchesCategoryFilter(p, 'graphic-design')).length,
    'ai-workflows': publishedProjects.filter((p) => matchesCategoryFilter(p, 'ai-workflows')).length,
  }), [publishedProjects]);

  const filteredProjects = useMemo(() => {
    return publishedProjects.filter((project) => {
      if (!matchesCategoryFilter(project, activeFilter)) return false;
      if (selectedSubCategory !== 'all') {
        if (project.category !== selectedSubCategory) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesQ =
          (project.title && project.title.toLowerCase().includes(q)) ||
          (project.summary && project.summary.toLowerCase().includes(q)) ||
          (project.category && project.category.toLowerCase().includes(q)) ||
          (project.tools && project.tools.some((t) => t.toLowerCase().includes(q))) ||
          (project.role && project.role.toLowerCase().includes(q)) ||
          (project.clientName && project.clientName.toLowerCase().includes(q));
        if (!matchesQ) return false;
      }
      return true;
    });
  }, [publishedProjects, activeFilter, selectedSubCategory, searchQuery]);

  const availableSubCategories = useMemo(() => {
    return Array.from(
      new Set(
        publishedProjects
          .filter((p) => matchesCategoryFilter(p, activeFilter))
          .map((p) => p.category)
          .filter(Boolean)
      )
    );
  }, [publishedProjects, activeFilter]);

  const getProjectTypeBadge = (type: string) => {
    switch (type) {
      case 'client':
        return { label: 'Client Work', color: 'bg-[#0f7a43]/30 text-[#3dff8f] border-[#3dff8f]/40' };
      case 'freelance':
        return { label: 'Freelance', color: 'bg-[#f0b92e]/20 text-[#fff1b8] border-[#f0b92e]/40' };
      case 'prototype':
        return { label: 'Working Prototype', color: 'bg-cyan-900/40 text-cyan-300 border-cyan-500/40' };
      case 'concept':
        return { label: 'Design Concept', color: 'bg-purple-900/40 text-purple-300 border-purple-500/40' };
      case 'experimental':
        return { label: 'Experimental', color: 'bg-emerald-950/70 text-emerald-300 border-emerald-500/30' };
      default:
        return { label: 'Personal Project', color: 'bg-[#02180d] text-[#9fbfae] border-white/10' };
    }
  };

  return (
    <section id="projects" className="py-20 relative bg-[#010804]/40">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full bg-[#02180c] border border-[#3dff8f] text-[#3dff8f] font-mono text-xs sm:text-sm shadow-[0_0_25px_rgba(61,255,143,0.35)] flex items-center gap-2 animate-in fade-in duration-200">
          <Check className="w-4 h-4 text-[#3dff8f]" />
          <span>{toast}</span>
        </div>
      )}

      <div className="w-full max-w-[1740px] 2xl:max-w-[1860px] mx-auto px-2.5 sm:px-4 md:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6 stagger-child">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-semibold text-[#f0b92e] bg-[#f0b92e]/10 border border-[#f0b92e]/25 mb-3">
              <FolderOpen className="w-3.5 h-3.5 text-[#f0b92e]" />
              <span>CREATIVE PORTFOLIO</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-serif-heading mb-4 gold-text">
              Selected projects & designs
            </h2>
            <p className="text-base sm:text-lg text-[#9fbfae]">
              Explore visual identities, modern websites, and forward-looking digital solutions categorized by creative discipline.
            </p>
          </div>

          {/* Add New Project Action */}
          <button
            type="button"
            data-unauth-exempt="true"
            data-admin-portal="true"
            data-admin-trigger="true"
            onClick={onAddNewProject}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs sm:text-sm font-semibold text-[#fff1b8] border border-[rgba(240,185,46,0.35)] hover:border-[#f0b92e] hover:bg-[#f0b92e]/10 transition-all cursor-pointer self-start md:self-auto shrink-0"
          >
            <PlusCircle className="w-4 h-4 text-[#f0b92e]" />
            <span>Add New Project</span>
          </button>
        </div>

        {/* Project Category Filter Tabbed Interface Above Project Grid */}
        <div className="mb-8 p-4 sm:p-5 rounded-3xl bg-[#010e06]/95 border border-[rgba(240,185,46,0.3)] shadow-[0_12px_40px_rgba(0,0,0,0.7)] backdrop-blur-md stagger-child space-y-4">
          {/* Top Row: Tabbed Header & Live Search Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[rgba(240,185,46,0.18)]">
            <div className="space-y-0.5">
              <span className="text-[11px] font-mono uppercase tracking-widest text-[#f0b92e] font-bold block">
                Filter By Discipline &amp; Domain
              </span>
              <p className="text-xs text-[#9fbfae]">
                {activeFilter === 'all' && 'Showing all curated creative projects across branding, web development, and AI.'}
                {activeFilter === 'web-dev' && 'Showing responsive websites, frontend web applications, and UI/UX platforms.'}
                {activeFilter === 'graphic-design' && 'Showing visual brand identities, logo systems, packaging, and digital collateral.'}
                {activeFilter === 'ai-workflows' && 'Showing AI-assisted creative workflows, generative prototyping, and hybrid pipelines.'}
              </p>
            </div>

            {/* Live Search Input */}
            <div className="relative w-full md:w-72 shrink-0">
              <Search className="w-4 h-4 text-[#f0b92e] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects by keyword, tech, client..."
                className="w-full pl-10 pr-9 py-2 rounded-full bg-[#02140b] border border-[rgba(240,185,46,0.25)] text-xs text-[#f4fff8] placeholder:text-[#9fbfae]/60 focus:border-[#3dff8f] focus:outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9fbfae] hover:text-white text-xs cursor-pointer"
                  title="Clear Search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Tabbed Navigation Bar */}
          <div
            role="tablist"
            aria-label="Project Category Tabs"
            className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5 p-1.5 rounded-2xl bg-[#000803] border border-white/5"
          >
            {[
              { id: 'all' as ProjectFilterCategory, label: 'All Projects', subtitle: 'Complete Portfolio', icon: Layers, count: filterCounts.all },
              { id: 'web-dev' as ProjectFilterCategory, label: 'Web Development', subtitle: 'Websites & Apps', icon: Code2, count: filterCounts['web-dev'] },
              { id: 'graphic-design' as ProjectFilterCategory, label: 'Graphic Design', subtitle: 'Branding & Vector', icon: Palette, count: filterCounts['graphic-design'] },
              { id: 'ai-workflows' as ProjectFilterCategory, label: 'AI Workflows', subtitle: 'AI Tools & Concepting', icon: Sparkles, count: filterCounts['ai-workflows'] }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  id={`tab-${tab.id}`}
                  aria-selected={isActive}
                  type="button"
                  onClick={() => {
                    setActiveFilter(tab.id);
                    setSelectedSubCategory('all');
                  }}
                  className={`group relative p-3 sm:p-3.5 rounded-xl text-left transition-all duration-300 flex items-center justify-between gap-2.5 cursor-pointer select-none border ${
                    isActive
                      ? 'bg-gradient-to-r from-[#07361d] via-[#052b17] to-[#02180d] border-[#3dff8f] shadow-[0_0_20px_rgba(61,255,143,0.35),0_4px_12px_rgba(0,0,0,0.8)] -translate-y-0.5'
                      : 'bg-[#021209]/80 border-[rgba(240,185,46,0.15)] hover:border-[#3dff8f]/50 hover:bg-[#032012] text-[#9fbfae]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border transition-all ${
                        isActive
                          ? 'bg-[#02180d] border-[#3dff8f] text-[#3dff8f] shadow-[0_0_10px_rgba(61,255,143,0.4)]'
                          : 'bg-[#010c05] border-white/10 text-[#f0b92e] group-hover:border-[#3dff8f]/40 group-hover:text-[#3dff8f]'
                      }`}
                    >
                      <Icon className="w-4 h-4 transition-transform group-hover:scale-110" />
                    </div>
                    <div className="min-w-0">
                      <div className={`font-serif-heading font-bold text-xs sm:text-sm truncate transition-colors ${
                        isActive ? 'text-[#3dff8f]' : 'text-[#f4fff8] group-hover:text-[#fff1b8]'
                      }`}>
                        {tab.label}
                      </div>
                      <div className="text-[10px] text-[#9fbfae] truncate font-mono hidden sm:block">
                        {tab.subtitle}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border transition-colors shrink-0 ${
                      isActive
                        ? 'bg-[#3dff8f]/20 text-[#3dff8f] border-[#3dff8f]/50 shadow-[0_0_8px_rgba(61,255,143,0.4)]'
                        : 'bg-black/60 text-[#9fbfae] border-white/10 group-hover:text-white'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Sub-category refined pills & Results Count */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            {availableSubCategories.length > 1 ? (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-mono text-[#f0b92e] uppercase tracking-wider mr-1 hidden sm:inline">
                  Sub-category:
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedSubCategory('all')}
                  className={`px-3 py-1 rounded-full text-[11px] font-mono transition-all cursor-pointer ${
                    selectedSubCategory === 'all'
                      ? 'bg-[#3dff8f]/20 text-[#3dff8f] border border-[#3dff8f]/60 font-bold shadow-[0_0_8px_rgba(61,255,143,0.3)]'
                      : 'text-[#9fbfae]/80 border border-white/5 hover:text-white hover:border-[#3dff8f]/30'
                  }`}
                >
                  All in {activeFilter === 'all' ? 'Portfolio' : activeFilter === 'web-dev' ? 'Web Dev' : activeFilter === 'graphic-design' ? 'Graphic Design' : 'AI Workflows'}
                </button>
                {availableSubCategories.map((subCat) => (
                  <button
                    key={subCat}
                    type="button"
                    onClick={() => setSelectedSubCategory(subCat)}
                    className={`px-3 py-1 rounded-full text-[11px] font-mono transition-all cursor-pointer ${
                      selectedSubCategory === subCat
                        ? 'bg-[#3dff8f]/20 text-[#3dff8f] border border-[#3dff8f]/60 font-bold shadow-[0_0_8px_rgba(61,255,143,0.3)]'
                        : 'text-[#9fbfae]/80 border border-white/5 hover:text-white hover:border-[#3dff8f]/30'
                    }`}
                  >
                    {subCat}
                  </button>
                ))}
              </div>
            ) : <div />}

            <div className="text-[11px] font-mono text-[#9fbfae] ml-auto">
              Showing <span className="text-[#3dff8f] font-bold">{filteredProjects.length}</span> of {publishedProjects.length} projects
            </div>
          </div>
        </div>

        {/* Projects Cards Grid */}
        {filteredProjects.length === 0 ? (
          <div className="p-12 rounded-3xl bg-[#02130a] border border-[rgba(240,185,46,0.2)] text-center space-y-4">
            <p className="text-sm text-[#9fbfae]">
              No published projects found for this category filter.
            </p>
            <button
              type="button"
              data-unauth-exempt="true"
              data-admin-portal="true"
              data-admin-trigger="true"
              onClick={onAddNewProject}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold text-[#1a1200] bg-gradient-to-b from-[#fff1b8] via-[#f0b92e] to-[#b8841a] cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create New Project</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
            {filteredProjects.map((project, idx) => {
              const typeBadge = getProjectTypeBadge(project.projectType);
              const isFavorited = !!favorites[project.id];
              const baseLikes = 28 + (idx * 17) % 73;
              const currentLikes = baseLikes + (likes[project.id] || 0);
              const isLiked = !!userLiked[project.id];
              const viewersCount = (1240 + (idx * 318) % 2500).toLocaleString();
              const projectComments = commentsMap[project.id] || [];
              const commentsCount = projectComments.length;
              const ratingVal = 5.0;
              const favoritesCount = 14 + (idx * 7) % 29 + (isFavorited ? 1 : 0);

              const effectiveRatio = (project.aspectRatio || detectedCardRatios[project.id] || '1:1') as string;

              return (
                <div key={project.id} className="stagger-child h-full flex flex-col">
                  <MagneticProjectCard
                    onClick={() => onSelectProject(project)}
                  >
                  {/* Thumbnail Cover - Auto Aspect Ratio Container */}
                  <div
                    className="relative w-full bg-[#010a05] overflow-hidden flex items-center justify-center transition-all duration-300"
                    style={{
                      aspectRatio: getCssAspectRatio(effectiveRatio),
                      maxHeight: '380px'
                    }}
                  >
                    {/* Ambient blurred backdrop for seamless edge blending across all ratios */}
                    <img
                      src={project.thumbnail || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80'}
                      alt=""
                      aria-hidden="true"
                      className="absolute inset-0 w-full h-full object-cover blur-xl scale-125 opacity-30 pointer-events-none"
                    />
                    <img
                      src={project.thumbnail || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80'}
                      alt={project.title}
                      onLoad={(e) => {
                        if (!project.aspectRatio && !detectedCardRatios[project.id]) {
                          const detected = detectStandardAspectRatio(e.currentTarget.naturalWidth, e.currentTarget.naturalHeight);
                          setDetectedCardRatios((prev) => ({ ...prev, [project.id]: detected.ratioId }));
                        }
                      }}
                      className="w-full h-full object-cover relative z-10 transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#021008] via-transparent to-transparent opacity-80 pointer-events-none" />

                    {/* Top badging */}
                    <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
                      <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border backdrop-blur-md ${typeBadge.color}`}>
                        {typeBadge.label}
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        <span className="text-[9px] font-mono font-semibold px-2 py-0.5 rounded-full bg-black/60 text-[#3dff8f] border border-[#3dff8f]/30 backdrop-blur-md">
                          {effectiveRatio}
                        </span>
                        {project.attachments && project.attachments.length > 0 && (
                          <span className="text-[9px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[#0a351e]/85 text-[#3dff8f] border border-[#3dff8f]/40 flex items-center gap-1 backdrop-blur-md">
                            <FileDown className="w-2.5 h-2.5" />
                            {project.attachments.length} doc{project.attachments.length > 1 ? 's' : ''}
                          </span>
                        )}
                        {project.featured && (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#f0b92e]/25 text-[#fff1b8] border border-[#f0b92e]/40 flex items-center gap-1 backdrop-blur-md">
                            <Sparkles className="w-2.5 h-2.5 text-[#f0b92e]" />
                            Featured
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Shining Interaction Icons directly below image (No combined card container) */}
                  <div className="px-4 py-3 grid grid-cols-6 gap-1 select-none items-center justify-items-center">
                    {/* 1. Favorite Shining Icon */}
                    <button
                      type="button"
                      onClick={(e) => handleToggleFavorite(e, project.id)}
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
                        {favoritesCount}
                      </span>
                    </button>

                    {/* 2. Share Shining Icon (Website link hidden, copied to clipboard) */}
                    <button
                      type="button"
                      onClick={(e) => handleShare(e, project)}
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
                      onClick={(e) => {
                        e.stopPropagation();
                        showToast(`${viewersCount} verified impressions on ${project.title}`);
                      }}
                      className="group/btn relative flex flex-col items-center justify-center gap-1.5 py-1 px-1 cursor-pointer select-none transition-all duration-150 active:scale-75 active:translate-y-1.5 focus:outline-none"
                      title={`${viewersCount} verified views (click to check audit)`}
                      aria-label="Views"
                    >
                      <Eye className="w-4 h-4 text-[#3dff8f] drop-shadow-[0_0_8px_rgba(61,255,143,0.85)] group-hover/btn:drop-shadow-[0_0_16px_rgba(61,255,143,1)] group-hover/btn:scale-125 transition-all duration-150" />
                      <span className="font-mono text-[10px] sm:text-[11px] font-bold leading-none tracking-tight text-[#3dff8f]/90 group-hover/btn:text-white">
                        {viewersCount}
                      </span>
                    </button>

                    {/* 4. Likes Shining Icon */}
                    <button
                      type="button"
                      onClick={(e) => handleToggleLike(e, project.id)}
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
                        {currentLikes}
                      </span>
                    </button>

                    {/* 5. Comments Shining Icon */}
                    <button
                      type="button"
                      onClick={(e) => handleOpenComments(e, project)}
                      className="group/btn relative flex flex-col items-center justify-center gap-1.5 py-1 px-1 cursor-pointer select-none transition-all duration-150 active:scale-75 active:translate-y-1.5 focus:outline-none"
                      title="Read & post community comments"
                      aria-label="Comments"
                    >
                      <MessageSquare className="w-4 h-4 text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)] group-hover/btn:drop-shadow-[0_0_14px_rgba(168,85,247,1)] group-hover/btn:scale-125 transition-all duration-150" />
                      <span className="font-mono text-[10px] sm:text-[11px] font-bold leading-none tracking-tight text-purple-300/80 group-hover/btn:text-purple-100">
                        {commentsCount}
                      </span>
                    </button>

                    {/* 6. Reviews Shining Icon */}
                    <button
                      type="button"
                      onClick={(e) => handleOpenComments(e, project)}
                      className="group/btn relative flex flex-col items-center justify-center gap-1.5 py-1 px-1 cursor-pointer select-none transition-all duration-150 active:scale-75 active:translate-y-1.5 focus:outline-none"
                      title="Verified client & peer reviews (5.0 rating)"
                      aria-label="Reviews"
                    >
                      <Star className="w-4 h-4 fill-[#f0b92e] text-[#f0b92e] drop-shadow-[0_0_8px_rgba(240,185,46,0.85)] group-hover/btn:drop-shadow-[0_0_16px_rgba(240,185,46,1)] group-hover/btn:scale-125 transition-all duration-150" />
                      <span className="font-mono text-[10px] sm:text-[11px] font-bold leading-none tracking-tight text-[#fff1b8] group-hover/btn:text-white">
                        5.0
                      </span>
                    </button>
                  </div>

                  {/* Body Content */}
                  <div className="p-6 flex flex-col flex-1 justify-between">
                    <div>
                      {/* Category */}
                      <div className="text-[11px] font-mono font-bold text-[#f0b92e] uppercase tracking-wider mb-1.5">
                        {project.category}
                      </div>

                      {/* Title */}
                      <h3 className="text-xl font-bold font-serif-heading text-[#fff1b8] group-hover:text-[#3dff8f] transition-colors mb-2.5 flex items-center justify-between">
                        <span>{project.title}</span>
                        <ArrowUpRight className="w-4 h-4 text-[#9fbfae] group-hover:text-[#3dff8f] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0 ml-2" />
                      </h3>

                      {/* Summary */}
                      <p className="text-xs sm:text-sm text-[#9fbfae] leading-relaxed mb-4 line-clamp-2">
                        {project.summary}
                      </p>
                    </div>

                    <div>
                      {/* Tools & AI Chips */}
                      <div className="flex flex-wrap gap-1.5 pt-3 border-t border-[rgba(240,185,46,0.15)]">
                        {project.tools.slice(0, 4).map((tool) => (
                          <span
                            key={tool}
                            className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#3dff8f]/10 text-[#3dff8f] border border-[#3dff8f]/20"
                          >
                            {tool}
                          </span>
                        ))}
                        {project.aiUsed && project.aiUsed.length > 0 && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#f0b92e]/10 text-[#fff1b8] border border-[#f0b92e]/20 flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5 text-[#f0b92e]" />
                            AI-Assisted
                          </span>
                        )}
                      </div>

                      {/* Detail CTA */}
                      <div className="mt-4 flex items-center justify-between text-xs text-[#9fbfae] font-mono">
                        <span className="group-hover:text-[#fff1b8] transition-colors flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Case Study</span>
                        </span>
                        <span className="text-[#3dff8f] font-bold">→</span>
                      </div>
                    </div>
                  </div>
                </MagneticProjectCard>
              </div>
            );
          })}
        </div>
        )}
      </div>

      {/* Interactive Comments & Reviews Modal */}
      {activeCommentProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-[#010c06] border border-[#f0b92e] shadow-[0_0_50px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 bg-[#02150b] border-b border-[rgba(240,185,46,0.25)] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#f0b92e] font-bold block">
                  Feedback & Peer Reviews
                </span>
                <h3 className="font-serif-heading font-bold text-base sm:text-lg text-[#fff1b8] line-clamp-1">
                  {activeCommentProject.title}
                </h3>
              </div>
              <button
                onClick={() => setActiveCommentProject(null)}
                className="p-1.5 rounded-xl text-[#9fbfae] hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Existing comments & reviews */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#011208] border border-white/10">
                <div className="flex items-center gap-2">
                  <div className="flex items-center text-[#f0b92e]">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="w-4 h-4 fill-[#f0b92e]" />
                    ))}
                  </div>
                  <span className="font-bold text-sm text-[#fff1b8] font-mono">5.0 / 5.0</span>
                </div>
                <span className="text-xs text-[#9fbfae] font-mono">
                  {(commentsMap[activeCommentProject.id] || []).length} Verified Reviews
                </span>
              </div>

              {/* Comments list */}
              <div className="space-y-3">
                {(!commentsMap[activeCommentProject.id] || commentsMap[activeCommentProject.id].length === 0) ? (
                  <p className="text-xs text-[#9fbfae] text-center py-6 italic">
                    Be the first to share your thoughts or review on this project!
                  </p>
                ) : (
                  commentsMap[activeCommentProject.id].map((c) => (
                    <div
                      key={c.id}
                      className="p-3.5 rounded-xl bg-[#02140b] border border-[rgba(240,185,46,0.15)] space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-[#0a351e] text-[#3dff8f] flex items-center justify-center font-bold text-[10px]">
                            {c.author.charAt(0)}
                          </div>
                          <span className="text-xs font-bold text-[#fff1b8]">{c.author}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {c.rating && (
                            <div className="flex items-center text-[#f0b92e]">
                              {Array.from({ length: c.rating }).map((_, i) => (
                                <Star key={i} className="w-2.5 h-2.5 fill-[#f0b92e]" />
                              ))}
                            </div>
                          )}
                          <span className="text-[10px] font-mono text-[#9fbfae]">{c.date}</span>
                        </div>
                      </div>
                      <p className="text-xs text-[#f4fff8] leading-relaxed pl-8">
                        {c.text}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* Form to post comment / review */}
              <form onSubmit={handleAddComment} className="pt-4 border-t border-[rgba(240,185,46,0.2)] space-y-3">
                <span className="text-xs font-mono font-bold text-[#3dff8f] block">
                  Leave a Comment or Client Review
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Your Name / Organization"
                    value={newCommentAuthor}
                    onChange={(e) => setNewCommentAuthor(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#010904] border border-white/20 text-xs text-white placeholder:text-gray-500 focus:border-[#3dff8f] focus:outline-none"
                  />

                  {/* Rating Selector */}
                  <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-[#010904] border border-white/20">
                    <span className="text-[11px] text-[#9fbfae]">Rating:</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNewCommentRating(star)}
                          className="p-0.5 cursor-pointer"
                        >
                          <Star
                            className={`w-4 h-4 ${
                              star <= newCommentRating ? 'fill-[#f0b92e] text-[#f0b92e]' : 'text-gray-600'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <textarea
                    rows={2}
                    required
                    placeholder="Write your review or comment about this project..."
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#010904] border border-white/20 text-xs text-white placeholder:text-gray-500 focus:border-[#3dff8f] focus:outline-none resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl font-bold text-xs text-[#1a1200] bg-gradient-to-b from-[#fff1b8] via-[#f0b92e] to-[#b8841a] hover:from-white hover:to-[#f0b92e] flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Post Review / Comment</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export const Projects = React.memo(ProjectsComponent);
