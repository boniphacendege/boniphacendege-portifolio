import { jsPDF } from 'jspdf';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outDir = path.resolve(__dirname, '../public/assets');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

function createBookPdf({
  filename,
  title,
  subtitle,
  category,
  price,
  pages,
  chaptersCount,
  reads,
  isbn,
  excerpt,
  chapters,
  theme = 'emerald'
}) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const GOLD = [240, 185, 46];
  const EMERALD = [15, 122, 67];
  const DARK_BG = [4, 28, 16];
  const TEXT_MUTED = [120, 140, 130];
  const TEXT_DARK = [30, 40, 35];

  // --- COVER PAGE ---
  doc.setFillColor(DARK_BG[0], DARK_BG[1], DARK_BG[2]);
  doc.rect(0, 0, 210, 297, 'F');

  doc.setDrawColor(GOLD[0], GOLD[1], GOLD[2]);
  doc.setLineWidth(1.5);
  doc.rect(12, 12, 186, 273);
  doc.setLineWidth(0.5);
  doc.rect(15, 15, 180, 267);

  // Top badge
  doc.setTextColor(GOLD[0], GOLD[1], GOLD[2]);
  doc.setFont('times', 'bold');
  doc.setFontSize(11);
  doc.text('OFFICIAL AUTHOR MASTERPIECE · BESPOKE EDITION', 105, 35, { align: 'center' });

  // Category & Ratio
  doc.setTextColor(61, 255, 143);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(`${category.toUpperCase()} · 2:3 RATIO ARCHITECTURE`, 105, 45, { align: 'center' });

  // Title
  doc.setTextColor(255, 241, 184);
  doc.setFont('times', 'bold');
  doc.setFontSize(24);
  const titleLines = doc.splitTextToSize(title.toUpperCase(), 160);
  doc.text(titleLines, 105, 95, { align: 'center' });

  // Subtitle
  doc.setTextColor(159, 191, 174);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(11);
  const subLines = doc.splitTextToSize(subtitle, 150);
  doc.text(subLines, 105, 122, { align: 'center' });

  // Divider
  doc.setDrawColor(GOLD[0], GOLD[1], GOLD[2]);
  doc.setLineWidth(0.8);
  doc.line(60, 138, 150, 138);

  // Excerpt Manifesto
  doc.setTextColor(244, 255, 248);
  doc.setFont('times', 'italic');
  doc.setFontSize(11);
  const splitQuote = doc.splitTextToSize(`“${excerpt}”`, 145);
  doc.text(splitQuote, 105, 152, { align: 'center' });

  // Author
  doc.setTextColor(GOLD[0], GOLD[1], GOLD[2]);
  doc.setFont('times', 'bold');
  doc.setFontSize(15);
  doc.text('Ev Dr. Boniphace J. Ndege', 105, 208, { align: 'center' });

  doc.setTextColor(159, 191, 174);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Author, Designer & Digital Architect · Dodoma CBD, Tanzania', 105, 216, { align: 'center' });

  // Metadata pills
  doc.setTextColor(255, 255, 255);
  doc.setFont('courier', 'normal');
  doc.setFontSize(9);
  doc.text(`Pages: ${pages}   |   Chapters: ${chaptersCount}   |   Reads: ${reads}   |   ISBN: ${isbn}`, 105, 260, { align: 'center' });
  doc.text(`Price: ${price}   |   Ndege Masterclass Press   |   Dodoma, Tanzania`, 105, 267, { align: 'center' });

  // --- PAGE 2: TABLE OF CONTENTS & CHAPTER CONTENT ---
  doc.addPage();
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, 210, 297, 'F');

  doc.setDrawColor(EMERALD[0], EMERALD[1], EMERALD[2]);
  doc.setLineWidth(0.5);
  doc.line(20, 25, 190, 25);

  doc.setTextColor(DARK_BG[0], DARK_BG[1], DARK_BG[2]);
  doc.setFont('times', 'bold');
  doc.setFontSize(18);
  doc.text('Table of Contents & Core Chapters', 20, 20);

  let currentY = 40;
  chapters.forEach((ch, idx) => {
    if (currentY > 230) {
      doc.addPage();
      currentY = 30;
      doc.setDrawColor(EMERALD[0], EMERALD[1], EMERALD[2]);
      doc.setLineWidth(0.5);
      doc.line(20, 20, 190, 20);
    }

    doc.setTextColor(EMERALD[0], EMERALD[1], EMERALD[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(`CHAPTER ${idx + 1}: ${ch.title.toUpperCase()}`, 20, currentY);

    if (ch.subtitle) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
      doc.text(ch.subtitle, 20, currentY + 5);
      currentY += 5;
    }

    doc.setFont('times', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
    const bodyLines = doc.splitTextToSize(ch.content, 170);
    doc.text(bodyLines, 20, currentY + 7, { lineHeightFactor: 1.4 });

    currentY += 12 + (bodyLines.length * 4.5);
  });

  // Colophon at end
  doc.setFont('courier', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
  doc.text(`${title} · Ev Dr. Boniphace J. Ndege · ISBN ${isbn}`, 105, 285, { align: 'center' });

  const outPath = path.resolve(outDir, filename);
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  fs.writeFileSync(outPath, pdfBuffer);
  console.log(`Saved: ${outPath} (${pdfBuffer.length} bytes)`);
}

// 1. The Architecture of Distinction
createBookPdf({
  filename: 'the-architecture-of-distinction.pdf',
  title: 'The Architecture of Distinction',
  subtitle: 'Modern UI/UX Engineering, Visual Identity & Creative AI Synergy',
  category: 'UI/UX & Web Engineering',
  price: '$18.50 USD',
  pages: 284,
  chaptersCount: 3,
  reads: 1420,
  isbn: '978-9987-04-102-3',
  excerpt: 'A comprehensive, practical manifesto on creating digital products that reject disposable generic templates in favor of bespoke craftsmanship, high-performance typography, and disciplined AI collaboration.',
  chapters: [
    {
      title: 'The Anatomy of Visual Distinction',
      subtitle: 'Why generic digital noise fails to build enduring brands',
      content: 'In an era defined by ubiquitous templates and low-effort generative algorithms, distinction has become the rarest and most valuable commodity in digital design. Every day, millions of websites launch using the same cookie-cutter layouts, identical pill-shaped buttons, and predictable gradients. Users scan past them without registering an emotional footprint. Distinction does not mean eccentricity for its own sake; rather, it is the deliberate alignment of purpose, typography, contrast, and performance.'
    },
    {
      title: 'Intentional Systems vs. Generative Artifacts',
      subtitle: 'Harnessing machine speed without surrendering artistic sovereignty',
      content: 'Artificial intelligence can generate a dozen landing page concepts in seconds, but it cannot know what your brand stands for in the hearts of your community. The craftsman views AI as a tireless apprentice rather than an artistic director. When we orchestrate generative tools within a strict design system, we dramatically compress development cycles while elevating human scrutiny.'
    },
    {
      title: 'The Mobile-First Canvas of East Africa',
      subtitle: 'Engineering for high-latency networks and mobile dominance',
      content: 'Building software for the African continent demands uncompromising performance and bandwidth stewardship. When your user is browsing on a prepaid mobile data connection in Dodoma, Dar es Salaam, or Nairobi, bloated javascript bundles and unoptimized hero images are barriers to entry. Modern distinction requires ultra-lean CSS, aggressive asset optimization, offline progressive web app capabilities, and touch targets calibrated for real-world mobile ergonomics.'
    }
  ]
});

// 2. Divine Wisdom & Strategic Leadership
createBookPdf({
  filename: 'divine-wisdom-and-strategic-leadership.pdf',
  title: 'Divine Wisdom & Strategic Leadership',
  subtitle: 'Navigating Calling, Integrity & Transformational Impact in the Digital Century',
  category: 'Spiritual Leadership & Ministry',
  price: 'Free Author Edition',
  pages: 312,
  chaptersCount: 3,
  reads: 2600,
  isbn: '978-9987-04-105-4',
  excerpt: 'A timeless spiritual and practical guide exploring how faith, ethical governance, and purposeful vision sustain leaders through cultural transformations and technological acceleration.',
  chapters: [
    {
      title: 'The Posture of the Modern Watchman',
      subtitle: 'Cultivating spiritual discernment amidst informational deluge',
      content: 'Leadership in this century cannot simply be measured by administrative efficiency or institutional size. The true leader is first a watchman—one who stands upon the spiritual ramparts, sensitive to the voice of God, and alert to the currents of culture.'
    },
    {
      title: 'The Currency of Uncompromising Integrity',
      subtitle: 'Why character is the ultimate foundation of enduring influence',
      content: 'Gifts can take you to rooms that only character can keep you in. Throughout scripture and history, leadership collapse has rarely been caused by a lack of charisma; it is almost universally a failure of private character.'
    }
  ]
});

// 3. Purpose-Driven Entrepreneurship
createBookPdf({
  filename: 'purpose-driven-entrepreneurship.pdf',
  title: 'Purpose-Driven Entrepreneurship in East Africa',
  subtitle: 'Principles, Execution & Digital Scalability for African Innovators',
  category: 'Business & African Innovation',
  price: '$15.00 USD',
  pages: 240,
  chaptersCount: 2,
  reads: 940,
  isbn: '978-9987-04-118-7',
  excerpt: 'The field-tested manual for African founders and creative professionals: unlocking domestic opportunities, executing with global quality, and creating sustainable commercial wealth.',
  chapters: [
    {
      title: 'Unlocking Domestic Opportunities with Global Standards',
      subtitle: 'Reframing local challenges as multi-million dollar platforms',
      content: 'The greatest mistake an African entrepreneur can make is to accept the lie that local markets deserve inferior standards. When you deliver world-class design, punctual communication, and rock-solid deliverables right here in Tanzania, you eliminate competition effortlessly.'
    }
  ]
});

// 4. The Gospel of Creative Excellence
createBookPdf({
  filename: 'the-gospel-of-creative-excellence.pdf',
  title: 'The Gospel of Creative Excellence',
  subtitle: 'Why Human Artistry Must Lead the Technological Renaissance',
  category: 'Creative Philosophy & AI',
  price: 'Free Author Gift',
  pages: 196,
  chaptersCount: 2,
  reads: 1820,
  isbn: '978-9987-04-122-1',
  excerpt: 'An inspiring exploration of why believers and ethical innovators should lead the technological frontier rather than retreat into skepticism, creating works of transcendent beauty.',
  chapters: [
    {
      title: 'The Theological Foundation of Design Beauty',
      subtitle: 'Why aesthetics are not trivial decorations but moral statements',
      content: 'Beauty is not a superficial veneer; it is an intrinsic reflection of divine order. When God created the heavens and the earth, He did not merely make them functional—He made them overwhelmingly beautiful.'
    }
  ]
});
