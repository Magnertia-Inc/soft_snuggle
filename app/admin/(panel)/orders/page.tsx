import Link from "next/link";
import { OrderList } from "@/components/admin/OrderList";
import { requireAdmin } from "@/lib/admin";
import { ORDER_VIEWS, PAGE_SIZE, getOrderCounts, isOrderView, listOrders } from "@/lib/admin-queries";

export const metadata = { title: "Orders" };

export default async function Orders({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; q?: string; page?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const view = isOrderView(params.view) ? params.view : "all";
  const q = params.q?.trim() ?? "";
  const page = Math.max(1, Math.floor(Number(params.page)) || 1);

  const [{ orders, total }, counts] = await Promise.all([listOrders({ view, q, page }), getOrderCounts()]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const href = (o: { view: string; q?: string; page?: number }) => {
    const sp = new URLSearchParams();
    if (o.view !== "all") sp.set("view", o.view);
    if (o.q) sp.set("q", o.q);
    if (o.page && o.page > 1) sp.set("page", String(o.page));
    return `/admin/orders${sp.size ? `?${sp}` : ""}`;
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Orders</p>
          <h1 className="mt-2 font-display text-4xl tracking-tight">{ORDER_VIEWS[view].label}</h1>
        </div>
        <form action="/admin/orders" className="flex w-full gap-2 sm:w-auto">
          {view !== "all" && <input type="hidden" name="view" value={view} />}
          <input
            name="q"
            defaultValue={q}
            placeholder="Order ID, phone or name"
            className="field !py-2.5 sm:w-72"
            aria-label="Search orders"
          />
          <button className="btn-primary !px-5 !py-2.5">Search</button>
        </form>
      </div>

      <nav className="no-scrollbar -mx-1 mt-6 flex gap-1.5 overflow-x-auto pb-1">
        {(Object.keys(ORDER_VIEWS) as (keyof typeof ORDER_VIEWS)[]).map((v) => (
          <Link
            key={v}
            href={href({ view: v, q })}
            className={`flex items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-bold transition-colors ${
              v === view ? "border-ink bg-ink text-paper" : "border-line bg-paper hover:border-ink/40"
            }`}
          >
            {ORDER_VIEWS[v].label}
            <span className={`rounded-full px-2 py-0.5 text-[0.6875rem] ${v === view ? "bg-paper/20" : "bg-cream"}`}>{counts[v]}</span>
          </Link>
        ))}
      </nav>

      {q && (
        <p className="mt-4 text-sm text-ink-soft">
          {total} {total === 1 ? "order matches" : "orders match"} “{q}”.{" "}
          <Link href={href({ view })} className="font-bold underline underline-offset-4">
            Clear search
          </Link>
        </p>
      )}

      <div className="mt-5">
        <OrderList orders={orders} empty={q ? "Nothing matches that search." : "No orders here."} />
      </div>

      {pages > 1 && (
        <div className="mt-6 flex items-center justify-between text-sm">
          {page > 1 ? <Link href={href({ view, q, page: page - 1 })} className="btn-ghost !py-2">← Newer</Link> : <span />}
          <span className="text-ink-soft">Page {page} of {pages}</span>
          {page < pages ? <Link href={href({ view, q, page: page + 1 })} className="btn-ghost !py-2">Older →</Link> : <span />}
        </div>
      )}
    </div>
  );
}
