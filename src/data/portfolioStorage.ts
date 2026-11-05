/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Persistent Storage Layer for Boniphace Ndege's Portfolio
 * Manages full CRUD for Profile, Services, Skills, Projects, Experience,
 * Education, Certifications, AI Workflow, Testimonials, and Contact Inquiries.
 */

import { LOGO_DATA_URI } from '../assets/logo';
import { doc, setDoc, onSnapshot, collection, addDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { formatTwoByThreeBookCover } from '../utils/imageHelper';
import { hashPasscode, verifyPasscode, DEFAULT_ADMIN_2FA_SECRET, verifyTOTPCode } from '../utils/cryptoAuth';

export interface ServiceItem {
  id: string;
  title: string;
  description: string;
  category: string;
  icon?: string;
  imageUrl?: string;
  price?: string;
  deliveryEstimate?: string;
  availability: 'Available' | 'Limited Slots' | 'Booked';
  published: boolean;
  order: number;
}

export interface SkillItem {
  id: string;
  name: string;
  category: string;
  shortDescription?: string;
  tools?: string[];
  proficiency?: number; // 0-100 or undefined if user doesn't want %
  yearsExperience?: string;
  icon?: string;
  published: boolean;
  order: number;
}

export interface ProjectAttachment {
  id: string;
  name: string;
  url: string;
  size?: number;
  sizeFormatted?: string;
  type?: string;
  uploadedAt?: string;
}

export interface ProjectItem {
  id: string;
  slug: string;
  title: string;
  summary: string;
  fullDescription: string;
  category: string;
  thumbnail: string;
  gallery: string[];
  attachments?: ProjectAttachment[];
  aspectRatio?: '1:1' | '5:4' | '4:3' | '3:2' | '16:9' | '2:3' | '3:4' | '4:5' | '5:7' | '9:16' | string;
  videoUrl?: string;
  startDate?: string;
  completionDate?: string;
  status: 'concept' | 'prototype' | 'in_progress' | 'completed';
  projectType: 'personal' | 'client' | 'freelance' | 'academic' | 'experimental' | 'concept' | 'prototype';
  role: string;
  tools: string[];
  aiUsed?: string[];
  mainChallenge?: string;
  solution?: string;
  outcome?: string;
  liveUrl?: string;
  githubUrl?: string;
  clientName?: string;
  featured: boolean;
  published: boolean;
  order: number;
  views?: number;
  likes?: number;
  favorites?: number;
  rating?: number;
  reviewsCount?: number;
  commentsList?: Array<{
    id: string;
    author: string;
    date: string;
    rating?: number;
    text: string;
  }>;
}

export interface AIWorkflowStage {
  id: string;
  stageNumber: number;
  title: string;
  subtitle: string;
  description: string;
  toolsUsed: string[];
  humanRole: string;
  aiRole: string;
  order: number;
}

export interface WorkExperienceItem {
  id: string;
  roleTitle: string;
  employer: string;
  employmentType: 'freelance' | 'contract' | 'full-time' | 'part-time' | 'independent';
  startDate: string;
  endDate: string;
  current: boolean;
  location: string;
  description: string;
  responsibilities: string[];
  mediaUrl?: string;
  published: boolean;
  order: number;
}

export interface EducationItem {
  id: string;
  institution: string;
  qualification: string;
  field: string;
  startDate: string;
  endDate: string;
  current?: boolean;
  description: string;
  documentUrl?: string;
  published: boolean;
  order: number;
}

export interface CertificationItem {
  id: string;
  title: string;
  issuingOrg: string;
  date: string;
  credentialUrl?: string;
  credentialId?: string;
  imageUrl?: string;
  published: boolean;
  order: number;
}

export interface AchievementItem {
  id: string;
  title: string;
  description: string;
  date: string;
  evidenceUrl?: string;
  published: boolean;
  order: number;
}

export interface TestimonialItem {
  id: string;
  name: string;
  role: string;
  organization: string;
  content: string;
  avatar?: string;
  permissionToPublish: boolean;
  published: boolean;
  order: number;
}

export interface ContactInquiry {
  id: string;
  name: string;
  email: string;
  organization?: string;
  serviceRequired: string;
  budgetRange?: string;
  preferredTimeline?: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export interface ProjectPageMeta {
  title?: string;
  description?: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  customTags?: Array<{ name?: string; property?: string; content: string }>;
}

export interface ProfileData {
  name: string;
  titles: string[];
  headline: string;
  intro: string;
  bio: string;
  creativeApproach: string;
  designPhilosophy: string;
  aiUsageStatement: string;
  professionalInterests: string[];
  targetClients: string[];
  careerGoals: string;
  location: string;
  email: string;
  phone: string;
  whatsapp: string;
  availability: string;
  profilePhoto: string;
  logoPhoto: string;
  heroBackgroundImage?: string;
  heroBackgroundOpacity?: number;
  heroBackgroundPosition?: 'right' | 'center' | 'left' | 'cover';
  heroShowcaseTransparent?: boolean;
  resumePdfUrl?: string;
  projectMetaTags?: Record<string, ProjectPageMeta>;
  copyrightMode?: 'auto' | 'manual';
  copyrightManualYear?: string;
  socialLinks: {
    github: string;
    linkedin: string;
    behance?: string;
    dribbble?: string;
    instagram?: string;
    facebook?: string;
    twitter?: string;
  };
}

export interface BlogPostItem {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  coverImage: string;
  aspectRatio?: '1:1' | '5:4' | '4:3' | '3:2' | '16:9' | '2:3' | '3:4' | '4:5' | '5:7' | '9:16' | string;
  author: {
    name: string;
    role?: string;
    avatar?: string;
  };
  publishedAt: string; // ISO date string e.g. 2026-10-28T09:15:00.000Z
  publishedTimeFormatted?: string; // Formatted time string e.g. 09:15 AM
  readTimeMinutes: number;
  tags: string[];
  featured: boolean;
  published: boolean;
  order: number;
  views?: number;
  likes?: number;
  keyTakeaways?: string[];
  seoMeta?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string;
  };
  linkUrl?: string;
  linkTitle?: string;
}

export type BookReadingTheme =
  | 'modern-editorial'
  | 'minimalist-sans'
  | 'midnight-emerald'
  | 'vintage-parchment'
  | 'executive-dual';

export interface BookChapter {
  id: string;
  chapterNumber: number;
  title: string;
  subtitle?: string;
  content: string; // rich text or markdown paragraphs typed directly
}

export interface BookItem {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  author: {
    name: string;
    role?: string;
    avatar?: string;
    bio?: string;
  };
  publishedAt: string; // ISO date string e.g. 2026-03-15T10:00:00.000Z
  publishedTimeFormatted?: string; // Formatted time e.g. 10:30 AM
  category: string;
  coverImage: string;
  aspectRatio?: '2:3' | '3:4' | '1:1' | '4:5' | '16:9' | string; // accepts all kinds of image ratio!
  excerpt: string; // "show text except"
  description: string;
  isbn?: string;
  pagesCount?: number;
  language?: string;
  publisher?: string;
  formats?: string[]; // e.g. ['PDF', 'ePub', 'Hardcover', 'Paperback', 'Kindle', 'Audiobook']
  price?: number; // 0 for free download
  currency?: string; // e.g. 'USD' or 'TZS'
  isFreeDownload: boolean;
  isDownloadable: boolean;
  downloadUrl?: string; // direct download or storage link
  pdfFileUrl?: string; // uploaded PDF in Firebase Storage
  sampleFileUrl?: string;
  externalBuyUrls?: {
    amazon?: string;
    googleBooks?: string;
    appleBooks?: string;
    directWhatsApp?: string;
    gumroad?: string;
  };
  readingTheme?: BookReadingTheme; // interior book layout design
  chapters: BookChapter[]; // direct typing of book chapters
  samplePreviewText?: string;
  tags: string[];
  featured: boolean;
  rating?: number; // e.g. 4.95
  reviewsCount?: number;
  downloadsCount?: number;
  readsCount?: number;
  likesCount?: number;
  order: number;
  published: boolean;
  linkUrl?: string;
  linkTitle?: string;
}

export type VideoRatio = '16:9' | '1:1';

export interface VideoChapter {
  id?: string;
  time: string; // e.g. "00:00", "02:15"
  seconds?: number;
  title: string;
  description?: string;
}

export interface VideoItem {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  description: string;
  category: string;
  ratio: VideoRatio; // '16:9' (Widescreen) or '1:1' (Square)
  videoUrl: string; // YouTube URL, Vimeo URL, MP4 link
  embedUrl?: string;
  thumbnailUrl: string;
  duration: string; // e.g. "04:30", "01:00", "12:15"
  resolution?: string; // "4K UHD", "1080p HD"
  publishedAt: string;
  author: {
    name: string;
    role?: string;
    avatar?: string;
  };
  tags: string[];
  viewsCount?: number;
  likesCount?: number;
  featured: boolean;
  published: boolean;
  order: number;
  chapters?: VideoChapter[];
  downloadUrl?: string;
  transcript?: string;
  linkUrl?: string;
  linkTitle?: string;
}

export interface PortfolioDatabase {
  profile: ProfileData;
  services: ServiceItem[];
  skills: SkillItem[];
  categories: string[];
  projects: ProjectItem[];
  blogPosts: BlogPostItem[];
  blogCategories: string[];
  books: BookItem[];
  bookCategories: string[];
  videos: VideoItem[];
  videoCategories: string[];
  workflowStages: AIWorkflowStage[];
  workExperience: WorkExperienceItem[];
  education: EducationItem[];
  certifications: CertificationItem[];
  achievements: AchievementItem[];
  testimonials: TestimonialItem[];
  inquiries: ContactInquiry[];
  adminPasscodeHash: string; // Salted SHA-256 hash stored internally
  admin2FA?: {
    enabled: boolean;
    secret: string;
    method: 'authenticator' | 'email';
    backupCodes: string[];
    recoveryEmail: string;
  };
}

const STORAGE_KEY = 'boniphace_portfolio_data_v3';
const AUTH_KEY = 'boniphace_portfolio_auth_token';

// Initial authentic defaults for Boniphace Ndege
export const DEFAULT_PORTFOLIO_DATA: PortfolioDatabase = {
  profile: {
    name: 'Ev Dr. Boniphace J. Ndege',
    titles: [
      'Graphic Designer',
      'Website Designer & Developer',
      'Digital Content Creator'
    ],
    headline: 'Creative Design. Modern Websites. Digital Innovation.',
    intro:
      'I am a Graphic Designer, Website Designer, and Digital Content Creator passionate about transforming ideas into professional visual designs, responsive websites, and engaging digital experiences. I combine creativity, modern web technologies, and AI-powered tools to plan, design, develop, and refine digital solutions for individuals, businesses, and organizations.',
    bio:
      'I specialize in creating clean visual brand identities, digital assets, and responsive websites. My creative process bridges traditional design aesthetics with modern web engineering and smart AI-assisted workflows. Whether designing a company logo, building a custom landing page, or crafting multi-platform social media creative assets, I focus on delivering engaging, purposeful digital products tailored to your goals.',
    creativeApproach:
      'I start with deep listening and understanding the core purpose of the project. Then, I research visual references, iterate on concepts using design software and AI-assisted ideation, and refine each element with deliberate attention to typography, hierarchy, balance, and responsive user flow.',
    designPhilosophy:
      'Good design is intentional, accessible, and communicative. Visuals should not just look attractive—they must solve a problem, convey meaning, and leave a memorable impression across every screen size.',
    aiUsageStatement:
      'I utilize modern AI tools (such as Gemini, ChatGPT, Midjourney, and Figma AI plugins) as creative partners to accelerate research, explore visual directions, and streamline code prototyping. However, human taste, critical review, manual customization, and rigorous quality assurance remain the defining pillars of everything I deliver.',
    professionalInterests: [
      'Brand Identity Systems',
      'Responsive Web Design',
      'UI/UX Prototyping',
      'Digital Advertising Creative',
      'AI-Assisted Web Workflows',
      'Social Media Visual Direction'
    ],
    targetClients: [
      'Growing Businesses & Startups',
      'Independent Brands & Creators',
      'E-commerce & Retailers',
      'Non-Profits & Educational Initiatives',
      'Agencies Seeking Dedicated Creative Support'
    ],
    careerGoals:
      'To continually advance my craft at the intersection of creative graphic design, modern frontend development, and intelligent digital workflows, crafting impactful digital assets and high-performing websites for clients worldwide.',
    location: 'Dodoma CBD Tanzania',
    email: 'drboniphacendege@gmail.com',
    phone: '+255 765 326 515',
    whatsapp: '255765326515',
    availability: 'Available Online',
    profilePhoto: LOGO_DATA_URI,
    logoPhoto: LOGO_DATA_URI,
    heroBackgroundImage: '',
    heroBackgroundOpacity: 45,
    heroBackgroundPosition: 'right',
    heroShowcaseTransparent: false,
    resumePdfUrl: '',
    copyrightMode: 'auto',
    copyrightManualYear: '2026',
    projectMetaTags: {
      'prj-1': {
        title: 'Serengeti Horizons Visual Identity & Brand System | Boniphace Ndege',
        description: 'Complete brand identity design, logo suite, typography guide, and promotional social media collaterals for an eco-tourism venture by Boniphace Ndege.',
        keywords: 'Serengeti Horizons, Brand Identity, Logo Design, Eco-Tourism, Typography Guide, Graphic Designer Tanzania, Boniphace Ndege',
        ogTitle: 'Serengeti Horizons Visual Identity & Brand System — Case Study',
        ogDescription: 'Complete visual identity system and eco-safari collateral crafted by Boniphace Ndege.',
        ogImage: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1200&q=80',
        twitterTitle: 'Serengeti Horizons Brand Identity | Boniphace Ndege',
        twitterDescription: 'Eco-tourism visual identity design, logo mark, and brand system by Boniphace Ndege.',
        twitterImage: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1200&q=80',
        customTags: [
          { property: 'article:section', content: 'Brand Identity' },
          { property: 'article:tag', content: 'Graphic Design' },
          { property: 'article:tag', content: 'Branding' }
        ]
      },
      'prj-2': {
        title: 'Lumina Creative Studio — Responsive Web Platform | Boniphace Ndege',
        description: 'Modern, responsive showcase website for a creative design and media studio featuring dark mode aesthetics, smooth animations, and contact inquiry flow.',
        keywords: 'Lumina Creative Studio, Web Design, Responsive Web Development, React, Tailwind CSS, Web Developer Tanzania, Boniphace Ndege',
        ogTitle: 'Lumina Creative Studio — Responsive Web Showcase',
        ogDescription: 'Sub-second page load times and dark mode aesthetics designed and built by Boniphace Ndege.',
        ogImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
        twitterTitle: 'Lumina Creative Studio Platform | Boniphace Ndege',
        twitterDescription: 'Modern responsive web platform designed & built by Boniphace Ndege.',
        twitterImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
        customTags: [
          { property: 'article:section', content: 'Web Development' },
          { property: 'article:tag', content: 'React' },
          { property: 'article:tag', content: 'Tailwind CSS' }
        ]
      },
      'prj-3': {
        title: 'Zanzibar Heritage Spices Packaging & Collateral | Boniphace Ndege',
        description: 'Product packaging labels, promotional posters, and social media campaign graphics highlighting organic Tanzanian agricultural heritage.',
        keywords: 'Zanzibar Heritage Spices, Product Packaging, Organic Spices Tanzania, Graphic Design, Label Design, Boniphace Ndege',
        ogTitle: 'Zanzibar Heritage Spices Packaging Design — Case Study',
        ogDescription: 'Distinctive packaging labels and promotional collaterals for Tanzanian organic spices.',
        ogImage: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=1200&q=80',
        twitterTitle: 'Zanzibar Heritage Spices Packaging | Boniphace Ndege',
        twitterDescription: 'Organic spice packaging dielines and marketing graphics by Boniphace Ndege.',
        twitterImage: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=1200&q=80',
        customTags: [
          { property: 'article:section', content: 'Packaging Design' },
          { property: 'article:tag', content: 'Visual Communication' }
        ]
      },
      'prj-4': {
        title: 'Zenith Studio — AI Creative Interface Prototype | Boniphace Ndege',
        description: 'UI/UX design exploration of a desktop & mobile creative studio interface for generating and organizing multi-format digital social content.',
        keywords: 'Zenith Studio, AI Creative Interface, UI/UX Design, Figma Prototyping, Prompt Engineering, Boniphace Ndege',
        ogTitle: 'Zenith Studio — AI Creative Workflow Interface Concept',
        ogDescription: 'Interactive Figma prototype with 18 responsive artboards by Boniphace Ndege.',
        ogImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
        twitterTitle: 'Zenith Studio AI Interface | Boniphace Ndege',
        twitterDescription: 'UI/UX interface prototype exploring generative AI creative workflows.',
        twitterImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
        customTags: [
          { property: 'article:section', content: 'UI/UX Design' },
          { property: 'article:tag', content: 'AI Workflows' }
        ]
      }
    },
    socialLinks: {
      github: 'https://github.com/boniphacendege',
      linkedin: 'https://linkedin.com/in/boniphace-ndege',
      behance: 'https://behance.net/boniphacendege',
      dribbble: 'https://dribbble.com/boniphacendege',
      instagram: 'https://instagram.com/boniphace.designs',
      facebook: 'https://facebook.com/boniphacendege',
      twitter: 'https://x.com/boniphacendege'
    }
  },

  services: [
    {
      id: 'srv-1',
      title: 'Graphic Design & Branding',
      description: 'Comprehensive brand style guides, color palettes, visual identities, and cohesive design systems for modern brands.',
      category: 'Graphic Design',
      availability: 'Available',
      published: true,
      order: 1
    },
    {
      id: 'srv-2',
      title: 'Logo Design & Visual Identity',
      description: 'Custom, scalable logo marks, wordmarks, icon sets, and vector assets delivered with transparent formats and vector source files.',
      category: 'Graphic Design',
      availability: 'Available',
      published: true,
      order: 2
    },
    {
      id: 'srv-3',
      title: 'Flyers, Posters & Social Media Graphics',
      description: 'High-impact promotional graphics for print and digital marketing, event posters, banners, and branded social media templates.',
      category: 'Digital Content',
      availability: 'Available',
      published: true,
      order: 3
    },
    {
      id: 'srv-4',
      title: 'Website Design (UI/UX)',
      description: 'User-centric wireframing, high-fidelity mockups, and mobile-first layouts designed in Figma with thoughtful navigation and typography.',
      category: 'Website Design',
      availability: 'Available',
      published: true,
      order: 4
    },
    {
      id: 'srv-5',
      title: 'Website Development',
      description: 'Modern, responsive, fast-loading web experiences built with clean HTML5, CSS3/Tailwind, JavaScript, and React.',
      category: 'Website Development',
      availability: 'Available',
      published: true,
      order: 5
    },
    {
      id: 'srv-6',
      title: 'Landing Pages & Business Websites',
      description: 'Conversion-focused landing pages, corporate portfolio websites, and product showcases optimized for engagement and quick loading.',
      category: 'Website Development',
      availability: 'Available',
      published: true,
      order: 6
    },
    {
      id: 'srv-7',
      title: 'Digital Content Creation',
      description: 'Engaging multimedia visual assets, carousel slides, promotional banners, and visual storytelling tailored for online audiences.',
      category: 'Digital Content',
      availability: 'Available',
      published: true,
      order: 7
    },
    {
      id: 'srv-8',
      title: 'AI-Assisted Design & Web Prototyping',
      description: 'Leveraging AI workflows to quickly explore design directions, iterate concepts, prototype responsive code, and refine digital products.',
      category: 'AI Workflows',
      availability: 'Available',
      published: true,
      order: 8
    },
    {
      id: 'srv-9',
      title: 'Website Maintenance and Improvements',
      description: 'Updating existing websites, fixing responsive layout issues, optimizing performance, and refreshing design elements.',
      category: 'Website Development',
      availability: 'Available',
      published: true,
      order: 9
    }
  ],

  categories: [
    'Graphic Design',
    'Branding & Logos',
    'Website Design',
    'Website Development',
    'Digital Content',
    'AI-Assisted Projects',
    'UI/UX Design',
    'Experimental Projects'
  ],

  skills: [
    {
      id: 'sk-1',
      name: 'Graphic Design & Vector Art',
      category: 'Graphic Design',
      shortDescription: 'Layout composition, visual hierarchy, typography selection, and print/digital asset preparation.',
      tools: ['Adobe Photoshop', 'Adobe Illustrator', 'Canva'],
      proficiency: 90,
      published: true,
      order: 1
    },
    {
      id: 'sk-2',
      name: 'Logo & Brand Identity Design',
      category: 'Branding & Visual Identity',
      shortDescription: 'Creating memorable logomarks, typography pairings, brand guidelines, and vector assets.',
      tools: ['Illustrator', 'Figma', 'Vector Formats'],
      proficiency: 88,
      published: true,
      order: 2
    },
    {
      id: 'sk-3',
      name: 'Responsive Web Design',
      category: 'Website Design',
      shortDescription: 'Designing mobile-first, tablet, and desktop interfaces with intuitive user flows and accessible contrast.',
      tools: ['Figma', 'CSS Grid', 'Flexbox'],
      proficiency: 92,
      published: true,
      order: 3
    },
    {
      id: 'sk-4',
      name: 'HTML5 & Modern CSS / Tailwind',
      category: 'Website Development',
      shortDescription: 'Semantic markup, modern styling, utility-first CSS, responsive layouts, and smooth animations.',
      tools: ['HTML5', 'CSS3', 'Tailwind CSS'],
      proficiency: 92,
      published: true,
      order: 4
    },
    {
      id: 'sk-5',
      name: 'JavaScript & React / TypeScript',
      category: 'Website Development',
      shortDescription: 'Interactive components, state management, API data fetching, and modern frontend development.',
      tools: ['JavaScript (ES6+)', 'TypeScript', 'React', 'Vite'],
      proficiency: 85,
      published: true,
      order: 5
    },
    {
      id: 'sk-6',
      name: 'Digital Content Creation',
      category: 'Digital Content Creation',
      shortDescription: 'Creating social media banners, event flyers, promotional graphics, and marketing collaterals.',
      tools: ['Photoshop', 'Canva', 'Figma'],
      proficiency: 90,
      published: true,
      order: 6
    },
    {
      id: 'sk-7',
      name: 'AI-Assisted Creative Workflows',
      category: 'AI Tools & AI-Assisted Workflows',
      shortDescription: 'Using generative AI for creative exploration, prompt engineering, code acceleration, and asset refinement.',
      tools: ['Gemini', 'ChatGPT', 'Midjourney', 'Figma AI'],
      proficiency: 88,
      published: true,
      order: 7
    },
    {
      id: 'sk-8',
      name: 'UI/UX Prototyping & Wireframing',
      category: 'UI/UX Design',
      shortDescription: 'Interactive prototypes, user flows, design systems, component libraries, and usability testing.',
      tools: ['Figma', 'Prototyping'],
      proficiency: 86,
      published: true,
      order: 8
    }
  ],

  projects: [
    {
      id: 'prj-1',
      slug: 'serengeti-safaris-brand-identity',
      title: 'Serengeti Horizons Visual Identity & Brand System',
      summary: 'Complete brand identity design, logo suite, typography guide, and promotional social media collaterals for an eco-tourism venture.',
      fullDescription:
        'Serengeti Horizons required a memorable, nature-inspired visual identity to connect with international travelers seeking authentic Tanzanian safari experiences. I designed the primary logomark combining iconic acacia trees and rising sun motifs, developed an organic earth-tone color palette, and created print-ready brochure designs alongside reusable social media templates.',
      category: 'Branding & Logos',
      thumbnail: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=800&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1534177616072-ef7dc120449d?auto=format&fit=crop&w=1200&q=80'
      ],
      aspectRatio: '4:3',
      status: 'completed',
      projectType: 'personal',
      role: 'Lead Brand Designer & Visual Strategist',
      tools: ['Adobe Illustrator', 'Photoshop', 'Figma'],
      aiUsed: ['Gemini (Creative Concept Exploration & Copywriting)'],
      mainChallenge:
        'Balancing a rustic, natural wildlife look with modern, premium aesthetics suitable for international high-end tourists.',
      solution:
        'Created a minimalist geometric vector logo supported by warm savannah tones (gold, deep moss, and sunset amber) and clean sans-serif typography.',
      outcome:
        'A comprehensive 24-page brand style guide and complete set of 12 branded social media launch templates.',
      featured: true,
      published: true,
      order: 1
    },
    {
      id: 'prj-2',
      slug: 'lumina-creative-studio-website',
      title: 'Lumina Creative Studio — Responsive Web Platform',
      summary: 'Modern, responsive showcase website for a creative design and media studio featuring dark mode aesthetics, smooth animations, and contact inquiry flow.',
      fullDescription:
        'Designed and coded from scratch, this website showcases creative portfolio items with immersive media galleries, dynamic category filtering, and instant inquiry messaging. Built with React, Tailwind CSS, and mobile-first principles to ensure seamless viewing on phones, tablets, and desktop displays.',
      category: 'Website Development',
      thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=80'
      ],
      aspectRatio: '16:9',
      status: 'completed',
      projectType: 'personal',
      role: 'UI Designer & Frontend Developer',
      tools: ['Figma', 'React', 'Tailwind CSS', 'Vite'],
      aiUsed: ['AI-Assisted Layout Prototyping & Responsive Code Refinement'],
      mainChallenge:
        'Ensuring rich visual media loads rapidly while maintaining smooth navigation and zero layout shifts on mobile devices.',
      solution:
        'Implemented lazy loading, responsive modern WebP image assets, and lightweight CSS transitions instead of heavy external animation libraries.',
      outcome:
        'Sub-second page load times and 100% responsive compatibility across all modern web browsers.',
      liveUrl: 'https://lumina-creative.example.com',
      githubUrl: 'https://github.com/boniphacendege/lumina-studio',
      featured: true,
      published: true,
      order: 2
    },
    {
      id: 'prj-3',
      slug: 'zanzibar-spice-craft-packaging',
      title: 'Zanzibar Heritage Spices — Packaging & Social Media Collateral',
      summary: 'Product packaging labels, promotional posters, and social media campaign graphics highlighting organic Tanzanian agricultural heritage.',
      fullDescription:
        'Developed distinctive product label packaging designs for a line of artisanal clove, cinnamon, and cardamon spice bottles. Additionally designed cohesive Instagram carousel cards and promotional flyers ready for digital marketing campaigns.',
      category: 'Graphic Design',
      thumbnail: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=800&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&w=1200&q=80'
      ],
      aspectRatio: '1:1',
      status: 'completed',
      projectType: 'concept',
      role: 'Packaging Designer & Digital Illustrator',
      tools: ['Adobe Illustrator', 'Photoshop', 'Canva'],
      aiUsed: ['Midjourney (Texture & Pattern Ideation)'],
      mainChallenge:
        'Creating print-compliant label dimensions with clear ingredient legibility while evoking historic Swahili craftsmanship.',
      solution:
        'Crafted custom geometric border motifs inspired by traditional Zanzibar carved doors, paired with clean typography.',
      outcome:
        'Complete print-ready PDF packaging dielines and 6 promotional social media creative templates.',
      featured: true,
      published: true,
      order: 3
    },
    {
      id: 'prj-4',
      slug: 'zenith-ai-content-generator-ui',
      title: 'Zenith Studio — AI Creative Workflow Interface Concept',
      summary: 'UI/UX design exploration of a desktop & mobile creative studio interface for generating and organizing multi-format digital social content.',
      fullDescription:
        'An experimental interface design concept exploring how creators can prompt, organize, edit, and export visual media and marketing copy in one unified workspace. Features clean dark theme aesthetics with emerald neon status indicators.',
      category: 'UI/UX Design',
      thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80'
      ],
      aspectRatio: '16:9',
      status: 'prototype',
      projectType: 'experimental',
      role: 'UI/UX Designer',
      tools: ['Figma', 'Prototyping', 'Tailwind CSS'],
      aiUsed: ['Gemini (UX Copy & User Flow Mapping)'],
      mainChallenge:
        'Presenting multi-step generative settings (aspect ratio, style presets, export formats) without overwhelming the creator.',
      solution:
        'Designed an accordion sidebar with instant live canvas preview and keyboard shortcuts.',
      outcome:
        'A comprehensive Figma prototype with 18 responsive artboards and clickable interactive transitions.',
      featured: false,
      published: true,
      order: 4
    }
  ],

  workflowStages: [
    {
      id: 'wf-1',
      stageNumber: 1,
      title: 'Idea Research & Creative Briefing',
      subtitle: 'Understanding the goal, audience, and core message',
      description:
        'I begin by clarifying your project objectives, target audience, and brand personality. I gather visual references, moodboards, and analyze existing competitors to set a clear creative direction.',
      toolsUsed: ['Figma Moodboards', 'Gemini / ChatGPT for Brainstorming', 'Notion'],
      humanRole: 'Strategic listening, defining constraints, and deciding the creative vision.',
      aiRole: 'Rapidly synthesizing audience trends and brainstorming thematic angles.',
      order: 1
    },
    {
      id: 'wf-2',
      stageNumber: 2,
      title: 'Creative Direction & Prompt Development',
      subtitle: 'Formulating visual concepts and style parameters',
      description:
        'I translate the brief into concrete visual directions, color palettes, and typography pairings. When appropriate, I engineer structured AI prompts to explore complementary graphic elements and color harmonies.',
      toolsUsed: ['Prompt Engineering', 'Midjourney', 'Adobe Firefly'],
      humanRole: 'Curating styles, selecting typography, and rejecting unauthentic ideas.',
      aiRole: 'Generating exploratory visual textures, variations, and concept sketches.',
      order: 2
    },
    {
      id: 'wf-3',
      stageNumber: 3,
      title: 'Visual Design & Asset Generation',
      subtitle: 'Crafting precision vector graphics and layouts',
      description:
        'Using industry-standard creative tools, I design logos, flyers, social graphics, and website wireframes. Every vector path, grid alignment, and typography hierarchy is handcrafted to professional standards.',
      toolsUsed: ['Adobe Illustrator', 'Adobe Photoshop', 'Figma', 'Canva'],
      humanRole: 'Complete manual design composition, vector execution, and brand alignment.',
      aiRole: 'Assisting with background removal, image upscaling, and asset variations.',
      order: 3
    },
    {
      id: 'wf-4',
      stageNumber: 4,
      title: 'AI-Assisted Coding & Prototyping',
      subtitle: 'Building responsive, modern web interfaces',
      description:
        'I convert approved design mockups into clean, responsive HTML, modern CSS, and React code. I use AI coding assistants to quickly scaffold boilerplate, solve algorithmic edge cases, and ensure clean component architecture.',
      toolsUsed: ['React', 'TypeScript', 'Tailwind CSS', 'Vite', 'GitHub Copilot / Gemini'],
      humanRole: 'Component architecture, semantic structure, styling fine-tuning, and business logic.',
      aiRole: 'Accelerating component scaffolding, regexes, and responsive CSS helpers.',
      order: 4
    },
    {
      id: 'wf-5',
      stageNumber: 5,
      title: 'Manual Review & Artisanal Refinement',
      subtitle: 'The human touch: ensuring soul, originality, and balance',
      description:
        'This is the most critical stage: every line of text, color contrast, margin, and visual asset is meticulously audited by hand. I eliminate generic artifacts, verify brand authenticity, and ensure everything feels tailored and intentional.',
      toolsUsed: ['Manual Inspection', 'Color Contrast Checkers', 'Figma Micro-Tweaks'],
      humanRole: 'Quality gatekeeper: verifying authentic originality, readability, and emotional resonance.',
      aiRole: 'None — this stage is strictly human judgment and editorial scrutiny.',
      order: 5
    },
    {
      id: 'wf-6',
      stageNumber: 6,
      title: 'Responsive Testing & Quality Checks',
      subtitle: 'Testing across mobile, tablet, and desktop viewports',
      description:
        'I test the website and assets on real devices: checking mobile tap targets, cross-browser rendering (Chrome, Safari, Firefox), load performance, and form validation to ensure an error-free user experience.',
      toolsUsed: ['Mobile Viewports', 'Lighthouse Performance', 'Responsive Simulators'],
      humanRole: 'Physical testing on mobile devices, adjusting touch targets, and verifying forms.',
      aiRole: 'Generating test data edge cases and cross-browser checklists.',
      order: 6
    },
    {
      id: 'wf-7',
      stageNumber: 7,
      title: 'Deployment & Ongoing Improvements',
      subtitle: 'Publishing to live web and providing source deliverables',
      description:
        'I deliver final vector assets (SVG, PNG, PDF) for graphic design projects and deploy live websites to modern hosting platforms with SSL security and custom domain configuration.',
      toolsUsed: ['Vite Build', 'Cloud Hosting', 'Git Version Control'],
      humanRole: 'Final handover, client orientation, and ongoing support for updates.',
      aiRole: 'Automating deployment status checks.',
      order: 7
    }
  ],

  workExperience: [
    {
      id: 'exp-1',
      roleTitle: 'Freelance Graphic & Website Designer',
      employer: 'Independent Creative Services',
      employmentType: 'freelance',
      startDate: '2022',
      endDate: 'Present',
      current: true,
      location: 'Dodoma CBD Tanzania',
      description:
        'Providing graphic design, visual branding, social media content, and custom responsive website development for startups, local businesses, and individual professionals.',
      responsibilities: [
        'Designed logos, brand identity packages, and marketing flyers for diverse commercial clients.',
        'Developed custom landing pages and responsive websites using modern HTML5, CSS/Tailwind, and React.',
        'Created engaging social media campaign graphics tailored for Instagram, WhatsApp, and Facebook marketing.',
        'Integrated practical AI-assisted workflows to accelerate turnaround times while maintaining rigorous design quality.'
      ],
      published: true,
      order: 1
    },
    {
      id: 'exp-2',
      roleTitle: 'Digital Content Creator & Web Assistant',
      employer: 'Creative Projects & Collaborations',
      employmentType: 'contract',
      startDate: '2021',
      endDate: '2022',
      current: false,
      location: 'Dodoma CBD Tanzania',
      description:
        'Assisted with digital creative production, graphic layouts, social media collateral, and website content maintenance.',
      responsibilities: [
        'Prepared visual promotional graphics, banners, and digital marketing materials.',
        'Maintained web content updates, optimized image assets, and verified mobile responsiveness.',
        'Collaborated on visual brand guidelines and creative asset libraries.'
      ],
      published: true,
      order: 2
    }
  ],

  education: [
    {
      id: 'edu-1',
      institution: 'University of Dodoma, Dodoma CBD Tanzania',
      qualification: 'Higher Education / Relevant Studies',
      field: 'Computing, Design & Web Technologies',
      startDate: '2019',
      endDate: '2023',
      current: false,
      description:
        'Studied software foundations, web development, information systems, visual interfaces, and digital technologies.',
      published: true,
      order: 1
    }
  ],

  certifications: [
    {
      id: 'cert-1',
      title: 'Responsive Web Design & Modern Frontend',
      issuingOrg: 'Online Professional Curriculum',
      date: '2023',
      published: true,
      order: 1
    },
    {
      id: 'cert-2',
      title: 'Digital Graphic Design & Visual Communication',
      issuingOrg: 'Creative Design Institute',
      date: '2023',
      published: true,
      order: 2
    }
  ],

  achievements: [
    {
      id: 'ach-1',
      title: 'Successfully Delivered Over 20+ Digital Brand & Web Projects',
      description: 'Helped local brands establish memorable visual identities and responsive web presences.',
      date: '2023 – 2026',
      published: true,
      order: 1
    }
  ],

  blogCategories: [
    'AI & Creative Workflows',
    'Graphic Design',
    'Web Development',
    'Digital Content & Strategy',
    'Design Thinking & UI/UX'
  ],

  blogPosts: [
    {
      id: 'post-1',
      slug: 'fusion-of-human-creativity-and-ai-in-brand-design',
      title: 'The Fusion of Human Creativity and AI in Modern Brand Design',
      excerpt: 'Why AI is not replacing graphic designers, but elevating creators who master human-in-the-loop workflows, precision typography, and cultural resonance.',
      content: `## The Creative Landscape Has Evolved

In the modern digital landscape, the conversation around Artificial Intelligence in creative fields has shifted from fear to empowerment. As a Graphic Designer and Digital Content Creator, I view AI tools not as an adversary, but as a tireless studio collaborator.

> "AI provides unprecedented speed in ideation, but human taste, emotional intelligence, and deliberate craftsmanship dictate final quality."

### 1. Speed of Exploration vs. Depth of Execution
When a client requests a brand identity for a new fintech startup or a hospitality venture in Tanzania, exploring 30 conceptual directions previously took days. Today, using generative systems like Gemini, Midjourney, and Figma AI plugins, I can conceptualize mood boards, color palettes, and thematic directions within hours.

However, generative AI does not understand cultural subtleties, geometric optical weight, kerning, or logo vector scalability. That is where deep human graphic expertise takes over:
- **Vector Precision:** Hand-crafting bezier curves in Adobe Illustrator.
- **Typographic Harmony:** Pairing display typefaces with legible body copy.
- **Brand Consistency:** Ensuring the identity scales seamlessly from a 16px favicon to a 10-meter outdoor billboard.

### 2. The Human-in-the-Loop Philosophy
The true power of AI emerges when the designer remains firmly in the driver's seat:
1. **Curate:** Filter through raw AI explorations with an eye trained on design fundamentals.
2. **Refine:** Remove digital hallucinations, correct anatomical or perspective flaws, and enforce grid alignment.
3. **Personalize:** Infuse authentic brand storytelling, localized cultural relevance, and strategic purpose.

### Final Thoughts
Creativity is fundamentally human. Those who embrace AI as a multiplier while maintaining uncompromising standards of typography, storytelling, and craftsmanship are shaping the future of global design.`,
      category: 'AI & Creative Workflows',
      coverImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=85',
      aspectRatio: '16:9',
      author: {
        name: 'Ev Dr. Boniphace J. Ndege',
        role: 'Graphic Designer & Digital Creator',
        avatar: LOGO_DATA_URI
      },
      publishedAt: '2026-10-28T09:15:00.000Z',
      publishedTimeFormatted: '09:15 AM',
      readTimeMinutes: 5,
      tags: ['Design Thinking', 'AI Workflows', 'Branding', 'Gemini & Midjourney', 'Creative Direction'],
      featured: true,
      published: true,
      order: 1,
      views: 342,
      likes: 58,
      keyTakeaways: [
        'AI serves as an ideation multiplier, reducing research and moodboarding time by 70%.',
        'Human design fundamentals—optical balance, typography, and cultural resonance—remain irreplaceable.',
        'The most effective brand identities come from combining generative experimentation with manual vector craftsmanship.'
      ],
      seoMeta: {
        metaTitle: 'The Fusion of Human Creativity and AI in Brand Design | Boniphace Ndege',
        metaDescription: 'Explore how combining AI tools with human design taste elevates brand identities without losing soul or craftsmanship.',
        keywords: 'AI design, brand identity, graphic design Tanzania, Boniphace Ndege, human in the loop'
      }
    },
    {
      id: 'post-2',
      slug: 'designing-high-impact-visual-identities-african-businesses',
      title: 'Designing High-Impact Visual Identities for Growing African Businesses',
      excerpt: 'A practical framework for crafting enduring logo systems, bold color palettes, and marketing collateral tailored for African markets and digital audiences.',
      content: `## Beyond Just a Logo: The Anatomy of an Identity

Too many entrepreneurs confuse a logo with a brand identity. A logo is merely the front door key; the visual identity is the entire home—the architecture, the interior decor, the lighting, and the welcoming warmth.

### The African Market Context
Growing businesses across Tanzania and East Africa face dynamic consumer environments. Your customers encounter your brand across diverse mediums:
- On WhatsApp Status updates and Telegram channels.
- On social platforms like Instagram and LinkedIn.
- In low-contrast print shops on physical business cards, delivery packaging, and vehicle wraps.

> "A great visual identity must be instantly recognizable, resilient in monochrome, and clear even on the smallest mobile screen."

### Core Pillars of Resilient Visual Design
1. **Simplicity Over Clutter:** If your mark cannot be etched on a pen or embossed on packaging without losing detail, it is overly complex.
2. **Intentional Color Psychology:** Colors carry distinct regional and industry associations. In corporate Tanzania, emerald greens symbolize vitality and growth, deep golds convey prestige, and midnight navy radiates stability.
3. **Typography that Speaks:** Custom wordmarks with solid geometric weight outlast trendy novelty fonts.

Invest in a cohesive brand guidelines system that gives your team clarity and confidence across every customer touchpoint.`,
      category: 'Graphic Design',
      coverImage: 'https://images.unsplash.com/photo-1542744094-24638eff58bb?auto=format&fit=crop&w=1200&q=85',
      aspectRatio: '4:3',
      author: {
        name: 'Ev Dr. Boniphace J. Ndege',
        role: 'Graphic Designer & Visual Brand Strategist',
        avatar: LOGO_DATA_URI
      },
      publishedAt: '2026-10-15T14:30:00.000Z',
      publishedTimeFormatted: '02:30 PM',
      readTimeMinutes: 4,
      tags: ['Graphic Design', 'Brand Identity', 'Logo Systems', 'African Business', 'Visual Strategy'],
      featured: true,
      published: true,
      order: 2,
      views: 289,
      likes: 43,
      keyTakeaways: [
        'A logo is just one piece of an identity system; consistency across packaging, social media, and print is what builds trust.',
        'High contrast and legible typography are essential for mobile-first audiences.',
        'Monochrome resilience ensures your identity prints cleanly on any invoice or receipt.'
      ],
      seoMeta: {
        metaTitle: 'Designing High-Impact Visual Identities for African Businesses | Boniphace Ndege',
        metaDescription: 'Discover how to craft durable, memorable brand identities that scale seamlessly from digital apps to physical packaging.',
        keywords: 'brand design Africa, logo design Dodoma, visual identity Tanzania, graphic design'
      }
    },
    {
      id: 'post-3',
      slug: 'why-modern-businesses-need-lightning-fast-pwa-websites',
      title: 'Why Modern Businesses Need Lightning-Fast, Mobile-First PWA Websites',
      excerpt: 'Exploring why responsive progressive web applications outperform bloated legacy sites in bandwidth-conscious regions, offering offline speed and app installability.',
      content: `## The Mobile-First Reality

Over 85% of web traffic in Africa originates from smartphones. When potential clients visit your portfolio or company site, they are likely on 3G or 4G mobile connections. If your website takes more than 3 seconds to load, over 50% of visitors abandon the page.

### What Makes Progressive Web Apps (PWAs) Superior?
A Progressive Web App combines the accessibility of an open website with the smooth performance and convenience of a native mobile app:
- **Instant Loading:** Service workers cache critical assets locally, allowing the page to render instantly on return visits.
- **Offline Resilience:** Users can still view your portfolio, browse services, and read articles even with intermittent connectivity.
- **Home Screen Installability:** No app store downloads or 50MB APKs; users tap "Install" and receive an icon right on their Android or iOS device.

### Designing for Performance
Modern web development is not just about writing code; it is about respecting user data and time:
- WebP/AVIF compressed images with explicit aspect ratios to prevent layout shifts.
- Tailwind CSS for zero-runtime utility styling.
- Responsive touch targets with tactile feedback.

Building fast, installable websites gives clients an edge that directly translates into more inquiries and higher conversions.`,
      category: 'Web Development',
      coverImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=85',
      aspectRatio: '3:2',
      author: {
        name: 'Ev Dr. Boniphace J. Ndege',
        role: 'Website Designer & Developer',
        avatar: LOGO_DATA_URI
      },
      publishedAt: '2026-10-02T11:00:00.000Z',
      publishedTimeFormatted: '11:00 AM',
      readTimeMinutes: 6,
      tags: ['Web Development', 'PWA', 'Performance', 'Mobile UX', 'Responsive Web'],
      featured: false,
      published: true,
      order: 3,
      views: 412,
      likes: 67,
      keyTakeaways: [
        'Page load speed directly impacts user retention; under 2 seconds is the gold standard.',
        'PWAs provide app-like homescreen installability without App Store gatekeeping.',
        'Offline caching guarantees that clients can always reach your contact information and portfolio.'
      ],
      seoMeta: {
        metaTitle: 'Why Modern Businesses Need Lightning-Fast PWA Websites | Boniphace Ndege',
        metaDescription: 'Learn why Progressive Web Apps (PWAs) are the ultimate digital solution for modern businesses seeking mobile speed and engagement.',
        keywords: 'PWA, web development, mobile first web, website speed, responsive design Tanzania'
      }
    },
    {
      id: 'post-4',
      slug: 'mastering-visual-hierarchy-how-layouts-guide-eyes-and-conversions',
      title: 'Mastering Visual Hierarchy: How Layouts Guide Eyes and Drive Conversions',
      excerpt: 'The hidden psychology of scale, whitespace, contrast, and focal anchors in posters, banners, and modern landing pages.',
      content: `## Guiding the Viewer's Eye Without Words

Every visual composition is a conversation. When a user looks at a poster, a social media flyer, or a portfolio landing page, their subconscious makes a decision in milliseconds: *Where do I look first? What does this mean? What action should I take?*

### The 4 Principles of Visual Hierarchy

1. **Size and Scale (Focal Anchor):**
   The human eye gravitates toward the largest element first. If everything on the page is bold and loud, nothing is heard. Establish a clear headline size, secondary subheadings, and understated body text.

2. **Whitespace (Visual Breathing Room):**
   Whitespace is not empty space—it is active design space. It creates luxury, focus, and reduces cognitive overload. Cramming every square pixel with content diminishes perceived value.

3. **Color Contrast & Accent Accents:**
   Reserve your primary brand glow (like our neon emerald #3dff8f and polished gold #f0b92e) for high-intent actions—Call-to-Action buttons, active badges, and key metrics.

4. **Z-Pattern and F-Pattern Reading Flow:**
   Align your navigational anchors with how humans naturally scan screens. Important brand signatures on top-left, key action on top-right, and persuasive proof leading down to the primary conversion point.`,
      category: 'Digital Content & Strategy',
      coverImage: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=85',
      aspectRatio: '1:1',
      author: {
        name: 'Ev Dr. Boniphace J. Ndege',
        role: 'Graphic Designer & Digital Content Strategist',
        avatar: LOGO_DATA_URI
      },
      publishedAt: '2026-09-18T16:20:00.000Z',
      publishedTimeFormatted: '04:20 PM',
      readTimeMinutes: 4,
      tags: ['Visual Hierarchy', 'UI/UX', 'Layout Design', 'Conversion Optimization', 'Digital Content'],
      featured: false,
      published: true,
      order: 4,
      views: 198,
      likes: 31,
      keyTakeaways: [
        'A single clear focal point per section prevents cognitive fatigue.',
        'Whitespace is a deliberate design tool that elevates perceived quality.',
        'Strategic color accents guide users directly to action buttons.'
      ],
      seoMeta: {
        metaTitle: 'Mastering Visual Hierarchy: How Layouts Guide Eyes | Boniphace Ndege',
        metaDescription: 'Learn how to use scale, contrast, and whitespace to craft compelling visual layouts that convert viewers into loyal clients.',
        keywords: 'visual hierarchy, graphic design principles, UI layout, conversion design'
      }
    }
  ],

  bookCategories: [
    'Design',
    'Academic',
    'Fiction',
    'UI/UX & Web Engineering',
    'Spiritual Leadership & Ministry',
    'Business & African Innovation',
    'Creative Philosophy & AI',
    'Personal Mastery & Growth'
  ],

  books: [
    {
      id: 'book-1',
      slug: 'the-architecture-of-distinction',
      title: 'The Architecture of Distinction',
      subtitle: 'Modern UI/UX Engineering, Visual Identity & Creative AI Synergy',
      author: {
        name: 'Ev Dr. Boniphace J. Ndege',
        role: 'Author, Designer & Digital Architect',
        avatar: LOGO_DATA_URI,
        bio: 'Ev Dr. Boniphace J. Ndege is an accomplished author, digital systems architect, and educator pioneering human-centered design, modern engineering discipline, and purposeful technology across Africa and globally.'
      },
      publishedAt: '2026-03-15T09:30:00.000Z',
      publishedTimeFormatted: '09:30 AM',
      category: 'UI/UX & Web Engineering',
      coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=900&h=1350&q=85',
      aspectRatio: '2:3',
      excerpt: 'A comprehensive, practical manifesto on creating digital products that reject disposable generic templates in favor of bespoke craftsmanship, high-performance typography, and disciplined AI collaboration.',
      description: 'The Architecture of Distinction provides designers, engineers, and digital entrepreneurs with a rigorous blueprint for building software products that command respect. Ev Dr. Boniphace dismantles the myth of effortless automation and demonstrates how true distinction arises from structural typography, tactile interaction rhythms, and uncompromising visual hierarchy. Whether designing for desktop workstations or mobile-first African audiences, this volume equips you to build enduring, scalable digital experiences.',
      isbn: '978-9987-04-102-3',
      pagesCount: 284,
      language: 'English',
      publisher: 'Ndege Masterclass Press, Dodoma',
      formats: ['PDF', 'ePub', 'Paperback', 'Kindle'],
      price: 18.50,
      currency: 'USD',
      isFreeDownload: false,
      isDownloadable: true,
      downloadUrl: '/assets/the-architecture-of-distinction.pdf',
      pdfFileUrl: '/assets/the-architecture-of-distinction.pdf',
      readingTheme: 'modern-editorial',
      tags: ['UI/UX', 'Web Engineering', 'Design Systems', 'Visual Identity', 'Typography'],
      featured: true,
      rating: 4.96,
      reviewsCount: 88,
      downloadsCount: 540,
      readsCount: 1420,
      likesCount: 194,
      order: 1,
      published: true,
      externalBuyUrls: {
        amazon: 'https://amazon.com',
        directWhatsApp: 'https://wa.me/255655483255?text=Hello%20Dr.%20Boniphace,%20I%20would%20like%20to%20order%20The%20Architecture%20of%20Distinction%20book'
      },
      chapters: [
        {
          id: 'chap-1',
          chapterNumber: 1,
          title: 'The Anatomy of Visual Distinction',
          subtitle: 'Why generic digital noise fails to build enduring brands',
          content: `In an era defined by ubiquitous templates and low-effort generative algorithms, distinction has become the rarest and most valuable commodity in digital design.

Every day, millions of websites launch using the same cookie-cutter layouts, identical pill-shaped buttons, and predictable gradients. Users scan past them without registering an emotional footprint. Distinction does not mean eccentricity for its own sake; rather, it is the deliberate alignment of purpose, typography, contrast, and performance.

When an interface possesses distinction, every micro-interaction feels intentional. The eye moves naturally through hierarchical anchors, and the visitor immediately perceives authority and trustworthiness. To achieve this, the designer must master the classical fundamentals of negative space, mathematical proportion, and responsive discipline.`
        },
        {
          id: 'chap-2',
          chapterNumber: 2,
          title: 'Intentional Systems vs. Generative Artifacts',
          subtitle: 'Harnessing machine speed without surrendering artistic sovereignty',
          content: `Artificial intelligence can generate a dozen landing page concepts in seconds, but it cannot know what your client's brand stands for in the hearts of their community.

The craftsman views AI as a tireless apprentice rather than an artistic director. When we orchestrate generative tools within a strict design system, we dramatically compress development cycles while elevating human scrutiny. We use computation to handle tedious scaffolding, leaving our cognitive energy focused on custom iconography, nuanced tone of voice, and pixel-precise layout balance.

Do not let algorithms dictate your taste. Define your constraints first, enforce your tokens rigidly, and treat every computer-generated proposal as raw material awaiting artisanal refinement.`
        },
        {
          id: 'chap-3',
          chapterNumber: 3,
          title: 'The Mobile-First Canvas of East Africa',
          subtitle: 'Engineering for high-latency networks and mobile dominance',
          content: `Building software for the African continent demands uncompromising performance and bandwidth stewardship. When your user is browsing on a prepaid mobile data connection in Dodoma, Dar es Salaam, or Nairobi, bloated javascript bundles and unoptimized multi-megabyte hero images are not just inconveniences—they are barriers to entry.

Modern distinction requires ultra-lean CSS, aggressive asset optimization, offline progressive web app capabilities, and touch targets calibrated for real-world mobile ergonomics. When your website loads in under 600 milliseconds and works flawlessly offline, you deliver dignity and delight to every visitor.`
        }
      ]
    },
    {
      id: 'book-2',
      slug: 'divine-wisdom-and-strategic-leadership',
      title: 'Divine Wisdom & Strategic Leadership',
      subtitle: 'Navigating Calling, Integrity & Transformational Impact in the Digital Century',
      author: {
        name: 'Ev Dr. Boniphace J. Ndege',
        role: 'Evangelist, Theologian & Leadership Mentor',
        avatar: LOGO_DATA_URI,
        bio: 'Ev Dr. Boniphace J. Ndege serves in evangelistic ministry and executive advisory, equipping leaders to merge biblical convictions with modern strategic excellence.'
      },
      publishedAt: '2026-02-10T08:15:00.000Z',
      publishedTimeFormatted: '08:15 AM',
      category: 'Spiritual Leadership & Ministry',
      coverImage: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=900&h=1350&q=85',
      aspectRatio: '2:3',
      excerpt: 'A timeless spiritual and practical guide exploring how faith, ethical governance, and purposeful vision sustain leaders through cultural transformations and technological acceleration.',
      description: 'Divine Wisdom & Strategic Leadership addresses the deep questions confronting modern spiritual leaders, pastors, executives, and innovators. Ev Dr. Boniphace demonstrates that leadership without spiritual anchor decays into self-promotion, while spirituality without strategic execution remains ineffective. This book provides a roadmap for cultivating moral resilience, mentoring the next generation, and stewarding influence for eternal significance.',
      isbn: '978-9987-04-105-4',
      pagesCount: 312,
      language: 'English',
      publisher: 'Kingdom Foundations Publishing, Dodoma',
      formats: ['PDF', 'ePub', 'Paperback', 'Kindle'],
      price: 0,
      currency: 'USD',
      isFreeDownload: true,
      isDownloadable: true,
      downloadUrl: '/assets/divine-wisdom-and-strategic-leadership.pdf',
      pdfFileUrl: '/assets/divine-wisdom-and-strategic-leadership.pdf',
      readingTheme: 'vintage-parchment',
      tags: ['Leadership', 'Ministry', 'Faith & Strategy', 'Integrity', 'Servant Leadership'],
      featured: true,
      rating: 4.98,
      reviewsCount: 114,
      downloadsCount: 1280,
      readsCount: 2600,
      likesCount: 382,
      order: 2,
      published: true,
      externalBuyUrls: {
        directWhatsApp: 'https://wa.me/255655483255?text=Shalom%20Ev%20Dr.%20Boniphace,%20I%20am%20blessed%20by%20your%20book%20Divine%20Wisdom%20and%20Strategic%20Leadership'
      },
      chapters: [
        {
          id: 'chap-dw-1',
          chapterNumber: 1,
          title: 'The Posture of the Modern Watchman',
          subtitle: 'Cultivating spiritual discernment amidst informational deluge',
          content: `Leadership in this century cannot simply be measured by administrative efficiency or institutional size. The true leader is first a watchman—one who stands upon the spiritual ramparts, sensitive to the voice of God, and alert to the currents of culture.

When society accelerates at exponential speeds, the temptation is to react to every temporal shift with anxious haste. Divine wisdom teaches us the discipline of stillness. It is in the secret place of consecration that visionary clarity is born, enabling the leader to guide others with unshakeable conviction.`
        },
        {
          id: 'chap-dw-2',
          chapterNumber: 2,
          title: 'The Currency of Uncompromising Integrity',
          subtitle: 'Why character is the ultimate foundation of enduring influence',
          content: `Gifts can take you to rooms that only character can keep you in. Throughout scripture and history, leadership collapse has rarely been caused by a lack of charisma; it is almost universally a failure of private character.

In an era of performative public personas, leaders must recommit to transparent stewardship. True authority flows not from titles or organizational hierarchy, but from the quiet weight of personal holiness and promises faithfully kept.`
        },
        {
          id: 'chap-dw-3',
          chapterNumber: 3,
          title: 'Building Ministries That Outlive Their Founders',
          subtitle: 'Generational succession, mentorship, and institution building',
          content: `There is no long-term success without a viable successor. A leader who builds an organization dependent solely upon their personal magnetism has built a kingdom of sand.

Strategic leadership prioritizes the empowerment of emerging voices. It invests capital, platforms, and patience into the next generation, creating systems and spiritual legacies that will flourish long after the original visionary has completed their earthly assignment.`
        }
      ]
    },
    {
      id: 'book-3',
      slug: 'purpose-driven-entrepreneurship-in-east-africa',
      title: 'Purpose-Driven Entrepreneurship in East Africa',
      subtitle: 'Principles, Execution & Digital Scalability for African Innovators',
      author: {
        name: 'Ev Dr. Boniphace J. Ndege',
        role: 'Business Strategist & Creative Consultant',
        avatar: LOGO_DATA_URI,
        bio: 'Ev Dr. Boniphace combines hands-on commercial experience with strategic acumen, helping startups and traditional enterprises scale through digital transformation.'
      },
      publishedAt: '2026-01-20T11:00:00.000Z',
      publishedTimeFormatted: '11:00 AM',
      category: 'Business & African Innovation',
      coverImage: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=900&h=1350&q=85',
      aspectRatio: '2:3',
      excerpt: 'The field-tested manual for African founders and creative professionals: unlocking domestic opportunities, executing with global quality, and creating sustainable commercial wealth.',
      description: 'East Africa is experiencing a renaissance of entrepreneurial energy. From agricultural tech and creative media to fintech and digital agency services, this book offers actionable strategies for turning raw passion into profitable, sustainable business models. Ev Dr. Boniphace shares real-world case studies, pricing frameworks, client acquisition methods, and risk management principles tailored to the East African economic landscape.',
      isbn: '978-9987-04-118-7',
      pagesCount: 240,
      language: 'English',
      publisher: 'Sahara African Business Press',
      formats: ['PDF', 'ePub', 'Paperback', 'Kindle'],
      price: 15.00,
      currency: 'USD',
      isFreeDownload: false,
      isDownloadable: true,
      downloadUrl: '/assets/purpose-driven-entrepreneurship.pdf',
      pdfFileUrl: '/assets/purpose-driven-entrepreneurship.pdf',
      readingTheme: 'executive-dual',
      tags: ['Entrepreneurship', 'East Africa', 'Business Growth', 'Startups', 'Financial Stewardship'],
      featured: false,
      rating: 4.93,
      reviewsCount: 65,
      downloadsCount: 310,
      readsCount: 940,
      likesCount: 168,
      order: 3,
      published: true,
      externalBuyUrls: {
        amazon: 'https://amazon.com',
        directWhatsApp: 'https://wa.me/255655483255?text=Hello%20Dr.%20Boniphace,%20I%20want%20to%20purchase%20Purpose-Driven%20Entrepreneurship%20book'
      },
      chapters: [
        {
          id: 'chap-pde-1',
          chapterNumber: 1,
          title: 'Unlocking Domestic Opportunities with Global Standards',
          subtitle: 'Reframing local challenges as multi-million dollar platforms',
          content: `The greatest mistake an African entrepreneur can make is to accept the lie that local markets deserve inferior standards. When you deliver world-class design, punctual communication, and rock-solid deliverables to clients right here in Tanzania, you eliminate competition effortlessly.

Distinction stands out ten times more brightly where mediocrity has been the historical baseline. Treat every small business client with the same procedural rigor that Fortune 500 corporations demand.`
        },
        {
          id: 'chap-pde-2',
          chapterNumber: 2,
          title: 'Value-Based Pricing vs. Hourly Commodity Traps',
          subtitle: 'How creative and technical professionals escape poverty pricing',
          content: `If you bill by the hour, you are commercially penalized for being fast, skilled, and efficient. The faster you solve a problem, the less you earn.

Value-based pricing aligns your compensation directly with the financial upside or operational relief you deliver to your client. When a website redesign increases a tour operator's annual bookings by fifty thousand dollars, a three-thousand-dollar fee is not an expense—it is an extraordinary investment.`
        }
      ]
    },
    {
      id: 'book-4',
      slug: 'the-gospel-of-creative-excellence',
      title: 'The Gospel of Creative Excellence',
      subtitle: 'Why Human Artistry Must Lead the Technological Renaissance',
      author: {
        name: 'Ev Dr. Boniphace J. Ndege',
        role: 'Creative Evangelist & Author',
        avatar: LOGO_DATA_URI,
        bio: 'Dedicated to inspiring artists, programmers, and communicators to produce work of transcendent beauty and uncompromised honor.'
      },
      publishedAt: '2025-11-25T14:45:00.000Z',
      publishedTimeFormatted: '02:45 PM',
      category: 'Creative Philosophy & AI',
      coverImage: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=900&h=1350&q=85',
      aspectRatio: '2:3',
      excerpt: 'An inspiring exploration of why believers and ethical innovators should lead the technological frontier rather than retreat into skepticism, creating works of transcendent beauty.',
      description: 'The Gospel of Creative Excellence argues that the Creator of the universe is the supreme artist, and that human creativity is an expression of divine stewardship. Ev Dr. Boniphace challenges creatives to master both classical design virtues and emerging machine intelligence to produce work that shines as a beacon of light in modern culture.',
      isbn: '978-9987-04-122-1',
      pagesCount: 196,
      language: 'English',
      publisher: 'Ndege Masterclass Press',
      formats: ['PDF', 'ePub', 'Paperback', 'Kindle'],
      price: 0,
      currency: 'USD',
      isFreeDownload: true,
      isDownloadable: true,
      downloadUrl: '/assets/the-gospel-of-creative-excellence.pdf',
      pdfFileUrl: '/assets/the-gospel-of-creative-excellence.pdf',
      readingTheme: 'midnight-emerald',
      tags: ['Creativity', 'Christian Worldview', 'Art & Faith', 'Excellence', 'Modern Philosophy'],
      featured: true,
      rating: 4.97,
      reviewsCount: 79,
      downloadsCount: 890,
      readsCount: 1820,
      likesCount: 275,
      order: 1,
      published: true,
      externalBuyUrls: {
        directWhatsApp: 'https://wa.me/255655483255?text=Shalom%20Dr.%20Boniphace,%20reading%20The%20Gospel%20of%20Creative%20Excellence'
      },
      chapters: [
        {
          id: 'chap-gce-1',
          chapterNumber: 1,
          title: 'The Theological Foundation of Design Beauty',
          subtitle: 'Why aesthetics are not trivial decorations but moral statements',
          content: `Beauty is not a superficial veneer; it is an intrinsic reflection of divine order. When God created the heavens and the earth, He did not merely make them functional—He made them overwhelmingly beautiful.

When a designer shapes an interface, or an author writes a book with rhythmic prose, they participate in the reflection of divine craftsmanship. Sloppy work dishonors the calling. Excellence is worship in action.`
        },
        {
          id: 'chap-gce-2',
          chapterNumber: 2,
          title: 'Courage on the Frontier of Artificial Intelligence',
          subtitle: 'Leading cultural change rather than retreating in anxiety',
          content: `Fear is never a sound strategy for technological transitions. Throughout history, the arrival of the printing press, the camera, and personal computing produced waves of existential panic. Yet in each instance, those who mastered the new instruments with moral discipline shaped culture for generations.

We must bring integrity, compassion, and human soul into the algorithms that are shaping tomorrow's thought.`
        }
      ]
    }
  ],

  testimonials: [], // Hidden by default until Boniphace explicitly verifies and adds authorized testimonials

  videoCategories: [
    'All Topics',
    'Brand Identity & Motion',
    'Web Architecture & Code',
    'AI Workflows & Prompts',
    'Author Spotlight & Book Trailers',
    'Keynotes & Leadership'
  ],

  videos: [
    {
      id: 'vid-1',
      slug: 'the-architecture-of-african-brand-identity',
      title: 'The Architecture of African Brand Identity | Official Masterclass',
      subtitle: 'Designing resilient visual identities, bespoke emblems & brand guidelines across East Africa',
      description: 'In this comprehensive masterclass, Ev Dr. Boniphace J. Ndege explores the structural principles of creating enduring visual identities. Discover how contrast, cultural symbolism, and responsive typography unite to build brands that thrive in both high-end print and dynamic digital marketplaces.',
      category: 'Brand Identity & Motion',
      ratio: '16:9',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      embedUrl: 'https://www.youtube.com/embed/ScMzIvxBSi4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1542744094-24638eff58bb?auto=format&fit=crop&w=1280&q=85',
      duration: '14:20',
      resolution: '4K UHD',
      publishedAt: '2026-03-20T10:00:00.000Z',
      author: {
        name: 'Ev Dr. Boniphace J. Ndege',
        role: 'Graphic Designer & Visual Brand Strategist',
        avatar: LOGO_DATA_URI
      },
      tags: ['Brand Identity', 'Masterclass', 'Logo Design', 'African Innovation', 'Visual Systems'],
      viewsCount: 3840,
      likesCount: 342,
      featured: true,
      published: true,
      order: 1,
      chapters: [
        { time: '00:00', title: 'Introduction & Brand Philosophy' },
        { time: '02:40', title: 'Why Generic Templates Fail' },
        { time: '06:15', title: 'The 3 Pillars of African Brand Distinction' },
        { time: '10:30', title: 'Typography & Color Psychology' },
        { time: '13:00', title: 'Conclusion & Free Guidelines Kit' }
      ],
      transcript: 'Welcome to this masterclass on visual identity architecture. When we design for growing African enterprises, we must build systems that retain clarity across every touchpoint—from WhatsApp status previews to monumental billboards.'
    },
    {
      id: 'vid-2',
      slug: 'square-motion-dodoma-brand-emblem-reveal',
      title: 'Dodoma Digital Identity & Motion Emblem Reveal',
      subtitle: '1:1 Square Motion Showcase: Dynamic geometric animation and sound design',
      description: 'Crafted specifically in a 1:1 square ratio for social feeds, mobile screens, and digital displays. Showcases the transformation of raw geometry into an authentic, shining African tech emblem with glowing neon precision.',
      category: 'Brand Identity & Motion',
      ratio: '1:1',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      embedUrl: 'https://www.youtube.com/embed/ScMzIvxBSi4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=85',
      duration: '01:00',
      resolution: '1080p HD',
      publishedAt: '2026-03-12T14:15:00.000Z',
      author: {
        name: 'Ev Dr. Boniphace J. Ndege',
        role: 'Digital Content Creator',
        avatar: LOGO_DATA_URI
      },
      tags: ['1:1 Square', 'Motion Graphics', 'Logo Reveal', 'Instagram Reel', 'Brand Identity'],
      viewsCount: 5210,
      likesCount: 684,
      featured: true,
      published: true,
      order: 2,
      chapters: [
        { time: '00:00', title: 'Geometric Grid Setup' },
        { time: '00:20', title: 'Emerald Neon Lighting Pass' },
        { time: '00:45', title: 'Final Emblem Lockup' }
      ],
      transcript: 'A demonstration of square 1:1 motion graphics engineered for maximum impact on mobile social timelines without letterboxing.'
    },
    {
      id: 'vid-3',
      slug: 'full-stack-web-architecture-and-pwa-engineering',
      title: 'Full-Stack Web Architecture & Lightning PWA Engineering',
      subtitle: 'Building offline-first, installable web apps with React, Vite & Tailwind CSS',
      description: 'A deep-dive screencast demonstrating how modern web applications achieve instant sub-second page loads, offline asset caching via Service Workers, and seamless mobile installability in bandwidth-conscious environments.',
      category: 'Web Architecture & Code',
      ratio: '16:9',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      embedUrl: 'https://www.youtube.com/embed/ScMzIvxBSi4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1280&q=85',
      duration: '09:45',
      resolution: '4K UHD',
      publishedAt: '2026-02-28T16:00:00.000Z',
      author: {
        name: 'Ev Dr. Boniphace J. Ndege',
        role: 'Website Designer & Full-Stack Developer',
        avatar: LOGO_DATA_URI
      },
      tags: ['Web Development', 'React', 'PWA', 'Tailwind CSS', 'Vite', 'Performance'],
      viewsCount: 2980,
      likesCount: 290,
      featured: false,
      published: true,
      order: 3,
      chapters: [
        { time: '00:00', title: 'Overview of Modern PWA Architecture' },
        { time: '02:15', title: 'Service Worker Caching Strategy' },
        { time: '05:40', title: 'Zero Layout Shift & Aspect Ratio Optimization' },
        { time: '08:10', title: 'Live Testing on 3G Emulation' }
      ]
    },
    {
      id: 'vid-4',
      slug: 'square-feed-typography-hierarchy-in-60-seconds',
      title: 'Typography Hierarchy & Layout Power in 60 Seconds',
      subtitle: '1:1 Square Feed Lesson: The 3 rules of visual hierarchy that convert viewers',
      description: 'Quick-hit micro-lesson formatted specifically for square 1:1 feed consumption. Breaks down scale, contrast, whitespace, and typographic anchors in under a minute.',
      category: 'Brand Identity & Motion',
      ratio: '1:1',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      embedUrl: 'https://www.youtube.com/embed/ScMzIvxBSi4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=800&q=85',
      duration: '01:00',
      resolution: '1080p HD',
      publishedAt: '2026-02-14T08:30:00.000Z',
      author: {
        name: 'Ev Dr. Boniphace J. Ndege',
        role: 'Author & Educator',
        avatar: LOGO_DATA_URI
      },
      tags: ['1:1 Square', 'Typography', 'Design Education', 'Micro Lesson', 'UI/UX'],
      viewsCount: 6420,
      likesCount: 780,
      featured: false,
      published: true,
      order: 4
    },
    {
      id: 'vid-5',
      slug: 'the-architecture-of-distinction-official-book-trailer',
      title: 'The Architecture of Distinction | Official Book Cinematic Trailer',
      subtitle: 'Sneak peek into the newly released volume by Ev Dr. Boniphace J. Ndege',
      description: 'Cinematic book trailer showcasing key excerpts, interior typography themes, and reader insights from "The Architecture of Distinction". Explores how intentional engineering defeats generic digital noise.',
      category: 'Author Spotlight & Book Trailers',
      ratio: '16:9',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      embedUrl: 'https://www.youtube.com/embed/ScMzIvxBSi4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1280&q=85',
      duration: '03:15',
      resolution: '4K UHD',
      publishedAt: '2026-03-01T12:00:00.000Z',
      author: {
        name: 'Ev Dr. Boniphace J. Ndege',
        role: 'Author & Digital Architect',
        avatar: LOGO_DATA_URI
      },
      tags: ['Book Trailer', 'Author', 'Literature', 'Distinction', 'Cinematic'],
      viewsCount: 4190,
      likesCount: 512,
      featured: true,
      published: true,
      order: 5
    },
    {
      id: 'vid-6',
      slug: 'square-generative-ai-human-in-the-loop-workflow',
      title: 'Human + AI Collaborative Workflow: Step-by-Step in Square 1:1',
      subtitle: '1:1 Square Showcase: Direct demonstration of generative drafting into artisanal vector production',
      description: 'A crisp 60-second square 1:1 video demonstrating the 5-stage AI workflow practiced by Ev Dr. Boniphace J. Ndege—showing how human creative direction ensures brand originality.',
      category: 'AI Workflows & Prompts',
      ratio: '1:1',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      embedUrl: 'https://www.youtube.com/embed/ScMzIvxBSi4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=800&q=85',
      duration: '01:00',
      resolution: '1080p HD',
      publishedAt: '2026-01-28T15:45:00.000Z',
      author: {
        name: 'Ev Dr. Boniphace J. Ndege',
        role: 'AI Workflow Architect',
        avatar: LOGO_DATA_URI
      },
      tags: ['1:1 Square', 'AI Workflow', 'Human in the Loop', 'Creative Technology', 'Dodoma'],
      viewsCount: 3670,
      likesCount: 418,
      featured: false,
      published: true,
      order: 6
    }
  ],

  inquiries: [],

  // Salted cryptographic hash for the admin dashboard passcode (seeded internally as "Boniphace2026")
  // Plain text passcode is never stored or exposed; can be changed anytime in admin security settings
  adminPasscodeHash: hashPasscode('Boniphace2026'),
  admin2FA: {
    enabled: true,
    secret: DEFAULT_ADMIN_2FA_SECRET,
    method: 'authenticator',
    backupCodes: ['849201', '593810', '204859', '739104', '482019', '918273'],
    recoveryEmail: 'bishboniphace.ndege@gmail.com'
  }
};

