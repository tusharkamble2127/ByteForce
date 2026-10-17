import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const QrScanner = lazy(() => import("@/components/QrScanner"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GatePass — QR Event Check-In" },
      { name: "description", content: "Register attendees, issue unique QR passes and verify entry at the door." },
      { property: "og:title", content: "GatePass — QR Event Check-In" },
      { property: "og:description", content: "Register attendees, issue QR passes, and check people in without duplicates." },
    ],
  }),
  component: App,
});

type Attendee = {
  id: string; name: string; email: string; event_name: string; ticket_type: string; code: string;
  checked_in_at: string | null; created_at: string;
};
type Result = { status: "ok" | "duplicate" | "invalid"; name?: string; ticket_type?: string; at?: string };

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);
  if (!ready) return <div className="min-h-screen" />;
  return session ? <Dashboard email={session.user.email ?? ""} /> : <AuthScreen />;
}

function Logo() {
  return (
    <div className="flex items-center gap-2 font-bold tracking-tight text-xl">
      <span className="grid h-8 w-8 place-items-center rounded-md bg-primary font-mono text-sm text-primary-foreground">GP</span>
      GatePass
    </div>
  );
}


function AuthScreen() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);

    const { error, data } =
      mode === "in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: window.location.origin,
            },
          });

    setBusy(false);

    if (error) {
      toast.error(error.message);
    } else if (mode === "up") {
      if (data.session) {
        toast.success("Account created successfully! You are now signed in.");
      } else {
        toast.success(
          "Account created! Please check your email to confirm your account."
        );
      }
    }
  };

  const google = async () => {
    const r = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (r.error) toast.error("Google sign-in failed");
  };

  return (
    <main className="auth-cinematic">
      <section className="auth-panel">
        <div className="auth-panel-inner">
          <div className="auth-brand">
            <Logo />
            <span className="auth-brand-tag">EVENT OPERATIONS</span>
          </div>

          <div className="auth-copy">
            <span className="auth-eyebrow">
              <span className="auth-live-dot" />
              YOUR EVENT. UNDER CONTROL.
            </span>

            <h1>
              Doors open.
              <br />
              <span>Lines don’t.</span>
            </h1>

            <p>
              Seamless entry starts here. Manage your attendees, issue digital
              passes, and keep every check-in moving.
            </p>
          </div>

          <form onSubmit={submit} className="auth-form">
            <div className="auth-form-heading">
              <h2>{mode === "in" ? "Welcome back" : "Create your account"}</h2>
              <p>
                {mode === "in"
                  ? "Sign in to your organizer workspace."
                  : "Set up your organizer account to get started."}
              </p>
            </div>

            <label className="auth-field">
              <span>Email address</span>
              <Input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>

            <label className="auth-field">
              <span>Password</span>
              <Input
                type="password"
                required
                minLength={6}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>

            <Button
              type="submit"
              className="auth-primary-button w-full"
              disabled={busy}
            >
              {busy
                ? "Please wait..."
                : mode === "in"
                  ? "Sign in to GatePass →"
                  : "Create organizer account →"}
            </Button>
          </form>

          <div className="auth-divider">
            <span />
            <p>OR CONTINUE WITH</p>
            <span />
          </div>

          <Button
            type="button"
            variant="outline"
            className="auth-google-button w-full"
            onClick={google}
          >
            Continue with Google
          </Button>

          <p className="auth-switch">
            {mode === "in" ? "New to GatePass?" : "Already have an account?"}
            <button
              type="button"
              onClick={() => setMode(mode === "in" ? "up" : "in")}
            >
              {mode === "in" ? "Create an account" : "Sign in"}
            </button>
          </p>

          <p className="auth-legal">
            Secure organizer access · Built for smoother event entry
          </p>
        </div>
      </section>

      <aside className="auth-visual" aria-label="Live event atmosphere">
        <div className="auth-visual-image" />

        <div className="auth-visual-content">
          <div className="auth-visual-top">
            <span className="auth-image-pill">
              <span className="auth-live-dot" />
              THE SHOW STARTS HERE
            </span>
            <span className="auth-image-index">GP / 001</span>
          </div>

          <div className="auth-visual-bottom">
            <p className="auth-image-kicker">
              LESS WAITING. MORE EXPERIENCING.
            </p>

            <h2>
              Every arrival
              <br />
              <span>sets the tone.</span>
            </h2>

            <p className="auth-image-description">
              One pass. One scan. A better way to welcome every guest.
            </p>

            <div className="auth-floating-card">
              <div className="auth-floating-icon">✓</div>
              <div>
                <strong>Entry, simplified.</strong>
                <p>Fast QR-based check-in</p>
              </div>
              <span className="auth-floating-status">READY</span>
            </div>
          </div>
        </div>
      </aside>
    </main>
  );
}


