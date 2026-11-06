import { CopyButton } from "@/components/admin/CopyButton";
import { requireAdmin } from "@/lib/admin";
import { listSubscribers, WELCOME_CODE } from "@/lib/newsletter";

export const metadata = { title: "Newsletter" };

const when = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });

export default async function Subscribers() {
  await requireAdmin();
  const people = await listSubscribers();

  return (
    <div>
      <p className="eyebrow">Newsletter</p>
      <h1 className="mt-2 font-display text-4xl tracking-tight">Sign-ups</h1>
      <p className="mt-2 max-w-2xl text-ink-soft">
        Everyone who joined the list on the home page. Each new sign-up is shown the {WELCOME_CODE} code (10% off, once per
        mobile number) and emailed it. Edit or switch the code off under Coupons.
      </p>

      {people.length === 0 ? (
        <p className="mt-6 rounded-[1.5rem] border border-dashed border-line px-5 py-8 text-center text-ink-soft">
          No sign-ups yet.
        </p>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <p className="font-bold">
              {people.length} {people.length === 1 ? "person" : "people"}
            </p>
            <CopyButton text={people.map((p) => p.email).join(", ")} label="Copy all emails" />
          </div>
          <ul className="mt-4 divide-y divide-line overflow-hidden rounded-[1.5rem] border border-line bg-paper">
            {people.map((p) => (
              <li key={p.email} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3">
                <span className="min-w-0 flex-1 truncate font-bold">{p.email}</span>
                <span className="text-sm text-ink-soft">Joined {when(p.createdAt)}</span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${p.welcomedAt ? "bg-sage" : "bg-line text-ink-soft"}`}
                  title={p.welcomedAt ? `Welcome email sent ${when(p.welcomedAt)}` : "Welcome email not sent (email not set up, or they joined before it existed)"}
                >
                  {p.welcomedAt ? "Welcome sent" : "No email sent"}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
