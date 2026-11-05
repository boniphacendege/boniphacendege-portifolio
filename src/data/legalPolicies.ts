/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Official Legal Policies & Terms of Service for Boniphace Ndege
 * Ev Dr. Boniphace J. Ndege · Creative Designer & Web Developer · Dodoma CBD, Tanzania
 */

export interface LegalSection {
  id: string;
  title: string;
  badge?: string;
  summary: string;
  content: string[];
  subsections?: {
    title: string;
    paragraphs: string[];
  }[];
}

export interface LegalDocument {
  id: 'privacy' | 'terms' | 'cookies' | 'services';
  title: string;
  subtitle: string;
  lastUpdated: string;
  effectiveDate: string;
  controller: {
    name: string;
    title: string;
    location: string;
    email: string;
    jurisdiction?: string;
  };
  intro: string;
  sections: LegalSection[];
}

export const LEGAL_DOCUMENTS: Record<'privacy' | 'terms' | 'cookies' | 'services', LegalDocument> = {
  privacy: {
    id: 'privacy',
    title: 'Privacy Policy',
    subtitle: 'Transparent data protection practices adhering to the Tanzania Personal Data Protection Act (PDPA 2022) and international GDPR standards.',
    lastUpdated: 'November 1, 2026',
    effectiveDate: 'January 1, 2026',
    controller: {
      name: 'Ev Dr. Boniphace J. Ndege',
      title: 'Data Controller & Principal Creative Technologist',
      location: 'Dodoma CBD, Dodoma Region',
      email: 'bishboniphace.ndege@gmail.com'
    },
    intro: 'Your privacy is paramount. This Privacy Policy details how Ev Dr. Boniphace J. Ndege collects, uses, secures, and honors your personal information when you browse this website, register a client account, submit creative project inquiries, or interact with portfolio features.',
    sections: [
      {
        id: 'controller-info',
        title: '1. Data Controller Identification',
        badge: 'Legal Entity',
        summary: 'Who is legally responsible for managing your data.',
        content: [
          'The Data Controller responsible for the processing of your personal information collected through this portfolio application and client portal is Ev Dr. Boniphace J. Ndege ("I", "me", "my", or "the Studio"), located in Dodoma CBD, Tanzania.',
          'If you have questions, data access requests, or privacy inquiries, contact me directly via email at bishboniphace.ndege@gmail.com or via phone/WhatsApp at +255 769 096 481.'
        ]
      },
      {
        id: 'information-collected',
        title: '2. Personal Data We Collect',
        badge: 'Transparency',
        summary: 'The exact categories of data you provide or that are automatically gathered.',
        content: [
          'We only collect information necessary to provide professional creative services, authentic client communication, and reliable website features.',
          'The types of information collected include:'
        ],
        subsections: [
          {
            title: 'A. Information You Voluntarily Provide',
            paragraphs: [
              '• Account Credentials: When you create a Client Account, we collect your Full Name, Email Address, and secure hashed password through Firebase Authentication.',
              '• Client Profile Details: You may optionally provide your Phone / WhatsApp Number, City/Location, Professional Title / Organization, Custom Avatar / Portrait, and Project Collaboration Goals.',
              '• Project Inquiries & Briefs: When requesting a service or contacting the studio, we collect your organization name, service requirements, budget expectations, timeline goals, and project descriptions.',
              '• Comments & Reviews: When you leave feedback or project reviews, your name, rating (1-5 stars), timestamp, and message are collected.',
              '• Communications: Records of emails, WhatsApp messages, and direct correspondences initiated with me.'
            ]
          },
          {
            title: 'B. Automatically Collected Technical Data',
            paragraphs: [
              '• Session & Device Identifiers: Generated anonymous session tokens (e.g. Session ID), browser type, operating system, and approximate geographic region (country/city level via IP, without precise GPS tracking).',
              '• Local Preferences: Saved client bookmarks, project favorites, high-contrast accessibility mode states, and cached Progressive Web App (PWA) assets stored directly on your personal device.',
              '• Security Logs: Timestamped audit logs for login attempts, password resets, and honeypot spam protection flags.'
            ]
          }
        ]
      },
      {
        id: 'legal-bases',
        title: '3. Legal Bases for Processing',
        badge: 'Lawful Processing',
        summary: 'How processing complies with the Tanzania PDPA (2022) and GDPR Article 6.',
        content: [
          'Under the Tanzania Personal Data Protection Act, 2022 (Act No. 11 of 2022) and international frameworks (GDPR), we process your data strictly under the following lawful grounds:',
          '• Contractual Necessity: Processing required to deliver design estimates, execute bespoke graphic design/web development agreements, and provide client account access.',
          '• Legitimate Interests: Operating and safeguarding this portfolio, preventing fraudulent sign-ups, and presenting verified design case studies.',
          '• Explicit Consent: When you subscribe to updates, upload a custom profile portrait, or submit an endorsement or review to be published.',
          '• Legal Compliance: Retaining financial records, invoices, and audit trails required by relevant statutory authorities and financial standards.'
        ]
      },
      {
        id: 'third-parties',
        title: '4. Third-Party Infrastructure & Sub-processors',
        badge: 'Infrastructure',
        summary: 'Trusted cloud partners utilized to host and protect this platform.',
        content: [
          'I do not sell, rent, broker, or trade your personal information to third parties or advertising networks. Ever.',
          'To ensure 99.9% uptime, global CDN performance, and enterprise-grade security, the platform relies on the following vetted cloud infrastructure partners:',
          '• Google Cloud Platform & Firebase: Provides secure European/Global data hosting (Firestore database, Firebase Authentication, SSL encryption). Google complies with ISO 27001, SOC 2/3, and GDPR Standard Contractual Clauses.',
          '• Cloudflare / Google Cloud Run: Delivers DDOS mitigation, TLS 1.3 cryptographic transport, and edge asset caching.',
          '• Google Maps Platform: Optional integration to display Dodoma CBD geographic location coordinates upon user interaction.',
          'All sub-processors are legally bound by stringent Data Processing Agreements (DPAs) requiring equivalent safeguards.'
        ]
      },
      {
        id: 'data-retention',
        title: '5. Data Retention & Erasure',
        badge: 'Lifecycle',
        summary: 'How long your data is stored and our zero-orphan policy.',
        content: [
          '• Client Accounts: Stored as long as your account remains active. You can delete your account at any time using the "Delete My Account" feature in your User Profile Modal, which triggers permanent deletion from Firebase Auth and Firestore.',
          '• Inquiries & Briefs: Retained for up to 24 months to support ongoing creative consultations, or deleted earlier upon written request.',
          '• Invoices & Financial Agreements: Retained for 5 years as required by Tanzanian tax and accounting laws.',
          '• Local Device Cache: Stored on your local device storage until you clear browser data or uninstall the Progressive Web App.'
        ]
      },
      {
        id: 'user-rights',
        title: '6. Your Legal Data Rights',
        badge: 'Your Control',
        summary: 'Comprehensive rights granted under the Tanzania PDPA 2022 and GDPR.',
        content: [
          'Regardless of your country of residence, you enjoy the following enforceable rights regarding your personal information:',
          '• Right to Access: Request a copy of all personal data held about you.',
          '• Right to Rectification: Correct or update any inaccurate or incomplete details via your Client Profile dashboard.',
          '• Right to Erasure ("Right to be Forgotten"): Instantly delete your user account and linked Firestore profile via the "Delete My Account" button or email request.',
          '• Right to Restrict or Object: Object to processing based on legitimate interests or revoke prior consent for published reviews.',
          '• Right to Data Portability: Obtain your stored profile and project notes in a structured, commonly used JSON format.',
          'To exercise any of these rights, contact bishboniphace.ndege@gmail.com. We respond to all formal requests within 14 business days without charging administrative fees.'
        ]
      },
      {
        id: 'security-measures',
        title: '7. Information Security & Encryption',
        badge: 'Security',
        summary: 'Technical and organizational safeguards implemented to protect you.',
        content: [
          '• Transport Encryption: All data in transit is encrypted using modern TLS 1.3 cryptographic protocols with HTTPS enforcement and HSTS headers.',
          '• Encryption at Rest: Firestore and Firebase Auth data are encrypted at rest using AES-256 bit military-grade keys.',
          '• Principle of Least Privilege: Database security rules enforce strict role-based access control (RBAC), ensuring only authorized administrators can modify master site records, and users can only access their own profile documents.',
          '• Honeypot Spam Prevention: Contact forms use automated honeypot trap fields to reject malicious automated bot submissions without burdening real human users with intrusive CAPTCHAs.'
        ]
      },
      {
        id: 'children-privacy',
        title: '8. Protection of Minors',
        badge: 'Children',
        summary: 'Commitment to protecting minors online.',
        content: [
          'This creative portfolio and client portal are not directed to individuals under the age of 16. We do not knowingly collect personal information from children.',
          'If you believe a minor has registered an account or provided personal details without parental consent, notify us immediately at bishboniphace.ndege@gmail.com and the records will be expunged immediately.'
        ]
      }
    ]
  },
  terms: {
    id: 'terms',
    title: 'Terms of Service',
    subtitle: 'Binding terms governing website access, client accounts, creative project collaborations, and intellectual property.',
    lastUpdated: 'November 1, 2026',
    effectiveDate: 'January 1, 2026',
    controller: {
      name: 'Ev Dr. Boniphace J. Ndege',
      title: 'Principal Creative Technologist & Graphic Designer',
      location: 'Dodoma CBD',
      email: 'drboniphacendege@gmail.com'
    },
    intro: 'Welcome to the official creative portfolio and digital portal of Ev Dr. Boniphace J. Ndege. By browsing this website, installing the web application, creating an account, or commissioning creative services, you agree to be bound by these Terms of Service. If you disagree with any part, please discontinue using this platform.',
    sections: [
      {
        id: 'scope-and-services',
        title: '1. Scope of Creative Services',
        badge: 'Services',
        summary: 'What creative design, web development, and digital services are offered.',
        content: [
          'Ev Dr. Boniphace J. Ndege provides high-caliber professional visual and digital solutions, including:',
          '• Visual Identity & Branding: Bespoke logo design, comprehensive brand guidelines, color palettes, typographic hierarchies, stationery, and corporate collateral.',
          '• Website Design & Frontend Engineering: Modern responsive web applications, single-page applications (SPAs), Progressive Web Apps (PWAs), landing pages, and portfolio showcases built with React, TypeScript, and Tailwind CSS.',
          '• Digital Content Creation: High-impact marketing flyers, promotional posters, social media banners, event graphics, and digital publishing layouts.',
          '• AI-Assisted Design Workflows: Conceptual ideation, asset enhancement, computational workflows, and rapid design exploration paired with artisanal human refinement.',
          'All commissioned projects are governed by bespoke written proposals or project milestone agreements that complement these Terms.'
        ]
      },
      {
        id: 'account-responsibilities',
        title: '2. Client Accounts & User Conduct',
        badge: 'Accounts',
        summary: 'Your responsibilities when registering and managing an account.',
        content: [
          '• Account Authenticity: You agree to provide accurate, truthful, and complete details when registering a Client Account.',
          '• Password Security: You are solely responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account.',
          '• Prohibited Activities: You agree not to: (a) reverse-engineer, decompile, or attempt to extract source code from proprietary client modules; (b) probe or exploit potential security vulnerabilities; (c) post defamatory, abusive, offensive, or infringing comments; or (d) introduce malicious software, bots, or unauthorized scrapers.',
          '• Account Termination: We reserve the right to suspend or terminate accounts that violate these Terms or engage in fraudulent activities.'
        ]
      },
      {
        id: 'intellectual-property',
        title: '3. Intellectual Property Rights & Ownership',
        badge: 'IP & Copyright',
        summary: 'Clear division between client deliverable ownership and studio portfolio rights.',
        content: [
          'Intellectual property ownership is structured transparently to protect both the client and the creative practitioner:',
          '• Website & Platform Content: All platform UI code, custom graphics, proprietary animations, logos, slogans, and textual content are the exclusive intellectual property of Ev Dr. Boniphace J. Ndege and are protected by Tanzanian and international copyright conventions.',
          '• Custom Client Deliverables: Upon receipt of 100% full and final payment for a commissioned creative project, all agreed final design assets (e.g., approved vector logos, brand assets, source files, or bespoke website source code) are transferred to the client for their commercial or personal use.',
          '• Unselected Concepts & Drafts: All exploratory concepts, preliminary drafts, sketches, and rejected proposals remain the exclusive property of Ev Dr. Boniphace J. Ndege.',
          '• Portfolio Showcase Right: Unless explicitly restricted by a mutually signed Non-Disclosure Agreement (NDA), Ev Dr. Boniphace J. Ndege retains the perpetual, worldwide right to display completed client deliverables as part of his professional portfolio, case studies, social media showcases, and design competitions.'
        ]
      },
      {
        id: 'ai-ethics',
        title: '4. AI Technology Ethics & Human Craftsmanship',
        badge: 'Ethical AI',
        summary: 'Our transparent commitment to ethical, human-reviewed AI collaboration.',
        content: [
          'In alignment with modern digital practices, I integrate generative computational tools (e.g., Google Gemini models, AI vector tooling, image synthesis) as acceleration multipliers in my creative workflow.',
          '• Human Authorship Guarantee: AI provides speed and exploratory ideation. Every final deliverable undergoes rigorous human creative direction, manual aesthetic curation, artisanal typography calibration, and technical verification.',
          '• Originality & Due Diligence: I verify that client deliverables do not directly copy protected third-party trademarks or proprietary iconography.',
          '• Client Confidentiality: Proprietary client documents and sensitive trade secrets are never used to train public machine learning models without express authorization.'
        ]
      },
      {
        id: 'commercial-terms',
        title: '5. Project Commissioning, Payments & Revisions',
        badge: 'Financials',
        summary: 'Standard payment stages, milestone approvals, and revision policies.',
        content: [
          '• Project Commencements: Projects require a standard initial commitment deposit (typically 40% to 50%) prior to project kickoff, with remaining balances tied to approved delivery milestones.',
          '• Revisions Policy: Standard project agreements include up to two (2) to three (3) rounds of structured client revisions on selected concepts. Scope changes requested beyond the agreed brief are quoted as addendums.',
          '• Timely Feedback: Client feedback must be provided within seven (7) business days to maintain scheduled delivery timelines.',
          '• Accepted Payment Methods: Payments are accepted via official Tanzanian bank transfers, mobile money systems (M-Pesa, Airtel Money, Tigo Pesa), and international bank wire transfers.'
        ]
      },
      {
        id: 'warranties-and-liability',
        title: '6. Warranties & Limitation of Liability',
        badge: 'Liability',
        summary: 'Legal limitations and good-faith professional warranty.',
        content: [
          '• Professional Standard of Care: All work is executed with the highest level of craftsmanship, creative competence, and modern industry standards.',
          '• "As-Is" Platform Operation: This website and its interactive tools (including the AI Assistant and demo features) are provided on an "as-is" and "as-available" basis without warranties of uninterrupted uptime or error-free availability.',
          '• Limitation of Liability: To the maximum extent permitted by applicable law in Tanzania, Ev Dr. Boniphace J. Ndege shall not be liable for any indirect, incidental, punitive, or consequential damages resulting from website downtime, lost profits, or third-party service interruptions.',
          '• Maximum Liability: Total liability for any claim arising from a paid creative engagement is strictly limited to the total fees actually received by the Studio for the specific deliverable in dispute.'
        ]
      },
      {
        id: 'governing-law',
        title: '7. Dispute Resolution & General Provisions',
        badge: 'Dispute Resolution',
        summary: 'Standard professional consultation and mutual dispute resolution guidelines.',
        content: [
          'These Terms of Service and related creative agreements are governed by standard commercial good-faith standards.',
          '• Friendly Resolution First: Both parties agree to make a good-faith effort to resolve any dispute, claim, or controversy through informal, amicable direct consultation for thirty (30) days.',
          '• Competent Mediation: In the event informal discussions fail, disputes may be submitted to mutually agreed commercial mediation or arbitration.'
        ]
      }
    ]
  },
  cookies: {
    id: 'cookies',
    title: 'Cookie Policy',
    subtitle: 'Transparent details on how this website uses standard cookies and browser local storage.',
    lastUpdated: 'November 1, 2026',
    effectiveDate: 'January 1, 2026',
    controller: {
      name: 'Ev Dr. Boniphace J. Ndege',
      title: 'Principal Creative Technologist',
      location: 'Dodoma CBD',
      email: 'drboniphacendege@gmail.com'
    },
    intro: 'We believe in a clean, privacy-first web experience. This site does NOT utilize invasive third-party cross-site advertising trackers, behavioral profiling scripts, or data-broker cookies. We only use essential storage technologies necessary for functionality, performance, and accessibility.',
    sections: [
      {
        id: 'storage-types',
        title: '1. What Storage Technologies We Use',
        badge: 'Storage Tech',
        summary: 'Essential local storage and session mechanisms explained.',
        content: [
          'Rather than relying on invasive tracking cookies, this modern web application uses standard browser LocalStorage, SessionStorage, and Cache Storage API for high performance:',
          '• Authentication Persistence: Firebase Auth securely maintains your login token in encrypted browser storage so you remain signed in between visits.',
          '• Accessibility Preferences: Stores your High-Contrast Mode toggle (`boniphace_high_contrast`) and reading progress so accessibility accommodations persist.',
          '• User Bookmarks & Likes: Stores client project favorites, custom comment drafts, and thumbs-up interaction states directly on your device.',
          '• Progressive Web App (PWA) Offline Cache: Service workers cache static portfolio assets (styles, logos, font subsets) to allow lightning-fast reloads and offline exploration.'
        ]
      },
      {
        id: 'no-tracking-promise',
        title: '2. Our Zero-Ad-Tracker Commitment',
        badge: 'Privacy-First',
        summary: 'We do not sell your browsing habits to data brokers.',
        content: [
          '• No Facebook Pixel or Meta Audience Network trackers.',
          '• No third-party data broker advertising cookies.',
          '• No automated behavioral profiling across unrelated websites.',
          'Your interactions on this portfolio remain strictly between you and Ev Dr. Boniphace J. Ndege.'
        ]
      },
      {
        id: 'clearing-storage',
        title: '3. How to Manage or Clear Your Stored Data',
        badge: 'Control',
        summary: 'Simple steps to clear local storage and browser cookies anytime.',
        content: [
          'You retain full control over stored data on your device at all times:',
          '• Browser Settings: You can clear cookies and site data at any time via your browser settings (Chrome: Settings → Privacy and Security → Delete Browsing Data).',
          '• In-App Sign Out: Clicking "Secure Sign Out" in the User Profile clears your active authentication session immediately.',
          '• Account Deletion: Using the "Delete My Account" option removes all associated server-side cloud records permanently.'
        ]
      }
    ]
  },
  services: {
    id: 'services',
    title: 'Client Service Agreement & Standards',
    subtitle: 'Standard operational guidelines for project commissioning, design revisions, deliverables, and confidentiality.',
    lastUpdated: 'November 1, 2026',
    effectiveDate: 'January 1, 2026',
    controller: {
      name: 'Ev Dr. Boniphace J. Ndege',
      title: 'Principal Creative Technologist & Graphic Designer',
      location: 'Dodoma CBD',
      email: 'drboniphacendege@gmail.com'
    },
    intro: 'This framework outlines the professional standards, milestone delivery protocols, and creative collaboration expectations when engaging Ev Dr. Boniphace J. Ndege for graphic design, web engineering, or digital branding projects.',
    sections: [
      {
        id: 'project-phases',
        title: '1. The 4-Phase Creative Lifecycle',
        badge: 'Process',
        summary: 'Discovery, Concepting, Technical Craftsmanship, and Final Deployment.',
        content: [
          'Every creative collaboration follows a structured, milestone-driven process:',
          '• Phase 1: Strategic Briefing & Discovery: Understanding your business objectives, target audience demographics, competitive landscape, and functional requirements.',
          '• Phase 2: Creative Exploration & Concepting: Developing initial creative concepts, wireframes, mood boards, or interactive design prototypes for client review.',
          '• Phase 3: Artisanal Refinement & Engineering: Implementing approved feedback, vectorization, high-fidelity responsive development, typography tuning, and cross-browser testing.',
          '• Phase 4: Quality Assurance, Handoff & Launch: Delivering production-ready print/vector files (AI, EPS, PDF, SVG, PNG) or deploying production web code with complete documentation.'
        ]
      },
      {
        id: 'confidentiality-nda',
        title: '2. Client Confidentiality & Non-Disclosure',
        badge: 'Confidentiality',
        summary: 'Your proprietary business ideas and sensitive data remain strictly protected.',
        content: [
          'I respect the sensitive nature of unreleased products, corporate rebranding campaigns, and proprietary business models.',
          '• Non-Disclosure Agreements (NDAs): I gladly sign and adhere to standard bilateral or client-provided NDAs prior to receiving sensitive creative briefs.',
          '• Embargoed Launches: Projects marked as confidential or under embargo are never published in my public portfolio until your official market launch date.',
          '• Secure Storage: All client assets and briefing documents are stored on encrypted cloud drives with multi-factor authentication (MFA).'
        ]
      },
      {
        id: 'deliverables-formats',
        title: '3. Professional Deliverable Formats',
        badge: 'Deliverables',
        summary: 'Comprehensive, high-definition files supplied upon project sign-off.',
        content: [
          'Clients receive complete, production-ready deliverables tailored to print and digital media:',
          '• Graphic Design & Logos: Vector masters (.AI, .EPS, .SVG) for infinite scalability, high-resolution raster files (.PNG transparent, .JPG 300 DPI CMYK for commercial printing), and web-optimized formats (.WebP).',
          '• Brand Identity Systems: Complete Brand Style Guide PDF specifying color palettes (HEX, RGB, CMYK, Pantone equivalents), typography usage, minimum clear space, and forbidden modifications.',
          '• Web Development: Clean, modular TypeScript/React source code repositories, deployment scripts, and documentation.'
        ]
      }
    ]
  }
};
