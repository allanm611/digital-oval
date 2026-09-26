import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { zIndex } from '../../utils/utils';

export interface LightboxImage {
  src: string;
  alt?: string;
  /** "Open in new tab" href, useful when `src` is a data: URI that can't be usefully opened directly. */
  downloadHref?: string;
}

interface ImageLightboxProps {
  /** Full ordered list of images available for keyboard/arrow navigation. */
  images: LightboxImage[];
  /** Index into `images` that's currently open; null/undefined closes the lightbox. */
  index: number | null;
  onClose: () => void;
  /** Called with the next index when the user navigates via arrows/keyboard (wraps around). */
  onNavigate: (index: number) => void;
}

/**
 * Full-screen preview for a thumbnail image (test run/step screenshots), with left/right
 * keyboard and on-screen navigation across all images passed in. Portals to document.body so
 * it always renders above the panel it was triggered from, regardless of that panel's own
 * overflow/z-index.
 */
const ImageLightbox: React.FC<ImageLightboxProps> = ({ images, index, onClose, onNavigate }) => {
  const current = index != null ? images[index] : null;
  const hasMultiple = images.length > 1;

  const goPrev = () => {
    if (index == null || !hasMultiple) return;
    onNavigate((index - 1 + images.length) % images.length);
  };
  const goNext = () => {
    if (index == null || !hasMultiple) return;
    onNavigate((index + 1) % images.length);
  };

  useEffect(() => {
    if (!current) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      else if (event.key === 'ArrowLeft') goPrev();
      else if (event.key === 'ArrowRight') goNext();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, index, images.length]);

  if (!current) return null;

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/80 p-4 cursor-zoom-out"
      style={{ zIndex: zIndex.modal + 10 }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={current.alt ?? 'Image preview'}
    >
      <div className="absolute top-4 right-4 flex items-center gap-3">
        {current.downloadHref && (
          <a
            href={current.downloadHref}
            target="_blank"
            rel="noreferrer"
            onClick={(event) => event.stopPropagation()}
            className="inline-flex items-center gap-1.5 text-sm text-white/80 hover:text-white"
          >
            <ExternalLink size={16} /> Open original
          </a>
        )}
        <button
          type="button"
          onClick={onClose}
          className="text-white/80 hover:text-white"
          aria-label="Close preview"
        >
          <X size={26} />
        </button>
      </div>

      {hasMultiple && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            goPrev();
          }}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white bg-black/30 hover:bg-black/50 rounded-full p-2 transition-colors"
          aria-label="Previous screenshot"
        >
          <ChevronLeft size={28} />
        </button>
      )}

      <img
        src={current.src}
        alt={current.alt ?? 'Preview'}
        className="max-h-[90vh] max-w-[90vw] rounded-lg shadow-2xl object-contain cursor-default"
        onClick={(event) => event.stopPropagation()}
      />

      {hasMultiple && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            goNext();
          }}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white bg-black/30 hover:bg-black/50 rounded-full p-2 transition-colors"
          aria-label="Next screenshot"
        >
          <ChevronRight size={28} />
        </button>
      )}

      {hasMultiple && index != null && (
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs font-medium text-white/80 bg-black/40 rounded-full px-3 py-1"
          onClick={(event) => event.stopPropagation()}
        >
          {index + 1} / {images.length}
        </div>
      )}
    </div>,
    document.body,
  );
};

export default ImageLightbox;
