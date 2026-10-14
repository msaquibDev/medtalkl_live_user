"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  CalendarDays,
  Check,
  Clock3,
  MapPin,
  Menu,
  Play,
  Search,
  Stethoscope,
  Video,
  X,
} from "lucide-react";
import { useCatalog } from "@/components/CatalogProvider";
import type {
  Conference,
  Faculty,
  FacultyVideo,
  Member,
} from "@/lib/catalog/model";
import { activeVideoPaymentProvider } from "@/lib/payments";
import type { VideoPaymentReceipt } from "@/lib/payments";
import { BrandLogo } from "@/components/BrandLogo";
import { FormDropdown } from "@/components/FormDropdown";

const MEMBER_KEY = "meditalk-member";
const MEMBERS_KEY = "meditalk-members";

function memberSession(): Member | null {
  try {
    return JSON.parse(
      sessionStorage.getItem(MEMBER_KEY) || "null",
    ) as Member | null;
  } catch {
    return null;
  }
}

function purchasedVideos(email: string): number[] {
  try {
    const purchases = JSON.parse(
      localStorage.getItem("meditalk-video-purchases") || "{}",
    ) as Record<string, number[]>;
    return purchases[email] || [];
  } catch {
    return [];
  }
}

function usePurchasedVideoIds(email?: string): number[] {
  const [videoIds, setVideoIds] = useState<number[]>([]);
  useEffect(() => {
    if (!email) {
      setVideoIds([]);
      return;
    }
    if (activeVideoPaymentProvider.mode === "demo") {
      setVideoIds(purchasedVideos(email));
      return;
    }
    let current = true;
    fetch("/api/member/my-learning", { cache: "no-store" })
      .then(async (response) =>
        response.ok
          ? ((await response.json()) as { videoIds?: number[] })
          : { videoIds: [] },
      )
      .then((result) => {
        if (current) setVideoIds(result.videoIds || []);
      })
      .catch(() => {
        if (current) setVideoIds([]);
      });
    return () => {
      current = false;
    };
  }, [email]);
  return videoIds;
}

