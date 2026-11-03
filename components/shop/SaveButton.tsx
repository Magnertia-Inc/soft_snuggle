"use client";

import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { useState } from "react";
import { useAccount } from "../providers/AccountProvider";

/** The heart. Logged out, it sends you to log in and remembers where you were. */
export function SaveButton({ productId, className = "", label = false }: {
  productId: number;
  className?: string;
  label?: boolean;
}) {
  const router = useRouter();
  const { saved, toggleSaved } = useAccount();
  const [nudge, setNudge] = useState(false);
  const on = saved(productId);

  const click = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const result = await toggleSaved(productId);
    if (result === "needs-login") {
      setNudge(true);
      setTimeout(() => router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`), 550);
    }
  };

  return (
    <button
      onClick={click}
      aria-pressed={on}
      aria-label={on ? "Remove from saved" : "Save for later"}
      title={on ? "Saved" : "Save for later"}
      className={`inline-flex items-center justify-center rounded-full transition-colors ${className}`}
    >
      <motion.span
        animate={nudge ? { rotate: [0, -12, 12, -8, 0] } : on ? { scale: [1, 1.35, 1] } : {}}
        transition={{ duration: 0.4 }}
        className="grid place-items-center"
      >
        <svg viewBox="0 0 24 24" className="h-[1.125rem] w-[1.125rem]" aria-hidden>
          <path
            d="M12 20.5s-7.5-4.7-7.5-9.7a4.3 4.3 0 0 1 7.5-2.9 4.3 4.3 0 0 1 7.5 2.9c0 5-7.5 9.7-7.5 9.7Z"
            fill={on ? "#E6A99D" : "none"}
            stroke={on ? "#E6A99D" : "currentColor"}
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
        </svg>
      </motion.span>
      {label && <span className="ml-2 text-sm font-bold">{on ? "Saved" : "Save"}</span>}
    </button>
  );
}
