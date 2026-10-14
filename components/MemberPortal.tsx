"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  MapPin,
  Play,
  Search,
  UsersRound,
  Video,
} from "lucide-react";
import { useCatalog } from "@/components/CatalogProvider";
import type {
  Conference,
  Faculty,
  FacultyVideo,
  Member,
} from "@/lib/catalog/model";
import { FormDropdown } from "@/components/FormDropdown";
import { SiteLayout } from "@/components/MemberSiteLayout";
import {
  ConferenceCard,
  MemberPageFrame,
  SectionHeading,
  useMemberGuard,
  VideoCard,
} from "@/components/MemberComponents";

const MEMBER_KEY = "meditalk-member";
const MEMBERS_KEY = "meditalk-members";

type LearningEntitlements = { videoIds: number[]; conferenceIds: number[] };
const EMPTY_ENTITLEMENTS: LearningEntitlements = {
  videoIds: [],
  conferenceIds: [],
};
const DEMO_LEARNING_KEY = "medtalk-demo-learning";
const demoLearningKey = (email?: string) =>
  `${DEMO_LEARNING_KEY}:${email?.toLowerCase() || "guest"}`;

function readDemoLearning(email?: string): LearningEntitlements {
  try {
    const saved = JSON.parse(
      localStorage.getItem(demoLearningKey(email)) || "null",
    ) as Partial<LearningEntitlements> | null;
    return {
      videoIds: Array.isArray(saved?.videoIds)
        ? saved.videoIds.filter(Number.isInteger)
        : [],
      conferenceIds: Array.isArray(saved?.conferenceIds)
        ? saved.conferenceIds.filter(Number.isInteger)
        : [],
    };
  } catch {
    return EMPTY_ENTITLEMENTS;
  }
}

function usePurchasedLearning(email?: string): LearningEntitlements {
  const [entitlements, setEntitlements] =
    useState<LearningEntitlements>(EMPTY_ENTITLEMENTS);
  useEffect(() => {
    if (!email) {
      setEntitlements(EMPTY_ENTITLEMENTS);
      return;
    }
    let current = true;
    const demo = readDemoLearning(email);
    fetch("/api/member/my-learning", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok)
          throw new Error("Could not load your purchased items.");
        return (await response.json()) as Partial<LearningEntitlements>;
      })
      .then((result) => {
        if (current) {
          setEntitlements({
            videoIds: Array.from(
              new Set([
                ...demo.videoIds,
                ...(Array.isArray(result.videoIds)
                  ? result.videoIds.filter(Number.isInteger)
                  : []),
              ]),
            ),
            conferenceIds: Array.from(
              new Set([
                ...demo.conferenceIds,
                ...(Array.isArray(result.conferenceIds)
                  ? result.conferenceIds.filter(Number.isInteger)
                  : []),
              ]),
            ),
          });
        }
      })
      .catch(() => {
        if (current) setEntitlements(demo);
      });
    return () => {
      current = false;
    };
  }, [email]);
  return entitlements;
}

