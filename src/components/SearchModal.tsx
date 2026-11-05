/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  X,
  ArrowRight,
  Layers,
  Briefcase,
  Wrench,
  Award,
  Sparkles,
  FileText,
  MapPin,
  MessageSquare,
  Compass,
  CornerDownLeft,
  ExternalLink,
  FolderGit2,
  Tag,
  Shield,
  Cookie,
  BookOpen,
  Film,
  Video as VideoIcon
} from 'lucide-react';
import { PortfolioDatabase, ProjectItem, ServiceItem, SkillItem, BlogPostItem } from '../data/portfolioStorage';
import { PenOnBookIcon } from './PenOnBookIcon';
import { BestBookBadgeIcon } from './BestBookBadgeIcon';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: PortfolioDatabase;
  onSelectProject: (project: ProjectItem) => void;
  onSelectSection: (sectionId: string) => void;
  onSelectBlogPost?: (post: BlogPostItem) => void;
  onSelectService?: (serviceTitle: string) => void;
  onOpenResume?: () => void;
  onOpenChat?: () => void;
  onOpenMap?: () => void;
  onOpenAuth?: (view?: 'login' | 'register') => void;
  onOpenLegal?: (tab?: 'privacy' | 'terms' | 'cookies' | 'services') => void;
}

type SearchCategory = 'all' | 'sections' | 'projects' | 'blog' | 'services' | 'skills';

