/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { portfolioStorage, ProjectItem, BlogPostItem, BookItem, VideoItem } from './data/portfolioStorage';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { About } from './components/About';
import { Services } from './components/Services';
import { Projects } from './components/Projects';
import { Books } from './components/Books';
import { BookReaderModal } from './components/BookReaderModal';
import { Video } from './components/Video';
import { VideoModal } from './components/VideoModal';
import { Blog } from './components/Blog';
import { Skills } from './components/Skills';
import { Experience } from './components/Experience';
import { AIWorkflow } from './components/AIWorkflow';
import { Testimonials } from './components/Testimonials';
import { Contact } from './components/Contact';
import { Footer } from './components/Footer';
import { AIAssistant } from './components/AIAssistant';
import { ResumeModal } from './components/ResumeModal';
import { ProjectModal } from './components/ProjectModal';
import { BlogModal } from './components/BlogModal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { GoogleMapModal } from './components/GoogleMapModal';
import { SectionDivider } from './components/SectionDivider';
import { ScrollNeonTracker } from './components/ScrollNeonTracker';
import { BackToTop } from './components/BackToTop';
import { ScrollReveal } from './components/ScrollReveal';
import { Preloader } from './components/Preloader';
import { OfflineIndicator } from './components/OfflineIndicator';
import { PWAInstallButton } from './components/PWAInstallButton';
import { PWAFullscreenView } from './components/PWAFullscreenView';
import { ReadingProgressBar } from './components/ReadingProgressBar';
import { useSeoSync } from './hooks/useSeoSync';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthModal } from './components/auth/AuthModal';
import { UserProfileModal } from './components/auth/UserProfileModal';
import { SearchModal } from './components/SearchModal';
import { LegalModal, LegalTab } from './components/LegalModal';
import { AuthModalView } from './types/auth';
import { X } from 'lucide-react';

