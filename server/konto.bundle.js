// server/konto.ts
import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

// server/schummel.ts
var SCHUMMEL_MUENZEN = 1e7;
var SCHUMMEL_MATERIAL = 5e5;
function stadtVon(daten) {
  if (!daten || typeof daten !== "object") return null;
  const stadt = daten.city;
  return stadt && typeof stadt === "object" ? stadt : null;
}
var zahl = (wert) => typeof wert === "number" && Number.isFinite(wert) ? wert : 0;
function rohSchummelt(daten) {
  if (!daten || typeof daten !== "object") return false;
  const roh = daten;
  const stadt = stadtVon(daten);
  if (roh.schummel === true || stadt?.schummel === true) return true;
  return zahl(stadt?.coins) >= SCHUMMEL_MUENZEN || zahl(stadt?.materials) >= SCHUMMEL_MATERIAL;
}
function schummelSichern(daten, bisher) {
  if (!rohSchummelt(daten) && !rohSchummelt(bisher)) return daten;
  if (!daten || typeof daten !== "object") return daten;
  const obj = { ...daten, schummel: true };
  const stadt = stadtVon(obj);
  if (stadt) obj.city = { ...stadt, schummel: true };
  return obj;
}

// server/speicher.ts
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, normalize } from "node:path";
var KonfliktFehler = class extends Error {
  constructor() {
    super("Die Datei wurde zwischenzeitlich ge\xE4ndert.");
  }
};
function pruefePfad(pfad) {
  const sauber = normalize(pfad).replace(/\\/g, "/");
  if (sauber.startsWith("/") || sauber.includes("..")) throw new Error(`Ung\xFCltiger Pfad: ${pfad}`);
  return sauber;
}
function githubSpeicher(token, repo) {
  const basis = `https://api.github.com/repos/${repo}/contents/`;
  const kopf = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "User-Agent": "weltwissen-konten",
    "X-GitHub-Api-Version": "2022-11-28"
  };
  return {
    art: "github",
    async lesen(pfad) {
      const antwort2 = await fetch(basis + pruefePfad(pfad), { headers: kopf, cache: "no-store" });
      if (antwort2.status === 404) return null;
      if (!antwort2.ok) throw new Error(`GitHub lesen: ${antwort2.status}`);
      const json = await antwort2.json();
      if (typeof json.content !== "string") throw new Error("GitHub lesen: kein Inhalt");
      const inhalt = Buffer.from(json.content.replace(/\n/g, ""), "base64").toString("utf8");
      return { inhalt, marke: json.sha };
    },
    async schreiben(pfad, inhalt, marke) {
      const sauber = pruefePfad(pfad);
      const versuch = async (sha2) => fetch(basis + sauber, {
        method: "PUT",
        headers: { ...kopf, "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Stand ${sauber}`,
          content: Buffer.from(inhalt, "utf8").toString("base64"),
          ...sha2 ? { sha: sha2 } : {}
        })
      });
      let antwort2 = await versuch(marke);
      if (antwort2.status === 409 || antwort2.status === 422) {
        const jetzt = await this.lesen(sauber);
        if (jetzt && jetzt.marke !== marke) throw new KonfliktFehler();
        antwort2 = await versuch(jetzt?.marke);
      }
      if (!antwort2.ok) throw new Error(`GitHub schreiben: ${antwort2.status} ${(await antwort2.text()).slice(0, 200)}`);
      const json = await antwort2.json();
      return json.content?.sha;
    },
    async liste(ordner) {
      const antwort2 = await fetch(basis + pruefePfad(ordner), { headers: kopf, cache: "no-store" });
      if (antwort2.status === 404) return [];
      if (!antwort2.ok) throw new Error(`GitHub auflisten: ${antwort2.status}`);
      const json = await antwort2.json();
      if (!Array.isArray(json)) return [];
      return json.filter((eintrag) => eintrag.type === "file" && typeof eintrag.name === "string").map((eintrag) => eintrag.name);
    }
  };
}
function dateiSpeicher(ordner) {
  return {
    art: "datei",
    async lesen(pfad) {
      try {
        const inhalt = await readFile(join(ordner, pruefePfad(pfad)), "utf8");
        return { inhalt };
      } catch (fehler) {
        if (fehler.code === "ENOENT") return null;
        throw fehler;
      }
    },
    async schreiben(pfad, inhalt) {
      const ziel = join(ordner, pruefePfad(pfad));
      await mkdir(dirname(ziel), { recursive: true });
      await writeFile(ziel, inhalt, "utf8");
      return void 0;
    },
    async liste(ordnerName) {
      try {
        const namen = await readdir(join(ordner, pruefePfad(ordnerName)));
        return namen.filter((name) => name.endsWith(".json"));
      } catch (fehler) {
        if (fehler.code === "ENOENT") return [];
        throw fehler;
      }
    }
  };
}
var gewaehlt;
function speicher() {
  if (gewaehlt !== void 0) return gewaehlt;
  const token = process.env.KONTO_GITHUB_TOKEN;
  const repo = process.env.KONTO_GITHUB_REPO;
  if (token && repo) gewaehlt = githubSpeicher(token, repo);
  else if (process.env.KONTO_ORDNER || process.env.NODE_ENV !== "production") {
    gewaehlt = dateiSpeicher(process.env.KONTO_ORDNER ?? join(process.cwd(), ".konto-daten"));
  } else gewaehlt = null;
  return gewaehlt;
}