function Header({
  signedIn = false,
  member,
}: {
  signedIn?: boolean;
  member?: Member | null;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  function logout() {
    sessionStorage.removeItem(MEMBER_KEY);
    router.push("/");
  }
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <BrandLogo
          href={signedIn ? "/member/dashboard" : "/"}
          className="site-brand"
          label="Meditalk Live home"
        />
        {signedIn ? (
          <>
            <button
              className="mobile-menu"
              onClick={() => setOpen(!open)}
              aria-label="Toggle menu"
            >
              {open ? <X /> : <Menu />}
            </button>
            <nav className={`member-nav ${open ? "is-open" : ""}`}>
              <Link href="/member/conferences?status=Live">Conferences</Link>
              <Link href="/member/faculty">Faculty</Link>
              <Link href="/member/videos">My Learning</Link>
              <Link href="/member/profile" className="member-chip">
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
              <div className="member-subnav">
                <Link href="/member/conferences?status=Live">
                  Live Conference
                </Link>
                <Link href="/member/conferences?status=Upcoming">
                  Upcoming Conferences
                </Link>
                <Link href="/member/conferences?status=Recorded">
                  Recorded Conference
                </Link>
                <Link href="/member/faculty">Faculty</Link>
                <Link href="/member/videos">Faculty Video</Link>
                <Link href="/member/profile">My Profile</Link>
                <button onClick={logout}>Logout</button>
              </div>
            </nav>
          </>
        ) : (
          <div className="header-actions">
            <Link className="login-link" href="/login">
              Login
            </Link>
            <Link className="button button-primary" href="/register">
              Register <ArrowRight size={15} />
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

function Footer() {
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

function useMemberGuard() {
  const router = useRouter();
  const [member, setMember] = useState<Member | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const current = memberSession();
    setMember(current);
    setReady(true);
    if (!current) router.replace("/login");
  }, [router]);
  return { member, ready };
}

function SiteLayout({
  children,
  signedIn,
  member,
}: {
  children: ReactNode;
  signedIn?: boolean;
  member?: Member | null;
}) {
  return (
    <div className="member-site">
      <Header signedIn={signedIn} member={member} />
      {children}
      <Footer />
    </div>
  );
}

function ConferenceCard({
  conference,
  action = "register",
}: {
  conference: Conference;
  action?: "register" | "dashboard" | "view";
}) {
  const [date, time] = conference.start.split("|").map((part) => part.trim());
  const buttonText =
    action === "view"
      ? "View recording"
      : action === "dashboard"
        ? conference.status === "Live"
          ? "Join now"
          : conference.type === "Paid"
            ? "Pay now"
            : "View details"
        : "Register";
  return (
    <article className="conference-card">
      <div className="conference-cover">
        <Image
          src={conference.banner || "/conference-placeholder.svg"}
          alt={`${conference.name} cover`}
          fill
          sizes="(max-width: 700px) 92vw, 360px"
          unoptimized
        />
        <span className={`conference-state ${conference.status.toLowerCase()}`}>
          {conference.status === "Live" ? <i /> : null}
          {conference.status}
        </span>
      </div>
      <div className="conference-card-body">
        <div className="conference-title-row">
          <h3>{conference.name}</h3>
          <span className={`price-tag ${conference.type.toLowerCase()}`}>
            {conference.type}
          </span>
        </div>
        <p className="info-line">
          <CalendarDays />
          {date}
          {conference.end ? ` – ${conference.end.split("|")[0].trim()}` : ""}
        </p>
        <p className="info-line">
          <Clock3 />
          {time || "Time to be announced"}
        </p>
        <p className="info-line">
          <MapPin />
          {conference.venue}
        </p>
        {conference.agenda ? (
          <a
            className="agenda-link"
            href={conference.agenda}
            target="_blank"
            rel="noreferrer"
            download
          >
            <ArrowDownToLine />
            Download Agenda
          </a>
        ) : (
          <span className="agenda-unavailable">Agenda not available yet</span>
        )}
        <div className="card-tags">
          <span>{conference.speciality || "Conference"}</span>
          <span>{conference.type}</span>
        </div>
        <a
          className={`button conference-cta ${action === "view" ? "button-outline" : "button-primary"}`}
          href={
            action === "register"
              ? "/register"
              : conference.accessLink ||
                `/member/conferences?status=${conference.status}`
          }
          target={
            action === "register" || !conference.accessLink
              ? undefined
              : "_blank"
          }
          rel={conference.accessLink ? "noreferrer" : undefined}
        >
          {buttonText}
          {conference.status === "Live" && action === "dashboard" ? (
            <Play size={14} fill="currentColor" />
          ) : (
            <ArrowRight size={15} />
          )}
        </a>
      </div>
    </article>
  );
}

function SectionHeading({
  kicker,
  title,
  href,
  link = "View all",
}: {
  kicker?: string;
  title: string;
  href?: string;
  link?: string;
}) {
  return (
    <div className="section-heading">
      <div>
        {kicker && <span className="eyebrow">{kicker}</span>}
        <h2>{title}</h2>
      </div>
      {href && (
        <Link href={href}>
          {link}
          <ArrowRight size={16} />
        </Link>
      )}
    </div>
  );
}

function VideoCard({
  video,
  faculty,
  compact = false,
}: {
  video: FacultyVideo;
  faculty: Faculty;
  compact?: boolean;
}) {
  const router = useRouter();
  const [unlocked, setUnlocked] = useState(video.type === "Free");
  const [checkout, setCheckout] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const member = memberSession();
  const purchasedIds = usePurchasedVideoIds(member?.email);
  useEffect(() => {
    setUnlocked(video.type === "Free" || purchasedIds.includes(video.id));
  }, [video.id, video.type, purchasedIds]);
  function startCheckout() {
    const member = memberSession();
    if (!member) {
      router.push(`/login?next=${encodeURIComponent("/member/videos")}`);
      return;
    }
    setCheckout(true);
  }
  async function completeVideoPurchase() {
    const member = memberSession();
    if (!member) {
      router.push("/login");
      return;
    }
    setPaymentError("");
    let receipt: VideoPaymentReceipt;
    try {
      receipt = await activeVideoPaymentProvider.pay({
        videoId: video.id,
        videoTitle: video.title,
        amount: video.amount,
        memberEmail: member.email,
      });
      if (!receipt.paymentId)
        throw new Error("Payment provider returned no receipt.");
    } catch {
      setPaymentError("Payment could not be completed. Please try again.");
      return;
    }
    if (receipt.provider === "demo") {
      const purchases = (() => {
        try {
          return JSON.parse(
            localStorage.getItem("meditalk-video-purchases") || "{}",
          ) as Record<string, number[]>;
        } catch {
          return {};
        }
      })();
      purchases[member.email] = Array.from(
        new Set([...(purchases[member.email] || []), video.id]),
      );
      localStorage.setItem(
        "meditalk-video-purchases",
        JSON.stringify(purchases),
      );
    }
    setUnlocked(true);
    setCheckout(false);
  }
  return (
    <>
      <article
        className={`conference-card faculty-video-card ${compact ? "compact" : ""}`}
      >
        <div className="conference-cover video-thumb">
          <span className="play-button">
            <Play size={17} fill="currentColor" />
          </span>
          <span className="video-duration">
            {video.type === "Paid" ? video.amount : "Free"}
          </span>
        </div>
        <div className="conference-card-body">
          <div className="conference-title-row">
            <h3>{video.title}</h3>
            <span className={`price-tag ${video.type.toLowerCase()}`}>
              {video.type}
            </span>
          </div>
          <p className="info-line">
            <Video />
            {faculty.name}
          </p>
          <p className="info-line">
            <Stethoscope />
            {video.speciality}
          </p>
          <p className="info-line">
            <MapPin />
            {faculty.institute}
          </p>
          <div className="card-tags">
            <span>Faculty video</span>
            <span>{video.type}</span>
          </div>
          {unlocked ? (
            <a
              className="button conference-cta button-primary"
              href={video.link}
              target="_blank"
              rel="noreferrer"
            >
              Play video <Play size={14} fill="currentColor" />
            </a>
          ) : (
            <button
              className="button conference-cta button-primary"
              type="button"
              onClick={startCheckout}
            >
              Pay now · {video.amount} <ArrowRight size={15} />
            </button>
          )}
        </div>
      </article>
      {checkout && (
        <div
          className="checkout-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setCheckout(false);
          }}
        >
          <section
            className="checkout-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`checkout-title-${video.id}`}
          >
            <span className="eyebrow">
              {activeVideoPaymentProvider.mode === "demo"
                ? "DEMO CHECKOUT"
                : "SECURE CHECKOUT"}
            </span>
            <h2 id={`checkout-title-${video.id}`}>Unlock this faculty video</h2>
            <p>{video.title}</p>
            <div className="checkout-price">{video.amount}</div>
            {activeVideoPaymentProvider.mode === "demo" && (
              <small>Demo payment only. No real charge will be made.</small>
            )}
            {paymentError && (
              <p className="form-error" role="alert">
                {paymentError}
              </p>
            )}
            <button
              className="button button-primary"
              onClick={completeVideoPurchase}
            >
              {activeVideoPaymentProvider.mode === "demo"
                ? "Complete demo payment"
                : "Pay with Razorpay"}{" "}
              <Check size={16} />
            </button>
            <button
              className="checkout-cancel"
              onClick={() => setCheckout(false)}
            >
              Cancel
            </button>
          </section>
        </div>
      )}
    </>
  );
}

function padConferences(
  rows: Conference[],
  status: Conference["status"],
  examples: string[],
): Conference[] {
  const list = rows.slice(0, 4);
  while (list.length < 4) {
    const index = list.length;
    list.push({
      id: -(status === "Live" ? 100 : 200) - index,
      name: examples[index % examples.length],
      start:
        status === "Live"
          ? "Oct 06, 2026 | 02:00 PM"
          : `Oct ${18 + index}, 2026 | 09:00 AM`,
      venue: index % 2 ? "Online" : "AIG Hospitals, Hyderabad",
      banner: "/conference-placeholder.svg",
      speciality: [
        "Uro-Oncology",
        "Endourology",
        "General Urology",
        "Andrology",
      ][index],
      amount: index % 2 ? "Free" : "INR 499",
      type: index % 2 ? "Free" : "Paid",
      status,
      attendees: 0,
    });
  }
  return list;
}

export function PublicHome() {
  const { conferences, faculty, videos } = useCatalog();
  const live = padConferences(
    conferences.filter((item) => item.status === "Live"),
    "Live",
    [
      "Live Urology Case Forum",
      "Advances in Endourology",
      "Robotic Surgery Exchange",
      "Uro-Oncology Tumor Board",
    ],
  );
  const upcoming = padConferences(
    conferences.filter((item) => item.status === "Upcoming"),
    "Upcoming",
    [
      "Urology Update 2026",
      "Endourology Masterclass",
      "Precision Oncology Summit",
      "Advances in Andrology",
    ],
  );
  const recorded = conferences
    .filter((item) => item.status === "Recorded")
    .slice(0, 4);
  while (recorded.length < 4) {
    const index = recorded.length;
    recorded.push({
      id: -400 - index,
      name: [
        "Urology Update: Expert Sessions",
        "Advances in Uro-Oncology",
        "Endourology Masterclass",
        "Clinical Practice Review",
      ][index],
      start: `Sep ${20 + index}, 2026 | 10:00 AM`,
      venue: index % 2 ? "Online | Meditalk Live" : "AIG Hospitals, Hyderabad",
      banner: "/conference-placeholder.svg",
      speciality: [
        "Uro-Oncology",
        "Endourology",
        "General Urology",
        "Andrology",
      ][index],
      amount: index % 2 ? "Free" : "INR 499",
      type: index % 2 ? "Free" : "Paid",
      status: "Recorded",
      attendees: 0,
    });
  }
  const featuredVideos = [...videos.slice(0, 4)];
  while (featuredVideos.length < 4) {
    const index = featuredVideos.length;
    const source = videos[0];
    featuredVideos.push(
      source
        ? {
            ...source,
            id: -301 - index,
            title: [
              "Clinical decision making: a practical guide",
              "New approaches to complex cases",
              "Evidence based care in practice",
              "A specialist’s guide to better outcomes",
            ][index],
            facultyId:
              faculty[index % Math.max(faculty.length, 1)]?.id ||
              source.facultyId,
            speciality:
              faculty[index % Math.max(faculty.length, 1)]?.speciality ||
              source.speciality,
          }
        : {
            id: -301 - index,
            title: [
              "Clinical decision making: a practical guide",
              "New approaches to complex cases",
              "Evidence based care in practice",
              "A specialist’s guide to better outcomes",
            ][index],
            facultyId: faculty[index % Math.max(faculty.length, 1)]?.id || -1,
            speciality:
              faculty[index % Math.max(faculty.length, 1)]?.speciality ||
              "Clinical Practice",
            link: "#",
            type: "Free",
            amount: "Free",
          },
    );
  }
  return (
    <SiteLayout>
      <main>
        {/* <section className="public-hero">
          <div className="hero-inner">
            <div className="hero-copy">
              <span className="eyebrow">
                <i /> THE MEDICAL COMMUNITY, CONNECTED
              </span>
              <h1>
                Where medical
                <br />
                knowledge <em>comes alive.</em>
              </h1>
              <p>
                Join live conferences, learn from leading faculty, and keep
                growing with a community that moves medicine forward.
              </p>
              <div className="hero-buttons">
                <Link href="#live" className="button button-primary">
                  Explore conferences <ArrowRight size={16} />
                </Link>
                <Link href="/register" className="button button-ghost">
                  Create your account
                </Link>
              </div>
              <div className="hero-proof">
                <div className="proof-avatars">
                  <span>AM</span>
                  <span>PS</span>
                  <span>RK</span>
                  <span>+</span>
                </div>
                <span>
                  Trusted by <b>medical professionals</b>
                  <br />
                  across India
                </span>
              </div>
            </div>
            <div className="hero-art">
              <div className="hero-orbit orbit-one" />
              <div className="hero-orbit orbit-two" />
              <div className="hero-stethoscope">
                <Stethoscope size={166} strokeWidth={1.05} />
              </div>
              <div className="hero-float-card">
                <span className="float-icon">
                  <Video size={17} />
                </span>
                <span>
                  <b>Learn from the best</b>
                  <small>Expert led. Always relevant.</small>
                </span>
                <span className="live-dot" />
              </div>
              <div className="hero-float-stat">
                <b>01</b>
                <span>
                  community
                  <br />
                  for clinicians
                </span>
              </div>
              <div className="hero-vertical">LEARN · SHARE · ADVANCE</div>
            </div>
          </div>
          <div className="hero-bottom">
            <span>CONTINUING MEDICAL EDUCATION</span>
            <span>LIVE CONFERENCES</span>
            <span>EXPERT FACULTY</span>
            <span>ON-DEMAND LEARNING</span>
          </div>
        </section> */}
        <section className="content-section" id="live">
          <div className="section-wrap">
            <SectionHeading
              kicker="HAPPENING NOW"
              title="Live conferences"
              href="/login"
            />
            <div className="conference-grid">
              {live.map((item) => (
                <ConferenceCard key={item.id} conference={item} />
              ))}
            </div>
          </div>
        </section>
        <section className="content-section section-tinted">
          <div className="section-wrap">
            <SectionHeading
              kicker="SAVE YOUR SEAT"
              title="Upcoming conferences"
              href="/login"
            />
            <div className="conference-grid">
              {upcoming.map((item) => (
                <ConferenceCard key={item.id} conference={item} />
              ))}
            </div>
          </div>
        </section>
        <section className="content-section">
          <div className="section-wrap">
            <SectionHeading
              // kicker="LEARN FROM LEADERS"
              title="Faculty videos"
              href="/login"
            />
            <div className="learning-grid">
              {featuredVideos.map((video) => {
                const speaker = faculty.find(
                  (person) => person.id === video.facultyId,
                ) ||
                  faculty[0] || {
                    id: -1,
                    name: "Meditalk Faculty",
                    email: "",
                    phone: "",
                    institute: "HealthcareTalk.Live",
                    speciality: video.speciality,
                  };
                return (
                  <VideoCard key={video.id} video={video} faculty={speaker} />
                );
              })}
            </div>
          </div>
        </section>
        <section className="content-section section-tinted">
          <div className="section-wrap">
            <SectionHeading
              // kicker="WATCH WHENEVER YOU’RE READY"
              title="Recorded conferences"
              href="/login"
            />
            <div className="conference-grid">
              {recorded.map((item) => (
                <ConferenceCard key={item.id} conference={item} action="view" />
              ))}
            </div>
          </div>
        </section>
        {/* <section className="join-banner" id="about">
          <div>
            <span className="eyebrow">YOUR NEXT CHAPTER STARTS HERE</span>
            <h2>
              Good medicine keeps
              <br />
              <em>learning.</em>
            </h2>
          </div>
          <p>
            Build your learning profile, follow your speciality, and keep every
            conference and faculty talk in one place.
          </p>
          <Link href="/register" className="button button-light">
            Join Meditalk Live <ArrowRight size={16} />
          </Link>
        </section> */}
      </main>
    </SiteLayout>
  );
}

export function AuthPage({ mode }: { mode: "login" | "register" }) {
  const { specialities } = useCatalog();
  const router = useRouter();
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email")).trim().toLowerCase();
    let members: (Member & { password: string })[] = [];
    try {
      members = JSON.parse(
        localStorage.getItem(MEMBERS_KEY) || "[]",
      ) as (Member & { password: string })[];
    } catch {
      members = [];
    }
    if (mode === "register") {
      const password = String(data.get("password"));
      if (password !== String(data.get("confirmPassword"))) {
        setError("Your passwords do not match.");
        return;
      }
      if (members.some((member) => member.email === email)) {
        setError("An account with this email already exists. Please sign in.");
        return;
      }
      const member = {
        name: String(data.get("name")),
        email,
        phoneCode: String(data.get("phoneCode")),
        mobile: String(data.get("mobile")),
        institute: String(data.get("institute")),
        speciality: String(data.get("speciality")),
        password,
      };
      localStorage.setItem(MEMBERS_KEY, JSON.stringify([...members, member]));
      const { password: _password, ...profile } = member;
      sessionStorage.setItem(MEMBER_KEY, JSON.stringify(profile));
      const next = new URLSearchParams(window.location.search).get("next");
      router.push(next?.startsWith("/") ? next : "/member/dashboard");
      return;
    }
    const member = members.find(
      (item) =>
        item.email === email && item.password === String(data.get("password")),
    );
    if (!member) {
      setError(
        "We couldn’t find an account with those details. Check your email and password, or register.",
      );
      return;
    }
    const { password: _password, ...profile } = member;
    sessionStorage.setItem(MEMBER_KEY, JSON.stringify(profile));
    const next = new URLSearchParams(window.location.search).get("next");
    router.push(next?.startsWith("/") ? next : "/member/dashboard");
  }
  return (
    <SiteLayout>
      <main className="auth-page">
        <form className="auth-form" onSubmit={submit}>
          <div
            className="auth-form-heading"
            style={{
              margin: "0 0 36px",

              padding: 0,
              width: "100%",
              maxWidth: "100%",
            }}
          >
            <Image
              src="/Medtalk-Logo.png"
              alt="Meditalk"
              width={220}
              height={80}
              priority
              style={{
                display: "block",
                objectFit: "contain",
                margin: "0 auto",
              }}
            />
            <h2
              style={{
                marginTop: 11,
                marginBottom: 13,
                marginLeft: 0,
                marginRight: 0,
                textAlign: "center" /* only if you want the h2 centered too */,
              }}
            >
              {mode === "login"
                ? "Sign in to your account"
                : "Join the community"}
            </h2>
          </div>
          {mode === "register" && (
            <>
              <label>
                Full Name*
                <input
                  name="name"
                  autoComplete="name"
                  placeholder="Dr. Ananya Sharma"
                  required
                />
              </label>
              <label>
                Email ID*
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@hospital.com"
                  required
                />
              </label>
              <div className="form-pair">
                <label>
                  Phone Code*
                  <FormDropdown
                    name="phoneCode"
                    defaultValue="+91"
                    options={["+91", "+1", "+44", "+971"].map((value) => ({
                      value,
                      label: value,
                    }))}
                  />
                </label>
                <label>
                  Mobile Number*
                  <input
                    name="mobile"
                    type="tel"
                    autoComplete="tel-national"
                    placeholder="98765 43210"
                    required
                  />
                </label>
              </div>
              <label>
                Hospital / Medical College / Institute Name*
                <input
                  name="institute"
                  placeholder="Your institution"
                  required
                />
              </label>
              <label>
                Speciality*
                <FormDropdown
                  name="speciality"
                  placeholder="Select Your Speciality"
                  required
                  options={specialities.map((item) => ({
                    value: item.name,
                    label: item.name,
                  }))}
                />
              </label>
            </>
          )}
          {mode === "login" && (
            <label>
              Email ID*
              <input
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@hospital.com"
                required
              />
            </label>
          )}
          <label>
            Password*
            <div className="password-wrap">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                placeholder="At least 8 characters"
                minLength={8}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </label>
          {mode === "register" && (
            <label>
              Confirm Password*
              <input
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="Enter your password again"
                minLength={8}
                required
              />
            </label>
          )}
          {mode === "register" && (
            <label className="terms-check">
              <input type="checkbox" required />
              <span>
                I confirm that my information is correct and accept the{" "}
                <Link href="#terms">Terms of Service</Link>.
              </span>
            </label>
          )}
          {error && <p className="form-error">{error}</p>}
          <button className="button button-primary auth-submit">
            {mode === "login" ? "Sign in" : "Create account"}
            <ArrowRight size={16} />
          </button>
          <p className="auth-switch">
            {mode === "login"
              ? "New to Medtalk Live?"
              : "Already have an account?"}{" "}
            <Link href={mode === "login" ? "/register" : "/login"}>
              {mode === "login" ? "Create an account" : "Sign in"}
            </Link>
          </p>
        </form>
      </main>
    </SiteLayout>
  );
}

