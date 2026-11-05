/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * EPUB Generation Utility
 * Generates genuine, fully compliant EPUB publications on the fly for
 * e-readers (Apple Books, Google Play Books, Kobo, Moon+ Reader, Calibre).
 */

import JSZip from 'jszip';
import { BookItem } from '../data/portfolioStorage';

export async function downloadBookAsEpub(book: BookItem): Promise<void> {
  const zip = new JSZip();

  // 1. mimetype file must be the first file and uncompressed
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });

  // 2. META-INF/container.xml
  const containerXml = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;
  zip.file('META-INF/container.xml', containerXml);

  // Chapters & Items
  const chapters = book.chapters && book.chapters.length > 0 ? book.chapters : [
    {
      id: 'chap-1',
      chapterNumber: 1,
      title: 'Introduction & Key Principles',
      subtitle: 'The foundational principles of this volume',
      content: book.excerpt || book.description
    }
  ];

  const bookId = book.isbn || `urn:uuid:${book.slug || book.id}`;
  const authorName = book.author?.name || 'Ev Dr. Boniphace J. Ndege';
  const publisherName = book.publisher || 'Ndege Masterclass Press, Dodoma';

  // 3. Title Page XHTML
  const titleXhtml = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="en" lang="en">
<head>
  <title>${escapeXml(book.title)}</title>
  <style>
    body { font-family: Georgia, serif; margin: 5%; color: #111; line-height: 1.6; text-align: center; }
    .badge { font-family: monospace; font-size: 0.8em; text-transform: uppercase; color: #0f7a43; letter-spacing: 2px; }
    h1 { font-size: 2.2em; margin: 0.5em 0 0.2em; color: #02180d; }
    h2 { font-size: 1.2em; font-weight: normal; font-style: italic; color: #555; margin-bottom: 2em; }
    .author { font-size: 1.3em; font-weight: bold; margin-top: 2em; color: #000; }
    .meta { font-family: monospace; font-size: 0.85em; color: #777; margin-top: 3em; }
  </style>
</head>
<body>
  <div class="badge">${escapeXml(book.category)} · OFFICIAL EDITION</div>
  <h1>${escapeXml(book.title)}</h1>
  ${book.subtitle ? `<h2>${escapeXml(book.subtitle)}</h2>` : ''}
  <p class="author">By ${escapeXml(authorName)}</p>
  <div class="meta">
    <p>Publisher: ${escapeXml(publisherName)}</p>
    <p>ISBN: ${escapeXml(book.isbn || 'Available')}</p>
    <p>Published: ${new Date(book.publishedAt).getFullYear()}</p>
    <p>Dodoma CBD, Tanzania</p>
  </div>
</body>
</html>`;
  zip.file('OEBPS/title.xhtml', titleXhtml);

  // 4. Preface / Excerpt Page
  const prefaceXhtml = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="en" lang="en">
<head>
  <title>Preface &amp; Overview</title>
  <style>
    body { font-family: Georgia, serif; margin: 5%; color: #222; line-height: 1.7; }
    h2 { font-size: 1.6em; border-bottom: 1px solid #ccc; padding-bottom: 0.3em; color: #0f7a43; }
    blockquote { font-style: italic; border-left: 3px solid #0f7a43; margin: 1.5em 0; padding-left: 1em; color: #444; }
  </style>
</head>
<body>
  <h2>Author Preface &amp; Overview</h2>
  <blockquote>&ldquo;${escapeXml(book.excerpt)}&rdquo;</blockquote>
  <p>${escapeXml(book.description)}</p>
  <p style="margin-top: 2em; font-style: italic; text-align: right;">— ${escapeXml(authorName)}</p>
</body>
</html>`;
  zip.file('OEBPS/preface.xhtml', prefaceXhtml);

  // 5. Chapters XHTML
  chapters.forEach((chap, idx) => {
    const chapNum = chap.chapterNumber || idx + 1;
    const paragraphs = chap.content.split('\n\n').map(p => `<p>${escapeXml(p.trim())}</p>`).join('\n');
    const chapXhtml = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="en" lang="en">
<head>
  <title>Chapter ${chapNum}: ${escapeXml(chap.title)}</title>
  <style>
    body { font-family: Georgia, serif; margin: 5%; color: #1a1a1a; line-height: 1.75; }
    .chap-num { font-family: monospace; font-size: 0.85em; text-transform: uppercase; color: #0f7a43; font-weight: bold; }
    h1 { font-size: 1.8em; margin: 0.2em 0 0.1em; color: #02180d; }
    .subtitle { font-size: 1.05em; font-style: italic; color: #666; margin-bottom: 1.5em; }
    p { margin-bottom: 1.2em; text-indent: 1.5em; text-align: justify; }
    p:first-of-type { text-indent: 0; }
  </style>
</head>
<body>
  <div class="chap-num">Chapter ${chapNum}</div>
  <h1>${escapeXml(chap.title)}</h1>
  ${chap.subtitle ? `<div class="subtitle">${escapeXml(chap.subtitle)}</div>` : ''}
  <div class="content">
    ${paragraphs}
  </div>
</body>
</html>`;
    zip.file(`OEBPS/chap_${chapNum}.xhtml`, chapXhtml);
  });

  // 6. Navigation Document (nav.xhtml for EPUB 3)
  const navList = chapters.map((c, i) => {
    const num = c.chapterNumber || i + 1;
    return `<li><a href="chap_${num}.xhtml">Chapter ${num}: ${escapeXml(c.title)}</a></li>`;
  }).join('\n');

  const navXhtml = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="en" lang="en">
<head>
  <title>Table of Contents</title>
</head>
<body>
  <nav epub:type="toc" id="toc">
    <h1>Table of Contents</h1>
    <ol>
      <li><a href="title.xhtml">Title Page</a></li>
      <li><a href="preface.xhtml">Preface &amp; Overview</a></li>
      ${navList}
    </ol>
  </nav>
</body>
</html>`;
  zip.file('OEBPS/nav.xhtml', navXhtml);

  // 7. NCX (toc.ncx for EPUB 2 backward compatibility)
  const ncxNav = chapters.map((c, i) => {
    const num = c.chapterNumber || i + 1;
    return `
    <navPoint id="navPoint-${i + 3}" playOrder="${i + 3}">
      <navLabel><text>Chapter ${num}: ${escapeXml(c.title)}</text></navLabel>
      <content src="chap_${num}.xhtml"/>
    </navPoint>`;
  }).join('');

  const tocNcx = `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="${escapeXml(bookId)}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle><text>${escapeXml(book.title)}</text></docTitle>
  <docAuthor><text>${escapeXml(authorName)}</text></docAuthor>
  <navMap>
    <navPoint id="navPoint-1" playOrder="1">
      <navLabel><text>Title Page</text></navLabel>
      <content src="title.xhtml"/>
    </navPoint>
    <navPoint id="navPoint-2" playOrder="2">
      <navLabel><text>Preface</text></navLabel>
      <content src="preface.xhtml"/>
    </navPoint>
    ${ncxNav}
  </navMap>
</ncx>`;
  zip.file('OEBPS/toc.ncx', tocNcx);

  // 8. OEBPS/content.opf
  const manifestItems = [
    `<item id="toc-ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>`,
    `<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>`,
    `<item id="title-page" href="title.xhtml" media-type="application/xhtml+xml"/>`,
    `<item id="preface-page" href="preface.xhtml" media-type="application/xhtml+xml"/>`,
    ...chapters.map((c, i) => {
      const num = c.chapterNumber || i + 1;
      return `<item id="chap-${num}" href="chap_${num}.xhtml" media-type="application/xhtml+xml"/>`;
    })
  ].join('\n    ');

  const spineItems = [
    `<itemref idref="title-page"/>`,
    `<itemref idref="preface-page"/>`,
    ...chapters.map((c, i) => {
      const num = c.chapterNumber || i + 1;
      return `<itemref idref="chap-${num}"/>`;
    })
  ].join('\n    ');

  const contentOpf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookID" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>${escapeXml(book.title)}</dc:title>
    <dc:creator id="creator">${escapeXml(authorName)}</dc:creator>
    <dc:identifier id="BookID">${escapeXml(bookId)}</dc:identifier>
    <dc:language>${escapeXml(book.language ? book.language.toLowerCase().slice(0, 2) : 'en')}</dc:language>
    <dc:publisher>${escapeXml(publisherName)}</dc:publisher>
    <dc:description>${escapeXml(book.excerpt || book.description)}</dc:description>
    <dc:subject>${escapeXml(book.category)}</dc:subject>
    <meta property="dcterms:modified">${new Date().toISOString().replace(/\.\d+Z$/, 'Z')}</meta>
  </metadata>
  <manifest>
    ${manifestItems}
  </manifest>
  <spine toc="toc-ncx">
    ${spineItems}
  </spine>
</package>`;
  zip.file('OEBPS/content.opf', contentOpf);

  // 9. Generate the Blob
  const blob = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/epub+zip',
    compression: 'DEFLATE'
  });

  // 10. Trigger browser download
  const cleanName = (book.slug || book.title)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const fileName = `${cleanName || 'publication'}.epub`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function escapeXml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