// server/konto.ts
var Abgelehnt = class extends Error {
  constructor(status, nachricht, zusatz = {}) {
    super(nachricht);
    this.status = status;
    this.zusatz = zusatz;
  }
  status;
  zusatz;
};
var EIN_JAHR = 365 * 24 * 60 * 60 * 1e3;
var DATEN_MAX = 2 * 1024 * 1024;
var geheimnis = () => {
  const g = process.env.KONTO_GEHEIMNIS ?? process.env.KONTO_GITHUB_TOKEN;
  if (g) return g;
  if (process.env.NODE_ENV === "production") throw new Abgelehnt(503, "Der Server ist nicht eingerichtet (KONTO_GEHEIMNIS fehlt).");
  return "weltwissen-entwicklung";
};
var b64 = (b) => b.toString("base64url");
var sha = (text) => createHash("sha256").update(text).digest("hex");
var normEmail = (email) => email.trim().toLowerCase();
var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
function pruefeEmail(email) {
  if (typeof email !== "string" || !EMAIL.test(normEmail(email)) || email.length > 200) {
    throw new Abgelehnt(400, "Bitte gib eine g\xFCltige E-Mail-Adresse an.");
  }
  return normEmail(email);
}
function pruefePasswort(passwort) {
  if (typeof passwort !== "string" || passwort.length < 6) throw new Abgelehnt(400, "Das Passwort braucht mindestens 6 Zeichen.");
  if (passwort.length > 200) throw new Abgelehnt(400, "Das Passwort ist zu lang.");
  return passwort;
}
function pruefeName(name) {
  const sauber = typeof name === "string" ? name.trim().replace(/\s+/g, " ") : "";
  if (sauber.length < 1) throw new Abgelehnt(400, "Wie sollen wir dich nennen? Bitte gib einen Namen an.");
  if (sauber.length > 30) throw new Abgelehnt(400, "Der Name darf h\xF6chstens 30 Zeichen haben.");
  return sauber;
}
var kontoPfad = (email) => `konten/${sha(email)}.json`;
var datenPfad = (id) => `daten/${id}.json`;
function ablage() {
  const s = speicher();
  if (!s) throw new Abgelehnt(503, "Auf dem Server ist noch kein Speicher f\xFCr Konten eingerichtet.");
  return s;
}
var hashe = (passwort, salz) => b64(scryptSync(passwort.normalize("NFKC"), salz, 64, { N: 16384, r: 8, p: 1 }));
function passtPasswort(konto, passwort) {
  const a = Buffer.from(hashe(passwort, konto.salz));
  const b = Buffer.from(konto.hash);
  return a.length === b.length && timingSafeEqual(a, b);
}
function neuesToken(id) {
  const ablauf = Date.now() + EIN_JAHR;
  const kern = `${id}.${ablauf}`;
  return `${kern}.${b64(createHmac("sha256", geheimnis()).update(kern).digest())}`;
}
function pruefeToken(token) {
  if (typeof token !== "string") throw new Abgelehnt(401, "Bitte melde dich an.");
  const teile = token.split(".");
  if (teile.length !== 3) throw new Abgelehnt(401, "Bitte melde dich neu an.");
  const [id, ablauf, sig] = teile;
  const kern = `${id}.${ablauf}`;
  const soll = Buffer.from(b64(createHmac("sha256", geheimnis()).update(kern).digest()));
  const ist = Buffer.from(sig);
  if (soll.length !== ist.length || !timingSafeEqual(soll, ist)) throw new Abgelehnt(401, "Bitte melde dich neu an.");
  if (Number(ablauf) < Date.now()) throw new Abgelehnt(401, "Deine Anmeldung ist abgelaufen \u2013 bitte melde dich neu an.");
  if (!/^[a-f0-9]{24}$/.test(id)) throw new Abgelehnt(401, "Bitte melde dich neu an.");
  return id;
}
async function leseKonto(email) {
  const gelesen = await ablage().lesen(kontoPfad(email));
  if (!gelesen) return null;
  return { konto: JSON.parse(gelesen.inhalt), marke: gelesen.marke };
}
async function leseDaten(id) {
  const gelesen = await ablage().lesen(datenPfad(id));
  if (!gelesen) return null;
  return { ablage: JSON.parse(gelesen.inhalt), marke: gelesen.marke };
}
function pruefeDaten(daten) {
  if (typeof daten !== "object" || daten === null) throw new Abgelehnt(400, "Es kamen keine Spieldaten an.");
  const text = JSON.stringify(daten);
  if (text.length > DATEN_MAX) throw new Abgelehnt(413, "Der Spielstand ist zu gro\xDF.");
  return daten;
}
var oeffentlich = (konto) => ({ id: konto.id, email: konto.email, name: konto.name });
async function registrieren(eingabe) {
  const email = pruefeEmail(eingabe.email);
  const passwort = pruefePasswort(eingabe.passwort);
  const name = pruefeName(eingabe.name);
  if (await leseKonto(email)) throw new Abgelehnt(409, "Zu dieser E-Mail-Adresse gibt es schon ein Konto. Melde dich an.");
  const salz = b64(randomBytes(16));
  const konto = {
    id: randomBytes(12).toString("hex"),
    email,
    name,
    salz,
    hash: hashe(passwort, salz),
    erstellt: Date.now()
  };
  await ablage().schreiben(kontoPfad(email), JSON.stringify(konto));
  let stand = 0;
  if (eingabe.daten !== void 0 && eingabe.daten !== null) {
    stand = Date.now();
    const inhalt = { stand, gespeichert: stand, daten: pruefeDaten(eingabe.daten) };
    await ablage().schreiben(datenPfad(konto.id), JSON.stringify(inhalt));
  }
  return { konto: oeffentlich(konto), token: neuesToken(konto.id), stand };
}
async function anmelden(eingabe) {
  const email = pruefeEmail(eingabe.email);
  const passwort = pruefePasswort(eingabe.passwort);
  const gefunden = await leseKonto(email);
  if (!gefunden || !passtPasswort(gefunden.konto, passwort)) {
    throw new Abgelehnt(401, "E-Mail oder Passwort stimmen nicht.");
  }
  const daten = await leseDaten(gefunden.konto.id);
  return {
    konto: oeffentlich(gefunden.konto),
    token: neuesToken(gefunden.konto.id),
    stand: daten?.ablage.stand ?? 0,
    daten: daten?.ablage.daten ?? null
  };
}
async function laden(eingabe) {
  const id = pruefeToken(eingabe.token);
  const daten = await leseDaten(id);
  return { stand: daten?.ablage.stand ?? 0, daten: daten?.ablage.daten ?? null };
}
async function speichern(eingabe) {
  const id = pruefeToken(eingabe.token);
  const daten = pruefeDaten(eingabe.daten);
  const bekannt = typeof eingabe.stand === "number" ? eingabe.stand : 0;
  for (let versuch = 0; versuch < 2; versuch++) {
    const jetzt = await leseDaten(id);
    if (jetzt && jetzt.ablage.stand !== bekannt && !eingabe.erzwingen) {
      throw new Abgelehnt(409, "Auf dem Server liegt ein neuerer Stand.", {
        stand: jetzt.ablage.stand,
        daten: jetzt.ablage.daten
      });
    }
    const stand = Math.max(Date.now(), (jetzt?.ablage.stand ?? 0) + 1);
    const inhalt = { stand, gespeichert: Date.now(), daten: schummelSichern(daten, jetzt?.ablage.daten) };
    try {
      await ablage().schreiben(datenPfad(id), JSON.stringify(inhalt), jetzt?.marke);
      return { stand };
    } catch (fehler) {
      if (!(fehler instanceof KonfliktFehler) || versuch === 1) throw fehler;
    }
  }
  throw new Abgelehnt(409, "Der Stand konnte nicht gesichert werden \u2013 bitte noch einmal.");
}
async function passwortAendern(eingabe) {
  const id = pruefeToken(eingabe.token);
  const email = pruefeEmail(eingabe.email);
  const altes = pruefePasswort(eingabe.altesPasswort);
  const neues = pruefePasswort(eingabe.neuesPasswort);
  const gefunden = await leseKonto(email);
  if (!gefunden || gefunden.konto.id !== id || !passtPasswort(gefunden.konto, altes)) {
    throw new Abgelehnt(401, "Das bisherige Passwort stimmt nicht.");
  }
  const salz = b64(randomBytes(16));
  const konto = { ...gefunden.konto, salz, hash: hashe(neues, salz) };
  await ablage().schreiben(kontoPfad(email), JSON.stringify(konto), gefunden.marke);
  return { ok: true };
}
function zustand() {
  const s = speicher();
  return { ok: s !== null, speicher: s?.art ?? "keiner" };
}

