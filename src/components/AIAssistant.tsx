import React, { useState, useRef, useEffect } from 'react';
import { ProfileData } from '../data/portfolioStorage';
import { Bot, X, Send, Sparkles, User, MessageSquare } from 'lucide-react';

interface AIAssistantProps {
  isOpen: boolean;
  onToggle: () => void;
  profile: ProfileData;
}

interface Message {
  sender: 'bot' | 'user';
  text: string;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ isOpen, onToggle, profile }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'bot',
      text: `Hello! I am Boniphace's AI Creative Assistant. Ask me about his graphic design services, website development projects, AI-assisted workflows, or how to collaborate on your next project!`
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const quickQuestions = [
    'Services?',
    'Design Tools?',
    'AI Workflow?',
    'Location?',
    'Hire Boniphace?'
  ];

  const answerQuery = (query: string): string => {
    const q = query.toLowerCase().trim();

    if (q.includes('service') || q.includes('offer') || q.includes('what do you do') || q.includes('help')) {
      return `Boniphace provides professional creative and digital services:\n• Graphic Design & Brand Identity (Logos, Style Guides, Vector Art)\n• Marketing Collateral (Flyers, Posters, Banners, Social Media Graphics)\n• Website Design (Figma UI/UX Mockups & Wireframes)\n• Website Development (Responsive Websites with HTML5, CSS/Tailwind, JavaScript, React)\n• Digital Content Creation (Carousel Posts, Campaign Visuals)\n• AI-Assisted Design & Prototyping\n• Website Maintenance and Enhancements.`;
    }

    if (q.includes('tool') || q.includes('software') || q.includes('skill') || q.includes('stack')) {
      return `Boniphace works with industry-standard creative and web tools:\n• Design & Vector: Adobe Illustrator, Adobe Photoshop, Figma, Canva\n• Web Development: HTML5, CSS3, Tailwind CSS, JavaScript (ES6+), React, TypeScript, Vite\n• AI Creative Tools: Gemini, ChatGPT, Midjourney, Figma AI Plugins\n• Collaboration: Git, GitHub, Notion.`;
    }

    if (q.includes('workflow') || q.includes('how do you use ai') || q.includes('ai workflow')) {
      return `Boniphace uses AI as a practical creative accelerator across 7 structured stages:\n1. Idea research & briefing\n2. Creative direction & prompt engineering\n3. Visual design & asset generation\n4. AI-assisted coding & web prototyping\n5. Manual review & artisanal refinement (the vital human gatekeeper stage)\n6. Responsive device testing\n7. Deployment and delivery.\n\nAI provides rapid ideation and code scaffolding, but Boniphace's human taste, craftsmanship, and verification ensure the final delivery is original, error-free, and brand-aligned.`;
    }

    if (q.includes('location') || q.includes('where') || q.includes('country') || q.includes('timezone')) {
      return `Boniphace is based in ${profile.location} (East Africa Time, UTC+3). He works with clients locally across Tanzania and collaborates remotely with international businesses and creators worldwide.`;
    }

    if (q.includes('hire') || q.includes('contact') || q.includes('email') || q.includes('phone') || q.includes('whatsapp') || q.includes('price') || q.includes('cost')) {
      return `You can reach Boniphace directly:\n• Email: ${profile.email}\n• Phone / WhatsApp: ${profile.phone}\n• WhatsApp Direct: https://wa.me/${profile.whatsapp}\n\nHe is currently ${profile.availability.toLowerCase()} and responds within 24 hours. You can also use the contact form on this page!`;
    }

    if (q.includes('project') || q.includes('portfolio') || q.includes('work') || q.includes('example')) {
      return `You can explore Boniphace's recent creative work in the Projects section above, featuring:\n1. Serengeti Horizons Brand Identity System\n2. Lumina Creative Studio Responsive Website\n3. Zanzibar Heritage Spices Packaging & Social Graphics\n4. Zenith Studio AI Creative Interface Prototype\n\nClick any project card to view the full case study, process, and tools used.`;
    }

    if (q.includes('hello') || q.includes('hi') || q.includes('hey')) {
      return `Hello! How can I assist you with Boniphace's graphic design services, website development, or project inquiries today?`;
    }

    return `Boniphace Ndege is a Graphic Designer, Website Designer & Developer, and Digital Content Creator based in ${profile.location}. Would you like to know about his services, creative workflow, past projects, or how to get in touch?`;
  };

  const handleSend = (textToSend?: string) => {
    const text = textToSend || inputVal;
    if (!text.trim()) return;

    setMessages((prev) => [...prev, { sender: 'user', text }]);
    setInputVal('');
    setIsTyping(true);

    setTimeout(() => {
      const response = answerQuery(text);
      setMessages((prev) => [...prev, { sender: 'bot', text: response }]);
      setIsTyping(false);
    }, 400);
  };

  return (
    <>
      {/* Floating Action Button (#fab) - reduced sleek size */}
      <button
        id="fab"
        onClick={onToggle}
        aria-label="Toggle Boniphace AI Assistant"
        className="fixed right-5 bottom-22 sm:right-7 sm:bottom-24 z-40 w-11 h-11 sm:w-12 sm:h-12 rounded-full border-0 text-white font-bold cursor-pointer flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_0_0_2px_#f0b92e,0_0_20px_rgba(61,255,143,0.45)] group"
        style={{
          background: 'linear-gradient(135deg, #0b5a32, #17a05a 45%, #0b5a32 70%, #12874c)'
        }}
        title="Open AI Creative Assistant"
      >
        <span className="relative flex items-center justify-center">
          <Bot className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-white group-hover:rotate-12 transition-transform" />
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#f0b92e] shadow-[0_0_6px_#f0b92e]" />
        </span>
      </button>

      {/* Signature Chat Modal Card Centered at the Screen */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            id="chat"
            className="w-full max-w-lg rounded-[26px] bg-[#02100a] border-2 border-[#f0b92e] shadow-[0_0_60px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
          >
            {/* Header: Boniphace Creative Assistant / Ready to assist */}
            <div
              className="px-5 py-4 flex items-center justify-between text-white border-b border-[rgba(240,185,46,0.3)] shrink-0"
              style={{
                background: 'linear-gradient(135deg, #0b5a32, #17a05a 45%, #0b5a32 70%, #12874c)'
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-black/30 flex items-center justify-center text-[#f0b92e] border border-[#f0b92e]/30">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif-heading font-extrabold text-base text-[#fff1b8]">
                    Boniphace Creative Assistant
                  </h3>
                  <span className="text-[11px] text-[#3dff8f] font-mono flex items-center gap-1.5 font-bold">
                    <span className="w-2 h-2 rounded-full bg-[#3dff8f] animate-pulse" />
                    Ready to assist
                  </span>
                </div>
              </div>
              <button
                onClick={onToggle}
                className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-black/25 transition-colors cursor-pointer"
                aria-label="Close assistant"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Messages Log */}
            <div
              ref={logRef}
              className="p-5 h-[300px] overflow-y-auto flex flex-col gap-3.5 text-xs sm:text-sm bg-[#010904]"
            >
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex gap-2.5 max-w-[90%] ${
                    m.sender === 'user' ? 'self-end flex-row-reverse' : 'self-start'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold ${
                      m.sender === 'user'
                        ? 'bg-[#f0b92e] text-[#1a1200]'
                        : 'bg-[#0f7a43] text-[#3dff8f] border border-[#3dff8f]/40'
                    }`}
                  >
                    {m.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div
                    className={`p-3.5 rounded-2xl whitespace-pre-wrap leading-relaxed shadow-sm ${
                      m.sender === 'user'
                        ? 'bg-[#f0b92e] text-[#1a1200] font-medium rounded-tr-none'
                        : 'bg-[#0f7a43]/30 text-[#f4fff8] border border-[#3dff8f]/25 rounded-tl-none'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="self-start flex items-center gap-2 text-xs text-[#9fbfae]">
                  <div className="w-7 h-7 rounded-full bg-[#0f7a43] flex items-center justify-center text-[#3dff8f]">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="px-3.5 py-2 rounded-xl bg-[#0f7a43]/20 border border-[#3dff8f]/20 text-[#3dff8f] flex items-center gap-1.5 font-mono text-xs">
                    <span>Thinking</span>
                    <span className="animate-pulse">...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Centered Quick Suggestions Pills */}
            <div className="px-4 py-3 bg-[#02130a] border-t border-[rgba(240,185,46,0.18)] flex flex-wrap items-center justify-center gap-2">
              {quickQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSend(q)}
                  className="px-3 py-1.5 rounded-full text-xs font-mono font-semibold text-[#3dff8f] bg-[#0a351e]/80 border border-[#3dff8f]/40 hover:bg-[#3dff8f]/20 hover:border-[#3dff8f] active:scale-95 transition-all cursor-pointer shadow-sm"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="p-3.5 bg-[#010703] border-t border-[rgba(240,185,46,0.2)] flex items-center gap-2.5"
            >
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Ask about design services, workflow, tools..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#02130a] border border-[rgba(240,185,46,0.3)] text-xs sm:text-sm text-white focus:outline-none focus:border-[#3dff8f] placeholder:text-[#9fbfae]/50"
              />
              <button
                type="submit"
                disabled={!inputVal.trim()}
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#f0b92e] to-[#b8841a] text-[#1a1200] flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-md shrink-0"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
