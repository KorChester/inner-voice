import { useState, useEffect } from "react";

const APP_VERSION = "1.7.0";

/* ── SUPABASE CONFIG ── */
const SUPABASE_URL = "https://supabase.physiques-unlimited.de";
const SUPABASE_ANON_KEY = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc3NDk1NTc2MCwiZXhwIjo0OTMwNjI5MzYwLCJyb2xlIjoiYW5vbiJ9.oOYnXD3j3A2VTIaFN9Ratq1X-rhGgTw8blBBRFkuP50";

const sb = {
  token: null,
  headers(extra = {}) {
    const h = { "apikey": SUPABASE_ANON_KEY, "Content-Type": "application/json", ...extra };
    if (this.token) h["Authorization"] = `Bearer ${this.token}`;
    return h;
  },
  async auth(action, body) {
    const url = action === "signup" ? `${SUPABASE_URL}/auth/v1/signup` : `${SUPABASE_URL}/auth/v1/token?grant_type=password`;
    const res = await fetch(url, { method: "POST", headers: this.headers(), body: JSON.stringify(body) });
    const data = await res.json();
    if (data.error || data.msg) throw new Error(data.error_description || data.msg || data.error || "Auth-Fehler");
    if (data.access_token) this.token = data.access_token;
    return data;
  },
  async signOut() { this.token = null; },
  async from(table) {
    return {
      select: async (q = "*", f = "") => { const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=${q}${f}`, { headers: sb.headers({ "Prefer": "return=representation" }) }); if (!r.ok) { const e = await r.json(); throw new Error(e.message); } return r.json(); },
      insert: async (rows) => { const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, { method: "POST", headers: sb.headers({ "Prefer": "return=representation" }), body: JSON.stringify(Array.isArray(rows) ? rows : [rows]) }); if (!r.ok) { const e = await r.json(); throw new Error(e.message); } return r.json(); },
      update: async (data, match) => { const f = Object.entries(match).map(([k, v]) => `${k}=eq.${v}`).join("&"); const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${f}`, { method: "PATCH", headers: sb.headers({ "Prefer": "return=representation" }), body: JSON.stringify(data) }); if (!r.ok) { const e = await r.json(); throw new Error(e.message); } return r.json(); },
      delete: async (match) => { const f = Object.entries(match).map(([k, v]) => `${k}=eq.${v}`).join("&"); const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${f}`, { method: "DELETE", headers: sb.headers() }); if (!r.ok) { const e = await r.json(); throw new Error(e.message); } return true; }
    };
  }
};

/* ── SEED SCENARIOS (für neue User) ── */
const SEED_SCENARIOS = [
  { name: "Vor dem Training", icon: "⚡", description: "Mentale Vorbereitung vor der Session.", phrases: [
    "Ich bin vorbereitet und bereit, alles zu geben.",
    "Mein Körper ist stark, mein Geist ist fokussiert.",
    "Heute werde ich besser als gestern.",
    "Ich freue mich auf die Herausforderung.",
    "Jede Session bringt mich meinem Ziel näher.",
    "Ich bin dankbar, dass ich trainieren kann.",
    "Mein Plan steht. Ich ziehe ihn durch.",
  ]},
  { name: "Während des Trainings", icon: "🔥", description: "Push-Modus. Dranbleiben.", phrases: [
    "Eine Wiederholung nach der anderen.",
    "Der Schmerz ist temporär, der Stolz bleibt.",
    "Fokus. Technik. Atmung. Weiter.",
    "Ich bin stärker als mein innerer Schweinehund.",
    "Genau jetzt wachse ich. In diesem Moment.",
    "Die letzte Wiederholung zählt am meisten.",
    "Ich kontrolliere das Gewicht – nicht umgekehrt.",
    "Mein Körper kann mehr als mein Kopf denkt.",
  ]},
  { name: "Bei Rückschlägen", icon: "🛡️", description: "Wenn es nicht läuft wie geplant.", phrases: [
    "Rückschläge sind Teil des Weges, nicht das Ende.",
    "Ich lerne aus jedem Fehler und wachse daran.",
    "Auch die besten Athleten haben schlechte Tage.",
    "Das definiert mich nicht. Mein Comeback schon.",
    "Ich bin nicht perfekt – und das ist okay.",
    "Jeder Misserfolg bringt mich einer Lösung näher.",
    "Ich falle hin, aber ich stehe immer wieder auf.",
  ]},
  { name: "Selbstvertrauen", icon: "👑", description: "Glaube an dich und deine Fähigkeiten.", phrases: [
    "Ich vertraue meinem Training und meiner Vorbereitung.",
    "Ich verdiene diesen Erfolg – ich habe dafür gearbeitet.",
    "Meine Stärke kommt von innen.",
    "Ich bin genug. Genau so wie ich bin.",
    "Ich habe schon Härteres überstanden.",
    "Mein Weg hat mich hierher gebracht – und er geht weiter.",
    "Ich bin nicht hier, um perfekt zu sein. Ich bin hier, um zu wachsen.",
    "Ich glaube an mich, auch wenn es gerade schwer ist.",
  ]},
  { name: "Wettkampftag", icon: "🏆", description: "Kurz vor dem Wettkampf. Anspannung nutzen.", phrases: [
    "Ich habe mich vorbereitet. Ich bin bereit.",
    "Aufregung ist Energie – ich nutze sie für mich.",
    "Ich konzentriere mich auf meinen Prozess, nicht auf das Ergebnis.",
    "Ich genieße diesen Moment – dafür trainiere ich.",
    "Ich bin mein eigener Maßstab.",
    "Was andere tun, ist irrelevant. Ich zeige mein Bestes.",
    "Ich vertraue meinem Körper. Er weiß, was er tun muss.",
    "Nervosität bedeutet, dass mir das hier wichtig ist.",
  ]},
  { name: "Motivationstief", icon: "🔋", description: "Keine Lust, Zweifel am Sinn.", phrases: [
    "Motivation kommt und geht – Disziplin bleibt.",
    "Ich erinnere mich, warum ich angefangen habe.",
    "Kleine Schritte zählen auch an schweren Tagen.",
    "Ich muss nicht motiviert sein, um anzufangen.",
    "Jeder Gang ins Training ist ein Sieg über den inneren Schweinehund.",
    "Es geht nicht darum, wie ich mich fühle – es geht darum, was ich tue.",
    "Heute ist der Tag, an dem andere aufgeben. Ich nicht.",
  ]},
  { name: "Vergleich mit anderen", icon: "👥", description: "Du vergleichst dich ständig.", phrases: [
    "Mein einziger Gegner bin ich von gestern.",
    "Ich kenne ihre Geschichte nicht – nur meine eigene.",
    "Ihr Erfolg schmälert nicht meinen.",
    "Vergleiche sind Gift. Mein Weg ist einzigartig.",
    "Ich feiere meinen eigenen Fortschritt.",
    "Social Media zeigt Highlights, nicht die Realität.",
    "Ich bin nicht zu spät. Ich bin genau richtig.",
  ]},
  { name: "Regeneration", icon: "🌱", description: "Nach dem Training. Loslassen und aufladen.", phrases: [
    "Ich habe heute mein Bestes gegeben, das reicht.",
    "Erholung ist Teil des Trainings, nicht Schwäche.",
    "Morgen ist eine neue Chance zu wachsen.",
    "Mein Körper repariert sich jetzt. Ich gebe ihm die Zeit.",
    "Ich bin stolz auf das, was ich heute geschafft habe.",
    "Ruhe ist kein Faulenzen – Ruhe ist Strategie.",
  ]},
  { name: "Fokus & Konzentration", icon: "🎯", description: "Ablenkungen loslassen, Präsenz stärken.", phrases: [
    "Jetzt. Hier. Dieser Moment zählt.",
    "Ich lasse Ablenkungen los und bin ganz präsent.",
    "Ein Satz, eine Übung, ein Schritt zur Zeit.",
    "Mein Fokus ist meine Superkraft.",
    "Ich kontrolliere meine Gedanken – nicht umgekehrt.",
    "Was nicht in meiner Kontrolle liegt, lasse ich los.",
    "Ich bin voll da. Mit jedem Atemzug.",
  ]},
  { name: "Druck von außen", icon: "💬", description: "Erwartungen von Trainer, Familie oder Social Media.", phrases: [
    "Ich trainiere für mich – nicht für die Meinung anderer.",
    "Ich setze meine eigenen Maßstäbe.",
    "Druck von außen kann mich nicht definieren.",
    "Ich darf meinen eigenen Weg gehen, in meinem Tempo.",
    "Ihre Erwartungen sind nicht meine Verantwortung.",
    "Ich höre auf meinen Körper, nicht auf fremde Stimmen.",
  ]},
  { name: "Nach Verletzung", icon: "🩹", description: "Comeback nach einer Verletzungspause.", phrases: [
    "Mein Körper heilt. Ich gebe ihm die Zeit, die er braucht.",
    "Ich komme stärker zurück – mental und physisch.",
    "Diese Phase macht mich geduldiger und dankbarer.",
    "Ich kann heute das tun, was möglich ist – das ist genug.",
    "Heilung ist kein Rückschritt, sondern Teil des Weges.",
    "Ich vergleiche mich nicht mit meinem alten Ich. Ich baue neu auf.",
  ]},
  { name: "Morgenroutine", icon: "☀️", description: "Den Tag mit der richtigen Einstellung starten.", phrases: [
    "Heute ist ein guter Tag, um stärker zu werden.",
    "Ich stehe auf mit Dankbarkeit und Entschlossenheit.",
    "Ich entscheide, wie dieser Tag wird.",
    "Mein Mindset bestimmt meinen Erfolg.",
    "Ich bin bereit für alles, was heute kommt.",
    "Jeder neue Tag ist eine Chance, mich zu beweisen.",
  ]},
  { name: "Selbstzweifel", icon: "🌧️", description: "Wenn du an dir selbst zweifelst.", phrases: [
    "Zweifel sind normal – sie beweisen, dass mir das wichtig ist.",
    "Ich bin nicht meine Gedanken. Ich bin meine Taten.",
    "Ich habe schon so vieles geschafft, das ich mir nicht zugetraut habe.",
    "Unsicherheit ist kein Zeichen von Schwäche, sondern von Wachstum.",
    "Ich muss nicht alles wissen. Ich muss nur anfangen.",
    "Auch mit Zweifeln kann ich Großes schaffen.",
    "Ich erlaube mir, unperfekt zu sein und trotzdem weiterzumachen.",
  ]},
];

const REFRAME_EXAMPLES = [
  { neg: "Ich schaffe das nie.", pos: "Ich schaffe das Schritt für Schritt." },
  { neg: "Alle sind besser als ich.", pos: "Ich bin auf meinem eigenen Weg." },
  { neg: "Ich bin zu schwach.", pos: "Ich bin stärker als letzte Woche." },
  { neg: "Das war ein Fehlschlag.", pos: "Das war eine Lernerfahrung." },
];

/* ── DESIGN ── */
const C = { bg: "#0A0A0A", surface: "#131313", card: "#1A1A1A", border: "#262626", borderLight: "#333333", red: "#DC2626", redSoft: "#DC262620", white: "#FFFFFF", text: "#F0F0F0", textMid: "#BBBBBB", textSoft: "#888888", green: "#22C55E" };
const Card = ({ children, style }) => <div style={{ background: C.card, borderRadius: 10, border: `1px solid ${C.border}`, ...style }}>{children}</div>;
const Btn = ({ children, onClick, disabled, style }) => <button onClick={onClick} disabled={disabled} style={{ width: "100%", padding: "13px 16px", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 15, cursor: disabled ? "default" : "pointer", background: C.red, color: C.white, opacity: disabled ? 0.3 : 1, fontFamily: "inherit", ...style }}>{children}</button>;
const Label = ({ children }) => <div style={{ fontSize: 12, fontWeight: 600, color: C.textSoft, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10 }}>{children}</div>;
const inputStyle = { width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, padding: 11, fontSize: 14, resize: "vertical", lineHeight: 1.5, fontFamily: "inherit", boxSizing: "border-box" };
const MOODS = [{ v: 1, e: "😞", l: "Schlecht" }, { v: 2, e: "😐", l: "Mäßig" }, { v: 3, e: "🙂", l: "Okay" }, { v: 4, e: "😊", l: "Gut" }, { v: 5, e: "🔥", l: "Stark" }];
const TYPES = [{ v: "negative", l: "Negativ", c: "#F87171" }, { v: "neutral", l: "Neutral", c: C.textMid }, { v: "positive", l: "Positiv", c: C.green }];

/* ── MAIN APP ── */
export default function App() {
  const [user, setUser] = useState(null);
  const [authView, setAuthView] = useState("login");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("iv_session");
    if (saved) {
      try {
        const s = JSON.parse(saved);
        sb.token = s.token;
        // Verify token is still valid
        fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${s.token}` } })
          .then(r => { if (r.ok) { setUser(s.user); } else { localStorage.removeItem("iv_session"); sb.token = null; } })
          .catch(() => { localStorage.removeItem("iv_session"); sb.token = null; })
          .finally(() => setLoading(false));
      } catch { setLoading(false); }
    } else { setLoading(false); }
  }, []);

  const handleAuth = async (email, password, name, isSignup) => {
    setError("");
    try {
      if (isSignup) {
        await sb.auth("signup", { email, password, data: { display_name: name, role: "client" } });
        let loginData;
        try { loginData = await sb.auth("login", { email, password }); } catch { setError("Registrierung erfolgreich! Bitte melde dich jetzt an."); return; }
        sb.token = loginData.access_token;
        try { const pt = await sb.from("iv_profiles"); await pt.insert({ id: loginData.user.id, email, display_name: name, role: "client" }); } catch {}
        const profile = { id: loginData.user.id, email, role: "client", display_name: name };
        setUser(profile);
        localStorage.setItem("iv_session", JSON.stringify({ token: loginData.access_token, user: profile }));
      } else {
        const data = await sb.auth("login", { email, password });
        sb.token = data.access_token;
        const pt = await sb.from("iv_profiles");
        let profiles = await pt.select("*", `&id=eq.${data.user.id}`);
        if (!profiles?.length) { try { await pt.insert({ id: data.user.id, email, display_name: email.split("@")[0], role: "client" }); profiles = await pt.select("*", `&id=eq.${data.user.id}`); } catch {} }
        const profile = profiles[0] || { id: data.user.id, email, role: "client", display_name: email.split("@")[0] };
        setUser(profile);
        localStorage.setItem("iv_session", JSON.stringify({ token: data.access_token, user: profile }));
      }
    } catch (err) { setError(err.message); }
  };

  const handleLogout = () => { sb.signOut(); setUser(null); localStorage.removeItem("iv_session"); };

  if (loading) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: C.bg, fontFamily: "'Outfit', sans-serif", color: C.textSoft }}>Laden...</div>;

  return (
    <div style={{ fontFamily: "'Outfit', sans-serif", background: C.bg, minHeight: "100vh", color: C.text, maxWidth: 480, margin: "0 auto" }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Bebas+Neue&display=swap" rel="stylesheet" />
      <style>{`* { box-sizing: border-box; margin: 0; } input:focus, textarea:focus { outline: none; border-color: ${C.red} !important; } button, textarea, input { font-family: 'Outfit', sans-serif; }`}</style>
      {!user ? <AuthScreen onAuth={handleAuth} error={error} view={authView} setView={setAuthView} /> : <MainApp user={user} onLogout={handleLogout} />}
    </div>
  );
}