// src/admin.ts
var ADMIN_EMAIL = "devidkasbeitzer@gmail.com";

// server/rangliste.ts
var RAENGE = [
  { id: "holz", from: 0 },
  { id: "bronze", from: 750 },
  { id: "silber", from: 3e3 },
  { id: "gold", from: 1e4 },
  { id: "platin", from: 25e3 },
  { id: "diamant", from: 6e4 },
  { id: "champion", from: 15e4 }
];
var levelAus = (xp) => {
  let level = 1;
  let needed = 100;
  let rest = Math.max(0, Math.floor(xp));
  while (rest >= needed) {
    rest -= needed;
    level += 1;
    needed += 100;
  }
  return level;
};
var rangAus = (xp) => {
  let id = RAENGE[0].id;
  for (const rang of RAENGE) if (xp >= rang.from) id = rang.id;
  return id;
};
var zahl2 = (wert) => typeof wert === "number" && Number.isFinite(wert) ? wert : 0;
function zeileAus(email, name, stand, daten) {
  const roh = daten && typeof daten === "object" ? daten : {};
  const stadt = roh.city && typeof roh.city === "object" ? roh.city : null;
  const xp = Math.max(0, Math.floor(zahl2(roh.xp)));
  const muenzen = stadt ? Math.max(0, Math.floor(zahl2(stadt.coins))) : 0;
  const ziegel = stadt ? Math.max(0, Math.floor(zahl2(stadt.materials))) : 0;
  const schummel = rohSchummelt(roh);
  const stadtName = stadt && typeof stadt.name === "string" ? stadt.name : "";
  const spieler = name.trim() || stadtName || "Unbekannt";
  return {
    name: spieler.slice(0, 30),
    email,
    rangId: rangAus(xp),
    level: levelAus(xp),
    stadt: stadtName,
    stadtLevel: stadt ? Math.max(1, Math.floor(zahl2(stadt.level))) : 0,
    einwohner: stadt ? Math.max(0, Math.floor(zahl2(stadt.population))) : 0,
    xp,
    muenzen,
    ziegel,
    gebaeude: stadt && Array.isArray(stadt.buildings) ? stadt.buildings.length : 0,
    schummel,
    stand
  };
}
async function alleZeilen() {
  const ablage2 = speicher();
  if (!ablage2) throw new Abgelehnt(503, "Auf dem Server ist noch kein Speicher f\xFCr Konten eingerichtet.");
  const dateien = await ablage2.liste("konten");
  const zeilen2 = [];
  for (const datei of dateien) {
    if (!datei.endsWith(".json")) continue;
    const kontoDatei = await ablage2.lesen(`konten/${datei}`);
    if (!kontoDatei) continue;
    let konto;
    try {
      konto = JSON.parse(kontoDatei.inhalt);
    } catch {
      continue;
    }
    if (!konto.id || !konto.email) continue;
    const datenDatei = await ablage2.lesen(`daten/${konto.id}.json`);
    let stand = 0;
    let daten = null;
    if (datenDatei) {
      try {
        const abgelegt = JSON.parse(datenDatei.inhalt);
        stand = zahl2(abgelegt.stand);
        daten = abgelegt.daten ?? null;
      } catch {
        daten = null;
      }
    }
    zeilen2.push(zeileAus(konto.email, typeof konto.name === "string" ? konto.name : "", stand, daten));
  }
  zeilen2.sort((a, b) => b.einwohner - a.einwohner || b.stadtLevel - a.stadtLevel || b.xp - a.xp || a.name.localeCompare(b.name, "de"));
  return zeilen2;
}
var cache = null;
var CACHE_MS = 2e4;
async function zeilen(frisch) {
  if (!frisch && cache && cache.bis > Date.now()) return cache.zeilen;
  const zeilen2 = await alleZeilen();
  cache = { bis: Date.now() + CACHE_MS, zeilen: zeilen2 };
  return zeilen2;
}
var oeffentlich2 = (zeile) => ({
  name: zeile.name,
  rangId: zeile.rangId,
  level: zeile.level,
  stadt: zeile.stadt,
  stadtLevel: zeile.stadtLevel,
  einwohner: zeile.einwohner
});
async function rangliste(_eingabe) {
  const alle = await zeilen(false);
  return { spieler: alle.filter((zeile) => !zeile.schummel && zeile.stadtLevel > 0).slice(0, 5).map(oeffentlich2) };
}
async function adminVon(token) {
  const id = pruefeToken(token);
  const ablage2 = speicher();
  if (!ablage2) throw new Abgelehnt(503, "Auf dem Server ist noch kein Speicher f\xFCr Konten eingerichtet.");
  const dateien = await ablage2.liste("konten");
  for (const datei of dateien) {
    const gelesen = await ablage2.lesen(`konten/${datei}`);
    if (!gelesen) continue;
    try {
      const konto = JSON.parse(gelesen.inhalt);
      if (konto.id === id) {
        if (normEmail(konto.email ?? "") !== ADMIN_EMAIL) throw new Abgelehnt(403, "Dieser Bereich ist nur f\xFCr die Verwaltung.");
        return;
      }
    } catch (fehler) {
      if (fehler instanceof Abgelehnt) throw fehler;
    }
  }
  throw new Abgelehnt(403, "Dieser Bereich ist nur f\xFCr die Verwaltung.");
}
async function verwaltung(eingabe) {
  await adminVon(eingabe.token);
  const konten = await zeilen(true);
  return {
    konten,
    spieler: konten.filter((zeile) => !zeile.schummel && zeile.stadtLevel > 0).slice(0, 5).map(oeffentlich2)
  };
}

