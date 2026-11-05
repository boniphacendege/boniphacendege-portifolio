/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Image Helper for Client-Side File Uploads & Aspect Ratio Detection
 * Supports automatic ratio detection, image optimization, and responsive framing:
 * 1. Square Ratios: 1:1
 * 2. Landscape (Horizontal) Ratios: 5:4, 4:3, 3:2, 16:9
 * 3. Portrait (Vertical) Ratios: 2:3, 3:4, 4:5, 5:7, 9:16
 */

export type StandardRatioId =
  | '1:1'
  | '5:4'
  | '4:3'
  | '3:2'
  | '16:9'
  | '2:3'
  | '3:4'
  | '4:5'
  | '5:7'
  | '9:16';

export type RatioCategory = 'square' | 'landscape' | 'portrait';

export interface StandardRatioDefinition {
  id: StandardRatioId;
  label: string;
  category: RatioCategory;
  width: number;
  height: number;
  value: number; // width / height
  cssRatio: string;
  description: string;
}

export const SQUARE_RATIOS: StandardRatioDefinition[] = [
  {
    id: '1:1',
    label: '1:1 Square',
    category: 'square',
    width: 1,
    height: 1,
    value: 1.0,
    cssRatio: '1 / 1',
    description: 'Instagram Feed, Avatar, Icon, Box Mockup'
  }
];

export const LANDSCAPE_RATIOS: StandardRatioDefinition[] = [
  {
    id: '5:4',
    label: '5:4 Large Format',
    category: 'landscape',
    width: 5,
    height: 4,
    value: 5 / 4, // 1.25
    cssRatio: '5 / 4',
    description: 'Classic art print & compact horizontal display'
  },
  {
    id: '4:3',
    label: '4:3 Standard Display',
    category: 'landscape',
    width: 4,
    height: 3,
    value: 4 / 3, // 1.3333
    cssRatio: '4 / 3',
    description: 'Tablet, UI mockups, desktop screenshots'
  },
  {
    id: '3:2',
    label: '3:2 Photography',
    category: 'landscape',
    width: 3,
    height: 2,
    value: 3 / 2, // 1.5
    cssRatio: '3 / 2',
    description: 'Standard 35mm photography & editorial spreads'
  },
  {
    id: '16:9',
    label: '16:9 Widescreen',
    category: 'landscape',
    width: 16,
    height: 9,
    value: 16 / 9, // 1.7778
    cssRatio: '16 / 9',
    description: 'Modern HD video, web banners & desktop showcases'
  }
];

export const PORTRAIT_RATIOS: StandardRatioDefinition[] = [
  {
    id: '4:5',
    label: '4:5 Social Portrait',
    category: 'portrait',
    width: 4,
    height: 5,
    value: 4 / 5, // 0.8
    cssRatio: '4 / 5',
    description: 'Instagram portrait post & digital posters'
  },
  {
    id: '3:4',
    label: '3:4 Medium Portrait',
    category: 'portrait',
    width: 3,
    height: 4,
    value: 3 / 4, // 0.75
    cssRatio: '3 / 4',
    description: 'Book covers, tablet portraits & flyers'
  },
  {
    id: '5:7',
    label: '5:7 Editorial Poster',
    category: 'portrait',
    width: 5,
    height: 7,
    value: 5 / 7, // ~0.7143
    cssRatio: '5 / 7',
    description: 'Print posters, invitations & editorial layouts'
  },
  {
    id: '2:3',
    label: '2:3 Classic Portrait',
    category: 'portrait',
    width: 2,
    height: 3,
    value: 2 / 3, // ~0.6667
    cssRatio: '2 / 3',
    description: 'Standard vertical photography & standup banners'
  },
  {
    id: '9:16',
    label: '9:16 Vertical Story / Mobile',
    category: 'portrait',
    width: 9,
    height: 16,
    value: 9 / 16, // 0.5625
    cssRatio: '9 / 16',
    description: 'Mobile phone screen, TikTok, Reels, Stories'
  }
];

