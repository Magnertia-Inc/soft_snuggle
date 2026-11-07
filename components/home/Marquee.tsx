import { FlowerMark } from "../art/FlowerMark";
import { STORE, inr, shippingLine } from "@/lib/store";

const ITEMS = [
  "Made to order by Veviba",
  "Freshly stitched for your baby",
  "24×7 ordering available",
  "100% cotton",
  "Kind to tiny skin",
  "Made to pass along",
  shippingLine,
  "UPI & Cash on Delivery",
];

export function Marquee() {
  const row = [...ITEMS, ...ITEMS];
  return (
    // The tilt pushes the band's corners past the screen edge, which let phones
    // scroll sideways by a pixel. Clipping only the sides keeps the tilt intact.
    <div className="relative z-10 overflow-x-clip">
      <div className="-rotate-1 overflow-hidden bg-ink py-4 text-paper">
        <div className="anim-marquee flex w-max" style={{ animationDuration: "90s" }}>
          {[0, 1].map((k) => (
            <div key={k} className="flex shrink-0 items-center" aria-hidden={k === 1}>
              {row.map((t, i) => (
                <span key={`${k}-${i}`} className="flex items-center gap-6 px-6 font-display text-xl italic sm:text-2xl">
                  {t}
                  <FlowerMark className="h-5 w-5" petal="#B7CCBE" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
