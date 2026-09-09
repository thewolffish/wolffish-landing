"use client";

import Image from "next/image";
import { useState, type FormEvent } from "react";
import { FaArrowRight, FaCheck, FaTriangleExclamation } from "react-icons/fa6";
import { FOUNDER_IMAGE } from "./ContactCard";

export interface ScheduleFormUi {
  name: string;
  email: string;
  company: string;
  role: string;
  seats: string;
  seatsOptions: string[];
  seatsNote: string;
  when: string;
  whenPlaceholder: string;
  message: string;
  messagePlaceholder: string;
  submit: string;
  sending: string;
  successTitle: string;
  successBody: string;
  errorTitle: string;
  errorBody: string;
  privacy: string;
}

type Status = "idle" | "sending" | "success" | "error";

const FIELD =
  "w-full rounded-xl bg-white border border-neutral-200 px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-colors";
const LABEL = "block text-[12px] font-medium text-neutral-500 mb-1.5";

/**
 * The "book a call" form at the foot of /cloud. Posts to
 * /api/schedule, which sends a confirmation to the requester and a
 * notification to the founder through Resend. The founder's photo sits on
 * the form so the request has a face on the other end.
 */
export default function ScheduleCallForm({
  ui,
  locale,
  founderName,
  founderRole,
}: {
  ui: ScheduleFormUi;
  locale: string;
  founderName: string;
  founderRole: string;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [seats, setSeats] = useState("");
  const underFloor = seats !== "" && seats === ui.seatsOptions[0];

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    setStatus("sending");
    try {
      const res = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, locale }),
      });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean };
      if (!res.ok || !json.ok) throw new Error("send failed");
      setStatus("success");
      form.reset();
      setSeats("");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-2xl bg-white border border-emerald-200 p-6 md:p-8">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 shrink-0 rounded-full bg-emerald-600 text-white flex items-center justify-center">
            <FaCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="text-lg font-bold text-neutral-900 tracking-tight">
              {ui.successTitle}
            </div>
            <p className="mt-1.5 text-sm leading-relaxed text-neutral-600">
              {ui.successBody}
            </p>
            <div className="mt-4 flex items-center gap-3">
              <Image
                src={FOUNDER_IMAGE}
                alt={founderName}
                width={96}
                height={96}
                className="w-9 h-9 rounded-full object-cover border border-neutral-200"
              />
              <div className="text-[13px] leading-snug">
                <div className="font-semibold text-neutral-900">{founderName}</div>
                <div className="text-neutral-500">{founderRole}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl bg-white border border-neutral-200 p-6 md:p-8"
      noValidate={false}
    >
      <div className="flex items-center gap-3 mb-6">
        <Image
          src={FOUNDER_IMAGE}
          alt={founderName}
          width={96}
          height={96}
          className="w-11 h-11 rounded-full object-cover border border-neutral-200"
        />
        <div className="text-[13px] leading-snug">
          <div className="font-semibold text-neutral-900">{founderName}</div>
          <div className="text-neutral-500">{founderRole}</div>
        </div>
      </div>

      {/* Honeypot, hidden from people, filled by bots. */}
      <div className="hidden" aria-hidden="true">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="sc-name" className={LABEL}>
            {ui.name}
          </label>
          <input
            id="sc-name"
            name="name"
            type="text"
            required
            maxLength={120}
            autoComplete="name"
            className={FIELD}
          />
        </div>
        <div>
          <label htmlFor="sc-email" className={LABEL}>
            {ui.email}
          </label>
          <input
            id="sc-email"
            name="email"
            type="email"
            required
            maxLength={200}
            autoComplete="email"
            dir="ltr"
            className={`${FIELD} text-start`}
          />
        </div>
        <div>
          <label htmlFor="sc-company" className={LABEL}>
            {ui.company}
          </label>
          <input
            id="sc-company"
            name="company"
            type="text"
            required
            maxLength={160}
            autoComplete="organization"
            className={FIELD}
          />
        </div>
        <div>
          <label htmlFor="sc-role" className={LABEL}>
            {ui.role}
          </label>
          <input
            id="sc-role"
            name="role"
            type="text"
            required
            maxLength={120}
            autoComplete="organization-title"
            className={FIELD}
          />
        </div>
        <div>
          <label htmlFor="sc-seats" className={LABEL}>
            {ui.seats}
          </label>
          <select
            id="sc-seats"
            name="seats"
            required
            value={seats}
            onChange={(e) => setSeats(e.target.value)}
            className={`${FIELD} ${seats ? "" : "text-neutral-400"}`}
          >
            <option value="" disabled />
            {ui.seatsOptions.map((option) => (
              <option key={option} value={option} className="text-neutral-900">
                {option}
              </option>
            ))}
          </select>
          {underFloor && (
            <p className="mt-1.5 text-[12px] leading-relaxed text-amber-700">
              {ui.seatsNote}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="sc-when" className={LABEL}>
            {ui.when}
          </label>
          <input
            id="sc-when"
            name="when"
            type="text"
            maxLength={300}
            placeholder={ui.whenPlaceholder}
            className={FIELD}
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="sc-message" className={LABEL}>
            {ui.message}
          </label>
          <textarea
            id="sc-message"
            name="message"
            rows={4}
            maxLength={3000}
            placeholder={ui.messagePlaceholder}
            className={`${FIELD} resize-y`}
          />
        </div>
      </div>

      {status === "error" && (
        <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
          <FaTriangleExclamation className="w-3.5 h-3.5 mt-0.5 text-red-500 shrink-0" />
          <div className="text-[13px] leading-relaxed text-red-800">
            <span className="font-semibold">{ui.errorTitle}</span> {ui.errorBody}
          </div>
        </div>
      )}

      <div className="mt-5 flex flex-col sm:flex-row sm:items-center gap-3">
        <button
          type="submit"
          disabled={status === "sending"}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-wait text-white text-sm font-semibold transition-colors cursor-pointer"
        >
          {status === "sending" ? ui.sending : ui.submit}
          <FaArrowRight className="w-3 h-3 rtl:rotate-180" />
        </button>
        <p className="text-[12px] leading-relaxed text-neutral-400">{ui.privacy}</p>
      </div>
    </form>
  );
}
