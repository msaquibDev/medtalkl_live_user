"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  CalendarDays,
  Clock3,
  MapPin,
  Play,
  Stethoscope,
  Video,
} from "lucide-react";
import type { Conference, Faculty, FacultyVideo, Member } from "@/lib/catalog/model";

const MEMBER_SESSION_KEY = "meditalk-member";

function currentMember(): Member | null {
  try {
    return JSON.parse(sessionStorage.getItem(MEMBER_SESSION_KEY) || "null") as Member | null;
  } catch {
    return null;
  }
}

export function useMemberGuard() {
  const router = useRouter();
  const [member, setMember] = useState<Member | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const current = currentMember();
    setMember(current);
    setReady(true);
    if (!current) router.replace("/login");
  }, [router]);

  return { member, ready };
}

export function MemberPageFrame({
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
      </div>
      {children}
    </main>
  );
}

export function ConferenceCard({
  conference,
  action = "register",
  purchased = false,
}: {
  conference: Conference;
  action?: "register" | "dashboard" | "view";
  purchased?: boolean;
}) {
  const [date, time] = conference.start.split("|").map((part) => part.trim());
  const buttonText =
    action === "view"
      ? conference.status === "Recorded" ? "View recording" : "View conference"
      : action === "dashboard"
        ? conference.type === "Paid" && !purchased
          ? "Pay now"
          : conference.status === "Live"
            ? "Join now"
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
        <p className="info-line"><CalendarDays />{date}{conference.end ? ` – ${conference.end.split("|")[0].trim()}` : ""}</p>
        <p className="info-line"><Clock3 />{time || "Time to be announced"}</p>
        <p className="info-line"><MapPin />{conference.venue}</p>
        {conference.agenda ? (
          <a className="agenda-link" href={conference.agenda} target="_blank" rel="noreferrer" download>
            <ArrowDownToLine />Download Agenda
          </a>
        ) : (
          <span className="agenda-link is-disabled" aria-disabled="true">
            <ArrowDownToLine />Download Agenda
          </span>
        )}
        <div className="card-tags">
          <span>{conference.speciality || "Conference"}</span>
          <span>{conference.type}</span>
        </div>
        <a
          className={`button conference-cta ${action === "view" ? "button-outline" : "button-primary"}`}
          href={action === "register" ? "/register" : action === "dashboard" && conference.type === "Paid" && !purchased ? `/member/checkout/conference/${conference.id}` : conference.type === "Paid" || !conference.accessLink ? `/member/conferences/${conference.id}` : conference.accessLink}
          target={action === "register" || conference.type === "Paid" || !conference.accessLink ? undefined : "_blank"}
          rel={conference.accessLink ? "noreferrer" : undefined}
        >
          {buttonText}
          {conference.status === "Live" && action === "dashboard" ? <Play size={14} fill="currentColor" /> : <ArrowRight size={15} />}
        </a>
      </div>
    </article>
  );
}

export function SectionHeading({
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
      {href && <Link href={href}>{link}<ArrowRight size={16} /></Link>}
    </div>
  );
}

export function VideoCard({
  video,
  faculty,
  compact = false,
  purchased = false,
}: {
  video: FacultyVideo;
  faculty: Faculty;
  compact?: boolean;
  purchased?: boolean;
}) {
  return (
    <Link
      href={video.type === "Paid" && !purchased ? `/member/checkout/video/${video.id}` : `/member/videos/${video.id}`}
      className={`conference-card faculty-video-card ${compact ? "compact" : ""}`}
    >
      <div className="conference-cover video-thumb">
        <span className="play-button"><Play size={17} fill="currentColor" /></span>
        <span className="video-duration">{video.type === "Paid" ? video.amount : "Free"}</span>
      </div>
      <div className="conference-card-body">
        <div className="conference-title-row">
          <h3>{video.title}</h3>
          <span className={`price-tag ${video.type.toLowerCase()}`}>{video.type}</span>
        </div>
        <p className="info-line"><Video />{faculty.name}</p>
        <p className="info-line"><Stethoscope />{video.speciality}</p>
        <p className="info-line"><MapPin />{faculty.institute}</p>
        <div className="card-tags"><span>Faculty Video</span><span>{video.type}</span></div>
        <span className="button conference-cta button-primary">
          {video.type === "Paid" && !purchased ? `Pay now · ${video.amount}` : "View Video"}{" "}
          <ArrowRight size={15} />
        </span>
      </div>
    </Link>
  );
}
