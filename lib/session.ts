import { cookies } from "next/headers";
import { SESSION_COOKIE, SESSION_MAX_AGE, createSession, readSession } from "./auth";
import { getCustomer, type Customer } from "./queries";

/** The signed-in shopper, or null. Used by every route that needs an account. */
export async function currentCustomer(): Promise<Customer | null> {
  const jar = await cookies();
  const id = readSession(jar.get(SESSION_COOKIE)?.value);
  return id ? await getCustomer(id) : null;
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_MAX_AGE,
};

export async function startSession(customerId: number) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, createSession(customerId), sessionCookieOptions);
}

export async function endSession() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}
