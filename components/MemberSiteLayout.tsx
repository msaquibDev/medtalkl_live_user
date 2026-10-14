"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Menu, X, ArrowRight } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import type { Member } from "@/lib/catalog/model";

const MEMBER_SESSION_KEY = "meditalk-member";

function readMember(): Member | null {
  try {
    return JSON.parse(sessionStorage.getItem(MEMBER_SESSION_KEY) || "null") as Member | null;
  } catch {
    return null;
  }
}

export function MemberHeader({
  signedIn = false,
  member,
}: {
  signedIn?: boolean;
  member?: Member | null;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);

  function closeMenu() {
    setOpen(false);
  }

  function logout() {
    sessionStorage.removeItem(MEMBER_SESSION_KEY);
    closeMenu();
    router.push("/");
  }

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <BrandLogo
          href={signedIn ? "/member/dashboard" : "/"}
          className="site-brand"
          label="Medtalk.live home"
        />
        {signedIn ? (
          <>
            <button
              className="mobile-menu"
              onClick={() => setOpen((current) => !current)}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              aria-controls="member-navigation"
            >
              {open ? <X /> : <Menu />}
            </button>
            <nav
              id="member-navigation"
              aria-label="Member navigation"
              className={`member-nav ${open ? "is-open" : ""}`}
            >
              <Link href="/member/dashboard" onClick={closeMenu}>Home</Link>
              <Link href="/member/conferences?status=Live" onClick={closeMenu}>Conferences</Link>
              <Link href="/member/faculty" onClick={closeMenu}>Faculty</Link>
              <Link href="/member/learning" onClick={closeMenu}>My Learning</Link>
              <Link href="/member/profile" className="member-chip" onClick={closeMenu}>
                <span>
                  {(member?.name || "Doctor")
                    .split(" ")
                    .map((part) => part[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </span>
                {member?.name?.split(" ")[0] || "My Profile"}
              </Link>
              <button className="member-logout" onClick={logout}>Log Out</button>
            </nav>
          </>
        ) : (
          <div className="header-actions">
            <Link className="login-link" href="/login">Login</Link>
            <Link className="button button-primary" href="/register">
              Register <ArrowRight size={15} />
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

export function MemberFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <Link href="/" className="footer-logo">
          Medtalk<span>.Live</span>
        </Link>
        <nav>
          <Link href="/#about">About Us</Link>
          <Link href="/#contact">Contact Us</Link>
          <Link href="/login">Login</Link>
        </nav>
        <p>
          © 2026 HealthcareTalk.Live by SaaScraft Studio (India) Pvt. Ltd. All
          rights reserved.
        </p>
      </div>
    </footer>
  );
}

export function SiteLayout({
  children,
  signedIn = false,
  member,
}: {
  children: ReactNode;
  signedIn?: boolean;
  member?: Member | null;
}) {
  return (
    <div className="member-site">
      <MemberHeader signedIn={signedIn} member={member} />
      {children}
      <MemberFooter />
    </div>
  );
}

export function MemberAppLayout({ children }: { children: ReactNode }) {
  const [member, setMember] = useState<Member | null>(null);

  useEffect(() => {
    const syncMember = () => setMember(readMember());
    syncMember();
    window.addEventListener("medtalk:member-updated", syncMember);
    return () => window.removeEventListener("medtalk:member-updated", syncMember);
  }, []);

  return (
    <SiteLayout signedIn member={member}>
      {children}
    </SiteLayout>
  );
}
