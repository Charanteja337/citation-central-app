import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RoadWatch — Report Traffic Violations" },
      { name: "description", content: "Report, review and manage traffic violations with photos, locations and dates." },
      { property: "og:title", content: "RoadWatch — Report Traffic Violations" },
      { property: "og:description", content: "Report, review and manage traffic violations with photos, locations and dates." },
    ],
  }),
  component: Index,
});

type Violation = {
  id: string;
  reporter_id: string;
  vehicle_number: string;
  violation_type: string;
  location: string;
  violation_date: string;
  description: string | null;
  image_path: string | null;
  status: string;
};

const TYPES: [string, ...string[]] = ["Signal jumping", "Over-speeding", "No helmet", "No seatbelt", "Wrong-side driving", "Illegal parking", "Phone while driving", "Other"];
const STATUSES = ["pending", "verified", "rejected"];

const input = "w-full rounded-sm border border-input bg-background px-3 py-2 text-foreground outline-none focus:border-ring";
const btn = "rounded-sm bg-primary px-4 py-2 font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50";

function Index() {
  return (
    <div className="min-h-screen font-sans">
      <div className="hazard-stripe h-2" />
      <header className="mx-auto max-w-6xl px-6 py-5">
        <h1 className="font-display text-2xl tracking-tight">ROAD<span className="text-primary">WATCH</span></h1>
        <p className="mt-2 text-muted-foreground">Saw a violation? Log the vehicle, location, date and a photo.</p>
      </header>
      <Dashboard />
    </div>
  );
}

const empty = { vehicle_number: "", violation_type: TYPES[0], location: "", violation_date: new Date().toISOString().slice(0, 10), description: "" };

function Dashboard() {
  const uid = "public";
  const isAdmin = false;
  const [rows, setRows] = useState<Violation[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [form, setForm] = useState(empty);
  const [file, setFile] = useState<File | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  async function load() {
    const { data } = await supabase.from("violations").select("*").order("created_at", { ascending: false });
    const list = (data ?? []) as Violation[];
    setRows(list);
    const paths: string[] = [];
    if (paths.length) {
      const { data: signed } = await supabase.storage.from("violation-images").createSignedUrls(paths, 3600);
      const map: Record<string, string> = {};
      signed?.forEach((s) => { if (s.path && s.signedUrl) map[s.path] = s.signedUrl; });
      setUrls(map);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    let image_path: string | undefined;
    if (file) {
      const path = `${uid}/${crypto.randomUUID()}-${file.name.replace(/[^\w.]/g, "_")}`;
      const { error } = await supabase.storage.from("violation-images").upload(path, file);
      if (!error) image_path = path;
    }
    const payload = { ...form, vehicle_number: form.vehicle_number.toUpperCase().slice(0, 20), location: form.location.slice(0, 200), description: form.description.slice(0, 1000), ...(image_path ? { image_path } : {}) };
    if (editing) await supabase.from("violations").update(payload).eq("id", editing);
    else await supabase.from("violations").insert(payload);
    setForm(empty); setFile(null); setEditing(null); setBusy(false);
        load();
  }

  function edit(v: Violation) {
    setEditing(v.id);
    setForm({ vehicle_number: v.vehicle_number, violation_type: v.violation_type, location: v.location, violation_date: v.violation_date, description: v.description ?? "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function remove(id: string) {
    if (!confirm("Delete this report?")) return;
    await supabase.from("violations").delete().eq("id", id);
    load();
  }

  async function setStatus(id: string, status: string) {
    await supabase.from("violations").update({ status }).eq("id", id);
    load();
  }

  const shown = rows.filter((r) => (filter === "all" || r.status === filter) &&
    (r.vehicle_number + r.location + r.violation_type).toLowerCase().includes(search.toLowerCase()));
  const count = (s: string) => rows.filter((r) => r.status === s).length;

  return (
    <main className="mx-auto max-w-6xl space-y-10 px-6 pb-20">
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[["Total", rows.length], ["Pending", count("pending")], ["Verified", count("verified")], ["Rejected", count("rejected")]].map(([l, n]) => (
          <div key={l} className="rounded-sm border border-border bg-card p-4">
            <div className="text-sm text-muted-foreground">{l}</div>
            <div className="font-display text-3xl">{n}</div>
          </div>
        ))}
      </section>

      <form onSubmit={submit} className="grid gap-4 rounded-sm border border-border bg-card p-6 md:grid-cols-2">
        <h2 className="font-display text-xl md:col-span-2">{editing ? "Edit report" : "New report"}</h2>
        <input className={input} required placeholder="Vehicle number (e.g. TS09AB1234)" value={form.vehicle_number} onChange={(e) => setForm({ ...form, vehicle_number: e.target.value })} />
        <select className={input} value={form.violation_type} onChange={(e) => setForm({ ...form, violation_type: e.target.value })}>
          {TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
        <input className={input} required placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
        <input className={input} type="date" required value={form.violation_date} onChange={(e) => setForm({ ...form, violation_date: e.target.value })} />
        <textarea className={`${input} md:col-span-2`} rows={2} placeholder="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <div />
        <div className="flex justify-end gap-2">
          {editing && <button type="button" className="px-4 py-2 text-muted-foreground" onClick={() => { setEditing(null); setForm(empty); }}>Cancel</button>}
          <button className={btn} disabled={busy}>{busy ? "Saving…" : editing ? "Update" : "Submit report"}</button>
        </div>
      </form>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-display mr-auto text-xl">Reports</h2>
          <input className={`${input} w-56`} placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <select className={`${input} w-36`} value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All</option>
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        {shown.length === 0 && <p className="text-muted-foreground">No reports yet.</p>}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {shown.map((v) => {
            const mine = false;
            return (
              <article key={v.id} className="overflow-hidden rounded-sm border border-border bg-card">
                {v.image_path && urls[v.image_path]
                  ? <img src={urls[v.image_path]} alt={v.violation_type} className="h-44 w-full object-cover" />
                  : <div className="hazard-stripe h-2 opacity-60" />}
                <div className="space-y-2 p-4">
                  <div className="flex items-center justify-between">
                    <span className="rounded-sm bg-primary px-2 py-0.5 font-display text-sm text-primary-foreground">{v.vehicle_number}</span>
                    <span className={`text-xs font-semibold uppercase ${v.status === "verified" ? "text-success" : v.status === "rejected" ? "text-destructive" : "text-muted-foreground"}`}>{v.status}</span>
                  </div>
                  <h3 className="font-semibold">{v.violation_type}</h3>
                  <p className="text-sm text-muted-foreground">📍 {v.location} · {v.violation_date}</p>
                  {v.description && <p className="text-sm">{v.description}</p>}
                  <div className="flex flex-wrap gap-3 pt-2 text-sm">
                    {(mine || isAdmin) && <button className="text-primary underline" onClick={() => edit(v)}>Edit</button>}
                    {(mine || isAdmin) && <button className="text-destructive underline" onClick={() => remove(v.id)}>Delete</button>}
                    {isAdmin && (
                      <select className="ml-auto rounded-sm border border-input bg-background px-2 text-xs" value={v.status} onChange={(e) => setStatus(v.id, e.target.value)}>
                        {STATUSES.map((s) => <option key={s}>{s}</option>)}
                      </select>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
