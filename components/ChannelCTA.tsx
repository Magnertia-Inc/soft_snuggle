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
    <div className={`flex flex-wrap items-center gap-4 rounded-2xl border border-[#25D366]/40 bg-[#25D366]/10 p-4 ${className}`}>
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#25D366] text-white">
        <WhatsAppIcon className="h-6 w-6" />
      </span>
      <div className="min-w-0 flex-1">
        {title && <p className="font-bold text-ink">🎁 {title}</p>}
        <p className="text-sm text-ink-soft">{text}</p>
      </div>
      <a
        href={STORE.whatsappChannel}
        target="_blank"
        rel="noreferrer"
        className="shrink-0 rounded-full bg-[#25D366] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#1da851]"
      >
        Join channel
      </a>
    </div>
  );
}
