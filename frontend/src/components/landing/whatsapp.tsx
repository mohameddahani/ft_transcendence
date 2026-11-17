"use client";

import { saasWhatsapp } from "@/components/landing/constants";

// a Moroccan number like 0606060606 becomes wa.me/212606060606, with the message already typed
export function whatsappLink(message: string) {
  const digits = saasWhatsapp.replace(/\D/g, "");
  const international = digits.startsWith("0") ? `212${digits.slice(1)}` : digits;
  return `https://wa.me/${international}?text=${encodeURIComponent(message)}`;
}

export function WhatsappIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.21 3.08.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35zM12.04 21.8h-.01a9.8 9.8 0 0 1-5-1.37l-.36-.21-3.72.98 1-3.63-.24-.37a9.78 9.78 0 0 1-1.5-5.22c0-5.41 4.41-9.82 9.83-9.82 2.62 0 5.09 1.03 6.94 2.88a9.75 9.75 0 0 1 2.87 6.95c0 5.42-4.41 9.82-9.81 9.82zm8.36-18.18A11.73 11.73 0 0 0 12.04.17C5.5.17.18 5.49.18 12.03c0 2.09.55 4.13 1.59 5.93L.08 24l6.17-1.62a11.84 11.84 0 0 0 5.79 1.47h.01c6.54 0 11.86-5.32 11.86-11.86 0-3.17-1.23-6.15-3.47-8.39z" />
    </svg>
  );
}

// the landing page's chat button: WhatsApp green, bottom right, a label that opens on hover
export function WhatsappFloatingButton() {
  const label = "Chat with us on WhatsApp";
  return (
    <a
      href={whatsappLink("Hello Sportium, I'd like to know more about the platform for my club.")}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="group fixed bottom-5 end-5 sm:bottom-6 sm:end-6 z-50 inline-flex h-14 items-center rounded-full bg-[#25d366] text-white shadow-[0_10px_30px_-6px_rgba(37,211,102,0.65)] ring-1 ring-black/5 transition-all duration-300 hover:bg-[#1ebe5b] hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#25d366]/40 animate-in zoom-in-50 fade-in slide-in-from-bottom-6 duration-700 delay-700 fill-mode-backwards motion-reduce:animate-none print:hidden"
    >
      <span className="relative grid size-14 shrink-0 place-items-center">
        <span aria-hidden="true" className="absolute inset-1.5 rounded-full bg-[#25d366] opacity-60 animate-ping [animation-duration:2.4s] motion-reduce:animate-none" />
        <WhatsappIcon className="relative size-7" />
      </span>
      {/* the label slides open on hover or keyboard focus (desktop) */}
      <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-semibold opacity-0 transition-all duration-300 group-hover:max-w-56 group-hover:pe-5 group-hover:opacity-100 group-focus-visible:max-w-56 group-focus-visible:pe-5 group-focus-visible:opacity-100">
        {label}
      </span>
    </a>
  );
}