export function FacultyVideoDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { faculty, videos } = useCatalog();
  const { member } = useMemberGuard();
  const video = featuredFacultyVideos(videos, faculty).find(
    (item) => item.id === Number(id),
  );
  const speaker = video ? videoFaculty(video, faculty) : undefined;
  const purchased = usePurchasedLearning(member?.email);
  const unlocked =
    video?.type === "Free" ||
    Boolean(video && purchased.videoIds.includes(video.id));
  const playableLink = Boolean(
    video?.link &&
    video.link !== "#" &&
    !video.link.includes("video.meditalk.in/"),
  );

  return (
    <MemberPageFrame
      title={video?.title || "Faculty Video"}
      intro={
        speaker
          ? `${speaker.name} · ${video?.speciality}`
          : "Watch expert faculty sessions."
      }
      active="learning"
    >
      <Link
        href={speaker ? `/member/faculty/${speaker.id}` : "/member/videos"}
        className="back-to"
      >
        Back to Faculty Videos
      </Link>
      {video && speaker ? (
        <article className="video-detail-card">
          <div className="video-detail-player">
            {unlocked && playableLink ? (
              <iframe
                src={videoEmbedUrl(video.link)}
                title={video.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : unlocked ? (
              <div className="video-paywall">
                <span className="play-button">
                  <Play size={22} fill="currentColor" />
                </span>
                <h2>Video Coming Soon</h2>
                <p>
                  This demo video will be playable once its video link is
                  connected.
                </p>
              </div>
            ) : (
              <div className="video-paywall">
                <span className="play-button">
                  <Play size={22} fill="currentColor" />
                </span>
                <h2>Unlock this faculty video</h2>
                <p>
                  Complete payment to watch this session and add it to My
                  Learning.
                </p>
                <strong>{video.amount}</strong>
                <button
                  className="button button-primary"
                  type="button"
                  onClick={() =>
                    router.push(`/member/checkout/video/${video.id}`)
                  }
                >
                  Pay now <ArrowRight size={16} />
                </button>
              </div>
            )}
          </div>
          <div className="video-detail-copy">
            <div>
              <span className={`price-tag ${video.type.toLowerCase()}`}>
                {video.type}
              </span>
              <span className="eyebrow">{video.speciality}</span>
            </div>
            <h1>{video.title}</h1>
            <p>
              Presented by{" "}
              <Link href={`/member/faculty/${speaker.id}`}>{speaker.name}</Link>{" "}
              · {speaker.institute}
            </p>
            {unlocked && playableLink && (
              <a
                className="button button-outline"
                href={video.link}
                target="_blank"
                rel="noreferrer"
              >
                Open Video in New Tab <ArrowRight size={15} />
              </a>
            )}
          </div>
        </article>
      ) : (
        <div className="empty-note">This video could not be found.</div>
      )}
    </MemberPageFrame>
  );
}

function videoEmbedUrl(link: string) {
  try {
    const url = new URL(link);
    if (url.hostname.includes("youtu.be"))
      return `https://www.youtube-nocookie.com/embed/${url.pathname.slice(1)}`;
    if (url.hostname.includes("youtube.com")) {
      const id = url.searchParams.get("v");
      if (id) return `https://www.youtube-nocookie.com/embed/${id}`;
      if (url.pathname.startsWith("/embed/")) return link;
    }
    if (url.hostname.includes("vimeo.com")) {
      const id = url.pathname.split("/").filter(Boolean).pop();
      if (id) return `https://player.vimeo.com/video/${id}`;
    }
  } catch {
    /* Use the provided video URL as an iframe source. */
  }
  return link;
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

function featuredConferences(conferences: Conference[]) {
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
  return [live[0], upcoming[0], live[1], upcoming[1]];
}

function allLearningConferences(conferences: Conference[]) {
  const items = new Map(
    conferences.map((conference) => [conference.id, conference]),
  );
  for (const conference of featuredConferences(conferences)) {
    items.set(conference.id, conference);
  }
  return Array.from(items.values());
}

const DUMMY_HALL_SESSIONS = [
  {
    id: "hall-a-day-1",
    hall: "Hall A",
    day: "Day 1",
    title: "Opening Clinical Session",
    length: "42 min",
  },
  {
    id: "hall-b-day-1",
    hall: "Hall B",
    day: "Day 1",
    title: "Expert Case Discussions",
    length: "36 min",
  },
  {
    id: "hall-a-day-2",
    hall: "Hall A",
    day: "Day 2",
    title: "Advances in Surgical Practice",
    length: "51 min",
  },
  {
    id: "hall-b-day-2",
    hall: "Hall B",
    day: "Day 2",
    title: "Research and Clinical Updates",
    length: "29 min",
  },
];

function featuredFacultyVideos(videos: FacultyVideo[], faculty: Faculty[]) {
  const list = videos.slice(0, 4);
  const titles = [
    "Clinical Decision Making: A Practical Guide",
    "New Approaches to Complex Cases",
    "Evidence Based Care in Practice",
    "A Specialist's Guide to Better Outcomes",
  ];
  while (list.length < 4) {
    const index = list.length;
    const source = videos[0];
    const person = faculty[index % Math.max(faculty.length, 1)];
    list.push(
      source
        ? {
            ...source,
            id: -301 - index,
            title: titles[index],
            facultyId: person?.id ?? source.facultyId,
            speciality: person?.speciality ?? source.speciality,
          }
        : {
            id: -301 - index,
            title: titles[index],
            facultyId: person?.id ?? -1,
            speciality: person?.speciality ?? "Clinical Practice",
            link: "",
            type: "Free",
            amount: "Free",
          },
    );
  }
  return list;
}

function videoFaculty(video: FacultyVideo, faculty: Faculty[]): Faculty {
  return (
    faculty.find((person) => person.id === video.facultyId) || {
      id: video.facultyId,
      name: "Meditalk Faculty",
      email: "",
      phone: "",
      institute: "Meditalk Live",
      speciality: video.speciality,
    }
  );
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
      <main className="member-home">
        {/* <section className="home-hero">
          <div className="home-hero-copy">
            <h1>Medtalk.live</h1>
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

export function MemberDashboard() {
  const { conferences, faculty, videos } = useCatalog();
  const { member } = useMemberGuard();
  const purchased = usePurchasedLearning(member?.email);
  if (!member) return <div className="member-loading" />;
  const relevant = featuredConferences(conferences);
  const featuredVideos = featuredFacultyVideos(videos, faculty);
  const learningConferences = allLearningConferences(conferences).filter(
    (item) => purchased.conferenceIds.includes(item.id),
  );
  const learn = featuredVideos
    .filter((video) => purchased.videoIds.includes(video.id))
    .slice(0, 4);
  const shortcuts = [
    {
      href: "/member/conferences?status=Live",
      title: "Live Conferences",
      description: "Join sessions happening now",
      icon: Video,
      tone: "live-shortcut",
    },
    {
      href: "/member/conferences?status=Upcoming",
      title: "Upcoming Conferences",
      description: "Explore what is coming next",
      icon: CalendarDays,
      tone: "upcoming-shortcut",
    },
    {
      href: "/member/conferences?status=Recorded",
      title: "Recorded Conferences",
      description: "Watch conference recordings",
      icon: Play,
      tone: "recorded-shortcut",
    },
    {
      href: "/member/faculty",
      title: "Faculty",
      description: "Meet expert clinicians",
      icon: UsersRound,
      tone: "faculty-shortcut",
    },
    {
      href: "/member/videos",
      title: "Faculty Video",
      description: "Browse talks and lessons",
      icon: Video,
      tone: "faculty-video-shortcut",
    },
    {
      href: "/member/learning",
      title: "My Learning",
      description: `${purchased.videoIds.length + purchased.conferenceIds.length} paid item${purchased.videoIds.length + purchased.conferenceIds.length === 1 ? "" : "s"} unlocked`,
      icon: BookOpen,
      tone: "learning-shortcut",
    },
  ];
  return (
    <MemberPageFrame>
      <div className="dashboard-shortcuts">
        {shortcuts.map(({ href, title, description, icon: Icon, tone }) => (
          <Link href={href} key={title} className="dashboard-shortcut-card">
            <span className={`shortcut-icon ${tone}`}>
              <Icon />
            </span>
            <b>{title}</b>
            <small>{description}</small>
            <ArrowRight />
          </Link>
        ))}
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
              purchased={purchased.conferenceIds.includes(item.id)}
            />
          ))}
        </div>
        {relevant.length === 0 && (
          <div className="empty-note">No conferences are listed yet.</div>
        )}
      </section>
      <section className="member-section">
        <SectionHeading
          kicker="LEARN FROM EXPERTS"
          title="Faculty Videos"
          href="/member/videos"
        />
        <div className="learning-grid">
          {featuredVideos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              faculty={videoFaculty(video, faculty)}
              purchased={purchased.videoIds.includes(video.id)}
            />
          ))}
        </div>
      </section>
      <section className="member-section">
        <SectionHeading
          kicker="KEEP LEARNING"
          title="My learning"
          href="/member/learning"
        />
        <div className="conference-grid">
          {learningConferences.map((conference) => (
            <ConferenceCard
              key={conference.id}
              conference={conference}
              action="view"
            />
          ))}
        </div>
        <div className="learning-grid">
          {learn.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              faculty={videoFaculty(video, faculty)}
              compact
              purchased
            />
          ))}
        </div>
        {learn.length === 0 && learningConferences.length === 0 && (
          <div className="empty-note">
            Your learning library is ready for its first video or conference.
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
  const { member } = useMemberGuard();
  const purchased = usePurchasedLearning(member?.email);
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
              purchased={purchased.conferenceIds.includes(item.id)}
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

export function ConferenceDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { conferences } = useCatalog();
  const { member } = useMemberGuard();
  const conference =
    conferences.find((item) => item.id === Number(id)) ||
    featuredConferences(conferences).find((item) => item.id === Number(id));
  const purchased = usePurchasedLearning(member?.email);
  const [date, time] =
    conference?.start.split("|").map((part) => part.trim()) || [];
  const hasAccess = Boolean(
    conference &&
    (conference.type === "Free" ||
      purchased.conferenceIds.includes(conference.id)),
  );

  return (
    <MemberPageFrame
      title={conference?.name || "Conference Details"}
      intro={
        conference
          ? `${conference.status} · ${date || "Date to be announced"}`
          : "Conference details"
      }
      active="conferences"
    >
      <Link
        href={`/member/conferences?status=${conference?.status || "Live"}`}
        className="back-to"
      >
        Back to Conferences
      </Link>
      {conference ? (
        <>
          <article className="conference-detail-card">
            <div className="conference-detail-cover">
              <Image
                src={conference.banner || "/conference-placeholder.svg"}
                alt={`${conference.name} cover`}
                fill
                sizes="(max-width: 700px) 92vw, 900px"
                unoptimized
              />
              <span
                className={`conference-state ${conference.status.toLowerCase()}`}
              >
                {conference.status === "Live" ? <i /> : null}
                {conference.status}
              </span>
            </div>
            <div className="conference-detail-copy">
              <div className="card-tags">
                <span>{conference.speciality || "Conference"}</span>
                <span>{conference.type}</span>
              </div>
              <h2>{conference.name}</h2>
              <p>
                <CalendarDays /> {date || "Date to be announced"}
                {time ? ` · ${time}` : ""}
              </p>
              <p>
                <MapPin /> {conference.venue || "Venue to be announced"}
              </p>
              {conference.type === "Paid" && !hasAccess ? (
                <div className="conference-paywall">
                  <strong>{conference.amount}</strong>
                  <span>Purchase access to join or watch this conference.</span>
                  <button
                    className="button button-primary"
                    type="button"
                    onClick={() =>
                      router.push(
                        `/member/checkout/conference/${conference.id}`,
                      )
                    }
                  >
                    Pay now <ArrowRight size={16} />
                  </button>
                </div>
              ) : (
                <div className="conference-session-intro">
                  <Video />
                  <span>Choose a hall and day below to view its sessions.</span>
                </div>
              )}
            </div>
          </article>
          <section className="conference-sessions">
            <div className="section-heading">
              <div>
                <span className="eyebrow">CONFERENCE PROGRAM</span>
                <h2>Hall-wise videos</h2>
              </div>
              <span className="conference-session-count">
                {DUMMY_HALL_SESSIONS.length} Sessions
              </span>
            </div>
            <div className="conference-session-grid">
              {DUMMY_HALL_SESSIONS.map((session, index) => (
                <article
                  className={`conference-session-card tone-${index % 4}`}
                  key={session.id}
                >
                  <div className="conference-session-cover">
                    <span>{session.hall}</span>
                    <b>{session.day}</b>
                    <div className="conference-session-play">
                      <Play size={22} fill="currentColor" />
                    </div>
                    <small>{session.length}</small>
                  </div>
                  <div className="conference-session-body">
                    <span className="eyebrow">
                      {conference.status === "Recorded"
                        ? "RECORDED SESSION"
                        : `${conference.status.toUpperCase()} SESSION`}
                    </span>
                    <h3>{session.title}</h3>
                    <p>
                      {session.hall} · {session.day}
                    </p>
                    {hasAccess ? (
                      <Link
                        className="button button-outline"
                        href={`/member/conferences/${conference.id}/sessions/${session.id}`}
                      >
                        {conference.status === "Live"
                          ? "Join Hall"
                          : conference.status === "Recorded"
                            ? "Watch Video"
                            : "View Session"}
                        <ArrowRight size={15} />
                      </Link>
                    ) : (
                      <button
                        className="button button-outline"
                        type="button"
                        onClick={() =>
                          router.push(
                            `/member/checkout/conference/${conference.id}`,
                          )
                        }
                      >
                        Pay to Watch <ArrowRight size={15} />
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        </>
      ) : (
        <div className="empty-note">This conference could not be found.</div>
      )}
    </MemberPageFrame>
  );
}

export function ConferenceSessionDetail() {
  const { id, sessionId } = useParams<{ id: string; sessionId: string }>();
  const router = useRouter();
  const { conferences } = useCatalog();
  const { member } = useMemberGuard();
  const conference =
    conferences.find((item) => item.id === Number(id)) ||
    featuredConferences(conferences).find((item) => item.id === Number(id));
  const session = DUMMY_HALL_SESSIONS.find((item) => item.id === sessionId);
  const purchased = usePurchasedLearning(member?.email);
  const hasAccess = Boolean(
    conference &&
    (conference.type === "Free" ||
      purchased.conferenceIds.includes(conference.id)),
  );
  const playableLink = Boolean(
    conference?.accessLink &&
    conference.accessLink !== "#" &&
    !conference.accessLink.includes("video.meditalk.in/"),
  );

  return (
    <MemberPageFrame
      title={session?.title || "Conference Video"}
      intro={
        conference
          ? `${session?.hall || "Hall"} | ${session?.day || "Day"} | ${conference.name}`
          : "Watch a conference session."
      }
      active="conferences"
    >
      <Link href={`/member/conferences/${id}`} className="back-to">
        Back to {conference?.name || "Conference"}
      </Link>
      {conference && session ? (
        <article className="video-detail-card">
          <div className="video-detail-player">
            {!hasAccess ? (
              <div className="video-paywall">
                <span className="play-button">
                  <Play size={22} fill="currentColor" />
                </span>
                <h2>Unlock This Conference</h2>
                <p>Purchase conference access to watch this hall and day.</p>
                <strong>{conference.amount}</strong>
                <button
                  className="button button-primary"
                  type="button"
                  onClick={() =>
                    router.push(`/member/checkout/conference/${conference.id}`)
                  }
                >
                  Pay now <ArrowRight size={16} />
                </button>
              </div>
            ) : conference.status === "Upcoming" ? (
              <div className="video-paywall">
                <span className="play-button">
                  <Play size={22} fill="currentColor" />
                </span>
                <h2>Session Starts Soon</h2>
                <p>
                  This hall video will be available when the conference begins.
                </p>
              </div>
            ) : playableLink ? (
              <iframe
                src={videoEmbedUrl(conference.accessLink!)}
                title={`${session.title} - ${session.hall}, ${session.day}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : (
              <div className="video-paywall">
                <span className="play-button">
                  <Play size={22} fill="currentColor" />
                </span>
                <h2>Video Coming Soon</h2>
                <p>
                  This demo session is ready for its hall-specific video link
                  from the admin API.
                </p>
              </div>
            )}
          </div>
          <div className="video-detail-copy">
            <div>
              <span className="price-tag free">{session.hall}</span>
              <span className="eyebrow">
                {session.day} | {conference.status}
              </span>
            </div>
            <h1>{session.title}</h1>
            <p>
              {conference.name} | {conference.venue}
            </p>
            {hasAccess && playableLink && conference.status !== "Upcoming" && (
              <a
                className="button button-outline"
                href={conference.accessLink}
                target="_blank"
                rel="noreferrer"
              >
                Open Video in New Tab <ArrowRight size={15} />
              </a>
            )}
          </div>
        </article>
      ) : (
        <div className="empty-note">
          This conference session could not be found.
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
  const { member } = useMemberGuard();
  const purchased = usePurchasedLearning(member?.email);
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
        All faculty
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
                <VideoCard
                  key={video.id}
                  video={video}
                  faculty={person}
                  purchased={purchased.videoIds.includes(video.id)}
                />
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

export function FacultyVideosPage() {
  const { faculty, videos } = useCatalog();
  const { member } = useMemberGuard();
  const purchased = usePurchasedLearning(member?.email);
  const catalogVideos = featuredFacultyVideos(videos, faculty);
  return (
    <MemberPageFrame
      title="Faculty Videos"
      intro="Watch free sessions or unlock paid videos from our expert faculty."
      active="learning"
    >
      <section className="member-section">
        <SectionHeading title="All Faculty Videos" />
        <div className="learning-grid">
          {catalogVideos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              faculty={videoFaculty(video, faculty)}
              purchased={purchased.videoIds.includes(video.id)}
            />
          ))}
        </div>
      </section>
    </MemberPageFrame>
  );
}

export function DemoCheckoutPage() {
  const { type, id } = useParams<{ type: string; id: string }>();
  const router = useRouter();
  const { conferences, faculty, videos } = useCatalog();
  const { member } = useMemberGuard();
  const itemId = Number(id);
  const video =
    type === "video"
      ? videos.find((entry) => entry.id === itemId) ||
        featuredFacultyVideos(videos, faculty).find(
          (entry) => entry.id === itemId,
        )
      : undefined;
  const conference =
    type === "conference"
      ? conferences.find((entry) => entry.id === itemId) ||
        featuredConferences(conferences).find((entry) => entry.id === itemId)
      : undefined;
  const title = video?.title || conference?.name;
  const amount = video?.amount || conference?.amount;
  const speaker = video ? videoFaculty(video, faculty) : undefined;

  function simulatePayment() {
    if (!member || !title || !amount) return;
    const current = readDemoLearning(member.email);
    const next: LearningEntitlements = video
      ? {
          ...current,
          videoIds: Array.from(new Set([...current.videoIds, video.id])),
        }
      : {
          ...current,
          conferenceIds: Array.from(
            new Set([...current.conferenceIds, conference!.id]),
          ),
        };
    localStorage.setItem(demoLearningKey(member.email), JSON.stringify(next));
    router.push(
      video
        ? `/member/videos/${video.id}`
        : `/member/conferences/${conference!.id}`,
    );
  }

  if (!member) return <div className="member-loading" />;
  return (
    <MemberPageFrame
      title="Checkout"
      intro="Review your item before continuing."
      active="learning"
    >
      <Link
        href={
          speaker
            ? `/member/faculty/${speaker.id}`
            : video
              ? "/member/videos"
              : "/member/conferences"
        }
        className="back-to"
      >
        ← Back
      </Link>
      {title && amount && (video || conference) ? (
        <section className="demo-checkout-card">
          <div className="demo-checkout-heading">
            <span className="eyebrow">DEMO CHECKOUT</span>
            <h2>Complete Your Purchase</h2>
            <p>This is a sample checkout. No real payment will be taken.</p>
          </div>
          <div className="demo-checkout-item">
            <div>
              <span>{video ? "Faculty Video" : "Conference"}</span>
              <h3>{title}</h3>
              {speaker && (
                <p>
                  {speaker.name} · {video?.speciality}
                </p>
              )}
              {conference && (
                <p>
                  {conference.status} · {conference.venue}
                </p>
              )}
            </div>
            <strong>{amount}</strong>
          </div>
          <div className="demo-checkout-note">
            <strong>Demo payment mode</strong>
            <span>
              Completing this step unlocks the item and adds it to My Learning.
              A payment API can replace this flow later.
            </span>
          </div>
          <button
            className="button button-primary demo-checkout-submit"
            type="button"
            onClick={simulatePayment}
          >
            Complete Demo Payment <ArrowRight size={16} />
          </button>
        </section>
      ) : (
        <div className="empty-note">This paid item could not be found.</div>
      )}
    </MemberPageFrame>
  );
}

export function LearningPage() {
  const { conferences, faculty, videos } = useCatalog();
  const { member } = useMemberGuard();
  const purchased = usePurchasedLearning(member?.email);
  const learningVideos = featuredFacultyVideos(videos, faculty).filter(
    (video) => purchased.videoIds.includes(video.id),
  );
  const learningConferences = allLearningConferences(conferences).filter(
    (conference) => purchased.conferenceIds.includes(conference.id),
  );
  const hasLearning =
    learningVideos.length > 0 || learningConferences.length > 0;
  return (
    <MemberPageFrame
      title="My learning"
      intro="Your purchased faculty videos and conferences, ready to continue."
      active="learning"
    >
      {learningConferences.length > 0 && (
        <section className="member-section">
          <SectionHeading title="Purchased Conferences" />
          <div className="conference-grid">
            {learningConferences.map((conference) => (
              <ConferenceCard
                key={conference.id}
                conference={conference}
                action="view"
              />
            ))}
          </div>
        </section>
      )}
      {learningVideos.length > 0 && (
        <section className="member-section">
          <SectionHeading title="Purchased Faculty Videos" />
          <div className="learning-grid">
            {learningVideos.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                faculty={videoFaculty(video, faculty)}
                purchased
              />
            ))}
          </div>
        </section>
      )}
      {!hasLearning && (
        <div className="empty-note">
          Your learning library is ready for its first video or conference.
        </div>
      )}
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
    window.dispatchEvent(new Event("medtalk:member-updated"));
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