function MemberPageFrame({
  children,
  title,
  intro,
  active = "",
}: {
  children: ReactNode;
  title?: string;
  intro?: string;
  active?: string;
}) {
  const { member, ready } = useMemberGuard();
  if (!ready || !member) return <div className="member-loading" />;
  return (
    <SiteLayout signedIn member={member}>
      <main className="member-page">
        <div className="member-welcome">
          <div>
            <span className="eyebrow">
              {active ? `MY ${active.toUpperCase()}` : "YOUR LEARNING SPACE"}
            </span>
            <h1>
              {title || `Hello, ${member.name.split(" ")[0]}`}
              <span className="welcome-mark">.</span>
            </h1>
            {intro && <p>{intro}</p>}
          </div>
          {/* <Link href="/member/profile" className="profile-shortcut">
            <span>
              {member.name
                .split(" ")
                .map((part) => part[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </span>
            <div>
              <b>{member.name}</b>
              <small>{member.speciality}</small>
            </div>
          </Link> */}
        </div>
        {children}
      </main>
    </SiteLayout>
  );
}

export function MemberDashboard() {
  const { conferences, faculty, videos } = useCatalog();
  const { member } = useMemberGuard();
  const purchasedIds = usePurchasedVideoIds(member?.email);
  if (!member) return <div className="member-loading" />;
  const relevant = conferences.filter(
    (item) =>
      (item.status === "Live" || item.status === "Upcoming") &&
      (!member.speciality || item.speciality === member.speciality),
  );
  const learn = videos
    .filter((video) => video.type === "Free" || purchasedIds.includes(video.id))
    .slice(0, 4);
  return (
    <MemberPageFrame>
      <div className="dashboard-shortcuts">
        <Link href="/member/conferences?status=Live">
          <span className="shortcut-icon live-shortcut">
            <Video />
          </span>
          <b>Live conference</b>
          <small>Join the conversation</small>
          <ArrowRight />
        </Link>
        <Link href="/member/conferences?status=Upcoming">
          <span className="shortcut-icon upcoming-shortcut">
            <CalendarDays />
          </span>
          <b>Upcoming conferences</b>
          {/* <small>Save your seat</small> */}
          <ArrowRight />
        </Link>
        <Link href="/member/conferences?status=Recorded">
          <span className="shortcut-icon recorded-shortcut">
            <Play />
          </span>
          <b>Recorded conferences</b>
          <small>Watch on demand</small>
          <ArrowRight />
        </Link>
      </div>
      <section className="member-section">
        <SectionHeading
          kicker="CURATED FOR YOU"
          title="Live & upcoming conferences"
          href="/member/conferences?status=Upcoming"
        />
        <div className="conference-grid">
          {relevant.slice(0, 4).map((item) => (
            <ConferenceCard
              key={item.id}
              conference={item}
              action="dashboard"
            />
          ))}
        </div>
        {relevant.length === 0 && (
          <div className="empty-note">No conferences are listed yet.</div>
        )}
      </section>
      <section className="member-section">
        <SectionHeading
          kicker="KEEP LEARNING"
          title="My learning"
          href="/member/videos"
        />
        <div className="learning-grid">
          {learn.map((video) => {
            const speaker = faculty.find(
              (person) => person.id === video.facultyId,
            );
            return speaker ? (
              <VideoCard
                key={video.id}
                video={video}
                faculty={speaker}
                compact
              />
            ) : null;
          })}
        </div>
        {learn.length === 0 && (
          <div className="empty-note">
            Your learning library is ready for its first video.
          </div>
        )}
      </section>
      <section className="member-section">
        <SectionHeading
          kicker="MEET YOUR PEERS"
          title="Faculty to follow"
          href="/member/faculty"
        />
        <div className="faculty-row">
          {faculty.slice(0, 4).map((person) => (
            <FacultyCard
              key={person.id}
              faculty={person}
              count={
                videos.filter((video) => video.facultyId === person.id).length
              }
            />
          ))}
        </div>
      </section>
    </MemberPageFrame>
  );
}

