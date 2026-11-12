import { STORE } from "@/lib/store";
import { WhatsAppIcon } from "./art/WhatsAppIcon";

/** "Join our WhatsApp channel" prompt — coupons for every purchase are shared there. */
export function ChannelCTA({
  title,
  text,
  compact = false,
  className = "",
}: {
  title?: string;
  text: string;
  compact?: boolean;
  className?: string;
}) {
  if (compact) {
    return (
      <a
        href={STORE.whatsappChannel}
        target="_blank"
        rel="noreferrer"
        className={`flex items-center gap-2 rounded-xl bg-[#25D366]/10 px-3 py-2 text-xs font-semibold text-ink hover:bg-[#25D366]/20 ${className}`}
      >
        <WhatsAppIcon className="h-4 w-4 shrink-0 text-[#1da851]" />
        <span>{text}</span>
        <span className="ml-auto shrink-0 font-extrabold text-[#1da851]">Join →</span>
      </a>
    );
  }
  return (
    <div className={`flex flex-wrap items-center gap-4 rounded-3xl border border-[#25D366]/30 bg-gradient-to-br from-[#25D366]/15 to-[#25D366]/5 p-5 ${className}`}>
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#25D366] text-white shadow-md shadow-[#25D366]/30">
        <WhatsAppIcon className="h-6 w-6" />
      </span>
      <div className="min-w-0 flex-1 basis-48">
        <p className="text-[0.625rem] font-extrabold uppercase tracking-[0.2em] text-[#1da851]">WhatsApp channel</p>
        {title && <p className="mt-1 font-display text-xl leading-snug tracking-tight text-ink">{title} 🎁</p>}
        <p className="mt-1 text-sm leading-relaxed text-ink-soft">{text}</p>
      </div>
      <div className="flex basis-full justify-center">
        <a
          href={STORE.whatsappChannel}
          target="_blank"
          rel="noreferrer"
          className="rounded-full bg-[#25D366] px-8 py-3 text-center text-sm font-bold text-white shadow-md shadow-[#25D366]/30 transition-colors hover:bg-[#1da851]"
        >
          Join channel →
        </a>
      </div>
    </div>
  );
}
