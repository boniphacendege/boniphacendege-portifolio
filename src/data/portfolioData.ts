export interface Project {
  id: string;
  title: string;
  kind: string;
  category: 'fullstack' | 'backend' | 'ai' | 'cloud';
  description: string;
  longDescription: string;
  architecture: string;
  impact: string[];
  chips: string[];
  metrics: { label: string; value: string }[];
  featured: boolean;
  githubUrl?: string;
  liveUrl?: string;
}

export interface SkillItem {
  name: string;
  level: number;
  category: 'fe' | 'be' | 'dv' | 'ai';
  categoryLabel: string;
  experience: string;
  tags: string[];
}

export interface TimelineItem {
  period: string;
  role: string;
  company: string;
  location: string;
  description: string;
  achievements: string[];
  type: 'work' | 'education' | 'cert';
}

export interface Testimonial {
  name: string;
  title: string;
  company: string;
  avatar: string;
  content: string;
  verified: boolean;
}

export const PORTFOLIO_DATA = {
  name: 'Boniphace Ndege',
  role: 'Software Engineer · Systems Innovator',
  lead: 'I build modern web platforms, cloud architectures and intelligent systems with a focus on seamless user experiences, rock-solid scalability, and high performance.',
  location: 'Dodoma CBD Tanzania',
  email: 'drboniphacendege@gmail.com',
  phone: '+255 765 326 515',
  whatsapp: '255765326515',
  github: 'https://github.com/boniphacendege',
  linkedin: 'https://linkedin.com/in/boniphace-ndege',
  facebook: 'https://facebook.com/boniphacendege',
  instagram: 'https://instagram.com/boniphace.designs',
  twitter: 'https://x.com/boniphacendege',
  availability: 'Available for full-time roles & high-impact innovation projects',
  yearsExperience: '4+',
  projectsDone: '25+',
  clientSatisfaction: '99%',
  uptimeMaintained: '99.98%',

  pillars: [
    {
      title: 'Software Development',
      description: 'Clean, maintainable, high-performance code across frontend and backend, with robust web frameworks, reactive state management, and thoughtful API design.',
      tech: ['React', 'Next.js', 'TypeScript', 'Node.js', 'Python', 'Tailwind CSS'],
      highlight: 'Production-ready code engineered for zero regressions.'
    },
    {
      title: 'Systems Architecture',
      description: 'Reliable cloud deployment pipelines, distributed microservices, message queues, and resilient database solutions built to scale under massive transactional demand.',
      tech: ['PostgreSQL', 'Docker', 'Redis', 'AWS Cloud', 'FastAPI', 'Kafka'],
      highlight: 'Sub-50ms latency & 99.98% service reliability.'
    },
    {
      title: 'Smart & AI Integration',
      description: 'Context-aware chatbots, generative AI pipelines, retrieval-augmented generation (RAG), and workflow automations embedded seamlessly into real-world business apps.',
      tech: ['Gemini API', 'LangChain', 'Vector DBs', 'OpenAI', 'Automated Agents'],
      highlight: 'Transforming complex data into immediate intelligent actions.'
    },
    {
      title: 'DevOps & Cloud Orchestration',
      description: 'Automated CI/CD pipelines, containerized deployments, Kubernetes orchestration, zero-downtime rolling updates, and complete infrastructure observability.',
      tech: ['Docker', 'AWS ECS/EKS', 'GitHub Actions', 'Terraform', 'Prometheus'],
      highlight: 'Effortless automated releases from commit to cloud.'
    }
  ],

  skills: [
    { name: 'React / Next.js', level: 94, category: 'fe', categoryLabel: 'Frontend', experience: '4 yrs', tags: ['App Router', 'SSR', 'Zustand', 'React Query'] },
    { name: 'TypeScript / JavaScript', level: 92, category: 'fe', categoryLabel: 'Frontend', experience: '4 yrs', tags: ['ESNext', 'Generics', 'Strict Typing'] },
    { name: 'Node.js & Express / NestJS', level: 90, category: 'be', categoryLabel: 'Backend', experience: '4 yrs', tags: ['REST', 'WebSockets', 'Auth', 'Microservices'] },
    { name: 'Python (Django / FastAPI)', level: 88, category: 'be', categoryLabel: 'Backend', experience: '3 yrs', tags: ['AsyncIO', 'Celery', 'Pydantic', 'Data Pipelines'] },
    { name: 'PostgreSQL / Supabase', level: 89, category: 'be', categoryLabel: 'Backend', experience: '4 yrs', tags: ['ACID', 'Indexing', 'Query Optimization', 'JSONB'] },
    { name: 'MongoDB / Redis', level: 86, category: 'be', categoryLabel: 'Backend', experience: '3 yrs', tags: ['In-Memory Cache', 'Aggregations', 'Pub/Sub'] },
    { name: 'Docker & Containerization', level: 85, category: 'dv', categoryLabel: 'DevOps & Tools', experience: '3 yrs', tags: ['Multi-Stage Builds', 'Compose', 'Registry'] },
    { name: 'AWS Cloud Services', level: 82, category: 'dv', categoryLabel: 'DevOps & Tools', experience: '3 yrs', tags: ['EC2', 'S3', 'RDS', 'Lambda', 'CloudFront'] },
    { name: 'Git, CI/CD & GitHub Actions', level: 91, category: 'dv', categoryLabel: 'DevOps & Tools', experience: '4 yrs', tags: ['Workflows', 'Automated Testing', 'Semantic Releases'] },
    { name: 'AI Integration & LLM APIs', level: 87, category: 'ai', categoryLabel: 'Smart & AI', experience: '2 yrs', tags: ['Gemini', 'RAG', 'Embeddings', 'Function Calling'] },
    { name: 'Tailwind CSS & Modern UI', level: 95, category: 'fe', categoryLabel: 'Frontend', experience: '4 yrs', tags: ['Responsive', 'Figma to Code', 'Motion'] },
    { name: 'GraphQL & REST API Design', level: 88, category: 'be', categoryLabel: 'Backend', experience: '3 yrs', tags: ['Schema Stitching', 'Apollo', 'Rate Limiting'] },
  ] as SkillItem[],

  projects: [
    {
      id: 'analytics-hub',
      title: 'Smart Analytics Hub',
      kind: 'Full Stack & AI',
      category: 'fullstack',
      description: 'Real-time enterprise intelligence dashboard with AI trend prediction, visual reporting, and multi-tenant telemetry.',
      longDescription: 'An enterprise-grade analytics suite engineered to consolidate fragmented marketing, sales, and operational metrics into interactive real-time visual dashboards with automated anomaly detection.',
      architecture: 'Distributed microservices architecture with Next.js 14 on the frontend, Node.js event ingestion workers, Redis time-series buffering, and PostgreSQL partitioned tables.',
      impact: [
        'Streamlined decision-making for 15+ corporate clients across East Africa',
        'Reduced analytical query execution time by 62% using intelligent Redis caching',
        'Handles 1.2M daily telemetry events with zero data loss'
      ],
      chips: ['Next.js', 'Node.js', 'Tailwind', 'Redis', 'PostgreSQL', 'Chart.js'],
      metrics: [
        { label: 'Event Throughput', value: '1.2M/day' },
        { label: 'Query Speedup', value: '62%' },
        { label: 'Uptime', value: '99.99%' }
      ],
      featured: true,
      githubUrl: 'https://github.com/boniphacendege/smart-analytics-hub',
      liveUrl: 'https://analytics-demo.ndege.dev'
    },
    {
      id: 'commerce-engine',
      title: 'Scalable Commerce Engine',
      kind: 'Backend System',
      category: 'backend',
      description: 'High-throughput microservices backend supporting instant mobile payments (M-Pesa, Airtel Money, Cards) and automated inventory webhooks.',
      longDescription: 'A modular fintech and commerce core built to handle high-concurrency flash sales and multi-gateway mobile money reconciliations with idempotency guarantees.',
      architecture: 'FastAPI microservices layered over asynchronous Python workers, RabbitMQ message queuing, and strict PostgreSQL transaction isolation.',
      impact: [
        'Processed over $4.2M in cumulative mobile payment volume',
        'Sub-150ms payment callback acknowledgement latency',
        'Automated reconciliation reduced financial audit discrepancies to zero'
      ],
      chips: ['Python', 'FastAPI', 'PostgreSQL', 'RabbitMQ', 'Docker', 'Stripe/M-Pesa API'],
      metrics: [
        { label: 'Payment Vol.', value: '$4.2M+' },
        { label: 'Callback Latency', value: '<150ms' },
        { label: 'Reconciliation', value: '100%' }
      ],
      featured: true,
      githubUrl: 'https://github.com/boniphacendege/scalable-commerce-engine',
      liveUrl: 'https://commerce-api.ndege.dev'
    },
    {
      id: 'documind-ai',
      title: 'DocuMind AI Assistant',
      kind: 'AI / Vector Search',
      category: 'ai',
      description: 'Intelligent contextual search, semantic discovery, and automated summarization for technical documents and legal archives.',
      longDescription: 'An enterprise semantic document intelligence engine that indexes PDFs, Word documents, and technical manuals into high-dimensional vector embeddings for instantaneous conversational querying.',
      architecture: 'TypeScript and Python hybrid engine utilizing Gemini & OpenAI embeddings, pgvector / Pinecone vector indexes, and Next.js conversational UI with citation tracking.',
      impact: [
        'Cut internal legal & engineering documentation lookup time by 85%',
        'Accurate citation attribution referencing exact page paragraphs',
        'Enterprise RBAC ensuring sensitive internal documents stay strictly partitioned'
      ],
      chips: ['TypeScript', 'Gemini API', 'Vector DB', 'Next.js', 'Python', 'Tailwind'],
      metrics: [
        { label: 'Lookup Time Cut', value: '85%' },
        { label: 'Vector Accuracy', value: '96.4%' },
        { label: 'Docs Indexed', value: '50K+' }
      ],
      featured: true,
      githubUrl: 'https://github.com/boniphacendege/documind-ai',
      liveUrl: 'https://documind.ndege.dev'
    },
    {
      id: 'cloudflow-orchestrator',
      title: 'CloudFlow Infrastructure Orchestrator',
      kind: 'DevOps & Cloud',
      category: 'cloud',
      description: 'Automated multi-cloud deployment controller with self-healing containers, SSL lifecycle automation, and dynamic edge load balancing.',
      longDescription: 'A developer-first container provisioning platform designed for engineering teams to launch staging environments, manage database backups, and monitor resource utilization with one command.',
      architecture: 'Golang & Node.js orchestration daemon interacting directly with Docker Engine, AWS EC2/ECS APIs, and Caddy reverse proxy for automated Let\'s Encrypt certificates.',
      impact: [
        'Automated 90% of routine server management tasks for engineering teams',
        'Zero-downtime blue/green deployment strategy',
        'Built-in vulnerability scanning preventing unauthorized exposures'
      ],
      chips: ['Docker', 'AWS', 'Node.js', 'TypeScript', 'Bash', 'Caddy'],
      metrics: [
        { label: 'Deploy Time', value: '<45s' },
        { label: 'Downtime', value: '0%' },
        { label: 'Manual Tasks Cut', value: '90%' }
      ],
      featured: false,
      githubUrl: 'https://github.com/boniphacendege/cloudflow-orchestrator',
      liveUrl: 'https://cloudflow.ndege.dev'
    },
    {
      id: 'afyamed-portal',
      title: 'AfyaMed Telemedicine Portal',
      kind: 'Full Stack Healthcare',
      category: 'fullstack',
      description: 'HIPAA-compliant telemedicine and electronic health records platform connecting specialist doctors with remote community clinics.',
      longDescription: 'Created to bridge healthcare access gaps across rural Tanzania, AfyaMed offers offline-first electronic medical records, WebRTC encrypted video consultations, and SMS prescription alerts.',
      architecture: 'Progressive Web App built with React & Vite, IndexedDB local synchronization, Node.js WebRTC signaling, and encrypted PostgreSQL medical record vault.',
      impact: [
        'Connected over 12,000 patients with regional specialists',
        'Works seamlessly on 3G and intermittent rural network connections',
        '99.9% uptime during emergency clinical consultations'
      ],
      chips: ['React', 'WebRTC', 'Node.js', 'PWA', 'PostgreSQL', 'Twilio'],
      metrics: [
        { label: 'Patients Served', value: '12K+' },
        { label: 'Offline Sync', value: '100%' },
        { label: 'Bandwidth Saved', value: '60%' }
      ],
      featured: false,
      githubUrl: 'https://github.com/boniphacendege/afyamed-portal',
      liveUrl: 'https://afyamed.ndege.dev'
    }
  ] as Project[],

  timeline: [
    {
      period: '2023 – Present',
      role: 'Senior Systems Developer',
      company: 'Tech Innovators Corp',
      location: 'Dodoma CBD Tanzania',
      description: 'Leading digital transformation and core engineering initiatives, architecting web microservices and orchestrating high-availability cloud infrastructure.',
      achievements: [
        'Improved core web platform response time by 40% through async caching and query refactoring.',
        'Mentored a team of 6 junior and mid-level software engineers in clean code and CI/CD best practices.',
        'Architected real-time payment reconciliation engine processing thousands of daily transactions.'
      ],
      type: 'work'
    },
    {
      period: '2021 – 2023',
      role: 'Full Stack Engineer',
      company: 'Enterprise Software Solutions',
      location: 'Dodoma CBD Tanzania',
      description: 'Designed responsive React user interfaces and reliable Node.js REST APIs, integrated third-party APIs, and automated CI/CD deployment pipelines.',
      achievements: [
        'Built dynamic client dashboard adopted by 30+ regional B2B enterprise clients.',
        'Migrated monolithic backend into modular microservices with 99.95% availability.',
        'Automated test suites bringing code coverage from 45% to over 88%.'
      ],
      type: 'work'
    },
    {
      period: '2019 – 2021',
      role: 'Software Developer (Systems & Web)',
      company: 'Silicon Serengeti Labs',
      location: 'Dodoma CBD Tanzania',
      description: 'Developed modern web applications, database schemas, and integration webhooks for local fintech and e-commerce startups.',
      achievements: [
        'Created custom mobile money payment plugins for e-commerce merchants.',
        'Optimized SQL queries reducing heavy reporting generation from 12 seconds to 800ms.'
      ],
      type: 'work'
    },
    {
      period: 'Graduated with Honors',
      role: 'B.Sc. in Computer Science / Software Engineering',
      company: 'University of Dodoma, Dodoma CBD Tanzania',
      location: 'Dodoma CBD Tanzania',
      description: 'Deep theoretical and hands-on grounding in algorithms, system architecture, database design, operating systems, and computer networks.',
      achievements: [
        'Awarded Best Final Year Software Engineering Project for Distributed Health Records.',
        'President of the University Developer Student Club (GDSC Chapter).'
      ],
      type: 'education'
    }
  ] as TimelineItem[],

  certifications: [
    { title: 'AWS Certified Solutions Architect – Associate', issuer: 'Amazon Web Services', year: '2024' },
    { title: 'Professional Full-Stack Developer Certificate', issuer: 'Meta / Coursera', year: '2023' },
    { title: 'Advanced Python & FastAPI Architecture', issuer: 'Python Software Foundation', year: '2023' },
    { title: 'Docker & Kubernetes Cloud Engineering', issuer: 'Linux Foundation', year: '2022' }
  ],

  testimonials: [
    {
      name: 'Dr. Joseph Mwambola',
      title: 'Chief Technology Officer',
      company: 'InnovateX Africa',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      content: 'Boniphace has that rare combination of deep architectural acumen and relentless execution. He rebuilt our core payment system, cutting latency by more than half while maintaining spotless reliability.',
      verified: true
    },
    {
      name: 'Sarah Kimario',
      title: 'VP of Product',
      company: 'Afya Tech Ventures',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80',
      content: 'Working with Boniphace was effortless. He turns ambiguous technical briefs into crisp, elegant, production-grade applications that our users love. A true senior engineer.',
      verified: true
    },
    {
      name: 'Tariq Al-Mansoor',
      title: 'Head of Engineering',
      company: 'Serengeti Cloud Labs',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
      content: 'His code is pristine, well-tested, and documentation is crystal clear. He built our automated deployment pipelines that our team still relies on every single day.',
      verified: true
    }
  ] as Testimonial[],

  estimatorOptions: {
    projectTypes: [
      { id: 'mvp', name: 'High-Speed MVP Web App', duration: '2-4 weeks', baseEst: '$1,800 - $3,500' },
      { id: 'fullstack', name: 'Enterprise SaaS Platform', duration: '5-8 weeks', baseEst: '$4,000 - $8,500' },
      { id: 'ai', name: 'AI Integration & Smart Agent', duration: '2-3 weeks', baseEst: '$2,200 - $4,500' },
      { id: 'cloud', name: 'Cloud Architecture & DevOps', duration: '2-4 weeks', baseEst: '$2,500 - $5,000' }
    ],
    features: [
      { id: 'auth', name: 'Role-Based Auth & Security', cost: '+$500' },
      { id: 'payments', name: 'Payment Gateways (M-Pesa/Stripe)', cost: '+$750' },
      { id: 'realtime', name: 'Real-Time WebSockets / Push', cost: '+$600' },
      { id: 'ai_rag', name: 'Vector Search & Custom AI Agent', cost: '+$1,100' },
      { id: 'docker', name: 'Full CI/CD & Cloud Orchestration', cost: '+$800' }
    ]
  }
};
