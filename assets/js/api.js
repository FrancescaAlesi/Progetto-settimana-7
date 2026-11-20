const API_BASE = "https://www.thesportsdb.com/api/v1/json/123";

export class Squadra {
  constructor(data) {
    this.idTeam = data.idTeam;
    this.strTeam = data.strTeam;
    this.strBadge = data.strBadge;
    this.strLeague = data.strLeague || "Campionato non disponibile";
    this.strCountry = data.strCountry || "";
    this.strSport = data.strSport || "";
  }
}

export class Evento {
  constructor(data) {
    this.idEvent = data.idEvent;
    this.dateEvent = data.dateEvent || "";
    this.strHomeTeam = data.strHomeTeam;
    this.strAwayTeam = data.strAwayTeam;
    this.intHomeScore = data.intHomeScore;
    this.intAwayScore = data.intAwayScore;

    this.strTime = data.strTime || "";
    this.strLeague = data.strLeague || "";
    this.strSeason = data.strSeason || "";
    this.strVenue = data.strVenue || "";
    this.strCity = data.strCity || "";
    this.strCountry = data.strCountry || "";
    this.strStatus = data.strStatus || "";
    this.strThumb = data.strThumb || "";
  }
  getDataFormattata() {
    if (!this.dateEvent) return "Data da definire";
    const d = new Date(this.dateEvent);
    const giorno = String(d.getDate()).padStart(2, "0");
    const mese = String(d.getMonth() + 1).padStart(2, "0");
    const anno = d.getFullYear();
    return `${giorno}/${mese}/${anno}`;
  }
  getOrarioFormattato() {
    if (!this.strTime) return "Orario da definire";
    return this.strTime.slice(0, 5);
  }
  getPunteggio() {
    if (this.intHomeScore !== null && this.intAwayScore !== null) {
      return `${this.intHomeScore} - ${this.intAwayScore}`;
    }
    return null;
  }
}

export async function fetchSquadreByNome(query, signal) {
  const url = new URL(`${API_BASE}/searchteams.php`);
  url.searchParams.set("t", query);

  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error("Errore di rete durante la ricerca.");

  const data = await response.json();
  if (!data.teams) return [];

  return data.teams.map((t) => new Squadra(t));
}

const cacheEventiSquadra = new Map();

export async function fetchEventiSquadra(idTeam) {
  if (cacheEventiSquadra.has(idTeam)) {
    return cacheEventiSquadra.get(idTeam);
  }

  const urlNext = new URL(`${API_BASE}/eventsnext.php`);
  urlNext.searchParams.set("id", idTeam);

  const urlLast = new URL(`${API_BASE}/eventslast.php`);
  urlLast.searchParams.set("id", idTeam);

  const resNext = await fetch(urlNext);
  await new Promise((resolve) => setTimeout(resolve, 350));
  const resLast = await fetch(urlLast);

  if (!resNext.ok || !resLast.ok)
    throw new Error("Errore nel caricamento degli eventi.");

  const [dataNext, dataLast] = await Promise.all([
    resNext.json(),
    resLast.json(),
  ]);
  const prossimi = (dataNext.events || []).map((e) => new Evento(e));
  const ultimi = (dataLast.results || []).map((e) => new Evento(e));

  const risultato = { prossimi, ultimi };
  cacheEventiSquadra.set(idTeam, risultato);
  return risultato;
}

export async function fetchProssimiEventiPreferite(preferiti) {
  if (!preferiti || preferiti.length === 0) return [];

  const richieste = preferiti.map(async (squadra, index) => {
    await new Promise((resolve) => setTimeout(resolve, index * 500));
    const url = new URL(`${API_BASE}/eventsnext.php`);
    url.searchParams.set("id", squadra.idTeam);
    const res = await fetch(url);
    if (!res.ok)
      throw new Error(`Errore caricamento eventi per ${squadra.strTeam}`);
    const data = await res.json();
    return (data.events || []).map((e) => new Evento(e));
  });

  const risultati = await Promise.allSettled(richieste);
  const eventiUniti = [];
  const idsVisti = new Set();

  risultati.forEach((risultato) => {
    if (risultato.status === "fulfilled") {
      risultato.value.forEach((evento) => {
        if (!idsVisti.has(evento.idEvent)) {
          idsVisti.add(evento.idEvent);
          eventiUniti.push(evento);
        }
      });
    }
  });

  eventiUniti.sort((a, b) => {
    const dataA = `${a.dateEvent || "9999-12-31"} ${a.strTime || "23:59:59"}`;
    const dataB = `${b.dateEvent || "9999-12-31"} ${b.strTime || "23:59:59"}`;
    return dataA.localeCompare(dataB);
  });

  return eventiUniti;
}