// server/handler.ts
var AKTIONEN = { registrieren, anmelden, laden, speichern, passwortAendern, rangliste, verwaltung };
var versuche = /* @__PURE__ */ new Map();
function bremse(schluessel) {
  const jetzt = Date.now();
  const eintrag = versuche.get(schluessel);
  if (!eintrag || eintrag.bis < jetzt) {
    versuche.set(schluessel, { n: 1, bis: jetzt + 10 * 60 * 1e3 });
    return;
  }
  eintrag.n++;
  if (eintrag.n > 30) throw new Abgelehnt(429, "Zu viele Versuche. Bitte warte ein paar Minuten.");
}
var antwort = (status, body) => new Response(JSON.stringify(body), {
  status,
  headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }
});
async function GET() {
  try {
    return antwort(200, zustand());
  } catch (fehler) {
    console.error("Konto-Status:", fehler);
    return antwort(500, { fehler: fehler instanceof Error ? fehler.message : "Status nicht verf\xFCgbar." });
  }
}
async function POST(request) {
  let body;
  try {
    body = await request.json();
    if (typeof body !== "object" || body === null) throw new Error();
  } catch {
    return antwort(400, { fehler: "Die Anfrage war nicht lesbar." });
  }
  const aktion = body.aktion;
  if (typeof aktion !== "string" || !(aktion in AKTIONEN)) return antwort(400, { fehler: "Unbekannte Aktion." });
  try {
    if (aktion === "anmelden" || aktion === "registrieren") {
      const adresse = request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "lokal";
      bremse(adresse);
    }
    const ergebnis = await AKTIONEN[aktion](body);
    return antwort(200, ergebnis);
  } catch (fehler) {
    if (fehler instanceof Abgelehnt) return antwort(fehler.status, { fehler: fehler.message, ...fehler.zusatz });
    console.error("Konto-Fehler:", fehler);
    return antwort(500, { fehler: "Auf dem Server ist etwas schiefgegangen. Bitte versuche es gleich noch einmal." });
  }
}
export {
  GET,
  POST
};