/* ── AUTH SCREEN ── */
function AuthScreen({ onAuth, error, view, setView }) {
  const [email, setEmail] = useState(""); const [pw, setPw] = useState(""); const [name, setName] = useState(""); const [busy, setBusy] = useState(false);
  const submit = async () => { setBusy(true); await onAuth(email, pw, name, view === "signup"); setBusy(false); };
  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", justifyContent: "center", minHeight: "100vh" }}>
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <svg width="50" height="50" viewBox="0 0 40 40"><rect width="40" height="40" rx="7" fill={C.red}/><text x="7" y="19" fill="white" fontSize="16" fontWeight="800" fontFamily="sans-serif">P</text><text x="7" y="35" fill="white" fontSize="16" fontWeight="800" fontFamily="sans-serif">U</text></svg>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: C.white, marginTop: 12, fontFamily: "'Bebas Neue', sans-serif", letterSpacing: 2 }}>INNER VOICE</h1>
        <p style={{ fontSize: 11, color: C.textSoft, letterSpacing: 2, textTransform: "uppercase" }}>by Coach Chang · Physiques Unlimited</p>
      </div>
      <Card style={{ padding: 24 }}>
        <h2 style={{ fontSize: 17, fontWeight: 600, color: C.white, marginBottom: 20, textAlign: "center" }}>{view === "login" ? "Anmelden" : "Registrieren"}</h2>
        {view === "signup" && (<><Label>Name</Label><input value={name} onChange={e => setName(e.target.value)} placeholder="Dein Name" style={{ ...inputStyle, marginBottom: 14 }} /></>)}
        <Label>E-Mail</Label><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="deine@email.de" style={{ ...inputStyle, marginBottom: 14 }} />
        <Label>Passwort</Label><input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="Mindestens 6 Zeichen" onKeyDown={e => e.key === "Enter" && submit()} style={{ ...inputStyle, marginBottom: 18 }} />
        {error && <p style={{ fontSize: 13, color: "#F87171", marginBottom: 12, textAlign: "center" }}>{error}</p>}
        <Btn onClick={submit} disabled={busy || !email || !pw || (view === "signup" && !name)}>{busy ? "Laden..." : view === "login" ? "Anmelden" : "Registrieren"}</Btn>
        <button onClick={() => setView(view === "login" ? "signup" : "login")} style={{ display: "block", margin: "16px auto 0", background: "none", border: "none", color: C.red, fontSize: 13, cursor: "pointer" }}>{view === "login" ? "Noch kein Konto? Registrieren" : "Schon ein Konto? Anmelden"}</button>
      </Card>
      <div style={{ textAlign: "center", marginTop: 20, fontSize: 11, color: C.textSoft, opacity: 0.5 }}>v{APP_VERSION}</div>
    </div>
  );
}