function FacultyCard({ faculty, count }: { faculty: Faculty; count: number }) {
  return (
    <Link href={`/member/faculty/${faculty.id}`} className="faculty-card">
      <span className="faculty-avatar">
        {faculty.name
          .replace("Dr. ", "")
          .split(" ")
          .map((part) => part[0])
          .slice(0, 2)
          .join("")}
      </span>
      <div>
        <h3>{faculty.name}</h3>
        <p>{faculty.speciality}</p>
        <small>{faculty.institute}</small>
        <b>
          {count} {count === 1 ? "video" : "videos"}
          <ArrowRight size={13} />
        </b>
      </div>
    </Link>
  );
}

export function ConferenceListing() {
  const { conferences } = useCatalog();
  const search = useSearchParams();
  const status = search.get("status") || "Live";
  const list = conferences.filter((item) => item.status === status);
  return (
    <MemberPageFrame
      title={status === "Live" ? "Live conferences" : `${status} conferences`}
      intro="Explore medical meetings curated for your learning."
      active="conferences"
    >
      <div className="filter-tabs">
        {["Live", "Upcoming", "Recorded"].map((item) => (
          <Link
            key={item}
            href={`/member/conferences?status=${item}`}
            className={status === item ? "selected" : ""}
          >
            {item}
            <span>
              {conferences.filter((event) => event.status === item).length}
            </span>
          </Link>
        ))}
      </div>
      {list.length ? (
        <div className="conference-grid">
          {list.map((item) => (
            <ConferenceCard
              key={item.id}
              conference={item}
              action={status === "Recorded" ? "view" : "dashboard"}
            />
          ))}
        </div>
      ) : (
        <div className="empty-note">
          No {status.toLowerCase()} conferences yet. We’ll share new sessions
          here as soon as they’re announced.
        </div>
      )}
    </MemberPageFrame>
  );
}

