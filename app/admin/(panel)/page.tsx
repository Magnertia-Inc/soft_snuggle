import Link from "next/link";
import { OrderList } from "@/components/admin/OrderList";
import { requireAdmin } from "@/lib/admin";
import { getDashboard } from "@/lib/admin-queries";
import { STORE, inr } from "@/lib/store";

export const metadata = { title: "Dashboard" };

export default async function Dashboard() {
  await requireAdmin();
  const { counts, sales, recent } = await getDashboard();

  // What needs doing, in the order it gets done. Each opens the matching tab.
  const todo = [
    { n: counts.utr_to_check, label: "UPI payments to check", hint: "Match the UTR with your bank, then confirm", href: "/admin/orders?view=new", tone: "bg-butter" },
    { n: counts.cod_to_confirm, label: "Cash on delivery to confirm", hint: "Call or WhatsApp if unsure, then confirm", href: "/admin/orders?view=new", tone: "bg-butter" },
    { n: counts.to_pack, label: "To pack", hint: "Confirmed and waiting to be packed", href: "/admin/orders?view=to_pack", tone: "bg-sky" },
    { n: counts.to_ship, label: "To ship", hint: "Packed, waiting for the courier", href: "/admin/orders?view=to_ship", tone: "bg-peach" },
    { n: counts.in_transit, label: "In transit", hint: "With the courier", href: "/admin/orders?view=in_transit", tone: "bg-sage" },
  ];

  return (
    <div>
      <p className="eyebrow">Dashboard</p>
      <h1 className="mt-2 font-display text-4xl tracking-tight sm:text-5xl">Today at {STORE.name}</h1>

      <dl className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Orders today", value: String(sales.today_orders) },
          { label: "Sales today", value: inr(sales.today_sales) },
          { label: "Last 7 days", value: inr(sales.week_sales), sub: `${sales.week_orders} orders` },
          { label: "Last 30 days", value: inr(sales.month_sales) },
        ].map((s) => (
          <div key={s.label} className="rounded-[1.5rem] border border-line bg-paper p-5">
            <dt className="text-xs font-extrabold uppercase tracking-[0.14em] text-ink-soft">{s.label}</dt>
            <dd className="mt-2 font-display text-3xl">{s.value}</dd>
            {s.sub && <dd className="text-sm text-ink-soft">{s.sub}</dd>}
          </div>
        ))}
      </dl>
      <p className="mt-2 text-xs text-ink-soft">Sales leave out cancelled orders and count unpaid ones too. Days run on Indian time.</p>

      <h2 className="mt-12 font-display text-2xl tracking-tight">Needs you</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {todo.map((t) => (
          <Link
            key={t.label}
            href={t.href}
            className={`rounded-[1.5rem] p-5 transition-transform hover:-translate-y-0.5 ${t.n ? t.tone : "border border-line bg-paper/60 text-ink-soft"}`}
          >
            <p className="font-display text-4xl">{t.n}</p>
            <p className="mt-1 font-bold text-ink">{t.label}</p>
            <p className="mt-1 text-xs text-ink-soft">{t.hint}</p>
          </Link>
        ))}
      </div>
      {counts.awaiting_payment > 0 && (
        <p className="mt-3 text-sm text-ink-soft">
          {counts.awaiting_payment} UPI {counts.awaiting_payment === 1 ? "order has" : "orders have"} no UTR yet: the customer
          may not have paid. Check your bank before confirming.
        </p>
      )}

      <div className="mt-12 flex items-end justify-between">
        <h2 className="font-display text-2xl tracking-tight">Latest orders</h2>
        <Link href="/admin/orders" className="text-sm font-bold underline underline-offset-4">All orders →</Link>
      </div>
      <div className="mt-4">
        <OrderList orders={recent} empty="No orders yet. They'll show up here the moment one comes in." />
      </div>
    </div>
  );
}