/* ── MAIN APP (after login) ── */
function MainApp({ user, onLogout }) {
  const [view, setView] = useState("home");
  const [scenarios, setScenarios] = useState([]);
  const [journal, setJournal] = useState([]); const [reframes, setReframes] = useState([]);
  const [sessions, setSessions] = useState([]); const [loading, setLoading] = useState(true);
  const [coachClients, setCoachClients] = useState([]);
  const isCoach = user.role === "coach";

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const uid = `&user_id=eq.${user.id}`;
      const [scenT, scenPT, refT, journalT, sessionT] = await Promise.all(
        ["iv_scenarios", "iv_scenario_phrases", "iv_reframes", "iv_journal", "iv_practice_sessions"].map(t => sb.from(t))
      );
      let [rawScens, rawScenP, rawRef, rawJ, rawS] = await Promise.all([
        scenT.select("*", uid), scenPT.select("*", uid),
        refT.select("*", uid + "&order=created_at.desc"), journalT.select("*", uid + "&order=created_at.desc"), sessionT.select("*", uid + "&order=created_at.desc")
      ]);
      if (!rawScens.length) {
        await seedDefaults(user.id);
        rawScens = await scenT.select("*", uid);
        rawScenP = await scenPT.select("*", uid);
      }
      setScenarios(rawScens.map(s => ({ ...s, phrases: rawScenP.filter(p => p.scenario_id === s.id) })));
      setReframes(rawRef); setJournal(rawJ); setSessions(rawS);
      if (isCoach) { const pt = await sb.from("iv_profiles"); setCoachClients(await pt.select("*", "&role=eq.client")); }
    } catch (err) {
      console.error(err);
      if (err.message?.includes("JWT") || err.message?.includes("token")) {
        localStorage.removeItem("iv_session"); sb.token = null; window.location.reload(); return;
      }
    }
    setLoading(false);
  };

  const seedDefaults = async (uid) => {
    const scenT = await sb.from("iv_scenarios");
    const scenPT = await sb.from("iv_scenario_phrases");
    for (const s of SEED_SCENARIOS) {
      const [sc] = await scenT.insert({ user_id: uid, name: s.name, icon: s.icon, description: s.description });
      for (const t of s.phrases) await scenPT.insert({ user_id: uid, scenario_id: sc.id, text: t });
    }
  };

  const recordSession = async (type, count) => { try { const t = await sb.from("iv_practice_sessions"); const [s] = await t.insert({ user_id: user.id, session_type: type, phrases_count: count }); setSessions(p => [s, ...p]); } catch {} };

  const calcStreak = () => {
    if (!sessions.length) return { streak: 0, doneToday: false };
    const dates = [...new Set(sessions.map(s => s.created_at.slice(0, 10)))].sort().reverse();
    const today = new Date().toISOString().slice(0, 10);
    const doneToday = dates[0] === today;
    let streak = doneToday ? 1 : 0;
    for (let i = doneToday ? 1 : 0; i < dates.length; i++) { const exp = new Date(Date.now() - (i + (doneToday ? 0 : 1)) * 86400000).toISOString().slice(0, 10); if (dates[i] === exp) streak++; else break; }
    return { streak, doneToday };
  };

  const { streak, doneToday } = calcStreak();
  const totalPhrases = scenarios.reduce((s, sc) => s + sc.phrases.length, 0);

  const NAV = [
    { id: "home", icon: "◈", label: "Home" },
    { id: "practice", icon: "▶", label: "Praxis" },
    { id: "reframer", icon: "⟲", label: "Reframe" },
    { id: "journal", icon: "✎", label: "Journal" },
    ...(isCoach ? [{ id: "coach", icon: "👁", label: "Coach" }] : []),
  ];

  if (loading) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: C.bg, color: C.textSoft }}>Daten werden geladen...</div>;

  return (
    <div style={{ paddingBottom: 82 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 16px", borderBottom: `1px solid ${C.border}`, background: C.bg, position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <svg width="24" height="24" viewBox="0 0 40 40"><rect width="40" height="40" rx="7" fill={C.red}/><text x="7" y="19" fill="white" fontSize="16" fontWeight="800" fontFamily="sans-serif">P</text><text x="7" y="35" fill="white" fontSize="16" fontWeight="800" fontFamily="sans-serif">U</text></svg>
          <div><div style={{ fontSize: 13, fontWeight: 700, color: C.white }}>INNER VOICE</div><div style={{ fontSize: 10, color: C.textSoft, letterSpacing: 1.5, textTransform: "uppercase" }}>{user.display_name} {isCoach && "· COACH"}</div></div>
        </div>
        <button onClick={onLogout} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 6, color: C.textSoft, fontSize: 12, padding: "5px 12px", cursor: "pointer" }}>Logout</button>
      </header>

      <main>
        {view === "home" && <HomeView streak={streak} doneToday={doneToday} scenarioCount={scenarios.length} totalPhrases={totalPhrases} reframeCount={reframes.length} journalCount={journal.length} go={setView} isCoach={isCoach} />}
        {view === "practice" && <PraxisView scenarios={scenarios} userId={user.id} record={recordSession} reload={loadData} />}
        {view === "reframer" && <ReframerView reframes={reframes} setReframes={setReframes} userId={user.id} record={recordSession} />}
        {view === "journal" && <JournalView journal={journal} setJournal={setJournal} userId={user.id} record={recordSession} reload={loadData} />}
        {view === "coach" && isCoach && <CoachDashboard clients={coachClients} />}
      </main>

      <nav style={{ display: "flex", justifyContent: "space-around", position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, background: `${C.surface}F5`, borderTop: `1px solid ${C.border}`, padding: "8px 0 14px", zIndex: 100, backdropFilter: "blur(12px)" }}>
        {NAV.map(n => (
          <button key={n.id} onClick={() => setView(n.id)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, background: "none", border: "none", color: view === n.id ? C.red : C.textSoft, cursor: "pointer", padding: "4px 8px", minWidth: 56 }}>
            <span style={{ fontSize: 22 }}>{n.icon}</span>
            <span style={{ fontSize: 12, fontWeight: view === n.id ? 600 : 400 }}>{n.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

/* ── HOME ── */
function HomeView({ streak, doneToday, scenarioCount, totalPhrases, reframeCount, journalCount, go, isCoach }) {
  const h = new Date().getHours();
  const greet = h < 12 ? "Guten Morgen" : h < 18 ? "Guten Tag" : "Guten Abend";
  return (
    <div style={{ padding: 16 }}>
      <Card style={{ padding: 20, marginBottom: 16, borderLeft: `3px solid ${C.red}` }}>
        <div style={{ fontSize: 12, color: C.red, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>{greet}</div>
        <h2 style={{ fontSize: 19, fontWeight: 700, color: C.white, lineHeight: 1.3, marginBottom: 6 }}>Wie sprichst du heute mit dir?</h2>
        <p style={{ fontSize: 14, color: C.textMid, lineHeight: 1.5 }}>Trainiere deinen inneren Dialog bewusst.</p>
      </Card>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 20 }}>
        {[{ v: streak, l: "Streak", dot: doneToday }, { v: scenarioCount, l: "Szenarien" }, { v: reframeCount, l: "Reframes" }, { v: journalCount, l: "Journal" }].map((s, i) => (
          <Card key={i} style={{ padding: "12px 6px", textAlign: "center", position: "relative" }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: C.white }}>{s.v}</div>
            <div style={{ fontSize: 10, color: C.textSoft, textTransform: "uppercase" }}>{s.l}</div>
            {s.dot && <div style={{ position: "absolute", top: 5, right: 5, width: 6, height: 6, borderRadius: 3, background: C.green }} />}
          </Card>
        ))}
      </div>
      <Label>Schnellstart</Label>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 22 }}>
        {[{ icon: "▶", label: "Praxis", desc: "Szenarien üben", v: "practice" }, { icon: "⟲", label: "Reframe", desc: "Gedanken umdrehen", v: "reframer" }, { icon: "✎", label: "Journal", desc: "Eintrag schreiben", v: "journal" }, ...(isCoach ? [{ icon: "👁", label: "Coach", desc: "Klienten ansehen", v: "coach" }] : [])].map((a, i) => (
          <button key={i} onClick={() => go(a.v)} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 12px", cursor: "pointer", textAlign: "left" }}>
            <div style={{ fontSize: 20, marginBottom: 4 }}>{a.icon}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.white }}>{a.label}</div>
            <div style={{ fontSize: 12, color: C.textSoft, marginTop: 2 }}>{a.desc}</div>
          </button>
        ))}
      </div>
      <Card style={{ padding: "16px 18px", textAlign: "center", borderTop: `2px solid ${C.red}` }}>
        <p style={{ fontSize: 14, fontStyle: "italic", color: C.textMid, lineHeight: 1.6 }}>"Der wichtigste Mensch, mit dem du je reden wirst, bist du selbst."</p>
        <div style={{ fontSize: 11, color: C.textSoft, marginTop: 6, letterSpacing: 1.5, textTransform: "uppercase" }}>— Coach Chang</div>
      </Card>
      <div style={{ textAlign: "center", marginTop: 16, fontSize: 11, color: C.textSoft, opacity: 0.5 }}>v{APP_VERSION} · made by Chang</div>
    </div>
  );
}

