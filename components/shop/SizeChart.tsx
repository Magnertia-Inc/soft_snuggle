"use client";

import { LayoutGroup, motion } from "motion/react";
import { useState } from "react";

const SIZES = ["0–3M", "3–6M", "6–9M", "9–12M", "12–18M", "18–24M", "2–3Y"];

// Measurements from the Soft Snuggle size sheets. null = not measured for that size.
const CHARTS = {
  frock: {
    label: "Frock",
    unit: "inches",
    rows: [
      // 12–18M, 18–24M and 2–3Y: measurements to be added from the size sheet
      ["Total length", 12, 13.5, 15, 16.5, null, null, null],
      ["Chest", 8.5, 9, 10, 10.5, null, null, null],
      ["Bottom", 13.5, 14, 17, 17, null, null, null],
      ["Neck", 4.38, 4.5, 4.62, 4.75, null, null, null],
      ["Across shoulder", null, null, null, "7¾", null, null, null],
      ["Across front", null, null, null, 7, null, null, null],
      ["Across back", null, null, null, "7¼", null, null, null],
    ],
  },
  jabla: {
    label: "Jabla",
    unit: "cm",
    rows: [
      ["Total length", 28, 30, 32, 33.5, null, null, null],
      ["Chest", 26, 27, 27.5, 28.5, null, null, null],
      ["Bottom", 26, 27, 27.5, 28.5, null, null, null],
      ["Armhole", 9.5, 10.5, 11.5, 12.5, null, null, null],
    ],
  },
} as const;

type ChartKey = keyof typeof CHARTS;

export function SizeChart({ highlight, initial = "frock" }: { highlight?: string | null; initial?: ChartKey }) {
  const [chart, setChart] = useState<ChartKey>(initial);
  const c = CHARTS[chart];

  return (
    <div className="mt-4 overflow-hidden rounded-2xl bg-paper">
      <LayoutGroup id="size-chart">
        <div className="flex gap-1 border-b border-line p-1.5">
          {(Object.keys(CHARTS) as ChartKey[]).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setChart(k)}
              className={`relative flex-1 rounded-xl px-3 py-2 text-sm font-bold ${chart === k ? "text-ink" : "text-ink-soft"}`}
            >
              {chart === k && <motion.span layoutId="chart-pill" className="absolute inset-0 rounded-xl bg-sage" />}
              <span className="relative">
                {CHARTS[k].label} <span className="font-semibold opacity-70">({CHARTS[k].unit})</span>
              </span>
            </button>
          ))}
        </div>
      </LayoutGroup>
      <div className="overflow-x-auto" data-lenis-prevent>
        <table className="w-full min-w-[38rem] text-sm">
          <thead>
            <tr className="text-left">
              <th className="px-4 py-2.5 font-extrabold">Measurement</th>
              {SIZES.map((s) => (
                <th key={s} className={`px-3 py-2.5 text-center font-extrabold ${highlight === s ? "bg-butter" : ""}`}>
                  {s}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {c.rows.map(([name, ...values]) => (
              <tr key={name} className="border-t border-line">
                <td className="px-4 py-2.5 font-semibold">{name}</td>
                {values.map((v, i) => (
                  <td key={i} className={`px-3 py-2.5 text-center tabular-nums ${highlight === SIZES[i] ? "bg-butter/60" : ""}`}>
                    {v ?? <span className="text-ink-soft/50">–</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="border-t border-line px-4 py-2.5 text-xs text-ink-soft">
        Measured flat, in {c.unit}. Between sizes? Size up, so there&apos;s room to grow.
      </p>
    </div>
  );
}
