"use client";

import { useState, type FormEvent } from "react";

type Status = { state: "idle" } | { state: "sending" } | { state: "sent" } | { state: "error"; message: string };

export default function ContactForm({
  propertyId,
  propertyTitle,
  brokerName,
}: {
  propertyId: string;
  propertyTitle: string;
  brokerName: string;
}) {
  const [status, setStatus] = useState<Status>({ state: "idle" });

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    setStatus({ state: "sending" });
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, propertyId }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus({ state: "error", message: body.error ?? "Something went wrong. Please try again." });
        return;
      }
      form.reset();
      setStatus({ state: "sent" });
    } catch {
      setStatus({ state: "error", message: "Couldn't reach the server. Please try again." });
    }
  }

  if (status.state === "sent") {
    return (
      <div role="status" className="rounded-lg bg-brand-50 p-4 text-sm text-brand-800">
        <p className="font-semibold">Message sent</p>
        <p className="mt-1">{brokerName} will get back to you about {propertyTitle} shortly.</p>
        <button
          type="button"
          onClick={() => setStatus({ state: "idle" })}
          className="mt-3 font-semibold underline"
        >
          Send another message
        </button>
      </div>
    );
  }

  const input =
    "mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100";

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <label className="block text-sm font-medium text-slate-700">
        Name
        <input name="name" required autoComplete="name" maxLength={100} className={input} />
      </label>
      <label className="block text-sm font-medium text-slate-700">
        Email
        <input name="email" type="email" required autoComplete="email" maxLength={200} className={input} />
      </label>
      <label className="block text-sm font-medium text-slate-700">
        Phone <span className="font-normal text-slate-400">(optional)</span>
        <input name="phone" type="tel" autoComplete="tel" maxLength={40} className={input} />
      </label>
      <label className="block text-sm font-medium text-slate-700">
        Message
        <textarea
          name="message"
          required
          rows={4}
          maxLength={2000}
          defaultValue={`I'm interested in ${propertyTitle}. Please send me more information, including the offering memorandum.`}
          className={input}
        />
      </label>
      {status.state === "error" && (
        <p role="alert" className="text-sm text-red-700">
          {status.message}
        </p>
      )}
      <button
        type="submit"
        disabled={status.state === "sending"}
        className="w-full rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60"
      >
        {status.state === "sending" ? "Sending…" : "Contact broker"}
      </button>
    </form>
  );
}
