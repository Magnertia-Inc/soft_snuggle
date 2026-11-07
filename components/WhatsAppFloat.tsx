"use client";

import { STORE } from "@/lib/store";
import { WhatsAppIcon } from "./art/WhatsAppIcon";

// The round WhatsApp button that stays at the bottom-right of every shop page,
// so anyone with a question can message the shop in one tap.
export function WhatsAppFloat() {
  const text = encodeURIComponent("Hi Veviba! I have a question.");
  return (
    <a
      href={`https://wa.me/${STORE.whatsappNumber}?text=${text}`}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="group fixed bottom-24 right-4 z-[70] flex items-center gap-2 rounded-full bg-[#25D366] p-3.5 text-white shadow-[0_10px_28px_-8px_rgba(0,0,0,0.45)] transition-transform hover:scale-105 sm:bottom-6 sm:right-6"
    >
      <WhatsAppIcon className="h-7 w-7" />
      <span className="hidden pr-1 text-sm font-bold sm:group-hover:inline">Chat with us</span>
    </a>
  );
}
