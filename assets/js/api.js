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

export class Giocatore {
  constructor(data, stats = {}) {
    this.idPlayer = data.idPlayer;
    this.nome = data.strPlayer || "Sconosciuto";
    this.ruolo = data.strPosition || "";
    this.numero = data.strNumber || "-";
    this.partite = stats.partite ?? "-";
    this.gol = stats.gol ?? "-";
    this.assist = stats.assist ?? "-";
    this.gialli = stats.gialli ?? "-";
    this.rossi = stats.rossi ?? "-";
  }
}

const cacheRosaSquadra = new Map();

async function parseJsonSicuro(response) {
  if (!response.ok) {
    throw new Error(`Errore HTTP ${response.status}`);
  }
  const text = await response.text();
  if (!text || text.trim() === "") {
    return null;
  }
  return JSON.parse(text);
}

export async function fetchRosaSquadra(squadra) {
  if (cacheRosaSquadra.has(squadra.idTeam)) {
    return cacheRosaSquadra.get(squadra.idTeam);
  }

  const urlById = new URL(`${API_BASE}/lookup_all_players.php`);
  urlById.searchParams.set("id", squadra.idTeam);

  const resById = await fetch(urlById);
  const dataById = await parseJsonSicuro(resById);
  let listaRaw = dataById && dataById.player ? dataById.player : [];

  if (listaRaw.length === 0) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const urlByName = new URL(`${API_BASE}/searchplayers.php`);
    urlByName.searchParams.set("t", squadra.strTeam);

    const resByName = await fetch(urlByName);
    const dataByName = await parseJsonSicuro(resByName);
    const trovati = dataByName && dataByName.player ? dataByName.player : [];
    const filtrati = trovati.filter((p) => p.idTeam === squadra.idTeam);
    listaRaw = filtrati.length > 0 ? filtrati : trovati;
  }

  const rosa = [];
  for (let i = 0; i < listaRaw.length; i++) {
    const p = listaRaw[i];
    let stats = { partite: "-", gol: "-", assist: "-", gialli: "-", rossi: "-" };

    try {
      stats = await fetchStatsSingoloGiocatore(p.idPlayer);
    } catch {
    }
    rosa.push(new Giocatore(p, stats));

    if (i < listaRaw.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  cacheRosaSquadra.set(squadra.idTeam, rosa);
  return rosa;
}

export async function fetchStatsSingoloGiocatore(idPlayer) {
  const url = new URL(`${API_BASE}/lookupplayerstats.php`);
  url.searchParams.set("id", idPlayer);

  const response = await fetch(url);
  const data = await parseJsonSicuro(response);
  const stats = data && data.playerstats ? data.playerstats : [];

  if (stats.length === 0) {
    return {
      partite: "N/D",
      gol: "N/D",
      assist: "N/D",
      gialli: "N/D",
      rossi: "N/D",
    };
  }

  const sommaStat = (nomi) => {
    let totale = 0;
    for (let i = 0; i < stats.length; i++) {
      if (nomi.includes(stats[i].strStatistic)) {
        totale += Number(stats[i].strValue) || 0;
      }
    }
    return totale;
  };

  return {
    partite: sommaStat(["Appearances", "Games Played", "Caps"]),
    gol: sommaStat(["Goals"]),
    assist: sommaStat(["Assists"]),
    gialli: sommaStat(["Yellow Cards"]),
    rossi: sommaStat(["Red Cards"]),
  };
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
    await new Promise((resolve) => setTimeout(resolve, index * 1200));
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