function Dashboard({ email }: { email: string }) {
  const [tab, setTab] = useState<"attendees" | "verify">("attendees");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "checked">("all");
  const [list, setList] = useState<Attendee[]>([]);
  const [pass, setPass] = useState<Attendee | null>(null);
  const load = useCallback(async () => {
    const { data, error } = await supabase.from("attendees").select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message); else setList(data as Attendee[]);
  }, []);
  useEffect(() => { load(); }, [load]);
  const checked = list.filter((a) => a.checked_in_at).length;
  const pct = list.length ? Math.round((checked / list.length) * 100) : 0;

  return (
    
<div className="dashboard-shell relative mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-10 py-6 md:py-8 premium-bg">

      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
        <Logo />
        
<div className="dashboard-user-actions">
  <div className="dashboard-profile">
    <div className="dashboard-avatar">
      <svg
        viewBox="0 0 24 24"
        width="20"
        height="20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M20 21a8 8 0 0 0-16 0" />
        <circle cx="12" cy="8" r="4" />
      </svg>
      <span className="dashboard-online-dot" />
    </div>

    <div className="dashboard-profile-info">
      <span className="dashboard-profile-label">ORGANIZER ACCOUNT</span>
      <span className="dashboard-profile-email">{email}</span>
    </div>
  </div>

  <button
    type="button"
    className="dashboard-signout"
    onClick={async () => {
      const { error } = await supabase.auth.signOut();
      if (error) toast.error(error.message);
    }}
    title="Sign out"
    aria-label="Sign out"
  >
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M10 17l5-5-5-5" />
      <path d="M15 12H3" />
      <path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" />
    </svg>
    <span>Sign out</span>
  </button>
</div>

      </header>

      <section className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
        <Stat label="Registered" value={list.length} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>} />
        <Stat label="Checked in" value={checked} accent icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
        <Stat label="Remaining" value={list.length - checked} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
      </section>
      <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted border border-border">
        <div className="h-full bg-primary transition-all duration-500 ease-out rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-2 text-right font-mono text-sm text-muted-foreground">{pct}% attendance</p>

      <nav className="mt-8 inline-flex rounded-lg bg-card p-1 border border-border">
        {(["attendees", "verify"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-md px-4 py-2 text-sm font-medium capitalize transition-all duration-200 ${tab === t ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}>
            {t === "verify" ? "Check-in" : "Attendees"}
          </button>
        ))}
      </nav>

      <div className="mt-6">
        {tab === "attendees"
          ? <Attendees list={list} statusFilter={statusFilter} setStatusFilter={setStatusFilter} onAdded={(a) => { setList([a, ...list]); setPass(a); }} onOpen={setPass} />
          : <Verify onDone={load} />}
      </div>
      {pass && <PassModal a={pass} onClose={() => setPass(null)} />}
    </div>
  );
}

