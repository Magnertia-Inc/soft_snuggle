"use client";

import { AnimatePresence, motion } from "motion/react";
import { useLenis } from "lenis/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { isStudioShot } from "@/lib/photo";

/**
 * Full-screen photo viewer, opened by clicking a product photo.
 *
 * Rendered directly into document.body via a portal so that it sits above
 * the navigation bar, sticky drawers, and product page contents.
 *
 * Arrow keys and on-screen arrows move between photos, Escape, the Back button,
 * the Close button, or clicking the backdrop closes it. The page behind is held
 * still while open.
 */
export function Lightbox({
  photos,
  index,
  onIndex,
  onClose,
  alt,
}: {
  photos: string[];
  /** Which photo is showing; null means the viewer is closed. */
  index: number | null;
  onIndex: (i: number) => void;
  onClose: () => void;
  alt: string;
}) {
  const lenis = useLenis();
  const backBtnRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const open = index !== null && index >= 0 && index < photos.length;
  const currentIndex = index !== null && index >= 0 && index < photos.length ? index : 0;

  const step = useCallback(
    (dir: 1 | -1) => {
      if (index === null || photos.length <= 1) return;
      onIndex((index + dir + photos.length) % photos.length);
    },
    [index, onIndex, photos.length],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    // Both are needed: Lenis drives the smooth scroll, and the overflow lock
    // catches mobile, where Lenis is not what moves the page.
    lenis?.stop();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    backBtnRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      lenis?.start();
      document.body.style.overflow = previous;
    };
  }, [open, onClose, step, lenis]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[200] flex flex-col bg-ink/95 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          role="dialog"
          aria-modal="true"
          aria-label={`${alt} — photo ${currentIndex + 1} of ${photos.length}`}
          onClick={onClose}
        >
          {/* Header with Back button, photo count, and Close button */}
          <div
            className="relative z-20 flex items-center justify-between px-4 py-4 sm:px-8"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              ref={backBtnRef}
              type="button"
              onClick={onClose}
              aria-label="Back to product"
              className="group flex items-center gap-2 rounded-full bg-paper/15 px-4 py-2.5 text-sm font-bold text-paper backdrop-blur transition-all hover:bg-paper/25 hover:scale-105 active:scale-95"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4 transition-transform group-hover:-translate-x-0.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              <span>Back</span>
            </button>

            <div className="flex items-center gap-3 sm:gap-4">
              <p className="text-sm font-bold text-paper/80">
                {currentIndex + 1} / {photos.length}
              </p>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="grid h-10 w-10 place-items-center rounded-full bg-paper/15 text-paper backdrop-blur transition-all hover:bg-paper/25 hover:scale-105 active:scale-95"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <path d="m6 6 12 12M18 6 6 18" />
                </svg>
              </button>
            </div>
          </div>

          {/* Centered Image with Prev/Next Navigation */}
          <div
            className="relative flex min-h-0 flex-1 items-center justify-center px-4 py-2 sm:px-16"
            onClick={onClose}
          >
            {photos.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  step(-1);
                }}
                aria-label="Previous photo"
                className="absolute left-3 z-20 grid h-12 w-12 place-items-center rounded-full bg-paper/20 text-paper backdrop-blur transition-all hover:bg-paper/30 hover:scale-105 active:scale-95 sm:left-6"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="m15 5-7 7 7 7" />
                </svg>
              </button>
            )}

            <div
              className="relative flex max-h-full max-w-full items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.img
                  key={photos[currentIndex]}
                  src={photos[currentIndex]}
                  alt={alt}
                  draggable={false}
                  className={`max-h-[calc(100vh-190px)] max-w-[calc(100vw-32px)] sm:max-w-[calc(100vw-180px)] rounded-2xl object-contain shadow-2xl ${
                    isStudioShot(photos[currentIndex]) ? "bg-cream" : ""
                  }`}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.2 }}
                />
              </AnimatePresence>
            </div>

            {photos.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  step(1);
                }}
                aria-label="Next photo"
                className="absolute right-3 z-20 grid h-12 w-12 place-items-center rounded-full bg-paper/20 text-paper backdrop-blur transition-all hover:bg-paper/30 hover:scale-105 active:scale-95 sm:right-6"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="m9 5 7 7-7 7" />
                </svg>
              </button>
            )}
          </div>

          {/* Bottom Thumbnails */}
          {photos.length > 1 && (
            <div
              className="relative z-20 flex justify-center gap-2.5 px-4 pb-6 pt-2"
              onClick={(e) => e.stopPropagation()}
            >
              {photos.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => onIndex(i)}
                  aria-label={`Photo ${i + 1}`}
                  aria-current={i === currentIndex}
                  className={`h-16 w-14 overflow-hidden rounded-xl border-2 transition-all ${
                    i === currentIndex
                      ? "border-paper scale-105 shadow-md"
                      : "border-transparent opacity-50 hover:opacity-90 hover:scale-102"
                  }`}
                >
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
