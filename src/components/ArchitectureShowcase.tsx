import React, { useState } from 'react';
import { Network, Server, Database, Shield, Cpu, RefreshCw, Layers, ArrowRight, Zap, CheckCircle2 } from 'lucide-react';

interface Blueprint {
  id: string;
  title: string;
  tagline: string;
  summary: string;
  nodes: {
    title: string;
    tech: string;
    desc: string;
    latency: string;
  }[];
  resilienceSpecs: string[];
}

export const ArchitectureShowcase: React.FC = () => {
  const [selectedBlueprint, setSelectedBlueprint] = useState<'fintech' | 'rag' | 'cicd'>('fintech');

  const blueprints: Record<'fintech' | 'rag' | 'cicd', Blueprint> = {
    fintech: {
      id: 'fintech',
      title: 'High-Throughput Event-Driven Microservices',
      tagline: 'Sub-50ms Payment Processing & Idempotent Transactions',
      summary: 'Engineered for high-concurrency mobile money APIs (M-Pesa, Airtel Money, Cards) with automated exponential backoff retries, distributed locking, and ledger consistency.',
      nodes: [
        {
          title: '1. Edge Ingress & Rate Limiter',
          tech: 'Nginx + Cloudflare + Redis Token Bucket',
          desc: 'Absorbs peak webhook traffic, validates HMAC signatures, and throttles rogue IP surges.',
          latency: '< 5ms'
        },
        {
          title: '2. API Gateway & Validation',
          tech: 'FastAPI / Node.js + Pydantic Strict Typing',
          desc: 'Performs instant payload schema verification and acquires Redis distributed lock to prevent duplicate payment submissions.',
          latency: '12ms'
        },
        {
          title: '3. Message Queue & Event Stream',
          tech: 'RabbitMQ / Kafka Worker Cluster',
          desc: 'Buffers financial callback events into durable queues with Dead-Letter Queues (DLQ) for zero message loss.',
          latency: '8ms'
        },
        {
          title: '4. Core Ledger & Transaction Vault',
          tech: 'PostgreSQL + Row-Level Locks (SELECT FOR UPDATE)',
          desc: 'Executes atomic ACID ledger balancing, updates user balances, and triggers real-time customer push notifications.',
          latency: '22ms'
        }
      ],
      resilienceSpecs: [
        'Idempotent webhook handling via unique transaction hashes',
        'Automatic Dead-Letter Queue (DLQ) replay for temporary bank outages',
        'Hot-standby PostgreSQL replica with sub-second failover'
      ]
    },
    rag: {
      id: 'rag',
      title: 'Semantic Vector Search & Generative AI RAG Pipeline',
      tagline: 'Accurate Context Retrieval with Zero Hallucination',
      summary: 'Architected to index massive corporate knowledge repositories, technical documentation, and customer archives into high-dimensional vector spaces for real-time natural language synthesis.',
      nodes: [
        {
          title: '1. Ingestion & Semantic Chunking',
          tech: 'Python + Unstructured.io + Recursive Splitters',
          desc: 'Extracts text, tables, and headers from PDFs and Markdown, segmenting into optimal 512-token semantic windows with 50-token overlap.',
          latency: 'Batch async'
        },
        {
          title: '2. Embedding Generation',
          tech: 'Gemini Text-Embedding-004 / Ada-002',
          desc: 'Generates 768-dimensional normalized floating point vectors representing contextual meaning.',
          latency: '45ms / chunk'
        },
        {
          title: '3. Vector Similarity Retrieval',
          tech: 'PostgreSQL pgvector (HNSW Indexing) / Pinecone',
          desc: 'Performs cosine distance search matching user query vectors against millions of indexed document fragments in milliseconds.',
          latency: '18ms'
        },
        {
          title: '4. Context Augmentation & Synthesis',
          tech: 'Gemini 1.5 Flash / Pro + Citation Tracker',
          desc: 'Injects top-k retrieved snippets into guarded system prompts, returning precise answers with verified page-number citations.',
          latency: 'Streaming'
        }
      ],
      resilienceSpecs: [
        'Hybrid lexical (BM25) + semantic vector re-ranking for maximum recall',
        'Strict Prompt Guardrails preventing prompt-injection attacks',
        'Vector cache storing common technical queries for instant responses'
      ]
    },
    cicd: {
      id: 'cicd',
      title: 'Resilient Cloud & Zero-Downtime Deployment',
      tagline: 'Automated CI/CD from Git Push to Multi-Region Containers',
      summary: 'Complete automated deployment lifecycle supporting automated unit testing, multi-stage minimal Docker builds, blue/green rolling deployments, and automated SSL termination.',
      nodes: [
        {
          title: '1. Git Commit & Webhook Trigger',
          tech: 'GitHub Actions Runner',
          desc: 'Runs linting, strict TypeScript type-checking, and Jest / PyTest test suites with 88%+ mandatory code coverage threshold.',
          latency: '60s build'
        },
        {
          title: '2. Multi-Stage Container Build',
          tech: 'Docker BuildKit + Alpine Minimal Images',
          desc: 'Constructs hardened, lightweight container images (<65MB), strips build dependencies, and caches node_modules / pip wheels.',
          latency: '40s'
        },
        {
          title: '3. Registry & Vulnerability Audit',
          tech: 'AWS ECR / GitHub Packages + Trivy Scanner',
          desc: 'Scans image layers for CVE vulnerabilities and signs release artifacts with cryptographically verified checksums.',
          latency: '15s'
        },
        {
          title: '4. Blue/Green Rolling Deployment',
          tech: 'AWS ECS / Docker Swarm + Caddy Health Probes',
          desc: 'Spins up new green containers, validates /health endpoint, shifts live traffic seamlessly, and gracefully retires old containers.',
          latency: '0 downtime'
        }
      ],
      resilienceSpecs: [
        'Automated instant rollback if health check fails 3 times in 10 seconds',
        'Auto-renewing Let\'s Encrypt TLS certificates with automated OCSP stapling',
        'Prometheus & Grafana telemetry tracking memory leaks and CPU spikes'
      ]
    }
  };

  const current = blueprints[selectedBlueprint];

  return (
    <section id="architecture" className="py-20 relative bg-[#010804]/60 border-y border-[rgba(240,185,46,0.18)]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-semibold text-[#3dff8f] bg-[#3dff8f]/10 border border-[#3dff8f]/30 mb-3">
            <Network className="w-3.5 h-3.5 text-[#3dff8f]" />
            <span>SYSTEM DESIGN SHOWCASE</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-serif-heading mb-4 gold-text">
            How I architect scalable systems
          </h2>
          <p className="text-base sm:text-lg text-[#9fbfae]">
            Interactive system blueprints illustrating distributed microservices, semantic vector pipelines, and zero-downtime deployment topologies.
          </p>
        </div>

        {/* Blueprint Selector Tabs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-10">
          {(['fintech', 'rag', 'cicd'] as const).map((key) => {
            const bp = blueprints[key];
            const isSelected = selectedBlueprint === key;
            return (
              <button
                key={key}
                onClick={() => setSelectedBlueprint(key)}
                className={`p-5 rounded-2xl text-left transition-all duration-200 cursor-pointer card-neon-shallow ${
                  isSelected
                    ? 'bg-gradient-to-br from-[#0f7a43]/35 to-[#02180d] !border-[#3dff8f] !shadow-[0_0_20px_rgba(61,255,143,0.45)]'
                    : 'bg-[#021008]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#f0b92e]">
                    {key === 'fintech' ? 'FinTech Microservices' : key === 'rag' ? 'AI Vector Pipeline' : 'Cloud CI/CD'}
                  </span>
                  {isSelected && <Zap className="w-4 h-4 text-[#3dff8f]" />}
                </div>
                <div className="font-serif-heading font-bold text-base sm:text-lg text-[#fff1b8] mb-1">
                  {bp.title}
                </div>
                <div className="text-xs text-[#9fbfae] line-clamp-2">
                  {bp.tagline}
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Blueprint Visualization Panel */}
        <div className="p-6 sm:p-10 rounded-3xl bg-[#02140b] card-neon-shallow shadow-2xl relative overflow-hidden">
          {/* Header of the Active Diagram */}
          <div className="mb-8 pb-6 border-b border-[rgba(240,185,46,0.2)] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-mono text-[#3dff8f] uppercase tracking-wider mb-1">
                Active Architecture Blueprint
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold font-serif-heading text-[#fff1b8]">
                {current.title}
              </h3>
              <p className="text-sm text-[#9fbfae] mt-2 max-w-2xl">
                {current.summary}
              </p>
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#010904] border border-[#3dff8f]/30 text-xs font-mono text-[#3dff8f] shrink-0">
              <span className="w-2 h-2 rounded-full bg-[#3dff8f] animate-ping" />
              <span>Production Tested Design</span>
            </div>
          </div>

          {/* Step-by-Step Flow Nodes */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {current.nodes.map((node, index) => (
              <div
                key={node.title}
                className="p-5 rounded-2xl bg-[#010b06] border border-[rgba(240,185,46,0.2)] hover:border-[#3dff8f] transition-all relative flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-[#f0b92e] font-serif-heading">
                      {node.title}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0a3d22] text-[#3dff8f]">
                      {node.latency}
                    </span>
                  </div>
                  <div className="text-xs font-mono font-semibold text-[#fff1b8] mb-3">
                    {node.tech}
                  </div>
                  <p className="text-xs text-[#9fbfae] leading-relaxed">
                    {node.desc}
                  </p>
                </div>

                {/* Micro flow arrow */}
                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-[#3dff8f] font-mono">
                  <span>Step {index + 1} of 4</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#3dff8f] group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>

          {/* Fault-Tolerance & Resilience Guarantees */}
          <div className="p-5 rounded-2xl bg-[#010b06]/90 border border-[#0f7a43]/50">
            <div className="text-xs font-mono text-[#f0b92e] font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#f0b92e]" />
              <span>Fault-Tolerance & Resilience Guarantees</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {current.resilienceSpecs.map((spec) => (
                <div key={spec} className="flex items-start gap-2.5 text-xs text-[#f4fff8]">
                  <CheckCircle2 className="w-4 h-4 text-[#3dff8f] shrink-0 mt-0.5" />
                  <span>{spec}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