export const ALL_STANDARD_RATIOS: StandardRatioDefinition[] = [
  ...SQUARE_RATIOS,
  ...LANDSCAPE_RATIOS,
  ...PORTRAIT_RATIOS
];

export interface DetectedRatioInfo {
  ratioId: StandardRatioId;
  label: string;
  category: RatioCategory;
  width: number;
  height: number;
  actualRatio: number;
  cssRatio: string;
  definition: StandardRatioDefinition;
}

/**
 * Automatically detects the closest standard ratio for given width and height dimensions.
 * Uses logarithmic distance comparison for mathematically balanced matching.
 */
export function detectStandardAspectRatio(width: number, height: number): DetectedRatioInfo {
  if (!width || !height || width <= 0 || height <= 0) {
    const defaultDef = SQUARE_RATIOS[0];
    return {
      ratioId: defaultDef.id,
      label: defaultDef.label,
      category: defaultDef.category,
      width: 1,
      height: 1,
      actualRatio: 1.0,
      cssRatio: defaultDef.cssRatio,
      definition: defaultDef
    };
  }

  const actualRatio = width / height;

  let bestMatch = ALL_STANDARD_RATIOS[0];
  let minDifference = Infinity;

  for (const item of ALL_STANDARD_RATIOS) {
    // Logarithmic ratio difference |log(actual / target)| measures relative distortion accurately
    const diff = Math.abs(Math.log(actualRatio / item.value));
    if (diff < minDifference) {
      minDifference = diff;
      bestMatch = item;
    }
  }

  return {
    ratioId: bestMatch.id,
    label: bestMatch.label,
    category: bestMatch.category,
    width,
    height,
    actualRatio,
    cssRatio: bestMatch.cssRatio,
    definition: bestMatch
  };
}

/**
 * Returns clean CSS aspect-ratio value (e.g. "16 / 9", "3 / 4", "1 / 1")
 */
export function getCssAspectRatio(ratio?: string): string {
  if (!ratio) return '1 / 1';
  const match = ALL_STANDARD_RATIOS.find((r) => r.id === ratio.trim());
  if (match) return match.cssRatio;

  // Handle slash formats like "16/9"
  if (ratio.includes('/')) {
    const parts = ratio.split('/').map((p) => p.trim());
    if (parts.length === 2 && !isNaN(Number(parts[0])) && !isNaN(Number(parts[1]))) {
      return `${parts[0]} / ${parts[1]}`;
    }
  }

  // Handle colon formats like "16:9"
  if (ratio.includes(':')) {
    const parts = ratio.split(':').map((p) => p.trim());
    if (parts.length === 2 && !isNaN(Number(parts[0])) && !isNaN(Number(parts[1]))) {
      return `${parts[0]} / ${parts[1]}`;
    }
  }

  return '1 / 1';
}

/**
 * Detect image dimensions and ratio from an existing URL or Data URL
 */
export function detectImageDimensionsAndRatio(src: string): Promise<DetectedRatioInfo> {
  return new Promise((resolve) => {
    if (!src) {
      resolve(detectStandardAspectRatio(1, 1));
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const result = detectStandardAspectRatio(img.naturalWidth, img.naturalHeight);
      resolve(result);
    };

    img.onerror = () => {
      resolve(detectStandardAspectRatio(1, 1));
    };

    img.src = src;
  });
}

/**
 * Process a project image file, preserving its natural aspect ratio
 * and detecting its optimal standard aspect ratio.
 */
export interface ProcessedProjectImage {
  dataUrl: string;
  width: number;
  height: number;
  detectedRatio: StandardRatioId;
  category: RatioCategory;
  label: string;
  cssRatio: string;
}

