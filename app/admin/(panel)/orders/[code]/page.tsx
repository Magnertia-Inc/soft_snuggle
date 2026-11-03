import Link from "next/link";
import { notFound } from "next/navigation";
import { CopyButton } from "@/components/admin/CopyButton";
import { OrderActions } from "@/components/admin/OrderActions";
import { StatusBadge } from "@/components/admin/OrderList";
import { requireAdmin } from "@/lib/admin";
import { getAdminOrder } from "@/lib/admin-queries";
import { EVENT_LABELS, paymentLabel, when } from "@/lib/admin-labels";
import { inr } from "@/lib/store";

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }) {
  return { title: (await params).code };
}

export default async function AdminOrderPage({ params }: { params: Promise<{ code: string }> }) {
  await requireAdmin();
  const order = await getAdminOrder((await params).code);
  if (!order) notFound();

  const address = `${order.customerName}\n${order.address}\n${order.city}, ${order.state} – ${order.pincode}\n+91 ${order.phone}`;
  const card = "rounded-[1.5rem] border border-line bg-paper p-5 sm:p-6";

  return (
    <div>
      <Link href="/admin/orders" className="text-sm font-bold text-ink-soft hover:text-ink">← All orders</Link>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-4xl tracking-tight">{order.code}</h1>
        <StatusBadge status={order.status} />
      </div>
      <p className="mt-1 text-sm text-ink-soft">
        Placed {when(order.placedAt, true)} · {paymentLabel(order.paymentMethod, order.paymentStatus)} · {inr(order.total)}
      </p>

      <div className="mt-7 grid items-start gap-5 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-5">
          <section className={card}>
            <h2 className="font-display text-xl">Items</h2>
            <ul className="mt-3 divide-y divide-line">
              {order.items.map((it, i) => (
                <li key={i} className="flex items-baseline justify-between gap-4 py-2.5">
                  <span>
                    <span className="font-semibold">{it.name}</span>
                    <span className="block text-sm text-ink-soft">
                      {it.colour ? `${it.colour} · ` : ""}{it.size} × {it.qty} · {inr(it.price)} each
                    </span>
                  </span>
                  <span className="font-bold">{inr(it.price * it.qty)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-3 space-y-1 border-t border-line pt-3 text-sm">
              <div className="flex justify-between"><dt className="text-ink-soft">Subtotal</dt><dd>{inr(order.subtotal)}</dd></div>
              {order.discount > 0 && (
                <div className="flex justify-between">
                  <dt className="text-ink-soft">Discount{order.couponCode ? ` · ${order.couponCode}` : ""}</dt>
                  <dd>−{inr(order.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between"><dt className="text-ink-soft">Shipping</dt><dd>{order.shipping ? inr(order.shipping) : "Free"}</dd></div>
              <div className="flex justify-between text-base font-bold"><dt>Total</dt><dd>{inr(order.total)}</dd></div>
            </dl>
          </section>

          <section className={card}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-xl">Deliver to</h2>
              <CopyButton text={address} label="Copy address" />
            </div>
            <p className="mt-3 whitespace-pre-line leading-relaxed">{address}</p>
            <div className="mt-4 flex flex-wrap gap-2 text-sm">
              <a href={`tel:+91${order.phone}`} className="rounded-full bg-sage px-4 py-2 font-bold">Call</a>
              <a href={`https://wa.me/91${order.phone}?text=${encodeURIComponent(`Hi ${order.customerName.split(" ")[0]}, this is Soft Snuggle about your order ${order.code}.`)}`} target="_blank" rel="noreferrer" className="rounded-full bg-sage px-4 py-2 font-bold">WhatsApp</a>
              {order.email && <a href={`mailto:${order.email}?subject=${encodeURIComponent(`Your Soft Snuggle order ${order.code}`)}`} className="rounded-full bg-sage px-4 py-2 font-bold">Email</a>}
            </div>
            <p className="mt-3 text-xs text-ink-soft">
              {order.email ? `${order.email} · ` : ""}{order.hasAccount ? (order.accountVerified ? "Has an account · number verified" : "Has an account · number not verified yet") : "Ordered as a guest"}
            </p>
          </section>

          <section className={card}>
            <h2 className="font-display text-xl">Payment</h2>
            <p className="mt-2">{paymentLabel(order.paymentMethod, order.paymentStatus)}</p>
            {order.utr && (
              <p className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                UTR <b className="font-mono text-base">{order.utr}</b> <CopyButton text={order.utr} />
              </p>
            )}
            {order.courier && (
              <p className="mt-3 border-t border-line pt-3 text-sm">
                Shipped with <b>{order.courier}</b> · {order.trackingNumber}
                {order.trackingUrl && <> · <a href={order.trackingUrl} target="_blank" rel="noreferrer" className="font-bold underline">Track ↗</a></>}
              </p>
            )}
          </section>

          <section className={card}>
            <h2 className="font-display text-xl">History</h2>
            {order.events.length === 0 ? (
              <p className="mt-2 text-sm text-ink-soft">Placed before history was kept.</p>
            ) : (
              <ol className="mt-3 space-y-3 border-l-2 border-line pl-4">
                {order.events.map((e, i) => (
                  <li key={i} className="relative">
                    <span className="absolute -left-[1.4rem] top-1.5 h-2.5 w-2.5 rounded-full bg-sage-deep" />
                    <p className="text-sm font-bold">{EVENT_LABELS[e.kind] ?? e.kind}</p>
                    {e.note && <p className="text-sm">{e.note}</p>}
                    <p className="text-xs text-ink-soft">{when(e.at)} · {e.actor === "customer" ? "Customer" : e.actor}</p>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        <aside className={`${card} lg:sticky lg:top-24`}>
          <h2 className="font-display text-xl">Next step</h2>
          <div className="mt-4">
            <OrderActions
              code={order.code}
              status={order.status}
              paymentMethod={order.paymentMethod}
              paymentStatus={order.paymentStatus}
              phone={order.phone}
              whatsappAt={order.whatsappAt}
              utr={order.utr}
              courier={order.courier}
              trackingNumber={order.trackingNumber}
              trackingUrl={order.trackingUrl}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