function Stat({ label, value, accent, icon }: { label: string; value: number; accent?: boolean; icon?: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card p-5 hover:border-primary/30 transition-colors duration-200">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{label}</p>
        {icon && <div className={`p-2 rounded-lg ${accent ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>{icon}</div>}
      </div>
      <p className={`mt-1 font-mono text-3xl font-bold ${accent ? "text-primary" : ""}`}>{value}</p>
    </div>
  );
}

function Attendees({ list, statusFilter, setStatusFilter, onAdded, onOpen }: { list: Attendee[]; statusFilter: "all" | "pending" | "checked"; setStatusFilter: (value: "all" | "pending" | "checked") => void; onAdded: (a: Attendee) => void; onOpen: (a: Attendee) => void }) {
  const [f, setF] = useState({ name: "", email: "", event_name: "", ticket_type: "General" });
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; event_name?: string }>({});
  
  const validateForm = () => {
    const newErrors: { name?: string; email?: string; event_name?: string } = {};
    
    if (!f.name.trim()) {
      newErrors.name = "Name is required";
    } else if (f.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }
    
    if (!f.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    
    if (!f.event_name.trim()) {
      newErrors.event_name = "Event name is required";
    } else if (f.event_name.trim().length < 2) {
      newErrors.event_name = "Event name must be at least 2 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setBusy(true);
    const payload = { ...f, name: f.name.trim(), email: f.email.trim(), event_name: f.event_name.trim() };
    const { data, error } = await supabase.from("attendees").insert(payload).select().single();
    setBusy(false);
    
    if (error) { 
      toast.error(error.message); 
      return; 
    }
    
    toast.success(`Pass issued for ${f.name}`);
    onAdded(data as Attendee); 
    setF({ name: "", email: "", event_name: f.event_name, ticket_type: f.ticket_type });
    setErrors({});
  };
  
  const shown = useMemo(() => {
    const s = q.toLowerCase();
    return list.filter((a) => {
      const matchesSearch = [a.name, a.email, a.event_name, a.code].some((v) => v.toLowerCase().includes(s));
      const matchesStatus = statusFilter === "all"
        || (statusFilter === "checked" && Boolean(a.checked_in_at))
        || (statusFilter === "pending" && !a.checked_in_at);
      return matchesSearch && matchesStatus;
    });
  }, [list, q, statusFilter]);
  
  return (
    <div className="grid gap-6 lg:grid-cols-[350px_1fr]">
      <form onSubmit={add} className="space-y-4 rounded-xl border bg-card p-5 self-start">
        <h2 className="font-semibold text-lg">Register attendee</h2>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Full name <span className="text-destructive">*</span></label>
          <Input 
            required 
            placeholder="Enter full name" 
            value={f.name} 
            onChange={(e) => {
              setF({ ...f, name: e.target.value });
              if (errors.name) setErrors({ ...errors, name: undefined });
            }}
            className={errors.name ? "border-destructive" : ""}
          />
          {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Email <span className="text-destructive">*</span></label>
          <Input 
            required 
            type="email" 
            placeholder="Enter email address" 
            value={f.email} 
            onChange={(e) => {
              setF({ ...f, email: e.target.value });
              if (errors.email) setErrors({ ...errors, email: undefined });
            }}
            className={errors.email ? "border-destructive" : ""}
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Event name <span className="text-destructive">*</span></label>
          <Input
            required
            placeholder="e.g. ACM Buildathon 2026"
            value={f.event_name}
            onChange={(e) => {
              setF({ ...f, event_name: e.target.value });
              if (errors.event_name) setErrors({ ...errors, event_name: undefined });
            }}
            className={errors.event_name ? "border-destructive" : ""}
          />
          {errors.event_name && <p className="text-xs text-destructive">{errors.event_name}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Ticket type</label>
          <select 
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            value={f.ticket_type} 
            onChange={(e) => setF({ ...f, ticket_type: e.target.value })}
          >
            {["General",
  "VIP",
  "Speaker",
  "Volunteer",
  "Student",
  "Faculty",
  "Organizer",
  "Sponsor / Guest",
  "Media / Press",
  "Exhibitor"].map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        
        <Button className="w-full" disabled={busy}>
          {busy ? "Issuing..." : "Issue pass"}
        </Button>
      </form>
      
      <div className="space-y-4">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <Input 
            placeholder="Search name, email or code…" 
            value={q} 
            onChange={(e) => setQ(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="attendee-status-filters" role="group" aria-label="Filter attendees by check-in status">
          {([
            { value: "all", label: "All", count: list.length },
            { value: "pending", label: "Pending", count: list.filter((a) => !a.checked_in_at).length },
            { value: "checked", label: "Checked in", count: list.filter((a) => Boolean(a.checked_in_at)).length },
          ] as const).map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setStatusFilter(filter.value)}
              className={`attendee-filter ${statusFilter === filter.value ? "active" : ""}`}
              aria-pressed={statusFilter === filter.value}
            >
              {filter.label}
              <span>{filter.count}</span>
            </button>
          ))}
        </div>

        <ul className="divide-y rounded-xl border bg-card overflow-hidden">
          {shown.length === 0 && (
            <li className="p-8 text-center text-sm text-muted-foreground">
              {q ? "No attendees match your search and filter." : statusFilter !== "all" ? `No ${statusFilter === "checked" ? "checked-in" : "pending"} attendees.` : "No attendees registered yet."}
            </li>
          )}
          {shown.map((a) => (
            <li key={a.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 hover:bg-muted/50 transition-colors">
              <div className="min-w-0 flex-1 w-full">
                <p className="font-medium truncate">{a.name}</p>
                <p className="mt-1 truncate text-xs text-primary">{a.event_name || "Legacy attendee — event not set"}</p>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{a.ticket_type}</span>
                  <p className="truncate text-xs text-muted-foreground">{a.email}</p>
                </div>
                <p className="text-xs font-mono text-muted-foreground mt-1">{a.code}</p>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${a.checked_in_at ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
                  {a.checked_in_at ? "Checked in" : "Pending"}
                </span>
                <Button size="sm" variant="outline" className="flex-1 sm:flex-none" onClick={() => onOpen(a)}>View pass</Button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function PassModal({ a, onClose }: { a: Attendee; onClose: () => void }) {
  const status = a.checked_in_at ? "Checked In" : "Valid";
  const statusColor = a.checked_in_at ? "text-muted-foreground" : "text-primary";
  
  const handlePrint = () => {
    // Keep the existing browser print flow; the print stylesheet controls the ticket layout.
    window.print();
  };

  const handleDownload = async () => {
    const ticketElement = document.querySelector('[data-ticket="true"]') as HTMLElement | null;
    const qrElement = ticketElement?.querySelector('[data-qr-code="true"] svg') as SVGSVGElement | null;

    if (!ticketElement || !qrElement) {
      toast.error("Ticket or QR code is not ready yet. Please try again.");
      return;
    }

    try {
      // Draw the ticket directly to a canvas. This avoids html2canvas failures with
      // newer CSS color functions and unsupported effects in the app stylesheet.
      const scale = 2;
      const width = 720;
      const padding = 44;
      const headerHeight = 150;
      const qrSize = 260;
      const detailsStart = 600;
      const height = 900;
      const canvas = document.createElement("canvas");
      canvas.width = width * scale;
      canvas.height = height * scale;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas is not supported by this browser.");
      ctx.scale(scale, scale);

      // Background and ticket header
      ctx.fillStyle = "#15181e";
      ctx.fillRect(0, 0, width, height);
      const gradient = ctx.createLinearGradient(0, 0, width, headerHeight);
      gradient.addColorStop(0, "#b7ed45");
      gradient.addColorStop(1, "#a8d93d");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, headerHeight);

      ctx.fillStyle = "#35451c";
      ctx.font = "14px monospace";
      ctx.fillText(`GATEPASS · ${(a.ticket_type || "GENERAL").toUpperCase()} TICKET`, padding, 38);
      ctx.fillStyle = "#10130b";
      ctx.font = "bold 30px Arial, sans-serif";
      ctx.fillText(a.name.slice(0, 32), padding, 80);
      ctx.font = "16px Arial, sans-serif";
      ctx.fillText(`${a.ticket_type} Ticket`, padding, 110);
      ctx.font = "bold 17px Arial, sans-serif";
      ctx.fillText((a.event_name || "Event not set").slice(0, 48), padding, 136);

      // Status and QR code
      ctx.fillStyle = a.checked_in_at ? "#a9b0bb" : "#b7ed45";
      ctx.font = "bold 16px monospace";
      ctx.fillText(a.checked_in_at ? "CHECKED IN" : "VALID", padding, 192);
      ctx.fillStyle = "#a9b0bb";
      ctx.font = "15px Arial, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(a.checked_in_at ? "Checked in" : "Present at entry", width - padding, 192);
      ctx.textAlign = "left";

      const svgMarkup = new XMLSerializer().serializeToString(qrElement);
      const svgBlob = new Blob([svgMarkup], { type: "image/svg+xml;charset=utf-8" });
      const svgUrl = URL.createObjectURL(svgBlob);
      try {
        const qrImage = new Image();
        await new Promise<void>((resolve, reject) => {
          qrImage.onload = () => resolve();
          qrImage.onerror = () => reject(new Error("Could not render the QR code."));
          qrImage.src = svgUrl;
        });
        const qrX = (width - qrSize) / 2;
        const qrY = 225;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(qrX - 14, qrY - 14, qrSize + 28, qrSize + 28);
        ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);
      } finally {
        URL.revokeObjectURL(svgUrl);
      }

      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.font = "bold 22px monospace";
      ctx.fillText(a.code, width / 2, 535);
      ctx.textAlign = "left";

      // Ticket details
      ctx.strokeStyle = "#343943";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padding, detailsStart - 18);
      ctx.lineTo(width - padding, detailsStart - 18);
      ctx.stroke();
      const rows: Array<[string, string]> = [
        ["Email", a.email],
        ["Ticket Type", a.ticket_type],
        ["Issued", new Date(a.created_at).toLocaleDateString()],
      ];
      rows.forEach(([label, value], index) => {
        const y = detailsStart + index * 54;
        ctx.fillStyle = "#a9b0bb";
        ctx.font = "16px Arial, sans-serif";
        ctx.fillText(label, padding, y);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 16px Arial, sans-serif";
        ctx.textAlign = "right";
        ctx.fillText(value.length > 42 ? `${value.slice(0, 39)}…` : value, width - padding, y, width - padding * 2);
        ctx.textAlign = "left";
      });
      ctx.fillStyle = "#a9b0bb";
      ctx.font = "13px Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Keep this pass ready for event entry", width / 2, 850);

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((result) => result ? resolve(result) : reject(new Error("Could not create PNG image.")), "image/png");
      });
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `gatepass-${a.code}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
      toast.success("Ticket downloaded as PNG.");
    } catch (error) {
      console.error("Ticket download failed:", error);
      toast.error("Could not download the ticket. Please try again or use Print.");
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-4 sm:p-6 backdrop-blur animate-in fade-in duration-200" data-printable="true" onClick={onClose}>
        <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-card border shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto" data-ticket="true" onClick={(e) => e.stopPropagation()}>
          {/* Ticket Header */}
          <div className="bg-gradient-to-r from-primary to-primary/90 p-6 text-primary-foreground relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-md bg-primary-foreground/20 flex items-center justify-center font-mono text-sm font-bold">
                  GP
                </div>
                <span className="font-mono text-xs uppercase tracking-widest opacity-90">GatePass</span>
              </div>
              <p className="font-mono text-xs uppercase tracking-wider opacity-75 mb-1">{a.ticket_type} Ticket</p>
              <p className="text-2xl font-bold tracking-tight">{a.name}</p>
              <p className="mt-2 text-sm font-semibold tracking-wide">{a.event_name || "Event not set"}</p>
            </div>
          </div>
          
          {/* Perforation Line */}
          <div className="relative h-6 bg-card border-b border-dashed border-border">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-6 h-12 bg-background rounded-full -translate-x-1/2" />
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-6 h-12 bg-background rounded-full translate-x-1/2" />
          </div>
          
          {/* Ticket Body */}
          <div className="p-6 space-y-5">
            {/* Status Badge */}
            <div className="flex items-center justify-between">
              <span className={`font-mono text-xs uppercase tracking-wider font-semibold ${statusColor}`}>
                {status}
              </span>
              <span className="text-xs text-muted-foreground">
                {a.checked_in_at ? `Checked in at ${new Date(a.checked_in_at).toLocaleTimeString()}` : 'Present at entry'}
              </span>
            </div>
            
            {/* QR Code */}
            <div className="flex flex-col items-center space-y-3">
              <div className="rounded-lg bg-white p-4 shadow-lg" data-qr-code="true">
                <QRCodeSVG value={a.code} size={200} level="H" includeMargin={true} />
              </div>
              <p className="font-mono text-lg tracking-[0.25em] font-semibold text-foreground">{a.code}</p>
            </div>
            
            {/* Ticket Details */}
            <div className="space-y-2 pt-4 border-t border-border">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium">{a.email}</span>
              </div>
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-muted-foreground">Event</span>
                <span className="font-medium text-right">{a.event_name || "Event not set"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Ticket Type</span>
                <span className="font-medium">{a.ticket_type}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Issued</span>
                <span className="font-medium">{new Date(a.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={handlePrint}>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print
              </Button>
              <Button variant="outline" className="flex-1" onClick={handleDownload}>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download
              </Button>
              <Button className="flex-1" onClick={onClose}>
                Done
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function Verify({ onDone }: { onDone: () => void }) {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [camera, setCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const busy = useRef(false);
  
  const verify = useCallback(async (c: string) => {
    if (busy.current || !c.trim()) return;
    busy.current = true;
    
    try {
      const { data, error } = await supabase.rpc("check_in", { _code: c });
      busy.current = false;
      
      if (error) { 
        toast.error(error.message); 
        setResult({ status: "invalid" });
        return; 
      }
      
      const res = data as Result;
      setResult(res);
      setCode("");
      onDone();
      
      if (res.status === "ok") {
        toast.success(`${res.name} checked in successfully`);
      } else if (res.status === "duplicate") {
        toast.warning(`${res.name} was already checked in`);
      } else {
        toast.error("Invalid pass code");
      }
    } catch (err) {
      busy.current = false;
      toast.error("Network error. Please try again.");
      setResult({ status: "invalid" });
    }
  }, [onDone]);
  
  const handleCameraError = (error: Error) => {
    setCameraError(error.message);
    setCamera(false);
    toast.error("Camera access denied or unavailable");
  };
  
  const tone = result?.status === "ok" ? "border-primary bg-primary/10 text-primary"
    : result?.status === "duplicate" ? "border-warning bg-warning/10 text-warning"
    : "border-destructive bg-destructive/10 text-destructive";
  
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4 rounded-xl border bg-card p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg">Scan QR pass</h2>
          <Button 
            size="sm" 
            variant={camera ? "destructive" : "outline"}
            onClick={() => {
              if (camera) {
                setCamera(false);
                setCameraError(null);
              } else {
                setCameraError(null);
                setCamera(true);
              }
            }}
          >
            {camera ? "Stop camera" : "Start camera"}
          </Button>
        </div>
        
        {cameraError && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {cameraError}. Please use manual code entry instead.
          </div>
        )}
        
        {camera
          ? (
            <Suspense fallback={<div className="aspect-square rounded-xl bg-muted animate-pulse" />}>
              <QrScanner onCode={verify} onError={handleCameraError} />
            </Suspense>
          )
          : (
            <div className="grid aspect-square place-items-center rounded-xl bg-muted text-sm text-muted-foreground border-2 border-dashed">
              <div className="text-center space-y-2 px-4">
                <svg className="w-12 h-12 mx-auto opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p>Camera is off</p>
                <p className="text-xs">Start camera to scan QR codes</p>
              </div>
            </div>
          )
        }
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Or enter code manually</label>
          <form onSubmit={(e) => { e.preventDefault(); verify(code); }} className="flex gap-2">
            <Input 
              className="font-mono uppercase flex-1" 
              placeholder="Enter pass code" 
              value={code} 
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              disabled={busy.current}
            />
            <Button type="submit" disabled={busy.current || !code.trim()}>
              {busy.current ? "Verifying..." : "Verify"}
            </Button>
          </form>
        </div>
      </div>
      
      <div className={`grid min-h-64 place-items-center rounded-xl border-2 p-6 text-center transition-all duration-300 ${result ? tone : "border-dashed border-muted-foreground/30 bg-muted/30"}`}>
        {!result ? (
          <div className="space-y-3">
            <svg className="w-16 h-16 mx-auto text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-muted-foreground">Scan a pass or type a code to check someone in.</p>
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center ${
              result.status === "ok" ? "bg-primary text-primary-foreground" : 
              result.status === "duplicate" ? "bg-warning text-warning-foreground" : 
              "bg-destructive text-destructive-foreground"
            }`}>
              {result.status === "ok" ? (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : result.status === "duplicate" ? (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              ) : (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
            <div>
              <p className="font-mono text-sm uppercase tracking-widest font-semibold">
                {result.status === "ok" ? "Access granted" : result.status === "duplicate" ? "Already checked in" : "Invalid pass"}
              </p>
              {result.name && <p className="mt-3 text-2xl sm:text-3xl font-bold text-foreground">{result.name}</p>}
              {result.ticket_type && <p className="text-muted-foreground text-base sm:text-lg">{result.ticket_type}</p>}
              {result.status === "duplicate" && result.at && (
                <p className="mt-2 text-sm text-muted-foreground">Entered at {new Date(result.at).toLocaleTimeString()}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