export function FacultyDirectory() {
  const { faculty, videos } = useCatalog();
  const [query, setQuery] = useState("");
  const results = useMemo(
    () =>
      faculty.filter((item) =>
        `${item.name} ${item.speciality} ${item.institute}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [faculty, query],
  );
  return (
    <MemberPageFrame
      title="Meet the faculty"
      intro="Learn from specialists sharing experience from the front line."
      active="faculty"
    >
      <div className="directory-search">
        <Search />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search faculty by name, speciality, or hospital"
        />
      </div>
      <div className="faculty-directory">
        {results.map((person) => (
          <FacultyCard
            key={person.id}
            faculty={person}
            count={
              videos.filter((video) => video.facultyId === person.id).length
            }
          />
        ))}
      </div>
      {results.length === 0 && (
        <div className="empty-note">No faculty match that search.</div>
      )}
    </MemberPageFrame>
  );
}

export function FacultyDetail() {
  const { id } = useParams<{ id: string }>();
  const { faculty, videos } = useCatalog();
  const person = faculty.find((item) => item.id === Number(id));
  const list = videos.filter((video) => video.facultyId === Number(id));
  return (
    <MemberPageFrame
      title={person?.name || "Faculty profile"}
      intro={
        person
          ? `${person.speciality} · ${person.institute}`
          : "Faculty profile"
      }
      active="faculty"
    >
      <Link href="/member/faculty" className="back-to">
        ← All faculty
      </Link>
      {person && (
        <>
          <div className="faculty-profile">
            <span className="faculty-avatar large">
              {person.name
                .replace("Dr. ", "")
                .split(" ")
                .map((part) => part[0])
                .slice(0, 2)
                .join("")}
            </span>
            <div>
              <span className="eyebrow">{person.speciality}</span>
              <h2>{person.name}</h2>
              <p>{person.institute}</p>
            </div>
            <span className="faculty-video-count">
              <Video />
              {list.length} videos
            </span>
          </div>
          <section className="member-section">
            <SectionHeading title="Faculty videos" />
            <div className="learning-grid">
              {list.map((video) => (
                <VideoCard key={video.id} video={video} faculty={person} />
              ))}
            </div>
            {list.length === 0 && (
              <div className="empty-note">
                This faculty member has not published a video yet.
              </div>
            )}
          </section>
        </>
      )}
    </MemberPageFrame>
  );
}

export function LearningPage() {
  const { faculty, videos } = useCatalog();
  const { member } = useMemberGuard();
  const purchasedIds = usePurchasedVideoIds(member?.email);
  const learningVideos = videos.filter(
    (video) => video.type === "Free" || purchasedIds.includes(video.id),
  );
  return (
    <MemberPageFrame
      title="My learning"
      intro="Free videos and the paid videos you’ve unlocked."
      active="learning"
    >
      <section className="member-section">
        <SectionHeading title="Faculty videos" />
        <div className="learning-grid">
          {learningVideos.map((video) => {
            const speaker = faculty.find(
              (person) => person.id === video.facultyId,
            );
            return speaker ? (
              <VideoCard key={video.id} video={video} faculty={speaker} />
            ) : null;
          })}
        </div>
        {learningVideos.length === 0 && (
          <div className="empty-note">
            Your learning library is ready for its first video.
          </div>
        )}
      </section>
    </MemberPageFrame>
  );
}

export function ProfilePage() {
  const { member } = useMemberGuard();
  const { specialities } = useCatalog();
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  if (!member) return <div className="member-loading" />;
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const next = {
      name: String(data.get("name")),
      email: member!.email,
      phoneCode: String(data.get("phoneCode")),
      mobile: String(data.get("mobile")),
      institute: String(data.get("institute")),
      speciality: String(data.get("speciality")),
    };
    sessionStorage.setItem(MEMBER_KEY, JSON.stringify(next));
    let members: (Member & { password: string })[] = [];
    try {
      members = JSON.parse(
        localStorage.getItem(MEMBERS_KEY) || "[]",
      ) as (Member & { password: string })[];
    } catch {
      /* Use an empty local profile list. */
    }
    localStorage.setItem(
      MEMBERS_KEY,
      JSON.stringify(
        members.map((item) =>
          item.email === next.email ? { ...item, ...next } : item,
        ),
      ),
    );
    setSaved(true);
  }
  return (
    <MemberPageFrame
      title="My profile"
      intro="Keep your details and speciality up to date."
      active="profile"
    >
      <form className="profile-form" onSubmit={save}>
        <label>
          Full Name*
          <input name="name" defaultValue={member.name} required />
        </label>
        <label>
          Email ID
          <input type="email" value={member.email} readOnly />
        </label>
        <div className="form-pair">
          <label>
            Phone Code
            <FormDropdown
              name="phoneCode"
              defaultValue={member.phoneCode}
              options={["+91", "+1", "+44", "+971"].map((value) => ({
                value,
                label: value,
              }))}
            />
          </label>
          <label>
            Mobile Number
            <input name="mobile" defaultValue={member.mobile} required />
          </label>
        </div>
        <label>
          Hospital / Medical College / Institute Name*
          <input name="institute" defaultValue={member.institute} required />
        </label>
        <label>
          Speciality*
          <FormDropdown
            name="speciality"
            defaultValue={member.speciality}
            required
            options={Array.from(
              new Set([
                member.speciality,
                ...specialities.map((item) => item.name),
              ]),
            ).map((value) => ({ value, label: value }))}
          />
        </label>
        {saved && (
          <p className="success-note">
            <Check />
            Profile saved.
          </p>
        )}
        <button className="button button-primary">
          Save profile <ArrowRight size={15} />
        </button>
        <button
          type="button"
          className="logout-button"
          onClick={() => {
            sessionStorage.removeItem(MEMBER_KEY);
            router.push("/");
          }}
        >
          Log out
        </button>
      </form>
    </MemberPageFrame>
  );
}
