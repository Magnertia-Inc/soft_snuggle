import type { Metadata } from "next";
import Link from "next/link";
import { Story } from "@/components/home/Story";
import { storyImage } from "@/lib/images";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <div className="speckle">
      <div className="pt-16">
        <Story photo={storyImage()} heading="h1" />
      </div>
      <div className="-mt-10 pb-24 text-center sm:-mt-16">
        <Link href="/shop" className="btn-primary">
          Shop the collection →
        </Link>
      </div>
    </div>
  );
}