/* ── PRAXIS (Szenarien wählen → Sätze üben) ── */
function PraxisView({ scenarios, userId, record, reload }) {
  const [mode, setMode] = useState("select"); // select, multiSelect, go, done, editScen, addScen
  const [activeSit, setActiveSit] = useState(null);
  const [selScens, setSelScens] = useState([]);
  const [idx, setIdx] = useState(0);
  const [doneCount, setDoneCount] = useState(0);
  const [newPhrase, setNewPhrase] = useState("");
  const [newScen, setNewScen] = useState({ name: "", icon: "📌", description: "" });

  const sit = scenarios.find(s => s.id === activeSit);
  const sitPhrases = sit?.phrases || [];

  // Multi-select: combine phrases from multiple scenarios
  const multiPhrases = selScens.flatMap(sid => {
    const s = scenarios.find(x => x.id === sid);
    return s ? s.phrases.map(p => ({ ...p, scenName: s.name })) : [];
  });

  const activePhrases = mode === "go" && selScens.length > 0 ? multiPhrases : sitPhrases;

  const reset = () => { setMode("select"); setSelScens([]); setActiveSit(null); setIdx(0); setNewPhrase(""); setDoneCount(0); };

  // Add scenario
  if (mode === "addScen") {
    return (
      <div style={{ padding: 16 }}>
        <button onClick={reset} style={{ background: "none", border: "none", color: C.red, fontSize: 13, cursor: "pointer", marginBottom: 14 }}>← Zurück</button>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: C.white, fontFamily: "'Bebas Neue', sans-serif", letterSpacing: 1.5, marginBottom: 14 }}>NEUES SZENARIO</h2>
        <Card style={{ padding: 16 }}>
          <Label>Name</Label><input value={newScen.name} onChange={e => setNewScen({ ...newScen, name: e.target.value })} placeholder="z.B. Prüfungsangst" style={{ ...inputStyle, marginBottom: 12 }} />
          <Label>Emoji</Label><input value={newScen.icon} onChange={e => setNewScen({ ...newScen, icon: e.target.value })} style={{ ...inputStyle, marginBottom: 12, width: 60 }} />
          <Label>Beschreibung</Label><input value={newScen.description} onChange={e => setNewScen({ ...newScen, description: e.target.value })} placeholder="Kurze Beschreibung" style={{ ...inputStyle, marginBottom: 14 }} />
          <Btn onClick={async () => { if (!newScen.name.trim()) return; try { const t = await sb.from("iv_scenarios"); await t.insert({ user_id: userId, name: newScen.name.trim(), icon: newScen.icon || "📌", description: newScen.description.trim() }); setNewScen({ name: "", icon: "📌", description: "" }); reload(); reset(); } catch {} }} disabled={!newScen.name.trim()}>Erstellen</Btn>
        </Card>
      </div>
    );
  }

  // Edit scenario
  if (mode === "editScen" && sit) {
    return (
      <div style={{ padding: 16 }}>
        <button onClick={reset} style={{ background: "none", border: "none", color: C.red, fontSize: 13, cursor: "pointer", marginBottom: 14 }}>← Zurück</button>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <span style={{ fontSize: 28 }}>{sit.icon}</span>
          <div><h2 style={{ fontSize: 17, fontWeight: 700, color: C.white }}>{sit.name}</h2>{sit.description && <p style={{ fontSize: 12, color: C.textSoft }}>{sit.description}</p>}</div>
        </div>
        <Label>Sätze ({sitPhrases.length})</Label>
        {sitPhrases.map(p => (
          <Card key={p.id} style={{ padding: "10px 12px", marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 14, flex: 1, color: C.text, lineHeight: 1.4 }}>{p.text}</span>
            <button onClick={async () => { try { const t = await sb.from("iv_scenario_phrases"); await t.delete({ id: p.id }); reload(); } catch {} }} style={{ background: "none", border: "none", color: C.textSoft, cursor: "pointer", fontSize: 13 }}>✕</button>
          </Card>
        ))}
        <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
          <input value={newPhrase} onChange={e => setNewPhrase(e.target.value)} onKeyDown={async e => { if (e.key === "Enter" && newPhrase.trim()) { try { const t = await sb.from("iv_scenario_phrases"); await t.insert({ user_id: userId, scenario_id: activeSit, text: newPhrase.trim() }); setNewPhrase(""); reload(); } catch {} } }} placeholder="Neuen Satz hinzufügen..." style={{ ...inputStyle, flex: 1, padding: "8px 10px", fontSize: 13 }} />
          <button onClick={async () => { if (!newPhrase.trim()) return; try { const t = await sb.from("iv_scenario_phrases"); await t.insert({ user_id: userId, scenario_id: activeSit, text: newPhrase.trim() }); setNewPhrase(""); reload(); } catch {} }} style={{ width: 34, height: 34, borderRadius: 6, border: "none", background: C.red, color: C.white, fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
        </div>
        <button onClick={async () => { try { const t = await sb.from("iv_scenarios"); await t.delete({ id: activeSit }); reload(); reset(); } catch {} }} style={{ display: "block", margin: "24px auto 0", background: "none", border: "none", color: "#F87171", fontSize: 13, cursor: "pointer" }}>Szenario löschen</button>
      </div>
    );
  }

  // Running session
  if (mode === "go") {
    const p = activePhrases[idx];
    if (!p) return <div style={{ padding: 16, textAlign: "center" }}><p style={{ color: C.textMid, marginBottom: 16 }}>Keine Sätze in diesem Szenario.</p><Btn onClick={reset}>Zurück</Btn></div>;
    const pct = ((idx + 1) / activePhrases.length) * 100;
    return (
      <div style={{ padding: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 3, background: C.border, borderRadius: 2, overflow: "hidden" }}><div style={{ height: "100%", background: C.red, borderRadius: 2, width: `${pct}%`, transition: "width 0.3s" }} /></div>
          <span style={{ fontSize: 12, color: C.textSoft }}>{idx + 1}/{activePhrases.length}</span>
        </div>
        {p.scenName && <div style={{ fontSize: 12, color: C.red, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10 }}>{p.scenName}</div>}
        <Card style={{ padding: "28px 18px", textAlign: "center", marginBottom: 16, borderTop: `2px solid ${C.red}` }}>
          <div style={{ fontSize: 19, fontWeight: 600, lineHeight: 1.5, color: C.white }}>"{p.text}"</div>
        </Card>
        <p style={{ fontSize: 13, color: C.textSoft, textAlign: "center", marginBottom: 18 }}>Lies den Satz laut vor. Wiederhole 2–3 mal.</p>
        <Btn onClick={() => { if (idx < activePhrases.length - 1) setIdx(idx + 1); else { setDoneCount(activePhrases.length); record("practice", activePhrases.length); setMode("done"); } }}>
          {idx < activePhrases.length - 1 ? "Nächster Satz →" : "Session beenden ✓"}
        </Btn>
        <button onClick={reset} style={{ display: "block", margin: "12px auto", background: "none", border: "none", color: C.textSoft, fontSize: 13, cursor: "pointer" }}>Abbrechen</button>
      </div>
    );
  }

  // Done
  if (mode === "done") {
    return (
      <div style={{ padding: 16, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 350, textAlign: "center" }}>
        <div style={{ fontSize: 44, color: C.red, marginBottom: 12 }}>✦</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: C.white, fontFamily: "'Bebas Neue', sans-serif", letterSpacing: 1.5, marginBottom: 8 }}>SESSION FERTIG</h2>
        <p style={{ fontSize: 15, color: C.textMid, marginBottom: 24 }}>{doneCount} Sätze durchgearbeitet. Stark!</p>
        <Btn onClick={reset}>Neue Session</Btn>
      </div>
    );
  }

  // Multi-select mode
  if (mode === "multiSelect") {
    return (
      <div style={{ padding: 16 }}>
        <button onClick={reset} style={{ background: "none", border: "none", color: C.red, fontSize: 13, cursor: "pointer", marginBottom: 14 }}>← Zurück</button>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: C.white, fontFamily: "'Bebas Neue', sans-serif", letterSpacing: 1.5, marginBottom: 4 }}>SZENARIEN WÄHLEN</h2>
        <p style={{ fontSize: 14, color: C.textMid, marginBottom: 16 }}>Wähle mehrere Szenarien für eine kombinierte Session.</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {scenarios.map(s => {
            const sel = selScens.includes(s.id);
            return (
              <button key={s.id} onClick={() => setSelScens(p => sel ? p.filter(x => x !== s.id) : [...p, s.id])} style={{ background: sel ? C.redSoft : C.card, border: `1px solid ${sel ? C.red : C.border}`, borderRadius: 10, padding: 12, cursor: "pointer", textAlign: "center" }}>
                <span style={{ fontSize: 22 }}>{s.icon}</span>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.white, marginTop: 4 }}>{s.name}</div>
                <div style={{ fontSize: 12, color: C.textSoft, marginTop: 2 }}>{s.phrases.length} Sätze</div>
              </button>
            );
          })}
        </div>
        <Btn onClick={() => { setIdx(0); setMode("go"); }} disabled={!multiPhrases.length} style={{ marginTop: 16 }}>
          Session starten ({multiPhrases.length} Sätze)
        </Btn>
      </div>
    );
  }

  // Select (default)
  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: C.white, fontFamily: "'Bebas Neue', sans-serif", letterSpacing: 1.5, marginBottom: 4 }}>PRAXIS</h2>
      <p style={{ fontSize: 14, color: C.textMid, marginBottom: 16 }}>Wähle ein Szenario zum Üben, oder kombiniere mehrere.</p>

      <Btn onClick={() => setMode("multiSelect")} style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text, marginBottom: 16 }}>
        🎯 Mehrere Szenarien kombinieren
      </Btn>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {scenarios.map(s => (
          <div key={s.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 12 }}>
            <span style={{ fontSize: 24 }}>{s.icon}</span>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.white, marginTop: 4 }}>{s.name}</div>
            {s.description && <div style={{ fontSize: 11, color: C.textSoft, marginTop: 2, lineHeight: 1.3 }}>{s.description}</div>}
            <div style={{ fontSize: 12, color: C.red, marginTop: 4 }}>{s.phrases.length} Sätze</div>
            <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
              <button onClick={() => { setActiveSit(s.id); setSelScens([]); setIdx(0); setMode("go"); }}
                style={{ flex: 1, padding: 7, background: C.red, border: "none", borderRadius: 5, color: C.white, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Üben</button>
              <button onClick={() => { setActiveSit(s.id); setMode("editScen"); }}
                style={{ flex: 1, padding: 7, background: "none", border: `1px solid ${C.border}`, borderRadius: 5, color: C.textMid, fontSize: 12, cursor: "pointer" }}>Edit</button>
            </div>
          </div>
        ))}
      </div>
      <button onClick={() => setMode("addScen")} style={{ width: "100%", padding: 12, marginTop: 12, background: "none", border: `1px dashed ${C.borderLight}`, borderRadius: 8, color: C.textSoft, fontSize: 13, cursor: "pointer" }}>+ Neues Szenario erstellen</button>
    </div>
  );
}