interface SearchResultItem {
  id: string;
  type: 'section' | 'project' | 'blog' | 'service' | 'skill' | 'action';
  title: string;
  subtitle?: string;
  category?: string;
  badge?: string;
  icon: React.ReactNode;
  action: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  data,
  onSelectProject,
  onSelectSection,
  onSelectBlogPost,
  onSelectService,
  onOpenResume,
  onOpenChat,
  onOpenMap,
  onOpenAuth,
  onOpenLegal
}) => {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<SearchCategory>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      setQuery('');
      setSelectedIndex(0);
      setActiveTab('all');
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Section catalog
  const sectionItems: SearchResultItem[] = useMemo(() => [
    {
      id: 'sec-top',
      type: 'section',
      title: 'Home / Hero',
      subtitle: 'Welcome to Boniphace Digital Portfolio & Highlights',
      badge: 'Section',
      icon: <Compass className="w-4 h-4 text-[#3dff8f]" />,
      action: () => onSelectSection('top')
    },
    {
      id: 'sec-about',
      type: 'section',
      title: 'About Me',
      subtitle: 'Creative Philosophy, Professional Background & Story',
      badge: 'Section',
      icon: <Sparkles className="w-4 h-4 text-[#3dff8f]" />,
      action: () => onSelectSection('about')
    },
    {
      id: 'sec-services',
      type: 'section',
      title: 'Services & Solutions',
      subtitle: 'Graphic Design, Website Development & Digital Content',
      badge: 'Section',
      icon: <Briefcase className="w-4 h-4 text-[#3dff8f]" />,
      action: () => onSelectSection('services')
    },
    {
      id: 'sec-projects',
      type: 'section',
      title: 'Portfolio Projects',
      subtitle: 'Showcase of Completed Client & Freelance Projects',
      badge: 'Section',
      icon: <FolderGit2 className="w-4 h-4 text-[#3dff8f]" />,
      action: () => onSelectSection('projects')
    },
    {
      id: 'sec-books',
      type: 'section',
      title: 'Books & Author Store',
      subtitle: 'Author Store & Downloadable Books by Ev Dr. Boniphace J. Ndege',
      badge: 'Section',
      icon: <BookOpen className="w-4 h-4 text-[#3dff8f]" />,
      action: () => onSelectSection('books')
    },
    {
      id: 'sec-video',
      type: 'section',
      title: 'Video Showcase (16:9 & 1:1)',
      subtitle: 'Cinematic Widescreen Films & 1:1 Square Motion Reels',
      badge: 'Section',
      icon: <VideoIcon className="w-4 h-4 text-[#3dff8f]" />,
      action: () => onSelectSection('video')
    },
    {
      id: 'sec-blog',
      type: 'section',
      title: 'Blog & Articles',
      subtitle: 'Creative Insights, Development Guides & Technical Deep Dives',
      badge: 'Section',
      icon: <PenOnBookIcon className="w-4 h-4 text-[#3dff8f]" glow={true} />,
      action: () => onSelectSection('blog')
    },
    {
      id: 'sec-skills',
      type: 'section',
      title: 'Skills & Tools',
      subtitle: 'Design Suites, Coding Frameworks & Creative Tech',
      badge: 'Section',
      icon: <Wrench className="w-4 h-4 text-[#3dff8f]" />,
      action: () => onSelectSection('skills')
    },
    {
      id: 'sec-experience',
      type: 'section',
      title: 'Experience & Education',
      subtitle: 'Career Milestones, Academic Background & Certifications',
      badge: 'Section',
      icon: <Award className="w-4 h-4 text-[#3dff8f]" />,
      action: () => onSelectSection('experience')
    },
    {
      id: 'sec-workflow',
      type: 'section',
      title: 'AI Workflow',
      subtitle: 'Human Ingenuity + Artificial Intelligence Collaboration',
      badge: 'Section',
      icon: <Sparkles className="w-4 h-4 text-[#3dff8f]" />,
      action: () => onSelectSection('workflow')
    },
    {
      id: 'sec-testimonials',
      type: 'section',
      title: 'Client Testimonials',
      subtitle: 'Verified Feedback & Collaboration Reviews',
      badge: 'Section',
      icon: <MessageSquare className="w-4 h-4 text-[#3dff8f]" />,
      action: () => onSelectSection('testimonials')
    },
    {
      id: 'sec-contact',
      type: 'section',
      title: 'Contact / Hire Me',
      subtitle: 'Start a Project, Send Inquiry or Book Consultation',
      badge: 'Section',
      icon: <ArrowRight className="w-4 h-4 text-[#3dff8f]" />,
      action: () => onSelectSection('contact')
    }
  ], [onSelectSection]);

  // Quick Action items
  const actionItems: SearchResultItem[] = useMemo(() => [
    {
      id: 'act-resume',
      type: 'action',
      title: 'Curriculum Vitae (CV)',
      subtitle: 'View & Download Boniphace Ndege PDF Resume',
      badge: 'Quick Action',
      icon: <FileText className="w-4 h-4 text-[#f0b92e]" />,
      action: () => onOpenResume?.()
    },
    {
      id: 'act-ai',
      type: 'action',
      title: 'AI Portfolio Guide',
      subtitle: 'Chat with Boniphace Interactive AI Assistant',
      badge: 'Quick Action',
      icon: <Sparkles className="w-4 h-4 text-[#3dff8f]" />,
      action: () => onOpenChat?.()
    },
    {
      id: 'act-location',
      type: 'action',
      title: 'Dodoma CBD Location GPS',
      subtitle: 'Open Interactive Google Map for Dodoma, Tanzania',
      badge: 'GPS Map',
      icon: <MapPin className="w-4 h-4 text-[#3dff8f]" />,
      action: () => onOpenMap?.()
    },
    {
      id: 'act-privacy',
      type: 'action',
      title: 'Privacy Policy & Data Protection',
      subtitle: 'Tanzania PDPA 2022 & GDPR Compliance Data Practices',
      badge: 'Legal',
      icon: <Shield className="w-4 h-4 text-[#3dff8f]" />,
      action: () => onOpenLegal?.('privacy')
    },
    {
      id: 'act-terms',
      type: 'action',
      title: 'Terms of Service & IP Rights',
      subtitle: 'Binding Usage Terms, Client Deliverables & Intellectual Property',
      badge: 'Legal',
      icon: <FileText className="w-4 h-4 text-[#f0b92e]" />,
      action: () => onOpenLegal?.('terms')
    },
    {
      id: 'act-cookies',
      type: 'action',
      title: 'Cookie Policy',
      subtitle: 'Zero Ad-Trackers Guarantee & Essential Cookies Policy',
      badge: 'Privacy',
      icon: <Cookie className="w-4 h-4 text-[#3dff8f]" />,
      action: () => onOpenLegal?.('cookies')
    },
    {
      id: 'act-services-legal',
      type: 'action',
      title: 'Client Service Agreement',
      subtitle: 'Milestone Delivery, Revisions Policy & Confidentiality/NDA',
      badge: 'Commercial',
      icon: <Briefcase className="w-4 h-4 text-[#f0b92e]" />,
      action: () => onOpenLegal?.('services')
    }
  ], [onOpenResume, onOpenChat, onOpenMap, onOpenLegal]);

  // Project items
  const projectItems: SearchResultItem[] = useMemo(() => {
    return (data.projects || []).map((project: ProjectItem) => ({
      id: `proj-${project.id}`,
      type: 'project',
      title: project.title,
      subtitle: project.summary || project.role,
      category: project.category,
      badge: 'Project',
      icon: <FolderGit2 className="w-4 h-4 text-[#3dff8f]" />,
      action: () => onSelectProject(project)
    }));
  }, [data.projects, onSelectProject]);

  // Blog article items
  const blogItems: SearchResultItem[] = useMemo(() => {
    return (data.blogPosts || [])
      .filter((post) => post.published !== false)
      .map((post: BlogPostItem) => ({
        id: `blog-${post.id}`,
        type: 'blog',
        title: post.title,
        subtitle: `${post.category} • ${post.readTimeMinutes || 5} min read • ${post.excerpt}`,
        category: post.category,
        badge: 'Article',
        icon: <PenOnBookIcon className="w-4 h-4 text-[#3dff8f]" />,
        action: () => {
          if (onSelectBlogPost) {
            onSelectBlogPost(post);
          } else {
            onSelectSection('blog');
          }
        }
      }));
  }, [data.blogPosts, onSelectBlogPost, onSelectSection]);

  // Service items
  const serviceItems: SearchResultItem[] = useMemo(() => {
    return (data.services || []).map((service: ServiceItem) => ({
      id: `srv-${service.id}`,
      type: 'service',
      title: service.title,
      subtitle: service.description,
      category: service.category,
      badge: 'Service',
      icon: <Briefcase className="w-4 h-4 text-[#f0b92e]" />,
      action: () => {
        if (onSelectService) {
          onSelectService(service.title);
        } else {
          onSelectSection('services');
        }
      }
    }));
  }, [data.services, onSelectService, onSelectSection]);

  // Skill items
  const skillItems: SearchResultItem[] = useMemo(() => {
    return (data.skills || []).map((skill: SkillItem) => ({
      id: `sk-${skill.id}`,
      type: 'skill',
      title: skill.name,
      subtitle: (skill.tools && skill.tools.length > 0) ? skill.tools.join(', ') : skill.shortDescription || skill.category,
      category: skill.category,
      badge: 'Skill',
      icon: <Tag className="w-4 h-4 text-[#3dff8f]" />,
      action: () => onSelectSection('skills')
    }));
  }, [data.skills, onSelectSection]);

  // Video items
  const videoItems: SearchResultItem[] = useMemo(() => {
    return (data.videos || []).map((video) => ({
      id: `vid-${video.id}`,
      type: 'project' as const,
      title: video.title,
      subtitle: `${video.ratio} • ${video.category} • ${video.duration} • ${video.description}`,
      category: video.category,
      badge: `Video ${video.ratio}`,
      icon: <VideoIcon className="w-4 h-4 text-[#3dff8f]" />,
      action: () => onSelectSection('video')
    }));
  }, [data.videos, onSelectSection]);

  // Filtered results
  const filteredResults = useMemo(() => {
    const q = query.trim().toLowerCase();

    let all: SearchResultItem[] = [];

    if (activeTab === 'all') {
      all = [...sectionItems, ...projectItems, ...videoItems, ...blogItems, ...serviceItems, ...skillItems, ...actionItems];
    } else if (activeTab === 'sections') {
      all = [...sectionItems, ...actionItems];
    } else if (activeTab === 'projects') {
      all = projectItems;
    } else if (activeTab === 'blog') {
      all = blogItems;
    } else if (activeTab === 'services') {
      all = serviceItems;
    } else if (activeTab === 'skills') {
      all = skillItems;
    }

    if (!q) {
      // Default initial view: sections + featured projects + recent articles + quick actions
      if (activeTab === 'all') {
        return [
          ...sectionItems,
          ...actionItems,
          ...projectItems.slice(0, 3),
          ...blogItems.slice(0, 3),
          ...serviceItems.slice(0, 2)
        ];
      }
      return all;
    }

    return all.filter((item) => {
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchSubtitle = (item.subtitle || '').toLowerCase().includes(q);
      const matchCat = (item.category || '').toLowerCase().includes(q);
      const matchBadge = (item.badge || '').toLowerCase().includes(q);
      return matchTitle || matchSubtitle || matchCat || matchBadge;
    });
  }, [query, activeTab, sectionItems, projectItems, blogItems, serviceItems, skillItems, actionItems]);

  // Reset selected index when filtered results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredResults.length, query, activeTab]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredResults.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredResults.length) % Math.max(1, filteredResults.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredResults[selectedIndex]) {
        filteredResults[selectedIndex].action();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="search-modal-title"
      className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-20 px-3 sm:px-4"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-200 animate-in fade-in"
      />

      {/* Modal Card */}
      <div
        className="relative w-full max-w-2xl bg-[#010904] card-neon-shallow rounded-2xl overflow-hidden flex flex-col max-h-[82vh] z-10 animate-in zoom-in-95 duration-150"
        onKeyDown={handleKeyDown}
      >
        {/* Top neon accent line */}
        <div className="header-neon-line top-0" />

        {/* Search Input Bar */}
        <div className="relative p-3 sm:p-4 border-b border-[rgba(240,185,46,0.25)] bg-[#02140b] flex items-center gap-3">
          <Search className="w-5 h-5 text-[#3dff8f] shrink-0 animate-pulse" />
          <input
            ref={inputRef}
            type="text"
            id="search-modal-title"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search sections, projects, articles, services, skills, CV..."
            className="w-full bg-transparent text-sm sm:text-base text-[#f4fff8] placeholder-[#9fbfae]/70 focus:outline-none font-medium"
            autoComplete="off"
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-lg text-[#9fbfae] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center text-[10px] font-mono px-2 py-0.5 rounded bg-[#010d07] text-[#9fbfae] border border-[#3dff8f]/30">
              ESC
            </kbd>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#9fbfae] hover:text-white hover:bg-white/10 transition-colors cursor-pointer ml-1"
            aria-label="Close search"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Categories / Tabs */}
        <div className="flex items-center gap-1.5 px-3 sm:px-4 py-2 border-b border-[rgba(240,185,46,0.15)] bg-[#010c06] overflow-x-auto select-none no-scrollbar">
          {[
            { id: 'all', label: 'All Items' },
            { id: 'sections', label: 'Sections' },
            { id: 'projects', label: `Projects (${projectItems.length})` },
            { id: 'blog', label: `Blog (${blogItems.length})` },
            { id: 'services', label: `Services (${serviceItems.length})` },
            { id: 'skills', label: `Skills (${skillItems.length})` }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as SearchCategory)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[#3dff8f]/20 text-[#3dff8f] border border-[#3dff8f]/60 shadow-[0_0_10px_rgba(61,255,143,0.25)]'
                  : 'text-[#9fbfae] hover:text-[#f4fff8] hover:bg-white/5 border border-transparent'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Results List */}
        <div
          ref={resultsContainerRef}
          className="overflow-y-auto p-2 sm:p-3 space-y-1 divide-y divide-white/5"
        >
          {filteredResults.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <Search className="w-10 h-10 text-[#9fbfae]/40 mx-auto mb-3" />
              <h3 className="text-sm sm:text-base font-bold text-[#fff1b8]">No results found</h3>
              <p className="text-xs text-[#9fbfae] mt-1 max-w-sm mx-auto">
                No matching portfolio items found for &ldquo;{query}&rdquo;. Try searching for &ldquo;design&rdquo;, &ldquo;projects&rdquo;, &ldquo;skills&rdquo;, or &ldquo;contact&rdquo;.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-1.5 mt-4">
                {['Services', 'Projects', 'Skills', 'About', 'CV Resume', 'Contact'].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setQuery(suggestion)}
                    className="text-xs px-2.5 py-1 rounded-lg bg-[#02140b] text-[#3dff8f] border border-[#3dff8f]/30 hover:border-[#3dff8f] transition-colors cursor-pointer"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            filteredResults.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    item.action();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`p-2.5 sm:p-3 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-all duration-150 ${
                    isSelected
                      ? 'bg-[#021f11] border border-[#3dff8f]/50 shadow-[0_0_15px_rgba(61,255,143,0.18)] translate-x-0.5'
                      : 'hover:bg-[#02140b] border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                        isSelected
                          ? 'bg-[#0a351e] border-[#3dff8f] text-[#3dff8f]'
                          : 'bg-[#021008] border-white/10 text-[#9fbfae]'
                      }`}
                    >
                      {item.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs sm:text-sm font-bold truncate ${isSelected ? 'text-[#3dff8f]' : 'text-[#f4fff8]'}`}>
                          {item.title}
                        </span>
                        {item.badge && (
                          <span
                            className={`text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase shrink-0 ${
                              item.type === 'section'
                                ? 'bg-[#3dff8f]/10 text-[#3dff8f] border-[#3dff8f]/30'
                                : item.type === 'project'
                                ? 'bg-[#f0b92e]/10 text-[#f0b92e] border-[#f0b92e]/30'
                                : item.type === 'blog'
                                ? 'bg-emerald-500/15 text-[#3dff8f] border-[#3dff8f]/40'
                                : item.type === 'service'
                                ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                                : 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                      {item.subtitle && (
                        <p className="text-[11px] text-[#9fbfae] truncate mt-0.5">
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isSelected && (
                      <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono text-[#3dff8f]">
                        <span>Select</span>
                        <CornerDownLeft className="w-3 h-3" />
                      </span>
                    )}
                    <ArrowRight
                      className={`w-4 h-4 transition-transform ${
                        isSelected ? 'text-[#3dff8f] translate-x-1' : 'text-[#9fbfae]/40'
                      }`}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts info */}
        <div className="p-2.5 sm:p-3 bg-[#000502] border-t border-[rgba(240,185,46,0.15)] flex items-center justify-between text-[11px] font-mono text-[#9fbfae] select-none">
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-[#02140b] border border-white/10 text-[#fff1b8]">↑↓</kbd>
              <span>Navigate</span>
            </span>
            <span className="hidden sm:inline-flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-[#02140b] border border-white/10 text-[#fff1b8]">↵</kbd>
              <span>Open</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-[#02140b] border border-white/10 text-[#fff1b8]">ESC</kbd>
              <span>Close</span>
            </span>
          </div>

          <span className="text-[#f0b92e] font-semibold text-[10px]">
            {filteredResults.length} Result{filteredResults.length === 1 ? '' : 's'}
          </span>
        </div>
      </div>
    </div>
  );
};