export const processProjectImageFile = async (
  file: File,
  maxDimension = 1200,
  quality = 0.88
): Promise<ProcessedProjectImage> => {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif', 'image/jpg'];
  if (!validTypes.includes(file.type.toLowerCase())) {
    throw new Error('Unsupported image format. Please upload JPEG, PNG, WebP, or SVG.');
  }

  // If SVG, read as raw Data URL directly
  if (file.type === 'image/svg+xml') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const img = new Image();
        img.onload = () => {
          const ratioInfo = detectStandardAspectRatio(img.naturalWidth || 800, img.naturalHeight || 800);
          resolve({
            dataUrl,
            width: img.naturalWidth || 800,
            height: img.naturalHeight || 800,
            detectedRatio: ratioInfo.ratioId,
            category: ratioInfo.category,
            label: ratioInfo.label,
            cssRatio: ratioInfo.cssRatio
          });
        };
        img.onerror = () => {
          const ratioInfo = detectStandardAspectRatio(1, 1);
          resolve({
            dataUrl,
            width: 800,
            height: 800,
            detectedRatio: ratioInfo.ratioId,
            category: ratioInfo.category,
            label: ratioInfo.label,
            cssRatio: ratioInfo.cssRatio
          });
        };
        img.src = dataUrl;
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const origWidth = img.naturalWidth || img.width;
        const origHeight = img.naturalHeight || img.height;

        const ratioInfo = detectStandardAspectRatio(origWidth, origHeight);

        // Resize down proportionally if either dimension exceeds maxDimension
        let targetWidth = origWidth;
        let targetHeight = origHeight;

        if (targetWidth > maxDimension || targetHeight > maxDimension) {
          if (targetWidth >= targetHeight) {
            targetHeight = Math.round((targetHeight * maxDimension) / targetWidth);
            targetWidth = maxDimension;
          } else {
            targetWidth = Math.round((targetWidth * maxDimension) / targetHeight);
            targetHeight = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({
            dataUrl: e.target?.result as string,
            width: origWidth,
            height: origHeight,
            detectedRatio: ratioInfo.ratioId,
            category: ratioInfo.category,
            label: ratioInfo.label,
            cssRatio: ratioInfo.cssRatio
          });
          return;
        }

        // Draw image keeping original natural ratio
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        // Export as WebP for optimal performance, fallback to JPEG/PNG
        let dataUrl = '';
        try {
          const webpData = canvas.toDataURL('image/webp', quality);
          if (webpData.startsWith('data:image/webp') && webpData.length > 50) {
            dataUrl = webpData;
          }
        } catch {}

        if (!dataUrl) {
          const isPng = file.type === 'image/png';
          const fallbackFormat = isPng ? 'image/png' : 'image/jpeg';
          dataUrl = canvas.toDataURL(fallbackFormat, quality);
        }

        resolve({
          dataUrl,
          width: targetWidth,
          height: targetHeight,
          detectedRatio: ratioInfo.ratioId,
          category: ratioInfo.category,
          label: ratioInfo.label,
          cssRatio: ratioInfo.cssRatio
        });
      };
      img.onerror = () => reject(new Error('Failed to decode image file.'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file from disk.'));
    reader.readAsDataURL(file);
  });
};

/**
 * General purpose image processor (backward compatibility)
 */
export const processImageFile = async (
  file: File,
  maxWidth = 800,
  maxHeight = 800,
  quality = 0.85,
  cropSquare = false
): Promise<string> => {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif', 'image/jpg'];
  if (!validTypes.includes(file.type.toLowerCase())) {
    throw new Error('Unsupported image format. Please upload JPEG, PNG, WebP, or SVG.');
  }

  if (file.type === 'image/svg+xml') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');

        if (cropSquare) {
          const minDim = Math.min(img.width, img.height);
          const sx = (img.width - minDim) / 2;
          const sy = (img.height - minDim) / 2;
          const targetSize = Math.min(minDim, maxWidth);
          canvas.width = targetSize;
          canvas.height = targetSize;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }
          ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, targetSize, targetSize);
        } else {
          let width = img.width;
          let height = img.height;

          if (width > maxWidth || height > maxHeight) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
        }

        try {
          const webpData = canvas.toDataURL('image/webp', quality);
          if (webpData.startsWith('data:image/webp') && webpData.length > 50) {
            resolve(webpData);
            return;
          }
        } catch {}

        const isPng = file.type === 'image/png';
        const fallbackFormat = isPng ? 'image/png' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(fallbackFormat, quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Failed to decode image file.'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file from disk.'));
    reader.readAsDataURL(file);
  });
};

