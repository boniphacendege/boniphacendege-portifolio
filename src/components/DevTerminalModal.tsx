import React, { useState, useEffect, useRef } from 'react';
import { PORTFOLIO_DATA } from '../data/portfolioData';
import { Terminal as TerminalIcon, X, Maximize2, Minimize2 } from 'lucide-react';

interface DevTerminalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateContact: () => void;
  onOpenResume: () => void;
}

export const DevTerminalModal: React.FC<DevTerminalModalProps> = ({
  isOpen,
  onClose,
  onNavigateContact,
  onOpenResume
}) => {
  const [history, setHistory] = useState<Array<{ command: string; output: string | React.ReactNode }>>([
    {
      command: 'welcome',
      output: (
        <div>
          <div className="text-[#3dff8f] font-bold">
            ⚡ Boniphace Ndege OS [Version 4.2.0-LTS (dar-es-salaam)]
          </div>
          <div className="text-[#9fbfae] text-xs mt-1">
            Type <span className="text-[#f0b92e] font-bold">help</span> to list available commands or <span className="text-[#f0b92e] font-bold">skills</span>, <span className="text-[#f0b92e] font-bold">projects</span>, <span className="text-[#f0b92e] font-bold">hire</span>.
          </div>
        </div>
      )
    }
  ]);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  if (!isOpen) return null;

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = input.trim();
    const lower = cmd.toLowerCase();

    if (!cmd) return;

    let output: string | React.ReactNode = '';

    switch (lower) {
      case 'help':
        output = (
          <div className="space-y-1 text-xs">
            <div className="text-[#f0b92e] font-bold mb-1">AVAILABLE COMMANDS:</div>
            <div>• <strong className="text-[#3dff8f]">whoami</strong> - Display engineer identity & bio</div>
            <div>• <strong className="text-[#3dff8f]">skills</strong> - Tabulate full technical competencies</div>
            <div>• <strong className="text-[#3dff8f]">projects</strong> - Output featured production systems</div>
            <div>• <strong className="text-[#3dff8f]">architecture</strong> - View system design philosophy</div>
            <div>• <strong className="text-[#3dff8f]">experience</strong> - Career trajectory & education</div>
            <div>• <strong className="text-[#3dff8f]">contact</strong> - Direct communication endpoints</div>
            <div>• <strong className="text-[#3dff8f]">hire</strong> - Jump to project/hiring form</div>
            <div>• <strong className="text-[#3dff8f]">resume</strong> - Launch curriculum vitae viewer</div>
            <div>• <strong className="text-[#3dff8f]">matrix</strong> - Toggle system neural pulse</div>
            <div>• <strong className="text-[#3dff8f]">clear</strong> - Clear current console buffer</div>
            <div>• <strong className="text-[#3dff8f]">exit</strong> - Close developer terminal</div>
          </div>
        );
        break;

      case 'whoami':
      case 'about':
        output = `${PORTFOLIO_DATA.name} — ${PORTFOLIO_DATA.role}\nLocation: ${PORTFOLIO_DATA.location}\nBio: ${PORTFOLIO_DATA.lead}\nStatus: ${PORTFOLIO_DATA.availability}`;
        break;

      case 'skills':
        output = (
          <div className="space-y-1 text-xs font-mono">
            <div className="text-[#f0b92e] font-bold">CORE TECHNICAL COMPETENCIES:</div>
            {PORTFOLIO_DATA.skills.map((s) => (
              <div key={s.name} className="flex justify-between max-w-sm py-0.5 border-b border-white/5">
                <span className="text-[#fff1b8]">{s.name}</span>
                <span className="text-[#3dff8f] font-bold">[{s.level}%] ({s.experience})</span>
              </div>
            ))}
          </div>
        );
        break;

      case 'projects':
        output = (
          <div className="space-y-2 text-xs">
            <div className="text-[#f0b92e] font-bold">FEATURED PRODUCTION SYSTEMS:</div>
            {PORTFOLIO_DATA.projects.map((p, i) => (
              <div key={p.id} className="p-2 rounded bg-black/40 border border-white/5">
                <div className="text-[#3dff8f] font-bold">{i + 1}. {p.title} ({p.kind})</div>
                <div className="text-[#9fbfae] text-[11px]">{p.description}</div>
                <div className="text-[#f0b92e] text-[10px] mt-1">Stack: {p.chips.join(', ')}</div>
              </div>
            ))}
          </div>
        );
        break;

      case 'architecture':
        output = `System Architecture Tenets:\n1. Zero single-points-of-failure (HA database replicas + load-balanced containers).\n2. Strict idempotency across external payment/webhook callbacks.\n3. Semantic vector search pipelines with normalized embeddings and HNSW indexes.\n4. Microsecond in-memory caching layers (Redis/Memcached).\n5. Zero-downtime rolling deployments via automated CI/CD.`;
        break;

      case 'experience':
        output = (
          <div className="space-y-2 text-xs">
            <div className="text-[#f0b92e] font-bold">CAREER HISTORY:</div>
            {PORTFOLIO_DATA.timeline.map((item) => (
              <div key={item.company} className="py-1 border-b border-white/5">
                <div className="text-[#3dff8f] font-bold">{item.role} @ {item.company}</div>
                <div className="text-[#9fbfae] text-[11px]">{item.period} · {item.location}</div>
              </div>
            ))}
          </div>
        );
        break;

      case 'contact':
        output = `Direct Communication Channels:\n• Email: ${PORTFOLIO_DATA.email}\n• Phone: ${PORTFOLIO_DATA.phone}\n• WhatsApp: https://wa.me/${PORTFOLIO_DATA.whatsapp}\n• Location: ${PORTFOLIO_DATA.location}`;
        break;

      case 'hire':
        output = 'Opening contact inquiry module...';
        setTimeout(() => {
          onClose();
          onNavigateContact();
        }, 500);
        break;

      case 'resume':
      case 'cv':
        output = 'Launching curriculum vitae...';
        setTimeout(() => {
          onClose();
          onOpenResume();
        }, 500);
        break;

      case 'matrix':
        output = (
          <div className="text-[#3dff8f] font-mono text-xs animate-pulse">
            01000010 01101111 01101110 01101001 01110000 01101000 01100001 01100011 01100101<br />
            [SYSTEM OPTIMAL] ALL HEALTH PROBES REPORTING 100% HEALTHY<br />
            DATABASE CONNECTION POOL: 20/20 ACTIVE | REDIS HIT RATIO: 94.2%
          </div>
        );
        break;

      case 'clear':
        setHistory([]);
        setInput('');
        return;

      case 'exit':
      case 'quit':
        onClose();
        setInput('');
        return;

      default:
        output = `Command not recognized: "${cmd}". Type "help" to see available commands.`;
        break;
    }

    setHistory((prev) => [...prev, { command: cmd, output }]);
    setInput('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div
        className="w-full max-w-[720px] h-[520px] bg-[#020d07] border border-[#3dff8f]/50 rounded-2xl shadow-[0_0_50px_rgba(61,255,143,0.3)] flex flex-col overflow-hidden font-mono text-xs sm:text-sm"
        role="dialog"
      >
        {/* Terminal Header */}
        <div className="px-4 py-3 bg-[#010704] border-b border-[#3dff8f]/30 flex items-center justify-between select-none">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#ff5f56]" />
            <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
            <span className="w-3 h-3 rounded-full bg-[#27c93f]" />
            <span className="text-xs text-[#9fbfae] ml-2 flex items-center gap-1.5 font-bold">
              <TerminalIcon className="w-3.5 h-3.5 text-[#3dff8f]" />
              boniphace@ndege-system: ~
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-[#9fbfae] hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Console Log Area */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4 text-[#f4fff8] bg-[#010a05]">
          {history.map((h, i) => (
            <div key={i} className="space-y-1">
              <div className="flex items-center gap-2 text-[#3dff8f]">
                <span className="text-[#f0b92e]">guest@ndege:~$</span>
                <span>{h.command}</span>
              </div>
              <div className="text-[#9fbfae] pl-4 whitespace-pre-wrap">{h.output}</div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={handleCommand}
          className="p-3 bg-[#010804] border-t border-[#3dff8f]/20 flex items-center gap-2"
        >
          <span className="text-[#f0b92e] font-bold">guest@ndege:~$</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type 'help' or command..."
            className="flex-1 bg-transparent text-[#3dff8f] focus:outline-none font-mono text-xs sm:text-sm caret-[#3dff8f]"
            autoFocus
          />
        </form>
      </div>
    </div>
  );
};