/* ── REFRAMER (with flashcard practice) ── */
function ReframerView({ reframes, setReframes, userId, record }) {
  const [tab, setTab] = useState("create");
  const [neg, setNeg] = useState(""); const [pos, setPos] = useState("");
  const [showEx, setShowEx] = useState(false); const [saved, setSaved] = useState(false);
  const [practiceIdx, setPracticeIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [practiceList, setPracticeList] = useState([]);

  const save = async () => {
    if (!neg.trim() || !pos.trim()) return;
    try { const t = await sb.from("iv_reframes"); const [r] = await t.insert({ user_id: userId, negative_text: neg.trim(), positive_text: pos.trim() }); setReframes(p => [r, ...p]); record("reframe", 1); setSaved(true); setTimeout(() => { setNeg(""); setPos(""); setSaved(false); }, 1200); } catch {}
  };

  const deleteReframe = async (id) => {
    try { const t = await sb.from("iv_reframes"); await t.delete({ id }); setReframes(prev => prev.filter(x => x.id !== id)); } catch {}
  };

  const startPractice = () => {
    const shuffled = [...reframes].sort(() => Math.random() - 0.5);
    setPracticeList(shuffled); setPracticeIdx(0); setRevealed(false); setTab("practice");
  };

  if (tab === "practice") {
    if (!practiceList.length) return <div style={{ padding: 16, textAlign: "center" }}><p style={{ color: C.textMid, marginBottom: 16 }}>Keine Reframes vorhanden.</p><Btn onClick={() => setTab("create")}>Zurück</Btn></div>;
    const current = practiceList[practiceIdx];
    if (!current) {
      return (
        <div style={{ padding: 16, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 350, textAlign: "center" }}>
          <div style={{ fontSize: 44, color: C.green, marginBottom: 12 }}>✓</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: C.white, fontFamily: "'Bebas Neue', sans-serif", letterSpacing: 1.5, marginBottom: 8 }}>ALLE REFRAMES GEÜBT</h2>
          <p style={{ fontSize: 15, color: C.textMid, marginBottom: 24 }}>{practiceList.length} Reframes durchgearbeitet!</p>
          <Btn onClick={() => setTab("create")}>Fertig</Btn>
        </div>
      );
    }
    return (
      <div style={{ padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <button onClick={() => setTab("create")} style={{ background: "none", border: "none", color: C.red, fontSize: 13, cursor: "pointer" }}>← Zurück</button>
          <span style={{ fontSize: 12, color: C.textSoft }}>{practiceIdx + 1}/{practiceList.length}</span>
        </div>
        <Label>Negativer Gedanke</Label>
        <Card style={{ padding: "20px 16px", marginBottom: 16, borderLeft: "3px solid #F87171" }}>
          <div style={{ fontSize: 16, color: "#F87171", lineHeight: 1.5 }}>"{current.negative_text}"</div>
        </Card>
        <p style={{ fontSize: 13, color: C.textSoft, textAlign: "center", marginBottom: 16 }}>{revealed ? "Hier ist der Reframe:" : "Was wäre der positive Reframe? Denk zuerst selbst nach..."}</p>
        {revealed ? (
          <Card style={{ padding: "20px 16px", marginBottom: 20, borderLeft: `3px solid ${C.green}` }}>
            <div style={{ fontSize: 16, color: C.green, lineHeight: 1.5 }}>"{current.positive_text}"</div>
          </Card>
        ) : (
          <Btn onClick={() => setRevealed(true)} style={{ background: C.green, marginBottom: 20 }}>Reframe aufdecken</Btn>
        )}
        {revealed && (
          <Btn onClick={() => { setPracticeIdx(practiceIdx + 1); setRevealed(false); }}>
            {practiceIdx < practiceList.length - 1 ? "Nächster Reframe →" : "Abschließen ✓"}
          </Btn>
        )}
      </div>
    );
  }

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: C.white, fontFamily: "'Bebas Neue', sans-serif", letterSpacing: 1.5, marginBottom: 4 }}>GEDANKEN-REFRAMER</h2>
      <p style={{ fontSize: 14, color: C.textMid, marginBottom: 18 }}>Wandle destruktive Gedanken in konstruktive um.</p>

      {reframes.length > 0 && <Btn onClick={startPractice} style={{ background: C.green, marginBottom: 16 }}>🧠 Reframes üben ({reframes.length} Karten)</Btn>}

      <Card style={{ padding: 16, marginBottom: 12 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: "#F87171", display: "block", marginBottom: 6 }}>NEGATIVER GEDANKE</label>
        <textarea value={neg} onChange={e => setNeg(e.target.value)} placeholder='"Ich bin nicht gut genug"' rows={2} style={inputStyle} />
        <div style={{ textAlign: "center", fontSize: 20, color: C.red, margin: "8px 0" }}>⟲</div>
        <label style={{ fontSize: 12, fontWeight: 600, color: C.green, display: "block", marginBottom: 6 }}>POSITIVER REFRAME</label>
        <textarea value={pos} onChange={e => setPos(e.target.value)} placeholder='"Ich werde jeden Tag besser"' rows={2} style={inputStyle} />
        <Btn onClick={save} disabled={!neg.trim() || !pos.trim()} style={{ marginTop: 10 }}>{saved ? "✓ Gespeichert!" : "Speichern"}</Btn>
      </Card>

      <button onClick={() => setShowEx(!showEx)} style={{ background: "none", border: "none", color: C.red, fontSize: 13, cursor: "pointer" }}>{showEx ? "Beispiele ausblenden ▴" : "Beispiele ▾"}</button>
      {showEx && REFRAME_EXAMPLES.map((ex, i) => (
        <Card key={i} style={{ padding: 10, marginTop: 6 }}>
          <div style={{ fontSize: 13, color: "#F87171" }}>🔴 {ex.neg}</div>
          <div style={{ fontSize: 13, color: "#6EE7B7" }}>🟢 {ex.pos}</div>
          <button onClick={() => { setNeg(ex.neg); setPos(ex.pos); setShowEx(false); }} style={{ marginTop: 5, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 4, color: C.textSoft, padding: "4px 10px", fontSize: 12, cursor: "pointer" }}>Verwenden</button>
        </Card>
      ))}
      {reframes.length > 0 && (
        <div style={{ marginTop: 18 }}>
          <Label>Gespeichert ({reframes.length})</Label>
          {reframes.slice(0, 15).map(r => (
            <Card key={r.id} style={{ padding: 10, marginBottom: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: C.textSoft }}>{new Date(r.created_at).toLocaleDateString("de-DE")}</span>
                <button onClick={() => deleteReframe(r.id)} style={{ background: "none", border: "none", color: C.textSoft, cursor: "pointer", fontSize: 13, padding: 0 }}>✕</button>
              </div>
              <div style={{ fontSize: 13, color: "#F87171" }}>🔴 {r.negative_text}</div>
              <div style={{ fontSize: 13, color: "#6EE7B7" }}>🟢 {r.positive_text}</div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── JOURNAL (with edit & delete) ── */
function JournalView({ journal, setJournal, userId, record, reload }) {
  const [mood, setMood] = useState(3); const [text, setText] = useState(""); const [type, setType] = useState("neutral");
  const [saved, setSaved] = useState(false);
  const [editId, setEditId] = useState(null); const [editMood, setEditMood] = useState(3); const [editText, setEditText] = useState("");
  const [editType, setEditType] = useState("neutral"); const [editDate, setEditDate] = useState("");

  const save = async () => {
    if (!text.trim()) return;
    try { const t = await sb.from("iv_journal"); const [entry] = await t.insert({ user_id: userId, mood, self_talk_type: type, text: text.trim() }); setJournal(p => [entry, ...p]); record("journal", 1); setSaved(true); setTimeout(() => { setText(""); setMood(3); setType("neutral"); setSaved(false); }, 1200); } catch {}
  };

  const startEdit = (entry) => {
    setEditId(entry.id); setEditMood(entry.mood); setEditText(entry.text); setEditType(entry.self_talk_type);
    const d = new Date(entry.created_at);
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setEditDate(local);
  };

  const saveEdit = async () => {
    if (!editText.trim()) return;
    try {
      const t = await sb.from("iv_journal");
      await t.update({ mood: editMood, self_talk_type: editType, text: editText.trim(), created_at: new Date(editDate).toISOString() }, { id: editId });
      setEditId(null); reload();
    } catch (err) { console.error(err); }
  };

  const deleteEntry = async (id) => {
    try { const t = await sb.from("iv_journal"); await t.delete({ id }); setJournal(prev => prev.filter(x => x.id !== id)); } catch {}
  };

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: C.white, fontFamily: "'Bebas Neue', sans-serif", letterSpacing: 1.5, marginBottom: 4 }}>SELF-TALK JOURNAL</h2>
      <p style={{ fontSize: 14, color: C.textMid, marginBottom: 18 }}>Wie hast du heute mit dir gesprochen?</p>

      <Card style={{ padding: 16, marginBottom: 20 }}>
        <Label>Stimmung</Label>
        <div style={{ display: "flex", gap: 4, marginBottom: 14 }}>
          {MOODS.map(m => (
            <button key={m.v} onClick={() => setMood(m.v)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "7px 4px", borderRadius: 8, border: "none", cursor: "pointer", background: mood === m.v ? C.surface : "transparent", flex: 1 }}>
              <span style={{ fontSize: 22 }}>{m.e}</span><span style={{ fontSize: 10, color: mood === m.v ? C.text : C.textSoft }}>{m.l}</span>
            </button>
          ))}
        </div>
        <Label>Art</Label>
        <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
          {TYPES.map(t => (
            <button key={t.v} onClick={() => setType(t.v)} style={{ flex: 1, padding: 9, borderRadius: 6, background: type === t.v ? C.surface : "transparent", border: type === t.v ? `1px solid ${t.c}` : `1px solid ${C.border}`, color: type === t.v ? t.c : C.textSoft, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>{t.l}</button>
          ))}
        </div>
        <Label>Gedanken</Label>
        <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Was ging dir durch den Kopf?" rows={3} style={{ ...inputStyle, marginBottom: 10 }} />
        <Btn onClick={save} disabled={!text.trim()}>{saved ? "✓ Gespeichert!" : "Speichern"}</Btn>
      </Card>

      {journal.length > 0 && (
        <>
          <Label>Einträge ({journal.length})</Label>
          {journal.slice(0, 20).map(entry => (
            editId === entry.id ? (
              <Card key={entry.id} style={{ padding: 14, marginBottom: 8, borderLeft: `3px solid ${C.red}` }}>
                <Label>Datum & Uhrzeit</Label>
                <input type="datetime-local" value={editDate} onChange={e => setEditDate(e.target.value)} style={{ ...inputStyle, marginBottom: 10, colorScheme: "dark" }} />
                <Label>Stimmung</Label>
                <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
                  {MOODS.map(m => (
                    <button key={m.v} onClick={() => setEditMood(m.v)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, padding: "5px 3px", borderRadius: 6, border: "none", cursor: "pointer", background: editMood === m.v ? C.surface : "transparent", flex: 1 }}>
                      <span style={{ fontSize: 18 }}>{m.e}</span>
                    </button>
                  ))}
                </div>
                <Label>Art</Label>
                <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                  {TYPES.map(t => (
                    <button key={t.v} onClick={() => setEditType(t.v)} style={{ flex: 1, padding: 7, borderRadius: 6, background: editType === t.v ? C.surface : "transparent", border: editType === t.v ? `1px solid ${t.c}` : `1px solid ${C.border}`, color: editType === t.v ? t.c : C.textSoft, fontSize: 12, cursor: "pointer" }}>{t.l}</button>
                  ))}
                </div>
                <Label>Text</Label>
                <textarea value={editText} onChange={e => setEditText(e.target.value)} rows={3} style={{ ...inputStyle, marginBottom: 10 }} />
                <div style={{ display: "flex", gap: 8 }}>
                  <Btn onClick={saveEdit} style={{ flex: 1 }}>Speichern</Btn>
                  <button onClick={() => setEditId(null)} style={{ flex: 1, padding: "12px", background: "none", border: `1px solid ${C.border}`, borderRadius: 8, color: C.textSoft, fontSize: 14, cursor: "pointer" }}>Abbrechen</button>
                </div>
              </Card>
            ) : (
              <Card key={entry.id} style={{ padding: 12, marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                  <span style={{ fontSize: 16 }}>{MOODS.find(m => m.v === entry.mood)?.e}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: TYPES.find(t => t.v === entry.self_talk_type)?.c }}>{TYPES.find(t => t.v === entry.self_talk_type)?.l}</span>
                  <span style={{ fontSize: 11, color: C.textSoft, marginLeft: "auto" }}>{new Date(entry.created_at).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                <p style={{ fontSize: 14, color: C.textMid, lineHeight: 1.5, marginBottom: 8 }}>{entry.text}</p>
                <div style={{ display: "flex", gap: 12 }}>
                  <button onClick={() => startEdit(entry)} style={{ background: "none", border: "none", color: C.red, fontSize: 12, cursor: "pointer", padding: 0 }}>Bearbeiten</button>
                  <button onClick={() => deleteEntry(entry.id)} style={{ background: "none", border: "none", color: C.textSoft, fontSize: 12, cursor: "pointer", padding: 0 }}>Löschen</button>
                </div>
              </Card>
            )
          ))}
        </>
      )}
    </div>
  );
}

/* ── COACH DASHBOARD (Enhanced) ── */
function CoachDashboard({ clients }) {
  const [selected, setSelected] = useState(null);
  const [clientData, setClientData] = useState(null);
  const [clientOverviews, setClientOverviews] = useState({});
  const [loading, setLoading] = useState(true);

  // Load overview data for ALL clients (for traffic light list)
  useEffect(() => {
    loadOverviews();
  }, [clients]);

  const loadOverviews = async () => {
    if (!clients.length) { setLoading(false); return; }
    try {
      const [sessionT, journalT] = await Promise.all(["iv_practice_sessions", "iv_journal"].map(t => sb.from(t)));
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
      const [allSessions, allJournal] = await Promise.all([
        sessionT.select("*", `&created_at=gte.${thirtyDaysAgo}&order=created_at.desc`),
        journalT.select("*", `&created_at=gte.${thirtyDaysAgo}&order=created_at.desc`)
      ]);

      const overviews = {};
      for (const client of clients) {
        const cSessions = allSessions.filter(s => s.user_id === client.id);
        const cJournal = allJournal.filter(j => j.user_id === client.id);

        // Last active
        const allDates = [...cSessions.map(s => s.created_at), ...cJournal.map(j => j.created_at)].sort().reverse();
        const lastActive = allDates[0] ? new Date(allDates[0]) : null;
        const daysSince = lastActive ? Math.floor((Date.now() - lastActive.getTime()) / 86400000) : 999;

        // Mood trend (last 5 vs previous 5)
        const moods = cJournal.map(j => j.mood);
        const recent5 = moods.slice(0, 5);
        const prev5 = moods.slice(5, 10);
        const avgRecent = recent5.length ? recent5.reduce((a, b) => a + b, 0) / recent5.length : 0;
        const avgPrev = prev5.length ? prev5.reduce((a, b) => a + b, 0) / prev5.length : 0;
        const moodTrend = !prev5.length ? "stable" : avgRecent > avgPrev + 0.3 ? "rising" : avgRecent < avgPrev - 0.3 ? "falling" : "stable";

        // Self-talk distribution
        const neg = cJournal.filter(j => j.self_talk_type === "negative").length;
        const neu = cJournal.filter(j => j.self_talk_type === "neutral").length;
        const pos = cJournal.filter(j => j.self_talk_type === "positive").length;
        const total = neg + neu + pos;
        const negPct = total ? Math.round(neg / total * 100) : 0;
        const posPct = total ? Math.round(pos / total * 100) : 0;

        // Sessions this week vs last week
        const now = new Date();
        const startThisWeek = new Date(now); startThisWeek.setDate(now.getDate() - now.getDay());
        const startLastWeek = new Date(startThisWeek); startLastWeek.setDate(startThisWeek.getDate() - 7);
        const sessionsThisWeek = cSessions.filter(s => new Date(s.created_at) >= startThisWeek).length;
        const sessionsLastWeek = cSessions.filter(s => { const d = new Date(s.created_at); return d >= startLastWeek && d < startThisWeek; }).length;

        // Traffic light
        let status = "green";
        const hasData = cSessions.length > 0 || cJournal.length > 0;
        if (!hasData) { status = "new"; }
        else if (daysSince > 7 || moodTrend === "falling" || negPct > 60) status = "red";
        else if (daysSince > 3 || (moodTrend === "stable" && negPct > 40)) status = "yellow";

        overviews[client.id] = { lastActive, daysSince, moodTrend, avgRecent, moods: moods.slice(0, 14).reverse(), negPct, posPct, neuPct: total ? 100 - negPct - posPct : 0, sessionsThisWeek, sessionsLastWeek, totalJournal: cJournal.length, totalSessions: cSessions.length, status };
      }
      setClientOverviews(overviews);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  // Load detailed data for one client
  const loadClient = async (client) => {
    setSelected(client);
    try {
      const uid = `&user_id=eq.${client.id}`;
      const [journalT, reframeT, scenT, scenPT] = await Promise.all(["iv_journal", "iv_reframes", "iv_scenarios", "iv_scenario_phrases"].map(t => sb.from(t)));
      const [journal, reframes, scens, scenPhrases] = await Promise.all([
        journalT.select("*", uid + "&order=created_at.desc&limit=30"),
        reframeT.select("*", uid + "&order=created_at.desc&limit=20"),
        scenT.select("*", uid), scenPT.select("*", uid)
      ]);
      setClientData({ journal, reframes, scenarioCount: scens.length, scenarios: scens.map(s => ({ ...s, phrases: scenPhrases.filter(p => p.scenario_id === s.id) })) });
    } catch (err) { console.error(err); }
  };

  const statusColors = { green: "#22C55E", yellow: "#EAB308", red: "#EF4444", new: "#06B6D4" };
  const statusLabels = { green: "Gut dabei", yellow: "Aufmerksamkeit", red: "Eingreifen", new: "Neu" };
  const trendLabels = { rising: "↗ steigend", stable: "→ stabil", falling: "↘ sinkend" };
  const trendColors = { rising: C.green, stable: C.textSoft, falling: "#EF4444" };

  const daysAgoText = (days) => {
    if (days === 0) return "Heute aktiv";
    if (days === 1) return "Gestern aktiv";
    if (days === 999) return "Noch nie aktiv";
    return `Vor ${days} Tagen aktiv`;
  };

  // ── Client Detail View ──
  if (selected) {
    const ov = clientOverviews[selected.id] || {};
    return (
      <div style={{ padding: 16 }}>
        <button onClick={() => { setSelected(null); setClientData(null); }} style={{ background: "none", border: "none", color: C.red, fontSize: 13, cursor: "pointer", marginBottom: 14 }}>← Alle Klienten</button>

        {/* Header with status */}
        <Card style={{ padding: 16, marginBottom: 12, borderLeft: `3px solid ${statusColors[ov.status] || C.textSoft}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: C.white, marginBottom: 4 }}>{selected.display_name || selected.email}</h2>
              <p style={{ fontSize: 12, color: C.textSoft }}>{selected.email}</p>
              <p style={{ fontSize: 12, color: C.textSoft }}>Seit {new Date(selected.created_at).toLocaleDateString("de-DE")}</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: statusColors[ov.status], padding: "3px 10px", background: `${statusColors[ov.status]}20`, borderRadius: 12 }}>{statusLabels[ov.status]}</div>
              <div style={{ fontSize: 11, color: C.textSoft, marginTop: 6 }}>{daysAgoText(ov.daysSince)}</div>
            </div>
          </div>
        </Card>

        {/* Quick stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
          <Card style={{ padding: 12 }}>
            <div style={{ fontSize: 11, color: C.textSoft, marginBottom: 4 }}>SESSIONS/WOCHE</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: C.white }}>{ov.sessionsThisWeek || 0}</div>
            <div style={{ fontSize: 11, color: C.textSoft }}>Letzte Woche: {ov.sessionsLastWeek || 0}</div>
          </Card>
          <Card style={{ padding: 12 }}>
            <div style={{ fontSize: 11, color: C.textSoft, marginBottom: 4 }}>STIMMUNGS-TREND</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: trendColors[ov.moodTrend] || C.textSoft }}>{trendLabels[ov.moodTrend] || "— keine Daten"}</div>
            <div style={{ fontSize: 11, color: C.textSoft }}>Ø {(ov.avgRecent || 0).toFixed(1)} / 5</div>
          </Card>
        </div>

        {/* Mood chart (last 14 entries) */}
        {ov.moods?.length > 0 && (
          <Card style={{ padding: 14, marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: C.textSoft, marginBottom: 10, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>Stimmungsverlauf (letzte {ov.moods.length} Einträge)</div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 60 }}>
              {ov.moods.map((m, i) => {
                const h = (m / 5) * 50 + 10;
                const color = m >= 4 ? C.green : m >= 3 ? "#EAB308" : "#EF4444";
                return <div key={i} style={{ flex: 1, height: h, background: color, borderRadius: 3, opacity: 0.8, transition: "height 0.3s" }} title={`Stimmung: ${m}`} />;
              })}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
              <span style={{ fontSize: 9, color: C.textSoft }}>Ältester</span>
              <span style={{ fontSize: 9, color: C.textSoft }}>Neuester</span>
            </div>
          </Card>
        )}

        {/* Self-talk distribution */}
        {(ov.negPct > 0 || ov.posPct > 0 || ov.neuPct > 0) && (
          <Card style={{ padding: 14, marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: C.textSoft, marginBottom: 10, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>Self-Talk Verteilung</div>
            <div style={{ display: "flex", height: 12, borderRadius: 6, overflow: "hidden", marginBottom: 8 }}>
              {ov.posPct > 0 && <div style={{ width: `${ov.posPct}%`, background: C.green }} />}
              {ov.neuPct > 0 && <div style={{ width: `${ov.neuPct}%`, background: "#EAB308" }} />}
              {ov.negPct > 0 && <div style={{ width: `${ov.negPct}%`, background: "#EF4444" }} />}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
              <span style={{ color: C.green }}>Positiv {ov.posPct}%</span>
              <span style={{ color: "#EAB308" }}>Neutral {ov.neuPct}%</span>
              <span style={{ color: "#EF4444" }}>Negativ {ov.negPct}%</span>
            </div>
          </Card>
        )}

        {/* Scenarios overview */}
        {clientData?.scenarios?.length > 0 && (
          <>
            <Label>Szenarien des Klienten ({clientData.scenarioCount})</Label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
              {clientData.scenarios.map(s => (
                <div key={s.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 10px", fontSize: 12, color: C.textMid }}>
                  {s.icon} {s.name} ({s.phrases.length})
                </div>
              ))}
            </div>
          </>
        )}

        {/* Recent journal entries */}
        {clientData?.journal?.length > 0 && (
          <>
            <Label>Letzte Journal-Einträge</Label>
            {clientData.journal.slice(0, 8).map(e => (
              <Card key={e.id} style={{ padding: 10, marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 14 }}>{MOODS.find(m => m.v === e.mood)?.e}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: e.self_talk_type === "positive" ? C.green : e.self_talk_type === "negative" ? "#F87171" : C.textSoft }}>{TYPES.find(t => t.v === e.self_talk_type)?.l}</span>
                  <span style={{ fontSize: 11, color: C.textSoft, marginLeft: "auto" }}>{new Date(e.created_at).toLocaleDateString("de-DE")}</span>
                </div>
                <p style={{ fontSize: 13, color: C.textMid, lineHeight: 1.4 }}>{e.text}</p>
              </Card>
            ))}
          </>
        )}

        {/* Recent reframes */}
        {clientData?.reframes?.length > 0 && (
          <>
            <Label>Letzte Reframes</Label>
            {clientData.reframes.slice(0, 5).map(r => (
              <Card key={r.id} style={{ padding: 10, marginBottom: 6 }}>
                <div style={{ fontSize: 13, color: "#F87171" }}>🔴 {r.negative_text}</div>
                <div style={{ fontSize: 13, color: "#6EE7B7" }}>🟢 {r.positive_text}</div>
              </Card>
            ))}
          </>
        )}

        {!clientData && <p style={{ color: C.textSoft, textAlign: "center", marginTop: 20 }}>Daten werden geladen...</p>}
      </div>
    );
  }

  // ── Client List View (with traffic lights) ──
  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: C.white, fontFamily: "'Bebas Neue', sans-serif", letterSpacing: 1.5, marginBottom: 4 }}>COACH DASHBOARD</h2>
      <p style={{ fontSize: 14, color: C.textMid, marginBottom: 18 }}>Deine Klienten auf einen Blick.</p>

      {loading && <p style={{ color: C.textSoft }}>Klientendaten werden geladen...</p>}

      {!loading && clients.length === 0 && (
        <Card style={{ padding: 20, textAlign: "center" }}><p style={{ color: C.textSoft }}>Noch keine Klienten registriert.</p></Card>
      )}

      {!loading && clients.length > 0 && (
        <>
          {/* Status summary */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {["green", "yellow", "red", "new"].map(s => {
              const count = clients.filter(c => clientOverviews[c.id]?.status === s).length;
              if (!count && s === "new") return null;
              return (
                <Card key={s} style={{ flex: 1, padding: "10px 8px", textAlign: "center", borderTop: `2px solid ${statusColors[s]}` }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: C.white }}>{count}</div>
                  <div style={{ fontSize: 10, color: statusColors[s] }}>{statusLabels[s]}</div>
                </Card>
              );
            })}
          </div>

          {/* Client list sorted by status (red first, new last) */}
          {["red", "yellow", "green", "new"].map(status => {
            const filtered = clients.filter(c => clientOverviews[c.id]?.status === status);
            if (!filtered.length) return null;
            return (
              <div key={status}>
                {filtered.map(c => {
                  const ov = clientOverviews[c.id] || {};
                  return (
                    <button key={c.id} onClick={() => loadClient(c)} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: 14, background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, marginBottom: 8, cursor: "pointer", textAlign: "left" }}>
                      <div style={{ position: "relative" }}>
                        <div style={{ width: 40, height: 40, borderRadius: 20, background: C.redSoft, display: "flex", alignItems: "center", justifyContent: "center", color: C.red, fontWeight: 700, fontSize: 16 }}>
                          {(c.display_name || c.email)[0].toUpperCase()}
                        </div>
                        <div style={{ position: "absolute", top: -2, right: -2, width: 12, height: 12, borderRadius: 6, background: statusColors[ov.status] || C.textSoft, border: `2px solid ${C.card}` }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 600, color: C.white }}>{c.display_name || c.email}</div>
                        <div style={{ fontSize: 12, color: C.textSoft }}>{ov.status === "new" ? "Gerade registriert" : daysAgoText(ov.daysSince)}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 12, color: trendColors[ov.moodTrend] || C.textSoft }}>{trendLabels[ov.moodTrend] || "—"}</div>
                        <div style={{ fontSize: 11, color: C.textSoft }}>{ov.totalSessions || 0} Sessions</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
