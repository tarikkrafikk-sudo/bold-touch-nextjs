"use client";

export default function MobileStickyBar() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex items-center gap-2 border-t border-black/10 bg-cream/95 px-4 py-2.5 backdrop-blur-xl md:hidden">
      <a
        href="https://wa.me/212642999692?text=Salam%20BOLD%20TOUCH%2C%20bghit%20ncommander"
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#25D366] py-2.5 text-sm font-semibold text-white"
      >
        <svg viewBox="0 0 32 32" className="h-4 w-4" fill="currentColor" aria-hidden>
          <path d="M16.01 3C9.38 3 4 8.38 4 15.01c0 2.39.7 4.61 1.9 6.47L4.5 28l6.68-1.75a11.9 11.9 0 0 0 4.83 1.02h.01c6.63 0 12.01-5.38 12.01-12.01C28.03 8.38 22.65 3 16.01 3Z" />
        </svg>
        WhatsApp
      </a>
      <a
        href="https://www.instagram.com/bold_touch05_37/"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Instagram BOLD TOUCH"
        className="flex h-10 w-10 items-center justify-center rounded-full border border-black/15 bg-white text-ink"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
          <path d="M12 2.2c3.2 0 3.58.01 4.85.07 1.17.05 1.8.24 2.22.41.56.21.96.47 1.38.9.42.42.68.82.9 1.38.17.42.36 1.05.41 2.22.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.24 1.8-.41 2.22-.21.56-.47.96-.9 1.38-.42.42-.82.68-1.38.9-.42.17-1.05.36-2.22.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.24-2.22-.41a3.73 3.73 0 0 1-1.38-.9 3.73 3.73 0 0 1-.9-1.38c-.17-.42-.36-1.05-.41-2.22-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.24-1.8.41-2.22.21-.56.47-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.17 1.05-.36 2.22-.41C8.42 2.21 8.8 2.2 12 2.2Zm0 3.07a6.73 6.73 0 1 0 0 13.46 6.73 6.73 0 0 0 0-13.46Zm0 11.1a4.37 4.37 0 1 1 0-8.74 4.37 4.37 0 0 1 0 8.74Zm6.8-11.37a1.57 1.57 0 1 1-3.15 0 1.57 1.57 0 0 1 3.15 0Z" />
        </svg>
      </a>
    </div>
  );
}
