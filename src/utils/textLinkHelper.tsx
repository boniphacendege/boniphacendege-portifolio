/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Text and URL Link Helper
 * Parses plain text containing URLs (http://, https://) or markdown links [label](url)
 * into styled, clickable React elements.
 */

import React from 'react';
import { ExternalLink } from 'lucide-react';

export function formatTextWithLinks(text: string): React.ReactNode {
  if (!text) return null;

  // Regex to match markdown links [label](url) OR raw URLs (https?://[^\s]+)
  const regex = /\[(.*?)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s]+)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    if (match[1] && match[2]) {
      // Markdown link [label](url)
      parts.push(
        <a
          key={`md-link-${match.index}`}
          href={match[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[#3dff8f] underline underline-offset-4 hover:text-[#fff1b8] font-medium transition-colors"
        >
          <span>{match[1]}</span>
          <ExternalLink className="w-3 h-3 inline shrink-0 opacity-80" />
        </a>
      );
    } else if (match[3]) {
      // Plain URL
      const url = match[3];
      parts.push(
        <a
          key={`raw-link-${match.index}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[#3dff8f] underline underline-offset-4 hover:text-[#fff1b8] font-medium transition-colors break-all"
        >
          <span>{url}</span>
          <ExternalLink className="w-3 h-3 inline shrink-0 opacity-80" />
        </a>
      );
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}
