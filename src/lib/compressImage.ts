/**
 * Client-side image compression utility.
 *
 * Resizes large images to a maximum width and re-encodes them as JPEG,
 * dramatically reducing the base64 payload sent to the AI scanning endpoint.
 * Non-image files (e.g. PDFs) are returned unchanged.
 */

const DEFAULT_MAX_WIDTH = 768;
const DEFAULT_QUALITY = 0.75;

export async function compressImage(
  file: File,
  maxWidth: number = DEFAULT_MAX_WIDTH,
  quality: number = DEFAULT_QUALITY,
): Promise<File> {
  const ext = file.name.split('.').pop()?.toLowerCase();

  // Only compress raster images; PDFs and others pass through unchanged
  if (!['jpg', 'jpeg', 'png', 'webp', 'bmp', 'gif'].includes(ext ?? '')) {
    return file;
  }

  // Create an object URL so we can draw the image onto a canvas
  const objectUrl = URL.createObjectURL(file);

  try {
    const img = await loadImage(objectUrl);

    // If the image is already small enough, skip compression
    if (img.width <= maxWidth && ext !== 'png') {
      return file;
    }

    // Calculate scaled dimensions preserving aspect ratio
    const scale = img.width > maxWidth ? maxWidth / img.width : 1;
    const targetWidth = Math.round(img.width * scale);
    const targetHeight = Math.round(img.height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      // Canvas not supported (unlikely in modern browsers) — return original
      return file;
    }

    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

    const blob = await canvasToBlob(canvas, 'image/jpeg', quality);

    // Create a new File with a .jpg extension
    const newName = file.name.replace(/\.[^.]+$/, '.jpg');
    const compressed = new File([blob], newName, {
      type: 'image/jpeg',
      lastModified: Date.now(),
    });

    console.log(
      `Compressed image: ${file.name} (${(file.size / 1024).toFixed(0)} KB) → ${newName} (${(compressed.size / 1024).toFixed(0)} KB)`,
    );

    return compressed;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image for compression'));
    img.src = src;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('canvas.toBlob returned null'));
        }
      },
      type,
      quality,
    );
  });
}
