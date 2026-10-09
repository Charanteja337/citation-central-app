import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RoadWatch — Report Traffic Violations" },
      { name: "description", content: "Report traffic violations with vehicle number, location and date." },
      { property: "og:title", content: "RoadWatch — Report Traffic Violations" },
      { property: "og:description", content: "Report traffic violations with vehicle number, location and date." },
    ],
  }),
  component: Index,
});

const TYPES: [string, ...string[]] = ["Signal jumping", "Over-speeding", "No helmet", "No seatbelt", "Wrong-side driving", "Illegal parking", "Phone while driving", "Other"];

const input = "w-full rounded-sm border border-input bg-background px-3 py-2 text-foreground outline-none focus:border-ring";
const btn = "rounded-sm bg-primary px-4 py-2 font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50";

function Index() {
  return (
    <div className="min-h-screen font-sans">
      <div className="hazard-stripe h-2" />
      <header className="mx-auto max-w-6xl px-6 py-5">
        <h1 className="font-display text-2xl tracking-tight">ROAD<span className="text-primary">WATCH</span></h1>
        <p className="mt-2 text-muted-foreground">Saw a violation? Log the vehicle, location and date.</p>
      </header>
      <Dashboard />
    </div>
  );
}

const empty = { vehicle_number: "", violation_type: TYPES[0], location: "", violation_date: new Date().toISOString().slice(0, 10), description: "" };

function Dashboard() {
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const payload = {
      ...form,
      vehicle_number: form.vehicle_number.toUpperCase().slice(0, 20),
      location: form.location.slice(0, 200),
      description: form.description.slice(0, 1000),
    };
    const { error } = await supabase.from("violations").insert(payload);
    setBusy(false);
    if (!error) {
      setForm(empty);
      setDone(true);
    }
  }

  return (
    <main className="mx-auto max-w-6xl space-y-10 px-6 pb-20">
      <form onSubmit={submit} className="grid gap-4 rounded-sm border border-border bg-card p-6 md:grid-cols-2">
        <h2 className="font-display text-xl md:col-span-2">New report</h2>
        <input className={input} required placeholder="Vehicle number (e.g. TS09AB1234)" value={form.vehicle_number} onChange={(e) => setForm({ ...form, vehicle_number: e.target.value })} />
        <select className={input} value={form.violation_type} onChange={(e) => setForm({ ...form, violation_type: e.target.value })}>
          {TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
        <input className={input} required placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
        <input className={input} type="date" required value={form.violation_date} onChange={(e) => setForm({ ...form, violation_date: e.target.value })} />
        <textarea className={`${input} md:col-span-2`} rows={2} placeholder="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <div />
        <div className="flex justify-end">
          <button className={btn} disabled={busy}>{busy ? "Saving…" : "Submit report"}</button>
        </div>
      </form>

      {done && (
        <p className="rounded-sm border border-border bg-card p-4 text-success">
          Thank you — your report was submitted and will be reviewed.
        </p>
      )}

      <section className="rounded-sm border border-border bg-card p-6">
        <h2 className="font-display text-xl">Reports</h2>
        <p className="mt-2 text-muted-foreground">
          Submitted reports are reviewed privately and are not shown publicly.
        </p>
      </section>
    </main>
  );
}