/**
 * Ensures a book cover image URL is formatted with 2:3 aspect ratio (e.g. Unsplash w=900&h=1350)
 */
export function formatTwoByThreeBookCover(url: string): string {
  if (!url) return url;
  if (url.includes('images.unsplash.com')) {
    try {
      const parsed = new URL(url);
      parsed.searchParams.set('w', '900');
      // Reduced ratio: 900 x 1296 (~1:1.44 trade paperback ratio, slightly reduced from 1:1.5)
      parsed.searchParams.set('h', '1296');
      parsed.searchParams.set('fit', 'crop');
      if (!parsed.searchParams.has('auto')) {
        parsed.searchParams.set('auto', 'format');
      }
      return parsed.toString();
    } catch {
      if (url.includes('w=900') && !url.includes('h=1296')) {
        return url.replace('w=900', 'w=900&h=1296&fit=crop');
      }
      return url;
    }
  }
  return url;
}

/**
 * Returns the uncropped, complete book cover URL preserving the entire artwork
 * without destructive crop clipping.
 */
export function getFullBookCoverUrl(url: string): string {
  if (!url) return url;
  if (url.includes('images.unsplash.com')) {
    try {
      const parsed = new URL(url);
      parsed.searchParams.delete('fit');
      parsed.searchParams.set('w', '1200');
      if (!parsed.searchParams.has('auto')) {
        parsed.searchParams.set('auto', 'format');
      }
      return parsed.toString();
    } catch {
      return url.replace('&fit=crop', '').replace('fit=crop&', '');
    }
  }
  return url;
}

/**
 * Automatically formats book front cover artwork into the reduced Trade 1:1.44 ratio
 * (900 x 1296), producing a high-resolution canvas with 3D spine boundary awareness
 * and generating an optimized WebP/JPEG blob ready for instant Firebase Storage upload.
 */
export async function processTradeRatioBookCoverFile(
  file: File,
  targetWidth = 900,
  targetHeight = 1296,
  quality = 0.90
): Promise<{ dataUrl: string; blob: Blob }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas rendering context not available'));
          return;
        }

        // Draw image covering the 1:1.44 frame (centered cover crop)
        const targetRatio = targetWidth / targetHeight; // 900 / 1296 = 0.6944
        const imgRatio = img.naturalWidth / img.naturalHeight;

        let srcX = 0;
        let srcY = 0;
        let srcW = img.naturalWidth;
        let srcH = img.naturalHeight;

        if (imgRatio > targetRatio) {
          // Source is wider than 1:1.44: crop horizontal sides equally
          srcW = img.naturalHeight * targetRatio;
          srcX = (img.naturalWidth - srcW) / 2;
        } else {
          // Source is taller than 1:1.44: crop top/bottom equally
          srcH = img.naturalWidth / targetRatio;
          srcY = (img.naturalHeight - srcH) / 2;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, targetWidth, targetHeight);

        const isPng = file.type === 'image/png';
        const mimeType = isPng ? 'image/png' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(mimeType, quality);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve({ dataUrl, blob });
            } else {
              fetch(dataUrl)
                .then((r) => r.blob())
                .then((b) => resolve({ dataUrl, blob: b }))
                .catch(() => reject(new Error('Failed to create image blob')));
            }
          },
          mimeType,
          quality
        );
      };
      img.onerror = () => reject(new Error('Failed to decode image file for cover formatting.'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file from disk.'));
    reader.readAsDataURL(file);
  });
}


