import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";

export default function NotFound() {
  return <main className="not-found-page">
    <BrandLogo href="/" className="not-found-brand" label="Meditalk Live home" />
    <div className="not-found-code">404 | PAGE NOT FOUND</div>
    <h1>This page went<br/><em>off the agenda.</em></h1>
    <p>The page you are looking for may have moved or is no longer available.</p>
    <Link href="/" className="primary">Return home <ArrowRight size={16}/></Link>
    <div className="not-found-foot">MEDITALK LIVE <span>Copyright 2026</span></div>
  </main>;
}
