"use client";

import Image from "next/image";
import { useState, type CSSProperties } from "react";
import { FaGraduationCap, FaHeadset, FaLinkedinIn, FaPlug } from "react-icons/fa6";
import { FOUNDER_IMAGE } from "./ContactCard";

/* ---------- data shape (messages/*.json "cloud.team", shared with /deck) ---------- */

export interface TeamMember {
  /** Picks the photo from TEAM_IMAGES; "team" is the wider-team card with a group avatar. */
  key: string;
  name: string;
  /** Two short chips: the title, capitalised, split in two. */
  roles: string[];
  bio: string;
  /** Absent on the wider-team card. */
  linkedin?: string;
}

export interface TeamData {
  label: string;
  title: string;
  lead: string;
  linkedin: string;
  members: TeamMember[];
}

/** Photos live on the CDN next to the founder's, 400x400 each. */
export const TEAM_IMAGES: Record<string, string> = {
  younes: FOUNDER_IMAGE,
  abdullah: "https://cdn.wolffi.sh/generic/hazmi.jpeg",
  sana: "https://cdn.wolffi.sh/generic/sana.jpeg",
};

type Theme = "light" | "dark";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("");

/** The wider team: three overlapping circles for the functions around the founders. */
function GroupAvatar({ theme }: { theme: Theme }) {
  const circle =
    theme === "light"
      ? "bg-emerald-50 border-white text-emerald-700"
      : "bg-[#0c1a33] border-[#0a1428] text-emerald-300";
  return (
    <div aria-hidden className="flex items-center">
      {[FaPlug, FaGraduationCap, FaHeadset].map((Icon, i) => (
        <span
          key={i}
          className={`w-11 h-11 rounded-full border-2 flex items-center justify-center ${circle} ${
            i > 0 ? "-ms-3" : ""
          }`}
        >
          <Icon className="w-4 h-4" />
        </span>
      ))}
    </div>
  );
}

/** Round photo, with the person's initials if the image is missing or fails. */
function Avatar({ member, theme }: { member: TeamMember; theme: Theme }) {
  const [failed, setFailed] = useState(false);
  const src = TEAM_IMAGES[member.key];
  const ring = theme === "light" ? "border-neutral-200" : "border-white/15";
  if (member.key === "team") return <GroupAvatar theme={theme} />;
  if (!src || failed) {
    return (
      <div
        aria-hidden
        className={`w-16 h-16 rounded-full border flex items-center justify-center text-lg font-semibold ${ring} ${
          theme === "light" ? "bg-emerald-50 text-emerald-700" : "bg-white/10 text-white"
        }`}
      >
        {initials(member.name)}
      </div>
    );
  }
  return (
    <Image
      src={src}
      alt={member.name}
      width={160}
      height={160}
      onError={() => setFailed(true)}
      className={`w-16 h-16 rounded-full object-cover border shadow-sm ${ring}`}
    />
  );
}

/**
 * The three co-founders, as cards. Light on /cloud, dark on /deck. With
 * `reveal`, each card carries the deck's staggered reveal attributes.
 */
export default function TeamCards({
  team,
  theme,
  reveal = false,
  firstIndex = 0,
}: {
  team: TeamData;
  theme: Theme;
  reveal?: boolean;
  firstIndex?: number;
}) {
  const light = theme === "light";
  const card = light
    ? "bg-white border-neutral-200"
    : "bg-white/5 border-white/10 backdrop-blur-sm";
  const name = light ? "text-neutral-900" : "text-white";
  const chipFirst = light
    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
    : "bg-emerald-400/10 border-emerald-400/30 text-emerald-200";
  const chipRest = light
    ? "bg-neutral-100 border-neutral-200 text-neutral-700"
    : "bg-white/10 border-white/15 text-white/80";
  const bio = light ? "text-neutral-600" : "text-white/60";
  const link = light
    ? "bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:text-neutral-900"
    : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white";

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {team.members.map((member, i) => (
        <div
          key={member.key}
          data-reveal={reveal ? "" : undefined}
          style={reveal ? ({ "--i": firstIndex + i } as CSSProperties) : undefined}
          className={`rounded-2xl border p-5 flex flex-col gap-4 ${card}`}
        >
          <div className="flex items-center gap-4">
            <Avatar member={member} theme={theme} />
            <div className={`min-w-0 text-[15px] font-semibold leading-snug ${name}`}>
              {member.name}
            </div>
          </div>
          {/* Two chips, one row: they sit under the name so a phone-width card still fits both. */}
          <div className="flex flex-wrap gap-1.5">
            {member.roles.map((chip, i) => (
              <span
                key={chip}
                className={`inline-flex items-center whitespace-nowrap px-2.5 py-1 rounded-full border text-[11px] font-semibold ${
                  i === 0 ? chipFirst : chipRest
                }`}
              >
                {chip}
              </span>
            ))}
          </div>
          <p className={`text-[13px] leading-relaxed text-pretty ${bio}`}>{member.bio}</p>
          {member.linkedin && (
            <a
              href={member.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${team.linkedin}: ${member.name}`}
              className={`mt-auto inline-flex items-center gap-2 self-start px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${link}`}
            >
              <FaLinkedinIn className="w-3 h-3" />
              {team.linkedin}
            </a>
          )}
        </div>
      ))}
    </div>
  );
}
