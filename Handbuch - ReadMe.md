# Inner Voice – Admin Handbuch
**by Coach Chang · Physiques Unlimited**

---

## 1. App installieren (für Klienten)

### iPhone (Safari)

1. Öffne **Safari** auf dem iPhone
2. Gehe auf: **mindset.physiques-unlimited.de**
3. Tippe unten auf das **Teilen-Symbol** (Quadrat mit Pfeil nach oben ↑)
4. Scrolle runter und tippe auf **„Zum Home-Bildschirm"**
5. Tippe auf **„Hinzufügen"**
6. Die App erscheint auf dem Homescreen – fertig

> **Wichtig:** Es muss Safari sein, kein Chrome oder anderer Browser.

---

### Android (Chrome)

1. Öffne **Chrome** auf dem Android-Handy
2. Gehe auf: **mindset.physiques-unlimited.de**
3. Tippe oben rechts auf die **drei Punkte** (⋮)
4. Tippe auf **„App installieren"** oder **„Zum Startbildschirm hinzufügen"**
5. Bestätige mit **„Installieren"** oder **„Hinzufügen"**
6. Die App erscheint auf dem Homescreen – fertig

> **Wichtig:** Es muss Chrome sein, kein anderer Browser.

---

## 2. Passwort zurücksetzen (als Admin)

Gehe in **Supabase Studio** → **SQL Editor** und führe folgenden Befehl aus:

### Eigenes Passwort zurücksetzen

```sql
UPDATE auth.users
SET encrypted_password = crypt('NEUES_PASSWORT', gen_salt('bf'))
WHERE email = 'support@physiques-unlimited.de';
```

Ersetze `NEUES_PASSWORT` mit deinem gewünschten Passwort.

### Passwort eines Klienten zurücksetzen

```sql
UPDATE auth.users
SET encrypted_password = crypt('NEUES_PASSWORT', gen_salt('bf'))
WHERE email = 'email-des-klienten@beispiel.de';
```

Ersetze `email-des-klienten@beispiel.de` mit der E-Mail des Klienten und `NEUES_PASSWORT` mit dem neuen Passwort.

> **Hinweis:** Den Klienten danach informieren und bitten, das Passwort beim nächsten Login zu merken. Es gibt aktuell keine „Passwort vergessen"-Funktion in der App.

---

## 3. Weitere Admin-Befehle

### Klient zum Coach machen

```sql
UPDATE iv_profiles
SET role = 'coach'
WHERE email = 'email@beispiel.de';
```

### Alle User anzeigen

```sql
SELECT id, email, display_name, role, created_at
FROM iv_profiles
ORDER BY created_at DESC;
```

### Einen User komplett löschen

```sql
-- Erst die User-ID finden
SELECT id FROM auth.users WHERE email = 'email@beispiel.de';

-- Dann löschen (löscht automatisch alle zugehörigen Daten)
DELETE FROM auth.users WHERE email = 'email@beispiel.de';
```

---

## 4. Technische Infos

| Was | Wo |
|-----|-----|
| App-URL | mindset.physiques-unlimited.de |
| Supabase Studio | supabase.physiques-unlimited.de |
| GitHub Repo | github.com/KorChester/inner-voice |
| Coolify | 212.227.3.189 (VPS) |
| Aktuelle Version | v1.7.1 |

### Deployment (App aktualisieren)

1. GitHub → `src/App.jsx` bearbeiten → Commit
2. Coolify → Inner Voice App → Deploy

### Datenbank-Tabellen (alle mit Prefix `iv_`)

| Tabelle | Inhalt |
|---------|--------|
| iv_profiles | User-Profile (Name, E-Mail, Rolle) |
| iv_scenarios | Szenarien (Name, Icon, Beschreibung) |
| iv_scenario_phrases | Sätze innerhalb der Szenarien |
| iv_reframes | Gespeicherte Reframes (negativ → positiv) |
| iv_journal | Journal-Einträge (Stimmung, Typ, Text) |
| iv_practice_sessions | Session-Tracking (für Streak) |