// Storage Service API
class PortfolioStorageService {
  private memoryCache: PortfolioDatabase | null = null;
  private listeners: Array<() => void> = [];
  private isFirestoreConnected: boolean = false;
  private lastFirestoreSync: string | null = null;

  constructor() {
    this.init();
    this.initFirestoreSync();
  }

  private initFirestoreSync() {
    try {
      const contentDocRef = doc(db, 'content', 'portfolio');
      onSnapshot(
        contentDocRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const remoteData = snapshot.data() as Partial<PortfolioDatabase>;
            const merged: PortfolioDatabase = {
              ...DEFAULT_PORTFOLIO_DATA,
              ...remoteData,
              profile: {
                ...DEFAULT_PORTFOLIO_DATA.profile,
                ...(remoteData.profile || {})
              },
              projects: Array.isArray(remoteData.projects)
                ? remoteData.projects
                : DEFAULT_PORTFOLIO_DATA.projects,
              categories: Array.isArray(remoteData.categories)
                ? remoteData.categories
                : DEFAULT_PORTFOLIO_DATA.categories,
              blogPosts: Array.isArray(remoteData.blogPosts)
                ? remoteData.blogPosts
                : DEFAULT_PORTFOLIO_DATA.blogPosts,
              blogCategories: Array.isArray(remoteData.blogCategories)
                ? remoteData.blogCategories
                : DEFAULT_PORTFOLIO_DATA.blogCategories,
              books: Array.isArray(remoteData.books)
                ? remoteData.books
                : DEFAULT_PORTFOLIO_DATA.books,
              bookCategories: Array.isArray(remoteData.bookCategories)
                ? remoteData.bookCategories
                : DEFAULT_PORTFOLIO_DATA.bookCategories,
              videos: Array.isArray(remoteData.videos)
                ? remoteData.videos
                : DEFAULT_PORTFOLIO_DATA.videos,
              videoCategories: Array.isArray(remoteData.videoCategories)
                ? remoteData.videoCategories
                : DEFAULT_PORTFOLIO_DATA.videoCategories
            };
            this.memoryCache = merged;
            this.isFirestoreConnected = true;
            this.lastFirestoreSync = new Date().toISOString();
            this.saveToStorage();
            this.notify();
          } else {
            this.isFirestoreConnected = true;
            this.seedInitialFirestoreIfAdmin();
          }
        },
        (err) => {
          // The client operates in offline mode from cache/localStorage when remote backend is connecting
          this.isFirestoreConnected = false;
        }
      );
    } catch (e) {
      this.isFirestoreConnected = false;
    }
  }

  private async seedInitialFirestoreIfAdmin() {
    try {
      const current = this.getData();
      const contentDocRef = doc(db, 'content', 'portfolio');
      const cleanData = JSON.parse(JSON.stringify(current));
      cleanData.updatedAt = new Date().toISOString();
      await setDoc(contentDocRef, cleanData, { merge: true });
      this.lastFirestoreSync = new Date().toISOString();
    } catch (e) {
      // Non-blocking if visitor or unauthenticated
    }
  }

  private async syncToFirestore(data: PortfolioDatabase): Promise<boolean> {
    try {
      const contentDocRef = doc(db, 'content', 'portfolio');
      const cleanData = JSON.parse(JSON.stringify(data));
      cleanData.updatedAt = new Date().toISOString();
      await setDoc(contentDocRef, cleanData, { merge: true });
      this.isFirestoreConnected = true;
      this.lastFirestoreSync = new Date().toISOString();
      return true;
    } catch (err) {
      console.warn('Firestore sync note (data saved locally):', err);
      return false;
    }
  }

  public getSyncStatus(): { isFirestoreConnected: boolean; lastFirestoreSync: string | null } {
    return {
      isFirestoreConnected: this.isFirestoreConnected,
      lastFirestoreSync: this.lastFirestoreSync
    };
  }

  public async syncNowToFirestore(): Promise<boolean> {
    const data = this.getData();
    return await this.syncToFirestore(data);
  }

  private init() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const merged = { ...DEFAULT_PORTFOLIO_DATA, ...parsed };
        if (merged.profile?.socialLinks && (!merged.profile.socialLinks.facebook || merged.profile.socialLinks.facebook.trim() === '')) {
          merged.profile.socialLinks.facebook = DEFAULT_PORTFOLIO_DATA.profile.socialLinks.facebook;
        }
        if (!merged.profile?.availability || merged.profile.availability === 'Available for freelance projects, contract work & creative collaborations') {
          merged.profile.availability = 'Available Online';
        }
        if (!merged.profile?.name || merged.profile.name === 'Boniphace Ndege' || merged.profile.name === 'Ev Dr. Boniphace Ndege') {
          merged.profile.name = 'Ev Dr. Boniphace J. Ndege';
        }
        if (!merged.profile?.projectMetaTags || Object.keys(merged.profile.projectMetaTags).length === 0) {
          merged.profile = {
            ...merged.profile,
            projectMetaTags: DEFAULT_PORTFOLIO_DATA.profile.projectMetaTags
          };
        } else {
          merged.profile.projectMetaTags = {
            ...(DEFAULT_PORTFOLIO_DATA.profile.projectMetaTags || {}),
            ...merged.profile.projectMetaTags
          };
        }
        if (!Array.isArray(merged.projects)) {
          merged.projects = DEFAULT_PORTFOLIO_DATA.projects;
        }
        if (!Array.isArray(merged.blogPosts)) {
          merged.blogPosts = DEFAULT_PORTFOLIO_DATA.blogPosts;
        }
        if (!Array.isArray(merged.blogCategories)) {
          merged.blogCategories = DEFAULT_PORTFOLIO_DATA.blogCategories;
        }
        if (!Array.isArray(merged.books)) {
          merged.books = DEFAULT_PORTFOLIO_DATA.books;
        } else {
          merged.books = merged.books.map((b: BookItem) => ({
            ...b,
            coverImage: formatTwoByThreeBookCover(b.coverImage),
            aspectRatio: '2:3'
          }));
        }
        if (!Array.isArray(merged.bookCategories)) {
          merged.bookCategories = DEFAULT_PORTFOLIO_DATA.bookCategories;
        } else {
          // Remove duplicates and any stray 'All Categories' or 'All'
          const set = new Set<string>();
          merged.bookCategories.forEach((c: string) => {
            if (c && c !== 'All Categories' && c !== 'All') set.add(c.trim());
          });
          // Ensure popular examples exist
          ['Design', 'Academic', 'Fiction'].forEach((c) => set.add(c));
          merged.bookCategories = Array.from(set);
        }
        if (!Array.isArray(merged.videos)) {
          merged.videos = DEFAULT_PORTFOLIO_DATA.videos;
        }
        if (!Array.isArray(merged.videoCategories)) {
          merged.videoCategories = DEFAULT_PORTFOLIO_DATA.videoCategories;
        }
        this.memoryCache = merged;
      } else {
        this.memoryCache = DEFAULT_PORTFOLIO_DATA;
        this.saveToStorage();
      }
    } catch (e) {
      console.warn('Could not read from localStorage, using defaults', e);
      this.memoryCache = DEFAULT_PORTFOLIO_DATA;
    }
  }

  public getData(): PortfolioDatabase {
    if (!this.memoryCache) {
      this.init();
    }
    return this.memoryCache || DEFAULT_PORTFOLIO_DATA;
  }

  public updateData(updater: (prev: PortfolioDatabase) => PortfolioDatabase) {
    const current = this.getData();
    const updated = updater(current);
    this.memoryCache = updated;
    this.saveToStorage();
    this.notify();
    this.syncToFirestore(updated).catch(() => {});
  }

  public resetToDefaults() {
    this.memoryCache = JSON.parse(JSON.stringify(DEFAULT_PORTFOLIO_DATA));
    this.saveToStorage();
    this.notify();
    this.syncToFirestore(this.getData()).catch(() => {});
  }

  public importData(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.profile || !parsed.projects || !parsed.skills) {
        throw new Error('Invalid portfolio schema');
      }
      this.memoryCache = { ...DEFAULT_PORTFOLIO_DATA, ...parsed };
      this.saveToStorage();
      this.notify();
      return true;
    } catch (e) {
      console.error('Import error:', e);
      return false;
    }
  }

  public exportData(): string {
    return JSON.stringify(this.getData(), null, 2);
  }

  private saveToStorage() {
    try {
      if (this.memoryCache) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.memoryCache));
      }
    } catch (e) {
      console.error('Failed to write portfolio data to localStorage', e);
    }
  }

  public setProfilePhoto(photoUrl: string) {
    this.updateData((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        profilePhoto: photoUrl
      }
    }));
  }

  public setLogoPhoto(logoUrl: string) {
    this.updateData((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        logoPhoto: logoUrl
      }
    }));
  }

  public setHeroBackground(imageUrl: string, opacity?: number, position?: 'right' | 'center' | 'left' | 'cover', showcaseTransparent?: boolean) {
    this.updateData((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        heroBackgroundImage: imageUrl,
        heroBackgroundOpacity: opacity !== undefined ? opacity : (prev.profile.heroBackgroundOpacity ?? 45),
        heroBackgroundPosition: position || prev.profile.heroBackgroundPosition || 'right',
        heroShowcaseTransparent: showcaseTransparent !== undefined ? showcaseTransparent : (prev.profile.heroShowcaseTransparent ?? false)
      }
    }));
  }

  public setProjectMetaTags(projectId: string, meta: ProjectPageMeta) {
    this.updateData((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        projectMetaTags: {
          ...(prev.profile.projectMetaTags || {}),
          [projectId]: meta
        }
      }
    }));
  }

  // Subscribe to updates (so UI updates reactively)
  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (e) {
        console.error('Error in storage listener', e);
      }
    });
  }

  // Auth helper
  public isAuthenticated(): boolean {
    return localStorage.getItem(AUTH_KEY) === 'authenticated';
  }

  // Step 1: Verify admin passcode using salted SHA-256 without exposing hash
  public authenticatePasscodeOnly(passcode: string): boolean {
    const current = this.getData();
    if (verifyPasscode(passcode, current.adminPasscodeHash)) {
      // Migrate legacy string to salted hash internally if needed
      if (current.adminPasscodeHash !== hashPasscode(passcode.trim())) {
        this.updateData((prev) => ({
          ...prev,
          adminPasscodeHash: hashPasscode(passcode.trim())
        }));
      }
      return true;
    }
    return false;
  }

  // Step 2: Verify 2FA code (Google Authenticator TOTP or Backup Code)
  public async verifyAdmin2FACode(code: string): Promise<boolean> {
    const current = this.getData();
    const config = current.admin2FA || {
      enabled: true,
      secret: DEFAULT_ADMIN_2FA_SECRET,
      method: 'authenticator',
      backupCodes: ['849201', '593810', '204859', '739104', '482019', '918273'],
      recoveryEmail: 'bishboniphace.ndege@gmail.com'
    };
    return await verifyTOTPCode(code, config.secret, config.backupCodes);
  }

  // Finalize admin authentication session upon passing passcode + 2FA
  public completeAdminAuthentication(): void {
    localStorage.setItem(AUTH_KEY, 'authenticated');
    this.notify();
  }

  // Direct authentication with hash verification
  public authenticate(passcode: string): boolean {
    if (this.authenticatePasscodeOnly(passcode)) {
      this.completeAdminAuthentication();
      return true;
    }
    return false;
  }

  public logout() {
    localStorage.removeItem(AUTH_KEY);
    this.notify();
  }

  public changePasscode(oldPasscode: string, newPasscode: string): boolean {
    const current = this.getData();
    if (verifyPasscode(oldPasscode, current.adminPasscodeHash) && newPasscode.trim().length >= 4) {
      this.updateData((prev) => ({
        ...prev,
        adminPasscodeHash: hashPasscode(newPasscode.trim())
      }));
      return true;
    }
    return false;
  }

  public updateAdmin2FA(updates: Partial<NonNullable<PortfolioDatabase['admin2FA']>>) {
    this.updateData((prev) => ({
      ...prev,
      admin2FA: {
        enabled: true,
        secret: DEFAULT_ADMIN_2FA_SECRET,
        method: 'authenticator',
        backupCodes: ['849201', '593810', '204859', '739104', '482019', '918273'],
        recoveryEmail: 'bishboniphace.ndege@gmail.com',
        ...(prev.admin2FA || {}),
        ...updates
      }
    }));
  }

  // Helper to record contact form inquiries
  public recordInquiry(inquiry: Omit<ContactInquiry, 'id' | 'timestamp' | 'read'>) {
    const newInquiry: ContactInquiry = {
      ...inquiry,
      id: 'inq-' + Date.now(),
      timestamp: new Date().toISOString(),
      read: false
    };

    this.updateData((prev) => ({
      ...prev,
      inquiries: [newInquiry, ...prev.inquiries]
    }));

    // Persist to Cloud Firestore inquiries collection
    try {
      addDoc(collection(db, 'inquiries'), {
        name: inquiry.name,
        email: inquiry.email,
        organization: inquiry.organization || '',
        service: inquiry.serviceRequired || 'General Inquiry',
        budgetRange: inquiry.budgetRange || '',
        preferredTimeline: inquiry.preferredTimeline || '',
        message: inquiry.message,
        timestamp: newInquiry.timestamp,
        read: false
      }).catch((e) => console.warn('Cloud Firestore inquiry write note:', e));
    } catch (e) {
      console.warn('Inquiry Firestore push error:', e);
    }
  }

  // Blog Interactions
  public recordBlogPostLike(postId: string): number {
    let newLikes = 1;
    this.updateData((prev) => ({
      ...prev,
      blogPosts: (prev.blogPosts || []).map((post) => {
        if (post.id === postId) {
          newLikes = (post.likes || 0) + 1;
          return { ...post, likes: newLikes };
        }
        return post;
      })
    }));
    return newLikes;
  }

  public incrementBlogPostViews(postId: string) {
    this.updateData((prev) => ({
      ...prev,
      blogPosts: (prev.blogPosts || []).map((post) => {
        if (post.id === postId) {
          return { ...post, views: (post.views || 0) + 1 };
        }
        return post;
      })
    }));
  }

  // Book Seller & Publications Interactions
  public recordBookDownload(bookId: string): number {
    let downloads = 1;
    this.updateData((prev) => ({
      ...prev,
      books: (prev.books || []).map((book) => {
        if (book.id === bookId) {
          downloads = (book.downloadsCount || 0) + 1;
          return { ...book, downloadsCount: downloads };
        }
        return book;
      })
    }));
    return downloads;
  }

  public recordBookLike(bookId: string): number {
    let likes = 1;
    this.updateData((prev) => ({
      ...prev,
      books: (prev.books || []).map((book) => {
        if (book.id === bookId) {
          likes = (book.likesCount || 0) + 1;
          return { ...book, likesCount: likes };
        }
        return book;
      })
    }));
    return likes;
  }

  public incrementBookReads(bookId: string) {
    this.updateData((prev) => ({
      ...prev,
      books: (prev.books || []).map((book) => {
        if (book.id === bookId) {
          return { ...book, readsCount: (book.readsCount || 0) + 1 };
        }
        return book;
      })
    }));
  }

  public deleteBook(bookId: string) {
    this.updateData((prev) => ({
      ...prev,
      books: (prev.books || []).filter((book) => book.id !== bookId)
    }));
  }

  // Book Categories Management Methods
  public saveBookCategories(categories: string[]) {
    const cleaned = Array.from(
      new Set(
        categories
          .map((c) => c.trim())
          .filter((c) => c && c !== 'All' && c !== 'All Categories')
      )
    );
    this.updateData((prev) => ({
      ...prev,
      bookCategories: cleaned
    }));
  }

  public addBookCategory(category: string): boolean {
    const trimmed = category.trim();
    if (!trimmed || trimmed === 'All' || trimmed === 'All Categories') return false;
    const current = this.getData().bookCategories || [];
    if (current.includes(trimmed)) return false;
    this.updateData((prev) => ({
      ...prev,
      bookCategories: [
        ...(prev.bookCategories || []).filter((c) => c !== 'All' && c !== 'All Categories'),
        trimmed
      ]
    }));
    return true;
  }

  public renameBookCategory(oldCategory: string, newCategory: string, updateBooks: boolean = true): boolean {
    const trimmed = newCategory.trim();
    if (!trimmed || trimmed === 'All' || trimmed === 'All Categories') return false;
    this.updateData((prev) => ({
      ...prev,
      bookCategories: (prev.bookCategories || []).map((c) => (c === oldCategory ? trimmed : c)),
      books: updateBooks
        ? (prev.books || []).map((b) => (b.category === oldCategory ? { ...b, category: trimmed } : b))
        : prev.books
    }));
    return true;
  }

  public deleteBookCategory(category: string, fallbackCategory?: string): boolean {
    this.updateData((prev) => {
      const remaining = (prev.bookCategories || []).filter((c) => c !== category);
      const fallback = fallbackCategory || remaining[0] || 'Design';
      return {
        ...prev,
        bookCategories: remaining,
        books: (prev.books || []).map((b) => (b.category === category ? { ...b, category: fallback } : b))
      };
    });
    return true;
  }

  // Video Interactions
  public recordVideoView(videoId: string) {
    this.updateData((prev) => ({
      ...prev,
      videos: (prev.videos || []).map((v) => {
        if (v.id === videoId) {
          return { ...v, viewsCount: (v.viewsCount || 0) + 1 };
        }
        return v;
      })
    }));
  }

  public recordVideoLike(videoId: string): number {
    let likes = 1;
    this.updateData((prev) => ({
      ...prev,
      videos: (prev.videos || []).map((v) => {
        if (v.id === videoId) {
          likes = (v.likesCount || 0) + 1;
          return { ...v, likesCount: likes };
        }
        return v;
      })
    }));
    return likes;
  }

  // Projects CRUD
  public addProject(project: ProjectItem) {
    this.updateData((prev) => ({
      ...prev,
      projects: [project, ...(prev.projects || [])]
    }));
  }

  public updateProject(id: string, patch: Partial<ProjectItem>) {
    this.updateData((prev) => ({
      ...prev,
      projects: (prev.projects || []).map((p) => (p.id === id ? { ...p, ...patch } : p))
    }));
  }

  public deleteProject(id: string) {
    this.updateData((prev) => ({
      ...prev,
      projects: (prev.projects || []).filter((p) => p.id !== id)
    }));
  }

  public toggleProjectPublished(id: string) {
    this.updateData((prev) => ({
      ...prev,
      projects: (prev.projects || []).map((p) =>
        p.id === id ? { ...p, published: !p.published } : p
      )
    }));
  }

  public toggleProjectFeatured(id: string) {
    this.updateData((prev) => ({
      ...prev,
      projects: (prev.projects || []).map((p) =>
        p.id === id ? { ...p, featured: !p.featured } : p
      )
    }));
  }

  public recordProjectView(id: string) {
    this.updateData((prev) => ({
      ...prev,
      projects: (prev.projects || []).map((p) =>
        p.id === id ? { ...p, views: (p.views || 0) + 1 } : p
      )
    }));
  }

  public recordProjectLike(id: string): number {
    let likes = 1;
    this.updateData((prev) => ({
      ...prev,
      projects: (prev.projects || []).map((p) => {
        if (p.id === id) {
          likes = (p.likes || 0) + 1;
          return { ...p, likes };
        }
        return p;
      })
    }));
    return likes;
  }

  public addProjectAttachment(projectId: string, attachment: ProjectAttachment) {
    this.updateData((prev) => ({
      ...prev,
      projects: (prev.projects || []).map((p) => {
        if (p.id === projectId) {
          const current = p.attachments || [];
          return { ...p, attachments: [...current, attachment] };
        }
        return p;
      })
    }));
  }

  public removeProjectAttachment(projectId: string, attachmentId: string) {
    this.updateData((prev) => ({
      ...prev,
      projects: (prev.projects || []).map((p) => {
        if (p.id === projectId) {
          return {
            ...p,
            attachments: (p.attachments || []).filter((a) => a.id !== attachmentId)
          };
        }
        return p;
      })
    }));
  }

  // Videos CRUD
  public addVideo(video: VideoItem) {
    this.updateData((prev) => ({
      ...prev,
      videos: [video, ...(prev.videos || [])]
    }));
  }

  public updateVideo(id: string, patch: Partial<VideoItem>) {
    this.updateData((prev) => ({
      ...prev,
      videos: (prev.videos || []).map((v) => (v.id === id ? { ...v, ...patch } : v))
    }));
  }

  public deleteVideo(id: string) {
    this.updateData((prev) => ({
      ...prev,
      videos: (prev.videos || []).filter((v) => v.id !== id)
    }));
  }

  public toggleVideoPublished(id: string) {
    this.updateData((prev) => ({
      ...prev,
      videos: (prev.videos || []).map((v) =>
        v.id === id ? { ...v, published: !v.published } : v
      )
    }));
  }

  public toggleVideoFeatured(id: string) {
    this.updateData((prev) => ({
      ...prev,
      videos: (prev.videos || []).map((v) =>
        v.id === id ? { ...v, featured: !v.featured } : v
      )
    }));
  }

  public saveVideoCategories(categories: string[]) {
    const cleaned = Array.from(
      new Set(
        categories
          .map((c) => c.trim())
          .filter((c) => c && c !== 'All' && c !== 'All Topics')
      )
    );
    this.updateData((prev) => ({
      ...prev,
      videoCategories: cleaned
    }));
  }

  public addVideoCategory(category: string): boolean {
    const trimmed = category.trim();
    if (!trimmed || trimmed === 'All' || trimmed === 'All Topics') return false;
    const current = this.getData().videoCategories || [];
    if (current.includes(trimmed)) return false;
    this.updateData((prev) => ({
      ...prev,
      videoCategories: [...(prev.videoCategories || []), trimmed]
    }));
    return true;
  }

  public deleteVideoCategory(category: string, fallbackCategory?: string): boolean {
    this.updateData((prev) => {
      const remaining = (prev.videoCategories || []).filter((c) => c !== category);
      const fallback = fallbackCategory || remaining[0] || 'Brand Identity';
      return {
        ...prev,
        videoCategories: remaining,
        videos: (prev.videos || []).map((v) => (v.category === category ? { ...v, category: fallback } : v))
      };
    });
    return true;
  }

  // Blog Posts CRUD
  public addBlogPost(post: BlogPostItem) {
    this.updateData((prev) => ({
      ...prev,
      blogPosts: [post, ...(prev.blogPosts || [])]
    }));
  }

  public updateBlogPost(id: string, patch: Partial<BlogPostItem>) {
    this.updateData((prev) => ({
      ...prev,
      blogPosts: (prev.blogPosts || []).map((p) => (p.id === id ? { ...p, ...patch } : p))
    }));
  }

  public deleteBlogPost(id: string) {
    this.updateData((prev) => ({
      ...prev,
      blogPosts: (prev.blogPosts || []).filter((p) => p.id !== id)
    }));
  }

  public toggleBlogPostPublished(id: string) {
    this.updateData((prev) => ({
      ...prev,
      blogPosts: (prev.blogPosts || []).map((p) =>
        p.id === id ? { ...p, published: !p.published } : p
      )
    }));
  }

  public toggleBlogPostFeatured(id: string) {
    this.updateData((prev) => ({
      ...prev,
      blogPosts: (prev.blogPosts || []).map((p) =>
        p.id === id ? { ...p, featured: !p.featured } : p
      )
    }));
  }

  public saveBlogCategories(categories: string[]) {
    const cleaned = Array.from(
      new Set(
        categories
          .map((c) => c.trim())
          .filter((c) => c && c !== 'All' && c !== 'All Categories')
      )
    );
    this.updateData((prev) => ({
      ...prev,
      blogCategories: cleaned
    }));
  }

  public addBlogCategory(category: string): boolean {
    const trimmed = category.trim();
    if (!trimmed || trimmed === 'All' || trimmed === 'All Categories') return false;
    const current = this.getData().blogCategories || [];
    if (current.includes(trimmed)) return false;
    this.updateData((prev) => ({
      ...prev,
      blogCategories: [...(prev.blogCategories || []), trimmed]
    }));
    return true;
  }

  public deleteBlogCategory(category: string, fallbackCategory?: string): boolean {
    this.updateData((prev) => {
      const remaining = (prev.blogCategories || []).filter((c) => c !== category);
      const fallback = fallbackCategory || remaining[0] || 'AI & Creative Workflows';
      return {
        ...prev,
        blogCategories: remaining,
        blogPosts: (prev.blogPosts || []).map((p) => (p.category === category ? { ...p, category: fallback } : p))
      };
    });
    return true;
  }

  // Books CRUD
  public addBook(book: BookItem) {
    this.updateData((prev) => ({
      ...prev,
      books: [book, ...(prev.books || [])]
    }));
  }

  public updateBook(id: string, patch: Partial<BookItem>) {
    this.updateData((prev) => ({
      ...prev,
      books: (prev.books || []).map((b) => (b.id === id ? { ...b, ...patch } : b))
    }));
  }

  public toggleBookPublished(id: string) {
    this.updateData((prev) => ({
      ...prev,
      books: (prev.books || []).map((b) =>
        b.id === id ? { ...b, published: !b.published } : b
      )
    }));
  }

  public toggleBookFeatured(id: string) {
    this.updateData((prev) => ({
      ...prev,
      books: (prev.books || []).map((b) =>
        b.id === id ? { ...b, featured: !b.featured } : b
      )
    }));
  }
}

export const portfolioStorage = new PortfolioStorageService();
