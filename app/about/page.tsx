import { redirect } from "next/navigation";

// There is no separate About page any more: the story lives on the home page.
// Old links to /about land there instead of on a "not found" page.
export default function AboutPage() {
  redirect("/#story");
}
