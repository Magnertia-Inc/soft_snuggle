import { CouponForm } from "@/components/admin/CouponForm";
import { CouponRow } from "@/components/admin/CouponRow";
import { requireAdmin } from "@/lib/admin";
import { describeCoupon, listCoupons } from "@/lib/coupons";

export const metadata = { title: "Coupons" };

const lastDay = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric" });

export default async function Coupons() {
  await requireAdmin();
  const coupons = await listCoupons();
  const now = Date.now();

  return (
    <div>
      <p className="eyebrow">Coupons</p>
      <h1 className="mt-2 font-display text-4xl tracking-tight">Discount codes</h1>
      <p className="mt-2 max-w-2xl text-ink-soft">
        Shoppers type a code at checkout to take money off their items (never off delivery). Switch a code off to stop it
        working straight away. If an order with a code is cancelled, that use is given back.
      </p>

      <div className="mt-6">
        <CouponForm />
      </div>

      {coupons.length === 0 ? (
        <p className="mt-6 rounded-[1.5rem] border border-dashed border-line px-5 py-8 text-center text-ink-soft">
          No codes yet. Create your first one above.
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-line overflow-hidden rounded-[1.5rem] border border-line bg-paper">
          {coupons.map((c) => (
            <CouponRow
              key={c.id}
              coupon={c}
              label={describeCoupon(c)}
              expires={c.expiresAt ? lastDay(c.expiresAt) : null}
              expired={!!c.expiresAt && new Date(c.expiresAt).getTime() < now}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