function PortfolioApp() {
  const { user, isAdmin } = useAuth();

  // Reactive state loaded from persistent storage
  const [data, setData] = useState(() => portfolioStorage.getData());
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => portfolioStorage.isAuthenticated());
  const isAuthenticatedUser = Boolean(user || isAdmin || isAdminAuthenticated);
  const [visitorNotice, setVisitorNotice] = useState<string | null>(null);

  // Client Informational Message banner on Home state (can be dismissed by client with X)
  const [showHomeNotice, setShowHomeNotice] = useState(() => {
    try {
      return sessionStorage.getItem('boniphace_home_notice_closed') !== 'true';
    } catch {
      return true;
    }
  });

  const handleCloseHomeNotice = () => {
    try {
      sessionStorage.setItem('boniphace_home_notice_closed', 'true');
    } catch {}
    setShowHomeNotice(false);
  };

  // Modal states
  const [resumeOpen, setResumeOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminInitialTab, setAdminInitialTab] = useState<string>('overview');
  const [adminBookSubView, setAdminBookSubView] = useState<'catalog' | 'categories'>('catalog');
  const [adminEditingBookId, setAdminEditingBookId] = useState<string | null>(null);

  const handleOpenAdmin = (tab: string = 'overview') => {
    // Admin Portal Login is completely independent from client user accounts.
    // Explicitly dismiss any client AuthModal and clear visitor notices so Admin Portal operates standalone.
    setAuthModalOpen(false);
    setVisitorNotice(null);
    setAdminInitialTab(tab);
    setAdminEditingBookId(null);
    setAdminOpen(true);
  };

  const handleOpenAdminBook = (bookId?: string, subView: 'catalog' | 'categories' = 'catalog') => {
    setAuthModalOpen(false);
    setVisitorNotice(null);
    setAdminInitialTab('books');
    setAdminBookSubView(subView);
    setAdminEditingBookId(bookId || null);
    setAdminOpen(true);
  };
  const [activeProject, setActiveProject] = useState<ProjectItem | null>(null);
  const [activeBook, setActiveBook] = useState<BookItem | null>(null);
  const [activeVideo, setActiveVideo] = useState<VideoItem | null>(null);
  const [activeBlogPost, setActiveBlogPost] = useState<BlogPostItem | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [pwaModalOpen, setPwaModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalView, setAuthModalView] = useState<AuthModalView>('login');
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [legalOpen, setLegalOpen] = useState(false);
  const [legalTab, setLegalTab] = useState<LegalTab>('privacy');

  const handleOpenLegal = (tab: LegalTab = 'privacy') => {
    setLegalTab(tab);
    setLegalOpen(true);
  };

  // Dynamic SEO & OpenGraph sync for Boniphace Ndege with full professional titles & project modal meta tags
  useSeoSync(data.profile, activeProject);

  // Modern UI Preloader state
  const [showPreloader, setShowPreloader] = useState(true);

  // Clean up any lingering light mode class or storage entry
  useEffect(() => {
    document.documentElement.classList.remove('light');
    document.body.classList.remove('light');
    try {
      localStorage.removeItem('boniphace_theme');
    } catch {}
  }, []);

  // Listen for open-pwa-fullscreen events from any PWA button
  useEffect(() => {
    const handleOpenPWA = () => setPwaModalOpen(true);
    window.addEventListener('open-pwa-fullscreen', handleOpenPWA);
    return () => window.removeEventListener('open-pwa-fullscreen', handleOpenPWA);
  }, []);

  // Contact form pre-fill parameters
  const [preSelectedService, setPreSelectedService] = useState('');
  const [preFilledMessage, setPreFilledMessage] = useState('');

  // Subscribe to storage updates so UI reflects admin edits immediately
  useEffect(() => {
    const unsubscribe = portfolioStorage.subscribe(() => {
      setData({ ...portfolioStorage.getData() });
      setIsAdminAuthenticated(portfolioStorage.isAuthenticated());
    });
    return () => unsubscribe();
  }, []);

  // Hidden High Contrast Accessibility Mode state (Ctrl + Shift + D)
  const [highContrast, setHighContrast] = useState(() => {
    try {
      return localStorage.getItem('boniphace_high_contrast') === 'true';
    } catch {
      return false;
    }
  });
  const [a11yToast, setA11yToast] = useState<string | null>(null);

  useEffect(() => {
    if (highContrast) {
      document.documentElement.classList.add('high-contrast');
      document.body.classList.add('high-contrast');
      try {
        localStorage.setItem('boniphace_high_contrast', 'true');
      } catch {}
    } else {
      document.documentElement.classList.remove('high-contrast');
      document.body.classList.remove('high-contrast');
      try {
        localStorage.setItem('boniphace_high_contrast', 'false');
      } catch {}
    }
  }, [highContrast]);

  // Hidden keyboard shortcuts:
  // Keyboard shortcuts:
  // - Ctrl/Cmd + K or '/': Search Portfolio & Sections
  // - Ctrl + Shift + A: Admin Dashboard
  // - Ctrl + Shift + D: High Contrast Mode for improved accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K for Search
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
        return;
      }

      // '/' to search when not typing in an input/textarea
      if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        setSearchOpen(true);
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
        if (e.key === 'a' || e.key === 'A') {
          e.preventDefault();
          setAdminOpen((prev) => !prev);
        } else if (e.key === 'd' || e.key === 'D') {
          e.preventDefault();
          setHighContrast((prev) => {
            const next = !prev;
            setA11yToast(next ? 'High Contrast Mode Enabled (Ctrl + Shift + D)' : 'High Contrast Mode Disabled');
            setTimeout(() => setA11yToast(null), 3200);
            return next;
          });
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Website Login System Requirement:
  // Any visitor can see the home page freely.
  // When an unauthenticated visitor attempts to touch, press, or click any interactive element,
  // they are smoothly redirected to the login/account modal.
  useEffect(() => {
    if (isAuthenticatedUser) return;

    const handleInterceptInteractive = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // NEVER intercept any Admin Portal Login interaction, admin triggers, or exempt UI
      if (
        target.closest('#auth-modal-root') ||
        target.closest('#admin-modal-root') ||
        target.closest('#legal-modal-root') ||
        target.closest('[data-unauth-exempt="true"]') ||
        target.closest('[data-admin-portal="true"]') ||
        target.closest('[data-admin-trigger="true"]') ||
        target.closest('[data-admin-login="true"]') ||
        target.closest('button[data-admin-login="true"]') ||
        target.closest('a[href="#admin"]') ||
        (target.closest('button')?.textContent || '').toLowerCase().includes('admin portal') ||
        (target.closest('button')?.textContent || '').toLowerCase().includes('admin dashboard') ||
        (target.closest('button')?.textContent || '').toLowerCase().includes('admin:') ||
        (target.closest('button')?.textContent || '').toLowerCase().includes('admin ') ||
        (target.closest('button')?.title || '').toLowerCase().includes('admin')
      ) {
        return;
      }

      // When ANY other interactive place on the website is pressed or touched before login:
      e.preventDefault();
      e.stopPropagation();
      setVisitorNotice('Home Preview • Sign in to touch & interact');
      setAuthModalView('login');
      setAuthModalOpen(true);
    };

    window.addEventListener('click', handleInterceptInteractive, true);
    return () => {
      window.removeEventListener('click', handleInterceptInteractive, true);
    };
  }, [isAuthenticatedUser]);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleRequestService = (serviceTitle: string) => {
    setPreSelectedService(serviceTitle);
    setPreFilledMessage(`Hello Boniphace,\n\nI would like to inquire about your "${serviceTitle}" service. Let's discuss requirements and project timing.`);
    scrollToSection('contact');
  };

  const handleInquireProject = (projectTitle: string) => {
    setPreFilledMessage(`Hello Boniphace,\n\nI reviewed your "${projectTitle}" project case study and would like to collaborate on a similar project.`);
    scrollToSection('contact');
  };

  return (
    <div className="min-h-screen bg-transparent text-[#f4fff8] font-sans antialiased selection:bg-[#3dff8f]/20 selection:text-[#3dff8f] relative w-full max-w-full overflow-x-hidden overflow-x-clip">
      {/* Reading Progress Indicator Bar at the very top of the screen */}
      <ReadingProgressBar />

      {/* Modern UI Preloader */}
      {showPreloader && (
        <Preloader
          brandName={data.profile.name || "Boniphace Ndege"}
          titles={data.profile.titles}
          logoPhoto={data.profile.logoPhoto}
          onComplete={() => setShowPreloader(false)}
        />
      )}

      {/* When PWA is pressed, other should disappear and only PWA UI should appear */}
      <div className={pwaModalOpen ? 'hidden' : 'block'}>
        {/* PWA Offline Connectivity Indicator */}
        <OfflineIndicator />

        {/* Very small shining green-mixed-gold neon tracker traveling along the vertical scroll line */}
        <ScrollNeonTracker />
        <div aria-hidden="true" className="gold-vertical-neon-line-left" />

        {/* 1. Header Navigation */}
        <Header
          profile={data.profile}
          onOpenResume={() => setResumeOpen(true)}
          onOpenAdmin={() => handleOpenAdmin()}
          onOpenChat={() => setChatOpen(true)}
          isAdminAuthenticated={isAdminAuthenticated || isAdmin}
          onOpenMap={() => setMapOpen(true)}
          onReplayIntro={() => setShowPreloader(true)}
          onOpenPWA={() => setPwaModalOpen(true)}
          onOpenAuth={(view) => {
            setAuthModalView(view || 'login');
            setAuthModalOpen(true);
          }}
          onOpenProfile={() => setProfileModalOpen(true)}
          onOpenSearch={() => setSearchOpen(true)}
        />

      {/* Main Content Sections */}
      <main className="w-full max-w-full overflow-x-hidden overflow-x-clip">
        {/* Section 1: Home / Hero with Staggered Entrance */}
        <ScrollReveal stagger direction="up" delay={50} staggerDelay={85}>
          <Hero
            profile={data.profile}
            onExploreProjects={() => scrollToSection('projects')}
            onContactClick={() => scrollToSection('contact')}
            onOpenResume={() => setResumeOpen(true)}
            onOpenMap={() => setMapOpen(true)}
          />
        </ScrollReveal>

        {/* Section Divider with subtle green glow */}
        <SectionDivider />

        {/* Section 2: About Me */}
        <ScrollReveal stagger direction="up" delay={40} staggerDelay={80}>
          <About
            profile={data.profile}
            onHireMeClick={() => scrollToSection('contact')}
            onOpenResume={() => setResumeOpen(true)}
          />
        </ScrollReveal>

        {/* Section Divider with subtle green glow */}
        <SectionDivider />

        {/* Section 3: Services */}
        <ScrollReveal stagger direction="up" delay={40} staggerDelay={85}>
          <Services
            services={data.services}
            onRequestService={handleRequestService}
          />
        </ScrollReveal>

        {/* Section Divider with subtle green glow */}
        <SectionDivider />

        {/* Section 4: Portfolio / Projects */}
        <ScrollReveal stagger direction="up" delay={40} staggerDelay={75}>
          <Projects
            projects={data.projects}
            categories={data.categories}
            onSelectProject={(project) => setActiveProject(project)}
            onAddNewProject={() => handleOpenAdmin('projects')}
          />
        </ScrollReveal>

        {/* Section Divider with subtle green glow */}
        <SectionDivider />

        {/* Section: Modern Author Bookstore & Publications */}
        <ScrollReveal stagger direction="up" delay={40} staggerDelay={75}>
          <Books
            books={data.books || []}
            categories={data.bookCategories || []}
            onSelectBook={(book) => setActiveBook(book)}
            onOpenAdmin={() => handleOpenAdminBook()}
            onOpenCategories={() => handleOpenAdminBook(undefined, 'categories')}
            onEditBook={(bookId) => handleOpenAdminBook(bookId, 'catalog')}
            onDeleteBook={() => setData({ ...portfolioStorage.getData() })}
          />
        </ScrollReveal>

        {/* Section Divider with subtle green glow */}
        <SectionDivider />

        {/* Section: Video Showcase (16:9 Cinematic & 1:1 Square Motion Reels) */}
        <ScrollReveal stagger direction="up" delay={40} staggerDelay={75}>
          <Video
            videos={data.videos || []}
            categories={data.videoCategories || []}
            onSelectVideo={(video) => setActiveVideo(video)}
            onOpenAdmin={isAdminAuthenticated ? () => handleOpenAdmin('videos') : undefined}
          />
        </ScrollReveal>

        {/* Section Divider with subtle green glow */}
        <SectionDivider />

        {/* Section: Modern Blog & Articles Showcase */}
        <ScrollReveal stagger direction="up" delay={40} staggerDelay={75}>
          <Blog
            posts={data.blogPosts || []}
            categories={data.blogCategories || []}
            onSelectPost={(post) => setActiveBlogPost(post)}
            onOpenAdmin={() => handleOpenAdmin('blog')}
          />
        </ScrollReveal>

        {/* Section Divider with subtle green glow */}
        <SectionDivider />

        {/* Section 5: Skills & Tools */}
        <ScrollReveal stagger direction="up" delay={40} staggerDelay={70}>
          <Skills
            skills={data.skills}
            onOpenAdmin={() => handleOpenAdmin('skills')}
          />
        </ScrollReveal>

        {/* Section Divider with subtle green glow */}
        <SectionDivider />

        {/* Section 6, 7, 8: Work Experience, Education, Certifications & Achievements */}
        <ScrollReveal stagger direction="up" delay={40} staggerDelay={80}>
          <Experience
            workExperience={data.workExperience}
            education={data.education}
            certifications={data.certifications}
            achievements={data.achievements}
            onOpenAdmin={() => handleOpenAdmin('experience')}
          />
        </ScrollReveal>

        {/* Section Divider with subtle green glow */}
        <SectionDivider />

        {/* Section 9: AI & Digital Workflow */}
        <ScrollReveal stagger direction="up" delay={40} staggerDelay={85}>
          <AIWorkflow
            stages={data.workflowStages}
            onOpenChat={() => setChatOpen(true)}
          />
        </ScrollReveal>

        {/* Section Divider with subtle green glow */}
        <SectionDivider />

        {/* Section 10: Testimonials */}
        <ScrollReveal stagger direction="up" delay={40} staggerDelay={80}>
          <Testimonials
            testimonials={data.testimonials}
            onOpenAdmin={() => handleOpenAdmin('testimonials')}
          />
        </ScrollReveal>

        {/* Section Divider with subtle green glow */}
        <SectionDivider />

        {/* PWA Modern App Showcase Card - Centered & Mobile Responsive */}
        <ScrollReveal stagger={false} direction="scale" delay={60}>
          <section className="py-6 sm:py-8 px-4 sm:px-6">
            <div className="max-w-xl mx-auto flex flex-col items-center justify-center text-center">
              <PWAInstallButton variant="card" onOpen={() => setPwaModalOpen(true)} />
            </div>
          </section>
        </ScrollReveal>

        {/* Section Divider with subtle green glow */}
        <SectionDivider />

        {/* Section 12: Contact / Hire Me */}
        <ScrollReveal stagger direction="up" delay={40} staggerDelay={90}>
          <Contact
            profile={data.profile}
            services={data.services}
            preSelectedService={preSelectedService}
            preFilledMessage={preFilledMessage}
            onOpenMap={() => setMapOpen(true)}
          />
        </ScrollReveal>
      </main>

      {/* Section Divider before Footer */}
      <SectionDivider />

      {/* Footer */}
      <Footer
        profile={data.profile}
        onOpenAdmin={() => handleOpenAdmin()}
        isAdminAuthenticated={isAdminAuthenticated || isAdmin}
        onOpenLegal={handleOpenLegal}
      />

      {/* Floating Back to Top Button */}
      <BackToTop />

      {/* Floating AI Assistant Drawer */}
      <AIAssistant
        isOpen={chatOpen}
        onToggle={() => setChatOpen((prev) => !prev)}
        profile={data.profile}
      />

      {/* Google GPS Map Modal for Dodoma CBD */}
      <GoogleMapModal
        isOpen={mapOpen}
        onClose={() => setMapOpen(false)}
        locationTitle={data.profile.location}
      />

      {/* Section 11: CV / Resume Builder Modal */}
      <ResumeModal
        isOpen={resumeOpen}
        onClose={() => setResumeOpen(false)}
        profile={data.profile}
        skills={data.skills}
        experience={data.workExperience}
        education={data.education}
        certifications={data.certifications}
        projects={data.projects}
      />

      {/* Project Case Study Deep-Dive Modal */}
      {activeProject && (
        <ProjectModal
          project={activeProject}
          onClose={() => setActiveProject(null)}
          onInquireSimilar={handleInquireProject}
        />
      )}

      {/* Blog Article Reader Modal */}
      {activeBlogPost && (
        <BlogModal
          post={activeBlogPost}
          allPosts={data.blogPosts || []}
          onClose={() => setActiveBlogPost(null)}
          onSelectPost={(post) => setActiveBlogPost(post)}
          onOpenContact={(service) => {
            if (service) handleRequestService(service);
            else scrollToSection('contact');
          }}
        />
      )}

      {/* Modern Inside Book Reader Modal */}
      {activeBook && (
        <BookReaderModal
          book={activeBook}
          allBooks={data.books || []}
          onClose={() => setActiveBook(null)}
          onSelectBook={(book) => setActiveBook(book)}
        />
      )}

      {/* Modern High-Definition Video Player Modal with Dynamic 16:9 / 1:1 Aspect Ratio Switcher */}
      <VideoModal
        video={activeVideo}
        isOpen={Boolean(activeVideo)}
        onClose={() => setActiveVideo(null)}
        allVideos={data.videos || []}
        onSelectVideo={(video) => setActiveVideo(video)}
        onLikeVideo={(id) => portfolioStorage.recordVideoLike(id)}
      />

      {/* Section 14: Secure Full-Featured Admin Dashboard */}
      <AdminDashboard
        isOpen={adminOpen}
        onClose={() => {
          setAdminOpen(false);
          setAdminEditingBookId(null);
          setAdminBookSubView('catalog');
        }}
        data={data}
        onDataChanged={() => setData({ ...portfolioStorage.getData() })}
        initialTab={adminInitialTab}
        initialBookSubView={adminBookSubView}
        initialEditingBookId={adminEditingBookId}
      />

      {/* User Authentication Modal (Sign In / Register / Forgot Password) */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => {
          setAuthModalOpen(false);
          setVisitorNotice(null);
        }}
        initialView={authModalView}
        notice={visitorNotice}
        onOpenAdmin={() => {
          setAuthModalOpen(false);
          setAdminOpen(true);
        }}
        onOpenLegal={(tab) => {
          setAuthModalOpen(false);
          handleOpenLegal(tab);
        }}
      />

      {/* User Profile & Account Settings Modal */}
      <UserProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        onOpenAdmin={() => handleOpenAdmin()}
        onOpenLegal={(tab) => {
          setProfileModalOpen(false);
          handleOpenLegal(tab);
        }}
      />

      {/* Global Portfolio Search Modal */}
      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        data={data}
        onSelectProject={(project) => {
          setSearchOpen(false);
          setActiveProject(project);
        }}
        onSelectBlogPost={(post) => {
          setSearchOpen(false);
          setActiveBlogPost(post);
        }}
        onSelectSection={(sectionId) => {
          setSearchOpen(false);
          scrollToSection(sectionId);
        }}
        onSelectService={(serviceTitle) => {
          setSearchOpen(false);
          handleRequestService(serviceTitle);
        }}
        onOpenResume={() => {
          setSearchOpen(false);
          setResumeOpen(true);
        }}
        onOpenChat={() => {
          setSearchOpen(false);
          setChatOpen(true);
        }}
        onOpenMap={() => {
          setSearchOpen(false);
          setMapOpen(true);
        }}
        onOpenAuth={(view) => {
          setSearchOpen(false);
          setAuthModalView(view || 'login');
          setAuthModalOpen(true);
        }}
        onOpenLegal={(tab) => {
          setSearchOpen(false);
          handleOpenLegal(tab || 'privacy');
        }}
      />

      {/* Section: Comprehensive Legal, Privacy & Terms Modal */}
      <LegalModal
        isOpen={legalOpen}
        onClose={() => setLegalOpen(false)}
        initialTab={legalTab}
      />
      </div>

      {/* PWA UI - Appears at center of mobile screen when PWA is pressed; when closed then other appears */}
      {pwaModalOpen && (
        <PWAFullscreenView onClose={() => setPwaModalOpen(false)} />
      )}

      {/* Accessible High Contrast Mode Notification Toast */}
      {a11yToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-black/95 text-white border border-[#3dff8f] shadow-[0_0_20px_rgba(61,255,143,0.5)] text-xs sm:text-sm font-mono flex items-center gap-2.5 pointer-events-none select-none transition-all duration-300"
        >
          <span className="w-2 h-2 rounded-full bg-[#3dff8f] shadow-[0_0_6px_#3dff8f] animate-ping" />
          <span className="font-semibold text-[#f4fff8]">{a11yToast}</span>
        </div>
      )}

      {/* Client Informational Message banner on Home with close button */}
      {!isAuthenticatedUser && showHomeNotice && (
        <div
          data-unauth-exempt="true"
          className="fixed bottom-4 left-3 right-3 sm:left-6 sm:right-auto sm:max-w-md z-40 p-3 sm:p-3.5 rounded-2xl bg-[#010c06]/95 border border-[#3dff8f]/50 shadow-[0_10px_35px_rgba(0,0,0,0.85)] backdrop-blur-md flex items-center justify-between gap-3 text-xs animate-fade-in"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-[#3dff8f] animate-ping shrink-0" />
            <span className="text-[#c8e2d4] text-xs font-medium truncate">
              Home Preview • <strong className="text-[#3dff8f] font-bold">Sign in to touch & interact</strong>
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              data-unauth-exempt="true"
              onClick={() => {
                setVisitorNotice(null);
                setAuthModalView('login');
                setAuthModalOpen(true);
              }}
              className="py-1.5 px-3 rounded-xl font-bold bg-[#3dff8f] text-black text-xs hover:bg-white cursor-pointer transition-all shadow-[0_0_12px_rgba(61,255,143,0.3)]"
            >
              Sign In
            </button>
            <button
              type="button"
              data-unauth-exempt="true"
              onClick={handleCloseHomeNotice}
              aria-label="Close message"
              title="Close message"
              className="p-1 rounded-lg text-[#9fbfae] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <PortfolioApp />
    </AuthProvider>
  );
}
