/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Project Case Study Summary PDF Generator
 * Creates an executive-grade, beautifully styled PDF summary for portfolio projects.
 */

import { jsPDF } from 'jspdf';
import { ProjectItem } from '../data/portfolioStorage';

export function generateProjectSummaryPdf(project: ProjectItem): boolean {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 16;
    const contentWidth = pageWidth - margin * 2;

    // Palette
    const DARK_BG = [3, 20, 11]; // Deep emerald black #03140b
    const GOLD = [240, 185, 46]; // Vibrant gold #f0b92e
    const EMERALD_NEON = [61, 255, 143]; // Neon green #3dff8f
    const TEXT_LIGHT = [244, 255, 248]; // White-mint #f4fff8
    const TEXT_MUTED = [140, 168, 153]; // Muted sage #8ca899
    const ACCENT_BORDER = [24, 72, 45]; // Dark green border
    const CARD_BG = [6, 32, 19]; // Subtle dark card background

    let currentY = margin;

    const checkPageBreak = (neededHeight: number) => {
      if (currentY + neededHeight > pageHeight - 20) {
        doc.addPage();
        drawPageBorder();
        currentY = margin + 8;
      }
    };

    const drawPageBorder = () => {
      // Outer subtle decorative border
      doc.setDrawColor(GOLD[0], GOLD[1], GOLD[2]);
      doc.setLineWidth(0.6);
      doc.rect(8, 8, pageWidth - 16, pageHeight - 16);

      doc.setDrawColor(EMERALD_NEON[0], EMERALD_NEON[1], EMERALD_NEON[2]);
      doc.setLineWidth(0.2);
      doc.rect(9.5, 9.5, pageWidth - 19, pageHeight - 19);

      // Header top corner accents
      doc.setFillColor(GOLD[0], GOLD[1], GOLD[2]);
      doc.circle(8, 8, 1.2, 'F');
      doc.circle(pageWidth - 8, 8, 1.2, 'F');
      doc.circle(8, pageHeight - 8, 1.2, 'F');
      doc.circle(pageWidth - 8, pageHeight - 8, 1.2, 'F');
    };

    // Draw first page border
    drawPageBorder();

    // --- TOP BANNER / BRAND HEADER ---
    doc.setFillColor(DARK_BG[0], DARK_BG[1], DARK_BG[2]);
    doc.rect(margin, currentY, contentWidth, 26, 'F');
    doc.setDrawColor(GOLD[0], GOLD[1], GOLD[2]);
    doc.setLineWidth(0.8);
    doc.rect(margin, currentY, contentWidth, 26, 'S');

    // Brand Name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(GOLD[0], GOLD[1], GOLD[2]);
    doc.text('BONIPHACE NDEGE', margin + 6, currentY + 9);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(EMERALD_NEON[0], EMERALD_NEON[1], EMERALD_NEON[2]);
    doc.text('GRAPHIC DESIGNER · WEBSITE DESIGNER & DEVELOPER · DIGITAL CONTENT CREATOR', margin + 6, currentY + 16);

    doc.setFontSize(7.5);
    doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
    doc.text('Dodoma CBD, Tanzania · drboniphacendege@gmail.com · +255 765 326 515', margin + 6, currentY + 22);

    // Right-aligned Document Label Badge
    doc.setFillColor(10, 50, 28);
    doc.roundedRect(pageWidth - margin - 52, currentY + 5, 46, 16, 2, 2, 'F');
    doc.setDrawColor(EMERALD_NEON[0], EMERALD_NEON[1], EMERALD_NEON[2]);
    doc.setLineWidth(0.3);
    doc.roundedRect(pageWidth - margin - 52, currentY + 5, 46, 16, 2, 2, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(EMERALD_NEON[0], EMERALD_NEON[1], EMERALD_NEON[2]);
    doc.text('PROJECT CASE STUDY', pageWidth - margin - 29, currentY + 12, { align: 'center' });
    doc.setFontSize(6.5);
    doc.setTextColor(GOLD[0], GOLD[1], GOLD[2]);
    doc.text('VERIFIED SUMMARY', pageWidth - margin - 29, currentY + 17, { align: 'center' });

    currentY += 31;

    // --- PROJECT TITLE & KEY HIGHLIGHTS ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(17);
    doc.setTextColor(15, 60, 35);
    const titleLines = doc.splitTextToSize(project.title, contentWidth);
    doc.text(titleLines, margin, currentY);
    currentY += titleLines.length * 7.5 + 2;

    // Metadata Grid Box (Role, Status, Category, Delivered, Client)
    const metaBoxHeight = 22;
    doc.setFillColor(CARD_BG[0], CARD_BG[1], CARD_BG[2]);
    doc.roundedRect(margin, currentY, contentWidth, metaBoxHeight, 2, 2, 'F');
    doc.setDrawColor(ACCENT_BORDER[0], ACCENT_BORDER[1], ACCENT_BORDER[2]);
    doc.setLineWidth(0.4);
    doc.roundedRect(margin, currentY, contentWidth, metaBoxHeight, 2, 2, 'S');

    const colWidth = contentWidth / 4;
    const metaY = currentY + 6;

    // Col 1: Category
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(GOLD[0], GOLD[1], GOLD[2]);
    doc.text('CATEGORY', margin + 5, metaY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(TEXT_LIGHT[0], TEXT_LIGHT[1], TEXT_LIGHT[2]);
    doc.text(project.category || 'General', margin + 5, metaY + 6);

    // Col 2: Role
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(GOLD[0], GOLD[1], GOLD[2]);
    doc.text('ROLE', margin + colWidth + 2, metaY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(TEXT_LIGHT[0], TEXT_LIGHT[1], TEXT_LIGHT[2]);
    const roleText = (project.role || 'Lead Designer & Developer').substring(0, 24);
    doc.text(roleText, margin + colWidth + 2, metaY + 6);

    // Col 3: Status
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(GOLD[0], GOLD[1], GOLD[2]);
    doc.text('STATUS', margin + colWidth * 2 + 2, metaY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(EMERALD_NEON[0], EMERALD_NEON[1], EMERALD_NEON[2]);
    doc.text((project.status || 'Completed').toUpperCase().replace('_', ' '), margin + colWidth * 2 + 2, metaY + 6);

    // Col 4: Timeline / Delivery
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(GOLD[0], GOLD[1], GOLD[2]);
    doc.text('DURATION / DELIVERY', margin + colWidth * 3 + 2, metaY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(TEXT_LIGHT[0], TEXT_LIGHT[1], TEXT_LIGHT[2]);
    const timelineText = project.completionDate || (project.startDate ? `${project.startDate} - Active` : '4-6 Weeks Sprint');
    doc.text(timelineText, margin + colWidth * 3 + 2, metaY + 6);

    // Subtle second line in metadata box for Client & Project Type
    const subMetaY = metaY + 11;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
    const clientStr = project.clientName ? `Client: ${project.clientName} · ` : '';
    const typeStr = `Type: ${(project.projectType || 'Client Project').toUpperCase()}`;
    doc.text(`${clientStr}${typeStr}`, margin + 5, subMetaY);

    currentY += metaBoxHeight + 8;

    // --- VISUAL TIMELINE & PROJECT PHASES SECTION ---
    checkPageBreak(38);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 60, 35);
    doc.text('PROJECT LIFECYCLE & PHASES TIMELINE', margin, currentY);
    currentY += 4;

    const timelineBoxHeight = 24;
    doc.setFillColor(248, 252, 249);
    doc.roundedRect(margin, currentY, contentWidth, timelineBoxHeight, 2, 2, 'F');
    doc.setDrawColor(200, 220, 208);
    doc.setLineWidth(0.4);
    doc.roundedRect(margin, currentY, contentWidth, timelineBoxHeight, 2, 2, 'S');

    // Horizontal Progress bar line
    const pLineY = currentY + 7;
    doc.setDrawColor(215, 230, 220);
    doc.setLineWidth(1.5);
    doc.line(margin + 16, pLineY, margin + contentWidth - 16, pLineY);

    // Active progress line (full length for completed)
    doc.setDrawColor(EMERALD_NEON[0], 180, 100);
    doc.setLineWidth(1.8);
    const progressFactor = project.status === 'completed' ? 1 : project.status === 'in_progress' ? 0.75 : 0.5;
    doc.line(margin + 16, pLineY, margin + 16 + (contentWidth - 32) * progressFactor, pLineY);

    // 4 Phase milestones
    const phases = [
      { num: '1', title: 'Discovery', desc: 'Strategy & Brief' },
      { num: '2', title: 'Design', desc: 'Wireframes & UI' },
      { num: '3', title: 'Development', desc: 'Code & AI Assets' },
      { num: '4', title: 'Launch', desc: 'QA & Deployment' },
    ];

    const phaseStep = (contentWidth - 32) / 3;
    phases.forEach((p, idx) => {
      const nodeX = margin + 16 + idx * phaseStep;
      
      // Node circle
      doc.setFillColor(15, 122, 67);
      doc.circle(nodeX, pLineY, 3, 'F');
      doc.setDrawColor(GOLD[0], GOLD[1], GOLD[2]);
      doc.setLineWidth(0.5);
      doc.circle(nodeX, pLineY, 3, 'S');

      // Node number inside circle
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
      doc.setTextColor(255, 255, 255);
      doc.text(p.num, nodeX, pLineY + 1.8, { align: 'center' });

      // Title & Subtitle below
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(20, 45, 30);
      doc.text(p.title, nodeX, currentY + 15, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(100, 125, 110);
      doc.text(p.desc, nodeX, currentY + 19, { align: 'center' });
    });

    currentY += timelineBoxHeight + 8;

    // --- EXECUTIVE OVERVIEW ---
    checkPageBreak(30);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 60, 35);
    doc.text('EXECUTIVE SUMMARY & CONTEXT', margin, currentY);
    currentY += 4.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(40, 55, 45);

    const fullDesc = project.fullDescription || project.summary || 'Professional project delivered with distinction.';
    const overviewLines = doc.splitTextToSize(fullDesc, contentWidth);
    doc.text(overviewLines, margin, currentY);
    currentY += overviewLines.length * 4.6 + 6;

    // --- PROCESS BREAKDOWN (CHALLENGE, SOLUTION, OUTCOME) ---
    if (project.mainChallenge || project.solution || project.outcome) {
      checkPageBreak(40);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(15, 60, 35);
      doc.text('STRATEGIC PROBLEM SOLVING & RESULTS', margin, currentY);
      currentY += 4.5;

      const items = [
        { label: 'THE CHALLENGE', text: project.mainChallenge, color: [180, 110, 10] },
        { label: 'THE SOLUTION', text: project.solution, color: [15, 122, 67] },
        { label: 'KEY OUTCOME & IMPACT', text: project.outcome, color: [190, 140, 20] }
      ].filter(i => Boolean(i.text));

      items.forEach((item) => {
        checkPageBreak(18);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(item.color[0], item.color[1], item.color[2]);
        doc.text(`• ${item.label}`, margin, currentY);
        currentY += 3.8;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(50, 65, 55);
        const wrapped = doc.splitTextToSize(item.text || '', contentWidth - 4);
        doc.text(wrapped, margin + 4, currentY);
        currentY += wrapped.length * 4.2 + 3.5;
      });
      currentY += 2;
    }

    // --- TOOLS & TECHNOLOGIES USED ---
    if (project.tools && project.tools.length > 0) {
      checkPageBreak(22);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 60, 35);
      doc.text('TECHNOLOGIES & CREATIVE SUITE', margin, currentY);
      currentY += 4;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(40, 60, 50);
      const toolsString = project.tools.join('  ·  ');
      const toolLines = doc.splitTextToSize(toolsString, contentWidth);
      doc.text(toolLines, margin, currentY);
      currentY += toolLines.length * 4.5 + 4;
    }

    // --- AI-ASSISTED WORKFLOW INTEGRATION (IF USED) ---
    if (project.aiUsed && project.aiUsed.length > 0) {
      checkPageBreak(22);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(170, 120, 15);
      doc.text('AI-ASSISTED WORKFLOW INTEGRATION', margin, currentY);
      currentY += 4;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(60, 75, 65);
      const aiString = project.aiUsed.join('  ·  ');
      const aiLines = doc.splitTextToSize(aiString, contentWidth);
      doc.text(aiLines, margin, currentY);
      currentY += aiLines.length * 4.5 + 4;
    }

    // --- DOCUMENT VERIFICATION FOOTER ---
    checkPageBreak(24);
    const footerY = Math.max(currentY + 4, pageHeight - margin - 14);

    doc.setFillColor(DARK_BG[0], DARK_BG[1], DARK_BG[2]);
    doc.rect(margin, footerY, contentWidth, 12, 'F');
    doc.setDrawColor(GOLD[0], GOLD[1], GOLD[2]);
    doc.setLineWidth(0.4);
    doc.rect(margin, footerY, contentWidth, 12, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(GOLD[0], GOLD[1], GOLD[2]);
    doc.text('EV DR. BONIPHACE J. NDEGE · PORTFOLIO VERIFICATION', margin + 4, footerY + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(EMERALD_NEON[0], EMERALD_NEON[1], EMERALD_NEON[2]);
    doc.text(`Official Document Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} · https://boniphacendege.com`, margin + 4, footerY + 9);

    // Save PDF file
    const safeTitle = (project.title || 'Project')
      .replace(/[^a-zA-Z0-9]/g, '_')
      .replace(/_+/g, '_')
      .substring(0, 36);
    doc.save(`${safeTitle}_Summary.pdf`);
    return true;
  } catch (error) {
    console.error('Error generating project summary PDF:', error);
    return false;
  }
}
