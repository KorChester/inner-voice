import { useState, useEffect, useCallback, useRef } from "react";

const APP_VERSION = "1.3.0";

/* ─────────────────────────────────────────────
   SUPABASE CONFIG
   ───────────────────────────────────────────── */
const SUPABASE_URL = "https://supabase.physiques-unlimited.de";
const SUPABASE_ANON_KEY = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc3NDk1NTc2MCwiZXhwIjo0OTMwNjI5MzYwLCJyb2xlIjoiYW5vbiJ9.oOYnXD3j3A2VTIaFN9Ratq1X-rhGgTw8blBBRFkuP50";

/* ── Supabase API Helper ── */
const sb = {
  token: null,
  headers(extra = {}) {
    const h = { "apikey": SUPABASE_ANON_KEY, "Content-Type": "application/json", ...extra };
    if (this.token) h["Authorization"] = `Bearer ${this.token}`;
    return h;
  },
  async auth(action, body) {
    const url = action === "signup"
      ? `${SUPABASE_URL}/auth/v1/signup`
      : `${SUPABASE_URL}/auth/v1/token?grant_type=password`;
    const res = await fetch(url, { method: "POST", headers: this.headers(), body: JSON.stringify(body) });
    const data = await res.json();
    if (data.error || data.msg) throw new Error(data.error_description || data.msg || data.error || "Auth-Fehler");
    if (data.access_token) this.token = data.access_token;
    return data;
  },
  async signOut() { this.token = null; },
  async from(table) {
    return {
      select: async (query = "*", filters = "") => {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=${query}${filters}`, { headers: sb.headers({ "Prefer": "return=representation" }) });
        if (!res.ok) { const e = await res.json(); throw new Error(e.message || "Fehler beim Laden"); }
        return res.json();
      },
      insert: async (rows) => {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, { method: "POST", headers: sb.headers({ "Prefer": "return=representation" }), body: JSON.stringify(Array.isArray(rows) ? rows : [rows]) });
        if (!res.ok) { const e = await res.json(); throw new Error(e.message || "Fehler beim Speichern"); }
        return res.json();
      },
      update: async (data, match) => {
        const filter = Object.entries(match).map(([k, v]) => `${k}=eq.${v}`).join("&");
        const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, { method: "PATCH", headers: sb.headers({ "Prefer": "return=representation" }), body: JSON.stringify(data) });
        if (!res.ok) { const e = await res.json(); throw new Error(e.message || "Fehler beim Aktualisieren"); }
        return res.json();
      },
      delete: async (match) => {
        const filter = Object.entries(match).map(([k, v]) => `${k}=eq.${v}`).join("&");
        const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, { method: "DELETE", headers: sb.headers() });
        if (!res.ok) { const e = await res.json(); throw new Error(e.message || "Fehler beim Löschen"); }
        return true;
      }
    };
  }
};

/* ─────────────────────────────────────────────
   DEFAULT SEED DATA (für neue User)
   ───────────────────────────────────────────── */
const SEED_CATEGORIES = [
  { name: "Vor dem Training", icon: "⚡", sort_order: 0, phrases: [
    "Ich bin vorbereitet und bereit, alles zu geben.",
    "Mein Körper ist stark, mein Geist ist fokussiert.",
    "Heute werde ich besser als gestern.",
  ]},
  { name: "Während des Trainings", icon: "🔥", sort_order: 1, phrases: [
    "Eine Wiederholung nach der anderen.",
    "Der Schmerz ist temporär, der Stolz bleibt.",
    "Fokus. Technik. Atmung. Weiter.",
  ]},
  { name: "Bei Rückschlägen", icon: "🛡️", sort_order: 2, phrases: [
    "Rückschläge sind Teil des Weges, nicht das Ende.",
    "Ich lerne aus jedem Fehler und wachse daran.",
    "Auch die besten Athleten haben schlechte Tage.",
  ]},
  { name: "Selbstvertrauen", icon: "👑", sort_order: 3, phrases: [
    "Ich vertraue meinem Training und meiner Vorbereitung.",
    "Ich verdiene diesen Erfolg – ich habe dafür gearbeitet.",
    "Meine Stärke kommt von innen.",
  ]},
  { name: "Fokus & Konzentration", icon: "🎯", sort_order: 4, phrases: [
    "Jetzt. Hier. Dieser Moment zählt.",
    "Ich lasse Ablenkungen los und bin ganz präsent.",
  ]},
  { name: "Regeneration", icon: "🌱", sort_order: 5, phrases: [
    "Ich habe heute mein Bestes gegeben, das reicht.",
    "Erholung ist Teil des Trainings, nicht Schwäche.",
  ]},
];

const SEED_SCENARIOS = [
  { name: "Wettkampftag", icon: "🏆", description: "Kurz vor dem Wettkampf. Die Anspannung steigt.", phrases: [
    "Ich habe mich vorbereitet. Ich bin bereit.",
    "Aufregung ist Energie – ich nutze sie für mich.",
    "Ich konzentriere mich auf meinen Prozess, nicht auf das Ergebnis.",
  ]},
  { name: "Leistungsplateau", icon: "📊", description: "Seit Wochen keine Fortschritte.", phrases: [
    "Plateaus sind Zeichen, dass mein Körper sich anpasst.",
    "Ich bleibe geduldig und vertraue dem Prozess.",
  ]},
  { name: "Motivationstief", icon: "🔋", description: "Keine Lust mehr, Zweifel am Sinn.", phrases: [
    "Motivation kommt und geht – Disziplin bleibt.",
    "Ich erinnere mich, warum ich angefangen habe.",
  ]},
  { name: "Vergleich mit anderen", icon: "👥", description: "Du vergleichst dich ständig mit anderen.", phrases: [
    "Mein einziger Gegner bin ich von gestern.",
    "Ich kenne ihre Geschichte nicht – nur meine eigene.",
  ]},
];

const REFRAME_EXAMPLES = [
  { neg: "Ich schaffe das nie.", pos: "Ich schaffe das Schritt für Schritt." },
  { neg: "Alle sind besser als ich.", pos: "Ich bin auf meinem eigenen Weg." },
  { neg: "Ich bin zu schwach.", pos: "Ich bin stärker als letzte Woche." },
  { neg: "Das war ein Fehlschlag.", pos: "Das war eine Lernerfahrung." },
];

/* ─────────────────────────────────────────────
   DESIGN TOKENS
   ───────────────────────────────────────────── */
const C = {
  bg: "#0A0A0A", surface: "#131313", card: "#1A1A1A",
  border: "#262626", borderLight: "#333333",
  red: "#DC2626", redSoft: "#DC262620",
  white: "#FFFFFF", text: "#F0F0F0", textMid: "#BBBBBB", textSoft: "#888888",
  green: "#22C55E", greenSoft: "#22C55E20",
};

/* ── Shared UI ── */
const Card = ({ children, style }) => <div style={{ background: C.card, borderRadius: 10, border: `1px solid ${C.border}`, ...style }}>{children}</div>;
const Btn = ({ children, onClick, disabled, style }) => (
  <button onClick={onClick} disabled={disabled}
    style={{ width: "100%", padding: "12px 16px", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: disabled ? "default" : "pointer", background: C.red, color: C.white, opacity: disabled ? 0.3 : 1, fontFamily: "inherit", ...style }}>
    {children}
  </button>
);
const Label = ({ children }) => <div style={{ fontSize: 11, fontWeight: 600, color: C.textSoft, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10 }}>{children}</div>;
const inputStyle = { width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, padding: 10, fontSize: 13, resize: "vertical", lineHeight: 1.5, fontFamily: "inherit", boxSizing: "border-box" };

/* ─────────────────────────────────────────────
   MAIN APP
   ───────────────────────────────────────────── */
export default function App() {
  const [user, setUser] = useState(null);       // { id, email, role, display_name }
  const [authView, setAuthView] = useState("login");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Check for saved session
  useEffect(() => {
    const saved = sessionStorage.getItem("iv_session");
    if (saved) {
      try {
        const s = JSON.parse(saved);
        sb.token = s.token;
        setUser(s.user);
      } catch {}
    }
    setLoading(false);
  }, []);

  const handleAuth = async (email, password, name, isSignup) => {
    setError("");
    try {
      if (isSignup) {
        // 1. Registrieren
        const signupData = await sb.auth("signup", {
          email, password,
          data: { display_name: name, role: "client" }
        });
        
        // 2. Direkt danach einloggen
        let token, userId;
        if (signupData.access_token) {
          token = signupData.access_token;
          userId = signupData.user.id;
        } else {
          // Autoconfirm aktiv → direkt einloggen
          const loginData = await sb.auth("login", { email, password });
          token = loginData.access_token;
          userId = loginData.user.id;
        }
        
        sb.token = token;
        
        // 3. Profil in iv_profiles erstellen
        try {
          const profileTable = await sb.from("iv_profiles");
          await profileTable.insert({ id: userId, email, display_name: name, role: "client" });
        } catch (profileErr) {
          console.log("Profil existiert evtl. schon:", profileErr);
        }
        
        const profile = { id: userId, email, role: "client", display_name: name };
        setUser(profile);
        sessionStorage.setItem("iv_session", JSON.stringify({ token, user: profile }));
        
      } else {
        const data = await sb.auth("login", { email, password });
        sb.token = data.access_token;
        // Profil laden
        const profileTable = await sb.from("iv_profiles");
        let profiles = await profileTable.select("*", `&id=eq.${data.user.id}`);
        // Falls kein Profil existiert, automatisch erstellen
        if (!profiles || profiles.length === 0) {
          try {
            await profileTable.insert({
              id: data.user.id,
              email,
              display_name: email.split("@")[0],
              role: "client"
            });
            profiles = await profileTable.select("*", `&id=eq.${data.user.id}`);
          } catch (profileErr) {
            console.log("Profil-Erstellung bei Login:", profileErr);
          }
        }
        const profile = profiles[0] || { id: data.user.id, email, role: "client", display_name: email.split("@")[0] };
        setUser(profile);
        sessionStorage.setItem("iv_session", JSON.stringify({ token: data.access_token, user: profile }));
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogout = () => {
    sb.signOut();
    setUser(null);
    sessionStorage.removeItem("iv_session");
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: C.bg, fontFamily: "'Outfit', sans-serif" }}>
      <div style={{ color: C.textSoft, fontSize: 13 }}>Laden...</div>
    </div>
  );

  return (
    <div style={{ fontFamily: "'Outfit', sans-serif", background: C.bg, minHeight: "100vh", color: C.text, maxWidth: 480, margin: "0 auto" }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Bebas+Neue&display=swap" rel="stylesheet" />
      <style>{`* { box-sizing: border-box; margin: 0; } input:focus, textarea:focus { outline: none; border-color: ${C.red} !important; } button { font-family: 'Outfit', sans-serif; } textarea, input { font-family: 'Outfit', sans-serif; }`}</style>
      {!user ? (
        <AuthScreen onAuth={handleAuth} error={error} view={authView} setView={setAuthView} />
      ) : (
        <MainApp user={user} onLogout={handleLogout} />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   AUTH SCREEN
   ───────────────────────────────────────────── */
function AuthScreen({ onAuth, error, view, setView }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    await onAuth(email, pw, name, view === "signup");
    setBusy(false);
  };

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", justifyContent: "center", minHeight: "100vh" }}>
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <svg width="50" height="50" viewBox="0 0 40 40"><rect width="40" height="40" rx="7" fill={C.red}/><text x="7" y="19" fill="white" fontSize="16" fontWeight="800" fontFamily="sans-serif">P</text><text x="7" y="35" fill="white" fontSize="16" fontWeight="800" fontFamily="sans-serif">U</text></svg>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: C.white, marginTop: 12, fontFamily: "'Bebas Neue', sans-serif", letterSpacing: 2 }}>INNER VOICE</h1>
        <p style={{ fontSize: 12, color: C.textSoft, letterSpacing: 2, textTransform: "uppercase" }}>by Coach Chang · Physiques Unlimited</p>
      </div>

      <Card style={{ padding: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: C.white, marginBottom: 20, textAlign: "center" }}>
          {view === "login" ? "Anmelden" : "Registrieren"}
        </h2>

        {view === "signup" && (
          <>
            <Label>Name</Label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Dein Name" style={{ ...inputStyle, marginBottom: 14 }} />
          </>
        )}

        <Label>E-Mail</Label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="deine@email.de" style={{ ...inputStyle, marginBottom: 14 }} />

        <Label>Passwort</Label>
        <input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="Mindestens 6 Zeichen"
          onKeyDown={e => e.key === "Enter" && submit()}
          style={{ ...inputStyle, marginBottom: 18 }} />

        {error && <p style={{ fontSize: 12, color: "#F87171", marginBottom: 12, textAlign: "center" }}>{error}</p>}

        <Btn onClick={submit} disabled={busy || !email || !pw || (view === "signup" && !name)}>
          {busy ? "Laden..." : view === "login" ? "Anmelden" : "Registrieren"}
        </Btn>

        <button onClick={() => setView(view === "login" ? "signup" : "login")}
          style={{ display: "block", margin: "16px auto 0", background: "none", border: "none", color: C.red, fontSize: 13, cursor: "pointer" }}>
          {view === "login" ? "Noch kein Konto? Registrieren" : "Schon ein Konto? Anmelden"}
        </button>
      </Card>

      <div style={{ textAlign: "center", marginTop: 20, fontSize: 12, color: C.textSoft, opacity: 0.4 }}>v{APP_VERSION}</div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN APP (after login)
   ───────────────────────────────────────────── */
function MainApp({ user, onLogout }) {
  const [view, setView] = useState("home");
  const [cats, setCats] = useState([]);
  const [scenarios, setScenarios] = useState([]);
  const [journal, setJournal] = useState([]);
  const [reframes, setReframes] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [coachClients, setCoachClients] = useState([]);
  const [coachView, setCoachView] = useState(null); // which client to view

  const isCoach = user.role === "coach";

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const catTable = await sb.from("iv_categories");
      const phraseTable = await sb.from("iv_phrases");
      const scenTable = await sb.from("iv_scenarios");
      const scenPhraseTable = await sb.from("iv_scenario_phrases");
      const refTable = await sb.from("iv_reframes");
      const journalTable = await sb.from("iv_journal");
      const sessionTable = await sb.from("iv_practice_sessions");

      const uid = `&user_id=eq.${user.id}`;
      let rawCats = await catTable.select("*", uid + "&order=sort_order.asc");
      let rawPhrases = await phraseTable.select("*", uid);
      let rawScens = await scenTable.select("*", uid);
      let rawScenPhrases = await scenPhraseTable.select("*", uid);
      let rawReframes = await refTable.select("*", uid + "&order=created_at.desc");
      let rawJournal = await journalTable.select("*", uid + "&order=created_at.desc");
      let rawSessions = await sessionTable.select("*", uid + "&order=created_at.desc");

      // Seed defaults if new user
      if (rawCats.length === 0) {
        rawCats = await seedDefaults(user.id);
        rawPhrases = await phraseTable.select("*", uid);
        rawScens = await scenTable.select("*", uid);
        rawScenPhrases = await scenPhraseTable.select("*", uid);
      }

      // Combine cats + phrases
      const catsWithPhrases = rawCats.map(c => ({
        ...c, phrases: rawPhrases.filter(p => p.category_id === c.id)
      }));
      setCats(catsWithPhrases);

      // Combine scenarios + phrases
      const scensWithPhrases = rawScens.map(s => ({
        ...s, phrases: rawScenPhrases.filter(p => p.scenario_id === s.id)
      }));
      setScenarios(scensWithPhrases);

      setReframes(rawReframes);
      setJournal(rawJournal);
      setSessions(rawSessions);

      // Coach: load all clients
      if (isCoach) {
        const profileTable = await sb.from("iv_profiles");
        const allProfiles = await profileTable.select("*", "&role=eq.client");
        setCoachClients(allProfiles);
      }
    } catch (err) {
      console.error("Load error:", err);
    }
    setLoading(false);
  };

  const seedDefaults = async (userId) => {
    const catTable = await sb.from("iv_categories");
    const phraseTable = await sb.from("iv_phrases");
    const scenTable = await sb.from("iv_scenarios");
    const scenPhraseTable = await sb.from("iv_scenario_phrases");

    // Seed categories + phrases
    for (const seed of SEED_CATEGORIES) {
      const [cat] = await catTable.insert({ user_id: userId, name: seed.name, icon: seed.icon, sort_order: seed.sort_order });
      for (const text of seed.phrases) {
        await phraseTable.insert({ user_id: userId, category_id: cat.id, text, is_active: true });
      }
    }
    // Seed scenarios
    for (const seed of SEED_SCENARIOS) {
      const [scen] = await scenTable.insert({ user_id: userId, name: seed.name, icon: seed.icon, description: seed.description });
      for (const text of seed.phrases) {
        await scenPhraseTable.insert({ user_id: userId, scenario_id: scen.id, text });
      }
    }
    return catTable.select("*", `&user_id=eq.${userId}&order=sort_order.asc`);
  };

  // Record practice session
  const recordSession = async (type, count) => {
    try {
      const table = await sb.from("iv_practice_sessions");
      const [s] = await table.insert({ user_id: user.id, session_type: type, phrases_count: count });
      setSessions(prev => [s, ...prev]);
    } catch {}
  };

  // Streak calculation
  const calcStreak = () => {
    if (!sessions.length) return { streak: 0, doneToday: false };
    const dates = [...new Set(sessions.map(s => s.created_at.slice(0, 10)))].sort().reverse();
    const today = new Date().toISOString().slice(0, 10);
    const doneToday = dates[0] === today;
    let streak = doneToday ? 1 : 0;
    const start = doneToday ? 1 : 0;
    for (let i = start; i < dates.length; i++) {
      const expected = new Date(Date.now() - (i + (doneToday ? 0 : 1)) * 86400000).toISOString().slice(0, 10);
      if (dates[i] === expected) streak++;
      else break;
    }
    return { streak, doneToday };
  };

  const { streak, doneToday } = calcStreak();
  const totalPhrases = cats.reduce((s, c) => s + c.phrases.length, 0);

  const NAV = [
    { id: "home", icon: "◈", label: "Home" },
    { id: "library", icon: "✦", label: "Sätze" },
    { id: "practice", icon: "▶", label: "Praxis" },
    { id: "scenarios", icon: "◉", label: "Szenarien" },
    { id: "reframer", icon: "⟲", label: "Reframe" },
    { id: "journal", icon: "✎", label: "Journal" },
    ...(isCoach ? [{ id: "coach", icon: "👁", label: "Coach" }] : []),
  ];

  if (loading) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: C.bg, color: C.textSoft, fontSize: 13 }}>Daten werden geladen...</div>;

  return (
    <div style={{ paddingBottom: 68 }}>
      {/* Header */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 16px", borderBottom: `1px solid ${C.border}`, background: C.bg, position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <svg width="24" height="24" viewBox="0 0 40 40"><rect width="40" height="40" rx="7" fill={C.red}/><text x="7" y="19" fill="white" fontSize="16" fontWeight="800" fontFamily="sans-serif">P</text><text x="7" y="35" fill="white" fontSize="16" fontWeight="800" fontFamily="sans-serif">U</text></svg>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.white }}>INNER VOICE</div>
            <div style={{ fontSize: 11, color: C.textSoft, letterSpacing: 1.5, textTransform: "uppercase" }}>
              {user.display_name || user.email} {isCoach && "· COACH"}
            </div>
          </div>
        </div>
        <button onClick={onLogout} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 6, color: C.textSoft, fontSize: 11, padding: "5px 12px", cursor: "pointer" }}>Logout</button>
      </header>

      {/* Content */}
      <main>
        {view === "home" && <HomeView streak={streak} doneToday={doneToday} total={totalPhrases} reframeCount={reframes.length} journalCount={journal.length} go={setView} isCoach={isCoach} />}
        {view === "library" && <LibraryView cats={cats} setCats={setCats} userId={user.id} reload={loadData} />}
        {view === "practice" && <PracticeView cats={cats} record={recordSession} />}
        {view === "scenarios" && <ScenariosViewComp scenarios={scenarios} setScenarios={setScenarios} userId={user.id} record={recordSession} reload={loadData} />}
        {view === "reframer" && <ReframerView reframes={reframes} setReframes={setReframes} userId={user.id} record={recordSession} />}
        {view === "journal" && <JournalComp journal={journal} setJournal={setJournal} userId={user.id} record={recordSession} />}
        {view === "coach" && isCoach && <CoachDashboard clients={coachClients} />}
      </main>

      {/* Nav */}
      <nav style={{ display: "flex", justifyContent: "space-around", position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, background: `${C.surface}F5`, borderTop: `1px solid ${C.border}`, padding: "5px 0 10px", zIndex: 100, backdropFilter: "blur(12px)" }}>
        {NAV.map(n => (
          <button key={n.id} onClick={() => setView(n.id)}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, background: "none", border: "none", color: view === n.id ? C.red : C.textSoft, cursor: "pointer", padding: "4px 5px", minWidth: 44 }}>
            <span style={{ fontSize: 17 }}>{n.icon}</span>
            <span style={{ fontSize: 9, fontWeight: view === n.id ? 600 : 400 }}>{n.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

/* ── Home ── */
function HomeView({ streak, doneToday, total, reframeCount, journalCount, go, isCoach }) {
  const h = new Date().getHours();
  const greet = h < 12 ? "Guten Morgen" : h < 18 ? "Guten Tag" : "Guten Abend";
  return (
    <div style={{ padding: 16 }}>
      <Card style={{ padding: 20, marginBottom: 16, borderLeft: `3px solid ${C.red}` }}>
        <div style={{ fontSize: 11, color: C.red, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>{greet}</div>
        <h2 style={{ fontSize: 19, fontWeight: 700, color: C.white, lineHeight: 1.3, marginBottom: 6 }}>Wie sprichst du heute mit dir?</h2>
        <p style={{ fontSize: 13, color: C.textMid, lineHeight: 1.5 }}>Trainiere deinen inneren Dialog bewusst.</p>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 20 }}>
        {[{ v: streak, l: "Streak", dot: doneToday }, { v: total, l: "Sätze" }, { v: reframeCount, l: "Reframes" }, { v: journalCount, l: "Journal" }].map((s, i) => (
          <Card key={i} style={{ padding: "12px 6px", textAlign: "center", position: "relative" }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: C.white }}>{s.v}</div>
            <div style={{ fontSize: 12, color: C.textSoft, textTransform: "uppercase" }}>{s.l}</div>
            {s.dot && <div style={{ position: "absolute", top: 5, right: 5, width: 5, height: 5, borderRadius: 3, background: C.green }} />}
          </Card>
        ))}
      </div>

      <Label>Schnellstart</Label>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 22 }}>
        {[
          { icon: "▶", label: "Praxis", desc: "Sätze durchgehen", v: "practice" },
          { icon: "◉", label: "Szenarien", desc: "Situationen üben", v: "scenarios" },
          { icon: "⟲", label: "Reframe", desc: "Gedanken umdrehen", v: "reframer" },
          { icon: "✎", label: "Journal", desc: "Eintrag schreiben", v: "journal" },
          ...(isCoach ? [{ icon: "👁", label: "Coach", desc: "Klienten ansehen", v: "coach" }] : []),
        ].map((a, i) => (
          <button key={i} onClick={() => go(a.v)} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 12px", cursor: "pointer", textAlign: "left" }}>
            <div style={{ fontSize: 18, marginBottom: 4 }}>{a.icon}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.white }}>{a.label}</div>
            <div style={{ fontSize: 12, color: C.textSoft, marginTop: 2 }}>{a.desc}</div>
          </button>
        ))}
      </div>

      <Card style={{ padding: "16px 18px", textAlign: "center", borderTop: `2px solid ${C.red}` }}>
        <p style={{ fontSize: 13, fontStyle: "italic", color: C.textMid, lineHeight: 1.6 }}>"Der wichtigste Mensch, mit dem du je reden wirst, bist du selbst."</p>
        <div style={{ fontSize: 11, color: C.textSoft, marginTop: 6, letterSpacing: 1.5, textTransform: "uppercase" }}>— Coach Chang</div>
      </Card>

      <div style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: C.textSoft, opacity: 0.4 }}>v{APP_VERSION}</div>
    </div>
  );
}

/* ── Library ── */
function LibraryView({ cats, setCats, userId, reload }) {
  const [open, setOpen] = useState(null);
  const [newT, setNewT] = useState("");
  const [adding, setAdding] = useState(null);

  const addPhrase = async (catId) => {
    if (!newT.trim()) return;
    try {
      const table = await sb.from("iv_phrases");
      await table.insert({ user_id: userId, category_id: catId, text: newT.trim(), is_active: true });
      setNewT(""); setAdding(null);
      reload();
    } catch (err) { console.error(err); }
  };

  const togglePhrase = async (phrase) => {
    try {
      const table = await sb.from("iv_phrases");
      await table.update({ is_active: !phrase.is_active }, { id: phrase.id });
      reload();
    } catch (err) { console.error(err); }
  };

  const deletePhrase = async (id) => {
    try {
      const table = await sb.from("iv_phrases");
      await table.delete({ id });
      reload();
    } catch (err) { console.error(err); }
  };

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: C.white, fontFamily: "'Bebas Neue', sans-serif", letterSpacing: 1.5, marginBottom: 4 }}>SELF-TALK BIBLIOTHEK</h2>
      <p style={{ fontSize: 13, color: C.textMid, marginBottom: 18, lineHeight: 1.4 }}>Deine Sätze für jede Situation.</p>

      {cats.map(cat => {
        const isOpen = open === cat.id;
        const active = cat.phrases.filter(p => p.is_active).length;
        return (
          <Card key={cat.id} style={{ marginBottom: 8, overflow: "hidden" }}>
            <button onClick={() => setOpen(isOpen ? null : cat.id)}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", width: "100%", background: "none", border: "none", color: C.text, cursor: "pointer" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 18 }}>{cat.icon}</span>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.white }}>{cat.name}</div>
                  <div style={{ fontSize: 12, color: C.textSoft }}>{active}/{cat.phrases.length} aktiv</div>
                </div>
              </div>
              <span style={{ color: C.textSoft, fontSize: 12, display: "inline-block", transform: isOpen ? "rotate(180deg)" : "none" }}>▾</span>
            </button>
            {isOpen && (
              <div style={{ padding: "0 14px 12px" }}>
                {cat.phrases.map(p => (
                  <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0", borderBottom: `1px solid ${C.border}`, opacity: p.is_active ? 1 : 0.35 }}>
                    <button onClick={() => togglePhrase(p)}
                      style={{ width: 20, height: 20, borderRadius: 4, border: "none", background: p.is_active ? C.red : C.borderLight, color: C.white, fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {p.is_active ? "✓" : ""}
                    </button>
                    <span style={{ fontSize: 13, flex: 1, lineHeight: 1.4, color: C.text }}>{p.text}</span>
                    <button onClick={() => deletePhrase(p.id)}
                      style={{ background: "none", border: "none", color: C.textSoft, cursor: "pointer", fontSize: 11, padding: 3 }}>✕</button>
                  </div>
                ))}
                {adding === cat.id ? (
                  <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                    <input value={newT} onChange={e => setNewT(e.target.value)} onKeyDown={e => e.key === "Enter" && addPhrase(cat.id)}
                      placeholder="Neuen Satz eingeben..." autoFocus style={{ ...inputStyle, flex: 1, padding: "7px 10px", fontSize: 12 }} />
                    <button onClick={() => addPhrase(cat.id)} style={{ width: 30, height: 30, borderRadius: 6, border: "none", background: C.red, color: C.white, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                  </div>
                ) : (
                  <button onClick={() => setAdding(cat.id)} style={{ width: "100%", padding: 8, marginTop: 8, background: "none", border: `1px dashed ${C.borderLight}`, borderRadius: 6, color: C.textSoft, fontSize: 11, cursor: "pointer" }}>+ Satz hinzufügen</button>
                )}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

/* ── Practice ── */
function PracticeView({ cats, record }) {
  const [phase, setPhase] = useState("select");
  const [selCats, setSelCats] = useState([]);
  const [idx, setIdx] = useState(0);
  const [doneCount, setDoneCount] = useState(0);

  const phrases = selCats.flatMap(cid => {
    const c = cats.find(x => x.id === cid);
    return c ? c.phrases.filter(p => p.is_active).map(p => ({ ...p, cat: c.name })) : [];
  });

  if (phase === "select") {
    return (
      <div style={{ padding: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: C.white, fontFamily: "'Bebas Neue', sans-serif", letterSpacing: 1.5, marginBottom: 4 }}>SELF-TALK PRAXIS</h2>
        <p style={{ fontSize: 13, color: C.textMid, marginBottom: 18 }}>Kategorien wählen, dann Satz für Satz laut vorlesen.</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {cats.map(cat => {
            const sel = selCats.includes(cat.id);
            const n = cat.phrases.filter(p => p.is_active).length;
            return (
              <button key={cat.id} onClick={() => setSelCats(p => sel ? p.filter(c => c !== cat.id) : [...p, cat.id])}
                style={{ background: sel ? C.redSoft : C.card, border: `1px solid ${sel ? C.red : C.border}`, borderRadius: 10, padding: 12, cursor: "pointer", textAlign: "center" }}>
                <span style={{ fontSize: 22 }}>{cat.icon}</span>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.white, marginTop: 4 }}>{cat.name}</div>
                <div style={{ fontSize: 12, color: C.textSoft, marginTop: 2 }}>{n} Sätze</div>
              </button>
            );
          })}
        </div>
        <Btn onClick={() => { setPhase("go"); setIdx(0); }} disabled={!phrases.length} style={{ marginTop: 16 }}>
          Session starten ({phrases.length} Sätze)
        </Btn>
      </div>
    );
  }

  if (phase === "go") {
    const p = phrases[idx];
    if (!p) return <div style={{ padding: 16, textAlign: "center" }}><p style={{ color: C.textMid }}>Keine Sätze.</p><Btn onClick={() => setPhase("select")}>Zurück</Btn></div>;
    const pct = ((idx + 1) / phrases.length) * 100;
    return (
      <div style={{ padding: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 3, background: C.border, borderRadius: 2, overflow: "hidden" }}>
            <div style={{ height: "100%", background: C.red, borderRadius: 2, width: `${pct}%`, transition: "width 0.3s" }} />
          </div>
          <span style={{ fontSize: 11, color: C.textSoft }}>{idx + 1}/{phrases.length}</span>
        </div>
        <div style={{ fontSize: 12, color: C.red, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10 }}>{p.cat}</div>
        <Card style={{ padding: "28px 18px", textAlign: "center", marginBottom: 16, borderTop: `2px solid ${C.red}` }}>
          <div style={{ fontSize: 18, fontWeight: 600, lineHeight: 1.5, color: C.white }}>"{p.text}"</div>
        </Card>
        <p style={{ fontSize: 12, color: C.textSoft, textAlign: "center", marginBottom: 18 }}>Lies den Satz laut vor. Wiederhole 2–3 mal.</p>
        <Btn onClick={() => {
          if (idx < phrases.length - 1) setIdx(idx + 1);
          else { setDoneCount(phrases.length); record("practice", phrases.length); setPhase("done"); }
        }}>
          {idx < phrases.length - 1 ? "Nächster Satz →" : "Session beenden ✓"}
        </Btn>
        <button onClick={() => setPhase("select")} style={{ display: "block", margin: "12px auto", background: "none", border: "none", color: C.textSoft, fontSize: 12, cursor: "pointer" }}>Abbrechen</button>
      </div>
    );
  }

  return (
    <div style={{ padding: 16, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 350, textAlign: "center" }}>
      <div style={{ fontSize: 40, color: C.red, marginBottom: 12 }}>✦</div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: C.white, fontFamily: "'Bebas Neue', sans-serif", letterSpacing: 1.5, marginBottom: 8 }}>SESSION FERTIG</h2>
      <p style={{ fontSize: 14, color: C.textMid, marginBottom: 24 }}>{doneCount} Sätze durchgearbeitet. Stark!</p>
      <Btn onClick={() => { setPhase("select"); setSelCats([]); setIdx(0); setDoneCount(0); }}>Neue Session</Btn>
    </div>
  );
}

/* ── Scenarios ── */
function ScenariosViewComp({ scenarios, setScenarios, userId, record, reload }) {
  const [active, setActive] = useState(null);
  const [phase, setPhase] = useState("list");
  const [idx, setIdx] = useState(0);
  const [note, setNote] = useState("");
  const [newPhrase, setNewPhrase] = useState("");
  const [newScen, setNewScen] = useState({ name: "", icon: "📌", description: "" });

  const sit = scenarios.find(s => s.id === active);
  const phrases = sit?.phrases || [];
  const goBack = () => { setPhase("list"); setActive(null); setIdx(0); setNote(""); setNewPhrase(""); };

  const addScenario = async () => {
    if (!newScen.name.trim()) return;
    try {
      const table = await sb.from("iv_scenarios");
      await table.insert({ user_id: userId, name: newScen.name.trim(), icon: newScen.icon || "📌", description: newScen.description.trim() });
      setNewScen({ name: "", icon: "📌", description: "" });
      reload();
      setPhase("list");
    } catch (err) { console.error(err); }
  };

  const addScenPhrase = async () => {
    if (!newPhrase.trim() || !active) return;
    try {
      const table = await sb.from("iv_scenario_phrases");
      await table.insert({ user_id: userId, scenario_id: active, text: newPhrase.trim() });
      setNewPhrase("");
      reload();
    } catch (err) { console.error(err); }
  };

  const deleteScenPhrase = async (id) => {
    try { const t = await sb.from("iv_scenario_phrases"); await t.delete({ id }); reload(); } catch {}
  };

  const deleteScenario = async (id) => {
    try { const t = await sb.from("iv_scenarios"); await t.delete({ id }); reload(); goBack(); } catch {}
  };

  if (phase === "addNew") {
    return (
      <div style={{ padding: 16 }}>
        <button onClick={() => setPhase("list")} style={{ background: "none", border: "none", color: C.red, fontSize: 12, cursor: "pointer", marginBottom: 14 }}>← Zurück</button>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: C.white, fontFamily: "'Bebas Neue', sans-serif", letterSpacing: 1.5, marginBottom: 14 }}>NEUES SZENARIO</h2>
        <Card style={{ padding: 16 }}>
          <Label>Name</Label>
          <input value={newScen.name} onChange={e => setNewScen({ ...newScen, name: e.target.value })} placeholder="z.B. Prüfungsangst" style={{ ...inputStyle, marginBottom: 12 }} />
          <Label>Emoji</Label>
          <input value={newScen.icon} onChange={e => setNewScen({ ...newScen, icon: e.target.value })} style={{ ...inputStyle, marginBottom: 12, width: 60 }} />
          <Label>Beschreibung</Label>
          <input value={newScen.description} onChange={e => setNewScen({ ...newScen, description: e.target.value })} placeholder="Kurze Beschreibung" style={{ ...inputStyle, marginBottom: 14 }} />
          <Btn onClick={addScenario} disabled={!newScen.name.trim()}>Erstellen</Btn>
        </Card>
      </div>
    );
  }

  if (phase === "edit" && sit) {
    return (
      <div style={{ padding: 16 }}>
        <button onClick={goBack} style={{ background: "none", border: "none", color: C.red, fontSize: 12, cursor: "pointer", marginBottom: 14 }}>← Zurück</button>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <span style={{ fontSize: 28 }}>{sit.icon}</span>
          <div><h2 style={{ fontSize: 16, fontWeight: 700, color: C.white }}>{sit.name}</h2><p style={{ fontSize: 11, color: C.textSoft }}>{sit.description}</p></div>
        </div>
        <Label>Sätze ({phrases.length})</Label>
        {phrases.map(p => (
          <Card key={p.id} style={{ padding: "10px 12px", marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13, flex: 1, color: C.text }}>{p.text}</span>
            <button onClick={() => deleteScenPhrase(p.id)} style={{ background: "none", border: "none", color: C.textSoft, cursor: "pointer", fontSize: 11 }}>✕</button>
          </Card>
        ))}
        <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
          <input value={newPhrase} onChange={e => setNewPhrase(e.target.value)} onKeyDown={e => e.key === "Enter" && addScenPhrase()}
            placeholder="Neuen Satz..." style={{ ...inputStyle, flex: 1, padding: "8px 10px", fontSize: 12 }} />
          <button onClick={addScenPhrase} style={{ width: 30, height: 30, borderRadius: 6, border: "none", background: C.red, color: C.white, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
        </div>
        <button onClick={() => deleteScenario(active)} style={{ display: "block", margin: "20px auto", background: "none", border: "none", color: "#F87171", fontSize: 12, cursor: "pointer" }}>Szenario löschen</button>
      </div>
    );
  }

  if (phase === "practice" && sit) {
    if (!phrases.length) return <div style={{ padding: 16, textAlign: "center" }}><p style={{ color: C.textMid, marginBottom: 16 }}>Keine Sätze.</p><Btn onClick={() => setPhase("edit")}>Sätze hinzufügen</Btn></div>;
    return (
      <div style={{ padding: 16 }}>
        <button onClick={goBack} style={{ background: "none", border: "none", color: C.red, fontSize: 12, cursor: "pointer", marginBottom: 14 }}>← Zurück</button>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <span style={{ fontSize: 30 }}>{sit.icon}</span>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: "4px 0", color: C.white, fontFamily: "'Bebas Neue', sans-serif" }}>{sit.name.toUpperCase()}</h2>
        </div>
        <Card style={{ padding: "24px 16px", textAlign: "center", marginBottom: 14, borderTop: `2px solid ${C.red}` }}>
          <div style={{ fontSize: 11, color: C.textSoft, marginBottom: 10 }}>SATZ {idx + 1}/{phrases.length}</div>
          <div style={{ fontSize: 17, fontWeight: 600, color: C.white, lineHeight: 1.5 }}>"{phrases[idx].text}"</div>
        </Card>
        {idx < phrases.length - 1
          ? <Btn onClick={() => setIdx(idx + 1)}>Nächster Satz →</Btn>
          : <Btn onClick={() => { record("scenario", phrases.length); setPhase("reflect"); }} style={{ background: C.green }}>Reflexion ✓</Btn>
        }
      </div>
    );
  }

  if (phase === "reflect") {
    return (
      <div style={{ padding: 16 }}>
        <Card style={{ padding: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: C.white, marginBottom: 6 }}>Reflexion</h3>
          <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Wie hat es sich angefühlt?" rows={3} style={{ ...inputStyle, marginBottom: 12 }} />
          <Btn onClick={goBack}>Abschließen</Btn>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: C.white, fontFamily: "'Bebas Neue', sans-serif", letterSpacing: 1.5, marginBottom: 4 }}>SITUATIONS-TRAINING</h2>
      <p style={{ fontSize: 13, color: C.textMid, marginBottom: 18 }}>Szenarien mit gezielten Sätzen.</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {scenarios.map(s => (
          <div key={s.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 12 }}>
            <span style={{ fontSize: 24 }}>{s.icon}</span>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.white, marginTop: 4 }}>{s.name}</div>
            <div style={{ fontSize: 11, color: C.red, marginTop: 4 }}>{s.phrases.length} Sätze</div>
            <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
              <button onClick={() => { setActive(s.id); setIdx(0); setPhase("practice"); }}
                style={{ flex: 1, padding: 6, background: C.red, border: "none", borderRadius: 5, color: C.white, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Üben</button>
              <button onClick={() => { setActive(s.id); setPhase("edit"); }}
                style={{ flex: 1, padding: 6, background: "none", border: `1px solid ${C.border}`, borderRadius: 5, color: C.textMid, fontSize: 12, cursor: "pointer" }}>Edit</button>
            </div>
          </div>
        ))}
      </div>
      <button onClick={() => setPhase("addNew")} style={{ width: "100%", padding: 12, marginTop: 12, background: "none", border: `1px dashed ${C.borderLight}`, borderRadius: 8, color: C.textSoft, fontSize: 12, cursor: "pointer" }}>+ Neues Szenario</button>
    </div>
  );
}

/* ── Reframer ── */
function ReframerView({ reframes, setReframes, userId, record }) {
  const [neg, setNeg] = useState("");
  const [pos, setPos] = useState("");
  const [showEx, setShowEx] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    if (!neg.trim() || !pos.trim()) return;
    try {
      const table = await sb.from("iv_reframes");
      const [r] = await table.insert({ user_id: userId, negative_text: neg.trim(), positive_text: pos.trim() });
      setReframes(prev => [r, ...prev]);
      record("reframe", 1);
      setSaved(true);
      setTimeout(() => { setNeg(""); setPos(""); setSaved(false); }, 1200);
    } catch (err) { console.error(err); }
  };

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: C.white, fontFamily: "'Bebas Neue', sans-serif", letterSpacing: 1.5, marginBottom: 4 }}>GEDANKEN-REFRAMER</h2>
      <p style={{ fontSize: 13, color: C.textMid, marginBottom: 18 }}>Wandle destruktive Gedanken in konstruktive um.</p>
      <Card style={{ padding: 16, marginBottom: 12 }}>
        <label style={{ fontSize: 11, fontWeight: 600, color: "#F87171", display: "block", marginBottom: 6 }}>NEGATIVER GEDANKE</label>
        <textarea value={neg} onChange={e => setNeg(e.target.value)} placeholder='"Ich bin nicht gut genug"' rows={2} style={inputStyle} />
        <div style={{ textAlign: "center", fontSize: 18, color: C.red, margin: "8px 0" }}>⟲</div>
        <label style={{ fontSize: 11, fontWeight: 600, color: C.green, display: "block", marginBottom: 6 }}>POSITIVER REFRAME</label>
        <textarea value={pos} onChange={e => setPos(e.target.value)} placeholder='"Ich werde jeden Tag besser"' rows={2} style={inputStyle} />
        <Btn onClick={save} disabled={!neg.trim() || !pos.trim()} style={{ marginTop: 10 }}>
          {saved ? "✓ Gespeichert!" : "Speichern"}
        </Btn>
      </Card>
      <button onClick={() => setShowEx(!showEx)} style={{ background: "none", border: "none", color: C.red, fontSize: 12, cursor: "pointer" }}>
        {showEx ? "Beispiele ausblenden ▴" : "Beispiele ▾"}
      </button>
      {showEx && REFRAME_EXAMPLES.map((ex, i) => (
        <Card key={i} style={{ padding: 10, marginTop: 6 }}>
          <div style={{ fontSize: 12, color: "#F87171" }}>🔴 {ex.neg}</div>
          <div style={{ fontSize: 12, color: "#6EE7B7" }}>🟢 {ex.pos}</div>
          <button onClick={() => { setNeg(ex.neg); setPos(ex.pos); setShowEx(false); }}
            style={{ marginTop: 5, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 4, color: C.textSoft, padding: "3px 8px", fontSize: 12, cursor: "pointer" }}>Verwenden</button>
        </Card>
      ))}
      {reframes.length > 0 && (
        <div style={{ marginTop: 18 }}>
          <Label>Gespeichert ({reframes.length})</Label>
          {reframes.slice(0, 12).map(r => (
            <Card key={r.id} style={{ padding: 10, marginBottom: 6 }}>
              <div style={{ fontSize: 11, color: C.textSoft, marginBottom: 4 }}>{new Date(r.created_at).toLocaleDateString("de-DE")}</div>
              <div style={{ fontSize: 12, color: "#F87171" }}>🔴 {r.negative_text}</div>
              <div style={{ fontSize: 12, color: "#6EE7B7" }}>🟢 {r.positive_text}</div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Journal ── */
function JournalComp({ journal, setJournal, userId, record }) {
  const [mood, setMood] = useState(3);
  const [text, setText] = useState("");
  const [type, setType] = useState("neutral");
  const [saved, setSaved] = useState(false);

  const MOODS = [{ v: 1, e: "😞", l: "Schlecht" }, { v: 2, e: "😐", l: "Mäßig" }, { v: 3, e: "🙂", l: "Okay" }, { v: 4, e: "😊", l: "Gut" }, { v: 5, e: "🔥", l: "Stark" }];
  const TYPES = [{ v: "negative", l: "Negativ", c: "#F87171" }, { v: "neutral", l: "Neutral", c: C.textMid }, { v: "positive", l: "Positiv", c: C.green }];

  const save = async () => {
    if (!text.trim()) return;
    try {
      const table = await sb.from("iv_journal");
      const [entry] = await table.insert({ user_id: userId, mood, self_talk_type: type, text: text.trim() });
      setJournal(prev => [entry, ...prev]);
      record("journal", 1);
      setSaved(true);
      setTimeout(() => { setText(""); setMood(3); setType("neutral"); setSaved(false); }, 1200);
    } catch (err) { console.error(err); }
  };

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: C.white, fontFamily: "'Bebas Neue', sans-serif", letterSpacing: 1.5, marginBottom: 4 }}>SELF-TALK JOURNAL</h2>
      <p style={{ fontSize: 13, color: C.textMid, marginBottom: 18 }}>Wie hast du heute mit dir gesprochen?</p>
      <Card style={{ padding: 16, marginBottom: 20 }}>
        <Label>Stimmung</Label>
        <div style={{ display: "flex", gap: 4, marginBottom: 14 }}>
          {MOODS.map(m => (
            <button key={m.v} onClick={() => setMood(m.v)}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "6px 4px", borderRadius: 8, border: "none", cursor: "pointer", background: mood === m.v ? C.surface : "transparent", flex: 1 }}>
              <span style={{ fontSize: 20 }}>{m.e}</span>
              <span style={{ fontSize: 8, color: mood === m.v ? C.text : C.textSoft }}>{m.l}</span>
            </button>
          ))}
        </div>
        <Label>Art</Label>
        <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
          {TYPES.map(t => (
            <button key={t.v} onClick={() => setType(t.v)}
              style={{ flex: 1, padding: 8, borderRadius: 6, background: type === t.v ? C.surface : "transparent", border: type === t.v ? `1px solid ${t.c}` : `1px solid ${C.border}`, color: type === t.v ? t.c : C.textSoft, fontSize: 11, fontWeight: 500, cursor: "pointer" }}>
              {t.l}
            </button>
          ))}
        </div>
        <Label>Gedanken</Label>
        <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Was ging dir durch den Kopf?" rows={3} style={{ ...inputStyle, marginBottom: 10 }} />
        <Btn onClick={save} disabled={!text.trim()}>{saved ? "✓ Gespeichert!" : "Speichern"}</Btn>
      </Card>
      {journal.length > 0 && (
        <>
          <Label>Einträge ({journal.length})</Label>
          {journal.slice(0, 15).map(entry => (
            <Card key={entry.id} style={{ padding: 10, marginBottom: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 14 }}>{MOODS.find(m => m.v === entry.mood)?.e}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: TYPES.find(t => t.v === entry.self_talk_type)?.c }}>{TYPES.find(t => t.v === entry.self_talk_type)?.l}</span>
                <span style={{ fontSize: 11, color: C.textSoft, marginLeft: "auto" }}>{new Date(entry.created_at).toLocaleDateString("de-DE")}</span>
              </div>
              <p style={{ fontSize: 12, color: C.textMid, lineHeight: 1.5 }}>{entry.text}</p>
            </Card>
          ))}
        </>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   COACH DASHBOARD
   ───────────────────────────────────────────── */
function CoachDashboard({ clients }) {
  const [selected, setSelected] = useState(null);
  const [clientData, setClientData] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadClient = async (client) => {
    setSelected(client);
    setLoading(true);
    try {
      const uid = `&user_id=eq.${client.id}`;
      const journalTable = await sb.from("iv_journal");
      const reframeTable = await sb.from("iv_reframes");
      const sessionTable = await sb.from("iv_practice_sessions");
      const catTable = await sb.from("iv_categories");
      const phraseTable = await sb.from("iv_phrases");

      const journal = await journalTable.select("*", uid + "&order=created_at.desc&limit=20");
      const reframes = await reframeTable.select("*", uid + "&order=created_at.desc&limit=20");
      const sessions = await sessionTable.select("*", uid + "&order=created_at.desc&limit=30");
      const cats = await catTable.select("*", uid);
      const phrases = await phraseTable.select("*", uid);

      setClientData({ journal, reframes, sessions, totalPhrases: phrases.length, totalCats: cats.length });
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  if (selected && clientData) {
    const MOODS = [null, "😞", "😐", "🙂", "😊", "🔥"];
    return (
      <div style={{ padding: 16 }}>
        <button onClick={() => { setSelected(null); setClientData(null); }}
          style={{ background: "none", border: "none", color: C.red, fontSize: 12, cursor: "pointer", marginBottom: 14 }}>← Alle Klienten</button>

        <Card style={{ padding: 16, marginBottom: 16, borderLeft: `3px solid ${C.red}` }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: C.white, marginBottom: 4 }}>{selected.display_name || selected.email}</h2>
          <p style={{ fontSize: 11, color: C.textSoft }}>{selected.email}</p>
          <p style={{ fontSize: 11, color: C.textSoft }}>Dabei seit {new Date(selected.created_at).toLocaleDateString("de-DE")}</p>
        </Card>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 18 }}>
          <Card style={{ padding: "10px 8px", textAlign: "center" }}><div style={{ fontSize: 18, fontWeight: 700, color: C.white }}>{clientData.sessions.length}</div><div style={{ fontSize: 12, color: C.textSoft }}>SESSIONS</div></Card>
          <Card style={{ padding: "10px 8px", textAlign: "center" }}><div style={{ fontSize: 18, fontWeight: 700, color: C.white }}>{clientData.reframes.length}</div><div style={{ fontSize: 12, color: C.textSoft }}>REFRAMES</div></Card>
          <Card style={{ padding: "10px 8px", textAlign: "center" }}><div style={{ fontSize: 18, fontWeight: 700, color: C.white }}>{clientData.journal.length}</div><div style={{ fontSize: 12, color: C.textSoft }}>JOURNAL</div></Card>
        </div>

        {clientData.journal.length > 0 && (
          <>
            <Label>Letzte Journal-Einträge</Label>
            {clientData.journal.slice(0, 8).map(e => (
              <Card key={e.id} style={{ padding: 10, marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <span>{MOODS[e.mood]}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: e.self_talk_type === "positive" ? C.green : e.self_talk_type === "negative" ? "#F87171" : C.textSoft }}>{e.self_talk_type}</span>
                  <span style={{ fontSize: 11, color: C.textSoft, marginLeft: "auto" }}>{new Date(e.created_at).toLocaleDateString("de-DE")}</span>
                </div>
                <p style={{ fontSize: 12, color: C.textMid, lineHeight: 1.4 }}>{e.text}</p>
              </Card>
            ))}
          </>
        )}

        {clientData.reframes.length > 0 && (
          <>
            <Label>Letzte Reframes</Label>
            {clientData.reframes.slice(0, 5).map(r => (
              <Card key={r.id} style={{ padding: 10, marginBottom: 6 }}>
                <div style={{ fontSize: 12, color: "#F87171" }}>🔴 {r.negative_text}</div>
                <div style={{ fontSize: 12, color: "#6EE7B7" }}>🟢 {r.positive_text}</div>
              </Card>
            ))}
          </>
        )}
      </div>
    );
  }

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: C.white, fontFamily: "'Bebas Neue', sans-serif", letterSpacing: 1.5, marginBottom: 4 }}>COACH DASHBOARD</h2>
      <p style={{ fontSize: 13, color: C.textMid, marginBottom: 18 }}>Deine Klienten und deren Fortschritt.</p>

      {loading && <p style={{ color: C.textSoft }}>Laden...</p>}

      {clients.length === 0 ? (
        <Card style={{ padding: 20, textAlign: "center" }}>
          <p style={{ color: C.textSoft, fontSize: 13 }}>Noch keine Klienten registriert.</p>
        </Card>
      ) : clients.map(c => (
        <button key={c.id} onClick={() => loadClient(c)}
          style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: 14, background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, marginBottom: 8, cursor: "pointer", textAlign: "left" }}>
          <div style={{ width: 36, height: 36, borderRadius: 18, background: C.redSoft, display: "flex", alignItems: "center", justifyContent: "center", color: C.red, fontWeight: 700, fontSize: 14 }}>
            {(c.display_name || c.email)[0].toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.white }}>{c.display_name || c.email}</div>
            <div style={{ fontSize: 11, color: C.textSoft }}>Seit {new Date(c.created_at).toLocaleDateString("de-DE")}</div>
          </div>
        </button>
      ))}
    </div>
  );
}
