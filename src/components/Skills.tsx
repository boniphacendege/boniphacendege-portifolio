import React, { useState, useMemo } from 'react';
import { SkillItem } from '../data/portfolioStorage';
import { Layers, Wrench, Sparkles, CheckCircle2, SlidersHorizontal, PlusCircle } from 'lucide-react';

interface SkillsProps {
  skills: SkillItem[];
  onOpenAdmin: () => void;
}

const SkillsComponent: React.FC<SkillsProps> = ({ skills, onOpenAdmin }) => {
  const publishedSkills = useMemo(() => skills.filter((s) => s.published), [skills]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = useMemo(
    () => ['all', ...Array.from(new Set(publishedSkills.map((s) => s.category)))],
    [publishedSkills]
  );

  const filteredSkills = useMemo(() => {
    if (selectedCategory === 'all') return publishedSkills;
    return publishedSkills.filter((skill) => skill.category === selectedCategory);
  }, [publishedSkills, selectedCategory]);

  return (
    <section id="skills" className="py-20 relative">
      <div className="w-full max-w-[1740px] 2xl:max-w-[1860px] mx-auto px-2.5 sm:px-4 md:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6 stagger-child">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-semibold text-[#f0b92e] bg-[#f0b92e]/10 border border-[#f0b92e]/25 mb-3">
              <Wrench className="w-3.5 h-3.5 text-[#f0b92e]" />
              <span>SKILLS & TOOLING</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-serif-heading mb-4 gold-text">
              Skills, software & practical tools
            </h2>
            <p className="text-base sm:text-lg text-[#9fbfae]">
              A transparent view of the design suites, web technologies, and AI workflows I use to plan and deliver creative work.
            </p>
          </div>

          <button
            type="button"
            data-unauth-exempt="true"
            data-admin-portal="true"
            data-admin-trigger="true"
            onClick={onOpenAdmin}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs sm:text-sm font-semibold text-[#3dff8f] border border-[#3dff8f]/40 hover:bg-[#3dff8f]/10 transition-all cursor-pointer self-start md:self-auto shrink-0"
          >
            <SlidersHorizontal className="w-4 h-4 text-[#3dff8f]" />
            <span>Manage Skills</span>
          </button>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 mb-10 overflow-x-auto pb-2 stagger-child">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer shrink-0 ${
                selectedCategory === cat
                  ? 'bg-[#3dff8f]/15 text-[#3dff8f] border border-[#3dff8f] shadow-[0_0_12px_-4px_#3dff8f]'
                  : 'text-[#9fbfae] border border-[rgba(240,185,46,0.2)] hover:border-[#3dff8f]/40 hover:text-white'
              }`}
            >
              {cat === 'all' ? 'All Skills & Tools' : cat}
            </button>
          ))}
        </div>

        {/* Skills Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredSkills.map((skill) => (
            <div
              key={skill.id}
              className="p-6 rounded-[20px] bg-gradient-to-br from-[#0f7a43]/18 via-[#03170d]/80 to-[#010703] card-neon-shallow transition-all flex flex-col justify-between group shadow-lg stagger-child"
            >
              <div>
                {/* Title & Category Badge */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-base sm:text-lg font-bold font-serif-heading text-[#fff1b8] group-hover:text-[#3dff8f] transition-colors">
                    {skill.name}
                  </span>
                  <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-[#0a351e] text-[#3dff8f] border border-[#3dff8f]/20">
                    {skill.category}
                  </span>
                </div>

                {/* Short Description */}
                {skill.shortDescription && (
                  <p className="text-xs sm:text-sm text-[#9fbfae] leading-relaxed mb-4">
                    {skill.shortDescription}
                  </p>
                )}
              </div>

              <div>
                {/* Self-Selected Proficiency (Only if provided) */}
                {typeof skill.proficiency === 'number' && skill.proficiency > 0 && (
                  <div className="mb-3.5">
                    <div className="flex justify-between items-center text-xs font-mono mb-1.5">
                      <span className="text-[#9fbfae]">Self-assessed proficiency:</span>
                      <strong className="text-[#f0b92e]">{skill.proficiency}%</strong>
                    </div>
                    <div className="h-2 rounded-full bg-[#0a2216] overflow-hidden border border-white/5">
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{
                          width: `${skill.proficiency}%`,
                          background: 'linear-gradient(90deg, #0f7a43, #3dff8f)'
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Tools & Software Badges */}
                {skill.tools && skill.tools.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-3 border-t border-[rgba(240,185,46,0.15)]">
                    {skill.tools.map((tool) => (
                      <span
                        key={tool}
                        className="text-[10px] sm:text-[11px] font-mono px-2 py-0.5 rounded bg-[#010904] text-[#fff1b8] border border-[rgba(240,185,46,0.2)]"
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Workflow Callout */}
        <div className="mt-12 p-6 sm:p-8 rounded-2xl bg-[#02130a] border border-[rgba(240,185,46,0.2)] flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#0f7a43]/30 border border-[#3dff8f]/30 flex items-center justify-center shrink-0 text-[#3dff8f]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base sm:text-lg font-bold text-[#f4fff8]">
                Continuous Learning & Modern Tool Adoption
              </h4>
              <p className="text-xs sm:text-sm text-[#9fbfae] mt-1 max-w-2xl leading-relaxed">
                I continuously refine my techniques in vector graphic suites, modern CSS architecture, React development, and emerging AI tools to ensure your projects leverage the best contemporary practices.
              </p>
            </div>
          </div>
          <a
            href="#workflow"
            className="shrink-0 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold text-[#f0b92e] hover:text-white border border-[#f0b92e]/40 hover:bg-[#f0b92e]/10 transition-colors"
          >
            See AI Creative Workflow →
          </a>
        </div>
      </div>
    </section>
  );
};

export const Skills = React.memo(SkillsComponent);
