import React from 'react';
import {
  ProfileData,
  SkillItem,
  WorkExperienceItem,
  EducationItem,
  CertificationItem,
  ProjectItem
} from '../data/portfolioStorage';
import {
  X,
  Printer,
  Download,
  MapPin,
  Mail,
  Phone,
  CheckCircle2,
  ExternalLink,
  Briefcase,
  GraduationCap,
  Award,
  Wrench,
  Palette
} from 'lucide-react';

interface ResumeModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: ProfileData;
  skills: SkillItem[];
  experience: WorkExperienceItem[];
  education: EducationItem[];
  certifications: CertificationItem[];
  projects: ProjectItem[];
}

export const ResumeModal: React.FC<ResumeModalProps> = ({
  isOpen,
  onClose,
  profile,
  skills,
  experience,
  education,
  certifications,
  projects
}) => {
  if (!isOpen) return null;

  const publishedSkills = skills.filter((s) => s.published);
  const publishedExp = experience.filter((e) => e.published);
  const publishedEdu = education.filter((e) => e.published);
  const publishedCerts = certifications.filter((c) => c.published);
  const featuredProjects = projects.filter((p) => p.published && p.featured).slice(0, 3);

  const handleDownloadCvHtml = () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${profile.name} — Curriculum Vitae</title>
  <style>
    @page { margin: 12mm 15mm; size: A4; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1f2937; line-height: 1.5; padding: 24px; max-width: 820px; margin: 0 auto; background: #fff; }
    h1 { color: #064e3b; margin: 0 0 4px 0; font-size: 26px; }
    .subtitle { color: #059669; font-weight: 700; margin-bottom: 12px; font-size: 14px; }
    .contact { font-size: 12px; color: #4b5563; margin-bottom: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; display: flex; flex-wrap: wrap; gap: 12px; }
    h2 { font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: #064e3b; border-bottom: 1.5px solid #10b981; padding-bottom: 4px; margin-top: 18px; margin-bottom: 10px; }
    p { font-size: 12.5px; color: #374151; margin: 0 0 8px 0; }
    .item { margin-bottom: 14px; page-break-inside: avoid; }
    .item-header { display: flex; justify-content: space-between; font-weight: 700; font-size: 13px; color: #111827; }
    .item-sub { color: #059669; font-size: 11.5px; margin-bottom: 4px; font-weight: 600; }
    .item-desc { font-size: 12px; color: #4b5563; }
    .badge { display: inline-block; background: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46; padding: 3px 8px; border-radius: 4px; font-size: 11px; margin: 2px 5px 2px 0; font-weight: 500; }
    .print-actions { margin-bottom: 20px; padding: 12px 16px; background: #f0fdf4; border: 1px solid #86efac; border-radius: 10px; display: flex; justify-content: space-between; align-items: center; }
    @media print {
      body { padding: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="no-print print-actions">
    <div><strong>Ready for Print or PDF:</strong> Click Print below or press Ctrl+P (Cmd+P) to Save as PDF</div>
    <button onclick="window.print()" style="background: #059669; color: white; border: none; padding: 9px 18px; font-weight: bold; border-radius: 6px; cursor: pointer;">Print / Save as PDF</button>
  </div>
  <h1>${profile.name}</h1>
  <div class="subtitle">${profile.titles.join(' • ')}</div>
  <div class="contact">
    <span>📍 ${profile.location}</span>
    <span>✉️ ${profile.email}</span>
    <span>📞 ${profile.phone}</span>
  </div>
  
  <h2>Professional Summary</h2>
  <p>${profile.intro}</p>
  <p>${profile.bio}</p>

  <h2>Core Competencies & Skills</h2>
  <div>
    ${publishedSkills.map(s => `<span class="badge">${s.name}${s.proficiency ? ` (${s.proficiency}%)` : ''}</span>`).join('')}
  </div>

  <h2>Work Experience</h2>
  ${publishedExp.map(e => `
    <div class="item">
      <div class="item-header"><span>${e.roleTitle} — ${e.employer}</span><span>${e.startDate} – ${e.current ? 'Present' : e.endDate}</span></div>
      <div class="item-sub">${e.location}</div>
      <div class="item-desc">${e.description}</div>
    </div>
  `).join('')}

  <h2>Education & Training</h2>
  ${publishedEdu.map(ed => `
    <div class="item">
      <div class="item-header"><span>${ed.qualification}${ed.field ? ` in ${ed.field}` : ''}</span><span>${ed.startDate} – ${ed.endDate}</span></div>
      <div class="item-sub">${ed.institution}</div>
      ${ed.description ? `<div class="item-desc">${ed.description}</div>` : ''}
    </div>
  `).join('')}

  ${publishedCerts.length > 0 ? `
  <h2>Certifications</h2>
  ${publishedCerts.map(c => `
    <div class="item">
      <div class="item-header"><span>${c.title}</span><span>${c.date}</span></div>
      <div class="item-sub">${c.issuingOrg}</div>
    </div>
  `).join('')}
  ` : ''}

  ${featuredProjects.length > 0 ? `
  <h2>Selected Portfolio Projects</h2>
  ${featuredProjects.map(p => `
    <div class="item">
      <div class="item-header"><span>${p.title} (${p.category})</span></div>
      <div class="item-desc">${p.summary}</div>
      <div style="font-size: 11px; color: #059669; margin-top: 2px;">Tools: ${p.tools.join(', ')}</div>
    </div>
  `).join('')}
  ` : ''}

  <script>
    // Prompt print dialog when opened in new tab/browser
    setTimeout(function() { window.print(); }, 500);
  </script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${profile.name.replace(/[^a-zA-Z0-9]/g, '_')}_Curriculum_Vitae.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    try {
      window.print();
    } catch (e) {
      console.warn('Direct window.print was intercepted by sandbox, launching printable file:', e);
      handleDownloadCvHtml();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 cv-print-modal-container">
      <div
        className="w-full max-w-[820px] max-h-[92vh] bg-[#02100a] text-[#f4fff8] card-neon-shallow rounded-[24px] shadow-[0_20px_70px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 cv-print-card"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Top Bar */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-[#010904] border-b border-[rgba(240,185,46,0.3)] flex items-center justify-between gap-3 cv-print-hide">
          <div className="flex items-center gap-2 text-xs font-mono text-[#3dff8f] truncate">
            <span className="w-2 h-2 rounded-full bg-[#3dff8f] shrink-0" />
            <span className="truncate">CURRICULUM VITAE — {profile.name.toUpperCase()}</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Dedicated Primary Print / Save PDF Button */}
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[#011408] bg-gradient-to-r from-[#3dff8f] to-[#2ecc71] hover:from-[#5effa5] hover:to-[#3dff8f] shadow-[0_0_12px_rgba(61,255,143,0.45)] active:scale-95 transition-all cursor-pointer"
              title="Print CV or Save as PDF"
            >
              <Printer className="w-3.5 h-3.5 text-[#011408]" />
              <span>Print / Save PDF</span>
            </button>

            {/* Alternative Export Download Button */}
            <button
              onClick={handleDownloadCvHtml}
              className="hidden min-[480px]:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-[#fff1b8] bg-[#031d0f] border border-[#f0b92e]/40 hover:border-[#f0b92e] hover:text-white transition-all cursor-pointer"
              title="Export Printable CV Document"
            >
              <Download className="w-3.5 h-3.5 text-[#f0b92e]" />
              <span className="text-[11px]">Export</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-xl text-[#9fbfae] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close CV"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable CV Document Body */}
        <div className="p-6 sm:p-10 overflow-y-auto space-y-7 print:p-0 cv-print-body">
          {/* Header */}
          <div className="border-b border-[rgba(240,185,46,0.25)] pb-6">
            <h2 className="text-3xl sm:text-4xl font-extrabold font-serif-heading gold-text mb-1">
              {profile.name}
            </h2>
            <div className="text-sm sm:text-base font-semibold text-[#3dff8f] mb-3">
              {profile.titles.join(' • ')}
            </div>
            <div className="flex flex-wrap gap-y-2 gap-x-5 text-xs text-[#9fbfae] font-mono">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#f0b92e]" />
                {profile.location}
              </span>
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#f0b92e]" />
                {profile.email}
              </span>
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#f0b92e]" />
                {profile.phone}
              </span>
            </div>
          </div>

          {/* Professional Summary */}
          <div>
            <h3 className="text-xs font-mono font-bold text-[#f0b92e] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-[#f0b92e]" />
              <span>Professional Summary</span>
            </h3>
            <p className="text-xs sm:text-sm text-[#9fbfae] leading-relaxed">
              {profile.intro}
            </p>
          </div>

          {/* Core Skills & Tools */}
          <div>
            <h3 className="text-xs font-mono font-bold text-[#f0b92e] uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Wrench className="w-4 h-4 text-[#f0b92e]" />
              <span>Skills, Software & Creative Tools</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {publishedSkills.map((s) => (
                <div key={s.id} className="p-3 rounded-xl bg-[#010a05] border border-white/5 space-y-1">
                  <div className="flex justify-between items-baseline">
                    <strong className="text-[#fff1b8]">{s.name}</strong>
                    {s.proficiency && (
                      <span className="text-[10px] font-mono text-[#3dff8f]">{s.proficiency}%</span>
                    )}
                  </div>
                  {s.tools && s.tools.length > 0 && (
                    <div className="text-[11px] text-[#9fbfae] font-mono">
                      {s.tools.join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Experience */}
          <div>
            <h3 className="text-xs font-mono font-bold text-[#f0b92e] uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-[#f0b92e]" />
              <span>Work & Freelance Experience</span>
            </h3>
            <div className="space-y-5">
              {publishedExp.map((exp) => (
                <div key={exp.id} className="space-y-1.5">
                  <div className="flex flex-wrap items-baseline justify-between gap-1">
                    <div className="font-bold text-sm sm:text-base text-[#fff1b8]">
                      {exp.roleTitle} · <span className="text-[#3dff8f] font-normal">{exp.employer}</span>
                    </div>
                    <span className="text-xs font-mono text-[#f0b92e]">
                      {exp.startDate} – {exp.current ? 'Present' : exp.endDate}
                    </span>
                  </div>
                  <p className="text-xs text-[#9fbfae] leading-relaxed">
                    {exp.description}
                  </p>
                  {exp.responsibilities && exp.responsibilities.length > 0 && (
                    <ul className="space-y-1 pt-1">
                      {exp.responsibilities.map((r, i) => (
                        <li key={i} className="text-xs text-[#f4fff8] flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#3dff8f] shrink-0 mt-0.5" />
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Education */}
          <div>
            <h3 className="text-xs font-mono font-bold text-[#f0b92e] uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-[#f0b92e]" />
              <span>Education</span>
            </h3>
            <div className="space-y-3">
              {publishedEdu.map((edu) => (
                <div key={edu.id} className="space-y-1 text-xs">
                  <div className="flex justify-between items-baseline">
                    <strong className="text-sm text-[#fff1b8]">{edu.qualification}</strong>
                    <span className="font-mono text-[#f0b92e]">{edu.startDate} – {edu.endDate}</span>
                  </div>
                  <div className="text-[#3dff8f] font-mono">{edu.institution}</div>
                  {edu.description && <p className="text-[#9fbfae]">{edu.description}</p>}
                </div>
              ))}
            </div>
          </div>

          {/* Certifications */}
          {publishedCerts.length > 0 && (
            <div>
              <h3 className="text-xs font-mono font-bold text-[#f0b92e] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-[#f0b92e]" />
                <span>Certifications</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {publishedCerts.map((c) => (
                  <div key={c.id} className="p-2.5 rounded-lg bg-[#010904] border border-white/5 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-[#fff1b8]">{c.title}</div>
                      <div className="text-[11px] text-[#9fbfae]">{c.issuingOrg}</div>
                    </div>
                    <span className="font-mono text-[10px] text-[#3dff8f]">{c.date}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Selected Work Portfolio Highlights */}
          {featuredProjects.length > 0 && (
            <div>
              <h3 className="text-xs font-mono font-bold text-[#f0b92e] uppercase tracking-wider mb-3">
                Selected Portfolio Projects
              </h3>
              <div className="space-y-2 text-xs">
                {featuredProjects.map((p) => (
                  <div key={p.id} className="p-2.5 rounded-lg bg-[#010904] border border-white/5">
                    <div className="font-bold text-[#fff1b8]">{p.title} ({p.category})</div>
                    <p className="text-[#9fbfae] text-[11px] mt-0.5">{p.summary}</p>
                    <div className="text-[#3dff8f] font-mono text-[10px] mt-1">Tools: {p.tools.join(', ')}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 bg-[#010904] border-t border-[rgba(240,185,46,0.3)] flex items-center justify-between gap-3 cv-print-hide">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-[#011408] bg-gradient-to-r from-[#3dff8f] to-[#2ecc71] hover:from-[#5effa5] hover:to-[#3dff8f] shadow-[0_0_14px_rgba(61,255,143,0.4)] cursor-pointer active:scale-95 transition-all"
            >
              <Printer className="w-4 h-4 text-[#011408]" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={handleDownloadCvHtml}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-[#fff1b8] bg-[#02180d] border border-[#f0b92e]/40 hover:border-[#f0b92e] cursor-pointer active:scale-95 transition-all"
              title="Download Printable CV"
            >
              <Download className="w-4 h-4 text-[#f0b92e]" />
              <span className="hidden sm:inline">Export PDF Ready File</span>
            </button>
          </div>
          <button
            onClick={onClose}
            className="px-5 sm:px-6 py-2 rounded-xl font-bold text-xs sm:text-sm text-[#1a1200] bg-gradient-to-b from-[#fff1b8] via-[#f0b92e] to-[#b8841a] hover:from-white hover:to-[#f0b92e] shadow-md cursor-pointer active:scale-95 transition-all"
          >
            Close CV
          </button>
        </div>
      </div>
    </div>
  );
};
