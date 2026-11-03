import { redirect } from "next/navigation";

// Stock now lives on the Products page, next to the editor. Kept so old links still work.
export default function Stock() {
  redirect("/admin/products");
}
